import { toLocalDateInputValue } from '../utils/formatters';
import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  Filter,
  Calendar,
  User,
  Trash2,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateTurkish } from '../utils/formatters';
import { Assignment } from '../types';

export const AssignmentsView: React.FC = () => {
  const { students, assignments, updateAssignment, deleteAssignment, openModal } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [studentFilter, setStudentFilter] = useState<string>('all');

  // Filter assignments
  const filteredAssignments = assignments.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (studentFilter !== 'all' && a.studentId !== studentFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.topic.toLowerCase().includes(q) ||
        a.resourceName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStatusChange = (
    assignmentId: string,
    newStatus: Assignment['status'],
    notes?: string
  ) => {
    updateAssignment(assignmentId, {
      status: newStatus,
      completedDate:
        newStatus === 'Tamamlandı' || newStatus === 'Kontrol Edildi'
          ? toLocalDateInputValue()
          : undefined,
      teacherFeedback: notes,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-display flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-amber-500" />
              <span>Ödev Sistemi & Takip</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Öğrencilere verilen kaynak föyleri, soru sayıları, teslim tarihleri ve kontrol durumları
            </p>
          </div>

          <button
            onClick={() => openModal('addAssignment')}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Ödev Tanımla</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ödev veya konu ara..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Student Filter */}
            <select
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              className="text-xs font-semibold p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">Tüm Öğrenciler</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="Bekliyor">Bekliyor</option>
              <option value="Yapılıyor">Yapılıyor</option>
              <option value="Tamamlandı">Tamamlandı</option>
              <option value="Kontrol Edildi">Kontrol Edildi</option>
              <option value="Eksik">Eksik</option>
              <option value="Yapılmadı">Yapılmadı</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Toplam <strong>{filteredAssignments.length}</strong> ödev listeleniyor
          </div>
        </div>
      </div>

      {/* Assignment List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAssignments.map((asn) => {
          const student = students.find((s) => s.id === asn.studentId);
          const isOverdue =
            new Date(asn.dueDate).getTime() < new Date().getTime() &&
            asn.status !== 'Tamamlandı' &&
            asn.status !== 'Kontrol Edildi';

          return (
            <div
              key={asn.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Status Badge & Due Date */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      asn.status === 'Tamamlandı' || asn.status === 'Kontrol Edildi'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : asn.status === 'Yapılmadı'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : isOverdue
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {asn.status} {isOverdue && '⚠️ (Gecikti)'}
                  </span>

                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Teslim: {formatDateTurkish(asn.dueDate, 'short')}</span>
                  </span>
                </div>

                {/* Title & Student */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {asn.title}
                  </h3>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                    👤 {student ? `${student.firstName} ${student.lastName} (${student.gradeLevel})` : 'Öğrenci'}
                  </div>
                </div>

                {/* Assignment Details Box */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">📖 Kaynak Kitap:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{asn.resourceName}</span>
                  </div>
                  {asn.pages && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">📄 Sayfa & Test:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{asn.pages} {asn.questionNumbers ? `(${asn.questionNumbers})` : ''}</span>
                    </div>
                  )}
                  {asn.questionCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">🎯 Soru Sayısı:</span>
                      <span className="font-bold text-indigo-600">{asn.questionCount} Soru</span>
                    </div>
                  )}
                  {asn.description && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-700">
                      💡 <strong>Talimat:</strong> {asn.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons: Status updates & WhatsApp */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                {/* Status Toggle Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStatusChange(asn.id, 'Kontrol Edildi')}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] flex items-center gap-1 transition-colors"
                    title="Ödevi Kontrol Edildi Olarak İşaretle"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Kontrol Et</span>
                  </button>

                  <button
                    onClick={() => handleStatusChange(asn.id, 'Eksik')}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[11px] transition-colors"
                  >
                    Eksik
                  </button>

                  <button
                    onClick={() => handleStatusChange(asn.id, 'Yapılmadı')}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition-colors"
                  >
                    Yapılmadı
                  </button>
                </div>

                {/* WhatsApp & Delete Buttons */}
                <div className="flex items-center gap-1.5">
                  {student && (
                    <button
                      onClick={() =>
                        openModal('whatsapp', {
                          student,
                          assignment: asn,
                          templateType: 'assignment',
                        })
                      }
                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="Veliye WhatsApp Hatırlatması Gönder"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => deleteAssignment(asn.id)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 transition-colors"
                    title="Ödevi Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
