import type { ReactNode } from "react";
import Add from "@mui/icons-material/Add";
import Check from "@mui/icons-material/Check";
import FilterList from "@mui/icons-material/FilterList";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ErgSearchField, ErgSelect, ErgTextField } from "@/components/erg-mui";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

import type { ClassroomSnapshot, ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";
import { classificationOptions, getClassificationBg, getClassificationColor } from "./score-sheet-model";
import { ScoreSheetGrid } from "./score-sheet-grid";
import type { ScoreSheetController } from "./use-score-sheet-controller";

type DesktopScoreSheetPanelProps = {
  controller: ScoreSheetController;
  overlays: ReactNode;
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
  students: ClassroomStudent[];
};

const { statusTint } = ergEnterpriseTokens;

export function DesktopScoreSheetPanel({ controller, overlays, selectedClass, selectedSchoolName, students }: DesktopScoreSheetPanelProps) {
  const filterActive = controller.classificationFilter.length < classificationOptions.length;
  const hasEditableColumn = controller.editableColumns.length > 0;

  return (
    <Stack spacing={2} sx={{ height: "100%", minHeight: 0, p: 2 }}>
      <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 2, p: 2 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1.5 }}>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "fontWeightMedium" }}>
              Bảng điểm{selectedClass?.className ? ` · ${selectedClass.className}` : ""}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedSchoolName} · {students.length} học sinh · {controller.scoreColumns.length} cột điểm
            </Typography>
          </Box>

          {controller.notice ? <Chip color="primary" label={controller.notice} size="small" variant="outlined" /> : null}
          {controller.offlinePending ? <Chip label="Đang chờ đồng bộ" size="small" color="warning" /> : null}

          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
            <ErgSelect
              size="small"
              fullWidth={false}
              value={controller.selectedSubject}
              onChange={(event) => controller.setSelectedSubject(String(event.target.value))}
              options={controller.subjectOptions.map((subject) => ({ value: subject, label: subject }))}
              slotProps={{ select: { SelectDisplayProps: { "aria-label": "Chọn môn học" } } }}
              sx={{ minWidth: 160 }}
            />
            <ErgSearchField
              compact
              fullWidth={false}
              placeholder="Tìm học sinh"
              value={controller.searchQuery}
              onChange={(event) => controller.setSearchQuery(event.target.value)}
              sx={{ minWidth: 180 }}
            />
            <Button
              variant="outlined"
              color={filterActive ? "primary" : "inherit"}
              onClick={(event) => controller.setFilterAnchor(event.currentTarget)}
              startIcon={<FilterList />}
            >
              Lọc
            </Button>
            <Menu anchorEl={controller.filterAnchor} open={Boolean(controller.filterAnchor)} onClose={() => controller.setFilterAnchor(null)}>
              <MenuItem onClick={() => controller.setClassificationSort(controller.classificationSort === "asc" ? "desc" : controller.classificationSort === "desc" ? null : "asc")}>
                <FilterList fontSize="small" sx={{ mr: 1 }} />
                Sắp xếp: {controller.classificationSort === "asc" ? "A→Z" : controller.classificationSort === "desc" ? "Z→A" : "Mặc định"}
              </MenuItem>
              <Box sx={{ borderTop: 1, borderColor: "divider", px: 2, py: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: "fontWeightMedium", display: "block", mb: 1 }}>Xếp loại:</Typography>
                {classificationOptions.map((option) => {
                  const selected = controller.classificationFilter.includes(option);
                  return (
                    <MenuItem
                      key={option}
                      onClick={() => controller.setClassificationFilter(
                        selected ? controller.classificationFilter.filter((value) => value !== option) : [...controller.classificationFilter, option],
                      )}
                      dense
                    >
                      {selected ? <Check fontSize="small" sx={{ mr: 1 }} /> : <Box component="span" sx={{ width: 28 }} />}
                      <Chip
                        label={option}
                        size="small"
                        sx={selected ? { bgcolor: getClassificationBg(option), color: getClassificationColor(option) } : undefined}
                      />
                    </MenuItem>
                  );
                })}
              </Box>
            </Menu>

            <ErgTextField
              compact
              fullWidth={false}
              placeholder="Tên cột offline"
              value={controller.offlineColumnName}
              onChange={(event) => controller.setOfflineColumnName(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && controller.addOfflineColumn()}
              slotProps={{ select: { SelectDisplayProps: { "aria-label": "Tên cột offline" } } }}
              sx={{ width: 160 }}
            />
            <Button variant="contained" startIcon={<Add />} onClick={controller.addOfflineColumn}>
              Tạo cột
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", px: 1, rowGap: 1 }}>
        <Chip label="Điểm mới nhất" size="small" sx={{ bgcolor: statusTint.success.bg, color: statusTint.success.color }} />
        <Chip label="Di chuột xem lịch sử" size="small" sx={{ bgcolor: statusTint.warning.bg, color: statusTint.warning.color }} />
        <Chip label="- là chưa làm" size="small" sx={{ bgcolor: statusTint.neutral.bg, color: statusTint.neutral.color }} />
        <Typography variant="caption" color="text.secondary">
          {hasEditableColumn
            ? "Nhập điểm: Tab / Enter / mũi tên để di chuyển giữa các ô; dán cả cột hoặc khối ô từ Excel (Ctrl+V) vào cột offline, điểm 0–10."
            : "Bấm “Tạo cột” để thêm cột điểm offline, sau đó nhập hoặc dán điểm từ Excel."}
        </Typography>
      </Stack>

      <ScoreSheetGrid controller={controller} />
      {overlays}
    </Stack>
  );
}
