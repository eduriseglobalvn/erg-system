import { useState } from "react";
import Box from "@mui/material/Box";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgErrorState, ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import { useMyTeachingPeriods } from "../api/teaching-hours-query";
import { TotalSheet } from "./total-sheet";

/** The month's periods of the signed-in teacher («Xem từng tiết ›»), loaded only once `open`. */
export function MyPeriodsList({ closed, month, open }: { closed: boolean; month: string; open: boolean }) {
  const [page, setPage] = useState(0);
  const { data, isError, refetch } = useMyTeachingPeriods(month, "MAIN", page, open);
  if (!open) return null;

  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      {closed ? <Box sx={{ ...t.type.note, color: "text.secondary" }}>Danh sách này lấy từ thời khoá biểu hiện tại, có thể khác số tiết đã chốt.</Box> : null}
      {isError ? (
        <ErgErrorState action={<ErgButton onClick={() => void refetch()} variant="outlined">Thử lại</ErgButton>} description="Không tải được danh sách tiết." title="Có lỗi xảy ra" />
      ) : data ? (
        <TotalSheet data={data} onPage={setPage} role="MAIN" />
      ) : (
        <ErgSkeleton height={240} />
      )}
    </Box>
  );
}
