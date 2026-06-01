import { DashboardAccountCard } from "@/layouts/dashboard/components/dashboard-account-card";
import type { DashboardGroup, DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { cn } from "@/utils/cn";

export function DashboardSidebar({
  groups,
  activeLeaf,
  onSelect,
}: {
  groups: DashboardGroup[];
  activeLeaf: DashboardLeaf;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="flex w-[288px] shrink-0 flex-col border-r border-slate-200 bg-[#fafafa]">

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="space-y-7">
          {groups.map((group) => (
            <div key={group.title}>
              <div className="text-[15px] font-semibold text-slate-950">{group.title}</div>
              <div className="mt-3 border-l border-slate-200 pl-4">
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = item.id === activeLeaf.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelect(item.id)}
                        className={cn(
                          "flex w-full items-center rounded-xl px-3 py-2 text-left text-[15px] transition",
                          isActive ? "bg-slate-100 font-medium text-slate-950" : "text-slate-950 hover:bg-slate-50",
                        )}
                      >
                        {item.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <DashboardAccountCard />
    </aside>
  );
}
