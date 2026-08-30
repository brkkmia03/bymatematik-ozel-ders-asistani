import { toLocalDateInputValue } from '../../utils/formatters';
import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Calendar,
  User,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Assignment } from '../../types';

interface AddAssignmentModalProps {
  initialStudentId?: string;
  onClose: () => void;
}

export const AddAssignmentModal: React.FC<AddAssignmentModalProps> = ({
  initialStudentId,
  onClose,
}) => {
  const { students, addAssignment } = useApp();
  const activeStudents = students.filter((s) => !s.isArchived);

  const [studentId, setStudentId] = useState(
    initialStudentId || (activeStudents[0]?.id ?? '')
  );
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [resourceName, setResourceName] = useState('');
  const [pages, setPages] = useState('');
  const [questionNumbers, setQuestionNumbers] = useState('');
  const [questionCount, setQuestionCount] = useState('');

  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 7);
  const [dueDate, setDueDate] = useState(toLocalDateInputValue(defaultDueDate));
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!studentId) { setError('Önce aktif bir öğrenci seçmelisiniz.'); return; }
    if (!resourceName.trim()) { setError('Kaynak adı zorunludur.'); return; }
    if (!dueDate) { setError('Teslim tarihi zorunludur.'); return; }
    if (dueDate < toLocalDateInputValue()) { setError('Teslim tarihi bugünden önce olamaz.'); return; }
    const parsedQuestionCount = questionCount.trim() === '' ? undefined : Number(questionCount);
    if (parsedQuestionCount !== undefined && (!Number.isFinite(parsedQuestionCount) || parsedQuestionCount < 0)) { setError('Soru sayısı geçerli bir sayı olmalıdır.'); return; }

    addAssignment({
      studentId,
      title: title || `${topic || 'Matematik'} Ödevi`,
      topic: topic || 'Genel Konu Tekrarı',
      resourceName,
      pages,
      questionNumbers,
      questionCount: parsedQuestionCount,
      assignedDate: toLocalDateInputValue(),
      dueDate,
      priority: 'Normal',
      status: 'Bekliyor',
      description,
    });

    onClose();
  };

  return (
    <div className="modal-overlay fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full my-6 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">
                Yeni Ödev Tanımla
              </h3>
              <p className="text-xs text-slate-500">
                Öğrenciye kaynak, sayfa ve soru aralığı ödevi atayın
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
          {activeStudents.length === 0 && <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 text-xs text-sky-800 dark:text-sky-200">Ödev vermek için önce aktif bir öğrenci ekleyin.</div>}
          {error && <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-700 dark:text-rose-300">{error}</div>}
          {/* Student Picker */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Öğrenci *
            </label>
            <select
              required
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold focus:outline-none"
            >
              {activeStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.gradeLevel})
                </option>
              ))}
            </select>
          </div>

          {/* Topic & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Ödev Başlığı
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: EBOB-EKOK Pekiştirme"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Konu
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Örn: Çarpanlar ve Katlar"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Resource & Pages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Kaynak Kitap / Föy *
              </label>
              <input
                type="text"
                required
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Sayfa Aralığı
              </label>
              <input
                type="text"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                placeholder="Sayfa 45-52"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Questions & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Soru No / Testler
              </label>
              <input
                type="text"
                value={questionNumbers}
                onChange={(e) => setQuestionNumbers(e.target.value)}
                placeholder="Test 3 Soru 1-12"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div className="space-y-1 sm:col-span-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Soru Sayısı
              </label>
              <input
                type="number"
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                min="0"
                placeholder="Elle girin"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Teslim / Kontrol Tarihi *
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Öğretmen Açıklaması / Talimat
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Öğrencinin dikkat etmesi gereken noktalar..."
              className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none resize-none"
            />
          </div>

          {/* Submit Actions */}
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
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Ödevi Kaydet</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
