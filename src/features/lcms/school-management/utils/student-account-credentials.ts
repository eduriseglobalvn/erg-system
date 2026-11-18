export type StudentLogin = { username: string; password: string };

export type CredentialRow = {
  code: string;
  fullName: string;
  className: string;
  username: string;
  password: string;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function randomBelow(max: number) {
  const buffer = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buffer);
  return buffer[0]! % max;
}

/** "THCS Trương Công Định" gives "thcstcd": an all-caps word is kept whole, any other word gives its first letter. */
export function schoolLoginPrefix(schoolName: string) {
  return schoolName
    .trim()
    .split(/\s+/)
    .filter((word) => slugify(word) && word.toLowerCase().normalize("NFC") !== "trường") // not the surname "Trương"
    .map((word) => {
      const slug = slugify(word).replace(/ /g, "");
      return word === word.toUpperCase() && word !== word.toLowerCase() ? slug : slug.charAt(0);
    })
    .join("");
}

/**
 * One login per row, in row order: `<school>.<full name><4 digits>` (e.g. "thcstcd.nguyenvana0123"); the digits are
 * random and never repeat for the same name in the batch. The password is the username itself (owner decision
 * 17/11/2026). A row whose name is empty gets no login.
 * shortcut: uniqueness is only checked inside the batch; the backend numbers a login already taken elsewhere.
 */
export function buildStudentLogins(
  rows: Array<{ fullName: string }>,
  schoolName: string,
  random: (max: number) => number = randomBelow,
): Array<StudentLogin | null> {
  const prefix = schoolLoginPrefix(schoolName);
  const used = new Set<string>();
  return rows.map((row) => {
    const name = slugify(row.fullName).replace(/ /g, "");
    if (!name) return null;
    let digits = random(10_000);
    while (used.has(`${name}${digits}`)) digits = (digits + 1) % 10_000;
    used.add(`${name}${digits}`);
    const username = `${prefix ? `${prefix}.` : ""}${name}${String(digits).padStart(4, "0")}`;
    return { username, password: username };
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
