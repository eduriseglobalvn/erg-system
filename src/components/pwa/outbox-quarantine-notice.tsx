import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { useOutboxQuarantine } from "@/platform/offline";

export function OutboxQuarantineNotice() {
  const { busy, count, discard, retry } = useOutboxQuarantine();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={count > 0}
        sx={{ zIndex: (theme) => theme.zIndex.snackbar }}
      >
        <Alert
          severity="warning"
          action={
            <>
              <Button color="inherit" disabled={busy} onClick={() => void retry()} size="small" variant="outlined">
                Thử lại
              </Button>
              <Button color="inherit" disabled={busy} onClick={() => setConfirmOpen(true)} size="small" variant="text">
                Xoá
              </Button>
            </>
          }
        >
          Có {count} thao tác chưa đồng bộ bị lỗi
        </Alert>
      </Snackbar>
      <ErgConfirmDialog
        confirmLabel="Xoá vĩnh viễn"
        description="Các thao tác này chưa được gửi lên máy chủ. Sau khi xoá sẽ không thể khôi phục."
        destructive
        loading={busy}
        impact={`Ảnh hưởng ${count} thao tác`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          void discard().then(() => setConfirmOpen(false));
        }}
        open={confirmOpen}
        title="Xoá thao tác chưa đồng bộ?"
      />
    </>
  );
}
