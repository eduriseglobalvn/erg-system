import { Building2, Check, GraduationCap } from "lucide-react";

import { LmsSelect } from "@/components/ui/lms-kit";
import { cn } from "@/lib/utils";

import { MobileBottomSheet } from "./mobile-bottom-sheet";

export type LmsMobileSchoolOption = {
  id: string;
  name: string;
};

export type LmsMobileClassOption = {
  id: string;
  className: string;
  schoolId: string;
};

export function LmsScopeSheet({
  classes,
  open,
  schools,
  selectedClassId,
  selectedSchoolId,
  onClassChange,
  onOpenChange,
  onSchoolChange,
}: {
  classes: LmsMobileClassOption[];
  open: boolean;
  schools: LmsMobileSchoolOption[];
  selectedClassId: string;
  selectedSchoolId: string;
  onClassChange: (classId: string) => void;
  onOpenChange: (open: boolean) => void;
  onSchoolChange: (schoolId: string) => void;
}) {
  const selectedClassOptions = classes.filter((classroom) => classroom.schoolId === selectedSchoolId);
  const selectedSchool = schools.find((school) => school.id === selectedSchoolId);

  return (
    <MobileBottomSheet
      open={open}
      title="Pham vi giang day"
      description={selectedSchool?.name ?? "Chon truong va lop dang day"}
      onOpenChange={onOpenChange}
    >
      <div className="space-y-4">
        <label className="block space-y-2">
          <span className="flex items-center gap-2 text-xs font-extrabold uppercase text-[var(--muted-foreground)]">
            <Building2 className="h-4 w-4" />
            Truong
          </span>
          <LmsSelect
            aria-label="Chon truong"
            className="h-12 w-full text-[15px]"
            value={selectedSchoolId}
            onChange={(event) => onSchoolChange(event.target.value)}
          >
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </LmsSelect>
        </label>

        <section className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-[var(--muted-foreground)]">
            <GraduationCap className="h-4 w-4" />
            Lop dang day
          </div>
          <div className="grid gap-2">
            {selectedClassOptions.length ? (
              selectedClassOptions.map((classroom) => {
                const active = classroom.id === selectedClassId;

                return (
                  <button
                    key={classroom.id}
                    type="button"
                    className={cn(
                      "flex min-h-12 items-center justify-between gap-3 rounded-[12px] border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25",
                      active
                        ? "border-[#b8d6fa] bg-[#eef6ff] text-[var(--primary)]"
                        : "border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-[var(--surface-hover)]",
                    )}
                    onClick={() => {
                      onClassChange(classroom.id);
                      onOpenChange(false);
                    }}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-extrabold">{classroom.className}</span>
                      <span className="mt-0.5 block text-xs font-semibold text-[var(--muted-foreground)]">
                        {selectedSchool?.name ?? "ERG"}
                      </span>
                    </span>
                    {active ? <Check className="h-5 w-5 shrink-0" /> : null}
                  </button>
                );
              })
            ) : (
              <div className="rounded-[12px] border border-dashed border-[var(--border)] px-3 py-4 text-sm font-semibold text-[var(--muted-foreground)]">
                Chua co lop trong truong nay.
              </div>
            )}
          </div>
        </section>
      </div>
    </MobileBottomSheet>
  );
}
