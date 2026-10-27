/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, Teacher } from '../types/music';
import {
  DAYS_OF_WEEK,
  INSTRUMENTS,
  KHUNG_GIO_LIST,
  parseScheduleString,
  getStudentRenewalStatus,
} from '../utils/scheduleParser';

export interface CreateSpreadsheetResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

/**
 * Tạo một Google Spreadsheet hoàn chỉnh mới trên Google Drive của người dùng
 * với đầy đủ sheet Thông tin Giáo viên, Nhắc nhở Tái Đăng ký (<= 3 buổi), Thời khóa biểu,
 * Lịch dạy Giáo viên, 5 sheet bộ môn (kèm gói 8/24/36 buổi).
 */
export async function createCompleteMusicStudioSpreadsheet(
  accessToken: string,
  students: Student[],
  teachers: Teacher[] = []
): Promise<CreateSpreadsheetResult> {
  // 1. Tạo mới Spreadsheet với các sheet
  const sheetsConfig = [
    { properties: { title: 'Thông tin Giáo viên', gridProperties: { rowCount: 60, columnCount: 10 } } },
    { properties: { title: 'Nhắc nhở Tái Đăng ký', gridProperties: { rowCount: 60, columnCount: 12 } } },
    { properties: { title: 'Thời khóa biểu', gridProperties: { rowCount: 50, columnCount: 15 } } },
    { properties: { title: 'Lịch dạy Giáo viên', gridProperties: { rowCount: 50, columnCount: 15 } } },
    ...INSTRUMENTS.map((ins) => ({
      properties: { title: ins, gridProperties: { rowCount: 140, columnCount: 10 } },
    })),
  ];

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: `Hệ thống Quản lý Lớp học & Giáo viên Âm nhạc - ${new Date().toLocaleDateString('vi-VN')}`,
        locale: 'vi_VN',
        timeZone: 'Asia/Ho_Chi_Minh',
      },
      sheets: sheetsConfig,
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Lỗi tạo Google Sheet (${createRes.status}): ${errText}`);
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Điền dữ liệu và định dạng vào từng sheet
  const valueData: { range: string; values: (string | number)[][] }[] = [];

  // Sheet 1: THÔNG TIN GIÁO VIÊN
  const gvInfoRows: (string | number)[][] = [
    ['🎓 BẢNG QUẢN LÝ THÔNG TIN GIÁO VIÊN & ĐA BỘ MÔN', '', '', '', '', '', ''],
    ['STT', 'Họ và Tên', 'Số Điện Thoại', 'Cơ Sở', 'Bộ Môn Phụ Trách', 'Trạng Thái', 'Ghi Chú'],
  ];

  teachers.forEach((t, idx) => {
    gvInfoRows.push([
      idx + 1,
      t.name,
      t.phone,
      t.branch,
      t.instruments.join(', '),
      t.status,
      t.notes || '',
    ]);
  });

  valueData.push({
    range: `'Thông tin Giáo viên'!A1:G${gvInfoRows.length}`,
    values: gvInfoRows,
  });

  // Sheet 2: NHẮC NHỞ TÁI ĐĂNG KÝ (Học viên còn <= 3 buổi)
  const alertRows: (string | number)[][] = [
    ['🔔 BẢNG THEO DÕI & NHẮC NHỞ TÁI ĐĂNG KÝ KHÓA HỌC (CÒN ≤ 3 BUỔI)', '', '', '', '', '', '', '', '', ''],
    [
      'STT',
      'Họ Tên Học Viên',
      'Số Điện Thoại',
      'Bộ Môn',
      'Gói Đăng Ký',
      'Đã Học',
      'Còn Lại',
      'Tình Trạng / Cảnh Báo',
      'Giáo Viên Phụ Trách',
      'Lịch Học',
    ],
  ];

  let alertIdx = 1;
  students.forEach((s) => {
    const status = getStudentRenewalStatus(s);
    if (status.needsAlert) {
      alertRows.push([
        alertIdx++,
        s.name,
        s.phone,
        s.instrument,
        s.packageType || '24 buổi',
        `${status.completed}/${status.total} buổi`,
        `${status.remaining} buổi`,
        status.remaining === 0 ? '⚠️ ĐÃ HẾT BUỔI (Gia hạn ngay)' : `⚡ CHỈ CÒN ${status.remaining} BUỔI`,
        s.teacher || 'Chưa phân công',
        s.scheduleString,
      ]);
    }
  });

  if (alertIdx === 1) {
    alertRows.push(['', 'Tất cả học viên hiện đều còn trên 3 buổi học', '', '', '', '', '', '', '', '']);
  }

  valueData.push({
    range: `'Nhắc nhở Tái Đăng ký'!A1:J${alertRows.length}`,
    values: alertRows,
  });

  // Sheet 3: THỜI KHÓA BIỂU
  const tkbRows: (string | number)[][] = [
    ['📅 THỜI KHÓA BIỂU TOÀN TRUNG TÂM ÂM NHẠC', '', '', '', '', '', '', ''],
    ['Khung giờ / Ca học', ...DAYS_OF_WEEK],
  ];

  KHUNG_GIO_LIST.forEach((timeSlot) => {
    const rowValues = [timeSlot];
    DAYS_OF_WEEK.forEach((day) => {
      const matching = students.filter((s) => {
        const slots = parseScheduleString(s.scheduleString);
        return slots.some((slot) => {
          if (slot.day !== day) return false;
          const slotHour = slot.time.split(' - ')[0];
          const curHour = timeSlot.split(' - ')[0];
          return slot.time === timeSlot || slotHour === curHour;
        });
      });

      if (matching.length > 0) {
        rowValues.push(
          matching.map((m) => `• ${m.name} (${m.instrument})\n  GV: ${m.teacher}`).join('\n')
        );
      } else {
        rowValues.push('');
      }
    });
    tkbRows.push(rowValues);
  });

  valueData.push({
    range: `'Thời khóa biểu'!A1:H${tkbRows.length}`,
    values: tkbRows,
  });

  // Sheet 4: LỊCH DẠY GIÁO VIÊN
  const gvMap = new Map<string, { [day: string]: string[] }>();
  students.forEach((s) => {
    const gv = s.teacher || 'Chưa phân công';
    if (!gvMap.has(gv)) gvMap.set(gv, {});
    const dayData = gvMap.get(gv)!;

    const slots = parseScheduleString(s.scheduleString);
    slots.forEach((sl) => {
      if (!dayData[sl.day]) dayData[sl.day] = [];
      dayData[sl.day].push(`${s.name} (${s.instrument} - ${sl.time})`);
    });
  });

  const gvRows: (string | number)[][] = [
    ['👨‍🏫 BẢNG PHÂN CÔNG & LỊCH DẠY GIÁO VIÊN', '', '', '', '', '', '', '', '', ''],
    ['STT', 'Giáo viên', 'Bộ môn', ...DAYS_OF_WEEK],
  ];

  let gvIndex = 1;
  gvMap.forEach((slots, teacherName) => {
    const teacherStudents = students.filter((s) => s.teacher === teacherName);
    const teacherInstruments = Array.from(new Set(teacherStudents.map((s) => s.instrument))).join(', ');
    const row: (string | number)[] = [gvIndex++, teacherName, teacherInstruments];

    DAYS_OF_WEEK.forEach((day) => {
      const items = slots[day] || [];
      row.push(items.join('\n'));
    });
    gvRows.push(row);
  });

  valueData.push({
    range: `'Lịch dạy Giáo viên'!A1:J${gvRows.length}`,
    values: gvRows,
  });

  // Sheet 5-9: 5 Sheet BỘ MÔN (kèm Gói đăng ký 8, 24, 36 buổi)
  INSTRUMENTS.forEach((instrument) => {
    const instStudents = students.filter((s) => s.instrument === instrument);
    const instRows: (string | number)[][] = [
      [`QUẢN LÝ HỌC VIÊN & ĐIỂM DANH - BỘ MÔN: ${instrument.toUpperCase()}`, '', '', '', ''],
      ['', '', '', '', ''],
    ];

    instStudents.forEach((student) => {
      const renewal = getStudentRenewalStatus(student);
      instRows.push([`📌 THÔNG TIN HỌC VIÊN: ${student.name.toUpperCase()}`, '', '', '', '']);
      instRows.push(['Tên học viên:', student.name, 'Số điện thoại:', student.phone, '']);
      instRows.push(['Lớp/Bộ môn:', student.instrument, 'Gói đăng ký:', student.packageType || '24 buổi', '']);
      instRows.push(['Giáo viên:', student.teacher, 'Cơ sở / Phòng:', `${student.branch || 'Cơ sở chính'} - ${student.room || 'P.101'}`, '']);
      instRows.push(['Lịch học đăng ký:', student.scheduleString, 'Cảnh báo tái đăng ký:', renewal.needsAlert ? `CÒN ${renewal.remaining} BUỔI` : 'Đang học bình thường', '']);
      instRows.push(['', '', '', '', '']);
      instRows.push(['STT', 'Ngày học', 'Nội dung học', 'Trạng thái', 'Ghi chú']);

      student.sessions.forEach((sess) => {
        instRows.push([sess.stt, sess.date, sess.content, sess.status, sess.note]);
      });

      // Hàng tổng hợp
      instRows.push([
        'TỔNG HỢP:',
        '',
        `Đã học: ${student.sessions.filter((s) => s.status === 'Học').length} | Phép: ${student.sessions.filter((s) => s.status === 'Phép').length} | Vắng: ${student.sessions.filter((s) => s.status === 'Vắng').length}`,
        `Còn lại: ${renewal.remaining} buổi (${renewal.isExpired ? 'ĐÃ HẾT' : renewal.needsAlert ? 'CẦN GIA HẠN' : 'Đang học'})`,
        student.notes || '',
      ]);
      instRows.push(['', '', '', '', '']); // Dòng trống ngăn cách
    });

    valueData.push({
      range: `'${instrument}'!A1:E${instRows.length}`,
      values: instRows,
    });
  });

  // 3. Gửi batchUpdate cập nhật dữ liệu hàng loạt
  const batchRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: valueData,
      }),
    }
  );

  if (!batchRes.ok) {
    const errText = await batchRes.text();
    console.warn(`Lỗi ghi dữ liệu ban đầu (${batchRes.status}):`, errText);
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    title: `Hệ thống Quản lý Lớp học & Giáo viên Âm nhạc`,
  };
}
