import { useMemo, useState } from "react";
import { BookOpenCheck, Clock3, Copy, Eye, FileQuestion, Filter, ListChecks, Plus, Search, Send } from "lucide-react";

import { Badge, Button, Input } from "@/components/ui/dashboard-kit";
import { cn } from "@/lib/utils";
import { AppSelect } from "@/components/ui/app-select";
import { useLmsMobileBreakpoint } from "@/features/lms/mobile/hooks/use-lms-mobile-breakpoint";

type ExerciseStatus = "published" | "draft" | "archived";
type ExerciseDifficulty = "easy" | "medium" | "hard";
type ExerciseType = "quiz" | "practice" | "project" | "exam";

type Exercise = {
  id: string;
  title: string;
  subject: string;
  level: string;
  classTargets: string[];
  type: ExerciseType;
  difficulty: ExerciseDifficulty;
  status: ExerciseStatus;
  questionCount: number;
  durationMinutes: number;
  updatedAt: string;
  assignedCount: number;
  tags: string[];
};

const allValue = "all";

const exercises: Exercise[] = [
  {
    id: "ex-001",
    title: "IC3 GS6 - Ôn tập máy tính căn bản",
    subject: "IC3 GS6",
    level: "Level 1",
    classTargets: ["IC3 GS6 Level 1 - Tối 2/4", "MOS Excel 2021 - Cuối tuần"],
    type: "quiz",
    difficulty: "easy",
    status: "published",
    questionCount: 25,
    durationMinutes: 35,
    updatedAt: "2026-06-02",
    assignedCount: 4,
    tags: ["IC3", "Computer basics", "Trắc nghiệm"],
  },
  {
    id: "ex-002",
    title: "MOS Excel - Hàm IF, SUMIF, COUNTIF",
    subject: "MOS",
    level: "Intermediate",
    classTargets: ["MOS Excel 2021 - Cuối tuần"],
    type: "practice",
    difficulty: "medium",
    status: "published",
    questionCount: 18,
    durationMinutes: 45,
    updatedAt: "2026-06-01",
    assignedCount: 2,
    tags: ["Excel", "Hàm điều kiện"],
  },
  {
    id: "ex-003",
    title: "Scratch - Dự án mê cung",
    subject: "Scratch",
    level: "Thiếu nhi",
    classTargets: ["Scratch thiếu nhi - Sáng T7"],
    type: "project",
    difficulty: "medium",
    status: "draft",
    questionCount: 6,
    durationMinutes: 60,
    updatedAt: "2026-05-29",
    assignedCount: 0,
    tags: ["Scratch", "Game", "Dự án"],
  },
  {
    id: "ex-004",
    title: "Python Junior - Vòng lặp và danh sách",
    subject: "Python",
    level: "Junior",
    classTargets: ["Python Junior - Chiều CN"],
    type: "practice",
    difficulty: "easy",
    status: "published",
    questionCount: 20,
    durationMinutes: 40,
    updatedAt: "2026-05-28",
    assignedCount: 3,
    tags: ["Python", "Loop", "List"],
  },
  {
    id: "ex-005",
    title: "Tin học trẻ - Mini contest thuật toán",
    subject: "Tin học trẻ",
    level: "Đội tuyển",
    classTargets: ["Python Junior - Chiều CN", "Scratch thiếu nhi - Sáng T7"],
    type: "exam",
    difficulty: "hard",
    status: "published",
    questionCount: 5,
    durationMinutes: 90,
    updatedAt: "2026-05-25",
    assignedCount: 1,
    tags: ["Contest", "Algorithm"],
  },
  {
    id: "ex-006",
    title: "AI cơ bản - Prompt tốt và prompt chưa tốt",
    subject: "AI",
    level: "Foundation",
    classTargets: ["IC3 GS6 Level 1 - Tối 2/4"],
    type: "quiz",
    difficulty: "easy",
    status: "draft",
    questionCount: 12,
    durationMinutes: 25,
    updatedAt: "2026-05-22",
    assignedCount: 0,
    tags: ["AI", "Prompt"],
  },
  {
    id: "ex-007",
    title: "MOS PowerPoint - Thiết kế slide báo cáo",
    subject: "MOS",
    level: "Foundation",
    classTargets: ["MOS Excel 2021 - Cuối tuần"],
    type: "project",
    difficulty: "medium",
    status: "archived",
    questionCount: 8,
    durationMinutes: 50,
    updatedAt: "2026-05-12",
    assignedCount: 5,
    tags: ["PowerPoint", "Presentation"],
  },
];

const statusLabels: Record<ExerciseStatus, string> = {
  published: "Đã xuất bản",
  draft: "Bản nháp",
  archived: "Lưu trữ",
};

const difficultyLabels: Record<ExerciseDifficulty, string> = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
};

const typeLabels: Record<ExerciseType, string> = {
  quiz: "Trắc nghiệm",
  practice: "Tự luyện",
  project: "Dự án",
  exam: "Đề kiểm tra",
};

const statusTones: Record<ExerciseStatus, "success" | "warning" | "outline"> = {
  published: "success",
  draft: "warning",
  archived: "outline",
};

const difficultyTones: Record<ExerciseDifficulty, "secondary" | "warning" | "danger"> = {
  easy: "secondary",
  medium: "warning",
  hard: "danger",
};

function uniqueValues(key: "subject" | "level") {
  return Array.from(new Set(exercises.map((exercise) => exercise[key]))).sort();
}

export function ExerciseBankPage({ onBack, onAssign }: { onBack: () => void; onAssign: (exerciseTitle: string) => void }) {
  const isMobile = useLmsMobileBreakpoint("(max-width: 767px)");
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState(allValue);
  const [levelFilter, setLevelFilter] = useState(allValue);
  const [difficultyFilter, setDifficultyFilter] = useState(allValue);
  const [typeFilter, setTypeFilter] = useState(allValue);
  const [statusFilter, setStatusFilter] = useState<ExerciseStatus | typeof allValue>("published");

  const filteredExercises = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return exercises.filter((exercise) => {
      const matchesSearch =
        !normalizedSearch ||
        exercise.title.toLowerCase().includes(normalizedSearch) ||
        exercise.subject.toLowerCase().includes(normalizedSearch) ||
        exercise.level.toLowerCase().includes(normalizedSearch) ||
        exercise.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch));

      return (
        matchesSearch &&
        (subjectFilter === allValue || exercise.subject === subjectFilter) &&
        (levelFilter === allValue || exercise.level === levelFilter) &&
        (difficultyFilter === allValue || exercise.difficulty === difficultyFilter) &&
        (typeFilter === allValue || exercise.type === typeFilter) &&
        (statusFilter === allValue || exercise.status === statusFilter)
      );
    });
  }, [difficultyFilter, levelFilter, searchTerm, statusFilter, subjectFilter, typeFilter]);

  const selectedExercise = useMemo(
    () => exercises.find((exercise) => exercise.id === selectedExerciseId) || filteredExercises[0] || exercises[0],
    [filteredExercises, selectedExerciseId],
  );

  const totals = useMemo(
    () => ({
      all: exercises.length,
      published: exercises.filter((exercise) => exercise.status === "published").length,
      draft: exercises.filter((exercise) => exercise.status === "draft").length,
      visible: filteredExercises.length,
    }),
    [filteredExercises.length],
  );

  function clearFilters() {
    setSearchTerm("");
    setSubjectFilter(allValue);
    setLevelFilter(allValue);
    setDifficultyFilter(allValue);
    setTypeFilter(allValue);
    setStatusFilter(allValue);
  }

  if (isMobile) {
    const statusTabs: Array<{ id: ExerciseStatus | typeof allValue; label: string }> = [
      { id: "published", label: "Xuat ban" },
      { id: allValue, label: "Tat ca" },
      { id: "draft", label: "Nhap" },
      { id: "archived", label: "Luu tru" },
    ];

    return (
      <div className="min-h-full bg-[#f3f6fb] px-3 pb-4 pt-3 text-slate-950">
        <section className="rounded-[24px] border border-[#d9e2ef] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="text-[13px] font-extrabold text-[var(--erg-blue)]">Kho bai tap</div>
          <h1 className="mt-1 text-xl font-extrabold leading-7">Chon bai va giao nhanh</h1>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{filteredExercises.length} ket qua phu hop bo loc hien tai</p>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--erg-blue)]" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-12 w-full rounded-[18px] border border-[#d7e0ec] bg-[#f8fbff] pl-10 pr-3 text-[15px] font-bold text-slate-950 outline-none focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
              placeholder="Tim bai, mon, tag"
            />
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  "h-10 shrink-0 rounded-full border px-4 text-sm font-extrabold",
                  statusFilter === tab.id ? "border-[#b8d6fa] bg-[var(--erg-blue-light)] text-[var(--erg-blue)]" : "border-[#d9e2ef] bg-white text-slate-600",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        <div className="mt-3 grid gap-3">
          {filteredExercises.map((exercise) => (
            <article key={exercise.id} className="rounded-[22px] border border-white bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
              <button type="button" className="w-full text-left" onClick={() => setSelectedExerciseId(exercise.id)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="line-clamp-2 text-base font-extrabold leading-6 text-slate-950">{exercise.title}</h2>
                    <p className="mt-1 text-sm font-bold text-slate-500">{exercise.subject} · {exercise.level}</p>
                  </div>
                  <Badge tone={statusTones[exercise.status]} className="shrink-0 tracking-normal normal-case">{statusLabels[exercise.status]}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#f1f5f9] px-3 py-1 text-xs font-extrabold text-slate-700">{typeLabels[exercise.type]}</span>
                  <span className="rounded-full bg-[#fff7ed] px-3 py-1 text-xs font-extrabold text-amber-700">{difficultyLabels[exercise.difficulty]}</span>
                  <span className="rounded-full bg-[var(--erg-blue-light)] px-3 py-1 text-xs font-extrabold text-[var(--erg-blue)]">{exercise.durationMinutes} phut</span>
                  <span className="rounded-full bg-[#f1f5f9] px-3 py-1 text-xs font-extrabold text-slate-700">{exercise.questionCount} cau</span>
                </div>
              </button>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="flex h-11 flex-1 items-center justify-center rounded-[16px] border border-[#d9e2ef] bg-white text-sm font-extrabold text-slate-700"
                  onClick={() => setSelectedExerciseId(exercise.id)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Xem
                </button>
                <button
                  type="button"
                  className="flex h-11 flex-1 items-center justify-center rounded-[16px] bg-[var(--erg-blue)] text-sm font-extrabold text-white shadow-[0_10px_20px_rgba(15,108,189,0.2)]"
                  onClick={() => onAssign(exercise.title)}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Giao nhanh
                </button>
              </div>
            </article>
          ))}

          {filteredExercises.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-[#cbd7e6] bg-white p-6 text-center">
              <div className="text-base font-extrabold text-slate-950">Khong co bai phu hop</div>
              <p className="mt-2 text-sm font-semibold text-slate-500">Thu doi tu khoa hoac xoa bo loc de xem lai kho bai.</p>
              <button type="button" className="mt-4 h-11 rounded-[16px] bg-[var(--erg-blue)] px-5 text-sm font-extrabold text-white" onClick={clearFilters}>
                Xoa loc
              </button>
            </div>
          ) : null}
        </div>

        {selectedExerciseId && selectedExercise ? (
          <div className="fixed inset-x-0 bottom-[calc(92px+env(safe-area-inset-bottom,0px)+8px)] z-50 px-3">
            <div className="rounded-[22px] border border-[#d9e2ef] bg-white p-4 shadow-[0_18px_44px_rgba(15,23,42,0.18)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="line-clamp-2 text-sm font-extrabold text-slate-950">{selectedExercise.title}</div>
                  <div className="mt-1 text-xs font-bold text-slate-500">{selectedExercise.subject} · {selectedExercise.durationMinutes} phut · {selectedExercise.questionCount} cau</div>
                </div>
                <button type="button" className="h-9 rounded-full bg-[#f1f5f9] px-3 text-xs font-extrabold text-slate-600" onClick={() => setSelectedExerciseId("")}>
                  Dong
                </button>
              </div>
              <button
                type="button"
                className="mt-3 flex h-11 w-full items-center justify-center rounded-[16px] bg-[var(--erg-blue)] text-sm font-extrabold text-white"
                onClick={() => onAssign(selectedExercise.title)}
              >
                <Send className="mr-2 h-4 w-4" />
                Giao bai tap nay
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden px-4 py-4 xl:px-6">
      <section className="shrink-0 rounded-lg border border-[#cbd7e6] bg-white px-3 py-2.5 shadow-[var(--shadow-xs)]">
        <div className="grid items-center gap-3 xl:grid-cols-[minmax(280px,1fr)_auto_auto]">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-500">
              <FileQuestion className="h-3.5 w-3.5 text-[var(--erg-blue)]" />
              Bài tập / <span className="text-slate-600">Kho bài tập</span>
            </div>
            <h1 className="mt-1 text-xl font-semibold tracking-normal text-slate-950">Kho bài tập</h1>
            <p className="mt-0.5 truncate text-[13px] font-semibold text-slate-600">
              Thư viện bài tập mẫu, đề luyện tập và bài kiểm tra để giáo viên chọn nhanh rồi giao cho lớp hoặc nhóm.
            </p>
          </div>
          <div className="grid min-w-[520px] grid-cols-4 gap-2 max-xl:min-w-0">
            <ExerciseBankStat icon={BookOpenCheck} label="Tổng" value={String(totals.all)} />
            <ExerciseBankStat icon={Send} label="Xuất bản" value={String(totals.published)} />
            <ExerciseBankStat icon={ListChecks} label="Nháp" value={String(totals.draft)} />
            <ExerciseBankStat icon={Filter} label="Đang hiện" value={String(totals.visible)} />
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <Button variant="outline" className="h-9 rounded-lg px-3 text-[14px]" onClick={onBack}>Về trang bài tập</Button>
            <Button variant="outline" className="h-9 rounded-lg px-3 text-[14px]">
              <Copy className="h-3.5 w-3.5" />
              Nhân bản
            </Button>
            <Button className="h-9 rounded-lg bg-[var(--erg-blue)] px-4 text-[14px] hover:bg-[var(--erg-blue-hover)]">
              <Plus className="h-3.5 w-3.5" />
              Tạo bài mới
            </Button>
          </div>
        </div>
      </section>

      <section className="shrink-0 rounded-lg border border-[#cbd7e6] bg-white p-3 shadow-[var(--shadow-xs)]">
        <div className="grid gap-2 xl:grid-cols-[minmax(260px,1.4fr)_repeat(4,minmax(130px,0.65fr))_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--erg-blue)]" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-10 rounded-lg border border-[#d7e0ec] bg-white pl-9 text-[14px] font-semibold text-slate-900 shadow-none focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
              placeholder="Tìm tên bài, môn, cấp độ hoặc tag"
            />
          </div>
          <FilterSelect value={subjectFilter} onChange={setSubjectFilter} label="Tất cả môn" values={uniqueValues("subject")} />
          <FilterSelect value={levelFilter} onChange={setLevelFilter} label="Tất cả cấp độ" values={uniqueValues("level")} />
          <FilterSelect
            value={difficultyFilter}
            onChange={setDifficultyFilter}
            label="Tất cả độ khó"
            values={["easy", "medium", "hard"]}
            labels={difficultyLabels}
          />
          <FilterSelect
            value={typeFilter}
            onChange={setTypeFilter}
            label="Tất cả loại"
            values={["quiz", "practice", "project", "exam"]}
            labels={typeLabels}
          />
          <Button variant="outline" className="h-10 rounded-lg px-3 text-[14px]" onClick={clearFilters}>
            Xóa lọc
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { id: allValue, label: "Tất cả" },
            { id: "published", label: "Xuất bản" },
            { id: "draft", label: "Nháp" },
            { id: "archived", label: "Lưu trữ" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as ExerciseStatus | typeof allValue)}
              className={cn(
                "h-9 rounded-lg border px-3 text-[13px] font-bold transition",
                statusFilter === tab.id
                  ? "border-[#b8d6fa] bg-[var(--erg-blue-light)] text-[var(--erg-blue)]"
                  : "border-[#dbe4f0] bg-white text-slate-700 hover:border-[#b8c8db] hover:bg-[#f8fbff]",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid min-h-0 flex-1 gap-3 overflow-hidden xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-[#cbd7e6] bg-white shadow-[var(--shadow-xs)]">
          <div className="flex shrink-0 items-center justify-between border-b border-[#dbe4f0] px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Danh sách bài tập</h2>
            <Badge tone="secondary" className="tracking-normal normal-case">{filteredExercises.length} kết quả</Badge>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="erg-data-table min-w-[1040px] w-full border-collapse text-left text-[14px]">
              <thead className="sticky top-0 z-10 bg-[#eef4fb] text-[13px] font-bold text-slate-700 shadow-sm">
                <tr>
                  <th className="px-4 py-3">Bài tập</th>
                  <th className="px-4 py-3">Môn</th>
                  <th className="px-4 py-3">Loại</th>
                  <th className="px-4 py-3">Độ khó</th>
                  <th className="px-4 py-3">Thời lượng</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredExercises.map((exercise) => {
                  const isSelected = exercise.id === selectedExercise.id;

                  return (
                    <tr
                      key={exercise.id}
                      className={cn("cursor-pointer transition hover:bg-[#f8fbff]", isSelected && "bg-[var(--erg-blue-light)]")}
                      onClick={() => setSelectedExerciseId(exercise.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="max-w-[360px]">
                          <div className="truncate font-semibold text-slate-900">{exercise.title}</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {exercise.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="rounded border border-[#dbe4f0] bg-[#f8fbff] px-1.5 py-0.5 text-[13px] font-semibold text-slate-700">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-700">{exercise.subject}</div>
                        <div className="text-[13px] font-semibold text-slate-500">{exercise.level}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-600">{typeLabels[exercise.type]}</td>
                      <td className="px-4 py-3">
                        <Badge tone={difficultyTones[exercise.difficulty]} className="tracking-normal normal-case">{difficultyLabels[exercise.difficulty]}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          <Clock3 className="h-3.5 w-3.5 text-slate-500" />
                          {exercise.durationMinutes} phút
                        </div>
                        <div className="text-[13px] font-semibold text-slate-500">{exercise.questionCount} câu/nhiệm vụ</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={statusTones[exercise.status]} className="tracking-normal normal-case">{statusLabels[exercise.status]}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button type="button" className="grid h-8 w-8 place-items-center rounded-lg border border-transparent text-slate-600 hover:border-[#b8c8db] hover:bg-white hover:text-slate-800 hover:shadow-sm" title="Xem nhanh">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onAssign(exercise.title);
                            }}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-transparent text-slate-600 hover:border-[#b8d6fa] hover:bg-white hover:text-[var(--erg-blue)] hover:shadow-sm"
                            title="Giao bài"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredExercises.length === 0 ? (
              <div className="m-4 rounded-lg border border-dashed border-[#cbd7e6] p-8 text-center text-sm font-semibold text-slate-600">
                Không tìm thấy bài tập phù hợp. Thử đổi từ khóa hoặc xóa bộ lọc.
              </div>
            ) : null}
          </div>
        </div>

        <aside className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-[#cbd7e6] bg-white shadow-[var(--shadow-xs)]">
          <div className="shrink-0 border-b border-[#dbe4f0] px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Xem nhanh bài tập</h2>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            <div className="rounded-lg border border-[#dbe4f0] bg-[#f8fbff] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold leading-5 text-slate-900">{selectedExercise.title}</h3>
                  <p className="mt-1 text-[13px] font-semibold text-slate-500">
                    Cập nhật {new Date(selectedExercise.updatedAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <Badge tone={statusTones[selectedExercise.status]} className="shrink-0 tracking-normal normal-case">{statusLabels[selectedExercise.status]}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[13px]">
              <QuickInfo label="Môn học" value={selectedExercise.subject} />
              <QuickInfo label="Cấp độ" value={selectedExercise.level} />
              <QuickInfo label="Loại bài" value={typeLabels[selectedExercise.type]} />
              <QuickInfo label="Đã giao" value={`${selectedExercise.assignedCount} lần`} />
            </div>
            <div>
              <h3 className="mb-2 text-[13px] font-bold text-slate-600">Lớp/nhóm phù hợp</h3>
              <div className="space-y-2">
                {selectedExercise.classTargets.map((target) => (
                  <div key={target} className="rounded-lg border border-[#dbe4f0] bg-[#f8fbff] px-3 py-2 text-[13px] font-semibold text-slate-700">
                    {target}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-[13px] font-bold text-slate-600">Tag nội dung</h3>
              <div className="flex flex-wrap gap-2">
                {selectedExercise.tags.map((tag) => (
                  <Badge key={tag} tone="outline" className="tracking-normal normal-case">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="shrink-0 space-y-2 border-t border-[#dbe4f0] p-4">
            <Button className="w-full bg-[var(--erg-blue)] hover:bg-[var(--erg-blue-hover)]" onClick={() => onAssign(selectedExercise.title)}>
              <Send className="h-4 w-4" />
              Giao bài tập này
            </Button>
            <Button variant="outline" className="w-full">
              <Eye className="h-4 w-4" />
              Xem chi tiết
            </Button>
          </div>
        </aside>
      </section>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  label,
  values,
  labels,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  values: string[];
  labels?: Record<string, string>;
}) {
  return (
    <AppSelect
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 rounded-lg border border-[#d7e0ec] bg-white px-3 text-[14px] font-bold text-slate-900 outline-none transition hover:border-[var(--erg-blue)] focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
    >
      <option value={allValue}>{label}</option>
      {values.map((item) => (
        <option key={item} value={item}>
          {labels?.[item] ?? item}
        </option>
      ))}
    </AppSelect>
  );
}

function ExerciseBankStat({ icon: Icon, label, value }: { icon: typeof BookOpenCheck; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-[#cbd7e6] bg-[#f8fbff] px-2.5 py-1.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white text-[var(--erg-blue)] shadow-sm">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold tracking-normal text-slate-600">{label}</span>
        <span className="block truncate text-sm font-semibold text-slate-950">{value}</span>
      </span>
    </div>
  );
}

function QuickInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#dbe4f0] bg-[#f8fbff] px-3 py-2">
      <div className="text-[13px] font-semibold text-slate-600">{label}</div>
      <div className="mt-1 truncate text-[14px] font-bold text-slate-900">{value}</div>
    </div>
  );
}
