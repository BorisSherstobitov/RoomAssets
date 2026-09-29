import { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Stack, TextField, MenuItem, Alert,
} from "@mui/material";
import { Button } from "@/components/Button";
import { getErrorMessage } from "@/utils/errors";
import type { AssetDto, AssetInput, AssetManualStatus } from "@/api/assetsApi";

interface AssetFormDialogProps {
  /** Если передан — режим редактирования, иначе — создание */
  initial?: AssetDto;
  onClose: () => void;
  onSubmit: (input: AssetInput) => Promise<void>;
}

export function AssetFormDialog({ initial, onClose, onSubmit }: AssetFormDialogProps) {
  const [inventoryCode, setInventoryCode] = useState(initial?.inventoryCode ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  // "Используется" — вычисляемый статус, вручную он не выставляется: в форме это "Доступен"
  const [status, setStatus] = useState<AssetManualStatus>(initial?.status === "maintenance" ? "maintenance" : "available");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inventoryCode.trim()) return setError("Укажите инвентарный номер");
    if (!name.trim()) return setError("Укажите название");

    setSaving(true);
    setError(null);
    try {
      await onSubmit({ inventoryCode: inventoryCode.trim(), name: name.trim(), status });
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось сохранить оборудование"));
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{initial ? "Редактирование оборудования" : "Новое оборудование"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Инв. номер"
                value={inventoryCode}
                onChange={(e) => setInventoryCode(e.target.value)}
                required
                sx={{ minWidth: 160 }}
              />
              <TextField label="Название" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
            </Stack>

            <TextField
              select
              label="Статус"
              value={status}
              onChange={(e) => setStatus(e.target.value as AssetManualStatus)}
              helperText={
                initial?.status === "in_use"
                  ? "Сейчас оборудование используется — статус «Используется» ставится автоматически на время брони"
                  : "Статус «Используется» ставится автоматически на время брони"
              }
            >
              <MenuItem value="available">Доступен</MenuItem>
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
