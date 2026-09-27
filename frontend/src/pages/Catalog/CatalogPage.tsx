import { Box, Typography, Stack } from "@mui/material";
import { RoomsTable } from "@/components/RoomsTable";
import { AssetsTable } from "@/components/AssetsTable";

/**
 * Экран "Каталог ресурсов" (см. Task_1.pdf, раздел "Интерфейс": первый из трёх экранов).
 * Показывает аудитории и единицы инвентаря отдельными таблицами.
 */
export function CatalogPage() {
  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>Аудитории</Typography>
        <RoomsTable />
      </Box>
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>Инвентарь</Typography>
        <AssetsTable />
      </Box>
    </Stack>
  );
}
