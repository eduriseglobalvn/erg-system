import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "@tanstack/react-form";
import Building2 from "@mui/icons-material/BusinessOutlined";
import CheckCircle from "@mui/icons-material/CheckCircleOutlined";
import Globe from "@mui/icons-material/PublicOutlined";
import Layers from "@mui/icons-material/LayersOutlined";
import Mail from "@mui/icons-material/MailOutlined";
import MapPin from "@mui/icons-material/LocationOnOutlined";
import PhoneIcon from "@mui/icons-material/PhoneOutlined";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { StudentSheetImportWorkspace } from "@/features/lcms/admin-operations/components/student-sheet-import-workspace";
import { type LmsEducationUnitDTO } from "@/features/lms/infrastructure/lms-dashboard-api";
import type { ClassroomSchool, ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import type { ManagementScope } from "@/types/scope-types";
import { LcmsStatusChip } from "@/features/lcms/components/lcms-ui";
import { ClassPreviewPanel, UnitAvatar, UnitInsightRail, UnitTypeBadge } from "./admin-operations-insight";

export function EditorField({ children, label, wide = false }: { children: ReactNode; label: string; wide?: boolean }) {
  return (
    <Box
      component="label"
      sx={{
        display: "grid",
        gridColumn: wide ? { sm: "1 / -1" } : undefined,
        gap: 0.75,
        color: "text.secondary",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {label}
      {children}
    </Box>
  );
}

export function EducationUnitEditor({
  centers,
  classes,
  isSaving,
  managementScope,
  onSave,
  successMessage,
  unit,
  units,
}: {
  centers: ClassroomSchool[];
  classes: ClassroomSnapshot[];
  isSaving: boolean;
  managementScope: ManagementScope;
  onSave: (unit: LmsEducationUnitDTO) => void;
  successMessage: string;
  unit: LmsEducationUnitDTO;
  units: LmsEducationUnitDTO[];
}) {
  const [draft, setDraft] = useState<LmsEducationUnitDTO>(unit);
  const [activePanel, setActivePanel] = useState<"info" | "import">("info");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const centerOptions = units.filter((item) => item.type === "center" && item.id !== unit.id);
  const isSchool = draft.type === "school";
  const unitClasses = classes.filter((snapshot) => snapshot.schoolId === unit.id);
  const studentTotal = unitClasses.reduce((sum, snapshot) => sum + snapshot.studentCount, 0);
  const detailHint = isSchool
    ? "Cập nhật thông tin trường hoặc import danh sách lớp cho LMS."
    : draft.type === "center"
    ? "Cập nhật trung tâm và các thông tin quản lý trường trực thuộc."
    : "Cập nhật cấp hệ thống dùng chung cho toàn Admin.";
  const paceStateUpdate = usePacedStateBatch();
  const form = useForm({
    defaultValues: draft,
    onSubmit: () => onSave(draft),
  });

  useEffect(() => {
    paceStateUpdate(() => {
      setDraft(unit);
      setActivePanel("info");
      setShowAdvanced(false);
    });
  }, [paceStateUpdate, unit]);

  function updateDraft<K extends keyof LmsEducationUnitDTO>(key: K, value: LmsEducationUnitDTO[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  const header = (
    <Stack direction={{ xs: "column", lg: "row" }} sx={{ alignItems: { xs: "stretch", lg: "center" }, justifyContent: "space-between", gap: 1.5, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper", p: 2 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
        <UnitAvatar unit={draft} />
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" sx={{ alignItems: "center", flexWrap: "wrap", gap: 1 }}>
            <Typography noWrap sx={{ color: "text.primary", fontSize: 16, fontWeight: 700 }}>{draft.name || "Cơ sở giáo dục"}</Typography>
            <UnitTypeBadge type={draft.type} />
          </Stack>
          <Typography noWrap sx={{ mt: 0.25, color: "text.secondary", fontSize: 12, fontWeight: 600 }}>{detailHint}</Typography>
          <Typography noWrap sx={{ mt: 0.25, color: "text.disabled", fontSize: 11, fontWeight: 600 }}>{draft.code || "Chưa có mã định danh"}</Typography>
        </Box>
      </Stack>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: { lg: "flex-end" }, flexWrap: "wrap", gap: 1, flexShrink: 0 }}>
        <Paper variant="outlined" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, borderRadius: 1.5, p: 0.5 }}>
          <Button
            type="button"
            size="small"
            variant={activePanel === "info" ? "contained" : "text"}
            onClick={() => setActivePanel("info")}
            sx={{ minHeight: 32, borderRadius: 1, px: 1.5, fontSize: 12, textTransform: "none" }}
          >
            Thông tin
          </Button>
          {isSchool ? (
            <Button
              type="button"
              size="small"
              variant={activePanel === "import" ? "contained" : "text"}
              onClick={() => setActivePanel("import")}
              sx={{ minHeight: 32, borderRadius: 1, px: 1.5, fontSize: 12, textTransform: "none" }}
            >
              Import danh sách lớp
            </Button>
          ) : null}
        </Paper>
        {activePanel === "info" ? (
          <>
            <Button type="button" variant="outlined" size="small" onClick={() => setShowAdvanced((current) => !current)} sx={{ minHeight: 36, px: 1.5, fontSize: 12, textTransform: "none" }}>
              {showAdvanced ? "Ẩn nâng cao" : "Nâng cao"}
            </Button>
            <Button type="submit" variant="contained" size="small" disabled={isSaving || !draft.name?.trim()} sx={{ minHeight: 36, px: 1.5, fontSize: 12, textTransform: "none" }}>
              {isSaving ? "Đang lưu..." : "Lưu"}
            </Button>
          </>
        ) : null}
      </Stack>
    </Stack>
  );

  if (activePanel === "import" && isSchool) {
    return (
      <Box sx={{ display: "flex", height: "100%", flexDirection: "column" }}>
        {header}
        <Box sx={{ flex: 1, overflowY: "auto", bgcolor: "background.default", p: 2 }}>
          <StudentSheetImportWorkspace
            centers={centers}
            classes={classes}
            compact
            lockedCenter={{ id: unit.id, name: unit.name }}
            managementScope={managementScope}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
      sx={{ display: "flex", height: "100%", flexDirection: "column" }}
    >
      {header}

      <Box sx={{ flex: 1, overflowY: "auto", bgcolor: "background.default", p: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", "2xl": "minmax(0, 1fr) 340px" }, gap: 2 }}>
          <Stack spacing={2}>
            {successMessage ? (
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", border: 1, borderColor: "success.light", borderRadius: 1.5, bgcolor: "success.50", color: "success.dark", px: 1.5, py: 1, fontSize: 12, fontWeight: 600 }}>
                <CheckCircle sx={{ fontSize: 16 }} /> {successMessage}
              </Stack>
            ) : null}

            <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, boxShadow: "0 8px 24px -22px rgba(15, 23, 42, 0.6)" }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between", borderBottom: 1, borderColor: "divider", pb: 1.5 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "text.primary", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
                  <Box sx={{ display: "grid", width: 32, height: 32, placeItems: "center", border: 1, borderColor: "primary.light", borderRadius: 1, bgcolor: "primary.50", color: "primary.main" }}>
                    <Building2 sx={{ fontSize: 16 }} />
                  </Box>
                  Thông tin cơ bản
                </Stack>
                <LcmsStatusChip tone={draft.status === "active" ? "emerald" : "amber"}>{draft.status === "active" ? "Đang hoạt động" : "Cần kiểm tra"}</LcmsStatusChip>
              </Stack>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1fr) 190px 190px" }, gap: 1.5, mt: 2 }}>
                <EditorField label="Tên hiển thị">
                  <TextField size="small" fullWidth value={draft.name ?? ""} onChange={(event) => updateDraft("name", event.target.value)} placeholder="Tên trường học/trung tâm" />
                </EditorField>
                <EditorField label="Loại đơn vị">
                  <TextField select size="small"
                    value={draft.type ?? "school"}
                    onChange={(event) => updateDraft("type", event.target.value)}
                  >
                    <MenuItem value="system">Hệ thống</MenuItem><MenuItem value="center">Trung tâm</MenuItem><MenuItem value="school">Trường học</MenuItem>
                  </TextField>
                </EditorField>
                <EditorField label="Trạng thái">
                  <TextField select size="small"
                    value={draft.status ?? "active"}
                    onChange={(event) => updateDraft("status", event.target.value)}
                  >
                    <MenuItem value="active">Đang hoạt động</MenuItem><MenuItem value="archived">Lưu trữ</MenuItem><MenuItem value="inactive">Tạm dừng</MenuItem>
                  </TextField>
                </EditorField>
                <EditorField label="Mô tả giới thiệu" wide>
                  <TextField
                    multiline
                    minRows={2}
                    value={draft.description ?? ""}
                    onChange={(event) => updateDraft("description", event.target.value)}
                    placeholder="Mô tả tóm tắt vai trò và khu vực phụ trách của đơn vị..."
                  />
                </EditorField>
              </Box>
            </Paper>

        {showAdvanced ? (
          <>
            <Paper variant="outlined" sx={{ borderRadius: 1.5, p: 1.5 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", pb: 1, color: "text.primary", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
                <Mail sx={{ color: "primary.main", fontSize: 16 }} /> Thông tin liên hệ
              </Stack>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1.5, mt: 1.5 }}>
                <EditorField label="Logo URL" wide><TextField size="small" fullWidth value={draft.avatarUrl ?? ""} onChange={(event) => updateDraft("avatarUrl", event.target.value)} placeholder="https://domain.com/logo.png" /></EditorField>
                <EditorField label="Địa chỉ chi tiết" wide><TextField size="small" fullWidth value={draft.address ?? ""} onChange={(event) => updateDraft("address", event.target.value)} placeholder="Số nhà, tên đường, phường, quận/huyện..." slotProps={{ input: { startAdornment: <InputAdornment position="start"><MapPin sx={{ color: "text.secondary", fontSize: 16 }} /></InputAdornment> } }} /></EditorField>
                <EditorField label="Số điện thoại"><TextField size="small" fullWidth value={draft.phone ?? ""} onChange={(event) => updateDraft("phone", event.target.value)} placeholder="024xxx..." slotProps={{ input: { startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ color: "text.secondary", fontSize: 16 }} /></InputAdornment> } }} /></EditorField>
                <EditorField label="Email chính"><TextField size="small" fullWidth value={draft.email ?? ""} onChange={(event) => updateDraft("email", event.target.value)} placeholder="contact@domain.edu.vn" slotProps={{ input: { startAdornment: <InputAdornment position="start"><Mail sx={{ color: "text.secondary", fontSize: 16 }} /></InputAdornment> } }} /></EditorField>
                <EditorField label="Website URL"><TextField size="small" fullWidth value={draft.website ?? ""} onChange={(event) => updateDraft("website", event.target.value)} placeholder="https://domain.edu.vn" slotProps={{ input: { startAdornment: <InputAdornment position="start"><Globe sx={{ color: "text.secondary", fontSize: 16 }} /></InputAdornment> } }} /></EditorField>
              </Box>
            </Paper>
            <Paper variant="outlined" sx={{ borderRadius: 1.5, p: 1.5 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", pb: 1, color: "text.primary", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
                <Layers sx={{ color: "primary.main", fontSize: 16 }} /> Cấu hình liên kết
              </Stack>
              <Box sx={{ mt: 1.5 }}>
                <EditorField label="Thu thuộc Trung tâm quản lý">
                  <TextField select size="small" fullWidth value={draft.parentId ?? ""} onChange={(event) => updateDraft("parentId", event.target.value)} disabled={draft.type !== "school"}>
                    <MenuItem value="">Không liên kết trung tâm nào</MenuItem>
                    {centerOptions.map((center) => <MenuItem key={center.id} value={center.id}>{center.name}</MenuItem>)}
                  </TextField>
                  {draft.type !== "school" ? <Typography sx={{ color: "text.secondary", fontSize: 10, fontWeight: 600 }}>Chỉ cơ sở loại "Trường học" mới cấu hình thuộc Trung tâm.</Typography> : null}
                </EditorField>
              </Box>
            </Paper>
          </>
        ) : null}

            <ClassPreviewPanel classes={unitClasses} isSchool={isSchool} />
          </Stack>

          <UnitInsightRail
            isSchool={isSchool}
            onImport={() => setActivePanel("import")}
            unit={draft}
            unitClasses={unitClasses.length}
            studentTotal={studentTotal}
          />
        </Box>
      </Box>
    </Box>
  );
}
