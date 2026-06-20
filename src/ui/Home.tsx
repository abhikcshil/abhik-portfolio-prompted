import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { PortfolioDomain, PortfolioPayload, PortfolioProject } from "../data/portfolio";
import { loadPublicPortfolio } from "./api";
import { domainAngle, projectAngle, projectOrder } from "./orbits";

export function Home() {
  const [portfolio, setPortfolio] = useState<PortfolioPayload | null>(null);
  const [focused, setFocused] = useState<PortfolioDomain | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    let active = true;
    loadPublicPortfolio().then((data) => {
      if (active) setPortfolio(data);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => () => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
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
        <section
          className={`system-stage scene-camera ${isReturning ? "is-returning" : ""}`}
          aria-label="Portfolio domains"
        >
          <button className="sun" type="button" aria-label="Abhik C. Shil">
            Abhik
          </button>
          {portfolio.domains.map((domain) => {
            const angle = domainAngle(domain);
            const orbitScale = 0.36 + domain.orbitOrder * 0.16;
            return (
              <button
                key={domain.slug}
                className="planet-orbit"
                type="button"
                onClick={() => {
                  setFocused(domain);
                  setIsReturning(false);
                }}
                style={
                  {
                    "--angle": `${angle}deg`,
                    "--distance": `calc(var(--system-radius) * ${orbitScale})`,
                    "--duration": `${48 + domain.orbitOrder * 9}s`,
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
          isExiting={isExiting}
          onBack={() => {
            if (isExiting) return;
            if (reducedMotion) {
              setFocused(null);
              setIsReturning(true);
              return;
            }
            setIsExiting(true);
            transitionTimer.current = setTimeout(() => {
              setFocused(null);
              setIsExiting(false);
              setIsReturning(true);
            }, 420);
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
  isExiting,
  onBack,
}: {
  domain: PortfolioDomain;
  projects: PortfolioProject[];
  isExiting: boolean;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const [preview, setPreview] = useState<PortfolioProject | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  function activateProject(project: PortfolioProject) {
    if (selectedSlug === project.slug) {
      navigate(`/project/${project.slug}`);
      return;
    }
    setSelectedSlug(project.slug);
    setPreview(project);
  }

  return (
    <section className={`focus-layout scene-camera ${isExiting ? "is-exiting" : ""}`}>
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
          const orbitScale = 0.34 + order * 0.09;
          const isSelected = selectedSlug === project.slug;
          return (
            <button
              key={project.slug}
              type="button"
              className={`moon-orbit ${isSelected ? "is-selected" : ""}`}
              onClick={() => activateProject(project)}
              onMouseEnter={() => setPreview(project)}
              onFocus={() => setPreview(project)}
              style={
                {
                  "--angle": `${angle}deg`,
                  "--distance": `calc(var(--moon-system-radius) * ${orbitScale})`,
                  "--duration": `${70 + order * 8}s`,
                  "--primary": domain.colorPrimary,
                  "--secondary": domain.colorSecondary,
                } as React.CSSProperties
              }
              aria-label={`${project.title}. ${isSelected ? "Selected; activate again to open the full project." : "Activate to preview."}`}
              aria-pressed={isSelected}
            >
              <span className="motion-trail moon-trail" />
              <span className="moon" />
              <span className="moon-label">{project.title}</span>
            </button>
          );
        })}
      </div>
      <ProjectPreview project={preview} domain={domain} selected={preview?.slug === selectedSlug} />
    </section>
  );
}

function ProjectPreview({
  project,
  domain,
  selected,
}: {
  project: PortfolioProject | null;
  domain: PortfolioDomain;
  selected: boolean;
}) {
  const visual = project?.visuals.find((item) => item.visualType === "image");

  return (
    <aside
      className={`preview-panel ${project ? "has-project" : "is-empty"}`}
      aria-live="polite"
      style={{ "--primary": domain.colorPrimary, "--secondary": domain.colorSecondary } as React.CSSProperties}
    >
      {project ? (
        <>
          <div className="preview-visual" aria-hidden={!visual}>
            {visual ? <img src={visual.url} alt={visual.alt} /> : <PreviewPlaceholder title={project.title} />}
          </div>
          <div className="preview-body">
            <div className="preview-pills">
              <span>{project.status}</span>
              <span>{domain.name}</span>
            </div>
            <h2>{project.title}</h2>
            <p className="preview-description">{project.shortDescription}</p>
            <div className="preview-chips" aria-label="Technology stack">
              {project.techStack.slice(0, 4).map((item) => <span key={item}>{item}</span>)}
            </div>
            {project.highlights.length > 0 && (
              <ul className="preview-highlights">
                {project.highlights.slice(0, 2).map((item) => <li key={item}>{item}</li>)}
              </ul>
            )}
            <Link className="preview-cta" to={`/project/${project.slug}`}>View Full Project</Link>
            <small>
              {selected
                ? "Selected. Select this moon again to open the full project."
                : "Select this project moon to keep its preview open."}
            </small>
          </div>
        </>
      ) : (
        <div className="preview-empty-body">
          <p>Hover or focus a project moon for details.</p>
          <h2>{domain.name} projects</h2>
          <span>Select a project moon to preview it. Select again to open.</span>
        </div>
      )}
    </aside>
  );
}

function PreviewPlaceholder({ title }: { title: string }) {
  return (
    <div className="preview-placeholder">
      <span />
      <span />
      <strong>{title}</strong>
    </div>
  );
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}
