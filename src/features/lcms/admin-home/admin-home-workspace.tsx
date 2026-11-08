import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import UploadRoundedIcon from "@mui/icons-material/UploadRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import { formatDateVi } from "@/domain/formatters/format-date";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

import type { AdminHomeSummary, AdminHomeTask } from "./admin-home-model";
import { AdminHomeSchools, panelSx } from "./admin-home-schools";
import { useAdminHomeData } from "./use-admin-home-data";

const WEEKDAYS = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
const TONE_DOT = { error: t.statusTint.error.dot, warning: t.statusTint.warning.dot, info: t.statusTint.info.dot } as const;

/** Admin "Trang chủ" (design canvas): KPI strip, partner schools, and the queue of real gaps to fix. */
export function AdminHomeWorkspace({ tenantId }: { tenantId: string }) {
  const navigate = useNavigate();
  const { summary, loading, detailsLoading, failed, refetch } = useAdminHomeData(tenantId);
  const go = (path: string) => void navigate({ href: adminPath(path) });
  const today = new Date();

  return (
    <Box sx={{ display: "grid", gap: 2.5, maxWidth: 1280, mx: "auto", width: "100%" }}>
      <ErgPageHeader
        description={`${WEEKDAYS[today.getDay()]}, ${formatDateVi(today)}`}
        primaryAction={<ErgButton leadingIcon={<UploadRoundedIcon />} onClick={() => go("/schools/imports")}>Nhập dữ liệu</ErgButton>}
        secondaryActions={[
          { label: "Thêm trường", onClick: () => go("/schools/list") },
          { label: "Tạo tài khoản nhân sự", onClick: () => go("/employees") },
        ]}
        title="Trang chủ"
      />
      {failed ? (
        <Alert action={<Button color="inherit" onClick={refetch} size="small" variant="text">Thử lại</Button>} severity="error">
          Không tải được danh sách trường.
        </Alert>
      ) : null}
      <KpiStrip loading={loading} summary={summary} />
      <Box sx={{ alignItems: "start", display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", lg: "minmax(0,2fr) minmax(300px,1fr)" } }}>
        <AdminHomeSchools
          loading={loading}
          onOpen={(id) => void navigate({ href: `${adminPath("/schools/detail")}?schoolId=${encodeURIComponent(id)}` })}
          onOpenAll={() => go("/schools/list")}
          rows={summary.schools}
        />
        {/* Phones put the queue first (design N4); desktop keeps it in the side column. */}
        <TaskQueue loading={loading || detailsLoading} onOpen={go} tasks={summary.tasks} />
      </Box>
    </Box>
  );
}

function KpiStrip({ loading, summary }: { loading: boolean; summary: AdminHomeSummary }) {
  const placedPercent = summary.studentCount ? Math.round((summary.placedStudents / summary.studentCount) * 100) : 0;
  const items = [
    { label: "Trường liên kết", value: summary.schoolCount, note: `${summary.activeSchoolCount} đang vận hành` },
    { label: "Người học", value: summary.studentCount, note: `Trong ${summary.classCount} lớp` },
    {
      label: "Nhân sự",
      value: summary.staffCount ?? "—",
      note: summary.staffNeverSignedIn ? `${summary.staffNeverSignedIn} chưa đăng nhập` : "Tài khoản trong hệ thống",
    },
    { label: "Đã xếp môn", value: `${placedPercent}%`, note: `${summary.placedStudents}/${summary.studentCount} học sinh` },
  ];
  return (
    <Box component="section" aria-label="Số liệu chính" sx={{ ...panelSx, display: "grid", gridTemplateColumns: { xs: "repeat(2,minmax(0,1fr))", md: "repeat(4,minmax(0,1fr))" }, overflow: "hidden" }}>
      {items.map((item, index) => (
        <Box
          key={item.label}
          sx={{
            borderLeft: { xs: index % 2 ? `1px solid ${t.color.divider}` : "none", md: index ? `1px solid ${t.color.divider}` : "none" },
            borderTop: { xs: index > 1 ? `1px solid ${t.color.divider}` : "none", md: "none" },
            minWidth: 0,
            px: 2.5,
            py: 2,
          }}
        >
          <Typography color="text.secondary" variant="caption">{item.label}</Typography>
          {loading ? <Skeleton height={34} width="50%" /> : (
            <Typography sx={{ fontVariantNumeric: "tabular-nums", mt: 0.25, typography: "h1" }}>{item.value}</Typography>
          )}
          <Typography color="text.secondary" noWrap sx={{ mt: 0.25 }} variant="caption" component="p">{loading ? " " : item.note}</Typography>
        </Box>
      ))}
    </Box>
  );
}

function TaskQueue({ loading, tasks, onOpen }: { loading: boolean; tasks: AdminHomeTask[]; onOpen: (path: string) => void }) {
  return (
    <Box component="section" aria-labelledby="admin-home-tasks" sx={{ ...panelSx, order: { xs: -1, lg: 0 }, overflow: "hidden" }}>
      <Box sx={{ alignItems: "center", borderBottom: `1px solid ${t.color.divider}`, display: "flex", gap: 1, px: 2.5, py: 1.75 }}>
        <Typography component="h2" id="admin-home-tasks" variant="h5">Cần xử lý</Typography>
        {!loading && tasks.length ? (
          <Box component="span" sx={{ bgcolor: "error.main", borderRadius: `${t.radius.chip}px`, color: "error.contrastText", lineHeight: "20px", minWidth: 20, px: 0.75, textAlign: "center", typography: "caption", fontWeight: "fontWeightBold" }}>{tasks.length}</Box>
        ) : null}
      </Box>
      {loading ? (
        Array.from({ length: 3 }).map((_, index) => <Skeleton height={48} key={index} sx={{ mx: 2.5, my: 1.25 }} variant="rounded" />)
      ) : tasks.length === 0 ? (
        <Typography color="text.secondary" sx={{ px: 2.5, py: 4 }}>Không có việc tồn đọng. Dữ liệu các trường đã đầy đủ.</Typography>
      ) : (
        tasks.map((task, index) => (
          <ButtonBase
            key={task.id}
            onClick={() => onOpen(task.path)}
            sx={{ alignItems: "flex-start", borderTop: index ? `1px solid ${t.color.divider}` : "none", display: "flex", gap: 1.5, px: 2.5, py: 1.5, textAlign: "left", width: "100%", "&:hover": { bgcolor: t.color.surfaceMuted } }}
          >
            <Box aria-hidden sx={{ bgcolor: TONE_DOT[task.tone], borderRadius: "50%", flexShrink: 0, height: 8, mt: 0.75, width: 8 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2">{task.title}</Typography>
              <Typography color="text.secondary" component="p" variant="caption">{task.detail}</Typography>
            </Box>
            <ChevronRightRoundedIcon sx={{ color: "text.disabled", flexShrink: 0 }} />
          </ButtonBase>
        ))
      )}
    </Box>
  );
}
