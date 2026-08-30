import React, { useMemo, useState } from 'react';
import {
  FileText,
  Printer,
  Calendar,
  DollarSign,
  Award,
  BookOpen,
  Sparkles,
  ClipboardList,
  TrendingUp,
  ReceiptText,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const todayLocal = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const ReportsView: React.FC = () => {
  const { students, openModal } = useApp();
  const activeStudents = useMemo(() => students.filter((s) => !s.isArchived), [students]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(activeStudents[0]?.id ?? students[0]?.id ?? '');
  const [datePreset, setDatePreset] = useState<'30' | '90' | '180' | 'all' | 'custom'>('90');
  const [dateFrom, setDateFrom] = useState(daysAgo(90));
  const [dateTo, setDateTo] = useState(todayLocal());
  const [reportAudience, setReportAudience] = useState<'teacher' | 'family'>('family');

  const activeStudent = students.find((s) => s.id === selectedStudentId) || activeStudents[0] || students[0];

  const applyPreset = (value: typeof datePreset) => {
    setDatePreset(value);
    if (value === '30') setDateFrom(daysAgo(30));
    if (value === '90') setDateFrom(daysAgo(90));
    if (value === '180') setDateFrom(daysAgo(180));
    if (value === 'all') setDateFrom('');
    if (value !== 'custom') setDateTo(todayLocal());
  };

  const reportTypes = [
    { id: 'student_progress', title: 'Öğrenci Gelişim Raporu', desc: 'Öğretmen veya veli/öğrenci için ayrı içerik üreten gelişim raporu.', icon: Award, color: 'bg-indigo-600', studentSpecific: true, audienceAware: true },
    { id: 'lesson_history', title: 'Ders Geçmişi', desc: 'Tarih, saat, konu, süre ve ders durumlarının ayrıntılı dökümü.', icon: ClipboardList, color: 'bg-violet-600', studentSpecific: true },
    { id: 'weekly_schedule', title: 'Haftalık Ders Programı', desc: 'Önümüzdeki 7 günlük ders çizelgesini yazdırmaya hazırlar.', icon: Calendar, color: 'bg-blue-600', studentSpecific: false },
    { id: 'monthly_schedule', title: 'Aylık Ders Programı', desc: 'Önümüzdeki 31 günlük ders planını tek tabloda gösterir.', icon: Calendar, color: 'bg-cyan-600', studentSpecific: false },
    { id: 'assignment_report', title: 'Ödev Raporu', desc: 'Ödevlerin teslim tarihlerini, kaynaklarını ve durumlarını listeler.', icon: BookOpen, color: 'bg-amber-600', studentSpecific: true },
    { id: 'topic_progress', title: 'Konu İlerleme Raporu', desc: 'Konu durumlarını, başarı yüzdesini ve çözülen soru sayılarını gösterir.', icon: TrendingUp, color: 'bg-teal-600', studentSpecific: true },
    { id: 'exam_report', title: 'Deneme / Sınav Raporu', desc: 'Doğru, yanlış, boş, net, puan ve yanlış konu gelişimini raporlar.', icon: Sparkles, color: 'bg-fuchsia-600', studentSpecific: true },
    { id: 'written_exam_plan', title: 'Yazılı Hazırlık Planı', desc: 'Yazılı tarihleri, hedef not, hazırlık oranı ve konuları gösterir.', icon: FileText, color: 'bg-rose-600', studentSpecific: true },
    { id: 'financial_summary', title: 'Finans Özeti', desc: 'Seçili tarih aralığında kazanılan, tahsil edilen ve hareketleri gösterir.', icon: DollarSign, color: 'bg-emerald-600', studentSpecific: false },
    { id: 'account_statement', title: 'Öğrenci Hesap Ekstresi', desc: 'Seçilen öğrencinin tarih aralığındaki finans hareketlerini listeler.', icon: ReceiptText, color: 'bg-slate-700', studentSpecific: true },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-display flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              <span>PDF & Rapor Merkezi</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">Öğretmen iç raporu ile veli/öğrenci paylaşım raporlarını birbirinden ayırır; özel notları korur.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Öğrenci:</span>
            <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} className="text-xs font-bold p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 focus:outline-none">
              {activeStudents.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.gradeLevel})</option>)}
            </select>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">Tarih Aralığı</p>
            <div className="flex flex-wrap gap-2">
              {([['30','30 Gün'],['90','3 Ay'],['180','6 Ay'],['all','Tümü'],['custom','Özel']] as const).map(([id,label]) => (
                <button key={id} onClick={() => applyPreset(id)} className={`px-3 py-2 rounded-xl text-xs font-bold border ${datePreset === id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>{label}</button>
              ))}
            </div>
            {datePreset === 'custom' && <div className="flex flex-wrap gap-2 pt-1"><input type="date" value={dateFrom} onChange={(e)=>setDateFrom(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"/><input type="date" value={dateTo} onChange={(e)=>setDateTo(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"/></div>}
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">Gelişim Raporu Hedef Kitlesi</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={()=>setReportAudience('family')} className={`p-3 rounded-2xl border text-left ${reportAudience === 'family' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-700'}`}><Users className="w-4 h-4 text-emerald-600 mb-1"/><p className="text-xs font-black">Veli / Öğrenci</p><p className="text-[10px] text-slate-500">Özel öğretmen notları yok</p></button>
              <button onClick={()=>setReportAudience('teacher')} className={`p-3 rounded-2xl border text-left ${reportAudience === 'teacher' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' : 'border-slate-200 dark:border-slate-700'}`}><ShieldCheck className="w-4 h-4 text-indigo-600 mb-1"/><p className="text-xs font-black">Öğretmen</p><p className="text-[10px] text-slate-500">Özel not ve ayrıntılı analiz</p></button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTypes.map((rpt) => {
          const Icon = rpt.icon;
          return (
            <div key={rpt.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3"><div className={`w-12 h-12 rounded-2xl ${rpt.color} text-white flex items-center justify-center font-bold shadow-md`}><Icon className="w-6 h-6" /></div><div><h3 className="text-base font-bold text-slate-900 dark:text-white font-display">{rpt.title}</h3><p className="text-xs text-slate-500 mt-0.5">{rpt.desc}</p></div></div>
                {rpt.audienceAware && <div className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black ${reportAudience === 'teacher' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>{reportAudience === 'teacher' ? 'ÖĞRETMEN RAPORU' : 'VELİ / ÖĞRENCİ RAPORU'}</div>}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-indigo-600">{rpt.studentSpecific && activeStudent ? `${activeStudent.firstName} ${activeStudent.lastName}` : 'Genel Rapor'}</span>
                <button disabled={rpt.studentSpecific && !activeStudent} onClick={() => openModal('pdfPreview', { reportType: rpt.id, student: rpt.studentSpecific ? activeStudent : undefined, reportOptions: { dateFrom, dateTo, reportAudience } })} className="px-4 py-2 rounded-xl bg-indigo-600 disabled:opacity-40 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all active:scale-95"><Printer className="w-3.5 h-3.5"/><span>Önizle & Yazdır</span></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
