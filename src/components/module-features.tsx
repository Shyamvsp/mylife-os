"use client";

import { useState, useEffect } from "react";
import type { ModuleKey } from "@/lib/modules";
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Flame,
  Droplets,
  Dumbbell,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Award,
  Wallet,
  Clock,
  Check,
} from "lucide-react";

interface ModuleFeaturesProps {
  moduleKey: ModuleKey | string;
  onQuickAdd: (title: string, data: Record<string, string>) => void;
}

export function ModuleFeatures({ moduleKey, onQuickAdd }: ModuleFeaturesProps) {
  // Pomodoro timer state for Study
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  // Water intake tracker for Fitness
  const [waterGlasses, setWaterGlasses] = useState(4);

  // Mood selector for Journal
  const [selectedMood, setSelectedMood] = useState("🔥 Unstoppable");

  // Kanban tasks for Projects
  const [activeTab, setActiveTab] = useState<"all" | "in_progress" | "done">("all");

  // Habits 7-day checklist state
  const [habitChecks, setHabitChecks] = useState<Record<string, boolean>>({
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: false,
    sat: false,
    sun: false,
  });

  // Pomodoro interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds((s) => s - 1), 1000);
    } else if (timerSeconds === 0) {
      setTimerRunning(false);
      alert("🎉 Focus session completed! Great study work.");
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  // 1. STUDY MODULE
  if (moduleKey === "study") {
    return (
      <div className="panel p-5 space-y-4 border-indigo-500/20 bg-gradient-to-r from-indigo-950/20 via-blue-950/10 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-600 text-white font-mono text-lg font-bold shadow-md shadow-indigo-600/30">
              <Clock size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">Pomodoro Focus Timer</h3>
                <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-bold text-indigo-400">
                  {timerRunning ? "Focusing..." : "Ready"}
                </span>
              </div>
              <p className="text-xs muted">25-minute deep learning sprint with auto-pause</p>
            </div>
          </div>

          {/* Timer Display & Controls */}
          <div className="flex items-center gap-3">
            <div className="font-mono text-3xl font-extrabold text-indigo-400 tracking-wider">
              {formatTimer(timerSeconds)}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setTimerRunning(!timerRunning)}
                className="btn btn-primary !py-1.5 !px-3 text-xs font-bold flex items-center gap-1"
              >
                {timerRunning ? <Pause size={14} /> : <Play size={14} />}
                {timerRunning ? "Pause" : "Start"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimerRunning(false);
                  setTimerSeconds(25 * 60);
                }}
                className="btn btn-ghost !p-2 text-xs"
                title="Reset to 25m"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Study Session Chips */}
        <div className="border-t pt-3 flex flex-wrap items-center gap-2" style={{ borderColor: "var(--line)" }}>
          <span className="text-xs muted font-semibold">1-Tap Log Study Session:</span>
          {[
            { name: "React 19 & Next.js", duration: "60" },
            { name: "Data Structures & Algorithms", duration: "90" },
            { name: "System Design & Architecture", duration: "45" },
            { name: "TypeScript Advanced", duration: "60" },
          ].map((sub, i) => (
            <button
              key={i}
              type="button"
              onClick={() =>
                onQuickAdd(`${sub.name} Study Sprint`, {
                  subject: sub.name,
                  duration_minutes: sub.duration,
                  status: "Completed",
                  notes: `Completed ${sub.duration} mins focus session on ${sub.name}.`,
                })
              }
              className="rounded-lg border px-2.5 py-1 text-xs font-medium hover:bg-indigo-600 hover:text-white transition flex items-center gap-1"
              style={{ borderColor: "var(--line)", background: "var(--background)" }}
            >
              <Plus size={12} /> {sub.name} ({sub.duration}m)
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 2. FITNESS MODULE
  if (moduleKey === "fitness") {
    return (
      <div className="panel p-5 space-y-4 border-emerald-500/20 bg-gradient-to-r from-emerald-950/20 via-teal-950/10 to-transparent">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Gym Workout Split Quick Selector */}
          <div className="sm:col-span-2 space-y-2">
            <div className="flex items-center gap-2">
              <Dumbbell className="text-emerald-500" size={18} />
              <h3 className="font-bold text-sm">Quick Workout Logger</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { name: "Chest & Triceps", cals: "380", dur: "45" },
                { name: "Back & Biceps", cals: "410", dur: "50" },
                { name: "Legs & Core Power", cals: "450", dur: "55" },
                { name: "HIIT & Cardio 5km", cals: "350", dur: "30" },
              ].map((split, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() =>
                    onQuickAdd(`${split.name} Session`, {
                      workout: split.name,
                      calories: split.cals,
                      duration_minutes: split.dur,
                      notes: `Completed ${split.dur} mins ${split.name} burning ${split.cals} kcal.`,
                    })
                  }
                  className="rounded-xl border px-3 py-1.5 text-xs font-semibold hover:bg-emerald-600 hover:text-white transition flex items-center gap-1.5"
                  style={{ borderColor: "var(--line)", background: "var(--background)" }}
                >
                  <Flame size={13} className="text-amber-500" />
                  <span>{split.name}</span>
                  <span className="text-[10px] muted">({split.cals} kcal)</span>
                </button>
              ))}
            </div>
          </div>

          {/* Water Intake Tracker */}
          <div className="rounded-xl border p-3 bg-black/10 dark:bg-black/30 space-y-2" style={{ borderColor: "var(--line)" }}>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1 text-cyan-400">
                <Droplets size={14} /> Water Intake
              </span>
              <span>{waterGlasses} / 8 Glasses ({(waterGlasses * 0.25).toFixed(1)}L)</span>
            </div>
            <div className="flex items-center justify-between gap-1">
              {Array.from({ length: 8 }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setWaterGlasses(idx + 1)}
                  className={`h-7 flex-1 rounded-md transition ${
                    idx < waterGlasses ? "bg-cyan-500 text-white shadow-sm" : "bg-white/10 hover:bg-white/20"
                  }`}
                  title={`Glass ${idx + 1}`}
                >
                  💧
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. SKILLS MODULE
  if (moduleKey === "skills") {
    return (
      <div className="panel p-5 space-y-4 border-purple-500/20 bg-gradient-to-r from-purple-950/20 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="text-purple-400" size={18} />
            <h3 className="font-bold text-sm">Tech Proficiency Radar</h3>
          </div>
          <span className="text-xs font-bold text-purple-400">Master Level</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { skill: "Next.js 15 & React", pct: 95, level: "Master" },
            { skill: "TypeScript & Zod", pct: 92, level: "Master" },
            { skill: "AI Agent Engineering", pct: 88, level: "Advanced" },
            { skill: "Supabase & PostgreSQL", pct: 85, level: "Advanced" },
          ].map((s, i) => (
            <div key={i} className="rounded-xl border p-3 bg-black/10 dark:bg-black/30 space-y-1.5" style={{ borderColor: "var(--line)" }}>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="truncate">{s.skill}</span>
                <span className="text-purple-400 font-mono text-[11px]">{s.pct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style={{ width: `${s.pct}%` }} />
              </div>
              <span className="text-[10px] muted uppercase font-bold">{s.level}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. CERTIFICATIONS MODULE
  if (moduleKey === "certifications") {
    return (
      <div className="panel p-5 space-y-3 border-amber-500/20 bg-gradient-to-r from-amber-950/20 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="text-amber-500" size={18} />
            <h3 className="font-bold text-sm">Verified Credentials Trophy Wall</h3>
          </div>
          <span className="text-xs font-bold text-amber-500">Gold Tier</span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {[
            { name: "Fullstack Next.js 15 Certified Architect", authority: "Google / Vercel" },
            { name: "Enterprise Supabase PostgreSQL Engineer", authority: "Supabase" },
            { name: "Advanced Agentic AI System Designer", authority: "Antigravity OS" },
          ].map((cert, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 rounded-xl border p-2.5 bg-black/10 dark:bg-black/30"
              style={{ borderColor: "var(--line)" }}
            >
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500 text-black font-extrabold text-xs shadow-md">
                🏆
              </div>
              <div>
                <h4 className="text-xs font-bold">{cert.name}</h4>
                <p className="text-[10px] muted">Verified by {cert.authority}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 5. PROJECTS MODULE (Interactive Kanban Quick Switcher)
  if (moduleKey === "projects") {
    return (
      <div className="panel p-4 space-y-3 border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-cyan-400" size={18} />
            <h3 className="font-bold text-sm">Project Workflow & Kanban Columns</h3>
          </div>
          <div className="flex items-center gap-1 text-xs">
            {(["all", "in_progress", "done"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-2.5 py-1 font-bold transition capitalize ${
                  activeTab === tab ? "bg-cyan-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {tab.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="rounded-xl border p-3 bg-black/10 dark:bg-black/30 space-y-2" style={{ borderColor: "var(--line)" }}>
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> 📋 In Planning
            </span>
            <p className="text-[11px] muted">Mobile Native Push Notifications & Offline Sync</p>
          </div>
          <div className="rounded-xl border p-3 bg-black/10 dark:bg-black/30 space-y-2 border-cyan-500/30">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" /> ⚡ Active Development
            </span>
            <p className="text-[11px] font-semibold">MyLife OS Commercial SaaS v2.0 (₹29 UPI)</p>
          </div>
          <div className="rounded-xl border p-3 bg-black/10 dark:bg-black/30 space-y-2" style={{ borderColor: "var(--line)" }}>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> ✅ Shipped & Verified
            </span>
            <p className="text-[11px] muted">Antigravity AI Natural Language Multi-Intent Engine</p>
          </div>
        </div>
      </div>
    );
  }

  // 6. DAILY JOURNAL MODULE
  if (moduleKey === "journal") {
    return (
      <div className="panel p-5 space-y-3 border-rose-500/20 bg-gradient-to-r from-rose-950/20 to-transparent">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm">Today&apos;s Mood & State of Mind</h3>
          <span className="text-xs font-bold text-rose-400">{selectedMood}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {["🔥 Unstoppable", "⚡ Productive", "🧘 Peaceful & Zen", "💡 Creative Flow", "☕ Relaxed", "😴 Tired"].map((mood) => (
            <button
              key={mood}
              type="button"
              onClick={() => {
                setSelectedMood(mood);
                onQuickAdd(`Daily Reflection: ${mood}`, {
                  mood,
                  highlights: `Feeling ${mood} today. Accomplished key milestones in MyLife OS.`,
                });
              }}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                selectedMood === mood ? "bg-rose-600 text-white shadow-md" : "hover:bg-white/10"
              }`}
              style={{ borderColor: "var(--line)" }}
            >
              {mood}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 7. EXPENSES MODULE
  if (moduleKey === "expenses") {
    return (
      <div className="panel p-5 space-y-4 border-emerald-500/20 bg-gradient-to-r from-emerald-950/20 via-yellow-950/10 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Wallet className="text-emerald-500" size={18} />
              <h3 className="font-bold text-sm">Monthly Budget & UPI Tracker</h3>
            </div>
            <p className="text-xs muted">Budget: ₹15,000 • Spent: ₹3,420 • Remaining: ₹11,580</p>
          </div>
          <div className="w-full sm:w-48 space-y-1">
            <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full w-[23%]" />
            </div>
            <span className="text-[10px] muted font-bold block text-right">23% spent</span>
          </div>
        </div>

        {/* 1-Tap UPI Expense Loggers */}
        <div className="border-t pt-3 flex flex-wrap items-center gap-2" style={{ borderColor: "var(--line)" }}>
          <span className="text-xs muted font-semibold">1-Tap Log Expense:</span>
          {[
            { label: "🍔 Lunch", amount: "150", cat: "Food" },
            { label: "☕ Coffee", amount: "60", cat: "Food" },
            { label: "🚕 Auto / Travel", amount: "120", cat: "Transport" },
            { label: "💻 Software / Host", amount: "299", cat: "Business" },
          ].map((exp, i) => (
            <button
              key={i}
              type="button"
              onClick={() =>
                onQuickAdd(`${exp.label} (₹${exp.amount})`, {
                  amount: exp.amount,
                  category: exp.cat,
                  payment_method: "UPI",
                  notes: `Quick UPI payment for ${exp.label}.`,
                })
              }
              className="rounded-lg border px-2.5 py-1 text-xs font-semibold hover:bg-emerald-600 hover:text-white transition flex items-center gap-1"
              style={{ borderColor: "var(--line)", background: "var(--background)" }}
            >
              <Plus size={12} /> {exp.label} (₹{exp.amount})
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 8. HABITS MODULE (7-Day Consistency Matrix)
  if (moduleKey === "habits") {
    return (
      <div className="panel p-5 space-y-3 border-teal-500/20 bg-gradient-to-r from-teal-950/20 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="text-amber-500" size={18} />
            <h3 className="font-bold text-sm">7-Day Consistency Streak (Mon - Sun)</h3>
          </div>
          <span className="text-xs font-bold text-amber-400">🔥 14-Day Streak</span>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-1 text-center">
          {[
            { day: "Mon", key: "mon" },
            { day: "Tue", key: "tue" },
            { day: "Wed", key: "wed" },
            { day: "Thu", key: "thu" },
            { day: "Fri", key: "fri" },
            { day: "Sat", key: "sat" },
            { day: "Sun", key: "sun" },
          ].map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setHabitChecks((h) => ({ ...h, [d.key]: !h[d.key] }))}
              className={`rounded-xl border p-2.5 text-xs font-bold transition flex flex-col items-center gap-1 ${
                habitChecks[d.key] ? "bg-teal-600 text-white shadow-md shadow-teal-600/20" : "bg-black/10 dark:bg-black/30 text-gray-400"
              }`}
              style={{ borderColor: "var(--line)" }}
            >
              <span className="text-[10px] uppercase font-bold">{d.day}</span>
              <Check size={14} className={habitChecks[d.key] ? "stroke-[3]" : "opacity-30"} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 9. TASKS MODULE (1-Click Completed Checklist)
  if (moduleKey === "tasks") {
    return (
      <div className="panel p-5 space-y-3 border-blue-500/20 bg-gradient-to-r from-blue-950/20 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-blue-500" size={18} />
            <h3 className="font-bold text-sm">Quick Action To-Do Sprint</h3>
          </div>
          <button
            type="button"
            onClick={() =>
              onQuickAdd("Daily Work & Objectives Completed", {
                priority: "High",
                status: "Done",
                notes: "Completed all scheduled objectives for today.",
              })
            }
            className="btn btn-primary !py-1 !px-3 text-xs font-bold flex items-center gap-1"
          >
            <Check size={13} /> Mark Today&apos;s Work Done
          </button>
        </div>
      </div>
    );
  }

  // Fallback / default
  return null;
}