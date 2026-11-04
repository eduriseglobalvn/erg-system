import { memo, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Assignment from "@mui/icons-material/Assignment";
import AssignmentTurnedIn from "@mui/icons-material/AssignmentTurnedIn";
import CheckCircle from "@mui/icons-material/CheckCircle";
import People from "@mui/icons-material/People";
import FileText from "@mui/icons-material/Description";

import { classroomStudents } from "@/features/lms/classroom/api/classroom-defaults";
import type { ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";

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

export function getClassStudents(classId?: string) {
  return classroomStudents.filter((student) => !classId || student.classId === classId);
}
