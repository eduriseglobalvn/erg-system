import { useState } from "react";

import {
  socialReactionKeys,
  type SocialReactionKey,
  type SocialReactionSummary as SocialReactionSummaryType,
} from "@/types/social-reactions";
import { useDebouncedCallback } from "@/hooks/use-paced-callback";
import { cn } from "@/lib/utils";

type ReactionVisual = {
  activeClassName: string;
  glyph: string;
  glyphClassName?: string;
  label: string;
  pickerClassName: string;
};

const reactionVisuals: Record<SocialReactionKey, ReactionVisual> = {
  like: {
    activeClassName: "text-[#1877f2]",
    glyph: "👍",
    label: "Thích",
    pickerClassName: "bg-[#1877f2]",
  },
  love: {
    activeClassName: "text-[#f33e58]",
    glyph: "❤",
    glyphClassName: "translate-y-[-1px] text-white",
    label: "Yêu thích",
    pickerClassName: "bg-[#f33e58]",
  },
  care: {
    activeClassName: "text-[#f7b125]",
    glyph: "🥰",
    label: "Thương thương",
    pickerClassName: "bg-[#f7b125]",
  },
  haha: {
    activeClassName: "text-[#f7b125]",
    glyph: "😆",
    label: "Haha",
    pickerClassName: "bg-[#f7b125]",
  },
  wow: {
    activeClassName: "text-[#f7b125]",
    glyph: "😮",
    label: "Wow",
    pickerClassName: "bg-[#f7b125]",
  },
  sad: {
    activeClassName: "text-[#f7b125]",
    glyph: "😢",
    label: "Buồn",
    pickerClassName: "bg-[#f7b125]",
  },
  angry: {
    activeClassName: "text-[#e9710f]",
    glyph: "😡",
    label: "Phẫn nộ",
    pickerClassName: "bg-[#e9710f]",
  },
};

type SocialReactionActionProps = {
  activeReaction: SocialReactionKey | null;
  compact?: boolean;
  idleLabel?: string;
  onReaction: (reaction: SocialReactionKey) => void;
};

export function SocialReactionAction({
  activeReaction,
  compact,
  idleLabel = "Thích",
  onReaction,
}: SocialReactionActionProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const closePicker = useDebouncedCallback(() => setPickerOpen(false), 180);
  const activeMeta = activeReaction ? reactionVisuals[activeReaction] : null;

  function openPicker() {
    closePicker.cancel();
    setPickerOpen(true);
  }

  function scheduleClose() {
    closePicker.run();
  }

  function chooseReaction(reaction: SocialReactionKey) {
    closePicker.cancel();
    onReaction(reaction);
    setPickerOpen(false);
  }

  return (
    <div
      className="relative inline-flex justify-center"
      onBlur={scheduleClose}
      onFocus={openPicker}
      onMouseEnter={openPicker}
      onMouseLeave={scheduleClose}
    >
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition",
          compact ? "h-auto p-0 text-xs hover:text-[#1877f2]" : "h-10 w-full text-sm hover:bg-slate-100",
          activeMeta ? activeMeta.activeClassName : "text-slate-600",
        )}
        type="button"
        onClick={() => onReaction(activeReaction ?? "like")}
        onMouseEnter={openPicker}
      >
        <span className={cn("grid h-5 w-5 place-items-center text-base leading-none transition-transform", activeMeta && "scale-110")}>
          {activeMeta ? activeMeta.glyph : reactionVisuals.like.glyph}
        </span>
        {activeMeta ? activeMeta.label : idleLabel}
      </button>

      <div
        className={cn(
          "absolute bottom-full left-1/2 z-50 mb-1.5 flex h-[50px] -translate-x-1/2 items-center gap-0 rounded-full border border-black/10 bg-white px-1.5 shadow-sm transition-[opacity,transform] duration-150 ease-out",
          pickerOpen ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-1.5 scale-95 opacity-0",
        )}
        onMouseEnter={openPicker}
        onMouseLeave={scheduleClose}
      >
        <span className="absolute left-0 right-0 top-full h-3" />
        {socialReactionKeys.map((reaction) => (
          <button
            key={reaction}
            aria-label={reactionVisuals[reaction].label}
            className="relative grid h-11 w-11 place-items-center rounded-full transition duration-150 ease-out hover:bg-slate-50"
            title={reactionVisuals[reaction].label}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              chooseReaction(reaction);
            }}
            onMouseDown={(event) => event.preventDefault()}
          >
            <SocialReactionGlyph reaction={reaction} selected={activeReaction === reaction} size="picker" />
          </button>
        ))}
      </div>
    </div>
  );
}

type SocialReactionSummaryProps = {
  emptyLabel?: string;
  reactions: SocialReactionSummaryType;
  total: number;
};

export function SocialReactionSummary({ emptyLabel = "Hãy là người đầu tiên thả cảm xúc", reactions, total }: SocialReactionSummaryProps) {
  const activeReactions = socialReactionKeys.filter((reaction) => reactions[reaction].count > 0).slice(0, 3);

  if (total === 0) {
    return <span>{emptyLabel}</span>;
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="flex -space-x-1">
        {activeReactions.map((reaction) => (
          <SocialReactionGlyph key={reaction} reaction={reaction} size="summary" />
        ))}
      </span>
      <span className="truncate">{total}</span>
    </div>
  );
}

export function SocialReactionCountBadge({ reactions, total }: SocialReactionSummaryProps) {
  const topReaction = socialReactionKeys.find((reaction) => reactions[reaction].count > 0) ?? "like";

  if (total === 0) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white px-1.5 py-0.5 shadow-sm">
      <SocialReactionGlyph reaction={topReaction} size="tiny" />
      {total}
    </span>
  );
}

function SocialReactionGlyph({
  reaction,
  selected,
  size,
}: {
  reaction: SocialReactionKey;
  selected?: boolean;
  size: "picker" | "summary" | "tiny";
}) {
  const visual = reactionVisuals[reaction];
  const isCircleReaction = reaction === "like" || reaction === "love";

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full ring-white",
        isCircleReaction ? cn("text-white shadow-sm", visual.pickerClassName) : "bg-transparent shadow-none",
        size === "picker" && cn("h-10 w-10 text-[32px]", isCircleReaction && "text-[24px] ring-2"),
        size === "summary" && cn("h-6 w-6 text-[18px]", isCircleReaction && "text-[13px] ring-2"),
        size === "tiny" && cn("h-4 w-4 text-[12px]", isCircleReaction && "text-[9px] ring-1"),
        selected && "shadow-sm ring-[3px]",
      )}
    >
      <span className={cn("leading-none", visual.glyphClassName)}>{visual.glyph}</span>
    </span>
  );
}
