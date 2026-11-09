"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import {
  Activity,
  Layers,
  BookOpen,
  Dumbbell,
  Wallet,
  FolderKanban,
  Target,
  ListTodo,
  Calendar,
  TrendingUp,
} from "lucide-react";

type EntryRow = {
  id: string;
  module: string;
  title: string;
  entry_date: string;
  data: Record<string, unknown>;
  created_at: string;
};

const ANALYTICS_SUBSECTIONS = [
  { id: "productivity", label: "1. Overall Productivity", icon: Activity },
  { id: "study", label: "2. Study Analytics", icon: BookOpen },
  { id: "fitness", label: "3. Fitness Analytics", icon: Dumbbell },
  { id: "weight", label: "4. Weight Progress", icon: TrendingUp },
  { id: "workouts", label: "5. Workout Consistency", icon: Dumbbell },
  { id: "skills", label: "6. Technical Skills", icon: Layers },
  { id: "projects", label: "7. Project Completion", icon: FolderKanban },
  { id: "finance", label: "8. Financial Analytics", icon: Wallet },
  { id: "habits", label: "9. Habit Performance", icon: Target },
  { id: "tasks", label: "10. Task Completion", icon: ListTodo },
  { id: "weekly", label: "11. Weekly Reports", icon: Calendar },
  { id: "monthly", label: "12. Monthly Reports", icon: Calendar },
];

export default function AnalyticsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<EntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<"all" | "30d" | "7d">("all");
  const [activeTab, setActiveTab] = useState<string>("productivity");

  useEffect(() => {
    supabase
      .from("entries")
      .select("id,module,title,entry_date,data,created_at")
      .eq("is_archived", false)
      .order("entry_date", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) {
          setRows(data as EntryRow[]);
        }
        setLoading(false);
      });
  }, [supabase]);

  // Apply Date Range Filter
  const filteredRows = useMemo(() => {
    const now = Date.now();
    if (dateFilter === "7d") {
      const cut = new Date(now - 7 * 86400000).toISOString().slice(0, 10);
      return rows.filter((r) => r.entry_date >= cut);
    }
    if (dateFilter === "30d") {
      const cut = new Date(now - 30 * 86400000).toISOString().slice(0, 10);
      return rows.filter((r) => r.entry_date >= cut);
    }
    return rows;
  }, [rows, dateFilter]);

  // Module Breakdown
  const moduleCounts = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRows.forEach((r) => {
      map[r.module] = (map[r.module] || 0) + 1;
    });
    return Object.entries(map).map(([mod, count]) => ({
      module: mod.charAt(0).toUpperCase() + mod.slice(1),
      count,
    }));
  }, [filteredRows]);

  // 2. Study Analytics
  const studyRows = useMemo(() => filteredRows.filter((r) => r.module === "study"), [filteredRows]);
  const studyHoursTotal = useMemo(() => {
    const totalMins = studyRows.reduce(
      (acc, r) => acc + (Number(r.data?.duration_minutes) || 0),
      0
    );
    return (totalMins / 60).toFixed(1);
  }, [studyRows]);

  // 3 & 4. Fitness & Weight Analytics
  const fitnessRows = useMemo(() => filteredRows.filter((r) => r.module === "fitness"), [filteredRows]);
  const weightHistory = useMemo(() => {
    return fitnessRows
      .filter((r) => r.data?.weight_kg)
      .map((r) => ({
        date: r.entry_date.slice(5),
        weight: Number(r.data.weight_kg),
      }));
  }, [fitnessRows]);

  // 8. Financial Analytics
  const expenseRows = useMemo(() => filteredRows.filter((r) => r.module === "expenses"), [filteredRows]);
  const totalExpenses = useMemo(() => {
    return expenseRows
      .filter((r) => r.data?.type !== "Income")
      .reduce((acc, r) => acc + (Number(r.data?.amount) || 0), 0);
  }, [expenseRows]);
  const totalIncome = useMemo(() => {
    return expenseRows
      .filter((r) => r.data?.type === "Income")
      .reduce((acc, r) => acc + (Number(r.data?.amount) || 0), 0);
  }, [expenseRows]);

  // 10. Task Completion
  const taskRows = useMemo(
    () => filteredRows.filter((r) => r.module === "tasks" || r.module === "calendar"),
    [filteredRows]
  );
  const tasksDone = taskRows.filter(
    (r) => r.data?.status === "Completed" || r.data?.status === "Done"
  ).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <section
        className="relative overflow-hidden rounded-3xl border p-6 sm:p-8 bg-gradient-to-r from-purple-950/45 via-indigo-950/30 to-slate-950/40 shadow-2xl"
        style={{ borderColor: "rgba(168, 85, 247, 0.3)" }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">📊</span>
              <span className="inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-bold bg-purple-500/15 border-purple-500/30 text-purple-400">
                APPLICATION 12 · REPORTING CENTRE
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Personal Analytics
            </h1>
            <p className="muted mt-2 max-w-xl text-sm leading-relaxed">
              Combine information from all twelve applications. Every graph and figure is calculated exclusively
              from your real saved cloud database records.
            </p>
          </div>

          {/* Date Filter Buttons */}
          <div className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 p-1 self-start md:self-auto">
            <button
              onClick={() => setDateFilter("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                dateFilter === "all" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateFilter("30d")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                dateFilter === "30d" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Past 30 Days
            </button>
            <button
              onClick={() => setDateFilter("7d")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                dateFilter === "7d" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Last 7 Days
            </button>
          </div>
        </div>
      </section>

      {/* 12 Subsections Navigation Carousel */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
        {ANALYTICS_SUBSECTIONS.map((sub) => {
          const isCurrent = activeTab === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveTab(sub.id)}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition border flex items-center gap-1.5 ${
                isCurrent
                  ? "bg-purple-600 text-white border-purple-500 font-bold shadow-md shadow-purple-600/30"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <sub.icon size={13} className={isCurrent ? "text-white" : "text-purple-400"} />
              <span>{sub.label}</span>
            </button>
          );
        })}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="panel p-5 bg-gradient-to-br from-purple-950/30 to-slate-900/60 border border-purple-500/20">
          <p className="muted text-xs font-semibold uppercase tracking-wider text-purple-400">Total Entries</p>
          <p className="mt-2 text-3xl font-extrabold text-white">{filteredRows.length}</p>
          <p className="muted mt-1 text-xs">Real saved records</p>
        </div>

        <div className="panel p-5 bg-gradient-to-br from-indigo-950/30 to-slate-900/60 border border-indigo-500/20">
          <p className="muted text-xs font-semibold uppercase tracking-wider text-indigo-400">Study Time Logged</p>
          <p className="mt-2 text-3xl font-extrabold text-white">{studyHoursTotal} hrs</p>
          <p className="muted mt-1 text-xs">Across {studyRows.length} sessions</p>
        </div>

        <div className="panel p-5 bg-gradient-to-br from-emerald-950/30 to-slate-900/60 border border-emerald-500/20">
          <p className="muted text-xs font-semibold uppercase tracking-wider text-emerald-400">Expenses Logged</p>
          <p className="mt-2 text-3xl font-extrabold text-white">₹{totalExpenses.toLocaleString("en-IN")}</p>
          <p className="muted mt-1 text-xs">Income: ₹{totalIncome.toLocaleString("en-IN")}</p>
        </div>

        <div className="panel p-5 bg-gradient-to-br from-cyan-950/30 to-slate-900/60 border border-cyan-500/20">
          <p className="muted text-xs font-semibold uppercase tracking-wider text-cyan-400">Completed Tasks</p>
          <p className="mt-2 text-3xl font-extrabold text-white">{tasksDone}</p>
          <p className="muted mt-1 text-xs">From tasks & calendar</p>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="panel p-6 border border-purple-500/20">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Records Distribution by Module</h2>
            <p className="muted text-xs">Live breakdown across all applications in selected timeframe.</p>
          </div>
          <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg">
            {moduleCounts.length} Active Modules
          </span>
        </div>

        {loading ? (
          <p className="muted py-16 text-center text-sm">Computing analytics from database...</p>
        ) : moduleCounts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-semibold text-base">No records found for this period</p>
            <p className="muted text-xs mt-1">Start logging entries in any of the 12 applications to generate charts.</p>
          </div>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moduleCounts} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="module"
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis allowDecimals={false} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Weight History Chart (If records exist) */}
      {weightHistory.length > 0 && (
        <div className="panel p-6 border border-emerald-500/20">
          <div className="mb-6">
            <h2 className="text-lg font-bold">Weight Progress History</h2>
            <p className="muted text-xs">Timeline of weight entries logged in Fitness Tracker.</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightHistory} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} domain={["dataMin - 2", "dataMax + 2"]} />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: "#10b981", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
