import React from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { CalendarView } from './components/CalendarView';
import { DayDetailsModal } from './components/DayDetailsModal';
import { QuickBookModal } from './components/QuickBookModal';
import { BookedAppointmentModal } from './components/BookedAppointmentModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { AppointmentModal } from './components/AppointmentModal';
import { PinLockModal } from './components/PinLockModal';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

export const App: React.FC = () => {
  const {
    isLocked,
    activeModal,
    isAuthModalOpen,
    notification,
  } = useApp();

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-neutral-900 flex flex-col selection:bg-black selection:text-white font-sans">
      {/* Header */}
      <Header />

      {/* Main Clean Calendar Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-1.5 sm:px-6 lg:px-8 py-3 sm:py-8">
        <CalendarView />
      </main>

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-md w-11/12">
          <div
            className={`p-3.5 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs sm:text-sm font-bold ${
              notification.type === 'success'
                ? 'bg-black text-white border-black/20'
                : notification.type === 'warning'
                ? 'bg-neutral-900 text-amber-300 border-amber-600/30'
                : notification.type === 'error'
                ? 'bg-rose-950 text-rose-200 border-rose-800'
                : 'bg-neutral-900 text-white border-neutral-700'
            }`}
          >
            {notification.type === 'success' && (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            {notification.type === 'warning' && (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            {notification.type === 'error' && (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            {notification.type === 'info' && (
              <Info className="w-4 h-4 text-neutral-400 shrink-0" />
            )}
            <span className="flex-1 leading-snug">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Interactive Pop-up Modals */}
      {activeModal === 'day-details' && <DayDetailsModal />}
      {activeModal === 'quick-book' && <QuickBookModal />}
      {activeModal === 'booked-detail' && <BookedAppointmentModal />}
      {activeModal === 'settings' && <SettingsModal />}
      {activeModal === 'appointment' && <AppointmentModal />}

      {/* Technician Account Authentication Modal */}
      {isAuthModalOpen && <AuthModal />}

      {/* Optional PIN Lock Screen */}
      {isLocked && <PinLockModal />}

      {/* Clean Footer */}
      <footer className="py-4 border-t border-black/10 text-center text-xs font-semibold text-neutral-400 bg-white">
        <p>SAFE ZONE - نظام إدارة ومواعيد فنيي الأنظمة الأمنية © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default App;
