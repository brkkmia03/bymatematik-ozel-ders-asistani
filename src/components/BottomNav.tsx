import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  BookOpen,
  DollarSign,
  Menu,
  X,
  GraduationCap,
  Sparkles,
  Award,
  CheckSquare,
  FolderArchive,
  MessageSquare,
  FileBarChart,
  Settings,
  Info,
  Instagram,
  Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface BottomNavProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeView, onNavigate }) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { openModal } = useApp();

  const primaryTabs = [
    { id: 'home', label: 'Ana Sayfa', icon: LayoutDashboard },
    { id: 'calendar', label: 'Takvim', icon: Calendar },
    { id: 'students', label: 'Öğrenciler', icon: Users },
    { id: 'assignments', label: 'Ödevler', icon: BookOpen },
    { id: 'finance', label: 'Finans', icon: DollarSign },
  ];

  const secondaryModules = [
    { id: 'curriculum', label: 'Konu & Kazanım', icon: GraduationCap, color: 'text-indigo-600' },
    { id: 'exams', label: 'Akademik Gelişim', icon: Sparkles, color: 'text-purple-600' },
    { id: 'written-exams', label: 'Yazılı Hazırlığı', icon: Award, color: 'text-amber-600' },
    { id: 'tasks', label: 'Yapılacak Materyaller', icon: CheckSquare, color: 'text-emerald-600' },
    { id: 'documents', label: 'Doküman & Kaynak', icon: FolderArchive, color: 'text-blue-600' },
    { id: 'whatsapp', label: 'Veli WhatsApp', icon: MessageSquare, color: 'text-green-600' },
    { id: 'reports', label: 'PDF & Raporlar', icon: FileBarChart, color: 'text-rose-600' },
    { id: 'settings', label: 'Ayarlar', icon: Settings, color: 'text-slate-600' },
    { id: 'about', label: 'Hakkında (@bymatematiik)', icon: Info, color: 'text-pink-600' },
  ];

  const handleSelect = (viewId: string) => {
    onNavigate(viewId);
    setShowMoreMenu(false);
  };

  return (
    <>
      {/* Mobile Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleSelect(tab.id)}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[10px] mt-1 truncate">{tab.label}</span>
              </button>
            );
          })}

          {/* More Menu Trigger */}
          <button
            onClick={() => setShowMoreMenu(true)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              showMoreMenu
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 font-medium'
            }`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] mt-1 truncate">Diğer</span>
          </button>
        </div>
      </div>

      {/* Slide-up Sheet for Additional Modules */}
      {showMoreMenu && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 max-h-[85vh] overflow-y-auto p-5 pb-8 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-slate-900 dark:text-white font-display">
                  bymatematik Modülleri
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-full">
                  Tümü
                </span>
              </div>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Add Button on Mobile */}
            <button
              onClick={() => {
                setShowMoreMenu(false);
                openModal('addLesson');
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Ders Planla</span>
            </button>

            {/* Grid of Other Modules */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              {secondaryModules.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl text-left border transition-all ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`p-2 rounded-lg bg-white dark:bg-slate-800 shadow-xs ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Instagram Contact Banner */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <a
                href="https://instagram.com/bymatematiik"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-bold text-xs rounded-xl border border-pink-200 dark:border-pink-900"
              >
                <Instagram className="w-4 h-4" />
                <span>Instagram: @bymatematiik</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
