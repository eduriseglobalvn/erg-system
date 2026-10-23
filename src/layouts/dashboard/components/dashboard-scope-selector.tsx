import { useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Divider from "@mui/material/Divider";
import ListSubheader from "@mui/material/ListSubheader";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { DashboardContextBarProps } from "./dashboard-context-bar.types";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

type ScopeSelectorProps = Omit<DashboardContextBarProps, "onLogout">;

function getInitials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function ScopeAvatar({ kind, label, size = 32 }: { kind: "system" | "school"; label: string; size?: number }) {
  return (
    <Avatar
      variant="rounded"
      sx={{
        bgcolor: kind === "system" ? "primary.main" : "action.selected",
        color: kind === "system" ? "primary.contrastText" : "text.secondary",
        flexShrink: 0,
        fontSize: 11,
        fontWeight: 750,
        height: size,
        width: size,
      }}
    >
      {kind === "system" ? <ShieldOutlinedIcon sx={{ fontSize: size * 0.58 }} /> : getInitials(label) || <SchoolOutlinedIcon />}
    </Avatar>
  );
}

export function DashboardScopeSelector(props: ScopeSelectorProps) {
  const {
    activePortal, canAccessGlobalErg, classes, manageableUnits, managementScope, onOpenLeaf,
    onSelectClass, onSelectScopeRoot, schools, selectedClassId, selectedSchoolId, systemUnits,
  } = props;
  const [scopeAnchor, setScopeAnchor] = useState<HTMLElement | null>(null);
  const [classAnchor, setClassAnchor] = useState<HTMLElement | null>(null);
  const isGlobalScope = managementScope.level === "global";
  const ergSystemUnit = systemUnits.find((unit) => unit.code === "ERG-SYSTEM");
  const selectedSchool = schools.find((school) => school.id === selectedSchoolId);
  const selectedClass = classes.find((classroom) => classroom.id === selectedClassId);
  const scopeUnits = manageableUnits.filter((unit) => unit.type !== "system" && unit.code !== "HOCLIEU-STUDIO");
  const scopeTitle = isGlobalScope ? ergSystemUnit?.name || "Hệ thống ERG" : selectedSchool?.name || "Chọn cơ sở";
  const scopeSubtitle = isGlobalScope ? ergSystemUnit?.address || "Hệ thống ERG" : "Cơ sở giáo dục";
  const canSelectClass = activePortal === "lms" && !isGlobalScope && classes.length > 0;

  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: "center", flex: 1, minWidth: 0 }}>
      <ButtonBase
        aria-label="Chọn phạm vi quản lý"
        onClick={(event) => setScopeAnchor(event.currentTarget)}
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, gap: 1.25, justifyContent: "flex-start", maxWidth: "100%", minHeight: 42, px: 1.25, textAlign: "left", "&:hover": { bgcolor: "action.hover", borderColor: "primary.main" } }}
      >
        <ScopeAvatar kind={isGlobalScope ? "system" : "school"} label={scopeTitle} />
        <Box sx={{ minWidth: 0, pr: 0.5 }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
            <Typography noWrap sx={{ fontSize: 14, fontWeight: 750 }}>{scopeTitle}</Typography>
            <ExpandMoreRoundedIcon sx={{ color: "text.secondary", fontSize: 17 }} />
          </Stack>
          <Typography color="text.secondary" noWrap sx={{ fontSize: 11, fontWeight: 600 }}>{scopeSubtitle}</Typography>
        </Box>
      </ButtonBase>

      <Menu anchorEl={scopeAnchor} onClose={() => setScopeAnchor(null)} open={Boolean(scopeAnchor)} slotProps={{ paper: { sx: { p: 1, width: 320 } } }}>
        <ListSubheader disableSticky sx={{ bgcolor: "transparent", fontSize: 11, fontWeight: 750, lineHeight: "32px" }}>Phạm vi quản lý</ListSubheader>
        {canAccessGlobalErg ? (
          <MenuItem selected={isGlobalScope} onClick={() => { onSelectScopeRoot("global"); setScopeAnchor(null); }} sx={{ borderRadius: 1.5, gap: 1.5, mb: 0.5, py: 1.25 }}>
            <ScopeAvatar kind="system" label={ergSystemUnit?.name || "Hệ thống ERG"} size={36} />
            <Box><Typography sx={{ fontSize: 14, fontWeight: 700 }}>{ergSystemUnit?.name || "Hệ thống ERG"}</Typography><Typography color="text.secondary" variant="caption">{ergSystemUnit?.address || "Toàn quyền quản trị hệ thống"}</Typography></Box>
          </MenuItem>
        ) : null}
        {scopeUnits.length ? <Divider sx={{ my: 0.75 }} /> : null}
        <Box sx={{ maxHeight: 240, overflowY: "auto" }}>
          {scopeUnits.map((unit) => (
            <MenuItem key={unit.id} selected={!isGlobalScope && selectedSchoolId === unit.id} onClick={() => { onSelectScopeRoot(unit.id); setScopeAnchor(null); }} sx={{ borderRadius: 1.5, gap: 1.5, mb: 0.5, py: 1.25 }}>
              <ScopeAvatar kind="school" label={unit.name} />
              <Box sx={{ minWidth: 0 }}><Typography noWrap sx={{ fontSize: 14, fontWeight: 700 }}>{unit.name}</Typography><Typography color="text.secondary" variant="caption">{unit.type === "center" ? "Trung tâm" : "Cơ sở giáo dục"}</Typography></Box>
            </MenuItem>
          ))}
        </Box>
        {canAccessGlobalErg ? <><Divider sx={{ my: 0.75 }} /><MenuItem onClick={() => { onOpenLeaf("admin-create-unit"); setScopeAnchor(null); }} sx={{ borderRadius: 1.5, color: "success.dark", gap: 1.5, py: 1.25 }}><Avatar variant="rounded" sx={{ bgcolor: "success.light", color: "success.dark", height: 36, width: 36 }}><AddRoundedIcon /></Avatar><Typography sx={{ fontSize: 14, fontWeight: 700 }}>Tạo cơ sở giáo dục</Typography></MenuItem></> : null}
      </Menu>

      {canSelectClass ? <>
        <Divider flexItem orientation="vertical" />
        <ButtonBase aria-label="Chọn lớp học" onClick={(event) => setClassAnchor(event.currentTarget)} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, gap: 1, minHeight: 38, px: 1.25, textAlign: "left", "&:hover": { bgcolor: "action.hover", borderColor: "primary.main" } }}>
          <Avatar variant="rounded" sx={{ bgcolor: ergEnterpriseTokens.color.primarySofter, color: "primary.main", height: 26, width: 26 }}><GridViewRoundedIcon sx={{ fontSize: 16 }} /></Avatar>
          <Box><Stack direction="row" spacing={0.25} sx={{ alignItems: "center" }}><Typography sx={{ fontSize: 13, fontWeight: 750 }}>{selectedClass?.className || "Chọn lớp học"}</Typography><ExpandMoreRoundedIcon sx={{ color: "text.secondary", fontSize: 15 }} /></Stack>{selectedClass ? <Typography color="text.secondary" sx={{ fontSize: 11 }}>{selectedClass.studentCount} học sinh</Typography> : null}</Box>
        </ButtonBase>
        <Menu anchorEl={classAnchor} onClose={() => setClassAnchor(null)} open={Boolean(classAnchor)} slotProps={{ paper: { sx: { p: 1, width: 256 } } }}>
          <ListSubheader disableSticky sx={{ bgcolor: "transparent", fontSize: 11, fontWeight: 750, lineHeight: "32px" }}>Lớp học đang quản lý</ListSubheader>
          {classes.map((classroom) => <MenuItem key={classroom.id} selected={selectedClassId === classroom.id} onClick={() => { onSelectClass(classroom.id); setClassAnchor(null); }} sx={{ borderRadius: 1.5, gap: 1.25, mb: 0.5 }}><Avatar variant="rounded" sx={{ fontSize: 11, height: 30, width: 30 }}>{classroom.className.substring(0, 2)}</Avatar><Typography sx={{ fontSize: 14 }}>{classroom.className}</Typography></MenuItem>)}
        </Menu>
      </> : null}
    </Stack>
  );
}
