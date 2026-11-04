import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { DashboardSectionCard } from "@/components/dashboard/dashboard-page-shell";
import { EditableCell } from "@/features/lcms/admin-operations/components/student-sheet-import/import-primitives";
import { getInitials, type EditableStudentField, type ParsedSheetResult, type ParsedStudentRow } from "@/features/lcms/admin-operations/components/student-sheet-import/student-sheet-parser";

export function StudentPreviewCard({
  excludeStudent,
  excludedCount,
  isLoading,
  restoreAllStudents,
  result,
  updateStudent,
  visibleStudents,
}: {
  excludeStudent: (studentId: string) => void;
  excludedCount: number;
  isLoading: boolean;
  restoreAllStudents: () => void;
  result: ParsedSheetResult | null;
  updateStudent: (studentId: string, field: EditableStudentField, value: string) => void;
  visibleStudents: ParsedStudentRow[];
}) {
  return (
<DashboardSectionCard
  title="Bảng xem trước dữ liệu học sinh"
  description="Cho phép chỉnh sửa trực tiếp thông tin lỗi của học sinh trước khi gửi dữ liệu lên máy chủ."
  action={
    excludedCount > 0 ? (
      <Button variant="outlined" size="small" onClick={restoreAllStudents} sx={{ minHeight: 32, fontSize: 12, textTransform: "none" }} startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}>
        Khôi phục {excludedCount} dòng đã bỏ
      </Button>
    ) : null
  }
>
  <TableContainer component={Paper} variant="outlined" sx={{ mt: 2, maxHeight: 580, borderRadius: 1.5 }}>
      <Table stickyHeader size="small" sx={{ minWidth: 1200 }}>
        <TableHead>
          <TableRow sx={{ "& th": { bgcolor: "action.hover", color: "text.secondary", fontSize: 10, fontWeight: 600, textTransform: "uppercase" } }}>
            <TableCell align="center" sx={{ width: 64 }}>STT</TableCell>
            <TableCell sx={{ width: 288 }}>Họ & Tên học sinh</TableCell>
            <TableCell sx={{ width: 128 }}>Lớp</TableCell>
            <TableCell sx={{ width: 160 }}>Ngày sinh</TableCell>
            <TableCell sx={{ width: 160 }}>Số điện thoại</TableCell>
            <TableCell sx={{ width: 192 }}>Tên tài khoản (Gen)</TableCell>
            <TableCell sx={{ width: 128 }}>Mật khẩu</TableCell>
            <TableCell align="center" sx={{ width: 144 }}>Trạng thái</TableCell>
            <TableCell align="center" sx={{ width: 96 }}>Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visibleStudents.map((student) => {
            const isValid = student.status === "valid";
            return (
              <TableRow
                key={student.id} 
                hover
                sx={{ bgcolor: isValid ? "background.paper" : "warning.50", "& td": { py: 1.25, fontSize: 12 } }}
              >
                <TableCell align="center">
                  <Box component="span" sx={{ display: "inline-flex", width: 24, height: 24, alignItems: "center", justifyContent: "center", borderRadius: 0.75, bgcolor: "action.hover", color: "text.secondary", fontSize: 10, fontWeight: 600 }}>
                    {student.rowNumber || student.sourceIndex}
                  </Box>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Avatar variant="rounded" sx={{ width: 32, height: 32, flexShrink: 0, bgcolor: "primary.50", color: "primary.main", fontSize: 10, fontWeight: 600 }}>
                      {getInitials(student.fullName)}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <EditableCell
                        value={student.fullName} 
                        onChange={(e) => updateStudent(student.id, "fullName", e.target.value)}
                        bold
                      />
                      <Typography noWrap sx={{ mt: 0.25, color: "text.secondary", fontSize: 10 }}>{student.schoolName || "Cơ sở chưa phân loại"}</Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <EditableCell
                    value={student.className} 
                    onChange={(e) => updateStudent(student.id, "className", e.target.value)}
                    bold
                  />
                </TableCell>
                <TableCell>
                  <EditableCell
                    value={student.birthday} 
                    onChange={(e) => updateStudent(student.id, "birthday", e.target.value)}
                    placeholder="DD/MM/YYYY"
                  />
                </TableCell>
                <TableCell>
                  <EditableCell
                    value={student.phone} 
                    onChange={(e) => updateStudent(student.id, "phone", e.target.value)}
                    placeholder="Chưa cập nhật SĐT"
                  />
                </TableCell>
                <TableCell>
                  <EditableCell
                    value={student.generatedUsername} 
                    onChange={(e) => updateStudent(student.id, "generatedUsername", e.target.value)}
                    mono
                  />
                </TableCell>
                <TableCell>
                  <EditableCell
                    value={student.generatedPassword} 
                    onChange={(e) => updateStudent(student.id, "generatedPassword", e.target.value)}
                    mono
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip size="small" variant="outlined" color={isValid ? "success" : "warning"} label={student.note} sx={{ height: 22, fontSize: 10, fontWeight: 600 }} />
                </TableCell>
                <TableCell align="center">
                  <Button
                    aria-label={`Bỏ dòng ${student.rowNumber || student.sourceIndex}`}
                    variant="text"
                    size="small"
                    color="error"
                    onClick={() => excludeStudent(student.id)}
                    sx={{ minWidth: 32, minHeight: 32 }}
                  >
                    <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}

          {result && visibleStudents.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} align="center" sx={{ py: 4, color: "text.secondary", fontWeight: 600 }}>
                Không còn học sinh nào phù hợp trong khoảng lựa chọn.
              </TableCell>
            </TableRow>
          )}

          {!result && !isLoading && (
            <TableRow>
              <TableCell colSpan={9} align="center" sx={{ py: 6, color: "text.secondary", fontWeight: 600 }}>
                Vui lòng nhập đường dẫn Google Sheet phía trên để tải và cấu hình dữ liệu.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
  </TableContainer>
</DashboardSectionCard>
  );
}
