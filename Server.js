const express = require('express');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Filter = require('bad-words');
const { nanoid } = require('nanoid');

const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.INBOX_TOKEN || "mySecret123";
const filePath = path.join(__dirname, 'messages.json');
const filter = new Filter();

app.use(helmet());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { ok: false, error: "Too many requests, please try again later." }
});
app.use("/api/send", limiter);

app.post('/api/send', (req, res) => {
  let msg = req.body.message || '';
  if (!msg.trim()) return res.json({ ok: false, error: "Empty message" });
  msg = filter.clean(msg);
  const entry = { id: nanoid(6), message: msg, time: new Date().toISOString() };
  let messages = [];
  if (fs.existsSync(filePath)) messages = JSON.parse(fs.readFileSync(filePath));
  messages.push(entry);
  fs.writeFileSync(filePath, JSON.stringify(messages, null, 2));
  res.json({ ok: true });
});

app.get('/api/messages', (req, res) => {
  const token = req.query.token;
  if (token !== TOKEN) return res.status(403).json({ ok: false, error: "Invalid token" });
  if (!fs.existsSync(filePath)) return res.json([]);
  const messages = JSON.parse(fs.readFileSync(filePath));
  res.json(messages);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
