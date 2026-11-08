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
} from "lucide-react";

interface SubStatus {
  is_subscribed: boolean;
  is_trial_active: boolean;
  days_left: number;
  plan_name: string;
  price_inr: number;
  trial_ends_at: string;
  subscription_status?: "active" | "pending" | "rejected" | "trial" | "expired";
  pending_utr?: string | null;
  rejection_reason?: string | null;
}

export default function SubscriptionPage() {
  const [status, setStatus] = useState<SubStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Payment form state
  const [utr, setUtr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Admin configured UPI details
  const [upiId, setUpiId] = useState("dasapallivenkatshyamprasad-1@okaxis");
  const [payeeName, setPayeeName] = useState("Venkat Shyam Prasad");
  const [adminQrImage, setAdminQrImage] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/subscription");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();

    // Check if admin has set custom UPI credentials in localStorage
    if (typeof window !== "undefined") {
      const storedUpi = localStorage.getItem("mylife_admin_upi_id");
      const storedName = localStorage.getItem("mylife_admin_payee_name");
      const storedQr = localStorage.getItem("mylife_admin_qr_image");
      if (storedUpi) setUpiId(storedUpi);
      if (storedName) setPayeeName(storedName);
      if (storedQr) setAdminQrImage(storedQr);
    }
  }, [fetchStatus]);

  const copyUpiId = () => {
    void navigator.clipboard.writeText(upiId);
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
        body: JSON.stringify({ utr: cleanUtr, upiId }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || "Payment submitted for Admin Shyam's verification.");
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

  // Generate strict UPI URI with minimum amount locked to 29
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payeeName
  )}&am=29.00&mam=29.00&cu=INR&tn=MyLife%20OS%20Pro%20Subscription%20Rs29`;

  // Standard high-quality QR code image URL using QR Server API
  const qrCodeUrl =
    adminQrImage ||
    `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiIntentUri)}`;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-500">
            <Sparkles size={14} /> MyLife OS Membership
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Subscription & Billing</h1>
        <p className="muted mt-1 text-sm">
          Simple, transparent pricing. 7 days free trial, then only ₹29 per month!
        </p>
      </div>

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
                You have full access to all 12 modules, AI Agent, cloud sync, and PWA mobile app for ₹29/month.
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
                Your 12-digit UTR <strong className="font-mono text-white">({status.pending_utr})</strong> has been submitted. Admin Shyam is verifying the ₹29 credit in his UPI statement. Once approved, Pro activates automatically!
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
                {status.rejection_reason || "Transaction rejected: Lower amount received (e.g. ₹1) instead of required ₹29."}
              </p>
              <p className="text-[11px] text-gray-300 mt-1">
                Please make sure to pay the full ₹29 via UPI and enter the genuine 12-digit UTR below.
              </p>
            </div>
          </div>
          <a href="#pay-qr" className="btn btn-primary text-xs font-bold !bg-rose-600 hover:!bg-rose-700 shrink-0">
            Re-submit ₹29 Payment
          </a>
        </div>
      ) : status?.is_trial_active ? (
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
              <Clock size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold">7-Day Free Trial Active</h2>
              <p className="text-xs muted">
                You have <strong className="text-indigo-400">{status.days_left} days remaining</strong> in your 1-week free trial. Upgrade anytime to continue uninterrupted.
              </p>
            </div>
          </div>
          <a href="#pay-qr" className="btn btn-primary text-xs font-bold">
            Upgrade for ₹29/month
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
                Your 7-day trial has concluded. Activate your subscription for ₹29/month below to continue saving your records.
              </p>
            </div>
          </div>
          <a href="#pay-qr" className="btn btn-primary text-xs font-bold !bg-rose-600 hover:!bg-rose-700">
            Activate for ₹29
          </a>
        </div>
      )}

      {/* Pricing Card & Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: The ₹29 Plan Card */}
        <div className="panel p-7 space-y-6 border-indigo-500/30 relative overflow-hidden bg-gradient-to-b from-indigo-950/20 to-transparent">
          <div className="absolute top-0 right-0 rounded-bl-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1.5 text-xs font-bold text-white shadow-md">
            Only ₹1/Day
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">All-Access Pass</span>
            <h3 className="text-2xl font-black mt-1">MyLife OS Pro</h3>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold">₹29</span>
              <span className="text-sm muted">/ month</span>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                1st Week FREE
              </span>
            </div>
            <p className="text-xs muted mt-2">Affordable pricing tailored for students, professionals, and creators in India.</p>
          </div>

          <div className="border-t pt-5 space-y-3" style={{ borderColor: "var(--line)" }}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Everything Included:</h4>
            <ul className="space-y-2.5 text-xs">
              {[
                "All 12 Applications (Study, Fitness, Skills, Expenses, Tasks, etc.)",
                "Antigravity AI Agent with Live Voice Recognition & Auto-Save",
                "12 GPU-Accelerated Animated Themes (RTX 4050 Optimized)",
                "Works seamlessly on Mobile (PWA) & Laptop browsers",
                "Encrypted Personal Cloud Database with Real-time Sync",
                "Selective Read-Only Share Links with 7-Day Expiry",
                "Full JSON Database Backup & Universal Import",
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: UPI Payment QR Box */}
        <div id="pay-qr" className="panel p-7 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="text-emerald-500" size={20} />
              <h3 className="font-bold text-lg">Scan & Pay via UPI</h3>
            </div>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              ₹29.00 Only
            </span>
          </div>

          {/* Strict Amount Warning */}
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-3 flex items-start gap-2.5 text-xs text-amber-300">
            <ShieldAlert size={18} className="shrink-0 text-amber-400 mt-0.5" />
            <div>
              <strong>STRICT AMOUNT POLICY:</strong> You must transfer <strong>exactly ₹29.00</strong>. Transactions with lower amounts (such as ₹1 or ₹5) will be <strong>REJECTED</strong> by Admin verification and will not activate your account.
            </div>
          </div>

          {/* QR Code Canvas / Display */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white text-black shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrCodeUrl}
              alt="UPI Payment QR Code"
              className="h-48 w-48 object-contain"
            />
            <p className="mt-2 text-xs font-bold text-gray-800">Scan using any UPI App for ₹29.00</p>
            <p className="text-[10px] text-gray-500">GPay • PhonePe • Paytm • BHIM • CRED</p>
          </div>

          {/* UPI ID Copy Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="muted font-semibold">UPI ID:</span>
              <span className="font-bold">{payeeName}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border p-2 bg-black/5 dark:bg-black/30 font-mono text-xs">
              <span className="flex-1 truncate">{upiId}</span>
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

          {/* Direct Mobile UPI App Button */}
          <a
            href={upiIntentUri}
            className="btn btn-ghost w-full border text-xs font-bold flex items-center justify-center gap-1.5"
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
              className="btn btn-primary w-full text-xs font-bold flex items-center justify-center gap-2"
            >
              {submitting ? <RefreshCw className="animate-spin" size={14} /> : <Check size={14} />}
              {submitting ? "Submitting for Verification..." : "Submit 12-Digit UTR for ₹29 Verification"}
            </button>
            <p className="text-[11px] muted text-center">
              Admin Shyam verifies received payments against the bank statement. Lower amounts (₹1) will be rejected.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}