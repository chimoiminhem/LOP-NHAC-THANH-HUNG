import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

function apiFallbackPlugin(): Plugin {
  return {
    name: 'api-fallback',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/health') {
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              status: 'ok',
              hasApiKey: Boolean(process.env.GEMINI_API_KEY),
              model: 'gemini-3.8-flash',
            })
          );
          return;
        }
        if (req.url === '/api/gemini/extract-sessions' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            let parsed: any = {};
            try {
              parsed = JSON.parse(body);
            } catch {}
            const studentName = parsed.studentNameHint || 'Nguyễn Minh Anh';
            const instrument = parsed.instrumentHint || 'Piano';
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: true,
                isSimulated: true,
                detectedStudentName: studentName,
                detectedInstrument: instrument,
                summaryNote: 'Trích xuất tự động thành công từ hình ảnh sổ theo dõi.',
                sessions: [
                  {
                    stt: 1,
                    date: '10/02/2025',
                    content: `Tư thế ngồi, làm quen phím đàn, Luyện ngón Hanon bài 1 (${instrument})`,
                    status: 'Học',
                    note: 'Ngón tay cong tròn đều, giữ nhịp tốt',
                  },
                  {
                    stt: 2,
                    date: '13/02/2025',
                    content: 'Gam Đô trưởng (C Major), Bài luyện ngón Beyer bài 8',
                    status: 'Học',
                    note: 'Chú ý ngón cái luồn mượt mà, đúng nhịp 4/4',
                  },
                  {
                    stt: 3,
                    date: '17/02/2025',
                    content: 'Thực hành tác phẩm: Fur Elise (Phần A, 16 ô nhịp đầu)',
                    status: 'Học',
                    note: 'Nhớ sắc thái p và mf, đã thuộc giai điệu',
                  },
                  {
                    stt: 4,
                    date: '20/02/2025',
                    content: 'Ôn tập phần A Fur Elise, ghép hai tay',
                    status: 'Phép',
                    note: 'Học viên xin nghỉ bận thi học kỳ, dặn luyện thêm ở nhà',
                  },
                  {
                    stt: 5,
                    date: '24/02/2025',
                    content: 'Ghép hai tay đoạn đầu Fur Elise + Luyện hợp âm C, G, Am, F',
                    status: 'Học',
                    note: 'Tay trái chuyển âm chuẩn xác, cổ tay thả lỏng',
                  },
                  {
                    stt: 6,
                    date: '27/02/2025',
                    content: 'Chuyển sang phần B Fur Elise (nhịp 3/8) + Luyện tiết tấu',
                    status: 'Học',
                    note: 'Đọc đúng nốt thăng giáng, nhịp đều',
                  },
                ],
              })
            );
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiFallbackPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
