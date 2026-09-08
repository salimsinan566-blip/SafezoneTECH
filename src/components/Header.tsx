import React, { useState } from 'react';
import { Settings, User, LogOut, LogIn, CheckCircle2, ClipboardList } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateKey } from '../utils/dateUtils';

export const Header: React.FC = () => {
  const {
    setActiveModal,
    currentUser,
    logoutTechnician,
    setIsAuthModalOpen,
    isSupabaseConnected,
    appointments,
    openTodayLog,
  } = useApp();

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const todayKey = formatDateKey(new Date());
  const todayCount = (appointments || []).filter((a) => a && a.date === todayKey).length;

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-neutral-200/60 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-black p-0.5 shadow-sm ring-1 ring-black/20 shrink-0 overflow-hidden flex items-center justify-center">
              <img src="/logo.png" alt="SAFE ZONE" className="w-full h-full object-contain" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-black tracking-tight text-black font-sans">
                  SAFE ZONE
                </h1>
                {/* Cloud Status Dot */}
                <span
                  title={isSupabaseConnected ? "متصل بالسحابة (مزامنة مباشرة)" : "وضع محلي"}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-500"
                >
                  <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-500' : 'bg-neutral-300'}`}></span>
                </span>
              </div>
            </div>
          </div>

          {/* User & Settings Actions */}
          <div className="flex items-center gap-2">
            {/* Technician Profile Button */}
            <div className="relative">
              {currentUser ? (
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-black/10 bg-neutral-50 hover:bg-neutral-100 text-xs font-bold text-neutral-900 transition-colors"
                >
                  <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-black">
                    {(currentUser.name || 'ف').charAt(0)}
                  </span>
                  <span className="max-w-[90px] sm:max-w-none truncate">{currentUser.name || 'فني'}</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black text-white hover:bg-neutral-800 text-xs font-bold transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>دخول الفني</span>
                </button>
              )}

              {/* Profile Dropdown Menu */}
              {showProfileMenu && currentUser && (
                <div
                  className="absolute left-0 mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-black/10 py-1.5 z-50 text-xs font-semibold"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <div className="px-3 py-2 border-b border-neutral-100 text-neutral-500 text-[11px]">
                    مسجل باسم:
                    <div className="font-bold text-black text-sm">{currentUser.name || 'فني'}</div>
                    <div className="text-[10px] text-neutral-400 truncate">{currentUser.email || ''}</div>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setIsAuthModalOpen(true);
                    }}
                    className="w-full text-right px-3 py-2 hover:bg-neutral-50 flex items-center gap-2 text-neutral-700"
                  >
                    <User className="w-3.5 h-3.5 text-neutral-400" />
                    <span>تبديل الحساب</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logoutTechnician();
                    }}
                    className="w-full text-right px-3 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              )}
            </div>

            {/* Today's Log Button */}
            <button
              onClick={openTodayLog}
              title="سجل مواعيد اليوم"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-500/40 bg-amber-50 hover:bg-amber-100 text-slate-950 text-xs font-black transition-all active:scale-95 shadow-2xs"
            >
              <ClipboardList className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="hidden sm:inline">سجل مواعيد اليوم</span>
              <span className="sm:hidden">سجل اليوم</span>
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black leading-none">
                {todayCount}
              </span>
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setActiveModal('settings')}
              title="الإعدادات"
              className="p-2 rounded-lg border border-black/10 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 hover:text-black transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

