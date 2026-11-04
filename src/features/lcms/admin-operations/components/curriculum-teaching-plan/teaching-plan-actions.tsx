import Sync from "@mui/icons-material/Sync";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import DialogActions from "@mui/material/DialogActions";

export function TeachingPlanActions({
  onClose,
  isSaving,
  isSyncing,
  canSyncStructure,
  canSaveProgram,
  syncStatusText,
  handleSyncClick,
  save,
}: {
  onClose: () => void;
  isSaving: boolean;
  isSyncing: boolean;
  canSyncStructure: boolean;
  canSaveProgram: boolean;
  syncStatusText: string;
  handleSyncClick: () => void;
  save: () => Promise<void>;
}) {
  return (
    <DialogActions sx={{ px: 2.5, py: 1.5, justifyContent: "space-between" }}>
      <Button variant="contained" onClick={onClose} disabled={isSaving || isSyncing} sx={{ textTransform: "none" }}>
        Đóng
      </Button>

      <Box sx={{ display: "flex", gap: 1.5 }}>
        <Button
          variant="contained"
          disabled={!canSyncStructure || isSaving || isSyncing}
          startIcon={isSyncing ? <CircularProgress size={16} sx={{ color: "white" }} /> : <Sync />}
          onClick={handleSyncClick}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            px: 2.2,
            bgcolor: "#059669",
            color: "#FFFFFF",
            borderRadius: 1.5,
            boxShadow: "0 2px 4px rgba(5, 150, 105, 0.25)",
            "&:hover": { bgcolor: "#047857" },
            "&.Mui-disabled": {
              bgcolor: "#D1D5DB",
              color: "#9CA3AF",
            },
          }}
        >
          {isSyncing ? (syncStatusText || "Đang đồng bộ…") : "Lưu & Đồng bộ sang Cấu trúc"}
        </Button>

        <Button
          variant="contained"
          disabled={!canSaveProgram || isSaving || isSyncing}
          startIcon={isSaving ? <CircularProgress size={16} sx={{ color: "white" }} /> : null}
          onClick={() => void save()}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            px: 2.5,
            bgcolor: "#0F6CBD",
            borderRadius: 1.5,
            boxShadow: "0 2px 4px rgba(15, 108, 189, 0.25)",
            "&:hover": { bgcolor: "#0B5594" },
            "&.Mui-disabled": {
              bgcolor: "#CBD5E1",
              color: "#94A3B8",
            },
          }}
        >
          {isSaving ? "Đang lưu…" : "Lưu khung chương trình"}
        </Button>
      </Box>
    </DialogActions>
  );
}
