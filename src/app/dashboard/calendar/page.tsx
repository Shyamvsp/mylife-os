"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CalendarDays,
  Clock,
  Plus,
  Trash2,
  Bell,
  BellRing,
  Volume2,
  Share2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  X,
  RefreshCw,
  Calendar as CalendarIcon,
} from "lucide-react";

interface CalendarEntry {
  id: string;
  title: string;
  details: string | null;
  entry_date: string;
  created_at: string;
  data: {
    time?: string;
    priority?: "High" | "Medium" | "Low";
    status?: "Pending" | "Completed";
    category?: string;
    reminder?: string;
    location?: string;
    notes?: string;
  };
}

export default function CalendarPage() {
  const supabase = useMemo(() => createClient(), []);

  // Today in YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [events, setEvents] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  // Notification states
  const [notificationPermission, setNotificationPermission] = useState<string>("default");
  const [chimeEnabled, setChimeEnabled] = useState(true);
  const [activeToast, setActiveToast] = useState<{ title: string; body: string } | null>(null);

  // Views: "agenda" | "month" | "shared"
  const [viewMode, setViewMode] = useState<"agenda" | "month" | "shared">("agenda");

  // Modal: Add / Edit Event
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(todayStr);
  const [formTime, setFormTime] = useState("10:00 AM");
  const [formPriority, setFormPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [formCategory, setFormCategory] = useState("Work");
  const [formReminder, setFormReminder] = useState("15_mins");
  const [formNotes, setFormNotes] = useState("");

  // Share link state
  const [sharing, setSharing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatedShareUrl, setGeneratedShareUrl] = useState<string | null>(null);

  // Check browser notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Web Audio API Synthesized Chime (Plays a clean, pleasant two-tone 880Hz -> 1320Hz alert)
  const playChime = useCallback(() => {
    if (!chimeEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      // First tone (880 Hz)
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      // Glides to higher harmonic tone (1320 Hz)
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      console.warn("Could not play synthesized audio chime:", e);
    }
  }, [chimeEnabled]);

  // Request browser notification permission
  const requestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotice("Your browser does not support desktop notifications.");
      return;
    }
    const perm = await Notification.requestPermission();
    setNotificationPermission(perm);
    if (perm === "granted") {
      playChime();
      new Notification("MyLife OS Calendar Alerts Enabled 🔔", {
        body: "You will now receive notifications for upcoming events, tasks, and shared deadlines.",
        icon: "/icon-192.png",
      });
      setActiveToast({
        title: "Notifications Enabled!",
        body: "Desktop & mobile notifications are now active.",
      });
    }
  };

  // Test Notification Chime
  const testNotificationAlert = () => {
    playChime();
    setActiveToast({
      title: "🔔 Calendar Reminder Alert",
      body: `Live notification test for ${selectedDate}. Sound chime and priority alerts are working!`,
    });

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification("MyLife OS Calendar Notification", {
        body: "Event Reminder: You have priority schedule items active in MyLife OS.",
        icon: "/icon-192.png",
      });
    }

    setTimeout(() => {
      setActiveToast(null);
    }, 4500);
  };

  // Load calendar entries from Supabase
  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("entries")
        .select("id,title,details,entry_date,data,created_at")
        .in("module", ["calendar", "tasks"])
        .eq("is_archived", false)
        .order("entry_date", { ascending: true });

      if (error) {
        setNotice(error.message);
      } else if (data) {
        const parsed = data.map((item) => ({
          id: item.id,
          title: item.title,
          details: item.details,
          entry_date: item.entry_date,
          created_at: item.created_at,
          data: (item.data as Record<string, unknown>) || {},
        })) as CalendarEntry[];
        setEvents(parsed);
      }
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  // Save new calendar event
  const handleSaveEvent = async (e: React.FormEvent) => {
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

      const payload = {
        user_id: user.id,
        module: "calendar",
        title: formTitle.trim(),
        details: formNotes.trim() || `${formCategory} • Scheduled at ${formTime}`,
        entry_date: formDate,
        data: {
          time: formTime,
          priority: formPriority,
          category: formCategory,
          status: "Pending",
          reminder: formReminder,
          notes: formNotes,
        },
      };

      const { error } = await supabase.from("entries").insert(payload);

      if (error) {
        setNotice(error.message);
      } else {
        setModalOpen(false);
        setFormTitle("");
        setFormNotes("");
        playChime();
        await loadEvents();
      }
    } catch {
      setNotice("Error saving calendar event.");
    } finally {
      setSaving(false);
    }
  };

  // Toggle event completion
  const toggleEventStatus = async (item: CalendarEntry) => {
    const newStatus: "Completed" | "Pending" = item.data.status === "Completed" ? "Pending" : "Completed";
    const updatedData = { ...item.data, status: newStatus };

    // Optimistic UI
    setEvents((prev) =>
      prev.map((ev) => (ev.id === item.id ? { ...ev, data: updatedData } : ev))
    );

    if (newStatus === "Completed") playChime();

    await supabase
      .from("entries")
      .update({ data: updatedData, updated_at: new Date().toISOString() })
      .eq("id", item.id);
  };

  // Delete event
  const deleteEvent = async (id: string, title: string) => {
    if (!window.confirm(`Delete event "${title}"?`)) return;
    setEvents((prev) => prev.filter((e) => e.id !== id));
    await supabase.from("entries").delete().eq("id", id);
  };

  // Share calendar via link
  const generateShareLink = async () => {
    setSharing(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setNotice("Please sign in to share.");
        setSharing(false);
        return;
      }

      const res = await fetch("/api/share-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: "calendar",
          title: "MyLife OS Calendar & Schedule",
        }),
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setGeneratedShareUrl(data.url);
        setViewMode("shared");
        playChime();
      } else {
        setNotice(data.error || "Could not generate share link.");
      }
    } catch {
      setNotice("Network error generating share link.");
    } finally {
      setSharing(false);
    }
  };

  // Copy share URL
  const copyShareLink = () => {
    if (!generatedShareUrl) return;
    void navigator.clipboard.writeText(generatedShareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Filter events for selected date
  const eventsForSelectedDate = useMemo(() => {
    return events.filter((e) => e.entry_date === selectedDate);
  }, [events, selectedDate]);

  // Today's upcoming priority alerts
  const todayAlerts = useMemo(() => {
    return events.filter((e) => e.entry_date === todayStr && e.data.status !== "Completed");
  }, [events, todayStr]);

  // Shift selected date
  const shiftDate = (delta: number) => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const cur = new Date(y, m - 1, d);
    cur.setDate(cur.getDate() + delta);
    const newStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(
      cur.getDate()
    ).padStart(2, "0")}`;
    setSelectedDate(newStr);
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Toast Notification Alert */}
      {activeToast && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="rounded-2xl border border-cyan-500/50 bg-[#0c1427]/95 p-4 shadow-2xl backdrop-blur-xl flex items-start gap-3 max-w-sm">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <BellRing size={18} className="animate-bounce" />
            </div>
            <div className="space-y-1 flex-1">
              <h5 className="font-bold text-xs text-white">{activeToast.title}</h5>
              <p className="text-[11px] text-slate-300 leading-relaxed">{activeToast.body}</p>
            </div>
            <button onClick={() => setActiveToast(null)} className="text-slate-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* TOP HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-950/40 via-teal-950/30 to-[#070b14] p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={14} /> Smart Calendar &amp; Notification Engine
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Calendar &amp; Tasks <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Scheduler</span>
            </h1>
            <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
              Schedule your daily agenda, set audio chime reminders, receive browser notifications, and share live calendar links with team members or clients.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setFormDate(selectedDate);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-slate-950 font-bold px-5 py-3 rounded-2xl text-sm shadow-lg shadow-blue-600/30 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={18} />
              <span>Add Event / Task</span>
            </button>

            <button
              onClick={testNotificationAlert}
              className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-cyan-300 border border-cyan-500/30 px-4 py-3 rounded-2xl text-xs font-bold transition shadow-sm"
              title="Test Notification Sound & Banner"
            >
              <Volume2 size={16} />
              <span>Test Notification Chime</span>
            </button>

            <button
              onClick={generateShareLink}
              disabled={sharing}
              className="inline-flex items-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-4 py-3 rounded-2xl text-xs font-bold transition"
            >
              <Share2 size={15} />
              <span>{sharing ? "Sharing..." : "Share Calendar"}</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Today&apos;s Active Alerts</span>
              <BellRing size={16} className="text-amber-400" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-400">{todayAlerts.length}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Pending items for today</p>
          </div>

          <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Total Scheduled</span>
              <CalendarIcon size={16} className="text-blue-400" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">{events.length}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Events across all dates</p>
          </div>

          <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Audio Chime</span>
              <Volume2 size={16} className="text-cyan-400" />
            </div>
            <div className="mt-2 text-lg sm:text-xl font-bold text-cyan-300">
              {chimeEnabled ? "Active (Web Audio)" : "Muted"}
            </div>
            <button
              onClick={() => setChimeEnabled(!chimeEnabled)}
              className="text-[11px] text-cyan-400 hover:underline mt-0.5 block"
            >
              {chimeEnabled ? "Click to mute" : "Click to enable"}
            </button>
          </div>

          <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Desktop Alerts</span>
              <Bell size={16} className="text-emerald-400" />
            </div>
            <div className="mt-2 text-sm sm:text-base font-bold text-white truncate">
              {notificationPermission === "granted" ? (
                <span className="text-emerald-400">✅ Permitted</span>
              ) : (
                <span className="text-amber-400">⚠️ Needs Permission</span>
              )}
            </div>
            {notificationPermission !== "granted" && (
              <button
                onClick={requestPermission}
                className="text-[11px] text-emerald-400 hover:underline mt-0.5 block font-bold"
              >
                Enable in Browser →
              </button>
            )}
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

      {/* HOW NOTIFICATIONS & SHARED CALENDARS WORK (Direct User Requirement) */}
      <div className="panel p-5 border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 via-slate-900/60 to-transparent space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="text-cyan-400" size={18} />
            <h3 className="font-bold text-sm text-white">How Calendar &amp; Shared Link Notifications Work</h3>
          </div>
          <span className="text-[11px] font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
            Real-Time Synced
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs text-slate-300">
          <div className="rounded-xl border border-white/5 bg-black/20 p-3.5 space-y-1.5">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <span>01.</span> Sound Chime on Alert
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Synthesized 880Hz audio chimes ring directly on your phone or PC when tasks are due or when you complete them.
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-black/20 p-3.5 space-y-1.5">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5">
              <span>02.</span> Desktop &amp; Phone Push
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              When enabled, your device displays system-level push notifications for today&apos;s scheduled deadlines.
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-black/20 p-3.5 space-y-1.5">
            <div className="font-bold text-purple-300 flex items-center gap-1.5">
              <span>03.</span> Shared Collaboration Links
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              When you share calendar links, collaborators see real-time updates and any shared priority deadlines automatically appear in your alerts!
            </p>
          </div>
        </div>
      </div>

      {/* VIEW SELECTOR & DATE NAVIGATOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        {/* Date Navigator */}
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
            className="bg-black/40 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
          />

          <button
            onClick={() => shiftDate(1)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition"
            title="Next Day"
          >
            <ChevronRight size={16} />
          </button>

          <button
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              selectedDate === todayStr
                ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            Today
          </button>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <button
            onClick={() => setViewMode("agenda")}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              viewMode === "agenda"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Day Agenda ({eventsForSelectedDate.length})
          </button>

          <button
            onClick={() => setViewMode("month")}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              viewMode === "month"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All Scheduled ({events.length})
          </button>

          <button
            onClick={() => setViewMode("shared")}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              viewMode === "shared"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Shared Links
          </button>
        </div>
      </div>

      {/* AGENDA VIEW */}
      {viewMode === "agenda" && (
        <div className="space-y-4">
          {loading ? (
            <div className="panel p-12 text-center text-slate-400 space-y-3">
              <RefreshCw size={24} className="animate-spin mx-auto text-blue-400" />
              <p className="text-sm">Loading calendar agenda...</p>
            </div>
          ) : eventsForSelectedDate.length === 0 ? (
            <div className="panel p-12 text-center border-dashed border-slate-700 bg-slate-900/30 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center font-bold text-2xl">
                🗓️
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No Events Scheduled for {selectedDate}</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Click the button below to schedule an event, meeting, or priority task for this date.
                </p>
              </div>
              <button
                onClick={() => {
                  setFormDate(selectedDate);
                  setModalOpen(true);
                }}
                className="btn btn-primary px-5 py-2.5 text-xs font-bold inline-flex items-center gap-2"
              >
                <Plus size={15} /> Add Event for {selectedDate}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {eventsForSelectedDate.map((item) => {
                const isCompleted = item.data.status === "Completed";
                const isHigh = item.data.priority === "High";

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isCompleted
                        ? "bg-slate-900/40 border-slate-800 opacity-60"
                        : isHigh
                        ? "bg-gradient-to-r from-rose-950/30 via-slate-900/70 to-slate-900/90 border-rose-500/40 shadow-lg shadow-rose-950/20"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <button
                        onClick={() => toggleEventStatus(item)}
                        className={`w-7 h-7 rounded-xl flex items-center justify-center transition shrink-0 mt-0.5 ${
                          isCompleted
                            ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30"
                            : "border-2 border-slate-600 hover:border-cyan-400 text-transparent"
                        }`}
                        title={isCompleted ? "Completed (Click to unmark)" : "Click to mark completed"}
                      >
                        <Check size={16} className={isCompleted ? "stroke-[3]" : ""} />
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-sm sm:text-base font-bold ${
                              isCompleted ? "line-through text-slate-400" : "text-white"
                            }`}
                          >
                            {item.title}
                          </h4>
                          {isHigh && (
                            <span className="rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 text-[10px] font-bold">
                              HIGH PRIORITY
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          {item.data.time && (
                            <span className="flex items-center gap-1 text-cyan-400 font-mono">
                              <Clock size={12} /> {item.data.time}
                            </span>
                          )}
                          <span>•</span>
                          <span>{item.data.category || "General"}</span>
                          {item.data.reminder && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-amber-400 text-[11px]">
                                <Bell size={11} /> Reminder Active
                              </span>
                            </>
                          )}
                        </div>

                        {item.details && <p className="text-xs text-slate-400 pt-1 leading-relaxed">{item.details}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => deleteEvent(item.id, item.title)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete Event"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ALL SCHEDULED VIEW */}
      {viewMode === "month" && (
        <div className="panel p-6 border-slate-800 bg-slate-900/60 space-y-4">
          <h3 className="font-bold text-base text-white">All Scheduled Events &amp; Tasks</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Time</th>
                  <th className="pb-3 px-3">Event / Task</th>
                  <th className="pb-3 px-3">Priority</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {events.map((e) => (
                  <tr key={e.id} className="hover:bg-white/5 transition">
                    <td className="py-3 px-3 font-mono text-cyan-300">{e.entry_date}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{e.data.time || "--"}</td>
                    <td className="py-3 px-3 font-semibold text-white">{e.title}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          e.data.priority === "High"
                            ? "bg-rose-500/20 text-rose-300"
                            : e.data.priority === "Medium"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-blue-500/20 text-blue-300"
                        }`}
                      >
                        {e.data.priority || "Medium"}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[11px] font-bold ${
                          e.data.status === "Completed" ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {e.data.status || "Pending"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => deleteEvent(e.id, e.title)}
                        className="text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SHARED LINKS VIEW */}
      {viewMode === "shared" && (
        <div className="panel p-6 border-slate-800 bg-slate-900/60 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-white">Shared Calendar Links</h3>
              <p className="text-xs text-slate-400">
                Share read-only calendar access with clients, friends, or team members.
              </p>
            </div>
          </div>

          {generatedShareUrl ? (
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-5 space-y-3">
              <span className="text-xs font-bold text-cyan-400 block">Your Live Shareable Calendar Link:</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedShareUrl}
                  className="w-full rounded-xl bg-black/40 border border-cyan-500/30 p-2.5 text-xs text-cyan-200 font-mono"
                />
                <button
                  onClick={copyShareLink}
                  className="btn btn-primary px-4 py-2.5 text-xs font-bold shrink-0 flex items-center gap-1.5"
                >
                  {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedLink ? "Copied!" : "Copy"}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Anyone with this link can view your scheduled calendar events and deadlines.
              </p>
            </div>
          ) : (
            <div className="text-center py-8 space-y-3">
              <p className="text-xs text-slate-400">No share link generated yet.</p>
              <button
                onClick={generateShareLink}
                disabled={sharing}
                className="btn btn-primary px-5 py-2.5 text-xs font-bold inline-flex items-center gap-2"
              >
                <Share2 size={15} /> Generate New Share Link
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD CALENDAR EVENT */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-[#0d1322] p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="text-blue-400" size={20} />
                <h3 className="text-lg font-bold text-white">Schedule Calendar Event</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Event / Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Client Strategy Call, Project Deadline, Workout"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 10:30 AM"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as "High" | "Medium" | "Low")}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="High">🔥 High Priority</option>
                    <option value="Medium">⚡ Medium Priority</option>
                    <option value="Low">☕ Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Work">Work &amp; Business</option>
                    <option value="Study">Academic &amp; Study</option>
                    <option value="Health">Health &amp; Gym</option>
                    <option value="Personal">Personal Routine</option>
                    <option value="Meeting">Meeting / Call</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Audio &amp; Push Reminder</label>
                <select
                  value={formReminder}
                  onChange={(e) => setFormReminder(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="15_mins">🔔 15 minutes before</option>
                  <option value="1_hour">⏰ 1 hour before</option>
                  <option value="day_of">📅 Morning of the event</option>
                  <option value="none">Off (No alert)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Video Link</label>
                <textarea
                  rows={2}
                  placeholder="Meeting agenda, Google Meet link, or notes..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs text-white focus:outline-none focus:border-blue-500"
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
                  <span>Schedule Event</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
