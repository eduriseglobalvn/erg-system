import { useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgErrorState, ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { ErgSelect } from "@/components/erg-mui/erg-form";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import { AUTH_BYPASS_ENABLED } from "@/platform/auth/config/auth-bypass";
import { getAuthScope } from "@/platform/auth/api/auth-storage";
import { evaluatePermission } from "@/platform/auth/permissions/permission-evaluator";
import { useOverdueApprovalCount, useApprovals } from "../../api/timekeeping-approval-query";
import { useTimekeepingSchools } from "../../api/timekeeping-admin-query";
import { usePendingApprovalCount } from "../../api/timekeeping-query";
import { SchoolFilter } from "../school-filter";
import { ApprovalDetail } from "./approval-detail";
import { ApprovalList, approvalRowId } from "./approval-list";
import { DUE_OPTIONS, TAB_BOX, TYPE_OPTIONS, type ApprovalTab } from "./approval-model";
import { BulkApproveBar } from "./bulk-approve-bar";
import { useApprovalsSearch } from "./use-approvals-search";

/** "Tất cả đơn" is a `timekeeping.manage` view; the API answers 403 to anyone else. */
function canSeeAllRequests(): boolean {
  if (AUTH_BYPASS_ENABLED) return true;
  const session = getAuthScope("lcms").session;
  return evaluatePermission({ permission: "timekeeping.manage", grantedPermissions: session?.permissions ?? [], deniedPermissions: session?.deniedPermissions ?? [] });
}

/** A03: list on the left, detail on the right; below `md` the detail replaces the list (`?id=`, back returns). */
export function ApprovalsPage() {
  const canAll = useMemo(() => canSeeAllRequests(), []);
  const { search, update } = useApprovalsSearch(canAll);
  const isMobile = useMediaQuery(useTheme().breakpoints.down("md"));
  const schools = useTimekeepingSchools();
  const pending = usePendingApprovalCount(true);
  const overdue = useOverdueApprovalCount();
  const list = useApprovals({ box: TAB_BOX[search.tab], type: search.type, siteId: search.schoolId, due: search.due });
  const [ticked, setTicked] = useState<ReadonlySet<string>>(new Set());
  const items = useMemo(() => list.data?.items ?? [], [list.data]);
  const bulk = search.tab === "mine";
  // Derived from the visible list: ids ticked under another filter or already handled drop out by themselves.
  const checked = useMemo(() => new Set(items.map((i) => i.request?.id as string).filter((id) => ticked.has(id))), [items, ticked]);
  const selected = items.filter((i) => checked.has(i.request?.id as string)).map((i) => ({ id: i.request?.id as string, code: i.request?.code ?? "" }));

  // Back from the full-screen detail: focus returns to the row that was opened.
  const opened = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (search.id) opened.current = search.id;
    else if (opened.current) { document.getElementById(approvalRowId(opened.current))?.focus(); opened.current = undefined; }
  }, [search.id]);

  const toggle = (id: string) => setTicked((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const toggleAll = () => setTicked(checked.size === items.length ? new Set() : new Set(items.map((i) => i.request?.id as string)));
  const schoolName = (id?: string) => schools.data?.find((s) => s.id === id)?.name;
  const showList = !isMobile || !search.id;
  const showDetail = !isMobile || Boolean(search.id);
  const mineCount = pending.data;
  const description = `${mineCount ?? 0} đơn chờ bạn · ${overdue.data ?? 0} quá hạn · Admin được duyệt thay ở mọi bước, có ghi nhật ký`;
  const filterWidth = { width: { xs: "100%", sm: 200 } };

  return (
    <Box sx={{ display: "grid", gap: 2, px: { xs: 2, sm: 3 }, py: 2 }}>
      {showList ? (
        <>
          <ErgPageHeader description={description} title="Duyệt đơn" />
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            <ErgSelect label="Loại đơn" onChange={(e) => update({ type: e.target.value })} options={TYPE_OPTIONS} size="small" sx={filterWidth} value={search.type ?? ""} />
            <SchoolFilter allowAll onChange={(schoolId) => update({ schoolId })} schools={schools.data ?? []} value={search.schoolId ?? ""} />
            <ErgSelect label="Hạn xử lý" onChange={(e) => update({ due: e.target.value })} options={DUE_OPTIONS} size="small" sx={filterWidth} value={search.due ?? ""} />
          </Box>
        </>
      ) : null}
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: isMobile ? "1fr" : "minmax(340px, 2fr) 3fr" }}>
        {showList ? (
          <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, minWidth: 0, overflow: "hidden" }}>
            <Tabs aria-label="Hộp đơn" onChange={(_, tab: ApprovalTab) => update({ tab })} value={search.tab} variant="scrollable">
              <Tab label={`Chờ tôi duyệt${mineCount === undefined ? "" : ` (${mineCount})`}`} value="mine" />
              <Tab label="Tôi đã xử lý" value="done" />
              {canAll ? <Tab label="Tất cả đơn" value="all" /> : null}
            </Tabs>
            {list.isError ? (
              <ErgErrorState action={<ErgButton onClick={() => void list.refetch()} variant="outlined">Tải lại</ErgButton>} description="Không tải được danh sách đơn." title="Có lỗi xảy ra" />
            ) : list.isPending ? (
              <ErgSkeleton height={280} />
            ) : items.length === 0 ? (
              <ErgEmptyState description="Không có đơn nào khớp bộ lọc." title="Chưa có đơn" />
            ) : (
              <ApprovalList checked={bulk ? checked : undefined} items={items} onOpen={(id) => update({ id }, true)} onToggle={toggle} onToggleAll={toggleAll} selectedId={search.id} />
            )}
            {bulk && selected.length > 0 ? <BulkApproveBar onSettled={(done) => setTicked((prev) => new Set([...prev].filter((id) => !done.includes(id))))} selected={selected} /> : null}
            {(list.data?.total ?? 0) > items.length ? <Typography color="text.secondary" sx={{ p: 1.5 }} variant="caption">Hiển thị {items.length}/{list.data?.total} đơn mới nhất, dùng bộ lọc để thu hẹp.</Typography> : null}
          </Box>
        ) : null}
        {showDetail ? (
          <Box sx={{ border: isMobile ? 0 : 1, borderColor: "divider", borderRadius: 2, minWidth: 0, p: isMobile ? 0 : 2 }}>
            {search.id ? (
              <ApprovalDetail fullScreen={isMobile} id={search.id} key={search.id} onClose={() => update({ id: undefined }, true)} schoolName={schoolName} />
            ) : (
              <Typography color="text.secondary" variant="body2">Chọn một đơn để xem chi tiết.</Typography>
            )}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
