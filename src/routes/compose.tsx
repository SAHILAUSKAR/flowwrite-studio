import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save, Sparkles } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/Chrome";
import { BeatDeck } from "@/components/BeatDeck";
import { FlowCard } from "@/components/FlowCard";
import { useBeatEngine } from "@/lib/useBeatEngine";
import { targetSyllables } from "@/lib/syllables";
import { copyToClipboard, downloadTxt, flowToText, slugify } from "@/lib/exportTxt";
import { getProject, newId, saveProject } from "@/lib/storage";
import {
  BAR_COUNTS,
  DENSITIES,
  FLOWS,
  LANGUAGES,
  MOODS,
  RHYMES,
  TIME_SIGNATURES,
  type Flow,
  type Project,
} from "@/lib/types";
import { generateFlows, getAiStatus, regenerateBar, regenerateFlow } from "@/lib/ai.functions";

export const Route = createFileRoute("/compose")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search["id"] === "string" ? search["id"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Composer — FlowWrite" },
      {
        name: "description",
        content:
          "Upload a beat, set BPM and bars, describe your idea and generate five original lyric flows with bar-by-bar editing.",
      },
      { property: "og:title", content: "Composer — FlowWrite" },
      {
        property: "og:description",
        content: "Write original lyrics bar by bar, synced to your own beat.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Compose,
});

const GENERATION_TIMEOUT_MS = 90_000;

function Compose() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();

  const [projectId, setProjectId] = useState(() => newId());
  const [name, setName] = useState("Untitled project");
  const [idea, setIdea] = useState("");
  const [bpm, setBpm] = useState(90);
  const [bpmText, setBpmText] = useState("90");
  const [timeSignature, setTimeSignature] = useState<string>("4/4");
  const [barCount, setBarCount] = useState<number>(8);
  const [language, setLanguage] = useState<string>("Hinglish");
  const [mood, setMood] = useState<string>("Sad");
  const [flowStyle, setFlowStyle] = useState<string>("Smooth");
  const [rhyme, setRhyme] = useState<string>("End rhyme");
  const [density, setDensity] = useState<string>("Medium");
  const [flows, setFlows] = useState<Flow[]>([]);
  const [activeFlowId, setActiveFlowId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [cancelToken, setCancelToken] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [missingBeatNote, setMissingBeatNote] = useState<string | null>(null);

  const beatsPerBar = Number(timeSignature.split("/")[0]) || 4;
  const engine = useBeatEngine(bpm, beatsPerBar);

  const { data: aiStatus } = useQuery({
    queryKey: ["ai-status"],
    queryFn: () => getAiStatus(),
    staleTime: 5 * 60 * 1000,
  });
  const aiConfigured = aiStatus?.configured ?? false;

  // Load an existing project
  useEffect(() => {
    if (!id) return;
    const p = getProject(id);
    if (!p) {
      toast.error("That project could not be found.");
      return;
    }
    setProjectId(p.id);
    setName(p.name);
    setIdea(p.idea);
    setBpm(p.bpm);
    setBpmText(String(p.bpm));
    setTimeSignature(p.timeSignature);
    setBarCount(p.barCount);
    setLanguage(p.language);
    setMood(p.mood);
    setFlowStyle(p.flowStyle);
    setRhyme(p.rhyme);
    setDensity(p.density);
    setFlows(p.flows);
    setActiveFlowId(p.activeFlowId ?? p.flows[0]?.id ?? null);
    setMissingBeatNote(
      p.beatFileName ? `This project used "${p.beatFileName}". Re-upload it to play along.` : null,
    );
  }, [id]);

  const target = useMemo(
    () => targetSyllables(bpm, beatsPerBar, density),
    [bpm, beatsPerBar, density],
  );

  const settings = {
    idea: idea.trim(),
    language,
    mood,
    flowStyle,
    rhyme,
    density,
    bpm,
    timeSignature,
    barCount,
  };

  const validate = (): string | null => {
    if (settings.idea.length < 3) return "Tell us what the song is about first.";
    if (!Number.isFinite(bpm) || bpm < 40 || bpm > 220) return "BPM must be between 40 and 220.";
    return null;
  };

  async function withTimeout<T>(promise: Promise<T>): Promise<T | "timeout"> {
    return Promise.race([
      promise,
      new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), GENERATION_TIMEOUT_MS)),
    ]);
  }

  const handleGenerate = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    if (!aiConfigured) return;
    setError(null);
    setGenerating(true);
    const token = cancelToken;

    const result = await withTimeout(generateFlows({ data: settings }));
    if (token !== cancelToken) return;
    setGenerating(false);

    if (result === "timeout") {
      setError("Generation took too long and was stopped. Please try again.");
      return;
    }
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const withIds: Flow[] = result.flows.map((f) => ({ ...f, id: newId() }));
    setFlows(withIds);
    setActiveFlowId(withIds[0]?.id ?? null);
    toast.success(`${withIds.length} flows written.`);
  };

  const cancelGeneration = () => {
    setCancelToken((t) => t + 1);
    setGenerating(false);
    setError("Generation cancelled.");
  };

  const updateFlow = (flow: Flow) =>
    setFlows((prev) => prev.map((f) => (f.id === flow.id ? flow : f)));

  const handleRegenerateFlow = async (flow: Flow) => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    const result = await withTimeout(
      regenerateFlow({
        data: { ...settings, flowName: flow.name, flowDescription: flow.description },
      }),
    );
    if (result === "timeout") {
      toast.error("That took too long. Please try again.");
      return;
    }
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    updateFlow({ ...flow, ...result.flow });
    toast.success("Flow rewritten.");
  };

  const handleBarAlternatives = async (flow: Flow, barIndex: number) => {
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return null;
    }
    const result = await withTimeout(
      regenerateBar({
        data: {
          ...settings,
          flowName: flow.name,
          flowDescription: flow.description,
          barIndex,
          currentBar: flow.bars[barIndex] ?? "",
          previousBar: flow.bars[barIndex - 1] ?? "",
          nextBar: flow.bars[barIndex + 1] ?? "",
        },
      }),
    );
    if (result === "timeout") {
      toast.error("That took too long. Please try again.");
      return null;
    }
    if (!result.ok) {
      toast.error(result.error);
      return null;
    }
    return result.alternatives;
  };

  const buildProject = (): Project => ({
    id: projectId,
    name: name.trim() || "Untitled project",
    beatFileName: engine.fileName,
    idea,
    bpm,
    timeSignature,
    barCount,
    language,
    mood,
    flowStyle,
    rhyme,
    density,
    flows,
    activeFlowId,
    createdAt: getProject(projectId)?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const handleSave = () => {
    const project = buildProject();
    saveProject(project);
    toast.success("Project saved to this browser.");
    if (!id) void navigate({ to: "/compose", search: { id: project.id }, replace: true });
  };

  const activeFlow = flows.find((f) => f.id === activeFlowId) ?? null;

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Project name"
            className="w-full max-w-sm bg-transparent text-2xl font-semibold outline-none"
          />
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-elevated"
          >
            <Save className="size-4" /> Save Project
          </button>
        </div>

        {!aiConfigured && (
          <p className="mb-5 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
            AI generation is not configured yet. Add your AI API key to enable generation. Everything
            else — beat playback, timeline, metronome, editing, saving and export — still works.
          </p>
        )}
        {missingBeatNote && (
          <p className="mb-5 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            {missingBeatNote}
          </p>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="space-y-5">
            <BeatDeck engine={engine} barCount={barCount} onSelectBar={engine.playFromBar} />

            <div className="surface p-4 sm:p-5">
              <h2 className="mb-4 text-base font-semibold">Beat settings</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Labeled label="BPM">
                  <input
                    type="number"
                    min={40}
                    max={220}
                    value={bpmText}
                    onChange={(e) => {
                      setBpmText(e.target.value);
                      const n = Number(e.target.value);
                      if (Number.isFinite(n) && n >= 40 && n <= 220) setBpm(Math.round(n));
                    }}
                    className="field focus:border-primary"
                  />
                </Labeled>
                <Labeled label="Time signature">
                  <Select value={timeSignature} onChange={setTimeSignature} options={[...TIME_SIGNATURES]} />
                </Labeled>
                <Labeled label="Bars">
                  <Select
                    value={String(barCount)}
                    onChange={(v) => setBarCount(Number(v))}
                    options={BAR_COUNTS.map(String)}
                  />
                </Labeled>
              </div>
              {(!Number.isFinite(Number(bpmText)) || Number(bpmText) < 40 || Number(bpmText) > 220) && (
                <p className="mt-2 text-xs text-destructive">BPM must be between 40 and 220.</p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                1 bar = {beatsPerBar} beats = {engine.secondsPerBar.toFixed(2)}s at {bpm} BPM. Target
                ≈ {target} syllables per bar.
              </p>
            </div>

            <div className="surface p-4 sm:p-5">
              <h2 className="mb-4 text-base font-semibold">Lyric idea</h2>
              <label className="mb-1.5 block text-xs text-muted-foreground">
                What&apos;s the song about?
              </label>
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                rows={4}
                placeholder="Missing someone after a breakup but trying to move forward."
                className="field resize-y focus:border-primary"
              />
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Labeled label="Language">
                  <Select value={language} onChange={setLanguage} options={[...LANGUAGES]} />
                </Labeled>
                <Labeled label="Mood">
                  <Select value={mood} onChange={setMood} options={[...MOODS]} />
                </Labeled>
                <Labeled label="Flow">
                  <Select value={flowStyle} onChange={setFlowStyle} options={[...FLOWS]} />
                </Labeled>
                <Labeled label="Rhyme">
                  <Select value={rhyme} onChange={setRhyme} options={[...RHYMES]} />
                </Labeled>
                <Labeled label="Lyric density">
                  <Select value={density} onChange={setDensity} options={[...DENSITIES]} />
                </Labeled>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={generating || !aiConfigured}
                  title={aiConfigured ? "Generate 5 flows" : "AI generation is not configured yet"}
                  className="flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {generating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  {generating ? "Writing your flows…" : "Generate 5 Flows"}
                </button>
                {generating && (
                  <button
                    onClick={cancelGeneration}
                    className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Cancel
                  </button>
                )}
              </div>
              {error && (
                <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-5">
            {flows.length === 0 ? (
              <div className="surface flex min-h-56 flex-col items-center justify-center p-8 text-center">
                <Sparkles className="mb-3 size-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Your five flows will appear here, split into bars with syllable counts.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={async () => {
                      if (!activeFlow) return;
                      const ok = await copyToClipboard(flowToText(buildProject(), activeFlow));
                      ok
                        ? toast.success("Lyrics copied.")
                        : toast.error("Your browser blocked clipboard access.");
                    }}
                    disabled={!activeFlow}
                    className="rounded-lg border border-border px-3 py-2 text-xs transition-colors hover:bg-elevated disabled:opacity-40"
                  >
                    Copy Lyrics
                  </button>
                  <button
                    onClick={() => {
                      if (!activeFlow) return;
                      const project = buildProject();
                      downloadTxt(
                        `${slugify(project.name)}-${slugify(activeFlow.name)}.txt`,
                        flowToText(project, activeFlow),
                      );
                    }}
                    disabled={!activeFlow}
                    className="rounded-lg border border-border px-3 py-2 text-xs transition-colors hover:bg-elevated disabled:opacity-40"
                  >
                    Download TXT
                  </button>
                  <span className="text-xs text-muted-foreground">
                    Exports the selected flow — tap a card to select it.
                  </span>
                </div>

                {flows.map((flow, i) => (
                  <FlowCard
                    key={flow.id}
                    flow={flow}
                    index={i}
                    active={flow.id === activeFlowId}
                    targetSyllables={target}
                    currentBar={engine.currentBar}
                    hasBeat={engine.hasBeat}
                    aiConfigured={aiConfigured}
                    onSelect={() => setActiveFlowId(flow.id)}
                    onChange={updateFlow}
                    onPlayFromBar={engine.playFromBar}
                    onCopy={async () => {
                      const ok = await copyToClipboard(flowToText(buildProject(), flow));
                      ok
                        ? toast.success("Lyrics copied.")
                        : toast.error("Your browser blocked clipboard access.");
                    }}
                    onDownload={() => {
                      const project = buildProject();
                      downloadTxt(
                        `${slugify(project.name)}-${slugify(flow.name)}.txt`,
                        flowToText(project, flow),
                      );
                    }}
                    onRegenerateFlow={() => handleRegenerateFlow(flow)}
                    onBarAlternatives={(barIndex) => handleBarAlternatives(flow, barIndex)}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Hidden audio element powering playback */}
      <audio {...engine.bind} preload="metadata" />

      <SiteFooter />
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="field focus:border-primary"
    >
      {options.map((o) => (
        <option key={o} value={o} className="bg-card">
          {o}
        </option>
      ))}
    </select>
  );
}
