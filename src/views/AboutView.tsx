import React from 'react';
import {
  Sparkles,
  Instagram,
  GraduationCap,
  ShieldCheck,
  CheckCircle,
  Heart,
  BookOpen,
  Calendar,
  DollarSign,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AboutView: React.FC = () => {
  const { teacher } = useApp();

  const features = [
    {
      title: 'Ders & Canlı Kronometre',
      desc: 'Canlı ders süresi sayacı, karalama not defteri ve tek tıkla atomik ders tamamlama.',
      icon: Calendar,
    },
    {
      title: 'Öğrenci & Veli Yönetimi',
      desc: 'LGS ve YKS grupları, akademik hedefler, veli iletişim kartları ve ders geçmişi.',
      icon: GraduationCap,
    },
    {
      title: 'MEB & ÖSYM Kazanım Takibi',
      desc: '8. Sınıf LGS, TYT ve AYT Matematik konu/kazanım müfredatı ve öğrenci ilerleme çubuğu.',
      icon: BookOpen,
    },
    {
      title: 'Veli WhatsApp Entegrasyonu',
      desc: 'Ders sonu raporu, ödev hatırlatması ve ödeme bilgilerini tek tıkla WhatsApp üzerinden ulaştırın.',
      icon: MessageSquare,
    },
    {
      title: 'Finans, Paket & Cari Hesap',
      desc: 'Paket kalan kredileri, tahsilatlar, gelir grafikleri ve IBAN banka yönetimi.',
      icon: DollarSign,
    },
    {
      title: 'Türkçe Karakter Uyumlu PDF',
      desc: 'Öğrenci gelişim raporu, haftalık ders programı ve finansal hesap dökümlerini yazdırın.',
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Brand Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white p-8 sm:p-12 shadow-xl relative overflow-hidden text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-white text-indigo-950 font-black text-2xl flex items-center justify-center mx-auto shadow-2xl">
          bm
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-display">
          bymatematik Özel Ders Asistanı
        </h1>

        <p className="text-sm sm:text-base text-indigo-100 max-w-xl mx-auto leading-relaxed">
          Özel matematik dersi veren öğretmenlerin öğrencilerini, ders programını, ödevlerini, deneme sınavlarını, finansal kayıtlarını ve veli iletişimini tek merkezden yönetmesi için tasarlandı.
        </p>

        <div className="pt-2 flex items-center justify-center gap-3">
          <a
            href="https://instagram.com/bymatematiik"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-xs font-bold transition-colors"
          >
            <Instagram className="w-4 h-4 text-pink-400" />
            <span>@bymatematiik</span>
          </a>

          <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>v1.0.0 Stable</span>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feat, i) => {
          const Icon = feat.icon;
          return (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                {feat.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {feat.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Philosophy Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-3">
        <Heart className="w-6 h-6 text-rose-500 mx-auto" />
        <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">
          Öğretmenler İçin, Öğretmen Titizliğiyle
        </h3>
        <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
          Tüm verileriniz tarayıcınızda ve cihazınızda güvenle yerel olarak saklanır. İnternet bağlantınız olmasa dahi derslerinizi ve notlarınızı kesintisiz kaydedebilirsiniz.
        </p>
        <div className="text-[11px] text-slate-400 font-semibold pt-2">
          © {new Date().getFullYear()} bymatematik • Özel Ders Asistanı
        </div>
      </div>
    </div>
  );
};
