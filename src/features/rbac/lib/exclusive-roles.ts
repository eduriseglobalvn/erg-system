/**
 * Applies the "exclusive roles stand alone" rule to a multi-select change.
 * The role just added wins: an exclusive one clears the rest, any other one drops the exclusive ones.
 */
export function applyRoleSelection(previous: string[], next: string[], isExclusive: (value: string) => boolean): string[] {
  const added = next.find((value) => !previous.includes(value));
  if (!added) return next;
  return isExclusive(added) ? [added] : next.filter((value) => !isExclusive(value));
}

/** Value sent to the user API: the role name (`code`) when the backend gives it, else the id. */
export const assignableRoleValue = (role: { id: string; code?: string }) => role.code ?? role.id;
