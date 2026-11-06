import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import DescriptionIcon from "@mui/icons-material/Description";
import GroupIcon from "@mui/icons-material/Group";
import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { ErgSelect, ErgTextField } from "@/components/erg-mui/erg-form";
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
    <Box
      sx={{
        p: { xs: 2, sm: 3, lg: 3.5 },
        display: "flex",
        flexDirection: "column",
        gap: { xs: 2, sm: 2.5 },
        borderBottom: { xs: 1, lg: 0 },
        borderRight: { lg: 1 },
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      {/* TIÊU ĐỀ SECTION */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1, borderBottom: 1, borderColor: "divider" }}>
        <Box>
          <Typography variant="subtitle2" component="h3" sx={{ fontWeight: "fontWeightBold" }}>
            Thông tin cấu hình bài tập
          </Typography>
          <Typography variant="caption" component="p" sx={{ color: "text.secondary", mt: 0.25 }}>
            Thiết lập thông số cơ bản cho bài luyện tập hoặc đề thi
          </Typography>
        </Box>
        <ErgStatusChip dot={false} label="Bước 2 / 2" tone="info" />
      </Box>

      {/* KHỐI 1: TÊN BÀI TẬP & GỢI Ý NHANH */}
      <Box sx={{ display: "grid", gap: 0.75 }}>
        <Typography component="label" variant="caption" sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: "fontWeightBold" }}>
          <span>
            Tên bài tập <Box component="span" sx={{ color: "error.main" }}>*</Box>
          </span>
          <Box component="span" sx={{ color: "text.secondary", fontWeight: "fontWeightRegular" }}>
            {title.length}/120 ký tự
          </Box>
        </Typography>
        <ErgTextField
          compact
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error) setError("");
          }}
          placeholder="vd: IC3 GS6 - Kiểm tra kiến thức máy tính căn bản"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
          autoFocus
          slotProps={{
            htmlInput: { maxLength: 120 },
            input: { startAdornment: <InputAdornment position="start"><DescriptionIcon fontSize="small" /></InputAdornment> },
          }}
        />
        {/* Gợi ý mẫu */}
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75, pt: 0.25 }}>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: "fontWeightMedium" }}>Gợi ý nhanh:</Typography>
          {["Kiểm tra 15 phút", "Ôn tập định kỳ", "Bài tập cuối tuần"].map((preset) => (
            <ErgButton
              key={preset}
              type="button"
              variant="outlined"
              size="small"
              color="inherit"
              onClick={() => setTitle(`${subjectName} - ${preset}`)}
              sx={{ py: 0, typography: "caption", borderColor: "divider", color: "text.secondary" }}
            >
              + {preset}
            </ErgButton>
          ))}
        </Box>
      </Box>

      {/* KHỐI 2: MÔN HỌC & CẤP ĐỘ */}
      <Box sx={fieldGridSx}>
        <Box>
          <FieldLabel>Môn học</FieldLabel>
          <ErgSelect
            size="small"
            value={selectedSubjectId}
            onChange={(e) => handleSubjectChange(String(e.target.value))}
            options={subjects.map((sub) => ({ value: sub.id, label: sub.label }))}
          />
        </Box>
        <Box>
          <FieldLabel>Cấp độ (Level)</FieldLabel>
          <ErgSelect
            size="small"
            value={level}
            onChange={(e) => setLevel(String(e.target.value))}
            options={subjectLevels.map((lvl) => ({ value: lvl.label, label: lvl.label }))}
          />
        </Box>
      </Box>

      {/* KHỐI 3: PHÂN LOẠI & ĐỘ KHÓ */}
      <Box sx={fieldGridSx}>
        <Box>
          <FieldLabel>Phân loại bài</FieldLabel>
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
        </Box>
        <Box>
          <FieldLabel>Độ khó mục tiêu</FieldLabel>
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
        </Box>
      </Box>

      {/* KHỐI 4: LỚP ÁP DỤNG & TRẠNG THÁI PHÁT HÀNH */}
      <Box sx={fieldGridSx}>
        <Box>
          <FieldLabel>Lớp / nhóm phù hợp</FieldLabel>
          <ErgTextField
            compact
            value={classTargets}
            onChange={(e) => setClassTargets(e.target.value)}
            placeholder="vd: Lớp 6A1, Nhóm bồi dưỡng"
            slotProps={{
              input: { startAdornment: <InputAdornment position="start"><GroupIcon fontSize="small" /></InputAdornment> },
            }}
          />
        </Box>
        <Box>
          <FieldLabel>Trạng thái phát hành</FieldLabel>
          <ErgSelect
            size="small"
            value={status}
            onChange={(e) => setStatus(e.target.value as ExerciseStatus)}
            options={[
              { value: "published", label: "Đã xuất bản (Sẵn sàng giao)" },
              { value: "draft", label: "Bản nháp (Đang biên soạn)" },
            ]}
          />
        </Box>
      </Box>

      {/* BANNER THÔNG TIN TIẾN ĐỘ CÂU HỎI */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 1.5,
          p: 2,
          border: 1,
          borderColor: "divider",
          borderRadius: 1.5,
          bgcolor: "success.light",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ display: "grid", placeItems: "center", width: 36, height: 36, flexShrink: 0, borderRadius: 1, bgcolor: "background.paper", color: "success.main" }}>
            <CheckCircleOutlineIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="subtitle2" component="span" sx={{ display: "block", fontWeight: "fontWeightBold" }}>
              {selectedQuestionIds.length > 0
                ? `Đã bốc ${selectedQuestionIds.length} câu hỏi từ Ngân hàng (${subjectName})`
                : `Chưa bốc câu hỏi từ Ngân hàng (${subjectName})`}
            </Typography>
            <Typography variant="caption" component="span" sx={{ display: "block", color: "text.secondary" }}>
              {selectedQuestionIds.length > 0
                ? `Thời lượng làm bài dự kiến: ~${Math.round(selectedQuestionIds.length * 2)} phút`
                : "Vui lòng chọn ít nhất 1 câu hỏi để tạo bài tập"}
            </Typography>
          </Box>
        </Box>
        <ErgButton
          type="button"
          variant="outlined"
          color="success"
          size="small"
          onClick={() => setActiveStep("pick")}
          startIcon={<ArrowBackIcon fontSize="small" />}
          sx={{ bgcolor: "background.paper" }}
        >
          Chọn thêm / Đổi câu
        </ErgButton>
      </Box>
    </Box>
  );
}

const fieldGridSx = { display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", sm: "repeat(2, minmax(0,1fr))" }, gap: 2 } as const;

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <Typography component="label" variant="caption" sx={{ display: "block", mb: 0.75, fontWeight: "fontWeightBold" }}>
      {children}
    </Typography>
  );
}
