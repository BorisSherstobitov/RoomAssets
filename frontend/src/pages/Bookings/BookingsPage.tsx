import { useEffect, useRef, useState } from "react";
import {
  Box, Stack, TextField, MenuItem, Table, TableHead, TableRow, TableCell, TableBody,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, Typography, Chip,
} from "@mui/material";
import { EditOutlined, DeleteOutline } from "@mui/icons-material";
import { Button } from "@/components/Button";
import { BookingForm } from "@/components/BookingForm";
import { useBookingsStore } from "@/store/bookings.store";
import { fetchRooms } from "@/api/roomsApi";
import { fetchAssets } from "@/api/assetsApi";
import { formatLocal, localDayRangeIso } from "@/utils/date";
import type { BookingDto, ResourceType } from "@/api/bookingsApi";

/**
 * Экраны "Лента броней" + "Форма создания/редактирования" из Task_1.pdf.
 * Единый экспорт/импорт JSON (rooms + assets + bookings) — формат совпадает
 * с seed.example.json, описанным в Task_1.pdf.
 */
export function BookingsPage() {
  const { items, loading, load, add, edit, remove, importAll } = useBookingsStore();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [date, setDate] = useState("");
  // id ресурса -> человекочитаемое название (для колонки "Ресурс")
  const [resourceNames, setResourceNames] = useState<Record<string, string>>({});
  const [resourceType, setResourceType] = useState<ResourceType | "">("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BookingDto | undefined>(undefined);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Небольшая задержка, чтобы не слать запрос на каждую букву
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    // Фильтр даты — это локальные сутки пользователя [00:00; 24:00). Backend вернёт все брони,
    // которые ПЕРЕСЕКАЮТ этот период (в т.ч. начавшиеся раньше или закончившиеся позже).
    const range = date ? localDayRangeIso(date) : null;
    load({
      q: debouncedQ || undefined,
      from: range?.from,
      to: range?.to,
      resourceType: resourceType || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, date, resourceType]);

  // Названия аудиторий/инвентаря для колонки "Ресурс"
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [r, a] = await Promise.all([fetchRooms(1), fetchAssets(1)]);
        if (cancelled) return;
        const names: Record<string, string> = {};
        for (const x of r.items) names[`room:${x.id}`] = `Аудитория ${x.code} — ${x.name}`;
        for (const x of a.items) names[`asset:${x.id}`] = `Инвентарь ${x.inventoryCode} — ${x.name}`;
        setResourceNames(names);
      } catch {
        // без названий просто показываем id, как раньше
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function resourceLabel(b: BookingDto): string {
    return resourceNames[`${b.resourceType}:${b.resourceId}`]
      ?? (b.resourceType === "room" ? `Аудитория ${b.resourceId}` : `Инвентарь ${b.resourceId}`);
  }

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(b: BookingDto) {
    setEditing(b);
    setFormOpen(true);
  }

  async function handleSubmit(input: Omit<BookingDto, "id">) {
    setSubmitError(null);
    try {
      if (editing) {
        await edit(editing.id, input);
      } else {
        await add(input);
      }
      setFormOpen(false);
    } catch (e) {
      // 409 BOOKING_OVERLAP от backend — на случай гонки, если конфликт возник уже после
      // клиентской проверки в BookingForm (см. utils/overlap.ts)
      const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? "Не удалось сохранить бронь";
      setSubmitError(message);
    }
  }

  async function handleExport() {
    const [roomsRes, assetsRes] = await Promise.all([fetchRooms(1), fetchAssets(1)]);
    const payload = {
      rooms: roomsRes.items,
      assets: assetsRes.items,
      bookings: items,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "room-assets-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text) as { bookings?: BookingDto[] };
      if (Array.isArray(parsed.bookings)) {
        await importAll(parsed.bookings);
      }
    } catch {
      alert("Не удалось разобрать JSON-файл или сохранить его на сервере");
    } finally {
      e.target.value = "";
    }
  }

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
        <TextField label="Поиск по названию/примечанию" value={q} onChange={(e) => setQ(e.target.value)} fullWidth />
        <TextField label="Дата" type="date" value={date} onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField select label="Ресурс" value={resourceType} onChange={(e) => setResourceType(e.target.value as ResourceType | "")} sx={{ minWidth: 160 }}>
          <MenuItem value="">Все</MenuItem>
          <MenuItem value="room">Аудитория</MenuItem>
          <MenuItem value="asset">Инвентарь</MenuItem>
        </TextField>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button onClick={openCreate}>+ Новая бронь</Button>
        <Button variant="secondary" onClick={handleExport}>Экспорт JSON</Button>
        <Button variant="secondary" onClick={handleImportClick}>Импорт JSON</Button>
        <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleImportFile} />
      </Stack>

      <Paper elevation={0} sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid #eef0f3" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell>Ресурс</TableCell>
              <TableCell>Начало</TableCell>
              <TableCell>Окончание</TableCell>
              <TableCell>Примечание</TableCell>
              <TableCell width={100} align="center">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((b) => (
              <TableRow key={b.id} hover>
                <TableCell>{b.title}</TableCell>
                <TableCell>
                  <Chip size="small" label={resourceLabel(b)} />
                </TableCell>
                <TableCell>{formatLocal(b.start)}</TableCell>
                <TableCell>{formatLocal(b.end)}</TableCell>
                <TableCell sx={{ color: "text.secondary" }}>{b.notes}</TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={() => openEdit(b)} title="Редактировать"><EditOutlined fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => remove(b.id)} title="Удалить"><DeleteOutline fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography color="text.secondary" sx={{ py: 2 }}>Броней не найдено</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Редактирование брони" : "Новая бронь"}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {submitError && (
              <Typography color="error" sx={{ mb: 2 }}>{submitError}</Typography>
            )}
            <BookingForm
              initial={editing}
              existingBookings={items}
              onSubmit={handleSubmit}
              onCancel={() => setFormOpen(false)}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
