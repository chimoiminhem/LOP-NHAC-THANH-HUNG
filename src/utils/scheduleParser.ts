/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AttendanceSession,
  InstrumentType,
  PackageType,
  RenewalAlertItem,
  ScheduleSlotItem,
  Student,
  StudentStatus,
  STUDENT_STATUSES,
  TeacherAssignment,
} from '../types/music';

export const DAYS_OF_WEEK = [
  'Thứ 2',
  'Thứ 3',
  'Thứ 4',
  'Thứ 5',
  'Thứ 6',
  'Thứ 7',
  'Chủ Nhật',
] as const;

export const STANDARD_TIME_SLOTS = [
  '08:00 - 09:30',
  '09:30 - 11:00',
  '14:00 - 15:30',
  '15:30 - 17:00',
  '17:30 - 19:00',
  '19:00 - 20:30',
  '20:30 - 22:00',
];

export const KHUNG_GIO_LIST = STANDARD_TIME_SLOTS;

export const INSTRUMENTS: InstrumentType[] = [
  'Piano',
  'Guitar',
  'Ukulele',
  'Bass',
  'Electric Guitar',
];

export const PACKAGE_TYPES: PackageType[] = ['8 buổi', '24 buổi', '36 buổi'];

export const INSTRUMENT_COLORS: Record<InstrumentType, { bg: string; text: string; border: string; badge: string }> = {
  Piano: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  Guitar: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  Ukulele: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    badge: 'bg-sky-100 text-sky-800 border-sky-300',
  },
  Bass: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  'Electric Guitar': {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    badge: 'bg-rose-100 text-rose-800 border-rose-300',
  },
};

export const STUDENT_STATUS_CONFIG: Record<
  StudentStatus,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    badge: string;
    dot: string;
    desc: string;
  }
> = {
  'Đang học': {
    label: 'Đang học',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dot: 'bg-emerald-500',
    desc: 'Học viên đang học tích cực theo lịch định kỳ',
  },
  'Bảo Lưu': {
    label: 'Bảo Lưu',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    dot: 'bg-amber-500',
    desc: 'Tạm dừng lịch học và bảo lưu số buổi còn lại',
  },
  'Nghỉ Học': {
    label: 'Nghỉ Học',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-300',
    badge: 'bg-slate-200 text-slate-700 border-slate-300',
    dot: 'bg-slate-400',
    desc: 'Đã hoàn thành khóa hoặc ngưng học tại trung tâm',
  },
};


/**
 * Lấy số buổi định danh từ loại gói đăng ký
 */
export function getPackageSessionCount(packageType?: PackageType): number {
  if (packageType === '8 buổi') return 8;
  if (packageType === '36 buổi') return 36;
  return 24; // Mặc định gói chuẩn 24 buổi
}

/**
 * Phân tích chuỗi lịch học đăng ký của học viên
 * Ví dụ: "Thứ 2, Thứ 4 (18:00 - 19:30)" -> [ { day: 'Thứ 2', time: '18:00 - 19:30' }, { day: 'Thứ 4', time: '18:00 - 19:30' } ]
 */
export function parseScheduleString(scheduleStr: string): { day: string; time: string }[] {
  if (!scheduleStr || typeof scheduleStr !== 'string') return [];

  const results: { day: string; time: string }[] = [];
  const normalized = scheduleStr.trim();

  // Tìm khung giờ nếu có trong dấu ngoặc () hoặc sau ngày
  let time = '18:00 - 19:30';
  const timeMatch = normalized.match(/\((.*?)\)/) || normalized.match(/(\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2})/);
  if (timeMatch) {
    time = timeMatch[1].trim().replace('–', '-');
  }

  // Danh sách các ngày hỗ trợ
  const dayPatterns: { key: string; regex: RegExp }[] = [
    { key: 'Thứ 2', regex: /(Thứ\s*2|T2|Thứ\s*Hai|Mon)/i },
    { key: 'Thứ 3', regex: /(Thứ\s*3|T3|Thứ\s*Ba|Tue)/i },
    { key: 'Thứ 4', regex: /(Thứ\s*4|T4|Thứ\s*Tư|Wed)/i },
    { key: 'Thứ 5', regex: /(Thứ\s*5|T5|Thứ\s*Năm|Thu)/i },
    { key: 'Thứ 6', regex: /(Thứ\s*6|T6|Thứ\s*Sáu|Fri)/i },
    { key: 'Thứ 7', regex: /(Thứ\s*7|T7|Thứ\s*Bảy|Sat)/i },
    { key: 'Chủ Nhật', regex: /(Chủ\s*Nhật|CN|Chu\s*Nhat|Sun)/i },
  ];

  for (const { key, regex } of dayPatterns) {
    if (regex.test(normalized)) {
      results.push({ day: key, time });
    }
  }

  // Nếu không nhận diện được ngày nào, mặc định là Thứ 2
  if (results.length === 0) {
    results.push({ day: 'Thứ 2', time });
  }

  return results;
}

/**
 * Trích xuất danh sách slot thời khóa biểu từ danh sách học viên
 */
export function buildScheduleMatrix(students: Student[]): ScheduleSlotItem[] {
  const items: ScheduleSlotItem[] = [];

  students.forEach((student) => {
    const slots = parseScheduleString(student.scheduleString);
    slots.forEach((slot, index) => {
      items.push({
        id: `${student.id}-slot-${index}`,
        studentId: student.id,
        studentName: student.name,
        phone: student.phone,
        instrument: student.instrument,
        teacher: student.teacher || 'Chưa phân công',
        room: student.room || `P.${student.instrument.substring(0, 3).toUpperCase()}`,
        timeSlot: slot.time,
        dayOfWeek: slot.day,
      });
    });
  });

  return items;
}

/**
 * Tổng hợp lịch dạy của giáo viên
 */
export function buildTeacherSchedules(students: Student[]): TeacherAssignment[] {
  const teacherMap = new Map<string, TeacherAssignment>();

  students.forEach((student) => {
    const teacherName = student.teacher?.trim() || 'Chưa phân công';
    if (!teacherMap.has(teacherName)) {
      teacherMap.set(teacherName, {
        teacherName,
        phone: '090' + Math.floor(1000000 + Math.random() * 9000000),
        instruments: [],
        totalStudents: 0,
        totalWeeklyHours: 0,
        slots: [],
      });
    }

    const t = teacherMap.get(teacherName)!;
    if (!t.instruments.includes(student.instrument)) {
      t.instruments.push(student.instrument);
    }
    t.totalStudents += 1;

    const slots = parseScheduleString(student.scheduleString);
    slots.forEach((slot) => {
      t.slots.push({
        dayOfWeek: slot.day,
        timeSlot: slot.time,
        instrument: student.instrument,
        studentName: student.name,
      });
      // Mỗi ca học tính xấp xỉ 1.5 giờ
      t.totalWeeklyHours += 1.5;
    });
  });

  return Array.from(teacherMap.values()).sort((a, b) => b.totalStudents - a.totalStudents);
}

/**
 * Tính toán thống kê điểm danh cho 1 học viên
 */
export function calculateAttendanceStats(sessions?: AttendanceSession[] | null) {
  let attended = 0; // Học
  let excused = 0; // Phép
  let unexcused = 0; // Vắng
  let empty = 0; // Chưa học

  if (Array.isArray(sessions)) {
    sessions.forEach((s) => {
      if (s.status === 'Học') attended++;
      else if (s.status === 'Phép') excused++;
      else if (s.status === 'Vắng') unexcused++;
      else empty++;
    });
  }

  const total = Array.isArray(sessions) ? sessions.length : 0;
  const completed = attended + excused + unexcused;
  const remaining = Math.max(0, total - completed);
  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const attendanceRate = completed > 0 ? Math.round((attended / completed) * 100) : 0;

  return {
    total,
    attended,
    excused,
    unexcused,
    empty,
    completed,
    remaining,
    completionPercentage,
    attendanceRate,
  };
}

/**
 * Kiểm tra trạng thái sắp hoàn thành / hết buổi để nhắc nhở học viên
 * Ngưỡng kích hoạt: Còn <= 3 buổi trước khi hoàn thành gói (8, 24, hoặc 36 buổi)
 */
export function getStudentRenewalStatus(student: Student) {
  const stats = calculateAttendanceStats(student.sessions);
  const packageType = student.packageType || '24 buổi';
  const remaining = stats.remaining;
  const isExpiringSoon = remaining <= 3 && remaining > 0;
  const isExpired = remaining === 0 && stats.total > 0;

  let urgency: 'critical' | 'warning' | 'normal' = 'normal';
  let message = 'Khóa học đang diễn ra';

  if (student.status === 'Nghỉ Học') {
    return {
      packageType,
      total: stats.total,
      completed: stats.completed,
      remaining,
      isExpiringSoon: false,
      isExpired: false,
      needsAlert: false,
      urgency: 'normal' as const,
      message: 'Học viên đã nghỉ học',
    };
  }

  if (student.status === 'Bảo Lưu') {
    return {
      packageType,
      total: stats.total,
      completed: stats.completed,
      remaining,
      isExpiringSoon,
      isExpired,
      needsAlert: isExpiringSoon || isExpired,
      urgency: 'normal' as const,
      message: `Đang bảo lưu khóa học (còn ${remaining} buổi)`,
    };
  }

  if (isExpired) {
    urgency = 'critical';
    message = 'Đã hết buổi học! Cần gia hạn ngay để không gián đoạn lịch học.';
  } else if (remaining === 1) {
    urgency = 'critical';
    message = 'Chỉ còn 1 buổi cuối cùng!';
  } else if (remaining === 2) {
    urgency = 'warning';
    message = 'Còn 2 buổi hoàn thành gói học';
  } else if (remaining === 3) {
    urgency = 'warning';
    message = 'Còn 3 buổi hoàn thành gói học';
  }

  return {
    packageType,
    total: stats.total,
    completed: stats.completed,
    remaining,
    isExpiringSoon,
    isExpired,
    needsAlert: isExpiringSoon || isExpired,
    urgency,
    message,
  };
}

/**
 * Lọc danh sách học viên cần nhắc nhở tái đăng ký (còn <= 3 buổi)
 */
export function getRenewalAlerts(students: Student[]): RenewalAlertItem[] {
  const alerts: RenewalAlertItem[] = [];

  students.forEach((student) => {
    const status = getStudentRenewalStatus(student);
    if (status.needsAlert) {
      alerts.push({
        student,
        packageType: status.packageType,
        completedSessions: status.completed,
        totalSessions: status.total,
        remainingSessions: status.remaining,
        statusText: status.message,
        urgency: status.urgency,
      });
    }
  });

  // Ưu tiên sắp xếp học viên hết buổi trước (còn 0, 1, 2, 3 buổi)
  return alerts.sort((a, b) => a.remainingSessions - b.remainingSessions);
}

/**
 * Mẫu tin nhắn Zalo/SMS chuẩn để nhân viên / giáo viên sao chép gửi nhắc học viên
 */
export function generateZaloReminderMessage(student: Student, remaining: number): string {
  const pkg = student.packageType || '24 buổi';
  if (remaining === 0) {
    return `Chào bạn/phụ huynh ${student.name}, Harmony Music Studio xin gửi thông báo: Bạn đã hoàn thành trọn vẹn gói học ${student.instrument} (${pkg}). Để giữ khung giờ cố định (${student.scheduleString}) cùng ${student.teacher || 'giáo viên phụ trách'}, studio xin gửi thông tin đăng ký tiếp khóa mới (+8, +24, hoặc +36 buổi). Quý học viên vui lòng liên hệ quầy lễ tân hoặc hotline để được ưu đãi tái đăng ký nhé! Chúc bạn luôn tràn đầy cảm hứng âm nhạc! 🎶`;
  }

  return `Chào bạn/phụ huynh ${student.name}, Harmony Music Studio xin thông báo: Khóa học ${student.instrument} (${pkg}) của bạn hiện CHỈ CÒN ${remaining} BUỔI HỌC là sẽ hoàn thành. Để đảm bảo lộ trình tiến độ và duy trì thời khóa biểu quen thuộc (${student.scheduleString}) cùng ${student.teacher || 'thầy/cô'}, bạn có thể liên hệ studio để đăng ký nối tiếp khóa mới (+8, +24 hoặc +36 buổi) với các chính sách ưu đãi học viên thân thiết nhé! Trân trọng cảm ơn bạn! 🎵`;
}

/**
 * Tạo danh sách buổi học theo số lượng chỉ định (8, 24, hoặc 36 buổi)
 */
export function createDefaultSessions(count: number = 24, startDateStr?: string): AttendanceSession[] {
  const sessions: AttendanceSession[] = [];
  const baseDate = startDateStr ? new Date(startDateStr) : new Date();

  for (let i = 1; i <= count; i++) {
    // Tăng ngày cách nhau 3-4 ngày (tuần 2 buổi)
    const sessionDate = new Date(baseDate);
    sessionDate.setDate(baseDate.getDate() + Math.floor((i - 1) * 3.5));

    const dateFormatted = sessionDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    sessions.push({
      stt: i,
      date: dateFormatted,
      content: i === 1 ? 'Khởi động, kiểm tra trình độ & nhạc lý căn bản' : '',
      status: '',
      note: '',
    });
  }

  return sessions;
}

/**
 * Tương thích ngược: Tạo 24 buổi học mặc định
 */
export function createDefault24Sessions(startDateStr?: string): AttendanceSession[] {
  return createDefaultSessions(24, startDateStr);
}

export type ExtensionOption = 8 | 24 | 36;
export const EXTENSION_OPTIONS: { count: ExtensionOption; label: string; desc: string }[] = [
  { count: 8, label: '+8 buổi', desc: 'Gói trải nghiệm / Bổ trợ kỹ năng (1 tháng)' },
  { count: 24, label: '+24 buổi', desc: 'Gói tiêu chuẩn (3 tháng)' },
  { count: 36, label: '+36 buổi', desc: 'Gói chuyên sâu / Nâng cao (4.5 tháng)' },
];

/**
 * Gia hạn thêm 8, 24, hoặc 36 buổi học mới khi học viên đăng ký tiếp khóa học
 */
export function extendSessions(
  existingSessions: AttendanceSession[],
  additionalCount: 8 | 24 | 36 | number = 24
): AttendanceSession[] {
  const newSessions: AttendanceSession[] = [...existingSessions];
  const startSTT = existingSessions.length + 1;

  // Lấy ngày của buổi cuối cùng để tịnh tiến ngày
  let lastDate = new Date();
  if (existingSessions.length > 0) {
    const lastSession = existingSessions[existingSessions.length - 1];
    if (lastSession.date) {
      const parts = lastSession.date.split('/');
      if (parts.length === 3) {
        const parsed = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        if (!isNaN(parsed.getTime())) {
          lastDate = parsed;
        }
      }
    }
  }

  for (let i = 0; i < additionalCount; i++) {
    const curDate = new Date(lastDate);
    curDate.setDate(lastDate.getDate() + Math.floor((i + 1) * 3.5));
    const dateFormatted = curDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    newSessions.push({
      stt: startSTT + i,
      date: dateFormatted,
      content: i === 0 ? `Lộ trình gia hạn nâng cao (+${additionalCount} buổi)` : '',
      status: '',
      note: i === 0 ? `Khóa gia hạn (+${additionalCount} buổi)` : '',
    });
  }

  return newSessions;
}

/**
 * Tương thích ngược: Gia hạn 24 buổi học mặc định
 */
export function extend24Sessions(existingSessions: AttendanceSession[]): AttendanceSession[] {
  return extendSessions(existingSessions, 24);
}

/**
 * Chuẩn hóa trạng thái điểm danh từ kết quả quét ảnh / AI
 */
export function normalizeAttendanceStatus(rawStatus: any): 'Học' | 'Phép' | 'Vắng' | '' {
  if (!rawStatus) return '';
  const s = String(rawStatus).trim().toLowerCase();
  if (['học', 'đã học', 'v', 'x', 'có mặt', 'đạt', 'pass', 'attended', 'yes'].includes(s)) {
    return 'Học';
  }
  if (['phép', 'p', 'nghỉ phép', 'xin nghỉ', 'excused', 'leave'].includes(s)) {
    return 'Phép';
  }
  if (['vắng', 'k', 'nghỉ', 'vắng mặt', 'không phép', 'unexcused', 'absent'].includes(s)) {
    return 'Vắng';
  }
  return '';
}

/**
 * Làm sạch và chuẩn hóa một buổi học được quét từ hình ảnh
 */
export function sanitizeScannedSession(raw: any, fallbackStt: number): AttendanceSession {
  const parsedStt = Number(raw?.stt);
  const stt = (!isNaN(parsedStt) && parsedStt > 0) ? parsedStt : fallbackStt;
  const date = typeof raw?.date === 'string' ? raw.date.trim() : '';
  const content = typeof raw?.content === 'string' ? raw.content.trim() : '';
  const status = normalizeAttendanceStatus(raw?.status);
  const note = typeof raw?.note === 'string' ? raw.note.trim() : '';

  return {
    stt,
    date,
    content,
    status,
    note,
  };
}

export type ImportMergeStrategy = 'overwrite' | 'update_by_stt' | 'append';

/**
 * Hợp nhất các buổi học từ kết quả quét ảnh vào danh sách buổi học của học viên
 */
export function mergeSessions(
  existingSessions: AttendanceSession[],
  scannedSessions: AttendanceSession[],
  strategy: ImportMergeStrategy = 'update_by_stt'
): AttendanceSession[] {
  if (!scannedSessions || scannedSessions.length === 0) {
    return existingSessions;
  }

  if (strategy === 'overwrite') {
    // Ghi đè toàn bộ: sắp xếp theo stt
    return [...scannedSessions].sort((a, b) => a.stt - b.stt);
  }

  if (strategy === 'append') {
    // Nối tiếp vào sau các buổi hiện có
    const startStt = existingSessions.length + 1;
    const appended = scannedSessions.map((s, idx) => ({
      ...s,
      stt: startStt + idx,
    }));
    return [...existingSessions, ...appended];
  }

  // Strategy 'update_by_stt': Cập nhật theo STT, nếu chưa có thì thêm mới
  const sessionMap = new Map<number, AttendanceSession>();
  existingSessions.forEach((s) => sessionMap.set(s.stt, { ...s }));

  scannedSessions.forEach((s) => {
    const existing = sessionMap.get(s.stt);
    if (existing) {
      sessionMap.set(s.stt, {
        stt: s.stt,
        date: s.date || existing.date,
        content: s.content || existing.content,
        status: s.status || existing.status,
        note: s.note || existing.note,
      });
    } else {
      sessionMap.set(s.stt, { ...s });
    }
  });

  return Array.from(sessionMap.values()).sort((a, b) => a.stt - b.stt);
}

