const express = require('express');
const multer = require('multer');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 10000;
const WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || '';
const AUTH_HEADER_NAME = process.env.N8N_AUTH_HEADER_NAME || '';
const AUTH_HEADER_VALUE = process.env.N8N_AUTH_HEADER_VALUE || '';
const MAX_FILE_MB = Number(process.env.MAX_FILE_MB || 15);

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '32kb' }));
app.use('/api/', rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use(express.static(path.join(__dirname, 'public')));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    cb(isPdf ? null : new Error('Please select a PDF file.'), isPdf);
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'LeadPilot', webhookConfigured: Boolean(WEBHOOK_URL), maxFileMb: MAX_FILE_MB, mode: 'safe' });
});

app.post('/api/upload', upload.single('data'), async (req, res) => {
  if (!WEBHOOK_URL) return res.status(503).json({ error: 'The n8n webhook is not configured on this Render service yet.' });
  if (!req.file) return res.status(400).json({ error: 'Choose a PDF file before uploading.' });

  try {
    const form = new FormData();
    form.append('data', new Blob([req.file.buffer], { type: 'application/pdf' }), req.file.originalname);
    const headers = {};
    if (AUTH_HEADER_NAME && AUTH_HEADER_VALUE) headers[AUTH_HEADER_NAME] = AUTH_HEADER_VALUE;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    let upstream;
    try {
      upstream = await fetch(WEBHOOK_URL, { method: 'POST', body: form, headers, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
    const bodyText = await upstream.text();
    let result;
    try { result = bodyText ? JSON.parse(bodyText) : {}; } catch { result = { message: bodyText.slice(0, 1200) }; }
    if (!upstream.ok) {
      return res.status(502).json({ error: `n8n returned HTTP ${upstream.status}. Check the webhook URL, workflow and n8n execution log.`, upstreamStatus: upstream.status, details: result });
    }
    res.json({ ok: true, message: 'PDF successfully forwarded to n8n.', result });
  } catch (error) {
    const message = error.name === 'AbortError' ? 'n8n did not respond within 2 minutes.' : 'Could not reach n8n. Check the webhook URL and Render environment variables.';
    res.status(502).json({ error: message });
  }
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: `PDF is too large. Maximum size is ${MAX_FILE_MB} MB.` });
  res.status(400).json({ error: err.message || 'Upload failed.' });
});

app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`LeadPilot running on port ${PORT}`));
