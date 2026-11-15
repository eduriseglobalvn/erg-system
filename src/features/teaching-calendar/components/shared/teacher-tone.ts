import { scheduleTokens } from "./schedule-cell-sx";

// Do la mau «trung lich», khong dung cho giao vien de khong lan voi o xung dot.
const TONES = Object.entries(scheduleTokens.tones).filter(([key]) => key !== "red").map(([, tone]) => tone);

/** Mau on dinh theo giao vien (hash id), dung chung cho luoi tuan, danh sach loc va popover. */
export function teacherTone(userId?: string | null) {
  if (!userId) return TONES[0];
  let hash = 0;
  for (const char of userId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TONES[hash % TONES.length];
}

type Timed = { endTime: string; startTime: string };

/**
 * Chia cac tiet trong mot o thanh cum: tiet giao nhau nam chung mot cum (xep canh nhau), cum khac nhau xep doc.
 * shortcut: so sanh theo chuoi hh:mm, du cho gio trong ngay.
 */
export function overlapClusters<T extends Timed>(events: readonly T[]): T[][] {
  const sorted = [...events].sort((a, b) => a.startTime.localeCompare(b.startTime) || a.endTime.localeCompare(b.endTime));
  const clusters: T[][] = [];
  let end = "";
  for (const event of sorted) {
    if (clusters.length && event.startTime < end) {
      clusters[clusters.length - 1].push(event);
      if (event.endTime > end) end = event.endTime;
    } else {
      clusters.push([event]);
      end = event.endTime;
    }
  }
  return clusters;
}
