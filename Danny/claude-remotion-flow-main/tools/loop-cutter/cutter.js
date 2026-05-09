// ── Theme Toggle ──────────────────────────────────────────────────────────
const root = document.documentElement;
let theme = 'dark';
const themeBtn = document.getElementById('themeToggle');
themeBtn.addEventListener('click', () => {
  theme = theme === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', theme);
  themeBtn.innerHTML = theme === 'dark'
    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
  drawWaveform(); drawOverlay();
});

// ── Audio State ───────────────────────────────────────────────────────────
let audioCtx = null;
let audioBuffer = null;
let source = null;
let gainNode = null;
let isPlaying = false;
let isLooping = false;
let startOffset = 0;      // position in buffer when play started
let startTime = 0;        // audioCtx.currentTime when play started
let inPoint = 0;
let inExplicit = false;      // true once user has touched IN (Set/drag/input/keyboard)
let outPoint = null;
let duration = 0;
let zoom = 1;
let scrollOffset = 0;    // seconds from start shown at left edge
let bpm = 120;
let beatsPerBar = 4;
let barOffset = 0;           // anchor time in seconds (Bar 1 position)
let anchorLocked = true;     // when locked, BPM/beats reflow grid around anchor; anchor itself is read-only
let beatLock2 = null;        // { time, beatNumber } — second lock; when set, BPM is derived
let bpmDerived = false;      // true when bpm came from beatLock2 (BPM input is read-only)
let bpmUserConfirmed = false; // true once user has typed/tapped/derived BPM (any explicit confirmation)
let snapMode = 'off';        // 'off' | 'beat' | 'bar'
let zoomDrag = null;         // { x0, x1 } during drag-to-zoom
let auditionSource = null;   // currently-playing audition BufferSource
let tapTimes = [];           // recent tap timestamps (ms)
let lockedBars = null;       // currently-active loop-length chip (1|2|4|8|16|32|64) or null
let anchorPulseUntil = 0;    // performance.now() until which anchor renders pulsed (visual feedback on move)

// ── DOM refs ──────────────────────────────────────────────────────────────
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const waveformSection = document.getElementById('waveformSection');
const controlsRow = document.getElementById('controlsRow');
const wfWrap = document.getElementById('waveformWrap');
const wfCanvas = document.getElementById('waveformCanvas');
const overlayCanvas = document.getElementById('overlayCanvas');
const rulerCanvas = document.getElementById('rulerCanvas');
const overviewWrap = document.getElementById('overviewWrap');
const overviewCanvas = document.getElementById('overviewCanvas');
const wfCtx = wfCanvas.getContext('2d');
const ovCtx = overlayCanvas.getContext('2d');
const rulerCtx = rulerCanvas.getContext('2d');
const ovwCtx = overviewCanvas.getContext('2d');
const fileNameEl = document.getElementById('fileName');
const durationBadge = document.getElementById('durationBadge');
const playheadEl = document.getElementById('playheadTime');
const inTimeEl = document.getElementById('inTime');
const outTimeEl = document.getElementById('outTime');
const loopDurEl = document.getElementById('loopDuration');
const zoomSlider = document.getElementById('zoomSlider');
const zoomVal = document.getElementById('zoomVal');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const bpmInput = document.getElementById('bpmInput');
const beatsPerBarInput = document.getElementById('beatsPerBar');
const barOffsetInput = document.getElementById('barOffset');
const barInfo = document.getElementById('barInfo');

// ── File Load ─────────────────────────────────────────────────────────────
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault(); dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) loadFile(file);
});
fileInput.addEventListener('change', e => { if (e.target.files[0]) loadFile(e.target.files[0]); });

async function loadFile(file) {
  return loadFromArrayBuffer(await file.arrayBuffer(), file.name);
}

// Manifest cache for category lookups. Same /api/manifest the shortlist uses; only the
// auditioner server serves it, so cutter-standalone falls back to the no-category path.
let _manifestCache = null;
async function getManifest() {
  if (_manifestCache !== null) return _manifestCache || null;
  try {
    const res = await fetch('/api/manifest', { cache: 'no-store' });
    if (!res.ok) { _manifestCache = false; return null; }
    _manifestCache = await res.json();
    return _manifestCache;
  } catch { _manifestCache = false; return null; }
}
async function categoryFromUrl(url) {
  const m = await getManifest();
  if (!m || !url) return '';
  const rel = decodeURIComponent(url.replace(/^\/audio\//, ''));
  const item = (m.items || []).find(i => (i.local_path || '').endsWith(rel));
  return item ? (item.category || '') : '';
}
function setCategory(cat) {
  if (cat) waveformSection.setAttribute('data-category', cat);
  else waveformSection.removeAttribute('data-category');
}

// Library handoff: cutter accepts ?src=<server-path> (e.g. /audio/music/.../track.mp3).
// Fetches via the auditioner server's byte-range route, then runs the same decode path.
async function loadFromUrl(url, displayName, category) {
  setStatus('loading', 'Fetching ' + (displayName || url) + '…');
  const res = await fetch(url);
  if (!res.ok) { setStatus('error', 'Fetch failed: ' + res.status + ' ' + url); return; }
  const arrayBuffer = await res.arrayBuffer();
  const name = displayName || decodeURIComponent(url.split('/').pop() || 'track');
  const cat = category || await categoryFromUrl(url);
  return loadFromArrayBuffer(arrayBuffer, name, cat);
}

async function loadFromArrayBuffer(arrayBuffer, name, category) {
  stopAudio();
  setStatus('loading', 'Decoding audio…');
  fileNameEl.textContent = name;
  setCategory(category || '');
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } catch(e) {
    setStatus('error', 'Failed to decode audio: ' + e.message); return;
  }
  // C10 — tell any open auditioner tab(s) to pause their preview so we're not
  // fighting two playback sources. Channel name is shared with the auditioner.
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel('loop-cutter-sync');
      ch.postMessage({ type: 'cutter-loaded', name });
      ch.close();
    }
  } catch (e) { /* environments without BroadcastChannel: silent no-op */ }
  duration = audioBuffer.duration;
  inPoint = 0;
  outPoint = duration;
  scrollOffset = 0;
  zoom = 1;
  bpm = parseFloat(bpmInput.value || '120');
  beatsPerBar = parseInt(beatsPerBarInput.value || '4', 10);
  barOffset = parseTime(barOffsetInput.value) || 0;
  anchorLocked = true;
  beatLock2 = null;
  bpmDerived = false;
  bpmUserConfirmed = false;
  inExplicit = false;
  applyAnchorLockUI();
  applyBpmDerivedUI();
  lockedBars = null;
  document.querySelectorAll('#loopChips .chip').forEach(c => c.classList.remove('active'));
  zoomSlider.value = 1;
  zoomVal.textContent = '1×';
  durationBadge.textContent = formatTime(duration);
  dropZone.classList.add('hidden');
  waveformSection.classList.remove('hidden');
  controlsRow.classList.remove('hidden');
  resizeCanvases();
  buildWaveformData();
  drawWaveform();
  updateMarkerUI();
  applyBeatHintPill();
  applyBeatLockStaging();
  updateStepProgress();
  setStatus('ready', 'Loaded: ' + name);
}

// ── Waveform Data ─────────────────────────────────────────────────────────
let peakData = [];
const PEAK_RES = 2000; // samples for waveform peaks

function buildWaveformData() {
  const ch = audioBuffer.getChannelData(0);
  const ch2 = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : null;
  const total = ch.length;
  const step = Math.floor(total / PEAK_RES);
  peakData = [];
  for (let i = 0; i < PEAK_RES; i++) {
    let max = 0, min = 0;
    for (let j = 0; j < step; j++) {
      const idx = i * step + j;
      const s = ch2 ? (ch[idx] + ch2[idx]) / 2 : ch[idx];
      if (s > max) max = s; if (s < min) min = s;
    }
    peakData.push([min, max]);
  }
}

function resizeCanvases() {
  const w = wfWrap.clientWidth, h = wfWrap.clientHeight;
  wfCanvas.width = overlayCanvas.width = rulerCanvas.width = w;
  wfCanvas.height = overlayCanvas.height = h;
  rulerCanvas.height = document.querySelector('.ruler-wrap').clientHeight;
  overviewCanvas.width = overviewWrap.clientWidth;
  overviewCanvas.height = overviewWrap.clientHeight;
}

function drawWaveform() {
  if (!audioBuffer) return;
  const cs = getComputedStyle(root);
  const W = wfCanvas.width, H = wfCanvas.height;
  wfCtx.clearRect(0, 0, W, H);
  wfCtx.fillStyle = cs.getPropertyValue('--bg').trim();
  wfCtx.fillRect(0, 0, W, H);

  drawRuler();
  drawBeatGrid();

  // loop region
  const inX = timeToX(inPoint, W);
  const outX = timeToX(outPoint !== null ? outPoint : duration, W);
  wfCtx.fillStyle = cs.getPropertyValue('--loop-fill').trim();
  wfCtx.fillRect(inX, 0, outX - inX, H);

  // waveform bars
  const mid = H / 2;
  const visStart = scrollOffset;
  const visDur = duration / zoom;
  const visEnd = visStart + visDur;
  const startIdx = Math.floor((visStart / duration) * PEAK_RES);
  const endIdx = Math.ceil((visEnd / duration) * PEAK_RES);
  const numBars = endIdx - startIdx;
  const barW = W / numBars;

  wfCtx.fillStyle = cs.getPropertyValue('--waveform-fill').trim();
  for (let i = 0; i < numBars; i++) {
    const idx = Math.min(startIdx + i, peakData.length - 1);
    const [mn, mx] = peakData[idx];
    const y1 = mid + mn * mid * 0.9;
    const y2 = mid + mx * mid * 0.9;
    wfCtx.fillRect(i * barW, Math.min(y1, y2), Math.max(1, barW - 0.5), Math.max(1, Math.abs(y2 - y1)));
  }

  // centre line
  wfCtx.strokeStyle = cs.getPropertyValue('--line').trim();
  wfCtx.lineWidth = 0.5;
  wfCtx.beginPath(); wfCtx.moveTo(0, mid); wfCtx.lineTo(W, mid); wfCtx.stroke();

  drawOverview();
}

// Overview lane: full-track waveform downsampled to canvas width, with a
// translucent rectangle highlighting the current zoom region. Click to scroll.
function drawOverview() {
  if (!audioBuffer || !peakData.length) return;
  const cs = getComputedStyle(root);
  const W = overviewCanvas.width, H = overviewCanvas.height;
  ovwCtx.clearRect(0, 0, W, H);
  ovwCtx.fillStyle = cs.getPropertyValue('--bg').trim();
  ovwCtx.fillRect(0, 0, W, H);

  const mid = H / 2;
  const stride = peakData.length / W;
  ovwCtx.fillStyle = cs.getPropertyValue('--waveform-fill').trim();
  for (let i = 0; i < W; i++) {
    let mn = 0, mx = 0;
    const start = Math.floor(i * stride);
    const end = Math.min(peakData.length, Math.floor((i + 1) * stride) + 1);
    for (let j = start; j < end; j++) {
      const [a, b] = peakData[j];
      if (a < mn) mn = a; if (b > mx) mx = b;
    }
    const y1 = mid + mn * mid * 0.85;
    const y2 = mid + mx * mid * 0.85;
    ovwCtx.fillRect(i, Math.min(y1, y2), 1, Math.max(1, Math.abs(y2 - y1)));
  }

  if (zoom > 1.001) {
    const visStart = scrollOffset;
    const visEnd = Math.min(duration, scrollOffset + duration / zoom);
    const x0 = (visStart / duration) * W;
    const x1 = (visEnd / duration) * W;
    ovwCtx.fillStyle = cs.getPropertyValue('--copy-dim').trim();
    ovwCtx.fillRect(x0, 0, Math.max(2, x1 - x0), H);
    ovwCtx.strokeStyle = cs.getPropertyValue('--copy').trim();
    ovwCtx.lineWidth = 1;
    ovwCtx.strokeRect(x0 + 0.5, 0.5, Math.max(2, x1 - x0) - 1, H - 1);
  }
}


function drawBeatGrid() {
  const cs = getComputedStyle(root);
  const W = wfCanvas.width, H = wfCanvas.height;
  const barDur = getBarDuration();
  if (!barDur || !isFinite(barDur) || barDur <= 0) return;
  const visStart = scrollOffset;
  const visEnd = scrollOffset + duration / zoom;
  let firstBarIndex = Math.floor((visStart - barOffset) / barDur);
  while (barOffset + firstBarIndex * barDur > visStart) firstBarIndex -= 1;
  for (let i = firstBarIndex; ; i++) {
    const t = barOffset + i * barDur;
    if (t > visEnd) break;
    if (t < 0) continue;
    const x = timeToX(t, W);
    const barNum = i + 1;
    const isAnchor = barNum === 1;
    const major = barNum % 32 === 0 || barNum % 16 === 0 || barNum % 8 === 0 || barNum % 4 === 0;
    if (isAnchor) {
      wfCtx.strokeStyle = cs.getPropertyValue('--ss-gold').trim();
      wfCtx.globalAlpha = 0.85;
      wfCtx.lineWidth = 2;
    } else {
      wfCtx.strokeStyle = major ? cs.getPropertyValue('--copy').trim() : cs.getPropertyValue('--line').trim();
      wfCtx.globalAlpha = major ? 0.35 : 0.22;
      wfCtx.lineWidth = major ? 1.2 : 0.8;
    }
    wfCtx.beginPath(); wfCtx.moveTo(x, 0); wfCtx.lineTo(x, H); wfCtx.stroke();
    wfCtx.globalAlpha = 1;
  }
  // Beat lock 2: gold line on waveform
  if (beatLock2 && beatLock2.time >= visStart && beatLock2.time <= visEnd) {
    const lx = timeToX(beatLock2.time, W);
    wfCtx.strokeStyle = cs.getPropertyValue('--ss-gold').trim();
    wfCtx.globalAlpha = 0.55;
    wfCtx.lineWidth = 1.5;
    wfCtx.beginPath(); wfCtx.moveTo(lx, 0); wfCtx.lineTo(lx, H); wfCtx.stroke();
    wfCtx.globalAlpha = 1;
  }
}

function drawRuler() {
  const cs = getComputedStyle(root);
  const W = rulerCanvas.width, H = rulerCanvas.height;
  rulerCtx.clearRect(0, 0, W, H);
  rulerCtx.fillStyle = cs.getPropertyValue('--panel-2').trim();
  rulerCtx.fillRect(0, 0, W, H);
  const barDur = getBarDuration();
  if (!barDur || !isFinite(barDur) || barDur <= 0) return;
  const visStart = scrollOffset;
  const visEnd = scrollOffset + duration / zoom;
  let firstBarIndex = Math.floor((visStart - barOffset) / barDur);
  while (barOffset + firstBarIndex * barDur > visStart) firstBarIndex -= 1;
  rulerCtx.font = '10px JetBrains Mono, monospace';
  rulerCtx.textBaseline = 'top';
  for (let i = firstBarIndex; ; i++) {
    const t = barOffset + i * barDur;
    if (t > visEnd) break;
    if (t < 0) continue;
    const x = timeToX(t, W);
    const barNum = i + 1;
    const isAnchor = barNum === 1;
    const major = barNum % 32 === 0 || barNum % 16 === 0 || barNum % 8 === 0 || barNum % 4 === 0;
    if (isAnchor) {
      rulerCtx.strokeStyle = cs.getPropertyValue('--ss-gold').trim();
      rulerCtx.globalAlpha = 1;
      rulerCtx.lineWidth = 2.2;
    } else {
      rulerCtx.strokeStyle = major ? cs.getPropertyValue('--copy').trim() : cs.getPropertyValue('--line').trim();
      rulerCtx.globalAlpha = major ? 0.95 : 0.55;
      rulerCtx.lineWidth = major ? 1.2 : 0.8;
    }
    rulerCtx.beginPath(); rulerCtx.moveTo(x, H); rulerCtx.lineTo(x, (isAnchor || major) ? 2 : 10); rulerCtx.stroke();
    if (isAnchor) {
      // Gold ▼ glyph + label at anchor
      rulerCtx.fillStyle = cs.getPropertyValue('--ss-gold').trim();
      rulerCtx.fillText('▼ Bar 1', x + 4, 4);
    } else if (major) {
      rulerCtx.fillStyle = cs.getPropertyValue('--ink-muted').trim();
      rulerCtx.fillText('Bar ' + barNum, x + 4, 4);
    }
  }
  // Beat lock 2: render a gold ▼ marker at its time
  if (beatLock2 && beatLock2.time >= visStart && beatLock2.time <= visEnd) {
    const lx = timeToX(beatLock2.time, W);
    rulerCtx.strokeStyle = cs.getPropertyValue('--ss-gold').trim();
    rulerCtx.globalAlpha = 1;
    rulerCtx.lineWidth = 1.6;
    rulerCtx.beginPath(); rulerCtx.moveTo(lx, H); rulerCtx.lineTo(lx, 2); rulerCtx.stroke();
    rulerCtx.fillStyle = cs.getPropertyValue('--ss-gold').trim();
    rulerCtx.fillText('▼ b' + beatLock2.beatNumber, lx + 4, 4);
  }
  rulerCtx.globalAlpha = 1;
}

function getBarDuration() {
  return (60 / bpm) * beatsPerBar;
}

function updateBeatUI() {
  const barDur = getBarDuration();
  const state = anchorLocked ? 'Locked' : 'Adjusting';
  barInfo.textContent = state + ' · 1 bar = ' + formatTime(barDur);
}

function drawOverlay() {
  if (!audioBuffer) return;
  const cs = getComputedStyle(root);
  const W = overlayCanvas.width, H = overlayCanvas.height;
  ovCtx.clearRect(0, 0, W, H);

  // In marker
  const inX = timeToX(inPoint, W);
  ovCtx.strokeStyle = cs.getPropertyValue('--marker-in').trim();
  ovCtx.lineWidth = 2;
  ovCtx.beginPath(); ovCtx.moveTo(inX, 0); ovCtx.lineTo(inX, H); ovCtx.stroke();
  ovCtx.fillStyle = cs.getPropertyValue('--marker-in').trim();
  ovCtx.font = 'bold 10px JetBrains Mono, monospace';
  ovCtx.fillText('IN', inX + 4, 13);

  // Out marker
  if (outPoint !== null) {
    const outX = timeToX(outPoint, W);
    ovCtx.strokeStyle = cs.getPropertyValue('--marker-out').trim();
    ovCtx.lineWidth = 2;
    ovCtx.beginPath(); ovCtx.moveTo(outX, 0); ovCtx.lineTo(outX, H); ovCtx.stroke();
    ovCtx.fillStyle = cs.getPropertyValue('--marker-out').trim();
    ovCtx.font = 'bold 10px JetBrains Mono, monospace';
    ovCtx.fillText('OUT', outX + 4, 13);
  }

  // Playhead
  const ph = getCurrentTime();
  const phX = timeToX(ph, W);
  if (phX >= 0 && phX <= W) {
    ovCtx.strokeStyle = cs.getPropertyValue('--playhead').trim();
    ovCtx.lineWidth = 1.5;
    ovCtx.setLineDash([4, 2]);
    ovCtx.beginPath(); ovCtx.moveTo(phX, 0); ovCtx.lineTo(phX, H); ovCtx.stroke();
    ovCtx.setLineDash([]);
    // playhead triangle
    ovCtx.fillStyle = cs.getPropertyValue('--playhead').trim();
    ovCtx.beginPath();
    ovCtx.moveTo(phX - 5, 0); ovCtx.lineTo(phX + 5, 0); ovCtx.lineTo(phX, 8);
    ovCtx.closePath(); ovCtx.fill();
  }

  // Anchor pulse (500ms after setAnchor) — gold halo at anchor X for visual confirmation
  if (anchorPulseUntil > performance.now() && audioBuffer) {
    const aX = timeToX(barOffset, W);
    if (aX >= -10 && aX <= W + 10) {
      const remain = (anchorPulseUntil - performance.now()) / 500; // 1 → 0
      ovCtx.strokeStyle = cs.getPropertyValue('--ss-gold').trim();
      ovCtx.globalAlpha = remain * 0.9;
      ovCtx.lineWidth = 4 + remain * 6;
      ovCtx.beginPath(); ovCtx.moveTo(aX, 0); ovCtx.lineTo(aX, H); ovCtx.stroke();
      ovCtx.globalAlpha = 1;
    }
  }

  // Zoom-drag rectangle
  if (zoomDrag) {
    const xa = Math.min(zoomDrag.x0, zoomDrag.x1);
    const xb = Math.max(zoomDrag.x0, zoomDrag.x1);
    ovCtx.fillStyle = 'rgba(117,62,247,0.18)';
    ovCtx.fillRect(xa, 0, xb - xa, H);
    ovCtx.strokeStyle = cs.getPropertyValue('--copy').trim();
    ovCtx.lineWidth = 1;
    ovCtx.setLineDash([3, 3]);
    ovCtx.strokeRect(xa + 0.5, 0.5, xb - xa - 1, H - 1);
    ovCtx.setLineDash([]);
  }
}

// ── Coord helpers ─────────────────────────────────────────────────────────
function timeToX(t, W) {
  const visDur = duration / zoom;
  return ((t - scrollOffset) / visDur) * W;
}
function xToTime(x, W) {
  const visDur = duration / zoom;
  return scrollOffset + (x / W) * visDur;
}

// ── Playback ──────────────────────────────────────────────────────────────
function getCurrentTime() {
  if (!isPlaying) return startOffset;
  return audioCtx.currentTime - startTime + startOffset;
}

function playFrom(t) {
  stopAudio(false);
  if (!audioBuffer) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  source = audioCtx.createBufferSource();
  gainNode = audioCtx.createGain();
  gainNode.gain.value = parseFloat(document.getElementById('volSlider').value);
  source.buffer = audioBuffer;
  source.connect(gainNode).connect(audioCtx.destination);
  const start = Math.max(0, t);
  const endT = outPoint !== null ? outPoint : duration;
  const playDuration = endT - start;
  if (playDuration <= 0) return;
  source.start(0, start, playDuration);
  source.onended = () => {
    if (isLooping && isPlaying) { playFrom(inPoint); }
    else { isPlaying = false; updatePlayBtn(); setStatus('ready', 'Stopped'); }
  };
  startOffset = start;
  startTime = audioCtx.currentTime;
  isPlaying = true;
  updatePlayBtn();
  setStatus('playing', 'Playing' + (isLooping ? ' (loop)' : ''));
}

function togglePlay() {
  if (!audioBuffer) return;
  if (isPlaying) {
    startOffset = getCurrentTime();
    stopAudio(false);
    setStatus('ready', 'Paused at ' + formatTime(startOffset));
  } else {
    let t = startOffset;
    const endT = outPoint !== null ? outPoint : duration;
    if (t >= endT) t = inPoint;
    playFrom(t);
  }
}

function stopAudio(resetPos = true) {
  if (source) { try { source.onended = null; source.stop(); } catch(e){} source = null; }
  if (typeof stopAudition === 'function') stopAudition();
  isPlaying = false;
  if (resetPos) startOffset = inPoint;
  updatePlayBtn();
}

function updatePlayBtn() {
  const btn = document.getElementById('btnPlay');
  btn.innerHTML = isPlaying
    ? '<i data-lucide="pause"></i> Pause'
    : '<i data-lucide="play"></i> Play';
  lucide.createIcons();
  statusDot.className = 'status-dot' + (isPlaying ? (isLooping ? ' looping' : ' playing') : '');
}

// ── Markers ───────────────────────────────────────────────────────────────
function setIn(t)  { inPoint  = Math.max(0, Math.min(t, outPoint !== null ? outPoint - 0.001 : duration)); inExplicit = true; clearLockedBars(); updateMarkerUI(); drawWaveform(); drawOverlay(); updateStepProgress(); }
function setOut(t) { outPoint = Math.max(inPoint + 0.001, Math.min(t, duration)); clearLockedBars(); updateMarkerUI(); drawWaveform(); drawOverlay(); }

function updateMarkerUI() {
  inTimeEl.value = formatTime(inPoint);
  outTimeEl.value = outPoint !== null ? formatTime(outPoint) : '—';
  updateBeatUI();
  if (outPoint !== null) {
    const dur = outPoint - inPoint;
    const barDur = getBarDuration();
    const barCount = (barDur > 0) ? (dur / barDur) : 0;
    const barsLabel = (barCount > 0) ? ' · ≈ ' + (Math.round(barCount * 100) / 100) + ' bars' : '';
    loopDurEl.textContent = 'Loop: ' + formatTime(dur) + (dur > 0 ? ' (' + dur.toFixed(4) + 's)' : '') + barsLabel;
  } else { loopDurEl.textContent = 'Loop: —'; }
}
function clearLockedBars() {
  if (lockedBars === null) return;
  lockedBars = null;
  document.querySelectorAll('#loopChips .chip').forEach(c => c.classList.remove('active'));
}

function parseTime(str) {
  if (!str || str === '—') return null;
  const parts = str.replace(',', '.').split(':');
  if (parts.length === 2) {
    const m = parseFloat(parts[0]);
    const s = parseFloat(parts[1]);
    return m * 60 + s;
  }
  return parseFloat(str);
}

inTimeEl.addEventListener('change', () => { const t = parseTime(inTimeEl.value); if (t !== null && !isNaN(t)) setIn(t); else updateMarkerUI(); });
outTimeEl.addEventListener('change', () => { const t = parseTime(outTimeEl.value); if (t !== null && !isNaN(t)) setOut(t); else updateMarkerUI(); });
function applyBpmFromInput() {
  const raw = parseFloat(bpmInput.value);
  if (!isFinite(raw)) return; // mid-typing or empty: keep last good bpm
  bpm = Math.max(20, Math.min(300, raw));
  bpmUserConfirmed = true; // user typed a value — counts as explicit confirmation even if 120
  updateMarkerUI(); drawWaveform(); drawOverlay();
  updateStepProgress();
}
bpmInput.addEventListener('input', applyBpmFromInput);
bpmInput.addEventListener('change', applyBpmFromInput);
// NIT — sync the displayed value to the clamped value on blur so 12000 doesn't
// stay in the box after we silently clamped to 300 internally.
bpmInput.addEventListener('blur', () => {
  const raw = parseFloat(bpmInput.value);
  if (!isFinite(raw)) return;
  if (raw !== bpm) bpmInput.value = (Math.round(bpm * 100) / 100).toString();
});
function applyBeatsFromInput() {
  const raw = parseInt(beatsPerBarInput.value, 10);
  if (!isFinite(raw)) return;
  beatsPerBar = Math.max(1, Math.min(12, raw));
  updateMarkerUI(); drawWaveform(); drawOverlay();
}
beatsPerBarInput.addEventListener('input', applyBeatsFromInput);
beatsPerBarInput.addEventListener('change', applyBeatsFromInput);
barOffsetInput.addEventListener('change', () => {
  if (anchorLocked) { barOffsetInput.value = formatTime(barOffset); return; }
  const t = parseTime(barOffsetInput.value);
  setAnchor(t !== null && !isNaN(t) ? t : 0);
});

// ── Anchor (Lock first beat) ──────────────────────────────────────────────
function setAnchor(t) {
  barOffset = Math.max(0, Math.min(duration || t || 0, t || 0));
  barOffsetInput.value = formatTime(barOffset);
  anchorPulseUntil = performance.now() + 500;
  clearLockedBars();
  // C6 — single-action: when IN hasn't been explicitly set, ruler-click also moves IN to anchor.
  // Lets a first-time user click once on the first beat and have IN land where they expect.
  if (!inExplicit) {
    inPoint = barOffset;
  }
  updateMarkerUI();
  drawWaveform();
  drawOverlay();
  applyBeatHintPill();
  applyBeatLockStaging();
  updateStepProgress();
  setStatus('ready', 'Anchor → ' + formatTime(barOffset) + (inExplicit ? '' : ' (IN follows)'));
}
function nudgeAnchor(ms) { setAnchor(barOffset + (ms / 1000)); }
function applyAnchorLockUI() {
  const group = document.getElementById('anchorGroup');
  const lockBtn = document.getElementById('btnAnchorLock');
  const setBtn = document.getElementById('btnAnchorSet');
  const nudgeBtns = document.querySelectorAll('.anchor-nudge button');
  const rulerWrap = document.querySelector('.ruler-wrap');
  group.classList.toggle('locked', anchorLocked);
  lockBtn.classList.toggle('locked', anchorLocked);
  lockBtn.innerHTML = anchorLocked ? '<i data-lucide="lock"></i>' : '<i data-lucide="lock-open"></i>';
  lockBtn.setAttribute('aria-label', anchorLocked ? 'Unlock anchor' : 'Lock anchor');
  barOffsetInput.disabled = anchorLocked;
  setBtn.disabled = anchorLocked;
  nudgeBtns.forEach(b => b.disabled = anchorLocked);
  barInfo.classList.toggle('locked', anchorLocked);
  if (rulerWrap) rulerWrap.classList.toggle('unlocked', !anchorLocked);
  if (window.lucide) lucide.createIcons();
  updateBeatUI();
}
document.getElementById('btnAnchorLock').addEventListener('click', () => {
  anchorLocked = !anchorLocked;
  applyAnchorLockUI();
  applyBeatHintPill();
});
document.getElementById('btnAnchorSet').addEventListener('click', () => {
  if (!anchorLocked) setAnchor(getCurrentTime());
});
document.querySelectorAll('.anchor-nudge button').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!anchorLocked) nudgeAnchor(parseInt(btn.dataset.nudge, 10));
  });
});

// B1/N4 — Click in the ruler strip = set anchor (DAW convention: timeline-strip clicks place markers).
// Waveform body stays for scrubbing only. Click works whether anchor is locked or not — the lock
// guards against accidental edits via input/nudge, but a deliberate timeline click is "move it here".
document.querySelector('.ruler-wrap').addEventListener('click', e => {
  if (!audioBuffer) return;
  const rect = rulerCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const W = rect.width;
  const t = xToTime(x, W);
  setAnchor(t);
});

// ── Beat lock 2 (derive BPM from two locks) ───────────────────────────────
function setBeatLock2(time, beatNumber) {
  if (time <= barOffset) { setStatus('error', 'Lock must be after the anchor'); return; }
  if (!beatNumber || beatNumber < 2) { setStatus('error', 'Beat number must be 2 or higher'); return; }
  beatLock2 = { time, beatNumber };
  const beatDur = (time - barOffset) / (beatNumber - 1);
  bpm = 60 / beatDur;
  bpmInput.value = bpm.toFixed(2);
  bpmDerived = true;
  bpmUserConfirmed = true;
  applyBpmDerivedUI();
  clearLockedBars();
  // C7 — once we have two reference beats, BAR snap is the most-likely-correct default.
  // Auto-set snapMode=bar so the loop-length chips drop on bar grid lines without the user
  // having to find the segmented control top-right.
  if (snapMode === 'off') {
    snapMode = 'bar';
    document.querySelectorAll('#snapSeg button').forEach(b => b.classList.toggle('active', b.dataset.snap === 'bar'));
  }
  updateMarkerUI();
  drawWaveform();
  drawOverlay();
  updateStepProgress();
  setStatus('ready', 'BPM committed: ' + bpm.toFixed(2) + ' · Snap → BAR');
}
function clearBeatLock2() {
  beatLock2 = null;
  bpmDerived = false;
  applyBpmDerivedUI();
  drawWaveform();
  drawOverlay();
}
function applyBpmDerivedUI() {
  bpmInput.readOnly = bpmDerived;
  bpmInput.classList.toggle('derived', bpmDerived);
  const chip = document.getElementById('beatLockChip');
  const text = document.getElementById('beatLockText');
  if (beatLock2) {
    chip.classList.remove('hidden');
    text.textContent = 'b' + beatLock2.beatNumber + ' @ ' + formatTime(beatLock2.time);
  } else {
    chip.classList.add('hidden');
  }
  applyBeatHintPill();
  applyBeatLockStaging();
}
// C8 — staged states for + Beat lock button: disabled until anchor + audio + scrubbed past anchor
function applyBeatLockStaging() {
  const btn = document.getElementById('btnAddBeatLock');
  if (!btn) return;
  const ph = audioBuffer ? getCurrentTime() : 0;
  const ready = !!audioBuffer && anchorLocked && barOffset > 0.001 && ph > barOffset + 0.001;
  btn.disabled = !ready && !beatLock2;
  btn.classList.toggle('staged-ready', ready && !beatLock2);
  btn.classList.toggle('staged-locked', !!beatLock2);
  btn.setAttribute('data-tip',
    beatLock2 ? 'BPM derived. Click + to lock another beat or × on the chip to clear.'
    : ready ? 'Click to lock the second reference beat (BPM is computed from the gap).'
    : !audioBuffer ? 'Load a track first.'
    : barOffset <= 0.001 ? 'Click the ruler at Bar 1 to set the anchor first.'
    : 'Scrub past Bar 1 before adding a beat lock.'
  );
}

// C9 — 3-step progress indicator. Replaces static "Tip:" with a workflow that lights up.
//   ① Anchor   (complete when barOffset > 0)
//   ② BPM      (complete when bpm derived OR taps committed >= 4)
//   ③ Loop     (complete when lockedBars !== null)
function updateStepProgress() {
  const wrap = document.getElementById('stepProgress');
  if (!wrap) return;
  const has = !!audioBuffer;
  const s1 = has && barOffset > 0.001;
  const s2 = has && (bpmUserConfirmed || bpmDerived || tapTimes.length >= 4);
  const s3 = has && lockedBars !== null;
  const cur = !has ? 0 : !s1 ? 1 : !s2 ? 2 : !s3 ? 3 : 0;
  [['1', s1], ['2', s2], ['3', s3]].forEach(([id, done]) => {
    const el = document.getElementById('step' + id);
    if (!el) return;
    el.classList.toggle('done', done);
    el.classList.toggle('current', cur === parseInt(id, 10));
  });
}

function applyBeatHintPill() {
  const pill = document.getElementById('beatHintPill');
  if (!pill) return;
  const dismissed = localStorage.getItem('loopCutter:beatHintDismissed') === '1';
  // Show only when: file loaded, anchor locked AND set past 0, no beat-2 yet, not dismissed
  const show = !!audioBuffer && anchorLocked && barOffset > 0.001 && !beatLock2 && !dismissed;
  pill.classList.toggle('hidden', !show);
}
const dismissBtn = document.getElementById('btnDismissBeatHint');
if (dismissBtn) {
  dismissBtn.addEventListener('click', () => {
    localStorage.setItem('loopCutter:beatHintDismissed', '1');
    applyBeatHintPill();
  });
}
document.getElementById('btnAddBeatLock').addEventListener('click', () => {
  if (!audioBuffer) { setStatus('error', 'Load a track first'); return; }
  const t = getCurrentTime();
  if (t <= barOffset + 0.001) { setStatus('error', 'Scrub past Bar 1 before adding a beat lock'); return; }
  const defaultBeat = beatLock2 ? beatLock2.beatNumber : 2;
  const input = window.prompt(
    'Beat number at playhead (' + formatTime(t) + ')?\n\n' +
    '• 2 = the 2nd beat (just after Bar 1)\n' +
    '• 5 = first beat of Bar 2\n' +
    '• 17 = first beat of Bar 5\n' +
    '• Any beat where you can clearly hear the transient',
    String(defaultBeat)
  );
  if (input === null) return;
  const n = parseInt(input, 10);
  if (isNaN(n) || n < 2) { setStatus('error', 'Invalid beat number'); return; }
  setBeatLock2(t, n);
});
document.getElementById('btnClearBeatLock').addEventListener('click', clearBeatLock2);

document.getElementById('btnSetIn').addEventListener('click', () => setIn(getCurrentTime()));
document.getElementById('btnSetOut').addEventListener('click', () => setOut(getCurrentTime()));
document.getElementById('btnGotoIn').addEventListener('click', () => { startOffset = inPoint; drawOverlay(); });
document.getElementById('btnGotoOut').addEventListener('click', () => { if (outPoint) { startOffset = outPoint; drawOverlay(); } });
document.getElementById('btnClearIn').addEventListener('click', () => { inPoint = 0; inExplicit = false; clearLockedBars(); updateMarkerUI(); drawWaveform(); drawOverlay(); updateStepProgress(); });
document.getElementById('btnClearOut').addEventListener('click', () => { outPoint = duration; clearLockedBars(); updateMarkerUI(); drawWaveform(); drawOverlay(); });

// ── Transport buttons ─────────────────────────────────────────────────────
document.getElementById('btnPlay').addEventListener('click', togglePlay);
document.getElementById('btnStop').addEventListener('click', () => { stopAudio(true); drawOverlay(); });
document.getElementById('btnLoop').addEventListener('click', () => {
  isLooping = !isLooping;
  document.getElementById('btnLoop').classList.toggle('active', isLooping);
  setStatus(isLooping ? 'looping' : 'ready', isLooping ? 'Loop enabled' : 'Loop disabled');
});

// ── Volume ────────────────────────────────────────────────────────────────
document.getElementById('volSlider').addEventListener('input', e => {
  const v = parseFloat(e.target.value);
  document.getElementById('volVal').textContent = Math.round(v * 100) + '%';
  if (gainNode) gainNode.gain.value = v;
});

// ── Zoom & Scroll ─────────────────────────────────────────────────────────
// Anchor zoom on a stable focal point so IN/OUT/Bar 1 don't visually drift.
function pickZoomFocus() {
  const visStart = scrollOffset;
  const visEnd = scrollOffset + duration / zoom;
  // Priority: anchor (Bar 1) if visible → playhead if visible → IN if visible → centre
  if (audioBuffer && barOffset >= visStart && barOffset <= visEnd) return barOffset;
  const ph = getCurrentTime();
  if (audioBuffer && ph >= visStart && ph <= visEnd) return ph;
  if (audioBuffer && inPoint >= visStart && inPoint <= visEnd) return inPoint;
  return (visStart + visEnd) / 2;
}
zoomSlider.addEventListener('input', e => {
  if (!audioBuffer) { zoom = parseFloat(e.target.value); zoomVal.textContent = zoom.toFixed(1) + '×'; return; }
  const focus = pickZoomFocus();
  const W = wfWrap.clientWidth;
  const fx = ((focus - scrollOffset) / (duration / zoom)) * W; // px of focus before zoom change
  zoom = parseFloat(e.target.value);
  zoomVal.textContent = zoom.toFixed(1) + '×';
  // Hold focus fixed at fx
  scrollOffset = focus - (fx / W) * (duration / zoom);
  clampScroll();
  drawWaveform(); drawOverlay();
});
document.getElementById('zoomFit').addEventListener('click', () => {
  zoom = 1; scrollOffset = 0; zoomSlider.value = 1; zoomVal.textContent = '1×';
  drawWaveform(); drawOverlay();
});

wfWrap.addEventListener('wheel', e => {
  // Plain scroll passes through to the page. Shift+scroll zooms (cursor-anchored). Cmd/Ctrl+Shift = precise zoom.
  if (!e.shiftKey) return;
  e.preventDefault();
  if (!audioBuffer) return;
  const rect = wfWrap.getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const W = rect.width;
  const factor = (e.ctrlKey || e.metaKey) ? 0.003 : 0.01;
  const newZoom = Math.max(1, Math.min(80, zoom * (1 - e.deltaY * factor)));
  // N1: cursor in left 20% → lock front (scrollOffset=0). Else cursor-anchor.
  if (cx / W < 0.20) {
    zoom = newZoom;
    scrollOffset = 0;
  } else {
    const tAtCursor = scrollOffset + (cx / W) * (duration / zoom);
    zoom = newZoom;
    scrollOffset = tAtCursor - (cx / W) * (duration / zoom);
  }
  zoomSlider.value = Math.min(parseFloat(zoomSlider.max), zoom);
  zoomVal.textContent = zoom.toFixed(1) + '×';
  clampScroll(); drawWaveform(); drawOverlay();
}, { passive: false });

function clampScroll() {
  const visDur = duration / zoom;
  scrollOffset = Math.max(0, Math.min(scrollOffset, duration - visDur));
}

// Overview click: re-centre the zoomed view on the clicked position.
overviewWrap.addEventListener('click', e => {
  if (!audioBuffer) return;
  const rect = overviewWrap.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const visDur = duration / zoom;
  scrollOffset = (x / rect.width) * duration - visDur / 2;
  clampScroll();
  drawWaveform();
  drawOverlay();
});

// ── Waveform Click / Drag ─────────────────────────────────────────────────
let draggingMarker = null; // 'in' | 'out' | null

overlayCanvas.addEventListener('mousedown', e => {
  if (!audioBuffer) return;
  const rect = overlayCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const W = overlayCanvas.width;
  const inX = timeToX(inPoint, W);
  const outX = outPoint !== null ? timeToX(outPoint, W) : -99;
  const phX = timeToX(getCurrentTime(), W);
  if (Math.abs(x - inX) < 10) { draggingMarker = 'in'; return; }
  if (Math.abs(x - outX) < 10) { draggingMarker = 'out'; return; }
  // Shift-drag = zoom-to-region. Plain click = seek.
  if (e.shiftKey || e.altKey) {
    zoomDrag = { x0: x, x1: x };
    drawOverlay();
    return;
  }
  // B3: drag the playhead — within 10px of phX starts a play-drag (scrub).
  if (Math.abs(x - phX) < 10) { draggingMarker = 'play'; }
  const t = xToTime(x, W);
  startOffset = Math.max(0, Math.min(t, duration));
  if (isPlaying) { playFrom(startOffset); } else { drawOverlay(); }
});

window.addEventListener('mousemove', e => {
  if (!audioBuffer) return;
  const rect = overlayCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const W = overlayCanvas.width;
  // Cursor feedback over IN/OUT/playhead grab zones (only when over the canvas, not dragging)
  if (!draggingMarker && !zoomDrag && x >= 0 && x <= W && (e.clientY - rect.top) >= 0 && (e.clientY - rect.top) <= rect.height) {
    const inX = timeToX(inPoint, W);
    const outX = outPoint !== null ? timeToX(outPoint, W) : -99;
    const phX = timeToX(getCurrentTime(), W);
    const near = Math.abs(x - phX) < 10 || Math.abs(x - inX) < 10 || Math.abs(x - outX) < 10;
    wfWrap.style.cursor = near ? 'ew-resize' : 'crosshair';
  }
  if (zoomDrag) {
    zoomDrag.x1 = Math.max(0, Math.min(W, x));
    drawOverlay();
    return;
  }
  if (!draggingMarker) return;
  const t = xToTime(x, W);
  if (draggingMarker === 'in') setIn(t);
  else if (draggingMarker === 'out') setOut(t);
  else if (draggingMarker === 'play') {
    // Live scrub: move playhead, kill any audio so we don't blast through during drag
    if (isPlaying) stopAudio(false);
    startOffset = Math.max(0, Math.min(t, duration));
    drawOverlay();
  }
});

window.addEventListener('mouseup', () => {
  if (zoomDrag) {
    const W = overlayCanvas.width;
    const xa = Math.min(zoomDrag.x0, zoomDrag.x1);
    const xb = Math.max(zoomDrag.x0, zoomDrag.x1);
    if (xb - xa > 6) {
      const ta = xToTime(xa, W);
      const tb = xToTime(xb, W);
      const span = Math.max(0.01, tb - ta);
      zoom = Math.max(1, Math.min(80, duration / span));
      scrollOffset = ta;
      zoomSlider.value = Math.min(parseFloat(zoomSlider.max), zoom);
      zoomVal.textContent = zoom.toFixed(1) + '×';
      clampScroll();
      drawWaveform();
    }
    zoomDrag = null;
    drawOverlay();
  }
  // Snap on commit (magnetic drop)
  if (draggingMarker === 'in')  setIn(snapTime(inPoint));
  if (draggingMarker === 'out') setOut(snapTime(outPoint));
  draggingMarker = null;
});

// ── Keyboard Shortcuts ────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (!audioBuffer) return;
  if (e.target.tagName === 'INPUT') return;
  switch(e.key) {
    case ' ':
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Space = stop, jump playhead to anchor, play from anchor (Logic-style restart)
        stopAudio(false);
        startOffset = barOffset;
        playFrom(barOffset);
      } else {
        togglePlay();
      }
      break;
    case 'Escape':
      if (zoomDrag) { zoomDrag = null; drawOverlay(); break; }
      stopAudio(true); stopAudition(); drawOverlay(); break;
    case 'i': case 'I': setIn(getCurrentTime()); break;
    case 'o': case 'O': setOut(getCurrentTime()); break;
    case 'l': case 'L':
      isLooping = !isLooping;
      document.getElementById('btnLoop').classList.toggle('active', isLooping); break;
    case '[': // nudge in point -1 frame (~1/30s)
      setIn(Math.max(0, inPoint - 1/30)); break;
    case ']': // nudge in point +1 frame
      setIn(Math.min(outPoint !== null ? outPoint - 0.001 : duration, inPoint + 1/30)); break;
    case '{': setOut(Math.max(inPoint + 0.001, (outPoint || duration) - 1/30)); break;
    case '}': setOut(Math.min(duration, (outPoint || duration) + 1/30)); break;
  }
});

// ── RAF Playhead Update ───────────────────────────────────────────────────
function rafLoop() {
  if (audioBuffer) {
    const t = getCurrentTime();
    playheadEl.textContent = formatTime(Math.min(t, duration));
    drawOverlay();
  }
  requestAnimationFrame(rafLoop);
}
rafLoop();

// ── Export ────────────────────────────────────────────────────────────────
document.getElementById('btnExportLoop').addEventListener('click', () => exportRegion(inPoint, outPoint !== null ? outPoint : duration, 'loop'));

// Step 6 save-back: render IN→OUT to WAV, base64-encode, POST to /api/save-clip.
// Server writes file under public/assets/music/cuts/, appends manifest entry,
// regenerates LIBRARY.md, returns the new item. Auto-shortlisted so the new
// clip appears in the dock immediately.
document.getElementById('btnSaveToLibrary').addEventListener('click', async () => {
  if (!audioBuffer) { setStatus('error', 'Load a file first'); return; }
  const start = inPoint;
  const end = outPoint !== null ? outPoint : duration;
  if (end <= start) { setStatus('error', 'Set IN/OUT before saving'); return; }
  setStatus('loading', 'Rendering region…');
  try {
    const sampleRate = audioBuffer.sampleRate;
    const numChannels = audioBuffer.numberOfChannels;
    const numSamples = Math.floor((end - start) * sampleRate);
    const offlineCtx = new OfflineAudioContext(numChannels, numSamples, sampleRate);
    const src = offlineCtx.createBufferSource();
    src.buffer = audioBuffer;
    src.connect(offlineCtx.destination);
    src.start(0, start, end - start);
    const rendered = await offlineCtx.startRendering();
    const wavBuf = audioBufferToWav(rendered);

    // Base64 in chunks to avoid call-stack blow-up on large clips.
    const bytes = new Uint8Array(wavBuf);
    let bin = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    const wav_base64 = btoa(bin);

    setStatus('loading', 'Saving to library…');
    const sourceId = (typeof window.getActiveSourceId === 'function') ? window.getActiveSourceId() : null;
    const baseName = (fileNameEl.textContent || '').replace(/\.[^/.]+$/, '');
    const bpmVal = bpmInput && bpmInput.value ? parseFloat(bpmInput.value) : null;
    const title = baseName ? `${baseName} · ${(end - start).toFixed(2)}s loop` : null;
    const res = await fetch('/api/save-clip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wav_base64,
        source_id: sourceId,
        title,
        in_s: start,
        out_s: end,
        bpm: bpmVal,
      }),
    });
    const result = await res.json();
    if (!result.ok) throw new Error(result.reason || 'save failed');
    setStatus('ready', `Saved to library: ${result.item.title}`);
    if (typeof window.shortlistRefresh === 'function') window.shortlistRefresh();
  } catch (e) {
    setStatus('error', 'Save failed: ' + (e.message || e));
  }
});

document.getElementById('btnCopyClaudeCmd').addEventListener('click', () => {
  if (!audioBuffer) { setStatus('error', 'Load a file first'); return; }
  const inS = inPoint.toFixed(4);
  const outS = (outPoint !== null ? outPoint : duration).toFixed(4);
  const repeat = Math.max(1, Math.min(128, parseInt(document.getElementById('repeatCount').value || '4', 10)));
  const xfMs = Math.max(0, Math.min(500, parseFloat(document.getElementById('crossfadeMs').value || '50')));
  const fname = fileNameEl.textContent || 'INPUT.mp3';
  const baseName = fname.replace(/\.[^/.]+$/, '');
  const cmd = [
    '/Users/dannymcmillan/Claude-Code-Projects-Restored/video-use/.venv/bin/python \\',
    '  /Users/dannymcmillan/Claude-Code-Projects-Restored/Claude-Video-Editing-Flow/scripts/loop_bed.py \\',
    '  --src "<PATH_TO_SOURCE_DIR>/' + fname + '" \\',
    '  --out "<PATH_TO_OUT_DIR>/' + baseName + '_loop.wav" \\',
    '  --start-time-s ' + inS + ' \\',
    '  --end-time-s ' + outS + ' \\',
    '  --repeat ' + repeat + ' \\',
    '  --crossfade-ms ' + xfMs + ' \\',
    '  --snap-zero-crossing \\',
    '  --tail-fade-ms 1500'
  ].join('\n');
  navigator.clipboard.writeText(cmd).then(() => {
    setStatus('ready', 'Copied loop_bed.py command to clipboard (replace <PATH_TO_*> placeholders)');
  }).catch(err => {
    setStatus('error', 'Clipboard write failed: ' + err.message);
  });
});

function exportRegion(start, end, label) {
  if (!audioBuffer) return;
  setStatus('loading', 'Rendering…');
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;
  const startSample = Math.floor(start * sampleRate);
  const endSample = Math.floor(end * sampleRate);
  const numSamples = endSample - startSample;
  const offlineCtx = new OfflineAudioContext(numChannels, numSamples, sampleRate);
  const src = offlineCtx.createBufferSource();
  src.buffer = audioBuffer;
  src.connect(offlineCtx.destination);
  src.start(0, start, end - start);
  offlineCtx.startRendering().then(rendered => {
    downloadRenderedBuffer(rendered, label);
  });
}

function downloadRenderedBuffer(rendered, label) {
  const wav = audioBufferToWav(rendered);
  const blob = new Blob([wav], { type: 'audio/wav' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const baseName = fileNameEl.textContent.replace(/\.[^/.]+$/, '') || 'audio';
  a.download = baseName + '_' + label + '.wav';
  a.click();
  setStatus('ready', 'Exported: ' + a.download);
}

function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numSamples = buffer.length;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = numSamples * blockAlign;
  const wavBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(wavBuffer);
  function writeStr(off, str) { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); }
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      const s = Math.max(-1, Math.min(1, buffer.getChannelData(c)[i]));
      view.setInt16(offset, s < 0 ? s * 32768 : s * 32767, true);
      offset += 2;
    }
  }
  return wavBuffer;
}

// ── Load New File Button ──────────────────────────────────────────────────
function resetToDropZone() {
  stopAudio(true);
  waveformSection.classList.add('hidden');
  controlsRow.classList.add('hidden');
  dropZone.classList.remove('hidden');
  audioBuffer = null; peakData = [];
  // Reset Phase 1/2 state so a cancelled file pick doesn't strand the UI
  barOffset = 0;
  barOffsetInput.value = '0:00.000';
  anchorLocked = true;
  beatLock2 = null;
  bpmDerived = false;
  bpm = 120;
  bpmInput.value = '120';
  beatsPerBar = 4;
  beatsPerBarInput.value = '4';
  lockedBars = null;
  document.querySelectorAll('#loopChips .chip').forEach(c => c.classList.remove('active'));
  applyAnchorLockUI();
  applyBpmDerivedUI();
  fileInput.value = ''; // ensure 'change' fires even if same file picked
  setStatus('ready', 'Ready — load an audio file to start');
}
document.getElementById('btnLoadNew').addEventListener('click', resetToDropZone);

// ── Snap modes ────────────────────────────────────────────────────────────
function snapTime(t) {
  if (snapMode === 'off' || t === null || t === undefined) return t;
  const barDur = getBarDuration();
  if (!barDur || !isFinite(barDur) || barDur <= 0) return t;
  const unit = snapMode === 'bar' ? barDur : (barDur / Math.max(1, beatsPerBar));
  const rel = t - barOffset;
  const snapped = barOffset + Math.round(rel / unit) * unit;
  return Math.max(0, Math.min(duration, snapped));
}
document.querySelectorAll('#snapSeg button').forEach(btn => {
  btn.addEventListener('click', () => {
    snapMode = btn.dataset.snap;
    document.querySelectorAll('#snapSeg button').forEach(b => b.classList.toggle('active', b === btn));
  });
});

// ── Audition (pre-roll on IN) ─────────────────────────────────────────────
function stopAudition() {
  if (auditionSource) {
    try { auditionSource.onended = null; auditionSource.stop(); } catch(e){}
    auditionSource = null;
  }
}
function auditionRange(start, end) {
  if (!audioBuffer || end <= start) return;
  stopAudio(false);
  stopAudition();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const src = audioCtx.createBufferSource();
  src.buffer = audioBuffer;
  const g = audioCtx.createGain();
  const vol = parseFloat(document.getElementById('volSlider').value);
  src.connect(g).connect(audioCtx.destination);
  const s = Math.max(0, start);
  const dur = Math.min(duration - s, end - start);
  // N3: 10 ms fade in/out so audition doesn't click on entry/exit.
  const FADE = 0.010;
  const t0 = audioCtx.currentTime;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + Math.min(FADE, dur / 2));
  g.gain.setValueAtTime(vol, t0 + Math.max(0, dur - FADE));
  g.gain.linearRampToValueAtTime(0, t0 + dur);
  src.start(0, s, dur);
  auditionSource = src;
  src.onended = () => { if (auditionSource === src) auditionSource = null; };
}
function auditionAround(t) {
  const before = 0.250, after = 0.500;
  auditionRange(Math.max(0, t - before), Math.min(duration, t + after));
}
document.getElementById('btnAuditionIn').addEventListener('click', () => auditionAround(inPoint));

// ── Loop-length chips (the killer move: click → snap IN → set OUT → loop) ─
function snapToNearestBar(t) {
  const barDur = getBarDuration();
  if (!barDur || !isFinite(barDur) || barDur <= 0) return t;
  const rel = t - barOffset;
  return Math.max(0, Math.min(duration, barOffset + Math.round(rel / barDur) * barDur));
}
function applyLoopLength(bars) {
  if (!audioBuffer) return;
  const barDur = getBarDuration();
  if (!barDur || !isFinite(barDur) || barDur <= 0) { setStatus('error', 'BPM / beats per bar invalid'); return; }
  // 1. Place IN. If user hasn't explicitly set IN, snap to anchor (most-likely-correct default).
  //    If user HAS set IN, respect it — only auto-snap to anchor when very close (<50ms).
  //    Otherwise the active Snap mode controls placement granularity.
  const ph = getCurrentTime();
  const candidate = (ph > 0 && Math.abs(ph - inPoint) < 0.001) ? ph : inPoint;
  if (anchorLocked && (!inExplicit || Math.abs(candidate - barOffset) < 0.05)) {
    inPoint = barOffset;
    // Don't flip inExplicit here — chip click + auto-snap to anchor is not user-explicit IN.
    // Subsequent chip clicks should keep re-anchoring IN until user explicitly places it.
  } else if (snapMode === 'beat') {
    inPoint = snapTime(candidate);
  } else if (snapMode === 'off') {
    inPoint = candidate;
  } else {
    inPoint = snapToNearestBar(candidate);
  }
  // 2. Set OUT = IN + N×bar (clamp to file end)
  const targetOut = inPoint + bars * barDur;
  if (targetOut > duration) {
    setStatus('error', 'Not enough room — file is only ' + formatTime(duration - inPoint) + ' after IN');
    return;
  }
  outPoint = targetOut;
  // 3. Mark active chip
  lockedBars = bars;
  document.querySelectorAll('#loopChips .chip').forEach(c => c.classList.toggle('active', parseInt(c.dataset.bars, 10) === bars));
  // 4. Engage loop + start playback at IN
  isLooping = true;
  document.getElementById('btnLoop').classList.add('active');
  updateMarkerUI(); drawWaveform(); drawOverlay();
  playFrom(inPoint);
  setStatus('looping', 'Looping ' + bars + ' bar' + (bars === 1 ? '' : 's') + ' · ' + formatTime(bars * barDur) + ' · ×∞');
  updateStepProgress();
}
document.querySelectorAll('#loopChips .chip').forEach(chip => {
  chip.addEventListener('click', () => applyLoopLength(parseInt(chip.dataset.bars, 10)));
});

// ── Snap IN to nearest bar (manual) ───────────────────────────────────────
document.getElementById('btnSnapInToBar').addEventListener('click', () => {
  if (!audioBuffer) return;
  setIn(snapToNearestBar(inPoint));
  setStatus('ready', 'IN snapped to bar — at ' + formatTime(inPoint));
});

// ── Tap tempo ─────────────────────────────────────────────────────────────
const tapBtn = document.getElementById('btnTapTempo');
tapBtn.addEventListener('click', () => {
  const now = performance.now();
  // Reset if last tap was >2s ago
  if (tapTimes.length && now - tapTimes[tapTimes.length - 1] > 2000) tapTimes = [];
  tapTimes.push(now);
  if (tapTimes.length > 4) tapTimes.shift();
  tapBtn.classList.remove('tap-flash'); void tapBtn.offsetWidth; tapBtn.classList.add('tap-flash');
  if (tapTimes.length >= 2) {
    const intervals = [];
    for (let i = 1; i < tapTimes.length; i++) intervals.push(tapTimes[i] - tapTimes[i - 1]);
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const newBpm = Math.max(20, Math.min(300, 60000 / avg));
    bpm = Math.round(newBpm * 10) / 10;
    bpmInput.value = bpm.toFixed(1);
    if (tapTimes.length >= 4) bpmUserConfirmed = true;
    // C5 — visible commit: flash the BPM input + status reads "BPM committed"
    bpmInput.classList.remove('tap-flash'); void bpmInput.offsetWidth; bpmInput.classList.add('tap-flash');
    updateMarkerUI(); drawWaveform(); drawOverlay();
    updateStepProgress();
    const verb = tapTimes.length >= 4 ? 'BPM committed' : 'BPM (preview)';
    setStatus('ready', verb + ': ' + bpm.toFixed(1) + ' · ' + tapTimes.length + '/4 taps');
  } else {
    setStatus('ready', 'Tap 3 more times to set BPM…');
  }
});

// ── Resize ────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  if (audioBuffer) { resizeCanvases(); drawWaveform(); drawOverlay(); }
});

// ── Status Helpers ────────────────────────────────────────────────────────
function setStatus(type, msg) {
  statusText.textContent = msg;
  statusDot.className = 'status-dot' + (type === 'playing' ? ' playing' : type === 'looping' ? ' looping' : '');
}

// ── Time Format ───────────────────────────────────────────────────────────
function formatTime(s) {
  if (s === null || s === undefined || isNaN(s)) return '0:00.000';
  const m = Math.floor(s / 60);
  const sec = s - m * 60;
  return m + ':' + (sec < 10 ? '0' : '') + sec.toFixed(3);
}

// ── Init icons ────────────────────────────────────────────────────────────
const repeatCountInput = document.getElementById('repeatCount');
if (repeatCountInput) repeatCountInput.addEventListener('input', updateMarkerUI);
updateBeatUI();
applyAnchorLockUI();
applyBpmDerivedUI();

lucide.createIcons();

// Library shortlist sync — fetch the auditioner manifest, render starred items
// in the dock. Click loads via the existing handoff path. Silent if no server.
(async function initShortlist() {
  const dock = document.getElementById('shortlistDock');
  const toggle = document.getElementById('shortlistToggle');
  const panel = document.getElementById('shortlistPanel');
  const list = document.getElementById('shortlistList');
  const countEl = document.getElementById('shortlistCount');
  const metaEl = document.getElementById('shortlistMeta');
  if (!dock || !toggle || !list) return;

  let manifest = null;
  let activeId = null;

  async function refresh() {
    try {
      const res = await fetch('/api/manifest', { cache: 'no-store' });
      if (!res.ok) throw new Error('manifest ' + res.status);
      manifest = await res.json();
    } catch (e) {
      // No auditioner server (e.g. cutter served standalone) — keep dock hidden.
      dock.classList.add('hidden');
      return;
    }
    dock.classList.remove('hidden');
    const items = (manifest.items || []).filter(i => i.shortlisted);
    countEl.textContent = items.length;
    metaEl.textContent = items.length ? items.length + ' starred' : 'none yet';
    list.innerHTML = '';
    items.forEach(item => {
      const li = document.createElement('li');
      li.dataset.id = item.id;
      if (item.id === activeId) li.classList.add('active');
      const title = document.createElement('div');
      title.className = 'title';
      title.textContent = item.title || item.local_path?.split('/').pop() || item.id;
      const meta = document.createElement('div');
      meta.className = 'meta';
      const cat = document.createElement('span');
      cat.className = 'cat';
      cat.textContent = (item.subcategory || item.category || '').toLowerCase();
      meta.appendChild(cat);
      if (item.duration) {
        const dur = document.createElement('span');
        dur.textContent = item.duration;
        meta.appendChild(dur);
      }
      if (item.bpm) {
        const bpm = document.createElement('span');
        bpm.textContent = item.bpm + ' BPM';
        meta.appendChild(bpm);
      }
      li.appendChild(title);
      li.appendChild(meta);
      li.addEventListener('click', () => {
        const rel = (item.local_path || '').replace(/^public\/assets\//, '');
        if (!rel) return;
        const url = '/audio/' + rel.split('/').map(encodeURIComponent).join('/');
        if (item.bpm && bpmInput) bpmInput.value = parseFloat(item.bpm).toFixed(2);
        loadFromUrl(url, item.title, item.category);
        activeId = item.id;
        list.querySelectorAll('li').forEach(el => el.classList.toggle('active', el.dataset.id === activeId));
        dock.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
      list.appendChild(li);
    });
  }

  toggle.addEventListener('click', () => {
    const open = dock.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) refresh();
  });

  // Close on outside click.
  document.addEventListener('click', e => {
    if (!dock.contains(e.target) && dock.classList.contains('open')) {
      dock.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Initial load — populates the count badge so user sees "Shortlist 3" up-front.
  refresh();

  // Keep the active id in sync if the user arrived via ?src= from a starred item.
  const params = new URLSearchParams(location.search);
  const src = params.get('src');
  if (src && manifest) {
    const rel = decodeURIComponent(src.replace(/^\/audio\//, ''));
    const item = (manifest.items || []).find(i => (i.local_path || '').endsWith(rel));
    if (item) activeId = item.id;
  }

  // Step 6 hooks: the save-back handler needs to refresh the dock and read
  // the parent track id so it can attribute the new clip.
  window.shortlistRefresh = refresh;
  window.getActiveSourceId = () => activeId;
})();

// Library handoff: if URL has ?src=<server-path>, auto-load it.
//   ?title= overrides the filename shown.
//   ?bpm=<n> pre-fills BPM (handy for SSL beds with known tempo).
(function autoloadFromQuery() {
  const params = new URLSearchParams(location.search);
  const src = params.get('src');
  if (!src) return;
  const title = params.get('title');
  const bpmParam = params.get('bpm');
  if (bpmParam && bpmInput) {
    const n = parseFloat(bpmParam);
    if (isFinite(n) && n > 0) bpmInput.value = n.toFixed(2);
  }
  loadFromUrl(src, title);
})();
