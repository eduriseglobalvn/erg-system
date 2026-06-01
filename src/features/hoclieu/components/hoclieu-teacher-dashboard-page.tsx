import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, CheckCircle2, ChevronDown, ChevronLeft, FileText, FolderOpen, Search } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import type { HocLieuResource } from "@/features/hoclieu/api/library-data";
import { HocLieuSlideViewerModal } from "@/features/hoclieu/components/hoclieu-slide-viewer-modal";
import { useHocLieuLibraryCatalog } from "@/features/hoclieu/hooks/use-hoclieu-library-catalog";

const themeStyles: Record<HocLieuResource["thumbnailTheme"], { banner: string; accent: string }> = {
  blue: {
    banner: "bg-[linear-gradient(135deg,#2c6678_0%,#3f879f_55%,#79b8cf_100%)]",
    accent: "text-sky-700",
  },
  green: {
    banner: "bg-[linear-gradient(135deg,#51a37b_0%,#66c196_55%,#9ce1ba_100%)]",
    accent: "text-emerald-700",
  },
  orange: {
    banner: "bg-[linear-gradient(135deg,#d56c46_0%,#e48a52_55%,#f7c47e_100%)]",
    accent: "text-orange-700",
  },
  purple: {
    banner: "bg-[linear-gradient(135deg,#7566d8_0%,#9584f2_55%,#bcb2fa_100%)]",
    accent: "text-violet-700",
  },
  teal: {
    banner: "bg-[linear-gradient(135deg,#29a0ad_0%,#47c7c3_55%,#8be5d8_100%)]",
    accent: "text-teal-700",
  },
  rose: {
    banner: "bg-[linear-gradient(135deg,#d76682_0%,#eb8799_55%,#f7c8d1_100%)]",
    accent: "text-rose-700",
  },
  yellow: {
    banner: "bg-[linear-gradient(135deg,#d89c24_0%,#e8ba3f_55%,#f6dc88_100%)]",
    accent: "text-amber-700",
  },
  slate: {
    banner: "bg-[linear-gradient(135deg,#476177_0%,#658298_55%,#a2b8c8_100%)]",
    accent: "text-slate-700",
  },
};

function formatProgressRate(value?: number) {
  return `${Math.round(Math.max(0, Math.min(100, value ?? 0)))}%`;
}

function formatCount(value: number, label: string) {
  return `${value} ${label}`;
}

function getLessonEyebrow(title: string) {
  const match = title.match(/bài\s*\d+/i);
  return match?.[0] ?? "Bài học";
}

function GoogleSlidesIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#F4B400" d="M6 2h8l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
      <path fill="#FFE082" d="M14 2v4a1 1 0 0 0 1 1h4l-5-5Z" />
      <path fill="#FFFFFF" d="M8 10.25h8v5.5H8v-5.5Zm1.25 1.25v3h5.5v-3h-5.5Z" />
      <path fill="#FFFFFF" d="M10.9 17h2.2v1.25h-2.2z" />
    </svg>
  );
}

function isGoogleSlidesLecture(resource: HocLieuResource) {
  return (
    resource.launchMode === "google_slide_embed" ||
    resource.fileType === "PPTX" ||
    resource.resourceType === "slide" ||
    resource.resourceType === "lecture_bank"
  );
}

function SubjectRail({
  subjects,
  selectedSubjectId,
  selectedSectionId,
  expandedSubjectIds,
  onSelectSubject,
  onSelectSection,
  onToggleSubject,
}: {
  subjects: ReturnType<typeof useHocLieuLibraryCatalog>["subjects"];
  selectedSubjectId: string;
  selectedSectionId: string;
  expandedSubjectIds: string[];
  onSelectSubject: (subjectId: string) => void;
  onSelectSection: (subjectId: string, sectionId: string) => void;
  onToggleSubject: (subjectId: string) => void;
}) {
  return (
    <aside className="border-r border-slate-200 bg-white">
      <div className="sticky top-16 px-5 py-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Danh mục</p>
          <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">Kho học liệu</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Chọn môn học, mở nhóm học liệu, rồi vào đúng bài cần dạy.</p>
        </div>

        <div className="mt-4 space-y-2">
          {subjects.map((subject) => {
            const isActive = subject.id === selectedSubjectId;
            const isExpanded = expandedSubjectIds.includes(subject.id);

            return (
              <div key={subject.id} className={`rounded-2xl border p-3 ${isActive ? "border-blue-200 bg-blue-50/70" : "border-transparent bg-white"}`}>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => onSelectSubject(subject.id)} className="min-w-0 flex-1 text-left">
                    <p className={`truncate text-[15px] font-black ${isActive ? "text-[#091f80]" : "text-slate-900"}`}>{subject.label}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">{formatCount(subject.resourceCount, "học liệu")}</p>
                  </button>

                  <div className="flex items-center gap-1">
                    <span className="grid min-w-6 place-items-center rounded-full bg-white px-2 py-1 text-[11px] font-black text-[#091f80]">{subject.groupCount}</span>
                    <button
                      type="button"
                      aria-label={isExpanded ? "Thu gọn nhóm học liệu" : "Mở nhóm học liệu"}
                      onClick={() => onToggleSubject(subject.id)}
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        isExpanded ? "bg-white text-[#091f80]" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      }`}
                    >
                      <ChevronDown className={`h-4 w-4 ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="mt-3">
                    <div className="relative ml-2 pl-4 before:absolute before:bottom-3 before:left-0 before:top-3 before:w-px before:border-l before:border-dashed before:border-blue-200 before:content-['']">
                      <div className="space-y-1">
                        {subject.sections.map((section) => {
                          const isSelected = isActive && section.id === selectedSectionId;

                          return (
                            <button
                              key={section.id}
                              type="button"
                              onClick={() => onSelectSection(subject.id, section.id)}
                              className={`relative flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm before:absolute before:-left-4 before:top-1/2 before:w-3 before:-translate-y-1/2 before:border-t before:border-dashed before:border-blue-200 before:content-[''] ${
                                isSelected ? "bg-white font-bold text-[#091f80]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                              }`}
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-[#091f80]" : "bg-slate-300"}`} />
                                <span className="truncate">{section.title}</span>
                              </span>
                              <span className="shrink-0 text-[11px] font-bold text-slate-400">{section.lessonCount}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

function SubjectRailSkeleton() {
  return (
    <aside className="border-r border-slate-200 bg-white">
      <div className="px-5 py-6">
        <div className="border-b border-slate-200 pb-5">
          <Skeleton className="h-3 w-16 rounded-full" />
          <Skeleton className="mt-3 h-8 w-36" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-4/5" />
        </div>

        <div className="mt-5 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="border-b border-slate-100 pb-3">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="mt-2 h-4 w-16" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function LessonCard({
  lesson,
  onOpen,
}: {
  lesson: NonNullable<ReturnType<typeof useHocLieuLibraryCatalog>["activeSection"]>["lessons"][number];
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left hover:border-blue-200"
    >
      <div className="relative h-32 overflow-hidden bg-[linear-gradient(135deg,#eef5ff_0%,#dbeafe_55%,#bfdbfe_100%)]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.55)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.45)_1px,transparent_1px)] bg-[length:22px_22px] opacity-45" />
        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#091f80]">
          <BookOpen className="h-3.5 w-3.5" />
          {getLessonEyebrow(lesson.title)}
        </div>
        <div className="absolute bottom-4 right-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/85 text-[#091f80]">
          <FolderOpen className="h-6 w-6" />
        </div>
      </div>

      <div className="px-4 py-4">
        <h3 className="line-clamp-2 min-h-[56px] text-[19px] font-black leading-7 text-slate-950">{lesson.title}</h3>
        <div className="mt-5 flex items-center justify-between text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          <span>Tiến độ</span>
          <span className="text-[#091f80]">{formatProgressRate(lesson.progress.progressRate)}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-[#091f80]" style={{ width: formatProgressRate(lesson.progress.progressRate) }} />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
        <span className="text-sm font-bold text-slate-500">{formatCount(lesson.resourceCount, "học liệu")}</span>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#091f80]">Mở bài</span>
      </div>
    </button>
  );
}

function ResourceCard({
  resource,
  progressRate,
  kindLabel,
  onOpen,
}: {
  resource: HocLieuResource;
  progressRate?: number;
  kindLabel: string;
  onOpen: (resource: HocLieuResource) => void;
}) {
  const theme = themeStyles[resource.thumbnailTheme];
  const shouldShowGoogleSlidesIcon = isGoogleSlidesLecture(resource);

  return (
    <button
      type="button"
      onClick={() => onOpen(resource)}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left hover:border-blue-200"
    >
      <div className={`relative h-32 overflow-hidden ${theme.banner}`}>
        {resource.thumbnailUrl ? <img src={resource.thumbnailUrl} alt={resource.title} className="h-full w-full object-cover" /> : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.04),rgba(15,23,42,0.22))]" />
        <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-900">
          <FileText className="h-3.5 w-3.5" />
          {kindLabel}
        </div>
        {shouldShowGoogleSlidesIcon ? (
          <div className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-2xl bg-white/90 shadow-sm ring-1 ring-blue-100">
            <GoogleSlidesIcon className="h-7 w-7" />
          </div>
        ) : null}
      </div>

      <div className="px-4 py-4">
        <h3 className="line-clamp-2 min-h-[56px] text-[18px] font-black leading-7 text-slate-950">{resource.title}</h3>
        <div className="mt-4 flex items-center justify-between text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          <span>Tiến độ</span>
          <span className={theme.accent}>{formatProgressRate(progressRate)}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-[#091f80]" style={{ width: formatProgressRate(progressRate) }} />
        </div>
      </div>
    </button>
  );
}

function LessonGridSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-10 w-40" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <Skeleton className="h-36 w-full rounded-none" />
            <div className="space-y-4 px-4 py-4">
              <Skeleton className="h-7 w-4/5" />
              <Skeleton className="h-3 w-full rounded-full" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-14" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResourceGridSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-9 w-72" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <Skeleton className="h-36 w-full rounded-none" />
            <div className="space-y-4 px-4 py-4">
              <Skeleton className="h-7 w-5/6" />
              <Skeleton className="h-3 w-full rounded-full" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function partitionLessonResources(resources: HocLieuResource[]) {
  const lectureResources = resources.filter((resource) =>
    ["slide", "lecture_bank", "lesson_plan", "external_link"].includes(resource.resourceType) || ["PPTX", "LINK", "PDF", "VIDEO"].includes(resource.fileType),
  );
  const exerciseResources = resources.filter((resource) =>
    ["quiz", "test_bank", "interactive", "download_package"].includes(resource.resourceType) || ["QUIZ", "ZIP", "XLSX", "DOCX"].includes(resource.fileType),
  );

  return { lectureResources, exerciseResources };
}

function isLaunchEndpoint(value: string) {
  try {
    const url = new URL(value, window.location.origin);
    return url.pathname.replace(/\/$/, "").endsWith("/launch");
  } catch {
    return value.split("?")[0]?.replace(/\/$/, "").endsWith("/launch") ?? false;
  }
}

export function HocLieuTeacherDashboardPage() {
  const {
    activeLesson,
    activeSection,
    activeSubject,
    error,
    loading,
    loadingSubject,
    onOpenResource,
    onSelectLesson,
    onSelectSection,
    onSelectSubject,
    searchValue,
    sections,
    selectedSectionId,
    selectedSubjectId,
    setSearchValue,
    subjects,
  } = useHocLieuLibraryCatalog();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [expandedSubjectIds, setExpandedSubjectIds] = useState<string[]>([]);
  const [isLessonDetailOpen, setIsLessonDetailOpen] = useState(false);
  const [viewerState, setViewerState] = useState<{ resource: HocLieuResource; progressRate: number } | null>(null);

  useEffect(() => {
    function handleFocusSearch() {
      searchInputRef.current?.focus();
    }

    window.addEventListener("hoclieu-dashboard-focus-search", handleFocusSearch);
    return () => window.removeEventListener("hoclieu-dashboard-focus-search", handleFocusSearch);
  }, []);

  useEffect(() => {
    if (!selectedSubjectId) return;
    setExpandedSubjectIds((current) => (current.includes(selectedSubjectId) ? current : [...current, selectedSubjectId]));
  }, [selectedSubjectId]);

  useEffect(() => {
    setIsLessonDetailOpen(false);
  }, [selectedSectionId, selectedSubjectId]);

  function handleToggleSubject(subjectId: string) {
    setExpandedSubjectIds((current) => (current.includes(subjectId) ? current.filter((id) => id !== subjectId) : [...current, subjectId]));
  }

  const totalVisibleResources = useMemo(
    () => sections.reduce((total, section) => total + section.lessons.reduce((lessonTotal, lesson) => lessonTotal + lesson.resources.length, 0), 0),
    [sections],
  );

  const lessonResourceBuckets = useMemo(() => partitionLessonResources(activeLesson?.resources ?? []), [activeLesson]);

  function handleOpenLesson(lessonId: string) {
    onSelectLesson(lessonId);
    setIsLessonDetailOpen(true);
  }

  function handleBackToLessonGrid() {
    setIsLessonDetailOpen(false);
  }

  async function handleOpenResource(resource: HocLieuResource) {
    const hydratedResource = await onOpenResource(resource);
    const viewerUrl = hydratedResource?.viewer.embedUrl || hydratedResource?.viewer.secureEmbedUrl;
    const hasCustomSlides = (hydratedResource?.viewer.slides?.length ?? 0) > 0;

    if (!hydratedResource || (!viewerUrl && !hasCustomSlides) || (viewerUrl && isLaunchEndpoint(viewerUrl))) return;

    setViewerState({
      resource: hydratedResource,
      progressRate: activeLesson?.progress.progressRate ?? 0,
    });
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[linear-gradient(180deg,#f6f9ff_0%,#f8fafc_42%,#ffffff_100%)]">
      <div className="min-h-[calc(100vh-64px)] w-full">
        <div className="grid min-h-[calc(100vh-64px)] gap-0 xl:grid-cols-[280px_minmax(0,1fr)]">
          {loading && subjects.length === 0 ? (
            <SubjectRailSkeleton />
          ) : (
            <SubjectRail
              subjects={subjects}
              selectedSubjectId={selectedSubjectId}
              selectedSectionId={selectedSectionId}
              expandedSubjectIds={expandedSubjectIds}
              onSelectSubject={onSelectSubject}
              onSelectSection={onSelectSection}
              onToggleSubject={handleToggleSubject}
            />
          )}

          <section className="min-w-0 px-7 py-6">
            <div className="mb-6 rounded-3xl border border-slate-200 bg-white/90 px-6 py-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Đang xem</p>
                  <h1 className="mt-2 truncate text-[34px] font-black leading-tight tracking-tight text-slate-950">{activeSection?.title || activeSubject?.label || "Kho học liệu"}</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[#091f80]">
                      <FolderOpen className="h-4 w-4" />
                      {activeSubject?.label || "Chưa chọn môn"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      {formatCount(totalVisibleResources, "học liệu")}
                    </span>
                  </div>
                </div>

                <div className="w-full max-w-[420px]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      ref={searchInputRef}
                      type="search"
                      value={searchValue}
                      onChange={(event) => setSearchValue(event.target.value)}
                      placeholder="Tìm học liệu, nhóm hoặc bài học"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#091f80] focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              {error ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm font-bold text-amber-700">{error}</div> : null}

              {loading ? (
                <LessonGridSkeleton />
              ) : (
                <div className="space-y-12">
                  {sections.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                      <p className="text-lg font-black text-slate-950">Chưa có học liệu phù hợp</p>
                      <p className="mt-2 text-sm text-slate-500">
                        {searchValue ? "Thử đổi từ khóa tìm kiếm hoặc chọn nhóm học liệu khác." : "Môn học này chưa có học liệu để hiển thị."}
                      </p>
                    </div>
                  ) : activeSection ? (
                    <section className="space-y-5">
                      {!isLessonDetailOpen ? (
                        loadingSubject ? (
                          <LessonGridSkeleton />
                        ) : (
                          <div className="space-y-5">
                            <div className="flex flex-wrap items-end justify-between gap-3">
                              <div>
                                <h2 className="text-[28px] font-black tracking-tight text-slate-950">{activeSection.title}</h2>
                                <p className="mt-1 text-sm font-medium text-slate-500">{formatCount(activeSection.lessons.length, "bài học")} trong nhóm này</p>
                              </div>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                                {formatProgressRate(activeSection.progress.progressRate)}
                              </span>
                            </div>
                            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                              {activeSection.lessons.map((lesson) => (
                                <LessonCard key={lesson.id} lesson={lesson} onOpen={() => handleOpenLesson(lesson.id)} />
                              ))}
                            </div>
                          </div>
                        )
                      ) : activeLesson ? (
                        <div className="space-y-8">
                          <div>
                            <button
                              type="button"
                              onClick={handleBackToLessonGrid}
                              className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-900"
                            >
                              <ChevronLeft className="h-4 w-4" />
                              Quay lại
                            </button>
                            <h3 className="mt-3 text-[28px] font-black tracking-tight text-slate-950">{activeLesson.title}</h3>
                          </div>

                          {loadingSubject ? (
                            <ResourceGridSkeleton />
                          ) : lessonResourceBuckets.lectureResources.length > 0 || lessonResourceBuckets.exerciseResources.length > 0 ? (
                            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                              {lessonResourceBuckets.lectureResources.map((resource) => (
                                <ResourceCard
                                  key={resource.id}
                                  resource={resource}
                                  progressRate={activeLesson.progress.progressRate}
                                  kindLabel="Bài giảng"
                                  onOpen={(resource) => void handleOpenResource(resource)}
                                />
                              ))}
                              {lessonResourceBuckets.exerciseResources.map((resource) => (
                                <ResourceCard
                                  key={resource.id}
                                  resource={resource}
                                  progressRate={activeLesson.progress.progressRate}
                                  kindLabel="Bài tập"
                                  onOpen={(resource) => void handleOpenResource(resource)}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-sm text-slate-500">
                              Chưa có học liệu trong bài học này.
                            </div>
                          )}
                        </div>
                      ) : null}
                    </section>
                  ) : null}
                </div>
              )}

              {!loading && sections.length > 0 && !isLessonDetailOpen ? <div className="pt-4 text-sm text-slate-400">{totalVisibleResources} học liệu đang hiển thị</div> : null}
            </div>
          </section>
        </div>
      </div>
      {viewerState ? (
        <HocLieuSlideViewerModal
          resource={viewerState.resource}
          progressRate={viewerState.progressRate}
          onClose={() => setViewerState(null)}
        />
      ) : null}
    </div>
  );
}
