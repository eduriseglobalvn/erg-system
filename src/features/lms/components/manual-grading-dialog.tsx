import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgTextField } from "@/components/erg-mui/erg-form";
import { ErgDialog } from "@/components/erg-mui/erg-overlays";
import { ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import {
  gradeManualAnswer,
  loadManualReview,
  manualAnswerText,
  type ManualReviewItem,
} from "@/features/lms/api/lms-manual-grading-api";

const pointsLabel = (value: number) => value.toLocaleString("vi-VN", { maximumFractionDigits: 2 });

/** Parses what the teacher typed (comma or dot decimals); null when it is not a score within 0..max. */
export function parseManualPoints(raw: string, maxPoints: number): number | null {
  const text = raw.trim().replace(",", ".");
  if (!text) return null;
  const value = Number(text);
  return Number.isFinite(value) && value >= 0 && value <= maxPoints ? value : null;
}

/** Teacher grades the essay answers of one attempt; the attempt gets its final score once none is left. */
export function ManualGradingDialog({
  attemptId,
  onClose,
  onGraded,
  studentName,
}: {
  attemptId: string;
  onClose: () => void;
  onGraded: () => void;
  studentName: string;
}) {
  const review = useQuery({
    gcTime: 0,
    queryFn: ({ signal }) => loadManualReview(attemptId, signal),
    queryKey: ["lms", "manual-review", attemptId],
    staleTime: 0,
  });
  const [points, setPoints] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const pending = (review.data?.items ?? []).filter((item) => item.needsManualGrade);
  const ready = pending.length > 0 && pending.every((item) => parseManualPoints(points[item.questionId] ?? "", item.maxPoints) !== null);

  async function save() {
    if (!ready || saving) return;
    setSaving(true);
    try {
      // One request per answer: the server recomputes the total after each and closes the attempt on the last.
      for (const item of pending) {
        await gradeManualAnswer(attemptId, item.questionId, parseManualPoints(points[item.questionId] ?? "", item.maxPoints) ?? 0);
      }
      toast.success(`Đã chấm bài của ${studentName}`);
      onGraded();
      onClose();
    } catch {
      toast.error("Chưa lưu được điểm. Vui lòng thử lại.");
      void review.refetch();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ErgDialog
      actions={(
        <>
          <Button onClick={onClose} sx={{ minHeight: 44 }} variant="text">Đóng</Button>
          <ErgButton disabled={!ready} loading={saving} onClick={() => void save()} sx={{ minHeight: 44 }} variant="contained">Lưu điểm</ErgButton>
        </>
      )}
      description="Nhập điểm cho từng câu tự luận. Lưu xong, bài có điểm cuối và lên bảng điểm."
      onClose={onClose}
      open
      title={`Chấm bài của ${studentName}`}
    >
      {review.isLoading ? <ErgSkeleton height={160} /> : null}
      {review.isError ? <Typography color="error.main" variant="body2">Chưa tải được bài làm. Đóng hộp này rồi mở lại.</Typography> : null}
      {review.data && review.data.items.length === 0 ? (
        <Typography color="text.secondary" variant="body2">Bài này không có câu nào cần chấm tay.</Typography>
      ) : null}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {(review.data?.items ?? []).map((item, index) => (
          <ManualAnswer
            index={index}
            item={item}
            key={item.questionId}
            onChange={(value) => setPoints((current) => ({ ...current, [item.questionId]: value }))}
            value={points[item.questionId] ?? ""}
          />
        ))}
      </Box>
    </ErgDialog>
  );
}

function ManualAnswer({ index, item, onChange, value }: { index: number; item: ManualReviewItem; onChange: (value: string) => void; value: string }) {
  const invalid = value.trim() !== "" && parseManualPoints(value, item.maxPoints) === null;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="subtitle2">Câu tự luận {index + 1}: {item.prompt || "(không có đề bài)"}</Typography>
      <Typography sx={{ bgcolor: "action.hover", borderRadius: 1, p: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }} variant="body2">
        {manualAnswerText(item.answer) || "Học sinh để trống."}
      </Typography>
      {item.needsManualGrade ? (
        <ErgTextField
          error={invalid}
          helperText={invalid ? `Nhập số từ 0 đến ${pointsLabel(item.maxPoints)}` : `Tối đa ${pointsLabel(item.maxPoints)} điểm`}
          slotProps={{ htmlInput: { inputMode: "decimal" } }}
          label="Điểm"
          onChange={(event) => onChange(event.target.value)}
          sx={{ maxWidth: 220 }}
          value={value}
        />
      ) : (
        <Typography color="text.secondary" variant="body2">
          Đã chấm: {pointsLabel(item.awardedPoints)} / {pointsLabel(item.maxPoints)} điểm
        </Typography>
      )}
    </Box>
  );
}
