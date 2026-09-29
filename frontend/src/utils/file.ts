/** Скачивает данные как JSON-файл */
export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Читает выбранный JSON-файл и достаёт из него список по ключу (например, "rooms").
 * Принимает и отдельный файл таблицы ({ "rooms": [...] } или просто [...]),
 * и общий файл из "Управление бронированием" ({ rooms, assets, bookings }).
 */
export async function readListFromJsonFile<T>(file: File, key: string): Promise<T[]> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error("Файл не является корректным JSON");
  }
  const list = Array.isArray(parsed) ? parsed : (parsed as Record<string, unknown> | null)?.[key];
  if (!Array.isArray(list)) {
    throw new Error(`В файле не найден список «${key}»`);
  }
  return list as T[];
}