"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Settings,
  Link2,
  Activity,
  Award,
  BookOpen,
  CalendarDays,
  Code,
  FolderKanban,
  Home,
  LogOut,
  NotebookPen,
  Wallet,
  Dumbbell,
  Files,
  Menu,
  X,
  Users,
  ArrowLeftRight,
  ShieldCheck,
  CreditCard,
  Target,
  Sparkles,
  LayoutGrid,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// The 12 Core Applications of MyLife OS 3.0
const coreApps = [
  { appNum: 1, label: "Personal Dashboard", href: "/dashboard", Icon: Home, emoji: "⚡" },
  { appNum: 2, label: "Study Management", href: "/dashboard/study", Icon: BookOpen, emoji: "📚" },
  { appNum: 3, label: "Fitness Tracker", href: "/dashboard/fitness", Icon: Dumbbell, emoji: "🏋️" },
  { appNum: 4, label: "Technical Skills", href: "/dashboard/skills", Icon: Code, emoji: "💻" },
  { appNum: 5, label: "Certifications", href: "/dashboard/certifications", Icon: Award, emoji: "🏆" },
  { appNum: 6, label: "Project Management", href: "/dashboard/projects", Icon: FolderKanban, emoji: "🚀" },
  { appNum: 7, label: "Daily Journal", href: "/dashboard/journal", Icon: NotebookPen, emoji: "✍️" },
  { appNum: 8, label: "Expense Tracker", href: "/dashboard/expenses", Icon: Wallet, emoji: "💰" },
  { appNum: 9, label: "Goals & Habits", href: "/dashboard/goals", Icon: Target, emoji: "🎯" },
  { appNum: 10, label: "Personal Files", href: "/dashboard/files", Icon: Files, emoji: "📁" },
  { appNum: 11, label: "Calendar & Tasks", href: "/dashboard/calendar", Icon: CalendarDays, emoji: "🗓️" },
  { appNum: 12, label: "Personal Analytics", href: "/dashboard/analytics", Icon: Activity, emoji: "📊" },
];

// Admin & System Management Links (Strictly Hidden from Customers)
const adminManagementLinks = [
  { label: "12 Apps Catalog", href: "/dashboard/apps", Icon: LayoutGrid },
  { label: "Subscription & Pricing", href: "/dashboard/subscription", Icon: CreditCard, badge: "₹29 / ₹59" },
  { label: "Admin Hub", href: "/dashboard/admin", Icon: ShieldCheck, badge: "👑" },
  { label: "Data Sync & API", href: "/dashboard/sync", Icon: ArrowLeftRight },
  { label: "Collaborate", href: "/dashboard/collaborate", Icon: Users },
  { label: "Share Links", href: "/dashboard/shares", Icon: Link2 },
];

interface SidebarProps {
  role?: "owner" | "admin" | "moderator" | "customer";
}

export function Sidebar({ role = "customer" }: SidebarProps) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isPrivileged = role === "owner" || role === "admin" || role === "moderator";

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Mobile Top Hamburger Button */}
      <button
        className="btn btn-ghost fixed left-3 top-3 z-50 lg:hidden !p-2 bg-slate-900/80 backdrop-blur-md border border-white/10"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Backdrop */}
      {open && (
        <button
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-68 flex-col border-r p-4 transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "color-mix(in srgb, var(--card) 95%, #060913)",
          borderColor: "var(--line)",
        }}
      >
        {/* Brand Header */}
        <Link
          href="/dashboard"
          className="mb-4 flex items-center gap-3 px-2 pt-2 group"
          onClick={() => setOpen(false)}
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-cyan-400 text-lg font-black text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300">
            M
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <b className="block text-base tracking-tight font-black bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                MyLife OS
              </b>
              <span className="rounded bg-gradient-to-r from-indigo-500 to-purple-500 px-1.5 py-0.2 text-[9px] font-extrabold text-white shadow-xs">
                3.0
              </span>
            </div>
            <small className="muted text-[11px] block truncate">
              {isPrivileged ? (
                <span className="text-indigo-400 font-semibold">
                  {role === "owner" ? "👑 Super Admin Suite" : role === "admin" ? "🛡️ Admin Console" : "⚖️ Moderator View"}
                </span>
              ) : (
                "Personal Operating System"
              )}
            </small>
          </div>
        </Link>

        {/* Admin-Only 12 Apps Quick Launch Catalog Pill */}
        {isPrivileged && (
          <div className="px-1 mb-3">
            <Link
              href="/dashboard/apps"
              onClick={() => setOpen(false)}
              className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-bold transition border ${
                path === "/dashboard/apps"
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                  : "bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/20"
              }`}
            >
              <div className="flex items-center gap-2">
                <LayoutGrid size={15} />
                <span>12 Applications Hub</span>
              </div>
              <Sparkles size={12} className="text-cyan-400 animate-pulse" />
            </Link>
          </div>
        )}

        {/* Scrollable Navigation List */}
        <nav className="flex-1 space-y-4 overflow-y-auto pr-1 no-scrollbar text-xs">
          {/* Section: 12 Core Applications (Clean & Focused for Customers) */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
              <span>Applications</span>
              <span className="text-[9px] font-mono opacity-60">12 TOTAL</span>
            </div>
            <div className="space-y-0.5">
              {coreApps.map(({ appNum, label, href, Icon, emoji }) => {
                const isActive = path === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-1.5 font-medium transition duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold shadow-md shadow-indigo-600/25 translate-x-1"
                        : "hover:bg-white/5 muted hover:text-white"
                    }`}
                  >
                    <span className="text-sm select-none">{emoji}</span>
                    <Icon size={14} className={isActive ? "text-white" : "opacity-70 text-indigo-400"} />
                    <span className="flex-1 truncate">{label}</span>
                    <span
                      className={`text-[9px] font-mono rounded px-1 py-0.2 ${
                        isActive ? "bg-white/20 text-white font-bold" : "text-gray-500"
                      }`}
                    >
                      {String(appNum).padStart(2, "0")}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Section: Admin-Only System Management (COMPLETELY BLOCKED & HIDDEN FROM CUSTOMERS) */}
          {isPrivileged && (
            <div className="pt-2 border-t border-white/5">
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <ShieldCheck size={12} />
                <span>System Management</span>
              </div>
              <div className="space-y-0.5">
                {adminManagementLinks.map(({ label, href, Icon, badge }) => {
                  const isActive = path === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-1.5 font-medium transition duration-200 ${
                        isActive
                          ? "bg-amber-600/90 text-white font-bold shadow-md shadow-amber-600/25"
                          : "hover:bg-white/5 text-gray-300 hover:text-white"
                      }`}
                    >
                      <Icon size={14} className={isActive ? "text-white" : "opacity-70 text-amber-400"} />
                      <span className="flex-1 truncate">{label}</span>
                      {badge && (
                        <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-300">
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Footer: User Settings & Sign Out */}
        <div className="pt-3 border-t border-white/5 space-y-1">
          <Link
            href="/dashboard/settings"
            onClick={() => setOpen(false)}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
              path === "/dashboard/settings"
                ? "bg-white/10 text-white font-semibold"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Settings size={14} />
            <span className="flex-1">Account Settings</span>
          </Link>

          <button
            className="btn btn-ghost w-full text-xs font-semibold justify-start text-gray-400 hover:text-rose-400 !px-3"
            onClick={logout}
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
