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
  linkType: "live" | "demo" | "repo" | "docs" | "case-study" | "media" | "other";
  displayOrder: number;
};

export type ProjectVisual = {
  label: string;
  url: string;
  alt: string;
  visualType: "image" | "video" | "embed" | "diagram";
  displayOrder: number;
  featured?: boolean;
  posterUrl?: string;
  provider?: string;
};

export type ProjectSection = {
  heading: string;
  body: string;
  displayOrder: number;
};

export type CaseStudyItem = {
  kind: "feature" | "challenge" | "metric" | "future-plan";
  title: string;
  body: string;
  meta?: string;
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
  overview?: string;
  status: string;
  lifecycle?: string;
  role?: string;
  teamSize?: string;
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
  caseStudyItems?: CaseStudyItem[];
  placements: ProjectPlacement[];
};

export type PortfolioPayload = {
  domains: PortfolioDomain[];
  projects: PortfolioProject[];
  identityWords?: string[];
};

export const fallbackDomains = legacyPortfolio.domains as PortfolioDomain[];

const showcaseFixtures: Record<string, Partial<PortfolioProject>> = {
  antix: {
    overview: "AnTix is an end-to-end ticketing platform built for the operational reality of live events, supporting purchase through check-in with QR delivery and organizer administration.",
    lifecycle: "Production",
    role: "Solo builder — product, frontend, backend, and event operations",
    teamSize: "Independent project",
    caseStudyItems: [
      { kind: "feature", title: "Ticket fulfillment", body: "Verified payment completion creates tickets and triggers QR delivery with resend and recovery workflows.", displayOrder: 1 },
      { kind: "feature", title: "Live check-in", body: "Mobile workflows validate QR tickets while protecting against duplicate scans and inconsistent entry state.", displayOrder: 2 },
      { kind: "challenge", title: "Reliable checkout state", body: "Stripe webhooks, reservations, verification logic, and duplicate-webhook handling keep retries and network failures from producing duplicate fulfillment.", displayOrder: 1 },
      { kind: "metric", title: "Live-event use", body: "Used by two organizers across five live events to sell and validate 500 tickets.", meta: "99% ticket-delivery rate reported through delivery logging and recovery tooling.", displayOrder: 1 },
      { kind: "future-plan", title: "Showcase media", body: "Screenshots and a walkthrough video are pending; no media has been added until it is clearly mapped to this project.", displayOrder: 1 },
    ],
  },
};

export const fallbackProjects = (legacyPortfolio.projects as PortfolioProject[]).map((project) => ({
  ...project,
  ...showcaseFixtures[project.slug],
}));

export const fallbackPortfolio: PortfolioPayload = {
  domains: fallbackDomains,
  projects: fallbackProjects,
  identityWords: legacyPortfolio.identityWords,
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

  return { domains: publicDomains, projects: publicProjects, identityWords: data.identityWords };
}
