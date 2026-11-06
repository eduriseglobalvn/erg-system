import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { type ReactNode } from "react";
import type { PartnerSchool, SchoolStudent } from "@/features/lcms/school-management/types/school-management-types";
import { getAvatarStyle, getInitials, statusMeta } from "@/features/lcms/school-management/components/students/school-student-directory/student-directory-utils";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { alpha } from "@mui/material/styles";

export function StudentProfileDrawer({
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
            <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Hồ sơ học sinh
            </Typography>
            <IconButton
              aria-label="Đóng hồ sơ"
              onClick={onClose}
              sx={{
                bgcolor: "rgba(0, 0, 0, 0.05)",
                color: ergEnterpriseTokens.color.text,
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
              border: `1px solid ${ergEnterpriseTokens.color.border}`,
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
                fontWeight: 600,
                height: 60,
                mb: 1.5,
                width: 60,
              }}
            >
              {initials}
            </Avatar>
            <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "1.2rem", fontWeight: 600, letterSpacing: "-0.015em" }}>
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
                  fontWeight: 600,
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
                  fontWeight: 600,
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
          <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "0.85rem", fontWeight: 600, mb: 1, mt: 3 }}>
            Thông tin học vụ
          </Typography>
          <Box
            sx={{
              bgcolor: "#FFFFFF",
              borderRadius: "14px",
              border: `1px solid ${ergEnterpriseTokens.color.border}`,
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
          <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "0.85rem", fontWeight: 600, mb: 1, mt: 3 }}>
            Môn đang theo học ({subjects.length})
          </Typography>
          <Box
            sx={{
              bgcolor: "#FFFFFF",
              borderRadius: "14px",
              border: `1px solid ${ergEnterpriseTokens.color.border}`,
              p: 2,
            }}
          >
            {subjects.length ? (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {subjects.map((subject) => (
                  <Box
                    key={subject.id}
                    sx={{
                      bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.08),
                      border: `1px solid ${alpha(ergEnterpriseTokens.color.primary, 0.18)}`,
                      borderRadius: "8px",
                      color: ergEnterpriseTokens.color.primary,
                      fontSize: "0.78rem",
                      fontWeight: 600,
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
                <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.8rem", fontWeight: 550 }}>
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
      <Box sx={{ alignItems: "center", color: ergEnterpriseTokens.color.textMuted, display: "flex", gap: 1 }}>
        {icon}
        <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.8rem", fontWeight: 550 }}>
          {label}
        </Typography>
      </Box>
      <Typography
        sx={{
          color: ergEnterpriseTokens.color.text,
          fontFamily: isPhone ? "var(--font-mono)" : "inherit",
          fontSize: "0.825rem",
          fontWeight: 600,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

