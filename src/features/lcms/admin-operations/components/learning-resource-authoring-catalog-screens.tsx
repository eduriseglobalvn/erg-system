import { useMemo, useState } from "react";
import ArrowUpRight from "@mui/icons-material/NorthEast";
import BookOpen from "@mui/icons-material/AutoStories";
import ChevronRight from "@mui/icons-material/ChevronRight";
import LibraryBig from "@mui/icons-material/LocalLibrary";
import LinkIcon from "@mui/icons-material/Link";
import ListTree from "@mui/icons-material/AccountTree";
import Pencil from "@mui/icons-material/Edit";
import Plus from "@mui/icons-material/Add";
import Settings2 from "@mui/icons-material/Tune";
import Trash2 from "@mui/icons-material/DeleteOutlined";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";

import { AppSelect } from "@/components/ui/app-select";
import { EmptyState } from "@/components/ui/empty-state";
import { inputClassName } from "@/components/ui/input";
import type { LearningResourceResourceCard } from "@/features/lcms/admin-operations/api/learning-resource-authoring-api";
import { ContentLifecycleControls, lifecycleResourceKindForTaxonomyKind, lifecycleStateFromStatus } from "@/features/lcms/content-lifecycle";
import type { QuestionBankQuestion, QuizBankItem } from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import {
  AuthoringCardDescription,
  AuthoringCardHeader,
  AuthoringCardTitle,
  InfoRow,
  PublishCard,
  PublishStep,
  SearchInput,
} from "@/features/lcms/admin-operations/components/learning-resource-authoring-fields";
import { summarizeLearningResourcePublishReadiness } from "@/features/lcms/admin-operations/components/learning-resource-authoring-screen-model";
import { getPublishStatusLabel } from "@/features/lcms/admin-operations/components/learning-resource-authoring-utils";
import type { StudioSubject } from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import { resolveResourceCurriculumLocation } from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";
import { cn } from "@/lib/utils";

export function SubjectsScreen({
  subjects,
  query,
  onQueryChange,
  selectedSubject,
  onSelectSubject,
  onCreateSubject,
  onOpenStructure,
  onEditSubject,
  onDeleteSubject,
  onLifecycleTransitioned,
}: {
  subjects: StudioSubject[];
  query: string;
  onQueryChange: (value: string) => void;
  selectedSubject?: StudioSubject;
  onSelectSubject: (id: string) => void;
  onCreateSubject: () => void;
  onOpenStructure: () => void;
  onEditSubject: (subject: StudioSubject) => void;
  onDeleteSubject: (subject: StudioSubject) => void;
  onLifecycleTransitioned?: () => void | Promise<void>;
}) {
  return (
    <div className="grid h-full min-h-0 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="flex min-h-0 flex-col">
        <AuthoringCardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <AuthoringCardTitle>Danh sách môn học</AuthoringCardTitle>
              <AuthoringCardDescription>Mỗi môn có thể có nhiều level, chủ đề và học liệu khác nhau.</AuthoringCardDescription>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outlined"
                onClick={onOpenStructure}
                startIcon={<LibraryBig className="h-4 w-4" />}
                title="Mở cấu trúc để chọn chủ đề và tạo tài nguyên"
              >
                Tạo tài nguyên
              </Button>
              <Button type="button" variant="contained" onClick={onCreateSubject} startIcon={<Plus className="h-4 w-4" />} className="bg-[var(--erg-blue)] hover:bg-[var(--erg-blue-hover)]">
                Tạo môn học
              </Button>
            </div>
          </div>
          <SearchInput value={query} onChange={onQueryChange} placeholder="Tìm môn học, chương trình, bộ sách" />
        </AuthoringCardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-[#e0e4ea] [scrollbar-gutter:stable]">
            <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_120px_120px_120px_120px] bg-[#f7f8fa] px-4 py-3 text-[11px] font-semibold text-slate-600">
              <span>Môn học</span><span>Level</span><span>Tài liệu</span><span>Trạng thái</span><span className="text-right">Thao tác</span>
            </div>
            {subjects.map((subject) => (
              <div
                key={subject.id}
                onClick={() => onSelectSubject(subject.id)}
                className={cn(
                  "grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_120px_120px_120px_120px] items-center gap-3 border-t border-[#e0e4ea] px-4 py-4 text-left hover:bg-[#f7f8fa]",
                  selectedSubject?.id === subject.id ? "bg-[#ebf3fc]" : "bg-white",
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-slate-950">{subject.label}</span>
                  <span className="mt-1 block truncate text-sm text-slate-500">{subject.description || "Chưa có mô tả."}</span>
                </span>
                <span className="text-sm font-semibold text-slate-700">{subject.groupCount}</span>
                <span className="text-sm font-semibold text-slate-700">{subject.resourceCount}</span>
                <span><Chip label={getPublishStatusLabel(subject.status)} size="small" variant={subject.status === "ACTIVE" || subject.status === "active" ? "filled" : "outlined"} color={subject.status === "ACTIVE" || subject.status === "active" ? "success" : "default"} /></span>
                <span className="flex justify-end gap-2">
                  <Button type="button" variant="outlined" size="small" onClick={(event) => { event.stopPropagation(); onEditSubject(subject); }}><Pencil className="h-4 w-4" /></Button>
                  <Button type="button" variant="outlined" size="small" onClick={(event) => { event.stopPropagation(); onDeleteSubject(subject); }}><Trash2 className="h-4 w-4" /></Button>
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <AuthoringCardHeader>
          <AuthoringCardTitle>Môn đang chọn</AuthoringCardTitle>
          <AuthoringCardDescription>Thông tin tổng quát trước khi vào cấu trúc.</AuthoringCardDescription>
        </AuthoringCardHeader>
        <CardContent className="space-y-4">
          {selectedSubject ? (
            <>
              <div className="rounded-lg border border-[#e0e4ea] bg-[#fafbfc] p-5">
                <div className="text-xl font-medium text-slate-950">{selectedSubject.label}</div>
                <p className="mt-2 text-sm leading-6 text-slate-500">{selectedSubject.description || "Môn này chưa có mô tả."}</p>
              </div>
              <InfoRow label="Level" value={`${selectedSubject.groupCount} level`} />
              <InfoRow label="Chủ đề" value={`${selectedSubject.lessonCount} chủ đề`} />
              <InfoRow label="Tài liệu" value={`${selectedSubject.resourceCount} tài liệu`} />
              <InfoRow label="Trạng thái" value={getPublishStatusLabel(selectedSubject.status)} />
              <ContentLifecycleControls
                target={{
                  resourceKind: lifecycleResourceKindForTaxonomyKind("subject")!,
                  resourceId: selectedSubject.id,
                  currentState: lifecycleStateFromStatus(selectedSubject.status),
                  label: selectedSubject.label,
                }}
                onTransitioned={() => onLifecycleTransitioned?.()}
              />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outlined" onClick={() => onEditSubject(selectedSubject)} startIcon={<Pencil className="h-4 w-4" />}>Sửa môn</Button>
                <Button variant="contained" color="error" onClick={() => onDeleteSubject(selectedSubject)} startIcon={<Trash2 className="h-4 w-4" />}>Xóa</Button>
              </div>
            </>
          ) : <EmptyState title="Chưa chọn môn" description="Chọn một môn ở danh sách để xem chi tiết." />}
        </CardContent>
      </Card>
    </div>
  );
}

export function ResourcesScreen({ subjects, resources, onLifecycleTransitioned }: { subjects: StudioSubject[]; resources: LearningResourceResourceCard[]; onLifecycleTransitioned?: () => void | Promise<void> }) {
  const [query, setQuery] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [fileType, setFileType] = useState("");
  const rows = useMemo(() => resources.map((resource) => ({
    resource,
    location: resolveResourceCurriculumLocation(subjects, resource),
  })), [resources, subjects]);
  const normalizedQuery = query.trim().toLocaleLowerCase("vi");
  const visibleRows = rows.filter(({ resource, location }) => {
    if (subjectId && resource.subjectId !== subjectId) return false;
    if (fileType && (resource.fileTypeBadge || resource.selectedFileType) !== fileType) return false;
    if (!normalizedQuery) return true;
    return `${resource.title} ${location.pathLabels.join(" ")}`.toLocaleLowerCase("vi").includes(normalizedQuery);
  });

  return (
    <Card>
      <AuthoringCardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div><AuthoringCardTitle>Kho tài liệu</AuthoringCardTitle><AuthoringCardDescription>Cập nhật thông tin, trạng thái và nơi gắn tài liệu.</AuthoringCardDescription></div>
          <Button variant="contained" startIcon={<LinkIcon className="h-4 w-4" />} className="bg-[var(--erg-blue)] hover:bg-[var(--erg-blue-hover)]">Gắn link tài liệu</Button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Tìm tài liệu hoặc vị trí trong cấu trúc" />
          <AppSelect value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className={inputClassName}><option value="">Tất cả môn học</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.label}</option>)}</AppSelect>
          <AppSelect value={fileType} onChange={(event) => setFileType(event.target.value)} className={inputClassName}><option value="">Tất cả định dạng</option><option value="PDF">PDF</option><option value="PPTX">PPTX</option><option value="VIDEO">Video</option><option value="AUDIO">Audio</option><option value="QUIZ">Bài tập</option></AppSelect>
        </div>
      </AuthoringCardHeader>
      <CardContent>
        {visibleRows.length ? (
          <div className="grid gap-3">
            {visibleRows.map(({ resource, location }) => (
              <div key={resource.id} className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-[var(--erg-blue-light)] text-[var(--erg-blue)]"><LibraryBig className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-slate-950">{resource.title}</div>
                  <div className="mt-1 text-sm text-slate-500">{resource.fileTypeBadge || resource.selectedFileType} · {getPublishStatusLabel(resource.status)}</div>
                  <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1 text-xs font-medium text-slate-600">
                    {location.pathLabels.map((label, index) => (
                      <span className="flex min-w-0 items-center gap-1" key={`${resource.id}-${label}-${index}`}>
                        {index ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" /> : null}
                        <span className="max-w-52 truncate rounded bg-slate-100 px-2 py-1">{label}</span>
                      </span>
                    ))}
                    {!location.isResolved ? <Chip size="small" color="warning" variant="outlined" label="Chưa gắn đủ Level/Chủ đề" /> : null}
                  </div>
                </div>
                <ContentLifecycleControls compact target={{ resourceKind: "CONTENT_ITEM", resourceId: resource.id, currentState: lifecycleStateFromStatus(resource.status), label: resource.title }} onTransitioned={() => onLifecycleTransitioned?.()} />
                <Button variant="outlined" size="small" endIcon={<ArrowUpRight className="h-4 w-4" />}>Cập nhật</Button>
              </div>
            ))}
          </div>
        ) : <EmptyState title={resources.length ? "Không tìm thấy tài liệu" : "Chưa có tài liệu"} description={resources.length ? "Thử đổi từ khóa hoặc bộ lọc môn học, định dạng." : "Tài liệu gắn trong Cấu trúc môn học sẽ tự động xuất hiện tại đây cùng đúng Level và Chủ đề."} />}
      </CardContent>
    </Card>
  );
}

export function PublishScreen({ subjects, resources, questions = [], quizBankItems = [], onLifecycleTransitioned }: { subjects: StudioSubject[]; resources: LearningResourceResourceCard[]; questions?: QuestionBankQuestion[]; quizBankItems?: QuizBankItem[]; onLifecycleTransitioned?: () => void | Promise<void> }) {
  const summary = summarizeLearningResourcePublishReadiness(subjects, resources);
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <PublishCard title="Môn học" value={summary.subjects} description="Sẵn sàng đưa vào catalog." />
      <PublishCard title="Tài liệu" value={summary.resources} description="Đang có trong kho học liệu." />
      <PublishCard title="Cần kiểm tra" value={summary.needsReview} description="Chưa ở trạng thái đã xuất bản." />
      <Card className="lg:col-span-3">
        <AuthoringCardHeader><AuthoringCardTitle>Luồng xuất bản đề xuất</AuthoringCardTitle><AuthoringCardDescription>Tách khỏi màn hình tạo cấu trúc để admin kiểm tra trước khi public.</AuthoringCardDescription></AuthoringCardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <PublishStep icon={<BookOpen className="h-5 w-5" />} title="Môn học" description="Có tên, mô tả và trạng thái." />
          <PublishStep icon={<ListTree className="h-5 w-5" />} title="Cấu trúc" description="Có môn học, level, chủ đề và học liệu." />
          <PublishStep icon={<LinkIcon className="h-5 w-5" />} title="Tài liệu" description="Link tài liệu đã được gắn đúng vị trí." />
          <PublishStep icon={<Settings2 className="h-5 w-5" />} title="Public" description="Kiểm tra visibility trước khi lên web." />
        </CardContent>
      </Card>
      <Card className="lg:col-span-3">
        <AuthoringCardHeader>
          <AuthoringCardTitle>Governance nội dung</AuthoringCardTitle>
          <AuthoringCardDescription>Chuyển trạng thái qua contract lifecycle của BE; FE chỉ hiển thị trạng thái sau khi server xác nhận.</AuthoringCardDescription>
        </AuthoringCardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {[...subjects.map((subject) => ({ id: subject.id, label: subject.label, kind: lifecycleResourceKindForTaxonomyKind("subject")!, status: subject.status })),
            ...resources.map((resource) => ({ id: resource.id, label: resource.title, kind: "CONTENT_ITEM" as const, status: resource.status })),
            ...questions.map((question) => ({ id: question.id, label: question.stem, kind: "QUESTION" as const, status: question.status })),
            ...quizBankItems.map((quiz) => ({ id: quiz.id, label: quiz.title, kind: "QUIZ" as const, status: quiz.status })),
          ].map((item) => (
            <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3" key={`${item.kind}:${item.id}`}>
              <div className="min-w-0"><div className="truncate text-sm font-semibold text-slate-900">{item.label}</div><div className="mt-0.5 text-xs text-slate-500">{item.kind}</div></div>
              <ContentLifecycleControls compact target={{ resourceKind: item.kind, resourceId: item.id, currentState: lifecycleStateFromStatus(item.status), label: item.label }} onTransitioned={() => onLifecycleTransitioned?.()} />
            </div>
          ))}
          {!subjects.length && !resources.length && !questions.length && !quizBankItems.length ? <EmptyState title="Chưa có nội dung" description="Nội dung sẽ xuất hiện sau khi các workspace trả dữ liệu server." /> : null}
        </CardContent>
      </Card>
    </div>
  );
}
