import { toast } from "sonner";

import { prepareQuizImage, QuizImageRejectedError } from "@/lib/media/quiz-image";

/** prepareQuizImage plus the shared toast; null when the file is refused or unreadable, so callers keep the current image. */
export async function readQuizImage(file: File): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    return await prepareQuizImage(file);
  } catch (error) {
    toast.error(error instanceof QuizImageRejectedError ? error.message : "Không đọc được ảnh.");
    return null;
  }
}
