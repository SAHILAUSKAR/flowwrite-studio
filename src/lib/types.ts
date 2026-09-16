export const LANGUAGES = ["Hindi", "Hinglish", "English", "Urdu", "Assamese"] as const;
export const MOODS = ["Sad", "Romantic", "Dark", "Hopeful", "Motivational", "Chill"] as const;
export const FLOWS = ["Smooth", "Rap", "Melodic", "Conversational", "Fast", "Slow"] as const;
export const RHYMES = ["Simple", "End rhyme", "Internal rhyme", "No forced rhyme"] as const;
export const DENSITIES = ["Low", "Medium", "High"] as const;
export const BAR_COUNTS = [4, 8, 16, 32] as const;
export const TIME_SIGNATURES = ["4/4", "3/4", "6/8"] as const;

export type Flow = {
  id: string;
  name: string;
  description: string;
  bars: string[];
};

export type Project = {
  id: string;
  name: string;
  beatFileName: string | null;
  idea: string;
  bpm: number;
  timeSignature: string;
  barCount: number;
  language: string;
  mood: string;
  flowStyle: string;
  rhyme: string;
  density: string;
  flows: Flow[];
  activeFlowId: string | null;
  createdAt: string;
  updatedAt: string;
};
