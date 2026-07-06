"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "snake:theme";

type ThemeContextValue = {
  /** The user's chosen preference: light, dark, or follow the system. */
  theme: Theme;
  /** The actually-applied theme after resolving "system". */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  /** Cycle light -> dark -> system. */
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/* -------------------------------------------------------------------------- */
/* Preference store (localStorage), synced across tabs.                        */
/* -------------------------------------------------------------------------- */

const preferenceListeners = new Set<() => void>();

function notifyPreference() {
  for (const listener of preferenceListeners) listener();
}

function subscribePreference(onChange: () => void): () => void {
  preferenceListeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY) notifyPreference();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    preferenceListeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getPreference(): Theme {
  try {
    return (localStorage.getItem(THEME_STORAGE_KEY) as Theme | null) ?? "system";
  } catch {
    return "system";
  }
}

function getServerPreference(): Theme {
  return "system";
}

/* -------------------------------------------------------------------------- */
/* System color-scheme store (matchMedia).                                     */
/* -------------------------------------------------------------------------- */

const DARK_QUERY = "(prefers-color-scheme: dark)";

function subscribeSystem(onChange: () => void): () => void {
  const mql = window.matchMedia(DARK_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSystemDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches;
}

function getServerSystemDark(): boolean {
  return false;
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

/**
 * Inline script executed in <head> before first paint. It reads the saved
 * preference and applies the `.dark` class so the correct theme is painted
 * immediately, avoiding a flash. Kept in sync with the logic above.
 */
export const themeInitScript = `(function(){try{var k="${THEME_STORAGE_KEY}";var t=localStorage.getItem(k)||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("${DARK_QUERY}").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribePreference,
    getPreference,
    getServerPreference,
  );
  const systemDark = useSyncExternalStore(
    subscribeSystem,
    getSystemDark,
    getServerSystemDark,
  );

  const resolvedTheme: ResolvedTheme =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;

  // Keep the DOM class in sync with the resolved theme (an external system).
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Ignore storage failures (e.g. private mode).
    }
    notifyPreference();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light");
  }, [theme, setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
