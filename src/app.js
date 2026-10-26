(() => {
const $ = (s, r = document) => r.querySelector(s);
const SITE = 'https://bawcejawn.github.io/Talya/';
const FREE_PER_DAY = 3;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dayKey = (d = new Date()) => d.toLocaleDateString('en-CA');
const Store = {
  get(k, d) { try { const v = localStorage.getItem('talya.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('talya.' + k, JSON.stringify(v)); } catch (e) {} },
  clear() { try { Object.keys(localStorage).filter(k => k.startsWith('talya.')).forEach(k => localStorage.removeItem(k)); } catch (e) {} }
};
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => t.hidden = true, 2800); }
const slim = m => { const { track, ...rest } = m; return rest; };
const TAGCOLOR = { warm: 'var(--calm)', soft: 'var(--soft)', tense: 'var(--hot)', escalating: 'var(--hot2)', flat: 'var(--cool)', unsure: 'var(--cool2)', neutral: 'var(--line)' };

const COPY = {
  warm: { lead: 'This delivery often comes across as relaxed and open.',
    speaker: 'You likely meant to sound steady and open.',
    listener: 'Most partners hear this as safe to respond to. It invites a reply instead of a defense.',
    tips: ['Keep this pace when you get to the hard part of the conversation.', 'Name the feeling directly: "I\'m a little worried about money this month."'] },
  tense: { lead: 'This delivery often reads as pressured or irritated, even if the words are reasonable.',
    speaker: 'You may feel you are just being clear, efficient, or getting it over with.',
    listener: 'A partner may hear pressure and start preparing a defense before you finish.',
    tips: ['Slow down by about a third and pause after your first sentence.', 'Lead with what you need: "I\'d like us to plan the weekend together" instead of "You always plan without me."'] },
  escalating: { lead: 'Energy builds across this clip. Rising volume and pitch often signal a conversation turning into a fight.',
    speaker: 'Your energy probably built because this matters to you. That is normal.',
    listener: 'A partner often hears the climb more than the words, and their own volume tends to rise to meet it.',
    tips: ['When you notice yourself speeding up, stop and take one breath.', 'Try a repair line: "I\'m getting worked up. Can I start that again?"'] },
  flat: { lead: 'This delivery is very even, with little pitch movement. It can read as tired, guarded, or withholding.',
    speaker: 'You may be tired, or working hard to stay calm.',
    listener: 'A partner may hear little feeling and read it as not caring, or as quiet anger.',
    tips: ['Add one sentence about how you feel: "I\'m frustrated, and I still want to sort this out."', 'Let your voice lift on the part you care about most.'] },
  soft: { lead: 'This delivery is quieter and slower, which often reads as gentle or apologetic.',
    speaker: 'You may be trying to be gentle, or to take responsibility.',
    listener: 'This usually reads as sincere. If it is very soft, the main point can get lost.',
    tips: ['Keep the warmth, and say your key sentence a little more firmly.', 'End with a clear ask so your partner knows what would help.'] },
  unsure: { lead: 'Sentence endings lift here. That can sound tentative, or like a challenge, depending on the words.',
    speaker: 'You may be checking whether your partner agrees with you.',
    listener: 'Lifted endings can sound unsure, or like "right?" pressure, depending on the words.',
    tips: ['Say your main point as a statement, then ask your question on its own.', 'Pause after a question so it lands as a real question.'] },
  neutral: { lead: 'Nothing in the delivery stands out strongly. Listeners will mostly focus on your words.',
    speaker: 'Your delivery is fairly even.', listener: 'Most partners will respond to the content here.',
    tips: ['If the topic is hard, add one sentence about how you feel.'] }
};
const SAMPLES = [
  { id: 's-calm', name: 'Calm check-in', p: { dur: 9, f0: 120, rate: 3.8, pitchVar: 5, contour: x => -1.5 * x, loud: () => 0.35, pauseEvery: 5, seed: 7 } },
  { id: 's-rush', name: 'Rushed reply', p: { dur: 9, f0: 150, rate: 6.4, pitchVar: 4, contour: x => 3 * x, loud: x => 0.3 + 0.5 * x, pauseEvery: 0, seed: 11 } },
  { id: 's-flat', name: '"It\'s fine."', p: { dur: 8, f0: 105, rate: 3.2, pitchVar: 0.8, contour: () => 0, loud: () => 0.25, pauseEvery: 6, seed: 3 } }
];

const state = { clips: [], sel: null, persp: 'listener', playing: null };
SAMPLES.forEach(s => { const audio = Core.synth(s.p); state.clips.push({ id: s.id, name: s.name, example: true, audio, metrics: Core.analyze(audio.data, audio.sr) }); });
const EXAMPLE_BASE = { name: 'Calm check-in', example: true, m: slim(state.clips[0].metrics) };
state.sel = 's-rush';
const getBase = () => Store.get('baseline', null) || EXAMPLE_BASE;
const baseFor = id => (id === 's-calm' && !Store.get('baseline', null)) ? null : getBase().m;

// ---------- history & usage ----------
const hist = () => Store.get('hist', []);
function addEntry(kind, name, m, r, extra = {}) {
  const h = hist(); h.push({ id: 'e' + Date.now() + Math.random().toString(36).slice(2, 6), ts: Date.now(), kind, name, top: r.tags[0].key, tags: r.tags.map(t => t.key), m: { rate: m.rate, medSt: m.medSt, iqr: m.iqr, dbRise: m.dbRise, meanDb: m.meanDb, endRise: m.endRise, dur: m.dur }, ...extra });
  Store.set('hist', h.slice(-400));
}
function countUse() { const u = Store.get('usage', { day: '', n: 0 }); const t = dayKey(); const n = (u.day === t ? u.n : 0) + 1; Store.set('usage', { day: t, n }); renderMeter(); }
function renderMeter() {
  const u = Store.get('usage', { day: '', n: 0 }); const used = u.day === dayKey() ? u.n : 0;
  const left = Math.max(0, FREE_PER_DAY - used);
  $('#meter').innerHTML = `<span>Free plan: <b>${left}</b> of ${FREE_PER_DAY} checks left today${used > FREE_PER_DAY ? ` (beta: unlimited, you've done ${used})` : ''}</span><button class="link" data-goto="plans">See plans</button>`;
}

// ---------- audio ----------
async function decodeBlob(blob) {
  const buf = await blob.arrayBuffer();
  const Ctx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const audio = await new Ctx(1, 1, 44100).decodeAudioData(buf);
  const len = Math.min(audio.length, audio.sampleRate * 60), data = new Float32Array(len);
  for (let ch = 0; ch < audio.numberOfChannels; ch++) { const d = audio.getChannelData(ch); for (let i = 0; i < len; i++) data[i] += d[i] / audio.numberOfChannels; }
  return { data, sr: audio.sampleRate, trimmed: audio.length > len };
}
async function blobToClip(src, name) {
  const audio = (typeof Blob !== 'undefined' && src instanceof Blob) ? await decodeBlob(src) : src;
  await new Promise(r => setTimeout(r, 20));
  const metrics = Core.analyze(audio.data, audio.sr);
  if (audio.trimmed) toast('Only the first 60 seconds were analyzed.');
  else if (!metrics.tooQuiet && metrics.dur < 4) toast('Short clips are less reliable. Aim for 5 seconds or more.');
  countUse();
  return { id: 'u' + Date.now(), name, audio, metrics };
}
const timeLabel = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const IN_PREVIEW = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
const IS_NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
function micError(e) {
  const n = e && e.name;
  if (IN_PREVIEW) return 'Recording is turned off inside this preview window. Open bawcejawn.github.io/Talya in Chrome, Safari or Edge to record.';
  if (n === 'NotAllowedError' || n === 'SecurityError') return IS_NATIVE
    ? 'Talya does not have microphone access. Open your phone\'s Settings, find Talya, and turn on Microphone.'
    : 'Microphone access is blocked. Click the lock or settings icon left of the web address, set Microphone to Allow, then reload the page. On a Mac, also check System Settings → Privacy & Security → Microphone.';
  if (n === 'NotFoundError' || n === 'OverconstrainedError') return 'No microphone was found. Plug in or turn on a microphone, or use your phone instead.';
  if (n === 'NotReadableError') return 'Another app is using the microphone (for example Zoom or Teams). Close it and try again.';
  return 'Recording could not start in this browser. Try Chrome, Safari or Edge, or upload a voice memo.';
}
// Captures raw audio straight from the microphone (no file encoding), and shows a live level meter.
function makeRecorder(btn, note, onAudio, idleLabel) {
  const defaultNote = note.textContent;
  const lvl = document.createElement('div'); lvl.className = 'lvl'; lvl.hidden = true;
  lvl.innerHTML = '<div class="lvlbar"><i></i></div><span class="lvltxt">Listening…</span>';
  btn.insertAdjacentElement('afterend', lvl);
  const bar = lvl.querySelector('i'), txt = lvl.querySelector('.lvltxt');
  const rec = { on: false, ctx: null, stream: null, proc: null, chunks: [], t0: 0, timer: null, peak: -100, lastLoud: 0 };
  const label = () => {
    if (rec.on) { const s = Math.floor((Date.now() - rec.t0) / 1000); btn.textContent = `Stop · 0:${String(s).padStart(2, '0')}`; btn.classList.remove('primary'); btn.classList.add('danger'); }
    else { btn.textContent = typeof idleLabel === 'function' ? idleLabel() : idleLabel; btn.classList.add('primary'); btn.classList.remove('danger'); }
  };
  async function stop() {
    if (!rec.on) return; rec.on = false; clearInterval(rec.timer);
    try { rec.proc.disconnect(); } catch (e) {}
    rec.stream.getTracks().forEach(t => t.stop());
    const sr = rec.ctx.sampleRate; try { rec.ctx.close(); } catch (e) {}
    let n = 0; rec.chunks.forEach(c => n += c.length);
    const data = new Float32Array(n); let o = 0; rec.chunks.forEach(c => { data.set(c, o); o += c.length; });
    lvl.hidden = true; label();
    if (n < sr * 1.5) { note.textContent = 'That was too short. Tap Record, speak for at least 5 seconds, then tap Stop.'; return; }
    note.textContent = defaultNote;
    try { await onAudio({ data, sr }); } catch (e) { note.textContent = 'That recording could not be analyzed. Please try again.'; }
  }
  btn.addEventListener('click', async () => {
    if (rec.on) { stop(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && AC)) { note.textContent = micError({}); return; }
    stopPlay();
    rec.ctx = new AC();                       // created inside the tap so phones allow audio
    try { await rec.ctx.resume(); } catch (e) {}
    try { rec.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); }
    catch (e) { try { rec.ctx.close(); } catch (x) {} note.textContent = micError(e); return; }
    const src = rec.ctx.createMediaStreamSource(rec.stream);
    rec.proc = rec.ctx.createScriptProcessor(4096, 1, 1);
    const mute = rec.ctx.createGain(); mute.gain.value = 0;
    rec.chunks = []; rec.peak = -100; rec.lastLoud = Date.now();
    rec.proc.onaudioprocess = ev => {
      if (!rec.on) return;
      const d = ev.inputBuffer.getChannelData(0); rec.chunks.push(new Float32Array(d));
      let s = 0; for (let i = 0; i < d.length; i++) s += d[i] * d[i];
      const db = 10 * Math.log10(s / d.length + 1e-12), v = Math.max(0, Math.min(1, (db + 60) / 45));
      bar.style.width = (v * 100).toFixed(0) + '%';
      if (db > -48) rec.lastLoud = Date.now();
      const quiet = Date.now() - rec.lastLoud > 2500;
      txt.textContent = quiet ? 'I can\'t hear you. Speak up, or move closer to the mic.' : db > -48 ? 'Hearing you. Keep talking.' : 'Listening…';
      lvl.classList.toggle('quiet', quiet);
    };
    src.connect(rec.proc); rec.proc.connect(mute); mute.connect(rec.ctx.destination);
    rec.on = true; rec.t0 = Date.now(); lvl.hidden = false; lvl.classList.remove('quiet'); label();
    note.textContent = 'Tap Stop when you are done. Recording stops by itself at 60 seconds.';
    rec.timer = setInterval(() => { if (!rec.on) return; label(); if (Date.now() - rec.t0 >= 60000) stop(); }, 250);
  });
  return { relabel: label };
}

// ---------- playback ----------
let actx = null;
function stopPlay() { if (state.playing) { try { state.playing.src.stop(); } catch (e) {} const p = state.playing; state.playing = null; p.done && p.done(); } }
function play(clip, cv, btn) {
  if (state.playing && state.playing.clip === clip) { stopPlay(); return; }
  stopPlay();
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const b = actx.createBuffer(1, clip.audio.data.length, clip.audio.sr); b.copyToChannel(clip.audio.data, 0);
    const src = actx.createBufferSource(); src.buffer = b; src.connect(actx.destination);
    const t0 = actx.currentTime; src.start();
    const p = { src, clip, done: () => { btn.textContent = 'Play clip'; drawViz(clip, cv); } };
    state.playing = p; btn.textContent = 'Stop';
    src.onended = () => { if (state.playing === p) { state.playing = null; p.done(); } };
    const tick = () => { if (state.playing !== p) return; drawViz(clip, cv, Math.min(1, (actx.currentTime - t0) / clip.metrics.dur)); requestAnimationFrame(tick); };
    tick();
  } catch (e) { toast('Playback is not available in this view.'); }
}
function drawViz(clip, cv, head) {
  if (!cv || !cv.isConnected) return;
  const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight; if (!w) return;
  cv.width = w * dpr; cv.height = h * dpr;
  const g = cv.getContext('2d'); g.scale(dpr, dpr);
  const cs = getComputedStyle(document.documentElement), col = n => cs.getPropertyValue(n).trim();
  const { db, pitch, thr } = clip.metrics.track, F = db.length;
  let mx = -Infinity; for (let f = 0; f < F; f++) mx = Math.max(mx, db[f]);
  const lo = thr - 6, hi = mx + 2;
  g.fillStyle = col('--line');
  for (let f = 0; f < F; f++) { const v = Math.max(0, (db[f] - lo) / (hi - lo)), bh = v * (h - 8); g.fillRect(f / F * w, (h - bh) / 2, Math.max(1, w / F - 0.5), bh); }
  const st = []; for (let f = 0; f < F; f++) if (pitch[f] > 0) st.push(12 * Math.log2(pitch[f] / 100));
  if (st.length) {
    const smin = Math.min(...st) - 2, smax = Math.max(...st) + 2;
    g.fillStyle = col('--accent');
    for (let f = 0; f < F; f++) if (pitch[f] > 0) { const s = 12 * Math.log2(pitch[f] / 100), y = h - 6 - (s - smin) / (smax - smin) * (h - 12); g.beginPath(); g.arc(f / F * w, y, 1.8, 0, 7); g.fill(); }
  }
  if (head != null) { g.fillStyle = col('--hot'); g.fillRect(head * w, 0, 2, h); }
}

// ---------- result card (shared by check, prep, practice) ----------
const fmtSigned = (v, d = 1) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(d);
const pctOf = (v, lo, hi) => Math.max(0, Math.min(100, (v - lo) / (hi - lo) * 100));
function scaleHTML(v, lo, hi, bLo, bHi, baseV, left, right) {
  const tick = baseV == null || !isFinite(baseV) ? '' : `<b class="btick" style="left:${pctOf(baseV, lo, hi)}%" title="Your calm baseline"></b>`;
  return `<div class="scale" aria-hidden="true"><span class="band" style="left:${pctOf(bLo, lo, hi)}%;width:${pctOf(bHi, lo, hi) - pctOf(bLo, lo, hi)}%"></span>${tick}<i style="left:${pctOf(v, lo, hi)}%"></i></div><div class="scalelab"><span>${left}</span><span>typical</span><span>${right}</span></div>`;
}
function explain(m, base) {
  const rows = [];
  const paceVs = base && isFinite(base.rate) && Math.abs(m.rate / base.rate - 1) >= 0.1 ? ` That is ${Math.round(Math.abs(m.rate / base.rate - 1) * 100)}% ${m.rate > base.rate ? 'faster' : 'slower'} than your calm voice.` : '';
  rows.push({ name: 'Pace', val: `<code>${m.rate.toFixed(1)}</code> syllables per second`, scale: scaleHTML(m.rate, 2, 8, 3.6, 5.2, base && base.rate, 'Slow', 'Fast'),
    mean: (m.rate > 5.2 ? 'Faster than most everyday conversation. Fast speech can sound rushed, impatient or defensive, and leaves your partner little room to answer.'
      : m.rate < 3.6 ? 'Slower than most everyday conversation. This usually sounds calm or careful. Very slow speech can also sound tired, sad, or like you are holding something back.'
      : 'A normal conversational pace. This usually sounds relaxed and easy to follow.') + paceVs });
  if (base) {
    const d = m.medSt - base.medSt;
    rows.push({ name: 'Pitch (how high your voice is)', val: `<code>${fmtSigned(d)}</code> semitones vs your calm voice`, scale: scaleHTML(d, -6, 6, -2, 2, 0, 'Lower', 'Higher'),
      mean: (d >= 2 ? `Your voice sat ${d.toFixed(1)} semitones higher than when you are calm. A semitone is one step on a piano; 2 or more is noticeable to a listener. A raised voice often signals stress, excitement or upset.`
        : d <= -2 ? `Your voice sat ${Math.abs(d).toFixed(1)} semitones lower than when you are calm. A lower voice can sound serious, tired or low on energy.`
        : 'About the same height as your calm voice, which usually sounds steady.') });
  } else {
    rows.push({ name: 'Pitch (how high your voice is)', val: `<code>${Math.round(m.medHz)} Hz</code>`, scale: '',
      mean: 'Everyone\'s voice sits at a different height, so this number only means something compared to your own calm voice. This clip is your reference point.' });
  }
  rows.push({ name: 'Pitch movement (up and down)', val: `<code>${m.iqr.toFixed(1)}</code> semitones of range`, scale: scaleHTML(m.iqr, 0, 8, 1.5, 4, base && base.iqr, 'Flat', 'Animated'),
    mean: m.iqr < 1.5 ? 'Very little up and down, close to a monotone. To a listener this can sound tired, bored, or like you are holding feelings back, even if you are just trying to stay calm.'
      : m.iqr > 4 ? 'A lot of up and down. This sounds animated. It can read as enthusiastic, or as upset, depending on your words and volume.'
      : 'A normal amount of up and down. You sound engaged without sounding dramatic.' });
  let loudMean = m.dbRise >= 3 ? `You got ${m.dbRise.toFixed(1)} dB louder from start to end. About 3 dB is noticeable and 6 dB sounds clearly louder. Getting louder as you go often reads as frustration building.`
    : m.dbRise <= -3 ? `You got ${Math.abs(m.dbRise).toFixed(1)} dB quieter from start to end. Trailing off can sound unsure or hurt, or like you are giving up on the point.`
    : 'Your volume stayed fairly steady, which tends to sound in control.';
  if (base) { const dl = m.meanDb - base.meanDb; if (Math.abs(dl) >= 3) loudMean += ` Overall you were ${Math.abs(dl).toFixed(0)} dB ${dl > 0 ? 'louder' : 'quieter'} than your calm voice (if you held the mic at the same distance).`; }
  rows.push({ name: 'Loudness change', val: `<code>${fmtSigned(m.dbRise)} dB</code> from start to end`, scale: scaleHTML(m.dbRise, -10, 10, -3, 3, null, 'Quieter', 'Louder'), mean: loudMean });
  rows.push({ name: 'Sentence endings', val: m.endRise > 1.5 ? 'Going up' : m.endRise < -1 ? 'Going down' : 'Level', scale: scaleHTML(m.endRise, -6, 6, -1, 1.5, null, 'Falling', 'Rising'),
    mean: m.endRise > 1.5 ? 'Your last words went up in pitch. Rising endings sound like a question. They can come across as unsure, or as "right?" pressure.'
      : m.endRise < -1 ? 'Your last words went down in pitch. Falling endings sound finished and certain. A very strong drop can sound final or curt.'
      : 'Your ending stayed level, which sounds neutral.' });
  const pr = m.pauseRatio * 100;
  rows.push({ name: 'Pauses', val: `<code>${Math.round(pr)}%</code> of the time`, scale: scaleHTML(pr, 0, 60, 8, 35, null, 'None', 'Many'),
    mean: pr < 8 ? 'Almost no pauses. Without breaks your partner has no room to respond, and it can feel rushed or like a lecture.'
      : pr > 35 ? 'A lot of pausing. This can sound thoughtful, or hesitant and uncomfortable.'
      : 'A natural amount of pausing, which gives a listener time to take things in.' });
  return rows;
}
function reasons(m, base, top) {
  const out = [];
  if (m.rate > 5.2) out.push(`fast pace (${m.rate.toFixed(1)})`);
  if (m.rate < 3.6) out.push(`slow pace (${m.rate.toFixed(1)})`);
  if (base && m.medSt - base.medSt >= 1.5) out.push(`voice ${(m.medSt - base.medSt).toFixed(1)} semitones above your calm voice`);
  if (base && m.meanDb - base.meanDb >= 2) out.push(`louder than your calm voice`);
  if (base && base.meanDb - m.meanDb >= 2) out.push(`quieter than your calm voice`);
  if (m.dbRise >= 3) out.push(`volume building up (+${m.dbRise.toFixed(1)} dB)`);
  if (m.iqr < 1.5) out.push(`very little pitch movement`);
  if (m.iqr > 4) out.push(`a lot of pitch movement`);
  if (m.endRise > 1.5) out.push(`rising sentence endings`);
  if (!out.length) return top === 'neutral' || top === 'warm' ? 'Pace, pitch and volume were all close to normal.' : '';
  return 'Mainly because of: ' + out.slice(0, 3).join(', ') + '.';
}
function resultHTML(clip, r, base, opts = {}) {
  const m = clip.metrics, top = r.tags[0].key, copy = COPY[top];
  const tagsHtml = r.tags.map(t => `<span class="tag ${Core.TAGS[t.key].tone}">${Core.TAGS[t.key].name}<i>${Math.round(t.score * 100)}</i></span>`).join('');
  const why = reasons(m, base, top);
  if (opts.compact) return `<div class="stack" style="gap:10px"><div class="tags">${tagsHtml}</div><p>${copy.lead}</p>${why ? `<p class="hint">${why}</p>` : ''}</div>`;
  const rows = explain(m, base).map(x => `<div class="mrow"><div class="mhead"><b>${x.name}</b><span>${x.val}</span></div>${x.scale}<p>${x.mean}</p></div>`).join('');
  return `
    <div class="result-head">
      <div class="stack" style="gap:8px"><h3>${esc(clip.name)}${clip.example ? ' · example' : ''}</h3><div class="tags">${tagsHtml}</div></div>
      <div class="conf">Confidence: <b>${r.confidence}</b><br>${m.quality === 'good' ? 'Clear recording' : 'Noisy or short recording'}</div>
    </div>
    <p class="lead">${copy.lead}</p>
    ${why ? `<p class="why">${why}</p>` : ''}
    <div class="viz"><canvas aria-label="Loudness and pitch over time"></canvas>
      <div class="legend"><span style="--k:var(--line)">Gray bars: how loud you were</span><span style="--k:var(--accent)">Green dots: how high your voice was</span></div>
      <p class="hint" style="padding:4px 4px 0">Time runs left to right. Taller bars mean louder. Higher dots mean a higher voice. A climbing line of dots means your voice rose as you spoke.</p></div>
    <div class="row">
      <button class="btn" data-act="play">Play clip</button>
      <div class="switch" role="group" aria-label="Perspective">
        <button data-p="speaker" aria-pressed="${state.persp === 'speaker'}">What I meant</button>
        <button data-p="listener" aria-pressed="${state.persp === 'listener'}">How it might land</button>
      </div>
      ${base && !clip.example ? '<button class="btn" data-act="base">Use as my calm baseline</button>' : ''}
    </div>
    <div class="persp"><h3>${state.persp === 'speaker' ? 'From your side' : 'From your partner\'s side'}</h3><p>${state.persp === 'speaker' ? copy.speaker : copy.listener}</p></div>
    <div class="stack"><div class="row" style="justify-content:space-between"><h3>What Talya measured, and what it means</h3><button class="link" data-goto="guide">Full guide</button></div>
      <p class="hint">On each scale, the shaded part is the typical range, the dot is this clip${base ? ', and the purple line is your calm baseline' : ''}.</p>
      <div class="mrows">${rows}</div></div>
    <div class="stack"><h3>Try next time</h3><ul class="tips">${copy.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
      <button class="link" data-goto="practice" style="align-self:flex-start">Practice this in a drill</button></div>
    <p class="fine">The numbers next to each tag (0 to 100) show how strongly the clip matches that pattern. They are not percentages of emotion. Accents, colds, background noise and sarcasm all throw this off. Confidence is never shown as high, because voice alone cannot confirm how you feel.</p>`;
}
const tooQuietHTML = `<p class="lead">Talya could not hear enough voice in this clip.</p><p class="fine">Hold the phone or sit about an arm's length from the computer, in a quiet room, and speak for at least 5 seconds. Watch the green bar while you record: it should move when you talk.</p>`;

// ---------- guided setup ----------
const SETUP = [
  { t: 'Record your calm voice', say: 'This morning I had coffee and toast. Then I checked the weather and got ready for the day. Nothing special, just a normal morning.',
    how: 'Tap Record and read this out loud in your normal, relaxed voice. Tap Stop when you finish. Talya saves it as your calm baseline, so later clips are compared to how you usually sound.' },
  { t: 'Say it the way it comes out in a tense moment', say: 'I asked you to call me, and you didn\'t. I waited for an hour.',
    how: 'Now say this the way you might when you are frustrated. Don\'t act; just say it how it usually comes out.' },
  { t: 'Read your result', say: '',
    how: 'Your result is next to this box (below it on a phone). It compares this clip to your calm voice: faster or slower, higher or lower, louder or quieter. Each measurement has a short explanation. When you are ready, try a drill in Practice.' }
];
const setupStep = () => { const s = Store.get('setup', null); if (s === 'done') return 0; if (s) return s; return Store.get('baseline', null) ? 0 : 1; };
function renderSetup() {
  const n = setupStep(), el = $('#setup');
  if (!n) { el.hidden = true; return; }
  const s = SETUP[n - 1];
  el.hidden = false;
  el.innerHTML = `<div class="row" style="justify-content:space-between"><h3>Get started · step ${n} of 3</h3><button class="link" data-act="skip">Skip</button></div>
    <div class="steps">${[1, 2, 3].map(i => `<span class="${i < n ? 'done' : i === n ? 'now' : ''}"></span>`).join('')}</div>
    <h2>${s.t}</h2>${s.say ? `<p class="script">"${esc(s.say)}"</p>` : ''}<p class="hint">${s.how}</p>
    ${n === 3 ? '<div class="row"><button class="btn primary" data-act="done">Done</button><button class="btn" data-goto="practice">Go to Practice</button></div>' : ''}`;
}
$('#setup').addEventListener('click', e => {
  if (e.target.closest('[data-act="skip"]') || e.target.closest('[data-act="done"]') || e.target.closest('[data-goto]')) { Store.set('setup', 'done'); renderSetup(); checkRec.relabel(); }
});

// ---------- check tab ----------
function renderClips() {
  const savedBase = Store.get('baseline', null);
  $('#clips').innerHTML = state.clips.map(c => {
    const m = c.metrics, r = m.tooQuiet ? null : Core.interpret(m, baseFor(c.id));
    const tag = r ? Core.TAGS[r.tags[0].key].name : 'Too quiet to read';
    return `<li><button class="clip" data-id="${c.id}" aria-pressed="${c.id === state.sel}"><b>${esc(c.name)}</b><span class="pill">${c.example ? 'Example' : 'Yours'}</span><span class="meta">${m.dur.toFixed(1)} s · ${esc(tag)}</span></button></li>`;
  }).join('');
  const b = getBase();
  $('#base').innerHTML = savedBase
    ? `<b>Your calm baseline:</b> ${esc(b.name)}, set ${new Date(savedBase.ts).toLocaleDateString()}. Other clips are compared to it. <button class="link" data-act="rmbase">Redo it</button>`
    : `<b>No calm baseline yet,</b> so Talya is comparing to an example voice. Results get much more accurate once you record your own (step 1 above).`;
}
function renderCheck() {
  const c = state.clips.find(x => x.id === state.sel), el = $('#result');
  if (!c) { el.innerHTML = '<p class="empty">Record or pick a clip to see how it may come across.</p>'; return; }
  if (c.metrics.tooQuiet) { el.innerHTML = `<h2>${esc(c.name)}</h2>` + tooQuietHTML; return; }
  const base = baseFor(c.id), r = Core.interpret(c.metrics, base);
  el.innerHTML = resultHTML(c, r, base);
  drawViz(c, $('canvas', el));
}
async function addUserClip(src, name) {
  $('#result').innerHTML = '<p class="empty">Analyzing on this device…</p>';
  const step = setupStep();
  try {
    const c = await blobToClip(src, step === 1 ? 'Calm baseline' : step === 2 ? 'Tense-moment take' : name);
    state.clips.push(c); state.sel = c.id;
    if (!c.metrics.tooQuiet) {
      if (step === 1) { Store.set('baseline', { name: c.name, ts: Date.now(), m: slim(c.metrics) }); Store.set('setup', 2); toast('Calm baseline saved. Now step 2.'); }
      else if (step === 2) Store.set('setup', 3);
      addEntry('check', c.name, c.metrics, Core.interpret(c.metrics, baseFor(c.id)));
    }
    renderSetup(); checkRec.relabel(); renderClips(); renderCheck();
    if (window.innerWidth < 820) $('#result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) { $('#result').innerHTML = '<p class="empty">This file could not be read as audio. Try an .m4a, .mp3 or .wav voice memo.</p>'; }
}
const checkRec = makeRecorder($('#recBtn'), $('#recNote'), a => addUserClip(a, 'Recording ' + timeLabel()), () => { const n = setupStep(); return n === 1 || n === 2 ? `Record step ${n}` : 'Record'; });
checkRec.relabel();
$('#clips').addEventListener('click', e => { const b = e.target.closest('.clip'); if (!b) return; stopPlay(); state.sel = b.dataset.id; renderClips(); renderCheck(); });
$('#base').addEventListener('click', e => { if (e.target.closest('[data-act="rmbase"]')) { try { localStorage.removeItem('talya.baseline'); } catch (x) {} Store.set('setup', 1); renderSetup(); checkRec.relabel(); renderClips(); renderCheck(); } });
$('#result').addEventListener('click', e => {
  const c = state.clips.find(x => x.id === state.sel); if (!c) return;
  if (e.target.closest('[data-act="play"]')) play(c, $('#result canvas'), e.target.closest('[data-act="play"]'));
  const p = e.target.closest('[data-p]'); if (p) { state.persp = p.dataset.p; renderCheck(); }
  if (e.target.closest('[data-act="base"]')) {
    Store.set('baseline', { name: c.name, ts: Date.now(), m: slim(c.metrics) }); if (setupStep() === 1) Store.set('setup', 2);
    renderSetup(); checkRec.relabel(); renderClips(); renderCheck(); toast('Calm baseline saved on this device.');
  }
});
$('#file').addEventListener('change', e => { const f = e.target.files[0]; if (f) addUserClip(f, f.name.replace(/\.[^.]+$/, '').slice(0, 40) || 'My clip'); e.target.value = ''; });
const drop = $('#drop');
['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) addUserClip(f, f.name.replace(/\.[^.]+$/, '').slice(0, 40)); });
if (IN_PREVIEW) $('#previewNote').hidden = false;

// ---------- prep tab ----------
const TOPICS = {
  'Money': ['stretched', 'our spending this month', 'to agree on a weekly budget together'],
  'Chores': ['worn out', 'how the housework is split', 'to rebalance a couple of tasks'],
  'Family': ['caught in the middle', 'the plans with our families', 'for us to decide together first'],
  'Time together': ['a bit lonely', 'how little time we have had lately', 'one evening a week that is just ours'],
  'Plans': ['left out', 'how the weekend got planned', 'to plan the next one together'],
  'Something else': ['', '', '']
};
let topic = 'Time together';
$('#topics').innerHTML = Object.keys(TOPICS).map(t => `<button class="chip" data-t="${t}" aria-pressed="${t === topic}">${t}</button>`).join('');
function setTopic(t) {
  topic = t; document.querySelectorAll('#topics .chip').forEach(c => c.setAttribute('aria-pressed', c.dataset.t === t));
  const [f, a, n] = TOPICS[t]; $('#pFeel').placeholder = f || 'how you feel'; $('#pAbout').placeholder = a || 'the situation'; $('#pNeed').placeholder = n || 'what would help';
  renderPrep();
}
$('#topics').addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) setTopic(c.dataset.t); });
const FLAGS = [
  [/\b(always|never)\b/i, '"Always" and "never" usually start a debate about the exceptions. Describe this one time instead.'],
  [/\byou\s+(always|never|should|need to|don'?t|didn'?t|make me|keep)\b/i, 'Starting with "you…" can sound like blame. Try starting with "I".'],
  [/\bwhy\s+(do|did|can'?t|won'?t|would)\s+you\b/i, '"Why do you…" questions often land as accusations. Try "Can we figure out…".'],
  [/\b(whatever|calm down|overreacting|dramatic|crazy)\b/i, 'This word often reads as dismissive, even when said kindly.'],
  [/\b(but)\b/i, '"But" can cancel what came before it. Try "and".']
];
function openingText() {
  const own = $('#pOwn').value.trim(); if (own) return own;
  const v = id => $(id).value.trim() || $(id).placeholder;
  return `I feel ${v('#pFeel')} about ${v('#pAbout')}. What I'd like is ${v('#pNeed')}. Can we talk about it?`;
}
function renderPrep() {
  const t = openingText();
  $('#opening').textContent = t;
  const hits = FLAGS.filter(([re]) => re.test(t)).map(([, msg]) => `<p class="flag">${esc(msg)}</p>`);
  $('#flags').innerHTML = `<h3>Word check</h3>` + (hits.length ? hits.join('') : '<p class="flag good">No common blame phrases found.</p>') + '<p class="fine">Looks for a few common phrases only. It does not understand meaning.</p>';
}
['#pFeel', '#pAbout', '#pNeed', '#pOwn'].forEach(id => $(id).addEventListener('input', renderPrep));
function softGoal(m, r, b) {
  const okTone = r.tags.some(t => ['warm', 'soft', 'neutral'].includes(t.key)) && !r.tags.some(t => ['tense', 'escalating'].includes(t.key));
  const lim = (b ? b.rate : 4.8) + 0.3;
  return { ok: okTone && m.rate <= lim, detail: `Pace <code>${m.rate.toFixed(1)}</code> (goal ${lim.toFixed(1)} or less). Tone: ${r.tags.map(t => Core.TAGS[t.key].name).join(', ')}.` };
}
async function prepBlob(blob) {
  const out = $('#prepOut'); out.innerHTML = '<p class="empty">Analyzing on this device…</p>';
  const c = await blobToClip(blob, 'Prep: ' + topic);
  if (c.metrics.tooQuiet) { out.innerHTML = tooQuietHTML; return; }
  const b = getBase().m, r = Core.interpret(c.metrics, b), g = softGoal(c.metrics, r, b);
  addEntry('prep', 'Prep: ' + topic, c.metrics, r, { ok: g.ok });
  out.innerHTML = `<div class="verdict ${g.ok ? 'ok' : 'no'}"><b>${g.ok ? 'Ready. That opening sounds calm.' : 'Try it once more, a little slower.'}</b><span>${g.detail}</span></div>` + resultHTML(c, r, b, { compact: true });
}
makeRecorder($('#prepRec'), $('#prepNote'), prepBlob, 'Record my opening');
$('#prepFile').addEventListener('change', e => { const f = e.target.files[0]; if (f) prepBlob(f).catch(() => $('#prepOut').innerHTML = '<p class="empty">That file could not be read as audio.</p>'); e.target.value = ''; });

// ---------- practice tab ----------
const tagIn = (r, keys) => r.tags.some(t => keys.includes(t.key));
const EX = [
  { id: 'soft', t: 'Soft start', free: true, d: 'Open a hard topic without blame: the situation, your feeling, one request.',
    s: '"I\'ve been feeling stretched thin this week. Could we split dinners differently?"', goal: 'Warm or soft tone, at or below your usual pace.', check: softGoal },
  { id: 'repair', t: 'Repair attempt', free: true, d: 'Pause a conversation that is heating up, before it gets worse.',
    s: '"I\'m getting defensive. Can we slow down for a minute?"', goal: 'No build-up: loudness rises less than 2 dB from start to end.',
    check: (m, r) => ({ ok: m.dbRise < 2 && !tagIn(r, ['escalating', 'tense']), detail: `Loudness <code>${fmtSigned(m.dbRise)} dB</code> start to end (goal under +2). Tone: ${r.tags.map(t => Core.TAGS[t.key].name).join(', ')}${tagIn(r, ['escalating', 'tense']) ? ' (goal: not tense or escalating; slow down and soften)' : ''}.` }) },
  { id: 'feel', t: 'Say the feeling', free: true, d: 'Name the emotion out loud so your voice does not have to carry it alone.',
    s: '"I\'m hurt, and I want to understand what happened."', goal: 'Enough pitch movement to sound engaged: 1.8 semitones or more.',
    check: (m) => ({ ok: m.iqr >= 1.8, detail: `Pitch movement <code>${m.iqr.toFixed(1)}</code> semitones (goal 1.8 or more).` }) },
  { id: 'slow', t: 'Slow replay', d: 'Say something from a recent argument. Then say it again, slower. Talya compares the two takes.',
    s: 'Your own words, twice.', goal: 'Second take at 80% of the first take\'s pace or slower.', twoStep: true,
    check: (m, r, b, first) => { const lim = first.rate * 0.8; return { ok: m.rate <= lim, detail: `Take 1 <code>${first.rate.toFixed(1)}</code> → take 2 <code>${m.rate.toFixed(1)}</code> syll/s (goal ${lim.toFixed(1)} or less).` }; } },
  { id: 'steady', t: 'Steady under pressure', d: 'Respond to your partner\'s frustration without matching their volume.',
    s: '"I hear that you\'re upset. I want to get this right."', goal: 'Within 3 dB and 2 semitones of your baseline.',
    check: (m, r, b) => { const dl = m.meanDb - b.meanDb, dp = m.medSt - b.medSt; return { ok: Math.abs(dl) <= 3 && Math.abs(dp) <= 2, detail: `Loudness <code>${fmtSigned(dl)} dB</code>, pitch <code>${fmtSigned(dp)}</code> st vs baseline.` }; } },
  { id: 'ask', t: 'Clear ask', d: 'Make a request that sounds like a request, not a complaint or a maybe.',
    s: '"Could you text me when you\'re running late? It would really help."', goal: 'Not rushed (under 5.2 syll/s), and no tense tone.',
    check: (m, r) => ({ ok: m.rate < 5.2 && !tagIn(r, ['tense', 'escalating']), detail: `Pace <code>${m.rate.toFixed(1)}</code> syll/s. Tone: ${r.tags.map(t => Core.TAGS[t.key].name).join(', ')}.` }) }
];
const firstTakes = {};
function streakDays() {
  const days = new Set(hist().filter(e => e.kind === 'practice').map(e => dayKey(new Date(e.ts))));
  let n = 0; const d = new Date(); if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function renderStreak() { const n = streakDays(); $('#streak').innerHTML = n ? `<span>Practice streak: <b>${n} day${n > 1 ? 's' : ''}</b></span>` : '<span>Do one drill a day to start a streak.</span>'; }
$('#exercises').innerHTML = EX.map(x => `<div class="card" data-ex="${x.id}">
  <div class="row" style="justify-content:space-between"><h2>${x.t}</h2>${x.free ? '<span class="pill">Free</span>' : '<span class="pill pro">Together · free in beta</span>'}</div>
  <p>${x.d}</p><p class="say">${esc(x.s)}</p><p class="goal"><b>Goal:</b> ${x.goal}</p><span class="spacer"></span>
  <div class="row"><button class="btn primary" data-rec>Record</button><label class="btn" for="exf-${x.id}">Upload</label><input type="file" id="exf-${x.id}" accept="audio/*" hidden></div>
  <small class="hint" data-note></small><div data-out aria-live="polite"></div></div>`).join('');
EX.forEach(x => {
  const card = $(`[data-ex="${x.id}"]`), out = $('[data-out]', card), note = $('[data-note]', card);
  const idle = () => x.twoStep ? (firstTakes[x.id] ? 'Record take 2 (slower)' : 'Record take 1') : 'Record';
  const handle = async blob => {
    out.innerHTML = '<p class="hint">Analyzing…</p>';
    const c = await blobToClip(blob, x.t);
    if (c.metrics.tooQuiet) { out.innerHTML = tooQuietHTML; return; }
    const b = getBase().m, r = Core.interpret(c.metrics, b);
    if (x.twoStep && !firstTakes[x.id]) {
      firstTakes[x.id] = c.metrics; recr.relabel();
      out.innerHTML = `<div class="verdict ok"><b>Take 1 saved.</b><span>Pace <code>${c.metrics.rate.toFixed(1)}</code> syll/s. Now say the same words again, slower.</span></div>`; return;
    }
    const g = x.check(c.metrics, r, b, firstTakes[x.id]);
    if (x.twoStep) { delete firstTakes[x.id]; recr.relabel(); }
    addEntry('practice', x.t, c.metrics, r, { ex: x.id, ok: g.ok });
    out.innerHTML = `<div class="verdict ${g.ok ? 'ok' : 'no'}"><b>${g.ok ? 'Goal met.' : 'Not yet. Try once more.'}</b><span>${g.detail}</span></div>`;
    renderStreak();
  };
  const recr = makeRecorder($('[data-rec]', card), note, handle, idle); recr.relabel();
  $(`#exf-${x.id}`).addEventListener('change', e => { const f = e.target.files[0]; if (f) handle(f).catch(() => out.innerHTML = '<p class="hint">That file could not be read as audio.</p>'); e.target.value = ''; });
});

// ---------- progress tab ----------
function exampleHist() {
  const now = Date.now(), D = 864e5;
  const mk = (dago, kind, name, top, rate, extra = {}) => ({ ts: now - dago * D - 3600e3 * (dago % 5), kind, name, top, tags: [top], m: { rate }, example: true, ...extra });
  return [mk(6, 'check', 'Morning check', 'tense', 5.9), mk(6, 'practice', 'Soft start', 'warm', 4.6, { ok: false }), mk(5, 'practice', 'Soft start', 'warm', 4.2, { ok: true }),
    mk(4, 'check', 'After work', 'flat', 3.4), mk(3, 'practice', 'Repair attempt', 'soft', 3.9, { ok: true }), mk(3, 'prep', 'Prep: Money', 'warm', 4.0, { ok: true }),
    mk(2, 'check', 'Phone call', 'tense', 5.4), mk(1, 'practice', 'Say the feeling', 'warm', 4.1, { ok: true }), mk(0, 'check', 'Evening', 'warm', 4.0)];
}
function progressData() { const h = hist(); return h.length ? { list: h, example: false } : { list: exampleHist(), example: true }; }
function renderProgress() {
  const { list, example } = progressData();
  $('#progNote').textContent = example ? 'Example week. Your own results appear here after your first check, and stay only in this browser.' : '';
  const wk = list.filter(e => e.ts > Date.now() - 7 * 864e5);
  const counts = {}; wk.forEach(e => counts[e.top] = (counts[e.top] || 0) + 1);
  const topTone = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const drills = wk.filter(e => e.kind === 'practice'), passed = drills.filter(e => e.ok).length;
  const streak = example ? 3 : streakDays();
  $('#stats').innerHTML = [[wk.length, 'checks and drills this week'], [topTone ? Core.TAGS[topTone[0]].name : '–', 'most common tone'], [`${passed}/${drills.length}`, 'drill goals met'], [streak, 'day practice streak']]
    .map(([v, l]) => `<div class="stat"><b>${esc(v)}</b><span>${l}</span></div>`).join('');
  const total = wk.length || 1;
  $('#mix').innerHTML = Object.entries(counts).map(([k, n]) => `<i style="width:${n / total * 100}%;background:${TAGCOLOR[k]}" title="${Core.TAGS[k].name}: ${n}"></i>`).join('');
  $('#mixkey').innerHTML = Object.entries(counts).map(([k, n]) => `<span style="--k:${TAGCOLOR[k]}">${Core.TAGS[k].name} ${n}</span>`).join('') || '<span>No checks yet</span>';
  paceChart(list.slice(-20), example ? 4.0 : getBase().m.rate);
  const rows = list.slice(-30).reverse();
  $('#hist').innerHTML = rows.map(e => `<li><span><b>${esc(e.name)}</b> <span class="when">· ${new Date(e.ts).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span></span><span class="conf">${Core.TAGS[e.top].name}${e.ok === true ? ' · goal met' : e.ok === false ? ' · not yet' : ''}</span>${example ? '<span class="pill">Example</span>' : `<button class="x" data-del="${e.id}" aria-label="Delete ${esc(e.name)}">×</button>`}</li>`).join('');
  $('#clearHist').hidden = example;
  drawShare(wk, counts, passed, drills.length, streak);
}
function paceChart(pts, baseRate) {
  const W = 560, H = 200, L = 38, R = 14, T = 12, B = 26;
  if (!pts.length) { $('#paceChart').innerHTML = '<p class="empty">No checks yet</p>'; return; }
  const vals = pts.map(p => p.m.rate).concat([baseRate]);
  const lo = Math.floor(Math.min(...vals) - 0.3), hi = Math.ceil(Math.max(...vals) + 0.3);
  const x = i => L + (pts.length === 1 ? (W - L - R) / 2 : i / (pts.length - 1) * (W - L - R)), y = v => T + (hi - v) / (hi - lo) * (H - T - B);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Pace in syllables per second over recent checks">`;
  for (let v = lo; v <= hi; v++) s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--line)" stroke-width="1"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end" style="fill:var(--muted);font:12px var(--mono)">${v}</text>`;
  s += `<line x1="${L}" x2="${W - R}" y1="${y(baseRate)}" y2="${y(baseRate)}" style="stroke:var(--partner)" stroke-width="1.5" stroke-dasharray="5 4"/><text x="${W - R}" y="${y(baseRate) - 6}" text-anchor="end" style="fill:var(--partner);font:12px var(--body)">baseline ${baseRate.toFixed(1)}</text>`;
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.m.rate).toFixed(1)}`).join('');
  s += `<path d="${d}" fill="none" style="stroke:var(--accent)" stroke-width="2"/>`;
  pts.forEach((p, i) => { const lastP = i === pts.length - 1; s += `<circle cx="${x(i)}" cy="${y(p.m.rate)}" r="${lastP ? 5 : 3}" style="fill:${lastP ? 'var(--accent)' : 'var(--surface)'};stroke:var(--accent)" stroke-width="2"><title>${esc(p.name)}: ${p.m.rate.toFixed(1)}</title></circle>`; });
  const dl = t => new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric' });
  s += `<text x="${L}" y="${H - 6}" style="fill:var(--muted);font:12px var(--body)">${dl(pts[0].ts)}</text><text x="${W - R}" y="${H - 6}" text-anchor="end" style="fill:var(--muted);font:12px var(--body)">${dl(pts[pts.length - 1].ts)}</text>`;
  s += `<text x="${L}" y="${T - 2}" style="fill:var(--muted);font:11px var(--body)">syllables / sec</text></svg>`;
  $('#paceChart').innerHTML = s;
}
function drawShare(wk, counts, passed, drillN, streak) {
  const cv = $('#shareCv'), g = cv.getContext('2d'), cs = getComputedStyle(document.documentElement), col = n => cs.getPropertyValue(n).trim();
  const W = 1080, H = 1350;
  g.fillStyle = col('--surface'); g.fillRect(0, 0, W, H);
  g.fillStyle = col('--accent'); g.fillRect(0, 0, W, 16);
  g.fillStyle = col('--ink'); g.font = '84px "Young Serif", Georgia, serif'; g.fillText('My week', 90, 230);
  g.fillStyle = col('--muted'); g.font = '40px Figtree, system-ui, sans-serif'; g.fillText('in tone of voice', 90, 300);
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const lines = [[String(wk.length), 'checks and drills'], [top ? Core.TAGS[top[0]].name : '–', 'most common tone'], [`${passed}/${drillN}`, 'drill goals met'], [String(streak), 'day practice streak']];
  lines.forEach(([v, l], i) => { const yy = 470 + i * 160; g.fillStyle = col('--ink'); g.font = '72px "Young Serif", Georgia, serif'; g.fillText(v, 90, yy); g.fillStyle = col('--muted'); g.font = '36px Figtree, system-ui, sans-serif'; g.fillText(l, 90, yy + 52); });
  let xx = 90; const total = wk.length || 1, bw = W - 180;
  Object.entries(counts).forEach(([k, n]) => { const w = n / total * bw; g.fillStyle = col(TAGCOLOR[k].slice(4, -1)); g.fillRect(xx, 1120, w, 36); xx += w; });
  g.fillStyle = col('--muted'); g.font = '32px Figtree, system-ui, sans-serif'; g.fillText('Talya · bawcejawn.github.io/Talya', 90, 1250);
}
$('#hist').addEventListener('click', e => { const b = e.target.closest('[data-del]'); if (!b) return; Store.set('hist', hist().filter(x => x.id !== b.dataset.del)); renderProgress(); });
$('#clearHist').addEventListener('click', () => { Store.set('hist', []); renderProgress(); toast('History cleared on this device.'); });
$('#shareBtn').addEventListener('click', () => {
  if (IS_NATIVE) {
    const P = window.Capacitor.Plugins;
    const b64 = $('#shareCv').toDataURL('image/png').split(',')[1];
    P.Filesystem.writeFile({ path: 'talya-week.png', data: b64, directory: 'CACHE' })
      .then(r => P.Share.share({ title: 'My week with Talya', files: [r.uri] }))
      .catch(e => { if (!/cancel/i.test(String(e && e.message))) toast('Sharing did not work. Try again.'); });
    return;
  }
  $('#shareCv').toBlob(async blob => {
    if (!blob) { toast('The card could not be created.'); return; }
    const file = new File([blob], 'talya-week.png', { type: 'image/png' });
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'My week with Talya' }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    try { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'talya-week.png'; document.body.appendChild(a); a.click(); a.remove(); toast('Card saved as an image.'); }
    catch (e) { toast('Sharing is not available in this view. Open Talya in your browser.'); }
  }, 'image/png');
});

// ---------- our space ----------
$('#inviteText').value = `I'm trying Talya, a free app that plays back how your tone of voice comes across. Audio stays on your own phone, and it only checks your own voice. Want to try it with me this week? ${SITE}`;
$('#copyInvite').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('#inviteText').value); toast('Invite copied. Send it however you like.'); }
  catch (e) { $('#inviteText').select(); toast('Select all and copy the text.'); }
});
const QS = ['What is one thing I did this week that made you feel cared for?', 'When did you feel most disconnected from me this week?', 'Is there anything you have wanted to say but held back?', 'What is one small thing I could do next week that would help?', 'What are you looking forward to that we could do together?', 'Was there a moment this week where my tone surprised you?', 'What has been stressing you outside of us?', 'What is something you appreciated but did not mention?', 'Is there a conversation we keep postponing?', 'How rested and supported do you feel right now, from 1 to 10?', 'What made you laugh this week?', 'What would make next Sunday easier?'];
function newQs() { const pool = QS.slice(); const pick = []; while (pick.length < 4) pick.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]); $('#checkin').innerHTML = pick.map(q => `<li>${esc(q)}</li>`).join(''); }
$('#newQ').addEventListener('click', newQs); newQs();
const cons = Store.get('consent', {});
['c1', 'c2', 'c3'].forEach(id => { $('#' + id).checked = !!cons[id]; $('#' + id).addEventListener('change', () => { cons[id] = $('#' + id).checked; Store.set('consent', cons); consent(); }); });
function consent() { const on = ['c1', 'c2', 'c3'].filter(id => cons[id]).length; $('#consentState').textContent = on ? `You turned on ${on} of 3. When linked accounts arrive, your partner will see a request and must agree before anything is shared.` : 'Everything is private to you right now.'; }
consent();
$('#delArea').addEventListener('click', e => {
  if (e.target.closest('#delBtn')) $('#delArea').innerHTML = '<div class="confirm"><span>Delete your baseline, history, streak and settings on this device? This cannot be undone.</span><button class="btn danger" id="delYes">Delete</button><button class="btn" id="delNo">Cancel</button></div>';
  if (e.target.closest('#delNo')) $('#delArea').innerHTML = '<button class="btn danger" id="delBtn">Delete everything on this device</button>';
  if (e.target.closest('#delYes')) {
    Store.clear(); state.clips = state.clips.filter(c => c.example); state.sel = 's-rush';
    ['c1', 'c2', 'c3'].forEach(id => { cons[id] = false; $('#' + id).checked = false; }); consent();
    renderClips(); renderCheck(); renderMeter(); renderStreak();
    $('#delArea').innerHTML = '<p class="fine">Deleted. Nothing from Talya is left on this device except the built-in examples.</p>';
  }
});

// ---------- plans / upgrade sheet ----------
function sheet(html) { const s = $('#sheet'); s.innerHTML = `<div class="panel stack" role="dialog" aria-modal="true">${html}<div class="row"><button class="btn" data-close>Close</button></div></div>`; s.hidden = false; $('[data-close]', s).focus(); }
$('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet' || e.target.closest('[data-close]')) $('#sheet').hidden = true; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') $('#sheet').hidden = true; });
$('#view-plans').addEventListener('click', e => {
  const b = e.target.closest('[data-up]'); if (!b) return;
  if (b.dataset.up === 'gift') sheet('<h2>Gift a year of Talya</h2><p>Gift codes open with paid plans. They will work for any couple, with no account needed to redeem the first week.</p><p class="fine">During the beta, anyone can use every feature for free. Share the link instead: ' + SITE + '</p>');
  else sheet('<h2>Founding couples</h2><p>The first couples to join keep a founding price of <b>$19.99 for the first year</b> (then $29.99 a year) when paid plans open.</p><p>During the beta every feature is free, so there is nothing to pay today.</p><p class="fine">One plan covers both partners. Cancel any time. Your voice is never stored on a server or sold.</p>');
});

// ---------- tabs ----------
const VIEWS = ['check', 'prep', 'practice', 'progress', 'space', 'guide', 'plans'];
function go(v) {
  document.querySelectorAll('nav button').forEach(x => x.setAttribute('aria-selected', x.dataset.view === v));
  VIEWS.forEach(n => $('#view-' + n).hidden = n !== v);
  if (v === 'check') renderCheck(); if (v === 'progress') renderProgress(); if (v === 'practice') renderStreak(); if (v === 'prep') renderPrep();
  try { window.scrollTo({ top: 0 }); } catch (e) {}
}
document.querySelectorAll('nav button').forEach(b => b.addEventListener('click', () => go(b.dataset.view)));
document.addEventListener('click', e => { const g = e.target.closest('[data-goto]'); if (g) go(g.dataset.goto); });
const startView = (location.hash || '').slice(1);
window.addEventListener('resize', () => { const c = state.clips.find(x => x.id === state.sel); if (c && !c.metrics.tooQuiet) drawViz(c, $('#result canvas')); });
try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { renderCheck(); renderProgress(); }); } catch (e) {}
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!$('#view-progress').hidden) renderProgress(); });
renderMeter(); renderSetup(); renderClips(); setTopic(topic); renderStreak(); renderProgress();
go(VIEWS.includes(startView) ? startView : 'check');
})();
