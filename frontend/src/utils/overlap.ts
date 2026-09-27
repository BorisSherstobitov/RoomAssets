import type { BookingDto } from "@/api/bookingsApi";

interface Interval {
  start: string; // ISO
  end: string;   // ISO
}

/** Пересекаются ли два интервала [start, end) */
function intervalsOverlap(a: Interval, b: Interval): boolean {
  return new Date(a.start) < new Date(b.end) && new Date(b.start) < new Date(a.end);
}

/**
 * Находит брони того же ресурса, пересекающиеся с заданным интервалом.
 * excludeId — используется при редактировании, чтобы бронь не конфликтовала сама с собой.
 */
export function findOverlappingBookings(
  bookings: BookingDto[],
  candidate: { resourceType: BookingDto["resourceType"]; resourceId: string; start: string; end: string },
  excludeId?: string
): BookingDto[] {
  return bookings.filter(
    (b) =>
      b.id !== excludeId &&
      b.resourceType === candidate.resourceType &&
      b.resourceId === candidate.resourceId &&
      intervalsOverlap(b, candidate)
  );
}
