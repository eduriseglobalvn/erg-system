import { formatDateTimeVi } from "@/lib/format-date";

/** dd/MM HH:mm; "" when the value is empty or unparsable (never "Invalid Date"). */
export function formatShortDateTimeVi(value: string | number | Date | null | undefined): string {
  return formatDateTimeVi(value).replace(/\/\d{4}/, "");
}
