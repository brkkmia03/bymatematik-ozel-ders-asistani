import {
  Student,
  TeacherProfile,
  Lesson,
  Assignment,
  LessonPackage,
} from '../types';
import { formatDateTurkish, formatCurrency, normalizePhoneNumber } from './formatters';

export function generateWhatsAppMessage(
  templateType:
    | 'lesson_report'
    | 'assignment'
    | 'payment_reminder'
    | 'schedule_change'
    | 'written_exam_prep'
    | 'motivation',
  context: {
    student?: Student;
    teacher: TeacherProfile;
    lesson?: Lesson;
    assignment?: Assignment;
    packageItem?: LessonPackage;
  }
): string {
  const { student, teacher, lesson, assignment, packageItem } = context;
  const studentName = student ? `${student.firstName} ${student.lastName}` : 'Öğrencimiz';
  const parentName = student?.parentName ? `Sayın ${student.parentName}` : 'Sayın Velimiz';
  const teacherName = `${teacher.firstName} ${teacher.lastName}`;
  const brandName = teacher.brandName || 'bymatematik';
  const instagram = teacher.instagramHandle || teacher.instagram || '@bymatematiik';

  switch (templateType) {
    case 'lesson_report': {
      const topic = lesson?.topic || 'Matematik Dersi';
      const subtopic = lesson?.subtopic ? `\n🔹 *Alt Başlık:* ${lesson.subtopic}` : '';
      const notes = lesson?.teacherNotes ? `\n💡 *Öğretmen Görüşü:* ${lesson.teacherNotes}` : '';
      const duration = lesson?.duration ? ` (${lesson.duration} dk)` : '';
      const homework = lesson?.nextHomeworkSummary
        ? `\n📚 *Verilen Yeni Ödev:* ${lesson.nextHomeworkSummary}`
        : '';

      return `👋 Merhaba ${parentName},

Bugün ${studentName} ile gerçekleştirdiğimiz matematik özel dersimiz verimli bir şekilde tamamlanmıştır.

📌 *Ders Detayları:*
🗓️ *Tarih:* ${formatDateTurkish(lesson?.date || new Date().toISOString().split('T')[0], 'full')}${duration}
📐 *İşlenen Konu:* ${topic}${subtopic}${notes}${homework}

Öğrencimizin gayreti ve odaklanması için teşekkür eder, iyi günler dilerim.

✨ *${teacherName}*
📐 *${brandName}* • ${instagram}`;
    }

    case 'assignment': {
      const title = assignment?.title || 'Matematik Ödev Föyü';
      const book = assignment?.resourceName ? `\n📖 *Kaynak Kitap:* ${assignment.resourceName}` : '';
      const pages = assignment?.pages ? `\n📄 *Sayfalar / Test:* ${assignment.pages}` : '';
      const qCount = assignment?.questionCount ? `\n🎯 *Soru Sayısı:* ${assignment.questionCount} Soru` : '';
      const dueDate = assignment?.dueDate
        ? `\n⏰ *Son Teslim Tarihi:* ${formatDateTurkish(assignment.dueDate, 'full')}`
        : '';

      return `👋 Merhaba ${parentName},

${studentName} için hazırladığımız matematik ödev föyü detayları aşağıdadır:

📝 *Ödev Bilgisi:*
📌 *Konu:* ${title}${book}${pages}${qCount}${dueDate}

Öğrencimizin soruları dikkatle çözmesini ve takıldığı soruları işaretleyip derse getirmesini rica ederim.

✨ *${teacherName}*
📐 *${brandName}* • ${instagram}`;
    }

    case 'payment_reminder': {
      const remaining = packageItem ? packageItem.remainingLessons : 0;
      const bankInfo = teacher.bankName && teacher.iban
        ? `\n\n🏦 *Banka Hesap Bilgilerimiz:*\n*Banka:* ${teacher.bankName}\n*Alıcı:* ${teacher.bankAccountHolder || teacherName}\n*IBAN:* \`${teacher.iban}\``
        : '';

      return `👋 Merhaba ${parentName},

${studentName} ile devam ettiğimiz özel ders sürecinde kalan ders paketi krediniz *${remaining} ders* olarak güncellenmiştir.

Derslerin kesintisiz ve planlı şekilde devam edebilmesi adına yeni paket yüklemesini rica ederiz.${bankInfo}

Anlayışınız ve iş birliğiniz için teşekkür eder, iyi çalışmalar dilerim.

✨ *${teacherName}*
📐 *${brandName}* • ${instagram}`;
    }

    case 'schedule_change': {
      return `👋 Merhaba ${parentName},

${studentName} ile planlanan matematik özel dersimizin günü ve saati güncellenmiştir:

🗓️ *Yeni Ders Tarihi:* ${formatDateTurkish(lesson?.date || '', 'full')}
⏰ *Yeni Ders Saati:* ${lesson?.startTime || '17:00'} (${lesson?.duration || 60} dk)
📍 *Ders Formatı:* ${lesson?.lessonType || 'Yüz Yüze'}

Programda herhangi bir uyuşmazlık olması durumunda lütfen bildiriniz.

✨ *${teacherName}*
📐 *${brandName}* • ${instagram}`;
    }

    case 'written_exam_prep': {
      return `👋 Merhaba ${parentName},

${studentName} için yaklaşan okul matematik yazılı sınavı hazırlık programımız başlatılmıştır. 

Derslerimizde okul müfredatı klasik ve test soruları üzerinden kapsamlı soru çözümleri ve konu tekrarları yapılacaktır. Öğrencimizin hazırlık föylerini eksiksiz tekrar etmesi önemlidir.

Başarılar dilerim.

✨ *${teacherName}*
📐 *${brandName}* • ${instagram}`;
    }

    case 'motivation': {
      return `👋 Merhaba ${parentName},

${studentName} son haftalarda matematik derslerinde göstermiş olduğu gayret, ödev disiplini ve soru çözme isteğiyle takdiri hak ediyor! 👏

Bu istikrarlı çalışmanın hedeflediğimiz sınav ve okul başarısını getireceğine inanıyorum. Desteğiniz için teşekkür ederim.

✨ *${teacherName}*
📐 *${brandName}* • ${instagram}`;
    }

    default:
      return `Merhaba ${parentName}, ${studentName} matematik dersi bilgilendirmesidir.`;
  }
}

export function openWhatsAppUrl(phone: string, text: string) {
  const { isValid, normalized } = normalizePhoneNumber(phone);
  const targetPhone = isValid ? normalized : phone.replace(/\D/g, '');
  const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}
