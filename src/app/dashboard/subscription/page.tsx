"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Check,
  Sparkles,
  QrCode,
  Copy,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Zap,
  XCircle,
  ShieldAlert,
  Flame,
  Tag,
} from "lucide-react";
import { DEFAULT_PRICING, type PricingConfig } from "@/lib/pricing";

interface SubStatus {
  is_subscribed: boolean;
  is_trial_active: boolean;
  days_left: number;
  plan_name: string;
  subscription_status?: "active" | "pending" | "rejected" | "trial" | "expired";
  pending_utr?: string | null;
  pending_amount?: number | null;
  pending_plan?: string | null;
  rejection_reason?: string | null;
  pricing?: PricingConfig;
}

export default function SubscriptionPage() {
  const [status, setStatus] = useState<SubStatus | null>(null);
  const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING);
  const [loading, setLoading] = useState(true);

  // Selected Plan: "1_month" or "3_months"
  const [selectedPlan, setSelectedPlan] = useState<"1_month" | "3_months">("3_months");

  // Payment form state
  const [utr, setUtr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/subscription");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.pricing) {
          setPricing(data.pricing);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  const activeAmount = selectedPlan === "3_months" ? pricing.three_month_price : pricing.monthly_price;
  const planLabel = selectedPlan === "3_months" ? "3 Months Pro (Discounted)" : "1 Month Pro";

  const copyUpiId = () => {
    void navigator.clipboard.writeText(pricing.upi_id);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 3000);
  };

  const handleVerifyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utr.trim();

    // Strict 12-digit numeric validation
    if (!/^\d{12}$/.test(cleanUtr)) {
      setErrorMessage("Invalid UTR: An Indian UPI Reference (UTR) must be exactly 12 numeric digits (e.g. 412345678901).");
      return;
    }

    setSubmitting(true);
    setMessage("");
    setErrorMessage("");

    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utr: cleanUtr,
          upiId: pricing.upi_id,
          plan: selectedPlan,
          amount: activeAmount,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || `Payment for ${planLabel} (₹${activeAmount}) submitted for Admin Shyam's verification.`);
        setUtr("");
        void fetchStatus();
      } else {
        setErrorMessage(data.error || "Could not submit payment verification.");
      }
    } catch {
      setErrorMessage("Network error while submitting payment verification.");
    } finally {
      setSubmitting(false);
    }
  };

  // Generate dynamic UPI URI with selected amount
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(pricing.upi_id)}&pn=${encodeURIComponent(
    pricing.payee_name
  )}&am=${activeAmount}.00&mam=${activeAmount}.00&cu=INR&tn=MyLife%20OS%20Pro%20Rs${activeAmount}%20${encodeURIComponent(
    selectedPlan === "3_months" ? "3Months" : "1Month"
  )}`;

  // Standard high-quality QR code image URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiIntentUri)}`;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Page Title & Promo */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-400">
            <Sparkles size={14} /> MyLife OS Membership
          </span>
          {pricing.promo_active && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-400 animate-pulse">
              <Flame size={13} /> {pricing.three_month_discount_tag}
            </span>
          )}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Subscription & Plans</h1>
        <p className="muted mt-1 text-sm">
          Simple, honest pricing. 7-Day Free Trial, then choose 1 Month (₹{pricing.monthly_price}) or 3 Months for only ₹{pricing.three_month_price} (was ₹{pricing.three_month_original_price})!
        </p>
      </div>

      {/* Promotional Discount Callout Banner */}
      {pricing.promo_active && (
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-orange-950/20 to-transparent p-4 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500 text-black font-extrabold shadow-md">
              <Tag size={20} />
            </div>
            <div>
              <p className="font-bold text-sm text-amber-300">{pricing.promo_text}</p>
              <p className="text-xs text-amber-200/80">Pay ₹{pricing.three_month_price} instead of ₹{pricing.three_month_original_price} — instant 90 days access!</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedPlan("3_months")}
            className="btn btn-primary !py-1.5 !px-3 text-xs font-bold shrink-0 !bg-amber-500 hover:!bg-amber-600 !text-black"
          >
            Claim ₹{pricing.three_month_price} Offer
          </button>
        </div>
      )}

      {/* Subscription Status Banners */}
      {loading ? (
        <div className="panel p-6 flex items-center justify-center">
          <RefreshCw className="animate-spin text-indigo-500" size={20} />
        </div>
      ) : status?.is_subscribed ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-400">Pro Subscription Active</h2>
              <p className="text-xs text-emerald-200/80">
                You have full access to all 12 applications, AI Voice Assistant, cloud storage, and PWA mobile app!
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 text-white px-4 py-2 text-xs font-bold shadow-md shadow-emerald-500/20">
            <Zap size={14} /> Pro Member
          </span>
        </div>
      ) : status?.subscription_status === "pending" ? (
        /* PENDING VERIFICATION BANNER */
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-500/30">
              <Clock size={24} className="animate-spin" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-400">Payment Verification in Progress</h2>
              <p className="text-xs text-amber-200/90 mt-0.5">
                Your 12-digit UTR <strong className="font-mono text-white">({status.pending_utr})</strong> for{" "}
                <strong className="text-white">₹{status.pending_amount || activeAmount}</strong> has been submitted. Admin Shyam is verifying the credit in his UPI statement. Once approved, Pro activates automatically!
              </p>
            </div>
          </div>
          <button
            onClick={() => void fetchStatus()}
            className="btn btn-primary text-xs font-bold !bg-amber-600 hover:!bg-amber-700 flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw size={14} /> Refresh Status
          </button>
        </div>
      ) : status?.subscription_status === "rejected" ? (
        /* REJECTED PAYMENT BANNER */
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-rose-500 text-white shadow-lg shadow-rose-500/30">
              <XCircle size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-rose-400">Payment Verification Rejected</h2>
              <p className="text-xs text-rose-200/90 mt-0.5">
                {status.rejection_reason || "Transaction rejected: Lower amount received (e.g. ₹1) instead of required fee."}
              </p>
              <p className="text-[11px] text-gray-300 mt-1">
                Please make sure to pay the exact amount via UPI and enter the genuine 12-digit UTR below.
              </p>
            </div>
          </div>
          <a href="#pay-qr" className="btn btn-primary text-xs font-bold !bg-rose-600 hover:!bg-rose-700 shrink-0">
            Re-submit Payment
          </a>
        </div>
      ) : status?.is_trial_active ? (
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
              <Clock size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold">{pricing.trial_days}-Day Free Trial Active</h2>
              <p className="text-xs muted">
                You have <strong className="text-indigo-400">{status.days_left} days remaining</strong>. Lock in your discounted plan below anytime!
              </p>
            </div>
          </div>
          <a href="#pay-qr" className="btn btn-primary text-xs font-bold">
            Choose Plan Below
          </a>
        </div>
      ) : (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-rose-500 text-white shadow-lg shadow-rose-500/30">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-rose-400">Free Trial Expired</h2>
              <p className="text-xs text-rose-200/80">
                Your trial has concluded. Activate your subscription below to continue saving your records across all 12 apps.
              </p>
            </div>
          </div>
          <a href="#pay-qr" className="btn btn-primary text-xs font-bold !bg-rose-600 hover:!bg-rose-700">
            Activate Pro
          </a>
        </div>
      )}

      {/* Plan Selection Cards */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <span>Choose Your Plan:</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Plan Option 1: 1 Month */}
          <div
            onClick={() => setSelectedPlan("1_month")}
            className={`cursor-pointer rounded-2xl border p-5 transition relative ${
              selectedPlan === "1_month"
                ? "bg-indigo-600/15 border-indigo-500 ring-2 ring-indigo-500 shadow-lg"
                : "bg-white/5 border-white/10 hover:border-indigo-500/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-base">1 Month Pro</span>
              <input
                type="radio"
                name="plan"
                checked={selectedPlan === "1_month"}
                onChange={() => setSelectedPlan("1_month")}
                className="h-4 w-4 text-indigo-600"
              />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-white">₹{pricing.monthly_price}</span>
              <span className="text-xs text-gray-400">/ 30 days</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Standard monthly subscription. ₹1 per day.</p>
          </div>

          {/* Plan Option 2: 3 Months Special Discount (RECOMMENDED) */}
          <div
            onClick={() => setSelectedPlan("3_months")}
            className={`cursor-pointer rounded-2xl border p-5 transition relative overflow-hidden ${
              selectedPlan === "3_months"
                ? "bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-slate-900 border-indigo-500 ring-2 ring-indigo-500 shadow-xl"
                : "bg-white/5 border-white/10 hover:border-indigo-500/40"
            }`}
          >
            <div className="absolute top-0 right-0 rounded-bl-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-0.5 text-[10px] font-extrabold text-black shadow-md">
              BEST VALUE · {pricing.three_month_discount_tag}
            </div>

            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-amber-300">3 Months Pro</span>
                <span className="rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold px-1.5 py-0.2">
                  Special
                </span>
              </div>
              <input
                type="radio"
                name="plan"
                checked={selectedPlan === "3_months"}
                onChange={() => setSelectedPlan("3_months")}
                className="h-4 w-4 text-indigo-600"
              />
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-400">₹{pricing.three_month_price}</span>
              <span className="text-sm line-through text-gray-500">₹{pricing.three_month_original_price}</span>
              <span className="text-xs font-semibold text-emerald-300">for 90 days</span>
            </div>

            <p className="text-xs text-amber-200/80 mt-1 font-medium">
              Only ₹{Math.round(pricing.three_month_price / 3)}/month. Save ₹{pricing.three_month_original_price - pricing.three_month_price} compared to monthly!
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Features & UPI QR Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: What is Included */}
        <div className="panel p-7 space-y-6 border-indigo-500/20 bg-gradient-to-b from-indigo-950/20 to-transparent">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Everything Included</span>
            <h3 className="text-2xl font-black mt-1">MyLife OS Full Suite</h3>
            <p className="text-xs muted mt-1">One price unlocks all current and upcoming features.</p>
          </div>

          <div className="border-t pt-4 space-y-3" style={{ borderColor: "var(--line)" }}>
            <ul className="space-y-2.5 text-xs">
              {[
                "All 12 Applications (Study, Fitness, Skills, Expenses, Tasks, etc.)",
                "Antigravity AI Agent with Live Voice Recognition & Auto-Save",
                "12 GPU-Accelerated Dynamic Animated Themes",
                "Works seamlessly on Mobile (PWA) & Laptop browsers",
                "Encrypted Personal Cloud Database with Real-time Sync",
                "Selective Read-Only Share Links with Expiry",
                "Full JSON Database Backup & Universal Import",
                "Priority Support from Admin Shyam",
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: Dynamic UPI Payment QR Box */}
        <div id="pay-qr" className="panel p-7 space-y-5 border-emerald-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="text-emerald-500" size={20} />
              <h3 className="font-bold text-lg">Scan & Pay via UPI</h3>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full">
              ₹{activeAmount}.00 ({selectedPlan === "3_months" ? "3 Months" : "1 Month"})
            </span>
          </div>

          {/* Strict Amount Policy Warning */}
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-3 flex items-start gap-2.5 text-xs text-amber-300">
            <ShieldAlert size={18} className="shrink-0 text-amber-400 mt-0.5" />
            <div>
              <strong>STRICT AMOUNT POLICY:</strong> You must transfer <strong>exactly ₹{activeAmount}.00</strong>. Transactions with lower amounts (e.g. ₹1) will be <strong>REJECTED</strong> by Admin verification.
            </div>
          </div>

          {/* QR Code Canvas */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white text-black shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrCodeUrl}
              alt="UPI Payment QR Code"
              className="h-48 w-48 object-contain"
            />
            <p className="mt-2 text-xs font-bold text-gray-800">
              Scan using any UPI App for ₹{activeAmount}.00 ({selectedPlan === "3_months" ? "3-Month Plan" : "1-Month Plan"})
            </p>
            <p className="text-[10px] text-gray-500">GPay • PhonePe • Paytm • BHIM • CRED</p>
          </div>

          {/* UPI ID Copy Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="muted font-semibold">UPI ID:</span>
              <span className="font-bold">{pricing.payee_name}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border p-2 bg-black/5 dark:bg-black/30 font-mono text-xs">
              <span className="flex-1 truncate">{pricing.upi_id}</span>
              <button
                type="button"
                onClick={copyUpiId}
                className="btn btn-ghost !p-1.5 text-xs flex items-center gap-1 font-sans"
              >
                {copiedUpi ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                {copiedUpi ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* Direct Mobile UPI Intent Button */}
          <a
            href={upiIntentUri}
            className="btn btn-ghost w-full border text-xs font-bold flex items-center justify-center gap-1.5 text-indigo-400 hover:text-white"
            style={{ borderColor: "var(--line)" }}
          >
            <ExternalLink size={14} /> Open in UPI App (Mobile only)
          </a>

          {/* UTR Verification Form */}
          <form onSubmit={handleVerifyPayment} className="border-t pt-5 space-y-3" style={{ borderColor: "var(--line)" }}>
            <label className="block text-xs font-semibold">
              Enter 12-Digit UTR / Transaction Reference ID:
              <input
                required
                type="text"
                pattern="\d{12}"
                maxLength={12}
                value={utr}
                onChange={(e) => setUtr(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 412398475920 (12 digits)"
                className="field mt-1 text-sm font-mono tracking-wider"
              />
            </label>

            {message && <p className="text-xs text-emerald-500 font-semibold">{message}</p>}
            {errorMessage && <p className="text-xs text-rose-500 font-semibold">{errorMessage}</p>}

            <button
              disabled={submitting || utr.length !== 12}
              className="btn btn-primary w-full text-xs font-bold flex items-center justify-center gap-2 !bg-emerald-600 hover:!bg-emerald-500"
            >
              {submitting ? <RefreshCw className="animate-spin" size={14} /> : <Check size={14} />}
              {submitting
                ? "Submitting for Verification..."
                : `Submit 12-Digit UTR for ₹${activeAmount} Verification (${selectedPlan === "3_months" ? "3 Months" : "1 Month"})`}
            </button>
            <p className="text-[11px] muted text-center">
              Admin Shyam verifies payments against his bank statement. Lower amounts will be rejected.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
