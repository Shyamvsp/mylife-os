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
  ListTodo,
  LogOut,
  NotebookPen,
  Repeat,
  Target,
  Wallet,
  Dumbbell,
  Files,
  Menu,
  X,
  Users,
  ArrowLeftRight,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const links = [
  ["Overview", "/dashboard", Home],
  ["Subscription (₹29)", "/dashboard/subscription", CreditCard],
  ["Admin Hub", "/dashboard/admin", ShieldCheck],
  ["Collaborate", "/dashboard/collaborate", Users],
  ["Data Sync & API", "/dashboard/sync", ArrowLeftRight],
  ["Share links", "/dashboard/shares", Link2],
  ["Analytics", "/dashboard/analytics", Activity],
  ["Study", "/dashboard/study", BookOpen],
  ["Fitness", "/dashboard/fitness", Dumbbell],
  ["Skills", "/dashboard/skills", Code],
  ["Certifications", "/dashboard/certifications", Award],
  ["Projects", "/dashboard/projects", FolderKanban],
  ["Daily Journal", "/dashboard/journal", NotebookPen],
  ["Expenses", "/dashboard/expenses", Wallet],
  ["Goals", "/dashboard/goals", Target],
  ["Habits", "/dashboard/habits", Repeat],
  ["Tasks", "/dashboard/tasks", ListTodo],
  ["Calendar", "/dashboard/calendar", CalendarDays],
  ["Files", "/dashboard/files", Files],
  ["Settings", "/dashboard/settings", Settings],
] as const;

export function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <button
        className="btn btn-ghost fixed left-3 top-3 z-50 lg:hidden"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation"
      >
        {open ? <X /> : <Menu />}
      </button>
      {open && (
        <button
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r p-4 transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "var(--card)", borderColor: "var(--line)" }}
      >
        <Link href="/dashboard" className="mb-5 flex items-center gap-3 px-2 pt-2" onClick={() => setOpen(false)}>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-lg font-bold text-white shadow-md shadow-indigo-500/25">
            M
          </span>
          <span>
            <b className="block text-base">MyLife OS</b>
            <small className="muted text-xs">Enterprise Personal OS</small>
          </span>
        </Link>
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1 no-scrollbar">
          {links.map(([label, href, Icon]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                path === href
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "hover:bg-black/5 dark:hover:bg-white/5 muted hover:text-white"
              }`}
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {href === "/dashboard/subscription" && (
                <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                  ₹29
                </span>
              )}
              {href === "/dashboard/admin" && (
                <span className="rounded-full bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-400">
                  👑
                </span>
              )}
            </Link>
          ))}
        </nav>
        <button className="btn btn-ghost mt-4 w-full text-xs font-semibold" onClick={logout}>
          <LogOut size={16} /> Sign out
        </button>
      </aside>
    </>
  );
}