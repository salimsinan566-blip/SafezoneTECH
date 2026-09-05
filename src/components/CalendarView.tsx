import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CheckCircle2,
  Users,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  ARABIC_DAYS,
  ARABIC_MONTHS,
  formatDateKey,
  getWorkloadStyles,
  parseDateKey,
  formatTimeArabic,
} from '../utils/dateUtils';
import { AppointmentCard } from './AppointmentCard';

export const CalendarView: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    openNewAppointment,
    getDayWorkload,
    appointments,
    settings,
  } = useApp();

  const [viewDate, setViewDate] = useState<Date>(() => parseDateKey(selectedDate) || new Date());
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>('calendar');

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
  };

  // Build Month Grid
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Grid cells
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

  // Data for the currently selected day (for the details card below)
  const selectedWorkload = getDayWorkload(selectedDate);
  const selectedStyles = getWorkloadStyles(selectedWorkload.level);
  const selectedParsed = parseDateKey(selectedDate);
  const selectedDayName = ARABIC_DAYS[selectedParsed.getDay()];
  const selectedDayNum = selectedParsed.getDate();
  const selectedMonthName = ARABIC_MONTHS[selectedParsed.getMonth()].split('/')[0].trim();
  const selectedYear = selectedParsed.getFullYear();

  // Sorted appointments for List View
  const sortedAppointments = [...appointments].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Calendar Main Box */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Top Controls: Month Nav + View Switcher */}
        <div className="p-3.5 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Month Navigation */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={handlePrevMonth}
                title="الشهر السابق"
                className="p-2 rounded-xl hover:bg-white text-slate-700 active:scale-95 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <button
                onClick={handleGoToday}
                className="px-3 py-1.5 rounded-xl hover:bg-white text-xs font-black text-amber-700 active:scale-95 transition-all"
              >
                اليوم
              </button>

              <button
                onClick={handleNextMonth}
                title="الشهر التالي"
                className="p-2 rounded-xl hover:bg-white text-slate-700 active:scale-95 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-base sm:text-xl font-black text-slate-900 flex items-center gap-1.5 mr-2 sm:mr-4">
              <span>{ARABIC_MONTHS[currentMonth].split('/')[0].trim()}</span>
              <span className="text-amber-500 font-extrabold">{currentYear}</span>
            </h2>
          </div>

          {/* Tab Switcher (تقويم / قائمة) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 w-full sm:w-auto justify-center">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === 'calendar'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-4 h-4 text-amber-500" />
              <span>التقويم</span>
            </button>

            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === 'list'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-amber-500" />
              <span>المواعيد ({appointments.length})</span>
            </button>
          </div>

        </div>

        {activeTab === 'calendar' ? (
          <div className="p-2.5 sm:p-5">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
              {['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map((day, idx) => (
                <div
                  key={day}
                  className={`py-1.5 rounded-xl text-[11px] sm:text-xs font-black ${
                    idx === 5
                      ? 'bg-rose-50 text-rose-700 border border-rose-100' // Friday
                      : 'text-slate-500'
                  }`}
                >
                  <span className="hidden sm:inline">{ARABIC_DAYS[idx]}</span>
                  <span className="sm:hidden">{day}</span>
                </div>
              ))}
            </div>

            {/* Calendar Days Grid: ONLY DAY NUMBER + COLOR INDICATOR */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarCells.map((cell) => {
                const workload = getDayWorkload(cell.dateKey);
                const styles = getWorkloadStyles(workload.level);
                const isToday = cell.dateKey === todayKey;
                const isSelected = cell.dateKey === selectedDate;

                return (
                  <button
                    key={cell.dateKey}
                    type="button"
                    onClick={() => setSelectedDate(cell.dateKey)}
                    className={`relative w-full aspect-square max-h-16 sm:max-h-20 rounded-2xl border transition-all flex flex-col items-center justify-center p-1 active:scale-95 ${
                      !cell.isCurrentMonth
                        ? 'opacity-30 bg-slate-50 border-slate-100'
                        : isSelected
                        ? 'ring-2 ring-slate-900 border-amber-400 bg-amber-100 shadow-md scale-[1.02] z-10'
                        : `${styles.cellBg} shadow-sm`
                    }`}
                  >
                    {/* Today marker (tiny dot or badge) */}
                    {isToday && (
                      <span className="absolute top-1 right-1 text-[8px] sm:text-[9px] font-black px-1 rounded-full bg-slate-900 text-amber-400 leading-tight">
                        اليوم
                      </span>
                    )}

                    {/* ONLY Day Number */}
                    <span
                      className={`text-sm sm:text-lg font-black tracking-tight ${
                        isToday
                          ? 'text-slate-950 font-black'
                          : isSelected
                          ? 'text-slate-950 font-black'
                          : cell.isCurrentMonth
                          ? 'text-slate-900'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Color Dot Indicator for workload */}
                    {cell.isCurrentMonth && (
                      <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                        <span
                          className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${styles.dotBg} shadow-sm`}
                          title={styles.statusText}
                        ></span>
                        {workload.totalBookedHours > 0 && (
                          <span className="hidden md:inline text-[10px] font-extrabold text-slate-700">
                            {workload.totalBookedHours}س
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* List Tab View */
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-slate-900">
                جميع المواعيد المسجلة ({sortedAppointments.length})
              </h3>
              <button
                onClick={() => openNewAppointment()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
                <span>موعد جديد</span>
              </button>
            </div>

            {sortedAppointments.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="font-bold">لا توجد مواعيد مسجلة حتى الآن</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {sortedAppointments.map((apt) => (
                  <AppointmentCard key={apt.id} appointment={apt} showDate={true} />
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* SELECTED DAY DETAILS SECTION: Appears right below calendar on tap! */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-4 sm:p-6 animate-in fade-in duration-200">
          
          {/* Header of Selected Day */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-sm shadow-amber-500/20">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900">
                    {selectedDayName}، {selectedDayNum} {selectedMonthName} {selectedYear}
                  </h3>
                  {selectedDate === todayKey && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950">
                      اليوم
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black border ${selectedStyles.badgeBg}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${selectedStyles.dotBg}`}></span>
                    <span>{selectedStyles.statusText}</span>
                  </span>

                  <span className="text-xs font-extrabold text-slate-600">
                    {selectedWorkload.totalBookedHours} س محجوزة من {selectedWorkload.maxWorkingHours} س دوام ({selectedWorkload.percentage}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Add Appointment for this specific day */}
            <button
              onClick={() => openNewAppointment(selectedDate)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>حجز موعد في هذا اليوم</span>
            </button>
          </div>

          {/* Workload Progress Line */}
          <div className="py-3 border-b border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5">
              <span>نسبة ضغط العمل في هذا اليوم:</span>
              <span className="font-black text-slate-800">{selectedWorkload.percentage}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${selectedWorkload.percentage}%`,
                  backgroundColor: selectedStyles.colorHex,
                }}
              ></div>
            </div>
          </div>

          {/* List of Appointments for the selected day */}
          <div className="pt-4 space-y-3">
            <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>مواعيد وعمليات هذا اليوم ({selectedWorkload.appointmentCount})</span>
            </h4>

            {selectedWorkload.appointments.length === 0 ? (
              <div className="text-center py-8 px-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80">
                <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h5 className="font-black text-emerald-950 text-sm sm:text-base mb-1">
                  هذا اليوم فارغ ومتاح بالكامل (أخضر)
                </h5>
                <p className="text-xs font-semibold text-emerald-700 mb-3">
                  ساعات الدوام ({settings.workStartTime} إلى {settings.workEndTime}) جاهزة لاستقبال أي طلب تركيب أو صيانة.
                </p>
                <button
                  onClick={() => openNewAppointment(selectedDate)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>تسجيل موعد الآن</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedWorkload.appointments.map((apt) => (
                  <AppointmentCard key={apt.id} appointment={apt} />
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
