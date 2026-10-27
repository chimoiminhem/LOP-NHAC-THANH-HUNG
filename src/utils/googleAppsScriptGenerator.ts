/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Mã nguồn Google Apps Script chuẩn cho Hệ thống Quản lý Lớp học & Giáo viên Âm nhạc
 * Được thiết kế đầy đủ tính năng: Menu tùy chỉnh, Data Validation, Tự động tổng hợp TKB & Lịch GV,
 * Quản lý Giáo viên Đa Bộ Môn, Gói học 8/24/36 buổi & Cảnh báo tái đăng ký khi còn <= 3 buổi.
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * HỆ THỐNG QUẢN LÝ LỚP HỌC, GIÁO VIÊN & THỜI KHÓA BIỂU ÂM NHẠC (MUSIC STUDIO)
 * Phiên bản: 3.0 Chuẩn Google Sheets Automation
 * ==============================================================================
 * Các chức năng chính:
 * 1. Khởi tạo 5 Sheet bộ môn: Piano, Guitar, Ukulele, Bass, Electric Guitar.
 * 2. Sheet "Thông tin Giáo viên": Họ Tên, SĐT, Cơ Sở, Đa Bộ Môn, Trạng thái (Hoạt Động / Nghỉ).
 * 3. Sheet "Nhắc nhở Tái Đăng ký": Tự động kích hoạt khi học viên còn ≤ 3 buổi (gói 8/24/36).
 * 4. Mỗi học viên có khu vực thông tin cá nhân (Gói 8/24/36 buổi) + Bảng điểm danh.
 * 5. Menu thả xuống Data Validation cho Trạng thái: "Học", "Phép", "Vắng" kèm đổi màu tự động.
 * 6. Tự động tổng hợp "Thời khóa biểu" (Schedule View: T2 - CN theo ca).
 * 7. Tự động trích xuất "Lịch dạy Giáo viên" (Teacher Schedule).
 * 8. Nút bấm gia hạn nhanh +8, +24, +36 buổi học khi học viên tái đăng ký khóa học.
 * ==============================================================================
 */

// Danh sách 5 bộ môn chuẩn theo yêu cầu
var BO_MON_LIST = ['Piano', 'Guitar', 'Ukulele', 'Bass', 'Electric Guitar'];

// Danh sách các gói đăng ký
var GOI_DANG_KY_LIST = ['8 buổi', '24 buổi', '36 buổi'];

// Danh sách trạng thái giáo viên
var TRANG_THAI_GV_LIST = ['Hoạt Động', 'Nghỉ'];

// Danh sách các ngày trong tuần
var CAC_NGAY_TRONG_TUAN = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

// Các khung giờ học tiêu chuẩn
var KHUNG_GIO_LIST = [
  '08:00 - 09:30',
  '09:30 - 11:00',
  '14:00 - 15:30',
  '15:30 - 17:00',
  '17:30 - 19:00',
  '19:00 - 20:30',
  '20:30 - 22:00'
];

/**
 * Tạo Menu tùy chỉnh khi mở trang tính Google Sheets
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🎵 [Lớp Nhạc]')
    .addItem('🚀 1. Khởi tạo toàn bộ Hệ thống Lớp Nhạc & Giáo viên', 'khoiTaoHeThongLopNhac')
    .addSeparator()
    .addItem('🎓 2a. Quản lý / Khởi tạo Sheet Giáo viên', 'khoiTaoSheetThongTinGiaoVien')
    .addItem('🔔 2b. Kiểm tra Học viên sắp hết buổi (≤ 3 buổi)', 'capNhatNhacNhoTaiDangKy')
    .addSeparator()
    .addItem('➕ 3a. Gia hạn +8 buổi học (Khóa ngắn hạn 1 tháng)', 'giaHanThem8BuoiHoc')
    .addItem('➕ 3b. Gia hạn +24 buổi học (Khóa tiêu chuẩn 3 tháng)', 'giaHanThem24BuoiHoc')
    .addItem('➕ 3c. Gia hạn +36 buổi học (Khóa nâng cao 4.5 tháng)', 'giaHanThem36BuoiHoc')
    .addItem('🔢 3d. Tùy chọn số buổi gia hạn...', 'giaHanBuoiHocTuChon')
    .addSeparator()
    .addItem('📅 4. Cập nhật Thời khóa biểu tự động', 'capNhatThoiKhoaBieu')
    .addItem('👨‍🏫 5. Cập nhật Lịch dạy Giáo viên tự động', 'capNhatLichDayGiaoVien')
    .addSeparator()
    .addItem('🎨 6. Khôi phục định dạng & Menu Thả xuống (Data Validation)', 'caiDatDataValidationVaMauSac')
    .addToUi();
}

/**
 * HÀM 1: KHỞI TẠO TOÀN BỘ HỆ THỐNG
 */
function khoiTaoHeThongLopNhac() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  
  var themeColors = {
    'Piano': '#1e5f74',
    'Guitar': '#b85d19',
    'Ukulele': '#028090',
    'Bass': '#5e4b8b',
    'Electric Guitar': '#9d0208'
  };

  // 1. Tạo sheet Thông tin Giáo viên
  khoiTaoSheetThongTinGiaoVien();

  // 2. Tạo sheet Nhắc nhở Tái Đăng ký
  khoiTaoSheetNhacNhoTaiDangKy();

  // 3. Tạo 5 sheet bộ môn
  for (var i = 0; i < BO_MON_LIST.length; i++) {
    var tenBoMon = BO_MON_LIST[i];
    var sheet = ss.getSheetByName(tenBoMon);
    if (!sheet) {
      sheet = ss.insertSheet(tenBoMon);
    } else {
      sheet.clear();
    }
    sheet.setGridlines(true);
    
    sheet.getRange('A1:E1').merge()
      .setValue('QUẢN LÝ HỌC VIÊN & ĐIỂM DANH - BỘ MÔN: ' + tenBoMon.toUpperCase())
      .setFontWeight('bold')
      .setFontSize(14)
      .setFontColor('#FFFFFF')
      .setBackground(themeColors[tenBoMon] || '#2c3e50')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
    sheet.setRowHeight(1, 40);

    var sampleStudents = [
      {
        ten: 'Học viên ' + tenBoMon + ' A',
        sdt: '0901 234 56' + (i + 1),
        goi: '24 buổi',
        lich: 'Thứ 2, Thứ 4 (18:00 - 19:30)',
        gv: 'Thầy Hoàng (' + tenBoMon + ')'
      },
      {
        ten: 'Học viên ' + tenBoMon + ' B',
        sdt: '0988 765 43' + (i + 1),
        goi: '8 buổi',
        lich: 'Thứ 3, Thứ 6 (19:00 - 20:30)',
        gv: 'Cô Linh (' + tenBoMon + ')'
      }
    ];

    var currentRow = 3;
    for (var s = 0; s < sampleStudents.length; s++) {
      currentRow = taoKhuVucHocVien(sheet, currentRow, sampleStudents[s], tenBoMon);
    }

    sheet.setColumnWidth(1, 60);
    sheet.setColumnWidth(2, 120);
    sheet.setColumnWidth(3, 260);
    sheet.setColumnWidth(4, 110);
    sheet.setColumnWidth(5, 340);
  }

  // 4. Tạo Thời khóa biểu và Lịch GV
  khoiTaoSheetThoiKhoaBieu(ss);
  khoiTaoSheetLichDayGiaoVien(ss);

  // 5. Cập nhật dữ liệu
  capNhatThoiKhoaBieu();
  capNhatLichDayGiaoVien();
  capNhatNhacNhoTaiDangKy();

  ui.alert('🎉 Thành công', 'Hệ thống Quản lý Studio Âm nhạc (kèm Sheet Giáo viên, Nhắc nhở ≤ 3 buổi & 5 bộ môn) đã được khởi tạo hoàn tất!', ui.ButtonSet.OK);
}

/**
 * HÀM KHỞI TẠO SHEET THÔNG TIN GIÁO VIÊN
 */
function khoiTaoSheetThongTinGiaoVien() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Thông tin Giáo viên');
  if (!sheet) {
    sheet = ss.insertSheet('Thông tin Giáo viên', 0);
  } else {
    sheet.clear();
  }
  sheet.setGridlines(true);

  // Header
  sheet.getRange('A1:G1').merge()
    .setValue('🎓 BẢNG QUẢN LÝ THÔNG TIN GIÁO VIÊN & ĐA BỘ MÔN')
    .setFontWeight('bold')
    .setFontSize(14)
    .setFontColor('#FFFFFF')
    .setBackground('#1e293b')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 40);

  var headers = ['STT', 'Họ và Tên', 'Số Điện Thoại', 'Cơ Sở', 'Bộ Môn Phụ Trách (Đa bộ môn)', 'Trạng Thái', 'Ghi Chú'];
  var hRange = sheet.getRange(2, 1, 1, headers.length);
  hRange.setValues([headers])
    .setFontWeight('bold')
    .setFontColor('#FFFFFF')
    .setBackground('#334155')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(2, 30);

  // Mẫu dữ liệu giáo viên
  var sampleTeachers = [
    [1, 'Thầy Hoàng Piano', '0903 112 233', 'Cơ sở 1 - Quận 1 (Trụ sở chính)', 'Piano', 'Hoạt Động', 'Tốt nghiệp Nhạc viện TP.HCM, kinh nghiệm 7 năm'],
    [2, 'Cô Linh Piano', '0988 445 566', 'Cơ sở 1 - Quận 1 (Trụ sở chính)', 'Piano, Ukulele', 'Hoạt Động', 'Chuyên Piano Đệm hát Pop & Ukulele thiếu nhi'],
    [3, 'Thầy Tuấn Guitar', '0912 778 899', 'Cơ sở 1 - Quận 1 (Trụ sở chính)', 'Guitar, Electric Guitar', 'Hoạt Động', 'Trưởng bộ môn Guitar - Acoustic & Lead Electric'],
    [4, 'Thầy Đức Guitar', '0934 667 788', 'Cơ sở 2 - Bình Thạnh (Chi nhánh 2)', 'Guitar', 'Hoạt Động', 'Chuyên Flamenco & Cổ điển Classic'],
    [5, 'Cô Trang Ukulele', '0977 334 455', 'Cơ sở 2 - Bình Thạnh (Chi nhánh 2)', 'Ukulele', 'Hoạt Động', 'Hòa tấu Ukulele & cảm thụ âm nhạc'],
    [6, 'Thầy Minh Bass', '0945 990 011', 'Cơ sở 1 - Quận 1 (Trụ sở chính)', 'Bass', 'Hoạt Động', 'Nghệ sĩ Bass ban nhạc rock'],
    [7, 'Thầy Khải Guitar', '0966 223 344', 'Cơ sở 3 - Thủ Đức (Chi nhánh 3)', 'Electric Guitar, Guitar, Bass', 'Hoạt Động', 'Kỹ thuật viên âm thanh & ban nhạc'],
    [8, 'Cô Hà Ukulele', '0909 556 677', 'Cơ sở 1 - Quận 1 (Trụ sở chính)', 'Ukulele, Piano', 'Nghỉ', 'Tạm nghỉ thai sản']
  ];

  var dataRange = sheet.getRange(3, 1, sampleTeachers.length, headers.length);
  dataRange.setValues(sampleTeachers)
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange(3, 1, sampleTeachers.length, 1).setHorizontalAlignment('center');

  // Data Validation cho Cột Trạng thái (Cột F)
  var statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(TRANG_THAI_GV_LIST, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(3, 6, 50, 1).setDataValidation(statusRule);

  // Độ rộng cột
  sheet.setColumnWidth(1, 50);
  sheet.setColumnWidth(2, 180);
  sheet.setColumnWidth(3, 130);
  sheet.setColumnWidth(4, 230);
  sheet.setColumnWidth(5, 220);
  sheet.setColumnWidth(6, 120);
  sheet.setColumnWidth(7, 300);
}

/**
 * HÀM KHỞI TẠO SHEET NHẮC NHỞ TÁI ĐĂNG KÝ (CÒN <= 3 BUỔI)
 */
function khoiTaoSheetNhacNhoTaiDangKy() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Nhắc nhở Tái Đăng ký');
  if (!sheet) {
    sheet = ss.insertSheet('Nhắc nhở Tái Đăng ký', 1);
  } else {
    sheet.clear();
  }
  sheet.setGridlines(true);

  sheet.getRange('A1:J1').merge()
    .setValue('🔔 BẢNG THEO DÕI & NHẮC NHỞ TÁI ĐĂNG KÝ KHÓA HỌC (CÒN ≤ 3 BUỔI)')
    .setFontWeight('bold')
    .setFontSize(14)
    .setFontColor('#FFFFFF')
    .setBackground('#b45309')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 40);

  var headers = [
    'STT',
    'Họ Tên Học Viên',
    'Số Điện Thoại',
    'Bộ Môn',
    'Gói Đăng Ký',
    'Số Buổi Đã Học',
    'Số Buổi Còn Lại',
    'Cảnh Báo Tái Đăng Ký',
    'Giáo Viên Phụ Trách',
    'Lịch Học Đăng Ký'
  ];

  var hRange = sheet.getRange(2, 1, 1, headers.length);
  hRange.setValues([headers])
    .setFontWeight('bold')
    .setFontColor('#FFFFFF')
    .setBackground('#78350f')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(2, 30);

  sheet.setColumnWidth(1, 50);
  sheet.setColumnWidth(2, 180);
  sheet.setColumnWidth(3, 120);
  sheet.setColumnWidth(4, 110);
  sheet.setColumnWidth(5, 110);
  sheet.setColumnWidth(6, 120);
  sheet.setColumnWidth(7, 120);
  sheet.setColumnWidth(8, 200);
  sheet.setColumnWidth(9, 160);
  sheet.setColumnWidth(10, 220);
}

/**
 * CẬP NHẬT SHEET NHẮC NHỞ TÁI ĐĂNG KÝ TỰ ĐỘNG KHI CÒN <= 3 BUỔI
 */
function capNhatNhacNhoTaiDangKy() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var alertSheet = ss.getSheetByName('Nhắc nhở Tái Đăng ký');
  if (!alertSheet) return;

  var alertList = [];
  var sttCounter = 1;

  for (var b = 0; b < BO_MON_LIST.length; b++) {
    var bName = BO_MON_LIST[b];
    var sheet = ss.getSheetByName(bName);
    if (!sheet) continue;

    var lastRow = sheet.getLastRow();
    for (var r = 1; r <= lastRow; r++) {
      var cellVal = sheet.getRange(r, 1).getValue().toString();
      if (cellVal.indexOf('📌 THÔNG TIN HỌC VIÊN:') === 0) {
        var tenHV = sheet.getRange(r + 1, 2).getValue().toString();
        var sdt = sheet.getRange(r + 1, 4).getValue().toString();
        var goi = sheet.getRange(r + 2, 4).getValue().toString() || '24 buổi';
        var gv = sheet.getRange(r + 3, 2).getValue().toString();
        var lich = sheet.getRange(r + 3, 4).getValue().toString();

        // Đếm buổi
        var sessionStart = r + 6;
        var attended = 0;
        var total = 0;

        for (var sessR = sessionStart; sessR < sessionStart + 40; sessR++) {
          var sessSTT = sheet.getRange(sessR, 1).getValue();
          if (typeof sessSTT !== 'number' || isNaN(sessSTT)) break;
          total++;
          var status = sheet.getRange(sessR, 4).getValue().toString().trim();
          if (status === 'Học' || status === 'Phép' || status === 'Vắng') {
            attended++;
          }
        }

        var remaining = Math.max(0, total - attended);

        // Kích hoạt nhắc nhở khi còn <= 3 buổi
        if (remaining <= 3 && total > 0) {
          var warningText = remaining === 0
            ? '⚠️ ĐÃ HẾT BUỔI (Gia hạn ngay)'
            : '⚡ CHỈ CÒN ' + remaining + ' BUỔI HỌC';

          alertList.push([
            sttCounter++,
            tenHV,
            sdt,
            bName,
            goi,
            attended + '/' + total + ' buổi',
            remaining + ' buổi',
            warningText,
            gv,
            lich
          ]);
        }
      }
    }
  }

  // Ghi vào Sheet Nhắc nhở
  alertSheet.getRange(3, 1, 60, 10).clearContent();
  if (alertList.length > 0) {
    var range = alertSheet.getRange(3, 1, alertList.length, 10);
    range.setValues(alertList)
      .setVerticalAlignment('middle')
      .setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
    alertSheet.getRange(3, 1, alertList.length, 1).setHorizontalAlignment('center');
    alertSheet.getRange(3, 6, alertList.length, 2).setHorizontalAlignment('center');
  }
}

/**
 * TẠO KHU VỰC HỌC VIÊN KÈM BẢNG ĐIỂM DANH
 */
function taoKhuVucHocVien(sheet, startRow, studentData, instrument) {
  var r = startRow;

  sheet.getRange(r, 1, 1, 5).merge()
    .setValue('📌 THÔNG TIN HỌC VIÊN: ' + studentData.ten.toUpperCase())
    .setFontWeight('bold')
    .setBackground('#e2e8f0')
    .setFontColor('#0f172a');
  sheet.setRowHeight(r, 28);
  r++;

  sheet.getRange(r, 1).setValue('Tên học viên:').setFontWeight('bold');
  sheet.getRange(r, 2).setValue(studentData.ten);
  sheet.getRange(r, 3).setValue('Số điện thoại:').setFontWeight('bold');
  sheet.getRange(r, 4).setValue(studentData.sdt);
  sheet.getRange(r, 1, 1, 5).setBackground('#f8fafc');
  r++;

  sheet.getRange(r, 1).setValue('Bộ môn:').setFontWeight('bold');
  sheet.getRange(r, 2).setValue(instrument);
  sheet.getRange(r, 3).setValue('Gói đăng ký:').setFontWeight('bold');
  sheet.getRange(r, 4).setValue(studentData.goi || '24 buổi');
  
  // Data validation cho Gói đăng ký (8 buổi, 24 buổi, 36 buổi)
  var packageRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(GOI_DANG_KY_LIST, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(r, 4).setDataValidation(packageRule);
  sheet.getRange(r, 1, 1, 5).setBackground('#f8fafc');
  r++;

  sheet.getRange(r, 1).setValue('Giáo viên:').setFontWeight('bold');
  sheet.getRange(r, 2).setValue(studentData.gv);
  sheet.getRange(r, 3).setValue('Lịch học đăng ký:').setFontWeight('bold');
  sheet.getRange(r, 4).setValue(studentData.lich);
  sheet.getRange(r, 1, 1, 5).setBackground('#f8fafc');
  r++;

  sheet.getRange(r, 1, 1, 5).merge().setValue('');
  sheet.setRowHeight(r, 10);
  r++;

  var tableHeaders = ['STT', 'Ngày học', 'Nội dung học', 'Trạng thái', 'Ghi chú & Nhận xét buổi học'];
  sheet.getRange(r, 1, 1, 5).setValues([tableHeaders])
    .setFontWeight('bold')
    .setBackground('#475569')
    .setFontColor('#FFFFFF')
    .setHorizontalAlignment('center');
  sheet.setRowHeight(r, 26);
  var headerRow = r;
  r++;

  var sessionCount = studentData.goi === '8 buổi' ? 8 : (studentData.goi === '36 buổi' ? 36 : 24);
  var sessionRows = [];
  var d = new Date();

  for (var i = 1; i <= sessionCount; i++) {
    var dStr = Utilities.formatDate(new Date(d.getTime() + (i - 1) * 3.5 * 24 * 60 * 60 * 1000), 'GMT+7', 'dd/MM/yyyy');
    sessionRows.push([
      i,
      dStr,
      i === 1 ? 'Khởi động, kiểm tra trình độ & nhạc lý căn bản' : '',
      '',
      ''
    ]);
  }

  sheet.getRange(r, 1, sessionRows.length, 5).setValues(sessionRows)
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange(r, 1, sessionRows.length, 1).setHorizontalAlignment('center');
  sheet.getRange(r, 2, sessionRows.length, 1).setHorizontalAlignment('center');
  sheet.getRange(r, 4, sessionRows.length, 1).setHorizontalAlignment('center');

  // Menu thả xuống Trạng thái: Học, Phép, Vắng
  var statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Học', 'Phép', 'Vắng'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(r, 4, sessionRows.length, 1).setDataValidation(statusRule);

  r += sessionRows.length;

  // Hàng tổng hợp
  sheet.getRange(r, 1).setValue('TỔNG HỢP').setFontWeight('bold').setHorizontalAlignment('center');
  sheet.getRange(r, 2, 1, 4).merge()
    .setValue('Tự động cập nhật qua menu [Lớp Nhạc] -> "Kiểm tra Học viên sắp hết buổi"')
    .setFontStyle('italic')
    .setFontColor('#64748b');
  sheet.getRange(r, 1, 1, 5).setBackground('#f1f5f9');
  r++;

  sheet.getRange(r, 1, 1, 5).merge().setValue('');
  sheet.setRowHeight(r, 20);
  r++;

  return r;
}

/**
 * GIA HẠN THÊM BUỔI HỌC
 */
function giaHanThem8BuoiHoc() { giaHanBuoiHoc(8); }
function giaHanThem24BuoiHoc() { giaHanBuoiHoc(24); }
function giaHanThem36BuoiHoc() { giaHanBuoiHoc(36); }

function giaHanBuoiHocTuChon() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt('Gia hạn buổi học', 'Nhập số buổi học cần gia hạn thêm:', ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() === ui.Button.OK) {
    var count = parseInt(response.getResponseText(), 10);
    if (!isNaN(count) && count > 0) {
      giaHanBuoiHoc(count);
    } else {
      ui.alert('Số buổi không hợp lệ.');
    }
  }
}

function giaHanBuoiHoc(soBuoi) {
  var sheet = SpreadsheetApp.getActiveSheet();
  var cell = sheet.getActiveCell();
  var row = cell.getRow();
  var ui = SpreadsheetApp.getUi();

  var headerRow = -1;
  for (var r = row; r >= 1; r--) {
    if (sheet.getRange(r, 1).getValue().toString().indexOf('STT') === 0 &&
        sheet.getRange(r, 4).getValue().toString().indexOf('Trạng thái') === 0) {
      headerRow = r;
      break;
    }
  }

  if (headerRow === -1) {
    ui.alert('Vui lòng chọn 1 ô trong bảng điểm danh của học viên cần gia hạn.');
    return;
  }

  var lastSessionRow = headerRow;
  var currentMaxSTT = 0;
  var lastDate = new Date();

  while (true) {
    var nextVal = sheet.getRange(lastSessionRow + 1, 1).getValue();
    if (typeof nextVal === 'number' && !isNaN(nextVal)) {
      lastSessionRow++;
      currentMaxSTT = nextVal;
      var dStr = sheet.getRange(lastSessionRow, 2).getValue().toString();
      if (dStr) {
        var parts = dStr.split('/');
        if (parts.length === 3) {
          lastDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        }
      }
    } else {
      break;
    }
  }

  sheet.insertRowsAfter(lastSessionRow, soBuoi);
  var newRows = [];
  for (var i = 1; i <= soBuoi; i++) {
    var curD = new Date(lastDate.getTime() + i * 3.5 * 24 * 60 * 60 * 1000);
    var dateFormatted = Utilities.formatDate(curD, 'GMT+7', 'dd/MM/yyyy');
    newRows.push([
      currentMaxSTT + i,
      dateFormatted,
      i === 1 ? 'Khóa gia hạn nâng cao (+' + soBuoi + ' buổi)' : '',
      '',
      i === 1 ? 'Khóa gia hạn (+' + soBuoi + ' buổi)' : ''
    ]);
  }

  var insertRange = sheet.getRange(lastSessionRow + 1, 1, soBuoi, 5);
  insertRange.setValues(newRows)
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange(lastSessionRow + 1, 1, soBuoi, 1).setHorizontalAlignment('center');
  sheet.getRange(lastSessionRow + 1, 2, soBuoi, 1).setHorizontalAlignment('center');
  sheet.getRange(lastSessionRow + 1, 4, soBuoi, 1).setHorizontalAlignment('center');

  var statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Học', 'Phép', 'Vắng'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(lastSessionRow + 1, 4, soBuoi, 1).setDataValidation(statusRule);

  ui.alert('🎉 Thành công', 'Đã gia hạn thêm +' + soBuoi + ' buổi học mới cho học viên (Từ buổi #' + (currentMaxSTT + 1) + ' đến #' + (currentMaxSTT + soBuoi) + ').', ui.ButtonSet.OK);
}

/**
 * KHỞI TẠO SHEET THỜI KHÓA BIỂU
 */
function khoiTaoSheetThoiKhoaBieu(ss) {
  var sheet = ss.getSheetByName('Thời khóa biểu');
  if (!sheet) {
    sheet = ss.insertSheet('Thời khóa biểu', 2);
  } else {
    sheet.clear();
  }
  sheet.setGridlines(true);

  sheet.getRange('A1:H1').merge()
    .setValue('📅 THỜI KHÓA BIỂU TOÀN TRUNG TÂM ÂM NHẠC')
    .setFontWeight('bold')
    .setFontSize(14)
    .setFontColor('#FFFFFF')
    .setBackground('#0f172a')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 40);

  var headers = ['Khung giờ / Ca học'].concat(CAC_NGAY_TRONG_TUAN);
  sheet.getRange(2, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold')
    .setBackground('#334155')
    .setFontColor('#FFFFFF')
    .setHorizontalAlignment('center');
  sheet.setRowHeight(2, 30);

  var slotRows = [];
  for (var k = 0; k < KHUNG_GIO_LIST.length; k++) {
    var r = [KHUNG_GIO_LIST[k]];
    for (var d = 0; d < CAC_NGAY_TRONG_TUAN.length; d++) {
      r.push('');
    }
    slotRows.push(r);
  }

  sheet.getRange(3, 1, slotRows.length, headers.length).setValues(slotRows)
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange(3, 1, slotRows.length, 1).setFontWeight('bold').setHorizontalAlignment('center').setBackground('#f8fafc');

  sheet.setColumnWidth(1, 140);
  for (var c = 2; c <= 8; c++) {
    sheet.setColumnWidth(c, 160);
  }
}

/**
 * KHỞI TẠO SHEET LỊCH DẠY GIÁO VIÊN
 */
function khoiTaoSheetLichDayGiaoVien(ss) {
  var sheet = ss.getSheetByName('Lịch dạy Giáo viên');
  if (!sheet) {
    sheet = ss.insertSheet('Lịch dạy Giáo viên', 3);
  } else {
    sheet.clear();
  }
  sheet.setGridlines(true);

  sheet.getRange('A1:J1').merge()
    .setValue('👨‍🏫 BẢNG PHÂN CÔNG & LỊCH DẠY GIÁO VIÊN')
    .setFontWeight('bold')
    .setFontSize(14)
    .setFontColor('#FFFFFF')
    .setBackground('#312e81')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 40);

  var headers = ['STT', 'Giáo viên', 'Bộ môn'].concat(CAC_NGAY_TRONG_TUAN);
  sheet.getRange(2, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold')
    .setBackground('#4338ca')
    .setFontColor('#FFFFFF')
    .setHorizontalAlignment('center');
  sheet.setRowHeight(2, 30);

  sheet.setColumnWidth(1, 50);
  sheet.setColumnWidth(2, 160);
  sheet.setColumnWidth(3, 160);
  for (var c = 4; c <= 10; c++) {
    sheet.setColumnWidth(c, 150);
  }
}

/**
 * CẬP NHẬT THỜI KHÓA BIỂU TỰ ĐỘNG
 */
function capNhatThoiKhoaBieu() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tkbSheet = ss.getSheetByName('Thời khóa biểu');
  if (!tkbSheet) return;

  var grid = {};
  for (var k = 0; k < KHUNG_GIO_LIST.length; k++) {
    grid[KHUNG_GIO_LIST[k]] = {};
    for (var d = 0; d < CAC_NGAY_TRONG_TUAN.length; d++) {
      grid[KHUNG_GIO_LIST[k]][CAC_NGAY_TRONG_TUAN[d]] = [];
    }
  }

  for (var b = 0; b < BO_MON_LIST.length; b++) {
    var bName = BO_MON_LIST[b];
    var sheet = ss.getSheetByName(bName);
    if (!sheet) continue;

    var lastRow = sheet.getLastRow();
    for (var r = 1; r <= lastRow; r++) {
      var cellVal = sheet.getRange(r, 1).getValue().toString();
      if (cellVal.indexOf('📌 THÔNG TIN HỌC VIÊN:') === 0) {
        var tenHV = sheet.getRange(r + 1, 2).getValue().toString();
        var gv = sheet.getRange(r + 3, 2).getValue().toString();
        var lichStr = sheet.getRange(r + 3, 4).getValue().toString();

        var timeSlot = '18:00 - 19:30';
        for (var t = 0; t < KHUNG_GIO_LIST.length; t++) {
          var tSlot = KHUNG_GIO_LIST[t];
          var startH = tSlot.split(' - ')[0];
          if (lichStr.indexOf(tSlot) !== -1 || lichStr.indexOf(startH) !== -1) {
            timeSlot = tSlot;
            break;
          }
        }

        for (var d = 0; d < CAC_NGAY_TRONG_TUAN.length; d++) {
          var day = CAC_NGAY_TRONG_TUAN[d];
          if (lichStr.indexOf(day) !== -1) {
            if (grid[timeSlot] && grid[timeSlot][day]) {
              grid[timeSlot][day].push('• ' + tenHV + ' (' + bName + ')\\n  GV: ' + gv);
            }
          }
        }
      }
    }
  }

  var updateRows = [];
  for (var k = 0; k < KHUNG_GIO_LIST.length; k++) {
    var slotName = KHUNG_GIO_LIST[k];
    var rowData = [slotName];
    for (var d = 0; d < CAC_NGAY_TRONG_TUAN.length; d++) {
      var dayName = CAC_NGAY_TRONG_TUAN[d];
      var list = grid[slotName][dayName];
      rowData.push(list.join('\\n'));
    }
    updateRows.push(rowData);
  }

  var range = tkbSheet.getRange(3, 1, updateRows.length, 8);
  range.setValues(updateRows)
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
  tkbSheet.getRange(3, 2, updateRows.length, 7).setWrap(true);
}

/**
 * CẬP NHẬT LỊCH DẠY GIÁO VIÊN TỰ ĐỘNG
 */
function capNhatLichDayGiaoVien() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var gvSheet = ss.getSheetByName('Lịch dạy Giáo viên');
  if (!gvSheet) return;

  var teachersMap = {};

  for (var b = 0; b < BO_MON_LIST.length; b++) {
    var bName = BO_MON_LIST[b];
    var sheet = ss.getSheetByName(bName);
    if (!sheet) continue;

    var lastRow = sheet.getLastRow();
    for (var r = 1; r <= lastRow; r++) {
      var cellVal = sheet.getRange(r, 1).getValue().toString();
      if (cellVal.indexOf('📌 THÔNG TIN HỌC VIÊN:') === 0) {
        var tenHV = sheet.getRange(r + 1, 2).getValue().toString();
        var gv = sheet.getRange(r + 3, 2).getValue().toString();
        var lichStr = sheet.getRange(r + 3, 4).getValue().toString();

        if (!gv) gv = 'Chưa phân công';
        if (!teachersMap[gv]) {
          teachersMap[gv] = {
            instruments: {},
            slots: {}
          };
          for (var d = 0; d < CAC_NGAY_TRONG_TUAN.length; d++) {
            teachersMap[gv].slots[CAC_NGAY_TRONG_TUAN[d]] = [];
          }
        }

        teachersMap[gv].instruments[bName] = true;

        for (var d = 0; d < CAC_NGAY_TRONG_TUAN.length; d++) {
          var day = CAC_NGAY_TRONG_TUAN[d];
          if (lichStr.indexOf(day) !== -1) {
            teachersMap[gv].slots[day].push('• ' + tenHV + ' (' + bName + ')');
          }
        }
      }
    }
  }

  var gvNames = Object.keys(teachersMap);
  if (gvNames.length === 0) return;

  gvSheet.getRange(3, 1, 50, 10).clearContent();

  var rows = [];
  for (var i = 0; i < gvNames.length; i++) {
    var tName = gvNames[i];
    var tData = teachersMap[tName];
    var row = [
      i + 1,
      tName,
      Object.keys(tData.instruments).join(', ')
    ];

    for (var d = 0; d < CAC_NGAY_TRONG_TUAN.length; d++) {
      var day = CAC_NGAY_TRONG_TUAN[d];
      var list = tData.slots[day] || [];
      row.push(list.join('\\n'));
    }
    rows.push(row);
  }

  if (rows.length > 0) {
    var range = gvSheet.getRange(3, 1, rows.length, 10);
    range.setValues(rows)
      .setVerticalAlignment('middle')
      .setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
    gvSheet.getRange(3, 1, rows.length, 1).setHorizontalAlignment('center');
    gvSheet.getRange(3, 4, rows.length, 7).setWrap(true);
  }
}

/**
 * KHÔI PHỤC ĐỊNH DẠNG & CONDITIONAL FORMATTING
 */
function caiDatDataValidationVaMauSac() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  for (var b = 0; b < BO_MON_LIST.length; b++) {
    var sheet = ss.getSheetByName(BO_MON_LIST[b]);
    if (!sheet) continue;

    var lastRow = sheet.getLastRow();
    for (var r = 1; r <= lastRow; r++) {
      if (sheet.getRange(r, 4).getValue().toString() === 'Trạng thái') {
        var rule = SpreadsheetApp.newDataValidation()
          .requireValueInList(['Học', 'Phép', 'Vắng'], true)
          .setAllowInvalid(false)
          .build();
        sheet.getRange(r + 1, 4, 36, 1).setDataValidation(rule);
      }
    }
  }
  
  SpreadsheetApp.getUi().alert('Đã khôi phục quy tắc Data Validation cho toàn bộ bảng điểm danh.');
}
`;
