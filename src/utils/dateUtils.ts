import { Appointment, DayWorkload, WorkloadLevel, WorkSettings } from '../types';

export const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
export const ARABIC_DAYS_SHORT = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export const ARABIC_MONTHS = [
  'يناير / كانون الثاني',
  'فبراير / شباط',
  'مارس / آذار',
  'أبريل / نيسان',
  'مايو / أيار',
  'يونيو / حزيران',
  'يوليو / تموز',
  'أغسطس / آب',
  'سبتمبر / أيلول',
  'أكتوبر / تشرين الأول',
  'نوفمبر / تشرين الثاني',
  'ديسمبر / كانون الأول',
];

/**
 * Format Date object to YYYY-MM-DD
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse YYYY-MM-DD to Date object
 */
export function parseDateKey(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Calculate total working hours in day based on settings
 */
export function calculateDailyMaxHours(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const diff = Math.max(0, endMinutes - startMinutes);
  return Number((diff / 60).toFixed(1));
}

/**
 * Add hours to a time string (e.g. "09:00" + 3 -> "12:00")
 */
export function addHoursToTime(timeStr: string, hours: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMinutes = Math.round(h * 60 + m + hours * 60);
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

/**
 * Add minutes to a time string (e.g. "09:15" + 30 -> "09:45")
 */
export function addMinutesToTime(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMinutes = Math.round(h * 60 + m + minutes);
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}


/**
 * Format 24h time to 12h Arabic format with صباحاً / مساءً
 */
export function formatTimeArabic(timeStr: string): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'مساءً' : 'صباحاً';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Check if two time intervals overlap on the same day
 */
export function isTimeOverlapping(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return start1 < end2 && end1 > start2;
}

/**
 * Calculate workload for a specific date
 */
export function calculateDayWorkload(
  dateStr: string,
  appointments: Appointment[],
  settings: WorkSettings
): DayWorkload {
  const dayAppointments = appointments.filter((a) => a.date === dateStr);
  const totalBookedHours = dayAppointments.reduce((sum, a) => sum + (Number(a.durationHours) || 0), 0);
  const maxWorkingHours = calculateDailyMaxHours(settings.workStartTime, settings.workEndTime) || 10;
  const percentage = Math.min(100, Math.round((totalBookedHours / maxWorkingHours) * 100));

  let level: WorkloadLevel = 'empty';
  if (totalBookedHours === 0) {
    level = 'empty'; // Green (أخضر)
  } else if (percentage <= settings.thresholds.yellowPercent) {
    level = 'light'; // Yellow (أصفر)
  } else if (percentage <= settings.thresholds.orangePercent) {
    level = 'medium'; // Orange (برتقالي)
  } else {
    level = 'full'; // Red (أحمر)
  }

  return {
    date: dateStr,
    totalBookedHours,
    maxWorkingHours,
    percentage,
    level,
    appointmentCount: dayAppointments.length,
    appointments: dayAppointments,
  };
}

/**
 * Get visual classes for workload badges and calendar day indicators
 */
export function getWorkloadStyles(level: WorkloadLevel) {
  switch (level) {
    case 'empty':
      return {
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        dotBg: 'bg-emerald-500',
        cellBg: 'bg-emerald-50/40 hover:bg-emerald-100/50 border-emerald-200 text-emerald-950',
        activeRing: 'ring-2 ring-emerald-500 bg-emerald-100/90 font-black',
        cardHeader: 'bg-emerald-50 border-emerald-200',
        statusText: 'يوم فارغ',
        colorHex: '#10b981',
      };
    case 'light':
      return {
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
        dotBg: 'bg-amber-500',
        cellBg: 'bg-amber-50/70 hover:bg-amber-100/60 border-amber-300 text-amber-950',
        activeRing: 'ring-2 ring-amber-500 bg-amber-100/90 font-black',
        cardHeader: 'bg-amber-50 border-amber-200',
        statusText: 'شغل خفيف',
        colorHex: '#f59e0b',
      };
    case 'medium':
      return {
        badgeBg: 'bg-orange-100 text-orange-950 border-orange-300',
        dotBg: 'bg-orange-500',
        cellBg: 'bg-orange-50/70 hover:bg-orange-100/60 border-orange-300 text-orange-950',
        activeRing: 'ring-2 ring-orange-500 bg-orange-100/90 font-black',
        cardHeader: 'bg-orange-50 border-orange-200',
        statusText: 'شغل وسط',
        colorHex: '#f97316',
      };
    case 'full':
      return {
        badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
        dotBg: 'bg-rose-600',
        cellBg: 'bg-rose-50/70 hover:bg-rose-100/60 border-rose-300 text-rose-950',
        activeRing: 'ring-2 ring-rose-500 bg-rose-100/90 font-black',
        cardHeader: 'bg-rose-50 border-rose-200',
        statusText: 'يوم مزدحم',
        colorHex: '#e11d48',
      };
  }
}
