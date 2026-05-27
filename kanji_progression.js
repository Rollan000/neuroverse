// ============================================================
// KANJI PROGRESSION ENGINE  — kanji_progression.js
// Neuroverse · KNJ Module
//
// Phases implemented: 2 (theme), 3 (home shell), 4 (MCQ),
//                     5 (context), 6 (writing canvas), 7 (SRS)
// ============================================================

const KNJ_ENGINE = (() => {

  // ── Constants ────────────────────────────────────────────
  const R2_N5_PATH   = 'data/kanji_n5_data.json';
  const LS_PROGRESS  = 'knj_progress';
  const LS_SRS       = 'knj_srs';
  const LS_THEME     = 'knj_theme';
  const SS_N5_CACHE  = 'knj_n5_cache';

  // Stage numbers
  const STAGE_LOCKED  = 0;
  const STAGE_INTRO   = 1;
  const STAGE_RECOG   = 2;   // meaning MCQ
  const STAGE_CONTEXT = 3;   // sentence fill-in
  const STAGE_WRITE   = 4;   // writing canvas
  const STAGE_SRS     = 5;   // in SRS pool
  const STAGE_MASTERED= 6;

  const STAGE_NAMES   = ['locked','intro','recog','context','write','srs','mastered'];

  // SRS mastery threshold (days)
  const MASTERY_DAYS  = 30;
  const MAX_REVIEW_SESSION = 20;

  // ── State ────────────────────────────────────────────────
  let n5Data    = null;    // Array from kanji_n5_data.json
  let progress  = {};      // { char: { ...progressEntry } }
  let _drillState = null;  // current drill session

  // ── Init: call once when KNJ tab is opened ───────────────
  async function init() {
    _loadProgress();
    _initTheme();
    if (!n5Data) await _loadN5Data();
  }

  // ── Theme system (Phase 2) ───────────────────────────────
  function _initTheme() {
    const saved = localStorage.getItem(LS_THEME) || 'dark';
    document.documentElement.dataset.theme = saved;
  }

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'day' ? 'dark' : 'day';
    document.documentElement.dataset.theme = next;
    localStorage.setItem(LS_THEME, next);
    // Update toggle button label if present
    const lbl = document.getElementById('knjThemeLabel');
    const dot = document.getElementById('knjThemeDot');
    if (lbl) lbl.textContent = next === 'day' ? 'Day' : 'Dark';
    if (dot) dot.style.background = next === 'day' ? 'var(--warn)' : 'var(--accent3)';
  }

  // ── Data loading ─────────────────────────────────────────
  async function _loadN5Data() {
    // Try sessionStorage cache first
    try {
      const cached = sessionStorage.getItem(SS_N5_CACHE);
      if (cached) { n5Data = JSON.parse(cached); return; }
    } catch (_) {}

    // Try R2 via global r2Fetch (defined in js.js)
    try {
      const data = await r2Fetch(R2_N5_PATH);
      if (data && Array.isArray(data)) {
        n5Data = data;
        try { sessionStorage.setItem(SS_N5_CACHE, JSON.stringify(data)); } catch (_) {}
        return;
      }
    } catch (e) {
      console.error('[KNJ] R2 fetch failed:', e);
    }

    // Fallback: show error in panel
    n5Data = null;
  }

  // ── Progress storage ─────────────────────────────────────
  function _loadProgress() {
    try {
      progress = JSON.parse(localStorage.getItem(LS_PROGRESS) || '{}');
    } catch (_) {
      progress = {};
    }
  }

  function _saveProgress() {
    try {
      localStorage.setItem(LS_PROGRESS, JSON.stringify(progress));
    } catch (e) {
      // Private browsing / storage full — keep in memory
      console.warn('[KNJ] localStorage unavailable, progress in memory only');
    }
  }

  function getProgress(char) {
    return progress[char] || null;
  }

  function _setProgress(char, data) {
    progress[char] = { ...progress[char], ...data };
    _saveProgress();
  }

  function _getOrCreateProgress(char, track) {
    if (!progress[char]) {
      const entry = n5Data ? n5Data.find(k => k.char === char) : null;
      const order = entry ? n5Data.indexOf(entry) : 999;
      progress[char] = {
        char,
        track: track || 'n5',
        order,
        stage: STAGE_LOCKED,
        streak: 0,
        srs_interval: 0,
        srs_due: null,
        introduced_at: null,
        review_count: 0,
      };
    }
    return progress[char];
  }

  // ── Unlock logic ─────────────────────────────────────────
  function _computeUnlocks() {
    if (!n5Data) return;
    // First 10 are always unlocked (Batch 1 — numbers)
    const firstBatch = n5Data.slice(0, 10);
    firstBatch.forEach(k => {
      const p = _getOrCreateProgress(k.char, 'n5');
      if (p.stage === STAGE_LOCKED) {
        p.stage = STAGE_INTRO;
      }
    });

    // For the rest: unlock when the previous kanji is at stage_recog (2+)
    // and any components are at srs stage (5+)
    for (let i = 10; i < n5Data.length; i++) {
      const k = n5Data[i];
      const p = _getOrCreateProgress(k.char, 'n5');
      if (p.stage !== STAGE_LOCKED) continue;

      // Simple sequential unlock: previous kanji must be stage 2+
      const prev = n5Data[i - 1];
      const prevP = progress[prev.char];
      if (prevP && prevP.stage >= STAGE_RECOG) {
        p.stage = STAGE_INTRO;
      }
    }
    _saveProgress();
  }

  // ── Stats ────────────────────────────────────────────────
  function _getStats() {
    const all = Object.values(progress);
    const introduced = all.filter(p => p.stage >= STAGE_INTRO).length;
    const inSRS      = all.filter(p => p.stage === STAGE_SRS).length;
    const mastered   = all.filter(p => p.stage === STAGE_MASTERED).length;
    const now        = Date.now();
    const due        = all.filter(p => p.stage >= STAGE_SRS && p.srs_due && p.srs_due <= now).length;
    return { introduced, inSRS, mastered, due };
  }

  // ── SRS Engine (Phase 7) ─────────────────────────────────
  function _computeNextInterval(currentInterval, grade) {
    const easeMap = [0, 1.2, 2.5, 4.0];
    if (grade === 0) return 1;
    if (currentInterval === 0) {
      return grade === 3 ? 4 : grade === 2 ? 3 : 1;
    }
    return Math.round(currentInterval * easeMap[grade]);
  }

  function scheduleReview(char, grade) {
    const p = _getOrCreateProgress(char, 'n5');
    const nextInterval = _computeNextInterval(p.srs_interval || 0, grade);
    const due = Date.now() + (nextInterval * 86400000);
    const reviewCount = (p.review_count || 0) + 1;
    _setProgress(char, {
      srs_interval: nextInterval,
      srs_due: due,
      review_count: reviewCount,
      stage: nextInterval >= MASTERY_DAYS ? STAGE_MASTERED : STAGE_SRS,
    });
  }

  function buildReviewSession() {
    const now = Date.now();
    const due = Object.values(progress)
      .filter(p => p.stage >= STAGE_SRS && p.srs_due && p.srs_due <= now)
      .sort((a, b) => a.srs_due - b.srs_due);
    return due.slice(0, MAX_REVIEW_SESSION);
  }

  function _reviewDrillType(reviewCount) {
    const mod = (reviewCount % 3);
    if (mod === 0) return 'mcq_meaning';   // kanji shown, pick meaning
    if (mod === 1) return 'mcq_reverse';   // meaning shown, pick kanji
    return 'write';                        // meaning shown, draw
  }

  // ── Stage advancement ────────────────────────────────────
  function _advanceStage(char) {
    const p = _getOrCreateProgress(char, 'n5');
    if (p.stage < STAGE_SRS) {
      p.stage += 1;
      if (p.stage === STAGE_SRS) {
        // First time entering SRS: schedule first review in 1 day
        p.srs_interval = 1;
        p.srs_due = Date.now() + 86400000;
      }
      _saveProgress();
      _computeUnlocks();
    }
  }

  // ── Distractor selection ─────────────────────────────────
  function _getDistractors(charData, count = 3) {
    // Prefer chars already introduced, fall back to hardcoded distractors
    const hardcoded = charData.distractors || [];
    const introduced = Object.values(progress)
      .filter(p => p.stage >= STAGE_INTRO && p.char !== charData.char)
      .map(p => p.char);

    const pool = [...new Set([...hardcoded, ...introduced])].filter(c => c !== charData.char);
    // Shuffle and pick
    const shuffled = pool.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // ── HTML helpers ─────────────────────────────────────────
  function _el(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'style' && typeof v === 'object') {
        Object.assign(el.style, v);
      } else if (k.startsWith('on') && typeof v === 'function') {
        el.addEventListener(k.slice(2).toLowerCase(), v);
      } else {
        el.setAttribute(k, v);
      }
    });
    children.forEach(c => {
      if (c === null || c === undefined) return;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return el;
  }

  function _h(html) {
    const d = document.createElement('div');
    d.innerHTML = html;
    return d;
  }

  function _stageClass(stage) {
    const map = {
      [STAGE_LOCKED]:   'knj-locked',
      [STAGE_INTRO]:    'knj-intro',
      [STAGE_RECOG]:    'knj-recog',
      [STAGE_CONTEXT]:  'knj-context',
      [STAGE_WRITE]:    'knj-context',   // same colour as context
      [STAGE_SRS]:      'knj-srs',
      [STAGE_MASTERED]: 'knj-mastered',
    };
    return map[stage] || 'knj-locked';
  }

  function _stageLabelText(stage, p) {
    if (stage === STAGE_LOCKED)   return 'locked';
    if (stage === STAGE_INTRO)    return 'intro';
    if (stage === STAGE_RECOG)    return 'recog';
    if (stage === STAGE_CONTEXT)  return 'context';
    if (stage === STAGE_WRITE)    return 'write';
    if (stage === STAGE_MASTERED) return 'mastered';
    if (stage === STAGE_SRS && p && p.srs_due) {
      const days = Math.ceil((p.srs_due - Date.now()) / 86400000);
      if (days <= 0) return 'due now';
      return `SRS ${days}d`;
    }
    return 'SRS';
  }

  // ── Render helpers ───────────────────────────────────────
  function _renderEyebrow(text, badge = null) {
    return `<div class="knj-eyebrow">${text}${badge ? `<span class="knj-track-pill knj-${badge}">${badge.toUpperCase()}</span>` : ''}</div>`;
  }

  function _renderKanjiGrid(kanji, onCellClick) {
    const wrap = document.createElement('div');
    wrap.className = 'knj-grid';

    kanji.forEach(k => {
      const p = progress[k.char] || { stage: STAGE_LOCKED };
      const stageClass = _stageClass(p.stage);
      const label = _stageLabelText(p.stage, p);
      const isLocked = p.stage === STAGE_LOCKED;

      const cell = document.createElement('div');
      cell.className = `knj-cell ${stageClass}`;
      cell.dataset.char = k.char;
      cell.innerHTML = `
        <span class="knj-cell-char">${k.char}</span>
        <span class="knj-cell-label">${label}</span>
        ${isLocked ? '<span class="knj-cell-lock">🔒</span>' : ''}
      `;
      if (!isLocked && onCellClick) {
        cell.addEventListener('click', () => onCellClick(k, p));
      } else if (isLocked) {
        cell.addEventListener('click', () => _showTooltip(cell, 'Keep studying to unlock'));
      }
      wrap.appendChild(cell);
    });

    return wrap;
  }

  function _flashCellAdvance(char) {
    const cell = document.querySelector(`.knj-cell[data-char="${char}"]`);
    if (!cell) return;
    cell.classList.add('knj-stage-advance');
    setTimeout(() => cell.classList.remove('knj-stage-advance'), 700);
  }

  function _showTooltip(anchor, msg) {
    let tip = document.getElementById('knjTooltip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'knjTooltip';
      tip.style.cssText = 'position:fixed;z-index:3000;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:7px 12px;font-size:12px;color:var(--text);pointer-events:none;animation:slideIn .15s ease;font-family:Syne,sans-serif;max-width:180px;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,.35)';
      document.body.appendChild(tip);
    }
    tip.textContent = msg;
    const r = anchor.getBoundingClientRect();
    tip.style.left = (r.left + r.width/2 - 90) + 'px';
    tip.style.top  = (r.bottom + 6) + 'px';
    tip.style.opacity = '1';
    clearTimeout(tip._hide);
    tip._hide = setTimeout(() => { tip.style.opacity = '0'; setTimeout(() => tip.remove(), 200); }, 1800);
  }

  // ── SCREEN: Progression Home (Phase 3) ───────────────────
  function renderHome(container) {
    if (!n5Data) {
      _renderDataError(container);
      return;
    }
    _computeUnlocks();
    const stats = _getStats();
    const reviewItems = buildReviewSession();

    container.innerHTML = '';

    // Header + theme toggle
    const header = _h(`
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div>
          <div style="font-size:20px;font-weight:800;color:var(--text)">Kanji</div>
          <div style="font-family:'Space Mono',monospace;font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-top:1px">Progression · Two tracks</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          ${stats.due > 0 ? `<span class="knj-due-badge">${stats.due} due</span>` : ''}
          <button class="knj-theme-toggle" onclick="KNJ_ENGINE.toggleTheme()">
            <div class="knj-theme-dot" id="knjThemeDot"></div>
            <span id="knjThemeLabel">${document.documentElement.dataset.theme === 'day' ? 'Day' : 'Dark'}</span>
          </button>
        </div>
      </div>
    `);
    container.appendChild(header);

    // Stats bar
    const statsEl = _h(`
      <div class="knj-stat-grid">
        <div class="knj-stat-card"><span class="knj-stat-val">${stats.introduced}</span><span class="knj-stat-label">Introduced</span></div>
        <div class="knj-stat-card"><span class="knj-stat-val">${stats.inSRS}</span><span class="knj-stat-label">In SRS</span></div>
        <div class="knj-stat-card"><span class="knj-stat-val">${stats.mastered}</span><span class="knj-stat-label">Mastered</span></div>
        <div class="knj-stat-card"><span class="knj-stat-val" style="color:${stats.due > 0 ? 'var(--wrong)' : 'var(--text)'}">${stats.due}</span><span class="knj-stat-label">Due</span></div>
      </div>
    `);
    container.appendChild(statsEl);

    // Review CTA (only if reviews due)
    if (reviewItems.length > 0) {
      const cta = _h(`
        <div class="knj-review-cta">
          <div>
            <div class="knj-cta-title">Reviews ready</div>
            <div class="knj-cta-sub">${reviewItems.length} kanji · MCQ + writing mix</div>
          </div>
          <button class="btn btn-primary" id="knjStartReviewBtn" style="white-space:nowrap">Start reviews →</button>
        </div>
      `);
      container.appendChild(cta);
      cta.querySelector('#knjStartReviewBtn').addEventListener('click', () => startReviewSession(container));
    }

    // N5 track grid
    const n5Section = document.createElement('div');
    n5Section.style.marginBottom = '24px';
    const n5Count = Object.values(progress).filter(p => p.stage >= STAGE_INTRO).length;
    n5Section.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div style="font-size:13px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:7px">
          <span class="knj-track-pill knj-pill-n5">N5 core</span> Foundation path
        </div>
        <div style="font-family:'Space Mono',monospace;font-size:11px;color:var(--muted)">${n5Count} / ${n5Data.length}</div>
      </div>
    `;
    n5Section.appendChild(_renderKanjiGrid(n5Data, (k, p) => _onGridCellClick(k, p, container)));
    container.appendChild(n5Section);

    // Legend
    const legend = _h(`
      <div class="knj-legend">
        <div class="knj-leg-item"><div class="knj-leg-swatch" style="background:var(--stage-mastered-bg,rgba(0,255,157,.08));border-color:var(--stage-mastered-border,rgba(0,255,157,.3))"></div>Mastered</div>
        <div class="knj-leg-item"><div class="knj-leg-swatch" style="background:var(--stage-srs-bg,rgba(109,120,255,.1));border-color:var(--stage-srs-border,rgba(109,120,255,.35))"></div>In SRS</div>
        <div class="knj-leg-item"><div class="knj-leg-swatch" style="background:var(--stage-context-bg,rgba(154,124,255,.1));border-color:var(--stage-context-border,rgba(154,124,255,.3))"></div>Context / Write</div>
        <div class="knj-leg-item"><div class="knj-leg-swatch" style="background:var(--stage-recog-bg,var(--surface2));border-color:var(--stage-recog-border,var(--border))"></div>Recognition</div>
        <div class="knj-leg-item"><div class="knj-leg-swatch" style="background:var(--stage-intro-bg,var(--surface));border-color:var(--stage-intro-border,var(--accent3))"></div>Intro (current)</div>
        <div class="knj-leg-item"><div class="knj-leg-swatch" style="background:var(--stage-locked-bg,var(--surface2));border-color:var(--stage-locked-border,var(--border));opacity:.4"></div>Locked</div>
      </div>
    `);
    container.appendChild(legend);
  }

  function _onGridCellClick(k, p, container) {
    if (p.stage === STAGE_MASTERED) {
      _renderMasteredModal(k);
      return;
    }
    if (p.stage === STAGE_INTRO) {
      renderIntroCard(k.char, container);
      return;
    }
    if (p.stage >= STAGE_RECOG && p.stage <= STAGE_WRITE) {
      renderDrillCard(k.char, container);
      return;
    }
    if (p.stage === STAGE_SRS) {
      renderDrillCard(k.char, container);
      return;
    }
  }

  // ── SCREEN: Intro Card (Phase 3) ─────────────────────────
  function renderIntroCard(char, container) {
    const k = n5Data.find(d => d.char === char);
    if (!k) return;
    const p = _getOrCreateProgress(char, 'n5');
    if (p.introduced_at === null) {
      p.introduced_at = Date.now();
      _saveProgress();
    }

    // Highlight target kanji in sentence
    function highlightSentence(jp, char) {
      return jp.replace(new RegExp(char, 'g'), `<span class="knj-target">${char}</span>`);
    }

    const sentenceHTML = (k.sentences || []).map((s, i) => `
      <div class="knj-sentence-block" style="${i > 0 ? 'margin-top:10px' : ''}">
        <div class="knj-jp-sentence">${highlightSentence(s.jp, char)}</div>
        <div class="knj-en-sentence">${s.en}<span class="knj-source-tag">${s.source}</span></div>
      </div>
    `).join('');

    const relatedHTML = (k.related || []).slice(0, 3).map(r => {
      const rp = progress[r.char];
      const status = rp ? STAGE_NAMES[rp.stage] : 'not introduced';
      return `<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border)">
        <span style="font-family:'Noto Sans JP',sans-serif;font-size:24px;font-weight:700;width:32px;text-align:center">${r.char}</span>
        <span style="flex:1;font-size:12px;color:var(--text)">${r.meaning}</span>
        <span style="font-family:'Space Mono',monospace;font-size:9px;color:var(--muted);text-transform:uppercase">${status}</span>
      </div>`;
    }).join('');

    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
        <button class="btn btn-secondary" id="knjBackBtn" style="font-size:12px;padding:7px 12px">← Back</button>
        <div style="flex:1">
          <div style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--muted);text-transform:uppercase">INTRO CARD</div>
        </div>
        <span class="knj-track-pill knj-pill-n5">N5</span>
      </div>

      <div class="knj-intro-layout">
        <!-- Main -->
        <div class="card" style="padding:20px">
          <div class="knj-eyebrow">Stage 1 · Introduction <span class="knj-jlpt-badge">${k.jlpt}</span></div>
          <div class="knj-hero-char">${k.char}</div>
          <div class="knj-meaning-en">${k.meaning}</div>
          <div class="knj-reading-row">
            ${k.on && k.on.length ? `<div class="knj-reading-group"><div class="knj-reading-label">On</div><div class="knj-reading-val">${k.on.join('、')}</div></div>` : ''}
            ${k.kun && k.kun.length ? `<div class="knj-reading-group"><div class="knj-reading-label">Kun</div><div class="knj-reading-val">${k.kun.slice(0,3).join('、')}</div></div>` : ''}
            <div class="knj-reading-group"><div class="knj-reading-label">Strokes</div><div class="knj-reading-val">${k.strokes}</div></div>
          </div>
          <hr style="border:none;border-top:1px solid var(--border);margin:14px 0">
          <div class="knj-sub-label">Memory Hook</div>
          <div class="knj-mnemonic-box">${k.mnemonic}</div>
          <div class="knj-sub-label">Example sentences</div>
          ${sentenceHTML}
          <div class="btn-row" style="margin-top:18px">
            <button class="btn btn-primary" id="knjBeginDrills" style="flex:1">Begin drills →</button>
          </div>
        </div>
        <!-- Sidebar -->
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="card" style="padding:16px">
            <div class="knj-sub-label">Radical</div>
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0">
              <span style="font-family:'Noto Sans JP',sans-serif;font-size:28px;font-weight:700">${k.radical}</span>
              <span style="font-size:12px;color:var(--muted)">${k.radical_meaning}</span>
            </div>
            ${k.compounds && k.compounds.length ? `
            <hr style="border:none;border-top:1px solid var(--border);margin:10px 0">
            <div class="knj-sub-label">Compounds</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              ${k.compounds.map(c => `<span style="font-family:'Noto Sans JP',sans-serif;font-size:14px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:3px 8px">${c}</span>`).join('')}
            </div>` : ''}
          </div>
          ${relatedHTML ? `
          <div class="card" style="padding:16px">
            <div class="knj-sub-label">Related kanji</div>
            ${relatedHTML}
          </div>` : ''}
        </div>
      </div>
    `;

    container.querySelector('#knjBackBtn').addEventListener('click', () => renderHome(container));
    container.querySelector('#knjBeginDrills').addEventListener('click', () => {
      _advanceStage(char);
      renderDrillCard(char, container);
    });
  }

  // ── SCREEN: Drill card dispatcher ────────────────────────
  function renderDrillCard(char, container) {
    const p = _getOrCreateProgress(char, 'n5');
    if (p.stage === STAGE_RECOG)   { renderMCQDrill(char, container, false); return; }
    if (p.stage === STAGE_CONTEXT) { renderContextDrill(char, container); return; }
    if (p.stage === STAGE_WRITE)   { renderWriteDrill(char, container); return; }
    if (p.stage === STAGE_SRS)     { renderSRSDrill(char, container); return; }
    renderHome(container);
  }

  // ── SCREEN: MCQ Recognition (Phase 4) ────────────────────
  function renderMCQDrill(char, container, isReverse = false, onGrade = null) {
    const k = n5Data.find(d => d.char === char);
    if (!k) return;
    const p = _getOrCreateProgress(char, 'n5');

    const distractors = _getDistractors(k, 3);
    const wrongMeanings = distractors.map(c => {
      const kd = n5Data.find(d => d.char === c);
      return kd ? kd.meaning : c;
    }).filter(Boolean);

    // Build options: [correct, ...3 wrong], shuffled
    let options;
    if (isReverse) {
      // Reverse: meaning shown, pick kanji
      const wrongChars = distractors;
      options = _shuffle([{ value: char, correct: true }, ...wrongChars.map(c => ({ value: c, correct: false }))]);
    } else {
      // Normal: kanji shown, pick meaning
      options = _shuffle([{ value: k.meaning, correct: true }, ...wrongMeanings.map(m => ({ value: m, correct: false }))]);
    }

    const keys = ['A','B','C','D'];
    const optHTML = options.map((opt, i) => `
      <button class="knj-mcq-opt" data-idx="${i}" data-correct="${opt.correct}">
        <div class="knj-mcq-opt-key">${keys[i]}</div>
        <div class="knj-mcq-opt-text">${isReverse
          ? `<span style="font-family:'Noto Sans JP',sans-serif;font-size:32px;font-weight:900">${opt.value}</span>`
          : opt.value}</div>
      </button>
    `).join('');

    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
        <button class="btn btn-secondary" id="knjBackBtn" style="font-size:12px;padding:7px 12px">← Back</button>
        <div style="flex:1">
          <div style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--muted);text-transform:uppercase">
            ${isReverse ? 'REVERSE MCQ' : 'RECOGNITION MCQ'} · Stage ${p.stage}
          </div>
        </div>
      </div>

      <div class="card" style="text-align:center">
        <div style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;margin-bottom:8px">
          ${isReverse ? 'Select the kanji that means:' : 'What does this kanji mean?'}
        </div>

        ${isReverse
          ? `<div style="font-size:24px;font-weight:800;color:var(--text);padding:16px 0 20px">${k.meaning}</div>`
          : `<div style="font-family:'Noto Sans JP',sans-serif;font-size:96px;font-weight:900;line-height:1;padding:12px 0 20px">${char}</div>`
        }

        <div class="knj-mcq-grid" id="knjMcqGrid">${optHTML}</div>
        <div id="knjMcqFeedback" style="display:none;margin-top:14px"></div>
      </div>
    `;

    container.querySelector('#knjBackBtn').addEventListener('click', () => renderHome(container));

    // Bind option clicks + keyboard
    const grid = container.querySelector('#knjMcqGrid');
    const feedback = container.querySelector('#knjMcqFeedback');
    let answered = false;

    function handleAnswer(optEl) {
      if (answered) return;
      answered = true;
      const isCorrect = optEl.dataset.correct === 'true';

      // Mark all options
      grid.querySelectorAll('.knj-mcq-opt').forEach(o => {
        if (o.dataset.correct === 'true') o.classList.add('knj-opt-correct');
        else if (o === optEl && !isCorrect) o.classList.add('knj-opt-wrong');
        o.disabled = true;
      });

      // Feedback + grade buttons
      feedback.style.display = '';
      feedback.innerHTML = `
        <div style="font-size:13px;color:${isCorrect ? 'var(--correct)' : 'var(--wrong)'};margin-bottom:12px;font-weight:700">
          ${isCorrect ? '✓ Correct' : '✗ Incorrect — the answer was: ' + (isReverse ? char : k.meaning)}
        </div>
        <div class="knj-grade-row">
          <button class="knj-grade-btn knj-grade-again" data-grade="0">Again<span class="knj-grade-sub">&lt;1d</span></button>
          <button class="knj-grade-btn knj-grade-hard"  data-grade="1">Hard<span class="knj-grade-sub">~3d</span></button>
          <button class="knj-grade-btn knj-grade-good"  data-grade="2">Good<span class="knj-grade-sub">~7d</span></button>
          <button class="knj-grade-btn knj-grade-easy"  data-grade="3">Easy<span class="knj-grade-sub">~14d</span></button>
        </div>
      `;

      feedback.querySelectorAll('[data-grade]').forEach(btn => {
        btn.addEventListener('click', () => {
          const grade = parseInt(btn.dataset.grade);
          if (onGrade) {
            onGrade(char, grade, isCorrect);
          } else {
            _handleMCQGrade(char, grade, isCorrect, container);
          }
        });
      });
    }

    grid.querySelectorAll('.knj-mcq-opt').forEach(opt => {
      opt.addEventListener('click', () => handleAnswer(opt));
    });

    // Keyboard shortcuts 1-4 or A-D
    const keyHandler = (e) => {
      if (answered) return;
      const idx = ['1','2','3','4'].indexOf(e.key) > -1 ? parseInt(e.key) - 1
                : ['a','b','c','d'].indexOf(e.key.toLowerCase()) > -1 ? ['a','b','c','d'].indexOf(e.key.toLowerCase())
                : -1;
      if (idx >= 0) {
        const opts = grid.querySelectorAll('.knj-mcq-opt');
        if (opts[idx]) handleAnswer(opts[idx]);
      }
    };
    document.addEventListener('keydown', keyHandler);
    // Cleanup listener when navigating away
    const backBtn = container.querySelector('#knjBackBtn');
    if (backBtn) backBtn.addEventListener('click', () => document.removeEventListener('keydown', keyHandler));
  }

  function _handleMCQGrade(char, grade, isCorrect, container) {
    const p = _getOrCreateProgress(char, 'n5');
    if (p.stage === STAGE_RECOG) {
      if (grade >= 2) { // Good or Easy advances
        _advanceStage(char);
        _flashCellAdvance(char);
        renderContextDrill(char, container);
      } else {
        // Again/Hard: stay at recog, re-drill
        renderMCQDrill(char, container, false);
      }
    } else {
      // In SRS — schedule review
      scheduleReview(char, grade);
      renderHome(container);
    }
  }

  // ── SCREEN: Context Stage (Phase 5) ──────────────────────
  function renderContextDrill(char, container) {
    const k = n5Data.find(d => d.char === char);
    if (!k) return;
    const p = _getOrCreateProgress(char, 'n5');

    // Pick a random sentence
    const sentences = k.sentences || [];
    const s = sentences[Math.floor(Math.random() * sentences.length)];

    // Replace target kanji with blank in sentence
    const blankedJP = s.jp.replace(
      new RegExp(char, 'g'),
      `<span class="knj-context-blank"></span>`
    );

    // Build options
    const distractors = _getDistractors(k, 3);
    const options = _shuffle([{ value: char, correct: true }, ...distractors.map(c => ({ value: c, correct: false }))]);

    const optHTML = options.map((opt, i) => `
      <button class="knj-context-opt" data-idx="${i}" data-correct="${opt.correct}">${opt.value}</button>
    `).join('');

    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
        <button class="btn btn-secondary" id="knjBackBtn" style="font-size:12px;padding:7px 12px">← Back</button>
        <div style="flex:1">
          <div style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--muted);text-transform:uppercase">
            SENTENCE CONTEXT · Stage ${p.stage}
          </div>
        </div>
      </div>

      <div class="card">
        <div style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;margin-bottom:10px">Fill in the blank — no furigana allowed</div>
        <div class="knj-context-block">
          <div class="knj-context-jp">${blankedJP}</div>
          <div class="knj-en-sentence" style="margin-top:8px">${s.en}<span class="knj-source-tag">${s.source}</span></div>
        </div>
        <div class="knj-sub-label">Choose the missing kanji</div>
        <div class="knj-context-mc" id="knjContextGrid">${optHTML}</div>
        <div id="knjContextFeedback" style="display:none;margin-top:14px"></div>
      </div>
    `;

    container.querySelector('#knjBackBtn').addEventListener('click', () => renderHome(container));

    const grid = container.querySelector('#knjContextGrid');
    const feedback = container.querySelector('#knjContextFeedback');
    let answered = false;

    function handleContextAnswer(optEl) {
      if (answered) return;
      answered = true;
      const isCorrect = optEl.dataset.correct === 'true';

      grid.querySelectorAll('.knj-context-opt').forEach(o => {
        if (o.dataset.correct === 'true') o.classList.add('knj-opt-correct');
        else if (o === optEl && !isCorrect) o.classList.add('knj-opt-wrong');
        o.disabled = true;
      });

      feedback.style.display = '';
      feedback.innerHTML = `
        <div style="font-size:13px;color:${isCorrect ? 'var(--correct)' : 'var(--wrong)'};margin-bottom:12px;font-weight:700">
          ${isCorrect ? '✓ Correct' : '✗ The missing kanji was: ' + char}
        </div>
        <div class="knj-grade-row">
          <button class="knj-grade-btn knj-grade-again" data-grade="0">Again<span class="knj-grade-sub">&lt;1d</span></button>
          <button class="knj-grade-btn knj-grade-hard"  data-grade="1">Hard<span class="knj-grade-sub">~3d</span></button>
          <button class="knj-grade-btn knj-grade-good"  data-grade="2">Good<span class="knj-grade-sub">~7d</span></button>
          <button class="knj-grade-btn knj-grade-easy"  data-grade="3">Easy<span class="knj-grade-sub">~14d</span></button>
        </div>
      `;

      feedback.querySelectorAll('[data-grade]').forEach(btn => {
        btn.addEventListener('click', () => {
          const grade = parseInt(btn.dataset.grade);
          if (grade >= 2) {
            _advanceStage(char);
            _flashCellAdvance(char);
            renderWriteDrill(char, container);
          } else {
            renderContextDrill(char, container);
          }
        });
      });
    }

    grid.querySelectorAll('.knj-context-opt').forEach(opt => {
      opt.addEventListener('click', () => handleContextAnswer(opt));
    });
  }

  // ── SCREEN: Writing Canvas (Phase 6) ─────────────────────
  function renderWriteDrill(char, container, onGrade = null) {
    const k = n5Data.find(d => d.char === char);
    if (!k) return;
    const p = _getOrCreateProgress(char, 'n5');

    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
        <button class="btn btn-secondary" id="knjBackBtn" style="font-size:12px;padding:7px 12px">← Back</button>
        <div style="flex:1">
          <div style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--muted);text-transform:uppercase">
            WRITING RECALL · Stage ${p.stage}
          </div>
        </div>
        <span style="font-family:'Space Mono',monospace;font-size:9px;color:var(--warn);background:rgba(255,211,42,.1);border:1px solid rgba(255,211,42,.25);border-radius:4px;padding:2px 7px">NO HINTS</span>
      </div>

      <div class="card">
        <div style="font-size:28px;font-weight:800;color:var(--text);text-align:center;margin-bottom:20px">${k.meaning}</div>
        <div style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;text-align:center;margin-bottom:12px">Write the kanji from memory</div>

        <div style="display:flex;flex-direction:column;align-items:center;gap:10px">
          <div class="knj-canvas-wrap" id="knjCanvasWrap" style="width:200px;height:200px">
            <div class="knj-canvas-model" id="knjCanvasModel">${char}</div>
            <canvas id="knjCanvas" width="200" height="200" style="position:absolute;inset:0;touch-action:none"></canvas>
          </div>
          <div class="knj-canvas-hint">Draw in the box · tap Reveal when done</div>

          <div style="display:flex;gap:8px;width:100%;max-width:240px">
            <button class="btn btn-secondary" id="knjClearCanvas" style="flex:1">Clear</button>
            <button class="btn btn-primary" id="knjRevealBtn" style="flex:1">Reveal →</button>
          </div>
        </div>

        <div id="knjWriteReveal" style="display:none;margin-top:16px">
          <div style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Self-grade</div>
          <div class="knj-grade-row" id="knjWriteGradeRow">
            <button class="knj-grade-btn knj-grade-again" data-grade="0">Again<span class="knj-grade-sub">retry</span></button>
            <button class="knj-grade-btn knj-grade-hard"  data-grade="1">Hard<span class="knj-grade-sub">~3d</span></button>
            <button class="knj-grade-btn knj-grade-good"  data-grade="2">Good<span class="knj-grade-sub">→ SRS</span></button>
            <button class="knj-grade-btn knj-grade-easy"  data-grade="3">Easy<span class="knj-grade-sub">→ SRS</span></button>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#knjBackBtn').addEventListener('click', () => renderHome(container));

    // Canvas setup
    const canvas  = container.querySelector('#knjCanvas');
    const ctx     = canvas.getContext('2d');
    const model   = container.querySelector('#knjCanvasModel');
    let drawing   = false;

    function getTextColor() {
      return getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#f1f1f4';
    }

    canvas.addEventListener('pointerdown', (e) => {
      drawing = true;
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) * (200 / r.width);
      const y = (e.clientY - r.top)  * (200 / r.height);
      ctx.beginPath();
      ctx.moveTo(x, y);
      e.preventDefault();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!drawing) return;
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) * (200 / r.width);
      const y = (e.clientY - r.top)  * (200 / r.height);
      ctx.lineTo(x, y);
      ctx.strokeStyle = getTextColor();
      ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.stroke();
      e.preventDefault();
    });
    canvas.addEventListener('pointerup', () => { drawing = false; });
    canvas.addEventListener('pointerleave', () => { drawing = false; });

    // Clear button
    container.querySelector('#knjClearCanvas').addEventListener('click', () => {
      ctx.clearRect(0, 0, 200, 200);
      model.style.opacity = '0.08';
    });

    // Reveal button
    container.querySelector('#knjRevealBtn').addEventListener('click', () => {
      model.style.opacity = '0.55';
      container.querySelector('#knjWriteReveal').style.display = '';
      container.querySelector('#knjRevealBtn').style.display = 'none';
    });

    // Grade buttons
    container.querySelector('#knjWriteGradeRow').querySelectorAll('[data-grade]').forEach(btn => {
      btn.addEventListener('click', () => {
        const grade = parseInt(btn.dataset.grade);
        if (onGrade) {
          onGrade(char, grade);
        } else {
          _handleWriteGrade(char, grade, container);
        }
      });
    });

    // Space to reveal (keyboard)
    const spaceHandler = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        const revealBtn = container.querySelector('#knjRevealBtn');
        if (revealBtn && revealBtn.style.display !== 'none') revealBtn.click();
      }
      if (container.querySelector('#knjWriteReveal').style.display !== 'none') {
        const gradeMap = { 'a': 0, 'h': 1, 'g': 2, 'e': 3 };
        const grade = gradeMap[e.key.toLowerCase()];
        if (grade !== undefined) {
          const btns = container.querySelectorAll('#knjWriteGradeRow [data-grade]');
          btns.forEach(b => { if (parseInt(b.dataset.grade) === grade) b.click(); });
        }
      }
    };
    document.addEventListener('keydown', spaceHandler);
    container.querySelector('#knjBackBtn').addEventListener('click', () => document.removeEventListener('keydown', spaceHandler));
  }

  function _handleWriteGrade(char, grade, container) {
    const p = _getOrCreateProgress(char, 'n5');
    if (p.stage === STAGE_WRITE) {
      if (grade >= 1) { // Hard/Good/Easy advances to SRS
        _advanceStage(char);
        _flashCellAdvance(char);
        scheduleReview(char, grade);
        _showStageCelebration(char, 'In SRS now! 🎉', container);
      } else {
        // Again: stay at write stage
        renderWriteDrill(char, container);
      }
    } else {
      scheduleReview(char, grade);
      renderHome(container);
    }
  }

  function _showStageCelebration(char, msg, container) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--surface);border:1px solid var(--correct);border-radius:10px;padding:12px 20px;font-weight:700;font-size:14px;color:var(--correct);z-index:2000;animation:slideIn .3s ease;box-shadow:0 4px 20px rgba(0,255,157,.15)';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity .4s';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 450);
    }, 2000);
    setTimeout(() => renderHome(container), 2400);
  }

  // ── SCREEN: SRS Drill ────────────────────────────────────
  function renderSRSDrill(char, container) {
    const k = n5Data.find(d => d.char === char);
    if (!k) return;
    const p = _getOrCreateProgress(char, 'n5');
    const drillType = _reviewDrillType(p.review_count || 0);

    const onGrade = (char, grade, isCorrect) => {
      scheduleReview(char, grade);
      renderHome(container);
    };

    if (drillType === 'mcq_meaning') {
      renderMCQDrill(char, container, false, onGrade);
    } else if (drillType === 'mcq_reverse') {
      renderMCQDrill(char, container, true, onGrade);
    } else {
      renderWriteDrill(char, container, (char, grade) => {
        scheduleReview(char, grade);
        renderHome(container);
      });
    }
  }

  // ── SCREEN: Review Session (Phase 7) ─────────────────────
  function startReviewSession(container) {
    const items = buildReviewSession();
    if (items.length === 0) { renderHome(container); return; }

    _drillState = { items, idx: 0, results: [] };
    _nextReviewItem(container);
  }

  function _nextReviewItem(container) {
    const ds = _drillState;
    if (!ds || ds.idx >= ds.items.length) {
      _showReviewSummary(container);
      return;
    }

    const p = ds.items[ds.idx];
    const k = n5Data.find(d => d.char === p.char);
    if (!k) { ds.idx++; _nextReviewItem(container); return; }

    const drillType = _reviewDrillType(p.review_count || 0);
    const char = p.char;

    const onGrade = (c, grade, isCorrect) => {
      scheduleReview(c, grade);
      ds.results.push({ char: c, grade, drillType });
      ds.idx++;
      _nextReviewItem(container);
    };

    // Progress header
    function addProgressHeader(inner) {
      const header = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
          <div style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;flex:1">
            REVIEW SESSION · ${ds.idx + 1} / ${ds.items.length}
          </div>
          <div style="height:4px;background:var(--border);border-radius:2px;width:120px;overflow:hidden">
            <div style="height:100%;background:var(--accent3);border-radius:2px;width:${Math.round((ds.idx/ds.items.length)*100)}%;transition:width .3s"></div>
          </div>
          <button class="btn btn-secondary" onclick="KNJ_ENGINE.renderHome(document.getElementById('knjModeInner'))" style="font-size:11px;padding:5px 10px">✕ Exit</button>
        </div>
      `;
      container.innerHTML = header + inner;
    }

    // Temporarily inject header before rendering drill
    container.innerHTML = '';
    if (drillType === 'mcq_meaning') {
      renderMCQDrill(char, container, false, onGrade);
    } else if (drillType === 'mcq_reverse') {
      renderMCQDrill(char, container, true, onGrade);
    } else {
      renderWriteDrill(char, container, onGrade);
    }

    // Prepend session progress bar
    const progressWrap = document.createElement('div');
    progressWrap.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:14px';
    progressWrap.innerHTML = `
      <div style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;flex:1">
        REVIEW SESSION · ${ds.idx + 1} / ${ds.items.length}
      </div>
      <div style="height:4px;background:var(--border);border-radius:2px;width:100px;overflow:hidden">
        <div style="height:100%;background:var(--accent3);border-radius:2px;width:${Math.round((ds.idx/ds.items.length)*100)}%;transition:width .3s"></div>
      </div>
    `;
    container.insertBefore(progressWrap, container.firstChild);
  }

  function _showReviewSummary(container) {
    const ds = _drillState;
    const results = ds ? ds.results : [];
    const again = results.filter(r => r.grade === 0).length;
    const hard  = results.filter(r => r.grade === 1).length;
    const good  = results.filter(r => r.grade === 2).length;
    const easy  = results.filter(r => r.grade === 3).length;

    container.innerHTML = `
      <div class="card" style="text-align:center;padding:28px">
        <div style="font-size:40px;margin-bottom:12px">🏆</div>
        <div style="font-size:20px;font-weight:800;color:var(--text);margin-bottom:4px">Review Complete!</div>
        <div style="font-family:'Space Mono',monospace;font-size:10px;color:var(--muted);margin-bottom:20px">KANJI SRS SESSION</div>
        <div class="knj-stat-grid" style="max-width:320px;margin:0 auto 20px">
          <div class="knj-stat-card"><span class="knj-stat-val" style="color:var(--correct)">${good + easy}</span><span class="knj-stat-label">Good</span></div>
          <div class="knj-stat-card"><span class="knj-stat-val" style="color:var(--warn)">${hard}</span><span class="knj-stat-label">Hard</span></div>
          <div class="knj-stat-card"><span class="knj-stat-val" style="color:var(--wrong)">${again}</span><span class="knj-stat-label">Again</span></div>
          <div class="knj-stat-card"><span class="knj-stat-val">${results.length}</span><span class="knj-stat-label">Total</span></div>
        </div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-primary" id="knjReviewAgainBtn">Review More 🔄</button>
          <button class="btn btn-secondary" id="knjReviewDoneBtn">Back to Home</button>
        </div>
      </div>
    `;

    container.querySelector('#knjReviewDoneBtn').addEventListener('click', () => renderHome(container));
    container.querySelector('#knjReviewAgainBtn').addEventListener('click', () => startReviewSession(container));
    _drillState = null;
  }

  // ── MODAL: Mastered kanji ─────────────────────────────────
  function _renderMasteredModal(k) {
    const old = document.getElementById('knjMasteredModal');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'knjMasteredModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.65);padding:20px;box-sizing:border-box';
    modal.innerHTML = `
      <div class="card" style="max-width:340px;width:100%;text-align:center;animation:slideIn .2s ease;padding:28px">
        <div style="font-family:'Noto Sans JP',sans-serif;font-size:72px;font-weight:900;color:var(--stage-mastered-text,#00ff9d);margin-bottom:8px">${k.char}</div>
        <div style="font-size:18px;font-weight:800;color:var(--text);margin-bottom:4px">${k.meaning}</div>
        <div style="font-family:'Space Mono',monospace;font-size:9px;color:var(--muted);text-transform:uppercase;margin-bottom:16px">MASTERED · ${k.on.join('、')} · ${k.kun.join('、')}</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:20px">${k.mnemonic}</div>
        <div style="display:flex;gap:8px;justify-content:center">
          <button class="btn btn-secondary" id="knjMasteredClose">Close</button>
          <button class="btn btn-primary" id="knjMasteredRedrill">Re-drill</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#knjMasteredClose').addEventListener('click', () => modal.remove());
    modal.querySelector('#knjMasteredRedrill').addEventListener('click', () => {
      modal.remove();
      const inner = document.getElementById('knjModeInner');
      if (inner) renderWriteDrill(k.char, inner);
    });
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  }

  // ── Error state ───────────────────────────────────────────
  function _renderDataError(container) {
    container.innerHTML = `
      <div class="knj-error-box">
        <span style="font-size:20px">⚠️</span>
        <div>
          <div style="font-weight:700;margin-bottom:3px">Could not load kanji data</div>
          <div style="font-size:12px;opacity:.8">Check your connection or R2 bucket configuration.</div>
          <button class="btn btn-secondary" style="margin-top:10px;font-size:12px" onclick="KNJ_ENGINE.openKanjiMode()">Retry</button>
        </div>
      </div>
    `;
  }

  // ── Entry points ─────────────────────────────────────────

  /**
   * Open the KNJ mode panel.
   * Expects `#kanjiMode` div and `#knjModeInner` inner div in index.html.
   */
  async function openKanjiMode(opts = {}) {
    // Ensure data is loaded
    if (!n5Data) await init();

    const inner = document.getElementById('knjModeInner');
    if (!inner) return;

    if (n5Data) {
      renderHome(inner);
    } else {
      _renderDataError(inner);
    }
  }

  // ── Utility ──────────────────────────────────────────────
  function _shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  // ── Public API ───────────────────────────────────────────
  return {
    init,
    openKanjiMode,
    renderHome,
    renderIntroCard,
    renderDrillCard,
    renderMCQDrill,
    renderContextDrill,
    renderWriteDrill,
    startReviewSession,
    scheduleReview,
    toggleTheme,
    getProgress,
  };

})();

// ── Theme init on page load (3 lines, as per plan) ──────────
(function () {
  const saved = localStorage.getItem('knj_theme') || 'dark';
  document.documentElement.dataset.theme = saved;
})();
