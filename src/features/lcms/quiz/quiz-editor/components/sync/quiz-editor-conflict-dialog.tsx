import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgDialog } from "@/components/erg-mui/erg-overlays";

// No onClose: Esc/backdrop do nothing and ErgDialog draws no close button.
export function QuizEditorConflictDialog({ busy, onKeepMine, onUseServer, open }: {
  open: boolean;
  busy: boolean;
  onKeepMine: () => void;
  onUseServer: () => void;
}) {
  return (
    <ErgDialog
      actions={
        <>
          <ErgButton disabled={busy} onClick={onUseServer} variant="outlined">Dùng bản trên máy chủ</ErgButton>
          <ErgButton loading={busy} onClick={onKeepMine} variant="contained">Giữ bản của tôi</ErgButton>
        </>
      }
      description="Bản trên máy chủ mới hơn bản bạn đang sửa. Chọn bản muốn giữ. Bản không chọn được lưu thành một bản sao trên máy này."
      open={open}
      title="Bài này vừa được lưu từ một máy khác"
    />
  );
}
