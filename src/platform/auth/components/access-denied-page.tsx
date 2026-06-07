import { useEffect } from "react";
import { ShieldAlert } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "@/routes/router-compat";

import { ERG_ASSETS } from "@/config/seo";
import { authApi } from "@/platform/auth/api/auth-api";
import { logoutAccount } from "@/platform/auth/api/auth-storage";
import { readStoredAuthSession, type StoredAuthSession } from "@/platform/auth/api/auth-token-storage";
import { getCurrentStudentSession, logoutStudentSession } from "@/platform/auth/api/student-auth-storage";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { canAccessPortal } from "@/platform/auth/utils/portal-access";

type PortalKey = NonNullable<StoredAuthSession["portal"]>;

const portalLabels: Record<string, string> = {
  admin: "Admin",
  crm: "CRM",
  lcms: "LCMS",
  lms: "LMS",
  elearning: "Elearning",
};

export function AccessDeniedPage() {
  const auth = useAuthSession();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const portal = params.get("portal") ?? "";
  const email = params.get("email") ?? "";
  const redirect = sanitizeRedirect(params.get("redirect"));
  const portalLabel = portalLabels[portal] ?? "hệ thống ERG";

  useEffect(() => {
    const portalKey = toPortalKey(portal);
    if (!portalKey) return;

    const teacherSession = readStoredAuthSession(portalKey) ?? readStoredAuthSession();
    const studentSession = getCurrentStudentSession();
    if (!canAccessPortal({ portal: portalKey, studentSession, teacherAccount: auth.account, teacherSession })) return;

    navigate(redirect, { replace: true });
  }, [auth.account, navigate, portal, redirect]);

  function loginAgain() {
    void authApi.logout().catch(() => undefined);
    logoutStudentSession();
    logoutAccount();
    navigate(`/login?redirect=${encodeURIComponent(redirect)}`, { replace: true });
  }

  return (
    <main className="grid min-h-svh place-items-center bg-[var(--erg-bg)] px-4 py-10 text-slate-950">
      <section className="w-full max-w-[780px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid md:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="bg-[var(--erg-blue)] p-8 text-white">
            <img alt="ERG" className="h-12 w-fit rounded-lg bg-white px-3 py-2 object-contain" src={ERG_ASSETS.logo} />
            <div className="mt-10 flex h-16 w-16 items-center justify-center rounded-lg bg-white/12 ring-1 ring-white/20">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <p className="mt-6 text-[11px] font-semibold text-white/60">Access denied</p>
            <h1 className="mt-3 text-xl font-semibold leading-tight">Tài khoản chưa có quyền truy cập.</h1>
          </aside>

          <div className="p-8 sm:p-10">
            <p className="text-sm font-semibold text-[var(--erg-red)]">Không đủ quyền</p>
            <h2 className="mt-3 text-xl font-semibold">Không thể vào {portalLabel}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              {email ? (
                <>
                  Tài khoản <span className="font-semibold text-slate-950">{email}</span> đã đăng nhập thành công nhưng chưa được cấp quyền vào {portalLabel}.
                </>
              ) : (
                <>Tài khoản hiện tại chưa được cấp quyền vào {portalLabel}.</>
              )}{" "}
              Vui lòng liên hệ quản trị viên ERG để được cấp quyền theo vai trò hoặc trường phụ trách.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={loginAgain}
                className="h-12 rounded-lg bg-[var(--erg-blue)] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--erg-blue-hover)]"
              >
                Đăng nhập tài khoản khác
              </button>
              <Link
                to="/"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-[var(--erg-blue)] hover:text-[var(--erg-blue)]"
              >
                Về trang chủ
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function sanitizeRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function toPortalKey(value: string): PortalKey | undefined {
  if (value === "admin" || value === "crm" || value === "lcms" || value === "lms" || value === "elearning") return value;
  return undefined;
}
