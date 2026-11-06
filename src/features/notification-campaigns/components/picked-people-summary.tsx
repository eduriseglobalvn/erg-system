import CancelIcon from "@mui/icons-material/Cancel";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";

import { ErgButton } from "@/components/erg-mui";

import type { AudienceDraft } from "../model/audience-draft";
import { removePicked } from "../model/audience-draft";

const MAX_CHIPS = 2;

type Props = { draft: AudienceDraft; onChange: (draft: AudienceDraft) => void; onOpenSheet: () => void };

/** Picked people: at most 2 chips, the rest as "+N người" which opens the recipients sheet. */
export function PickedPeopleSummary({ draft, onChange, onOpenSheet }: Props) {
  const { errors, picked } = draft;
  if (picked.length === 0 && errors.length === 0) return null;
  return (
    <Stack direction="row" sx={{ alignItems: "center", flexWrap: "wrap", gap: 1 }}>
      {picked.slice(0, MAX_CHIPS).map((card) => (
        <Chip
          key={card.userId}
          label={card.displayName}
          onDelete={() => onChange(removePicked(draft, card.userId ?? ""))}
          deleteIcon={<CancelIcon aria-label={`Bỏ ${card.displayName}`} role="button" />}
        />
      ))}
      {picked.length > MAX_CHIPS ? <Chip clickable label={`+${picked.length - MAX_CHIPS} người`} onClick={onOpenSheet} /> : null}
      {errors.length > 0 ? <Chip clickable color="error" label={`${errors.length} dòng lỗi`} onClick={onOpenSheet} variant="outlined" /> : null}
      <ErgButton onClick={onOpenSheet} size="small" variant="text">Xem danh sách</ErgButton>
    </Stack>
  );
}
