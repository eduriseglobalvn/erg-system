import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import { Box, Button, Stack, Typography } from "@mui/material";

import { compactWeekDateRange } from "./weekly-class-log-model";
import type { WeeklyClassLogController } from "./use-weekly-class-log-controller";

export function WeeklyClassLogHeader({ controller }: { controller: WeeklyClassLogController }) {
  return (
    <Box
      sx={{ alignItems: { xs: "stretch", md: "center" }, borderBottom: "1px solid #e5e7eb", display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "space-between", mb: 2, pb: 2 }}
    >
      <Typography sx={{ fontSize: 22, fontWeight: 600 }}>Sổ Đầu Bài</Typography>
      {controller.offlineStatus === "session-only" ? (
        <Typography color="warning.main" sx={{ fontSize: 12, fontWeight: 600 }}>
          Chưa có hợp đồng máy chủ cho sổ đầu bài · thay đổi chỉ tồn tại trong phiên này
        </Typography>
      ) : null}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ flexWrap: "wrap", width: { xs: "100%", md: "auto" } }}>
        <Box
          component="select"
          value={controller.selectedSubject}
          onChange={(event) => controller.setSelectedSubject(event.target.value)}
          sx={{ border: "1px solid #e5e7eb", borderRadius: 2, fontSize: 14, height: 40, minWidth: { xs: 0, sm: 160 }, px: 1.5, width: { xs: "100%", sm: 160 } }}
        >
          {controller.subjectOptions.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
        </Box>
        <Box
          component="select"
          value={controller.selectedWeek.id}
          onChange={(event) => controller.setSelectedWeekId(event.target.value)}
          sx={{ border: "1px solid #e5e7eb", borderRadius: 2, fontSize: 14, height: 40, minWidth: { xs: 0, sm: 200 }, px: 1.5, width: { xs: "100%", sm: 200 } }}
        >
          {controller.weeks.map((week) => (
            <option key={week.id} value={week.id}>{week.label} · {compactWeekDateRange(week)}</option>
          ))}
        </Box>
        <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 2, display: "flex", overflow: "hidden", width: { xs: "100%", sm: "auto" } }}>
          <Button
            onClick={() => controller.goToWeek(1)}
            disabled={controller.selectedWeekIndex >= controller.weeks.length - 1}
            startIcon={<ChevronLeft sx={{ fontSize: 18 }} />}
            sx={{ borderRadius: 0, flex: 1, minWidth: { xs: 0, sm: 100 }, textTransform: "none", fontWeight: 600 }}
          >
            Trước
          </Button>
          <Button
            onClick={() => controller.goToWeek(-1)}
            disabled={controller.selectedWeekIndex <= 0}
            endIcon={<ChevronRight sx={{ fontSize: 18 }} />}
            sx={{ borderRadius: 0, flex: 1, minWidth: { xs: 0, sm: 100 }, textTransform: "none", fontWeight: 600 }}
          >
            Sau
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
