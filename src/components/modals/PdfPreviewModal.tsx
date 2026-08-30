import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  FileText,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateHTMLReportContent } from '../../utils/pdfGenerator';
import { Student } from '../../types';

interface PdfPreviewModalProps {
  reportType: string;
  student?: Student;
  reportOptions?: { dateFrom?: string; dateTo?: string; reportAudience?: 'teacher' | 'family' };
  onClose: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  reportType,
  student,
  reportOptions,
  onClose,
}) => {
  const {
    teacher,
    students,
    lessons,
    assignments,
    exams,
    writtenExams,
    transactions,
    packages,
    topicProgress,
    goals,
    openModal,
  } = useApp();

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const generalReportTypes = new Set(['weekly_schedule', 'monthly_schedule', 'financial_summary']);
  const targetStudent = generalReportTypes.has(reportType) ? undefined : (student || students[0]);
  // Generate high-fidelity HTML report with 100% Turkish characters
  const htmlContent = generateHTMLReportContent(reportType, {
    student: targetStudent,
    teacher,
    students,
    lessons,
    assignments,
    exams,
    writtenExams,
    transactions,
    packages,
    curriculumProgress: topicProgress,
    goals,
    reportOptions,
  });

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  const handleSavePdf = () => {
    // Tarayıcının baskı motoru Türkçe karakterleri ve özel fontları doğru korur.
    // Kullanıcı açılan pencereden ‘PDF olarak kaydet’ seçeneğini kullanabilir.
    handlePrint();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full h-[90vh] my-4 p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-display">
                Rapor Önizleme & PDF Çıktısı
              </h3>
              <p className="text-xs text-slate-500">
                {targetStudent ? `${targetStudent.firstName} ${targetStudent.lastName}` : 'Genel Rapor'} • {reportOptions?.reportAudience === 'teacher' ? 'Öğretmen Raporu' : 'Paylaşım Raporu'}
              </p>
            </div>
          </div>

          {/* Action Buttons in Header */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Yazdır / PDF Olarak Kaydet</span>
            </button>

            <button
              onClick={handleSavePdf}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5"
              title="PDF Olarak Kaydet"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">PDF Olarak Kaydet</span>
            </button>

            {targetStudent && (
              <button
                onClick={() => {
                  onClose();
                  openModal('whatsapp', { student: targetStudent, templateType: 'lesson_report' });
                }}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
                title="Veliye WhatsApp'tan Gönder"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Document Preview Frame */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative">
          <iframe
            ref={iframeRef}
            srcDoc={htmlContent}
            title="PDF Preview"
            className="w-full h-full border-none bg-white"
          />
        </div>

        {/* Footer info note */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span>Türkçe karakterler ve baskı formatı %100 uyumludur.</span>
          <span className="font-semibold text-indigo-600">@bymatematiik</span>
        </div>
      </div>
    </div>
  );
};
