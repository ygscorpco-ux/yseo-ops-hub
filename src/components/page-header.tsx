import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? (
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {eyebrow}
            </div>
          ) : null}
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}
