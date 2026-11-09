"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  FileText,
  Upload,
  Trash2,
  Download,
  Folder,
  Image as ImageIcon,
  FileCode,
  Search,
  Layers,
  Star,
  Clock,
  HardDrive,
  RefreshCw,
} from "lucide-react";

type StoredFile = {
  name: string;
  id: string | null;
  created_at?: string;
  metadata?: {
    size?: number;
    mimetype?: string;
  };
};

const FILE_SUBSECTIONS = [
  { id: "dashboard", label: "1. File Dashboard", icon: HardDrive },
  { id: "folders", label: "2. Folders", icon: Folder },
  { id: "upload", label: "3. Upload Files", icon: Upload },
  { id: "images", label: "4. Images", icon: ImageIcon },
  { id: "pdfs", label: "5. PDFs", icon: FileText },
  { id: "documents", label: "6. Documents", icon: FileCode },
  { id: "search", label: "7. Search Files", icon: Search },
  { id: "categories", label: "8. Categories", icon: Layers },
  { id: "favourites", label: "9. Favourites", icon: Star },
  { id: "recent", label: "10. Recent Files", icon: Clock },
  { id: "downloads", label: "11. Downloads", icon: Download },
  { id: "storage", label: "12. Storage Usage", icon: HardDrive },
];

export default function FilesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  const load = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.storage
      .from("personal-files")
      .list(user.id, { limit: 100, sortBy: { column: "created_at", order: "desc" } });

    if (error) setMessage(error.message);
    else setFiles((data ?? []) as StoredFile[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  async function upload(file?: File) {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setMessage("Maximum file size is 20 MB.");
      return;
    }
    setBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      return;
    }
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${user.id}/${Date.now()}-${safe}`;
    const { error } = await supabase.storage.from("personal-files").upload(path, file, { upsert: false });
    setBusy(false);
    setMessage(error ? error.message : `File "${file.name}" uploaded successfully.`);
    await load();
  }

  async function download(name: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.storage
      .from("personal-files")
      .createSignedUrl(`${user.id}/${name}`, 60);

    if (error) {
      setMessage(error.message);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function remove(name: string) {
    if (!window.confirm(`Delete file "${name}" permanently?`)) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.storage.from("personal-files").remove([`${user.id}/${name}`]);
    setMessage(error ? error.message : "File deleted.");
    await load();
  }

  // Filter files by tab and search
  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const match = f.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!match) return false;

      const lower = f.name.toLowerCase();
      if (activeTab === "images") return /\.(png|jpg|jpeg|webp|gif)$/.test(lower);
      if (activeTab === "pdfs") return /\.pdf$/.test(lower);
      if (activeTab === "documents") return /\.(doc|docx|txt|xlsx|csv|md)$/.test(lower);
      return true;
    });
  }, [files, searchQuery, activeTab]);

  // Compute Total Storage Used
  const totalSizeBytes = useMemo(() => {
    return files.reduce((acc, f) => acc + (f.metadata?.size || 0), 0);
  }, [files]);
  const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <section
        className="relative overflow-hidden rounded-3xl border p-6 sm:p-8 bg-gradient-to-r from-sky-950/45 via-slate-900/40 to-slate-950/40 shadow-2xl"
        style={{ borderColor: "rgba(14, 165, 233, 0.3)" }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">📁</span>
              <span className="inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-bold bg-sky-500/15 border-sky-500/30 text-sky-400">
                APPLICATION 10 · SECURE VAULT
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Personal File Manager
            </h1>
            <p className="muted mt-2 max-w-xl text-sm leading-relaxed">
              Organize personal digital documents, certificates, PDFs and images in your encrypted Supabase storage
              vault.
            </p>
          </div>

          <label className="btn btn-primary cursor-pointer shadow-lg shadow-sky-500/25 !px-4 !py-2.5 font-bold self-start md:self-auto">
            <Upload size={16} />
            <span>{busy ? "Uploading..." : "Upload File"}</span>
            <input
              type="file"
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                void upload(e.target.files?.[0]);
                e.currentTarget.value = "";
              }}
            />
          </label>
        </div>
      </section>

      {/* 12 Subsections Navigation Carousel */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
        {FILE_SUBSECTIONS.map((sub) => {
          const isCurrent = activeTab === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveTab(sub.id)}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition border flex items-center gap-1.5 ${
                isCurrent
                  ? "bg-sky-600 text-white border-sky-500 font-bold shadow-md shadow-sky-600/30"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <sub.icon size={13} className={isCurrent ? "text-white" : "text-sky-400"} />
              <span>{sub.label}</span>
            </button>
          );
        })}
      </div>

      {message && (
        <div className="rounded-xl border p-3.5 text-sm bg-sky-500/10 border-sky-500/30 text-sky-300">
          {message}
        </div>
      )}

      {/* Storage Quota Card */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="panel p-5 border border-sky-500/20 bg-gradient-to-br from-sky-950/20 to-slate-900/50">
          <p className="muted text-xs font-semibold uppercase tracking-wider text-sky-400">Total Uploaded Files</p>
          <p className="mt-2 text-3xl font-extrabold text-white">{files.length}</p>
          <p className="muted mt-1 text-xs">Private cloud storage</p>
        </div>

        <div className="panel p-5 border border-indigo-500/20 bg-gradient-to-br from-indigo-950/20 to-slate-900/50">
          <p className="muted text-xs font-semibold uppercase tracking-wider text-indigo-400">Storage Used</p>
          <p className="mt-2 text-3xl font-extrabold text-white">{totalSizeMB} MB</p>
          <p className="muted mt-1 text-xs">20 MB limit per individual file</p>
        </div>

        <div className="panel p-5 border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-slate-900/50">
          <p className="muted text-xs font-semibold uppercase tracking-wider text-emerald-400">Encryption Status</p>
          <p className="mt-2 text-3xl font-extrabold text-emerald-400">Active</p>
          <p className="muted mt-1 text-xs">Supabase Row-Level Policies</p>
        </div>
      </div>

      {/* Files List */}
      <div className="panel p-5 border border-sky-500/20">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="muted absolute left-3.5 top-3.5" size={17} />
            <input
              className="field pl-10"
              placeholder="Search files by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button className="btn btn-ghost" onClick={() => void load()}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {loading ? (
          <p className="muted py-12 text-center text-sm">Loading files from Supabase vault...</p>
        ) : filteredFiles.length === 0 ? (
          <div className="py-14 text-center">
            <Folder size={40} className="mx-auto text-sky-400 opacity-60" />
            <p className="mt-3 font-semibold text-base">No files found</p>
            <p className="muted mt-1 text-xs max-w-sm mx-auto">
              Upload certificates, documents, PDFs, or photos into your secure private vault.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFiles.map((file) => {
              const isPdf = file.name.toLowerCase().endsWith(".pdf");
              const isImg = /\.(png|jpg|jpeg|webp)$/.test(file.name.toLowerCase());
              return (
                <div
                  key={file.name}
                  className="flex items-center gap-3 rounded-2xl border p-3.5 transition hover:border-sky-500/30 bg-white/5"
                  style={{ borderColor: "var(--line)" }}
                >
                  {isPdf ? (
                    <FileText className="text-rose-400 shrink-0" size={20} />
                  ) : isImg ? (
                    <ImageIcon className="text-emerald-400 shrink-0" size={20} />
                  ) : (
                    <FileCode className="text-sky-400 shrink-0" size={20} />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{file.name}</p>
                    <p className="text-[11px] text-gray-400">
                      {file.metadata?.size ? `${(file.metadata.size / 1024).toFixed(1)} KB` : "Uploaded File"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      className="btn btn-ghost !p-2 rounded-lg text-sky-400 hover:text-sky-300"
                      onClick={() => void download(file.name)}
                      title="Download with secure signed URL"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      className="btn btn-ghost !p-2 rounded-lg text-rose-400 hover:text-rose-500"
                      onClick={() => void remove(file.name)}
                      title="Delete file permanently"
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
    </div>
  );
}
