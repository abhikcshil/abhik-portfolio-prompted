import type { DomainInput, PlacementInput, ProjectInput } from "./db/queries";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const visibilityValues = new Set(["public", "private", "draft"]);

function assertObject(value: unknown): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected a JSON object.");
  }
}

function requireString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} is required.`);
  }
  return value.trim();
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : undefined;
}

function optionalBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function optionalList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").map((item) => item.trim());
}

function optionalRecords(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    : [];
}

function normalizeSlug(value: string) {
  const slug = value.trim().toLowerCase();
  if (!slugPattern.test(slug)) throw new Error("Slug must use lowercase letters, numbers, and hyphens.");
  return slug;
}

export function parseDomainInput(value: unknown): DomainInput {
  assertObject(value);
  const slug = normalizeSlug(requireString(value.slug, "slug"));
  const visibility = optionalString(value.visibility) ?? "public";
  if (!visibilityValues.has(visibility)) throw new Error("Invalid visibility.");

  return {
    id: optionalString(value.id),
    slug,
    name: requireString(value.name, "name"),
    label: optionalString(value.label),
    description: optionalString(value.description),
    colorKey: optionalString(value.colorKey) as DomainInput["colorKey"],
    colorPrimary: optionalString(value.colorPrimary),
    colorSecondary: optionalString(value.colorSecondary),
    orbitOrder: typeof value.orbitOrder === "number" ? value.orbitOrder : 1,
    enabled: optionalBoolean(value.enabled),
    visibility: visibility as DomainInput["visibility"],
  };
}

export function parseProjectInput(value: unknown): ProjectInput {
  assertObject(value);
  const slug = normalizeSlug(requireString(value.slug, "slug"));
  const visibility = optionalString(value.visibility) ?? "draft";
  if (!visibilityValues.has(visibility)) throw new Error("Invalid visibility.");

  return {
    id: optionalString(value.id),
    slug,
    title: requireString(value.title, "title"),
    shortDescription: optionalString(value.shortDescription) ?? "",
    description: optionalString(value.description) ?? "",
    overview: optionalString(value.overview),
    status: optionalString(value.status) ?? "Draft",
    lifecycle: optionalString(value.lifecycle),
    role: optionalString(value.role),
    teamSize: optionalString(value.teamSize),
    visibility: visibility as ProjectInput["visibility"],
    enabled: optionalBoolean(value.enabled),
    archived: optionalBoolean(value.archived),
    featured: optionalBoolean(value.featured),
    startDate: optionalString(value.startDate),
    endDate: optionalString(value.endDate),
    techStack: optionalList(value.techStack),
    highlights: optionalList(value.highlights),
    links: optionalRecords(value.links).flatMap((item, index) => {
      const url = optionalString(item.url);
      if (!url) return [];
      return [{ label: optionalString(item.label) ?? "Link", url, linkType: (optionalString(item.linkType) ?? "other") as NonNullable<ProjectInput["links"]>[number]["linkType"], displayOrder: typeof item.displayOrder === "number" ? item.displayOrder : index + 1 }];
    }),
    visuals: optionalRecords(value.visuals).flatMap((item, index) => {
      const url = optionalString(item.url);
      if (!url) return [];
      return [{ label: optionalString(item.label) ?? "", url, alt: optionalString(item.alt) ?? "", visualType: (optionalString(item.visualType) ?? "image") as NonNullable<ProjectInput["visuals"]>[number]["visualType"], featured: optionalBoolean(item.featured) ?? false, posterUrl: optionalString(item.posterUrl), provider: optionalString(item.provider), displayOrder: typeof item.displayOrder === "number" ? item.displayOrder : index + 1 }];
    }),
    sections: optionalRecords(value.sections).flatMap((item, index) => {
      const body = optionalString(item.body);
      if (!body) return [];
      return [{ heading: optionalString(item.heading) ?? "Details", body, displayOrder: typeof item.displayOrder === "number" ? item.displayOrder : index + 1 }];
    }),
    caseStudyItems: optionalRecords(value.caseStudyItems).flatMap((item, index) => {
      const title = optionalString(item.title);
      if (!title) return [];
      const kind = optionalString(item.kind);
      if (!kind || !["feature", "challenge", "metric", "future-plan"].includes(kind)) return [];
      return [{ kind: kind as NonNullable<ProjectInput["caseStudyItems"]>[number]["kind"], title, body: optionalString(item.body) ?? "", meta: optionalString(item.meta), displayOrder: typeof item.displayOrder === "number" ? item.displayOrder : index + 1 }];
    }),
    placements: Array.isArray(value.placements)
      ? value.placements
          .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
          .map((item, index) => ({
            domainSlug: normalizeSlug(requireString(item.domainSlug, "domainSlug")),
            placementOrder:
              typeof item.placementOrder === "number" ? item.placementOrder : index + 1,
          }))
      : [],
  };
}

export function parsePlacementInput(value: unknown): PlacementInput {
  assertObject(value);
  return {
    projectSlug: normalizeSlug(requireString(value.projectSlug, "projectSlug")),
    domainSlug: normalizeSlug(requireString(value.domainSlug, "domainSlug")),
    placementOrder: typeof value.placementOrder === "number" ? value.placementOrder : 1,
  };
}
