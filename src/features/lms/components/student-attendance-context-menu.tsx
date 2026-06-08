import { FileText, MessageSquarePlus, UserPlus, UserRoundCheck } from "lucide-react";

import type { ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";
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
    { label: "Thêm HS mới", icon: UserPlus, onClick: onAddStudent },
    { label: "Thay đổi trạng thái HS", icon: UserRoundCheck, onClick: () => onChangeStatus(menu.student) },
    { label: "Note nhanh", icon: MessageSquarePlus, onClick: () => onAddNote(menu.student) },
    { label: "Ghi chú với HS này", icon: FileText, onClick: () => onOpenNote(menu.student) },
  ];

  return (
    <>
      <button type="button" aria-label="Đóng menu học sinh" className="fixed inset-0 z-[70] cursor-default" onClick={onClose} />
      <div
        className="fixed z-[80] w-64 overflow-hidden rounded-lg border border-[#cbd7e6] bg-white py-1 text-[14px] shadow-md shadow-slate-900/10"
        style={{ left: menu.x, top: menu.y }}
        role="menu"
      >
        <div className="border-b border-[#dbe4f0] px-3 py-2.5">
          <div className="truncate text-[14px] font-bold text-slate-950">{menu.student.name}</div>
          <div className="mt-1 text-[13px] font-semibold text-slate-600">{menu.student.className}</div>
        </div>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              className={cn("flex w-full items-center gap-2 px-3 py-2.5 text-left text-[14px] font-semibold text-slate-700 hover:bg-[var(--erg-blue-light)] hover:text-[var(--erg-blue)]")}
              onClick={() => {
                action.onClick();
                onClose();
              }}
              role="menuitem"
            >
              <Icon className="h-4 w-4" />
              {action.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
