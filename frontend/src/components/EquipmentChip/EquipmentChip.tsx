import { Chip } from "@mui/material";
import { getEquipmentOption } from "@/constants/equipment";

interface EquipmentChipProps {
  equipmentKey: string;
  /** false — "выключенная" серая плашка (для формы выбора оборудования) */
  selected?: boolean;
  onClick?: () => void;
}

/** Цветная плашка оборудования (Проектор, Компьютеры, Доска и т.д.) */
export function EquipmentChip({ equipmentKey, selected = true, onClick }: EquipmentChipProps) {
  const o = getEquipmentOption(equipmentKey);

  return (
    <Chip
      size="small"
      label={o.label}
      onClick={onClick}
      sx={
        selected
          ? {
              bgcolor: o.bg,
              color: o.fg,
              border: `1px solid ${o.border}`,
              fontWeight: 600,
              "&&:hover": { bgcolor: o.bg, filter: "brightness(0.97)" },
            }
          : {
              bgcolor: "transparent",
              color: "text.secondary",
              border: "1px dashed #c5cad3",
              "&&:hover": { bgcolor: "#f5f6f8" },
            }
      }
    />
  );
}
