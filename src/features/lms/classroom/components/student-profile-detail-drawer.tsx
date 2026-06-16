import { LockKeyhole, UserRound, X } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import type { ClassroomStudent, StudentStatus } from "@/features/lms/classroom/types/classroom-types";
import { cn } from "@/lib/utils";
import { AppSelect } from "@/components/ui/app-select";

export type StudentProfileDetailDraft = {
  name: string;
  username: string;
  password: string;
  note: string;
};

export type StudentProfileStatusOption<TValue extends string = string> = {
  label: string;
  value: TValue;
};

type StudentProfileDetailDrawerProps<TValue extends string = StudentStatus> = {
  draft: StudentProfileDetailDraft;
  onClose: () => void;
  onStatusChange?: (value: TValue) => void;
  onUpdate: (patch: Partial<StudentProfileDetailDraft>) => void;
  statusLabel?: string;
  statusOptions?: Array<StudentProfileStatusOption<TValue>>;
  statusValue?: TValue;
  student: ClassroomStudent;
};

export function StudentProfileDetailDrawer<TValue extends string = StudentStatus>({
  draft,
  onClose,
  onStatusChange,
  onUpdate,
  statusLabel = "Trạng thái học tập",
  statusOptions,
  statusValue,
  student,
}: StudentProfileDetailDrawerProps<TValue>) {
  const profile = buildStudentProfile(student);

  return (
    <>
      <button type="button" aria-label="Đóng chi tiết học sinh" className="fixed inset-0 z-[90] bg-slate-950/25" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-[100] flex h-screen w-[560px] max-w-[calc(100vw-20px)] flex-col border-l border-[#cbd7e6] bg-white shadow-sm">
        <div className="border-b border-[#cbd7e6] bg-[#f8fbff] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[var(--erg-blue-light)] text-[var(--erg-blue)]">
                <UserRound className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-slate-950">Chi tiết hồ sơ học sinh</h2>
                <p className="mt-0.5 text-[13px] font-semibold text-slate-600">
                  {student.className} - {student.schoolName}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <BadgeText>{profile.code}</BadgeText>
                  <BadgeText>{profile.birthDate}</BadgeText>
                  <BadgeText>{profile.gender}</BadgeText>
                </div>
              </div>
            </div>
            <button type="button" className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-white hover:text-[var(--erg-blue)]" onClick={onClose}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          <div className="grid gap-4">
            <section className="rounded-lg border border-[#cbd7e6] bg-white p-4 shadow-[var(--shadow-xs)]">
              <SectionTitle title="Thông tin định danh" />
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Họ tên">
                  <input value={draft.name} onChange={(event) => onUpdate({ name: event.target.value })} className={detailInputClass} />
                </Field>
                <ReadOnlyField label="Mã học sinh" value={profile.code} />
                <ReadOnlyField label="Ngày sinh" value={profile.birthDate} />
                <ReadOnlyField label="Giới tính" value={profile.gender} />
                <ReadOnlyField label="Lớp hiện tại" value={student.className} />
                <ReadOnlyField label="Khối" value={student.gradeLabel} />
              </div>
            </section>

            <section className="rounded-lg border border-[#cbd7e6] bg-white p-4 shadow-[var(--shadow-xs)]">
              <SectionTitle title="Liên hệ gia đình" />
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <ReadOnlyField label="Phụ huynh chính" value={profile.guardianName} />
                <ReadOnlyField label="Số điện thoại" value={profile.guardianPhone} />
                <ReadOnlyField label="Email phụ huynh" value={profile.guardianEmail} />
                <ReadOnlyField label="Địa chỉ" value={profile.address} />
              </div>
            </section>

            <section className="rounded-lg border border-[#cbd7e6] bg-white p-4 shadow-[var(--shadow-xs)]">
              <SectionTitle title="Tài khoản elearning" />
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Username">
                  <input value={draft.username} onChange={(event) => onUpdate({ username: event.target.value })} className={detailInputClass} />
                </Field>
                <Field label="Mật khẩu">
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                    <input value={draft.password} onChange={(event) => onUpdate({ password: event.target.value })} className={cn(detailInputClass, "pl-8")} />
                  </div>
                </Field>
                <ReadOnlyField label="Lần đăng nhập gần nhất" value={student.lastActivity} />
                <ReadOnlyField label="Thiết bị thường dùng" value={profile.device} />
              </div>
            </section>

            <section className="rounded-lg border border-[#cbd7e6] bg-white p-4 shadow-[var(--shadow-xs)]">
              <SectionTitle title="Theo dõi học tập" />
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <MiniMetric label="Tiến độ" value={`${student.progressRate}%`} />
                <MiniMetric label="Điểm TB" value={`${student.averageScore}`} />
                <MiniMetric label="Hoàn thành" value={`${student.completedAssignments} bài`} />
                <MiniMetric label="Streak" value={`${student.streakDays} ngày`} />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <ReadOnlyField label="Bài đang học" value={student.currentAssignment} />
                <ReadOnlyField label="Chặng hiện tại" value={student.currentStage} />
                <ReadOnlyField label="Năng lực nổi bật" value={profile.strengths} />
                <ReadOnlyField label="Cần hỗ trợ" value={profile.supportPlan} />
              </div>
            </section>

            <section className="rounded-lg border border-[#cbd7e6] bg-white p-4 shadow-[var(--shadow-xs)]">
              <SectionTitle title="Chăm sóc và ghi chú" />
              <div className="mt-3 grid gap-3">
                {statusOptions?.length && statusValue && onStatusChange ? (
                  <Field label={statusLabel}>
                    <AppSelect value={statusValue} onChange={(event) => onStatusChange(event.target.value as TValue)} className={detailInputClass}>
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </AppSelect>
                  </Field>
                ) : null}
                <ReadOnlyField label="Lịch sử chăm sóc" value={profile.careHistory} />
                <Field label="Ghi chú giáo viên">
                  <textarea value={draft.note} onChange={(event) => onUpdate({ note: event.target.value })} className={cn(detailInputClass, "min-h-28 py-2 leading-5")} />
                </Field>
              </div>
            </section>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-[#cbd7e6] bg-[#f8fbff] p-3">
          <span className="text-[13px] font-semibold text-slate-600">{student.name} - {student.className}</span>
          <Button type="button" onClick={onClose} className="h-9 rounded-md px-3 text-[14px]">
            Lưu thông tin
          </Button>
        </div>
      </aside>
    </>
  );
}

function buildStudentProfile(student: ClassroomStudent) {
  const numericSeed = Array.from(student.id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const day = String((numericSeed % 27) + 1).padStart(2, "0");
  const month = String((numericSeed % 12) + 1).padStart(2, "0");
  const gradeNumber = Number(student.gradeLabel.match(/\d+/)?.[0] ?? 6);
  const birthYear = 2018 - gradeNumber;
  const parentLast = student.name.split(" ").slice(-1)[0] || "Phụ huynh";
  const phoneSuffix = String(100000 + (numericSeed % 899999)).padStart(6, "0");

  return {
    address: `${(numericSeed % 42) + 8} đường Nguyễn Văn Cừ, phường ${((numericSeed % 8) + 1).toString()}, TP. Hồ Chí Minh`,
    birthDate: `${day}/${month}/${birthYear}`,
    careHistory: `Đã trao đổi phụ huynh sau buổi ${((numericSeed % 5) + 1).toString()} về tiến độ ${student.currentStage.toLowerCase()}.`,
    code: `HS-${student.gradeLabel.replace(/\D/g, "") || "6"}-${student.id.replace(/\D/g, "").slice(-4).padStart(4, "0")}`,
    device: numericSeed % 2 === 0 ? "Laptop Windows tại nhà" : "Máy tính bảng dùng chung gia đình",
    gender: numericSeed % 2 === 0 ? "Nam" : "Nữ",
    guardianEmail: `${removeVietnameseMarks(parentLast).toLowerCase()}${numericSeed % 1000}@example.com`,
    guardianName: `${numericSeed % 2 === 0 ? "Anh" : "Chị"} ${parentLast}`,
    guardianPhone: `09${String(numericSeed % 90).padStart(2, "0")}.${phoneSuffix.slice(0, 3)}.${phoneSuffix.slice(3)}`,
    strengths: student.status === "ahead" ? "Tự học nhanh, làm bài ổn định" : student.status === "support" ? "Cần nhắc nhở nhưng phản hồi tốt" : "Duy trì tiến độ đều",
    supportPlan: student.status === "support" ? "Cần checkpoint 10 phút sau mỗi buổi học" : "Theo dõi nhịp làm bài hằng tuần",
  };
}

function SectionTitle({ title }: { title: string }) {
  return <h3 className="text-[14px] font-bold text-slate-700">{title}</h3>;
}

function BadgeText({ children }: { children: string }) {
  return <span className="rounded-md border border-[#dbe4f0] bg-white px-2.5 py-1 text-[13px] font-bold text-slate-700 shadow-[var(--shadow-xs)]">{children}</span>;
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-[13px] font-semibold text-slate-600">{label}</div>
      <div className="min-h-10 rounded-md border border-[#cbd7e6] bg-[#f8fbff] px-2.5 py-2 text-sm font-semibold leading-5 text-slate-800">{value}</div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#cbd7e6] bg-[#f8fbff] px-2.5 py-2">
      <div className="text-[13px] font-semibold text-slate-600">{label}</div>
      <div className="mt-0.5 truncate text-[13px] font-bold text-slate-900">{value}</div>
    </div>
  );
}

const detailInputClass = "h-10 w-full rounded-md border border-[#d7e0ec] bg-white px-2.5 text-[14px] font-semibold text-slate-900 outline-none focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]";

function removeVietnameseMarks(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}
