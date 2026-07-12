export const SCHEMA_VERSION = 1

export const INITIAL_SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  pack_type TEXT NOT NULL,
  description TEXT,
  deadline TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS controls (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  status TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  owner TEXT,
  notes TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS evidence_items (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  status TEXT NOT NULL,
  owner TEXT,
  evidence_date TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS evidence_files (
  id TEXT PRIMARY KEY,
  evidence_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  local_path TEXT NOT NULL,
  FOREIGN KEY (evidence_id) REFERENCES evidence_items(id)
);

CREATE TABLE IF NOT EXISTS evidence_control_links (
  evidence_id TEXT NOT NULL,
  control_id TEXT NOT NULL,
  PRIMARY KEY (evidence_id, control_id),
  FOREIGN KEY (evidence_id) REFERENCES evidence_items(id),
  FOREIGN KEY (control_id) REFERENCES controls(id)
);

CREATE TABLE IF NOT EXISTS risks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL,
  related_control_id TEXT,
  recommendation TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS report_sections (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  position INTEGER NOT NULL,
  included INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS exports (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  export_type TEXT NOT NULL,
  local_path TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
`
