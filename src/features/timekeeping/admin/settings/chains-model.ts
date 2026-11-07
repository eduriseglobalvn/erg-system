export type ChainType = "LEAVE" | "EXPLANATION" | "WFH" | "BUSINESS";
export type Tier = { minDays: number; steps: string[] };
/** Only the types an admin customised; the others use the server defaults below. */
export type Chains = Partial<Record<ChainType, Tier[]>>;

export const MANAGER = "MANAGER";
export const VICE_PRINCIPAL = "SCHOOL_ROLE:VICE_PRINCIPAL";
export const STEP_OPTIONS = [
  { value: MANAGER, label: "Quản lý trực tiếp" },
  { value: VICE_PRINCIPAL, label: "Phó hiệu trưởng" },
] as const;

export const CHAIN_TYPES: ReadonlyArray<{ type: ChainType; label: string }> = [
  { type: "LEAVE", label: "Nghỉ phép" },
  { type: "EXPLANATION", label: "Giải trình chấm công" },
  { type: "WFH", label: "Làm việc tại nhà" },
  { type: "BUSINESS", label: "Công tác" },
];

/** Same defaults as the backend ApprovalChainResolver when a policy has no chain for the type. */
export const DEFAULT_CHAINS: Record<ChainType, Tier[]> = {
  LEAVE: [
    { minDays: 0, steps: [MANAGER] },
    { minDays: 1, steps: [MANAGER, VICE_PRINCIPAL] },
  ],
  EXPLANATION: [{ minDays: 0, steps: [MANAGER] }],
  WFH: [{ minDays: 0, steps: [MANAGER] }],
  BUSINESS: [{ minDays: 0, steps: [MANAGER, VICE_PRINCIPAL] }],
};

export const stepLabel = (step: string) => STEP_OPTIONS.find((option) => option.value === step)?.label ?? step.replace(/^SCHOOL_ROLE:/, "");

/** "Dưới 1 ngày: Quản lý trực tiếp · Từ 1 ngày: Quản lý trực tiếp → Phó hiệu trưởng"; a single tier needs no day prefix. */
export function chainText(tiers: readonly Tier[]): string {
  const steps = (tier: Tier) => tier.steps.map(stepLabel).join(" → ");
  if (tiers.length === 1) return steps(tiers[0]);
  return tiers
    .map((tier, i) => `${i === 0 && tier.minDays === 0 ? `Dưới ${tiers[1].minDays} ngày` : `Từ ${tier.minDays} ngày`}: ${steps(tier)}`)
    .join(" · ");
}

/** The policy JSON is `unknown` on the wire: keep only well-formed tiers of known types. */
export function parseChains(raw: unknown): Chains {
  const out: Chains = {};
  if (!raw || typeof raw !== "object") return out;
  for (const { type } of CHAIN_TYPES) {
    const list = (raw as Record<string, unknown>)[type];
    if (!Array.isArray(list)) continue;
    const tiers = list.flatMap((entry): Tier[] => {
      const e = entry as { minDays?: unknown; steps?: unknown } | null;
      if (!e || !Array.isArray(e.steps)) return [];
      return [{ minDays: typeof e.minDays === "number" ? e.minDays : 0, steps: e.steps.filter((s): s is string => typeof s === "string") }];
    });
    if (tiers.length) out[type] = tiers;
  }
  return out;
}

/** An error text per type: tiers ascend without repeats, whole non-negative days, at least one step each. */
export function validateChains(chains: Chains): Partial<Record<ChainType, string>> {
  const errors: Partial<Record<ChainType, string>> = {};
  for (const { type } of CHAIN_TYPES) {
    const tiers = chains[type];
    if (!tiers) continue;
    if (tiers.some((tier) => !Number.isInteger(tier.minDays) || tier.minDays < 0)) errors[type] = "Số ngày phải là số nguyên từ 0 trở lên";
    else if (tiers.some((tier, i) => i > 0 && tier.minDays <= tiers[i - 1].minDays)) errors[type] = "Số ngày của các mức phải tăng dần và không trùng nhau";
    else if (tiers.some((tier) => tier.steps.length === 0)) errors[type] = "Mỗi mức cần ít nhất một bước duyệt";
  }
  return errors;
}
