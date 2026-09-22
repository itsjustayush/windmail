import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { GoogleGenAI } from '@google/genai';

function apiPlugin(): Plugin {
  return {
    name: 'api-endpoints',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/suggest-note' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { recipientName, recipientCity } = JSON.parse(body || '{}');
              const apiKey = process.env.GEMINI_API_KEY;
              if (!apiKey) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(
                  JSON.stringify({
                    note: `thinking of you in ${recipientCity || 'your city'} ✨\nwishing I could just drop by and grab coffee with you today.\nsending you all the warmest thoughts and love across the miles!`
                  })
                );
                return;
              }

              const ai = new GoogleGenAI({ apiKey });
              const prompt = `Write a short, intimate, authentic personal handwritten letter note (maximum 3-4 lines, like on personal stationery) from a friend to ${recipientName || 'a friend'} who lives in ${recipientCity || 'another city'}. It should feel like real, warm, natural cursive handwriting. Casual, sweet, lower-case style or thoughtful. Do not include markdown or quotation marks.`;

              const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
              });

              const text = response.text?.trim() || '';
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ note: text }));
            } catch {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  note: 'thinking of you across the miles ✨\nwishing I could just drop by and grab coffee with you today.\nsending you all the warmest thoughts!'
                })
              );
            }
          });
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
