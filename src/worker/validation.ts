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
    status: optionalString(value.status) ?? "Draft",
    visibility: visibility as ProjectInput["visibility"],
    enabled: optionalBoolean(value.enabled),
    archived: optionalBoolean(value.archived),
    featured: optionalBoolean(value.featured),
    startDate: optionalString(value.startDate),
    endDate: optionalString(value.endDate),
    techStack: optionalList(value.techStack),
    highlights: optionalList(value.highlights),
    links: [],
    visuals: [],
    sections:
      typeof value.description === "string" && value.description.trim()
        ? [{ heading: "Overview", body: value.description.trim(), displayOrder: 1 }]
        : [],
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
