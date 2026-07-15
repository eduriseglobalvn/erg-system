import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { MobileBottomSheet } from "./mobile-bottom-sheet";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export type LmsMobileSchoolOption = { id: string; name: string };
export type LmsMobileClassOption = { className: string; id: string; schoolId: string };

export function LmsScopeSheet({
  classes, open, schools, selectedClassId, selectedSchoolId,
  onClassChange, onOpenChange, onSchoolChange,
}: {
  classes: LmsMobileClassOption[];
  open: boolean;
  schools: LmsMobileSchoolOption[];
  selectedClassId: string;
  selectedSchoolId: string;
  onClassChange: (classId: string) => void;
  onOpenChange: (open: boolean) => void;
  onSchoolChange: (schoolId: string) => void;
}) {
  const selectedClassOptions = classes.filter((classroom) => classroom.schoolId === selectedSchoolId);
  const selectedSchool = schools.find((school) => school.id === selectedSchoolId);

  return (
    <MobileBottomSheet
      description={selectedSchool?.name ?? "Chọn trường và lớp đang dạy"}
      onOpenChange={onOpenChange}
      open={open}
      title="Phạm vi giảng dạy"
    >
      <Stack spacing={2}>
        <Stack alignItems="center" direction="row" spacing={1} sx={{ color: "text.secondary" }}>
          <BusinessRoundedIcon sx={{ fontSize: 18 }} />
          <Typography sx={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>Trường</Typography>
        </Stack>
        <FormControl fullWidth>
          <InputLabel id="lms-mobile-school-label">Chọn trường</InputLabel>
          <Select
            label="Chọn trường"
            labelId="lms-mobile-school-label"
            onChange={(event) => onSchoolChange(event.target.value)}
            value={selectedSchoolId}
          >
            {schools.map((school) => <MenuItem key={school.id} value={school.id}>{school.name}</MenuItem>)}
          </Select>
        </FormControl>

        <Stack alignItems="center" direction="row" spacing={1} sx={{ color: "text.secondary", pt: 0.5 }}>
          <SchoolRoundedIcon sx={{ fontSize: 18 }} />
          <Typography sx={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>Lớp đang dạy</Typography>
        </Stack>
        <Stack spacing={1}>
          {selectedClassOptions.length ? selectedClassOptions.map((classroom) => {
            const active = classroom.id === selectedClassId;
            return (
              <ButtonBase
                key={classroom.id}
                onClick={() => { onClassChange(classroom.id); onOpenChange(false); }}
                sx={{
                  alignItems: "center",
                  bgcolor: active ? ergEnterpriseTokens.color.primarySofter : "background.paper",
                  border: "1px solid",
                  borderColor: active ? "primary.light" : "divider",
                  borderRadius: 2,
                  color: active ? "primary.main" : "text.primary",
                  display: "flex",
                  gap: 1.5,
                  justifyContent: "space-between",
                  minHeight: 52,
                  px: 1.5,
                  py: 1,
                  textAlign: "left",
                  width: "100%",
                  "&:hover": { bgcolor: active ? ergEnterpriseTokens.color.primarySoft : "action.hover" },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap sx={{ fontSize: 14, fontWeight: 800 }}>{classroom.className}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: 12, fontWeight: 600, mt: 0.25 }}>{selectedSchool?.name ?? "ERG"}</Typography>
                </Box>
                {active ? <CheckRoundedIcon sx={{ flexShrink: 0 }} /> : null}
              </ButtonBase>
            );
          }) : (
            <Box sx={{ border: "1px dashed", borderColor: "divider", borderRadius: 2, px: 1.5, py: 2 }}>
              <Typography color="text.secondary" sx={{ fontWeight: 600 }} variant="body2">Chưa có lớp trong trường này.</Typography>
            </Box>
          )}
        </Stack>
      </Stack>
    </MobileBottomSheet>
  );
}
