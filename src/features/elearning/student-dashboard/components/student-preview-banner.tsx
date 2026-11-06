import Alert from "@mui/material/Alert";

export const STUDENT_PREVIEW_BANNER_TEXT = "Bạn đang xem với tư cách giáo viên. Bài làm không được tính điểm.";

export function StudentPreviewBanner({ preview }: { preview: boolean }) {
  if (!preview) return null;
  return <Alert severity="info" sx={{ borderRadius: 0 }}>{STUDENT_PREVIEW_BANNER_TEXT}</Alert>;
}
