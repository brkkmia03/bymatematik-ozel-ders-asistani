import { toLocalDateInputValue } from '../../utils/formatters';
import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Sparkles,
  CheckCircle,
  Calculator,
  User,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateNetScore } from '../../utils/formatters';
import { ExamType } from '../../types';
import { CURRICULUM_DATA } from '../../data/curriculum';

interface AddExamModalProps {
  initialStudentId?: string;
  onClose: () => void;
}

export const AddExamModal: React.FC<AddExamModalProps> = ({
  initialStudentId,
  onClose,
}) => {
  const { students, addExamResult } = useApp();
  const activeStudents = students.filter((s) => !s.isArchived);

  const [studentId, setStudentId] = useState(
    initialStudentId || (activeStudents[0]?.id ?? '')
  );
  const [examType, setExamType] = useState<ExamType>('Okul Yazılısı');
  const [examName, setExamName] = useState('');
  const [publisher, setPublisher] = useState('');
  const [date, setDate] = useState(toLocalDateInputValue());

  const [correctCount, setCorrectCount] = useState<number>(0);
  const [wrongCount, setWrongCount] = useState<number>(0);
  const [emptyCount, setEmptyCount] = useState<number>(0);
  const [targetNet, setTargetNet] = useState<number>(0);

  const [incorrectTopics, setIncorrectTopics] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const selectedStudent = activeStudents.find((s) => s.id === studentId);
  const curriculumKey = selectedStudent?.gradeLevel === '8. Sınıf'
    ? '8. Sınıf (LGS)'
    : selectedStudent?.gradeLevel;
  const topicOptions = useMemo(() => CURRICULUM_DATA.filter((item) => item.gradeOrExam === curriculumKey), [curriculumKey]);

  useEffect(() => {
    if (!selectedStudent) return;
    const target = selectedStudent.targetExam;
    if (target === 'LGS') setExamType('LGS');
    else if (target === 'TYT Matematik') setExamType('TYT Matematik');
    else if (target === 'AYT Matematik') setExamType('AYT Matematik');
    else if (target === 'TYT + AYT') setExamType('TYT + AYT');
    else if (target === 'KPSS Matematik') setExamType('KPSS Matematik');
    else if (target === 'DGS Matematik') setExamType('DGS Matematik');
    else if (target === 'ALES Matematik') setExamType('ALES Matematik');
    else setExamType('Okul Yazılısı');
    setIncorrectTopics([]);
  }, [studentId, selectedStudent?.targetExam]);

  const toggleIncorrectTopic = (title: string) => {
    setIncorrectTopics((prev) => prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]);
  };

  // Auto calculate net score
  const isLGS = examType === 'LGS';
  const calculatedNet = calculateNetScore(Number(correctCount), Number(wrongCount), isLGS ? 'LGS' : 'TYT Matematik');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;

    addExamResult({
      studentId,
      examType,
      examName,
      date,
      correctCount: Number(correctCount),
      wrongCount: Number(wrongCount),
      emptyCount: Number(emptyCount),
      netScore: calculatedNet,
      targetNet: Number(targetNet) || undefined,
      incorrectTopics,
      publisher: publisher || undefined,
      notes: notes || undefined,
    });

    onClose();
  };

  return (
    <div className="modal-overlay fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full my-6 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">
                Deneme & Sınav Sonucu Ekle
              </h3>
              <p className="text-xs text-slate-500">
                Doğru, yanlış ve boş sayılarıyla net puanı otomatik hesaplayın
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

          {/* Exam Type & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Sınav Türü
              </label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value as ExamType)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none font-medium"
              >
                <option value="LGS">LGS Matematik (3 Yanlış = 1 Doğru)</option>
                <option value="TYT Matematik">TYT Matematik (4 Yanlış = 1 Doğru)</option>
                <option value="AYT Matematik">AYT Matematik (4 Yanlış = 1 Doğru)</option>
                <option value="TYT + AYT">TYT + AYT</option>
                <option value="KPSS Matematik">KPSS Matematik</option>
                <option value="DGS Matematik">DGS Matematik</option>
                <option value="ALES Matematik">ALES Matematik</option>
                <option value="Okul Yazılısı">Okul Yazılısı</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Sınav Adı
              </label>
              <input
                type="text"
                required
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="Örn: Türkiye Geneli Özdebir - 2"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Publisher & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Yayın / Kurum
              </label>
              <input
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="Örn: Çap, Karekök, MEB"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Sınav Tarihi
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Counts & Net Score Live Calculation Box */}
          <div className="p-4 bg-purple-50/70 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-900/60 space-y-3">
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div>
                <label className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                  Doğru (D)
                </label>
                <input
                  type="number"
                  min="0"
                  value={correctCount}
                  onChange={(e) => setCorrectCount(Number(e.target.value))}
                  className="w-full text-center text-sm font-bold p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-rose-700 dark:text-rose-400 block mb-1">
                  Yanlış (Y)
                </label>
                <input
                  type="number"
                  min="0"
                  value={wrongCount}
                  onChange={(e) => setWrongCount(Number(e.target.value))}
                  className="w-full text-center text-sm font-bold p-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Boş (B)
                </label>
                <input
                  type="number"
                  min="0"
                  value={emptyCount}
                  onChange={(e) => setEmptyCount(Number(e.target.value))}
                  className="w-full text-center text-sm font-bold p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none"
                />
              </div>
            </div>

            {/* Calculated Net Score Banner */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-purple-200 dark:border-purple-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Hesaplanan Matematik Neti
                </span>
                <span className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
                  {calculatedNet} Net
                </span>
              </div>

              <div className="text-right">
                <label className="text-[11px] font-bold text-slate-500 block mb-0.5">
                  Hedef Net:
                </label>
                <input
                  type="number"
                  step="0.25"
                  value={targetNet}
                  onChange={(e) => setTargetNet(Number(e.target.value))}
                  className="w-20 text-center text-xs font-bold p-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Incorrect Topics */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Yanlış Yapılan Konular
            </label>
            {topicOptions.length ? (
              <div className="max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                {topicOptions.map((item) => (
                  <label key={item.id} className="flex items-start gap-2 text-[11px] cursor-pointer p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800">
                    <input type="checkbox" checked={incorrectTopics.includes(item.title)} onChange={() => toggleIncorrectTopic(item.title)} className="mt-0.5" />
                    <span>{item.title}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">Bu öğrenci düzeyi için konu listesi bulunamadı.</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Sınav Değerlendirmesi / Öğretmen Görüşü
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Öğrencinin süre kullanımı, sınav stresi veya soru kökünü okuma performansı..."
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
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Sonucu Kaydet</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
