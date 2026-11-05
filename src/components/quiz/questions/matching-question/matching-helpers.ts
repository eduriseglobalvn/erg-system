import { toast } from "sonner";

import type { MatchingPair } from "@/domain/quiz/types";
import { prepareQuizImage, QuizImageRejectedError } from "@/lib/media/quiz-image";

export type DisplayMatchingPair = MatchingPair & {
  leftText: string;
  rightText: string;
  leftIcon?: MatchingPair["promptIcon"];
  rightIcon?: MatchingPair["responseIcon"];
  leftImage?: MatchingPair["promptImage"];
  rightImage?: MatchingPair["responseImage"];
};

// Resolves null (after a toast) when the file is refused or unreadable, so callers keep the current image.
export async function readImageAsDataUrl(file: File): Promise<string | null> {
  try {
    return (await prepareQuizImage(file)).dataUrl;
  } catch (error) {
    toast.error(error instanceof QuizImageRejectedError ? error.message : "Không đọc được ảnh.");
    return null;
  }
}

export function createNextMatchingAssignments(
  currentAssignments: Record<string, string>,
  rowId: string,
  optionId: string,
) {
  const nextAssignments = Object.fromEntries(
    Object.entries(currentAssignments).filter(([existingRowId, existingOptionId]) =>
      existingRowId === rowId ? false : existingOptionId !== optionId,
    ),
  );

  nextAssignments[rowId] = optionId;
  return nextAssignments;
}
