import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
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

  return (
    <>
      <Drawer
        anchor="right"
        open={roleId !== undefined}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              bgcolor: "#FBFBFD",
              borderRadius: { sm: "20px 0 0 20px" },
              boxShadow: "0 20px 48px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.06)",
              display: "flex",
              flexDirection: "column",
              width: { xs: "100%", md: 680 },
            },
          },
        }}
      >
        {/* Header */}
        <Box sx={{ alignItems: "center", borderBottom: "1px solid rgba(0, 0, 0, 0.06)", display: "flex", minHeight: 64, px: 3, py: 1.5 }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: "#1D1D1F", fontSize: "1.2rem", fontWeight: 800, letterSpacing: "-0.015em" }}>
              {isCreate ? "Tạo nhóm quyền" : "Sửa nhóm quyền"}
            </Typography>
            <Typography sx={{ color: "#86868B", fontSize: "0.78rem" }}>
              Role được cấu thành từ permission thật trong cơ sở dữ liệu.
            </Typography>
          </Box>
          <IconButton
            aria-label="Đóng trình sửa nhóm quyền"
            onClick={onClose}
            sx={{
              bgcolor: "rgba(0, 0, 0, 0.05)",
              color: "#1D1D1F",
              height: 32,
              width: 32,
              "&:hover": { bgcolor: "rgba(0, 0, 0, 0.09)", transform: "scale(1.05)" },
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Form Body */}
        <Box sx={{ display: "grid", gap: 2.5, overflowY: "auto", p: 3 }}>
          {roleQuery.isPending && !isCreate ? <><Skeleton height={56} sx={{ borderRadius: "10px" }} /><Skeleton height={96} sx={{ borderRadius: "10px" }} /></> : null}
          {roleQuery.isError || groupsQuery.isError ? (
            <ErgErrorState title="Không tải được cấu hình quyền" description="Dữ liệu role và permission phải cùng đến từ backend." />
          ) : null}

          {!roleQuery.isPending || isCreate ? (
            <>
              {/* Identity Inputs */}
              <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) minmax(0, 1.4fr)" } }}>
                <TextField
                  disabled={Boolean(role?.isSystem)}
                  fullWidth
                  label="Mã nhóm quyền"
                  onChange={(event) => setName(event.target.value)}
                  required
                  size="small"
                  value={name}
                  sx={appleInputSx}
                />
                <TextField
                  fullWidth
                  label="Mô tả"
                  onChange={(event) => setDescription(event.target.value)}
                  size="small"
                  value={description}
                  sx={appleInputSx}
                />
              </Box>

              {/* Status & Counts Badges */}
              <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1 }}>
                <Box
                  sx={{
                    bgcolor: "rgba(0, 113, 227, 0.08)",
                    border: "1px solid rgba(0, 113, 227, 0.18)",
                    borderRadius: "9999px",
                    color: "#0071E3",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    px: 1.25,
                    py: 0.4,
                  }}
                >
                  {selected.size} quyền được chọn
                </Box>
                {!isCreate ? (
                  <Box
                    sx={{
                      bgcolor: "rgba(0, 0, 0, 0.05)",
                      borderRadius: "9999px",
                      color: "#6E6E73",
                      fontSize: "0.75rem",
                      fontWeight: 650,
                      px: 1.25,
                      py: 0.4,
                    }}
                  >
                    {role?.userCount ?? 0} người dùng bị ảnh hưởng
                  </Box>
                ) : null}
                {role?.isSystem ? (
                  <Box
                    sx={{
                      bgcolor: "rgba(175, 82, 222, 0.1)",
                      border: "1px solid rgba(175, 82, 222, 0.2)",
                      borderRadius: "9999px",
                      color: "#7E22CE",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      px: 1.25,
                      py: 0.4,
                    }}
                  >
                    System role
                  </Box>
                ) : null}
              </Box>

              {/* Spotlight Search */}
              <TextField
                placeholder="Tìm permission key, tên, resource, action..."
                size="small"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon sx={{ color: "#86868B", fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#FFFFFF",
                    borderRadius: "10px",
                    fontSize: "0.85rem",
                    "& fieldset": { borderColor: "rgba(0, 0, 0, 0.1)" },
                    "&:hover fieldset": { borderColor: "rgba(0, 0, 0, 0.2)" },
                    "&.Mui-focused fieldset": {
                      borderColor: "#0071E3",
                      boxShadow: "0 0 0 3px rgba(0, 113, 227, 0.15)",
                    },
                  },
                }}
              />

              {groupsQuery.isPending ? <Box sx={{ display: "grid", gap: 1 }}><Skeleton height={72} sx={{ borderRadius: "12px" }} /><Skeleton height={72} sx={{ borderRadius: "12px" }} /><Skeleton height={72} sx={{ borderRadius: "12px" }} /></Box> : null}
              {!groupsQuery.isPending && groups.length === 0 ? <Alert severity="info" sx={{ borderRadius: "12px" }}>Không có permission phù hợp với bộ lọc.</Alert> : null}

              {/* Groups List */}
              <Box sx={{ display: "grid", gap: 2 }}>
                {groups.map((group) => (
                  <Box
                    key={group.id}
                    sx={{
                      bgcolor: "#FFFFFF",
                      border: "1px solid rgba(0, 0, 0, 0.06)",
                      borderRadius: "14px",
                      boxShadow: "0 1px 4px rgba(0, 0, 0, 0.02)",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        alignItems: "center",
                        bgcolor: "rgba(0, 0, 0, 0.02)",
                        borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
                        display: "flex",
                        px: 2,
                        py: 0.5,
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={group.permissions.every((permission) => selected.has(permission.name))}
                            indeterminate={group.permissions.some((permission) => selected.has(permission.name)) && !group.permissions.every((permission) => selected.has(permission.name))}
                            onChange={() => toggleGroup(group.permissions)}
                            sx={{ color: "#86868B", "&.Mui-checked, &.MuiCheckbox-indeterminate": { color: "#0071E3" } }}
                          />
                        }
                        label={
                          <Box sx={{ py: 0.5 }}>
                            <Typography sx={{ color: "#1D1D1F", fontSize: "0.85rem", fontWeight: 750 }}>
                              {group.label}
                            </Typography>
                            <Typography sx={{ color: "#86868B", fontSize: "0.72rem" }}>
                              {group.name} · {group.permissions.length} quyền
                            </Typography>
                          </Box>
                        }
                      />
                    </Box>

                    <Box sx={{ display: "grid", px: 2, py: 0.5 }}>
                      {group.permissions.map((permission) => (
                        <FormControlLabel
                          key={permission.id}
                          control={
                            <Checkbox
                              checked={selected.has(permission.name)}
                              onChange={() => toggle(permission.name)}
                              sx={{ color: "#86868B", "&.Mui-checked": { color: "#0071E3" } }}
                            />
                          }
                          label={
                            <Box sx={{ py: 0.75 }}>
                              <Typography sx={{ color: "#1D1D1F", fontFamily: "var(--font-mono)", fontSize: "0.8rem", fontWeight: 700 }}>
                                {permission.name}
                              </Typography>
                              <Typography sx={{ color: "#6E6E73", fontSize: "0.72rem" }}>
                                {permission.label}
                                {permission.action ? ` · ${permission.action}` : ""}
                                {SENSITIVE_PERMISSION.test(permission.name) ? " · ⚠️ Quyền nhạy cảm" : ""}
                              </Typography>
                            </Box>
                          }
                          sx={{
                            alignItems: "flex-start",
                            borderBottom: "1px solid rgba(0, 0, 0, 0.04)",
                            m: 0,
                            "&:last-child": { borderBottom: 0 },
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            </>
          ) : null}
        </Box>

        {/* Footer Actions */}
        <Box sx={{ alignItems: "center", bgcolor: "#FFFFFF", borderTop: "1px solid rgba(0, 0, 0, 0.06)", display: "flex", gap: 1.25, justifyContent: "flex-end", mt: "auto", p: 2 }}>
          <Button variant="contained"
            onClick={onClose}
            sx={{
              borderRadius: "10px",
              color: "#6E6E73",
              fontSize: "0.85rem",
              fontWeight: 650,
              px: 2,
              textTransform: "none",
              "&:hover": { bgcolor: "rgba(0, 0, 0, 0.05)", color: "#1D1D1F" },
            }}
          >
            Hủy
          </Button>
          <Button
            disabled={!name.trim() || pending || groupsQuery.isPending}
            onClick={requestSave}
            variant="contained"
            sx={{
              bgcolor: "#0071E3",
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(0, 113, 227, 0.28)",
              color: "#FFFFFF",
              fontSize: "0.85rem",
              fontWeight: 650,
              px: 2.5,
              py: 0.85,
              textTransform: "none",
              transition: "all 0.15s ease",
              "&:hover": {
                bgcolor: "#0077ED",
                boxShadow: "0 4px 14px rgba(0, 113, 227, 0.38)",
              },
            }}
          >
            {isCreate ? "Tạo nhóm quyền" : "Lưu thay đổi"}
          </Button>
        </Box>
      </Drawer>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "18px",
              boxShadow: "0 20px 48px rgba(0, 0, 0, 0.16)",
              p: 1,
            },
          },
        }}
      >
        <DialogTitle sx={{ color: "#1D1D1F", fontSize: "1.15rem", fontWeight: 800 }}>
          Xác nhận cấp quyền nhạy cảm
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#6E6E73", fontSize: "0.85rem" }}>
            Thay đổi này ảnh hưởng {role?.userCount ?? 0} người dùng và thêm: {addedSensitive.join(", ")}. Hành động sẽ được ghi audit.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="contained"
            onClick={() => setConfirmOpen(false)}
            sx={{ borderRadius: "10px", color: "#6E6E73", fontWeight: 650, textTransform: "none" }}
          >
            Quay lại
          </Button>
          <Button
            color="warning"
            disabled={pending}
            onClick={() => void persist()}
            variant="contained"
            sx={{
              bgcolor: "#FF9500",
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(255, 149, 0, 0.28)",
              color: "#FFFFFF",
              fontWeight: 650,
              textTransform: "none",
              "&:hover": { bgcolor: "#E68600" },
            }}
          >
            Xác nhận và lưu
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const appleInputSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "#FFFFFF",
    borderRadius: "10px",
    fontSize: "0.85rem",
    fontWeight: 550,
    "& fieldset": { borderColor: "rgba(0, 0, 0, 0.12)" },
    "&:hover fieldset": { borderColor: "rgba(0, 0, 0, 0.22)" },
    "&.Mui-focused fieldset": {
      borderColor: "#0071E3",
      boxShadow: "0 0 0 3px rgba(0, 113, 227, 0.15)",
    },
  },
  "& .MuiInputLabel-root": {
    color: "#6E6E73",
    fontSize: "0.85rem",
    fontWeight: 650,
    "&.Mui-focused": { color: "#0071E3" },
  },
};
