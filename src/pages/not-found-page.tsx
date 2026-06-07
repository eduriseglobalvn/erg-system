import { Link } from "@/routes/router-compat";

import { useI18n } from "@/platform/i18n";

export function NotFoundPage() {
  const { t } = useI18n();

  return (
    <main className="grid min-h-screen place-items-center p-4 sm:p-6 lg:p-8">
      <section className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="inline-flex rounded-md bg-[rgb(204_0_34_/_0.06)] px-3 py-1.5 text-xs font-semibold text-[var(--erg-red)]">
          404
        </p>
        <h1 className="mt-4 text-2xl font-semibold leading-tight text-slate-900">
          {t("notFound.title")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {t("notFound.description")}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--erg-red)] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
            to="/"
          >
            {t("notFound.backHome")}
          </Link>
        </div>
      </section>
    </main>
  );
}
