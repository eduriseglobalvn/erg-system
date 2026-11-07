import { useBlocker } from "@tanstack/react-router";
import { useForm, useStore } from "@tanstack/react-form";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useMemo, useState, type ReactNode } from "react";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import { formatDateVi } from "@/domain/formatters/format-date";
import type { PolicyVersions, SiteConfig } from "../../api/timekeeping-types";
import { ApprovalChainsPanel } from "./approval-chains-panel";
import { HolidaysPanel } from "./holidays-panel";
import { LocationsTab } from "./locations-tab";
import { PolicyPanel } from "./policy-panel";
import { policySummaryLines } from "./policy-summary";
import { policyToForm, siteSignature, siteToForm, validatePolicy, validateSite, type PolicyForm, type SiteForm } from "./settings-model";
import { ShiftsPanel } from "./shifts-panel";
import { useSettingsSave } from "./use-settings-save";

const TABS = ["Địa điểm & phương thức", "Ca làm việc", "Chính sách công", "Loại đơn & quy trình duyệt", "Ngày lễ"];
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

type SettingsFormProps = {
  schoolId: string;
  schoolName: string;
  versions: PolicyVersions;
  sites: readonly SiteConfig[];
  /** Id of the site being edited, undefined for "Thêm" (a new one). Kept by the page so it survives reloads. */
  selectedId: string | undefined;
  onSelect: (id: string | undefined) => void;
  schoolFilter: ReactNode;
};

/**
 * A04 body. One form holds the selected site and the policy; the header "Lưu thay đổi" / "Huỷ" act on it
 * (disabled while nothing changed). Shifts, holidays and remote rules save themselves in their own dialogs.
 */
export function SettingsForm({ onSelect, schoolFilter, schoolId, schoolName, selectedId, sites, versions }: SettingsFormProps) {
  const { current, next: scheduled } = versions;
  const baseline = useMemo(() => ({ policy: policyToForm(scheduled ?? current), site: siteToForm(sites.find((s) => s.id === selectedId)) }), [current, scheduled, selectedId, sites]);
  const form = useForm({ defaultValues: baseline });
  const values = useStore(form.store, (state) => state.values);
  const [tab, setTab] = useState(0);
  const save = useSettingsSave((id) => onSelect(id));

  const siteDirty = siteSignature(values.site) !== siteSignature(baseline.site);
  const policyDirty = !same(values.policy, baseline.policy);
  const dirty = siteDirty || policyDirty;
  const policyErrors = validatePolicy(values.policy);
  const invalid = Object.keys(policyErrors).length > 0 || (siteDirty && Object.keys(validateSite(values.site)).length > 0);

  const blocker = useBlocker({ shouldBlockFn: () => dirty, enableBeforeUnload: () => dirty, withResolver: true });
  const setPolicy = (patch: Partial<PolicyForm>) => form.setFieldValue("policy", { ...values.policy, ...patch });
  const setSite = (patch: Partial<SiteForm>) => form.setFieldValue("site", { ...values.site, ...patch });
  const pick = (id: string | undefined, list: readonly SiteConfig[] = sites) => {
    onSelect(id);
    form.setFieldValue("site", siteToForm(list.find((s) => s.id === id)));
  };
  const effectiveFrom = scheduled?.effectiveFrom ?? save.effectiveFrom;

  return (
    <Box sx={{ display: "grid", gap: 2, px: { xs: 2, sm: 3 }, py: 2 }}>
      <ErgPageHeader
        description="Áp dụng theo cơ sở · thay đổi có hiệu lực từ kỳ công tiếp theo"
        primaryAction={
          <>
            <ErgButton disabled={!dirty || save.pending} onClick={() => form.reset(baseline)} variant="outlined">Huỷ</ErgButton>
            <ErgButton
              disabled={!dirty || invalid}
              loading={save.pending}
              onClick={() => void save.run({ schoolId, site: siteDirty ? { id: selectedId, form: values.site } : undefined, policy: policyDirty ? values.policy : undefined })}
              variant="contained"
            >
              Lưu thay đổi
            </ErgButton>
          </>
        }
        title="Cấu hình chấm công"
      />
      <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1.5 }}>
        {schoolFilter}
        {effectiveFrom ? <Typography color="text.secondary" variant="body2">{`Chính sách mới có hiệu lực từ ${formatDateVi(effectiveFrom)}`}</Typography> : null}
      </Box>
      {save.error ? <Alert severity="error">{save.error}</Alert> : null}
      {invalid && dirty ? <Alert severity="warning">Còn trường chưa hợp lệ, kiểm tra các tab cấu hình.</Alert> : null}
      <Tabs aria-label="Cấu hình chấm công" onChange={(_, next: number) => setTab(next)} value={tab} variant="scrollable">
        {TABS.map((label, index) => <Tab id={`tk-settings-tab-${index}`} key={label} label={label} />)}
      </Tabs>
      <Box aria-labelledby={`tk-settings-tab-${tab}`} role="tabpanel">
        {tab === 0 ? (
          <LocationsTab
            allowOutside={values.policy.allowOutside}
            onDeleted={(id) => { const rest = sites.filter((s) => s.id !== id); pick(rest[0]?.id, rest); }}
            onMethodsChange={setPolicy}
            onSelect={(id) => pick(id)}
            onSiteChange={setSite}
            requireFace={values.policy.requireFace}
            schoolId={schoolId}
            selectedId={selectedId}
            site={values.site}
            siteDirty={siteDirty}
            sites={sites}
          />
        ) : null}
        {tab === 1 ? <ShiftsPanel schoolId={schoolId} /> : null}
        {tab === 2 ? <PolicyPanel errors={policyErrors} onChange={setPolicy} summary={policySummaryLines(policyToForm(current))} value={values.policy} /> : null}
        {tab === 3 ? <ApprovalChainsPanel chains={values.policy.chains} errors={policyErrors.chains} onChange={(chains) => setPolicy({ chains })} /> : null}
        {tab === 4 ? <HolidaysPanel schoolId={schoolId} schoolName={schoolName} /> : null}
      </Box>
      <ErgConfirmDialog
        confirmLabel="Rời trang"
        description="Các thay đổi chưa lưu sẽ bị bỏ."
        destructive
        onCancel={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
        open={blocker.status === "blocked"}
        title="Rời trang khi chưa lưu?"
      />
    </Box>
  );
}
