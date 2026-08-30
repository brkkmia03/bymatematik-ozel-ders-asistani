import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles, Plus, Trash2, TrendingUp, Target, AlertTriangle, BarChart3 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateTurkish } from '../utils/formatters';

const ExamLineChart: React.FC<{ values: { label: string; value: number }[] }> = ({ values }) => {
  if (values.length < 2) return <div className="h-36 flex items-center justify-center text-xs text-slate-400">Grafik için en az 2 sınav sonucu gerekir.</div>;
  const width = 760, height = 180, pad = 28;
  const nums = values.map((v) => v.value);
  const min = Math.min(...nums, 0);
  const max = Math.max(...nums, 1);
  const span = Math.max(1, max - min);
  const points = values.map((v, i) => {
    const x = pad + (i * (width - pad * 2)) / Math.max(1, values.length - 1);
    const y = height - pad - ((v.value - min) / span) * (height - pad * 2);
    return { x, y, ...v };
  });
  return <div className="overflow-x-auto"><svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[560px] h-44" role="img" aria-label="Net gelişim grafiği"><line x1={pad} y1={height-pad} x2={width-pad} y2={height-pad} stroke="currentColor" className="text-slate-200 dark:text-slate-700"/><polyline fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" className="text-indigo-600" points={points.map(p=>`${p.x},${p.y}`).join(' ')}/>{points.map((p,i)=><g key={i}><circle cx={p.x} cy={p.y} r="5" fill="currentColor" className="text-indigo-600"/><text x={p.x} y={p.y-10} textAnchor="middle" fontSize="10" fill="currentColor" className="text-slate-700 dark:text-slate-200">{p.value}</text><text x={p.x} y={height-8} textAnchor="middle" fontSize="9" fill="currentColor" className="text-slate-400">{p.label}</text></g>)}</svg></div>;
};

export const ExamsView: React.FC = () => {
  const { students, examResults: exams, topicProgress, goals, deleteExamResult, openModal } = useApp();
  const activeStudents = students.filter((s) => !s.isArchived);
  const [studentFilter, setStudentFilter] = useState<string>(() => activeStudents.length === 1 ? activeStudents[0].id : 'all');
  const [examTypeFilter, setExamTypeFilter] = useState<string>('all');
  const [range, setRange] = useState<'7'|'30'|'90'|'180'|'all'>('90');

  useEffect(() => {
    if (activeStudents.length === 1 && studentFilter === 'all') setStudentFilter(activeStudents[0].id);
  }, [activeStudents.length, studentFilter]);

  const examTypes = useMemo(() => [...new Set(exams.map((e) => e.examType))].sort(), [exams]);
  const selectedStudent = studentFilter === 'all' ? undefined : students.find((s)=>s.id===studentFilter);
  const rangeCutoff = useMemo(() => {
    if (range === 'all') return '';
    const d = new Date(); d.setDate(d.getDate() - Number(range));
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }, [range]);

  const filteredExams = useMemo(() => exams.filter((e) => {
    if (studentFilter !== 'all' && e.studentId !== studentFilter) return false;
    if (examTypeFilter !== 'all' && e.examType !== examTypeFilter) return false;
    if (rangeCutoff && e.date < rangeCutoff) return false;
    return true;
  }).sort((a,b)=>b.date.localeCompare(a.date)), [exams, studentFilter, examTypeFilter, rangeCutoff]);

  const sortedAsc = [...filteredExams].sort((a,b)=>a.date.localeCompare(b.date));
  const latest = filteredExams[0];
  const highest = filteredExams.length ? Math.max(...filteredExams.map((e)=>e.netScore)) : 0;
  const avg5 = filteredExams.length ? filteredExams.slice(0,5).reduce((s,e)=>s+e.netScore,0)/Math.min(5,filteredExams.length) : 0;
  const netGoal = selectedStudent ? goals.find((g)=>g.studentId===selectedStudent.id && g.goalType==='Net Hedefi' && g.status==='Aktif') : undefined;
  const targetValue = netGoal?.targetValue ?? latest?.targetNet;
  const remaining = targetValue != null && latest ? Math.max(0, targetValue-latest.netScore) : undefined;

  const weakTopics = useMemo(() => {
    if (!selectedStudent) return [] as {name:string;score:number}[];
    const map = new Map<string, number>();
    topicProgress.filter((p)=>p.studentId===selectedStudent.id).forEach((p)=>{
      const score = (p.status === 'Tekrar Gerekli' ? 40 : 0) + (p.status === 'Soru Çözümü Gerekli' ? 30 : 0) + Math.max(0, 70-p.masteryPercentage);
      if (score > 0) map.set(p.topicTitle, (map.get(p.topicTitle)||0)+score);
    });
    exams.filter((e)=>e.studentId===selectedStudent.id).forEach((e)=>(e.incorrectTopics||[]).forEach((t)=>map.set(t,(map.get(t)||0)+25)));
    return [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([name,score])=>({name,score}));
  }, [selectedStudent, topicProgress, exams]);

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-display flex items-center gap-2"><BarChart3 className="w-6 h-6 text-purple-600"/><span>Akademik Gelişim Merkezi</span></h1><p className="text-xs text-slate-500 mt-0.5">Net gelişimi, hedef ilerlemesi, sınav sonuçları ve zayıf konu analizini tek ekranda izleyin.</p></div><button onClick={() => openModal('addExam', { initialStudentId: selectedStudent?.id })} className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all active:scale-95 self-start sm:self-auto"><Plus className="w-4 h-4"/><span>Yeni Sınav Sonucu</span></button></div>
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800"><select value={studentFilter} onChange={(e)=>setStudentFilter(e.target.value)} className="text-xs font-semibold p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"><option value="all">Tüm Öğrenciler</option>{activeStudents.map((s)=><option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.gradeLevel})</option>)}</select><select value={examTypeFilter} onChange={(e)=>setExamTypeFilter(e.target.value)} className="text-xs font-semibold p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"><option value="all">Tüm Sınav Türleri</option>{examTypes.map((t)=><option key={t} value={t}>{t}</option>)}</select><div className="flex gap-1 ml-auto">{([['7','7 Gün'],['30','30 Gün'],['90','3 Ay'],['180','6 Ay'],['all','Tümü']] as const).map(([id,label])=><button key={id} onClick={()=>setRange(id)} className={`px-2.5 py-2 rounded-xl text-[10px] font-bold ${range===id?'bg-purple-600 text-white':'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{label}</button>)}</div></div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><p className="text-[10px] font-bold text-slate-400">SON NET</p><p className="text-2xl font-black mt-1">{latest?.netScore ?? '-'}</p><p className="text-[10px] text-slate-500 mt-1">{latest?.examName ?? 'Kayıt yok'}</p></div><div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><p className="text-[10px] font-bold text-slate-400">EN YÜKSEK NET</p><p className="text-2xl font-black mt-1 text-emerald-600">{filteredExams.length ? highest : '-'}</p></div><div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><p className="text-[10px] font-bold text-slate-400">SON 5 ORTALAMA</p><p className="text-2xl font-black mt-1">{filteredExams.length ? avg5.toFixed(2) : '-'}</p></div><div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><p className="text-[10px] font-bold text-slate-400">HEDEFE KALAN</p><p className="text-2xl font-black mt-1 text-indigo-600">{remaining == null ? '-' : remaining.toFixed(2)}</p><p className="text-[10px] text-slate-500 mt-1">{targetValue != null ? `Hedef ${targetValue}` : 'Aktif net hedefi yok'}</p></div></div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4"><div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800"><div className="flex items-center gap-2 mb-3"><TrendingUp className="w-5 h-5 text-indigo-600"/><div><h2 className="font-black text-sm">Net Gelişim Grafiği</h2><p className="text-[10px] text-slate-500">Seçili filtreye göre kronolojik net değişimi</p></div></div><ExamLineChart values={sortedAsc.slice(-12).map((e)=>({label:formatDateTurkish(e.date,'short').slice(0,5),value:e.netScore}))}/></div><div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800"><div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-5 h-5 text-amber-600"/><div><h2 className="font-black text-sm">Öncelikli Zayıf Konular</h2><p className="text-[10px] text-slate-500">Sınav yanlışları + konu hakimiyeti</p></div></div>{!selectedStudent ? <p className="text-xs text-slate-400 py-8 text-center">Zayıf konu analizi için bir öğrenci seçin.</p> : weakTopics.length===0 ? <p className="text-xs text-slate-400 py-8 text-center">Belirgin zayıf konu bulunmuyor.</p> : <div className="space-y-2">{weakTopics.map((t,i)=><div key={t.name} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60"><div><p className="text-xs font-bold">{i+1}. {t.name}</p><p className="text-[10px] text-slate-500">Öneri: kısa tekrar + hedefli soru çözümü</p></div><span className="text-[10px] font-black text-amber-600">Öncelik</span></div>)}</div>}</div></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{filteredExams.map((exam)=>{const student=students.find((s)=>s.id===exam.studentId);const isTargetAchieved=exam.targetNet?exam.netScore>=exam.targetNet:false;return <div key={exam.id} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"><div className="space-y-3"><div className="flex items-center justify-between"><span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 uppercase tracking-wider">{exam.examType}</span><span className="text-xs font-semibold text-slate-500">{formatDateTurkish(exam.date,'short')}</span></div><div><h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{exam.examName}</h3><div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">👤 {student?`${student.firstName} ${student.lastName}`:'Öğrenci'}</div></div><div className="grid grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-center"><div><span className="text-[10px] font-bold text-emerald-600 block">Doğru</span><span className="text-base font-bold">{exam.correctCount}</span></div><div><span className="text-[10px] font-bold text-rose-600 block">Yanlış</span><span className="text-base font-bold">{exam.wrongCount}</span></div><div><span className="text-[10px] font-bold text-slate-400 block">Boş</span><span className="text-base font-bold">{exam.emptyCount}</span></div><div className="bg-purple-100 dark:bg-purple-950/60 rounded-xl p-1"><span className="text-[10px] font-extrabold text-purple-700 dark:text-purple-300 block">Net</span><span className="text-base font-black text-purple-700 dark:text-purple-300 font-mono">{exam.netScore}</span></div></div>{(exam.incorrectTopics||[]).length>0&&<div className="flex flex-wrap gap-1">{(exam.incorrectTopics||[]).map((t)=><span key={t} className="px-2 py-1 rounded-lg text-[10px] bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{t}</span>)}</div>}{exam.notes&&<p className="text-xs text-slate-600 dark:text-slate-400 italic">“{exam.notes}”</p>}</div><div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800"><div className="text-xs font-semibold text-slate-500">{exam.targetNet&&<span>Hedef: <strong>{exam.targetNet} Net</strong> {isTargetAchieved?'🎯 (Ulaşıldı)':'⏳'}</span>}</div><button onClick={()=>deleteExamResult(exam.id)} className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 transition-colors" title="Sil"><Trash2 className="w-4 h-4"/></button></div></div>})}</div>
      {filteredExams.length===0&&<div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700"><Target className="w-8 h-8 mx-auto text-slate-300 mb-2"/><p className="text-sm font-bold text-slate-500">Seçili filtrelerde sınav sonucu bulunmuyor.</p></div>}
    </div>
  );
};
