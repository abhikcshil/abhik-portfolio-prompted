import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { PortfolioPayload, PortfolioProject } from "../data/portfolio";
import { disableProject, loadAdminPortfolio, saveProject } from "./api";
import { AdminShell } from "./Layout";

type Props = {
  mode?: "new" | "edit";
};

const emptyProject: Partial<PortfolioProject> = {
  slug: "",
  title: "",
  shortDescription: "",
  description: "",
  status: "Draft",
  visibility: "draft",
  enabled: true,
  archived: false,
  featured: false,
  techStack: [],
  highlights: [],
  placements: [],
};

export function AdminProjects({ mode }: Props) {
  const { slug } = useParams();
  const [portfolio, setPortfolio] = useState<PortfolioPayload | null>(null);
  const [selected, setSelected] = useState<Partial<PortfolioProject>>(emptyProject);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadAdminPortfolio()
      .then((data) => {
        setPortfolio(data);
        const matched = slug ? data.projects.find((project) => project.slug === slug || project.id === slug) : null;
        if (matched) setSelected(matched);
      })
      .catch(() => setMessage("Unable to load admin data."));
  }, [slug]);

  const selectedDomainSlugs = useMemo(
    () => new Set((selected.placements ?? []).map((placement) => placement.domainSlug)),
    [selected.placements],
  );

  return (
    <AdminShell>
      <header className="admin-header">
        <div>
          <p>Admin</p>
          <h1>Projects</h1>
        </div>
        <Link className="admin-action" to="/admin/projects/new">
          New
        </Link>
      </header>
      {message && <div className="admin-alert">{message}</div>}
      <div className="editor-layout">
        <div className="admin-list">
          {portfolio?.projects.map((project) => (
            <Link key={project.id} to={`/admin/projects/${project.slug}`}>
              {project.title}
            </Link>
          ))}
        </div>
        <form
          className="admin-form"
          onSubmit={(event) => {
            event.preventDefault();
            saveProject(selected, mode === "new" ? undefined : selected.id)
              .then((data) => {
                setPortfolio(data);
                setMessage("Project saved.");
              })
              .catch(() => setMessage("Project save failed."));
          }}
        >
          <label>
            Title
            <input value={selected.title ?? ""} onChange={(event) => setSelected({ ...selected, title: event.target.value })} />
          </label>
          <label>
            Slug
            <input value={selected.slug ?? ""} onChange={(event) => setSelected({ ...selected, slug: event.target.value })} />
          </label>
          <label>
            Short Description
            <input value={selected.shortDescription ?? ""} onChange={(event) => setSelected({ ...selected, shortDescription: event.target.value })} />
          </label>
          <label>
            Full Description
            <textarea value={selected.description ?? ""} onChange={(event) => setSelected({ ...selected, description: event.target.value })} />
          </label>
          <div className="form-row">
            <label>
              Status
              <input value={selected.status ?? "Draft"} onChange={(event) => setSelected({ ...selected, status: event.target.value })} />
            </label>
            <label>
              Visibility
              <select value={selected.visibility ?? "draft"} onChange={(event) => setSelected({ ...selected, visibility: event.target.value as PortfolioProject["visibility"] })}>
                <option value="public">Public</option>
                <option value="draft">Draft</option>
                <option value="private">Private</option>
              </select>
            </label>
          </div>
          <label>
            Tech Stack
            <input value={(selected.techStack ?? []).join(", ")} onChange={(event) => setSelected({ ...selected, techStack: splitList(event.target.value) })} />
          </label>
          <label>
            Highlights
            <textarea value={(selected.highlights ?? []).join("\n")} onChange={(event) => setSelected({ ...selected, highlights: splitLines(event.target.value) })} />
          </label>
          <fieldset>
            <legend>Domains</legend>
            {portfolio?.domains.map((domain) => (
              <label className="toggle-label" key={domain.slug}>
                <input
                  type="checkbox"
                  checked={selectedDomainSlugs.has(domain.slug)}
                  onChange={(event) => {
                    const placements = selected.placements ?? [];
                    setSelected({
                      ...selected,
                      placements: event.target.checked
                        ? [...placements, { domainSlug: domain.slug, placementOrder: placements.length + 1 }]
                        : placements.filter((placement) => placement.domainSlug !== domain.slug),
                    });
                  }}
                />
                {domain.name}
              </label>
            ))}
          </fieldset>
          <div className="form-row">
            <label className="toggle-label">
              <input type="checkbox" checked={selected.enabled ?? true} onChange={(event) => setSelected({ ...selected, enabled: event.target.checked })} />
              Enabled
            </label>
            <label className="toggle-label">
              <input type="checkbox" checked={selected.featured ?? false} onChange={(event) => setSelected({ ...selected, featured: event.target.checked })} />
              Featured
            </label>
            <label className="toggle-label">
              <input type="checkbox" checked={selected.archived ?? false} onChange={(event) => setSelected({ ...selected, archived: event.target.checked })} />
              Archived
            </label>
          </div>
          <div className="form-actions">
            <button type="submit">Save Project</button>
            {selected.id && (
              <button
                type="button"
                className="secondary"
                onClick={() => disableProject(selected.id as string).then(setPortfolio)}
              >
                Disable
              </button>
            )}
          </div>
        </form>
      </div>
    </AdminShell>
  );
}

function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function splitLines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}
