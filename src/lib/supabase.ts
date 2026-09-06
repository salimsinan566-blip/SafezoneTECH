import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Appointment, WorkSettings, QuickPreset, TechnicianUser } from '../types';

export const DEFAULT_QUICK_PRESETS: QuickPreset[] = [
  { id: 'p1', label: 'معاينة (30 د)', durationMinutes: 30 },
  { id: 'p2', label: 'صيانة (1 س)', durationMinutes: 60 },
  { id: 'p3', label: '4 كاميرات (2 س)', durationMinutes: 120 },
  { id: 'p4', label: '8 كاميرات (3 س)', durationMinutes: 180 },
];

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isValidConfig = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-id')
);

export const isSupabaseConfigured = isValidConfig;

export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey && isValidConfig)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==================== AUTH HELPERS ====================
export async function getCurrentTechnicianUser(): Promise<TechnicianUser | null> {
  if (!supabase) {
    const local = localStorage.getItem('safezone_tech_user');
    return local ? JSON.parse(local) : null;
  }
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      const local = localStorage.getItem('safezone_tech_user');
      return local ? JSON.parse(local) : null;
    }
    const user = session.user;
    const name = user.user_metadata?.technician_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'فني';
    const techUser: TechnicianUser = {
      id: user.id,
      email: user.email || '',
      name: name,
    };
    localStorage.setItem('safezone_tech_user', JSON.stringify(techUser));
    return techUser;
  } catch {
    const local = localStorage.getItem('safezone_tech_user');
    return local ? JSON.parse(local) : null;
  }
}

export async function signInTechnician(email: string, password: string): Promise<{ user: TechnicianUser | null; error: string | null }> {
  if (!supabase) {
    // Local fallback if Supabase not configured
    const user: TechnicianUser = {
      id: 'local-' + Date.now(),
      email,
      name: email.split('@')[0] || 'فني',
    };
    localStorage.setItem('safezone_tech_user', JSON.stringify(user));
    return { user, error: null };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { user: null, error: error.message };
    }
    const u = data.user;
    const name = u.user_metadata?.technician_name || u.user_metadata?.full_name || u.email?.split('@')[0] || 'فني';
    const techUser: TechnicianUser = {
      id: u.id,
      email: u.email || '',
      name,
    };
    localStorage.setItem('safezone_tech_user', JSON.stringify(techUser));
    return { user: techUser, error: null };
  } catch (err: any) {
    return { user: null, error: err.message || 'فشل تسجيل الدخول' };
  }
}

export async function signUpTechnician(email: string, password: string, technicianName: string): Promise<{ user: TechnicianUser | null; error: string | null }> {
  if (!supabase) {
    const user: TechnicianUser = {
      id: 'local-' + Date.now(),
      email,
      name: technicianName.trim() || 'فني',
    };
    localStorage.setItem('safezone_tech_user', JSON.stringify(user));
    return { user, error: null };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          technician_name: technicianName.trim(),
        },
      },
    });

    if (error) {
      return { user: null, error: error.message };
    }

    const u = data.user;
    if (!u) return { user: null, error: 'لم يتم استرجاع بيانات المستخدم' };

    const techUser: TechnicianUser = {
      id: u.id,
      email: u.email || '',
      name: technicianName.trim() || 'فني',
    };
    localStorage.setItem('safezone_tech_user', JSON.stringify(techUser));
    return { user: techUser, error: null };
  } catch (err: any) {
    return { user: null, error: err.message || 'فشل إنشاء الحساب' };
  }
}

export async function signOutTechnician(): Promise<void> {
  localStorage.removeItem('safezone_tech_user');
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
  }
}

// Convert database snake_case to Appointment camelCase
export function mapRowToAppointment(row: any): Appointment {
  const techName = row.technician_name || '';
  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone || '',
    location: row.location || '',
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    durationHours: Number(row.duration_hours) || 1,
    serviceId: row.service_id || '',
    serviceName: row.service_name || '',
    camerasCount: Number(row.cameras_count) || 0,
    technicianName: techName,
    bookedByTechnician: techName,
    technicianId: row.technician_id || '',
    technicians: techName
      ? String(techName).split(/[,،]/).map((s) => s.trim()).filter(Boolean)
      : [],
    notes: row.notes || '',
    isCompleted: Boolean(row.is_completed),
    createdAt: row.created_at || new Date().toISOString(),
  };
}

// Convert Appointment camelCase to database snake_case
export function mapAppointmentToRow(apt: Appointment) {
  const techName = apt.bookedByTechnician || apt.technicianName || (apt.technicians && apt.technicians.length > 0 ? apt.technicians.join('، ') : '');

  return {
    id: apt.id,
    customer_name: apt.customerName,
    customer_phone: apt.customerPhone || '',
    location: apt.location || '',
    date: apt.date,
    start_time: apt.startTime,
    end_time: apt.endTime,
    duration_hours: apt.durationHours,
    service_id: apt.serviceId || '',
    service_name: apt.serviceName || '',
    cameras_count: apt.camerasCount || 0,
    technician_name: techName,
    technician_id: apt.technicianId || '',
    notes: apt.notes || '',
    is_completed: apt.isCompleted,
  };
}

// Fetch all appointments from Supabase
export async function fetchAppointmentsFromSupabase(): Promise<Appointment[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.warn('Supabase fetch appointments error:', error.message);
      return null;
    }
    return (data || []).map(mapRowToAppointment);
  } catch (err) {
    console.warn('Failed to connect to Supabase:', err);
    return null;
  }
}

// Upsert appointment to Supabase
export async function upsertAppointmentToSupabase(apt: Appointment): Promise<boolean> {
  if (!supabase) return false;
  try {
    const row = mapAppointmentToRow(apt);
    const { error } = await supabase.from('appointments').upsert(row);
    if (error) {
      console.error('Supabase upsert error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}

// Delete appointment from Supabase
export async function deleteAppointmentFromSupabase(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// Fetch Settings from Supabase
export async function fetchSettingsFromSupabase(): Promise<WorkSettings | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('work_settings')
      .select('*')
      .eq('id', 'global_settings')
      .single();

    if (error || !data) return null;

    return {
      workStartTime: data.work_start_time || '08:00',
      workEndTime: data.work_end_time || '21:00',
      daysOff: data.days_off || [5],
      servicePackages: data.service_packages || [],
      quickPresets: data.quick_presets || DEFAULT_QUICK_PRESETS,
      technicians: data.technicians || [],
      pinCode: data.pin_code || '1234',
      isPinEnabled: Boolean(data.is_pin_enabled),
      thresholds: data.thresholds || { yellowPercent: 40, orangePercent: 75, redPercent: 90 },
    };
  } catch {
    return null;
  }
}

// Save Settings to Supabase
export async function saveSettingsToSupabase(settings: WorkSettings): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('work_settings').upsert({
      id: 'global_settings',
      work_start_time: settings.workStartTime,
      work_end_time: settings.workEndTime,
      days_off: settings.daysOff,
      service_packages: settings.servicePackages,
      quick_presets: settings.quickPresets,
      technicians: settings.technicians,
      pin_code: settings.pinCode,
      is_pin_enabled: settings.isPinEnabled,
      thresholds: settings.thresholds,
      updated_at: new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}
