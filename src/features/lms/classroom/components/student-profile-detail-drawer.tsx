import CloseIcon from "@mui/icons-material/Close";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import type { ReactNode } from "react";

import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgSelect, ErgTextField } from "@/components/erg-mui/erg-form";
import type { ClassroomStudent, StudentStatus } from "@/domain/school/classroom-types";

export type StudentProfileDetailDraft = {
  name: string;
  username: string;
  password: string;
  note: string;
};

export type StudentProfileStatusOption<TValue extends string = string> = {
  label: string;
  value: TValue;
};

type StudentProfileDetailDrawerProps<TValue extends string = StudentStatus> = {
  draft: StudentProfileDetailDraft;
  onClose: () => void;
  onStatusChange?: (value: TValue) => void;
  onUpdate: (patch: Partial<StudentProfileDetailDraft>) => void;
  statusLabel?: string;
  statusOptions?: Array<StudentProfileStatusOption<TValue>>;
  statusValue?: TValue;
  student: ClassroomStudent;
};

const twoColumnGrid = { display: "grid", gap: 1.5, gridTemplateColumns: { sm: "repeat(2, minmax(0, 1fr))" }, mt: 1.5 } as const;

export function StudentProfileDetailDrawer<TValue extends string = StudentStatus>({
  draft,
  onClose,
  onStatusChange,
  onUpdate,
  statusLabel = "Trạng thái học tập",
  statusOptions,
  statusValue,
  student,
}: StudentProfileDetailDrawerProps<TValue>) {
  const profile = buildStudentProfile(student);

  return (
    <Drawer
      anchor="right"
      open
      onClose={onClose}
      slotProps={{
        paper: { sx: { borderColor: "divider", borderLeft: 1, display: "flex", flexDirection: "column", height: "100vh", maxWidth: "calc(100vw - 20px)", width: 560 } },
      }}
    >
      <Box sx={{ bgcolor: "background.default", borderBottom: 1, borderColor: "divider", p: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", minWidth: 0 }}>
            <Box sx={{ bgcolor: "action.selected", borderRadius: 1, color: "primary.main", display: "grid", flexShrink: 0, height: 48, placeItems: "center", width: 48 }}>
              <PersonOutlinedIcon fontSize="small" />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography component="h2" variant="h4" noWrap>Chi tiết hồ sơ học sinh</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "fontWeightMedium", mt: 0.25 }}>
                {student.className} - {student.schoolName}
              </Typography>
              <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1, mt: 1 }}>
                <BadgeText>{profile.code}</BadgeText>
                <BadgeText>{profile.birthDate}</BadgeText>
                <BadgeText>{profile.gender}</BadgeText>
              </Stack>
            </Box>
          </Stack>
          <ErgIconButton label="Đóng" size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </ErgIconButton>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", p: 2 }}>
        <Stack spacing={2}>
          <DetailSection title="Thông tin định danh">
            <Box sx={twoColumnGrid}>
              <Field label="Họ tên">
                <ErgTextField compact value={draft.name} onChange={(event) => onUpdate({ name: event.target.value })} />
              </Field>
              <ReadOnlyField label="Mã học sinh" value={profile.code} />
              <ReadOnlyField label="Ngày sinh" value={profile.birthDate} />
              <ReadOnlyField label="Giới tính" value={profile.gender} />
              <ReadOnlyField label="Lớp hiện tại" value={student.className} />
              <ReadOnlyField label="Khối" value={student.gradeLabel} />
            </Box>
          </DetailSection>

          <DetailSection title="Liên hệ gia đình">
            <Box sx={twoColumnGrid}>
              <ReadOnlyField label="Phụ huynh chính" value={profile.guardianName} />
              <ReadOnlyField label="Số điện thoại" value={profile.guardianPhone} />
              <ReadOnlyField label="Email phụ huynh" value={profile.guardianEmail} />
              <ReadOnlyField label="Địa chỉ" value={profile.address} />
            </Box>
          </DetailSection>

          <DetailSection title="Tài khoản Student Workspace">
            <Box sx={twoColumnGrid}>
              <Field label="Username">
                <ErgTextField compact value={draft.username} onChange={(event) => onUpdate({ username: event.target.value })} />
              </Field>
              <Field label="Mật khẩu">
                <ErgTextField
                  compact
                  value={draft.password}
                  onChange={(event) => onUpdate({ password: event.target.value })}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon fontSize="inherit" sx={{ color: "text.secondary" }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Field>
              <ReadOnlyField label="Lần đăng nhập gần nhất" value={student.lastActivity} />
              <ReadOnlyField label="Thiết bị thường dùng" value={profile.device} />
            </Box>
          </DetailSection>

          <DetailSection title="Theo dõi học tập">
            <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, minmax(0, 1fr))" }, mt: 1.5 }}>
              <MiniMetric label="Tiến độ" value={`${student.progressRate}%`} />
              <MiniMetric label="Điểm TB" value={`${student.averageScore}`} />
              <MiniMetric label="Hoàn thành" value={`${student.completedAssignments} bài`} />
              <MiniMetric label="Streak" value={`${student.streakDays} ngày`} />
            </Box>
            <Box sx={twoColumnGrid}>
              <ReadOnlyField label="Bài đang học" value={student.currentAssignment} />
              <ReadOnlyField label="Chặng hiện tại" value={student.currentStage} />
              <ReadOnlyField label="Năng lực nổi bật" value={profile.strengths} />
              <ReadOnlyField label="Cần hỗ trợ" value={profile.supportPlan} />
            </Box>
          </DetailSection>

          <DetailSection title="Chăm sóc và ghi chú">
            <Stack spacing={1.5} sx={{ mt: 1.5 }}>
              {statusOptions?.length && statusValue && onStatusChange ? (
                <Field label={statusLabel}>
                  <ErgSelect
                    size="small"
                    options={statusOptions}
                    value={statusValue}
                    onChange={(event) => onStatusChange(event.target.value as TValue)}
                  />
                </Field>
              ) : null}
              <ReadOnlyField label="Lịch sử chăm sóc" value={profile.careHistory} />
              <Field label="Ghi chú giáo viên">
                <ErgTextField compact multiline minRows={4} value={draft.note} onChange={(event) => onUpdate({ note: event.target.value })} />
              </Field>
            </Stack>
          </DetailSection>
        </Stack>
      </Box>

      <Stack direction="row" spacing={1} sx={{ alignItems: "center", bgcolor: "background.default", borderColor: "divider", borderTop: 1, justifyContent: "space-between", p: 1.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "fontWeightMedium" }}>{student.name} - {student.className}</Typography>
        <ErgButton type="button" variant="contained" onClick={onClose} sx={{ height: 36, px: 1.5 }}>
          Lưu thông tin
        </ErgButton>
      </Stack>
    </Drawer>
  );
}

function buildStudentProfile(student: ClassroomStudent) {
  return {
    address: "Chưa có dữ liệu",
    birthDate: "Chưa có dữ liệu",
    careHistory: "Chưa có dữ liệu",
    code: student.id,
    device: "Chưa có dữ liệu",
    gender: "Chưa có dữ liệu",
    guardianEmail: "Chưa có dữ liệu",
    guardianName: "Chưa có dữ liệu",
    guardianPhone: "Chưa có dữ liệu",
    strengths: "Chưa có dữ liệu",
    supportPlan: "Chưa có dữ liệu",
  };
}

function DetailSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <Paper component="section" variant="outlined" sx={{ borderRadius: 1, p: 2 }}>
      <Typography component="h3" variant="subtitle2" color="text.secondary" sx={{ fontWeight: "fontWeightBold" }}>{title}</Typography>
      {children}
    </Paper>
  );
}

function BadgeText({ children }: { children: string }) {
  return (
    <Typography
      component="span"
      variant="caption"
      sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 1, color: "text.secondary", fontWeight: "fontWeightBold", px: 1.25, py: 0.5 }}
    >
      {children}
    </Typography>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <Box component="label" sx={{ display: "block" }}>
      <Typography component="span" variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: "fontWeightMedium", mb: 0.5 }}>{label}</Typography>
      {children}
    </Box>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: "fontWeightMedium", mb: 0.5 }}>{label}</Typography>
      <Typography
        variant="body2"
        sx={{ bgcolor: "background.default", border: 1, borderColor: "divider", borderRadius: 1, fontWeight: "fontWeightMedium", minHeight: 40, px: 1.25, py: 1 }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ bgcolor: "background.default", border: 1, borderColor: "divider", borderRadius: 1, px: 1.25, py: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: "fontWeightMedium" }}>{label}</Typography>
      <Typography variant="caption" noWrap sx={{ display: "block", fontWeight: "fontWeightBold", mt: 0.25 }}>{value}</Typography>
    </Box>
  );
}
