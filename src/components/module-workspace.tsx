"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ModuleConfig, ModuleKey } from "@/lib/modules";
import { Share2, Plus, Search, Trash2, Pencil, RefreshCw, X, Save } from "lucide-react";
import { ModuleBackground } from "@/components/module-background";

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

  function startNew() {
    setFormOpen(true);
    setEditing(null);
    setTitle("");
    setDetails("");
    setDate(new Date().toISOString().slice(0, 10));
    setValues({});
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

  const visible = items.filter((i) =>
    `${i.title} ${i.details ?? ""} ${JSON.stringify(i.data)}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative space-y-6">
      <ModuleBackground moduleKey={moduleKey} />
      {/* Dynamic Module Header with Custom Tailored Background Gradient */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-6 sm:p-8 bg-gradient-to-r ${config.gradient}`}
        style={{ borderColor: "var(--line)", background: "var(--card)" }}
      >
        <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{config.emoji}</span>
              <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${config.accentBadge}`}>
                {config.title.toUpperCase()}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">{config.title}</h1>
            <p className="muted mt-2 max-w-xl text-sm leading-relaxed">{config.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <button className="btn btn-primary shadow-lg shadow-indigo-500/20" onClick={startNew}>
              <Plus size={17} /> Add record
            </button>
          </div>
        </div>
      </div>

      {notice && (
        <div className="rounded-xl border p-3.5 text-sm bg-indigo-500/5" style={{ borderColor: "var(--line)" }}>
          {notice}
        </div>
      )}

      {/* Records Container */}
      <div className="panel p-4 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="muted absolute left-3.5 top-3.5" size={17} />
            <input
              className="field pl-10"
              placeholder={`Search ${config.title.toLowerCase()} records...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-ghost" onClick={() => void load()}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {loading ? (
          <p className="muted py-12 text-center text-sm">Loading your records...</p>
        ) : visible.length === 0 ? (
          <div className="py-14 text-center">
            <span className="text-4xl">{config.emoji}</span>
            <p className="mt-3 font-semibold text-base">No entries found</p>
            <p className="muted mt-1 text-sm max-w-sm mx-auto">
              Add a record manually with &quot;Add record&quot;, or tap the <strong>AI Agent</strong> button at the bottom-right and say what you did!
            </p>
          </div>
        ) : (
          <div className="grid gap-3.5 md:grid-cols-2">
            {visible.map((item) => (
              <article
                key={item.id}
                className="group relative rounded-2xl border p-4 sm:p-5 transition-all hover:border-indigo-500/40 hover:shadow-md"
                style={{ borderColor: "var(--line)", background: "var(--card)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words font-semibold text-base leading-snug">{item.title}</h3>
                    <p className="muted mt-1 text-xs font-medium">{item.entry_date}</p>
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
                    if (val === undefined || val === null || val === "") return null;
                    return (
                      <span
                        key={f.key}
                        className="rounded-lg px-2.5 py-1 text-xs font-medium"
                        style={{ background: "var(--background)", border: "1px solid var(--line)" }}
                      >
                        <span className="muted">{f.label}:</span> <span className="font-semibold">{String(val)}</span>
                      </span>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Manual Entry Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={save} className="panel my-8 max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{editing ? "Edit entry" : `New ${config.title} entry`}</h2>
                <p className="muted text-xs mt-1">Saved securely to your private Supabase database.</p>
              </div>
              <button type="button" className="btn btn-ghost !p-2 rounded-xl" onClick={() => setFormOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                Title *
                <input
                  className="field mt-1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={160}
                  placeholder={`e.g. ${config.title} title`}
                />
              </label>

              <label className="block text-sm">
                Date
                <input className="field mt-1" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </label>

              {config.fields.map((f) => (
                <label key={f.key} className={`block text-sm ${f.type === "textarea" ? "sm:col-span-2" : ""}`}>
                  {f.label}
                  {f.type === "select" ? (
                    <select
                      className="field mt-1"
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    >
                      <option value="">Select...</option>
                      {f.options?.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea
                      className="field mt-1"
                      rows={3}
                      placeholder={f.placeholder}
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    />
                  ) : (
                    <input
                      className="field mt-1"
                      type={f.type}
                      placeholder={f.placeholder}
                      value={values[f.key] ?? ""}
                      required={f.required}
                      min={f.type === "number" ? 0 : undefined}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    />
                  )}
                </label>
              ))}

              <label className="block text-sm sm:col-span-2">
                Additional details
                <textarea
                  className="field mt-1"
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Any extra context or notes..."
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t pt-4" style={{ borderColor: "var(--line)" }}>
              <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" disabled={busy || !title.trim()}>
                <Save size={16} />
                {busy ? "Saving..." : "Save record"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
