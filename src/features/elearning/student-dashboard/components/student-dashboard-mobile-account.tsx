import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

import { Button, Card } from "@/components/ui/dashboard-kit";
import type { ElearningViewerSession } from "@/platform/auth/api/elearning-viewer-session";
import type { DashboardCopy } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type {
  StudentDashboardAssignment,
  StudentDashboardProfile,
} from "@/features/elearning/student-dashboard/types/student-dashboard-types";

export function StudentDashboardMobileAccount({
  account,
  averageAssignmentScore,
  copy,
  onSignIn,
  onSignOut,
  openAssignments,
  profile,
}: {
  account: ElearningViewerSession | null;
  averageAssignmentScore: number;
  copy: DashboardCopy;
  onSignIn: () => void;
  onSignOut: () => void;
  openAssignments: StudentDashboardAssignment[];
  profile: StudentDashboardProfile;
}) {
  return (
    <section className="px-4 py-4">
      <div className="space-y-4">
        <Card className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-lg bg-[var(--erg-blue)] text-xl font-semibold text-white shadow-sm">
              {profile.name.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <div className="inline-flex rounded-md bg-[#ebf3fc] px-3 py-1 text-[11px] font-medium text-[var(--erg-blue)]">
                {copy.accountTitle}
              </div>
              <h1 className="mt-3 text-[28px] font-semibold leading-[1.1]  text-slate-900">
                {profile.name}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {profile.className} · {profile.schoolName}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2.5">
            <Metric label={copy.stats.average} value={`${averageAssignmentScore}`} />
            <Metric label={copy.stats.completed} value={`${profile.completedAssignments}`} />
            <Metric label={copy.stats.open} value={`${openAssignments.length}`} />
          </div>
        </Card>

        <Card className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#ebf3fc] text-[var(--erg-blue)]">
              <AccountCircleOutlinedIcon fontSize="small" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">{copy.loginStateTitle}</h2>
              <p className="text-sm text-slate-500">{copy.accountDescription}</p>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-[#f8faff] px-4 py-4 text-sm leading-7 text-slate-600">
            <div className="font-semibold text-slate-900">{account?.name ?? copy.guestLabel}</div>
            <div>{account?.email ?? copy.guestLabel}</div>
            <div>{account ? copy.signedInAs : copy.guestLabel}</div>
          </div>

          <div className="mt-4 grid gap-3">
            <Button className="h-11 rounded-lg bg-[var(--erg-blue)] text-white hover:bg-[var(--erg-blue-hover)]" onClick={onSignIn}>
              <LoginOutlinedIcon fontSize="small" />
              {copy.signIn}
            </Button>
            <Button variant="outline" className="h-11 rounded-lg border-slate-200 bg-white text-slate-700" onClick={onSignOut}>
              <LogoutOutlinedIcon fontSize="small" />
              {copy.signOut}
            </Button>
          </div>
        </Card>

        <Card className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">{copy.learningProfileTitle}</h2>
          <div className="mt-4 grid gap-3">
            <InfoRow label={copy.progressLabel} value={`${profile.weeklyGoalProgress}%`} />
            <InfoRow label={copy.assignmentsTitle} value={`${profile.completedAssignments}/${profile.totalAssignments}`} />
            <InfoRow label={copy.scoresTitle} value={`${profile.averageScore}`} />
            <InfoRow label={copy.notificationTitle} value={`${profile.homeroomTeacher}`} />
          </div>
        </Card>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-[#fbfcff] px-3 py-3">
      <div className="text-[11px] font-medium text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-[#f8faff] px-4 py-3">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}
