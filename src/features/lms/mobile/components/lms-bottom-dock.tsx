import { MoreHorizontal, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type LmsMobileDockItem<TSection extends string> = {
  id: TSection;
  label: string;
  path: string;
  icon: LucideIcon;
};

const dockWavePositions = ["left-[10%]", "left-[30%]", "left-[50%]", "left-[70%]", "left-[90%]"] as const;

export function LmsBottomDock<TSection extends string>({
  activeSection,
  items,
  moreActive,
  onMoreOpen,
  onNavigate,
}: {
  activeSection: TSection;
  items: Array<LmsMobileDockItem<TSection>>;
  moreActive: boolean;
  onMoreOpen: () => void;
  onNavigate: (path: string) => void;
}) {
  const activeIndex = moreActive ? items.length : Math.max(0, items.findIndex((item) => item.id === activeSection));
  const wavePosition = dockWavePositions[Math.min(activeIndex, dockWavePositions.length - 1)];

  return (
    <nav
      aria-label="Dieu huong LMS tren mobile"
      className="fixed inset-x-0 bottom-0 z-40 px-2.5 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] xl:hidden"
    >
      <div className="relative mx-auto max-w-[390px]">
        <div
          className={cn(
            "pointer-events-none absolute -top-px z-20 h-[34px] w-[66px] -translate-x-1/2 text-[var(--erg-blue)]",
            "transition-[left,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            wavePosition,
          )}
          aria-hidden="true"
        >
          <svg viewBox="0 0 66 34" className="h-full w-full" preserveAspectRatio="none">
            <path
              fill="currentColor"
              d="M0 0H66C57.1 0 52.6 5.8 47.8 13.4C43.8 19.7 39.5 23.7 33 23.7C26.5 23.7 22.2 19.7 18.2 13.4C13.4 5.8 8.9 0 0 0Z"
            />
            <circle cx="33" cy="12.5" r="5.8" fill="white" />
          </svg>
        </div>

        <div className="relative z-10 rounded-[22px] border border-white/90 bg-white px-2.5 pb-2 pt-3.5 shadow-[0_10px_24px_rgba(15,23,42,0.16),0_1px_0_rgba(255,255,255,0.95)_inset] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">
          <div className="relative z-10 grid h-[48px] grid-cols-5 items-end gap-1">
            {items.map((item) => {
              const active = activeSection === item.id;

              return (
                <DockButton
                  key={item.id}
                  active={active}
                  icon={item.icon}
                  label={item.label}
                  onClick={() => onNavigate(item.path)}
                />
              );
            })}

            <DockButton
              active={moreActive}
              ariaLabel="Mo them chuc nang LMS"
              icon={MoreHorizontal}
              label={"Th\u00eam"}
              onClick={onMoreOpen}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

function DockButton({
  active,
  ariaLabel,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  ariaLabel?: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      aria-label={ariaLabel}
      className={cn(
        "group relative flex h-[46px] min-w-0 flex-col items-center justify-end gap-1 text-center",
        "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--erg-blue)]/25",
        active ? "text-[var(--erg-blue)]" : "text-[#747b86]",
      )}
      onClick={onClick}
    >
      <span
        className={cn(
          "grid h-8 w-8 place-items-center will-change-transform",
          "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          active
            ? "-translate-y-0.5 scale-100 text-[var(--erg-blue)]"
            : "scale-100 text-[#202327] group-hover:-translate-y-0.5 group-hover:text-[var(--erg-blue)] group-active:translate-y-0 group-active:scale-90",
        )}
      >
        <Icon
          className="h-[21px] w-[21px] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          strokeWidth={active ? 2.1 : 2}
        />
      </span>
      <span
        className={cn(
          "block max-w-full truncate px-0.5 text-[9px] font-bold leading-none tracking-normal",
          "transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          active ? "text-[var(--erg-blue)]" : "text-[#7b7f86]",
        )}
      >
        {label}
      </span>
    </button>
  );
}
