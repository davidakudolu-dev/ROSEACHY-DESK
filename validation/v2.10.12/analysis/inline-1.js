
/* Roseachy product-name similarity engine (read-only: it never touches stock, IDs, prices or names).
   RoseachyMatch.analyze(enteredName, existingName) -> {kind, score, spelling, measure, notes, ...}
   kind: 'exact' | 'misspelling' | 'possible'  -> likely the same product (actionable duplicate)
         'sizeDiff'                            -> same product family but size/strength/count differs (review)
         null                                  -> unrelated
   Signals: normalised words, word overlap (order independent), typo distance, prefix/short forms,
   brand (first non-generic word), and measurements (strength, volume, weight, count, %) which always matter. */
(function (root) {
  'use strict';
  var STOP = { and: 1, the: 1, of: 1, for: 1, with: 1, a: 1, an: 1, in: 1, by: 1, '&': 1 };
  var GENERIC = {};
  ('toothpaste paste tube soap bar bathing bath body hand wash liquid bleach antiseptic disinfectant jelly petroleum cream lotion oil powder spray gel shampoo conditioner sanitary pads pad napkins napkin tablet tablets tab tabs capsule capsules cap caps syrup suspension injection drops drop ointment sachet sachets bottle bottles can box pack packs tissue roll rolls toilet paper diaper diapers wipes cleaner detergent original classic regular plain extra new strong herbal tonic balm rub mouthwash deodorant roll-on sanitizer sanitiser cotton wool plaster bandage gloves mask condom condoms sweet sweets biscuit biscuits noodles seasoning cube cubes spread butter margarine juice drink water sugar salt rice beans milk tea coffee').split(' ').forEach(function (w) { GENERIC[w] = 1; });
  /* words that look generic but usually mark a genuinely different variant: not treated as harmless extras */
  var VARIANT_HINT = { herbal: 1, strong: 1, extra: 1, new: 1, kids: 1, junior: 1, adult: 1, forte: 1, plus: 1, max: 1, mint: 1, sensitive: 1, whitening: 1 };

  var UNITS = {
    mcg: ['mass', 0.001], ug: ['mass', 0.001], mg: ['mass', 1], g: ['mass', 1000], kg: ['mass', 1e6], oz: ['mass', 28349.5], lb: ['mass', 453592], lbs: ['mass', 453592],
    ml: ['vol', 1], cl: ['vol', 10], dl: ['vol', 100], l: ['vol', 1000], ltr: ['vol', 1000], litre: ['vol', 1000], liter: ['vol', 1000], litres: ['vol', 1000], liters: ['vol', 1000],
    iu: ['iu', 1], '%': ['pct', 1],
    pc: ['ct', 1], pcs: ['ct', 1], piece: ['ct', 1], pieces: ['ct', 1], tab: ['ct', 1], tabs: ['ct', 1], tablet: ['ct', 1], tablets: ['ct', 1], cap: ['ct', 1], caps: ['ct', 1],
    capsule: ['ct', 1], capsules: ['ct', 1], sachet: ['ct', 1], sachets: ['ct', 1], bottle: ['ct', 1], bottles: ['ct', 1], pack: ['ct', 1], packs: ['ct', 1], stick: ['ct', 1], sticks: ['ct', 1],
    roll: ['ct', 1], rolls: ['ct', 1], sheet: ['ct', 1], sheets: ['ct', 1], ply: ['ply', 1], s: ['ct', 1]
  };
  var UNIT_RE = /(\d+(?:[.,]\d+)?)\s*(mcg|ug|mg|kg|g|ml|cl|dl|ltrs?|litres?|liters?|l|oz|lbs?|iu|%|pcs|pc|pieces?|tablets?|tabs?|capsules?|caps?|sachets?|bottles?|packs?|sticks?|rolls?|sheets?|ply|'?s)(?![a-z0-9])/g;

  function clean(s) {
    return String(s == null ? '' : s).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/\u00b5/g, 'u').replace(/[\u2018\u2019`]/g, "'").replace(/(\d)\s*[x\u00d7]\s*(\d)/g, '$1 x $2')
      .replace(/(\d),(\d{3})(?!\d)/g, '$1$2').replace(/(\d),(\d)/g, '$1.$2');
  }

  function parse(name) {
    var s = clean(name), meas = [], m, rest = s;
    UNIT_RE.lastIndex = 0;
    while ((m = UNIT_RE.exec(s)) !== null) {
      var u = m[2].replace(/^'/, ''); if (u === 's') u = "s";
      var def = UNITS[u] || UNITS[m[2]]; if (!def) continue;
      var val = parseFloat(m[1]); if (!isFinite(val)) continue;
      meas.push({ cls: def[0], val: val * def[1], raw: (m[1] + m[2]).replace(/'/g, '') });
    }
    rest = s.replace(UNIT_RE, ' ');
    rest = rest.replace(/[^a-z0-9.\s]+/g, ' ').replace(/(^|\s)\.+(?=\s|$)/g, ' ');
    var toks = rest.split(/\s+/).filter(Boolean), words = [], bare = [];
    toks.forEach(function (t) {
      t = t.replace(/^\.+|\.+$/g, ''); if (!t) return;
      if (/^\d+(\.\d+)?$/.test(t)) { bare.push(parseFloat(t)); return; }
      if (STOP[t]) return;
      words.push(t);
    });
    return { words: words, meas: meas, bare: bare, raw: String(name || '') };
  }

  function stem(w) { if (w.length > 4 && /ies$/.test(w)) return w.slice(0, -3) + 'y'; if (w.length > 4 && /(ses|xes|ches|shes)$/.test(w)) return w.slice(0, -2); if (w.length > 3 && /s$/.test(w) && !/ss$/.test(w)) return w.slice(0, -1); return w; }

  function osa(a, b, cap) {
    var la = a.length, lb = b.length; if (Math.abs(la - lb) > cap) return cap + 1;
    var d = [], i, j; for (i = 0; i <= la; i++) { d[i] = [i]; } for (j = 0; j <= lb; j++) d[0][j] = j;
    for (i = 1; i <= la; i++) for (j = 1; j <= lb; j++) {
      var c = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[la][lb];
  }

  /* similarity of two single words: {s: 0..1, typo: bool} */
  function wordSim(a, b) {
    if (a === b) return { s: 1, typo: false };
    if (/\d/.test(a) || /\d/.test(b)) return { s: 0, typo: false };
    var sa = stem(a), sb = stem(b);
    if (sa === sb) return { s: 0.96, typo: false };
    var sh = a.length <= b.length ? a : b, lo = a.length <= b.length ? b : a;
    if (sh.length >= 3 && lo.indexOf(sh) === 0 && sh.length / lo.length >= 0.6) return { s: 0.86, typo: true };
    var L = Math.max(a.length, b.length), cap = L >= 7 ? 2 : (L >= 4 ? 1 : 0);
    if (cap > 0) { var dist = osa(sa, sb, cap); if (dist <= cap) return { s: dist === 1 ? 0.9 : 0.82, typo: true }; }
    return { s: 0, typo: false };
  }

  /* merge adjacent words that the other name writes as one word ("tooth paste" ~ "toothpaste") */
  function mergeSplit(A, B) {
    var out = A.slice(), i;
    for (i = 0; i < out.length - 1; i++) {
      var j = out[i] + out[i + 1];
      for (var k = 0; k < B.length; k++) { if (wordSim(j, B[k]).s >= 0.9 && wordSim(out[i], B[k]).s < 0.86) { out.splice(i, 2, j); break; } }
    }
    return out;
  }

  function brandOf(words) { for (var i = 0; i < words.length; i++) if (!GENERIC[words[i]]) return i; return 0; }

  function pairWords(E, X) {
    var used = {}, pairs = [], i, j, best;
    var cand = [];
    for (i = 0; i < E.length; i++) for (j = 0; j < X.length; j++) { var r = wordSim(E[i], X[j]); if (r.s > 0) cand.push({ i: i, j: j, s: r.s, typo: r.typo }); }
    cand.sort(function (a, b) { return b.s - a.s; });
    var ue = {}, ux = {};
    cand.forEach(function (c) { if (ue[c.i] || ux[c.j]) return; ue[c.i] = 1; ux[c.j] = 1; pairs.push(c); });
    return { pairs: pairs, ue: ue, ux: ux };
  }

  function measCompare(A, B) {
    var classes = {}, out = { state: 'none', shared: 0, conflicts: [] };
    function add(list, side) { list.forEach(function (m) { (classes[m.cls] = classes[m.cls] || { E: [], X: [] })[side].push(m); }); }
    add(A.meas, 'E'); add(B.meas, 'X');
    var shared = 0, conflict = false, oneSided = false;
    Object.keys(classes).forEach(function (c) {
      var g = classes[c];
      if (g.E.length && g.X.length) {
        var hit = g.E.some(function (e) { return g.X.some(function (x) { return Math.abs(e.val - x.val) <= 1e-6 * Math.max(1, Math.abs(x.val)); }); });
        if (hit) shared++; else { conflict = true; out.conflicts.push({ cls: c, e: g.E.map(function (m) { return m.raw; }).join(' '), x: g.X.map(function (m) { return m.raw; }).join(' ') }); }
      } else oneSided = true;
    });
    if (A.bare.length && B.bare.length) {
      var bh = A.bare.some(function (e) { return B.bare.some(function (x) { return e === x; }); });
      if (bh) shared++; else { conflict = true; out.conflicts.push({ cls: 'num', e: A.bare.join(' '), x: B.bare.join(' ') }); }
    } else if (A.bare.length || B.bare.length) oneSided = true;
    out.shared = shared;
    out.state = conflict ? 'conflict' : (shared ? 'match' : ((A.meas.length || B.meas.length || A.bare.length || B.bare.length) ? 'partial' : 'none'));
    out.oneSided = oneSided && !conflict;
    return out;
  }

  function analyze(entered, existing) {
    var A = parse(entered), B = parse(existing);
    var res = { kind: null, score: 0, spelling: false, measure: 'none', notes: [], conflicts: [], enteredMeasures: A.meas.map(function (m) { return m.raw; }), existingMeasures: B.meas.map(function (m) { return m.raw; }), typoPairs: [] };
    if (!A.words.length || !B.words.length) return res;
    var Ew = mergeSplit(A.words, B.words), Xw = mergeSplit(B.words, A.words);
    var P = pairWords(Ew, Xw), pairs = P.pairs;
    var fullE = pairs.length === Ew.length, fullX = pairs.length === Xw.length;
    var mc = measCompare(A, B); res.measure = mc.state; res.conflicts = mc.conflicts;
    if (!fullE && !fullX) return res;
    var S, Lw, Lunmatched, longerIsExisting;
    if (fullE && fullX) { S = Ew; Lw = Xw; longerIsExisting = true; }
    else if (fullE) { S = Ew; Lw = Xw; longerIsExisting = true; }
    else { S = Xw; Lw = Ew; longerIsExisting = false; }
    /* brand of the longer name must be present in the shorter one (order independent) */
    var bi = brandOf(Lw), brandWord = Lw[bi], brandOk = false, sumSim = 0, typo = false, plural = false;
    pairs.forEach(function (p) {
      var lw = longerIsExisting ? Xw[p.j] : Ew[p.i];
      if (lw === brandWord) brandOk = true;
      sumSim += p.s; if (p.typo) { typo = true; res.typoPairs.push([Ew[p.i], Xw[p.j]]); } else if (p.s < 1) plural = true;
    });
    if (!brandOk) return res;
    var mean = pairs.length ? sumSim / pairs.length : 0;
    var extras = [];
    Lw.forEach(function (w, idx) { var matched = pairs.some(function (p) { return (longerIsExisting ? Xw[p.j] : Ew[p.i]) === w; }); if (!matched) extras.push(w); });
    var pen = 0, variantExtra = [];
    extras.forEach(function (w) { if (VARIANT_HINT[w]) { pen += 0.14; variantExtra.push(w); } else if (GENERIC[w]) pen += 0.04; else pen += 0.12; if (!GENERIC[w] && !VARIANT_HINT[w]) variantExtra.push(w); });
    var score = mean - pen;
    if (mc.state === 'match') score += 0.06; else if (mc.state === 'partial' || mc.oneSided) score *= 0.85;
    score = Math.max(0, Math.min(0.99, score));
    if (fullE && fullX && !typo && !plural && !extras.length && mc.state !== 'conflict' && mc.state !== 'partial') score = 1;
    res.score = score; res.spelling = typo;
    if (variantExtra.length) res.notes.push((longerIsExisting ? 'Existing name' : 'Your entry') + ' also has: ' + variantExtra.join(', ') + ' (may be a different variant)');
    if (mc.state === 'conflict') { if (score >= 0.55) { res.kind = 'sizeDiff'; res.notes.push('Size/strength differs: ' + mc.conflicts.map(function (c) { return c.e + ' vs ' + c.x; }).join('; ')); } return res; }
    if (score < 0.62) { res.score = score; return res; }
    if (mc.state === 'partial' || mc.oneSided) res.notes.push('Size or strength is not stated on one of the names');
    res.kind = (fullE && fullX && !typo && !extras.length) ? 'exact' : (typo ? 'misspelling' : 'possible');
    if (typo) res.notes.unshift('Possible spelling difference detected');
    else if (!fullE || !fullX || extras.length) res.notes.unshift('One name has extra or missing descriptive words');
    return res;
  }

  root.RoseachyMatch = { analyze: analyze, parse: parse, actionable: function (k) { return k === 'exact' || k === 'misspelling' || k === 'possible'; } };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.RoseachyMatch;
})(typeof window !== 'undefined' ? window : globalThis);

