import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FolderOpen, Pencil, Trash2 } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/Chrome";
import { deleteProject, listProjects, renameProject } from "@/lib/storage";
import type { Project } from "@/lib/types";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "My Projects — FlowWrite" },
      {
        name: "description",
        content: "Open, rename or delete the lyric projects you saved in this browser with FlowWrite.",
      },
      { property: "og:title", content: "My Projects — FlowWrite" },
      {
        property: "og:description",
        content: "Your saved FlowWrite lyric projects, stored locally in this browser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Projects,
});

function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();

  useEffect(() => setProjects(listProjects()), []);

  const refresh = () => setProjects(listProjects());

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold">My Projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Saved in this browser only. Beat files are not stored — re-upload the audio when you reopen a
          project.
        </p>

        {projects.length === 0 ? (
          <div className="surface mt-6 flex flex-col items-center gap-3 p-10 text-center">
            <FolderOpen className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No saved projects yet.</p>
            <Link
              to="/compose"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Start Writing
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {projects.map((p) => (
              <li key={p.id} className="surface flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold">{p.name}</h2>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {p.bpm} BPM · {p.language} · {p.mood} · {p.flows.length} flows ·{" "}
                    {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                  {p.idea && (
                    <p className="mt-1 line-clamp-2 max-w-xl text-xs text-muted-foreground">{p.idea}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate({ to: "/compose", search: { id: p.id } })}
                    className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:bg-elevated"
                  >
                    Open
                  </button>
                  <button
                    title="Rename"
                    onClick={() => {
                      const next = window.prompt("New project name", p.name);
                      if (next && next.trim()) {
                        renameProject(p.id, next.trim());
                        refresh();
                        toast.success("Project renamed.");
                      }
                    }}
                    className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    title="Delete"
                    onClick={() => {
                      if (window.confirm(`Delete "${p.name}"? This cannot be undone.`)) {
                        deleteProject(p.id);
                        refresh();
                        toast.success("Project deleted.");
                      }
                    }}
                    className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
