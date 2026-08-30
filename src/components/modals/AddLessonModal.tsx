import { toLocalDateInputValue } from '../../utils/formatters';
import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  BookOpen,
  MapPin,
  CheckCircle,
  Repeat,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LessonType } from '../../types';

interface AddLessonModalProps {
  initialDate?: string;
  initialStudentId?: string;
  topic?: string;
  onClose: () => void;
}

export const AddLessonModal: React.FC<AddLessonModalProps> = ({
  initialDate,
  initialStudentId,
  topic: initialTopic,
  onClose,
}) => {
  const { students, lessons, addLesson, teacher } = useApp();
  const activeStudents = students.filter((s) => !s.isArchived);

  const [studentId, setStudentId] = useState(
    initialStudentId || (activeStudents[0]?.id ?? '')
  );
  const [date, setDate] = useState(
    initialDate || toLocalDateInputValue()
  );
  const [startTime, setStartTime] = useState('16:00');
  const [duration, setDuration] = useState(60);
  const [lessonType, setLessonType] = useState<LessonType>('Birebir');
  const [location, setLocation] = useState('');
  const [topic, setTopic] = useState(initialTopic || '');
  const [subtopic, setSubtopic] = useState('');
  const initialSelectedStudent = activeStudents.find((s) => s.id === (initialStudentId || activeStudents[0]?.id));
  const [fee, setFee] = useState(initialSelectedStudent?.lessonFee ?? teacher.defaultLessonFee ?? teacher.defaultHourlyRate ?? 0);
  const [notes, setNotes] = useState('');
  const [repeatWeeks, setRepeatWeeks] = useState(1);
  const [error, setError] = useState('');

  // Aynı gün/saat aralığında aktif bir ders varsa kullanıcıyı kaydetmeden önce uyar.
  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  const candidateStart = toMinutes(startTime);
  const candidateEnd = candidateStart + Number(duration);
  const conflictLesson = lessons.find((l) => {
    if (l.date !== date || ['İptal Edildi', 'Öğretmen İptal Etti', 'Ertelendi'].includes(l.status)) return false;
    const existingStart = toMinutes(l.startTime);
    const existingEnd = existingStart + l.duration;
    return candidateStart < existingEnd && existingStart < candidateEnd;
  });

  const selectedStudent = activeStudents.find((s) => s.id === studentId);

  const isPastCompletedLesson = (lessonDate: string, lessonStartTime: string, lessonDuration: number) => {
    const [year, month, day] = lessonDate.split('-').map(Number);
    const [hour, minute] = lessonStartTime.split(':').map(Number);
    if (![year, month, day, hour, minute, lessonDuration].every(Number.isFinite)) return false;
    const lessonEnd = new Date(year, month - 1, day, hour, minute, 0, 0);
    lessonEnd.setMinutes(lessonEnd.getMinutes() + Number(lessonDuration));
    return lessonEnd.getTime() < Date.now();
  };

  const selectedLessonIsPast = isPastCompletedLesson(date, startTime, Number(duration));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!studentId) { setError('Önce aktif bir öğrenci seçmelisiniz.'); return; }
    if (!date || !startTime) { setError('Tarih ve başlangıç saati zorunludur.'); return; }
    if (!Number.isFinite(duration) || duration <= 0) { setError('Ders süresi geçersiz.'); return; }
    if (!Number.isFinite(fee) || fee < 0) { setError('Ders ücreti negatif olamaz.'); return; }
    if (conflictLesson && !window.confirm('Seçtiğiniz saat başka bir dersle çakışıyor. Yine de kaydetmek istiyor musunuz?')) return;

    let createdCount = 0;
    let lastWarning = '';
    // Create lesson (and repeated weeks if selected)
    for (let i = 0; i < repeatWeeks; i++) {
      const lessonDate = new Date(date);
      lessonDate.setDate(lessonDate.getDate() + i * 7);
      const formattedDate = toLocalDateInputValue(lessonDate);

      const historicalCompleted = isPastCompletedLesson(formattedDate, startTime, Number(duration));
      const result = addLesson({
        studentId,
        date: formattedDate,
        startTime,
        duration: Number(duration),
        status: historicalCompleted ? 'Tamamlandı' : 'Planlandı',
        lessonType,
        location: location.trim() || undefined,
        topic: topic.trim() || 'Matematik Dersi',
        subtopic: subtopic.trim() || undefined,
        fee: Number(fee),
        isBillable: true,
        repeatType: repeatWeeks > 1 ? 'Her Hafta' : 'Tek Seferlik',
        notificationTime: 60,
        notes: notes.trim() || undefined,
      });
      if (result.lesson) createdCount += 1;
      if (result.conflictWarning) lastWarning = result.conflictWarning;
    }

    if (createdCount === 0) { setError(lastWarning || 'Ders kaydı oluşturulamadı.'); return; }
    onClose();
  };

  return (
    <div className="modal-overlay fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full my-6 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">
                Yeni Ders Planla
              </h3>
              <p className="text-xs text-slate-500">
                Takvime yeni özel ders randevusu ekleyin
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeStudents.length === 0 && <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 text-xs text-sky-800 dark:text-sky-200">Ders planlamak için önce aktif bir öğrenci ekleyin.</div>}
          {error && <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-700 dark:text-rose-300">{error}</div>}
          {selectedLessonIsPast && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span><strong>Geçmiş ders kaydı:</strong> Seçilen dersin bitiş saati geçtiği için kayıt otomatik olarak <strong>Tamamlandı</strong> durumunda oluşturulacak.</span>
            </div>
          )}
          {/* Conflict Warning */}
          {conflictLesson && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900 flex items-start gap-2.5 text-amber-800 dark:text-amber-200 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Çakışma Uyarısı:</strong> Bu saat aralığında başka bir aktif ders bulunuyor. Kaydetmeden önce saatleri kontrol edin.
              </div>
            </div>
          )}

          {/* Student Picker */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Öğrenci Seçimi *
            </label>
            <select
              required
              value={studentId}
              onChange={(e) => {
                const sId = e.target.value;
                setStudentId(sId);
                const s = students.find((st) => st.id === sId);
                if (s) setFee(s.lessonFee);
              }}
              className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {activeStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.gradeLevel}) • {s.academicGoal || 'Hedef Belirtilmedi'}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Start Time & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tarih *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Başlangıç Saati *
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Süre (Dakika)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
              >
                <option value={45}>45 Dakika</option>
                <option value={60}>60 Dakika (1 Saat)</option>
                <option value={90}>90 Dakika (1.5 Saat)</option>
                <option value={120}>120 Dakika (2 Saat)</option>
              </select>
            </div>
          </div>

          {/* Lesson Type & Location & Fee */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Ders Türü
              </label>
              <select
                value={lessonType}
                onChange={(e) => setLessonType(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
              >
                <option value="Birebir">Birebir</option>
                <option value="Grup">Grup</option>
                <option value="Online">Online</option>
                <option value="Yüz Yüze Ev">Yüz Yüze - Ev</option>
                <option value="Yüz Yüze Kurum">Yüz Yüze - Kurum</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Konum / Adres
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Örn: Öğrenci Evi / Ofis"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Ders Ücreti (₺)
              </label>
              <input
                type="number"
                value={fee}
                onChange={(e) => setFee(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Topic & Subtopic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Planlanan Konu (İsteğe Bağlı)
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Örn: Çarpanlar ve Katlar"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Alt Başlık / Kazanım
              </label>
              <input
                type="text"
                value={subtopic}
                onChange={(e) => setSubtopic(e.target.value)}
                placeholder="Örn: Yeni Nesil Soru Çözümü"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Repeat Weekly Selector */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Haftalık Tekrarla
              </span>
            </div>
            <select
              value={repeatWeeks}
              onChange={(e) => setRepeatWeeks(Number(e.target.value))}
              className="text-xs font-semibold p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none"
            >
              <option value={1}>Tek Seferlik (1 Ders)</option>
              <option value={4}>4 Hafta Boyunca (4 Ders)</option>
              <option value={8}>8 Hafta Boyunca (8 Ders)</option>
              <option value={12}>12 Hafta Boyunca (12 Ders)</option>
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Ön Not / Hatırlatma
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ders öncesi dikkat edilecekler veya veli talepleri..."
              className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none resize-none"
            />
          </div>

          {/* Submit Controls */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Dersi Planla</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
