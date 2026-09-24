-- Extends projects with concise case-study metadata while retaining reusable sections.
ALTER TABLE projects ADD COLUMN overview TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN lifecycle TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN role TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN team_size TEXT;

ALTER TABLE project_visuals ADD COLUMN featured INTEGER NOT NULL DEFAULT 0;
ALTER TABLE project_visuals ADD COLUMN poster_url TEXT;
ALTER TABLE project_visuals ADD COLUMN provider TEXT;

CREATE TABLE IF NOT EXISTS project_case_study_items (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  item_kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  meta TEXT,
  display_order INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_case_study_items_project_kind
  ON project_case_study_items(project_id, item_kind, display_order);

PRAGMA optimize;
