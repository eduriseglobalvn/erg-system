import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { PartnerSchool } from "@/features/lcms/school-management/types/school-management-types";

type StudentScopeNavigatorProps = {
  school: PartnerSchool;
  selectedClass: string;
  selectedGrade: string;
  onSelectClass: (className: string, grade: string) => void;
  onSelectGrade: (grade: string) => void;
  onSelectSchool: () => void;
};

export function StudentScopeNavigator({ school, selectedClass, selectedGrade, onSelectClass, onSelectGrade, onSelectSchool }: StudentScopeNavigatorProps) {
  return (
    <Paper variant="outlined" sx={{ alignSelf: "start", overflow: "hidden", position: { lg: "sticky" }, top: { lg: 150 } }}>
      <Box sx={{ borderBottom: "1px solid", borderColor: "divider", px: 1.5, py: 1.25 }}>
        <Typography sx={{ alignItems: "center", display: "flex", fontSize: 13.5, fontWeight: 850, gap: 0.75 }}>
          <AccountTreeRoundedIcon color="primary" sx={{ fontSize: 18 }} /> Cơ cấu người học
        </Typography>
        <Typography color="text.secondary" variant="caption">Chọn phạm vi để lọc tức thì</Typography>
      </Box>
      <List dense disablePadding sx={{ p: 0.75 }}>
        <ListItemButton onClick={onSelectSchool} selected={selectedGrade === "all" && selectedClass === "all"} sx={{ borderRadius: 1, minHeight: 38 }}>
          <ListItemIcon sx={{ minWidth: 30 }}><GroupsRoundedIcon sx={{ fontSize: 18 }} /></ListItemIcon>
          <ListItemText primary="Toàn trường" slotProps={{ primary: { sx: { fontSize: 13, fontWeight: 750 } } }} />
          <Chip label={school.students.length} size="small" sx={{ height: 20, fontSize: 10.5 }} />
        </ListItemButton>
        {school.grades.map((grade) => {
          const gradeClasses = school.classes.filter((classroom) => classroom.grade === grade);
          const gradeCount = school.students.filter((student) => student.grade === grade).length;
          const gradeSelected = selectedGrade === grade && selectedClass === "all";
          return (
            <Box key={grade} sx={{ mt: 0.5 }}>
              <ListItemButton onClick={() => onSelectGrade(grade)} selected={gradeSelected} sx={{ borderRadius: 1, minHeight: 36 }}>
                <ListItemIcon sx={{ minWidth: 28 }}><KeyboardArrowRightRoundedIcon sx={{ color: gradeSelected ? "primary.main" : "text.secondary", fontSize: 18 }} /></ListItemIcon>
                <ListItemText primary={`Khối ${grade}`} slotProps={{ primary: { sx: { fontSize: 13, fontWeight: 800 } } }} />
                <Typography color="text.secondary" variant="caption">{gradeCount}</Typography>
              </ListItemButton>
              <List dense disablePadding sx={{ ml: 2.25, mt: 0.25, pl: 1, borderLeft: "1px solid", borderColor: "divider" }}>
                {gradeClasses.map((classroom) => {
                  const selected = selectedClass === classroom.name;
                  const actualCount = school.students.filter((student) => student.className === classroom.name).length;
                  return (
                    <ListItemButton key={classroom.id} onClick={() => onSelectClass(classroom.name, grade)} selected={selected} sx={{ borderRadius: 1, minHeight: 34, px: 1 }}>
                      <ListItemText primary={classroom.name} secondary={classroom.homeroomTeacher} slotProps={{ primary: { sx: { fontSize: 12.5, fontWeight: selected ? 850 : 700 } }, secondary: { noWrap: true, sx: { fontSize: 10.5 } } }} />
                      <Chip color={selected ? "primary" : "default"} label={actualCount} size="small" sx={{ height: 18, fontSize: 10 }} variant={selected ? "filled" : "outlined"} />
                    </ListItemButton>
                  );
                })}
              </List>
            </Box>
          );
        })}
        {!school.grades.length ? school.classes.map((classroom) => (
          <ListItemButton key={classroom.id} onClick={() => onSelectClass(classroom.name, classroom.grade)} selected={selectedClass === classroom.name} sx={{ borderRadius: 1, minHeight: 38, mt: 0.5 }}>
            <ListItemText primary={classroom.name} secondary={classroom.homeroomTeacher} slotProps={{ primary: { sx: { fontSize: 13, fontWeight: 750 } }, secondary: { sx: { fontSize: 10.5 } } }} />
          </ListItemButton>
        )) : null}
      </List>
    </Paper>
  );
}
