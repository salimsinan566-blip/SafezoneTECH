import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  Clock,
  User,
  CheckCircle2,
  LayoutList,
  LayoutGrid,
  Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  ARABIC_DAYS,
  ARABIC_DAYS_SHORT,
  ARABIC_MONTHS,
  formatDateKey,
  parseDateKey,
  formatTimeArabic,
} from '../utils/dateUtils';

type ZoomLevel = 'compact' | 'medium' | 'detailed' | 'ultra';

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
  const calendarRef = useRef<HTMLDivElement>(null);
  const [isPinchActive, setIsPinchActive] = useState<boolean>(false);
  
  // Apple Calendar Zoom Level: compact (pure circles) | medium (events visible) | detailed (full cards) | ultra (giant cells with all hours)
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(() => {
    try {
      const saved = localStorage.getItem('safezone_calendar_zoom');
      if (saved === 'compact' || saved === 'medium' || saved === 'detailed' || saved === 'ultra') {
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

  // Mobile Ultra mode: 'vertical' (full-width cards scrolling down) or 'grid' (horizontal 7-day grid)
  const [mobileUltraMode, setMobileUltraMode] = useState<'vertical' | 'grid'>('vertical');

  const handleZoomIn = () => {
    setZoomLevel((curr) => {
      let next: ZoomLevel = 'ultra';
      if (curr === 'compact') next = 'medium';
      else if (curr === 'medium') next = 'detailed';
      else if (curr === 'detailed') next = 'ultra';
      try { localStorage.setItem('safezone_calendar_zoom', next); } catch {}
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoomLevel((curr) => {
      let next: ZoomLevel = 'compact';
      if (curr === 'ultra') next = 'detailed';
      else if (curr === 'detailed') next = 'medium';
      else if (curr === 'medium') next = 'compact';
      try { localStorage.setItem('safezone_calendar_zoom', next); } catch {}
      return next;
    });
  };

  // Two-Finger Pinch-to-Zoom Gesture (Apple Calendar Touch Gesture on Mobile/iPad)
  useEffect(() => {
    const el = calendarRef.current;
    if (!el) return;

    let initialDist = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        initialDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        setIsPinchActive(true);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDist > 0) {
        // Prevent default browser viewport zooming so the calendar smoothly scales instead
        if (e.cancelable) e.preventDefault();

        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const ratio = currentDist / initialDist;

        // Spreading two fingers apart (Pinch Out -> Zoom In)
        if (ratio > 1.25) {
          handleZoomIn();
          initialDist = currentDist; // Reset reference
        }
        // Pinching two fingers together (Pinch In -> Zoom Out)
        else if (ratio < 0.75) {
          handleZoomOut();
          initialDist = currentDist; // Reset reference
        }
      }
    };

    const onTouchEnd = () => {
      initialDist = 0;
      setIsPinchActive(false);
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

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
  const currentMonthDays = calendarCells.filter((c) => c.isCurrentMonth);

  const handleJumpToDay = (dateKey: string) => {
    setSelectedDate(dateKey);
    const el = document.getElementById(`mobile-day-${dateKey}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-neutral-900');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-neutral-900');
      }, 1500);
    } else {
      openDayDetails(dateKey);
    }
  };

  return (
    <div
      ref={calendarRef}
      className={`mx-auto space-y-3 sm:space-y-4 transition-all duration-300 w-full select-none ${
        zoomLevel === 'compact'
          ? 'max-w-3xl'
          : zoomLevel === 'medium'
          ? 'max-w-5xl'
          : zoomLevel === 'detailed'
          ? 'max-w-6xl'
          : 'max-w-7xl'
      }`}
    >
      {/* Visual Gesture Badge (Shown while user is pinching with fingers) */}
      {isPinchActive && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-black/90 text-white px-4 py-2 rounded-2xl shadow-2xl text-xs font-black flex items-center gap-2 animate-in fade-in border border-white/20">
          <ZoomIn className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>
            تكبير / تصغير بإصبعين: {
              zoomLevel === 'compact' ? 'مدمج' : zoomLevel === 'medium' ? 'مواعيد' : zoomLevel === 'detailed' ? 'مكبّر' : 'فائق (Ultra)'
            }
          </span>
        </div>
      )}

      {/* Apple-style Calendar Card */}
      <div className="bg-white rounded-2xl sm:rounded-[28px] border border-neutral-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden transition-all w-full">
        
        {/* Apple Top Header: Structured into 2 responsive rows for mobile perfection */}
        <div className="p-3 sm:px-7 sm:py-5 border-b border-neutral-100 space-y-2.5 sm:space-y-3 bg-white">
          {/* Row 1: Month/Year Title + Navigation Arrows */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-1.5 sm:gap-2 min-w-0">
              <h2 className="text-lg sm:text-3xl font-black tracking-tight text-neutral-900 font-sans truncate">
                {ARABIC_MONTHS[currentMonth].split('/')[0].trim()}
              </h2>
              <span className="text-xs sm:text-lg font-bold text-neutral-400 font-mono shrink-0">
                {currentYear}
              </span>
            </div>

            {/* Apple-style Segmented Month Navigation */}
            <div className="flex items-center gap-0.5 sm:gap-1 bg-neutral-100/90 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-neutral-200/50 shadow-2xs shrink-0">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="الشهر السابق"
                className="p-1 sm:p-2 rounded-lg sm:rounded-xl text-neutral-600 hover:text-black hover:bg-white active:scale-95 transition-all"
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={handleGoToday}
                className="px-2 sm:px-3 py-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold text-neutral-800 hover:text-black hover:bg-white active:scale-95 transition-all"
              >
                اليوم
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                title="الشهر التالي"
                className="p-1 sm:p-2 rounded-lg sm:rounded-xl text-neutral-600 hover:text-black hover:bg-white active:scale-95 transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Row 2: Apple Zoom Controls + Touch Slider (Drag with finger or tap) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-neutral-100/90 p-1.5 sm:p-1 rounded-xl sm:rounded-2xl border border-neutral-200/50 shadow-2xs w-full sm:w-fit sm:mx-auto">
            {/* Quick Zoom Buttons & Segmented Tabs */}
            <div className="flex items-center justify-between w-full sm:w-auto gap-1">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel === 'compact'}
                title="تصغير الكالندر (Ctrl + Scroll Down)"
                className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all shrink-0 ${
                  zoomLevel === 'compact'
                    ? 'text-neutral-300 cursor-not-allowed'
                    : 'text-neutral-700 hover:text-black hover:bg-white active:scale-95 shadow-2xs'
                }`}
              >
                <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              </button>

              <div className="flex items-center gap-0.5 sm:gap-1 flex-1 sm:flex-initial px-0.5">
                <button
                  type="button"
                  onClick={() => handleSetZoom('compact')}
                  title="القياس المدمج (دوائر فقط)"
                  className={`flex-1 sm:flex-initial px-2 sm:px-2.5 py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all text-center ${
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
                  className={`flex-1 sm:flex-initial px-2 sm:px-2.5 py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all text-center ${
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
                  className={`flex-1 sm:flex-initial px-2 sm:px-2.5 py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all text-center ${
                    zoomLevel === 'detailed'
                      ? 'bg-black text-white shadow-xs'
                      : 'text-neutral-600 hover:text-black hover:bg-white/60'
                  }`}
                >
                  مكبّر
                </button>
                <button
                  type="button"
                  onClick={() => handleSetZoom('ultra')}
                  title="القياس الفائق العملاق (خلايا عملاقة مع جميع المواعيد والساعات)"
                  className={`flex-1 sm:flex-initial px-2 sm:px-2.5 py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all text-center ${
                    zoomLevel === 'ultra'
                      ? 'bg-black text-white shadow-xs'
                      : 'text-neutral-600 hover:text-black hover:bg-white/60'
                  }`}
                >
                  فائق 🔍
                </button>
              </div>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel === 'ultra'}
                title="تكبير الكالندر (Ctrl + Scroll Up)"
                className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all shrink-0 ${
                  zoomLevel === 'ultra'
                    ? 'text-neutral-300 cursor-not-allowed'
                    : 'text-neutral-700 hover:text-black hover:bg-white active:scale-95 shadow-2xs'
                }`}
              >
                <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Apple Touch Slider: Drag with your finger left & right across 4 levels */}
            <div className="flex items-center gap-2 px-2 py-0.5 w-full sm:w-auto border-t sm:border-t-0 sm:border-r border-neutral-200/80">
              <span className="text-[10px] font-bold text-neutral-500 shrink-0">سحب بإصبعك:</span>
              <input
                type="range"
                min={0}
                max={3}
                step={1}
                value={
                  zoomLevel === 'compact' ? 0 : zoomLevel === 'medium' ? 1 : zoomLevel === 'detailed' ? 2 : 3
                }
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v === 0) handleSetZoom('compact');
                  else if (v === 1) handleSetZoom('medium');
                  else if (v === 2) handleSetZoom('detailed');
                  else if (v === 3) handleSetZoom('ultra');
                }}
                className="w-full sm:w-28 h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-black"
                title="اسحب بإصبعك لتكبير وتصغير الكالندر"
              />
            </div>
          </div>
        </div>

        {/* Days of Week Header (Hidden on mobile when in Mobile Ultra Vertical mode) */}
        <div className={`grid grid-cols-7 border-b border-neutral-100 text-center py-2 px-0.5 sm:px-4 bg-neutral-50/40 ${
          zoomLevel === 'ultra' && mobileUltraMode === 'vertical' ? 'hidden sm:grid' : ''
        }`}>
          {ARABIC_DAYS_SHORT.map((day, idx) => (
            <div
              key={day}
              className={`text-[10px] sm:text-xs font-bold tracking-wider truncate min-w-0 ${
                idx === 5 ? 'text-red-500' : 'text-neutral-400'
              }`}
            >
              <span className="hidden sm:inline">{ARABIC_DAYS[idx]}</span>
              <span className="sm:hidden">{day}</span>
            </div>
          ))}
        </div>

        {/* MOBILE ULTRA MODE: FULL-WIDTH VERTICAL EXPANSION ("انزل لي جوا") */}
        {zoomLevel === 'ultra' && mobileUltraMode === 'vertical' && (
          <div className="sm:hidden space-y-3 p-2 bg-neutral-50/50">
            {/* Top Navigation Bar: Sticky Apple Day Selector & View Toggle */}
            <div className="sticky top-0 z-20 -mx-2 px-2.5 py-2.5 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-black text-neutral-600">
                  التنقل السريع بالأيام:
                </span>
                <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-xl border border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setMobileUltraMode('vertical')}
                    className="px-2 py-1 rounded-lg text-[10px] font-black bg-black text-white shadow-xs flex items-center gap-1"
                  >
                    <LayoutList className="w-3 h-3" />
                    <span>عمودي مريح</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileUltraMode('grid')}
                    className="px-2 py-1 rounded-lg text-[10px] font-black text-neutral-600 hover:text-black flex items-center gap-1"
                  >
                    <LayoutGrid className="w-3 h-3" />
                    <span>شبكة 7 أيام</span>
                  </button>
                </div>
              </div>

              {/* Apple-style Horizontal Days Strip */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
                {currentMonthDays.map((c) => {
                  const isToday = c.dateKey === todayKey;
                  const dayApts = Array.isArray(appointments) ? appointments.filter((a) => a && a.date === c.dateKey) : [];
                  const isFull = isDayFullyBooked(c.dateKey);
                  const hasWork = dayApts.length > 0 && !isFull;
                  const isPast = c.dateKey < todayKey;
                  const isSelected = c.dateKey === selectedDate;

                  return (
                    <button
                      key={c.dateKey}
                      type="button"
                      onClick={() => handleJumpToDay(c.dateKey)}
                      className={`shrink-0 flex flex-col items-center justify-center w-11 py-1.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-neutral-900 text-white border-black shadow-xs ring-2 ring-black/20'
                          : isToday
                          ? 'bg-red-50 border-red-300 text-red-700 font-black'
                          : 'bg-white border-neutral-200 text-neutral-800 hover:bg-neutral-100'
                      }`}
                    >
                      <span className="text-[9px] font-bold opacity-75">
                        {ARABIC_DAYS_SHORT[c.date.getDay()]}
                      </span>
                      <span className="text-xs font-black leading-tight">
                        {c.dayNumber}
                      </span>
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                          isPast
                            ? 'bg-neutral-300'
                            : isFull
                            ? 'bg-red-500'
                            : hasWork
                            ? 'bg-orange-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Continuous Vertical Feed of Days ("انزل لي جوا") */}
            <div className="space-y-3 pt-1">
              {currentMonthDays.map((c) => {
                const isToday = c.dateKey === todayKey;
                const isPast = c.dateKey < todayKey;
                const dayApts = Array.isArray(appointments) ? appointments.filter((a) => a && a.date === c.dateKey) : [];
                const aptCount = dayApts.length;
                const isFull = isDayFullyBooked(c.dateKey);
                const hasWork = aptCount > 0 && !isFull;

                return (
                  <div
                    key={c.dateKey}
                    id={`mobile-day-${c.dateKey}`}
                    className={`rounded-2xl border-2 p-3.5 transition-all shadow-xs space-y-3 scroll-mt-28 ${
                      isToday
                        ? 'bg-white border-black/80 shadow-md ring-1 ring-black/10'
                        : isPast
                        ? 'bg-neutral-50/70 border-neutral-200/80'
                        : isFull
                        ? 'bg-red-50/30 border-red-200'
                        : hasWork
                        ? 'bg-orange-50/20 border-orange-200'
                        : 'bg-white border-neutral-200'
                    }`}
                  >
                    {/* Day Header */}
                    <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                            isToday
                              ? 'bg-red-600 text-white'
                              : isPast
                              ? 'bg-neutral-200 text-neutral-600'
                              : isFull
                              ? 'bg-red-500 text-white'
                              : hasWork
                              ? 'bg-orange-500 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {c.dayNumber}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-black text-neutral-900">
                              {ARABIC_DAYS[c.date.getDay()]}، {c.dayNumber} {ARABIC_MONTHS[currentMonth].split('/')[0].trim()}
                            </h3>
                            {isToday && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white">
                                اليوم
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-neutral-400 font-mono">
                            {c.dateKey}
                          </span>
                        </div>
                      </div>

                      {/* Badges & Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isPast ? (
                          <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-neutral-200 text-neutral-600">
                            سابق
                          </span>
                        ) : isFull ? (
                          <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-red-100 text-red-700 border border-red-300">
                            مقبط ({aptCount})
                          </span>
                        ) : hasWork ? (
                          <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-orange-100 text-orange-800 border border-orange-300">
                            {aptCount} موعد
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            متاح بالكامل
                          </span>
                        )}

                        {!isPast && (
                          <button
                            type="button"
                            onClick={() => openDayDetails(c.dateKey)}
                            className="px-2.5 py-1 bg-black text-white hover:bg-neutral-800 active:scale-95 text-xs font-black rounded-xl transition-all shadow-2xs"
                            title="عرض وإدارة ساعات هذا اليوم"
                          >
                            إدارة
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Appointments List (Full-Width Roomy Cards) */}
                    {dayApts.length > 0 ? (
                      <div className="space-y-2">
                        {dayApts.map((apt) => (
                          <div
                            key={apt.id}
                            onClick={() => openBookedDetail(apt)}
                            className="p-3 rounded-xl border border-neutral-200 bg-neutral-900 text-white hover:border-black active:scale-[0.99] transition-all cursor-pointer shadow-xs space-y-2"
                          >
                            {/* Row 1: Time + Status */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm font-black text-emerald-400">
                                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{apt.startTime}</span>
                                {apt.endTime && <span>- {apt.endTime}</span>}
                              </div>

                              <div>
                                {apt.isCompleted ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> منجز
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    قيد التنفيذ
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Row 2: Customer Name */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm font-black text-white flex items-center gap-1.5">
                                <User className="w-4 h-4 text-neutral-400 shrink-0" />
                                <span>{apt.customerName}</span>
                              </div>

                              {apt.customerPhone && (
                                <span className="text-xs font-mono text-neutral-400 dir-ltr">
                                  {apt.customerPhone}
                                </span>
                              )}
                            </div>

                            {/* Row 3: Technician & Action */}
                            <div className="flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-800 pt-2">
                              <span>الفني: <strong className="text-neutral-200">{apt.bookedByTechnician || apt.technicianName || 'فني'}</strong></span>
                              <span className="text-[11px] text-emerald-400 font-bold hover:underline">
                                عرض وتعديل التفاصيل ←
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        {!isPast ? (
                          <div
                            onClick={() => openDayDetails(c.dateKey)}
                            className="p-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 cursor-pointer transition-all flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 text-xs font-black text-emerald-800">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>جميع ساعات هذا اليوم شاغرة ومتاحة للحجز</span>
                            </div>
                            <button
                              type="button"
                              className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-black hover:bg-emerald-700 shadow-2xs flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>حجز موعد</span>
                            </button>
                          </div>
                        ) : (
                          <div className="py-2 text-center text-xs text-neutral-400 font-medium">
                            يوم سابق - لا توجد مواعيد مسجلة
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Back to Vertical Toggle (Shown on mobile when user switches to Grid mode in Ultra) */}
        {zoomLevel === 'ultra' && mobileUltraMode === 'grid' && (
          <div className="sm:hidden px-3 py-2 bg-neutral-100 border-b border-neutral-200 flex items-center justify-between">
            <span className="text-xs font-black text-neutral-600">اسحب يميناً ويساراً للتنقل:</span>
            <button
              type="button"
              onClick={() => setMobileUltraMode('vertical')}
              className="px-2.5 py-1 rounded-xl text-xs font-black bg-black text-white flex items-center gap-1 shadow-xs"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>العودة للعرض العمودي المريح</span>
            </button>
          </div>
        )}

        {/* Calendar Days Grid (Adapts smoothly across Compact / Medium / Detailed / Ultra) */}
        <div className={`${
          zoomLevel === 'ultra' && mobileUltraMode === 'vertical'
            ? 'hidden sm:block'
            : zoomLevel === 'ultra' && mobileUltraMode === 'grid'
            ? 'overflow-x-auto pb-2'
            : ''
        }`}>
          <div className={`grid grid-cols-7 transition-all duration-200 w-full ${
            zoomLevel === 'ultra' && mobileUltraMode === 'grid' ? 'min-w-[720px]' : ''
          } ${
            zoomLevel === 'compact'
              ? 'gap-y-2 sm:gap-y-3 gap-x-0.5 sm:gap-x-2 p-1.5 sm:p-6'
              : zoomLevel === 'medium'
              ? 'gap-1 sm:gap-2 p-1 sm:p-5'
              : zoomLevel === 'detailed'
              ? 'gap-1 sm:gap-2.5 p-1 sm:p-5'
              : 'gap-1.5 sm:gap-3 p-1 sm:p-5'
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
                  className={`flex flex-col items-center justify-center p-0.5 opacity-20 cursor-default min-w-0 ${
                    zoomLevel === 'medium'
                      ? 'min-h-[60px] sm:min-h-[95px]'
                      : zoomLevel === 'detailed'
                      ? 'min-h-[85px] sm:min-h-[140px]'
                      : zoomLevel === 'ultra'
                      ? 'min-h-[140px] sm:min-h-[220px]'
                      : ''
                  }`}
                >
                  <span className="text-[10px] sm:text-sm font-medium text-neutral-400">
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
                  className="group relative flex flex-col items-center justify-center focus:outline-none active:scale-95 transition-transform min-w-0 py-0.5"
                >
                  <div
                    className={`w-8 h-8 sm:w-11 sm:h-11 rounded-full flex flex-col items-center justify-center transition-all duration-150 ${
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
                  <div className="flex items-center gap-1 mt-0.5 min-h-[5px]">
                    {isToday ? (
                      <span className="text-[8px] sm:text-[9px] font-black text-red-600 leading-none">
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
                  className={`group relative flex flex-col p-1 sm:p-2 rounded-xl sm:rounded-2xl border transition-all cursor-pointer min-h-[68px] sm:min-h-[105px] text-right min-w-0 overflow-hidden ${
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
                  <div className="flex items-center justify-between mb-0.5 sm:mb-1 min-w-0">
                    <div
                      className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-black text-[10px] sm:text-xs leading-none shrink-0 ${
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

                    <div className="flex items-center gap-0.5 shrink-0">
                      {isToday && (
                        <span className="px-1 py-0.2 rounded text-[8px] sm:text-[9px] font-black bg-red-100 text-red-600 leading-none">
                          اليوم
                        </span>
                      )}
                      {aptCount > 0 && !isToday && (
                        <span className="text-[9px] sm:text-[10px] font-bold text-neutral-400 font-mono">
                          {aptCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Event Chips (Up to 2) */}
                  <div className="flex-1 flex flex-col gap-0.5 sm:gap-1 overflow-hidden min-w-0">
                    {dayApts.slice(0, 2).map((apt) => (
                      <div
                        key={apt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openBookedDetail(apt);
                        }}
                        title={`${formatTimeArabic(apt.startTime)}: ${apt.customerName} (${apt.bookedByTechnician || apt.technicianName || 'فني'})`}
                        className={`w-full px-1 py-0.5 rounded-md sm:rounded-lg text-[8px] sm:text-[10px] font-bold truncate transition-all shadow-2xs flex items-center gap-0.5 sm:gap-1 text-right min-w-0 ${
                          isPast
                            ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                            : 'bg-neutral-900 text-white hover:bg-neutral-800'
                        }`}
                      >
                        <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full shrink-0 ${isPast ? 'bg-neutral-400' : 'bg-emerald-400'}`}></span>
                        <span className="font-mono text-[7px] sm:text-[9px] text-neutral-300 shrink-0">{apt.startTime}</span>
                        <span className="truncate text-[8px] sm:text-[10px]">{apt.customerName}</span>
                      </div>
                    ))}

                    {aptCount > 2 && (
                      <span className="text-[8px] sm:text-[9px] font-black text-neutral-500 text-right pr-0.5 truncate">
                        +{aptCount - 2} المزيد
                      </span>
                    )}
                  </div>
                </div>
              );
            }

            // LEVEL 3: DETAILED VIEW (Standard cards)
            if (zoomLevel === 'detailed') {
              return (
                <div
                  key={cell.dateKey}
                  onClick={() => openDayDetails(cell.dateKey)}
                  className={`group relative flex flex-col p-1 sm:p-2.5 rounded-xl sm:rounded-2xl border transition-all cursor-pointer min-h-[95px] sm:min-h-[155px] text-right min-w-0 overflow-hidden ${
                    isPast
                      ? 'bg-neutral-50/70 border-neutral-200/80 hover:bg-neutral-100/70'
                      : isFull
                      ? 'bg-red-50/40 border-red-300 hover:border-red-500 shadow-2xs'
                      : hasWork
                      ? 'bg-orange-50/30 border-orange-200/90 hover:border-orange-400 shadow-2xs'
                      : 'bg-white border-neutral-200 hover:border-black/40 shadow-2xs hover:shadow-xs'
                  }`}
                >
                  {/* Header: Day number circle + compact status badge */}
                  <div className="flex items-center justify-between mb-1 sm:mb-2 min-w-0">
                    <div
                      className={`w-5 h-5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-[10px] sm:text-sm leading-none shrink-0 ${
                        isPast
                          ? 'border border-neutral-300 text-neutral-500 bg-neutral-100'
                          : isFull
                          ? 'border sm:border-2 border-red-500 bg-red-500 text-white shadow-2xs'
                          : hasWork
                          ? 'border sm:border-2 border-orange-500 bg-orange-50 text-orange-950 font-black shadow-2xs'
                          : 'border sm:border-2 border-emerald-500 bg-emerald-50 text-emerald-950 font-black shadow-2xs'
                      }`}
                    >
                      {cell.dayNumber}
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      {isToday && (
                        <span className="px-1 py-0.2 rounded text-[8px] sm:text-[10px] font-black bg-red-100 text-red-600">
                          اليوم
                        </span>
                      )}
                      {isPast ? (
                        <span className="text-[8px] sm:text-[10px] font-bold text-neutral-400">
                          سابق
                        </span>
                      ) : isFull ? (
                        <span className="px-1 py-0.2 rounded text-[8px] sm:text-[10px] font-black bg-red-500 text-white">
                          مقبط
                        </span>
                      ) : hasWork ? (
                        <span className="px-1 py-0.2 rounded text-[8px] sm:text-[10px] font-black bg-orange-100 text-orange-800 border border-orange-200">
                          {aptCount}
                        </span>
                      ) : (
                        <span className="text-[8px] sm:text-[10px] font-bold text-emerald-600">
                          متاح
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Event Cards (Up to 3) */}
                  <div className="flex-1 flex flex-col gap-1 sm:gap-1.5 overflow-hidden min-w-0">
                    {dayApts.slice(0, 3).map((apt) => (
                      <div
                        key={apt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openBookedDetail(apt);
                        }}
                        className={`p-1 sm:p-1.5 rounded-lg sm:rounded-xl text-right transition-all border shadow-2xs space-y-0.2 sm:space-y-0.5 min-w-0 ${
                          isPast
                            ? 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200'
                            : 'bg-neutral-900 text-white border-neutral-800 hover:bg-neutral-800'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[8px] sm:text-[10px] min-w-0">
                          <span className="font-mono font-black text-emerald-400 shrink-0">
                            {apt.startTime}
                          </span>
                          {apt.isCompleted && (
                            <span className="text-[8px] sm:text-[9px] text-emerald-300 font-bold shrink-0">✓</span>
                          )}
                        </div>
                        <div className="font-black text-[8px] sm:text-[11px] truncate text-white block w-full">
                          {apt.customerName}
                        </div>
                        <div className="hidden sm:block text-[9px] text-neutral-400 truncate">
                          بواسطة: {apt.bookedByTechnician || apt.technicianName || 'فني'}
                        </div>
                      </div>
                    ))}

                    {aptCount > 3 && (
                      <span className="text-[8px] sm:text-[10px] font-black text-neutral-600 text-center py-0.2 truncate">
                        +{aptCount - 3} المزيد
                      </span>
                    )}
                  </div>
                </div>
              );
            }

            // LEVEL 4: ULTRA ZOOM (Giant cells showing ALL appointments, full hours, and details!)
            return (
              <div
                key={cell.dateKey}
                onClick={() => openDayDetails(cell.dateKey)}
                className={`group relative flex flex-col p-2 sm:p-3 rounded-2xl border-2 transition-all cursor-pointer min-h-[160px] sm:min-h-[260px] lg:min-h-[290px] text-right min-w-0 shadow-xs hover:shadow-md ${
                  isPast
                    ? 'bg-neutral-50 border-neutral-200/90'
                    : isFull
                    ? 'bg-red-50/50 border-red-300 hover:border-red-500'
                    : hasWork
                    ? 'bg-orange-50/40 border-orange-300 hover:border-orange-500'
                    : 'bg-white border-neutral-200 hover:border-black/50'
                }`}
              >
                {/* Header: Large Day Number Circle + Status */}
                <div className="flex items-center justify-between mb-2 min-w-0 border-b border-black/5 pb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs sm:text-sm leading-none shrink-0 ${
                        isPast
                          ? 'border border-neutral-300 text-neutral-500 bg-neutral-200/60'
                          : isFull
                          ? 'border-2 border-red-500 bg-red-500 text-white shadow-2xs'
                          : hasWork
                          ? 'border-2 border-orange-500 bg-orange-50 text-orange-950 font-black shadow-2xs'
                          : 'border-2 border-emerald-500 bg-emerald-50 text-emerald-950 font-black shadow-2xs'
                      }`}
                    >
                      {cell.dayNumber}
                    </div>
                    {isToday && (
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black bg-red-600 text-white shrink-0">
                        اليوم
                      </span>
                    )}
                  </div>

                  <div className="shrink-0">
                    {isPast ? (
                      <span className="text-[9px] sm:text-[10px] font-bold text-neutral-400">
                        سابق
                      </span>
                    ) : isFull ? (
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black bg-red-100 text-red-700 border border-red-200">
                        مقبط
                      </span>
                    ) : hasWork ? (
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black bg-orange-100 text-orange-800 border border-orange-300">
                        {aptCount} موعد
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                        متاح
                      </span>
                    )}
                  </div>
                </div>

                {/* All Appointments in Full Detail */}
                <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                  {dayApts.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        openBookedDetail(apt);
                      }}
                      className={`p-1.5 sm:p-2 rounded-xl text-right transition-all border shadow-2xs space-y-1 min-w-0 ${
                        isPast
                          ? 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200'
                          : 'bg-neutral-950 text-white border-neutral-800 hover:bg-neutral-900 hover:border-black'
                      }`}
                    >
                      {/* Time and Status Badge */}
                      <div className="flex items-center justify-between text-[9px] sm:text-xs">
                        <span className="font-mono font-black text-emerald-400 flex items-center gap-1 shrink-0">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400" />
                          <span>{apt.startTime}</span>
                          {apt.endTime && <span className="opacity-75">- {apt.endTime}</span>}
                        </span>
                        {apt.isCompleted ? (
                          <span className="text-[8px] sm:text-[9px] text-emerald-300 font-bold px-1 rounded bg-emerald-950/60 shrink-0">
                            ✓ تم
                          </span>
                        ) : (
                          <span className="text-[8px] sm:text-[9px] text-neutral-400 shrink-0">
                            قيد العمل
                          </span>
                        )}
                      </div>

                      {/* Customer Name */}
                      <div className="font-black text-[10px] sm:text-xs truncate text-white block w-full">
                        {apt.customerName}
                      </div>

                      {/* Technician attribution */}
                      <div className="text-[8px] sm:text-[10px] text-neutral-400 truncate flex items-center justify-between border-t border-neutral-800 pt-0.5">
                        <span className="truncate">الفني: {apt.bookedByTechnician || apt.technicianName || 'فني'}</span>
                      </div>
                    </div>
                  ))}

                  {/* Empty state hint */}
                  {aptCount === 0 && !isPast && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-2 text-neutral-400">
                      <span className="text-xs font-bold text-neutral-400">فارغ بالكامل</span>
                      <span className="text-[10px] text-emerald-600 font-bold mt-1">+ انقر للحجز السريع</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>

        {/* Minimalist Legend Pill Bar (Responsive single line on mobile) */}
        <div className="py-2.5 px-2 sm:px-4 bg-neutral-50/80 border-t border-neutral-100 flex items-center justify-center gap-3 sm:gap-7 text-[10px] sm:text-[11px] font-bold text-neutral-600">
          <div className="flex items-center gap-1 shrink-0">
            <span className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-emerald-500 bg-emerald-50/50"></span>
            <span>متاح</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-orange-500 bg-orange-50/50"></span>
            <span>مواعيد</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-red-500 bg-red-50/50"></span>
            <span>مقبط</span>
          </div>
        </div>

      </div>
    </div>
  );
};

