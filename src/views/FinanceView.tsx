import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  TrendingUp,
  Package,
  Calendar,
  User,
  CreditCard,
  CheckCircle,
  AlertCircle,
  FileText,
  Trash2,
  XCircle,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateTurkish } from '../utils/formatters';

export const FinanceView: React.FC = () => {
  const {
    teacher,
    students,
    transactions,
    packages,
    voidTransaction: cancelTransaction,
    openModal,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'transactions' | 'packages'>('transactions');
  const [studentFilter, setStudentFilter] = useState<string>('all');

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    if (studentFilter !== 'all' && t.studentId !== studentFilter) return false;
    return true;
  });

  // Filter packages
  const filteredPackages = packages.filter((p) => {
    if (studentFilter !== 'all' && p.studentId !== studentFilter) return false;
    return true;
  });

  // Summary figures
  const totalRevenue = transactions
    .filter((t) => t.type === 'Ödeme Alındı' && !t.isCancelled)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalEarned = transactions
    .filter((t) => (t.type === 'Ders Ücreti' || t.type === 'Paket Satışı') && !t.isCancelled)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutstanding = Math.max(0, totalEarned - totalRevenue);

  const activePackageCount = packages.filter((p) => p.status === 'Aktif').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Metric Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-display flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-600" />
              <span>Finans & Ders Paketleri</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Tahsilat kayıtları, paket sayaçları ve veli cari hesap dökümü
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => openModal('addPayment')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Ödeme / Paket Girişi</span>
            </button>

            <button
              onClick={() => openModal('pdfPreview', { reportType: 'finance_summary' })}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Finansal PDF Rapor</span>
            </button>
          </div>
        </div>

        {/* Top Metric Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60">
            <span className="text-xs font-bold text-sky-700 dark:text-sky-400 block">
              Toplam Kazanılan
            </span>
            <div className="text-2xl font-black text-sky-900 dark:text-sky-100 font-display mt-1">
              {formatCurrency(totalEarned, teacher.currency)}
            </div>
            <span className="text-[11px] text-sky-600 font-semibold mt-0.5 block">
              Ders ücretleri + paket satışları
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">
              Toplam Tahsil Edilen Tutar
            </span>
            <div className="text-2xl font-black text-emerald-900 dark:text-emerald-100 font-display mt-1">
              {formatCurrency(totalRevenue, teacher.currency)}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
              Alınan ödemeler
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block">
              Bekleyen Ödeme
            </span>
            <div className="text-2xl font-black text-amber-900 dark:text-amber-100 font-display mt-1">
              {formatCurrency(totalOutstanding, teacher.currency)}
            </div>
            <span className="text-[11px] text-amber-600 font-semibold mt-0.5 block">
              Kazanılan - tahsil edilen
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 block">
              Aktif Ders Paketleri
            </span>
            <div className="text-2xl font-black text-indigo-900 dark:text-indigo-100 font-display mt-1">
              {activePackageCount} Paket
            </div>
            <span className="text-[11px] text-indigo-600 font-semibold mt-0.5 block">
              Kullanımda olan krediler
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 block">
              Banka / IBAN Hesabı
            </span>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 font-mono truncate">
              {teacher.bankName || 'Banka'} • {teacher.iban || 'TR00...'}
            </div>
            <span className="text-[11px] text-blue-600 font-semibold mt-0.5 block">
              {teacher.bankAccountHolder || `${teacher.firstName} ${teacher.lastName}`}
            </span>
          </div>
        </div>

        {/* Tab & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold self-start">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-1.5 rounded-xl transition-all ${
                activeTab === 'transactions'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Cari İşlemler & Tahsilatlar ({transactions.length})
            </button>
            <button
              onClick={() => setActiveTab('packages')}
              className={`px-4 py-1.5 rounded-xl transition-all ${
                activeTab === 'packages'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Ders Paketleri & Kalan Krediler ({packages.length})
            </button>
          </div>

          {/* Student Filter */}
          <select
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            className="text-xs font-semibold p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">Tüm Öğrenciler</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions List View */}
      {activeTab === 'transactions' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTransactions.length === 0 && <div className="py-12 text-center"><DollarSign className="w-9 h-9 mx-auto text-slate-300 mb-3"/><p className="text-sm font-black text-slate-700 dark:text-slate-200">Henüz finans hareketi yok</p><p className="text-xs text-slate-500 mt-1">İlk ödeme veya paket kaydını ekleyerek başlayabilirsiniz.</p><button onClick={() => openModal('addPayment')} className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">Ödeme / Paket Ekle</button></div>}
            {filteredTransactions.map((tx) => {
              const student = students.find((s) => s.id === tx.studentId);
              const isIncome = tx.type === 'Ödeme Alındı' || tx.type === 'Paket Satışı';

              return (
                <div
                  key={tx.id}
                  className={`py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                    tx.isCancelled ? 'opacity-40 line-through' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                        isIncome
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {isIncome ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {student ? `${student.firstName} ${student.lastName}` : 'Genel İşlem'}
                        <span className="text-xs font-normal text-slate-400 ml-2">
                          ({tx.type})
                        </span>
                      </div>
                      <div className="text-slate-500 mt-0.5">
                        {tx.description || tx.paymentMethod} • {formatDateTurkish(tx.date, 'short')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span
                      className={`text-base font-black font-mono ${
                        isIncome ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatCurrency(tx.amount, teacher.currency)}
                    </span>

                    {!tx.isCancelled && (
                      <button
                        onClick={() => { if (window.confirm('Bu finans kaydı iptal edilecek. Kayıt geçmişte korunacak. Devam etmek istiyor musunuz?')) cancelTransaction(tx.id, 'Kullanıcı tarafından iptal edildi'); }}
                        className="text-[11px] font-bold text-slate-400 hover:text-rose-600 transition-colors"
                        title="İptal Et / Düzelt"
                      >
                        İptal Et
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Packages Grid View */}
      {activeTab === 'packages' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPackages.length === 0 && <div className="md:col-span-2 py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800"><Package className="w-9 h-9 mx-auto text-slate-300 mb-3"/><p className="text-sm font-black text-slate-700 dark:text-slate-200">Aktif paket bulunmuyor</p><p className="text-xs text-slate-500 mt-1">Ders paketi kullanan öğrenciler için yeni paket oluşturabilirsiniz.</p><button onClick={() => openModal('addPayment')} className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">Paket Oluştur</button></div>}
          {filteredPackages.map((pkg) => {
            const student = students.find((s) => s.id === pkg.studentId);
            const isFinished = pkg.remainingLessons === 0;

            return (
              <div
                key={pkg.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        isFinished
                          ? 'bg-slate-100 text-slate-600'
                          : pkg.remainingLessons === 1
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {isFinished ? 'Tamamlandı' : pkg.status}
                    </span>

                    <span className="text-xs font-semibold text-slate-500">
                      {formatDateTurkish(pkg.startDate, 'short')}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                      {pkg.packageName}
                    </h3>
                    <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                      👤 {student ? `${student.firstName} ${student.lastName} (${student.gradeLevel})` : 'Öğrenci'}
                    </div>
                  </div>

                  {/* Lesson Count Progress Bar */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Kalan Ders Kredisi</span>
                      <span className="text-indigo-600">
                        {pkg.remainingLessons} / {pkg.totalLessons} Ders
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all"
                        style={{
                          width: `${(pkg.remainingLessons / pkg.totalLessons) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-1">
                    <span>Paket Bedeli: {formatCurrency(pkg.totalAmount, teacher.currency)}</span>
                    <span className="text-emerald-600 font-bold">
                      {pkg.usedLessons} ders kullanıldı
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {student && (
                    <button
                      onClick={() =>
                        openModal('whatsapp', {
                          student,
                          templateType: 'payment_reminder',
                        })
                      }
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl"
                    >
                      WhatsApp Bilgisi
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
