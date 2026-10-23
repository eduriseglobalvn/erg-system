import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import CheckIcon from "@mui/icons-material/Check";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { AccessModule, AccessRoleGroup, AccessScopeOption, AccessScopeType, EffectiveAccess, UserAccessPolicy } from "@/features/lcms/admin-operations/api/access-management-api";
import type { DraftPolicy } from "@/features/lcms/admin-operations/types/user-access-control";
import { actionSx, fieldSx, headingSx, helperSx, moduleIcons, panelSx, scopeHelp, scopeIcons, scopeLabels, sectionHeaderSx } from "./user-access-control-section-config";
import { EmptyBlock, LoadingBlock, MetricChip, PickerSurface, SaveButton } from "./user-access-control-section-primitives";

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
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}><Button variant="outlined" disabled={!canAdd || saving} onClick={onAddPolicy} sx={actionSx}>Thêm vào nháp</Button><SaveButton saving={saving} onClick={onSave}>Lưu phân quyền</SaveButton></Stack>
        </Box>
        <Stack spacing={2} sx={{ mt: 2.5 }}>
          <SegmentedScope value={draft.scopeType} onChange={onScopeTypeChange} />
          {draft.scopeType ? <SearchableScopePicker loading={loadingScopes} scopes={scopeOptions} search={scopeSearch} selectedId={draft.scopeId} total={scopeTotal} onSearch={onScopeSearchChange} onSelect={(scopeId) => onDraftChange({ ...draft, scopeId })} /> : <EmptyBlock label="Chọn loại phạm vi (Hệ thống / Trung tâm / Trường học) phía trên để cấu hình." />}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}><CompactRolePicker roles={assignableRoles} value={draft.roleGroup} onSelect={(roleGroup) => onDraftChange({ ...draft, roleGroup })} /><CompactModulePicker modules={modules} selected={draft.modules} onChange={(nextModules) => onDraftChange({ ...draft, modules: nextModules })} /></Box>
          {selectedScope || selectedRole ? <Stack direction="row" sx={{ alignItems: "center", flexWrap: "wrap", gap: 1, border: 1, borderColor: "primary.light", borderRadius: 1.5, bgcolor: "primary.50", px: 2, py: 1.5 }}><Typography sx={{ fontSize: 12, fontWeight: 700 }}>Đang cấu hình:</Typography>{selectedScope ? <Typography sx={{ color: "primary.main", fontSize: 12, fontWeight: 700 }}>{selectedScope.name}</Typography> : null}{selectedScope && selectedRole ? <Typography>·</Typography> : null}{selectedRole ? <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{selectedRole.name}</Typography> : null}</Stack> : null}
        </Stack>
      </Paper>
      <Paper variant="outlined" sx={panelSx}>
        <Box sx={sectionHeaderSx}>
          <Box><Typography sx={headingSx}>Quyền truy cập đã xác nhận</Typography><Typography sx={helperSx}>Danh sách các chính sách phân quyền hiện tại đang được áp dụng.</Typography></Box>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}><MetricChip label={`Phạm vi cao nhất: ${scopeLabels[effective?.highestScope ?? "none"]}`} /><MetricChip label={`Số module: ${effective?.modules.length ?? 0}`} /><MetricChip label={`Permissions: ${effective?.permissions.length ?? 0}`} /></Stack>
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

export function SegmentedScope({ value, onChange }: { value: AccessScopeType | ""; onChange: (value: AccessScopeType) => void }) {
  return <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>{(["system", "center", "school"] as AccessScopeType[]).map((scopeType) => { const Icon = scopeIcons[scopeType]; const active = value === scopeType; return <Button key={scopeType} variant={active ? "contained" : "outlined"} title={scopeHelp[scopeType]} startIcon={<Icon sx={{ fontSize: 16 }} />} onClick={() => onChange(scopeType)} sx={actionSx}>{scopeLabels[scopeType]}</Button>; })}</Stack>;
}

export function SearchableScopePicker({ loading, scopes, search, selectedId, total, onSearch, onSelect }: { loading: boolean; scopes: AccessScopeOption[]; search: string; selectedId: string; total: number; onSearch: (value: string) => void; onSelect: (scopeId: string) => void }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 1.5, bgcolor: "action.hover", p: 2 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ alignItems: { xs: "stretch", sm: "center" }, justifyContent: "space-between" }}>
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

export function CompactRolePicker({ roles, value, onSelect }: { roles: AccessRoleGroup[]; value: string; onSelect: (value: string) => void }) {
  if (!roles.length) return <EmptyBlock label="Chọn cấp phạm vi bên trên để xem các vai trò được phép gán." />;
  const selectedRole = roles.find((role) => role.id === value);
  return <PickerSurface title="Nhóm vai trò" caption="Chọn 1 vai trò"><TextField select fullWidth size="small" value={value} onChange={(event) => onSelect(event.target.value)} sx={fieldSx}><MenuItem value="">Chọn nhóm phân quyền</MenuItem>{roles.map((role) => <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>)}</TextField>{selectedRole ? <Typography sx={{ mt: 1, color: "text.secondary", fontSize: 10, fontWeight: 600 }}>{selectedRole.description}</Typography> : null}</PickerSurface>;
}

export function CompactModulePicker({ modules, selected, onChange }: { modules: AccessModule[]; selected: string[]; onChange: (modules: string[]) => void }) {
  const toggle = (moduleId: string) => onChange(selected.includes(moduleId) ? selected.filter((item) => item !== moduleId) : [...selected, moduleId]);
  return <PickerSurface title="Phân hệ" caption="Chọn các phân hệ"><Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>{modules.map((module) => { const Icon = moduleIcons[module.id] ?? LayersOutlinedIcon; const checked = selected.includes(module.id); return <Button key={module.id} variant={checked ? "contained" : "outlined"} title={module.description} startIcon={<Icon sx={{ fontSize: 16 }} />} endIcon={checked ? <CheckIcon sx={{ fontSize: 14 }} /> : undefined} onClick={() => toggle(module.id)} sx={{ ...actionSx, minHeight: 32, px: 1.25 }}>{module.name}</Button>; })}</Stack></PickerSurface>;
}

export function PolicyRow({ modules, policy, role, onRemove }: { modules: AccessModule[]; policy: UserAccessPolicy; role?: AccessRoleGroup; onRemove: () => void }) {
  const Icon = scopeIcons[policy.scopeType];
  return <Paper component="article" variant="outlined" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1.2fr) minmax(0, 1fr) auto" }, alignItems: { sm: "center" }, gap: 1.5, borderRadius: 1.5, bgcolor: "action.hover", p: 2 }}><Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}><Box sx={{ display: "grid", width: 36, height: 36, flexShrink: 0, placeItems: "center", borderRadius: 1, bgcolor: "background.paper", color: "text.secondary", border: 1, borderColor: "divider" }}><Icon sx={{ fontSize: 18 }} /></Box><Box sx={{ minWidth: 0 }}><Typography noWrap sx={{ color: "text.primary", fontSize: 12, fontWeight: 700 }}>{policy.scopeName ?? policy.scopeId}</Typography><Typography sx={{ mt: 0.25, color: "text.secondary", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{scopeLabels[policy.scopeType]}</Typography></Box></Stack><Box sx={{ minWidth: 0 }}><Typography noWrap sx={{ color: "text.primary", fontSize: 12, fontWeight: 700 }}>{role?.name ?? policy.roleGroup}</Typography><Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5, mt: 1 }}>{policy.modules.map((moduleId) => <Chip key={moduleId} variant="outlined" size="small" label={modules.find((module) => module.id === moduleId)?.name ?? moduleId} sx={{ height: 22, bgcolor: "background.paper", fontSize: 9, fontWeight: 700 }} />)}</Stack></Box><Button color="error" variant="outlined" startIcon={<DeleteOutlineIcon />} onClick={onRemove} sx={actionSx}>Gỡ bỏ</Button></Paper>;
}
