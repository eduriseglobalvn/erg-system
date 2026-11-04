import type { MatchingPair } from "@/lib/types";

export type DisplayMatchingPair = MatchingPair & {
  leftText: string;
  rightText: string;
  leftIcon?: MatchingPair["promptIcon"];
  rightIcon?: MatchingPair["responseIcon"];
  leftImage?: MatchingPair["promptImage"];
  rightImage?: MatchingPair["responseImage"];
};

export function createMatchingId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

export function readImageAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Cannot read image file."));
    reader.readAsDataURL(file);
  });
}

export function resizeMatchingTextarea(textarea: HTMLTextAreaElement | null) {
  if (!textarea) return;
  textarea.style.height = "0px";
  textarea.style.height = `${textarea.scrollHeight}px`;
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
