import React, { useState } from 'react';
import {
  X,
  Settings,
  Clock,
  Camera,
  Plus,
  Trash2,
  Lock,
  Download,
  Upload,
  RotateCcw,
  Save,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ServicePackage, WorkSettings } from '../types';
import { calculateDailyMaxHours } from '../utils/dateUtils';
import { DEFAULT_SERVICE_PACKAGES, DEFAULT_SETTINGS } from '../utils/storage';

export const SettingsModal: React.FC = () => {
  const {
    settings,
    updateSettings,
    closeModals,
    appointments,
    showNotification,
    isSupabaseConnected,
  } = useApp();

  const [formData, setFormData] = useState<WorkSettings>(() => JSON.parse(JSON.stringify(settings)));
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgCameras, setNewPkgCameras] = useState<number>(4);
  const [newPkgDuration, setNewPkgDuration] = useState<number>(3.0);
  const [showAddForm, setShowAddForm] = useState(false);

  // Daily hours calculation
  const dailyHours = calculateDailyMaxHours(formData.workStartTime, formData.workEndTime);

  // Add new service package rule
  const handleAddPackage = () => {
    if (!newPkgName.trim()) {
      alert('يرجى كتابة اسم الباقة أو الخدمة');
      return;
    }

    const newPkg: ServicePackage = {
      id: 'pkg-' + Date.now(),
      name: newPkgName.trim(),
      camerasCount: Number(newPkgCameras) || 0,
      durationHours: Number(newPkgDuration) || 1,
    };

    setFormData((prev) => ({
      ...prev,
      servicePackages: [...prev.servicePackages, newPkg],
    }));

    setNewPkgName('');
    setNewPkgCameras(4);
    setNewPkgDuration(3.0);
    setShowAddForm(false);
  };

  // Remove service package
  const handleRemovePackage = (id: string) => {
    if (formData.servicePackages.length <= 1) {
      alert('يجب الإبقاء على خدمة واحدة على الأقل');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      servicePackages: prev.servicePackages.filter((p) => p.id !== id),
    }));
  };

  // Update a package inline
  const handleUpdatePackage = (id: string, field: 'name' | 'camerasCount' | 'durationHours', value: any) => {
    setFormData((prev) => ({
      ...prev,
      servicePackages: prev.servicePackages.map((pkg) =>
        pkg.id === id ? { ...pkg, [field]: value } : pkg
      ),
    }));
  };

  // Export Data JSON
  const handleExportData = () => {
    const data = {
      settings: formData,
      appointments,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safezone_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showNotification('تم تنزيل النسخة الاحتياطية بنجاح', 'success');
  };

  // Import Data JSON
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.settings) {
          setFormData(parsed.settings);
          updateSettings(parsed.settings);
        }
        if (parsed.appointments) {
          localStorage.setItem('safezone_appointments_v1', JSON.stringify(parsed.appointments));
          window.location.reload();
        }
        showNotification('تم استيراد البيانات بنجاح', 'success');
      } catch (err) {
        showNotification('ملف النسخة الاحتياطية غير صالح', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Save Settings
  const handleSave = () => {
    updateSettings(formData);
    closeModals();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-6 shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                إعدادات SAFE ZONE وقواعد الوقت
              </h3>
              <p className="text-xs font-bold text-slate-500">
                تخصيص أوقات الدوام، باقات الكاميرات وساعات الحجز
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

        {/* Settings Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          
          {/* Section 1: Working Hours */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <h4 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>تخصيص ساعات الدوام الرسمي:</span>
            </h4>
            <p className="text-xs text-slate-500 mb-3 font-semibold">
              يتم على أساسها احتساب نسبة إشغال اليوم وتلوين التقويم (أخضر، أصفر، برتقالي، أحمر).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  بداية الدوام:
                </label>
                <input
                  type="time"
                  value={formData.workStartTime}
                  onChange={(e) =>
                    setFormData({ ...formData, workStartTime: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  نهاية الدوام:
                </label>
                <input
                  type="time"
                  value={formData.workEndTime}
                  onChange={(e) =>
                    setFormData({ ...formData, workEndTime: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  إجمالي ساعات العمل اليومية:
                </label>
                <div className="px-3 py-2 rounded-xl bg-amber-100/70 border border-amber-300 text-sm font-black text-amber-950 flex items-center justify-center">
                  {dailyHours} ساعات دوام
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Camera Services & Duration Matrix Rules */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-600" />
                  <span>قواعد وباقات تركيب الكاميرات والوقت المحجوز:</span>
                </h4>
                <p className="text-xs text-slate-500 font-semibold">
                  حدد مدة حجز الوقت لكل خدمة (مثل: 4 كاميرات = 3 ساعات، 8 كاميرات = 6 ساعات).
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة باقة جديدة</span>
              </button>
            </div>

            {/* Add New Package Drawer */}
            {showAddForm && (
              <div className="p-3.5 mb-3 rounded-2xl bg-amber-50 border border-amber-300 space-y-3">
                <h5 className="text-xs font-black text-amber-950">إضافة قاعدة باقة جديدة:</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="اسم الخدمة (مثل: نصب 12 كاميرا)"
                    value={newPkgName}
                    onChange={(e) => setNewPkgName(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="عدد الكاميرات"
                    value={newPkgCameras}
                    onChange={(e) => setNewPkgCameras(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  />
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    placeholder="المدة بالساعات"
                    value={newPkgDuration}
                    onChange={(e) => setNewPkgDuration(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleAddPackage}
                    className="px-4 py-1 rounded-lg bg-amber-500 text-slate-950 text-xs font-black"
                  >
                    إضافة للقواعد
                  </button>
                </div>
              </div>
            )}

            {/* Matrix Table */}
            <div className="space-y-2">
              {formData.servicePackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3"
                >
                  <div className="flex-1 w-full sm:w-auto">
                    <input
                      type="text"
                      value={pkg.name}
                      onChange={(e) =>
                        handleUpdatePackage(pkg.id, 'name', e.target.value)
                      }
                      className="w-full text-xs font-black text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:outline-none px-1 py-0.5"
                    />
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-slate-500 font-bold">كاميرات:</span>
                      <input
                        type="number"
                        min="0"
                        value={pkg.camerasCount}
                        onChange={(e) =>
                          handleUpdatePackage(
                            pkg.id,
                            'camerasCount',
                            Number(e.target.value)
                          )
                        }
                        className="w-14 px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold text-center"
                      />
                    </div>

                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-slate-500 font-bold">مدة الحجز:</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={pkg.durationHours}
                        onChange={(e) =>
                          handleUpdatePackage(
                            pkg.id,
                            'durationHours',
                            Number(e.target.value)
                          )
                        }
                        className="w-16 px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold text-center"
                      />
                      <span className="font-bold text-amber-700">ساعة</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemovePackage(pkg.id)}
                      title="حذف هذه الباقة"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: PIN Lock Security */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    حماية التطبيق برمز مرور سريع (PIN Code)
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold">
                    يطلب رمز الأمان عند فتح التطبيق لحماية بيانات الزبائن
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPinEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, isPinEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {formData.isPinEnabled && (
              <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                <label className="text-xs font-bold text-slate-700">
                  رمز المرور المخصص (4 أرقام):
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={formData.pinCode}
                  onChange={(e) =>
                    setFormData({ ...formData, pinCode: e.target.value })
                  }
                  className="w-24 px-3 py-1.5 rounded-xl border border-slate-300 text-center font-black tracking-widest text-base bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}
          </div>

          {/* Section 4: Cloud Status */}
          <div className="p-4 rounded-2xl border bg-white shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-900">
                  حالة المزامنة السحابية (Supabase Cloud):
                </h4>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  {isSupabaseConnected
                    ? 'متصل بقاعدة البيانات السحابية - المزامنة فورية بين جميع الأجهزة'
                    : 'التطبيق يعمل في الوضع المحلي (LocalStorage)'}
                </p>
              </div>

              {isSupabaseConnected ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>متصل بنجاح ✓</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-600 border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  <span>وضع محلي</span>
                </span>
              )}
            </div>
          </div>

          {/* Section 5: Data Backup & Restore */}
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-black text-slate-900">
                النسخ الاحتياطي والمزامنة اليدوية:
              </h4>
              <p className="text-[11px] font-semibold text-slate-500">
                يمكنك تحميل ملف بياناتك لنقله بين الهاتف والكمبيوتر بسهولة.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleExportData}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-amber-600" />
                <span>تصدير نسخة</span>
              </button>

              <label className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-sm cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-amber-600" />
                <span>استيراد</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={closeModals}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition-all"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>حفظ الإعدادات</span>
          </button>
        </div>

      </div>
    </div>
  );
};
