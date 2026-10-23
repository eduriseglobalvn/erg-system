const academicYearPattern = /^(\d{4})\s*[–—-]\s*(\d{4})$/;

export function formatAcademicYear(startYear: number) {
  return `${startYear}–${startYear + 1}`;
}

export function getAcademicYearStart(value: string, fallbackYear = new Date().getFullYear()) {
  const match = value.match(academicYearPattern);
  return match ? Number(match[1]) : fallbackYear;
}

export function getAcademicYearOptions(selectedStart: number, referenceYear = new Date().getFullYear()) {
  const earliest = Math.min(referenceYear - 5, selectedStart - 2);
  const latest = Math.max(referenceYear + 5, selectedStart + 2);
  return Array.from({ length: latest - earliest + 1 }, (_, index) => latest - index);
}
