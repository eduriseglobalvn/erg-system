import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { type ChangeEvent, useLayoutEffect, useRef, useState } from "react";

import { ErgButton, ErgTextField } from "@/components/erg-mui";

import { useResolvePeople } from "../api/campaign-query";
import { type AudienceDraft, addPicked } from "../model/audience-draft";
import { MAX_PASTED_LINES, RecipientFileError, capLines, parsePastedRecipients, readRecipientsFromFile } from "../model/parse-pasted-recipients";

type Props = { draft: AudienceDraft; onChange: (draft: AudienceDraft) => void };

const mergeUnique = (a: string[], b: string[]) => [...new Set([...a, ...b])];

/** Paste a list (or import .xlsx/.csv/.txt): matches become picked people, the rest land in `errors`. */
export function PastePanel({ draft, onChange }: Props) {
  const [text, setText] = useState("");
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const resolve = useResolvePeople();
  // Resolving is async: apply the result to the draft as it is NOW, not as it was at click time.
  const latest = useRef(draft);
  useLayoutEffect(() => {
    latest.current = draft;
  });

  async function run(rawLines: string[]) {
    const { lines, dropped } = capLines(rawLines);
    if (lines.length === 0) return;
    setNotice(dropped > 0 ? `Chỉ xử lý ${MAX_PASTED_LINES.toLocaleString("vi-VN")} dòng đầu, bỏ ${dropped.toLocaleString("vi-VN")} dòng.` : "");
    try {
      const result = await resolve.mutateAsync(lines);
      const failed = [
        ...(result.notFound ?? []),
        ...(result.ambiguous ?? []).map((a) => `${a.line ?? ""} (khớp ${a.candidates ?? 0} người)`),
      ];
      const current = latest.current;
      onChange({ ...addPicked(current, result.matched ?? []), errors: mergeUnique(current.errors, failed) });
      setText("");
    } catch (error) {
      setNotice(error instanceof Error && error.message ? error.message : "Không kiểm tra được danh sách.");
    }
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      await run(await readRecipientsFromFile(file));
    } catch (error) {
      setNotice(error instanceof RecipientFileError ? error.message : "Không đọc được tệp. Dùng .xlsx, .csv hoặc .txt, mỗi dòng một mã, email hoặc số điện thoại.");
    }
  }

  return (
    <Stack spacing={1}>
      <ErgTextField
        helperText="Mỗi dòng một mã, email hoặc số điện thoại. Tối đa 5.000 dòng."
        label="Dán danh sách"
        minRows={3}
        multiline
        onChange={(event) => setText(event.target.value)}
        value={text}
      />
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
        <ErgButton
          disabled={text.trim() === ""}
          loading={resolve.isPending}
          onClick={() => run(parsePastedRecipients(text))}
          size="small"
          variant="outlined"
        >
          Kiểm tra danh sách
        </ErgButton>
        <ErgButton onClick={() => fileRef.current?.click()} size="small" variant="text">Nhập từ Excel</ErgButton>
        <input accept=".xlsx,.xls,.csv,.txt" aria-label="Chọn tệp danh sách người nhận" hidden onChange={onFile} ref={fileRef} type="file" />
      </Stack>
      <Typography aria-live="polite" color="text.secondary" role="status" variant="caption">{notice}</Typography>
    </Stack>
  );
}
