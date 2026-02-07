/**
 * Gemini REST client (deterministic fallback lives in callers)
 */

const https = require('https');
const { URL } = require('url');

require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-1.5-flash';

function sanitizeText(value) {
  if (!value) return '';
  let text = String(value)
    .replace(/[`*_>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  text = sentences.slice(0, 3).join(' ');

  if (text.length > 600) {
    text = text.slice(0, 600).trim();
  }

  return text;
}

function callGemini(prompt) {
  if (!API_KEY) {
    return Promise.reject(new Error('GEMINI_API_KEY not set'));
  }

  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`
  );

  const body = JSON.stringify({
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 256
    }
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        },
        timeout: 8000
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error(`Gemini API error: ${res.statusCode}`));
          }

          try {
            const parsed = JSON.parse(data);
            const text =
              parsed &&
              parsed.candidates &&
              parsed.candidates[0] &&
              parsed.candidates[0].content &&
              parsed.candidates[0].content.parts &&
              parsed.candidates[0].content.parts[0] &&
              parsed.candidates[0].content.parts[0].text;

            resolve(text || '');
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('Gemini API timeout'));
    });

    req.write(body);
    req.end();
  });
}

async function generateGeminiText(prompt) {
  const raw = await callGemini(prompt);
  return sanitizeText(raw);
}

module.exports = {
  generateGeminiText,
  sanitizeText
};
