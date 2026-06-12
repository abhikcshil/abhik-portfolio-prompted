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

export const fallbackDomains: PortfolioDomain[] = [
  {
    id: "domain-software",
    slug: "software",
    name: "Software",
    label: "Software",
    description: "Full-stack systems, Cloudflare-native apps, and product engineering.",
    colorKey: "software",
    colorPrimary: "#38bdf8",
    colorSecondary: "#2563eb",
    orbitOrder: 1,
    enabled: true,
    visibility: "public",
  },
  {
    id: "domain-hardware",
    slug: "hardware",
    name: "Hardware",
    label: "Hardware",
    description: "Embedded experiments, circuits, physical interfaces, and systems thinking.",
    colorKey: "hardware",
    colorPrimary: "#2dd4bf",
    colorSecondary: "#16a34a",
    orbitOrder: 2,
    enabled: true,
    visibility: "public",
  },
  {
    id: "domain-music",
    slug: "music",
    name: "Music",
    label: "Music",
    description: "Composition, production, sonic sketches, and performance tools.",
    colorKey: "music",
    colorPrimary: "#fb923c",
    colorSecondary: "#ef4444",
    orbitOrder: 3,
    enabled: true,
    visibility: "public",
  },
  {
    id: "domain-visuals",
    slug: "visuals",
    name: "Visuals",
    label: "Visuals",
    description: "Motion, graphics, interactive interfaces, and visual systems.",
    colorKey: "visuals",
    colorPrimary: "#c084fc",
    colorSecondary: "#7c3aed",
    orbitOrder: 4,
    enabled: true,
    visibility: "public",
  },
];

export const fallbackProjects: PortfolioProject[] = [
  {
    id: "project-orbital-portfolio",
    slug: "orbital-portfolio",
    title: "Orbital Portfolio",
    shortDescription: "A deterministic solar-system interface for exploring domains and projects.",
    description:
      "A personal portfolio rebuilt as an interactive orbital map, with domains as planets and projects as moons.",
    status: "Building",
    visibility: "public",
    enabled: true,
    archived: false,
    featured: true,
    startDate: "2026-05-01",
    techStack: ["React", "TypeScript", "Vite", "Cloudflare Workers", "D1"],
    highlights: [
      "Deterministic orbital positioning without render-time randomness.",
      "D1-backed public API with static TypeScript fallback data.",
      "Admin surfaces designed to sit behind Cloudflare Access.",
    ],
    links: [
      {
        label: "Portfolio",
        url: "https://portfolio.acsstudios.co",
        linkType: "demo",
        displayOrder: 1,
      },
    ],
    visuals: [],
    sections: [
      {
        heading: "Intent",
        body: "The interface keeps the portfolio exploratory while making project data editable through a Cloudflare-native backend.",
        displayOrder: 1,
      },
    ],
    placements: [
      { domainSlug: "software", placementOrder: 1 },
      { domainSlug: "visuals", placementOrder: 2 },
    ],
  },
  {
    id: "project-acs-studios-registry",
    slug: "acs-studios-registry",
    title: "ACS Studios Registry",
    shortDescription: "A planned registry entry for the ACS Studios ecosystem.",
    description:
      "A registry-facing representation of the portfolio as an active ACS Studios property.",
    status: "Building",
    visibility: "public",
    enabled: true,
    archived: false,
    featured: false,
    techStack: ["Cloudflare", "Workers", "Content Modeling"],
    highlights: [
      "Tracks Portfolio as portfolio.acsstudios.co.",
      "Keeps the personal identity primary while acknowledging ACS Studios.",
    ],
    links: [],
    visuals: [],
    sections: [
      {
        heading: "Ecosystem",
        body: "The portfolio is designed to become a small but coherent member of the broader ACS Studios surface area.",
        displayOrder: 1,
      },
    ],
    placements: [
      { domainSlug: "software", placementOrder: 2 },
      { domainSlug: "hardware", placementOrder: 3 },
    ],
  },
  {
    id: "project-signal-sketches",
    slug: "signal-sketches",
    title: "Signal Sketches",
    shortDescription: "A cross-domain collection of audio and visual interaction studies.",
    description:
      "Small studies that connect sound design, generative visuals, and interface controls.",
    status: "Exploring",
    visibility: "public",
    enabled: true,
    archived: false,
    featured: false,
    techStack: ["Web Audio", "Canvas", "MIDI", "Design Systems"],
    highlights: [
      "Uses music as an interaction material.",
      "Pairs visual feedback with hardware-inspired controls.",
    ],
    links: [],
    visuals: [],
    sections: [
      {
        heading: "Approach",
        body: "Each sketch focuses on one expressive interaction and keeps the implementation portable.",
        displayOrder: 1,
      },
    ],
    placements: [
      { domainSlug: "music", placementOrder: 1 },
      { domainSlug: "visuals", placementOrder: 1 },
      { domainSlug: "hardware", placementOrder: 2 },
    ],
  },
];

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
