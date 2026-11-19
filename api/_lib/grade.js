const D = require('./data.json');
const L = 'abcd';
const norm = s => String(s).toLowerCase().replace(/[’‘`]/g, "'").replace(/[.,!?]/g, '').replace(/\s+/g, ' ').trim();
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Full list WITH answers (server only)
const ITEMS = [];
const sec = (t, d) => ITEMS.push({ k: 's', t, d });
sec('Section A: Choose the correct answer', 'اختار الإجابة الصح من a, b, c, d');
D.M.forEach(x => ITEMS.push({ k: 'm', q: x[0], o: x[1], a: x[2], w: x[3] }));
sec('Section B: Reorder', 'رتب الكلمات علشان تكوّن جملة مفيدة (دوس على الكلمة لإضافتها، ودوس عليها تاني لإرجاعها)');
D.O.forEach(x => ITEMS.push({ k: 'o', s: x[0], w: x[1] }));
sec('Section C: Correct the word(s) between brackets', 'اكتب الصيغة الصحيحة للكلمة أو الكلمات اللي بين الأقواس بالترتيب الصح');
D.T.forEach(x => ITEMS.push({ k: 't', q: x[0], a: x[1], w: x[2] }));
sec('Section D: Detect and correct the underlined word(s)', 'الكلمة المسطّر تحتها غلط، اكتب الصيغة الصح');
D.U.forEach(x => ITEMS.push({ k: 't', q: x[0], a: x[1], w: x[2] }));
sec('Section E: Complete the dialogue', 'اختار الجملة المناسبة في المحادثة');
D.D.forEach(g => { ITEMS.push({ k: 'h', t: g[0] }); g[1].forEach(x => ITEMS.push({ k: 'm', q: x[0], o: x[1], a: x[2], w: x[3] })); });

const numbered = ITEMS.filter(i => i.k === 'm' || i.k === 'o' || i.k === 't');

function publicItems() {
  return ITEMS.map(i => {
    if (i.k === 'm') return { k: 'm', q: i.q, o: i.o };
    if (i.k === 't') return { k: 't', q: i.q };
    if (i.k === 'o') return { k: 'o', p: shuffle(i.s.replace(/[.?!]/g, '').split(' ')) };
    return i;
  });
}

function grade(answers) {
  let score = 0;
  const review = numbered.map((q, idx) => {
    const a = answers[idx];
    let ok = false, my = '—', co = '';
    if (q.k === 'm') {
      const v = Number.isInteger(a) && a >= 0 && a < q.o.length ? a : -1;
      ok = v === q.a;
      my = v < 0 ? '—' : `${L[v]}) ${q.o[v]}`;
      co = `${L[q.a]}) ${q.o[q.a]}`;
    } else if (q.k === 't') {
      const v = typeof a === 'string' ? a.slice(0, 100) : '';
      ok = q.a.some(x => norm(x) === norm(v));
      my = v.trim() || '—';
      co = q.a[0];
    } else {
      const v = typeof a === 'string' ? a.slice(0, 200) : '';
      ok = norm(v) === norm(q.s);
      my = v.trim() || '—';
      co = q.s;
    }
    if (ok) score++;
    return { n: idx + 1, q: q.q || 'Reorder the words', ok, my, co, why: q.w };
  });
  return { score, total: numbered.length, review };
}
module.exports = { grade, publicItems, numbered, norm };
