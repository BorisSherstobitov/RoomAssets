import { Box, Stack } from "@mui/material";
import { RoomsTable } from "@/components/RoomsTable";
import { AssetsTable } from "@/components/AssetsTable";

/**
 * Экран "Каталог ресурсов" (см. Task_1.pdf, раздел "Интерфейс": первый из трёх экранов).
 * Показывает аудитории и единицы инвентаря отдельными таблицами.
 * Заголовок секции и кнопка создания ("Новая аудитория" / "Новое оборудование")
 * находятся внутри самих таблиц.
 */
export function CatalogPage() {
  return (
    <Stack spacing={4}>
      <Box>
        <RoomsTable />
      </Box>
      <Box>
        <AssetsTable />
      </Box>
    </Stack>
  );
}
