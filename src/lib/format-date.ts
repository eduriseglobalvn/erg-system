const pad = (n: number) => String(n).padStart(2, "0");

/** dd/MM/yyyy (vi-VN) from a Date, ISO string or timestamp; "" when unparsable (never "Invalid Date"). */
export function formatDateVi(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  // Date-only ISO is parsed as local so GMT+7 does not shift the day.
  const iso = typeof value === "string" ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
  const date = iso ? new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])) : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** dd/MM/yyyy -> yyyy-MM-dd for <input type="date">; "" when not a valid dd/MM/yyyy. */
export function viDateToInput(value: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
}

/** yyyy-MM-dd (from <input type="date">) -> dd/MM/yyyy; "" when invalid. */
export function inputDateToVi(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}
