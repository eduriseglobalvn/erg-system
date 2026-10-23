import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";

import { ErgErrorState } from "@/components/erg-mui/erg-feedback";
import { usePermissionGroups, useRoleCommands, useRoleDetail } from "@/features/access-management/hooks/use-access-management";
import type { SystemPermission } from "@/features/access-management/types/access-management";

const SENSITIVE_PERMISSION = /(^users\.manage$|^rbac\.(role\.assign|override\.manage)$|password|\.publish$|\.export$)/i;

export function RoleEditorDrawer({ tenantId, roleId, onClose }: { tenantId: string; roleId?: string; onClose: () => void }) {
  const commands = useRoleCommands(tenantId);
  const roleQuery = useRoleDetail(tenantId, roleId || undefined);
  const groupsQuery = usePermissionGroups(tenantId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isCreate = !roleId;
  const role = roleQuery.data;

  useEffect(() => {
    if (isCreate) {
      setName(""); setDescription(""); setSelected(new Set());
      return;
    }
    if (!role) return;
    setName(role.name);
    setDescription(role.description ?? "");
    setSelected(new Set(role.permissions));
  }, [isCreate, role]);

  const groups = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("vi");
    return (groupsQuery.data ?? []).map((group) => ({
      ...group,
      permissions: group.permissions.filter((permission) => !needle || [
        permission.name, permission.label, permission.description, permission.resource, permission.action,
      ].some((value) => value?.toLocaleLowerCase("vi").includes(needle))),
    })).filter((group) => group.permissions.length > 0);
  }, [groupsQuery.data, search]);
  const permissionOrder = useMemo(() => (groupsQuery.data ?? []).flatMap((group) => group.permissions.map((item) => item.name)), [groupsQuery.data]);
  const selectedPermissions = permissionOrder.filter((permission) => selected.has(permission));
  const addedSensitive = selectedPermissions.filter((permission) => SENSITIVE_PERMISSION.test(permission) && !role?.permissions.includes(permission));

  const persist = async () => {
    const payload = { name: name.trim(), description: description.trim(), permissions: selectedPermissions };
    if (isCreate) await commands.create.mutateAsync(payload);
    else await commands.update.mutateAsync({ roleId: roleId!, payload });
    setConfirmOpen(false);
    onClose();
  };
  const requestSave = () => addedSensitive.length ? setConfirmOpen(true) : void persist();
  const pending = commands.create.isPending || commands.update.isPending;
  const toggle = (permission: string) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(permission)) next.delete(permission); else next.add(permission);
    return next;
  });
  const toggleGroup = (permissions: SystemPermission[]) => setSelected((current) => {
    const next = new Set(current);
    const allSelected = permissions.every((permission) => next.has(permission.name));
    permissions.forEach((permission) => allSelected ? next.delete(permission.name) : next.add(permission.name));
    return next;
  });

  return <>
    <Drawer anchor="right" open={roleId !== undefined} onClose={onClose} slotProps={{ paper: { sx: { width: { xs: "100%", md: 680 } } } }}>
      <Box sx={{ alignItems: "center", borderBottom: "1px solid", borderColor: "divider", display: "flex", minHeight: 64, px: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>{isCreate ? "Tạo nhóm quyền" : "Sửa nhóm quyền"}</Typography>
          <Typography color="text.secondary" variant="caption">Role được cấu thành từ permission thật trong cơ sở dữ liệu.</Typography>
        </Box>
        <IconButton aria-label="Đóng trình sửa nhóm quyền" onClick={onClose}><CloseRoundedIcon /></IconButton>
      </Box>
      <Box sx={{ display: "grid", gap: 2, overflowY: "auto", p: 3 }}>
        {roleQuery.isPending && !isCreate ? <><Skeleton height={56} /><Skeleton height={96} /></> : null}
        {roleQuery.isError || groupsQuery.isError ? <ErgErrorState title="Không tải được cấu hình quyền" description="Dữ liệu role và permission phải cùng đến từ backend." /> : null}
        {!roleQuery.isPending || isCreate ? <>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) minmax(0, 1.4fr)" } }}>
            <TextField label="Mã nhóm quyền" value={name} onChange={(event) => setName(event.target.value)} disabled={Boolean(role?.isSystem)} required fullWidth />
            <TextField label="Mô tả" value={description} onChange={(event) => setDescription(event.target.value)} fullWidth />
          </Box>
          <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Chip size="small" label={`${selected.size} quyền được chọn`} color="primary" variant="outlined" />
            {!isCreate ? <Chip size="small" label={`${role?.userCount ?? 0} người dùng bị ảnh hưởng`} variant="outlined" /> : null}
            {role?.isSystem ? <Chip size="small" label="System role" color="info" /> : null}
          </Box>
          <TextField size="small" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm permission key, tên, resource, action..." slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }} />
          {groupsQuery.isPending ? <Box sx={{ display: "grid", gap: 1 }}><Skeleton height={72} /><Skeleton height={72} /><Skeleton height={72} /></Box> : null}
          {!groupsQuery.isPending && groups.length === 0 ? <Alert severity="info">Không có permission phù hợp với bộ lọc.</Alert> : null}
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {groups.map((group) => <Box key={group.id} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
              <Box sx={{ alignItems: "center", bgcolor: "action.hover", display: "flex", px: 1.5 }}>
                <FormControlLabel control={<Checkbox checked={group.permissions.every((permission) => selected.has(permission.name))} indeterminate={group.permissions.some((permission) => selected.has(permission.name)) && !group.permissions.every((permission) => selected.has(permission.name))} onChange={() => toggleGroup(group.permissions)} />} label={<Box><Typography variant="body2" sx={{ fontWeight: 800 }}>{group.label}</Typography><Typography color="text.secondary" variant="caption">{group.name} · {group.permissions.length} quyền</Typography></Box>} />
              </Box>
              <Divider />
              <Box sx={{ display: "grid", px: 1.5 }}>
                {group.permissions.map((permission) => <FormControlLabel key={permission.id} sx={{ alignItems: "flex-start", borderBottom: "1px solid", borderColor: "divider", m: 0, py: 1, "&:last-child": { borderBottom: 0 } }} control={<Checkbox checked={selected.has(permission.name)} onChange={() => toggle(permission.name)} />} label={<Box sx={{ pt: 0.25 }}><Typography variant="body2" sx={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>{permission.name}</Typography><Typography color="text.secondary" variant="caption">{permission.label}{permission.action ? ` · ${permission.action}` : ""}{SENSITIVE_PERMISSION.test(permission.name) ? " · Quyền nhạy cảm" : ""}</Typography></Box>} />)}
              </Box>
            </Box>)}
          </Box>
        </> : null}
      </Box>
      <Box sx={{ alignItems: "center", borderTop: "1px solid", borderColor: "divider", display: "flex", gap: 1, justifyContent: "flex-end", mt: "auto", p: 2 }}>
        <Button color="inherit" onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={requestSave} disabled={!name.trim() || pending || groupsQuery.isPending}>{isCreate ? "Tạo nhóm quyền" : "Lưu thay đổi"}</Button>
      </Box>
    </Drawer>
    <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
      <DialogTitle>Xác nhận cấp quyền nhạy cảm</DialogTitle>
      <DialogContent><DialogContentText>Thay đổi này ảnh hưởng {role?.userCount ?? 0} người dùng và thêm: {addedSensitive.join(", ")}. Hành động sẽ được ghi audit.</DialogContentText></DialogContent>
      <DialogActions><Button color="inherit" onClick={() => setConfirmOpen(false)}>Quay lại</Button><Button variant="contained" color="warning" onClick={() => void persist()} disabled={pending}>Xác nhận và lưu</Button></DialogActions>
    </Dialog>
  </>;
}
