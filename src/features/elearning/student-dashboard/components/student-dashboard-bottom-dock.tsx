import type { ReactNode } from "react";

import type { StudentDockPageKey } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import { cn } from "@/lib/utils";

export function StudentDashboardBottomDock({
  activePage,
  items,
  onPageChange,
}: {
  activePage: string;
  items: Array<{ key: StudentDockPageKey; label: string; icon: ReactNode }>;
  onPageChange: (page: StudentDockPageKey) => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.7rem)]">
      <div className="mx-auto max-w-md rounded-lg border border-[#d7e0ec] bg-[#f6f8fb] px-1.5 py-1.5 shadow-[0_-2px_10px_rgba(15,23,42,0.08)]">
        <div className="grid grid-cols-5 gap-0.5">
          {items.map((item) => {
            const active = activePage === item.key;

            return (
              <button
                key={item.key}
                type="button"
                className={cn(
                  "relative grid min-h-[54px] place-items-center rounded-md border border-transparent px-1 py-1.5 text-center font-semibold transition",
                  active ? "border-[rgba(105, 108, 255, 0.24)] bg-white text-[#696CFF] shadow-sm after:absolute after:inset-x-4 after:bottom-1 after:h-0.5 after:rounded-full after:bg-[#696CFF]" : "text-slate-500 hover:bg-white hover:text-slate-800",
                )}
                onClick={() => onPageChange(item.key)}
              >
                <span className="grid h-4 place-items-center [&_svg]:h-[17px] [&_svg]:w-[17px]">{item.icon}</span>
                <span className="mt-0.5 text-[10px] font-semibold leading-3.5">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
