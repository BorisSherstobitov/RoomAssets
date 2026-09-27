import type { Booking } from "../types/domain.js";

interface Interval {
  start: string;
  end: string;
}

function intervalsOverlap(a: Interval, b: Interval): boolean {
  return new Date(a.start) < new Date(b.end) && new Date(b.start) < new Date(a.end);
}

/**
 * Возвращает брони того же ресурса, пересекающиеся с заданным интервалом.
 * excludeId — исключить саму бронь при редактировании.
 */
export function findOverlappingBookings(
  bookings: Booking[],
  candidate: Pick<Booking, "resourceType" | "resourceId" | "start" | "end">,
  excludeId?: string
): Booking[] {
  return bookings.filter(
    (b) =>
      b.id !== excludeId &&
      b.resourceType === candidate.resourceType &&
      b.resourceId === candidate.resourceId &&
      intervalsOverlap(b, candidate)
  );
}
