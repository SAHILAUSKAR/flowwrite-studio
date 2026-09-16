// Approximate syllable counting across Latin, Devanagari/Bengali-Assamese and Arabic scripts.
// This is guidance only, never a hard restriction.

function countLatin(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  const groups = w.match(/[aeiouy]+/g);
  let n = groups ? groups.length : 0;
  if (w.length > 2 && w.endsWith("e") && !/[aeiouy]e$/.test(w)) n -= 1;
  return Math.max(1, n);
}

export function countSyllables(line: string): number {
  if (!line || !line.trim()) return 0;

  const indic = line.match(/[\u0900-\u097F\u0980-\u09FF]/g);
  if (indic && indic.length > 2) {
    let count = 0;
    const chars = Array.from(line);
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i]!;
      const code = c.codePointAt(0)!;
      const isDevConsonant =
        (code >= 0x0915 && code <= 0x0939) ||
        (code >= 0x0958 && code <= 0x095f) ||
        (code >= 0x0995 && code <= 0x09b9);
      const isIndependentVowel =
        (code >= 0x0905 && code <= 0x0914) || (code >= 0x0985 && code <= 0x0994);
      const isMatra =
        (code >= 0x093e && code <= 0x094c) || (code >= 0x09be && code <= 0x09cc);
      const next = chars[i + 1];
      const nextCode = next ? next.codePointAt(0)! : 0;
      const nextIsVirama = nextCode === 0x094d || nextCode === 0x09cd;
      const nextIsMatra =
        (nextCode >= 0x093e && nextCode <= 0x094c) ||
        (nextCode >= 0x09be && nextCode <= 0x09cc);
      if (isIndependentVowel) count++;
      else if (isMatra) count++;
      else if (isDevConsonant && !nextIsVirama && !nextIsMatra) count++;
    }
    return count;
  }

  const arabic = line.match(/[\u0600-\u06FF]/g);
  if (arabic && arabic.length > 2) {
    const letters = line.replace(/[^\u0620-\u064A\u0679-\u06D3]/g, "").length;
    return Math.max(1, Math.round(letters / 2.2));
  }

  return line
    .trim()
    .split(/\s+/)
    .reduce((sum, w) => sum + countLatin(w), 0);
}

export type FitLabel = "Too short" | "Good" | "Long";

export function fitLabel(syllables: number, target: number): FitLabel {
  if (syllables < target * 0.6) return "Too short";
  if (syllables > target * 1.4) return "Long";
  return "Good";
}

/** Rough target syllables per bar from BPM, beats per bar and density. */
export function targetSyllables(bpm: number, beatsPerBar: number, density: string): number {
  const per = density === "High" ? 2.4 : density === "Low" ? 1.1 : 1.7;
  const base = beatsPerBar * per;
  const tempoAdjust = bpm > 120 ? 0.85 : bpm < 75 ? 1.15 : 1;
  return Math.max(3, Math.round(base * tempoAdjust));
}
