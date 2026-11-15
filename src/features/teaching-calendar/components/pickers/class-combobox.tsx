import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Paper, { type PaperProps } from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import type { TeachingSlotOptions } from "@/features/teaching-calendar/api/teaching-calendar-slot-options-api";
import { scheduleTokens } from "../shared/schedule-cell-sx";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { adminPath } from "@/platform/workspaces/workspace-paths";

type ClassOption = TeachingSlotOptions["classes"][number];

type Props = {
  batchId?: string;
  classes: readonly ClassOption[];
  grade?: number | null;
  onChange: (option: ClassOption | null) => void;
  periodNo: number;
  schoolName: string;
  value?: string;
  weekdayName: string;
};

function describe(option: ClassOption, { batchId, periodNo, weekdayName }: Pick<Props, "batchId" | "periodNo" | "weekdayName">) {
  if (option.state === "SUGGESTED") return "Gợi ý · tuần trước giờ này học ở đây";
  if (option.state === "BUSY" && option.busy) {
    if (batchId && option.busy.batchId === batchId) return `Bận: tiết ${option.busy.periodNo ?? periodNo} đã xếp ở ô ${weekdayName}`;
    const what = [option.busy.teacherName, option.busy.subjectName].filter(Boolean).join(" dạy ");
    const where = [option.busy.roomName, option.busy.batchLabel ? `(${option.busy.batchLabel})` : ""].filter(Boolean).join(" ");
    return `Bận: ${[what, where].filter(Boolean).join(" · ")}`;
  }
  return `Trống tiết ${periodNo}`;
}

/** Combobox «Lớp» cua popover o (6.2): lop cua truong, nhom theo khoi, dong phu theo trang thai. Lop BUSY van chon duoc. */
export function ClassCombobox({ batchId, classes, grade, onChange, periodNo, schoolName, value, weekdayName }: Props) {
  const selected = classes.find((option) => option.classId === value) ?? null;
  const footer = (
    <Typography sx={{ borderTop: 1, borderColor: "divider", color: "text.secondary", p: 1, typography: "caption" }}>
      Danh sách lấy từ lớp của trường đã chọn ·{" "}
      <Link href={adminPath("/schools")} rel="noreferrer" target="_blank" underline="hover">+ Tạo lớp</Link>
    </Typography>
  );
  return (
    <Box component="label" sx={{ color: "text.primary", display: "flex", flexDirection: "column", gap: "4px" }}>
      <Typography component="span" sx={[{ color: ergEnterpriseTokens.color.textSecondary, typography: "caption" }, { fontWeight: "fontWeightRegular" }]}>Lớp</Typography>
      <Autocomplete
        autoHighlight
        getOptionLabel={(option) => option.className}
        groupBy={() => `Lớp của ${schoolName}${grade ? ` · khối ${grade}` : ""}`}
        isOptionEqualToValue={(option, current) => option.classId === current.classId}
        onChange={(_event, option) => onChange(option)}
        options={[...classes]}
        renderInput={(params) => <TextField {...params} hiddenLabel size="small" sx={{ "& .MuiOutlinedInput-root": { height: 36, minHeight: 36, py: 0 } }} />}
        renderOption={({ key, ...props }, option) => (
          <Box component="li" key={key} {...props} sx={{ alignItems: "center", borderTop: 1, borderColor: "divider", display: "flex !important", gap: 1, minHeight: 34, px: "10px !important", py: "4px !important", ...(option.state === "SUGGESTED" ? { bgcolor: scheduleTokens.published.bg, color: scheduleTokens.published.text } : {}), ...(option.state === "BUSY" ? { color: scheduleTokens.disabled } : {}) }}>
            <Typography component="span" sx={[{ color: "inherit", flex: "0 0 40px" }, { typography: "subtitle2" }, { fontSize: "0.8125rem" }]}>{option.className}</Typography>
            <Typography component="span" sx={{ color: option.state === "BUSY" ? scheduleTokens.clash.text : option.state === "SUGGESTED" ? scheduleTokens.published.text : "text.secondary", flex: 1, typography: "caption" }}>
              {describe(option, { batchId, periodNo, weekdayName })}
            </Typography>
          </Box>
        )}
        slots={{ paper: (paperProps: PaperProps) => <Paper {...paperProps}>{paperProps.children}{footer}</Paper> }}
        value={selected}
      />
    </Box>
  );
}
