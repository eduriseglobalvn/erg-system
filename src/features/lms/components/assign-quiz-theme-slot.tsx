import { createContext, useContext, type ReactNode } from "react";

type RenderQuizThemeRow = (quizId: string) => ReactNode;

/** lms may not import lcms, so the app supplies the quiz theme row (an lcms component) through this slot. */
const AssignQuizThemeSlotContext = createContext<RenderQuizThemeRow | null>(null);

export const AssignQuizThemeSlotProvider = AssignQuizThemeSlotContext.Provider;

export function AssignQuizThemeSlot({ quizId }: { quizId: string }) {
  const render = useContext(AssignQuizThemeSlotContext);
  return render ? <>{render(quizId)}</> : null;
}
