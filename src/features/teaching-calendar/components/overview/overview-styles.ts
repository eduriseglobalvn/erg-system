import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

/** Gia tri boards 6.6 / 6.7 (AdminOverview, AdminOverviewTeacher) quy ve token: mot cho de dung chung cho cac file bang tong. */
export const ink = ergEnterpriseTokens.color;
export const tone = ergEnterpriseTokens.schedule;

/** Chu board co co chu va do dam ro rang (11, 12, 13, 10...) — mot cho de khong rai cung gia tri khap file. */
export const type = (fontSize: number, fontWeight = 400) => ({ fontSize, fontWeight });

export const weight = (value: number) => ({ fontWeight: value });

export const stripes = (size: number, a: string, b: string) => `repeating-linear-gradient(135deg, ${a} 0 ${size}px, ${b} ${size}px ${size * 2}px)`;

export const SCHOOL_COLUMNS = "188px repeat(6, minmax(0, 1fr))";
export const TEACHER_COLUMNS = "208px 116px repeat(6, minmax(0, 1fr))";
