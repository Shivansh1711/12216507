const express = require('express');
const { nanoid } = require('nanoid');
const fs = require('fs');
const path = require('path');
const { Log } = require('../Logging/Logger'); 

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(express.json());

function loadDB() {
  if (!fs.existsSync(DB_PATH)) return {};
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}
function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

app.post('/shorturls', async (req, res) => {
  const { url, validity = 30, shortcode } = req.body;

  if (!url || !isValidUrl(url)) {
    await Log('backend', 'error', 'handler', 'Invalid or missing URL');
    return res.status(400).json({ error: 'Invalid or missing URL' });
  }

  const code = shortcode || nanoid(6);
  if (!/^[a-zA-Z0-9]{4,16}$/.test(code)) {
    await Log('backend', 'error', 'handler', 'Invalid shortcode format');
    return res.status(400).json({ error: 'Invalid shortcode format' });
  }

  const db = loadDB();
  if (db[code]) {
    await Log('backend', 'warn', 'handler', `Shortcode already exists: ${code}`);
    return res.status(409).json({ error: 'Shortcode already exists' });
  }

  const now = new Date();
  const expiry = new Date(now.getTime() + validity * 60000);

  db[code] = {
    url,
    createdAt: now.toISOString(),
    expiry: expiry.toISOString(),
    clicks: []
  };

  saveDB(db);
  await Log('backend', 'info', 'service', `Short URL created: ${code}`);
  res.status(201).json({
    shortLink: `http://localhost:${PORT}/${code}`,
    expiry: expiry.toISOString()
  });
});

app.get('/:shortcode', async (req, res) => {
  const { shortcode } = req.params;
  const db = loadDB();
  const entry = db[shortcode];

  if (!entry) {
    await Log('backend', 'error', 'handler', `Shortcode not found: ${shortcode}`);
    return res.status(404).json({ error: 'Shortcode not found' });
  }

  if (new Date() > new Date(entry.expiry)) {
    await Log('backend', 'warn', 'handler', `Shortcode expired: ${shortcode}`);
    return res.status(410).json({ error: 'Shortcode expired' });
  }

  entry.clicks.push({
    timestamp: new Date().toISOString(),
    referrer: req.get('referer') || null,
    ip: req.ip
  });

  saveDB(db);
  await Log('backend', 'info', 'service', `Redirected to ${entry.url} via ${shortcode}`);
  res.redirect(entry.url);
});

app.get('/shorturls/:shortcode', async (req, res) => {
  const { shortcode } = req.params;
  const db = loadDB();
  const entry = db[shortcode];

  if (!entry) {
    await Log('backend', 'error', 'handler', `Shortcode not found (stats): ${shortcode}`);
    return res.status(404).json({ error: 'Shortcode not found' });
  }

  await Log('backend', 'info', 'service', `Stats retrieved for: ${shortcode}`);
  res.json({
    url: entry.url,
    createdAt: entry.createdAt,
    expiry: entry.expiry,
    totalClicks: entry.clicks.length,
    clicks: entry.clicks
  });
});

app.listen(PORT, async () => {
  await Log('backend', 'info', 'service', `URL Shortener running on port ${PORT}`);
  console.log(`URL Shortener running on http://localhost:${PORT}`);
});
