import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useMemo, useState } from "react";

import { ErgButton, ErgDialog } from "@/components/erg-mui";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

import { type AudienceDraft, groupKeyOf, removePicked, removePickedGroup } from "../model/audience-draft";
import { RecipientFilterChips, type RecipientFilter } from "./recipient-filter-chips";
import { RecipientGroupList } from "./recipient-group-list";

type Props = {
  draft: AudienceDraft;
  onChange: (draft: AudienceDraft) => void;
  onClose: () => void;
  open: boolean;
};

/** N17: everyone picked one by one, grouped by class, plus the pasted lines that failed. Full screen on phones. */
export function RecipientsSheet({ draft, onChange, onClose, open }: Props) {
  const phone = useMediaQuery(useTheme().breakpoints.down("sm"));
  const [filter, setFilter] = useState<RecipientFilter>("ALL");
  const errorCount = draft.errors.length;
  // The error chip vanishes once the lines are dropped; reset so a later error does not reopen that view.
  if (filter === "ERRORS" && errorCount === 0) setFilter("ALL");
  const active = filter;

  const groups = useMemo(() => {
    const byKey = new Map<string, AudienceDraft["picked"]>();
    for (const card of draft.picked) {
      if (active !== "ALL" && card.role !== active) continue;
      const key = groupKeyOf(card);
      const bucket = byKey.get(key);
      if (bucket) bucket.push(card);
      else byKey.set(key, [card]);
    }
    return [...byKey].map(([key, cards]) => ({ key, cards, isClass: cards[0]?.role === "STUDENT" }));
  }, [draft.picked, active]);

  return (
    <ErgDialog
      actions={
        <>
          <ErgButton color="error" disabled={!draft.picked.length && !errorCount} onClick={() => onChange({ ...draft, picked: [], errors: [] })} variant="text">Bỏ tất cả</ErgButton>
          <ErgButton onClick={onClose} sx={{ flex: { xs: 1, sm: "none" } }} variant="contained">{`Xong · ${draft.picked.length} người`}</ErgButton>
        </>
      }
      fullScreen={phone}
      onClose={onClose}
      open={open}
      title={`${draft.picked.length} người chọn riêng`}
    >
      <Stack spacing={2}>
        <RecipientFilterChips active={active} errorCount={errorCount} onChange={setFilter} picked={draft.picked} />
        <Typography color="text.secondary" variant="body2">
          Chỉ tính người có tài khoản; người trùng chỉ nhận một lần.
        </Typography>
        {active === "ALL" || active === "ERRORS" ? (
          <ErrorLines errors={draft.errors} onClear={() => onChange({ ...draft, errors: [] })} />
        ) : null}
        {active === "ERRORS" ? null : (
          <RecipientGroupList
            groups={groups}
            onRemove={(userId) => onChange(removePicked(draft, userId))}
            onRemoveGroup={(key) => onChange(removePickedGroup(draft, key))}
          />
        )}
      </Stack>
    </ErgDialog>
  );
}

function ErrorLines({ errors, onClear }: { errors: string[]; onClear: () => void }) {
  if (errors.length === 0) return null;
  return (
    <Stack
      aria-label="Dòng không khớp"
      component="section"
      role="region"
      spacing={0.5}
      sx={{ border: 1, borderColor: "error.main", borderRadius: `${t.radius.card}px`, bgcolor: t.statusTint.error.bg, px: 1.75, py: 1.5 }}
    >
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography color="error" variant="subtitle2">{`${errors.length} dòng không khớp ai hoặc khớp nhiều người`}</Typography>
        <ErgButton color="error" onClick={onClear} size="small" variant="text">{`Bỏ ${errors.length} dòng`}</ErgButton>
      </Stack>
      <Stack component="ul" sx={{ m: 0, pl: 2.5 }}>
        {errors.map((line) => (
          <Typography component="li" key={line} variant="body2">{line}</Typography>
        ))}
      </Stack>
    </Stack>
  );
}
