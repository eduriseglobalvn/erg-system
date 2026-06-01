import type { MessageKey } from "@/platform/i18n";
import { useI18n } from "@/platform/i18n";
import type { IntroSlideKind, QuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import {
  introSlideLabelKeys,
  questionTypeLabelKeys,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import {
  ClassicIntroPreview,
  ClassicQuestionPreview,
} from "@/features/lcms/quiz/quiz-editor/components/classic-editor-art";

const questionOptions = Object.entries(questionTypeLabelKeys) as Array<[QuestionType, MessageKey]>;
const introOptions = Object.entries(introSlideLabelKeys) as Array<[IntroSlideKind, MessageKey]>;

export function QuestionMenu({ onSelect }: { onSelect: (type: QuestionType) => void }) {
  const { t } = useI18n();

  return (
    <div className="classic-editor__popup classic-editor__popup--questions">
      <div className="classic-editor__popup-title">{t("quiz.popupQuestions")}</div>
      <div className="classic-editor__popup-grid classic-editor__popup-grid--questions">
        {questionOptions.map(([type, labelKey]) => (
          <button key={type} type="button" onClick={() => onSelect(type)} className="classic-editor__popup-item">
            <ClassicQuestionPreview type={type} />
            <span className="classic-editor__popup-item-label">{t(labelKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function IntroductionMenu({ onSelect }: { onSelect: (type: IntroSlideKind) => void }) {
  const { t } = useI18n();

  return (
    <div className="classic-editor__popup classic-editor__popup--intro">
      <div className="classic-editor__popup-title">{t("quiz.popupIntroduction")}</div>
      <div className="classic-editor__popup-grid classic-editor__popup-grid--intro">
        {introOptions.map(([type, labelKey]) => (
          <button key={type} type="button" onClick={() => onSelect(type)} className="classic-editor__popup-item">
            <ClassicIntroPreview type={type} />
            <span className="classic-editor__popup-item-label">{t(labelKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
