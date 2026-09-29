import { formatISO, parseISO, format } from "date-fns";

/** Текущее время в UTC, формат RFC 3339 (для отправки на backend) */
export function nowUtcIso(): string {
  return formatISO(new Date());
}

/** ISO(UTC) -> Date для использования в <input type="datetime-local"> (локальное время) */
export function isoToLocalInputValue(iso: string): string {
  const d = parseISO(iso);
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

/** значение из <input type="datetime-local"> (локальное время) -> ISO строка в UTC */
export function localInputValueToIso(local: string): string {
  return new Date(local).toISOString();
}

/** Человекочитаемое отображение в локальной таймзоне пользователя */
export function formatLocal(iso: string): string {
  return format(parseISO(iso), "dd.MM.yyyy HH:mm");
}

/**
 * Границы календарных суток в ЛОКАЛЬНОЙ таймзоне пользователя (для значения из <input type="date">)
 * в виде ISO(UTC): [from, to). Backend вернёт все брони, пересекающие этот период.
 */
export function localDayRangeIso(date: string): { from: string; to: string } | null {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return null;
  return {
    from: new Date(y, m - 1, d).toISOString(),
    to: new Date(y, m - 1, d + 1).toISOString(),
  };
}
