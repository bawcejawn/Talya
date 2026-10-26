// ToneMirror core: synthetic sample voices + acoustic analysis + cautious interpretation
const Core = (() => {
  const cl = v => Math.max(0, Math.min(1, v));
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function pct(a, p) {
    if (!a.length) return NaN;
    const b = Float64Array.from(a).sort();
    const i = (b.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
    return b[lo] + (b[hi] - b[lo]) * (i - lo);
  }
  const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN;

  // Voice-like synthetic clip so the prototype opens with something to analyze.
  function synth(p) {
    const sr = 16000, N = Math.floor(p.dur * sr), out = new Float32Array(N), r = rng(p.seed);
    const syl = []; let t = 0.2, i = 0;
    while (t < p.dur - 0.3) {
      const len = 0.72 / p.rate, pos = t / p.dur;
      syl.push({ t, len, f: p.f0 * Math.pow(2, (p.contour(pos) + (r() - 0.5) * p.pitchVar) / 12), a: p.loud(pos) * (0.85 + 0.3 * r()) });
      t += (1 / p.rate) * (0.85 + 0.3 * r()); i++;
      if (p.pauseEvery && i % p.pauseEvery === 0) t += 0.32 + 0.2 * r();
    }
    let phase = 0, f = syl[0].f, k = 0, lp = 0;
    for (let n = 0; n < N; n++) {
      const tt = n / sr;
      while (k < syl.length - 1 && tt >= syl[k + 1].t) k++;
      const s = syl[k], dt = tt - s.t; let env = 0;
      if (dt >= 0 && dt < s.len) {
        if (dt < 0.025) env = dt / 0.025;
        else if (dt < s.len * 0.7) env = 1 - 0.4 * (dt - 0.025) / (s.len * 0.7 - 0.025);
        else env = 0.6 * (1 - (dt - s.len * 0.7) / (s.len * 0.3));
      }
      const target = s.f * (1 - 0.03 * Math.max(0, Math.min(dt, s.len)) / s.len);
      f += (target - f) * 0.004;
      phase += f / sr; phase -= Math.floor(phase);
      lp += ((2 * phase - 1) - lp) * 0.35;
      out[n] = lp * env * s.a * 0.6 + (r() - 0.5) * 0.004;
    }
    return { data: out, sr };
  }

  function analyze(data, sr) {
    const factor = Math.max(1, Math.round(sr / 11025)), dsr = sr / factor;
    const n = Math.floor(data.length / factor), x = new Float32Array(n);
    for (let i = 0; i < n; i++) { let s = 0; for (let k = 0; k < factor; k++) s += data[i * factor + k]; x[i] = s / factor; }
    const frame = Math.round(dsr * 0.046), hop = Math.round(dsr * 0.02), hopSec = hop / dsr;
    const F = Math.max(0, Math.floor((n - frame) / hop) + 1);
    const db = new Float32Array(F), pitch = new Float32Array(F);
    for (let f = 0; f < F; f++) {
      let m = 0; const o = f * hop;
      for (let i = 0; i < frame; i++) m += x[o + i]; m /= frame;
      let e = 0; for (let i = 0; i < frame; i++) { const v = x[o + i] - m; e += v * v; }
      db[f] = 10 * Math.log10(e / frame + 1e-12);
    }
    const floor = pct(db, 0.1), top = pct(db, 0.98);
    const thr = Math.max(floor + 10, top - 30);
    const minLag = Math.floor(dsr / 420), maxLag = Math.ceil(dsr / 70);
    const b = new Float32Array(frame), sq = new Float64Array(frame + 1), rr = new Float64Array(maxLag + 2);
    for (let f = 0; f < F; f++) {
      if (db[f] <= thr) continue;
      const o = f * hop; let m = 0;
      for (let i = 0; i < frame; i++) m += x[o + i]; m /= frame;
      for (let i = 0; i < frame; i++) { b[i] = x[o + i] - m; sq[i + 1] = sq[i] + b[i] * b[i]; }
      let best = 0;
      for (let l = minLag; l <= maxLag && l < frame - 8; l++) {
        let s = 0; for (let i = 0; i + l < frame; i++) s += b[i] * b[i + l];
        const d = Math.sqrt(sq[frame - l] * (sq[frame] - sq[l])) + 1e-12;
        rr[l] = s / d; if (rr[l] > best) best = rr[l];
      }
      if (best < 0.5) continue;
      for (let l = minLag + 1; l < maxLag && l < frame - 9; l++) {
        if (rr[l] >= 0.88 * best && rr[l] >= rr[l - 1] && rr[l] >= rr[l + 1]) {
          const a = rr[l - 1], c = rr[l + 1], den = a - 2 * rr[l] + c;
          const off = den !== 0 ? 0.5 * (a - c) / den : 0;
          pitch[f] = dsr / (l + Math.max(-0.5, Math.min(0.5, off)));
          break;
        }
      }
    }
    const voiced = []; for (let f = 0; f < F; f++) if (db[f] > thr) voiced.push(f);
    const dur = data.length / sr;
    if (voiced.length < 10) return { dur, tooQuiet: true, track: { db, pitch, thr, hopSec } };
    const first = voiced[0], last = voiced[voiced.length - 1], span = last - first + 1;
    let st = [], stIdx = [];
    for (let f = 0; f < F; f++) if (pitch[f] > 0) { st.push(12 * Math.log2(pitch[f] / 100)); stIdx.push(f); }
    const med0 = pct(st, 0.5);
    const keep = st.map(v => Math.abs(v - med0) < 7);
    stIdx = stIdx.filter((_, i) => keep[i]); st = st.filter((_, i) => keep[i]);
    stIdx.forEach((f) => {});
    for (let f = 0; f < F; f++) if (pitch[f] > 0 && !stIdx.includes(f)) pitch[f] = 0;
    const medSt = pct(st, 0.5), iqr = pct(st, 0.75) - pct(st, 0.25);
    const inPart = (f, a, z) => f >= first + span * a && f < first + span * z;
    const vdb = voiced.map(f => db[f]);
    const dbFirst = mean(voiced.filter(f => inPart(f, 0, 1 / 3)).map(f => db[f]));
    const dbLast = mean(voiced.filter(f => inPart(f, 2 / 3, 1.01)).map(f => db[f]));
    const stFirst = pct(st.filter((_, i) => inPart(stIdx[i], 0, 1 / 3)), 0.5);
    const stLast = pct(st.filter((_, i) => inPart(stIdx[i], 2 / 3, 1.01)), 0.5);
    const stEnd = pct(st.filter((_, i) => inPart(stIdx[i], 0.85, 1.01)), 0.5);
    const meanDb = mean(vdb);
    const dyn = Math.sqrt(mean(vdb.map(v => (v - meanDb) ** 2)));
    // syllable-like peaks
    const sm = new Float32Array(F);
    for (let f = 0; f < F; f++) sm[f] = (db[Math.max(0, f - 1)] + db[f] + db[Math.min(F - 1, f + 1)]) / 3;
    let peaks = 0, lastPeak = -99;
    for (let f = 1; f < F - 1; f++) {
      if (sm[f] <= thr || sm[f] < sm[f - 1] || sm[f] < sm[f + 1]) continue;
      let lo = Infinity; for (let k = Math.max(0, f - 6); k <= Math.min(F - 1, f + 6); k++) lo = Math.min(lo, sm[k]);
      if (sm[f] - lo >= 3 && f - lastPeak >= 5) { peaks++; lastPeak = f; }
    }
    let pauseFrames = 0, run = 0;
    for (let f = first; f <= last; f++) {
      if (db[f] <= thr) run++; else { if (run >= 15) pauseFrames += run; run = 0; }
    }
    const spanSec = span * hopSec, pauseSec = pauseFrames * hopSec, speakSec = Math.max(0.5, spanSec - pauseSec);
    const snr = top - floor;
    return {
      dur, voicedSec: voiced.length * hopSec, speakSec, pauseRatio: pauseSec / spanSec,
      rate: peaks / speakSec, medSt, medHz: 100 * Math.pow(2, medSt / 12), iqr,
      endRise: stEnd - medSt, meanDb, dyn, dbRise: dbLast - dbFirst, stRise: stLast - stFirst,
      snr, quality: (voiced.length * hopSec >= 2 && snr >= 18) ? 'good' : 'limited',
      track: { db, pitch, thr, hopSec }
    };
  }

  const TAGS = {
    warm: { name: 'Warm, even', tone: 'calm' },
    tense: { name: 'Tense / pressured', tone: 'hot' },
    escalating: { name: 'Escalating', tone: 'hot' },
    flat: { name: 'Flat / withdrawn', tone: 'cool' },
    soft: { name: 'Soft / apologetic', tone: 'calm' },
    unsure: { name: 'Questioning / unsure', tone: 'cool' },
    neutral: { name: 'Neutral', tone: 'calm' }
  };

  function interpret(m, base) {
    const fast = cl((m.rate - 5.0) / 1.8), slow = cl((4.0 - m.rate) / 1.5);
    const narrow = cl((2.2 - m.iqr) / 1.6), lively = cl((m.iqr - 3.5) / 3);
    const lowDyn = cl((6 - m.dyn) / 4);
    const esc = cl(((m.dbRise - 1.5) / 6) * 0.6 + ((m.stRise || 0) / 3) * 0.4);
    const rise = cl((m.endRise - 1.5) / 2.5), fall = cl((-m.endRise - 1) / 2.5);
    let pUp = 0, louder = 0, quieter = 0, faster = 0;
    if (base) {
      pUp = cl((m.medSt - base.medSt - 1) / 3);
      louder = cl((m.meanDb - base.meanDb - 2) / 6);
      quieter = cl((base.meanDb - m.meanDb - 2) / 6);
      faster = cl((m.rate - base.rate - 0.5) / 1.5);
    }
    const s = {
      tense: base ? 0.35 * Math.max(fast, faster) + 0.35 * pUp + 0.3 * louder : 0.6 * fast + 0.4 * Math.max(esc, lively * 0.7),
      escalating: esc,
      flat: 0.6 * narrow + 0.4 * lowDyn,
      soft: base ? 0.4 * slow + 0.35 * quieter + 0.25 * fall : 0.65 * slow + 0.35 * fall,
      unsure: rise,
      warm: cl((1 - fast) * (1 - narrow) * (1 - esc) * (1 - pUp) * (1 - Math.abs(m.rate - 4.2) / 2.5)) * 0.9
    };
    const ranked = Object.entries(s).sort((a, b) => b[1] - a[1]);
    let tags = ranked.filter(([, v]) => v >= 0.35).slice(0, 2).map(([k, v]) => ({ key: k, score: v }));
    if (!tags.length) tags = [{ key: 'neutral', score: 0.3 }];
    const top = tags[0];
    const levelDependent = top.key === 'tense' || top.key === 'soft';
    const confidence = (m.quality === 'good' && top.score > 0.55 && (base || !levelDependent)) ? 'Moderate' : 'Low';
    return { scores: s, tags, confidence };
  }

  return { synth, analyze, interpret, TAGS };
})();
if (typeof module !== 'undefined') module.exports = Core;
