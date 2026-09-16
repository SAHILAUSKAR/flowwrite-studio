import { createFileRoute, Link } from "@tanstack/react-router";
import { AudioLines, ListMusic, PenLine, Timer } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/Chrome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FlowWrite — Write lyrics that fit your beat" },
      {
        name: "description",
        content:
          "Upload your beat, describe your idea, and explore five original lyric flows structured into bars with syllable counts and beat sync.",
      },
      { property: "og:title", content: "FlowWrite — Write lyrics that fit your beat" },
      {
        property: "og:description",
        content:
          "Upload your beat, describe your idea, and explore different original lyric flows, bar by bar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4">
        <section className="py-16 sm:py-24">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <AudioLines className="size-3.5 text-primary" /> Original lyrics, written to your tempo
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
            Write lyrics that fit your beat.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Upload your beat, describe your idea, and explore different flows.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/compose"
              className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Start Writing
            </Link>
            <Link
              to="/projects"
              className="rounded-lg border border-border px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              My Projects
            </Link>
          </div>
        </section>

        <section className="grid gap-4 pb-8 sm:grid-cols-3">
          <Feature
            icon={<AudioLines className="size-4 text-primary" />}
            title="Your beat, in the browser"
            text="MP3, WAV or M4A plays locally. Nothing is uploaded anywhere."
          />
          <Feature
            icon={<PenLine className="size-4 text-primary" />}
            title="Five different flows"
            text="Same idea, genuinely different phrasing, density and rhyme placement."
          />
          <Feature
            icon={<Timer className="size-4 text-primary" />}
            title="Bar sync + metronome"
            text="Bars highlight as the beat plays, with a real Web Audio click track."
          />
        </section>

        <section className="surface flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <ListMusic className="size-5 text-accent" />
            <p className="text-sm text-muted-foreground">
              Projects save to this browser — no account needed.
            </p>
          </div>
          <Link
            to="/compose"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-elevated"
          >
            Open the composer
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="surface p-5">
      <div className="mb-3 flex size-8 items-center justify-center rounded-lg bg-elevated">{icon}</div>
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
