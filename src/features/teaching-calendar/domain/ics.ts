/** Xuat lich day ra .ics (RFC 5545), sinh o client. Gio theo TZID Asia/Ho_Chi_Minh (UTC+7, khong doi gio mua he). */

export type IcsEvent = { date: string; description?: string; endTime: string; id: string; location?: string; startTime: string; summary: string };

const TZID = "Asia/Ho_Chi_Minh";

const escapeText = (value: string) => value.replaceAll("\\", "\\\\").replaceAll(";", "\\;").replaceAll(",", "\\,").replace(/\r?\n/g, "\\n");

/** Gap dong dai hon 75 byte (RFC 5545 3.1): dong tiep theo bat dau bang mot dau cach. */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  for (const char of line) {
    const limit = parts.length === 0 ? 75 : 74;
    if (encoder.encode(current + char).length > limit) { parts.push(current); current = char; } else current += char;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

const local = (date: string, time: string) => `${date.replaceAll("-", "")}T${time.replace(":", "")}00`;
const utcStamp = (now: Date) => now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

export function buildIcs(events: readonly IcsEvent[], now: Date = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ERG//Lich day//VI", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VTIMEZONE", `TZID:${TZID}`, "BEGIN:STANDARD", "DTSTART:19700101T000000", "TZOFFSETFROM:+0700", "TZOFFSETTO:+0700", "TZNAME:ICT", "END:STANDARD", "END:VTIMEZONE",
    ...events.flatMap((event) => [
      "BEGIN:VEVENT",
      `UID:${event.id}@erg.edu.vn`,
      `DTSTAMP:${utcStamp(now)}`,
      `DTSTART;TZID=${TZID}:${local(event.date, event.startTime)}`,
      `DTEND;TZID=${TZID}:${local(event.date, event.endTime)}`,
      `SUMMARY:${escapeText(event.summary)}`,
      ...(event.location ? [`LOCATION:${escapeText(event.location)}`] : []),
      ...(event.description ? [`DESCRIPTION:${escapeText(event.description)}`] : []),
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}

/** `lich-day-15-11-2026.ics` */
export function icsFileName(todayDdMmYyyy: string): string {
  return `lich-day-${todayDdMmYyyy.replaceAll("/", "-")}.ics`;
}
