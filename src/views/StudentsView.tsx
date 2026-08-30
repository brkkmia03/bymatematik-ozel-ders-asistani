import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  MessageSquare,
  Calendar,
  ChevronRight,
  Edit2,
  FileText,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateStudentStats, formatCurrency } from '../utils/formatters';

export const StudentsView: React.FC = () => {
  const {
    students,
    lessons,
    assignments,
    examResults: exams,
    packages,
    transactions,
    deleteStudentPermanent,
    openModal,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [tabFilter, setTabFilter] = useState<'active' | 'archived'>('active');

  const confirmAndDeleteStudent = (student: (typeof students)[number]) => {
    const fullName = `${student.firstName} ${student.lastName}`;
    const confirmed = window.confirm(
      `${fullName} kalıcı olarak silinecek.\n\nBu işlem öğrencinin derslerini, ödevlerini, sınavlarını, konu ilerlemesini, hedeflerini, yazılı kayıtlarını, paket/finans hareketlerini, WhatsApp geçmişini ve öğrenciye bağlı diğer kayıtları da silecektir.\n\nBu işlem geri alınamaz. Devam etmek istiyor musunuz?`
    );
    if (!confirmed) return;
    const finalConfirmed = window.confirm(`SON ONAY: ${fullName} ve tüm ilişkili verileri kalıcı olarak silinsin mi?`);
    if (!finalConfirmed) return;
    deleteStudentPermanent(student.id);
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    if (tabFilter === 'active' && s.isArchived) return false;
    if (tabFilter === 'archived' && !s.isArchived) return false;

    if (gradeFilter !== 'all' && s.gradeLevel !== gradeFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.parentName?.toLowerCase().includes(q) ||
        s.studentPhone?.includes(q) ||
        s.parentPhone?.includes(q) ||
        s.academicGoal?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // All student summary figures come from the shared metrics helper so cards, profile and reports stay consistent.
  const getStudentStats = (studentId: string) =>
    calculateStudentStats(studentId, lessons, assignments, exams, packages, transactions);

  const gradeOptions: string[] = Array.from(new Set<string>(students.map((s) => String(s.gradeLevel)))).sort((a, b) =>
    a.localeCompare(b, 'tr', { numeric: true })
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Search */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-display flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-600" />
              <span>Öğrenci Yönetimi</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Öğrencilerin akademik hedefleri, ders saatleri, ödevleri ve veli iletişimleri
            </p>
          </div>

          <button
            onClick={() => openModal('addStudent')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Öğrenci Ekle</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Öğrenci, veli veya telefon ara..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Grade Filter */}
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="text-xs font-semibold p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">Tüm Sınıflar</option>
              {gradeOptions.map((grade) => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>

          {/* Active / Archive Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
            <button
              onClick={() => setTabFilter('active')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                tabFilter === 'active'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Aktif ({students.filter((s) => !s.isArchived).length})
            </button>
            <button
              onClick={() => setTabFilter('archived')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                tabFilter === 'archived'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Arşiv ({students.filter((s) => s.isArchived).length})
            </button>
          </div>
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        {filteredStudents.map((student) => {
          const stats = getStudentStats(student.id);

          return (
            <div
              key={student.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              {/* Top Details */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-black text-base flex items-center justify-center shadow-sm">
                      {student.firstName.charAt(0)}
                      {student.lastName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                        {student.firstName} {student.lastName}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                          {student.gradeLevel}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] text-slate-500 truncate max-w-[120px]">
                          {student.academicGoal || student.targetExam || 'Matematik'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Dropdown / Profile Button */}
                  <button
                    onClick={() => openModal('studentProfile', { student })}
                    className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    title="Detaylı Profili Aç"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Stat Badges Grid */}
                <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Ders</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {stats.totalLessonCount} ({stats.totalLessonHours} sa)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Ödev</span>
                    <span className="font-bold text-emerald-600">
                      {stats.totalAssignmentsCount ? `%${stats.homeworkCompletionRate}` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Paket / Ücret</span>
                    <span className="font-bold text-indigo-600">
                      {stats.activePackage
                        ? `${stats.activePackage.remainingLessons} Kalan`
                        : formatCurrency(student.lessonFee)}
                    </span>
                  </div>
                </div>

                {/* Parent & Contact Quick Line */}
                <div className="text-xs text-slate-500 flex items-center justify-between pt-1">
                  <span>
                    👤 Veli: <strong>{student.parentName || '-'}</strong> ({student.parentRelationship || 'Veli'})
                  </span>
                  <span className="font-mono text-[11px]">
                    {student.parentPhone || student.studentPhone || '-'}
                  </span>
                </div>
              </div>

              {/* Bottom Quick Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => openModal('addLesson', { initialStudentId: student.id })}
                  className="flex-1 py-2 px-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Ders Ekle</span>
                </button>

                <button
                  onClick={() =>
                    openModal('whatsapp', {
                      student,
                      templateType: 'lesson_report',
                    })
                  }
                  className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 transition-colors"
                  title="WhatsApp Mesajı Gönder"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>

                <button
                  onClick={() => confirmAndDeleteStudent(student)}
                  className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 transition-colors"
                  title="Öğrenciyi Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => openModal('pdfPreview', { reportType: 'student_full_record', student })}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                  title="Tüm öğrenci verilerini PDF olarak al"
                >
                  <FileText className="w-4 h-4" />
                </button>

                <button
                  onClick={() => openModal('addStudent', { studentToEdit: student })}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Düzenle"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
