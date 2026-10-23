import { memo, type ReactNode } from "react";
import { Box, Button, MenuItem, Select, Stack, Typography } from "@mui/material";
import Assignment from "@mui/icons-material/Assignment";
import AssignmentTurnedIn from "@mui/icons-material/AssignmentTurnedIn";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Class from "@mui/icons-material/Class";
import People from "@mui/icons-material/People";
import FileText from "@mui/icons-material/Description";

import { classroomSchools, classroomStudents } from "@/features/lms/classroom/api/mock-classroom-data";
import type { AssignmentRun, ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";

export function LmsHomeDashboard({
  runs,
  selectedClass,
  selectedSchoolName,
  teacherName,
  unreadNotificationCount,
  onAssign,
  onOpenHomework,
  onOpenSchedule,
}: {
  runs: AssignmentRun[];
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
  teacherName: string;
  unreadNotificationCount: number;
  onAssign: () => void;
  onOpenHomework: () => void;
  onOpenSchedule: () => void;
}) {
  const activeRuns = runs.slice(0, 3);
  const completionAverage = activeRuns.length
    ? Math.round(activeRuns.reduce((sum, run) => sum + run.completionRate, 0) / activeRuns.length)
    : 0;
  const supportCount = selectedClass?.riskStudents ?? activeRuns.reduce((sum, run) => sum + run.needsReviewCount, 0);

  return (
    <Box sx={{ bgcolor: "#F8FAFC", minHeight: "100%", px: { xs: 2, md: 4 }, py: { xs: 2, md: 3 } }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, maxWidth: 1440, mx: "auto" }}>
        <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ color: "#1C252E", fontSize: 22, fontWeight: 800, lineHeight: "30px" }}>
              Chào buổi tốt, {teacherName}
            </Typography>
            <Typography sx={{ color: "#637381", fontSize: 13, fontWeight: 600, mt: 0.5 }}>
              {selectedSchoolName} · {selectedClass?.className ?? "Chưa chọn lớp"} · {selectedClass?.studentCount ?? 0} học sinh
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
            <Button onClick={onOpenSchedule} variant="outlined" sx={{ ...homeButtonSx, width: { xs: "100%", sm: "auto" } }}>
              Xem lịch
            </Button>
            <Button onClick={onAssign} variant="contained" sx={{ ...homePrimaryButtonSx, width: { xs: "100%", sm: "auto" } }}>
              Giao bài tập
            </Button>
          </Stack>
        </Box>

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" } }}>
          <HomeMetricCard label="Hoạt động đang mở" value={String(runs.length)} tone="blue" />
          <HomeMetricCard label="Hoàn thành trung bình" value={`${completionAverage}%`} tone="green" />
          <HomeMetricCard label="Cần hỗ trợ" value={String(supportCount)} tone="amber" />
          <HomeMetricCard label="Thông báo mới" value={String(unreadNotificationCount)} tone="red" />
        </Box>

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.35fr) minmax(360px, 0.65fr)" } }}>
          <Box sx={homePanelSx}>
            <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 1.5 }}>
              <Typography sx={{ color: "#1C252E", fontSize: 15, fontWeight: 800 }}>Bài tập cần theo dõi</Typography>
              <Button onClick={onOpenHomework} size="small" sx={{ borderRadius: "8px", color: "#0F6CBD", fontSize: 13, fontWeight: 700, textTransform: "none" }}>
                Xem tất cả
              </Button>
            </Box>
            <Stack spacing={1}>
              {activeRuns.map((run) => (
                <Box key={run.id} sx={{ alignItems: { xs: "stretch", sm: "center" }, bgcolor: "#FFFFFF", border: "1px solid #D9E2EF", borderRadius: "10px", display: "grid", gap: { xs: 1, sm: 2 }, gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) 150px 110px" }, px: 2, py: 1.5 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ color: "#1C252E", fontSize: 14, fontWeight: 800 }}>{run.title}</Typography>
                    <Typography noWrap sx={{ color: "#637381", fontSize: 12.5, fontWeight: 600, mt: 0.25 }}>{run.subjectLabel} · {run.targetLevel}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ color: "#637381", fontSize: 12, fontWeight: 700 }}>{run.completionRate}% hoàn thành</Typography>
                    <Box sx={{ bgcolor: "#EEF2F7", borderRadius: "999px", height: 6, mt: 0.75, overflow: "hidden" }}>
                      <Box sx={{ bgcolor: "#22C55E", height: "100%", width: `${run.completionRate}%` }} />
                    </Box>
                  </Box>
                  <Typography sx={{ color: run.needsReviewCount ? "#B76E00" : "#637381", fontSize: 12.5, fontWeight: 800, textAlign: { xs: "left", sm: "right" } }}>
                    {run.needsReviewCount} cần xem
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          <Box sx={homePanelSx}>
            <Typography sx={{ color: "#1C252E", fontSize: 15, fontWeight: 800, mb: 1.5 }}>Hôm nay</Typography>
            <Stack spacing={1}>
              {["08:00 · IC3 GS6 Level 1", "10:15 · Chấm bài lớp 6A1", "14:00 · Chuẩn bị học liệu"].map((item) => (
                <Box key={item} sx={{ bgcolor: "#FFFFFF", border: "1px solid #D9E2EF", borderRadius: "10px", color: "#334155", fontSize: 13, fontWeight: 700, px: 2, py: 1.4 }}>
                  {item}
                </Box>
              ))}
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function HomeMetricCard({ label, value, tone }: { label: string; value: string; tone: "blue" | "green" | "amber" | "red" }) {
  const toneMap = {
    blue: ["#EAF4FF", "#0F6CBD"],
    green: ["#ECFDF5", "#118D57"],
    amber: ["#FFF7E6", "#B76E00"],
    red: ["#FFF1F2", "#D32F2F"],
  } as const;
  const [bg, color] = toneMap[tone];

  return (
    <Box sx={{ bgcolor: "#FFFFFF", border: "1px solid #D9E2EF", borderRadius: "12px", boxShadow: "0 10px 26px rgba(15,23,42,0.04)", p: 2 }}>
      <Box sx={{ bgcolor: bg, borderRadius: "10px", color, display: "inline-flex", fontSize: 12, fontWeight: 800, px: 1.25, py: 0.5 }}>
        {label}
      </Box>
      <Typography sx={{ color: "#1C252E", fontSize: 26, fontWeight: 850, lineHeight: "34px", mt: 1.4 }}>
        {value}
      </Typography>
    </Box>
  );
}

const homePanelSx = {
  bgcolor: "#FFFFFF",
  border: "1px solid #D9E2EF",
  borderRadius: "12px",
  boxShadow: "0 10px 26px rgba(15,23,42,0.04)",
  minWidth: 0,
  p: 2,
};

const homeButtonSx = {
  borderColor: "#D7E0EC",
  borderRadius: "10px",
  color: "#334155",
  fontSize: 13,
  fontWeight: 800,
  height: 38,
  textTransform: "none",
};

const homePrimaryButtonSx = {
  bgcolor: "#0F6CBD",
  borderRadius: "10px",
  boxShadow: "0 8px 18px rgba(15,108,189,0.22)",
  fontSize: 13,
  fontWeight: 800,
  height: 38,
  textTransform: "none",
  "&:hover": { bgcolor: "#0B5CAB" },
};

export function LmsHeaderSchoolControl({
  schoolId,
  schools,
  onSchoolChange,
}: {
  schoolId: string;
  schools: typeof classroomSchools;
  onSchoolChange: (event: { target: { value: string } }) => void;
}) {
  return (
        <Select
          value={schoolId}
          onChange={onSchoolChange}
          size="small"
          displayEmpty
          MenuProps={scopeMenuProps}
          sx={scopeSelectSx({ minWidth: 176, variant: "title" })}
          renderValue={(value) => {
            const school = schools.find((item) => item.id === value);
            return (
              <Stack direction="row" spacing={0.85} sx={{ alignItems: "center", minWidth: 0 }}>
                <SchoolLogo school={school} />
                <Typography noWrap sx={{ color: "#1C252E", fontSize: 14, fontWeight: 700, lineHeight: "22px" }}>
                  {school?.name ?? "Trường"}
                </Typography>
              </Stack>
            );
          }}
        >
          {schools.map((school) => (
            <MenuItem key={school.id} value={school.id} sx={scopeMenuItemSx}>
              <SchoolLogo school={school} />
              <Typography noWrap sx={{ color: "#1C252E", flex: 1, fontSize: 14, fontWeight: 700, minWidth: 0 }}>
                {school.name}
              </Typography>
            </MenuItem>
          ))}
        </Select>
  );
}

export function LmsHeaderClassControl({
  classes,
  selectedClassId,
  onClassChange,
}: {
  classes: ClassroomSnapshot[];
  selectedClassId: string;
  onClassChange: (event: { target: { value: string } }) => void;
}) {
  return (
    <Select
      value={selectedClassId}
      onChange={onClassChange}
      size="small"
      displayEmpty
      MenuProps={scopeMenuProps}
      sx={scopeSelectSx({ minWidth: 118, maxWidth: 184, variant: "title" })}
      renderValue={(value) => {
        const classroom = classes.find((item) => item.id === value);
        return (
          <Stack direction="row" spacing={0.85} sx={{ alignItems: "center", minWidth: 0 }}>
            <Box sx={scopeClassIconSx}>
              <Class sx={{ color: "#0F6CBD", fontSize: 16 }} />
            </Box>
            <Typography noWrap sx={{ color: "#1C252E", fontSize: 14, fontWeight: 700, lineHeight: "22px" }}>
              {classroom?.className ?? "Lớp"}
            </Typography>
          </Stack>
        );
      }}
    >
      {classes.map((classroom) => (
        <MenuItem key={classroom.id} value={classroom.id} sx={scopeMenuItemSx}>
          <Box sx={scopeClassIconSx}>
            <Class sx={{ color: "#0F6CBD", fontSize: 16 }} />
          </Box>
          <Typography noWrap sx={{ color: "#1C252E", flex: 1, fontSize: 14, fontWeight: 700, minWidth: 0 }}>
            {classroom.className}
          </Typography>
        </MenuItem>
      ))}
    </Select>
  );
}

function SchoolLogo({ school }: { school?: (typeof classroomSchools)[number] | { logoURL?: string; name?: string } }) {
  const logoUrl = school?.logoURL;
  const label = getSchoolLogoLabel(school?.name);

  if (logoUrl) {
    return (
      <Box
        component="img"
        alt={school?.name ?? "School"}
        src={logoUrl}
        sx={{
          borderRadius: "8px",
          flexShrink: 0,
          height: 24,
          objectFit: "cover",
          width: 24,
        }}
      />
    );
  }

  return <Box sx={scopeMenuLogoSx}>{label}</Box>;
}

function getSchoolLogoLabel(name?: string) {
  if (!name) return "EDU";
  const firstMeaningful = name
    .split(/\s+/)
    .filter(Boolean)
    .find((part) => !["campus", "center", "learning", "point", "studio"].includes(part.toLowerCase()));
  return (firstMeaningful ?? name).slice(0, 3).toUpperCase();
}

function scopeSelectSx({ minWidth, maxWidth, variant }: { minWidth: number; maxWidth?: number; variant: "title" | "pill" }) {
  const isTitle = variant === "title";
  return {
    background: isTitle ? "transparent" : "#F8FAFC",
    borderRadius: isTitle ? "8px" : "10px",
    minWidth,
    maxWidth: maxWidth ?? (isTitle ? 238 : minWidth + 54),
    transition: "background-color 160ms ease, box-shadow 160ms ease",
    "&:hover": {
      backgroundColor: isTitle ? "rgba(145,158,171,0.07)" : "#F4F6F8",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: isTitle ? "transparent" : "rgba(145,158,171,0.16)",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: isTitle ? "rgba(15,108,189,0.10)" : "rgba(15,108,189,0.22)",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(15,108,189,0.30)",
      borderWidth: 1,
    },
    "&.Mui-focused": {
      boxShadow: "0 0 0 3px rgba(15,108,189,0.08)",
    },
    "& .MuiSelect-select": {
      alignItems: "center",
      display: "flex",
      height: 32,
      minHeight: "32px !important",
      pl: isTitle ? "8px !important" : "10px !important",
      pr: isTitle ? "28px !important" : "30px !important",
      py: 0,
    },
    "& .MuiSelect-icon": {
      color: "#637381",
      fontSize: 18,
      right: isTitle ? 6 : 7,
    },
  };
}

const scopeMenuProps = {
  slotProps: {
    paper: {
      sx: {
        border: "1px solid rgba(145,158,171,0.14)",
        borderRadius: "12px",
        boxShadow: "0 18px 42px rgba(28,37,46,0.12)",
        mt: 1,
        p: 0.5,
        minWidth: 280,
        "& .MuiList-root": { p: 0 },
      },
    },
  },
};

const scopeMenuItemSx = {
  alignItems: "center",
  borderRadius: "9px",
  display: "flex",
  gap: 1.25,
  minHeight: 44,
  px: 1.25,
  py: 1,
  "&.Mui-selected": {
    bgcolor: "rgba(145,158,171,0.12)",
  },
  "&.Mui-selected:hover": {
    bgcolor: "rgba(145,158,171,0.16)",
  },
};

const scopeMenuLogoSx = {
  alignItems: "center",
  background: "linear-gradient(135deg, #FEE2F1 0%, #DBEAFE 100%)",
  borderRadius: "50%",
  color: "#0F6CBD",
  display: "flex",
  flexShrink: 0,
  fontSize: 9,
  fontWeight: 900,
  height: 28,
  justifyContent: "center",
  width: 28,
};

const scopeClassIconSx = {
  alignItems: "center",
  background: "linear-gradient(135deg, rgba(219,234,254,0.92) 0%, rgba(254,226,241,0.84) 100%)",
  border: "1px solid rgba(15,108,189,0.10)",
  borderRadius: "8px",
  display: "flex",
  flexShrink: 0,
  height: 24,
  justifyContent: "center",
  width: 24,
};

export function TeacherWorkspaceFrame({
  children,
  selectedClass,
  selectedSchoolName,
}: {
  children: ReactNode;
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100%", gap: 2, px: { xs: 2, sm: 3 }, py: 2 }}>
      {/* Header Card */}
      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 20, fontWeight: 700, color: "text.primary" }}>
              {selectedClass?.className ?? "Lớp học"}
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: 14, color: "text.secondary" }}>
              {selectedSchoolName} - {selectedClass?.studentCount ?? 0} học sinh
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileText sx={{ fontSize: 16 }} />}
            sx={{
              borderRadius: 1.5,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Xuất dữ liệu
          </Button>
        </Box>

        {/* Stats Grid */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 2, mt: 3 }}>
          <ClassStat icon={Assignment} label="Bài đang mở" value={String(selectedClass?.activeAssignments ?? 0)} />
          <ClassStat icon={CheckCircle} label="Hoàn thành" value={`${selectedClass?.completionRate ?? 0}%`} />
          <ClassStat icon={People} label="Cần hỗ trợ" value={String(selectedClass?.riskStudents ?? 0)} />
          <ClassStat icon={AssignmentTurnedIn} label="Nộp gần nhất" value={selectedClass?.lastSubmissionAt ?? "-"} />
        </Box>
      </Box>

      {children}
    </Box>
  );
}

const ClassStat = memo(function ClassStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 2,
          bgcolor: "primary.light",
          color: "primary.main",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <Icon sx={{ fontSize: 20 }} />
      </Box>
      <Box>
        <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 500 }}>{label}</Typography>
        <Typography sx={{ fontSize: 16, fontWeight: 600, color: "text.primary", mt: 0.25 }}>{value}</Typography>
      </Box>
    </Box>
  );
});

export function MobileUnsupportedScreen({ activeLabel, onGoHome }: { activeLabel: string; onGoHome: () => void }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100%", justifyContent: "center", px: 3, py: 6 }}>
      <Box
        sx={{
          p: 4,
          borderRadius: 4,
          textAlign: "center",
          bgcolor: "background.paper",
          boxShadow: "0 16px 38px rgba(15,23,42,0.08)",
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            mx: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            bgcolor: "primary.light",
            color: "primary.main",
          }}
        >
          <FileText sx={{ fontSize: 28 }} />
        </Box>
        <Typography sx={{ mt: 3, fontSize: 20, fontWeight: 700 }}>
          {activeLabel} dùng trên web
        </Typography>
        <Typography sx={{ mt: 1, fontSize: 14, color: "text.secondary", lineHeight: 1.6 }}>
          Phiên bản mobile LMS hiện hỗ trợ Giao bài, Kho bài, Lịch và Thông báo. Mở máy tính để thao tác đầy đủ màn này.
        </Typography>
        <Button
          variant="contained"
          fullWidth
          onClick={onGoHome}
          sx={{ mt: 4, borderRadius: 3, py: 1.5, textTransform: "none", fontWeight: 600 }}
        >
          Về Giao bài
        </Button>
      </Box>
    </Box>
  );
}

export function getClassStudents(classId?: string) {
  return classroomStudents.filter((student) => !classId || student.classId === classId);
}
