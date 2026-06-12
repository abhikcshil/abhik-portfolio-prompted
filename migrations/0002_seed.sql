INSERT INTO domains (id, slug, name, label, description, color_key, color_primary, color_secondary, orbit_order, enabled, visibility)
VALUES
  ('domain-software', 'software', 'Software', 'Software', 'Full-stack systems, Cloudflare-native apps, and product engineering.', 'software', '#38bdf8', '#2563eb', 1, 1, 'public'),
  ('domain-hardware', 'hardware', 'Hardware', 'Hardware', 'Embedded experiments, circuits, physical interfaces, and systems thinking.', 'hardware', '#2dd4bf', '#16a34a', 2, 1, 'public'),
  ('domain-music', 'music', 'Music', 'Music', 'Composition, production, sonic sketches, and performance tools.', 'music', '#fb923c', '#ef4444', 3, 1, 'public'),
  ('domain-visuals', 'visuals', 'Visuals', 'Visuals', 'Motion, graphics, interactive interfaces, and visual systems.', 'visuals', '#c084fc', '#7c3aed', 4, 1, 'public')
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
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO projects (id, slug, title, short_description, description, status, visibility, enabled, archived, featured, start_date)
VALUES
  ('project-orbital-portfolio', 'orbital-portfolio', 'Orbital Portfolio', 'A deterministic solar-system interface for exploring domains and projects.', 'A personal portfolio rebuilt as an interactive orbital map, with domains as planets and projects as moons.', 'Building', 'public', 1, 0, 1, '2026-05-01'),
  ('project-acs-studios-registry', 'acs-studios-registry', 'ACS Studios Registry', 'A planned registry entry for the ACS Studios ecosystem.', 'A registry-facing representation of the portfolio as an active ACS Studios property.', 'Building', 'public', 1, 0, 0, NULL),
  ('project-signal-sketches', 'signal-sketches', 'Signal Sketches', 'A cross-domain collection of audio and visual interaction studies.', 'Small studies that connect sound design, generative visuals, and interface controls.', 'Exploring', 'public', 1, 0, 0, NULL)
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
  updated_at = CURRENT_TIMESTAMP;

DELETE FROM project_domain_placements;
DELETE FROM project_tech_stack;
DELETE FROM project_highlights;
DELETE FROM project_links;
DELETE FROM project_sections;
DELETE FROM project_visuals;

INSERT INTO project_domain_placements (id, project_id, domain_id, placement_order)
VALUES
  ('placement-orbital-software', 'project-orbital-portfolio', 'domain-software', 1),
  ('placement-orbital-visuals', 'project-orbital-portfolio', 'domain-visuals', 2),
  ('placement-registry-software', 'project-acs-studios-registry', 'domain-software', 2),
  ('placement-registry-hardware', 'project-acs-studios-registry', 'domain-hardware', 3),
  ('placement-signal-music', 'project-signal-sketches', 'domain-music', 1),
  ('placement-signal-visuals', 'project-signal-sketches', 'domain-visuals', 1),
  ('placement-signal-hardware', 'project-signal-sketches', 'domain-hardware', 2);

INSERT INTO project_tech_stack (id, project_id, name, display_order)
VALUES
  ('tech-orbital-react', 'project-orbital-portfolio', 'React', 1),
  ('tech-orbital-ts', 'project-orbital-portfolio', 'TypeScript', 2),
  ('tech-orbital-workers', 'project-orbital-portfolio', 'Cloudflare Workers', 3),
  ('tech-registry-workers', 'project-acs-studios-registry', 'Workers', 1),
  ('tech-registry-modeling', 'project-acs-studios-registry', 'Content Modeling', 2),
  ('tech-signal-audio', 'project-signal-sketches', 'Web Audio', 1),
  ('tech-signal-canvas', 'project-signal-sketches', 'Canvas', 2);

INSERT INTO project_highlights (id, project_id, text, display_order)
VALUES
  ('highlight-orbital-deterministic', 'project-orbital-portfolio', 'Deterministic orbital positioning without render-time randomness.', 1),
  ('highlight-orbital-d1', 'project-orbital-portfolio', 'D1-backed public API with static TypeScript fallback data.', 2),
  ('highlight-registry-domain', 'project-acs-studios-registry', 'Tracks Portfolio as portfolio.acsstudios.co.', 1),
  ('highlight-signal-music', 'project-signal-sketches', 'Uses music as an interaction material.', 1);

INSERT INTO project_links (id, project_id, label, url, link_type, display_order)
VALUES
  ('link-orbital-portfolio', 'project-orbital-portfolio', 'Portfolio', 'https://portfolio.acsstudios.co', 'demo', 1);

INSERT INTO project_sections (id, project_id, heading, body, display_order)
VALUES
  ('section-orbital-intent', 'project-orbital-portfolio', 'Intent', 'The interface keeps the portfolio exploratory while making project data editable through a Cloudflare-native backend.', 1),
  ('section-registry-ecosystem', 'project-acs-studios-registry', 'Ecosystem', 'The portfolio is designed to become a small but coherent member of the broader ACS Studios surface area.', 1),
  ('section-signal-approach', 'project-signal-sketches', 'Approach', 'Each sketch focuses on one expressive interaction and keeps the implementation portable.', 1);
