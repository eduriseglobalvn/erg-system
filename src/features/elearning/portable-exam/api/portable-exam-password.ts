/**
 * The teacher's "open password" for an exported .ergquiz. It only keeps students from opening exams they were not
 * handed; it sits outside the signed payload, so anyone who edits the file can remove it.
 */
export async function portableAccessPasswordHash(packageId: string, password: string) {
  const bytes = new TextEncoder().encode(`${packageId}:${password.normalize("NFC").trim()}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return `sha256:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export async function portableAccessPasswordMatches(packageId: string, password: string, expectedHash: string) {
  return (await portableAccessPasswordHash(packageId, password)) === expectedHash;
}

export const PORTABLE_PASSWORD_MIN_LENGTH = 4;

/** Why the teacher cannot export yet, or "" when the password and its confirmation are usable. */
export function portableAccessPasswordProblem(password: string, confirmation: string) {
  if (password.trim().length < PORTABLE_PASSWORD_MIN_LENGTH) return `Mật khẩu cần ít nhất ${PORTABLE_PASSWORD_MIN_LENGTH} ký tự.`;
  if (password.normalize("NFC").trim() !== confirmation.normalize("NFC").trim()) return "Hai lần nhập mật khẩu chưa khớp.";
  return "";
}
