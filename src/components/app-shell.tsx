import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { AntigravityCanvas } from "@/components/antigravity-canvas";
import { AiAgentWidget } from "@/components/ai-agent-widget";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  Clock,
  LayoutGrid,
  Search,
  Home,
  CalendarDays,
  Activity,
  Settings as SettingsIcon,
  Smartphone,
} from "lucide-react";

const OWNER_EMAILS = [
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
  const trialDays = 7;
  const trialEnd = new Date(createdAt.getTime() + trialDays * 24 * 60 * 60 * 1000);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const hoursLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60)));
  const isTrialActive = now < trialEnd;

  const isOwner = OWNER_EMAILS.includes(user.email || "");
  const role: "owner" | "admin" | "moderator" | "customer" = isOwner
    ? "owner"
    : (user.user_metadata?.role as "admin" | "moderator") ||
      (user.user_metadata?.display_name === "shyamvsp" ? "admin" : "customer");

  const isPrivileged = isOwner || role === "admin" || role === "moderator";

  const roleBadge = isOwner ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-400">
      👑 Owner
    </span>
  ) : role === "admin" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 text-[11px] font-bold text-indigo-400">
      🛡️ Admin
    </span>
  ) : role === "moderator" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 text-[11px] font-bold text-cyan-400">
      ⚖️ Moderator
    </span>
  ) : (
    <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-medium text-gray-400">
      👤 Member
    </span>
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-16 lg:pb-0">
      {/* Antigravity Gravitational Cursor / Touch Canvas */}
      <AntigravityCanvas />

      {/* Main Navigation Sidebar with Strict Role-Based Visibility */}
      <Sidebar role={role} />

      {/* Main Content Area */}
      <main className="relative z-10 min-h-screen lg:pl-68">
        {/* Top Header */}
        <header
          className="sticky top-0 z-20 flex h-16 items-center justify-between border-b px-4 sm:px-6 backdrop-blur-md"
          style={{
            background: "color-mix(in srgb, var(--background) 88%, transparent)",
            borderColor: "var(--line)",
          }}
        >
          {/* Left: User Profile */}
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
              <div className="hidden sm:block">
                <span className="font-semibold text-xs sm:text-sm block leading-none group-hover:text-indigo-400 transition">
                  {displayName}
                </span>
                <span className="text-[10px] text-gray-400">{user.email}</span>
              </div>
            </Link>

            {roleBadge}
          </div>

          {/* Center: Search Link / Filter */}
          <div className="hidden md:flex items-center">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/40 px-3.5 py-1.5 text-xs text-gray-400 hover:text-white transition w-56"
            >
              <Search size={13} className="text-gray-400" />
              <span className="flex-1 truncate">Search your records...</span>
              <kbd className="rounded bg-white/10 px-1 py-0.2 text-[9px] font-mono text-gray-400">⌘K</kbd>
            </Link>
          </div>

          {/* Right: Actions, Subscription Status, Admin Shortcut, Theme */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Super Admin Hub Shortcut (Strictly Admin / Owner Only) */}
            {isPrivileged && (
              <Link
                href="/dashboard/admin"
                className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-xs font-bold text-amber-400 hover:bg-amber-500/25 transition"
                title="Super Admin Owner Hub"
              >
                <ShieldCheck size={13} />
                <span>Admin Hub</span>
              </Link>
            )}

            {/* Subscription Status Pill */}
            <Link
              href="/dashboard/subscription"
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition shadow-sm ${
                isSubscribed
                  ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25"
                  : isTrialActive
                  ? "bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/25"
                  : "bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 animate-pulse"
              }`}
            >
              {isSubscribed ? (
                <>
                  <Sparkles size={12} className="text-emerald-400" />
                  <span>Pro Active</span>
                </>
              ) : isTrialActive ? (
                <>
                  <Clock size={12} className="text-indigo-400" />
                  <span>Trial: {hoursLeft > 24 ? `${daysLeft}d left` : `${hoursLeft}h left`}</span>
                </>
              ) : (
                <span>Renew Membership</span>
              )}
            </Link>

            {/* Standalone Android App Download */}
            <Link
              href="/download"
              className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-1 text-xs font-bold text-cyan-400 hover:bg-cyan-500/25 transition shadow-sm"
              title="Download Android App (.apk)"
            >
              <Smartphone size={13} />
              <span className="hidden sm:inline">Get App</span>
            </Link>

            <ThemeToggle />
          </div>
        </header>

        {/* Main Routed Children */}
        <div className="relative mx-auto max-w-7xl p-4 pt-6 sm:p-7">{children}</div>
      </main>

      {/* Sticky Mobile Bottom Navigation Bar (Role-Specific) */}
      <nav
        className="fixed bottom-0 inset-x-0 z-30 flex items-center justify-around border-t py-2 px-3 backdrop-blur-lg lg:hidden"
        style={{
          background: "color-mix(in srgb, var(--card) 92%, #060913)",
          borderColor: "var(--line)",
        }}
      >
        <Link
          href="/dashboard"
          className="flex flex-col items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-white"
        >
          <Home size={18} />
          <span>Home</span>
        </Link>

        {isPrivileged ? (
          <>
            <Link
              href="/dashboard/apps"
              className="flex flex-col items-center gap-1 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300"
            >
              <LayoutGrid size={18} />
              <span>12 Apps</span>
            </Link>
            <Link
              href="/dashboard/admin"
              className="flex flex-col items-center gap-1 text-[10px] font-semibold text-amber-400 hover:text-amber-300"
            >
              <ShieldCheck size={18} />
              <span>Admin</span>
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/dashboard/calendar"
              className="flex flex-col items-center gap-1 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300"
            >
              <CalendarDays size={18} />
              <span>Schedule</span>
            </Link>
            <Link
              href="/dashboard/analytics"
              className="flex flex-col items-center gap-1 text-[10px] font-semibold text-purple-400 hover:text-purple-300"
            >
              <Activity size={18} />
              <span>Analytics</span>
            </Link>
          </>
        )}

        <Link
          href="/download"
          className="flex flex-col items-center gap-1 text-[10px] font-semibold text-cyan-400 hover:text-cyan-300"
        >
          <Smartphone size={18} />
          <span>Get App</span>
        </Link>

        <Link
          href="/dashboard/settings"
          className="flex flex-col items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-white"
        >
          <SettingsIcon size={18} />
          <span>Settings</span>
        </Link>
      </nav>

      {/* Always-on Antigravity AI Agent Widget with Voice & Auto-save */}
      <AiAgentWidget />
    </div>
  );
}
