/**
 * simple-test-server.js
 * --------------------------------------------
 * A tiny Express server offering endpoints that
 * cover every HTTP verb & common content-type.
 */
const express  = require('express');       // for multipart/form-data
const app      = express();
const PORT     = 4000;

// ─── Middleware ─────────────────────────────
app.use(express.json());                     // parses application/json
app.use(express.urlencoded({ extended: true }));
app.use((req, _res, next) => {               // very open CORS for testing
  req.setTimeout(10_000);                    // 10 s timeout for slow nets
  resHeader(_res);
  next();
});
function resHeader(res){
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
}

// ─── End-points ─────────────────────────────

// 1. Health-check (no body)
app.get('/health', (req, res) => res.json({ status: 'OK', at: new Date() }));

// 2. Echo query-string & headers
app.get('/api/echo', (req, res) =>
  res.json({ query: req.query, headers: req.headers }));

// 3. JSON payload
app.post('/api/json',    (req, res) => res.json({ youSent: req.body }));

// 4. URL-encoded payload
app.post('/api/urlenc',  (req, res) => res.json({ youSent: req.body }));

// 5. Multipart (file + fields)

let users = []; let idx = 1;

app.get ('/api/users',      (_req, res)      => res.json(users));
app.post('/api/users',      (req,  res)      => {
  const user = { id: idx++, ...req.body }; users.push(user); res.json(user);
});
app.put ('/api/users/:id',  (req,  res)      => {
  users = users.map(u => u.id == req.params.id ? { ...u, ...req.body } : u);
  res.json(users.find(u => u.id == req.params.id));
});
app.patch('/api/users/:id', (req,  res)      => {
  users = users.map(u => u.id == req.params.id ? { ...u, ...req.body } : u);
  res.json(users.find(u => u.id == req.params.id));
});
app.delete('/api/users/:id',(req,  res)      => {
  users = users.filter(u => u.id != req.params.id);
  res.json({ deleted: req.params.id });
});

// 7. Intentional error
app.get('/api/fail', (_req, res) => res.status(500).json({ error: 'Boom!' }));

app.listen(PORT, () =>
  console.log(`Test server ready → http://localhost:${PORT}`)
);