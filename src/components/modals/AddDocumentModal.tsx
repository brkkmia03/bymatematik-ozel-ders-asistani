import React, { useMemo, useState } from 'react';
import { X, FolderArchive, Link, CheckCircle, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DocumentItem, GradeLevel } from '../../types';
import { CURRICULUM_DATA } from '../../data/curriculum';

interface AddDocumentModalProps { onClose: () => void; initialStudentId?: string; writtenExamId?: string; }

const gradeOptions: GradeLevel[] = ['5. Sınıf','6. Sınıf','7. Sınıf','8. Sınıf','9. Sınıf','10. Sınıf','11. Sınıf','12. Sınıf','Mezun','Üniversite / Yetişkin'];

export const AddDocumentModal: React.FC<AddDocumentModalProps> = ({ onClose, initialStudentId, writtenExamId }) => {
  const { students, addDocument } = useApp();
  const activeStudents = students.filter((s) => !s.isArchived);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [studentId, setStudentId] = useState(initialStudentId || '');
  const [fileType, setFileType] = useState<DocumentItem['fileType']>('PDF');
  const initialStudent = activeStudents.find((s) => s.id === initialStudentId);
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(initialStudent?.gradeLevel || '8. Sınıf');
  const [topic, setTopic] = useState('');
  const [url, setUrl] = useState('');
  const [urlPlatform, setUrlPlatform] = useState<DocumentItem['urlPlatform']>('Google Drive');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileDataUrl, setFileDataUrl] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');

  const isUrl = fileType === 'URL Link';
  const curriculumKey = gradeLevel === '8. Sınıf' ? '8. Sınıf (LGS)' : gradeLevel;
  const topicOptions = useMemo(() => CURRICULUM_DATA.filter((item) => item.gradeOrExam === curriculumKey), [curriculumKey]);

  const handleFile = (file?: File) => {
    setError('');
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError('Tek dosyada en fazla 4 MB yükleyebilirsiniz. Daha büyük dosyalar için URL/Drive bağlantısı kullanın.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFileDataUrl(String(reader.result || ''));
      setFileName(file.name);
      setFileSize(`${(file.size / 1024 / 1024).toFixed(2)} MB`);
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.pdf')) setFileType('PDF');
      else if (lower.endsWith('.doc') || lower.endsWith('.docx')) setFileType('Word');
      else if (/\.(png|jpg|jpeg|webp)$/.test(lower)) setFileType('Görsel');
      else setFileType('Diğer');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) return setError('Doküman başlığı zorunludur.');
    if (isUrl && !url.trim()) return setError('URL bağlantısını girin.');
    if (!isUrl && !fileDataUrl) return setError('Bir dosya seçin veya formatı URL Link olarak değiştirin.');

    addDocument({
      title: title.trim(),
      description: description.trim() || undefined,
      fileType,
      fileUrl: !isUrl ? fileDataUrl : undefined,
      fileName: !isUrl ? fileName : undefined,
      fileSize: !isUrl ? fileSize : undefined,
      isUrl,
      url: isUrl ? url.trim() : undefined,
      urlPlatform: isUrl ? urlPlatform : undefined,
      studentIds: studentId ? [studentId] : [],
      gradeLevel,
      topic: topic.trim() || undefined,
      tags: tags.split(',').map((x) => x.trim()).filter(Boolean),
      writtenExamId,
    });
    onClose();
  };

  const inputClass = 'w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none';

  return (
    <div className="modal-overlay fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full my-6 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center"><FolderArchive className="w-5 h-5" /></div><div><h3 className="text-lg font-black text-slate-900 dark:text-white">Doküman & Kaynak Ekle</h3><p className="text-xs text-slate-500">Dosya yükleyin veya çevrim içi kaynak bağlantısı ekleyin.</p></div></div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-semibold text-red-700 dark:text-red-300">{error}</div>}
          <div><label className="text-xs font-bold">Doküman Başlığı *</label><input required value={title} onChange={e=>setTitle(e.target.value)} className={inputClass} /></div>
          <div><label className="text-xs font-bold">Açıklama</label><textarea rows={2} value={description} onChange={e=>setDescription(e.target.value)} className={inputClass} /></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-xs font-bold">Format</label><select value={fileType} onChange={e=>setFileType(e.target.value as DocumentItem['fileType'])} className={inputClass}><option>PDF</option><option>Word</option><option>Görsel</option><option>URL Link</option><option>Diğer</option></select></div>
            <div><label className="text-xs font-bold">Sınıf / Düzey</label><select value={gradeLevel} onChange={e=>{setGradeLevel(e.target.value as GradeLevel);setTopic('');}} className={inputClass}>{gradeOptions.map(g=><option key={g}>{g}</option>)}</select></div>
          </div>

          {isUrl ? (
            <div className="space-y-3 p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
              <div><label className="text-xs font-bold flex items-center gap-1"><Link className="w-3.5 h-3.5"/> Bağlantı *</label><input type="url" required value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://..." className={inputClass}/></div>
              <div><label className="text-xs font-bold">Platform</label><select value={urlPlatform} onChange={e=>setUrlPlatform(e.target.value as DocumentItem['urlPlatform'])} className={inputClass}><option>Google Drive</option><option>Canva</option><option>Online Test</option><option>Web Sitesi</option><option>Desmos/Geogebra</option><option>MEB Kazanım</option><option>Diğer</option></select></div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700">
              <label className="text-xs font-bold flex items-center gap-2 cursor-pointer"><Upload className="w-4 h-4"/> Dosya Seç<input type="file" className="hidden" onChange={e=>handleFile(e.target.files?.[0])}/></label>
              <p className="text-[11px] text-slate-500 mt-1">{fileName ? `${fileName} • ${fileSize}` : 'Tek dosyada 4 MB’a kadar yükleme yapılabilir; büyük dosyalar için URL kullanın.'}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-xs font-bold">Öğrenci İlişkisi</label><select value={studentId} onChange={e=>{const id=e.target.value;setStudentId(id);const st=activeStudents.find(s=>s.id===id);if(st){setGradeLevel(st.gradeLevel);setTopic('');}}} className={inputClass}><option value="">Genel materyal</option>{activeStudents.map(s=><option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}</select></div>
            <div><label className="text-xs font-bold">Konu</label><select value={topic} onChange={e=>setTopic(e.target.value)} className={inputClass}><option value="">Konu seçilmedi</option>{topicOptions.map(item=><option key={item.id} value={item.title}>{item.title}</option>)}</select></div>
          </div>
          <div><label className="text-xs font-bold">Etiketler</label><input value={tags} onChange={e=>setTags(e.target.value)} placeholder="yazılı, üslü sayılar, tekrar" className={inputClass}/></div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800"><button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">İptal</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-2"><CheckCircle className="w-4 h-4"/>Dokümanı Kaydet</button></div>
        </form>
      </div>
    </div>
  );
};
