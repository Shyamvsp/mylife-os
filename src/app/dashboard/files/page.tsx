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
  Globe,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
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

type AdminSharedDoc = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  createdAt: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  downloadUrl: string;
  storagePath: string;
  scope: "admin_only" | "everyone";
  category: string;
  uploadedBy: string;
  downloadCount: number;
};

const FILE_SUBSECTIONS = [
  { id: "dashboard", label: "1. File Dashboard", icon: HardDrive },
  { id: "admin_broadcast", label: "2. 📢 Admin Shared Vault", icon: Globe },
  { id: "folders", label: "3. Folders", icon: Folder },
  { id: "upload", label: "4. Upload Files", icon: Upload },
  { id: "images", label: "5. Images", icon: ImageIcon },
  { id: "pdfs", label: "6. PDFs", icon: FileText },
  { id: "documents", label: "7. Documents", icon: FileCode },
  { id: "search", label: "8. Search Files", icon: Search },
  { id: "categories", label: "9. Categories", icon: Layers },
  { id: "favourites", label: "10. Favourites", icon: Star },
  { id: "recent", label: "11. Recent Files", icon: Clock },
  { id: "downloads", label: "12. Downloads", icon: Download },
  { id: "storage", label: "13. Storage Usage", icon: HardDrive },
];

export default function FilesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Admin Broadcast Documents state
  const [adminDocs, setAdminDocs] = useState<AdminSharedDoc[]>([]);
  const [loadingAdminDocs, setLoadingAdminDocs] = useState(false);
  const [adminDocSearch, setAdminDocSearch] = useState("");
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);

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

  const loadAdminDocs = useCallback(async () => {
    setLoadingAdminDocs(true);
    try {
      const res = await fetch("/api/admin/documents");
      if (res.ok) {
        const data = await res.json();
        setAdminDocs(data.documents || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAdminDocs(false);
    }
  }, []);

  useEffect(() => {
    void load();
    void loadAdminDocs();
  }, [load, loadAdminDocs]);

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

  const copyDocLink = (doc: AdminSharedDoc) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://mylife-os-silk.vercel.app";
    const directUrl = `${origin}/api/admin/documents/download?id=${doc.id}`;
    void navigator.clipboard.writeText(directUrl);
    setCopiedDocId(doc.id);
    setTimeout(() => setCopiedDocId(null), 2500);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Filter personal files by tab and search
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

  // Filter admin broadcast docs
  const filteredAdminDocs = useMemo(() => {
    if (!adminDocSearch.trim()) return adminDocs;
    const q = adminDocSearch.toLowerCase();
    return adminDocs.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q)) ||
        d.fileName.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
    );
  }, [adminDocs, adminDocSearch]);

  // Compute Total Personal Storage Used
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
              Personal File Manager & Vault
            </h1>
            <p className="muted mt-2 max-w-xl text-sm leading-relaxed">
              Organize personal digital documents, certificates, PDFs, and access official documents broadcasted by Admin across all devices.
            </p>
          </div>

          <label className="btn btn-primary cursor-pointer shadow-lg shadow-sky-500/25 !px-4 !py-2.5 font-bold self-start md:self-auto">
            <Upload size={16} />
            <span>{busy ? "Uploading..." : "Upload Personal File"}</span>
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

      {/* 13 Subsections Navigation Carousel */}
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

      {/* ============================================================== */}
      {/* SECTION: OFFICIAL DOCUMENTS BROADCASTED BY ADMIN (Tier 2 Vault) */}
      {/* ============================================================== */}
      {(activeTab === "dashboard" || activeTab === "admin_broadcast") && (
        <div className="panel p-6 border-2 border-sky-500/30 bg-gradient-to-br from-sky-950/30 via-slate-900/60 to-slate-950/80 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <Globe size={18} />
                </span>
                <h2 className="text-xl font-black text-white tracking-tight">
                  Official Documents Broadcasted by Admin
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Official guides, policy documents, announcements and shared files from Master Admin. 1-tap download directly to your mobile phone or PC.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="muted absolute left-3 top-2.5" size={14} />
                <input
                  type="text"
                  placeholder="Search admin documents..."
                  value={adminDocSearch}
                  onChange={(e) => setAdminDocSearch(e.target.value)}
                  className="bg-slate-950/80 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 w-48 sm:w-64"
                />
              </div>

              <button
                type="button"
                onClick={() => void loadAdminDocs()}
                className="btn btn-ghost !p-2 rounded-xl text-sky-400 hover:text-white hover:bg-white/10"
                title="Refresh broadcast documents"
              >
                <RefreshCw size={14} className={loadingAdminDocs ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {loadingAdminDocs ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <RefreshCw size={24} className="animate-spin mx-auto text-sky-400" />
              <p className="text-xs">Syncing shared documents from Admin Vault...</p>
            </div>
          ) : filteredAdminDocs.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <Sparkles size={32} className="mx-auto text-sky-400/50 mb-2" />
              <p className="text-sm font-semibold text-slate-300">No Admin Broadcast Documents Yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                When Master Admin uploads documents and broadcasts to everyone, they will automatically appear here with 1-tap direct download.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5 relative z-10">
              {filteredAdminDocs.map((doc) => {
                const isCopied = copiedDocId === doc.id;
                const isPdf = doc.fileName.toLowerCase().endsWith(".pdf");
                const isImg = /\.(png|jpg|jpeg|webp)$/.test(doc.fileName.toLowerCase());

                return (
                  <div
                    key={doc.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-sky-500/20 bg-slate-950/70 p-4 transition-all duration-200 hover:border-sky-400/50 hover:bg-slate-900/80 hover:shadow-xl hover:shadow-sky-500/10"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 shrink-0 border border-sky-500/20">
                            {isPdf ? <FileText size={18} className="text-rose-400" /> : isImg ? <ImageIcon size={18} className="text-emerald-400" /> : <FileCode size={18} className="text-sky-400" />}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-white truncate group-hover:text-sky-300 transition" title={doc.title}>
                              {doc.title}
                            </h3>
                            <p className="text-[11px] text-slate-400 truncate">{doc.fileName}</p>
                          </div>
                        </div>

                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 uppercase">
                          {doc.category || "General"}
                        </span>
                      </div>

                      {doc.description && (
                        <p className="text-xs text-slate-300 line-clamp-2 my-2 leading-relaxed bg-white/5 p-2 rounded-lg">
                          {doc.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 py-1">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>{doc.date}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-medium">{doc.downloadCount || 0} downloads</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-3 mt-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => copyDocLink(doc)}
                        className="btn btn-ghost !py-1.5 !px-2.5 text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1.5 rounded-xl border border-sky-500/20 hover:border-sky-500/40"
                        title="Copy direct shareable download link"
                      >
                        {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        <span>{isCopied ? "Link Copied!" : "Share Link"}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={doc.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-ghost !p-1.5 text-slate-400 hover:text-white rounded-xl"
                          title="Preview document in browser"
                        >
                          <ExternalLink size={14} />
                        </a>

                        <a
                          href={`/api/admin/documents/download?id=${doc.id}`}
                          download={doc.fileName}
                          className="btn btn-primary !py-1.5 !px-3 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/30"
                          title="Download directly to your device"
                        >
                          <Download size={13} />
                          <span>Download</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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

      {/* Personal Files List */}
      <div className="panel p-5 border border-sky-500/20">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="muted absolute left-3.5 top-3.5" size={17} />
            <input
              className="field pl-10"
              placeholder="Search personal files by name..."
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
