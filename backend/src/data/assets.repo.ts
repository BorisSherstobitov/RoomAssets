import { db } from "./db.js";
import type { Asset } from "../types/domain.js";

export function listAssets(): Asset[] {
  return db.prepare("SELECT * FROM assets ORDER BY inventoryCode").all() as Asset[];
}

export function upsertAsset(asset: Asset): void {
  db.prepare(
    `INSERT INTO assets (id, name, inventoryCode, status) VALUES (@id, @name, @inventoryCode, @status)
     ON CONFLICT(id) DO UPDATE SET name=@name, inventoryCode=@inventoryCode, status=@status`
  ).run(asset);
}
