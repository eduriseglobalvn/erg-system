import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState } from "@/components/erg-mui/erg-feedback";
import { ink, type } from "./overview-styles";
import { ContentPendingSkeleton } from "@/routes/route-feedback";
import { OverviewTeacherTable } from "./overview-teacher-table";
import { OVERVIEW_PAGE_SIZE, type useOverviewData } from "./use-overview-data";
import type { useOverviewParams } from "./use-overview-params";

type Props = { data: ReturnType<typeof useOverviewData>; params: ReturnType<typeof useOverviewParams>; requiredMinutes: number };

const explain = (minutes: number) => `Mỗi ô ngày có 8 ô tiết: hàng trên là buổi sáng (tiết 1–4), hàng dưới là buổi chiều (tiết 6–9). Trong ô là tên lớp; dòng nhỏ bên dưới là trường dạy hôm đó, hiện màu cam khi giáo viên phải chạy 2 trường trong một ngày, kèm thời gian nghỉ giữa 2 nơi. Hai tiết liền nhau ở 2 trường khác nhau phải cách nhau ít nhất ${minutes} phút (chỉnh trong Cài đặt, theo từng cặp trường); thiếu thì ô tiết sau viền đỏ đứt, báo “Không kịp di chuyển” và chặn xuất bản như trùng giờ.`;
const TAIL = "Di chuột vào ô để xem chi tiết; bấm đúp để sửa.";
const ASSISTANT = "Ô viền xanh nét đứt ghi “TG” là tiết người đó làm trợ giảng (giáo viên chính ở lớp khác); tiết trợ giảng tính vào tải tuần và vào luật trùng giờ / di chuyển.";

/** Tab «Theo giáo viên» (6.7): bảng, phân trang 50, giải thích dưới bảng. */
export function OverviewTeacherPanel({ data, params, requiredMinutes }: Props) {
  const page = data.teachers.data;
  const pages = Math.max(1, Math.ceil((page?.total ?? 0) / OVERVIEW_PAGE_SIZE));
  const shortNames = new Map(data.schools.items.map((school) => [school.schoolId, school.schoolShortName]));
  if (data.teachers.isPending) return <ContentPendingSkeleton />;
  if (!page?.items.length) return <ErgEmptyState title="Không có giáo viên nào khớp bộ lọc" />;
  return (
    <Stack spacing="12px">
      <OverviewTeacherTable
        eventsById={data.eventsById} loadMax={data.loadSettings?.loadMax ?? 24} loadWarn={data.loadSettings?.loadWarn ?? 18}
        onOpenSlot={(date, periodNo, eventId, intent) => data.openSchedule(eventId ? data.eventsById.get(eventId) : undefined, { date, intent, periodNo })}
        onSort={() => params.update({ sort: params.sort === "LOAD_DESC" ? "LOAD_ASC" : "LOAD_DESC" })} rows={page.items}
        shortNames={shortNames} sort={params.sort} total={page.total} weekStart={params.week}
      />
      {pages > 1 ? (
        <Stack className="erg-print-hide" direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
          <ErgButton disabled={data.teacherPage === 0} onClick={() => data.setTeacherPage(data.teacherPage - 1)} variant="text">Trang trước</ErgButton>
          <Typography sx={{ typography: "body2" }}>Trang {data.teacherPage + 1} / {pages}</Typography>
          <ErgButton disabled={data.teacherPage + 1 >= pages} onClick={() => data.setTeacherPage(data.teacherPage + 1)} variant="text">Trang sau</ErgButton>
        </Stack>
      ) : null}
      <Typography sx={{ ...type(12), color: ink.textMuted }}>{explain(requiredMinutes)} {ASSISTANT} {TAIL}</Typography>
    </Stack>
  );
}
