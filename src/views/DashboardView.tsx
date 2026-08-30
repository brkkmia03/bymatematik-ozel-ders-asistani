import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Users,
  BookOpen,
  DollarSign,
  AlertTriangle,
  Play,
  CheckCircle,
  MessageSquare,
  Sparkles,
  ChevronRight,
  TrendingUp,
  FileText,
  Plus,
  Award,
  Bell,
  MapPin,
  Video,
  ArrowUpRight,
  Send,
  CheckSquare,
  Square,
  GraduationCap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateTurkish, formatCurrency } from '../utils/formatters';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [lessonOverviewMode, setLessonOverviewMode] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const {
    teacher,
    students,
    lessons,
    assignments,
    packages,
    transactions,
    writtenExams,
    tasks,
    updateTaskStatus,
    openModal,
    startLiveLesson,
    activeLessonId,
  } = useApp();

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const activeStudents = students.filter((s) => !s.isArchived);

  // Today's lessons sorted by start time
  const todayLessons = lessons
    .filter((l) => l.date === todayStr && !['İptal Edildi', 'Öğretmen İptal Etti', 'Ertelendi'].includes(l.status))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Determine the next upcoming lesson (live first, or first pending, or first today, or fallback)
  const liveLesson = lessons.find((l) => l.id === activeLessonId);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const nextPendingLesson = todayLessons.find((l) => {
    if (!['Planlandı', 'Yaklaşıyor'].includes(l.status)) return false;
    const [h, m] = l.startTime.split(':').map(Number);
    return h * 60 + m >= currentMinutes;
  }) || todayLessons.find((l) => ['Planlandı', 'Yaklaşıyor'].includes(l.status));
  // The hero must never contradict the 'Bugünün Dersleri' list. If today's next lesson
  // has already passed or has a non-pending status, still show today's first real lesson.
  const primaryHeroLesson = liveLesson || nextPendingLesson || todayLessons[0] || null;
  const heroStudent = primaryHeroLesson ? students.find((s) => s.id === primaryHeroLesson.studentId) : null;

  // Student's recent assignment status
  const heroStudentAssignments = heroStudent
    ? assignments.filter((a) => a.studentId === heroStudent.id)
    : [];
  const latestHeroAssignment = [...heroStudentAssignments].sort((a, b) => b.assignedDate.localeCompare(a.assignedDate))[0];

  // Dashboard lesson overview (today / this week / this month / all)
  const toDateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const weekStart = new Date(now);
  const dayIndex = weekStart.getDay();
  const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;
  weekStart.setDate(weekStart.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const lessonOverview = lessons
    .filter((lesson) => {
      if (lessonOverviewMode === 'all') return true;
      if (lessonOverviewMode === 'today') return lesson.date === todayStr;
      if (lessonOverviewMode === 'week') {
        return lesson.date >= toDateKey(weekStart) && lesson.date <= toDateKey(weekEnd);
      }
      return lesson.date >= toDateKey(monthStart) && lesson.date <= toDateKey(monthEnd);
    })
    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));

  const lessonOverviewCounts = {
    planned: lessonOverview.filter((l) => ['Planlandı', 'Yaklaşıyor', 'Başladı'].includes(l.status)).length,
    completed: lessonOverview.filter((l) => l.status === 'Tamamlandı').length,
    cancelled: lessonOverview.filter((l) => ['İptal Edildi', 'Öğretmen İptal Etti'].includes(l.status)).length,
  };

  // Pending unchecked assignments
  const pendingAssignments = assignments.filter(
    (a) => a.status === 'Bekliyor' || a.status === 'Yapılıyor'
  );

  // Low credit packages (1 or 0 lessons left)
  const lowCreditPackages = packages.filter(
    (p) => p.status === 'Aktif' && p.remainingLessons <= 2
  );

  // Upcoming written exams (next 14 days)
  const upcomingWrittenExams = writtenExams.filter((w) => {
    const examDate = new Date(w.date).getTime();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const diffDays = Math.ceil((examDate - todayStart) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 14;
  });

  // Calculate this month's revenue
  const currentMonthPrefix = todayStr.substring(0, 7);
  const monthlyRevenue = transactions
    .filter((t) => t.date.startsWith(currentMonthPrefix) && t.type === 'Ödeme Alındı' && !t.isCancelled)
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Today's revenue
  const todayRevenue = transactions
    .filter((t) => t.date === todayStr && t.type === 'Ödeme Alındı' && !t.isCancelled)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const monthlyEarned = transactions
    .filter((t) => t.date.startsWith(currentMonthPrefix) && (t.type === 'Ders Ücreti' || t.type === 'Paket Satışı') && !t.isCancelled)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalOutstanding = activeStudents.reduce((sum, student) => {
    const studentTxns = transactions.filter((t) => t.studentId === student.id && !t.isCancelled);
    const charged = studentTxns.filter((t) => t.type === 'Ders Ücreti' || t.type === 'Paket Satışı').reduce((a, t) => a + t.amount, 0);
    const paid = studentTxns.filter((t) => t.type === 'Ödeme Alındı' || t.type === 'İade/Düzeltme').reduce((a, t) => a + t.amount, 0);
    return sum + Math.max(0, charged - paid);
  }, 0);

  // Uncompleted tasks for quick checklist
  const pendingTasks = tasks.filter((t) => t.status !== 'Kullanıldı').slice(0, 4);

  return (
    <div className="space-y-6 pb-12">
      {/* Bento Grid Header Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-display">
            Merhaba, {teacher.firstName} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Bugün {todayLessons.length} dersin ve kontrol etmen gereken {pendingAssignments.length} ödev var.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => openModal('pdfPreview', { reportType: 'student_progress' })}
            className="px-2.5 sm:px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs"
          >
            PDF Rapor Al
          </button>
          <button
            onClick={() => openModal('addLesson')}
            className="px-2.5 sm:px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Yeni Ders</span>
          </button>
        </div>
      </header>

      {/* Derslerim: home-screen lesson overview */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white font-display">Derslerim</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ders programını günlük, haftalık, aylık veya tüm kayıtlar olarak görüntüle.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="grid grid-cols-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-[11px] sm:text-xs font-bold">
              {([
                ['today', 'Bugün'],
                ['week', 'Haftalık'],
                ['month', 'Aylık'],
                ['all', 'Tümü'],
              ] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setLessonOverviewMode(mode)}
                  className={`px-2.5 sm:px-3 py-2 rounded-xl transition-all ${
                    lessonOverviewMode === mode
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('calendar')}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5"
            >
              Takvime Git <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <div className="rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-wider font-bold text-indigo-500">Planlı</div>
            <div className="text-xl font-black text-indigo-700 dark:text-indigo-300">{lessonOverviewCounts.planned}</div>
          </div>
          <div className="rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-500">Tamamlandı</div>
            <div className="text-xl font-black text-emerald-700 dark:text-emerald-300">{lessonOverviewCounts.completed}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">İptal</div>
            <div className="text-xl font-black text-slate-700 dark:text-slate-300">{lessonOverviewCounts.cancelled}</div>
          </div>
        </div>

        {lessonOverview.length === 0 ? (
          <div className="py-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700">
            <Calendar className="w-7 h-7 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Bu aralıkta ders bulunmuyor.</p>
            <button type="button" onClick={() => openModal('addLesson')} className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">+ Yeni ders ekle</button>
          </div>
        ) : (
          <div className="max-h-[430px] overflow-y-auto pr-1 space-y-2.5">
            {lessonOverview.map((lesson) => {
              const student = students.find((s) => s.id === lesson.studentId);
              const isCancelled = ['İptal Edildi', 'Öğretmen İptal Etti'].includes(lesson.status);
              const isCompleted = lesson.status === 'Tamamlandı';
              const isLive = activeLessonId === lesson.id;

              return (
                <div
                  key={lesson.id}
                  className={`grid grid-cols-[64px_1fr_auto] sm:grid-cols-[92px_1fr_auto] gap-3 items-center p-3 rounded-2xl border ${
                    isLive
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800'
                      : isCompleted
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50'
                      : isCancelled
                      ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-75'
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800'
                  }`}
                >
                  <div className="text-center sm:text-left">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                      {new Date(`${lesson.date}T12:00:00`).toLocaleDateString('tr-TR', { weekday: 'short' })}
                    </div>
                    <div className="text-xs font-black text-slate-700 dark:text-slate-200">
                      {new Date(`${lesson.date}T12:00:00`).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
                    </div>
                    <div className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">{lesson.startTime}</div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {student ? `${student.firstName} ${student.lastName}` : 'Öğrenci'}
                      </span>
                      <span className="hidden sm:inline text-[10px] text-slate-400">• {lesson.duration} dk</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {lesson.topic || 'Matematik Dersi'}
                      {student?.gradeLevel ? ` • ${student.gradeLevel}` : ''}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5">
                    <span className={`px-2 py-1 rounded-lg text-[9px] sm:text-[10px] font-bold whitespace-nowrap ${
                      isLive
                        ? 'bg-indigo-600 text-white'
                        : isCompleted
                        ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                        : isCancelled
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                    }`}>
                      {isLive ? 'Devam Ediyor' : lesson.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigate('calendar')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                      title="Takvimde Aç"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Main Bento Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Large Hero Bento Tile: Next / Active Lesson (2 cols, 2 rows on desktop) */}
        <div className="md:col-span-2 lg:col-span-2 lg:row-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div>
            {/* Bento Card Top Bar */}
            <div className="flex justify-between items-start mb-5">
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold tracking-wide">
                {activeLessonId ? '🔴 CANLI DERS DEVAM EDİYOR' : 'SIRADAKİ DERS'}
              </span>
              <span className="text-slate-400 text-xs font-semibold font-mono">
                {primaryHeroLesson ? `${primaryHeroLesson.startTime} (${primaryHeroLesson.duration} dk)` : 'Plan Yok'}
              </span>
            </div>

            {/* Student Avatar & Title Header */}
            {heroStudent && primaryHeroLesson ? (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-2xl text-indigo-600 dark:text-indigo-400 shrink-0">
                    <GraduationCap className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                      {heroStudent.firstName} {heroStudent.lastName}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">
                      {heroStudent.gradeLevel} • {primaryHeroLesson.lessonType === 'Online' ? 'Online Ders' : primaryHeroLesson.location || 'Yüz Yüze'}
                    </p>
                  </div>
                </div>

                {/* Inner Info Bento Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100/80 dark:border-slate-800/80">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">
                      İşlenecek / Son Konu
                    </div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {primaryHeroLesson.topic || 'Matematik Dersi'}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100/80 dark:border-slate-800/80">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">
                      Son Ödev Durumu
                    </div>
                    <div
                      className={`text-sm font-semibold truncate ${
                        (latestHeroAssignment?.status === 'Tamamlandı' || latestHeroAssignment?.status === 'Kontrol Edildi')
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : latestHeroAssignment?.status === 'Eksik'
                          ? 'text-amber-600 dark:text-amber-400'
                          : latestHeroAssignment?.status === 'Yapılmadı'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {latestHeroAssignment ? `${latestHeroAssignment.status} (${latestHeroAssignment.title})` : 'Ödev Kaydı Yok'}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center space-y-2">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  Bugün için planlanmış aktif ders bulunmuyor
                </p>
                <p className="text-xs text-slate-400">
                  Yeni bir ders takvimi oluşturmak için aşağıdaki butonu kullanabilirsiniz.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {primaryHeroLesson && heroStudent ? (
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  if (activeLessonId === primaryHeroLesson.id) {
                    openModal('liveLesson', { lesson: primaryHeroLesson, student: heroStudent });
                  } else {
                    startLiveLesson(primaryHeroLesson.id);
                    openModal('liveLesson', { lesson: primaryHeroLesson, student: heroStudent });
                  }
                }}
                className="flex-1 py-3 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{activeLessonId === primaryHeroLesson.id ? 'Canlı Derse Dön' : 'Dersi Başlat'}</span>
              </button>

              <button
                onClick={() =>
                  openModal('preLessonSummary', { lesson: primaryHeroLesson, student: heroStudent })
                }
                className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors"
                title="Ders Öncesi Hazırlık Notları"
              >
                <Sparkles className="w-5 h-5 text-indigo-500" />
              </button>

              <button
                onClick={() => openModal('studentProfile', { student: heroStudent })}
                className="w-12 h-12 flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                title="Öğrenci Profilini Aç"
              >
                <Users className="w-5 h-5" />
              </button>

              <button
                onClick={() =>
                  openModal('whatsapp', {
                    student: heroStudent,
                    lesson: primaryHeroLesson,
                    templateType: 'lesson_report',
                  })
                }
                className="w-12 h-12 flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
                title="Veliye WhatsApp Mesajı Gönder"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => openModal('addLesson')}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-sm transition-all text-center"
            >
              + Ders Ekle
            </button>
          )}
        </div>

        {/* 2. Metric Bento Tile 1: Monthly / Today Revenue with Mini Bar Chart */}
        <div
          onClick={() => onNavigate('finance')}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-900 transition-all group"
        >
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              Bu Ay Tahsil Edilen
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-display">
              {formatCurrency(monthlyRevenue, teacher.currency)}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Bugün: {formatCurrency(todayRevenue, teacher.currency)} • Kazanılan: {formatCurrency(monthlyEarned, teacher.currency)}
            </p>
          </div>

          {/* Mini Bar Chart Pattern */}
          <div className="h-12 flex items-end gap-1.5 pt-3">
            <div className="flex-1 bg-indigo-100 dark:bg-indigo-950 h-2/5 rounded-t group-hover:h-3/5 transition-all"></div>
            <div className="flex-1 bg-indigo-200 dark:bg-indigo-900 h-3/5 rounded-t group-hover:h-4/5 transition-all"></div>
            <div className="flex-1 bg-indigo-300 dark:bg-indigo-800 h-4/5 rounded-t group-hover:h-full transition-all"></div>
            <div className="flex-1 bg-indigo-600 dark:bg-indigo-500 h-full rounded-t"></div>
            <div className="flex-1 bg-indigo-200 dark:bg-indigo-900 h-2/4 rounded-t group-hover:h-3/4 transition-all"></div>
            <div className="flex-1 bg-indigo-100 dark:bg-indigo-950 h-1/3 rounded-t"></div>
          </div>
        </div>

        {/* 3. Metric Bento Tile 2: Active Students with Avatar Stack */}
        <div
          onClick={() => onNavigate('students')}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-900 transition-all group"
        >
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              Aktif Öğrenci
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-display">
              {activeStudents.length}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Aktif öğrenci kayıtları
            </p>
          </div>

          {/* Avatar Stack */}
          <div className="flex items-center -space-x-2 pt-3">
            {activeStudents.slice(0, 4).map((student, idx) => {
              const bgColors = [
                'bg-indigo-500',
                'bg-blue-500',
                'bg-violet-500',
                'bg-emerald-500',
              ];
              return (
                <div
                  key={student.id}
                  className={`w-9 h-9 rounded-full ${bgColors[idx % bgColors.length]} border-2 border-white dark:border-slate-900 flex items-center justify-center text-[11px] font-bold text-white shadow-xs`}
                  title={`${student.firstName} ${student.lastName}`}
                >
                  {student.firstName.charAt(0)}
                </div>
              );
            })}
            {activeStudents.length > 4 && (
              <div className="w-9 h-9 rounded-full bg-slate-900 dark:bg-slate-700 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-xs">
                +{activeStudents.length - 4}
              </div>
            )}
          </div>
        </div>

        {/* 4. Attention Bento Tile: Dikkat Gerektirenler (2 cols) */}
        <div className="md:col-span-2 lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <span className="text-base">🚨</span> Dikkat Gerektirenler
            </h3>
            <span
              onClick={() => onNavigate('finance')}
              className="text-xs text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 underline cursor-pointer font-semibold"
            >
              Tümünü Gör
            </span>
          </div>

          <div className="space-y-3">
            {lowCreditPackages.length > 0 ? (
              <div
                onClick={() => onNavigate('finance')}
                className="flex items-center gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 rounded-2xl cursor-pointer hover:bg-rose-100/60 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  !
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-bold text-rose-900 dark:text-rose-200">
                    {(() => { const s = students.find((x) => x.id === lowCreditPackages[0].studentId); return s ? `${s.firstName} ${s.lastName}` : 'Öğrenci'; })()}
                  </div>
                  <div className="text-rose-700 dark:text-rose-300 font-medium">
                    Paketi bitmek üzere (Kalan: {lowCreditPackages[0].remainingLessons} ders)
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-xs text-slate-500">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Kritik seviyede paket bakiyesi bulunmuyor.</span>
              </div>
            )}

            {totalOutstanding > 0 && (
              <div
                onClick={() => onNavigate('finance')}
                className="flex items-center gap-3 p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-2xl cursor-pointer hover:bg-indigo-100/60 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">₺</div>
                <div className="flex-1 text-xs">
                  <div className="font-bold text-indigo-900 dark:text-indigo-200">Bekleyen Ödeme</div>
                  <div className="text-indigo-700 dark:text-indigo-300 font-medium">Toplam {formatCurrency(totalOutstanding, teacher.currency)} tahsilat bekliyor.</div>
                </div>
              </div>
            )}

            {pendingAssignments.length > 0 ? (
              <div
                onClick={() => onNavigate('assignments')}
                className="flex items-center gap-3 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60 rounded-2xl cursor-pointer hover:bg-amber-100/60 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  ⌛
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-bold text-amber-900 dark:text-amber-200">
                    {(() => { const s = students.find((x) => x.id === pendingAssignments[0].studentId); return s ? `${s.firstName} ${s.lastName}` : 'Öğrenci'; })()}
                  </div>
                  <div className="text-amber-700 dark:text-amber-300 font-medium">
                    Kontrol bekleyen ödev: {pendingAssignments[0].title}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-xs text-slate-500">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Bekleyen tüm ödev kontrolleri tamamlandı.</span>
              </div>
            )}
          </div>
        </div>

        {/* 5. Schedule Bento Tile: Bugünkü Takvim (2 cols) */}
        <div className="md:col-span-2 lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4 text-xs uppercase tracking-wider font-bold text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-900 dark:text-white font-display text-sm normal-case font-bold">
              📅 Bugünkü Takvim
            </span>
            <span>{formatDateTurkish(todayStr, 'short')}</span>
          </div>

          <div className="space-y-2.5">
            {todayLessons.length === 0 ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center text-xs text-slate-400">
                Bugün için planlanmış ders bulunmuyor.
              </div>
            ) : (
              todayLessons.slice(0, 3).map((lesson) => {
                const s = students.find((st) => st.id === lesson.studentId);
                const isCompleted = lesson.status === 'Tamamlandı';
                const isLive = activeLessonId === lesson.id;

                return (
                  <div key={lesson.id} className="flex items-center gap-3 text-sm">
                    <div className="w-12 text-slate-400 font-mono text-xs font-bold">
                      {lesson.startTime}
                    </div>
                    <div
                      className={`flex-1 py-2 px-3.5 rounded-xl border-l-4 font-medium flex items-center justify-between text-xs transition-colors ${
                        isLive
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 font-bold text-indigo-950 dark:text-indigo-200'
                          : isCompleted
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 text-slate-600 dark:text-slate-300'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-indigo-500 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <span className="truncate">
                        {s ? `${s.firstName} ${s.lastName}` : 'Öğrenci'} — {s?.gradeLevel || 'Matematik'}
                      </span>
                      <span className="text-[10px] font-semibold opacity-70 ml-2 shrink-0">
                        {lesson.topic || 'Ders'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 6. Dark Bento Tile: Yapılacaklar / Quick Tasks (2 cols, slate-900) */}
        <div className="md:col-span-2 lg:col-span-2 bg-slate-900 text-white rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-400" />
              <span>Yapılacaklar & Notlar</span>
            </h3>
            <button
              onClick={() => openModal('addTask')}
              className="text-xs bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg text-indigo-200 transition-colors font-semibold"
            >
              + Ekle
            </button>
          </div>

          <div className="space-y-2.5">
            {pendingTasks.length === 0 ? (
              <div className="text-xs text-slate-400 italic py-2">
                Tüm yapılacaklar tamamlandı. Harika gidiyorsunuz! 🎉
              </div>
            ) : (
              pendingTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() =>
                    updateTaskStatus(task.id, task.status === 'Kullanıldı' ? 'Yapılacak' : 'Kullanıldı')
                  }
                  className="flex items-center gap-3 text-xs cursor-pointer group hover:bg-white/5 p-1.5 rounded-lg transition-colors"
                >
                  <div className="text-indigo-400 group-hover:text-indigo-300">
                    <Square className="w-4 h-4" />
                  </div>
                  <span className="text-slate-200 group-hover:text-white line-clamp-1">
                    {task.title}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
