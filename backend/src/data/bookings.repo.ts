import { db } from "./db.js";
import type { Booking } from "../types/domain.js";

export interface BookingFilters {
  q?: string;
  /** YYYY-MM-DD, сутки по UTC (оставлено для обратной совместимости) */
  date?: string;
  /** Начало периода (ISO). Возвращаются брони, которые ПЕРЕСЕКАЮТ период [from, to) */
  from?: string;
  /** Конец периода (ISO, не включительно) */
  to?: string;
  resourceType?: Booking["resourceType"];
  resourceId?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function listBookings(filters: BookingFilters = {}): Booking[] {
  const clauses: string[] = [];
  const params: Record<string, string> = {};

  if (filters.resourceType) {
    clauses.push("resourceType = @resourceType");
    params.resourceType = filters.resourceType;
  }
  if (filters.resourceId) {
    clauses.push("resourceId = @resourceId");
    params.resourceId = filters.resourceId;
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  let items = db.prepare(`SELECT * FROM bookings ${where} ORDER BY start`).all(params) as Booking[];

  // ПОИСК ПО ТЕКСТУ делаем в JS, а не в SQL: встроенные LOWER()/LIKE в SQLite приводят
  // к нижнему регистру только ASCII, поэтому "семинар" не находил "Семинар" (кириллица).
  const needle = filters.q?.trim().toLocaleLowerCase("ru");
  if (needle) {
    items = items.filter(
      (b) =>
        b.title.toLocaleLowerCase("ru").includes(needle) ||
        (b.notes ?? "").toLocaleLowerCase("ru").includes(needle)
    );
  }

  // ПОИСК ПО ДАТЕ: бронь попадает в выдачу, если она ПЕРЕСЕКАЕТ выбранный период
  // (а не только если начинается в этот день).
  let rangeStart: number | undefined;
  let rangeEnd: number | undefined;

  if (filters.from || filters.to) {
    const f = filters.from ? Date.parse(filters.from) : NaN;
    const t = filters.to ? Date.parse(filters.to) : NaN;
    if (!Number.isNaN(f)) rangeStart = f;
    if (!Number.isNaN(t)) rangeEnd = t;
  } else if (filters.date && /^\d{4}-\d{2}-\d{2}$/.test(filters.date)) {
    const d = Date.parse(`${filters.date}T00:00:00.000Z`);
    if (!Number.isNaN(d)) {
      rangeStart = d;
      rangeEnd = d + DAY_MS;
    }
  }

  if (rangeStart !== undefined || rangeEnd !== undefined) {
    items = items.filter((b) => {
      const bs = Date.parse(b.start);
      const be = Date.parse(b.end);
      if (rangeEnd !== undefined && !(bs < rangeEnd)) return false;
      if (rangeStart !== undefined && !(be > rangeStart)) return false;
      return true;
    });
  }

  return items;
}

export function getBooking(id: string): Booking | undefined {
  return db.prepare("SELECT * FROM bookings WHERE id = ?").get(id) as Booking | undefined;
}

export function insertBooking(booking: Booking): void {
  db.prepare(
    `INSERT INTO bookings (id, resourceType, resourceId, title, start, end, notes)
     VALUES (@id, @resourceType, @resourceId, @title, @start, @end, @notes)`
  ).run({ ...booking, notes: booking.notes ?? null });
}

export function updateBookingById(id: string, patch: Partial<Omit<Booking, "id">>): Booking | undefined {
  const current = getBooking(id);
  if (!current) return undefined;
  const next: Booking = { ...current, ...patch, id };
  db.prepare(
    `UPDATE bookings SET resourceType=@resourceType, resourceId=@resourceId, title=@title,
     start=@start, end=@end, notes=@notes WHERE id=@id`
  ).run({ ...next, notes: next.notes ?? null });
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
    for (const b of items) insert.run({ ...b, notes: b.notes ?? null });
  });
  tx(bookings);
}

/** id ресурсов заданного типа, у которых ПРЯМО СЕЙЧАС идёт бронь (start <= now < end) */
export function getActiveResourceIds(resourceType: Booking["resourceType"], now: number = Date.now()): Set<string> {
  const rows = db
    .prepare("SELECT resourceId, start, end FROM bookings WHERE resourceType = ?")
    .all(resourceType) as Pick<Booking, "resourceId" | "start" | "end">[];
  const active = new Set<string>();
  for (const r of rows) {
    if (Date.parse(r.start) <= now && now < Date.parse(r.end)) active.add(r.resourceId);
  }
  return active;
}

export function countBookingsByResource(resourceType: Booking["resourceType"], resourceId: string): number {
  const row = db
    .prepare("SELECT COUNT(*) AS c FROM bookings WHERE resourceType = ? AND resourceId = ?")
    .get(resourceType, resourceId) as { c: number };
  return row.c;
}

export function deleteBookingsByResource(resourceType: Booking["resourceType"], resourceId: string): void {
  db.prepare("DELETE FROM bookings WHERE resourceType = ? AND resourceId = ?").run(resourceType, resourceId);
}
