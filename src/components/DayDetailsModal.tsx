import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Clock, Calendar, CheckCircle2, User, Lock, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  ARABIC_DAYS,
  ARABIC_MONTHS,
  formatDateKey,
  parseDateKey,
  formatTimeArabic,
  addMinutesToTime,
  isTimeOverlapping,
} from '../utils/dateUtils';
import { QuickPreset, Appointment } from '../types';

export const DayDetailsModal: React.FC = () => {
  const {
    selectedDate,
    closeModals,
    settings,
    appointments,
    activePresetId,
    setActivePresetId,
    openQuickBook,
    openBookedDetail,
  } = useApp();

  // Track expanded hour dropdowns for quarter-hour selection
  const [expandedHours, setExpandedHours] = useState<{ [hour: number]: boolean }>({});
  // Toggle to optionally show earlier hours today if technician wants to review past appointments
  const [showEarlierHoursToday, setShowEarlierHoursToday] = useState(false);

  const todayKey = formatDateKey(new Date());
  const isPastDay = selectedDate < todayKey;
  const isToday = selectedDate === todayKey;

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

  const parsed = parseDateKey(selectedDate);
  const dayName = ARABIC_DAYS[parsed.getDay()];
  const dayNum = parsed.getDate();
  const monthName = ARABIC_MONTHS[parsed.getMonth()].split('/')[0].trim();
  const year = parsed.getFullYear();

  // Get current active preset
  const currentPresets = settings?.quickPresets && settings.quickPresets.length > 0
    ? settings.quickPresets
    : [
        { id: 'p1', label: 'معاينة (30 د)', durationMinutes: 30 },
        { id: 'p2', label: 'صيانة (1 س)', durationMinutes: 60 },
        { id: 'p3', label: '4 كاميرات (2 س)', durationMinutes: 120 },
        { id: 'p4', label: '8 كاميرات (3 س)', durationMinutes: 180 },
      ];

  const activePreset = (currentPresets && currentPresets.find((p) => p && p.id === activePresetId)) || currentPresets[0] || { id: 'p1', label: 'معاينة (30 د)', durationMinutes: 30 };

  // Working hours range
  const startHour = parseInt((settings?.workStartTime || '08:00').split(':')[0], 10) || 8;
  const endHour = parseInt((settings?.workEndTime || '21:00').split(':')[0], 10) || 21;

  // Day appointments
  const dayAppointments = Array.isArray(appointments) ? appointments.filter((a) => a && a.date === selectedDate) : [];

  const toggleHourDropdown = (hour: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedHours((prev) => ({
      ...prev,
      [hour]: !prev[hour],
    }));
  };

  // Find appointment overlapping with a specific time window
  const getOverlappingAppointment = (startTime: string, endTime: string): Appointment | undefined => {
    return dayAppointments.find((apt) =>
      isTimeOverlapping(startTime, endTime, apt.startTime, apt.endTime)
    );
  };

  // Generate hours list with quarter-hour resolution
  const allHours = [];
  for (let h = startHour; h < endHour; h++) {
    const hourStr = String(h).padStart(2, '0');
    const slotStart = `${hourStr}:00`;
    const nextHourStr = String(h + 1).padStart(2, '0');
    const slotEnd = `${nextHourStr}:00`;

    // 4 Quarter hours in this hour
    const quarters = ['00', '15', '30', '45'].map((m) => {
      const qStart = `${hourStr}:${m}`;
      const qEnd = addMinutesToTime(qStart, 15);
      const bookedApt = getOverlappingAppointment(qStart, qEnd);
      // For today: is this quarter in the past?
      const isQuarterPast = isPastDay || (isToday && qStart < currentTimeStr);

      return {
        minute: m,
        time: qStart,
        endTime: qEnd,
        isBooked: Boolean(bookedApt),
        isQuarterPast,
        bookedApt,
      };
    });

    const bookedQuarters = quarters.filter((q) => q.isBooked);
    // Available quarters that can be booked (future and free)
    const freeQuarters = quarters.filter((q) => !q.isBooked && !q.isQuarterPast);

    // Is the entire hour in the past?
    const isHourPast = isPastDay || (isToday && slotEnd <= currentTimeStr);

    const isFullyBooked = freeQuarters.length === 0 && bookedQuarters.length > 0;
    const isPartiallyBooked = bookedQuarters.length > 0 && freeQuarters.length > 0;
    const isCompletelyFree = bookedQuarters.length === 0 && freeQuarters.length > 0;
    const isExpiredNoBookings = isHourPast && bookedQuarters.length === 0;

    const firstFreeSlot = freeQuarters[0]?.time || slotStart;
    const remainingMinutes = freeQuarters.length * 15;

    allHours.push({
      hour: h,
      slotStart,
      slotEnd,
      quarters,
      bookedQuarters,
      freeQuarters,
      isHourPast,
      isFullyBooked,
      isPartiallyBooked,
      isCompletelyFree,
      isExpiredNoBookings,
      firstFreeSlot,
      remainingMinutes,
    });
  }

  // Filter hours to display:
  // If today: by default show only hours after current time (unless user toggles showEarlierHoursToday)
  // If past day or future day: show all hours
  const displayedHours = (isToday && !showEarlierHoursToday)
    ? allHours.filter((item) => !item.isHourPast)
    : allHours;

  // Handle booking an available time
  const handleSlotClick = (startTime: string) => {
    // Defense: disallow booking in past dates or past hours
    if (isPastDay || (isToday && startTime < currentTimeStr)) {
      alert('لا يمكن حجز موعد في وقت أو تاريخ قد مضى!');
      return;
    }

    let duration = activePreset.durationMinutes;
    let endTime = addMinutesToTime(startTime, duration);

    // Check if requested duration conflicts
    let conflict = getOverlappingAppointment(startTime, endTime);
    if (conflict) {
      // Intelligently fit: try 45, 30, or 15 mins if available
      if (duration > 45 && !getOverlappingAppointment(startTime, addMinutesToTime(startTime, 45))) {
        duration = 45;
      } else if (duration > 30 && !getOverlappingAppointment(startTime, addMinutesToTime(startTime, 30))) {
        duration = 30;
      } else if (duration > 15 && !getOverlappingAppointment(startTime, addMinutesToTime(startTime, 15))) {
        duration = 15;
      } else {
        alert(`عذراً، هذا الوقت يتعارض مع موعد محجوز مسبقاً [${conflict.customerName}]! يرجى اختيار ربع ساعة آخر متاح.`);
        return;
      }
    }

    openQuickBook(selectedDate, startTime, duration);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-black/10 overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-black/10 flex items-center justify-between bg-neutral-50/80">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-black">
                {dayName}، {dayNum} {monthName} {year}
              </h3>
              <span className="text-[11px] font-bold text-neutral-500 font-mono">
                {selectedDate} {isToday ? '(اليوم الحالي)' : isPastDay ? '(يوم سابق)' : ''}
              </span>
            </div>
          </div>

          <button
            onClick={closeModals}
            className="p-1.5 rounded-xl hover:bg-neutral-200 text-neutral-500 hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Past Day Banner Notice */}
        {isPastDay && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center gap-2.5 text-xs text-neutral-600 font-bold">
            <AlertCircle className="w-4 h-4 text-neutral-500 shrink-0" />
            <span>هذا اليوم قد انتهى (في الماضي) — لا يمكن إضافة حجوزات جديدة، يمكنك فقط استعراض سجل المواعيد السابقة.</span>
          </div>
        )}

        {/* 4 Quick Duration Presets (Shown for Today and Future Days) */}
        {!isPastDay && (
          <div className="px-4 py-3 sm:px-6 border-b border-black/10 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-neutral-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                الخيارات السريعة (اختر مدة الحجز أولاً):
              </span>
              <span className="text-[10px] text-neutral-500 font-bold">
                المدة: {activePreset.durationMinutes} دقيقة
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {currentPresets.slice(0, 4).map((preset) => {
                const isSelected = preset.id === activePreset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setActivePresetId(preset.id)}
                    className={`py-2 px-2 rounded-xl text-xs font-black transition-all border text-center ${
                      isSelected
                        ? 'bg-black text-white border-black shadow-sm scale-[1.02]'
                        : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Hours List */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 space-y-2.5">
          <div className="text-[11px] font-bold text-neutral-500 mb-1 flex items-center justify-between">
            <span>
              {isPastDay
                ? 'سجل ساعات ومواعيد اليوم المنتهي'
                : isToday
                ? `الساعات المتاحة اليوم (ابتداءً من الوقت الحالي ${currentTimeStr})`
                : 'جدول الساعات المتاحة والمحجوزة'}
            </span>
            <span>دوام: {settings.workStartTime} إلى {settings.workEndTime}</span>
          </div>

          {/* Today: Toggle to Show/Hide earlier hours */}
          {isToday && allHours.some((h) => h.isHourPast) && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-100/80 border border-neutral-200/70 text-xs">
              <span className="text-neutral-600 font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                {showEarlierHoursToday
                  ? 'يتم الآن استعراض جميع ساعات اليوم'
                  : `يتم فقط عرض الساعات بعد الوقت الحالي (${currentTimeStr})`}
              </span>
              <button
                type="button"
                onClick={() => setShowEarlierHoursToday((prev) => !prev)}
                className="text-xs font-black text-neutral-900 hover:text-black px-2.5 py-1 rounded-lg bg-white border border-neutral-200 hover:border-black shadow-2xs transition-all"
              >
                {showEarlierHoursToday ? 'إخفاء الساعات السابقة' : 'عرض الساعات السابقة لليوم'}
              </button>
            </div>
          )}

          {/* Today: All hours passed message */}
          {isToday && displayedHours.length === 0 && (
            <div className="py-10 px-4 text-center space-y-3 bg-neutral-50 rounded-2xl border border-neutral-200/80 my-2">
              <div className="w-12 h-12 rounded-full bg-neutral-200/80 text-neutral-600 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <div className="text-sm font-black text-neutral-900">
                انتهت ساعات العمل المتاحة لليوم ({settings.workEndTime})
              </div>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                الوقت الحالي تجاوز أوقات الدوام لهذا اليوم. يمكنك تصفح الأيام القادمة من الكالندر لحجز مواعيد جديدة.
              </p>
              {allHours.some((h) => h.bookedQuarters.length > 0) && (
                <button
                  type="button"
                  onClick={() => setShowEarlierHoursToday(true)}
                  className="text-xs font-black text-black underline pt-1"
                >
                  استعراض سجل مواعيد اليوم السابقة
                </button>
              )}
            </div>
          )}

          {displayedHours.map(({
            hour,
            slotStart,
            quarters,
            bookedQuarters,
            freeQuarters,
            isHourPast,
            isFullyBooked,
            isPartiallyBooked,
            isCompletelyFree,
            isExpiredNoBookings,
            firstFreeSlot,
            remainingMinutes,
          }) => {
            const isExpanded = Boolean(expandedHours[hour]);
            const primaryBookedApt = bookedQuarters[0]?.bookedApt;

            return (
              <div key={hour} className="space-y-1">
                {/* 1. Fully Booked Hour OR Past Hour with Bookings */}
                {isFullyBooked || (isHourPast && bookedQuarters.length > 0) ? (
                  <div
                    onClick={() => primaryBookedApt && openBookedDetail(primaryBookedApt)}
                    className="w-full p-3 rounded-2xl bg-neutral-900 text-white flex items-center justify-between cursor-pointer hover:bg-neutral-800 transition-colors shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300">
                          <Lock className="w-4 h-4" />
                        </span>
                        <span className="font-mono text-xs sm:text-sm font-black text-white">
                          {formatTimeArabic(slotStart)}
                        </span>
                      </div>

                      <div className="border-r border-neutral-700 pr-3 mr-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-black text-white truncate">
                            {primaryBookedApt?.customerName || 'محجوز'}
                          </div>
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-neutral-800 text-neutral-300 border border-neutral-700 shrink-0">
                            {isHourPast ? 'موعد سابق' : 'محجوز بالكامل'}
                          </span>
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          حجز بواسطة: <span className="text-neutral-200 font-bold">{primaryBookedApt?.bookedByTechnician || primaryBookedApt?.technicianName || 'فني'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      <span className="text-[11px] font-bold text-neutral-400 hover:text-white underline">
                        عرض التفاصيل
                      </span>
                    </div>
                  </div>
                ) : isHourPast ? (
                  /* 2. Past Hour with NO Bookings (Expired / Inactive) */
                  <div className="w-full p-3 rounded-2xl border border-neutral-200/80 bg-neutral-50/60 text-neutral-400 flex items-center justify-between opacity-50 cursor-not-allowed">
                    <div className="flex items-center gap-2.5">
                      <span className="p-1.5 rounded-lg bg-neutral-200/70 text-neutral-400">
                        <Clock className="w-4 h-4" />
                      </span>
                      <span className="font-mono text-xs sm:text-sm font-bold text-neutral-500">
                        {formatTimeArabic(slotStart)}
                      </span>
                      <span className="text-[11px] font-sans text-neutral-400">
                        (ساعة منتهية)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-neutral-400 px-2.5 py-1 rounded-lg bg-neutral-100">
                      غير متاح
                    </span>
                  </div>
                ) : isPartiallyBooked ? (
                  /* 3. Partially Booked Hour: STILL AVAILABLE FOR BOOKING! */
                  <div className="relative flex items-center rounded-2xl border-2 border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/40 transition-all overflow-hidden shadow-2xs">
                    {/* Main Clickable Area to Book remaining time */}
                    <button
                      type="button"
                      onClick={() => handleSlotClick(firstFreeSlot)}
                      className="flex-1 p-3 text-right flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs sm:text-sm font-black text-black">
                              {formatTimeArabic(slotStart)}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              متاح للحجز (متبقي {remainingMinutes} دقيقة)
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-neutral-500">
                            محجوز جزئياً لـ: <strong className="text-neutral-800">{primaryBookedApt?.customerName}</strong>
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-black text-white px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-2xs">
                        حجز المتبقي
                      </span>
                    </button>

                    {/* Quarter-Hour Dropdown Arrow */}
                    <button
                      type="button"
                      onClick={(e) => toggleHourDropdown(hour, e)}
                      title="عرض أرباع الساعة"
                      className="p-3.5 border-r border-emerald-200 hover:bg-emerald-100 text-emerald-800 transition-colors flex items-center justify-center shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ) : (
                  /* 4. Completely Free Hour Card */
                  <div className="relative flex items-center rounded-2xl border border-black/15 bg-white hover:border-black transition-all overflow-hidden">
                    {/* Main Clickable Area to Book Hour directly */}
                    <button
                      type="button"
                      onClick={() => handleSlotClick(firstFreeSlot)}
                      className="flex-1 p-3 text-right flex items-center justify-between hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <div>
                          <div className="font-mono text-xs sm:text-sm font-black text-black">
                            {formatTimeArabic(slotStart)}
                          </div>
                          <span className="text-[11px] font-bold text-neutral-400">
                            {remainingMinutes === 60
                              ? `متاح للحجز بالكامل (${activePreset.label})`
                              : `متاح للحجز (${remainingMinutes} دقيقة متبقية)`}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-black text-black px-3 py-1 rounded-xl bg-neutral-100 hover:bg-black hover:text-white transition-colors">
                        حجز الآن
                      </span>
                    </button>

                    {/* Quarter-Hour Dropdown Arrow */}
                    <button
                      type="button"
                      onClick={(e) => toggleHourDropdown(hour, e)}
                      title="تخصيص ربع الساعة (:00, :15, :30, :45)"
                      className="p-3.5 border-r border-black/10 hover:bg-neutral-100 text-neutral-600 hover:text-black transition-colors flex items-center justify-center shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}

                {/* Quarter-Hour Sub-slots Dropdown (Visible for Free or Partially Booked hours) */}
                {isExpanded && !isHourPast && !isFullyBooked && (
                  <div className="grid grid-cols-4 gap-1.5 p-2 bg-neutral-100/90 rounded-xl border border-black/10 animate-in slide-in-from-top-1 duration-150">
                    {quarters.map(({ minute, time, isBooked: qIsBooked, isQuarterPast, bookedApt }) => {
                      if (qIsBooked) {
                        return (
                          <button
                            key={minute}
                            type="button"
                            onClick={() => bookedApt && openBookedDetail(bookedApt)}
                            title={`محجوز: ${bookedApt?.customerName} (حجز بواسطة: ${bookedApt?.bookedByTechnician || bookedApt?.technicianName || 'فني'})`}
                            className="py-2 px-1 rounded-lg text-[11px] font-mono font-bold bg-neutral-900 text-neutral-300 hover:bg-neutral-800 text-center truncate transition-colors shadow-2xs"
                          >
                            <span className="line-through">{time}</span> (محجوز)
                          </button>
                        );
                      }

                      if (isQuarterPast) {
                        return (
                          <div
                            key={minute}
                            title="انتهى هذا الوقت"
                            className="py-2 px-1 rounded-lg text-[11px] font-mono font-medium bg-neutral-200/60 text-neutral-400 border border-neutral-300/50 text-center cursor-not-allowed select-none"
                          >
                            <span className="line-through">{time}</span> (مضى)
                          </div>
                        );
                      }

                      return (
                        <button
                          key={minute}
                          type="button"
                          onClick={() => handleSlotClick(time)}
                          className="py-2 px-1 rounded-lg text-[11px] font-mono font-black bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-950 border border-emerald-300 shadow-2xs text-center transition-all"
                        >
                          {time} ✓ متاح
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
