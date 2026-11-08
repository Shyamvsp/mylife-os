"use client";

import { useEffect, useRef, useState } from "react";
import type { ModuleKey } from "@/lib/modules";

interface ModuleBackgroundProps {
  moduleKey: ModuleKey | "files" | string;
}

export function ModuleBackground({ moduleKey }: ModuleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Particle seed based on module
    let step = 0;
    const count = 38;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.9,
      vy: (Math.random() - 0.5) * 0.9,
      size: Math.random() * 3 + 1.5,
      phase: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      step += 0.02;
      ctx.clearRect(0, 0, width, height);

      switch (moduleKey) {
        case "study": {
          // Cyber Knowledge Lattice (Indigo & Blue)
          ctx.strokeStyle = "rgba(99, 102, 241, 0.08)";
          ctx.lineWidth = 1;
          const gridSize = 48;
          for (let x = 0; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
          }
          for (let y = 0; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
          }

          particles.forEach((p, i) => {
            p.y -= 0.4;
            if (p.y < 0) p.y = height;
            ctx.fillStyle = i % 2 === 0 ? "rgba(99, 102, 241, 0.35)" : "rgba(168, 85, 247, 0.3)";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

            // Connect nearby nodes
            particles.slice(i + 1, i + 5).forEach((p2) => {
              const dx = p.x - p2.x;
              const dy = p.y - p2.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 120) {
                ctx.strokeStyle = `rgba(129, 140, 248, ${0.15 * (1 - dist / 120)})`;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
              }
            });
          });
          break;
        }

        case "fitness": {
          // Kinetic Cardio Pulse (Emerald & Neon Cyan ECG Wave)
          ctx.strokeStyle = "rgba(16, 185, 129, 0.15)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          const waveY = height * 0.75;
          for (let x = 0; x < width; x += 4) {
            const beat = Math.sin((x * 0.015) - step * 2) * Math.sin(x * 0.005);
            const spike = Math.abs(x - ((step * 150) % (width + 200))) < 50 ? Math.sin((x * 0.1)) * 45 : 0;
            const y = waveY + beat * 20 + spike;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          // Pulsing energy ring in corner
          const ringX = width - 100;
          const ringY = 100;
          const pulseR = 40 + Math.sin(step * 3) * 15;
          const grad = ctx.createRadialGradient(ringX, ringY, 5, ringX, ringY, pulseR);
          grad.addColorStop(0, "rgba(52, 211, 153, 0.3)");
          grad.addColorStop(1, "rgba(16, 185, 129, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(ringX, ringY, pulseR, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case "skills": {
          // Neural Hexagonal Constellation (Fuchsia & Purple)
          particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            ctx.fillStyle = "rgba(217, 70, 239, 0.35)";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);
            ctx.fill();

            // Interconnected synaptic web
            particles.slice(i + 1, i + 6).forEach((p2) => {
              const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
              if (dist < 140) {
                ctx.strokeStyle = `rgba(192, 132, 252, ${0.2 * (1 - dist / 140)})`;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
              }
            });
          });
          break;
        }

        case "certifications": {
          // Golden Trophy Laurel Aura (Gold & Amber)
          const cx = width / 2;
          const cy = height * 0.35;
          const radius = 90 + Math.sin(step) * 10;

          const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, radius * 1.5);
          grad.addColorStop(0, "rgba(245, 158, 11, 0.18)");
          grad.addColorStop(1, "rgba(245, 158, 11, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Golden floating stars
          particles.forEach((p) => {
            p.y -= 0.3;
            if (p.y < 0) p.y = height;
            ctx.fillStyle = "rgba(251, 191, 36, 0.4)";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          });
          break;
        }

        case "projects": {
          // Quantum Kanban Matrix & Scanlines (Cyan & Sky)
          ctx.strokeStyle = "rgba(14, 165, 233, 0.07)";
          ctx.lineWidth = 1;
          for (let y = 0; y < height; y += 32) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
          }

          // Cyber holographic scanline
          const scanY = (step * 80) % height;
          const scanGrad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
          scanGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
          scanGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.18)");
          scanGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
          ctx.fillStyle = scanGrad;
          ctx.fillRect(0, scanY - 20, width, 40);
          break;
        }

        case "journal": {
          // Serene Ink Flow & Twilight Aurora (Violet & Rose)
          const grad = ctx.createRadialGradient(
            width * 0.3 + Math.sin(step * 0.5) * 80,
            height * 0.4 + Math.cos(step * 0.5) * 60,
            50,
            width * 0.3,
            height * 0.4,
            width * 0.6
          );
          grad.addColorStop(0, "rgba(168, 85, 247, 0.12)");
          grad.addColorStop(0.5, "rgba(244, 63, 94, 0.08)");
          grad.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);
          break;
        }

        case "expenses": {
          // Wealth Flux Matrix with Floating ₹ Currency (Emerald & Gold)
          ctx.font = "bold 20px monospace";
          ctx.fillStyle = "rgba(16, 185, 129, 0.18)";
          particles.slice(0, 16).forEach((p, idx) => {
            p.y -= 0.5;
            if (p.y < 0) p.y = height;
            ctx.fillText(idx % 2 === 0 ? "₹" : "▲", p.x, p.y);
          });

          // Trend vector line
          ctx.strokeStyle = "rgba(52, 211, 153, 0.15)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (let x = 0; x < width; x += 30) {
            const y = height * 0.8 - Math.sin((x * 0.01) + step) * 35 - (x / width) * 40;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          break;
        }

        case "goals": {
          // Summit Orbit & Concentric Target Radar (Orange & Amber)
          const cx = width * 0.85;
          const cy = height * 0.25;
          for (let r = 40; r <= 160; r += 40) {
            ctx.strokeStyle = "rgba(249, 115, 22, 0.12)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Trajectory apex beam
          ctx.strokeStyle = "rgba(251, 146, 60, 0.2)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, height);
          ctx.quadraticCurveTo(width * 0.5, height * 0.6, cx, cy);
          ctx.stroke();
          break;
        }

        case "habits": {
          // Atomic Habit Routine Rings (Teal & Cyan)
          const cx = width * 0.15;
          const cy = height * 0.45;
          [50, 90, 130].forEach((r, idx) => {
            ctx.strokeStyle = idx === 0 ? "rgba(20, 184, 166, 0.25)" : "rgba(6, 182, 212, 0.15)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            const startAngle = step * (idx % 2 === 0 ? 1 : -1) * 0.8;
            ctx.arc(cx, cy, r, startAngle, startAngle + Math.PI * 1.4);
            ctx.stroke();
          });
          break;
        }

        case "tasks": {
          // Velocity Quantum Streaks (Electric Blue & Indigo)
          particles.forEach((p) => {
            p.x += 1.8;
            if (p.x > width) p.x = 0;
            ctx.strokeStyle = "rgba(59, 130, 246, 0.25)";
            ctx.lineWidth = p.size;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - 25, p.y);
            ctx.stroke();
          });
          break;
        }

        case "calendar": {
          // Chronos Orbital Sphere (Deep Indigo & Violet)
          const cx = width / 2;
          const cy = height * 0.5;
          [80, 150, 220].forEach((r, idx) => {
            ctx.strokeStyle = "rgba(99, 102, 241, 0.12)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();

            // Orbiting planet dot
            const angle = step * (0.5 / (idx + 1));
            const px = cx + Math.cos(angle) * r;
            const py = cy + Math.sin(angle) * r;
            ctx.fillStyle = "rgba(129, 140, 248, 0.4)";
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();
          });
          break;
        }

        case "files": {
          // Cyber Storage Data Vault (Slate & Cyan Data Packets)
          particles.forEach((p, idx) => {
            p.y += 0.4;
            if (p.y > height) p.y = 0;
            ctx.strokeStyle = idx % 2 === 0 ? "rgba(14, 165, 233, 0.25)" : "rgba(148, 163, 184, 0.2)";
            ctx.strokeRect(p.x, p.y, 16, 16);
          });
          break;
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, [moduleKey, enabled]);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <canvas ref={canvasRef} className="h-full w-full opacity-60 dark:opacity-80 transition-opacity" />
      {/* Subtle top right ambient control */}
      <div className="pointer-events-auto absolute top-3 right-3 hidden sm:flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => setEnabled((e) => !e)}
          className="rounded-full bg-black/20 dark:bg-white/10 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-medium text-gray-400 hover:text-white"
        >
          {enabled ? "✨ 4050 GPU FX: ON" : "✨ FX: OFF"}
        </button>
      </div>
    </div>
  );
}