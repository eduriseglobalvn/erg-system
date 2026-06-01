import type { CSSProperties } from "react";

import type { QuizEditorLayoutPreset } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

type LayoutZone = {
  x: number;
  y: number;
  w: number;
  h: number;
  textAlign?: CSSProperties["textAlign"];
  justifyContent?: CSSProperties["justifyContent"];
  alignItems?: CSSProperties["alignItems"];
};

export type QuizEditorLayoutTemplate = {
  id: QuizEditorLayoutPreset;
  name: string;
  group:
    | "PowerPoint"
    | "Picture"
    | "Section"
    | "Legacy";
  visibleInGallery?: boolean;
  zones: {
    title: LayoutZone;
    answerArea: LayoutZone;
    mediaArea: LayoutZone;
  };
};

const microsoftLikeTemplates: QuizEditorLayoutTemplate[] = [
  {
    id: "title-and-content",
    name: "Title and Content",
    group: "PowerPoint",
    visibleInGallery: true,
    zones: {
      title: { x: 0.18, y: 0.1, w: 0.64, h: 0.15, textAlign: "center", justifyContent: "center" },
      answerArea: { x: 0.25, y: 0.29, w: 0.42, h: 0.5, textAlign: "left", justifyContent: "flex-start" },
      mediaArea: { x: 0.1, y: 0.25, w: 0.8, h: 0.44, justifyContent: "center", alignItems: "flex-start" },
    },
  },
  {
    id: "title-and-two-content",
    name: "Title and Two Content",
    group: "PowerPoint",
    visibleInGallery: true,
    zones: {
      title: { x: 0.18, y: 0.1, w: 0.64, h: 0.14, textAlign: "center", justifyContent: "center" },
      answerArea: { x: 0.12, y: 0.31, w: 0.32, h: 0.42, textAlign: "left", justifyContent: "flex-start" },
      mediaArea: { x: 0.56, y: 0.31, w: 0.24, h: 0.42, justifyContent: "flex-start", alignItems: "flex-start" },
    },
  },
  {
    id: "comparison",
    name: "Comparison",
    group: "PowerPoint",
    visibleInGallery: true,
    zones: {
      title: { x: 0.18, y: 0.09, w: 0.64, h: 0.14, textAlign: "center", justifyContent: "center" },
      answerArea: { x: 0.1, y: 0.31, w: 0.36, h: 0.42, textAlign: "left", justifyContent: "flex-start" },
      mediaArea: { x: 0.54, y: 0.31, w: 0.28, h: 0.42, justifyContent: "flex-start", alignItems: "flex-start" },
    },
  },
  {
    id: "title-only",
    name: "Title Only",
    group: "Section",
    visibleInGallery: true,
    zones: {
      title: { x: 0.12, y: 0.1, w: 0.76, h: 0.14, textAlign: "center", justifyContent: "center" },
      answerArea: { x: 0.22, y: 0.32, w: 0.56, h: 0.44, textAlign: "left", justifyContent: "flex-start" },
      mediaArea: { x: 0.14, y: 0.3, w: 0.72, h: 0.36, justifyContent: "center", alignItems: "flex-start" },
    },
  },
  {
    id: "section-header",
    name: "Section Header",
    group: "Section",
    visibleInGallery: true,
    zones: {
      title: { x: 0.12, y: 0.18, w: 0.36, h: 0.2, textAlign: "left", justifyContent: "center" },
      answerArea: { x: 0.18, y: 0.44, w: 0.54, h: 0.28, textAlign: "left", justifyContent: "flex-start" },
      mediaArea: { x: 0.18, y: 0.38, w: 0.64, h: 0.26, justifyContent: "center", alignItems: "flex-start" },
    },
  },
  {
    id: "title-and-picture",
    name: "Title and Picture",
    group: "Picture",
    visibleInGallery: true,
    zones: {
      title: { x: 0.18, y: 0.1, w: 0.64, h: 0.14, textAlign: "center", justifyContent: "center" },
      answerArea: { x: 0.18, y: 0.31, w: 0.28, h: 0.4, textAlign: "left", justifyContent: "flex-start" },
      mediaArea: { x: 0.5, y: 0.26, w: 0.34, h: 0.46, justifyContent: "center", alignItems: "flex-start" },
    },
  },
  {
    id: "picture-with-caption",
    name: "Picture with Caption",
    group: "Picture",
    visibleInGallery: true,
    zones: {
      title: { x: 0.67, y: 0.14, w: 0.2, h: 0.18, textAlign: "left", justifyContent: "flex-start" },
      answerArea: { x: 0.66, y: 0.36, w: 0.2, h: 0.34, textAlign: "left", justifyContent: "flex-start" },
      mediaArea: { x: 0.1, y: 0.24, w: 0.48, h: 0.48, justifyContent: "center", alignItems: "flex-start" },
    },
  },
  {
    id: "title-slide",
    name: "Title Slide",
    group: "Section",
    visibleInGallery: true,
    zones: {
      title: { x: 0.2, y: 0.18, w: 0.6, h: 0.18, textAlign: "center", justifyContent: "center" },
      answerArea: { x: 0.26, y: 0.44, w: 0.48, h: 0.18, textAlign: "center", justifyContent: "center" },
      mediaArea: { x: 0.2, y: 0.32, w: 0.6, h: 0.22, justifyContent: "center", alignItems: "center" },
    },
  },
];

const legacyAliases: QuizEditorLayoutTemplate[] = [
  { ...microsoftLikeTemplates[0], id: "standard", name: "Default", group: "Legacy" },
  { ...microsoftLikeTemplates[0], id: "centered", name: "Centered", group: "Legacy" },
  { ...microsoftLikeTemplates[0], id: "compact", name: "Compact", group: "Legacy" },
  { ...microsoftLikeTemplates[6], id: "side-panel-1", name: "Side Panel 1", group: "Legacy" },
  { ...microsoftLikeTemplates[5], id: "side-panel-2", name: "Side Panel 2", group: "Legacy" },
  { ...microsoftLikeTemplates[1], id: "side-panel-3", name: "Side Panel 3", group: "Legacy" },
  { ...microsoftLikeTemplates[0], id: "horizontal-1", name: "Horizontal 1", group: "Legacy" },
  { ...microsoftLikeTemplates[3], id: "horizontal-2", name: "Horizontal 2", group: "Legacy" },
  { ...microsoftLikeTemplates[2], id: "balanced-1", name: "Balanced 1", group: "Legacy" },
  { ...microsoftLikeTemplates[0], id: "balanced-2", name: "Balanced 2", group: "Legacy" },
  { ...microsoftLikeTemplates[5], id: "balanced-3", name: "Balanced 3", group: "Legacy" },
];

export const quizEditorLayoutTemplates: QuizEditorLayoutTemplate[] = [
  ...microsoftLikeTemplates,
  ...legacyAliases,
];

export const groupedQuizEditorLayoutTemplates = quizEditorLayoutTemplates
  .filter((template) => template.visibleInGallery)
  .reduce<Record<string, QuizEditorLayoutTemplate[]>>((groups, template) => {
    const current = groups[template.group] ?? [];
    groups[template.group] = [...current, template];
    return groups;
  }, {});

export function getQuizEditorLayoutTemplate(layoutPreset: QuizEditorLayoutPreset) {
  return (
    quizEditorLayoutTemplates.find((template) => template.id === layoutPreset) ??
    quizEditorLayoutTemplates[0]
  );
}

export function toNormalizedStyle(zone: LayoutZone): CSSProperties {
  return {
    left: `${zone.x * 100}%`,
    top: `${zone.y * 100}%`,
    width: `${zone.w * 100}%`,
    height: `${zone.h * 100}%`,
    textAlign: zone.textAlign,
    justifyContent: zone.justifyContent,
    alignItems: zone.alignItems,
  };
}
