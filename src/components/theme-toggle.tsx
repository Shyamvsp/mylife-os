"use client";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="btn btn-ghost" aria-label="Toggle theme">
        <Moon size={17} />
        <span className="hidden sm:inline">Theme</span>
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";
  return (
    <button
      className="btn btn-ghost"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
      <span className="hidden sm:inline">Theme</span>
    </button>
  );
}
