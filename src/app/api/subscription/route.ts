import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_PRICING, type PricingConfig } from "@/lib/pricing";

async function getActivePricing(): Promise<PricingConfig> {
  try {
    const supabaseAdmin = createAdminClient();
    const { data } = await supabaseAdmin
      .from("entries")
      .select("data")
      .eq("module", "_platform_settings")
      .eq("title", "pricing_config")
      .limit(1)
      .single();

    if (data?.data && typeof data.data === "object") {
      return {
        ...DEFAULT_PRICING,
        ...(data.data as Partial<PricingConfig>),
      };
    }
  } catch {
    // fallback
  }
  return DEFAULT_PRICING;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pricing = await getActivePricing();

  const createdAt = new Date(user.created_at);
  const trialDays = pricing.trial_days || 7;
  const trialEnd = new Date(createdAt.getTime() + trialDays * 24 * 60 * 60 * 1000);
  const now = new Date();
  const isSubscribed = Boolean(user.user_metadata?.is_subscribed);
  const isTrialActive = now < trialEnd;
  const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const subscriptionStatus =
    user.user_metadata?.subscription_status || (isSubscribed ? "active" : isTrialActive ? "trial" : "expired");
  const pendingUtr = user.user_metadata?.subscription_utr || null;
  const pendingAmount = user.user_metadata?.subscription_amount || null;
  const pendingPlan = user.user_metadata?.subscription_plan || null;
  const rejectionReason = user.user_metadata?.subscription_rejection_reason || null;

  return NextResponse.json({
    is_subscribed: isSubscribed,
    is_trial_active: isTrialActive,
    days_left: daysLeft,
    plan_name: isSubscribed ? "Pro Subscription" : isTrialActive ? `${trialDays}-Day Free Trial` : "Trial Expired",
    subscription_status: subscriptionStatus,
    pending_utr: pendingUtr,
    pending_amount: pendingAmount,
    pending_plan: pendingPlan,
    rejection_reason: rejectionReason,
    pricing,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { utr, upiId, plan, amount } = body;
    const cleanUtr = String(utr || "").trim();

    // 1. Strict 12-digit numeric validation for Indian UPI transactions
    if (!/^\d{12}$/.test(cleanUtr)) {
      return NextResponse.json(
        {
          error:
            "Invalid UPI UTR format. A genuine Indian banking UPI Reference (UTR) must be exactly 12 numeric digits (e.g. 412345678901).",
        },
        { status: 400 }
      );
    }

    const pricing = await getActivePricing();
    const chosenPlan = plan === "3_months" ? "3_months" : "1_month";
    const expectedAmount = chosenPlan === "3_months" ? pricing.three_month_price : pricing.monthly_price;
    const submittedAmount = Number(amount) || expectedAmount;

    const supabaseAdmin = createAdminClient();
    const now = new Date().toISOString();
    const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "User";

    // 2. Fraud prevention: Check if this 12-digit UTR was already submitted and approved
    const { data: existingRecords } = await supabaseAdmin
      .from("entries")
      .select("id, user_id, data")
      .eq("module", "_payment_requests")
      .eq("title", cleanUtr);

    if (existingRecords && existingRecords.length > 0) {
      const alreadyApproved = existingRecords.some(
        (r) => (r.data as Record<string, unknown>)?.status === "approved"
      );
      if (alreadyApproved) {
        return NextResponse.json(
          {
            error:
              "Fraud Alert: This 12-digit UTR has already been claimed and approved by another account. Re-using transactions is strictly prohibited.",
          },
          { status: 400 }
        );
      }
    }

    const planTitle = chosenPlan === "3_months" ? `3 Months Special (₹${submittedAmount})` : `1 Month (₹${submittedAmount})`;

    // 3. Record payment request in database
    await supabaseAdmin.from("entries").insert({
      user_id: user.id,
      module: "_payment_requests",
      title: cleanUtr,
      details: `Payment verification request of ₹${submittedAmount} for ${planTitle} by ${user.email} (${displayName})`,
      entry_date: new Date().toISOString().slice(0, 10),
      data: {
        utr: cleanUtr,
        amount: submittedAmount,
        plan: chosenPlan,
        plan_name: planTitle,
        user_email: user.email,
        user_name: displayName,
        upi_payee: upiId || pricing.upi_id,
        status: "pending",
        submitted_at: now,
        rejection_reason: null,
      },
      is_archived: false,
    });

    // 4. Update user metadata
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        is_subscribed: false,
        subscription_status: "pending",
        subscription_utr: cleanUtr,
        subscription_amount: submittedAmount,
        subscription_plan: chosenPlan,
        subscription_rejection_reason: null,
        subscription_submitted_at: now,
      },
    });

    return NextResponse.json({
      success: true,
      status: "pending",
      message: `₹${submittedAmount} (${planTitle}) payment submitted for Admin Shyam's verification! Once Admin Shyam verifies the credit in his UPI statement, your Pro membership will activate automatically.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error submitting payment verification";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
