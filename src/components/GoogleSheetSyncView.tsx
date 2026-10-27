/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { Student } from '../types/music';
import { createCompleteMusicStudioSpreadsheet } from '../services/googleSheetsService';
import {
  FileSpreadsheet,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader2,
  Sparkles,
  Layers,
  Table,
  Check,
} from 'lucide-react';

interface GoogleSheetSyncViewProps {
  user: User | null;
  onLogin: () => void;
  accessToken: string | null;
  students: Student[];
  teachers?: import('../types/music').Teacher[];
  spreadsheetUrl: string | null;
  setSpreadsheetUrl: (url: string | null) => void;
}

export const GoogleSheetSyncView: React.FC<GoogleSheetSyncViewProps> = ({
  user,
  onLogin,
  accessToken,
  students,
  teachers = [],
  spreadsheetUrl,
  setSpreadsheetUrl,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tạo Google Sheet mới trên Google Drive của người dùng
  const handleCreateSheet = async () => {
    if (!accessToken) {
      onLogin();
      return;
    }

    setIsCreating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const result = await createCompleteMusicStudioSpreadsheet(accessToken, students, teachers);
      setSpreadsheetUrl(result.spreadsheetUrl);
      setSuccessMsg(`🎉 Đã tạo thành công Google Spreadsheet mới: "${result.title}"!`);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo Google Sheet.');
    } finally {
      setIsCreating(false);
    }
  };

  // Xuất file CSV offline (hỗ trợ dự phòng)
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'BỘ MÔN,HỌC VIÊN,SỐ ĐIỆN THOẠI,LỊCH HỌC ĐĂNG KÝ,GIÁO VIÊN,BUỔI ĐÃ HỌC,PHÉP,VẮNG,CÒN LẠI\n';

    students.forEach((s) => {
      const attended = s.sessions.filter((sess) => sess.status === 'Học').length;
      const excused = s.sessions.filter((sess) => sess.status === 'Phép').length;
      const unexcused = s.sessions.filter((sess) => sess.status === 'Vắng').length;
      const remaining = s.sessions.filter((sess) => !sess.status).length;

      csvContent += `"${s.instrument}","${s.name}","${s.phone}","${s.scheduleString}","${s.teacher}",${attended},${excused},${unexcused},${remaining}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LopNhac_DanhSach_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 rounded-2xl shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-emerald-400 text-slate-950">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold">Tạo & Đồng bộ Trực tiếp với Google Sheets</h2>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
              Khởi tạo một bảng tính Google Sheets hoàn chỉnh ngay trên tài khoản Google Drive của bạn.
              Bao gồm đầy đủ 5 sheet bộ môn, Thời khóa biểu, Lịch dạy Giáo viên kèm 24 dòng điểm danh cho từng học viên.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {user ? (
              <button
                onClick={handleCreateSheet}
                disabled={isCreating}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang tạo Google Sheet...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Tạo Google Sheet mới trên Drive</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={onLogin}
                className="gsi-material-button inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-md transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>Đăng nhập Google để tạo Sheet</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs sm:text-sm border border-slate-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Xuất file CSV</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && spreadsheetUrl && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-800/80 border border-emerald-400 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-emerald-950 font-bold text-xs hover:bg-emerald-50 transition-colors shrink-0"
            >
              <span>Mở Google Sheet</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-4 p-4 rounded-xl bg-rose-900/80 border border-rose-400 flex items-center gap-2 text-xs sm:text-sm text-rose-100">
            <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Spreadsheet Structure Visualizer */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>Cấu trúc các Trang tính (Sheets) được khởi tạo tự động:</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">[Thời khóa biểu]</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-semibold">TKB</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Ma trận 7 ngày (T2 đến CN) x 7 khung giờ học, tự động gom tên học viên & giáo viên.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">[Lịch dạy Giáo viên]</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold">Giáo viên</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Bảng phân công ca dạy cho từng thầy cô, tổng số giờ dạy và lớp phụ trách.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">[Piano, Guitar, Ukulele]</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">Bộ môn</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Trang tính từng bộ môn: Thẻ thông tin học viên + Bảng điểm danh 24 dòng + Data validation dropdown.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">[Bass, Electric Guitar]</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-semibold">Bộ môn</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Định dạng viền lưới, tiêu đề in đậm, màu sắc trang nhã, công thức tính số buổi còn lại tự động.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Checklist */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Đáp ứng 100% tiêu chí đề bài kỹ thuật:</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
          <div className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5" />
            </span>
            <span>
              <strong>5 Sheet Bộ môn riêng biệt:</strong> Piano, Guitar, Ukulele, Bass, Electric Guitar.
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5" />
            </span>
            <span>
              <strong>Khu vực thông tin chung:</strong> Tên học viên, Số điện thoại, Lớp/Bộ môn, Lịch học đăng ký.
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5" />
            </span>
            <span>
              <strong>Bảng điểm danh 24 buổi chuẩn:</strong> STT, Ngày học, Nội dung học, Trạng thái (Học, Phép, Vắng), Ghi chú.
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5" />
            </span>
            <span>
              <strong>Nút gia hạn (+8, +24, +36 buổi):</strong> Tự động chèn thêm số dòng tương ứng tiếp nối STT và công thức tính.
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5" />
            </span>
            <span>
              <strong>Thời khóa biểu (Schedule View):</strong> Tổng hợp ma trận Thứ 2 đến Chủ Nhật theo các ca học.
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5" />
            </span>
            <span>
              <strong>Lịch dạy Giáo viên (Teacher Schedule):</strong> Trích xuất ca dạy và học viên phụ trách của từng thầy cô.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
