import AddCommentRoundedIcon from "@mui/icons-material/AddCommentRounded";
import Button from "@mui/material/Button";
import { SchoolPageShell } from "@/features/lcms/school-management/components/school-page-shell";
import { SchoolReviewsPanel } from "@/features/lcms/school-management/components/school-reviews-panel";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";

export default function SchoolReviewsScreen() {
  const { selectedSchool } = useSchoolManagementContext();
  if (!selectedSchool) return null;
  return <SchoolPageShell title="Đánh giá trường" description="Theo dõi chất lượng triển khai, phản hồi và các nội dung cần follow-up." action={<Button startIcon={<AddCommentRoundedIcon />} variant="contained">Ghi nhận đánh giá</Button>}><SchoolReviewsPanel school={selectedSchool} /></SchoolPageShell>;
}
