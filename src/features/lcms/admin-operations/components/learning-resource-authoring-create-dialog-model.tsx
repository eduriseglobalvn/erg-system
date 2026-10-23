import BookOpen from "@mui/icons-material/AutoStories";
import FileQuestion from "@mui/icons-material/HelpOutlineOutlined";
import FileText from "@mui/icons-material/Article";
import Folder from "@mui/icons-material/Folder";
import Layers3 from "@mui/icons-material/Layers";
import Presentation from "@mui/icons-material/Slideshow";
import type { TaxonomyRole } from "@/features/lcms/admin-operations/components/learning-resource-authoring-icons";
import type { StudioNode, TaxonomyDialogState } from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import type { ContentDialogOptionId } from "@/features/lcms/admin-operations/utils/learning-resource-content-dialog";
import type { ResolvedTaxonomyMode } from "./learning-resource-authoring-create-dialog-config";

export function getAvailableDialogOptions(state: TaxonomyDialogState, selectedNode?: StudioNode): ContentDialogOptionId[] {
  if (!state) return [];
  if (state.mode === "subject" || state.mode === "level" || state.mode === "topic" || state.mode === "root") return [];
  if (state.initialOption) return [state.initialOption];
  if (selectedNode?.kind === "group") return ["section"];
  if (selectedNode?.kind === "lesson" || selectedNode?.kind === "section" || selectedNode?.kind === "topic") return ["lecture", "exercise", "resource"];
  return ["category"];
}

export function resolveTaxonomyMode(state: TaxonomyDialogState, option: ContentDialogOptionId | null): ResolvedTaxonomyMode {
  if (!state) return null;
  if (state.mode === "subject") return "subject";
  if (state.mode === "level" || state.mode === "root") return "level";
  if (state.mode === "topic") return "topic";
  if (option === "category") return "level";
  if (option === "section") return "topic";
  return null;
}

export function getCanSubmit({
  draftLevelId,
  draftSubjectId,
  label,
  resourceUrl,
  saving,
  selectedExerciseIds,
  selectedOption,
  slidesUrl,
  taxonomyMode,
}: {
  draftLevelId: string;
  draftSubjectId: string;
  label: string;
  resourceUrl: string;
  saving: boolean;
  selectedExerciseIds: string[];
  selectedOption: ContentDialogOptionId | null;
  slidesUrl: string;
  taxonomyMode: ResolvedTaxonomyMode;
}) {
  if (saving) return false;
  if (taxonomyMode) {
    if (!label.trim()) return false;
    if ((taxonomyMode === "level" || taxonomyMode === "topic") && !draftSubjectId) return false;
    if (taxonomyMode === "topic" && !draftLevelId) return false;
    return true;
  }
  if (selectedOption === "lecture") return Boolean(label.trim() && slidesUrl.trim());
  if (selectedOption === "resource") return Boolean(resourceUrl.trim());
  if (selectedOption === "exercise") return selectedExerciseIds.length > 0;
  return false;
}

export function getSubmitHint({
  canSubmit,
  draftLevelId,
  draftSubjectId,
  label,
  resourceUrl,
  selectedExerciseIds,
  selectedOption,
  slidesUrl,
  taxonomyMode,
}: {
  canSubmit: boolean;
  draftLevelId: string;
  draftSubjectId: string;
  label: string;
  resourceUrl: string;
  selectedExerciseIds: string[];
  selectedOption: ContentDialogOptionId | null;
  slidesUrl: string;
  taxonomyMode: ResolvedTaxonomyMode;
}) {
  if (canSubmit) return "";
  if (taxonomyMode === "subject" && !label.trim()) return "Nhập tên môn học để bật nút tạo.";
  if (taxonomyMode === "level" && !draftSubjectId) return "Chọn môn học trước khi tạo level.";
  if (taxonomyMode === "level" && !label.trim()) return "Nhập tên level để bật nút tạo.";
  if (taxonomyMode === "topic" && !draftSubjectId) return "Chọn môn học trước khi tạo chủ đề.";
  if (taxonomyMode === "topic" && !draftLevelId) return "Chọn level cha trước khi tạo chủ đề.";
  if (taxonomyMode === "topic" && !label.trim()) return "Nhập tên chủ đề để bật nút tạo.";
  if (selectedOption === "lecture" && !label.trim()) return "Nhập tên bài giảng.";
  if (selectedOption === "lecture" && !slidesUrl.trim()) return "Dán link Google Slides để thêm bài giảng.";
  if (selectedOption === "resource" && !resourceUrl.trim()) return "Dán link tài liệu để gắn vào chủ đề.";
  if (selectedOption === "exercise" && !selectedExerciseIds.length) return "Chọn ít nhất một bài tập từ Quiz bank.";
  return "Hoàn tất thông tin bắt buộc để tạo mục.";
}

export function getDialogTitle(mode: ResolvedTaxonomyMode, option: ContentDialogOptionId | null) {
  if (mode === "subject") return "Tạo môn học";
  if (mode === "level") return "Tạo level";
  if (mode === "topic") return "Tạo chủ đề";
  if (option === "lecture") return "Thêm bài giảng";
  if (option === "exercise") return "Gắn bài tập từ Quiz bank";
  if (option === "resource") return "Gắn tài liệu";
  return "Chọn loại nội dung";
}

export function getDialogSubtitle(mode: ResolvedTaxonomyMode, option: ContentDialogOptionId | null) {
  if (mode === "subject") return "Môn học là cấp cha cao nhất trong kho học liệu.";
  if (mode === "level") return "Level luôn nằm dưới một môn học, ví dụ IC3 GS6 / Máy tính căn bản.";
  if (mode === "topic") return "Chủ đề luôn nằm dưới một level và là nơi gắn bài giảng, tài liệu, bài tập.";
  if (option === "lecture") return "Bài giảng dùng Google Slides hoặc PPTX để giáo viên mở trực tiếp.";
  if (option === "exercise") return "Bài tập lấy từ Quiz bank, không nhập tay lại trong popup này.";
  if (option === "resource") return "Tài liệu là PDF, Drive, Video, Audio hoặc file tham khảo.";
  return "Chọn đúng loại nội dung cần thêm vào chủ đề hiện tại.";
}

export function getSubmitLabel(mode: ResolvedTaxonomyMode, option: ContentDialogOptionId | null, saving: boolean) {
  if (saving) return "Đang lưu...";
  if (mode === "subject") return "Tạo môn học";
  if (mode === "level") return "Tạo level";
  if (mode === "topic") return "Tạo chủ đề";
  if (option === "lecture") return "Thêm bài giảng";
  if (option === "exercise") return "Gắn bài tập";
  if (option === "resource") return "Gắn tài liệu";
  return "Tạo mới";
}

export function getTaxonomyMeta(mode: TaxonomyRole) {
  if (mode === "subject") return { title: "Môn học", icon: <BookOpen className="h-5 w-5" />, tone: "blue" as const };
  if (mode === "level") return { title: "Level", icon: <Layers3 className="h-5 w-5" />, tone: "blue" as const };
  return { title: "Chủ đề", icon: <Folder className="h-5 w-5" />, tone: "red" as const };
}

export function getOptionMeta(option: ContentDialogOptionId) {
  if (option === "category") return { title: "Level", description: "Tạo level dưới môn học.", icon: <Layers3 className="h-5 w-5" />, tone: "blue" as const };
  if (option === "section") return { title: "Chủ đề", description: "Tạo chủ đề dưới level.", icon: <Folder className="h-5 w-5" />, tone: "red" as const };
  if (option === "lecture") return { title: "Bài giảng", description: "Google Slides hoặc PPTX.", icon: <Presentation className="h-5 w-5" />, tone: "blue" as const };
  if (option === "resource") return { title: "Tài liệu", description: "PDF, Drive, Video, Audio.", icon: <FileText className="h-5 w-5" />, tone: "blue" as const };
  return { title: "Bài tập từ Quiz bank", description: "Train/Test quiz có sẵn.", icon: <FileQuestion className="h-5 w-5" />, tone: "red" as const };
}

export function isLevelNode(node: StudioNode) {
  return node.kind === "group" && node.sourceKind === "category" && Boolean(node.optionId);
}

