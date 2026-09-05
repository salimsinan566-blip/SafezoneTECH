import React, { useState } from 'react';
import { Shield, Lock, Delete } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const PinLockModal: React.FC = () => {
  const { unlockApp } = useApp();
  const [pin, setPin] = useState('');
  const [hasError, setHasError] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setHasError(false);

      if (nextPin.length === 4) {
        setTimeout(() => {
          const ok = unlockApp(nextPin);
          if (!ok) {
            setHasError(true);
            setPin('');
          }
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setHasError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl border border-amber-300/40 text-center">
        
        {/* Brand Shield Logo */}
        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg shadow-amber-500/25 flex items-center justify-center text-slate-950 mb-4 ring-4 ring-amber-200">
          <Shield className="w-9 h-9 stroke-[2.2]" />
        </div>

        <h2 className="text-xl font-black text-slate-900 mb-1">
          SAFE <span className="text-amber-500">ZONE</span>
        </h2>
        <p className="text-xs font-bold text-slate-500 mb-6">
          أدخل رمز الأمان (PIN) لفتح التطبيق
        </p>

        {/* PIN Dots Display */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {[0, 1, 2, 3].map((idx) => {
            const filled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  filled
                    ? 'bg-amber-500 scale-110 shadow-sm shadow-amber-500/50'
                    : 'bg-slate-200 border border-slate-300'
                } ${hasError ? 'bg-rose-500 animate-bounce' : ''}`}
              />
            );
          })}
        </div>

        {hasError && (
          <p className="text-xs font-bold text-rose-600 mb-4 animate-shake">
            رمز المرور غير صحيح، حاول مرة أخرى
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-slate-100 hover:bg-amber-100 active:bg-amber-400 text-slate-900 active:text-slate-950 font-black text-xl transition-all shadow-sm flex items-center justify-center"
            >
              {digit}
            </button>
          ))}

          {/* Empty spacer */}
          <div></div>

          {/* 0 */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-slate-100 hover:bg-amber-100 active:bg-amber-400 text-slate-900 active:text-slate-950 font-black text-xl transition-all shadow-sm flex items-center justify-center"
          >
            0
          </button>

          {/* Backspace */}
          <button
            type="button"
            onClick={handleDelete}
            title="مسح"
            className="h-14 rounded-2xl bg-slate-100 hover:bg-rose-100 active:bg-rose-200 text-slate-600 active:text-rose-700 font-black text-xl transition-all shadow-sm flex items-center justify-center"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

      </div>
    </div>
  );
};
