import legacyPortfolio from "./legacy-portfolio.json";

export type Visibility = "public" | "private" | "draft";

export type DomainColorKey = "software" | "hardware" | "music" | "visuals";

export type PortfolioDomain = {
  id: string;
  slug: string;
  name: string;
  label: string;
  description: string;
  colorKey: DomainColorKey;
  colorPrimary: string;
  colorSecondary: string;
  orbitOrder: number;
  enabled: boolean;
  visibility: Visibility;
};

export type ProjectLink = {
  label: string;
  url: string;
  linkType: "demo" | "repo" | "case-study" | "media" | "other";
  displayOrder: number;
};

export type ProjectVisual = {
  label: string;
  url: string;
  alt: string;
  visualType: "image" | "video" | "embed" | "diagram";
  displayOrder: number;
};

export type ProjectSection = {
  heading: string;
  body: string;
  displayOrder: number;
};

export type ProjectPlacement = {
  domainSlug: string;
  placementOrder: number;
};

export type PortfolioProject = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  status: string;
  visibility: Visibility;
  enabled: boolean;
  archived: boolean;
  featured: boolean;
  startDate?: string;
  endDate?: string;
  techStack: string[];
  highlights: string[];
  links: ProjectLink[];
  visuals: ProjectVisual[];
  sections: ProjectSection[];
  placements: ProjectPlacement[];
};

export type PortfolioPayload = {
  domains: PortfolioDomain[];
  projects: PortfolioProject[];
};

export const fallbackDomains = legacyPortfolio.domains as PortfolioDomain[];

export const fallbackProjects = legacyPortfolio.projects as PortfolioProject[];

export const fallbackPortfolio: PortfolioPayload = {
  domains: fallbackDomains,
  projects: fallbackProjects,
};

export function publicPortfolio(data: PortfolioPayload): PortfolioPayload {
  const publicDomains = data.domains
    .filter((domain) => domain.enabled && domain.visibility === "public")
    .sort((a, b) => a.orbitOrder - b.orbitOrder);
  const domainSlugs = new Set(publicDomains.map((domain) => domain.slug));
  const publicProjects = data.projects
    .filter(
      (project) =>
        project.enabled &&
        !project.archived &&
        project.visibility === "public" &&
        project.placements.some((placement) => domainSlugs.has(placement.domainSlug)),
    )
    .map((project) => ({
      ...project,
      placements: project.placements.filter((placement) =>
        domainSlugs.has(placement.domainSlug),
      ),
    }));

  return { domains: publicDomains, projects: publicProjects };
}
