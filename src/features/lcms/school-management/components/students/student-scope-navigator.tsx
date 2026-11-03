import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import type { PartnerSchool } from "@/features/lcms/school-management/types/school-management-types";

type StudentScopeNavigatorProps = {
  school: PartnerSchool;
  selectedClass: string;
  selectedGrade: string;
  onSelectClass: (className: string, grade: string) => void;
  onSelectGrade: (grade: string) => void;
  onSelectSchool: () => void;
};

export function StudentScopeNavigator({
  school,
  selectedClass,
  selectedGrade,
  onSelectClass,
  onSelectGrade,
  onSelectSchool,
}: StudentScopeNavigatorProps) {
  const [expandedGrades, setExpandedGrades] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    school.grades.forEach((g) => {
      // Auto expand grades with classes or matching selected
      initial[g] = true;
    });
    return initial;
  });

  useEffect(() => {
    if (selectedGrade !== "all") {
      setExpandedGrades((prev) => ({ ...prev, [selectedGrade]: true }));
    }
  }, [selectedGrade]);

  const toggleGradeExpand = (grade: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedGrades((prev) => ({ ...prev, [grade]: !prev[grade] }));
  };

  const isAllSelected = selectedGrade === "all" && selectedClass === "all";

  return (
    <Paper
      elevation={0}
      sx={{
        alignSelf: "start",
        bgcolor: "#FFFFFF",
        borderRadius: "16px",
        border: "1px solid rgba(0, 0, 0, 0.06)",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02), 0 8px 24px -4px rgba(0, 0, 0, 0.04)",
        overflow: "hidden",
        position: { lg: "sticky" },
        top: { lg: 140 },
      }}
    >
      {/* Apple Section Header */}
      <Box
        sx={{
          alignItems: "center",
          bgcolor: "rgba(0, 0, 0, 0.015)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
          display: "flex",
          gap: 1.25,
          px: 2,
          py: 1.5,
        }}
      >
        <Box
          sx={{
            alignItems: "center",
            bgcolor: "rgba(0, 113, 227, 0.08)",
            borderRadius: "9px",
            color: "#0071E3",
            display: "flex",
            height: 32,
            justifyContent: "center",
            width: 32,
          }}
        >
          <AccountTreeRoundedIcon sx={{ fontSize: 18 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: "#1D1D1F",
              fontSize: "0.85rem",
              fontWeight: 750,
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
            }}
          >
            Cơ cấu người học
          </Typography>
          <Typography
            sx={{
              color: "#86868B",
              fontSize: "0.72rem",
              fontWeight: 500,
              mt: 0.2,
            }}
          >
            Chọn phạm vi để lọc tức thì
          </Typography>
        </Box>
      </Box>

      {/* Navigation Tree List */}
      <List dense disablePadding sx={{ p: 1 }}>
        {/* Whole School Option */}
        <ListItemButton
          onClick={onSelectSchool}
          selected={isAllSelected}
          sx={{
            bgcolor: isAllSelected ? "rgba(0, 113, 227, 0.09) !important" : "transparent",
            borderRadius: "10px",
            color: isAllSelected ? "#0071E3" : "#1D1D1F",
            mb: 0.5,
            minHeight: 38,
            px: 1.25,
            transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
            "&:hover": {
              bgcolor: isAllSelected ? "rgba(0, 113, 227, 0.13) !important" : "rgba(0, 0, 0, 0.035)",
            },
            "&:active": {
              transform: "scale(0.985)",
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 30 }}>
            <GroupsRoundedIcon sx={{ color: isAllSelected ? "#0071E3" : "#86868B", fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText
            primary="Toàn trường"
            slotProps={{
              primary: {
                sx: {
                  color: isAllSelected ? "#0071E3" : "#1D1D1F",
                  fontSize: "0.825rem",
                  fontWeight: isAllSelected ? 750 : 600,
                  letterSpacing: "-0.01em",
                },
              },
            }}
          />
          <Box
            sx={{
              bgcolor: isAllSelected ? "rgba(0, 113, 227, 0.16)" : "rgba(0, 0, 0, 0.05)",
              borderRadius: "9999px",
              color: isAllSelected ? "#0071E3" : "#6E6E73",
              fontSize: "0.7rem",
              fontWeight: 700,
              lineHeight: 1,
              px: 1,
              py: 0.35,
            }}
          >
            {school.students.length}
          </Box>
        </ListItemButton>

        {/* Grades Breakdown */}
        {school.grades.map((grade) => {
          const gradeClasses = school.classes.filter((classroom) => classroom.grade === grade);
          const gradeCount = school.students.filter((student) => student.grade === grade).length;
          const gradeSelected = selectedGrade === grade && selectedClass === "all";
          const isExpanded = Boolean(expandedGrades[grade]);
          const hasClasses = gradeClasses.length > 0;

          return (
            <Box key={grade} sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => onSelectGrade(grade)}
                selected={gradeSelected}
                sx={{
                  bgcolor: gradeSelected ? "rgba(0, 113, 227, 0.09) !important" : "transparent",
                  borderRadius: "10px",
                  color: gradeSelected ? "#0071E3" : "#1D1D1F",
                  minHeight: 36,
                  px: 1.25,
                  transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                  "&:hover": {
                    bgcolor: gradeSelected ? "rgba(0, 113, 227, 0.13) !important" : "rgba(0, 0, 0, 0.035)",
                  },
                  "&:active": {
                    transform: "scale(0.985)",
                  },
                }}
              >
                <ListItemIcon
                  onClick={(e) => {
                    if (hasClasses) toggleGradeExpand(grade, e);
                  }}
                  sx={{
                    cursor: hasClasses ? "pointer" : "default",
                    minWidth: 26,
                  }}
                >
                  <KeyboardArrowRightRoundedIcon
                    sx={{
                      color: gradeSelected ? "#0071E3" : "#86868B",
                      fontSize: 18,
                      transform: isExpanded && hasClasses ? "rotate(90deg)" : "rotate(0deg)",
                      transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={`Khối ${grade}`}
                  slotProps={{
                    primary: {
                      sx: {
                        color: gradeSelected ? "#0071E3" : "#1D1D1F",
                        fontSize: "0.825rem",
                        fontWeight: gradeSelected ? 750 : 650,
                        letterSpacing: "-0.01em",
                      },
                    },
                  }}
                />
                <Box
                  sx={{
                    bgcolor: gradeSelected ? "rgba(0, 113, 227, 0.16)" : "rgba(0, 0, 0, 0.05)",
                    borderRadius: "9999px",
                    color: gradeSelected ? "#0071E3" : "#6E6E73",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    lineHeight: 1,
                    px: 0.9,
                    py: 0.35,
                  }}
                >
                  {gradeCount}
                </Box>
              </ListItemButton>

              {/* Collapsible Classroom Children */}
              {hasClasses ? (
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <List
                    dense
                    disablePadding
                    sx={{
                      borderLeft: "1.5px solid rgba(0, 0, 0, 0.06)",
                      ml: 2.25,
                      mt: 0.25,
                      pl: 0.75,
                    }}
                  >
                    {gradeClasses.map((classroom) => {
                      const isSelected = selectedClass === classroom.name;
                      const actualCount = school.students.filter(
                        (student) => student.className === classroom.name
                      ).length;

                      return (
                        <ListItemButton
                          key={classroom.id}
                          onClick={() => onSelectClass(classroom.name, grade)}
                          selected={isSelected}
                          sx={{
                            bgcolor: isSelected ? "rgba(0, 113, 227, 0.09) !important" : "transparent",
                            borderRadius: "8px",
                            mb: 0.25,
                            minHeight: 34,
                            px: 1,
                            transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                            "&:hover": {
                              bgcolor: isSelected
                                ? "rgba(0, 113, 227, 0.13) !important"
                                : "rgba(0, 0, 0, 0.03)",
                            },
                            "&:active": {
                              transform: "scale(0.985)",
                            },
                          }}
                        >
                          <ListItemText
                            primary={classroom.name}
                            secondary={classroom.homeroomTeacher || "Chưa phân công"}
                            slotProps={{
                              primary: {
                                sx: {
                                  color: isSelected ? "#0071E3" : "#1D1D1F",
                                  fontSize: "0.785rem",
                                  fontWeight: isSelected ? 750 : 600,
                                },
                              },
                              secondary: {
                                noWrap: true,
                                sx: {
                                  color: isSelected ? "rgba(0, 113, 227, 0.7)" : "#86868B",
                                  fontSize: "0.685rem",
                                  fontWeight: 500,
                                },
                              },
                            }}
                          />
                          <Box
                            sx={{
                              bgcolor: isSelected ? "#0071E3" : "rgba(0, 0, 0, 0.05)",
                              borderRadius: "9999px",
                              color: isSelected ? "#FFFFFF" : "#6E6E73",
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              lineHeight: 1,
                              px: 0.75,
                              py: 0.25,
                            }}
                          >
                            {actualCount}
                          </Box>
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              ) : null}
            </Box>
          );
        })}

        {!school.grades.length && school.classes.length ? (
          <Box sx={{ mt: 0.5 }}>
            {school.classes.map((classroom) => {
              const isSelected = selectedClass === classroom.name;
              return (
                <ListItemButton
                  key={classroom.id}
                  onClick={() => onSelectClass(classroom.name, classroom.grade)}
                  selected={isSelected}
                  sx={{
                    bgcolor: isSelected ? "rgba(0, 113, 227, 0.09) !important" : "transparent",
                    borderRadius: "8px",
                    mb: 0.25,
                    minHeight: 36,
                    px: 1,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 26 }}>
                    <SchoolRoundedIcon sx={{ color: isSelected ? "#0071E3" : "#86868B", fontSize: 16 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={classroom.name}
                    secondary={classroom.homeroomTeacher || "Chưa phân công"}
                    slotProps={{
                      primary: { sx: { fontSize: "0.8rem", fontWeight: isSelected ? 750 : 600 } },
                      secondary: { sx: { fontSize: "0.7rem", color: "#86868B" } },
                    }}
                  />
                </ListItemButton>
              );
            })}
          </Box>
        ) : null}
      </List>
    </Paper>
  );
}
