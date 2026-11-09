import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Dumbbell,
  Code,
  Award,
  FolderKanban,
  NotebookPen,
  Wallet,
  Target,
  Files,
  CalendarDays,
  Activity,
  Home,
  Sparkles,
  Layers,
  CheckCircle,
} from "lucide-react";
import { TWELVE_APPLICATIONS } from "@/lib/modules";
import { createClient } from "@/lib/supabase/server";

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Home,
  BookOpen,
  Dumbbell,
  Code,
  Award,
  FolderKanban,
  NotebookPen,
  Wallet,
  Target,
  Files,
  CalendarDays,
  Activity,
};

export default async function ApplicationsPage() {
  const supabase = await createClient();

  // Fetch real count for each module from database
  const { data: entries } = await supabase
    .from("entries")
    .select("module")
    .eq("is_archived", false);

  const counts: Record<string, number> = {};
  (entries || []).forEach((e) => {
    counts[e.module] = (counts[e.module] || 0) + 1;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <section
        className="relative overflow-hidden rounded-3xl border p-6 sm:p-9 bg-gradient-to-r from-indigo-950/40 via-purple-950/25 to-slate-950/40 shadow-xl"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/25 px-3 py-1 text-xs font-semibold text-indigo-400">
              <Sparkles size={13} className="text-cyan-400" /> MyLife OS 2.0 System Architecture
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">The 12 Core Applications</h1>
          <p className="muted mt-2.5 text-sm sm:text-base leading-relaxed">
            Your unified personal operating system. Every application features its own independent visual identity,
            12 dedicated subcategories, live analytics, and seamless database synchronization.
          </p>
        </div>
      </section>

      {/* Grid of the 12 Applications */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {TWELVE_APPLICATIONS.map((app) => {
          const IconComponent = iconMap[app.icon] || Layers;
          const liveCount =
            app.key === "dashboard"
              ? entries?.length ?? 0
              : app.key === "analytics"
              ? 12
              : app.key === "files"
              ? "Storage"
              : counts[app.key] ?? 0;

          return (
            <div
              key={app.key}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl bg-gradient-to-br ${app.gradient}`}
              style={{
                borderColor: "var(--line)",
                background: "color-mix(in srgb, var(--card) 90%, transparent)",
              }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl filter drop-shadow">{app.emoji}</span>
                    <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[11px] font-bold text-gray-400">
                      APP {String(app.appNumber).padStart(2, "0")}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${app.accentBadge}`}
                  >
                    <CheckCircle size={11} />
                    {typeof liveCount === "number" ? `${liveCount} entries` : liveCount}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <IconComponent size={20} className="text-indigo-400" />
                  <h3 className="font-bold text-lg tracking-tight">{app.title}</h3>
                </div>

                <p className="muted mt-2 text-xs sm:text-sm leading-relaxed line-clamp-3">
                  {app.description}
                </p>

                <div className="mt-4 flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                  <Layers size={13} className="text-indigo-400" />
                  <span>12 Subsections & Dedicated Dashboards</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5">
                <Link
                  href={app.route}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-indigo-600 border border-white/10 hover:border-indigo-500 py-2.5 px-4 text-xs font-bold transition duration-200 group-hover:text-white shadow-sm"
                >
                  <span>Open {app.shortTitle}</span>
                  <ArrowUpRight
                    size={15}
                    className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </Link>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
