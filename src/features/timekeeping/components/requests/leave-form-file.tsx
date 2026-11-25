import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { requestErrorText } from "./request-model";

/** Form BM01-ĐXNP/ERG, served from public/forms. */
const TEMPLATE_URL = "/forms/don-xin-nghi-phep.docx";
const TEMPLATE_NAME = "ERG-BM-Đơn xin nghỉ phép.docx";
const MAX_BYTES = 2 * 1024 * 1024; // spring.servlet.multipart.max-file-size

/** Null when the file can be uploaded; the backend checks the real content again. */
export function leaveFormFileError(file: File): string | null {
  if (!/\.docx?$/i.test(file.name)) return "Đơn phải là file Word (.docx hoặc .doc)";
  if (file.size > MAX_BYTES) return "File đơn tối đa 2 MB";
  return null;
}

type LeaveFormFileProps = {
  /** The file picked in this session, not uploaded yet. */
  file: File | null;
  /** Name of the form already stored with the draft. */
  storedName?: string;
  error?: string;
  onChange: (file: File | null, error: string | null) => void;
};

/** The filled-in Word form a leave request needs: download the template, then pick the completed file. */
export function LeaveFormFile({ file, storedName, error, onChange }: LeaveFormFileProps) {
  const input = useRef<HTMLInputElement>(null);
  const name = file?.name ?? storedName;
  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      <Typography component="h2" variant="subtitle2">Đơn xin nghỉ phép (file Word)</Typography>
      <Typography color="text.secondary" variant="body2">
        Tải mẫu đơn về, điền đầy đủ rồi tải file lên. Đơn chỉ được gửi duyệt khi có file này.
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        <Button component="a" download={TEMPLATE_NAME} href={TEMPLATE_URL} startIcon={<DownloadIcon />} variant="text">Tải mẫu đơn</Button>
        <ErgButton onClick={() => input.current?.click()} startIcon={<UploadFileIcon />} variant="outlined">{name ? "Chọn file khác" : "Chọn file đã điền"}</ErgButton>
      </Box>
      <input
        accept=".doc,.docx"
        aria-label="File đơn xin nghỉ phép"
        hidden
        onChange={(event) => {
          const picked = event.target.files?.[0];
          event.target.value = ""; // picking the same file again must fire a change
          if (!picked) return;
          const problem = leaveFormFileError(picked);
          onChange(problem ? null : picked, problem);
        }}
        ref={input}
        type="file"
      />
      {name ? <Typography sx={{ overflowWrap: "anywhere" }} variant="body2">{`Đã chọn: ${name}`}</Typography> : null}
      {error ? <Typography color="error" role="alert" variant="caption">{error}</Typography> : null}
    </Box>
  );
}

/** Saves a fetched file under `name`. */
function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

/** "Tải đơn" for a stored leave form; `load` fetches it with the caller's session (requester or approver endpoint). */
export function LeaveFormDownload({ name, load }: { name: string; load: () => Promise<Blob> }) {
  const download = useMutation({ mutationFn: load, meta: { silent: true }, onSuccess: (blob) => saveBlob(blob, name) });
  return (
    <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, minWidth: 0 }}>
      <Typography sx={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }} variant="body2">{name}</Typography>
      <ErgButton loading={download.isPending} onClick={() => download.mutate()} size="small" startIcon={<DownloadIcon />} variant="outlined">Tải đơn</ErgButton>
      {download.error ? <Typography color="error" role="alert" sx={{ flexBasis: "100%" }} variant="caption">{requestErrorText(download.error)}</Typography> : null}
    </Box>
  );
}
