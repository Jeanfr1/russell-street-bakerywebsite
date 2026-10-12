import { defineConfig } from 'vite';
import { render } from './src/render.js';

// Renders the page from src/data at build time (and on every dev request),
// so the shipped HTML is the whole page, readable without JavaScript.
function renderPage() {
  return {
    name: 'russell-render',
    async transformIndexHtml(html) {
      const { head, app } = await render();
      return html.replace('<!--@head-->', head.trim()).replace('<!--@app-->', app.trim());
    },
    handleHotUpdate({ file, server }) {
      if (/[\\/]src[\\/](data|render\.js)/.test(file)) server.ws.send({ type: 'full-reload' });
    },
  };
}

export default defineConfig({
  plugins: [renderPage()],
  build: { target: 'es2020', cssMinify: true, assetsInlineLimit: 0 },
  preview: { port: 4191 },
});
