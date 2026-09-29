import { db } from "./db.js";
import { getActiveResourceIds, deleteBookingsByResource } from "./bookings.repo.js";
import type { Room, RoomManualStatus, RoomStatus } from "../types/domain.js";

interface RoomRow {
  id: string; code: string; name: string; capacity: number; equipment: string; status: string;
}

/**
 * Итоговый статус аудитории:
 *  - "maintenance" — выставлен вручную, имеет приоритет;
 *  - "booked" — если прямо сейчас идёт бронь этой аудитории (вычисляется автоматически);
 *  - иначе "available". Как только бронь заканчивается, статус снова становится "available".
 */
function effectiveStatus(stored: string, id: string, activeIds: Set<string>): RoomStatus {
  if (stored === "maintenance") return "maintenance";
  return activeIds.has(id) ? "booked" : "available";
}

function rowToRoom(row: RoomRow, activeIds: Set<string>): Room {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    capacity: row.capacity,
    equipment: JSON.parse(row.equipment),
    status: effectiveStatus(row.status, row.id, activeIds),
  };
}

function getRow(id: string): RoomRow | undefined {
  return db.prepare("SELECT * FROM rooms WHERE id = ?").get(id) as RoomRow | undefined;
}

export function listRooms(): Room[] {
  const rows = db.prepare("SELECT * FROM rooms ORDER BY code").all() as RoomRow[];
  const active = getActiveResourceIds("room");
  return rows.map((r) => rowToRoom(r, active));
}

export function getRoom(id: string): Room | undefined {
  const row = getRow(id);
  return row ? rowToRoom(row, getActiveResourceIds("room")) : undefined;
}

export function roomIdExists(id: string): boolean {
  return getRow(id) !== undefined;
}

/** Есть ли другая аудитория с таким номером (excludeId — исключить саму себя при редактировании) */
export function roomCodeTaken(code: string, excludeId?: string): boolean {
  const row = db
    .prepare("SELECT id FROM rooms WHERE code = ? AND id <> ?")
    .get(code, excludeId ?? "") as { id: string } | undefined;
  return row !== undefined;
}

export interface RoomCreateData {
  id: string;
  code: string;
  name: string;
  capacity: number;
  equipment: string[];
  status: RoomManualStatus;
}

export function insertRoom(data: RoomCreateData): Room {
  db.prepare(
    `INSERT INTO rooms (id, code, name, capacity, equipment, status)
     VALUES (@id, @code, @name, @capacity, @equipment, @status)`
  ).run({ ...data, equipment: JSON.stringify(data.equipment) });
  return getRoom(data.id)!;
}

export type RoomPatch = Partial<Omit<RoomCreateData, "id">>;

export function updateRoom(id: string, patch: RoomPatch): Room | undefined {
  const row = getRow(id);
  if (!row) return undefined;

  // В БД хранится только ручной статус; устаревшее значение "booked" считаем "available"
  const currentManual: RoomManualStatus = row.status === "maintenance" ? "maintenance" : "available";

  db.prepare(
    `UPDATE rooms SET code=@code, name=@name, capacity=@capacity, equipment=@equipment, status=@status
     WHERE id=@id`
  ).run({
    id,
    code: patch.code ?? row.code,
    name: patch.name ?? row.name,
    capacity: patch.capacity ?? row.capacity,
    equipment: patch.equipment ? JSON.stringify(patch.equipment) : row.equipment,
    status: patch.status ?? currentManual,
  });
  return getRoom(id);
}

/** Удаляет аудиторию вместе с её бронями (в одной транзакции) */
export function deleteRoomWithBookings(id: string): void {
  db.transaction(() => {
    deleteBookingsByResource("room", id);
    db.prepare("DELETE FROM rooms WHERE id = ?").run(id);
  })();
}

/**
 * Полная замена таблицы аудиторий данными из файла (одна транзакция).
 * Аудитории, которых нет в файле, удаляются ВМЕСТЕ со своими бронями, чтобы не оставалось
 * броней на несуществующие ресурсы. Остальные — создаются или обновляются по id.
 */
export function replaceAllRooms(items: RoomCreateData[]): { imported: number; removed: number } {
  return db.transaction(() => {
    const keep = new Set(items.map((i) => i.id));
    const existing = db.prepare("SELECT id FROM rooms").all() as { id: string }[];
    let removed = 0;
    for (const r of existing) {
      if (keep.has(r.id)) continue;
      deleteBookingsByResource("room", r.id);
      db.prepare("DELETE FROM rooms WHERE id = ?").run(r.id);
      removed++;
    }
    const upsert = db.prepare(
      `INSERT INTO rooms (id, code, name, capacity, equipment, status)
       VALUES (@id, @code, @name, @capacity, @equipment, @status)
       ON CONFLICT(id) DO UPDATE SET code=@code, name=@name, capacity=@capacity, equipment=@equipment, status=@status`
    );
    for (const i of items) upsert.run({ ...i, equipment: JSON.stringify(i.equipment) });
    return { imported: items.length, removed };
  })();
}

export function upsertRoom(room: Room): void {
  db.prepare(
    `INSERT INTO rooms (id, code, name, capacity, equipment, status) VALUES (@id, @code, @name, @capacity, @equipment, @status)
     ON CONFLICT(id) DO UPDATE SET code=@code, name=@name, capacity=@capacity, equipment=@equipment, status=@status`
  ).run({ ...room, equipment: JSON.stringify(room.equipment) });
}
