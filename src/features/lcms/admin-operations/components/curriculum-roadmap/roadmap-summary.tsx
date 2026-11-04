import Add from "@mui/icons-material/Add";
import Layers from "@mui/icons-material/Layers";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

export function RoadmapMetric({ value, label }: { value: number; label: string }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        border: "1px solid #E2E8F0",
        borderRadius: 2,
        bgcolor: "#FFFFFF",
        px: 1.5,
        py: 0.5,
        boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
      }}
    >
      <Typography sx={{ color: "#0F172A", fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
        {value}
      </Typography>
      <Typography sx={{ color: "#64748B", fontSize: 11, fontWeight: 600 }}>
        {label}
      </Typography>
    </Box>
  );
}

export function EmptyRoadmapState({
  subjectTitle,
  query,
  onCreateLevel,
}: {
  subjectTitle: string;
  query: string;
  onCreateLevel: () => void;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: 400,
        alignItems: "center",
        justifyContent: "center",
        px: 4,
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          maxWidth: 440,
          p: 4,
          border: "1px solid #E2E8F0",
          borderRadius: 3,
          bgcolor: "#FFFFFF",
          boxShadow: "0 4px 16px rgba(15, 35, 58, 0.04)",
        }}
      >
        <Box
          sx={{
            mx: "auto",
            display: "grid",
            height: 52,
            width: 52,
            placeItems: "center",
            borderRadius: "50%",
            bgcolor: "#EFF6FF",
            color: "#0F6CBD",
            boxShadow: "0 0 0 6px #F0F7FF",
          }}
        >
          <Layers sx={{ fontSize: 26 }} />
        </Box>
        <Typography sx={{ mt: 2.5, color: "#0F172A", fontSize: 16, fontWeight: 600 }}>
          {query ? "Không tìm thấy kết quả" : `Chưa có chặng học nào trong ${subjectTitle}`}
        </Typography>
        <Typography sx={{ mt: 1, color: "#64748B", fontSize: 13, lineHeight: 1.6 }}>
          {query
            ? `Không có level, chủ đề hoặc bài học nào khớp với từ khóa "${query}".`
            : "Bắt đầu xây dựng lộ trình học tập theo chuẩn roadmap bằng cách tạo Level (Chặng học) đầu tiên."}
        </Typography>
        {!query ? (
          <Button
            variant="contained"
            size="medium"
            startIcon={<Add />}
            onClick={onCreateLevel}
            sx={{
              mt: 3,
              bgcolor: "#0F6CBD",
              boxShadow: "0 2px 8px rgba(15, 108, 189, 0.25)",
              fontSize: 13,
              fontWeight: 600,
              textTransform: "none",
              px: 3,
              py: 1,
              borderRadius: 2,
              "&:hover": { bgcolor: "#0B5594" },
            }}
          >
            Tạo Level đầu tiên cho {subjectTitle}
          </Button>
        ) : null}
      </Box>
    </Box>
  );
}
