import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

import { HocLieuLink as Link } from "@/features/hoclieu/components/hoclieu-link";

type HeroAction = {
  label: string;
  href: string;
  icon?: LucideIcon;
  variant?: "primary" | "secondary";
};

type HeroStat = {
  label: string;
  value: string;
};

export function HocLieuPageHero({
  eyebrow,
  title,
  description,
  stats,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  stats: HeroStat[];
  actions?: HeroAction[];
}) {
  return (
    <section className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
      <div className="mx-auto grid max-w-[92rem] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:py-16">
        <div className="space-y-6">
          <div className="inline-flex items-center rounded-full border border-[var(--erg-blue)]/10 bg-[var(--erg-blue)]/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-[var(--erg-blue)]">
            {eyebrow}
          </div>
          <div className="space-y-4">
            <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-5xl xl:text-6xl">
              {title}
            </h1>
            <p className="max-w-3xl text-base leading-8 text-slate-600 md:text-lg">{description}</p>
          </div>
          {actions && actions.length > 0 ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              {actions.map((action) => {
                const ActionIcon = action.icon;
                const isPrimary = action.variant !== "secondary";

                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={
                      isPrimary
                        ? "inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--erg-blue)] px-6 py-3.5 text-sm font-black uppercase tracking-[0.16em] text-white transition-all hover:-translate-y-0.5 hover:bg-slate-950"
                        : "inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-black uppercase tracking-[0.16em] text-slate-800 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
                    }
                  >
                    {ActionIcon ? <ActionIcon className="h-4 w-4" /> : null}
                    {action.label}
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_32px_70px_-38px_rgba(15,23,42,0.35)]">
          <div className="rounded-[24px] bg-[linear-gradient(145deg,var(--erg-blue)_0%,#2949d4_50%,var(--erg-red)_100%)] p-6 text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/70">Học liệu snapshot</p>
            <div className="mt-5 grid gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/65">{stat.label}</p>
                  <p className="mt-2 text-2xl font-black">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HocLieuSection({
  eyebrow,
  title,
  description,
  children,
  tone = "default",
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  tone?: "default" | "muted" | "dark";
}) {
  const sectionClass =
    tone === "muted" ? "bg-slate-50" : tone === "dark" ? "bg-slate-950 text-white" : "bg-white";

  return (
    <section className={`${sectionClass} py-16 lg:py-20`}>
      <div className="mx-auto max-w-[92rem] px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-4">
          <p className={`text-[10px] font-black uppercase tracking-[0.32em] ${tone === "dark" ? "text-white/55" : "text-[var(--erg-red)]"}`}>
            {eyebrow}
          </p>
          <h2 className={`text-3xl font-black tracking-tight md:text-4xl ${tone === "dark" ? "text-white" : "text-slate-950"}`}>{title}</h2>
          <p className={`text-base leading-8 ${tone === "dark" ? "text-white/72" : "text-slate-600"}`}>{description}</p>
        </div>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

export function HocLieuCardGrid({
  items,
}: {
  items: Array<{
    title: string;
    description: string;
    meta?: string;
    href?: string;
    tags?: string[];
    ctaLabel?: string;
  }>;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={`${item.title}-${item.meta ?? ""}`} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          {item.meta ? (
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{item.meta}</p>
          ) : null}
          <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">{item.title}</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
          {item.tags && item.tags.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          {item.href ? (
            <Link
              href={item.href}
              className="mt-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--erg-blue)] transition-all hover:gap-3"
            >
              {item.ctaLabel ?? "Mở chi tiết"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function HocLieuTimeline({
  items,
}: {
  items: Array<{ title: string; detail: string; meta?: string }>;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {items.map((item, index) => (
        <div key={`${item.title}-${index}`} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-4xl font-black text-[var(--erg-blue)]/15">{String(index + 1).padStart(2, "0")}</span>
            {item.meta ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                {item.meta}
              </span>
            ) : null}
          </div>
          <h3 className="mt-6 text-2xl font-black tracking-tight text-slate-950">{item.title}</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
        </div>
      ))}
    </div>
  );
}
