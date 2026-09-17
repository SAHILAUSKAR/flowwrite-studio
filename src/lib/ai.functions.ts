import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.8-flash";

const SAFETY =
  "You are an original songwriting assistant. Write completely original lyrics based only on the user's topic, language, mood, flow, rhyme preference, BPM and bar count. Do not reproduce or paraphrase existing copyrighted lyrics. Do not imitate a specific living artist.";

const SettingsSchema = z.object({
  idea: z.string().min(3),
  language: z.string(),
  mood: z.string(),
  flowStyle: z.string(),
  rhyme: z.string(),
  density: z.string(),
  bpm: z.number().int().min(40).max(220),
  timeSignature: z.string(),
  barCount: z.number().int().min(1).max(64),
});

export type FlowSettings = z.infer<typeof SettingsSchema>;

export const getAiStatus = createServerFn({ method: "GET" }).handler(async () => {
  const hasGemini = Boolean(process.env["GEMINI_API_KEY"]);
  const hasLovable = Boolean(process.env["LOVABLE_API_KEY"]);
  return {
    configured: hasGemini || hasLovable,
    source: hasGemini ? ("gemini" as const) : hasLovable ? ("lovable" as const) : null,
  };
});

type GatewayResult = { ok: true; content: string } | { ok: false; error: string };

// Direct Google Gemini API using the user's own key.
async function callGemini(system: string, user: string): Promise<GatewayResult> {
  const key = process.env["GEMINI_API_KEY"];
  if (!key) return { ok: false, error: "__no_key__" };

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      },
    );
  } catch {
    return { ok: false, error: "Network error while contacting the AI service. Please retry." };
  }

  if (!res.ok) {
    const body = await res.text();
    console.error(`Gemini API error [${res.status}]: ${body}`);
    if (res.status === 400 && body.includes("API_KEY_INVALID"))
      return { ok: false, error: "Your AI key was rejected. Check it in Project Settings → Secrets." };
    if (res.status === 403)
      return { ok: false, error: "Your AI key was rejected. Check it in Project Settings → Secrets." };
    if (res.status === 429)
      return { ok: false, error: "Too many requests right now. Wait a moment and try again." };
    return { ok: false, error: `AI request failed (${res.status}). Please try again.` };
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const content = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!content) return { ok: false, error: "The AI returned an empty response. Please try again." };
  return { ok: true, content };
}

async function callGateway(system: string, user: string): Promise<GatewayResult> {
  // Prefer the user's own Gemini key; fall back to Lovable's built-in AI.
  if (process.env["GEMINI_API_KEY"]) {
    const geminiResult = await callGemini(system, user);
    // On key rejection or rate limit, surface the real error instead of
    // silently falling back — the user needs to know their key failed.
    if (geminiResult.ok || !process.env["LOVABLE_API_KEY"]) return geminiResult;
    if (geminiResult.error.includes("Your AI key was rejected")) return geminiResult;
  }

  const key = process.env["LOVABLE_API_KEY"];
  if (!key) {
    return {
      ok: false,
      error: "AI generation is not configured yet. Add your AI API key to enable generation.",
    };
  }

  let res: Response;
  try {
    res = await fetch(GATEWAY, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
  } catch {
    return { ok: false, error: "Network error while contacting the AI service. Please retry." };
  }

  if (!res.ok) {
    const body = await res.text();
    console.error(`AI gateway error [${res.status}]: ${body}`);
    if (res.status === 429)
      return { ok: false, error: "Too many requests right now. Wait a moment and try again." };
    if (res.status === 402)
      return { ok: false, error: "AI credits are exhausted. Add credits to keep generating." };
    if (res.status === 403)
      return { ok: false, error: "AI access is blocked for this workspace. Check your AI settings." };
    return { ok: false, error: `AI request failed (${res.status}). Please try again.` };
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) return { ok: false, error: "The AI returned an empty response. Please try again." };
  return { ok: true, content };
}

function parseJson<T>(content: string): T | null {
  try {
    return JSON.parse(content) as T;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}

function brief(s: FlowSettings) {
  return [
    `Topic / idea: ${s.idea}`,
    `Language: ${s.language} (write the lyrics in this language; Hinglish means Hindi written in Roman script mixed with English)`,
    `Mood: ${s.mood}`,
    `Requested base flow: ${s.flowStyle}`,
    `Rhyme preference: ${s.rhyme}`,
    `Lyric density: ${s.density}`,
    `Tempo: ${s.bpm} BPM, time signature ${s.timeSignature}`,
    `Bars required: exactly ${s.barCount} bars per version, one line of lyrics per bar`,
  ].join("\n");
}

export const generateFlows = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SettingsSchema.parse(input))
  .handler(async ({ data }) => {
    const user = `${brief(data)}

Write 5 substantially DIFFERENT original versions ("flows") of the same song idea.
Each version must differ in line length, syllable density, rhyme placement, pauses, rhythmic phrasing and vocabulary — not just a few swapped words.
Suggested angles: smooth, rap, melodic, conversational, syncopated.

Return strict JSON only, in this shape:
{"flows":[{"name":"Flow 1 — Smooth","description":"short style description (max 8 words)","bars":["bar 1 line","bar 2 line", "... exactly ${data.barCount} strings"]}]}`;

    const result = await callGateway(SAFETY, user);
    if (!result.ok) return { ok: false as const, error: result.error };

    const parsed = parseJson<{ flows?: Array<{ name?: string; description?: string; bars?: string[] }> }>(
      result.content,
    );
    const flows = (parsed?.flows ?? [])
      .filter((f) => Array.isArray(f.bars) && f.bars.length > 0)
      .map((f, i) => ({
        name: f.name?.trim() || `Flow ${i + 1}`,
        description: f.description?.trim() || "Original flow",
        bars: (f.bars ?? []).map((b) => String(b).trim()).slice(0, data.barCount),
      }));

    if (flows.length === 0)
      return { ok: false as const, error: "The AI returned no usable lyrics. Please try again." };

    return { ok: true as const, flows };
  });

export const regenerateBar = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    SettingsSchema.extend({
      flowName: z.string(),
      flowDescription: z.string(),
      barIndex: z.number().int().min(0),
      currentBar: z.string(),
      previousBar: z.string().optional(),
      nextBar: z.string().optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const user = `${brief(data)}

You are rewriting ONE single bar inside an existing original song.
Flow style: ${data.flowName} — ${data.flowDescription}
Bar number: ${data.barIndex + 1}
Previous bar: ${data.previousBar || "(none)"}
Current bar: ${data.currentBar || "(empty)"}
Next bar: ${data.nextBar || "(none)"}

Give 3 original alternatives for this one bar only. Keep the same language, mood and rhythmic feel so it still fits between the surrounding bars.

Return strict JSON only: {"alternatives":["option 1","option 2","option 3"]}`;

    const result = await callGateway(SAFETY, user);
    if (!result.ok) return { ok: false as const, error: result.error };

    const parsed = parseJson<{ alternatives?: string[] }>(result.content);
    const alternatives = (parsed?.alternatives ?? [])
      .map((a) => String(a).trim())
      .filter(Boolean)
      .slice(0, 3);

    if (alternatives.length === 0)
      return { ok: false as const, error: "The AI returned no alternatives. Please try again." };

    return { ok: true as const, alternatives };
  });

export const regenerateFlow = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    SettingsSchema.extend({ flowName: z.string(), flowDescription: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    const user = `${brief(data)}

Rewrite one single version of this song from scratch, keeping the style direction "${data.flowName} — ${data.flowDescription}" but with fresh original wording, different imagery and different phrasing than a typical first draft.

Return strict JSON only:
{"name":"flow name","description":"short style description","bars":["exactly ${data.barCount} lines"]}`;

    const result = await callGateway(SAFETY, user);
    if (!result.ok) return { ok: false as const, error: result.error };

    const parsed = parseJson<{ name?: string; description?: string; bars?: string[] }>(result.content);
    const bars = (parsed?.bars ?? []).map((b) => String(b).trim()).slice(0, data.barCount);
    if (bars.length === 0)
      return { ok: false as const, error: "The AI returned no usable lyrics. Please try again." };

    return {
      ok: true as const,
      flow: {
        name: parsed?.name?.trim() || data.flowName,
        description: parsed?.description?.trim() || data.flowDescription,
        bars,
      },
    };
  });
