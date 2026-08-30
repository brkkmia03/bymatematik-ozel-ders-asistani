import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Instagram,
  CreditCard,
  Lock,
  Download,
  Upload,
  RefreshCw,
  Database,
  Cloud,
  CheckCircle,
  Moon,
  Sun,
  ShieldCheck,
  AlertTriangle,
  Bell,
  Clock3,
  Smartphone,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const SettingsView: React.FC = () => {
  const {
    teacher,
    updateTeacherProfile,
    security,
    updateSecuritySettings,
    lockAppNow,
    exportDatabaseJSON,
    importDatabaseJSON,
    settings,
    updateUserSettings,
    pushToast,
  } = useApp();

  const [firstName, setFirstName] = useState(teacher.firstName);
  const [lastName, setLastName] = useState(teacher.lastName);
  const [title, setTitle] = useState(teacher.title);
  const [brandName, setBrandName] = useState(teacher.brandName);
  const [instagram, setInstagram] = useState(teacher.instagramHandle || teacher.instagram || '');
  const [phone, setPhone] = useState(teacher.phone);
  const [email, setEmail] = useState(teacher.email);
  const [bankName, setBankName] = useState(teacher.bankName || '');
  const [iban, setIban] = useState(teacher.iban || '');
  const [bankAccountHolder, setBankAccountHolder] = useState(teacher.bankAccountHolder || '');
  const [defaultLessonFee, setDefaultLessonFee] = useState(teacher.defaultLessonFee);

  const [pinEnabled, setPinEnabled] = useState(security.isPinEnabled);
  const [pinCode, setPinCode] = useState(security.pinCode);
  const [autoLockTime, setAutoLockTime] = useState(security.autoLockTime);
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.enableNotifications);
  const [leadTimes, setLeadTimes] = useState<number[]>(settings.notificationLeadTimes || []);
  const [quietStart, setQuietStart] = useState(settings.quietHoursStart || '22:30');
  const [quietEnd, setQuietEnd] = useState(settings.quietHoursEnd || '08:00');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const detectStandalone = () => {
      const iosStandalone = Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
      setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || iosStandalone);
    };
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
    };
    detectStandalone();
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstallPrompt(null);
  };


  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateTeacherProfile({
      firstName,
      lastName,
      title,
      brandName,
      instagram,
      instagramHandle: instagram.trim(),
      phone,
      email,
      bankName,
      iban,
      bankAccountHolder,
      defaultLessonFee: Number(defaultLessonFee),
    });

    updateSecuritySettings({
      isPinEnabled: pinEnabled,
      pinCode,
      autoLockTime,
    });

    updateUserSettings({
      enableNotifications: notificationsEnabled,
      notificationLeadTimes: leadTimes,
      quietHoursStart: quietStart,
      quietHoursEnd: quietEnd,
    });

    setSavedSuccess(true);
    pushToast({ type: 'success', title: 'Ayarlar kaydedildi', message: 'Profil, bildirim ve güvenlik tercihleri güncellendi.' });
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const approved = window.confirm('Yedek geri yüklendiğinde mevcut uygulama verileri yedekteki kayıtlarla değiştirilecektir. İşlem öncesinde güvenlik anlık görüntüsü alınacaktır. Devam etmek istiyor musunuz?');
          if (!approved) { e.target.value = ''; return; }
          const success = importDatabaseJSON(text);
          if (success) {
            pushToast({ type: 'success', title: 'Yedek geri yüklendi', message: 'Geri yükleme öncesi verileriniz ayrıca güvenlik anlık görüntüsü olarak korundu.' });
          } else {
            pushToast({ type: 'error', title: 'Yedek geri yüklenemedi', message: 'Dosya biçimi veya bütünlük kontrolü geçersiz olabilir.' });
          }
          e.target.value = '';
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-display flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-indigo-600" />
          <span>Ayarlar & Öğretmen Profili</span>
        </h1>
        <p className="text-xs text-slate-500">
          Öğretmen bilgileri, @bymatematiik marka ayarları, banka IBAN bilgisi ve PIN güvenliği
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Section 1: Teacher & Brand Profile */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            <span>Öğretmen & Marka Bilgileri</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Adınız
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Soyadınız
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Unvan / Branş
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Marka Adı
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none font-bold text-indigo-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Instagram Hesabı
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Varsayılan Ders Saat Ücreti (₺)
              </label>
              <input
                type="number"
                value={defaultLessonFee}
                onChange={(e) => setDefaultLessonFee(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none font-bold"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Bank & IBAN Account */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Banka & Havale IBAN Bilgileri (Veliler İçin)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Banka Adı
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Örn: Garanti BBVA"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none font-medium"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                IBAN Numarası
              </label>
              <input
                type="text"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Görünüm */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            {settings.theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-500" />}
            <span>Görünüm</span>
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {([['light','Aydınlık'],['dark','Karanlık'],['system','Cihaz Ayarı']] as const).map(([value,label]) => (
              <button key={value} type="button" onClick={() => updateUserSettings({ theme: value })} className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-colors ${settings.theme === value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'}`}>{label}</button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500">Aydınlık ve karanlık modlarda okunabilirlik ve göz konforu korunur.</p>
        </div>


        {/* Bildirimler */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white font-display flex items-center gap-2"><Bell className="w-4 h-4 text-indigo-600"/><span>Bildirim & Hatırlatma Ayarları</span></h2>
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div><span className="text-xs font-bold block">Uygulama Bildirimleri</span><span className="text-[11px] text-slate-500">Ders, ödev, yazılı, finans ve materyal uyarılarını etkinleştir.</span></div>
            <input type="checkbox" checked={notificationsEnabled} onChange={e=>setNotificationsEnabled(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-indigo-600"/>
          </div>
          <div className="space-y-2"><label className="text-xs font-bold text-slate-700 dark:text-slate-300">Ders Öncesi Hatırlatma Zamanları</label><div className="flex flex-wrap gap-2">{[[15,'15 dk'],[30,'30 dk'],[60,'1 saat'],[120,'2 saat'],[1440,'1 gün']].map(([min,label]) => { const m=Number(min); const active=leadTimes.includes(m); return <button type="button" key={m} onClick={()=>setLeadTimes(prev=>active?prev.filter(x=>x!==m):[...prev,m].sort((a,b)=>a-b))} className={`px-3 py-2 rounded-xl text-xs font-bold border ${active?'bg-indigo-600 border-indigo-600 text-white':'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}>{label}</button>})}</div></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="space-y-1"><label className="text-xs font-bold flex items-center gap-1"><Clock3 className="w-3.5 h-3.5"/>Sessiz Saat Başlangıcı</label><input type="time" value={quietStart} onChange={e=>setQuietStart(e.target.value)} className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"/></div><div className="space-y-1"><label className="text-xs font-bold">Sessiz Saat Bitişi</label><input type="time" value={quietEnd} onChange={e=>setQuietEnd(e.target.value)} className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"/></div></div>
        </div>

        {/* PWA / Ana ekran kurulumu */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-indigo-600" />
            <span>Telefona / Tablete Uygulama Olarak Ekle</span>
          </h2>
          {isStandalone ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900">
              <div className="text-xs font-black text-emerald-700 dark:text-emerald-300">Uygulama modu aktif ✓</div>
              <div className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-1">bymatematik bu cihazda bağımsız uygulama görünümünde çalışıyor.</div>
            </div>
          ) : installPrompt ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900">
              <div>
                <div className="text-xs font-black text-indigo-700 dark:text-indigo-300">Kuruluma hazır</div>
                <div className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 mt-1">Ana ekrandaki bymatematik ikonundan, tarayıcı sekmesi olmadan açabilirsin.</div>
              </div>
              <button type="button" onClick={handleInstallApp} className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold whitespace-nowrap">Uygulamayı Yükle</button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="text-xs font-black text-slate-800 dark:text-slate-100">Ana ekrana ekleme</div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">iPhone/iPad: Safari’de Paylaş → <strong>Ana Ekrana Ekle</strong>. Android/Chrome: tarayıcı menüsünden <strong>Uygulamayı yükle</strong> veya <strong>Ana ekrana ekle</strong> seçeneğini kullan.</div>
            </div>
          )}
          <p className="text-[11px] text-slate-500">Kurulduğunda uygulama bymatematik marka ikonu ve bağımsız pencere görünümüyle açılır.</p>
        </div>

        {/* Section 3: Security & PIN Code */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              <span>Uygulama PIN Kilidi Güvenliği</span>
            </h2>

            <button
              type="button"
              onClick={lockAppNow}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              🔒 Şimdi Kilitle
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  PIN Korumasını Aktif Et
                </span>
                <span className="text-[11px] text-slate-500">
                  Uygulama açılışında 4 haneli PIN sorar
                </span>
              </div>
              <input
                type="checkbox"
                checked={pinEnabled}
                onChange={(e) => setPinEnabled(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                PIN Kodu (4 Rakam)
              </label>
              <input
                type="password"
                maxLength={4}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="4 haneli PIN"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none font-mono text-center font-bold tracking-widest text-base"
              />
            </div>
          </div>
          <div className="space-y-1"><label className="text-xs font-bold text-slate-700 dark:text-slate-300">Otomatik Kilitleme</label><select value={autoLockTime} onChange={e=>setAutoLockTime(e.target.value as typeof autoLockTime)} className="w-full sm:w-64 text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">{['Kapalı','Hemen','1 dakika','5 dakika','15 dakika'].map(v=><option key={v}>{v}</option>)}</select></div>
        </div>

        {/* Data architecture status */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white font-display flex items-center gap-2"><Database className="w-4 h-4 text-indigo-600"/><span>Veri Katmanı & Hesap İzolasyonu</span></h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900"><div className="text-xs font-black text-emerald-700 dark:text-emerald-300">Hesaba Özel Yerel Veri</div><div className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-1">Her kullanıcı ayrı veri alanında tutulur. Farklı hesapların öğrenci ve finans kayıtları birbirine karışmaz.</div></div>
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900"><div className="text-xs font-black text-blue-700 dark:text-blue-300 flex items-center gap-1.5"><Cloud className="w-3.5 h-3.5"/>Bulut Bağlantısına Hazır</div><div className="text-[11px] text-blue-700/80 dark:text-blue-300/80 mt-1">Şu an offline-first çalışır. Veri erişimi ayrıştırıldığı için sonraki aşamada gerçek bulut sağlayıcısına taşınabilir.</div></div>
          </div>
        </div>

        {/* Section 4: Backup & Restore */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-600" />
            <span>Veri Yedekleme & Geri Yükleme (Offline-First)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Yedekler sürüm bilgisi ve bütünlük kontrolü içerir. Geri yükleme öncesinde mevcut veriler otomatik güvenlik anlık görüntüsü olarak korunur.
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={() => { const blob = new Blob([exportDatabaseJSON()], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `bymatematik-yedek-${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(url); }}
              className="px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>JSON Yedeği İndir</span>
            </button>

            <label className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Yedekten Geri Yükle</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          {savedSuccess ? (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle className="w-4 h-4" />
              <span>Ayarlar başarıyla kaydedildi!</span>
            </span>
          ) : (
            <span className="text-xs text-slate-400">
              Değişiklikleri uygulamak için kaydet butonuna basın.
            </span>
          )}

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            Ayarları Kaydet
          </button>
        </div>
      </form>
    </div>
  );
};
