export type EducationType = 'Ortaokul' | 'Lise' | 'Sınav Hazırlığı' | 'Diğer';

export type GradeLevel =
  | '5. Sınıf'
  | '6. Sınıf'
  | '7. Sınıf'
  | '8. Sınıf'
  | '9. Sınıf'
  | '10. Sınıf'
  | '11. Sınıf'
  | '12. Sınıf'
  | 'Mezun'
  | 'Üniversite / Yetişkin';

export type ExamType =
  | 'LGS'
  | 'TYT Matematik'
  | 'AYT Matematik'
  | 'TYT + AYT'
  | 'KPSS Matematik'
  | 'DGS Matematik'
  | 'ALES Matematik'
  | 'MSÜ'
  | 'AGS'
  | 'Okul Yazılısı'
  | 'Diğer';

export type LessonType = 'Birebir' | 'Grup' | 'Online' | 'Yüz Yüze Ev' | 'Yüz Yüze Kurum';

export type FeeType = 'Ders Başı' | 'Saatlik' | 'Paket';

export type LessonStatus =
  | 'Planlandı'
  | 'Yaklaşıyor'
  | 'Başladı'
  | 'Tamamlandı'
  | 'Ertelendi'
  | 'İptal Edildi'
  | 'Öğrenci Katılmadı'
  | 'Öğretmen İptal Etti';

export type RepeatType = 'Tek Seferlik' | 'Her Hafta' | 'Belirli Günlerde' | 'Özel Tekrar';

export type AssignmentStatus =
  | 'Bekliyor'
  | 'Yapılıyor'
  | 'Tamamlandı'
  | 'Eksik'
  | 'Yapılmadı'
  | 'Kontrol Edildi';

export type AssignmentPriority = 'Düşük' | 'Normal' | 'Yüksek' | 'Acil';

export type TopicStatus =
  | 'Başlanmadı'
  | 'İşleniyor'
  | 'Tamamlandı'
  | 'Tekrar Gerekli'
  | 'Soru Çözümü Gerekli'
  | 'Denemeyle Pekiştirilecek';

export type WrittenExamPrepStatus =
  | 'Planlandı'
  | 'Hazırlanıyor'
  | 'Hazır'
  | 'Öğrenciyle Çalışıldı'
  | 'Tamamlandı';

export type MaterialTaskStatus = 'Yapılacak' | 'Hazırlanıyor' | 'Hazır' | 'Kullanıldı';

export type PaymentMethod = 'Nakit' | 'Havale/EFT' | 'FAST' | 'Kredi Kartı' | 'Diğer';

export type TransactionType = 'Ders Ücreti' | 'Ödeme Alındı' | 'Paket Satışı' | 'İade/Düzeltme';

export interface User {
  id: string;
  email: string;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface TeacherProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  avatarUrl?: string;
  brandName: string;
  instagramHandle: string;
  instagram?: string;
  defaultHourlyRate: number;
  defaultLessonFee?: number;
  defaultLessonDuration: number; // in minutes (e.g. 60)
  messageSignature: string;
  currency: string;
  bankName?: string;
  iban?: string;
  bankAccountHolder?: string;
  city?: string;
  website?: string;
}

export interface SecuritySettings {
  isPinEnabled: boolean;
  pinCode?: string;
  isBiometricEnabled: boolean;
  autoLockTime: 'Hemen' | '1 dakika' | '5 dakika' | '15 dakika' | 'Kapalı';
  lastUnlockedAt?: number;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  educationType: EducationType;
  gradeLevel: GradeLevel;
  targetExam?: ExamType;
  schoolName?: string;
  studentPhone?: string;
  parentName: string;
  parentPhone: string;
  parentRelationship?: string; // Anne, Baba, Veli
  lessonFee: number;
  lessonDuration: number; // default 60 min
  feeType: FeeType;
  packageId?: string;
  academicGoal: string;
  lessonType: LessonType;
  teacherNotes?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  avatarColor?: string;
}

export interface Lesson {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  duration: number; // minutes
  actualDuration?: number; // minutes actually spent
  lessonType: LessonType;
  location?: string;
  fee: number;
  isBillable: boolean;
  repeatType: RepeatType;
  repeatDays?: number[]; // 0=Sunday, 1=Monday...
  status: LessonStatus;
  rescheduledToLessonId?: string;
  rescheduledFromLessonId?: string;
  cancellationReason?: string;
  notificationTime?: number; // minutes before (15, 30, 60, etc.)
  notes?: string;
  teacherNotes?: string;
  nextHomeworkSummary?: string;
  topic?: string;
  subtopic?: string;
  lessonNoteId?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface LessonCompletionData {
  topic: string;
  subtopic?: string;
  learningOutcome?: string; // Kazanım
  usedResources?: string;
  solvedQuestionsCount: number;
  participationRating: number; // 1-5
  topicMasteryRating: number; // 1-5
  problemSolvingRating: number; // 1-5
  difficultAreas?: string;
  teacherNote?: string;
  nextLessonPlan?: string;
  isBillable: boolean;
  actualDuration: number;
  // Optional homework created directly at lesson end
  giveHomework?: boolean;
  homeworkTitle?: string;
  homeworkResource?: string;
  homeworkPage?: string;
  homeworkQuestions?: string;
  homeworkDueDate?: string;
  homeworkDescription?: string;
}

export interface LessonNote {
  id: string;
  lessonId: string;
  studentId: string;
  topic: string;
  subtopic?: string;
  learningOutcome?: string;
  usedResources?: string;
  solvedQuestionsCount: number;
  participationRating: number;
  topicMasteryRating: number;
  problemSolvingRating: number;
  difficultAreas?: string;
  teacherNote?: string;
  nextLessonPlan?: string;
  createdAt: string;
}

export interface Assignment {
  id: string;
  studentId: string;
  lessonId?: string;
  topic: string;
  title?: string;
  resourceName: string;
  pages?: string;
  questionNumbers?: string;
  questionCount?: number;
  description?: string;
  assignedDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  priority: AssignmentPriority;
  status: AssignmentStatus;
  fileUrl?: string;
  fileName?: string;
  teacherFeedback?: string;
  completedDate?: string;
  checkedDate?: string;
  createdAt: string;
}

export interface TopicItem {
  id: string;
  gradeOrExam: string;
  unit: string;
  title: string;
  subtopics: string[];
  learningOutcomes: string[];
  importanceLevel?: 'Temel' | 'Orta' | 'Yüksek' | 'Kritik';
}

export interface StudentTopicProgress {
  id: string;
  studentId: string;
  topicId: string;
  topicTitle: string;
  status: TopicStatus;
  firstTaughtDate?: string;
  lastReviewedDate?: string;
  totalQuestionsSolved: number;
  masteryPercentage: number; // 0-100
  notes?: string;
  updatedAt: string;
}

export type GoalType = 'Net Hedefi' | 'Puan Hedefi' | 'Yazılı Notu' | 'Konu Tamamlama' | 'Ödev Tamamlama';
export type GoalStatus = 'Aktif' | 'Tamamlandı' | 'Duraklatıldı';

export interface AcademicGoal {
  id: string;
  studentId: string;
  title: string;
  goalType: GoalType;
  targetValue: number;
  currentValue?: number;
  targetDate?: string;
  status: GoalStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamResult {
  id: string;
  studentId: string;
  examName: string;
  examType: ExamType;
  date: string; // YYYY-MM-DD
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  netScore: number;
  totalScore?: number;
  targetNet?: number;
  incorrectTopics?: string[];
  publisher?: string;
  notes?: string;
  resultDocumentUrl?: string;
  resultDocumentName?: string;
  createdAt: string;
}

export interface WrittenExam {
  id: string;
  studentId: string;
  examName: string; // Örn: 1. Dönem 1. Matematik Yazılısı
  date: string; // YYYY-MM-DD
  targetGrade: number; // e.g. 90
  actualGrade?: number; // e.g. 88
  topics: string[];
  preparationPercentage: number; // 0-100
  teacherNotes?: string;
  createdAt: string;
}

export interface WrittenExamPreparation {
  id: string;
  studentId: string;
  writtenExamId: string;
  planTitle: string;
  status: WrittenExamPrepStatus;
  targetDate: string;
  topicsCovered: string[];
  plannedActivities: string[];
  documentIds?: string[];
  urlLinks?: { title: string; url: string }[];
  teacherNotes?: string;
  createdAt: string;
}

export interface MaterialTask {
  id: string;
  title: string;
  description?: string;
  category: 'Yazılı Provası' | 'Çalışma Kağıdı' | 'Test Hazırlığı' | 'Tekrar Föyü' | 'Konu Özeti' | 'Genel Görev';
  studentId?: string; // Optional: linked to a student or general
  studentName?: string;
  dueDate?: string;
  priority: AssignmentPriority;
  status: MaterialTaskStatus;
  isAutoGenerated?: boolean;
  writtenExamId?: string;
  preparationId?: string;
  documentIds?: string[];
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  description?: string;
  fileType: 'PDF' | 'Word' | 'Görsel' | 'URL Link' | 'Diğer';
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  isUrl: boolean;
  url?: string;
  urlPlatform?: 'Google Drive' | 'Canva' | 'Online Test' | 'Web Sitesi' | 'Desmos/Geogebra' | 'MEB Kazanım' | 'Diğer';
  studentIds: string[]; // Empty for general pool, or specific student IDs
  educationType?: EducationType;
  gradeLevel?: GradeLevel;
  examType?: ExamType;
  topic?: string;
  writtenExamId?: string;
  tags: string[];
  createdAt: string;
}

export interface LessonPackage {
  id: string;
  studentId: string;
  packageName: string;
  totalLessons: number;
  usedLessons: number;
  remainingLessons: number;
  totalAmount: number;
  startDate: string;
  endDate?: string;
  status: 'Aktif' | 'Tamamlandı' | 'İptal';
  notes?: string;
  createdAt: string;
}

export interface FinancialTransaction {
  id: string;
  studentId: string;
  type: TransactionType;
  amount: number; // positive for charges or payments
  date: string; // YYYY-MM-DD
  paymentMethod?: PaymentMethod;
  lessonId?: string;
  packageId?: string;
  description: string;
  isCancelled?: boolean;
  cancellationReason?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type:
    | 'Yaklaşan Ders'
    | 'Ödev Kontrolü'
    | 'Yaklaşan Yazılı'
    | 'Yaklaşan Sınav'
    | 'Bekleyen Ödeme'
    | 'Paket Bitişi'
    | 'Hazırlanacak Materyal'
    | 'Görev'
    | 'Doğum Günü'
    | 'Sistem Uyarısı';
  date: string;
  isRead: boolean;
  isCompleted?: boolean;
  snoozedUntil?: string;
  relatedEntityId?: string;
  relatedStudentId?: string;
  linkTab?: string;
  createdAt: string;
}

export interface MessageTemplate {
  id: string;
  title: string;
  type:
    | 'Ders Hatırlatma'
    | 'Ödev Bilgilendirme'
    | 'Ders Sonu Bilgilendirme'
    | 'Ders Erteleme'
    | 'Ders İptali'
    | 'Ödeme Hatırlatma'
    | 'Paket Yenileme'
    | 'Genel Bilgilendirme';
  content: string;
  variables: string[];
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  enableSound: boolean;
  enableNotifications: boolean;
  notificationLeadTimes: number[]; // e.g. [15, 60, 1440] (in minutes)
  quietHoursStart?: string; // "22:00"
  quietHoursEnd?: string; // "08:00"
  defaultTaxRate?: number;
  autoBackup: boolean;
}
