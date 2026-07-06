import { SnakeGame } from "@/components/game/snake-game";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 pb-8 pt-3 sm:px-6 sm:pb-12 sm:pt-5">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-xl text-primary-foreground"
          >
            🐍
          </span>
          <div>
            <h1 className="text-xl font-bold leading-tight sm:text-2xl">Snake</h1>
            <p className="text-sm text-muted-foreground">
              A modern classic. Beat your high score.
            </p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <SnakeGame />

      <footer className="mt-auto pt-4 text-center text-xs text-muted-foreground">
        Built with Next.js &amp; Tailwind CSS · Scores saved locally in your
        browser.
      </footer>
    </main>
  );
}
