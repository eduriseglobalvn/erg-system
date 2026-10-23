import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { ClipboardEvent } from "react";
import { createBlankImportRow, validateImportRow } from "@/features/lcms/school-management/components/student-import-utils";
import type { StudentImportRow } from "@/features/lcms/school-management/types/school-management-types";

const allColumns: Array<{ key: keyof Pick<StudentImportRow, "code" | "fullName" | "birthDate" | "grade" | "className" | "guardianPhone">; label: string; width: number }> = [
  { key: "code", label: "Mã học sinh", width: 130 }, { key: "fullName", label: "Họ và tên *", width: 210 },
  { key: "birthDate", label: "Ngày sinh", width: 135 }, { key: "grade", label: "Khối *", width: 90 },
  { key: "className", label: "Lớp *", width: 120 }, { key: "guardianPhone", label: "SĐT phụ huynh", width: 150 },
];

export function StudentSpreadsheetGrid({ onChange, rows, usesGrades = true }: { onChange: (rows: StudentImportRow[]) => void; rows: StudentImportRow[]; usesGrades?: boolean }) {
  const columns = usesGrades ? allColumns : allColumns.filter((column) => column.key !== "grade");
  function update(rowId: string, key: typeof columns[number]["key"], value: string) {
    onChange(rows.map((row) => row.id !== rowId ? row : validateImportRow({ ...row, [key]: value }, usesGrades)));
  }

  function pasteAt(rowIndex: number, columnIndex: number, event: ClipboardEvent<HTMLElement>) {
    const text = event.clipboardData.getData("text/plain");
    if (!text.includes("\t") && !text.includes("\n")) return;
    event.preventDefault();
    const matrix = text.replace(/\r/g, "").split("\n").filter(Boolean).map((line) => line.split("\t"));
    const next = [...rows];
    while (next.length < rowIndex + matrix.length) next.push(createBlankImportRow(next.length));
    matrix.forEach((cells, y) => cells.forEach((value, x) => {
      const column = columns[columnIndex + x];
      if (column) next[rowIndex + y] = { ...next[rowIndex + y], [column.key]: value.trim() };
    }));
    onChange(next.map((row) => validateImportRow(row, usesGrades)));
  }

  return (
    <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
      <Box sx={{ alignItems: "center", bgcolor: "background.default", borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", px: 1.5, py: 1 }}>
        <Typography color="text.secondary" variant="caption">Có thể sao chép nhiều ô từ Excel/Google Sheets rồi dán trực tiếp vào bảng.</Typography>
        <Button onClick={() => onChange([...rows, createBlankImportRow(rows.length)])} size="small" startIcon={<AddRoundedIcon />}>Thêm hàng</Button>
      </Box>
      <TableContainer sx={{ maxHeight: 390 }}>
        <Table stickyHeader sx={{ minWidth: usesGrades ? 930 : 820, tableLayout: "fixed" }}>
          <TableHead><TableRow><TableCell align="center" sx={{ width: 48 }}>#</TableCell>{columns.map((column) => <TableCell key={column.key} sx={{ width: column.width }}>{column.label}</TableCell>)}<TableCell sx={{ width: 105 }}>Kiểm tra</TableCell><TableCell sx={{ width: 52 }} /></TableRow></TableHead>
          <TableBody>{rows.map((row, rowIndex) => (
            <TableRow key={row.id} sx={{ "& td": { borderRight: "1px solid", borderRightColor: "divider", p: 0 } }}>
              <TableCell align="center" sx={{ bgcolor: "background.default", color: "text.secondary", fontSize: 12 }}>{rowIndex + 1}</TableCell>
              {columns.map((column, columnIndex) => (
                <TableCell key={column.key}>
                  <TextField fullWidth value={row[column.key]} onChange={(event) => update(row.id, column.key, event.target.value)} onPaste={(event) => pasteAt(rowIndex, columnIndex, event)} placeholder={column.key === "fullName" && rowIndex === 0 ? "Dán dữ liệu tại đây" : ""} variant="standard" slotProps={{ input: { disableUnderline: true, sx: { fontSize: 13, minHeight: 38, px: 1.25 } } }} />
                </TableCell>
              ))}
              <TableCell sx={{ px: "8px !important", textAlign: "center" }}><Chip color={row.valid ? "success" : "warning"} label={row.valid ? "Hợp lệ" : "Thiếu"} size="small" sx={{ height: 22, fontSize: 10.5 }} /></TableCell>
              <TableCell align="center"><IconButton aria-label={`Xóa hàng ${rowIndex + 1}`} onClick={() => onChange(rows.filter((item) => item.id !== row.id))} size="small"><DeleteOutlineRoundedIcon fontSize="small" /></IconButton></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
