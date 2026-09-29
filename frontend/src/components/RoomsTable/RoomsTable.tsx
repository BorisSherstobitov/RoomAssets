import { useCallback, useEffect, useRef, useState } from "react";
import {
  Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, CircularProgress, Box, IconButton, Stack, Typography
} from "@mui/material";
import { EditOutlined, DeleteOutline, Groups2Outlined } from "@mui/icons-material";
import axios from "axios";
import {
  fetchRooms, createRoom, updateRoom, deleteRoom, type RoomDto, type RoomInput,
} from "@/api/roomsApi";
import { Button } from "@/components/Button";
import { EquipmentChip } from "@/components/EquipmentChip";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { getErrorMessage } from "@/utils/errors";
import { RoomFormDialog } from "./RoomFormDialog";

const STATUS_LABEL: Record<RoomDto["status"], string> = {
  available: "Доступна",
  booked: "Забронирована",
  maintenance: "На обслуживании",
};

const STATUS_COLOR: Record<RoomDto["status"], "success" | "warning" | "default"> = {
  available: "success",
  booked: "warning",
  maintenance: "default",
};

// Статус "Забронирована" вычисляется на backend по текущему времени, поэтому периодически
// перезапрашиваем список: когда бронь закончится, статус сам вернётся в "Доступна".
const REFRESH_MS = 30_000;

export function RoomsTable() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<RoomDto[]>([]);

  const [dialog, setDialog] = useState<{ room?: RoomDto } | null>(null);
  const [toDelete, setToDelete] = useState<{ room: RoomDto; bookingsCount?: number } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const reload = useCallback(async (silent = false) => {
    try {
      const data = await fetchRooms(1);
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

  async function handleSave(input: RoomInput) {
    if (dialog?.room) {
      await updateRoom(dialog.room.id, input);
    } else {
      await createRoom(input);
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
      await deleteRoom(toDelete.room.id, toDelete.bookingsCount !== undefined);
      setToDelete(null);
      await reload(true);
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 409 && e.response.data?.error === "HAS_BOOKINGS") {
        // у аудитории есть брони — просим подтвердить удаление вместе с ними
        setToDelete({ room: toDelete.room, bookingsCount: e.response.data.bookingsCount as number });
      } else if (axios.isAxiosError(e) && e.response?.status === 404) {
        setToDelete(null);
        await reload(true);
      } else {
        setDeleteError(getErrorMessage(e, "Не удалось удалить аудиторию"));
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h6">Аудитории</Typography>
        <Button onClick={() => setDialog({})}>+ Новая аудитория</Button>
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
                <TableCell width={100}>Номер</TableCell>
                <TableCell>Название</TableCell>
                <TableCell width={160} align="right">Вместимость</TableCell>
                <TableCell>Оборудование</TableCell>
                <TableCell width={170}>Статус</TableCell>
                <TableCell width={120} align="center">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell sx={{ color: "text.secondary" }}>{r.code}</TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography fontWeight={600}>{r.name}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                      <Groups2Outlined fontSize="small" />
                      <span>{r.capacity}</span>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      {r.equipment.map((k) => <EquipmentChip key={k} equipmentKey={k} />)}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={STATUS_LABEL[r.status]}
                      size="small"
                      color={STATUS_COLOR[r.status]}
                      variant={r.status === "maintenance" ? "outlined" : "filled"}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" title="Редактировать" onClick={() => setDialog({ room: r })}>
                      <EditOutlined fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      title="Удалить"
                      onClick={() => { setDeleteError(null); setToDelete({ room: r }); }}
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography color="text.secondary" sx={{ py: 2 }}>Аудиторий пока нет</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      {dialog && (
        <RoomFormDialog initial={dialog.room} onClose={() => setDialog(null)} onSubmit={handleSave} />
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Удаление аудитории"
        message={
          toDelete?.bookingsCount !== undefined
            ? `У аудитории «${toDelete.room.code} — ${toDelete.room.name}» есть брони (${toDelete.bookingsCount}). Они будут удалены вместе с ней. Продолжить?`
            : `Удалить аудиторию «${toDelete?.room.code} — ${toDelete?.room.name}»?`
        }
        loading={deleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
