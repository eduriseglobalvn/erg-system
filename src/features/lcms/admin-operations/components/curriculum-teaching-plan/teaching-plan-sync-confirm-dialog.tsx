import Sync from "@mui/icons-material/Sync";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Typography from "@mui/material/Typography";

import type { CurriculumRoadmapStage } from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";
import type { ExistingTopic } from "./use-teaching-plan-sync";

export function TeachingPlanSyncConfirmDialog({
  syncConfirmOpen,
  setSyncConfirmOpen,
  selectedStage,
  existingTopics,
  syncMode,
  setSyncMode,
  executeSync,
}: {
  syncConfirmOpen: boolean;
  setSyncConfirmOpen: (open: boolean) => void;
  selectedStage?: CurriculumRoadmapStage;
  existingTopics: ExistingTopic[];
  syncMode: "append" | "overwrite";
  setSyncMode: (mode: "append" | "overwrite") => void;
  executeSync: (mode: "append" | "overwrite") => Promise<void>;
}) {
  return (
  <Dialog
    open={syncConfirmOpen}
    onClose={() => setSyncConfirmOpen(false)}
    maxWidth="sm"
    fullWidth
  >
    <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 600, fontSize: 17 }}>
      <Sync color="primary" /> Đồng bộ sang Cấu trúc môn học
    </DialogTitle>
    <DialogContent dividers sx={{ display: "grid", gap: 2 }}>
      <Alert severity="warning" sx={{ fontSize: 13 }}>
        Level <strong>{selectedStage?.level.title}</strong> hiện đã có <strong>{existingTopics.length} chủ đề</strong> trong cấu trúc môn học.
        Vui lòng chọn phương thức đồng bộ:
      </Alert>

      <RadioGroup
        value={syncMode}
        onChange={(e) => setSyncMode(e.target.value as "append" | "overwrite")}
      >
        <Box
          sx={{
            p: 1.5,
            mb: 1.5,
            border: "1px solid",
            borderColor: syncMode === "append" ? "#0071E3" : "#E2E8F0",
            borderRadius: 1.5,
            bgcolor: syncMode === "append" ? "#F0F7FF" : "#FFFFFF",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onClick={() => setSyncMode("append")}
        >
          <FormControlLabel
            value="append"
            control={<Radio size="small" />}
            label={
              <Box>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#1E293B" }}>
                  Thêm tiếp vào sau cấu trúc hiện có (Khuyên dùng)
                </Typography>
                <Typography sx={{ fontSize: 12, color: "#64748B", mt: 0.25 }}>
                  Giữ nguyên các chủ đề và bài học cũ. Chỉ tạo thêm các chủ đề và bài học mới từ khung chương trình nếu chưa có.
                </Typography>
              </Box>
            }
          />
        </Box>

        <Box
          sx={{
            p: 1.5,
            border: "1px solid",
            borderColor: syncMode === "overwrite" ? "#EF4444" : "#E2E8F0",
            borderRadius: 1.5,
            bgcolor: syncMode === "overwrite" ? "#FEF2F2" : "#FFFFFF",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onClick={() => setSyncMode("overwrite")}
        >
          <FormControlLabel
            value="overwrite"
            control={<Radio size="small" color="error" />}
            label={
              <Box>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#991B1B" }}>
                  Xóa cấu trúc cũ và tạo mới toàn bộ theo khung chương trình
                </Typography>
                <Typography sx={{ fontSize: 12, color: "#64748B", mt: 0.25 }}>
                  Toàn bộ {existingTopics.length} chủ đề và các bài học cũ của level này sẽ được xóa để thay thế chính xác 100% theo khung chương trình.
                </Typography>
              </Box>
            }
          />
        </Box>
      </RadioGroup>
    </DialogContent>
    <DialogActions sx={{ px: 2.5, py: 1.5 }}>
      <Button variant="contained" onClick={() => setSyncConfirmOpen(false)} sx={{ textTransform: "none" }}>
        Hủy
      </Button>
      <Button
        variant="contained"
        color={syncMode === "overwrite" ? "error" : "primary"}
        onClick={() => {
          setSyncConfirmOpen(false);
          void executeSync(syncMode);
        }}
        sx={{ textTransform: "none", fontWeight: 600 }}
      >
        {syncMode === "overwrite" ? "Xóa & Tạo mới toàn bộ" : "Tiến hành đồng bộ"}
      </Button>
    </DialogActions>
  </Dialog>
  );
}
