import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Rating from "@mui/material/Rating";
import Typography from "@mui/material/Typography";
import type { PartnerSchool } from "@/features/lcms/school-management/types/school-management-types";

export function SchoolReviewsPanel({ school }: { school: PartnerSchool }) {
  const average = school.reviews.length ? school.reviews.reduce((sum, review) => sum + review.rating, 0) / school.reviews.length : 0;
  return (
    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "260px minmax(0,1fr)" } }}>
      <Paper variant="outlined" sx={{ alignItems: "center", display: "flex", flexDirection: "column", height: "fit-content", p: 3, textAlign: "center" }}>
        <Typography sx={{ fontSize: 40, fontWeight: 900 }}>{average ? average.toFixed(1) : "—"}</Typography>
        <Rating precision={0.1} readOnly value={average} />
        <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">{school.reviews.length} đánh giá đã xác minh</Typography>
      </Paper>
      <Box sx={{ display: "grid", gap: 1.5 }}>
        {school.reviews.map((review) => (
          <Paper key={review.id} variant="outlined" sx={{ p: 2.25 }}>
            <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}><Box><Typography sx={{ fontWeight: 800 }}>{review.author}</Typography><Typography color="text.secondary" variant="caption">{review.role} · {review.createdAt}</Typography></Box><Rating precision={0.5} readOnly size="small" value={review.rating} /></Box>
            <Typography sx={{ mt: 1.5 }} variant="body2">{review.content}</Typography>
          </Paper>
        ))}
        {!school.reviews.length ? <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}><Typography color="text.secondary">Chưa có đánh giá. Đánh giá được ghi nhận sau mỗi kỳ triển khai.</Typography></Paper> : null}
      </Box>
    </Box>
  );
}
