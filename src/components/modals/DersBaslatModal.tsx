import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  X,
  Clock,
  User,
  BookOpen,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Lesson, Student } from '../../types';

interface DersBaslatModalProps {
  lesson: Lesson;
  student: Student;
  onClose: () => void;
}

export const DersBaslatModal: React.FC<DersBaslatModalProps> = ({
  lesson,
  student,
  onClose,
}) => {
  const {
    activeLessonId,
    activeLessonElapsedSeconds,
    startLiveLesson,
    pauseLiveLesson,
    resumeLiveLesson,
    stopAndOpenCompletionModal,
    cancelLiveLesson,
  } = useApp();

  const [notesScratchpad, setNotesScratchpad] = useState('');
  const isRunningForThisLesson = activeLessonId === lesson.id;

  // Auto-start stopwatch if not started yet
  useEffect(() => {
    if (!isRunningForThisLesson) {
      startLiveLesson(lesson.id);
    }
  }, [lesson.id]);

  const minutes = Math.floor(activeLessonElapsedSeconds / 60);
  const seconds = activeLessonElapsedSeconds % 60;
  const plannedDuration = lesson.duration || 60;
  const progressPercent = Math.min(100, Math.round((minutes / plannedDuration) * 100));

  return (
    <div className="modal-overlay fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">
                  Canlı Ders Modu
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-full">
                  Yayında
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {student.firstName} {student.lastName} • {student.gradeLevel} ({student.targetExam || 'Matematik'})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stopwatch Display */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-3xl text-center space-y-3 shadow-inner">
          <div className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">
            Geçen Süre / Planlanan {plannedDuration} Dk
          </div>

          <div className="font-mono font-black text-5xl sm:text-6xl tracking-wider text-white">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                minutes > plannedDuration ? 'bg-amber-400' : 'bg-indigo-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Başlangıç: {lesson.startTime}</span>
            <span>İlerleme: %{progressPercent}</span>
            <span>Hedef: {plannedDuration} dk</span>
          </div>
        </div>

        {/* Lesson Info Pill */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              📌 Konu: {lesson.topic || 'Genel Matematik'}
            </span>
            <span className="text-slate-500">{lesson.lessonType}</span>
          </div>
          {lesson.notes && (
            <p className="text-slate-600 dark:text-slate-400 text-[11px]">
              <strong>Ön Not:</strong> {lesson.notes}
            </p>
          )}
        </div>

        {/* Live Scratchpad for Teacher */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Ders Esnasında Hızlı Notlar (İsteğe Bağlı)</span>
          </label>
          <textarea
            value={notesScratchpad}
            onChange={(e) => setNotesScratchpad(e.target.value)}
            placeholder="Öğrencinin takıldığı soru tipleri, çözülen soru sayısı veya ders sonu için hatırlatmalar..."
            rows={3}
            className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => {
              if (isRunningForThisLesson) {
                pauseLiveLesson();
              } else {
                resumeLiveLesson();
              }
            }}
            className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors"
          >
            {isRunningForThisLesson ? (
              <>
                <Pause className="w-4 h-4 text-amber-500" />
                <span>Kronometreyi Duraklat</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-emerald-500" />
                <span>Devam Et</span>
              </>
            )}
          </button>

          <button
            onClick={stopAndOpenCompletionModal}
            className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-98 transition-all"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Dersi Tamamla & Raporla</span>
          </button>
        </div>
      </div>
    </div>
  );
};
