import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import UnarchiveOutlinedIcon from "@mui/icons-material/UnarchiveOutlined";
import Button from "@mui/material/Button";
import { useState } from "react";
import { toast } from "sonner";

import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";

/** Archive locks the school's open classes, students and their logins (backend keeps a record so restore reopens exactly those); an archived school shows a restore button instead. */
export function SchoolArchiveAction() {
  const { archiveSchool, isSaving, restoreSchool, selectedSchool } = useSchoolManagementContext();
  const [asking, setAsking] = useState(false);
  const [pending, setPending] = useState(false);
  if (!selectedSchool) return null;
  const { id, name } = selectedSchool;

  if (selectedSchool.status === "archived") {
    return (
      <Button
        disabled={isSaving}
        onClick={() => void restoreSchool(id).then(() => toast.success(`Đã khôi phục ${name}.`), () => undefined)}
        startIcon={<UnarchiveOutlinedIcon />}
        variant="outlined"
      >
        Khôi phục trường
      </Button>
    );
  }

  const openClasses = selectedSchool.classes.filter((c) => c.status?.toUpperCase() === "ACTIVE").length;

  async function confirm() {
    setPending(true);
    try {
      await archiveSchool(id);
      toast.success(`Đã lưu trữ ${name}.`);
      setAsking(false);
    } catch {
      // The global mutation toast already shows the error; keep the dialog open to retry.
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button color="error" disabled={isSaving} onClick={() => setAsking(true)} startIcon={<Inventory2OutlinedIcon />} variant="outlined">
        Lưu trữ trường
      </Button>
      <ErgConfirmDialog
        confirmLabel="Lưu trữ"
        description={`${openClasses} lớp, ${selectedSchool.studentCount ?? 0} học sinh sẽ bị lưu trữ và khoá đăng nhập; khôi phục sẽ mở lại. Trường ẩn khỏi danh sách đang hợp tác và các ô chọn trường; dữ liệu và lịch sử vẫn được giữ, khôi phục từ bộ lọc “Đã lưu trữ”.`}
        destructive
        loading={pending}
        onCancel={() => setAsking(false)}
        onConfirm={() => void confirm()}
        open={asking}
        title={`Lưu trữ ${name}?`}
      />
    </>
  );
}
