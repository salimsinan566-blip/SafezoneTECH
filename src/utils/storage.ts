import { Appointment, ServicePackage, Technician, WorkSettings } from '../types';
import { formatDateKey } from './dateUtils';

export const DEFAULT_TECHNICIANS: Technician[] = [
  { id: 'tech-1', name: 'سالم سنان' },
  { id: 'tech-2', name: 'فني التركيب (فريق 1)' },
];

export const DEFAULT_SERVICE_PACKAGES: ServicePackage[] = [
  {
    id: 'pkg-4-cam',
    name: 'نصب 4 كاميرات مراقبة',
    camerasCount: 4,
    durationHours: 3.0,
    description: 'تثبيت، تمديد الكيبلات، ضبط الزوايا والبرمجة',
  },
  {
    id: 'pkg-8-cam',
    name: 'نصب 8 كاميرات مراقبة',
    camerasCount: 8,
    durationHours: 6.0,
    description: 'تثبيت كامل لمنظومة 8 كاميرات مع الـ DVR وربط الموبايل',
  },
  {
    id: 'pkg-16-cam',
    name: 'نصب 16 كاميرا مراقبة',
    camerasCount: 16,
    durationHours: 10.0,
    description: 'مشروع كامل للشركات أو الفلل الكبيرة مع إعداد الشبكة',
  },
  {
    id: 'pkg-maint',
    name: 'صيانة وبرمجة DVR/NVR',
    camerasCount: 0,
    durationHours: 1.5,
    description: 'كشف الأعطال، ضبط التسجيل، وربط التطبيق على الهاتف',
  },
  {
    id: 'pkg-cables',
    name: 'تمديد وتجهيز شبكة كابلات',
    camerasCount: 0,
    durationHours: 2.0,
    description: 'سحب وتركيب مسارات الكابلات والمواسير الواقية',
  },
];

export const DEFAULT_SETTINGS: WorkSettings = {
  workStartTime: '08:00',
  workEndTime: '18:00',
  daysOff: [5], // Friday
  servicePackages: DEFAULT_SERVICE_PACKAGES,
  technicians: DEFAULT_TECHNICIANS,
  pinCode: '1234',
  isPinEnabled: false,
  thresholds: {
    yellowPercent: 40,
    orangePercent: 75,
    redPercent: 90,
  },
};

const STORAGE_KEYS = {
  SETTINGS: 'safezone_settings_v1',
  APPOINTMENTS: 'safezone_appointments_v1',
  IS_LOCKED: 'safezone_is_locked_v1',
};

export function loadSettings(): WorkSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      technicians: parsed.technicians || DEFAULT_TECHNICIANS,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: WorkSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings', e);
  }
}

export function loadAppointments(): Appointment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }

  // Generate realistic initial appointments around today so the user sees green, yellow, orange, and red days immediately
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();

  const sampleDates = {
    todayStr: formatDateKey(new Date(y, m, d)),
    tomorrowStr: formatDateKey(new Date(y, m, d + 1)),
    dayAfterStr: formatDateKey(new Date(y, m, d + 2)),
    pastDayStr: formatDateKey(new Date(y, m, d - 2)),
  };

  const initialAppointments: Appointment[] = [
    // Today: Yellow (Light work - 3 hours out of 10 = 30%)
    {
      id: 'apt-sample-1',
      customerName: 'أحمد جاسم (معرض سيارات)',
      customerPhone: '07701234567',
      location: 'بغداد - المنصور - شارع 14 رمضان',
      date: sampleDates.todayStr,
      startTime: '09:00',
      endTime: '12:00',
      durationHours: 3.0,
      serviceId: 'pkg-4-cam',
      serviceName: 'نصب 4 كاميرات مراقبة',
      camerasCount: 4,
      notes: 'الموقع مجهز مسبقاً، الدخول من البوابة الرئيسية',
      isCompleted: true,
      createdAt: new Date().toISOString(),
    },
    // Tomorrow: Orange (Medium work - 6 hours out of 10 = 60%)
    {
      id: 'apt-sample-2',
      customerName: 'د. سرمد العبيدي (عيادة خاصة)',
      customerPhone: '07809876543',
      location: 'بغداد - الكرادة - تقاطع المسبح',
      date: sampleDates.tomorrowStr,
      startTime: '08:30',
      endTime: '14:30',
      durationHours: 6.0,
      serviceId: 'pkg-8-cam',
      serviceName: 'نصب 8 كاميرات مراقبة',
      camerasCount: 8,
      notes: 'التركيب داخلي وخارجي، يحتاج سلم طويل',
      isCompleted: false,
      createdAt: new Date().toISOString(),
    },
    // Day After: Red (Crowded/Full - 9 hours out of 10 = 90%)
    {
      id: 'apt-sample-3',
      customerName: 'الحاج مهدي (مستودع تجاري)',
      customerPhone: '07505554321',
      location: 'بغداد - جميلة الصناعية',
      date: sampleDates.dayAfterStr,
      startTime: '08:00',
      endTime: '14:00',
      durationHours: 6.0,
      serviceId: 'pkg-8-cam',
      serviceName: 'نصب 8 كاميرات مراقبة',
      camerasCount: 8,
      notes: 'تركيب كاميرات مراقبة ليلية ملونة ColorVu',
      isCompleted: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'apt-sample-4',
      customerName: 'مكتب السنديان العقاري',
      customerPhone: '07712223344',
      location: 'بغداد - شارع فلسطين',
      date: sampleDates.dayAfterStr,
      startTime: '14:30',
      endTime: '17:30',
      durationHours: 3.0,
      serviceId: 'pkg-4-cam',
      serviceName: 'نصب 4 كاميرات مراقبة',
      camerasCount: 4,
      notes: 'إضافة 4 كاميرات داخلية جديدة للشبكة',
      isCompleted: false,
      createdAt: new Date().toISOString(),
    },
    // Past completed day
    {
      id: 'apt-sample-5',
      customerName: 'شركة النماء للمقاولات',
      customerPhone: '07730001122',
      location: 'بغداد - الجادرية',
      date: sampleDates.pastDayStr,
      startTime: '10:00',
      endTime: '11:30',
      durationHours: 1.5,
      serviceId: 'pkg-maint',
      serviceName: 'صيانة وبرمجة DVR/NVR',
      camerasCount: 0,
      notes: 'تغيير القرص الصلب Hard Disk وبرمجة تطبيق الهاتف',
      isCompleted: true,
      createdAt: new Date().toISOString(),
    },
  ];

  saveAppointments(initialAppointments);
  return initialAppointments;
}

export function saveAppointments(appointments: Appointment[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  } catch (e) {
    console.error('Error saving appointments', e);
  }
}
