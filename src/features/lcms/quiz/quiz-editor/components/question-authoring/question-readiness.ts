import { getMatchingKey } from "@/domain/quiz/quiz";
import type { Question, QuestionImage } from "@/domain/quiz/types";

export type ReadinessArea = "title" | "image" | "answers";
export type ReadinessIssue = { code: string; area: ReadinessArea; message: string };
export type QuestionReadiness = { ready: boolean; issues: ReadinessIssue[] };

const filled = (text: string | undefined, image?: QuestionImage) => Boolean(text?.trim()) || Boolean(image);

function assertNever(value: never): never {
  throw new Error(`Unhandled question kind: ${String(value)}`);
}

function answerIssues(question: Question, context: { hasQuestionImage: boolean }): ReadinessIssue[] {
  const issues: ReadinessIssue[] = [];
  const add = (code: string, message: string, area: ReadinessArea = "answers") =>
    issues.push({ code, area, message });

  switch (question.kind) {
    case "single_choice":
    case "multiple_response": {
      // Readiness only: blanks stay in the data because the teacher may still be typing.
      const choices = (question.choices ?? []).filter((choice) => filled(choice.label, choice.image));
      const correct = choices.filter((choice) => choice.correct).length;
      if (choices.length < 2) add("min-options", "Cần ít nhất 2 phương án có chữ");
      if (choices.length < (question.choices ?? []).length) add("blank-option", "Xoá phương án trống hoặc điền chữ");
      if (correct === 0) add("no-correct", "Chưa chọn đáp án đúng");
      else if (question.kind === "single_choice" && correct > 1) {
        add("many-correct", "Chỉ được chọn 1 đáp án đúng");
      }
      break;
    }
    case "true_false":
      if (!(question.choices ?? []).some((choice) => choice.correct)) {
        add("no-correct", "Chưa chọn đáp án đúng");
      }
      break;
    case "likert_scale": {
      if (!(question.likertRows ?? []).some((row) => row.label.trim())) {
        add("no-rows", "Cần ít nhất 1 nhận định");
      }
      const scale = question.likertScale ?? [];
      if (scale.length < 2 || scale.some((point) => !point.label.trim())) {
        add("scale-label", "Mọi mức cần có nhãn");
      }
      if (scale.length > 7) add("scale-max", "Thang chỉ có tối đa 7 mức");
      break;
    }
    case "fill_blank": {
      const blanks = question.textBlanks ?? [];
      if (blanks.length === 0) add("no-blank", "Chưa có ô trống");
      else if (blanks.some((blank) => !blank.correctAnswers.some((answer) => answer.trim()))) {
        add("blank-answer", "Ô trống cần có đáp án");
      }
      break;
    }
    case "inline_choice":
    case "select_from_lists": {
      const blanks = question.inlineBlanks ?? [];
      if (blanks.length === 0) add("no-blank", "Chưa có ô trống");
      else if (
        blanks.some(
          (blank) =>
            blank.options.filter((option) => option.trim()).length < 2 ||
            new Set(blank.options.map((option) => option.trim())).size < blank.options.length ||
            !blank.correctOptionId ||
            !blank.options.includes(blank.correctOptionId),
        )
      ) {
        add("blank-options", "Mỗi ô cần ít nhất 2 lựa chọn và 1 đáp án đúng");
      }
      break;
    }
    case "drag_words": {
      const slots = question.wordSlots ?? [];
      const bank = question.wordBank ?? [];
      if (!slots.length) add("no-blank", "Chưa có ô trống");
      else if (slots.some((slot) => !bank.some((word) => word.id === slot.correctWordId && word.label.trim()))) {
        add("blank-word", "Ô trống chưa có từ đúng");
      }
      break;
    }
    case "short_answer": {
      // The client grader requires every blank, so one empty blank makes the question unanswerable.
      const blanks = question.textBlanks ?? [];
      if (!blanks.length || blanks.some((blank) => !blank.correctAnswers.some((answer) => answer.trim()))) {
        add("no-answer", "Chưa có đáp án đúng");
      }
      break;
    }
    case "numeric": {
      const answer = question.numericAnswer;
      if (!answer || typeof answer.correctValue !== "number" || !Number.isFinite(answer.correctValue)) {
        add("numeric-value", "Đáp số phải là số");
      }
      const tolerance = answer?.tolerance ?? 0;
      if (answer && !(Number.isFinite(tolerance) && tolerance >= 0)) {
        add("numeric-tolerance", "Sai số phải là số ≥ 0");
      }
      break;
    }
    case "sequence": {
      const items = question.sequenceItems ?? [];
      const steps = items.filter((item) => filled(item.label, item.image)).length;
      if (steps < 2) add("min-steps", "Cần ít nhất 2 bước có chữ");
      if (steps < items.length) add("blank-step", "Xoá bước trống hoặc điền chữ");
      break;
    }
    case "matching": {
      const pairs = question.matching ?? [];
      if (pairs.length < 2) add("min-pairs", "Cần ít nhất 2 cặp");
      const key = getMatchingKey(question);
      const responses = question.matchingResponses ?? [];
      const incomplete = pairs.some((pair) => {
        const linked = responses.find((response) => response.id === key?.[pair.id]);
        const responseOk =
          filled(pair.response, pair.responseImage) ||
          (linked ? filled(linked.response, linked.responseImage) : false);
        return !filled(pair.prompt, pair.promptImage) || !responseOk;
      });
      if (incomplete) add("pair-sides", "Mỗi cặp cần đủ hai vế");
      break;
    }
    case "drag_drop":
      if ((question.dropTargets ?? []).filter((target) => target.label.trim()).length < 2) {
        add("min-groups", "Cần ít nhất 2 nhóm");
      }
      if (!(question.dragDropItems ?? []).some((item) => filled(item.label, item.image))) {
        add("min-items", "Cần ít nhất 1 mục");
      }
      {
        const targetIds = new Set((question.dropTargets ?? []).map((target) => target.id));
        if ((question.dragDropItems ?? []).some((item) => !targetIds.has(item.correctTargetId))) {
          add("item-group", "Mỗi mục cần thuộc một nhóm");
        }
      }
      break;
    case "hotspot":
      if (!context.hasQuestionImage) add("no-image", "Chưa có ảnh", "image");
      if (!(question.hotspotAreas ?? []).some((area) => area.correct)) {
        add("no-correct-area", "Chưa có vùng đúng");
      }
      break;
    case "essay":
      break;
    default:
      return assertNever(question.kind);
  }
  return issues;
}

export function assessQuestionReadiness(
  question: Question | null,
  context: { hasQuestionImage: boolean },
): QuestionReadiness {
  if (!question) {
    return { ready: false, issues: [{ code: "empty", area: "answers", message: "Câu hỏi chưa có nội dung" }] };
  }
  const issues: ReadinessIssue[] = [];
  if (!question.title.trim()) issues.push({ code: "title", area: "title", message: "Chưa có đề bài" });
  issues.push(...answerIssues(question, context));
  return { ready: issues.length === 0, issues };
}

export function readinessLabel(readiness: QuestionReadiness): string {
  if (readiness.ready) return "Sẵn sàng";
  const [first, ...rest] = readiness.issues;
  return rest.length ? `${first.message} · còn ${rest.length} chỗ khác` : first.message;
}
