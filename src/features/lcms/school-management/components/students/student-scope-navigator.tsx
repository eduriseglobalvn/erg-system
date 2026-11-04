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
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { alpha } from "@mui/material/styles";

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
        border: `1px solid ${ergEnterpriseTokens.color.border}`,
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
          borderBottom: `1px solid ${ergEnterpriseTokens.color.border}`,
          display: "flex",
          gap: 1.25,
          px: 2,
          py: 1.5,
        }}
      >
        <Box
          sx={{
            alignItems: "center",
            bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.08),
            borderRadius: "9px",
            color: ergEnterpriseTokens.color.primary,
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
              color: ergEnterpriseTokens.color.text,
              fontSize: "0.85rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
            }}
          >
            Cơ cấu người học
          </Typography>
          <Typography
            sx={{
              color: ergEnterpriseTokens.color.textMuted,
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
            bgcolor: isAllSelected ? `${alpha(ergEnterpriseTokens.color.primary, 0.09)} !important` : "transparent",
            borderRadius: "10px",
            color: isAllSelected ? ergEnterpriseTokens.color.primary : ergEnterpriseTokens.color.text,
            mb: 0.5,
            minHeight: 38,
            px: 1.25,
            transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
            "&:hover": {
              bgcolor: isAllSelected ? `${alpha(ergEnterpriseTokens.color.primary, 0.13)} !important` : "rgba(0, 0, 0, 0.035)",
            },
            "&:active": {
              transform: "scale(0.985)",
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 30 }}>
            <GroupsRoundedIcon sx={{ color: isAllSelected ? ergEnterpriseTokens.color.primary : ergEnterpriseTokens.color.textMuted, fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText
            primary="Toàn trường"
            slotProps={{
              primary: {
                sx: {
                  color: isAllSelected ? ergEnterpriseTokens.color.primary : ergEnterpriseTokens.color.text,
                  fontSize: "0.825rem",
                  fontWeight: isAllSelected ? 750 : 600,
                  letterSpacing: "-0.01em",
                },
              },
            }}
          />
          <Box
            sx={{
              bgcolor: isAllSelected ? alpha(ergEnterpriseTokens.color.primary, 0.16) : "rgba(0, 0, 0, 0.05)",
              borderRadius: "9999px",
              color: isAllSelected ? ergEnterpriseTokens.color.primary : ergEnterpriseTokens.color.textMuted,
              fontSize: "0.7rem",
              fontWeight: 600,
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
                  bgcolor: gradeSelected ? `${alpha(ergEnterpriseTokens.color.primary, 0.09)} !important` : "transparent",
                  borderRadius: "10px",
                  color: gradeSelected ? ergEnterpriseTokens.color.primary : ergEnterpriseTokens.color.text,
                  minHeight: 36,
                  px: 1.25,
                  transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                  "&:hover": {
                    bgcolor: gradeSelected ? `${alpha(ergEnterpriseTokens.color.primary, 0.13)} !important` : "rgba(0, 0, 0, 0.035)",
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
                      color: gradeSelected ? ergEnterpriseTokens.color.primary : ergEnterpriseTokens.color.textMuted,
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
                        color: gradeSelected ? ergEnterpriseTokens.color.primary : ergEnterpriseTokens.color.text,
                        fontSize: "0.825rem",
                        fontWeight: gradeSelected ? 750 : 650,
                        letterSpacing: "-0.01em",
                      },
                    },
                  }}
                />
                <Box
                  sx={{
                    bgcolor: gradeSelected ? alpha(ergEnterpriseTokens.color.primary, 0.16) : "rgba(0, 0, 0, 0.05)",
                    borderRadius: "9999px",
                    color: gradeSelected ? ergEnterpriseTokens.color.primary : ergEnterpriseTokens.color.textMuted,
                    fontSize: "0.7rem",
                    fontWeight: 600,
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
                      borderLeft: `1.5px solid ${ergEnterpriseTokens.color.border}`,
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
                            bgcolor: isSelected ? `${alpha(ergEnterpriseTokens.color.primary, 0.09)} !important` : "transparent",
                            borderRadius: "8px",
                            mb: 0.25,
                            minHeight: 34,
                            px: 1,
                            transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                            "&:hover": {
                              bgcolor: isSelected
                                ? `${alpha(ergEnterpriseTokens.color.primary, 0.13)} !important`
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
                                  color: isSelected ? ergEnterpriseTokens.color.primary : ergEnterpriseTokens.color.text,
                                  fontSize: "0.785rem",
                                  fontWeight: isSelected ? 750 : 600,
                                },
                              },
                              secondary: {
                                noWrap: true,
                                sx: {
                                  color: isSelected ? alpha(ergEnterpriseTokens.color.primary, 0.7) : ergEnterpriseTokens.color.textMuted,
                                  fontSize: "0.685rem",
                                  fontWeight: 500,
                                },
                              },
                            }}
                          />
                          <Box
                            sx={{
                              bgcolor: isSelected ? ergEnterpriseTokens.color.primary : "rgba(0, 0, 0, 0.05)",
                              borderRadius: "9999px",
                              color: isSelected ? "#FFFFFF" : ergEnterpriseTokens.color.textMuted,
                              fontSize: "0.68rem",
                              fontWeight: 600,
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
                    bgcolor: isSelected ? `${alpha(ergEnterpriseTokens.color.primary, 0.09)} !important` : "transparent",
                    borderRadius: "8px",
                    mb: 0.25,
                    minHeight: 36,
                    px: 1,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 26 }}>
                    <SchoolRoundedIcon sx={{ color: isSelected ? ergEnterpriseTokens.color.primary : ergEnterpriseTokens.color.textMuted, fontSize: 16 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={classroom.name}
                    secondary={classroom.homeroomTeacher || "Chưa phân công"}
                    slotProps={{
                      primary: { sx: { fontSize: "0.8rem", fontWeight: isSelected ? 750 : 600 } },
                      secondary: { sx: { fontSize: "0.7rem", color: ergEnterpriseTokens.color.textMuted } },
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
