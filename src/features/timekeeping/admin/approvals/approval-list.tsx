import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";

import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { formatDateTimeVi } from "@/domain/formatters/format-date";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import type { ApprovalItem } from "../../api/timekeeping-types";
import { requestTimeText, requestTitle, STATUS_CHIP } from "../../components/requests/request-model";
import { stepPosition } from "./approval-model";

type ApprovalListProps = {
  items: readonly ApprovalItem[];
  selectedId?: string;
  /** Ids ticked for bulk approve; `undefined` hides the checkboxes (tabs other than "Chờ tôi duyệt"). */
  checked?: ReadonlySet<string>;
  onOpen: (id: string) => void;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
};

export const approvalRowId = (id: string) => `approval-row-${id}`;

/** Rows are buttons (Enter / Space opens the request) with a labelled checkbox beside each; Tab walks them in order. */
export function ApprovalList({ checked, items, onOpen, onToggle, onToggleAll, selectedId }: ApprovalListProps) {
  const allChecked = checked !== undefined && items.length > 0 && items.every((i) => checked.has(i.request?.id as string));
  return (
    <Box>
      {checked && items.length > 0 ? (
        <FormControlLabel
          control={<Checkbox checked={allChecked} indeterminate={!allChecked && checked.size > 0} onChange={onToggleAll} size="small" />}
          label={`Chọn tất cả ${items.length} đơn`}
          sx={{ ml: 0, px: 1.5, py: 0.5 }}
        />
      ) : null}
      <Box aria-label="Danh sách đơn" component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
        {items.map((item) => {
          const request = item.request ?? {};
          const id = request.id as string;
          const position = stepPosition(request);
          const status = request.status && request.status !== "PENDING" ? STATUS_CHIP[request.status] : undefined;
          const selected = id === selectedId;
          return (
            <Box
              component="li"
              key={id}
              sx={{ alignItems: "flex-start", bgcolor: selected ? ergEnterpriseTokens.statusTint.info.bg : undefined, borderTop: 1, borderColor: "divider", display: "flex" }}
            >
              {checked ? (
                <Checkbox checked={checked.has(id)} onChange={() => onToggle(id)} slotProps={{ input: { "aria-label": `Chọn đơn ${request.code ?? id}` } }} size="small" sx={{ mt: 0.5 }} />
              ) : null}
              <ButtonBase
                aria-current={selected ? "true" : undefined}
                id={approvalRowId(id)}
                onClick={() => onOpen(id)}
                sx={{ alignItems: "flex-start", display: "block", flex: 1, minWidth: 0, p: 1.5, pl: checked ? 0.5 : 1.5, textAlign: "left" }}
              >
                <Box sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between" }}>
                  <Typography noWrap variant="subtitle2">{item.requesterName ?? "—"}</Typography>
                  {item.overdue ? <ErgStatusChip label="Quá hạn" tone="error" /> : status ? <ErgStatusChip label={status.label} tone={status.tone} /> : null}
                </Box>
                <Typography noWrap variant="body2">{requestTitle(request)} · {requestTimeText(request)}</Typography>
                <Typography color="text.secondary" component="div" noWrap variant="caption">
                  {[request.code, position?.label, request.submittedAt ? `Gửi ${formatDateTimeVi(request.submittedAt)}` : ""].filter(Boolean).join(" · ")}
                </Typography>
              </ButtonBase>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
