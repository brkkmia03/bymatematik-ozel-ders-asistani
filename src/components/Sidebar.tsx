import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  BookOpen,
  GraduationCap,
  Sparkles,
  Award,
  CheckSquare,
  FolderArchive,
  CreditCard,
  MessageSquare,
  FileBarChart,
  Settings,
  Info,
  Instagram,
  ExternalLink,
  PlusCircle,
  Bell,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate }) => {
  const { teacher, openModal } = useApp();

  const navItems = [
    { id: 'home', label: 'Ana Sayfa', icon: LayoutDashboard },
    { id: 'calendar', label: 'Ders Takvimi', icon: Calendar },
    { id: 'students', label: 'Öğrenciler', icon: Users },
    { id: 'assignments', label: 'Ödevler', icon: BookOpen },
    { id: 'curriculum', label: 'Konu & Kazanım', icon: GraduationCap },
    { id: 'exams', label: 'Akademik Gelişim', icon: Sparkles },
    { id: 'written-exams', label: 'Yazılı Hazırlığı', icon: Award },
    { id: 'tasks', label: 'Yapılacaklar', icon: CheckSquare },
    { id: 'documents', label: 'Doküman & Kaynak', icon: FolderArchive },
    { id: 'finance', label: 'Finans & Paketler', icon: CreditCard },
    { id: 'whatsapp', label: 'Veli WhatsApp', icon: MessageSquare },
    { id: 'reports', label: 'PDF & Raporlar', icon: FileBarChart },
    { id: 'notifications', label: 'Bildirim Merkezi', icon: Bell },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
    { id: 'about', label: 'Hakkında', icon: Info },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-white rounded-3xl p-4 h-[calc(100vh-6rem)] sticky top-20 select-none shrink-0 shadow-lg border border-slate-800">
      {/* Brand Header */}
      <div className="px-3 pt-2 pb-4 mb-2 border-b border-slate-800/80">
        <div className="text-xl font-extrabold tracking-tight font-display text-white flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
            ∑
          </div>
          <span>{teacher.brandName || 'bymatematik'}</span>
        </div>
        <a
          href="https://instagram.com/bymatematiik"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-slate-400 hover:text-pink-400 transition-colors mt-2 flex items-center gap-1.5 font-medium"
        >
          <Instagram className="w-3.5 h-3.5 text-pink-400" />
          <span>@bymatematiik</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-auto" />
        </a>
      </div>

      {/* Quick Action Button */}
      <div className="pb-3">
        <button
          onClick={() => openModal('addLesson')}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/30 active:scale-98 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Yeni Ders Planla</span>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                }`}
              />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User / Teacher Profile Footer Tile */}
      <div className="pt-3 mt-2 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-slate-800/50 border border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">
            {teacher.firstName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white truncate text-xs">
              {teacher.firstName} {teacher.lastName}
            </div>
            <div className="opacity-60 text-[10px] uppercase tracking-wider font-bold">
              {teacher.title || 'Matematik Öğretmeni'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
