import React, { useMemo, useState } from 'react';
import { X, User, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EducationType, ExamType, FeeType, GradeLevel, LessonType, Student } from '../../types';
import { isLikelyTurkishPhone } from '../../utils/validators';

interface AddStudentModalProps {
  studentToEdit?: Student;
  onClose: () => void;
}

const gradeOptions: GradeLevel[] = [
  '5. Sınıf','6. Sınıf','7. Sınıf','8. Sınıf','9. Sınıf','10. Sınıf','11. Sınıf','12. Sınıf','Mezun','Üniversite / Yetişkin'
];
const examOptions: ExamType[] = ['LGS','TYT Matematik','AYT Matematik','TYT + AYT','KPSS Matematik','DGS Matematik','ALES Matematik','MSÜ','AGS','Okul Yazılısı','Diğer'];
const lessonTypeOptions: LessonType[] = ['Birebir','Grup','Online','Yüz Yüze Ev','Yüz Yüze Kurum'];
const feeTypeOptions: FeeType[] = ['Ders Başı','Saatlik','Paket'];

export const AddStudentModal: React.FC<AddStudentModalProps> = ({ studentToEdit, onClose }) => {
  const { addStudent, updateStudent, teacher } = useApp();
  const [firstName, setFirstName] = useState(studentToEdit?.firstName || '');
  const [lastName, setLastName] = useState(studentToEdit?.lastName || '');
  const [birthDate, setBirthDate] = useState(studentToEdit?.birthDate || '');
  const [educationType, setEducationType] = useState<EducationType>(studentToEdit?.educationType || 'Ortaokul');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(studentToEdit?.gradeLevel || '8. Sınıf');
  const [targetExam, setTargetExam] = useState<ExamType | ''>(studentToEdit?.targetExam || '');
  const [schoolName, setSchoolName] = useState(studentToEdit?.schoolName || '');
  const [studentPhone, setStudentPhone] = useState(studentToEdit?.studentPhone || '');
  const [parentName, setParentName] = useState(studentToEdit?.parentName || '');
  const [parentPhone, setParentPhone] = useState(studentToEdit?.parentPhone || '');
  const [parentRelationship, setParentRelationship] = useState(studentToEdit?.parentRelationship || 'Veli');
  const [lessonFee, setLessonFee] = useState<string>(studentToEdit ? String(studentToEdit.lessonFee) : '');
  const [lessonDuration, setLessonDuration] = useState<string>(studentToEdit ? String(studentToEdit.lessonDuration) : '');
  const [feeType, setFeeType] = useState<FeeType>(studentToEdit?.feeType || 'Ders Başı');
  const [lessonType, setLessonType] = useState<LessonType>(studentToEdit?.lessonType || 'Birebir');
  const [academicGoal, setAcademicGoal] = useState(studentToEdit?.academicGoal || '');
  const [teacherNotes, setTeacherNotes] = useState(studentToEdit?.teacherNotes || '');
  const [error, setError] = useState('');

  const showTargetExam = useMemo(() => educationType === 'Sınav Hazırlığı' || !!targetExam, [educationType, targetExam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!firstName.trim() || !lastName.trim()) {
      setError('Öğrenci adı ve soyadı zorunludur.');
      return;
    }
    if (!parentName.trim() || !parentPhone.trim()) {
      setError('Veli adı ve veli telefon numarası zorunludur.');
      return;
    }
    if (!isLikelyTurkishPhone(parentPhone)) {
      setError('Veli telefon numarası geçerli bir Türkiye cep telefonu olmalıdır. Örnek: 05xx xxx xx xx.');
      return;
    }
    if (studentPhone.trim() && !isLikelyTurkishPhone(studentPhone)) {
      setError('Öğrenci telefon numarası geçerli görünmüyor.');
      return;
    }
    const parsedLessonFee = Number(lessonFee);
    const parsedLessonDuration = Number(lessonDuration);
    if (!lessonFee.trim() || !lessonDuration.trim() || !Number.isFinite(parsedLessonFee) || parsedLessonFee < 0 || !Number.isFinite(parsedLessonDuration) || parsedLessonDuration <= 0) {
      setError('Ders ücreti ve varsayılan ders süresini giriniz.');
      return;
    }

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate: birthDate || undefined,
      educationType,
      gradeLevel,
      targetExam: targetExam || undefined,
      schoolName: schoolName.trim() || undefined,
      studentPhone: studentPhone.trim() || undefined,
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      parentRelationship: parentRelationship.trim() || 'Veli',
      lessonFee: parsedLessonFee,
      lessonDuration: parsedLessonDuration,
      feeType,
      academicGoal: academicGoal.trim(),
      lessonType,
      teacherNotes: teacherNotes.trim() || undefined,
      packageId: studentToEdit?.packageId,
      avatarColor: studentToEdit?.avatarColor || 'from-indigo-500 to-blue-600',
    };

    if (studentToEdit) updateStudent(studentToEdit.id, payload);
    else addStudent(payload);
    onClose();
  };

  const inputClass = 'w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none';

  return (
    <div className="modal-overlay fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full my-6 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center"><User className="w-5 h-5" /></div>
            <div><h3 className="text-lg font-black text-slate-900 dark:text-white">{studentToEdit ? 'Öğrenci Bilgilerini Düzenle' : 'Yeni Öğrenci Kaydı'}</h3><p className="text-xs text-slate-500">Öğrenci, veli ve ders ayarlarını tek yerde yönetin.</p></div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
          {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-semibold text-red-700 dark:text-red-300">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-xs font-bold">Ad *</label><input required value={firstName} onChange={e=>setFirstName(e.target.value)} className={inputClass} /></div>
            <div><label className="text-xs font-bold">Soyad *</label><input required value={lastName} onChange={e=>setLastName(e.target.value)} className={inputClass} /></div>
            <div><label className="text-xs font-bold">Doğum Tarihi</label><input type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)} className={inputClass} /></div>
            <div><label className="text-xs font-bold">Okul</label><input value={schoolName} onChange={e=>setSchoolName(e.target.value)} className={inputClass} /></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><label className="text-xs font-bold">Eğitim / Hazırlık Türü</label><select value={educationType} onChange={e=>setEducationType(e.target.value as EducationType)} className={inputClass}><option>Ortaokul</option><option>Lise</option><option>Sınav Hazırlığı</option><option>Diğer</option></select></div>
            <div><label className="text-xs font-bold">Sınıf / Düzey</label><select value={gradeLevel} onChange={e=>setGradeLevel(e.target.value as GradeLevel)} className={inputClass}>{gradeOptions.map(g=><option key={g}>{g}</option>)}</select></div>
            <div><label className="text-xs font-bold">Hedef Sınav</label><select value={targetExam} onChange={e=>setTargetExam(e.target.value as ExamType | '')} className={inputClass}><option value="">Seçilmedi</option>{examOptions.map(x=><option key={x}>{x}</option>)}</select></div>
          </div>

          {showTargetExam && <p className="text-[11px] text-slate-500">Seçilen sınav türüne göre konu/kazanım takibi öğrencinin profilinde uyarlanabilir.</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-xs font-bold">Öğrenci Telefonu</label><input type="tel" value={studentPhone} onChange={e=>setStudentPhone(e.target.value)} className={inputClass} /></div>
            <div><label className="text-xs font-bold">Veli Adı *</label><input required value={parentName} onChange={e=>setParentName(e.target.value)} className={inputClass} /></div>
            <div><label className="text-xs font-bold">Veli Telefonu *</label><input required type="tel" value={parentPhone} onChange={e=>setParentPhone(e.target.value)} placeholder="05xx xxx xx xx" className={inputClass} /></div>
            <div><label className="text-xs font-bold">Yakınlık</label><input value={parentRelationship} onChange={e=>setParentRelationship(e.target.value)} placeholder="Anne / Baba / Veli" className={inputClass} /></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div><label className="text-xs font-bold">Ücret Tipi</label><select value={feeType} onChange={e=>setFeeType(e.target.value as FeeType)} className={inputClass}>{feeTypeOptions.map(x=><option key={x}>{x}</option>)}</select></div>
            <div><label className="text-xs font-bold">Ders Ücreti (₺)</label><input type="number" min="0" value={lessonFee} onChange={e=>setLessonFee(e.target.value)} placeholder="Tutarı girin" className={inputClass} /></div>
            <div><label className="text-xs font-bold">Varsayılan Süre</label><input type="number" min="15" step="5" value={lessonDuration} onChange={e=>setLessonDuration(e.target.value)} placeholder="Süreyi girin" className={inputClass} /></div>
            <div><label className="text-xs font-bold">Ders Türü</label><select value={lessonType} onChange={e=>setLessonType(e.target.value as LessonType)} className={inputClass}>{lessonTypeOptions.map(x=><option key={x}>{x}</option>)}</select></div>
          </div>

          <div><label className="text-xs font-bold">Akademik Hedef</label><input value={academicGoal} onChange={e=>setAcademicGoal(e.target.value)} placeholder="Örn: TYT Matematik 30 net" className={inputClass} /></div>
          <div><label className="text-xs font-bold">Öğretmen Özel Notu</label><textarea rows={3} value={teacherNotes} onChange={e=>setTeacherNotes(e.target.value)} className={inputClass} /></div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">İptal</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-2"><CheckCircle className="w-4 h-4" />{studentToEdit ? 'Değişiklikleri Kaydet' : 'Öğrenciyi Kaydet'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
