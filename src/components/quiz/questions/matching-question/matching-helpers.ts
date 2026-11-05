import type { MatchingPair, QuestionImage } from "@/domain/quiz/types";

export type DisplayMatchingPair = MatchingPair & {
  leftText: string;
  rightText: string;
  leftIcon?: MatchingPair["promptIcon"];
  rightIcon?: MatchingPair["responseIcon"];
  leftImage?: MatchingPair["promptImage"];
  rightImage?: MatchingPair["responseImage"];
};

/** What a screen reader calls a piece: its text, then its image's alt, then its old icon, then "ảnh". */
export const pieceName = (text: string | undefined, image?: QuestionImage, icon?: string) => text || image?.alt || icon || "ảnh";

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
