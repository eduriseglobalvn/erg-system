import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import type { AudienceBreakdown } from "../api/campaign-types";
import { type AudienceDraft, allowedScopes } from "../model/audience-draft";
import type { ComposePortalKind } from "../model/campaign-paths";
import { AudienceEstimateView } from "./audience-estimate-line";
import { AudienceScopeChips } from "./audience-scope-chips";
import { AudienceScopeSelectors } from "./audience-scope-selectors";
import { PeoplePicker } from "./people-picker";
import { PickedPeopleSummary } from "./picked-people-summary";
import { RecipientsSheet } from "./recipients-sheet";

type Props = {
  draft: AudienceDraft;
  estimate: { breakdown?: AudienceBreakdown; error?: unknown; loading?: boolean };
  kind: ComposePortalKind;
  onChange: (draft: AudienceDraft) => void;
};

/** "Gửi đến": scope, its selection, people picked one by one, and the live estimate. */
export function CampaignAudienceSection({ draft, estimate, kind, onChange }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  return (
    <Stack component="section" aria-labelledby="campaign-audience-title" sx={{ gap: 1.5 }}>
      <Typography component="h2" id="campaign-audience-title" variant="subtitle2">Gửi đến</Typography>
      <AudienceScopeChips allowed={allowedScopes(kind === "admin")} onChange={(scope) => onChange({ ...draft, scope })} value={draft.scope} />
      <AudienceScopeSelectors draft={draft} kind={kind} onChange={onChange} />
      {draft.scope === "TENANT" ? null : (
        <>
          <Typography component="h3" variant="subtitle2">Thêm từng người</Typography>
          <PeoplePicker draft={draft} onChange={onChange} />
          <PickedPeopleSummary draft={draft} onChange={onChange} onOpenSheet={() => setSheetOpen(true)} />
        </>
      )}
      <AudienceEstimateView breakdown={estimate.breakdown} error={estimate.error} loading={estimate.loading} />
      {kind === "teacher" ? (
        <Alert role="note" severity="info" variant="outlined">
          Giáo viên dùng cùng màn này nhưng chỉ chọn được lớp mình dạy (và học sinh của các lớp đó).
        </Alert>
      ) : null}
      <RecipientsSheet draft={draft} onChange={onChange} onClose={() => setSheetOpen(false)} open={sheetOpen} />
    </Stack>
  );
}
