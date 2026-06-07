import { useMemo, useState } from "react";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";

import {
  DashboardMetricCard,
  DashboardPageShell,
  DashboardSectionCard,
  DashboardSegmentedControl,
} from "@/components/dashboard/dashboard-page-shell";
import { Badge, Button, ProgressBar } from "@/components/ui/dashboard-kit";
import {
  classroomSchools,
  classroomStudents,
  defaultClassId,
  defaultStudentId,
  getLearnerJourney,
  getSchoolSnapshots,
} from "@/features/lms/classroom/api/mock-classroom-data";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { useI18n } from "@/platform/i18n";
import { cn } from "@/lib/utils";
import { AppSelect } from "@/components/ui/app-select";

export function StudentJourneyWorkspace({
  activeLeaf,
  allowedSchoolIds,
  onOpenLeaf,
  onSelectSchool,
  selectedSchoolId,
}: {
  activeLeaf: DashboardLeaf;
  allowedSchoolIds: string[];
  onOpenLeaf: (leafId: string) => void;
  onSelectSchool: (schoolId: string) => void;
  selectedSchoolId: string;
}) {
  const { locale } = useI18n();
  const copy = locale === "vi" ? viCopy : enCopy;
  const [classId, setClassId] = useState(defaultClassId);
  const [studentId, setStudentId] = useState(defaultStudentId);

  const schoolClasses = useMemo(() => getSchoolSnapshots(selectedSchoolId), [selectedSchoolId]);
  const selectedClass = schoolClasses.find((item) => item.id === classId) ?? schoolClasses[0];
  const students = useMemo(
    () => classroomStudents.filter((student) => student.schoolId === selectedSchoolId && student.classId === selectedClass?.id),
    [selectedClass?.id, selectedSchoolId],
  );
  const student = students.find((item) => item.id === studentId) ?? students[0] ?? classroomStudents[0];
  const journey = useMemo(() => getLearnerJourney(student?.id ?? defaultStudentId), [student?.id]);

  return (
    <DashboardPageShell
      badge={copy.badge}
      title={activeLeaf.title}
      description={copy.description}
      breadcrumbs={activeLeaf.breadcrumb}
      actions={
        <>
          <DashboardSegmentedControl
            options={classroomSchools.map((item) => ({
              value: item.id,
              label: allowedSchoolIds.includes(item.id) ? item.name : `${item.name} (403)`,
            }))}
            value={selectedSchoolId}
            onChange={(schoolId) => {
              onSelectSchool(schoolId);
              setStudentId("");
            }}
          />
          <SelectControl
            ariaLabel={copy.classSelectLabel}
            options={schoolClasses.map((item) => ({ value: item.id, label: item.className }))}
            value={selectedClass?.id ?? ""}
            onChange={(value) => {
              setClassId(value);
              setStudentId("");
            }}
          />
          <SelectControl
            ariaLabel={copy.studentSelectLabel}
            options={students.map((item) => ({ value: item.id, label: item.name }))}
            value={student?.id ?? ""}
            onChange={setStudentId}
          />
          <Button variant="outline" onClick={() => onOpenLeaf("class-reports")}>
            {copy.openReports}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-4">
        <DashboardMetricCard
          label={copy.metrics.currentStudent}
          value={student?.name ?? "-"}
          detail={`${student?.className ?? "-"} • ${student?.schoolName ?? "-"}`}
          delta={copy.currentMeaning(student?.status ?? "steady")}
          icon={<RouteOutlinedIcon fontSize="inherit" />}
        />
        <DashboardMetricCard
          label={copy.metrics.progress}
          value={`${student?.progressRate ?? 0}%`}
          detail={copy.metrics.progressDetail}
          delta={copy.progressMeaning(student?.progressRate ?? 0)}
          icon={<TimelineOutlinedIcon fontSize="inherit" />}
          tone="emerald"
        />
        <DashboardMetricCard
          label={copy.metrics.score}
          value={`${student?.averageScore ?? 0}`}
          detail={copy.metrics.scoreDetail}
          delta={copy.scoreMeaning(student?.averageScore ?? 0)}
          icon={<FlagOutlinedIcon fontSize="inherit" />}
          tone="amber"
        />
        <DashboardMetricCard
          label={copy.metrics.currentWork}
          value={student?.currentAssignment ?? "-"}
          detail={student?.currentStage ?? "-"}
          delta={copy.metrics.currentWorkDelta}
          icon={<RouteOutlinedIcon fontSize="inherit" />}
          tone="blue"
        />
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <DashboardSectionCard title={copy.meaningTitle} description={copy.meaningDescription}>
          <div className="grid gap-3">
            <MeaningCard title={copy.meaning.nowTitle} body={copy.meaning.nowBody(student?.currentStage ?? "-")} />
            <MeaningCard title={copy.meaning.riskTitle} body={copy.meaning.riskBody(student?.status ?? "steady")} />
            <MeaningCard title={copy.meaning.nextTitle} body={journey?.mentorNote ?? copy.emptyNote} />
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard title={copy.strengthTitle} description={copy.strengthDescription}>
          <div className="space-y-4">
            {journey?.strengths.map((strength) => (
              <div key={strength.label} className="rounded-lg border border-[#e0e4ea] bg-[#fafbfc] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-950">{strength.label}</div>
                  <div className="text-sm font-semibold text-slate-900">{strength.value}%</div>
                </div>
                <ProgressBar value={strength.value} className="mt-3 h-2 bg-white" indicatorClassName="bg-[var(--erg-blue)]" />
              </div>
            ))}
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard title={copy.timelineTitle} description={copy.timelineDescription}>
          <div className="space-y-3">
            {journey?.milestones.map((milestone) => (
              <div key={milestone.id} className="flex gap-4 rounded-lg border border-[#e0e4ea] bg-white p-4">
                <div className="relative flex w-9 shrink-0 justify-center">
                  <span
                    className={cn(
                      "mt-1 block h-4 w-4 rounded-full",
                      milestone.state === "done"
                        ? "bg-emerald-500"
                        : milestone.state === "current"
                          ? "bg-[var(--erg-blue)]"
                          : "bg-slate-300",
                    )}
                  />
                  <span className="absolute top-5 h-[calc(100%-8px)] w-px bg-slate-200" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-slate-950">{milestone.title}</div>
                    <Badge tone={milestone.state === "done" ? "success" : milestone.state === "current" ? "secondary" : "outline"}>
                      {copy.milestoneState[milestone.state]}
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm leading-6 text-slate-500">{milestone.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard title={copy.focusTitle} description={copy.focusDescription}>
          <div className="flex flex-wrap gap-2">
            {journey?.focusAreas.map((area) => (
              <span key={area} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                {area}
              </span>
            ))}
          </div>
        </DashboardSectionCard>
      </section>
    </DashboardPageShell>
  );
}

function SelectControl({
  ariaLabel,
  onChange,
  options,
  value,
}: {
  ariaLabel: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  value: string;
}) {
  return (
    <AppSelect
      aria-label={ariaLabel}
      className="h-9 min-w-[150px] rounded-md border border-[#d1d1d1] bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </AppSelect>
  );
}

function MeaningCard({ body, title }: { body: string; title: string }) {
  return (
    <article className="rounded-lg border border-[#e0e4ea] bg-[#fafbfc] p-4">
      <div className="text-sm font-semibold text-slate-950">{title}</div>
      <div className="mt-1 text-sm leading-6 text-slate-500">{body}</div>
    </article>
  );
}

const viCopy = {
  badge: "Hành trình học viên",
  description:
    "Trang này trả lời 3 câu hỏi: học sinh đang ở đâu, điều đó có ý nghĩa gì, và giáo viên nên làm gì tiếp theo.",
  openReports: "Báo cáo thi đua",
  emptyNote: "Chưa có ghi chú",
  classSelectLabel: "Chọn lớp",
  studentSelectLabel: "Chọn học sinh",
  metrics: {
    currentStudent: "Học sinh",
    progress: "Tiến độ hiện tại",
    progressDetail: "Theo bài đang học gần nhất.",
    score: "Điểm trung bình",
    scoreDetail: "Theo các bài đã hoàn thành gần đây.",
    currentWork: "Bài đang làm",
    currentWorkDelta: "Dùng để follow ngay trong lớp",
  },
  currentMeaning: (status: string) =>
    status === "support" ? "Đang có dấu hiệu cần kèm sát" : status === "ahead" ? "Có thể giao thêm thử thách" : "Nhịp học ổn định",
  progressMeaning: (progress: number) =>
    progress === 0 ? "Cần nhắc mở bài" : progress < 60 ? "Cần checkpoint ngắn" : progress < 100 ? "Đang đi đúng hướng" : "Đã hoàn thành",
  scoreMeaning: (score: number) => (score >= 90 ? "Năng lực tốt" : score >= 75 ? "Ổn, cần giữ nhịp" : "Cần củng cố nền"),
  meaningTitle: "Hành trình này nói lên điều gì?",
  meaningDescription: "Diễn giải dữ liệu thành hành động thay vì chỉ hiển thị số.",
  meaning: {
    nowTitle: "Hiện tại",
    nowBody: (stage: string) => `Học sinh đang ở trạng thái: ${stage}.`,
    riskTitle: "Rủi ro",
    riskBody: (status: string) =>
      status === "support" ? "Nếu không can thiệp, học sinh dễ trễ hạn hoặc mất nhịp học." : "Chưa có rủi ro lớn, nên duy trì nhịp hiện tại.",
    nextTitle: "Hành động tiếp theo",
  },
  strengthTitle: "Bản đồ năng lực",
  strengthDescription: "Các trụ cột đang mạnh để giao bài hoặc thử thách phù hợp.",
  timelineTitle: "Mốc phát triển",
  timelineDescription: "Đã đạt, đang theo đuổi và mục tiêu kế tiếp.",
  focusTitle: "Điểm cần kéo tiếp",
  focusDescription: "Những vùng giáo viên nên ưu tiên trong lần giao bài tiếp theo.",
  milestoneState: {
    done: "Đã đạt",
    current: "Đang làm",
    next: "Tiếp theo",
  },
};

const enCopy = {
  badge: "Learner journey",
  description:
    "This page answers three questions: where the learner is, what it means, and what the teacher should do next.",
  openReports: "Competition report",
  emptyNote: "No note yet",
  classSelectLabel: "Select class",
  studentSelectLabel: "Select student",
  metrics: {
    currentStudent: "Learner",
    progress: "Current progress",
    progressDetail: "Based on the latest live assignment.",
    score: "Average score",
    scoreDetail: "Based on recent completed work.",
    currentWork: "Current assignment",
    currentWorkDelta: "Useful for in-class follow-up",
  },
  currentMeaning: (status: string) =>
    status === "support" ? "Needs closer coaching" : status === "ahead" ? "Ready for a richer challenge" : "Learning rhythm is stable",
  progressMeaning: (progress: number) =>
    progress === 0 ? "Needs an opening reminder" : progress < 60 ? "Needs a short checkpoint" : progress < 100 ? "Moving correctly" : "Completed",
  scoreMeaning: (score: number) => (score >= 90 ? "Strong mastery" : score >= 75 ? "Stable, keep rhythm" : "Needs foundation work"),
  meaningTitle: "What does this journey say?",
  meaningDescription: "Turns raw data into teacher action.",
  meaning: {
    nowTitle: "Current state",
    nowBody: (stage: string) => `The learner is currently at: ${stage}.`,
    riskTitle: "Risk",
    riskBody: (status: string) =>
      status === "support" ? "Without intervention, the learner may miss deadlines or lose rhythm." : "No major risk; protect the current rhythm.",
    nextTitle: "Next action",
  },
  strengthTitle: "Strength map",
  strengthDescription: "Strong pillars that can guide richer work and better assignments.",
  timelineTitle: "Growth milestones",
  timelineDescription: "What is done, what is current, and what comes next.",
  focusTitle: "Focus areas",
  focusDescription: "Areas to prioritize in the next assignment cycle.",
  milestoneState: {
    done: "Done",
    current: "Current",
    next: "Next",
  },
};
