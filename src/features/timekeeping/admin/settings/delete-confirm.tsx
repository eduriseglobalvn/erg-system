import Typography from "@mui/material/Typography";
import { toast } from "sonner";

import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { requestErrorText } from "../../components/requests/request-model";

type DeleteMutation = { isPending: boolean; isError: boolean; error: unknown; mutate: (id: string, options: { onSuccess: () => void }) => void };

type DeleteConfirmProps = { id: string; title: string; description: string; mutation: DeleteMutation; onClose: () => void };

/** Confirm + delete of one config row; the server's refusal (e.g. a holiday in a locked month) stays in the dialog. */
export function DeleteConfirm({ description, id, mutation, onClose, title }: DeleteConfirmProps) {
  return (
    <ErgConfirmDialog
      confirmLabel="Xoá"
      description={description}
      destructive
      loading={mutation.isPending}
      onCancel={onClose}
      onConfirm={() => mutation.mutate(id, { onSuccess: () => { toast.success("Đã xoá"); onClose(); } })}
      open
      title={title}
    >
      {mutation.isError ? <Typography color="error" role="alert" sx={{ mt: 2 }} variant="body2">{requestErrorText(mutation.error)}</Typography> : null}
    </ErgConfirmDialog>
  );
}
