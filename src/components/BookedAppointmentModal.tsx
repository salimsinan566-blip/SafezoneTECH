import React from 'react';
import { X, Clock, Calendar, CheckCircle2, Trash2, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatTimeArabic, parseDateKey, ARABIC_DAYS, ARABIC_MONTHS } from '../utils/dateUtils';

export const BookedAppointmentModal: React.FC = () => {
  const {
    viewingAppointment,
    closeModals,
    toggleComplete,
    deleteAppointment,
  } = useApp();

  if (!viewingAppointment) return null;

  const {
    id,
    customerName,
    customerPhone,
    location,
    date,
    startTime,
    endTime,
    durationHours,
    technicianName,
    bookedByTechnician,
    isCompleted,
  } = viewingAppointment;

  const parsed = parseDateKey(date);
  const dayName = ARABIC_DAYS[parsed.getDay()];
  const dayNum = parsed.getDate();
  const monthName = ARABIC_MONTHS[parsed.getMonth()].split('/')[0].trim();
  const techName = bookedByTechnician || technicianName || 'فني SAFE ZONE';

  const handleDelete = () => {
    if (window.confirm(`هل أنت متأكد من إلغاء وحذف موعد [${customerName}]؟`)) {
      deleteAppointment(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-black/10 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-black/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-neutral-800'}`}></span>
            <div>
              <h3 className="text-base font-black text-black">
                تفاصيل الموعد المحجوز
              </h3>
              <p className="text-[11px] text-neutral-500">
                {isCompleted ? 'الموعد مكتمل ومُنجز ✓' : 'الموعد قيد الانتظار والتنفيذ'}
              </p>
            </div>
          </div>
          <button
            onClick={closeModals}
            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Main Banner */}
        <div className="p-5 bg-neutral-50 border-b border-black/5 text-center">
          <span className="text-[11px] font-bold text-neutral-400 block mb-1">اسم العميل</span>
          <h2 className="text-xl font-black text-black">
            {customerName}
          </h2>
          {customerPhone && (
            <div className="mt-1 text-xs font-mono font-bold text-neutral-600">
              {customerPhone}
            </div>
          )}
          {location && (
            <div className="mt-1 text-xs text-neutral-500">
              {location}
            </div>
          )}
        </div>

        {/* Details Grid */}
        <div className="p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-neutral-100">
            <span className="text-neutral-500 flex items-center gap-1.5 font-medium">
              <Calendar className="w-4 h-4 text-black" />
              التاريخ
            </span>
            <span className="font-bold text-black">
              {dayName}، {dayNum} {monthName} ({date})
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-neutral-100">
            <span className="text-neutral-500 flex items-center gap-1.5 font-medium">
              <Clock className="w-4 h-4 text-black" />
              الساعة المحجوزة
            </span>
            <span className="font-bold font-mono text-black text-sm">
              {formatTimeArabic(startTime)}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-neutral-100">
            <span className="text-neutral-500 flex items-center gap-1.5 font-medium">
              <User className="w-4 h-4 text-black" />
              الفني الحاجز
            </span>
            <span className="font-black text-black bg-neutral-100 px-2 py-0.5 rounded-md">
              {techName}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-neutral-50 border-t border-black/10 flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleComplete(id)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors ${
              isCompleted
                ? 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300'
                : 'bg-black text-white hover:bg-neutral-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isCompleted ? 'تحويل إلى قيد التنفيذ' : 'تعليم كمكتمل ✓'}</span>
          </button>

          <button
            type="button"
            onClick={handleDelete}
            title="إلغاء وحذف الموعد"
            className="p-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
