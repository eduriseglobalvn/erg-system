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
      <div className="mx-auto max-w-md rounded-[22px] border border-slate-200/90 bg-white px-1.5 py-1.5 shadow-[0_10px_26px_rgba(15,23,42,0.12)]">
        <div className="grid grid-cols-5 gap-0.5">
          {items.map((item) => {
            const active = activePage === item.key;

            return (
              <button
                key={item.key}
                type="button"
                className={cn(
                  "grid min-h-[54px] place-items-center rounded-[16px] px-1 py-1.5 text-center transition",
                  active ? "bg-[#e8f0fe] text-[#1557ff]" : "text-slate-500 hover:bg-slate-50",
                )}
                onClick={() => onPageChange(item.key)}
              >
                <span className="grid h-4 place-items-center [&_svg]:h-[17px] [&_svg]:w-[17px]">{item.icon}</span>
                <span className="mt-0.5 text-[10px] font-medium leading-3.5">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
