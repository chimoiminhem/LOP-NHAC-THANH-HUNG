/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Teacher } from '../types/music';

export const INITIAL_BRANCHES = [
  'Cơ sở 1 - Quận 1 (Trụ sở chính)',
  'Cơ sở 2 - Bình Thạnh (Chi nhánh 2)',
  'Cơ sở 3 - Thủ Đức (Chi nhánh 3)',
];

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'teacher-1',
    name: 'Thầy Hoàng Piano',
    phone: '0903 112 233',
    branch: 'Cơ sở 1 - Quận 1 (Trụ sở chính)',
    instruments: ['Piano'],
    status: 'Hoạt Động',
    notes: 'Tốt nghiệp Nhạc viện TP.HCM khoa Piano Cổ điển, kinh nghiệm 7 năm',
    email: 'hoang.piano@harmonymusic.vn',
    startDate: '2023-01-10',
  },
  {
    id: 'teacher-2',
    name: 'Cô Linh Piano',
    phone: '0988 445 566',
    branch: 'Cơ sở 1 - Quận 1 (Trụ sở chính)',
    instruments: ['Piano', 'Ukulele'],
    status: 'Hoạt Động',
    notes: 'Chuyên dạy Piano Đệm hát Pop & Cảm thụ âm nhạc cho thiếu nhi',
    email: 'linh.piano@harmonymusic.vn',
    startDate: '2023-05-15',
  },
  {
    id: 'teacher-3',
    name: 'Thầy Tuấn Guitar',
    phone: '0912 778 899',
    branch: 'Cơ sở 1 - Quận 1 (Trụ sở chính)',
    instruments: ['Guitar', 'Electric Guitar'],
    status: 'Hoạt Động',
    notes: 'Trưởng bộ môn Guitar - Giảng dạy Acoustic, Fingerstyle và Lead Electric',
    email: 'tuan.guitar@harmonymusic.vn',
    startDate: '2022-09-01',
  },
  {
    id: 'teacher-4',
    name: 'Thầy Đức Guitar',
    phone: '0934 667 788',
    branch: 'Cơ sở 2 - Bình Thạnh (Chi nhánh 2)',
    instruments: ['Guitar'],
    status: 'Hoạt Động',
    notes: 'Chuyên dòng nhạc Flamenco và Cổ điển Classic',
    email: 'duc.guitar@harmonymusic.vn',
    startDate: '2024-02-01',
  },
  {
    id: 'teacher-5',
    name: 'Cô Trang Ukulele',
    phone: '0977 334 455',
    branch: 'Cơ sở 2 - Bình Thạnh (Chi nhánh 2)',
    instruments: ['Ukulele'],
    status: 'Hoạt Động',
    notes: 'Chuyên dạy Ukulele tương tác và nhóm hòa tấu thiếu nhi',
    email: 'trang.uku@harmonymusic.vn',
    startDate: '2023-11-20',
  },
  {
    id: 'teacher-6',
    name: 'Thầy Minh Bass',
    phone: '0945 990 011',
    branch: 'Cơ sở 1 - Quận 1 (Trụ sở chính)',
    instruments: ['Bass'],
    status: 'Hoạt Động',
    notes: 'Nghệ sĩ Bass ban nhạc rock, kinh nghiệm biểu diễn chuyên nghiệp',
    email: 'minh.bass@harmonymusic.vn',
    startDate: '2023-03-01',
  },
  {
    id: 'teacher-7',
    name: 'Thầy Khải Guitar',
    phone: '0966 223 344',
    branch: 'Cơ sở 3 - Thủ Đức (Chi nhánh 3)',
    instruments: ['Electric Guitar', 'Guitar', 'Bass'],
    status: 'Hoạt Động',
    notes: 'Kỹ thuật viên âm thanh & hòa âm phối khí band nhạc',
    email: 'khai.electric@harmonymusic.vn',
    startDate: '2024-06-10',
  },
  {
    id: 'teacher-8',
    name: 'Cô Hà Ukulele',
    phone: '0909 556 677',
    branch: 'Cơ sở 1 - Quận 1 (Trụ sở chính)',
    instruments: ['Ukulele', 'Piano'],
    status: 'Nghỉ',
    notes: 'Tạm nghỉ thai sản từ tháng 08/2026',
    email: 'ha.ukulele@harmonymusic.vn',
    startDate: '2023-08-01',
  },
];
