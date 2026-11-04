import Button from "@mui/material/Button";
import { ErgSelect } from "@/components/erg-mui";
import { ArrowLeft, CheckCircle2, FileText, Users } from "lucide-react";
import type { ExerciseDifficulty, ExerciseStatus, ExerciseType } from "../exercise-bank-model";
import type { BankSubject, CreateExerciseStep } from "./types";

export function SetupForm({
  title,
  setTitle,
  error,
  setError,
  handleSubmit,
  subjectName,
  subjects,
  selectedSubjectId,
  handleSubjectChange,
  level,
  setLevel,
  subjectLevels,
  type,
  setType,
  difficulty,
  setDifficulty,
  classTargets,
  setClassTargets,
  status,
  setStatus,
  selectedQuestionIds,
  setActiveStep,
}: {
  title: string;
  setTitle: (title: string) => void;
  error: string;
  setError: (error: string) => void;
  handleSubmit: () => void;
  subjectName: string;
  subjects: BankSubject[];
  selectedSubjectId: string;
  handleSubjectChange: (id: string) => void;
  level: string;
  setLevel: (level: string) => void;
  subjectLevels: Array<{ id: string; label: string }>;
  type: ExerciseType;
  setType: (type: ExerciseType) => void;
  difficulty: ExerciseDifficulty;
  setDifficulty: (difficulty: ExerciseDifficulty) => void;
  classTargets: string;
  setClassTargets: (targets: string) => void;
  status: ExerciseStatus;
  setStatus: (status: ExerciseStatus) => void;
  selectedQuestionIds: string[];
  setActiveStep: (step: CreateExerciseStep) => void;
}) {
  return (
                <div className="lg:col-span-7 p-4 sm:p-6 lg:p-7 space-y-4 sm:space-y-5 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white">
                  {/* TIÊU ĐỀ SECTION */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="text-[14px] font-bold text-slate-900">
                        Thông tin cấu hình bài tập
                      </h3>
                      <p className="text-[12px] text-slate-500 mt-0.5">
                        Thiết lập thông số cơ bản cho bài luyện tập hoặc đề thi
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-50 text-[#0F6CBD] px-2.5 py-0.5 text-[11px] font-bold border border-blue-200/80">
                      Bước 2 / 2
                    </span>
                  </div>

                  {/* KHỐI 1: TÊN BÀI TẬP & GỢI Ý NHANH */}
                  <div className="space-y-1.5">
                    <label className="flex items-center justify-between text-[12px] font-bold text-slate-800">
                      <span>
                        Tên bài tập <span className="text-rose-500">*</span>
                      </span>
                      <span className="text-[11px] font-normal text-slate-400">
                        {title.length}/120 ký tự
                      </span>
                    </label>
                    <div className="relative">
                      <FileText className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => {
                          setTitle(e.target.value);
                          if (error) setError("");
                        }}
                        maxLength={120}
                        placeholder="vd: IC3 GS6 - Kiểm tra kiến thức máy tính căn bản"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSubmit();
                          }
                        }}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-[13px] text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-[#0F6CBD] focus:ring-2 focus:ring-[#0F6CBD]/10 font-medium"
                        autoFocus
                      />
                    </div>
                    {/* Gợi ý mẫu */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px]">
                      <span className="text-slate-500 font-medium">Gợi ý nhanh:</span>
                      {["Kiểm tra 15 phút", "Ôn tập định kỳ", "Bài tập cuối tuần"].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setTitle(`${subjectName} - ${preset}`)}
                          className="rounded-md border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 hover:text-[#0F6CBD] px-2 py-0.5 text-slate-600 transition-colors cursor-pointer"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* KHỐI 2: MÔN HỌC & CẤP ĐỘ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-[12px] font-bold text-slate-800">
                        Môn học
                      </label>
                      <ErgSelect
                        size="small"
                        value={selectedSubjectId}
                        onChange={(e) => handleSubjectChange(String(e.target.value))}
                        options={subjects.map((sub) => ({ value: sub.id, label: sub.label }))}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] font-bold text-slate-800">
                        Cấp độ (Level)
                      </label>
                      <ErgSelect
                        size="small"
                        value={level}
                        onChange={(e) => setLevel(String(e.target.value))}
                        options={subjectLevels.map((lvl) => ({ value: lvl.label, label: lvl.label }))}
                      />
                    </div>
                  </div>

                  {/* KHỐI 3: PHÂN LOẠI & ĐỘ KHÓ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-[12px] font-bold text-slate-800">
                        Phân loại bài
                      </label>
                      <ErgSelect
                        size="small"
                        value={type}
                        onChange={(e) => setType(e.target.value as ExerciseType)}
                        options={[
                          { value: "quiz", label: "Trắc nghiệm" },
                          { value: "practice", label: "Tự luyện" },
                          { value: "project", label: "Dự án" },
                          { value: "exam", label: "Đề kiểm tra" },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] font-bold text-slate-800">
                        Độ khó mục tiêu
                      </label>
                      <ErgSelect
                        size="small"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as ExerciseDifficulty)}
                        options={[
                          { value: "easy", label: "Cơ bản (Dễ)" },
                          { value: "medium", label: "Nâng cao (Trung bình)" },
                          { value: "hard", label: "Thử thách (Khó)" },
                        ]}
                      />
                    </div>
                  </div>

                  {/* KHỐI 4: LỚP ÁP DỤNG & TRẠNG THÁI PHÁT HÀNH */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-[12px] font-bold text-slate-800">
                        Lớp / nhóm phù hợp
                      </label>
                      <div className="relative">
                        <Users className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={classTargets}
                          onChange={(e) => setClassTargets(e.target.value)}
                          placeholder="vd: Lớp 6A1, Nhóm bồi dưỡng"
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-[13px] text-slate-900 outline-none transition-colors hover:border-slate-300 focus:border-[#0F6CBD] focus:ring-2 focus:ring-[#0F6CBD]/10 font-medium"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] font-bold text-slate-800">
                        Trạng thái phát hành
                      </label>
                      <ErgSelect
                        size="small"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as ExerciseStatus)}
                        options={[
                          { value: "published", label: "Đã xuất bản (Sẵn sàng giao)" },
                          { value: "draft", label: "Bản nháp (Đang biên soạn)" },
                        ]}
                      />
                    </div>
                  </div>

                  {/* BANNER THÔNG TIN TIẾN ĐỘ CÂU HỎI */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <span className="block text-[13px] font-bold text-slate-900">
                          {selectedQuestionIds.length > 0
                            ? `Đã bốc ${selectedQuestionIds.length} câu hỏi từ Ngân hàng (${subjectName})`
                            : `Chưa bốc câu hỏi từ Ngân hàng (${subjectName})`}
                        </span>
                        <span className="block text-[11.5px] text-slate-600">
                          {selectedQuestionIds.length > 0
                            ? `Thời lượng làm bài dự kiến: ~${Math.round(selectedQuestionIds.length * 2)} phút`
                            : "Vui lòng chọn ít nhất 1 câu hỏi để tạo bài tập"}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={() => setActiveStep("pick")}
                      startIcon={<ArrowLeft className="h-4 w-4" />}
                      sx={{
                        height: 34,
                        borderRadius: "8px",
                        px: 2,
                        fontSize: "12px",
                        fontWeight: 600,
                        textTransform: "none",
                        borderColor: "#A7F3D0",
                        color: "#047857",
                        bgcolor: "#FFFFFF",
                        "&:hover": { bgcolor: "#F0FDF4", borderColor: "#6EE7B7" },
                      }}
                    >
                      Chọn thêm / Đổi câu
                    </Button>
                  </div>
                </div>
  );
}
