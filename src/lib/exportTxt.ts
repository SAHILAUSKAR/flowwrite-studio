import type { Flow, Project } from "./types";

export function flowToText(project: Project, flow: Flow): string {
  const lines: string[] = [];
  lines.push(project.name || "Untitled project");
  lines.push("");
  lines.push(`BPM: ${project.bpm}`);
  lines.push(`Language: ${project.language}`);
  lines.push(`Mood: ${project.mood}`);
  lines.push("");
  lines.push(flow.name.toUpperCase());
  lines.push("");
  flow.bars.forEach((bar, i) => {
    lines.push(`BAR ${i + 1}:`);
    lines.push(bar);
    lines.push("");
  });
  return lines.join("\n");
}

export function downloadTxt(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "flowwrite"
  );
}
