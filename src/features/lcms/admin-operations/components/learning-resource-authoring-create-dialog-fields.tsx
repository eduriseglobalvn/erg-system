import Search from "@mui/icons-material/Search";
import TextField from "@mui/material/TextField";
import { AppSelect } from "@/components/ui/app-select";
import { inputClassName } from "@/components/ui/input";
import { getTaxonomyIconColor, getTaxonomyIconId, taxonomyIconColorOptions, TaxonomyIcon, type TaxonomyRole } from "@/features/lcms/admin-operations/components/learning-resource-authoring-icons";
import type { StudioNode, StudioSubject } from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import type { ExerciseLibraryItem } from "@/features/lcms/admin-operations/utils/learning-resource-content-dialog";
import { cn } from "@/lib/utils";
import { quickIconIdsByRole, RESOURCE_BLUE, RESOURCE_BLUE_BORDER, RESOURCE_BORDER } from "./learning-resource-authoring-create-dialog-config";
import { ExerciseOptionCard, Field, ReadOnlyField } from "./learning-resource-authoring-create-dialog-presentation";

export function TaxonomyFields({
  description,
  draftLevelId,
  draftLevelOptions,
  draftSubjectId,
  label,
  role,
  showLevelPicker,
  showSubjectPicker,
  subjects,
  onDescriptionChange,
  onLabelChange,
  onLevelChange,
  onSubjectChange,
}: {
  description: string;
  draftLevelId: string;
  draftLevelOptions: StudioNode[];
  draftSubjectId: string;
  label: string;
  role: TaxonomyRole;
  showLevelPicker: boolean;
  showSubjectPicker: boolean;
  subjects: StudioSubject[];
  onDescriptionChange: (value: string) => void;
  onLabelChange: (value: string) => void;
  onLevelChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
}) {
  const titleLabel = role === "subject" ? "Tên môn học" : role === "level" ? "Tên level" : "Tên chủ đề";
  const titlePlaceholder = role === "subject" ? "Ví dụ: IC3 GS6" : role === "level" ? "Ví dụ: Máy tính căn bản" : "Ví dụ: 01. Quản lý thư mục và tệp";

  return (
    <div className="grid gap-4">
      {showSubjectPicker ? (
        <Field label="Môn học">
          <AppSelect variant="native" className={inputClassName} value={draftSubjectId} onChange={(event) => onSubjectChange(event.target.value)}>
            <option value="">Chọn môn học</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.label}
              </option>
            ))}
          </AppSelect>
        </Field>
      ) : null}

      {showLevelPicker ? (
        <Field label="Level cha">
          <AppSelect variant="native" className={inputClassName} value={draftLevelId} onChange={(event) => onLevelChange(event.target.value)} disabled={!draftSubjectId}>
            <option value="">Chọn level</option>
            {draftLevelOptions.map((level) => (
              <option key={level.optionId ?? level.id} value={level.optionId ?? ""}>
                {level.label}
              </option>
            ))}
          </AppSelect>
          {draftSubjectId && !draftLevelOptions.length ? (
            <p className="text-xs leading-5 text-[#B76E00]">Môn học này chưa có level. Hãy tạo level trước khi tạo chủ đề.</p>
          ) : null}
        </Field>
      ) : null}

      <TextField fullWidth size="small" label={titleLabel} value={label} onChange={(event) => onLabelChange(event.target.value)} placeholder={titlePlaceholder} autoFocus />

      <Field label="Mô tả ngắn">
        <textarea
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="Ghi chú ngắn để giáo viên nhận biết mục này."
          className={cn(inputClassName, "min-h-20 resize-none py-3")}
        />
      </Field>

    </div>
  );
}

export function LectureFields({
  label,
  slidesUrl,
  onLabelChange,
  onSlidesUrlChange,
}: {
  label: string;
  slidesUrl: string;
  onLabelChange: (value: string) => void;
  onSlidesUrlChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-4 pt-1">
      <Field label="Tên bài giảng">
        <input className={inputClassName} value={label} onChange={(event) => onLabelChange(event.target.value)} placeholder="Ví dụ: Bài giảng 01 - Quản lý thư mục" autoFocus />
      </Field>
      <Field label="Link Google Slides">
        <input className={inputClassName} value={slidesUrl} onChange={(event) => onSlidesUrlChange(event.target.value)} placeholder="Dán link edit, publish hoặc embed của Google Slides" />
      </Field>
    </div>
  );
}

export function ExerciseFields({
  description,
  exerciseQuery,
  exercises,
  selectedExerciseIds,
  selectedNode,
  selectedSubject,
  onDescriptionChange,
  onExerciseQueryChange,
  onToggleExercise,
}: {
  description: string;
  exerciseQuery: string;
  exercises: ExerciseLibraryItem[];
  selectedExerciseIds: string[];
  selectedNode?: StudioNode;
  selectedSubject?: StudioSubject;
  onDescriptionChange: (value: string) => void;
  onExerciseQueryChange: (value: string) => void;
  onToggleExercise: (exerciseId: string) => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_220px]">
        <Field label="Tìm trong Quiz bank">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#919EAB]" />
            <input className={cn(inputClassName, "pl-9")} value={exerciseQuery} onChange={(event) => onExerciseQueryChange(event.target.value)} placeholder="Tên quiz, chủ đề, độ khó" autoFocus />
          </div>
        </Field>
        <ReadOnlyField label="Môn học" value={selectedSubject?.label ?? "Chưa chọn"} />
        <ReadOnlyField label="Chủ đề" value={selectedNode?.label ?? "Chưa chọn"} />
      </div>

      <Field label="Ghi chú khi gắn bài tập">
        <textarea
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="Ví dụ: Giao cuối tiết hoặc dùng để luyện tập về nhà."
          className={cn(inputClassName, "min-h-16 resize-none py-3")}
        />
      </Field>

      <div className="overflow-hidden rounded-lg border" style={{ borderColor: RESOURCE_BORDER }}>
        <div className="flex items-center justify-between border-b bg-[#FBFCFE] px-4 py-3" style={{ borderColor: RESOURCE_BORDER }}>
          <div className="text-sm font-bold text-[#1C252E]">Bài tập từ Quiz bank</div>
          <div className="text-xs font-bold text-[#F35C6B]">{selectedExerciseIds.length} đã chọn / {exercises.length} hiển thị</div>
        </div>
        <div className="grid max-h-[320px] gap-2 overflow-y-auto p-3 [scrollbar-gutter:stable]">
          {exercises.length ? (
            exercises.map((item) => (
              <ExerciseOptionCard
                key={item.id}
                item={item}
                selected={selectedExerciseIds.includes(item.id)}
                onToggle={() => onToggleExercise(item.id)}
              />
            ))
          ) : (
            <div className="rounded-lg border border-dashed bg-[#FBFCFE] px-4 py-8 text-center text-sm text-[#637381]" style={{ borderColor: RESOURCE_BORDER }}>
              Không có bài tập từ Quiz bank khớp với bộ lọc hiện tại.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ResourceFields({
  description,
  label,
  resourceFileType,
  resourceTotalSlides,
  resourceUrl,
  selectedPathLabel,
  onDescriptionChange,
  onLabelChange,
  onResourceFileTypeChange,
  onResourceTotalSlidesChange,
  onResourceUrlChange,
}: {
  description: string;
  label: string;
  resourceFileType: string;
  resourceTotalSlides: string;
  resourceUrl: string;
  selectedPathLabel: string;
  onDescriptionChange: (value: string) => void;
  onLabelChange: (value: string) => void;
  onResourceFileTypeChange: (value: string) => void;
  onResourceTotalSlidesChange: (value: string) => void;
  onResourceUrlChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
        <Field label="Tên hiển thị">
          <input className={inputClassName} value={label} onChange={(event) => onLabelChange(event.target.value)} placeholder="Ví dụ: Tài liệu thực hành 01" autoFocus />
        </Field>
        <Field label="Loại tài liệu">
          <AppSelect variant="native" className={inputClassName} value={resourceFileType} onChange={(event) => onResourceFileTypeChange(event.target.value)}>
            <option value="PDF">PDF</option>
            <option value="PPTX">Google Slides / PPTX</option>
            <option value="VIDEO">Video</option>
            <option value="AUDIO">Audio</option>
            <option value="IMAGE">Ảnh</option>
            <option value="ZIP">ZIP</option>
            <option value="HTML5">HTML5</option>
          </AppSelect>
        </Field>
      </div>
      <Field label="Link Google Drive / Google Slides">
        <input className={inputClassName} value={resourceUrl} onChange={(event) => onResourceUrlChange(event.target.value)} placeholder="Dán link share, preview hoặc embed từ Google Drive" />
        <p className="text-xs leading-5 text-[#637381]">Link sẽ được gắn vào: {selectedPathLabel || "vị trí đang chọn"}.</p>
      </Field>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px]">
        <Field label="Mô tả ngắn">
          <textarea value={description} onChange={(event) => onDescriptionChange(event.target.value)} placeholder="Ghi chú cho giáo viên." className={cn(inputClassName, "min-h-20 resize-none py-3")} />
        </Field>
        {resourceFileType === "PPTX" ? (
          <Field label="Tổng số slide">
            <input className={inputClassName} value={resourceTotalSlides} onChange={(event) => onResourceTotalSlidesChange(event.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" placeholder="20" />
          </Field>
        ) : null}
      </div>
    </div>
  );
}

export function QuickIconPicker({
  iconColor,
  iconId,
  role,
  onIconChange,
  onIconColorChange,
}: {
  iconColor: string;
  iconId: string;
  role: TaxonomyRole;
  onIconChange: (value: string) => void;
  onIconColorChange: (value: string) => void;
}) {
  const resolvedIconId = getTaxonomyIconId(iconId, role);
  const resolvedColor = getTaxonomyIconColor(iconColor, role);
  const quickColors = taxonomyIconColorOptions.filter((option) => ["#0F6CBD", "#2563EB", "#F35C6B", "#D73D50", "#475569"].includes(option.value));

  return (
    <Field label="Icon hiển thị">
      <div className="rounded-lg border bg-[#FBFCFE] p-3" style={{ borderColor: RESOURCE_BORDER }}>
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border bg-white" style={{ borderColor: RESOURCE_BORDER }}>
            <TaxonomyIcon iconId={resolvedIconId} iconColor={resolvedColor} role={role} size="md" className="border-0 bg-transparent" />
          </span>
          <div className="grid flex-1 grid-cols-4 gap-2">
            {quickIconIdsByRole[role].map((optionId) => (
              <button
                key={optionId}
                type="button"
                className={cn(
                  "grid h-9 place-items-center rounded-lg border bg-white transition",
                  resolvedIconId === getTaxonomyIconId(optionId, role) ? "ring-2 ring-[#0F6CBD]/25" : "hover:bg-[#F4F6F8]",
                )}
                style={{ borderColor: resolvedIconId === getTaxonomyIconId(optionId, role) ? RESOURCE_BLUE_BORDER : RESOURCE_BORDER }}
                onClick={() => onIconChange(optionId)}
                aria-label={`Chọn icon ${optionId}`}
              >
                <TaxonomyIcon iconId={optionId} iconColor={resolvedColor} role={role} size="md" className="border-0 bg-transparent" />
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {quickColors.map((option) => (
            <button
              key={option.value}
              type="button"
              className="h-7 w-7 rounded-full border border-white shadow-sm ring-offset-2 transition"
              style={{
                backgroundColor: option.value,
                boxShadow: resolvedColor === option.value ? `0 0 0 2px white, 0 0 0 4px ${RESOURCE_BLUE}` : undefined,
              }}
              title={option.label}
              aria-label={`Chọn màu icon ${option.label}`}
              onClick={() => onIconColorChange(option.value)}
            />
          ))}
        </div>
      </div>
    </Field>
  );
}

