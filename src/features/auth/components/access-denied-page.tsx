import { useEffect } from "react";
import { ShieldAlert } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { ERG_ASSETS } from "@/config/seo";
import { logoutAccount } from "@/features/auth/api/auth-storage";
import { readStoredAuthSession, type StoredAuthSession } from "@/features/auth/api/auth-token-storage";
import { getCurrentStudentSession, logoutStudentSession } from "@/features/auth/api/student-auth-storage";
import { useAuthSession } from "@/features/auth/hooks/use-auth-session";
import { canAccessPortal } from "@/features/auth/utils/portal-access";

type PortalKey = NonNullable<StoredAuthSession["portal"]>;

const portalLabels: Record<string, string> = {
  hoclieu: "Kho học liệu",
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
    logoutStudentSession();
    logoutAccount();
    navigate(`/login?redirect=${encodeURIComponent(redirect)}`, { replace: true });
  }

  return (
    <main className="grid min-h-svh place-items-center bg-[linear-gradient(135deg,#f7fbff_0%,#eef4ff_52%,#fff8f8_100%)] px-4 py-10 text-slate-950">
      <section className="w-full max-w-[780px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_100px_-55px_rgba(15,23,42,0.55)]">
        <div className="grid md:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="bg-[linear-gradient(155deg,var(--erg-blue)_0%,#2435a7_55%,#a3134f_130%)] p-8 text-white">
            <img alt="ERG" className="h-12 w-fit rounded-lg bg-white px-3 py-2 object-contain" src={ERG_ASSETS.logo} />
            <div className="mt-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <p className="mt-6 text-[11px] font-black uppercase tracking-[0.22em] text-white/60">Access denied</p>
            <h1 className="mt-3 text-3xl font-black leading-tight">Tài khoản chưa có quyền truy cập.</h1>
          </aside>

          <div className="p-8 sm:p-10">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--erg-red)]">Không đủ quyền</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight">Không thể vào {portalLabel}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              {email ? (
                <>
                  Tài khoản <span className="font-bold text-slate-950">{email}</span> đã đăng nhập thành công nhưng chưa được cấp quyền vào {portalLabel}.
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
                className="h-12 rounded-xl bg-[var(--erg-blue)] px-5 text-sm font-black text-white shadow-[0_18px_38px_-28px_rgba(0,0,139,0.75)] transition hover:bg-blue-900"
              >
                Đăng nhập tài khoản khác
              </button>
              <Link
                to="/"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:border-[var(--erg-blue)] hover:text-[var(--erg-blue)]"
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
  if (value === "hoclieu" || value === "lms" || value === "elearning") return value;
  return undefined;
}
