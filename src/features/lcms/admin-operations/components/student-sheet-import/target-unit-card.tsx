import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import type { ClassroomSchool, ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";
import type { ManagementScope } from "@/types/scope-types";
import { ImportField } from "@/features/lcms/admin-operations/components/student-sheet-import/import-primitives";

export function TargetUnitCard({
  centerOptions,
  centers,
  lockedCenter,
  managementScope,
  setTargetCenterId,
  setTargetClassId,
  targetCenterId,
  targetClassId,
  targetClasses,
}: {
  centerOptions: ClassroomSchool[];
  centers: ClassroomSchool[];
  lockedCenter?: { id: string; name: string };
  managementScope: ManagementScope;
  setTargetCenterId: (value: string) => void;
  setTargetClassId: (value: string) => void;
  targetCenterId: string;
  targetClassId: string;
  targetClasses: ClassroomSnapshot[];
}) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 1.5, bgcolor: "action.hover", p: 2 }}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, borderBottom: 1, borderColor: "divider", pb: 1.5 }}>
        <Box>
          <Typography sx={{ color: "text.primary", fontSize: 14, fontWeight: 700 }}>{lockedCenter ? "Trường đang import" : "Đơn vị đích"}</Typography>
          <Typography sx={{ mt: 0.25, color: "text.secondary", fontSize: 12 }}>
            {lockedCenter ? "Import được thực hiện trong phạm vi trường này." : "Tài khoản được gắn vào trường/lớp đã chọn."}
          </Typography>
        </Box>
        <Chip size="small" color="secondary" label={lockedCenter ? "Đúng phạm vi trường" : "BE realtime"} />
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1.5, mt: 2 }}>
        {lockedCenter ? (
          <Paper variant="outlined" sx={{ borderRadius: 1.25, px: 1.5, py: 1.25 }}>
            <Typography sx={{ color: "text.secondary", fontSize: 12, fontWeight: 700 }}>Trường</Typography>
            <Typography noWrap sx={{ mt: 0.5, color: "text.primary", fontSize: 14, fontWeight: 700 }}>{lockedCenter.name}</Typography>
          </Paper>
        ) : (
          <ImportField label="Trường / Trung tâm">
            <TextField select fullWidth size="small"
              value={targetCenterId}
              onChange={(event) => {
                setTargetCenterId(event.target.value);
                setTargetClassId("");
              }}
              disabled={managementScope.level !== "global" && centers.length <= 1}
            >
              <MenuItem value="">Chọn cơ sở thụ hưởng</MenuItem>
              {centerOptions.map((center) => (
                <MenuItem key={center.id} value={center.id}>
                  {center.name}
                </MenuItem>
              ))}
            </TextField>
          </ImportField>
        )}
        <ImportField label="Lớp học đích">
          <TextField select fullWidth size="small"
            value={targetClassId}
            onChange={(event) => setTargetClassId(event.target.value)}
            disabled={managementScope.level === "class"}
          >
            <MenuItem value="">Tự động nhận theo cột Lớp trong Sheet</MenuItem>
            {targetClasses.map((classroom) => (
              <MenuItem key={classroom.id} value={classroom.id}>
                {classroom.className}
              </MenuItem>
            ))}
          </TextField>
        </ImportField>
      </Box>
    </Paper>
  );
}
