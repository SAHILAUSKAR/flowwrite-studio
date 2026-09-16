import { Link } from "@tanstack/react-router";
import { AudioWaveform } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <AudioWaveform className="size-4" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">FlowWrite</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/compose"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
            activeProps={{ className: "rounded-md px-3 py-1.5 text-foreground bg-elevated" }}
          >
            Lyrics
          </Link>
          <Link
            to="/projects"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
            activeProps={{ className: "rounded-md px-3 py-1.5 text-foreground bg-elevated" }}
          >
            My Projects
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-border py-6">
      <p className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground">
        Users are responsible for ensuring they have the rights to audio they upload. FlowWrite writes
        original lyrics only.
      </p>
    </footer>
  );
}
