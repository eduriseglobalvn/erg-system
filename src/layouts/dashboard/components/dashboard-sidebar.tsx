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
    <aside className="flex w-[288px] shrink-0 flex-col border-r border-[#cbd7e6] bg-[#f8fbff] shadow-[1px_0_0_rgba(15,23,42,0.05)]">

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.title}>
              <div className="px-1 text-[12px] font-semibold text-slate-600">{group.title}</div>
              <div className="mt-2 border-l border-[#cbd7e6] pl-3">
                <div className="space-y-1.5">
                  {group.items.map((item) => {
                    const isActive = item.id === activeLeaf.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelect(item.id)}
                        className={cn(
                          "relative flex min-h-9 w-full items-center rounded-lg border border-transparent px-3 py-2 text-left text-sm font-semibold transition hover:border-[#cbd7e6] hover:bg-white hover:text-slate-950 hover:shadow-[var(--shadow-xs)]",
                          isActive ? "border-transparent bg-white text-[var(--primary)] shadow-[var(--shadow-xs)] before:absolute before:left-[-13px] before:top-1.5 before:h-[calc(100%-12px)] before:w-1 before:rounded-r-full before:bg-[var(--primary)]" : "text-slate-700",
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
