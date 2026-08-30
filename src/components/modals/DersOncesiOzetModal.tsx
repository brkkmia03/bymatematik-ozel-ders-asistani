import React from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  AlertTriangle,
  CreditCard,
  Play,
  CheckCircle,
  FileText,
  User,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Lesson, Student } from '../../types';
import { formatDateTurkish, formatCurrency } from '../../utils/formatters';

interface DersOncesiOzetModalProps {
  lesson: Lesson;
  student: Student;
  onClose: () => void;
}

export const DersOncesiOzetModal: React.FC<DersOncesiOzetModalProps> = ({
  lesson,
  student,
  onClose,
}) => {
  const {
    lessonNotes,
    lessons,
    assignments,
    packages,
    transactions,
    startLiveLesson,
    openModal,
  } = useApp();

  // Find previous completed lessons and notes for this student
  const completedLessons = lessons
    .filter((l) => l.studentId === student.id && l.status === 'Tamamlandı')
    .sort((a, b) => new Date(`${b.date}T${b.startTime}`).getTime() - new Date(`${a.date}T${a.startTime}`).getTime());

  const lastLesson = completedLessons[0] || null;
  const lastNote = lastLesson
    ? lessonNotes.find((n) => n.lessonId === lastLesson.id)
    : null;

  // Unchecked / pending homework
  const pendingHomework = assignments.filter(
    (a) => a.studentId === student.id && (a.status === 'Bekliyor' || a.status === 'Yapılıyor' || a.status === 'Yapılmadı')
  );

  // Active package
  const activePackage = packages.find(
    (p) => p.studentId === student.id && p.status === 'Aktif'
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">
                Ders Öncesi Hazırlık Özeti
              </h3>
              <p className="text-xs text-slate-500">
                {student.firstName} {student.lastName} ({student.gradeLevel}) • {lesson.date} {lesson.startTime}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Cards */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {/* Last Lesson & Topic Taught */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                📌 Son İşlenen Ders & Konu
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {lastLesson ? formatDateTurkish(lastLesson.date, 'short') : 'İlk Ders'}
              </span>
            </div>

            {lastNote ? (
              <div className="space-y-1 text-xs">
                <div className="font-bold text-slate-900 dark:text-white">
                  {lastNote.topic} {lastNote.subtopic ? `• ${lastNote.subtopic}` : ''}
                </div>
                {lastNote.difficultAreas && (
                  <p className="text-rose-600 dark:text-rose-400 text-[11px] font-medium">
                    ⚠️ Zorlandığı Nokta: {lastNote.difficultAreas}
                  </p>
                )}
                {lastNote.teacherNote && (
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    💡 Son Not: {lastNote.teacherNote}
                  </p>
                )}
                {lastNote.nextLessonPlan && (
                  <p className="text-indigo-600 dark:text-indigo-400 text-[11px] font-semibold">
                    🎯 Planlanan Hedef: {lastNote.nextLessonPlan}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Bu öğrenciyle kayıtlı geçmiş ders notu bulunmamaktadır.
              </p>
            )}
          </div>

          {/* Pending Homework Checklist */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                <span>Kontrol Bekleyen Ödevler ({pendingHomework.length})</span>
              </span>
            </div>

            {pendingHomework.length === 0 ? (
              <p className="text-xs text-slate-500">
                Kontrol bekleyen açık ödev bulunmuyor.
              </p>
            ) : (
              <div className="space-y-1.5">
                {pendingHomework.map((asn) => (
                  <div
                    key={asn.id}
                    className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {asn.topic}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {asn.resourceName} {asn.pages ? `• ${asn.pages}` : ''}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-md">
                      {asn.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Package & Payment Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Paket Kalan Ders
              </div>
              <div className="text-base font-black text-slate-900 dark:text-white">
                {activePackage ? `${activePackage.remainingLessons} Ders Kaldı` : 'Ders Başı Ücret'}
              </div>
              <div className="text-[10px] text-slate-500">
                {activePackage ? `${activePackage.totalLessons} derslik paket` : `${formatCurrency(student.lessonFee)} / ders`}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Akademik Hedef
              </div>
              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 line-clamp-2">
                {student.academicGoal || 'Belirtilmedi'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Kapat
          </button>
          <button
            onClick={() => {
              onClose();
              startLiveLesson(lesson.id);
              openModal('liveLesson', { lesson, student });
            }}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Play className="w-4 h-4" />
            <span>Dersi Başlat (Kronometre)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
