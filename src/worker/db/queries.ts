import {
  fallbackDomains,
  fallbackPortfolio,
  fallbackProjects,
  publicPortfolio,
  type PortfolioDomain,
  type PortfolioPayload,
  type PortfolioProject,
  type Visibility,
} from "../../data/portfolio";

type DomainRow = {
  id: string;
  slug: string;
  name: string;
  label: string;
  description: string;
  color_key: string;
  color_primary: string;
  color_secondary: string;
  orbit_order: number;
  enabled: number;
  visibility: Visibility;
};

type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  description: string;
  status: string;
  visibility: Visibility;
  enabled: number;
  archived: number;
  featured: number;
  start_date: string | null;
  end_date: string | null;
};

type PlacementRow = {
  project_id: string;
  domain_slug: string;
  placement_order: number;
};

type ChildRow = {
  project_id: string;
  value?: string;
  label?: string;
  url?: string;
  link_type?: string;
  heading?: string;
  body?: string;
  alt?: string;
  visual_type?: string;
  display_order: number;
};

export type DomainInput = Partial<Omit<PortfolioDomain, "id">> & {
  id?: string;
  slug: string;
  name: string;
};

export type ProjectInput = Partial<Omit<PortfolioProject, "id">> & {
  id?: string;
  slug: string;
  title: string;
};

export type PlacementInput = {
  projectSlug: string;
  domainSlug: string;
  placementOrder: number;
};

const now = () => new Date().toISOString();

function toBool(value: number | boolean | undefined, fallback = true) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  return fallback;
}

function domainFromRow(row: DomainRow): PortfolioDomain {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    label: row.label,
    description: row.description,
    colorKey: row.color_key as PortfolioDomain["colorKey"],
    colorPrimary: row.color_primary,
    colorSecondary: row.color_secondary,
    orbitOrder: row.orbit_order,
    enabled: row.enabled === 1,
    visibility: row.visibility,
  };
}

function emptyChildren(projectId: string) {
  return {
    placements: [] as PortfolioProject["placements"],
    techStack: [] as string[],
    highlights: [] as string[],
    links: [] as PortfolioProject["links"],
    visuals: [] as PortfolioProject["visuals"],
    sections: [] as PortfolioProject["sections"],
    projectId,
  };
}

function projectFromRow(
  row: ProjectRow,
  children: ReturnType<typeof emptyChildren>,
): PortfolioProject {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    description: row.description,
    status: row.status,
    visibility: row.visibility,
    enabled: row.enabled === 1,
    archived: row.archived === 1,
    featured: row.featured === 1,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    techStack: children.techStack,
    highlights: children.highlights,
    links: children.links,
    visuals: children.visuals,
    sections: children.sections,
    placements: children.placements,
  };
}

export async function getPortfolio(db: D1Database, options?: { includePrivate?: boolean }) {
  const domainsResult = await db
    .prepare("SELECT * FROM domains ORDER BY orbit_order ASC, name ASC")
    .all<DomainRow>();
  const projectsResult = await db
    .prepare("SELECT * FROM projects ORDER BY featured DESC, title ASC")
    .all<ProjectRow>();

  const domains = domainsResult.results.map(domainFromRow);
  const projects = await hydrateProjects(db, projectsResult.results);
  const payload = { domains, projects, identityWords: fallbackPortfolio.identityWords };

  return options?.includePrivate ? payload : publicPortfolio(payload);
}

export async function getProjectBySlug(
  db: D1Database,
  slug: string,
  options?: { includePrivate?: boolean },
) {
  if (!options?.includePrivate) {
    const portfolio = await getPortfolio(db);
    return portfolio.projects.find((project) => project.slug === slug) ?? null;
  }

  const row = await db
    .prepare("SELECT * FROM projects WHERE slug = ?")
    .bind(slug)
    .first<ProjectRow>();

  if (!row) return null;
  const [project] = await hydrateProjects(db, [row]);
  if (!project) return null;
  return project;
}

async function hydrateProjects(db: D1Database, rows: ProjectRow[]) {
  if (rows.length === 0) return [];

  const projectIds = rows.map((row) => row.id);
  const placeholders = projectIds.map(() => "?").join(",");
  const children = new Map(projectIds.map((id) => [id, emptyChildren(id)]));

  const [placements, tech, highlights, links, sections, visuals] = await Promise.all([
    db
      .prepare(
        `SELECT p.project_id, d.slug AS domain_slug, p.placement_order
         FROM project_domain_placements p
         JOIN domains d ON d.id = p.domain_id
         WHERE p.project_id IN (${placeholders})
         ORDER BY p.placement_order ASC`,
      )
      .bind(...projectIds)
      .all<PlacementRow>(),
    db
      .prepare(
        `SELECT project_id, name AS value, display_order
         FROM project_tech_stack
         WHERE project_id IN (${placeholders})
         ORDER BY display_order ASC`,
      )
      .bind(...projectIds)
      .all<ChildRow>(),
    db
      .prepare(
        `SELECT project_id, text AS value, display_order
         FROM project_highlights
         WHERE project_id IN (${placeholders})
         ORDER BY display_order ASC`,
      )
      .bind(...projectIds)
      .all<ChildRow>(),
    db
      .prepare(
        `SELECT project_id, label, url, link_type, display_order
         FROM project_links
         WHERE project_id IN (${placeholders})
         ORDER BY display_order ASC`,
      )
      .bind(...projectIds)
      .all<ChildRow>(),
    db
      .prepare(
        `SELECT project_id, heading, body, display_order
         FROM project_sections
         WHERE project_id IN (${placeholders})
         ORDER BY display_order ASC`,
      )
      .bind(...projectIds)
      .all<ChildRow>(),
    db
      .prepare(
        `SELECT project_id, label, url, alt, visual_type, display_order
         FROM project_visuals
         WHERE project_id IN (${placeholders})
         ORDER BY display_order ASC`,
      )
      .bind(...projectIds)
      .all<ChildRow>(),
  ]);

  for (const row of placements.results) {
    children.get(row.project_id)?.placements.push({
      domainSlug: row.domain_slug,
      placementOrder: row.placement_order,
    });
  }
  for (const row of tech.results) children.get(row.project_id)?.techStack.push(row.value ?? "");
  for (const row of highlights.results) {
    children.get(row.project_id)?.highlights.push(row.value ?? "");
  }
  for (const row of links.results) {
    children.get(row.project_id)?.links.push({
      label: row.label ?? "Link",
      url: row.url ?? "#",
      linkType: (row.link_type ?? "other") as PortfolioProject["links"][number]["linkType"],
      displayOrder: row.display_order,
    });
  }
  for (const row of sections.results) {
    children.get(row.project_id)?.sections.push({
      heading: row.heading ?? "",
      body: row.body ?? "",
      displayOrder: row.display_order,
    });
  }
  for (const row of visuals.results) {
    children.get(row.project_id)?.visuals.push({
      label: row.label ?? "",
      url: row.url ?? "",
      alt: row.alt ?? "",
      visualType: (row.visual_type ?? "image") as PortfolioProject["visuals"][number]["visualType"],
      displayOrder: row.display_order,
    });
  }

  return rows.map((row) => projectFromRow(row, children.get(row.id) ?? emptyChildren(row.id)));
}

export async function upsertDomain(db: D1Database, input: DomainInput) {
  const id = input.id ?? `domain-${input.slug}`;
  await db
    .prepare(
      `INSERT INTO domains (
        id, slug, name, label, description, color_key, color_primary, color_secondary,
        orbit_order, enabled, visibility, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        name = excluded.name,
        label = excluded.label,
        description = excluded.description,
        color_key = excluded.color_key,
        color_primary = excluded.color_primary,
        color_secondary = excluded.color_secondary,
        orbit_order = excluded.orbit_order,
        enabled = excluded.enabled,
        visibility = excluded.visibility,
        updated_at = excluded.updated_at`,
    )
    .bind(
      id,
      input.slug,
      input.name,
      input.label ?? input.name,
      input.description ?? "",
      input.colorKey ?? "software",
      input.colorPrimary ?? "#38bdf8",
      input.colorSecondary ?? "#2563eb",
      input.orbitOrder ?? 1,
      toBool(input.enabled, true) ? 1 : 0,
      input.visibility ?? "public",
      now(),
    )
    .run();

  return getPortfolio(db, { includePrivate: true });
}

export async function upsertProject(db: D1Database, input: ProjectInput) {
  const id = input.id ?? `project-${input.slug}`;
  await db
    .prepare(
      `INSERT INTO projects (
        id, slug, title, short_description, description, status, visibility,
        enabled, archived, featured, start_date, end_date, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        title = excluded.title,
        short_description = excluded.short_description,
        description = excluded.description,
        status = excluded.status,
        visibility = excluded.visibility,
        enabled = excluded.enabled,
        archived = excluded.archived,
        featured = excluded.featured,
        start_date = excluded.start_date,
        end_date = excluded.end_date,
        updated_at = excluded.updated_at`,
    )
    .bind(
      id,
      input.slug,
      input.title,
      input.shortDescription ?? "",
      input.description ?? "",
      input.status ?? "Draft",
      input.visibility ?? "draft",
      toBool(input.enabled, true) ? 1 : 0,
      toBool(input.archived, false) ? 1 : 0,
      toBool(input.featured, false) ? 1 : 0,
      input.startDate ?? null,
      input.endDate ?? null,
      now(),
    )
    .run();

  await replaceProjectChildren(db, id, input);
  return getPortfolio(db, { includePrivate: true });
}

async function replaceProjectChildren(db: D1Database, projectId: string, input: ProjectInput) {
  await db.batch([
    db.prepare("DELETE FROM project_domain_placements WHERE project_id = ?").bind(projectId),
    db.prepare("DELETE FROM project_tech_stack WHERE project_id = ?").bind(projectId),
    db.prepare("DELETE FROM project_highlights WHERE project_id = ?").bind(projectId),
    db.prepare("DELETE FROM project_links WHERE project_id = ?").bind(projectId),
    db.prepare("DELETE FROM project_sections WHERE project_id = ?").bind(projectId),
    db.prepare("DELETE FROM project_visuals WHERE project_id = ?").bind(projectId),
  ]);

  const statements: D1PreparedStatement[] = [];
  for (const [index, name] of (input.techStack ?? []).entries()) {
    statements.push(
      db
        .prepare("INSERT INTO project_tech_stack (id, project_id, name, display_order) VALUES (?, ?, ?, ?)")
        .bind(`${projectId}-tech-${index + 1}`, projectId, name, index + 1),
    );
  }
  for (const [index, text] of (input.highlights ?? []).entries()) {
    statements.push(
      db
        .prepare("INSERT INTO project_highlights (id, project_id, text, display_order) VALUES (?, ?, ?, ?)")
        .bind(`${projectId}-highlight-${index + 1}`, projectId, text, index + 1),
    );
  }
  for (const placement of input.placements ?? []) {
    const domain = await db
      .prepare("SELECT id FROM domains WHERE slug = ?")
      .bind(placement.domainSlug)
      .first<{ id: string }>();
    if (domain) {
      statements.push(
        db
          .prepare(
            `INSERT INTO project_domain_placements (id, project_id, domain_id, placement_order)
             VALUES (?, ?, ?, ?)`,
          )
          .bind(
            `${projectId}-${domain.id}`,
            projectId,
            domain.id,
            placement.placementOrder,
          ),
      );
    }
  }
  for (const link of input.links ?? []) {
    statements.push(
      db
        .prepare(
          `INSERT INTO project_links (id, project_id, label, url, link_type, display_order)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          `${projectId}-link-${link.displayOrder}`,
          projectId,
          link.label,
          link.url,
          link.linkType,
          link.displayOrder,
        ),
    );
  }
  for (const section of input.sections ?? []) {
    statements.push(
      db
        .prepare(
          `INSERT INTO project_sections (id, project_id, heading, body, display_order)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(
          `${projectId}-section-${section.displayOrder}`,
          projectId,
          section.heading,
          section.body,
          section.displayOrder,
        ),
    );
  }
  for (const visual of input.visuals ?? []) {
    statements.push(
      db
        .prepare(
          `INSERT INTO project_visuals (id, project_id, label, url, alt, visual_type, display_order)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          `${projectId}-visual-${visual.displayOrder}`,
          projectId,
          visual.label,
          visual.url,
          visual.alt,
          visual.visualType,
          visual.displayOrder,
        ),
    );
  }

  if (statements.length > 0) await db.batch(statements);
}

export async function softDisableProject(db: D1Database, id: string) {
  await db
    .prepare("UPDATE projects SET enabled = 0, updated_at = ? WHERE id = ?")
    .bind(now(), id)
    .run();
  return getPortfolio(db, { includePrivate: true });
}

export async function putPlacement(db: D1Database, input: PlacementInput) {
  const project = await db
    .prepare("SELECT id FROM projects WHERE slug = ?")
    .bind(input.projectSlug)
    .first<{ id: string }>();
  const domain = await db
    .prepare("SELECT id FROM domains WHERE slug = ?")
    .bind(input.domainSlug)
    .first<{ id: string }>();

  if (!project || !domain) {
    throw new Error("Project or domain not found.");
  }

  await db
    .prepare(
      `INSERT INTO project_domain_placements (id, project_id, domain_id, placement_order, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(project_id, domain_id) DO UPDATE SET
        placement_order = excluded.placement_order,
        updated_at = excluded.updated_at`,
    )
    .bind(
      `placement-${project.id}-${domain.id}`,
      project.id,
      domain.id,
      input.placementOrder,
      now(),
    )
    .run();

  return getPortfolio(db, { includePrivate: true });
}

export async function seedDatabase(db: D1Database): Promise<PortfolioPayload> {
  for (const domain of fallbackDomains) {
    await upsertDomain(db, domain);
  }
  for (const project of fallbackProjects) {
    await upsertProject(db, project);
  }
  await db
    .prepare(
      `UPDATE projects SET enabled = 0, updated_at = ?
       WHERE slug IN ('orbital-portfolio', 'acs-studios-registry', 'signal-sketches')`,
    )
    .bind(now())
    .run();
  return getPortfolio(db, { includePrivate: true });
}

export function fallbackPublicPortfolio() {
  return publicPortfolio(fallbackPortfolio);
}
