import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  ARABIC_DAYS,
  ARABIC_MONTHS,
  formatDateKey,
  parseDateKey,
  formatTimeArabic,
} from '../utils/dateUtils';

type ZoomLevel = 'compact' | 'medium' | 'detailed';

export const CalendarView: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    openDayDetails,
    openBookedDetail,
    isDayFullyBooked,
    appointments,
  } = useApp();

  const [viewDate, setViewDate] = useState<Date>(() => parseDateKey(selectedDate) || new Date());
  
  // Apple Calendar Zoom Level: compact (pure circles) | medium (events visible) | detailed (full cards)
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(() => {
    try {
      const saved = localStorage.getItem('safezone_calendar_zoom');
      if (saved === 'compact' || saved === 'medium' || saved === 'detailed') {
        return saved;
      }
    } catch {}
    return 'compact';
  });

  const handleSetZoom = (level: ZoomLevel) => {
    setZoomLevel(level);
    try {
      localStorage.setItem('safezone_calendar_zoom', level);
    } catch {}
  };

  const handleZoomIn = () => {
    if (zoomLevel === 'compact') handleSetZoom('medium');
    else if (zoomLevel === 'medium') handleSetZoom('detailed');
  };

  const handleZoomOut = () => {
    if (zoomLevel === 'detailed') handleSetZoom('medium');
    else if (zoomLevel === 'medium') handleSetZoom('compact');
  };

  // Optional Ctrl + Mouse Wheel zoom support like macOS Apple Calendar
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          handleZoomIn();
        } else if (e.deltaY > 0) {
          handleZoomOut();
        }
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [zoomLevel]);

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
    <div className={`mx-auto space-y-4 transition-all duration-300 ${
      zoomLevel === 'compact'
        ? 'max-w-3xl'
        : zoomLevel === 'medium'
        ? 'max-w-5xl'
        : 'max-w-6xl'
    }`}>
      {/* Apple-style Calendar Card */}
      <div className="bg-white rounded-[28px] border border-neutral-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden transition-all">
        
        {/* Apple Top Header: Month Title + Zoom Controls + Navigation */}
        <div className="px-4 py-3.5 sm:px-7 sm:py-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
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
              {zoomLevel === 'compact'
                ? 'عرض مدمج (دوائر أبل الصافية) — استخدم التكبير لعرض المواعيد'
                : zoomLevel === 'medium'
                ? 'عرض المواعيد — تظهر المواعيد كشرائح أنيقة في الأيام'
                : 'عرض مكبر ومفصل — بطاقات كاملة بأسماء العملاء والفنيين'}
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Apple Zoom Controls (Zoom Out, Segmented Levels, Zoom In) */}
            <div className="flex items-center gap-1 bg-neutral-100/90 p-1 rounded-2xl border border-neutral-200/50 shadow-2xs">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel === 'compact'}
                title="تصغير الكالندر (Ctrl + Scroll Down)"
                className={`p-1.5 sm:p-2 rounded-xl transition-all ${
                  zoomLevel === 'compact'
                    ? 'text-neutral-300 cursor-not-allowed'
                    : 'text-neutral-700 hover:text-black hover:bg-white active:scale-95 shadow-2xs'
                }`}
              >
                <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              </button>

              <div className="flex items-center gap-0.5 px-0.5">
                <button
                  type="button"
                  onClick={() => handleSetZoom('compact')}
                  title="القياس المدمج (دوائر فقط)"
                  className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all ${
                    zoomLevel === 'compact'
                      ? 'bg-black text-white shadow-xs'
                      : 'text-neutral-600 hover:text-black hover:bg-white/60'
                  }`}
                >
                  مدمج
                </button>
                <button
                  type="button"
                  onClick={() => handleSetZoom('medium')}
                  title="قياس المواعيد (شرائح المواعيد)"
                  className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all ${
                    zoomLevel === 'medium'
                      ? 'bg-black text-white shadow-xs'
                      : 'text-neutral-600 hover:text-black hover:bg-white/60'
                  }`}
                >
                  مواعيد
                </button>
                <button
                  type="button"
                  onClick={() => handleSetZoom('detailed')}
                  title="القياس المكبر (تفاصيل كاملة)"
                  className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all ${
                    zoomLevel === 'detailed'
                      ? 'bg-black text-white shadow-xs'
                      : 'text-neutral-600 hover:text-black hover:bg-white/60'
                  }`}
                >
                  مكبّر
                </button>
              </div>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel === 'detailed'}
                title="تكبير الكالندر (Ctrl + Scroll Up)"
                className={`p-1.5 sm:p-2 rounded-xl transition-all ${
                  zoomLevel === 'detailed'
                    ? 'text-neutral-300 cursor-not-allowed'
                    : 'text-neutral-700 hover:text-black hover:bg-white active:scale-95 shadow-2xs'
                }`}
              >
                <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Apple-style Segmented Month Navigation */}
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
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-neutral-100 text-center py-2.5 px-2.5 sm:px-4 bg-neutral-50/40">
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

        {/* Calendar Days Grid (Adapts smoothly across Compact / Medium / Detailed) */}
        <div className={`grid grid-cols-7 transition-all duration-200 ${
          zoomLevel === 'compact'
            ? 'gap-y-3 gap-x-1 sm:gap-x-2 p-3.5 sm:p-6'
            : zoomLevel === 'medium'
            ? 'gap-1.5 sm:gap-2 p-2.5 sm:p-5'
            : 'gap-2 sm:gap-3 p-3 sm:p-6'
        }`}>
          {calendarCells.map((cell) => {
            const isToday = cell.dateKey === todayKey;
            const isPast = cell.dateKey < todayKey;
            const dayApts = Array.isArray(appointments) ? appointments.filter((a) => a && a.date === cell.dateKey) : [];
            const aptCount = dayApts.length;
            const isFull = isDayFullyBooked(cell.dateKey);
            const hasWork = aptCount > 0 && !isFull;
            const isEmpty = aptCount === 0;

            if (!cell.isCurrentMonth) {
              return (
                <div
                  key={cell.dateKey}
                  className={`flex flex-col items-center justify-center p-1 opacity-20 cursor-default ${
                    zoomLevel !== 'compact' ? 'min-h-[70px] sm:min-h-[85px]' : ''
                  }`}
                >
                  <span className="text-xs sm:text-sm font-medium text-neutral-400">
                    {cell.dayNumber}
                  </span>
                </div>
              );
            }

            // LEVEL 1: COMPACT VIEW (Pure Apple Circles)
            if (zoomLevel === 'compact') {
              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  onClick={() => openDayDetails(cell.dateKey)}
                  title={isPast ? `${cell.dayNumber} (يوم سابق - ${aptCount} موعد)` : undefined}
                  className="group relative flex flex-col items-center justify-center focus:outline-none active:scale-95 transition-transform"
                >
                  <div
                    className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex flex-col items-center justify-center transition-all duration-150 ${
                      isPast
                        ? hasWork || isFull
                          ? 'border border-neutral-300 bg-neutral-100 text-neutral-600 font-bold opacity-75 group-hover:opacity-100'
                          : 'border border-neutral-200/80 bg-neutral-50/70 text-neutral-400 font-medium opacity-40 group-hover:opacity-70'
                        : isFull
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
                    ) : isPast ? (
                      aptCount > 0 ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 opacity-60"></span>
                      ) : null
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
            }

            // LEVEL 2: MEDIUM VIEW (Events visible as sleek pills)
            if (zoomLevel === 'medium') {
              return (
                <div
                  key={cell.dateKey}
                  onClick={() => openDayDetails(cell.dateKey)}
                  className={`group relative flex flex-col p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer min-h-[85px] sm:min-h-[105px] text-right ${
                    isPast
                      ? 'bg-neutral-50/60 border-neutral-200/70 hover:bg-neutral-100/60'
                      : isFull
                      ? 'bg-red-50/30 border-red-200 hover:border-red-400 shadow-2xs'
                      : hasWork
                      ? 'bg-orange-50/20 border-orange-200/80 hover:border-orange-400 shadow-2xs'
                      : 'bg-white border-neutral-200/80 hover:border-black/30 shadow-2xs hover:shadow-xs'
                  }`}
                >
                  {/* Top Bar: Circle Day Number + Status/Today */}
                  <div className="flex items-center justify-between mb-1">
                    <div
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-black text-xs leading-none transition-transform group-hover:scale-105 ${
                        isPast
                          ? 'border border-neutral-300 text-neutral-500 bg-neutral-100'
                          : isFull
                          ? 'border border-red-500 bg-red-500 text-white'
                          : hasWork
                          ? 'border border-orange-500 bg-orange-50 text-orange-950 font-black'
                          : 'border border-emerald-500 bg-emerald-50 text-emerald-950 font-black'
                      }`}
                    >
                      {cell.dayNumber}
                    </div>

                    <div className="flex items-center gap-1">
                      {isToday && (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-red-100 text-red-600 leading-none">
                          اليوم
                        </span>
                      )}
                      {aptCount > 0 && !isToday && (
                        <span className="text-[10px] font-bold text-neutral-400 font-mono">
                          {aptCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Event Chips (Up to 2) */}
                  <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                    {dayApts.slice(0, 2).map((apt) => (
                      <div
                        key={apt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openBookedDetail(apt);
                        }}
                        title={`${formatTimeArabic(apt.startTime)}: ${apt.customerName} (${apt.bookedByTechnician || apt.technicianName || 'فني'})`}
                        className={`w-full px-1.5 py-0.5 sm:py-1 rounded-lg text-[10px] font-bold truncate transition-all shadow-2xs flex items-center gap-1 text-right ${
                          isPast
                            ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                            : 'bg-neutral-900 text-white hover:bg-neutral-800'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isPast ? 'bg-neutral-400' : 'bg-emerald-400'}`}></span>
                        <span className="font-mono text-[9px] text-neutral-300 shrink-0">{apt.startTime}</span>
                        <span className="truncate">{apt.customerName}</span>
                      </div>
                    ))}

                    {aptCount > 2 && (
                      <span className="text-[9px] font-black text-neutral-500 text-right pr-0.5">
                        +{aptCount - 2} مواعيد إضافية
                      </span>
                    )}

                    {aptCount === 0 && !isPast && (
                      <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 text-[10px] font-bold text-neutral-400 transition-opacity">
                        + حجز
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // LEVEL 3: DETAILED VIEW (Full Cards with times and technician info)
            return (
              <div
                key={cell.dateKey}
                onClick={() => openDayDetails(cell.dateKey)}
                className={`group relative flex flex-col p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer min-h-[125px] sm:min-h-[155px] text-right ${
                  isPast
                    ? 'bg-neutral-50/70 border-neutral-200/80 hover:bg-neutral-100/70'
                    : isFull
                    ? 'bg-red-50/40 border-red-300 hover:border-red-500 shadow-2xs'
                    : hasWork
                    ? 'bg-orange-50/30 border-orange-200/90 hover:border-orange-400 shadow-2xs'
                    : 'bg-white border-neutral-200 hover:border-black/40 shadow-2xs hover:shadow-xs'
                }`}
              >
                {/* Header: Day number circle + full status badge */}
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs sm:text-sm leading-none transition-transform group-hover:scale-105 ${
                      isPast
                        ? 'border border-neutral-300 text-neutral-500 bg-neutral-100'
                        : isFull
                        ? 'border-2 border-red-500 bg-red-500 text-white shadow-2xs'
                        : hasWork
                        ? 'border-2 border-orange-500 bg-orange-50 text-orange-950 font-black shadow-2xs'
                        : 'border-2 border-emerald-500 bg-emerald-50 text-emerald-950 font-black shadow-2xs'
                    }`}
                  >
                    {cell.dayNumber}
                  </div>

                  <div className="flex items-center gap-1">
                    {isToday ? (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-red-100 text-red-600">
                        اليوم
                      </span>
                    ) : isPast ? (
                      <span className="text-[10px] font-bold text-neutral-400">
                        منتهي
                      </span>
                    ) : isFull ? (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-red-500 text-white">
                        مقبط
                      </span>
                    ) : hasWork ? (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-orange-100 text-orange-800 border border-orange-200">
                        {aptCount} موعد
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-600">
                        متاح
                      </span>
                    )}
                  </div>
                </div>

                {/* Event Cards (Up to 3) */}
                <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
                  {dayApts.slice(0, 3).map((apt) => (
                    <div
                      key={apt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        openBookedDetail(apt);
                      }}
                      className={`p-1.5 rounded-xl text-right transition-all border shadow-2xs space-y-0.5 ${
                        isPast
                          ? 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200'
                          : 'bg-neutral-900 text-white border-neutral-800 hover:bg-neutral-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-mono font-black text-emerald-400">
                          {formatTimeArabic(apt.startTime)}
                        </span>
                        {apt.isCompleted && (
                          <span className="text-[9px] text-emerald-300 font-bold">✓ تم</span>
                        )}
                      </div>
                      <div className="font-black text-[11px] truncate text-white">
                        {apt.customerName}
                      </div>
                      <div className="text-[9px] text-neutral-400 truncate flex items-center gap-1">
                        <span>بواسطة: {apt.bookedByTechnician || apt.technicianName || 'فني'}</span>
                      </div>
                    </div>
                  ))}

                  {aptCount > 3 && (
                    <span className="text-[10px] font-black text-neutral-600 text-center py-0.5">
                      +{aptCount - 3} مواعيد أخرى
                    </span>
                  )}

                  {aptCount === 0 && !isPast && (
                    <div className="flex-1 flex items-center justify-center text-[11px] text-neutral-300 group-hover:text-emerald-600 font-bold transition-colors">
                      + حجز موعد جديد
                    </div>
                  )}
                </div>
              </div>
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

