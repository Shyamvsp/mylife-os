"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Mic, MicOff, Send, X, Check, ArrowRight, Zap, RefreshCw, Globe, Minus, Maximize2, Volume2, VolumeX } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MODULES } from "@/lib/modules";
import { parseNaturalLanguageCommand, type AgentResult, type ParsedEntryAction } from "@/lib/ai-agent";
import Link from "next/link";

interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text?: string;
  results?: AgentResult[];
  timestamp: string;
  savedActions?: Record<number, boolean>;
}

interface ISpeechResult {
  transcript: string;
}

interface ISpeechEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: ISpeechResult;
    };
  };
}

interface ISpeechErrorEvent {
  error: string;
  message?: string;
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives?: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: ISpeechEvent) => void) | null;
  onerror: ((event: ISpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

export function AiAgentWidget() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [input, setInput] = useState("");
  const [autoSave, setAutoSave] = useState(true);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechLang, setSpeechLang] = useState<"en-IN" | "en-US" | "hi-IN">("en-IN");
  const [micStatusText, setMicStatusText] = useState("");
  const [soundDetected, setSoundDetected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const finalTranscriptRef = useRef("");
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const handleSendRef = useRef<((customPrompt?: string) => Promise<void>) | null>(null);

  // Web Audio Visualizer references
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const visualizerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const win = window as unknown as {
        SpeechRecognition?: new () => ISpeechRecognition;
        webkitSpeechRecognition?: new () => ISpeechRecognition;
      };
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        setSpeechSupported(true);
      }
    }

    setMessages([
      {
        id: "intro",
        sender: "agent",
        text: "👋 Hi Shyam! I am your Antigravity AI Agent.\n\nTap the mic and speak anytime. I understand your voice commands and will automatically store your workouts, studies, expenses, goals, and tasks into your database.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [open, messages]);

  // Clean up visualizer animation and audio streams
  const stopAudioVisualizer = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        void audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }
    setSoundDetected(false);
  }, []);

  const startAudioVisualizer = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) return;

    try {
      stopAudioVisualizer();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const drawWaveform = () => {
        if (!isListeningRef.current) return;
        animFrameRef.current = requestAnimationFrame(drawWaveform);

        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setSoundDetected(average > 12);

        const canvas = visualizerCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const w = (canvas.width = canvas.clientWidth || 300);
        const h = (canvas.height = canvas.clientHeight || 40);

        ctx.clearRect(0, 0, w, h);

        const barWidth = (w / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = Math.max(3, (dataArray[i] / 255) * h * 0.9);

          const grad = ctx.createLinearGradient(0, h - barHeight, 0, h);
          grad.addColorStop(0, average > 12 ? "#10b981" : "#6366f1");
          grad.addColorStop(1, average > 12 ? "#06b6d4" : "#a855f7");

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, (h - barHeight) / 2, barWidth - 2, barHeight, 4);
          ctx.fill();

          x += barWidth + 2;
        }
      };

      drawWaveform();
    } catch (err) {
      console.warn("Audio visualizer microphone stream request:", err);
    }
  }, [stopAudioVisualizer]);

  // Audible Text-to-Speech Voice Responses
  const speakVoiceResponse = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window) || !voiceEnabled) return;
      try {
        window.speechSynthesis.cancel();
        // Remove markdown formatting
        const clean = text.replace(/[*_#`[\]()•]/g, "").trim();
        if (!clean) return;
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.lang = speechLang;
        const voices = window.speechSynthesis.getVoices();
        const matchingVoice =
          voices.find((v) => v.lang.toLowerCase() === speechLang.toLowerCase()) ||
          voices.find((v) => v.lang.startsWith(speechLang.slice(0, 2))) ||
          voices[0];
        if (matchingVoice) utterance.voice = matchingVoice;
        utterance.rate = 1.02;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("TTS speech error:", err);
      }
    },
    [voiceEnabled, speechLang]
  );

  const stopListening = useCallback(
    (autoSubmit = false) => {
      isListeningRef.current = false;
      setListening(false);
      setMicStatusText("");
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }

      stopAudioVisualizer();

      if (autoSubmit) {
        const textToSubmit = (finalTranscriptRef.current || input).trim();
        if (textToSubmit && handleSendRef.current) {
          void handleSendRef.current(textToSubmit);
        }
      }
    },
    [stopAudioVisualizer, input]
  );

  const initRecognition = useCallback(() => {
    if (typeof window === "undefined") return null;

    const win = window as unknown as {
      SpeechRecognition?: new () => ISpeechRecognition;
      webkitSpeechRecognition?: new () => ISpeechRecognition;
    };
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      return null;
    }

    const recog = new SpeechRecognitionClass();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = speechLang;
    recog.maxAlternatives = 1;

    recog.onstart = () => {
      isListeningRef.current = true;
      setListening(true);
      setMicStatusText("🎙️ Microphone active. Speak clearly...");
    };

    recog.onresult = (event: ISpeechEvent) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptChunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcriptChunk + " ";
        } else {
          interimTranscript += transcriptChunk;
        }
      }

      const combined = (finalTranscriptRef.current + interimTranscript).trim();
      if (combined) {
        setInput(combined);
      }

      // Auto-submit on 3 seconds silence after speech
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (isListeningRef.current && (finalTranscriptRef.current || combined).trim()) {
          stopListening(true);
        }
      }, 3000);
    };

    recog.onerror = (event: ISpeechErrorEvent) => {
      console.warn("Speech recognition event error:", event.error);

      if (event.error === "no-speech") {
        setMicStatusText("Listening... (waiting for speech)");
        return;
      }

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        alert(
          "Microphone permission was blocked! Please tap the lock/tune icon in your browser URL bar and set Microphone to 'Allow'."
        );
        stopListening();
        return;
      }

      if (event.error === "network") {
        setMicStatusText("Speech network status: reconnecting...");
      }
    };

    recog.onend = () => {
      // Safe asynchronous restart with 200ms debounce to prevent InvalidStateError
      if (isListeningRef.current) {
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => {
          if (!isListeningRef.current) return;
          try {
            const nextRecog = initRecognition();
            if (nextRecog) {
              nextRecog.start();
              recognitionRef.current = nextRecog;
            }
          } catch {
            // Keep listening state alive
          }
        }, 200);
      } else {
        stopListening();
      }
    };

    return recog;
  }, [speechLang, stopListening]);

  const startListening = useCallback(async () => {
    stopListening();

    // Start live audio visualizer
    await startAudioVisualizer();

    try {
      finalTranscriptRef.current = input ? input + " " : "";
      const recog = initRecognition();
      if (!recog) {
        alert("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge, or type your message.");
        stopListening();
        return;
      }

      recog.start();
      recognitionRef.current = recog;
      isListeningRef.current = true;
      setListening(true);
      setMicStatusText("🎙️ Listening... Speak your command.");
    } catch (err: unknown) {
      console.error("Failed to start speech recognition:", err);
      stopListening();
    }
  }, [input, initRecognition, startAudioVisualizer, stopListening]);

  const toggleMic = () => {
    if (listening) {
      stopListening(true);
    } else {
      void startListening();
    }
  };

  const executeAction = async (action: ParsedEntryAction, messageId: string, actionIndex: number) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert("Please sign in first to save entries.");
      return;
    }

    const payload = {
      user_id: user.id,
      module: action.module,
      title: action.title,
      details: action.details || null,
      entry_date: action.entry_date,
      data: action.data,
      is_archived: false,
    };

    const { error } = await supabase.from("entries").insert(payload);
    if (!error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, savedActions: { ...(msg.savedActions || {}), [actionIndex]: true } }
            : msg
        )
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("entry-saved", { detail: { module: action.module } }));
      }
    } else {
      alert("Could not save: " + error.message);
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || busy) return;

    if (listening) {
      stopListening();
    }

    const userMsgId = Date.now().toString();
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    finalTranscriptRef.current = "";
    setBusy(true);

    try {
      const results = parseNaturalLanguageCommand(textToSend);
      const agentMsgId = (Date.now() + 1).toString();
      const initialSaved: Record<number, boolean> = {};

      const agentMsg: ChatMessage = {
        id: agentMsgId,
        sender: "agent",
        results,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        savedActions: initialSaved,
      };

      setMessages((prev) => [...prev, agentMsg]);

      // Audible voice reply from the AI
      const voiceSpeech = results
        .map((r) => {
          if (r.type === "CREATE_ENTRY") return r.explanation;
          if (r.type === "CHAT_RESPONSE") return r.message;
          return "";
        })
        .filter(Boolean)
        .join(". ");

      if (voiceSpeech) {
        speakVoiceResponse(voiceSpeech);
      }

      if (autoSave) {
        for (let i = 0; i < results.length; i++) {
          const res = results[i];
          if (res.type === "CREATE_ENTRY") {
            await executeAction(res, agentMsgId, i);
          }
        }
      }

      for (const res of results) {
        if (res.type === "QUERY_INFO") {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            let q = supabase
              .from("entries")
              .select("module, title, entry_date, data")
              .eq("user_id", user.id)
              .eq("is_archived", false);
            if (res.targetModule) {
              q = q.eq("module", res.targetModule);
            }
            if (res.dateFilter === "today") {
              q = q.eq("entry_date", new Date().toISOString().slice(0, 10));
            }
            const { data } = await q.order("created_at", { ascending: false }).limit(6);

            const replyText =
              data && data.length > 0
                ? `Here are your ${res.targetModule ? MODULES[res.targetModule].title : "recent"} records:\n` +
                  data
                    .map(
                      (d: { module: string; title: string; entry_date: string }) =>
                        `• [${d.module.toUpperCase()}] ${d.title} (${d.entry_date})`
                    )
                    .join("\n")
                : `I didn't find any ${res.targetModule ? MODULES[res.targetModule].title : ""} records for that query yet.`;

            setMessages((prev) => [
              ...prev,
              {
                id: (Date.now() + 2).toString(),
                sender: "agent",
                text: replyText,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
            ]);

            speakVoiceResponse(replyText.replace(/•/g, ""));
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    handleSendRef.current = handleSend;
  });

  const quickVoiceChips = [
    { label: "🏋️ Chest Workout 45m", prompt: "Today I did 45 mins chest workout and 100 pushups burned 350 calories" },
    { label: "📚 Studied React 2h", prompt: "Today studied Next.js and React fullstack for 2 hours" },
    { label: "💰 Spent ₹150 Lunch", prompt: "Spent 150 rupees on lunch via UPI" },
    { label: "🎯 Goal: 10K Followers", prompt: "Set goal reach 10000 followers on Instagram this month" },
    { label: "💻 Added TypeScript Skill", prompt: "Add skill TypeScript 5 and AI Agent integration advanced" },
    { label: "📝 Daily Journal", prompt: "Journal: Building my own commercial SaaS platform today feeling great" },
  ];

  return (
    <>
      {/* Floating Antigravity AI Agent Trigger Button (when closed) */}
      {!open && (
        <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2">
          <button
            onClick={() => {
              setOpen(true);
              setMinimized(false);
            }}
            className="group relative flex items-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 px-4 py-3 text-white shadow-xl shadow-indigo-500/25 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/40 active:scale-95"
            aria-label="Open Antigravity AI Agent"
          >
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-300"></span>
            </span>
            <Sparkles className="animate-spin-slow transition-transform group-hover:rotate-12" size={19} />
            <span className="font-semibold tracking-wide text-sm sm:inline">AI Agent</span>
            <Mic size={16} className="text-indigo-200" />
          </button>
        </div>
      )}

      {/* Docked Minimized Mode (Always docked in bottom corner so it never disappears unexpectedly) */}
      {open && minimized && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl border border-indigo-500/30 bg-gray-950/95 backdrop-blur-md p-2 shadow-2xl text-white animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 px-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`inline-flex h-full w-full rounded-full ${listening ? "animate-ping bg-rose-400" : "bg-cyan-400"}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${listening ? "bg-rose-500" : "bg-cyan-300"}`}></span>
            </span>
            <span className="text-xs font-bold">{listening ? "🎙️ Recording Voice..." : "AI Agent"}</span>
          </div>

          {/* Quick Voice Mic Button */}
          <button
            type="button"
            onClick={toggleMic}
            className={`rounded-xl p-2 transition ${
              listening ? "bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/40" : "bg-white/10 hover:bg-white/20"
            }`}
            title={listening ? "Finish & Submit Voice" : "Tap to Speak Voice Command"}
          >
            {listening ? <MicOff size={15} /> : <Mic size={15} />}
          </button>

          {/* Expand to Full Chat */}
          <button
            type="button"
            onClick={() => setMinimized(false)}
            className="rounded-xl p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1 text-xs font-semibold px-2.5 shadow-md shadow-indigo-600/30"
            title="Expand to Full Chat Window"
          >
            <Maximize2 size={13} /> Expand
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={() => {
              stopListening(false);
              setOpen(false);
              setMinimized(false);
            }}
            className="rounded-xl p-1.5 hover:bg-white/10 text-gray-400 hover:text-white transition"
            title="Close AI Agent"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* AI Agent Full Window / Drawer (renders when open and not minimized) */}
      {open && !minimized && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            // Minimize instead of closing when clicking outside backdrop so user never loses state!
            if (e.target === e.currentTarget && !listening) {
              setMinimized(true);
            }
          }}
        >
          <div
            className="flex h-[92vh] sm:h-[680px] w-full max-w-xl flex-col rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
            style={{ background: "var(--card)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 sm:px-5 py-3" style={{ borderColor: "var(--line)" }}>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                    Antigravity AI Agent
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Live
                    </span>
                  </h3>
                  <p className="text-xs muted">Voice & text command across 12 modules</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Voice Audio Reply Toggle (Audible SpeechSynthesis) */}
                <button
                  type="button"
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold transition ${
                    voiceEnabled ? "text-indigo-400 border-indigo-500/30" : "text-gray-500"
                  }`}
                  style={{ borderColor: "var(--line)", background: "var(--background)" }}
                  title={voiceEnabled ? "Audible Voice Replies ON (tap to mute)" : "Audible Voice Replies MUTED (tap to unmute)"}
                >
                  {voiceEnabled ? <Volume2 size={13} className="text-indigo-400" /> : <VolumeX size={13} />}
                  <span className="hidden sm:inline">{voiceEnabled ? "Voice ON" : "Muted"}</span>
                </button>

                {/* Accent language toggle */}
                <button
                  type="button"
                  onClick={() =>
                    setSpeechLang((l) => (l === "en-IN" ? "hi-IN" : l === "hi-IN" ? "en-US" : "en-IN"))
                  }
                  className="flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold"
                  style={{ borderColor: "var(--line)", background: "var(--background)" }}
                  title="Toggle Speech Language: English (India), Hindi, or English (US)"
                >
                  <Globe size={12} />
                  <span>{speechLang === "en-IN" ? "🇮🇳 EN-IN" : speechLang === "hi-IN" ? "🇮🇳 HI-IN" : "🇺🇸 EN-US"}</span>
                </button>

                {/* Auto-save vs Review Toggle */}
                <button
                  onClick={() => setAutoSave(!autoSave)}
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition ${
                    autoSave
                      ? "bg-indigo-600/15 text-indigo-600 dark:text-indigo-400"
                      : "bg-black/5 dark:bg-white/5 text-gray-500"
                  }`}
                  title={autoSave ? "Auto-Save is ON: entries are stored automatically" : "Manual Review: you confirm before saving"}
                >
                  <Zap size={13} className={autoSave ? "fill-current" : ""} />
                  <span className="hidden sm:inline">{autoSave ? "Auto-Save" : "Review"}</span>
                </button>

                {/* Minimize Button */}
                <button
                  type="button"
                  onClick={() => setMinimized(true)}
                  className="btn btn-ghost !p-2 rounded-xl text-gray-400 hover:text-gray-100"
                  title="Minimize AI Agent"
                  aria-label="Minimize Agent"
                >
                  <Minus size={18} />
                </button>

                {/* Close Button */}
                <button
                  onClick={() => {
                    stopListening(false);
                    setOpen(false);
                    setMinimized(false);
                  }}
                  className="btn btn-ghost !p-2 rounded-xl text-gray-400 hover:text-gray-100"
                  aria-label="Close Agent"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  {msg.text && (
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.sender === "user"
                          ? "bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20"
                          : "rounded-bl-none border"
                      }`}
                      style={{
                        background: msg.sender === "user" ? undefined : "var(--background)",
                        borderColor: "var(--line)",
                      }}
                    >
                      {msg.text}
                    </div>
                  )}

                  {/* Render Parsed Actions */}
                  {msg.results && (
                    <div className="mt-2 space-y-2.5 w-full max-w-[95%]">
                      {msg.results.map((res, idx) => {
                        if (res.type === "CREATE_ENTRY") {
                          const isSaved = msg.savedActions?.[idx] ?? autoSave;
                          const mod = MODULES[res.module];

                          return (
                            <div
                              key={idx}
                              className="rounded-2xl border p-4 shadow-sm transition-all"
                              style={{ background: "var(--background)", borderColor: "var(--line)" }}
                            >
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                  <span>{mod.emoji}</span>
                                  {mod.title}
                                </span>
                                <span className="text-xs muted">{res.entry_date}</span>
                              </div>

                              <h4 className="font-semibold text-sm">{res.title}</h4>
                              <p className="text-xs muted mt-1">{res.explanation}</p>

                              <div className="mt-2.5 flex flex-wrap gap-1.5">
                                {Object.entries(res.data).map(([k, v]) => {
                                  if (!v) return null;
                                  return (
                                    <span
                                      key={k}
                                      className="rounded-md border px-2 py-0.5 text-[11px]"
                                      style={{ borderColor: "var(--line)", background: "var(--card)" }}
                                    >
                                      <strong className="font-medium muted">{k.replace("_", " ")}:</strong> {v}
                                    </span>
                                  );
                                })}
                              </div>

                              <div className="mt-3 flex items-center justify-between border-t pt-2.5" style={{ borderColor: "var(--line)" }}>
                                {isSaved ? (
                                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    <Check size={14} /> Stored in {mod.title}
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => executeAction(res, msg.id, idx)}
                                    className="btn btn-primary !py-1 !px-3 text-xs"
                                  >
                                    <Check size={13} /> Confirm & Save
                                  </button>
                                )}

                                <Link
                                  href={`/dashboard/${res.module}`}
                                  onClick={() => setOpen(false)}
                                  className="text-xs font-medium text-indigo-500 hover:underline flex items-center gap-1"
                                >
                                  Open {mod.title} <ArrowRight size={12} />
                                </Link>
                              </div>
                            </div>
                          );
                        }

                        if (res.type === "CHAT_RESPONSE") {
                          return (
                            <div
                              key={idx}
                              className="rounded-2xl border p-3.5 text-sm"
                              style={{ background: "var(--background)", borderColor: "var(--line)" }}
                            >
                              {res.message}
                            </div>
                          );
                        }

                        return null;
                      })}
                    </div>
                  )}

                  <span className="mt-1 px-1 text-[10px] muted">{msg.timestamp}</span>
                </div>
              ))}

              {busy && (
                <div className="flex items-center gap-2 text-xs muted p-2">
                  <RefreshCw className="animate-spin text-indigo-500" size={14} />
                  <span>Agent is analyzing and storing your data...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Action Chips */}
            <div className="border-t px-4 py-2 overflow-x-auto flex gap-2 no-scrollbar" style={{ borderColor: "var(--line)" }}>
              {quickVoiceChips.map((chip, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(chip.prompt)}
                  className="shrink-0 rounded-full border px-3 py-1 text-xs muted hover:text-white hover:bg-indigo-600 transition"
                  style={{ borderColor: "var(--line)", background: "var(--background)" }}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Active Speech Recording & Live Visualizer Banner */}
            {listening && (
              <div className="bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-rose-500/10 border-t border-emerald-500/20 px-4 py-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className={soundDetected ? "text-emerald-500 font-bold" : "text-indigo-400"}>
                      {soundDetected ? "🎙️ Hearing speech in real time..." : micStatusText || "Recording active..."}
                    </span>
                  </div>

                  {/* Done Speaking: Auto-submits immediately */}
                  <button
                    type="button"
                    onClick={() => stopListening(true)}
                    className="rounded-lg bg-emerald-600 text-white px-3.5 py-1 text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1 shadow-md shadow-emerald-600/30 active:scale-95"
                  >
                    <Check size={13} /> Done Speaking (Submit)
                  </button>
                </div>

                {/* Real-time Web Audio Waveform Canvas */}
                <div className="h-8 w-full rounded-lg bg-black/20 dark:bg-black/40 overflow-hidden flex items-center justify-center px-2">
                  <canvas ref={visualizerCanvasRef} className="h-full w-full" />
                </div>
              </div>
            )}

            {/* Input Bar with Voice Microphone */}
            <div className="border-t p-3 sm:p-4" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                {/* Voice Mic Button */}
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-xl transition ${
                    listening
                      ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-105"
                      : "btn-ghost text-gray-400 hover:text-indigo-500"
                  }`}
                  title={listening ? "Click to finish and submit voice command" : "Click to speak with AI"}
                >
                  {listening ? <MicOff size={20} /> : <Mic size={20} />}
                  {listening && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                    </span>
                  )}
                </button>

                {/* Input Text Box */}
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    listening
                      ? "Listening to your voice... Speak your entry"
                      : "Tell the AI what you did, or tap the mic..."
                  }
                  className="field flex-1 text-sm py-2.5"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!input.trim() || busy}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white disabled:opacity-40 transition hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-600/20"
                >
                  <Send size={18} />
                </button>
              </form>
              {!speechSupported && (
                <p className="mt-1.5 text-center text-[11px] muted">
                  Tip: For voice on mobile browsers, allow Microphone access in your browser settings.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}