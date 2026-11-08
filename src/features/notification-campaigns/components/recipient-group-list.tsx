import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useId, useState } from "react";

import { ErgButton, ErgIconButton } from "@/components/erg-mui";

import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

import type { RecipientCard } from "../api/campaign-types";

const FIRST_PAGE = 5;
const MORE_STEP = 100;

const initials = (name = "") => name.trim().split(/\s+/).slice(-2).map((word) => word.charAt(0)).join("").toUpperCase();

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
        <Typography color="text.secondary" id={titleId} sx={{ textTransform: "uppercase" }} variant="caption">{`${group.isClass ? "Theo lớp" : "Nhóm"} · ${group.key} (${group.cards.length})`}</Typography>
        <ErgButton color="error" onClick={() => onRemoveGroup(group.key)} size="small" variant="text">
          {group.isClass ? "Bỏ cả lớp" : "Bỏ cả nhóm"}
        </ErgButton>
      </Stack>
      <Stack component="ul" sx={{ listStyle: "none", m: 0, p: 0, border: 1, borderColor: "divider", borderRadius: `${t.radius.card}px`, bgcolor: "background.paper", overflow: "hidden" }}>
        {group.cards.slice(0, shown).map((card, index) => (
          <Stack component="li" direction="row" key={card.userId} sx={{ alignItems: "center", gap: 1.5, minHeight: 56, px: 2, py: 0.75, borderTop: index ? 1 : 0, borderColor: "divider" }}>
            <Avatar aria-hidden sx={{ width: 28, height: 28, bgcolor: t.color.primarySofter, color: t.statusTint.info.color, typography: "caption", fontWeight: "fontWeightBold" }}>{initials(card.displayName)}</Avatar>
            <Stack sx={{ flex: 1, minWidth: 0 }}>
              <Typography noWrap variant="subtitle2">{card.displayName}</Typography>
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
