import { toLocalDateInputValue } from '../../utils/formatters';
import React, { useState } from 'react';
import {
  CheckCircle,
  X,
  Star,
  BookOpen,
  HelpCircle,
  FileText,
  DollarSign,
  Send,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Lesson, Student, LessonCompletionData } from '../../types';
import { CURRICULUM_DATA } from '../../data/curriculum';

interface DersSonuFormModalProps {
  lesson: Lesson;
  student: Student;
  actualElapsedMinutes?: number;
  onClose: () => void;
}

export const DersSonuFormModal: React.FC<DersSonuFormModalProps> = ({
  lesson,
  student,
  actualElapsedMinutes = 60,
  onClose,
}) => {
  const { completeLesson, closeModal } = useApp();

  const [topic, setTopic] = useState(lesson.topic || '');
  const [subtopic, setSubtopic] = useState(lesson.subtopic || '');
  const [learningOutcome, setLearningOutcome] = useState('');
  const [usedResources, setUsedResources] = useState('');
  const [solvedQuestionsCount, setSolvedQuestionsCount] = useState(0);

  // 1-5 Star Ratings
  const [participationRating, setParticipationRating] = useState(3);
  const [topicMasteryRating, setTopicMasteryRating] = useState(3);
  const [problemSolvingRating, setProblemSolvingRating] = useState(3);

  const [difficultAreas, setDifficultAreas] = useState('');
  const [teacherNote, setTeacherNote] = useState('');
  const [nextLessonPlan, setNextLessonPlan] = useState('');

  const [actualDuration, setActualDuration] = useState(actualElapsedMinutes || lesson.duration || 60);
  const [isBillable, setIsBillable] = useState(true);

  // Homework Section
  const [giveHomework, setGiveHomework] = useState(false);
  const [homeworkTitle, setHomeworkTitle] = useState('');
  const [homeworkResource, setHomeworkResource] = useState('');
  const [homeworkPage, setHomeworkPage] = useState('');
  const [homeworkQuestions, setHomeworkQuestions] = useState('');
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 7);
  const [homeworkDueDate, setHomeworkDueDate] = useState(toLocalDateInputValue(defaultDueDate));
  const [homeworkDescription, setHomeworkDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const completionData: LessonCompletionData = {
      topic,
      subtopic,
      learningOutcome,
      usedResources,
      solvedQuestionsCount: Number(solvedQuestionsCount) || 0,
      participationRating,
      topicMasteryRating,
      problemSolvingRating,
      difficultAreas,
      teacherNote,
      nextLessonPlan,
      isBillable,
      actualDuration: Number(actualDuration) || 60,
      giveHomework,
      homeworkTitle: giveHomework ? homeworkTitle : undefined,
      homeworkResource: giveHomework ? homeworkResource : undefined,
      homeworkPage: giveHomework ? homeworkPage : undefined,
      homeworkQuestions: giveHomework ? homeworkQuestions : undefined,
      homeworkDueDate: giveHomework ? homeworkDueDate : undefined,
      homeworkDescription: giveHomework ? homeworkDescription : undefined,
    };

    // completeLesson, başarılı kayıt sonrası veli WhatsApp raporunu açar.
    // Burada onClose çağırmak yeni açılan WhatsApp modalını da kapatıyordu.
    completeLesson(lesson.id, completionData);
  };

  const renderStarPicker = (
    label: string,
    value: number,
    onChange: (val: number) => void
  ) => (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            onClick={() => onChange(star)}
            className="p-1 focus:outline-none hover:scale-110 transition-transform"
          >
            <Star
              className={`w-4 h-4 ${
                star <= value
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-200 dark:text-slate-700'
              }`}
            />
          </button>
        ))}
        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1.5 w-6 text-right">
          {value}/5
        </span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full my-6 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">
                Ders Sonu Formu & Raporu
              </h3>
              <p className="text-xs text-slate-500">
                {student.firstName} {student.lastName} ({student.gradeLevel}) • {lesson.date}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main Topic and Subtopic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                İşlenen Ana Konu *
              </label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Örn: EBOB-EKOK / Türev"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Alt Konu / Bölüm
              </label>
              <input
                type="text"
                value={subtopic}
                onChange={(e) => setSubtopic(e.target.value)}
                placeholder="Örn: Yeni Nesil Modelleme"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Kazanım & Kaynak & Soru Sayısı */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1 sm:col-span-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Kullanılan Kaynak
              </label>
              <input
                type="text"
                value={usedResources}
                onChange={(e) => setUsedResources(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1 sm:col-span-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Çözülen Soru Sayısı
              </label>
              <input
                type="number"
                min="0"
                value={solvedQuestionsCount}
                onChange={(e) => setSolvedQuestionsCount(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1 sm:col-span-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Gerçekleşen Süre (Dk)
              </label>
              <input
                type="number"
                min="10"
                value={actualDuration}
                onChange={(e) => setActualDuration(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Performance & Mastery Ratings (1-5 stars) */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Öğrenci Değerlendirmesi
            </div>
            {renderStarPicker('Derse Katılım & Odak', participationRating, setParticipationRating)}
            {renderStarPicker('Konu Hakimiyeti', topicMasteryRating, setTopicMasteryRating)}
            {renderStarPicker('Soru Çözme & Hız', problemSolvingRating, setProblemSolvingRating)}
          </div>

          {/* Difficulties & Teacher Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Zorlandığı Noktalar / Eksikler
              </label>
              <textarea
                rows={2}
                value={difficultAreas}
                onChange={(e) => setDifficultAreas(e.target.value)}
                placeholder="Örn: Formül ezberinde veya işlem hatasında takıldı..."
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Öğretmen Notu (Veli Raporuna Eklenir)
              </label>
              <textarea
                rows={2}
                value={teacherNote}
                onChange={(e) => setTeacherNote(e.target.value)}
                placeholder="Örn: Çok başarılı bir dersti, ödevlerini aksatmasın..."
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Next Lesson Plan */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Bir Sonraki Ders Planı
            </label>
            <input
              type="text"
              value={nextLessonPlan}
              onChange={(e) => setNextLessonPlan(e.target.value)}
              placeholder="Örn: Üslü sayılar 2. bölüm ve 20 soru çözümü"
              className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Homework Assignment Toggle & Fields */}
          <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  Bu Derse Bağlı Ödev Tanımla
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={giveHomework}
                  onChange={(e) => setGiveHomework(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {giveHomework && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 animate-in fade-in">
                <div className="sm:col-span-1">
                  <input
                    type="text"
                    value={homeworkResource}
                    onChange={(e) => setHomeworkResource(e.target.value)}
                    placeholder="Kaynak (Soru Bankası)"
                    className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-1">
                  <input
                    type="text"
                    value={homeworkPage}
                    onChange={(e) => setHomeworkPage(e.target.value)}
                    placeholder="Sayfa / Föy"
                    className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-1">
                  <input
                    type="date"
                    value={homeworkDueDate}
                    onChange={(e) => setHomeworkDueDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isBillable"
                checked={isBillable}
                onChange={(e) => setIsBillable(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label
                htmlFor="isBillable"
                className="text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Finans kaydı / bakiye oluştur
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Kaydet & Veli Raporuna Geç</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
