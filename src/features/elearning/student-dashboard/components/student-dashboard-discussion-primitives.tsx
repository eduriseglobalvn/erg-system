import {
  type ReactNode,
} from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type {
  StudentDiscussionFeedPost,
} from "@/features/elearning/student-dashboard/types/discussion-feed-types";
import type {
  StudentDiscussionImageAttachment,
} from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import {
  MUI_PRIMARY,
  MUI_TEXT,
  MUI_MUTED,
  MUI_BORDER,
  elevatedCardSx,
  Stack,
  reactionKeys,
} from "@/features/elearning/student-dashboard/components/student-dashboard-discussion-shared";
export function DiscussionPageHeader({
  studentClass,
  description,
  icon,
  title,
}: {
  studentClass: string;
  description: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <Card sx={elevatedCardSx}>
      <CardContent sx={{ px: { xs: 1.5, md: 2 }, py: { xs: 1.35, md: 1.45 } }}>
        <Stack direction="row" spacing={1.1} alignItems="center">
          <Box sx={{ bgcolor: "rgba(15,108,189,0.08)", border: "1px solid rgba(15,108,189,0.14)", borderRadius: "12px", color: MUI_PRIMARY, display: "grid", height: 42, placeItems: "center", width: 42 }}>
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.25 }}>
              <Chip
                label={studentClass}
                size="small"
                sx={{
                  bgcolor: "rgba(15,108,189,0.08)",
                  border: "1px solid rgba(15,108,189,0.14)",
                  borderRadius: "8px",
                  color: MUI_PRIMARY,
                  fontSize: 12,
                  fontWeight: 850,
                  height: 24,
                }}
              />
              <Typography variant="caption" sx={{ color: MUI_MUTED, fontWeight: 750 }}>
                Bảng tin lớp học
              </Typography>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.2, sm: 1 }} alignItems={{ xs: "flex-start", sm: "baseline" }}>
              <Typography variant="h6" sx={{ color: MUI_TEXT, fontSize: { xs: 17, md: 18 }, fontWeight: 900, lineHeight: 1.15 }}>
                {title}
              </Typography>
              <Typography variant="body2" sx={{ color: MUI_MUTED, fontSize: 13.5 }}>
                {description}
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function EmptyPanel({ description, title }: { description: string; title: string }) {
  return (
    <Paper sx={{ bgcolor: "#F9FAFD", border: `1px solid ${MUI_BORDER}`, borderRadius: "12px", boxShadow: "0 5px 18px rgba(16,32,51,0.045)", p: 2.2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{description}</Typography>
    </Paper>
  );
}

export function getReactionTotal(reactions: StudentDiscussionFeedPost["reactions"]) {
  return reactionKeys.reduce((total, key) => total + reactions[key].count, 0);
}

export function formatCompactCount(value: number) {
  if (value >= 1000) {
    const compactValue = Math.round((value / 1000) * 10) / 10;
    return `${compactValue.toString().replace(".", ",")}K`;
  }

  return `${value}`;
}

export function createImageAttachments(files: FileList | null) {
  const imageFiles = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));

  return Promise.all(
    imageFiles.map(
      (file, index) =>
        new Promise<StudentDiscussionImageAttachment>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              id: `image-${Date.now()}-${index}-${file.name}`,
              type: "image",
              name: file.name,
              url: typeof reader.result === "string" ? reader.result : "",
            });
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        }),
    ),
  );
}

