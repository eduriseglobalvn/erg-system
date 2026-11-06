import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useId, useState } from "react";

import { ErgButton, ErgIconButton } from "@/components/erg-mui";

import type { RecipientCard } from "../api/campaign-types";

const FIRST_PAGE = 5;
const MORE_STEP = 100;

type RecipientGroup = { cards: RecipientCard[]; isClass: boolean; key: string };
type Props = { groups: RecipientGroup[]; onRemove: (userId: string) => void; onRemoveGroup: (key: string) => void };

export function RecipientGroupList({ groups, onRemove, onRemoveGroup }: Props) {
  return (
    <Stack spacing={2}>
      {groups.map((group) => (
        <GroupSection group={group} key={group.key} onRemove={onRemove} onRemoveGroup={onRemoveGroup} />
      ))}
    </Stack>
  );
}

function GroupSection({ group, onRemove, onRemoveGroup }: { group: RecipientGroup; onRemove: Props["onRemove"]; onRemoveGroup: Props["onRemoveGroup"] }) {
  const titleId = useId();
  const [shown, setShown] = useState(FIRST_PAGE);
  const hidden = Math.max(0, group.cards.length - shown);
  return (
    <Stack aria-labelledby={titleId} component="section" role="region" spacing={0.5}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography id={titleId} variant="subtitle2">{`${group.key} · ${group.cards.length} người`}</Typography>
        <ErgButton color="error" onClick={() => onRemoveGroup(group.key)} size="small" variant="text">
          {group.isClass ? "Bỏ cả lớp" : "Bỏ cả nhóm"}
        </ErgButton>
      </Stack>
      <Stack component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
        {group.cards.slice(0, shown).map((card) => (
          <Stack component="li" direction="row" key={card.userId} sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", py: 0.75 }}>
            <Stack sx={{ flex: 1, minWidth: 0 }}>
              <Typography noWrap variant="body2">{card.displayName}</Typography>
              <Typography color="text.secondary" noWrap variant="caption">{card.meta}</Typography>
            </Stack>
            <ErgIconButton label={`Bỏ ${card.displayName}`} onClick={() => onRemove(card.userId ?? "")} size="small">
              <CloseRoundedIcon fontSize="small" />
            </ErgIconButton>
          </Stack>
        ))}
      </Stack>
      {hidden > 0 ? (
        <ErgButton onClick={() => setShown(shown + MORE_STEP)} size="small" sx={{ alignSelf: "flex-start" }} variant="text">
          {`Xem thêm ${Math.min(hidden, MORE_STEP)} người của ${group.key}`}
        </ErgButton>
      ) : null}
    </Stack>
  );
}
