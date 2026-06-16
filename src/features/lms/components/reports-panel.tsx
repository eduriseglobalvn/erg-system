import { memo } from "react";
import type { ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";

interface ReportsPanelProps {
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
}

export function ReportsPanel({ selectedClass, selectedSchoolName }: ReportsPanelProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Metric label="Trường" value={selectedSchoolName} detail="Phạm vi đang xem" />
      <Metric label="Lớp" value={selectedClass?.className ?? "-"} detail={`${selectedClass?.studentCount ?? 0} học sinh`} />
      <Metric label="Hoàn thành" value={`${selectedClass?.completionRate ?? 0}%`} detail="Trung bình bài đang mở" />
      <Metric label="Cần hỗ trợ" value={String(selectedClass?.riskStudents ?? 0)} detail="Học sinh cần theo sát" />
    </section>
  );
}

const Metric = memo(function Metric({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
      <div className="text-xs font-semibold text-[var(--muted-foreground)]">{label}</div>
      <div className="mt-3 text-xl font-semibold text-[var(--foreground)]">{value}</div>
      <div className="mt-2 text-sm text-[var(--muted-foreground)]">{detail}</div>
    </article>
  );
});
