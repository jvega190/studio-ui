import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgrPlugin from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), viteTsconfigPaths(), svgrPlugin()],
  build: {
    outDir: 'build_vite',
    commonjsOptions: {
      include: [/uppy/, /node_modules/]
    }
  },
  server: {
    open: true,
    port: 3000,
    proxy: {
      '/studio/api': 'http://localhost:8080',
      '/studio/refresh': 'http://localhost:8080',
      '/studio/static-assets/': 'http://localhost:8080',
      '/studio/authType': 'http://localhost:8080'
    }
  }
});
