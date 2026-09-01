import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages는 /<repo>/ 하위 경로로 서비스되므로 base를 맞춘다.
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? '/KMLEshowoff/' : '/',
});
