import React, { useState, useEffect } from 'react';
import {
  X,
  Camera,
  Clock,
  User,
  Phone,
  MapPin,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Wrench,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ServicePackage } from '../types';
import { addHoursToTime, formatTimeArabic, isTimeOverlapping } from '../utils/dateUtils';

export const AppointmentModal: React.FC = () => {
  const {
    editingAppointment,
    selectedDate,
    settings,
    closeModals,
    addAppointment,
    updateAppointment,
    appointments,
  } = useApp();

  const isEdit = Boolean(editingAppointment);

  // Form State
  const [customerName, setCustomerName] = useState(editingAppointment?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(editingAppointment?.customerPhone || '');
  const [location, setLocation] = useState(editingAppointment?.location || '');
  const [date, setDate] = useState(editingAppointment?.date || selectedDate);
  const [startTime, setStartTime] = useState(
    editingAppointment?.startTime || settings.workStartTime || '09:00'
  );
  const [selectedServiceId, setSelectedServiceId] = useState(
    editingAppointment?.serviceId || settings.servicePackages[0]?.id || 'custom'
  );
  const [serviceName, setServiceName] = useState(
    editingAppointment?.serviceName || settings.servicePackages[0]?.name || 'تركيب كاميرات'
  );
  const [camerasCount, setCamerasCount] = useState<number>(
    editingAppointment?.camerasCount ?? (settings.servicePackages[0]?.camerasCount || 4)
  );
  const [durationHours, setDurationHours] = useState<number>(
    editingAppointment?.durationHours ?? (settings.servicePackages[0]?.durationHours || 3.0)
  );
  
  // Multi-technicians state
  const initialTechs = editingAppointment?.technicians && editingAppointment.technicians.length > 0
    ? editingAppointment.technicians
    : editingAppointment?.technicianName
    ? editingAppointment.technicianName.split(/[,،]/).map((s) => s.trim()).filter(Boolean)
    : [];
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>(initialTechs);

  const toggleTechnician = (name: string) => {
    setSelectedTechnicians((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  const [notes, setNotes] = useState(editingAppointment?.notes || '');
  const [isCompleted, setIsCompleted] = useState(editingAppointment?.isCompleted || false);

  // Computed End Time
  const endTime = addHoursToTime(startTime, durationHours);

  // When a service package is chosen from the buttons or select
  const handleSelectPackage = (pkg: ServicePackage) => {
    setSelectedServiceId(pkg.id);
    setServiceName(pkg.name);
    setCamerasCount(pkg.camerasCount);
    setDurationHours(pkg.durationHours);
  };

  // Conflict detection
  const conflict = appointments.find(
    (existing) =>
      existing.id !== editingAppointment?.id &&
      existing.date === date &&
      isTimeOverlapping(startTime, endTime, existing.startTime, existing.endTime)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('يرجى إدخال اسم العميل');
      return;
    }

    const payload = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      location: location.trim(),
      date,
      startTime,
      endTime,
      durationHours: Number(durationHours),
      serviceId: selectedServiceId,
      serviceName,
      camerasCount: Number(camerasCount),
      technicians: selectedTechnicians,
      technicianName: selectedTechnicians.join('، '),
      notes: notes.trim(),
      isCompleted,
    };

    if (isEdit && editingAppointment) {
      updateAppointment(editingAppointment.id, payload);
    } else {
      addAppointment(payload);
    }

    closeModals();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full my-6 shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                {isEdit ? 'تعديل موعد العميل' : 'حجز موعد عملية جديدة'}
              </h3>
              <p className="text-xs font-bold text-slate-500">
                SAFE ZONE - جدولة عمليات كاميرات المراقبة
              </p>
            </div>
          </div>

          <button
            onClick={closeModals}
            className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto max-h-[75vh]">
          
          {/* Service Package Matrix Selection */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-2">
              اختر نوع الخدمة / عدد الكاميرات (يحدد الوقت تلقائياً من الإعدادات):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {settings.servicePackages.map((pkg) => {
                const isSelected = selectedServiceId === pkg.id;
                return (
                  <button
                    type="button"
                    key={pkg.id}
                    onClick={() => handleSelectPackage(pkg)}
                    className={`p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-100/80 border-amber-500 ring-2 ring-amber-400 text-amber-950 font-black shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold block mb-1 truncate">
                      {pkg.name}
                    </span>
                    <span className="text-[11px] font-black text-amber-700">
                      ⏱ {pkg.durationHours} {pkg.durationHours === 1 ? 'ساعة' : 'ساعات'}
                    </span>
                  </button>
                );
              })}

              {/* Custom option */}
              <button
                type="button"
                onClick={() => setSelectedServiceId('custom')}
                className={`p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                  selectedServiceId === 'custom'
                    ? 'bg-amber-100/80 border-amber-500 ring-2 ring-amber-400 text-amber-950 font-black shadow-sm'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <span className="text-xs font-bold block mb-1">خدمة مخصصة أخرى</span>
                <span className="text-[11px] font-black text-slate-500">وقت حر</span>
              </button>
            </div>
          </div>

          {/* Time & Duration Fields */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  تاريخ الموعد:
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  وقت البدء:
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Duration in Hours (Manual override possible) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  المدة المحجوزة (بالساعات):
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Calculated End Time Badge */}
            <div className="flex items-center justify-between text-xs font-bold bg-white p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-700">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>
                  الفترة: {formatTimeArabic(startTime)} حتى {formatTimeArabic(endTime)}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[11px] font-black">
                إجمالي: {durationHours} ساعات
              </span>
            </div>

            {/* Conflict Warning */}
            {conflict && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p>تنبيه تعارض زمني:</p>
                  <p className="font-normal text-rose-800">
                    يوجد موعد آخر للعميل [{conflict.customerName}] من {formatTimeArabic(conflict.startTime)} إلى {formatTimeArabic(conflict.endTime)} في نفس اليوم!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Customer Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                اسم العميل أو المنشأة: *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="مثال: أحمد عبد الله (فيلا)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                رقم الهاتف (للاتصال والواتساب):
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="0770xxxxxxx"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  dir="ltr"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>
          </div>

          {/* Multi-Technicians Assignment */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>الفنيين المكلفين بالموقع (يمكن تحديد أكثر من فني):</span>
              </label>
              {selectedTechnicians.length > 0 && (
                <span className="text-[11px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                  {selectedTechnicians.length} فنيين محددين
                </span>
              )}
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex flex-wrap gap-2">
                {(settings.technicians || []).map((t) => {
                  const isChecked = selectedTechnicians.includes(t.name);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTechnician(t.name)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
                        isChecked
                          ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20 ring-2 ring-amber-400'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span>👷</span>
                      <span>{t.name}</span>
                      {isChecked && <span className="mr-1 text-[11px] font-black">✓</span>}
                    </button>
                  );
                })}

                {(!settings.technicians || settings.technicians.length === 0) && (
                  <p className="text-xs font-semibold text-slate-400 py-1">
                    لم تقم بإضافة فنيين في الإعدادات بعد. يمكنك إضافتهم من شاشة الإعدادات ⚙️
                  </p>
                )}
              </div>

              {selectedTechnicians.length > 0 ? (
                <div className="pt-2 border-t border-slate-200/80 text-[11px] font-bold text-slate-600">
                  فريق العمل لهذا الموقع: <span className="text-slate-900 font-black">{selectedTechnicians.join(' + ')}</span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  اضغط على اسم الفني لإضافته لفريق هذا الموقع (يمكن اختيار أكثر من فني).
                </p>
              )}
            </div>
          </div>

          {/* Location / Address */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">
              العنوان وموقع التركيب:
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="مثال: بغداد - المنصور - قرب مول بابلون"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
          </div>

          {/* Service Name & Number of Cameras (if custom) */}
          {selectedServiceId === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم الخدمة المخصصة:
                </label>
                <input
                  type="text"
                  placeholder="مثال: فحص كاميرات قديمة"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عدد الكاميرات:
                </label>
                <input
                  type="number"
                  min="0"
                  value={camerasCount}
                  onChange={(e) => setCamerasCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">
              ملاحظات وتفاصيل العمل (اختياري):
            </label>
            <div className="relative">
              <textarea
                rows={2}
                placeholder="نوع الكاميرات (داخلي/خارجي)، طول الأسلاك، متطلبات خاصة..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Single Checkpoint Checkbox (جيك بوينت: اكتمل) */}
          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`w-5 h-5 ${isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}
              />
              <div>
                <span className="text-xs font-black text-slate-900 block">
                  نقطة التحقق (Checkmark): اكتمل العمل
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  حدد هنا إذا تم الانتهاء من تركيب المنظومة وتسليمها للعميل
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isCompleted}
                onChange={(e) => setIsCompleted(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeModals}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              إلغاء
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition-all"
            >
              {isEdit ? 'حفظ التعديلات' : 'تأكيد وحفظ الموعد'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
