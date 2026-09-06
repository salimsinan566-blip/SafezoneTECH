export interface QuickPreset {
  id: string;
  label: string;
  durationMinutes: number;
}

export interface TechnicianUser {
  id: string;
  email: string;
  name: string;
}

export interface ServicePackage {
  id: string;
  name: string;
  camerasCount: number;
  durationHours: number;
  priceEstimate?: number;
  description?: string;
}

export interface Technician {
  id: string;
  name: string;
  phone?: string;
}

export interface Appointment {
  id: string;
  customerName: string;
  customerPhone?: string;
  location?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h)
  endTime: string; // HH:mm (24h)
  durationHours: number;
  serviceId?: string;
  serviceName?: string;
  camerasCount?: number;
  technicianName?: string; // اسم الفني الحاجز (سالم، سرمد...)
  bookedByTechnician?: string;
  technicianId?: string;
  technicians?: string[];
  notes?: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface WorkSettings {
  workStartTime: string; // e.g. "08:00"
  workEndTime: string; // e.g. "21:00"
  daysOff: number[]; // e.g. [5] for Friday
  servicePackages: ServicePackage[];
  quickPresets: QuickPreset[]; // الخيارات الأربعة السريعة
  technicians: Technician[];
  pinCode: string;
  isPinEnabled: boolean;
  thresholds: {
    yellowPercent: number;
    orangePercent: number;
    redPercent: number;
  };
}

export type WorkloadLevel = 'empty' | 'light' | 'medium' | 'full';

export interface DayWorkload {
  date: string;
  totalBookedHours: number;
  maxWorkingHours: number;
  percentage: number;
  level: WorkloadLevel;
  appointmentCount: number;
  appointments: Appointment[];
}

