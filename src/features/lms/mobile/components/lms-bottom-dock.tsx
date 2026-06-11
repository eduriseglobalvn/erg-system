import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type LmsMobileDockItem<TSection extends string> = {
  id: TSection;
  label: string;
  path: string;
  icon: LucideIcon;
  badgeCount?: number;
};

export function LmsBottomDock<TSection extends string>({
  activeSection,
  items,
  onNavigate,
}: {
  activeSection: TSection;
  items: Array<LmsMobileDockItem<TSection>>;
  onNavigate: (path: string) => void;
}) {
  const dockItemCount = Math.max(items.length, 1);

  return (
    <nav
      aria-label="Điều hướng LMS mobile"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] xl:hidden"
    >
      <div className="mx-auto max-w-[430px] rounded-[26px] border border-[#eef3f8] bg-white px-2.5 py-2.5 shadow-[0_18px_40px_rgba(15,23,42,0.16),0_1px_0_rgba(255,255,255,0.96)_inset]">
        <div className="grid h-[68px] items-stretch" style={{ gridTemplateColumns: `repeat(${dockItemCount}, minmax(0, 1fr))` }}>
          {items.map((item) => (
            <DockButton
              key={item.id}
              active={activeSection === item.id}
              badgeCount={item.badgeCount}
              icon={item.icon}
              label={item.label}
              onClick={() => onNavigate(item.path)}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}

function DockButton({
  active,
  ariaLabel,
  badgeCount,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  ariaLabel?: string;
  badgeCount?: number;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      aria-label={ariaLabel ?? label}
      className={cn(
        "group relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-[20px] text-center",
        "transition-all duration-200 ease-out active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6cbd]/25",
        active ? "bg-[#f0f7ff] text-[#0f6cbd]" : "text-[#6b7280] hover:bg-[#f6f9fc] hover:text-slate-900",
      )}
      onClick={onClick}
    >
      <span
        className={cn(
          "relative grid h-8 w-8 place-items-center rounded-full transition-colors duration-200",
          active ? "bg-[#0f6cbd] text-white shadow-[0_8px_18px_rgba(15,108,189,0.24)]" : "bg-transparent text-[#202327] group-hover:text-[#0f6cbd]",
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={active ? 2.35 : 2.1} />
        {badgeCount ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d13438] px-1 text-[10px] font-black leading-none text-white ring-2 ring-white">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "block max-w-full truncate px-0.5 text-[11px] font-extrabold leading-none tracking-normal",
          active ? "text-[#0f6cbd]" : "text-[#737984]",
        )}
      >
        {label}
      </span>
    </button>
  );
}
