import { db } from "./db.js";
import { getActiveResourceIds, deleteBookingsByResource } from "./bookings.repo.js";
import type { Asset, AssetManualStatus, AssetStatus } from "../types/domain.js";

interface AssetRow {
  id: string; name: string; inventoryCode: string; status: string;
}

/**
 * Итоговый статус инвентаря:
 *  - "maintenance" — выставлен вручную, имеет приоритет;
 *  - "in_use" — если прямо сейчас идёт бронь этого инвентаря (вычисляется автоматически);
 *  - иначе "available". Как только бронь заканчивается, статус снова становится "available".
 */
function effectiveStatus(stored: string, id: string, activeIds: Set<string>): AssetStatus {
  if (stored === "maintenance") return "maintenance";
  return activeIds.has(id) ? "in_use" : "available";
}

function rowToAsset(row: AssetRow, activeIds: Set<string>): Asset {
  return {
    id: row.id,
    name: row.name,
    inventoryCode: row.inventoryCode,
    status: effectiveStatus(row.status, row.id, activeIds),
  };
}

function getRow(id: string): AssetRow | undefined {
  return db.prepare("SELECT * FROM assets WHERE id = ?").get(id) as AssetRow | undefined;
}

export function listAssets(): Asset[] {
  const rows = db.prepare("SELECT * FROM assets ORDER BY inventoryCode").all() as AssetRow[];
  const active = getActiveResourceIds("asset");
  return rows.map((r) => rowToAsset(r, active));
}

export function getAsset(id: string): Asset | undefined {
  const row = getRow(id);
  return row ? rowToAsset(row, getActiveResourceIds("asset")) : undefined;
}

export function assetIdExists(id: string): boolean {
  return getRow(id) !== undefined;
}

/** Есть ли другая единица инвентаря с таким инв. номером */
export function inventoryCodeTaken(code: string, excludeId?: string): boolean {
  const row = db
    .prepare("SELECT id FROM assets WHERE inventoryCode = ? AND id <> ?")
    .get(code, excludeId ?? "") as { id: string } | undefined;
  return row !== undefined;
}

export interface AssetCreateData {
  id: string;
  name: string;
  inventoryCode: string;
  status: AssetManualStatus;
}

export function insertAsset(data: AssetCreateData): Asset {
  db.prepare(
    `INSERT INTO assets (id, name, inventoryCode, status) VALUES (@id, @name, @inventoryCode, @status)`
  ).run(data);
  return getAsset(data.id)!;
}

export type AssetPatch = Partial<Omit<AssetCreateData, "id">>;

export function updateAsset(id: string, patch: AssetPatch): Asset | undefined {
  const row = getRow(id);
  if (!row) return undefined;

  // В БД хранится только ручной статус; устаревшее значение "in_use" считаем "available"
  const currentManual: AssetManualStatus = row.status === "maintenance" ? "maintenance" : "available";

  db.prepare(
    `UPDATE assets SET name=@name, inventoryCode=@inventoryCode, status=@status WHERE id=@id`
  ).run({
    id,
    name: patch.name ?? row.name,
    inventoryCode: patch.inventoryCode ?? row.inventoryCode,
    status: patch.status ?? currentManual,
  });
  return getAsset(id);
}

/** Удаляет единицу инвентаря вместе с её бронями (в одной транзакции) */
export function deleteAssetWithBookings(id: string): void {
  db.transaction(() => {
    deleteBookingsByResource("asset", id);
    db.prepare("DELETE FROM assets WHERE id = ?").run(id);
  })();
}

export function upsertAsset(asset: Asset): void {
  db.prepare(
    `INSERT INTO assets (id, name, inventoryCode, status) VALUES (@id, @name, @inventoryCode, @status)
     ON CONFLICT(id) DO UPDATE SET name=@name, inventoryCode=@inventoryCode, status=@status`
  ).run(asset);
}
