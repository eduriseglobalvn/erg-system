import type { QuestionImage } from "@/domain/quiz/types";

/** What a screen reader calls a piece: its text, then its image's alt, then its old icon, then "ảnh". */
export const pieceName = (text: string | undefined, image?: QuestionImage, icon?: string) => text || image?.alt || icon || "ảnh";
