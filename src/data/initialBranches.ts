/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Branch } from '../types/music';

export const INITIAL_BRANCH_LIST: Branch[] = [
  {
    id: 'branch-1',
    name: 'Cơ sở 1 - Quận 1 (Trụ sở chính)',
    address: 'Số 45 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    phone: '028 3822 8899',
    manager: 'Thầy Hoàng Piano',
    rooms: [
      'Phòng Grand Piano 1',
      'Phòng Piano Upright 2',
      'Phòng Guitar 101',
      'Phòng Guitar 102',
      'Phòng Band 103',
    ],
    notes: 'Trụ sở chính với 5 phòng cách âm tiêu chuẩn, trang bị đại dương cầm Kawai biểu diễn.',
    isDefault: true,
  },
  {
    id: 'branch-2',
    name: 'Cơ sở 2 - Bình Thạnh (Chi nhánh 2)',
    address: 'Số 182 Điện Biên Phủ, Phường 21, Quận Bình Thạnh, TP. Hồ Chí Minh',
    phone: '028 3512 6677',
    manager: 'Thầy Đức Guitar',
    rooms: [
      'Phòng Piano 201',
      'Phòng Guitar 202',
      'Phòng Trống & Bass 203',
    ],
    notes: 'Cơ sở khu vực Đông Sài Gòn, bãi đỗ xe rộng rãi, trang bị đầy đủ amplifier Fender & Roland.',
    isDefault: false,
  },
  {
    id: 'branch-3',
    name: 'Cơ sở 3 - Thủ Đức (Chi nhánh 3)',
    address: 'Số 68 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức, TP. Hồ Chí Minh',
    phone: '028 3720 5544',
    manager: 'Cô Linh Piano',
    rooms: [
      'Phòng Piano 301',
      'Phòng Guitar 302',
      'Phòng Ukulele 303',
    ],
    notes: 'Khu vực gần làng đại học, thuận tiện cho học sinh, sinh viên và thiếu nhi.',
    isDefault: false,
  },
];
