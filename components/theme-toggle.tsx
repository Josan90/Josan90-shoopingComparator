"use client";

import { useEffect, useState } from "react";

type ThemePreference = "light" | "dark" | "auto";

const storageKey = "price-radar:theme";

function resolveSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(preference: ThemePreference) {
  const root = document.documentElement;
  const resolved = preference === "auto" ? resolveSystemTheme() : preference;

  root.dataset.theme = resolved;
  root.dataset.themePreference = preference;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemePreference>("auto");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    const initialTheme =
      stored === "light" || stored === "dark" || stored === "auto" ? stored : "auto";

    setTheme(initialTheme);
    applyTheme(initialTheme);
    setMounted(true);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      const nextStored = window.localStorage.getItem(storageKey);
      const nextTheme =
        nextStored === "light" || nextStored === "dark" || nextStored === "auto" ? nextStored : "auto";

      if (nextTheme === "auto") {
        applyTheme("auto");
      }
    };

    mediaQuery.addEventListener("change", onSystemChange);
    return () => mediaQuery.removeEventListener("change", onSystemChange);
  }, []);

  function updateTheme(nextTheme: ThemePreference) {
    setTheme(nextTheme);
    window.localStorage.setItem(storageKey, nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <div
      aria-label="Cambiar tema"
      className="theme-toggle"
      role="group"
      style={!mounted ? { visibility: "hidden" } : undefined}
    >
      <button
        aria-pressed={theme === "light"}
        className={theme === "light" ? "theme-option is-active" : "theme-option"}
        onClick={() => updateTheme("light")}
        type="button"
      >
        Dia
      </button>
      <button
        aria-pressed={theme === "dark"}
        className={theme === "dark" ? "theme-option is-active" : "theme-option"}
        onClick={() => updateTheme("dark")}
        type="button"
      >
        Noche
      </button>
      <button
        aria-pressed={theme === "auto"}
        className={theme === "auto" ? "theme-option is-active" : "theme-option"}
        onClick={() => updateTheme("auto")}
        type="button"
      >
        Auto
      </button>
    </div>
  );
}
