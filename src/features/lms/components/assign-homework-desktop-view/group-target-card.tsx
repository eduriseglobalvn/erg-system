import RefreshIcon from "@mui/icons-material/Refresh";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgSearchField, ErgSelect } from "@/components/erg-mui/erg-form";
import { ErgTable } from "@/components/erg-mui/erg-table";
import { allGroupSourcesFilterValue } from "@/features/lms/components/assign-homework-groups";
import {
  AssignmentCheckbox,
  MobileAssignmentGroupList,
  StudentSelectionTable,
} from "@/features/lms/components/assign-homework-parts";
import {
  TargetCardHeader,
  TargetCardShell,
  TargetPreviewPanel,
} from "@/features/lms/components/assign-homework-desktop-view/target-card-layout";
import type { AssignHomeworkController } from "@/features/lms/components/use-assign-homework-controller";

export function GroupTargetCard({ model }: { model: AssignHomeworkController }) {
  const {
    selectedGroupSource,
    setSelectedGroupSource,
    selectedAssignmentGroupIds,
    setPreviewAssignmentGroupId,
    groupStudentSearch,
    setGroupStudentSearch,
    selectedGroupStudentIdsByGroup,
    groupSourceOptions,
    filteredAssignmentGroups,
    previewAssignmentGroup,
    previewAssignmentGroupStudents,
    selectedGroupPopupStudentIds,
    filteredPreviewAssignmentGroupStudents,
    allAssignmentGroupsSelected,
    filteredSelectedAssignmentGroupCount,
    allGroupPopupStudentsSelected,
    toggleAssignmentGroup,
    toggleAllAssignmentGroups,
    openAssignmentGroupPreview,
    toggleGroupPreviewStudent,
    toggleAllGroupPreviewStudents,
    resetGroupPreviewStudents,
  } = model;
  return (
    <TargetCardShell>
      <TargetCardHeader
        select={
          <ErgSelect
            label="Lọc nhóm giao bài"
            size="small"
            value={selectedGroupSource}
            onChange={(event) => setSelectedGroupSource(event.target.value)}
            options={[
              { label: "Tất cả nhóm", value: allGroupSourcesFilterValue },
              ...groupSourceOptions.map((source) => ({ label: source, value: source })),
            ]}
            sx={{ minWidth: 260, width: "auto" }}
          />
        }
        selectedLabel={`${filteredSelectedAssignmentGroupCount}/${filteredAssignmentGroups.length} nhóm`}
        aside={
          <Typography variant="body2" sx={{ maxWidth: 448, color: "text.secondary", fontWeight: "fontWeightMedium" }}>
            Chọn các nhóm cần giao bài. Click vào tên nhóm để xem và tinh chỉnh danh sách học sinh trong nhóm đó.
          </Typography>
        }
      />

      <Box sx={{ position: "relative", minHeight: 0, flex: 1, overflowY: "auto" }}>
        <MobileAssignmentGroupList
          groups={filteredAssignmentGroups}
          onOpenPreview={openAssignmentGroupPreview}
          onToggleGroup={toggleAssignmentGroup}
          selectedGroupIds={selectedAssignmentGroupIds}
          selectedStudentIdsByGroup={selectedGroupStudentIdsByGroup}
        />
        <ErgTable sx={{ display: { xs: "none", md: "table" }, width: "100%" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ px: 2.5, width: 48 }}>
                <AssignmentCheckbox checked={allAssignmentGroupsSelected} onChange={toggleAllAssignmentGroups} label="Chọn tất cả nhóm học sinh" />
              </TableCell>
              <TableCell align="center" sx={{ width: 56 }}>STT</TableCell>
              <TableCell>Nhóm học sinh</TableCell>
              <TableCell sx={{ width: 192 }}>Phân loại</TableCell>
              <TableCell sx={{ width: 128 }}>Sỉ số</TableCell>
              <TableCell sx={{ width: 128 }}>Đã chọn</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAssignmentGroups.map((group, index) => {
              const isChecked = selectedAssignmentGroupIds.has(group.id);
              const selectedStudentCount = selectedGroupStudentIdsByGroup[group.id]?.length ?? group.studentIds.length;
              const mutedText = isChecked ? { color: "common.white", opacity: 0.8 } : { color: "text.secondary" };
              return (
                <TableRow
                  key={group.id}
                  onClick={() => toggleAssignmentGroup(group.id)}
                  sx={{
                    cursor: "pointer",
                    userSelect: "none",
                    // group.color is per-group data, not a theme token.
                    bgcolor: isChecked ? group.color : "background.paper",
                    borderLeft: `4px solid ${group.color}`,
                    "& td": isChecked ? { color: "common.white" } : undefined,
                  }}
                >
                  <TableCell align="center" sx={{ px: 2.5 }}>
                    <AssignmentCheckbox checked={isChecked} onChange={() => toggleAssignmentGroup(group.id)} label={`Chọn nhóm ${group.name}`} />
                  </TableCell>
                  <TableCell align="center" sx={{ ...mutedText, fontWeight: "fontWeightMedium" }}>{index + 1}</TableCell>
                  <TableCell>
                    <ButtonBase
                      onClick={(e) => {
                        e.stopPropagation();
                        openAssignmentGroupPreview(group.id);
                      }}
                      sx={{ display: "inline-flex", alignItems: "center", gap: 1, typography: "body2", fontWeight: "fontWeightMedium", color: isChecked ? "common.white" : "primary.main", "&:hover": { textDecoration: "underline" } }}
                    >
                      {group.name}
                    </ButtonBase>
                  </TableCell>
                  <TableCell sx={{ ...mutedText, fontWeight: "fontWeightMedium" }}>{group.source}</TableCell>
                  <TableCell sx={{ fontWeight: "fontWeightMedium" }}>{group.studentIds.length} học sinh</TableCell>
                  <TableCell>
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{
                        display: "inline-flex",
                        borderRadius: 1,
                        px: 1.25,
                        py: 0.5,
                        fontWeight: "fontWeightBold",
                        ...(isChecked
                          ? { border: 1, borderColor: "common.white", color: "common.white" }
                          : { bgcolor: "info.light", color: "primary.main" }),
                      }}
                    >
                      {selectedStudentCount}/{group.studentIds.length} HS
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </ErgTable>

        {previewAssignmentGroup ? (
          <TargetPreviewPanel
            title={previewAssignmentGroup.name}
            meta={`${selectedGroupPopupStudentIds.size}/${previewAssignmentGroupStudents.length} học sinh đang chọn`}
            actions={
              <>
                <ErgButton variant="outlined" size="small" onClick={toggleAllGroupPreviewStudents}>
                  {allGroupPopupStudentsSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                </ErgButton>
                <ErgButton variant="outlined" size="small" startIcon={<RefreshIcon fontSize="small" />} onClick={resetGroupPreviewStudents}>
                  Đặt lại
                </ErgButton>
                <ErgButton variant="outlined" size="small" onClick={() => setPreviewAssignmentGroupId(null)}>
                  Đóng
                </ErgButton>
              </>
            }
            search={
              <ErgSearchField
                placeholder="Tìm học sinh trong nhóm..."
                value={groupStudentSearch}
                onChange={(event) => setGroupStudentSearch(event.target.value)}
              />
            }
          >
            <StudentSelectionTable
              allSelected={allGroupPopupStudentsSelected}
              sx={{ borderTop: 1, borderColor: "divider" }}
              onToggleAll={toggleAllGroupPreviewStudents}
              onToggleStudent={toggleGroupPreviewStudent}
              selectedIds={selectedGroupPopupStudentIds}
              students={filteredPreviewAssignmentGroupStudents}
            />
          </TargetPreviewPanel>
        ) : null}
      </Box>
    </TargetCardShell>
  );
}
