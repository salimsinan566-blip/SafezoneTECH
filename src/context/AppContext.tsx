import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appointment, DayWorkload, WorkSettings } from '../types';
import {
  calculateDayWorkload,
  formatDateKey,
  isTimeOverlapping,
} from '../utils/dateUtils';
import {
  loadAppointments,
  loadSettings,
  saveAppointments,
  saveSettings,
} from '../utils/storage';
import {
  isSupabaseConfigured,
  fetchAppointmentsFromSupabase,
  fetchSettingsFromSupabase,
  upsertAppointmentToSupabase,
  deleteAppointmentFromSupabase,
  saveSettingsToSupabase,
} from '../lib/supabase';

interface AppContextType {
  appointments: Appointment[];
  settings: WorkSettings;
  selectedDate: string;
  isLocked: boolean;
  isSupabaseConnected: boolean;
  activeModal: 'day-details' | 'appointment' | 'settings' | null;
  editingAppointment: Appointment | null;
  notification: { message: string; type: 'success' | 'warning' | 'info' | 'error' } | null;
  setSelectedDate: (date: string) => void;
  setActiveModal: (modal: 'day-details' | 'appointment' | 'settings' | null) => void;
  setEditingAppointment: (appointment: Appointment | null) => void;
  openNewAppointment: (date?: string) => void;
  openEditAppointment: (appointment: Appointment) => void;
  openDayDetails: (date: string) => void;
  closeModals: () => void;
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
  getDayWorkload: (dateStr: string) => DayWorkload;
  showNotification: (
    message: string,
    type?: 'success' | 'warning' | 'info' | 'error'
  ) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<WorkSettings>(loadSettings);
  const [appointments, setAppointments] = useState<Appointment[]>(loadAppointments);
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateKey(new Date()));
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const loaded = loadSettings();
    return loaded.isPinEnabled;
  });
  const [activeModal, setActiveModal] = useState<'day-details' | 'appointment' | 'settings' | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'warning' | 'info' | 'error';
  } | null>(null);

  // Initial cloud sync on mount if Supabase credentials are configured
  useEffect(() => {
    if (isSupabaseConfigured) {
      fetchAppointmentsFromSupabase().then((data) => {
        if (data && data.length > 0) {
          setAppointments(data);
        }
      });
      fetchSettingsFromSupabase().then((data) => {
        if (data) {
          setSettings(data);
        }
      });
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

  const getDayWorkload = (dateStr: string): DayWorkload => {
    return calculateDayWorkload(dateStr, appointments, settings);
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

  const closeModals = () => {
    setActiveModal(null);
    setEditingAppointment(null);
  };

  const addAppointment = (
    apt: Omit<Appointment, 'id' | 'createdAt'>
  ): { success: boolean; conflictWith?: Appointment } => {
    // Check overlapping conflicts on the same date
    const conflict = appointments.find(
      (existing) =>
        existing.date === apt.date &&
        isTimeOverlapping(apt.startTime, apt.endTime, existing.startTime, existing.endTime)
    );

    const newAppointment: Appointment = {
      ...apt,
      id: 'apt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };

    setAppointments((prev) => [...prev, newAppointment]);

    // Async sync to Supabase if configured
    upsertAppointmentToSupabase(newAppointment);

    if (conflict) {
      showNotification(`تنبيه: تم حفظ الموعد، لكن يوجد تضارب في الوقت مع موعد [${conflict.customerName}]!`, 'warning');
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

        // Async sync to Supabase if configured
        upsertAppointmentToSupabase(updated);

        // Check if overlaps with any OTHER appointment on same date
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
  };

  // Simple single-click checklist checkpoint (اكتمل / قيد التنفيذ)
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
        notification,
        setSelectedDate,
        setActiveModal,
        setEditingAppointment,
        openNewAppointment,
        openEditAppointment,
        openDayDetails,
        closeModals,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        toggleComplete,
        updateSettings,
        unlockApp,
        lockApp,
        getDayWorkload,
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
