import React, { useState } from 'react';
import { Lock, Unlock, Delete, ShieldCheck, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LockScreenModal: React.FC = () => {
  const { security, unlockAppWithPin, teacher } = useApp();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleKeyPress = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      setErrorMsg('');

      // Auto check when length matches configured pin
      if (newPin === security.pinCode) {
        unlockAppWithPin(newPin);
      } else if (security.pinCode && newPin.length === security.pinCode.length) {
        setErrorMsg('Hatalı PIN Kodu! Lütfen tekrar deneyin.');
        setTimeout(() => setPin(''), 600);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  return (
    <div className="modal-overlay fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-slate-900 rounded-3xl p-8 border border-slate-800 text-center space-y-6 shadow-2xl animate-in zoom-in-95">
        {/* Brand & Lock Icon */}
        <div className="space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/20">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight font-display">
            bymatematik Kilitli
          </h2>
          <p className="text-xs text-slate-400">
            {teacher.firstName} {teacher.lastName} ({teacher.brandName})
          </p>
        </div>

        {/* PIN Dots Display */}
        <div className="flex items-center justify-center gap-3 py-2">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                pin.length > index
                  ? 'bg-indigo-500 scale-110 shadow-md shadow-indigo-500/50'
                  : 'bg-slate-800 border border-slate-700'
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <div className="text-xs font-semibold text-rose-400 flex items-center justify-center gap-1.5 animate-shake">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 pt-2 max-w-xs mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="w-16 h-16 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white font-bold text-xl transition-all border border-slate-700/50 flex items-center justify-center mx-auto"
            >
              {digit}
            </button>
          ))}
          <div className="w-16 h-16" />
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white font-bold text-xl transition-all border border-slate-700/50 flex items-center justify-center mx-auto"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="w-16 h-16 rounded-2xl bg-slate-800/40 hover:bg-slate-700/50 active:scale-95 text-slate-400 hover:text-white font-bold transition-all border border-slate-700/30 flex items-center justify-center mx-auto"
            title="Sil"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        <div className="text-[11px] text-slate-500 pt-2">
          PIN kodunuz Ayarlar bölümünde belirlediğiniz 4 haneli koddur.
        </div>
      </div>
    </div>
  );
};
