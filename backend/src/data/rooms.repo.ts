import { db } from "./db.js";
import type { Room } from "../types/domain.js";

interface RoomRow {
  id: string; code: string; name: string; capacity: number; equipment: string; status: string;
}

function rowToRoom(row: RoomRow): Room {
  return { ...row, equipment: JSON.parse(row.equipment), status: row.status as Room["status"] };
}

export function listRooms(): Room[] {
  const rows = db.prepare("SELECT * FROM rooms ORDER BY code").all() as RoomRow[];
  return rows.map(rowToRoom);
}

export function upsertRoom(room: Room): void {
  db.prepare(
    `INSERT INTO rooms (id, code, name, capacity, equipment, status) VALUES (@id, @code, @name, @capacity, @equipment, @status)
     ON CONFLICT(id) DO UPDATE SET code=@code, name=@name, capacity=@capacity, equipment=@equipment, status=@status`
  ).run({ ...room, equipment: JSON.stringify(room.equipment) });
}
