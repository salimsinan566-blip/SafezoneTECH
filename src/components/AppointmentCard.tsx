import React from 'react';
import {
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Camera,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Appointment } from '../types';
import { useApp } from '../context/AppContext';
import { formatTimeArabic } from '../utils/dateUtils';

interface AppointmentCardProps {
  appointment: Appointment;
  showDate?: boolean;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  showDate = false,
}) => {
  const { toggleComplete, openEditAppointment, deleteAppointment } = useApp();

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${appointment.customerPhone}`;
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = appointment.customerPhone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const handleOpenMaps = (e: React.MouseEvent) => {
    e.stopPropagation();
    const query = encodeURIComponent(appointment.location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`هل أنت متأكد من حذف موعد العميل "${appointment.customerName}"؟`)) {
      deleteAppointment(appointment.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    openEditAppointment(appointment);
  };

  return (
    <div
      className={`group relative rounded-2xl p-4 transition-all duration-200 border ${
        appointment.isCompleted
          ? 'bg-slate-50/90 border-emerald-300 shadow-sm opacity-90'
          : 'bg-white border-amber-200 hover:border-amber-400 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Header Row: Customer Name + Checkpoint toggle */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`font-black text-base sm:text-lg truncate ${
                appointment.isCompleted ? 'text-slate-600 line-through' : 'text-slate-900'
              }`}
            >
              {appointment.customerName}
            </h3>

            {/* Service & Camera Badge */}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
              <Camera className="w-3.5 h-3.5 text-amber-700" />
              <span>{appointment.serviceName}</span>
              {appointment.camerasCount > 0 && (
                <span className="mr-1 bg-amber-400/50 px-1 rounded text-[11px]">
                  ({appointment.camerasCount} كاميرات)
                </span>
              )}
            </span>
          </div>

          {showDate && (
            <span className="text-xs font-semibold text-slate-500 block mt-1">
              التاريخ: {appointment.date}
            </span>
          )}
        </div>

        {/* The Simple Single-click Checkpoint (اكتمل) */}
        <button
          onClick={() => toggleComplete(appointment.id)}
          title={appointment.isCompleted ? 'تحويل إلى قيد التنفيذ' : 'تعليم كمكتمل'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
            appointment.isCompleted
              ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
              : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300'
          }`}
        >
          {appointment.isCompleted ? (
            <>
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>اكتمل ✓</span>
            </>
          ) : (
            <>
              <Circle className="w-4 h-4 stroke-[2]" />
              <span>قيد التنفيذ</span>
            </>
          )}
        </button>
      </div>

      {/* Time & Duration row */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-3 bg-amber-50/60 p-2.5 rounded-xl border border-amber-100">
        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          {formatTimeArabic(appointment.startTime)} ← {formatTimeArabic(appointment.endTime)}
        </span>
        <span className="mr-auto px-2 py-0.5 rounded-md bg-white border border-amber-200 text-amber-900 text-[11px] font-black">
          {appointment.durationHours} {appointment.durationHours === 1 ? 'ساعة' : 'ساعات'}
        </span>
      </div>

      {/* Location text */}
      {appointment.location && (
        <div className="flex items-center justify-between gap-2 text-xs text-slate-600 mb-3 bg-slate-50 p-2 rounded-xl">
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{appointment.location}</span>
          </div>
          <button
            onClick={handleOpenMaps}
            title="فتح العنوان في خرائط جوجل"
            className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:underline px-2 py-0.5 rounded bg-amber-100/60"
          >
            <ExternalLink className="w-3 h-3" />
            <span>الخريطة</span>
          </button>
        </div>
      )}

      {/* Notes if any */}
      {appointment.notes && (
        <p className="text-xs text-slate-500 mb-3 bg-white p-2 rounded-lg border border-slate-100 italic">
          ملاحظة: {appointment.notes}
        </p>
      )}

      {/* Footer Actions: Call, WhatsApp, Edit, Delete */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
        {/* Contact buttons */}
        <div className="flex items-center gap-2">
          {appointment.customerPhone ? (
            <>
              <button
                onClick={handleCall}
                title={`اتصال: ${appointment.customerPhone}`}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>اتصال</span>
              </button>

              <button
                onClick={handleWhatsApp}
                title="محادثة واتساب"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>واتساب</span>
              </button>
            </>
          ) : (
            <span className="text-xs text-slate-400 italic">لا يوجد رقم هاتف</span>
          )}
        </div>

        {/* Edit & Delete */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleEdit}
            title="تعديل الموعد"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            title="حذف الموعد"
            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
