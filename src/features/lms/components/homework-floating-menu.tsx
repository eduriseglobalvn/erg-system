import { useMemo, useState } from "react";
import { FolderOpen, School, Send, Users } from "lucide-react";

import { cn } from "@/lib/utils";

interface HomeworkFloatingMenuProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onAction: (action: string) => void;
}

export function HomeworkFloatingMenu({ open, setOpen, onAction }: HomeworkFloatingMenuProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";

  const items = [
    { id: "giao-bai-tap", icon: Send, label: ["Giao bài tập"], action: "assign" },
    { id: "quan-ly-lop-hoc", icon: School, label: ["Quản lý", "lớp học"], action: "classes" },
    { id: "nhom-hoc-sinh", icon: Users, label: ["Quản lý nhóm", "học sinh"], action: "groups" },
    { id: "kho-bai-tap", icon: FolderOpen, label: ["Kho bài tập"], action: "exerciseBank" },
  ];

  /* Layout constants (px) */
  const TOTAL_H = 580;
  const PANEL_W = 88;
  const BUMP_EXT = 36;
  const SVG_W = PANEL_W + BUMP_EXT;
  const VALLEY_X = BUMP_EXT;
  const PEAK_X = 2;
  const centerY = TOTAL_H / 2;
  const BUMP_H = 132;
  const CLOSED_OFFSET = PANEL_W - 28;

  /* Single center bump SVG path */
  const shapePath = useMemo(() => {
    const vX = VALLEY_X;
    const pX = PEAK_X;
    const r = 34;
    const d: string[] = [];
    const bumpStart = centerY + BUMP_H / 2;
    const bumpEnd = centerY - BUMP_H / 2;

    d.push(`M${SVG_W},0`);
    d.push(`L${SVG_W},${TOTAL_H}`);
    d.push(`L${vX + r},${TOTAL_H}`);
    d.push(`Q${vX},${TOTAL_H} ${vX},${TOTAL_H - r}`);
    d.push(`L${vX},${bumpStart}`);
    d.push(`C${vX},${bumpStart - BUMP_H * 0.34} ${pX},${centerY + BUMP_H * 0.3} ${pX},${centerY}`);
    d.push(`C${pX},${centerY - BUMP_H * 0.3} ${vX},${bumpEnd + BUMP_H * 0.34} ${vX},${bumpEnd}`);
    d.push(`L${vX},${r}`);
    d.push(`Q${vX},0 ${vX + r},0`);
    d.push(`Z`);
    return d.join(" ");
  }, [BUMP_H, SVG_W, VALLEY_X, PEAK_X, centerY, TOTAL_H]);

  // Determine active item based on current URL path
  const getActiveIndex = () => {
    if (currentPath.startsWith("/homework/assign") || currentPath === "/homework") {
      return 0; // Giao bài tập
    }
    if (currentPath.startsWith("/classes")) {
      return 1; // Quản lý lớp học
    }
    if (currentPath.startsWith("/homework/student-groups")) {
      return 2; // Quản lý nhóm học sinh
    }
    if (currentPath.startsWith("/homework/exercise-bank")) {
      return 3; // Kho bài tập
    }
    return -1;
  };

  const activeIndex = getActiveIndex();

  return (
    <aside
      aria-label="Menu nhanh bài tập"
      className="fixed right-0 top-1/2 z-30 hidden -translate-y-1/2 xl:block"
    >
      <div
        className="relative transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
        style={{
          width: SVG_W,
          height: TOTAL_H,
          transform: open ? "translateX(0)" : `translateX(${CLOSED_OFFSET}px)`,
        }}
      >
        {/* Background shape */}
        <svg
          className="absolute inset-0 drop-shadow-sm"
          width={SVG_W}
          height={TOTAL_H}
          viewBox={`0 0 ${SVG_W} ${TOTAL_H}`}
          fill="none"
        >
          <path d={shapePath} fill="white" className="stroke-slate-100/60" strokeWidth="1" />
        </svg>

        {/* Toggle button (dual-pill) */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="absolute z-40 focus:outline-none group cursor-pointer"
          style={{
            left: 0,
            top: centerY,
            width: BUMP_EXT + 8,
            height: BUMP_H,
            transform: "translateY(-50%)",
          }}
          aria-label={open ? "Đóng menu nhanh bài tập" : "Mở menu nhanh bài tập"}
          aria-expanded={open}
        >
          {/* Blue dual-pill indicator centered inside the bump trigger area */}
          <div 
            className="absolute top-1/2 flex items-center gap-[3px] transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              left: 10,
              transform: "translateY(-50%)", // Keep upright and do not rotate on close
            }}
          >
            {/* Small pill */}
            <div className="w-[3px] h-[12px] rounded-full bg-[#1db9ff] opacity-75 transition-opacity group-hover:opacity-100" />
            {/* Main pill */}
            <div className="h-[24px] w-[4px] rounded-full bg-[var(--erg-blue)] shadow-sm transition-colors group-hover:bg-[#028cc9]" />
          </div>
        </button>

        {/* Menu Items list */}
        <div 
          className="absolute inset-y-0 right-0 z-30 flex flex-col justify-around py-8"
          style={{ left: VALLEY_X, width: PANEL_W }}
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeIndex === index;
            const isHovered = hoveredIndex === index;
            return (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => {
                  onAction(item.action);
                }}
                className="group relative flex min-h-[82px] w-full cursor-pointer flex-col items-center justify-center gap-1.5 transition-all duration-300"
                style={{ transform: isHovered ? "translateY(-1px)" : "translateY(0)" }}
              >
                <div className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300",
                  isActive
                    ? "border-[#b8d6fa] bg-[var(--erg-blue-light)] text-[var(--erg-blue)] shadow-sm"
                    : "border-[#d9e0ea] bg-white text-slate-400 shadow-sm group-hover:border-[#b8d6fa] group-hover:text-[var(--erg-blue)] group-hover:shadow-sm"
                )}>
                  <Icon className="h-5 w-5 stroke-[2.35]" />
                </div>
                
                {/* Text lines */}
                <span className={cn(
                  "flex w-full flex-col px-1 text-center text-[12px] font-semibold leading-[1.18]",
                  isActive ? "text-[var(--erg-blue)]" : "text-slate-600 group-hover:text-slate-900"
                )}>
                  {item.label.map((line, lIdx) => (
                    <span key={lIdx}>{line}</span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
