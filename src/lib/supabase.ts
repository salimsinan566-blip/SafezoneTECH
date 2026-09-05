import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Appointment, WorkSettings } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidConfig = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-id'));

export const isSupabaseConfigured = isValidConfig;

export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey && isValidConfig)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Convert database snake_case to Appointment camelCase
export function mapRowToAppointment(row: any): Appointment {
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
    notes: row.notes || '',
    isCompleted: Boolean(row.is_completed),
    createdAt: row.created_at || new Date().toISOString(),
  };
}

// Convert Appointment camelCase to database snake_case
export function mapAppointmentToRow(apt: Appointment) {
  return {
    id: apt.id,
    customer_name: apt.customerName,
    customer_phone: apt.customerPhone,
    location: apt.location,
    date: apt.date,
    start_time: apt.startTime,
    end_time: apt.endTime,
    duration_hours: apt.durationHours,
    service_id: apt.serviceId,
    service_name: apt.serviceName,
    cameras_count: apt.camerasCount,
    notes: apt.notes,
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
      workEndTime: data.work_end_time || '18:00',
      daysOff: data.days_off || [5],
      servicePackages: data.service_packages || [],
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
