import { useForm, useStore } from "@tanstack/react-form";
import Box from "@mui/material/Box";

import { todayInput } from "@/domain/formatters/format-date";
import type { RequestType, RequestView } from "../../api/timekeeping-types";
import { ApproverList } from "./leave-preview-summary";
import { RequestField } from "./request-field";
import { RequestFormFrame } from "./request-form-frame";
import { hasErrors, validateLeave } from "./request-form-schema";
import { TYPE_TITLE } from "./request-model";
import { useRequestSubmit } from "./use-request-submit";
import { useRequestsNav } from "./use-requests-nav";

type RangeValues = { from: string; to: string; reason: string };

/** Date range plus reason: the whole form of "Làm việc tại nhà" and "Công tác". The server counts the days. */
export function RangeRequestForm({ type, initial }: { type: Extract<RequestType, "WFH" | "BUSINESS">; initial?: RequestView }) {
  const nav = useRequestsNav();
  const submit = useRequestSubmit(initial);
  const today = todayInput();
  const form = useForm({ defaultValues: { from: initial?.fromDate ?? today, to: initial?.toDate ?? today, reason: initial?.note ?? "" } as RangeValues });
  const values = useStore(form.store, (state) => state.values);
  const errors = validateLeave({ ...values, part: "FULL" });
  const shown = submit.attempted ? errors : {};
  const send = (sendIt: boolean) =>
    void submit.run(hasErrors(errors) ? null : { type, fromDate: values.from, toDate: values.to, note: values.reason.trim() }, sendIt);

  return (
    <RequestFormFrame
      editingPending={initial?.status === "PENDING"}
      error={submit.error}
      onBack={() => nav.toPicker()}
      onSaveDraft={() => send(false)}
      onSubmit={() => send(true)}
      pending={submit.pending}
      submitLabel="Gửi đơn"
      title={TYPE_TITLE[type]}
    >
      <Box sx={{ display: "grid", gap: 2 }}>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "1fr 1fr" }}>
          <form.Field name="from">
            {(field) => <RequestField error={shown.from} label="Từ ngày" onChange={field.handleChange} type="date" value={field.state.value} />}
          </form.Field>
          <form.Field name="to">
            {(field) => <RequestField error={shown.to} label="Đến ngày" onChange={field.handleChange} type="date" value={field.state.value} />}
          </form.Field>
        </Box>
        <form.Field name="reason">
          {(field) => (
            <RequestField error={shown.reason} helper="Lý do chỉ người duyệt nhìn thấy" label="Lý do" multiline onChange={field.handleChange} value={field.state.value} />
          )}
        </form.Field>
        <ApproverList />
      </Box>
    </RequestFormFrame>
  );
}
