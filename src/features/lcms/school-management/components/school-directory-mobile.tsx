import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgErrorState } from "@/components/erg-mui/erg-feedback";
import { ErgSearchField } from "@/components/erg-mui/erg-form";
import { ergChipTabsSx } from "@/components/erg-mui/erg-tabs";
import { useAdminShellModel } from "@/features/lcms/admin-shell-context";
import { SchoolDirectoryMobileCard } from "@/features/lcms/school-management/components/school-directory-mobile-card";
import type { PartnerSchool } from "@/features/lcms/school-management/types/school-management-types";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { ContentPendingSkeleton } from "@/routes/route-feedback";

// Canvas chips = the "Quản lý trường học" menu entries that already have a screen.
const SECTIONS = [
  { label: "Danh sách trường", path: adminPath("/schools/list") },
  { label: "Người học", path: adminPath("/schools/students") },
  { label: "Giám sát", path: adminPath("/schools/reports") },
  { label: "Nhập dữ liệu", path: adminPath("/schools/imports") },
];

type Props = {
  error: unknown;
  isLoading: boolean;
  onAdd: () => void;
  onOpen: (id: string) => void;
  onRetry: () => void;
  onSearchChange: (value: string) => void;
  /** Already filtered by the search box. */
  schools: PartnerSchool[];
  search: string;
  totalCount: number;
};

/** Phone "Trường học" (canvas N6) on SchoolDirectoryScreen's state: section chips, search, count + "Thêm trường", school cards. */
export function SchoolDirectoryMobile({ error, isLoading, onAdd, onOpen, onRetry, onSearchChange, schools, search, totalCount }: Props) {
  const navigate = useNavigate();
  const { canAccess } = useAdminShellModel();
  const sections = SECTIONS.filter((section) => canAccess(section.path));
  const sorted = [...schools].sort((a, b) => a.name.localeCompare(b.name, "vi"));

  const failed = Boolean(error) && !totalCount;
  let body;
  if (isLoading) {
    body = <ContentPendingSkeleton />;
  } else if (failed) {
    body = (
      <ErgErrorState
        action={<ErgButton onClick={onRetry} variant="outlined">Thử lại</ErgButton>}
        description="Vui lòng kiểm tra kết nối, phiên đăng nhập hoặc quyền truy cập rồi thử lại."
        title="Không tải được danh sách trường"
      />
    );
  } else if (!sorted.length) {
    body = totalCount
      ? <ErgEmptyState description="Thử từ khóa khác hoặc xóa ô tìm kiếm." title="Không có trường phù hợp" />
      : <ErgEmptyState description="Bấm “Thêm trường” để tạo trường liên kết đầu tiên." title="Chưa có trường nào" />;
  } else {
    body = (
      <Box aria-label="Danh sách trường" component="ul" sx={{ display: "flex", flexDirection: "column", gap: 1.5, listStyle: "none", m: 0, p: 0 }}>
        {sorted.map((school) => <SchoolDirectoryMobileCard key={school.id} onOpen={onOpen} school={school} />)}
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "background.default", color: "text.primary", minHeight: "100%", minWidth: 0, overflowX: "hidden" }}>
      <Box sx={{ pb: 1, pt: 2, px: 2 }}>
        <Typography component="h1" noWrap variant="h4">Trường học</Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pb: 2, px: 2 }}>
        {sections.length > 1 ? (
          <Tabs
            aria-label="Mục trường học"
            onChange={(_, path: string) => void navigate({ href: path })}
            scrollButtons={false}
            sx={ergChipTabsSx}
            value={SECTIONS[0].path}
            variant="scrollable"
          >
            {sections.map((section) => <Tab key={section.path} label={section.label} value={section.path} />)}
          </Tabs>
        ) : null}
        <ErgSearchField
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tìm trường, mã trường"
          slotProps={{ htmlInput: { "aria-label": "Tìm trường" } }}
          value={search}
        />
        <Box sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between" }}>
          <Typography color="text.secondary" variant="caption">{isLoading || failed ? "" : `${sorted.length} trường · sắp theo tên`}</Typography>
          <ErgButton onClick={onAdd} size="small" startIcon={<AddRoundedIcon />} variant="contained">Thêm trường</ErgButton>
        </Box>
        {body}
      </Box>
    </Box>
  );
}
