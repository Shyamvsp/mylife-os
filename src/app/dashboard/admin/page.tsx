"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  Copy,
  Check,
  QrCode,
  Share2,
  RefreshCw,
  Users,
  Lock,
  Mail,
  User,
  Sparkles,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  UserCheck,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";

interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  last_sign_in_at?: string;
  status: string;
  is_subscribed: boolean;
  days_left: number;
}

interface PaymentRequest {
  id: string;
  user_id: string;
  utr: string;
  user_email: string;
  user_name: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  submitted_at: string;
}

interface TrialRequest {
  id: string;
  email: string;
  name: string;
  password?: string;
  note: string;
  status: "pending" | "approved" | "declined";
  created_at: string;
}

const ADMIN_EMAILS = [
  "dasapallivenkatshyamprasad@gmail.com",
  "shyamvsp@mylife.local",
];

export default function AdminPage() {
  const supabase = useMemo(() => createClient(), []);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Payment Requests State
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [paymentNotice, setPaymentNotice] = useState("");

  // 7-Day Trial Requests State
  const [trialRequests, setTrialRequests] = useState<TrialRequest[]>([]);
  const [loadingTrials, setLoadingTrials] = useState(true);

  // New User Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createdUserNotice, setCreatedUserNotice] = useState<{ email: string; pass: string; name: string } | null>(null);

  // UPI Settings State
  const [upiId, setUpiId] = useState("dasapallivenkatshyamprasad-1@okaxis");
  const [payeeName, setPayeeName] = useState("Venkat Shyam Prasad");
  const [customQrImage, setCustomQrImage] = useState("");
  const [upiNotice, setUpiNotice] = useState("");
  const [copiedBio, setCopiedBio] = useState(false);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  // Check Admin permission
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const admin =
        ADMIN_EMAILS.includes(user.email || "") ||
        user.user_metadata?.role === "admin" ||
        user.user_metadata?.display_name === "shyamvsp";
      setIsAdmin(admin);
    });

    // Load stored UPI settings
    if (typeof window !== "undefined") {
      const storedUpi = localStorage.getItem("mylife_admin_upi_id");
      const storedName = localStorage.getItem("mylife_admin_payee_name");
      const storedQr = localStorage.getItem("mylife_admin_qr_image");
      if (storedUpi) setUpiId(storedUpi);
      if (storedName) setPayeeName(storedName);
      if (storedQr) setCustomQrImage(storedQr);
    }
  }, [supabase]);

  // Fetch Users
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Fetch Payment Requests
  const loadPayments = useCallback(async () => {
    setLoadingPayments(true);
    try {
      const res = await fetch("/api/admin/payments");
      const data = await res.json();
      if (res.ok) {
        setPayments(data.payments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPayments(false);
    }
  }, []);

  // Fetch Trial Requests
  const loadTrialRequests = useCallback(async () => {
    setLoadingTrials(true);
    try {
      const res = await fetch("/api/auth/trial-request");
      const data = await res.json();
      if (res.ok) {
        setTrialRequests(data.requests || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTrials(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      void loadUsers();
      void loadPayments();
      void loadTrialRequests();
    }
  }, [isAdmin, loadUsers, loadPayments, loadTrialRequests]);

  const handleApprovePayment = async (paymentId: string, userId: string, utr: string) => {
    setPaymentNotice("");
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, userId, action: "approve" }),
      });
      const data = await res.json();
      if (res.ok) {
        setPaymentNotice(`✅ Approved! Pro subscription unlocked for UTR: ${utr}`);
        void loadPayments();
        void loadUsers();
      } else {
        alert(data.error || "Failed to approve payment.");
      }
    } catch {
      alert("Network error.");
    }
  };

  const handleRejectPayment = async (
    paymentId: string,
    userId: string,
    utr: string,
    reasonType: "lower_amount" | "fake_utr"
  ) => {
    const defaultReason =
      reasonType === "lower_amount"
        ? "Transaction rejected: You paid a lower amount (e.g. ₹1) instead of the required ₹29 subscription amount. Please pay the remaining amount or make a valid ₹29 payment."
        : "Transaction rejected: This 12-digit UTR could not be verified in Admin Shyam's bank statement.";

    const customReason = prompt("Rejection Reason to show user:", defaultReason);
    if (!customReason) return;

    setPaymentNotice("");
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          userId,
          action: "reject",
          rejectionReason: customReason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPaymentNotice(`❌ Rejected UTR: ${utr}. User has been notified.`);
        void loadPayments();
        void loadUsers();
      } else {
        alert(data.error || "Failed to reject payment.");
      }
    } catch {
      alert("Network error.");
    }
  };

  const handleAcceptTrial = async (requestId: string, reqEmail: string) => {
    try {
      const res = await fetch("/api/auth/trial-request", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action: "accept" }),
      });
      const data = await res.json();
      if (res.ok) {
        setPaymentNotice(`🎉 7-Day Trial Approved for ${reqEmail}!`);
        if (data.user) {
          setCreatedUserNotice({ email: data.user.email, pass: data.user.password, name: data.user.name });
        }
        void loadTrialRequests();
        void loadUsers();
      } else {
        alert(data.error || "Could not accept trial request.");
      }
    } catch {
      alert("Network error.");
    }
  };

  const handleDeclineTrial = async (requestId: string) => {
    if (!confirm("Decline this 7-day trial request?")) return;
    try {
      const res = await fetch("/api/auth/trial-request", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action: "decline" }),
      });
      if (res.ok) {
        void loadTrialRequests();
      }
    } catch {
      alert("Network error.");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    setCreatedUserNotice(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, isSubscribed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Failed to create user account.");
      } else {
        setCreatedUserNotice({ email, pass: password, name });
        setName("");
        setEmail("");
        setPassword("");
        setIsSubscribed(false);
        void loadUsers();
      }
    } catch {
      setCreateError("Network error while creating account.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to permanently delete account: ${userEmail}?`)) return;

    try {
      const res = await fetch(`/api/admin/users?userId=${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        const data = await res.json();
        alert(data.error || "Could not delete user.");
      }
    } catch {
      alert("Network error.");
    }
  };

  const saveUpiSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("mylife_admin_upi_id", upiId);
      localStorage.setItem("mylife_admin_payee_name", payeeName);
      if (customQrImage) localStorage.setItem("mylife_admin_qr_image", customQrImage);
    }
    setUpiNotice("UPI settings saved successfully! Subscribers will now pay to this QR code.");
    setTimeout(() => setUpiNotice(""), 4000);
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomQrImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const copyCredentialsText = () => {
    if (!createdUserNotice) return;
    const text = `🎉 Welcome to MyLife OS!\n\nHere are your account credentials:\n🔗 Login: ${window.location.origin}/login\n📧 Email: ${createdUserNotice.email}\n🔑 Password: ${createdUserNotice.pass}\n\nYour 7-day free trial has been approved! All 12 apps and the AI Agent are unlocked.`;
    void navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 3000);
  };

  const copyBioText = () => {
    const text = `🚀 Transform your life with MyLife OS! 12 apps in 1 + Antigravity AI Voice Assistant. Try 7 days FREE, then only ₹29/month! Get your account here: ${typeof window !== "undefined" ? window.location.origin : ""}/login`;
    void navigator.clipboard.writeText(text);
    setCopiedBio(true);
    setTimeout(() => setCopiedBio(false), 3000);
  };

  const copyToClipboard = (val: string) => {
    void navigator.clipboard.writeText(val);
    setCopiedUtr(val);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  if (isAdmin === null) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="animate-spin text-indigo-500" size={24} />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="mx-auto max-w-lg p-6 text-center panel space-y-4">
        <ShieldCheck className="mx-auto text-rose-500" size={48} />
        <h2 className="text-xl font-bold">Access Restricted</h2>
        <p className="muted text-sm">
          This hub is exclusively reserved for the Super-Admin owner (Shyam Prasad). If you are a subscriber, explore your 12 applications or visit Subscription.
        </p>
        <Link href="/dashboard" className="btn btn-primary inline-flex">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const pendingPayments = payments.filter((p) => p.status === "pending");
  const pendingTrials = trialRequests.filter((t) => t.status === "pending");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5" style={{ borderColor: "var(--line)" }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-500">
              <ShieldCheck size={14} /> Super-Admin Owner Hub
            </span>
            <span className="text-xs muted">Signed in as Shyam (Owner)</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Admin, Payments & Trial Approvals</h1>
          <p className="muted mt-1 text-sm">Approve 7-day trials, verify ₹29 payments, reject lower/fake amounts, and add accounts.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              void loadUsers();
              void loadPayments();
              void loadTrialRequests();
            }}
            className="btn btn-ghost text-xs"
            title="Refresh data"
          >
            <RefreshCw size={14} className={loadingUsers || loadingPayments || loadingTrials ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={copyBioText} className="btn btn-primary text-xs flex items-center gap-1.5">
            {copiedBio ? <Check size={14} /> : <Share2 size={14} />}
            {copiedBio ? "Bio Link Copied!" : "Copy Instagram Bio"}
          </button>
        </div>
      </div>

      {paymentNotice && (
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-xs font-semibold text-indigo-400">
          {paymentNotice}
        </div>
      )}

      {/* SECTION 1: Incoming 7-Day Free Trial Requests */}
      <div className="panel p-6 space-y-4 border-indigo-500/30 bg-gradient-to-b from-indigo-950/10 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white shadow-md">
              <UserCheck size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Incoming 7-Day Free Trial Requests
                {pendingTrials.length > 0 && (
                  <span className="rounded-full bg-indigo-500 px-2 py-0.5 text-[11px] font-bold text-white animate-pulse">
                    {pendingTrials.length} Pending
                  </span>
                )}
              </h2>
              <p className="muted text-xs">
                When new visitors from other states or your Instagram bio request access, they appear here. Accept to grant their 7-day trial!
              </p>
            </div>
          </div>

          <button onClick={loadTrialRequests} className="btn btn-ghost text-xs font-bold">
            <RefreshCw size={13} className={loadingTrials ? "animate-spin" : ""} /> Check Requests
          </button>
        </div>

        {loadingTrials ? (
          <div className="flex h-24 items-center justify-center">
            <RefreshCw className="animate-spin text-indigo-500" size={20} />
          </div>
        ) : trialRequests.length === 0 ? (
          <div className="p-4 text-center text-xs muted rounded-xl border border-dashed" style={{ borderColor: "var(--line)" }}>
            No pending trial requests. When users sign up on the public login page, their requests will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-gray-400" style={{ borderColor: "var(--line)" }}>
                  <th className="py-2.5 px-3">Applicant Name</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Note / Source</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Approval Action</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--line)" }}>
                {trialRequests.map((t) => (
                  <tr key={t.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <td className="py-3 px-3 font-semibold">{t.name}</td>
                    <td className="py-3 px-3 font-mono text-gray-400">{t.email}</td>
                    <td className="py-3 px-3 text-gray-400">{t.note}</td>
                    <td className="py-3 px-3">
                      {t.status === "approved" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-400">
                          <CheckCircle2 size={12} /> Approved
                        </span>
                      ) : t.status === "declined" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 font-bold text-rose-400">
                          <XCircle size={12} /> Declined
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 font-bold text-amber-400">
                          <Clock size={12} /> Pending Approval
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {t.status === "pending" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleAcceptTrial(t.id, t.email)}
                            className="btn btn-primary !py-1 !px-2.5 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 flex items-center gap-1"
                          >
                            <Check size={13} /> Grant 7-Day Trial
                          </button>
                          <button
                            onClick={() => handleDeclineTrial(t.id)}
                            className="btn btn-ghost !p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                            title="Decline"
                          >
                            <XCircle size={15} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] muted">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: Incoming ₹29 UPI Payment Verifications Queue */}
      <div className="panel p-6 space-y-4 border-emerald-500/30 bg-gradient-to-b from-emerald-950/10 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500 text-white shadow-md">
              <CreditCard size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Incoming UPI Payment Verifications (₹29)
                {pendingPayments.length > 0 && (
                  <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white animate-pulse">
                    {pendingPayments.length} Pending
                  </span>
                )}
              </h2>
              <p className="muted text-xs">
                Check your PhonePe / Google Pay / Bank SMS statement. If you received <strong>₹29</strong>, click Approve. If they paid <strong>₹1</strong> or submitted fake UTR, click Reject!
              </p>
            </div>
          </div>

          <button onClick={loadPayments} className="btn btn-ghost text-xs font-bold">
            <RefreshCw size={13} className={loadingPayments ? "animate-spin" : ""} /> Check for Payments
          </button>
        </div>

        {loadingPayments ? (
          <div className="flex h-32 items-center justify-center">
            <RefreshCw className="animate-spin text-emerald-500" size={20} />
          </div>
        ) : payments.length === 0 ? (
          <div className="p-6 text-center text-xs muted rounded-xl border border-dashed" style={{ borderColor: "var(--line)" }}>
            No payment submissions yet. When users scan your QR code and submit their 12-digit UTR on the subscription page, they will appear here for your verification.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-gray-400" style={{ borderColor: "var(--line)" }}>
                  <th className="py-2.5 px-3">Subscriber</th>
                  <th className="py-2.5 px-3">12-Digit UTR Number</th>
                  <th className="py-2.5 px-3">Required</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--line)" }}>
                {payments.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                      <td className="py-3 px-3">
                        <div className="font-semibold">{p.user_name}</div>
                        <div className="text-[11px] font-mono text-gray-400">{p.user_email}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-indigo-400">
                          <span>{p.utr}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(p.utr)}
                            className="text-gray-400 hover:text-white"
                            title="Copy UTR to search in Bank / GPay"
                          >
                            {copiedUtr === p.utr ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-bold text-emerald-500">₹{p.amount}.00</td>

                      <td className="py-3 px-3">
                        {p.status === "approved" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-bold text-emerald-500">
                            <CheckCircle2 size={12} /> Approved (₹29)
                          </span>
                        ) : p.status === "rejected" ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 font-bold text-rose-500 cursor-help"
                            title={p.rejection_reason || "Rejected"}
                          >
                            <XCircle size={12} /> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 font-bold text-amber-400 animate-pulse">
                            <Clock size={12} /> Pending Verification
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-gray-400">
                        {new Date(p.submitted_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        <div className="text-[10px]">{new Date(p.submitted_at).toLocaleDateString()}</div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        {p.status === "pending" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Approve button */}
                            <button
                              onClick={() => handleApprovePayment(p.id, p.user_id, p.utr)}
                              className="btn btn-primary !py-1 !px-2.5 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 flex items-center gap-1"
                              title="Confirm ₹29 received in your UPI account"
                            >
                              <Check size={13} /> Approve ₹29
                            </button>

                            {/* Reject: Lower Amount (e.g. ₹1) */}
                            <button
                              onClick={() => handleRejectPayment(p.id, p.user_id, p.utr, "lower_amount")}
                              className="btn btn-ghost !py-1 !px-2 text-xs font-bold text-rose-400 hover:bg-rose-500/15 rounded-lg border border-rose-500/30 flex items-center gap-1"
                              title="Reject because user paid ₹1 instead of ₹29"
                            >
                              <AlertTriangle size={13} /> Reject (₹1 Paid)
                            </button>

                            {/* Reject: Fake / Unreceived */}
                            <button
                              onClick={() => handleRejectPayment(p.id, p.user_id, p.utr, "fake_utr")}
                              className="btn btn-ghost !py-1 !px-2 text-xs font-bold text-gray-400 hover:text-rose-400"
                              title="Reject because UTR was not found in statement"
                            >
                              <XCircle size={13} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] muted">Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Add New User Form & UPI QR Settings */}
        <div className="lg:col-span-1 space-y-6">
          <div className="panel p-6 space-y-5">
            <div className="flex items-center gap-2">
              <UserPlus className="text-indigo-500" size={20} />
              <h2 className="text-lg font-bold">Add Client or Friend</h2>
            </div>
            <p className="muted text-xs">
              Instantly create a dedicated login for your client or friend with their Gmail and password. They get their own isolated private database!
            </p>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <label className="block text-xs font-semibold">
                Client Full Name
                <div className="relative mt-1">
                  <User size={15} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Sharma"
                    className="field pl-9 text-sm"
                  />
                </div>
              </label>

              <label className="block text-xs font-semibold">
                Client Gmail / Email Address
                <div className="relative mt-1">
                  <Mail size={15} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@gmail.com"
                    className="field pl-9 text-sm"
                  />
                </div>
              </label>

              <label className="block text-xs font-semibold">
                Password
                <div className="relative mt-1">
                  <Lock size={15} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    required
                    type="password"
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="field pl-9 text-sm"
                  />
                </div>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSubscribed}
                  onChange={(e) => setIsSubscribed(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Grant Lifetime / Pro Access (Skip ₹29 requirement)</span>
              </label>

              {createError && <p className="text-xs text-rose-500 font-semibold">{createError}</p>}

              <button disabled={creating} className="btn btn-primary w-full text-sm font-bold flex items-center justify-center gap-2">
                {creating ? <RefreshCw className="animate-spin" size={16} /> : <UserPlus size={16} />}
                {creating ? "Creating Account..." : "Create Account & Get Login"}
              </button>
            </form>

            {createdUserNotice && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <Check size={16} /> Account Ready to Share!
                </div>
                <div className="text-xs space-y-1 font-mono bg-black/10 dark:bg-black/30 p-2.5 rounded-lg">
                  <div><strong>Email:</strong> {createdUserNotice.email}</div>
                  <div><strong>Password:</strong> {createdUserNotice.pass}</div>
                </div>
                <button
                  onClick={copyCredentialsText}
                  className="btn btn-primary w-full !py-1.5 text-xs flex items-center justify-center gap-1.5"
                >
                  {copiedCreds ? <Check size={13} /> : <Copy size={13} />}
                  {copiedCreds ? "Copied Credentials!" : "Copy Details to Send via WhatsApp/DM"}
                </button>
              </div>
            )}
          </div>

          {/* UPI QR Payment Setup */}
          <div className="panel p-6 space-y-5">
            <div className="flex items-center gap-2">
              <QrCode className="text-emerald-500" size={20} />
              <h2 className="text-lg font-bold">₹29/Month UPI QR Code</h2>
            </div>
            <p className="muted text-xs">
              When users visit the Subscription page to pay ₹29/month, this UPI QR code and ID will be displayed. Payments go straight to your bank account!
            </p>

            <form onSubmit={saveUpiSettings} className="space-y-3">
              <label className="block text-xs font-semibold">
                Your UPI ID (VPA)
                <input
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@okaxis"
                  className="field mt-1 text-sm font-mono"
                />
              </label>

              <label className="block text-xs font-semibold">
                Payee Full Name
                <input
                  required
                  value={payeeName}
                  onChange={(e) => setPayeeName(e.target.value)}
                  placeholder="e.g. Venkat Shyam Prasad"
                  className="field mt-1 text-sm"
                />
              </label>

              <label className="block text-xs font-semibold">
                Upload Custom UPI QR Code Image (Optional)
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQrUpload}
                  className="mt-1 block w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                />
              </label>

              {customQrImage && (
                <div className="mt-2 text-center">
                  <p className="text-[11px] muted mb-1">Custom QR Code Preview:</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={customQrImage} alt="Custom UPI QR" className="mx-auto h-32 w-32 object-contain rounded-lg border p-1" />
                </div>
              )}

              {upiNotice && <p className="text-xs text-emerald-500 font-semibold">{upiNotice}</p>}

              <button type="submit" className="btn btn-primary w-full text-xs font-bold">
                Save Payment Settings
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Registered Users Management Table & Bio Link */}
        <div className="lg:col-span-2 space-y-6">
          <div className="panel p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="text-indigo-500" size={20} />
                <h2 className="text-lg font-bold">Registered Users & Subscriptions</h2>
              </div>
              <span className="text-xs muted font-semibold">{users.length} Total Users</span>
            </div>

            {loadingUsers ? (
              <div className="flex h-48 items-center justify-center">
                <RefreshCw className="animate-spin text-indigo-500" size={20} />
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-xs muted">No users found. Use the form on the left to add your first user.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b text-gray-400" style={{ borderColor: "var(--line)" }}>
                      <th className="py-2.5 px-3">User</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Plan Status</th>
                      <th className="py-2.5 px-3">Joined</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--line)" }}>
                    {users.map((u) => {
                      const isOwner = ADMIN_EMAILS.includes(u.email);

                      return (
                        <tr key={u.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              {u.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={u.avatar_url} alt={u.display_name} className="h-7 w-7 rounded-full object-cover" />
                              ) : (
                                <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-[11px]">
                                  {u.display_name?.[0]?.toUpperCase() || "U"}
                                </div>
                              )}
                              <span className="font-semibold">{u.display_name}</span>
                              {isOwner && (
                                <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-400">
                                  Owner
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-3 font-mono text-gray-400">{u.email}</td>

                          <td className="py-3 px-3">
                            {u.is_subscribed ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-500">
                                <Sparkles size={11} /> Pro (₹29/mo)
                              </span>
                            ) : u.days_left > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 font-bold text-indigo-400">
                                7d Trial ({u.days_left}d left)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 font-bold text-rose-500">
                                Trial Expired
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-gray-400">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>

                          <td className="py-3 px-3 text-right">
                            {!isOwner && (
                              <button
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                className="btn btn-ghost !p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                                title="Delete user"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Instagram & Bio Link Promotion Card */}
          <div className="panel p-6 space-y-3 bg-gradient-to-r from-indigo-900/20 via-purple-900/20 to-pink-900/20 border-indigo-500/30">
            <div className="flex items-center gap-2">
              <Share2 className="text-pink-500" size={20} />
              <h3 className="font-bold text-base">Commercial Link for Instagram Bio</h3>
            </div>
            <p className="muted text-xs leading-relaxed">
              Copy this promotional pitch and link. Paste it directly in your Instagram bio or send it in DMs so users can register, try 7 days free, and pay ₹29/month!
            </p>
            <div className="rounded-xl bg-black/30 p-3 font-mono text-xs text-gray-300">
              🚀 Transform your life with MyLife OS! 12 apps in 1 + AI Voice Assistant. Try 7 days FREE, then only ₹29/month! Get your account: {typeof window !== "undefined" ? window.location.origin : ""}/login
            </div>
            <button onClick={copyBioText} className="btn btn-primary text-xs font-bold flex items-center gap-1.5">
              {copiedBio ? <Check size={14} /> : <Copy size={14} />}
              {copiedBio ? "Copied to Clipboard!" : "Copy Ready-to-Post Bio Text"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}