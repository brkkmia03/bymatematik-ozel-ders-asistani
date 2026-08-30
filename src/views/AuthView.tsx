import React, { useState } from 'react';
import { Instagram, LockKeyhole, Mail, UserPlus } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AuthView: React.FC = () => {
  const { loginUser, registerUser, resetPassword, passwordRecoveryMode, updatePassword } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [forgotMode, setForgotMode] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    if (!email.trim() || password.length < 6) {
      setError('Geçerli bir e-posta adresi ve en az 6 karakterli şifre girin.');
      setBusy(false);
      return;
    }
    const ok = mode === 'login'
      ? await loginUser(email.trim(), password)
      : await registerUser(email.trim(), password, name.trim());
    if (!ok) setError(mode === 'login' ? 'Giriş yapılamadı. E-posta, şifre ve hesap doğrulamasını kontrol edin.' : 'Hesap oluşturulamadı.');
    if (ok && mode === 'register') {
      setInfo('Kayıt alındı. E-posta doğrulaması açıksa gelen bağlantıya tıklayıp ardından giriş yapın.');
      setMode('login');
      setPassword('');
    }
    setBusy(false);
  };

  const forgotPassword = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setInfo('');
    if (!email.trim()) { setError('E-posta adresinizi girin.'); return; }
    setBusy(true);
    const ok = await resetPassword(email.trim());
    setBusy(false);
    if (ok) setInfo('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.');
    else setError('Şifre sıfırlama e-postası gönderilemedi.');
  };

  if (forgotMode && !passwordRecoveryMode) {
    return (
      <div className="pwa-shell safe-area-top safe-area-bottom safe-area-x bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 text-slate-900 dark:text-slate-100">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-xl mb-3">b</div>
            <h1 className="text-2xl font-black">Şifremi Unuttum</h1>
            <p className="text-sm text-slate-500 mt-2">Kayıtlı e-posta adresinizi girin. Şifre yenileme bağlantısını size gönderelim.</p>
          </div>
          <form onSubmit={forgotPassword} className="space-y-4">
            <div>
              <label className="text-xs font-bold">E-posta</label>
              <div className="relative mt-1"><Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" /><input autoFocus type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" /></div>
            </div>
            {info && <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl">{info}</p>}
            {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl">{error}</p>}
            <button disabled={busy} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black transition-colors disabled:opacity-60">{busy ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}</button>
            <button type="button" onClick={() => { setForgotMode(false); setError(''); setInfo(''); }} className="w-full py-2.5 rounded-xl text-sm font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800">Giriş ekranına dön</button>
          </form>
        </div>
      </div>
    );
  }

  if (passwordRecoveryMode) {
    const saveNewPassword = async (e: React.FormEvent) => {
      e.preventDefault(); setError('');
      if (newPassword.length < 6) { setError('Yeni şifre en az 6 karakter olmalıdır.'); return; }
      setBusy(true); const ok = await updatePassword(newPassword); setBusy(false);
      if (!ok) setError('Şifre güncellenemedi.');
    };
    return (
      <div className="pwa-shell safe-area-top safe-area-bottom safe-area-x bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 text-slate-900 dark:text-slate-100">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-6 sm:p-8">
          <h1 className="text-2xl font-black text-center">Yeni Şifre Belirle</h1>
          <p className="text-sm text-slate-500 text-center mt-2 mb-6">Hesabınız için yeni şifrenizi oluşturun.</p>
          <form onSubmit={saveNewPassword} className="space-y-4">
            <div><label className="text-xs font-bold">Yeni Şifre</label><div className="relative mt-1"><LockKeyhole className="w-4 h-4 absolute left-3 top-3 text-slate-400" /><input autoFocus type="password" required minLength={6} value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" /></div></div>
            {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl">{error}</p>}
            <button disabled={busy} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black transition-colors disabled:opacity-60">{busy?'Güncelleniyor...':'Şifreyi Güncelle'}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="pwa-shell safe-area-top safe-area-bottom safe-area-x bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-6 sm:p-8">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-xl mb-3">b</div>
          <h1 className="text-2xl font-black">bymatematik</h1>
          <p className="text-sm text-slate-500 mt-1">Özel Ders Asistanı</p>
          <a className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 mt-3" href="https://www.instagram.com/bymatematiik/" target="_blank" rel="noreferrer">
            <Instagram className="w-4 h-4" /> @bymatematiik
          </a>
        </div>

        <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-5">
          <button type="button" onClick={() => setMode('login')} className={`py-2 rounded-lg text-xs font-bold ${mode === 'login' ? 'bg-white dark:bg-slate-700 shadow' : 'text-slate-500'}`}>Giriş Yap</button>
          <button type="button" onClick={() => setMode('register')} className={`py-2 rounded-lg text-xs font-bold ${mode === 'register' ? 'bg-white dark:bg-slate-700 shadow' : 'text-slate-500'}`}>Hesap Oluştur</button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-xs font-bold">Ad Soyad</label>
              <div className="relative mt-1"><UserPlus className="w-4 h-4 absolute left-3 top-3 text-slate-400" /><input required value={name} onChange={e => setName(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" /></div>
            </div>
          )}
          <div>
            <label className="text-xs font-bold">E-posta</label>
            <div className="relative mt-1"><Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" /><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" /></div>
          </div>
          <div>
            <label className="text-xs font-bold">Şifre</label>
            <div className="relative mt-1"><LockKeyhole className="w-4 h-4 absolute left-3 top-3 text-slate-400" /><input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" /></div>
          </div>
          {info && <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl">{info}</p>}
          {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl">{error}</p>}
          {mode === 'login' && <button type="button" onClick={() => { setForgotMode(true); setError(''); setInfo(''); }} disabled={busy} className="text-xs font-bold text-indigo-600 hover:underline disabled:opacity-50">Şifremi unuttum</button>}
          <button disabled={busy} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black transition-colors disabled:opacity-60">{busy ? 'İşleniyor...' : (mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur')}</button>
        </form>
        <p className="text-[11px] text-slate-400 text-center mt-5">Hesap güvenliği ve oturum yönetimi Supabase Auth üzerinden sağlanır.</p>
      </div>
    </div>
  );
};
