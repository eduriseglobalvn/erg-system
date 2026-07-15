import AddRoundedIcon from "@mui/icons-material/AddRounded";
import GroupAddRoundedIcon from "@mui/icons-material/GroupAddRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { PartnerSchool } from "@/features/lcms/school-management/types/school-management-types";

export function SchoolStructurePanel({ school }: { school: PartnerSchool }) {
  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
        <Box sx={{ alignItems: { xs: "flex-start", sm: "center" }, borderBottom: "1px solid", borderColor: "divider", display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, justifyContent: "space-between", p: 2 }}>
          <Box><Typography sx={{ fontWeight: 850 }}>Khối và lớp học</Typography><Typography color="text.secondary" variant="body2">{school.grades.length} khối · {school.classes.length} lớp trong năm học {school.academicYear}</Typography></Box>
          <Box sx={{ display: "flex", gap: 1 }}><Button startIcon={<AddRoundedIcon />} variant="outlined">Thêm khối</Button><Button startIcon={<AddRoundedIcon />} variant="contained">Thêm lớp</Button></Box>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow><TableCell>Khối</TableCell><TableCell>Lớp học</TableCell><TableCell>Giáo viên chủ nhiệm</TableCell><TableCell align="right">Học sinh</TableCell><TableCell width={52} /></TableRow></TableHead>
            <TableBody>{school.classes.map((classroom) => (
              <TableRow hover key={classroom.id}><TableCell><Chip label={`Khối ${classroom.grade}`} size="small" variant="outlined" /></TableCell><TableCell sx={{ fontWeight: 750 }}>{classroom.name}</TableCell><TableCell>{classroom.homeroomTeacher}</TableCell><TableCell align="right">{classroom.studentCount}</TableCell><TableCell><IconButton aria-label={`Thao tác lớp ${classroom.name}`} size="small"><MoreHorizRoundedIcon /></IconButton></TableCell></TableRow>
            ))}</TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
        <Box sx={{ alignItems: { xs: "flex-start", sm: "center" }, borderBottom: "1px solid", borderColor: "divider", display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, justifyContent: "space-between", p: 2 }}>
          <Box><Typography sx={{ fontWeight: 850 }}>Môn học trường đăng ký</Typography><Typography color="text.secondary" variant="body2">Quản lý môn và gán học sinh theo nhu cầu triển khai.</Typography></Box>
          <Button startIcon={<AddRoundedIcon />} variant="contained">Thêm môn học</Button>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow><TableCell>Mã môn</TableCell><TableCell>Tên môn</TableCell><TableCell align="right">Giáo viên</TableCell><TableCell align="right">Học sinh đã gán</TableCell><TableCell align="right">Thao tác</TableCell></TableRow></TableHead>
            <TableBody>{school.subjects.map((subject) => (
              <TableRow hover key={subject.id}><TableCell><Typography color="text.secondary" sx={{ fontFamily: "var(--font-mono)", fontSize: 12.5 }}>{subject.code}</Typography></TableCell><TableCell sx={{ fontWeight: 750 }}>{subject.name}</TableCell><TableCell align="right">{subject.teacherCount}</TableCell><TableCell align="right">{subject.studentCount}</TableCell><TableCell align="right"><Button size="small" startIcon={<GroupAddRoundedIcon />}>Gán học sinh</Button></TableCell></TableRow>
            ))}</TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
