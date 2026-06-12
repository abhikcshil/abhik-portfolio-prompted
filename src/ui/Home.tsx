import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { PortfolioDomain, PortfolioPayload, PortfolioProject } from "../data/portfolio";
import { loadPublicPortfolio } from "./api";
import { domainAngle, projectAngle, projectOrder } from "./orbits";

export function Home() {
  const [portfolio, setPortfolio] = useState<PortfolioPayload | null>(null);
  const [focused, setFocused] = useState<PortfolioDomain | null>(null);
  const [preview, setPreview] = useState<PortfolioProject | null>(null);

  useEffect(() => {
    let active = true;
    loadPublicPortfolio().then((data) => {
      if (active) setPortfolio(data);
    });
    return () => {
      active = false;
    };
  }, []);

  const projectsByDomain = useMemo(() => {
    const map = new Map<string, PortfolioProject[]>();
    for (const domain of portfolio?.domains ?? []) {
      map.set(
        domain.slug,
        (portfolio?.projects ?? [])
          .filter((project) =>
            project.placements.some((placement) => placement.domainSlug === domain.slug),
          )
          .sort((a, b) => projectOrder(a, domain.slug) - projectOrder(b, domain.slug)),
      );
    }
    return map;
  }, [portfolio]);

  if (!portfolio) {
    return (
      <main className="space-page loading-page">
        <div className="sun">Abhik</div>
      </main>
    );
  }

  return (
    <main className={`space-page ${focused ? "is-focused" : ""}`}>
      <div className="stars" />
      <div className="identity">Abhik C. Shil | Interactive Portfolio.</div>
      <div className="watermark">ABHIK</div>

      {!focused ? (
        <section className="system-stage" aria-label="Portfolio domains">
          <button className="sun" type="button" aria-label="Abhik C. Shil">
            Abhik
          </button>
          {portfolio.domains.map((domain) => {
            const angle = domainAngle(domain);
            const distance = 18 + domain.orbitOrder * 9;
            return (
              <button
                key={domain.slug}
                className="planet-orbit"
                type="button"
                onClick={() => {
                  setFocused(domain);
                  setPreview(projectsByDomain.get(domain.slug)?.[0] ?? null);
                }}
                style={
                  {
                    "--angle": `${angle}deg`,
                    "--distance": `${distance}vmin`,
                    "--duration": `${44 + domain.orbitOrder * 8}s`,
                    "--primary": domain.colorPrimary,
                    "--secondary": domain.colorSecondary,
                  } as React.CSSProperties
                }
                aria-label={`Focus ${domain.name}`}
              >
                <span className="orbit-ring" />
                <span className="motion-trail" />
                <span className="planet" />
                <span className="orbital-label">{domain.label}</span>
              </button>
            );
          })}
        </section>
      ) : (
        <FocusedDomain
          domain={focused}
          projects={projectsByDomain.get(focused.slug) ?? []}
          preview={preview}
          onPreview={setPreview}
          onBack={() => {
            setFocused(null);
            setPreview(null);
          }}
        />
      )}

      <footer className="space-footer">Part of ACS Studios</footer>
    </main>
  );
}

function FocusedDomain({
  domain,
  projects,
  preview,
  onPreview,
  onBack,
}: {
  domain: PortfolioDomain;
  projects: PortfolioProject[];
  preview: PortfolioProject | null;
  onPreview: (project: PortfolioProject) => void;
  onBack: () => void;
}) {
  return (
    <section className="focus-layout">
      <div className="focus-stage" aria-label={`${domain.name} projects`}>
        <button className="back-button" type="button" onClick={onBack}>
          Back
        </button>
        <div
          className="focus-planet"
          style={
            {
              "--primary": domain.colorPrimary,
              "--secondary": domain.colorSecondary,
            } as React.CSSProperties
          }
        >
          <span>{domain.label}</span>
        </div>
        {projects.map((project) => {
          const angle = projectAngle(project, domain.slug);
          const order = projectOrder(project, domain.slug);
          return (
            <Link
              key={project.slug}
              to={`/project/${project.slug}`}
              className="moon-orbit"
              onMouseEnter={() => onPreview(project)}
              onFocus={() => onPreview(project)}
              style={
                {
                  "--angle": `${angle}deg`,
                  "--distance": `${18 + order * 8}vmin`,
                  "--duration": `${34 + order * 7}s`,
                  "--primary": domain.colorPrimary,
                  "--secondary": domain.colorSecondary,
                } as React.CSSProperties
              }
            >
              <span className="moon" />
              <span className="moon-label">
                {project.title}
                <em>Click to view more.</em>
              </span>
            </Link>
          );
        })}
      </div>
      <aside className="preview-panel" aria-live="polite">
        {preview ? (
          <>
            <p>{preview.status}</p>
            <h2>{preview.title}</h2>
            <span>{preview.shortDescription}</span>
            <div className="chip-row">
              {preview.techStack.slice(0, 5).map((item) => (
                <b key={item}>{item}</b>
              ))}
            </div>
          </>
        ) : (
          <>
            <p>{domain.name}</p>
            <h2>{domain.description}</h2>
            <span>Select a moon to preview a project.</span>
          </>
        )}
      </aside>
    </section>
  );
}
