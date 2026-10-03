/* ============================================================
   PETUALANGAN CODING CILIK — APP.JS
   Interactive Learning Engine
   ============================================================ */

'use strict';

// ============================================================
// STATE
// ============================================================
const STATE = {
  childName: '',
  currentChapter: null,
  currentScene: 0,
  completedChapters: [],
  starsPerChapter: {},     // { chapterId: starCount }
  totalStars: 0,
  chosenAnimal: null,
  chosenColor: null,
  chosenJumps: 5,
  trainPassengers: [],
  chosenRobotName: 'BIMO',
  muted: false,
  finalProjectDone: false
};

// ============================================================
// AUDIO (Web Audio API — simple tones)
// ============================================================
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function playTone(freq, type = 'sine', duration = 0.15, vol = 0.2) {
  if (STATE.muted) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) { /* silent fail */ }
}

function playSuccess() {
  if (STATE.muted) return;
  [523, 659, 784, 1047].forEach((f, i) => {
    setTimeout(() => playTone(f, 'sine', 0.2, 0.25), i * 100);
  });
}

function playClick() { playTone(600, 'sine', 0.08, 0.15); }
function playError() {
  [250, 200].forEach((f, i) => setTimeout(() => playTone(f, 'sawtooth', 0.1, 0.15), i * 100));
}
function playStar() {
  [880, 1108, 1319].forEach((f, i) => setTimeout(() => playTone(f, 'sine', 0.15, 0.3), i * 80));
}
function playPop() { playTone(440, 'sine', 0.1, 0.2); }

// ============================================================
// MUTE
// ============================================================
document.getElementById('btn-mute').addEventListener('click', () => {
  STATE.muted = !STATE.muted;
  document.getElementById('btn-mute').textContent = STATE.muted ? '🔇' : '🔊';
  saveProgress();
});

// ============================================================
// SAVE / LOAD PROGRESS
// ============================================================
const SAVE_KEY = 'petualangan_coding_v1';

function saveProgress() {
  const data = {
    childName:         STATE.childName,
    completedChapters: STATE.completedChapters,
    starsPerChapter:   STATE.starsPerChapter,
    totalStars:        STATE.totalStars,
    chosenAnimal:      STATE.chosenAnimal,
    chosenColor:       STATE.chosenColor,
    chosenJumps:       STATE.chosenJumps,
    trainPassengers:   STATE.trainPassengers,
    chosenRobotName:   STATE.chosenRobotName,
    muted:             STATE.muted,
    finalProjectDone:  STATE.finalProjectDone
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch(e) {}
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    Object.assign(STATE, {
      childName:         d.childName         || '',
      completedChapters: d.completedChapters || [],
      starsPerChapter:   d.starsPerChapter   || {},
      totalStars:        d.totalStars        || 0,
      chosenAnimal:      d.chosenAnimal      || null,
      chosenColor:       d.chosenColor       || null,
      chosenJumps:       d.chosenJumps       || 5,
      trainPassengers:   d.trainPassengers   || [],
      chosenRobotName:   d.chosenRobotName   || 'BIMO',
      muted:             d.muted             || false,
      finalProjectDone:  d.finalProjectDone  || false
    });
    return !!STATE.childName;
  } catch(e) { return false; }
}

// ============================================================
// SCREEN MANAGEMENT
// ============================================================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(id);
  if (screen) screen.classList.add('active');
  if (id === 'screen-chapter') {
    document.getElementById('bimo-helper').classList.remove('hidden');
  } else {
    document.getElementById('bimo-helper').classList.add('hidden');
  }
}

// ============================================================
// WELCOME SCREEN
// ============================================================
document.getElementById('child-name-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') startAdventure();
});

STATE.appMode = 'kids'; // 'kids' or 'toddler'

function setAppMode(mode) {
  playClick();
  STATE.appMode = mode;
  document.getElementById('btn-mode-kids')?.classList.toggle('active', mode === 'kids');
  document.getElementById('btn-mode-toddler')?.classList.toggle('active', mode === 'toddler');
}

function startAdventure() {
  const input = document.getElementById('child-name-input');
  const name = (input.value || '').trim() || 'Si Kecil';
  STATE.childName = name;
  saveProgress();
  playSuccess();

  if (STATE.appMode === 'toddler') {
    showScreen('screen-toddler');
    const starEl = document.getElementById('toddler-stars');
    if (starEl) starEl.textContent = STATE.totalStars;
    loadToddlerGame('seq');
  } else {
    goToMap();
  }
}

function restartAdventure() {
  try { localStorage.removeItem(SAVE_KEY); } catch(e) {}
  Object.assign(STATE, {
    childName: '', currentChapter: null, currentScene: 0,
    completedChapters: [], starsPerChapter: {}, totalStars: 0,
    chosenAnimal: null, chosenColor: null, chosenJumps: 5,
    trainPassengers: [], chosenRobotName: 'BIMO',
    finalProjectDone: false
  });
  document.getElementById('child-name-input').value = '';
  showScreen('screen-welcome');
}

// ============================================================
// TODDLER COMPUTING CURRICULUM GAMES (2-4 Years)
// ============================================================
let toddlerState = {
  activeTab: 'seq',
  seqStep: 0,
  decompParts: [],
  patternAnswer: null,
  sortScore: 0
};

function loadToddlerGame(gameType) {
  playClick();
  toddlerState.activeTab = gameType;

  ['seq', 'decomp', 'pattern', 'sort', 'logic'].forEach(t => {
    document.getElementById(`ttab-${t}`)?.classList.toggle('active', t === gameType);
  });

  const container = document.getElementById('toddler-game-area');
  if (!container) return;

  switch (gameType) {
    case 'seq':
      renderToddlerSeqGame(container);
      break;
    case 'decomp':
      renderToddlerDecompGame(container);
      break;
    case 'pattern':
      renderToddlerPatternGame(container);
      break;
    case 'sort':
      renderToddlerSortGame(container);
      break;
    case 'logic':
      renderToddlerLogicGame(container);
      break;
  }
}

// 1. SEQUENCE GAME: Mandiin Bebek Kwek Kwek 🐥
function renderToddlerSeqGame(container) {
  toddlerState.seqStep = 0;
  container.innerHTML = `
    <div class="toddler-card">
      <div class="toddler-card-title">🚿 Mandiin Bebek Kwek Kwek</div>
      <div class="toddler-card-subtitle">Urutan Algoritma: Sabun 🧼 ➔ Bilas 💧 ➔ Handuk 🧺</div>

      <div id="toddler-duck-box" style="font-size:90px;padding:20px;border-radius:50%;background:#FFF8DC;border:4px solid #FFD85C;box-shadow:0 8px 24px rgba(255,216,92,0.3)">
        🐥
      </div>

      <div id="toddler-seq-msg" style="font-family:var(--font-display);font-size:22px;color:#5A3000;text-align:center">
        Bebeknya lagi kotor! Sentuh langkah ke-1!
      </div>

      <div class="toddler-jumbo-grid" style="grid-template-columns:repeat(3, 1fr)">
        <button class="toddler-jumbo-btn" onclick="toddlerSeqClick(1)">
          <span class="toddler-jumbo-emoji">🧼</span>
          <span class="toddler-jumbo-label">1. Sabun</span>
        </button>
        <button class="toddler-jumbo-btn" onclick="toddlerSeqClick(2)">
          <span class="toddler-jumbo-emoji">🚿</span>
          <span class="toddler-jumbo-label">2. Bilas Air</span>
        </button>
        <button class="toddler-jumbo-btn" onclick="toddlerSeqClick(3)">
          <span class="toddler-jumbo-emoji">🧺</span>
          <span class="toddler-jumbo-label">3. Handuk</span>
        </button>
      </div>
    </div>
  `;
}

function toddlerSeqClick(step) {
  const msg = document.getElementById('toddler-seq-msg');
  const duck = document.getElementById('toddler-duck-box');

  if (step === toddlerState.seqStep + 1) {
    toddlerState.seqStep++;
    playPop();

    if (toddlerState.seqStep === 1) {
      if (duck) duck.textContent = '🧼🐥';
      if (msg) msg.textContent = 'Bebek sudah disabun! Sekarang bilas air! 🚿';
    } else if (toddlerState.seqStep === 2) {
      if (duck) duck.textContent = '💧🐥💧';
      if (msg) msg.textContent = 'Bebek sudah bersih! Sekarang keringkan dengan handuk! 🧺';
    } else if (toddlerState.seqStep === 3) {
      playSuccess();
      if (duck) duck.textContent = '✨🐥✨';
      if (msg) msg.textContent = '🎉 HORE! Bebeknya wangi & bersih sekali! Urutan algoritma sempurna!';
      awardStar('toddler-seq');
    }
  } else {
    playError();
    if (msg) msg.textContent = '🤪 Ops! Ikuti urutannya: 1. Sabun 🧼 ➔ 2. Bilas 🚿 ➔ 3. Handuk 🧺!';
  }
}

// 2. DECOMPOSITION GAME: Rakit Mobil Balap 🚗
function renderToddlerDecompGame(container) {
  toddlerState.decompParts = [];
  container.innerHTML = `
    <div class="toddler-card">
      <div class="toddler-card-title">🚗 Rakit Mobil Balap</div>
      <div class="toddler-card-subtitle">Decomposisi: Gabungkan bagian roda, body, &amp; lampu!</div>

      <div id="toddler-car-box" style="font-size:80px;min-height:110px;display:flex;align-items:center;justify-content:center">
        ❓
      </div>

      <div id="toddler-decomp-msg" style="font-family:var(--font-display);font-size:22px;color:#5A3000;text-align:center">
        Sentuh semua bagian untuk merakit mobil!
      </div>

      <div class="toddler-jumbo-grid" style="grid-template-columns:repeat(3, 1fr)">
        <button class="toddler-jumbo-btn" id="dbtn-wheel" onclick="toddlerDecompClick('wheel', '🛞 Roda')">
          <span class="toddler-jumbo-emoji">🛞</span>
          <span class="toddler-jumbo-label">Roda</span>
        </button>
        <button class="toddler-jumbo-btn" id="dbtn-body" onclick="toddlerDecompClick('body', '🏎️ Body')">
          <span class="toddler-jumbo-emoji">🏎️</span>
          <span class="toddler-jumbo-label">Body</span>
        </button>
        <button class="toddler-jumbo-btn" id="dbtn-light" onclick="toddlerDecompClick('light', '💡 Lampu')">
          <span class="toddler-jumbo-emoji">💡</span>
          <span class="toddler-jumbo-label">Lampu</span>
        </button>
      </div>
    </div>
  `;
}

function toddlerDecompClick(part, label) {
  if (!toddlerState.decompParts.includes(part)) {
    toddlerState.decompParts.push(part);
    playPop();

    const carBox = document.getElementById('toddler-car-box');
    const msg = document.getElementById('toddler-decomp-msg');
    const btn = document.getElementById(`dbtn-${part}`);

    if (btn) btn.style.opacity = '0.4';

    if (toddlerState.decompParts.length === 1) {
      if (carBox) carBox.textContent = '🛞';
      if (msg) msg.textContent = `${label} terpasang! Pasang bagian lainnya!`;
    } else if (toddlerState.decompParts.length === 2) {
      if (carBox) carBox.textContent = '🏎️🛞';
      if (msg) msg.textContent = `${label} terpasang! Tinggal 1 bagian lagi!`;
    } else if (toddlerState.decompParts.length === 3) {
      playSuccess();
      if (carBox) {
        carBox.textContent = '🏎️💨 VROOOM!';
        carBox.style.animation = 'result-pop 0.5s var(--ease-bounce)';
      }
      if (msg) msg.textContent = '🎉 VROOOM! Mobil balap berhasil dirakit sempurna!';
      awardStar('toddler-decomp');
    }
  }
}

// 3. PATTERN RECOGNITION GAME: Kalung Pelangi 📿
function renderToddlerPatternGame(container) {
  container.innerHTML = `
    <div class="toddler-card">
      <div class="toddler-card-title">📿 Kalung Pelangi</div>
      <div class="toddler-card-subtitle">Pengenalan Pola: Manic warna apa selanjutnya?</div>

      <div style="font-size:44px;letter-spacing:10px;background:#FFF3E0;padding:16px 28px;border-radius:20px;border:3px solid #FF8C42">
        🔴 🔵 🔴 <span id="toddler-pattern-target" style="border:3px dashed #FF8C42;padding:0 8px;border-radius:12px">❓</span>
      </div>

      <div id="toddler-pattern-msg" style="font-family:var(--font-display);font-size:22px;color:#5A3000;text-align:center">
        Pilih warna manic berikutnya!
      </div>

      <div class="toddler-jumbo-grid" style="grid-template-columns:repeat(2, 1fr)">
        <button class="toddler-jumbo-btn" onclick="toddlerPatternClick('blue')">
          <span class="toddler-jumbo-emoji">🔵</span>
          <span class="toddler-jumbo-label">Manic Biru</span>
        </button>
        <button class="toddler-jumbo-btn" onclick="toddlerPatternClick('red')">
          <span class="toddler-jumbo-emoji">🔴</span>
          <span class="toddler-jumbo-label">Manic Merah</span>
        </button>
      </div>
    </div>
  `;
}

function toddlerPatternClick(color) {
  const target = document.getElementById('toddler-pattern-target');
  const msg = document.getElementById('toddler-pattern-msg');

  if (color === 'blue') {
    playSuccess();
    if (target) target.textContent = '🔵';
    if (msg) msg.textContent = '🎉 HEBAT! Polanya: Merah 🔴 ➔ Biru 🔵 ➔ Merah 🔴 ➔ Biru 🔵!';
    awardStar('toddler-pattern');
  } else {
    playError();
    if (msg) msg.textContent = '🤪 Ops! Perhatikan polanya: Merah, Biru, Merah... berikutnya Biru 🔵!';
  }
}

// 4. SORTING GAME: Pisahkan Buah & Sayur 🍎🥦
function renderToddlerSortGame(container) {
  container.innerHTML = `
    <div class="toddler-card">
      <div class="toddler-card-title">🍎 Pisahkan Buah &amp; Sayur</div>
      <div class="toddler-card-subtitle">Pengelompokan Data: Mana Buah dan mana Sayur?</div>

      <div style="display:flex;gap:16px;width:100%;justify-content:center">
        <div style="flex:1;background:#FFEAEA;border:3px solid #FF6B6B;border-radius:20px;padding:16px;text-align:center">
          <div style="font-size:28px">🧺🍎</div>
          <div style="font-family:var(--font-display);font-size:16px;color:#8B0000">Kotak Buah</div>
          <div id="box-fruit-items" style="font-size:32px;margin-top:8px;min-height:40px"></div>
        </div>
        <div style="flex:1;background:#E8F9EF;border:3px solid #5CC86A;border-radius:20px;padding:16px;text-align:center">
          <div style="font-size:28px">🧺🥦</div>
          <div style="font-family:var(--font-display);font-size:16px;color:#0D5020">Kotak Sayur</div>
          <div id="box-veg-items" style="font-size:32px;margin-top:8px;min-height:40px"></div>
        </div>
      </div>

      <div id="toddler-sort-msg" style="font-family:var(--font-display);font-size:20px;color:#5A3000;text-align:center">
        Masukkan Makanan ke Kotak yang Tepat!
      </div>

      <div class="toddler-jumbo-grid" style="grid-template-columns:repeat(4, 1fr)" id="toddler-sort-pool">
        <button class="toddler-jumbo-btn" onclick="toddlerSortClick('fruit', '🍎', this)">
          <span class="toddler-jumbo-emoji">🍎</span>
          <span class="toddler-jumbo-label">Apel</span>
        </button>
        <button class="toddler-jumbo-btn" onclick="toddlerSortClick('veg', '🥦', this)">
          <span class="toddler-jumbo-emoji">🥦</span>
          <span class="toddler-jumbo-label">Brokoli</span>
        </button>
        <button class="toddler-jumbo-btn" onclick="toddlerSortClick('fruit', '🍌', this)">
          <span class="toddler-jumbo-emoji">🍌</span>
          <span class="toddler-jumbo-label">Pisang</span>
        </button>
        <button class="toddler-jumbo-btn" onclick="toddlerSortClick('veg', '🥕', this)">
          <span class="toddler-jumbo-emoji">🥕</span>
          <span class="toddler-jumbo-label">Wortel</span>
        </button>
      </div>
    </div>
  `;
  toddlerState.sortScore = 0;
}

function toddlerSortClick(type, emoji, btn) {
  playPop();
  btn.style.display = 'none';
  toddlerState.sortScore++;

  if (type === 'fruit') {
    const fBox = document.getElementById('box-fruit-items');
    if (fBox) fBox.textContent += emoji + ' ';
  } else {
    const vBox = document.getElementById('box-veg-items');
    if (vBox) vBox.textContent += emoji + ' ';
  }

  const msg = document.getElementById('toddler-sort-msg');
  if (toddlerState.sortScore >= 4) {
    playSuccess();
    if (msg) msg.textContent = '🎉 PINTAR! Semua buah & sayur sudah dikelompokkan dengan benar!';
    awardStar('toddler-sort');
  } else {
    if (msg) msg.textContent = `Bagus! ${emoji} sudah dimasukkan! Lanjutkan!`;
  }
}

// 5. LOGIC GAME: Beri Makan Hewan 🐱🐰
function renderToddlerLogicGame(container) {
  container.innerHTML = `
    <div class="toddler-card">
      <div class="toddler-card-title">🐱 Beri Makan Teman Hewan</div>
      <div class="toddler-card-subtitle">Logika Suka/Tidak Suka: Kucing suka Ikan 🐟, Kelinci suka Wortel 🥕</div>

      <div style="display:flex;gap:20px;justify-content:center;align-items:center">
        <div style="text-align:center">
          <div style="font-size:70px">🐱</div>
          <div style="font-family:var(--font-display);font-size:18px">Kucing</div>
          <div id="cat-food-slot" style="font-size:36px;min-height:44px">❓</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:70px">🐰</div>
          <div style="font-family:var(--font-display);font-size:18px">Kelinci</div>
          <div id="rabbit-food-slot" style="font-size:36px;min-height:44px">❓</div>
        </div>
      </div>

      <div id="toddler-logic-msg" style="font-family:var(--font-display);font-size:20px;color:#5A3000;text-align:center">
        Sentuh makanan untuk diberikan kepada hewan yang tepat!
      </div>

      <div class="toddler-jumbo-grid" style="grid-template-columns:repeat(2, 1fr)">
        <button class="toddler-jumbo-btn" onclick="toddlerLogicClick('fish')">
          <span class="toddler-jumbo-emoji">🐟</span>
          <span class="toddler-jumbo-label">Beri Ikan</span>
        </button>
        <button class="toddler-jumbo-btn" onclick="toddlerLogicClick('carrot')">
          <span class="toddler-jumbo-emoji">🥕</span>
          <span class="toddler-jumbo-label">Beri Wortel</span>
        </button>
      </div>
    </div>
  `;
}

function toddlerLogicClick(food) {
  const catSlot = document.getElementById('cat-food-slot');
  const rabSlot = document.getElementById('rabbit-food-slot');
  const msg = document.getElementById('toddler-logic-msg');

  if (food === 'fish') {
    playSuccess();
    if (catSlot) catSlot.textContent = '🐟 NYAM!';
    if (msg) msg.textContent = '🐱 Kucing senang sekali diberi Ikan 🐟!';
  } else if (food === 'carrot') {
    playSuccess();
    if (rabSlot) rabSlot.textContent = '🥕 KRUK!';
    if (msg) msg.textContent = '🐰 Kelinci senang sekali diberi Wortel 🥕!';
  }

  if (catSlot?.textContent.includes('NYAM') && rabSlot?.textContent.includes('KRUK')) {
    playSuccess();
    if (msg) msg.textContent = '🎉 HEBAT! Semua hewan kenyang &amp; bahagia!';
    awardStar('toddler-logic');
  }
}

// ============================================================
// ADVENTURE MAP
// ============================================================
const CHAPTERS = [
  {
    id: 'ch1', icon: '🤖', label: 'Robot Koki', color: '#FF8C42',
    bg: '#FFF3E0', concept: 'Perintah & Print',
    desc: 'Bantu BIMO menyapa semua orang!'
  },
  {
    id: 'ch2', icon: '📦', label: 'Kotak Ajaib', color: '#5BB8F5',
    bg: '#E8F4FD', concept: 'Kotak Ajaib (Variable)',
    desc: 'Simpan hewan favorit di kotak ajaib!'
  },
  {
    id: 'ch3', icon: '🐯', label: 'Hutan Hewan', color: '#5CC86A',
    bg: '#E8F9EF', concept: 'Tombol Ajaib (Function)',
    desc: 'Buat tombol suara hewan yang seru!'
  },
  {
    id: 'ch4', icon: '🦘', label: 'Mesin Senam', color: '#A882F0',
    bg: '#EEF2FF', concept: 'Mesin Ulangi (Loop)',
    desc: 'Buat BIMO melompat berkali-kali!'
  },
  {
    id: 'ch5', icon: '🚂', label: 'Kereta Pelangi', color: '#FF9BAE',
    bg: '#FFF0F5', concept: 'Kereta Pelangi (List)',
    desc: 'Susun hewan-hewan naik kereta!'
  },
  {
    id: 'ch6', icon: '🏰', label: 'Kastil Bintang', color: '#FFD85C',
    bg: '#1A2C5B', concept: 'Petualangan Final!',
    desc: 'Selesaikan misi dan raih sertifikat!'
  }
];

function goToMap() {
  showScreen('screen-map');
  renderMap();
}

function renderMap() {
  const nameEl = document.getElementById('map-child-name');
  nameEl.textContent = `Halo, ${STATE.childName}! 👋`;
  document.getElementById('map-total-stars').textContent = STATE.totalStars;

  const container = document.getElementById('adventure-nodes');
  container.innerHTML = '';

  CHAPTERS.forEach((ch, idx) => {
    const isCompleted  = STATE.completedChapters.includes(ch.id);
    const isAvailable  = idx === 0 || STATE.completedChapters.includes(CHAPTERS[idx - 1].id);
    const isLocked     = !isAvailable && !isCompleted;

    const stars = STATE.starsPerChapter[ch.id] || 0;

    // Connector
    if (idx > 0) {
      const conn = document.createElement('div');
      conn.className = 'map-connector' + (STATE.completedChapters.includes(CHAPTERS[idx-1].id) ? ' done' : '');
      container.appendChild(conn);
    }

    const node = document.createElement('div');
    node.className = 'chapter-node ' +
      (isLocked ? 'node-locked' : isCompleted ? 'node-completed' : 'node-available');
    node.setAttribute('role', 'button');
    node.setAttribute('tabindex', isLocked ? '-1' : '0');
    node.setAttribute('aria-label', ch.label + (isLocked ? ' (terkunci)' : ''));

    const bubble = document.createElement('div');
    bubble.className = 'node-bubble';
    bubble.style.background = `linear-gradient(135deg, ${ch.color}33, ${ch.color}66)`;
    bubble.style.borderColor = ch.color;
    bubble.textContent = ch.icon;

    const label = document.createElement('div');
    label.className = 'node-label';
    label.textContent = ch.label;

    const starsEl = document.createElement('div');
    starsEl.className = 'node-stars';
    starsEl.textContent = stars > 0 ? '⭐'.repeat(stars) : '';

    node.appendChild(bubble);
    node.appendChild(label);
    if (stars > 0) node.appendChild(starsEl);

    if (!isLocked) {
      node.addEventListener('click', () => selectMapNode(ch, node));
      node.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          selectMapNode(ch, node);
        }
      });
    }
    container.appendChild(node);
  });
}

function selectMapNode(ch, nodeEl) {
  playClick();
  document.querySelectorAll('.chapter-node').forEach(n => n.classList.remove('node-selected'));
  nodeEl.classList.add('node-selected');

  const info = document.getElementById('map-selected-info');
  info.innerHTML = `
    <div class="map-node-cta">
      <div class="map-node-title">${ch.icon} ${ch.label}</div>
      <div class="map-node-desc">${ch.desc}</div>
      <button class="cta-primary" onclick="startChapter('${ch.id}')" style="margin-top:8px">
        ▶ Mulai Petualangan!
      </button>
    </div>`;
}

// ============================================================
// CHAPTER LAUNCHER
// ============================================================
function startChapter(chId) {
  playClick();
  STATE.currentChapter = chId;
  STATE.currentScene   = 0;
  showScreen('screen-chapter');

  const ch = CHAPTERS.find(c => c.id === chId);
  document.getElementById('chapter-content').style.background = ch ? ch.bg : '';
  document.getElementById('chapter-stars').textContent = `⭐ ${STATE.starsPerChapter[chId] || 0}`;
  setProgress(0);

  // Load chapter scenes
  const loaders = {
    ch1: loadChapter1, ch2: loadChapter2, ch3: loadChapter3,
    ch4: loadChapter4, ch5: loadChapter5, ch6: loadChapter6
  };
  const parentTips = {
    ch1: parentTipCh1, ch2: parentTipCh2, ch3: parentTipCh3,
    ch4: parentTipCh4, ch5: parentTipCh5, ch6: parentTipCh6
  };

  const content = document.getElementById('chapter-content');
  content.innerHTML = '';
  if (loaders[chId]) loaders[chId](content);
  if (parentTips[chId]) document.getElementById('parent-tip-content').innerHTML = parentTips[chId]();
}

function setProgress(pct) {
  document.getElementById('chapter-progress-fill').style.width = pct + '%';
}

function awardStar(chId) {
  const current = STATE.starsPerChapter[chId] || 0;
  if (current >= 3) return;
  STATE.starsPerChapter[chId] = current + 1;
  STATE.totalStars++;
  document.getElementById('chapter-stars').textContent = `⭐ ${STATE.starsPerChapter[chId]}`;
  document.getElementById('map-total-stars').textContent = STATE.totalStars;
  playStar();
  showStarToast();
  saveProgress();
}

function showStarToast() {
  let toast = document.getElementById('star-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'star-toast';
    toast.className = 'star-reward-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = '⭐ +1 Bintang! Hebat!';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

function completeChapter(chId) {
  if (!STATE.completedChapters.includes(chId)) {
    STATE.completedChapters.push(chId);
  }
  awardStar(chId);
  saveProgress();
  setProgress(100);
  setBimoHelper('🎉 Selesai! Kamu luar biasa! Pergi ke peta untuk petualangan berikutnya!');
}

// ============================================================
// BIMO HELPER
// ============================================================
function setBimoHelper(msg) {
  const el = document.getElementById('bimo-helper');
  document.getElementById('bimo-helper-text').textContent = msg;
  if (el) {
    el.classList.remove('hidden');
    el.style.animation = 'none';
    el.offsetWidth; // trigger reflow
    el.style.animation = 'result-pop 0.35s var(--ease-bounce)';
  }
}

// ============================================================
// PARENT TIP TOGGLE
// ============================================================
function toggleParentTip() {
  const panel = document.getElementById('parent-tip-panel');
  panel.classList.toggle('hidden');
  playClick();
}

// ============================================================
// BUG MONSTER
// ============================================================
function showBugMonster(msg) {
  document.getElementById('bug-msg').textContent = msg || 'Ada Bug Monster yang sembunyi!';
  document.getElementById('bug-monster').classList.remove('hidden');
  playError();
}

function dismissBug() {
  document.getElementById('bug-monster').classList.add('hidden');
  playClick();
}

// ============================================================
// SCENE HELPERS
// ============================================================
function makeScene(id, extraClass = '') {
  const div = document.createElement('div');
  div.id = id;
  div.className = `scene ${extraClass}`;
  return div;
}

function showScene(id, chId) {
  document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
  const scene = document.getElementById(id);
  if (scene) scene.classList.add('active');
}

function makeBimoSmall(mood = 'happy') {
  return `
    <div class="bimo-sm" aria-hidden="true">
      <div class="bimo-head-sm">
        <div class="bimo-antenna-sm"></div>
        <div class="bimo-eyes-sm">
          <div class="bimo-eye-sm"></div>
          <div class="bimo-eye-sm"></div>
        </div>
        <div class="bimo-mouth-sm"></div>
      </div>
      <div class="bimo-torso-sm"></div>
    </div>`;
}

function makeCodeBlock(lines, label = 'Python') {
  return `
    <div class="code-reveal-block">
      <div class="code-header">
        <div class="code-dot red"></div>
        <div class="code-dot yellow"></div>
        <div class="code-dot green"></div>
        <div class="code-label">${label}</div>
      </div>
      <div class="code-lines">
        ${lines.map(l => `<div class="code-line">${l}</div>`).join('')}
      </div>
    </div>`;
}

// ============================================================
// CHAPTER 1 — ROBOT KOKI (Command + Print)
// ============================================================
function parentTipCh1() {
  return `
    <h4>💛 Panduan Ayah & Bunda — Robot Koki</h4>
    <p><strong>Tujuan:</strong> Anak memahami bahwa komputer mengikuti instruksi yang kita berikan secara berurutan.</p>
    <p><strong>Game Sarapan Roti:</strong></p>
    <ul>
      <li>Dampingi anak menyusun urutan langkah membuat roti sarapan BIMO (Ambil Roti → Oles Selai → Tutup Roti).</li>
      <li>Diskusikan bersama anak: Mengapa selai tidak bisa dioles sebelum mengambil roti?</li>
      <li>Ini mengenalkan konsep dasar algoritma & instruksi berurutan (*sequencing*).</li>
    </ul>
    <p><strong>Di layar:</strong> Biarkan anak memilih dan bereksperimen sendiri!</p>
  `;
}

function loadChapter1(container) {
  // Scene 1: Intro story
  const s1 = makeScene('ch1-s1', 'ch1-scene');
  s1.innerHTML = `
    ${makeLearningOutcomeHTML('ch1')}
    <h2 class="scene-title">🤖 Robot Koki BIMO</h2>
    <div class="story-panel">
      ${makeBimoSmall()}
      <div class="story-text">
        <h3>Halo! Aku BIMO! 👋</h3>
        <p>Aku adalah Robot Koki yang ingin membuat sarapan hari ini!</p>
        <p>Tapi… aku tidak tahu apa yang harus aku katakan sampai <strong>kamu memberi instruksi</strong>! 🥺</p>
      </div>
    </div>
    <p class="scene-subtitle">Komputer seperti BIMO — dia hanya melakukan apa yang <em>kamu perintahkan</em>!</p>
    <div class="scene-nav">
      <button class="cta-primary" onclick="ch1Next(2)">
        <span class="btn-icon">➡️</span> Bantu BIMO!
      </button>
    </div>
  `;
  container.appendChild(s1);
  s1.classList.add('active');

  // Scene 2: Interactive Sandwich Minigame
  const s2 = makeScene('ch1-s2', 'ch1-scene');
  s2.innerHTML = `
    <h2 class="scene-title">🥪 Game Sarapan Roti BIMO</h2>
    <div class="story-panel">
      ${makeBimoSmall()}
      <div class="story-text">
        <h3>BIMO mau buat roti sarapan! 🍞</h3>
        <p>BIMO butuh instruksi <strong>berurutan</strong> dari kamu!</p>
        <p>Susun langkah yang tepat: <strong>Ambil Roti → Oles Selai → Tutup Roti</strong> 🥪</p>
      </div>
    </div>
    <div class="sandwich-game-box" id="ch1-sandwich-game"></div>
  `;
  container.appendChild(s2);

  // Scene 3: Choose greeting
  const s3 = makeScene('ch1-s3', 'ch1-scene');
  s3.innerHTML = `
    <h2 class="scene-title">💬 Apa yang harus BIMO katakan?</h2>
    <div class="story-panel" style="justify-content:center">
      ${makeBimoSmall()}
      <div class="story-text">
        <h3>BIMO ingin menyapa!</h3>
        <p>Pilih kalimat, lalu <strong>susun blok kodenya</strong> di bawah. Kamu yang menentukan!</p>
      </div>
    </div>
    <div id="ch1-fillin-container" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:16px"></div>
  `;
  container.appendChild(s3);

  // Scene 4: result
  const s4 = makeScene('ch1-s4', 'ch1-scene');
  s4.innerHTML = `
    <h2 class="scene-title">🎉 BIMO Menurut!</h2>
    <div id="ch1-result-bimo" style="display:flex;flex-direction:column;align-items:center;gap:20px">
      <div class="bimo-body bimo-bounce" aria-label="BIMO senang" style="filter:drop-shadow(0 8px 24px rgba(0,0,0,0.2))">
        <div class="bimo-head">
          <div class="bimo-antenna"></div>
          <div class="bimo-eyes">
            <div class="bimo-eye left-eye"><div class="bimo-pupil"></div></div>
            <div class="bimo-eye right-eye"><div class="bimo-pupil"></div></div>
          </div>
          <div class="bimo-mouth happy"></div>
        </div>
        <div class="bimo-torso"><div class="bimo-chest-light"></div></div>
        <div class="bimo-arms">
          <div class="bimo-arm left-arm wave"></div>
          <div class="bimo-arm right-arm wave"></div>
        </div>
        <div class="bimo-legs"><div class="bimo-leg"></div><div class="bimo-leg"></div></div>
      </div>
      <div class="speech-bubble" style="font-size:24px;font-family:var(--font-display)">
        <span id="ch1-result-text">Halo!</span>
      </div>
    </div>
    <div id="ch1-final-code" style="max-width:480px;width:100%"></div>
    <p class="scene-subtitle">🧠 Kamu baru saja membuat <strong>perintah pertamamu</strong>!<br>Ini namanya <strong>print</strong> — artinya "Robot, katakan!"</p>
    <div class="scene-nav">
      <button class="cta-primary" onclick="ch1Complete()">
        <span class="btn-icon">⭐</span> Ambil Bintang &amp; Lanjut!
      </button>
    </div>
  `;
  container.appendChild(s4);

  setBimoHelper('Pilih kata yang mau aku ucapkan! 🎤');
  setProgress(10);
}

let ch1Greeting = 'Halo!';

const SANDWICH_STEPS = [
  { id: 'step-bread', emoji: '🍞', label: 'Ambil Roti' },
  { id: 'step-jam',   emoji: '🍓', label: 'Oles Selai' },
  { id: 'step-close', emoji: '🥪', label: 'Tutup Roti' }
];
let ch1SandwichSlots = [null, null, null];

function ch1RenderSandwichGame() {
  const container = document.getElementById('ch1-sandwich-game');
  if (!container) return;

  container.innerHTML = `
    <div class="sandwich-slots-container">
      ${[0, 1, 2].map(idx => {
        const item = ch1SandwichSlots[idx];
        return `
          <button class="sandwich-slot ${item ? 'filled' : ''}" onclick="ch1ClearSandwichSlot(${idx})" aria-label="Langkah ${idx + 1}: ${item ? item.label : 'kosong'}">
            <span class="sandwich-slot-num">Langkah ${idx + 1}</span>
            <span class="sandwich-slot-text">${item ? `${item.emoji} ${item.label}` : '➕ Klik Pilihan...'}</span>
          </button>`;
      }).join('')}
    </div>

    <div class="sandwich-pool" style="margin-top:12px">
      ${SANDWICH_STEPS.map(step => {
        const isUsed = ch1SandwichSlots.some(s => s && s.id === step.id);
        return `
          <button class="sandwich-step-btn" onclick="ch1AddSandwichStep('${step.id}')" ${isUsed ? 'disabled' : ''}>
            <span>${step.emoji}</span> ${step.label}
          </button>`;
      }).join('')}
    </div>

    <div id="sandwich-feedback-box" class="sandwich-feedback hidden" style="margin-top:8px"></div>

    <div style="display:flex;gap:12px;margin-top:12px;flex-wrap:wrap;justify-content:center">
      <button class="run-btn" onclick="ch1RunSandwichGame()">
        <span>▶️</span> Jalankan Resep BIMO!
      </button>
      <button class="cta-secondary" onclick="ch1ResetSandwichGame()">
        <span>🔄</span> Reset
      </button>
    </div>

    <div id="ch1-sandwich-next" class="scene-nav hidden" style="margin-top:12px">
      <button class="cta-primary" onclick="ch1Next(3)">
        <span class="btn-icon">➡️</span> Lanjut ke Perintah Kata!
      </button>
    </div>
  `;
}

function ch1AddSandwichStep(stepId) {
  playClick();
  const step = SANDWICH_STEPS.find(s => s.id === stepId);
  if (!step) return;
  const emptyIdx = ch1SandwichSlots.findIndex(s => s === null);
  if (emptyIdx !== -1) {
    ch1SandwichSlots[emptyIdx] = step;
    ch1RenderSandwichGame();
    setBimoHelper(`Langkah ${emptyIdx + 1}: ${step.emoji} ${step.label} ditambahkan!`);
  } else {
    showBugMonster('Semua slot sudah terisi! Klik slot jika ingin mengubah urutan.');
  }
}

function ch1ClearSandwichSlot(idx) {
  playClick();
  if (ch1SandwichSlots[idx]) {
    ch1SandwichSlots[idx] = null;
    ch1RenderSandwichGame();
  }
}

function ch1ResetSandwichGame() {
  playClick();
  ch1SandwichSlots = [null, null, null];
  ch1RenderSandwichGame();
  setBimoHelper('Urutan di-reset! Pilih langkah 1, 2, dan 3 ya! 🥪');
}

function ch1RunSandwichGame() {
  const fb = document.getElementById('sandwich-feedback-box');
  const nextNav = document.getElementById('ch1-sandwich-next');

  if (ch1SandwichSlots.some(s => s === null)) {
    playError();
    if (fb) {
      fb.classList.remove('hidden', 'success');
      fb.classList.add('error');
      fb.textContent = '⚠️ Isilah ketiga langkah sarapan dulu ya!';
    }
    return;
  }

  const isCorrect = ch1SandwichSlots[0].id === 'step-bread' &&
                    ch1SandwichSlots[1].id === 'step-jam' &&
                    ch1SandwichSlots[2].id === 'step-close';

  if (isCorrect) {
    playSuccess();
    if (fb) {
      fb.classList.remove('hidden', 'error');
      fb.classList.add('success');
      fb.textContent = '🎉 BINGO! BIMO berhasil membuat roti sarapan 🥪 yang lezat! Urutan instruksimu sempurna!';
    }
    if (nextNav) nextNav.classList.remove('hidden');
    setBimoHelper('Yummy! Rotinya enak sekali! 🥪✨ Kamu berhasil memberi instruksi urut!');
  } else {
    playError();
    if (fb) {
      fb.classList.remove('hidden', 'success');
      fb.classList.add('error');
      fb.textContent = '🤪 Waduh! Masa selai dioles ke piring tanpa roti? Ayo perbaiki urutannya!';
    }
    setBimoHelper('🤪 BIMO kebingungan! Roti harus diambil dulu, oles selai, baru tutup rotinya! Coba lagi ya!');
  }
}

function ch1Next(scene) {
  playClick();
  document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
  const s = document.getElementById(`ch1-s${scene}`);
  if (s) s.classList.add('active');
  const progress = { 2: 25, 3: 50, 4: 85 };
  setProgress(progress[scene] || 0);

  if (scene === 2) {
    ch1RenderSandwichGame();
    setBimoHelper('Susun urutan langkah membuat roti sarapan BIMO! 🥪');
  }
  if (scene === 3) {
    setBimoHelper('Isilah bagian kosong [ ❓ ] pada perintah print! 🗣️');
    initFillInCodeBlock('ch1-fillin-container', {
      label: 'Perintah Print (Katakan)',
      numBlanks: 1,
      templates: [
        `<span class="code-fn">print</span><span class="code-punc">(</span> __BLANK_0__ <span class="code-punc">)</span>`
      ],
      tiles: [
        { id: 't1', text: '"Halo! 👋"', val: 'Halo!' },
        { id: 't2', text: '"Selamat Pagi! 🌅"', val: 'Selamat Pagi!' },
        { id: 't3', text: '"Aku Robot BIMO! 🤖"', val: 'Aku Robot BIMO!' },
        { id: 't4', text: '"Ayo Masak! 🍳"', val: 'Ayo Masak!' }
      ],
      correctLogic: (blanks) => blanks[0] !== null,
      onSuccess: (blanks) => {
        ch1Greeting = blanks[0].val;
        setTimeout(() => ch1RunCode(), 800);
      }
    });
  }
}

function ch1SelectGreeting(btn, greeting) {
  playClick();
  ch1Greeting = greeting;
  document.querySelectorAll('#ch1-choices .choice-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');

  // Reset lego area and auto-snap PRINT block with chosen greeting
  const area = document.getElementById('lego-area-ch1-lego');
  if (area) {
    area.querySelectorAll('.lego-block.assembled').forEach(b => b.remove());
    area.classList.remove('has-blocks');
    if (legoState['ch1-lego']) legoState['ch1-lego'].blocks = [];
    const emp = document.getElementById('lego-empty-ch1-lego');
    if (emp) emp.style.display = '';
  }
  legoAutoSnap('ch1-lego', 'print', { val: greeting, ro: true });

  // Show run button
  const runArea = document.getElementById('ch1-run-area');
  if (runArea) { runArea.classList.remove('hidden'); runArea.style.display = 'flex'; }

  setBimoHelper('Keren! Blok PRINT sudah terpasang. Tekan ▶️ untuk menjalankan! 🎉');
}

function ch1RunCode() {
  playSuccess();
  const s4 = document.getElementById('ch1-s4');
  document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
  s4.classList.add('active');

  document.getElementById('ch1-result-text').textContent = ch1Greeting;
  setProgress(85);

  const finalCode = document.getElementById('ch1-final-code');
  finalCode.innerHTML = makeCodeBlock([
    `<span class="code-fn" style="background:rgba(96,165,250,0.15);border-radius:4px;padding:0 4px">print</span><span class="code-punc">(</span><span class="code-str">"${ch1Greeting}"</span><span class="code-punc">)</span>`
  ]);

  awardStar('ch1');
  setBimoHelper(`Perintahmu berhasil! 🎉 Aku bilang: "${ch1Greeting}"`);
}

function ch1Complete() {
  playSuccess();
  completeChapter('ch1');
  goToMap();
}

// ============================================================
// CHAPTER 2 — KOTAK AJAIB (Variables)
// ============================================================
const ANIMALS = [
  { emoji: '🐱', name: 'Kucing',      value: 'Kucing' },
  { emoji: '🐶', name: 'Anjing',      value: 'Anjing' },
  { emoji: '🦖', name: 'Dinosaurus',  value: 'Dinosaurus' },
  { emoji: '🐼', name: 'Panda',       value: 'Panda' },
  { emoji: '🦁', name: 'Singa',       value: 'Singa' },
  { emoji: '🐬', name: 'Lumba-lumba', value: 'Lumbalumba' }
];

function parentTipCh2() {
  return `
    <h4>💛 Panduan Ayah & Bunda — Kotak Ajaib</h4>
    <p><strong>Tujuan:</strong> Anak memahami bahwa informasi dapat disimpan dalam "kotak" bernama (variable).</p>
    <p><strong>Aktivitas Fisik:</strong></p>
    <ul>
      <li>Siapkan kotak fisik atau toples — tempel label "HEWAN FAVORIT"</li>
      <li>Buat kartu kecil bertuliskan nama hewan (kucing, anjing, dll.)</li>
      <li>Masukkan kartu ke dalam kotak</li>
      <li>Tanya: "Kalau kita lupa hewan favorit kita, kita lihat ke mana?" → Kotaknya!</li>
    </ul>
    <p><strong>Di layar:</strong> Biarkan anak memilih hewan favoritnya sendiri. Pilihan apapun itu benar!</p>
  `;
}

function loadChapter2(container) {
  const s1 = makeScene('ch2-s1', 'ch2-scene');
  s1.style.background = 'linear-gradient(180deg, #E8F4FD 0%, #D1EAF9 100%)';
  s1.innerHTML = `
    ${makeLearningOutcomeHTML('ch2')}
    <h2 class="scene-title">📦 Kotak Mainan Ajaib</h2>
    <div class="story-panel">
      ${makeBimoSmall()}
      <div class="story-text">
        <h3>BIMO punya masalah! 🤔</h3>
        <p>BIMO sering lupa hewan favoritnya! Dia butuh <strong>kotak ajaib</strong> untuk menyimpan informasi.</p>
        <p>Di dunia komputer, kotak ini disebut… <strong>Kotak Data!</strong> 📦</p>
      </div>
    </div>
    <div class="scene-nav">
      <button class="cta-primary" onclick="ch2Next(2)">
        <span class="btn-icon">📦</span> Buat Kotaknya!
      </button>
    </div>
  `;
  container.appendChild(s1);
  s1.classList.add('active');

  const s2 = makeScene('ch2-s2', 'ch2-scene');
  s2.style.background = 'linear-gradient(180deg, #E8F4FD 0%, #D1EAF9 100%)';
  s2.innerHTML = `
    <h2 class="scene-title">🐾 Pilih Hewan Favorit BIMO!</h2>
    <p class="scene-subtitle">Kamu yang menentukan! Pilih satu hewan untuk dimasukkan ke dalam kotak.</p>
    <div class="toy-box-visual" id="ch2-box">
      <div class="box-lid" id="ch2-lid">📦 HEWAN FAVORIT</div>
      <div class="box-body">
        <div class="box-item" id="ch2-box-item">❓</div>
      </div>
      <div class="box-label" id="ch2-box-label">pilih hewan...</div>
    </div>
    <div class="animal-picker" id="ch2-animal-picker" style="margin-top:48px">
      ${ANIMALS.map(a => `
        <button class="animal-pick-btn" onclick="ch2SelectAnimal(this,'${a.emoji}','${a.name}','${a.value}')" aria-label="${a.name}">
          <span>${a.emoji}</span>
          <span class="animal-name">${a.name}</span>
        </button>
      `).join('')}
    </div>
    <div id="ch2-fillin-container" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:16px;margin-top:20px"></div>
    <div class="scene-nav" id="ch2-next-btn" style="display:none;margin-top:16px">
      <button class="cta-primary" onclick="ch2Next(3)">
        <span class="btn-icon">✨</span> Lihat Kodenya!
      </button>
    </div>
  `;
  container.appendChild(s2);

  const s3 = makeScene('ch2-s3', 'ch2-scene');
  s3.style.background = 'linear-gradient(180deg, #E8F4FD 0%, #D1EAF9 100%)';
  s3.innerHTML = `
    <h2 class="scene-title">🧠 Kamu Membuat Kotak Data!</h2>
    <div class="story-panel">
      ${makeBimoSmall()}
      <div class="story-text">
        <h3>Luar biasa! 🎉</h3>
        <p>Kotak data menyimpan informasi agar tidak lupa. Di dunia komputer ini namanya <strong>variabel</strong>.</p>
        <p>Kita bisa mengambil isinya kapan saja!</p>
      </div>
    </div>
    <div id="ch2-final-code" style="max-width:520px;width:100%"></div>
    <div class="result-display" id="ch2-result-display" style="max-width:520px">
      <div class="result-emoji" id="ch2-res-emoji">❓</div>
      <div>
        <div style="font-size:14px;font-weight:700;color:var(--text-light);text-transform:uppercase;letter-spacing:1px">Hewan Favorit BIMO</div>
        <div class="result-text" id="ch2-res-text" style="font-size:28px"></div>
      </div>
    </div>
    <div class="scene-nav">
      <button class="cta-primary" onclick="ch2Complete()">
        <span class="btn-icon">⭐</span> Ambil Bintang &amp; Lanjut!
      </button>
    </div>
  `;
  container.appendChild(s3);

  setBimoHelper('Pilih hewan favorit untuk dimasukkan ke kotakku! 📦');
  setProgress(10);
}

function ch2Next(scene) {
  playClick();
  document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
  const s = document.getElementById(`ch2-s${scene}`);
  if (s) s.classList.add('active');
  const progress = { 2: 30, 3: 80 };
  setProgress(progress[scene] || 0);

  if (scene === 2) {
    setBimoHelper('Isi variabel hewan_favorit dengan potongan kode! 📦');
    initFillInCodeBlock('ch2-fillin-container', {
      label: 'Kotak Data (Variable)',
      numBlanks: 1,
      templates: [
        `<span class="code-var">hewan_favorit</span> <span class="code-op">=</span> __BLANK_0__`,
        `<span class="code-fn">print</span><span class="code-punc">(</span> <span class="code-var">hewan_favorit</span> <span class="code-punc">)</span>`
      ],
      tiles: ANIMALS.map(a => ({ id: `tile-${a.value}`, text: `"${a.emoji} ${a.name}"`, val: a })),
      correctLogic: (blanks) => blanks[0] !== null,
      onSuccess: (blanks) => {
        const animal = blanks[0].val;
        STATE.chosenAnimal = animal;

        const lid = document.getElementById('ch2-lid');
        if (lid) { lid.classList.add('open'); setTimeout(() => lid.classList.remove('open'), 800); }
        const boxItem = document.getElementById('ch2-box-item');
        if (boxItem) { boxItem.textContent = animal.emoji; }
        const label = document.getElementById('ch2-box-label');
        if (label) label.textContent = animal.name;

        const nextBtn = document.getElementById('ch2-next-btn');
        if (nextBtn) nextBtn.style.display = 'flex';
        setBimoHelper(`Bagus sekali! Hewan ${animal.emoji} ${animal.name} berhasil disimpan dalam variabel! 📦`);
      }
    });
  }

  if (scene === 3) {
    const animal = STATE.chosenAnimal || ANIMALS[0];
    document.getElementById('ch2-res-emoji').textContent = animal.emoji;
    document.getElementById('ch2-res-text').textContent = animal.name;
    document.getElementById('ch2-final-code').innerHTML = makeCodeBlock([
      `<span class="code-var">hewan_favorit</span> <span class="code-op">=</span> <span class="code-str">"${animal.name}"</span>`,
      ``,
      `<span class="code-fn">print</span><span class="code-punc">(</span><span class="code-var">hewan_favorit</span><span class="code-punc">)</span>`,
      `<span class="code-cm"># Hasil: ${animal.name}</span>`
    ]);
    awardStar('ch2');
    setBimoHelper(`Hewan favoritku ${animal.emoji} ${animal.name}! Tersimpan! ✅`);
  }
}

function ch2SelectAnimal(btn, emoji, name, value) {
  playClick();
  const animal = { emoji, name, value };
  STATE.chosenAnimal = animal;

  // Update box
  document.querySelectorAll('.animal-pick-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');

  // Animate lid open
  const lid = document.getElementById('ch2-lid');
  if (lid) { lid.classList.add('open'); setTimeout(() => lid.classList.remove('open'), 800); }

  // Update box item
  const boxItem = document.getElementById('ch2-box-item');
  if (boxItem) {
    boxItem.style.animation = 'none';
    boxItem.textContent = emoji;
    boxItem.offsetWidth; // reflow
    boxItem.style.animation = 'fall-in 0.7s var(--ease-bounce)';
  }

  const label = document.getElementById('ch2-box-label');
  if (label) label.textContent = name;

  // Sync lego variable block
  const legoArea = document.getElementById('lego-area-ch2-lego');
  if (legoArea) {
    legoArea.querySelectorAll('.lego-block.assembled').forEach(b => b.remove());
    legoArea.classList.remove('has-blocks');
    if (legoState['ch2-lego']) { legoState['ch2-lego'].blocks = []; }
    const emp = document.getElementById('lego-empty-ch2-lego');
    if (emp) emp.style.display = '';
  }
  legoAutoSnap('ch2-lego', 'var', { varName: 'hewan_favorit', varVal: name, ro: true });

  const nextBtn = document.getElementById('ch2-next-btn');
  if (nextBtn) nextBtn.style.display = 'flex';

  setBimoHelper(`📦 Blok Kotak Ajaib terpasang! hewan_favorit = "${name}" 💾`);
}

function ch2Complete() {
  playSuccess();
  completeChapter('ch2');
  goToMap();
}

// ============================================================
// CHAPTER 3 — TOMBOL SUARA HEWAN (Functions)
// ============================================================
const ANIMAL_SOUNDS = [
  { emoji: '🐱', name: 'Kucing',     sound: 'MEOOONG!',   fun: 'meong' },
  { emoji: '🐶', name: 'Anjing',     sound: 'GUK GUK!',   fun: 'guk_guk' },
  { emoji: '🦁', name: 'Singa',      sound: 'ROAARR!',    fun: 'roar' },
  { emoji: '🦖', name: 'Dinosaurus', sound: 'RAAWRR!',    fun: 'rawr' },
  { emoji: '🐸', name: 'Katak',      sound: 'KROAK!',     fun: 'kroak' },
  { emoji: '🐄', name: 'Sapi',       sound: 'MOOOOO!',    fun: 'moo' }
];

function parentTipCh3() {
  return `
    <h4>💛 Panduan Ayah & Bunda — Tombol Suara Hewan</h4>
    <p><strong>Tujuan:</strong> Anak memahami bahwa beberapa perintah bisa digabung menjadi satu tombol (function).</p>
    <p><strong>Analogi:</strong></p>
    <ul>
      <li>Function seperti tombol jurus di game — sekali dibuat, bisa dipencet berkali-kali!</li>
      <li>Tanyakan: "Kalau kita harus mengetik semua perintah BIMO berulang kali, capek tidak?"</li>
      <li>"Mending kita buat tombol saja ya!"</li>
    </ul>
    <p><strong>Di layar:</strong> Biarkan anak memilih hewan dan menekan tombol berulang kali — itulah inti dari function!</p>
  `;
}

function loadChapter3(container) {
  const s1 = makeScene('ch3-s1', 'ch3-scene');
  s1.innerHTML = `
    ${makeLearningOutcomeHTML('ch3')}
    <h2 class="scene-title">🌿 Hutan Hewan Ajaib</h2>
    <div class="story-panel">
      ${makeBimoSmall()}
      <div class="story-text">
        <h3>BIMO menemukan sebuah mesin!</h3>
        <p>Di Hutan Hewan ada <strong>Mesin Tombol Suara</strong>. Setiap tombol bisa membuat hewan bersuara!</p>
        <p>Ini namanya <strong>Tombol Ajaib</strong> — sekali dibuat, bisa dipencet berkali-kali! 🎮</p>
      </div>
    </div>
    <div class="scene-nav">
      <button class="cta-primary" onclick="ch3Next(2)">
        <span class="btn-icon">🎮</span> Coba Tombolnya!
      </button>
    </div>
  `;
  container.appendChild(s1);
  s1.classList.add('active');

  const s2 = makeScene('ch3-s2', 'ch3-scene');
  s2.innerHTML = `
    <h2 class="scene-title">🔊 Pilih Hewan &amp; Tekan Tombol!</h2>
    <p class="scene-subtitle">Tekan tombol hewan — lalu lihat blok kode terbentuk!</p>
    <div id="ch3-fillin-container" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:16px;margin-top:20px"></div>
    <div class="scene-nav" id="ch3-next-nav" style="display:none;margin-top:16px">
      <button class="cta-primary" onclick="ch3Next(3)">
        <span class="btn-icon">✨</span> Lihat Tombol Ajaibnya!
      </button>
    </div>
  `;
  // Build grid
  container.appendChild(s2);
  const grid = s2.querySelector('#ch3-grid');
  ANIMAL_SOUNDS.forEach(a => {
    const btn = document.createElement('button');
    btn.className = 'animal-sound-btn';
    btn.setAttribute('aria-label', `${a.name} bersuara ${a.sound}`);
    btn.innerHTML = `<span>${a.emoji}</span><span class="sound-name">${a.name}</span><span class="sound-text">${a.sound}</span>`;
    btn.addEventListener('click', () => ch3PlaySound(a));
    grid.appendChild(btn);
  });

  const s3 = makeScene('ch3-s3', 'ch3-scene');
  s3.innerHTML = `
    <h2 class="scene-title">🪄 Kamu Membuat Tombol Ajaib!</h2>
    <div class="story-panel">
      ${makeBimoSmall()}
      <div class="story-text">
        <h3>Ini namanya Function! 🎉</h3>
        <p>Tombol yang kamu tekan tadi itu adalah <strong>function</strong>! Sekali kita buat, bisa kita tekan berkali-kali.</p>
      </div>
    </div>
    <div id="ch3-final-code" style="max-width:520px;width:100%"></div>
    <div class="scene-nav">
      <button class="cta-primary" onclick="ch3Complete()">
        <span class="btn-icon">⭐</span> Ambil Bintang &amp; Lanjut!
      </button>
    </div>
  `;
  container.appendChild(s3);

  setBimoHelper('Tekan tombol hewan untuk membuatnya bersuara! 🔊');
  setProgress(10);
}

let ch3LastAnimal = null;
let ch3Pressed = false;

function ch3Next(scene) {
  playClick();
  document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
  const s = document.getElementById(`ch3-s${scene}`);
  if (s) s.classList.add('active');
  const progress = { 2: 35, 3: 80 };
  setProgress(progress[scene] || 0);

  if (scene === 2) {
    setBimoHelper('Isilah fungsi dan perintah suara hewan pada kode! 🔊');
    initFillInCodeBlock('ch3-fillin-container', {
      label: 'Tombol Ajaib (Function Definition)',
      numBlanks: 2,
      templates: [
        `<span class="code-kw">def</span> __BLANK_0__<span class="code-punc">():</span>`,
        `    <span class="code-fn">print</span><span class="code-punc">(</span> __BLANK_1__ <span class="code-punc">)</span>`,
        ``,
        `<span class="code-cm"># Memanggil tombol aksi:</span>`,
        `__BLANK_0__<span class="code-punc">()</span>`
      ],
      tiles: [
        { id: 'fn-cat', text: 'suara_kucing', val: { sound: 'MEOOONG!', emoji: '🐱', name: 'Kucing', fun: 'suara_kucing' } },
        { id: 'fn-dog', text: 'suara_anjing', val: { sound: 'GUK GUK!', emoji: '🐶', name: 'Anjing', fun: 'suara_anjing' } },
        { id: 'str-cat', text: '"MEOOONG! 🐱"', val: { sound: 'MEOOONG!', emoji: '🐱', name: 'Kucing' } },
        { id: 'str-dog', text: '"GUK GUK! 🐶"', val: { sound: 'GUK GUK!', emoji: '🐶', name: 'Anjing' } }
      ],
      correctLogic: (blanks) => blanks[0] !== null && blanks[1] !== null && blanks[0].val.sound === blanks[1].val.sound,
      onSuccess: (blanks) => {
        const animal = blanks[0].val;
        ch3LastAnimal = animal;
        const output = document.getElementById('ch3-output');
        if (output) {
          output.classList.remove('hidden');
          output.textContent = `${animal.emoji} ${animal.sound}`;
        }
        const nextNav = document.getElementById('ch3-next-nav');
        if (nextNav) nextNav.style.display = 'flex';
      }
    });
  }

  if (scene === 3 && ch3LastAnimal) {
    document.getElementById('ch3-final-code').innerHTML = makeCodeBlock([
      `<span class="code-kw">def</span> <span class="code-fn">${ch3LastAnimal.fun}</span><span class="code-punc">():</span>`,
      `    <span class="code-fn">print</span><span class="code-punc">(</span><span class="code-str">"${ch3LastAnimal.sound}"</span><span class="code-punc">)</span>`,
      ``,
      `<span class="code-cm"># Pencet tombolnya!</span>`,
      `<span class="code-fn">${ch3LastAnimal.fun}</span><span class="code-punc">()</span>  <span class="code-cm"># ${ch3LastAnimal.sound}</span>`,
      `<span class="code-fn">${ch3LastAnimal.fun}</span><span class="code-punc">()</span>  <span class="code-cm"># ${ch3LastAnimal.sound}</span>`,
      `<span class="code-fn">${ch3LastAnimal.fun}</span><span class="code-punc">()</span>  <span class="code-cm"># ${ch3LastAnimal.sound}</span>`
    ]);
    awardStar('ch3');
    setBimoHelper(`Tombol ${ch3LastAnimal.emoji} ${ch3LastAnimal.name} sudah siap! Bisa dipencet berkali-kali! 🎮`);
  }
}

function ch3PlaySound(animal) {
  ch3LastAnimal = animal;
  ch3Pressed = true;
  playSuccess();

  const output = document.getElementById('ch3-output');
  output.classList.remove('hidden');
  output.textContent = `${animal.emoji} ${animal.sound}`;
  output.style.animation = 'none';
  output.offsetWidth;
  output.style.animation = 'shout 0.4s var(--ease-bounce)';

  // Auto-snap function blocks into lego area
  const legoArea = document.getElementById('lego-area-ch3-lego');
  if (legoArea) {
    legoArea.querySelectorAll('.lego-block.assembled').forEach(b => b.remove());
    legoArea.classList.remove('has-blocks');
    if (legoState['ch3-lego']) { legoState['ch3-lego'].blocks = []; }
    const emp = document.getElementById('lego-empty-ch3-lego');
    if (emp) emp.style.display = '';
  }
  legoAutoSnap('ch3-lego', 'fndef',  { val: animal.fun, ro: true });
  legoAutoSnap('ch3-lego', 'fncall', { val: animal.fun, ro: true });

  // Show next after first press
  const nextNav = document.getElementById('ch3-next-nav');
  if (nextNav) nextNav.style.display = 'flex';

  setBimoHelper(`🔘 Blok Tombol Ajaib terbentuk! ${animal.emoji} Pencet lagi untuk coba ulang! 😄`);
}

function ch3Complete() {
  playSuccess();
  completeChapter('ch3');
  goToMap();
}

// ============================================================
// CHAPTER 4 — MESIN SENAM (Loops)
// ============================================================
function parentTipCh4() {
  return `
    <h4>💛 Panduan Ayah & Bunda — Mesin Senam</h4>
    <p><strong>Tujuan:</strong> Anak memahami konsep pengulangan (loop).</p>
    <p><strong>Aktivitas Fisik (sebelum layar):</strong></p>
    <ul>
      <li>Minta anak lompat 5 kali</li>
      <li>Ayah/Bunda menghitung keras: "Satu! Dua! Tiga! Empat! Lima!"</li>
      <li>Tanyakan: "Capek tidak kalau Ayah harus bilang 'lompat' lima kali?"</li>
      <li>"Komputer juga bisa capek mengetik perintah berkali-kali. Makanya ada Mesin Ulangi!"</li>
    </ul>
    <p><strong>Di layar:</strong> Biarkan anak memilih berapa kali BIMO melompat. Tidak ada jawaban salah!</p>
  `;
}

function loadChapter4(container) {
  const s1 = makeScene('ch4-s1', 'ch4-scene');
  s1.innerHTML = `
    ${makeLearningOutcomeHTML('ch4')}
    <h2 class="scene-title">🦘 Lembah Melompat</h2>
    <div class="story-panel">
      ${makeBimoSmall()}
      <div class="story-text">
        <h3>BIMO ingin olahraga! 💪</h3>
        <p>BIMO ingin melompat <strong>banyak kali</strong>. Tapi capek mengetik "lompat" berulang-ulang!</p>
        <p>Untungnya ada <strong>Mesin Ulangi</strong> — kita tinggal pilih berapa kali! 🔄</p>
      </div>
    </div>
    <div class="scene-nav">
      <button class="cta-primary" onclick="ch4Next(2)">
        <span class="btn-icon">🦘</span> Coba Mesin Ulangi!
      </button>
    </div>
  `;
  container.appendChild(s1);
  s1.classList.add('active');

  const s2 = makeScene('ch4-s2', 'ch4-scene');
  s2.innerHTML = `
    <h2 class="scene-title">🔢 Berapa Kali BIMO Melompat?</h2>
    <div class="loop-machine">
      <p class="loop-title">Pilih jumlah lompatan BIMO!</p>
      <div class="counter-control">
        <button class="counter-btn minus" onclick="ch4Adjust(-1)" aria-label="Kurangi">−</button>
        <div class="counter-display" id="ch4-count" aria-live="polite">5</div>
        <button class="counter-btn plus"  onclick="ch4Adjust(1)"  aria-label="Tambah">+</button>
      </div>
      <div class="bimo-jump-container" id="ch4-bimo-area" aria-label="BIMO melompat">
        ${makeBimoCSSJumper()}
      </div>
      <div class="jump-counter-display" id="ch4-jump-counter" aria-live="polite"></div>
    </div>
    <div id="ch4-fillin-container" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:16px;margin-top:20px"></div>
    <div class="scene-nav" id="ch4-next-nav" style="display:none;margin-top:16px">
      <button class="cta-primary" onclick="ch4Next(3)">
        <span class="btn-icon">✨</span> Lihat Kode Loopnya!
      </button>
    </div>
  `;
  container.appendChild(s2);

  const s3 = makeScene('ch4-s3', 'ch4-scene');
  s3.innerHTML = `
    <h2 class="scene-title">🔄 Kamu Membuat Loop!</h2>
    <div class="story-panel">
      ${makeBimoSmall()}
      <div class="story-text">
        <h3>Ini namanya Loop! 🎉</h3>
        <p>Loop artinya <strong>ulangi terus</strong> sampai hitungan habis. Komputer tidak capek!</p>
      </div>
    </div>
    <div id="ch4-final-code" style="max-width:520px;width:100%"></div>
    <div class="scene-nav">
      <button class="cta-primary" onclick="ch4Complete()">
        <span class="btn-icon">⭐</span> Ambil Bintang &amp; Lanjut!
      </button>
    </div>
  `;
  container.appendChild(s3);

  setBimoHelper('Pilih berapa kali aku melompat, lalu tekan tombol! 🦘');
  setProgress(10);
}

function makeBimoCSSJumper() {
  return `
    <div class="bimo-sm bimo-jumping paused" id="ch4-bimo-jumper">
      <div class="bimo-head-sm">
        <div class="bimo-antenna-sm"></div>
        <div class="bimo-eyes-sm"><div class="bimo-eye-sm"></div><div class="bimo-eye-sm"></div></div>
        <div class="bimo-mouth-sm"></div>
      </div>
      <div class="bimo-torso-sm"></div>
    </div>
  `;
}

function ch4Next(scene) {
  playClick();
  document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
  const s = document.getElementById(`ch4-s${scene}`);
  if (s) s.classList.add('active');
  const progress = { 2: 35, 3: 80 };
  setProgress(progress[scene] || 0);

  if (scene === 2) {
    setBimoHelper('Isilah jumlah pengulangan (range) pada kode loop! 🦘');
    initFillInCodeBlock('ch4-fillin-container', {
      label: 'Mesin Ulangi (Loop)',
      numBlanks: 1,
      templates: [
        `<span class="code-kw">for</span> <span class="code-var">i</span> <span class="code-kw">in</span> <span class="code-fn">range</span><span class="code-punc">(</span> __BLANK_0__ <span class="code-punc">):</span>`,
        `    <span class="code-fn">lompat</span><span class="code-punc">()</span>`
      ],
      tiles: [
        { id: 'n3', text: '3 kali', val: 3 },
        { id: 'n5', text: '5 kali', val: 5 },
        { id: 'n7', text: '7 kali', val: 7 },
        { id: 'n10', text: '10 kali', val: 10 }
      ],
      correctLogic: (blanks) => blanks[0] !== null,
      onSuccess: (blanks) => {
        STATE.chosenJumps = blanks[0].val;
        const countEl = document.getElementById('ch4-count');
        if (countEl) countEl.textContent = STATE.chosenJumps;
        ch4RunJumps();
      }
    });
  }

  if (scene === 3) {
    const n = STATE.chosenJumps;
    document.getElementById('ch4-final-code').innerHTML = makeCodeBlock([
      `<span class="code-kw">def</span> <span class="code-fn">lompat</span><span class="code-punc">():</span>`,
      `    <span class="code-fn">print</span><span class="code-punc">(</span><span class="code-str">"🦘 LOMPAT!"</span><span class="code-punc">)</span>`,
      ``,
      `<span class="code-kw">for</span> <span class="code-var">i</span> <span class="code-kw">in</span> <span class="code-fn">range</span><span class="code-punc">(</span><span class="code-num">${n}</span><span class="code-punc">):</span>`,
      `    <span class="code-fn">lompat</span><span class="code-punc">()</span>  <span class="code-cm"># ${n} kali total!</span>`
    ]);
    awardStar('ch4');
    setBimoHelper(`Loop ${n} kali sudah selesai! BIMO tidak capek! 💪`);
  }
}

function ch4Adjust(delta) {
  playClick();
  STATE.chosenJumps = Math.max(1, Math.min(10, STATE.chosenJumps + delta));
  const el = document.getElementById('ch4-count');
  if (el) {
    el.textContent = STATE.chosenJumps;
    el.style.animation = 'none';
    el.offsetWidth;
    el.style.animation = 'result-pop 0.3s var(--ease-bounce)';
  }
  // Sync loop lego block count — auto-snap if not yet added
  const legoArea = document.getElementById('lego-area-ch4-lego');
  if (legoArea && !legoArea.querySelector('.lego-block.assembled')) {
    legoAutoSnap('ch4-lego', 'loop', { n: STATE.chosenJumps });
  } else {
    legoSyncLoop('ch4-lego', STATE.chosenJumps);
  }
  setBimoHelper(`🔄 Blok Loop: ${STATE.chosenJumps} kali! Tekan ▶️ untuk coba! 🦘`);
}

function ch4RunJumps() {
  const n = STATE.chosenJumps;
  const jumper = document.getElementById('ch4-bimo-jumper');
  const counter = document.getElementById('ch4-jump-counter');
  const runBtn = document.getElementById('ch4-run-btn');

  if (jumper) jumper.classList.remove('paused');
  if (runBtn) runBtn.disabled = true;

  let count = 0;
  const interval = setInterval(() => {
    count++;
    if (counter) counter.textContent = `🦘 ${count} / ${n}`;
    playTone(400 + count * 40, 'sine', 0.1, 0.15);
    if (count >= n) {
      clearInterval(interval);
      if (jumper) jumper.classList.add('paused');
      if (counter) counter.textContent = `🎉 Selesai! ${n} lompatan!`;
      if (runBtn) runBtn.disabled = false;
      playSuccess();

      // Show code
      const codeArea = document.getElementById('ch4-code-area');
      if (codeArea) {
        codeArea.classList.remove('hidden');
        codeArea.style.display = 'block';
        codeArea.innerHTML = makeCodeBlock([
          `<span class="code-kw">for</span> <span class="code-var">i</span> <span class="code-kw">in</span> <span class="code-fn">range</span><span class="code-punc">(</span><span class="code-num">${n}</span><span class="code-punc">):</span>`,
          `    <span class="code-fn">lompat</span><span class="code-punc">()</span>  <span class="code-cm"># ${n} kali!</span>`
        ]);
      }

      const nextNav = document.getElementById('ch4-next-nav');
      if (nextNav) nextNav.style.display = 'flex';

      awardStar('ch4');
      setBimoHelper(`Selesai! ${n} lompatan dengan sekali perintah! 🎉`);
    }
  }, 500);
}

function ch4Complete() {
  playSuccess();
  completeChapter('ch4');
  goToMap();
}

// ============================================================
// CHAPTER 5 — KERETA PELANGI (Lists)
// ============================================================
const TRAIN_ANIMALS = [
  { emoji: '🐱', name: 'Kucing',      color: '#FFB3BA' },
  { emoji: '🐼', name: 'Panda',       color: '#B3D9FF' },
  { emoji: '🦖', name: 'Dinosaurus',  color: '#B3FFB3' },
  { emoji: '🐶', name: 'Anjing',      color: '#FFE4B3' },
  { emoji: '🐸', name: 'Katak',       color: '#B3FFE4' },
  { emoji: '🦁', name: 'Singa',       color: '#FFD9B3' },
  { emoji: '🐬', name: 'Lumba',       color: '#D9B3FF' }
];

function parentTipCh5() {
  return `
    <h4>💛 Panduan Ayah & Bunda — Kereta Pelangi</h4>
    <p><strong>Tujuan:</strong> Anak memahami bahwa beberapa item bisa disimpan dalam satu "kelompok" (list).</p>
    <p><strong>Analogi Fisik:</strong></p>
    <ul>
      <li>Bayangkan kereta mainan: gerbong pertama, kedua, ketiga...</li>
      <li>Setiap gerbong menampung satu penumpang</li>
      <li>Seluruh kereta itu adalah "list" — satu kelompok yang terurut!</li>
    </ul>
    <p><strong>Di layar:</strong> Biarkan anak memilih penumpang kereta sesuka hati. Urutan boleh bebas!</p>
  `;
}

function loadChapter5(container) {
  const s1 = makeScene('ch5-s1', 'ch5-scene');
  s1.innerHTML = `
    ${makeLearningOutcomeHTML('ch5')}
    <h2 class="scene-title">🚂 Kereta Pelangi</h2>
    <div class="story-panel">
      ${makeBimoSmall()}
      <div class="story-text">
        <h3>BIMO mau naik kereta! 🚂</h3>
        <p>Kereta Pelangi bisa membawa banyak teman sekaligus! Tapi kita perlu <strong>daftar penumpang</strong>.</p>
        <p>Di dunia komputer, daftar ini disebut <strong>List</strong> — seperti gerbong kereta! 🚃</p>
      </div>
    </div>
    <div class="scene-nav">
      <button class="cta-primary" onclick="ch5Next(2)">
        <span class="btn-icon">🚂</span> Pilih Penumpang!
      </button>
    </div>
  `;
  container.appendChild(s1);
  s1.classList.add('active');

  const s2 = makeScene('ch5-s2', 'ch5-scene');
  s2.innerHTML = `
    <h2 class="scene-title">🎫 Siapa yang Naik Kereta?</h2>
    <p class="scene-subtitle">Pilih hingga 4 hewan untuk naik Kereta Pelangi!</p>
    <div class="train-track" id="ch5-train-track">
      <div class="train-row" id="ch5-train-row">
        <div class="train-engine" aria-label="Mesin kereta">🚂</div>
        <div class="train-connector"></div>
        <div class="train-empty-car" id="ch5-slot-0" aria-label="Gerbong kosong">+</div>
        <div class="train-connector"></div>
        <div class="train-empty-car" id="ch5-slot-1" aria-label="Gerbong kosong">+</div>
        <div class="train-connector"></div>
        <div class="train-empty-car" id="ch5-slot-2" aria-label="Gerbong kosong">+</div>
        <div class="train-connector"></div>
        <div class="train-empty-car" id="ch5-slot-3" aria-label="Gerbong kosong">+</div>
      </div>
    </div>
    <div id="ch5-fillin-container" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:16px;margin-top:20px"></div>
    <div class="scene-nav" id="ch5-next-nav" style="display:none;margin-top:16px">
      <button class="cta-primary" onclick="ch5Next(3)">
        <span class="btn-icon">🚂</span> Berangkat!
      </button>
    </div>
  `;
  container.appendChild(s2);
  // Build passenger pool
  const pool = s2.querySelector('#ch5-pool');
  TRAIN_ANIMALS.forEach((a, idx) => {
    const btn = document.createElement('button');
    btn.className = 'passenger-btn';
    btn.id = `ch5-pass-${idx}`;
    btn.setAttribute('aria-label', `Pilih ${a.name}`);
    btn.innerHTML = `<span>${a.emoji}</span><span class="p-name">${a.name}</span>`;
    btn.addEventListener('click', () => ch5AddPassenger(a, btn));
    pool.appendChild(btn);
  });

  const s3 = makeScene('ch5-s3', 'ch5-scene');
  s3.innerHTML = `
    <h2 class="scene-title">🎉 Kereta Berangkat!</h2>
    <div class="story-panel">
      ${makeBimoSmall()}
      <div class="story-text">
        <h3>Ini namanya List! 🎉</h3>
        <p>List menyimpan beberapa item dalam satu kelompok. Seperti gerbong kereta!</p>
        <p>Kita bisa mengambil siapa saja dari daftar ini kapan saja.</p>
      </div>
    </div>
    <div id="ch5-final-code" style="max-width:560px;width:100%"></div>
    <div class="scene-nav">
      <button class="cta-primary" onclick="ch5Complete()">
        <span class="btn-icon">⭐</span> Ambil Bintang &amp; Lanjut!
      </button>
    </div>
  `;
  container.appendChild(s3);

  STATE.trainPassengers = [];
  setBimoHelper('Pilih teman untuk naik kereta bersamaku! 🚂');
  setProgress(10);
}

function ch5Next(scene) {
  playClick();
  document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
  const s = document.getElementById(`ch5-s${scene}`);
  if (s) s.classList.add('active');
  const progress = { 2: 35, 3: 80 };
  setProgress(progress[scene] || 0);

  if (scene === 2) {
    setBimoHelper('Isilah daftar penumpang kereta pada kode List! 🚂');
    initFillInCodeBlock('ch5-fillin-container', {
      label: 'Daftar Kereta (List)',
      numBlanks: 2,
      templates: [
        `<span class="code-var">teman_kereta</span> <span class="code-op">=</span> <span class="code-punc">[</span>`,
        `    __BLANK_0__<span class="code-punc">,</span>`,
        `    __BLANK_1__<span class="code-punc">,</span>`,
        `<span class="code-punc">]</span>`,
        `<span class="code-fn">print</span><span class="code-punc">(</span> <span class="code-var">teman_kereta</span> <span class="code-punc">)</span>`
      ],
      tiles: TRAIN_ANIMALS.slice(0, 4).map(a => ({ id: `tpass-${a.name}`, text: `"${a.emoji} ${a.name}"`, val: a })),
      correctLogic: (blanks) => blanks[0] !== null && blanks[1] !== null && blanks[0].id !== blanks[1].id,
      onSuccess: (blanks) => {
        const pass1 = blanks[0].val;
        const pass2 = blanks[1].val;
        STATE.trainPassengers = [pass1, pass2];
        const slot0 = document.getElementById('ch5-slot-0');
        const slot1 = document.getElementById('ch5-slot-1');
        if (slot0) slot0.outerHTML = `<div class="train-car" style="background:${pass1.color}" aria-label="${pass1.name}">${pass1.emoji}</div>`;
        if (slot1) slot1.outerHTML = `<div class="train-car" style="background:${pass2.color}" aria-label="${pass2.name}">${pass2.emoji}</div>`;
        const nextNav = document.getElementById('ch5-next-nav');
        if (nextNav) nextNav.style.display = 'flex';
        setBimoHelper(`Bagus sekali! ${pass1.emoji} dan ${pass2.emoji} sudah naik kereta dalam List! 🚂`);
      }
    });
  }

  if (scene === 3) {
    const passengers = STATE.trainPassengers;
    const names = passengers.map(p => `"${p.name}"`).join(', ');
    const nameList = passengers.map(p => `    <span class="code-str">"${p.name}"</span><span class="code-punc">,</span>  <span class="code-cm"># ${p.emoji}</span>`).join('\n');
    document.getElementById('ch5-final-code').innerHTML = makeCodeBlock([
      `<span class="code-var">teman_kereta</span> <span class="code-op">=</span> <span class="code-punc">[</span>`,
      ...passengers.map(p => `    <span class="code-str">"${p.name}"</span><span class="code-punc">,</span>  <span class="code-cm"># ${p.emoji}</span>`),
      `<span class="code-punc">]</span>`,
      ``,
      `<span class="code-fn">print</span><span class="code-punc">(</span><span class="code-var">teman_kereta</span><span class="code-punc">)</span>`,
      `<span class="code-cm"># ${passengers.length} penumpang!</span>`
    ]);
    awardStar('ch5');
    setBimoHelper(`${passengers.length} teman naik kereta! List sudah lengkap! 🚂`);
  }
}

function ch5AddPassenger(animal, btn) {
  if (STATE.trainPassengers.length >= 4) {
    showBugMonster('Kereta sudah penuh! Maksimal 4 penumpang. 🚂');
    return;
  }
  if (STATE.trainPassengers.find(p => p.name === animal.name)) {
    showBugMonster(`${animal.emoji} ${animal.name} sudah ada di kereta!`);
    return;
  }

  STATE.trainPassengers.push(animal);
  btn.classList.add('boarded');
  btn.disabled = true;
  playPop();

  // Update train slot
  const slotIdx = STATE.trainPassengers.length - 1;
  const slot = document.getElementById(`ch5-slot-${slotIdx}`);
  if (slot) {
    slot.outerHTML = `
      <div class="train-car" style="background:${animal.color};border-color:${animal.color};" aria-label="${animal.name}">
        ${animal.emoji}
      </div>`;
  }

  // Auto-snap LIST block on first passenger, then add items
  const legoArea = document.getElementById('lego-area-ch5-lego');
  if (legoArea && !legoArea.querySelector('.lego-block.assembled')) {
    legoAutoSnap('ch5-lego', 'list', {});
  }
  legoListAdd('ch5-lego', animal.name);

  if (STATE.trainPassengers.length >= 1) {
    const nextNav = document.getElementById('ch5-next-nav');
    if (nextNav) nextNav.style.display = 'flex';
  }

  setBimoHelper(`🚃 ${animal.emoji} ${animal.name} masuk daftar! (${STATE.trainPassengers.length}/4) 🎉`);
  saveProgress();
}

function ch5Complete() {
  playSuccess();
  completeChapter('ch5');
  goToMap();
}

// ============================================================
// CHAPTER 6 — KASTIL BINTANG (Quiz + Final Project)
// ============================================================
const QUIZ_QUESTIONS = [
  {
    question: 'Robot BIMO ingin mengatakan "HALO!". Mantra apa yang kita pakai?',
    options: ['jump()', 'print("HALO!")', 'sleep()'],
    correct: 1,
    feedback: '🎉 Benar! print adalah perintah untuk Robot berkata!'
  },
  {
    question: 'Kotak bernama "HEWAN FAVORIT" digunakan untuk apa?',
    options: ['Menyimpan sesuatu', 'Membuat robot terbang', 'Mematikan komputer'],
    correct: 0,
    feedback: '⭐ Tepat! Kotak data menyimpan informasi agar tidak lupa!'
  },
  {
    question: 'Kalau ingin robot melompat 10 kali, kita pakai apa?',
    options: ['Kotak Ajaib', 'Mesin Ulangi (Loop)', 'Mouse'],
    correct: 1,
    feedback: '🦘 Betul sekali! Loop membuat komputer mengulang aksi!'
  },
  {
    question: 'Tombol Ajaib yang bisa dipencet berkali-kali itu disebut apa?',
    options: ['Variable', 'List', 'Function'],
    correct: 2,
    feedback: '🎮 Hebat! Function adalah tombol aksi yang bisa dipanggil kapan saja!'
  },
  {
    question: 'Kereta yang membawa banyak hewan sekaligus, di komputer namanya apa?',
    options: ['Loop', 'List', 'Print'],
    correct: 1,
    feedback: '🚂 Bravo! List menyimpan banyak item dalam satu kelompok!'
  }
];

function parentTipCh6() {
  return `
    <h4>💛 Panduan Ayah & Bunda — Kastil Bintang</h4>
    <p><strong>Tujuan:</strong> Review semua konsep dalam bentuk permainan, bukan ujian.</p>
    <p><strong>Catatan Penting:</strong></p>
    <ul>
      <li>Tidak ada pengurangan nilai untuk jawaban salah!</li>
      <li>Setiap percobaan tetap dihargai</li>
      <li>Bantu anak mengingat dengan analogi: kotak, tombol, mesin ulangi, kereta</li>
    </ul>
    <p><strong>Setelah quiz:</strong> Anak akan membuat "Robot Teman" sendiri — ini adalah momen spesial! Beri semangat!</p>
  `;
}

function loadChapter6(container) {
  const s1 = makeScene('ch6-s1', 'ch6-scene');
  s1.innerHTML = `
    <h2 class="scene-title" style="color:var(--sun-yellow)">🏰 Kastil Bintang</h2>
    <div class="story-panel" style="background:rgba(255,255,255,0.08);border:2px solid rgba(255,255,255,0.15)">
      ${makeBimoSmall()}
      <div class="story-text">
        <h3 style="color:white">Selamat datang di Kastil Bintang! 🌟</h3>
        <p style="color:rgba(255,255,255,0.85)">Ini adalah petualangan terakhir kita! Kita akan membuktikan bahwa kamu sudah menjadi <strong>Petualang Coding Cilik</strong>!</p>
      </div>
    </div>
    <div class="scene-nav">
      <button class="cta-primary" onclick="ch6Next(2)">
        <span class="btn-icon">🏆</span> Mulai Kuis!
      </button>
    </div>
  `;
  container.appendChild(s1);
  s1.classList.add('active');

  // Quiz scene
  const s2 = makeScene('ch6-s2', 'ch6-scene');
  s2.innerHTML = `
    <h2 class="scene-title" style="color:var(--sun-yellow)">🧠 Kuis Petualang</h2>
    <div id="ch6-quiz-container" style="width:100%;max-width:600px;display:flex;flex-direction:column;gap:20px;align-items:center"></div>
  `;
  container.appendChild(s2);

  // Final project scene
  const s3 = makeScene('ch6-s3', 'ch6-scene');
  s3.innerHTML = `
    <h2 class="scene-title" style="color:var(--sun-yellow)">🤖 Buat Robot Temanmu!</h2>
    <div class="final-project" id="ch6-fp">
      <p class="fp-title">✨ My Robot Friend</p>
      <div class="fp-section">
        <div class="fp-label">Nama Robotmu</div>
        <input class="fp-input" id="fp-robot-name" type="text" placeholder="Contoh: ZIPO, KOKO, LUNA..." maxlength="15" value="${STATE.chosenRobotName}" oninput="ch6UpdatePreview()" />
      </div>
      <div class="fp-section">
        <div class="fp-label">Hewan Favorit</div>
        <div style="display:flex;flex-wrap:wrap;gap:10px">
          ${ANIMALS.map(a => `
            <button class="animal-pick-btn" style="width:72px;height:72px;background:rgba(255,255,255,0.1);border:2px solid rgba(255,255,255,0.2)" 
              onclick="ch6SetAnimal('${a.emoji}','${a.name}',this)" aria-label="${a.name}">
              <span>${a.emoji}</span><span class="animal-name" style="color:rgba(255,255,255,0.7)">${a.name}</span>
            </button>
          `).join('')}
        </div>
      </div>
      <div class="fp-section">
        <div class="fp-label">Berapa kali robot melompat?</div>
        <div class="counter-control">
          <button class="counter-btn minus" onclick="ch6AdjJumps(-1)">−</button>
          <div class="counter-display" id="fp-jumps" style="color:var(--sun-yellow)">${STATE.chosenJumps}</div>
          <button class="counter-btn plus"  onclick="ch6AdjJumps(1)">+</button>
        </div>
      </div>
      <div id="fp-code-output" class="fp-code-output"></div>
      <div id="fp-robot-preview" class="robot-preview hidden">
        <div class="robot-preview-title" id="fp-preview-name">🤖 BIMO</div>
        <div class="robot-preview-animal" id="fp-preview-animal">🐱</div>
        <div style="font-size:15px;color:rgba(255,255,255,0.6);font-weight:700">Teman-teman:</div>
        <div class="robot-preview-friends" id="fp-preview-friends"></div>
        <div style="font-size:15px;color:rgba(255,255,255,0.6);font-weight:700;margin-top:8px">Kekuatan Lompat:</div>
        <div class="robot-preview-jumps" id="fp-preview-jumps"></div>
      </div>
      <button class="cta-primary" id="fp-generate-btn" onclick="ch6GenerateRobot()" style="margin-top:8px">
        <span class="btn-icon">🚀</span> Buat Robotku!
      </button>
    </div>
  `;
  container.appendChild(s3);

  // Certificate prompt scene
  const s4 = makeScene('ch6-s4', 'ch6-scene');
  s4.innerHTML = `
    <h2 class="scene-title" style="color:var(--sun-yellow)">🎉 Misi Selesai!</h2>
    <div style="display:flex;flex-direction:column;align-items:center;gap:24px">
      <div class="bimo-body bimo-bounce" style="filter:drop-shadow(0 8px 24px rgba(255,216,92,0.4))">
        <div class="bimo-head">
          <div class="bimo-antenna"></div>
          <div class="bimo-eyes">
            <div class="bimo-eye left-eye"><div class="bimo-pupil"></div></div>
            <div class="bimo-eye right-eye"><div class="bimo-pupil"></div></div>
          </div>
          <div class="bimo-mouth happy"></div>
        </div>
        <div class="bimo-torso"><div class="bimo-chest-light"></div></div>
        <div class="bimo-arms">
          <div class="bimo-arm left-arm wave"></div>
          <div class="bimo-arm right-arm wave"></div>
        </div>
        <div class="bimo-legs"><div class="bimo-leg"></div><div class="bimo-leg"></div></div>
      </div>
      <p style="font-family:var(--font-display);font-size:28px;color:white;text-align:center;line-height:1.4">
        ${STATE.childName}, kamu sudah menyelesaikan<br><span style="color:var(--sun-yellow)">Petualangan Coding Cilik!</span>
      </p>
      <div class="scene-nav">
        <button class="cta-primary" onclick="showCertificate()">
          <span class="btn-icon">🏆</span> Ambil Sertifikatku!
        </button>
      </div>
    </div>
  `;
  container.appendChild(s4);

  setBimoHelper('Kita hampir sampai di Kastil Bintang! 🏰');
  setProgress(10);

  // Initialize quiz
  ch6QuizState = { current: 0, correct: 0, answered: false };
}

let ch6QuizState = { current: 0, correct: 0, answered: false };

function ch6Next(scene) {
  playClick();
  document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
  const s = document.getElementById(`ch6-s${scene}`);
  if (s) s.classList.add('active');
  const progress = { 2: 20, 3: 65, 4: 90 };
  setProgress(progress[scene] || 0);

  if (scene === 2) renderQuiz();
  if (scene === 3) {
    awardStar('ch6');
    ch6UpdatePreview();
    setBimoHelper('Buat robot temanmu! Pilih nama, hewan, dan kekuatan lompatnya! 🤖');
  }
  if (scene === 4) {
    completeChapter('ch6');
    setBimoHelper('SELAMAT! Kamu sudah menjadi Petualang Coding Cilik! 🏆');
  }
}

function renderQuiz() {
  const container = document.getElementById('ch6-quiz-container');
  const q = QUIZ_QUESTIONS[ch6QuizState.current];
  const totalQ = QUIZ_QUESTIONS.length;

  container.innerHTML = `
    <div class="quiz-card">
      <div class="quiz-counter">Pertanyaan ${ch6QuizState.current + 1} dari ${totalQ} — Betul: ${ch6QuizState.correct}/${ch6QuizState.current}</div>
      <div class="quiz-question">${q.question}</div>
      <div class="quiz-options">
        ${q.options.map((opt, i) => `
          <button class="quiz-option-btn" id="qopt-${i}" onclick="ch6Answer(${i})" aria-label="Pilihan: ${opt}">
            ${String.fromCharCode(65 + i)}. ${opt}
          </button>
        `).join('')}
      </div>
      <div class="quiz-feedback" id="quiz-feedback" aria-live="polite"></div>
    </div>
  `;
}

function ch6Answer(optIdx) {
  if (ch6QuizState.answered) return;
  ch6QuizState.answered = true;

  const q = QUIZ_QUESTIONS[ch6QuizState.current];
  const feedback = document.getElementById('quiz-feedback');
  const optBtns = document.querySelectorAll('.quiz-option-btn');

  optBtns.forEach(b => b.disabled = true);

  if (optIdx === q.correct) {
    optBtns[optIdx].classList.add('correct');
    feedback.textContent = q.feedback;
    feedback.style.color = '#4ADE80';
    ch6QuizState.correct++;
    playSuccess();
    awardStar('ch6');
  } else {
    optBtns[optIdx].classList.add('wrong');
    optBtns[q.correct].classList.add('correct');
    feedback.textContent = `🔄 Tidak apa-apa! Jawabannya: ${q.options[q.correct]}`;
    feedback.style.color = '#FB923C';
    playError();
  }

  ch6QuizState.answered = false;
  ch6QuizState.current++;

  setTimeout(() => {
    if (ch6QuizState.current < QUIZ_QUESTIONS.length) {
      renderQuiz();
    } else {
      // Quiz done
      const container = document.getElementById('ch6-quiz-container');
      container.innerHTML = `
        <div class="quiz-card" style="text-align:center">
          <div style="font-size:52px">🎉</div>
          <div class="quiz-question">Kuis Selesai!<br>Jawaban Benar: ${ch6QuizState.correct}/${QUIZ_QUESTIONS.length}</div>
          <div class="quiz-feedback" style="color:var(--sun-yellow)">Kamu adalah Petualang Coding yang hebat!</div>
          <button class="cta-primary" style="margin-top:16px" onclick="ch6Next(3)">
            <span class="btn-icon">🤖</span> Buat Robot Temanku!
          </button>
        </div>
      `;
      playSuccess();
    }
  }, 1800);
}

// Final project
let fpAnimal = STATE.chosenAnimal || ANIMALS[0];

function ch6SetAnimal(emoji, name, btn) {
  fpAnimal = { emoji, name };
  playClick();
  document.querySelectorAll('#ch6-fp .animal-pick-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  ch6UpdatePreview();
}

function ch6AdjJumps(delta) {
  STATE.chosenJumps = Math.max(1, Math.min(10, STATE.chosenJumps + delta));
  const el = document.getElementById('fp-jumps');
  if (el) el.textContent = STATE.chosenJumps;
  ch6UpdatePreview();
}

function ch6UpdatePreview() {
  const robotName = (document.getElementById('fp-robot-name')?.value || STATE.chosenRobotName).trim() || 'BIMO';
  STATE.chosenRobotName = robotName;
  const friends = STATE.trainPassengers.length > 0 ? STATE.trainPassengers : [ANIMALS[0]];
  const animalName = (fpAnimal || ANIMALS[0]).name;

  const codeOut = document.getElementById('fp-code-output');
  if (codeOut) {
    codeOut.innerHTML = makeCodeBlock([
      `<span class="code-cm"># 🤖 Robot Temanku</span>`,
      `<span class="code-var">nama</span> <span class="code-op">=</span> <span class="code-str">"${escapeHTML(robotName)}"</span>`,
      `<span class="code-var">hewan_favorit</span> <span class="code-op">=</span> <span class="code-str">"${escapeHTML(animalName)}"</span>`,
      ``,
      `<span class="code-kw">def</span> <span class="code-fn">sapa</span><span class="code-punc">():</span>`,
      `    <span class="code-fn">print</span><span class="code-punc">(</span><span class="code-str">"Halo! Aku " + nama</span><span class="code-punc">)</span>`,
      ``,
      `<span class="code-kw">for</span> <span class="code-var">i</span> <span class="code-kw">in</span> <span class="code-fn">range</span><span class="code-punc">(</span><span class="code-num">${STATE.chosenJumps}</span><span class="code-punc">):</span>`,
      `    <span class="code-fn">lompat</span><span class="code-punc">()</span>`,
      ``,
      `<span class="code-var">teman</span> <span class="code-op">=</span> <span class="code-punc">[</span>${friends.map(f => `<span class="code-str">"${escapeHTML(f.name)}"</span>`).join(', ')}<span class="code-punc">]</span>`
    ], 'Python Final Project');
  }
}

function ch6GenerateRobot() {
  playSuccess();
  const robotName = (document.getElementById('fp-robot-name')?.value || STATE.chosenRobotName).trim() || 'BIMO';
  STATE.chosenRobotName = robotName;
  const animal = fpAnimal || ANIMALS[0];
  const friends = STATE.trainPassengers.length > 0 ? STATE.trainPassengers : [ANIMALS[0]];

  const preview = document.getElementById('fp-robot-preview');
  if (preview) {
    preview.classList.remove('hidden');
    document.getElementById('fp-preview-name').textContent = `🤖 ${robotName}`;
    document.getElementById('fp-preview-animal').textContent = animal.emoji;
    document.getElementById('fp-preview-friends').innerHTML = friends.map(f => `<span>${f.emoji}</span>`).join('');
    document.getElementById('fp-preview-jumps').innerHTML = '🦘'.repeat(STATE.chosenJumps);
    preview.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  awardStar('ch6');
  saveProgress();
  setBimoHelper(`Robot ${robotName} sudah jadi! 🤖✨`);

  // Change button to proceed
  const btn = document.getElementById('fp-generate-btn');
  if (btn) {
    btn.innerHTML = '<span class="btn-icon">🏆</span> Lanjut ke Sertifikat!';
    btn.onclick = () => ch6Next(4);
  }
}

// ============================================================
// CERTIFICATE SCREEN
// ============================================================
function showCertificate() {
  playSuccess();
  showScreen('screen-certificate');
  document.getElementById('cert-child-name').textContent = STATE.childName;
  document.getElementById('cert-total-stars').textContent = `⭐ ${STATE.totalStars} Bintang Dikumpulkan`;
  spawnConfetti();
}

function spawnConfetti() {
  const container = document.getElementById('confetti-container');
  container.innerHTML = '';
  const colors = ['#FFD85C','#FF8C42','#5BB8F5','#5CC86A','#A882F0','#FF9BAE','#FF6B6B'];
  for (let i = 0; i < 80; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width  = (8 + Math.random() * 10) + 'px';
    piece.style.height = (8 + Math.random() * 10) + 'px';
    piece.style.animationDuration = (2 + Math.random() * 3) + 's';
    piece.style.animationDelay = (Math.random() * 2) + 's';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    container.appendChild(piece);
  }

  // Re-spawn after confetti finishes
  setTimeout(() => spawnConfetti(), 5000);
}

// ============================================================
// LEARNING OUTCOMES
// ============================================================
const LEARNING_OUTCOMES = {
  ch1: { icon: '🤖', label: 'Perintah (Command)', color: '#FFF3E0', textColor: '#7A3800',
         accentBg: '#FFD85C', accentText: '#5A3000',
         goal: 'Memberikan instruksi kepada komputer!' },
  ch2: { icon: '📦', label: 'Kotak Ajaib (Variable)', color: '#E8F4FD', textColor: '#124070',
         accentBg: '#5BB8F5', accentText: 'white',
         goal: 'Menyimpan informasi dalam kotak bernama!' },
  ch3: { icon: '🔘', label: 'Tombol Ajaib (Function)', color: '#E8F9EF', textColor: '#0D5020',
         accentBg: '#5CC86A', accentText: 'white',
         goal: 'Membuat tombol aksi yang bisa dipencet berkali-kali!' },
  ch4: { icon: '🔄', label: 'Mesin Ulangi (Loop)', color: '#EEF2FF', textColor: '#3D1880',
         accentBg: '#A882F0', accentText: 'white',
         goal: 'Mengulang aksi tanpa menulis perintah berkali-kali!' },
  ch5: { icon: '🚃', label: 'Kereta Data (List)', color: '#FFF0F5', textColor: '#6A0030',
         accentBg: '#FF9BAE', accentText: '#4A0018',
         goal: 'Menyusun banyak benda dalam satu kelompok terurut!' },
  ch6: { icon: '🏆', label: 'Petualangan Final!', color: 'rgba(255,255,255,0.06)', textColor: 'white',
         accentBg: '#FFD85C', accentText: '#5A3000',
         goal: 'Gabungkan semua konsep yang sudah dipelajari!' }
};

function makeLearningOutcomeHTML(chId) {
  const o = LEARNING_OUTCOMES[chId];
  if (!o) return '';
  return `
    <div class="learning-outcome-strip" role="note" aria-label="Tujuan pembelajaran"
         style="background:${o.color};border:2px solid ${o.accentBg}40;">
      <div class="outcome-icon" aria-hidden="true">${o.icon}</div>
      <div class="outcome-text">
        <div class="outcome-label" style="color:${o.textColor};opacity:0.65">🎯 Yang akan kamu pelajari:</div>
        <div class="outcome-goal" style="color:${o.textColor}">${o.goal}</div>
        <span class="outcome-concept" style="background:${o.accentBg};color:${o.accentText};box-shadow:0 2px 0 rgba(0,0,0,0.15)">${o.label}</span>
      </div>
    </div>`;
}

// ============================================================
// LEGO CODE BLOCK ENGINE
// ============================================================
const LEGO_DEFS = {
  print:  { cls: 'lego-block-print',  icon: '🗣️', label: 'Katakan!',      studs: 1 },
  var:    { cls: 'lego-block-var',    icon: '📦', label: 'Simpan Kotak',  studs: 2 },
  fndef:  { cls: 'lego-block-fndef',  icon: '🔘', label: 'Buat Tombol',   studs: 2 },
  fncall: { cls: 'lego-block-fncall', icon: '▶️', label: 'Pencet!',       studs: 1 },
  loop:   { cls: 'lego-block-loop',   icon: '🔄', label: 'Ulangi',        studs: 2 },
  list:   { cls: 'lego-block-list',   icon: '🚃', label: 'Daftar Kereta', studs: 3 }
};

const legoState = {};

// ============================================================
// INTERACTIVE FILL-IN-THE-BLANK CODE BLOCK & LOGIC ENGINE
// ============================================================
const fillInState = {};

function initFillInCodeBlock(id, config) {
  fillInState[id] = {
    label: config.label || 'Python Code Block',
    templates: config.templates,
    tiles: config.tiles,
    numBlanks: config.numBlanks || 1,
    blanks: new Array(config.numBlanks || 1).fill(null),
    correctLogic: config.correctLogic,
    onSuccess: config.onSuccess
  };
  renderFillInCodeBlock(id);
}

function renderFillInCodeBlock(id) {
  const container = document.getElementById(id);
  if (!container) return;

  const st = fillInState[id];
  if (!st) return;

  const linesHTML = st.templates.map(line => {
    let renderedLine = line;
    st.blanks.forEach((val, idx) => {
      const placeholder = `__BLANK_${idx}__`;
      const blankHTML = val
        ? `<button class="code-blank filled" onclick="fillInResetBlank('${id}', ${idx})" aria-label="Reset isian ${idx+1}"><span>${escapeHTML(val.text)}</span></button>`
        : `<button class="code-blank" onclick="fillInSelectBlank('${id}', ${idx})" aria-label="Isi bagian kosong ${idx+1}"><span>[ ❓ Isi Disini ]</span></button>`;
      renderedLine = renderedLine.replace(placeholder, blankHTML);
    });
    return `<div class="lego-code-line">${renderedLine}</div>`;
  }).join('');

  const tilesHTML = st.tiles.map(tile => {
    const isUsed = st.blanks.some(b => b && b.id === tile.id);
    return `
      <button class="code-tile" onclick="fillInPickTile('${id}', '${tile.id}')" ${isUsed ? 'disabled' : ''}>
        🧩 <span>${escapeHTML(tile.text)}</span>
      </button>`;
  }).join('');

  container.innerHTML = `
    <div class="code-reveal-block" style="width:100%;max-width:640px">
      <div class="code-header">
        <div class="code-dot red"></div>
        <div class="code-dot yellow"></div>
        <div class="code-dot green"></div>
        <div class="code-label">🧩 ${escapeHTML(st.label)}</div>
      </div>
      <div class="lego-code-output" style="min-height:90px;padding:20px 24px">
        ${linesHTML}
      </div>
    </div>

    <div class="code-tile-section" style="max-width:640px">
      <div class="code-tile-label">👇 Pilih Potongan Kode untuk Mengisi Bagian Kosong [ ❓ ]:</div>
      <div class="code-tile-pool">
        ${tilesHTML}
      </div>
    </div>

    <div class="code-logic-bar" style="max-width:640px">
      <div id="fillin-feedback-${id}" class="code-logic-result hidden"></div>
      <button class="run-btn" onclick="fillInValidateLogic('${id}')" style="margin-top:6px">
        <span>▶️</span> Jalankan &amp; Uji Logika Kode!
      </button>
    </div>
  `;
}

function fillInPickTile(id, tileId) {
  playPop();
  const st = fillInState[id];
  if (!st) return;
  const tile = st.tiles.find(t => t.id === tileId);
  if (!tile) return;

  const emptyBlankIdx = st.blanks.findIndex(b => b === null);
  if (emptyBlankIdx !== -1) {
    st.blanks[emptyBlankIdx] = tile;
    renderFillInCodeBlock(id);
    setBimoHelper(`Potongan kode "${tile.text}" berhasil dimasukkan! 🧩`);
  } else {
    showBugMonster('Semua bagian kosong sudah terisi! Klik bagian yang ingin diubah.');
  }
}

function fillInResetBlank(id, blankIdx) {
  playClick();
  const st = fillInState[id];
  if (st && st.blanks[blankIdx]) {
    st.blanks[blankIdx] = null;
    renderFillInCodeBlock(id);
  }
}

function fillInValidateLogic(id) {
  const st = fillInState[id];
  if (!st) return;

  const fb = document.getElementById(`fillin-feedback-${id}`);

  if (st.blanks.some(b => b === null)) {
    playError();
    if (fb) {
      fb.classList.remove('hidden', 'success');
      fb.classList.add('error');
      fb.textContent = '⚠️ Isilah semua bagian kosong [ ❓ ] pada kode dulu ya!';
    }
    return;
  }

  const isLogicValid = st.correctLogic ? st.correctLogic(st.blanks) : true;

  if (isLogicValid) {
    playSuccess();
    if (fb) {
      fb.classList.remove('hidden', 'error');
      fb.classList.add('success');
      fb.textContent = '🎉 LOGIKA BENAR! Komputer berhasil menjalankan kodenya tanpa bug!';
    }
    if (st.onSuccess) st.onSuccess(st.blanks);
  } else {
    playError();
    if (fb) {
      fb.classList.remove('hidden', 'success');
      fb.classList.add('error');
      fb.textContent = '🤪 Waduh! Logika kodenya belum pas. Coba periksa potongan kode yang kamu pilih!';
    }
    setBimoHelper('🤪 Ada bug monster di logikamu! Coba ganti potongan kodenya ya!');
  }
}

function _legoStuds(n) {
  return `<div class="lego-studs">${'<div class="lego-stud"></div>'.repeat(n)}</div>`;
}

function makeLegoAreaHTML(id, allowedTypes) {
  legoState[id] = { blocks: [], listItems: [] };
  const palBtns = allowedTypes.map(t => {
    const d = LEGO_DEFS[t];
    return `<button class="lego-block ${d.cls}" onclick="legoAdd('${id}','${t}')" aria-label="Tambah blok ${d.label}">
      ${_legoStuds(d.studs)}
      <span class="lego-block-icon">${d.icon}</span>
      <span class="lego-block-label">${d.label}</span>
    </button>`;
  }).join('');
  return `
    <div class="lego-builder" id="lego-builder-${id}">
      <div class="lego-builder-header">🧱 Susun Blok Kodemu!</div>
      <div class="lego-build-area" id="lego-area-${id}">
        <div class="lego-build-empty" id="lego-empty-${id}">👆 Klik blok di bawah untuk ditambahkan di sini!</div>
      </div>
      <div class="code-reveal-block" style="width:100%">
        <div class="code-header">
          <div class="code-dot red"></div>
          <div class="code-dot yellow"></div>
          <div class="code-dot green"></div>
          <div class="code-label">Hasil Kode Python</div>
        </div>
        <div class="lego-code-output" id="lego-code-${id}">
          <div class="lego-code-empty">✨ Klik/pilih opsi di atas untuk melihat kode Python...</div>
        </div>
      </div>
      <div class="lego-palette">
        <div class="lego-palette-label">🧩 Blok tersedia — klik untuk pakai:</div>
        ${palBtns}
      </div>
    </div>`;
}

function legoAdd(id, type, cfg = {}) {
  playPop();
  const d = LEGO_DEFS[type];
  if (!d) return;
  if (!legoState[id]) legoState[id] = { blocks: [], listItems: [] };
  const st = legoState[id];
  const bid = `${id}-blk-${Date.now()}`;
  st.blocks.push({ type, bid, cfg });

  const emptyEl = document.getElementById(`lego-empty-${id}`);
  if (emptyEl) emptyEl.style.display = 'none';
  const area = document.getElementById(`lego-area-${id}`);
  if (!area) return;
  area.classList.add('has-blocks');

  const el = document.createElement('div');
  el.className = `lego-block ${d.cls} assembled`;
  el.id = bid;

  // Build inner HTML based on block type
  let inner = `${_legoStuds(d.studs)}
    <span class="lego-block-icon">${d.icon}</span>
    <span class="lego-block-label">${d.label}</span>`;

  if (type === 'print') {
    inner += `<div class="lego-slot-wrap"><input class="lego-slot-input" value="${cfg.val||'Halo!'}" placeholder="teks..." ${cfg.ro?'readonly':''} oninput="legoRefresh('${id}')" aria-label="Teks yang dikatakan"/></div>`;
  } else if (type === 'var') {
    inner += `<div class="lego-slot-wrap"><input class="lego-slot-input" value="${cfg.varName||'hewan'}" ${cfg.ro?'readonly':''} oninput="legoRefresh('${id}')" aria-label="Nama kotak" style="width:70px"/></div>
    <span style="font-weight:900;opacity:0.75">=</span>
    <div class="lego-slot-wrap"><input class="lego-slot-input" value="${cfg.varVal||'nilai'}" ${cfg.ro?'readonly':''} oninput="legoRefresh('${id}')" aria-label="Isi kotak"/></div>`;
  } else if (type === 'fndef') {
    inner += `<div class="lego-slot-wrap"><input class="lego-slot-input" value="${cfg.val||'aksi'}" ${cfg.ro?'readonly':''} oninput="legoRefresh('${id}')" aria-label="Nama tombol" style="width:80px"/></div><span style="opacity:0.75;font-weight:800">( )</span>`;
  } else if (type === 'fncall') {
    inner += `<div class="lego-slot-wrap"><input class="lego-slot-input" value="${cfg.val||'aksi'}" ${cfg.ro?'readonly':''} oninput="legoRefresh('${id}')" aria-label="Nama tombol" style="width:80px"/></div><span style="opacity:0.75;font-weight:800">( )</span>`;
  } else if (type === 'loop') {
    const n = cfg.n || 5;
    inner += `<div class="lego-num-wrap">
      <button class="lego-num-btn" onclick="legoNumAdj('${id}','${bid}',-1)" aria-label="Kurangi">−</button>
      <span class="lego-num-val" id="lego-num-${bid}">${n}</span>
      <button class="lego-num-btn" onclick="legoNumAdj('${id}','${bid}',1)" aria-label="Tambah">+</button>
    </div><span style="font-size:13px;opacity:0.75;font-weight:700">kali</span>`;
  } else if (type === 'list') {
    inner += `<span id="lego-list-count-${id}" style="font-size:13px;opacity:0.8;font-weight:700">0 item</span>`;
  }

  inner += `<button class="lego-remove-btn" onclick="legoRemove('${id}','${bid}')" aria-label="Hapus blok">✕</button>`;
  el.innerHTML = inner;
  area.appendChild(el);
  legoRefresh(id);
  setBimoHelper(`Blok ${d.icon} ${d.label} ditambahkan! 🧱`);
}

function legoNumAdj(id, bid, delta) {
  const el = document.getElementById(`lego-num-${bid}`);
  if (!el) return;
  const cur = parseInt(el.textContent) || 5;
  const next = Math.max(1, Math.min(20, cur + delta));
  el.textContent = next;
  playClick();
  legoRefresh(id);
}

function legoRemove(id, bid) {
  playClick();
  const st = legoState[id];
  if (st) st.blocks = st.blocks.filter(b => b.bid !== bid);
  const el = document.getElementById(bid);
  if (el) el.remove();
  const area = document.getElementById(`lego-area-${id}`);
  if (area && !area.querySelector('.lego-block.assembled')) {
    area.classList.remove('has-blocks');
    const emp = document.getElementById(`lego-empty-${id}`);
    if (emp) emp.style.display = '';
  }
  legoRefresh(id);
}

function legoRefresh(id) {
  const codeEl = document.getElementById(`lego-code-${id}`);
  const area   = document.getElementById(`lego-area-${id}`);
  if (!codeEl || !area) return;
  const st = legoState[id] || {};
  const assembled = area.querySelectorAll('.lego-block.assembled');
  const lines = [];

  assembled.forEach(blk => {
    const type = ['print','var','fndef','fncall','loop','list'].find(t => blk.classList.contains(`lego-block-${t}`));
    const inputs = blk.querySelectorAll('.lego-slot-input');
    const numEl  = blk.querySelector('.lego-num-val');
    const v0 = inputs[0] ? inputs[0].value.trim() : '';
    const v1 = inputs[1] ? inputs[1].value.trim() : '';
    const n  = numEl ? parseInt(numEl.textContent) || 5 : 5;

    switch (type) {
      case 'print':
        lines.push(`<span class="code-fn">print</span><span class="code-punc">(</span><span class="code-str">"${escapeHTML(v0||'Halo!')}"</span><span class="code-punc">)</span>`);
        break;
      case 'var': {
        const vName = escapeHTML(v0.replace(/\s+/g, '_') || 'hewan_favorit');
        const vVal  = escapeHTML(v1 || 'Kucing');
        lines.push(`<span class="code-var">${vName}</span> <span class="code-op">=</span> <span class="code-str">"${vVal}"</span>`);
        break;
      }
      case 'fndef': {
        const fnName = escapeHTML(v0.replace(/\s+/g, '_') || 'suara_hewan');
        lines.push(`<span class="code-kw">def</span> <span class="code-fn">${fnName}</span><span class="code-punc">():</span>`);
        lines.push(`    <span class="code-fn">print</span><span class="code-punc">(</span><span class="code-str">"🎵 Suara Hewan!"</span><span class="code-punc">)</span>`);
        break;
      }
      case 'fncall': {
        const fnName = escapeHTML(v0.replace(/\s+/g, '_') || 'suara_hewan');
        lines.push(`<span class="code-fn">${fnName}</span><span class="code-punc">()</span>  <span class="code-cm"># ← pencet tombol!</span>`);
        break;
      }
      case 'loop': {
        lines.push(`<span class="code-kw">for</span> <span class="code-var">i</span> <span class="code-kw">in</span> <span class="code-fn">range</span><span class="code-punc">(</span><span class="code-num">${n}</span><span class="code-punc">):</span>`);
        lines.push(`    <span class="code-fn">lompat</span><span class="code-punc">()</span>  <span class="code-cm"># ${n}× diulang!</span>`);
        break;
      }
      case 'list': {
        const items = st.listItems || [];
        const listVar = escapeHTML(v0.replace(/\s+/g, '_') || 'teman_kereta');
        if (items.length === 0) {
          lines.push(`<span class="code-var">${listVar}</span> <span class="code-op">=</span> <span class="code-punc">[ ]</span>  <span class="code-cm"># belum ada penumpang</span>`);
        } else {
          lines.push(`<span class="code-var">${listVar}</span> <span class="code-op">=</span> <span class="code-punc">[</span>`);
          items.forEach(it => lines.push(`    <span class="code-str">"${escapeHTML(it)}"</span><span class="code-punc">,</span>`));
          lines.push(`<span class="code-punc">]</span>`);
        }
        break;
      }
    }
  });

  codeEl.innerHTML = lines.length
    ? lines.map(l => `<div class="lego-code-line">${l}</div>`).join('')
    : '<div class="lego-code-empty">✨ Klik/pilih opsi di atas untuk melihat kode Python...</div>';
}

// Auto-snap a block from code (pre-fills values)
function legoAutoSnap(id, type, cfg = {}) {
  legoAdd(id, type, cfg);
}
// Update loop count from counter
function legoSyncLoop(id, n) {
  const area = document.getElementById(`lego-area-${id}`);
  if (!area) return;
  const numEl = area.querySelector('.lego-num-val');
  if (numEl) { numEl.textContent = n; legoRefresh(id); }
}
// Add item to list block
function legoListAdd(id, itemName) {
  if (!legoState[id]) legoState[id] = { blocks: [], listItems: [] };
  const st = legoState[id];
  if (!st.listItems.includes(itemName)) {
    st.listItems.push(itemName);
    const countEl = document.getElementById(`lego-list-count-${id}`);
    if (countEl) countEl.textContent = `${st.listItems.length} item`;
    legoRefresh(id);
  }
}

// ============================================================
// INIT
// ============================================================
function init() {
  const hasSave = loadProgress();

  if (STATE.muted) {
    document.getElementById('btn-mute').textContent = '🔇';
  }

  if (hasSave) {
    // Resume progress
    document.getElementById('child-name-input').value = STATE.childName;
    // Still show welcome so they confirm name
    showScreen('screen-welcome');
  } else {
    showScreen('screen-welcome');
  }
}

// Go to map (exposed globally for HTML onclick)
window.goToMap = goToMap;
window.startAdventure = startAdventure;
window.startChapter = startChapter;
window.restartAdventure = restartAdventure;
window.toggleParentTip = toggleParentTip;
window.showBugMonster = showBugMonster;
window.dismissBug = dismissBug;
window.showCertificate = showCertificate;
window.printCertificate = function() { window.print(); };

// Chapter 1
window.ch1Next = ch1Next;
window.ch1SelectGreeting = ch1SelectGreeting;
window.ch1RunCode = ch1RunCode;
window.ch1Complete = ch1Complete;
window.ch1AddSandwichStep = ch1AddSandwichStep;
window.ch1ClearSandwichSlot = ch1ClearSandwichSlot;
window.ch1ResetSandwichGame = ch1ResetSandwichGame;
window.ch1RunSandwichGame = ch1RunSandwichGame;

// Chapter 2
window.ch2Next = ch2Next;
window.ch2SelectAnimal = ch2SelectAnimal;
window.ch2Complete = ch2Complete;

// Chapter 3
window.ch3Next = ch3Next;
window.ch3Complete = ch3Complete;

// Chapter 4
window.ch4Next = ch4Next;
window.ch4Adjust = ch4Adjust;
window.ch4RunJumps = ch4RunJumps;
window.ch4Complete = ch4Complete;

// Chapter 5
window.ch5Next = ch5Next;
window.ch5Complete = ch5Complete;

// Chapter 6
window.ch6Next = ch6Next;
window.ch6Answer = ch6Answer;
window.ch6SetAnimal = ch6SetAnimal;
window.ch6AdjJumps = ch6AdjJumps;
window.ch6UpdatePreview = ch6UpdatePreview;
window.ch6GenerateRobot = ch6GenerateRobot;

// Toddler System
window.setAppMode = setAppMode;
window.loadToddlerGame = loadToddlerGame;
window.toddlerSeqClick = toddlerSeqClick;
window.toddlerDecompClick = toddlerDecompClick;
window.toddlerPatternClick = toddlerPatternClick;
window.toddlerSortClick = toddlerSortClick;
window.toddlerLogicClick = toddlerLogicClick;

// Lego & Fill-in system
window.initFillInCodeBlock = initFillInCodeBlock;
window.fillInPickTile = fillInPickTile;
window.fillInResetBlank = fillInResetBlank;
window.fillInValidateLogic = fillInValidateLogic;
window.legoAdd = legoAdd;
window.legoRemove = legoRemove;
window.legoRefresh = legoRefresh;
window.legoNumAdj = legoNumAdj;
window.legoAutoSnap = legoAutoSnap;

// Start
init();
