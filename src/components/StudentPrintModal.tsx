/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Student } from '../types/music';
import { calculateAttendanceStats } from '../utils/scheduleParser';
import { Printer, X, FileText, CheckCircle2, Music } from 'lucide-react';

interface StudentPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export const StudentPrintModal: React.FC<StudentPrintModalProps> = ({
  isOpen,
  onClose,
  student,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('print-student-active');
    } else {
      document.body.classList.remove('print-student-active');
    }
    return () => {
      document.body.classList.remove('print-student-active');
    };
  }, [isOpen]);

  if (!isOpen || !student) return null;

  const stats = calculateAttendanceStats(student.sessions);
  const printDate = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  // Nội dung phiếu theo dõi chuẩn khổ A4 dùng chung cho Xem trước trên màn hình & In ra giấy
  const renderPrintContent = (isPaperPrint = false) => (
    <div
      className={`student-print-sheet bg-white text-slate-900 text-xs w-full max-w-3xl ${
        isPaperPrint ? 'p-0 shadow-none border-none' : 'p-8 sm:p-10 rounded-xl shadow-xs border border-slate-200'
      }`}
    >
      {/* Header: Trung tâm & Tiêu đề phiếu */}
      <div className="border-b-2 border-slate-900 pb-4 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
                <Music className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="font-extrabold text-sm sm:text-base tracking-wider uppercase text-slate-900">
                GRACE MUSIC CLASS
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              Hệ thống Đào tạo Âm nhạc Chuyên nghiệp • Hotline: 0902391605
            </p>
            <p className="text-[10px] text-slate-500">
              Cơ sở: {student.branch || 'Trụ sở chính - Quận 1, TP. Hồ Chí Minh'}
            </p>
          </div>

          <div className="text-right">
            <div className="inline-block border border-slate-400 px-3 py-1 rounded bg-slate-50 text-[10px] font-mono">
              Mã HV: <strong className="font-bold">{student.id.toUpperCase()}</strong>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Ngày in: <strong>{printDate}</strong>
            </p>
          </div>
        </div>

        {/* Main Title */}
        <div className="text-center mt-3">
          <h1 className="text-lg sm:text-xl font-black uppercase tracking-wide text-slate-900">
            PHIẾU THEO DÕI HỌC TẬP & ĐIỂM DANH HỌC VIÊN
          </h1>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">
            Bộ môn: <span className="underline decoration-indigo-500 decoration-2 font-bold">{student.instrument}</span> • Gói học: <span className="font-bold">{student.packageType || '24 buổi'}</span> • Trạng thái: <span className="font-bold text-slate-900">{student.status || 'Đang học'}</span>
          </p>
        </div>
      </div>

      {/* Thông tin học viên & Lớp học */}
      <div className="bg-slate-50 border border-slate-300 rounded-lg p-3.5 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Họ Tên học viên:</span>
            <strong className="text-sm font-extrabold text-slate-900">{student.name}</strong>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Trạng thái:</span>
            <span className="font-bold text-slate-800">{student.status || 'Đang học'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Số điện thoại:</span>
            <span className="font-mono font-bold text-slate-800">{student.phone}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Giáo viên phụ trách:</span>
            <strong className="text-slate-800">{student.teacher || 'Chưa phân công'}</strong>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Phòng học:</span>
            <span className="text-slate-800 font-medium">{student.room || 'Phòng Grand Piano 1'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2.5 pt-2.5 border-t border-slate-200 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Lịch học đăng ký hàng tuần:</span>
            <span className="font-bold text-indigo-900">{student.scheduleString}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Tiến độ khóa học:</span>
            <span className="font-bold text-slate-800">
              Đã học: <span className="text-emerald-700">{stats.attended}</span> | Phép: <span className="text-amber-700">{stats.excused}</span> | Vắng: <span className="text-rose-700">{stats.unexcused}</span> | Còn lại: <span className="underline">{stats.remaining}/{stats.total} buổi</span>
            </span>
          </div>
        </div>
        {student.notes && (
          <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600 italic">
            <strong>Ghi chú học viên:</strong> {student.notes}
          </div>
        )}
      </div>

      {/* Bảng lộ trình và điểm danh chi tiết */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
            CHI TIẾT LỘ TRÌNH & ĐIỂM DANH ({student.sessions.length} BUỔI HỌC)
          </h3>
          <span className="text-[10px] text-slate-500">
            (Ký nhận từng buổi học hoặc sau mỗi bài kiểm tra)
          </span>
        </div>

        <table className="w-full text-[10.5px] border-collapse border border-slate-400">
          <thead>
            <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400 text-center">
              <th className="py-1.5 px-1 w-10 border-r border-slate-400">STT</th>
              <th className="py-1.5 px-2 w-24 border-r border-slate-400">Ngày học</th>
              <th className="py-1.5 px-3 text-left border-r border-slate-400">Nội dung bài học & Kỹ thuật</th>
              <th className="py-1.5 px-1.5 w-20 border-r border-slate-400">Điểm danh</th>
              <th className="py-1.5 px-3 text-left border-r border-slate-400">Nhận xét của giáo viên</th>
              <th className="py-1.5 px-1.5 w-16 text-center">Ký nhận</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {student.sessions.map((sess) => {
              const isBatchHeader =
                (sess.note && sess.note.includes('Khóa gia hạn')) ||
                (sess.content && sess.content.includes('Lộ trình gia hạn')) ||
                (sess.stt > 24 && (sess.stt - 1) % 24 === 0);

              return (
                <React.Fragment key={sess.stt}>
                  {isBatchHeader && (
                    <tr className="bg-slate-100 font-bold text-slate-800 border-y border-slate-400">
                      <td colSpan={6} className="py-1 px-3 text-[10px] uppercase">
                        ★ ĐỢT GIA HẠN KHÓA HỌC {sess.note ? `[${sess.note}]` : ''} — BẮT ĐẦU TỪ BUỔI #{sess.stt}
                      </td>
                    </tr>
                  )}
                  <tr className="border-b border-slate-300 page-break-inside-avoid">
                    <td className="py-1 px-1 text-center font-bold text-slate-700 border-r border-slate-400 bg-slate-50/50">
                      {sess.stt}
                    </td>
                    <td className="py-1 px-2 text-center border-r border-slate-400 font-mono text-[10px]">
                      {sess.date || '—'}
                    </td>
                    <td className="py-1 px-3 border-r border-slate-400 font-medium text-slate-900">
                      {sess.content || <span className="text-slate-400 italic">Chưa cập nhật nội dung</span>}
                    </td>
                    <td className="py-1 px-1.5 text-center border-r border-slate-400 font-bold text-[10px]">
                      {sess.status === 'Học' && (
                        <span className="text-emerald-800 font-extrabold">Học (✓)</span>
                      )}
                      {sess.status === 'Phép' && (
                        <span className="text-amber-800 font-extrabold">Phép (P)</span>
                      )}
                      {sess.status === 'Vắng' && (
                        <span className="text-rose-800 font-extrabold">Vắng (V)</span>
                      )}
                      {!sess.status && (
                        <span className="text-slate-400 font-normal">—</span>
                      )}
                    </td>
                    <td className="py-1 px-3 border-r border-slate-400 text-slate-700 text-[10px]">
                      {sess.note || ''}
                    </td>
                    <td className="py-1 px-1.5 text-center text-slate-300">
                      {/* Khoảng trống ký tên */}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Quy định & Chữ ký xác nhận */}
      <div className="pt-2 border-t border-slate-300 text-[10px] text-slate-600 page-break-inside-avoid">
        <div className="mb-3 space-y-0.5">
          <p><strong>Lưu ý đối với học viên & phụ huynh:</strong></p>
          <p>• Xin nghỉ phép trước ít nhất 12 giờ để trung tâm sắp xếp lịch học bù phù hợp.</p>
          <p>• Học viên tích cực luyện tập tại nhà theo nhận xét của giáo viên để đạt kết quả tốt nhất.</p>
        </div>

        <div className="grid grid-cols-2 text-center mt-4 pt-1">
          <div>
            <p className="font-bold text-slate-800 uppercase">HỌC VIÊN / PHỤ HUYNH</p>
            <p className="text-[10px] text-slate-400 italic mt-0.5">(Ký và ghi rõ họ tên)</p>
            <div className="h-14"></div>
          </div>
          <div>
            <p className="font-bold text-slate-800 uppercase">GIÁO VIÊN BỘ MÔN</p>
            <p className="text-[10px] text-slate-400 italic mt-0.5">(Ký và xác nhận)</p>
            <div className="h-14 flex items-end justify-center">
              <span className="font-semibold text-slate-700">{student.teacher || 'Giáo viên bộ môn'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Màn hình Xem trước Modal (Hiển thị khi duyệt app) */}
      <div
        className="no-print fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-white shadow-md">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">
                    Xem trước & In phiếu theo dõi học tập
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    Khổ giấy A4
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Phiếu giấy theo dõi học viên {student.name} ({student.instrument}) kèm lịch sử điểm danh & lộ trình
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                title="Mở hộp thoại in ấn của trình duyệt"
              >
                <Printer className="w-4 h-4" />
                <span>In phiếu ngay (Ctrl+P)</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Đóng cửa sổ xem trước"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Preview Body */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-100 flex justify-center">
            {renderPrintContent(false)}
          </div>

          {/* Modal Footer */}
          <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Đã định dạng tối ưu cho in ấn khổ A4, tự động căn lề và ẩn thanh công cụ.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>In ra giấy (Print)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Phiếu in chuyên biệt gắn thẳng vào DOM Body qua createPortal phục vụ máy in */}
      {createPortal(
        <div id="print-sheet-root">
          {renderPrintContent(true)}
        </div>,
        document.body
      )}
    </>
  );
};
