/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseScheduleString,
  calculateAttendanceStats,
  createDefault24Sessions,
  createDefaultSessions,
  extendSessions,
  extend24Sessions,
  buildTeacherSchedules,
  getPackageSessionCount,
  getStudentRenewalStatus,
  getRenewalAlerts,
  generateZaloReminderMessage,
  normalizeAttendanceStatus,
  sanitizeScannedSession,
  mergeSessions,
} from './scheduleParser';
import { AttendanceSession, Student } from '../types/music';

test('parseScheduleString parses standard Vietnamese schedule correctly', () => {
  const result = parseScheduleString('Thứ 2, Thứ 4 (18:00 - 19:30)');
  assert.equal(result.length, 2);
  assert.equal(result[0].day, 'Thứ 2');
  assert.equal(result[0].time, '18:00 - 19:30');
  assert.equal(result[1].day, 'Thứ 4');
  assert.equal(result[1].time, '18:00 - 19:30');
});

test('parseScheduleString handles short notations like T3, T5 and CN', () => {
  const result = parseScheduleString('T3, T5 (19:30 - 21:00)');
  assert.equal(result.length, 2);
  assert.equal(result[0].day, 'Thứ 3');
  assert.equal(result[1].day, 'Thứ 5');
  assert.equal(result[0].time, '19:30 - 21:00');

  const cnResult = parseScheduleString('Chủ Nhật (09:00 - 10:30)');
  assert.equal(cnResult.length, 1);
  assert.equal(cnResult[0].day, 'Chủ Nhật');
  assert.equal(cnResult[0].time, '09:00 - 10:30');
});

test('calculateAttendanceStats calculates correct percentages and totals', () => {
  const sessions: AttendanceSession[] = [
    { stt: 1, date: '01/10/2026', content: 'Bài 1', status: 'Học', note: '' },
    { stt: 2, date: '04/10/2026', content: 'Bài 2', status: 'Học', note: '' },
    { stt: 3, date: '08/10/2026', content: 'Bài 3', status: 'Phép', note: 'Bận ôn thi' },
    { stt: 4, date: '11/10/2026', content: 'Bài 4', status: 'Vắng', note: 'Không báo' },
    { stt: 5, date: '15/10/2026', content: '', status: '', note: '' },
  ];

  const stats = calculateAttendanceStats(sessions);
  assert.equal(stats.total, 5);
  assert.equal(stats.attended, 2);
  assert.equal(stats.excused, 1);
  assert.equal(stats.unexcused, 1);
  assert.equal(stats.empty, 1);
  assert.equal(stats.completed, 4);
  assert.equal(stats.remaining, 1);
  assert.equal(stats.completionPercentage, 80); // 4/5 = 80%
  assert.equal(stats.attendanceRate, 50); // 2/4 = 50%
});

test('createDefaultSessions initializes exact count for 8, 24, and 36 packages', () => {
  const sessions8 = createDefaultSessions(8, '2026-10-01');
  assert.equal(sessions8.length, 8);
  assert.equal(sessions8[0].stt, 1);
  assert.equal(sessions8[7].stt, 8);

  const sessions24 = createDefaultSessions(24, '2026-10-01');
  assert.equal(sessions24.length, 24);
  assert.equal(sessions24[23].stt, 24);

  const sessions36 = createDefaultSessions(36, '2026-10-01');
  assert.equal(sessions36.length, 36);
  assert.equal(sessions36[35].stt, 36);
});

test('getPackageSessionCount maps package names accurately', () => {
  assert.equal(getPackageSessionCount('8 buổi'), 8);
  assert.equal(getPackageSessionCount('24 buổi'), 24);
  assert.equal(getPackageSessionCount('36 buổi'), 36);
  assert.equal(getPackageSessionCount(undefined), 24);
});

test('getStudentRenewalStatus triggers reminder when remaining <= 3', () => {
  // 8-session student who has completed 6 sessions (2 remaining -> warning)
  const sessions: AttendanceSession[] = createDefaultSessions(8, '2026-10-01');
  for (let i = 0; i < 6; i++) {
    sessions[i].status = 'Học';
  }

  const student: Student = {
    id: 'st-test',
    name: 'Nguyễn Văn Test',
    phone: '0901234567',
    instrument: 'Piano',
    scheduleString: 'Thứ 2, Thứ 4 (18:00 - 19:30)',
    teacher: 'Thầy Hoàng Piano',
    startDate: '2026-10-01',
    packageType: '8 buổi',
    sessions,
  };

  const status = getStudentRenewalStatus(student);
  assert.equal(status.remaining, 2);
  assert.equal(status.isExpiringSoon, true);
  assert.equal(status.needsAlert, true);
  assert.equal(status.urgency, 'warning');

  // Complete 1 more -> 1 remaining -> critical
  sessions[6].status = 'Học';
  const status1 = getStudentRenewalStatus(student);
  assert.equal(status1.remaining, 1);
  assert.equal(status1.urgency, 'critical');

  // Complete all 8 -> 0 remaining -> critical / expired
  sessions[7].status = 'Học';
  const status0 = getStudentRenewalStatus(student);
  assert.equal(status0.remaining, 0);
  assert.equal(status0.isExpired, true);
  assert.equal(status0.needsAlert, true);

  // Student with 4 remaining -> NO alert
  const notExpiringSessions: AttendanceSession[] = createDefaultSessions(8, '2026-10-01');
  notExpiringSessions[0].status = 'Học';
  notExpiringSessions[1].status = 'Học';
  notExpiringSessions[2].status = 'Học';
  notExpiringSessions[3].status = 'Học';
  const notExpiringStudent: Student = {
    ...student,
    sessions: notExpiringSessions,
  };
  const statusNormal = getStudentRenewalStatus(notExpiringStudent);
  assert.equal(statusNormal.remaining, 4);
  assert.equal(statusNormal.needsAlert, false);
});

test('getRenewalAlerts filters only students with remaining <= 3', () => {
  const studentExpiring3: Student = {
    id: 's1',
    name: 'Học viên A',
    phone: '0901111111',
    instrument: 'Piano',
    scheduleString: 'Thứ 2 (18:00 - 19:30)',
    teacher: 'Thầy Hoàng',
    startDate: '2026-09-01',
    packageType: '24 buổi',
    sessions: createDefaultSessions(24).map((s, idx) => ({
      ...s,
      status: idx < 21 ? 'Học' : '',
    })),
  };

  const studentSafe: Student = {
    id: 's2',
    name: 'Học viên B',
    phone: '0902222222',
    instrument: 'Guitar',
    scheduleString: 'Thứ 3 (18:00 - 19:30)',
    teacher: 'Thầy Tuấn',
    startDate: '2026-09-01',
    packageType: '24 buổi',
    sessions: createDefaultSessions(24).map((s, idx) => ({
      ...s,
      status: idx < 10 ? 'Học' : '',
    })),
  };

  const alerts = getRenewalAlerts([studentExpiring3, studentSafe]);
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].student.id, 's1');
  assert.equal(alerts[0].remainingSessions, 3);
});

test('generateZaloReminderMessage formats respectful and clear reminder', () => {
  const dummy: Student = {
    id: 'st-zalo',
    name: 'Trần Gia Hân',
    phone: '0988 123 456',
    instrument: 'Piano',
    scheduleString: 'Thứ 3, Thứ 6 (19:00 - 20:30)',
    teacher: 'Cô Linh Piano',
    startDate: '2026-09-15',
    packageType: '24 buổi',
    sessions: [],
  };

  const msg = generateZaloReminderMessage(dummy, 2);
  assert.ok(msg.includes('Trần Gia Hân'));
  assert.ok(msg.includes('CHỈ CÒN 2 BUỔI HỌC'));
  assert.ok(msg.includes('Cô Linh Piano'));
});

test('extendSessions extends existing sessions by +8, +24, or +36 rows correctly', () => {
  const initial = createDefault24Sessions('2026-10-01');

  // Test +8
  const extended8 = extendSessions(initial, 8);
  assert.equal(extended8.length, 32);
  assert.equal(extended8[24].stt, 25);
  assert.equal(extended8[31].stt, 32);
  assert.equal(extended8[24].note, 'Khóa gia hạn (+8 buổi)');

  // Test +24
  const extended24 = extendSessions(initial, 24);
  assert.equal(extended24.length, 48);
  assert.equal(extended24[24].stt, 25);
  assert.equal(extended24[47].stt, 48);
  assert.equal(extended24[24].note, 'Khóa gia hạn (+24 buổi)');

  // Test +36
  const extended36 = extendSessions(initial, 36);
  assert.equal(extended36.length, 60);
  assert.equal(extended36[24].stt, 25);
  assert.equal(extended36[59].stt, 60);
  assert.equal(extended36[24].note, 'Khóa gia hạn (+36 buổi)');
});

test('normalizeAttendanceStatus normalizes various text formats to standard status', () => {
  assert.equal(normalizeAttendanceStatus('Học'), 'Học');
  assert.equal(normalizeAttendanceStatus('có mặt'), 'Học');
  assert.equal(normalizeAttendanceStatus('v'), 'Học');
  assert.equal(normalizeAttendanceStatus('Phép'), 'Phép');
  assert.equal(normalizeAttendanceStatus('xin nghỉ'), 'Phép');
  assert.equal(normalizeAttendanceStatus('p'), 'Phép');
  assert.equal(normalizeAttendanceStatus('Vắng'), 'Vắng');
  assert.equal(normalizeAttendanceStatus('không phép'), 'Vắng');
  assert.equal(normalizeAttendanceStatus(''), '');
  assert.equal(normalizeAttendanceStatus(undefined), '');
});

test('sanitizeScannedSession cleans raw scanned session items safely', () => {
  const raw = {
    stt: '3',
    date: ' 15/10/2026 ',
    content: '   Luyện ngón Hanon 1 & Gam C Major   ',
    status: 'có mặt',
    note: '  Tốt, cần luyện thêm tay trái  ',
  };
  const sanitized = sanitizeScannedSession(raw, 1);
  assert.equal(sanitized.stt, 3);
  assert.equal(sanitized.date, '15/10/2026');
  assert.equal(sanitized.content, 'Luyện ngón Hanon 1 & Gam C Major');
  assert.equal(sanitized.status, 'Học');
  assert.equal(sanitized.note, 'Tốt, cần luyện thêm tay trái');

  // Fallback for missing/invalid STT
  const invalidRaw = { content: 'Bài 1' };
  const fallback = sanitizeScannedSession(invalidRaw, 5);
  assert.equal(fallback.stt, 5);
  assert.equal(fallback.status, '');
});

test('mergeSessions handles overwrite, update_by_stt, and append strategies properly', () => {
  const existing: AttendanceSession[] = [
    { stt: 1, date: '01/10/2026', content: 'Cũ 1', status: 'Học', note: '' },
    { stt: 2, date: '05/10/2026', content: 'Cũ 2', status: 'Học', note: '' },
    { stt: 3, date: '10/10/2026', content: 'Cũ 3', status: '', note: '' },
  ];

  const scanned: AttendanceSession[] = [
    { stt: 2, date: '05/10/2026', content: 'Mới 2 (Fur Elise)', status: 'Học', note: 'Đạt' },
    { stt: 4, date: '15/10/2026', content: 'Mới 4', status: 'Phép', note: 'Bận thi' },
  ];

  // Strategy 'update_by_stt'
  const updated = mergeSessions(existing, scanned, 'update_by_stt');
  assert.equal(updated.length, 4);
  assert.equal(updated[0].content, 'Cũ 1');
  assert.equal(updated[1].content, 'Mới 2 (Fur Elise)');
  assert.equal(updated[1].note, 'Đạt');
  assert.equal(updated[2].content, 'Cũ 3');
  assert.equal(updated[3].stt, 4);
  assert.equal(updated[3].content, 'Mới 4');

  // Strategy 'overwrite'
  const overwritten = mergeSessions(existing, scanned, 'overwrite');
  assert.equal(overwritten.length, 2);
  assert.equal(overwritten[0].stt, 2);
  assert.equal(overwritten[1].stt, 4);

  // Strategy 'append'
  const appended = mergeSessions(existing, scanned, 'append');
  assert.equal(appended.length, 5);
  assert.equal(appended[3].stt, 4);
  assert.equal(appended[3].content, 'Mới 2 (Fur Elise)');
  assert.equal(appended[4].stt, 5);
  assert.equal(appended[4].content, 'Mới 4');
});

test('Student status logic correctly handles Đang học, Bảo Lưu, and Nghỉ Học', () => {
  const sessions: AttendanceSession[] = createDefaultSessions(8, '2026-10-01');
  sessions[0].status = 'Học';
  sessions[1].status = 'Học';
  sessions[2].status = 'Học';
  sessions[3].status = 'Học';
  sessions[4].status = 'Học';
  sessions[5].status = 'Học'; // 6 attended -> 2 remaining

  const baseStudent: Student = {
    id: 'status-test',
    name: 'Học viên Trạng Thái',
    phone: '0909999999',
    instrument: 'Piano',
    scheduleString: 'Thứ 2 (18:00 - 19:30)',
    teacher: 'Thầy Hoàng Piano',
    startDate: '2026-10-01',
    packageType: '8 buổi',
    status: 'Đang học',
    sessions,
  };

  // 'Đang học' with remaining=2 triggers warning
  const activeStatus = getStudentRenewalStatus(baseStudent);
  assert.equal(activeStatus.needsAlert, true);
  assert.equal(activeStatus.urgency, 'warning');

  // 'Nghỉ Học' does NOT trigger alerts even if remaining <= 3
  const droppedStudent: Student = { ...baseStudent, status: 'Nghỉ Học' };
  const droppedStatus = getStudentRenewalStatus(droppedStudent);
  assert.equal(droppedStatus.needsAlert, false);
  assert.equal(droppedStatus.isExpiringSoon, false);

  // 'Bảo Lưu' marks as reserving
  const reservedStudent: Student = { ...baseStudent, status: 'Bảo Lưu' };
  const reservedStatus = getStudentRenewalStatus(reservedStudent);
  assert.equal(reservedStatus.needsAlert, true);
  assert.match(reservedStatus.message, /bảo lưu/i);
});


