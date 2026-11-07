import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgErrorState, ErgSkeleton, ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { useDeleteRemoteRule, useRemoteRules } from "../../api/timekeeping-config-query";
import type { RemoteRuleConfig } from "../../api/timekeeping-types";
import { DeleteConfirm } from "./delete-confirm";
import { KIND_LABEL, RemoteRuleDialog } from "./remote-rule-dialog";
import { WEEKDAYS } from "./shift-model";

const BEHAVIOUR = "Vẫn cần khuôn mặt · Không lưu vị trí · Gắn nhãn \"Từ xa\"";

function ruleText(rule: RemoteRuleConfig): string {
  if (rule.kind === "USERS") return `${rule.userIds?.length ?? 0} nhân sự`;
  if (rule.kind === "WEEKDAY") return WEEKDAYS.find((d) => d.value === rule.weekday)?.label ?? "";
  return "";
}

/** Who may punch remotely. Each rule is saved on its own (dialog), not with the page's "Lưu thay đổi". */
export function RemoteWorkPanel({ schoolId }: { schoolId: string }) {
  const rules = useRemoteRules(schoolId);
  const remove = useDeleteRemoteRule();
  const [editing, setEditing] = useState<{ rule?: RemoteRuleConfig } | null>(null);
  const [deleting, setDeleting] = useState<RemoteRuleConfig | null>(null);
  const items = rules.data ?? [];

  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
        <Typography component="h3" variant="subtitle2">Chấm công từ xa</Typography>
        <ErgButton onClick={() => setEditing({})} startIcon={<AddIcon />} variant="outlined">Thêm quy tắc</ErgButton>
      </Box>
      {rules.isError ? (
        <ErgErrorState action={<ErgButton onClick={() => void rules.refetch()} variant="outlined">Tải lại</ErgButton>} description="Không tải được quy tắc chấm công từ xa." title="Có lỗi xảy ra" />
      ) : rules.isPending ? (
        <ErgSkeleton height={96} />
      ) : items.length === 0 ? (
        <ErgEmptyState description="Chưa có quy tắc nào: mọi người chấm công tại địa điểm." title="Chưa có quy tắc chấm công từ xa" />
      ) : (
        <Box component="ul" sx={{ border: 1, borderColor: "divider", borderRadius: 2, listStyle: "none", m: 0, p: 0 }}>
          {items.map((rule) => (
            <Box component="li" key={rule.id} sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-between", p: 1.5, "&:last-child": { borderBottom: 0 } }}>
              <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1 }}>
                <Typography variant="body2">{rule.kind ? KIND_LABEL[rule.kind] : ""}</Typography>
                {ruleText(rule) ? <ErgStatusChip dot={false} label={ruleText(rule)} /> : null}
                {rule.active === false ? <ErgStatusChip dot={false} label="Đã tắt" tone="warning" /> : null}
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <ErgButton onClick={() => setEditing({ rule })} variant="text">Sửa</ErgButton>
                <ErgButton color="error" onClick={() => setDeleting(rule)} variant="text">Xoá</ErgButton>
              </Box>
            </Box>
          ))}
        </Box>
      )}
      <Typography color="text.secondary" variant="body2">{`Khi chấm từ xa: ${BEHAVIOUR}`}</Typography>
      {editing ? <RemoteRuleDialog onClose={() => setEditing(null)} rule={editing.rule} schoolId={schoolId} /> : null}
      {deleting?.id ? (
        <DeleteConfirm description="Nhân sự thuộc quy tắc này sẽ phải chấm công tại địa điểm." id={deleting.id} mutation={remove} onClose={() => { remove.reset(); setDeleting(null); }} title="Xoá quy tắc chấm công từ xa?" />
      ) : null}
    </Box>
  );
}
