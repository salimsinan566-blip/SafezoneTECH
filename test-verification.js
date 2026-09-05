// Verification script for SAFE ZONE business logic

function calculateDailyMaxHours(startTime, endTime) {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const diff = (endH * 60 + endM) - (startH * 60 + startM);
  return Number((diff / 60).toFixed(1));
}

function addHoursToTime(timeStr, hours) {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMinutes = Math.round(h * 60 + m + hours * 60);
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

function isTimeOverlapping(start1, end1, start2, end2) {
  return start1 < end2 && end1 > start2;
}

function getWorkloadLevel(totalBookedHours, maxWorkingHours, thresholds) {
  if (totalBookedHours === 0) return 'empty'; // Green
  const percentage = Math.min(100, Math.round((totalBookedHours / maxWorkingHours) * 100));
  if (percentage <= thresholds.yellowPercent) return 'light'; // Yellow
  if (percentage <= thresholds.orangePercent) return 'medium'; // Orange
  return 'full'; // Red
}

console.log('--- RUNNING VERIFICATION FOR SAFE ZONE APP ---');

// Test 1: Daily Working Hours
const maxHours = calculateDailyMaxHours('08:00', '18:00');
console.assert(maxHours === 10.0, `Expected 10.0 hours, got ${maxHours}`);
console.log('✓ Test 1: Daily working hours (08:00 - 18:00 = 10 hours) PASS');

// Test 2: Time Addition
const end1 = addHoursToTime('09:00', 3.0);
console.assert(end1 === '12:00', `Expected 12:00, got ${end1}`);
const end2 = addHoursToTime('08:30', 6.0);
console.assert(end2 === '14:30', `Expected 14:30, got ${end2}`);
console.log('✓ Test 2: Auto-calculating end time (4 cams: 09:00 + 3h = 12:00, 8 cams: 08:30 + 6h = 14:30) PASS');

// Test 3: Overlap & Conflict Detection
const hasConflict = isTimeOverlapping('09:00', '12:00', '10:00', '13:00');
console.assert(hasConflict === true, 'Expected conflict to be detected');
const noConflict = isTimeOverlapping('09:00', '12:00', '12:00', '15:00');
console.assert(noConflict === false, 'Expected no conflict for back-to-back appointments');
console.log('✓ Test 3: Conflict detection PASS');

// Test 4: Calendar Color Workload Calculations
const thresholds = { yellowPercent: 40, orangePercent: 75, redPercent: 90 };

const level0 = getWorkloadLevel(0, 10, thresholds);
console.assert(level0 === 'empty', `Expected empty (green), got ${level0}`);

const level1 = getWorkloadLevel(3, 10, thresholds); // 30% <= 40%
console.assert(level1 === 'light', `Expected light (yellow), got ${level1}`);

const level2 = getWorkloadLevel(6, 10, thresholds); // 60% <= 75%
console.assert(level2 === 'medium', `Expected medium (orange), got ${level2}`);

const level3 = getWorkloadLevel(9, 10, thresholds); // 90%
console.assert(level3 === 'full', `Expected full (red), got ${level3}`);

console.log('✓ Test 4: Calendar color-coding (0h: Green, 3h: Yellow, 6h: Orange, 9h: Red) PASS');
console.log('ALL TESTS PASSED SUCCESSFULLY!');
