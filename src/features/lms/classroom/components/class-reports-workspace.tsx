import { useMemo } from "react";
import BarChartIcon from "@mui/icons-material/BarChart";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

import { DashboardMetricCard } from "@/components/dashboard/dashboard-metric-card";
import { DashboardPageShell, DashboardSectionCard } from "@/components/dashboard/dashboard-page-shell";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ClassroomSnapshot, LeaderboardEntry, LeaderboardScope } from "@/domain/school/classroom-types";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { useI18n } from "@/platform/i18n";

export function ClassReportsWorkspace({
  activeLeaf,
  onOpenLeaf,
  snapshots,
  selectedClassId,
  selectedSchoolId,
}: {
  activeLeaf: DashboardLeaf;
  onOpenLeaf: (leafId: string) => void;
  snapshots: ClassroomSnapshot[];
  selectedClassId: string;
  selectedSchoolId: string;
}) {
  const { locale } = useI18n();
  const copy = locale === "vi" ? viCopy : enCopy;
  const scope: LeaderboardScope = "class";

  const schoolClasses = useMemo(() => snapshots.filter((snapshot) => snapshot.schoolId === selectedSchoolId), [selectedSchoolId, snapshots]);
  const selectedClass = schoolClasses.find((item) => item.id === selectedClassId) ?? schoolClasses[0];
  const leaderboard: LeaderboardEntry[] = [];

  const leader = leaderboard[0];
  const metricsAvailable = selectedClass?.metricsAvailable !== false && Boolean(selectedClass);
  const averageCompletion = metricsAvailable ? selectedClass?.completionRate ?? 0 : null;
  const averageScore = metricsAvailable ? selectedClass?.averageScore ?? 0 : null;
  const supportTotal = metricsAvailable ? selectedClass?.riskStudents ?? 0 : null;
  const strongestClass = selectedClass;
  const classNeedingCare = selectedClass;

  return (
    <DashboardPageShell
      badge={copy.badge}
      title={activeLeaf.title}
      description={copy.description}
      breadcrumbs={activeLeaf.breadcrumb}
      actions={
        <Button variant="outlined" onClick={() => onOpenLeaf("class-students")}>
          {copy.openJourney}
        </Button>
      }
    >
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { lg: "repeat(4, minmax(0, 1fr))" } }}>
        <DashboardMetricCard
          label={copy.metrics.completion}
          value={averageCompletion === null ? copy.noData : `${averageCompletion}%`}
          detail={copy.metrics.completionDetail}
          delta={strongestClass ? copy.metrics.strongest(strongestClass.className) : "-"}
          icon={<TrendingUpIcon fontSize="small" />}
          tone="emerald"
        />
        <DashboardMetricCard
          label={copy.metrics.score}
          value={averageScore === null ? copy.noData : `${averageScore}`}
          detail={copy.metrics.scoreDetail}
          delta={leader ? copy.metrics.leader(leader.name) : copy.noData}
          icon={<EmojiEventsIcon fontSize="small" />}
          tone="amber"
        />
        <DashboardMetricCard
          label={copy.metrics.support}
          value={supportTotal === null ? copy.noData : `${supportTotal}`}
          detail={copy.metrics.supportDetail}
          delta={classNeedingCare ? copy.metrics.watch(classNeedingCare.className) : "-"}
          icon={<BarChartIcon fontSize="small" />}
          tone="rose"
        />
        <DashboardMetricCard
          label={copy.metrics.scopeSize}
          value={`${leaderboard.length}`}
          detail={copy.metrics.scopeSizeDetail(scope)}
          delta={copy.metrics.scopeSizeDelta}
          icon={<EmojiEventsIcon fontSize="small" />}
          tone="violet"
        />
      </Box>

      <Box
        component="section"
        sx={{ display: "grid", gap: 2, gridTemplateColumns: { lg: "minmax(0, 1.25fr) minmax(340px, 0.85fr)" } }}
      >
        <DashboardSectionCard
          title={copy.leaderboardTitle}
          description={copy.leaderboardDescription}
          action={
            <Typography
              component="span"
              variant="caption"
              sx={{ border: 1, borderColor: "divider", borderRadius: 1, borderStyle: "dashed", color: "text.secondary", fontWeight: "fontWeightBold", px: 1.5, py: 1 }}
            >
              {copy.metricsUnavailable}
            </Typography>
          }
        >
          <Stack spacing={1.5}>
            {leaderboard.length ? leaderboard.map((entry, index) => (
              <LeaderboardRow key={entry.id} copy={copy} entry={entry} rank={index + 1} />
            )) : (
              <Typography
                variant="body2"
                sx={{ bgcolor: "background.default", border: 1, borderColor: "divider", borderRadius: 1, borderStyle: "dashed", color: "text.secondary", fontWeight: "fontWeightMedium", p: 3 }}
              >
                {copy.metricsUnavailable}
              </Typography>
            )}
          </Stack>
        </DashboardSectionCard>

        <Stack spacing={2}>
          <DashboardSectionCard title={copy.breakdownTitle} description={copy.breakdownDescription}>
            <Stack spacing={1.5}>
              {selectedClass ? [selectedClass].map((snapshot) => (
                <ClassBreakdown key={snapshot.id} copy={copy} snapshot={snapshot} />
              )) : null}
            </Stack>
          </DashboardSectionCard>

          <DashboardSectionCard title={copy.insightTitle} description={copy.insightDescription}>
            <Stack spacing={1.5}>
              <InsightCard title={copy.insights.publishTitle} body={copy.insights.publishBody(scope)} />
              <InsightCard
                title={copy.insights.coachTitle}
                body={classNeedingCare ? copy.insights.coachBody(classNeedingCare.className) : copy.noData}
              />
              <InsightCard
                title={copy.insights.rewardTitle}
                body={leader ? copy.insights.rewardBody(leader.name) : copy.noData}
              />
            </Stack>
          </DashboardSectionCard>
        </Stack>
      </Box>
    </DashboardPageShell>
  );
}

function LeaderboardRow({
  copy,
  entry,
  rank,
}: {
  copy: ReportCopy;
  entry: LeaderboardEntry;
  rank: number;
}) {
  return (
    <Paper component="article" variant="outlined" sx={{ borderRadius: 1, p: 2 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
        <Box
          sx={{ bgcolor: "primary.main", borderRadius: 1, color: "primary.contrastText", display: "grid", flexShrink: 0, height: 40, placeItems: "center", typography: "subtitle2", width: 40 }}
        >
          #{rank}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h5">{entry.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {entry.className} • {entry.schoolName}
          </Typography>
        </Box>
        <Chip label={entry.badge} size="small" color={rank === 1 ? "success" : "secondary"} />
      </Stack>

      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { sm: "repeat(3, minmax(0, 1fr))" }, mt: 2 }}>
        <MiniMetric label={copy.scoreLabel} value={`${entry.score}`} />
        <MiniMetric label={copy.completionLabel} value={`${entry.completionRate}%`} />
        <MiniMetric label={copy.momentumLabel} value={`+${entry.momentum}`} />
      </Box>
    </Paper>
  );
}

function ClassBreakdown({ copy, snapshot }: { copy: ReportCopy; snapshot: ClassroomSnapshot }) {
  return (
    <Paper component="article" variant="outlined" sx={{ borderRadius: 1, p: 2 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="subtitle2">{snapshot.className}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{snapshot.gradeLabel}</Typography>
        </Box>
        <Chip label={snapshot.metricsAvailable === false ? copy.noData : `${snapshot.riskStudents} ${copy.supportUnit}`} size="small" color={snapshot.metricsAvailable === false ? "default" : snapshot.riskStudents >= 5 ? "warning" : "success"} />
      </Stack>
      <Box sx={{ mt: 2 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="body2" color="text.secondary">{copy.completionLabel}</Typography>
          <Typography variant="subtitle2">{snapshot.metricsAvailable === false ? copy.noData : `${snapshot.completionRate}%`}</Typography>
        </Stack>
        {snapshot.metricsAvailable === false ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "fontWeightMedium", mt: 1 }}>{copy.metricsUnavailable}</Typography>
        ) : <LinearProgress variant="determinate" value={snapshot.completionRate} sx={{ mt: 2, height: 8, borderRadius: 1 }} />}
      </Box>
    </Paper>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ bgcolor: "background.default", borderRadius: 1, px: 1.5, py: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: "fontWeightBold" }}>{label}</Typography>
      <Typography variant="h4" sx={{ mt: 0.5 }}>{value}</Typography>
    </Box>
  );
}

function InsightCard({ body, title }: { body: string; title: string }) {
  return (
    <Box sx={{ bgcolor: "background.default", border: 1, borderColor: "divider", borderRadius: 1, p: 2 }}>
      <Typography variant="subtitle2">{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mt: 0.5 }}>{body}</Typography>
    </Box>
  );
}

type ReportCopy = typeof enCopy;

const viCopy = {
  badge: "Báo cáo & thi đua",
  description:
    "Báo cáo gom điểm, hoàn thành, tăng tốc và nhóm cần hỗ trợ thành một câu chuyện dễ hiểu để giáo viên biết nên công bố, khen thưởng hoặc kèm ai.",
  openJourney: "Xem học sinh",
  classSelectLabel: "Chọn lớp",
  noData: "Chưa có dữ liệu",
  metricsUnavailable: "Backend chưa cung cấp số liệu vận hành cho báo cáo này.",
  scope: {
    class: "Theo lớp",
    grade: "Theo khối",
    school: "Theo trường",
    cluster: "Theo cụm",
  },
  metrics: {
    completion: "Hoàn thành TB",
    completionDetail: "Mức hoàn thành trung bình của các lớp trong trường.",
    strongest: (className: string) => `${className} đang dẫn nhịp`,
    score: "Điểm TB",
    scoreDetail: "Điểm trung bình đã chấm trong phạm vi đang xem.",
    leader: (name: string) => `${name} đang dẫn đầu`,
    support: "Cần hỗ trợ",
    supportDetail: "Tổng học sinh cần can thiệp trong phạm vi đang xem.",
    watch: (className: string) => `Theo sát ${className}`,
    scopeSize: "Số dòng xếp hạng",
    scopeSizeDetail: (scope: LeaderboardScope) => `Đang xem ${scope}`,
    scopeSizeDelta: "Dùng cho công bố thi đua tuần",
  },
  leaderboardTitle: "Bảng xếp hạng có ngữ cảnh",
  leaderboardDescription: "Không chỉ là điểm cao nhất: có cả completion và momentum để xếp hạng công bằng hơn.",
  breakdownTitle: "Sức khỏe từng lớp",
  breakdownDescription: "Nhìn nhanh lớp nào đang ổn và lớp nào cần giáo viên kèm.",
  insightTitle: "Báo cáo này nói gì?",
  insightDescription: "Diễn giải ngắn để giáo viên biết hành động tiếp theo.",
  insights: {
    publishTitle: "Có thể công bố thi đua",
    publishBody: (scope: LeaderboardScope) => `Phạm vi ${scope} đã đủ dữ liệu để công bố bảng thi đua tuần.`,
    coachTitle: "Lớp cần kèm trước",
    coachBody: (className: string) => `${className} có nhiều học sinh cần hỗ trợ nhất, nên ưu tiên checkpoint ngắn.`,
    rewardTitle: "Nên khen thưởng",
    rewardBody: (name: string) => `${name} có tín hiệu dẫn đầu, phù hợp gắn huy hiệu hoặc nêu gương.`,
  },
  scoreLabel: "Điểm",
  completionLabel: "Hoàn thành",
  momentumLabel: "Tăng tốc",
  supportUnit: "cần hỗ trợ",
};

const enCopy = {
  badge: "Reports & competition",
  description:
    "A clear report that combines score, completion, momentum, and support needs so teachers know who to publish, reward, or coach.",
  openJourney: "View students",
  classSelectLabel: "Select class",
  noData: "No data yet",
  metricsUnavailable: "The backend does not expose operational metrics for this report.",
  scope: {
    class: "By class",
    grade: "By grade",
    school: "By school",
    cluster: "By cluster",
  },
  metrics: {
    completion: "Avg completion",
    completionDetail: "Average completion across classes in the selected school.",
    strongest: (className: string) => `${className} is leading rhythm`,
    score: "Avg score",
    scoreDetail: "Average graded score in the selected view.",
    leader: (name: string) => `${name} is leading`,
    support: "Need support",
    supportDetail: "Total students needing intervention in this view.",
    watch: (className: string) => `Watch ${className}`,
    scopeSize: "Ranked rows",
    scopeSizeDetail: (scope: LeaderboardScope) => `Viewing ${scope}`,
    scopeSizeDelta: "Ready for weekly competition sharing",
  },
  leaderboardTitle: "Contextual leaderboard",
  leaderboardDescription: "Not just top score: completion and momentum make the ranking easier to explain.",
  breakdownTitle: "Class health",
  breakdownDescription: "See which classes are healthy and which need coaching.",
  insightTitle: "What does this report say?",
  insightDescription: "Short interpretation so teachers know the next action.",
  insights: {
    publishTitle: "Ready to publish",
    publishBody: (scope: LeaderboardScope) => `The ${scope} view has enough data for weekly competition sharing.`,
    coachTitle: "Coach this class first",
    coachBody: (className: string) => `${className} has the highest support need and should get short checkpoints.`,
    rewardTitle: "Reward signal",
    rewardBody: (name: string) => `${name} is leading and is a good candidate for a badge or public recognition.`,
  },
  scoreLabel: "Score",
  completionLabel: "Completion",
  momentumLabel: "Momentum",
  supportUnit: "support",
};
