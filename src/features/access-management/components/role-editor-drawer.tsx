import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
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
import { alpha } from "@mui/material/styles";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

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

  // Tạo mới và không có quyền nhạy cảm thì lưu luôn; sửa nhóm quyền đang có người dùng luôn phải xác nhận.
  const requestSave = () => (isCreate && !addedSensitive.length ? void persist() : setConfirmOpen(true));
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
        <Box sx={{ alignItems: "center", borderBottom: `1px solid ${ergEnterpriseTokens.color.border}`, display: "flex", minHeight: 64, px: 3, py: 1.5 }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: "text.primary", fontSize: "1.2rem", fontWeight: 600, letterSpacing: "-0.015em" }}>
              {isCreate ? "Tạo nhóm quyền" : "Sửa nhóm quyền"}
            </Typography>
            <Typography sx={{ color: "text.disabled", fontSize: "0.78rem" }}>
              Role được cấu thành từ permission thật trong cơ sở dữ liệu.
            </Typography>
          </Box>
          <IconButton
            aria-label="Đóng trình sửa nhóm quyền"
            onClick={onClose}
            sx={{
              bgcolor: "rgba(0, 0, 0, 0.05)",
              color: "text.primary",
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
          {roleQuery.isPending && !isCreate ? <><Skeleton height={56} sx={{ borderRadius: `${ergEnterpriseTokens.radius.md}px` }} /><Skeleton height={96} sx={{ borderRadius: `${ergEnterpriseTokens.radius.md}px` }} /></> : null}
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
                    bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.08),
                    border: `1px solid ${alpha(ergEnterpriseTokens.color.primary, 0.18)}`,
                    borderRadius: "9999px",
                    color: "primary.main",
                    fontSize: "0.75rem",
                    fontWeight: 600,
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
                      color: "text.secondary",
                      fontSize: "0.75rem",
                      fontWeight: 600,
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
                      fontWeight: 600,
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
                        <SearchRoundedIcon sx={{ color: "text.disabled", fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#FFFFFF",
                    borderRadius: `${ergEnterpriseTokens.radius.md}px`,
                    fontSize: "0.85rem",
                    "& fieldset": { borderColor: "divider" },
                    "&:hover fieldset": { borderColor: "rgba(0, 0, 0, 0.2)" },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                      boxShadow: `0 0 0 3px ${alpha(ergEnterpriseTokens.color.primary, 0.15)}`,
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
                      border: `1px solid ${ergEnterpriseTokens.color.border}`,
                      borderRadius: "14px",
                      boxShadow: "0 1px 4px rgba(0, 0, 0, 0.02)",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        alignItems: "center",
                        bgcolor: "rgba(0, 0, 0, 0.02)",
                        borderBottom: `1px solid ${ergEnterpriseTokens.color.border}`,
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
                            sx={{ color: "text.disabled", "&.Mui-checked, &.MuiCheckbox-indeterminate": { color: "primary.main" } }}
                          />
                        }
                        label={
                          <Box sx={{ py: 0.5 }}>
                            <Typography sx={{ color: "text.primary", fontSize: "0.85rem", fontWeight: 600 }}>
                              {group.label}
                            </Typography>
                            <Typography sx={{ color: "text.disabled", fontSize: "0.72rem" }}>
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
                              sx={{ color: "text.disabled", "&.Mui-checked": { color: "primary.main" } }}
                            />
                          }
                          label={
                            <Box sx={{ py: 0.75 }}>
                              <Typography sx={{ color: "text.primary", fontFamily: "var(--font-mono)", fontSize: "0.8rem", fontWeight: 600 }}>
                                {permission.name}
                              </Typography>
                              <Typography sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
                                {permission.label}
                                {permission.action ? ` · ${permission.action}` : ""}
                                {SENSITIVE_PERMISSION.test(permission.name) ? " · ⚠️ Quyền nhạy cảm" : ""}
                              </Typography>
                            </Box>
                          }
                          sx={{
                            alignItems: "flex-start",
                            borderBottom: `1px solid ${ergEnterpriseTokens.color.border}`,
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
        <Box sx={{ alignItems: "center", bgcolor: "#FFFFFF", borderTop: `1px solid ${ergEnterpriseTokens.color.border}`, display: "flex", gap: 1.25, justifyContent: "flex-end", mt: "auto", p: 2 }}>
          <Button variant="text"
            onClick={onClose}
            sx={{
              borderRadius: `${ergEnterpriseTokens.radius.md}px`,
              color: "text.secondary",
              fontSize: "0.85rem",
              fontWeight: 600,
              px: 2,
              textTransform: "none",
              "&:hover": { bgcolor: "rgba(0, 0, 0, 0.05)", color: "text.primary" },
            }}
          >
            Hủy
          </Button>
          <Button
            disabled={!name.trim() || pending || groupsQuery.isPending}
            onClick={requestSave}
            variant="contained"
            sx={{
              bgcolor: "primary.main",
              borderRadius: `${ergEnterpriseTokens.radius.md}px`,
              boxShadow: `0 2px 8px ${alpha(ergEnterpriseTokens.color.primary, 0.28)}`,
              color: "#FFFFFF",
              fontSize: "0.85rem",
              fontWeight: 600,
              px: 2.5,
              py: 0.85,
              textTransform: "none",
              transition: "all 0.15s ease",
              "&:hover": {
                bgcolor: "primary.dark",
                boxShadow: `0 4px 14px ${alpha(ergEnterpriseTokens.color.primary, 0.38)}`,
              },
            }}
          >
            {isCreate ? "Tạo nhóm quyền" : "Lưu thay đổi"}
          </Button>
        </Box>
      </Drawer>

      <ErgConfirmDialog
        confirmLabel="Xác nhận và lưu"
        description={addedSensitive.length ? `Thay đổi này thêm quyền nhạy cảm: ${addedSensitive.join(", ")}. Hành động sẽ được ghi audit.` : "Thay đổi quyền của nhóm có hiệu lực ngay với mọi người dùng thuộc nhóm. Hành động sẽ được ghi audit."}
        impact={`Ảnh hưởng ${role?.userCount ?? 0} người dùng`}
        loading={pending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void persist()}
        open={confirmOpen}
        title={addedSensitive.length ? "Xác nhận cấp quyền nhạy cảm" : "Xác nhận thay đổi nhóm quyền"}
      />
    </>
  );
}

const appleInputSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "#FFFFFF",
    borderRadius: `${ergEnterpriseTokens.radius.md}px`,
    fontSize: "0.85rem",
    fontWeight: 550,
    "& fieldset": { borderColor: "divider" },
    "&:hover fieldset": { borderColor: "rgba(0, 0, 0, 0.22)" },
    "&.Mui-focused fieldset": {
      borderColor: "primary.main",
      boxShadow: `0 0 0 3px ${alpha(ergEnterpriseTokens.color.primary, 0.15)}`,
    },
  },
  "& .MuiInputLabel-root": {
    color: "text.secondary",
    fontSize: "0.85rem",
    fontWeight: 600,
    "&.Mui-focused": { color: "primary.main" },
  },
};
