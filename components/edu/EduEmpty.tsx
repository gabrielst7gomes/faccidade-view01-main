import { Inbox } from 'lucide-react';

interface EduEmptyProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EduEmpty({
  title = 'Nenhum dado encontrado',
  description = 'Não há itens para exibir no momento.',
  action,
  icon,
}: EduEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        {icon ?? <Inbox size={28} />}
      </div>
      <h3 className="text-base font-bold text-slate-700">{title}</h3>
      <p className="text-sm text-slate-400 mt-1 max-w-xs">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-slate-100 rounded-lg mb-2" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 mb-2">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="flex-1 h-8 bg-slate-100 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
          <div className="h-3 bg-slate-100 rounded w-1/2 mb-2" />
          <div className="h-3 bg-slate-100 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}
