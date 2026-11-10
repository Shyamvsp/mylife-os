"use client";

import Link from "next/link";
import {
  Download,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Laptop,
  HelpCircle,
  Sparkles,
} from "lucide-react";

export default function DownloadPage() {
  const apkDownloadUrl = "/MyLife-OS.apk";

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))]" />

      {/* Top Navbar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-fuchsia-500 p-[1px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#0b101d] rounded-xl flex items-center justify-center font-black text-cyan-400 text-lg">
              OS
            </div>
          </div>
          <div>
            <div className="font-bold text-base tracking-wide text-white">
              MyLife <span className="text-cyan-400">OS 3.0</span>
            </div>
            <div className="text-[11px] text-slate-400">Official Mobile App</div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs text-slate-300 hover:text-white px-3 py-2 rounded-lg border border-slate-700/60 hover:bg-slate-800/60 transition"
          >
            Open Web App
          </Link>
          <Link
            href="/dashboard"
            className="text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-4 py-2 rounded-lg transition shadow-md shadow-cyan-500/20"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 space-y-10">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-medium">
            <Sparkles size={14} />
            Standalone Native Android Experience
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Download <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">MyLife OS</span> for Android
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Run all 12 personal productivity applications directly on your phone — full screen, no Chrome URL bar, ultra-fast performance, and direct home screen launch.
          </p>

          {/* Primary Download CTA Card */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={apkDownloadUrl}
              download="MyLife-OS.apk"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold px-8 py-4 rounded-2xl text-base shadow-xl shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Download size={22} className="animate-bounce" />
              <span>Download MyLife-OS.apk (990 KB)</span>
            </a>

            <a
              href="#instructions"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-slate-300 hover:text-white px-6 py-4 rounded-2xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800/80 transition text-sm font-medium"
            >
              <HelpCircle size={18} />
              How to Install (4 Steps)
            </a>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-2">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck size={16} /> 100% Virus Free & Verified
            </span>
            <span>•</span>
            <span>Size: <strong>990 KB</strong></span>
            <span>•</span>
            <span>Android 7.0+</span>
          </div>
        </div>

        {/* NOTICE: Explaining the "Can't preview this file type" issue */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 text-left space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <AlertTriangle size={18} />
            Did your phone say &ldquo;Can&apos;t preview this file type&rdquo;?
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            If you previously used Chrome&apos;s browser menu (⋮ &rarr; Download Page), Chrome downloaded an <strong>offline web page (135 kB)</strong> instead of the actual Android Application.
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            To get the real app, tap the green <strong>&ldquo;Download MyLife-OS.apk&rdquo;</strong> button above. The real app file ends in <code>.apk</code> and is <strong>990 KB</strong>. When you tap it, Android Package Installer will open immediately!
          </p>
        </div>

        {/* Step-by-Step Installation Guide */}
        <section id="instructions" className="space-y-6 pt-4">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-white">How to Install in 4 Simple Steps</h2>
            <p className="text-xs sm:text-sm text-slate-400">Takes less than 30 seconds on any Android phone</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Step 1 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden">
              <div className="absolute top-3 right-4 text-3xl font-black text-slate-800 select-none">01</div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                <Download size={20} />
              </div>
              <h3 className="text-base font-bold text-white">1. Tap &ldquo;Download APK&rdquo;</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tap the download button above. Your phone will immediately begin downloading <code>MyLife-OS.apk</code>.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden">
              <div className="absolute top-3 right-4 text-3xl font-black text-slate-800 select-none">02</div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-base font-bold text-white">2. Tap &ldquo;Download Anyway&rdquo;</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Android Chrome will show a standard notice: <em>&ldquo;File might be harmful&rdquo;</em>. Tap <strong>&ldquo;Download anyway&rdquo;</strong>. This is standard for direct APK installs.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden">
              <div className="absolute top-3 right-4 text-3xl font-black text-slate-800 select-none">03</div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                <Smartphone size={20} />
              </div>
              <h3 className="text-base font-bold text-white">3. Tap &ldquo;Open&rdquo; &rarr; &ldquo;Install&rdquo;</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Once downloaded, tap <strong>Open</strong> from the notification bar. When asked <em>&ldquo;Do you want to install this app?&rdquo;</em>, tap <strong>Install</strong>.
              </p>
              <div className="text-[11px] text-slate-500">
                *(If prompted &ldquo;Install unknown apps&rdquo;, toggle &ldquo;Allow from this source&rdquo;)*
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden">
              <div className="absolute top-3 right-4 text-3xl font-black text-slate-800 select-none">04</div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle2 size={20} />
              </div>
              <h3 className="text-base font-bold text-white">4. Done! Launch from Home Screen</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tap <strong>Open</strong>. The MyLife OS app icon is now installed directly on your Android phone home screen!
              </p>
            </div>
          </div>
        </section>

        {/* Alternative: Instant PWA Option */}
        <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-cyan-950/40 border border-indigo-500/30 rounded-2xl p-6 text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
              <Laptop size={18} />
              Alternative: Instant Install via Browser (PWA)
            </div>
            <p className="text-xs text-slate-400">
              Prefer zero file download? In Chrome or Edge, tap the 3-dot menu (⋮) &rarr; tap <strong>&ldquo;Add to Home Screen&rdquo;</strong> or <strong>&ldquo;Install App&rdquo;</strong>.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 transition whitespace-nowrap"
          >
            Open Web Version <ArrowRight size={14} />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/80 px-6 py-6 text-center text-xs text-slate-500">
        <div className="flex flex-wrap items-center justify-center gap-4 mb-2">
          <Link href="/login" className="hover:text-slate-300 transition">Sign In</Link>
          <span>•</span>
          <Link href="/dashboard" className="hover:text-slate-300 transition">Dashboard</Link>
          <span>•</span>
          <a href="/MyLife-OS.apk" download="MyLife-OS.apk" className="text-cyan-400 hover:text-cyan-300 transition">Download APK</a>
        </div>
        <div>MyLife OS 3.0 &copy; {new Date().getFullYear()} — Master Personal Operating System</div>
      </footer>
    </div>
  );
}
