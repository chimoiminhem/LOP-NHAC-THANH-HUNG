/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student } from '../types/music';
import { createDefaultSessions } from '../utils/scheduleParser';

function makeSessionsWithProgress(
  startDate: string,
  totalSessionsCount: number,
  attendedCount: number,
  excusedCount: number,
  unexcusedCount: number,
  topics: string[]
) {
  const sessions = createDefaultSessions(totalSessionsCount, startDate);
  let currentIndex = 0;

  for (let i = 0; i < attendedCount && currentIndex < totalSessionsCount; i++) {
    sessions[currentIndex].status = 'Học';
    sessions[currentIndex].content = topics[i % topics.length] || `Luyện bài tập kỹ thuật buổi ${currentIndex + 1}`;
    currentIndex++;
  }

  for (let i = 0; i < excusedCount && currentIndex < totalSessionsCount; i++) {
    sessions[currentIndex].status = 'Phép';
    sessions[currentIndex].content = 'Ôn tập bài cũ tại nhà';
    sessions[currentIndex].note = 'Bận việc gia đình, xin phép trước';
    currentIndex++;
  }

  for (let i = 0; i < unexcusedCount && currentIndex < totalSessionsCount; i++) {
    sessions[currentIndex].status = 'Vắng';
    sessions[currentIndex].content = 'Tạm dừng buổi học';
    sessions[currentIndex].note = 'Vắng không phép';
    currentIndex++;
  }

  // Các buổi còn lại
  for (let i = currentIndex; i < totalSessionsCount; i++) {
    sessions[i].status = '';
    sessions[i].content = topics[i % topics.length] || `Lộ trình học buổi ${i + 1}`;
  }

  return sessions;
}

export const INITIAL_STUDENTS: Student[] = [
  // --- PIANO ---
  {
    id: 'piano-1',
    name: 'Nguyễn Minh Anh',
    phone: '0912 345 678',
    instrument: 'Piano',
    scheduleString: 'Thứ 2, Thứ 4 (18:00 - 19:30)',
    teacher: 'Thầy Hoàng Piano',
    startDate: '2026-07-01',
    room: 'Phòng Grand Piano 1',
    branch: 'Cơ sở 1 - Quận 1 (Trụ sở chính)',
    packageType: '24 buổi',
    feeStatus: 'Đã đóng',
    notes: 'Học viên có năng khiếu cổ điển, chuẩn bị thi Grade 3 - Sắp hoàn thành khóa 24 buổi (còn 2 buổi)',
    // 21 học + 1 phép = 22 buổi -> Còn 2 buổi
    sessions: makeSessionsWithProgress('2026-07-01', 24, 21, 1, 0, [
      'Khởi động Hanon 1-5, tư thế cổ tay',
      'Thang âm Đô trưởng & La thứ 2 quãng tám',
      'Etude Czerny Op.599 No.12',
      'Bản nhạc Fur Elise (đoản khúc 1)',
      'Phức điệu Bach Minuet in G',
      'Kỹ thuật đạp Pedal & dynamic p/f',
      'Luyện xướng âm & thị tấu nốt khóa Fa',
      'Sonatina Clementi Op.36 No.1',
      'Ghép hai tay & kiểm soát nhịp phách',
      'Diễn cảm và phrasing giai điệu',
      'Kiểm tra giữa kỳ 12 buổi',
      'Học tác phẩm River Flows In You',
    ]),
  },
  {
    id: 'piano-2',
    name: 'Trần Gia Hân',
    phone: '0988 123 456',
    instrument: 'Piano',
    scheduleString: 'Thứ 3, Thứ 6 (19:00 - 20:30)',
    teacher: 'Cô Linh Piano',
    startDate: '2026-09-15',
    room: 'Phòng Piano Upright 2',
    branch: 'Cơ sở 1 - Quận 1 (Trụ sở chính)',
    packageType: '24 buổi',
    feeStatus: 'Đã đóng',
    notes: 'Học viên đệm hát pop ballad',
    sessions: makeSessionsWithProgress('2026-09-15', 24, 8, 2, 0, [
      'Hợp âm cơ bản C, G, Am, F',
      'Quy luật bấm hợp âm đảo thế 1 & 2',
      'Tiết điệu Ballad 4/4 rải nốt cơ bản',
      'Bài tập đệm hát: Nàng Thơ',
      'Chuyển hợp âm 7: Cmaj7, Dm7, G7',
      'Kỹ thuật dạo đầu Intro & kết bài Outro',
      'Đệm hát kết hợp bè trầm Walking Bass',
      'Đệm hát ca khúc: Có Em Chờ',
    ]),
  },
  {
    id: 'piano-3',
    name: 'Lê Hoàng Yến',
    phone: '0938 777 999',
    instrument: 'Piano',
    scheduleString: 'Thứ 7, Chủ Nhật (10:00 - 11:30)',
    teacher: 'Cô Linh Piano',
    startDate: '2026-09-20',
    room: 'Phòng Piano Upright 1',
    branch: 'Cơ sở 2 - Bình Thạnh (Chi nhánh 2)',
    packageType: '8 buổi',
    feeStatus: 'Đã đóng',
    notes: 'Khóa trải nghiệm 8 buổi cho người mới bắt đầu',
    // 5 học + 0 = 5 buổi -> Còn 3 buổi
    sessions: makeSessionsWithProgress('2026-09-20', 8, 5, 0, 0, [
      'Làm quen bàn phím & tư thế ngồi chuẩn',
      'Tập nốt khóa Sol tay phải',
      'Tập nốt khóa Fa tay trái',
      'Ghép 2 tay bài Ode To Joy',
      'Bài đệm Twinkle Twinkle Little Star',
    ]),
  },

  // --- GUITAR ---
  {
    id: 'guitar-1',
    name: 'Lê Hoàng Nam',
    phone: '0903 889 911',
    instrument: 'Guitar',
    scheduleString: 'Thứ 2, Thứ 5 (17:30 - 19:00)',
    teacher: 'Thầy Tuấn Guitar',
    startDate: '2026-07-08',
    room: 'Phòng Acoustic 101',
    branch: 'Cơ sở 1 - Quận 1 (Trụ sở chính)',
    packageType: '24 buổi',
    feeStatus: 'Đã đóng',
    notes: 'Fingerstyle cơ bản - Sắp hết khóa 24 buổi (chỉ còn 1 buổi duy nhất)',
    // 22 học + 1 phép = 23 buổi -> Còn 1 buổi
    sessions: makeSessionsWithProgress('2026-07-08', 24, 22, 1, 0, [
      'Thế bấm tay trái & cách móc dây P-i-m-a',
      'Vòng hợp âm kinh điển C - Am - Dm - G',
      'Điệu Disco & Slow Rock',
      'Luyện ngón Spider Exercise tăng tốc độ',
      'Bài thực hành: Tuổi Hồng Thơ Ngây',
      'Kỹ thuật Palm Mute và Chặn F (F barre chord)',
      'Kỹ thuật Slap gõ thùng căn bản',
      'Tập tác phẩm Canon in D Fingerstyle',
      'Kiểm soát tạp âm dây buông',
      'Đánh hợp âm màu Sus2, Add9',
    ]),
  },
  {
    id: 'guitar-2',
    name: 'Phạm Đức Duy',
    phone: '0934 556 789',
    instrument: 'Guitar',
    scheduleString: 'Thứ 7, Chủ Nhật (09:30 - 11:00)',
    teacher: 'Thầy Đức Guitar',
    startDate: '2026-10-01',
    room: 'Phòng Acoustic 102',
    branch: 'Cơ sở 2 - Bình Thạnh (Chi nhánh 2)',
    packageType: '36 buổi',
    feeStatus: 'Đã đóng',
    notes: 'Khóa dài hạn 36 buổi định hướng biểu diễn Acoustic',
    sessions: makeSessionsWithProgress('2026-10-01', 36, 6, 0, 0, [
      'Cấu tạo đàn & chỉnh dây theo Tuner',
      'Thang âm Pentatonic âm giai ngũ cung',
      'Kỹ thuật Quạt chả Strumming 16 beat',
      'Đệm hát ca khúc: Diễm Xưa',
      'Hợp âm chặn Bm, F#m',
    ]),
  },

  // --- UKULELE ---
  {
    id: 'ukulele-1',
    name: 'Vũ Thảo My',
    phone: '0977 223 344',
    instrument: 'Ukulele',
    scheduleString: 'Thứ 4, Thứ 7 (15:30 - 17:00)',
    teacher: 'Cô Trang Ukulele',
    startDate: '2026-09-20',
    room: 'Phòng Ensembles 201',
    branch: 'Cơ sở 2 - Bình Thạnh (Chi nhánh 2)',
    packageType: '24 buổi',
    feeStatus: 'Đã đóng',
    notes: 'Học viên thiếu nhi, phụ huynh đồng hành',
    sessions: makeSessionsWithProgress('2026-09-20', 24, 7, 1, 0, [
      'Làm quen 4 dây Ukulele G-C-E-A',
      '3 hợp âm đầu tiên: C, F, G7',
      'Tiết tấu Calypso Strum vui nhộn',
      'Bài hát: Riptide',
      'Luyện ngón ngắt tiếng Chucking',
      'Bài hát: Can’t Help Falling In Love',
      'Song tấu Ukulele & hát theo nhịp',
    ]),
  },
  {
    id: 'ukulele-2',
    name: 'Đặng Bảo Châu',
    phone: '0918 990 011',
    instrument: 'Ukulele',
    scheduleString: 'Thứ 3, Thứ 5 (18:00 - 19:30)',
    teacher: 'Cô Trang Ukulele',
    startDate: '2026-10-05',
    room: 'Phòng Ensembles 201',
    branch: 'Cơ sở 2 - Bình Thạnh (Chi nhánh 2)',
    packageType: '8 buổi',
    feeStatus: 'Đã đóng',
    notes: 'Khóa trải nghiệm 8 buổi - Đã học 6 buổi (còn 2 buổi)',
    // 6 học -> Còn 2 buổi
    sessions: makeSessionsWithProgress('2026-10-05', 8, 6, 0, 0, [
      'Đọc Tab Ukulele & vị trí nốt phím đàn',
      'Giai điệu Happy Birthday Solo',
      'Kỹ thuật Hammer-on & Pull-off',
      'Bản nhạc: You Are My Sunshine Solo',
      'Luyện quạt chả Hawaii Strum',
      'Bài tập: Count On Me',
    ]),
  },

  // --- BASS ---
  {
    id: 'bass-1',
    name: 'Bùi Quang Khải',
    phone: '0945 678 123',
    instrument: 'Bass',
    scheduleString: 'Thứ 3, Thứ 6 (20:30 - 22:00)',
    teacher: 'Thầy Minh Bass',
    startDate: '2026-07-25',
    room: 'Phòng Band 301',
    branch: 'Cơ sở 1 - Quận 1 (Trụ sở chính)',
    packageType: '24 buổi',
    feeStatus: 'Đã đóng',
    notes: 'Chơi band nhạc rock sinh viên, tập trung groove & timing - Còn 3 buổi kết thúc khóa 24 buổi',
    // 20 học + 1 phép = 21 buổi -> Còn 3 buổi
    sessions: makeSessionsWithProgress('2026-07-25', 24, 20, 1, 0, [
      'Kỹ thuật tay phải 2 ngón Rest Stroke',
      'Căn chỉnh nhịp Metronome phách 1 và 3',
      'Walking Bassline thang âm Blues',
      'Kỹ thuật Slap & Pop căn bản',
      'Bài tập: Stand By Me Bassline',
      'Phân tích câu Bass funk 16th note',
      'Bài tập: Billie Jean Bass groove',
      'Mute tay trái & ngắt tiếng staccato',
      'Chạy Scale Arpeggio 1-3-5-7',
      'Phối hợp với Trống Kick Drum',
      'Ghép ban nhạc ca khúc: Khám Phá',
      'Tập bài rock: Tìm Lại (Microwave)',
    ]),
  },

  // --- ELECTRIC GUITAR ---
  {
    id: 'electric-1',
    name: 'Ngô Quốc Bảo',
    phone: '0938 112 334',
    instrument: 'Electric Guitar',
    scheduleString: 'Thứ 4, Thứ 7 (19:00 - 20:30)',
    teacher: 'Thầy Tuấn Guitar',
    startDate: '2026-06-20',
    room: 'Phòng Band 302',
    branch: 'Cơ sở 1 - Quận 1 (Trụ sở chính)',
    packageType: '24 buổi',
    feeStatus: 'Đã đóng',
    notes: 'Luyện solo Lead Rock & sử dụng Pedal Overdrive/Delay - ĐÃ HOÀN THÀNH 24/24 BUỔI (Cần gia hạn ngay)',
    // 24 học = 24 buổi -> Còn 0 buổi (Expired / Hết số buổi)
    sessions: makeSessionsWithProgress('2026-06-20', 24, 23, 1, 0, [
      'Kỹ thuật Alternate Picking tay phải',
      'Kỹ thuật Bending nửa cung & 1 cung chuẩn cao độ',
      'Vibrato ngón tay & rung cần nhún Tremolo',
      'Âm giai Minor Pentatonic 5 Box thế bấm',
      'Riff kinh điển: Smoke On The Water & Back In Black',
      'Kỹ thuật Sweep Picking 3 dây',
      'Tập Solo ca khúc: Hotel California (câu 1-4)',
      'Cân chỉnh âm sắc Amp & Effect Pedalboard',
      'Kỹ thuật Tapping 2 tay kiểu Van Halen',
      'Ứng tấu Solo trên nền nhạc backing track',
      'Tập câu Solo: Sweet Child O Mine Intro',
    ]),
  },
  {
    id: 'electric-2',
    name: 'Võ Minh Trí',
    phone: '0966 778 899',
    instrument: 'Electric Guitar',
    scheduleString: 'Thứ 2, Thứ 6 (14:00 - 15:30)',
    teacher: 'Thầy Khải Guitar',
    startDate: '2026-09-25',
    room: 'Phòng Band 302',
    branch: 'Cơ sở 3 - Thủ Đức (Chi nhánh 3)',
    packageType: '36 buổi',
    feeStatus: 'Đã đóng',
    notes: 'Luyện Rhythm guitar Funk & Neo-Soul',
    sessions: makeSessionsWithProgress('2026-09-25', 36, 8, 1, 0, [
      'Hợp âm 9th và 13th cho Funk',
      'Kỹ thuật quạt chả cào dây Scratching',
      'Luyện nhịp chùm ba Triplet',
      'Bài tập: Get Lucky Riff',
      'Double stop giai điệu Jimi Hendrix style',
      'Kỹ thuật trượt ngón Slide & Hammer-on',
    ]),
  },
];
