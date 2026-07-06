"use client";

import { useTheme, type Theme } from "./theme-provider";

const ICONS: Record<Theme, string> = {
  light: "☀️",
  dark: "🌙",
  system: "🖥️",
};

const LABELS: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const ORDER: Theme[] = ["light", "dark", "system"];

/**
 * A compact segmented control for switching themes. Renders a placeholder until
 * mounted so SSR markup matches (the actual theme is applied by the inline
 * script before paint).
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1"
    >
      {ORDER.map((option) => {
        const active = option === theme;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${LABELS[option]} theme`}
            title={`${LABELS[option]} theme`}
            onClick={() => setTheme(option)}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-surface-muted"
            }`}
          >
            <span aria-hidden>{ICONS[option]}</span>
          </button>
        );
      })}
    </div>
  );
}
