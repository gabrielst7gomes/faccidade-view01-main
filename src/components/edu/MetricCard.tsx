interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  sub?: string;
}

export function MetricCard({ label, value, icon, color = '#1A3A6E', sub }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-start gap-4">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{label}</p>
        <p className="text-2xl font-black text-slate-800 leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-start gap-4 animate-pulse">
      <div className="w-11 h-11 rounded-xl bg-slate-200 shrink-0" />
      <div className="flex-1">
        <div className="h-3 bg-slate-200 rounded w-24 mb-2" />
        <div className="h-7 bg-slate-200 rounded w-16" />
      </div>
    </div>
  );
}
