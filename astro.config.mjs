import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://harkanwalbedi.github.io',
  build: {
    // Keep every stylesheet in its own file. The site's Content-Security-Policy
    // is style-src 'self', which an inlined <style> block would violate.
    inlineStylesheets: 'never',
  },
  server: {
    host: '127.0.0.1',
    port: 8092,
  },
});
