import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  Bell,
  Sun,
  Moon,
  Instagram,
  Lock,
  Play,
  Pause,
  CheckCircle,
  User,
  LogOut,
  Calendar,
  BookOpen,
  DollarSign,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Trash2,
  Cloud,
  CloudOff,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateTurkish } from '../utils/formatters';

interface NavbarProps {
  onNavigate: (view: string) => void;
  activeView: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, activeView }) => {
  const {
    teacher,
    settings,
    updateUserSettings,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    security,
    lockAppNow,
    logoutUser,
    activeLessonId,
    activeLessonElapsedSeconds,
    pauseLiveLesson,
    resumeLiveLesson,
    stopAndOpenCompletionModal,
    lessons,
    students,
    openModal,
    syncStatus,
    lastSyncedAt,
    syncNow,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const quickAddRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (quickAddRef.current && !quickAddRef.current.contains(event.target as Node)) {
        setShowQuickAdd(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  // Active lesson details if running
  const runningLesson = activeLessonId ? lessons.find((l) => l.id === activeLessonId) : null;
  const runningStudent = runningLesson ? students.find((s) => s.id === runningLesson.studentId) : null;

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              ∑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight leading-none font-display">
                  bymatematik
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-full">
                  Asistan
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block leading-tight">
                Özel Ders Yönetim Sistemi
              </span>
            </div>
          </button>

          {/* Clickable Instagram Link */}
          <a
            href="https://instagram.com/bymatematiik"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/50 hover:bg-pink-100 dark:hover:bg-pink-900/50 rounded-lg transition-colors border border-pink-200/50 dark:border-pink-800/30"
            title="Instagram'da @bymatematiik hesabını ziyaret et"
          >
            <Instagram className="w-3.5 h-3.5" />
            <span>@bymatematiik</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>

        {/* Center: Live Lesson Stopwatch Ticker (If Active) */}
        {runningLesson && (
          <div className="flex items-center gap-2.5 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/80 px-3.5 py-1.5 rounded-full animate-pulse shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <div className="text-xs">
              <span className="font-bold text-indigo-950 dark:text-indigo-100">
                {runningStudent ? `${runningStudent.firstName} ${runningStudent.lastName}` : 'Ders Devam Ediyor'}
              </span>
              <span className="mx-1 text-slate-400">|</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {formatTimer(activeLessonElapsedSeconds)}
              </span>
            </div>
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={stopAndOpenCompletionModal}
                className="px-2 py-0.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md flex items-center gap-1 transition-colors"
                title="Dersi Tamamla ve Raporla"
              >
                <CheckCircle className="w-3 h-3" />
                <span>Tamamla</span>
              </button>
            </div>
          </div>
        )}

        {/* Right: Actions (Search, Quick Add, Notifs, Theme, Lock, Profile) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => { void syncNow(); }}
            disabled={syncStatus === 'syncing' || syncStatus === 'loading'}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-xl border transition-colors ${
              syncStatus === 'error' || syncStatus === 'offline'
                ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
            }`}
            title={lastSyncedAt ? `Son senkronizasyon: ${new Date(lastSyncedAt).toLocaleString('tr-TR')}` : 'Bulut senkronizasyonu'}
          >
            {syncStatus === 'offline' || syncStatus === 'error' ? <CloudOff className="w-3.5 h-3.5" /> : <Cloud className="w-3.5 h-3.5" />}
            {syncStatus === 'syncing' || syncStatus === 'loading' ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
            <span>{syncStatus === 'offline' ? 'Çevrimdışı' : syncStatus === 'error' ? 'Senkron Hatası' : syncStatus === 'syncing' ? 'Kaydediliyor' : 'Bulutta'}</span>
          </button>
          {/* Universal Search Button */}
          <button
            onClick={() => openModal('universalSearch')}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 shadow-xs"
            title="Tüm sistemde ara (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Hızlı Arama</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-slate-500 dark:text-slate-400">
              ⌘K
            </kbd>
          </button>

          {/* Quick Add Menu */}
          <div className="relative" ref={quickAddRef}>
            <button
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Yeni Ekle</span>
            </button>

            {showQuickAdd && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Hızlı İşlemler
                </div>
                <button
                  onClick={() => {
                    setShowQuickAdd(false);
                    openModal('addLesson');
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 flex items-center gap-2.5"
                >
                  <div className="p-1 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-600">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <span>Yeni Ders Planla</span>
                </button>
                <button
                  onClick={() => {
                    setShowQuickAdd(false);
                    openModal('addStudent');
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 flex items-center gap-2.5"
                >
                  <div className="p-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-600">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span>Yeni Öğrenci Ekle</span>
                </button>
                <button
                  onClick={() => {
                    setShowQuickAdd(false);
                    openModal('addAssignment');
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 flex items-center gap-2.5"
                >
                  <div className="p-1 rounded bg-amber-100 dark:bg-amber-900 text-amber-600">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <span>Ödev Tanımla</span>
                </button>
                <button
                  onClick={() => {
                    setShowQuickAdd(false);
                    openModal('addPayment');
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 flex items-center gap-2.5"
                >
                  <div className="p-1 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-600">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                  <span>Ödeme Girişi Yap</span>
                </button>
                <button
                  onClick={() => {
                    setShowQuickAdd(false);
                    openModal('addExam');
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 flex items-center gap-2.5"
                >
                  <div className="p-1 rounded bg-purple-100 dark:bg-purple-900 text-purple-600">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span>Deneme Sonucu Ekle</span>
                </button>
                <button
                  onClick={() => {
                    setShowQuickAdd(false);
                    openModal('addTask');
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 flex items-center gap-2.5"
                >
                  <div className="p-1 rounded bg-rose-100 dark:bg-rose-900 text-rose-600">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <span>Materyal & Görev Ekle</span>
                </button>
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="Bildirimler"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-scale">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-3 z-50">
                <div className="px-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Bildirimler
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 rounded-full">
                        {unreadCount} yeni
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                    >
                      Tümünü Okundu Say
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Henüz bildirim bulunmuyor.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id);
                          if (n.linkTab) onNavigate(n.linkTab);
                          setShowNotifications(false);
                        }}
                        className={`p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors flex items-start justify-between gap-2 ${
                          !n.isRead ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                        }`}
                      >
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {n.title}
                            </span>
                            {!n.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-slate-400 block pt-0.5">
                            {formatDateTurkish(n.date, 'short')}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(n.id);
                          }}
                          className="text-slate-300 hover:text-rose-500 p-1"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={() => { setShowNotifications(false); onNavigate('notifications'); }} className="w-full py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40">Bildirim Merkezini Aç</button>
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={() =>
              updateUserSettings({
                theme: settings.theme === 'dark' ? 'light' : 'dark',
              })
            }
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title={settings.theme === 'dark' ? 'Aydınlık Mod' : 'Karanlık Mod'}
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>

          {/* Screen Lock Button (if PIN enabled) */}
          {security.isPinEnabled && security.pinCode && (
            <button
              onClick={lockAppNow}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="Uygulamayı Kilitle"
            >
              <Lock className="w-4 h-4 text-slate-500" />
            </button>
          )}

          {/* Profile Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {teacher.firstName.charAt(0)}
                {teacher.lastName.charAt(0)}
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {teacher.firstName} {teacher.lastName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {teacher.title}
                  </p>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                    {teacher.email}
                  </p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onNavigate('settings');
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                  >
                    <span>Öğretmen Profili & Ayarlar</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onNavigate('about');
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                  >
                    <span>bymatematik Hakkında</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logoutUser();
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Çıkış Yap</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
