import React from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { StatsBanner } from './components/StatsBanner';
import { CalendarView } from './components/CalendarView';
import { AppointmentModal } from './components/AppointmentModal';
import { DayDetailsModal } from './components/DayDetailsModal';
import { SettingsModal } from './components/SettingsModal';
import { PinLockModal } from './components/PinLockModal';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

export const App: React.FC = () => {
  const { isLocked, activeModal, notification } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-amber-400 selection:text-black">
      {/* Header */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <StatsBanner />
        <CalendarView />
      </main>

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200 max-w-md w-11/12">
          <div
            className={`p-3.5 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs sm:text-sm font-bold ${
              notification.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : notification.type === 'warning'
                ? 'bg-amber-900 text-white border-amber-700'
                : notification.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {notification.type === 'success' && (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            {notification.type === 'warning' && (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            {notification.type === 'error' && (
              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            {notification.type === 'info' && (
              <Info className="w-5 h-5 text-sky-400 shrink-0" />
            )}
            <span className="flex-1 leading-snug">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Modals */}
      {activeModal === 'appointment' && <AppointmentModal />}
      {activeModal === 'day-details' && <DayDetailsModal />}
      {activeModal === 'settings' && <SettingsModal />}

      {/* PIN Lock Screen */}
      {isLocked && <PinLockModal />}

      {/* Footer */}
      <footer className="py-4 border-t border-slate-200 text-center text-xs font-bold text-slate-400 bg-white">
        <p>SAFE ZONE - نظام إدارة عمليات وفنيي كاميرات المراقبة © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default App;
