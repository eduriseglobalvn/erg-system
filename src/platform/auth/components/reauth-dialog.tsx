import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";

export function ReauthDialog({
  open,
  onReauthenticate,
  onSignOut,
}: {
  open: boolean;
  onReauthenticate: () => void;
  onSignOut: () => void;
}) {
  return (
    <Dialog fullWidth maxWidth="xs" open={open}>
      <DialogTitle>
        <Box sx={{ alignItems: "center", display: "flex", gap: 1.25 }}>
          <SecurityRoundedIcon color="primary" />
          <span>Phiên làm việc cần xác thực lại</span>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" variant="body2">
          Bản nháp đang mở đã được lưu phục hồi. Hãy xác thực lại để tiếp tục thao tác.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button color="inherit" onClick={onSignOut}>Đăng xuất</Button>
        <Button autoFocus variant="contained" onClick={onReauthenticate}>Xác thực lại</Button>
      </DialogActions>
    </Dialog>
  );
}
