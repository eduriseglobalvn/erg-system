import { FileText, MessageSquarePlus, UserPlus, UserRoundCheck } from "lucide-react";

import type { ClassroomStudent } from "@/features/classroom/types/classroom-types";
import { cn } from "@/lib/utils";

type StudentAttendanceContextMenuProps = {
  menu: {
    x: number;
    y: number;
    student: ClassroomStudent;
  } | null;
  onAddStudent: () => void;
  onAddNote: (student: ClassroomStudent) => void;
  onChangeStatus: (student: ClassroomStudent) => void;
  onClose: () => void;
  onOpenNote: (student: ClassroomStudent) => void;
};

export function StudentAttendanceContextMenu({
  menu,
  onAddStudent,
  onAddNote,
  onChangeStatus,
  onClose,
  onOpenNote,
}: StudentAttendanceContextMenuProps) {
  if (!menu) return null;

  const actions = [
    { label: "ThÃªm HS má»›i", icon: UserPlus, onClick: onAddStudent },
    { label: "Thay Ä‘á»•i tráº¡ng thÃ¡i HS", icon: UserRoundCheck, onClick: () => onChangeStatus(menu.student) },
    { label: "Note nhanh", icon: MessageSquarePlus, onClick: () => onAddNote(menu.student) },
    { label: "Ghi chÃº vá»›i HS nÃ y", icon: FileText, onClick: () => onOpenNote(menu.student) },
  ];

  return (
    <>
      <button type="button" aria-label="ÄÃ³ng menu há»c sinh" className="fixed inset-0 z-[70] cursor-default" onClick={onClose} />
      <div
        className="fixed z-[80] w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-xl shadow-slate-900/15"
        style={{ left: menu.x, top: menu.y }}
        role="menu"
      >
        <div className="border-b border-slate-100 px-3 py-2">
          <div className="truncate text-xs font-black text-slate-950">{menu.student.name}</div>
          <div className="mt-0.5 text-[11px] font-semibold text-slate-500">{menu.student.className}</div>
        </div>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              className={cn("flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700")}
              onClick={() => {
                action.onClick();
                onClose();
              }}
              role="menuitem"
            >
              <Icon className="h-3.5 w-3.5" />
              {action.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
