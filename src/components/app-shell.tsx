import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { AntigravityCanvas } from "@/components/antigravity-canvas";
import { AiAgentWidget } from "@/components/ai-agent-widget";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, ShieldCheck, Clock } from "lucide-react";

const ADMIN_EMAILS = [
  "dasapallivenkatshyamprasad@gmail.com",
  "shyamvsp@mylife.local",
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "User";
  const avatarUrl = user.user_metadata?.avatar_url || null;
  const isSubscribed = Boolean(user.user_metadata?.is_subscribed);

  const createdAt = new Date(user.created_at);
  const trialEnd = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const isTrialActive = now < trialEnd;

  const isAdmin =
    ADMIN_EMAILS.includes(user.email || "") ||
    user.user_metadata?.role === "admin" ||
    user.user_metadata?.display_name === "shyamvsp";

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Antigravity Slow-Motion Gravitational Cursor/Touch Particle Canvas */}
      <AntigravityCanvas />

      {/* Main Navigation Sidebar */}
      <Sidebar />

      {/* Main View Area */}
      <main className="relative z-10 min-h-screen lg:pl-64">
        {/* Top Header */}
        <header
          className="sticky top-0 z-20 flex h-16 items-center justify-between border-b px-5 backdrop-blur-md"
          style={{ background: "color-mix(in srgb, var(--background) 85%, transparent)", borderColor: "var(--line)" }}
        >
          <div className="flex items-center gap-3 pl-12 lg:pl-0">
            <Link href="/dashboard/settings" className="flex items-center gap-2.5 group">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-9 w-9 rounded-full object-cover border border-indigo-500/40 group-hover:scale-105 transition"
                />
              ) : (
                <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-sm group-hover:scale-105 transition">
                  {displayName[0]?.toUpperCase() || "U"}
                </div>
              )}
              <span className="font-semibold text-sm hidden sm:inline group-hover:text-indigo-400 transition">
                {displayName}
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Super Admin Pill */}
            {isAdmin && (
              <Link
                href="/dashboard/admin"
                className="hidden sm:inline-flex items-center gap-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-1 text-xs font-bold text-indigo-400 hover:bg-indigo-500/25 transition"
                title="Super Admin Owner Hub"
              >
                <ShieldCheck size={13} /> Admin
              </Link>
            )}

            {/* Subscription Status Pill */}
            <Link
              href="/dashboard/subscription"
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition shadow-sm ${
                isSubscribed
                  ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25"
                  : isTrialActive
                  ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20"
                  : "bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25"
              }`}
            >
              {isSubscribed ? (
                <>
                  <Sparkles size={12} />
                  <span>Pro ₹29</span>
                </>
              ) : isTrialActive ? (
                <>
                  <Clock size={12} />
                  <span>Trial: {daysLeft}d left</span>
                </>
              ) : (
                <span>Renew ₹29</span>
              )}
            </Link>

            <ThemeToggle />
          </div>
        </header>

        {/* Content Children */}
        <div className="relative mx-auto max-w-7xl p-4 pt-6 sm:p-7">{children}</div>
      </main>

      {/* Always-on Antigravity AI Agent Widget with Voice & Auto-save */}
      <AiAgentWidget />
    </div>
  );
}