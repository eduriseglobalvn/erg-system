import type { PolicyCommand, PolicyConfig, SiteCommand, SiteConfig } from "../../api/timekeeping-types";
import { parseChains, validateChains, type Chains, type ChainType } from "./chains-model";

export type PolicyNumberKey = "lateToleranceMin" | "lateBlockMin" | "explanationsPerMonth" | "explanationWindowDays" | "annualLeaveDays" | "seniorityStepYears" | "lockDayOfMonth";
/** Ranges mirror TimekeepingConfigService.savePolicy. */
export const POLICY_NUMBERS: ReadonlyArray<{ key: PolicyNumberKey; label: string; unit: string; min: number; max: number }> = [
  { key: "lateToleranceMin", label: "Dung sai đi muộn", unit: "phút", min: 0, max: 60 },
  { key: "lateBlockMin", label: "Block trừ muộn", unit: "phút", min: 1, max: 120 },
  { key: "explanationsPerMonth", label: "Giải trình tối đa mỗi tháng", unit: "lần", min: 0, max: 31 },
  { key: "explanationWindowDays", label: "Hạn gửi giải trình", unit: "ngày", min: 1, max: 31 },
  { key: "annualLeaveDays", label: "Phép năm", unit: "ngày", min: 0, max: 60 },
  { key: "seniorityStepYears", label: "Thêm 1 ngày phép mỗi", unit: "năm thâm niên", min: 1, max: 20 },
  { key: "lockDayOfMonth", label: "Ngày chốt công hằng tháng", unit: "", min: 1, max: 28 },
];

/** Numbers are NaN while their input is empty, so the field can be cleared and shows its error. */
export type PolicyForm = Record<PolicyNumberKey, number> & { requireFace: boolean; allowOutside: boolean; chains: Chains };

export const DEFAULT_POLICY: PolicyForm = {
  lateToleranceMin: 5,
  lateBlockMin: 15,
  explanationsPerMonth: 3,
  explanationWindowDays: 3,
  annualLeaveDays: 12,
  seniorityStepYears: 5,
  lockDayOfMonth: 8,
  requireFace: true,
  allowOutside: false,
  chains: {},
};

export function policyToForm(p?: PolicyConfig): PolicyForm {
  if (!p) return DEFAULT_POLICY;
  const form = { ...DEFAULT_POLICY, requireFace: p.requireFace ?? true, allowOutside: p.allowOutside ?? false, chains: parseChains(p.approvalChains) };
  for (const { key } of POLICY_NUMBERS) form[key] = p[key] ?? DEFAULT_POLICY[key];
  return form;
}

export function formToPolicyCommand(f: PolicyForm): PolicyCommand {
  const { chains, ...rest } = f;
  return { ...rest, approvalChains: chains };
}

export type PolicyErrors = Partial<Record<PolicyNumberKey, string>> & { chains?: Partial<Record<ChainType, string>> };

export function validatePolicy(f: PolicyForm): PolicyErrors {
  const errors: PolicyErrors = {};
  for (const { key, label, min, max } of POLICY_NUMBERS) {
    if (!Number.isInteger(f[key]) || f[key] < min || f[key] > max) errors[key] = `${label} phải từ ${min} đến ${max}`;
  }
  const chains = validateChains(f.chains);
  if (Object.keys(chains).length) errors.chains = chains;
  return errors;
}

export type SiteForm = { name: string; address: string; lat: string; lng: string; radiusM: string };
export type SiteErrors = Partial<Record<keyof SiteForm, string>>;

export const BLANK_SITE: SiteForm = { name: "", address: "", lat: "", lng: "", radiusM: "100" };
export const RADIUS_MIN = 50;
export const RADIUS_MAX = 500;

export const siteToForm = (s?: SiteConfig): SiteForm =>
  s ? { name: s.name ?? "", address: s.address ?? "", lat: String(s.lat ?? ""), lng: String(s.lng ?? ""), radiusM: String(s.radiusM ?? "") } : BLANK_SITE;

const coordinate = (text: string) => (text.trim() === "" ? Number.NaN : Number(text.trim().replace(",", ".")));

export function validateSite(f: SiteForm): SiteErrors {
  const errors: SiteErrors = {};
  const lat = coordinate(f.lat);
  const lng = coordinate(f.lng);
  const radius = Number(f.radiusM);
  if (!f.name.trim()) errors.name = "Nhập tên địa điểm";
  if (!(lat >= -90 && lat <= 90)) errors.lat = "Vĩ độ không hợp lệ";
  if (!(lng >= -180 && lng <= 180)) errors.lng = "Kinh độ không hợp lệ";
  if (f.radiusM.trim() === "" || !Number.isInteger(radius) || radius < RADIUS_MIN || radius > RADIUS_MAX) errors.radiusM = "Bán kính từ 50 đến 500 m";
  return errors;
}

export const formToSiteCommand = (f: SiteForm, schoolId: string): SiteCommand => ({
  schoolId,
  name: f.name.trim(),
  address: f.address.trim() || undefined,
  lat: coordinate(f.lat),
  lng: coordinate(f.lng),
  radiusM: Number(f.radiusM),
  active: true,
});

/** Compared instead of the raw text so "21.0" and "21" (or trailing spaces) after a save do not count as a change. */
export const siteSignature = (f: SiteForm) => JSON.stringify([f.name.trim(), f.address.trim(), coordinate(f.lat), coordinate(f.lng), Number(f.radiusM)]);

export const mapsUrl = (f: SiteForm) => `https://www.google.com/maps?q=${coordinate(f.lat)},${coordinate(f.lng)}`;
