import type { CSSProperties, ReactNode } from "react";

import { playerTemplateToSurfaceVars } from "@/components/quiz/player-template-surface";
import { getQuizThemeStyle, resolveQuizTheme } from "@/domain/quiz/quiz-themes";
import type { Quiz, Theme } from "@/domain/quiz/types";

type QuizThemeLike = {
  themeId?: string;
  theme?: Partial<Theme> | null;
  playerTemplate?: unknown;
};

export function QuizThemeSurface({
  quiz,
  className = "",
  style,
  children,
}: {
  quiz: Pick<Quiz, "themeId" | "theme" | "playerTemplate"> | QuizThemeLike;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const resolvedTheme = resolveQuizTheme(quiz.themeId, quiz.theme);
  // The teacher's player template wins over settings.theme wherever both set the same thing.
  const templateVars = playerTemplateToSurfaceVars(quiz.playerTemplate);
  const pageBackground = templateVars["--quiz-page-bg"];

  return (
    <div
      className={className}
      style={{ ...getQuizThemeStyle(resolvedTheme), ...templateVars, ...(pageBackground ? { background: pageBackground } : {}), ...style } as CSSProperties}
    >
      {children}
    </div>
  );
}
