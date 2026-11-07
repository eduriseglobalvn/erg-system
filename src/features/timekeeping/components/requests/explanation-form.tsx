import { useForm, useStore } from "@tanstack/react-form";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { useEffect, useRef } from "react";

import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { formatDateVi, todayInput } from "@/domain/formatters/format-date";
import { useExplanationContext } from "../../api/timekeeping-request-query";
import { useTimekeepingDay } from "../../api/timekeeping-query";
import type { RequestView } from "../../api/timekeeping-types";
import { PunchCard } from "../punch/punch-card";
import { hhmm } from "../punch/punch-format";
import { ChipChoice } from "./chip-choice";
import { ApproverList } from "./leave-preview-summary";
import { REASON_LABEL } from "./request-model";
import { RequestField } from "./request-field";
import { RequestFormFrame } from "./request-form-frame";
import { hasErrors, validateExplanation, type ExplanationFormValues, type ExplanationReason } from "./request-form-schema";
import { useRequestSubmit } from "./use-request-submit";
import { useRequestsNav } from "./use-requests-nav";

const REASON_OPTIONS = (Object.keys(REASON_LABEL) as ExplanationReason[]).map((value) => ({ value, label: REASON_LABEL[value] }));
const MISSING_CHIP = { IN: "Thiếu giờ vào", OUT: "Thiếu giờ ra" } as const;
const MONTHLY_LIMIT = 3;

/** G09: explanation of a missing punch. `date` comes from `?date=` (link from G04/G05). The proposed OUT starts at the server's suggestion. */
export function ExplanationForm({ date, initial }: { date?: string; initial?: RequestView }) {
  const nav = useRequestsNav();
  const submit = useRequestSubmit(initial);
  const form = useForm({
    defaultValues: {
      date: initial?.workDate ?? date ?? todayInput(),
      reason: initial?.explanationReason ?? "FORGOT",
      proposedOut: hhmm(initial?.proposedOut),
      note: initial?.note ?? "",
    } as ExplanationFormValues,
  });
  const values = useStore(form.store, (state) => state.values);
  const ctx = useExplanationContext(values.date || undefined).data;
  const day = useTimekeepingDay(values.date || undefined).data;
  const edited = useRef(Boolean(initial?.proposedOut));

  // Fill the suggested OUT until the teacher chooses a time herself.
  const suggestedOut = hhmm(ctx?.suggestedOut);
  useEffect(() => {
    if (suggestedOut && !edited.current) form.setFieldValue("proposedOut", suggestedOut);
  }, [form, suggestedOut]);

  // Editing a pending explanation frees its own slot, so the monthly limit must not block the replacement.
  const editingPending = initial?.status === "PENDING";
  const errors = validateExplanation(values, editingPending ? {} : (ctx ?? {}));
  const shown = submit.attempted ? errors : {};
  const remaining = ctx?.remaining;
  const send = () =>
    void submit.run(
      hasErrors(errors)
        ? null
        : {
            type: "EXPLANATION",
            workDate: values.date,
            explanationReason: values.reason,
            proposedOut: values.proposedOut || undefined,
            note: values.note.trim() || undefined,
          },
      true,
    );

  return (
    <RequestFormFrame
      editingPending={editingPending}
      error={submit.error ?? errors.form}
      onBack={() => nav.toList()}
      onSubmit={send}
      pending={submit.pending}
      submitDisabled={Boolean(errors.form)}
      submitLabel="Gửi giải trình"
      title="Giải trình chấm công"
    >
      <Box sx={{ display: "grid", gap: 2 }}>
        <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1 }}>
          {remaining === undefined ? null : (
            <ErgStatusChip aria-label={`Còn ${remaining} trên ${MONTHLY_LIMIT} lượt giải trình`} dot={false} label={`${remaining}/${MONTHLY_LIMIT} lượt`} tone={remaining === 0 ? "error" : "info"} />
          )}
          {values.date ? <ErgStatusChip dot={false} label={formatDateVi(values.date)} /> : null}
          {day?.missing ? <ErgStatusChip dot={false} label={MISSING_CHIP[day.missing]} tone="error" /> : null}
          {day?.shift ? (
            <Typography color="text.secondary" variant="body2">{`Vào ca ${hhmm(day.shift.start)} · Ra ca ${hhmm(day.shift.end)}`}</Typography>
          ) : null}
        </Box>
        <form.Field name="date">
          {(field) => <RequestField error={shown.date} label="Ngày giải trình" onChange={field.handleChange} type="date" value={field.state.value} />}
        </form.Field>
        <form.Field name="reason">
          {(field) => <ChipChoice label="Lý do thiếu" onChange={field.handleChange} options={REASON_OPTIONS} value={field.state.value} />}
        </form.Field>
        <form.Field name="proposedOut">
          {(field) => (
            <Box>
              <RequestField
                error={shown.proposedOut}
                helper="Gợi ý lấy giờ muộn hơn giữa giờ ra ca và giờ kết thúc tiết cuối trong lịch dạy"
                label="Giờ ra đề nghị"
                onChange={(next) => {
                  edited.current = true;
                  field.handleChange(next);
                }}
                type="time"
                value={field.state.value}
              />
              {suggestedOut && field.state.value === suggestedOut ? <Chip label="Gợi ý" size="small" sx={{ mt: 0.75 }} variant="outlined" /> : null}
            </Box>
          )}
        </form.Field>
        <PunchCard>
          <Typography component="h2" variant="subtitle1">Minh chứng</Typography>
          <Typography color="text.secondary" variant="body2">Lịch dạy ngày đó (tự đính kèm)</Typography>
          {ctx?.evidence?.length ? (
            <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
              {ctx.evidence.map((item, index) => <Typography component="li" key={`${item.ref}-${index}`} variant="body2">{item.label}</Typography>)}
            </Box>
          ) : null}
        </PunchCard>
        <form.Field name="note">
          {(field) => <RequestField label="Ghi chú" multiline onChange={field.handleChange} value={field.state.value} />}
        </form.Field>
        <ApproverList />
      </Box>
    </RequestFormFrame>
  );
}
