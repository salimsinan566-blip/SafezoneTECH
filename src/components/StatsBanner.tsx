import React, { useState } from 'react';
import { Camera, CalendarCheck, Clock, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateKey, getWorkloadStyles } from '../utils/dateUtils';

export const StatsBanner: React.FC = () => {
  const { appointments, getDayWorkload, settings } = useApp();
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);

  const todayKey = formatDateKey(new Date());
  const todayWorkload = getDayWorkload(todayKey);
  const todayStyles = getWorkloadStyles(todayWorkload.level);

  // Total statistics
  const totalAppointments = appointments.length;
  const completedCount = appointments.filter((a) => a.isCompleted).length;
  const totalCameras = appointments.reduce((sum, a) => sum + (Number(a.camerasCount) || 0), 0);

  return (
    <div className="mb-4 sm:mb-6 space-y-3">
      {/* Color Legend (دليل ألوان التقويم) - Ultra-clean on Mobile */}
      <div className="bg-white p-2.5 sm:px-5 rounded-2xl border border-amber-200/70 shadow-xs flex items-center justify-between gap-2 text-xs">
        <span className="font-black text-slate-800 flex items-center gap-1 shrink-0 text-[11px] sm:text-xs">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">مؤشر الضغط:</span>
        </span>

        {/* 4 Color Pills */}
        <div className="grid grid-cols-4 gap-1 sm:gap-2 flex-1 max-w-lg">
          {/* Green */}
          <div className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-black text-[10px] sm:text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span>فارغ</span>
            <span className="hidden md:inline text-[10px] text-emerald-600">(0%)</span>
          </div>

          {/* Yellow */}
          <div className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-black text-[10px] sm:text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
            <span>خفيف</span>
            <span className="hidden md:inline text-[10px] text-amber-700">({settings.thresholds.yellowPercent}%)</span>
          </div>

          {/* Orange */}
          <div className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-950 font-black text-[10px] sm:text-xs">
            <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
            <span>وسط</span>
            <span className="hidden md:inline text-[10px] text-orange-700">({settings.thresholds.orangePercent}%)</span>
          </div>

          {/* Red */}
          <div className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 font-black text-[10px] sm:text-xs">
            <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0"></span>
            <span>مزدحم</span>
            <span className="hidden md:inline text-[10px] text-rose-700">(ممتلئ)</span>
          </div>
        </div>

        {/* Toggle Stats Details on Mobile */}
        <button
          onClick={() => setIsStatsExpanded(!isStatsExpanded)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 sm:hidden shrink-0"
          title="عرض/إخفاء إحصائيات سريعة"
        >
          {isStatsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* 4 Stats Cards (Always visible on desktop, toggleable or compact on mobile) */}
      <div className={`${isStatsExpanded ? 'grid' : 'hidden sm:grid'} grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 animate-in fade-in duration-200`}>
        {/* Card 1: Today's Status */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500">حالة عمل اليوم</span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${todayStyles.badgeBg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${todayStyles.dotBg}`}></span>
              {todayStyles.statusText}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {todayWorkload.totalBookedHours} س
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              من {todayWorkload.maxWorkingHours} س
            </span>
          </div>
          <div className="mt-1.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${todayWorkload.percentage}%`,
                backgroundColor: todayStyles.colorHex,
              }}
            ></div>
          </div>
        </div>

        {/* Card 2: Today's Appointments */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500">مواعيد اليوم</span>
            <div className="p-1 rounded-lg bg-amber-100 text-amber-700">
              <CalendarCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {todayWorkload.appointmentCount}
            </span>
            <span className="text-[11px] font-bold text-slate-400">موعد مجدول</span>
          </div>
          <p className="mt-1 text-[11px] font-bold text-slate-500">
            {todayWorkload.appointments.filter((a) => a.isCompleted).length} مكتمل
          </p>
        </div>

        {/* Card 3: Total Cameras */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500">مجموع الكاميرات</span>
            <div className="p-1 rounded-lg bg-sky-100 text-sky-700">
              <Camera className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{totalCameras}</span>
            <span className="text-[11px] font-bold text-slate-400">كاميرا</span>
          </div>
          <p className="mt-1 text-[11px] font-bold text-slate-500">
            عبر {totalAppointments} موقع
          </p>
        </div>

        {/* Card 4: Completion Ratio */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500">نسبة الإنجاز</span>
            <div className="p-1 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {totalAppointments > 0
                ? Math.round((completedCount / totalAppointments) * 100)
                : 0}%
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              ({completedCount}/{totalAppointments})
            </span>
          </div>
          <p className="mt-1 text-[11px] font-bold text-slate-500">
            دوامك: {settings.workStartTime} - {settings.workEndTime}
          </p>
        </div>
      </div>
    </div>
  );
};
