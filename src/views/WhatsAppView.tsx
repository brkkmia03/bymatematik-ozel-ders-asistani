import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  User,
  Copy,
  Check,
  Sparkles,
  Clock,
  History,
  CheckCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateWhatsAppMessage, openWhatsAppUrl } from '../utils/whatsappTemplates';
import { formatDateTurkish } from '../utils/formatters';

export const WhatsAppView: React.FC = () => {
  const {
    teacher,
    students,
    lessons,
    assignments,
    packages,
    whatsAppLogs,
    addWhatsAppLog,
    openModal,
  } = useApp();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id ?? '');
  const [templateType, setTemplateType] = useState<
    | 'lesson_report'
    | 'assignment'
    | 'payment_reminder'
    | 'schedule_change'
    | 'written_exam_prep'
    | 'motivation'
    | 'custom'
  >('lesson_report');
  const [copied, setCopied] = useState(false);
  const [customMessage, setCustomMessage] = useState('');

  const activeStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const studentLessons = lessons.filter((l) => l.studentId === activeStudent?.id);
  const latestLesson = studentLessons[0];
  const activePackage = packages.find(
    (p) => p.studentId === activeStudent?.id && p.status === 'Aktif'
  );
  const pendingAssignment = assignments.find((a) => a.studentId === activeStudent?.id);

  // Generate dynamic message. Özgün mesajda imza otomatik eklenir.
  const teacherName = `${teacher.firstName} ${teacher.lastName}`.trim();
  const customSignature = `Matematik Öğretmeni\n${teacherName}`;
  const messageText = templateType === 'custom'
    ? `${customMessage.trim()}${customMessage.trim() ? '\n\n' : ''}${customSignature}`
    : generateWhatsAppMessage(templateType, {
        student: activeStudent,
        teacher,
        lesson: latestLesson,
        assignment: pendingAssignment,
        packageItem: activePackage,
      });

  const handleSend = () => {
    if (!activeStudent) return;
    if (templateType === 'custom' && !customMessage.trim()) return;
    const phone = activeStudent.parentPhone || activeStudent.studentPhone;
    if (phone) {
      addWhatsAppLog({
        studentId: activeStudent.id,
        recipientPhone: phone,
        templateType,
        messageText,
        sentAt: new Date().toISOString(),
        status: 'Sent',
      });
      openWhatsAppUrl(phone, messageText);
    }
  };

  const handleCopy = () => {
    if (templateType === 'custom' && !customMessage.trim()) return;
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-display flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-600" />
            <span>Veli WhatsApp İletişim Merkezi</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ders sonu raporu, ödev hatırlatması, paket yenileme ve motivasyon mesajlarını tek tıkla veliye ulaştırın
          </p>
        </div>

        {/* Student & Template Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Öğrenci & Veli Seçin:
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full text-xs font-bold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.gradeLevel}) • Veli: {s.parentName || 'Aile'} ({s.parentPhone || s.studentPhone})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Mesaj Şablonu:
            </label>
            <select
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value as any)}
              className="w-full text-xs font-bold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
            >
              <option value="lesson_report">📊 Ders Sonu Bilgilendirme Raporu</option>
              <option value="assignment">📚 Ödev & Soru Sayısı Hatırlatması</option>
              <option value="payment_reminder">💳 Ders Ücreti & Paket Kredisi</option>
              <option value="schedule_change">🕒 Randevu & Saat Güncellemesi</option>
              <option value="written_exam_prep">📝 Okul Yazılı Sınav Hazırlığı</option>
              <option value="motivation">🌟 Haftalık Başarı & Tebrik Mesajı</option>
              <option value="custom">✍️ Özgün Mesaj Yaz</option>
            </select>
          </div>
        </div>
      </div>

      {/* Composer Grid: Live Chat Preview (Left) + Template History (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): WhatsApp Message Preview */}
        <div className="lg:col-span-2 bg-[#efeae2] dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                WA
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {activeStudent?.parentName || activeStudent?.firstName || 'Veli'}
                </h4>
                <p className="text-[10px] text-slate-500 font-mono">
                  {activeStudent?.parentPhone || activeStudent?.studentPhone}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Kopyalandı!' : 'Metni Kopyala'}</span>
              </button>
            </div>
          </div>

          {templateType === 'custom' && (
            <div className="bg-white/90 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Özgün mesajınızı yazın
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={7}
                placeholder="Veliye göndermek istediğiniz mesajı buraya yazın..."
                className="w-full resize-y min-h-[150px] rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-500">
                Mesajın sonuna “Matematik Öğretmeni” ve öğretmen adı-soyadı otomatik eklenir.
              </p>
            </div>
          )}

          {/* Green Chat Bubble */}
          <div className="bg-[#d9fdd3] dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800/60 p-5 rounded-3xl rounded-tl-sm text-xs text-slate-900 dark:text-emerald-100 whitespace-pre-wrap font-sans leading-relaxed shadow-sm">
            {messageText}
          </div>

          {/* Send Button */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSend}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>WhatsApp'ta Aç ve Gönder</span>
            </button>
          </div>
        </div>

        {/* Right Column: Sent Messages History */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-indigo-600" />
            <span>Gönderilen Mesaj Geçmişi</span>
          </h3>

          <div className="space-y-2.5 max-h-[480px] overflow-y-auto">
            {whatsAppLogs.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">
                Henüz kayıtlı mesaj bulunmuyor.
              </p>
            ) : (
              whatsAppLogs.map((log) => {
                const student = students.find((s) => s.id === log.studentId);
                return (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-900 dark:text-white">
                        {student ? `${student.firstName} ${student.lastName}` : 'Öğrenci'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDateTurkish(log.sentAt.split('T')[0], 'short')}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {log.messageText}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
