import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import { CreateTeachingRoomDialog } from "./create-teaching-room-dialog";
import type {
  ErgScheduleCatalog,
  ErgScheduleCreateResult,
  ErgScheduleDraft,
  ErgSchedulePreviewResult,
} from "./erg-calendar-types";
import { SchedulePreviewPanel } from "./teaching-schedule-dialog-preview";
import { TeachingScheduleRow } from "./teaching-schedule-dialog-row";
import {
  bulkScheduleLayoutSx,
  commonSettingsGridSx,
  excelGridHeaderSx,
  excelTableShellSx,
  primaryActionSx,
  scheduleSectionSx,
  scheduleSectionTitleSx,
  scheduleSelectSlotProps,
  scheduleSettingsBarSx,
  secondaryActionSx,
  teachingDialogContentSx,
  teachingDialogPaperSx,
  teachingDialogTitleSx,
  teachingDialogTitleTextSx,
} from "./teaching-schedule-dialog-styles";
import { useTeachingScheduleForm } from "./use-teaching-schedule-form";

export function TeachingScheduleDialog({
  catalog,
  onClose,
  onCreateRoom,
  onPreview,
  onPublishBatch,
  onSubmit,
  open,
}: {
  catalog: ErgScheduleCatalog;
  onClose: () => void;
  onCreateRoom?: (input: { roomName: string; schoolId: string }) => Promise<{ id: string; label: string; schoolId: string }> | { id: string; label: string; schoolId: string };
  onPreview?: (draft: ErgScheduleDraft) => Promise<ErgSchedulePreviewResult> | ErgSchedulePreviewResult;
  onPublishBatch?: (batchId: string) => Promise<void> | void;
  onSubmit?: (draft: ErgScheduleDraft) => Promise<ErgScheduleCreateResult> | ErgScheduleCreateResult;
  open: boolean;
}) {
  const {
    addRow,
    applyFrom,
    applyTo,
    assistantOptions,
    bulkNote,
    canSubmitPreviewResult,
    clearPreviewState,
    createdBatchId,
    duplicateWeekTemplate,
    expandedNoteRowId,
    isPreviewing,
    isSubmitting,
    levels,
    previewConflictCount,
    previewResult,
    previewRowLabels,
    publishCreatedBatch,
    removeRow,
    roomDialogOpen,
    rooms,
    scheduleRows,
    schoolClasses,
    selectedSchoolId,
    setBulkNote,
    setCreatedRooms,
    setExpandedNoteRowId,
    setRoomDialogOpen,
    subjects,
    submitButtonLabel,
    submitError,
    submitSchedule,
    totalPeriodCount,
    updateApplyFrom,
    updateApplyTo,
    updatePeriodCount,
    updateRow,
    updateSchool,
    updateStartTime,
  } = useTeachingScheduleForm({ catalog, onClose, onPreview, onPublishBatch, onSubmit, open });

  return (
    <>
    <Dialog fullWidth maxWidth="xl" onClose={onClose} open={open} slotProps={{ paper: { sx: teachingDialogPaperSx } }} sx={{ zIndex: 3200 }}>
      <DialogTitle sx={teachingDialogTitleSx}>
        <Typography sx={teachingDialogTitleTextSx}>Tạo lịch giảng dạy</Typography>
      </DialogTitle>
      <DialogContent sx={teachingDialogContentSx}>
        {createdBatchId ? (
          <Box sx={{ backgroundColor: "success.50", border: "1px solid", borderColor: "success.light", borderRadius: 2, mb: 2, p: 2 }}>
            <Typography sx={{ color: "success.dark", fontWeight: 900 }}>Đã tạo bản nháp lịch giảng dạy</Typography>
            <Typography sx={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12.5, mt: 0.5 }}>{createdBatchId}</Typography>
          </Box>
        ) : null}
        <Box sx={bulkScheduleLayoutSx}>
          <Box sx={scheduleSettingsBarSx}>
            <Box sx={commonSettingsGridSx}>
              <TextField
                fullWidth
                label="Trường"
                onChange={(event) => updateSchool(event.target.value)}
                select
                size="small"
                slotProps={{ ...scheduleSelectSlotProps, inputLabel: { shrink: true } }}
                value={selectedSchoolId}
              >
                {catalog.schools.map((school) => <MenuItem key={school.id} value={school.id}>{school.name}</MenuItem>)}
              </TextField>
              <TextField fullWidth label="Áp dụng từ" onChange={(event) => updateApplyFrom(event.target.value)} size="small" slotProps={{ inputLabel: { shrink: true } }} type="date" value={applyFrom} />
              <TextField
                fullWidth
                label="Áp dụng đến"
                onChange={(event) => updateApplyTo(event.target.value)}
                size="small"
                slotProps={{ input: { inputProps: { min: applyFrom } }, inputLabel: { shrink: true } }}
                type="date"
                value={applyTo}
              />
              <TextField
                fullWidth
                label="Ghi chú"
                onChange={(event) => { clearPreviewState(); setBulkNote(event.target.value); }}
                placeholder="VD: áp dụng học kỳ 2, ưu tiên phòng máy..."
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                value={bulkNote}
              />
            </Box>
          </Box>

          <Box sx={scheduleSectionSx}>
            <Box sx={{ alignItems: { xs: "stretch", md: "center" }, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 1.25, justifyContent: "space-between", mb: 1.25 }}>
              <Box>
                <Typography sx={scheduleSectionTitleSx}>Bảng lịch</Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                {onCreateRoom ? <Button onClick={() => setRoomDialogOpen(true)} startIcon={<AddRoundedIcon />} sx={secondaryActionSx} variant="outlined">Tạo phòng</Button> : null}
                <Button onClick={duplicateWeekTemplate} startIcon={<ContentCopyRoundedIcon />} sx={secondaryActionSx} variant="outlined">Nhân đôi dòng</Button>
                <Button onClick={addRow} startIcon={<AddRoundedIcon />} sx={primaryActionSx} variant="contained">Thêm dòng</Button>
              </Stack>
            </Box>
            <Box data-excel-schedule-table sx={excelTableShellSx}>
              <Box sx={excelGridHeaderSx}>
                {["Thứ", "Ca", "Số tiết", "Tiết", "Giờ", "Môn", "Level", "Lớp", "Phòng", "GV chính", "Trợ giảng", "Ghi chú", ""].map((label, index, labels) => (
                  <Typography
                    key={label}
                    sx={index === labels.length - 1 ? { justifyContent: "center" } : undefined}
                  >
                    {label}
                  </Typography>
                ))}
              </Box>
              <Stack spacing={0}>
              {scheduleRows.map((row) => (
                <TeachingScheduleRow
                  key={row.id}
                  assistantOptions={assistantOptions}
                  canRemove={scheduleRows.length > 1}
                  expanded={expandedNoteRowId === row.id}
                  levels={levels}
                  onExpandNote={setExpandedNoteRowId}
                  onRemove={removeRow}
                  onUpdate={updateRow}
                  onUpdatePeriodCount={updatePeriodCount}
                  onUpdateStartTime={updateStartTime}
                  rooms={rooms}
                  row={row}
                  schoolClasses={schoolClasses}
                  subjects={subjects}
                  teachers={catalog.teachers}
                />
              ))}
            </Stack>
            </Box>
          </Box>
          {previewResult ? (
            <SchedulePreviewPanel result={previewResult} rowLabels={previewRowLabels} />
          ) : null}

        </Box>
      </DialogContent>
      <DialogActions sx={{ borderTop: "1px solid #EEF2F7", px: 3, py: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ color: "#667085", fontSize: 12.5, fontWeight: 600 }}>
            {scheduleRows.length} dòng · {totalPeriodCount} tiết
          </Typography>
          {submitError ? <Typography sx={{ color: "#B42318", fontSize: 12.25, fontWeight: 600, mt: 0.35 }}>{submitError}</Typography> : null}
        </Box>
        {createdBatchId ? (
          <>
            <Button onClick={onClose} sx={secondaryActionSx} variant="outlined">Để ở bản nháp</Button>
            {onPublishBatch ? <Button disabled={isSubmitting} onClick={() => void publishCreatedBatch()} sx={primaryActionSx} variant="contained">Xuất bản ngay</Button> : null}
          </>
        ) : (
          <>
            <Button onClick={onClose} sx={secondaryActionSx} variant="outlined">Hủy</Button>
            <Button disabled={isSubmitting || isPreviewing || !canSubmitPreviewResult} onClick={() => submitSchedule(previewConflictCount > 0)} sx={primaryActionSx} variant="contained">{submitButtonLabel}</Button>
          </>
        )}
      </DialogActions>
    </Dialog>
    {onCreateRoom ? (
      <CreateTeachingRoomDialog
        onClose={() => setRoomDialogOpen(false)}
        onCreate={onCreateRoom}
        onCreated={(room) => setCreatedRooms((current) => current.some((item) => item.id === room.id) ? current : [...current, { id: room.id, name: room.label, schoolId: room.schoolId }])}
        open={roomDialogOpen}
        schoolId={selectedSchoolId}
      />
    ) : null}
    </>
  );
}
