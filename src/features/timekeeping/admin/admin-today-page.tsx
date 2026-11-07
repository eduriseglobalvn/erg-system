import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import Box from "@mui/material/Box";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { formatTimeVi, isIsoDate, todayInput } from "@/domain/formatters/format-date";
import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgTextField } from "@/components/erg-mui/erg-form";
import { ErgErrorState, ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { useAdminToday, useTimekeepingSchools } from "../api/timekeeping-admin-query";
import type { ActionItem } from "../api/timekeeping-types";
import { weekdayDateVi } from "../components/punch/punch-format";
import { ActionItemsCard } from "./action-items-card";
import { BySiteCard } from "./by-site-card";
import { exportTodayPunches } from "./export-timesheet";
import { PunchInHistogram } from "./punch-in-histogram";
import { PunchReviewDialog } from "./punch-review-dialog";
import { RecentPunchesTable } from "./recent-punches-table";
import { SchoolFilter } from "./school-filter";
import { TodayKpiRow } from "./today-kpi-row";
import { useAdminSearch } from "./use-admin-search";

const APPROVALS = "/employees/teacher-absence";

/** A01: who has punched today, who has not, and what needs action. Filters live in `?schoolId=&date=`. */
export function AdminTodayPage() {
  const { search, update } = useAdminSearch("/employees/timekeeping");
  const navigate = useNavigate();
  const schools = useTimekeepingSchools();
  const schoolId = search.schoolId ?? "";
  const date = search.date && isIsoDate(search.date) ? search.date : todayInput();
  const { data, isLoading, isError, refetch, dataUpdatedAt } = useAdminToday(schoolId, date);
  const [reviewing, setReviewing] = useState<ActionItem | null>(null);
  const go = (href: string) => void navigate({ href: adminPath(href) });
  const updated = dataUpdatedAt ? formatTimeVi(new Date(dataUpdatedAt)) : "";
  const siteCount = schools.data?.length;
  const description = [weekdayDateVi(new Date(`${date}T00:00:00`)), siteCount === undefined ? "" : `${siteCount} cơ sở`, updated ? `cập nhật ${updated}` : ""].filter(Boolean).join(" · ");

  return (
    <Box sx={{ display: "grid", gap: 2, px: { xs: 2, sm: 3 }, py: 2 }}>
      <ErgPageHeader
        description={description}
        primaryAction={
          <>
            <ErgButton disabled={!data} onClick={() => data && void exportTodayPunches(data.recentPunches ?? [], date)} startIcon={<FileDownloadOutlinedIcon />} variant="outlined">Xuất Excel</ErgButton>
            <ErgButton onClick={() => go(APPROVALS)} variant="contained">Duyệt đơn · {data?.pendingRequests ?? 0}</ErgButton>
          </>
        }
        title="Chấm công hôm nay"
      />
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
        <SchoolFilter allowAll onChange={(next) => update({ schoolId: next })} schools={schools.data ?? []} value={schoolId} />
        <ErgTextField label="Ngày" onChange={(event) => update({ date: event.target.value })} size="small" slotProps={{ inputLabel: { shrink: true } }} sx={{ width: { xs: "100%", sm: 170 } }} type="date" value={date} />
      </Box>
      {isError ? (
        <ErgErrorState action={<ErgButton onClick={() => void refetch()} variant="outlined">Tải lại</ErgButton>} description="Không tải được dữ liệu chấm công." title="Có lỗi xảy ra" />
      ) : isLoading || !data ? (
        <ErgSkeleton height={360} />
      ) : (
        <>
          <TodayKpiRow data={data} />
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "3fr 2fr" } }}>
            <PunchInHistogram buckets={data.inBuckets ?? []} />
            <ActionItemsCard
              items={data.actionItems ?? []}
              onReview={setReviewing}
              onOpen={(item) => go(`${APPROVALS}?id=${encodeURIComponent(item.targetId ?? "")}`)}
              onView={() => go(`/employees/timesheet${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ""}`)}
            />
          </Box>
          <RecentPunchesTable punches={data.recentPunches ?? []} updatedAt={updated} />
          <BySiteCard sites={data.bySite ?? []} />
          {reviewing ? <PunchReviewDialog item={reviewing} onClose={() => setReviewing(null)} punch={data.recentPunches?.find((p) => p.id === reviewing.targetId)} /> : null}
        </>
      )}
    </Box>
  );
}
