import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  Circle,
  Plus,
  Edit3,
  Trash2,
  MessageCircle,
  Camera,
  Wrench,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  ARABIC_DAYS,
  ARABIC_MONTHS,
  formatDateKey,
  parseDateKey,
  formatTimeArabic,
} from '../utils/dateUtils';
import { Appointment } from '../types';

export const TodayLogModal: React.FC = () => {
  const {
    appointments,
    closeModals,
    openNewAppointment,
    openEditAppointment,
    deleteAppointment,
    toggleComplete,
  } = useApp();

  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const now = new Date();
  const todayKey = formatDateKey(now);
  const parsedToday = parseDateKey(todayKey);
  const dayName = ARABIC_DAYS[parsedToday.getDay()];
  const dayNum = parsedToday.getDate();
  const monthName = ARABIC_MONTHS[parsedToday.getMonth()].split('/')[0].trim();
  const year = parsedToday.getFullYear();

  // Filter today's appointments
  const todayAppointments = (appointments || [])
    .filter((a) => a && a.date === todayKey)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Metrics
  const totalCount = todayAppointments.length;
  const completedCount = todayAppointments.filter((a) => a.isCompleted).length;
  const pendingCount = totalCount - completedCount;
  const totalHours = todayAppointments.reduce(
    (sum, a) => sum + (Number(a.durationHours) || 0),
    0
  );

  // Apply filter
  const displayedAppointments = todayAppointments.filter((a) => {
    if (filter === 'completed') return a.isCompleted;
    if (filter === 'pending') return !a.isCompleted;
    return true;
  });

  const getCleanPhone = (phone?: string) => {
    if (!phone) return '';
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('07')) {
      clean = '964' + clean.substring(1);
    } else if (clean.startsWith('7')) {
      clean = '964' + clean;
    }
    return clean;
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف موعد [${name}]؟`)) {
      deleteAppointment(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-6 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-neutral-900 to-neutral-800 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-md">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black tracking-tight">
                  سجل مواعيد اليوم
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-950">
                  {totalCount} {totalCount === 1 ? 'موعد' : 'مواعيد'}
                </span>
              </div>
              <p className="text-xs font-bold text-neutral-300 mt-0.5">
                {dayName}، {dayNum} {monthName} {year}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeModals}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 sm:p-4 bg-neutral-50 border-b border-neutral-200">
          <div className="bg-white p-3 rounded-2xl border border-neutral-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-neutral-500 block">إجمالي المواعيد</span>
            <span className="text-xl font-black text-neutral-900">{totalCount}</span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-neutral-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-600 block">المكتملة ✓</span>
            <span className="text-xl font-black text-emerald-600">{completedCount}</span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-neutral-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-amber-600 block">قيد التنفيذ ⏳</span>
            <span className="text-xl font-black text-amber-600">{pendingCount}</span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-neutral-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-neutral-500 block">ساعات العمل</span>
            <span className="text-xl font-black text-neutral-900">{totalHours} س</span>
          </div>
        </div>

        {/* Action Bar & Filter */}
        <div className="p-3 sm:px-6 border-b border-neutral-100 flex flex-wrap items-center justify-between gap-2.5 bg-white">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl border border-neutral-200">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filter === 'all'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              الكل ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filter === 'pending'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              قيد التنفيذ ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('completed')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filter === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              المكتملة ({completedCount})
            </button>
          </div>

          {/* Add appointment for today */}
          <button
            type="button"
            onClick={() => openNewAppointment(todayKey)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>+ موعد جديد لليوم</span>
          </button>
        </div>

        {/* Content / Appointments List */}
        <div className="p-3.5 sm:p-6 overflow-y-auto flex-1 space-y-3.5">
          {displayedAppointments.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-3xl bg-neutral-50 border border-dashed border-neutral-300 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-neutral-200/80 flex items-center justify-center text-neutral-400">
                <Calendar className="w-7 h-7" />
              </div>
              <h4 className="text-base font-black text-neutral-800">
                {filter === 'all'
                  ? 'لا توجد مواعيد مسجلة لليوم حتى الآن'
                  : filter === 'pending'
                  ? 'رائع! لا توجد مواعيد معلقة لليوم'
                  : 'لا توجد مواعيد مكتملة حتى الآن'}
              </h4>
              <p className="text-xs font-semibold text-neutral-500 max-w-sm mx-auto">
                يمكنك تسجيل أي موعد جديد أو إضافة مهمة صيانة مباشرة لليوم بضغطة زر.
              </p>
              <button
                type="button"
                onClick={() => openNewAppointment(todayKey)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-md transition-all active:scale-95 mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة موعد لليوم الآن</span>
              </button>
            </div>
          ) : (
            displayedAppointments.map((apt: Appointment) => {
              const cleanPhone = getCleanPhone(apt.customerPhone);
              const isDone = apt.isCompleted;

              return (
                <div
                  key={apt.id}
                  className={`rounded-2xl p-4 border transition-all shadow-2xs ${
                    isDone
                      ? 'bg-neutral-50/70 border-neutral-200 opacity-90'
                      : 'bg-white border-neutral-300/80 hover:border-amber-400 ring-1 ring-black/5'
                  }`}
                >
                  {/* Card Header: Time & Status */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-neutral-100">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-900 font-mono text-xs font-black">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>
                          {formatTimeArabic(apt.startTime)} - {formatTimeArabic(apt.endTime)}
                        </span>
                      </span>
                      <span className="text-[11px] font-bold text-neutral-500">
                        ({apt.durationHours} س)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleComplete(apt.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                      }`}
                    >
                      {isDone ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>مكتمل ✓</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-3.5 h-3.5 text-amber-600" />
                          <span>قيد التنفيذ</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Customer Info */}
                  <div className="py-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-neutral-400 shrink-0" />
                      <h4 className="text-sm sm:text-base font-black text-neutral-900">
                        {apt.customerName}
                      </h4>
                    </div>

                    {apt.location && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-neutral-600">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>{apt.location}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      {apt.serviceName && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 font-bold">
                          <Camera className="w-3 h-3 text-neutral-500" />
                          <span>{apt.serviceName}</span>
                          {apt.camerasCount !== undefined && apt.camerasCount > 0 && (
                            <span className="text-neutral-500">({apt.camerasCount} كاميرات)</span>
                          )}
                        </span>
                      )}

                      {(apt.technicianName || (apt.technicians && apt.technicians.length > 0)) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 font-bold border border-amber-200/60">
                          <Wrench className="w-3 h-3 text-amber-600" />
                          <span>الفريق: {apt.technicians?.join(' + ') || apt.technicianName}</span>
                        </span>
                      )}
                    </div>

                    {apt.notes && (
                      <div className="mt-2 p-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-neutral-600">
                        <span className="font-bold text-neutral-800">ملاحظات: </span>
                        {apt.notes}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2.5 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2">
                    {/* Communication */}
                    <div className="flex items-center gap-1.5">
                      {apt.customerPhone ? (
                        <>
                          <a
                            href={`tel:${apt.customerPhone}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>اتصال</span>
                          </a>

                          <a
                            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                              `السلام عليكم أستاذ ${apt.customerName}، معكم فريق SAFE ZONE بخصوص موعد تركيب كاميرات المراقبة اليوم الساعة ${formatTimeArabic(
                                apt.startTime
                              )}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>واتساب</span>
                          </a>
                        </>
                      ) : (
                        <span className="text-[11px] font-semibold text-neutral-400">
                          لا يوجد رقم هاتف
                        </span>
                      )}
                    </div>

                    {/* Manage & Edit */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditAppointment(apt)}
                        className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
                        title="تعديل الموعد"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(apt.id, apt.customerName)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                        title="حذف الموعد"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:px-6 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-500">
            SAFE ZONE - سجل العمليات اليومي
          </span>
          <button
            type="button"
            onClick={closeModals}
            className="px-5 py-2 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
