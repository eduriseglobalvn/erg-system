import type { ElementType, ReactNode } from "react";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { AccessManagedUser, EffectiveAccess } from "@/features/lcms/admin-operations/api/access-management-api";
import type { ProfileDraft } from "@/features/lcms/admin-operations/types/user-access-control";
import { formatDateTime, initials, isSuperAdmin, mergeUser, statusLabel } from "@/features/lcms/admin-operations/utils/user-access-control-utils";
import { actionSx, fieldSx, headingSx, helperSx, panelSx, scopeLabels, sectionHeaderSx } from "./user-access-control-section-config";

export function MemberRow({ active, user, onClick }: { active: boolean; user: AccessManagedUser; onClick: () => void }) {
  const superAdmin = isSuperAdmin(user);
  return (
    <Button
      fullWidth
      onClick={onClick}
      sx={{
        mb: 1.25,
        alignItems: "flex-start",
        justifyContent: "flex-start",
        gap: 1.5,
        border: 1,
        borderColor: active ? "primary.light" : "divider",
        borderRadius: 1.5,
        bgcolor: active ? "primary.50" : "background.paper",
        color: "text.primary",
        p: 2,
        textAlign: "left",
        textTransform: "none",
        boxShadow: active ? "0 1px 3px rgba(15, 108, 189, 0.12)" : "none",
        "&:hover": { bgcolor: active ? "primary.50" : "action.hover", borderColor: active ? "primary.light" : "text.disabled" },
      }}
    >
      <Avatar
        src={user.avatarUrl}
        alt={user.fullName}
        variant="rounded"
        sx={{ width: 40, height: 40, flexShrink: 0, bgcolor: "primary.50", color: "primary.main", fontSize: 12, fontWeight: 700, border: 1, borderColor: "divider" }}
      >
        {initials(user.fullName || user.email)}
      </Avatar>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
          <Typography noWrap sx={{ minWidth: 0, color: "text.primary", fontSize: 12, fontWeight: 700 }}>
            {user.fullName || user.email}
          </Typography>
          {superAdmin ? <Chip label="SUPER" size="small" color="warning" sx={{ height: 18, fontSize: 9, fontWeight: 700 }} /> : null}
        </Stack>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mt: 1, minWidth: 0, color: "text.secondary" }}>
          <MailOutlineIcon sx={{ width: 12, height: 12, flexShrink: 0 }} />
          <Typography noWrap sx={{ fontSize: 10 }}>{user.email}</Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mt: 0.25, minWidth: 0, color: "text.secondary" }}>
          <PhoneOutlinedIcon sx={{ width: 12, height: 12, flexShrink: 0 }} />
          <Typography noWrap sx={{ fontSize: 10 }}>{user.phone || "Không có SĐT"}</Typography>
        </Stack>
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5, mt: 1.5 }}>
          <MiniBadge active={active}>{statusLabel(user.status)}</MiniBadge>
          <MiniBadge active={active}>{scopeLabels[user.accessSummary.highestScope]}</MiniBadge>
        </Stack>
      </Box>
      <ChevronRightIcon sx={{ mt: 0.75, width: 16, height: 16, flexShrink: 0, color: "text.secondary" }} />
    </Button>
  );
}

export function MemberDetailHeader({ effective, loading, rootAdmin, superAdmin, user, onActivate, onBan, onBlock, onDeactivate }: {
  effective: EffectiveAccess | null;
  loading: boolean;
  rootAdmin: boolean;
  superAdmin: boolean;
  user: ReturnType<typeof mergeUser>;
  onActivate: () => void;
  onBan: () => void;
  onBlock: () => void;
  onDeactivate: () => void;
}) {
  const statusColor = user.status === "ACTIVE" ? "success" : user.status === "BLOCKED" ? "warning" : user.status === "BANNED" ? "error" : "default";

  return (
    <Paper component="section" variant="outlined" sx={{ ...panelSx, p: 2.5 }}>
      <Stack direction={{ xs: "column", xl: "row" }} spacing={2.5} sx={{ alignItems: { xs: "stretch", xl: "center" }, justifyContent: "space-between" }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start", minWidth: 0 }}>
          <Avatar src={user.avatarUrl} alt={user.fullName} variant="rounded" sx={{ width: 56, height: 56, flexShrink: 0, bgcolor: "primary.50", color: "primary.main", fontSize: 16, fontWeight: 700, border: 1, borderColor: "divider" }}>
            {initials(user.fullName || user.email)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" sx={{ alignItems: "center", flexWrap: "wrap", gap: 1 }}>
              <Typography noWrap sx={{ color: "text.primary", fontSize: 16, fontWeight: 700 }}>{user.fullName || user.email}</Typography>
              {superAdmin ? <Chip label="Super Admin" size="small" color="warning" sx={{ fontSize: 10, fontWeight: 700 }} /> : null}
              <Chip label={statusLabel(user.status)} size="small" color={statusColor} variant="outlined" sx={{ fontSize: 10, fontWeight: 700 }} />
            </Stack>
            <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: 12, fontWeight: 600 }}>{user.email}</Typography>
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mt: 1.5 }}>
              <DetailPill icon={PhoneOutlinedIcon}>{user.phone || "Chưa cập nhật SĐT"}</DetailPill>
              <DetailPill icon={ExploreOutlinedIcon}>{user.isProfileCompleted ? "Đã onboarding" : "Chưa hoàn tất onboarding"}</DetailPill>
              <DetailPill icon={VpnKeyOutlinedIcon}>
                {loading ? <Skeleton width={64} height={14} aria-label="Đang tính quyền" /> : `Quyền: ${scopeLabels[effective?.highestScope ?? "none"]}`}
              </DetailPill>
            </Stack>
          </Box>
        </Stack>
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75, flexShrink: 0 }}>
          <Button variant="outlined" color="success" disabled={rootAdmin || user.status === "ACTIVE"} onClick={onActivate} sx={actionSx}>Kích hoạt</Button>
          <Button variant="outlined" color="warning" disabled={rootAdmin || user.status === "BLOCKED"} onClick={onBlock} sx={actionSx}>Khóa tạm thời</Button>
          <Button variant="outlined" color="error" disabled={rootAdmin || user.status === "BANNED"} onClick={onBan} sx={actionSx}>Chặn truy cập</Button>
          <Button variant="outlined" color="inherit" disabled={rootAdmin || user.status === "INACTIVE"} onClick={onDeactivate} sx={actionSx}>Ngừng hoạt động</Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

export function ProfileSection({ user, draft, onChange, onSave, saving }: {
  user: ReturnType<typeof mergeUser>;
  draft: ProfileDraft;
  onChange: (draft: ProfileDraft) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const update = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => onChange({ ...draft, [key]: value });
  const fields: Array<{ key: keyof ProfileDraft; label: string; placeholder?: string; type?: string }> = [
    { key: "fullName", label: "Họ và tên" },
    { key: "phone", label: "Số điện thoại" },
    { key: "jobTitle", label: "Chức danh", placeholder: "Ví dụ: Giáo viên chính môn Toán" },
    { key: "dateOfBirth", label: "Ngày sinh", type: "date" },
    { key: "region", label: "Khu vực / Tỉnh" },
    { key: "city", label: "Thành phố" },
    { key: "district", label: "Quận / Huyện" },
    { key: "avatarUrl", label: "Đường dẫn Avatar", placeholder: "https://..." },
  ];

  return (
    <Box component="section" sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1fr) 320px" } }}>
      <Paper variant="outlined" sx={panelSx}>
        <Box sx={sectionHeaderSx}>
          <Box>
            <Typography sx={headingSx}><PersonOutlineIcon sx={{ fontSize: 18, color: "primary.main" }} />Thông tin hồ sơ</Typography>
            <Typography sx={helperSx}>Xem và hiệu chỉnh các thông tin cá nhân của thành viên.</Typography>
          </Box>
          <Button variant="contained" startIcon={<SaveOutlinedIcon />} onClick={onSave} disabled={saving} sx={actionSx}>
            {saving ? "Đang xử lý..." : "Lưu hồ sơ"}
          </Button>
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 2, mt: 2.5 }}>
          <Field label="Email đăng nhập"><TextField fullWidth size="small" value={user.email} disabled sx={fieldSx} /></Field>
          <Field label="Giới tính">
            <TextField select fullWidth size="small" value={draft.gender} onChange={(event) => update("gender", event.target.value)} sx={fieldSx}>
              <MenuItem value="">Chưa thiết lập</MenuItem><MenuItem value="male">Nam</MenuItem><MenuItem value="female">Nữ</MenuItem><MenuItem value="other">Khác</MenuItem>
            </TextField>
          </Field>
          {fields.map((field) => (
            <Field key={field.key} label={field.label}>
              <TextField fullWidth size="small" type={field.type} value={String(draft[field.key] ?? "")} placeholder={field.placeholder} onChange={(event) => update(field.key, event.target.value)} sx={fieldSx} />
            </Field>
          ))}
          <Field label="Địa chỉ liên hệ" wide><TextField fullWidth size="small" value={draft.address} placeholder="Số nhà, ngõ ngách, tên đường..." onChange={(event) => update("address", event.target.value)} sx={fieldSx} /></Field>
          <Field label="Ghi chú & Tóm tắt tiểu sử" wide><TextField fullWidth multiline minRows={3} value={draft.bio} placeholder="Thông tin bổ sung về chuyên môn giảng dạy..." onChange={(event) => update("bio", event.target.value)} sx={fieldSx} /></Field>
        </Box>
      </Paper>
      <Paper variant="outlined" sx={panelSx}>
        <Typography sx={{ ...headingSx, borderBottom: 1, borderColor: "divider", pb: 1 }}>Thông tin tài khoản</Typography>
        <Stack spacing={1.5} sx={{ mt: 2 }}>
          <InfoLine label="Trạng thái" value={statusLabel(user.status)} />
          <InfoLine label="Onboarding" value={user.isProfileCompleted ? "Đã hoàn tất" : "Chưa hoàn tất"} />
          <InfoLine label="Nhà cung cấp" value={user.provider || "local"} />
          <InfoLine label="Loại tài khoản" value={user.accountType || "erg"} />
          <InfoLine label="Số lần đăng nhập" value={String(user.loginCount ?? 0)} />
          <InfoLine label="Truy cập gần nhất" value={formatDateTime(user.lastLoginAt)} />
          <InfoLine label="Ngày tạo" value={formatDateTime(user.createdAt)} />
          <InfoLine label="Cập nhật cuối" value={formatDateTime(user.updatedAt)} />
        </Stack>
      </Paper>
    </Box>
  );
}

export function DetailPill({ children, icon: Icon }: { children: ReactNode; icon: ElementType }) { return <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "action.hover", px: 1.25, py: 0.5, color: "text.secondary", fontSize: 10, fontWeight: 700 }}><Icon sx={{ fontSize: 14 }} />{children}</Stack>; }
export function Field({ children, label, wide = false }: { children: ReactNode; label: string; wide?: boolean }) { return <Box component="label" sx={{ display: "grid", gridColumn: wide ? { md: "1 / -1" } : undefined, gap: 0.75, color: "text.secondary", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{label}{children}</Box>; }
export function InfoLine({ label, value }: { label: string; value: string }) { return <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between", border: 1, borderColor: "divider", borderRadius: 1.5, bgcolor: "action.hover", px: 1.75, py: 1.25 }}><Typography sx={{ color: "text.secondary", fontSize: 12, fontWeight: 700 }}>{label}</Typography><Typography noWrap sx={{ maxWidth: 160, color: "text.primary", fontSize: 12, fontWeight: 700 }}>{value}</Typography></Stack>; }
export function MiniBadge({ active, children }: { active: boolean; children: ReactNode }) { return <Box component="span" sx={{ border: active ? 0 : 1, borderColor: "divider", borderRadius: 1, bgcolor: active ? "primary.main" : "action.hover", color: active ? "primary.contrastText" : "text.secondary", px: 1.25, py: 0.25, fontSize: 9, fontWeight: 700, textTransform: "uppercase" }}>{children}</Box>; }

