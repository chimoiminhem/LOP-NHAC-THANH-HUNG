/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Branch, Student, Teacher } from '../types/music';
import {
  Building2,
  PlusCircle,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  User,
  Users,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  X,
  Save,
  Layers,
  Search,
  Star,
  Plus,
  DoorOpen,
} from 'lucide-react';

interface BranchManagementViewProps {
  branches: Branch[];
  setBranches: React.Dispatch<React.SetStateAction<Branch[]>>;
  students: Student[];
  teachers: Teacher[];
  onUpdateBranchNameInRecords?: (oldName: string, newName: string) => void;
  onDeleteBranchInRecords?: (deletedBranchName: string, fallbackBranchName: string) => void;
  onPersistBranch?: (branch: Branch) => void;
  onDeleteBranch?: (branchId: string) => void;
}

export const BranchManagementView: React.FC<BranchManagementViewProps> = ({
  branches,
  setBranches,
  students,
  teachers,
  onUpdateBranchNameInRecords,
  onDeleteBranchInRecords,
  onPersistBranch,
  onDeleteBranch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [manager, setManager] = useState('');
  const [rooms, setRooms] = useState<string[]>([]);
  const [newRoomInput, setNewRoomInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete State
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const [fallbackBranchId, setFallbackBranchId] = useState<string>('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingBranch(null);
    setName('');
    setAddress('');
    setPhone('');
    setManager('');
    setRooms(['Phòng Piano 1', 'Phòng Guitar 1', 'Phòng Hòa tấu']);
    setNewRoomInput('');
    setNotes('');
    setIsDefault(branches.length === 0);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setName(branch.name);
    setAddress(branch.address || '');
    setPhone(branch.phone || '');
    setManager(branch.manager || '');
    setRooms(branch.rooms ? [...branch.rooms] : []);
    setNewRoomInput('');
    setNotes(branch.notes || '');
    setIsDefault(Boolean(branch.isDefault));
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleAddRoom = () => {
    if (!newRoomInput.trim()) return;
    if (rooms.includes(newRoomInput.trim())) {
      setFormError('Phòng học này đã có trong danh sách.');
      return;
    }
    setRooms([...rooms, newRoomInput.trim()]);
    setNewRoomInput('');
    setFormError(null);
  };

  const handleRemoveRoom = (index: number) => {
    setRooms(rooms.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name.trim()) {
      setFormError('Vui lòng nhập tên cơ sở.');
      return;
    }

    // Kiểm tra trùng tên
    const isDuplicate = branches.some(
      (b) => b.name.toLowerCase() === name.trim().toLowerCase() && b.id !== editingBranch?.id
    );
    if (isDuplicate) {
      setFormError('Tên cơ sở này đã tồn tại trong hệ thống.');
      return;
    }

    if (editingBranch) {
      const oldName = editingBranch.name;
      const newName = name.trim();
      const updatedBranch: Branch = {
        ...editingBranch,
        name: newName,
        address: address.trim(),
        phone: phone.trim(),
        manager: manager.trim(),
        rooms: rooms.filter(Boolean),
        notes: notes.trim(),
        isDefault,
      };

      setBranches((prev) =>
        prev.map((b) => {
          if (b.id === editingBranch.id) {
            return updatedBranch;
          }
          if (isDefault) {
            return { ...b, isDefault: false };
          }
          return b;
        })
      );

      if (onPersistBranch) {
        onPersistBranch(updatedBranch);
      }

      // Nếu đổi tên, tự động cập nhật danh sách học viên và giáo viên
      if (oldName !== newName && onUpdateBranchNameInRecords) {
        onUpdateBranchNameInRecords(oldName, newName);
      }

      showToast(`Đã cập nhật thông tin cơ sở "${newName}" thành công!`);
    } else {
      const newBranch: Branch = {
        id: `branch-${Date.now()}`,
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        manager: manager.trim(),
        rooms: rooms.filter(Boolean),
        notes: notes.trim(),
        isDefault,
      };

      setBranches((prev) => {
        let updated = [...prev];
        if (isDefault) {
          updated = updated.map((b) => ({ ...b, isDefault: false }));
        }
        return [...updated, newBranch];
      });

      if (onPersistBranch) {
        onPersistBranch(newBranch);
      }

      showToast(`🎉 Đã thêm mới cơ sở "${newBranch.name}" thành công!`);
    }

    setIsModalOpen(false);
  };

  const handleOpenDelete = (branch: Branch) => {
    if (branches.length <= 1) {
      showToast('⚠️ Hệ thống phải có ít nhất 1 cơ sở hoạt động. Không thể xóa cơ sở duy nhất.');
      return;
    }

    setBranchToDelete(branch);
    // Chọn cơ sở thay thế mặc định (cơ sở đầu tiên khác cơ sở sắp xóa)
    const otherBranch = branches.find((b) => b.id !== branch.id);
    setFallbackBranchId(otherBranch ? otherBranch.id : '');
  };

  const handleConfirmDelete = () => {
    if (!branchToDelete) return;

    const deletedId = branchToDelete.id;
    const deletedName = branchToDelete.name;
    const fallbackBranch = branches.find((b) => b.id === fallbackBranchId);
    const fallbackName = fallbackBranch ? fallbackBranch.name : branches[0].name;

    setBranches((prev) => {
      const remaining = prev.filter((b) => b.id !== deletedId);
      // Nếu xóa cơ sở mặc định, đặt cơ sở đầu tiên còn lại làm mặc định
      if (branchToDelete.isDefault && remaining.length > 0) {
        remaining[0].isDefault = true;
      }
      return remaining;
    });

    if (onDeleteBranch) {
      onDeleteBranch(deletedId);
    }

    if (onDeleteBranchInRecords) {
      onDeleteBranchInRecords(deletedName, fallbackName);
    }

    showToast(`Đã xóa cơ sở "${deletedName}". Học viên & giáo viên đã được chuyển sang "${fallbackName}".`);
    setBranchToDelete(null);
  };

  const handleSetDefault = (branchId: string) => {
    setBranches((prev) =>
      prev.map((b) => {
        const isTarget = b.id === branchId;
        const updated = { ...b, isDefault: isTarget };
        if (onPersistBranch) onPersistBranch(updated);
        return updated;
      })
    );
    const target = branches.find((b) => b.id === branchId);
    showToast(`Đã đặt "${target?.name}" làm Trụ sở chính mặc định.`);
  };

  // Lọc cơ sở theo tìm kiếm
  const filteredBranches = branches.filter((b) => {
    const q = searchQuery.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      (b.address && b.address.toLowerCase().includes(q)) ||
      (b.phone && b.phone.includes(q)) ||
      (b.manager && b.manager.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-indigo-500/50 flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Quản lý Cơ Sở Đào Tạo (Studio Branches)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
                  {branches.length} Cơ sở
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Thêm mới, sửa địa chỉ, hotline, quản lý danh sách phòng học và phân bổ lớp học theo từng cơ sở
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Thêm cơ sở mới</span>
          </button>
        </div>

        {/* Search input */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm cơ sở theo tên, địa chỉ, số hotline, người quản lý..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Grid of Branches */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBranches.map((branch) => {
          // Tính số học viên và giáo viên tại cơ sở này
          const branchStudentsCount = students.filter((s) => s.branch === branch.name).length;
          const branchTeachersCount = teachers.filter((t) => t.branch === branch.name).length;

          return (
            <div
              key={branch.id}
              className={`bg-white rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between overflow-hidden ${
                branch.isDefault
                  ? 'border-indigo-400 ring-2 ring-indigo-500/10 shadow-xs'
                  : 'border-slate-200 shadow-2xs'
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                          <Building2 className="w-4 h-4" />
                        </span>
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 line-clamp-1">
                          {branch.name}
                        </h3>
                      </div>
                      {branch.isDefault && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                          <Star className="w-3 h-3 fill-indigo-600 text-indigo-600" />
                          Trụ sở chính (Mặc định)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(branch)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                        title="Chỉnh sửa thông tin cơ sở"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(branch)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:border-rose-300 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Xóa cơ sở"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-3.5 text-xs">
                  {/* Address */}
                  <div className="flex items-start gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider">
                        Địa chỉ:
                      </span>
                      <span className="text-slate-800">{branch.address || 'Chưa cập nhật địa chỉ'}</span>
                    </div>
                  </div>

                  {/* Hotline & Manager */}
                  <div className="grid grid-cols-2 gap-3 pt-1 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Hotline</span>
                        <span className="font-mono font-bold text-slate-800">{branch.phone || '—'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Quản lý</span>
                        <span className="font-semibold text-slate-800 truncate">{branch.manager || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rooms list */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                        <DoorOpen className="w-3.5 h-3.5 text-indigo-500" />
                        Phòng học ({branch.rooms?.length || 0} phòng)
                      </span>
                    </div>
                    {branch.rooms && branch.rooms.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {branch.rooms.map((room, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {room}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Chưa tạo phòng học</span>
                    )}
                  </div>

                  {/* Notes if any */}
                  {branch.notes && (
                    <div className="pt-1 text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                      "{branch.notes}"
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer: Stats & Quick Action */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-slate-700 font-semibold" title="Số lượng học viên">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{branchStudentsCount} học viên</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-700 font-semibold" title="Số lượng giáo viên">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{branchTeachersCount} GV</span>
                  </div>
                </div>

                {!branch.isDefault && (
                  <button
                    onClick={() => handleSetDefault(branch.id)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Đặt làm trụ sở</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredBranches.length === 0 && (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-sm">
          Không tìm thấy cơ sở nào phù hợp với từ khóa "{searchQuery}".
        </div>
      )}

      {/* Add / Edit Branch Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-base text-white">
                  {editingBranch ? 'Chỉnh sửa cơ sở đào tạo' : 'Thêm mới cơ sở đào tạo'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[75vh] text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Tên cơ sở */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên cơ sở đào tạo: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Cơ sở 4 - Tân Bình (Chi nhánh 4)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-900"
                />
              </div>

              {/* Địa chỉ chi tiết */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Địa chỉ chi tiết:</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="VD: Số 15 Hoàng Hoa Thám, P.13, Quận Tân Bình, TP.HCM"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900"
                />
              </div>

              {/* SĐT Hotline & Quản lý */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số hotline cơ sở:</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="VD: 028 3811 2233"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Người quản lý / Giáo viên phụ trách:</label>
                  <input
                    type="text"
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                    placeholder="VD: Thầy Tuấn Guitar"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900"
                  />
                </div>
              </div>

              {/* Danh sách phòng học */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Danh sách phòng học tại cơ sở:</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    ({rooms.length} phòng)
                  </span>
                </label>

                {/* Input thêm phòng */}
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newRoomInput}
                    onChange={(e) => setNewRoomInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddRoom();
                      }
                    }}
                    placeholder="Nhập tên phòng: VD: Phòng Piano 101, Phòng Band..."
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddRoom}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-300 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm</span>
                  </button>
                </div>

                {/* Room pills */}
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                  {rooms.length > 0 ? (
                    rooms.map((room, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-300 text-slate-800 text-[11px] font-medium shadow-2xs"
                      >
                        <DoorOpen className="w-3 h-3 text-slate-500" />
                        <span>{room}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRoom(idx)}
                          className="hover:text-rose-600 transition-colors ml-0.5"
                          title="Xóa phòng này"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-400 italic p-1">
                      Chưa có phòng học nào. Hãy nhập tên phòng và bấm Thêm.
                    </span>
                  )}
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ghi chú thêm:</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="VD: Cơ sở mới khai trương, trang bị cách âm 2 lớp..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900"
                />
              </div>

              {/* Checkbox Trụ sở chính */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-slate-800">
                  Đặt làm Trụ sở chính mặc định của studio
                </span>
              </label>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{editingBranch ? 'Lưu thay đổi' : 'Tạo cơ sở mới'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {branchToDelete && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setBranchToDelete(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Xác nhận xóa cơ sở</h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 mb-4">
              Bạn có chắc chắn muốn xóa cơ sở <strong className="text-slate-900">"{branchToDelete.name}"</strong>?
            </p>

            {/* Chọn cơ sở chuyển giao nếu có học viên hoặc giáo viên */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-xs text-amber-900 space-y-2">
              <p className="font-semibold">
                Chuyển giao các học viên và giáo viên hiện tại sang cơ sở:
              </p>
              <select
                value={fallbackBranchId}
                onChange={(e) => setFallbackBranchId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden"
              >
                {branches
                  .filter((b) => b.id !== branchToDelete.id)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setBranchToDelete(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Xác nhận xóa cơ sở
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
