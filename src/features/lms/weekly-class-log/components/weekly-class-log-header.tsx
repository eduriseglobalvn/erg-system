import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ErgSelect } from "@/components/erg-mui";

import { compactWeekDateRange } from "./weekly-class-log-model";
import type { WeeklyClassLogController } from "./use-weekly-class-log-controller";

export function WeeklyClassLogHeader({ controller }: { controller: WeeklyClassLogController }) {
  return (
    <Box
      sx={{ alignItems: { xs: "stretch", md: "center" }, borderBottom: 1, borderColor: "divider", display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "space-between", mb: 2, pb: 2 }}
    >
      <Typography component="h1" variant="h5">Sổ đầu bài</Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ flexWrap: "wrap", width: { xs: "100%", md: "auto" } }}>
        <ErgSelect
          size="small"
          fullWidth={false}
          value={controller.selectedSubject}
          onChange={(event) => controller.setSelectedSubject(String(event.target.value))}
          options={controller.subjectOptions.map((subject) => ({ value: subject, label: subject }))}
          slotProps={{ select: { SelectDisplayProps: { "aria-label": "Chọn môn học" } } }}
          sx={{ minWidth: { sm: 160 } }}
        />
        <ErgSelect
          size="small"
          fullWidth={false}
          value={controller.selectedWeek.id}
          onChange={(event) => controller.setSelectedWeekId(String(event.target.value))}
          options={controller.weekOptions.map(({ week }) => ({ value: week.id, label: `${week.label} · ${compactWeekDateRange(week)}` }))}
          slotProps={{ select: { SelectDisplayProps: { "aria-label": "Chọn tuần" } } }}
          sx={{ minWidth: { sm: 220 } }}
        />
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => controller.goToWeek(-1)} startIcon={<ChevronLeft />} sx={{ flex: 1, minHeight: 44 }}>
            Trước
          </Button>
          <Button variant="outlined" onClick={() => controller.goToWeek(1)} endIcon={<ChevronRight />} sx={{ flex: 1, minHeight: 44 }}>
            Sau
          </Button>
          {controller.isCurrentWeek ? null : (
            <Button variant="text" onClick={controller.goToCurrentWeek} sx={{ minHeight: 44 }}>
              Tuần này
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
