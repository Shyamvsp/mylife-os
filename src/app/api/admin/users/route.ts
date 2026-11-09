import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const OWNER_EMAILS = [
  "dasapallivenkatshyamprasad@gmail.com",
  "shyamvsp@mylife.local",
];

async function verifyAdminOrOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  const isOwner = OWNER_EMAILS.includes(user.email || "");
  const role = isOwner
    ? "owner"
    : (user.user_metadata?.role as string) || (user.user_metadata?.display_name === "shyamvsp" ? "admin" : "customer");

  const isPrivileged = isOwner || role === "admin" || role === "moderator";

  return isPrivileged ? { user, isOwner, role } : null;
}

export async function GET() {
  const authState = await verifyAdminOrOwner();
  if (!authState) {
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

    const isOwner = OWNER_EMAILS.includes(u.email || "");
    const rawRole = (u.user_metadata?.role as string) || (u.user_metadata?.display_name === "shyamvsp" ? "admin" : "customer");
    const role = isOwner ? "owner" : rawRole === "admin" ? "admin" : rawRole === "moderator" ? "moderator" : "customer";

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
      role,
      is_owner: isOwner,
    };
  });

  return NextResponse.json({ users, viewer_is_owner: authState.isOwner, viewer_role: authState.role });
}

export async function POST(request: Request) {
  const authState = await verifyAdminOrOwner();
  if (!authState) {
    return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { email, password, name, isSubscribed, role } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const assignedRole = authState.isOwner && role ? role : "customer";
    const supabaseAdmin = createAdminClient();
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: password.trim(),
      email_confirm: true,
      user_metadata: {
        display_name: (name || email.split("@")[0]).trim(),
        role: assignedRole,
        is_subscribed: Boolean(isSubscribed),
        trial_ends_at: trialEndsAt,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data.user) {
      await supabaseAdmin.from("profiles").upsert({
        id: data.user.id,
        display_name: (name || email.split("@")[0]).trim(),
        timezone: "Asia/Kolkata",
      });

      // Audit Log
      await supabaseAdmin.from("entries").insert({
        user_id: authState.user.id,
        module: "_audit_logs",
        title: `Created user ${email} with role ${assignedRole}`,
        details: `Created by ${authState.user.email} (${authState.role})`,
        entry_date: new Date().toISOString().slice(0, 10),
        data: { action: "create_user", target_email: email, role: assignedRole },
      });
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error creating user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authState = await verifyAdminOrOwner();
  if (!authState) {
    return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId query param is required" }, { status: 400 });
    }

    if (userId === authState.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (targetUser?.user?.email && OWNER_EMAILS.includes(targetUser.user.email)) {
      return NextResponse.json({ error: "The Owner account cannot be deleted" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Audit Log
    await supabaseAdmin.from("entries").insert({
      user_id: authState.user.id,
      module: "_audit_logs",
      title: `Deleted user ${targetUser?.user?.email || userId}`,
      details: `Action performed by ${authState.user.email}`,
      entry_date: new Date().toISOString().slice(0, 10),
      data: { action: "delete_user", target_id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error deleting user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const authState = await verifyAdminOrOwner();
  if (!authState) {
    return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, action, newPassword, newRole } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: "userId and action are required" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    const targetEmail = targetUser?.user?.email || "";

    if (OWNER_EMAILS.includes(targetEmail)) {
      return NextResponse.json({ error: "Owner privileges cannot be modified" }, { status: 400 });
    }

    if (action === "change_role") {
      if (!authState.isOwner) {
        return NextResponse.json({ error: "Only the Owner (Shyam Prasad) can promote or demote roles" }, { status: 403 });
      }
      if (!["admin", "moderator", "customer"].includes(newRole)) {
        return NextResponse.json({ error: "Invalid role. Must be admin, moderator, or customer" }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...targetUser?.user?.user_metadata,
          role: newRole,
        },
      });

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      // Audit Log
      await supabaseAdmin.from("entries").insert({
        user_id: authState.user.id,
        module: "_audit_logs",
        title: `Changed role of ${targetEmail} to ${newRole}`,
        details: `Updated by Owner ${authState.user.email}`,
        entry_date: new Date().toISOString().slice(0, 10),
        data: { action: "change_role", target_email: targetEmail, new_role: newRole },
      });

      return NextResponse.json({ success: true, user: data.user });
    }

    if (action === "activate_pro") {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...targetUser?.user?.user_metadata,
          is_subscribed: true,
          subscription_status: "pro",
        },
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      // Audit Log
      await supabaseAdmin.from("entries").insert({
        user_id: authState.user.id,
        module: "_audit_logs",
        title: `Activated Pro (₹29) for ${targetEmail}`,
        details: `Approved by ${authState.user.email}`,
        entry_date: new Date().toISOString().slice(0, 10),
        data: { action: "activate_pro", target_email: targetEmail },
      });

      return NextResponse.json({ success: true, user: data.user });
    }

    if (action === "extend_trial") {
      const newTrialEnds = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...targetUser?.user?.user_metadata,
          is_subscribed: false,
          subscription_status: "trial",
          trial_ends_at: newTrialEnds,
        },
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      // Audit Log
      await supabaseAdmin.from("entries").insert({
        user_id: authState.user.id,
        module: "_audit_logs",
        title: `Extended 7-Day trial for ${targetEmail}`,
        details: `Action by ${authState.user.email}`,
        entry_date: new Date().toISOString().slice(0, 10),
        data: { action: "extend_trial", target_email: targetEmail },
      });

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

      // Audit Log
      await supabaseAdmin.from("entries").insert({
        user_id: authState.user.id,
        module: "_audit_logs",
        title: `Reset password for ${targetEmail}`,
        details: `Action by ${authState.user.email}`,
        entry_date: new Date().toISOString().slice(0, 10),
        data: { action: "reset_password", target_email: targetEmail },
      });

      return NextResponse.json({ success: true, user: data.user });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error updating user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
