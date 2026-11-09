import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import { Fragment, useId } from "react";

import { blankSx, QuestionBodyWithImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";

type ReviewState = "idle" | "correct" | "wrong";

/** Big answer box (design T03/T12): strong border, primary ring on focus, green/red once reviewed. */
const fieldSx = (state: ReviewState) => ({
  bgcolor: "background.paper",
  border: "1px solid",
  borderColor: state === "correct" ? "success.main" : state === "wrong" ? "error.main" : tokens.color.borderStrong,
  borderRadius: `${tokens.radius.control}px`,
  color: "text.primary",
  px: 1.75,
  transition: `border-color ${tokens.motion.duration.fast}ms ${tokens.motion.easing.standard}, box-shadow ${tokens.motion.duration.fast}ms ${tokens.motion.easing.standard}`,
  width: "100%",
  "&.Mui-focused": { borderColor: "primary.main", boxShadow: `0 0 0 3px ${tokens.color.primarySoft}` },
  "&.Mui-disabled": { color: "text.primary" },
  "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "currentColor" },
});

const adornmentSx = { color: "text.secondary", flex: "none", fontWeight: "fontWeightMedium", whiteSpace: "nowrap" } as const;
const hintSx = { typography: "caption", color: "text.secondary", m: 0 } as const;

function CorrectAnswer({ value }: { value: string }) {
  return <Box component="span" sx={{ typography: "subtitle2", color: "success.dark" }}>Đáp án đúng: {value}</Box>;
}

export function ShortAnswerQuestion(props: QuestionComponentProps) {
  return <TextBlankQuestion {...props} variant="short" />;
}

export function FillBlankQuestion(props: QuestionComponentProps) {
  return <TextBlankQuestion {...props} variant="blank" />;
}

export function NumericQuestion({
  question,
  value,
  onChange,
  submitted = false,
  reviewMode = false,
  result,
}: QuestionComponentProps) {
  const unit = question.numericAnswer?.unit;
  const state: ReviewState = !reviewMode ? "idle" : result?.correct ? "correct" : "wrong";

  return (
    <QuestionBodyWithImage question={question}>
      <Box className="quiz-answer-region" sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        <InputBase
          type="number"
          value={value.numericValue ?? ""}
          disabled={submitted}
          onChange={(event) => onChange({ numericValue: event.target.value })}
          placeholder="Nhập số"
          inputProps={{ "aria-label": "Đáp án", inputMode: "decimal" }}
          endAdornment={unit ? <Box component="span" sx={adornmentSx}>{unit}</Box> : undefined}
          sx={{ typography: "h3", ...fieldSx(state), fontWeight: "fontWeightBold", fontVariantNumeric: "tabular-nums", height: 56 }}
        />
        {reviewMode && result?.correctNumericValue ? (
          <CorrectAnswer value={result.correctNumericValue} />
        ) : (
          <Box component="p" sx={hintSx}>Chỉ nhập số.</Box>
        )}
      </Box>
    </QuestionBodyWithImage>
  );
}

export function EssayQuestion({
  question,
  value,
  onChange,
  submitted = false,
  reviewMode = false,
}: QuestionComponentProps) {
  const text = value.essayText ?? "";

  return (
    <QuestionBodyWithImage question={question}>
      <Box className="quiz-answer-region" sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        <InputBase
          multiline
          minRows={6}
          value={text}
          disabled={submitted}
          onChange={(event) => onChange({ essayText: event.target.value })}
          placeholder="Viết câu trả lời của em..."
          inputProps={{ "aria-label": "Câu trả lời" }}
          sx={{ typography: "h6", ...fieldSx(reviewMode ? "correct" : "idle"), alignItems: "flex-start", fontWeight: "fontWeightRegular", lineHeight: 1.5, py: 1.5 }}
        />
        <Box sx={{ ...hintSx, display: "flex", justifyContent: "flex-end", fontVariantNumeric: "tabular-nums" }}>
          {`${text.length.toLocaleString("vi-VN")} ký tự`}
        </Box>
      </Box>
    </QuestionBodyWithImage>
  );
}

function TextBlankQuestion({
  question,
  value,
  onChange,
  submitted = false,
  reviewMode = false,
  result,
  variant,
}: QuestionComponentProps & { variant: "short" | "blank" }) {
  const idBase = useId();
  const blanks = question.textBlanks ?? [];
  const review = (blankId: string, answer: string) => {
    const correctValue = result?.correctTextResponses?.[blankId] ?? blanks.find((blank) => blank.id === blankId)?.correctAnswers[0] ?? "";
    const right = normalizeText(answer) === normalizeText(correctValue);
    return { correctValue, state: (!reviewMode ? "idle" : right ? "correct" : "wrong") as ReviewState };
  };
  const setText = (blankId: string, text: string) => onChange({ textResponses: { ...(value.textResponses ?? {}), [blankId]: text } });

  if (variant === "blank") {
    const filled = blanks.filter((blank) => (value.textResponses?.[blank.id] ?? "").trim()).length;
    return (
      <QuestionBodyWithImage question={question}>
        <Box className="quiz-answer-region" sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {/* The blanks sit inside the running text, each with its own prefix and suffix. */}
          <Box component="p" sx={{ typography: "h5", fontWeight: "fontWeightRegular", lineHeight: 2.1, m: 0 }}>
            {blanks.map((blank, index) => {
              const currentValue = value.textResponses?.[blank.id] ?? "";
              const { correctValue, state } = review(blank.id, currentValue);
              return (
                <Fragment key={blank.id}>
                  {index > 0 ? " " : null}
                  {blank.prefix ? <>{blank.prefix} </> : null}
                  <InputBase
                    value={currentValue}
                    disabled={submitted}
                    onChange={(event) => setText(blank.id, event.target.value)}
                    placeholder={String(index + 1)}
                    inputProps={{ "aria-label": `Ô trống ${index + 1}` }}
                    sx={{
                      ...blankSx(state === "correct" ? "correct" : state === "wrong" ? "wrong" : currentValue ? "filled" : "empty"),
                      width: `${Math.max(currentValue.length + 3, 7)}ch`,
                      maxWidth: "100%",
                      ...(state === "wrong" ? { textDecoration: "line-through" } : null),
                      "&.Mui-focused": { ...blankSx("active"), borderStyle: "solid", m: 0.25 },
                      "& input": { p: 0, textAlign: "center" },
                      "& input::placeholder": { color: tokens.color.textMuted, opacity: 1 },
                      "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "currentColor" },
                    }}
                  />
                  {state === "wrong" ? <Box component="span" sx={{ color: "success.dark", fontWeight: "fontWeightBold", ml: 0.5 }}>{correctValue}</Box> : null}
                  {blank.suffix ? <> {blank.suffix}</> : null}
                </Fragment>
              );
            })}
          </Box>
          {reviewMode ? null : <Box component="p" sx={hintSx}>{`Đã điền ${filled}/${blanks.length} chỗ trống.`}</Box>}
        </Box>
      </QuestionBodyWithImage>
    );
  }

  return (
    <QuestionBodyWithImage question={question}>
      <Box className="quiz-answer-region" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {blanks.map((blank) => {
          const currentValue = value.textResponses?.[blank.id] ?? "";
          const { correctValue, state } = review(blank.id, currentValue);
          const inputId = `${idBase}-${blank.id}`;
          return (
            <Box key={blank.id} sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
              <Box component="label" htmlFor={inputId} sx={{ typography: "subtitle2", color: "text.secondary" }}>
                {blank.label || "Đáp án"}
              </Box>
              <InputBase
                id={inputId}
                value={currentValue}
                disabled={submitted}
                onChange={(event) => setText(blank.id, event.target.value)}
                placeholder={blank.placeholder ?? "Nhập câu trả lời"}
                startAdornment={blank.prefix ? <Box component="span" sx={{ ...adornmentSx, mr: 1 }}>{blank.prefix}</Box> : undefined}
                endAdornment={blank.suffix ? <Box component="span" sx={{ ...adornmentSx, ml: 1 }}>{blank.suffix}</Box> : undefined}
                sx={{ typography: "h3", ...fieldSx(state), fontWeight: "fontWeightBold", height: 56 }}
              />
              {reviewMode ? <CorrectAnswer value={correctValue} /> : null}
            </Box>
          );
        })}
      </Box>
    </QuestionBodyWithImage>
  );
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("vi-VN")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ");
}
