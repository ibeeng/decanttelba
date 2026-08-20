// @ts-check
import { defineConfig } from 'astro/config';
<<<<<<< HEAD

// https://astro.build/config
export default defineConfig({});
=======
import tailwind from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwind()],
  },
});
>>>>>>> master
