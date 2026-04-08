import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center",
        className,
      )}
    >
      <div className="mx-auto max-w-md space-y-2">
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
