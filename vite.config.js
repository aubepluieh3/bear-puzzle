import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 빌드 결과를 파일로 바로 열어도 동작하도록 상대 경로를 씁니다.
  base: './',
});
