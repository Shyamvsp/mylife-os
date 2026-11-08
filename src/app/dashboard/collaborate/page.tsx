"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, Shield, Check, Copy, Trash2, ArrowRight, Sparkles } from "lucide-react";
import { MODULES, type ModuleKey } from "@/lib/modules";

interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: "client" | "friend" | "team";
  allowedModules: ModuleKey[];
  inviteUrl: string;
  created_at: string;
}

export default function CollaboratePage() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"client" | "friend" | "team">("client");
  const [selectedModules, setSelectedModules] = useState<ModuleKey[]>(["projects", "tasks"]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(() => {
    try {
      const stored = localStorage.getItem("mylife_collaborators");
      if (stored) {
        setCollaborators(JSON.parse(stored));
      } else {
        // Initial sample collaborator for Shyam
        const initial: Collaborator[] = [
          {
            id: "client-sample-1",
            name: "Alpha Client Corp",
            email: "client@alphacorp.com",
            role: "client",
            allowedModules: ["projects", "tasks", "calendar"],
            inviteUrl: `${window.location.origin}/dashboard/shares`,
            created_at: new Date().toLocaleDateString(),
          },
        ];
        setCollaborators(initial);
        localStorage.setItem("mylife_collaborators", JSON.stringify(initial));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleModule = (key: ModuleKey) => {
    setSelectedModules((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    );
  };

  const handleRoleChange = (newRole: "client" | "friend" | "team") => {
    setRole(newRole);
    if (newRole === "client") {
      setSelectedModules(["projects", "tasks", "calendar"]);
    } else if (newRole === "friend") {
      setSelectedModules(["fitness", "study", "habits", "goals"]);
    } else {
      setSelectedModules(Object.keys(MODULES) as ModuleKey[]);
    }
  };

  const addCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const newCollab: Collaborator = {
      id: "collab-" + Date.now(),
      name: name.trim(),
      email: email.trim(),
      role,
      allowedModules: selectedModules,
      inviteUrl: `${window.location.origin}/dashboard/shares`,
      created_at: new Date().toLocaleDateString(),
    };

    const updated = [newCollab, ...collaborators];
    setCollaborators(updated);
    localStorage.setItem("mylife_collaborators", JSON.stringify(updated));

    setName("");
    setEmail("");
    setModalOpen(false);
  };

  const removeCollaborator = (id: string) => {
    if (!confirm("Revoke access for this collaborator?")) return;
    const updated = collaborators.filter((c) => c.id !== id);
    setCollaborators(updated);
    localStorage.setItem("mylife_collaborators", JSON.stringify(updated));
  };

  const copyInvite = async (c: Collaborator) => {
    await navigator.clipboard.writeText(c.inviteUrl);
    setCopiedId(c.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-7">
      {/* Header Banner */}
      <div
        className="relative overflow-hidden rounded-3xl border p-6 sm:p-8 bg-gradient-to-r from-indigo-900/25 via-cyan-900/15 to-transparent"
        style={{ borderColor: "var(--line)", background: "var(--card)" }}
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🤝</span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-xs font-semibold text-cyan-400">
                <Sparkles size={12} /> CLIENTS & FRIENDS NETWORK
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Collaboration Hub</h1>
            <p className="muted mt-2 max-w-xl text-sm leading-relaxed">
              Connect your clients, friends, and team members to your private operating system. Share specific modules while keeping your finances and private journals completely protected.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="btn btn-primary shadow-lg shadow-indigo-500/25 flex items-center gap-2"
          >
            <UserPlus size={17} /> Add Client / Friend
          </button>
        </div>
      </div>

      {/* Collaborator Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collaborators.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl border p-5 flex flex-col justify-between transition hover:shadow-lg"
            style={{ background: "var(--card)", borderColor: "var(--line)" }}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-base">{c.name}</h3>
                  <p className="muted text-xs font-mono mt-0.5">{c.email}</p>
                </div>
                <span
                  className={`capitalize rounded-lg px-2 py-0.5 text-[11px] font-bold border ${
                    c.role === "client"
                      ? "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
                      : c.role === "friend"
                      ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                      : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  }`}
                >
                  {c.role}
                </span>
              </div>

              {/* Allowed Modules */}
              <div className="mt-4">
                <p className="muted text-[11px] font-semibold uppercase tracking-wider mb-2">Permitted Applications:</p>
                <div className="flex flex-wrap gap-1.5">
                  {c.allowedModules.map((m) => (
                    <span
                      key={m}
                      className="rounded-md border px-2 py-0.5 text-xs font-medium"
                      style={{ background: "var(--background)", borderColor: "var(--line)" }}
                    >
                      {MODULES[m]?.emoji} {MODULES[m]?.title}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 border-t pt-3 flex items-center justify-between" style={{ borderColor: "var(--line)" }}>
              <button
                onClick={() => copyInvite(c)}
                className="btn btn-ghost !py-1.5 !px-3 text-xs flex items-center gap-1.5"
              >
                {copiedId === c.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                {copiedId === c.id ? "Link Copied!" : "Copy Portal Link"}
              </button>

              <button
                onClick={() => removeCollaborator(c.id)}
                className="btn btn-ghost !p-2 text-rose-500 hover:text-rose-600 rounded-lg"
                title="Revoke access"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Security Privacy Notice */}
      <div className="panel p-5 flex items-start gap-3.5">
        <Shield className="text-indigo-500 shrink-0 mt-0.5" size={22} />
        <div>
          <h4 className="font-semibold text-sm">Strict Zero-Leak Privacy</h4>
          <p className="muted text-xs mt-1 leading-relaxed">
            Your personal expenses, sensitive health notes, and private daily journals are never shared with clients or friends. Collaborators can only view records in the specific modules you explicitly authorize.
          </p>
        </div>
      </div>

      {/* Add Collaborator Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4">
          <form
            onSubmit={addCollaborator}
            className="panel my-8 max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 sm:p-8"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="text-indigo-500" size={22} /> Add Client or Friend
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn btn-ghost !p-2 rounded-xl text-gray-400"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <label className="block text-sm">
                Collaborator Name
                <input
                  className="field mt-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Corp / Alex Smith"
                  required
                />
              </label>

              <label className="block text-sm">
                Email Address
                <input
                  type="email"
                  className="field mt-1"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. client@acmecorp.com"
                  required
                />
              </label>

              <div>
                <label className="block text-sm mb-1.5 font-medium">Relationship Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["client", "friend", "team"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleChange(r)}
                      className={`rounded-xl border p-2.5 text-xs font-bold capitalize transition ${
                        role === r
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20"
                          : "btn-ghost"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2 font-medium">Choose Authorized Applications:</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(MODULES) as ModuleKey[]).map((m) => {
                    const isSelected = selectedModules.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleModule(m)}
                        className={`flex items-center justify-between rounded-xl border p-2.5 text-xs font-semibold transition ${
                          isSelected
                            ? "bg-indigo-500/15 border-indigo-500 text-indigo-500"
                            : "btn-ghost text-gray-400"
                        }`}
                      >
                        <span>
                          {MODULES[m].emoji} {MODULES[m].title}
                        </span>
                        {isSelected && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 border-t pt-4 flex justify-end gap-2" style={{ borderColor: "var(--line)" }}>
              <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Create Access Portal <ArrowRight size={15} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
