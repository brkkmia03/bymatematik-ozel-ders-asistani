import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  Send,
  Copy,
  Check,
  Phone,
  User,
  Sparkles,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student, Lesson, Assignment, ExamResult } from '../../types';
import { getWhatsAppLink, isValidTurkishPhone, formatDateTurkish, formatCurrency, calculateStudentBalance } from '../../utils/formatters';
import { generateWhatsAppMessage } from '../../utils/whatsappTemplates';

interface WhatsAppModalProps {
  student?: Student;
  lesson?: Lesson;
  assignment?: Assignment;
  exam?: ExamResult;
  templateType?: 'lesson_report' | 'assignment' | 'reminder' | 'payment' | 'exam' | 'custom';
  onClose: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  student,
  lesson,
  assignment,
  exam,
  templateType = 'lesson_report',
  onClose,
}) => {
  const { teacher, students, lessonNotes, assignments, packages, transactions, logWhatsAppMessage } = useApp();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    student?.id || (students[0]?.id ?? '')
  );
  const [recipientType, setRecipientType] = useState<'parent' | 'student'>('parent');
  const [activeTemplate, setActiveTemplate] = useState<string>(templateType);
  const [messageText, setMessageText] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const activeStudent = students.find((s) => s.id === selectedStudentId) || student;
  const activeLessonNote = lesson ? lessonNotes.find((n) => n.lessonId === lesson.id) : undefined;

  const targetPhone =
    recipientType === 'parent'
      ? activeStudent?.parentPhone || ''
      : activeStudent?.studentPhone || '';

  const isPhoneValid = isValidTurkishPhone(targetPhone);

  // Her şablon sadece sistemde gerçekten bulunan verilerden oluşturulur.
  useEffect(() => {
    if (!activeStudent) return;

    const latestAssignment = assignment || (lesson
      ? assignments.find((a) => a.studentId === activeStudent.id && a.lessonId === lesson.id)
      : [...assignments]
          .filter((a) => a.studentId === activeStudent.id)
          .sort((a, b) => b.assignedDate.localeCompare(a.assignedDate))[0]);
    const activePackage = packages.find((p) => p.studentId === activeStudent.id && p.status === 'Aktif');

    if (activeTemplate === 'lesson_report') {
      const baseLesson = lesson ? { ...lesson } : undefined;
      if (baseLesson && activeLessonNote) {
        baseLesson.teacherNotes = activeLessonNote.teacherNote;
        baseLesson.nextHomeworkSummary = latestAssignment
          ? `${latestAssignment.title || latestAssignment.topic}${latestAssignment.resourceName ? ` • ${latestAssignment.resourceName}` : ''}${latestAssignment.pages ? ` • ${latestAssignment.pages}` : ''}`
          : undefined;
      }
      setMessageText(generateWhatsAppMessage('lesson_report', { student: activeStudent, teacher, lesson: baseLesson }));
    } else if (activeTemplate === 'assignment') {
      setMessageText(generateWhatsAppMessage('assignment', { student: activeStudent, teacher, assignment: latestAssignment }));
    } else if (activeTemplate === 'payment') {
      const balance = calculateStudentBalance(activeStudent.id, transactions).balance;
      const parentName = activeStudent.parentName ? `Sayın ${activeStudent.parentName}` : 'Sayın Velimiz';
      const signature = teacher.messageSignature || `Matematik Öğretmeni\n${teacher.firstName} ${teacher.lastName}\n${teacher.brandName}`;
      const packageText = activePackage ? `\nKalan paket hakkı: ${activePackage.remainingLessons} ders.` : '';
      const balanceText = balance > 0 ? `\nBekleyen bakiye: ${formatCurrency(balance, teacher.currency)}.` : '\nBekleyen ödeme görünmüyor.';
      setMessageText(`${parentName},\n\n${activeStudent.firstName} ${activeStudent.lastName} için özel ders ödeme bilgilendirmesidir.${packageText}${balanceText}\n\nİyi günler dilerim.\n${signature}`);
    } else if (activeTemplate === 'exam') {
      if (!exam) {
        setMessageText(`Sayın ${activeStudent.parentName || 'Velimiz'},\n\n${activeStudent.firstName} ${activeStudent.lastName} için henüz bu mesaja bağlanmış bir sınav sonucu bulunmuyor. Mesajı göndermeden önce ilgili sınav sonucunu seçebilirsiniz.\n\n${teacher.messageSignature || `${teacher.firstName} ${teacher.lastName}\n${teacher.brandName}`}`);
      } else {
        setMessageText(`Sayın ${activeStudent.parentName || 'Velimiz'},\n\n${activeStudent.firstName} ${activeStudent.lastName} öğrencimizin ${exam.examName} sonucu:\n\n📅 Tarih: ${formatDateTurkish(exam.date, 'full')}\n✅ Doğru: ${exam.correctCount}\n❌ Yanlış: ${exam.wrongCount}\n⚪ Boş: ${exam.emptyCount}\n🎯 Net: ${exam.netScore}${exam.totalScore !== undefined ? `\n📊 Puan: ${exam.totalScore}` : ''}\n\nBir sonraki ders planını bu sonuçlara göre güncelleyeceğiz.\n\n${teacher.messageSignature || `${teacher.firstName} ${teacher.lastName}\n${teacher.brandName}`}`);
      }
    } else {
      setMessageText(`Sayın ${activeStudent.parentName || 'Velimiz'},\n\n${activeStudent.firstName} ${activeStudent.lastName} öğrencimizin ders süreciyle ilgili bilgilendirme mesajıdır.\n\n${teacher.messageSignature || `${teacher.firstName} ${teacher.lastName}\n${teacher.brandName}`}`);
    }
  }, [activeStudent, activeTemplate, lesson, assignment, exam, teacher, activeLessonNote, assignments, packages, transactions]);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    if (!activeStudent) return;
    const { url, error } = getWhatsAppLink(targetPhone, messageText);
    if (!url) {
      window.alert(error || 'Veli telefon numarası kayıtlı değil.');
      return;
    }

    // Yalnızca geçerli numara ve hazır mesaj varsa geçmişe kaydet.
    logWhatsAppMessage({
      studentId: activeStudent.id,
      recipientType,
      recipientPhone: targetPhone,
      templateType: activeTemplate as any,
      messageText,
    });

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">
                Veli WhatsApp İletişim Merkezi
              </h3>
              <p className="text-xs text-slate-500">
                1 Tıkla Hazır Şablon Oluştur ve WhatsApp'tan Gönder
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

        {/* Student & Recipient Select */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Öğrenci Seçimi
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold focus:outline-none"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.gradeLevel})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Alıcı Numarası
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRecipientType('parent')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold border transition-colors ${
                  recipientType === 'parent'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                }`}
              >
                Veli ({activeStudent?.parentPhone ? activeStudent.parentPhone : 'Yok'})
              </button>
              <button
                type="button"
                onClick={() => setRecipientType('student')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold border transition-colors ${
                  recipientType === 'student'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                }`}
              >
                Öğrenci
              </button>
            </div>
          </div>
        </div>

        {/* Template Selector Chips */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Hazır Mesaj Şablonu
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'lesson_report', label: '📊 Ders Sonu Raporu' },
              { id: 'assignment', label: '📚 Ödev Hatırlatma' },
              { id: 'exam', label: '🎯 Deneme Sonucu' },
              { id: 'payment', label: '💳 Ödeme / Paket' },
              { id: 'custom', label: '✍️ Özel Mesaj' },
            ].map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => setActiveTemplate(tmpl.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTemplate === tmpl.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {tmpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Phone Validation Alert */}
        {!isPhoneValid && targetPhone && (
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Uyarı: Kayıtlı telefon numarası ({targetPhone}) standart 10 veya 11 haneli formata tam uymayabilir.
            </span>
          </div>
        )}

        {/* Message Editor */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Gönderilecek Mesaj Metni (Düzenleyebilirsiniz)
            </label>
            <span className="text-[10px] text-slate-400 font-mono">
              {messageText.length} karakter
            </span>
          </div>
          <textarea
            rows={7}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="w-full text-xs font-sans leading-relaxed p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none font-medium"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleCopy}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600">Kopyalandı!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Metni Kopyala</span>
              </>
            )}
          </button>

          <button
            onClick={handleOpenWhatsApp}
            disabled={!isPhoneValid || !messageText.trim()}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>WhatsApp'ta Aç ve Gönder</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </button>
        </div>
      </div>
    </div>
  );
};
