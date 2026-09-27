import { useMemo, useState } from "react";
import { Box, TextField, MenuItem, Stack, Alert } from "@mui/material";
import { Button } from "@/components/Button";
import type { BookingDto, ResourceType } from "@/api/bookingsApi";
import { localInputValueToIso, isoToLocalInputValue } from "@/utils/date";
import { findOverlappingBookings } from "@/utils/overlap";

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
      <TextField select label="Тип ресурса" value={resourceType} onChange={(e) => setResourceType(e.target.value as ResourceType)}>
        {RESOURCE_OPTIONS.map((o) => (
          <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
        ))}
      </TextField>

      <TextField
        label="ID ресурса"
        value={resourceId}
        onChange={(e) => setResourceId(e.target.value)}
        helperText="Например: r-101 (аудитория) или a-proj-1 (инвентарь)"
        required
      />

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
