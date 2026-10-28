/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User } from 'firebase/auth';
import {
  Music,
  Calendar,
  Users,
  Code2,
  FileSpreadsheet,
  PlusCircle,
  ExternalLink,
  LogOut,
  Sparkles,
  BarChart3,
  GraduationCap,
  BellRing,
  Camera,
  Building2,
  MessageSquare,
} from 'lucide-react';

export type AppTab =
  | 'students'
  | 'schedule'
  | 'teachers'
  | 'teacherManagement'
  | 'branches'
  | 'renewalAlerts'
  | 'charts'
  | 'appsScript'
  | 'sync';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  onOpenAddStudent: () => void;
  onOpenImportImage?: () => void;
  spreadsheetUrl: string | null;
  alertsCount?: number;
  onOpenTeamChat?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogin,
  onLogout,
  isLoggingIn,
  onOpenAddStudent,
  onOpenImportImage,
  spreadsheetUrl,
  alertsCount = 0,
  onOpenTeamChat,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight text-white">
                  Grace Music Class
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Google Sheets System
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Quản lý 5 Bộ môn • Hồ sơ Giáo viên • Tái đăng ký ≤ 3 buổi • TKB Studio
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Import from Image Button */}
            {onOpenImportImage && (
              <button
                onClick={onOpenImportImage}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow cursor-pointer"
                title="Quét hình ảnh sổ học tập / bài học bằng AI Gemini"
              >
                <Camera className="w-4 h-4 text-emerald-200" />
                <span className="hidden sm:inline">Quét ảnh sổ học tập</span>
                <span className="text-[10px] bg-emerald-800/60 px-1.5 py-0.5 rounded font-mono hidden md:inline">AI</span>
              </button>
            )}

            {/* Quick Team Chat / Handover Notes Button */}
            {onOpenTeamChat && (
              <button
                onClick={onOpenTeamChat}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white text-xs sm:text-sm font-semibold transition-all border border-slate-700 shadow-xs cursor-pointer"
                title="Trao đổi nội bộ & bàn giao học viên giữa 2-5 giáo viên"
              >
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">Trao đổi nhóm</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </button>
            )}

            {/* Quick Add Student Button */}
            <button
              onClick={onOpenAddStudent}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-medium transition-all shadow-sm hover:shadow cursor-pointer"
              title="Thêm học viên mới"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Thêm học viên</span>
            </button>

            {/* Google Sheets Link if created */}
            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs sm:text-sm font-medium transition-all"
                title="Mở Google Sheet đã tạo"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span className="hidden md:inline">Mở Google Sheet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {/* Google Account Authentication & Real-time Cloud Sync */}
            {user ? (
              <div className="flex items-center gap-2.5 pl-2.5 border-l border-slate-700">
                <div className="relative">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Google User'}
                      className="w-8 h-8 rounded-full border-2 border-emerald-400 shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold text-white border border-emerald-400">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse"
                    title="Real-time Cloud Sync đang hoạt động"
                  />
                </div>

                <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold text-white truncate max-w-[130px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-300 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Real-time Sync</span>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600/30 border border-rose-500/30 rounded-lg transition-all cursor-pointer"
                  title="Đăng xuất tài khoản Google"
                  aria-label="Đăng xuất tài khoản Google"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-900 text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-lg cursor-pointer border border-slate-200"
                title="Đăng nhập bằng tài khoản Google để đồng bộ dữ liệu thời gian thực trên mọi thiết bị"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isLoggingIn ? 'Đang kết nối...' : 'Đăng nhập với Google'}</span>
                <span className="hidden xl:inline-block px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-indigo-100 text-indigo-700">
                  Cloud Sync
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto py-2 border-t border-slate-800 scrollbar-none text-xs sm:text-sm">
          {/* Tab 1: Học viên & 5 Bộ môn */}
          <button
            onClick={() => setActiveTab('students')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'students'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Học viên (8/24/36 Buổi)</span>
          </button>

          {/* Tab 2: Nhắc nhở Tái Đăng ký (<= 3 buổi) with Badge */}
          <button
            onClick={() => setActiveTab('renewalAlerts')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'renewalAlerts'
                ? 'bg-amber-500/30 text-amber-200 border border-amber-400/50 shadow-xs'
                : 'text-amber-300/90 hover:text-amber-100 hover:bg-amber-950/40'
            }`}
          >
            <BellRing className="w-4 h-4 text-amber-400" />
            <span>Nhắc nhở Tái Đăng ký (≤ 3 buổi)</span>
            {alertsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                {alertsCount}
              </span>
            )}
          </button>

          {/* Tab 3: Quản lý Thông tin Giáo viên */}
          <button
            onClick={() => setActiveTab('teacherManagement')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'teacherManagement'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>Quản lý Giáo viên</span>
          </button>

          {/* Tab: Quản lý Cơ sở */}
          <button
            onClick={() => setActiveTab('branches')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'branches'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Cơ sở Đào tạo</span>
          </button>

          {/* Tab 4: Thời khóa biểu */}
          <button
            onClick={() => setActiveTab('schedule')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Thời khóa biểu (T2 - CN)</span>
          </button>

          {/* Tab 5: Lịch dạy Giáo viên */}
          <button
            onClick={() => setActiveTab('teachers')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'teachers'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Lịch dạy Giáo viên</span>
          </button>

          {/* Tab 6: Biểu đồ Recharts */}
          <button
            onClick={() => setActiveTab('charts')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'charts'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Biểu đồ Studio</span>
          </button>

          {/* Tab 7: Đồng bộ Sheets */}
          <button
            onClick={() => setActiveTab('sync')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'sync'
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Đồng bộ Google Sheets</span>
          </button>

          {/* Tab 8: Apps Script */}
          <button
            onClick={() => setActiveTab('appsScript')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'appsScript'
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Mã Apps Script</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
