import type { CSSProperties, ReactNode } from "react";

import { getQuizThemeStyle, resolveQuizTheme } from "@/domain/quiz/quiz-themes";
import type { Quiz, Theme } from "@/domain/quiz/types";

type QuizThemeLike = {
  themeId?: string;
  theme?: Partial<Theme> | null;
};

export function QuizThemeSurface({
  quiz,
  className = "",
  style,
  children,
}: {
  quiz: Pick<Quiz, "themeId" | "theme"> | QuizThemeLike;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const resolvedTheme = resolveQuizTheme(quiz.themeId, quiz.theme);

  return (
    <div className={className} style={{ ...getQuizThemeStyle(resolvedTheme), ...style }}>
      {children}
    </div>
  );
}
