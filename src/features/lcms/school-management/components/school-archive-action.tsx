import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import UnarchiveOutlinedIcon from "@mui/icons-material/UnarchiveOutlined";
import Button from "@mui/material/Button";
import { useState } from "react";
import { toast } from "sonner";

import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";

/** Archive is soft (backend DELETE sets ARCHIVED, data kept); an archived school shows a restore button instead. */
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
        description="Trường sẽ ẩn khỏi danh sách đang hợp tác, trang tổng quan và các ô chọn trường khi phân công lớp, học sinh, giáo viên. Dữ liệu lớp, học sinh và lịch sử vẫn được giữ; có thể khôi phục bất cứ lúc nào từ bộ lọc “Đã lưu trữ”."
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
