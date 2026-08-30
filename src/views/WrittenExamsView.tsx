import React, { useMemo, useState } from 'react';
import { Award, Plus, Calendar, FileText, CheckCircle2, Trash2, ClipboardList, ExternalLink, Link2, WandSparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { toLocalDateInputValue, formatDateTurkish } from '../utils/formatters';
import { WrittenExamPrepStatus } from '../types';
import { CURRICULUM_DATA } from '../data/curriculum';

const statuses: WrittenExamPrepStatus[] = ['Planlandı','Hazırlanıyor','Hazır','Öğrenciyle Çalışıldı','Tamamlandı'];

export const WrittenExamsView: React.FC = () => {
  const { students, writtenExams, writtenPreparations, documents, tasks, addWrittenExam, updateWrittenExam, deleteWrittenExam, addWrittenExamPreparation, updateWrittenExamPreparation, deleteWrittenExamPreparation, openModal } = useApp();
  const activeStudents = students.filter(s => !s.isArchived);
  const [isAdding, setIsAdding] = useState(false);
  const [studentId, setStudentId] = useState(activeStudents[0]?.id ?? '');
  const [examName, setExamName] = useState('');
  const [date, setDate] = useState(toLocalDateInputValue());
  const [topics, setTopics] = useState<string[]>([]);
  const [targetGrade, setTargetGrade] = useState(0);

  const selectedStudent = activeStudents.find((s) => s.id === studentId);
  const curriculumKey = selectedStudent?.gradeLevel === '8. Sınıf' ? '8. Sınıf (LGS)' : selectedStudent?.gradeLevel;
  const topicOptions = useMemo(() => CURRICULUM_DATA.filter((item) => item.gradeOrExam === curriculumKey), [curriculumKey]);
  const toggleTopic = (title: string) => setTopics((prev) => prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]);

  const daysLeft = (value: string) => {
    const [y,m,d] = value.split('-').map(Number);
    const target = new Date(y,m-1,d); const now = new Date(); now.setHours(0,0,0,0);
    return Math.ceil((target.getTime()-now.getTime())/86400000);
  };

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !examName.trim() || !date || targetGrade <= 0 || targetGrade > 100) return;
    const exam = addWrittenExam({ studentId, examName: examName.trim(), date, targetGrade, topics, preparationPercentage: 0 });
    addWrittenExamPreparation({
      studentId, writtenExamId: exam.id, planTitle: `${exam.examName} Hazırlık Planı`, status: 'Planlandı', targetDate: date,
      topicsCovered: topics, plannedActivities: [], documentIds: [], urlLinks: []
    });
    setIsAdding(false);
  };

  const examCards = useMemo(() => [...writtenExams].sort((a,b)=>a.date.localeCompare(b.date)), [writtenExams]);

  return <div className="space-y-6 pb-12">
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-xl sm:text-2xl font-black flex items-center gap-2"><Award className="w-6 h-6 text-indigo-600"/>Yazılı Hazırlık Merkezi</h1><p className="text-xs text-slate-500 mt-1">Yazılı tarihi, hazırlık planı, materyaller ve yapılacak çalışmaları tek yerde yönetin.</p></div>
        <button onClick={()=>setIsAdding(v=>!v)} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2"><Plus className="w-4 h-4"/>{isAdding?'Formu Kapat':'Yazılı Ekle'}</button>
      </div>
      {isAdding && <form onSubmit={handleAddExam} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
        <label className="space-y-1"><span className="text-[11px] font-bold">Öğrenci</span><select value={studentId} onChange={e=>{setStudentId(e.target.value);setTopics([]);}} className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">{activeStudents.map(s=><option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.gradeLevel})</option>)}</select></label>
        <label className="space-y-1"><span className="text-[11px] font-bold">Yazılı Adı</span><input required value={examName} onChange={e=>setExamName(e.target.value)} className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs" placeholder="Örn: 1. Dönem 1. Matematik Yazılısı"/></label>
        <label className="space-y-1"><span className="text-[11px] font-bold">Yazılı Tarihi</span><input required type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"/></label>
        <label className="space-y-1"><span className="text-[11px] font-bold">Hedef Not</span><input required type="number" min="1" max="100" value={targetGrade || ''} onChange={e=>setTargetGrade(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs" placeholder="Örn: 90"/></label>
        <div className="sm:col-span-2 space-y-2"><span className="text-[11px] font-bold">Yazılı Konuları</span><div className="max-h-44 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">{topicOptions.length ? topicOptions.map(item=><label key={item.id} className="flex items-start gap-2 text-[11px] p-2 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"><input type="checkbox" checked={topics.includes(item.title)} onChange={()=>toggleTopic(item.title)} className="mt-0.5"/><span>{item.title}</span></label>) : <p className="text-[11px] text-slate-500 p-2">Bu öğrenci düzeyi için konu listesi bulunamadı.</p>}</div></div>
        <button className="sm:col-span-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold">Yazılı ve Hazırlık Planını Oluştur</button>
      </form>}
    </div>

    <div className="space-y-4">
      {examCards.map(exam=>{
        const student = students.find(s=>s.id===exam.studentId);
        const prep = writtenPreparations.find(p=>p.writtenExamId===exam.id);
        const linkedDocs = documents.filter(d=>d.writtenExamId===exam.id || prep?.documentIds?.includes(d.id));
        const linkedTasks = tasks.filter(t=>t.writtenExamId===exam.id || t.preparationId===prep?.id);
        const completedTasks = linkedTasks.filter(t=>t.status==='Hazır'||t.status==='Kullanıldı').length;
        const taskProgress = linkedTasks.length ? Math.round(completedTasks/linkedTasks.length*100) : exam.preparationPercentage;
        const progress = Math.max(exam.preparationPercentage, taskProgress || 0);
        const left = daysLeft(exam.date);
        return <div key={exam.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="space-y-2"><div className="flex flex-wrap items-center gap-2"><h2 className="font-black text-base">{exam.examName}</h2><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${left<0?'bg-slate-100 text-slate-500':left<=3?'bg-rose-100 text-rose-700':'bg-indigo-50 text-indigo-700'}`}>{left<0?'Geçti':left===0?'Bugün':`${left} gün kaldı`}</span></div><p className="text-xs text-slate-500">{student?.firstName} {student?.lastName} • {formatDateTurkish(exam.date,'short')} • Hedef: {exam.targetGrade}</p><div className="flex flex-wrap gap-1.5">{exam.topics.map(t=><span key={t} className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">{t}</span>)}</div></div>
            <div className="flex gap-2"><button onClick={()=>openModal('addTask',{initialStudentId:exam.studentId,writtenExamId:exam.id,preparationId:prep?.id})} className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold flex items-center gap-1"><ClipboardList className="w-4 h-4"/>Görev</button><button onClick={()=>openModal('addDocument',{initialStudentId:exam.studentId,writtenExamId:exam.id})} className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold flex items-center gap-1"><FileText className="w-4 h-4"/>Doküman</button><button onClick={()=>deleteWrittenExam(exam.id)} className="p-2 rounded-xl text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4"/></button></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-3">
              <div className="flex items-center justify-between"><span className="text-xs font-black">Hazırlık Planı</span><span className="text-xs font-black text-indigo-600">%{progress}</span></div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden"><div className="h-full bg-indigo-600" style={{width:`${progress}%`}}/></div>
              {prep ? <>
                <select value={prep.status} onChange={e=>updateWrittenExamPreparation(prep.id,{status:e.target.value as WrittenExamPrepStatus})} className="w-full p-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">{statuses.map(s=><option key={s}>{s}</option>)}</select>
                <textarea value={prep.teacherNotes||''} onChange={e=>updateWrittenExamPreparation(prep.id,{teacherNotes:e.target.value})} placeholder="Hazırlık notu..." className="w-full p-2.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700" rows={2}/>
                <button onClick={()=>updateWrittenExam(exam.id,{preparationPercentage:progress})} className="text-[11px] font-bold text-indigo-600 flex items-center gap-1"><WandSparkles className="w-3.5 h-3.5"/>İlerlemeyi yazılı kaydına eşitle</button>
              </> : <button onClick={()=>addWrittenExamPreparation({studentId:exam.studentId,writtenExamId:exam.id,planTitle:`${exam.examName} Hazırlık Planı`,status:'Planlandı',targetDate:exam.date,topicsCovered:exam.topics,plannedActivities:[],documentIds:[],urlLinks:[]})} className="text-xs font-bold text-indigo-600">Hazırlık planı oluştur</button>}
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3"><div className="flex items-center justify-between"><span className="text-xs font-black">Bağlı İçerikler</span><Link2 className="w-4 h-4 text-slate-400"/></div><p className="text-xs text-slate-500">{linkedTasks.length} görev • {linkedDocs.length} doküman</p><div className="space-y-1.5 max-h-28 overflow-auto">{linkedTasks.slice(0,3).map(t=><div key={t.id} className="text-[11px] flex items-center gap-1"><CheckCircle2 className={`w-3.5 h-3.5 ${t.status==='Kullanıldı'?'text-emerald-600':'text-slate-400'}`}/>{t.title}</div>)}{linkedDocs.slice(0,3).map(d=><a key={d.id} href={d.isUrl?d.url:d.fileUrl} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5"/>{d.title}</a>)}</div></div>
          </div>
        </div>
      })}
      {!examCards.length && <div className="text-center text-sm text-slate-500 py-12">Henüz yazılı sınavı eklenmedi.</div>}
    </div>
  </div>;
};
