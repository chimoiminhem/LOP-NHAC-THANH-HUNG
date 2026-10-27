/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { AttendanceSession, Branch, InstrumentType, PackageType, Student, Teacher } from './types/music';
import { INITIAL_STUDENTS } from './data/sampleStudents';
import { INITIAL_TEACHERS } from './data/initialTeachers';
import { INITIAL_BRANCH_LIST } from './data/initialBranches';
import {
  getRenewalAlerts,
  mergeSessions,
  createDefaultSessions,
  ImportMergeStrategy,
} from './utils/scheduleParser';
import { initAuth, googleSignIn, logout } from './services/authService';
import {
  subscribeToUserStudents,
  subscribeToUserTeachers,
  subscribeToUserBranches,
  subscribeToUserSettings,
  saveStudentToFirestore,
  deleteStudentFromFirestore,
  saveTeacherToFirestore,
  deleteTeacherFromFirestore,
  saveBranchToFirestore,
  deleteBranchFromFirestore,
  saveSettingsToFirestore,
  seedInitialUserStudioDataIfEmpty,
  updateStudioMemberPresence,
  detectDeviceType,
  SHARED_STUDIO_ID,
} from './services/firestoreSyncService';
import { Navbar, AppTab } from './components/Navbar';
import { DepartmentStudentView } from './components/DepartmentStudentView';
import { ScheduleView } from './components/ScheduleView';
import { TeacherScheduleView } from './components/TeacherScheduleView';
import { TeacherManagementView } from './components/TeacherManagementView';
import { BranchManagementView } from './components/BranchManagementView';
import { RenewalAlertsView } from './components/RenewalAlertsView';
import { AppsScriptGuideView } from './components/AppsScriptGuideView';
import { GoogleSheetSyncView } from './components/GoogleSheetSyncView';
import { AddStudentModal } from './components/AddStudentModal';
import { ImportSessionsImageModal } from './components/ImportSessionsImageModal';
import { StudioAnalyticsCharts } from './components/StudioAnalyticsCharts';
import { TeamChatDrawer } from './components/TeamChatDrawer';
import {
  Music,
  Users,
  Calendar,
  Sparkles,
  FileSpreadsheet,
  Code2,
  CheckCircle,
  BarChart3,
  GraduationCap,
  BellRing,
  Building2,
  Cloud,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export default function App() {
  // Students, teachers, branches state
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCH_LIST);

  // Real-time Cloud Sync states
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AppTab>('students');

  // Bộ môn đang xem và học viên được làm nổi bật từ Thời khóa biểu
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>('Piano');
  const [highlightedStudentId, setHighlightedStudentId] = useState<string | null>(null);

  // Google Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(null);

  // Add/Edit Student Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [defaultInstrumentForModal, setDefaultInstrumentForModal] = useState<InstrumentType>('Piano');

  // Import Sessions via Image Modal state
  const [isImportImageModalOpen, setIsImportImageModalOpen] = useState(false);
  const [importTargetStudentId, setImportTargetStudentId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Team Chat / Handover Notes state for 2-5 users
  const [isTeamChatOpen, setIsTeamChatOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Số lượng học viên cần cảnh báo tái đăng ký (còn <= 3 buổi)
  const alertsCount = useMemo(() => {
    return getRenewalAlerts(students).length;
  }, [students]);

  // Khởi tạo Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Đồng bộ Firestore thời gian thực trên Shared Studio Workspace (Tất cả 2-5 thiết bị PC, Phone, iPad cùng thấy)
  useEffect(() => {
    setIsCloudSyncing(true);
    setSyncError(null);

    let unsubStudents: (() => void) | null = null;
    let unsubTeachers: (() => void) | null = null;
    let unsubBranches: (() => void) | null = null;
    let unsubSettings: (() => void) | null = null;

    const setupSync = async () => {
      try {
        // Nạp dữ liệu ban đầu vào Shared Studio nếu chưa có
        try {
          await seedInitialUserStudioDataIfEmpty(
            SHARED_STUDIO_ID,
            INITIAL_STUDENTS,
            INITIAL_TEACHERS,
            INITIAL_BRANCH_LIST
          );
        } catch (seedErr) {
          console.warn('Seed initial data notice:', seedErr);
        }

        // 1. Lắng nghe real-time Học viên cho toàn nhóm thiết bị
        unsubStudents = subscribeToUserStudents(
          SHARED_STUDIO_ID,
          (remoteStudents) => {
            if (remoteStudents.length > 0) {
              setStudents(remoteStudents);
            }
            setIsCloudSyncing(false);
            setLastSyncedTime(new Date());
          },
          (err) => {
            console.error('Students sync error:', err);
            setSyncError('Không thể đồng bộ học viên từ Firestore');
            setIsCloudSyncing(false);
          }
        );

        // 2. Lắng nghe real-time Giáo viên
        unsubTeachers = subscribeToUserTeachers(
          SHARED_STUDIO_ID,
          (remoteTeachers) => {
            if (remoteTeachers.length > 0) {
              setTeachers(remoteTeachers);
            }
            setLastSyncedTime(new Date());
          },
          (err) => {
            console.error('Teachers sync error:', err);
          }
        );

        // 3. Lắng nghe real-time Cơ sở
        unsubBranches = subscribeToUserBranches(
          SHARED_STUDIO_ID,
          (remoteBranches) => {
            if (remoteBranches.length > 0) {
              setBranches(remoteBranches);
            }
            setLastSyncedTime(new Date());
          },
          (err) => {
            console.error('Branches sync error:', err);
          }
        );

        // 4. Lắng nghe real-time Cài đặt Studio (Google Sheet URL...)
        unsubSettings = subscribeToUserSettings(
          SHARED_STUDIO_ID,
          (settings) => {
            if (settings.spreadsheetUrl) {
              setSpreadsheetUrl(settings.spreadsheetUrl);
            }
          }
        );
      } catch (error) {
        console.error('Error initializing Firestore real-time sync:', error);
        setSyncError('Lỗi kết nối cơ sở dữ liệu Firestore');
        setIsCloudSyncing(false);
      }
    };

    setupSync();

    return () => {
      if (unsubStudents) unsubStudents();
      if (unsubTeachers) unsubTeachers();
      if (unsubBranches) unsubBranches();
      if (unsubSettings) unsubSettings();
    };
  }, []);

  // Cập nhật sự hiện diện online của thành viên khi đăng nhập
  useEffect(() => {
    if (user) {
      updateStudioMemberPresence({
        userId: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Giáo viên',
        email: user.email || '',
        photoURL: user.photoURL || '',
        device: detectDeviceType(),
        lastSeen: new Date().toISOString(),
      });
    }
  }, [user]);

  // Khi đổi tên một cơ sở, tự động đồng bộ tên mới vào hồ sơ học viên và giáo viên
  const handleUpdateBranchNameInRecords = (oldName: string, newName: string) => {
    const updatedStudents = students.map((s) => (s.branch === oldName ? { ...s, branch: newName } : s));
    const updatedTeachers = teachers.map((t) => (t.branch === oldName ? { ...t, branch: newName } : t));
    setStudents(updatedStudents);
    setTeachers(updatedTeachers);

    updatedStudents.filter((s) => s.branch === newName).forEach((s) => saveStudentToFirestore(SHARED_STUDIO_ID, s));
    updatedTeachers.filter((t) => t.branch === newName).forEach((t) => saveTeacherToFirestore(SHARED_STUDIO_ID, t));
  };

  // Khi xóa một cơ sở, chuyển toàn bộ học viên và giáo viên của cơ sở đó sang cơ sở thay thế (fallback)
  const handleDeleteBranchInRecords = (deletedBranchName: string, fallbackBranchName: string) => {
    const updatedStudents = students.map((s) => (s.branch === deletedBranchName ? { ...s, branch: fallbackBranchName } : s));
    const updatedTeachers = teachers.map((t) => (t.branch === deletedBranchName ? { ...t, branch: fallbackBranchName } : t));
    setStudents(updatedStudents);
    setTeachers(updatedTeachers);

    updatedStudents.filter((s) => s.branch === fallbackBranchName).forEach((s) => saveStudentToFirestore(SHARED_STUDIO_ID, s));
    updatedTeachers.filter((t) => t.branch === fallbackBranchName).forEach((t) => saveTeacherToFirestore(SHARED_STUDIO_ID, t));
  };

  // Mutation handlers trực tiếp lên Shared Studio Firestore
  const handlePersistStudent = async (student: Student) => {
    try {
      await saveStudentToFirestore(SHARED_STUDIO_ID, student);
      setLastSyncedTime(new Date());
    } catch (err) {
      console.error('Failed to sync student to Firestore:', err);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    try {
      await deleteStudentFromFirestore(SHARED_STUDIO_ID, studentId);
      setLastSyncedTime(new Date());
    } catch (err) {
      console.error('Failed to delete student from Firestore:', err);
    }
  };

  const handlePersistTeacher = async (teacher: Teacher) => {
    try {
      await saveTeacherToFirestore(SHARED_STUDIO_ID, teacher);
      setLastSyncedTime(new Date());
    } catch (err) {
      console.error('Failed to sync teacher to Firestore:', err);
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== teacherId));
    try {
      await deleteTeacherFromFirestore(SHARED_STUDIO_ID, teacherId);
      setLastSyncedTime(new Date());
    } catch (err) {
      console.error('Failed to delete teacher from Firestore:', err);
    }
  };

  const handlePersistBranch = async (branch: Branch) => {
    try {
      await saveBranchToFirestore(SHARED_STUDIO_ID, branch);
      setLastSyncedTime(new Date());
    } catch (err) {
      console.error('Failed to sync branch to Firestore:', err);
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    setBranches((prev) => prev.filter((b) => b.id !== branchId));
    try {
      await deleteBranchFromFirestore(SHARED_STUDIO_ID, branchId);
      setLastSyncedTime(new Date());
    } catch (err) {
      console.error('Failed to delete branch from Firestore:', err);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        showToast(`🎉 Đã đăng nhập tài khoản Google thành công! Đang kích hoạt đồng bộ đám mây...`);
      }
    } catch (err) {
      console.error('Login failed:', err);
      showToast('Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setStudents(INITIAL_STUDENTS);
    setTeachers(INITIAL_TEACHERS);
    setBranches(INITIAL_BRANCH_LIST);
    setLastSyncedTime(null);
    showToast('Đã đăng xuất tài khoản Google.');
  };

  const handleOpenAddStudent = (defaultInst: InstrumentType = 'Piano') => {
    setEditingStudent(null);
    setDefaultInstrumentForModal(defaultInst);
    setIsAddModalOpen(true);
  };

  const handleOpenEditStudent = (student: Student) => {
    setEditingStudent(student);
    setDefaultInstrumentForModal(student.instrument);
    setIsAddModalOpen(true);
  };

  const handleOpenImportImage = (student?: Student) => {
    if (student) {
      setImportTargetStudentId(student.id);
      setSelectedInstrument(student.instrument);
    } else {
      const firstInDept = students.find((s) => s.instrument === selectedInstrument);
      setImportTargetStudentId(firstInDept ? firstInDept.id : students[0]?.id || null);
    }
    setIsImportImageModalOpen(true);
  };

  const handleApplyImportedSessions = (
    targetStudentId: string,
    importedSessions: AttendanceSession[],
    strategy: ImportMergeStrategy,
    newStudentData?: Partial<Student>
  ) => {
    if (targetStudentId === 'new' && newStudentData) {
      const instrument = newStudentData.instrument || selectedInstrument || 'Piano';
      const count = importedSessions.length > 24 ? 36 : importedSessions.length > 8 ? 24 : 8;
      const baseSessions = createDefaultSessions(count);
      const merged = mergeSessions(baseSessions, importedSessions, strategy);

      const newStudent: Student = {
        id: `student-${Date.now()}`,
        name: newStudentData.name || 'Học viên mới',
        phone: newStudentData.phone || '0900000000',
        instrument,
        packageType: `${count} buổi` as PackageType,
        scheduleString: 'Thứ 2, Thứ 4 (18:00 - 19:30)',
        teacher: 'Thầy Hoàng Piano',
        branch: 'Cơ sở 1 - Quận 1 (Trụ sở chính)',
        room: 'Phòng 101',
        startDate: new Date().toISOString().slice(0, 10),
        notes: 'Nhập tự động từ ảnh sổ học tập (AI Gemini 3.8 Flash)',
        feeStatus: 'Đã đóng',
        status: 'Đang học',
        sessions: merged,
      };

      setStudents((prev) => [newStudent, ...prev]);
      saveStudentToFirestore(SHARED_STUDIO_ID, newStudent);
      setLastSyncedTime(new Date());
      setSelectedInstrument(instrument);
      handleNavigateToStudentDetail(newStudent.id);
      showToast(
        `🎉 Đã tạo thành công học viên mới "${newStudent.name}" với ${importedSessions.length} buổi học từ hình ảnh!`
      );
    } else {
      let updatedStudent: Student | null = null;
      setStudents((prev) =>
        prev.map((s) => {
          if (s.id !== targetStudentId) return s;
          const merged = mergeSessions(s.sessions, importedSessions, strategy);
          updatedStudent = { ...s, sessions: merged };
          return updatedStudent;
        })
      );
      if (updatedStudent) {
        saveStudentToFirestore(SHARED_STUDIO_ID, updatedStudent);
        setLastSyncedTime(new Date());
      }
      const targetStudent = students.find((s) => s.id === targetStudentId);
      if (targetStudent) {
        setSelectedInstrument(targetStudent.instrument);
        handleNavigateToStudentDetail(targetStudent.id);
        showToast(
          `🎉 Đã cập nhật thành công ${importedSessions.length} buổi học vào sổ của "${targetStudent.name}"!`
        );
      }
    }
  };

  const handleSaveStudent = async (data: Partial<Student>) => {
    let savedStudent: Student;
    if (editingStudent) {
      // Cập nhật học viên
      savedStudent = { ...editingStudent, ...data } as Student;
      setStudents((prev) =>
        prev.map((s) => (s.id === editingStudent.id ? savedStudent : s))
      );
    } else {
      // Thêm mới học viên
      savedStudent = {
        id: `student-${Date.now()}`,
        name: data.name || 'Học viên mới',
        phone: data.phone || '',
        instrument: data.instrument || 'Piano',
        packageType: data.packageType || '24 buổi',
        scheduleString: data.scheduleString || 'Thứ 2, Thứ 4 (18:00 - 19:30)',
        teacher: data.teacher || 'Thầy Hoàng Piano',
        branch: data.branch || 'Cơ sở 1 - Quận 1 (Trụ sở chính)',
        room: data.room || 'Phòng 101',
        startDate: data.startDate || new Date().toISOString().slice(0, 10),
        notes: data.notes || '',
        feeStatus: 'Đã đóng',
        status: data.status || 'Đang học',
        sessions: data.sessions || [],
      };
      setStudents((prev) => [savedStudent, ...prev]);
    }

    try {
      await saveStudentToFirestore(SHARED_STUDIO_ID, savedStudent);
      setLastSyncedTime(new Date());
    } catch (err) {
      console.error('Failed to save student to Firestore:', err);
    }
  };

  const handleSetSpreadsheetUrl = (url: string | null) => {
    setSpreadsheetUrl(url);
    if (url) {
      saveSettingsToFirestore(SHARED_STUDIO_ID, { spreadsheetUrl: url });
    }
  };

  // Điều hướng từ Thời khóa biểu hoặc Nhắc nhở sang thẳng chi tiết & lộ trình học viên
  const handleNavigateToStudentDetail = (studentId: string) => {
    const targetStudent = students.find((s) => s.id === studentId);
    if (targetStudent) {
      setSelectedInstrument(targetStudent.instrument);
    }
    setHighlightedStudentId(studentId);
    setActiveTab('students');

    // Tự động giải phóng trạng thái nhấp nháy sau 4.5 giây
    setTimeout(() => {
      setHighlightedStudentId(null);
    }, 4500);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800 antialiased selection:bg-indigo-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-center gap-2.5 animate-bounce">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Navbar Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLoggingIn={isLoggingIn}
        onOpenAddStudent={() => handleOpenAddStudent(selectedInstrument)}
        onOpenImportImage={() => handleOpenImportImage()}
        spreadsheetUrl={spreadsheetUrl}
        alertsCount={alertsCount}
        onOpenTeamChat={() => setIsTeamChatOpen(true)}
      />

      {/* Real-time Cloud Sync Status Banner (Shared Studio Database across 2-5 devices: PC, Phone, iPad) */}
      <div className="border-b transition-colors shadow-xs bg-gradient-to-r from-emerald-950/90 via-slate-900 to-indigo-950/90 border-emerald-500/30 text-emerald-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-wide">
                {isCloudSyncing ? 'Đang kết nối Firestore...' : 'Đang đồng bộ trực tuyến thời gian thực (Database Online)'}
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/40">
                Nhóm 2–5 thiết bị: PC • Điện thoại • iPad
              </span>
            </div>
            <span className="text-emerald-500/60 hidden sm:inline">•</span>
            <span className="text-emerald-300/90 truncate max-w-xs hidden sm:inline">
              {user ? (
                <span>Tài khoản: <strong className="text-white font-medium">{user.displayName || user.email}</strong></span>
              ) : (
                <span className="text-slate-300">Không gian làm việc chung Studio</span>
              )}
            </span>
            <span className="text-emerald-500/60 hidden md:inline">•</span>
            <span className="text-emerald-300/80 hidden md:inline">
              Mọi thay đổi điểm danh, học viên & giáo viên cập nhật tức thì trên mọi thiết bị
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setIsTeamChatOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-600/80 hover:bg-indigo-600 text-white font-medium text-[11px] transition-colors border border-indigo-400/30 shadow-xs cursor-pointer"
              title="Mở bảng trao đổi nội bộ và bàn giao học viên giữa các giáo viên"
            >
              <span>💬 Trao đổi nhóm</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </button>

            <span className="text-[11px] text-emerald-300/90 font-mono bg-emerald-950/60 px-2 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lastSyncedTime ? `Đồng bộ: ${lastSyncedTime.toLocaleTimeString('vi-VN')}` : 'Online Firestore'}</span>
            </span>

            {!user && (
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-900 font-bold text-[11px] transition-colors shadow-xs cursor-pointer"
              >
                <span>{isLoggingIn ? '...' : 'Đăng nhập Google'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab 1: Học viên & 5 Bộ môn */}
        {activeTab === 'students' && (
          <DepartmentStudentView
            students={students}
            setStudents={setStudents}
            onOpenEditStudent={handleOpenEditStudent}
            onOpenAddStudent={handleOpenAddStudent}
            onOpenImportImage={handleOpenImportImage}
            selectedInstrument={selectedInstrument}
            setSelectedInstrument={setSelectedInstrument}
            highlightedStudentId={highlightedStudentId}
            branches={branches}
            onPersistStudent={handlePersistStudent}
            onDeleteStudent={handleDeleteStudent}
          />
        )}

        {/* Tab 2: Nhắc nhở Tái Đăng ký (<= 3 buổi) */}
        {activeTab === 'renewalAlerts' && (
          <RenewalAlertsView
            students={students}
            setStudents={setStudents}
            onNavigateToStudent={handleNavigateToStudentDetail}
            onPersistStudent={handlePersistStudent}
          />
        )}

        {/* Tab 3: Quản lý Thông tin Giáo viên */}
        {activeTab === 'teacherManagement' && (
          <TeacherManagementView
            teachers={teachers}
            setTeachers={setTeachers}
            branches={branches}
            onPersistTeacher={handlePersistTeacher}
            onDeleteTeacher={handleDeleteTeacher}
          />
        )}

        {/* Tab: Quản lý Cơ sở Đào tạo */}
        {activeTab === 'branches' && (
          <BranchManagementView
            branches={branches}
            setBranches={setBranches}
            students={students}
            teachers={teachers}
            onUpdateBranchNameInRecords={handleUpdateBranchNameInRecords}
            onDeleteBranchInRecords={handleDeleteBranchInRecords}
            onPersistBranch={handlePersistBranch}
            onDeleteBranch={handleDeleteBranch}
          />
        )}

        {/* Tab 4: Thời khóa biểu */}
        {activeTab === 'schedule' && (
          <ScheduleView
            students={students}
            onSelectStudent={handleNavigateToStudentDetail}
          />
        )}

        {/* Tab 5: Lịch dạy Giáo viên */}
        {activeTab === 'teachers' && <TeacherScheduleView students={students} />}

        {/* Tab 6: Biểu đồ Recharts */}
        {activeTab === 'charts' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-2xs">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Biểu đồ Trực quan hóa Dữ liệu Studio (Recharts)
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Báo cáo phân bổ học viên theo 5 bộ môn (Piano, Guitar, Ukulele, Bass, Electric Guitar) & thống kê điểm danh
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('students')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Quản lý 5 Bộ môn & Điểm danh →</span>
                </button>
              </div>
            </div>

            <StudioAnalyticsCharts students={students} />
          </div>
        )}

        {/* Tab 7: Đồng bộ Google Sheets */}
        {activeTab === 'sync' && (
          <GoogleSheetSyncView
            user={user}
            onLogin={handleLogin}
            accessToken={accessToken}
            students={students}
            teachers={teachers}
            spreadsheetUrl={spreadsheetUrl}
            setSpreadsheetUrl={handleSetSpreadsheetUrl}
          />
        )}

        {/* Tab 8: Apps Script Guide */}
        {activeTab === 'appsScript' && <AppsScriptGuideView />}
      </main>

      {/* Add / Edit Student Modal */}
      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveStudent}
        editingStudent={editingStudent}
        defaultInstrument={defaultInstrumentForModal}
        teachers={teachers}
        branches={branches}
      />

      {/* Import Sessions via Image Modal (Gemini 3.8 Flash) */}
      <ImportSessionsImageModal
        isOpen={isImportImageModalOpen}
        onClose={() => setIsImportImageModalOpen(false)}
        students={students}
        onApplySessions={handleApplyImportedSessions}
        initialSelectedStudentId={importTargetStudentId}
        initialInstrument={selectedInstrument}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-700">Harmony Music Studio</span>
            <span>— Hệ thống Quản lý 5 Bộ môn, Hồ sơ Giáo viên, Tái đăng ký ≤ 3 buổi & Google Sheets.</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('branches')}
              className="hover:text-emerald-600 transition-colors flex items-center gap-1 font-medium cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Cơ sở Đào tạo</span>
            </button>
            <button
              onClick={() => setActiveTab('teacherManagement')}
              className="hover:text-indigo-600 transition-colors flex items-center gap-1 font-medium cursor-pointer"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Quản lý Giáo viên</span>
            </button>
            <button
              onClick={() => setActiveTab('renewalAlerts')}
              className="hover:text-amber-600 transition-colors flex items-center gap-1 font-medium cursor-pointer"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Nhắc nhở Tái Đăng ký ({alertsCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('appsScript')}
              className="hover:text-indigo-600 transition-colors flex items-center gap-1 font-medium cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Mã Apps Script</span>
            </button>
            <button
              onClick={() => setActiveTab('sync')}
              className="hover:text-emerald-600 transition-colors flex items-center gap-1 font-medium cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Đồng bộ Sheets</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Real-time Team Chat & Handover Notes Drawer across 2-5 Devices */}
      <TeamChatDrawer
        isOpen={isTeamChatOpen}
        onClose={() => setIsTeamChatOpen(false)}
        currentUser={user}
      />
    </div>
  );
}
