/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { InstrumentType, PackageType, Student } from '../types/music';
import {
  calculateAttendanceStats,
  extendSessions,
  generateZaloReminderMessage,
  getRenewalAlerts,
  INSTRUMENT_COLORS,
  INSTRUMENTS,
  PACKAGE_TYPES,
  ExtensionOption,
} from '../utils/scheduleParser';
import {
  BellRing,
  AlertTriangle,
  Clock,
  Sparkles,
  Phone,
  Copy,
  Check,
  User,
  PlusCircle,
  Building,
  ArrowRight,
  ShieldAlert,
  Flame,
  Award,
} from 'lucide-react';

interface RenewalAlertsViewProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  onNavigateToStudent: (studentId: string) => void;
  onPersistStudent?: (student: Student) => void;
}

export const RenewalAlertsView: React.FC<RenewalAlertsViewProps> = ({
  students,
  setStudents,
  onNavigateToStudent,
  onPersistStudent,
}) => {
  const [filterUrgency, setFilterUrgency] = useState<'All' | 'critical' | 'warning'>('All');
  const [filterInstrument, setFilterInstrument] = useState<string>('All');
  const [filterPackage, setFilterPackage] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Lấy toàn bộ danh sách học viên còn <= 3 buổi
  const allAlerts = getRenewalAlerts(students);

  // Lọc theo bộ lọc
  const filteredAlerts = allAlerts.filter((item) => {
    const matchesUrgency = filterUrgency === 'All' || item.urgency === filterUrgency;
    const matchesInstrument =
      filterInstrument === 'All' || item.student.instrument === filterInstrument;
    const matchesPackage = filterPackage === 'All' || item.packageType === filterPackage;
    return matchesUrgency && matchesInstrument && matchesPackage;
  });

  // Sao chép tin nhắn Zalo nhắc nhở
  const handleCopyZaloMessage = async (student: Student, remaining: number) => {
    const text = generateZaloReminderMessage(student, remaining);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for iframe clipboard
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedId(student.id);
      showToast(`Đã sao chép mẫu tin nhắn Zalo gửi học viên ${student.name}!`);
      setTimeout(() => setCopiedId(null), 3000);
    } catch {
      showToast('Không thể truy cập bộ nhớ tạm. Hãy sao chép thủ công.');
    }
  };

  // Nút gia hạn nhanh (+8, +24, +36 buổi)
  const handleQuickExtend = (studentId: string, count: ExtensionOption) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    let updated: Student | null = null;
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const newSessions = extendSessions(s.sessions, count);
        updated = {
          ...s,
          sessions: newSessions,
        };
        return updated;
      })
    );

    if (updated && onPersistStudent) {
      onPersistStudent(updated);
    }

    showToast(`🎉 Đã gia hạn thành công +${count} buổi cho học viên ${student.name}!`);
  };

  // Thống kê nhanh
  const totalAlerts = allAlerts.length;
  const criticalCount = allAlerts.filter((a) => a.urgency === 'critical').length;
  const warningCount = allAlerts.filter((a) => a.urgency === 'warning').length;
  const expiredCount = allAlerts.filter((a) => a.remainingSessions === 0).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-indigo-500/30 flex items-center gap-3 animate-fade-in text-sm">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-rose-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-amber-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold">
              <BellRing className="w-7 h-7 text-amber-300 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Trung tâm Nhắc nhở & Tái Đăng ký Khóa học
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                  Còn ≤ 3 Buổi
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-100/80 mt-0.5">
                Tự động kích hoạt thông báo khi học viên chỉ còn 3 buổi hoàn thành gói học (8, 24, hoặc 36 buổi).
                Hỗ trợ 1-click gia hạn (+8, +24, +36) và tạo mẫu tin nhắn Zalo nhắc học phí.
              </p>
            </div>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-amber-200 uppercase tracking-wider">
                Cần Tái Đăng Ký
              </p>
              <p className="text-2xl font-black text-white mt-0.5">{totalAlerts} học viên</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
              <BellRing className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-rose-500/20 backdrop-blur-md rounded-xl p-3.5 border border-rose-400/30 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-rose-200 uppercase tracking-wider">
                Khẩn Cấp (0-1 Buổi)
              </p>
              <p className="text-2xl font-black text-rose-200 mt-0.5">{criticalCount} học viên</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/30 text-rose-300 flex items-center justify-center font-bold">
              <Flame className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-amber-500/20 backdrop-blur-md rounded-xl p-3.5 border border-amber-400/30 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-amber-200 uppercase tracking-wider">
                Cảnh Báo (2-3 Buổi)
              </p>
              <p className="text-2xl font-black text-amber-200 mt-0.5">{warningCount} học viên</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/30 text-amber-300 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-emerald-500/20 backdrop-blur-md rounded-xl p-3.5 border border-emerald-400/30 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider">
                Đã Hết Số Buổi
              </p>
              <p className="text-2xl font-black text-emerald-200 mt-0.5">{expiredCount} học viên</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/30 text-emerald-300 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Urgency */}
          <button
            onClick={() => setFilterUrgency('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterUrgency === 'All'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả ({totalAlerts})
          </button>

          <button
            onClick={() => setFilterUrgency('critical')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              filterUrgency === 'critical'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Khẩn cấp: Còn 0-1 buổi ({criticalCount})</span>
          </button>

          <button
            onClick={() => setFilterUrgency('warning')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              filterUrgency === 'warning'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Cảnh báo: Còn 2-3 buổi ({warningCount})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Instrument */}
          <select
            value={filterInstrument}
            onChange={(e) => setFilterInstrument(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">Tất cả Bộ môn</option>
            {INSTRUMENTS.map((ins) => (
              <option key={ins} value={ins}>
                {ins}
              </option>
            ))}
          </select>

          {/* Filter Package */}
          <select
            value={filterPackage}
            onChange={(e) => setFilterPackage(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">Tất cả Gói đăng ký</option>
            {PACKAGE_TYPES.map((pkg) => (
              <option key={pkg} value={pkg}>
                Gói {pkg}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Alert Cards List */}
      <div className="space-y-4">
        {filteredAlerts.map(({ student, packageType, completedSessions, totalSessions, remainingSessions, statusText, urgency }) => {
          const instrumentCol = INSTRUMENT_COLORS[student.instrument] || {
            badge: 'bg-slate-100 text-slate-800 border-slate-200',
          };
          const completionPercent = Math.min(
            100,
            Math.round((completedSessions / totalSessions) * 100)
          );
          const isCritical = urgency === 'critical';

          return (
            <div
              key={student.id}
              className={`bg-white rounded-2xl p-5 shadow-sm border transition-all hover:shadow-md ${
                isCritical
                  ? 'border-rose-300 ring-1 ring-rose-300/50 bg-gradient-to-r from-white via-rose-50/10 to-rose-50/30'
                  : 'border-amber-300 ring-1 ring-amber-300/40 bg-gradient-to-r from-white via-amber-50/10 to-amber-50/20'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                {/* Left: Student Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Remaining Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase border ${
                        remainingSessions === 0
                          ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                          : isCritical
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      {isCritical ? (
                        <Flame className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>
                        {remainingSessions === 0
                          ? 'Đã hết buổi học'
                          : `Chỉ còn ${remainingSessions} buổi`}
                      </span>
                    </span>

                    {/* Instrument Badge */}
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-lg font-bold border ${instrumentCol.badge}`}
                    >
                      {student.instrument}
                    </span>

                    {/* Package Type Badge */}
                    <span className="text-xs px-2.5 py-0.5 rounded-lg font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Gói {packageType}
                    </span>

                    {/* Student Name */}
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">{student.name}</h3>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="font-semibold text-slate-800">{student.phone}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>GV: <strong>{student.teacher || 'Chưa phân công'}</strong></span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{student.scheduleString}</span>
                    </div>

                    {student.branch && (
                      <div className="flex items-center gap-1 text-slate-500">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{student.branch}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1 max-w-xl">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                      <span>
                        Tiến độ: <strong>{completedSessions}/{totalSessions} buổi</strong> đã hoàn thành
                      </span>
                      <span className={isCritical ? 'text-rose-600 font-bold' : 'text-amber-700'}>
                        {completionPercent}% • {statusText}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCritical
                            ? 'bg-gradient-to-r from-amber-500 to-rose-600'
                            : 'bg-gradient-to-r from-emerald-500 to-amber-500'
                        }`}
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Quick Renewal Buttons & Zalo Copy */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">
                      Gia hạn:
                    </span>
                    <button
                      onClick={() => handleQuickExtend(student.id, 8)}
                      className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 font-bold text-xs border border-slate-200 transition-all cursor-pointer"
                      title="Gia hạn thêm +8 buổi học (Khóa 1 tháng)"
                    >
                      +8 buổi
                    </button>
                    <button
                      onClick={() => handleQuickExtend(student.id, 24)}
                      className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold text-xs border border-indigo-200 transition-all shadow-xs cursor-pointer"
                      title="Gia hạn thêm +24 buổi học tiêu chuẩn (Khóa 3 tháng)"
                    >
                      +24 buổi
                    </button>
                    <button
                      onClick={() => handleQuickExtend(student.id, 36)}
                      className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-700 font-bold text-xs border border-purple-200 transition-all cursor-pointer"
                      title="Gia hạn thêm +36 buổi học chuyên sâu (Khóa 4.5 tháng)"
                    >
                      +36 buổi
                    </button>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Copy Zalo Reminder Button */}
                    <button
                      onClick={() => handleCopyZaloMessage(student, remainingSessions)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
                      title="Sao chép tin nhắn Zalo gửi phụ huynh / học viên"
                    >
                      {copiedId === student.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Đã sao chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Mẫu Zalo nhắc học phí</span>
                        </>
                      )}
                    </button>

                    {/* View Attendance Detail */}
                    <button
                      onClick={() => onNavigateToStudent(student.id)}
                      className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-700 text-white font-medium text-xs transition-colors cursor-pointer"
                      title="Xem chi tiết điểm danh từng buổi"
                    >
                      <span>Chi tiết</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredAlerts.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Check className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-slate-800 text-base">
              Tuyệt vời! Không có học viên nào cần nhắc nhở tái đăng ký
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Tất cả học viên trong bộ lọc hiện đều còn trên 3 buổi học. Hệ thống sẽ tự động hiển thị học viên tại đây ngay khi số buổi còn lại ≤ 3.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
