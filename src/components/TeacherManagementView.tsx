/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Branch, InstrumentType, Teacher, TeacherStatus } from '../types/music';
import { INSTRUMENTS, INSTRUMENT_COLORS } from '../utils/scheduleParser';
import { INITIAL_BRANCHES } from '../data/initialTeachers';
import {
  Users,
  UserCheck,
  UserX,
  PlusCircle,
  Edit2,
  Trash2,
  Search,
  Phone,
  Building,
  CheckCircle2,
  Music,
  X,
  Save,
  AlertCircle,
  Sparkles,
  Layers,
  GraduationCap,
} from 'lucide-react';

interface TeacherManagementViewProps {
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  branches?: Branch[];
  onPersistTeacher?: (teacher: Teacher) => void;
  onDeleteTeacher?: (teacherId: string) => void;
}

export const TeacherManagementView: React.FC<TeacherManagementViewProps> = ({
  teachers,
  setTeachers,
  branches = [],
  onPersistTeacher,
  onDeleteTeacher,
}) => {
  const branchOptions = branches.length > 0 ? branches.map((b) => b.name) : INITIAL_BRANCHES;
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | TeacherStatus>('All');
  const [filterInstrument, setFilterInstrument] = useState<string>('All');
  const [filterBranch, setFilterBranch] = useState<string>('All');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [branch, setBranch] = useState(branchOptions[0]);
  const [customBranch, setCustomBranch] = useState('');
  const [selectedInstruments, setSelectedInstruments] = useState<InstrumentType[]>(['Piano']);
  const [status, setStatus] = useState<TeacherStatus>('Hoạt Động');
  const [notes, setNotes] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirm Modal
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setName('');
    setPhone('');
    setBranch(branchOptions[0]);
    setCustomBranch('');
    setSelectedInstruments(['Piano']);
    setStatus('Hoạt Động');
    setNotes('');
    setEmail('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setName(t.name);
    setPhone(t.phone);
    if (branchOptions.includes(t.branch)) {
      setBranch(t.branch);
      setCustomBranch('');
    } else {
      setBranch('Khác');
      setCustomBranch(t.branch);
    }
    setSelectedInstruments(t.instruments.length > 0 ? t.instruments : ['Piano']);
    setStatus(t.status);
    setNotes(t.notes || '');
    setEmail(t.email || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const toggleInstrumentSelection = (ins: InstrumentType) => {
    setSelectedInstruments((prev) => {
      if (prev.includes(ins)) {
        if (prev.length === 1) return prev; // ít nhất 1 bộ môn
        return prev.filter((i) => i !== ins);
      }
      return [...prev, ins];
    });
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Vui lòng nhập Họ Tên giáo viên.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Vui lòng nhập Số Điện Thoại giáo viên.');
      return;
    }
    if (selectedInstruments.length === 0) {
      setFormError('Vui lòng chọn ít nhất 1 Bộ Môn giảng dạy.');
      return;
    }

    const finalBranch = branch === 'Khác' ? customBranch.trim() || 'Cơ sở chính' : branch;

    if (editingTeacher) {
      // Chỉnh sửa giáo viên
      const updatedTeacher: Teacher = {
        ...editingTeacher,
        name: name.trim(),
        phone: phone.trim(),
        branch: finalBranch,
        instruments: selectedInstruments,
        status,
        notes: notes.trim(),
        email: email.trim(),
      };
      setTeachers((prev) =>
        prev.map((t) => (t.id === editingTeacher.id ? updatedTeacher : t))
      );
      if (onPersistTeacher) onPersistTeacher(updatedTeacher);
      showToast(`Đã cập nhật thông tin giáo viên ${name.trim()} thành công!`);
    } else {
      // Thêm mới giáo viên
      const newTeacher: Teacher = {
        id: `teacher-${Date.now()}`,
        name: name.trim(),
        phone: phone.trim(),
        branch: finalBranch,
        instruments: selectedInstruments,
        status,
        notes: notes.trim(),
        email: email.trim(),
        startDate: new Date().toISOString().slice(0, 10),
      };
      setTeachers((prev) => [newTeacher, ...prev]);
      if (onPersistTeacher) onPersistTeacher(newTeacher);
      showToast(`Đã thêm mới giáo viên ${name.trim()} vào hệ thống!`);
    }

    setIsModalOpen(false);
  };

  const handleToggleStatus = (teacherId: string) => {
    let updated: Teacher | null = null;
    setTeachers((prev) =>
      prev.map((t) => {
        if (t.id === teacherId) {
          const nextStatus: TeacherStatus = t.status === 'Hoạt Động' ? 'Nghỉ' : 'Hoạt Động';
          updated = { ...t, status: nextStatus };
          showToast(`Đã chuyển trạng thái ${t.name} thành: ${nextStatus}`);
          return updated;
        }
        return t;
      })
    );
    if (updated && onPersistTeacher) {
      onPersistTeacher(updated);
    }
  };

  const handleConfirmDelete = () => {
    if (!teacherToDelete) return;
    const { id, name: deletedName } = teacherToDelete;
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    if (onDeleteTeacher) onDeleteTeacher(id);
    setTeacherToDelete(null);
    showToast(`Đã xóa giáo viên ${deletedName}.`);
  };

  // Lọc danh sách giáo viên
  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phone.includes(searchQuery) ||
      t.branch.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    const matchesInstrument =
      filterInstrument === 'All' || t.instruments.includes(filterInstrument as InstrumentType);
    const matchesBranch = filterBranch === 'All' || t.branch === filterBranch;
    return matchesSearch && matchesStatus && matchesInstrument && matchesBranch;
  });

  // Unique branches
  const allBranches = Array.from(new Set([...branchOptions, ...teachers.map((t) => t.branch)]));

  // Thống kê nhanh
  const totalTeachers = teachers.length;
  const activeTeachers = teachers.filter((t) => t.status === 'Hoạt Động').length;
  const inactiveTeachers = teachers.filter((t) => t.status === 'Nghỉ').length;
  const multiSubjectTeachers = teachers.filter((t) => t.instruments.length > 1).length;

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
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20 font-bold">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Quản lý Thông tin Giáo viên
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {totalTeachers} Giáo viên
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Quản lý hồ sơ giảng viên, số điện thoại, cơ sở công tác, phân bổ đa bộ môn & trạng thái hoạt động
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Thêm giáo viên mới</span>
          </button>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Tổng giáo viên
              </p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{totalTeachers}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-200/70 text-slate-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-emerald-50/70 rounded-xl p-3.5 border border-emerald-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider">
                Đang Hoạt Động
              </p>
              <p className="text-2xl font-black text-emerald-700 mt-0.5">{activeTeachers}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-rose-50/70 rounded-xl p-3.5 border border-rose-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-rose-800 uppercase tracking-wider">
                Tạm Nghỉ / Nghỉ
              </p>
              <p className="text-2xl font-black text-rose-700 mt-0.5">{inactiveTeachers}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <UserX className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-purple-50/70 rounded-xl p-3.5 border border-purple-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-purple-800 uppercase tracking-wider">
                Dạy Đa Bộ Môn
              </p>
              <p className="text-2xl font-black text-purple-700 mt-0.5">{multiSubjectTeachers}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, SĐT, cơ sở..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Filter Status */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">Tất cả Trạng thái (Hoạt Động & Nghỉ)</option>
              <option value="Hoạt Động">Trạng thái: Hoạt Động</option>
              <option value="Nghỉ">Trạng thái: Nghỉ</option>
            </select>
          </div>

          {/* Filter Instrument */}
          <div>
            <select
              value={filterInstrument}
              onChange={(e) => setFilterInstrument(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">Tất cả Bộ Môn (5 Nhạc cụ)</option>
              {INSTRUMENTS.map((ins) => (
                <option key={ins} value={ins}>
                  Bộ môn: {ins}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Branch */}
          <div>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">Tất cả Cơ sở đào tạo</option>
              {allBranches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Teachers Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.map((teacher) => {
          const isActive = teacher.status === 'Hoạt Động';

          return (
            <div
              key={teacher.id}
              className={`bg-white rounded-2xl p-5 shadow-sm border transition-all hover:shadow-md flex flex-col justify-between ${
                isActive ? 'border-slate-200' : 'border-slate-200 bg-slate-50/50 opacity-80'
              }`}
            >
              {/* Card Top */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs ${
                        isActive
                          ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-indigo-500/20'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {teacher.name
                        .split(' ')
                        .slice(-1)[0]
                        ?.charAt(0)
                        ?.toUpperCase() || 'G'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-tight">
                        {teacher.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="font-semibold text-slate-700">{teacher.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge & Toggle */}
                  <button
                    onClick={() => handleToggleStatus(teacher.id)}
                    title="Bấm để đổi trạng thái Hoạt Động / Nghỉ"
                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isActive ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    <span>{teacher.status}</span>
                  </button>
                </div>

                {/* Campus / Cơ sở */}
                <div className="mt-3.5 flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate font-medium">{teacher.branch}</span>
                </div>

                {/* Multi-Instruments Tags */}
                <div className="mt-3">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Bộ môn phụ trách ({teacher.instruments.length}):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {teacher.instruments.map((ins) => {
                      const col = INSTRUMENT_COLORS[ins] || {
                        badge: 'bg-slate-100 text-slate-800 border-slate-200',
                      };
                      return (
                        <span
                          key={ins}
                          className={`text-xs px-2.5 py-0.5 rounded-lg font-bold border ${col.badge}`}
                        >
                          {ins}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Notes or Bio */}
                {teacher.notes && (
                  <p className="mt-3 text-xs text-slate-500 line-clamp-2 italic bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                    "{teacher.notes}"
                  </p>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {teacher.startDate ? `Gia nhập: ${teacher.startDate}` : 'Giảng viên cơ hữu'}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(teacher)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Sửa</span>
                  </button>

                  <button
                    onClick={() => setTeacherToDelete(teacher)}
                    className="inline-flex items-center gap-1 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Xóa giáo viên"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredTeachers.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-slate-200">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-700 text-base">Không tìm thấy giáo viên nào</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Không có giáo viên nào khớp với bộ lọc hoặc từ khóa tìm kiếm của bạn. Hãy thử thay đổi bộ lọc.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('All');
                setFilterInstrument('All');
                setFilterBranch('All');
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Teacher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-scale-in">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">
                  {editingTeacher ? 'Chỉnh sửa Thông tin Giáo viên' : 'Thêm Giáo viên Mới vào Hệ thống'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2 border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Tên & SĐT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ và Tên Giáo viên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Thầy Hoàng Piano"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số Điện Thoại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ví dụ: 0903 112 233"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium"
                    required
                  />
                </div>
              </div>

              {/* Cơ Sở */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cơ Sở Công Tác <span className="text-rose-500">*</span>
                </label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  {branchOptions.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  <option value="Khác">Cơ sở khác (Tự nhập)</option>
                </select>

                {branch === 'Khác' && (
                  <input
                    type="text"
                    value={customBranch}
                    onChange={(e) => setCustomBranch(e.target.value)}
                    placeholder="Nhập tên cơ sở mới..."
                    className="mt-2 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                )}
              </div>

              {/* Bộ Môn (Giáo viên có thể dạy nhiều bộ môn) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Bộ Môn Giảng Dạy <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-indigo-600 font-semibold">
                    (Có thể chọn nhiều bộ môn cùng lúc)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {INSTRUMENTS.map((ins) => {
                    const isSelected = selectedInstruments.includes(ins);
                    return (
                      <button
                        type="button"
                        key={ins}
                        onClick={() => toggleInstrumentSelection(ins)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{ins}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Trạng Thái (Hoạt Động, Nghỉ) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Trạng Thái Hoạt Động <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      status === 'Hoạt Động'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      checked={status === 'Hoạt Động'}
                      onChange={() => setStatus('Hoạt Động')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-xs block">Hoạt Động</span>
                      <span className="text-[10px] text-slate-500">Đang nhận lớp & giảng dạy</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      status === 'Nghỉ'
                        ? 'bg-rose-50 border-rose-300 text-rose-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      checked={status === 'Nghỉ'}
                      onChange={() => setStatus('Nghỉ')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <span className="font-bold text-xs block">Nghỉ</span>
                      <span className="text-[10px] text-slate-500">Tạm nghỉ / Đã nghỉ việc</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Email & Ghi chú */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email liên hệ</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@harmonymusic.vn"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú chuyên môn</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Kinh nghiệm, thế mạnh biểu diễn..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingTeacher ? 'Cập nhật giáo viên' : 'Lưu giáo viên mới'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Iframe-safe) */}
      {teacherToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-scale-in">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center font-bold">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Xác nhận xóa giáo viên?</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
              Bạn có chắc chắn muốn xóa hồ sơ giáo viên <strong>{teacherToDelete.name}</strong> ({teacherToDelete.branch})?
              Dữ liệu học viên đã phân công cho giáo viên này sẽ không bị xóa.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setTeacherToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Đồng ý Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
