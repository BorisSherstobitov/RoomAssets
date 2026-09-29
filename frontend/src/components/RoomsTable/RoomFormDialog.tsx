import { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Stack, TextField, MenuItem, Typography, Alert,
} from "@mui/material";
import { Button } from "@/components/Button";
import { EquipmentChip } from "@/components/EquipmentChip";
import { EQUIPMENT_OPTIONS } from "@/constants/equipment";
import { getErrorMessage } from "@/utils/errors";
import type { RoomDto, RoomInput, RoomManualStatus } from "@/api/roomsApi";

interface RoomFormDialogProps {
  /** Если передана — режим редактирования, иначе — создание */
  initial?: RoomDto;
  onClose: () => void;
  onSubmit: (input: RoomInput) => Promise<void>;
}

export function RoomFormDialog({ initial, onClose, onSubmit }: RoomFormDialogProps) {
  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [capacity, setCapacity] = useState(initial ? String(initial.capacity) : "");
  const [equipment, setEquipment] = useState<string[]>(initial?.equipment ?? []);
  // "Забронирована" — вычисляемый статус, вручную он не выставляется: в форме это "Доступна"
  const [status, setStatus] = useState<RoomManualStatus>(initial?.status === "maintenance" ? "maintenance" : "available");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Неизвестные ключи оборудования (например, из импортированных данных) тоже показываем
  const knownKeys = EQUIPMENT_OPTIONS.map((o) => o.key);
  const extraKeys = equipment.filter((k) => !knownKeys.includes(k));
  const allKeys = [...knownKeys, ...extraKeys];

  function toggle(key: string) {
    setEquipment((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const capacityNum = Number(capacity);
    if (!code.trim()) return setError("Укажите номер аудитории");
    if (!name.trim()) return setError("Укажите название аудитории");
    if (!Number.isInteger(capacityNum) || capacityNum < 1) return setError("Вместимость — целое число не меньше 1");

    setSaving(true);
    setError(null);
    try {
      await onSubmit({ code: code.trim(), name: name.trim(), capacity: capacityNum, equipment, status });
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось сохранить аудиторию"));
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{initial ? "Редактирование аудитории" : "Новая аудитория"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField label="Номер" value={code} onChange={(e) => setCode(e.target.value)} required sx={{ minWidth: 140 }} />
              <TextField label="Название" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
            </Stack>

            <TextField
              label="Вместимость"
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
              required
            />

            <div>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Оборудование (нажмите, чтобы добавить или убрать)
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {allKeys.map((key) => (
                  <EquipmentChip key={key} equipmentKey={key} selected={equipment.includes(key)} onClick={() => toggle(key)} />
                ))}
              </Stack>
            </div>

            <TextField
              select
              label="Статус"
              value={status}
              onChange={(e) => setStatus(e.target.value as RoomManualStatus)}
              helperText={
                initial?.status === "booked"
                  ? "Сейчас аудитория забронирована — статус «Забронирована» ставится автоматически на время брони"
                  : "Статус «Забронирована» ставится автоматически на время брони"
              }
            >
              <MenuItem value="available">Доступна</MenuItem>
              <MenuItem value="maintenance">На обслуживании</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Отмена</Button>
          <Button type="submit" disabled={saving}>{saving ? "Сохранение..." : initial ? "Сохранить" : "Создать"}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
