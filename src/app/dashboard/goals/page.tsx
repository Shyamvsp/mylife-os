"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Flame,
  Check,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  X,
  Target,
  CheckCircle2,
  Activity,
  Pencil,
} from "lucide-react";

interface HabitEntry {
  id: string;
  title: string;
  details: string | null;
  entry_date: string;
  created_at: string;
  data: {
    category?: string;
    frequency?: string;
    target?: string;
    color?: string;
    emoji?: string;
    is_infinite?: boolean;
    completed_dates?: string[];
    notes?: string;
  };
}

const PRESET_HABITS = [
  { title: "💧 Drink 3L Water", category: "Health", emoji: "💧", color: "#06b6d4", target: "3 Liters" },
  { title: "🏃 Morning Run / Workout", category: "Fitness", emoji: "🏃", color: "#10b981", target: "30 Mins" },
  { title: "📚 Read 20 Pages", category: "Learning", emoji: "📚", color: "#8b5cf6", target: "20 Pages" },
  { title: "💻 Code & Build Projects", category: "Productivity", emoji: "💻", color: "#3b82f6", target: "1 Hour" },
  { title: "🧘 Meditation & Breathwork", category: "Mindfulness", emoji: "🧘", color: "#f59e0b", target: "10 Mins" },
  { title: "🛌 Sleep by 11:00 PM", category: "Health", emoji: "🛌", color: "#ec4899", target: "8 Hours" },
];

export default function GoalsAndHabitsPage() {
  const supabase = useMemo(() => createClient(), []);

  // Today string in local YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Selected date for viewing / checking habits (Defaults to today)
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Habits state
  const [habits, setHabits] = useState<HabitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Modal State for Adding / Editing Habit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitEntry | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("Health");
  const [formFrequency, setFormFrequency] = useState("Daily");
  const [formTarget, setFormTarget] = useState("");
  const [formEmoji, setFormEmoji] = useState("⚡");
  const [formColor, setFormColor] = useState("#10b981");
  const [formNotes, setFormNotes] = useState("");

  // Active view tab: "daily" | "history" | "matrix"
  const [activeTab, setActiveTab] = useState<"daily" | "history" | "matrix">("daily");

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
      } else if (data) {
        // Map entries to ensure completed_dates is initialized
        const loaded = data.map((item) => {
          const d = (item.data as Record<string, unknown>) || {};
          const completedDates = Array.isArray(d.completed_dates) ? (d.completed_dates as string[]) : [];
          // Backward compatibility: if single entry_date was completed
          if (d.completed === "Yes" && item.entry_date && !completedDates.includes(item.entry_date)) {
            completedDates.push(item.entry_date);
          }
          return {
            id: item.id,
            title: item.title,
            details: item.details,
            entry_date: item.entry_date,
            created_at: item.created_at,
            data: {
              ...d,
              completed_dates: completedDates,
              is_infinite: true,
            },
          } as HabitEntry;
        });
        setHabits(loaded);
      }
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadHabits();
  }, [loadHabits]);

  // Helper to format date nicely
  const formatDateLabel = (dateStr: string) => {
    if (dateStr === todayStr) return "Today";
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (
      yesterday.getFullYear() === y &&
      yesterday.getMonth() === m - 1 &&
      yesterday.getDate() === d
    ) {
      return "Yesterday";
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (
      tomorrow.getFullYear() === y &&
      tomorrow.getMonth() === m - 1 &&
      tomorrow.getDate() === d
    ) {
      return "Tomorrow";
    }
    return dateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  // Generate 7-day movement window centered around selectedDate
  const movementDays = useMemo(() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const center = new Date(y, m - 1, d);
    const days: { dateStr: string; dayName: string; dayNum: number; isToday: boolean; isSelected: boolean }[] = [];

    for (let offset = -3; offset <= 3; offset++) {
      const cur = new Date(center);
      cur.setDate(center.getDate() + offset);
      const curStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(
        cur.getDate()
      ).padStart(2, "0")}`;
      days.push({
        dateStr: curStr,
        dayName: cur.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: cur.getDate(),
        isToday: curStr === todayStr,
        isSelected: curStr === selectedDate,
      });
    }
    return days;
  }, [selectedDate, todayStr]);

  // Navigate date backwards/forwards
  const shiftDate = (delta: number) => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const cur = new Date(y, m - 1, d);
    cur.setDate(cur.getDate() + delta);
    const newStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(
      cur.getDate()
    ).padStart(2, "0")}`;
    setSelectedDate(newStr);
  };

  // Calculate streak for a habit
  const computeStreak = useCallback(
    (completedDates: string[] = []) => {
      if (!completedDates.length) return { current: 0, best: 0, total: 0 };
      const dateSet = new Set(completedDates);
      const total = completedDates.length;

      // Current Streak calculation
      let current = 0;
      const [todayY, todayM, todayD] = todayStr.split("-").map(Number);
      const checkDate = new Date(todayY, todayM - 1, todayD);

      // If today is completed, start from today. If not, check if yesterday was completed.
      if (!dateSet.has(todayStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      while (true) {
        const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(
          checkDate.getDate()
        ).padStart(2, "0")}`;
        if (dateSet.has(dateStr)) {
          current++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      // Best streak calculation
      const sortedDates = Array.from(dateSet).sort();
      let best = 0;
      let tempStreak = 0;
      let prevTime: number | null = null;

      for (const d of sortedDates) {
        const [yy, mm, dd] = d.split("-").map(Number);
        const time = new Date(yy, mm - 1, dd).getTime();
        if (prevTime === null) {
          tempStreak = 1;
        } else {
          const diffDays = Math.round((time - prevTime) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            tempStreak++;
          } else if (diffDays > 1) {
            tempStreak = 1;
          }
        }
        prevTime = time;
        if (tempStreak > best) best = tempStreak;
      }

      return { current, best: Math.max(best, current), total };
    },
    [todayStr]
  );

  // Toggle habit completion on the selected date
  const toggleHabitOnDate = async (habit: HabitEntry, dateToToggle: string) => {
    const existing = new Set(habit.data.completed_dates || []);
    const isCompleted = existing.has(dateToToggle);

    if (isCompleted) {
      existing.delete(dateToToggle);
    } else {
      existing.add(dateToToggle);
    }

    const updatedDates = Array.from(existing).sort();
    const streakInfo = computeStreak(updatedDates);

    const updatedData = {
      ...habit.data,
      completed_dates: updatedDates,
      is_infinite: true,
      current_streak: streakInfo.current,
      best_streak: streakInfo.best,
      completed: updatedDates.includes(todayStr) ? "Yes" : "No",
    };

    // Optimistic UI update
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habit.id
          ? {
              ...h,
              data: updatedData,
            }
          : h
      )
    );

    // Save to Supabase
    try {
      const { error } = await supabase
        .from("entries")
        .update({
          data: updatedData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", habit.id);

      if (error) {
        console.error("Error updating habit:", error);
        setNotice("Could not save habit check. Please check connection.");
      }
    } catch {
      setNotice("Network error while saving.");
    }
  };

  // Save new habit or edit existing
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
        setNotice("Please sign in again to save.");
        setSaving(false);
        return;
      }

      if (editingHabit) {
        // Edit existing
        const updatedData = {
          ...editingHabit.data,
          category: formCategory,
          frequency: formFrequency,
          target: formTarget,
          emoji: formEmoji,
          color: formColor,
          notes: formNotes,
        };

        const { error } = await supabase
          .from("entries")
          .update({
            title: formTitle.trim(),
            details: formNotes.trim() || `${formCategory} • ${formFrequency}`,
            data: updatedData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingHabit.id);

        if (error) {
          setNotice(error.message);
        } else {
          setModalOpen(false);
          await loadHabits();
        }
      } else {
        // Create brand new perpetual habit
        const payload = {
          user_id: user.id,
          module: "habits",
          title: formTitle.trim(),
          details: formNotes.trim() || `${formCategory} • ${formFrequency}`,
          entry_date: todayStr,
          data: {
            category: formCategory,
            frequency: formFrequency,
            target: formTarget,
            emoji: formEmoji,
            color: formColor,
            is_infinite: true,
            completed_dates: [],
            current_streak: 0,
            best_streak: 0,
            notes: formNotes,
          },
        };

        const { error } = await supabase.from("entries").insert(payload);

        if (error) {
          setNotice(error.message);
        } else {
          setModalOpen(false);
          await loadHabits();
        }
      }
    } catch (err) {
      console.error(err);
      setNotice("An unexpected error occurred while saving habit.");
    } finally {
      setSaving(false);
    }
  };

  // Delete habit permanently
  const deleteHabit = async (id: string, title: string) => {
    if (!window.confirm(`Delete habit "${title}" permanently? This cannot be undone.`)) return;

    setHabits((prev) => prev.filter((h) => h.id !== id));

    const { error } = await supabase.from("entries").delete().eq("id", id);
    if (error) {
      setNotice("Could not delete habit from cloud.");
      await loadHabits();
    }
  };

  // Open modal for new habit
  const openNewModal = () => {
    setEditingHabit(null);
    setFormTitle("");
    setFormCategory("Health");
    setFormFrequency("Daily");
    setFormTarget("");
    setFormEmoji("⚡");
    setFormColor("#10b981");
    setFormNotes("");
    setModalOpen(true);
  };

  // Open modal for editing habit
  const openEditModal = (h: HabitEntry) => {
    setEditingHabit(h);
    setFormTitle(h.title);
    setFormCategory(h.data.category || "Health");
    setFormFrequency(h.data.frequency || "Daily");
    setFormTarget(h.data.target || "");
    setFormEmoji(h.data.emoji || "⚡");
    setFormColor(h.data.color || "#10b981");
    setFormNotes(h.data.notes || h.details || "");
    setModalOpen(true);
  };

  // Quick Add from Presets
  const addPresetHabit = async (preset: typeof PRESET_HABITS[0]) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
        user_id: user.id,
        module: "habits",
        title: preset.title,
        details: `${preset.category} • Daily Routine`,
        entry_date: todayStr,
        data: {
          category: preset.category,
          frequency: "Daily",
          target: preset.target,
          emoji: preset.emoji,
          color: preset.color,
          is_infinite: true,
          completed_dates: [],
          current_streak: 0,
          best_streak: 0,
        },
      };

      await supabase.from("entries").insert(payload);
      await loadHabits();
    } catch (e) {
      console.error(e);
    }
  };

  // Count completions on selected date
  const completedOnSelectedDate = useMemo(() => {
    return habits.filter((h) => h.data.completed_dates?.includes(selectedDate)).length;
  }, [habits, selectedDate]);

  // Overall stats
  const totalHabits = habits.length;
  const completionPercentage = totalHabits > 0 ? Math.round((completedOnSelectedDate / totalHabits) * 100) : 0;

  // Maximum streak among all habits
  const topStreak = useMemo(() => {
    if (!habits.length) return 0;
    return Math.max(...habits.map((h) => computeStreak(h.data.completed_dates).current), 0);
  }, [habits, computeStreak]);

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* TOP HEADER SECTION */}
      <div className="relative overflow-hidden rounded-3xl border border-fuchsia-500/20 bg-gradient-to-r from-fuchsia-950/40 via-purple-950/30 to-[#070b14] p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={14} /> Perpetual Habit Engine • Infinity Days
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Habits &amp; Goals <span className="bg-gradient-to-r from-fuchsia-400 to-amber-400 bg-clip-text text-transparent">Tracker</span>
            </h1>
            <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
              Every habit lives for infinity days. Tick off today, review past movements, or inspect future routines anytime without creating duplicate entries.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openNewModal}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold px-5 py-3 rounded-2xl text-sm shadow-lg shadow-fuchsia-600/30 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={18} />
              <span>Add New Habit</span>
            </button>

            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-4 py-3 rounded-2xl text-xs font-bold border transition ${
                selectedDate === todayStr
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              Jump to Today
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Active Habits</span>
              <Activity size={16} className="text-fuchsia-400" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">{totalHabits}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Lives for infinity days</p>
          </div>

          <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Checked on {formatDateLabel(selectedDate)}</span>
              <CheckCircle2 size={16} className="text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-400">
              {completedOnSelectedDate} / {totalHabits}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{completionPercentage}% done</p>
          </div>

          <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Top Active Streak</span>
              <Flame size={16} className="text-amber-400" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-400">🔥 {topStreak} Days</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Continuous momentum</p>
          </div>

          <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Selected Date</span>
              <Calendar size={16} className="text-cyan-400" />
            </div>
            <div className="mt-2 text-lg sm:text-xl font-bold text-cyan-300 truncate">
              {formatDateLabel(selectedDate)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{selectedDate}</p>
          </div>
        </div>
      </div>

      {notice && (
        <div className="rounded-2xl bg-amber-500/15 border border-amber-500/30 p-4 text-xs text-amber-300 flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-amber-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      {/* MOVEMENTS & DATE STRIP CAROUSEL (The Core Requirement) */}
      <div className="panel p-5 border-slate-800 bg-slate-900/60 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="text-fuchsia-400" size={18} />
            <h3 className="font-bold text-sm text-white">Date Movements &amp; Calendar Strip</h3>
            <span className="text-[11px] font-semibold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
              Browse before days &amp; after days
            </span>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => shiftDate(-1)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition"
              title="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-black/40 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-fuchsia-500 font-mono"
            />

            <button
              onClick={() => shiftDate(1)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition"
              title="Next Day"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* 7-Day Horizontal Strip */}
        <div className="grid grid-cols-7 gap-2 pt-2">
          {movementDays.map((d) => {
            const countDone = habits.filter((h) => h.data.completed_dates?.includes(d.dateStr)).length;
            const allDone = totalHabits > 0 && countDone === totalHabits;
            const partialDone = countDone > 0 && !allDone;

            return (
              <button
                key={d.dateStr}
                onClick={() => setSelectedDate(d.dateStr)}
                className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                  d.isSelected
                    ? "bg-fuchsia-500/20 border-fuchsia-500 shadow-lg shadow-fuchsia-500/20 text-white scale-[1.02]"
                    : d.isToday
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                    : "bg-black/20 border-white/5 text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider">{d.dayName}</span>
                <span className="text-lg font-black mt-1">{d.dayNum}</span>

                {/* Completion Indicator Dot */}
                <div className="mt-2 flex items-center gap-1">
                  {allDone ? (
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                  ) : partialDone ? (
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                  )}
                </div>

                {d.isToday && (
                  <span className="absolute -top-2 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.2 shadow">
                    TODAY
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW TABS */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 text-xs font-bold">
        <button
          onClick={() => setActiveTab("daily")}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === "daily"
              ? "bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <CheckCircle2 size={15} />
          <span>Daily Check-off ({formatDateLabel(selectedDate)})</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === "history"
              ? "bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <TrendingUp size={15} />
          <span>Before Days &amp; Streaks</span>
        </button>

        <button
          onClick={() => setActiveTab("matrix")}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === "matrix"
              ? "bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Target size={15} />
          <span>Monthly Consistency Matrix</span>
        </button>
      </div>

      {/* TAB 1: DAILY CHECK-OFF FOR SELECTED DATE */}
      {activeTab === "daily" && (
        <div className="space-y-4">
          {loading ? (
            <div className="panel p-12 text-center text-slate-400 space-y-3">
              <RefreshCw size={24} className="animate-spin mx-auto text-fuchsia-400" />
              <p className="text-sm">Loading your infinity habits from database...</p>
            </div>
          ) : habits.length === 0 ? (
            <div className="panel p-12 text-center border-dashed border-slate-700 bg-slate-900/30 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-fuchsia-500/10 text-fuchsia-400 mx-auto flex items-center justify-center font-bold text-2xl shadow-inner">
                🎯
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">No Habits Created Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Add your first long-lived habit. It will automatically exist for infinity days and you can tick it every day.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={openNewModal}
                  className="btn btn-primary px-6 py-2.5 text-xs font-bold inline-flex items-center gap-2"
                >
                  <Plus size={16} /> Create Your First Habit
                </button>
              </div>

              {/* Quick Presets */}
              <div className="pt-6 border-t border-white/5 space-y-3">
                <span className="text-xs text-slate-400 font-semibold block">Or click to add popular presets:</span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {PRESET_HABITS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => addPresetHabit(p)}
                      className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs text-slate-300 hover:text-white font-medium transition flex items-center gap-1.5"
                    >
                      <Plus size={13} className="text-fuchsia-400" />
                      <span>{p.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {habits.map((h) => {
                const isDoneOnDate = h.data.completed_dates?.includes(selectedDate);
                const streak = computeStreak(h.data.completed_dates);

                return (
                  <div
                    key={h.id}
                    className={`rounded-2xl border p-5 transition-all relative overflow-hidden group ${
                      isDoneOnDate
                        ? "bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-950/90 border-emerald-500/50 shadow-lg shadow-emerald-950/40"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Icon, Title, Details */}
                      <div className="flex items-start gap-3.5">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-md shrink-0 border border-white/10"
                          style={{
                            background: isDoneOnDate ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.05)",
                          }}
                        >
                          {h.data.emoji || "⚡"}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4
                              className={`text-base font-bold transition ${
                                isDoneOnDate ? "text-emerald-200 line-through decoration-emerald-500/50" : "text-white"
                              }`}
                            >
                              {h.title}
                            </h4>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-medium text-slate-400 border border-white/10">
                              {h.data.category || "General"}
                            </span>
                            {h.data.target && (
                              <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-medium text-cyan-400 border border-white/10">
                                Target: {h.data.target}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                              <Flame size={13} /> {streak.current}d streak
                            </span>
                          </div>

                          {h.details && <p className="text-xs text-slate-400 pt-1 leading-relaxed">{h.details}</p>}
                        </div>
                      </div>

                      {/* Right: Big One-Tap Checkbox */}
                      <button
                        onClick={() => toggleHabitOnDate(h, selectedDate)}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                          isDoneOnDate
                            ? "bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/30 scale-105 active:scale-95"
                            : "bg-white/5 hover:bg-white/15 text-slate-500 hover:text-white border-2 border-dashed border-slate-700 hover:border-fuchsia-400"
                        }`}
                        title={isDoneOnDate ? "Marked as done (Tap to unmark)" : "Tap to complete for selected date"}
                      >
                        <Check size={24} className={isDoneOnDate ? "stroke-[3.5]" : "opacity-40"} />
                      </button>
                    </div>

                    {/* Bottom: 7-day mini momentum dots & actions */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      {/* Mini before-days dots */}
                      <div className="flex items-center gap-1.5" title="Recent 7-Day Completion Flow">
                        {movementDays.map((d) => {
                          const done = h.data.completed_dates?.includes(d.dateStr);
                          return (
                            <button
                              key={d.dateStr}
                              onClick={() => toggleHabitOnDate(h, d.dateStr)}
                              className={`w-4 h-4 rounded-md flex items-center justify-center text-[9px] font-bold transition ${
                                done
                                  ? "bg-emerald-500 text-black shadow-sm"
                                  : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                              } ${d.isSelected ? "ring-2 ring-fuchsia-400" : ""}`}
                              title={`${d.dayName} (${d.dateStr}): ${done ? "Done" : "Pending"}`}
                            >
                              {done ? "✓" : "·"}
                            </button>
                          );
                        })}
                        <span className="text-[10px] text-slate-500 ml-1">Past 7d</span>
                      </div>

                      {/* Edit / Delete Options */}
                      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition">
                        <button
                          onClick={() => openEditModal(h)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                          title="Edit Habit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => deleteHabit(h.id, h.title)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                          title="Delete Habit"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BEFORE DAYS & HISTORICAL STREAKS */}
      {activeTab === "history" && (
        <div className="panel p-6 border-slate-800 bg-slate-900/60 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Before Days Habit Records &amp; Consistency</h3>
              <p className="text-xs text-slate-400">
                Detailed audit trail of past completions, all-time best streaks, and total completion counts.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-3">Habit</th>
                  <th className="pb-3 px-3">Category</th>
                  <th className="pb-3 px-3">Current Streak</th>
                  <th className="pb-3 px-3">Best Streak</th>
                  <th className="pb-3 px-3">Total Days Completed</th>
                  <th className="pb-3 px-3">Status Today</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {habits.map((h) => {
                  const s = computeStreak(h.data.completed_dates);
                  const isDoneToday = h.data.completed_dates?.includes(todayStr);

                  return (
                    <tr key={h.id} className="hover:bg-white/5 transition">
                      <td className="py-3.5 px-3 font-semibold text-white flex items-center gap-2">
                        <span>{h.data.emoji || "⚡"}</span>
                        <span>{h.title}</span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-400">{h.data.category || "General"}</td>
                      <td className="py-3.5 px-3 font-bold text-amber-400">🔥 {s.current} days</td>
                      <td className="py-3.5 px-3 font-bold text-purple-400">🏆 {s.best} days</td>
                      <td className="py-3.5 px-3 font-bold text-cyan-400">📈 {s.total} days</td>
                      <td className="py-3.5 px-3">
                        {isDoneToday ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                            ✓ Done Today
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 text-slate-400 px-2.5 py-0.5 text-[11px] font-medium">
                            Pending Today
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MONTHLY CONSISTENCY MATRIX */}
      {activeTab === "matrix" && (
        <div className="panel p-6 border-slate-800 bg-slate-900/60 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Monthly Habit Heatmap Matrix</h3>
              <p className="text-xs text-slate-400">
                Visualizing completion density for the past 30 days across all your infinity habits.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {habits.map((h) => {
              const completedSet = new Set(h.data.completed_dates || []);
              const past30Days: string[] = [];
              const d = new Date();
              for (let i = 29; i >= 0; i--) {
                const cur = new Date(d);
                cur.setDate(d.getDate() - i);
                const str = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(
                  cur.getDate()
                ).padStart(2, "0")}`;
                past30Days.push(str);
              }

              return (
                <div key={h.id} className="rounded-xl border border-white/5 bg-black/20 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-2">
                      <span>{h.data.emoji || "⚡"}</span>
                      <span>{h.title}</span>
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {h.data.completed_dates?.length || 0} total checks
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {past30Days.map((dateStr) => {
                      const done = completedSet.has(dateStr);
                      const isSel = dateStr === selectedDate;
                      return (
                        <button
                          key={dateStr}
                          onClick={() => {
                            setSelectedDate(dateStr);
                            toggleHabitOnDate(h, dateStr);
                          }}
                          className={`w-6 h-6 rounded-md text-[10px] font-bold transition flex items-center justify-center ${
                            done
                              ? "bg-emerald-500 text-black shadow-sm"
                              : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                          } ${isSel ? "ring-2 ring-fuchsia-400" : ""}`}
                          title={`${dateStr}: ${done ? "Done (Tap to uncheck)" : "Pending (Tap to check)"}`}
                        >
                          {done ? "✓" : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT HABIT */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-[#0d1322] p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Target className="text-fuchsia-400" size={20} />
                <h3 className="text-lg font-bold text-white">
                  {editingHabit ? "Edit Infinity Habit" : "Create Infinity Habit"}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Habit Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Drink 3L Water, Read 20 Pages, Morning Workout"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-fuchsia-500"
                  >
                    <option value="Health">Health &amp; Wellness</option>
                    <option value="Fitness">Fitness &amp; Gym</option>
                    <option value="Learning">Learning &amp; Study</option>
                    <option value="Productivity">Productivity &amp; Code</option>
                    <option value="Mindfulness">Mindfulness &amp; Zen</option>
                    <option value="Finance">Finance &amp; Budget</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Emoji Icon</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={formEmoji}
                    onChange={(e) => setFormEmoji(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-center text-lg text-white focus:outline-none focus:border-fuchsia-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Frequency</label>
                  <select
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-fuchsia-500"
                  >
                    <option value="Daily">Daily (Every Day)</option>
                    <option value="Weekdays">Weekdays (Mon-Fri)</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Daily Target (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 3 Liters, 30 mins"
                    value={formTarget}
                    onChange={(e) => setFormTarget(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-fuchsia-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Motivation</label>
                <textarea
                  rows={2}
                  placeholder="Why is this habit important to you?"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs text-white focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary px-6 py-2.5 text-xs font-bold flex items-center gap-2"
                >
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{editingHabit ? "Save Changes" : "Create Infinity Habit"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
