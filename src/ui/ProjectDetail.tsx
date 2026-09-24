import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { CaseStudyItem, PortfolioProject, ProjectVisual } from "../data/portfolio";
import { loadPublicProject } from "./api";

const articleHeadings = {
  challenge: "Technical challenges",
  metric: "Impact & results",
  "future-plan": "Future plans",
} as const;

function embedUrl(url: string, provider?: string) {
  if (provider === "youtube" || /(?:youtube\.com|youtu\.be)/.test(url)) {
    const id = url.match(/(?:v=|youtu\.be\/|embed\/)([^?&/]+)/)?.[1];
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : url;
  }
  return url;
}

function MediaCarousel({ visuals }: { visuals: ProjectVisual[] }) {
  const items = visuals.slice().sort((a, b) => a.displayOrder - b.displayOrder).slice(0, 4);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightbox, setLightbox] = useState<ProjectVisual | null>(null);
  useEffect(() => { setActiveIndex(0); }, [items.length]);
  if (!items.length) return null;
  const active = items[activeIndex] ?? items[0];
  const change = (offset: number) => setActiveIndex((current) => (current + offset + items.length) % items.length);

  return <section className="media-carousel" aria-label="Project showcase media">
    <div className="carousel-stage">
      <MediaItem visual={active} onImageClick={() => setLightbox(active)} />
      {items.length > 1 && <div className="carousel-controls" aria-label="Carousel controls">
        <button type="button" onClick={() => change(-1)} aria-label="Previous media item">←</button>
        <button type="button" onClick={() => change(1)} aria-label="Next media item">→</button>
      </div>}
    </div>
    {items.length > 1 && <div className="carousel-thumbnails" role="tablist" aria-label="Choose showcase media">
      {items.map((item, index) => <button key={`${item.url}-${item.displayOrder}`} type="button" role="tab" aria-selected={index === activeIndex} aria-label={`View ${item.label || item.alt || `media item ${index + 1}`}`} className={index === activeIndex ? "is-active" : ""} onClick={() => setActiveIndex(index)}>
        {item.visualType === "image" || item.visualType === "diagram" ? <img src={item.url} alt="" loading="lazy" /> : <span>{item.label || "Video"}</span>}
      </button>)}
    </div>}
    {active.label && <p className="carousel-caption">{active.label}</p>}
    {lightbox && <div className="media-dialog" role="dialog" aria-modal="true" aria-label={lightbox.label || "Enlarged project image"} onClick={() => setLightbox(null)}>
      <button className="media-close" type="button" onClick={() => setLightbox(null)}>Close image</button>
      <img src={lightbox.url} alt={lightbox.alt || lightbox.label || "Project showcase image"} onClick={(event) => event.stopPropagation()} />
    </div>}
  </section>;
}

function MediaItem({ visual, onImageClick }: { visual: ProjectVisual; onImageClick: () => void }) {
  if (visual.visualType === "image" || visual.visualType === "diagram") {
    return <button className="carousel-image" type="button" onClick={onImageClick} aria-label={`Enlarge ${visual.label || visual.alt || "project image"}`}><img src={visual.url} alt={visual.alt || visual.label || "Project showcase image"} /></button>;
  }
  if (visual.visualType === "video" && !visual.provider) return <video controls preload="metadata" poster={visual.posterUrl}><source src={visual.url} /></video>;
  return <iframe src={embedUrl(visual.url, visual.provider)} title={visual.label || "Project video"} loading="lazy" allowFullScreen />;
}

export function ProjectDetail() {
  const { slug = "" } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [project, setProject] = useState<PortfolioProject | null | undefined>();
  const [isReturning, setIsReturning] = useState(false);

  useEffect(() => {
    let active = true;
    loadPublicProject(slug).then((data) => { if (active) setProject(data); });
    return () => { active = false; };
  }, [slug]);

  if (project === undefined) return <main className="detail-page">Loading project…</main>;
  if (!project) return <main className="detail-page"><Link to="/">Back to portfolio</Link><h1>Project not found</h1></main>;

  const requestedDomain = searchParams.get("from");
  const returnDomain = project.placements.some((placement) => placement.domainSlug === requestedDomain) ? requestedDomain : project.placements[0]?.domainSlug;
  const orbitHref = returnDomain ? `/?focus=${encodeURIComponent(returnDomain)}` : "/";
  const liveLink = project.links.find((link) => link.linkType === "live");
  const otherLinks = project.links.filter((link) => link !== liveLink);
  const features = (project.caseStudyItems ?? []).filter((item) => item.kind === "feature");

  return <main className={`detail-page ${location.state && (location.state as { projectTransition?: boolean }).projectTransition ? "project-detail-enter" : ""} ${isReturning ? "project-detail-leave" : ""}`}>
    <nav className="detail-nav" aria-label="Project navigation"><ProjectBackLink to={orbitHref} label={returnDomain ?? "portfolio"} onLeaving={() => setIsReturning(true)} /></nav>
    <MediaCarousel visuals={project.visuals} />
    <header className="project-hero">
      <p className="eyebrow">{returnDomain ?? "Portfolio"} · {project.lifecycle || project.status}</p>
      <h1>{project.title}</h1>
      <p className="project-summary">{project.shortDescription}</p>
      {project.techStack.length > 0 && <div className="chip-row" aria-label="Technology used">{project.techStack.map((item) => <span key={item}>{item}</span>)}</div>}
      {liveLink && <a className="live-site-link" href={liveLink.url} target="_blank" rel="noreferrer">Go to Live Site <span aria-hidden="true">↗</span></a>}
    </header>
    {features.length > 0 && <section className="features-section" aria-labelledby="features-heading"><div className="section-heading"><h2 id="features-heading">Features</h2><p>Selected capabilities from the implementation.</p></div><div className="feature-grid">{features.map((item) => <FeatureCard key={`${item.title}-${item.displayOrder}`} item={item} />)}</div></section>}
    <article className="case-study-article">
      {(project.overview || project.description) && <ArticleSection heading="Overview"><p>{project.overview || project.description}</p></ArticleSection>}
      {project.sections.filter((section) => section.heading && section.body).map((section) => <ArticleSection key={`${section.heading}-${section.displayOrder}`} heading={section.heading}><p>{section.body}</p></ArticleSection>)}
      {(Object.keys(articleHeadings) as Array<keyof typeof articleHeadings>).map((kind) => {
        const items = (project.caseStudyItems ?? []).filter((item) => item.kind === kind);
        return items.length ? <ArticleSection key={kind} heading={articleHeadings[kind]}><div className="article-items">{items.map((item) => <section key={`${item.title}-${item.displayOrder}`}><h3>{item.title}</h3>{item.body && <p>{item.body}</p>}{item.meta && <p className="article-meta">{item.meta}</p>}</section>)}</div></ArticleSection> : null;
      })}
      {otherLinks.length > 0 && <ArticleSection heading="Links"><LinkList links={otherLinks} /></ArticleSection>}
    </article>
  </main>;
}

function FeatureCard({ item }: { item: CaseStudyItem }) { return <article><h3>{item.title}</h3>{item.body && <p>{item.body}</p>}</article>; }
function ArticleSection({ heading, children }: { heading: string; children: React.ReactNode }) { return <section className="article-section"><h2>{heading}</h2>{children}</section>; }
function LinkList({ links }: { links: PortfolioProject["links"] }) { return <div className="link-row">{links.map((link) => <a key={`${link.url}-${link.label}`} href={link.url} target="_blank" rel="noreferrer">{link.label} <span aria-hidden="true">↗</span></a>)}</div>; }

function ProjectBackLink({ to, label, onLeaving }: { to: string; label: string; onLeaving: () => void }) {
  const navigate = useNavigate();
  const [isLeaving, setIsLeaving] = useState(false);
  const leavingRef = useRef(false);
  const reducedMotion = useReducedMotion();
  function goBack() {
    if (leavingRef.current) return;
    leavingRef.current = true;
    if (reducedMotion) {
      navigate(to, { state: { projectReturn: true } });
      return;
    }
    setIsLeaving(true);
    onLeaving();
    window.setTimeout(() => navigate(to, { state: { projectReturn: true } }), 240);
  }
  return <button className={`project-back-link ${isLeaving ? "is-leaving" : ""}`} type="button" onClick={goBack}>← Back to {label}</button>;
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
