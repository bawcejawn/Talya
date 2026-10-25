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
async function blobToClip(blob, name) {
  const audio = await decodeBlob(blob);
  await new Promise(r => setTimeout(r, 20));
  const metrics = Core.analyze(audio.data, audio.sr);
  if (audio.trimmed) toast('Only the first 60 seconds were analyzed.');
  else if (!metrics.tooQuiet && metrics.dur < 4) toast('Short clips are less reliable. Aim for 5 seconds or more.');
  countUse();
  return { id: 'u' + Date.now(), name, audio, metrics };
}
const timeLabel = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

function makeRecorder(btn, note, onBlob, idleLabel) {
  const rec = { mr: null, chunks: [], stream: null, t0: 0, timer: null };
  const label = () => {
    if (rec.mr) { const s = Math.floor((Date.now() - rec.t0) / 1000); btn.textContent = `Stop · 0:${String(s).padStart(2, '0')}`; btn.classList.remove('primary'); btn.classList.add('danger'); }
    else { btn.textContent = typeof idleLabel === 'function' ? idleLabel() : idleLabel; btn.classList.add('primary'); btn.classList.remove('danger'); }
  };
  btn.addEventListener('click', async () => {
    if (rec.mr) { rec.mr.stop(); return; }
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder)) { note.textContent = 'This browser cannot record here. Upload a voice memo instead.'; return; }
    try { rec.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); }
    catch (e) { note.textContent = 'Microphone access was blocked. Allow it in your browser settings, or upload a voice memo instead.'; return; }
    stopPlay();
    rec.chunks = []; rec.mr = new MediaRecorder(rec.stream);
    rec.mr.ondataavailable = e => { if (e.data && e.data.size) rec.chunks.push(e.data); };
    rec.mr.onstop = async () => {
      clearInterval(rec.timer); rec.stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(rec.chunks, { type: rec.mr.mimeType || 'audio/webm' });
      rec.mr = null; label();
      try { await onBlob(blob); } catch (e) { note.textContent = 'That recording could not be read. Try again, or upload a voice memo.'; }
    };
    rec.mr.start(); rec.t0 = Date.now(); label();
    rec.timer = setInterval(() => { if (!rec.mr) return; label(); if (Date.now() - rec.t0 >= 60000) rec.mr.stop(); }, 250);
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
function resultHTML(clip, r, base, opts = {}) {
  const m = clip.metrics, top = r.tags[0].key, copy = COPY[top];
  const tagsHtml = r.tags.map(t => `<span class="tag ${Core.TAGS[t.key].tone}">${Core.TAGS[t.key].name}<i>${Math.round(t.score * 100)}</i></span>`).join('');
  if (opts.compact) return `<div class="stack" style="gap:10px"><div class="tags">${tagsHtml}</div><p>${copy.lead}</p><p class="hint">Pace <code>${m.rate.toFixed(1)}</code> syll/s · pitch movement <code>${m.iqr.toFixed(1)}</code> st · loudness <code>${fmtSigned(m.dbRise)} dB</code> start to end · confidence ${r.confidence.toLowerCase()}</p></div>`;
  const isBase = !base && !clip.example ? false : !base;
  const rateNote = m.rate > 5.2 ? 'faster than typical conversation' : m.rate < 3.6 ? 'slower than typical conversation' : 'typical conversational pace';
  const pitchNote = m.iqr < 1.5 ? 'narrow, very even' : m.iqr > 4 ? 'wide, very animated' : 'moderate';
  const end = m.endRise > 1.5 ? 'rising' : m.endRise < -1 ? 'falling' : 'level';
  const vsBase = base ? `<code>${fmtSigned(m.medSt - base.medSt)}</code> semitones vs baseline` : 'this is the baseline';
  const loudBase = base ? ` · <code>${fmtSigned(m.meanDb - base.meanDb)} dB</code> vs baseline` : '';
  return `
    <div class="result-head">
      <div class="stack" style="gap:8px"><h3>${esc(clip.name)}${clip.example ? ' · example' : ''}</h3><div class="tags">${tagsHtml}</div></div>
      <div class="conf">Confidence: <b>${r.confidence}</b><br>${m.quality === 'good' ? 'Clear recording' : 'Noisy or short recording'}</div>
    </div>
    <p class="lead">${copy.lead}</p>
    <div class="viz"><canvas aria-label="Loudness and pitch over time"></canvas>
      <div class="legend"><span style="--k:var(--line)">Loudness</span><span style="--k:var(--accent)">Pitch</span><span style="--k:var(--hot)">Playhead</span></div></div>
    <div class="row">
      <button class="btn" data-act="play">Play clip</button>
      <div class="switch" role="group" aria-label="Perspective">
        <button data-p="speaker" aria-pressed="${state.persp === 'speaker'}">What I meant</button>
        <button data-p="listener" aria-pressed="${state.persp === 'listener'}">How it might land</button>
      </div>
      ${base ? '<button class="btn" data-act="base">Use as my baseline</button>' : ''}
    </div>
    <div class="persp"><h3>${state.persp === 'speaker' ? 'From your side' : 'From your partner\'s side'}</h3><p>${state.persp === 'speaker' ? copy.speaker : copy.listener}</p></div>
    <div class="two">
      <div class="stack"><h3>What Talya measured</h3>
        <dl class="meas">
          <dt>Pace</dt><dd><code>${m.rate.toFixed(1)}</code> syllables/s, ${rateNote}</dd>
          <dt>Pitch</dt><dd><code>${Math.round(m.medHz)} Hz</code> typical, ${vsBase}</dd>
          <dt>Pitch movement</dt><dd><code>${m.iqr.toFixed(1)}</code> semitones, ${pitchNote}</dd>
          <dt>Loudness</dt><dd><code>${fmtSigned(m.dbRise)} dB</code> start to end${loudBase}</dd>
          <dt>Endings</dt><dd>${end}</dd>
          <dt>Pauses</dt><dd><code>${Math.round(m.pauseRatio * 100)}%</code> of speaking time</dd>
        </dl></div>
      <div class="stack"><h3>Try next time</h3><ul class="tips">${copy.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
        <button class="link" data-goto="practice" style="align-self:flex-start">Practice this in a drill</button></div>
    </div>
    <p class="fine">Scores are 0 to 100 pattern matches, not percentages of emotion. Accents, colds, background noise and sarcasm all throw this off. Confidence is never shown as high, because voice alone cannot confirm how you feel.</p>`;
}
const tooQuietHTML = `<p class="lead">Talya could not find enough voice in this clip.</p><p class="fine">Try again closer to the phone, in a quieter room, with at least 5 seconds of speech.</p>`;

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
    ? `<b>Your baseline:</b> ${esc(b.name)}, set ${new Date(savedBase.ts).toLocaleDateString()}. Pitch, loudness and pace are compared to it. <button class="link" data-act="rmbase">Remove</button>`
    : `<b>Using an example baseline.</b> For real accuracy, record yourself saying something neutral (what you had for breakfast), then tap "Use as my baseline."`;
}
function renderCheck() {
  const c = state.clips.find(x => x.id === state.sel), el = $('#result');
  if (!c) { el.innerHTML = '<p class="empty">Record or pick a clip to see how it may come across.</p>'; return; }
  if (c.metrics.tooQuiet) { el.innerHTML = `<h2>${esc(c.name)}</h2>` + tooQuietHTML; return; }
  const base = baseFor(c.id), r = Core.interpret(c.metrics, base);
  el.innerHTML = resultHTML(c, r, base);
  drawViz(c, $('canvas', el));
}
async function addUserClip(blob, name) {
  $('#result').innerHTML = '<p class="empty">Analyzing on this device…</p>';
  try {
    const c = await blobToClip(blob, name);
    state.clips.push(c); state.sel = c.id;
    if (!c.metrics.tooQuiet) addEntry('check', c.name, c.metrics, Core.interpret(c.metrics, baseFor(c.id)));
    renderClips(); renderCheck();
  } catch (e) { $('#result').innerHTML = '<p class="empty">This file could not be read as audio. Try an .m4a, .mp3 or .wav voice memo.</p>'; }
}
makeRecorder($('#recBtn'), $('#recNote'), b => addUserClip(b, 'Recording ' + timeLabel()), 'Record');
$('#clips').addEventListener('click', e => { const b = e.target.closest('.clip'); if (!b) return; stopPlay(); state.sel = b.dataset.id; renderClips(); renderCheck(); });
$('#base').addEventListener('click', e => { if (e.target.closest('[data-act="rmbase"]')) { try { localStorage.removeItem('talya.baseline'); } catch (x) {} renderClips(); renderCheck(); } });
$('#result').addEventListener('click', e => {
  const c = state.clips.find(x => x.id === state.sel); if (!c) return;
  if (e.target.closest('[data-act="play"]')) play(c, $('#result canvas'), e.target.closest('[data-act="play"]'));
  const p = e.target.closest('[data-p]'); if (p) { state.persp = p.dataset.p; renderCheck(); }
  if (e.target.closest('[data-act="base"]')) {
    if (c.example) { toast('Examples cannot be your baseline. Record your own calm clip.'); return; }
    Store.set('baseline', { name: c.name, ts: Date.now(), m: slim(c.metrics) }); renderClips(); renderCheck(); toast('Baseline saved on this device.');
  }
});
$('#file').addEventListener('change', e => { const f = e.target.files[0]; if (f) addUserClip(f, f.name.replace(/\.[^.]+$/, '').slice(0, 40) || 'My clip'); e.target.value = ''; });
const drop = $('#drop');
['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) addUserClip(f, f.name.replace(/\.[^.]+$/, '').slice(0, 40)); });

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
    check: (m, r) => ({ ok: m.dbRise < 2 && !tagIn(r, ['escalating', 'tense']), detail: `Loudness <code>${fmtSigned(m.dbRise)} dB</code> start to end (goal under +2).` }) },
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
const VIEWS = ['check', 'prep', 'practice', 'progress', 'space', 'plans'];
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
renderMeter(); renderClips(); setTopic(topic); renderStreak(); renderProgress();
go(VIEWS.includes(startView) ? startView : 'check');
})();
