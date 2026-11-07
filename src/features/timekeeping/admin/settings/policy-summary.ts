import type { PolicyConfig } from "../../api/timekeeping-types";

export type PolicyDto = PolicyConfig;

/** "Tóm tắt chính sách đang áp dụng". No overtime line: overtime is out of scope (D16). */
export function policySummaryLines(p: PolicyDto): string[] {
  return [
    `Dung sai đi muộn ${p.lateToleranceMin} phút`,
    `Muộn > ${p.lateToleranceMin} phút trừ theo block ${p.lateBlockMin} phút`,
    `Giải trình tối đa ${p.explanationsPerMonth} lần/tháng`,
    `Gửi trong ${p.explanationWindowDays} ngày kể từ ngày thiếu`,
    `Phép năm ${p.annualLeaveDays} ngày`,
    `+1 ngày mỗi ${p.seniorityStepYears} năm thâm niên`,
    `Chốt công ngày ${String(p.lockDayOfMonth).padStart(2, "0")} hằng tháng`,
  ];
}
