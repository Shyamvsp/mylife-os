import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_EMAILS = [
  "dasapallivenkatshyamprasad@gmail.com",
  "shyamvsp@mylife.local",
];

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  const isAdmin =
    ADMIN_EMAILS.includes(user.email || "") ||
    user.user_metadata?.role === "admin" ||
    user.user_metadata?.display_name === "shyamvsp";

  return isAdmin ? user : null;
}

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
  }

  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const users = (data?.users || []).map((u) => {
    const createdAt = new Date(u.created_at);
    const trialDays = 7;
    const trialEnd = new Date(createdAt.getTime() + trialDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    const isSubscribed = Boolean(u.user_metadata?.is_subscribed);
    const isTrialActive = now < trialEnd;
    const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      id: u.id,
      email: u.email,
      display_name: u.user_metadata?.display_name || "User",
      avatar_url: u.user_metadata?.avatar_url || null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      status: isSubscribed ? "Pro (₹29/mo)" : isTrialActive ? `Free Trial (${daysLeft}d left)` : "Trial Expired",
      is_subscribed: isSubscribed,
      days_left: daysLeft,
    };
  });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { email, password, name, isSubscribed } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: password.trim(),
      email_confirm: true,
      user_metadata: {
        display_name: (name || email.split("@")[0]).trim(),
        role: "user",
        is_subscribed: Boolean(isSubscribed),
        trial_ends_at: trialEndsAt,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Auto-create initial profile entry
    if (data.user) {
      await supabaseAdmin.from("profiles").upsert({
        id: data.user.id,
        display_name: (name || email.split("@")[0]).trim(),
        timezone: "Asia/Kolkata",
      });
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error creating user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId query param is required" }, { status: 400 });
    }

    if (userId === admin.id) {
      return NextResponse.json({ error: "Cannot delete the super-admin owner account" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error deleting user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, action, newPassword } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: "userId and action are required" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    if (action === "activate_pro") {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          is_subscribed: true,
          subscription_status: "pro",
        },
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, user: data.user });
    }

    if (action === "extend_trial") {
      const newTrialEnds = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          is_subscribed: false,
          subscription_status: "trial",
          trial_ends_at: newTrialEnds,
        },
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, user: data.user });
    }

    if (action === "reset_password") {
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, user: data.user });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error updating user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
