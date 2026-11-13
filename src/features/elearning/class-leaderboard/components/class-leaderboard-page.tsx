import { useState } from "react";
import LeaderboardRoundedIcon from "@mui/icons-material/LeaderboardRounded";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ErgEmptyState, ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { ErgSelect } from "@/components/erg-mui/erg-form";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import { ergSegmentedTabsSx } from "@/components/erg-mui/erg-tabs";
import type { GraphQlPortal } from "@/lib/graphql-client";
import {
  classLeaderboardKeys,
  loadClassLeaderboard,
  loadLeaderboardClasses,
  setClassLeaderboardEnabled,
  type LeaderboardPeriod,
} from "@/features/elearning/class-leaderboard/api/class-leaderboard-api";
import { ClassLeaderboardTable } from "@/features/elearning/class-leaderboard/components/class-leaderboard-table";
import { TEACHER_LEADERBOARD_PERIODS, leaderboardPeriodLabel } from "@/features/elearning/class-leaderboard/leaderboard-period";

/** "Thi đua" (XP board) for Teacher (classes they teach) and Admin (every class of the tenant): view and switch on/off for students. */
export function ClassLeaderboardPage({ portal }: { portal: GraphQlPortal }) {
  const queryClient = useQueryClient();
  const [pickedClassId, setPickedClassId] = useState("");
  const [period, setPeriod] = useState<LeaderboardPeriod>("WEEK");

  const classes = useQuery({
    queryKey: classLeaderboardKeys.classes(portal),
    queryFn: ({ signal }) => loadLeaderboardClasses(portal, signal),
  });
  const classId = pickedClassId || classes.data?.[0]?.id || "";
  const board = useQuery({
    enabled: Boolean(classId),
    queryKey: classLeaderboardKeys.board(portal, classId, period),
    queryFn: ({ signal }) => loadClassLeaderboard(portal, classId, period, signal),
  });
  const enabled = classes.data?.find((item) => item.id === classId)?.leaderboardEnabled ?? true;

  const toggle = useMutation({
    mutationFn: (next: boolean) => setClassLeaderboardEnabled(portal, classId, next),
    onSuccess: async (_result, next) => {
      toast.success(next ? "Học sinh đã thấy bảng xếp hạng của lớp." : "Đã ẩn bảng xếp hạng với học sinh.");
      await queryClient.invalidateQueries({ queryKey: ["class-leaderboard", portal] });
    },
  });

  const entries = board.data?.entries ?? [];
  const loading = classes.isPending || (Boolean(classId) && board.isPending);

  return (
    <Box sx={{ maxWidth: 880, mx: "auto", px: { xs: 2, md: 0 }, py: { xs: 2, md: 3 } }}>
      <ErgPageHeader
        title="Thi đua"
        description="Xếp theo XP: mỗi bài nộp lần đầu +10–40 theo số câu, nộp trước hạn +10, chuỗi ≥ 7 ngày ×1,2. Không dùng điểm số. Học sinh chưa có XP đứng cuối, không có hạng."
      />
      {classes.data?.length ? (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" }, mb: 2 }}>
          <ErgSelect
            label="Lớp"
            onChange={(event) => setPickedClassId(String(event.target.value))}
            options={classes.data.map((item) => ({ label: item.name || item.id, value: item.id }))}
            size="small"
            sx={{ maxWidth: 360, width: "100%" }}
            value={classId}
          />
          <FormControlLabel
            control={(
              <Switch
                checked={toggle.isPending ? Boolean(toggle.variables) : enabled}
                disabled={toggle.isPending}
                onChange={(event) => toggle.mutate(event.target.checked)}
              />
            )}
            label="Hiện xếp hạng cho học sinh"
          />
        </Stack>
      ) : null}
      {classId ? (
        <Tabs aria-label="Kỳ thi đua" value={period} variant="fullWidth" onChange={(_, value: LeaderboardPeriod) => setPeriod(value)} sx={{ ...ergSegmentedTabsSx, mb: 2 }}>
          {TEACHER_LEADERBOARD_PERIODS.map((value) => <Tab key={value} value={value} label={leaderboardPeriodLabel(value)} />)}
        </Tabs>
      ) : null}
      {loading ? (
        <Stack spacing={1}>
          <ErgSkeleton height={48} />
          <ErgSkeleton height={240} />
        </Stack>
      ) : !classId ? (
        <ErgEmptyState icon={<LeaderboardRoundedIcon />} title="Chưa có lớp nào" description="Bạn chưa phụ trách lớp nào." />
      ) : entries.length ? (
        <ClassLeaderboardTable entries={entries} />
      ) : (
        <ErgEmptyState icon={<LeaderboardRoundedIcon />} title="Lớp chưa có học sinh" description="Khi lớp có học sinh, bảng xếp hạng sẽ hiện ở đây." />
      )}
    </Box>
  );
}

export function TeacherClassLeaderboardRoute() {
  return <ClassLeaderboardPage portal="lms" />;
}

export function AdminClassLeaderboardRoute() {
  return <ClassLeaderboardPage portal="lcms" />;
}
