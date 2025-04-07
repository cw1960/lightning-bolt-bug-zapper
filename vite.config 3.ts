import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'manifest.json',
          dest: ''
        },
        {
          src: 'icons',
          dest: ''
        },
        {
          src: 'background.js',
          dest: ''
        },
        {
          src: 'content.js',
          dest: ''
        },
        {
          src: 'options.html',
          dest: ''
        },
        {
          src: 'options.js',
          dest: ''
        },
        {
          src: 'splash-image.png',
          dest: ''
        },
        {
          src: 'clean-popup.html',
          dest: '',
          rename: 'popup.html'
        },
        {
          src: 'popup.css',
          dest: ''
        }
      ]
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'popup-react-entry': resolve(__dirname, 'popup-react-entry.jsx'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  }
}); 