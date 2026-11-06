import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { ClassImportPreviewRow } from "@/features/lcms/school-management/components/class-import-utils";

export function PreviewTable({
  detectedGrades,
  invalidCount,
  onDeselectAll,
  onSelectAllToImportStudents,
  onSelectAllValid,
  onToggleAll,
  onToggleRow,
  onViewStudents,
  rows,
  selectedIndices,
  sourceName,
  usesGrades,
}: {
  detectedGrades: string[];
  invalidCount: number;
  onDeselectAll: () => void;
  onSelectAllToImportStudents?: () => void;
  onSelectAllValid: () => void;
  onToggleAll: () => void;
  onToggleRow: (index: number) => void;
  onViewStudents: (row: ClassImportPreviewRow) => void;
  rows: ClassImportPreviewRow[];
  selectedIndices: Set<number>;
  sourceName: string;
  usesGrades: boolean;
}) {
  const allSelected = rows.length > 0 && selectedIndices.size === rows.length;
  const someSelected = selectedIndices.size > 0 && !allSelected;

  return (
    <Box sx={{ minWidth: 0 }}>
      <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
        <Chip color="primary" label={`${rows.length} lớp`} size="small" />
        {usesGrades ? <Chip label={`${detectedGrades.length} khối: ${detectedGrades.join(", ") || "—"}`} size="small" variant="outlined" /> : null}
        <Chip color="primary" label={`Đã chọn ${selectedIndices.size}/${rows.length} lớp`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
        {invalidCount ? <Chip color="warning" label={`${invalidCount} lớp trùng/lỗi`} size="small" /> : <Chip color="success" label="Tất cả hợp lệ" size="small" />}
        <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, ml: "auto" }}>
          {onSelectAllToImportStudents ? (
            <Button color="primary" onClick={onSelectAllToImportStudents} size="small" sx={{ fontSize: 12, fontWeight: 600, textTransform: "none" }} variant="outlined">
              Chọn tất cả để nạp HS
            </Button>
          ) : null}
          <Button onClick={onSelectAllValid} size="small" sx={{ fontSize: 12, textTransform: "none" }} variant="text">
            Chỉ tạo lớp mới
          </Button>
          <Button color="inherit" onClick={onDeselectAll} size="small" sx={{ fontSize: 12, textTransform: "none" }} variant="text">
            Bỏ chọn
          </Button>
          {sourceName ? (
            <Typography color="text.secondary" sx={{ display: { xs: "none", sm: "inline" }, pl: 1 }} variant="caption">
              Nguồn: {sourceName}
            </Typography>
          ) : null}
        </Box>
      </Box>
      <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, maxHeight: 360 }}>
        <Table size="small" stickyHeader sx={{ minWidth: 760 }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={onToggleAll}
                  size="small"
                />
              </TableCell>
              <TableCell>Dòng</TableCell>
              <TableCell>Tên lớp</TableCell>
              {usesGrades ? <TableCell>Khối</TableCell> : null}
              <TableCell>Giáo viên phụ trách</TableCell>
              <TableCell align="right">Sĩ số & Danh sách</TableCell>
              <TableCell>Kiểm tra</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => {
              const isSelected = selectedIndices.has(index);
              const isExisting = row.issues.includes("Lớp đã tồn tại trong trường");

              return (
                <TableRow
                  hover
                  key={`${row.sourceRow}-${row.name}`}
                  selected={isSelected}
                  sx={{
                    bgcolor: isSelected ? "action.hover" : undefined,
                    opacity: isSelected ? 1 : 0.65,
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onToggleRow(index)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{row.sourceRow}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.name || "—"}</TableCell>
                  {usesGrades ? <TableCell>{row.grade || "—"}</TableCell> : null}
                  <TableCell>{row.homeroomTeacher || "Chưa gán"}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "flex-end" }}>
                      <Typography sx={{ fontWeight: 600 }}>{row.studentCount}</Typography>
                      {row.students && row.students.length > 0 ? (
                        <Button
                          onClick={() => onViewStudents(row)}
                          size="small"
                          startIcon={<PeopleAltRoundedIcon fontSize="small" />}
                          sx={{ fontSize: 11, fontWeight: 600, minHeight: 24, px: 1, py: 0.25, textTransform: "none" }}
                          variant="outlined"
                        >
                          Xem {row.students.length} HS
                        </Button>
                      ) : null}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {row.valid ? (
                      <Chip color="success" icon={<CheckCircleRoundedIcon />} label="Hợp lệ" size="small" />
                    ) : isExisting ? (
                      <Chip
                        color="warning"
                        icon={<ErrorOutlineRoundedIcon />}
                        label={isSelected ? "Lớp đã tồn tại (chỉ nạp thêm HS)" : "Lớp đã tồn tại trong trường"}
                        size="small"
                      />
                    ) : (
                      <Box sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>
                        <ErrorOutlineRoundedIcon color="warning" fontSize="small" />
                        <Typography color="warning.main" variant="caption">{row.issues.join(" · ")}</Typography>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export function PreviewSkeleton() {
  return <Box sx={{ display: "grid", gap: 1 }}><Box sx={{ display: "flex", gap: 1 }}><Skeleton height={28} variant="rounded" width={90} /><Skeleton height={28} variant="rounded" width={130} /><Skeleton height={28} variant="rounded" width={110} /></Box><Skeleton height={44} variant="rounded" />{Array.from({ length: 5 }, (_, index) => <Skeleton height={38} key={index} variant="rounded" />)}</Box>;
}
