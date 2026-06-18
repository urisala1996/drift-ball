import { defineConfig } from 'vite';

// Relative base so the build works under https://<user>.github.io/<repo>/
// (GitHub Pages project page) as well as a custom domain / local preview.
export default defineConfig({
  base: './',
  build: {
    target: 'es2021',
    outDir: 'dist',
    sourcemap: false,
  },
});
