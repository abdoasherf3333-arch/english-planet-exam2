const { grade, norm } = require('./_lib/grade');
const { cmd } = require('./_lib/redis');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = req.body || {};
  const name = String(body.name || '').trim().slice(0, 60);
  if (!name || !Array.isArray(body.answers)) return res.status(400).json({ error: 'البيانات ناقصة' });
  const g = grade(body.answers);
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const nk = norm(name);
  try {
    const first = await cmd('HSETNX', 'names', nk, id);
    if (first !== 1) return res.status(409).json({ error: 'الاسم ده سلّم الامتحان قبل كده. لو فيه غلط كلّم المستر.' });
    try {
      const pct = Math.round((g.score / g.total) * 100);
      await cmd('HSET', 'results', id, JSON.stringify({
        id, nk, name, score: g.score, total: g.total, pct,
        at: new Date().toISOString(), oks: g.review.map(r => (r.ok ? 1 : 0))
      }));
    } catch (e) { await cmd('HDEL', 'names', nk).catch(() => {}); throw e; }
  } catch (e) {
    return res.status(500).json({ error: 'حصلت مشكلة في حفظ النتيجة، حاول تسلّم تاني.' });
  }
  res.status(200).json({ score: g.score, total: g.total, review: g.review });
};
