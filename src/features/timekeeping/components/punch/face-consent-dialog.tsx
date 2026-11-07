import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";

type FaceConsentDialogProps = { open: boolean; loading?: boolean; onAccept: () => void; onDecline: () => void };

/** One-time consent before the first selfie is stored (plan D3). */
export function FaceConsentDialog({ open, loading, onAccept, onDecline }: FaceConsentDialogProps) {
  return (
    <ErgConfirmDialog
      cancelLabel="Không đồng ý"
      confirmLabel="Đồng ý"
      description="Ảnh khuôn mặt chỉ dùng làm bằng chứng chấm công. Ảnh được lưu riêng tư, người duyệt xem qua liên kết có hạn 5 phút và tự xoá sau 60 ngày."
      loading={loading}
      onCancel={onDecline}
      onConfirm={onAccept}
      open={open}
      title="Đồng ý lưu ảnh khuôn mặt"
    />
  );
}
