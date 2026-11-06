import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import { StudentScopeNavigator } from "@/features/lcms/school-management/components/students/student-scope-navigator";
import type { PartnerSchool, SchoolStudent } from "@/features/lcms/school-management/types/school-management-types";
import { AppleMetricCard } from "@/features/lcms/school-management/components/students/school-student-directory/apple-metric-card";
import { filterSchoolStudents, getAvatarStyle, getInitials, statusMeta } from "@/features/lcms/school-management/components/students/school-student-directory/student-directory-utils";
import { StudentProfileDrawer } from "@/features/lcms/school-management/components/students/school-student-directory/student-profile-drawer";
import { tableHeadCellSx } from "@/features/lcms/school-management/components/students/school-student-directory/table-head-cell-sx";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { alpha } from "@mui/material/styles";

export function SchoolStudentDirectoryWorkspace({ school }: { school: PartnerSchool }) {
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<SchoolStudent | null>(null);

  const filtered = useMemo(
    () => filterSchoolStudents(school.students, { selectedGrade, selectedClass, status, search }),
    [school.students, search, selectedClass, selectedGrade, status],
  );

  const visible = filtered.slice(page * 12, page * 12 + 12);
  const scopeLabel = selectedClass !== "all" ? `Lớp ${selectedClass}` : selectedGrade !== "all" ? `Khối ${selectedGrade}` : "Toàn trường";
  const atRisk = filtered.filter((student) => student.status === "at-risk").length;
  const assigned = filtered.filter((student) => student.subjectIds.length > 0).length;

  function resetPage() { setPage(0); }

  return (
    <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "minmax(0,1fr)", lg: "256px minmax(0,1fr)" } }}>
      <StudentScopeNavigator
        school={school}
        selectedClass={selectedClass}
        selectedGrade={selectedGrade}
        onSelectClass={(className, grade) => { setSelectedClass(className); setSelectedGrade(grade); resetPage(); }}
        onSelectGrade={(grade) => { setSelectedGrade(grade); setSelectedClass("all"); resetPage(); }}
        onSelectSchool={() => { setSelectedGrade("all"); setSelectedClass("all"); resetPage(); }}
      />

      <Box sx={{ minWidth: 0 }}>
        {/* Apple Metric KPI Cards */}
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, mb: 2 }}>
          <AppleMetricCard
            icon={<GroupsRoundedIcon sx={{ fontSize: 20 }} />}
            iconColor={ergEnterpriseTokens.color.primary}
            iconBg={alpha(ergEnterpriseTokens.color.primary, 0.08)}
            label={`Người học · ${scopeLabel}`}
            value={filtered.length}
            subtext="Học sinh trong phạm vi"
          />
          <AppleMetricCard
            icon={<MenuBookRoundedIcon sx={{ fontSize: 20 }} />}
            iconColor="#15803D"
            iconBg={alpha(ergEnterpriseTokens.color.success, 0.12)}
            label="Đã gán môn học"
            value={`${assigned}/${filtered.length}`}
            subtext={`${Math.round((assigned / (filtered.length || 1)) * 100)}% đã được xếp môn`}
          />
          <AppleMetricCard
            icon={<WarningAmberRoundedIcon sx={{ fontSize: 20 }} />}
            iconColor={atRisk ? "#B45309" : "#15803D"}
            iconBg={atRisk ? alpha(ergEnterpriseTokens.color.warning, 0.12) : alpha(ergEnterpriseTokens.color.success, 0.12)}
            label="Cần hỗ trợ"
            value={atRisk}
            subtext={atRisk ? "Cần giáo viên lưu ý" : "Tất cả học sinh ổn định"}
          />
        </Box>

        {/* Main Students Table Surface */}
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
          {/* Header & Filter Toolbar */}
          <Box
            sx={{
              alignItems: { xs: "stretch", md: "center" },
              borderBottom: `1px solid ${ergEnterpriseTokens.color.border}`,
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 1.5,
              justifyContent: "space-between",
              p: 2,
            }}
          >
            <Box>
              <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
                <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em" }}>
                  {scopeLabel}
                </Typography>
                <Box
                  sx={{
                    bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.08),
                    borderRadius: "9999px",
                    color: ergEnterpriseTokens.color.primary,
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    px: 1,
                    py: 0.25,
                  }}
                >
                  {filtered.length} người học
                </Box>
              </Box>
              <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.78rem", mt: 0.35 }}>
                Chọn một người học để xem hồ sơ và các môn đang theo học
              </Typography>
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <TextField
                placeholder="Tìm tên, mã, số điện thoại..."
                size="small"
                value={search}
                onChange={(event) => { setSearch(event.target.value); resetPage(); }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: 18 }} />
                      </InputAdornment>
                    ),
                    endAdornment: search ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => { setSearch(""); resetPage(); }} sx={{ p: 0.25 }}>
                          <CloseRoundedIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  },
                }}
                sx={{
                  minWidth: { xs: "100%", sm: 240 },
                  "& .MuiOutlinedInput-root": {
                    bgcolor: ergEnterpriseTokens.color.surfaceMuted,
                    borderRadius: "10px",
                    fontSize: "0.85rem",
                    transition: "all 0.15s ease",
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

              <TextField
                select
                size="small"
                value={status}
                onChange={(event) => { setStatus(event.target.value); resetPage(); }}
                sx={{
                  minWidth: 140,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: ergEnterpriseTokens.color.surfaceMuted,
                    borderRadius: "10px",
                    fontSize: "0.85rem",
                    "& fieldset": { borderColor: ergEnterpriseTokens.color.border },
                    "&:hover fieldset": { borderColor: "rgba(0, 0, 0, 0.18)" },
                    "&.Mui-focused fieldset": {
                      borderColor: ergEnterpriseTokens.color.primary,
                      boxShadow: `0 0 0 3px ${alpha(ergEnterpriseTokens.color.primary, 0.15)}`,
                    },
                  },
                }}
              >
                <MenuItem value="all">Mọi trạng thái</MenuItem>
                <MenuItem value="studying">Đang học</MenuItem>
                <MenuItem value="at-risk">Cần hỗ trợ</MenuItem>
                <MenuItem value="inactive">Ngừng học</MenuItem>
              </TextField>
            </Box>
          </Box>

          {/* Table Container */}
          <TableContainer sx={{ maxHeight: "min(56vh, 600px)" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={tableHeadCellSx}>Mã người học</TableCell>
                  <TableCell sx={tableHeadCellSx}>Họ và tên</TableCell>
                  <TableCell sx={tableHeadCellSx}>Khối / lớp</TableCell>
                  <TableCell sx={tableHeadCellSx}>Môn đang học</TableCell>
                  <TableCell sx={tableHeadCellSx}>Liên hệ</TableCell>
                  <TableCell sx={tableHeadCellSx}>Trạng thái</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.map((student) => {
                  const meta = statusMeta[student.status];
                  const avatarStyle = getAvatarStyle(student.fullName);
                  const initials = getInitials(student.fullName);

                  return (
                    <TableRow
                      hover
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      sx={{
                        cursor: "pointer",
                        transition: "background-color 0.12s ease",
                        "&:hover": { bgcolor: `${alpha(ergEnterpriseTokens.color.primary, 0.035)} !important` },
                      }}
                    >
                      {/* Code Cell */}
                      <TableCell sx={{ borderBottom: "1px solid rgba(0, 0, 0, 0.04)", py: 1.5, verticalAlign: "middle", width: 130 }}>
                        <Box
                          component="span"
                          sx={{
                            alignItems: "center",
                            bgcolor: "rgba(0, 0, 0, 0.04)",
                            border: `1px solid ${ergEnterpriseTokens.color.border}`,
                            borderRadius: "6px",
                            color: ergEnterpriseTokens.color.text,
                            display: "inline-flex",
                            fontFamily: '"SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            height: 26,
                            letterSpacing: "0.02em",
                            lineHeight: 1,
                            px: 1,
                          }}
                        >
                          {student.code}
                        </Box>
                      </TableCell>

                      {/* Full Name & Avatar */}
                      <TableCell sx={{ borderBottom: "1px solid rgba(0, 0, 0, 0.04)", py: 1.35 }}>
                        <Box sx={{ alignItems: "center", display: "flex", gap: 1.25 }}>
                          <Avatar
                            sx={{
                              background: avatarStyle.bg,
                              boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
                              color: avatarStyle.color,
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              height: 32,
                              width: 32,
                            }}
                          >
                            {initials}
                          </Avatar>
                          <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "0.85rem", fontWeight: 600 }}>
                            {student.fullName}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Class & Grade */}
                      <TableCell sx={{ borderBottom: "1px solid rgba(0, 0, 0, 0.04)", py: 1.35 }}>
                        <Box sx={{ alignItems: "center", display: "inline-flex", gap: 0.75 }}>
                          <Box
                            sx={{
                              bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.06),
                              borderRadius: "6px",
                              color: ergEnterpriseTokens.color.primary,
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              px: 0.85,
                              py: 0.25,
                            }}
                          >
                            {student.className || "Chưa xếp lớp"}
                          </Box>
                          <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.72rem", fontWeight: 500 }}>
                            Khối {student.grade}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Subjects Count */}
                      <TableCell sx={{ borderBottom: "1px solid rgba(0, 0, 0, 0.04)", py: 1.35 }}>
                        <Box
                          sx={{
                            bgcolor: student.subjectIds.length ? alpha(ergEnterpriseTokens.color.primary, 0.08) : alpha(ergEnterpriseTokens.color.warning, 0.08),
                            border: `1px solid ${student.subjectIds.length ? alpha(ergEnterpriseTokens.color.primary, 0.18) : alpha(ergEnterpriseTokens.color.warning, 0.18)}`,
                            borderRadius: "9999px",
                            color: student.subjectIds.length ? ergEnterpriseTokens.color.primary : "#B45309",
                            display: "inline-flex",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            lineHeight: 1,
                            px: 1,
                            py: 0.4,
                          }}
                        >
                          {student.subjectIds.length} môn
                        </Box>
                      </TableCell>

                      {/* Contact Phone */}
                      <TableCell sx={{ borderBottom: "1px solid rgba(0, 0, 0, 0.04)", py: 1.35 }}>
                        {student.guardianPhone ? (
                          <Box sx={{ alignItems: "center", display: "inline-flex", gap: 0.5 }}>
                            <PhoneRoundedIcon sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: 14 }} />
                            <Typography sx={{ color: "#4B5563", fontFamily: "var(--font-mono)", fontSize: "0.8rem", fontWeight: 550 }}>
                              {student.guardianPhone}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography sx={{ color: "#9CA3AF", fontSize: "0.75rem", fontStyle: "italic" }}>
                            Chưa cập nhật
                          </Typography>
                        )}
                      </TableCell>

                      {/* Apple Status Badge */}
                      <TableCell sx={{ borderBottom: "1px solid rgba(0, 0, 0, 0.04)", py: 1.35 }}>
                        <Box
                          sx={{
                            alignItems: "center",
                            bgcolor: meta.bg,
                            border: `1px solid ${meta.border}`,
                            borderRadius: "9999px",
                            color: meta.color,
                            display: "inline-flex",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            gap: 0.65,
                            lineHeight: 1,
                            px: 1,
                            py: 0.45,
                          }}
                        >
                          <Box sx={{ bgcolor: meta.dot, borderRadius: "50%", height: 6, width: 6 }} />
                          {meta.label}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Empty State */}
          {!filtered.length ? (
            <Box sx={{ p: 6, textAlign: "center" }}>
              <Box
                sx={{
                  alignItems: "center",
                  bgcolor: "rgba(0, 0, 0, 0.03)",
                  borderRadius: "50%",
                  color: ergEnterpriseTokens.color.textMuted,
                  display: "inline-flex",
                  height: 48,
                  justifyContent: "center",
                  mb: 1.5,
                  width: 48,
                }}
              >
                <SearchRoundedIcon sx={{ fontSize: 24 }} />
              </Box>
              <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "0.95rem", fontWeight: 600 }}>
                Không tìm thấy người học
              </Typography>
              <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.8rem", mt: 0.5 }}>
                Không có người học nào trong phạm vi này hoặc từ khóa tìm kiếm không khớp.
              </Typography>
            </Box>
          ) : null}

          {/* Apple Table Pagination */}
          <TablePagination
            component="div"
            count={filtered.length}
            onPageChange={(_, value) => setPage(value)}
            page={page}
            rowsPerPage={12}
            rowsPerPageOptions={[12]}
            sx={{
              borderTop: `1px solid ${ergEnterpriseTokens.color.border}`,
              color: ergEnterpriseTokens.color.textMuted,
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                fontSize: "0.8rem",
                fontWeight: 550,
              },
            }}
          />
        </Paper>
      </Box>

      {/* Apple Inspector Sheet Drawer */}
      <StudentProfileDrawer school={school} student={selectedStudent} onClose={() => setSelectedStudent(null)} />
    </Box>
  );
}
