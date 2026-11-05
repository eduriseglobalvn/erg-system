/** Moves the choice `fromId` to where `toId` is; returns the input when either is missing or equal. */
export function moveChoice<T extends { id: string }>(items: T[], fromId: string, toId: string): T[] {
  const from = items.findIndex((c) => c.id === fromId);
  const to = items.findIndex((c) => c.id === toId);
  if (from < 0 || to < 0 || from === to) return items;
  const next = [...items];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}
