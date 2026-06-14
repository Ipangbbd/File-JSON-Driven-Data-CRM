import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
}

export function PageHeader({ title, description, actions, meta }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 py-6 min-h-[56px]">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
        {meta && <div className="mt-2">{meta}</div>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
