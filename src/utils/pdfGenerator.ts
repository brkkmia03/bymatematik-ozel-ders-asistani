import {
  Student,
  TeacherProfile,
  Lesson,
  Assignment,
  ExamResult,
  WrittenExam,
  FinancialTransaction,
  LessonPackage,
  StudentTopicProgress,
  AcademicGoal,
  LessonNote,
  WrittenExamPreparation,
  MaterialTask,
  DocumentItem,
} from '../types';
import { formatCurrency, formatDateTurkish, calculateStudentBalance } from './formatters';

const esc = (value: unknown) => String(value ?? '-')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const studentName = (studentId: string, students: Student[]) => {
  const s = students.find((item) => item.id === studentId);
  return s ? `${s.firstName} ${s.lastName}` : 'Bilinmeyen Öğrenci';
};

const emptyRow = (colspan: number, text = 'Bu rapor için kayıt bulunmamaktadır.') =>
  `<tr><td colspan="${colspan}" class="empty">${esc(text)}</td></tr>`;

const table = (headers: string[], rows: string[][]) => `
  <table>
    <thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.length ? rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('') : emptyRow(headers.length)}</tbody>
  </table>`;

export function generateHTMLReportContent(
  reportType: string,
  data: {
    student?: Student;
    teacher: TeacherProfile;
    students?: Student[];
    lessons?: Lesson[];
    assignments?: Assignment[];
    exams?: ExamResult[];
    writtenExams?: WrittenExam[];
    transactions?: FinancialTransaction[];
    packages?: LessonPackage[];
    curriculumProgress?: StudentTopicProgress[];
    goals?: AcademicGoal[];
    lessonNotes?: LessonNote[];
    writtenPreparations?: WrittenExamPreparation[];
    tasks?: MaterialTask[];
    documents?: DocumentItem[];
    whatsAppLogs?: Array<{ studentId: string; recipientPhone: string; recipientType?: 'parent' | 'student'; templateType: string; messageText: string; sentAt: string; status?: string }>;
    reportOptions?: { dateFrom?: string; dateTo?: string; reportAudience?: 'teacher' | 'family' };
  }
): string {
  const {
    student,
    teacher,
    students = [],
    lessons = [],
    assignments = [],
    exams = [],
    writtenExams = [],
    transactions = [],
    packages = [],
    curriculumProgress = [],
    goals = [],
    lessonNotes = [],
    writtenPreparations = [],
    tasks = [],
    documents = [],
    whatsAppLogs = [],
    reportOptions = {},
  } = data;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const thisMonth = todayStr.slice(0, 7);
  const { dateFrom = '', dateTo = '', reportAudience = 'family' } = reportOptions;
  const inRange = (date?: string) => {
    if (!date) return true;
    if (dateFrom && date < dateFrom) return false;
    if (dateTo && date > dateTo) return false;
    return true;
  };
  const sLessons = (student ? lessons.filter((l) => l.studentId === student.id) : lessons).filter((l) => inRange(l.date));
  const sAssignments = (student ? assignments.filter((a) => a.studentId === student.id) : assignments).filter((a) => inRange(a.assignedDate));
  const sExams = (student ? exams.filter((e) => e.studentId === student.id) : exams).filter((e) => inRange(e.date));
  const sWritten = (student ? writtenExams.filter((w) => w.studentId === student.id) : writtenExams).filter((w) => inRange(w.date));
  const sTxns = (student ? transactions.filter((t) => t.studentId === student.id) : transactions).filter((t) => inRange(t.date));
  const sProgress = student ? curriculumProgress.filter((p) => p.studentId === student.id) : curriculumProgress;
  const sGoals = student ? goals.filter((g) => g.studentId === student.id) : goals;
  const rangeLabel = dateFrom || dateTo ? `${dateFrom ? formatDateTurkish(dateFrom, 'short') : 'Başlangıç'} – ${dateTo ? formatDateTurkish(dateTo, 'short') : 'Bugün'}` : 'Tüm zamanlar';

  let title = 'Rapor';
  let body = '';

  if (reportType === 'student_full_record') {
    title = student ? `${student.firstName} ${student.lastName} - Öğrenci Tam Dosyası` : 'Öğrenci Tam Dosyası';
    if (!student) {
      body = '<p class="empty">Bu rapor için öğrenci seçilmelidir.</p>';
    } else {
      const allLessons = lessons.filter((l) => l.studentId === student.id).sort((a,b)=>`${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`));
      const allAssignments = assignments.filter((a) => a.studentId === student.id).sort((a,b)=>b.assignedDate.localeCompare(a.assignedDate));
      const allExams = exams.filter((e) => e.studentId === student.id).sort((a,b)=>b.date.localeCompare(a.date));
      const allWritten = writtenExams.filter((w) => w.studentId === student.id).sort((a,b)=>b.date.localeCompare(a.date));
      const allProgress = curriculumProgress.filter((p) => p.studentId === student.id).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
      const allGoals = goals.filter((g) => g.studentId === student.id).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
      const allPackages = packages.filter((pkg) => pkg.studentId === student.id).sort((a,b)=>b.startDate.localeCompare(a.startDate));
      const allTxns = transactions.filter((t) => t.studentId === student.id).sort((a,b)=>b.date.localeCompare(a.date));
      const allNotes = lessonNotes.filter((n) => n.studentId === student.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
      const allPreps = writtenPreparations.filter((prep) => prep.studentId === student.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
      const allTasks = tasks.filter((task) => task.studentId === student.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
      const allDocs = documents.filter((doc) => doc.studentIds.includes(student.id)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
      const allWa = whatsAppLogs.filter((log) => log.studentId === student.id).sort((a,b)=>b.sentAt.localeCompare(a.sentAt));
      const completedLessons = allLessons.filter((l) => l.status === 'Tamamlandı');
      const completedAssignments = allAssignments.filter((a) => a.status === 'Tamamlandı' || a.status === 'Kontrol Edildi');
      const totalMinutes = completedLessons.reduce((sum,l)=>sum+(l.actualDuration || l.duration || 0),0);
      const balance = calculateStudentBalance(student.id, transactions).balance;
      body = `
        <p class="confidential">Öğrenci Tam Dosyası öğretmen kullanımına yönelik kapsamlı arşiv çıktısıdır. Öğretmen özel notları ve finans kayıtları içerebilir.</p>
        <h2>Öğrenci Bilgileri</h2>
        ${table(['Alan','Bilgi'], [
          ['Ad Soyad', esc(`${student.firstName} ${student.lastName}`)],
          ['Sınıf / Eğitim', esc(`${student.gradeLevel} • ${student.educationType}`)],
          ['Hedef Sınav', esc(student.targetExam || '-')],
          ['Okul', esc(student.schoolName || '-')],
          ['Akademik Hedef', esc(student.academicGoal || '-')],
          ['Öğrenci Telefonu', esc(student.studentPhone || '-')],
          ['Veli', esc(`${student.parentName || '-'}${student.parentRelationship ? ` (${student.parentRelationship})` : ''}`)],
          ['Veli Telefonu', esc(student.parentPhone || '-')],
          ['Ders Türü', esc(student.lessonType)],
          ['Ücret Modeli', esc(`${student.feeType} • ${formatCurrency(student.lessonFee, teacher.currency)}`)],
          ['Varsayılan Ders Süresi', `${esc(student.lessonDuration)} dk`],
          ['Öğretmen Özel Notu', esc(student.teacherNotes || '-')],
          ['Kayıt Tarihi', esc(formatDateTurkish(student.createdAt.slice(0,10),'short'))],
        ])}
        <div class="metrics">
          <div class="metric"><span>Tamamlanan Ders</span><strong>${completedLessons.length}</strong><small>${(totalMinutes/60).toFixed(1)} saat</small></div>
          <div class="metric"><span>Ödev Tamamlama</span><strong>%${allAssignments.length ? Math.round(completedAssignments.length/allAssignments.length*100) : 0}</strong><small>${completedAssignments.length}/${allAssignments.length}</small></div>
          <div class="metric"><span>Sınav Kaydı</span><strong>${allExams.length}</strong><small>Deneme / sınav</small></div>
          <div class="metric"><span>Güncel Bakiye</span><strong>${esc(formatCurrency(balance, teacher.currency))}</strong><small>Hesap hareketlerinden</small></div>
        </div>
        <h2>Akademik Hedefler</h2>
        ${table(['Hedef','Tür','Hedef','Mevcut','Tarih','Durum','Not'], allGoals.map(g=>[esc(g.title),esc(g.goalType),esc(g.targetValue),esc(g.currentValue ?? '-'),esc(g.targetDate ? formatDateTurkish(g.targetDate,'short') : '-'),esc(g.status),esc(g.notes || '-')]))}
        <h2>Konu & Kazanım İlerlemesi</h2>
        ${table(['Konu','Durum','Başarı','Soru','İlk Anlatım','Son Tekrar','Not'], allProgress.map(p=>[esc(p.topicTitle),esc(p.status),`%${esc(p.masteryPercentage)}`,esc(p.totalQuestionsSolved),esc(p.firstTaughtDate ? formatDateTurkish(p.firstTaughtDate,'short') : '-'),esc(p.lastReviewedDate ? formatDateTurkish(p.lastReviewedDate,'short') : '-'),esc(p.notes || '-')]))}
        <h2>Tüm Ders Geçmişi</h2>
        ${table(['Tarih','Saat','Konu / Alt Konu','Süre','Tür','Ücret','Durum','Öğretmen Notu'], allLessons.map(l=>[esc(formatDateTurkish(l.date,'short')),esc(l.startTime),esc(`${l.topic || 'Matematik'}${l.subtopic ? ` • ${l.subtopic}` : ''}`),`${esc(l.actualDuration || l.duration)} dk`,esc(l.lessonType),esc(formatCurrency(l.fee,teacher.currency)),esc(l.status),esc(l.teacherNotes || l.notes || '-')]))}
        <h2>Ders Sonu Değerlendirmeleri</h2>
        ${table(['Konu','Kazanım','Kaynak','Soru','Katılım','Konu Hakimiyeti','Problem Çözme','Zorlanılan Alan','Öğretmen Notu','Sonraki Plan'], allNotes.map(n=>[esc(`${n.topic}${n.subtopic ? ` • ${n.subtopic}` : ''}`),esc(n.learningOutcome || '-'),esc(n.usedResources || '-'),esc(n.solvedQuestionsCount),esc(`${n.participationRating}/5`),esc(`${n.topicMasteryRating}/5`),esc(`${n.problemSolvingRating}/5`),esc(n.difficultAreas || '-'),esc(n.teacherNote || '-'),esc(n.nextLessonPlan || '-')]))}
        <h2>Tüm Ödevler</h2>
        ${table(['Veriliş','Teslim','Başlık / Konu','Kaynak','Sayfa / Sorular','Soru','Öncelik','Durum','Geri Bildirim'], allAssignments.map(a=>[esc(formatDateTurkish(a.assignedDate,'short')),esc(formatDateTurkish(a.dueDate,'short')),esc(`${a.title || a.topic}${a.title && a.topic ? ` • ${a.topic}` : ''}`),esc(a.resourceName || '-'),esc([a.pages,a.questionNumbers].filter(Boolean).join(' • ') || '-'),esc(a.questionCount ?? '-'),esc(a.priority),esc(a.status),esc(a.teacherFeedback || a.description || '-')]))}
        <h2>Deneme / Sınav Sonuçları</h2>
        ${table(['Tarih','Sınav','Tür','D/Y/B','Net','Puan','Hedef Net','Yanlış Konular','Not'], allExams.map(e=>[esc(formatDateTurkish(e.date,'short')),esc(e.examName),esc(e.examType),`${esc(e.correctCount)} / ${esc(e.wrongCount)} / ${esc(e.emptyCount)}`,esc(e.netScore),esc(e.totalScore ?? '-'),esc(e.targetNet ?? '-'),esc((e.incorrectTopics || []).join(', ') || '-'),esc(e.notes || '-')]))}
        <h2>Yazılı Sınavları</h2>
        ${table(['Tarih','Yazılı','Hedef','Alınan','Hazırlık','Konular','Öğretmen Notu'], allWritten.map(w=>[esc(formatDateTurkish(w.date,'short')),esc(w.examName),esc(w.targetGrade),esc(w.actualGrade ?? '-'),`%${esc(w.preparationPercentage)}`,esc(w.topics.join(', ') || '-'),esc(w.teacherNotes || '-')]))}
        <h2>Yazılı Hazırlık Planları</h2>
        ${table(['Plan','Durum','Hedef Tarih','Konular','Çalışmalar','Not'], allPreps.map(p=>[esc(p.planTitle),esc(p.status),esc(formatDateTurkish(p.targetDate,'short')),esc(p.topicsCovered.join(', ') || '-'),esc(p.plannedActivities.join(', ') || '-'),esc(p.teacherNotes || '-')]))}
        <h2>Öğrenciye Bağlı Görevler</h2>
        ${table(['Görev','Kategori','Son Tarih','Öncelik','Durum','Açıklama'], allTasks.map(t=>[esc(t.title),esc(t.category),esc(t.dueDate ? formatDateTurkish(t.dueDate,'short') : '-'),esc(t.priority),esc(t.status),esc(t.description || '-')]))}
        <h2>Öğrenci Dokümanları</h2>
        ${table(['Başlık','Tür','Konu','Dosya / URL','Etiketler','Eklenme'], allDocs.map(d=>[esc(d.title),esc(d.fileType),esc(d.topic || '-'),esc(d.fileName || d.url || '-'),esc(d.tags.join(', ') || '-'),esc(formatDateTurkish(d.createdAt.slice(0,10),'short'))]))}
        <h2>Ders Paketleri</h2>
        ${table(['Paket','Başlangıç','Bitiş','Toplam','Kullanılan','Kalan','Tutar','Durum','Not'], allPackages.map(pkg=>[esc(pkg.packageName),esc(formatDateTurkish(pkg.startDate,'short')),esc(pkg.endDate ? formatDateTurkish(pkg.endDate,'short') : '-'),esc(pkg.totalLessons),esc(pkg.usedLessons),esc(pkg.remainingLessons),esc(formatCurrency(pkg.totalAmount,teacher.currency)),esc(pkg.status),esc(pkg.notes || '-')]))}
        <h2>Finans Hareketleri</h2>
        ${table(['Tarih','İşlem','Açıklama','Ödeme Yöntemi','Tutar','Durum'], allTxns.map(t=>[esc(formatDateTurkish(t.date,'short')),esc(t.type),esc(t.description),esc(t.paymentMethod || '-'),esc(formatCurrency(t.amount,teacher.currency)),esc(t.isCancelled ? `İptal${t.cancellationReason ? ` • ${t.cancellationReason}` : ''}` : 'Aktif')]))}
        <h2>WhatsApp İletişim Geçmişi</h2>
        ${table(['Tarih','Alıcı','Şablon','Durum','Mesaj'], allWa.map(w=>[esc(formatDateTurkish(w.sentAt.slice(0,10),'short')),esc(w.recipientType === 'student' ? 'Öğrenci' : 'Veli'),esc(w.templateType),esc(w.status || 'Açıldı'),esc(w.messageText)]))}
      `;
    }
  } else if (reportType === 'student_progress') {
    const audienceLabel = reportAudience === 'teacher' ? 'Öğretmen Raporu' : 'Veli / Öğrenci Raporu';
    title = student ? `${student.firstName} ${student.lastName} - ${audienceLabel}` : audienceLabel;
    const completedLessons = sLessons.filter((l) => l.status === 'Tamamlandı');
    const completedAssignments = sAssignments.filter((a) => a.status === 'Tamamlandı' || a.status === 'Kontrol Edildi');
    const totalMinutes = completedLessons.reduce((sum, l) => sum + (l.actualDuration || l.duration || 0), 0);
    const lastExam = [...sExams].sort((a, b) => b.date.localeCompare(a.date))[0];
    const activePackage = student ? packages.find((p) => p.studentId === student.id && p.status === 'Aktif') : undefined;
    const balance = student ? calculateStudentBalance(student.id, transactions).balance : 0;
    const weakMap = new Map<string, number>();
    sProgress.forEach((p) => {
      const risk = (p.status === 'Tekrar Gerekli' ? 40 : 0) + (p.status === 'Soru Çözümü Gerekli' ? 30 : 0) + Math.max(0, 70 - p.masteryPercentage);
      if (risk > 0) weakMap.set(p.topicTitle, (weakMap.get(p.topicTitle) || 0) + risk);
    });
    sExams.forEach((e) => (e.incorrectTopics || []).forEach((t) => weakMap.set(t, (weakMap.get(t) || 0) + 25)));
    const weakTopics = [...weakMap.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name])=>name);
    const recommendations = weakTopics.length
      ? weakTopics.slice(0,3).map((t) => `${t}: kısa konu tekrarı, ardından hedefli soru çözümü ve sonraki derste kontrol.`)
      : ['Mevcut çalışma düzenini koruyun; yeni sonuçlar geldikçe öncelikli çalışma alanları otomatik güncellenecektir.'];
    const privateLessonNotes = completedLessons
      .filter((l) => l.teacherNotes)
      .sort((a,b)=>b.date.localeCompare(a.date))
      .slice(0,8);

    body = `
      <p class="muted"><strong>Rapor türü:</strong> ${esc(audienceLabel)} &nbsp; • &nbsp; <strong>Dönem:</strong> ${esc(rangeLabel)}</p>
      <div class="metrics">
        <div class="metric"><span>Tamamlanan Ders</span><strong>${completedLessons.length}</strong><small>${(totalMinutes / 60).toFixed(1)} saat</small></div>
        <div class="metric"><span>Ödev Tamamlama</span><strong>%${sAssignments.length ? Math.round((completedAssignments.length / sAssignments.length) * 100) : 0}</strong><small>${completedAssignments.length}/${sAssignments.length}</small></div>
        <div class="metric"><span>Son Deneme Neti</span><strong>${lastExam ? esc(lastExam.netScore) : '-'}</strong><small>${lastExam ? esc(lastExam.examName) : 'Kayıt yok'}</small></div>
        <div class="metric"><span>${reportAudience === 'teacher' ? 'Paket / Bakiye' : 'Kalan Paket'}</span><strong>${activePackage ? `${activePackage.remainingLessons} ders` : (reportAudience === 'teacher' ? formatCurrency(balance, teacher.currency) : '-')}</strong><small>${activePackage ? `${activePackage.totalLessons} derslik paket` : 'Aktif paket yok'}</small></div>
      </div>
      <h2>Akademik Hedefler</h2>
      ${table(['Hedef','Tür','Hedef Değer','Tarih','Durum'], sGoals.map(g => [esc(g.title), esc(g.goalType), esc(g.targetValue), esc(g.targetDate ? formatDateTurkish(g.targetDate,'short') : '-'), esc(g.status)]))}
      ${weakTopics.length ? `<h2>Öncelikli Çalışma Alanları</h2><p>${weakTopics.map((t,i)=>`${i+1}. ${esc(t)}`).join(' &nbsp; • &nbsp; ')}</p>` : ''}
      <h2>Önerilen Çalışma Planı</h2><ul>${recommendations.map((r)=>`<li>${esc(r)}</li>`).join('')}</ul>
      <h2>Ders Geçmişi</h2>
      ${table(['Tarih','Saat','Konu','Süre','Durum'], [...completedLessons].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,20).map(l => [esc(formatDateTurkish(l.date,'short')), esc(l.startTime), esc(l.topic || 'Matematik Dersi'), `${esc(l.actualDuration || l.duration)} dk`, esc(l.status)]))}
      <h2>Deneme / Sınav Sonuçları</h2>
      ${table(['Tarih','Sınav','Doğru','Yanlış','Boş','Net'], [...sExams].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10).map(e => [esc(formatDateTurkish(e.date,'short')), esc(e.examName), esc(e.correctCount), esc(e.wrongCount), esc(e.emptyCount), `<strong>${esc(e.netScore)}</strong>`]))}
      ${reportAudience === 'teacher' ? `<h2>Öğretmene Özel Değerlendirme</h2><p><strong>Öğrenci özel notu:</strong> ${esc(student?.teacherNotes || 'Özel not girilmemiş.')}</p>${table(['Tarih','Ders / Konu','Özel Not'], privateLessonNotes.map(l => [esc(formatDateTurkish(l.date,'short')), esc(l.topic || 'Matematik Dersi'), esc(l.teacherNotes || '-')]))}<p class="confidential">Bu bölüm yalnızca öğretmen kullanımı içindir; veli/öğrenci raporlarında gösterilmez.</p>` : ''}
    `;
  } else if (reportType === 'lesson_history') {
    title = student ? `${student.firstName} ${student.lastName} - Ders Geçmişi` : 'Ders Geçmişi';
    body = `<h2>Ders Geçmişi</h2>${table(['Tarih','Saat','Öğrenci','Konu','Süre','Tür','Durum'], [...sLessons].sort((a,b)=>`${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`)).map(l => [esc(formatDateTurkish(l.date,'short')), esc(l.startTime), esc(studentName(l.studentId, students)), esc(l.topic || 'Matematik'), `${esc(l.actualDuration || l.duration)} dk`, esc(l.lessonType), esc(l.status)]))}`;
  } else if (reportType === 'weekly_schedule' || reportType === 'monthly_schedule') {
    const start = new Date();
    start.setHours(0,0,0,0);
    const end = new Date(start);
    end.setDate(end.getDate() + (reportType === 'weekly_schedule' ? 7 : 31));
    const filtered = lessons.filter(l => {
      const d = new Date(`${l.date}T00:00:00`);
      return d >= start && d < end && l.status !== 'İptal Edildi' && l.status !== 'Öğretmen İptal Etti';
    });
    title = reportType === 'weekly_schedule' ? 'Haftalık Ders Programı' : 'Aylık Ders Programı';
    body = `<h2>${title}</h2>${table(['Tarih','Saat','Öğrenci','Ders Türü','Konu','Süre','Durum'], filtered.sort((a,b)=>`${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)).map(l => [esc(formatDateTurkish(l.date,'with-day')), esc(l.startTime), esc(studentName(l.studentId, students)), esc(l.lessonType), esc(l.topic || 'Matematik'), `${esc(l.duration)} dk`, esc(l.status)]))}`;
  } else if (reportType === 'assignment_report') {
    title = student ? `${student.firstName} ${student.lastName} - Ödev Raporu` : 'Ödev Raporu';
    body = `<h2>Ödev ve Soru Çözüm Takibi</h2>${table(['Veriliş','Teslim','Öğrenci','Konu','Kaynak / Sayfa','Durum'], [...sAssignments].sort((a,b)=>b.assignedDate.localeCompare(a.assignedDate)).map(a => [esc(formatDateTurkish(a.assignedDate,'short')), esc(formatDateTurkish(a.dueDate,'short')), esc(studentName(a.studentId, students)), esc(a.topic), esc(`${a.resourceName}${a.pages ? ` • ${a.pages}` : ''}`), esc(a.status)]))}`;
  } else if (reportType === 'topic_progress') {
    title = student ? `${student.firstName} ${student.lastName} - Konu İlerleme Raporu` : 'Konu İlerleme Raporu';
    body = `<h2>Konu ve Kazanım İlerlemesi</h2>${table(['Öğrenci','Konu','Durum','Başarı','Çözülen Soru','Son Tekrar'], [...sProgress].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).map(p => [esc(studentName(p.studentId, students)), esc(p.topicTitle), esc(p.status), `%${esc(p.masteryPercentage)}`, esc(p.totalQuestionsSolved), esc(p.lastReviewedDate ? formatDateTurkish(p.lastReviewedDate,'short') : '-')]))}`;
  } else if (reportType === 'exam_report') {
    title = student ? `${student.firstName} ${student.lastName} - Deneme ve Sınav Raporu` : 'Deneme ve Sınav Raporu';
    body = `<h2>Deneme / Sınav Sonuçları</h2>${table(['Tarih','Öğrenci','Sınav','Tür','D/Y/B','Net','Puan','Yanlış Konular'], [...sExams].sort((a,b)=>b.date.localeCompare(a.date)).map(e => [esc(formatDateTurkish(e.date,'short')), esc(studentName(e.studentId, students)), esc(e.examName), esc(e.examType), `${esc(e.correctCount)} / ${esc(e.wrongCount)} / ${esc(e.emptyCount)}`, `<strong>${esc(e.netScore)}</strong>`, esc(e.totalScore ?? '-'), esc((e.incorrectTopics || []).join(', ') || '-')]))}`;
  } else if (reportType === 'written_exam_plan') {
    title = student ? `${student.firstName} ${student.lastName} - Yazılı Hazırlık Planı` : 'Yazılı Hazırlık Planı';
    body = `<h2>Yazılı Hazırlık Takibi</h2>${table(['Tarih','Öğrenci','Yazılı','Hedef','Alınan','Hazırlık','Konular'], [...sWritten].sort((a,b)=>a.date.localeCompare(b.date)).map(w => [esc(formatDateTurkish(w.date,'short')), esc(studentName(w.studentId, students)), esc(w.examName), esc(w.targetGrade), esc(w.actualGrade ?? 'Bekliyor'), `%${esc(w.preparationPercentage)}`, esc(w.topics.join(', '))]))}`;
  } else if (reportType === 'financial_summary' || reportType === 'account_statement') {
    const filtered = reportType === 'financial_summary' && !dateFrom && !dateTo ? sTxns.filter(t => t.date.startsWith(thisMonth)) : sTxns;
    title = reportType === 'financial_summary' ? 'Finans Özeti' : (student ? `${student.firstName} ${student.lastName} - Hesap Ekstresi` : 'Öğrenci Hesap Ekstresi');
    const collected = filtered.filter(t => t.type === 'Ödeme Alındı' && !t.isCancelled).reduce((s,t)=>s+t.amount,0);
    const earned = filtered.filter(t => (t.type === 'Ders Ücreti' || t.type === 'Paket Satışı') && !t.isCancelled).reduce((s,t)=>s+t.amount,0);
    body = `<div class="metrics"><div class="metric"><span>Kazanılan</span><strong>${esc(formatCurrency(earned,teacher.currency))}</strong></div><div class="metric"><span>Tahsil Edilen</span><strong>${esc(formatCurrency(collected,teacher.currency))}</strong></div><div class="metric"><span>Bekleyen Ödeme</span><strong>${esc(formatCurrency(Math.max(0, earned-collected),teacher.currency))}</strong></div></div><h2>Hesap Hareketleri</h2>${table(['Tarih','Öğrenci','İşlem','Açıklama','Yöntem','Tutar'], [...filtered].filter(t=>!t.isCancelled).sort((a,b)=>b.date.localeCompare(a.date)).map(t => [esc(formatDateTurkish(t.date,'short')), esc(studentName(t.studentId, students)), esc(t.type), esc(t.description), esc(t.paymentMethod || '-'), `<strong>${esc(formatCurrency(t.amount,teacher.currency))}</strong>`]))}`;
  } else {
    title = 'Genel Rapor';
    body = '<p class="empty">Seçilen rapor türü için içerik tanımlanmamış.</p>';
  }

  const teacherName = `${teacher.firstName} ${teacher.lastName}`.trim();
  const instagram = teacher.instagramHandle || teacher.instagram || '@bymatematiik';
  return `<!doctype html>
<html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} - bymatematik</title>
<style>
  *{box-sizing:border-box} body{margin:0;background:#fff;color:#172033;font-family:Arial,"Helvetica Neue",sans-serif;font-size:12px;line-height:1.45;padding:28px} .page{max-width:980px;margin:0 auto}.header{display:flex;justify-content:space-between;gap:24px;border-bottom:3px solid #4f46e5;padding-bottom:16px;margin-bottom:20px}.brand{font-size:24px;font-weight:800;color:#312e81}.subtitle,.muted{color:#64748b}.report-title{text-align:right;font-size:16px;font-weight:800;color:#1e293b}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:0 0 20px}.metric{border:1px solid #e2e8f0;border-radius:12px;padding:12px;background:#f8fafc}.metric span{display:block;color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase}.metric strong{display:block;font-size:18px;margin-top:3px}.metric small{color:#64748b}h2{font-size:13px;margin:22px 0 8px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;text-transform:uppercase;letter-spacing:.03em}table{width:100%;border-collapse:collapse;font-size:10.5px}th{background:#f1f5f9;text-align:left;padding:8px;border-bottom:1px solid #cbd5e1}td{padding:7px 8px;border-bottom:1px solid #e2e8f0;vertical-align:top}.empty{text-align:center;color:#94a3b8;padding:20px}.footer{margin-top:28px;padding-top:10px;border-top:1px solid #e2e8f0;color:#64748b;display:flex;justify-content:space-between;gap:16px}.nowrap{white-space:nowrap}.confidential{margin-top:12px;padding:10px 12px;border:1px solid #f59e0b;background:#fffbeb;border-radius:10px;color:#92400e;font-weight:700}ul{padding-left:18px}li{margin:5px 0}@page{size:A4;margin:12mm}@media print{body{padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{max-width:none}.metrics{break-inside:avoid}tr{break-inside:avoid}}@media(max-width:700px){body{padding:14px}.header{flex-direction:column}.report-title{text-align:left}.metrics{grid-template-columns:repeat(2,1fr)}}
</style></head><body><div class="page">
  <div class="header"><div><div class="brand">bymatematik</div><div class="subtitle">Özel Ders Yönetim ve Öğretmen Asistanı</div><div style="margin-top:8px"><strong>Öğretmen:</strong> ${esc(teacherName)}${teacher.title ? ` • ${esc(teacher.title)}` : ''}</div></div><div class="report-title">${esc(title)}<div class="muted" style="font-size:11px;font-weight:500;margin-top:4px">Oluşturulma: ${esc(formatDateTurkish(todayStr,'full'))}</div><div class="muted" style="font-size:11px;font-weight:500;margin-top:2px">Dönem: ${esc(rangeLabel)}</div></div></div>
  ${body}
  <div class="footer"><span><strong>bymatematik</strong> • Özel Ders Asistanı</span><span>Instagram: <strong>${esc(instagram)}</strong></span></div>
</div></body></html>`;
}
