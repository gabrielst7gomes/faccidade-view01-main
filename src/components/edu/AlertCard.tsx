import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

type AlertVariant = 'warning' | 'danger' | 'info' | 'success';

interface AlertCardProps {
  variant?: AlertVariant;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const CONFIG: Record<AlertVariant, { icon: React.ReactNode; bg: string; border: string; titleColor: string }> = {
  warning: {
    icon: <AlertTriangle size={16} />,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    titleColor: 'text-amber-800',
  },
  danger: {
    icon: <XCircle size={16} />,
    bg: 'bg-red-50',
    border: 'border-red-200',
    titleColor: 'text-red-800',
  },
  info: {
    icon: <Info size={16} />,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    titleColor: 'text-blue-800',
  },
  success: {
    icon: <CheckCircle size={16} />,
    bg: 'bg-green-50',
    border: 'border-green-200',
    titleColor: 'text-green-800',
  },
};

export function AlertCard({ variant = 'info', title, description, action }: AlertCardProps) {
  const cfg = CONFIG[variant];
  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 ${cfg.bg} ${cfg.border}`}>
      <span className={cfg.titleColor}>{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${cfg.titleColor}`}>{title}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function EduPageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-black text-[#1A3A6E]">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function Badge({
  children,
  color = 'gray',
}: {
  children: React.ReactNode;
  color?: 'gray' | 'blue' | 'green' | 'red' | 'yellow' | 'orange';
}) {
  const colors = {
    gray: 'bg-slate-100 text-slate-600',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-amber-100 text-amber-700',
    orange: 'bg-orange-100 text-orange-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${colors[color]}`}>
      {children}
    </span>
  );
}
