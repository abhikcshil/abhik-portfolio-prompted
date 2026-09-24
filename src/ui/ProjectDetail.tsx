import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import type { PortfolioProject, ProjectVisual } from "../data/portfolio";
import { loadPublicProject } from "./api";

const itemHeadings = { feature: "Features", challenge: "Technical challenges", metric: "Impact & results", "future-plan": "Future plans" } as const;

function embedUrl(url: string, provider?: string) {
  if (provider === "youtube" || /(?:youtube\.com|youtu\.be)/.test(url)) {
    const id = url.match(/(?:v=|youtu\.be\/|embed\/)([^?&/]+)/)?.[1];
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : url;
  }
  return url;
}

function MediaGallery({ visuals }: { visuals: ProjectVisual[] }) {
  const [selected, setSelected] = useState<ProjectVisual | null>(null);
  const images = visuals.filter((item) => item.visualType === "image" || item.visualType === "diagram").slice(0, 4);
  const video = visuals.find((item) => item.visualType === "video" || item.visualType === "embed");
  if (!images.length && !video) return null;
  return <section className="showcase-media" aria-labelledby="showcase-media-heading">
    <h2 id="showcase-media-heading">Showcase</h2>
    {images.length > 0 && <div className={`media-grid media-grid-${images.length}`}>{images.map((image, index) => <figure key={`${image.url}-${index}`} className={image.featured || index === 0 ? "media-featured" : ""}>
      <button type="button" onClick={() => setSelected(image)} aria-label={`Enlarge ${image.label || image.alt || "project image"}`}><img src={image.url} alt={image.alt || image.label || "Project showcase image"} loading={index === 0 ? "eager" : "lazy"} /></button>
      {image.label && <figcaption>{image.label}</figcaption>}
    </figure>)}</div>}
    {video && <figure className="video-showcase">
      {video.visualType === "video" && !video.provider ? <video controls preload="metadata" poster={video.posterUrl}><source src={video.url} /></video> : <iframe src={embedUrl(video.url, video.provider)} title={video.label || "Project video"} loading="lazy" allowFullScreen />}
      {video.label && <figcaption>{video.label}</figcaption>}
    </figure>}
    {selected && <div className="media-dialog" role="dialog" aria-modal="true" aria-label={selected.label || "Enlarged project image"} onClick={() => setSelected(null)}><button className="media-close" type="button" onClick={() => setSelected(null)}>Close image</button><img src={selected.url} alt={selected.alt || selected.label || "Project showcase image"} onClick={(event) => event.stopPropagation()} /></div>}
  </section>;
}

export function ProjectDetail() {
  const { slug = "" } = useParams(); const [searchParams] = useSearchParams();
  const [project, setProject] = useState<PortfolioProject | null | undefined>();
  useEffect(() => { let active = true; loadPublicProject(slug).then((data) => { if (active) setProject(data); }); return () => { active = false; }; }, [slug]);
  if (project === undefined) return <main className="detail-page">Loading project…</main>;
  if (!project) return <main className="detail-page"><Link to="/">Back to portfolio</Link><h1>Project not found</h1></main>;
  const requestedDomain = searchParams.get("from");
  const returnDomain = project.placements.some((placement) => placement.domainSlug === requestedDomain) ? requestedDomain : project.placements[0]?.domainSlug;
  const orbitHref = returnDomain ? `/?focus=${encodeURIComponent(returnDomain)}` : "/";
  const items = project.caseStudyItems ?? [];
  return <main className="detail-page">
    <nav className="detail-nav" aria-label="Project navigation"><Link to={orbitHref}>← Back to {returnDomain ?? "portfolio"}</Link><Link to="/">Portfolio</Link><a href="https://acsstudios.co">ACS Studios</a></nav>
    <header className="project-hero"><p className="eyebrow">{returnDomain ?? "Portfolio"} · {project.lifecycle || project.status}</p><h1>{project.title}</h1><p className="project-summary">{project.shortDescription}</p>
      <dl className="project-meta">{project.role && <><dt>Role</dt><dd>{project.role}</dd></>}{project.teamSize && <><dt>Team</dt><dd>{project.teamSize}</dd></>}{(project.startDate || project.endDate) && <><dt>Dates</dt><dd>{project.startDate}{project.endDate ? ` – ${project.endDate}` : " – present"}</dd></>}</dl>
      {project.links.length > 0 && <LinkList links={project.links} className="hero-links" />}{project.techStack.length > 0 && <div className="chip-row" aria-label="Technology used">{project.techStack.map((item) => <span key={item}>{item}</span>)}</div>}
    </header>
    <MediaGallery visuals={project.visuals} />
    {(project.overview || project.description) && <CaseStudySection heading="Overview"><p>{project.overview || project.description}</p></CaseStudySection>}
    {project.highlights.length > 0 && <CaseStudySection heading="Highlights"><ul className="detail-list">{project.highlights.map((item) => <li key={item}>{item}</li>)}</ul></CaseStudySection>}
    {project.sections.filter((section) => section.heading && section.body).map((section) => <CaseStudySection key={`${section.heading}-${section.displayOrder}`} heading={section.heading}><p>{section.body}</p></CaseStudySection>)}
    {(Object.keys(itemHeadings) as Array<keyof typeof itemHeadings>).map((kind) => { const grouped = items.filter((item) => item.kind === kind); return grouped.length ? <CaseStudySection key={kind} heading={itemHeadings[kind]}><div className="case-item-grid">{grouped.map((item) => <article key={`${item.title}-${item.displayOrder}`}><h3>{item.title}</h3>{item.body && <p>{item.body}</p>}{item.meta && <small>{item.meta}</small>}</article>)}</div></CaseStudySection> : null; })}
    {project.links.length > 0 && <CaseStudySection heading="Links"><LinkList links={project.links} className="link-row" /></CaseStudySection>}
  </main>;
}

function CaseStudySection({ heading, children }: { heading: string; children: React.ReactNode }) { return <section className="case-study-section"><h2>{heading}</h2>{children}</section>; }
function LinkList({ links, className }: { links: PortfolioProject["links"]; className: string }) { return <div className={className}>{links.map((link) => <a key={`${link.url}-${link.label}`} href={link.url} target="_blank" rel="noreferrer">{link.label}</a>)}</div>; }
