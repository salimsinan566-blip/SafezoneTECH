import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appointment, DayWorkload, WorkSettings, TechnicianUser, QuickPreset } from '../types';
import {
  calculateDayWorkload,
  formatDateKey,
  isTimeOverlapping,
  addMinutesToTime,
  calculateDailyMaxHours,
} from '../utils/dateUtils';
import {
  loadAppointments,
  loadSettings,
  saveAppointments,
  saveSettings,
} from '../utils/storage';
import {
  supabase,
  isSupabaseConfigured,
  fetchAppointmentsFromSupabase,
  fetchSettingsFromSupabase,
  upsertAppointmentToSupabase,
  deleteAppointmentFromSupabase,
  saveSettingsToSupabase,
  getCurrentTechnicianUser,
  signOutTechnician,
  DEFAULT_QUICK_PRESETS,
} from '../lib/supabase';

interface AppContextType {
  appointments: Appointment[];
  settings: WorkSettings;
  selectedDate: string;
  isLocked: boolean;
  isSupabaseConnected: boolean;
  activeModal: 'day-details' | 'appointment' | 'settings' | 'quick-book' | 'booked-detail' | 'auth' | null;
  editingAppointment: Appointment | null;
  viewingAppointment: Appointment | null;
  selectedSlotToBook: { date: string; startTime: string; endTime: string; durationMinutes: number } | null;
  activePresetId: string;
  currentUser: TechnicianUser | null;
  isAuthModalOpen: boolean;
  notification: { message: string; type: 'success' | 'warning' | 'info' | 'error' } | null;

  setSelectedDate: (date: string) => void;
  setActiveModal: (modal: 'day-details' | 'appointment' | 'settings' | 'quick-book' | 'booked-detail' | 'auth' | null) => void;
  setEditingAppointment: (appointment: Appointment | null) => void;
  setViewingAppointment: (appointment: Appointment | null) => void;
  setSelectedSlotToBook: (slot: { date: string; startTime: string; endTime: string; durationMinutes: number } | null) => void;
  setActivePresetId: (id: string) => void;
  setIsAuthModalOpen: (open: boolean) => void;
  setCurrentUser: (user: TechnicianUser | null) => void;

  openNewAppointment: (date?: string) => void;
  openEditAppointment: (appointment: Appointment) => void;
  openDayDetails: (date: string) => void;
  openQuickBook: (date: string, startTime: string, durationMinutes: number) => void;
  openBookedDetail: (appointment: Appointment) => void;
  closeModals: () => void;

  quickBookAppointment: (customerName: string) => Promise<boolean>;
  addAppointment: (
    apt: Omit<Appointment, 'id' | 'createdAt'>
  ) => { success: boolean; conflictWith?: Appointment };
  updateAppointment: (
    id: string,
    apt: Partial<Appointment>
  ) => { success: boolean; conflictWith?: Appointment };
  deleteAppointment: (id: string) => void;
  toggleComplete: (id: string) => void;
  updateSettings: (newSettings: WorkSettings) => void;
  unlockApp: (enteredPin: string) => boolean;
  lockApp: () => void;
  logoutTechnician: () => Promise<void>;

  getDayWorkload: (dateStr: string) => DayWorkload;
  isSlotOverlapping: (date: string, startTime: string, endTime: string, ignoreId?: string) => Appointment | null;
  isDayFullyBooked: (dateStr: string) => boolean;
  showNotification: (
    message: string,
    type?: 'success' | 'warning' | 'info' | 'error'
  ) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<WorkSettings>(() => {
    const s = loadSettings();
    return {
      ...s,
      workStartTime: s?.workStartTime || '08:00',
      workEndTime: s?.workEndTime || '21:00',
      quickPresets: (s?.quickPresets && s.quickPresets.length >= 4) ? s.quickPresets : DEFAULT_QUICK_PRESETS,
    };
  });
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const list = loadAppointments();
    return Array.isArray(list) ? list.filter(Boolean) : [];
  });
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateKey(new Date()));
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const loaded = loadSettings();
    return Boolean(loaded?.isPinEnabled);
  });
  const [activeModal, setActiveModal] = useState<'day-details' | 'appointment' | 'settings' | 'quick-book' | 'booked-detail' | 'auth' | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);
  const [selectedSlotToBook, setSelectedSlotToBook] = useState<{
    date: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
  } | null>(null);
  const [activePresetId, setActivePresetId] = useState<string>('p1');
  const [currentUser, setCurrentUser] = useState<TechnicianUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'warning' | 'info' | 'error';
  } | null>(null);

  // Initialize current logged in technician user
  useEffect(() => {
    getCurrentTechnicianUser().then((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
  }, []);

  // Initial cloud sync on mount if Supabase credentials are configured
  useEffect(() => {
    if (isSupabaseConfigured) {
      fetchAppointmentsFromSupabase().then((data) => {
        if (data && Array.isArray(data)) {
          setAppointments(data.filter(Boolean));
        }
      });
      fetchSettingsFromSupabase().then((data) => {
        if (data) {
          setSettings({
            ...data,
            workStartTime: data.workStartTime || '08:00',
            workEndTime: data.workEndTime || '21:00',
            quickPresets: (data.quickPresets && data.quickPresets.length >= 4) ? data.quickPresets : DEFAULT_QUICK_PRESETS,
          });
        }
      });

      // Real-time synchronization
      if (supabase) {
        const channel = supabase
          .channel('realtime_appointments_sync')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'appointments' },
            () => {
              fetchAppointmentsFromSupabase().then((data) => {
                if (data && Array.isArray(data)) setAppointments(data.filter(Boolean));
              });
            }
          )
          .subscribe();

        return () => {
          supabase?.removeChannel(channel);
        };
      }
    }
  }, []);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveAppointments(appointments);
  }, [appointments]);

  const showNotification = (
    message: string,
    type: 'success' | 'warning' | 'info' | 'error' = 'info'
  ) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  const unlockApp = (enteredPin: string): boolean => {
    if (enteredPin === settings.pinCode) {
      setIsLocked(false);
      showNotification('تم إلغاء القفل بنجاح', 'success');
      return true;
    }
    showNotification('رمز المرور غير صحيح!', 'error');
    return false;
  };

  const lockApp = () => {
    if (settings.isPinEnabled) {
      setIsLocked(true);
    }
  };

  const logoutTechnician = async () => {
    await signOutTechnician();
    setCurrentUser(null);
    showNotification('تم تسجيل الخروج بنجاح', 'info');
  };

  const getDayWorkload = (dateStr: string): DayWorkload => {
    return calculateDayWorkload(dateStr, appointments || [], settings);
  };

  const isDayFullyBooked = (dateStr: string): boolean => {
    if (!dateStr || !Array.isArray(appointments)) return false;
    const dayAppointments = appointments.filter((a) => a && a.date === dateStr);
    const totalBookedHours = dayAppointments.reduce((sum, a) => sum + (Number(a?.durationHours) || 0), 0);
    const maxWorkingHours = calculateDailyMaxHours(settings?.workStartTime, settings?.workEndTime) || 13;
    return totalBookedHours >= maxWorkingHours;
  };

  const isSlotOverlapping = (
    date: string,
    startTime: string,
    endTime: string,
    ignoreId?: string
  ): Appointment | null => {
    if (!date || !startTime || !endTime || !Array.isArray(appointments)) return null;
    const found = appointments.find(
      (a) =>
        a &&
        a.date === date &&
        a.id !== ignoreId &&
        isTimeOverlapping(startTime, endTime, a.startTime, a.endTime)
    );
    return found || null;
  };

  const openNewAppointment = (date?: string) => {
    if (date) setSelectedDate(date);
    setEditingAppointment(null);
    setActiveModal('appointment');
  };

  const openEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setActiveModal('appointment');
  };

  const openDayDetails = (date: string) => {
    setSelectedDate(date);
    setActiveModal('day-details');
  };

  const openQuickBook = (date: string, startTime: string, durationMinutes: number) => {
    const endTime = addMinutesToTime(startTime, durationMinutes);
    setSelectedSlotToBook({
      date,
      startTime,
      endTime,
      durationMinutes,
    });
    setActiveModal('quick-book');
  };

  const openBookedDetail = (appointment: Appointment) => {
    setViewingAppointment(appointment);
    setActiveModal('booked-detail');
  };

  const closeModals = () => {
    setActiveModal(null);
    setEditingAppointment(null);
    setSelectedSlotToBook(null);
    setViewingAppointment(null);
  };

  const quickBookAppointment = async (customerName: string): Promise<boolean> => {
    if (!selectedSlotToBook) return false;
    const { date, startTime, endTime, durationMinutes } = selectedSlotToBook;

    // Defense against booking in the past
    const now = new Date();
    const todayKey = formatDateKey(now);
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (date < todayKey || (date === todayKey && startTime < currentTimeStr)) {
      showNotification('لا يمكن حجز موعد في تاريخ أو وقت قد مضى!', 'error');
      return false;
    }

    // Check conflict
    const conflict = isSlotOverlapping(date, startTime, endTime);
    if (conflict) {
      showNotification(`الوقت محجوز مسبقاً لموعد [${conflict.customerName}]!`, 'error');
      return false;
    }

    const techName = currentUser?.name || 'فني SAFE ZONE';
    const newAppointment: Appointment = {
      id: 'apt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      customerName: customerName.trim(),
      date,
      startTime,
      endTime,
      durationHours: Number((durationMinutes / 60).toFixed(2)),
      technicianName: techName,
      bookedByTechnician: techName,
      technicians: [techName],
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    setAppointments((prev) => [...prev, newAppointment]);
    upsertAppointmentToSupabase(newAppointment);

    showNotification(`تم حجز موعد [${customerName}] بواسطة ${techName} بنجاح ✓`, 'success');
    closeModals();
    return true;
  };

  const addAppointment = (
    apt: Omit<Appointment, 'id' | 'createdAt'>
  ): { success: boolean; conflictWith?: Appointment } => {
    const now = new Date();
    const todayKey = formatDateKey(now);
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (apt.date < todayKey || (apt.date === todayKey && apt.startTime < currentTimeStr)) {
      showNotification('لا يمكن إضافة موعد في تاريخ أو وقت قد مضى!', 'error');
      return { success: false };
    }

    const conflict = appointments.find(
      (existing) =>
        existing.date === apt.date &&
        isTimeOverlapping(apt.startTime, apt.endTime, existing.startTime, existing.endTime)
    );

    const techName = apt.bookedByTechnician || apt.technicianName || currentUser?.name || 'فني SAFE ZONE';
    const newAppointment: Appointment = {
      ...apt,
      technicianName: techName,
      bookedByTechnician: techName,
      id: 'apt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };

    setAppointments((prev) => [...prev, newAppointment]);
    upsertAppointmentToSupabase(newAppointment);

    if (conflict) {
      showNotification(`تنبيه: تم حفظ الموعد، لكن يوجد تضارب مع موعد [${conflict.customerName}]!`, 'warning');
      return { success: true, conflictWith: conflict };
    }

    showNotification('تم تسجيل الموعد بنجاح', 'success');
    return { success: true };
  };

  const updateAppointment = (
    id: string,
    aptUpdate: Partial<Appointment>
  ): { success: boolean; conflictWith?: Appointment } => {
    let conflict: Appointment | undefined;

    setAppointments((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...aptUpdate };

        upsertAppointmentToSupabase(updated);

        conflict = prev.find(
          (other) =>
            other.id !== id &&
            other.date === updated.date &&
            isTimeOverlapping(updated.startTime, updated.endTime, other.startTime, other.endTime)
        );

        return updated;
      })
    );

    if (conflict) {
      showNotification(`تنبيه: تم تعديل الموعد، لكن يوجد تضارب مع موعد [${conflict.customerName}]!`, 'warning');
      return { success: true, conflictWith: conflict };
    }

    showNotification('تم تحديث بيانات الموعد', 'success');
    return { success: true };
  };

  const deleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    deleteAppointmentFromSupabase(id);
    showNotification('تم حذف الموعد', 'info');
    closeModals();
  };

  const toggleComplete = (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const nextStatus = !a.isCompleted;
          const updated = { ...a, isCompleted: nextStatus };
          upsertAppointmentToSupabase(updated);
          showNotification(
            nextStatus
              ? `تم تعليم موعد [${a.customerName}] كمكتمل بنجاح ✓`
              : `تم تحويل موعد [${a.customerName}] إلى قيد التنفيذ`,
            'success'
          );
          if (viewingAppointment?.id === id) {
            setViewingAppointment(updated);
          }
          return updated;
        }
        return a;
      })
    );
  };

  const updateSettings = (newSettings: WorkSettings) => {
    setSettings(newSettings);
    saveSettingsToSupabase(newSettings);
    showNotification('تم حفظ الإعدادات وقواعد الوقت بنجاح', 'success');
  };

  return (
    <AppContext.Provider
      value={{
        appointments,
        settings,
        selectedDate,
        isLocked,
        isSupabaseConnected: isSupabaseConfigured,
        activeModal,
        editingAppointment,
        viewingAppointment,
        selectedSlotToBook,
        activePresetId,
        currentUser,
        isAuthModalOpen,
        notification,
        setSelectedDate,
        setActiveModal,
        setEditingAppointment,
        setViewingAppointment,
        setSelectedSlotToBook,
        setActivePresetId,
        setIsAuthModalOpen,
        setCurrentUser,
        openNewAppointment,
        openEditAppointment,
        openDayDetails,
        openQuickBook,
        openBookedDetail,
        closeModals,
        quickBookAppointment,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        toggleComplete,
        updateSettings,
        unlockApp,
        lockApp,
        logoutTechnician,
        getDayWorkload,
        isSlotOverlapping,
        isDayFullyBooked,
        showNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

