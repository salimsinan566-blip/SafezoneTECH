import React from 'react';
import { Plus, Settings, Lock, Calendar as CalendarIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ARABIC_DAYS, ARABIC_MONTHS } from '../utils/dateUtils';

export const Header: React.FC = () => {
  const {
    openNewAppointment,
    setActiveModal,
    settings,
    lockApp,
    appointments,
    isSupabaseConnected,
  } = useApp();

  const today = new Date();
  const dayName = ARABIC_DAYS[today.getDay()];
  const dayNumber = today.getDate();
  const monthName = ARABIC_MONTHS[today.getMonth()].split('/')[0].trim();
  const year = today.getFullYear();

  const todayKey = today.toISOString().split('T')[0];
  const todayAppointments = appointments.filter((a) => a.date === todayKey);
  const completedToday = todayAppointments.filter((a) => a.isCompleted).length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-amber-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-slate-950 p-1 shadow-md shadow-amber-500/10 ring-2 ring-amber-400 shrink-0 overflow-hidden">
              <img src="/logo.png" alt="SAFE ZONE" className="w-full h-full object-contain" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900">
                  SAFE <span className="text-amber-500">ZONE</span>
                </h1>
                <span className="px-1.5 py-0.5 text-[10px] sm:text-xs font-bold rounded-md bg-amber-100 text-amber-900 border border-amber-300 hidden xs:inline">
                  أنظمة أمنية
                </span>

                {/* Cloud Connection Badge */}
                {isSupabaseConnected ? (
                  <span
                    title="متصل بقاعدة بيانات Supabase السحابية بنجاح"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>سحابي متصل</span>
                  </span>
                ) : (
                  <span
                    title="يعمل في الوضع المحلي (LocalStorage)"
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    <span>محلي</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center Date Badge (Desktop only) */}
          <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <CalendarIcon className="w-4 h-4 text-amber-600" />
            <div>
              <span className="font-bold text-slate-800">{dayName}، {dayNumber} {monthName}</span>
              {todayAppointments.length > 0 && (
                <span className="mr-1.5 font-semibold text-slate-500">
                  ({completedToday}/{todayAppointments.length} منجز)
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* New Appointment Button */}
            <button
              onClick={() => openNewAppointment()}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black text-xs sm:text-sm shadow-sm shadow-amber-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>موعد جديد</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setActiveModal('settings')}
              title="إعدادات الدوام وباقات الكاميرات"
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-700 border border-slate-200 transition-colors"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* PIN Lock Button */}
            {settings.isPinEnabled && (
              <button
                onClick={lockApp}
                title="قفل التطبيق برمز الأمان"
                className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 border border-slate-200 transition-colors"
              >
                <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
