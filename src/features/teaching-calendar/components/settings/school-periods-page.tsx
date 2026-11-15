import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgErrorState } from "@/components/erg-mui/erg-feedback";
import { loadTeachingPeriodTemplates, type TeachingPeriodTemplate } from "@/features/teaching-calendar/api/teaching-calendar-schedule-api";
import { teachingCalendarQueryKeys } from "@/features/teaching-calendar/api/teaching-calendar-query-keys";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { ContentPendingSkeleton } from "@/routes/route-feedback";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { scheduleTokens } from "../shared/schedule-cell-sx";

const { color, radius, type } = ergEnterpriseTokens;
type Slot = TeachingPeriodTemplate["slots"][number];

const toMinutes = (time: string) => { const [h, m] = time.split(":").map(Number); return h * 60 + m; };

const SESSIONS = [
  { session: "MORNING", title: "BUỔI SÁNG" },
  { session: "AFTERNOON", title: "BUỔI CHIỀU" },
] as const;

/** Phut moi tiet neu moi tiet co gio deu dai bang nhau; khong thi undefined. */
export function periodLength(slots: readonly Slot[]): number | undefined {
  const lengths = new Set(slots.filter((slot) => slot.startTime && slot.endTime).map((slot) => toMinutes(slot.endTime as string) - toMinutes(slot.startTime as string)));
  return lengths.size === 1 ? [...lengths][0] : undefined;
}

/** Ra choi giua hai tiet co gio lien nhau trong cung buoi: phut, hoac 0 neu khong co. */
export function breakBefore(previous: Slot | undefined, slot: Slot): number {
  if (!previous?.endTime || !slot.startTime) return 0;
  return Math.max(0, toMinutes(slot.startTime) - toMinutes(previous.endTime));
}

function SessionColumn({ slots, title, last }: { last: boolean; slots: readonly Slot[]; title: string }) {
  return (
    <Box sx={{ borderRight: last ? 0 : `1px solid ${color.divider}`, px: 2.5, py: 2 }}>
      <Typography sx={{ color: color.textMuted, letterSpacing: "0.02em", mb: 0.75, ...type.label }}>{title}</Typography>
      {slots.map((slot, index) => {
        const gap = breakBefore(slots[index - 1], slot);
        const off = !slot.startTime;
        return (
          <Box key={slot.periodNo}>
            {gap > 0 ? <Box sx={{ borderTop: `1px dashed ${color.border}`, color: color.textMuted, height: 28, pt: "2px", ml: "68px", ...type.note }}>Ra chơi {gap} phút</Box> : null}
            <Box sx={{ alignItems: "center", borderRadius: `${radius.control}px`, color: off ? scheduleTokens.disabled : undefined, display: "flex", gap: 1.5, height: 44 }}>
              <Box component="span" sx={{ width: 56, ...type.smallStrong }}>Tiết {slot.periodNo}</Box>
              <Box component="span" sx={{ flex: 1, fontVariantNumeric: "tabular-nums", textDecoration: off ? "line-through" : "none", typography: "body2" }}>
                {slot.startTime ? `${slot.startTime} – ${slot.endTime}` : "trống giờ"}
              </Box>
              <Switch checked={!off} disabled size="small" slotProps={{ input: { "aria-label": `Tiết ${slot.periodNo} đang dùng` } }} />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

/** «Giờ tiết của trường» (board AdminSchoolPeriods): bang gio theo buoi. Doc tu `teachingPeriodTemplates`; BE chua co mutation luu nen man hinh chi xem. */
export function SchoolPeriodsPage() {
  const tenantId = getDefaultTenantId();
  const templates = useQuery({ queryFn: ({ signal }) => loadTeachingPeriodTemplates(signal), queryKey: teachingCalendarQueryKeys.periodTemplates(tenantId), staleTime: 5 * 60_000 });
  const [selected, setSelected] = useState<string | null>(null);
  const list = templates.data ?? [];
  const current = list.find((item) => item.id === selected) ?? list[0];
  const slots = useMemo(() => [...(current?.slots ?? [])].sort((a, b) => a.periodNo - b.periodNo), [current]);
  const length = periodLength(slots);
  const used = slots.filter((slot) => slot.startTime).length;

  if (templates.isError) return <ErgErrorState action={<ErgButton onClick={() => void templates.refetch()} variant="outlined">Thử lại</ErgButton>} description="Kiểm tra kết nối rồi thử lại." title="Không tải được giờ tiết." />;
  if (templates.isPending) return <ContentPendingSkeleton />;

  return (
    <Stack spacing={2.5} sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
      <Box component="header">
        <Link href={adminPath("/calendar")} sx={{ fontSize: type.small.fontSize }} underline="none">← Lịch giảng dạy</Link>
        <Typography component="h1" sx={{ mt: 0.75 }} variant="h1">Giờ tiết của trường</Typography>
        <Typography sx={{ color: color.textMuted, mt: 0.5, ...type.small }}>Nhập một lần. Khi kéo tiết trên lịch tuần, khối tiết bám theo giờ ở đây.</Typography>
      </Box>
      <Stack direction={{ md: "row", xs: "column" }} spacing={2.5} sx={{ alignItems: "flex-start" }}>
        <Box aria-label="Bảng giờ" component="nav" sx={{ display: "flex", flexDirection: "column", flex: "none", gap: "2px", width: { md: 248, xs: "100%" } }}>
          {list.map((item) => {
            const on = item.id === current?.id;
            return (
              <Box
                component="button" key={item.id} onClick={() => setSelected(item.id)} type="button"
                sx={{ bgcolor: on ? scheduleTokens.published.bg : "transparent", border: 0, borderRadius: `${radius.control}px`, color: on ? scheduleTokens.published.text : "inherit", cursor: "pointer", font: "inherit", px: 1.5, py: 1, textAlign: "left" }}
              >
                <Box component="span" sx={{ display: "block", fontWeight: type.noteMedium.fontWeight }}>{item.name}</Box>
                <Box component="span" sx={{ color: on ? scheduleTokens.published.text : color.textMuted, display: "block", ...type.note }}>{item.periodsPerDay} tiết/ngày</Box>
              </Box>
            );
          })}
        </Box>
        {current ? (
          <Box aria-label={`Giờ tiết ${current.name}`} component="section" sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${radius.card}px`, flex: 1, minWidth: 0, width: "100%" }}>
            <Box sx={{ alignItems: "center", borderBottom: `1px solid ${color.divider}`, display: "flex", gap: 1.5, px: 2.5, py: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ typography: "subtitle1" }}>{current.name}</Typography>
                <Typography sx={{ color: color.textMuted, mt: 0.25, ...type.small }}>{used} tiết đang dùng{length ? ` · ${length} phút/tiết` : ""}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { md: `repeat(${SESSIONS.length}, 1fr)`, xs: "1fr" } }}>
              {SESSIONS.map(({ session, title }, index) => (
                <SessionColumn key={session} last={index === SESSIONS.length - 1} slots={slots.filter((slot) => slot.session === session)} title={title} />
              ))}
            </Box>
          </Box>
        ) : null}
      </Stack>
    </Stack>
  );
}
