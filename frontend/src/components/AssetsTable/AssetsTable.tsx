import { useEffect, useState } from "react";
import { Paper, Table, TableHead, TableRow, TableCell, TableBody, Chip, CircularProgress, Box, Typography } from "@mui/material";
import { fetchAssets, type AssetDto } from "@/api/assetsApi";

const STATUS_LABEL: Record<AssetDto["status"], string> = {
  available: "Доступен",
  in_use: "Используется",
  maintenance: "На обслуживании",
};

const STATUS_COLOR: Record<AssetDto["status"], "success" | "warning" | "default"> = {
  available: "success",
  in_use: "warning",
  maintenance: "default",
};

export function AssetsTable() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AssetDto[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchAssets(1);
        if (mounted) setItems(data.items);
      } catch (e) {
        if (mounted) setError((e as Error).message || "Ошибка загрузки");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <Box sx={{ p: 3, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 3 }}><Typography color="error">Не удалось загрузить данные: {error}</Typography></Box>;

  return (
    <Paper elevation={0} sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid #eef0f3" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell width={120}>Инв. номер</TableCell>
            <TableCell>Название</TableCell>
            <TableCell width={170}>Статус</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((a) => (
            <TableRow key={a.id} hover>
              <TableCell sx={{ color: "text.secondary" }}>{a.inventoryCode}</TableCell>
              <TableCell>{a.name}</TableCell>
              <TableCell>
                <Chip label={STATUS_LABEL[a.status]} size="small" color={STATUS_COLOR[a.status]} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
