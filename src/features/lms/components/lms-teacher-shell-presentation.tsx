import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Class from "@mui/icons-material/Class";

import { classroomSchools } from "@/features/lms/classroom/api/classroom-defaults";
import {
  scopeClassIconSx,
  scopeMenuItemSx,
  scopeMenuLogoSx,
  scopeMenuProps,
  scopeSelectSx,
} from "@/features/lms/components/lms-teacher-shell-scope-styles";
import type { ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";

export function LmsHeaderSchoolControl({
  schoolId,
  schools,
  onSchoolChange,
}: {
  schoolId: string;
  schools: typeof classroomSchools;
  onSchoolChange: (event: { target: { value: string } }) => void;
}) {
  return (
        <Select
          value={schoolId}
          onChange={onSchoolChange}
          size="small"
          displayEmpty
          MenuProps={scopeMenuProps}
          sx={scopeSelectSx({ minWidth: 176, variant: "title" })}
          renderValue={(value) => {
            const school = schools.find((item) => item.id === value);
            return (
              <Stack direction="row" spacing={0.85} sx={{ alignItems: "center", minWidth: 0 }}>
                <SchoolLogo school={school} />
                <Typography noWrap sx={{ color: "#1C252E", fontSize: 14, fontWeight: 600, lineHeight: "22px" }}>
                  {school?.name ?? "Trường"}
                </Typography>
              </Stack>
            );
          }}
        >
          {schools.map((school) => (
            <MenuItem key={school.id} value={school.id} sx={scopeMenuItemSx}>
              <SchoolLogo school={school} />
              <Typography noWrap sx={{ color: "#1C252E", flex: 1, fontSize: 14, fontWeight: 600, minWidth: 0 }}>
                {school.name}
              </Typography>
            </MenuItem>
          ))}
        </Select>
  );
}

export function LmsHeaderClassControl({
  classes,
  selectedClassId,
  onClassChange,
}: {
  classes: ClassroomSnapshot[];
  selectedClassId: string;
  onClassChange: (event: { target: { value: string } }) => void;
}) {
  return (
    <Select
      value={selectedClassId}
      onChange={onClassChange}
      size="small"
      displayEmpty
      MenuProps={scopeMenuProps}
      sx={scopeSelectSx({ minWidth: 118, maxWidth: 184, variant: "title" })}
      renderValue={(value) => {
        const classroom = classes.find((item) => item.id === value);
        return (
          <Stack direction="row" spacing={0.85} sx={{ alignItems: "center", minWidth: 0 }}>
            <Box sx={scopeClassIconSx}>
              <Class sx={{ color: "#0F6CBD", fontSize: 16 }} />
            </Box>
            <Typography noWrap sx={{ color: "#1C252E", fontSize: 14, fontWeight: 600, lineHeight: "22px" }}>
              {classroom?.className ?? "Lớp"}
            </Typography>
          </Stack>
        );
      }}
    >
      {classes.map((classroom) => (
        <MenuItem key={classroom.id} value={classroom.id} sx={scopeMenuItemSx}>
          <Box sx={scopeClassIconSx}>
            <Class sx={{ color: "#0F6CBD", fontSize: 16 }} />
          </Box>
          <Typography noWrap sx={{ color: "#1C252E", flex: 1, fontSize: 14, fontWeight: 600, minWidth: 0 }}>
            {classroom.className}
          </Typography>
        </MenuItem>
      ))}
    </Select>
  );
}

function SchoolLogo({ school }: { school?: (typeof classroomSchools)[number] | { logoURL?: string; name?: string } }) {
  const logoUrl = school?.logoURL;
  const label = getSchoolLogoLabel(school?.name);

  if (logoUrl) {
    return (
      <Box
        component="img"
        alt={school?.name ?? "School"}
        src={logoUrl}
        sx={{
          borderRadius: "8px",
          flexShrink: 0,
          height: 24,
          objectFit: "cover",
          width: 24,
        }}
      />
    );
  }

  return <Box sx={scopeMenuLogoSx}>{label}</Box>;
}

function getSchoolLogoLabel(name?: string) {
  if (!name) return "EDU";
  const firstMeaningful = name
    .split(/\s+/)
    .filter(Boolean)
    .find((part) => !["campus", "center", "learning", "point", "studio"].includes(part.toLowerCase()));
  return (firstMeaningful ?? name).slice(0, 3).toUpperCase();
}
