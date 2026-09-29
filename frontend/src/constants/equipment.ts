export interface EquipmentOption {
  key: string;
  label: string;
  bg: string;     // фон плашки
  fg: string;     // цвет текста
  border: string; // цвет рамки
}

/** Справочник оборудования аудиторий: у каждого вида свой цвет */
export const EQUIPMENT_OPTIONS: EquipmentOption[] = [
  { key: "projector",  label: "Проектор",   bg: "#e3f2fd", fg: "#1565c0", border: "#90caf9" },
  { key: "computers",  label: "Компьютеры", bg: "#f3e5f5", fg: "#6a1b9a", border: "#ce93d8" },
  { key: "board",      label: "Доска",      bg: "#e8f5e9", fg: "#2e7d32", border: "#a5d6a7" },
  { key: "microphone", label: "Микрофон",   bg: "#fff3e0", fg: "#e65100", border: "#ffcc80" },
  { key: "wifi",       label: "Wi-Fi",      bg: "#e0f2f1", fg: "#00695c", border: "#80cbc4" },
  { key: "speakers",   label: "Колонки",    bg: "#fce4ec", fg: "#ad1457", border: "#f48fb1" },
  { key: "camera",     label: "Камера",     bg: "#e8eaf6", fg: "#283593", border: "#9fa8da" },
  { key: "ac",         label: "Кондиционер", bg: "#e0f7fa", fg: "#006064", border: "#80deea" },
];

const FALLBACK: Omit<EquipmentOption, "key" | "label"> = { bg: "#f1f3f5", fg: "#495057", border: "#ced4da" };

export function getEquipmentOption(key: string): EquipmentOption {
  return EQUIPMENT_OPTIONS.find((o) => o.key === key) ?? { key, label: key, ...FALLBACK };
}
