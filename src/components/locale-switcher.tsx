import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useI18n, type Locale } from "@/platform/i18n";
import { cn } from "@/utils/cn";
import {
  ArrowDownwardIcon,
  ArrowUpwardIcon,
  TranslateIcon,
} from "@/components/icons";

type LocaleSwitcherProps = {
  className?: string;
  compact?: boolean;
  variant?: "panel" | "inline";
};

const locales: Array<{
  value: Locale;
  labelKey: "locale.vietnamese" | "locale.english";
}> = [
  { value: "vi", labelKey: "locale.vietnamese" },
  { value: "en", labelKey: "locale.english" },
];

export function LocaleSwitcher({
  className,
  compact = false,
  variant = "panel",
}: LocaleSwitcherProps) {
  const { locale, setLocale, t } = useI18n();

  if (variant === "inline") {
    const activeLabel =
      locale === "vi" ? t("locale.vietnamese") : t("locale.english");

    return (
      <SidebarMenu className={className}>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-[0_10px_28px_-22px_rgba(15,23,42,0.35)] hover:bg-slate-50 data-[state=open]:bg-slate-50"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
                  <TranslateIcon className="h-4 w-4" fontSize="inherit" />
                </div>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {t("locale.language")}
                  </span>
                  <span className="truncate font-medium text-slate-900">
                    {activeLabel}
                  </span>
                </div>
                <span className="ml-auto inline-flex flex-col text-slate-500">
                  <ArrowUpwardIcon className="size-3" fontSize="inherit" />
                  <ArrowDownwardIcon className="-mt-1 size-3" fontSize="inherit" />
                </span>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="top"
              sideOffset={8}
              className="min-w-44 rounded-xl"
            >
              <DropdownMenuLabel className="text-xs uppercase tracking-[0.14em] text-slate-500">
                {t("locale.language")}
              </DropdownMenuLabel>
              {locales.map((item) => {
                const active = locale === item.value;

                return (
                  <DropdownMenuItem
                    key={item.value}
                    onClick={() => setLocale(item.value)}
                    className={cn(
                      "font-medium",
                      active && "bg-slate-100 text-slate-950",
                    )}
                  >
                    {t(item.labelKey)}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white shadow-[0_10px_28px_-22px_rgba(15,23,42,0.35)]",
        className,
      )}
    >
      <div className={cn("px-3 pt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500", compact && "px-2.5 pt-2.5")}>
        {t("locale.language")}
      </div>
      <div className={cn("flex gap-2 p-3", compact && "p-2.5")}>
        {locales.map((item) => {
          const active = locale === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setLocale(item.value)}
              aria-label={
                item.value === "vi"
                  ? t("locale.switchToVietnamese")
                  : t("locale.switchToEnglish")
              }
              className={cn(
                "inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition",
                active
                  ? "border-[var(--erg-blue)] bg-[var(--erg-blue)] text-white shadow-[0_12px_28px_-18px_rgba(0,0,139,0.55)]"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                compact && "min-h-9 px-2.5 text-[13px]",
              )}
            >
              {t(item.labelKey)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
