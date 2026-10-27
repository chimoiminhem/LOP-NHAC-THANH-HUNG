/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Student } from '../types/music';
import {
  buildTeacherSchedules,
  DAYS_OF_WEEK,
  INSTRUMENT_COLORS,
} from '../utils/scheduleParser';
import {
  UserCheck,
  Calendar,
  Clock,
  BookOpen,
  Phone,
  Search,
} from 'lucide-react';

interface TeacherScheduleViewProps {
  students: Student[];
}

export const TeacherScheduleView: React.FC<TeacherScheduleViewProps> = ({ students }) => {
  const [searchTeacher, setSearchTeacher] = useState('');
  const teachers = buildTeacherSchedules(students);

  const filteredTeachers = teachers.filter((t) =>
    t.teacherName.toLowerCase().includes(searchTeacher.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
              <h2 className="text-lg font-bold text-slate-900">
                Bảng Phân công & Lịch dạy Giáo viên (Teacher Schedule)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Tự động trích xuất lịch dạy theo từng ca/khung giờ dựa trên lịch học của học viên đã ghi nhận
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTeacher}
              onChange={(e) => setSearchTeacher(e.target.value)}
              placeholder="Tìm kiếm giáo viên..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-indigo-800 font-medium">Tổng số giáo viên</p>
              <p className="text-xl font-black text-indigo-950">{teachers.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-emerald-800 font-medium">Học viên đang theo học</p>
              <p className="text-xl font-black text-emerald-950">{students.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-amber-50/60 rounded-xl border border-amber-100">
            <div className="w-10 h-10 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-amber-800 font-medium">Tổng số giờ giảng dạy/tuần</p>
              <p className="text-xl font-black text-amber-950">
                {teachers.reduce((acc, cur) => acc + cur.totalWeeklyHours, 0)} giờ
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Teachers List Matrix */}
      <div className="space-y-6">
        {filteredTeachers.map((teacher, index) => {
          // Nhóm slot theo ngày
          const slotsByDay: Record<string, typeof teacher.slots> = {};
          DAYS_OF_WEEK.forEach((d) => (slotsByDay[d] = []));
          teacher.slots.forEach((s) => {
            if (slotsByDay[s.dayOfWeek]) {
              slotsByDay[s.dayOfWeek].push(s);
            }
          });

          return (
            <div
              key={teacher.teacherName}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Teacher Info Card Header */}
              <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg text-emerald-400">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{teacher.teacherName}</h3>
                      <span className="text-xs text-slate-300 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {teacher.phone}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-xs text-slate-400">Bộ môn:</span>
                      {teacher.instruments.map((ins) => (
                        <span
                          key={ins}
                          className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white/20 text-white"
                        >
                          {ins}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <p className="text-slate-400">Học viên phụ trách</p>
                    <p className="text-base font-bold text-emerald-300">{teacher.totalStudents} bạn</p>
                  </div>
                  <div className="w-px h-8 bg-slate-700"></div>
                  <div className="text-right">
                    <p className="text-slate-400">Thời lượng dạy</p>
                    <p className="text-base font-bold text-amber-300">{teacher.totalWeeklyHours} giờ/tuần</p>
                  </div>
                </div>
              </div>

              {/* Weekly Timetable Grid for This Teacher */}
              <div className="p-4 bg-slate-50 overflow-x-auto">
                <table className="w-full text-xs border-collapse bg-white rounded-xl shadow-2xs border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase font-semibold text-[11px]">
                      {DAYS_OF_WEEK.map((day) => (
                        <th
                          key={day}
                          className="py-2.5 px-3 border-r border-slate-200 last:border-r-0 text-center min-w-[120px]"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <Calendar className="w-3 h-3 text-indigo-500" />
                            <span>{day}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {DAYS_OF_WEEK.map((day) => {
                        const daySlots = slotsByDay[day];

                        return (
                          <td
                            key={day}
                            className="p-2 border-r border-slate-200 last:border-r-0 align-top min-h-[90px]"
                          >
                            {daySlots && daySlots.length > 0 ? (
                              <div className="space-y-1.5">
                                {daySlots.map((slot, idx) => {
                                  const color = INSTRUMENT_COLORS[slot.instrument];

                                  return (
                                    <div
                                      key={idx}
                                      className={`p-2 rounded-lg border text-left text-xs ${color.bg} ${color.border}`}
                                    >
                                      <p className="font-bold text-slate-900 truncate">
                                        {slot.studentName}
                                      </p>
                                      <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                        <Clock className="w-2.5 h-2.5" />
                                        <span>{slot.timeSlot}</span>
                                      </p>
                                      <span
                                        className={`inline-block mt-1 text-[9px] px-1.5 py-0.2 rounded font-semibold ${color.badge}`}
                                      >
                                        {slot.instrument}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="h-16 flex items-center justify-center text-slate-300 text-[11px] italic">
                                Trống ca
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
