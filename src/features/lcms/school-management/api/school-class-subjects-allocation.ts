import type { SchoolClassSubjectAllocation } from "@/features/lcms/school-management/api/school-class-subjects-api";

/**
 * Puts `subjectId` (at `levelId`) on the selected classes; the other classes are left as they are.
 * Every other (class, subject) pair, with its level, is written back unchanged.
 */
export function assignSubjectToClasses(
  base: readonly SchoolClassSubjectAllocation[],
  { classIds, selectedClassIds, subjectId, levelId }: { classIds: readonly string[]; selectedClassIds: readonly string[]; subjectId: string; levelId?: string },
): SchoolClassSubjectAllocation[] {
  const selected = new Set(selectedClassIds);
  const byClass = new Map(base.map((item) => [item.classId, item]));
  const result: SchoolClassSubjectAllocation[] = [];
  for (const classId of classIds) {
    const current = byClass.get(classId);
    const levelIds = { ...current?.levelIds };
    let subjectIds = current?.subjectIds ?? [];
    if (selected.has(classId)) {
      if (!subjectIds.includes(subjectId)) subjectIds = [...subjectIds, subjectId];
      if (levelId) levelIds[subjectId] = levelId;
      else delete levelIds[subjectId];
    }
    if (subjectIds.length) result.push({ classId, subjectIds, ...(Object.keys(levelIds).length ? { levelIds } : {}) });
  }
  return result;
}

/** Takes `subjectId` (and its level) off the given classes; every other pair keeps its level, and a class left with no subject has no entry. */
export function removeSubjectFromClasses(
  base: readonly SchoolClassSubjectAllocation[],
  { classIds, subjectId }: { classIds: readonly string[]; subjectId: string },
): SchoolClassSubjectAllocation[] {
  const targets = new Set(classIds);
  return base.flatMap((item) => {
    if (!targets.has(item.classId)) return [item];
    const subjectIds = item.subjectIds.filter((id) => id !== subjectId);
    const { [subjectId]: _removed, ...levelIds } = item.levelIds ?? {};
    return subjectIds.length ? [{ classId: item.classId, subjectIds, ...(Object.keys(levelIds).length ? { levelIds } : {}) }] : [];
  });
}
