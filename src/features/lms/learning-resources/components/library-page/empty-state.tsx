import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

export function EmptyState() {
  return (
    <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 1, borderStyle: "dashed", p: 5, textAlign: "center" }}>
      <Box
        sx={{
          alignItems: "center",
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
          borderRadius: 1,
          color: "primary.main",
          display: "flex",
          height: 48,
          justifyContent: "center",
          mx: "auto",
          width: 48,
        }}
      >
        <SearchIcon fontSize="small" />
      </Box>
      <Typography component="h3" variant="h4" sx={{ mt: 2 }}>
        Không tìm thấy tài liệu phù hợp
      </Typography>
      <Typography variant="subtitle2" sx={{ color: "text.secondary", mt: 1 }}>
        Hãy đổi bộ lọc lớp, môn, nhóm học liệu hoặc từ khóa tìm kiếm.
      </Typography>
    </Box>
  );
}
