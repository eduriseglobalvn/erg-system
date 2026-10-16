import CheckIcon from "@mui/icons-material/Check";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { headingSx, helperSx, panelSx, roleAliases, roleOptions, sectionHeaderSx } from "./user-access-control-section-config";
import { SaveButton } from "./user-access-control-section-primitives";

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

