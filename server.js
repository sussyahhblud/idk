const express = require(‘express’);
const multer = require(‘multer’);
const fetch = require(‘node-fetch’);
const FormData = require(‘form-data’);
const cors = require(‘cors’);

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK = process.env.DISCORD_WEBHOOK;

// Allow all origins including null (local file:// access)
app.use((req, res, next) => {
const origin = req.headers.origin;
res.setHeader(‘Access-Control-Allow-Origin’, origin || ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘GET, POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type, Authorization’);
res.setHeader(‘Access-Control-Allow-Credentials’, ‘true’);
if (req.method === ‘OPTIONS’) return res.sendStatus(204);
next();
});

app.use(express.json());

const upload = multer({
storage: multer.memoryStorage(),
limits: { fileSize: 200 * 1024 * 1024 }
});

app.get(’/’, (req, res) => res.json({ status: ‘ok’, service: ‘Glitchwalk Clip Proxy’ }));

app.post(’/submit’, upload.single(‘file’), async (req, res) => {
try {
const { username, jump } = req.body;
if (!username || !jump) return res.status(400).json({ error: ‘Missing username or jump name’ });
if (!WEBHOOK) return res.status(500).json({ error: ‘Server not configured (missing webhook)’ });

```
if (req.file) {
  const form = new FormData();
  const content = '🎬 **New Clip Submission**\n👤 **Player:** ' + username + '\n🏃 **Jump:** ' + jump;
  form.append('payload_json', JSON.stringify({ content }));
  form.append('file', req.file.buffer, {
    filename: req.file.originalname || 'clip.mp4',
    contentType: req.file.mimetype || 'video/mp4',
  });
  const discordRes = await fetch(WEBHOOK, { method: 'POST', body: form });
  if (!discordRes.ok) {
    const err = await discordRes.text();
    if (discordRes.status === 413 || err.includes('too large')) {
      return res.status(413).json({ error: 'File too large for Discord (max 8MB).' });
    }
    return res.status(500).json({ error: 'Discord error: ' + err });
  }
  return res.json({ ok: true });

} else if (req.body.link) {
  const payload = {
    embeds: [{
      color: 0x00ffcc,
      title: '🎬 New Clip Submission',
      fields: [
        { name: '👤 Player', value: username, inline: true },
        { name: '🏃 Jump', value: jump, inline: true },
        { name: '🔗 Link', value: req.body.link }
      ],
      footer: { text: 'Glitchwalk Database' }
    }]
  };
  const discordRes = await fetch(WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!discordRes.ok) {
    const err = await discordRes.text();
    return res.status(500).json({ error: 'Discord error: ' + err });
  }
  return res.json({ ok: true });

} else {
  return res.status(400).json({ error: 'No file or link provided' });
}
```

} catch (err) {
console.error(err);
res.status(500).json({ error: err.message });
}
});

app.listen(PORT, () => console.log(’Glitchwalk proxy running on port ’ + PORT));
