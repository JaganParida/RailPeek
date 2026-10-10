import { Info, AlertTriangle, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Alert({
  children,
  variant = 'info',
  title,
  onClose,
  className,
  ...props
}) {
  const configs = {
    info: {
      icon: Info,
      wrapper:
        'bg-brand-50/70 dark:bg-brand-950/40 border-brand-200 dark:border-brand-800 text-brand-900 dark:text-brand-200',
      iconClass: 'text-brand-600 dark:text-brand-400',
    },
    warning: {
      icon: AlertTriangle,
      wrapper:
        'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200',
      iconClass: 'text-amber-600 dark:text-amber-400',
    },
    success: {
      icon: CheckCircle2,
      wrapper:
        'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200',
      iconClass: 'text-emerald-600 dark:text-emerald-400',
    },
    danger: {
      icon: AlertCircle,
      wrapper:
        'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200',
      iconClass: 'text-rose-600 dark:text-rose-400',
    },
  };

  const config = configs[variant] || configs.info;
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border text-xs leading-relaxed transition-colors',
        config.wrapper,
        className
      )}
      {...props}
    >
      <Icon className={cn('w-4 h-4 shrink-0 mt-0.5', config.iconClass)} />
      <div className="flex-1 space-y-0.5">
        {title && <p className="font-semibold text-xs tracking-tight">{title}</p>}
        <div>{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-current opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss alert"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
