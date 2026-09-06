import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  ARABIC_DAYS,
  ARABIC_MONTHS,
  formatDateKey,
  parseDateKey,
} from '../utils/dateUtils';

export const CalendarView: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    openDayDetails,
    isDayFullyBooked,
    appointments,
  } = useApp();

  const [viewDate, setViewDate] = useState<Date>(() => parseDateKey(selectedDate) || new Date());

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleGoToday = () => {
    const today = new Date();
    setViewDate(today);
    setSelectedDate(formatDateKey(today));
    openDayDetails(formatDateKey(today));
  };

  // Build Month Grid
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const calendarCells = [];

  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const cellDate = new Date(currentYear, currentMonth - 1, day);
    calendarCells.push({
      date: cellDate,
      dateKey: formatDateKey(cellDate),
      dayNumber: day,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate = new Date(currentYear, currentMonth, d);
    calendarCells.push({
      date: cellDate,
      dateKey: formatDateKey(cellDate),
      dayNumber: d,
      isCurrentMonth: true,
    });
  }

  // Next month leading days
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let d = 1; d <= remainingCells; d++) {
    const cellDate = new Date(currentYear, currentMonth + 1, d);
    calendarCells.push({
      date: cellDate,
      dateKey: formatDateKey(cellDate),
      dayNumber: d,
      isCurrentMonth: false,
    });
  }

  const todayKey = formatDateKey(new Date());

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Apple-style Calendar Card */}
      <div className="bg-white rounded-[28px] border border-neutral-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden transition-all">
        
        {/* Apple Top Header: Large Month Title + Segmented Controls */}
        <div className="px-5 py-4 sm:px-7 sm:py-5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 font-sans">
                {ARABIC_MONTHS[currentMonth].split('/')[0].trim()}
              </h2>
              <span className="text-base sm:text-lg font-bold text-neutral-400">
                {currentYear}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-neutral-400 mt-0.5">
              انقر على أي يوم لفتح جدول المواعيد والحجز السريع
            </p>
          </div>

          {/* Apple-style Segmented Navigation */}
          <div className="flex items-center gap-1 bg-neutral-100/90 p-1 rounded-2xl border border-neutral-200/50 shadow-2xs">
            <button
              onClick={handlePrevMonth}
              title="الشهر السابق"
              className="p-1.5 sm:p-2 rounded-xl text-neutral-600 hover:text-black hover:bg-white active:scale-95 transition-all"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              onClick={handleGoToday}
              className="px-3 py-1 rounded-xl text-xs font-bold text-neutral-800 hover:text-black hover:bg-white active:scale-95 transition-all"
            >
              اليوم
            </button>

            <button
              onClick={handleNextMonth}
              title="الشهر التالي"
              className="p-1.5 sm:p-2 rounded-xl text-neutral-600 hover:text-black hover:bg-white active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Days of Week Header (Apple minimal subtle gray typography) */}
        <div className="grid grid-cols-7 border-b border-neutral-100 text-center py-2.5 px-2.5 sm:px-4">
          {['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map((day, idx) => (
            <div
              key={day}
              className={`text-[11px] sm:text-xs font-bold tracking-wider ${
                idx === 5 ? 'text-red-500' : 'text-neutral-400'
              }`}
            >
              <span className="hidden sm:inline">{ARABIC_DAYS[idx]}</span>
              <span className="sm:hidden">{day}</span>
            </div>
          ))}
        </div>

        {/* Calendar Days Grid: PURE CIRCLES ONLY, NO SQUARE BOXES */}
        <div className="grid grid-cols-7 gap-y-3 gap-x-1 sm:gap-x-2 p-3.5 sm:p-6">
          {calendarCells.map((cell) => {
            const isToday = cell.dateKey === todayKey;
            const dayApts = Array.isArray(appointments) ? appointments.filter((a) => a && a.date === cell.dateKey) : [];
            const aptCount = dayApts.length;
            const isFull = isDayFullyBooked(cell.dateKey);
            const hasWork = aptCount > 0 && !isFull;
            const isEmpty = aptCount === 0;

            if (!cell.isCurrentMonth) {
              return (
                <div
                  key={cell.dateKey}
                  className="flex flex-col items-center justify-center p-1 opacity-20 cursor-default"
                >
                  <span className="text-xs sm:text-sm font-medium text-neutral-400">
                    {cell.dayNumber}
                  </span>
                </div>
              );
            }

            return (
              <button
                key={cell.dateKey}
                type="button"
                onClick={() => openDayDetails(cell.dateKey)}
                className="group relative flex flex-col items-center justify-center focus:outline-none active:scale-95 transition-transform"
              >
                {/* The Perfect Apple-Style Circle (Green if empty, Orange if has work, Red if fully booked) */}
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex flex-col items-center justify-center transition-all duration-150 ${
                    isFull
                      ? 'border-2 border-red-500 bg-red-50/50 text-red-950 font-black shadow-2xs group-hover:scale-105'
                      : hasWork
                      ? 'border-2 border-orange-500 bg-orange-50/50 text-orange-950 font-black shadow-2xs group-hover:scale-105'
                      : 'border-2 border-emerald-500 bg-emerald-50/40 text-emerald-950 font-black shadow-2xs group-hover:scale-105'
                  }`}
                >
                  <span className="text-xs sm:text-sm font-black tracking-tight leading-none">
                    {cell.dayNumber}
                  </span>
                </div>

                {/* Sub-indicator (Today label or small status dot) */}
                <div className="flex items-center gap-1 mt-1 min-h-[6px]">
                  {isToday ? (
                    <span className="text-[9px] font-black text-red-600 leading-none">
                      اليوم
                    </span>
                  ) : isFull ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  ) : hasWork ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Minimalist Legend Pill Bar */}
        <div className="py-3 px-4 bg-neutral-50/80 border-t border-neutral-100 flex flex-wrap items-center justify-center gap-4 sm:gap-7 text-[11px] font-bold text-neutral-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 bg-emerald-50/50"></span>
            <span>دائرة خضراء: يوم فارغ متاح</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-orange-500 bg-orange-50/50"></span>
            <span>دائرة برتقالية: فيه شغل ومواعيد</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-red-500 bg-red-50/50"></span>
            <span>دائرة حمراء: مقبط بالكامل</span>
          </div>
        </div>

      </div>
    </div>
  );
};
