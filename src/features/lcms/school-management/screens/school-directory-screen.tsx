import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { type ReactNode, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { SchoolFormDialog } from "@/features/lcms/school-management/components/school-form-dialog";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import { SchoolPageShell } from "@/features/lcms/school-management/components/school-page-shell";
import type { PartnerSchool, SchoolDraft } from "@/features/lcms/school-management/types/school-management-types";
import { schoolTypeMeta } from "@/features/lcms/school-management/types/school-type-config";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { alpha } from "@mui/material/styles";

const AVATAR_GRADIENTS = [
  { bg: "linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)", color: "#3730A3" },
  { bg: "linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)", color: "#0369A1" },
  { bg: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)", color: "#92400E" },
  { bg: "linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)", color: "#166534" },
  { bg: "linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)", color: "#9D174D" },
  { bg: "linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)", color: "#5B21B6" },
];

function getSchoolInitials(name?: string | null) {
  if (!name) return "TR";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return name.slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function getSchoolAvatarStyle(name?: string | null) {
  const safeName = name || "TR";
  let hash = 0;
  for (let i = 0; i < safeName.length; i++) {
    hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

const statusMeta = {
  active: {
    bg: alpha(ergEnterpriseTokens.color.success, 0.12),
    border: alpha(ergEnterpriseTokens.color.success, 0.22),
    color: "#15803D",
    dot: ergEnterpriseTokens.color.success,
    label: "Đang vận hành",
  },
  onboarding: {
    bg: alpha(ergEnterpriseTokens.color.warning, 0.12),
    border: alpha(ergEnterpriseTokens.color.warning, 0.22),
    color: "#B45309",
    dot: ergEnterpriseTokens.color.warning,
    label: "Đang triển khai",
  },
  paused: {
    bg: "rgba(0, 0, 0, 0.05)",
    border: "rgba(0, 0, 0, 0.1)",
    color: ergEnterpriseTokens.color.textMuted,
    dot: ergEnterpriseTokens.color.textMuted,
    label: "Tạm dừng",
  },
} as const;

export default function SchoolDirectoryScreen() {
  const { error, isLoading, refetch, saveSchool, schools, selectSchool } = useSchoolManagementContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(
    () =>
      schools.filter((school) =>
        `${school.name} ${school.id} ${school.district}`.toLowerCase().includes(search.toLowerCase())
      ),
    [schools, search]
  );

  const activeCount = schools.filter((s) => s.status === "active").length;
  const onboardingCount = schools.filter((s) => s.status === "onboarding").length;
  const totalStudents = schools.reduce((acc, s) => acc + (s.studentCount ?? s.students.length), 0);

  function openSchool(id: string) {
    selectSchool(id);
    void navigate({ href: `${adminPath("/schools/detail")}?schoolId=${encodeURIComponent(id)}` });
  }

  async function createSchool(draft: SchoolDraft) {
    const id = await saveSchool(draft);
    if (id) void navigate({ href: `${adminPath("/schools/detail")}?schoolId=${encodeURIComponent(id)}` });
  }

  return (
    <SchoolPageShell
      unscoped
      title="Danh sách trường liên kết"
      description="Quản lý toàn bộ trường, tình trạng triển khai và độ hoàn thiện dữ liệu."
      action={
        <Button
          onClick={() => setAdding(true)}
          startIcon={<AddRoundedIcon />}
          variant="contained"
          sx={{
            bgcolor: ergEnterpriseTokens.color.primary,
            borderRadius: "11px",
            boxShadow: `0 2px 8px ${alpha(ergEnterpriseTokens.color.primary, 0.28)}`,
            fontSize: "0.875rem",
            fontWeight: 600,
            px: 2.5,
            py: 1,
            textTransform: "none",
            transition: "all 0.15s ease",
            "&:hover": {
              bgcolor: ergEnterpriseTokens.color.primaryHover,
              boxShadow: `0 4px 14px ${alpha(ergEnterpriseTokens.color.primary, 0.38)}`,
              transform: "translateY(-1px)",
            },
            "&:active": {
              transform: "scale(0.985)",
            },
          }}
        >
          Thêm trường
        </Button>
      }
    >
      {/* Apple Metric KPI Cards */}
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { md: "repeat(4, 1fr)", sm: "repeat(2, 1fr)", xs: "1fr" },
          mb: 2.5,
        }}
      >
        <MetricCard
          icon={<BusinessRoundedIcon sx={{ fontSize: 20 }} />}
          iconBg={alpha(ergEnterpriseTokens.color.primary, 0.08)}
          iconColor={ergEnterpriseTokens.color.primary}
          label="Tổng số trường"
          value={schools.length}
          subtext="Đơn vị đào tạo liên kết"
        />
        <MetricCard
          icon={<CheckCircleRoundedIcon sx={{ fontSize: 20 }} />}
          iconBg={alpha(ergEnterpriseTokens.color.success, 0.1)}
          iconColor={ergEnterpriseTokens.color.success}
          label="Đang vận hành"
          value={activeCount}
          subtext="Hoạt động giảng dạy chính thức"
        />
        <MetricCard
          icon={<HourglassTopRoundedIcon sx={{ fontSize: 20 }} />}
          iconBg={alpha(ergEnterpriseTokens.color.warning, 0.1)}
          iconColor={ergEnterpriseTokens.color.warning}
          label="Đang triển khai"
          value={onboardingCount}
          subtext="Đang hoàn thiện dữ liệu"
        />
        <MetricCard
          icon={<GroupsRoundedIcon sx={{ fontSize: 20 }} />}
          iconBg="rgba(175, 82, 222, 0.1)"
          iconColor="#AF52DE"
          label="Tổng người học"
          value={totalStudents}
          subtext="Học sinh đang theo học"
        />
      </Box>

      {/* Main Table Container */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: "#FFFFFF",
          border: `1px solid ${ergEnterpriseTokens.color.border}`,
          borderRadius: "16px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03), 0 10px 24px -4px rgba(0, 0, 0, 0.05)",
          overflow: "hidden",
        }}
      >
        {/* Table Toolbar */}
        <Box
          sx={{
            alignItems: { sm: "center", xs: "flex-start" },
            borderBottom: `1px solid ${ergEnterpriseTokens.color.border}`,
            display: "flex",
            flexDirection: { sm: "row", xs: "column" },
            gap: 2,
            justifyContent: "space-between",
            p: 2.25,
          }}
        >
          <Box>
            <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
              {schools.length} trường trong hệ thống
            </Typography>
            <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.825rem", fontWeight: 500, mt: 0.25 }}>
              {activeCount} trường đang vận hành chính thức
            </Typography>
          </Box>

          <TextField
            placeholder="Tìm tên, mã trường, địa phương..."
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: 19 }} />
                  </InputAdornment>
                ),
                sx: {
                  bgcolor: "rgba(0, 0, 0, 0.03)",
                  borderRadius: "11px",
                  fontSize: "0.85rem",
                  transition: "all 0.15s ease",
                  width: { sm: 320, xs: "100%" },
                  "& fieldset": { borderColor: ergEnterpriseTokens.color.border },
                  "&:hover fieldset": { borderColor: "rgba(0, 0, 0, 0.18)" },
                  "&.Mui-focused fieldset": {
                    borderColor: ergEnterpriseTokens.color.primary,
                    boxShadow: `0 0 0 3px ${alpha(ergEnterpriseTokens.color.primary, 0.15)}`,
                  },
                },
              },
            }}
          />
        </Box>

        {error ? (
          <Alert
            action={
              <Button variant="contained" color="inherit" onClick={() => void refetch()} size="small">
                Thử lại
              </Button>
            }
            severity="error"
            sx={{ m: 2.5, borderRadius: "12px" }}
          >
            Không thể tải danh sách trường: {error instanceof Error ? error.message : "Lỗi không xác định"}
          </Alert>
        ) : null}

        {/* Phones: one card per school; the table keeps md and up. */}
        <SchoolCardList isLoading={isLoading} onOpen={openSchool} schools={filtered} />

        <TableContainer sx={{ display: { md: "block", xs: "none" } }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={tableHeadCellSx}>Trường học</TableCell>
                <TableCell sx={tableHeadCellSx}>Loại hình</TableCell>
                <TableCell sx={tableHeadCellSx}>Địa phương</TableCell>
                <TableCell sx={tableHeadCellSx}>Đầu mối</TableCell>
                <TableCell align="right" sx={tableHeadCellSx}>
                  Người học
                </TableCell>
                <TableCell align="right" sx={tableHeadCellSx}>
                  Lớp
                </TableCell>
                <TableCell align="right" sx={tableHeadCellSx}>
                  Môn
                </TableCell>
                <TableCell sx={tableHeadCellSx}>Trạng thái</TableCell>
                <TableCell sx={{ ...tableHeadCellSx, width: 56 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }, (_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 9 }, (__, cell) => (
                      <TableCell key={cell} sx={{ borderBottom: "1px solid rgba(0, 0, 0, 0.04)", py: 1.5 }}>
                        <Skeleton width={cell === 0 ? 180 : 70} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ py: 6, textAlign: "center" }}>
                    <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.875rem", fontStyle: "italic" }}>
                      Không tìm thấy trường liên kết nào phù hợp với từ khóa.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((school) => {
                  const status = statusMeta[school.status];
                  const type = schoolTypeMeta[school.schoolType];
                  const avatarStyle = getSchoolAvatarStyle(school.name);
                  const initials = getSchoolInitials(school.name);

                  return (
                    <TableRow
                      hover
                      key={school.id}
                      onClick={() => openSchool(school.id)}
                      sx={{
                        cursor: "pointer",
                        transition: "background-color 0.12s ease",
                        "&:hover": { bgcolor: `${alpha(ergEnterpriseTokens.color.primary, 0.035)} !important` },
                        "& td": { borderBottom: "1px solid rgba(0, 0, 0, 0.04)", py: 1.4 },
                      }}
                    >
                      {/* Trường học: Avatar + Name + Clean ID */}
                      <TableCell>
                        <Box sx={{ alignItems: "center", display: "flex", gap: 1.5 }}>
                          <Avatar
                            sx={{
                              background: avatarStyle.bg,
                              boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
                              color: avatarStyle.color,
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              height: 36,
                              width: 36,
                            }}
                          >
                            {initials}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              sx={{
                                color: ergEnterpriseTokens.color.text,
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                letterSpacing: "-0.01em",
                              }}
                            >
                              {school.name}
                            </Typography>
                            <Box
                              component="span"
                              sx={{
                                color: ergEnterpriseTokens.color.textMuted,
                                display: "inline-block",
                                fontFamily: '"SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                mt: 0.25,
                              }}
                            >
                              {school.id.length > 18 ? `${school.id.slice(0, 18)}...` : school.id}
                            </Box>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Loại hình */}
                      <TableCell>
                        <Box
                          component="span"
                          sx={{
                            bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.07),
                            border: `1px solid ${alpha(ergEnterpriseTokens.color.primary, 0.16)}`,
                            borderRadius: "6px",
                            color: ergEnterpriseTokens.color.primary,
                            fontSize: "0.76rem",
                            fontWeight: 600,
                            px: 1,
                            py: 0.3,
                          }}
                        >
                          {type.shortLabel}
                        </Box>
                      </TableCell>

                      {/* Địa phương */}
                      <TableCell>
                        <Typography sx={{ color: school.district ? ergEnterpriseTokens.color.text : ergEnterpriseTokens.color.textMuted, fontSize: "0.85rem" }}>
                          {school.district || "Chưa cập nhật"}
                        </Typography>
                      </TableCell>

                      {/* Đầu mối */}
                      <TableCell>
                        <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "0.85rem", fontWeight: 600 }}>
                          {school.principal || "Xem trong chi tiết"}
                        </Typography>
                        {school.contactPhone ? (
                          <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.75rem", mt: 0.25 }}>
                            {school.contactPhone}
                          </Typography>
                        ) : null}
                      </TableCell>

                      {/* Người học */}
                      <TableCell align="right">
                        <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "0.875rem", fontWeight: 600 }}>
                          {school.studentCount ?? school.students.length}
                        </Typography>
                      </TableCell>

                      {/* Lớp */}
                      <TableCell align="right">
                        <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "0.875rem", fontWeight: 600 }}>
                          {school.classCount ?? school.classes.length}
                        </Typography>
                      </TableCell>

                      {/* Môn */}
                      <TableCell align="right">
                        <Typography sx={{ color: school.subjects.length ? ergEnterpriseTokens.color.text : ergEnterpriseTokens.color.textMuted, fontSize: "0.85rem", fontWeight: 600 }}>
                          {school.subjects.length || "—"}
                        </Typography>
                      </TableCell>

                      {/* Trạng thái (Apple Status Badge with glowing dot) */}
                      <TableCell>
                        <Box
                          sx={{
                            alignItems: "center",
                            bgcolor: status.bg,
                            border: `1px solid ${status.border}`,
                            borderRadius: "9999px",
                            color: status.color,
                            display: "inline-flex",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            gap: 0.7,
                            px: 1.15,
                            py: 0.4,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              bgcolor: status.dot,
                              borderRadius: "50%",
                              display: "inline-block",
                              height: 6,
                              width: 6,
                            }}
                          />
                          {status.label}
                        </Box>
                      </TableCell>

                      {/* Action Chevron */}
                      <TableCell align="center">
                        <IconButton
                          aria-label={`Mở ${school.name}`}
                          size="small"
                          sx={{
                            bgcolor: "rgba(0, 0, 0, 0.03)",
                            color: ergEnterpriseTokens.color.textMuted,
                            transition: "all 0.15s ease",
                            "&:hover": {
                              bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.1),
                              color: ergEnterpriseTokens.color.primary,
                            },
                          }}
                        >
                          <ArrowForwardRoundedIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {adding ? <SchoolFormDialog onClose={() => setAdding(false)} onSave={createSchool} /> : null}
    </SchoolPageShell>
  );
}

const tableHeadCellSx = {
  bgcolor: "rgba(250, 250, 252, 0.95)",
  borderBottom: `1px solid ${ergEnterpriseTokens.color.border}`,
  color: ergEnterpriseTokens.color.textMuted,
  fontSize: "0.72rem",
  fontWeight: 600,
  letterSpacing: "0.04em",
  py: 1.25,
  textTransform: "uppercase",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};

function MetricCard({
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
        border: `1px solid ${ergEnterpriseTokens.color.border}`,
        borderRadius: "14px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        p: 2,
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        "&:hover": {
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.05)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.78rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
          {label}
        </Typography>
        <Box
          sx={{
            alignItems: "center",
            bgcolor: iconBg,
            borderRadius: "8px",
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
      <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.72rem", fontWeight: 550, mt: 0.25 }}>
        {subtext}
      </Typography>
    </Paper>
  );
}

function SchoolCardList({ isLoading, onOpen, schools }: { isLoading: boolean; onOpen: (id: string) => void; schools: PartnerSchool[] }) {
  const { color, radius } = ergEnterpriseTokens;
  if (isLoading) {
    return (
      <Box sx={{ display: { md: "none", xs: "grid" }, gap: 1, p: 1.5 }}>
        {[0, 1, 2].map((index) => <Skeleton height={72} key={index} sx={{ borderRadius: `${radius.card}px` }} variant="rounded" />)}
      </Box>
    );
  }
  if (schools.length === 0) {
    return (
      <Typography sx={{ color: color.textMuted, display: { md: "none", xs: "block" }, p: 3, textAlign: "center", typography: "body2" }}>
        Không tìm thấy trường liên kết nào phù hợp với từ khóa.
      </Typography>
    );
  }
  return (
    <Box aria-label="Danh sách trường" component="ul" role="list" sx={{ display: { md: "none", xs: "grid" }, gap: 1, listStyle: "none", m: 0, p: 1.5 }}>
      {schools.map((school) => {
        const status = statusMeta[school.status];
        return (
          <Box component="li" key={school.id} role="listitem">
            <ButtonBase
              onClick={() => onOpen(school.id)}
              sx={{
                alignItems: "flex-start",
                border: `1px solid ${color.border}`,
                borderRadius: `${radius.card}px`,
                display: "flex",
                flexDirection: "column",
                gap: 0.75,
                p: 1.5,
                textAlign: "left",
                width: "100%",
                "&:focus-visible": { boxShadow: ergEnterpriseTokens.shadow.focus, outline: "none" },
              }}
            >
              <Typography sx={{ color: color.text, typography: "subtitle2" }}>{school.name}</Typography>
              {school.district ? <Typography sx={{ color: color.textMuted, typography: "caption" }}>{school.district}</Typography> : null}
              <Box sx={{ alignItems: "center", display: "flex", gap: 1.5 }}>
                <Typography sx={{ color: color.text, typography: "body2" }}>{school.classCount ?? school.classes.length} lớp</Typography>
                <Box component="span" sx={{ bgcolor: status.bg, borderRadius: `${radius.chip}px`, color: status.color, px: 1.15, py: 0.4, typography: "caption", whiteSpace: "nowrap" }}>
                  {status.label}
                </Box>
              </Box>
            </ButtonBase>
          </Box>
        );
      })}
    </Box>
  );
}
