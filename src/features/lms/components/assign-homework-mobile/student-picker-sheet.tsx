import RefreshIcon from "@mui/icons-material/Refresh";
import Box from "@mui/material/Box";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgSearchField } from "@/components/erg-mui/erg-form";
import type { ClassroomStudent } from "@/domain/school/classroom-types";
import { MobileStudentSelectionList } from "@/features/lms/components/assign-homework-parts";
import { MobileBottomSheet } from "@/features/lms/mobile/components/mobile-bottom-sheet";

/** Pick individual students of one class / class-in-grade / group, in a bottom sheet above the dock. */
export function StudentPickerSheet({
  allSelected,
  isLoading,
  onClose,
  onReset,
  onToggleAll,
  onToggleStudent,
  search,
  selectedIds,
  setSearch,
  students,
  title,
  total,
}: {
  allSelected: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onReset: () => void;
  onToggleAll: () => void;
  onToggleStudent: (studentId: string) => void;
  search: string;
  selectedIds: Set<string>;
  setSearch: (value: string) => void;
  students: ClassroomStudent[];
  title: string | null;
  total: number;
}) {
  return (
    <MobileBottomSheet
      description={`${selectedIds.size}/${total} học sinh đang chọn`}
      onOpenChange={(open) => { if (!open) onClose(); }}
      open={title !== null}
      title={title ?? ""}
    >
      <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
        <ErgSearchField onChange={(event) => setSearch(event.target.value)} placeholder="Tìm học sinh" sx={{ flex: 1, minWidth: 0 }} value={search} />
        <ErgButton onClick={onReset} startIcon={<RefreshIcon fontSize="small" />} sx={{ flexShrink: 0 }} variant="outlined">Đặt lại</ErgButton>
      </Box>
      <MobileStudentSelectionList
        allSelected={allSelected}
        isLoading={isLoading}
        onToggleAll={onToggleAll}
        onToggleStudent={onToggleStudent}
        selectedIds={selectedIds}
        students={students}
      />
    </MobileBottomSheet>
  );
}
