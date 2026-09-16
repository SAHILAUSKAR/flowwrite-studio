import { useCallback, useEffect, useRef, useState } from "react";

const ACCEPTED = [".mp3", ".wav", ".m4a"];

export type BeatEngine = ReturnType<typeof useBeatEngine>;

export function useBeatEngine(bpm: number, beatsPerBar: number) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [metronomeVolume, setMetronomeVolume] = useState(0.5);
  const [error, setError] = useState<string | null>(null);

  const secondsPerBeat = 60 / Math.max(1, bpm);
  const secondsPerBar = secondsPerBeat * Math.max(1, beatsPerBar);
  const currentBar = Math.floor(currentTime / secondsPerBar);

  // progress ticker
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const a = audioRef.current;
      if (a) setCurrentTime(a.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // metronome (Web Audio API), locked to playback position
  const ctxRef = useRef<AudioContext | null>(null);
  const nextBeatRef = useRef(0);
  const volRef = useRef(metronomeVolume);
  volRef.current = metronomeVolume;

  useEffect(() => {
    if (!metronomeOn || !isPlaying) return;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    if (!ctxRef.current) ctxRef.current = new Ctor();
    const ctx = ctxRef.current;
    void ctx.resume();

    const a = audioRef.current;
    nextBeatRef.current = a ? Math.ceil(a.currentTime / secondsPerBeat) * secondsPerBeat : 0;

    const click = (at: number, accent: boolean) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = accent ? 1600 : 1000;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volRef.current), at + 0.001);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.08);
    };

    const id = window.setInterval(() => {
      const el = audioRef.current;
      if (!el) return;
      const pos = el.currentTime;
      if (nextBeatRef.current < pos - 0.3 || nextBeatRef.current > pos + 2) {
        nextBeatRef.current = Math.ceil(pos / secondsPerBeat) * secondsPerBeat;
      }
      while (nextBeatRef.current < pos + 0.15) {
        const beatIndex = Math.round(nextBeatRef.current / secondsPerBeat);
        const when = ctx.currentTime + (nextBeatRef.current - pos);
        click(Math.max(ctx.currentTime, when), beatIndex % Math.max(1, beatsPerBar) === 0);
        nextBeatRef.current += secondsPerBeat;
      }
    }, 25);

    return () => window.clearInterval(id);
  }, [metronomeOn, isPlaying, secondsPerBeat, beatsPerBar]);

  const loadFile = useCallback(
    (file: File) => {
      const name = file.name.toLowerCase();
      const okExt = ACCEPTED.some((e) => name.endsWith(e));
      const okType = file.type.startsWith("audio/");
      if (!okExt && !okType) {
        setError("Unsupported file. Please upload an MP3, WAV or M4A file.");
        return false;
      }
      setError(null);
      setUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      setFileName(file.name);
      setCurrentTime(0);
      setDuration(0);
      return true;
    },
    [],
  );

  const removeBeat = useCallback(() => {
    const a = audioRef.current;
    if (a) a.pause();
    setIsPlaying(false);
    setUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setFileName(null);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const play = useCallback(() => {
    const a = audioRef.current;
    if (!a || !a.src) return;
    void a.play().catch(() => setError("Could not play this audio file."));
  }, []);

  const pause = useCallback(() => audioRef.current?.pause(), []);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a || !a.src) return;
    if (a.paused) play();
    else a.pause();
  }, [play]);

  const seek = useCallback((t: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, t);
    setCurrentTime(a.currentTime);
  }, []);

  const restart = useCallback(() => {
    seek(0);
    play();
  }, [seek, play]);

  const playFromBar = useCallback(
    (barIndex: number) => {
      seek(barIndex * secondsPerBar);
      play();
    },
    [seek, play, secondsPerBar],
  );

  const bind = {
    ref: audioRef,
    src: url ?? undefined,
    onPlay: () => setIsPlaying(true),
    onPause: () => setIsPlaying(false),
    onEnded: () => setIsPlaying(false),
    onLoadedMetadata: (e: React.SyntheticEvent<HTMLAudioElement>) =>
      setDuration(e.currentTarget.duration || 0),
    onError: () => {
      if (url) setError("This audio file could not be decoded by your browser.");
    },
  };

  return {
    audioRef,
    bind,
    fileName,
    hasBeat: Boolean(url),
    isPlaying,
    currentTime,
    duration,
    currentBar,
    secondsPerBar,
    secondsPerBeat,
    error,
    setError,
    metronomeOn,
    setMetronomeOn,
    metronomeVolume,
    setMetronomeVolume,
    loadFile,
    removeBeat,
    play,
    pause,
    toggle,
    seek,
    restart,
    playFromBar,
    setFileName,
  };
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
