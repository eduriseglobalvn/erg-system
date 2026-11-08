import { useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgErrorState } from "@/components/erg-mui/erg-feedback";
import { ergSegmentedTabsSx } from "@/components/erg-mui/erg-tabs";
import { ergMobileDockAnchor } from "@/components/portal/erg-mobile-dock";
import type { AssignmentRun } from "@/domain/school/classroom-types";
import { ProgressRing } from "@/features/lms/components/assignment-progress-mobile/progress-ring";
import { type ProgressMobileRow, ProgressStudentRow } from "@/features/lms/components/assignment-progress-mobile/progress-student-row";
import { useRemindPending } from "@/features/lms/components/assignment-progress-mobile/use-remind-pending";
import { ContentPendingSkeleton } from "@/routes/route-feedback";

/** Footer bar: 12px + 52px button + 12px, plus one caption line for the reason it is disabled. */
const FOOTER_RESERVE = 112;

type Segment = "pending" | "inprogress" | "completed";

type Props = {
  classLabel?: string;
  /** Server totals for the header (the list below may be one page of them). */
  counts: { completed: number; needsReview: number; total: number };
  onBack: () => void;
  rows: ProgressMobileRow[];
  run?: AssignmentRun;
  status: "loading" | "error" | "ready";
};

/** Phone "Tiến độ học tập" (canvas N10) on the desktop page's queries: ring, counts, segmented list, sticky "Nhắc". */
export function AssignmentProgressMobile({ classLabel, counts, onBack, rows, run, status }: Props) {
  const [segment, setSegment] = useState<Segment>("pending");
  const pending = rows.filter((row) => row.status !== "completed");
  const inProgress = rows.filter((row) => row.status === "inprogress");
  const completed = rows.filter((row) => row.status === "completed");
  const visible = segment === "pending" ? pending : segment === "inprogress" ? inProgress : completed;
  const reminder = useRemindPending(pending, run?.title ?? "");
  const showFooter = status === "ready" && Boolean(run) && pending.length > 0;
  const percent = counts.total ? Math.round((counts.completed / counts.total) * 100) : 0;

  let body;
  if (!run) {
    body = <ErgEmptyState description="Giao bài cho lớp để theo dõi tiến độ tại đây." icon={<AssignmentOutlinedIcon />} title="Chưa có bài đã giao" />;
  } else if (status === "loading") {
    body = <ContentPendingSkeleton />;
  } else if (status === "error") {
    body = <ErgErrorState description="Kiểm tra kết nối rồi mở lại trang." title="Không tải được tiến độ bài" />;
  } else {
    body = (
      <>
        <Paper sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 2 }} variant="outlined">
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: "fontWeightBold" }} variant="body1">{run.title}</Typography>
            <Typography color="text.secondary" variant="caption" component="p">{[classLabel, run.dueLabel].filter(Boolean).join(" · ")}</Typography>
          </Box>
          <Box sx={{ alignItems: "center", display: "flex", gap: 2 }}>
            <ProgressRing percent={percent} />
            <Box sx={{ display: "grid", flex: 1, gap: 1, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
              <Stat label="Đã nộp" value={`${counts.completed} / ${counts.total}`} />
              <Stat label="Đang làm" value={inProgress.length} />
              <Stat label="Chưa mở" value={pending.length - inProgress.length} />
              <Stat label="Cần chấm" tone={counts.needsReview ? "error.main" : undefined} value={counts.needsReview} />
            </Box>
          </Box>
        </Paper>

        <Tabs aria-label="Lọc học sinh" onChange={(_, next: Segment) => setSegment(next)} sx={ergSegmentedTabsSx} value={segment} variant="fullWidth">
          <Tab label={`Chưa nộp ${pending.length}`} value="pending" />
          <Tab label={`Đang làm ${inProgress.length}`} value="inprogress" />
          <Tab label={`Đã nộp ${completed.length}`} value="completed" />
        </Tabs>

        <Paper sx={{ overflow: "hidden" }} variant="outlined">
          {visible.length ? (
            <Box aria-label="Danh sách học sinh" component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
              {visible.map((row) => <ProgressStudentRow key={row.id} row={row} />)}
            </Box>
          ) : (
            <Typography color="text.secondary" sx={{ p: 2, textAlign: "center" }} variant="body2">Không có học sinh nào ở mục này.</Typography>
          )}
        </Paper>
      </>
    );
  }

  return (
    <Box sx={{ bgcolor: "background.default", color: "text.primary", minWidth: 0, overflowX: "hidden" }}>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1, minHeight: 60, pb: 1, pt: 1.5, px: 1 }}>
        <ErgIconButton label="Quay lại" onClick={onBack}><ArrowBackIcon /></ErgIconButton>
        <Typography component="h1" noWrap sx={{ flex: 1, minWidth: 0 }} variant="h4">Tiến độ học tập</Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pb: showFooter ? `${FOOTER_RESERVE}px` : 2, pt: 0.5, px: 2 }}>
        {body}
      </Box>

      {showFooter ? (
        <Box
          sx={{
            bgcolor: "background.paper",
            borderColor: "divider",
            borderTop: 1,
            bottom: ergMobileDockAnchor(8),
            left: 0,
            position: "fixed",
            pb: 1.5,
            pt: 1.5,
            px: 2,
            right: 0,
            zIndex: (theme) => theme.zIndex.appBar + 1,
          }}
        >
          {reminder.disabledReason ? (
            <Typography color="text.secondary" component="p" id="progress-remind-reason" sx={{ mb: 1 }} variant="caption">
              {reminder.disabledReason}
            </Typography>
          ) : null}
          <ErgButton
            aria-describedby={reminder.disabledReason ? "progress-remind-reason" : undefined}
            disabled={Boolean(reminder.disabledReason)}
            fullWidth
            loading={reminder.isPending}
            onClick={reminder.remind}
            size="large"
            startIcon={<NotificationsActiveOutlinedIcon />}
            variant="contained"
          >
            {`Nhắc ${pending.length} học sinh chưa nộp`}
          </ErgButton>
        </Box>
      ) : null}
    </Box>
  );
}

function Stat({ label, tone, value }: { label: string; tone?: string; value: number | string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography color="text.secondary" noWrap variant="caption" component="p">{label}</Typography>
      <Typography color={tone} sx={{ fontVariantNumeric: "tabular-nums", fontWeight: "fontWeightBold" }} variant="body1">{value}</Typography>
    </Box>
  );
}
