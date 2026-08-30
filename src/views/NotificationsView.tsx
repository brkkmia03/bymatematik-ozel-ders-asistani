import React, { useMemo, useState } from 'react';
import { Bell, CheckCheck, Trash2, Clock3, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateTurkish } from '../utils/formatters';

const FILTERS = ['Tümü', 'Dersler', 'Ödevler', 'Sınavlar', 'Finans', 'Materyaller'] as const;

const categoryForType = (type: string) => {
  if (type.includes('Ders')) return 'Dersler';
  if (type.includes('Ödev')) return 'Ödevler';
  if (type.includes('Yazılı') || type.includes('Sınav')) return 'Sınavlar';
  if (type.includes('Ödeme') || type.includes('Paket')) return 'Finans';
  if (type.includes('Materyal') || type.includes('Görev')) return 'Materyaller';
  return 'Tümü';
};

export const NotificationsView: React.FC<{ onNavigate?: (view: string) => void }> = ({ onNavigate }) => {
  const { notifications, markNotificationRead, markAllNotificationsRead, deleteNotification, snoozeNotification, completeNotification } = useApp();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Tümü');

  const visible = useMemo(() => notifications
    .filter(n => !n.snoozedUntil || new Date(n.snoozedUntil).getTime() <= Date.now())
    .filter(n => filter === 'Tümü' || categoryForType(n.type) === filter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [notifications, filter]);

  const unread = notifications.filter(n => !n.isRead && !n.isCompleted).length;

  return <div className="space-y-6 pb-12">
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-display flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" /> Bildirim Merkezi
          </h1>
          <p className="text-xs text-slate-500 mt-1">Ders, ödev, sınav, finans ve materyal uyarılarını tek yerde yönetin.</p>
        </div>
        <button onClick={markAllNotificationsRead} disabled={!unread} className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-2 disabled:opacity-40">
          <CheckCheck className="w-4 h-4" /> Tümünü Okundu Say
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1"><Filter className="w-3.5 h-3.5"/> Filtre:</span>
        {FILTERS.map(f => <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>{f}</button>)}
      </div>
    </div>

    <div className="space-y-3">
      {visible.length === 0 ? <div className="p-10 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-400">Bu filtrede aktif bildirim bulunmuyor.</div> : visible.map(n => <div key={n.id} className={`p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border ${n.isCompleted ? 'border-emerald-200 dark:border-emerald-900 opacity-70' : !n.isRead ? 'border-indigo-300 dark:border-indigo-800' : 'border-slate-200 dark:border-slate-800'}`}>
        <div className="flex items-start justify-between gap-4">
          <button className="text-left flex-1" onClick={() => { markNotificationRead(n.id); if (n.linkTab && onNavigate) onNavigate(n.linkTab); }}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-black text-slate-900 dark:text-white">{n.title}</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500">{n.type}</span>
              {n.isCompleted && <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">Tamamlandı</span>}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{n.message}</p>
            <span className="text-[10px] text-slate-400 mt-2 block">{formatDateTurkish(n.date, 'short')}</span>
          </button>
          <button onClick={() => deleteNotification(n.id)} className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40" title="Bildirimi sil"><Trash2 className="w-4 h-4"/></button>
        </div>
        {!n.isCompleted && <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button onClick={() => completeNotification(n.id)} className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">Tamamlandı</button>
          <button onClick={() => snoozeNotification(n.id, 60)} className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1"><Clock3 className="w-3.5 h-3.5"/>1 Saat Sonra</button>
          <button onClick={() => snoozeNotification(n.id, 24 * 60)} className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold">Yarın</button>
        </div>}
      </div>)}
    </div>
  </div>;
};
