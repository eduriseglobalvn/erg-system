import { useState } from "react";
import Box from "@mui/material/Box";
import { toast } from "sonner";

import { ErgButton, ErgConfirmDialog } from "@/components/erg-mui";

import { useCancelCampaign } from "../api/campaign-query";

const messageOf = (error: unknown) =>
  error instanceof Error && error.message ? error.message : "Không hủy được lịch hẹn. Thử lại sau.";

/** "Hủy hẹn" for a SCHEDULED campaign: confirm first, error stays in the dialog, lists/detail refresh via the T6 hook. */
export function CancelScheduleButton({ campaignId, title }: { campaignId: string; title?: string }) {
  const [open, setOpen] = useState(false);
  const cancel = useCancelCampaign();

  const confirm = () =>
    cancel.mutate(campaignId, {
      onSuccess: () => {
        setOpen(false);
        toast.success("Đã hủy hẹn gửi.");
      },
    });

  return (
    <>
      <ErgButton
        variant="outlined"
        color="error"
        size="small"
        aria-label={title ? `Hủy hẹn: ${title}` : undefined}
        onClick={() => {
          cancel.reset();
          setOpen(true);
        }}
      >
        Hủy hẹn
      </ErgButton>
      <ErgConfirmDialog
        open={open}
        destructive
        title="Hủy hẹn gửi?"
        description="Thông báo sẽ không được gửi."
        impact={cancel.isError ? <Box component="span" role="alert" sx={{ color: "error.main" }}>{messageOf(cancel.error)}</Box> : undefined}
        confirmLabel="Hủy hẹn"
        cancelLabel="Không"
        loading={cancel.isPending}
        onConfirm={confirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
