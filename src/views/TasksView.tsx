import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  Tag,
  Trash2,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateTurkish } from '../utils/formatters';

export const TasksView: React.FC = () => {
  const { students, tasks, toggleTaskCompletion, deleteTask, openModal } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredTasks = tasks.filter((t) => {
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  const pendingTasks = filteredTasks.filter((t) => t.status !== 'Kullanıldı');
  const completedTasks = filteredTasks.filter((t) => t.status === 'Kullanıldı');

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-display flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-rose-600" />
              <span>Yapılacak Materyaller & Görevler</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Föy hazırlığı, soru seçimi, veli aramaları ve ders materyali üretimi görev listesi
            </p>
          </div>

          <button
            onClick={() => openModal('addTask')}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 flex items-center gap-2 transition-all active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Görev / Föy Ekle</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs font-semibold p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">Tüm Kategoriler</option>
            <option value="Yazılı Provası">Yazılı Provası</option>
            <option value="Çalışma Kağıdı">Çalışma Kağıdı</option>
            <option value="Test Hazırlığı">Test Hazırlığı</option>
            <option value="Tekrar Föyü">Tekrar Föyü</option>
            <option value="Konu Özeti">Konu Özeti</option>
            <option value="Genel Görev">Genel Görev</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs font-semibold p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">Tüm Öncelikler</option>
            <option value="Yüksek">🚨 Yüksek Öncelik</option>
            <option value="Normal">🟡 Normal Öncelik</option>
            <option value="Düşük">🟢 Düşük Öncelik</option>
          </select>
        </div>
      </div>

      {/* Pending Tasks Section */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <span>Bekleyen Görevler</span>
          <span className="text-xs font-black bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
            {pendingTasks.length}
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pendingTasks.map((task) => {
            const student = students.find((s) => s.id === task.studentId);
            return (
              <div
                key={task.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3 flex-1">
                  <button
                    onClick={() => toggleTaskCompletion(task.id)}
                    className="mt-0.5 w-6 h-6 rounded-lg border-2 border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50 text-emerald-600 flex items-center justify-center transition-colors"
                  >
                    <Check className="w-4 h-4 opacity-0 hover:opacity-100" />
                  </button>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                          task.priority === 'Yüksek'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : task.priority === 'Normal'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {task.priority}
                      </span>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                        {task.category}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="text-xs text-slate-500">{task.description}</p>
                    )}

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                      <span>📅 Son: {formatDateTurkish(task.dueDate, 'short')}</span>
                      {student && <span>• 👤 {student.firstName} {student.lastName}</span>}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 transition-colors"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completed Tasks Accordion */}
      {completedTasks.length > 0 && (
        <div className="pt-4 space-y-3">
          <h2 className="text-sm font-bold text-slate-500 flex items-center gap-2">
            <span>Tamamlanan Görevler</span>
            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {completedTasks.length}
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-60">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleTaskCompletion(task.id)}
                    className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <span className="line-through text-slate-500">{task.title}</span>
                </div>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-slate-400 hover:text-rose-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
