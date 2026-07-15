import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Step from "@mui/material/Step";
import StepButton from "@mui/material/StepButton";
import Stepper from "@mui/material/Stepper";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { SchoolPageShell } from "@/features/lcms/school-management/components/school-page-shell";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import { SchoolCurriculumStep } from "@/features/lcms/school-management/components/setup/school-curriculum-step";
import { SchoolFlowStepIcon } from "@/features/lcms/school-management/components/setup/school-flow-step-icon";
import { SchoolInformationStep } from "@/features/lcms/school-management/components/setup/school-information-step";
import { SchoolReviewStep } from "@/features/lcms/school-management/components/setup/school-review-step";
import { SchoolStructureStep } from "@/features/lcms/school-management/components/setup/school-structure-step";
import { SchoolStudentsStep } from "@/features/lcms/school-management/components/setup/school-students-step";
import { schoolTypeMeta, schoolTypeUsesGrades } from "@/features/lcms/school-management/types/school-type-config";
import { useLocation, useNavigate } from "@/routes/router-compat";

const baseStepMeta = [
  { label: "Thông tin & loại hình", helper: "Định danh đơn vị" },
  { label: "Cơ cấu đào tạo", helper: "Khối và lớp trong một bước" },
  { label: "Danh sách người học", helper: "Nhập dữ liệu hàng loạt" },
  { label: "Môn học & ghi danh", helper: "Chương trình đào tạo" },
  { label: "Rà soát & hoàn tất", helper: "Kiểm tra sẵn sàng" },
];

export default function SchoolDetailFlowScreen() {
  const { selectedSchool, unsupportedApiMessage } = useSchoolManagementContext();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("md"));
  const parsedStep = Number(new URLSearchParams(location.search).get("step") ?? 0);
  const activeStep = Number.isInteger(parsedStep) && parsedStep >= 0 && parsedStep < baseStepMeta.length ? parsedStep : 0;
  if (!selectedSchool) return null;

  const usesGrades = schoolTypeUsesGrades(selectedSchool.schoolType);
  const labels = schoolTypeMeta[selectedSchool.schoolType];
  const stepMeta = baseStepMeta.map((step, index) => index === 2 ? { ...step, label: `Danh sách ${labels.learnerLabel.toLowerCase()}` } : index === 3 ? { ...step, label: `${labels.subjectLabel} & ghi danh` } : step);
  const structureReady = selectedSchool.classes.length > 0 && (!usesGrades || selectedSchool.classes.every((classroom) => selectedSchool.grades.includes(classroom.grade)));
  const completion = [Boolean(selectedSchool.name && selectedSchool.id), structureReady, selectedSchool.students.length > 0, selectedSchool.subjects.length > 0, structureReady && selectedSchool.students.length > 0 && selectedSchool.subjects.length > 0];
  const completedCount = completion.slice(0, 4).filter(Boolean).length;
  const content = [<SchoolInformationStep key="information" />, <SchoolStructureStep key="structure" />, <SchoolStudentsStep key="students" />, <SchoolCurriculumStep key="curriculum" />, <SchoolReviewStep key="review" />][activeStep];

  function goStep(step: number) {
    const search = new URLSearchParams(location.search);
    search.set("schoolId", selectedSchool!.id);
    search.set("step", String(step));
    navigate(`/schools/detail?${search.toString()}`);
  }

  return <SchoolPageShell
    action={<Button onClick={() => navigate("/schools/list")} startIcon={<ArrowBackRoundedIcon />} variant="outlined">Danh sách trường</Button>}
    description="Chỉnh sửa theo một flow liên tục; cấu trúc tự thích ứng với loại hình trường."
    title={selectedSchool.name}
  >
    <Paper variant="outlined" sx={{ alignItems: { xs: "flex-start", md: "center" }, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2, justifyContent: "space-between", mb: 2, p: 2 }}>
      <Box><Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1 }}><Typography sx={{ fontSize: 18, fontWeight: 900 }}>Thiết lập trường</Typography><Chip color="primary" label={schoolTypeMeta[selectedSchool.schoolType].label} size="small" variant="outlined" /></Box><Typography color="text.secondary" variant="body2">Dữ liệu được giữ xuyên suốt giữa các bước. Bạn có thể quay lại chỉnh sửa bất cứ lúc nào.</Typography></Box>
      <Box sx={{ minWidth: { xs: "100%", md: 250 } }}><Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}><Typography color="text.secondary" variant="caption">Tiến độ thiết lập</Typography><Typography sx={{ fontWeight: 850 }} variant="caption">{completedCount}/4 hạng mục</Typography></Box><LinearProgress color={completedCount === 4 ? "success" : "primary"} value={completedCount * 25} variant="determinate" /></Box>
    </Paper>

    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "244px minmax(0, 1fr)" } }}>
      <Paper variant="outlined" sx={{ alignSelf: "start", p: { xs: 0.75, md: 1 }, position: { md: "sticky" }, top: { md: 142 } }}>
        <Stepper
          activeStep={activeStep}
          nonLinear
          orientation={compact ? "horizontal" : "vertical"}
          sx={{
            overflowX: { xs: "auto", md: "visible" },
            "& .MuiStep-root": { minWidth: { xs: 174, md: 0 }, p: 0 },
            "& .MuiStepConnector-root.MuiStepConnector-vertical": { ml: "11px" },
            "& .MuiStepConnector-lineVertical": { minHeight: 8 },
            "& .MuiStepLabel-iconContainer": { pr: 1 },
            "& .MuiStepLabel-labelContainer": { minWidth: 0 },
          }}
        >
          {stepMeta.map((step, index) => {
            const selected = index === activeStep;

            return (
              <Step completed={completion[index]} key={step.label}>
                <StepButton
                  aria-current={selected ? "step" : undefined}
                  icon={<SchoolFlowStepIcon active={selected} completed={completion[index]} stepNumber={index + 1} />}
                  onClick={() => goStep(index)}
                  sx={{
                    bgcolor: selected ? "primary.50" : "transparent",
                    border: "1px solid",
                    borderColor: selected ? "primary.200" : "transparent",
                    borderRadius: 1.5,
                    justifyContent: "flex-start",
                    minHeight: 42,
                    px: 1,
                    py: 0.625,
                    "&:hover": { bgcolor: selected ? "primary.100" : "action.hover" },
                  }}
                >
                  <Box sx={{ alignItems: "center", display: "flex", gap: 0.75, justifyContent: "space-between", minWidth: 0, width: "100%" }}>
                    <Typography
                      noWrap
                      sx={{ color: selected ? "primary.main" : "text.primary", fontSize: 13, fontWeight: selected ? 850 : 700 }}
                    >
                      {step.label}
                    </Typography>
                    {selected ? (
                      <Chip
                        color="primary"
                        label="Đang chọn"
                        size="small"
                        sx={{ flexShrink: 0, fontSize: 10, fontWeight: 800, height: 20, "& .MuiChip-label": { px: 0.75 } }}
                      />
                    ) : null}
                  </Box>
                </StepButton>
              </Step>
            );
          })}
        </Stepper>
      </Paper>

      <Box sx={{ minWidth: 0 }}>
        {activeStep >= 1 && activeStep <= 3 ? <Alert severity="info" sx={{ mb: 2 }}>{unsupportedApiMessage} Các control trong bước này chỉ là bản duyệt UI và chưa ghi dữ liệu.</Alert> : null}
        {content}
        <Box sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between", mt: 2 }}>
          <Button disabled={activeStep === 0} onClick={() => goStep(activeStep - 1)} startIcon={<ArrowBackRoundedIcon />}>Quay lại</Button>
          {activeStep < stepMeta.length - 1 ? <Button onClick={() => goStep(activeStep + 1)} endIcon={<ArrowForwardRoundedIcon />} variant="contained">Tiếp theo: {stepMeta[activeStep + 1].label}</Button> : <Button color="success" disabled={!completion[4]} onClick={() => navigate("/schools/list")} startIcon={<CheckCircleRoundedIcon />} variant="contained">Hoàn tất thiết lập</Button>}
        </Box>
      </Box>
    </Box>
  </SchoolPageShell>;
}
