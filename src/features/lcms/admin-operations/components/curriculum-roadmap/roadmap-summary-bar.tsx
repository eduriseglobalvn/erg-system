import UnfoldLess from "@mui/icons-material/UnfoldLess";
import UnfoldMore from "@mui/icons-material/UnfoldMore";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import { RoadmapMetric } from "@/features/lcms/admin-operations/components/curriculum-roadmap/roadmap-summary";

export function RoadmapSummaryBar({
  subjectTitle,
  levelCount,
  totalTopics,
  totalLessons,
  onExpandAll,
  onCollapseAll,
}: {
  subjectTitle: string;
  levelCount: number;
  totalTopics: number;
  totalLessons: number;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}) {
  return (
      <Box
        sx={{
          display: "flex",
          minHeight: 60,
          flexShrink: 0,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          borderBottom: "1px solid #E2E8F0",
          bgcolor: "#FFFFFF",
          px: 3,
          py: 1.25,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              sx={{
                color: "#0071E3",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: ".06em",
                textTransform: "uppercase",
              }}
            >
              Bản đồ cấu trúc môn học
            </Typography>
            <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "#CBD5E1" }} />
            <Typography sx={{ color: "#64748B", fontSize: 12, fontWeight: 500 }}>
              Level (Chặng học) → Chủ đề → Bài học
            </Typography>
          </Box>
          <Typography noWrap sx={{ mt: 0.25, color: "#0F172A", fontSize: 17, fontWeight: 600 }}>
            {subjectTitle}
          </Typography>
        </Box>
  
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          {levelCount > 0 ? (
            <Stack direction="row" spacing={0.5} sx={{ mr: 0.5 }}>
              <Tooltip title="Mở rộng tất cả chặng">
                <Button
                  size="small"
                  variant="text"
                  startIcon={<UnfoldMore sx={{ fontSize: 16 }} />}
                  onClick={onExpandAll}
                  sx={{ color: "#64748B", fontSize: 12, fontWeight: 600, textTransform: "none" }}
                >
                  Mở tất cả
                </Button>
              </Tooltip>
              <Tooltip title="Thu gọn tất cả chặng">
                <Button
                  size="small"
                  variant="text"
                  startIcon={<UnfoldLess sx={{ fontSize: 16 }} />}
                  onClick={onCollapseAll}
                  sx={{ color: "#64748B", fontSize: 12, fontWeight: 600, textTransform: "none" }}
                >
                  Thu gọn
                </Button>
              </Tooltip>
            </Stack>
          ) : null}
  
          <RoadmapMetric value={levelCount} label="Level" />
          <RoadmapMetric value={totalTopics} label="Chủ đề" />
          <RoadmapMetric value={totalLessons} label="Bài học" />
        </Stack>
      </Box>
  );
}
