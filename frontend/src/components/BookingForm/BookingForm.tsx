import { useEffect, useMemo, useState } from "react";
import { Box, TextField, MenuItem, Stack, Alert } from "@mui/material";
import { Button } from "@/components/Button";
import type { BookingDto, ResourceType } from "@/api/bookingsApi";
import { fetchRooms } from "@/api/roomsApi";
import { fetchAssets } from "@/api/assetsApi";
import { localInputValueToIso, isoToLocalInputValue } from "@/utils/date";
import { findOverlappingBookings } from "@/utils/overlap";

interface ResourceOption {
  value: string;
  label: string;
}

export interface BookingFormProps {
  initial?: BookingDto;
  existingBookings: BookingDto[];
  onSubmit: (input: Omit<BookingDto, "id">) => void;
  onCancel?: () => void;
}

const RESOURCE_OPTIONS: { value: ResourceType; label: string }[] = [
  { value: "room", label: "Аудитория" },
  { value: "asset", label: "Инвентарь" },
];

export function BookingForm({ initial, existingBookings, onSubmit, onCancel }: BookingFormProps) {
  const [resourceType, setResourceType] = useState<ResourceType>(initial?.resourceType ?? "room");
  const [resourceId, setResourceId] = useState(initial?.resourceId ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [start, setStart] = useState(initial ? isoToLocalInputValue(initial.start) : "");
  const [end, setEnd] = useState(initial ? isoToLocalInputValue(initial.end) : "");

  // Списки аудиторий и инвентаря для выпадающего списка ресурсов
  const [rooms, setRooms] = useState<ResourceOption[]>([]);
  const [assets, setAssets] = useState<ResourceOption[]>([]);
  const [blocked, setBlocked] = useState<Record<string, string>>({});
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [resourcesError, setResourcesError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [r, a] = await Promise.all([fetchRooms(1), fetchAssets(1)]);
        if (cancelled) return;
        const roomOpts = r.items.map((x) => ({ value: x.id, label: `${x.code} — ${x.name}`, maintenance: x.status === "maintenance" }));
        const assetOpts = a.items.map((x) => ({ value: x.id, label: `${x.inventoryCode} — ${x.name}`, maintenance: x.status === "maintenance" }));
        setRooms(roomOpts.filter((o) => !o.maintenance));
        setAssets(assetOpts.filter((o) => !o.maintenance));
        const blockedMap: Record<string, string> = {};
        for (const o of roomOpts) if (o.maintenance) blockedMap[`room:${o.value}`] = o.label;
        for (const o of assetOpts) if (o.maintenance) blockedMap[`asset:${o.value}`] = o.label;
        setBlocked(blockedMap);
      } catch {
        if (!cancelled) setResourcesError(true);
      } finally {
        if (!cancelled) setResourcesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const resourceOptions = useMemo(() => {
    const base = [...(resourceType === "room" ? rooms : assets)];
    // Ресурс из существующей брони может отсутствовать в каталоге (удалён / из импорта) —
    // добавляем его в список, чтобы значение не терялось при редактировании.
    // Ресурс из существующей брони может отсутствовать в списке (удалён / из импорта / позже
    // отправлен на обслуживание) — добавляем его, чтобы значение не терялось при редактировании.
    // Выбрать такой ресурс заново нельзя: после смены значения он из списка исчезает.
    if (resourceId && !base.some((o) => o.value === resourceId)) {
      const blockedLabel = blocked[`${resourceType}:${resourceId}`];
      base.unshift({
        value: resourceId,
        label: blockedLabel
          ? `${blockedLabel} (на обслуживании)`
          : resourcesLoading ? resourceId : `${resourceId} (нет в каталоге)`,
      });
    }
    return base;
  }, [resourceType, rooms, assets, blocked, resourceId, resourcesLoading]);

  const conflicts = useMemo(() => {
    if (!start || !end || !resourceId) return [];
    try {
      const startIso = localInputValueToIso(start);
      const endIso = localInputValueToIso(end);
      return findOverlappingBookings(
        existingBookings,
        { resourceType, resourceId, start: startIso, end: endIso },
        initial?.id
      );
    } catch {
      return [];
    }
  }, [start, end, resourceType, resourceId, existingBookings, initial?.id]);

  const hasConflict = conflicts.length > 0;
  const invalidRange = Boolean(start && end && new Date(start) >= new Date(end));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (hasConflict || invalidRange || !title || !resourceId || !start || !end) return;
    onSubmit({
      resourceType,
      resourceId,
      title,
      notes,
      start: localInputValueToIso(start),
      end: localInputValueToIso(end),
    });
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2, maxWidth: 480 }}>
      <TextField
        select
        label="Тип ресурса"
        value={resourceType}
        onChange={(e) => {
          setResourceType(e.target.value as ResourceType);
          setResourceId(""); // ресурс другого типа — выбор нужно сделать заново
        }}
      >
        {RESOURCE_OPTIONS.map((o) => (
          <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label={resourceType === "room" ? "Аудитория" : "Инвентарь"}
        value={resourceId}
        onChange={(e) => setResourceId(e.target.value)}
        disabled={resourcesLoading}
        error={resourcesError}
        helperText={
          resourcesError
            ? "Не удалось загрузить список ресурсов"
            : !resourcesLoading && resourceOptions.length === 0
              ? "Нет доступных ресурсов этого типа (все на обслуживании или каталог пуст)"
              : undefined
        }
        required
      >
        {resourceOptions.map((o) => (
          <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
        ))}
      </TextField>

      <TextField label="Название брони" value={title} onChange={(e) => setTitle(e.target.value)} required />

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label="Начало"
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          InputLabelProps={{ shrink: true }}
          required
          fullWidth
        />
        <TextField
          label="Окончание"
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          InputLabelProps={{ shrink: true }}
          required
          fullWidth
        />
      </Stack>

      <TextField label="Примечание" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={2} />

      {invalidRange && <Alert severity="warning">Окончание должно быть позже начала.</Alert>}
      {hasConflict && (
        <Alert severity="error">
          Пересечение с {conflicts.length} существующей бронью для этого ресурса. Выберите другой интервал.
        </Alert>
      )}

      <Stack direction="row" spacing={2}>
        <Button type="submit" disabled={hasConflict || invalidRange}>
          {initial ? "Сохранить" : "Создать бронь"}
        </Button>
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Отмена</Button>}
      </Stack>
    </Box>
  );
}
