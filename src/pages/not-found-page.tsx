import { Link } from "react-router-dom";

import { useI18n } from "@/platform/i18n";

export function NotFoundPage() {
  const { t } = useI18n();

  return (
    <main className="grid min-h-screen place-items-center p-4 sm:p-6 lg:p-8">
      <section className="w-full max-w-2xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-[var(--erg-shadow)] sm:p-10">
        <p className="inline-flex rounded-full bg-[rgb(204_0_34_/_0.06)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--erg-red)]">
          404
        </p>
        <h1 className="mt-4 text-4xl font-black leading-none text-slate-900 sm:text-5xl">
          {t("notFound.title")}
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-500 sm:text-lg">
          {t("notFound.description")}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-13 items-center justify-center rounded-full bg-[var(--erg-red)] px-6 text-sm font-black text-white shadow-[0_18px_40px_rgba(204,0,34,0.18)] transition hover:-translate-y-0.5 hover:bg-red-700"
            to="/"
          >
            {t("notFound.backHome")}
          </Link>
        </div>
      </section>
    </main>
  );
}
