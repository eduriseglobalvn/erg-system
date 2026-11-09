import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import {
  credentialsCsv,
  credentialsSheetColumns,
  type CredentialRow,
} from "@/features/lcms/school-management/utils/student-account-credentials";

export type StudentCredentialsResult = {
  /** Accounts that now exist, with the password handed out. */
  rows: CredentialRow[];
  /** One entry per imported row, in import order (null = no new account), for pasting back into the sheet. */
  sheetOrder: Array<{ username: string; password: string } | null>;
  /** Imported rows that already had an account (kept as is). */
  skipped: number;
};

/** Shown once after an import: the passwords cannot be read back from the server later. */
export function StudentCredentialsDialog({ onClose, result }: { onClose: () => void; result: StudentCredentialsResult }) {
  const [copied, setCopied] = useState(false);

  function downloadCsv() {
    const url = URL.createObjectURL(new Blob([credentialsCsv(result.rows)], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "tai-khoan-hoc-sinh.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function copyForSheet() {
    await navigator.clipboard.writeText(credentialsSheetColumns(result.sheetOrder));
    setCopied(true);
  }

  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open>
      <DialogTitle>Đã tạo {result.rows.length} tài khoản học sinh</DialogTitle>
      <DialogContent dividers>
        <Typography color="text.secondary" sx={{ mb: 1.5 }} variant="body2">
          Mật khẩu chỉ hiện ở lần này, không xem lại được. Tải CSV hoặc sao chép hai cột tên đăng nhập / mật khẩu
          (đúng thứ tự dòng đã nhập) để dán vào Google Sheets.
          {result.skipped > 0 ? ` ${result.skipped} học sinh đã có tài khoản từ trước nên giữ nguyên.` : ""}
        </Typography>
        <Box sx={{ maxHeight: 360, overflow: "auto" }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Họ và tên</TableCell>
                <TableCell>Lớp</TableCell>
                <TableCell>Tên đăng nhập</TableCell>
                <TableCell>Mật khẩu</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.rows.map((row) => (
                <TableRow key={row.username}>
                  <TableCell>{row.fullName}</TableCell>
                  <TableCell>{row.className}</TableCell>
                  <TableCell>{row.username}</TableCell>
                  <TableCell>{row.password}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="text">Đóng</Button>
        <Button onClick={() => void copyForSheet()} startIcon={<ContentCopyRoundedIcon />} variant="outlined">
          {copied ? "Đã sao chép" : "Sao chép cho Google Sheets"}
        </Button>
        <Button onClick={downloadCsv} startIcon={<FileDownloadRoundedIcon />} variant="contained">
          Tải CSV
        </Button>
      </DialogActions>
    </Dialog>
  );
}
