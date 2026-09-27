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
