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
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, type ClipboardEvent } from "react";
import { createBlankImportRow, gradeFromClassName, isBlankImportRow, rowFromPastedCells, validateImportRow } from "@/features/lcms/school-management/components/student-import-utils";
import type { StudentImportRow } from "@/features/lcms/school-management/types/school-management-types";

// No code, birth date or parent phone: the backend issues the code and the school sheets carry neither of the others.
// A code read from an Excel file still travels with its row; it just is not edited here.
const allColumns: Array<{ key: keyof Pick<StudentImportRow, "fullName" | "grade" | "className">; label: string; width: number }> = [
  { key: "fullName", label: "Họ và tên *", width: 320 },
  { key: "grade", label: "Khối *", width: 90 },
  { key: "className", label: "Lớp *", width: 140 },
];

export function StudentSpreadsheetGrid({ onChange, rows, usesGrades = true }: { onChange: (rows: StudentImportRow[]) => void; rows: StudentImportRow[]; usesGrades?: boolean }) {
  const [page, setPage] = useState(0);
  const rowsPerPage = 50;

  const columns = usesGrades ? allColumns : allColumns.filter((column) => column.key !== "grade");

  function update(rowId: string, key: typeof columns[number]["key"], value: string) {
    // A new class name moves the grade with it (6A5 → 7A1 makes it 7); a name the grade cannot be read from leaves it.
    const grade = (row: StudentImportRow) => (key === "className" && gradeFromClassName(value)) || row.grade;
    onChange(rows.map((row) => row.id !== rowId ? row : validateImportRow({ ...row, grade: grade(row), [key]: value }, usesGrades)));
  }

  function pasteAt(rowIndex: number, columnIndex: number, event: ClipboardEvent<HTMLElement>) {
    const text = event.clipboardData.getData("text/plain");
    if (!text.includes("\t") && !text.includes("\n")) return;
    event.preventDefault();
    const matrix = text.replace(/\r/g, "").split("\n").filter(Boolean).map((line) => line.split("\t"));
    const next = [...rows];
    while (next.length < rowIndex + matrix.length) next.push(createBlankImportRow(next.length));
    matrix.forEach((cells, y) => {
      const target = next[rowIndex + y];
      // Pasted into the name column: read name and class out of whatever block the teacher copied (split name, STT, extra columns).
      if (columns[columnIndex].key === "fullName") {
        const { fullName, className } = rowFromPastedCells(cells);
        next[rowIndex + y] = { ...target, fullName, className: className || target.className, grade: className ? gradeFromClassName(className) || target.grade : target.grade };
        return;
      }
      cells.forEach((value, x) => {
        const column = columns[columnIndex + x];
        if (column) next[rowIndex + y] = { ...next[rowIndex + y], [column.key]: value.trim() };
      });
    });
    onChange(next.map((row) => validateImportRow(row, usesGrades)));
  }

  const displayedRows = rows.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  return (
    <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
      <Box sx={{ alignItems: "center", bgcolor: "background.default", borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", px: 2, py: 1 }}>
        <Typography color="text.secondary" variant="caption">
          {rows.length > 50 ? `Hiển thị trang ${page + 1} (${displayedRows.length} / ${rows.length} học sinh) · có thể sao chép và dán trực tiếp vào bảng.` : "Bôi đen từ cột Họ tên đến cột Lớp trong Excel/Google Sheets (cả khi họ và tên tách 2 cột), Ctrl+C rồi bấm vào ô Họ tên đầu tiên và Ctrl+V."}
        </Typography>
        <Button variant="contained" onClick={() => onChange([...rows, createBlankImportRow(rows.length)])} size="small" startIcon={<AddRoundedIcon />}>Thêm hàng</Button>
      </Box>
      <TableContainer sx={{ flex: 1, maxHeight: 420 }}>
        <Table stickyHeader sx={{ minWidth: usesGrades ? 760 : 670, tableLayout: "fixed" }}>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: 48 }}>#</TableCell>
              {columns.map((column) => <TableCell key={column.key} sx={{ width: column.width }}>{column.label}</TableCell>)}
              <TableCell sx={{ width: 105 }}>Kiểm tra</TableCell>
              <TableCell sx={{ width: 52 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedRows.map((row, index) => {
              const rowIndex = page * rowsPerPage + index;
              return (
                <TableRow key={row.id} sx={{ "& td": { borderRight: "1px solid", borderRightColor: "divider", p: 0 } }}>
                  <TableCell align="center" sx={{ bgcolor: "background.default", color: "text.secondary", fontSize: 12 }}>{rowIndex + 1}</TableCell>
                  {columns.map((column, columnIndex) => (
                    <TableCell key={column.key}>
                      <TextField fullWidth value={row[column.key]} onChange={(event) => update(row.id, column.key, event.target.value)} onPaste={(event) => pasteAt(rowIndex, columnIndex, event)} placeholder={column.key === "fullName" && rowIndex === 0 ? "Dán dữ liệu tại đây" : ""} variant="standard" slotProps={{ input: { disableUnderline: true, sx: { fontSize: 13, minHeight: 38, px: 1.25 } } }} />
                    </TableCell>
                  ))}
                  <TableCell sx={{ px: "8px !important", textAlign: "center" }}>{isBlankImportRow(row) ? null : <Chip color={row.valid ? "success" : "warning"} label={row.valid ? "Hợp lệ" : "Thiếu"} size="small" sx={{ height: 22, fontSize: 10.5 }} />}</TableCell>
                  <TableCell align="center"><IconButton aria-label={`Xóa hàng ${rowIndex + 1}`} onClick={() => onChange(rows.filter((item) => item.id !== row.id))} size="small"><DeleteOutlineRoundedIcon fontSize="small" /></IconButton></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {rows.length > rowsPerPage ? (
        <TablePagination
          component="div"
          count={rows.length}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} trên ${count} học sinh`}
          onPageChange={(_, newPage) => setPage(newPage)}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[50]}
          sx={{ borderTop: "1px solid", borderColor: "divider" }}
        />
      ) : null}
    </Box>
  );
}
