import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useForm, useStore } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { ErgButton } from "@/components/erg-mui";
import { formatDateTimeVi } from "@/domain/formatters/format-date";

import { useCampaignEstimate, useCreateCampaign, useScheduleCampaign, useSendCampaign, useUpdateCampaign } from "../api/campaign-query";
import { toCampaignAudience } from "../model/audience-draft";
import {
  type CampaignFormValues,
  defaultScheduleInput,
  emptyCampaignForm,
  formatCountVi,
  localInputToIso,
  toDraftRequest,
  validateCampaignForm,
} from "../model/campaign-form-schema";
import { type ComposePortalKind, notificationComposePath, notificationsHomePath } from "../model/campaign-paths";
import { CampaignAudienceSection } from "./campaign-audience-section";
import { CampaignChannelFields } from "./campaign-channel-fields";
import { CampaignContentFields } from "./campaign-content-fields";
import { CampaignScheduleField } from "./campaign-schedule-field";

type Props = {
  /** Set when editing a saved draft / scheduled campaign. */
  campaignId?: string;
  initial?: Partial<CampaignFormValues>;
  portalKind: ComposePortalKind;
};

function messageOf(error: unknown) {
  if ((error as { status?: number } | null)?.status === 403) {
    return "Bạn không có quyền gửi cho phạm vi này. Giáo viên chỉ gửi được cho lớp mình dạy và học sinh của các lớp đó.";
  }
  return error instanceof Error && error.message ? error.message : "Không lưu được thông báo. Thử lại sau.";
}

/** N16 "Soạn thông báo": compose, then send now, schedule, or save as draft. */
export function CampaignComposeForm({ campaignId, initial, portalKind }: Props) {
  const navigate = useNavigate();
  const form = useForm({ defaultValues: { ...emptyCampaignForm(), ...initial } as CampaignFormValues });
  const values = useStore(form.store, (state) => state.values);
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const [submitError, setSubmitError] = useState<string | null>(null);
  // After a submit attempt every field error shows, not only the touched ones.
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // A campaign created by a failed "send" is reused on retry instead of creating a second one.
  const savedId = useRef(campaignId);

  const estimate = useCampaignEstimate(toCampaignAudience(values.audience));
  const scheduleIso = values.sendMode === "schedule" ? (localInputToIso(values.scheduledAt) ?? "") : "";
  const create = useCreateCampaign();
  const update = useUpdateCampaign();
  const send = useSendCampaign();
  const schedule = useScheduleCampaign(scheduleIso);
  const pending = create.isPending || update.isPending || send.isPending || schedule.isPending;

  const errors = validateCampaignForm(values, new Date());
  const shown = (field: "title" | "body") => (attempted || touched.has(field) ? errors[field] : undefined);
  const total = estimate.data?.total;
  const canSend = !pending && !estimate.isFetching && !estimate.error && Boolean(total) && Object.keys(errors).length === 0;
  // The backend rejects a draft without recipients too.
  const canSave = !pending && !errors.title && !errors.body && !errors.audience;
  // A disabled primary always says why.
  const blockedReason = pending
    ? null
    : (errors.audience ?? errors.scheduledAt ?? (errors.title || errors.body ? "Nhập tiêu đề và nội dung (tối đa 2.000 ký tự)" : null)
      ?? (estimate.error ? "Sửa người nhận theo lỗi ở phần Gửi đến" : !canSend ? (estimate.isFetching ? "Đang ước tính số người nhận…" : "Không có ai trong phạm vi đã chọn") : null));

  const set = (patch: Partial<CampaignFormValues>) => {
    for (const [key, value] of Object.entries(patch)) form.setFieldValue(key as keyof CampaignFormValues, value as never);
    setSubmitError(null);
  };

  async function persist() {
    const draft = toDraftRequest(values);
    if (savedId.current) {
      await update.mutateAsync({ id: savedId.current, draft });
      return savedId.current;
    }
    const created = await create.mutateAsync(draft);
    savedId.current = created.id ?? undefined;
    return created.id ?? "";
  }

  async function saveDraft() {
    try {
      const id = await persist();
      toast.success(campaignId ? "Đã lưu thay đổi" : "Đã lưu nháp");
      if (!campaignId) void navigate({ href: notificationComposePath(portalKind, id), replace: true });
    } catch (error) {
      setSubmitError(messageOf(error));
    }
  }

  async function submit() {
    setSubmitting(true);
    try {
      const id = await persist();
      if (values.sendMode === "schedule") {
        await schedule.mutateAsync(id);
        toast.success(`Đã hẹn gửi lúc ${formatDateTimeVi(scheduleIso)}`);
      } else {
        await send.mutateAsync(id);
        toast.success(`Đã gửi thông báo đến ${formatCountVi(total ?? 0)} người`);
      }
      void navigate({ href: notificationsHomePath(portalKind) });
    } catch (error) {
      setSubmitError(messageOf(error));
    } finally {
      setSubmitting(false);
    }
  }

  const count = total ? ` ${formatCountVi(total)} người` : " thông báo";
  const primaryLabel = values.sendMode === "schedule" ? `Hẹn gửi${count}` : `Gửi${count}`;

  return (
    <Box component="form" noValidate onSubmit={(event) => { event.preventDefault(); setAttempted(true); if (canSend) void submit(); }}>
      <Stack sx={{ gap: 3, pb: 2 }}>
        <CampaignAudienceSection
          draft={values.audience}
          estimate={{ breakdown: estimate.data, error: estimate.error, loading: estimate.isFetching }}
          kind={portalKind}
          onChange={(audience) => set({ audience })}
        />
        <CampaignContentFields
          errors={{ body: shown("body"), title: shown("title") }}
          onBlur={(field) => setTouched((prev) => new Set(prev).add(field))}
          onChange={set}
          values={values}
        />
        <CampaignChannelFields onChange={set} pushEnabled={values.pushEnabled} requireReadAck={values.requireReadAck} />
        <CampaignScheduleField
          error={errors.scheduledAt}
          mode={values.sendMode}
          onModeChange={(sendMode) => set({ sendMode, ...(sendMode === "schedule" && !values.scheduledAt ? { scheduledAt: defaultScheduleInput(new Date()) } : {}) })}
          onScheduledAtChange={(scheduledAt) => set({ scheduledAt })}
          scheduledAt={values.scheduledAt}
        />
        {submitError ? <Alert severity="error">{submitError}</Alert> : null}
      </Stack>
      <Box
        sx={{
          bgcolor: "background.paper",
          borderColor: "divider",
          borderTop: 1,
          bottom: 0,
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          justifyContent: { sm: "flex-end" },
          // Phones (< md) have a fixed dock over the bottom of the scroll area: the bar stays in the flow there.
          position: { xs: "static", md: "sticky" },
          py: 1.5,
          zIndex: 1,
        }}
      >
        {blockedReason ? (
          <Typography color="text.secondary" id="campaign-blocked-reason" role="status" sx={{ flexBasis: "100%", textAlign: { sm: "right" } }} variant="caption">
            {blockedReason}
          </Typography>
        ) : null}
        <ErgButton disabled={!canSave} onClick={() => void saveDraft()} variant="outlined">Lưu nháp</ErgButton>
        <ErgButton aria-describedby={blockedReason ? "campaign-blocked-reason" : undefined} disabled={!canSend} loading={submitting} sx={{ flex: { xs: 1, sm: "none" } }} type="submit" variant="contained">
          {primaryLabel}
        </ErgButton>
      </Box>
    </Box>
  );
}
