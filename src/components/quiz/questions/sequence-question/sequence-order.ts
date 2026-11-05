import type { Announcements, UniqueIdentifier } from "@dnd-kit/core";

export const SEQUENCE_ROW = "sequence-row:";

/** Removes the id at `from` and inserts it at `to` (the learner drops a card onto a row). */
export function moveTo(order: string[], from: number, to: number): string[] {
  const next = [...order];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** Vietnamese live-region text for drags (dnd-kit's defaults read raw ids in English). */
export function sequenceAnnouncements(order: string[], labelOf: (id: string) => string): Announcements {
  const name = (id: UniqueIdentifier) => `“${labelOf(String(id))}”`;
  const row = (id: UniqueIdentifier) => order.indexOf(String(id).replace(SEQUENCE_ROW, "")) + 1;
  return {
    onDragStart: ({ active }) => `Đã nhấc thẻ ${name(active.id)}`,
    onDragOver: ({ active, over }) => `Thẻ ${name(active.id)} ${over ? `đang ở vị trí ${row(over.id)}` : "đang ở ngoài danh sách"}`,
    onDragEnd: ({ active, over }) => (over ? `Đã đặt thẻ ${name(active.id)} vào vị trí ${row(over.id)}` : `Đã thả thẻ ${name(active.id)}, thứ tự giữ nguyên`),
    onDragCancel: ({ active }) => `Đã huỷ, thẻ ${name(active.id)} về chỗ cũ`,
  };
}
