/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Student } from '../types/music';
import { INSTRUMENTS, calculateAttendanceStats } from '../utils/scheduleParser';
import { Users, TrendingUp, CheckCircle2, Clock, Award } from 'lucide-react';

interface StudioAnalyticsChartsProps {
  students: Student[];
}

// Màu sắc bộ môn chuẩn
const INSTRUMENT_HEX_COLORS: Record<string, string> = {
  Piano: '#10b981', // Emerald
  Guitar: '#f59e0b', // Amber
  Ukulele: '#0ea5e9', // Sky
  Bass: '#8b5cf6', // Purple
  'Electric Guitar': '#f43f5e', // Rose
};

const ATTENDANCE_HEX_COLORS = {
  attended: '#10b981', // Học
  excused: '#f59e0b', // Phép
  unexcused: '#f43f5e', // Vắng
  empty: '#cbd5e1', // Chưa học
};

export const StudioAnalyticsCharts: React.FC<StudioAnalyticsChartsProps> = ({ students = [] }) => {
  const safeStudents = Array.isArray(students) ? students : [];

  // 1. Dữ liệu số lượng học viên theo từng bộ môn
  const instrumentData = INSTRUMENTS.map((inst) => {
    const instStudents = safeStudents.filter((s) => s.instrument === inst);
    const count = instStudents.length;
    let totalSessions = 0;
    let attendedSessions = 0;

    instStudents.forEach((s) => {
      const stats = calculateAttendanceStats(s.sessions);
      totalSessions += stats.total;
      attendedSessions += stats.attended;
    });

    return {
      name: inst,
      'Số học viên': count,
      'Đã hoàn thành (buổi)': attendedSessions,
      color: INSTRUMENT_HEX_COLORS[inst] || '#6366f1',
    };
  });

  // 2. Dữ liệu phân bổ học viên cho biểu đồ tròn (Donut Chart)
  const pieData = INSTRUMENTS.map((inst) => ({
    name: inst,
    value: safeStudents.filter((s) => s.instrument === inst).length,
    color: INSTRUMENT_HEX_COLORS[inst] || '#6366f1',
  })).filter((d) => d.value > 0);

  // 3. Dữ liệu tổng hợp trạng thái điểm danh toàn trung tâm
  let totalAttended = 0;
  let totalExcused = 0;
  let totalUnexcused = 0;
  let totalRemaining = 0;
  let totalAllSessions = 0;

  safeStudents.forEach((s) => {
    const stats = calculateAttendanceStats(s.sessions);
    totalAttended += stats.attended;
    totalExcused += stats.excused;
    totalUnexcused += stats.unexcused;
    totalRemaining += stats.remaining;
    totalAllSessions += stats.total;
  });

  const overallAttendanceRate =
    totalAttended + totalExcused + totalUnexcused > 0
      ? Math.round(
          (totalAttended / (totalAttended + totalExcused + totalUnexcused)) * 100
        )
      : 0;

  // Tìm bộ môn đông học viên nhất
  const sorted = [...instrumentData].sort(
    (a, b) => b['Số học viên'] - a['Số học viên']
  );
  const topInstrument = sorted[0];

  return (
    <div className="space-y-6">
      {/* KPI Cards Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tổng học viên</p>
            <p className="text-2xl font-black text-slate-900">{students.length} bạn</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tỷ lệ đi học</p>
            <p className="text-2xl font-black text-emerald-600">{overallAttendanceRate}%</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tổng buổi theo dõi</p>
            <p className="text-2xl font-black text-amber-600">{totalAllSessions}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Bộ môn hàng đầu</p>
            <p className="text-base font-bold text-slate-900 truncate">
              {topInstrument ? topInstrument.name : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Biểu đồ cột: Số lượng học viên theo bộ môn */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Số lượng Học viên theo từng Bộ môn</span>
              </h3>
              <p className="text-xs text-slate-500">
                Thống kê trực quan số học viên đang theo học 5 nhạc cụ tại studio
              </p>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold">
              Recharts Bar
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={instrumentData}
                margin={{ top: 15, right: 20, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  interval={0}
                  tickMargin={8}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  domain={[0, 'dataMax + 1']}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                  }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Bar
                  dataKey="Số học viên"
                  radius={[8, 8, 0, 0]}
                  barSize={38}
                >
                  {instrumentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Instrument Badges Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-slate-100 text-xs">
            {instrumentData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-md"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-semibold text-slate-700">{item.name}:</span>
                <span className="text-slate-900 font-bold">{item['Số học viên']}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Biểu đồ tròn: Tỷ lệ phân bổ học viên */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Cơ cấu Bộ môn Studio
                </h3>
                <p className="text-xs text-slate-500">Tỷ lệ % học viên phân bổ</p>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold">
                Donut Chart
              </span>
            </div>

            <div className="h-56 sm:h-60 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '10px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center text in donut chart */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900">{students.length}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Học viên</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {pieData.map((item) => {
              const pct = students.length > 0 ? Math.round((item.value / students.length) * 100) : 0;
              return (
                <div key={item.name} className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-slate-700">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{item.value} học viên</span>
                    <span className="text-slate-400 font-mono text-[11px]">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
