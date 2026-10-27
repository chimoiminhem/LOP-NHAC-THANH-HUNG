/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  AttendanceSession,
  AttendanceStatus,
  InstrumentType,
  Student,
} from '../types/music';
import {
  INSTRUMENTS,
  INSTRUMENT_COLORS,
  ImportMergeStrategy,
  mergeSessions,
  sanitizeScannedSession,
} from '../utils/scheduleParser';
import {
  Camera,
  Upload,
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Trash2,
  FileText,
  User,
  Music,
  Calendar,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

interface ImportSessionsImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onApplySessions: (
    targetStudentId: string,
    sessions: AttendanceSession[],
    strategy: ImportMergeStrategy,
    newStudentData?: Partial<Student>
  ) => void;
  initialSelectedStudentId?: string | null;
  initialInstrument?: InstrumentType;
}

// Mẫu demo ảnh sổ theo dõi để test nhanh tính năng
interface SampleNotebook {
  id: string;
  name: string;
  instrument: InstrumentType;
  description: string;
  sessions: AttendanceSession[];
}

const SAMPLE_NOTEBOOKS: SampleNotebook[] = [
  {
    id: 'sample-piano',
    name: 'Sổ theo dõi Piano cơ bản (Học viên Minh Anh)',
    instrument: 'Piano',
    description: 'Bao gồm 6 buổi: Hanon 1, Gam C Major, Fur Elise phần A & B',
    sessions: [
      {
        stt: 1,
        date: '10/02/2025',
        content: 'Tư thế ngồi, làm quen bàn phím, Luyện ngón Hanon bài 1',
        status: 'Học',
        note: 'Tay cong tròn đều, giữ nhịp tốt',
      },
      {
        stt: 2,
        date: '13/02/2025',
        content: 'Gam Đô trưởng (C Major) 2 quãng tám, Beyer bài 8',
        status: 'Học',
        note: 'Ngón cái luồn mượt mà, đúng nhịp 4/4',
      },
      {
        stt: 3,
        date: '17/02/2025',
        content: 'Tác phẩm: Fur Elise (Phần A, 16 ô nhịp đầu)',
        status: 'Học',
        note: 'Thuộc giai điệu, lưu ý sắc thái piano & mezzo forte',
      },
      {
        stt: 4,
        date: '20/02/2025',
        content: 'Ghép hai tay phần A Fur Elise',
        status: 'Phép',
        note: 'Học viên xin phép nghỉ bận thi học kỳ',
      },
      {
        stt: 5,
        date: '24/02/2025',
        content: 'Ghép hoàn thiện phần A + Luyện hợp âm C, Am, F, G',
        status: 'Học',
        note: 'Hai tay đồng đều, chuyển hợp âm dứt khoát',
      },
      {
        stt: 6,
        date: '27/02/2025',
        content: 'Khởi động phần B Fur Elise (nhịp 3/8) + Bài tập pedal',
        status: 'Học',
        note: 'Đạp pedal đúng nhịp, không bị dính âm',
      },
    ],
  },
  {
    id: 'sample-guitar',
    name: 'Sổ báo bài Guitar Đệm hát (Học viên Quốc Bảo)',
    instrument: 'Guitar',
    description: 'Bao gồm 5 buổi: Bấm hợp âm cơ bản, tỉa ngón Slow Rock & Ballad',
    sessions: [
      {
        stt: 1,
        date: '05/02/2025',
        content: 'Thế tay bấm ngón, 4 hợp âm cơ bản: C, Am, Dm, G7',
        status: 'Học',
        note: 'Bấm ngón sát phím sắt để âm thanh trong trẻo',
      },
      {
        stt: 2,
        date: '08/02/2025',
        content: 'Luyện chuyển hợp âm liên tục theo nhịp metronome 60bpm',
        status: 'Học',
        note: 'Chuyển mượt mà, không bị khựng',
      },
      {
        stt: 3,
        date: '12/02/2025',
        content: 'Điệu tỉa Slow Rock (Bass - 3 - 2 - 1 - 2 - 3)',
        status: 'Học',
        note: 'Lực gảy ngón cái êm ái, nhịp đều đặn',
      },
      {
        stt: 4,
        date: '15/02/2025',
        content: 'Thực hành bài hát: Tuổi Hồng Thơ Ngây',
        status: 'Học',
        note: 'Vừa đàn vừa hát câu 1-2 rất tự tin',
      },
      {
        stt: 5,
        date: '19/02/2025',
        content: 'Kỹ thuật quạt chả Ballad + Dậm chân giữ nhịp',
        status: 'Phép',
        note: 'Học viên dời lịch sang cuối tuần sau',
      },
    ],
  },
];

export const ImportSessionsImageModal: React.FC<ImportSessionsImageModalProps> = ({
  isOpen,
  onClose,
  students,
  onApplySessions,
  initialSelectedStudentId,
  initialInstrument,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extracted data state
  const [extractedSessions, setExtractedSessions] = useState<AttendanceSession[]>([]);
  const [detectedStudentName, setDetectedStudentName] = useState<string>('');
  const [detectedInstrument, setDetectedInstrument] = useState<string>('');
  const [summaryNote, setSummaryNote] = useState<string>('');

  // Target application settings
  const [targetMode, setTargetMode] = useState<'existing' | 'new'>('existing');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialSelectedStudentId || (students[0]?.id || '')
  );
  const [mergeStrategy, setMergeStrategy] = useState<ImportMergeStrategy>('update_by_stt');

  // New student fields if targetMode === 'new'
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [newStudentPhone, setNewStudentPhone] = useState<string>('');
  const [newStudentInstrument, setNewStudentInstrument] = useState<InstrumentType>(
    initialInstrument || 'Piano'
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronize target student when initial props change
  useEffect(() => {
    if (initialSelectedStudentId) {
      setSelectedStudentId(initialSelectedStudentId);
      setTargetMode('existing');
    }
  }, [initialSelectedStudentId]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn một tệp hình ảnh hợp lệ (PNG, JPG, WEBP).');
      return;
    }

    setFileName(file.name);
    setImageMimeType(file.type);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      // Tự động phân tích ảnh sau khi người dùng tải ảnh lên
      extractSessionsFromImage(base64, file.type, file.name);
    };
    reader.onerror = () => {
      setErrorMessage('Không thể đọc tệp hình ảnh. Vui lòng thử lại.');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: SampleNotebook) => {
    setFileName(`${sample.name}.jpg`);
    setErrorMessage(null);
    setDetectedStudentName(sample.name.replace(/.*\(Học viên (.*?)\).*/, '$1') || 'Nguyễn Minh Anh');
    setDetectedInstrument(sample.instrument);
    setSummaryNote(`Mẫu sổ thực tế: ${sample.description}`);
    setExtractedSessions(sample.sessions.map((s) => ({ ...s })));
    setNewStudentName(sample.name.replace(/.*\(Học viên (.*?)\).*/, '$1') || 'Học viên mới');
    setNewStudentInstrument(sample.instrument);

    // Tạo canvas vẽ ảnh mô phỏng sổ tay thực tế
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fdfbf7';
      ctx.fillRect(0, 0, 600, 360);
      // Vẽ dòng kẻ sổ tay
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      for (let y = 50; y < 360; y += 30) {
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(570, y);
        ctx.stroke();
      }
      // Tiêu đề sổ
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`SỔ THEO DÕI HỌC TẬP - ${sample.instrument.toUpperCase()}`, 40, 40);
      // Danh sách buổi
      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#334155';
      sample.sessions.slice(0, 6).forEach((sess, i) => {
        const y = 80 + i * 30;
        ctx.fillText(`Buổi ${sess.stt} | ${sess.date} | ${sess.content.slice(0, 35)}... [${sess.status || 'Chưa học'}]`, 40, y);
      });
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImagePreview(dataUrl);
      setImageMimeType('image/jpeg');
    }
  };

  const extractSessionsFromImage = async (
    base64Data: string,
    mimeType: string,
    currentFileName?: string
  ) => {
    setIsLoading(true);
    setStatusMessage('Đang kết nối AI Gemini 3.8 Flash...');
    setErrorMessage(null);

    // Gợi ý tên và bộ môn nếu đã chọn học viên
    const currentStudent = students.find((s) => s.id === selectedStudentId);

    try {
      setStatusMessage('Đang phân tích chữ viết tay & bảng nội dung học...');
      const response = await fetch('/api/gemini/extract-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType,
          studentNameHint: currentStudent?.name,
          instrumentHint: currentStudent?.instrument || initialInstrument,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Lỗi máy chủ (${response.status})`);
      }

      const data = await response.json();

      if (!data.success && data.error) {
        throw new Error(data.error);
      }

      const sessionsRaw = Array.isArray(data.sessions) ? data.sessions : [];
      const sanitized = sessionsRaw.map((s: any, idx: number) =>
        sanitizeScannedSession(s, idx + 1)
      );

      setExtractedSessions(sanitized);
      if (data.detectedStudentName) {
        setDetectedStudentName(data.detectedStudentName);
        setNewStudentName(data.detectedStudentName);
      }
      if (data.detectedInstrument) {
        setDetectedInstrument(data.detectedInstrument);
        if (INSTRUMENTS.includes(data.detectedInstrument as InstrumentType)) {
          setNewStudentInstrument(data.detectedInstrument as InstrumentType);
        }
      }
      if (data.summaryNote) {
        setSummaryNote(data.summaryNote);
      }

      setStatusMessage('');
    } catch (err: any) {
      console.error('Error during image extraction:', err);
      setErrorMessage(
        err.message || 'Không thể trích xuất hình ảnh. Vui lòng thử lại hoặc chọn mẫu demo.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSessionRow = (
    index: number,
    field: keyof AttendanceSession,
    val: any
  ) => {
    setExtractedSessions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleDeleteSessionRow = (index: number) => {
    setExtractedSessions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSessionRow = () => {
    const nextStt =
      extractedSessions.length > 0
        ? Math.max(...extractedSessions.map((s) => s.stt)) + 1
        : 1;
    const today = new Date().toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    setExtractedSessions((prev) => [
      ...prev,
      {
        stt: nextStt,
        date: today,
        content: '',
        status: 'Học',
        note: '',
      },
    ]);
  };

  const handleMarkAllAttended = () => {
    setExtractedSessions((prev) =>
      prev.map((s) => ({ ...s, status: 'Học' as AttendanceStatus }))
    );
  };

  const handleConfirmApply = () => {
    if (extractedSessions.length === 0) {
      setErrorMessage('Chưa có buổi học nào để áp dụng. Hãy tải ảnh hoặc thêm buổi học.');
      return;
    }

    if (targetMode === 'existing') {
      if (!selectedStudentId) {
        setErrorMessage('Vui lòng chọn học viên cần áp dụng nội dung học.');
        return;
      }
      onApplySessions(selectedStudentId, extractedSessions, mergeStrategy);
      onClose();
    } else {
      // New student
      if (!newStudentName.trim()) {
        setErrorMessage('Vui lòng nhập họ tên cho học viên mới.');
        return;
      }
      onApplySessions(
        'new',
        extractedSessions,
        mergeStrategy,
        {
          name: newStudentName.trim(),
          phone: newStudentPhone.trim() || '0900000000',
          instrument: newStudentInstrument,
        }
      );
      onClose();
    }
  };

  const currentStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Nhập nội dung học bằng hình ảnh
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  <Sparkles className="w-3 h-3 text-emerald-300" />
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Chụp ảnh hoặc tải ảnh sổ theo dõi, sổ báo bài, giáo án để tự động trích xuất nội dung từng buổi học
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Section 1: Upload or Choose Sample */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Upload Area */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-indigo-600" />
                  Bước 1: Tải ảnh hoặc chụp sổ theo dõi học tập
                </label>
                {imagePreview && (
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setExtractedSessions([]);
                      setSummaryNote('');
                    }}
                    className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Chọn ảnh khác</span>
                  </button>
                )}
              </div>

              {!imagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50/80 rounded-2xl p-6 text-center cursor-pointer transition-all group flex flex-col items-center justify-center min-h-[160px]"
                >
                  <div className="w-12 h-12 rounded-full bg-white text-indigo-600 shadow-sm flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    Bấm để tải ảnh lên hoặc chụp từ điện thoại / webcam
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Hỗ trợ ảnh chụp sổ theo dõi, sổ báo bài viết tay, bảng điểm danh in, hoặc ảnh chụp bảng bài học
                  </p>

                  <div className="flex items-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Chọn tệp ảnh</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        cameraInputRef.current?.click();
                      }}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Chụp ảnh ngay</span>
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="relative rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden flex flex-col sm:flex-row items-center gap-4 p-3">
                  <img
                    src={imagePreview}
                    alt="Xem trước sổ học tập"
                    className="w-28 h-28 object-cover rounded-xl border border-slate-300 shrink-0 shadow-xs"
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Ảnh đã tải
                      </span>
                      <p className="text-xs font-bold text-slate-800 truncate">{fileName}</p>
                    </div>
                    {isLoading ? (
                      <div className="mt-2 flex items-center gap-2 text-xs text-indigo-700 font-semibold">
                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <span>{statusMessage || 'Đang quét nội dung với Gemini...'}</span>
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-slate-600 space-y-1">
                        <p className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Đã phân tích thành công {extractedSessions.length} buổi học!</span>
                        </p>
                        {summaryNote && <p className="text-slate-500 italic text-[11px] line-clamp-2">{summaryNote}</p>}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => extractSessionsFromImage(imagePreview, imageMimeType, fileName)}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg flex items-center gap-1.5 shrink-0 transition-colors"
                    title="Quét lại ảnh này"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Quét lại</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Sample Selector */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Hoặc thử nghiệm nhanh với mẫu sổ:
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Bấm để nạp sẵn dữ liệu mẫu thực tế của studio mà không cần chụp ảnh:
                </p>
              </div>

              <div className="space-y-2">
                {SAMPLE_NOTEBOOKS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSample(s)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 group-hover:text-indigo-700">
                        {s.name}
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {s.sessions.length} buổi
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{s.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Extracted Sessions Table (Editable) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  Bước 2: Xem trước và chỉnh sửa nội dung bài học trích xuất ({extractedSessions.length} buổi)
                </label>
                <p className="text-[11px] text-slate-500">
                  Thầy/Cô có thể chỉnh sửa trực tiếp ngày học, tên bài học, trạng thái điểm danh hoặc nhận xét trước khi áp dụng
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAllAttended}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                  title="Đánh dấu tất cả các buổi đã học"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tất cả "Đã học"</span>
                </button>
                <button
                  onClick={handleAddSessionRow}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                  title="Thêm một dòng buổi học mới"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm buổi</span>
                </button>
              </div>
            </div>

            {/* Editable Sessions Table */}
            {extractedSessions.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-16 text-center">STT</th>
                      <th className="py-2.5 px-3 w-28">Ngày học</th>
                      <th className="py-2.5 px-3 min-w-[240px]">Nội dung bài học & Tác phẩm</th>
                      <th className="py-2.5 px-3 w-28">Trạng thái</th>
                      <th className="py-2.5 px-3 min-w-[180px]">Nhận xét / Ghi chú</th>
                      <th className="py-2.5 px-2 w-10 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {extractedSessions.map((session, index) => (
                      <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={session.stt}
                            onChange={(e) =>
                              handleUpdateSessionRow(index, 'stt', Number(e.target.value))
                            }
                            className="w-12 text-center font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded px-1 py-1 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={session.date}
                            placeholder="DD/MM/YYYY"
                            onChange={(e) =>
                              handleUpdateSessionRow(index, 'date', e.target.value)
                            }
                            className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:bg-white focus:border-indigo-500 focus:outline-hidden font-mono"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={session.content}
                            placeholder="Tên bài học, Gam, Hanon, Tác phẩm..."
                            onChange={(e) =>
                              handleUpdateSessionRow(index, 'content', e.target.value)
                            }
                            className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:bg-white focus:border-indigo-500 focus:outline-hidden font-medium"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={session.status}
                            onChange={(e) =>
                              handleUpdateSessionRow(
                                index,
                                'status',
                                e.target.value as AttendanceStatus
                              )
                            }
                            className={`w-full font-bold rounded px-2 py-1 text-xs border focus:outline-hidden ${
                              session.status === 'Học'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : session.status === 'Phép'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : session.status === 'Vắng'
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : 'bg-slate-50 text-slate-500 border-slate-200'
                            }`}
                          >
                            <option value="">Chưa học</option>
                            <option value="Học">Học (Có mặt)</option>
                            <option value="Phép">Phép (Nghỉ phép)</option>
                            <option value="Vắng">Vắng (Không phép)</option>
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={session.note}
                            placeholder="Nhận xét của giáo viên..."
                            onChange={(e) =>
                              handleUpdateSessionRow(index, 'note', e.target.value)
                            }
                            className="w-full text-slate-600 bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:bg-white focus:border-indigo-500 focus:outline-hidden text-xs"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            onClick={() => handleDeleteSessionRow(index)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Xóa buổi này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-xs">
                Chưa có dữ liệu buổi học nào. Hãy tải ảnh sổ học tập hoặc chọn một mẫu demo ở Bước 1!
              </div>
            )}
          </div>

          {/* Section 3: Target Application & Merge Strategy */}
          <div className="space-y-4 pt-2 border-t border-slate-100 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Bước 3: Chọn học viên nhận dữ liệu & Phương thức áp dụng
            </label>

            {/* Target Mode Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  targetMode === 'existing'
                    ? 'bg-indigo-50/80 border-indigo-400 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="targetMode"
                  checked={targetMode === 'existing'}
                  onChange={() => setTargetMode('existing')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Áp dụng vào học viên đang có trong Studio
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Cập nhật vào bảng 24 buổi của học viên đã đăng ký
                  </p>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  targetMode === 'new'
                    ? 'bg-indigo-50/80 border-indigo-400 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="targetMode"
                  checked={targetMode === 'new'}
                  onChange={() => setTargetMode('new')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Tạo học viên mới từ kết quả quét ảnh này
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Thêm ngay hồ sơ mới kèm lộ trình học vừa quét được
                  </p>
                </div>
              </label>
            </div>

            {/* Target Form */}
            {targetMode === 'existing' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chọn học viên đích:
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.instrument}) • {st.phone} • {st.packageType || '24 buổi'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phương thức hợp nhất (Merge Strategy):
                  </label>
                  <select
                    value={mergeStrategy}
                    onChange={(e) => setMergeStrategy(e.target.value as ImportMergeStrategy)}
                    className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="update_by_stt">
                      Cập nhật theo số buổi (STT) - Giữ nguyên các buổi khác (Khuyên dùng)
                    </option>
                    <option value="overwrite">
                      Ghi đè toàn bộ danh sách buổi học của học viên
                    </option>
                    <option value="append">
                      Nối tiếp vào sau các buổi học hiện có
                    </option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ Tên học viên mới:
                  </label>
                  <input
                    type="text"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="VD: Nguyễn Minh Anh"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại:
                  </label>
                  <input
                    type="text"
                    value={newStudentPhone}
                    onChange={(e) => setNewStudentPhone(e.target.value)}
                    placeholder="VD: 0912 345 678"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bộ môn:
                  </label>
                  <select
                    value={newStudentInstrument}
                    onChange={(e) => setNewStudentInstrument(e.target.value as InstrumentType)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                  >
                    {INSTRUMENTS.map((inst) => (
                      <option key={inst} value={inst}>
                        {inst}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-400" />
            <span>
              {extractedSessions.length > 0
                ? `Sẵn sàng nạp ${extractedSessions.length} buổi học vào ${
                    targetMode === 'existing'
                      ? currentStudent?.name || 'học viên đã chọn'
                      : newStudentName || 'học viên mới'
                  }`
                : 'Chưa có buổi học nào được quét'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleConfirmApply}
              disabled={extractedSessions.length === 0 || isLoading}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác nhận áp dụng vào Lớp học</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
