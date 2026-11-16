import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";

import { MobileBottomSheet } from "@/features/lms/mobile/components/mobile-bottom-sheet";

type Props = {
  onClose: () => void;
  onToggle: (id: string) => void;
  open: boolean;
  selected: readonly string[];
  teachers: ReadonlyArray<{ id: string; label: string; meta: string }>;
};

/** «Bộ lọc» (6.8): loc theo giao vien, cung nhom «Giáo viên» voi panel trai cua desktop. */
export function AdminMobileFilterSheet({ onClose, onToggle, open, selected, teachers }: Props) {
  return (
    <MobileBottomSheet onOpenChange={(next) => !next && onClose()} open={open} title="Bộ lọc">
      <Typography sx={{ mb: 0.5, typography: "subtitle2" }}>Giáo viên</Typography>
      {teachers.map((teacher) => (
        <FormControlLabel
          control={<Checkbox checked={!selected.length || selected.includes(teacher.id)} onChange={() => onToggle(teacher.id)} size="small" />}
          key={teacher.id}
          label={<Box sx={{ display: "flex", justifyContent: "space-between", typography: "body2", width: "100%" }}><span>{teacher.label}</span><Typography sx={{ color: "text.secondary", typography: "caption" }}>{teacher.meta}</Typography></Box>}
          sx={{ display: "flex", mr: 0, width: "100%", "& .MuiFormControlLabel-label": { flex: 1 } }}
        />
      ))}
    </MobileBottomSheet>
  );
}
