import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import { schoolTypeMeta } from "@/features/lcms/school-management/types/school-type-config";

export function SchoolPageShell({ action, children, description, title, unscoped = false }: {
  action?: ReactNode;
  children: ReactNode;
  description?: string;
  title: string;
  unscoped?: boolean;
}) {
  const { error, isLoading, refetch, schools, selectedSchool, selectSchool } = useSchoolManagementContext();
  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "calc(100vh - 96px)" }}>
      <Box sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", position: "sticky", top: 0, zIndex: 4 }}>
        <Box sx={{ alignItems: { xs: "flex-start", md: "center" }, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2, justifyContent: "space-between", px: { xs: 2, md: 3 }, py: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Breadcrumbs separator="/" sx={{ mb: 0.5 }}><Typography color="text.secondary" variant="caption">Quản lý trường học</Typography><Typography color="text.primary" variant="caption">{title}</Typography></Breadcrumbs>
            <Typography sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 900, lineHeight: 1.25 }}>{title}</Typography>
            {description ? <Typography color="text.secondary" sx={{ mt: 0.4 }} variant="body2">{description}</Typography> : null}
          </Box>
          <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "flex-end" }}>
            {!unscoped && selectedSchool ? <>
              <TextField
                select size="small" value={selectedSchool.id} onChange={(event) => selectSchool(event.target.value)}
                slotProps={{ select: { IconComponent: ExpandMoreRoundedIcon } }}
                sx={{ minWidth: 240, "& .MuiOutlinedInput-root": { bgcolor: "background.paper" } }}
              >{schools.map((school) => <MenuItem key={school.id} value={school.id}>{school.name}</MenuItem>)}</TextField>
              <Chip color="success" icon={<CheckCircleRoundedIcon />} label="Đồng bộ 10 phút trước" size="small" variant="outlined" />
            </> : null}
            {action}
          </Box>
        </Box>
        {!unscoped && selectedSchool ? <Box sx={{ alignItems: "center", bgcolor: "primary.50", borderTop: "1px solid", borderColor: "divider", display: "flex", flexWrap: "wrap", gap: 1.5, px: { xs: 2, md: 3 }, py: 0.75 }}><Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 750 }} variant="caption">ID: {selectedSchool.id}</Typography><Chip color="primary" label={schoolTypeMeta[selectedSchool.schoolType].shortLabel} size="small" sx={{ height: 22 }} variant="outlined" /><Typography color="text.secondary" variant="caption">Năm học {selectedSchool.academicYear}</Typography>{selectedSchool.address ? <><Typography color="text.secondary" variant="caption">·</Typography><Typography color="text.secondary" noWrap variant="caption">{selectedSchool.address}</Typography></> : null}</Box> : null}
      </Box>
      <Box sx={{ p: { xs: 2, md: 3 } }}>{!unscoped && isLoading ? <Box sx={{ display: "grid", gap: 2 }}><Skeleton height={120} variant="rounded" /><Skeleton height={360} variant="rounded" /></Box> : !unscoped && error ? <Alert action={<Typography component="button" onClick={() => void refetch()} sx={{ bgcolor: "transparent", border: 0, color: "inherit", cursor: "pointer", fontWeight: 800 }}>Thử lại</Typography>} severity="error">Không thể tải dữ liệu trường: {error instanceof Error ? error.message : "Lỗi không xác định"}</Alert> : children}</Box>
    </Box>
  );
}
