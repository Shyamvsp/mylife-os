import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_PRICING, type PricingConfig } from "@/lib/pricing";

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

// GET: Returns current pricing config (publicly readable for subscription page)
export async function GET() {
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
      const merged: PricingConfig = {
        ...DEFAULT_PRICING,
        ...(data.data as Partial<PricingConfig>),
      };
      return NextResponse.json({ pricing: merged });
    }
  } catch {
    // If not set yet, return default
  }

  return NextResponse.json({ pricing: DEFAULT_PRICING });
}

// POST: Admin updates prices, discounts, and promo text
export async function POST(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      monthly_price,
      three_month_price,
      three_month_original_price,
      three_month_discount_tag,
      trial_days,
      upi_id,
      payee_name,
      promo_active,
      promo_text,
    } = body;

    const updatedConfig: PricingConfig = {
      monthly_price: Number(monthly_price) || DEFAULT_PRICING.monthly_price,
      three_month_price: Number(three_month_price) || DEFAULT_PRICING.three_month_price,
      three_month_original_price: Number(three_month_original_price) || DEFAULT_PRICING.three_month_original_price,
      three_month_discount_tag: String(three_month_discount_tag || DEFAULT_PRICING.three_month_discount_tag).trim(),
      trial_days: Number(trial_days) || DEFAULT_PRICING.trial_days,
      upi_id: String(upi_id || DEFAULT_PRICING.upi_id).trim(),
      payee_name: String(payee_name || DEFAULT_PRICING.payee_name).trim(),
      promo_active: Boolean(promo_active),
      promo_text: String(promo_text || DEFAULT_PRICING.promo_text).trim(),
    };

    const supabaseAdmin = createAdminClient();

    // Check if existing record exists
    const { data: existing } = await supabaseAdmin
      .from("entries")
      .select("id")
      .eq("module", "_platform_settings")
      .eq("title", "pricing_config")
      .limit(1);

    if (existing && existing.length > 0) {
      await supabaseAdmin
        .from("entries")
        .update({
          data: updatedConfig,
          details: `Updated by Admin ${admin.email}`,
          entry_date: new Date().toISOString().slice(0, 10),
        })
        .eq("id", existing[0].id);
    } else {
      await supabaseAdmin.from("entries").insert({
        user_id: admin.id,
        module: "_platform_settings",
        title: "pricing_config",
        details: `Initial setup by Admin ${admin.email}`,
        entry_date: new Date().toISOString().slice(0, 10),
        data: updatedConfig,
      });
    }

    return NextResponse.json({ success: true, pricing: updatedConfig });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error updating pricing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
