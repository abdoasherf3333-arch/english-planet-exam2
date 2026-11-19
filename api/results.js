const crypto = require('crypto');
const { numbered } = require('./_lib/grade');
const { cmd } = require('./_lib/redis');
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return res.status(500).json({ error: 'ADMIN_PASSWORD مش متظبط في Environment Variables' });
  if (!same(req.headers['x-admin-password'] || '', pw)) return res.status(401).json({ error: 'الباسورد غلط' });
  try {
    if (req.method === 'DELETE') {
      const id = String((req.query && req.query.id) || '');
      const raw = await cmd('HGET', 'results', id);
      if (raw) { const r = JSON.parse(raw); await cmd('HDEL', 'names', r.nk); await cmd('HDEL', 'results', id); }
      return res.status(200).json({ ok: true });
    }
    const flat = (await cmd('HGETALL', 'results')) || [];
    const results = [];
    for (let i = 1; i < flat.length; i += 2) { try { results.push(JSON.parse(flat[i])); } catch (e) {} }
    results.sort((a, b) => (a.at < b.at ? 1 : -1));
    const questions = numbered.map((q, i) => ({ n: i + 1, q: (q.q || q.s).replace(/<[^>]+>/g, ' ') }));
    res.status(200).json({ results, questions });
  } catch (e) {
    res.status(500).json({ error: 'مشكلة في قاعدة البيانات. اتأكد إنك ربطت Upstash Redis بالمشروع.' });
  }
};
