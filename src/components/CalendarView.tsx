import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Sparkles,
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
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Calendar Card */}
      <div className="bg-white rounded-3xl border border-black/10 shadow-xs overflow-hidden">
        
        {/* Top Header: Month Nav */}
        <div className="p-4 sm:p-5 border-b border-black/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black text-black">
              <span>{ARABIC_MONTHS[currentMonth].split('/')[0].trim()}</span>
              <span className="mr-2 text-neutral-500 font-bold">{currentYear}</span>
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevMonth}
              title="الشهر السابق"
              className="p-2 rounded-xl border border-black/10 hover:bg-neutral-100 text-black active:scale-95 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleGoToday}
              className="px-3 py-1.5 rounded-xl border border-black/10 hover:bg-black hover:text-white text-xs font-black text-black active:scale-95 transition-all"
            >
              اليوم
            </button>

            <button
              onClick={handleNextMonth}
              title="الشهر التالي"
              className="p-2 rounded-xl border border-black/10 hover:bg-neutral-100 text-black active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-black/10 bg-neutral-50 text-center">
          {['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map((day, idx) => (
            <div
              key={day}
              className={`py-2 text-[11px] sm:text-xs font-black ${
                idx === 5 ? 'text-rose-600' : 'text-neutral-600'
              }`}
            >
              <span className="hidden sm:inline">{ARABIC_DAYS[idx]}</span>
              <span className="sm:hidden">{day}</span>
            </div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 p-2.5 sm:p-4">
          {calendarCells.map((cell) => {
            const isToday = cell.dateKey === todayKey;
            const isFull = isDayFullyBooked(cell.dateKey);
            const dayApts = appointments.filter((a) => a.date === cell.dateKey);
            const aptCount = dayApts.length;

            return (
              <button
                key={cell.dateKey}
                type="button"
                onClick={() => openDayDetails(cell.dateKey)}
                className={`relative w-full aspect-square rounded-2xl flex flex-col items-center justify-center p-1 transition-all active:scale-95 ${
                  !cell.isCurrentMonth
                    ? 'opacity-25 bg-neutral-50 border border-neutral-100 text-neutral-400'
                    : isFull
                    ? 'bg-white border-2 border-rose-500 shadow-xs hover:bg-rose-50/40 text-black'
                    : 'bg-white border-2 border-emerald-500 shadow-xs hover:bg-emerald-50/40 text-black'
                }`}
              >
                {/* Today Marker */}
                {isToday && (
                  <span className="absolute top-1 right-1 text-[7px] sm:text-[8px] font-black px-1 rounded-full bg-black text-white leading-tight">
                    اليوم
                  </span>
                )}

                {/* Day Number Only */}
                <span
                  className={`text-sm sm:text-lg font-black tracking-tight ${
                    isToday ? 'underline underline-offset-2' : ''
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {/* Simple Black Dots for Appointments */}
                {cell.isCurrentMonth && (
                  <div className="flex items-center gap-0.5 sm:gap-1 mt-1 min-h-[6px]">
                    {aptCount > 0 ? (
                      aptCount <= 4 ? (
                        Array.from({ length: aptCount }).map((_, i) => (
                          <span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-black"
                          ></span>
                        ))
                      ) : (
                        <div className="flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                          <span className="text-[9px] font-black font-mono leading-none text-black">
                            +{aptCount}
                          </span>
                        </div>
                      )
                    ) : null}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Minimalist Legend Footer */}
        <div className="p-3 bg-neutral-50 border-t border-black/10 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px] font-bold text-neutral-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md border-2 border-emerald-500 bg-white"></span>
            <span>إطار أخضر: يوجد وقت متاح</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md border-2 border-rose-500 bg-white"></span>
            <span>إطار أحمر: اليوم مقبط بالكامل</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-black"></span>
            <span>نقاط سوداء: المواعيد المحجوزة</span>
          </div>
        </div>

      </div>
    </div>
  );
};
