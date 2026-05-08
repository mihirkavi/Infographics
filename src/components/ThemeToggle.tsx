"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "infographics-theme";

function applyTheme(pref: ThemePreference) {
  const root = document.documentElement;
  if (pref === "light") {
    root.setAttribute("data-theme", "light");
  } else if (pref === "dark") {
    root.setAttribute("data-theme", "dark");
  } else {
    root.removeAttribute("data-theme");
  }
}

export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) {
        return;
      }
      setMounted(true);
      const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
      if (stored === "light" || stored === "dark" || stored === "system") {
        setPreference(stored);
        applyTheme(stored);
      } else {
        applyTheme("system");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const cycle = useCallback(() => {
    setPreference((prev) => {
      const next: ThemePreference = prev === "system" ? "light" : prev === "light" ? "dark" : "system";
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
      return next;
    });
  }, []);

  if (!mounted) {
    return <div className="theme-toggle placeholder" aria-hidden />;
  }

  const label =
    preference === "system" ? "Theme: system" : preference === "light" ? "Theme: light" : "Theme: dark";
  const Icon = preference === "system" ? Monitor : preference === "light" ? Sun : Moon;

  return (
    <button type="button" className="theme-toggle" onClick={cycle} aria-label={label} title={label}>
      <Icon size={18} strokeWidth={1.75} />
    </button>
  );
}
