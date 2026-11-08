import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Award,
  BookOpen,
  CalendarDays,
  Code,
  Dumbbell,
  FolderKanban,
  NotebookPen,
  Target,
  Wallet,
  Sparkles,
  Repeat,
  ListTodo,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MODULES } from "@/lib/modules";

const icons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  study: BookOpen,
  fitness: Dumbbell,
  skills: Code,
  certifications: Award,
  projects: FolderKanban,
  journal: NotebookPen,
  expenses: Wallet,
  goals: Target,
  habits: Repeat,
  tasks: ListTodo,
  calendar: CalendarDays,
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: entries } = await supabase
    .from("entries")
    .select("id,module,title,entry_date,created_at")
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(8);

  const { count } = await supabase.from("entries").select("id", { count: "exact", head: true });
  const first = (user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "there";

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border p-6 sm:p-9 bg-gradient-to-r from-indigo-900/30 via-purple-900/20 to-transparent" style={{ borderColor: "var(--line)" }}>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-400">
              <Sparkles size={13} className="text-cyan-400 animate-spin-slow" /> Antigravity Personal OS
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Good day, {first} 👋</h1>
          <p className="muted mt-2.5 text-sm sm:text-base leading-relaxed">
            Your unified operating system for all 12 areas of life. Use manual tracking or tap the <strong>AI Agent</strong> to command and auto-store anything by voice.
          </p>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel p-5 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10 text-indigo-500 font-extrabold text-7xl select-none">#</div>
          <p className="muted text-xs font-semibold uppercase tracking-wider">Total Records</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight">{count ?? 0}</p>
          <p className="muted mt-1 text-xs">Across all applications</p>
        </div>

        <div className="panel p-5 relative overflow-hidden">
          <p className="muted text-xs font-semibold uppercase tracking-wider">Recent Activity</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight">{entries?.length ?? 0}</p>
          <p className="muted mt-1 text-xs">Latest entries logged</p>
        </div>

        <div className="panel p-5 relative overflow-hidden">
          <p className="muted text-xs font-semibold uppercase tracking-wider">Applications</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight">12</p>
          <p className="muted mt-1 text-xs">Active tracking modules</p>
        </div>

        <div className="panel p-5 relative overflow-hidden">
          <p className="muted text-xs font-semibold uppercase tracking-wider">AI Automation</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-500">Active</p>
          <p className="muted mt-1 text-xs">Voice & auto-store enabled</p>
        </div>
      </section>

      {/* 12 Applications Grid with Tailored Domain Backgrounds */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Your 12 Applications</h2>
            <p className="muted text-xs sm:text-sm mt-0.5">Select any domain or command the AI to log directly.</p>
          </div>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Object.entries(MODULES).map(([key, mod]) => {
            const Icon = icons[key] || Activity;
            return (
              <Link
                key={key}
                href={`/dashboard/${key}`}
                className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-gradient-to-br ${mod.gradient}`}
                style={{ borderColor: "var(--line)", background: "var(--card)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{mod.emoji}</span>
                    <Icon size={18} className="muted text-indigo-400 opacity-70" />
                  </div>
                  <ArrowUpRight
                    size={17}
                    className="muted transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 text-indigo-400"
                  />
                </div>
                <h3 className="mt-3.5 font-bold text-base">{mod.title}</h3>
                <p className="muted mt-1 text-xs leading-relaxed line-clamp-2">{mod.description}</p>
              </Link>
            );
          })}

          {/* 12th Application: Personal Files */}
          <Link
            href="/dashboard/files"
            className="group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-gradient-to-br from-slate-600/15 via-zinc-600/5 to-transparent"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">📁</span>
              <ArrowUpRight
                size={17}
                className="muted transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 text-indigo-400"
              />
            </div>
            <h3 className="mt-3.5 font-bold text-base">Personal Files</h3>
            <p className="muted mt-1 text-xs leading-relaxed line-clamp-2">Upload and manage private certificates, docs, and images.</p>
          </Link>
        </div>
      </section>

      {/* Recently Logged Activity */}
      <section className="panel p-5 sm:p-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Recent Logged Activity</h2>
            <p className="muted text-xs">Entries stored manually or automatically by the AI Agent.</p>
          </div>
          <Link href="/dashboard/analytics" className="text-xs font-semibold text-indigo-500 hover:underline">
            View Analytics →
          </Link>
        </div>

        {entries?.length ? (
          <div className="divide-y" style={{ borderColor: "var(--line)" }}>
            {entries.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-sm">{item.title}</p>
                  <p className="muted text-xs mt-0.5">
                    <span className="capitalize text-indigo-500 font-medium">{item.module}</span> · {item.entry_date}
                  </p>
                </div>
                <Link
                  className="rounded-lg border px-3 py-1 text-xs font-medium hover:bg-indigo-600 hover:text-white transition"
                  style={{ borderColor: "var(--line)" }}
                  href={`/dashboard/${item.module}`}
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted py-8 text-center text-sm">
            No records yet. Click any module or use the <strong>AI Agent</strong> to add your first record!
          </p>
        )}
      </section>
    </div>
  );
}
