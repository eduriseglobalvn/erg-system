import { SparkleIcon } from "@/platform/auth/components/auth-icons";
import { useI18n } from "@/platform/i18n";

export function AuthHeroPanel() {
  const { t } = useI18n();

  const authHighlights = [
    t("auth.highlight1"),
    t("auth.highlight2"),
    t("auth.highlight3"),
  ];

  return (
    <div className="relative overflow-hidden bg-[var(--erg-blue)] p-6 text-white sm:p-7 lg:p-8">
      <div className="relative flex h-full flex-col">
        <span className="inline-flex w-fit items-center gap-2 rounded-md border border-white/25 bg-white/10 px-3 py-2 text-xs font-semibold text-white/90 shadow-sm">
          <SparkleIcon />
          {t("auth.heroBadge")}
        </span>

        <div className="mt-7 max-w-[520px]">
          <h1 className="text-xl font-semibold leading-tight">
            {t("auth.heroTitle")}
          </h1>
          <p className="mt-3 max-w-[480px] text-sm leading-6 text-white/80">
            {t("auth.heroSubtitle")}
          </p>
        </div>

        <div className="mt-7 space-y-2.5">
          {authHighlights.map((item) => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-lg border border-white/15 bg-white/10 px-3.5 py-2.5 shadow-sm"
            >
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-white/95 shadow-sm" />
              <p className="text-sm leading-6 text-white/88">{item}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
