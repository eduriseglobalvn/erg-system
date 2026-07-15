import type { CSSProperties, ReactNode } from "react";
import {
  Award,
  BookOpenCheck,
  Clock3,
  FileText,
  GraduationCap,
  Layers3,
  PenLine,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";

import type { Question, Quiz } from "@/lib/types";

export type QuizWelcomeMeta = {
  authorName?: string;
  subjectLabel?: string;
  reviewContent?: string;
  courseLabel?: string;
  focusNote?: string;
  dueLabel?: string;
  audienceLabel?: string;
  estimatedMinutes?: number;
  learningOutcomes?: string[];
  topics?: string[];
};

type QuizWelcomeScreenProps = {
  quiz: Quiz;
  questions: Question[];
  answeredCount: number;
  restoredDraft: boolean;
  isTrainingMode: boolean;
  isTestingMode: boolean;
  playerViewportClass: string;
  playerCardStyle: CSSProperties;
  canvasStyle: CSSProperties;
  modeBadgeStyle: CSSProperties;
  accentButtonStyle: CSSProperties;
  navButtonClass: string;
  welcomeMeta?: QuizWelcomeMeta;
  onStart: () => void;
};

const ERG_LOGO_URL = "https://media.erg.edu.vn/logo/erg.png";

export function QuizWelcomeScreen({
  quiz,
  questions,
  answeredCount,
  restoredDraft,
  isTrainingMode,
  isTestingMode,
  playerViewportClass,
  playerCardStyle,
  canvasStyle,
  modeBadgeStyle,
  accentButtonStyle,
  navButtonClass,
  welcomeMeta,
  onStart,
}: QuizWelcomeScreenProps) {
  const progressPercent = Math.round((answeredCount / Math.max(questions.length, 1)) * 100);
  const remainingCount = Math.max(questions.length - answeredCount, 0);
  const authorName = welcomeMeta?.authorName?.trim() || "Đội ngũ ERG";
  const subjectLabel = welcomeMeta?.subjectLabel?.trim() || quiz.subtitle;
  const reviewContent = welcomeMeta?.reviewContent?.trim() || quiz.description;
  const courseLabel = welcomeMeta?.courseLabel?.trim() || quiz.title;
  const focusNote =
    welcomeMeta?.focusNote?.trim() ||
    (isTrainingMode
      ? "Luyện chắc từng dạng câu hỏi, lưu tiến độ và rà soát trước khi nộp."
      : "Hoàn thành bài làm trong một lượt, kiểm tra kỹ trước khi nộp.");
  const estimatedMinutes = welcomeMeta?.estimatedMinutes ?? Math.max(8, questions.length * (isTestingMode ? 2 : 1));
  const topics = (welcomeMeta?.topics?.filter(Boolean) ?? quiz.sections.map((section) => section.title).filter(Boolean)).slice(0, 4);
  const learningOutcomes = (
    welcomeMeta?.learningOutcomes?.filter(Boolean) ?? [
      "Nắm lại kiến thức trọng tâm của bài học",
      "Luyện thao tác trả lời trên hệ thống",
      "Rà soát tiến độ trước khi nộp bài",
    ]
  ).slice(0, 3);
  const authorInitial = authorName.charAt(0).toUpperCase();

  return (
    <section
      className={`relative flex flex-col overflow-hidden rounded-2xl border p-2 shadow-[0_24px_70px_rgba(28,37,46,0.10)] ${playerViewportClass}`}
      style={{
        ...playerCardStyle,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.52)), radial-gradient(120% 88% at 0% 0%, rgba(0,0,136,0.10) 0%, rgba(0,0,136,0.035) 32%, transparent 62%), radial-gradient(86% 70% at 96% 12%, rgba(232,40,40,0.09) 0%, rgba(232,40,40,0.025) 34%, transparent 64%)",
        borderColor: "rgba(0,0,136,0.10)",
        boxShadow: "0 24px 70px rgba(0,0,136,0.08)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        style={{ background: "linear-gradient(180deg, rgba(0,0,136,0.07), rgba(0,0,136,0))" }}
      />

      <div className="relative flex min-h-8 items-center justify-between gap-2 px-3 pb-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2 font-bold text-[#000088]">
          <BookOpenCheck className="h-4 w-4 text-[#e82828]" />
          Màn chào bài làm
        </span>
        <span className="inline-flex items-center gap-2 rounded-lg border border-[rgba(34,197,94,0.16)] bg-[rgba(34,197,94,0.12)] px-3 py-1 text-xs font-bold text-[#118D57] shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
          {isTrainingMode ? "Luyện tập" : "Kiểm tra"}
        </span>
      </div>

      <div
        className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border"
        style={{
          ...canvasStyle,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.86) 0%, rgba(255,255,255,0.68) 48%, rgba(246,247,255,0.58) 100%), radial-gradient(90% 80% at 14% 18%, rgba(0,0,136,0.08) 0%, transparent 58%), radial-gradient(80% 70% at 86% 18%, rgba(232,40,40,0.075) 0%, transparent 58%)",
          borderColor: "rgba(0,0,136,0.10)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.84)",
        }}
      >
        <img
          src={ERG_LOGO_URL}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-7 top-7 h-auto w-[128px] opacity-[0.08]"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.68) 46%, rgba(255,255,255,0.12) 62%, transparent 100%)",
          }}
        />

        <div className="relative grid h-full overflow-auto gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(390px,1fr)_minmax(340px,0.82fr)]">
          <div className="flex flex-col justify-center gap-4 lg:pl-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-lg border border-[rgba(0,0,136,0.12)] bg-white/62 px-3 py-1.5 text-xs font-bold text-[#000088] shadow-sm backdrop-blur-xl">
                <Sparkles className="h-3.5 w-3.5" />
                {subjectLabel}
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg border border-[rgba(232,40,40,0.12)] bg-white/58 px-3 py-1.5 text-xs font-bold text-[#5d6683] shadow-sm backdrop-blur-xl">
                <Layers3 className="h-3.5 w-3.5 text-[#e82828]" />
                {questions.length} câu hỏi
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg border border-[rgba(0,0,136,0.10)] bg-white/58 px-3 py-1.5 text-xs font-bold text-[#5d6683] shadow-sm backdrop-blur-xl">
                <Clock3 className="h-3.5 w-3.5 text-[#000088]" />
                Khoảng {estimatedMinutes} phút
              </span>
            </div>

            <div className="grid gap-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[rgba(232,40,40,0.16)] bg-[rgba(232,40,40,0.08)] px-3 py-1 text-[11px] font-extrabold uppercase text-[#b91c1c]">
                <GraduationCap className="h-3.5 w-3.5" />
                {courseLabel}
              </div>
              <h1 className="max-w-[760px] text-3xl font-extrabold leading-tight text-[#000088] sm:text-[38px]">
                {quiz.title}
              </h1>
              <p className="max-w-[700px] text-[15px] font-semibold leading-7 text-[#40516A]">
                {focusNote}
              </p>
            </div>

            <div className="grid max-w-[790px] gap-3 sm:grid-cols-[1fr_1.25fr]">
              <div className="rounded-2xl border border-[rgba(0,0,136,0.10)] bg-white/66 p-4 shadow-[0_16px_34px_rgba(0,0,136,0.06)] backdrop-blur-xl">
                <div className="mb-3 flex items-center gap-3">
                  <span className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-[#000088] text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(0,0,136,0.18)]">
                    {authorInitial}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[11px] font-extrabold uppercase text-[#637381]">Tác giả / giáo viên</div>
                    <div className="truncate text-base font-extrabold text-[#000088]">{authorName}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-[rgba(0,0,136,0.07)] px-2.5 py-1 text-xs font-bold text-[#000088]">
                    <UserRound className="h-3.5 w-3.5" />
                    {welcomeMeta?.audienceLabel || "Học viên ERG"}
                  </span>
                  {welcomeMeta?.dueLabel ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[rgba(232,40,40,0.08)] px-2.5 py-1 text-xs font-bold text-[#b91c1c]">
                      <Clock3 className="h-3.5 w-3.5" />
                      {welcomeMeta.dueLabel}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-[rgba(0,0,136,0.10)] bg-white/66 p-4 shadow-[0_16px_34px_rgba(0,0,136,0.06)] backdrop-blur-xl">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase text-[#637381]">
                  <FileText className="h-3.5 w-3.5 text-[#e82828]" />
                  Nội dung ôn tập
                </div>
                <p className="line-clamp-3 text-sm font-semibold leading-6 text-[#40516A]">{reviewContent}</p>
              </div>
            </div>

            <div className="grid max-w-[790px] gap-3 sm:grid-cols-3">
              <IntroMetric icon={<Award className="h-4 w-4" />} label="Tiến độ" value={`${answeredCount}/${questions.length}`} />
              <IntroMetric icon={<Clock3 className="h-4 w-4" />} label="Chế độ" value={isTrainingMode ? "Luyện tập" : "Kiểm tra"} />
              <IntroMetric icon={<BookOpenCheck className="h-4 w-4" />} label="Phiên bản" value={`v${quiz.version}`} />
            </div>

            {restoredDraft ? (
              <div className="max-w-[790px] overflow-hidden rounded-xl border border-[rgba(255,171,0,0.32)] bg-[rgba(255,248,225,0.92)] shadow-[0_14px_34px_rgba(176,111,0,0.08)]">
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-[rgba(255,171,0,0.16)] text-[#B76E00]">
                    <Clock3 className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-[#8A4B00]">
                      Đã khôi phục bản nháp: {answeredCount}/{questions.length} câu đã trả lời
                    </div>
                    <div className="text-xs font-semibold text-[#9A6B18]">
                      Tiếp tục để giữ mạch làm bài từ thiết bị này.
                    </div>
                  </div>
                </div>
                <div className="h-1 bg-[rgba(255,171,0,0.14)]">
                  <div className="h-full rounded-r-full bg-[#FFAB00]" style={{ width: `${Math.max(4, progressPercent)}%` }} />
                </div>
              </div>
            ) : null}
          </div>

          <div
            className="relative min-h-[430px] overflow-hidden rounded-2xl p-5 text-white shadow-[0_24px_70px_rgba(0,0,136,0.22)]"
            style={{
              background: "linear-gradient(145deg, rgba(0,0,136,0.90) 0%, rgba(0,0,136,0.98) 48%, rgba(5,11,84,1) 100%)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(120deg, rgba(255,255,255,0.16), rgba(255,255,255,0.03) 34%, transparent 48%), radial-gradient(70% 55% at 100% 0%, rgba(232,40,40,0.30), transparent 54%), repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 48px), repeating-linear-gradient(0deg, rgba(255,255,255,0.045) 0 1px, transparent 1px 48px)",
              }}
            />
            <img
              src={ERG_LOGO_URL}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute right-5 top-5 h-auto w-[116px] opacity-20"
            />
            <div className="relative z-10 flex h-full flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <div className="rounded-2xl border border-white/24 bg-white/92 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.16)] backdrop-blur">
                  <span className="text-xs font-extrabold" style={{ color: "#000088" }}>
                    {isTrainingMode ? "LUYỆN TẬP" : "KIỂM TRA"}
                  </span>
                  <strong className="mt-1 block text-2xl font-extrabold leading-tight" style={{ color: "#e82828" }}>
                    {isTrainingMode ? "Học chắc từng bước" : "Sẵn sàng đánh giá"}
                  </strong>
                  <span className="mt-2 block text-sm font-bold text-[#637381]">Phiên bản {quiz.version}</span>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-[#e82828]/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
              </div>

              <div className="rounded-2xl border border-white/18 bg-white/12 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur">
                <div className="mb-3 flex items-center justify-between text-sm font-bold text-white/92">
                  <span>Tiến độ phiên học</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/18">
                  <div
                    className="h-full rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.65)]"
                    style={{ width: `${Math.max(5, progressPercent)}%` }}
                  />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <CoverStat label="Đã làm" value={`${answeredCount}`} />
                  <CoverStat label="Còn lại" value={`${remainingCount}`} />
                  <CoverStat label="Tổng" value={`${questions.length}`} />
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center gap-2 text-sm font-extrabold text-white">
                  <Target className="h-4 w-4 text-white/82" />
                  Mục tiêu ôn tập
                </div>
                <div className="grid gap-2">
                  {learningOutcomes.map((item) => (
                    <div key={item} className="flex items-start gap-2 rounded-xl border border-white/14 bg-white/10 px-3 py-2 text-sm font-semibold text-white/86">
                      <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-[#e82828]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto grid gap-4">
                {topics.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {topics.map((topic) => (
                      <span key={topic} className="inline-flex items-center rounded-lg border border-white/16 bg-white/10 px-2.5 py-1 text-xs font-bold text-white/82">
                        {topic}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="flex items-center justify-between border-t border-white/24 pt-4 text-sm font-extrabold text-white">
                  <span>{questions.length} câu hỏi</span>
                  <span>{isTestingMode ? "Chấm điểm cuối bài" : "Luyện theo tiến độ"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex min-h-10 items-center justify-between gap-2 px-2 pt-2">
        <span className="line-clamp-1 text-xs font-semibold text-[#637381]">
          {isTrainingMode ? "Luyện tập: câu trả lời được lưu trên thiết bị cho đến khi nộp bài." : "Kiểm tra: hoàn tất rồi nộp để chấm điểm."}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="hidden items-center rounded-lg px-3 py-1.5 text-xs font-bold sm:inline-flex" style={modeBadgeStyle}>
            {isTrainingMode ? "Chế độ luyện tập" : "Chế độ kiểm tra"}
          </span>
          <button className={`${navButtonClass} min-w-[128px] px-5`} style={accentButtonStyle} type="button" onClick={onStart}>
            <PenLine className="h-4 w-4" />
            {restoredDraft ? "TIẾP TỤC" : "BẮT ĐẦU"}
          </button>
        </div>
      </div>
    </section>
  );
}

function IntroMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[rgba(0,0,136,0.10)] bg-white/58 p-4 shadow-[0_16px_34px_rgba(0,0,136,0.06)] backdrop-blur-xl">
      <div className="mb-3 inline-grid h-9 w-9 place-items-center rounded-xl border border-[rgba(232,40,40,0.10)] bg-[rgba(0,0,136,0.07)] text-[#000088]">
        {icon}
      </div>
      <div className="text-[11px] font-extrabold uppercase text-[#6b7280]">{label}</div>
      <div className="mt-1 text-lg font-extrabold text-[#000088]">{value}</div>
    </div>
  );
}

function CoverStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/18 bg-white/10 px-3 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur">
      <div className="text-[11px] font-bold text-white/70">{label}</div>
      <div className="mt-1 text-xl font-extrabold text-white">{value}</div>
    </div>
  );
}
