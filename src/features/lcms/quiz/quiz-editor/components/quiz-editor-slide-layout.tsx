import type { CSSProperties } from "react";
import { getQuizEditorLayoutTemplate, toNormalizedStyle } from "./quiz-editor-layouts";
import type { QuizEditorLayoutPreset } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export function buildSlideLayoutStyles(layoutPreset: QuizEditorLayoutPreset, compactAnswers: boolean) {
  const template = getQuizEditorLayoutTemplate(layoutPreset);

  return {
    title: toNormalizedStyle(template.zones.title),
    answerArea: toNormalizedStyle(compactAnswers ? narrowAnswerZone(template.zones.answerArea) : template.zones.answerArea),
    mediaArea: toNormalizedStyle(template.zones.mediaArea),
  };
}

function narrowAnswerZone(zone: {
  x: number;
  y: number;
  w: number;
  h: number;
  textAlign?: CSSProperties["textAlign"];
  justifyContent?: CSSProperties["justifyContent"];
  alignItems?: CSSProperties["alignItems"];
}) {
  const nextWidth = Math.min(zone.w, 0.26);
  return {
    ...zone,
    w: nextWidth,
  };
}

export function LayoutGuideOverlay({ layoutPreset }: { layoutPreset: QuizEditorLayoutPreset }) {
  const template = getQuizEditorLayoutTemplate(layoutPreset);

  return (
    <div className="classic-slide__layout-guides" aria-hidden="true">
      <div className="classic-slide__layout-guide is-title" style={toNormalizedStyle(template.zones.title)}>
        <span>Title</span>
      </div>
      <div className="classic-slide__layout-guide is-content" style={toNormalizedStyle(template.zones.answerArea)}>
        <span>Content</span>
      </div>
      <div className="classic-slide__layout-guide is-media" style={toNormalizedStyle(template.zones.mediaArea)}>
        <span>Picture</span>
      </div>
    </div>
  );
}

