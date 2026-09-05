export interface ServicePackage {
  id: string;
  name: string;
  camerasCount: number;
  durationHours: number; // e.g. 3.0 for 3 hours, 1.5 for 1 hour 30 min
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
  customerPhone: string;
  location: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h)
  endTime: string; // HH:mm (24h)
  durationHours: number;
  serviceId: string;
  serviceName: string;
  camerasCount: number;
  technicianName?: string; // اسم الفني أو الفنيين المكلفين
  technicianId?: string;
  technicians?: string[]; // قائمة أسماء الفنيين المكلفين بالعملية
  notes?: string;
  isCompleted: boolean; // خانة التدقيق: صح اكتمل
  createdAt: string;
}

export interface WorkSettings {
  workStartTime: string; // e.g. "08:00"
  workEndTime: string; // e.g. "18:00"
  daysOff: number[]; // 5 for Friday, etc.
  servicePackages: ServicePackage[];
  technicians: Technician[]; // قائمة الفنيين العاملين
  pinCode: string;
  isPinEnabled: boolean;
  thresholds: {
    yellowPercent: number; // e.g. 40% (light work: yellow)
    orangePercent: number; // e.g. 75% (medium work: orange)
    redPercent: number; // e.g. 90% (crowded: red)
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
