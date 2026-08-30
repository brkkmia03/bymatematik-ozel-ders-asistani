import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  MapPin,
  Video,
  CheckCircle,
  Play,
  Sparkles,
  AlertTriangle,
  Filter,
  Layers,
  Ban,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateTurkish, formatCurrency } from '../utils/formatters';
import { Lesson, Student } from '../types';

const toLocalDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const CalendarView: React.FC = () => {
  const { students, lessons, openModal, updateLesson, cancelLesson, deleteLesson } = useApp();

  const [viewMode, setViewMode] = useState<'weekly' | 'daily' | 'monthly' | 'list'>('weekly');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('all');

  const handleCancelLesson = (lesson: Lesson) => {
    if (['İptal Edildi', 'Öğretmen İptal Etti'].includes(lesson.status)) return;
    const reason = window.prompt('Ders iptal nedeni (isteğe bağlı):', '') ?? null;
    if (reason === null) return;
    if (!window.confirm(`${lesson.date} ${lesson.startTime} dersini iptal etmek istiyor musunuz?`)) return;
    cancelLesson(lesson.id, reason.trim(), true);
  };

  const handleDeleteLesson = (lesson: Lesson) => {
    if (!window.confirm(`${lesson.date} ${lesson.startTime} dersini kalıcı olarak silmek istiyor musunuz?\n\nBu işlem geri alınamaz.`)) return;
    deleteLesson(lesson.id);
  };

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(selectedDate);
    if (viewMode === 'daily') d.setDate(d.getDate() - 1);
    else if (viewMode === 'weekly') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setSelectedDate(d);
  };

  const handleNext = () => {
    const d = new Date(selectedDate);
    if (viewMode === 'daily') d.setDate(d.getDate() + 1);
    else if (viewMode === 'weekly') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setSelectedDate(d);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // Helper to get week days (Mon-Sun)
  const getWeekDays = (baseDate: Date) => {
    const d = new Date(baseDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));

    const week = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      week.push(nextDay);
    }
    return week;
  };

  const weekDays = getWeekDays(selectedDate);
  const selectedDateStr = toLocalDateKey(selectedDate);

  // Filter lessons
  const filteredLessons = lessons.filter((l) => {
    if (selectedStudentFilter !== 'all' && l.studentId !== selectedStudentFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Calendar Header & Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-display flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-indigo-600" />
              <span>Ders Takvimi & Program</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Haftalık ve günlük özel ders randevularınızı yönetin
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Switcher Chips */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                onClick={() => setViewMode('weekly')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  viewMode === 'weekly'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Haftalık
              </button>
              <button
                onClick={() => setViewMode('daily')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  viewMode === 'daily'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Günlük
              </button>
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  viewMode === 'monthly'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Aylık
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Liste
              </button>
            </div>

            {/* Student Filter */}
            <select
              value={selectedStudentFilter}
              onChange={(e) => setSelectedStudentFilter(e.target.value)}
              className="text-xs font-semibold p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">Tüm Öğrenciler</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName}
                </option>
              ))}
            </select>

            {/* Add Lesson Button */}
            <button
              onClick={() => openModal('addLesson', { initialDate: selectedDateStr })}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Ders</span>
            </button>
          </div>
        </div>

        {/* Date Navigator Bar */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Bugün
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <span className="text-sm font-black text-slate-900 dark:text-white font-display ml-2">
              {viewMode === 'weekly'
                ? `${formatDateTurkish(toLocalDateKey(weekDays[0]), 'short')} - ${formatDateTurkish(toLocalDateKey(weekDays[6]), 'short')}`
                : viewMode === 'monthly'
                  ? selectedDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
                  : formatDateTurkish(selectedDateStr, 'full')}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Planlandı
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Tamamlandı
            </span>
            <span className="flex items-center gap-1.5 text-slate-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> İptal
            </span>
          </div>
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'weekly' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const dayStr = toLocalDateKey(day);
            const isToday = dayStr === toLocalDateKey(new Date());
            const dayLessons = filteredLessons
              .filter((l) => l.date === dayStr)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <div
                key={dayStr}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-3.5 border min-h-[420px] flex flex-col space-y-3 transition-all ${
                  isToday
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {/* Column Day Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      {day.toLocaleDateString('tr-TR', { weekday: 'short' })}
                    </span>
                    <span
                      className={`text-sm font-black ${
                        isToday ? 'text-indigo-600' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {day.getDate()}{' '}
                      {day.toLocaleDateString('tr-TR', { month: 'short' })}
                    </span>
                  </div>

                  <button
                    onClick={() => openModal('addLesson', { initialDate: dayStr })}
                    className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="Bu Güne Ders Ekle"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Lesson Cards for Day */}
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {dayLessons.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-[11px] text-slate-400 italic">
                      Ders yok
                    </div>
                  ) : (
                    dayLessons.map((lesson) => {
                      const student = students.find((s) => s.id === lesson.studentId);
                      const isCompleted = lesson.status === 'Tamamlandı';

                      return (
                        <div
                          key={lesson.id}
                          className={`p-2.5 rounded-2xl border text-xs space-y-1.5 transition-all cursor-pointer ${
                            isCompleted
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                              : 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200/80 dark:border-indigo-900/60 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-indigo-950 dark:text-indigo-200 text-[11px]">
                              {lesson.startTime} ({lesson.duration} dk)
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}
                            >
                              {lesson.status}
                            </span>
                          </div>

                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {student ? `${student.firstName} ${student.lastName}` : 'Öğrenci'}
                          </div>

                          <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                            {lesson.topic || 'Matematik Dersi'}
                          </div>

                          {/* Action icons */}
                          <div className="flex items-center justify-end gap-1 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                            <button
                              onClick={() =>
                                openModal('preLessonSummary', { lesson, student })
                              }
                              className="p-1 text-slate-500 hover:text-indigo-600"
                              title="Ön Hazırlık"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                            {lesson.status === 'Başladı' && (
                              <button
                                onClick={() => openModal('liveLesson', { lesson, student })}
                                className="p-1 text-emerald-600 hover:text-emerald-700"
                                title="Canlı Dersi Aç"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {!isCompleted && !['İptal Edildi', 'Öğretmen İptal Etti'].includes(lesson.status) && (
                              <button onClick={() => handleCancelLesson(lesson)} className="p-1 text-amber-600 hover:text-amber-700" title="Dersi İptal Et">
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button onClick={() => handleDeleteLesson(lesson)} className="p-1 text-rose-600 hover:text-rose-700" title="Dersi Sil">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}


      {viewMode === 'monthly' && (() => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const first = new Date(year, month, 1);
        const startOffset = (first.getDay() + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells: (Date | null)[] = Array(startOffset).fill(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
        while (cells.length % 7) cells.push(null);
        return <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
            {['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map(x => <div key={x} className="p-2.5 text-center text-[11px] font-black text-slate-500">{x}</div>)}
          </div>
          <div className="grid grid-cols-7">{cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} className="min-h-24 sm:min-h-32 border-b border-r border-slate-100 dark:border-slate-800/70 bg-slate-50/40 dark:bg-slate-950/20"/>;
            const key = toLocalDateKey(day);
            const dayLessons = filteredLessons.filter(l => l.date === key).sort((a,b)=>a.startTime.localeCompare(b.startTime));
            const today = key === toLocalDateKey(new Date());
            return <button key={key} onClick={() => { setSelectedDate(day); setViewMode('daily'); }} className={`min-h-24 sm:min-h-32 p-2 border-b border-r border-slate-100 dark:border-slate-800/70 text-left hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 ${today ? 'bg-indigo-50/60 dark:bg-indigo-950/30' : ''}`}>
              <div className={`text-xs font-black mb-1 ${today ? 'text-indigo-600' : 'text-slate-700 dark:text-slate-300'}`}>{day.getDate()}</div>
              <div className="space-y-1">{dayLessons.slice(0,3).map(l => { const st = students.find(s => s.id === l.studentId); return <div key={l.id} className="truncate text-[9px] sm:text-[10px] px-1.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"><b>{l.startTime}</b> {st?.firstName || 'Öğrenci'}</div>})}{dayLessons.length > 3 && <div className="text-[9px] font-bold text-indigo-600">+{dayLessons.length-3} ders</div>}</div>
            </button>;
          })}</div>
        </div>;
      })()}

      {/* List / Daily View */}
      {(viewMode === 'daily' || viewMode === 'list') && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {viewMode === 'daily'
              ? `${formatDateTurkish(selectedDateStr, 'full')} Dersleri`
              : 'Tüm Planlı & Geçmiş Dersler'}
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {(viewMode === 'daily'
              ? filteredLessons.filter((l) => l.date === selectedDateStr)
              : filteredLessons
            ).map((lesson) => {
              const student = students.find((s) => s.id === lesson.studentId);
              return (
                <div
                  key={lesson.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-800 dark:text-slate-200 text-center">
                      <div>{lesson.startTime}</div>
                      <div className="text-[10px] text-slate-400">{lesson.date}</div>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {student ? `${student.firstName} ${student.lastName}` : 'Öğrenci'}{' '}
                        <span className="text-xs font-normal text-slate-400">
                          ({student?.gradeLevel})
                        </span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-400">
                        {lesson.topic || 'Matematik Dersi'} • {lesson.location || lesson.lessonType} • {formatCurrency(lesson.fee)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openModal('preLessonSummary', { lesson, student })}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                    >
                      Ön Özet
                    </button>
                    {!['Tamamlandı', 'İptal Edildi', 'Öğretmen İptal Etti'].includes(lesson.status) && (
                      <button onClick={() => handleCancelLesson(lesson)} className="px-3 py-1.5 rounded-xl border border-amber-200 text-amber-700 dark:border-amber-900 dark:text-amber-300 font-semibold">
                        İptal Et
                      </button>
                    )}
                    <button onClick={() => handleDeleteLesson(lesson)} className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 dark:border-rose-900 dark:text-rose-300 font-semibold">
                      Sil
                    </button>
                    {lesson.status === 'Başladı' ? (
                      <button
                        onClick={() => openModal('liveLesson', { lesson, student })}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold"
                      >
                        Canlı Ders
                      </button>
                    ) : ['Planlandı', 'Yaklaşıyor'].includes(lesson.status) ? (
                      <span className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold border border-indigo-100 dark:border-indigo-900">
                        Saatinde otomatik başlayacak
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl font-bold">
                        {lesson.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
