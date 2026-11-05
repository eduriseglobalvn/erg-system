import type { MatchingPair } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";

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
        // Safari 15 (iPhone 7) has no color-mix(), so the tint comes from fixed tokens.
        borderColor: tokens.color.primarySoft,
        backgroundColor: tokens.color.primarySofter,
      }}
      aria-hidden="true"
    >
      {icon}
    </span>
  );
}
