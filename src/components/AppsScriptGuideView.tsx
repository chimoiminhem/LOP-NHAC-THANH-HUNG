/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GOOGLE_APPS_SCRIPT_CODE } from '../utils/googleAppsScriptGenerator';
import {
  Code2,
  Copy,
  Check,
  Download,
  BookOpen,
  Terminal,
  ExternalLink,
  Zap,
} from 'lucide-react';

export const AppsScriptGuideView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleDownloadFile = () => {
    const blob = new Blob([GOOGLE_APPS_SCRIPT_CODE], {
      type: 'text/javascript;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'LopNhac_Automation.gs';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-amber-400 text-slate-950">
                <Code2 className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold">Mã Google Apps Script & Menu Tùy chỉnh [🎵 Lớp Nhạc]</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Mã nguồn chuẩn Google Apps Script tối ưu hóa đầy đủ: Quản lý Thông tin Giáo viên, Nhắc nhở Tái Đăng ký (còn ≤ 3 buổi),
              5 Sheet bộ môn (gói 8/24/36 buổi), Data Validation (Học / Phép / Vắng), tự động cập nhật TKB & Lịch dạy GV, gia hạn nhanh +8, +24, +36 buổi.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyCode}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md ${
                copied
                  ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                  : 'bg-white text-slate-900 hover:bg-slate-100'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Đã sao chép mã!' : 'Sao chép toàn bộ mã'}</span>
            </button>

            <button
              onClick={handleDownloadFile}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-medium border border-slate-700 transition-colors"
              title="Tải file .gs về máy"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Tải file .gs</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5-Step Visual Tutorial */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span>Hướng dẫn 5 bước cài đặt Menu [🎵 Lớp Nhạc] vào Google Sheets:</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h4 className="text-xs font-bold text-slate-800">Mở Google Sheets</h4>
            <p className="text-[11px] text-slate-500">
              Mở trang tính Google Sheets của bạn hoặc tạo một trang tính mới tinh trên Google Drive.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h4 className="text-xs font-bold text-slate-800">Mở Apps Script</h4>
            <p className="text-[11px] text-slate-500">
              Trên thanh menu Google Sheets, chọn: <br />
              <span className="font-semibold text-slate-700">Tiện ích mở rộng</span> →{' '}
              <span className="font-semibold text-indigo-600">Apps Script</span>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
              3
            </span>
            <h4 className="text-xs font-bold text-slate-800">Dán mã nguồn</h4>
            <p className="text-[11px] text-slate-500">
              Xóa sạch nội dung cũ trong file <code className="text-indigo-600">Code.gs</code>, dán toàn bộ đoạn mã bên dưới vào.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
              4
            </span>
            <h4 className="text-xs font-bold text-slate-800">Lưu & Tải lại</h4>
            <p className="text-[11px] text-slate-500">
              Nhấn biểu tượng <span className="font-semibold">Lưu (Ctrl + S)</span>. Sau đó quay lại Google Sheets và nhấn{' '}
              <span className="font-semibold">F5 (Tải lại trang)</span>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
              5
            </span>
            <h4 className="text-xs font-bold text-emerald-900">Bấm Menu [Lớp Nhạc]</h4>
            <p className="text-[11px] text-emerald-700">
              Menu tùy chỉnh <span className="font-bold">[🎵 Lớp Nhạc]</span> sẽ xuất hiện! Nhấn chọn "🚀 Khởi tạo toàn bộ Hệ thống" là xong!
            </p>
          </div>
        </div>
      </div>

      {/* Custom Menu Feature Overview */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Danh sách các chức năng trong Menu tùy chỉnh [🎵 Lớp Nhạc]:</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="font-bold text-slate-900">🚀 1. Khởi tạo toàn bộ Hệ thống Lớp Nhạc</p>
            <p className="text-slate-500 mt-1">
              Tạo tự động 5 sheet Piano, Guitar, Ukulele, Bass, Electric Guitar + Thời khóa biểu + Lịch dạy Giáo viên với định dạng chuyên nghiệp.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="font-bold text-slate-900">➕ 2. Gia hạn +8, +24, +36 buổi học linh hoạt</p>
            <p className="text-slate-500 mt-1">
              Hỗ trợ 3 gói gia hạn: <strong>+8 buổi</strong> (1 tháng), <strong>+24 buổi</strong> (tiêu chuẩn), <strong>+36 buổi</strong> (nâng cao), hoặc tự nhập số buổi tùy ý.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="font-bold text-slate-900">📅 3. Cập nhật Thời khóa biểu tự động</p>
            <p className="text-slate-500 mt-1">
              Quét toàn bộ cột "Lịch học đăng ký" từ các sheet bộ môn để tự động điền thẻ học viên vào ô tương ứng trong tuần (T2 - CN).
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="font-bold text-slate-900">👨‍🏫 4. Cập nhật Lịch dạy Giáo viên</p>
            <p className="text-slate-500 mt-1">
              Tổng hợp phân công giảng dạy cho từng giáo viên theo ca học và danh sách học viên theo học.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="font-bold text-slate-900">🎨 5. Khôi phục Data Validation</p>
            <p className="text-slate-500 mt-1">
              Cài đặt lại menu thả xuống (Học, Phép, Vắng) nếu người dùng lỡ tay xóa hoặc ghi đè dữ liệu.
            </p>
          </div>
          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200">
            <p className="font-bold text-indigo-950">✨ Điểm nổi bật</p>
            <p className="text-indigo-800 mt-1">
              Mã chuẩn Google Apps Script JavaScript ES6+, tối ưu hóa tốc độ xử lý Batch Range, không giật lag.
            </p>
          </div>
        </div>
      </div>

      {/* Code Container */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-xs text-slate-300 font-bold">LopNhac_Automation.gs</span>
            <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
              Google Apps Script • 350+ dòng
            </span>
          </div>

          <button
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã chép' : 'Sao chép mã'}</span>
          </button>
        </div>

        <div className="p-4 max-h-[500px] overflow-y-auto">
          <pre className="font-mono text-xs text-slate-200 leading-relaxed whitespace-pre selection:bg-indigo-600 selection:text-white">
            {GOOGLE_APPS_SCRIPT_CODE}
          </pre>
        </div>
      </div>
    </div>
  );
};
