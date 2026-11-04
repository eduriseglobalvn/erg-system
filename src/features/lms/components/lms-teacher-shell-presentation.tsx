import { memo, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Assignment from "@mui/icons-material/Assignment";
import AssignmentTurnedIn from "@mui/icons-material/AssignmentTurnedIn";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Class from "@mui/icons-material/Class";
import People from "@mui/icons-material/People";
import FileText from "@mui/icons-material/Description";

import { classroomSchools, classroomStudents } from "@/features/lms/classroom/api/classroom-defaults";
import type { ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

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
                <Typography noWrap sx={{ color: "#1C252E", fontSize: 14, fontWeight: 600, lineHeight: "22px" }}>
                  {school?.name ?? "Trường"}
                </Typography>
              </Stack>
            );
          }}
        >
          {schools.map((school) => (
            <MenuItem key={school.id} value={school.id} sx={scopeMenuItemSx}>
              <SchoolLogo school={school} />
              <Typography noWrap sx={{ color: "#1C252E", flex: 1, fontSize: 14, fontWeight: 600, minWidth: 0 }}>
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
            <Typography noWrap sx={{ color: "#1C252E", fontSize: 14, fontWeight: 600, lineHeight: "22px" }}>
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
          <Typography noWrap sx={{ color: "#1C252E", flex: 1, fontSize: 14, fontWeight: 600, minWidth: 0 }}>
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
  borderRadius: `${ergEnterpriseTokens.radius.sm}px`,
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
  fontWeight: 600,
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
            <Typography sx={{ fontSize: 20, fontWeight: 600, color: "text.primary" }}>
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
        <Typography sx={{ mt: 3, fontSize: 20, fontWeight: 600 }}>
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
