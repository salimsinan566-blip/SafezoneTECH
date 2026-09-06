import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, Calendar, UserCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatTimeArabic, parseDateKey, ARABIC_DAYS, ARABIC_MONTHS } from '../utils/dateUtils';

export const QuickBookModal: React.FC = () => {
  const {
    selectedSlotToBook,
    closeModals,
    quickBookAppointment,
    currentUser,
    setIsAuthModalOpen,
  } = useApp();

  const [customerName, setCustomerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  if (!selectedSlotToBook) return null;

  const { date, startTime, endTime, durationMinutes } = selectedSlotToBook;
  const parsed = parseDateKey(date);
  const dayName = ARABIC_DAYS[parsed.getDay()];
  const dayNum = parsed.getDate();
  const monthName = ARABIC_MONTHS[parsed.getMonth()].split('/')[0].trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    setIsSubmitting(true);
    await quickBookAppointment(customerName.trim());
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-black/10 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-black/10 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-black">
              تأكيد حجز الموعد
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              أدخل اسم العميل لحجز الوقت مباشرة
            </p>
          </div>
          <button
            onClick={closeModals}
            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slot Info Card */}
        <div className="p-4 bg-neutral-50 border-b border-black/5 space-y-2 text-xs">
          <div className="flex items-center justify-between text-neutral-700 font-semibold">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-black" />
              <span>{dayName}، {dayNum} {monthName} ({date})</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono font-bold text-black">
              <Clock className="w-4 h-4 text-black" />
              <span>{formatTimeArabic(startTime)} ← {formatTimeArabic(endTime)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-neutral-200/60 text-[11px] text-neutral-500">
            <span>المدة: {durationMinutes >= 60 ? `${(durationMinutes / 60).toFixed(1)} ساعة` : `${durationMinutes} دقيقة`}</span>
            <div className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-black" />
              <span>الحجز باسم الفني: <strong className="text-black">{currentUser?.name || 'فني SAFE ZONE'}</strong></span>
            </div>
          </div>
        </div>

        {/* Form: Customer Name Only */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-black text-neutral-800 mb-1.5">
              اسم العميل <span className="text-rose-500">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              required
              placeholder="مثال: أحمد جاسم، معرض النور، شركة الرافدين..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/20 focus:border-black focus:ring-1 focus:ring-black text-sm font-bold text-black outline-hidden transition-all placeholder:text-neutral-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !customerName.trim()}
              className="flex-1 py-2.5 rounded-xl bg-black hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-black transition-colors"
            >
              {isSubmitting ? 'جاري الحجز...' : 'تأكيد الحجز'}
            </button>
            <button
              type="button"
              onClick={closeModals}
              className="px-4 py-2.5 rounded-xl border border-black/10 hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
