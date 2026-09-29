import { Dialog, DialogTitle, DialogContent, DialogActions, Typography } from "@mui/material";
import { Button } from "@/components/Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open, title, message, confirmLabel = "Удалить", loading = false, error, onConfirm, onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
        {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="secondary" onClick={onCancel} disabled={loading}>Отмена</Button>
        <Button onClick={onConfirm} disabled={loading}>{loading ? "Удаление..." : confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}
