import type { MatchingPair } from "@/domain/quiz/types";

export function MatchingInlineMedia({
  image,
  icon,
  label,
}: {
  image?: MatchingPair["promptImage"];
  icon?: string;
  label: string;
}) {
  if (image?.url) {
    return (
      <span className="matching-inline-media grid h-8 w-8 flex-none place-items-center overflow-hidden rounded-md border border-slate-200 bg-white">
        <img src={image.url} alt={image.alt ?? label} className="h-full w-full object-contain" />
      </span>
    );
  }

  if (!icon) return null;

  return (
    <span
      className="matching-inline-media grid h-8 w-8 flex-none place-items-center rounded-md border text-base font-semibold"
      style={{
        color: "var(--quiz-accent-start)",
        borderColor: "color-mix(in srgb, var(--quiz-accent-start) 28%, transparent)",
        backgroundColor: "color-mix(in srgb, var(--quiz-accent-start) 9%, transparent)",
      }}
      aria-hidden="true"
    >
      {icon}
    </span>
  );
}
