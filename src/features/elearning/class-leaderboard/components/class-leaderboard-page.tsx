import { useContext, useState } from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LeaderboardRoundedIcon from "@mui/icons-material/LeaderboardRounded";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ErgEmptyState, ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { ErgSelect } from "@/components/erg-mui/erg-form";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import { ergSegmentedTabsSx } from "@/components/erg-mui/erg-tabs";
import { LmsTeacherShellContext } from "@/features/lms/components/lms-teacher-shell-context";
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
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const t = ergEnterpriseTokens;
const RULE = "Mỗi bài nộp lần đầu +10–40 XP theo số câu, nộp trước hạn +10, chuỗi ≥ 7 ngày ×1,2. Không dùng điểm số. Học sinh chưa có XP đứng cuối, không có hạng.";

/**
 * "Thi đua" (XP board) for Teacher (classes of the selected school) and Admin (every class of the tenant): view and switch on/off for students.
 * Inside the teacher shell only classes of the selected school are offered; without a shell (admin) every class is.
 */
export function ClassLeaderboardPage({ portal }: { portal: GraphQlPortal }) {
  const queryClient = useQueryClient();
  const shell = useContext(LmsTeacherShellContext);
  const schoolId = shell?.selectedSchoolId ?? "";
  const [picked, setPicked] = useState({ schoolId, classId: "" });
  const pickedClassId = picked.schoolId === schoolId ? picked.classId : "";
  const [period, setPeriod] = useState<LeaderboardPeriod>("WEEK");

  const allClasses = useQuery({
    queryKey: classLeaderboardKeys.classes(portal, schoolId),
    queryFn: ({ signal }) => loadLeaderboardClasses(portal, signal),
  });
  const inSchool = schoolId && shell ? new Set(shell.classes.filter((item) => item.schoolId === schoolId).map((item) => item.id)) : null;
  const classes = inSchool ? allClasses.data?.filter((item) => inSchool.has(item.id)) : allClasses.data;
  const classId = classes?.some((item) => item.id === pickedClassId) ? pickedClassId : classes?.[0]?.id || "";
  const board = useQuery({
    enabled: Boolean(classId),
    queryKey: classLeaderboardKeys.board(portal, classId, period, schoolId),
    queryFn: ({ signal }) => loadClassLeaderboard(portal, classId, period, signal),
  });
  const enabled = classes?.find((item) => item.id === classId)?.leaderboardEnabled ?? true;

  const toggle = useMutation({
    mutationFn: (next: boolean) => setClassLeaderboardEnabled(portal, classId, next),
    onSuccess: async (_result, next) => {
      toast.success(next ? "Học sinh đã thấy bảng xếp hạng của lớp." : "Đã ẩn bảng xếp hạng với học sinh.");
      await queryClient.invalidateQueries({ queryKey: ["class-leaderboard", portal] });
    },
  });

  const entries = board.data?.entries ?? [];
  const loading = allClasses.isPending || (Boolean(classId) && board.isPending);

  return (
    <Box sx={{ maxWidth: 1040, mx: "auto", px: { xs: 2, md: 0 }, py: { xs: 2, md: 3 } }}>
      <ErgPageHeader
        title="Thi đua"
        description={(
          <Box component="span" sx={{ alignItems: "center", display: "inline-flex", gap: 0.5 }}>
            Xếp theo XP của học sinh, không dùng điểm số.
            <Tooltip title={RULE}>
              <IconButton aria-label="Cách tính XP" size="small"><InfoOutlinedIcon fontSize="small" /></IconButton>
            </Tooltip>
          </Box>
        )}
      />
      {classes?.length ? (
        <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: t.color.divider, borderRadius: `${t.radius.card}px`, mb: 2, p: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" } }}>
            <ErgSelect
              label="Lớp"
              onChange={(event) => setPicked({ schoolId, classId: String(event.target.value) })}
              options={classes.map((item) => ({ label: item.name || item.id, value: item.id }))}
              size="small"
              sx={{ maxWidth: 320, width: "100%" }}
              value={classId}
            />
            <Tabs aria-label="Kỳ thi đua" value={period} onChange={(_, value: LeaderboardPeriod) => setPeriod(value)} sx={ergSegmentedTabsSx}>
              {TEACHER_LEADERBOARD_PERIODS.map((value) => <Tab key={value} value={value} label={leaderboardPeriodLabel(value)} />)}
            </Tabs>
            <FormControlLabel
              control={(
                <Switch
                  checked={toggle.isPending ? Boolean(toggle.variables) : enabled}
                  disabled={toggle.isPending}
                  onChange={(event) => toggle.mutate(event.target.checked)}
                />
              )}
              label="Hiện xếp hạng cho học sinh"
              sx={{ ml: { md: "auto" }, mr: 0 }}
            />
          </Stack>
        </Box>
      ) : null}
      {loading ? (
        <Stack spacing={1}>
          <ErgSkeleton height={48} />
          <ErgSkeleton height={240} />
        </Stack>
      ) : !classId ? (
        <ErgEmptyState icon={<LeaderboardRoundedIcon />} title="Chưa có lớp nào" description="Bạn chưa phụ trách lớp nào." />
      ) : entries.length ? (
        <Stack spacing={1.5}>
          <ClassLeaderboardTable entries={entries} />
          {entries.some((entry) => entry.tierKey) ? null : (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>Chưa có học sinh nào được xếp bậc — bậc được cập nhật mỗi thứ Hai.</Typography>
          )}
        </Stack>
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
