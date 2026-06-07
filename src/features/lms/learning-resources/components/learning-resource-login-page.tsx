import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Lock } from "lucide-react";

import { Navigate, useLocation } from "@/routes/router-compat";
import { TsForm, TsFormMessage } from "@/components/ui/tanstack-form";
import { AUTH_ACCOUNT_CHANGED_EVENT, getCurrentAccount } from "@/platform/auth";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { displayText, validateLibraryLoginEmail } from "@/features/lms/learning-resources/components/learning-resource-library-utils";

function LibraryAccessGate({ onAuthenticated }: { onAuthenticated: () => void }) {
  const auth = useAuthSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm({
    defaultValues: auth.loginForm,
    onSubmit: () => handleSubmit(),
  });

  async function handleSubmit() {
    setIsSubmitting(true);

    try {
      await auth.actions.login();
      onAuthenticated();
    } catch (error) {
      auth.setNotice({
        tone: "error",
        message: error instanceof Error ? displayText(error.message) : "Không thể đăng nhập tài khoản giáo viên.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleProviderLogin(provider: "google") {
    setIsSubmitting(true);

    try {
      await auth.actions.loginByProvider(provider);
      onAuthenticated();
    } catch (error) {
      auth.setNotice({
        tone: "error",
        message: error instanceof Error ? displayText(error.message) : "Không thể đăng nhập tài khoản giáo viên.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[#f7f8fa]">
      <div className="border-b border-[#e5e5e5] bg-white">
        <div className="mx-auto flex max-w-[86rem] flex-wrap items-center justify-center gap-1.5 px-4 py-3 sm:px-6 lg:px-8">
          {["Mầm non", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map((grade) => (
            <span
              key={grade}
              className={`rounded-md px-3 py-2 text-sm font-semibold ${
                grade === "7" ? "bg-[var(--erg-blue-light)] text-[var(--erg-blue)]" : "text-slate-500"
              }`}
            >
              {grade}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-[86rem] gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:px-8">
        <section className="overflow-hidden rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
          <div className="border-b border-[#e5e5e5] bg-white px-5 py-5 text-slate-900">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-[13px] font-semibold text-[var(--erg-blue)]">Kho học liệu ERG</p>
                <h1 className="mt-2 max-w-3xl text-xl font-semibold leading-tight">
                  Đăng nhập để mở kho học liệu.
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Trang chủ có thể xem công khai. Các tài liệu, bài giảng điện tử, file PDF, video, IC3, MOS và Tin học chỉ mở sau khi xác thực tài khoản giáo viên.
                </p>
              </div>
              <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#d1d1d1] bg-[#f7f8fa] text-[var(--erg-blue)] md:flex">
                <Lock className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="grid gap-0 md:grid-cols-3">
            {[
              { label: "Sách và PDF", value: "PDF" },
              { label: "Bài giảng điện tử", value: "PPTX" },
              { label: "IC3 / MOS / Tin học", value: "API thật" },
            ].map((item) => (
              <div key={item.label} className="border-t border-[#e5e5e5] p-5 md:border-r md:last:border-r-0">
                <p className="text-[12px] font-semibold text-slate-500">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-[#d1d1d1] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--erg-blue-light)] text-[var(--erg-blue)]">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-950">Đăng nhập giáo viên</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">Sử dụng tài khoản được cấp quyền Học liệu hoặc LMS để tiếp tục.</p>
            </div>
          </div>

          {auth.notice ? (
            <div className="mt-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {displayText(auth.notice.message)}
            </div>
          ) : null}
          <TsForm
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <form.Field
              name="email"
              validators={{
                onChange: ({ value }) => validateLibraryLoginEmail(value),
              }}
            >
              {(field) => (
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Email</span>
                  <input
                    className="mt-2 h-10 w-full rounded-md border border-[#d1d1d1] bg-white px-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      field.handleChange(event.target.value);
                      auth.setLoginForm({ ...auth.loginForm, email: event.target.value });
                    }}
                    aria-invalid={field.state.meta.errors.length ? "true" : undefined}
                  />
                  <TsFormMessage>{field.state.meta.errors[0]}</TsFormMessage>
                </label>
              )}
            </form.Field>
            <form.Field
              name="password"
              validators={{
                onChange: ({ value }) => (value ? undefined : "Password is required."),
              }}
            >
              {(field) => (
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Mat khau</span>
                  <input
                    className="mt-2 h-10 w-full rounded-md border border-[#d1d1d1] bg-white px-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      field.handleChange(event.target.value);
                      auth.setLoginForm({ ...auth.loginForm, password: event.target.value });
                    }}
                    aria-invalid={field.state.meta.errors.length ? "true" : undefined}
                  />
                  <TsFormMessage>{field.state.meta.errors[0]}</TsFormMessage>
                </label>
              )}
            </form.Field>

            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, formSubmitting]) => (
                <button
                  className="inline-flex h-10 w-full items-center justify-center rounded-md bg-[var(--erg-blue)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--erg-blue-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!canSubmit || isSubmitting || formSubmitting}
                  type="submit"
                >
                  Dang nhap va mo kho hoc lieu
                </button>
              )}
            </form.Subscribe>
          </TsForm>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              className="h-9 rounded-md border border-[#d1d1d1] bg-white text-sm font-medium text-slate-700 transition hover:border-[var(--erg-blue)] hover:text-[var(--erg-blue)]"
              disabled={isSubmitting}
              type="button"
              onClick={() => void handleProviderLogin("google")}
            >
              Google
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export function LearningResourceLoginPage() {
  const location = useLocation();
  const [account, setAccount] = useState(() => getCurrentAccount());
  const redirectPath = new URLSearchParams(location.search).get("redirect") || "/kho-hoc-lieu/1";
  const safeRedirectPath = redirectPath.startsWith("/") && !redirectPath.startsWith("//") ? redirectPath : "/kho-hoc-lieu/1";

  useEffect(() => {
    function handleAuthChanged() {
      setAccount(getCurrentAccount());
    }

    window.addEventListener(AUTH_ACCOUNT_CHANGED_EVENT, handleAuthChanged);
    return () => window.removeEventListener(AUTH_ACCOUNT_CHANGED_EVENT, handleAuthChanged);
  }, []);

  if (account) {
    return <Navigate to={safeRedirectPath} replace />;
  }

  return <LibraryAccessGate onAuthenticated={() => setAccount(getCurrentAccount())} />;
}
