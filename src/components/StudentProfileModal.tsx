import React, { useMemo, useState } from 'react';
import {
  X,
  Calendar,
  ClipboardList,
  CreditCard,
  FileText,
  MessageSquare,
  PlayCircle,
  BookOpen,
  Target,
  TrendingUp,
  WalletCards,
  StickyNote,
  FolderOpen,
  School,
  Phone,
  UserRound,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Edit2,
  Archive,
  RotateCcw,
} from 'lucide-react';
import { Student } from '../types';
import { useApp } from '../context/AppContext';
import {
  calculateStudentStats,
  formatCurrency,
  formatDateTurkish,
  normalizePhoneNumber,
  toLocalDateInputValue,
} from '../utils/formatters';

interface StudentProfileModalProps {
  student: Student;
  onClose: () => void;
}

type ProfileTab =
  | 'overview'
  | 'lessons'
  | 'assignments'
  | 'topics'
  | 'exams'
  | 'goals'
  | 'written'
  | 'finance'
  | 'notes'
  | 'documents';

const tabs: { id: ProfileTab; label: string }[] = [
  { id: 'overview', label: 'Genel Bakış' },
  { id: 'lessons', label: 'Dersler' },
  { id: 'assignments', label: 'Ödevler' },
  { id: 'topics', label: 'Konular' },
  { id: 'exams', label: 'Sınavlar' },
  { id: 'goals', label: 'Hedefler' },
  { id: 'written', label: 'Yazılılar' },
  { id: 'finance', label: 'Finans' },
  { id: 'notes', label: 'Notlar' },
  { id: 'documents', label: 'Dokümanlar' },
];

const statusBadge = (status: string) => {
  if (status === 'Tamamlandı' || status === 'Kontrol Edildi' || status === 'Hazır') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300';
  if (status.includes('Gerekli') || status === 'Eksik' || status === 'Yapılmadı') return 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300';
  if (status === 'İşleniyor' || status === 'Yapılıyor' || status === 'Yaklaşıyor') return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
};

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ student, onClose }) => {
  const {
    lessons,
    lessonNotes,
    assignments,
    topicProgress,
    goals,
    addGoal,
    updateGoalStatus,
    deleteGoal,
    examResults,
    writtenExams,
    writtenPreparations,
    documents,
    packages,
    transactions,
    archiveStudent,
    restoreStudent,
    openModal,
  } = useApp();
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalType, setGoalType] = useState<'Net Hedefi' | 'Puan Hedefi' | 'Yazılı Notu' | 'Konu Tamamlama' | 'Ödev Tamamlama'>('Net Hedefi');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDate, setGoalDate] = useState('');

  const stats = useMemo(
    () => calculateStudentStats(student.id, lessons, assignments, examResults, packages, transactions),
    [student.id, lessons, assignments, examResults, packages, transactions]
  );

  const studentLessons = useMemo(
    () => lessons.filter((l) => l.studentId === student.id).sort((a, b) => `${b.date}T${b.startTime}`.localeCompare(`${a.date}T${a.startTime}`)),
    [lessons, student.id]
  );
  const studentAssignments = useMemo(
    () => assignments.filter((a) => a.studentId === student.id).sort((a, b) => b.dueDate.localeCompare(a.dueDate)),
    [assignments, student.id]
  );
  const studentTopics = useMemo(
    () => topicProgress.filter((p) => p.studentId === student.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [topicProgress, student.id]
  );
  const studentExams = useMemo(
    () => examResults.filter((e) => e.studentId === student.id).sort((a, b) => b.date.localeCompare(a.date)),
    [examResults, student.id]
  );
  const studentWritten = useMemo(
    () => writtenExams.filter((w) => w.studentId === student.id).sort((a, b) => b.date.localeCompare(a.date)),
    [writtenExams, student.id]
  );
  const studentTransactions = useMemo(
    () => transactions.filter((t) => t.studentId === student.id && !t.isCancelled).sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, student.id]
  );
  const studentDocuments = useMemo(
    () => documents.filter((d) => d.studentIds.includes(student.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [documents, student.id]
  );
  const studentLessonNotes = useMemo(
    () => lessonNotes.filter((n) => n.studentId === student.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [lessonNotes, student.id]
  );

  const studentGoals = useMemo(
    () => goals.filter((g) => g.studentId === student.id).sort((a, b) => (a.status === 'Aktif' ? -1 : 1) || b.updatedAt.localeCompare(a.updatedAt)),
    [goals, student.id]
  );

  const examTrend = useMemo(() => [...studentExams].sort((a, b) => a.date.localeCompare(b.date)).slice(-8), [studentExams]);
  const weakTopics = useMemo(() => {
    const score = new Map<string, number>();
    studentTopics.forEach((p) => {
      const risk = (p.status === 'Tekrar Gerekli' ? 40 : 0) + (p.status === 'Soru Çözümü Gerekli' ? 30 : 0) + (p.status === 'Denemeyle Pekiştirilecek' ? 20 : 0) + Math.max(0, 70 - p.masteryPercentage);
      if (risk > 0) score.set(p.topicTitle, (score.get(p.topicTitle) || 0) + risk);
    });
    studentExams.forEach((e) => (e.incorrectTopics || []).forEach((topic) => score.set(topic, (score.get(topic) || 0) + 25)));
    return [...score.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [studentTopics, studentExams]);

  const topicCompletion = studentTopics.length
    ? Math.round((studentTopics.filter((p) => p.status === 'Tamamlandı').length / studentTopics.length) * 100)
    : 0;
  const uncheckedAssignments = studentAssignments.filter((a) => !['Kontrol Edildi', 'Tamamlandı'].includes(a.status));
  const overdueAssignments = uncheckedAssignments.filter((a) => a.dueDate < toLocalDateInputValue());
  const phone = normalizePhoneNumber(student.parentPhone);

  const targetNet = studentExams.find((e) => typeof e.targetNet === 'number')?.targetNet;
  const latestNet = stats.latestExam?.netScore;

  const openForStudent = (modalName: string, payload: Record<string, unknown> = {}) => {
    openModal(modalName, { initialStudentId: student.id, student, ...payload });
  };

  const renderEmpty = (text: string) => (
    <div className="py-10 text-center text-sm text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
      {text}
    </div>
  );

  return (
    <div className="modal-overlay fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="min-h-full sm:min-h-0 sm:max-w-6xl sm:mx-auto sm:my-4 bg-white dark:bg-slate-900 sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
          <div className="p-4 sm:p-6 flex items-start gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-black text-lg flex items-center justify-center shadow-sm">
              {student.firstName.charAt(0)}{student.lastName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                  {student.firstName} {student.lastName}
                </h2>
                {student.isArchived && <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">ARŞİV</span>}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {student.gradeLevel}{student.targetExam ? ` • ${student.targetExam}` : ''}{student.schoolName ? ` • ${student.schoolName}` : ''}
              </p>
            </div>
            <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500" aria-label="Profili kapat">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 sm:px-6 pb-4 flex flex-wrap gap-2">
            <button onClick={() => openForStudent('addLesson')} className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/>Yeni Ders</button>
            <button onClick={() => openForStudent('addAssignment')} className="px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5"><ClipboardList className="w-3.5 h-3.5"/>Ödev Ver</button>
            <button onClick={() => openForStudent('addPayment')} className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5"/>Ödeme Gir</button>
            <button onClick={() => openModal('whatsapp', { student, templateType: 'lesson_report' })} className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5"/>WhatsApp</button>
            <button onClick={() => openModal('pdfPreview', { reportType: 'student_full_record', student })} className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5"><FileText className="w-3.5 h-3.5"/>PDF</button>
            <button
              disabled={!stats.nextLesson}
              onClick={() => stats.nextLesson && openModal('preLessonSummary', { lesson: stats.nextLesson, student })}
              className="px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              title={stats.nextLesson ? 'Sıradaki ders için özeti aç' : 'Planlanmış yaklaşan ders bulunmuyor'}
            ><PlayCircle className="w-3.5 h-3.5"/>Ders Öncesi Özet</button>
            <button onClick={() => openModal('addStudent', { studentToEdit: student })} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5"><Edit2 className="w-3.5 h-3.5"/>Düzenle</button>
          </div>

          <div className="px-4 sm:px-6 overflow-x-auto no-scrollbar">
            <div className="flex min-w-max gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2.5 text-xs font-bold border-b-2 transition-colors ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  ['Tamamlanan Ders', `${stats.totalLessonCount}`, `${stats.totalLessonHours} saat`],
                  ['Ödev Tamamlama', stats.totalAssignmentsCount ? `%${stats.homeworkCompletionRate}` : '—', `${stats.completedAssignmentsCount}/${stats.totalAssignmentsCount}`],
                  ['Konu İlerlemesi', studentTopics.length ? `%${topicCompletion}` : '—', `${studentTopics.filter(p => p.status === 'Tamamlandı').length}/${studentTopics.length} tamamlandı`],
                  ['Bekleyen Bakiye', formatCurrency(Math.max(0, stats.finance.balance)), stats.finance.balance <= 0 ? 'Borç yok' : 'Tahsilat bekliyor'],
                ].map(([title, value, sub]) => (
                  <div key={title} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{title}</p>
                    <p className="text-xl font-black mt-1 text-slate-900 dark:text-white">{value}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{sub}</p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                  <h3 className="font-black text-sm flex items-center gap-2"><Clock3 className="w-4 h-4 text-indigo-600"/>Ders Özeti</h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60"><span className="text-slate-400 block">Son ders</span><strong>{stats.lastLesson ? `${formatDateTurkish(stats.lastLesson.date)} • ${stats.lastLesson.topic || 'Matematik'}` : 'Kayıt yok'}</strong></div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60"><span className="text-slate-400 block">Sıradaki ders</span><strong>{stats.nextLesson ? `${formatDateTurkish(stats.nextLesson.date)} • ${stats.nextLesson.startTime}` : 'Planlanmadı'}</strong></div>
                  </div>
                  {uncheckedAssignments.length > 0 && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5"/><span><strong>{uncheckedAssignments.length} kontrol/bitiş bekleyen ödev</strong>{overdueAssignments.length ? ` • ${overdueAssignments.length} tanesi gecikmiş` : ''}</span>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                  <h3 className="font-black text-sm flex items-center gap-2"><UserRound className="w-4 h-4 text-indigo-600"/>İletişim ve Ders Bilgileri</h3>
                  <div className="grid sm:grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-400 block">Veli</span><strong>{student.parentName || '-'}</strong>{student.parentRelationship ? ` • ${student.parentRelationship}` : ''}</div>
                    <div><span className="text-slate-400 block">Veli telefonu</span><strong>{phone.formatted || student.parentPhone || '-'}</strong></div>
                    <div><span className="text-slate-400 block">Ders biçimi</span><strong>{student.lessonType}</strong></div>
                    <div><span className="text-slate-400 block">Ücret</span><strong>{formatCurrency(student.lessonFee)} • {student.feeType}</strong></div>
                  </div>
                  {stats.activePackage && <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-xs"><strong>{stats.activePackage.packageName}</strong> • {stats.activePackage.remainingLessons} ders kaldı</div>}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                <h3 className="font-black text-sm mb-2 flex items-center gap-2"><Target className="w-4 h-4 text-indigo-600"/>Akademik Hedef</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300">{student.academicGoal || 'Henüz akademik hedef girilmemiş.'}</p>
              </div>
            </>
          )}

          {activeTab === 'lessons' && (
            <div className="space-y-3">
              {studentLessons.length === 0 ? renderEmpty('Bu öğrenci için ders kaydı bulunmuyor.') : studentLessons.map((lesson) => (
                <div key={lesson.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div><p className="font-bold text-sm">{formatDateTurkish(lesson.date, 'with-day')} • {lesson.startTime}</p><p className="text-xs text-slate-500 mt-1">{lesson.topic || 'Konu belirtilmedi'} • {lesson.actualDuration || lesson.duration} dk • {lesson.lessonType}</p></div>
                  <div className="flex items-center gap-2"><span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${statusBadge(lesson.status)}`}>{lesson.status}</span>{lesson.status === 'Planlandı' || lesson.status === 'Yaklaşıyor' ? <button onClick={() => openModal('preLessonSummary', { lesson, student })} className="px-2.5 py-1.5 text-[11px] rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold">Özet</button> : null}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="space-y-3">
              {studentAssignments.length === 0 ? renderEmpty('Bu öğrenci için ödev kaydı bulunmuyor.') : studentAssignments.map((a) => (
                <div key={a.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div><p className="font-bold text-sm">{a.title || a.topic || 'Matematik Ödevi'}</p><p className="text-xs text-slate-500 mt-1">{a.resourceName || 'Kaynak belirtilmedi'}{a.pages ? ` • Sayfa ${a.pages}` : ''} • Son: {formatDateTurkish(a.dueDate)}</p></div>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold self-start ${statusBadge(a.status)}`}>{a.status}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'topics' && (
            <div className="space-y-3">
              {studentTopics.length === 0 ? renderEmpty('Henüz konu ilerleme kaydı oluşturulmamış.') : studentTopics.map((p) => (
                <div key={p.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold text-sm">{p.topicTitle}</p><span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${statusBadge(p.status)}`}>{p.status}</span></div>
                  <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"><div className="h-full bg-indigo-600 rounded-full" style={{ width: `${Math.max(0, Math.min(100, p.masteryPercentage))}%` }} /></div>
                  <p className="text-[11px] text-slate-500 mt-2">Hakimiyet %{p.masteryPercentage} • {p.totalQuestionsSolved} soru • Son güncelleme {formatDateTurkish(p.updatedAt)}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'exams' && (
            <div className="space-y-4">
              <div className="flex justify-end"><button onClick={() => openForStudent('addExam')} className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">+ Sınav Sonucu</button></div>
              {examTrend.length >= 2 && (
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3"><div><p className="font-black text-sm">Net Gelişimi</p><p className="text-[11px] text-slate-500">Son {examTrend.length} sınav</p></div><p className="text-sm font-black text-indigo-600">{examTrend[0].netScore} → {examTrend[examTrend.length - 1].netScore}</p></div>
                  <svg viewBox="0 0 700 180" className="w-full h-44" role="img" aria-label="Net gelişim grafiği">
                    <line x1="30" y1="145" x2="680" y2="145" stroke="currentColor" opacity="0.12" />
                    <polyline fill="none" stroke="#4f46e5" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" points={examTrend.map((e, i) => { const max = Math.max(...examTrend.map(x => x.netScore), 1); const x = 35 + (i * 640 / Math.max(1, examTrend.length - 1)); const y = 140 - (e.netScore / max) * 115; return `${x},${y}`; }).join(' ')} />
                    {examTrend.map((e, i) => { const max = Math.max(...examTrend.map(x => x.netScore), 1); const x = 35 + (i * 640 / Math.max(1, examTrend.length - 1)); const y = 140 - (e.netScore / max) * 115; return <g key={e.id}><circle cx={x} cy={y} r="6" fill="#4f46e5"/><text x={x} y={Math.max(13,y-10)} textAnchor="middle" fontSize="17" fill="currentColor">{e.netScore}</text></g>; })}
                  </svg>
                </div>
              )}
              {weakTopics.length > 0 && <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/10"><p className="font-black text-sm text-rose-700 dark:text-rose-300">Öncelikli Zayıf Konular</p><div className="flex flex-wrap gap-2 mt-3">{weakTopics.map(([topic], i) => <span key={topic} className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/50 text-xs font-bold">{i + 1}. {topic}</span>)}</div></div>}
              {studentExams.length === 0 ? renderEmpty('Henüz sınav veya deneme sonucu girilmemiş.') : studentExams.map((e) => (
                <div key={e.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800"><div className="flex items-center justify-between gap-3"><div><p className="font-bold text-sm">{e.examName}</p><p className="text-xs text-slate-500 mt-1">{e.examType} • {formatDateTurkish(e.date)} • D/Y/B: {e.correctCount}/{e.wrongCount}/{e.emptyCount}</p></div><div className="text-right"><p className="text-lg font-black text-indigo-600">{e.netScore} net</p>{typeof e.totalScore === 'number' && <p className="text-[11px] text-slate-500">{e.totalScore} puan</p>}</div></div>{e.incorrectTopics?.length ? <p className="text-[11px] text-rose-600 mt-2">Yanlış konular: {e.incorrectTopics.join(', ')}</p> : null}</div>
              ))}
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3"><div><h3 className="font-black">Akademik Hedefler</h3><p className="text-xs text-slate-500">Birden fazla hedefi tarih ve ilerleme ile takip edin.</p></div><button onClick={() => setShowGoalForm((v) => !v)} className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">+ Hedef Ekle</button></div>
              {showGoalForm && <form onSubmit={(e) => { e.preventDefault(); const target = Number(goalTarget); if (!goalTitle.trim() || !Number.isFinite(target) || target <= 0) return; addGoal({ studentId: student.id, title: goalTitle.trim(), goalType, targetValue: target, targetDate: goalDate || undefined, status: 'Aktif' }); setGoalTitle(''); setGoalTarget(''); setGoalDate(''); setShowGoalForm(false); }} className="grid sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <input required value={goalTitle} onChange={(e)=>setGoalTitle(e.target.value)} placeholder="Örn: TYT Matematik 30 net" className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"/>
                <select value={goalType} onChange={(e)=>setGoalType(e.target.value as any)} className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"><option>Net Hedefi</option><option>Puan Hedefi</option><option>Yazılı Notu</option><option>Konu Tamamlama</option><option>Ödev Tamamlama</option></select>
                <input required type="number" step="0.25" min="0" value={goalTarget} onChange={(e)=>setGoalTarget(e.target.value)} placeholder="Hedef değer" className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"/>
                <input type="date" value={goalDate} onChange={(e)=>setGoalDate(e.target.value)} className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"/>
                <button className="sm:col-span-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold">Hedefi Kaydet</button>
              </form>}
              {studentGoals.length === 0 ? <div className="grid md:grid-cols-2 gap-4"><div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800"><Target className="w-5 h-5 text-indigo-600 mb-3"/><p className="font-black">Ana Hedef</p><p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{student.academicGoal || 'Henüz hedef tanımlanmadı.'}</p></div>{renderEmpty('Takip edilen sayısal hedef bulunmuyor.')}</div> : <div className="grid md:grid-cols-2 gap-4">{studentGoals.map((g) => { const autoCurrent = g.goalType === 'Net Hedefi' ? (latestNet || 0) : g.goalType === 'Ödev Tamamlama' ? stats.homeworkCompletionRate : g.goalType === 'Konu Tamamlama' ? topicCompletion : (g.currentValue || 0); const pct = Math.min(100, Math.max(0, autoCurrent / Math.max(g.targetValue, 1) * 100)); return <div key={g.id} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800"><div className="flex justify-between gap-3"><div><p className="font-black">{g.title}</p><p className="text-[11px] text-slate-500 mt-1">{g.goalType}{g.targetDate ? ` • ${formatDateTurkish(g.targetDate)}` : ''}</p></div><span className={`px-2 py-1 rounded-lg text-[10px] font-bold h-fit ${g.status === 'Tamamlandı' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'}`}>{g.status}</span></div><p className="text-2xl font-black mt-4">{Number(autoCurrent.toFixed?.(2) ?? autoCurrent)} <span className="text-sm text-slate-400">/ {g.targetValue}</span></p><div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"><div className="h-full bg-emerald-600 rounded-full" style={{width:`${pct}%`}}/></div><p className="text-[11px] text-slate-500 mt-2">İlerleme %{Math.round(pct)}</p><div className="flex gap-2 mt-3">{g.status !== 'Tamamlandı' && <button onClick={()=>updateGoalStatus(g.id,'Tamamlandı')} className="text-[11px] font-bold text-emerald-600">Tamamlandı</button>}<button onClick={()=>deleteGoal(g.id)} className="text-[11px] font-bold text-rose-500">Sil</button></div></div>; })}</div>}
            </div>
          )}

          {activeTab === 'written' && (
            <div className="space-y-3">
              {studentWritten.length === 0 ? renderEmpty('Bu öğrenci için yazılı kaydı bulunmuyor.') : studentWritten.map((w) => {
                const prep = writtenPreparations.find((p) => p.writtenExamId === w.id);
                return <div key={w.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800"><div className="flex flex-wrap justify-between gap-2"><div><p className="font-bold text-sm">{w.examName}</p><p className="text-xs text-slate-500 mt-1">{formatDateTurkish(w.date)} • Hedef {w.targetGrade}{typeof w.actualGrade === 'number' ? ` • Sonuç ${w.actualGrade}` : ''}</p></div>{prep && <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${statusBadge(prep.status)}`}>{prep.status}</span>}</div><p className="text-xs text-slate-500 mt-3">Konular: {w.topics.join(', ') || 'Belirtilmedi'}</p></div>;
              })}
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60"><p className="text-[10px] text-slate-400 font-bold">BORÇLANDIRILAN</p><p className="font-black mt-1">{formatCurrency(stats.finance.totalCharged)}</p></div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60"><p className="text-[10px] text-slate-400 font-bold">TAHSİL EDİLEN</p><p className="font-black mt-1 text-emerald-600">{formatCurrency(stats.finance.totalPaid)}</p></div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60"><p className="text-[10px] text-slate-400 font-bold">BEKLEYEN</p><p className="font-black mt-1 text-rose-600">{formatCurrency(Math.max(0, stats.finance.balance))}</p></div>
              </div>
              {studentTransactions.length === 0 ? renderEmpty('Finans hareketi bulunmuyor.') : studentTransactions.map((t) => <div key={t.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"><div><p className="text-sm font-bold">{t.description}</p><p className="text-[11px] text-slate-500">{formatDateTurkish(t.date)} • {t.type}</p></div><p className={`font-black text-sm ${t.type === 'Ödeme Alındı' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>{formatCurrency(t.amount)}</p></div>)}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50"><p className="text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300 mb-2">Öğretmen Özel Notu</p><p className="text-sm">{student.teacherNotes || 'Özel not girilmemiş.'}</p></div>
              <h3 className="font-black text-sm">Ders Notları</h3>
              {studentLessonNotes.length === 0 ? renderEmpty('Ders sonu öğretmen notu bulunmuyor.') : studentLessonNotes.map((n) => <div key={n.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800"><div className="flex justify-between gap-2"><p className="font-bold text-sm">{n.topic}</p><span className="text-[11px] text-slate-400">{formatDateTurkish(n.createdAt)}</span></div>{n.teacherNote && <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{n.teacherNote}</p>}{n.difficultAreas && <p className="text-xs text-rose-600 mt-2">Zorlanılan: {n.difficultAreas}</p>}</div>)}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-3">
              <div className="flex justify-end"><button onClick={() => openForStudent('addDocument')} className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">+ Doküman Ekle</button></div>
              {studentDocuments.length === 0 ? renderEmpty('Bu öğrenciyle ilişkilendirilmiş doküman bulunmuyor.') : studentDocuments.map((d) => <div key={d.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"><div><p className="font-bold text-sm">{d.title}</p><p className="text-xs text-slate-500 mt-1">{d.fileType}{d.topic ? ` • ${d.topic}` : ''} • {formatDateTurkish(d.createdAt)}</p></div>{(d.url || d.fileUrl) && <a href={d.url || d.fileUrl} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800"><ExternalLink className="w-4 h-4"/></a>}</div>)}
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
            {student.isArchived ? (
              <button onClick={() => { restoreStudent(student.id); onClose(); }} className="px-3 py-2 text-xs font-bold rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5"/>Arşivden Çıkar</button>
            ) : (
              <button onClick={() => { if (window.confirm(`${student.firstName} ${student.lastName} arşivlenecek. Ders, ödev ve finans geçmişi korunacaktır. Devam etmek istiyor musunuz?`)) { archiveStudent(student.id); onClose(); } }} className="px-3 py-2 text-xs font-bold rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 flex items-center gap-1.5"><Archive className="w-3.5 h-3.5"/>Öğrenciyi Arşivle</button>
            )}
            <div className="ml-auto text-[11px] text-slate-400 flex items-center gap-1"><School className="w-3.5 h-3.5"/>{student.schoolName || 'Okul belirtilmedi'} <span>•</span> <Phone className="w-3.5 h-3.5"/>{phone.formatted || student.parentPhone || '-'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
