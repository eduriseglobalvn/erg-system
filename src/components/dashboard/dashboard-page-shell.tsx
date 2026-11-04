import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { cn } from "@/lib/utils";

type DashboardPageShellProps = {
  badge?: string;
  title: string;
  description?: string;
  breadcrumbs?: string[];
  actions?: ReactNode;
  headerContent?: ReactNode;
  hideHeader?: boolean;
  contentClassName?: string;
  children: ReactNode;
};

type DashboardMetricCardProps = {
  label: string;
  value: ReactNode;
  detail: string;
  delta?: string;
  icon?: ReactNode;
  tone?: "blue" | "amber" | "emerald" | "rose" | "violet";
};

type DashboardSectionCardProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

type DashboardSegmentOption = {
  value: string;
  label: string;
};

const toneStyles = {
  amber: {
    bg: "rgba(255, 149, 0, 0.12)",
    border: "rgba(255, 149, 0, 0.22)",
    color: "#B45309",
    dot: "#FF9500",
  },
  blue: {
    bg: "rgba(0, 113, 227, 0.08)",
    border: "rgba(0, 113, 227, 0.18)",
    color: "#0071E3",
    dot: "#0071E3",
  },
  emerald: {
    bg: "rgba(52, 199, 89, 0.12)",
    border: "rgba(52, 199, 89, 0.22)",
    color: "#15803D",
    dot: "#34C759",
  },
  rose: {
    bg: "rgba(255, 59, 48, 0.1)",
    border: "rgba(255, 59, 48, 0.22)",
    color: "#DC2626",
    dot: "#FF3B30",
  },
  violet: {
    bg: "rgba(175, 82, 222, 0.12)",
    border: "rgba(175, 82, 222, 0.22)",
    color: "#7E22CE",
    dot: "#AF52DE",
  },
} as const;

export function DashboardPageShell({
  actions,
  badge,
  breadcrumbs,
  children,
  contentClassName,
  description,
  headerContent,
  hideHeader = false,
  title,
}: DashboardPageShellProps) {
  return (
    <div className="h-full overflow-y-auto bg-[#F5F5F7]">
      <div className={cn("mx-auto flex max-w-[1560px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8", contentClassName)}>
        {!hideHeader ? (
          <section className="rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white/90 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02),0_8px_24px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                {breadcrumbs?.length ? (
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-normal text-[#86868B]">
                    {breadcrumbs.map((item, index) => (
                      <div key={`${item}-${index}`} className="flex items-center gap-2">
                        {index > 0 ? <span className="text-[#C7C7CC]">/</span> : null}
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className={cn("flex flex-wrap items-center gap-3", breadcrumbs?.length ? "mt-2" : "")}>
                  {badge ? (
                    <Box
                      sx={{
                        bgcolor: "rgba(0, 113, 227, 0.08)",
                        border: "1px solid rgba(0, 113, 227, 0.18)",
                        borderRadius: "9999px",
                        color: "#0071E3",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        px: 1.25,
                        py: 0.35,
                      }}
                    >
                      {badge}
                    </Box>
                  ) : null}
                  <h1 className="text-xl font-bold tracking-tight text-[#1D1D1F] sm:text-2xl">
                    {title}
                  </h1>
                </div>
                {description ? (
                  <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[#6E6E73]">
                    {description}
                  </p>
                ) : null}
              </div>
              {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div> : null}
            </div>
            {headerContent ? <div className="mt-4 border-t border-[rgba(0,0,0,0.05)] pt-4">{headerContent}</div> : null}
          </section>
        ) : null}
        {children}
      </div>
    </div>
  );
}

export function DashboardMetricCard({
  delta,
  detail,
  icon,
  label,
  tone = "blue",
  value,
}: DashboardMetricCardProps) {
  const toneStyle = toneStyles[tone];

  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: "#FFFFFF",
        border: "1px solid rgba(0, 0, 0, 0.06)",
        borderRadius: "16px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02), 0 8px 18px -4px rgba(0, 0, 0, 0.03)",
        overflow: "hidden",
        transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
        "&:hover": {
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.04), 0 12px 24px -4px rgba(0, 0, 0, 0.06)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <div className="text-xs font-semibold tracking-normal text-[#6E6E73]">{label}</div>
          <div className="mt-1.5 text-2xl font-extrabold tracking-tight text-[#1D1D1F] sm:text-[1.75rem]">{value}</div>
          <div className="mt-1 text-xs text-[#86868B]">{detail}</div>
        </div>
        {icon ? (
          <Box
            sx={{
              alignItems: "center",
              bgcolor: toneStyle.bg,
              borderRadius: "10px",
              color: toneStyle.color,
              display: "flex",
              flexShrink: 0,
              height: 38,
              justifyContent: "center",
              width: 38,
            }}
          >
            {icon}
          </Box>
        ) : null}
      </div>
      {delta ? (
        <div className="border-t border-[rgba(0,0,0,0.05)] bg-[#FBFBFD] px-5 py-2.5">
          <Box
            sx={{
              alignItems: "center",
              bgcolor: toneStyle.bg,
              border: `1px solid ${toneStyle.border}`,
              borderRadius: "9999px",
              color: toneStyle.color,
              display: "inline-flex",
              fontSize: "0.72rem",
              fontWeight: 700,
              lineHeight: 1,
              px: 1.25,
              py: 0.4,
            }}
          >
            {delta}
          </Box>
        </div>
      ) : null}
    </Card>
  );
}

export function DashboardSectionCard({
  action,
  children,
  className,
  description,
  title,
}: DashboardSectionCardProps) {
  return (
    <Card
      elevation={0}
      className={className}
      sx={{
        bgcolor: "#FFFFFF",
        border: "1px solid rgba(0, 0, 0, 0.06)",
        borderRadius: "16px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02), 0 10px 28px -4px rgba(0, 0, 0, 0.04)",
      }}
    >
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight text-[#1D1D1F]">{title}</h2>
            {description ? <p className="mt-1 text-xs text-[#86868B]">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
        {children}
      </div>
    </Card>
  );
}

export function DashboardSegmentedControl({
  onChange,
  options,
  value,
}: {
  options: DashboardSegmentOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#F5F5F7] p-1 shadow-none">
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "relative min-h-7 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition-all",
              active
                ? "bg-white text-[#1D1D1F] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                : "text-[#6E6E73] hover:text-[#1D1D1F]",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

type BadgeTone = "primary" | "secondary" | "success" | "warning" | "danger" | "outline";

const BADGE_TONE_TO_STATUS = {
  danger: "error",
  outline: "neutral",
  primary: "info",
  secondary: "neutral",
  success: "success",
  warning: "warning",
} as const;

export function DashboardStatusBadge({ label, tone }: { label: string; tone: BadgeTone }) {
  return <ErgStatusChip label={label} tone={BADGE_TONE_TO_STATUS[tone] ?? "neutral"} />;
}
