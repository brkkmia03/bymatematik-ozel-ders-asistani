import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import {
  User,
  TeacherProfile,
  SecuritySettings,
  Student,
  Lesson,
  LessonNote,
  LessonCompletionData,
  Assignment,
  AssignmentStatus,
  StudentTopicProgress,
  TopicStatus,
  ExamResult,
  WrittenExam,
  WrittenExamPreparation,
  MaterialTask,
  MaterialTaskStatus,
  DocumentItem,
  LessonPackage,
  FinancialTransaction,
  NotificationItem,
  MessageTemplate,
  UserSettings,
  AcademicGoal,
  GoalStatus,
} from '../types';
import {
  INITIAL_TEACHER,
  INITIAL_SECURITY,
  INITIAL_SETTINGS,
  INITIAL_STUDENTS,
  INITIAL_PACKAGES,
  INITIAL_LESSONS,
  INITIAL_LESSON_NOTES,
  INITIAL_ASSIGNMENTS,
  INITIAL_EXAM_RESULTS,
  INITIAL_WRITTEN_EXAMS,
  INITIAL_WRITTEN_PREPARATIONS,
  INITIAL_TASKS,
  INITIAL_DOCUMENTS,
  INITIAL_TRANSACTIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_MESSAGE_TEMPLATES,
  INITIAL_GOALS,
} from '../data/initialData';
import { CURRICULUM_DATA } from '../data/curriculum';
import { checkTimesOverlap, toLocalDateInputValue } from '../utils/formatters';
import { createEntityId } from '../utils/ids';
import {
  hasScopedData,
  loadScoped,
  parseBackupEnvelope,
  saveSafetySnapshot,
  saveScoped,
  createBackupEnvelope,
} from '../services/storage';
import { isSupabaseConfigured, supabase } from '../services/supabase';
import { CloudConflictError, loadCloudState, saveCloudState } from '../services/cloudStorage';


const normalizeCurriculumText = (value: string) => value
  .toLocaleLowerCase('tr-TR')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9çğıöşü\s]/gi, ' ')
  .replace(/(ve|ile|icin|için)/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const findCurriculumTopicForLesson = (topic?: string, subtopic?: string, student?: Student) => {
  const query = normalizeCurriculumText([topic, subtopic].filter(Boolean).join(' '));
  if (!query) return undefined;
  const queryTokens = query.split(' ').filter((token) => token.length > 2);
  const preferredKey = student?.gradeLevel === '8. Sınıf' ? '8. Sınıf (LGS)' : student?.gradeLevel;
  const scopedItems = preferredKey ? CURRICULUM_DATA.filter((item) => item.gradeOrExam === preferredKey) : CURRICULUM_DATA;
  const candidates = scopedItems.length ? scopedItems : CURRICULUM_DATA;
  let best: { item: (typeof CURRICULUM_DATA)[number]; score: number } | undefined;
  for (const item of candidates) {
    const haystack = normalizeCurriculumText([item.title, item.unit, ...item.subtopics].join(' '));
    const exactish = haystack.includes(query) || query.includes(normalizeCurriculumText(item.title));
    const tokenHits = queryTokens.filter((token) => haystack.includes(token)).length;
    const score = exactish ? 100 + tokenHits : (queryTokens.length ? tokenHits / queryTokens.length : 0);
    if (!best || score > best.score) best = { item, score };
  }
  return best && (best.score >= 100 || best.score >= 0.6) ? best.item : undefined;
};

interface WhatsAppLog {
  id: string;
  studentId: string;
  recipientPhone: string;
  recipientType?: 'parent' | 'student';
  templateType: string;
  messageText: string;
  sentAt: string;
  status?: string;
}

export interface AppToast {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message?: string;
}

interface AppContextType {
  // Auth & Profile
  user: User | null;
  teacher: TeacherProfile;
  security: SecuritySettings;
  settings: UserSettings;
  isAppLocked: boolean;
  authReady: boolean;
  cloudReady: boolean;
  syncStatus: 'idle' | 'loading' | 'syncing' | 'synced' | 'offline' | 'error';
  lastSyncedAt: string | null;
  syncNow: () => Promise<void>;
  syncConflict: boolean;
  resolveSyncConflict: (strategy: 'cloud' | 'local') => Promise<boolean>;
  loginUser: (email: string, pass: string) => Promise<boolean>;
  registerUser: (email: string, pass: string, name: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  passwordRecoveryMode: boolean;
  updatePassword: (password: string) => Promise<boolean>;
  logoutUser: () => Promise<void>;
  updateTeacherProfile: (profile: Partial<TeacherProfile>) => void;
  updateSecuritySettings: (sec: Partial<SecuritySettings>) => void;
  updateUserSettings: (st: Partial<UserSettings>) => void;
  unlockAppWithPin: (pin: string) => boolean;
  lockAppNow: () => void;
  toasts: AppToast[];
  pushToast: (toast: Omit<AppToast, 'id'>) => void;
  dismissToast: (id: string) => void;

  // Students
  students: Student[];
  addStudent: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'isArchived'>) => Student;
  updateStudent: (id: string, data: Partial<Student>) => void;
  archiveStudent: (id: string) => void;
  restoreStudent: (id: string) => void;
  deleteStudentPermanent: (id: string) => void;

  // Lessons
  lessons: Lesson[];
  lessonNotes: LessonNote[];
  addLesson: (lesson: Omit<Lesson, 'id' | 'createdAt'>) => { lesson?: Lesson; conflictWarning?: string };
  updateLesson: (id: string, data: Partial<Lesson>) => void;
  cancelLesson: (id: string, reason?: string, byTeacher?: boolean) => void;
  rescheduleLesson: (lessonId: string, newDate: string, newStartTime: string, reason?: string) => Lesson;
  completeLesson: (lessonId: string, summary: LessonCompletionData) => void;
  deleteLesson: (id: string) => void;
  checkConflict: (date: string, startTime: string, duration: number, excludeLessonId?: string) => Lesson | null;

  // Active Lesson Stopwatch state
  activeLessonId: string | null;
  activeLessonStartTime: number | null;
  activeLessonElapsedSeconds: number;
  startLiveLesson: (lessonId: string) => void;
  pauseLiveLesson: () => void;
  resumeLiveLesson: () => void;
  stopAndOpenCompletionModal: () => void;
  cancelLiveLesson: () => void;

  // Assignments
  assignments: Assignment[];
  addAssignment: (assignment: Omit<Assignment, 'id' | 'createdAt'>) => Assignment;
  updateAssignment: (id: string, data: Partial<Assignment>) => void;
  updateAssignmentStatus: (id: string, status: AssignmentStatus, feedback?: string) => void;
  deleteAssignment: (id: string) => void;

  // Topic Progress
  topicProgress: StudentTopicProgress[];
  curriculumProgress: StudentTopicProgress[];
  toggleCurriculumOutcome: (studentId: string, topicId: string, topicTitle: string) => void;
  updateStudentTopicProgress: (studentId: string, topicId: string, topicTitle: string, status: TopicStatus, questionsAdd?: number, mastery?: number, notes?: string) => void;

  // Academic Goals
  goals: AcademicGoal[];
  addGoal: (goal: Omit<AcademicGoal, 'id' | 'createdAt' | 'updatedAt'>) => AcademicGoal;
  updateGoal: (id: string, data: Partial<AcademicGoal>) => void;
  deleteGoal: (id: string) => void;
  updateGoalStatus: (id: string, status: GoalStatus) => void;

  // Exam Results
  examResults: ExamResult[];
  exams: ExamResult[];
  addExamResult: (exam: Omit<ExamResult, 'id' | 'createdAt'>) => ExamResult;
  deleteExamResult: (id: string) => void;

  // Written Exams & Prep
  writtenExams: WrittenExam[];
  writtenPreparations: WrittenExamPreparation[];
  addWrittenExam: (wex: Omit<WrittenExam, 'id' | 'createdAt'>) => WrittenExam;
  updateWrittenExam: (id: string, data: Partial<WrittenExam>) => void;
  deleteWrittenExam: (id: string) => void;
  addWrittenExamPreparation: (prep: Omit<WrittenExamPreparation, 'id' | 'createdAt'>) => WrittenExamPreparation;
  updateWrittenExamPreparation: (id: string, data: Partial<WrittenExamPreparation>) => void;
  deleteWrittenExamPreparation: (id: string) => void;

  // Tasks & Materials
  tasks: MaterialTask[];
  addTask: (task: Omit<MaterialTask, 'id' | 'createdAt'>) => MaterialTask;
  updateTask: (id: string, data: Partial<MaterialTask>) => void;
  updateTaskStatus: (id: string, status: MaterialTaskStatus) => void;
  toggleTaskCompletion: (id: string) => void;
  deleteTask: (id: string) => void;

  // Documents & Links
  documents: DocumentItem[];
  addDocument: (doc: Omit<DocumentItem, 'id' | 'createdAt'>) => DocumentItem;
  deleteDocument: (id: string) => void;

  // Packages & Finance
  packages: LessonPackage[];
  transactions: FinancialTransaction[];
  addPackage: (pkg: Omit<LessonPackage, 'id' | 'createdAt'>) => LessonPackage;
  updatePackage: (id: string, data: Partial<LessonPackage>) => void;
  addTransaction: (txn: Omit<FinancialTransaction, 'id' | 'createdAt'>) => FinancialTransaction;
  voidTransaction: (id: string, reason?: string) => void;

  // Notifications
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (notif: Omit<NotificationItem, 'id' | 'createdAt'>) => void;
  deleteNotification: (id: string) => void;
  snoozeNotification: (id: string, minutes: number) => void;
  completeNotification: (id: string) => void;

  // WhatsApp History
  whatsAppLogs: WhatsAppLog[];
  addWhatsAppLog: (log: Omit<WhatsAppLog, 'id'>) => void;
  logWhatsAppMessage: (log: Omit<WhatsAppLog, 'id' | 'sentAt' | 'status'>) => void;

  // Message Templates
  messageTemplates: MessageTemplate[];
  updateMessageTemplate: (id: string, content: string) => void;

  // Modals & Navigation triggers
  activeModal: string | null;
  modalPayload: any;
  openModal: (modalName: string, payload?: any) => void;
  closeModal: () => void;

  // Data Export / Import / Reset
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonStr: string) => boolean;
  resetToSampleData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Aynı ders sonu formunun hızlı çift tıklama ile iki kez işlenmesini senkron olarak engeller.
  const completingLessonIdsRef = useRef<Set<string>>(new Set());
  const initialSessionUser: User | null = null;
  // Authentication & Profile state. Supabase is the source of truth for the session.
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [passwordRecoveryMode, setPasswordRecoveryMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    return params.get('recovery') === '1' || params.get('type') === 'recovery' || hash.get('type') === 'recovery';
  });
  const [cloudReady, setCloudReady] = useState(false);
  const [syncConflict, setSyncConflict] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'syncing' | 'synced' | 'offline' | 'error'>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const cloudSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloudInitTokenRef = useRef(0);
  const lastCloudPayloadRef = useRef('');

  const [teacher, setTeacher] = useState<TeacherProfile>(() =>
    loadScoped(initialSessionUser?.id, 'teacher', INITIAL_TEACHER)
  );

  const [security, setSecurity] = useState<SecuritySettings>(() =>
    loadScoped(initialSessionUser?.id, 'security', INITIAL_SECURITY)
  );

  const [settings, setSettings] = useState<UserSettings>(() =>
    loadScoped(initialSessionUser?.id, 'settings', INITIAL_SETTINGS)
  );

  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => {
    const sec = loadScoped(initialSessionUser?.id, 'security', INITIAL_SECURITY);
    return Boolean(sec.isPinEnabled && sec.pinCode);
  });

  // Main Relational Entities
  const [students, setStudents] = useState<Student[]>(() =>
    loadScoped(initialSessionUser?.id, 'students', INITIAL_STUDENTS)
  );

  const [lessons, setLessons] = useState<Lesson[]>(() =>
    loadScoped(initialSessionUser?.id, 'lessons', INITIAL_LESSONS)
  );

  const [lessonNotes, setLessonNotes] = useState<LessonNote[]>(() =>
    loadScoped(initialSessionUser?.id, 'lesson_notes', INITIAL_LESSON_NOTES)
  );

  const [assignments, setAssignments] = useState<Assignment[]>(() =>
    loadScoped(initialSessionUser?.id, 'assignments', INITIAL_ASSIGNMENTS)
  );

  const [topicProgress, setTopicProgress] = useState<StudentTopicProgress[]>(() =>
    loadScoped(initialSessionUser?.id, 'topic_progress', [])
  );

  const [goals, setGoals] = useState<AcademicGoal[]>(() =>
    loadScoped(initialSessionUser?.id, 'goals', INITIAL_GOALS)
  );

  const [examResults, setExamResults] = useState<ExamResult[]>(() =>
    loadScoped(initialSessionUser?.id, 'exam_results', INITIAL_EXAM_RESULTS)
  );

  const [writtenExams, setWrittenExams] = useState<WrittenExam[]>(() =>
    loadScoped(initialSessionUser?.id, 'written_exams', INITIAL_WRITTEN_EXAMS)
  );

  const [writtenPreparations, setWrittenPreparations] = useState<WrittenExamPreparation[]>(() =>
    loadScoped(initialSessionUser?.id, 'written_preparations', INITIAL_WRITTEN_PREPARATIONS)
  );

  const [tasks, setTasks] = useState<MaterialTask[]>(() =>
    loadScoped(initialSessionUser?.id, 'tasks', INITIAL_TASKS)
  );

  const [documents, setDocuments] = useState<DocumentItem[]>(() =>
    loadScoped(initialSessionUser?.id, 'documents', INITIAL_DOCUMENTS)
  );

  const [packages, setPackages] = useState<LessonPackage[]>(() =>
    loadScoped(initialSessionUser?.id, 'packages', INITIAL_PACKAGES)
  );

  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() =>
    loadScoped(initialSessionUser?.id, 'transactions', INITIAL_TRANSACTIONS)
  );

  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    loadScoped(initialSessionUser?.id, 'notifications', INITIAL_NOTIFICATIONS)
  );

  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>(() =>
    loadScoped(initialSessionUser?.id, 'message_templates', INITIAL_MESSAGE_TEMPLATES)
  );

  const [whatsAppLogs, setWhatsAppLogs] = useState<WhatsAppLog[]>(() =>
    loadScoped(initialSessionUser?.id, 'whatsapp_logs', [])
  );

  // Modal manager
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalPayload, setModalPayload] = useState<any>(null);
  const [toasts, setToasts] = useState<AppToast[]>([]);

  // Live Lesson Stopwatch state
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeLessonStartTime, setActiveLessonStartTime] = useState<number | null>(null);
  const [activeLessonElapsedSeconds, setActiveLessonElapsedSeconds] = useState<number>(0);
  const [isLessonTimerRunning, setIsLessonTimerRunning] = useState<boolean>(false);

  // Account-scoped persistence. Each signed-in account owns an isolated data namespace.
  useEffect(() => saveScoped(user?.id, 'teacher', teacher), [user?.id, teacher]);
  useEffect(() => saveScoped(user?.id, 'security', security), [user?.id, security]);
  useEffect(() => saveScoped(user?.id, 'settings', settings), [user?.id, settings]);
  useEffect(() => saveScoped(user?.id, 'students', students), [user?.id, students]);
  useEffect(() => saveScoped(user?.id, 'lessons', lessons), [user?.id, lessons]);
  useEffect(() => saveScoped(user?.id, 'lesson_notes', lessonNotes), [user?.id, lessonNotes]);
  useEffect(() => saveScoped(user?.id, 'assignments', assignments), [user?.id, assignments]);
  useEffect(() => saveScoped(user?.id, 'topic_progress', topicProgress), [user?.id, topicProgress]);
  useEffect(() => saveScoped(user?.id, 'goals', goals), [user?.id, goals]);
  useEffect(() => saveScoped(user?.id, 'exam_results', examResults), [user?.id, examResults]);
  useEffect(() => saveScoped(user?.id, 'written_exams', writtenExams), [user?.id, writtenExams]);
  useEffect(() => saveScoped(user?.id, 'written_preparations', writtenPreparations), [user?.id, writtenPreparations]);
  useEffect(() => saveScoped(user?.id, 'tasks', tasks), [user?.id, tasks]);
  useEffect(() => saveScoped(user?.id, 'documents', documents), [user?.id, documents]);
  useEffect(() => saveScoped(user?.id, 'packages', packages), [user?.id, packages]);
  useEffect(() => saveScoped(user?.id, 'transactions', transactions), [user?.id, transactions]);
  useEffect(() => saveScoped(user?.id, 'notifications', notifications), [user?.id, notifications]);
  useEffect(() => saveScoped(user?.id, 'message_templates', messageTemplates), [user?.id, messageTemplates]);
  useEffect(() => saveScoped(user?.id, 'whatsapp_logs', whatsAppLogs), [user?.id, whatsAppLogs]);

  // Apply theme and follow OS changes while System mode is active.
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const shouldUseDark = settings.theme === 'dark' || (settings.theme === 'system' && media.matches);
      root.classList.toggle('dark', shouldUseDark);
    };
    apply();
    if (settings.theme === 'system') media.addEventListener?.('change', apply);
    return () => media.removeEventListener?.('change', apply);
  }, [settings.theme]);

  // Optional inactivity lock. It only activates when a valid PIN is configured.
  useEffect(() => {
    if (!user || !security.isPinEnabled || !security.pinCode || security.autoLockTime === 'Kapalı') return;
    const minutesMap: Record<string, number> = { 'Hemen': 0, '1 dakika': 1, '5 dakika': 5, '15 dakika': 15 };
    const minutes = minutesMap[security.autoLockTime] ?? 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const arm = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setIsAppLocked(true), Math.max(minutes * 60_000, 1500));
    };
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'touchstart'];
    events.forEach(event => window.addEventListener(event, arm, { passive: true } as AddEventListenerOptions));
    arm();
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach(event => window.removeEventListener(event, arm));
    };
  }, [user, security.isPinEnabled, security.pinCode, security.autoLockTime]);

  // Keep high-value operational alerts in sync with the actual data.
  // Auto alerts use stable IDs so repeated renders do not create duplicate notifications.
  useEffect(() => {
    if (!settings.enableNotifications) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateOnly = (value: string) => {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, (m || 1) - 1, d || 1);
    };
    const dayDiff = (value: string) => Math.ceil((dateOnly(value).getTime() - today.getTime()) / 86400000);
    const auto: NotificationItem[] = [];
    const mk = (id: string, data: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>) => {
      auto.push({ id, createdAt: new Date().toISOString(), isRead: false, ...data });
    };

    lessons.forEach((lesson) => {
      const diff = dayDiff(lesson.date);
      if (diff >= 0 && diff <= 1 && ['Planlandı', 'Yaklaşıyor'].includes(lesson.status)) {
        const st = students.find((x) => x.id === lesson.studentId);
        mk(`auto-lesson-${lesson.id}`, {
          title: diff === 0 ? 'Bugünkü Ders' : 'Yarın Ders Var',
          message: `${st ? `${st.firstName} ${st.lastName}` : 'Öğrenci'} • ${lesson.startTime} • ${lesson.duration} dk`,
          type: 'Yaklaşan Ders', date: lesson.date, relatedEntityId: lesson.id, relatedStudentId: lesson.studentId, linkTab: 'calendar'
        });
      }
    });

    assignments.forEach((a) => {
      const diff = dayDiff(a.dueDate);
      if (diff < 0 && !['Tamamlandı', 'Kontrol Edildi'].includes(a.status)) {
        const st = students.find((x) => x.id === a.studentId);
        mk(`auto-assignment-${a.id}`, {
          title: 'Geciken Ödev', message: `${st ? `${st.firstName} ${st.lastName}` : 'Öğrenci'} • ${Math.abs(diff)} gün gecikti`,
          type: 'Ödev Kontrolü', date: a.dueDate, relatedEntityId: a.id, relatedStudentId: a.studentId, linkTab: 'assignments'
        });
      }
    });

    writtenExams.forEach((w) => {
      const diff = dayDiff(w.date);
      if (diff >= 0 && diff <= 7) {
        const st = students.find((x) => x.id === w.studentId);
        mk(`auto-written-${w.id}`, {
          title: `Yazılıya ${diff === 0 ? 'Bugün' : `${diff} Gün`} Kaldı`,
          message: `${st ? `${st.firstName} ${st.lastName}` : 'Öğrenci'} • ${w.examName} • Hazırlık %${w.preparationPercentage}`,
          type: 'Yaklaşan Yazılı', date: w.date, relatedEntityId: w.id, relatedStudentId: w.studentId, linkTab: 'written-exams'
        });
      }
    });

    tasks.forEach((t) => {
      if (!t.dueDate || t.status === 'Kullanıldı') return;
      const diff = dayDiff(t.dueDate);
      if (diff >= 0 && diff <= 3) {
        mk(`auto-task-${t.id}`, {
          title: diff === 0 ? 'Bugün Hazırlanacak Materyal' : 'Yaklaşan Materyal Görevi',
          message: `${t.title}${diff > 0 ? ` • ${diff} gün kaldı` : ''}`,
          type: 'Hazırlanacak Materyal', date: t.dueDate, relatedEntityId: t.id, relatedStudentId: t.studentId, linkTab: 'tasks'
        });
      }
    });

    packages.filter((p) => p.status === 'Aktif' && p.remainingLessons <= 2).forEach((p) => {
      const st = students.find((x) => x.id === p.studentId);
      mk(`auto-package-${p.id}-${p.remainingLessons}`, {
        title: p.remainingLessons <= 0 ? 'Ders Paketi Bitti' : 'Ders Paketi Azaldı',
        message: `${st ? `${st.firstName} ${st.lastName}` : 'Öğrenci'} • ${Math.max(0, p.remainingLessons)} ders kaldı`,
        type: 'Paket Bitişi', date: toLocalDateInputValue(), relatedEntityId: p.id, relatedStudentId: p.studentId, linkTab: 'finance'
      });
    });

    setNotifications((prev) => {
      const manual = prev.filter((n) => !n.id.startsWith('auto-'));
      const oldAuto = new Map<string, NotificationItem>(prev.filter((n) => n.id.startsWith('auto-')).map((n) => [n.id, n]));
      const mergedAuto = auto.map((n) => {
        const old = oldAuto.get(n.id);
        return old ? { ...n, isRead: old.isRead, isCompleted: old.isCompleted, snoozedUntil: old.snoozedUntil, createdAt: old.createdAt } : n;
      });
      return [...mergedAuto, ...manual];
    });
  }, [lessons, assignments, writtenExams, tasks, packages, students, settings.enableNotifications]);

  // Live timer interval
  useEffect(() => {
    let interval: any = null;
    if (isLessonTimerRunning) {
      interval = setInterval(() => {
        setActiveLessonElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLessonTimerRunning]);

  const dismissToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));
  const pushToast = (toast: Omit<AppToast, 'id'>) => {
    const id = createEntityId('toast');
    setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
    window.setTimeout(() => dismissToast(id), toast.type === 'error' ? 6500 : 4200);
  };

  // Modal helpers
  const openModal = (modalName: string, payload: any = null) => {
    setActiveModal(modalName);
    setModalPayload(payload);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalPayload(null);
  };

  const hydrateAccountData = (userId: string, useSampleFallback = false) => {
    const arrayFallback = <T,>(sample: T[]): T[] => useSampleFallback ? sample : [];
    setTeacher(loadScoped(userId, 'teacher', { ...INITIAL_TEACHER, userId }));
    setSecurity(loadScoped(userId, 'security', INITIAL_SECURITY));
    setSettings(loadScoped(userId, 'settings', INITIAL_SETTINGS));
    setStudents(loadScoped(userId, 'students', arrayFallback(INITIAL_STUDENTS)));
    setLessons(loadScoped(userId, 'lessons', arrayFallback(INITIAL_LESSONS)));
    setLessonNotes(loadScoped(userId, 'lesson_notes', arrayFallback(INITIAL_LESSON_NOTES)));
    setAssignments(loadScoped(userId, 'assignments', arrayFallback(INITIAL_ASSIGNMENTS)));
    setTopicProgress(loadScoped(userId, 'topic_progress', []));
    setGoals(loadScoped(userId, 'goals', arrayFallback(INITIAL_GOALS)));
    setExamResults(loadScoped(userId, 'exam_results', arrayFallback(INITIAL_EXAM_RESULTS)));
    setWrittenExams(loadScoped(userId, 'written_exams', arrayFallback(INITIAL_WRITTEN_EXAMS)));
    setWrittenPreparations(loadScoped(userId, 'written_preparations', arrayFallback(INITIAL_WRITTEN_PREPARATIONS)));
    setTasks(loadScoped(userId, 'tasks', arrayFallback(INITIAL_TASKS)));
    setDocuments(loadScoped(userId, 'documents', arrayFallback(INITIAL_DOCUMENTS)));
    setPackages(loadScoped(userId, 'packages', arrayFallback(INITIAL_PACKAGES)));
    setTransactions(loadScoped(userId, 'transactions', arrayFallback(INITIAL_TRANSACTIONS)));
    setNotifications(loadScoped(userId, 'notifications', arrayFallback(INITIAL_NOTIFICATIONS)));
    setMessageTemplates(loadScoped(userId, 'message_templates', INITIAL_MESSAGE_TEMPLATES));
    setWhatsAppLogs(loadScoped(userId, 'whatsapp_logs', []));
  };

  const applyDatabasePayload = (data: Record<string, any>, currentUser: User) => {
    if (!data || typeof data !== 'object') return;
    if (data.teacher) setTeacher({ ...data.teacher, userId: currentUser.id, email: currentUser.email });
    if (Array.isArray(data.students)) setStudents(data.students);
    if (Array.isArray(data.lessons)) setLessons(data.lessons);
    if (Array.isArray(data.lessonNotes)) setLessonNotes(data.lessonNotes);
    if (Array.isArray(data.assignments)) setAssignments(data.assignments);
    if (Array.isArray(data.topicProgress)) setTopicProgress(data.topicProgress);
    if (Array.isArray(data.goals)) setGoals(data.goals);
    if (Array.isArray(data.examResults)) setExamResults(data.examResults);
    if (Array.isArray(data.writtenExams)) setWrittenExams(data.writtenExams);
    if (Array.isArray(data.writtenPreparations)) setWrittenPreparations(data.writtenPreparations);
    if (Array.isArray(data.tasks)) setTasks(data.tasks);
    if (Array.isArray(data.documents)) setDocuments(data.documents);
    if (Array.isArray(data.packages)) setPackages(data.packages);
    if (Array.isArray(data.transactions)) setTransactions(data.transactions);
    if (Array.isArray(data.notifications)) setNotifications(data.notifications);
    if (Array.isArray(data.messageTemplates)) setMessageTemplates(data.messageTemplates);
    if (Array.isArray(data.whatsAppLogs)) setWhatsAppLogs(data.whatsAppLogs);
    if (data.settings) setSettings({ ...INITIAL_SETTINGS, ...data.settings });
    // PIN ve biyometri cihaz bazlı kalır; bulut verisi yerel PIN'i değiştirmez.
    if (data.security) setSecurity((current) => ({ ...INITIAL_SECURITY, ...data.security, pinCode: current.pinCode }));
  };

  const initializeCloudState = async (nextUser: User) => {
    const token = ++cloudInitTokenRef.current;
    setCloudReady(false);
    setSyncStatus(navigator.onLine ? 'loading' : 'offline');
    if (!navigator.onLine) {
      setCloudReady(true);
      return;
    }
    try {
      const row = await loadCloudState<Record<string, any>>(nextUser.id);
      if (token !== cloudInitTokenRef.current) return;
      if (row?.data && Object.keys(row.data).length > 0) {
        lastCloudPayloadRef.current = JSON.stringify(row.data);
        applyDatabasePayload(row.data, nextUser);
        setLastSyncedAt(row.updated_at);
      }
      setCloudReady(true);
      setSyncStatus(row ? 'synced' : 'idle');
    } catch (error: any) {
      console.error('Bulut verisi yüklenemedi:', error?.message || error);
      if (token === cloudInitTokenRef.current) {
        setCloudReady(true);
        setSyncStatus('error');
      }
    }
  };

  // Auth actions - Supabase Auth is the source of truth.
  const mapSupabaseUser = (authUser: any): User => ({
    id: authUser.id,
    email: authUser.email || '',
    isEmailVerified: Boolean(authUser.email_confirmed_at),
    createdAt: authUser.created_at || new Date().toISOString(),
  });

  useEffect(() => {
    let mounted = true;

    const applySession = (authUser: any | null) => {
      if (!mounted) return;
      if (!authUser) {
        cloudInitTokenRef.current += 1;
        setUser(null);
        setCloudReady(false);
        setSyncStatus('idle');
        setLastSyncedAt(null);
        lastCloudPayloadRef.current = '';
        setIsAppLocked(false);
        return;
      }
      const nextUser = mapSupabaseUser(authUser);
      const hadData = hasScopedData(nextUser.id);
      setUser(nextUser);
      hydrateAccountData(nextUser.id, false);
      const sec = loadScoped(nextUser.id, 'security', INITIAL_SECURITY);
      setIsAppLocked(Boolean(sec.isPinEnabled && sec.pinCode));

      // First verified login: seed teacher identity from signup metadata without demo data.
      if (!hadData) {
        const fullName = String(authUser.user_metadata?.full_name || '').trim();
        const parts = fullName.split(/\s+/).filter(Boolean);
        setTeacher({
          ...INITIAL_TEACHER,
          userId: nextUser.id,
          firstName: parts[0] || 'Öğretmen',
          lastName: parts.slice(1).join(' '),
          email: nextUser.email,
          messageSignature: `Matematik Öğretmeni\n${fullName || 'Öğretmen'}\nbymatematik\n@bymatematiik`,
        });
      }
      void initializeCloudState(nextUser);
    };

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error('Supabase oturum kontrolü başarısız:', error.message);
      applySession(data.session?.user ?? null);
      if (mounted) setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && mounted) setPasswordRecoveryMode(true);
      applySession(session?.user ?? null);
      if (mounted) setAuthReady(true);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const loginUser = async (email: string, pass: string): Promise<boolean> => {
    if (!isSupabaseConfigured) {
      pushToast({ type: 'error', title: 'Supabase yapılandırması eksik', message: '.env.local dosyasını kontrol edin.' });
      return false;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
    if (error) {
      pushToast({ type: 'error', title: 'Giriş yapılamadı', message: error.message });
      return false;
    }
    return true;
  };

  const registerUser = async (email: string, pass: string, name: string): Promise<boolean> => {
    if (!isSupabaseConfigured || !email.trim() || pass.length < 6 || !name.trim()) return false;
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: pass,
      options: {
        data: { full_name: name.trim() },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      pushToast({ type: 'error', title: 'Hesap oluşturulamadı', message: error.message });
      return false;
    }
    if (!data.session) {
      pushToast({ type: 'success', title: 'Doğrulama e-postası gönderildi', message: 'E-postandaki bağlantıya tıklayıp hesabını doğruladıktan sonra giriş yapabilirsin.' });
    }
    return true;
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    if (!isSupabaseConfigured || !email.trim()) return false;
    const recoveryRedirect = `${window.location.origin}/?recovery=1`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: recoveryRedirect });
    if (error) {
      pushToast({ type: 'error', title: 'Sıfırlama e-postası gönderilemedi', message: error.message });
      return false;
    }
    pushToast({ type: 'success', title: 'Şifre sıfırlama bağlantısı gönderildi', message: 'E-posta kutunu kontrol et.' });
    return true;
  };

  const updatePassword = async (password: string): Promise<boolean> => {
    if (password.length < 6) return false;
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { pushToast({ type: 'error', title: 'Şifre güncellenemedi', message: error.message }); return false; }
    setPasswordRecoveryMode(false);
    if (window.location.search.includes('recovery=1') || window.location.hash.includes('type=recovery')) {
      window.history.replaceState({}, document.title, window.location.origin + window.location.pathname);
    }
    pushToast({ type: 'success', title: 'Şifre güncellendi', message: 'Yeni şifreniz kullanıma hazır.' });
    return true;
  };


  const resolveSyncConflict = async (strategy: 'cloud' | 'local'): Promise<boolean> => {
    if (!user) return false;
    try {
      setSyncStatus('syncing');
      if (strategy === 'cloud') {
        const row = await loadCloudState<Record<string, any>>(user.id);
        if (!row?.data) {
          setSyncStatus('error');
          return false;
        }
        const serialized = JSON.stringify(row.data);
        lastCloudPayloadRef.current = serialized;
        applyDatabasePayload(row.data, user);
        setLastSyncedAt(row.updated_at);
        setSyncConflict(false);
        setSyncStatus('synced');
        pushToast({
          type: 'success',
          title: 'Bulut sürümü yüklendi',
          message: 'Bu cihaz buluttaki en güncel veriye eşitlendi.',
        });
        return true;
      }

      // Kullanıcı özellikle bu cihazdaki veriyi seçtiğinde, en güncel bulut
      // zaman damgasını alıp kontrollü olarak üzerine yazarız.
      const latest = await loadCloudState<Record<string, any>>(user.id);
      const payload = getDatabasePayload();
      const serialized = JSON.stringify(payload);
      const row = await saveCloudState(user.id, payload, latest?.updated_at ?? null);
      lastCloudPayloadRef.current = serialized;
      setLastSyncedAt(row.updated_at);
      setSyncConflict(false);
      setSyncStatus('synced');
      pushToast({
        type: 'success',
        title: 'Bu cihazın sürümü kullanıldı',
        message: 'Bu cihazdaki veriler buluta kaydedildi.',
      });
      return true;
    } catch (error: any) {
      console.error('Çakışma çözümü başarısız:', error?.message || error);
      setSyncStatus('error');
      pushToast({
        type: 'error',
        title: 'Çakışma çözülemedi',
        message: 'İnternet bağlantısını kontrol edip tekrar deneyin.',
      });
      return false;
    }
  };

  const logoutUser = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAppLocked(false);
    closeModal();
  };

  const updateTeacherProfile = (profile: Partial<TeacherProfile>) => {
    setTeacher((prev) => {
      const next = { ...prev, ...profile };
      const instagram = next.instagramHandle || next.instagram || '';
      return {
        ...next,
        instagram: instagram,
        instagramHandle: instagram,
        messageSignature: `Matematik Öğretmeni\n${next.firstName} ${next.lastName}`.trimEnd() + `\n${next.brandName || 'bymatematik'}${instagram ? `\n${instagram}` : ''}`,
      };
    });
  };

  const updateSecuritySettings = (sec: Partial<SecuritySettings>) => {
    setSecurity((prev) => ({ ...prev, ...sec }));
  };

  const updateUserSettings = (st: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...st }));
  };

  const unlockAppWithPin = (pin: string): boolean => {
    if (!security.isPinEnabled || !security.pinCode || security.pinCode === pin) {
      setIsAppLocked(false);
      return true;
    }
    return false;
  };

  const lockAppNow = () => {
    if (security.isPinEnabled && security.pinCode) {
      setIsAppLocked(true);
    }
  };

  // Student Actions
  const addStudent = (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'isArchived'>): Student => {
    if (!data.firstName.trim() || !data.lastName.trim()) throw new Error('Öğrenci adı ve soyadı zorunludur.');
    if (!Number.isFinite(data.lessonFee) || data.lessonFee < 0) throw new Error('Ders ücreti geçersiz.');
    if (!Number.isFinite(data.lessonDuration) || data.lessonDuration <= 0) throw new Error('Ders süresi geçersiz.');
    const newStudent: Student = {
      ...data,
      id: createEntityId('std'),
      isArchived: false,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      avatarColor: data.avatarColor || 'from-indigo-500 to-blue-600',
    };
    setStudents((prev) => [newStudent, ...prev]);

    // Create a welcome notification
    addNotification({
      title: `Yeni Öğrenci Eklendi: ${newStudent.firstName} ${newStudent.lastName}`,
      message: `${newStudent.gradeLevel} ${newStudent.targetExam || ''} öğrencisi sisteme kaydedildi.`,
      type: 'Sistem Uyarısı',
      date: toLocalDateInputValue(),
      isRead: false,
      relatedStudentId: newStudent.id,
      linkTab: 'students',
    });

    pushToast({ type: 'success', title: 'Öğrenci kaydedildi', message: `${newStudent.firstName} ${newStudent.lastName} başarıyla eklendi.` });
    return newStudent;
  };

  const updateStudent = (id: string, data: Partial<Student>) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString().split('T')[0] } : s))
    );
  };

  const archiveStudent = (id: string) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, isArchived: true } : s)));
  };

  const restoreStudent = (id: string) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, isArchived: false } : s)));
  };

  const deleteStudentPermanent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  // Lesson conflict checking
  const checkConflict = (date: string, startTime: string, duration: number, excludeLessonId?: string): Lesson | null => {
    const activeLessons = lessons.filter(
      (l) => l.status !== 'İptal Edildi' && l.status !== 'Öğretmen İptal Etti' && l.status !== 'Ertelendi'
    );
    for (const l of activeLessons) {
      if (excludeLessonId && l.id === excludeLessonId) continue;
      if (checkTimesOverlap(date, startTime, duration, l.date, l.startTime, l.duration)) {
        return l;
      }
    }
    return null;
  };

  // Lesson Actions
  const addLesson = (
    data: Omit<Lesson, 'id' | 'createdAt'>
  ): { lesson?: Lesson; conflictWarning?: string } => {
    if (!data.studentId || !data.date || !data.startTime) return { conflictWarning: 'Öğrenci, tarih ve başlangıç saati zorunludur.' };
    if (!Number.isFinite(data.duration) || data.duration <= 0) return { conflictWarning: 'Ders süresi geçersiz.' };
    const exactDuplicate = lessons.find((l) => l.studentId === data.studentId && l.date === data.date && l.startTime === data.startTime && !['İptal Edildi','Öğretmen İptal Etti','Ertelendi'].includes(l.status));
    if (exactDuplicate) return { conflictWarning: 'Bu öğrenci için aynı tarih ve saatte zaten bir ders kaydı bulunuyor.' };
    const conflict = checkConflict(data.date, data.startTime, data.duration);
    let conflictWarning: string | undefined;

    if (conflict) {
      const conflictingStudent = students.find((s) => s.id === conflict.studentId);
      conflictWarning = `Bu saat aralığında başka bir ders bulunmaktadır (${conflictingStudent ? `${conflictingStudent.firstName} ${conflictingStudent.lastName}` : 'Ders'} - ${conflict.startTime}, ${conflict.duration} dk).`;
    }

    const newLesson: Lesson = {
      ...data,
      id: createEntityId('les'),
      createdAt: new Date().toISOString().split('T')[0],
    };

    setLessons((prev) => [newLesson, ...prev]);

    // Create notification for upcoming lesson
    const student = students.find((s) => s.id === data.studentId);
    if (student) {
      addNotification({
        title: `Ders Planlandı: ${student.firstName} ${student.lastName}`,
        message: `${data.date} saat ${data.startTime}'de ${data.duration} dk ${data.topic || 'Matematik'} dersi planlandı.`,
        type: 'Yaklaşan Ders',
        date: data.date,
        isRead: false,
        relatedStudentId: student.id,
        relatedEntityId: newLesson.id,
        linkTab: 'calendar',
      });
    }

    pushToast({ type: conflictWarning ? 'warning' : 'success', title: conflictWarning ? 'Ders çakışması uyarısı' : 'Ders planlandı', message: conflictWarning || `${data.date} ${data.startTime} için ders eklendi.` });
    return { lesson: newLesson, conflictWarning };
  };

  const updateLesson = (id: string, data: Partial<Lesson>) => {
    setLessons((prev) => prev.map((l) => (l.id === id ? { ...l, ...data } : l)));
  };

  const cancelLesson = (id: string, reason: string = '', byTeacher: boolean = false) => {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              status: byTeacher ? 'Öğretmen İptal Etti' : 'İptal Edildi',
              cancellationReason: reason,
            }
          : l
      )
    );
  };

  const rescheduleLesson = (
    lessonId: string,
    newDate: string,
    newStartTime: string,
    reason: string = ''
  ): Lesson => {
    const original = lessons.find((l) => l.id === lessonId);
    if (!original) throw new Error('Lesson not found');

    const newLessonId = createEntityId('les');
    const rescheduledLesson: Lesson = {
      ...original,
      id: newLessonId,
      date: newDate,
      startTime: newStartTime,
      status: 'Planlandı',
      rescheduledFromLessonId: lessonId,
      notes: reason ? `Ertelenen ders (${original.date} ${original.startTime}): ${reason}` : original.notes,
      createdAt: new Date().toISOString().split('T')[0],
    };

    // Update old lesson to 'Ertelendi' with pointer to new lesson
    setLessons((prev) => [
      rescheduledLesson,
      ...prev.map((l) =>
        l.id === lessonId
          ? {
              ...l,
              status: 'Ertelendi' as const,
              rescheduledToLessonId: newLessonId,
              cancellationReason: reason || 'Yeni tarihe ertelendi',
            }
          : l
      ),
    ]);

    return rescheduledLesson;
  };

  // Atomic Lesson Completion Flow
  const completeLesson = (lessonId: string, summary: LessonCompletionData) => {
    const targetLesson = lessons.find((l) => l.id === lessonId);
    if (!targetLesson) return;
    // React state güncellenmeden önce oluşabilecek hızlı çift gönderimleri de engelle.
    if (targetLesson.status === 'Tamamlandı' || completingLessonIdsRef.current.has(lessonId)) {
      pushToast({ type: 'warning', title: 'Ders zaten işlendi', message: 'Bu ders için ikinci kez finans/paket kaydı oluşturulmadı.' });
      return;
    }

    const student = students.find((s) => s.id === targetLesson.studentId);
    if (!student) return;
    completingLessonIdsRef.current.add(lessonId);

    const completedTimestamp = new Date().toISOString();
    const actualMins = summary.actualDuration || targetLesson.duration || 60;

    // 1. Create LessonNote
    const newNoteId = createEntityId('note');
    const newNote: LessonNote = {
      id: newNoteId,
      lessonId: targetLesson.id,
      studentId: student.id,
      topic: summary.topic,
      subtopic: summary.subtopic,
      learningOutcome: summary.learningOutcome,
      usedResources: summary.usedResources,
      solvedQuestionsCount: summary.solvedQuestionsCount,
      participationRating: summary.participationRating,
      topicMasteryRating: summary.topicMasteryRating,
      problemSolvingRating: summary.problemSolvingRating,
      difficultAreas: summary.difficultAreas,
      teacherNote: summary.teacherNote,
      nextLessonPlan: summary.nextLessonPlan,
      createdAt: completedTimestamp,
    };
    setLessonNotes((prev) => [newNote, ...prev]);

    // 2. Update Lesson record to 'Tamamlandı'
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lessonId
          ? {
              ...l,
              status: 'Tamamlandı' as const,
              actualDuration: actualMins,
              topic: summary.topic,
              subtopic: summary.subtopic,
              lessonNoteId: newNoteId,
              completedAt: completedTimestamp,
            }
          : l
      )
    );

    // 3. Package Management: If student has active package, decrement used/remaining
    let pkg = packages.find((p) => p.studentId === student.id && p.status === 'Aktif');
    if (pkg && summary.isBillable) {
      const updatedUsed = pkg.usedLessons + 1;
      const updatedRemaining = Math.max(0, pkg.totalLessons - updatedUsed);
      const isCompleted = updatedRemaining === 0;

      setPackages((prev) =>
        prev.map((p) =>
          p.id === pkg!.id
            ? {
                ...p,
                usedLessons: updatedUsed,
                remainingLessons: updatedRemaining,
                status: isCompleted ? 'Tamamlandı' : 'Aktif',
              }
            : p
        )
      );

      // Trigger low-balance warning if 1 or 2 left
      if (updatedRemaining > 0 && updatedRemaining <= 2) {
        addNotification({
          title: `Paket Uyarısı: ${student.firstName} ${student.lastName}`,
          message: `${pkg.packageName} paketinde sadece ${updatedRemaining} ders kaldı! Veli ile yenileme görüşmesi yapabilirsiniz.`,
          type: 'Paket Bitişi',
          date: toLocalDateInputValue(),
          isRead: false,
          relatedStudentId: student.id,
          relatedEntityId: pkg.id,
          linkTab: 'finance',
        });
      }
    } else if (summary.isBillable) {
      // 4. Financial Transaction: Add standard lesson fee charge
      const baseFee = targetLesson.fee || student.lessonFee || teacher.defaultHourlyRate;
      const fee = student.feeType === 'Saatlik'
        ? Math.round((baseFee * actualMins) / 60 * 100) / 100
        : baseFee;
      const newTxn: FinancialTransaction = {
        id: createEntityId('txn'),
        studentId: student.id,
        type: 'Ders Ücreti',
        amount: fee,
        date: targetLesson.date,
        lessonId: targetLesson.id,
        description: `${summary.topic || 'Matematik'} Özel Dersi (${actualMins} dk)`,
        createdAt: completedTimestamp,
      };
      setTransactions((prev) => [newTxn, ...prev]);
    }

    // 5. Update Topic Progress
    if (summary.topic) {
      const matchedTopic = findCurriculumTopicForLesson(summary.topic, summary.subtopic, student);
      updateStudentTopicProgress(
        student.id,
        matchedTopic?.id || `custom-${normalizeCurriculumText(summary.topic).replace(/\s+/g, '-')}`,
        matchedTopic?.title || summary.topic,
        'İşleniyor',
        summary.solvedQuestionsCount,
        summary.topicMasteryRating * 20,
        summary.teacherNote
      );
    }

    // 6. Optional: Create homework if provided in form
    if (summary.giveHomework && summary.homeworkTitle) {
      const newAssignment: Assignment = {
        id: createEntityId('asn'),
        studentId: student.id,
        lessonId: targetLesson.id,
        topic: summary.homeworkTitle,
        resourceName: summary.homeworkResource || 'Soru Bankası / Föy',
        pages: summary.homeworkPage || '',
        questionNumbers: summary.homeworkQuestions || '',
        description: summary.homeworkDescription || '',
        assignedDate: targetLesson.date,
        dueDate: summary.homeworkDueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        priority: 'Normal',
        status: 'Bekliyor',
        createdAt: completedTimestamp,
      };
      setAssignments((prev) => [newAssignment, ...prev]);

      addNotification({
        title: `Yeni Ödev Verildi: ${student.firstName}`,
        message: `${summary.homeworkTitle} ödevi ${newAssignment.dueDate} teslim tarihiyle tanımlandı.`,
        type: 'Ödev Kontrolü',
        date: targetLesson.date,
        isRead: false,
        relatedStudentId: student.id,
        relatedEntityId: newAssignment.id,
        linkTab: 'assignments',
      });
    }

    // 7. Reset live timer if running for this lesson
    if (activeLessonId === lessonId) {
      setActiveLessonId(null);
      setActiveLessonStartTime(null);
      setActiveLessonElapsedSeconds(0);
      setIsLessonTimerRunning(false);
    }

    // 8. Open ready-to-send WhatsApp summary popup for the parent
    openModal('whatsapp', {
      templateType: 'lesson_report',
      type: 'Ders Sonu Bilgilendirme',
      student,
      lesson: targetLesson,
      summary,
    });
  };

  const deleteLesson = (id: string) => {
    setLessons((prev) => prev.filter((l) => l.id !== id));
  };

  // Live Lesson Stopwatch
  const startLiveLesson = (lessonId: string) => {
    setActiveLessonId(lessonId);
    setActiveLessonStartTime(Date.now());
    setActiveLessonElapsedSeconds(0);
    setIsLessonTimerRunning(true);

    // Update lesson status to 'Başladı'
    setLessons((prev) =>
      prev.map((l) => (l.id === lessonId ? { ...l, status: 'Başladı' as const, startedAt: new Date().toISOString() } : l))
    );
  };

  const pauseLiveLesson = () => setIsLessonTimerRunning(false);
  const resumeLiveLesson = () => setIsLessonTimerRunning(true);

  const stopAndOpenCompletionModal = () => {
    setIsLessonTimerRunning(false);
    if (activeLessonId) {
      const lesson = lessons.find((l) => l.id === activeLessonId);
      const student = lesson ? students.find((s) => s.id === lesson.studentId) : null;
      openModal('completeLesson', {
        lesson,
        student,
        actualElapsedMinutes: Math.max(1, Math.round(activeLessonElapsedSeconds / 60)),
      });
    }
  };

  const cancelLiveLesson = () => {
    if (activeLessonId) {
      setLessons((prev) =>
        prev.map((l) => (l.id === activeLessonId ? { ...l, status: 'Planlandı' as const } : l))
      );
    }
    setActiveLessonId(null);
    setActiveLessonStartTime(null);
    setActiveLessonElapsedSeconds(0);
    setIsLessonTimerRunning(false);
  };

  // Assignment Actions
  const addAssignment = (data: Omit<Assignment, 'id' | 'createdAt'>): Assignment => {
    const newAsn: Assignment = {
      ...data,
      id: createEntityId('asn'),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setAssignments((prev) => [newAsn, ...prev]);
    return newAsn;
  };

  const updateAssignment = (id: string, data: Partial<Assignment>) => {
    setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
  };

  const updateAssignmentStatus = (id: string, status: AssignmentStatus, feedback?: string) => {
    setAssignments((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const now = new Date().toISOString().split('T')[0];
        return {
          ...a,
          status,
          teacherFeedback: feedback !== undefined ? feedback : a.teacherFeedback,
          completedDate: status === 'Tamamlandı' || status === 'Kontrol Edildi' ? now : a.completedDate,
          checkedDate: status === 'Kontrol Edildi' ? now : a.checkedDate,
        };
      })
    );
  };

  const deleteAssignment = (id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  };

  // Student Topic Progress
  const updateStudentTopicProgress = (
    studentId: string,
    topicId: string,
    topicTitle: string,
    status: TopicStatus,
    questionsAdd: number = 0,
    mastery?: number,
    notes?: string
  ) => {
    setTopicProgress((prev) => {
      const existing = prev.find((p) => p.studentId === studentId && (p.topicId === topicId || p.topicTitle === topicTitle));
      const now = new Date().toISOString().split('T')[0];

      if (existing) {
        return prev.map((p) =>
          p.id === existing.id
            ? {
                ...p,
                status,
                lastReviewedDate: now,
                totalQuestionsSolved: p.totalQuestionsSolved + questionsAdd,
                masteryPercentage: mastery !== undefined ? mastery : p.masteryPercentage,
                notes: notes || p.notes,
                updatedAt: now,
              }
            : p
        );
      } else {
        const newRecord: StudentTopicProgress = {
          id: createEntityId('stp'),
          studentId,
          topicId,
          topicTitle,
          status,
          firstTaughtDate: now,
          lastReviewedDate: now,
          totalQuestionsSolved: questionsAdd,
          masteryPercentage: mastery !== undefined ? mastery : 60,
          notes,
          updatedAt: now,
        };
        return [...prev, newRecord];
      }
    });
  };

  const toggleCurriculumOutcome = (studentId: string, topicId: string, topicTitle: string) => {
    const current = topicProgress.find((p) => p.studentId === studentId && p.topicId === topicId);
    updateStudentTopicProgress(studentId, topicId, topicTitle, current?.status === 'Tamamlandı' ? 'Başlanmadı' : 'Tamamlandı');
  };

  // Academic Goal Actions
  const addGoal = (data: Omit<AcademicGoal, 'id' | 'createdAt' | 'updatedAt'>): AcademicGoal => {
    const now = toLocalDateInputValue();
    const goal: AcademicGoal = { ...data, id: createEntityId('goal'), createdAt: now, updatedAt: now };
    setGoals((prev) => [goal, ...prev]);
    return goal;
  };

  const updateGoal = (id: string, data: Partial<AcademicGoal>) => {
    setGoals((prev) => prev.map((g) => g.id === id ? { ...g, ...data, updatedAt: toLocalDateInputValue() } : g));
  };

  const deleteGoal = (id: string) => setGoals((prev) => prev.filter((g) => g.id !== id));
  const updateGoalStatus = (id: string, status: GoalStatus) => updateGoal(id, { status });

  // Exam Result Actions
  const addExamResult = (data: Omit<ExamResult, 'id' | 'createdAt'>): ExamResult => {
    const newExam: ExamResult = {
      ...data,
      id: createEntityId('ex'),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setExamResults((prev) => [newExam, ...prev]);

    // Send notification
    const student = students.find((s) => s.id === data.studentId);
    if (student) {
      addNotification({
        title: `Deneme Sonucu Girildi: ${student.firstName}`,
        message: `${data.examName} (${data.examType}): ${data.netScore} Net (${data.correctCount}D ${data.wrongCount}Y ${data.emptyCount}B).`,
        type: 'Yaklaşan Sınav',
        date: data.date,
        isRead: false,
        relatedStudentId: student.id,
        relatedEntityId: newExam.id,
        linkTab: 'exams',
      });
    }

    return newExam;
  };

  const deleteExamResult = (id: string) => {
    setExamResults((prev) => prev.filter((e) => e.id !== id));
  };

  // Written Exams Actions
  const addWrittenExam = (data: Omit<WrittenExam, 'id' | 'createdAt'>): WrittenExam => {
    const newWex: WrittenExam = {
      ...data,
      id: createEntityId('wex'),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setWrittenExams((prev) => [newWex, ...prev]);

    // Add alert notification
    const student = students.find((s) => s.id === data.studentId);
    if (student) {
      addNotification({
        title: `Yaklaşan Yazılı: ${student.firstName} ${student.lastName}`,
        message: `${data.examName} sınav tarihi: ${data.date}. Hedef Not: ${data.targetGrade}`,
        type: 'Yaklaşan Yazılı',
        date: data.date,
        isRead: false,
        relatedStudentId: student.id,
        relatedEntityId: newWex.id,
        linkTab: 'written-exams',
      });
    }

    return newWex;
  };

  const updateWrittenExam = (id: string, data: Partial<WrittenExam>) => {
    setWrittenExams((prev) => prev.map((w) => (w.id === id ? { ...w, ...data } : w)));
  };

  const deleteWrittenExam = (id: string) => {
    setWrittenExams((prev) => prev.filter((w) => w.id !== id));
  };

  const addWrittenExamPreparation = (
    data: Omit<WrittenExamPreparation, 'id' | 'createdAt'>
  ): WrittenExamPreparation => {
    const newPrep: WrittenExamPreparation = {
      ...data,
      id: createEntityId('wprep'),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setWrittenPreparations((prev) => [newPrep, ...prev]);
    return newPrep;
  };

  const updateWrittenExamPreparation = (id: string, data: Partial<WrittenExamPreparation>) => {
    setWrittenPreparations((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  };

  const deleteWrittenExamPreparation = (id: string) => {
    setWrittenPreparations((prev) => prev.filter((p) => p.id !== id));
  };

  // Material Tasks
  const addTask = (data: Omit<MaterialTask, 'id' | 'createdAt'>): MaterialTask => {
    const newTask: MaterialTask = {
      ...data,
      id: createEntityId('task'),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  };

  const updateTask = (id: string, data: Partial<MaterialTask>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
  };

  const updateTaskStatus = (id: string, status: MaterialTaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const toggleTaskCompletion = (id: string) => {
    setTasks((prev) => prev.map((t) =>
      t.id === id ? { ...t, status: t.status === 'Kullanıldı' ? 'Yapılacak' : 'Kullanıldı' } : t
    ));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Documents
  const addDocument = (data: Omit<DocumentItem, 'id' | 'createdAt'>): DocumentItem => {
    const newDoc: DocumentItem = {
      ...data,
      id: createEntityId('doc'),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setDocuments((prev) => [newDoc, ...prev]);
    return newDoc;
  };

  const deleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  // Packages & Transactions
  const addPackage = (data: Omit<LessonPackage, 'id' | 'createdAt'>): LessonPackage => {
    const newPkg: LessonPackage = {
      ...data,
      id: createEntityId('pkg'),
      createdAt: new Date().toISOString().split('T')[0],
    };
    // Bir öğrencide aynı anda birden fazla aktif paket bırakma. Yeni paket açılırken
    // önceki aktif paket(ler) geçmiş kaydı korunarak kapatılır.
    setPackages((prev) => [
      newPkg,
      ...prev.map((p) => p.studentId === data.studentId && p.status === 'Aktif'
        ? { ...p, status: 'Tamamlandı' as const, endDate: data.startDate }
        : p),
    ]);

    // Automatically create transaction for package purchase
    const newTxn: FinancialTransaction = {
      id: createEntityId('txn'),
      studentId: data.studentId,
      type: 'Paket Satışı',
      amount: data.totalAmount,
      date: data.startDate,
      packageId: newPkg.id,
      description: `${data.packageName} (${data.totalLessons} ders)`,
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [newTxn, ...prev]);

    // Update student's packageId pointer
    updateStudent(data.studentId, { packageId: newPkg.id, feeType: 'Paket' });

    return newPkg;
  };

  const updatePackage = (id: string, data: Partial<LessonPackage>) => {
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  };

  const addTransaction = (
    data: Omit<FinancialTransaction, 'id' | 'createdAt'>
  ): FinancialTransaction => {
    if (!data.studentId) throw new Error('Öğrenci seçimi zorunludur.');
    if (!Number.isFinite(data.amount) || data.amount <= 0) throw new Error('İşlem tutarı sıfırdan büyük olmalıdır.');
    const duplicate = transactions.find((t) => !t.isCancelled && t.studentId === data.studentId && t.type === data.type && t.amount === data.amount && t.date === data.date && (t.description || '') === (data.description || ''));
    if (duplicate) throw new Error('Aynı finans kaydı daha önce eklenmiş görünüyor.');
    const newTxn: FinancialTransaction = {
      ...data,
      id: createEntityId('txn'),
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [newTxn, ...prev]);
    pushToast({ type: 'success', title: 'Finans kaydı eklendi', message: `${data.amount.toLocaleString('tr-TR')} TL tutarındaki işlem kaydedildi.` });
    return newTxn;
  };

  const voidTransaction = (id: string, reason: string = 'Kayıt iptal edildi') => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isCancelled: true, cancellationReason: reason } : t))
    );
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const addNotification = (data: Omit<NotificationItem, 'id' | 'createdAt'>) => {
    const newNotif: NotificationItem = {
      ...data,
      id: createEntityId('notif'),
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const snoozeNotification = (id: string, minutes: number) => {
    const snoozedUntil = new Date(Date.now() + minutes * 60_000).toISOString();
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, snoozedUntil, isRead: true } : n));
  };

  const completeNotification = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isCompleted: true, isRead: true } : n));
  };

  const addWhatsAppLog = (data: Omit<WhatsAppLog, 'id'>) => {
    const log: WhatsAppLog = { ...data, id: createEntityId('wa') };
    setWhatsAppLogs((prev) => [log, ...prev]);
  };

  const logWhatsAppMessage = (data: Omit<WhatsAppLog, 'id' | 'sentAt' | 'status'>) => {
    addWhatsAppLog({ ...data, sentAt: new Date().toISOString(), status: 'Opened' });
  };

  // Message templates
  const updateMessageTemplate = (id: string, content: string) => {
    setMessageTemplates((prev) => prev.map((m) => (m.id === id ? { ...m, content } : m)));
  };

  // Export / Import / Reset Database
  const getDatabasePayload = () => ({
    version: '3.0',
    teacher,
    students,
    lessons,
    lessonNotes,
    assignments,
    topicProgress,
    goals,
    examResults,
    writtenExams,
    writtenPreparations,
    tasks,
    documents,
    packages,
    transactions,
    notifications,
    messageTemplates,
    whatsAppLogs,
    settings,
    security: { ...security, pinCode: undefined },
  });

  const syncNow = async () => {
    if (!user || !cloudReady) return;
    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }
    const payload = getDatabasePayload();
    const serialized = JSON.stringify(payload);
    try {
      setSyncStatus('syncing');
      const row = await saveCloudState(user.id, payload, lastSyncedAt);
      lastCloudPayloadRef.current = serialized;
      setLastSyncedAt(row.updated_at);
      setSyncConflict(false);
      setSyncStatus('synced');
    } catch (error: any) {
      console.error('Bulut senkronizasyonu başarısız:', error?.message || error);
      setSyncStatus('error');
      if (error instanceof CloudConflictError) {
        setSyncConflict(true);
        pushToast({
          type: 'warning',
          title: 'Senkronizasyon çakışması',
          message: 'Başka bir cihazda daha yeni veri var. Yerel değişiklikleriniz korunuyor; Ayarlar içinden hangi sürümün kullanılacağını seçebilirsiniz.',
        });
      }
    }
  };

  useEffect(() => {
    if (!user || !cloudReady) return;
    const serialized = JSON.stringify(getDatabasePayload());
    if (serialized === lastCloudPayloadRef.current) return;
    if (cloudSaveTimerRef.current) clearTimeout(cloudSaveTimerRef.current);
    cloudSaveTimerRef.current = setTimeout(() => { void syncNow(); }, 900);
    return () => {
      if (cloudSaveTimerRef.current) clearTimeout(cloudSaveTimerRef.current);
    };
  }, [
    user?.id, cloudReady, teacher, settings, security, students, lessons, lessonNotes,
    assignments, topicProgress, goals, examResults, writtenExams, writtenPreparations,
    tasks, documents, packages, transactions, notifications, messageTemplates, whatsAppLogs,
  ]);

  useEffect(() => {
    if (!user || !cloudReady) return;
    const refreshFromCloud = async () => {
      if (!navigator.onLine) {
        setSyncStatus('offline');
        return;
      }
      // Yerelde henüz buluta gitmemiş bir değişiklik varsa önce onu koru.
      const localSerialized = JSON.stringify(getDatabasePayload());
      if (lastCloudPayloadRef.current && localSerialized !== lastCloudPayloadRef.current) {
        await syncNow();
        return;
      }
      try {
        const row = await loadCloudState<Record<string, any>>(user.id);
        if (!row?.data) return;
        const serialized = JSON.stringify(row.data);
        if (serialized !== lastCloudPayloadRef.current) {
          lastCloudPayloadRef.current = serialized;
          applyDatabasePayload(row.data, user);
        }
        setLastSyncedAt(row.updated_at);
        setSyncStatus('synced');
      } catch (error: any) {
        console.error('Bulut yenilemesi başarısız:', error?.message || error);
        setSyncStatus('error');
      }
    };
    const onFocus = () => { void refreshFromCloud(); };
    const onVisibility = () => { if (document.visibilityState === 'visible') void refreshFromCloud(); };
    const onOnline = () => { setSyncStatus('idle'); void refreshFromCloud(); };
    const onOffline = () => setSyncStatus('offline');
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [user?.id, cloudReady]);

  const exportDatabaseJSON = (): string => {
    return JSON.stringify(createBackupEnvelope(getDatabasePayload(), user), null, 2);
  };

  const importDatabaseJSON = (jsonStr: string): boolean => {
    try {
      if (!user) return false;
      const { payload: data } = parseBackupEnvelope<any>(jsonStr);
      // Never import another account's login credentials. Only application data is restored.
      if (!data || typeof data !== 'object') return false;
      if (data.students && !Array.isArray(data.students)) return false;
      if (data.lessons && !Array.isArray(data.lessons)) return false;
      if (data.transactions && !Array.isArray(data.transactions)) return false;

      saveSafetySnapshot(user.id, exportDatabaseJSON());
      applyDatabasePayload(data, user);
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  };

  const resetToSampleData = () => {
    setTeacher(INITIAL_TEACHER);
    setSecurity(INITIAL_SECURITY);
    setSettings(INITIAL_SETTINGS);
    setStudents(INITIAL_STUDENTS);
    setLessons(INITIAL_LESSONS);
    setLessonNotes(INITIAL_LESSON_NOTES);
    setAssignments(INITIAL_ASSIGNMENTS);
    setGoals(INITIAL_GOALS);
    setExamResults(INITIAL_EXAM_RESULTS);
    setWrittenExams(INITIAL_WRITTEN_EXAMS);
    setWrittenPreparations(INITIAL_WRITTEN_PREPARATIONS);
    setTasks(INITIAL_TASKS);
    setDocuments(INITIAL_DOCUMENTS);
    setPackages(INITIAL_PACKAGES);
    setTransactions(INITIAL_TRANSACTIONS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setMessageTemplates(INITIAL_MESSAGE_TEMPLATES);
    setTopicProgress([]);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        authReady,
        cloudReady,
        syncStatus,
        syncConflict,
        resolveSyncConflict,
        lastSyncedAt,
        syncNow,
        teacher,
        security,
        settings,
        isAppLocked,
        loginUser,
        registerUser,
        resetPassword,
        passwordRecoveryMode,
        updatePassword,
        logoutUser,
        updateTeacherProfile,
        updateSecuritySettings,
        updateUserSettings,
        unlockAppWithPin,
        lockAppNow,
        toasts,
        pushToast,
        dismissToast,

        students,
        addStudent,
        updateStudent,
        archiveStudent,
        restoreStudent,
        deleteStudentPermanent,

        lessons,
        lessonNotes,
        addLesson,
        updateLesson,
        cancelLesson,
        rescheduleLesson,
        completeLesson,
        deleteLesson,
        checkConflict,

        activeLessonId,
        activeLessonStartTime,
        activeLessonElapsedSeconds,
        startLiveLesson,
        pauseLiveLesson,
        resumeLiveLesson,
        stopAndOpenCompletionModal,
        cancelLiveLesson,

        assignments,
        addAssignment,
        updateAssignment,
        updateAssignmentStatus,
        deleteAssignment,

        topicProgress,
        curriculumProgress: topicProgress,
        toggleCurriculumOutcome,
        updateStudentTopicProgress,

        goals,
        addGoal,
        updateGoal,
        deleteGoal,
        updateGoalStatus,

        examResults,
        exams: examResults,
        addExamResult,
        deleteExamResult,

        writtenExams,
        writtenPreparations,
        addWrittenExam,
        updateWrittenExam,
        deleteWrittenExam,
        addWrittenExamPreparation,
        updateWrittenExamPreparation,
        deleteWrittenExamPreparation,

        tasks,
        addTask,
        updateTask,
        updateTaskStatus,
        toggleTaskCompletion,
        deleteTask,

        documents,
        addDocument,
        deleteDocument,

        packages,
        transactions,
        addPackage,
        updatePackage,
        addTransaction,
        voidTransaction,

        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        addNotification,
        deleteNotification,
        snoozeNotification,
        completeNotification,

        whatsAppLogs,
        addWhatsAppLog,
        logWhatsAppMessage,

        messageTemplates,
        updateMessageTemplate,

        activeModal,
        modalPayload,
        openModal,
        closeModal,

        exportDatabaseJSON,
        importDatabaseJSON,
        resetToSampleData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
