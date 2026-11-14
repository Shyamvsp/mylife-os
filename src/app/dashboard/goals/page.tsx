"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Volume2,
  RefreshCw,
  X,
  Check,
  Calendar,
} from "lucide-react";

interface HabitRecord {
  id: string;
  title: string;
  details: string | null;
  entry_date: string;
  created_at: string;
  data: {
    frequency?: "daily" | "weekly" | "monthly";
    category?: string;
    color?: string;
    completed_dates?: string[]; // Array of YYYY-MM-DD
    weekly_completed?: number[]; // Array of week numbers [1, 2, 3, 4, 5]
    monthly_completed?: string[]; // Array of YYYY-MM strings
    notes?: string;
  };
}

// 10 Distinct Pastel/Vibrant Row Colors matching the user's sample image
const HABIT_COLORS = [
  "#10b981", // Mint green
  "#8b5cf6", // Lavender / Violet
  "#ec4899", // Pastel Pink
  "#f97316", // Warm Orange
  "#eab308", // Golden Yellow
  "#d946ef", // Magenta / Fuchsia
  "#3b82f6", // Royal Blue
  "#06b6d4", // Cyan
  "#14b8a6", // Teal
  "#f43f5e", // Rose
];

const DEFAULT_DAILY_PRESETS = [
  { title: "8 hours sleep", color: "#10b981" },
  { title: "morning run", color: "#8b5cf6" },
  { title: "drink enough water", color: "#ec4899" },
  { title: "read 30 pages", color: "#f97316" },
  { title: "practice yoga", color: "#eab308" },
  { title: "listen to music", color: "#d946ef" },
  { title: "healthy diet", color: "#3b82f6" },
  { title: "call parents", color: "#06b6d4" },
  { title: "walking dog", color: "#f97316" },
  { title: "park with kids", color: "#8b5cf6" },
];

const DEFAULT_WEEKLY_PRESETS = [
  { title: "checking email", color: "#10b981" },
  { title: "clean the room", color: "#06b6d4" },
  { title: "meeting", color: "#f97316" },
];

const DEFAULT_MONTHLY_PRESETS = [
  { title: "volunteer work", color: "#06b6d4" },
  { title: "bill payments", color: "#f43f5e" },
  { title: "visit my parents", color: "#10b981" },
  { title: "finished reading a book", color: "#8b5cf6" },
];

export default function GoalsAndHabitsPlannerPage() {
  const supabase = useMemo(() => createClient(), []);

  // Current real-world date
  const realDate = useMemo(() => new Date(), []);
  const todayDayNum = realDate.getDate();
  const todayMonthIdx = realDate.getMonth();
  const todayYear = realDate.getFullYear();
  const todayDateStr = useMemo(() => {
    return `${todayYear}-${String(todayMonthIdx + 1).padStart(2, "0")}-${String(todayDayNum).padStart(2, "0")}`;
  }, [todayYear, todayMonthIdx, todayDayNum]);

  // Selected Month and Year for the Planner
  const [selectedYear, setSelectedYear] = useState(todayYear);
  const [selectedMonth, setSelectedMonth] = useState(todayMonthIdx); // 0-indexed: 0 = Jan, 10 = Nov

  // Habits state
  const [habits, setHabits] = useState<HabitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [chimeEnabled, setChimeEnabled] = useState(true);

  // Motivational Notes state
  const [monthlyNotes, setMonthlyNotes] = useState(
    "small daily improvements lead to lifelong habit of success!"
  );

  // Modal State for Adding / Editing Habit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitRecord | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formFrequency, setFormFrequency] = useState<"daily" | "weekly" | "monthly">("daily");
  const [formColor, setFormColor] = useState(HABIT_COLORS[0]);
  const [saving, setSaving] = useState(false);

  // Number of days in the currently viewed month
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const monthName = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 1).toLocaleDateString("en-US", { month: "long" });
  }, [selectedYear, selectedMonth]);

  // Web Audio API Synthesized Bubble Pop & Chime
  const playPopChime = useCallback(() => {
    if (!chimeEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio not supported or blocked
    }
  }, [chimeEnabled]);

  // Load habits from Supabase
  const loadHabits = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("entries")
        .select("id,title,details,entry_date,data,created_at")
        .in("module", ["habits", "goals"])
        .eq("is_archived", false)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading habits:", error);
        setNotice(error.message);
      } else if (data && data.length > 0) {
        const loaded = data.map((item, index) => {
          const d = (item.data as Record<string, unknown>) || {};
          const completedDates = Array.isArray(d.completed_dates) ? (d.completed_dates as string[]) : [];
          if (d.completed === "Yes" && item.entry_date && !completedDates.includes(item.entry_date)) {
            completedDates.push(item.entry_date);
          }
          const freq = (d.frequency as "daily" | "weekly" | "monthly") || "daily";
          const color = (d.color as string) || HABIT_COLORS[index % HABIT_COLORS.length];

          return {
            id: item.id,
            title: item.title,
            details: item.details,
            entry_date: item.entry_date,
            created_at: item.created_at,
            data: {
              ...d,
              frequency: freq,
              color,
              completed_dates: completedDates,
              weekly_completed: Array.isArray(d.weekly_completed) ? (d.weekly_completed as number[]) : [],
              monthly_completed: Array.isArray(d.monthly_completed) ? (d.monthly_completed as string[]) : [],
            },
          } as HabitRecord;
        });
        setHabits(loaded);
      } else {
        // First-time user: populate with presets from sample image
        setHabits([]);
      }
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadHabits();
  }, [loadHabits]);

  // Populate sample presets if database is empty
  const populateSampleTemplate = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setLoading(true);
      const batchInserts = [
        ...DEFAULT_DAILY_PRESETS.map((p) => ({
          user_id: user.id,
          module: "habits",
          title: p.title,
          details: "Daily Habit Routine",
          entry_date: todayDateStr,
          data: {
            frequency: "daily",
            color: p.color,
            completed_dates: [todayDateStr], // Mark today checked
          },
        })),
        ...DEFAULT_WEEKLY_PRESETS.map((p) => ({
          user_id: user.id,
          module: "habits",
          title: p.title,
          details: "Weekly Routine",
          entry_date: todayDateStr,
          data: {
            frequency: "weekly",
            color: p.color,
            weekly_completed: [1, 2],
          },
        })),
        ...DEFAULT_MONTHLY_PRESETS.map((p) => ({
          user_id: user.id,
          module: "habits",
          title: p.title,
          details: "Monthly Target",
          entry_date: todayDateStr,
          data: {
            frequency: "monthly",
            color: p.color,
            monthly_completed: [`${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`],
          },
        })),
      ];

      await supabase.from("entries").insert(batchInserts);
      await loadHabits();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Daily habit check bubble for a specific day
  const toggleDailyDay = async (habit: HabitRecord, dayNum: number) => {
    const targetDateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(
      2,
      "0"
    )}`;
    const existing = new Set(habit.data.completed_dates || []);
    const isDone = existing.has(targetDateStr);

    if (isDone) {
      existing.delete(targetDateStr);
    } else {
      existing.add(targetDateStr);
      playPopChime();
    }

    const updatedDates = Array.from(existing);
    const updatedData = {
      ...habit.data,
      completed_dates: updatedDates,
      completed: updatedDates.includes(todayDateStr) ? "Yes" : "No",
    };

    // Optimistic UI update
    setHabits((prev) =>
      prev.map((h) => (h.id === habit.id ? { ...h, data: updatedData } : h))
    );

    // Save to Supabase
    await supabase
      .from("entries")
      .update({ data: updatedData, updated_at: new Date().toISOString() })
      .eq("id", habit.id);
  };

  // Toggle Weekly habit bubble for a week (1-5)
  const toggleWeeklyCheck = async (habit: HabitRecord, weekNum: number) => {
    const existing = new Set(habit.data.weekly_completed || []);
    const isDone = existing.has(weekNum);

    if (isDone) {
      existing.delete(weekNum);
    } else {
      existing.add(weekNum);
      playPopChime();
    }

    const updatedWeeks = Array.from(existing);
    const updatedData = { ...habit.data, weekly_completed: updatedWeeks };

    setHabits((prev) =>
      prev.map((h) => (h.id === habit.id ? { ...h, data: updatedData } : h))
    );

    await supabase
      .from("entries")
      .update({ data: updatedData, updated_at: new Date().toISOString() })
      .eq("id", habit.id);
  };

  // Toggle Monthly habit bubble for the current month
  const toggleMonthlyCheck = async (habit: HabitRecord) => {
    const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
    const existing = new Set(habit.data.monthly_completed || []);
    const isDone = existing.has(monthKey);

    if (isDone) {
      existing.delete(monthKey);
    } else {
      existing.add(monthKey);
      playPopChime();
    }

    const updatedMonths = Array.from(existing);
    const updatedData = { ...habit.data, monthly_completed: updatedMonths };

    setHabits((prev) =>
      prev.map((h) => (h.id === habit.id ? { ...h, data: updatedData } : h))
    );

    await supabase
      .from("entries")
      .update({ data: updatedData, updated_at: new Date().toISOString() })
      .eq("id", habit.id);
  };

  // Save new or edited habit
  const handleSaveHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    setSaving(true);
    setNotice(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setNotice("Please sign in again.");
        setSaving(false);
        return;
      }

      if (editingHabit) {
        const updatedData = {
          ...editingHabit.data,
          frequency: formFrequency,
          color: formColor,
        };

        await supabase
          .from("entries")
          .update({
            title: formTitle.trim(),
            data: updatedData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingHabit.id);
      } else {
        const payload = {
          user_id: user.id,
          module: "habits",
          title: formTitle.trim(),
          details: `${formFrequency.toUpperCase()} Habit`,
          entry_date: todayDateStr,
          data: {
            frequency: formFrequency,
            color: formColor,
            completed_dates: [],
            weekly_completed: [],
            monthly_completed: [],
          },
        };

        await supabase.from("entries").insert(payload);
      }

      setModalOpen(false);
      await loadHabits();
    } catch {
      setNotice("Could not save habit.");
    } finally {
      setSaving(false);
    }
  };

  // Delete habit permanently
  const deleteHabit = async (id: string, title: string) => {
    if (!window.confirm(`Delete habit "${title}"?`)) return;
    setHabits((prev) => prev.filter((h) => h.id !== id));
    await supabase.from("entries").delete().eq("id", id);
  };

  // Open modal
  const openNewModal = (defaultFreq: "daily" | "weekly" | "monthly" = "daily") => {
    setEditingHabit(null);
    setFormTitle("");
    setFormFrequency(defaultFreq);
    setFormColor(HABIT_COLORS[habits.length % HABIT_COLORS.length]);
    setModalOpen(true);
  };

  const openEditModal = (h: HabitRecord) => {
    setEditingHabit(h);
    setFormTitle(h.title);
    setFormFrequency(h.data.frequency || "daily");
    setFormColor(h.data.color || HABIT_COLORS[0]);
    setModalOpen(true);
  };

  // Switch month navigation
  const shiftMonth = (delta: number) => {
    let nextMonth = selectedMonth + delta;
    let nextYear = selectedYear;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear--;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear++;
    }
    setSelectedMonth(nextMonth);
    setSelectedYear(nextYear);
  };

  // Filter habits by category
  const dailyHabits = useMemo(() => habits.filter((h) => (h.data.frequency || "daily") === "daily"), [habits]);
  const weeklyHabits = useMemo(() => habits.filter((h) => h.data.frequency === "weekly"), [habits]);
  const monthlyHabits = useMemo(() => habits.filter((h) => h.data.frequency === "monthly"), [habits]);

  // Today's completion count
  const doneTodayCount = useMemo(() => {
    return dailyHabits.filter((h) => h.data.completed_dates?.includes(todayDateStr)).length;
  }, [dailyHabits, todayDateStr]);

  const isCurrentMonthViewed = selectedYear === todayYear && selectedMonth === todayMonthIdx;

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto selection:bg-amber-400 selection:text-black">
      {/* SPIRAL NOTEBOOK BINDER RING DECORATION (Aesthetic matching sample image) */}
      <div className="flex justify-between items-center px-6 sm:px-12 -mb-3 relative z-20 pointer-events-none">
        {Array.from({ length: 22 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            {/* Golden Metallic Spiral Ring */}
            <div className="w-2.5 sm:w-3 h-7 sm:h-8 rounded-full bg-gradient-to-r from-amber-400 via-amber-200 to-amber-600 shadow-md border border-amber-600/50" />
            <div className="w-3.5 h-1.5 rounded-full bg-slate-950 -mt-1 shadow-inner" />
          </div>
        ))}
      </div>

      {/* MASTER DESK PLANNER BOARD */}
      <div className="relative rounded-3xl border-2 border-amber-500/30 bg-[#0b101d] text-slate-100 shadow-2xl overflow-hidden p-4 sm:p-8 backdrop-blur-2xl">
        {/* Subtle lined notebook texture background */}
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:100%_32px]" />

        {/* TOP PLANNER HEADER (Matching Sample Image 2) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b-2 border-slate-700/80 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-4xl font-black tracking-wider uppercase text-white font-serif">
                HABIT TRACKER
              </h1>
              <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-0.5 text-xs font-bold">
                Daily Check-off Matrix
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Save your habits once. Every day, tap that day&apos;s bubble to check it off. Lives for infinity days!
            </p>
          </div>

          {/* Month Navigator (e.g. MONTH: November) */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-700 px-4 py-2 shadow-inner">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-serif">MONTH:</span>
              <button
                onClick={() => shiftMonth(-1)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="text-base sm:text-lg font-black text-amber-400 px-2 min-w-[120px] text-center font-serif tracking-wide">
                {monthName} {selectedYear}
              </span>

              <button
                onClick={() => shiftMonth(1)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition"
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              onClick={() => {
                setSelectedMonth(todayMonthIdx);
                setSelectedYear(todayYear);
              }}
              className={`px-3 py-2 rounded-2xl text-xs font-bold border transition ${
                isCurrentMonthViewed
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              }`}
            >
              Current Month
            </button>

            <button
              onClick={() => openNewModal("daily")}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs shadow-lg shadow-amber-500/30 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={16} />
              <span>Add Habit</span>
            </button>
          </div>
        </div>

        {/* Live Today Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 my-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-bold text-slate-300">
              <Calendar size={14} className="text-amber-400" />
              <span>Today: <strong>Day {todayDayNum} ({todayDateStr})</strong></span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5 font-bold text-emerald-400">
              <Check size={14} />
              <span>Done Today: <strong>{doneTodayCount} / {dailyHabits.length}</strong></span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setChimeEnabled(!chimeEnabled)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white transition"
              title="Toggle Audio Pop Chime"
            >
              <Volume2 size={13} className={chimeEnabled ? "text-cyan-400" : "text-slate-600"} />
              <span>Sound: {chimeEnabled ? "On" : "Muted"}</span>
            </button>

            {habits.length === 0 && (
              <button
                onClick={populateSampleTemplate}
                className="text-[11px] font-bold text-amber-400 hover:underline bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20"
              >
                Load Sample Habits (From Picture) ✨
              </button>
            )}
          </div>
        </div>

        {notice && (
          <div className="mb-4 rounded-xl bg-amber-500/20 border border-amber-500/40 p-3 text-xs text-amber-300 flex items-center justify-between">
            <span>{notice}</span>
            <button onClick={() => setNotice(null)} className="text-amber-400 hover:text-white">
              <X size={15} />
            </button>
          </div>
        )}

        {/* MAIN SECTION: DAILY HABITS (Rows 1 to 31) */}
        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between pt-2">
            <h2 className="text-sm sm:text-base font-black tracking-wider text-slate-300 uppercase font-serif">
              DAILY HABITS
            </h2>
            <span className="text-[11px] text-slate-500">
              Tap circle on day number to tick. Highlighted column = Today.
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <RefreshCw size={24} className="animate-spin mx-auto text-amber-400" />
              <p className="text-xs">Loading habits grid...</p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-4">
              <table className="w-full border-collapse select-none">
                <thead>
                  <tr className="border-b border-slate-700/80 text-[11px] font-bold text-slate-400">
                    <th className="text-left py-2 pr-4 min-w-[180px] sm:min-w-[220px] font-serif uppercase tracking-wider">
                      Habit Name
                    </th>
                    {/* Columns 1 to 31 */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dayNum = i + 1;
                      const isTodayCol = isCurrentMonthViewed && dayNum === todayDayNum;

                      return (
                        <th
                          key={dayNum}
                          className={`text-center px-1 py-1.5 w-7 min-w-[28px] font-mono text-xs ${
                            isTodayCol
                              ? "text-amber-300 bg-amber-500/20 rounded-t-xl font-black ring-1 ring-amber-500/50"
                              : "text-slate-400"
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <span>{dayNum}</span>
                            {isTodayCol && <span className="h-1 w-1 rounded-full bg-amber-400 mt-0.5" />}
                          </div>
                        </th>
                      );
                    })}
                    <th className="text-right pl-3 text-[10px] text-slate-500">Total</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/80">
                  {dailyHabits.map((habit) => {
                    const habitColor = habit.data.color || HABIT_COLORS[0];
                    const completedDates = new Set(habit.data.completed_dates || []);

                    // Count total done in this month
                    let monthDoneCount = 0;
                    for (let d = 1; d <= daysInMonth; d++) {
                      const dStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(d).padStart(
                        2,
                        "0"
                      )}`;
                      if (completedDates.has(dStr)) monthDoneCount++;
                    }

                    return (
                      <tr key={habit.id} className="group hover:bg-slate-900/40 transition">
                        {/* Habit Title with Ruled Line Aesthetic */}
                        <td className="py-2.5 pr-4 text-left">
                          <div className="flex items-center justify-between gap-2 border-b border-dashed border-slate-700/60 pb-1">
                            <span
                              className="font-serif text-xs sm:text-sm font-semibold truncate transition group-hover:text-white"
                              style={{ color: habitColor }}
                              title={habit.title}
                            >
                              {habit.title}
                            </span>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                              <button
                                onClick={() => openEditModal(habit)}
                                className="p-1 text-slate-400 hover:text-white transition"
                                title="Edit"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                onClick={() => deleteHabit(habit.id, habit.title)}
                                className="p-1 text-slate-400 hover:text-rose-400 transition"
                                title="Delete"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* 1 to 31 Day Check Bubbles */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                          const dayNum = i + 1;
                          const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(
                            dayNum
                          ).padStart(2, "0")}`;
                          const isDone = completedDates.has(dateKey);
                          const isTodayCol = isCurrentMonthViewed && dayNum === todayDayNum;

                          return (
                            <td
                              key={dayNum}
                              className={`text-center p-0.5 ${isTodayCol ? "bg-amber-500/10" : ""}`}
                            >
                              <button
                                onClick={() => toggleDailyDay(habit, dayNum)}
                                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full mx-auto flex items-center justify-center transition-all cursor-pointer ${
                                  isDone
                                    ? "scale-105 shadow-md shadow-black/40 ring-2 ring-white/30"
                                    : "border border-slate-700 hover:border-slate-400 bg-black/20 hover:scale-110"
                                }`}
                                style={{
                                  backgroundColor: isDone ? habitColor : "transparent",
                                }}
                                title={`${habit.title} - Day ${dayNum} (${dateKey}): ${
                                  isDone ? "Done (Tap to uncheck)" : "Tap to mark done"
                                }`}
                              >
                                {isDone && <Check size={12} className="text-slate-950 stroke-[3.5]" />}
                              </button>
                            </td>
                          );
                        })}

                        {/* Row Month Total */}
                        <td className="text-right pl-3 font-mono text-[11px] font-bold text-slate-400">
                          {monthDoneCount}/{daysInMonth}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="pt-3">
                <button
                  onClick={() => openNewModal("daily")}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 hover:underline inline-flex items-center gap-1.5"
                >
                  <Plus size={14} /> Add Another Daily Habit
                </button>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM SECTION: 3 COLUMNS (WEEKLY, MONTHLY, NOTES - Exact Replica of Sample Image) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 mt-6 border-t-2 border-slate-700/80 relative z-10">
          {/* COLUMN 1: WEEKLY HABITS */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 font-serif">
                WEEKLY
              </h3>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                <span>W1</span>
                <span>W2</span>
                <span>W3</span>
                <span>W4</span>
                <span>W5</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {weeklyHabits.map((habit) => {
                const habitColor = habit.data.color || "#10b981";
                const completedWeeks = new Set(habit.data.weekly_completed || []);

                return (
                  <div key={habit.id} className="flex items-center justify-between gap-2 text-xs">
                    <span
                      className="font-serif truncate border-b border-dashed border-slate-700/60 flex-1 pb-0.5"
                      style={{ color: habitColor }}
                    >
                      {habit.title}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      {[1, 2, 3, 4, 5].map((w) => {
                        const done = completedWeeks.has(w);
                        return (
                          <button
                            key={w}
                            onClick={() => toggleWeeklyCheck(habit, w)}
                            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                              done
                                ? "shadow-sm ring-1 ring-white/30"
                                : "border border-slate-700 hover:border-slate-400 bg-black/20"
                            }`}
                            style={{ backgroundColor: done ? habitColor : "transparent" }}
                            title={`Week ${w}: ${done ? "Done" : "Tap to tick"}`}
                          >
                            {done && <Check size={11} className="text-slate-950 stroke-[3]" />}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => deleteHabit(habit.id, habit.title)}
                        className="text-slate-600 hover:text-rose-400 ml-1"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={() => openNewModal("weekly")}
                className="text-[11px] font-semibold text-cyan-400 hover:underline inline-flex items-center gap-1 pt-1"
              >
                <Plus size={12} /> Add Weekly Habit
              </button>
            </div>
          </div>

          {/* COLUMN 2: MONTHLY GOALS */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 font-serif">
                MONTHLY
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Status</span>
            </div>

            <div className="space-y-2.5">
              {monthlyHabits.map((habit) => {
                const habitColor = habit.data.color || "#f43f5e";
                const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
                const done = habit.data.monthly_completed?.includes(monthKey);

                return (
                  <div key={habit.id} className="flex items-center justify-between gap-2 text-xs">
                    <span
                      className="font-serif truncate border-b border-dashed border-slate-700/60 flex-1 pb-0.5"
                      style={{ color: habitColor }}
                    >
                      {habit.title}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleMonthlyCheck(habit)}
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          done
                            ? "shadow-sm ring-1 ring-white/30"
                            : "border border-slate-700 hover:border-slate-400 bg-black/20"
                        }`}
                        style={{ backgroundColor: done ? habitColor : "transparent" }}
                        title={`${habit.title} (${monthName}): ${done ? "Done" : "Tap to tick"}`}
                      >
                        {done && <Check size={11} className="text-slate-950 stroke-[3]" />}
                      </button>
                      <button
                        onClick={() => deleteHabit(habit.id, habit.title)}
                        className="text-slate-600 hover:text-rose-400 ml-1"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={() => openNewModal("monthly")}
                className="text-[11px] font-semibold text-rose-400 hover:underline inline-flex items-center gap-1 pt-1"
              >
                <Plus size={12} /> Add Monthly Goal
              </button>
            </div>
          </div>

          {/* COLUMN 3: NOTES & REFLECTIONS (Ruled lined notebook style) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 font-serif">
                  NOTES &amp; MOTIVATION
                </h3>
                <span className="text-[10px] text-slate-400">Monthly Focus</span>
              </div>

              <textarea
                value={monthlyNotes}
                onChange={(e) => setMonthlyNotes(e.target.value)}
                rows={4}
                className="w-full bg-transparent border-0 text-xs sm:text-sm font-serif italic text-amber-200 focus:outline-none resize-none leading-relaxed"
                placeholder="Write your focus for this month..."
              />
            </div>

            <p className="text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/80">
              💡 Small daily improvements lead to a lifelong habit of success!
            </p>
          </div>
        </div>
      </div>

      {/* MODAL: ADD / EDIT HABIT */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-[#0d1322] p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white font-serif uppercase tracking-wider">
                {editingHabit ? "Edit Habit" : "Add New Habit to Tracker"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Habit Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 8 hours sleep, morning run, drink enough water"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tracker Section</label>
                <select
                  value={formFrequency}
                  onChange={(e) => setFormFrequency(e.target.value as "daily" | "weekly" | "monthly")}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="daily">Daily Habits (Days 1 to 31)</option>
                  <option value="weekly">Weekly Habits (Weeks 1 to 5)</option>
                  <option value="monthly">Monthly Goals (1 check per month)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Row Accent Color</label>
                <div className="flex flex-wrap items-center gap-2">
                  {HABIT_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setFormColor(col)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        formColor === col ? "scale-125 ring-2 ring-white shadow-lg" : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary px-5 py-2 text-xs font-bold flex items-center gap-2"
                >
                  {saving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                  <span>{editingHabit ? "Save Changes" : "Add to Tracker"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
