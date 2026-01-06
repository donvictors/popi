import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "backend", "data");
const dbPath = path.join(dataDir, "popi.db");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    toilet_id TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    status TEXT NOT NULL,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_reports_toilet ON reports(toilet_id);
`);

export function saveReport({ toilet_id, lat, lng, status, comment }) {
  const stmt = db.prepare(
    `INSERT INTO reports (toilet_id, lat, lng, status, comment) VALUES (@toilet_id, @lat, @lng, @status, @comment)`
  );
  const info = stmt.run({ toilet_id, lat, lng, status, comment });
  return { id: info.lastInsertRowid };
}

export function fetchLatestReport(toilet_id) {
  const stmt = db.prepare(
    `SELECT * FROM reports WHERE toilet_id = ? ORDER BY created_at DESC LIMIT 1`
  );
  return stmt.get(toilet_id);
}

export function fetchReports(toilet_id, limit = 5) {
  const stmt = db.prepare(
    `SELECT * FROM reports WHERE toilet_id = ? ORDER BY created_at DESC LIMIT ?`
  );
  return stmt.all(toilet_id, limit);
}

export { dbPath };
