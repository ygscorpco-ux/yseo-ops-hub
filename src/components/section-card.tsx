import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionCardProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function SectionCard({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      <header className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {eyebrow}
            </p>
          ) : null}
          <h3 className="text-base font-semibold tracking-tight text-slate-950">
            {title}
          </h3>
          {description ? (
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      </header>
      <div className={cn("px-4 py-3.5 text-sm leading-6 text-slate-700", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
