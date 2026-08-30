import React from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ToastViewport: React.FC = () => {
  const { toasts, dismissToast } = useApp();
  if (!toasts.length) return null;

  const meta = {
    success: { icon: CheckCircle2, box: 'border-emerald-200 dark:border-emerald-900 bg-white dark:bg-slate-900', iconClass: 'text-emerald-600' },
    warning: { icon: AlertTriangle, box: 'border-amber-200 dark:border-amber-900 bg-white dark:bg-slate-900', iconClass: 'text-amber-600' },
    error: { icon: XCircle, box: 'border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-900', iconClass: 'text-rose-600' },
    info: { icon: Info, box: 'border-blue-200 dark:border-blue-900 bg-white dark:bg-slate-900', iconClass: 'text-blue-600' },
  } as const;

  return (
    <div className="fixed z-[100] top-20 right-3 sm:right-5 w-[calc(100%-1.5rem)] sm:w-[360px] space-y-2 pointer-events-none" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => {
        const cfg = meta[toast.type];
        const Icon = cfg.icon;
        return (
          <div key={toast.id} className={`pointer-events-auto rounded-2xl border shadow-xl p-3.5 flex gap-3 ${cfg.box}`} role={toast.type === 'error' ? 'alert' : 'status'}>
            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${cfg.iconClass}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-900 dark:text-white">{toast.title}</p>
              {toast.message && <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>}
            </div>
            <button onClick={() => dismissToast(toast.id)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Bildirimi kapat">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
