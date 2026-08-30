import React, { useEffect, useState } from 'react';
import {
  Search,
  X,
  User,
  Calendar,
  BookOpen,
  DollarSign,
  FileText,
  Sparkles,
  ArrowRight,
  GraduationCap,
  CheckSquare,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateTurkish, formatCurrency } from '../../utils/formatters';

interface UniversalSearchModalProps {
  onClose: () => void;
  onNavigate: (view: string) => void;
}

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({
  onClose,
  onNavigate,
}) => {
  const { students, lessons, assignments, exams, documents, tasks, transactions, openModal } = useApp();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const cleanQuery = query.toLowerCase().trim();

  const matchedStudents = cleanQuery
    ? students.filter(
        (s) =>
          s.firstName.toLowerCase().includes(cleanQuery) ||
          s.lastName.toLowerCase().includes(cleanQuery) ||
          s.parentName?.toLowerCase().includes(cleanQuery) ||
          s.gradeLevel.toLowerCase().includes(cleanQuery) ||
          s.academicGoal?.toLowerCase().includes(cleanQuery)
      )
    : [];

  const matchedLessons = cleanQuery
    ? lessons.filter(
        (l) =>
          l.topic?.toLowerCase().includes(cleanQuery) ||
          l.subtopic?.toLowerCase().includes(cleanQuery) ||
          l.notes?.toLowerCase().includes(cleanQuery) ||
          l.date.includes(cleanQuery)
      )
    : [];

  const matchedAssignments = cleanQuery
    ? assignments.filter(
        (a) =>
          (a.title || '').toLowerCase().includes(cleanQuery) ||
          a.topic.toLowerCase().includes(cleanQuery) ||
          a.resourceName.toLowerCase().includes(cleanQuery)
      )
    : [];

  const matchedExams = cleanQuery
    ? exams.filter(
        (e) =>
          e.examName.toLowerCase().includes(cleanQuery) ||
          e.notes?.toLowerCase().includes(cleanQuery)
      )
    : [];

  const matchedDocuments = cleanQuery ? documents.filter((d) =>
    d.title.toLowerCase().includes(cleanQuery) ||
    d.description?.toLowerCase().includes(cleanQuery) ||
    d.tags?.some((t) => t.toLowerCase().includes(cleanQuery))
  ) : [];

  const matchedTasks = cleanQuery ? tasks.filter((t) =>
    t.title.toLowerCase().includes(cleanQuery) ||
    t.description?.toLowerCase().includes(cleanQuery) ||
    t.category.toLowerCase().includes(cleanQuery)
  ) : [];

  const matchedTransactions = cleanQuery ? transactions.filter((t) =>
    t.description.toLowerCase().includes(cleanQuery) ||
    String(t.amount).includes(cleanQuery)
  ) : [];

  const hasResults =
    matchedStudents.length > 0 || matchedLessons.length > 0 || matchedAssignments.length > 0 ||
    matchedExams.length > 0 || matchedDocuments.length > 0 || matchedTasks.length > 0 || matchedTransactions.length > 0;

  return (
    <div className="modal-overlay fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Öğrenci, ders, konu, ödev, sınav, doküman, görev veya finans kaydı ara..."
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
          {!query && (
            <div className="py-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Aramak istediğiniz anahtar kelimeyi yazın
              </p>
              <p className="text-[11px] text-slate-400">
                Örn: "Kerem", "Üslü Sayılar", "LGS Deneme", "Ödev"
              </p>
            </div>
          )}

          {query && !hasResults && (
            <div className="py-8 text-center text-xs text-slate-400">
              "{query}" ile eşleşen kayıt bulunamadı.
            </div>
          )}

          {/* Matched Students */}
          {matchedStudents.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Öğrenciler ({matchedStudents.length})
              </div>
              <div className="space-y-1">
                {matchedStudents.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onClose();
                      openModal('studentProfile', { student: s });
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left border border-transparent hover:border-slate-200 dark:hover:border-slate-700 flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                        {s.firstName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {s.firstName} {s.lastName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {s.gradeLevel} • Veli: {s.parentName || '-'} ({s.parentPhone || '-'})
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-indigo-600 font-semibold flex items-center gap-1">
                      <span>Profile Git</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Lessons */}
          {matchedLessons.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Dersler & Konular ({matchedLessons.length})
              </div>
              <div className="space-y-1">
                {matchedLessons.map((l) => {
                  const st = students.find((s) => s.id === l.studentId);
                  return (
                    <button
                      key={l.id}
                      onClick={() => {
                        onClose();
                        onNavigate('calendar');
                      }}
                      className="w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left border border-transparent hover:border-slate-200 dark:hover:border-slate-700 flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {l.topic || 'Matematik Dersi'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {st ? `${st.firstName} ${st.lastName}` : ''} • {formatDateTurkish(l.date, 'short')} ({l.startTime})
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-md">
                        {l.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}


          {matchedExams.length > 0 && <div className="space-y-1.5"><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Sınavlar ({matchedExams.length})</div>{matchedExams.map(e => <button key={e.id} onClick={() => { onClose(); onNavigate('exams'); }} className="w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left flex items-center gap-3"><Sparkles className="w-4 h-4 text-violet-600"/><div><div className="text-xs font-bold">{e.examName}</div><div className="text-[11px] text-slate-500">{formatDateTurkish(e.date, 'short')} • {e.netScore} net</div></div></button>)}</div>}
          {matchedDocuments.length > 0 && <div className="space-y-1.5"><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Dokümanlar ({matchedDocuments.length})</div>{matchedDocuments.map(d => <button key={d.id} onClick={() => { onClose(); onNavigate('documents'); }} className="w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left flex items-center gap-3"><FileText className="w-4 h-4 text-blue-600"/><div><div className="text-xs font-bold">{d.title}</div><div className="text-[11px] text-slate-500">{d.fileType}</div></div></button>)}</div>}
          {matchedTasks.length > 0 && <div className="space-y-1.5"><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Görevler ({matchedTasks.length})</div>{matchedTasks.map(t => <button key={t.id} onClick={() => { onClose(); onNavigate('tasks'); }} className="w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left flex items-center gap-3"><CheckSquare className="w-4 h-4 text-emerald-600"/><div><div className="text-xs font-bold">{t.title}</div><div className="text-[11px] text-slate-500">{t.category} • {t.status}</div></div></button>)}</div>}
          {matchedTransactions.length > 0 && <div className="space-y-1.5"><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Finans ({matchedTransactions.length})</div>{matchedTransactions.map(t => <button key={t.id} onClick={() => { onClose(); onNavigate('finance'); }} className="w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left flex items-center gap-3"><DollarSign className="w-4 h-4 text-emerald-600"/><div><div className="text-xs font-bold">{t.description}</div><div className="text-[11px] text-slate-500">{formatCurrency(t.amount)} • {formatDateTurkish(t.date, 'short')}</div></div></button>)}</div>}

          {/* Matched Assignments */}
          {matchedAssignments.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Ödevler ({matchedAssignments.length})
              </div>
              <div className="space-y-1">
                {matchedAssignments.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      onClose();
                      onNavigate('assignments');
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left border border-transparent hover:border-slate-200 dark:hover:border-slate-700 flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {a.title}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {a.resourceName} • Teslim: {formatDateTurkish(a.dueDate, 'short')}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-800 rounded-md">
                      {a.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Kapatmak için ESC tuşuna basın</span>
          <button
            onClick={onClose}
            className="font-bold text-slate-600 dark:text-slate-300 hover:underline"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
