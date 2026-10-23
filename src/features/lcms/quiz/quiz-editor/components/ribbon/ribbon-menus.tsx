import { Box, ButtonBase, Paper, Typography } from "@mui/material";
import type { MessageKey } from "@/platform/i18n";
import { useI18n } from "@/platform/i18n";
import type {
  IntroSlideKind,
  QuestionCreationPreset,
  QuestionType,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import {
  introSlideLabelKeys,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import {
  ClassicIntroPreview,
} from "@/features/lcms/quiz/quiz-editor/components/classic-editor-art";

const introOptions = Object.entries(introSlideLabelKeys) as Array<[IntroSlideKind, MessageKey]>;

const questionMenuOptions: Array<{
  label: string;
  description: string;
  demo: QuestionMenuDemoKind;
  type: QuestionType;
  preset?: QuestionCreationPreset;
}> = [
  { label: "True/False", description: "Hai lựa chọn đúng hoặc sai, phản hồi tức thì.", demo: "true-false", type: "true-false" },
  { label: "Yes/No", description: "Biến thể xác nhận nhanh với nhãn thân thiện.", demo: "yes-no", type: "true-false", preset: "yes-no" },
  { label: "Multiple Choice", description: "Một đáp án đúng trong danh sách lựa chọn.", demo: "multiple-choice", type: "multiple-choice" },
  { label: "Multiple Response", description: "Nhiều đáp án đúng, phù hợp câu hỏi kiểm tra hiểu sâu.", demo: "multiple-response", type: "multiple-response" },
  { label: "Fill in the Blank", description: "Điền từ còn thiếu trong câu hoặc đoạn ngắn.", demo: "fill-blank", type: "fill-in-the-blanks" },
  { label: "Matching", description: "Ghép hai vế bằng thẻ nối trực quan.", demo: "matching", type: "matching" },
  { label: "Sequence", description: "Sắp xếp các bước theo thứ tự chính xác.", demo: "sequence", type: "sequence" },
  { label: "Click Map", description: "Chọn vùng đúng trên ảnh hoặc sơ đồ.", demo: "click-map", type: "hotspot" },
];

type QuestionMenuDemoKind =
  | "true-false"
  | "yes-no"
  | "multiple-choice"
  | "multiple-response"
  | "fill-blank"
  | "matching"
  | "sequence"
  | "click-map";

export function QuestionMenu({
  onSelect,
}: {
  onSelect: (type: QuestionType, preset?: QuestionCreationPreset) => void;
}) {
  return (
    <Paper
      elevation={8}
      className="classic-editor__popup classic-editor__popup--questions classic-editor__mui-popup"
      sx={{
        width: 624,
        maxWidth: "calc(100vw - 16px)",
        overflow: "hidden",
        border: "1px solid rgba(145, 158, 171, 0.24)",
        borderRadius: "14px",
        bgcolor: "rgba(255, 255, 255, 0.98)",
        boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
      }}
    >
      <PopupHeader
        title="Câu hỏi"
        eyebrow="Bảng chọn câu hỏi"
        copy="Chọn dạng tương tác. Mỗi thẻ minh họa nhanh giao diện học viên sẽ thấy sau khi tạo."
      />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 1,
          p: 1.25,
          "@media (max-width: 560px)": {
            gridTemplateColumns: "1fr",
          },
        }}
      >
        {questionMenuOptions.map((option) => (
          <ButtonBase
            key={option.label}
            type="button"
            onClick={() => {
              onSelect(option.type, option.preset);
            }}
            className="classic-editor__popup-item classic-editor__mui-popup-item"
            sx={questionMenuItemSx}
          >
            <QuestionMenuPreview kind={option.demo} />
            <Box sx={{ minWidth: 0 }}>
              <Typography component="span" sx={questionMenuLabelSx}>
                {option.label}
              </Typography>
              <Typography component="span" sx={questionMenuDescriptionSx}>
                {option.description}
              </Typography>
            </Box>
          </ButtonBase>
        ))}
      </Box>
    </Paper>
  );
}

export function IntroductionMenu({ onSelect }: { onSelect: (type: IntroSlideKind) => void }) {
  const { t } = useI18n();

  return (
    <Paper
      elevation={8}
      className="classic-editor__popup classic-editor__popup--intro classic-editor__mui-popup"
      sx={{
        width: 372,
        overflow: "hidden",
        border: "1px solid rgba(145, 158, 171, 0.24)",
        borderRadius: "14px",
        bgcolor: "rgba(255, 255, 255, 0.98)",
        boxShadow: "0 18px 48px rgba(15, 23, 42, 0.16)",
      }}
    >
      <PopupHeader
        title={t("quiz.popupIntroduction")}
        eyebrow="Màn giới thiệu"
        copy="Thêm màn mở đầu, hướng dẫn hoặc thông tin người dùng trước phần câu hỏi."
      />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 1,
          p: 1.25,
        }}
      >
        {introOptions.map(([type, labelKey]) => (
          <ButtonBase
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className="classic-editor__popup-item classic-editor__mui-popup-item"
            sx={introPopupItemSx}
          >
            <ClassicIntroPreview type={type} />
            <Typography component="span" sx={popupLabelSx}>
              {t(labelKey)}
            </Typography>
          </ButtonBase>
        ))}
      </Box>
    </Paper>
  );
}

const questionPopupItemSx = {
  display: "flex",
  minHeight: 124,
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "space-between",
  border: "1px solid rgba(145, 158, 171, 0.16)",
  borderRadius: "12px",
  bgcolor: "rgba(255, 255, 255, 0.78)",
  p: 1.1,
  textAlign: "left",
  transition: "background 140ms ease, border-color 140ms ease, transform 140ms ease, box-shadow 140ms ease",
  "&:hover": {
    borderColor: "rgba(15, 108, 189, 0.28)",
    bgcolor: "rgba(246, 250, 255, 0.96)",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
    transform: "translateY(-1px)",
  },
  "&:focus-visible": {
    outline: "2px solid rgba(15, 108, 189, 0.34)",
    outlineOffset: 2,
  },
  "& .classic-editor__classic-preview": {
    flex: "1 1 auto",
  },
} as const;

const questionMenuItemSx = {
  display: "flex",
  width: "100%",
  minHeight: 118,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: 1.25,
  border: "1px solid rgba(145, 158, 171, 0.16)",
  borderRadius: "12px",
  bgcolor: "rgba(255, 255, 255, 0.84)",
  px: 1.15,
  py: 1,
  textAlign: "left",
  transition: "background 140ms ease, border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease",
  "&:hover": {
    borderColor: "rgba(15, 108, 189, 0.32)",
    bgcolor: "rgba(246, 250, 255, 0.98)",
    boxShadow: "0 14px 30px rgba(15, 23, 42, 0.09)",
    color: "var(--erg-blue, #0f6cbd)",
    transform: "translateY(-1px)",
  },
  "&:focus-visible": {
    outline: "2px solid rgba(15, 108, 189, 0.34)",
    outlineOffset: 2,
  },
} as const;

const introPopupItemSx = {
  ...questionPopupItemSx,
  minHeight: 104,
} as const;

const popupLabelSx = {
  display: "block",
  color: "#263445",
  fontSize: 12.5,
  fontWeight: 800,
  lineHeight: 1.2,
} as const;

const questionMenuLabelSx = {
  display: "block",
  color: "#172033",
  fontSize: 13.5,
  fontWeight: 800,
  lineHeight: 1.18,
  overflowWrap: "anywhere",
} as const;

const questionMenuDescriptionSx = {
  display: "block",
  mt: 0.45,
  color: "#637083",
  fontSize: 11.5,
  fontWeight: 600,
  lineHeight: 1.35,
} as const;

function PopupHeader({ title, eyebrow, copy }: { title: string; eyebrow: string; copy: string }) {
  return (
    <Box
      sx={{
        borderBottom: "1px solid rgba(145, 158, 171, 0.18)",
        background: "linear-gradient(180deg, rgba(248, 251, 255, 0.96), rgba(255, 255, 255, 0.98))",
        px: 2,
        py: 1.25,
      }}
    >
      <Typography component="div" sx={{ color: "#0f6cbd", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
        {eyebrow}
      </Typography>
      <Typography component="div" sx={{ mt: 0.2, color: "#172033", fontSize: 14, fontWeight: 900 }}>
        {title}
      </Typography>
      <Typography component="div" sx={{ mt: 0.35, color: "#667085", fontSize: 11.5, fontWeight: 600, lineHeight: 1.35 }}>
        {copy}
      </Typography>
    </Box>
  );
}

function QuestionMenuPreview({ kind }: { kind: QuestionMenuDemoKind }) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        display: "grid",
        width: 104,
        height: 72,
        flex: "0 0 104px",
        placeItems: "center",
        overflow: "hidden",
        borderRadius: "9px",
        bgcolor: "#ffffff",
        boxShadow: "inset 0 0 0 1px rgba(15, 108, 189, 0.16), 0 8px 18px rgba(15, 23, 42, 0.07)",
      }}
    >
      <QuestionMenuGlyph kind={kind} />
    </Box>
  );
}

function QuestionMenuGlyph({ kind }: { kind: QuestionMenuDemoKind }) {
  if (kind === "true-false") {
    return (
      <Box sx={{ display: "grid", width: "82%", gap: "7px" }}>
        <Box sx={{ height: 7, width: "58%", borderRadius: 999, bgcolor: "rgba(15, 108, 189, 0.18)" }} />
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" }}>
          <Box sx={{ height: 28, borderRadius: "7px", bgcolor: "rgba(34, 197, 94, 0.12)", boxShadow: "inset 0 0 0 1px rgba(34, 197, 94, 0.42)" }} />
          <Box sx={{ height: 28, borderRadius: "7px", bgcolor: "rgba(255, 86, 48, 0.1)", boxShadow: "inset 0 0 0 1px rgba(255, 86, 48, 0.42)" }} />
        </Box>
      </Box>
    );
  }

  if (kind === "yes-no") {
    return (
      <Box sx={{ display: "grid", width: "82%", gap: "7px" }}>
        <Box sx={{ height: 7, width: "64%", borderRadius: 999, bgcolor: "rgba(15, 108, 189, 0.18)" }} />
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" }}>
          <Box sx={{ height: 28, borderRadius: "999px", bgcolor: "rgba(34, 197, 94, 0.13)", boxShadow: "inset 0 0 0 1px rgba(34, 197, 94, 0.42)" }} />
          <Box sx={{ height: 28, borderRadius: "999px", bgcolor: "rgba(255, 171, 0, 0.13)", boxShadow: "inset 0 0 0 1px rgba(255, 171, 0, 0.48)" }} />
        </Box>
      </Box>
    );
  }

  if (kind === "multiple-choice") {
    return (
      <Box sx={{ display: "grid", gap: "7px", width: "82%" }}>
        {[0, 1, 2].map((item) => (
          <Box key={item} sx={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: item === 0 ? "#0f6cbd" : "transparent", boxShadow: "inset 0 0 0 1.5px #7fb4e8" }} />
            <Box sx={{ width: item === 1 ? "54%" : "72%", height: 6, borderRadius: 999, bgcolor: "rgba(15, 108, 189, 0.2)" }} />
          </Box>
        ))}
      </Box>
    );
  }

  if (kind === "multiple-response") {
    return (
      <Box sx={{ display: "grid", gap: "7px", width: "82%" }}>
        {[0, 1, 2].map((item) => (
          <Box key={item} sx={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <Box sx={{ width: 12, height: 12, borderRadius: "3px", bgcolor: item !== 1 ? "#0f6cbd" : "transparent", boxShadow: "inset 0 0 0 1.5px #7fb4e8" }} />
            <Box sx={{ width: item === 2 ? "52%" : "74%", height: 6, borderRadius: 999, bgcolor: "rgba(15, 108, 189, 0.2)" }} />
          </Box>
        ))}
      </Box>
    );
  }

  if (kind === "fill-blank") {
    return (
      <Box sx={{ display: "grid", width: "82%", gap: "8px" }}>
        <Box sx={{ height: 6, width: "72%", borderRadius: 999, bgcolor: "rgba(15, 108, 189, 0.18)" }} />
        <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Box sx={{ width: 24, height: 6, borderRadius: 999, bgcolor: "rgba(15, 108, 189, 0.22)" }} />
          <Box sx={{ width: 38, height: 18, borderRadius: "6px", bgcolor: "#fff", boxShadow: "inset 0 0 0 1.5px #7fb4e8" }} />
        </Box>
        <Box sx={{ height: 6, width: "58%", borderRadius: 999, bgcolor: "rgba(15, 108, 189, 0.14)" }} />
      </Box>
    );
  }

  if (kind === "matching") {
    return (
      <Box sx={{ position: "relative", display: "grid", gridTemplateColumns: "32px 20px 32px", gap: "2px", width: 88, alignItems: "center" }}>
        {[0, 1].map((item) => (
          <Box key={`left-${item}`} sx={{ gridColumn: 1, gridRow: item + 1, height: 18, borderRadius: "6px", bgcolor: "#fff", boxShadow: "inset 0 0 0 1px #7fb4e8" }} />
        ))}
        <Box component="svg" viewBox="0 0 20 42" sx={{ gridColumn: 2, gridRow: "1 / 3", width: 20, height: 42 }}>
          <path d="M2 10 C10 10 10 32 18 32" fill="none" stroke="#0f6cbd" strokeWidth="2" strokeLinecap="round" />
          <path d="M2 32 C10 32 10 10 18 10" fill="none" stroke="#7fb4e8" strokeWidth="2" strokeLinecap="round" />
        </Box>
        {[0, 1].map((item) => (
          <Box key={`right-${item}`} sx={{ gridColumn: 3, gridRow: item + 1, height: 18, borderRadius: "6px", bgcolor: "rgba(15, 108, 189, 0.14)", boxShadow: "inset 0 0 0 1px #7fb4e8" }} />
        ))}
      </Box>
    );
  }

  if (kind === "sequence") {
    return (
      <Box sx={{ display: "grid", gap: "7px", width: "82%" }}>
        {[0, 1, 2].map((item) => (
          <Box key={item} sx={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <Box sx={{ width: 16, height: 16, borderRadius: "50%", bgcolor: item === 0 ? "#0f6cbd" : "rgba(15, 108, 189, 0.2)" }} />
            <Box sx={{ width: `${74 - item * 12}%`, height: 7, borderRadius: 999, bgcolor: "rgba(15, 108, 189, 0.18)" }} />
          </Box>
        ))}
      </Box>
    );
  }

  if (kind === "click-map") {
    return (
      <Box sx={{ position: "relative", width: 82, height: 48, borderRadius: "8px", bgcolor: "rgba(15, 108, 189, 0.12)", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", right: 15, top: 10, width: 22, height: 22, borderRadius: "50%", border: "2px solid #0f6cbd", bgcolor: "rgba(255,255,255,0.72)" }} />
        <Box sx={{ position: "absolute", left: 0, right: 0, bottom: 9, height: 5, bgcolor: "rgba(15, 108, 189, 0.22)" }} />
        <Box sx={{ position: "absolute", left: 12, bottom: 17, width: 18, height: 12, borderRadius: "5px", bgcolor: "rgba(34, 197, 94, 0.25)" }} />
      </Box>
    );
  }
  return null;
}
