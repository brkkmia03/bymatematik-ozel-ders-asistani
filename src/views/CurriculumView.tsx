import React, { useEffect, useMemo, useState } from 'react';
import {
  GraduationCap,
  CheckCircle,
  Clock,
  Sparkles,
  Search,
  BookOpen,
  ChevronDown,
  ChevronUp,
  User,
  Plus,
  Star,
  Award,
  Tag,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CURRICULUM_DATA } from '../data/curriculum';

export const CurriculumView: React.FC = () => {
  const { students, curriculumProgress, toggleCurriculumOutcome, updateStudentTopicProgress, openModal } = useApp();

  const [selectedGrade, setSelectedGrade] = useState<string>('8. Sınıf (LGS)');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id ?? '');
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({
    'lgs-1': true,
    'lgs-2': true,
  });
  const [searchQuery, setSearchQuery] = useState('');

  const activeStudent = students.find((s) => s.id === selectedStudentId);
  const curriculumTabs = useMemo(() => {
    const order = ['5. Sınıf','6. Sınıf','7. Sınıf','8. Sınıf (LGS)','9. Sınıf','10. Sınıf','11. Sınıf','12. Sınıf','TYT Matematik','AYT Matematik','TYT + AYT Geometri'];
    const available = new Set(CURRICULUM_DATA.map((x) => x.gradeOrExam));
    return order.filter((item) => available.has(item));
  }, []);

  useEffect(() => {
    if (!activeStudent) return;
    const candidates = [
      activeStudent.targetExam === 'LGS' ? '8. Sınıf (LGS)' : activeStudent.targetExam,
      activeStudent.gradeLevel === '8. Sınıf' ? '8. Sınıf (LGS)' : activeStudent.gradeLevel,
      activeStudent.educationType,
    ].filter(Boolean) as string[];
    const match = candidates.find(c => curriculumTabs.includes(c));
    if (match) setSelectedGrade(match);
  }, [selectedStudentId, activeStudent?.targetExam, activeStudent?.gradeLevel, activeStudent?.educationType, curriculumTabs]);

  // Filter topics for the active grade tab
  const activeTopics = CURRICULUM_DATA.filter((item) => {
    if (selectedGrade !== 'all' && item.gradeOrExam !== selectedGrade) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.unit.toLowerCase().includes(q) ||
        item.subtopics.some((s) => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Student specific progress mapping
  const studentProgressList = curriculumProgress.filter((cp) => cp.studentId === selectedStudentId);
  const completedTopicIds = new Set(
    studentProgressList.filter((cp) => cp.status === 'Tamamlandı').map((cp) => cp.topicId)
  );

  const toggleTopicExpand = (topicId: string) => {
    setExpandedTopics((prev) => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  const totalTopicsCount = activeTopics.length;
  const completedCount = activeTopics.filter((t) => completedTopicIds.has(t.id)).length;
  const overallPercentage = totalTopicsCount ? Math.round((completedCount / totalTopicsCount) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Student Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-display flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
              <span>Konu & Kazanım Takip Sistemi</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              MEB & ÖSYM Matematik müfredatına göre öğrenci bazlı konu tamamlama ve kazanım takibi
            </p>
          </div>

          {/* Student Selector */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Öğrenci:
            </span>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="text-xs font-bold p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 focus:outline-none"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.gradeLevel})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Curriculum Selector Tabs & Overall Progress Bar */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {curriculumTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedGrade(tab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedGrade === tab
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}>
                {tab}
              </button>
            ))}
          </div>

          {/* Overall Student Progress Header Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border border-indigo-100 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  {activeStudent ? `${activeStudent.firstName} ${activeStudent.lastName}` : 'Öğrenci'} — {selectedGrade}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-indigo-600 text-white rounded-full">
                  %{overallPercentage} Tamamlandı
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Toplam {totalTopicsCount} ana konudan {completedCount} tanesi işlendi ve pekiştirildi.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full sm:w-64 space-y-1">
              <div className="w-full bg-white dark:bg-slate-800 rounded-full h-2.5 overflow-hidden border border-indigo-200/50">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all duration-500"
                  style={{ width: `${overallPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>0</span>
                <span>{completedCount} / {totalTopicsCount} Konu</span>
                <span>%100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Topics Accordion List */}
      <div className="space-y-3">
        {activeTopics.map((topic, index) => {
          const isExpanded = !!expandedTopics[topic.id];
          const isCompleted = completedTopicIds.has(topic.id);
          const progressItem = studentProgressList.find((p) => p.topicId === topic.id || p.topicTitle === topic.title);
          const currentStatus = progressItem?.status || 'Başlanmadı';

          return (
            <div
              key={topic.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs transition-all"
            >
              {/* Accordion Header */}
              <div
                onClick={() => toggleTopicExpand(topic.id)}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3.5 flex-1 pr-4">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                      {topic.unit}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {topic.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {topic.importanceLevel && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        topic.importanceLevel === 'Kritik'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}
                    >
                      {topic.importanceLevel}
                    </span>
                  )}

                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {currentStatus}
                  </span>

                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Accordion Body: Subtopics & Outcomes */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4 bg-slate-50/40 dark:bg-slate-950/20">
                  {/* Subtopics */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Alt Başlıklar & Konu Detayları:
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {topic.subtopics.map((sub, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-medium px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl"
                        >
                          • {sub}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Learning Outcomes */}
                  {topic.learningOutcomes.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        MEB Kazanımları:
                      </h4>
                      <ul className="space-y-1.5">
                        {topic.learningOutcomes.map((outcome, i) => (
                          <li
                            key={i}
                            className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                            <span>{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-200/60 dark:border-slate-800">
                    <select
                      value={currentStatus}
                      onChange={(e) => selectedStudentId && updateStudentTopicProgress(selectedStudentId, topic.id, topic.title, e.target.value as any)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      {['Başlanmadı','İşleniyor','Tamamlandı','Tekrar Gerekli','Soru Çözümü Gerekli','Denemeyle Pekiştirilecek'].map((status) => <option key={status}>{status}</option>)}
                    </select>
                    <button
                      onClick={() => {
                        if (selectedStudentId) {
                          toggleCurriculumOutcome(selectedStudentId, topic.id, topic.title);
                        }
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-700 hover:bg-emerald-600 hover:text-white'
                      }`}
                    >
                      {isCompleted ? '✅ Öğrenci Bu Konuyu Tamamladı' : '⭕ Konuyu Tamamlandı Olarak İşaretle'}
                    </button>

                    <button
                      onClick={() =>
                        openModal('addLesson', {
                          initialStudentId: selectedStudentId,
                          topic: topic.title,
                        })
                      }
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Bu Konu İçin Ders Planla</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
