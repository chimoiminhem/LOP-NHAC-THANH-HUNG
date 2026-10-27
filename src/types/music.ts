/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type InstrumentType = 'Piano' | 'Guitar' | 'Ukulele' | 'Bass' | 'Electric Guitar';

export type AttendanceStatus = 'Học' | 'Phép' | 'Vắng' | '';

export type TeacherStatus = 'Hoạt Động' | 'Nghỉ';

export type StudentStatus = 'Đang học' | 'Bảo Lưu' | 'Nghỉ Học';

export const STUDENT_STATUSES: StudentStatus[] = ['Đang học', 'Bảo Lưu', 'Nghỉ Học'];

export type PackageType = '8 buổi' | '24 buổi' | '36 buổi';

export interface Branch {
  id: string;
  name: string; // Tên cơ sở (e.g. "Cơ sở 1 - Quận 1 (Trụ sở chính)")
  address?: string; // Địa chỉ chi tiết
  phone?: string; // SĐT Hotline cơ sở
  manager?: string; // Quản lý cơ sở / Giáo viên phụ trách
  rooms?: string[]; // Danh sách các phòng học tại cơ sở
  notes?: string;
  isDefault?: boolean;
}

export interface AttendanceSession {
  stt: number;
  date: string; // YYYY-MM-DD or DD/MM/YYYY
  content: string; // e.g. "Luyện ngón Hanon, Bài Fur Elise đoản khúc 1"
  status: AttendanceStatus;
  note: string;
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  instrument: InstrumentType;
  scheduleString: string; // e.g. "Thứ 2, Thứ 4 (18:00 - 19:30)"
  teacher: string; // e.g. "Thầy Hoàng Piano"
  startDate: string;
  room?: string;
  branch?: string; // Cơ Sở
  packageType?: PackageType; // '8 buổi' | '24 buổi' | '36 buổi' (default '24 buổi')
  status?: StudentStatus; // 'Đang học' | 'Bảo Lưu' | 'Nghỉ Học' (default 'Đang học')
  feeStatus?: 'Đã đóng' | 'Chờ thanh toán' | 'Học bổng';
  notes?: string;
  sessions: AttendanceSession[];
}

export interface Teacher {
  id: string;
  name: string;
  phone: string;
  branch: string; // Cơ Sở
  instruments: InstrumentType[]; // Giáo viên có thể dạy nhiều bộ môn
  status: TeacherStatus; // 'Hoạt Động' | 'Nghỉ'
  notes?: string;
  email?: string;
  startDate?: string;
}

export interface ScheduleSlotItem {
  id: string;
  studentId: string;
  studentName: string;
  phone: string;
  instrument: InstrumentType;
  teacher: string;
  room: string;
  timeSlot: string;
  dayOfWeek: string; // 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6' | 'Thứ 7' | 'Chủ Nhật'
}

export interface TeacherAssignment {
  teacherName: string;
  phone?: string;
  branch?: string;
  status?: TeacherStatus;
  instruments: InstrumentType[];
  totalStudents: number;
  totalWeeklyHours: number;
  slots: {
    dayOfWeek: string;
    timeSlot: string;
    instrument: InstrumentType;
    studentName: string;
  }[];
}

export interface RenewalAlertItem {
  student: Student;
  packageType: PackageType;
  completedSessions: number;
  totalSessions: number;
  remainingSessions: number;
  statusText: string;
  urgency: 'critical' | 'warning' | 'normal';
}

export interface ChatMessage {
  id: string;
  senderId?: string;
  senderName: string;
  senderPhoto?: string;
  senderRole?: string;
  text: string;
  createdAt: string;
  deviceType?: 'PC' | 'Điện thoại' | 'iPad' | 'Web';
}

export interface MemberPresence {
  userId: string;
  name: string;
  email?: string;
  photoURL?: string;
  device: string;
  lastSeen: string;
}

