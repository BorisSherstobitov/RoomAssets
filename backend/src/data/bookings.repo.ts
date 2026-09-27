import { db } from "./db.js";
import type { Booking } from "../types/domain.js";

export interface BookingFilters {
  q?: string;
  date?: string; // YYYY-MM-DD
  resourceType?: Booking["resourceType"];
  resourceId?: string;
}

export function listBookings(filters: BookingFilters = {}): Booking[] {
  const clauses: string[] = [];
  const params: Record<string, string> = {};

  if (filters.q) {
    clauses.push("(LOWER(title) LIKE @q OR LOWER(COALESCE(notes,'')) LIKE @q)");
    params.q = `%${filters.q.toLowerCase()}%`;
  }
  if (filters.date) {
    clauses.push("substr(start, 1, 10) = @date");
    params.date = filters.date;
  }
  if (filters.resourceType) {
    clauses.push("resourceType = @resourceType");
    params.resourceType = filters.resourceType;
  }
  if (filters.resourceId) {
    clauses.push("resourceId = @resourceId");
    params.resourceId = filters.resourceId;
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return db.prepare(`SELECT * FROM bookings ${where} ORDER BY start`).all(params) as Booking[];
}

export function getBooking(id: string): Booking | undefined {
  return db.prepare("SELECT * FROM bookings WHERE id = ?").get(id) as Booking | undefined;
}

export function insertBooking(booking: Booking): void {
  db.prepare(
    `INSERT INTO bookings (id, resourceType, resourceId, title, start, end, notes)
     VALUES (@id, @resourceType, @resourceId, @title, @start, @end, @notes)`
  ).run(booking);
}

export function updateBookingById(id: string, patch: Partial<Omit<Booking, "id">>): Booking | undefined {
  const current = getBooking(id);
  if (!current) return undefined;
  const next: Booking = { ...current, ...patch, id };
  db.prepare(
    `UPDATE bookings SET resourceType=@resourceType, resourceId=@resourceId, title=@title,
     start=@start, end=@end, notes=@notes WHERE id=@id`
  ).run(next);
  return next;
}

export function deleteBookingById(id: string): void {
  db.prepare("DELETE FROM bookings WHERE id = ?").run(id);
}

export function replaceAllBookings(bookings: Booking[]): void {
  const tx = db.transaction((items: Booking[]) => {
    db.prepare("DELETE FROM bookings").run();
    const insert = db.prepare(
      `INSERT INTO bookings (id, resourceType, resourceId, title, start, end, notes)
       VALUES (@id, @resourceType, @resourceId, @title, @start, @end, @notes)`
    );
    for (const b of items) insert.run(b);
  });
  tx(bookings);
}
