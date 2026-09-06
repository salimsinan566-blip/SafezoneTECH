import React, { useState } from 'react';
import {
  X,
  Settings,
  Clock,
  Save,
  RotateCcw,
  Sparkles,
  User,
  Sliders,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WorkSettings, QuickPreset } from '../types';
import { DEFAULT_SETTINGS } from '../utils/storage';
import { DEFAULT_QUICK_PRESETS } from '../lib/supabase';

export const SettingsModal: React.FC = () => {
  const {
    settings,
    updateSettings,
    closeModals,
    currentUser,
    setIsAuthModalOpen,
  } = useApp();

  const [formData, setFormData] = useState<WorkSettings>(() => {
    const clone: WorkSettings = JSON.parse(JSON.stringify(settings));
    if (!clone.quickPresets || clone.quickPresets.length < 4) {
      clone.quickPresets = DEFAULT_QUICK_PRESETS;
    }
    return clone;
  });

  const handlePresetChange = (index: number, field: keyof QuickPreset, value: any) => {
    setFormData((prev) => {
      const presets = [...(prev.quickPresets || DEFAULT_QUICK_PRESETS)];
      presets[index] = {
        ...presets[index],
        [field]: field === 'durationMinutes' ? Number(value) || 15 : value,
      };
      return {
        ...prev,
        quickPresets: presets,
      };
    });
  };

  const handleSave = () => {
    updateSettings(formData);
    closeModals();
  };

  const handleReset = () => {
    if (window.confirm('هل تريد إعادة تعيين الإعدادات إلى الوضع الافتراضي؟')) {
      setFormData(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-black/10 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-black/10 flex items-center justify-between bg-neutral-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center shadow-xs">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-black">
                إعدادات SAFE ZONE
              </h3>
              <p className="text-[11px] text-neutral-500">
                تخصيص القوالب الأربعة وساعات العمل
              </p>
            </div>
          </div>

          <button
            onClick={closeModals}
            className="p-1.5 rounded-xl hover:bg-neutral-200 text-neutral-500 hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Active Technician Profile Banner */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-black/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-black">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 font-bold block">الفني النشط حالياً:</span>
                <span className="text-xs font-black text-black">
                  {currentUser ? currentUser.name : 'لم يتم تسجيل الدخول بعد'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                closeModals();
                setIsAuthModalOpen(true);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-black/15 hover:bg-neutral-100 text-xs font-black text-black transition-colors"
            >
              {currentUser ? 'تبديل الحساب' : 'تسجيل الدخول'}
            </button>
          </div>

          {/* 4 Quick Presets Configuration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-black flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                الخيارات الأربعة السريعة (في نافذة حجز اليوم)
              </h4>
              <span className="text-[10px] text-neutral-400 font-semibold">4 خيارات سريعة</span>
            </div>

            <div className="space-y-2.5">
              {(formData.quickPresets || DEFAULT_QUICK_PRESETS).slice(0, 4).map((preset, index) => (
                <div
                  key={preset.id || index}
                  className="p-3 rounded-2xl border border-black/10 bg-white shadow-2xs space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] font-black flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={preset.label}
                      onChange={(e) => handlePresetChange(index, 'label', e.target.value)}
                      placeholder={`تسمية الخيار السريع ${index + 1}`}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-black/15 text-xs font-bold text-black focus:border-black outline-hidden"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs gap-2 pr-7">
                    <span className="text-neutral-500 font-medium">المدة بالدقائق:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={15}
                        step={15}
                        max={480}
                        value={preset.durationMinutes}
                        onChange={(e) => handlePresetChange(index, 'durationMinutes', e.target.value)}
                        className="w-20 px-2 py-1 rounded-lg border border-black/15 text-xs font-bold text-black text-center focus:border-black outline-hidden"
                      />
                      <span className="text-[11px] text-neutral-500 font-bold">
                        ({preset.durationMinutes >= 60 ? `${(preset.durationMinutes / 60).toFixed(1)} س` : `${preset.durationMinutes} د`})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Working Hours Range */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-black flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              ساعات العمل اليومية (نطاق الساعات المتاح في الكالندر)
            </h4>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl border border-black/10 bg-neutral-50">
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                  بداية الدوام
                </label>
                <input
                  type="time"
                  value={formData.workStartTime}
                  onChange={(e) => setFormData({ ...formData, workStartTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-black/20 text-xs font-bold text-black focus:border-black outline-hidden bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                  نهاية الدوام
                </label>
                <input
                  type="time"
                  value={formData.workEndTime}
                  onChange={(e) => setFormData({ ...formData, workEndTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-black/20 text-xs font-bold text-black focus:border-black outline-hidden bg-white"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-neutral-50 border-t border-black/10 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-xl text-neutral-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="استعادة الافتراضي"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeModals}
              className="px-4 py-2 rounded-xl border border-black/10 hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>حفظ الإعدادات</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
