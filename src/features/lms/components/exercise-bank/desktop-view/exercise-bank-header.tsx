import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DownloadForOfflineOutlinedIcon from "@mui/icons-material/DownloadForOfflineOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErgIconButton } from "@/components/erg-mui/erg-actions";
import type { ExerciseBankController } from "../use-exercise-bank-controller";

const headerButtonSx = { height: 34, px: 2 } as const;

export function ExerciseBankHeader({
  controller,
  onBack,
  onOpenPortable,
}: {
  controller: ExerciseBankController;
  onBack: () => void;
  onOpenPortable?: () => void;
}) {
  return (
    <Box component="header" sx={{ display: "flex", flexShrink: 0, alignItems: "center", justifyContent: "space-between", gap: 2 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <ErgIconButton
          label="Quay lại danh sách bài tập"
          onClick={onBack}
          size="small"
          sx={{ width: 34, height: 34, border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "background.paper", color: "text.primary" }}
        >
          <ArrowBackIcon fontSize="small" />
        </ErgIconButton>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <Typography variant="h4" component="h1">
            Kho bài tập
          </Typography>
          <Box component="span" sx={{ borderRadius: 0.5, bgcolor: "action.hover", px: 1, py: 0.25, typography: "caption", fontWeight: "fontWeightMedium", color: "text.secondary" }}>
            {controller.filteredExercises.length} bài
          </Box>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        {onOpenPortable ? (
          <Button variant="outlined" onClick={onOpenPortable} startIcon={<DownloadForOfflineOutlinedIcon fontSize="small" />} sx={headerButtonSx}>
            Gói offline
          </Button>
        ) : null}
        <Button variant="outlined" onClick={() => controller.duplicateExercise()} startIcon={<ContentCopyOutlinedIcon fontSize="small" />} sx={headerButtonSx}>
          Nhân bản
        </Button>
        <Button variant="outlined" onClick={() => controller.openCreateDialog()} startIcon={<AddIcon fontSize="small" />} sx={{ ...headerButtonSx, px: 2.5 }}>
          Tạo bài mới
        </Button>
      </Stack>
    </Box>
  );
}
