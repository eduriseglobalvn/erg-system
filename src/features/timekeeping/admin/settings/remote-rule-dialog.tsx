import { useForm, useStore } from "@tanstack/react-form";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { toast } from "sonner";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgDialog } from "@/components/erg-mui/erg-overlays";
import { useSaveRemoteRule } from "../../api/timekeeping-config-query";
import type { RemoteRuleConfig } from "../../api/timekeeping-types";
import { ChipChoice } from "../../components/requests/chip-choice";
import { requestErrorText } from "../../components/requests/request-model";
import { PersonPicker } from "./person-picker";
import { WEEKDAYS } from "./shift-model";

export type RemoteKind = NonNullable<RemoteRuleConfig["kind"]>;
export const KIND_LABEL: Record<RemoteKind, string> = {
  USERS: "Nhân sự được chỉ định",
  WEEKDAY: "Theo ngày cố định",
  APPROVED_WFH: "Khi đơn \"Làm việc tại nhà\" được duyệt",
};
const KINDS = (Object.keys(KIND_LABEL) as RemoteKind[]).map((value) => ({ value, label: KIND_LABEL[value] }));
const DAYS = WEEKDAYS.map((d) => ({ value: String(d.value), label: d.label }));

type RemoteRuleDialogProps = { schoolId: string; rule?: RemoteRuleConfig; onClose: () => void };

/** Add / edit a remote punch rule. Who it applies to depends on the kind. */
export function RemoteRuleDialog({ onClose, rule, schoolId }: RemoteRuleDialogProps) {
  const form = useForm({ defaultValues: { kind: rule?.kind ?? ("USERS" as RemoteKind), userIds: [...(rule?.userIds ?? [])], weekday: String(rule?.weekday ?? 1), active: rule?.active ?? true } });
  const values = useStore(form.store, (state) => state.values);
  const save = useSaveRemoteRule();
  const [names, setNames] = useState<Record<string, string>>({});
  const [attempted, setAttempted] = useState(false);
  const noUsers = values.kind === "USERS" && values.userIds.length === 0;
  const submit = () => {
    setAttempted(true);
    if (noUsers) return;
    const body = {
      schoolId,
      kind: values.kind,
      active: values.active,
      userIds: values.kind === "USERS" ? values.userIds : undefined,
      weekday: values.kind === "WEEKDAY" ? Number(values.weekday) : undefined,
    };
    save.mutate({ id: rule?.id, body }, { onSuccess: () => { toast.success("Đã lưu quy tắc chấm công từ xa"); onClose(); } });
  };

  return (
    <ErgDialog
      actions={
        <>
          <ErgButton onClick={onClose} variant="text">Huỷ</ErgButton>
          <ErgButton loading={save.isPending} onClick={submit} variant="outlined">Lưu quy tắc</ErgButton>
        </>
      }
      onClose={onClose}
      open
      title={rule ? "Sửa quy tắc chấm công từ xa" : "Thêm quy tắc chấm công từ xa"}
    >
      <Box sx={{ display: "grid", gap: 2, pt: 1 }}>
        <ChipChoice label="Áp dụng cho" onChange={(kind) => form.setFieldValue("kind", kind)} options={KINDS} value={values.kind} />
        {values.kind === "USERS" ? (
          <>
            <PersonPicker names={names} onChange={(ids) => form.setFieldValue("userIds", ids)} onName={(id, name) => setNames((prev) => ({ ...prev, [id]: name }))} value={values.userIds} />
            {attempted && noUsers ? <Typography color="error" role="alert" variant="caption">Chọn ít nhất một người</Typography> : null}
          </>
        ) : null}
        {values.kind === "WEEKDAY" ? <ChipChoice label="Ngày trong tuần" onChange={(day) => form.setFieldValue("weekday", day)} options={DAYS} value={values.weekday} /> : null}
        {values.kind === "APPROVED_WFH" ? (
          <Typography color="text.secondary" variant="body2">Ngày có đơn "Làm việc tại nhà" đã duyệt được chấm công từ xa.</Typography>
        ) : null}
        <FormControlLabel control={<Switch checked={values.active} onChange={(_, checked) => form.setFieldValue("active", checked)} />} label="Đang áp dụng" />
        {save.isError ? <Typography color="error" role="alert" variant="body2">{requestErrorText(save.error)}</Typography> : null}
      </Box>
    </ErgDialog>
  );
}
