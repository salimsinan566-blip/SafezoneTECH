import React from 'react';
import { X, Plus, Calendar, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  ARABIC_DAYS,
  ARABIC_MONTHS,
  getWorkloadStyles,
  parseDateKey,
} from '../utils/dateUtils';
import { AppointmentCard } from './AppointmentCard';

export const DayDetailsModal: React.FC = () => {
  const {
    selectedDate,
    closeModals,
    openNewAppointment,
    getDayWorkload,
    settings,
  } = useApp();

  const workload = getDayWorkload(selectedDate);
  const styles = getWorkloadStyles(workload.level);

  const parsed = parseDateKey(selectedDate);
  const dayName = ARABIC_DAYS[parsed.getDay()];
  const dayNum = parsed.getDate();
  const monthName = ARABIC_MONTHS[parsed.getMonth()].split('/')[0].trim();
  const year = parsed.getFullYear();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
                <Calendar className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  {dayName}، {dayNum} {monthName} {year}
                </h3>
                <span className="text-xs font-bold text-slate-400">
                  {selectedDate}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={closeModals}
            className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workload Status Bar in Modal */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-100 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${styles.badgeBg}`}
              >
                <span className={`w-2 h-2 rounded-full ${styles.dotBg}`}></span>
                {styles.statusText}
              </span>

              <span className="text-xs font-extrabold text-slate-700">
                {workload.totalBookedHours} ساعات محجوزة من {workload.maxWorkingHours} ساعات دوام
              </span>
            </div>

            <span className="text-xs font-bold text-slate-400">
              نسبة الإشغال: {workload.percentage}%
            </span>
          </div>

          <div className="mt-2 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${workload.percentage}%`,
                backgroundColor: styles.colorHex,
              }}
            ></div>
          </div>
        </div>

        {/* Content Body: List of Appointments */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-black text-slate-800">
              المواعيد المسجلة في هذا اليوم ({workload.appointmentCount})
            </h4>

            <button
              onClick={() => openNewAppointment(selectedDate)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة موعد لهذا اليوم</span>
            </button>
          </div>

          {workload.appointments.length === 0 ? (
            <div className="text-center py-10 px-4 bg-emerald-50/50 rounded-2xl border border-emerald-200">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                <Clock className="w-6 h-6" />
              </div>
              <h5 className="font-bold text-emerald-900 text-base mb-1">
                اليوم فارغ بالكامل (أخضر)
              </h5>
              <p className="text-xs font-semibold text-emerald-700 max-w-sm mx-auto mb-4">
                لا توجد أي مواعيد محجوزة حتى الآن، يمكنك جدولة مواعيد جديدة في ساعات الدوام ({settings.workStartTime} إلى {settings.workEndTime}).
              </p>
              <button
                onClick={() => openNewAppointment(selectedDate)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>تسجيل موعد الآن</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {workload.appointments.map((apt) => (
                <AppointmentCard key={apt.id} appointment={apt} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={closeModals}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
