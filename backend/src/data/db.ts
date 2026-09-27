import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

// Render имеет эфемерную файловую систему без явного Persistent Disk — по умолчанию
// БД лежит рядом с исходниками. Путь можно переопределить через DB_PATH (например,
// смонтированный Render Disk: /data/room-assets.db).
const DB_PATH = process.env.DB_PATH ?? path.resolve(process.cwd(), "data", "room-assets.db");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL"); // безопаснее при параллельных запросах

db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    equipment TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'available'
  );

  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    inventoryCode TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'available'
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    resourceType TEXT NOT NULL,
    resourceId TEXT NOT NULL,
    title TEXT NOT NULL,
    start TEXT NOT NULL,
    end TEXT NOT NULL,
    notes TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_bookings_resource ON bookings(resourceType, resourceId);
`);
