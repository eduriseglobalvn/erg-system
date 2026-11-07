import { useState } from "react";
import { toast } from "sonner";

import { useSavePolicy, useSaveSite } from "../../api/timekeeping-config-query";
import { requestErrorText } from "../../components/requests/request-model";
import { formToPolicyCommand, formToSiteCommand, type PolicyForm, type SiteForm } from "./settings-model";

type SaveInput = {
  schoolId: string;
  /** Present only when the site part changed; `id` is undefined for a new site. */
  site?: { id?: string; form: SiteForm };
  policy?: PolicyForm;
};

/** The header "Lưu thay đổi": site first, then the policy (which the server schedules for the next period). */
export function useSettingsSave(onSiteSaved: (id: string) => void) {
  const saveSite = useSaveSite();
  const savePolicy = useSavePolicy();
  const [error, setError] = useState<string | null>(null);
  const [effectiveFrom, setEffectiveFrom] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  const run = async ({ policy, schoolId, site }: SaveInput) => {
    setError(null);
    setPending(true);
    let siteSaved = false;
    try {
      if (site) {
        const saved = await saveSite.mutateAsync({ id: site.id, body: formToSiteCommand(site.form, schoolId) });
        siteSaved = true;
        if (saved.id) onSiteSaved(saved.id);
      }
      if (policy) setEffectiveFrom((await savePolicy.mutateAsync({ schoolId, body: formToPolicyCommand(policy) })).effectiveFrom);
      toast.success(site && policy ? "Đã lưu địa điểm và chính sách" : site ? "Đã lưu địa điểm" : "Đã lưu chính sách");
    } catch (failure) {
      const reason = requestErrorText(failure);
      setError(siteSaved ? `Đã lưu địa điểm, chưa lưu được chính sách: ${reason}` : reason);
    } finally {
      setPending(false);
    }
  };
  return { run, pending, error, effectiveFrom };
}
