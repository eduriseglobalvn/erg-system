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

type DashboardSectionCardProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

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
    <Box className="h-full overflow-y-auto" sx={{ bgcolor: "background.default" }}>
      <div className={cn("mx-auto flex max-w-[1560px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8", contentClassName)}>
        {!hideHeader ? (
          <section className="rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white/90 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02),0_8px_24px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                {breadcrumbs?.length ? (
                  <Box className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-normal" sx={{ color: "text.secondary" }}>
                    {breadcrumbs.map((item, index) => (
                      <div key={`${item}-${index}`} className="flex items-center gap-2">
                        {index > 0 ? <Box component="span" sx={{ color: "text.disabled" }}>/</Box> : null}
                        <span>{item}</span>
                      </div>
                    ))}
                  </Box>
                ) : null}
                <div className={cn("flex flex-wrap items-center gap-3", breadcrumbs?.length ? "mt-2" : "")}>
                  {badge ? (
                    <Box
                      sx={{
                        bgcolor: "action.hover",
                        border: 1, borderColor: "divider",
                        borderRadius: "9999px",
                        color: "primary.main",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        px: 1.25,
                        py: 0.35,
                      }}
                    >
                      {badge}
                    </Box>
                  ) : null}
                  <Box component="h1" className="text-xl font-semibold tracking-tight sm:text-2xl" sx={{ color: "text.primary" }}>
                    {title}
                  </Box>
                </div>
                {description ? (
                  <Box component="p" className="mt-1.5 max-w-3xl text-sm leading-relaxed" sx={{ color: "text.secondary" }}>
                    {description}
                  </Box>
                ) : null}
              </div>
              {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div> : null}
            </div>
            {headerContent ? <div className="mt-4 border-t border-[rgba(0,0,0,0.05)] pt-4">{headerContent}</div> : null}
          </section>
        ) : null}
        {children}
      </div>
    </Box>
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
            <Box component="h2" className="text-base font-semibold tracking-tight" sx={{ color: "text.primary" }}>{title}</Box>
            {description ? <Box component="p" className="mt-1 text-xs" sx={{ color: "text.secondary" }}>{description}</Box> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
        {children}
      </div>
    </Card>
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
