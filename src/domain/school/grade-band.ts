export type GradeBand = "A" | "B" | "C" | "D" | "E";

/**
 * The one place for the A–E class grade (score 0–100): ≥90 A, ≥80 B, ≥70 C, ≥60 D, else E.
 * The backend has no grade band yet; a student who needs support drops from D to E.
 */
export function gradeBandFor(averageScore: number, needsSupport = false): GradeBand {
  if (averageScore >= 90) return "A";
  if (averageScore >= 80) return "B";
  if (averageScore >= 70) return "C";
  if (averageScore >= 60) return needsSupport ? "E" : "D";
  return "E";
}
