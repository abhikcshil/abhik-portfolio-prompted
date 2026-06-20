import { readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const mode = process.argv.includes("--remote") ? "--remote" : process.argv.includes("--local") ? "--local" : null;
if (!mode) {
  console.error("Usage: node scripts/import-legacy-data.mjs --local|--remote");
  process.exit(1);
}

const sourceUrl = "https://abhik-portfolio-pski.onrender.com/";
const source = JSON.parse(await readFile(new URL("../src/data/legacy-portfolio.json", import.meta.url), "utf8"));
const retiredPlaceholderSlugs = ["orbital-portfolio", "acs-studios-registry", "signal-sketches"];
const q = (value) => value == null ? "NULL" : `'${String(value).replaceAll("'", "''")}'`;
const b = (value) => value ? 1 : 0;
const values = (rows) => rows.map((row) => `  (${row.join(", ")})`).join(",\n");

const sql = [];
sql.push(`-- Generated from ${sourceUrl}`);
sql.push("-- Safe to run repeatedly: natural keys are upserted and child rows are replaced per imported project.");
sql.push(`INSERT INTO domains (id, slug, name, label, description, color_key, color_primary, color_secondary, orbit_order, enabled, visibility) VALUES\n${values(source.domains.map((domain) => [q(domain.id), q(domain.slug), q(domain.name), q(domain.label), q(domain.description), q(domain.colorKey), q(domain.colorPrimary), q(domain.colorSecondary), domain.orbitOrder, b(domain.enabled), q(domain.visibility)]))}\nON CONFLICT(slug) DO UPDATE SET name=excluded.name, label=excluded.label, description=excluded.description, color_key=excluded.color_key, color_primary=excluded.color_primary, color_secondary=excluded.color_secondary, orbit_order=excluded.orbit_order, enabled=excluded.enabled, visibility=excluded.visibility, updated_at=CURRENT_TIMESTAMP;`);
sql.push(`INSERT INTO projects (id, slug, title, short_description, description, status, visibility, enabled, archived, featured, start_date, end_date) VALUES\n${values(source.projects.map((project) => [q(project.id), q(project.slug), q(project.title), q(project.shortDescription), q(project.description), q(project.status), q(project.visibility), b(project.enabled), b(project.archived), b(project.featured), q(project.startDate), q(project.endDate)]))}\nON CONFLICT(slug) DO UPDATE SET title=excluded.title, short_description=excluded.short_description, description=excluded.description, status=excluded.status, visibility=excluded.visibility, enabled=excluded.enabled, archived=excluded.archived, featured=excluded.featured, start_date=excluded.start_date, end_date=excluded.end_date, updated_at=CURRENT_TIMESTAMP;`);

const importedSlugs = source.projects.map((project) => q(project.slug)).join(", ");
for (const table of ["project_domain_placements", "project_tech_stack", "project_highlights", "project_links", "project_sections", "project_visuals"]) {
  sql.push(`DELETE FROM ${table} WHERE project_id IN (SELECT id FROM projects WHERE slug IN (${importedSlugs}));`);
}

for (const project of source.projects) {
  for (const placement of project.placements) {
    sql.push(`INSERT INTO project_domain_placements (id, project_id, domain_id, placement_order) SELECT ${q(`placement-${project.slug}-${placement.domainSlug}`)}, p.id, d.id, ${placement.placementOrder} FROM projects p, domains d WHERE p.slug=${q(project.slug)} AND d.slug=${q(placement.domainSlug)};`);
  }
  project.techStack.forEach((name, index) => sql.push(`INSERT INTO project_tech_stack (id, project_id, name, display_order) SELECT ${q(`tech-${project.slug}-${index + 1}`)}, id, ${q(name)}, ${index + 1} FROM projects WHERE slug=${q(project.slug)};`));
  project.highlights.forEach((text, index) => sql.push(`INSERT INTO project_highlights (id, project_id, text, display_order) SELECT ${q(`highlight-${project.slug}-${index + 1}`)}, id, ${q(text)}, ${index + 1} FROM projects WHERE slug=${q(project.slug)};`));
  project.links.forEach((link) => sql.push(`INSERT INTO project_links (id, project_id, label, url, link_type, display_order) SELECT ${q(`link-${project.slug}-${link.displayOrder}`)}, id, ${q(link.label)}, ${q(link.url)}, ${q(link.linkType)}, ${link.displayOrder} FROM projects WHERE slug=${q(project.slug)};`));
  project.sections.forEach((section) => sql.push(`INSERT INTO project_sections (id, project_id, heading, body, display_order) SELECT ${q(`section-${project.slug}-${section.displayOrder}`)}, id, ${q(section.heading)}, ${q(section.body)}, ${section.displayOrder} FROM projects WHERE slug=${q(project.slug)};`));
  project.visuals.forEach((visual) => sql.push(`INSERT INTO project_visuals (id, project_id, label, url, alt, visual_type, display_order) SELECT ${q(`visual-${project.slug}-${visual.displayOrder}`)}, id, ${q(visual.label)}, ${q(visual.url)}, ${q(visual.alt)}, ${q(visual.visualType)}, ${visual.displayOrder} FROM projects WHERE slug=${q(project.slug)};`));
}

sql.push(`UPDATE projects SET enabled=0, updated_at=CURRENT_TIMESTAMP WHERE slug IN (${retiredPlaceholderSlugs.map(q).join(", ")});`);

const path = join(tmpdir(), `portfolio-legacy-import-${process.pid}.sql`);
await writeFile(path, `${sql.join("\n\n")}\n`, "utf8");
try {
  const wrangler = fileURLToPath(new URL("../node_modules/wrangler/bin/wrangler.js", import.meta.url));
  const result = spawnSync(process.execPath, [wrangler, "d1", "execute", "portfolio-db", mode, "--file", path], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
  console.log(`Imported ${source.domains.length} domains and ${source.projects.length} projects into ${mode.slice(2)} D1.`);
} finally {
  await rm(path, { force: true });
}
