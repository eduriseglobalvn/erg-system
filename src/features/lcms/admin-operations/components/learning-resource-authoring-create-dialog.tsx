import { useEffect, useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { ChevronLeft, Search } from "@/components/mui-icon-shim";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, inputClassName } from "@/components/ui/input";
import {
  ContentLinkField,
  ContentTextFields,
  Field,
  StatusSelectField,
} from "@/features/lcms/admin-operations/components/learning-resource-authoring-fields";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TsForm } from "@/components/ui/tanstack-form";
import {
  createLearningResourceTaxonomy,
  uploadLearningResourceResource,
  type CreateTaxonomyPayload,
} from "@/features/lcms/admin-operations/api/learning-resource-authoring-api";
import { mockExerciseLibrary } from "@/features/lcms/admin-operations/api/mock-exercise-library";
import {
  filterMockExercises,
  getAvailableContentOptions,
  isGoogleSlidesUrl,
  normalizeGoogleSlidesUrl,
  normalizeGoogleViewerUrl,
  type ContentDialogOptionId,
} from "@/features/lcms/admin-operations/utils/learning-resource-content-dialog";
import type {
  LocalContentItem,
  StudioNode,
  StudioSubject,
  TaxonomyCreateKind,
  TaxonomyCreateMode,
  TaxonomyDialogState,
} from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import {
  apiKindForNodeKind,
  buildResourceLocation,
  defaultStatusForOption,
  getAddContentOptionMeta,
  normalizeTaxonomyOption,
  parsePositiveInteger,
  pathLabel,
} from "@/features/lcms/admin-operations/components/learning-resource-authoring-utils";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import { cn } from "@/lib/utils";
import { AppSelect } from "@/components/ui/app-select";

export function TaxonomyCreateDialog({
  state,
  selectedSubject,
  selectedNode,
  selectedPath,
  onClose,
  onCreateLocalContent,
  onCreateLecture,
  onUploadResource,
  onCreated,
}: {
  state: TaxonomyDialogState;
  selectedSubject?: StudioSubject;
  selectedNode?: StudioNode;
  selectedPath: StudioNode[];
  onClose: () => void;
  onCreateLocalContent: (items: LocalContentItem[]) => Promise<void>;
  onCreateLecture: (payload: {
    title: string;
    subtitle?: string;
    description?: string;
    thumbnailUrl?: string;
    upstreamUrl?: string;
    programSlug: string;
    subjectId: string;
    categoryId: string;
    sectionId?: string;
    bookSeriesId?: string;
    topicId?: string;
    documentTypeId?: string;
    selectedFileType: "PPTX";
    totalSlides?: number;
    status: string;
    visibility: string;
    canDownload: boolean;
  }) => Promise<void>;
  onUploadResource: () => Promise<void>;
  onCreated: (result: { mode: TaxonomyCreateMode; kind: TaxonomyCreateKind; id: string }) => Promise<void>;
}) {
  const [step, setStep] = useState<"pick" | "details">("pick");
  const [selectedOption, setSelectedOption] = useState<ContentDialogOptionId | null>(null);
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<TaxonomyCreateKind>("category");
  const [slidesUrl, setSlidesUrl] = useState("");
  const [slidesTotal, setSlidesTotal] = useState("");
  const [exerciseQuery, setExerciseQuery] = useState("");
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [resourceFileType, setResourceFileType] = useState("PDF");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceTotalSlides, setResourceTotalSlides] = useState("");
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const paceStateUpdate = usePacedStateBatch();
  const form = useForm({
    defaultValues: {
      description,
      label,
      resourceUrl,
      slidesUrl,
      status,
    },
    onSubmit: () => handleSubmit(),
  });

  const open = Boolean(state);
  const isSubject = state?.mode === "subject";
  const title = isSubject
    ? "Tạo môn học"
    : state?.mode === "root"
      ? "Tạo nhóm học liệu"
      : selectedNode?.kind === "group"
        ? "Tạo bài học"
        : selectedNode?.kind === "lesson"
          ? "Thêm tài liệu vào bài học"
          : "Thêm nội dung bên trong";
  const descriptionText = isSubject
    ? "Môn học là cấp đầu tiên. Sau khi tạo, bạn sẽ xây dựng các nhóm học liệu, chủ đề và unit bên trong."
    : state?.mode === "root"
      ? "Tạo một nhóm học liệu ở cấp đầu tiên dưới môn học, ví dụ Level 1, Level 2 hoặc Học phần bổ trợ."
      : selectedNode?.kind === "group"
        ? "Tạo bài học nằm bên trong nhóm học liệu đang chọn."
        : selectedNode?.kind === "lesson"
          ? "Chọn loại nội dung cần gắn vào bài học: bài giảng, bài tập hoặc tài liệu."
          : "Nội dung mới sẽ nằm bên trong vị trí đang chọn.";
  const selectedContentNodeKind =
    selectedNode?.kind === "group" || selectedNode?.kind === "lesson" || selectedNode?.kind === "folder" ? selectedNode.kind : undefined;
  const availableOptions = useMemo(
    () => getAvailableContentOptions(state?.mode ?? "subject", selectedContentNodeKind),
    [selectedContentNodeKind, state?.mode],
  );
  const selectedOptionMeta = selectedOption ? getAddContentOptionMeta(selectedOption) : null;
  const resourceLocation = buildResourceLocation(selectedPath);
  const filteredExercises = filterMockExercises(mockExerciseLibrary, {
    query: exerciseQuery,
    subjectId: selectedSubject?.id,
    subjectLabel: selectedSubject?.label,
    topicLabel: selectedNode?.kind === "group" ? selectedNode.label : undefined,
    sectionLabel: selectedNode?.kind === "lesson" ? selectedNode.label : undefined,
  });

  useEffect(() => {
    if (!open) return;
    paceStateUpdate(() => {
      const autoOption = state?.initialOption || (isSubject ? "category" : availableOptions.length === 1 ? availableOptions[0] : null);
      setStep(autoOption ? "details" : "pick");
      setSelectedOption(autoOption);
      setLabel("");
      setDescription("");
      setKind(autoOption === "section" ? "section" : "category");
      setSlidesUrl("");
      setSlidesTotal("");
      setExerciseQuery("");
      setSelectedExerciseIds([]);
      setResourceFileType("PDF");
      setResourceUrl("");
      setResourceTotalSlides("");
      setStatus(defaultStatusForOption(autoOption, isSubject));
      setError("");
      setSaving(false);
    });
  }, [availableOptions, isSubject, open, paceStateUpdate, selectedNode?.kind, state?.mode, state?.initialOption]);

  async function handleSubmit() {
    setSaving(true);
    setError("");
    try {
      if (selectedOption === "lecture") {
        const trimmedLabel = label.trim();
        const normalizedSlidesUrl = normalizeGoogleSlidesUrl(slidesUrl);
        if (!trimmedLabel) throw new Error("Vui lòng nhập tên bài giảng.");
        if (!selectedSubject || !selectedNode?.optionId) throw new Error("Vui lòng chọn lesson hoặc bài học trước.");
        if (!normalizedSlidesUrl) throw new Error("Vui lòng dán link Google Slides.");
        const parsedTotalSlides = parsePositiveInteger(slidesTotal);
        if (slidesTotal.trim() && !parsedTotalSlides) throw new Error("Tổng số slide phải là số nguyên lớn hơn 0.");
        const resourceLocation = buildResourceLocation(selectedPath);
        if (!resourceLocation.categoryId) throw new Error("Vị trí hiện tại chưa xác định được nhóm học liệu để gắn bài giảng.");
        await onCreateLecture({
          title: trimmedLabel,
          subtitle: "Google Slides",
          description: description.trim(),
          upstreamUrl: normalizedSlidesUrl,
          programSlug: selectedSubject.id,
          subjectId: selectedSubject.id,
          categoryId: resourceLocation.categoryId,
          sectionId: resourceLocation.sectionId,
          bookSeriesId: resourceLocation.bookSeriesId,
          topicId: resourceLocation.topicId,
          documentTypeId: "lecture",
          selectedFileType: "PPTX",
          totalSlides: parsedTotalSlides,
          status,
          visibility: status === "hidden" ? "private" : "public",
          canDownload: false,
        });
        return;
      }

      if (selectedOption === "exercise") {
        const parentOptionId = selectedNode?.optionId;
        if (!selectedSubject || !parentOptionId) throw new Error("Vui lòng chọn lesson hoặc bài học trước.");
        if (!selectedExerciseIds.length) throw new Error("Vui lòng chọn ít nhất một bài tập.");
        const selectedExercises = filteredExercises.filter((item) => selectedExerciseIds.includes(item.id));
        await onCreateLocalContent(
          selectedExercises.map((item) => ({
            id: `exercise-${item.id}-${Date.now()}`,
            kind: "exercise",
            subjectId: selectedSubject.id,
            parentNodeId: selectedNode.id,
            parentOptionId,
            title: item.title,
            description: description.trim() || `${item.topicLabel ?? ""} · ${item.sectionLabel ?? ""}`.replace(/^ · | · $/g, ""),
            topicLabel: item.topicLabel,
            sectionLabel: item.sectionLabel,
            questionCount: item.questionCount,
            durationMinutes: item.durationMinutes,
            status,
          })),
        );
        return;
      }

      if (selectedOption === "resource") {
        const normalizedResourceUrl = normalizeGoogleViewerUrl(resourceUrl);
        if (!selectedSubject || !selectedNode) throw new Error("Vui lòng chọn vị trí cần gắn tài liệu.");
        if (!resourceLocation.categoryId) throw new Error("Vị trí hiện tại chưa xác định được nhóm học liệu để gắn tài liệu.");
        if (!normalizedResourceUrl) throw new Error("Vui lòng dán link Google Drive/Google Slides.");
        const parsedTotalSlides = parsePositiveInteger(resourceTotalSlides);
        if (resourceFileType === "PPTX" && resourceTotalSlides.trim() && !parsedTotalSlides) throw new Error("Tổng số slide phải là số nguyên lớn hơn 0.");
        await uploadLearningResourceResource({
          title: label.trim() || "Tài liệu Google Drive",
          description: description.trim(),
          selectedFileType: resourceFileType,
          subjectId: selectedSubject.id,
          programSlug: selectedSubject.id,
          categoryId: resourceLocation.categoryId,
          sectionId: resourceLocation.sectionId,
          bookSeriesId: resourceLocation.bookSeriesId,
          topicId: resourceLocation.topicId,
          documentTypeId: resourceFileType,
          status,
          visibility: status === "hidden" ? "private" : "public",
          upstreamUrl: normalizedResourceUrl,
          totalSlides: parsedTotalSlides,
          canDownload: resourceFileType !== "PPTX",
        });
        await onUploadResource();
        return;
      }

      const resolvedKind = isSubject ? "category" : kind;
      const trimmedLabel = label.trim();
      if (!trimmedLabel) {
        throw new Error(isSubject ? "Vui lòng nhập tên môn học." : "Vui lòng nhập tên.");
      }
      if (!isSubject && !selectedSubject) {
        throw new Error("Vui lòng chọn môn học trước.");
      }
      if (state?.mode === "child" && !selectedNode) {
        throw new Error("Vui lòng chọn mục cha trước.");
      }

      const payload: CreateTaxonomyPayload = {
        label: trimmedLabel,
        description: description.trim(),
        status,
      };

      if (!isSubject && selectedSubject) {
        payload.subjectId = selectedSubject.id;
      }

      if (state?.mode === "child" && selectedNode?.optionId) {
        if (resolvedKind === "category") {
          payload.parentId = selectedNode.optionId;
        }
        if (resolvedKind === "section") {
          const currentLocation = buildResourceLocation(selectedPath);
          if (!currentLocation.categoryId) {
            throw new Error("Nhóm học liệu hiện tại chưa xác định được category gốc để tạo bài học.");
          }
          payload.categoryId = currentLocation.categoryId;
          if (selectedNode.sourceKind === "topic" && selectedNode.optionId) payload.topicId = selectedNode.optionId;
          if (selectedNode.sourceKind === "bookSeries" && selectedNode.optionId) payload.bookSeriesId = selectedNode.optionId;
        }
      }

      const created = normalizeTaxonomyOption(
        await createLearningResourceTaxonomy(isSubject ? "subjects" : apiKindForNodeKind(resolvedKind), payload),
      );
      if (!created?.id) {
        throw new Error("BE đã tạo dữ liệu nhưng không trả về id hợp lệ.");
      }
      await onCreated({ mode: state?.mode ?? "subject", kind: resolvedKind, id: created.id });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể tạo mục. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  function toggleExercise(exerciseId: string) {
    setSelectedExerciseIds((current) => (current.includes(exerciseId) ? current.filter((item) => item !== exerciseId) : [...current, exerciseId]));
  }

  function handleLectureTitleChange(value: string) {
    if (isGoogleSlidesUrl(value)) {
      setSlidesUrl(value);
      setLabel("");
      return;
    }
    setLabel(value);
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <DialogContent className="max-w-[calc(100vw-2rem)] lg:w-[60vw] lg:max-w-[60vw]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{descriptionText}</DialogDescription>
        </DialogHeader>

        <TsForm
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
          className="space-y-4"
        >
          {!isSubject ? (
            <div className="rounded-lg border border-[#b8d6fa] bg-[var(--erg-blue-light)] p-4">
              <div className="text-xs font-semibold text-slate-500">Vị trí trong cấu trúc</div>
              <div className="mt-2 font-semibold text-slate-950">{selectedSubject?.label || "Chưa chọn môn"}</div>
              {state?.mode === "child" ? (
                <div className="mt-1 text-sm text-slate-600">
                  Bên trong: <span className="font-semibold text-[var(--erg-blue)]">{selectedNode?.label || "Chưa chọn"}</span>
                </div>
              ) : (
                <div className="mt-1 text-sm text-slate-600">Nằm ở cấp đầu tiên của môn học.</div>
              )}
            </div>
          ) : null}

          {step === "pick" ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                {availableOptions.map((optionId) => {
                  const option = getAddContentOptionMeta(optionId);
                  return (
                    <button
                      key={optionId}
                      type="button"
                      onClick={() => {
                        setSelectedOption(optionId);
                        if (optionId === "category" || optionId === "section") {
                          setKind(optionId);
                        }
                        setStep("details");
                      }}
                      className="rounded-lg border border-slate-200 bg-white p-4 text-left hover:border-[var(--erg-blue)] hover:bg-[var(--erg-blue-light)]"
                    >
                      <span className="flex items-start gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--erg-blue-light)] text-[var(--erg-blue)]">{option.icon}</span>
                        <span className="min-w-0">
                          <span className="block font-semibold text-slate-950">{option.title}</span>
                          <span className="mt-1 block text-sm leading-6 text-slate-500">{option.description}</span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-500">
                Với `bài giảng`, popup sẽ ưu tiên link Google Slides. Với `bài tập`, giao diện hiện đang dùng danh sách mock để chờ nối DB thật.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {!isSubject && selectedOptionMeta ? (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-[var(--erg-blue)]">{selectedOptionMeta.icon}</span>
                    <div>
                      <div className="font-semibold text-slate-950">{selectedOptionMeta.title}</div>
                      <div className="text-sm text-slate-500">{selectedOptionMeta.description}</div>
                    </div>
                  </div>
                  {availableOptions.length > 1 ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => setStep("pick")}>
                      <ChevronLeft className="h-4 w-4" />
                      Chọn lại
                    </Button>
                  ) : null}
                </div>
              ) : null}

              {selectedOption === "lecture" ? (
                <>
                  <ContentTextFields
                    titleLabel="Tên bài giảng"
                    titlePlaceholder="Ví dụ: Bài giảng Bài 01"
                    titleValue={label}
                    onTitleChange={handleLectureTitleChange}
                    descriptionLabel="Mô tả ngắn"
                    descriptionPlaceholder="Ví dụ: Slide dùng cho tiết mở đầu, có note cho giáo viên"
                    descriptionValue={description}
                    onDescriptionChange={setDescription}
                    autoFocus
                  />
                  <ContentLinkField
                    label="Link Google Slides"
                    value={slidesUrl}
                    onChange={setSlidesUrl}
                    placeholder="Dán link edit, publish hoặc embed của Google Slides"
                    hint="Popup này lưu link Google Slides vào asset, không upload file thật lên server."
                  />
                  <Field label="Tổng số slide">
                    <Input
                      value={slidesTotal}
                      onChange={(event) => setSlidesTotal(event.target.value.replace(/[^\d]/g, ""))}
                      inputMode="numeric"
                      placeholder="Ví dụ: 20"
                    />
                    <p className="text-xs leading-5 text-slate-500">
                      Dùng cho popup xác nhận khi giáo viên back hoặc tắt bài trình chiếu.
                    </p>
                  </Field>
                  <StatusSelectField value={status} onChange={setStatus} />
                </>
              ) : null}

              {selectedOption === "exercise" ? (
                <>
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_220px]">
                    <Field label="Tìm bài tập">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input value={exerciseQuery} onChange={(event) => setExerciseQuery(event.target.value)} placeholder="Tìm theo tên, chủ đề hoặc độ khó" autoFocus />
                      </div>
                    </Field>
                    <Field label="Môn học">
                      <Input value={selectedSubject?.label ?? "Chưa chọn"} readOnly />
                    </Field>
                    <Field label="Ngữ cảnh">
                      <Input value={selectedNode?.label ?? "Chưa chọn"} readOnly />
                    </Field>
                  </div>
                  <ContentTextFields
                    titleLabel="Tên hiển thị"
                    titlePlaceholder="Ví dụ: Bài tập luyện cuối tiết"
                    titleValue={label}
                    onTitleChange={setLabel}
                    descriptionLabel="Ghi chú cho lần gắn này"
                    descriptionPlaceholder="Ví dụ: Giao cuối tiết hoặc dùng để luyện tập về nhà"
                    descriptionValue={description}
                    onDescriptionChange={setDescription}
                    autoFocus
                  />
                  <StatusSelectField value={status} onChange={setStatus} />
                  <div className="rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <div className="font-semibold text-slate-950">Danh sách bài tập mock</div>
                      <Badge tone="outline">{filteredExercises.length} bài</Badge>
                    </div>
                    <div className="grid max-h-[320px] gap-2 overflow-y-auto p-3">
                      {filteredExercises.length ? (
                        filteredExercises.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleExercise(item.id)}
                            className={cn(
                              "rounded-lg border p-3 text-left",
                              selectedExerciseIds.includes(item.id) ? "border-[var(--erg-blue)] bg-[var(--erg-blue-light)]" : "border-slate-200 bg-white hover:border-slate-300",
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-950">{item.title}</div>
                                <div className="mt-1 text-xs leading-5 text-slate-500">
                                  {item.topicLabel} {item.sectionLabel ? `· ${item.sectionLabel}` : ""}
                                </div>
                              </div>
                              <input type="checkbox" readOnly checked={selectedExerciseIds.includes(item.id)} className="mt-1 h-4 w-4 accent-[var(--erg-blue)]" />
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <Badge tone="secondary">{item.difficulty}</Badge>
                              <span>{item.questionCount} câu hỏi</span>
                              <span>{item.durationMinutes} phút</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                          Không có bài tập mock khớp với bộ lọc hiện tại.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : null}

              {selectedOption === "resource" ? (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Loại tài liệu">
                      <AppSelect className={inputClassName} value={resourceFileType} onChange={(event) => setResourceFileType(event.target.value)}>
                        <option value="PDF">PDF / Giáo trình</option>
                        <option value="PPTX">Bài giảng điện tử</option>
                        <option value="VIDEO">Video</option>
                        <option value="AUDIO">Audio</option>
                        <option value="IMAGE">Ảnh / thumbnail</option>
                        <option value="ZIP">Gói học liệu ZIP</option>
                        <option value="HTML5">HTML5</option>
                      </AppSelect>
                    </Field>
                    <div className="md:col-span-2">
                      <ContentTextFields
                        titleLabel="Tên hiển thị"
                        titlePlaceholder="Ví dụ: Unit 1 - Lesson 1"
                        titleValue={label}
                        onTitleChange={setLabel}
                        descriptionLabel="Mô tả ngắn"
                        descriptionPlaceholder="Ví dụ: Tài liệu dùng cho tiết mở đầu hoặc bài luyện tập"
                        descriptionValue={description}
                        onDescriptionChange={setDescription}
                        autoFocus
                      />
                    </div>
                    <div className="md:col-span-2">
                      <ContentLinkField
                        label="Link Google Drive / Google Slides"
                        value={resourceUrl}
                        onChange={setResourceUrl}
                        placeholder="Dán link share, preview hoặc embed từ Google Drive"
                        hint={`Link sẽ được lưu vào asset của tài liệu tại ${pathLabel(selectedSubject?.label ?? "", selectedPath)}. Không upload file thật lên server.`}
                      />
                    </div>
                    {resourceFileType === "PPTX" ? (
                      <div className="md:col-span-2">
                        <Field label="Tổng số slide">
                          <Input
                            value={resourceTotalSlides}
                            onChange={(event) => setResourceTotalSlides(event.target.value.replace(/[^\d]/g, ""))}
                            inputMode="numeric"
                            placeholder="Ví dụ: 20"
                          />
                          <p className="text-xs leading-5 text-slate-500">
                            Dùng cho popup đánh dấu khi giáo viên back/tắt trình chiếu.
                          </p>
                        </Field>
                      </div>
                    ) : null}
                    <div className="md:col-span-2">
                      <StatusSelectField value={status} onChange={setStatus} />
                    </div>
                  </div>
                </>
              ) : null}

              {(!selectedOption || selectedOption === "category" || selectedOption === "section" || isSubject) ? (
                <>
                  <ContentTextFields
                    titleLabel={isSubject ? "Tên môn học" : "Tên hiển thị"}
                    titlePlaceholder={isSubject ? "Ví dụ: IC3 GS6" : kind === "category" ? "Ví dụ: Chủ đề 1, Học phần bổ trợ" : "Ví dụ: Bài 01. Làm quen với máy tính"}
                    titleValue={label}
                    onTitleChange={setLabel}
                    descriptionLabel="Mô tả ngắn"
                    descriptionPlaceholder="Giúp giáo viên hiểu mục này dùng để làm gì"
                    descriptionValue={description}
                    onDescriptionChange={setDescription}
                    autoFocus
                  />

                  {!isSubject ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      Đang tạo: <b>{kind === "category" ? "Nhóm học liệu" : "Bài học"}</b>. Loại này được quyết định theo vị trí đang chọn trong cây.
                    </div>
                  ) : null}
                  <StatusSelectField value={status} onChange={setStatus} taxonomy />
                </>
              ) : null}
            </div>
          )}

          {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Hủy
            </Button>
            {step === "details" ? (
              <Button
                type="submit"
                disabled={
                  saving ||
                  (selectedOption === "exercise"
                    ? !selectedExerciseIds.length
                    : selectedOption === "resource"
                      ? !resourceUrl.trim()
                    : selectedOption === "lecture"
                      ? !label.trim() || !slidesUrl.trim()
                      : !label.trim())
                }
                className="bg-[var(--erg-blue)] hover:bg-[var(--erg-blue-hover)]"
              >
                {saving
                  ? "Đang lưu..."
                  : selectedOption === "lecture"
                    ? "Thêm bài giảng"
                    : selectedOption === "exercise"
                      ? "Gắn bài tập"
                      : selectedOption === "resource"
                        ? "Gắn link tài liệu"
                        : selectedOption === "category"
                          ? "Tạo nhóm học liệu"
                          : selectedOption === "section"
                            ? "Tạo bài học"
                            : "Tạo mới"}
              </Button>
            ) : null}
          </DialogFooter>
        </TsForm>
      </DialogContent>
    </Dialog>
  );
}
