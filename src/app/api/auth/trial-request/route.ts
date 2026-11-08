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

// GET: Admin fetches pending 7-day trial requests
export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("entries")
    .select("id, title, details, entry_date, data, created_at")
    .eq("module", "_trial_requests")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const requests = (data || []).map((row) => ({
    id: row.id,
    email: row.title,
    name: (row.data as Record<string, unknown>)?.name || "Client",
    password: (row.data as Record<string, unknown>)?.password || "",
    note: row.details || "",
    status: (row.data as Record<string, unknown>)?.status || "pending",
    created_at: row.created_at,
  }));

  return NextResponse.json({ requests });
}

// POST: Public visitor requests a 7-day trial account
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, note, autoApprove } = body;

    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPass = String(password || "").trim();
    const cleanName = String(name || "").trim() || cleanEmail.split("@")[0];

    if (!cleanEmail || !cleanPass) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (cleanPass.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // Check if user already exists
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const existing = (userList?.users || []).find((u) => u.email?.toLowerCase() === cleanEmail);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please Sign In directly." },
        { status: 400 }
      );
    }

    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // If auto-approve is requested/enabled: Create the account immediately!
    if (autoApprove) {
      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: cleanPass,
        email_confirm: true,
        user_metadata: {
          display_name: cleanName,
          role: "user",
          is_subscribed: false,
          subscription_status: "trial",
          trial_ends_at: trialEndsAt,
        },
      });

      if (createErr) {
        return NextResponse.json({ error: createErr.message }, { status: 400 });
      }

      if (newUser.user) {
        await supabaseAdmin.from("profiles").upsert({
          id: newUser.user.id,
          display_name: cleanName,
          timezone: "Asia/Kolkata",
        });
      }

      return NextResponse.json({
        success: true,
        autoApproved: true,
        message: "Your 7-day free trial account is active! You can now Sign In.",
      });
    }

    // Otherwise: Save request for Shyam's approval
    const { error: insertErr } = await supabaseAdmin.from("entries").insert({
      user_id: "46e0f8d4-583f-4404-904d-695774e98755", // Scoped under admin user
      module: "_trial_requests",
      title: cleanEmail,
      details: note || "Requested 7-Day Free Trial",
      entry_date: new Date().toISOString().slice(0, 10),
      data: {
        name: cleanName,
        email: cleanEmail,
        password: cleanPass,
        status: "pending",
        submitted_at: new Date().toISOString(),
      },
      is_archived: false,
    });

    if (insertErr) {
      console.warn("Could not insert trial request:", insertErr);
    }

    return NextResponse.json({
      success: true,
      autoApproved: false,
      message:
        "🎉 Your 7-day trial request has been sent to Admin Shyam! Once Shyam approves your request, you can sign in.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error processing trial request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT: Admin accepts or declines a 7-day trial request
export async function PUT(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { requestId, action } = body;

    if (!requestId || !action) {
      return NextResponse.json({ error: "requestId and action are required" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // 1. Fetch request record
    const { data: record, error: fetchErr } = await supabaseAdmin
      .from("entries")
      .select("id, title, details, data")
      .eq("id", requestId)
      .single();

    if (fetchErr || !record) {
      return NextResponse.json({ error: "Trial request not found" }, { status: 404 });
    }

    const recData = (record.data || {}) as Record<string, unknown>;
    const userEmail = record.title;
    const userName = (recData.name as string) || userEmail.split("@")[0];
    const userPassword = (recData.password as string) || "MyLife@2026";
    const now = new Date().toISOString();

    if (action === "accept") {
      const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Create Auth User
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: userEmail,
        password: userPassword,
        email_confirm: true,
        user_metadata: {
          display_name: userName,
          role: "user",
          is_subscribed: false,
          subscription_status: "trial",
          trial_ends_at: trialEndsAt,
        },
      });

      if (createErr) {
        return NextResponse.json({ error: createErr.message }, { status: 400 });
      }

      if (created.user) {
        await supabaseAdmin.from("profiles").upsert({
          id: created.user.id,
          display_name: userName,
          timezone: "Asia/Kolkata",
        });
      }

      // Mark request as approved
      await supabaseAdmin
        .from("entries")
        .update({
          data: {
            ...recData,
            status: "approved",
            approved_at: now,
            approved_by: admin.email,
          },
        })
        .eq("id", requestId);

      return NextResponse.json({
        success: true,
        message: `7-Day Free Trial approved for ${userEmail}!`,
        user: {
          email: userEmail,
          password: userPassword,
          name: userName,
        },
      });
    }

    if (action === "decline") {
      await supabaseAdmin
        .from("entries")
        .update({
          data: {
            ...recData,
            status: "declined",
            declined_at: now,
            declined_by: admin.email,
          },
        })
        .eq("id", requestId);

      return NextResponse.json({ success: true, message: `Request from ${userEmail} declined.` });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error updating trial request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}