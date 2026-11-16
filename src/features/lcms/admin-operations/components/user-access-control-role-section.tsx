import CheckIcon from "@mui/icons-material/Check";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { listAssignableRoles, rbacQueryKeys } from "@/features/rbac/api/rbac-api";
import { applyRoleSelection, assignableRoleValue } from "@/features/rbac/lib/exclusive-roles";
import { QUERY_POLICIES } from "@/lib/query-policy";
import { headingSx, helperSx, panelSx, sectionHeaderSx } from "./user-access-control-section-config";
import { SaveButton } from "./user-access-control-section-primitives";

/** Business roles the signed-in person may grant (backend list); Giám đốc / Vận hành stand alone. */
export function RolesSection({ currentRoles, rootAdmin, saving, onChange, onSave }: {
  currentRoles: string[];
  rootAdmin: boolean;
  saving: boolean;
  onChange: (roles: string[]) => void;
  onSave: () => void;
}) {
  const rolesQuery = useQuery({ queryKey: rbacQueryKeys.assignableRoles, queryFn: ({ signal }) => listAssignableRoles(signal), staleTime: QUERY_POLICIES.reference.staleTime });
  const roles = rolesQuery.data ?? [];
  const held = new Set(currentRoles.map((role) => role.toLowerCase()));
  const isExclusive = (value: string) => roles.find((role) => assignableRoleValue(role).toLowerCase() === value.toLowerCase())?.exclusive ?? false;

  function toggle(value: string) {
    if (rootAdmin) return;
    if (held.has(value.toLowerCase())) {
      onChange(currentRoles.filter((item) => item.toLowerCase() !== value.toLowerCase()));
      return;
    }
    onChange(applyRoleSelection(currentRoles, [...currentRoles, value], isExclusive));
  }

  return (
    <Paper component="section" variant="outlined" sx={panelSx}>
      <Box sx={sectionHeaderSx}>
        <Box><Typography sx={headingSx}><VpnKeyOutlinedIcon sx={{ fontSize: 18, color: "primary.main" }} />Vai trò</Typography><Typography sx={helperSx}>Chỉ hiện vai trò bạn được phép gán. Giám đốc và Vận hành không đi kèm vai trò khác.</Typography></Box>
        <SaveButton saving={saving} onClick={onSave}>Cập nhật vai trò</SaveButton>
      </Box>
      {rolesQuery.isError ? <Typography sx={{ ...helperSx, mt: 2, color: "error.main" }}>Không tải được danh sách vai trò.</Typography> : null}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" }, gap: 2, mt: 2.5 }}>
        {roles.map((role) => {
          const value = assignableRoleValue(role);
          const checked = held.has(value.toLowerCase());
          return (
            <Button variant="outlined" key={role.id} type="button" aria-pressed={checked} onClick={() => toggle(value)} disabled={rootAdmin} sx={{ minHeight: 72, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, borderColor: checked ? "primary.main" : "divider", bgcolor: checked ? "primary.50" : "background.paper", p: 2, textAlign: "left", textTransform: "none", "&:hover": { bgcolor: checked ? "primary.50" : "action.hover" } }}>
              <Box sx={{ minWidth: 0, flex: 1 }}><Typography sx={{ color: "text.primary", fontSize: 12, fontWeight: 600 }}>{role.label}</Typography>{role.exclusive ? <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: 10 }}>Vai trò đứng riêng</Typography> : null}</Box>
              {checked ? <Box sx={{ display: "grid", width: 20, height: 20, flexShrink: 0, placeItems: "center", borderRadius: "50%", bgcolor: "primary.main", color: "primary.contrastText" }}><CheckIcon sx={{ fontSize: 14 }} /></Box> : null}
            </Button>
          );
        })}
      </Box>
    </Paper>
  );
}
