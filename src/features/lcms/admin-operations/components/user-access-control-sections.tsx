import { type ElementType, type ReactNode } from "react";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import CheckIcon from "@mui/icons-material/Check";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import OndemandVideoOutlinedIcon from "@mui/icons-material/OndemandVideoOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import SearchIcon from "@mui/icons-material/Search";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type {
  AccessManagedUser,
  AccessModule,
  AccessRoleGroup,
  AccessScopeOption,
  AccessScopeType,
  EffectiveAccess,
  UserAccessPolicy,
} from "@/features/lcms/admin-operations/api/access-management-api";
import type { DraftPolicy, ProfileDraft } from "@/features/lcms/admin-operations/types/user-access-control";
import { formatDateTime, initials, isSuperAdmin, mergeUser, statusLabel } from "@/features/lcms/admin-operations/utils/user-access-control-utils";

const scopeLabels: Record<AccessScopeType | "none", string> = {
  system: "Hệ thống",
  center: "Trung tâm",
  school: "Trường học",
  none: "Chưa cấp",
};

const scopeHelp: Record<AccessScopeType, string> = {
  system: "Quản lý toàn bộ ERG LMS.",
  center: "Quản lý trung tâm và các trường trực thuộc.",
  school: "Chỉ quản lý lớp trong trường được cấp.",
};

const scopeIcons: Record<AccessScopeType, ElementType> = {
  system: VerifiedUserOutlinedIcon,
  center: BusinessOutlinedIcon,
  school: SchoolOutlinedIcon,
};

const moduleIcons: Record<string, ElementType> = {
  lms: MenuBookOutlinedIcon,
  resources: LayersOutlinedIcon,
  media: OndemandVideoOutlinedIcon,
};

const roleOptions = [
  { id: "erg_super_admin", label: "Super Admin", hint: "Toàn quyền cấu hình và vận hành hệ thống" },
  { id: "admin", label: "Quản trị viên", hint: "Quản trị nghiệp vụ nội dung & nhân sự" },
  { id: "center_admin", label: "Quản trị trung tâm", hint: "Quản lý trường, lớp thuộc cụm trung tâm" },
  { id: "school_admin", label: "Quản trị trường", hint: "Theo dõi, quản lý lớp & học sinh trực thuộc" },
  { id: "teacher", label: "Giáo viên", hint: "Giao bài, chấm điểm và báo cáo tiến độ lớp học" },
  { id: "media_manager", label: "Media Manager", hint: "Quản lý tài nguyên media, video học liệu" },
];

const roleAliases: Record<string, string[]> = {
  erg_super_admin: ["SUPER_ADMIN", "system.super_admin", "erg_super_admin"],
  admin: ["admin"],
  center_admin: ["center_admin"],
  school_admin: ["school_admin"],
  teacher: ["teacher"],
  media_manager: ["media_manager"],
};

const panelSx = {
  border: 1,
  borderColor: "divider",
  borderRadius: 2,
  bgcolor: "background.paper",
  p: 2.5,
  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
};

const sectionHeaderSx = {
  display: "flex",
  flexDirection: { xs: "column", sm: "row" },
  alignItems: { xs: "stretch", sm: "center" },
  justifyContent: "space-between",
  gap: 1.5,
  borderBottom: 1,
  borderColor: "divider",
  pb: 1.5,
};

const headingSx = {
  display: "flex",
  alignItems: "center",
  gap: 0.75,
  color: "text.primary",
  fontSize: 14,
  fontWeight: 700,
};

const helperSx = { mt: 0.5, color: "text.secondary", fontSize: 12 };

const fieldSx = {
  "& .MuiInputBase-root": { minHeight: 36, borderRadius: 1 },
  "& .MuiInputBase-input": { py: 1, fontSize: 12, fontWeight: 500 },
};

const actionSx = { minHeight: 32, borderRadius: 1, px: 1.75, fontSize: 12, fontWeight: 700, textTransform: "none" };

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
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Typography noWrap sx={{ minWidth: 0, color: "text.primary", fontSize: 12, fontWeight: 700 }}>
            {user.fullName || user.email}
          </Typography>
          {superAdmin ? <Chip label="SUPER" size="small" color="warning" sx={{ height: 18, fontSize: 9, fontWeight: 700 }} /> : null}
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1, minWidth: 0, color: "text.secondary" }}>
          <MailOutlineIcon sx={{ width: 12, height: 12, flexShrink: 0 }} />
          <Typography noWrap sx={{ fontSize: 10 }}>{user.email}</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.25, minWidth: 0, color: "text.secondary" }}>
          <PhoneOutlinedIcon sx={{ width: 12, height: 12, flexShrink: 0 }} />
          <Typography noWrap sx={{ fontSize: 10 }}>{user.phone || "Không có SĐT"}</Typography>
        </Stack>
        <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1.5 }}>
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
      <Stack direction={{ xs: "column", xl: "row" }} alignItems={{ xs: "stretch", xl: "center" }} justifyContent="space-between" spacing={2.5}>
        <Stack direction="row" alignItems="flex-start" spacing={2} sx={{ minWidth: 0 }}>
          <Avatar src={user.avatarUrl} alt={user.fullName} variant="rounded" sx={{ width: 56, height: 56, flexShrink: 0, bgcolor: "primary.50", color: "primary.main", fontSize: 16, fontWeight: 700, border: 1, borderColor: "divider" }}>
            {initials(user.fullName || user.email)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1}>
              <Typography noWrap sx={{ color: "text.primary", fontSize: 16, fontWeight: 700 }}>{user.fullName || user.email}</Typography>
              {superAdmin ? <Chip label="Super Admin" size="small" color="warning" sx={{ fontSize: 10, fontWeight: 700 }} /> : null}
              <Chip label={statusLabel(user.status)} size="small" color={statusColor} variant="outlined" sx={{ fontSize: 10, fontWeight: 700 }} />
            </Stack>
            <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: 12, fontWeight: 600 }}>{user.email}</Typography>
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1.5 }}>
              <DetailPill icon={PhoneOutlinedIcon}>{user.phone || "Chưa cập nhật SĐT"}</DetailPill>
              <DetailPill icon={ExploreOutlinedIcon}>{user.isProfileCompleted ? "Đã onboarding" : "Chưa hoàn tất onboarding"}</DetailPill>
              <DetailPill icon={VpnKeyOutlinedIcon}>
                {loading ? <Skeleton width={64} height={14} aria-label="Đang tính quyền" /> : `Quyền: ${scopeLabels[effective?.highestScope ?? "none"]}`}
              </DetailPill>
            </Stack>
          </Box>
        </Stack>
        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ flexShrink: 0 }}>
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

export function RolesSection({ currentRoles, rootAdmin, saving, onChange, onSave }: {
  currentRoles: string[];
  rootAdmin: boolean;
  saving: boolean;
  onChange: (roles: string[]) => void;
  onSave: () => void;
}) {
  const normalizedRoles = new Set(currentRoles.map((role) => role.toLowerCase()));
  const isChecked = (roleId: string) => roleAliases[roleId]?.some((role) => normalizedRoles.has(role.toLowerCase())) ?? normalizedRoles.has(roleId.toLowerCase());
  function toggle(roleId: string) {
    if (rootAdmin && roleId === "erg_super_admin") return;
    const aliases = roleAliases[roleId] ?? [roleId];
    if (isChecked(roleId)) {
      const remove = new Set(aliases.map((role) => role.toLowerCase()));
      onChange(currentRoles.filter((item) => !remove.has(item.toLowerCase())));
      return;
    }
    onChange(Array.from(new Set([...currentRoles, ...(roleId === "erg_super_admin" ? ["admin", ...aliases] : aliases)])));
  }

  return (
    <Paper component="section" variant="outlined" sx={panelSx}>
      <Box sx={sectionHeaderSx}>
        <Box><Typography sx={headingSx}><VpnKeyOutlinedIcon sx={{ fontSize: 18, color: "primary.main" }} />Vai trò hệ thống</Typography><Typography sx={helperSx}>Xác định nhóm phân quyền mặc định và phân quyền truy cập chức năng cấp cao.</Typography></Box>
        <SaveButton saving={saving} onClick={onSave}>Cập nhật vai trò</SaveButton>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" }, gap: 2, mt: 2.5 }}>
        {roleOptions.map((role) => {
          const checked = isChecked(role.id);
          return (
            <Button key={role.id} type="button" onClick={() => toggle(role.id)} disabled={rootAdmin && role.id === "erg_super_admin"} sx={{ minHeight: 110, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, border: 1, borderColor: checked ? "primary.main" : "divider", borderRadius: 1.5, bgcolor: checked ? "primary.50" : "background.paper", p: 2, textAlign: "left", textTransform: "none", "&:hover": { bgcolor: checked ? "primary.50" : "action.hover" } }}>
              <Box sx={{ minWidth: 0, flex: 1 }}><Typography sx={{ color: "text.primary", fontSize: 12, fontWeight: 700 }}>{role.label}</Typography><Typography sx={{ mt: 1, color: "text.secondary", fontSize: 10, lineHeight: 1.6 }}>{role.hint}</Typography></Box>
              {checked ? <Box sx={{ display: "grid", width: 20, height: 20, flexShrink: 0, placeItems: "center", borderRadius: "50%", bgcolor: "primary.main", color: "primary.contrastText" }}><CheckIcon sx={{ fontSize: 14 }} /></Box> : null}
            </Button>
          );
        })}
      </Box>
    </Paper>
  );
}

export function AccessSection({ draft, effective, loading, loadingScopes, modules, policies, roleGroups, scopeOptions, scopeSearch, scopeTotal, assignableRoles, saving, onAddPolicy, onDraftChange, onRemovePolicy, onSave, onScopeSearchChange, onScopeTypeChange }: {
  draft: DraftPolicy;
  effective: EffectiveAccess | null;
  loading: boolean;
  loadingScopes: boolean;
  modules: AccessModule[];
  policies: UserAccessPolicy[];
  roleGroups: AccessRoleGroup[];
  scopeOptions: AccessScopeOption[];
  scopeSearch: string;
  scopeTotal: number;
  assignableRoles: AccessRoleGroup[];
  saving: boolean;
  onAddPolicy: () => void;
  onDraftChange: (draft: DraftPolicy) => void;
  onRemovePolicy: (index: number) => void;
  onSave: () => void;
  onScopeSearchChange: (value: string) => void;
  onScopeTypeChange: (scopeType: AccessScopeType) => void;
}) {
  const selectedScope = scopeOptions.find((scope) => scope.scopeId === draft.scopeId);
  const selectedRole = assignableRoles.find((role) => role.id === draft.roleGroup);
  const canAdd = Boolean(draft.scopeType && draft.scopeId && draft.roleGroup && draft.modules.length);
  return (
    <Stack component="section" spacing={3}>
      <Paper variant="outlined" sx={panelSx}>
        <Box sx={sectionHeaderSx}>
          <Box><Typography sx={headingSx}><AdminPanelSettingsOutlinedIcon sx={{ fontSize: 18, color: "primary.main" }} />Phân quyền chi tiết</Typography><Typography sx={helperSx}>Chọn cấp độ phạm vi (Scope), vai trò thực thi (Role) và phân hệ thụ hưởng (Module).</Typography></Box>
          <Stack direction="row" flexWrap="wrap" gap={0.75}><Button variant="outlined" disabled={!canAdd || saving} onClick={onAddPolicy} sx={actionSx}>Thêm vào nháp</Button><SaveButton saving={saving} onClick={onSave}>Lưu phân quyền</SaveButton></Stack>
        </Box>
        <Stack spacing={2} sx={{ mt: 2.5 }}>
          <SegmentedScope value={draft.scopeType} onChange={onScopeTypeChange} />
          {draft.scopeType ? <SearchableScopePicker loading={loadingScopes} scopes={scopeOptions} search={scopeSearch} selectedId={draft.scopeId} total={scopeTotal} onSearch={onScopeSearchChange} onSelect={(scopeId) => onDraftChange({ ...draft, scopeId })} /> : <EmptyBlock label="Chọn loại phạm vi (Hệ thống / Trung tâm / Trường học) phía trên để cấu hình." />}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}><CompactRolePicker roles={assignableRoles} value={draft.roleGroup} onSelect={(roleGroup) => onDraftChange({ ...draft, roleGroup })} /><CompactModulePicker modules={modules} selected={draft.modules} onChange={(nextModules) => onDraftChange({ ...draft, modules: nextModules })} /></Box>
          {selectedScope || selectedRole ? <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1} sx={{ border: 1, borderColor: "primary.light", borderRadius: 1.5, bgcolor: "primary.50", px: 2, py: 1.5 }}><Typography sx={{ fontSize: 12, fontWeight: 700 }}>Đang cấu hình:</Typography>{selectedScope ? <Typography sx={{ color: "primary.main", fontSize: 12, fontWeight: 700 }}>{selectedScope.name}</Typography> : null}{selectedScope && selectedRole ? <Typography>·</Typography> : null}{selectedRole ? <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{selectedRole.name}</Typography> : null}</Stack> : null}
        </Stack>
      </Paper>
      <Paper variant="outlined" sx={panelSx}>
        <Box sx={sectionHeaderSx}>
          <Box><Typography sx={headingSx}>Quyền truy cập đã xác nhận</Typography><Typography sx={helperSx}>Danh sách các chính sách phân quyền hiện tại đang được áp dụng.</Typography></Box>
          <Stack direction="row" flexWrap="wrap" gap={0.75}><MetricChip label={`Phạm vi cao nhất: ${scopeLabels[effective?.highestScope ?? "none"]}`} /><MetricChip label={`Số module: ${effective?.modules.length ?? 0}`} /><MetricChip label={`Permissions: ${effective?.permissions.length ?? 0}`} /></Stack>
        </Box>
        <Stack spacing={1.5} sx={{ mt: 2 }}>
          {loading ? <LoadingBlock label="Đang đồng bộ cấu hình quyền..." /> : null}
          {!loading && policies.length === 0 ? <EmptyBlock label="Thành viên này hiện chưa được gán bất kỳ quyền truy cập nào." /> : null}
          {!loading ? policies.map((policy, index) => <PolicyRow key={policy.id ?? `${policy.scopeType}-${policy.scopeId}-${policy.roleGroup}-${index}`} modules={modules} policy={policy} role={roleGroups.find((role) => role.id === policy.roleGroup)} onRemove={() => onRemovePolicy(index)} />) : null}
          {effective?.warnings?.length ? <Box sx={{ border: 1, borderColor: "warning.light", borderRadius: 1.5, bgcolor: "warning.50", color: "warning.dark", p: 2, fontSize: 12, fontWeight: 600 }}>{effective.warnings.join(". ")}</Box> : null}
        </Stack>
      </Paper>
    </Stack>
  );
}

function SegmentedScope({ value, onChange }: { value: AccessScopeType | ""; onChange: (value: AccessScopeType) => void }) {
  return <Stack direction="row" flexWrap="wrap" gap={1}>{(["system", "center", "school"] as AccessScopeType[]).map((scopeType) => { const Icon = scopeIcons[scopeType]; const active = value === scopeType; return <Button key={scopeType} variant={active ? "contained" : "outlined"} title={scopeHelp[scopeType]} startIcon={<Icon sx={{ fontSize: 16 }} />} onClick={() => onChange(scopeType)} sx={actionSx}>{scopeLabels[scopeType]}</Button>; })}</Stack>;
}

function SearchableScopePicker({ loading, scopes, search, selectedId, total, onSearch, onSelect }: { loading: boolean; scopes: AccessScopeOption[]; search: string; selectedId: string; total: number; onSearch: (value: string) => void; onSelect: (scopeId: string) => void }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 1.5, bgcolor: "action.hover", p: 2 }}>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" spacing={1.25}>
        <TextField size="small" value={search} placeholder="Tìm nhanh trường học hoặc trung tâm..." onChange={(event) => onSearch(event.target.value)} slotProps={{ input: { startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary", fontSize: 18 }} /> } }} sx={{ ...fieldSx, width: { xs: "100%", sm: 320 } }} />
        <Typography sx={{ color: "text.secondary", fontSize: 10, fontWeight: 700 }}>{loading ? <Skeleton width={64} height={18} aria-label="Đang đồng bộ phạm vi..." /> : `Đã tải ${scopes.length}/${total} phạm vi`}</Typography>
      </Stack>
      {!loading && scopes.length === 0 ? <Box sx={{ mt: 1.5 }}><EmptyBlock label="Không tìm thấy cơ sở khớp với bộ lọc." /></Box> : null}
      {scopes.length > 0 ? <Paper variant="outlined" sx={{ mt: 1.5, maxHeight: 220, overflowY: "auto", borderRadius: 1 }}>
        {scopes.map((scope) => { const Icon = scopeIcons[scope.scopeType]; const checked = selectedId === scope.scopeId; return <Button key={`${scope.scopeType}-${scope.scopeId}`} fullWidth onClick={() => onSelect(scope.scopeId)} sx={{ justifyContent: "flex-start", gap: 1.5, borderBottom: 1, borderColor: "divider", borderRadius: 0, bgcolor: checked ? "primary.50" : "background.paper", px: 1.5, py: 1.25, textAlign: "left", textTransform: "none", "&:last-of-type": { borderBottom: 0 }, "&:hover": { bgcolor: checked ? "primary.50" : "action.hover" } }}><Box sx={{ display: "grid", width: 32, height: 32, flexShrink: 0, placeItems: "center", borderRadius: 1, bgcolor: checked ? "primary.main" : "action.hover", color: checked ? "primary.contrastText" : "text.secondary" }}><Icon sx={{ fontSize: 18 }} /></Box><Box sx={{ minWidth: 0, flex: 1 }}><Typography noWrap sx={{ color: "text.primary", fontSize: 12, fontWeight: 700 }}>{scope.name}</Typography><Typography noWrap sx={{ mt: 0.25, color: "text.secondary", fontSize: 10, fontWeight: 600 }}>{scope.description}</Typography></Box>{checked ? <CheckIcon sx={{ color: "primary.main", fontSize: 18 }} /> : null}</Button>; })}
      </Paper> : null}
    </Paper>
  );
}

function CompactRolePicker({ roles, value, onSelect }: { roles: AccessRoleGroup[]; value: string; onSelect: (value: string) => void }) {
  if (!roles.length) return <EmptyBlock label="Chọn cấp phạm vi bên trên để xem các vai trò được phép gán." />;
  const selectedRole = roles.find((role) => role.id === value);
  return <PickerSurface title="Nhóm vai trò" caption="Chọn 1 vai trò"><TextField select fullWidth size="small" value={value} onChange={(event) => onSelect(event.target.value)} sx={fieldSx}><MenuItem value="">Chọn nhóm phân quyền</MenuItem>{roles.map((role) => <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>)}</TextField>{selectedRole ? <Typography sx={{ mt: 1, color: "text.secondary", fontSize: 10, fontWeight: 600 }}>{selectedRole.description}</Typography> : null}</PickerSurface>;
}

function CompactModulePicker({ modules, selected, onChange }: { modules: AccessModule[]; selected: string[]; onChange: (modules: string[]) => void }) {
  const toggle = (moduleId: string) => onChange(selected.includes(moduleId) ? selected.filter((item) => item !== moduleId) : [...selected, moduleId]);
  return <PickerSurface title="Phân hệ" caption="Chọn các phân hệ"><Stack direction="row" flexWrap="wrap" gap={0.75}>{modules.map((module) => { const Icon = moduleIcons[module.id] ?? LayersOutlinedIcon; const checked = selected.includes(module.id); return <Button key={module.id} variant={checked ? "contained" : "outlined"} title={module.description} startIcon={<Icon sx={{ fontSize: 16 }} />} endIcon={checked ? <CheckIcon sx={{ fontSize: 14 }} /> : undefined} onClick={() => toggle(module.id)} sx={{ ...actionSx, minHeight: 32, px: 1.25 }}>{module.name}</Button>; })}</Stack></PickerSurface>;
}

function PolicyRow({ modules, policy, role, onRemove }: { modules: AccessModule[]; policy: UserAccessPolicy; role?: AccessRoleGroup; onRemove: () => void }) {
  const Icon = scopeIcons[policy.scopeType];
  return <Paper component="article" variant="outlined" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1.2fr) minmax(0, 1fr) auto" }, alignItems: { sm: "center" }, gap: 1.5, borderRadius: 1.5, bgcolor: "action.hover", p: 2 }}><Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}><Box sx={{ display: "grid", width: 36, height: 36, flexShrink: 0, placeItems: "center", borderRadius: 1, bgcolor: "background.paper", color: "text.secondary", border: 1, borderColor: "divider" }}><Icon sx={{ fontSize: 18 }} /></Box><Box sx={{ minWidth: 0 }}><Typography noWrap sx={{ color: "text.primary", fontSize: 12, fontWeight: 700 }}>{policy.scopeName ?? policy.scopeId}</Typography><Typography sx={{ mt: 0.25, color: "text.secondary", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{scopeLabels[policy.scopeType]}</Typography></Box></Stack><Box sx={{ minWidth: 0 }}><Typography noWrap sx={{ color: "text.primary", fontSize: 12, fontWeight: 700 }}>{role?.name ?? policy.roleGroup}</Typography><Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1 }}>{policy.modules.map((moduleId) => <Chip key={moduleId} variant="outlined" size="small" label={modules.find((module) => module.id === moduleId)?.name ?? moduleId} sx={{ height: 22, bgcolor: "background.paper", fontSize: 9, fontWeight: 700 }} />)}</Stack></Box><Button color="error" variant="outlined" startIcon={<DeleteOutlineIcon />} onClick={onRemove} sx={actionSx}>Gỡ bỏ</Button></Paper>;
}

function DetailPill({ children, icon: Icon }: { children: ReactNode; icon: ElementType }) { return <Stack direction="row" alignItems="center" spacing={0.5} sx={{ border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "action.hover", px: 1.25, py: 0.5, color: "text.secondary", fontSize: 10, fontWeight: 700 }}><Icon sx={{ fontSize: 14 }} />{children}</Stack>; }
function Field({ children, label, wide = false }: { children: ReactNode; label: string; wide?: boolean }) { return <Box component="label" sx={{ display: "grid", gridColumn: wide ? { md: "1 / -1" } : undefined, gap: 0.75, color: "text.secondary", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{label}{children}</Box>; }
function SaveButton({ children, saving, onClick }: { children: ReactNode; saving: boolean; onClick: () => void }) { return <Button variant="contained" startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveOutlinedIcon />} disabled={saving} onClick={onClick} sx={actionSx}>{children}</Button>; }
function PickerSurface({ title, caption, children }: { title: string; caption: string; children: ReactNode }) { return <Paper variant="outlined" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "120px minmax(0, 1fr)" }, gap: 1.5, borderRadius: 1.5, bgcolor: "action.hover", p: 2 }}><Box><Typography sx={{ color: "text.primary", fontSize: 12, fontWeight: 700 }}>{title}</Typography><Typography sx={{ mt: 0.25, color: "text.secondary", fontSize: 10 }}>{caption}</Typography></Box><Box sx={{ minWidth: 0 }}>{children}</Box></Paper>; }
function MetricChip({ label }: { label: string }) { return <Chip label={label} size="small" variant="outlined" sx={{ bgcolor: "action.hover", fontSize: 10, fontWeight: 700 }} />; }

export function HeaderMetric({ label, value }: { label: string; value: string }) { return <Box sx={{ minWidth: 100, px: 1.75, py: 1.5 }}><Typography sx={{ color: "text.primary", fontSize: 16, fontWeight: 700 }}>{value}</Typography><Typography sx={{ mt: 0.25, color: "text.secondary", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{label}</Typography></Box>; }
function InfoLine({ label, value }: { label: string; value: string }) { return <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, bgcolor: "action.hover", px: 1.75, py: 1.25 }}><Typography sx={{ color: "text.secondary", fontSize: 12, fontWeight: 700 }}>{label}</Typography><Typography noWrap sx={{ maxWidth: 160, color: "text.primary", fontSize: 12, fontWeight: 700 }}>{value}</Typography></Stack>; }
export function Banner({ children, tone }: { children: ReactNode; tone: "error" | "success" }) { const error = tone === "error"; return <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ mt: 2, border: 1, borderColor: error ? "error.light" : "success.light", borderRadius: 1.5, bgcolor: error ? "error.50" : "success.50", color: error ? "error.dark" : "success.dark", px: 2, py: 1.5, fontSize: 12, fontWeight: 600 }}>{error ? <ErrorOutlineIcon sx={{ mt: 0.25, fontSize: 18 }} /> : <CheckIcon sx={{ mt: 0.25, fontSize: 18 }} />}<Box>{children}</Box></Stack>; }
export function LoadingBlock({ label }: { label: string }) { return <Paper variant="outlined" aria-label={label} sx={{ display: "grid", gap: 1.5, borderRadius: 1.5, p: 2.5 }}><Skeleton width={176} height={16} /><Skeleton width="100%" height={12} /><Skeleton width="66%" height={12} /></Paper>; }
export function EmptyBlock({ label }: { label: string }) { return <Box sx={{ border: 1, borderStyle: "dashed", borderColor: "divider", borderRadius: 1.5, bgcolor: "action.hover", p: 3, color: "text.secondary", fontSize: 12, fontWeight: 600, lineHeight: 1.6, textAlign: "center" }}>{label}</Box>; }
function MiniBadge({ active, children }: { active: boolean; children: ReactNode }) { return <Box component="span" sx={{ border: active ? 0 : 1, borderColor: "divider", borderRadius: 1, bgcolor: active ? "primary.main" : "action.hover", color: active ? "primary.contrastText" : "text.secondary", px: 1.25, py: 0.25, fontSize: 9, fontWeight: 700, textTransform: "uppercase" }}>{children}</Box>; }
