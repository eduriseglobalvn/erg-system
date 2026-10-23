import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

/**
 * Assessment governance is intentionally unavailable until the backend publishes
 * a scoped campaign/question-permission contract. This surface must not render
 * demo rows or mutate local state as if those changes were persisted.
 */
export function AssessmentGovernanceWorkspace() {
  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <Alert severity="info" variant="outlined">
        Dữ liệu đợt kiểm tra, quyền bổ sung câu hỏi và lịch sử nhập câu hỏi sẽ chỉ hiển thị
        sau khi backend cung cấp API có phân quyền và phạm vi trường/lớp.
      </Alert>

      <Paper sx={{ p: { xs: 2, md: 3 } }} variant="outlined">
        <Box sx={{ alignItems: { xs: "flex-start", md: "center" }, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2, justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ fontWeight: 850 }} variant="h6">
              Quản trị kiểm tra & câu hỏi tạm
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 760 }} variant="body2">
              Chưa có contract backend cho campaign, question-permission request hoặc import job.
              Không hiển thị số liệu mẫu để tránh nhầm dữ liệu demo với dữ liệu vận hành.
            </Typography>
          </Box>
          <Button
            disabled
            startIcon={<AddRoundedIcon />}
            title="Backend chưa cung cấp import job và question-permission mutation."
            variant="contained"
          >
            Nhập câu hỏi từ file
          </Button>
        </Box>

        <Box sx={{ bgcolor: "background.default", border: "1px dashed", borderColor: "divider", borderRadius: 1.5, mt: 2, p: 2 }}>
          <Typography sx={{ fontWeight: 800 }} variant="subtitle2">
            Chờ contract backend
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
            Cần các endpoint đọc/ghi campaign, phê duyệt quyền theo môn và lớp, import câu hỏi,
            audit event và chính sách dọn dữ liệu tạm. Khi contract được phát hành, workspace này
            sẽ được nối qua query/mutation có scope và trạng thái loading, empty, error đầy đủ.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
