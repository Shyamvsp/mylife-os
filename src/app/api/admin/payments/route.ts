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

// GET /api/admin/payments -> List all payment requests
export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
  }

  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("entries")
    .select("id, user_id, title, details, entry_date, data, created_at")
    .eq("module", "_payment_requests")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const payments = (data || []).map((row) => {
    const rData = (row.data as Record<string, unknown>) || {};
    return {
      id: row.id,
      user_id: row.user_id,
      utr: row.title,
      user_email: rData.user_email || "Unknown",
      user_name: rData.user_name || "User",
      amount: rData.amount || 29,
      plan: rData.plan || "1_month",
      plan_name: rData.plan_name || (rData.amount === 59 ? "3 Months Pro (₹59)" : "1 Month Pro (₹29)"),
      status: rData.status || "pending",
      rejection_reason: rData.rejection_reason || null,
      submitted_at: rData.submitted_at || row.created_at,
    };
  });

  return NextResponse.json({ payments });
}

// POST /api/admin/payments -> Approve or Reject a payment request
export async function POST(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { paymentId, userId, action, rejectionReason } = body;

    if (!paymentId || !userId || !action) {
      return NextResponse.json({ error: "paymentId, userId, and action are required" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // 1. Fetch current payment record
    const { data: record, error: fetchErr } = await supabaseAdmin
      .from("entries")
      .select("id, data, title")
      .eq("id", paymentId)
      .single();

    if (fetchErr || !record) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    const currentData = (record.data || {}) as Record<string, unknown>;
    const now = new Date();
    const nowIso = now.toISOString();

    // 2. Fetch target user
    const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    const targetUser = userData.user;
    const amount = Number(currentData.amount) || 29;
    const isThreeMonths = currentData.plan === "3_months" || amount >= 59;
    const expiryDays = isThreeMonths ? 90 : 30;
    const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000).toISOString();

    if (action === "approve") {
      // Mark entry as approved
      await supabaseAdmin
        .from("entries")
        .update({
          data: {
            ...currentData,
            status: "approved",
            approved_at: nowIso,
            approved_by: admin.email,
            subscription_expires_at: expiresAt,
          },
        })
        .eq("id", paymentId);

      // Activate Pro membership in user_metadata
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...targetUser.user_metadata,
          is_subscribed: true,
          subscription_status: "pro",
          subscription_paid_at: nowIso,
          subscription_expires_at: expiresAt,
          subscription_utr: record.title,
          subscription_amount: amount,
          subscription_plan: isThreeMonths ? "3_months" : "1_month",
          subscription_rejection_reason: null,
        },
      });

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      // Record audit log
      await supabaseAdmin.from("entries").insert({
        user_id: admin.id,
        module: "_audit_logs",
        title: `Approved payment of ₹${amount} for ${targetUser.email}`,
        details: `Plan: ${isThreeMonths ? "3 Months" : "1 Month"} (${expiryDays} days) by Admin ${admin.email}`,
        entry_date: nowIso.slice(0, 10),
        data: { action: "approve_payment", amount, user_email: targetUser.email, utr: record.title },
      });

      return NextResponse.json({
        success: true,
        message: `Payment of ₹${amount} (${isThreeMonths ? "3 Months" : "1 Month"}) for ${targetUser.email} approved! Pro unlocked for ${expiryDays} days.`,
      });
    }

    if (action === "reject") {
      const reason =
        rejectionReason ||
        `Payment rejected: Expected ₹${amount} but received lower amount or unverified UTR.`;

      // Mark entry as rejected
      await supabaseAdmin
        .from("entries")
        .update({
          data: {
            ...currentData,
            status: "rejected",
            rejection_reason: reason,
            rejected_at: nowIso,
            rejected_by: admin.email,
          },
        })
        .eq("id", paymentId);

      // Reset user metadata
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...targetUser.user_metadata,
          is_subscribed: false,
          subscription_status: "rejected",
          subscription_rejection_reason: reason,
        },
      });

      return NextResponse.json({ success: true, message: `Payment for ${targetUser.email} rejected.` });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error processing payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
