-- ==========================================================
-- SAFE ZONE - مخطط قاعدة بيانات Supabase (SQL Schema)
-- امسح كل شيء في الـ SQL Editor والصق هذا الكود بالكامل ثم Run
-- ==========================================================

-- 1. إنشاء جدول المواعيد والعمليات (Appointments)
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    location TEXT,
    date TEXT NOT NULL, -- YYYY-MM-DD
    start_time TEXT NOT NULL, -- HH:mm
    end_time TEXT NOT NULL, -- HH:mm
    duration_hours NUMERIC NOT NULL DEFAULT 1.0,
    service_id TEXT,
    service_name TEXT NOT NULL,
    cameras_count INTEGER DEFAULT 0,
    notes TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهرس لتسريع استعلامات التقويم
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);

-- 2. إنشاء جدول إعدادات الدوام وباقات الكاميرات (Settings)
CREATE TABLE IF NOT EXISTS work_settings (
    id TEXT PRIMARY KEY DEFAULT 'global_settings',
    work_start_time TEXT DEFAULT '08:00',
    work_end_time TEXT DEFAULT '18:00',
    days_off JSONB DEFAULT '[5]'::jsonb,
    service_packages JSONB,
    pin_code TEXT DEFAULT '1234',
    is_pin_enabled BOOLEAN DEFAULT FALSE,
    thresholds JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. تفعيل الأمان (RLS)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_settings ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة إن وجدت لتجنب أي تكرار
DROP POLICY IF EXISTS "Allow anon read appointments" ON appointments;
DROP POLICY IF EXISTS "Allow anon insert appointments" ON appointments;
DROP POLICY IF EXISTS "Allow anon update appointments" ON appointments;
DROP POLICY IF EXISTS "Allow anon delete appointments" ON appointments;

DROP POLICY IF EXISTS "Allow anon read settings" ON work_settings;
DROP POLICY IF EXISTS "Allow anon insert settings" ON work_settings;
DROP POLICY IF EXISTS "Allow anon update settings" ON work_settings;

-- إنشاء سياسات السماح للوصول العام
CREATE POLICY "Allow anon read appointments" ON appointments FOR SELECT USING (true);
CREATE POLICY "Allow anon insert appointments" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update appointments" ON appointments FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete appointments" ON appointments FOR DELETE USING (true);

CREATE POLICY "Allow anon read settings" ON work_settings FOR SELECT USING (true);
CREATE POLICY "Allow anon insert settings" ON work_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update settings" ON work_settings FOR UPDATE USING (true);

-- 4. إدخال الإعدادات الافتراضية
INSERT INTO work_settings (id, work_start_time, work_end_time, days_off, service_packages, pin_code, is_pin_enabled, thresholds)
VALUES (
    'global_settings',
    '08:00',
    '18:00',
    '[5]'::jsonb,
    '[
        {"id": "pkg-4-cam", "name": "نصب 4 كاميرات مراقبة", "camerasCount": 4, "durationHours": 3.0, "description": "تثبيت وتمديد وبرمجة"},
        {"id": "pkg-8-cam", "name": "نصب 8 كاميرات مراقبة", "camerasCount": 8, "durationHours": 6.0, "description": "منظومة 8 كاميرات كاملة"},
        {"id": "pkg-16-cam", "name": "نصب 16 كاميرا مراقبة", "camerasCount": 16, "durationHours": 10.0, "description": "مشروع متكامل"},
        {"id": "pkg-maint", "name": "صيانة وبرمجة DVR/NVR", "camerasCount": 0, "durationHours": 1.5, "description": "كشف أعطال وبرمجة"},
        {"id": "pkg-cables", "name": "تمديد وتجهيز شبكة كابلات", "camerasCount": 0, "durationHours": 2.0, "description": "سحب كابلات ومواسير"}
    ]'::jsonb,
    '1234',
    false,
    '{"yellowPercent": 40, "orangePercent": 75, "redPercent": 90}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
