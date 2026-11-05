import type { QuestionImage } from "@/domain/quiz/types";

export function SequenceInlineImage({ image, label }: { image?: QuestionImage; label: string }) {
  if (!image?.url) return null;

  return (
    <span
      className="sequence-question-image"
      style={image.width ? { width: image.width, height: image.width } : undefined}
    >
      <img src={image.url} alt={image.alt ?? label} className="h-full w-full object-contain" />
    </span>
  );
}
