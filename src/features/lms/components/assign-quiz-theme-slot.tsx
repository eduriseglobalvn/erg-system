import Typography from "@mui/material/Typography";
import { createContext, useContext, type ReactNode } from "react";

type RenderQuizThemeRow = (quizId: string) => ReactNode;

/** lms may not import lcms, so the app supplies the quiz theme row (an lcms component) through this slot. */
const AssignQuizThemeSlotContext = createContext<RenderQuizThemeRow | null>(null);

export const AssignQuizThemeSlotProvider = AssignQuizThemeSlotContext.Provider;

/** The theme belongs to a quiz: one selected quiz shows its row, several show a hint, none shows nothing. */
export function AssignQuizThemeSlot({ selectedQuizIds }: { selectedQuizIds: ReadonlySet<string> }) {
  const render = useContext(AssignQuizThemeSlotContext);
  if (!render || selectedQuizIds.size === 0) return null;
  if (selectedQuizIds.size > 1) return <Typography color="text.secondary" variant="caption">Chọn một bài để xem theme</Typography>;
  return <>{render([...selectedQuizIds][0])}</>;
}
