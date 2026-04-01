import { defineConfig } from 'rolldown';
import copy from 'rollup-plugin-copy';

export default defineConfig([
  {
    input: 'src/content.ts',
    output: {
      dir: 'dist',
      format: 'iife',
      entryFileNames: 'content.js',
    },
    platform: 'browser',
    plugins: [
      copy({
        targets: [
          { src: 'src/manifest.json', dest: 'dist' },
          { src: 'src/content.css', dest: 'dist' },
          { src: 'icons', dest: 'dist' },
        ],
      }),
    ],
  },
  {
    input: 'src/inject.ts',
    output: {
      dir: 'dist',
      format: 'iife',
      entryFileNames: 'inject.js',
    },
    platform: 'browser',
  },
]);
