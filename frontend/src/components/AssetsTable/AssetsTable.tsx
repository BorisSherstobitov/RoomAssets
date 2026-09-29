import { useCallback, useEffect, useRef, useState } from "react";
import {
  Paper, Table, TableHead, TableRow, TableCell, TableBody, Chip, CircularProgress, Box, Typography,
  IconButton, Stack,
} from "@mui/material";
import { EditOutlined, DeleteOutline } from "@mui/icons-material";
import axios from "axios";
import {
  fetchAssets, createAsset, updateAsset, deleteAsset, type AssetDto, type AssetInput,
} from "@/api/assetsApi";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { getErrorMessage } from "@/utils/errors";
import { AssetFormDialog } from "./AssetFormDialog";

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

// Статус "Используется" вычисляется на backend по текущему времени, поэтому периодически
// перезапрашиваем список: когда бронь закончится, статус сам вернётся в "Доступен".
const REFRESH_MS = 30_000;

export function AssetsTable() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AssetDto[]>([]);

  const [dialog, setDialog] = useState<{ asset?: AssetDto } | null>(null);
  const [toDelete, setToDelete] = useState<{ asset: AssetDto; bookingsCount?: number } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const reload = useCallback(async (silent = false) => {
    try {
      const data = await fetchAssets(1);
      if (!mounted.current) return;
      setItems(data.items);
      setError(null);
    } catch (e) {
      // при фоновом обновлении не затираем уже показанные данные
      if (mounted.current && !silent) setError((e as Error).message || "Ошибка загрузки");
    } finally {
      if (mounted.current && !silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    const timer = setInterval(() => reload(true), REFRESH_MS);
    return () => clearInterval(timer);
  }, [reload]);

  async function handleSave(input: AssetInput) {
    if (dialog?.asset) {
      await updateAsset(dialog.asset.id, input);
    } else {
      await createAsset(input);
    }
    setDialog(null);
    await reload(true);
  }

  async function handleConfirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      // Если бронь уже была найдена (bookingsCount задан) — пользователь подтвердил каскадное удаление
      await deleteAsset(toDelete.asset.id, toDelete.bookingsCount !== undefined);
      setToDelete(null);
      await reload(true);
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 409 && e.response.data?.error === "HAS_BOOKINGS") {
        // у оборудования есть брони — просим подтвердить удаление вместе с ними
        setToDelete({ asset: toDelete.asset, bookingsCount: e.response.data.bookingsCount as number });
      } else if (axios.isAxiosError(e) && e.response?.status === 404) {
        setToDelete(null);
        await reload(true);
      } else {
        setDeleteError(getErrorMessage(e, "Не удалось удалить оборудование"));
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h6">Инвентарь</Typography>
        <Button onClick={() => setDialog({})}>+ Новое оборудование</Button>
      </Stack>

      {loading ? (
        <Box sx={{ p: 3, display: "grid", placeItems: "center" }}><CircularProgress /></Box>
      ) : error ? (
        <Box sx={{ p: 3 }}><Typography color="error">Не удалось загрузить данные: {error}</Typography></Box>
      ) : (
        <Paper elevation={0} sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid #eef0f3" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={120}>Инв. номер</TableCell>
                <TableCell>Название</TableCell>
                <TableCell width={170}>Статус</TableCell>
                <TableCell width={120} align="center">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell sx={{ color: "text.secondary" }}>{a.inventoryCode}</TableCell>
                  <TableCell>{a.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={STATUS_LABEL[a.status]}
                      size="small"
                      color={STATUS_COLOR[a.status]}
                      variant={a.status === "maintenance" ? "outlined" : "filled"}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" title="Редактировать" onClick={() => setDialog({ asset: a })}>
                      <EditOutlined fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      title="Удалить"
                      onClick={() => { setDeleteError(null); setToDelete({ asset: a }); }}
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography color="text.secondary" sx={{ py: 2 }}>Оборудования пока нет</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      {dialog && (
        <AssetFormDialog initial={dialog.asset} onClose={() => setDialog(null)} onSubmit={handleSave} />
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Удаление оборудования"
        message={
          toDelete?.bookingsCount !== undefined
            ? `У оборудования «${toDelete.asset.inventoryCode} — ${toDelete.asset.name}» есть брони (${toDelete.bookingsCount}). Они будут удалены вместе с ним. Продолжить?`
            : `Удалить оборудование «${toDelete?.asset.inventoryCode} — ${toDelete?.asset.name}»?`
        }
        loading={deleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
