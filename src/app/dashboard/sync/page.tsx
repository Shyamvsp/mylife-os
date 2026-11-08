"use client";

import { useState } from "react";
import { Download, Upload, Code2, Check, ShieldCheck, RefreshCw, Sparkles, Terminal } from "lucide-react";

export default function SyncPage() {
  const [importing, setImporting] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"curl" | "javascript" | "python">("curl");
  const [copiedCode, setCopiedCode] = useState(false);

  const handleFileImport = async (file?: File) => {
    if (!file) return;
    setImporting(true);
    setImportNotice(null);

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const res = await fetch("/api/data/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });

      const result = await res.json();
      if (!res.ok) {
        setImportNotice(`Import failed: ${result.error || "Unknown error"}`);
      } else {
        setImportNotice(`✅ Successfully imported ${result.imported_count} records from external database/file!`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid JSON file format";
      setImportNotice(`Error reading file: ${message}`);
    } finally {
      setImporting(false);
    }
  };

  const curlCode = `curl -X POST "https://lweonmkbcdquseexcjij.supabase.co/rest/v1/entries" \\
  -H "apikey: sb_publishable_ICfctOXgC77sgd2o1TvQqQ_S6S0oMq8" \\
  -H "Authorization: Bearer YOUR_USER_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "module": "projects",
    "title": "Client Feature Delivery",
    "entry_date": "2026-11-08",
    "data": { "status": "Completed" }
  }'`;

  const jsCode = `// Connect any external database or frontend to MyLife OS
const response = await fetch("https://lweonmkbcdquseexcjij.supabase.co/rest/v1/entries", {
  method: "POST",
  headers: {
    "apikey": "sb_publishable_ICfctOXgC77sgd2o1TvQqQ_S6S0oMq8",
    "Authorization": "Bearer YOUR_USER_TOKEN",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    module: "study",
    title: "External Database Sync Session",
    entry_date: "2026-11-08",
    data: { subject: "Cloud Architecture", duration_minutes: 60 }
  })
});
const data = await response.json();
console.log("Synced to MyLife OS:", data);`;

  const pyCode = `# Python script to push records from any client database into MyLife OS
import requests

url = "https://lweonmkbcdquseexcjij.supabase.co/rest/v1/entries"
headers = {
    "apikey": "sb_publishable_ICfctOXgC77sgd2o1TvQqQ_S6S0oMq8",
    "Authorization": "Bearer YOUR_USER_TOKEN",
    "Content-Type": "application/json"
}
payload = {
    "module": "fitness",
    "title": "Smart Watch Auto-Sync",
    "entry_date": "2026-11-08",
    "data": { "steps": "10000", "calories": "450" }
}

response = requests.post(url, json=payload, headers=headers)
print("Status:", response.status_code)`;

  const copySnippet = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div
        className="relative overflow-hidden rounded-3xl border p-6 sm:p-8 bg-gradient-to-r from-purple-900/25 via-indigo-900/15 to-transparent"
        style={{ borderColor: "var(--line)", background: "var(--card)" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">⚡</span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-400">
            <Sparkles size={12} /> ENTERPRISE DATA PORTABILITY
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Data Sync & Database Connectors</h1>
        <p className="muted mt-2 max-w-2xl text-sm leading-relaxed">
          Export full backups of your 12 applications, import records from friends or client databases, and use live API endpoints to sync data automatically from external systems.
        </p>
      </div>

      {/* Export & Import Grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Full Database Export */}
        <div className="panel p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-500 mb-4">
              <Download size={24} />
            </div>
            <h3 className="font-bold text-lg">Full Database Backup (JSON Export)</h3>
            <p className="muted text-xs mt-1.5 leading-relaxed">
              Download your entire dataset across all 12 modules in an open, portable JSON format. Perfect for personal archives or sharing with clients and other databases.
            </p>
          </div>

          <a
            href="/api/data/export"
            download
            className="btn btn-primary w-full flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <Download size={17} /> Download Complete Backup (.json)
          </a>
        </div>

        {/* Database Import & Restore */}
        <div className="panel p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-500 mb-4">
              <Upload size={24} />
            </div>
            <h3 className="font-bold text-lg">Import from Database / JSON</h3>
            <p className="muted text-xs mt-1.5 leading-relaxed">
              Upload a JSON backup or batch export from your clients, smart devices, or external spreadsheets to auto-populate any of your 12 applications.
            </p>
          </div>

          <div>
            <label className="btn btn-ghost w-full cursor-pointer flex items-center justify-center gap-2 border-dashed">
              {importing ? <RefreshCw className="animate-spin" size={17} /> : <Upload size={17} />}
              <span>{importing ? "Importing records..." : "Choose JSON file to import"}</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                disabled={importing}
                onChange={(e) => {
                  void handleFileImport(e.target.files?.[0]);
                  e.currentTarget.value = "";
                }}
              />
            </label>

            {importNotice && (
              <p className="mt-2.5 rounded-lg border p-2.5 text-xs font-medium text-center" style={{ borderColor: "var(--line)", background: "var(--background)" }}>
                {importNotice}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Developer API & Webhooks Integration */}
      <div className="panel p-6 sm:p-8 space-y-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="text-indigo-500" size={20} />
              <h3 className="font-bold text-lg">External Database REST API</h3>
            </div>
            <p className="muted text-xs mt-1">
              Use these code snippets to push data directly into your MyLife OS database from Python scripts, cron jobs, client systems, or webhooks.
            </p>
          </div>

          <div className="flex gap-1.5 rounded-xl border p-1" style={{ borderColor: "var(--line)", background: "var(--background)" }}>
            {(["curl", "javascript", "python"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold uppercase transition ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white"
                    : "muted hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Code Snippet Box */}
        <div className="relative rounded-2xl border p-4 sm:p-5 font-mono text-xs overflow-x-auto" style={{ background: "#090d16", borderColor: "var(--line)" }}>
          <button
            onClick={() => copySnippet(activeTab === "curl" ? curlCode : activeTab === "javascript" ? jsCode : pyCode)}
            className="absolute top-3 right-3 btn btn-ghost !py-1 !px-2.5 text-[11px] flex items-center gap-1 text-gray-300 hover:text-white"
          >
            {copiedCode ? <Check size={13} className="text-emerald-400" /> : <Code2 size={13} />}
            {copiedCode ? "Copied!" : "Copy Code"}
          </button>
          <pre className="text-indigo-200">
            {activeTab === "curl" ? curlCode : activeTab === "javascript" ? jsCode : pyCode}
          </pre>
        </div>

        <div className="flex items-center gap-2 text-xs muted">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span>All API requests are protected by PostgreSQL Row-Level Security (RLS) and token encryption.</span>
        </div>
      </div>
    </div>
  );
}
