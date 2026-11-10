import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Dumbbell,
  FolderKanban,
  NotebookPen,
  Wallet,
  Sparkles,
  ListTodo,
  CheckCircle2,
  AlertCircle,
  Flame,
  Layers,
  ChevronRight,
  Zap,
  Smartphone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TWELVE_APPLICATIONS } from "@/lib/modules";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch all user entries
  const { data: allEntries } = await supabase
    .from("entries")
    .select("id,module,title,details,entry_date,data,created_at")
    .eq("is_archived", false)
    .order("entry_date", { ascending: false });

  const entries = allEntries || [];
  const todayStr = new Date().toISOString().slice(0, 10);
  const sevenDaysAgoStr = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  // 1. Profile information
  const displayName = (user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "User";
  const isSubscribed = Boolean(user?.user_metadata?.is_subscribed);

  // 2. Today's Overview
  const todayEntries = entries.filter((e) => e.entry_date === todayStr);
  const weekEntries = entries.filter((e) => e.entry_date >= sevenDaysAgoStr);

  // 3. Daily Task Summary (from tasks & calendar)
  const taskEntries = entries.filter((e) => e.module === "tasks" || e.module === "calendar");
  const completedTasks = taskEntries.filter(
    (e) => (e.data as Record<string, unknown>)?.status === "Completed" || (e.data as Record<string, unknown>)?.status === "Done"
  );
  const pendingTasks = taskEntries.filter(
    (e) => (e.data as Record<string, unknown>)?.status !== "Completed" && (e.data as Record<string, unknown>)?.status !== "Done"
  );

  // 4. Study Progress
  const studyEntries = entries.filter((e) => e.module === "study");
  const totalStudyMinutes = studyEntries.reduce((acc, curr) => {
    const mins = Number((curr.data as Record<string, unknown>)?.duration_minutes) || 0;
    return acc + mins;
  }, 0);
  const studyHours = (totalStudyMinutes / 60).toFixed(1);

  // 5. Fitness Progress
  const fitnessEntries = entries.filter((e) => e.module === "fitness");
  const latestWeightEntry = fitnessEntries.find((e) => (e.data as Record<string, unknown>)?.weight_kg);
  const latestWeight = String((latestWeightEntry?.data as Record<string, unknown>)?.weight_kg ?? "--");
  const todaySteps = fitnessEntries
    .filter((e) => e.entry_date === todayStr)
    .reduce((acc, curr) => acc + (Number((curr.data as Record<string, unknown>)?.steps) || 0), 0);
  const todayWater = fitnessEntries
    .filter((e) => e.entry_date === todayStr)
    .reduce((acc, curr) => acc + (Number((curr.data as Record<string, unknown>)?.water_ml) || 0), 0);

  // 6. Expense & Income Summary
  const expenseEntries = entries.filter((e) => e.module === "expenses");
  const totalExpenses = expenseEntries
    .filter((e) => (e.data as Record<string, unknown>)?.type !== "Income")
    .reduce((acc, curr) => acc + (Number((curr.data as Record<string, unknown>)?.amount) || 0), 0);
  const totalIncome = expenseEntries
    .filter((e) => (e.data as Record<string, unknown>)?.type === "Income")
    .reduce((acc, curr) => acc + (Number((curr.data as Record<string, unknown>)?.amount) || 0), 0);

  // 7. Active Projects
  const projectEntries = entries.filter((e) => e.module === "projects");
  const activeProjects = projectEntries.filter(
    (e) => (e.data as Record<string, unknown>)?.status !== "Completed"
  );

  // 8. Habit Completion
  const habitEntries = entries.filter((e) => e.module === "habits" || e.module === "goals");
  const completedHabitsToday = habitEntries.filter(
    (e) => e.entry_date === todayStr && ((e.data as Record<string, unknown>)?.completed === "Yes" || (e.data as Record<string, unknown>)?.status === "Completed")
  );

  // 9. Upcoming Calendar Events
  const upcomingEvents = entries
    .filter((e) => e.module === "calendar" && e.entry_date >= todayStr)
    .slice(0, 3);

  // 10. Important Reminders / Priorities
  const priorityTasks = taskEntries.filter(
    (e) => (e.data as Record<string, unknown>)?.priority === "High" && (e.data as Record<string, unknown>)?.status !== "Completed"
  );

  return (
    <div className="space-y-8 pb-12">
      {/* SUBSECTION 1: Welcome & Personal Profile Hero */}
      <section
        className="relative overflow-hidden rounded-3xl border p-6 sm:p-9 bg-gradient-to-r from-blue-950/45 via-indigo-950/30 to-slate-950/40 shadow-2xl"
        style={{ borderColor: "rgba(59, 130, 246, 0.3)" }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 px-3 py-1 text-xs font-semibold text-blue-400">
                <Sparkles size={13} className="text-cyan-400" /> Command Centre · MyLife OS 3.0 Elite
              </span>
              <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-xs text-gray-300">
                {isSubscribed ? "⭐ Pro Active" : "⏱️ 7-Day Free Trial"}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Welcome back, {displayName} 👋
            </h1>
            <p className="muted mt-2 text-sm sm:text-base leading-relaxed">
              Your 12-application personal operating system is synchronized. All analytics below are computed directly
              from your real cloud database records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/download"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 px-4 py-2.5 text-xs font-bold transition shadow-lg shadow-emerald-500/25"
            >
              <Smartphone size={15} />
              <span>Install Android App (.apk)</span>
            </Link>

            <a
              href="#all-apps"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 text-xs font-bold transition shadow-lg shadow-indigo-600/30"
            >
              <Layers size={15} />
              <span>Explore 12 Applications</span>
              <ChevronRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* SUBSECTION 2: Today's Overview (4 Live Metric Cards) */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel p-5 relative overflow-hidden bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border border-indigo-500/20">
          <p className="muted text-xs font-semibold uppercase tracking-wider text-indigo-400">Today&apos;s Records Logged</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-white">{todayEntries.length}</p>
          <p className="muted mt-1 text-xs">Logged on {todayStr}</p>
        </div>

        <div className="panel p-5 relative overflow-hidden bg-gradient-to-br from-emerald-950/40 to-slate-900/60 border border-emerald-500/20">
          <p className="muted text-xs font-semibold uppercase tracking-wider text-emerald-400">Weekly Activity</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-white">{weekEntries.length}</p>
          <p className="muted mt-1 text-xs">Past 7 days across all apps</p>
        </div>

        <div className="panel p-5 relative overflow-hidden bg-gradient-to-br from-purple-950/40 to-slate-900/60 border border-purple-500/20">
          <p className="muted text-xs font-semibold uppercase tracking-wider text-purple-400">Total Cloud Records</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-white">{entries.length}</p>
          <p className="muted mt-1 text-xs">Persisted in Supabase</p>
        </div>

        <div className="panel p-5 relative overflow-hidden bg-gradient-to-br from-cyan-950/40 to-slate-900/60 border border-cyan-500/20">
          <p className="muted text-xs font-semibold uppercase tracking-wider text-cyan-400">Active Applications</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-white">12</p>
          <p className="muted mt-1 text-xs">Ready with voice automation</p>
        </div>
      </section>

      {/* SUBSECTIONS 3 to 10: Live Cross-Application Intelligence Hub */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* SUBSECTION 3 & 4: Daily Tasks & Study Progress */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Subsection 3: Daily Task Summary */}
            <div className="panel p-5 border border-blue-500/20">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <ListTodo size={17} className="text-blue-400" />
                  <h3 className="font-bold text-sm">Daily Tasks Summary</h3>
                </div>
                <Link href="/dashboard/calendar" className="text-[11px] text-blue-400 hover:underline">
                  View Tasks →
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3">
                  <p className="text-2xl font-extrabold text-emerald-400">{completedTasks.length}</p>
                  <p className="text-[11px] font-medium text-emerald-300">Completed</p>
                </div>
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
                  <p className="text-2xl font-extrabold text-amber-400">{pendingTasks.length}</p>
                  <p className="text-[11px] font-medium text-amber-300">Pending</p>
                </div>
              </div>
            </div>

            {/* Subsection 4: Study Progress */}
            <div className="panel p-5 border border-indigo-500/20">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <BookOpen size={17} className="text-indigo-400" />
                  <h3 className="font-bold text-sm">Study Progress</h3>
                </div>
                <Link href="/dashboard/study" className="text-[11px] text-indigo-400 hover:underline">
                  Study App →
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-3">
                  <p className="text-2xl font-extrabold text-indigo-400">{studyHours}h</p>
                  <p className="text-[11px] font-medium text-indigo-300">Total Hours</p>
                </div>
                <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-3">
                  <p className="text-2xl font-extrabold text-purple-400">{studyEntries.length}</p>
                  <p className="text-[11px] font-medium text-purple-300">Topics Logged</p>
                </div>
              </div>
            </div>
          </div>

          {/* SUBSECTION 5 & 6: Fitness Progress & Expenses */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Subsection 5: Fitness Progress */}
            <div className="panel p-5 border border-emerald-500/20">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Dumbbell size={17} className="text-emerald-400" />
                  <h3 className="font-bold text-sm">Fitness Progress</h3>
                </div>
                <Link href="/dashboard/fitness" className="text-[11px] text-emerald-400 hover:underline">
                  Fitness App →
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5">
                  <p className="text-lg font-extrabold text-emerald-400">{latestWeight}</p>
                  <p className="text-[10px] font-medium text-emerald-300">Weight (kg)</p>
                </div>
                <div className="rounded-xl bg-teal-500/10 border border-teal-500/20 p-2.5">
                  <p className="text-lg font-extrabold text-teal-400">{todaySteps || "--"}</p>
                  <p className="text-[10px] font-medium text-teal-300">Steps</p>
                </div>
                <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-2.5">
                  <p className="text-lg font-extrabold text-blue-400">{todayWater ? `${todayWater}ml` : "--"}</p>
                  <p className="text-[10px] font-medium text-blue-300">Water</p>
                </div>
              </div>
            </div>

            {/* Subsection 6: Income & Expense Summary */}
            <div className="panel p-5 border border-green-500/20">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Wallet size={17} className="text-green-400" />
                  <h3 className="font-bold text-sm">Expenses & Income</h3>
                </div>
                <Link href="/dashboard/expenses" className="text-[11px] text-green-400 hover:underline">
                  Expense App →
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3">
                  <p className="text-xl font-extrabold text-rose-400">₹{totalExpenses.toLocaleString("en-IN")}</p>
                  <p className="text-[11px] font-medium text-rose-300">Expenses Logged</p>
                </div>
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3">
                  <p className="text-xl font-extrabold text-emerald-400">₹{totalIncome.toLocaleString("en-IN")}</p>
                  <p className="text-[11px] font-medium text-emerald-300">Income Logged</p>
                </div>
              </div>
            </div>
          </div>

          {/* SUBSECTION 7 & 8: Active Projects & Habit Completion */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Subsection 7: Active Projects */}
            <div className="panel p-5 border border-orange-500/20">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <FolderKanban size={17} className="text-orange-400" />
                  <h3 className="font-bold text-sm">Active Projects ({activeProjects.length})</h3>
                </div>
                <Link href="/dashboard/projects" className="text-[11px] text-orange-400 hover:underline">
                  Kanban →
                </Link>
              </div>
              <div className="mt-3 space-y-2">
                {activeProjects.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-white/5 p-2 text-xs">
                    <span className="font-medium truncate max-w-[180px]">{p.title}</span>
                    <span className="rounded bg-orange-500/20 text-orange-300 px-1.5 py-0.5 text-[10px]">
                      {(p.data as Record<string, unknown>)?.status as string || "In Progress"}
                    </span>
                  </div>
                ))}
                {activeProjects.length === 0 && (
                  <p className="muted py-4 text-center text-xs">No active projects yet.</p>
                )}
              </div>
            </div>

            {/* Subsection 8: Habit Completion */}
            <div className="panel p-5 border border-fuchsia-500/20">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Flame size={17} className="text-fuchsia-400" />
                  <h3 className="font-bold text-sm">Habit Completion Today</h3>
                </div>
                <Link href="/dashboard/goals" className="text-[11px] text-fuchsia-400 hover:underline">
                  Habits →
                </Link>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 p-4">
                <div>
                  <p className="text-2xl font-extrabold text-fuchsia-400">{completedHabitsToday.length} Done</p>
                  <p className="text-xs text-fuchsia-300">Habits checked today</p>
                </div>
                <Sparkles size={24} className="text-fuchsia-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Events, Reminders, Quick Actions */}
        <div className="space-y-6">
          {/* SUBSECTION 9: Upcoming Calendar Events */}
          <div className="panel p-5 border border-sky-500/20">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <CalendarDays size={17} className="text-sky-400" />
                <h3 className="font-bold text-sm">Upcoming Events</h3>
              </div>
              <Link href="/dashboard/calendar" className="text-[11px] text-sky-400 hover:underline">
                Calendar →
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((evt) => (
                  <div key={evt.id} className="rounded-lg bg-white/5 p-2.5 text-xs">
                    <p className="font-semibold text-white truncate">{evt.title}</p>
                    <p className="text-[11px] text-sky-400 mt-0.5">{evt.entry_date}</p>
                  </div>
                ))
              ) : (
                <p className="muted py-4 text-center text-xs">No upcoming calendar events.</p>
              )}
            </div>
          </div>

          {/* SUBSECTION 10: Important Reminders / Priorities */}
          <div className="panel p-5 border border-amber-500/20">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <AlertCircle size={17} className="text-amber-400" />
                <h3 className="font-bold text-sm">High Priority Alerts</h3>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {priorityTasks.length > 0 ? (
                priorityTasks.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs">
                    <p className="font-semibold text-amber-200">{item.title}</p>
                    <p className="text-[10px] text-amber-300/80 mt-0.5">Priority: HIGH</p>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 text-emerald-400 text-xs py-2">
                  <CheckCircle2 size={16} />
                  <span>All high priority items resolved!</span>
                </div>
              )}
            </div>
          </div>

          {/* SUBSECTION 12: Quick Actions */}
          <div className="panel p-5 border border-indigo-500/20">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Zap size={16} className="text-indigo-400" />
              <span>Quick Actions</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <Link
                href="/dashboard/study"
                className="flex items-center gap-2 rounded-xl bg-white/5 hover:bg-indigo-600 p-2.5 transition text-gray-300 hover:text-white"
              >
                <BookOpen size={14} className="text-indigo-400" />
                <span>+ Study</span>
              </Link>
              <Link
                href="/dashboard/fitness"
                className="flex items-center gap-2 rounded-xl bg-white/5 hover:bg-emerald-600 p-2.5 transition text-gray-300 hover:text-white"
              >
                <Dumbbell size={14} className="text-emerald-400" />
                <span>+ Fitness</span>
              </Link>
              <Link
                href="/dashboard/expenses"
                className="flex items-center gap-2 rounded-xl bg-white/5 hover:bg-green-600 p-2.5 transition text-gray-300 hover:text-white"
              >
                <Wallet size={14} className="text-green-400" />
                <span>+ Expense</span>
              </Link>
              <Link
                href="/dashboard/journal"
                className="flex items-center gap-2 rounded-xl bg-white/5 hover:bg-rose-600 p-2.5 transition text-gray-300 hover:text-white"
              >
                <NotebookPen size={14} className="text-rose-400" />
                <span>+ Journal</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SUBSECTION 11: All 12 Applications Launcher */}
      <section id="all-apps" className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">The 12 Applications</h2>
            <p className="muted text-xs sm:text-sm">Quick launch into any domain with full live tracking.</p>
          </div>
          <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
            12 Active Modules
          </span>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {TWELVE_APPLICATIONS.map((app) => (
            <Link
              key={app.key}
              href={app.route}
              className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-gradient-to-br ${app.gradient}`}
              style={{ borderColor: "var(--line)", background: "var(--card)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{app.emoji}</span>
                  <span className="text-[10px] font-bold text-gray-400 rounded bg-white/5 px-1.5 py-0.5">
                    APP {String(app.appNumber).padStart(2, "0")}
                  </span>
                </div>
                <ArrowUpRight
                  size={17}
                  className="muted transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 text-indigo-400"
                />
              </div>
              <h3 className="mt-3.5 font-bold text-base">{app.title}</h3>
              <p className="muted mt-1 text-xs leading-relaxed line-clamp-2">{app.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
