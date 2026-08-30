import { ExamType, Lesson, Assignment, ExamResult, FinancialTransaction, LessonPackage } from '../types';


export function toLocalDateInputValue(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats currency in standard Turkish format: e.g. 1.500,00 ₺
 */
export function formatCurrency(amount: number, currency: string = '₺'): string {
  if (isNaN(amount)) return `0,00 ${currency}`;
  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ${currency}`;
}

/**
 * Formats a date string (YYYY-MM-DD) into rich Turkish representations
 */
export function formatDateTurkish(
  dateStr?: string,
  variant: 'full' | 'short' | 'with-day' | 'relative' | 'time-only' = 'short'
): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return dateStr;

    if (variant === 'relative') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const target = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Bugün';
      if (diffDays === 1) return 'Yarın';
      if (diffDays === -1) return 'Dün';
      if (diffDays > 1 && diffDays <= 7) return `${diffDays} gün sonra`;
      if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} gün önce`;
    }

    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const dayName = days[d.getDay()];

    if (variant === 'short') {
      const dd = String(day).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      return `${dd}.${mm}.${year}`;
    }

    if (variant === 'with-day') {
      return `${day} ${month} ${year}, ${dayName}`;
    }

    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Normalizes Turkish phone numbers to international digits format (905xxxxxxxxx)
 */
export function normalizePhoneNumber(phone?: string): { isValid: boolean; normalized: string; formatted: string } {
  if (!phone) {
    return { isValid: false, normalized: '', formatted: '' };
  }

  // Remove non-digit characters
  const digits = phone.replace(/\D/g, '');

  let cleanDigits = digits;
  if (digits.startsWith('90') && digits.length === 12) {
    cleanDigits = digits;
  } else if (digits.startsWith('0') && digits.length === 11) {
    cleanDigits = `9${digits}`;
  } else if (digits.length === 10 && digits.startsWith('5')) {
    cleanDigits = `90${digits}`;
  }

  const isValid = cleanDigits.length === 12 && cleanDigits.startsWith('905');

  // Format nicely for display (05XX XXX XX XX)
  let formatted = phone;
  if (cleanDigits.length === 12) {
    const raw = cleanDigits.substring(2); // 5xxxxxxxxx
    formatted = `0${raw.substring(0, 3)} ${raw.substring(3, 6)} ${raw.substring(6, 8)} ${raw.substring(8, 10)}`;
  }

  return {
    isValid,
    normalized: cleanDigits,
    formatted,
  };
}

export function cleanPhoneNumber(phone?: string): string {
  return normalizePhoneNumber(phone).normalized;
}

export function isValidTurkishPhone(phone?: string): boolean {
  return normalizePhoneNumber(phone).isValid;
}

export function generateWhatsAppLessonReport(data: any): string {
  const studentName = data.student ? `${data.student.firstName} ${data.student.lastName}` : 'Öğrencimiz';
  const topic = data.lesson?.topic || 'Matematik Dersi';
  const teacherName = data.teacher ? `${data.teacher.firstName} ${data.teacher.lastName}` : 'Matematik Öğretmeni';
  return `Sayın Velimiz,\n\nBugün ${studentName} ile matematik özel dersimiz tamamlanmıştır.\nİşlenen Konu: ${topic}\n\nİyi günler dilerim.\n${teacherName} (@bymatematiik)`;
}

export function generateWhatsAppAssignmentReminder(data: any): string {
  const studentName = data.student ? `${data.student.firstName} ${data.student.lastName}` : 'Öğrencimiz';
  const title = data.assignment?.title || 'Matematik Ödevi';
  return `Sayın Velimiz,\n\n${studentName} için verilen matematik ödevi: ${title}.\n\nİyi çalışmalar dilerim.`;
}

export function generateWhatsAppPaymentReminder(data: any): string {
  const studentName = data.student ? `${data.student.firstName} ${data.student.lastName}` : 'Öğrencimiz';
  return `Sayın Velimiz,\n\n${studentName} özel ders paket bilgilendirmesidir. İyi günler dileriz.`;
}

/**
 * Generates WhatsApp Web / App direct chat URI with encoded message
 */
export function getWhatsAppLink(phone?: string, messageText?: string): { url: string; error?: string } {
  const { isValid, normalized } = normalizePhoneNumber(phone);
  if (!isValid) {
    return {
      url: '',
      error: 'Veli telefon numarası kayıtlı değil veya geçersiz (05xx formatında olmalıdır).',
    };
  }
  const encodedText = messageText ? encodeURIComponent(messageText) : '';
  const url = `https://wa.me/${normalized}?text=${encodedText}`;
  return { url };
}

/**
 * Calculate standard Turkish net scores based on exam type:
 * - LGS: Net = Doğru - (Yanlış / 3)
 * - YKS (TYT/AYT/MSÜ): Net = Doğru - (Yanlış / 4)
 * - KPSS / DGS / ALES: Net = Doğru - (Yanlış / 4)
 */
export function calculateNetScore(correct: number, wrong: number, examType?: ExamType): number {
  const isLgs = examType === 'LGS';
  const divisor = isLgs ? 3 : 4;
  const net = correct - wrong / divisor;
  return Number(Math.max(0, net).toFixed(2));
}

/**
 * Calculate financial balance for a student:
 * Sum of charges (Ders Ücreti + Paket Satışı) minus payments (Ödeme Alındı)
 */
export function calculateStudentBalance(studentId: string, transactions: FinancialTransaction[]): {
  totalCharged: number;
  totalPaid: number;
  balance: number; // positive = student owes money (Bekleyen Bakiye), negative = overpaid
} {
  const studentTxns = transactions.filter((t) => t.studentId === studentId && !t.isCancelled);

  let totalCharged = 0;
  let totalPaid = 0;

  for (const t of studentTxns) {
    if (t.type === 'Ders Ücreti' || t.type === 'Paket Satışı') {
      totalCharged += t.amount;
    } else if (t.type === 'Ödeme Alındı') {
      totalPaid += t.amount;
    } else if (t.type === 'İade/Düzeltme') {
      totalPaid += t.amount; // Adjustments
    }
  }

  return {
    totalCharged,
    totalPaid,
    balance: totalCharged - totalPaid,
  };
}

/**
 * Calculate comprehensive student performance statistics
 */
export function calculateStudentStats(
  studentId: string,
  lessons: Lesson[],
  assignments: Assignment[],
  examResults: ExamResult[],
  packages: LessonPackage[],
  transactions: FinancialTransaction[]
) {
  const studentLessons = lessons.filter((l) => l.studentId === studentId);
  const completedLessons = studentLessons.filter((l) => l.status === 'Tamamlandı');

  const totalLessonCount = completedLessons.length;
  const totalLessonMinutes = completedLessons.reduce((acc, curr) => acc + (curr.actualDuration || curr.duration || 60), 0);
  const totalLessonHours = Number((totalLessonMinutes / 60).toFixed(1));

  // Homework stats
  const studentAssignments = assignments.filter((a) => a.studentId === studentId);
  const completedAssignments = studentAssignments.filter(
    (a) => a.status === 'Tamamlandı' || a.status === 'Kontrol Edildi'
  );
  const homeworkCompletionRate =
    studentAssignments.length > 0
      ? Math.round((completedAssignments.length / studentAssignments.length) * 100)
      : 0;

  // Exam stats
  const studentExams = examResults
    .filter((e) => e.studentId === studentId)
    .sort((a, b) => b.date.localeCompare(a.date));
  const latestExam = studentExams.length > 0 ? studentExams[0] : null;
  const highestNet =
    studentExams.length > 0 ? Math.max(...studentExams.map((e) => e.netScore)) : 0;
  const avgNet =
    studentExams.length > 0
      ? Number(
          (
            studentExams.slice(0, 5).reduce((acc, curr) => acc + curr.netScore, 0) /
            Math.min(5, studentExams.length)
          ).toFixed(2)
        )
      : 0;

  // Package info
  const activePackage = packages.find((p) => p.studentId === studentId && p.status === 'Aktif');

  // Finance info
  const finance = calculateStudentBalance(studentId, transactions);

  // Next and last lesson
  const now = new Date();
  const sortedUpcoming = studentLessons
    .filter((l) => {
      if (!(l.status === 'Planlandı' || l.status === 'Yaklaşıyor')) return false;
      const lessonTime = new Date(`${l.date}T${l.startTime}:00`).getTime();
      return Number.isFinite(lessonTime) && lessonTime >= now.getTime() - 60_000;
    })
    .sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime());

  const sortedPast = completedLessons.sort(
    (a, b) => new Date(`${b.date}T${b.startTime}`).getTime() - new Date(`${a.date}T${a.startTime}`).getTime()
  );

  return {
    totalLessonCount,
    totalLessonHours,
    totalLessonMinutes,
    homeworkCompletionRate,
    totalAssignmentsCount: studentAssignments.length,
    completedAssignmentsCount: completedAssignments.length,
    latestExam,
    highestNet,
    avgNet,
    activePackage,
    finance,
    nextLesson: sortedUpcoming[0] || null,
    lastLesson: sortedPast[0] || null,
  };
}

/**
 * Check if two lesson time slots overlap
 */
export function checkTimesOverlap(
  date1: string,
  startTime1: string,
  duration1: number,
  date2: string,
  startTime2: string,
  duration2: number
): boolean {
  if (date1 !== date2) return false;

  const [h1, m1] = startTime1.split(':').map(Number);
  const [h2, m2] = startTime2.split(':').map(Number);

  const startMinutes1 = h1 * 60 + m1;
  const endMinutes1 = startMinutes1 + duration1;

  const startMinutes2 = h2 * 60 + m2;
  const endMinutes2 = startMinutes2 + duration2;

  return Math.max(startMinutes1, startMinutes2) < Math.min(endMinutes1, endMinutes2);
}
