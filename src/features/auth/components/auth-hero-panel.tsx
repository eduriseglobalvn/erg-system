import { SparkleIcon } from "@/features/auth/components/auth-icons";
import { useI18n } from "@/features/i18n";

export function AuthHeroPanel() {
  const { t } = useI18n();

  const authHighlights = [
    t("auth.highlight1"),
    t("auth.highlight2"),
    t("auth.highlight3"),
  ];

  return (
    <div className="relative overflow-hidden bg-[linear-gradient(180deg,#3242c7_0%,#3045cf_42%,#6a2d97_76%,#9f1537_100%)] p-8 text-white sm:p-10 lg:p-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_34%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_26%)]" />
      <div className="relative flex h-full flex-col">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
          <SparkleIcon />
          {t("auth.heroBadge")}
        </span>

        <div className="mt-10 max-w-[520px]">
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-5xl">
            {t("auth.heroTitle")}
          </h1>
          <p className="mt-6 max-w-[480px] text-lg leading-8 text-white/78">
            {t("auth.heroSubtitle")}
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {authHighlights.map((item) => (
            <div
              key={item}
              className="flex items-start gap-4 rounded-[22px] border border-white/15 bg-white/10 px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-sm"
            >
              <span className="mt-1 h-3 w-3 rounded-full bg-white/95 shadow-[0_0_0_6px_rgba(255,255,255,0.08)]" />
              <p className="text-lg leading-8 text-white/88">{item}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
