import { useForm, useStore } from "@tanstack/react-form";
import Box from "@mui/material/Box";

import { todayInput } from "@/domain/formatters/format-date";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useLeavePreview } from "../../api/timekeeping-request-query";
import type { RequestCommand, RequestView } from "../../api/timekeeping-types";
import { ChipChoice } from "./chip-choice";
import { AffectedPeriods, ApproverList, LeaveBalanceLine } from "./leave-preview-summary";
import { LEAVE_KIND_LABEL, PART_LABEL, requestErrorText } from "./request-model";
import { RequestField } from "./request-field";
import { RequestFormFrame } from "./request-form-frame";
import { hasErrors, validateLeave, type DayPart, type LeaveFormValues, type LeaveKindValue } from "./request-form-schema";
import { useRequestSubmit } from "./use-request-submit";
import { useRequestsNav } from "./use-requests-nav";

const KIND_OPTIONS = (Object.keys(LEAVE_KIND_LABEL) as LeaveKindValue[]).map((value) => ({ value, label: LEAVE_KIND_LABEL[value] }));
const PART_OPTIONS = (Object.keys(PART_LABEL) as DayPart[]).map((value) => ({ value, label: PART_LABEL[value] }));

const toCommand = (v: LeaveFormValues): RequestCommand => ({
  type: "LEAVE",
  leaveKind: v.kind,
  fromDate: v.from,
  toDate: v.to,
  part: v.part,
  note: v.reason.trim(),
});

/** G08: leave request. Days and balance come from preview-leave (debounced 300 ms); the form is also used to edit (`initial`). */
export function LeaveRequestForm({ initial }: { initial?: RequestView }) {
  const nav = useRequestsNav();
  const submit = useRequestSubmit(initial);
  const today = todayInput();
  const form = useForm({
    defaultValues: {
      kind: initial?.leaveKind ?? "ANNUAL",
      from: initial?.fromDate ?? today,
      to: initial?.toDate ?? today,
      part: initial?.part ?? "FULL",
      reason: initial?.note ?? "",
    } as LeaveFormValues,
  });
  const values = useStore(form.store, (state) => state.values);
  const errors = validateLeave(values);
  const shown = submit.attempted ? errors : {};

  const settled = useDebouncedValue(values, 300);
  const previewable = settled.from && settled.to >= settled.from && (settled.part === "FULL" || settled.from === settled.to);
  const preview = useLeavePreview(previewable ? { from: settled.from, to: settled.to, kind: settled.kind, part: settled.part } : null);

  const send = (sendIt: boolean) => void submit.run(hasErrors(errors) ? null : toCommand(values), sendIt);
  const single = (part: DayPart, from: string) => {
    form.setFieldValue("part", part);
    if (part !== "FULL") form.setFieldValue("to", from);
  };

  return (
    <RequestFormFrame
      error={submit.error}
      onBack={() => nav.toPicker()}
      onSaveDraft={() => send(false)}
      onSubmit={() => send(true)}
      pending={submit.pending}
      submitLabel="Gửi đơn"
      title="Nghỉ phép"
    >
      <Box sx={{ display: "grid", gap: 2 }}>
        <form.Field name="kind">
          {(field) => <ChipChoice label="Loại nghỉ" onChange={field.handleChange} options={KIND_OPTIONS} value={field.state.value} />}
        </form.Field>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "1fr 1fr" }}>
          <form.Field name="from">
            {(field) => (
              <RequestField
                error={shown.from}
                label="Từ ngày"
                onChange={(next) => {
                  field.handleChange(next);
                  if (values.part !== "FULL") form.setFieldValue("to", next);
                }}
                type="date"
                value={field.state.value}
              />
            )}
          </form.Field>
          <form.Field name="to">
            {(field) => <RequestField disabled={values.part !== "FULL"} error={shown.to} label="Đến ngày" onChange={field.handleChange} type="date" value={field.state.value} />}
          </form.Field>
        </Box>
        <form.Field name="part">
          {(field) => <ChipChoice label="Thời gian nghỉ" onChange={(part) => single(part, values.from)} options={PART_OPTIONS} value={field.state.value} />}
        </form.Field>
        <LeaveBalanceLine
          annual={values.kind === "ANNUAL"}
          error={preview.error ? requestErrorText(preview.error) : null}
          loading={preview.isFetching}
          preview={preview.data}
        />
        <AffectedPeriods periods={preview.data?.affectedPeriods} />
        <form.Field name="reason">
          {(field) => (
            <RequestField error={shown.reason} helper="Lý do chỉ người duyệt nhìn thấy" label="Lý do" multiline onChange={field.handleChange} value={field.state.value} />
          )}
        </form.Field>
        <ApproverList approvers={preview.data?.approvers} />
      </Box>
    </RequestFormFrame>
  );
}
