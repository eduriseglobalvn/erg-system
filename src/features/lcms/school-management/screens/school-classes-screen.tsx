import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ClassRoundedIcon from "@mui/icons-material/ClassRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { type ReactNode, useMemo, useState } from "react";
import { ClassImportDialog } from "@/features/lcms/school-management/components/class-import-dialog";
import { SchoolPageShell } from "@/features/lcms/school-management/components/school-page-shell";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import type { SchoolClass, StudentImportRow } from "@/features/lcms/school-management/types/school-management-types";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { alpha } from "@mui/material/styles";

export default function SchoolClassesScreen() {
  const { addClasses, addStudents, selectedSchool } = useSchoolManagementContext();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const classes = useMemo(() => {
    if (!selectedSchool) return [];
    return selectedSchool.classes.filter((item) =>
      `${item.name} ${item.homeroomTeacher || ""}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [selectedSchool, search]);

  if (!selectedSchool) return null;

  const totalStudents = selectedSchool.classes.reduce((sum, c) => sum + (c.studentCount || 0), 0);
  const assignedTeachers = selectedSchool.classes.filter((c) => Boolean(c.homeroomTeacher)).length;

  async function handleImport(classList: Array<Omit<SchoolClass, "id">>, students?: StudentImportRow[]) {
    await addClasses(classList);
    if (students && students.length > 0) {
      await addStudents(
        students.map((row) => ({
          code: row.code || `${selectedSchool!.id}-${Date.now()}`,
          fullName: row.fullName,
          birthDate: row.birthDate,
          grade: row.grade,
          className: row.className,
          guardianPhone: row.guardianPhone,
          subjectIds: [],
          status: "studying",
        }))
      );
    }
  }

  return (
    <SchoolPageShell
      title="Lớp học"
      description="Quản lý lớp, khối và sĩ số theo contract backend; phân công giáo viên chủ nhiệm và hồ sơ lớp."
      action={
        <Button
          onClick={() => setDialogOpen(true)}
          startIcon={<AddRoundedIcon sx={{ fontSize: 18 }} />}
          variant="contained"
          sx={{
            bgcolor: ergEnterpriseTokens.color.primary,
            borderRadius: "10px",
            boxShadow: `0 2px 8px ${alpha(ergEnterpriseTokens.color.primary, 0.28)}`,
            color: "#FFFFFF",
            fontSize: "0.85rem",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            px: 2,
            py: 0.85,
            textTransform: "none",
            transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
            "&:hover": {
              bgcolor: ergEnterpriseTokens.color.primaryHover,
              boxShadow: `0 4px 14px ${alpha(ergEnterpriseTokens.color.primary, 0.38)}`,
            },
            "&:active": {
              bgcolor: ergEnterpriseTokens.color.primaryHover,
              transform: "scale(0.985)",
            },
          }}
        >
          Thêm lớp
        </Button>
      }
    >
      {/* KPI Stat Cards */}
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, mb: 2.5 }}>
        <ClassMetricCard
          icon={<ClassRoundedIcon sx={{ fontSize: 20 }} />}
          iconBg={alpha(ergEnterpriseTokens.color.primary, 0.08)}
          iconColor={ergEnterpriseTokens.color.primary}
          label="Tổng số lớp"
          value={selectedSchool.classes.length}
          subtext={`Thuộc ${selectedSchool.grades.length} khối đào tạo`}
        />
        <ClassMetricCard
          icon={<GroupsRoundedIcon sx={{ fontSize: 20 }} />}
          iconBg={alpha(ergEnterpriseTokens.color.success, 0.12)}
          iconColor="#15803D"
          label="Tổng sĩ số"
          value={totalStudents}
          subtext={`Trung bình ~${Math.round(totalStudents / (selectedSchool.classes.length || 1))} học sinh/lớp`}
        />
        <ClassMetricCard
          icon={<PersonRoundedIcon sx={{ fontSize: 20 }} />}
          iconBg="rgba(175, 82, 222, 0.12)"
          iconColor="#7E22CE"
          label="Giáo viên chủ nhiệm"
          value={`${assignedTeachers}/${selectedSchool.classes.length}`}
          subtext={`${Math.round((assignedTeachers / (selectedSchool.classes.length || 1)) * 100)}% lớp đã có GVCN`}
        />
      </Box>

      {/* Main Table Surface */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: "#FFFFFF",
          borderRadius: "16px",
          border: `1px solid ${ergEnterpriseTokens.color.border}`,
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02), 0 10px 28px -4px rgba(0, 0, 0, 0.04)",
          overflow: "hidden",
        }}
      >
        {/* Table Toolbar */}
        <Box
          sx={{
            alignItems: { xs: "stretch", sm: "center" },
            borderBottom: `1px solid ${ergEnterpriseTokens.color.border}`,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1.5,
            justifyContent: "space-between",
            p: 2,
          }}
        >
          <Box>
            <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em" }}>
              Danh sách lớp học
            </Typography>
            <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.78rem", mt: 0.25 }}>
              Hiển thị {classes.length} lớp học trong niên khóa {selectedSchool.academicYear}
            </Typography>
          </Box>

          <TextField
            placeholder="Tìm lớp hoặc giáo viên chủ nhiệm..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: 18 }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              width: { xs: "100%", sm: 300 },
              "& .MuiOutlinedInput-root": {
                bgcolor: ergEnterpriseTokens.color.surfaceMuted,
                borderRadius: "10px",
                fontSize: "0.85rem",
                "& fieldset": { borderColor: ergEnterpriseTokens.color.border },
                "&:hover fieldset": { borderColor: "rgba(0, 0, 0, 0.18)" },
                "&.Mui-focused": {
                  bgcolor: "#FFFFFF",
                  "& fieldset": {
                    borderColor: ergEnterpriseTokens.color.primary,
                    boxShadow: `0 0 0 3px ${alpha(ergEnterpriseTokens.color.primary, 0.15)}`,
                  },
                },
              },
            }}
          />
        </Box>

        {/* Table View */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headerCellSx}>Lớp học</TableCell>
                <TableCell sx={headerCellSx}>Khối</TableCell>
                <TableCell sx={headerCellSx}>Giáo viên chủ nhiệm</TableCell>
                <TableCell align="right" sx={headerCellSx}>Sĩ số</TableCell>
                <TableCell sx={headerCellSx}>Tình trạng</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {classes.map((item) => {
                const status = item.status?.toUpperCase();
                const isActive = status === "ACTIVE";
                const label = isActive ? "Đang hoạt động" : status || "Chưa xác định";

                return (
                  <TableRow
                    hover
                    key={item.id}
                    sx={{
                      transition: "background-color 0.12s ease",
                      "&:hover": { bgcolor: `${alpha(ergEnterpriseTokens.color.primary, 0.035)} !important` },
                    }}
                  >
                    {/* Class Name */}
                    <TableCell sx={{ borderBottom: "1px solid rgba(0, 0, 0, 0.04)", py: 1.5 }}>
                      <Box sx={{ alignItems: "center", display: "inline-flex", gap: 1 }}>
                        <Box
                          sx={{
                            bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.08),
                            borderRadius: "7px",
                            color: ergEnterpriseTokens.color.primary,
                            fontSize: "0.825rem",
                            fontWeight: 600,
                            px: 1,
                            py: 0.35,
                          }}
                        >
                          {item.name}
                        </Box>
                        <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.75rem", fontWeight: 500 }}>
                          {item.academicYear || selectedSchool.academicYear}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Grade */}
                    <TableCell sx={{ borderBottom: "1px solid rgba(0, 0, 0, 0.04)", py: 1.5 }}>
                      <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "0.825rem", fontWeight: 600 }}>
                        {item.grade ? `Khối ${item.grade}` : "Chưa gán"}
                      </Typography>
                    </TableCell>

                    {/* Homeroom Teacher */}
                    <TableCell sx={{ borderBottom: "1px solid rgba(0, 0, 0, 0.04)", py: 1.5 }}>
                      <Box sx={{ alignItems: "center", display: "inline-flex", gap: 0.75 }}>
                        <PersonRoundedIcon sx={{ color: item.homeroomTeacher ? ergEnterpriseTokens.color.primary : "#C7C7CC", fontSize: 16 }} />
                        <Typography
                          sx={{
                            color: item.homeroomTeacher ? ergEnterpriseTokens.color.text : ergEnterpriseTokens.color.textMuted,
                            fontSize: "0.825rem",
                            fontWeight: item.homeroomTeacher ? 650 : 500,
                            fontStyle: item.homeroomTeacher ? "normal" : "italic",
                          }}
                        >
                          {item.homeroomTeacher || "Chưa gán"}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Student Count */}
                    <TableCell align="right" sx={{ borderBottom: "1px solid rgba(0, 0, 0, 0.04)", py: 1.5 }}>
                      <Box
                        sx={{
                          bgcolor: "rgba(0, 0, 0, 0.04)",
                          borderRadius: "9999px",
                          color: ergEnterpriseTokens.color.text,
                          display: "inline-block",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          lineHeight: 1,
                          px: 1.25,
                          py: 0.4,
                        }}
                      >
                        {item.studentCount} học sinh
                      </Box>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell sx={{ borderBottom: "1px solid rgba(0, 0, 0, 0.04)", py: 1.5 }}>
                      <Box
                        sx={{
                          alignItems: "center",
                          bgcolor: isActive ? alpha(ergEnterpriseTokens.color.success, 0.12) : "rgba(0, 0, 0, 0.05)",
                          border: `1px solid ${isActive ? "${alpha(ergEnterpriseTokens.color.success, 0.22)}" : "rgba(0, 0, 0, 0.1)"}`,
                          borderRadius: "9999px",
                          color: isActive ? "#15803D" : ergEnterpriseTokens.color.textMuted,
                          display: "inline-flex",
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          gap: 0.65,
                          lineHeight: 1,
                          px: 1,
                          py: 0.4,
                        }}
                      >
                        <Box
                          sx={{
                            bgcolor: isActive ? ergEnterpriseTokens.color.success : ergEnterpriseTokens.color.textMuted,
                            borderRadius: "50%",
                            height: 6,
                            width: 6,
                          }}
                        />
                        {label}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {!classes.length ? (
          <Box sx={{ p: 5, textAlign: "center" }}>
            <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.85rem" }}>
              Không tìm thấy lớp học phù hợp với từ khóa tìm kiếm.
            </Typography>
          </Box>
        ) : null}
      </Paper>

      {dialogOpen ? (
        <ClassImportDialog
          classLabel="Lớp học"
          existingClassNames={selectedSchool.classes.map((item) => item.name)}
          grades={selectedSchool.grades}
          onClose={() => setDialogOpen(false)}
          onImport={handleImport}
          usesGrades={selectedSchool.schoolType !== "university" && selectedSchool.schoolType !== "training-center"}
        />
      ) : null}
    </SchoolPageShell>
  );
}

const headerCellSx = {
  bgcolor: "rgba(250, 250, 252, 0.96)",
  borderBottom: `1px solid ${ergEnterpriseTokens.color.border}`,
  color: ergEnterpriseTokens.color.textMuted,
  fontSize: "0.72rem",
  fontWeight: 600,
  letterSpacing: "0.04em",
  py: 1.35,
  textTransform: "uppercase",
};

function ClassMetricCard({
  icon,
  iconBg,
  iconColor,
  label,
  subtext,
  value,
}: {
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  subtext: string;
  value: number | string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "#FFFFFF",
        borderRadius: "16px",
        border: `1px solid ${ergEnterpriseTokens.color.border}`,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02), 0 8px 18px -4px rgba(0, 0, 0, 0.03)",
        p: 2.25,
        transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
        "&:hover": {
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.04), 0 12px 24px -4px rgba(0, 0, 0, 0.06)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.78rem", fontWeight: 600 }}>
          {label}
        </Typography>
        <Box
          sx={{
            alignItems: "center",
            bgcolor: iconBg,
            borderRadius: "10px",
            color: iconColor,
            display: "flex",
            height: 32,
            justifyContent: "center",
            width: 32,
          }}
        >
          {icon}
        </Box>
      </Box>
      <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "1.65rem", fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.72rem", fontWeight: 500, mt: 0.5 }}>
        {subtext}
      </Typography>
    </Paper>
  );
}
