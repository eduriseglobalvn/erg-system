import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { DashboardSectionCard } from "@/components/dashboard/dashboard-page-shell";
import type { BulkStudentAccountResponse } from "@/features/lcms/admin-operations/api/student-account-import-api";
import { ImportField, RuleLine } from "@/features/lcms/admin-operations/components/student-sheet-import/import-primitives";
import type { ParsedStudentRow } from "@/features/lcms/admin-operations/components/student-sheet-import/student-sheet-parser";

export function SubmitSidebarCard({
  centerId,
  isSubmitting,
  passwordColumn,
  selectedSheetLabel,
  setPasswordColumn,
  setUsernameColumn,
  submitAccounts,
  submitResult,
  usernameColumn,
  visibleStudents,
}: {
  centerId: string;
  isSubmitting: boolean;
  passwordColumn: string;
  selectedSheetLabel: string;
  setPasswordColumn: (value: string) => void;
  setUsernameColumn: (value: string) => void;
  submitAccounts: () => Promise<void>;
  submitResult: BulkStudentAccountResponse | null;
  usernameColumn: string;
  visibleStudents: ParsedStudentRow[];
}) {
  return (
  <DashboardSectionCard 
    title="Đồng bộ về Sheet" 
    description="Cấu hình trả kết quả tài khoản đã khởi tạo về tệp Google Sheet gốc."
  >
    <Stack spacing={2.5} sx={{ mt: 1 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.5 }}>
        <ImportField label="Cột Tên đăng nhập"><TextField size="small" fullWidth value={usernameColumn} onChange={(event) => setUsernameColumn(event.target.value.toUpperCase())} sx={{ "& input": { textTransform: "uppercase" } }} /></ImportField>
        <ImportField label="Cột Mật khẩu"><TextField size="small" fullWidth value={passwordColumn} onChange={(event) => setPasswordColumn(event.target.value.toUpperCase())} sx={{ "& input": { textTransform: "uppercase" } }} /></ImportField>
      </Box>

      <Stack spacing={1.25} sx={{ borderTop: 1, borderColor: "divider", pt: 1.5 }}>
        <RuleLine label="Đầu vào Tab" value={selectedSheetLabel} />
        <RuleLine label="Định danh Auth" value="Khởi tạo thật, chống trùng lặp" />
        <RuleLine label="Mật khẩu mặc định" value="123456" />
        <RuleLine label="Cột ghi nhận kết quả" value={`${usernameColumn || "AA"} / ${passwordColumn || "AB"}`} />
        <RuleLine label="Quyền hạn ghi tệp" value="OAuth 2.0 / Service Account" />
      </Stack>

      {submitResult && (
        <Paper variant="outlined" sx={{ borderColor: "success.light", borderRadius: 1.5, bgcolor: "success.50", color: "success.dark", px: 2, py: 1.75 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1.6 }}>
            Hoàn tất: BE đã khởi tạo {submitResult.created} tài khoản, bỏ qua {submitResult.skipped}, trùng lặp {submitResult.duplicates}.
          </Typography>
          {submitResult.credentials.length > 0 && (
            <Box sx={{ borderRadius: 1, bgcolor: "background.paper", p: 1.25, mt: 1, fontFamily: "JetBrains Mono, monospace" }}>
              <Typography sx={{ mb: 0.5, color: "text.primary", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Tài khoản mẫu mới tạo</Typography>
              <Stack spacing={0.5} sx={{ color: "text.secondary", fontSize: 10 }}>
                {submitResult.credentials.slice(0, 5).map((item) => (
                  <Box component="span" key={item.rowId}>
                    Dòng {item.rowNumber}: {item.username} / {item.password}
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </Paper>
      )}

      <Button
        variant="contained"
        fullWidth
        sx={{ minHeight: 40, borderRadius: 1.5, fontSize: 12, fontWeight: 700, textTransform: "none" }}
        onClick={() => void submitAccounts()}
        disabled={!visibleStudents.length || !centerId || isSubmitting}
      >
        {isSubmitting ? "Đang truyền dữ liệu..." : `Khởi tạo ${visibleStudents.length} tài khoản`}
      </Button>
    </Stack>
  </DashboardSectionCard>
  );
}
