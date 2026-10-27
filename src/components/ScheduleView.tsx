/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { InstrumentType, Student } from '../types/music';
import {
  DAYS_OF_WEEK,
  INSTRUMENT_COLORS,
  INSTRUMENTS,
  KHUNG_GIO_LIST,
  parseScheduleString,
} from '../utils/scheduleParser';
import { Calendar, Filter, Users, Clock, Printer } from 'lucide-react';

interface ScheduleViewProps {
  students: Student[];
  onSelectStudent?: (studentId: string) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ students, onSelectStudent }) => {
  const [filterInstrument, setFilterInstrument] = useState<string>('All');
  const [filterTeacher, setFilterTeacher] = useState<string>('All');

  // Lấy danh sách giáo viên duy nhất để lọc
  const teacherList = Array.from(
    new Set(students.map((s) => s.teacher).filter(Boolean))
  ).sort();

  // Lọc học viên theo bộ môn & giáo viên
  const filteredStudents = students.filter((s) => {
    if (filterInstrument !== 'All' && s.instrument !== filterInstrument) return false;
    if (filterTeacher !== 'All' && s.teacher !== filterTeacher) return false;
    return true;
  });

  // Tìm các học viên học vào ngày và khung giờ cụ thể
  const getStudentsForSlot = (day: string, timeSlot: string) => {
    return filteredStudents.filter((student) => {
      const parsedSlots = parseScheduleString(student.scheduleString);
      return parsedSlots.some((slot) => {
        if (slot.day !== day) return false;
        // Kiểm tra khớp giờ bắt đầu hoặc toàn chuỗi
        const slotStart = slot.time.split(' - ')[0]?.trim();
        const curStart = timeSlot.split(' - ')[0]?.trim();
        return slot.time === timeSlot || slotStart === curStart;
      });
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-lg font-bold text-slate-900">
                Thời khóa biểu Toàn trung tâm (Schedule View)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Tự động tổng hợp dựa trên thông tin "Lịch học đăng ký" từ 5 trang tính bộ môn
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold">
              <span>👉 Mẹo tương tác:</span>
              <span className="font-normal text-indigo-700">
                Nhấp vào bất kỳ học viên nào bên dưới để mở ngay hồ sơ & điểm danh 24 buổi của bạn đó!
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter by Instrument */}
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterInstrument}
                onChange={(e) => setFilterInstrument(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">Tất cả bộ môn ({students.length})</option>
                {INSTRUMENTS.map((inst) => (
                  <option key={inst} value={inst}>
                    {inst}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Teacher */}
            <div className="flex items-center gap-1.5 text-xs">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterTeacher}
                onChange={(e) => setFilterTeacher(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">Tất cả giáo viên</option>
                {teacherList.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In TKB</span>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-3 flex-wrap text-xs">
          <span className="font-semibold text-slate-500">Màu bộ môn:</span>
          {INSTRUMENTS.map((inst) => {
            const color = INSTRUMENT_COLORS[inst];
            return (
              <span
                key={inst}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium ${color.badge}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                {inst}
              </span>
            );
          })}
        </div>
      </div>

      {/* Main Timetable Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-900 text-white text-xs">
                <th className="py-3 px-3 text-center w-36 font-bold border-r border-slate-800 bg-slate-950">
                  <div className="flex items-center justify-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Ca / Khung giờ</span>
                  </div>
                </th>
                {DAYS_OF_WEEK.map((day) => (
                  <th
                    key={day}
                    className="py-3 px-3 text-center font-bold border-r border-slate-800 last:border-r-0 min-w-[130px]"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{day}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {KHUNG_GIO_LIST.map((timeSlot) => (
                <tr key={timeSlot} className="hover:bg-slate-50/50 transition-colors">
                  {/* Cột Khung Giờ */}
                  <td className="py-4 px-3 text-center font-bold text-slate-700 bg-slate-50/90 border-r border-slate-200 whitespace-nowrap">
                    <div className="text-xs text-indigo-950 font-mono">{timeSlot}</div>
                  </td>

                  {/* 7 Cột Ngày trong tuần */}
                  {DAYS_OF_WEEK.map((day) => {
                    const slotStudents = getStudentsForSlot(day, timeSlot);

                    return (
                      <td
                        key={day}
                        className="py-2 px-2 border-r border-slate-200 last:border-r-0 align-top h-24"
                      >
                        {slotStudents.length > 0 ? (
                          <div className="space-y-1.5">
                            {slotStudents.map((st) => {
                              const style = INSTRUMENT_COLORS[st.instrument];

                              return (
                                <button
                                  type="button"
                                  key={st.id}
                                  onClick={() => onSelectStudent?.(st.id)}
                                  className={`w-full p-2.5 rounded-xl border text-left shadow-2xs transition-all hover:scale-[1.03] hover:shadow-md hover:ring-2 hover:ring-indigo-500 cursor-pointer group block ${style.bg} ${style.border}`}
                                  title={`Bấm để chuyển sang xem chi tiết học viên & điểm danh: ${st.name}`}
                                >
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="font-bold text-slate-900 group-hover:text-indigo-950 truncate">
                                      {st.name}
                                    </span>
                                    <span
                                      className={`text-[10px] px-1.5 py-0.2 rounded font-semibold shrink-0 ${style.badge}`}
                                    >
                                      {st.instrument}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-600 space-y-0.5">
                                    <p className="truncate font-medium text-slate-700">
                                      GV: {st.teacher}
                                    </p>
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                                      <span className="truncate">{st.room || 'Phòng 101'}</span>
                                      <span className="text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center">
                                        Chi tiết →
                                      </span>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-300 text-[11px] italic">
                            —
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
