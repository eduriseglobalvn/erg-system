import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { ErgEmptyState, ErgErrorState, ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import {
  loadLmsMyTeachingCalendar,
  teachingCalendarQueryKeys,
  TEACHING_CALENDAR_WORKSPACE_GC_TIME_MS,
  TEACHING_CALENDAR_WORKSPACE_STALE_TIME_MS,
  type MyTeachingCalendarInput,
  type TeachingCalendarEvent,
} from "@/features/teaching-calendar/api/teaching-calendar-api";
import { formatDateVi, todayInput } from "@/lib/format-date";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { teacherPath } from "@/platform/workspaces/workspace-paths";

type LessonLinks = { attendance: string; classLog: string; assign: string };

/** Deep links for one lesson card; class and date travel as query params. */
export function buildLessonLinks(event: Pick<TeachingCalendarEvent, "classId" | "date" | "id">): LessonLinks {
  const lesson = (path: string, withDate: boolean) => {
    const params = new URLSearchParams({ classId: event.classId });
    if (withDate) {
      params.set("date", event.date);
      params.set("scheduleId", event.id);
    }
    return `${teacherPath(path)}?${params.toString()}`;
  };
  return {
    assign: lesson("/homework/assign", false),
    attendance: lesson("/attendance", true),
    classLog: lesson("/class-log", true),
  };
}

export function sortTodayLessons(events: TeachingCalendarEvent[]) {
  return events
    .filter((event) => event.status !== "CANCELLED")
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function TodayLessonsList({
  error,
  events,
  isLoading,
  onNavigate,
  onOpenSchedule,
}: {
  error?: boolean;
  events: TeachingCalendarEvent[];
  isLoading?: boolean;
  onNavigate: (href: string) => void;
  onOpenSchedule: () => void;
}) {
  const scheduleAction = <Button onClick={onOpenSchedule} variant="outlined">Xem lịch</Button>;
  if (isLoading) return <ErgSkeleton height={96} variant="rounded" />;
  if (error) {
    return <ErgErrorState action={scheduleAction} description="Không tải được lịch dạy hôm nay. Mở Lịch làm việc để thử lại." title="Chưa tải được tiết dạy" />;
  }
  const lessons = sortTodayLessons([...events]);
  if (lessons.length === 0) {
    return (
      <ErgEmptyState
        action={scheduleAction}
        description="Hôm nay bạn không có tiết nào được xếp lịch. Mở Lịch làm việc để xem các ngày khác."
        icon={<EventNoteRoundedIcon />}
        title="Hôm nay không có tiết dạy"
      />
    );
  }
  return (
    <Stack spacing={1.5}>
      {lessons.map((event) => {
        const links = buildLessonLinks(event);
        return (
          <Box key={event.id} data-testid="today-lesson-card" sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 2 }}>
            <Typography variant="subtitle2">{event.startTime} - {event.endTime} · {event.className}</Typography>
            <Typography color="text.secondary" variant="caption">
              {[event.subjectName ?? event.title, event.roomName].filter(Boolean).join(" · ")}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, mt: 1.5 }}>
              <Button onClick={() => onNavigate(links.attendance)} sx={{ minHeight: 44 }} variant="outlined">Điểm danh</Button>
              <Button onClick={() => onNavigate(links.classLog)} sx={{ minHeight: 44 }} variant="outlined">Sổ đầu bài</Button>
              <Button onClick={() => onNavigate(links.assign)} sx={{ minHeight: 44 }} variant="outlined">Giao bài</Button>
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}

export function TodayLessonsPanel({ onOpenSchedule }: { onOpenSchedule: () => void }) {
  const { session } = useAuthSession("lms");
  const navigate = useNavigate();
  const tenantId = session?.tenantId ?? "";
  const date = todayInput();
  const input: MyTeachingCalendarInput = { from: date, statuses: ["PUBLISHED"], tenantId, to: date, viewMode: "ALL" };
  const query = useQuery({
    enabled: Boolean(tenantId),
    gcTime: TEACHING_CALENDAR_WORKSPACE_GC_TIME_MS,
    queryFn: ({ signal }) => loadLmsMyTeachingCalendar(input, signal),
    queryKey: teachingCalendarQueryKeys.workspace("lms", "teacher", input),
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: TEACHING_CALENDAR_WORKSPACE_STALE_TIME_MS,
  });
  const today = formatDateVi(date);

  return (
    <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 2, minWidth: 0, p: 2 }}>
      <Typography component="h2" sx={{ mb: 1.5 }} variant="subtitle1">Hôm nay{today ? ` · ${today}` : ""}</Typography>
      <TodayLessonsList
        error={query.isError}
        events={query.data?.events ?? []}
        isLoading={query.isLoading && Boolean(tenantId)}
        onNavigate={(href) => void navigate({ href })}
        onOpenSchedule={onOpenSchedule}
      />
    </Box>
  );
}
