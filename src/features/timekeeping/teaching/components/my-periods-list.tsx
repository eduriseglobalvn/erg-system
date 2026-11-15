import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgErrorState, ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { useMyTeachingPeriods } from "../api/teaching-hours-query";
import { TotalSheet } from "./total-sheet";

/** «Xem từng tiết ›»: the month's periods of the signed-in teacher, loaded only once opened. */
export function MyPeriodsList({ closed, month }: { closed: boolean; month: string }) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const { data, isError, refetch } = useMyTeachingPeriods(month, "MAIN", page, open);

  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      <Box>
        <ErgButton onClick={() => setOpen((v) => !v)} variant="text">{open ? "Ẩn danh sách tiết" : "Xem từng tiết ›"}</ErgButton>
      </Box>
      {open ? (
        <>
          {closed ? <Typography color="text.secondary" variant="caption">Danh sách này lấy từ thời khoá biểu hiện tại, có thể khác số tiết đã chốt.</Typography> : null}
          {isError ? (
            <ErgErrorState action={<ErgButton onClick={() => void refetch()} variant="outlined">Thử lại</ErgButton>} description="Không tải được danh sách tiết." title="Có lỗi xảy ra" />
          ) : data ? (
            <TotalSheet data={data} onPage={setPage} role="MAIN" />
          ) : (
            <ErgSkeleton height={240} />
          )}
        </>
      ) : null}
    </Box>
  );
}
