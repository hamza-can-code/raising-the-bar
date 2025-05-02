// server/test.js
const express = require('express');
const app = express();

app.get('/foo', (req, res) => {
  console.log('🔥 /foo hit');
  res.json({ ok: true });
});

app.listen(5000, () => {
  console.log('✔️ Listening on port 5000');
});
