import CheckBoxRoundedIcon from "@mui/icons-material/CheckBoxRounded";
import CheckBoxOutlineBlankRoundedIcon from "@mui/icons-material/CheckBoxOutlineBlankRounded";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useCurriculumCatalogQuery } from "@/features/lcms/school-management/api/curriculum-catalog";
import type { PartnerSchool } from "@/features/lcms/school-management/types/school-management-types";

export function SchoolSubjectAssignDialog({
  initialClassId,
  onClose,
  onSave,
  school,
}: {
  initialClassId?: string;
  onClose: () => void;
  onSave: (payload: {
    selectedClassIds: string[];
    subjectCatalogId: string;
    levelCatalogId: string;
  }) => Promise<void>;
  school: PartnerSchool;
}) {
  const catalogQuery = useCurriculumCatalogQuery();
  const catalog = useMemo(() => catalogQuery.data ?? [], [catalogQuery.data]);
  const [subjectId, setSubjectId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(() =>
    initialClassId ? [initialClassId] : school.classes.map((cls) => cls.id)
  );
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedSubject = catalog.find((item) => item.id === subjectId) ?? catalog[0];
  const availableLevels = selectedSubject?.levels ?? [];
  const selectedLevel = availableLevels.find((item) => item.id === levelId) ?? availableLevels[0];

  const selectedStudentCount = useMemo(() => {
    const classIdSet = new Set(selectedClassIds);
    return school.classes.reduce((sum, cls) => sum + (classIdSet.has(cls.id) ? cls.studentCount || 0 : 0), 0);
  }, [school.classes, selectedClassIds]);

  function toggleClass(id: string) {
    setSelectedClassIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function selectAllClasses() {
    setSelectedClassIds(school.classes.map((cls) => cls.id));
  }

  function clearAllClasses() {
    setSelectedClassIds([]);
  }

  async function handleConfirm() {
    if (!selectedSubject) return;
    setSaving(true);
    setErrorMessage(null);
    try {
      await onSave({
        selectedClassIds,
        subjectCatalogId: selectedSubject.id,
        levelCatalogId: selectedLevel?.id ?? "",
      });
      toast.success("Đăng ký môn học thành công");
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu môn học. Vui lòng thử lại.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      onClose={saving ? undefined : onClose}
      open
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            maxHeight: "90vh",
            m: { xs: 1, sm: 2 },
          },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>
        Đăng ký môn học & phân bổ lớp
        <Typography color="text.secondary" variant="body2">
          Chọn môn học và cấp độ từ danh mục chuẩn, sau đó chọn danh sách lớp áp dụng.
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "16px !important" }}>
        {catalogQuery.isError ? (
          <Alert
            action={<Button color="inherit" onClick={() => void catalogQuery.refetch()} size="small" variant="text">Tải lại</Button>}
            severity="error"
            sx={{ borderRadius: 2 }}
          >
            Không tải được danh mục môn học và level. Chưa thể đăng ký môn cho đến khi tải lại thành công.
          </Alert>
        ) : null}
        {catalogQuery.isPending ? <Alert severity="info" sx={{ borderRadius: 2 }}>Đang tải danh mục môn học…</Alert> : null}
        {errorMessage ? (
          <Alert severity="error" onClose={() => setErrorMessage(null)} sx={{ borderRadius: 2 }}>
            {errorMessage}
          </Alert>
        ) : null}
        {/* Step 1: Chọn môn học từ danh mục */}
        <FormControl fullWidth size="small">
          <InputLabel id="catalog-subject-label">1. Môn học chuẩn *</InputLabel>
          <Select
            label="1. Môn học chuẩn *"
            labelId="catalog-subject-label"
            disabled={!catalog.length}
            onChange={(e) => setSubjectId(e.target.value)}
            value={selectedSubject?.id ?? ""}
          >
            {catalog.map((sub) => (
              <MenuItem key={sub.id} value={sub.id}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <Typography sx={{ fontWeight: 600 }}>{sub.name}</Typography>
                  <Chip label={sub.category || sub.code} size="small" variant="outlined" sx={{ ml: 1, fontSize: 11 }} />
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Step 2: Chọn Level từ danh sách môn học */}
        <FormControl fullWidth size="small">
          <InputLabel id="catalog-level-label">2. Cấp độ / Level *</InputLabel>
          <Select
            disabled={availableLevels.length === 0}
            label="2. Cấp độ / Level *"
            labelId="catalog-level-label"
            onChange={(e) => setLevelId(e.target.value)}
            value={selectedLevel?.id ?? ""}
          >
            {availableLevels.map((lvl) => (
              <MenuItem key={lvl.id} value={lvl.id}>
                <Box sx={{ display: "flex", flexDirection: "column", py: 0.5 }}>
                  <Typography sx={{ fontWeight: 600 }}>{lvl.name}</Typography>
                  {lvl.description ? (
                    <Typography color="text.secondary" variant="caption">
                      {lvl.description}
                    </Typography>
                  ) : null}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Step 3: Phân bổ cho các lớp học */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography sx={{ fontWeight: 600 }} variant="subtitle2">
              3. Chọn lớp học áp dụng ({selectedClassIds.length}/{school.classes.length} lớp · {selectedStudentCount} HS)
            </Typography>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Button variant="contained" onClick={selectAllClasses} size="small" sx={{ fontSize: 12 }}>
                Chọn tất cả
              </Button>
              <Button variant="contained" color="secondary" onClick={clearAllClasses} size="small" sx={{ fontSize: 12 }}>
                Bỏ chọn
              </Button>
            </Box>
          </Box>

          <Box
            sx={{
              display: "grid",
              gap: 1,
              gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
              p: 1.5,
              borderRadius: 2,
              bgcolor: "action.hover",
              border: "1px solid",
              borderColor: "divider",
              maxHeight: 180,
              overflowY: "auto",
            }}
          >
            {school.classes.map((cls) => {
              const checked = selectedClassIds.includes(cls.id);
              return (
                <Button
                  color={checked ? "primary" : "inherit"}
                  key={cls.id}
                  onClick={() => toggleClass(cls.id)}
                  size="small"
                  startIcon={
                    checked ? (
                      <CheckBoxRoundedIcon color="primary" fontSize="small" />
                    ) : (
                      <CheckBoxOutlineBlankRoundedIcon color="disabled" fontSize="small" />
                    )
                  }
                  sx={{
                    justifyContent: "flex-start",
                    textTransform: "none",
                    bgcolor: checked ? "action.selected" : "background.paper",
                    border: "1px solid",
                    borderColor: checked ? "primary.main" : "divider",
                    px: 1,
                    py: 0.75,
                  }}
                  variant="text"
                >
                  <Box sx={{ textAlign: "left", lineHeight: 1.2 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{cls.name}</Typography>
                    <Typography color="text.secondary" sx={{ fontSize: 11 }}>
                      {cls.studentCount || 0} HS
                    </Typography>
                  </Box>
                </Button>
              );
            })}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, borderTop: "1px solid", borderColor: "divider" }}>
        <Button variant="contained" disabled={saving} onClick={onClose}>
          Hủy
        </Button>
        <Button
          disabled={!selectedSubject || saving}
          onClick={() => void handleConfirm()}
          startIcon={saving ? <CircularProgress color="inherit" size={16} /> : null}
          variant="contained"
        >
          {saving ? "Đang lưu..." : "Xác nhận môn học & lớp"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
