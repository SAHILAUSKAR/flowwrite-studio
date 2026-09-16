import { useRef } from "react";
import {
  Music4,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  Upload,
  Volume2,
} from "lucide-react";
import type { BeatEngine } from "@/lib/useBeatEngine";
import { formatTime } from "@/lib/useBeatEngine";

type Props = {
  engine: BeatEngine;
  barCount: number;
  onSelectBar: (index: number) => void;
};

export function BeatDeck({ engine, barCount, onSelectBar }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const bars = Array.from({ length: barCount }, (_, i) => i);

  return (
    <div className="surface p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Music4 className="size-4 text-primary" /> Beat
        </h2>
        {engine.hasBeat && (
          <button
            onClick={engine.removeBeat}
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
          >
            <Trash2 className="size-3.5" /> Remove beat
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,.mp3,.wav,.m4a"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) engine.loadFile(file);
          e.target.value = "";
        }}
      />

      {!engine.hasBeat ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-elevated/40 px-4 py-10 text-center transition-colors hover:border-primary"
        >
          <Upload className="size-6 text-primary" />
          <span className="text-sm font-medium">Upload your beat</span>
          <span className="text-xs text-muted-foreground">MP3, WAV or M4A — stays on your device</span>
        </button>
      ) : (
        <div className="space-y-4">
          <p className="truncate text-sm text-muted-foreground">{engine.fileName}</p>

          <div className="flex items-center gap-3">
            <button
              onClick={engine.toggle}
              aria-label={engine.isPlaying ? "Pause" : "Play"}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
            >
              {engine.isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
            </button>
            <button
              onClick={engine.restart}
              aria-label="Restart"
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="size-4" />
            </button>
            <div className="min-w-0 flex-1">
              <input
                type="range"
                min={0}
                max={engine.duration || 0}
                step={0.01}
                value={Math.min(engine.currentTime, engine.duration || 0)}
                onChange={(e) => engine.seek(Number(e.target.value))}
                className="w-full accent-[var(--color-primary)]"
                aria-label="Seek"
              />
              <div className="mt-1 flex justify-between text-xs tabular-nums text-muted-foreground">
                <span>{formatTime(engine.currentTime)}</span>
                <span>{formatTime(engine.duration)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {engine.error && (
        <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {engine.error}
        </p>
      )}

      {/* Bar timeline */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Bar timeline</span>
          <span className="tabular-nums">
            Bar {Math.min(engine.currentBar + 1, barCount)} / {barCount}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {bars.map((i) => {
            const active = engine.currentBar === i;
            return (
              <button
                key={i}
                onClick={() => onSelectBar(i)}
                title={`Play from bar ${i + 1}`}
                className={`h-8 min-w-8 flex-1 rounded-md border text-[11px] tabular-nums transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-elevated text-muted-foreground hover:text-foreground"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Metronome */}
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <button
          onClick={() => engine.setMetronomeOn(!engine.metronomeOn)}
          className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
            engine.metronomeOn
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          Metronome {engine.metronomeOn ? "ON" : "OFF"}
        </button>
        <div className="flex min-w-36 flex-1 items-center gap-2">
          <Volume2 className="size-4 text-muted-foreground" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={engine.metronomeVolume}
            onChange={(e) => engine.setMetronomeVolume(Number(e.target.value))}
            className="w-full accent-[var(--color-accent)]"
            aria-label="Metronome volume"
          />
        </div>
        <span className="text-xs text-muted-foreground">Clicks while the beat plays</span>
      </div>
    </div>
  );
}
