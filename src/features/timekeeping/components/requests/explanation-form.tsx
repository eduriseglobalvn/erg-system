import { useForm, useStore } from "@tanstack/react-form";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useEffect, useRef } from "react";

import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { todayInput } from "@/domain/formatters/format-date";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { useExplanationContext } from "../../api/timekeeping-request-query";
import { useTimekeepingDay } from "../../api/timekeeping-query";
import type { RequestView } from "../../api/timekeeping-types";
import { CardRow, IconTile, PunchCard } from "../punch/punch-card";
import { hhmm, longDate } from "../punch/punch-format";
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

/** Green tile with the punch time, red "Không có" when that punch is missing. */
function PunchTile({ label, time }: { label: string; time: string }) {
  const tint = ergEnterpriseTokens.statusTint[time ? "success" : "error"];
  return (
    <Box sx={{ bgcolor: tint.bg, borderRadius: `${ergEnterpriseTokens.radius.control}px`, color: tint.color, px: 1.5, py: 1.25 }}>
      <Typography component="div" variant="caption">{label}</Typography>
      <Typography component="div" sx={{ fontVariantNumeric: "tabular-nums" }} variant="subtitle2">{time || "Không có"}</Typography>
    </Box>
  );
}

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
      badge={remaining === undefined ? null : (
        <ErgStatusChip aria-label={`Còn ${remaining} trên ${MONTHLY_LIMIT} lượt giải trình`} dot={false} label={`${remaining}/${MONTHLY_LIMIT} lượt`} sx={{ mr: 1 }} tone={remaining === 0 ? "error" : "neutral"} />
      )}
    >
      <Box sx={{ display: "grid", gap: 2 }}>
        {values.date ? (
          <PunchCard sx={{ display: "grid", gap: 1.5 }}>
            <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-between" }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2">{longDate(values.date)}</Typography>
                {day?.shift ? <Typography color="text.secondary" variant="caption">{`${day.shift.name ?? "Ca"} ${hhmm(day.shift.start)} – ${hhmm(day.shift.end)}`}</Typography> : null}
              </Box>
              {day?.missing ? <ErgStatusChip label={MISSING_CHIP[day.missing]} tone="error" /> : null}
            </Box>
            {day ? (
              <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "1fr 1fr" }}>
                <PunchTile label="Vào ca" time={hhmm(day.in?.punch?.serverTime)} />
                <PunchTile label="Ra ca" time={hhmm(day.out?.punch?.serverTime)} />
              </Box>
            ) : null}
          </PunchCard>
        ) : null}
        <form.Field name="date">
          {(field) => <RequestField error={shown.date} label="Ngày giải trình" onChange={field.handleChange} type="date" value={field.state.value} />}
        </form.Field>
        <form.Field name="reason">
          {(field) => <ChipChoice checkmark label="Lý do thiếu" onChange={field.handleChange} options={REASON_OPTIONS} value={field.state.value} />}
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
              {suggestedOut && field.state.value === suggestedOut ? <ErgStatusChip dot={false} label="Gợi ý" sx={{ mt: 0.75 }} tone="info" /> : null}
            </Box>
          )}
        </form.Field>
        <Box sx={{ display: "grid", gap: 0.75 }}>
          <Typography color="text.secondary" component="h2" variant="subtitle2">Minh chứng</Typography>
          <PunchCard component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
            {ctx?.evidence?.length ? (
              ctx.evidence.map((item, index) => (
                <CardRow component="li" icon={<IconTile small tone="success"><MenuBookIcon /></IconTile>} key={`${item.ref}-${index}`} trailing={<CheckCircleIcon aria-hidden color="success" />}>
                  <Typography variant="subtitle2">{item.label}</Typography>
                  <Typography color="text.secondary" variant="caption">Tự đính kèm</Typography>
                </CardRow>
              ))
            ) : (
              <CardRow component="li">
                <Typography color="text.secondary" variant="body2">Lịch dạy ngày đó (tự đính kèm)</Typography>
              </CardRow>
            )}
          </PunchCard>
        </Box>
        <form.Field name="note">
          {(field) => <RequestField label="Ghi chú" multiline onChange={field.handleChange} value={field.state.value} />}
        </form.Field>
        <ApproverList />
      </Box>
    </RequestFormFrame>
  );
}
