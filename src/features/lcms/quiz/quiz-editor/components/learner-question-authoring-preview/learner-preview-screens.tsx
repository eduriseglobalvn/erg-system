import { BufferedTextarea } from "@/features/lcms/quiz/quiz-editor/components/learner-question-authoring-preview/buffered-textarea";
import { useI18n } from "@/platform/i18n";
import type { QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { cn } from "@/utils/cn";

export function LearnerInstructionScreen({
  slide,
  readOnly,
  onUpdateInstructions,
}: {
  slide: QuizEditorSlide;
  readOnly: boolean;
  onUpdateInstructions: (items: string[]) => void;
}) {
  const { t } = useI18n();
  const instructions = slide.instructions?.length ? slide.instructions : [slide.description ?? ""];

  function updateInstruction(index: number, value: string) {
    onUpdateInstructions(instructions.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  function addInstruction() {
    onUpdateInstructions([...instructions, ""]);
  }

  function removeInstruction(index: number) {
    onUpdateInstructions(instructions.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="classic-editor__learner-instruction">
      <div className="classic-editor__learner-intro-card">
        <strong>{t("quiz.quizInstructions")}</strong>
        <span>{t("quiz.learnerViewEditorCopy")}</span>
      </div>

      {slide.media ? (
        <img
          src={slide.media.src}
          alt={slide.media.alt}
          className="classic-editor__learner-instruction-image"
        />
      ) : null}

      <div className="classic-editor__learner-steps">
        {instructions.map((item, index) => (
          <div
            key={`${slide.id}-instruction-${index}`}
            className={cn("classic-editor__learner-step", readOnly && "is-readonly")}
          >
            <span>{index + 1}</span>
            {readOnly ? (
              <p>{item}</p>
            ) : (
              <>
                <BufferedTextarea
                  value={item}
                  rows={2}
                  onCommit={(value) => updateInstruction(index, value)}
                  aria-label={`${t("common.description")} ${index + 1}`}
                />
                <button type="button" onClick={() => removeInstruction(index)} aria-label={t("common.remove")}>
                  x
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {readOnly ? null : (
        <button type="button" className="classic-editor__learner-add-step" onClick={addInstruction}>
          + {t("common.description")}
        </button>
      )}
    </div>
  );
}

export function LearnerInformationLandingScreen({ slide }: { slide: QuizEditorSlide }) {
  const page = slide.infoPage;
  if (!page) return null;

  const contributors = page.contributors.split(/\r?\n/).filter(Boolean);

  return (
    <div className={cn("classic-editor__learner-info-landing", `is-${page.theme}`)}>
      <div className="classic-editor__learner-info-top">
        <strong>{page.organization}</strong>
        <span>{page.version}</span>
      </div>
      <div className="classic-editor__learner-info-art" aria-hidden="true">
        <span className="is-line-a" />
        <span className="is-line-b" />
        <span className="is-circle-a" />
        <span className="is-person">
          <span />
          <span />
          <span />
        </span>
      </div>
      <div className="classic-editor__learner-info-copy">
        <strong>{page.courseTitle}</strong>
        <span>{page.lessonTitle}</span>
        <b>{page.testTitle}</b>
        <i />
        <p>
          <span>Lecturer:</span> {page.lecturer}
        </p>
        <ul>
          {contributors.map((name, index) => (
            <li key={`${name}-${index}`}>{name}</li>
          ))}
        </ul>
      </div>
      <div className="classic-editor__learner-info-footer">
        <p>{slide.description}</p>
        <button type="button" disabled>
          {page.startButtonLabel}
        </button>
      </div>
    </div>
  );
}

export function LearnerResultScreen({ slide }: { slide: QuizEditorSlide }) {
  const { t } = useI18n();
  const passMessage =
    slide.feedbackRows?.find((row) => row.kind === "correct")?.feedback ||
    t("quiz.greatYoureSharp");
  const failMessage =
    slide.feedbackRows?.find((row) => row.kind === "incorrect")?.feedback ||
    t("quiz.tryAgainMessage");

  return (
    <div className="classic-editor__learner-result">
      <div className="classic-editor__learner-result-card is-pass">
        <span>{t("common.correct")}</span>
        <strong>{passMessage}</strong>
        <div className="classic-editor__learner-result-meter">
          <span style={{ width: "88%" }} />
        </div>
      </div>
      <div className="classic-editor__learner-result-card is-fail">
        <span>{t("common.incorrect")}</span>
        <strong>{failMessage}</strong>
        <div className="classic-editor__learner-result-meter">
          <span style={{ width: "42%" }} />
        </div>
      </div>
    </div>
  );
}
