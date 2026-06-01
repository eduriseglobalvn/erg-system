import type { ReactNode } from "react";

import {
  OfficeAudioToolbarIcon,
  OfficePictureToolbarIcon,
} from "@/features/lcms/quiz/quiz-editor/components/classic-editor-art";
import { buildQuizTextStyle } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-text-style";
import { useI18n } from "@/platform/i18n";
import type { QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export function FormViewSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { t } = useI18n();

  return (
    <div className="classic-editor__canvas-inner classic-editor__canvas-inner--manager">
      <section className="classic-editor__section classic-editor__section--manager">
        <div className="classic-editor__section-head">
          <div className="classic-editor__section-kicker">{t("quiz.questionEditor")}</div>
          <div className="classic-editor__section-title">{title}</div>
          <p className="classic-editor__section-copy">
            {t("quiz.questionEditorSectionCopy")}
          </p>
        </div>
        {children}
      </section>
    </div>
  );
}

export function FieldLabel({ label }: { label: string }) {
  return <div className="classic-editor__field-label">{label}</div>;
}

export function AudioTextField({
  value,
  onChange,
  slide,
}: {
  value: string;
  onChange: (value: string) => void;
  slide: QuizEditorSlide;
}) {
  return (
    <div className="classic-editor__title-audio">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="classic-editor__text-input"
        style={buildQuizTextStyle(slide.textStyle)}
      />
      <button type="button" className="classic-editor__audio-button">
        <OfficeAudioToolbarIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export function SlideTitleToolbar({
  slide,
  value,
  onChange,
}: {
  slide: QuizEditorSlide;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="classic-editor__title-toolbar">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="classic-editor__text-input"
        style={buildQuizTextStyle(slide.textStyle)}
      />
      <div className="classic-editor__mini-tools">
        <button type="button" className="classic-editor__mini-tool">
          <OfficePictureToolbarIcon className="h-4 w-4" />
        </button>
        <button type="button" className="classic-editor__mini-tool">
          <span className="classic-editor__mini-grid" />
        </button>
        <button type="button" className="classic-editor__mini-tool">
          <OfficeAudioToolbarIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
