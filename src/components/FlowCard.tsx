import { useEffect, useRef, useState } from "react";
import { Check, Copy, Download, Pencil, Play, RefreshCw, Sparkles } from "lucide-react";
import type { Flow } from "@/lib/types";
import { countSyllables, fitLabel } from "@/lib/syllables";

type Props = {
  flow: Flow;
  index: number;
  active: boolean;
  targetSyllables: number;
  currentBar: number;
  hasBeat: boolean;
  aiConfigured: boolean;
  onSelect: () => void;
  onChange: (flow: Flow) => void;
  onPlayFromBar: (barIndex: number) => void;
  onCopy: () => void;
  onDownload: () => void;
  onRegenerateFlow: () => Promise<void>;
  onBarAlternatives: (barIndex: number) => Promise<string[] | null>;
};

export function FlowCard({
  flow,
  index,
  active,
  targetSyllables,
  currentBar,
  hasBeat,
  aiConfigured,
  onSelect,
  onChange,
  onPlayFromBar,
  onCopy,
  onDownload,
  onRegenerateFlow,
  onBarAlternatives,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [altBar, setAltBar] = useState<number | null>(null);
  const [alts, setAlts] = useState<string[]>([]);
  const [altLoading, setAltLoading] = useState<number | null>(null);
  const activeBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (active && activeBarRef.current) {
      activeBarRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [currentBar, active]);

  const setBar = (i: number, text: string) => {
    const bars = [...flow.bars];
    bars[i] = text;
    onChange({ ...flow, bars });
  };

  const loadAlternatives = async (i: number) => {
    setAltLoading(i);
    setAltBar(i);
    setAlts([]);
    const result = await onBarAlternatives(i);
    setAltLoading(null);
    if (result) setAlts(result);
    else setAltBar(null);
  };

  return (
    <div
      onClick={onSelect}
      className={`surface overflow-hidden transition-colors ${active ? "border-primary" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-elevated px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              FLOW {index + 1}
            </span>
            {active && (
              <span className="rounded-md bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                Synced
              </span>
            )}
          </div>
          <h3 className="mt-2 truncate text-base font-semibold">{flow.name}</h3>
          <p className="text-xs text-muted-foreground">{flow.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <IconBtn label="Copy lyrics" onClick={onCopy} icon={<Copy className="size-4" />} />
          <IconBtn label="Download TXT" onClick={onDownload} icon={<Download className="size-4" />} />
          <IconBtn
            label={editing ? "Done editing" : "Edit bars"}
            onClick={() => setEditing((v) => !v)}
            icon={editing ? <Check className="size-4" /> : <Pencil className="size-4" />}
            active={editing}
          />
          <IconBtn
            label={hasBeat ? "Play from start" : "Upload a beat to play"}
            disabled={!hasBeat}
            onClick={() => {
              onSelect();
              onPlayFromBar(0);
            }}
            icon={<Play className="size-4" />}
          />
          <IconBtn
            label={aiConfigured ? "Regenerate this flow" : "AI not configured"}
            disabled={!aiConfigured || regenerating}
            onClick={async () => {
              setRegenerating(true);
              await onRegenerateFlow();
              setRegenerating(false);
            }}
            icon={<RefreshCw className={`size-4 ${regenerating ? "animate-spin" : ""}`} />}
          />
        </div>
      </div>

      <div className="max-h-[28rem] divide-y divide-border overflow-y-auto">
        {flow.bars.map((bar, i) => {
          const syllables = countSyllables(bar);
          const label = fitLabel(syllables, targetSyllables);
          const isCurrent = active && currentBar === i;
          return (
            <div
              key={i}
              ref={isCurrent ? activeBarRef : null}
              className={`px-4 py-3 transition-colors ${isCurrent ? "bg-primary/10" : ""}`}
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span
                  className={`text-[11px] font-medium tracking-wide ${
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  BAR {i + 1}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {syllables} syllables
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] ${
                      label === "Good"
                        ? "bg-success/15 text-success"
                        : label === "Long"
                          ? "bg-warning/15 text-warning"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                  <button
                    title={hasBeat ? "Play from here" : "Upload a beat to play"}
                    disabled={!hasBeat}
                    onClick={() => {
                      onSelect();
                      onPlayFromBar(i);
                    }}
                    className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                  >
                    <Play className="size-3.5" />
                  </button>
                  <button
                    title={aiConfigured ? "Regenerate this bar" : "AI not configured"}
                    disabled={!aiConfigured || altLoading !== null}
                    onClick={() => loadAlternatives(i)}
                    className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                  >
                    <Sparkles className={`size-3.5 ${altLoading === i ? "animate-pulse" : ""}`} />
                  </button>
                </div>
              </div>

              {editing ? (
                <textarea
                  value={bar}
                  rows={2}
                  onChange={(e) => setBar(i, e.target.value)}
                  className="field resize-y focus:border-primary"
                />
              ) : (
                <p className="text-sm leading-relaxed">{bar || <span className="text-muted-foreground">(empty bar)</span>}</p>
              )}

              {altBar === i && (
                <div className="mt-2 space-y-1.5 rounded-lg border border-border bg-elevated p-2">
                  {altLoading === i ? (
                    <p className="px-1 py-2 text-xs text-muted-foreground">Writing alternatives…</p>
                  ) : (
                    <>
                      {alts.map((alt, k) => (
                        <button
                          key={k}
                          onClick={() => {
                            setBar(i, alt);
                            setAltBar(null);
                          }}
                          className="block w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-card"
                        >
                          <span className="mr-2 text-[11px] text-muted-foreground">
                            Alternative {k + 1}
                          </span>
                          {alt}
                        </button>
                      ))}
                      <button
                        onClick={() => setAltBar(null)}
                        className="px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        Keep current bar
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IconBtn({
  icon,
  label,
  onClick,
  disabled,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`rounded-md border p-2 transition-colors disabled:opacity-40 ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:bg-elevated hover:text-foreground"
      }`}
    >
      {icon}
    </button>
  );
}
