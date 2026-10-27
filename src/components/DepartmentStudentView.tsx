/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AttendanceSession,
  AttendanceStatus,
  Branch,
  InstrumentType,
  Student,
  StudentStatus,
  STUDENT_STATUSES,
} from '../types/music';
import {
  calculateAttendanceStats,
  extendSessions,
  extend24Sessions,
  EXTENSION_OPTIONS,
  ExtensionOption,
  INSTRUMENTS,
  INSTRUMENT_COLORS,
  STUDENT_STATUS_CONFIG,
} from '../utils/scheduleParser';
import {
  Phone,
  Calendar,
  User,
  PlusCircle,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  BarChart3,
  BellRing,
  Flame,
  Camera,
  Printer,
  Building2,
} from 'lucide-react';
import { StudioAnalyticsCharts } from './StudioAnalyticsCharts';
import { StudentPrintModal } from './StudentPrintModal';

interface DepartmentStudentViewProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  onOpenEditStudent: (student: Student) => void;
  onOpenAddStudent: (defaultInstrument?: InstrumentType) => void;
  onOpenImportImage?: (student?: Student) => void;
  selectedInstrument: InstrumentType;
  setSelectedInstrument: (inst: InstrumentType) => void;
  highlightedStudentId?: string | null;
  branches?: Branch[];
  onPersistStudent?: (student: Student) => void;
  onDeleteStudent?: (studentId: string) => void;
}

export const DepartmentStudentView: React.FC<DepartmentStudentViewProps> = ({
  students,
  setStudents,
  onOpenEditStudent,
  onOpenAddStudent,
  onOpenImportImage,
  selectedInstrument,
  setSelectedInstrument,
  highlightedStudentId,
  branches = [],
  onPersistStudent,
  onDeleteStudent,
}) => {
  const [showCharts, setShowCharts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStudents, setExpandedStudents] = useState<Record<string, boolean>>({
    'piano-1': true,
    'guitar-1': true,
    'ukulele-1': true,
    'bass-1': true,
    'electric-1': true,
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [printingStudent, setPrintingStudent] = useState<Student | null>(null);

  // Khi người dùng click học viên từ Thời khóa biểu, tự động cuộn đến và mở rộng bảng của học viên
  React.useEffect(() => {
    if (highlightedStudentId) {
      setExpandedStudents((prev) => ({ ...prev, [highlightedStudentId]: true }));
      setTimeout(() => {
        const el = document.getElementById(`student-card-${highlightedStudentId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  }, [highlightedStudentId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [statusFilter, setStatusFilter] = useState<'Tất cả' | StudentStatus>('Tất cả');

  // Cập nhật nhanh trạng thái học viên: "Đang học" | "Bảo Lưu" | "Nghỉ Học"
  const handleUpdateStudentStatus = (studentId: string, newStatus: StudentStatus) => {
    let updatedStudent: Student | null = null;
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          updatedStudent = { ...s, status: newStatus };
          return updatedStudent;
        }
        return s;
      })
    );
    if (updatedStudent && onPersistStudent) {
      onPersistStudent(updatedStudent);
    }
    showToast(`Đã chuyển trạng thái của học viên sang "${newStatus}"`);
  };

  // Tất cả học viên của bộ môn hiện tại
  const allDeptStudents = students.filter((s) => s.instrument === selectedInstrument);
  const activeCount = allDeptStudents.filter((s) => (s.status || 'Đang học') === 'Đang học').length;
  const reservedCount = allDeptStudents.filter((s) => s.status === 'Bảo Lưu').length;
  const droppedCount = allDeptStudents.filter((s) => s.status === 'Nghỉ Học').length;

  // Lọc học viên theo bộ môn được chọn, trạng thái, và từ khóa tìm kiếm
  const departmentStudents = allDeptStudents.filter(
    (s) =>
      (statusFilter === 'Tất cả' || (s.status || 'Đang học') === statusFilter) &&
      (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone.includes(searchQuery) ||
        (s.teacher && s.teacher.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.branch && s.branch.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  // Toggle thu gọn / mở rộng bảng điểm danh của học viên
  const toggleExpand = (studentId: string) => {
    setExpandedStudents((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  // Cập nhật trạng thái hoặc nội dung buổi học
  const handleUpdateSession = (
    studentId: string,
    sessionStt: number,
    field: keyof AttendanceSession,
    value: string
  ) => {
    let updatedStudent: Student | null = null;
    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;
        const updatedSessions = student.sessions.map((sess) => {
          if (sess.stt === sessionStt) {
            return { ...sess, [field]: value };
          }
          return sess;
        });
        updatedStudent = { ...student, sessions: updatedSessions };
        return updatedStudent;
      })
    );
    if (updatedStudent && onPersistStudent) {
      onPersistStudent(updatedStudent);
    }
  };

  const [activeExtensionMenu, setActiveExtensionMenu] = useState<string | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<{ id: string; name: string } | null>(null);

  // Nút gia hạn thêm buổi học (+8, +24, +36 sessions) - iframe safe
  const handleExtendSessions = (studentId: string, additionalCount: ExtensionOption = 24) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    let updatedStudent: Student | null = null;
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const extended = extendSessions(s.sessions, additionalCount);
        updatedStudent = { ...s, sessions: extended };
        return updatedStudent;
      })
    );

    if (updatedStudent && onPersistStudent) {
      onPersistStudent(updatedStudent);
    }

    // Tự động mở rộng bảng để xem các buổi mới
    setExpandedStudents((prev) => ({ ...prev, [studentId]: true }));
    setActiveExtensionMenu(null);
    showToast(`🎉 Đã gia hạn thành công +${additionalCount} buổi học mới cho ${student.name}!`);
  };

  // Xác nhận xóa học viên
  const handleConfirmDelete = () => {
    if (!studentToDelete) return;
    const { id, name } = studentToDelete;
    setStudents((prev) => prev.filter((s) => s.id !== id));
    if (onDeleteStudent) {
      onDeleteStudent(id);
    }
    setStudentToDelete(null);
    showToast(`Đã xóa học viên ${name}.`);
  };

  // Thống kê tổng quan bộ môn
  const totalStudentsInDept = departmentStudents.length;
  let deptAttended = 0;
  let deptExcused = 0;
  let deptUnexcused = 0;
  let deptTotalSessions = 0;

  departmentStudents.forEach((st) => {
    const stats = calculateAttendanceStats(st.sessions);
    deptAttended += stats.attended;
    deptExcused += stats.excused;
    deptUnexcused += stats.unexcused;
    deptTotalSessions += stats.total;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="no-print fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-indigo-500/50 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Biểu đồ trực quan hóa số lượng học viên theo bộ môn (Recharts) */}
      <div className="no-print bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-2xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Biểu đồ Trực quan hóa Dữ liệu Studio
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700">
                  Thư viện Recharts
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Thống kê số lượng học viên theo 5 bộ môn, tỷ lệ phân bổ & trạng thái điểm danh
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCharts(!showCharts)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <span>{showCharts ? 'Thu gọn biểu đồ' : 'Hiển thị biểu đồ'}</span>
            {showCharts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showCharts && (
          <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
            <StudioAnalyticsCharts students={students} />
          </div>
        )}
      </div>

      {/* Tabs 5 Bộ môn: Piano, Guitar, Ukulele, Bass, Electric Guitar */}
      <div className="no-print bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
              Quản lý Lớp học theo 5 Bộ môn (Phần A)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Chọn trang tính bộ môn để xem hồ sơ học viên, thông tin chung và bảng điểm danh 24 buổi
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenImportImage && (
              <button
                onClick={() => onOpenImportImage()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
                title={`Quét ảnh sổ học tập / bài học bộ môn ${selectedInstrument}`}
              >
                <Camera className="w-4 h-4 text-emerald-200" />
                <span>Quét ảnh sổ học tập</span>
              </button>
            )}

            <button
              onClick={() => onOpenAddStudent(selectedInstrument)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Thêm học viên {selectedInstrument}</span>
            </button>
          </div>
        </div>

        {/* 5 Instrument Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100">
          {INSTRUMENTS.map((inst) => {
            const count = students.filter((s) => s.instrument === inst).length;
            const isSelected = selectedInstrument === inst;
            const style = INSTRUMENT_COLORS[inst];

            return (
              <button
                key={inst}
                onClick={() => setSelectedInstrument(inst)}
                className={`p-3 rounded-xl text-left border transition-all ${
                  isSelected
                    ? `${style.bg} ${style.border} ring-2 ring-indigo-500 shadow-sm`
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${isSelected ? style.text : 'text-slate-800'}`}>
                    {inst}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      isSelected ? 'bg-white shadow-xs text-indigo-700' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count} học viên
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Sheet: [{inst}]</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Department Summary & Search Toolbar */}
      <div className="no-print grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* KPI: Tổng học viên & Phân bổ trạng thái */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Học viên {selectedInstrument}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-black text-slate-900">{allDeptStudents.length}</p>
              <span className="text-xs text-slate-400 font-medium">({departmentStudents.length} đang lọc)</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold">
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                ● {activeCount} Đang học
              </span>
              <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                ● {reservedCount} Bảo lưu
              </span>
              <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                ● {droppedCount} Nghỉ
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
        </div>

        {/* KPI: Buổi đã học */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Buổi đã học (Học)</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{deptAttended}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* KPI: Buổi vắng / có phép */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Phép / Vắng</p>
            <p className="text-2xl font-black text-amber-600 mt-1">
              {deptExcused} <span className="text-sm font-normal text-slate-400">/ {deptUnexcused} vắng</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* KPI: Tổng buổi quy chuẩn */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng số buổi theo dõi</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{deptTotalSessions}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Status Filter & Search Toolbar */}
      <div className="no-print bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-500 mr-1 whitespace-nowrap">Lọc trạng thái:</span>
          <button
            type="button"
            onClick={() => setStatusFilter('Tất cả')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'Tất cả'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả ({allDeptStudents.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Đang học')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'Đang học'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Đang học ({activeCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Bảo Lưu')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'Bảo Lưu'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Bảo Lưu ({reservedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Nghỉ Học')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'Nghỉ Học'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>Nghỉ Học ({droppedCount})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px] md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Tìm kiếm theo tên, SĐT, GV, cơ sở...`}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Danh sách từng Học viên (Khu vực thông tin chung + Bảng 24 buổi) */}
      <div className="space-y-6">
        {departmentStudents.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">Chưa có học viên nào trong bộ môn {selectedInstrument}</h3>
            <p className="text-xs text-slate-500 mt-1">Nhấn nút bên dưới để thêm học viên mới kèm khởi tạo 24 buổi học mặc định.</p>
            <button
              onClick={() => onOpenAddStudent(selectedInstrument)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
            >
              <PlusCircle className="w-4 h-4" />
              Thêm học viên {selectedInstrument}
            </button>
          </div>
        ) : (
          departmentStudents.map((student) => {
            const stats = calculateAttendanceStats(student.sessions);
            const isExpanded = expandedStudents[student.id] ?? false;
            const isHighlighted = highlightedStudentId === student.id;

            return (
              <div
                key={student.id}
                id={`student-card-${student.id}`}
                className={`bg-white rounded-2xl border shadow-xs overflow-visible transition-all relative ${
                  isHighlighted
                    ? 'ring-4 ring-indigo-500 border-indigo-400 shadow-xl'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* --- KHU VỰC THÔNG TIN CHUNG CỦA HỌC VIÊN --- */}
                <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 p-5 border-b border-slate-200">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: General Student Info */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                          📌 THÔNG TIN HỌC VIÊN
                        </span>
                        <h3 className="text-lg font-bold text-slate-900">{student.name}</h3>

                        {/* Status Badge */}
                        {(() => {
                          const currentStatus: StudentStatus = student.status || 'Đang học';
                          const cfg = STUDENT_STATUS_CONFIG[currentStatus];
                          return (
                            <span
                              className={`text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 border shadow-2xs ${cfg.badge}`}
                              title={cfg.desc}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${cfg.dot} ${
                                  currentStatus === 'Đang học' ? 'animate-pulse' : ''
                                }`}
                              />
                              <span>{currentStatus}</span>
                            </span>
                          );
                        })()}

                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          {student.instrument}
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Gói {student.packageType || '24 buổi'}
                        </span>
                        {stats.remaining <= 3 && student.status !== 'Nghỉ Học' && (
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border animate-pulse ${
                              stats.remaining === 0
                                ? 'bg-rose-600 text-white border-rose-700'
                                : stats.remaining === 1
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-amber-100 text-amber-900 border-amber-300'
                            }`}
                          >
                            <BellRing className="w-3 h-3" />
                            <span>
                              {stats.remaining === 0
                                ? 'Hết buổi (Cần gia hạn)'
                                : `Còn ${stats.remaining} buổi`}
                            </span>
                          </span>
                        )}
                        {student.feeStatus && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {student.feeStatus}
                          </span>
                        )}
                        {isHighlighted && (
                          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-600 text-white animate-pulse shadow-xs flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Đang xem từ Thời khóa biểu</span>
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-700">SĐT:</span>
                          <span className="font-mono text-slate-900">{student.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-700">Giáo viên:</span>
                          <span className="text-slate-900 font-medium">{student.teacher || 'Chưa phân công'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-700">Phòng:</span>
                          <span className="text-slate-900">{student.room || 'Phòng 101'}</span>
                        </div>
                        {student.branch && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-700">Cơ sở:</span>
                            <span className="text-slate-900 truncate" title={student.branch}>{student.branch}</span>
                          </div>
                        )}
                      </div>

                      {/* Lịch học đăng ký (Nổi bật) */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <Calendar className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-bold text-slate-800">Lịch học đăng ký:</span>
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                          {student.scheduleString}
                        </span>
                        {student.notes && (
                          <span className="text-xs text-slate-500 italic truncate max-w-sm">
                            • {student.notes}
                          </span>
                        )}
                      </div>

                      {/* Cảnh báo nhắc nhở khi còn <= 3 buổi */}
                      {stats.remaining <= 3 && student.status !== 'Nghỉ Học' && (
                        <div
                          className={`mt-2 p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                            stats.remaining <= 1
                              ? 'bg-rose-50 border-rose-200 text-rose-800'
                              : 'bg-amber-50 border-amber-200 text-amber-900'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-rose-500 shrink-0" />
                            <span>
                              <strong>Nhắc nhở tái đăng ký:</strong> Học viên chỉ còn{' '}
                              <strong>{stats.remaining} buổi</strong> hoàn thành gói{' '}
                              <strong>{student.packageType || '24 buổi'}</strong> ({stats.completed}/{stats.total} buổi đã học).
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                            Hãy gia hạn tiếp +8, +24, +36 buổi!
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right: Actions & Progress Summary */}
                    <div className="flex flex-col items-start lg:items-end gap-3">
                      {/* Attendance Progress Pills */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                          Đã học: {stats.attended}
                        </span>
                        <span className="px-2 py-1 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                          Phép: {stats.excused}
                        </span>
                        <span className="px-2 py-1 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                          Vắng: {stats.unexcused}
                        </span>
                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                          Còn lại: {stats.remaining} / {stats.total}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Cập nhật nhanh trạng thái học viên */}
                        <div className="inline-flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 shadow-2xs">
                          {STUDENT_STATUSES.map((st) => {
                            const isCurrent = (student.status || 'Đang học') === st;
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleUpdateStudentStatus(student.id, st)}
                                className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                  isCurrent
                                    ? st === 'Đang học'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : st === 'Bảo Lưu'
                                      ? 'bg-amber-600 text-white shadow-xs'
                                      : 'bg-slate-700 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                                }`}
                                title={`Chuyển trạng thái sang "${st}"`}
                              >
                                {st}
                              </button>
                            );
                          })}
                        </div>
                        {/* NÚT QUÉT ẢNH SỔ HỌC TẬP CHO HỌC VIÊN NÀY */}
                        {onOpenImportImage && (
                          <button
                            onClick={() => onOpenImportImage(student)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                            title={`Quét ảnh sổ học tập / bài học cho ${student.name}`}
                          >
                            <Camera className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Quét sổ học tập</span>
                          </button>
                        )}

                        {/* NÚT GIA HẠN (+8, +24, +36 BUỔI) */}
                        <div className="relative inline-block">
                          <button
                            onClick={() =>
                              setActiveExtensionMenu(activeExtensionMenu === student.id ? null : student.id)
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                            title="Gia hạn khóa học (+8, +24, hoặc +36 buổi)"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Gia hạn khóa học</span>
                            <ChevronDown className="w-3 h-3 ml-0.5" />
                          </button>

                          {activeExtensionMenu === student.id && (
                            <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 text-left animate-in fade-in zoom-in-95 duration-100">
                              <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Chọn số buổi gia hạn
                              </div>
                              {EXTENSION_OPTIONS.map((opt) => (
                                <button
                                  key={opt.count}
                                  onClick={() => handleExtendSessions(student.id, opt.count)}
                                  className="w-full px-3 py-2 text-left hover:bg-emerald-50/80 flex items-center justify-between group transition-colors"
                                >
                                  <div>
                                    <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                                      {opt.label}
                                    </p>
                                    <p className="text-[10px] text-slate-500">{opt.desc}</p>
                                  </div>
                                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                                    +{opt.count}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* NÚT IN ẤN PHIẾU THEO DÕI HỌC VIÊN */}
                        <button
                          onClick={() => setPrintingStudent(student)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                          title={`In phiếu theo dõi học tập & điểm danh cho ${student.name} (Khổ A4)`}
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                          <span>In phiếu</span>
                        </button>

                        <button
                          onClick={() => onOpenEditStudent(student)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                          title="Sửa thông tin học viên"
                          aria-label="Sửa thông tin"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setStudentToDelete({ id: student.id, name: student.name })}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:border-rose-300 text-slate-600 hover:text-rose-600 transition-colors"
                          title="Xóa học viên"
                          aria-label="Xóa học viên"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => toggleExpand(student.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                        >
                          <span>{isExpanded ? 'Thu gọn bảng' : `Xem lộ trình (${student.sessions.length} buổi)`}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-1.5 transition-all duration-300"
                      style={{ width: `${(stats.attended / stats.total) * 100}%` }}
                      title={`Đã học: ${stats.attended} buổi`}
                    />
                    <div
                      className="bg-amber-400 h-1.5 transition-all duration-300"
                      style={{ width: `${(stats.excused / stats.total) * 100}%` }}
                      title={`Phép: ${stats.excused} buổi`}
                    />
                    <div
                      className="bg-rose-500 h-1.5 transition-all duration-300"
                      style={{ width: `${(stats.unexcused / stats.total) * 100}%` }}
                      title={`Vắng: ${stats.unexcused} buổi`}
                    />
                  </div>
                </div>

                {/* --- BẢNG THEO DÕI ĐIỂM DANH & LỘ TRÌNH HỌC (24 BUỔI) --- */}
                {isExpanded && (
                  <div className="p-4 bg-slate-50 overflow-x-auto">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          📋 Bảng điểm danh & Lộ trình học ({student.sessions.length} buổi)
                        </span>
                        <span className="text-[11px] text-slate-500">
                          (Dữ liệu chuẩn đồng bộ với Google Sheets)
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs text-slate-500 hidden sm:block">
                          Cột trạng thái: <span className="font-semibold text-emerald-700">Học</span>,{' '}
                          <span className="font-semibold text-amber-700">Phép</span>,{' '}
                          <span className="font-semibold text-rose-700">Vắng</span>
                        </div>
                        <button
                          onClick={() => setPrintingStudent(student)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                          title={`In bảng điểm danh này ra giấy A4 cho ${student.name}`}
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                          <span>In phiếu A4</span>
                        </button>
                      </div>
                    </div>

                    <table className="w-full text-xs text-left border-collapse bg-white rounded-xl shadow-2xs border border-slate-200">
                      <thead>
                        <tr className="bg-slate-800 text-white font-semibold uppercase text-[11px] tracking-wider text-center">
                          <th className="py-2.5 px-2 w-12 border-r border-slate-700">STT</th>
                          <th className="py-2.5 px-3 w-28 border-r border-slate-700">Ngày học</th>
                          <th className="py-2.5 px-3 w-60 sm:w-68 text-left border-r border-slate-700">Nội dung học</th>
                          <th className="py-2.5 px-1.5 w-24 border-r border-slate-700">Trạng thái</th>
                          <th className="py-2.5 px-4 min-w-[300px] text-left">Ghi chú & Nhận xét buổi học</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-normal">
                        {student.sessions.map((sess) => {
                          const isBatchHeader =
                            (sess.note && sess.note.includes('Khóa gia hạn')) ||
                            (sess.content && sess.content.includes('Lộ trình gia hạn')) ||
                            (sess.stt > 24 && (sess.stt - 1) % 24 === 0);

                          return (
                            <React.Fragment key={sess.stt}>
                              {isBatchHeader && (
                                <tr className="bg-indigo-50/80 border-y border-indigo-200 font-bold text-indigo-900">
                                  <td colSpan={5} className="py-2 px-4 text-xs">
                                    🌟 BẮT ĐẦU ĐỢT GIA HẠN KHÓA HỌC {sess.note ? `[${sess.note}]` : ''} — TỪ BUỔI #{sess.stt}
                                  </td>
                                </tr>
                              )}
                              <tr className="hover:bg-slate-50/80 transition-colors">
                                {/* STT (Nhỏ gọn) */}
                                <td className="py-2 px-1 text-center font-bold text-slate-600 bg-slate-50/50 border-r border-slate-200 w-12">
                                  {sess.stt}
                                </td>

                                {/* Ngày học */}
                                <td className="py-2 px-2 border-r border-slate-200 text-center w-28">
                                  <input
                                    type="text"
                                    value={sess.date}
                                    onChange={(e) =>
                                      handleUpdateSession(student.id, sess.stt, 'date', e.target.value)
                                    }
                                    placeholder="DD/MM/YYYY"
                                    className="w-full text-center bg-transparent focus:bg-white focus:ring-1 focus:ring-indigo-400 rounded px-1 py-1 text-slate-800 text-xs"
                                  />
                                </td>

                                {/* Nội dung học */}
                                <td className="py-2 px-2.5 border-r border-slate-200 w-60 sm:w-68">
                                  <input
                                    type="text"
                                    value={sess.content}
                                    onChange={(e) =>
                                      handleUpdateSession(student.id, sess.stt, 'content', e.target.value)
                                    }
                                    placeholder="Nhập bài tập, tác phẩm, kỹ thuật..."
                                    className="w-full bg-transparent focus:bg-white focus:ring-1 focus:ring-indigo-400 rounded px-2 py-1 text-slate-800 text-xs"
                                  />
                                </td>

                                {/* Trạng thái (Thu nhỏ gọn gàng: w-24) */}
                                <td className="py-2 px-1.5 border-r border-slate-200 text-center w-24">
                                  <select
                                    value={sess.status}
                                    onChange={(e) =>
                                      handleUpdateSession(
                                        student.id,
                                        sess.stt,
                                        'status',
                                        e.target.value as AttendanceStatus
                                      )
                                    }
                                    className={`w-full text-center py-1 px-1 rounded-md font-bold text-xs border transition-colors cursor-pointer ${
                                      sess.status === 'Học'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                        : sess.status === 'Phép'
                                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                                        : sess.status === 'Vắng'
                                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                                        : 'bg-white text-slate-400 border-slate-200'
                                    }`}
                                  >
                                    <option value="">--</option>
                                    <option value="Học">🟢 Học</option>
                                    <option value="Phép">🟡 Phép</option>
                                    <option value="Vắng">🔴 Vắng</option>
                                  </select>
                                </td>

                                {/* Ghi chú & Nhận xét (Rộng rãi hơn, min-w-[300px]) */}
                                <td className="py-2 px-3 min-w-[300px]">
                                  <input
                                    type="text"
                                    value={sess.note}
                                    onChange={(e) =>
                                      handleUpdateSession(student.id, sess.stt, 'note', e.target.value)
                                    }
                                    placeholder="Nhập nhận xét chi tiết, nhắc nhở, bài tập về nhà..."
                                    className="w-full bg-transparent focus:bg-white focus:ring-1 focus:ring-indigo-400 rounded px-2.5 py-1 text-slate-700 placeholder:text-slate-300 text-xs"
                                  />
                                </td>
                              </tr>
                            </React.Fragment>
                          );
                        })}
                      </tbody>

                      {/* Hàng tổng hợp theo công thức Google Sheets */}
                      <tfoot>
                        <tr className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300">
                          <td colSpan={2} className="py-2.5 px-3 text-center border-r border-slate-200">
                            TỔNG HỢP:
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 text-indigo-900">
                            Đã học: <span className="text-emerald-700">{stats.attended}</span> | Phép:{' '}
                            <span className="text-amber-700">{stats.excused}</span> | Vắng:{' '}
                            <span className="text-rose-700">{stats.unexcused}</span>
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 text-center font-bold text-emerald-800 bg-emerald-50/50">
                            Còn lại: {stats.remaining} buổi
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">Gia hạn nhanh:</span>
                              {EXTENSION_OPTIONS.map((opt) => (
                                <button
                                  key={opt.count}
                                  onClick={() => handleExtendSessions(student.id, opt.count)}
                                  className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 text-xs transition-colors"
                                  title={opt.desc}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal for Deleting Student (Iframe safe, no window.confirm) */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center font-bold">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Xác nhận xóa học viên</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mb-6">
              Bạn có chắc chắn muốn xóa học viên <span className="font-bold text-slate-900">"{studentToDelete.name}"</span>? Toàn bộ lộ trình và 24 buổi học điểm danh sẽ bị loại bỏ khỏi danh sách.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-colors"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem trước & In phiếu học viên (A4) */}
      <StudentPrintModal
        isOpen={Boolean(printingStudent)}
        onClose={() => setPrintingStudent(null)}
        student={printingStudent}
      />
    </div>
  );
};
