"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  LockKeyhole,
  Sparkles,
  User,
  Mail,
  Lock,
  Clock,
  MessageCircle,
  ChevronRight,
  Download,
} from "lucide-react";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "trial">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [requestedEmail, setRequestedEmail] = useState("");
  const router = useRouter();

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const supabase = createClient();
      const result = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (result.error) {
        setMessage(result.error.message);
        setBusy(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setMessage("Failed to sign in. Please verify your connection.");
      setBusy(false);
    }
  }

  async function handleTrialRequest(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setIsSuccess(false);

    try {
      const res = await fetch("/api/auth/trial-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          note: note.trim(),
          autoApprove: true, // Auto-approves so users get instant 7-day access!
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Could not submit trial request.");
        setBusy(false);
        return;
      }

      setIsSuccess(true);
      setRequestedEmail(email);
      setMessage(data.message || "7-Day Free Trial activated! You can now sign in.");

      // Automatically sign in the user
      const supabase = createClient();
      const loginRes = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (!loginRes.error) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setMode("login");
      }
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center p-4 sm:p-6 bg-gradient-to-tr from-slate-950 via-indigo-950/20 to-slate-950">
      <div className="panel w-full max-w-md p-6 sm:p-8 shadow-2xl border border-indigo-500/20">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
            <Sparkles size={28} />
          </div>
          <h1 className="text-3xl font-black tracking-tight">MyLife OS</h1>
          <p className="muted mt-1 text-xs sm:text-sm">
            12 Enterprise Apps in One • Antigravity AI Voice Assistant
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
            <Clock size={13} /> 7 Days Free Trial • Then ₹29/Month
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mb-6 flex rounded-xl p-1 bg-black/20 dark:bg-black/40 border border-white/5">
          <button
            type="button"
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
              mode === "login" ? "bg-indigo-600 text-white shadow-md" : "text-gray-400 hover:text-white"
            }`}
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
              mode === "trial" ? "bg-indigo-600 text-white shadow-md" : "text-gray-400 hover:text-white"
            }`}
            onClick={() => {
              setMode("trial");
              setMessage("");
            }}
          >
            Request 7-Day Trial
          </button>
        </div>

        {/* SIGN IN FORM */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block text-xs font-semibold">
              Email Address
              <div className="relative mt-1">
                <Mail size={15} className="absolute left-3 top-3 text-gray-400" />
                <input
                  className="field pl-9 text-sm"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="yourname@gmail.com"
                />
              </div>
            </label>

            <label className="block text-xs font-semibold">
              Password
              <div className="relative mt-1">
                <Lock size={15} className="absolute left-3 top-3 text-gray-400" />
                <input
                  className="field pl-9 text-sm"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>
            </label>

            {message && (
              <p className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs font-semibold text-rose-400">
                {message}
              </p>
            )}

            <button
              className="btn btn-primary w-full text-sm font-bold flex items-center justify-center gap-2 py-3"
              disabled={busy}
            >
              {busy ? "Signing in..." : "Sign in to Dashboard"}
              <LockKeyhole size={16} />
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode("trial")}
                className="text-xs text-indigo-400 hover:underline inline-flex items-center gap-1"
              >
                Don&apos;t have an account? Start 7-day free trial <ChevronRight size={13} />
              </button>
            </div>
          </form>
        )}

        {/* 7-DAY FREE TRIAL REQUEST FORM */}
        {mode === "trial" && (
          <form onSubmit={handleTrialRequest} className="space-y-4">
            <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-3 text-xs text-indigo-300">
              🎁 <strong>Instant 7-Day Access:</strong> Fill in your details below to activate your isolated private personal database and AI voice agent for 7 days free!
            </div>

            <label className="block text-xs font-semibold">
              Your Full Name
              <div className="relative mt-1">
                <User size={15} className="absolute left-3 top-3 text-gray-400" />
                <input
                  className="field pl-9 text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Shyam Prasad"
                />
              </div>
            </label>

            <label className="block text-xs font-semibold">
              Your Gmail / Email Address
              <div className="relative mt-1">
                <Mail size={15} className="absolute left-3 top-3 text-gray-400" />
                <input
                  className="field pl-9 text-sm"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="yourname@gmail.com"
                />
              </div>
            </label>

            <label className="block text-xs font-semibold">
              Create a Password (min 6 characters)
              <div className="relative mt-1">
                <Lock size={15} className="absolute left-3 top-3 text-gray-400" />
                <input
                  className="field pl-9 text-sm"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                />
              </div>
            </label>

            <label className="block text-xs font-semibold">
              City / State / Note (Optional)
              <input
                className="field mt-1 text-sm"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Friend from Bangalore / Instagram Bio"
              />
            </label>

            {message && (
              <p
                className={`rounded-xl p-3 text-xs font-semibold border ${
                  isSuccess
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                }`}
              >
                {message}
              </p>
            )}

            <button
              className="btn btn-primary w-full text-sm font-bold flex items-center justify-center gap-2 py-3 !bg-gradient-to-r from-emerald-600 to-indigo-600"
              disabled={busy}
            >
              {busy ? "Activating 7-Day Trial..." : "Start 7-Day Free Trial"}
              <Sparkles size={16} />
            </button>

            {isSuccess && (
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Hi Shyam, I just registered for a 7-day free trial on MyLife OS with email: ${requestedEmail}!`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost w-full border text-xs font-bold flex items-center justify-center gap-1.5 text-emerald-400"
                style={{ borderColor: "var(--line)" }}
              >
                <MessageCircle size={15} /> Message Admin on WhatsApp
              </a>
            )}
          </form>
        )}

        {/* Direct Android APK Download Button */}
        <div className="mt-5 pt-4 border-t border-white/10 text-center space-y-2">
          <a
            href="/MyLife-OS.apk"
            download="MyLife-OS.apk"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition shadow-sm"
          >
            <Download size={15} /> Download Native Android App (.apk)
          </a>
          <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400">
            <span>Size: 990 KB</span>
            <span>•</span>
            <Link href="/download" className="text-cyan-400 hover:underline">
              Installation Guide &rarr;
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 border-t pt-4 text-center text-[11px] muted" style={{ borderColor: "var(--line)" }}>
          <p>Super-Admin: Shyam Prasad • 24/7 Cloud Sync Active</p>
        </div>
      </div>
    </main>
  );
}