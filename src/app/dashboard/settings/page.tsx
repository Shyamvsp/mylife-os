"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Camera, Check, RefreshCw, Lock, Shield, CreditCard, ChevronRight } from "lucide-react";
import Link from "next/link";

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80",
];

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [daysLeft, setDaysLeft] = useState(7);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? "");
        setName(user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? "");
        setAvatarUrl(user.user_metadata?.avatar_url ?? null);
        setIsSubscribed(Boolean(user.user_metadata?.is_subscribed));

        const createdAt = new Date(user.created_at);
        const trialEnd = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
        const now = new Date();
        setDaysLeft(Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))));
      }
    });
  }, [supabase]);

  // Handle local image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Please upload an image smaller than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function save() {
    setIsSaving(true);
    setMessage("");

    try {
      const updateData: { data: Record<string, unknown>; password?: string } = {
        data: {
          display_name: name.trim(),
          avatar_url: avatarUrl,
        },
      };

      if (newPassword.trim().length >= 6) {
        updateData.password = newPassword.trim();
      }

      const { error } = await supabase.auth.updateUser(updateData);
      if (error) {
        setMessage("Error: " + error.message);
      } else {
        setMessage("Profile and photo updated successfully!");
        setNewPassword("");
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      }
    } catch {
      setMessage("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="muted text-xs font-bold uppercase tracking-wider">Account Settings</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Your Profile & Preferences</h1>
        <p className="muted text-sm mt-1">Manage your photo, credentials, and ₹29/month subscription status.</p>
      </div>

      {/* Profile Photo & Personal Info Panel */}
      <div className="panel p-6 sm:p-8 space-y-6">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <User className="text-indigo-500" size={20} />
          Profile Avatar & Identity
        </h2>

        {/* Avatar Preview & Upload */}
        <div className="flex flex-col sm:flex-row items-center gap-6 border-b pb-6" style={{ borderColor: "var(--line)" }}>
          <div className="relative group">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Profile Avatar"
                className="h-24 w-24 rounded-full object-cover border-2 border-indigo-500 shadow-md shadow-indigo-500/20"
              />
            ) : (
              <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold text-3xl shadow-md shadow-indigo-500/20">
                {name?.[0]?.toUpperCase() || "U"}
              </div>
            )}

            <label
              htmlFor="avatar-file-input"
              className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700 transition shadow-md"
              title="Upload custom photo"
            >
              <Camera size={15} />
              <input
                id="avatar-file-input"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <h3 className="font-semibold text-sm">Choose or Upload Your Photo</h3>
            <p className="muted text-xs">
              Upload a picture from your phone/computer (JPG or PNG, max 2MB), or pick one of our quick presets:
            </p>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
              {AVATAR_PRESETS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(url)}
                  className={`h-9 w-9 rounded-full overflow-hidden border-2 transition hover:scale-110 ${
                    avatarUrl === url ? "border-indigo-500 scale-105" : "border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Preset ${idx}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block text-xs font-semibold">
            Email Address
            <input className="field mt-1.5 opacity-60 cursor-not-allowed text-sm" value={email} disabled />
          </label>

          <label className="block text-xs font-semibold">
            Display Name
            <input
              className="field mt-1.5 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </label>

          <label className="block text-xs font-semibold sm:col-span-2">
            Change Password (Optional)
            <div className="relative mt-1.5">
              <Lock size={15} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="password"
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="field pl-9 text-sm"
              />
            </div>
          </label>
        </div>

        <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: "var(--line)" }}>
          {message ? <p className="text-xs font-semibold text-emerald-500">{message}</p> : <span />}
          <button
            className="btn btn-primary text-xs font-bold flex items-center gap-1.5"
            onClick={() => void save()}
            disabled={isSaving}
          >
            {isSaving ? <RefreshCw className="animate-spin" size={14} /> : <Check size={14} />}
            {isSaving ? "Saving..." : "Save Profile & Photo"}
          </button>
        </div>
      </div>

      {/* Subscription Status Card in Settings */}
      <div className="panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="text-emerald-500" size={20} />
            <h2 className="font-bold text-base">Subscription & Membership</h2>
          </div>
          <Link
            href="/dashboard/subscription"
            className="text-xs font-semibold text-indigo-500 hover:underline flex items-center gap-1"
          >
            Manage Billing <ChevronRight size={14} />
          </Link>
        </div>

        <div className="rounded-xl border p-4 flex items-center justify-between gap-4" style={{ borderColor: "var(--line)", background: "var(--background)" }}>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">
                {isSubscribed ? "Pro Plan (₹29/month)" : `Free Trial (${daysLeft} days remaining)`}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isSubscribed
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-indigo-500/10 text-indigo-400"
                }`}
              >
                {isSubscribed ? "Active" : "Trial"}
              </span>
            </div>
            <p className="text-xs muted mt-1">
              {isSubscribed
                ? "Your full access to all 12 modules and the AI agent is unlocked."
                : "Your 1-week free trial is active. Continue anytime for just ₹29/month."}
            </p>
          </div>

          <Link href="/dashboard/subscription" className="btn btn-primary text-xs font-bold shrink-0">
            {isSubscribed ? "View Plan" : "Upgrade ₹29"}
          </Link>
        </div>
      </div>

      {/* Privacy reminder */}
      <div className="panel p-6 space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="text-indigo-400" size={18} />
          <h2 className="font-bold text-sm">Data Security & Privacy</h2>
        </div>
        <p className="muted text-xs leading-relaxed">
          Your personal data is encrypted and isolated in your private Supabase database. No other user can access your logs, workouts, or financials. Share links are read-only and automatically expire after seven days.
        </p>
      </div>
    </div>
  );
}