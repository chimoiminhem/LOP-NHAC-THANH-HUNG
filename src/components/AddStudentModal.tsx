/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Branch, InstrumentType, PackageType, Student, StudentStatus, STUDENT_STATUSES, Teacher } from '../types/music';
import {
  createDefaultSessions,
  getPackageSessionCount,
  INSTRUMENTS,
  PACKAGE_TYPES,
} from '../utils/scheduleParser';
import { INITIAL_BRANCHES } from '../data/initialTeachers';
import { X, UserPlus, Save, AlertCircle, Sparkles, CheckCircle2, Building2 } from 'lucide-react';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (studentData: Partial<Student>) => void;
  editingStudent?: Student | null;
  defaultInstrument?: InstrumentType;
  teachers?: Teacher[];
  branches?: Branch[];
}

const SCHEDULE_PRESETS = [
  'Thứ 2, Thứ 4 (18:00 - 19:30)',
  'Thứ 3, Thứ 5 (18:00 - 19:30)',
  'Thứ 3, Thứ 6 (19:00 - 20:30)',
  'Thứ 2, Thứ 5 (17:30 - 19:00)',
  'Thứ 4, Thứ 7 (15:30 - 17:00)',
  'Thứ 7, Chủ Nhật (09:30 - 11:00)',
  'Chủ Nhật (08:00 - 09:30)',
];

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingStudent,
  defaultInstrument = 'Piano',
  teachers = [],
  branches = [],
}) => {
  const branchList = branches.length > 0 ? branches.map((b) => b.name) : INITIAL_BRANCHES;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [instrument, setInstrument] = useState<InstrumentType>(defaultInstrument);
  const [packageType, setPackageType] = useState<PackageType>('24 buổi');
  const [status, setStatus] = useState<StudentStatus>('Đang học');
  const [scheduleString, setScheduleString] = useState('Thứ 2, Thứ 4 (18:00 - 19:30)');
  const [teacher, setTeacher] = useState('Thầy Hoàng Piano');
  const [branch, setBranch] = useState(branchList[0]);
  const [room, setRoom] = useState('Phòng 101');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Lọc danh sách giáo viên đang Hoạt Động dạy bộ môn đã chọn
  const matchingTeachers = teachers.filter(
    (t) => t.status === 'Hoạt Động' && t.instruments.includes(instrument)
  );

  useEffect(() => {
    if (editingStudent) {
      setName(editingStudent.name);
      setPhone(editingStudent.phone);
      setInstrument(editingStudent.instrument);
      setPackageType(editingStudent.packageType || '24 buổi');
      setStatus(editingStudent.status || 'Đang học');
      setScheduleString(editingStudent.scheduleString);
      setTeacher(editingStudent.teacher || '');
      setBranch(editingStudent.branch || branchList[0]);
      setRoom(editingStudent.room || 'Phòng 101');
      setStartDate(editingStudent.startDate || new Date().toISOString().slice(0, 10));
      setNotes(editingStudent.notes || '');
    } else {
      setName('');
      setPhone('');
      setInstrument(defaultInstrument);
      setPackageType('24 buổi');
      setStatus('Đang học');
      setScheduleString('Thứ 2, Thứ 4 (18:00 - 19:30)');
      const firstActiveTeacher = teachers.find(
        (t) => t.status === 'Hoạt Động' && t.instruments.includes(defaultInstrument)
      );
      setTeacher(firstActiveTeacher?.name || 'Thầy phụ trách');
      setBranch(branchList[0]);
      setRoom(`Phòng ${defaultInstrument.substring(0, 3).toUpperCase()} 101`);
      setStartDate(new Date().toISOString().slice(0, 10));
      setNotes('');
    }
    setError(null);
  }, [editingStudent, defaultInstrument, isOpen, teachers, branches]);

  // Update default teacher when instrument changes
  const handleInstrumentChange = (inst: InstrumentType) => {
    setInstrument(inst);
    if (!editingStudent) {
      const activeForInst = teachers.find(
        (t) => t.status === 'Hoạt Động' && t.instruments.includes(inst)
      );
      setTeacher(activeForInst?.name || `Giáo viên bộ môn ${inst}`);
      setRoom(`Phòng ${inst.substring(0, 3).toUpperCase()} 101`);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên học viên.');
      return;
    }
    if (!phone.trim()) {
      setError('Vui lòng nhập số điện thoại học viên.');
      return;
    }

    const sessionCount = getPackageSessionCount(packageType);

    onSave({
      name: name.trim(),
      phone: phone.trim(),
      instrument,
      packageType,
      status,
      scheduleString: scheduleString.trim(),
      teacher: teacher.trim(),
      branch,
      room: room.trim(),
      startDate,
      notes: notes.trim(),
      feeStatus: 'Đã đóng',
      sessions: editingStudent
        ? editingStudent.sessions
        : createDefaultSessions(sessionCount, startDate),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-scale-in">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base">
              {editingStudent
                ? 'Chỉnh sửa Thông tin Học viên'
                : 'Thêm Học viên Mới & Chọn Gói Đăng Ký'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2 border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tên & Số điện thoại */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên học viên <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn A"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số điện thoại <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ví dụ: 0912 345 678"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium"
                required
              />
            </div>
          </div>

          {/* GÓI ĐĂNG KÝ (Trạng thái đăng ký: 8 buổi, 24 buổi, 36 buổi) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Gói Đăng Ký (Trạng thái đăng ký) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-amber-700 font-semibold">
                (Nhắc nhở tự động khi còn ≤ 3 buổi)
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {PACKAGE_TYPES.map((pkg) => {
                const isSelected = packageType === pkg;
                const count = getPackageSessionCount(pkg);
                return (
                  <button
                    type="button"
                    key={pkg}
                    onClick={() => setPackageType(pkg)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm ring-2 ring-amber-400/40'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-extrabold text-xs">{pkg}</div>
                    <div
                      className={`text-[10px] mt-0.5 ${
                        isSelected ? 'text-amber-100' : 'text-slate-500'
                      }`}
                    >
                      {count === 8
                        ? '1 tháng / Trải nghiệm'
                        : count === 24
                        ? '3 tháng / Tiêu chuẩn'
                        : '4.5 tháng / Chuyên sâu'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TRẠNG THÁI HỌC VIÊN: Đang học, Bảo Lưu, Nghỉ Học */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Trạng thái học viên <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500">
                (Đang học / Bảo lưu / Nghỉ học)
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {STUDENT_STATUSES.map((st) => {
                const isSelected = status === st;
                return (
                  <button
                    type="button"
                    key={st}
                    onClick={() => setStatus(st)}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? st === 'Đang học'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-400/40'
                          : st === 'Bảo Lưu'
                          ? 'bg-amber-600 text-white border-amber-700 shadow-sm ring-2 ring-amber-400/40'
                          : 'bg-slate-700 text-white border-slate-800 shadow-sm ring-2 ring-slate-400/40'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        st === 'Đang học'
                          ? 'bg-emerald-300'
                          : st === 'Bảo Lưu'
                          ? 'bg-amber-300'
                          : 'bg-rose-300'
                      }`}
                    />
                    <span>{st}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lớp / Bộ môn */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Lớp / Bộ môn</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {INSTRUMENTS.map((ins) => (
                <button
                  type="button"
                  key={ins}
                  onClick={() => handleInstrumentChange(ins)}
                  className={`py-2 px-1 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                    instrument === ins
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {ins}
                </button>
              ))}
            </div>
          </div>

          {/* Lịch học đăng ký */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lịch học đăng ký <span className="text-xs font-normal text-slate-500">(Dùng tổng hợp TKB)</span>
            </label>
            <input
              type="text"
              value={scheduleString}
              onChange={(e) => setScheduleString(e.target.value)}
              placeholder="Ví dụ: Thứ 2, Thứ 4 (18:00 - 19:30)"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium"
              required
            />
            {/* Gợi ý mẫu lịch nhanh */}
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="text-[10px] text-slate-400 self-center">Mẫu nhanh:</span>
              {SCHEDULE_PRESETS.slice(0, 4).map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setScheduleString(preset)}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Giáo viên & Cơ sở */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Giáo viên phụ trách
              </label>
              {matchingTeachers.length > 0 ? (
                <select
                  value={teacher}
                  onChange={(e) => setTeacher(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  {matchingTeachers.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.branch.split(' - ')[0]})
                    </option>
                  ))}
                  <option value="Khác">Giáo viên khác...</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={teacher}
                  onChange={(e) => setTeacher(e.target.value)}
                  placeholder="Ví dụ: Thầy Hoàng Piano"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cơ sở đào tạo</label>
              <select
                value={branch}
                onChange={(e) => {
                  const newBranch = e.target.value;
                  setBranch(newBranch);
                  const matchingB = branches.find((b) => b.name === newBranch);
                  if (matchingB?.rooms && matchingB.rooms.length > 0 && !matchingB.rooms.includes(room)) {
                    setRoom(matchingB.rooms[0]);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              >
                {branchList.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Phòng học & Ngày bắt đầu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phòng học</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Ví dụ: Phòng Acoustic 101"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
              {/* Gợi ý phòng của cơ sở */}
              {(() => {
                const bObj = branches.find((b) => b.name === branch);
                const availableRooms = bObj?.rooms && bObj.rooms.length > 0 ? bObj.rooms : ['Phòng 101', 'Phòng 102', 'Studio A'];
                return (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    <span className="text-[10px] text-slate-400 self-center">Phòng cơ sở:</span>
                    {availableRooms.map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setRoom(r)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          room === r
                            ? 'bg-indigo-100 text-indigo-700 border-indigo-300 font-bold'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-indigo-50'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ngày bắt đầu</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú học viên</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Mục tiêu học, sở thích, thông tin phụ huynh..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Thông báo tự động khởi tạo */}
          {!editingStudent && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Hệ thống sẽ tự khởi tạo bảng điểm danh <strong>{packageType}</strong> và kích hoạt
                chuông nhắc nhở tái đăng ký khi học viên <strong>chỉ còn 3 buổi</strong>.
              </span>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{editingStudent ? 'Lưu thay đổi' : 'Thêm học viên'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
