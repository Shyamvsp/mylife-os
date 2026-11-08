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

  const payments = (data || []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    utr: row.title,
    user_email: (row.data as Record<string, unknown>)?.user_email || "Unknown",
    user_name: (row.data as Record<string, unknown>)?.user_name || "User",
    amount: (row.data as Record<string, unknown>)?.amount || 29,
    status: (row.data as Record<string, unknown>)?.status || "pending",
    rejection_reason: (row.data as Record<string, unknown>)?.rejection_reason || null,
    submitted_at: (row.data as Record<string, unknown>)?.submitted_at || row.created_at,
  }));

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
    const now = new Date().toISOString();

    // 2. Fetch target user
    const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    const targetUser = userData.user;

    if (action === "approve") {
      // Mark entry as approved
      await supabaseAdmin
        .from("entries")
        .update({
          data: {
            ...currentData,
            status: "approved",
            approved_at: now,
            approved_by: admin.email,
          },
        })
        .eq("id", paymentId);

      // Activate Pro membership in user_metadata
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...targetUser.user_metadata,
          is_subscribed: true,
          subscription_status: "active",
          subscription_paid_at: now,
          subscription_utr: record.title,
          subscription_rejection_reason: null,
        },
      });

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: `Payment of ₹29 for ${targetUser.email} approved! Pro unlocked.` });
    }

    if (action === "reject") {
      const reason =
        rejectionReason ||
        "Payment rejected: Lower amount received (e.g. ₹1) instead of required ₹29 subscription fee.";

      // Mark entry as rejected
      await supabaseAdmin
        .from("entries")
        .update({
          data: {
            ...currentData,
            status: "rejected",
            rejection_reason: reason,
            rejected_at: now,
            rejected_by: admin.email,
          },
        })
        .eq("id", paymentId);

      // Set user_metadata to rejected (not subscribed)
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...targetUser.user_metadata,
          is_subscribed: false,
          subscription_status: "rejected",
          subscription_rejection_reason: reason,
        },
      });

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: `Payment rejected. User notified of lower amount/invalid transaction.` });
    }

    return NextResponse.json({ error: "Invalid action. Use 'approve' or 'reject'" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error processing payment action";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}