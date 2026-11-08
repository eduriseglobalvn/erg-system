import Alert from "@mui/material/Alert";

import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

export const STUDENT_PREVIEW_BANNER_TEXT = "Bạn đang xem với tư cách giáo viên. Bài làm không được tính điểm.";

/** Full-bleed strip above the desktop shell; `inset` makes it a rounded card inside the phone scroll area. */
export function StudentPreviewBanner({ inset = false, preview }: { inset?: boolean; preview: boolean }) {
  if (!preview) return null;
  return (
    <Alert severity="info" sx={inset ? { borderRadius: `${t.radius.card}px`, mb: 2 } : { borderRadius: 0 }}>
      {STUDENT_PREVIEW_BANNER_TEXT}
    </Alert>
  );
}
