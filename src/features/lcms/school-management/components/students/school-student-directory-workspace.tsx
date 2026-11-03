import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { type ReactNode, useMemo, useState } from "react";
import { StudentScopeNavigator } from "@/features/lcms/school-management/components/students/student-scope-navigator";
import type { PartnerSchool, SchoolStudent } from "@/features/lcms/school-management/types/school-management-types";

const AVATAR_GRADIENTS = [
  { bg: "linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)", color: "#3730A3" },
  { bg: "linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)", color: "#0369A1" },
  { bg: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)", color: "#92400E" },
  { bg: "linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)", color: "#166534" },
  { bg: "linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)", color: "#9D174D" },
  { bg: "linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)", color: "#5B21B6" },
  { bg: "linear-gradient(135deg, #FFEDD5 0%, #FED7AA 100%)", color: "#C2410C" },
];

function getInitials(name?: string | null) {
  if (!name) return "HS";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function getAvatarStyle(name?: string | null) {
  const safeName = name || "HS";
  let hash = 0;
  for (let i = 0; i < safeName.length; i++) {
    hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

const statusMeta = {
  studying: {
    bg: "rgba(52, 199, 89, 0.12)",
    border: "rgba(52, 199, 89, 0.22)",
    color: "#15803D",
    dot: "#34C759",
    label: "Đang học",
  },
  "at-risk": {
    bg: "rgba(255, 149, 0, 0.12)",
    border: "rgba(255, 149, 0, 0.22)",
    color: "#B45309",
    dot: "#FF9500",
    label: "Cần hỗ trợ",
  },
  inactive: {
    bg: "rgba(0, 0, 0, 0.05)",
    border: "rgba(0, 0, 0, 0.1)",
    color: "#6E6E73",
    dot: "#86868B",
    label: "Ngừng học",
  },
} as const;

export function SchoolStudentDirectoryWorkspace({ school }: { school: PartnerSchool }) {
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<SchoolStudent | null>(null);

  const filtered = useMemo(() => school.students.filter((student) => {
    const matchesScope = (selectedGrade === "all" || student.grade === selectedGrade) && (selectedClass === "all" || student.className === selectedClass);
    const matchesStatus = status === "all" || student.status === status;
    const matchesSearch = `${student.fullName} ${student.code} ${student.guardianPhone}`.toLowerCase().includes(search.trim().toLowerCase());
    return matchesScope && matchesStatus && matchesSearch;
  }), [school.students, search, selectedClass, selectedGrade, status]);

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
            iconColor="#0071E3"
            iconBg="rgba(0, 113, 227, 0.08)"
            label={`Người học · ${scopeLabel}`}
            value={filtered.length}
            subtext="Học sinh trong phạm vi"
          />
          <AppleMetricCard
            icon={<MenuBookRoundedIcon sx={{ fontSize: 20 }} />}
            iconColor="#15803D"
            iconBg="rgba(52, 199, 89, 0.12)"
            label="Đã gán môn học"
            value={`${assigned}/${filtered.length}`}
            subtext={`${Math.round((assigned / (filtered.length || 1)) * 100)}% đã được xếp môn`}
          />
          <AppleMetricCard
            icon={<WarningAmberRoundedIcon sx={{ fontSize: 20 }} />}
            iconColor={atRisk ? "#B45309" : "#15803D"}
            iconBg={atRisk ? "rgba(255, 149, 0, 0.12)" : "rgba(52, 199, 89, 0.12)"}
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
            border: "1px solid rgba(0, 0, 0, 0.06)",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02), 0 10px 28px -4px rgba(0, 0, 0, 0.04)",
            overflow: "hidden",
          }}
        >
          {/* Header & Filter Toolbar */}
          <Box
            sx={{
              alignItems: { xs: "stretch", md: "center" },
              borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 1.5,
              justifyContent: "space-between",
              p: 2,
            }}
          >
            <Box>
              <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
                <Typography sx={{ color: "#1D1D1F", fontSize: "1.05rem", fontWeight: 800, letterSpacing: "-0.015em" }}>
                  {scopeLabel}
                </Typography>
                <Box
                  sx={{
                    bgcolor: "rgba(0, 113, 227, 0.08)",
                    borderRadius: "9999px",
                    color: "#0071E3",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    px: 1,
                    py: 0.25,
                  }}
                >
                  {filtered.length} người học
                </Box>
              </Box>
              <Typography sx={{ color: "#86868B", fontSize: "0.78rem", mt: 0.35 }}>
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
                        <SearchRoundedIcon sx={{ color: "#86868B", fontSize: 18 }} />
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
                    bgcolor: "#F5F5F7",
                    borderRadius: "10px",
                    fontSize: "0.85rem",
                    transition: "all 0.15s ease",
                    "& fieldset": { borderColor: "rgba(0, 0, 0, 0.08)" },
                    "&:hover fieldset": { borderColor: "rgba(0, 0, 0, 0.18)" },
                    "&.Mui-focused": {
                      bgcolor: "#FFFFFF",
                      "& fieldset": {
                        borderColor: "#0071E3",
                        boxShadow: "0 0 0 3px rgba(0, 113, 227, 0.15)",
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
                    bgcolor: "#F5F5F7",
                    borderRadius: "10px",
                    fontSize: "0.85rem",
                    "& fieldset": { borderColor: "rgba(0, 0, 0, 0.08)" },
                    "&:hover fieldset": { borderColor: "rgba(0, 0, 0, 0.18)" },
                    "&.Mui-focused fieldset": {
                      borderColor: "#0071E3",
                      boxShadow: "0 0 0 3px rgba(0, 113, 227, 0.15)",
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
                        "&:hover": { bgcolor: "rgba(0, 113, 227, 0.035) !important" },
                      }}
                    >
                      {/* Code Cell */}
                      <TableCell sx={{ borderBottom: "1px solid rgba(0, 0, 0, 0.04)", py: 1.5, verticalAlign: "middle", width: 130 }}>
                        <Box
                          component="span"
                          sx={{
                            alignItems: "center",
                            bgcolor: "rgba(0, 0, 0, 0.04)",
                            border: "1px solid rgba(0, 0, 0, 0.06)",
                            borderRadius: "6px",
                            color: "#1D1D1F",
                            display: "inline-flex",
                            fontFamily: '"SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
                            fontSize: "0.78rem",
                            fontWeight: 650,
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
                              fontWeight: 750,
                              height: 32,
                              width: 32,
                            }}
                          >
                            {initials}
                          </Avatar>
                          <Typography sx={{ color: "#1D1D1F", fontSize: "0.85rem", fontWeight: 750 }}>
                            {student.fullName}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Class & Grade */}
                      <TableCell sx={{ borderBottom: "1px solid rgba(0, 0, 0, 0.04)", py: 1.35 }}>
                        <Box sx={{ alignItems: "center", display: "inline-flex", gap: 0.75 }}>
                          <Box
                            sx={{
                              bgcolor: "rgba(0, 113, 227, 0.06)",
                              borderRadius: "6px",
                              color: "#0071E3",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              px: 0.85,
                              py: 0.25,
                            }}
                          >
                            {student.className || "Chưa xếp lớp"}
                          </Box>
                          <Typography sx={{ color: "#86868B", fontSize: "0.72rem", fontWeight: 500 }}>
                            Khối {student.grade}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Subjects Count */}
                      <TableCell sx={{ borderBottom: "1px solid rgba(0, 0, 0, 0.04)", py: 1.35 }}>
                        <Box
                          sx={{
                            bgcolor: student.subjectIds.length ? "rgba(0, 113, 227, 0.08)" : "rgba(255, 149, 0, 0.08)",
                            border: `1px solid ${student.subjectIds.length ? "rgba(0, 113, 227, 0.18)" : "rgba(255, 149, 0, 0.18)"}`,
                            borderRadius: "9999px",
                            color: student.subjectIds.length ? "#0071E3" : "#B45309",
                            display: "inline-flex",
                            fontSize: "0.72rem",
                            fontWeight: 700,
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
                            <PhoneRoundedIcon sx={{ color: "#86868B", fontSize: 14 }} />
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
                            fontWeight: 700,
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
                  color: "#86868B",
                  display: "inline-flex",
                  height: 48,
                  justifyContent: "center",
                  mb: 1.5,
                  width: 48,
                }}
              >
                <SearchRoundedIcon sx={{ fontSize: 24 }} />
              </Box>
              <Typography sx={{ color: "#1D1D1F", fontSize: "0.95rem", fontWeight: 750 }}>
                Không tìm thấy người học
              </Typography>
              <Typography sx={{ color: "#86868B", fontSize: "0.8rem", mt: 0.5 }}>
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
              borderTop: "1px solid rgba(0, 0, 0, 0.06)",
              color: "#6E6E73",
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

const tableHeadCellSx = {
  bgcolor: "rgba(250, 250, 252, 0.95)",
  borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
  color: "#86868B",
  fontSize: "0.72rem",
  fontWeight: 700,
  letterSpacing: "0.04em",
  py: 1.25,
  textTransform: "uppercase",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};

function AppleMetricCard({
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
        border: "1px solid rgba(0, 0, 0, 0.06)",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02), 0 8px 18px -4px rgba(0, 0, 0, 0.03)",
        p: 2,
        transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
        "&:hover": {
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.04), 0 12px 24px -4px rgba(0, 0, 0, 0.06)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography sx={{ color: "#6E6E73", fontSize: "0.78rem", fontWeight: 650 }}>
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
      <Typography sx={{ color: "#1D1D1F", fontSize: "1.65rem", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography sx={{ color: "#86868B", fontSize: "0.72rem", fontWeight: 500, mt: 0.5 }}>
        {subtext}
      </Typography>
    </Paper>
  );
}

function StudentProfileDrawer({
  school,
  student,
  onClose,
}: {
  school: PartnerSchool;
  student: SchoolStudent | null;
  onClose: () => void;
}) {
  const subjects = school.subjects.filter((subject) => student?.subjectIds.includes(subject.id));
  const meta = student ? statusMeta[student.status] : null;
  const avatarStyle = student ? getAvatarStyle(student.fullName) : null;
  const initials = student ? getInitials(student.fullName) : "";

  return (
    <Drawer
      anchor="right"
      open={Boolean(student)}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            bgcolor: "#FBFBFD",
            borderRadius: { sm: "20px 0 0 20px" },
            boxShadow: "0 20px 48px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.06)",
            width: { xs: "100%", sm: 440 },
          },
        },
      }}
    >
      {student && meta && avatarStyle ? (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%", p: 3 }}>
          {/* Top Bar with Close Button */}
          <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 2.5 }}>
            <Typography sx={{ color: "#86868B", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Hồ sơ học sinh
            </Typography>
            <IconButton
              aria-label="Đóng hồ sơ"
              onClick={onClose}
              sx={{
                bgcolor: "rgba(0, 0, 0, 0.05)",
                color: "#1D1D1F",
                height: 32,
                transition: "all 0.15s ease",
                width: 32,
                "&:hover": { bgcolor: "rgba(0, 0, 0, 0.09)", transform: "scale(1.05)" },
              }}
            >
              <CloseRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          {/* Hero Profile Header */}
          <Box
            sx={{
              alignItems: "center",
              bgcolor: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid rgba(0, 0, 0, 0.06)",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02)",
              display: "flex",
              flexDirection: "column",
              p: 3,
              textAlign: "center",
            }}
          >
            <Avatar
              sx={{
                background: avatarStyle.bg,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                color: avatarStyle.color,
                fontSize: "1.25rem",
                fontWeight: 800,
                height: 60,
                mb: 1.5,
                width: 60,
              }}
            >
              {initials}
            </Avatar>
            <Typography sx={{ color: "#1D1D1F", fontSize: "1.2rem", fontWeight: 800, letterSpacing: "-0.015em" }}>
              {student.fullName}
            </Typography>
            <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 0.75, justifyContent: "center", mt: 1.25 }}>
              <Box
                sx={{
                  bgcolor: "rgba(0, 0, 0, 0.05)",
                  borderRadius: "6px",
                  color: "#3A3A3C",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  px: 1,
                  py: 0.35,
                }}
              >
                {student.code}
              </Box>
              <Box
                sx={{
                  alignItems: "center",
                  bgcolor: meta.bg,
                  border: `1px solid ${meta.border}`,
                  borderRadius: "9999px",
                  color: meta.color,
                  display: "inline-flex",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  gap: 0.6,
                  px: 1,
                  py: 0.35,
                }}
              >
                <Box sx={{ bgcolor: meta.dot, borderRadius: "50%", height: 6, width: 6 }} />
                {meta.label}
              </Box>
            </Box>
          </Box>

          {/* Academic Info Inset Card */}
          <Typography sx={{ color: "#1D1D1F", fontSize: "0.85rem", fontWeight: 750, mb: 1, mt: 3 }}>
            Thông tin học vụ
          </Typography>
          <Box
            sx={{
              bgcolor: "#FFFFFF",
              borderRadius: "14px",
              border: "1px solid rgba(0, 0, 0, 0.06)",
              p: 2,
            }}
          >
            <Stack spacing={1.5}>
              <DetailRow icon={<SchoolRoundedIcon sx={{ fontSize: 16 }} />} label="Khối & Lớp" value={`Khối ${student.grade} · Lớp ${student.className || "Chưa xếp lớp"}`} />
              <DetailRow icon={<CalendarTodayRoundedIcon sx={{ fontSize: 16 }} />} label="Ngày sinh" value={student.birthDate || "Chưa cập nhật"} />
              <DetailRow icon={<PhoneRoundedIcon sx={{ fontSize: 16 }} />} label="Liên hệ phụ huynh" value={student.guardianPhone || "Chưa cập nhật"} isPhone={Boolean(student.guardianPhone)} />
              <DetailRow icon={<BadgeRoundedIcon sx={{ fontSize: 16 }} />} label="Trường trực thuộc" value={school.name} />
            </Stack>
          </Box>

          {/* Enrolled Subjects Inset Card */}
          <Typography sx={{ color: "#1D1D1F", fontSize: "0.85rem", fontWeight: 750, mb: 1, mt: 3 }}>
            Môn đang theo học ({subjects.length})
          </Typography>
          <Box
            sx={{
              bgcolor: "#FFFFFF",
              borderRadius: "14px",
              border: "1px solid rgba(0, 0, 0, 0.06)",
              p: 2,
            }}
          >
            {subjects.length ? (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {subjects.map((subject) => (
                  <Box
                    key={subject.id}
                    sx={{
                      bgcolor: "rgba(0, 113, 227, 0.08)",
                      border: "1px solid rgba(0, 113, 227, 0.18)",
                      borderRadius: "8px",
                      color: "#0071E3",
                      fontSize: "0.78rem",
                      fontWeight: 650,
                      px: 1.25,
                      py: 0.5,
                    }}
                  >
                    {subject.name}
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ alignItems: "center", display: "flex", gap: 1, py: 0.5 }}>
                <WarningAmberRoundedIcon sx={{ color: "#B45309", fontSize: 18 }} />
                <Typography sx={{ color: "#86868B", fontSize: "0.8rem", fontWeight: 550 }}>
                  Học sinh chưa được gán môn học nào trong học kỳ này.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      ) : null}
    </Drawer>
  );
}

function DetailRow({
  icon,
  isPhone,
  label,
  value,
}: {
  icon: ReactNode;
  isPhone?: boolean;
  label: string;
  value: string;
}) {
  return (
    <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
      <Box sx={{ alignItems: "center", color: "#86868B", display: "flex", gap: 1 }}>
        {icon}
        <Typography sx={{ color: "#6E6E73", fontSize: "0.8rem", fontWeight: 550 }}>
          {label}
        </Typography>
      </Box>
      <Typography
        sx={{
          color: "#1D1D1F",
          fontFamily: isPhone ? "var(--font-mono)" : "inherit",
          fontSize: "0.825rem",
          fontWeight: 700,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
