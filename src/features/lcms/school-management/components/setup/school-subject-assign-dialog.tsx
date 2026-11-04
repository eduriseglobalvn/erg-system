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
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  DEFAULT_CURRICULUM_CATALOG,
  fetchCurriculumCatalog,
  type CurriculumSubjectCatalogItem,
} from "@/features/lcms/school-management/api/curriculum-catalog";
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
    name: string;
    code: string;
    selectedClassIds: string[];
    subjectCatalogId: string;
    levelCatalogId: string;
  }) => Promise<void>;
  school: PartnerSchool;
}) {
  const [catalog, setCatalog] = useState<CurriculumSubjectCatalogItem[]>(DEFAULT_CURRICULUM_CATALOG);
  const [subjectId, setSubjectId] = useState<string>(DEFAULT_CURRICULUM_CATALOG[0]?.id ?? "");
  const [levelId, setLevelId] = useState<string>("");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(() =>
    initialClassId ? [initialClassId] : school.classes.map((cls) => cls.id)
  );
  const [customName, setCustomName] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchCurriculumCatalog().then((items) => {
      if (active && items.length > 0) {
        setCatalog(items);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const selectedSubject = useMemo(
    () => catalog.find((item) => item.id === subjectId || item.code === subjectId),
    [catalog, subjectId]
  );

  const availableLevels = useMemo(() => selectedSubject?.levels ?? [], [selectedSubject]);

  useEffect(() => {
    if (availableLevels.length > 0) {
      if (!levelId || !availableLevels.some((l) => l.id === levelId || l.code === levelId)) {
        setLevelId(availableLevels[0]?.id || "");
      }
    } else {
      setLevelId("");
    }
  }, [availableLevels, levelId]);

  const selectedLevel = useMemo(
    () => availableLevels.find((item) => item.id === levelId || item.code === levelId),
    [availableLevels, levelId]
  );

  // Auto-generate name and code when subject or level changes
  useEffect(() => {
    if (selectedSubject) {
      const levelName = selectedLevel ? selectedLevel.name : "";
      const generatedName = levelName
        ? selectedSubject.name.toLowerCase().includes(levelName.toLowerCase())
          ? levelName
          : `${selectedSubject.name} - ${levelName}`
        : selectedSubject.name;

      const codeSuffix = selectedLevel?.code || selectedSubject.code;
      const schoolPrefix = school.code ? school.code.toLowerCase().replace(/[^a-z0-9]/g, "") : "sch";
      let generatedCode = `${codeSuffix}-${schoolPrefix}`;
      if (school.subjects.some((s) => s.code.toLowerCase() === generatedCode.toLowerCase())) {
        generatedCode = `${generatedCode}-${Date.now().toString(36).slice(-4)}`;
      }

      setCustomName(generatedName);
      setCustomCode(generatedCode);
    }
  }, [selectedSubject, selectedLevel, school.code, school.subjects]);

  const selectedStudentCount = useMemo(() => {
    const classIdSet = new Set(selectedClassIds);
    return school.students.filter((st) => st.academicClassId && classIdSet.has(st.academicClassId)).length;
  }, [school.students, selectedClassIds]);

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
    if (!customName.trim() || !customCode.trim()) return;
    setSaving(true);
    setErrorMessage(null);
    try {
      await onSave({
        name: customName.trim(),
        code: customCode.trim(),
        selectedClassIds,
        subjectCatalogId: selectedSubject?.id || "",
        levelCatalogId: selectedLevel?.id || "",
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
      <DialogTitle sx={{ pb: 1, fontWeight: 800 }}>
        Đăng ký môn học & phân bổ lớp
        <Typography color="text.secondary" variant="body2">
          Chọn môn học và cấp độ từ danh mục chuẩn, sau đó chọn danh sách lớp áp dụng.
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "16px !important" }}>
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
            onChange={(e) => setSubjectId(e.target.value)}
            value={subjectId}
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
            value={levelId}
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
            <Typography sx={{ fontWeight: 700 }} variant="subtitle2">
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
                    <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{cls.name}</Typography>
                    <Typography color="text.secondary" sx={{ fontSize: 11 }}>
                      {cls.studentCount || 0} HS
                    </Typography>
                  </Box>
                </Button>
              );
            })}
          </Box>
        </Box>

        {/* Step 4: Thông tin nhận diện môn học */}
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" } }}>
          <TextField
            helperText="Tên môn học hiển thị trong trường"
            label="Tên hiển thị *"
            onChange={(e) => setCustomName(e.target.value)}
            required
            size="small"
            value={customName}
          />
          <TextField
            helperText="Mã định danh nội bộ"
            label="Mã nội bộ *"
            onChange={(e) => setCustomCode(e.target.value)}
            required
            size="small"
            value={customCode}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, borderTop: "1px solid", borderColor: "divider" }}>
        <Button variant="contained" disabled={saving} onClick={onClose}>
          Hủy
        </Button>
        <Button
          disabled={!customName.trim() || !customCode.trim() || saving}
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
