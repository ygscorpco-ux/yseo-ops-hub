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
      <header
        className={cn(
          "border-b border-slate-200 px-4",
          eyebrow ? "py-3" : "py-2.5",
        )}
      >
        <div className="flex min-h-8 flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="mb-1 text-[11px] font-semibold tracking-[0.14em] text-slate-500">
                {eyebrow}
              </p>
            ) : null}
            <h3 className="text-base font-semibold tracking-tight text-slate-950">
              {title}
            </h3>
            {description ? (
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
        </div>
      </header>
      <div
        className={cn(
          "space-y-3 px-4 py-3.5 text-sm leading-6 text-slate-700",
          bodyClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
