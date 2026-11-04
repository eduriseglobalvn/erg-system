import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SendIcon from "@mui/icons-material/Send";
import { toast } from "sonner";
import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgSelect, ErgTextField } from "@/components/erg-mui/erg-form";
import { ErgDialog } from "@/components/erg-mui/erg-overlays";
import { useCreateLmsAssignmentMutation } from "@/features/lms/api/lms-assignment-command-query";
import { createAssignmentIdempotencyKey } from "@/features/lms/components/assign-homework-recipient";
import { loadLmsDashboardBootstrap } from "@/features/lms/infrastructure/lms-dashboard-api";
import { hasApiBase } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { QUERY_POLICIES } from "@/lib/query-policy";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { getPersistedJsonValue, setPersistedJsonValue } from "@/stores/persisted-store";
import { defaultQuickAssignDueInput, dueInputToIso } from "./quick-assign-defaults";
import type { Exercise } from "./exercise-bank-model";

const LAST_CLASS_KEY = "erg:quick-assign:last-class:v1";

/** Chọn bài (đã chọn) -> chọn lớp (gợi ý lớp giao gần nhất) -> Giao; hạn mặc định +7 ngày. */
export function QuickAssignDialog({
  exercise,
  onClose,
  onDone,
}: {
  exercise: Exercise;
  onClose: () => void;
  onDone: (exerciseTitle: string) => void;
}) {
  const apiBacked = hasApiBase();
  const { account, session } = useAuthSession("lms");
  const bootstrap = useQuery({
    queryKey: queryKeys.lmsTeacherShell.bootstrap(session?.tenantId ?? "", account?.id),
    queryFn: ({ signal }) => loadLmsDashboardBootstrap(signal),
    enabled: apiBacked,
    staleTime: QUERY_POLICIES.reference.staleTime,
    gcTime: QUERY_POLICIES.reference.gcTime,
    refetchOnWindowFocus: false,
  });
  const classes = useMemo(() => bootstrap.data?.classes ?? [], [bootstrap.data?.classes]);
  const lastClassId = useMemo(() => getPersistedJsonValue<string>(LAST_CLASS_KEY, ""), []);
  const [pickedClassId, setPickedClassId] = useState("");
  const classId = pickedClassId || (classes.some((c) => c.id === lastClassId) ? lastClassId : (classes[0]?.id ?? ""));
  const [due, setDue] = useState(() => defaultQuickAssignDueInput());
  const mutation = useCreateLmsAssignmentMutation({ offline: {} });
  const dueAt = dueInputToIso(due);
  const canSubmit = Boolean((classId || !apiBacked) && dueAt) && !mutation.isPending;

  async function submit() {
    if (!canSubmit || !dueAt) return;
    const startAt = new Date().toISOString();
    try {
      if (apiBacked) {
        await mutation.mutateAsync({
          attemptLimit: 1,
          classId,
          dueAt,
          idempotencyKey: createAssignmentIdempotencyKey({ dueAt, quizIds: [exercise.id], startAt: due, title: exercise.title }),
          maxDurationMinutes: exercise.durationMinutes,
          quizIds: [exercise.id],
          recipientMode: "class",
          startAt,
          teacherNote: exercise.subject,
          title: exercise.title,
        });
      }
      setPersistedJsonValue(LAST_CLASS_KEY, classId);
      onDone(exercise.title);
    } catch {
      toast.error("Không thể giao bài. Vui lòng thử lại.");
    }
  }

  return (
    <ErgDialog
      actions={
        <>
          <ErgButton onClick={onClose} variant="text">Hủy</ErgButton>
          <ErgButton disabled={!canSubmit} leadingIcon={<SendIcon />} loading={mutation.isPending} onClick={submit} variant="contained">
            Giao bài
          </ErgButton>
        </>
      }
      description={exercise.title}
      onClose={onClose}
      open
      title="Giao nhanh"
    >
      <ErgSelect
        label="Lớp nhận bài"
        onChange={(event) => setPickedClassId(String(event.target.value))}
        options={classes.map((c) => ({ label: c.className, value: c.id }))}
        sx={{ mb: 2, mt: 1 }}
        value={classId}
      />
      <ErgTextField
        label="Hạn nộp (23:59)"
        onChange={(event) => setDue(event.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
        type="date"
        value={due}
      />
    </ErgDialog>
  );
}
