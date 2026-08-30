import { toLocalDateInputValue } from '../../utils/formatters';
import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  DollarSign,
  User,
  Calendar,
  CheckCircle,
  Package,
  CreditCard,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod } from '../../types';

interface AddPaymentModalProps {
  initialStudentId?: string;
  onClose: () => void;
}

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({
  initialStudentId,
  onClose,
}) => {
  const { students, transactions, addTransaction, addPackage } = useApp();
  const activeStudents = students.filter((s) => !s.isArchived);

  const [studentId, setStudentId] = useState(
    initialStudentId || (activeStudents[0]?.id ?? '')
  );
  const [type, setType] = useState<'Ödeme Alındı' | 'Paket Satışı' | 'Ders Ücreti'>('Ödeme Alındı');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Havale/EFT');
  const [date, setDate] = useState(toLocalDateInputValue());
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  // Package bundle toggle
  const [createPackageToo, setCreatePackageToo] = useState(false);
  const [packageLessonCount, setPackageLessonCount] = useState(4);

  const outstandingBalance = useMemo(() => {
    return transactions
      .filter((t) => t.studentId === studentId && !t.isCancelled)
      .reduce((sum, t) => {
        if (t.type === 'Ders Ücreti' || t.type === 'Paket Satışı') return sum + Number(t.amount || 0);
        if (t.type === 'Ödeme Alındı') return sum - Number(t.amount || 0);
        return sum;
      }, 0);
  }, [studentId, transactions]);

  useEffect(() => {
    if (type === 'Ödeme Alındı') setAmount(Math.max(0, Math.round(outstandingBalance * 100) / 100));
  }, [studentId, type, outstandingBalance]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!studentId) { setError('Öğrenci seçimi zorunludur.'); return; }
    if (!Number.isFinite(amount) || amount <= 0) { setError('Tutar sıfırdan büyük olmalıdır.'); return; }
    if (type === 'Paket Satışı' && packageLessonCount <= 0) { setError('Paket ders sayısı geçersiz.'); return; }

    try {
    // Paket satışında addPackage zaten borç/satış hareketini oluşturur.
    // Aynı "Paket Satışı" kaydını ikinci kez eklemeyerek mükerrer finans hareketini önlüyoruz.
    if (type === 'Paket Satışı') {
      addPackage({
        studentId,
        packageName: `${packageLessonCount} Derslik Özel Ders Paketi`,
        totalLessons: Number(packageLessonCount),
        usedLessons: 0,
        remainingLessons: Number(packageLessonCount),
        totalAmount: Number(amount),
        startDate: date,
        status: 'Aktif',
      });
      // Bu ekran "ödeme/tahsilat" girişi olduğu için paket bedelini ayrıca tahsilat olarak kaydet.
      addTransaction({
        studentId,
        type: 'Ödeme Alındı',
        amount: Number(amount),
        date,
        paymentMethod,
        description: description.trim() || `${packageLessonCount} derslik paket tahsilatı`,
        isCancelled: false,
      });
    } else {
      addTransaction({
        studentId,
        type,
        amount: Number(amount),
        date,
        paymentMethod,
        description: description.trim() || (type === 'Ödeme Alındı' ? 'Ödeme tahsilatı' : 'Ders ücreti borcu'),
        isCancelled: false,
      });

      if (createPackageToo) {
        addPackage({
          studentId,
          packageName: `${packageLessonCount} Derslik Özel Ders Paketi`,
          totalLessons: Number(packageLessonCount),
          usedLessons: 0,
          remainingLessons: Number(packageLessonCount),
          totalAmount: Number(amount),
          startDate: date,
          status: 'Aktif',
        });
      }
    }

    onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Finans kaydı oluşturulamadı.');
    }
  };

  return (
    <div className="modal-overlay fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full my-6 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">
                Ödeme & Tahsilat Girişi
              </h3>
              <p className="text-xs text-slate-500">
                Öğrenci cari hesabına tahsilat veya paket kaydı ekleyin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-700 dark:text-rose-300">{error}</div>}
          {/* Student Picker */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Öğrenci *
            </label>
            <select
              required
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold focus:outline-none"
            >
              {activeStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.gradeLevel}) • Veli: {s.parentName || '-'}
                </option>
              ))}
            </select>
          </div>

          {/* Type & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                İşlem Türü
              </label>
              <select
                value={type}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setType(val);
                  if (val === 'Paket Satışı') setCreatePackageToo(true);
                }}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none font-medium"
              >
                <option value="Ödeme Alındı">Ödeme Alındı (Tahsilat)</option>
                <option value="Paket Satışı">Paket Satışı & Tanımı</option>
                <option value="Ders Ücreti">Ders Ücreti Borcu</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tutar (₺) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Payment Method & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Ödeme Yöntemi
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
              >
                <option value="Havale/EFT">Havale / EFT</option>
                <option value="Nakit">Nakit</option>
                <option value="FAST">FAST</option>
                <option value="Kredi Kartı">Kredi Kartı / POS</option>
                <option value="Diğer">Diğer</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                İşlem Tarihi
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Package Option */}
          <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                  Ders Paketi Kredisi Ekle
                </span>
              </div>
              <input
                type="checkbox"
                checked={createPackageToo || type === 'Paket Satışı'}
                onChange={(e) => setCreatePackageToo(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
            </div>

            {(createPackageToo || type === 'Paket Satışı') && (
              <div className="pt-1 flex items-center gap-2 animate-in fade-in">
                <span className="text-xs text-slate-600 dark:text-slate-400">Paket Ders Sayısı:</span>
                <select
                  value={packageLessonCount}
                  onChange={(e) => setPackageLessonCount(Number(e.target.value))}
                  className="text-xs p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 font-bold"
                >
                  <option value={4}>4 Derslik Paket</option>
                  <option value={8}>8 Derslik Paket</option>
                  <option value={12}>12 Derslik Paket</option>
                  <option value={16}>16 Derslik Paket</option>
                  <option value={20}>20 Derslik Paket</option>
                </select>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Açıklama
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Örn: Ekim ayı 4 derslik paket ücreti"
              className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Ödemeyi Kaydet</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
