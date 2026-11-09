"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ModuleConfig, ModuleKey } from "@/lib/modules";
import { Share2, Plus, Search, Trash2, Pencil, RefreshCw, X, Save, Layers } from "lucide-react";
import { ModuleBackground } from "@/components/module-background";
import { ModuleFeatures } from "@/components/module-features";

type Entry = {
  id: string;
  title: string;
  details: string | null;
  entry_date: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export function ModuleWorkspace({ moduleKey, config }: { moduleKey: ModuleKey; config: ModuleConfig }) {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedSubsection, setSelectedSubsection] = useState<string>("all");
  const [editing, setEditing] = useState<Entry | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("entries")
      .select("id,title,details,entry_date,data,created_at,updated_at")
      .eq("module", moduleKey)
      .eq("is_archived", false)
      .order("entry_date", { ascending: false });
    if (error) setNotice(error.message);
    else setItems((data ?? []) as Entry[]);
    setLoading(false);
  }, [supabase, moduleKey]);

  useEffect(() => {
    void load();

    // Supabase Realtime channel
    const channel = supabase
      .channel(`entries-${moduleKey}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "entries", filter: `module=eq.${moduleKey}` },
        () => void load()
      )
      .subscribe();

    // Local AI Agent event listener
    const handleEntrySaved = (e: Event) => {
      const customEvent = e as CustomEvent<{ module: string }>;
      if (customEvent.detail?.module === moduleKey) {
        void load();
      }
    };
    window.addEventListener("entry-saved", handleEntrySaved);

    return () => {
      void supabase.removeChannel(channel);
      window.removeEventListener("entry-saved", handleEntrySaved);
    };
  }, [load, supabase, moduleKey]);

  function startNew(prefillSubcategory?: string) {
    setFormOpen(true);
    setEditing(null);
    setTitle("");
    setDetails("");
    setDate(new Date().toISOString().slice(0, 10));
    setValues(prefillSubcategory ? { subcategory: prefillSubcategory } : {});
    setNotice("");
  }

  function startEdit(item: Entry) {
    setFormOpen(true);
    setEditing(item);
    setTitle(item.title);
    setDetails(item.details ?? "");
    setDate(item.entry_date);
    setValues(Object.fromEntries(config.fields.map((f) => [f.key, String(item.data?.[f.key] ?? "")])));
    setNotice("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setNotice("");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setNotice("Please sign in again.");
      setBusy(false);
      return;
    }
    const payload = {
      user_id: user.id,
      module: moduleKey,
      title: title.trim(),
      details: details.trim() || null,
      entry_date: date,
      data: values,
    };
    const result = editing
      ? await supabase.from("entries").update(payload).eq("id", editing.id).select().single()
      : await supabase.from("entries").insert(payload).select().single();
    setBusy(false);
    if (result.error) {
      setNotice(result.error.message);
      return;
    }
    setEditing(null);
    setFormOpen(false);
    setNotice("Saved successfully.");
    await load();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this record permanently?")) return;
    const { error } = await supabase.from("entries").delete().eq("id", id);
    if (error) setNotice(error.message);
    else {
      setNotice("Record deleted.");
      await load();
    }
  }

  async function share(item: Entry) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setNotice("Please sign in again.");
      return;
    }
    const res = await fetch("/api/share-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryId: item.id }),
    });
    const json = await res.json();
    if (!res.ok) {
      setNotice(json.error ?? "Could not create link.");
      return;
    }
    await navigator.clipboard.writeText(json.url);
    setNotice("Read-only share link copied. Anyone with the link can view this one record.");
  }

  async function handleQuickAdd(quickTitle: string, quickData: Record<string, string>) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setNotice("Please sign in to log activity.");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("entries").insert({
      user_id: user.id,
      module: moduleKey,
      title: quickTitle,
      details: null,
      entry_date: today,
      data: quickData || {},
      is_archived: false,
    });
    if (error) {
      setNotice(`Failed to save: ${error.message}`);
    } else {
      setNotice(`✓ Added "${quickTitle}" to ${config.title}`);
      void load();
    }
  }

  // Filter items by search query AND active subsection
  const visible = items.filter((i) => {
    const matchesQuery = `${i.title} ${i.details ?? ""} ${JSON.stringify(i.data)}`.toLowerCase().includes(query.toLowerCase());
    if (!matchesQuery) return false;

    if (selectedSubsection === "all") return true;

    // Check if entry data matches selected subsection ID or Label
    const subVal = String(i.data?.subcategory || "").toLowerCase();
    const subObj = config.subsections.find((s) => s.id === selectedSubsection);
    const targetLabel = (subObj?.label || selectedSubsection).toLowerCase();

    return subVal.includes(targetLabel) || subVal.includes(selectedSubsection.toLowerCase());
  });

  return (
    <div className="relative space-y-6 pb-12">
      {/* Visual Canvas Background */}
      <ModuleBackground moduleKey={moduleKey} />

      {/* Dynamic Module Header with Custom Tailored Background Gradient */}
      <div
        className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 bg-gradient-to-r ${config.gradient} shadow-2xl`}
        style={{
          borderColor: config.themeStyle?.cardBorder || "var(--line)",
          background: "var(--card)",
        }}
      >
        <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">{config.emoji}</span>
              <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-bold ${config.accentBadge}`}>
                APP {String(config.appNumber).padStart(2, "0")} · {config.shortTitle || config.title}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{config.title}</h1>
            <p className="muted mt-2 max-w-2xl text-sm leading-relaxed">{config.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="btn btn-primary shadow-lg shadow-indigo-500/25 !px-4 !py-2.5 font-bold"
              onClick={() => startNew(selectedSubsection !== "all" ? config.subsections.find(s => s.id === selectedSubsection)?.label : undefined)}
            >
              <Plus size={17} /> Add {config.shortTitle || "Record"}
            </button>
          </div>
        </div>
      </div>

      {notice && (
        <div className="rounded-xl border p-3.5 text-sm bg-indigo-500/10 border-indigo-500/30 text-indigo-300 flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} className="text-gray-400 hover:text-white">
            <X size={15} />
          </button>
        </div>
      )}

      {/* 12 Subsections Navigation Carousel / Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <Layers size={13} className="text-indigo-400" />
            <span>12 Dedicated Subsections</span>
          </div>
          <span className="text-xs text-gray-400">{items.length} total records</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setSelectedSubsection("all")}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition border ${
              selectedSubsection === "all"
                ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            All Subsections ({items.length})
          </button>

          {config.subsections.map((sub, idx) => {
            const isCurrent = selectedSubsection === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubsection(sub.id)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition border flex items-center gap-1.5 ${
                  isCurrent
                    ? "bg-indigo-600 text-white border-indigo-500 font-bold shadow-sm"
                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="text-[10px] opacity-60 font-mono">{idx + 1}.</span>
                <span>{sub.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 12 Interactive App Widgets & Quick Log Features */}
      <ModuleFeatures moduleKey={moduleKey} onQuickAdd={handleQuickAdd} />

      {/* Records Container */}
      <div className="panel p-4 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="muted absolute left-3.5 top-3.5" size={17} />
            <input
              className="field pl-10"
              placeholder={`Search ${config.title.toLowerCase()} records...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <button className="btn btn-ghost" onClick={() => void load()}>
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <p className="muted py-12 text-center text-sm">Loading records from Supabase...</p>
        ) : visible.length === 0 ? (
          <div className="py-14 text-center">
            <span className="text-4xl">{config.emoji}</span>
            <p className="mt-3 font-semibold text-base">No entries in this view</p>
            <p className="muted mt-1 text-sm max-w-sm mx-auto">
              Add a record with &quot;Add {config.shortTitle || "Record"}&quot;, or use the <strong>AI Agent</strong> at the bottom right.
            </p>
            <button
              onClick={() => startNew(selectedSubsection !== "all" ? config.subsections.find(s => s.id === selectedSubsection)?.label : undefined)}
              className="btn btn-primary mt-4 inline-flex items-center gap-1.5 text-xs font-bold"
            >
              <Plus size={15} /> Add First Entry
            </button>
          </div>
        ) : (
          <div className="grid gap-3.5 md:grid-cols-2">
            {visible.map((item) => (
              <article
                key={item.id}
                className="group relative rounded-2xl border p-4 sm:p-5 transition-all hover:border-indigo-500/40 hover:shadow-lg"
                style={{ borderColor: "var(--line)", background: "var(--card)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {item.data?.subcategory ? (
                        <span className="rounded bg-indigo-500/15 border border-indigo-500/25 px-2 py-0.2 text-[10px] font-bold text-indigo-400">
                          {String(item.data.subcategory)}
                        </span>
                      ) : null}
                      <p className="muted text-[11px] font-medium">{item.entry_date}</p>
                    </div>
                    <h3 className="break-words font-semibold text-base leading-snug">{item.title}</h3>
                  </div>

                  <div className="flex shrink-0 gap-1 opacity-80 group-hover:opacity-100 transition">
                    <button
                      className="btn btn-ghost !p-2 rounded-lg"
                      title="Share selected record"
                      onClick={() => void share(item)}
                    >
                      <Share2 size={15} />
                    </button>
                    <button
                      className="btn btn-ghost !p-2 rounded-lg"
                      title="Edit"
                      onClick={() => startEdit(item)}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="btn btn-ghost !p-2 rounded-lg text-rose-500 hover:text-rose-600"
                      title="Delete"
                      onClick={() => void remove(item.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {item.details && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed muted">{item.details}</p>}

                <div className="mt-4 flex flex-wrap gap-1.5 border-t pt-3" style={{ borderColor: "var(--line)" }}>
                  {config.fields.map((f) => {
                    const val = item.data?.[f.key];
                    if (val === undefined || val === null || val === "" || f.key === "subcategory") return null;
                    return (
                      <span
                        key={f.key}
                        className="rounded-lg bg-white/5 border border-white/5 px-2.5 py-1 text-[11px] text-gray-300 font-medium"
                      >
                        <strong className="text-gray-400">{f.label}:</strong> {String(val)}
                      </span>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Slide-over / Modal Form */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="relative w-full max-w-lg rounded-3xl border p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
            style={{ background: "var(--card)", borderColor: "var(--line)" }}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{config.emoji}</span>
                <h2 className="text-lg font-bold">{editing ? "Edit Record" : `New ${config.shortTitle || "Record"}`}</h2>
              </div>
              <button
                className="btn btn-ghost !p-1.5 rounded-lg text-gray-400 hover:text-white"
                onClick={() => setFormOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={save} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Title / Subject / Goal *
                </label>
                <input
                  className="field w-full"
                  placeholder="e.g. Chest & Triceps / Machine Learning Unit 2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Entry Date
                </label>
                <input
                  type="date"
                  className="field w-full"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              {/* Dynamic Domain Specific Fields */}
              {config.fields.map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    {f.label} {f.required && "*"}
                  </label>
                  {f.type === "textarea" ? (
                    <textarea
                      className="field w-full min-h-[70px]"
                      value={values[f.key] ?? ""}
                      placeholder={f.placeholder}
                      onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                      required={f.required}
                    />
                  ) : f.type === "select" ? (
                    <select
                      className="field w-full"
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                      required={f.required}
                    >
                      <option value="">Select {f.label}...</option>
                      {f.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={f.type}
                      className="field w-full"
                      value={values[f.key] ?? ""}
                      placeholder={f.placeholder}
                      onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                      required={f.required}
                    />
                  )}
                </div>
              ))}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  className="field w-full min-h-[80px]"
                  placeholder="Details, key takeaways, reflections..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/5">
                <button
                  type="button"
                  className="btn btn-ghost text-xs font-semibold"
                  onClick={() => setFormOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="btn btn-primary inline-flex items-center gap-1.5 text-xs font-bold shadow-lg shadow-indigo-500/25"
                >
                  <Save size={15} />
                  <span>{busy ? "Saving..." : editing ? "Update Record" : "Save Record"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
