import { useMemo, useState } from "react";
import { BarChart3, TrendingUp, Trophy } from "lucide-react";

import {
  DashboardMetricCard,
  DashboardPageShell,
  DashboardSectionCard,
  DashboardSegmentedControl,
} from "@/components/dashboard/dashboard-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";
import {
  classroomSchools,
  getLeaderboard,
  getSchoolSnapshots,
} from "@/features/lms/classroom/api/mock-classroom-data";
import type { ClassroomSnapshot, LeaderboardEntry, LeaderboardScope } from "@/features/lms/classroom/types/classroom-types";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { useI18n } from "@/platform/i18n";

export function ClassReportsWorkspace({
  activeLeaf,
  onOpenLeaf,
  selectedClassId,
  selectedSchoolId,
}: {
  activeLeaf: DashboardLeaf;
  onOpenLeaf: (leafId: string) => void;
  selectedClassId: string;
  selectedSchoolId: string;
}) {
  const { locale } = useI18n();
  const copy = locale === "vi" ? viCopy : enCopy;
  const [scope, setScope] = useState<LeaderboardScope>("class");

  const school = classroomSchools.find((item) => item.id === selectedSchoolId) ?? classroomSchools[0];
  const schoolClasses = useMemo(() => getSchoolSnapshots(selectedSchoolId), [selectedSchoolId]);
  const selectedClass = schoolClasses.find((item) => item.id === selectedClassId) ?? schoolClasses[0];
  const leaderboard = useMemo(() => {
    const base = getLeaderboard(scope);
    if (scope === "cluster") return base;

    const bySchool = base.filter((entry) => entry.schoolName === school.name);
    if (scope === "class" && selectedClass) {
      const byClass = bySchool.filter((entry) => entry.className === selectedClass.className);
      return byClass.length ? byClass : bySchool.length ? bySchool : base;
    }
    return bySchool.length ? bySchool : base;
  }, [school.name, scope, selectedClass]);

  const leader = leaderboard[0];
  const averageCompletion = selectedClass?.completionRate ?? 0;
  const averageScore = selectedClass?.averageScore ?? 0;
  const supportTotal = selectedClass?.riskStudents ?? 0;
  const strongestClass = selectedClass;
  const classNeedingCare = selectedClass;

  return (
    <DashboardPageShell
      badge={copy.badge}
      title={activeLeaf.title}
      description={copy.description}
      breadcrumbs={activeLeaf.breadcrumb}
      actions={
        <Button variant="outline" onClick={() => onOpenLeaf("class-students")}>
          {copy.openJourney}
        </Button>
      }
    >
      <div className="grid gap-4 xl:grid-cols-4">
        <DashboardMetricCard
          label={copy.metrics.completion}
          value={`${averageCompletion}%`}
          detail={copy.metrics.completionDetail}
          delta={strongestClass ? copy.metrics.strongest(strongestClass.className) : "-"}
          icon={<TrendingUp className="h-4 w-4" />}
          tone="emerald"
        />
        <DashboardMetricCard
          label={copy.metrics.score}
          value={`${averageScore}`}
          detail={copy.metrics.scoreDetail}
          delta={leader ? copy.metrics.leader(leader.name) : copy.noData}
          icon={<Trophy className="h-4 w-4" />}
          tone="amber"
        />
        <DashboardMetricCard
          label={copy.metrics.support}
          value={`${supportTotal}`}
          detail={copy.metrics.supportDetail}
          delta={classNeedingCare ? copy.metrics.watch(classNeedingCare.className) : "-"}
          icon={<BarChart3 className="h-4 w-4" />}
          tone="rose"
        />
        <DashboardMetricCard
          label={copy.metrics.scopeSize}
          value={`${leaderboard.length}`}
          detail={copy.metrics.scopeSizeDetail(scope)}
          delta={copy.metrics.scopeSizeDelta}
          icon={<Trophy className="h-4 w-4" />}
          tone="violet"
        />
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.85fr)]">
        <DashboardSectionCard
          title={copy.leaderboardTitle}
          description={copy.leaderboardDescription}
          action={
            <DashboardSegmentedControl
              options={[
                { value: "class", label: copy.scope.class },
                { value: "grade", label: copy.scope.grade },
                { value: "school", label: copy.scope.school },
                { value: "cluster", label: copy.scope.cluster },
              ]}
              value={scope}
              onChange={(value) => setScope(value as LeaderboardScope)}
            />
          }
        >
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <LeaderboardRow key={entry.id} copy={copy} entry={entry} rank={index + 1} />
            ))}
          </div>
        </DashboardSectionCard>

        <div className="space-y-4">
          <DashboardSectionCard title={copy.breakdownTitle} description={copy.breakdownDescription}>
            <div className="space-y-3">
              {selectedClass ? [selectedClass].map((snapshot) => (
                <ClassBreakdown key={snapshot.id} copy={copy} snapshot={snapshot} />
              )) : null}
            </div>
          </DashboardSectionCard>

          <DashboardSectionCard title={copy.insightTitle} description={copy.insightDescription}>
            <div className="space-y-3">
              <InsightCard title={copy.insights.publishTitle} body={copy.insights.publishBody(scope)} />
              <InsightCard
                title={copy.insights.coachTitle}
                body={classNeedingCare ? copy.insights.coachBody(classNeedingCare.className) : copy.noData}
              />
              <InsightCard
                title={copy.insights.rewardTitle}
                body={leader ? copy.insights.rewardBody(leader.name) : copy.noData}
              />
            </div>
          </DashboardSectionCard>
        </div>
      </section>
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
    <article className="rounded-lg border border-[#cbd7e6] bg-white p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--erg-blue)] text-sm font-semibold text-white">
          #{rank}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold text-slate-950">{entry.name}</div>
          <div className="mt-1 text-sm text-slate-500">
            {entry.className} • {entry.schoolName}
          </div>
        </div>
        <Badge tone={rank === 1 ? "success" : "secondary"}>{entry.badge}</Badge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MiniMetric label={copy.scoreLabel} value={`${entry.score}`} />
        <MiniMetric label={copy.completionLabel} value={`${entry.completionRate}%`} />
        <MiniMetric label={copy.momentumLabel} value={`+${entry.momentum}`} />
      </div>
    </article>
  );
}

function ClassBreakdown({ copy, snapshot }: { copy: ReportCopy; snapshot: ClassroomSnapshot }) {
  return (
    <article className="rounded-lg border border-[#cbd7e6] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-950">{snapshot.className}</div>
          <div className="mt-1 text-sm text-slate-500">{snapshot.gradeLabel}</div>
        </div>
        <Badge tone={snapshot.riskStudents >= 5 ? "warning" : "success"}>
          {snapshot.riskStudents} {copy.supportUnit}
        </Badge>
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">{copy.completionLabel}</span>
          <span className="font-semibold text-slate-950">{snapshot.completionRate}%</span>
        </div>
        <ProgressBar
          className="mt-2 h-2 bg-slate-100"
          indicatorClassName={snapshot.completionRate >= 88 ? "bg-emerald-500" : "bg-amber-500"}
          value={snapshot.completionRate}
        />
      </div>
    </article>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#f8fbff] px-3 py-2">
      <div className="text-[13px] font-bold text-slate-600">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function InsightCard({ body, title }: { body: string; title: string }) {
  return (
    <div className="rounded-lg border border-[#cbd7e6] bg-[#f8fbff] p-4">
      <div className="text-sm font-semibold text-slate-950">{title}</div>
      <div className="mt-1 text-sm leading-6 text-slate-500">{body}</div>
    </div>
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
