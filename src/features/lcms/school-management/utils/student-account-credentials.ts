export type StudentLogin = { username: string; password: string };

export type CredentialRow = {
  code: string;
  fullName: string;
  className: string;
  username: string;
  password: string;
};

const PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // no look-alikes (0/o, 1/l/i)
const PASSWORD_LENGTH = 8;

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function generatePassword(random: (max: number) => number = randomBelow) {
  return Array.from({ length: PASSWORD_LENGTH }, () => PASSWORD_ALPHABET[random(PASSWORD_ALPHABET.length)]).join("");
}

function randomBelow(max: number) {
  const buffer = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buffer);
  return buffer[0]! % max;
}

/**
 * One login per row, in row order: `<given>.<family>.<class>` (e.g. "anh.nguyen.9a1"), numbered when the same
 * name repeats in the batch. A row whose name or class is empty gets no login.
 * shortcut: uniqueness is only checked inside the batch; the backend rejects a login already taken elsewhere.
 */
export function buildStudentLogins(
  rows: Array<{ fullName: string; className: string }>,
  random?: (max: number) => number,
): Array<StudentLogin | null> {
  const used = new Map<string, number>();
  return rows.map((row) => {
    const words = slugify(row.fullName).split(" ").filter(Boolean);
    const classSlug = slugify(row.className).replace(/ /g, "");
    if (!words.length || !classSlug) return null;
    const base = [words.at(-1), words.length > 1 ? words[0] : undefined, classSlug].filter(Boolean).join(".");
    const count = (used.get(base) ?? 0) + 1;
    used.set(base, count);
    return { username: count === 1 ? base : `${base}${count}`, password: generatePassword(random) };
  });
}

function csvCell(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Excel-friendly (BOM) CSV of the credentials, one row per student. */
export function credentialsCsv(rows: CredentialRow[]) {
  const lines = [["Mã", "Họ và tên", "Lớp", "Tên đăng nhập", "Mật khẩu"], ...rows.map((row) => [row.code, row.fullName, row.className, row.username, row.password])];
  return `﻿${lines.map((line) => line.map(csvCell).join(",")).join("\r\n")}`;
}

/** `username<TAB>password` per line, in import order, so it can be pasted straight into two sheet columns. */
export function credentialsSheetColumns(orderedRows: Array<{ username: string; password: string } | null>) {
  return orderedRows.map((row) => (row ? `${row.username}\t${row.password}` : "\t")).join("\n");
}
