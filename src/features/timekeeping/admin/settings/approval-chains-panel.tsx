import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineRounded";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgTextField } from "@/components/erg-mui/erg-form";
import { CHAIN_TYPES, chainText, DEFAULT_CHAINS, STEP_OPTIONS, type ChainType, type Chains, type Tier } from "./chains-model";

type ApprovalChainsPanelProps = {
  chains: Chains;
  errors?: Partial<Record<ChainType, string>>;
  onChange: (chains: Chains) => void;
};

/** Per request type: a list of tiers "from n days → these steps". No tiers means the default chain of the server. */
export function ApprovalChainsPanel({ chains, errors = {}, onChange }: ApprovalChainsPanelProps) {
  const set = (type: ChainType, tiers: Tier[] | undefined) => {
    const next = { ...chains };
    if (tiers) next[type] = tiers;
    else delete next[type];
    onChange(next);
  };

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      {CHAIN_TYPES.map(({ label, type }) => {
        const tiers = chains[type];
        const update = (index: number, patch: Partial<Tier>) => set(type, (tiers ?? []).map((tier, i) => (i === index ? { ...tier, ...patch } : tier)));
        return (
          <Box key={type} sx={{ border: 1, borderColor: errors[type] ? "error.main" : "divider", borderRadius: 2, p: 2 }}>
            <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-between" }}>
              <Typography component="h3" variant="subtitle2">{label}</Typography>
              {tiers ? (
                <ErgButton onClick={() => set(type, undefined)} variant="text">Dùng mặc định</ErgButton>
              ) : (
                <ErgButton onClick={() => set(type, DEFAULT_CHAINS[type].map((tier) => ({ ...tier, steps: [...tier.steps] })))} variant="outlined">Tuỳ chỉnh</ErgButton>
              )}
            </Box>
            {tiers ? (
              <Box sx={{ display: "grid", gap: 1.5, mt: 1.5 }}>
                {tiers.map((tier, index) => (
                  <Box key={index} sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                    <ErgTextField
                      label={`${label} · mức ${index + 1} · từ (ngày)`}
                      onChange={(event) => update(index, { minDays: event.target.value === "" ? Number.NaN : Number(event.target.value) })}
                      slotProps={{ htmlInput: { min: 0 } }}
                      sx={{ maxWidth: 160 }}
                      type="number"
                      value={Number.isNaN(tier.minDays) ? "" : tier.minDays}
                    />
                    <Box aria-label={`${label} · mức ${index + 1} · bước duyệt`} role="group" sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {STEP_OPTIONS.map((option) => {
                        const on = tier.steps.includes(option.value);
                        return (
                          <Chip
                            aria-checked={on}
                            clickable
                            color={on ? "primary" : "default"}
                            key={option.value}
                            label={option.label}
                            onClick={() => update(index, { steps: STEP_OPTIONS.map((o) => o.value).filter((v) => (v === option.value ? !on : tier.steps.includes(v))) })}
                            role="checkbox"
                            variant={on ? "filled" : "outlined"}
                          />
                        );
                      })}
                    </Box>
                    {tiers.length > 1 ? (
                      <ErgIconButton label={`Xoá mức ${index + 1} của ${label}`} onClick={() => set(type, tiers.filter((_, i) => i !== index))}>
                        <DeleteOutlineIcon />
                      </ErgIconButton>
                    ) : null}
                  </Box>
                ))}
                <Box>
                  <ErgButton onClick={() => set(type, [...tiers, { minDays: (tiers[tiers.length - 1]?.minDays ?? 0) + 1, steps: ["MANAGER"] }])} variant="text">Thêm mức</ErgButton>
                </Box>
              </Box>
            ) : (
              <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">{`Mặc định: ${chainText(DEFAULT_CHAINS[type])}`}</Typography>
            )}
            {errors[type] ? <Typography color="error" role="alert" sx={{ mt: 1 }} variant="caption">{errors[type]}</Typography> : null}
          </Box>
        );
      })}
    </Box>
  );
}
