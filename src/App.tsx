import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';

// Views
import { DashboardView } from './views/DashboardView';
import { CalendarView } from './views/CalendarView';
import { StudentsView } from './views/StudentsView';
import { AssignmentsView } from './views/AssignmentsView';
import { CurriculumView } from './views/CurriculumView';
import { ExamsView } from './views/ExamsView';
import { WrittenExamsView } from './views/WrittenExamsView';
import { TasksView } from './views/TasksView';
import { DocumentsView } from './views/DocumentsView';
import { FinanceView } from './views/FinanceView';
import { WhatsAppView } from './views/WhatsAppView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { AboutView } from './views/AboutView';
import { NotificationsView } from './views/NotificationsView';

// Modals
import { UniversalSearchModal } from './components/modals/UniversalSearchModal';
import { DersBaslatModal } from './components/modals/DersBaslatModal';
import { DersSonuFormModal } from './components/modals/DersSonuFormModal';
import { DersOncesiOzetModal } from './components/modals/DersOncesiOzetModal';
import { WhatsAppModal } from './components/modals/WhatsAppModal';
import { AddLessonModal } from './components/modals/AddLessonModal';
import { AddStudentModal } from './components/modals/AddStudentModal';
import { AddAssignmentModal } from './components/modals/AddAssignmentModal';
import { AddPaymentModal } from './components/modals/AddPaymentModal';
import { AddExamModal } from './components/modals/AddExamModal';
import { AddTaskModal } from './components/modals/AddTaskModal';
import { AddDocumentModal } from './components/modals/AddDocumentModal';
import { PdfPreviewModal } from './components/modals/PdfPreviewModal';
import { LockScreenModal } from './components/modals/LockScreenModal';
import { AuthView } from './views/AuthView';
import { StudentProfileModal } from './components/StudentProfileModal';
import { ToastViewport } from './components/ToastViewport';

const AppLayout: React.FC = () => {
  const {
    user,
    authReady,
    cloudReady,
    passwordRecoveryMode,
    syncConflict,
    resolveSyncConflict,
    activeModal,
    modalPayload,
    closeModal,
    openModal,
    isAppLocked,
  } = useApp();
  const [activeView, setActiveView] = useState('home');

  // Keyboard shortcut for Ctrl+K search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle search modal
        if (activeModal === 'universalSearch') {
          closeModal();
        } else {
          // Open universal search
          openModal('universalSearch');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, closeModal, openModal]);

  if (!authReady) {
    return <div className="pwa-shell safe-area-top safe-area-bottom safe-area-x bg-slate-950 text-slate-200 flex items-center justify-center text-sm font-bold">Oturum kontrol ediliyor...</div>;
  }

  if (passwordRecoveryMode) {
    return <AuthView />;
  }

  if (!user) {
    return <AuthView />;
  }

  if (!cloudReady) {
    return <div className="pwa-shell safe-area-top safe-area-bottom safe-area-x bg-slate-950 text-slate-200 flex items-center justify-center text-sm font-bold">Bulut verileri yükleniyor...</div>;
  }

  return (
    <div className="pwa-shell bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Top Fixed Header Navbar */}
      <Navbar onNavigate={setActiveView} activeView={activeView} />

      {/* Main Responsive Grid Layout */}
      <div className="safe-area-x flex-1 flex max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-24 lg:pb-6 gap-4 lg:gap-6">
        {/* Desktop & Tablet Sidebar */}
        <Sidebar activeView={activeView} onNavigate={setActiveView} />

        {/* Dynamic Main Workspace View */}
        <main className="flex-1 min-w-0">
        {syncConflict && (
          <div className="mx-4 mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
            <div className="font-black">Senkronizasyon çakışması algılandı</div>
            <div className="mt-1 text-xs opacity-80">Başka bir cihazda daha yeni veri var. Hangi sürümün korunacağını seçin.</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => resolveSyncConflict('cloud')} className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-bold text-white">Buluttaki sürümü kullan</button>
              <button onClick={() => resolveSyncConflict('local')} className="rounded-xl border border-amber-400 px-3 py-2 text-xs font-bold">Bu cihazın sürümünü kullan</button>
            </div>
          </div>
        )}

          {(activeView === 'home' || activeView === 'dashboard') && <DashboardView onNavigate={setActiveView} />}
          {activeView === 'calendar' && <CalendarView />}
          {activeView === 'students' && <StudentsView />}
          {activeView === 'assignments' && <AssignmentsView />}
          {activeView === 'curriculum' && <CurriculumView />}
          {activeView === 'exams' && <ExamsView />}
          {activeView === 'written-exams' && <WrittenExamsView />}
          {activeView === 'tasks' && <TasksView />}
          {activeView === 'documents' && <DocumentsView />}
          {activeView === 'finance' && <FinanceView />}
          {activeView === 'whatsapp' && <WhatsAppView />}
          {activeView === 'reports' && <ReportsView />}
          {activeView === 'notifications' && <NotificationsView onNavigate={setActiveView} />}
          {activeView === 'settings' && <SettingsView />}
          {activeView === 'about' && <AboutView />}
          {![
            'home', 'dashboard', 'calendar', 'students', 'assignments', 'curriculum', 'exams',
            'written-exams', 'tasks', 'documents', 'finance', 'whatsapp', 'reports', 'notifications',
            'settings', 'about',
          ].includes(activeView) && (
            <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-sm">
              <h1 className="text-xl font-black font-display">Sayfa bulunamadı</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">İstenen bölüm kullanılamıyor. Ana Sayfa'ya dönebilirsiniz.</p>
              <button type="button" onClick={() => setActiveView('home')} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">Ana Sayfa'ya Dön</button>
            </section>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav activeView={activeView} onNavigate={setActiveView} />

      {/* Global Modals Manager */}
      {activeModal === 'universalSearch' && (
        <UniversalSearchModal
          onClose={closeModal}
          onNavigate={(view) => {
            setActiveView(view);
            closeModal();
          }}
        />
      )}

      {activeModal === 'liveLesson' && modalPayload?.lesson && (
        <DersBaslatModal
          lesson={modalPayload.lesson}
          student={modalPayload.student}
          onClose={closeModal}
        />
      )}

      {activeModal === 'completeLesson' && modalPayload?.lesson && (
        <DersSonuFormModal
          lesson={modalPayload.lesson}
          student={modalPayload.student}
          actualElapsedMinutes={modalPayload.actualElapsedMinutes}
          onClose={closeModal}
        />
      )}

      {activeModal === 'preLessonSummary' && modalPayload?.lesson && (
        <DersOncesiOzetModal
          lesson={modalPayload.lesson}
          student={modalPayload.student}
          onClose={closeModal}
        />
      )}

      {activeModal === 'whatsapp' && (
        <WhatsAppModal
          student={modalPayload?.student}
          lesson={modalPayload?.lesson}
          assignment={modalPayload?.assignment}
          templateType={modalPayload?.templateType}
          onClose={closeModal}
        />
      )}

      {activeModal === 'addLesson' && (
        <AddLessonModal
          initialDate={modalPayload?.initialDate}
          initialStudentId={modalPayload?.initialStudentId}
          topic={modalPayload?.topic}
          onClose={closeModal}
        />
      )}

      {activeModal === 'addStudent' && (
        <AddStudentModal
          studentToEdit={modalPayload?.studentToEdit}
          onClose={closeModal}
        />
      )}

      {activeModal === 'addAssignment' && (
        <AddAssignmentModal
          initialStudentId={modalPayload?.initialStudentId}
          onClose={closeModal}
        />
      )}

      {activeModal === 'addPayment' && (
        <AddPaymentModal
          initialStudentId={modalPayload?.initialStudentId}
          onClose={closeModal}
        />
      )}

      {activeModal === 'addExam' && (
        <AddExamModal
          initialStudentId={modalPayload?.initialStudentId}
          onClose={closeModal}
        />
      )}

      {activeModal === 'addTask' && (
        <AddTaskModal
          initialStudentId={modalPayload?.initialStudentId}
          writtenExamId={modalPayload?.writtenExamId}
          preparationId={modalPayload?.preparationId}
          onClose={closeModal}
        />
      )}

      {activeModal === 'addDocument' && (
        <AddDocumentModal
          initialStudentId={modalPayload?.initialStudentId}
          writtenExamId={modalPayload?.writtenExamId}
          onClose={closeModal}
        />
      )}

      {activeModal === 'pdfPreview' && (
        <PdfPreviewModal
          reportType={modalPayload?.reportType || 'student_progress'}
          student={modalPayload?.student}
          reportOptions={modalPayload?.reportOptions}
          onClose={closeModal}
        />
      )}

      {activeModal === 'studentProfile' && modalPayload?.student && (
        <StudentProfileModal student={modalPayload.student} onClose={closeModal} />
      )}

      <ToastViewport />

      {/* PIN Lock Screen Modal (Highest Z-index) */}
      {isAppLocked && <LockScreenModal />}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}
