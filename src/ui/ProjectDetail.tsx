import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { PortfolioProject } from "../data/portfolio";
import { loadPublicProject } from "./api";

export function ProjectDetail() {
  const { slug = "" } = useParams();
  const [project, setProject] = useState<PortfolioProject | null | undefined>();

  useEffect(() => {
    let active = true;
    loadPublicProject(slug).then((data) => {
      if (active) setProject(data);
    });
    return () => {
      active = false;
    };
  }, [slug]);

  if (project === undefined) return <main className="detail-page">Loading...</main>;
  if (!project) {
    return (
      <main className="detail-page">
        <Link to="/">Back</Link>
        <h1>Project not found</h1>
      </main>
    );
  }

  return (
    <main className="detail-page">
      <Link to="/">Back to orbit</Link>
      <p>{project.status}</p>
      <h1>{project.title}</h1>
      <h2>{project.shortDescription}</h2>
      <section>
        <p>{project.description}</p>
        <div className="chip-row">
          {project.techStack.map((item) => (
            <b key={item}>{item}</b>
          ))}
        </div>
      </section>
      {project.highlights.length > 0 && (
        <section>
          <h3>Highlights</h3>
          <ul>
            {project.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}
      {project.sections.map((section) => (
        <section key={section.heading}>
          <h3>{section.heading}</h3>
          <p>{section.body}</p>
        </section>
      ))}
      {project.links.length > 0 && (
        <section className="link-row">
          {project.links.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          ))}
        </section>
      )}
    </main>
  );
}
