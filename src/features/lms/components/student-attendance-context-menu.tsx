import AddCommentIcon from "@mui/icons-material/AddComment";
import DescriptionIcon from "@mui/icons-material/Description";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import type { ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";

type StudentAttendanceContextMenuProps = {
  menu: { x: number; y: number; student: ClassroomStudent } | null;
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
    { label: "Thêm HS mới", icon: <PersonAddAlt1Icon fontSize="small" />, onClick: onAddStudent },
    { label: "Thay đổi trạng thái HS", icon: <HowToRegIcon fontSize="small" />, onClick: () => onChangeStatus(menu.student) },
    { label: "Note nhanh", icon: <AddCommentIcon fontSize="small" />, onClick: () => onAddNote(menu.student) },
    { label: "Ghi chú với HS này", icon: <DescriptionIcon fontSize="small" />, onClick: () => onOpenNote(menu.student) },
  ];

  return (
    <>
      <Box
        component="button"
        type="button"
        aria-label="Đóng menu học sinh"
        onClick={onClose}
        sx={{ position: "fixed", inset: 0, zIndex: 70, m: 0, p: 0, border: 0, bgcolor: "transparent", cursor: "default" }}
      />
      <Paper
        role="menu"
        elevation={4}
        sx={{ position: "fixed", zIndex: 80, left: menu.x, top: menu.y, width: 256, overflow: "hidden", py: 0.5, border: 1, borderColor: "divider", borderRadius: 1 }}
      >
        <Box sx={{ borderBottom: 1, borderColor: "divider", px: 1.5, py: 1.25 }}>
          <Typography noWrap sx={{ fontSize: 14, fontWeight: 700 }}>{menu.student.name}</Typography>
          <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: 13, fontWeight: 600 }}>{menu.student.className}</Typography>
        </Box>
        {actions.map((action) => (
          <ButtonBase
            key={action.label}
            role="menuitem"
            onClick={() => {
              action.onClick();
              onClose();
            }}
            sx={{ display: "flex", width: "100%", justifyContent: "flex-start", gap: 1, px: 1.5, py: 1.25, color: "text.secondary", fontSize: 14, fontWeight: 600, textAlign: "left", "&:hover": { bgcolor: "action.hover", color: "primary.main" } }}
          >
            {action.icon}
            {action.label}
          </ButtonBase>
        ))}
      </Paper>
    </>
  );
}
