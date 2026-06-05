/**
 * kanji_progression.js — KNJ Engine for Neuroverse
 * Part 3 complete: Steps 6e, 7, 8, 9, 6b, 6d (Part 2) + _renderReadingNode full implementation (Part 3)
 *
 * All code lives inside the IIFE — do not unwrap.
 * New CSS goes inside KNJ_CSS string only.
 * Public API: return { ... } at the bottom.
 */
const KNJ_ENGINE = (() => {

  // ── Constants ──────────────────────────────────────────────────── ~lines 13–30
  const LS_PROGRESS   = 'knj_progress';
  const LS_THEME      = 'knj_theme';
  const LS_NEW_TODAY  = 'knj_new_today';
  const LS_FURI_PREF  = 'knj_furi_pref';   // 'show' | 'hide'
  const SS_N5_CACHE   = 'knj_n5_cache';

  const STAGE_LOCKED   = 0;
  const STAGE_INTRO    = 1;
  const STAGE_SRS      = 5;
  const STAGE_MASTERED = 6;

  const INTERVAL_8H    = 8  * 3600 * 1000;
  const INTERVAL_24H   = 24 * 3600 * 1000;
  const INTERVAL_7D    = 7  * 86400 * 1000;
  const INTERVAL_21D   = 21 * 86400 * 1000;
  const INTERVAL_60D   = 60 * 86400 * 1000;

  const MAX_NEW_PER_DAY = 5;

  const RANKS = [
    { id:'academy', label:'Academy', icon:'🎓', min:0           },
    { id:'genin',   label:'Genin',   icon:'🟦', min:INTERVAL_24H },
    { id:'chunin',  label:'Chūnin',  icon:'🟣', min:INTERVAL_7D  },
    { id:'jonin',   label:'Jōnin',   icon:'🌟', min:INTERVAL_21D },
    { id:'hokage',  label:'Hokage',  icon:'👑', min:INTERVAL_60D },
  ];

  // ── KNJ_CSS string ─────────────────────────────────────────────── ~lines 41–200
  const KNJ_CSS = `
/* ── KNJ Base Layout ───────────────────────────────────────── */
#kanjiMode { background: var(--bg, #0a0a14); }
#knjModeInner { min-height: 400px; box-sizing: border-box; }

.knj-header {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 18px; padding-bottom: 12px;
  border-bottom: 1px solid var(--border, #2a2a3e);
}
.knj-header-title {
  font-family: 'Space Mono', monospace; font-size: 11px;
  letter-spacing: .16em; text-transform: uppercase; color: var(--muted, #888);
  flex: 1;
}
.knj-theme-btn {
  background: none; border: none; cursor: pointer;
  font-size: 16px; padding: 4px; line-height: 1;
}

/* ── Tabs ──────────────────────────────────────────────────── */
.knj-tabs {
  display: flex; gap: 4px; margin-bottom: 16px;
  background: var(--surface2, #1a1a2e); border-radius: 10px; padding: 4px;
}
.knj-tab {
  flex: 1; padding: 8px 0; border: none; background: none;
  font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700;
  color: var(--muted, #888); border-radius: 7px; cursor: pointer;
  transition: all .15s;
}
.knj-tab.active {
  background: var(--surface, #12121f); color: var(--text, #f1f1f4);
  box-shadow: 0 1px 4px rgba(0,0,0,.3);
}

/* ── Catalog grid ──────────────────────────────────────────── */
.knj-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(68px, 1fr));
  gap: 8px; margin-bottom: 16px;
}
.knj-cell {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 8px 4px 6px;
  border: 1.5px solid var(--border, #2a2a3e); border-radius: 10px;
  cursor: pointer; transition: all .15s; position: relative;
  background: var(--surface, #12121f);
}
.knj-cell:hover { border-color: var(--accent3, #6d78ff); }
.knj-cell-char {
  font-family: 'Noto Sans JP', sans-serif; font-size: 28px; font-weight: 900;
  line-height: 1.1; color: var(--text, #f1f1f4);
}
.knj-cell-meaning {
  font-size: 9px; color: var(--muted, #888); margin-top: 3px;
  text-align: center; font-family: 'Space Mono', monospace;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;
  padding: 0 2px;
}
.knj-cell-rank { position: absolute; top: 4px; right: 5px; font-size: 9px; }
.knj-cell-new {
  position: absolute; top: 4px; left: 5px; font-size: 7px;
  font-family: 'Space Mono', monospace; color: var(--accent3, #6d78ff);
  text-transform: uppercase; letter-spacing: .05em;
}
.knj-cell.locked { opacity: .35; cursor: default; }
.knj-cell.locked:hover { border-color: var(--border, #2a2a3e); }
.knj-cell.mastered { border-color: rgba(0,255,157,.25); }
.knj-cell.srs .knj-cell-char { color: var(--accent3, #6d78ff); }

/* ── Section labels ────────────────────────────────────────── */
.knj-section-label {
  font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: .12em;
  text-transform: uppercase; color: var(--muted, #888); margin-bottom: 10px; margin-top: 16px;
}
.knj-sub-label {
  font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: .1em;
  text-transform: uppercase; color: var(--muted, #888); margin-bottom: 6px; margin-top: 12px;
}

/* ── Gacha modal ───────────────────────────────────────────── */
.knj-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.75);
  display: flex; align-items: center; justify-content: center;
  z-index: 900; padding: 16px;
}
.knj-modal {
  background: var(--surface, #12121f); border: 1px solid var(--border, #2a2a3e);
  border-radius: 16px; padding: 24px; max-width: 400px; width: 100%;
  max-height: 85vh; overflow-y: auto;
}
.knj-gacha-candidates { display: flex; gap: 10px; justify-content: center; margin: 16px 0; }
.knj-gacha-candidate {
  flex: 1; max-width: 100px; padding: 16px 8px; border-radius: 12px;
  border: 2px solid var(--border, #2a2a3e); cursor: pointer; text-align: center;
  transition: all .2s; background: var(--surface2, #1a1a2e);
}
.knj-gacha-candidate:hover { border-color: var(--accent3, #6d78ff); transform: translateY(-2px); }
.knj-gacha-cand-char { font-family: 'Noto Sans JP', sans-serif; font-size: 36px; font-weight: 900; }
.knj-gacha-cand-meaning { font-size: 11px; color: var(--muted, #888); margin-top: 4px; }
.knj-modal-title {
  font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: .14em;
  text-transform: uppercase; color: var(--muted, #888); margin-bottom: 12px;
}

/* ── Detail modal ──────────────────────────────────────────── */
.knj-detail-char {
  font-family: 'Noto Sans JP', sans-serif; font-size: 72px; font-weight: 900;
  text-align: center; line-height: 1; margin-bottom: 4px;
  color: var(--text, #f1f1f4);
}
.knj-detail-meaning {
  font-size: 18px; font-weight: 700; text-align: center;
  color: var(--text, #f1f1f4); margin-bottom: 16px;
}
.knj-mnemonic {
  font-size: 13px; color: var(--text, #f1f1f4); line-height: 1.6;
  background: var(--surface2, #1a1a2e); border-radius: 8px; padding: 12px;
  margin-bottom: 12px; border-left: 3px solid var(--warn, #ffd32a);
}
.knj-sentence-block { margin-bottom: 12px; }
.knj-jp-sentence {
  font-family: 'Noto Sans JP', sans-serif; font-size: 16px;
  line-height: 2.4; color: var(--text, #f1f1f4); margin-bottom: 4px;
}
.knj-en-sentence { font-size: 12px; color: var(--muted, #888); }
.knj-source-tag {
  font-family: 'Space Mono', monospace; font-size: 9px;
  color: var(--accent3, #6d78ff); margin-left: 6px;
  border: 1px solid var(--accent3, #6d78ff); border-radius: 4px; padding: 1px 4px;
}
.knj-target { color: var(--accent3, #6d78ff); font-weight: 900; }

/* ── Intro card ────────────────────────────────────────────── */
.knj-intro-card { padding: 20px; }
.knj-intro-char {
  font-family: 'Noto Sans JP', sans-serif; font-size: 110px; font-weight: 900;
  text-align: center; line-height: 1; margin-bottom: 8px;
  color: var(--text, #f1f1f4);
}
.knj-intro-meaning {
  font-size: 22px; font-weight: 700; text-align: center;
  color: var(--text, #f1f1f4); margin-bottom: 6px;
}
.knj-intro-jlpt {
  text-align: center; font-family: 'Space Mono', monospace; font-size: 9px;
  color: var(--accent3, #6d78ff); letter-spacing: .12em; margin-bottom: 18px;
}

/* ── Pronunciation block ───────────────────────────────────── */
.knj-furi-hidden ruby rt { visibility: hidden; }
.knj-furi-toggle {
  font-family: 'Space Mono', monospace; font-size: 9px; color: var(--muted, #888);
  cursor: pointer; text-transform: uppercase; letter-spacing: .08em;
  border: none; background: none; padding: 0 0 5px; display: block;
}
.knj-sent-ruby {
  font-family: 'Noto Sans JP', sans-serif; font-size: 16px;
  line-height: 2.4; color: var(--text, #f1f1f4); margin-bottom: 4px;
}
.knj-grammar-note {
  font-size: 11px; color: var(--muted, #888); font-style: italic;
  border-left: 2px solid var(--accent3, #6d78ff); padding: 3px 8px;
  margin-top: 6px; line-height: 1.5;
}
.knj-pron-block {
  background: var(--surface2, #1a1a2e); border-radius: 8px;
  padding: 12px 14px; margin-bottom: 12px;
  border-left: 3px solid var(--accent3, #6d78ff);
}
.knj-rdg-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
.knj-rdg-card {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  background: var(--surface, #12121f); border: 1px solid var(--border, #2a2a3e);
  border-radius: 8px; padding: 8px 12px; min-width: 56px;
}
.knj-rdg-type {
  font-family: 'Space Mono', monospace; font-size: 8px;
  text-transform: uppercase; color: var(--muted, #888); letter-spacing: .1em;
}
.knj-rdg-kana {
  font-family: 'Noto Sans JP', sans-serif; font-size: 20px;
  font-weight: 700; color: var(--text, #f1f1f4);
}
.knj-rdg-romaji {
  font-family: 'Space Mono', monospace; font-size: 10px; color: var(--accent3, #6d78ff);
}
.knj-rdg-usage { font-size: 11px; color: var(--muted, #888); font-style: italic; margin-bottom: 6px; }
.knj-compound-list { display: flex; flex-direction: column; gap: 0; }
.knj-compound-row {
  display: flex; align-items: baseline; gap: 8px; padding: 5px 0;
  border-bottom: 1px solid var(--border, #2a2a3e);
}
.knj-compound-row:last-child { border-bottom: none; }
.knj-compound-jp {
  font-family: 'Noto Sans JP', sans-serif; font-size: 15px;
  font-weight: 700; color: var(--text, #f1f1f4);
}
.knj-compound-romaji {
  font-family: 'Space Mono', monospace; font-size: 10px; color: var(--accent3, #6d78ff);
}
.knj-compound-en { font-size: 11px; color: var(--muted, #888); }

/* ── Path tab ──────────────────────────────────────────────── */
.knj-path-coming {
  padding: 40px 20px; text-align: center;
  font-size: 12px; color: var(--muted, #888);
  font-family: 'Space Mono', monospace;
}
.knj-path-icon { font-size: 36px; margin-bottom: 12px; }

/* ── Reviews tab ───────────────────────────────────────────── */
.knj-review-card {
  padding: 16px; margin-bottom: 10px; cursor: pointer;
  display: flex; align-items: center; gap: 14px;
}
.knj-review-char {
  font-family: 'Noto Sans JP', sans-serif; font-size: 32px; font-weight: 900;
  color: var(--text, #f1f1f4); min-width: 44px; text-align: center;
}
.knj-review-meta { flex: 1; }
.knj-review-meaning { font-size: 13px; font-weight: 700; color: var(--text, #f1f1f4); }
.knj-review-due {
  font-size: 10px; font-family: 'Space Mono', monospace;
  color: var(--muted, #888); margin-top: 2px;
}
.knj-review-rank { font-size: 14px; }

/* ── Drill engine ──────────────────────────────────────────── */
.knj-drill-back-header {
  display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
}
.knj-pip-bar { display: flex; gap: 4px; margin-bottom: 14px; flex-wrap: wrap; }
.knj-pip {
  height: 4px; flex: 1; min-width: 16px; border-radius: 2px;
  background: var(--border, #2a2a3e); transition: background .3s;
}
.knj-pip.done { background: var(--accent3, #6d78ff); }
.knj-pip.current { background: var(--correct, #00ff9d); }

/* ── MCQ ───────────────────────────────────────────────────── */
.knj-mcq-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;
}
.knj-mcq-opt {
  display: flex; align-items: center; gap: 10px; padding: 12px 14px;
  background: var(--surface2, #1a1a2e); border: 1.5px solid var(--border, #2a2a3e);
  border-radius: 10px; cursor: pointer; text-align: left;
  font-family: inherit; font-size: 13px; color: var(--text, #f1f1f4);
  transition: all .15s; font-weight: 700;
}
.knj-mcq-opt:hover:not(:disabled) { border-color: var(--accent3, #6d78ff); }
.knj-mcq-opt-key {
  font-family: 'Space Mono', monospace; font-size: 9px;
  color: var(--muted, #888); min-width: 14px;
}
.knj-mcq-opt-text { flex: 1; font-size: 13px; }
.knj-opt-correct { background: rgba(0,255,157,.12) !important; border-color: var(--correct, #00ff9d) !important; }
.knj-opt-wrong   { background: rgba(255,77,77,.12) !important; border-color: var(--wrong, #ff4d4d) !important; }
.knj-opt-greyed  { opacity: .4; }

/* ── Context drill ─────────────────────────────────────────── */
.knj-context-sentence {
  font-family: 'Noto Sans JP', sans-serif; font-size: 18px; line-height: 2.4;
  text-align: center; margin: 16px 0; color: var(--text, #f1f1f4);
}
.knj-context-blank {
  display: inline-block; min-width: 44px; border-bottom: 2px solid var(--accent3, #6d78ff);
  text-align: center; font-family: 'Noto Sans JP', sans-serif;
  color: var(--accent3, #6d78ff);
}
.knj-context-mc { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin: 12px 0; }
.knj-context-opt {
  padding: 8px 16px; border-radius: 8px; border: 1.5px solid var(--border, #2a2a3e);
  background: var(--surface2, #1a1a2e); cursor: pointer;
  font-family: 'Noto Sans JP', sans-serif; font-size: 18px; font-weight: 700;
  color: var(--text, #f1f1f4); transition: all .15s;
}
.knj-context-opt:hover:not(:disabled) { border-color: var(--accent3, #6d78ff); }

/* ── Write drill ───────────────────────────────────────────── */
.knj-canvas-wrap {
  position: relative; margin: 12px auto; width: 240px; height: 240px;
}
.knj-canvas-model {
  position: absolute; inset: 0; font-family: 'Noto Sans JP', sans-serif;
  font-size: 180px; font-weight: 900; display: flex; align-items: center;
  justify-content: center; color: var(--text, #f1f1f4); opacity: .08;
  pointer-events: none; transition: opacity .3s;
}
canvas.knj-canvas {
  border: 1.5px solid var(--border, #2a2a3e); border-radius: 12px;
  touch-action: none; background: var(--surface2, #1a1a2e);
  width: 240px; height: 240px;
}
.knj-write-actions { display: flex; gap: 8px; justify-content: center; margin-top: 10px; }

/* ── Feedback panel ────────────────────────────────────────── */
.knj-feedback-panel {
  padding: 10px 12px; background: var(--surface2, #1a1a2e);
  border-radius: 8px; border: 1px solid var(--border, #2a2a3e);
}

/* ── SRS review ────────────────────────────────────────────── */
.knj-srs-grade-row { display: flex; gap: 8px; margin-top: 14px; }
.knj-grade-btn {
  flex: 1; padding: 10px 8px; border-radius: 9px; border: 1.5px solid var(--border);
  font-family: inherit; font-size: 12px; font-weight: 700; cursor: pointer;
  transition: all .15s; background: var(--surface2, #1a1a2e); color: var(--text);
}
.knj-grade-miss { border-color: var(--wrong, #ff4d4d); color: var(--wrong, #ff4d4d); }
.knj-grade-miss:hover  { background: rgba(255,77,77,.12); }
.knj-grade-hard { border-color: var(--warn, #ffd32a); color: var(--warn, #ffd32a); }
.knj-grade-hard:hover  { background: rgba(255,211,42,.12); }
.knj-grade-got  { border-color: var(--correct, #00ff9d); color: var(--correct, #00ff9d); }
.knj-grade-got:hover   { background: rgba(0,255,157,.12); }

/* ── Stats bar ─────────────────────────────────────────────── */
.knj-stats-bar {
  display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap;
}
.knj-stat-pill {
  display: flex; align-items: center; gap: 5px; padding: 5px 10px;
  background: var(--surface2, #1a1a2e); border-radius: 20px;
  border: 1px solid var(--border, #2a2a3e);
  font-family: 'Space Mono', monospace; font-size: 10px; color: var(--muted, #888);
}
.knj-stat-pill strong { color: var(--text, #f1f1f4); }

/* ── Toast ─────────────────────────────────────────────────── */
.knj-toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  padding: 10px 20px; border-radius: 20px; font-size: 13px; font-weight: 700;
  color: #000; z-index: 9999; pointer-events: none; animation: knjToastFade 2s forwards;
}
@keyframes knjToastFade {
  0%   { opacity: 0; transform: translateX(-50%) translateY(8px); }
  15%  { opacity: 1; transform: translateX(-50%) translateY(0);   }
  75%  { opacity: 1; }
  100% { opacity: 0; }
}

/* ── Drill complete card ───────────────────────────────────── */
.knj-complete-card {
  text-align: center; padding: 32px 24px;
}
.knj-complete-char {
  font-family: 'Noto Sans JP', sans-serif; font-size: 80px; font-weight: 900;
  line-height: 1; margin-bottom: 8px; color: var(--correct, #00ff9d);
}

/* ── Reading node — tappable kanji ────────────────────────── */
.knj-tap-kanji {
  color: var(--accent3, #6d78ff); cursor: pointer;
  border-bottom: 1px dotted var(--accent3, #6d78ff);
  transition: opacity .15s;
}
.knj-tap-kanji:hover { opacity: .75; }

/* ── Context reading micro-question ───────────────────────── */
.knj-ctx-rdg-panel {
  margin-top: 14px; padding: 12px 14px;
  background: var(--surface2, #1a1a2e);
  border: 1px solid var(--border, #2a2a3e);
  border-radius: 10px; border-left: 3px solid var(--accent3, #6d78ff);
}
.knj-ctx-rdg-label {
  font-family: 'Space Mono', monospace; font-size: 9px;
  text-transform: uppercase; letter-spacing: .1em;
  color: var(--muted, #888); margin-bottom: 8px;
}
.knj-ctx-rdg-opts {
  display: flex; gap: 6px; flex-wrap: wrap;
}
.knj-ctx-rdg-opt {
  padding: 6px 14px; border-radius: 8px;
  border: 1.5px solid var(--border, #2a2a3e);
  background: var(--surface, #12121f); cursor: pointer;
  font-family: 'Noto Sans JP', sans-serif;
  font-size: 17px; font-weight: 700;
  color: var(--text, #f1f1f4); transition: all .15s;
}
.knj-ctx-rdg-opt:hover:not(:disabled) { border-color: var(--accent3, #6d78ff); }

/* ── Screen transitions (Step 6c) ─────────────────────────── */
@keyframes knjFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: none; }
}
.knj-screen-enter { animation: knjFadeIn .2s ease; }
`;

  // ── State variables ─────────────────────────────────────────────
  let n5Data     = null;
  let progress   = {};
  let _activeTab = 'catalog';
  let _drillState = null;

  // ── _injectStyles() ─────────────────────────────────────────────
  function _injectStyles() {
    if (document.getElementById('knj-styles')) return;
    const s = document.createElement('style');
    s.id = 'knj-styles';
    s.textContent = KNJ_CSS;
    document.head.appendChild(s);
  }

  // ── init() ──────────────────────────────────────────────────────
  async function init() {
    _injectStyles();
    // Apply saved theme
    const savedTheme = localStorage.getItem(LS_THEME) || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    // Load progress
    try {
      const raw = localStorage.getItem(LS_PROGRESS);
      progress = raw ? JSON.parse(raw) : {};
    } catch (_) { progress = {}; }
    // Load kanji data
    if (!n5Data) {
      try {
        const cached = sessionStorage.getItem(SS_N5_CACHE);
        if (cached) { n5Data = JSON.parse(cached); }
        else {
          n5Data = await window.r2Fetch('data/kanji_n5_data.json');
          try { sessionStorage.setItem(SS_N5_CACHE, JSON.stringify(n5Data)); } catch (_) {}
        }
      } catch (e) { return false; }
    }
    _computeUnlocks();
    return true;
  }

  // ── toggleTheme() ───────────────────────────────────────────────
  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'day' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(LS_THEME, next); } catch (_) {}
  }

  // ── progress storage ────────────────────────────────────────────
  function _saveProgress() {
    try { localStorage.setItem(LS_PROGRESS, JSON.stringify(progress)); } catch (_) {}
  }

  function _getOrCreateProgress(char, track) {
    if (!progress[char]) {
      progress[char] = {
        char,
        track: track || 'n5',
        order: n5Data ? n5Data.findIndex(k => k.char === char) : 0,
        stage: STAGE_LOCKED,
        srs_interval_ms: 0,
        srs_due: null,
        introduced_at: null,
        review_count: 0,
        correct_total: 0,
        wrong_total: 0,
        last_seen: null,
        recent_wrong: false,
        manual_reviews: 0,
        rank: null,
        reading_done: false,
        reinforce_done: false,
      };
    }
    // Ensure new fields on old progress objects
    if (progress[char].reading_done  === undefined) progress[char].reading_done  = false;
    if (progress[char].reinforce_done === undefined) progress[char].reinforce_done = false;
    return progress[char];
  }

  function _setProgress(char, data) {
    const p = _getOrCreateProgress(char);
    Object.assign(p, data);
    _saveProgress();
  }

  function getProgress(char) {
    return progress[char] || null;
  }

  // ── rank computation ─────────────────────────────────────────────
  function _getRank(p) {
    if (!p || p.stage < STAGE_SRS) return null;
    const iv = p.srs_interval_ms || 0;
    let rank = RANKS[0];
    for (const r of RANKS) { if (iv >= r.min) rank = r; }
    return rank;
  }

  function _updateRank(char) {
    const p = progress[char];
    if (!p) return;
    const r = _getRank(p);
    p.rank = r ? r.id : null;
  }

  // ── unlock logic ──────────────────────────────────────────────────
  function _computeUnlocks() {
    if (!n5Data) return;
    // First kanji is always unlocked
    n5Data.forEach((k, idx) => {
      const p = _getOrCreateProgress(k.char, 'n5');
      if (idx === 0 && p.stage === STAGE_LOCKED) p.stage = STAGE_INTRO;
      // Unlock based on related entries of already-SRS kanji
      if (p.stage >= STAGE_SRS) {
        (k.related || []).forEach(rel => {
          const rp = _getOrCreateProgress(rel.char, 'n5');
          if (rp.stage === STAGE_LOCKED) rp.stage = STAGE_INTRO;
        });
      }
    });
    _saveProgress();
  }

  // ── daily cap ─────────────────────────────────────────────────────
  function _getTodayNewCount() {
    try {
      const raw = localStorage.getItem(LS_NEW_TODAY);
      if (!raw) return 0;
      const obj = JSON.parse(raw);
      const today = new Date().toISOString().slice(0, 10);
      return obj.date === today ? (obj.count || 0) : 0;
    } catch (_) { return 0; }
  }

  function _incrementTodayNew() {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const raw = localStorage.getItem(LS_NEW_TODAY);
      let obj = { date: today, count: 0 };
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.date === today) obj = parsed;
      }
      obj.count = (obj.count || 0) + 1;
      localStorage.setItem(LS_NEW_TODAY, JSON.stringify(obj));
    } catch (_) {}
  }

  // ── stats ─────────────────────────────────────────────────────────
  function _getStats() {
    let total = 0, srs = 0, mastered = 0, due = 0;
    const now = Date.now();
    Object.values(progress).forEach(p => {
      if (p.introduced_at) total++;
      if (p.stage >= STAGE_SRS) srs++;
      if (p.stage >= STAGE_MASTERED) mastered++;
      if (p.stage >= STAGE_SRS && p.srs_due && p.srs_due <= now) due++;
    });
    return { total, srs, mastered, due };
  }

  // ── SRS engine ────────────────────────────────────────────────────
  function scheduleReview(char, grade) {
    // grade: 0=Miss, 1=Hard, 2=Got it
    const p = _getOrCreateProgress(char);
    const now = Date.now();
    p.review_count = (p.review_count || 0) + 1;
    p.last_seen = now;

    if (grade === 0) {
      p.wrong_total = (p.wrong_total || 0) + 1;
      p.recent_wrong = true;
      p.srs_interval_ms = INTERVAL_8H;
    } else if (grade === 1) {
      p.correct_total = (p.correct_total || 0) + 1;
      p.recent_wrong = false;
      p.srs_interval_ms = Math.max(INTERVAL_24H, (p.srs_interval_ms || INTERVAL_8H));
    } else {
      p.correct_total = (p.correct_total || 0) + 1;
      p.recent_wrong = false;
      const prev = p.srs_interval_ms || INTERVAL_8H;
      p.srs_interval_ms = prev < INTERVAL_24H ? INTERVAL_24H : Math.round(prev * 2.5);
    }

    p.srs_due = now + p.srs_interval_ms;
    if (p.srs_interval_ms >= INTERVAL_60D) p.stage = STAGE_MASTERED;
    else if (p.stage < STAGE_SRS) p.stage = STAGE_SRS;

    _updateRank(char);
    _computeUnlocks();
    _saveProgress();
  }

  // ── gacha candidates ──────────────────────────────────────────────
  function _getGachaCandidates(count) {
    if (!n5Data) return [];
    return n5Data
      .filter(k => {
        const p = progress[k.char];
        return p && p.stage === STAGE_INTRO;
      })
      .slice(0, count || 3);
  }

  // ── distractor selection ──────────────────────────────────────────
  function _getDistractors(charData, count) {
    // charData = full kanji object from n5Data
    const explicit = charData.distractors || [];
    const pool = n5Data
      .map(k => k.char)
      .filter(c => c !== charData.char && !explicit.includes(c));
    return _shuffle(explicit.concat(pool)).slice(0, count || 3);
  }

  // ── HTML helpers ──────────────────────────────────────────────────
  function _h(html) {
    const d = document.createElement('div');
    d.innerHTML = html;
    return d;
  }

  function _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function _toast(msg, color) {
    const t = document.createElement('div');
    t.className = 'knj-toast';
    t.textContent = msg;
    t.style.background = color || 'var(--correct, #00ff9d)';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }

  function _formatDue(ms) {
    if (!ms) return 'now';
    const diff = ms - Date.now();
    if (diff <= 0) return 'now';
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (d >= 1) return 'in ' + d + 'd';
    if (h >= 1) return 'in ' + h + 'h';
    return 'soon';
  }

  // Step 6c — screen transition helper
  function _renderScreen(container, html) {
    container.innerHTML = html;
    container.classList.remove('knj-screen-enter');
    void container.offsetWidth; // force reflow so animation restarts
    container.classList.add('knj-screen-enter');
  }

  // ── cell rendering ─────────────────────────────────────────────── ~lines 435–475
  function _renderCell(k, container) {
    const p = progress[k.char] || {};
    const rank = _getRank(p);
    const isLocked   = !p.stage || p.stage === STAGE_LOCKED;
    const isSRS      = p.stage >= STAGE_SRS;
    const isMastered = p.stage >= STAGE_MASTERED;
    const isIntro    = p.stage === STAGE_INTRO;

    let cellClass = 'knj-cell card';
    if (isLocked)   cellClass += ' locked';
    if (isMastered) cellClass += ' mastered';
    else if (isSRS) cellClass += ' srs';

    const el = _h(
      '<div class="' + cellClass + '">' +
        (isIntro ? '<div class="knj-cell-new">new</div>' : '') +
        (rank ? '<div class="knj-cell-rank">' + rank.icon + '</div>' : '') +
        '<div class="knj-cell-char">' + k.char + '</div>' +
        '<div class="knj-cell-meaning">' + k.meaning + '</div>' +
      '</div>'
    ).firstChild;

    if (!isLocked) {
      el.addEventListener('click', () => _openDetailModal(k, p, container));
    }
    return el;
  }

  // ── _renderPronunciationBlock(k) ──────────────────────────────── Step 6e.3
  function _renderPronunciationBlock(k) {
    // On-reading cards
    const onCards = (k.on || []).map(function(kana, i) {
      var romaji = (k.on_romaji || [])[i] || '';
      return '<div class="knj-rdg-card">' +
        '<div class="knj-rdg-type">On</div>' +
        '<div class="knj-rdg-kana">' + kana + '</div>' +
        (romaji ? '<div class="knj-rdg-romaji">' + romaji + '</div>' : '') +
      '</div>';
    }).join('');

    // Kun-reading cards (strip okurigana dash/dot notation)
    const kunCards = (k.kun || []).slice(0, 3).map(function(kana, i) {
      var romaji = (k.kun_romaji || [])[i] || '';
      var display = kana.replace(/-.*$/, '').replace(/\..*$/, '');
      return '<div class="knj-rdg-card">' +
        '<div class="knj-rdg-type">Kun</div>' +
        '<div class="knj-rdg-kana">' + display + '</div>' +
        (romaji ? '<div class="knj-rdg-romaji">' + romaji + '</div>' : '') +
      '</div>';
    }).join('');

    // Compound examples with pronunciation
    const compoundRows = (k.compound_examples || []).slice(0, 3).map(function(c) {
      return '<div class="knj-compound-row">' +
        '<span class="knj-compound-jp">' + c.word + '</span>' +
        '<span class="knj-compound-romaji">' + c.furi + ' · ' + c.romaji + '</span>' +
        '<span class="knj-compound-en">' + c.en + '</span>' +
      '</div>';
    }).join('');

    return '<div class="knj-pron-block">' +
      '<div class="knj-sub-label" style="margin-top:0">Pronunciation</div>' +
      '<div class="knj-rdg-row">' + onCards + kunCards + '</div>' +
      (k.on_usage  ? '<div class="knj-rdg-usage">On: '  + k.on_usage  + '</div>' : '') +
      (k.kun_usage ? '<div class="knj-rdg-usage">Kun: ' + k.kun_usage + '</div>' : '') +
      (compoundRows
        ? '<div class="knj-sub-label" style="margin-top:8px">Hear it in a word</div>' +
          '<div class="knj-compound-list">' + compoundRows + '</div>'
        : '') +
    '</div>';
  }

  // ── _renderSentenceBlock(s, opts) ─────────────────────────────── Step 6e.4
  function _renderSentenceBlock(s, opts) {
    opts = opts || {};
    var showFuri    = opts.showFuri !== false;
    var highlight   = opts.highlight || null;
    var showGrammar = opts.showGrammar || false;

    // Respect user's stored pref; first-contact screens override with showFuri default
    var stored = localStorage.getItem(LS_FURI_PREF);
    var furiVisible = stored ? stored === 'show' : showFuri;

    var blockId = 'knjSB' + Math.random().toString(36).slice(2, 6);
    // Always use furi HTML if available (ruby structure must exist for toggle to work).
    // When furi is absent fall back to plain jp. Visibility is controlled by CSS class.
    var jpDisplay = (s.furi || s.jp);
    if (highlight) {
      jpDisplay = jpDisplay.replace(
        new RegExp(highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        '<span class="knj-target">' + highlight + '</span>'
      );
    }

    return '<div class="knj-sentence-block" id="' + blockId + '">' +
      '<button class="knj-furi-toggle" data-target="' + blockId + '">' +
        (furiVisible ? '▲ hide furigana' : '▼ show furigana') +
      '</button>' +
      '<div class="knj-sent-ruby knj-jp-sentence' + (furiVisible ? '' : ' knj-furi-hidden') + '">' + jpDisplay + '</div>' +
      '<div class="knj-en-sentence">' + s.en + '<span class="knj-source-tag">' + s.source + '</span></div>' +
      (showGrammar && s.grammar_note ? '<div class="knj-grammar-note">' + s.grammar_note + '</div>' : '') +
    '</div>';
  }

  // ── renderHome() ──────────────────────────────────────────────── ~lines 477–521
  function renderHome(container, tab) {
    if (!container) container = document.getElementById('knjModeInner');
    if (tab) _activeTab = tab;
    if (!n5Data) { _renderDataError(container); return; }

    const stats = _getStats();
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';

    container.innerHTML =
      '<div class="knj-header">' +
        '<div class="knj-header-title">KNJ — N5 Kanji</div>' +
        '<div class="knj-stats-bar" style="margin:0">' +
          '<div class="knj-stat-pill"><strong>' + stats.total + '</strong> learned</div>' +
          (stats.due > 0 ? '<div class="knj-stat-pill" style="color:var(--warn)"><strong>' + stats.due + '</strong> due</div>' : '') +
        '</div>' +
        '<button class="knj-theme-btn" id="knjThemeBtn">' + (theme === 'dark' ? '☀️' : '🌙') + '</button>' +
      '</div>' +
      '<div class="knj-tabs" id="knjTabs">' +
        '<button class="knj-tab' + (_activeTab === 'catalog' ? ' active' : '') + '" data-tab="catalog">Catalog</button>' +
        '<button class="knj-tab' + (_activeTab === 'path'    ? ' active' : '') + '" data-tab="path">Path</button>' +
        '<button class="knj-tab' + (_activeTab === 'reviews' ? ' active' : '') + '" data-tab="reviews">Reviews</button>' +
      '</div>' +
      '<div id="knjTabContent"></div>';

    container.querySelector('#knjThemeBtn').addEventListener('click', () => {
      toggleTheme();
      renderHome(container);
    });
    container.querySelector('#knjTabs').addEventListener('click', e => {
      const btn = e.target.closest('.knj-tab');
      if (!btn) return;
      _activeTab = btn.dataset.tab;
      renderHome(container);
    });

    const tabContent = container.querySelector('#knjTabContent');
    if (_activeTab === 'catalog')      _renderCatalogTab(tabContent);
    else if (_activeTab === 'path')    _renderPathTab(tabContent);
    else if (_activeTab === 'reviews') _renderReviewsTab(tabContent);
  }

  // ── _renderCatalogTab() ──────────────────────────────────────── ~lines 523–584
  function _renderCatalogTab(container) {
    const todayCount = _getTodayNewCount();
    const canLearn   = todayCount < MAX_NEW_PER_DAY;
    const candidates = _getGachaCandidates(10);

    const sections = [
      { label: 'In SRS Pool',   filter: p => p && p.stage >= STAGE_SRS && p.stage < STAGE_MASTERED },
      { label: 'Mastered',      filter: p => p && p.stage >= STAGE_MASTERED },
      { label: 'Unlocked',      filter: p => p && p.stage === STAGE_INTRO   },
      { label: 'Locked',        filter: p => !p || p.stage === STAGE_LOCKED },
    ];

    sections.forEach(section => {
      const matching = n5Data.filter(k => section.filter(progress[k.char]));
      if (matching.length === 0) return;
      const label = _h('<div class="knj-section-label">' + section.label + ' (' + matching.length + ')</div>');
      container.appendChild(label);
      const grid = document.createElement('div');
      grid.className = 'knj-grid';
      matching.forEach(k => grid.appendChild(_renderCell(k, container)));
      container.appendChild(grid);
    });

    // Gacha CTA — small pill button (Step 6d)
    if (candidates.length > 0) {
      const gachaEl = _h(
        '<div style="text-align:center;margin-bottom:14px">' +
          '<button class="btn btn-secondary" id="knjGachaCTA" ' +
            'style="font-size:12px;padding:7px 18px;' + (!canLearn ? 'opacity:.4;cursor:default' : '') + '">' +
            (canLearn
              ? '🎰 Learn a new kanji (' + (MAX_NEW_PER_DAY - todayCount) + ' left today)'
              : 'Daily limit reached') +
          '</button>' +
        '</div>'
      );
      container.appendChild(gachaEl);
      if (canLearn) {
        gachaEl.querySelector('#knjGachaCTA').addEventListener('click', () => _openGachaModal(container));
      }
    }
  }

  // ── _renderPathTab() ─────────────────────────────────────────── Step 7 FULL
  function _renderPathTab(container) {
    var nodes = _computePathNodes();

    if (nodes.length === 0) {
      container.appendChild(_h(
        '<div class="knj-path-coming">' +
          '<div class="knj-path-icon">🗺️</div>' +
          '<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:8px">No path yet</div>' +
          '<div>Spin the gacha and learn your first kanji to begin your path.</div>' +
        '</div>'
      ));
      return;
    }

    // Find current position — first incomplete node
    var currentIdx = -1;
    for (var i = 0; i < nodes.length; i++) {
      if (!nodes[i].completed) { currentIdx = i; break; }
    }
    if (currentIdx === -1) currentIdx = nodes.length - 1; // all done

    var wrap = document.createElement('div');
    wrap.style.cssText = 'padding:4px 0 20px';

    nodes.forEach(function(node, idx) {
      var isCurrent   = idx === currentIdx;
      var isCompleted = node.completed;
      var isLocked    = idx > currentIdx + 1 && !isCompleted;

      var colors = {
        intro:      '#8B7CF6',
        drill:      '#185FA5',
        reading:    '#EF9F27',
        reinforce:  '#1D9E75',
        rank_check: '#D85A30',
        srs:        '#888780',
      };
      var color = colors[node.type] || '#888780';

      var dotStyle = isCompleted
        ? 'background:' + color + ';border:2px solid ' + color
        : isCurrent
          ? 'background:transparent;border:2px solid ' + color + ';box-shadow:0 0 0 3px ' + color + '33'
          : 'background:transparent;border:2px solid var(--border,#2a2a3e)';

      var labels = {
        intro:      'Introduction',
        drill:      'Drill',
        reading:    'Reading',
        reinforce:  'Reinforce',
        rank_check: 'Rank Check',
        srs:        'SRS Review',
      };

      var nodeEl = document.createElement('div');
      nodeEl.style.cssText = 'display:flex;align-items:flex-start;gap:14px;padding:0 0 16px;position:relative';

      // Connecting line
      var lineDiv = '';
      if (idx < nodes.length - 1) {
        lineDiv = '<div style="position:absolute;left:11px;top:26px;bottom:0;width:2px;background:' +
          (isCompleted ? color : 'var(--border,#2a2a3e)') + ';opacity:0.5"></div>';
      }

      // Dot
      var dotDiv = '<div style="position:relative;z-index:1;width:24px;height:24px;border-radius:50%;' + dotStyle + ';flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center">' +
        (isCompleted ? '<div style="width:10px;height:10px;border-radius:50%;background:#fff;opacity:0.9"></div>' : '') +
      '</div>';

      // Content
      var rankLabel = node.type === 'rank_check' && node.rank
        ? ' → ' + node.rank.charAt(0).toUpperCase() + node.rank.slice(1) : '';
      var statusTag = isCompleted
        ? '<span style="font-family:\'Space Mono\',monospace;font-size:8px;color:var(--correct,#00ff9d);background:rgba(0,255,157,0.1);border:1px solid rgba(0,255,157,0.25);border-radius:4px;padding:1px 5px;margin-left:6px">done</span>'
        : isCurrent
          ? '<span style="font-family:\'Space Mono\',monospace;font-size:8px;color:' + color + ';background:' + color + '15;border:1px solid ' + color + '33;border-radius:4px;padding:1px 5px;margin-left:6px">current</span>'
          : '';

      var contentDiv =
        '<div style="flex:1;padding-top:2px;opacity:' + (isLocked ? '0.35' : '1') + '">' +
          '<div style="display:flex;align-items:center;margin-bottom:2px">' +
            '<span style="font-family:\'Noto Sans JP\',sans-serif;font-size:18px;font-weight:900;color:' +
              (isCurrent ? color : 'var(--text,#f1f1f4)') + ';margin-right:8px">' + node.char + '</span>' +
            '<span style="font-size:13px;font-weight:700;color:var(--text,#f1f1f4)">' + labels[node.type] + rankLabel + '</span>' +
            statusTag +
          '</div>' +
          '<div style="font-size:12px;color:var(--muted,#888);margin-bottom:2px">' + node.meaning + '</div>' +
        '</div>';

      nodeEl.innerHTML = lineDiv + dotDiv + contentDiv;
      wrap.appendChild(nodeEl);

      // Click handlers
      if (isCompleted && node.type !== 'srs') {
        nodeEl.style.cursor = 'pointer';
        nodeEl.addEventListener('click', function() {
          var k = n5Data.find(function(d) { return d.char === node.char; });
          if (k) _openDetailModal(k, progress[node.char] || {}, container);
        });
      } else if (isCurrent) {
        nodeEl.style.cursor = 'pointer';
        nodeEl.addEventListener('click', function() {
          _startPathNode(node, document.getElementById('knjModeInner'));
        });
      }
    });

    container.appendChild(wrap);
  }

  function _computePathNodes() {
    if (!n5Data) return [];
    var nodes = [];
    var introduced = n5Data.filter(function(k) {
      var p = progress[k.char];
      return p && p.introduced_at !== null;
    });

    introduced.forEach(function(k) {
      var p = progress[k.char];
      if (!p) return;

      // INTRO — always completed at introduction time
      nodes.push({ type:'intro', char:k.char, meaning:k.meaning, completed: true });

      // DRILL #1 — completed after first review
      nodes.push({ type:'drill', char:k.char, meaning:k.meaning, completed: (p.review_count || 0) >= 1 });

      if ((p.review_count || 0) < 1) return; // don't show further nodes until drill done

      // READING node
      nodes.push({ type:'reading', char:k.char, meaning:k.meaning, completed: !!p.reading_done });

      // REINFORCE — only show when 2+ other kanji exist to mix
      var others = introduced.filter(function(o) { return o.char !== k.char; });
      if (others.length >= 2) {
        nodes.push({ type:'reinforce', char:k.char, meaning:k.meaning, completed: !!p.reinforce_done });
      }

      // RANK CHECK — show once rank advances past academy
      if (p.rank && p.rank !== 'academy') {
        nodes.push({ type:'rank_check', char:k.char, meaning:k.meaning, rank: p.rank, completed: true });
      }
    });

    return nodes;
  }

  function _startPathNode(node, container) {
    if (!n5Data) return;
    if (node.type === 'drill') {
      _startLearningDrill(node.char, container);
    } else if (node.type === 'reading') {
      _renderReadingNode(node.char, container, function() {
        _setProgress(node.char, { reading_done: true });
        renderHome(container, 'path');
      });
    } else if (node.type === 'reinforce') {
      _renderReinforceNode(node.char, container, function() {
        _setProgress(node.char, { reinforce_done: true });
        renderHome(container, 'path');
      });
    } else if (node.type === 'rank_check') {
      _renderRankCheckNode(node.char, container, function() {
        renderHome(container, 'path');
      });
    }
  }

  // ── _renderReviewsTab() ──────────────────────────────────────── ~lines 597–629
  function _renderReviewsTab(container) {
    const now = Date.now();
    const due = Object.values(progress)
      .filter(p => p.stage >= STAGE_SRS && p.srs_due && p.srs_due <= now)
      .sort((a, b) => (a.srs_due || 0) - (b.srs_due || 0));

    const upcoming = Object.values(progress)
      .filter(p => p.stage >= STAGE_SRS && (!p.srs_due || p.srs_due > now))
      .sort((a, b) => (a.srs_due || 0) - (b.srs_due || 0))
      .slice(0, 8);

    if (due.length === 0 && upcoming.length === 0) {
      container.appendChild(_h(
        '<div style="text-align:center;padding:40px 16px;color:var(--muted);font-family:\'Space Mono\',monospace;font-size:12px">' +
          '🎉 Nothing due — all caught up!<br><br>' +
          '<span style="font-size:10px">Introduce more kanji from the catalog</span>' +
        '</div>'
      ));
      return;
    }

    if (due.length > 0) {
      const hdr = _h('<div class="knj-section-label" style="display:flex;justify-content:space-between;align-items:center">' +
        '<span>Due now (' + due.length + ')</span>' +
        '<button class="btn btn-primary" id="knjStartReview" style="font-size:11px;padding:6px 14px">Start all</button>' +
      '</div>');
      container.appendChild(hdr);
      hdr.querySelector('#knjStartReview').addEventListener('click', () => {
        startReviewSession(document.getElementById('knjModeInner'), 'due');
      });
      due.slice(0, 12).forEach(p => {
        const k = n5Data.find(d => d.char === p.char);
        if (!k) return;
        const rank = _getRank(p);
        const el = _h(
          '<div class="knj-review-card card">' +
            '<div class="knj-review-char">' + k.char + '</div>' +
            '<div class="knj-review-meta">' +
              '<div class="knj-review-meaning">' + k.meaning + '</div>' +
              '<div class="knj-review-due">Due: now</div>' +
            '</div>' +
            (rank ? '<div class="knj-review-rank">' + rank.icon + '</div>' : '') +
          '</div>'
        );
        el.firstChild.addEventListener('click', () => {
          startReviewSession(document.getElementById('knjModeInner'), 'select', [p.char]);
        });
        container.appendChild(el);
      });
    }

    if (upcoming.length > 0) {
      container.appendChild(_h('<div class="knj-section-label" style="margin-top:16px">Upcoming</div>'));
      upcoming.forEach(p => {
        const k = n5Data.find(d => d.char === p.char);
        if (!k) return;
        const rank = _getRank(p);
        const el = _h(
          '<div class="knj-review-card card" style="opacity:.7">' +
            '<div class="knj-review-char">' + k.char + '</div>' +
            '<div class="knj-review-meta">' +
              '<div class="knj-review-meaning">' + k.meaning + '</div>' +
              '<div class="knj-review-due">' + _formatDue(p.srs_due) + '</div>' +
            '</div>' +
            (rank ? '<div class="knj-review-rank">' + rank.icon + '</div>' : '') +
          '</div>'
        );
        container.appendChild(el);
      });
    }
  }

  // ── _renderSelectKanji() ──────────────────────────────────────── ~lines 631–664
  function _renderSelectKanji(container, onSelect) {
    const introduced = n5Data.filter(k => {
      const p = progress[k.char];
      return p && p.introduced_at;
    });

    container.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">' +
        '<button class="btn btn-secondary" id="knjBackBtn" style="font-size:12px;padding:7px 12px">← Back</button>' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:2px;color:var(--muted);text-transform:uppercase">SELECT KANJI</div>' +
      '</div>' +
      '<div class="knj-grid" id="knjSelectGrid"></div>';

    container.querySelector('#knjBackBtn').addEventListener('click', () => renderHome(container));

    const grid = container.querySelector('#knjSelectGrid');
    introduced.forEach(k => {
      const el = _renderCell(k, container);
      el.addEventListener('click', () => onSelect(k.char));
      grid.appendChild(el);
    });
  }

  // ── _openGachaModal() ─────────────────────────────────────────── ~lines 666–703
  function _openGachaModal(container) {
    const candidates = _getGachaCandidates(3);
    if (candidates.length === 0) {
      _toast('No new kanji available!', 'var(--warn)');
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'knj-modal-overlay';
    overlay.innerHTML =
      '<div class="knj-modal">' +
        '<div class="knj-modal-title">🎰 Choose your next kanji</div>' +
        '<div class="knj-gacha-candidates" id="knjGachaCandidates">' +
          candidates.map(k =>
            '<div class="knj-gacha-candidate" data-char="' + k.char + '">' +
              '<div class="knj-gacha-cand-char">' + k.char + '</div>' +
              '<div class="knj-gacha-cand-meaning">' + k.meaning + '</div>' +
            '</div>'
          ).join('') +
        '</div>' +
        '<button class="btn btn-secondary" id="knjGachaClose" style="width:100%;margin-top:8px">Cancel</button>' +
      '</div>';

    overlay.querySelector('#knjGachaClose').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelectorAll('.knj-gacha-candidate').forEach(el => {
      el.addEventListener('click', () => {
        const char = el.dataset.char;
        overlay.remove();
        _incrementTodayNew();
        renderIntroCard(char, container);
      });
    });

    document.body.appendChild(overlay);
  }

  // ── _openDetailModal() ───────────────────────────────────────── ~lines 705–765
  function _openDetailModal(k, p, container) {
    const rank = _getRank(p);

    // Step 6e.6 — updated sentenceHTML
    const sentenceHTML = (k.sentences || []).slice(0, 2).map(function(s) {
      return _renderSentenceBlock(s, { showFuri: true, highlight: k.char });
    }).join('');

    const overlay = document.createElement('div');
    overlay.className = 'knj-modal-overlay';
    overlay.innerHTML =
      '<div class="knj-modal">' +
        '<div style="display:flex;justify-content:flex-end;margin-bottom:8px">' +
          '<button class="btn btn-secondary" id="knjDetailClose" style="font-size:12px;padding:5px 12px">✕ Close</button>' +
        '</div>' +
        '<div class="knj-detail-char">' + k.char + '</div>' +
        '<div class="knj-detail-meaning">' + k.meaning + '</div>' +
        (rank ? '<div style="text-align:center;font-size:13px;margin-bottom:12px">' + rank.icon + ' ' + rank.label + '</div>' : '') +
        _renderPronunciationBlock(k) +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted);margin-bottom:8px">Strokes: ' + k.strokes + '</div>' +
        (k.mnemonic ? '<div class="knj-mnemonic">' + k.mnemonic + '</div>' : '') +
        (sentenceHTML ? '<div class="knj-sub-label">Example sentences</div>' + sentenceHTML : '') +
        '<div style="display:flex;gap:8px;margin-top:16px">' +
          '<button class="btn btn-primary" id="knjDetailDrill" style="flex:1">Drill this</button>' +
          (p.introduced_at ? '' :
            '<button class="btn btn-secondary" id="knjDetailIntro" style="flex:1">Introduce</button>'
          ) +
        '</div>' +
      '</div>';

    overlay.querySelector('#knjDetailClose').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector('#knjDetailDrill').addEventListener('click', () => {
      overlay.remove();
      _startOnDemandDrill(k.char, container);
    });

    const introBtn = overlay.querySelector('#knjDetailIntro');
    if (introBtn) {
      introBtn.addEventListener('click', () => {
        overlay.remove();
        renderIntroCard(k.char, container);
      });
    }

    document.body.appendChild(overlay);
  }

  // ── renderIntroCard() ─────────────────────────────────────────── ~lines 767–844
  function renderIntroCard(char, container) {
    if (!container) container = document.getElementById('knjModeInner');
    if (!n5Data) { _renderDataError(container); return; }

    const k = n5Data.find(d => d.char === char);
    if (!k) return;

    // Mark as introduced
    const p = _getOrCreateProgress(char, 'n5');
    if (!p.introduced_at) {
      p.introduced_at = Date.now();
      p.stage = STAGE_SRS;
      _updateRank(char);
      _computeUnlocks();
      _saveProgress();
    }

    // Step 6e.5 — updated sentenceHTML using _renderSentenceBlock
    const sentenceHTML = (k.sentences || []).map(function(s) {
      return _renderSentenceBlock(s, { showFuri: true, highlight: char, showGrammar: true });
    }).join('');

    // Step 6c — screen transition
    _renderScreen(container,
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">' +
        '<button class="btn btn-secondary" id="knjBackBtn" style="font-size:12px;padding:7px 12px">← Back</button>' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:2px;color:var(--muted);text-transform:uppercase">INTRODUCTION</div>' +
      '</div>' +
      '<div class="card knj-intro-card">' +
        '<div class="knj-intro-char">' + char + '</div>' +
        '<div class="knj-intro-meaning">' + k.meaning + '</div>' +
        '<div class="knj-intro-jlpt">JLPT N5 · ' + k.strokes + ' strokes · ' + (k.radical_meaning || k.radical) + '</div>' +

        // Step 6e.5 — pronunciation block replaces old reading-row
        _renderPronunciationBlock(k) +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted);margin-bottom:8px">Strokes: ' + k.strokes + '</div>' +

        (k.mnemonic
          ? '<div class="knj-sub-label">Memory hint</div>' +
            '<div class="knj-mnemonic">' + k.mnemonic + '</div>'
          : '') +

        (sentenceHTML
          ? '<div class="knj-sub-label">Example sentences</div>' + sentenceHTML
          : '') +

        '<div style="margin-top:20px;display:flex;gap:8px">' +
          '<button class="btn btn-primary" id="knjStartDrill" style="flex:1">Start drilling →</button>' +
        '</div>' +
      '</div>'
    );

    container.querySelector('#knjBackBtn').addEventListener('click', () => renderHome(container));
    container.querySelector('#knjStartDrill').addEventListener('click', () => {
      _startLearningDrill(char, container);
    });
  }

  // ── drill engine ──────────────────────────────────────────────── ~lines 846–920
  function _drillBackHeader(label) {
    return '<div class="knj-drill-back-header">' +
      '<button class="btn btn-secondary" id="knjBackBtn" style="font-size:12px;padding:7px 12px">← Back</button>' +
      '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;flex:1">' + (label || 'DRILL') + '</div>' +
    '</div>';
  }

  function _pipHTML() {
    const ds = _drillState;
    if (!ds || !ds.sequence) return '';
    return '<div class="knj-pip-bar">' +
      ds.sequence.map((s, i) =>
        '<div class="knj-pip' +
          (i < ds.idx ? ' done' : i === ds.idx ? ' current' : '') +
        '"></div>'
      ).join('') +
    '</div>';
  }

  // Step 8 — updated _startLearningDrill with reading_mcq
  function _startLearningDrill(char, container) {
    _drillState = {
      char,
      mode: 'learn',
      sequence: [
        { type:'mcq',         reverse:false },
        { type:'mcq',         reverse:false },
        { type:'mcq',         reverse:false },
        { type:'mcq',         reverse:true  },
        { type:'mcq',         reverse:true  },
        { type:'reading_mcq'               },
        { type:'context'                   },
        { type:'context'                   },
        { type:'write'                     },
      ],
      idx: 0,
      totalCorrect: 0,
    };
    _runDrillStep(container);
  }

  function _startOnDemandDrill(char, container) {
    _drillState = {
      char,
      mode: 'ondemand',
      sequence: [
        { type:'mcq',     reverse:false },
        { type:'mcq',     reverse:true  },
        { type:'context'               },
        { type:'write'                 },
      ],
      idx: 0,
      totalCorrect: 0,
    };
    _runDrillStep(container);
  }

  // Step 8 — updated _runDrillStep to handle reading_mcq
  function _runDrillStep(container) {
    const ds = _drillState;
    if (!ds || ds.idx >= ds.sequence.length) { _showDrillComplete(container); return; }
    const step = ds.sequence[ds.idx];
    const advance = (correct) => {
      if (correct) { ds.idx++; ds.totalCorrect++; }
      setTimeout(() => _runDrillStep(container), correct ? 900 : 1400);
    };
    // Step 6c — trigger fade-in before each step renders
    container.classList.remove('knj-screen-enter');
    void container.offsetWidth;
    container.classList.add('knj-screen-enter');
    if (step.type === 'mcq') {
      _renderActiveMCQ(ds.char, container, step.reverse, advance);
    } else if (step.type === 'reading_mcq') {
      _renderReadingMCQ(ds.char, container, advance);
    } else if (step.type === 'context') {
      _renderActiveContext(ds.char, container, advance);
    } else {
      _renderActiveWrite(ds.char, container, () => { ds.idx++; _runDrillStep(container); });
    }
  }

  function _showDrillComplete(container) {
    const ds = _drillState;
    const onNodeComplete = ds && ds._onNodeComplete;

    if (onNodeComplete) {
      _drillState = null;
      setTimeout(onNodeComplete, 600);
      return;
    }

    const char   = ds ? ds.char : '';
    const k      = n5Data ? n5Data.find(d => d.char === char) : null;
    _drillState  = null;

    // Schedule a review
    if (char) scheduleReview(char, 2);

    container.innerHTML =
      '<div class="card knj-complete-card">' +
        '<div class="knj-complete-char">' + (char || '✓') + '</div>' +
        '<div style="font-size:16px;font-weight:700;margin-bottom:6px">' +
          (k ? k.meaning : 'Complete!') +
        '</div>' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:10px;color:var(--correct);margin-bottom:24px">' +
          '✓ Drill complete' +
        '</div>' +
        '<div style="display:flex;gap:8px">' +
          '<button class="btn btn-secondary" id="knjDoneHome" style="flex:1">Back to catalog</button>' +
          '<button class="btn btn-primary"   id="knjDoneReview" style="flex:1">Start SRS review</button>' +
        '</div>' +
      '</div>';

    container.querySelector('#knjDoneHome').addEventListener('click', () => renderHome(container));
    container.querySelector('#knjDoneReview').addEventListener('click', () => {
      startReviewSession(container, 'all');
    });
  }

  // ── _renderActiveMCQ() ───────────────────────────────────────── ~lines 922–991
  function _renderActiveMCQ(char, container, isReverse, onResult) {
    const k = n5Data.find(d => d.char === char);
    if (!k) return;

    const distractors = _getDistractors(k, 3);
    const allOptions  = _shuffle([
      { value: isReverse ? k.char : k.meaning, correct: true },
      ...distractors.map(c => {
        const d = n5Data.find(x => x.char === c);
        return { value: isReverse ? c : (d ? d.meaning : c), correct: false };
      })
    ]);
    const keys = ['A','B','C','D'];

    container.innerHTML =
      _pipHTML() +
      _drillBackHeader(isReverse ? 'REVERSE RECALL' : 'MEANING RECALL') +
      '<div class="card" style="padding:20px;text-align:center">' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;margin-bottom:8px">' +
          (isReverse ? 'Which kanji matches this meaning?' : 'What does this mean?') +
        '</div>' +
        (isReverse
          ? '<div style="font-size:16px;font-weight:700;padding:16px 0 8px">' + k.meaning + '</div>'
          : '<div style="font-family:\'Noto Sans JP\',sans-serif;font-size:96px;font-weight:900;line-height:1;padding:12px 0 8px">' + char + '</div>'
        ) +
        '<div class="knj-mcq-grid" id="knjMcqGrid">' +
          allOptions.map((opt, i) =>
            '<button class="knj-mcq-opt" data-correct="' + opt.correct + '">' +
              '<div class="knj-mcq-opt-key">' + keys[i] + '</div>' +
              '<div class="knj-mcq-opt-text' + (isReverse ? '" style="font-family:\'Noto Sans JP\',sans-serif;font-size:22px;font-weight:700' : '') + '">' + opt.value + '</div>' +
            '</button>'
          ).join('') +
        '</div>' +
        '<div id="knjMcqFeedback" style="display:none;margin-top:14px;text-align:left" class="knj-feedback-panel"></div>' +
      '</div>';

    container.querySelector('#knjBackBtn').addEventListener('click', () => { _drillState = null; renderHome(container); });

    const grid     = container.querySelector('#knjMcqGrid');
    const feedback = container.querySelector('#knjMcqFeedback');
    let answered   = false;

    function handleAnswer(optEl) {
      if (answered) return;
      answered = true;
      const isCorrect = optEl.dataset.correct === 'true';
      grid.querySelectorAll('.knj-mcq-opt').forEach(o => {
        if (o.dataset.correct === 'true') o.classList.add('knj-opt-correct');
        else if (o === optEl && !isCorrect) o.classList.add('knj-opt-wrong');
        else o.classList.add('knj-opt-greyed');
        o.disabled = true;
      });
      feedback.style.display = '';
      feedback.innerHTML = isCorrect
        ? '<div style="font-size:13px;color:var(--correct);font-weight:700">✓ Correct!</div>'
        : '<div style="font-size:13px;color:var(--wrong);font-weight:700;margin-bottom:6px">✗ ' +
          (isReverse ? char + ' = ' + k.meaning : k.char + ' = ' + k.meaning) + '</div>' +
          '<div style="font-size:12px;color:var(--text)">' + (k.mnemonic ? k.mnemonic.slice(0, 80) + '…' : '') + '</div>';
      onResult(isCorrect);
    }

    grid.querySelectorAll('.knj-mcq-opt').forEach(opt => {
      opt.addEventListener('click', () => handleAnswer(opt));
    });
  }

  // ── _renderReadingMCQ() ───────────────────────────────────────── Step 8 NEW
  function _renderReadingMCQ(char, container, onResult) {
    var k = n5Data.find(function(d) { return d.char === char; });
    if (!k) return;

    // Only show reading MCQ if there are actual readings to quiz
    var allReadings = [].concat(k.on || []).concat((k.kun || []).map(function(r) {
      return r.replace(/-.*$/, '').replace(/\..*$/, '');
    }));
    if (allReadings.length === 0) { onResult(true); return; }

    // Pick the most important reading (first on-reading if available, else first kun)
    var targetReading = (k.on && k.on[0]) ? k.on[0] : allReadings[0];
    var targetRomaji  = (k.on && k.on[0] && k.on_romaji && k.on_romaji[0]) ? k.on_romaji[0] : '';
    var readingType   = (k.on && k.on[0]) ? 'on-reading — used in compounds' : 'kun-reading — used standalone';

    // Generate wrong reading options from other introduced kanji
    var otherReadings = [];
    Object.keys(progress).forEach(function(c) {
      if (c === char || !progress[c].introduced_at) return;
      var other = n5Data.find(function(d) { return d.char === c; });
      if (!other) return;
      if (other.on && other.on[0]) otherReadings.push(other.on[0]);
      else if (other.kun && other.kun[0]) otherReadings.push(other.kun[0].replace(/-.*$/, '').replace(/\..*$/, ''));
    });
    // Deduplicate, exclude correct answer
    otherReadings = otherReadings.filter(function(r, i, arr) {
      return r !== targetReading && arr.indexOf(r) === i;
    });
    otherReadings = _shuffle(otherReadings).slice(0, 3);

    // Pad with generic distractors if not enough
    var genericPad = ['あ','か','な','は','ま'].filter(function(r) { return r !== targetReading; });
    while (otherReadings.length < 3) { otherReadings.push(genericPad.shift() || 'x'); }

    var options = _shuffle(
      [{ value: targetReading, correct: true }].concat(
        otherReadings.slice(0, 3).map(function(r) { return { value: r, correct: false }; })
      )
    );
    var keys = ['A','B','C','D'];

    container.innerHTML =
      _pipHTML() +
      _drillBackHeader('READING RECALL') +
      '<div class="card" style="padding:20px;text-align:center">' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;margin-bottom:8px">How is this kanji read?</div>' +
        '<div style="font-family:\'Noto Sans JP\',sans-serif;font-size:96px;font-weight:900;line-height:1;padding:12px 0 8px">' + char + '</div>' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted);margin-bottom:20px">(' + readingType + ')</div>' +
        '<div class="knj-mcq-grid" id="knjMcqGrid">' +
          options.map(function(opt, i) {
            return '<button class="knj-mcq-opt" data-correct="' + opt.correct + '">' +
              '<div class="knj-mcq-opt-key">' + keys[i] + '</div>' +
              '<div class="knj-mcq-opt-text" style="font-family:\'Noto Sans JP\',sans-serif;font-size:20px;font-weight:700">' + opt.value + '</div>' +
            '</button>';
          }).join('') +
        '</div>' +
        '<div id="knjMcqFeedback" style="display:none;margin-top:14px;text-align:left" class="knj-feedback-panel"></div>' +
      '</div>';

    container.querySelector('#knjBackBtn').addEventListener('click', function() { _drillState = null; renderHome(container); });

    var grid     = container.querySelector('#knjMcqGrid');
    var feedback = container.querySelector('#knjMcqFeedback');
    var answered = false;

    function handleAnswer(optEl) {
      if (answered) return;
      answered = true;
      var isCorrect = optEl.dataset.correct === 'true';
      grid.querySelectorAll('.knj-mcq-opt').forEach(function(o) {
        if (o.dataset.correct === 'true') o.classList.add('knj-opt-correct');
        else if (o === optEl && !isCorrect) o.classList.add('knj-opt-wrong');
        else o.classList.add('knj-opt-greyed');
        o.disabled = true;
      });
      feedback.style.display = '';
      if (isCorrect) {
        feedback.innerHTML = '<div style="font-size:13px;color:var(--correct);font-weight:700">✓ Correct!</div>' +
          (targetRomaji ? '<div style="font-size:12px;color:var(--muted);margin-top:4px">' + targetReading + ' = ' + targetRomaji + '</div>' : '');
      } else {
        feedback.innerHTML = '<div style="font-size:13px;color:var(--wrong);font-weight:700;margin-bottom:6px">✗ It\'s ' + targetReading + (targetRomaji ? ' (' + targetRomaji + ')' : '') + '</div>' +
          '<div style="font-size:12px;color:var(--text)">' + char + ' → ' + (k.mnemonic ? k.mnemonic.slice(0, 80) + (k.mnemonic.length > 80 ? '…' : '') : '') + '</div>';
      }
      onResult(isCorrect);
    }

    grid.querySelectorAll('.knj-mcq-opt').forEach(function(opt) {
      opt.addEventListener('click', function() { handleAnswer(opt); });
    });
  }

  // ── _renderActiveContext() ───────────────────────────────────── Step 16 — two-phase
  // Phase 1: fill-in-the-blank (kanji choice)
  // Phase 2: reading micro-question ("How is X read?") — appears inline after phase 1
  function _renderActiveContext(char, container, onResult) {
    var k = n5Data.find(function(d) { return d.char === char; });
    if (!k) return;

    var sentences = k.sentences || [];
    var s = sentences[Math.floor(Math.random() * sentences.length)];
    if (!s) { onResult(true); return; }

    // ── Build primary reading for Phase 2 ───────────────────────────
    var targetReading = (k.on && k.on[0])
      ? k.on[0]
      : (k.kun && k.kun[0] ? k.kun[0].replace(/-.*$/, '').replace(/\..*$/, '') : null);
    var targetRomaji = (k.on && k.on[0] && k.on_romaji && k.on_romaji[0])
      ? k.on_romaji[0]
      : (k.kun_romaji && k.kun_romaji[0] ? k.kun_romaji[0] : '');
    var readingLabel = (k.on && k.on[0]) ? 'on-reading' : 'kun-reading';

    // Build 3 wrong reading distractors from other introduced kanji
    var rdgDistractors = [];
    Object.keys(progress).forEach(function(c) {
      if (c === char || !progress[c].introduced_at) return;
      var other = n5Data.find(function(d) { return d.char === c; });
      if (!other) return;
      var r = (other.on && other.on[0])
        ? other.on[0]
        : (other.kun && other.kun[0] ? other.kun[0].replace(/-.*$/, '').replace(/\..*$/, '') : null);
      if (r && r !== targetReading) rdgDistractors.push(r);
    });
    // Deduplicate
    rdgDistractors = rdgDistractors.filter(function(r, i, arr) { return arr.indexOf(r) === i; });
    rdgDistractors = _shuffle(rdgDistractors).slice(0, 3);
    // Pad with generic kana if needed
    var pad = ['つ','に','か','も','よ','て','を','は'].filter(function(r) { return r !== targetReading; });
    while (rdgDistractors.length < 3) { rdgDistractors.push(pad.shift() || 'x'); }

    var rdgOptions = targetReading
      ? _shuffle(
          [{ value: targetReading, correct: true }].concat(
            rdgDistractors.slice(0, 3).map(function(r) { return { value: r, correct: false }; })
          )
        )
      : null;

    // ── Phase 1: fill-in-the-blank ──────────────────────────────────
    var blankJP = s.jp.replace(
      new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      '<span class="knj-context-blank">＿＿</span>'
    );

    var distractors = _getDistractors(k, 3).map(function(c) {
      var d = n5Data.find(function(x) { return x.char === c; });
      return d ? d.char : c;
    });
    var options = _shuffle(
      [{ value: char, correct: true }].concat(
        distractors.map(function(c) { return { value: c, correct: false }; })
      )
    );

    container.innerHTML =
      _pipHTML() +
      _drillBackHeader('CONTEXT') +
      '<div class="card" style="padding:20px" id="knjCtxCard">' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;margin-bottom:8px">Fill in the blank</div>' +
        '<div class="knj-context-sentence">' + blankJP + '</div>' +
        '<div style="font-size:12px;color:var(--muted);text-align:center;margin-bottom:16px">' + s.en + '</div>' +
        '<div class="knj-context-mc" id="knjCtxMc">' +
          options.map(function(opt) {
            return '<button class="knj-context-opt" data-correct="' + opt.correct + '">' + opt.value + '</button>';
          }).join('') +
        '</div>' +
        '<div id="knjCtxFeedback" style="display:none;margin-top:10px" class="knj-feedback-panel"></div>' +
      '</div>';

    container.querySelector('#knjBackBtn').addEventListener('click', function() { _drillState = null; renderHome(container); });

    var mc       = container.querySelector('#knjCtxMc');
    var feedback = container.querySelector('#knjCtxFeedback');
    var phase1Answered = false;

    // ── Phase 2: reading micro-question (injected after phase 1) ────
    function _showReadingPhase(phase1Correct) {
      // If no valid reading data, skip straight to onResult
      if (!rdgOptions || !targetReading) { onResult(phase1Correct); return; }

      feedback.innerHTML +=
        '<div class="knj-ctx-rdg-panel" id="knjCtxRdgPanel">' +
          '<div class="knj-ctx-rdg-label">How is <span style="font-family:\'Noto Sans JP\',sans-serif;font-size:14px;font-weight:700;color:var(--accent3)">' + char + '</span> read? <span style="font-size:8px;opacity:.7">(' + readingLabel + ')</span></div>' +
          '<div class="knj-ctx-rdg-opts" id="knjCtxRdgOpts">' +
            rdgOptions.map(function(opt) {
              return '<button class="knj-ctx-rdg-opt" data-correct="' + opt.correct + '">' + opt.value + '</button>';
            }).join('') +
          '</div>' +
          '<div id="knjCtxRdgFb" style="display:none;margin-top:8px"></div>' +
        '</div>';

      var rdgOpts = feedback.querySelector('#knjCtxRdgOpts');
      var rdgFb   = feedback.querySelector('#knjCtxRdgFb');
      var rdgAnswered = false;

      rdgOpts.querySelectorAll('.knj-ctx-rdg-opt').forEach(function(btn) {
        btn.addEventListener('click', function() {
          if (rdgAnswered) return;
          rdgAnswered = true;
          var rdgCorrect = btn.dataset.correct === 'true';
          rdgOpts.querySelectorAll('.knj-ctx-rdg-opt').forEach(function(b) {
            if (b.dataset.correct === 'true') b.classList.add('knj-opt-correct');
            else if (b === btn && !rdgCorrect) b.classList.add('knj-opt-wrong');
            else b.classList.add('knj-opt-greyed');
            b.disabled = true;
          });
          rdgFb.style.display = '';
          if (rdgCorrect) {
            rdgFb.innerHTML =
              '<div style="font-size:12px;color:var(--correct);font-weight:700">✓ ' + targetReading +
              (targetRomaji ? ' <span style="font-family:\'Space Mono\',monospace;font-size:10px;color:var(--muted);font-weight:400">(' + targetRomaji + ')</span>' : '') +
              '</div>' +
              (s.grammar_note ? '<div class="knj-grammar-note" style="margin-top:6px">' + s.grammar_note + '</div>' : '');
          } else {
            rdgFb.innerHTML =
              '<div style="font-size:12px;color:var(--wrong);font-weight:700">✗ It\'s ' + targetReading +
              (targetRomaji ? ' <span style="font-family:\'Space Mono\',monospace;font-size:10px;color:var(--muted);font-weight:400">(' + targetRomaji + ')</span>' : '') +
              '</div>' +
              (s.grammar_note ? '<div class="knj-grammar-note" style="margin-top:6px">' + s.grammar_note + '</div>' : '');
          }
          // Both phases done — overall result = both correct
          onResult(phase1Correct && rdgCorrect);
        });
      });
    }

    mc.querySelectorAll('.knj-context-opt').forEach(function(opt) {
      opt.addEventListener('click', function() {
        if (phase1Answered) return;
        phase1Answered = true;
        var isCorrect = opt.dataset.correct === 'true';
        mc.querySelectorAll('.knj-context-opt').forEach(function(o) {
          if (o.dataset.correct === 'true') o.classList.add('knj-opt-correct');
          else if (o === opt && !isCorrect) o.classList.add('knj-opt-wrong');
          o.disabled = true;
        });
        feedback.style.display = '';
        feedback.innerHTML = isCorrect
          ? '<div style="font-size:13px;color:var(--correct);font-weight:700">✓ Correct!</div>'
          : '<div style="font-size:13px;color:var(--wrong);font-weight:700;margin-bottom:4px">✗ The answer was: <span style="font-family:\'Noto Sans JP\',sans-serif;font-size:18px">' + char + '</span></div>';
        _showReadingPhase(isCorrect);
      });
    });
  }

  // ── canvas setup ─────────────────────────────────────────────── ~lines 1041–1076
  function _setupCanvas(container, char) {
    const canvas  = container.querySelector('canvas.knj-canvas');
    if (!canvas) return;
    const ctx     = canvas.getContext('2d');
    const W       = canvas.width  = 240;
    const H       = canvas.height = 240;
    let drawing   = false;
    let lastX = 0, lastY = 0;

    ctx.strokeStyle = 'var(--text, #f1f1f4)';
    ctx.lineWidth   = 4;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';

    function getPos(e) {
      const r = canvas.getBoundingClientRect();
      const src = e.touches ? e.touches[0] : e;
      return { x: (src.clientX - r.left) * (W / r.width), y: (src.clientY - r.top) * (H / r.height) };
    }

    canvas.addEventListener('pointerdown', e => {
      drawing = true;
      const p = getPos(e); lastX = p.x; lastY = p.y;
      ctx.beginPath(); ctx.moveTo(p.x, p.y);
    });
    canvas.addEventListener('pointermove', e => {
      if (!drawing) return;
      const p = getPos(e);
      ctx.lineTo(p.x, p.y); ctx.stroke();
      lastX = p.x; lastY = p.y;
    });
    canvas.addEventListener('pointerup',     () => { drawing = false; ctx.beginPath(); });
    canvas.addEventListener('pointercancel', () => { drawing = false; ctx.beginPath(); });

    const clearBtn = container.querySelector('#knjClearBtn');
    if (clearBtn) clearBtn.addEventListener('click', () => ctx.clearRect(0, 0, W, H));
  }

  // ── _renderActiveWrite() ─────────────────────────────────────── ~lines 1078–1104
  function _renderActiveWrite(char, container, onComplete) {
    container.innerHTML =
      _pipHTML() +
      _drillBackHeader('WRITE') +
      '<div class="card" style="padding:20px;text-align:center">' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;margin-bottom:8px">Write this character</div>' +
        '<div class="knj-canvas-wrap">' +
          '<div class="knj-canvas-model" id="knjCanvasModel">' + char + '</div>' +
          '<canvas class="knj-canvas" width="240" height="240"></canvas>' +
        '</div>' +
        '<div class="knj-write-actions">' +
          '<button class="btn btn-secondary" id="knjClearBtn">Clear</button>' +
          '<button class="btn btn-secondary" id="knjRevealBtn">Show ghost</button>' +
          '<button class="btn btn-secondary knj-grade-miss" id="knjWriteMissed">Missed</button>' +
          '<button class="btn btn-primary knj-grade-got" id="knjWriteGot">Got it ✓</button>' +
        '</div>' +
      '</div>';

    container.querySelector('#knjBackBtn').addEventListener('click', () => { _drillState = null; renderHome(container); });

    _setupCanvas(container, char);

    container.querySelector('#knjRevealBtn').addEventListener('click', () => {
      container.querySelector('#knjCanvasModel').style.opacity = '0.55';
    });

    // Step 9 — miss penalty queue
    container.querySelector('#knjWriteMissed').addEventListener('click', () => {
      // Inject 2 MCQ penalty questions + 1 more write before completing
      var ds = _drillState;
      if (ds && ds.mode === 'learn') {
        ds.sequence.splice(ds.idx + 1, 0,
          { type:'mcq', reverse:false },
          { type:'mcq', reverse:true  },
          { type:'write' }
        );
      }
      onComplete(false);
    });

    container.querySelector('#knjWriteGot').addEventListener('click', () => {
      onComplete(true);
    });
  }

  // ── startReviewSession() ─────────────────────────────────────── ~lines 1106–1147
  function startReviewSession(container, mode, chars) {
    if (!n5Data) { renderHome(container); return; }

    let queue;
    const now = Date.now();

    if (mode === 'due') {
      queue = Object.values(progress)
        .filter(p => p.stage >= STAGE_SRS && p.srs_due && p.srs_due <= now)
        .sort((a, b) => (a.srs_due || 0) - (b.srs_due || 0))
        .map(p => p.char);
    } else if (mode === 'select') {
      queue = chars || [];
    } else {
      // 'all' — all introduced
      queue = Object.values(progress)
        .filter(p => p.introduced_at)
        .map(p => p.char);
    }

    queue = _shuffle(queue);

    if (queue.length === 0) {
      _toast('Nothing to review!', 'var(--warn)');
      renderHome(container);
      return;
    }

    _drillState = { mode:'review', queue, qIdx:0, correct:0, wrong:0 };
    _nextReviewItem(container);
  }

  function _nextReviewItem(container) {
    const ds = _drillState;
    if (!ds || ds.qIdx >= ds.queue.length) {
      _showReviewSummary(container);
      return;
    }
    const char = ds.queue[ds.qIdx];
    const k    = n5Data.find(d => d.char === char);
    if (!k) { ds.qIdx++; _nextReviewItem(container); return; }

    // Step 6c — fade-in on each review item
    container.classList.remove('knj-screen-enter');
    void container.offsetWidth;
    container.classList.add('knj-screen-enter');

    // Alternate between MCQ and write
    if (ds.qIdx % 3 === 2) {
      _renderSRSWrite(char, container, (grade) => {
        scheduleReview(char, grade);
        if (grade >= 1) ds.correct++; else ds.wrong++;
        ds.qIdx++;
        _nextReviewItem(container);
      });
    } else {
      _renderSRSMCQ(char, container, (grade) => {
        scheduleReview(char, grade);
        if (grade >= 1) ds.correct++; else ds.wrong++;
        ds.qIdx++;
        _nextReviewItem(container);
      });
    }
  }

  // ── _renderSRSMCQ() ──────────────────────────────────────────── ~lines 1149–1210
  function _renderSRSMCQ(char, container, onGrade) {
    const k = n5Data.find(d => d.char === char);
    if (!k) return;
    const ds = _drillState;

    container.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">' +
        '<button class="btn btn-secondary" id="knjSRSBack" style="font-size:12px;padding:7px 12px">← End review</button>' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted);flex:1;text-align:right">' +
          (ds.qIdx + 1) + ' / ' + ds.queue.length +
        '</div>' +
      '</div>' +
      '<div class="card" style="padding:20px;text-align:center">' +
        '<div style="font-family:\'Noto Sans JP\',sans-serif;font-size:80px;font-weight:900;line-height:1;padding:16px 0">' + char + '</div>' +
        '<div id="knjSRSAnswer" style="display:none">' +
          '<div style="font-size:18px;font-weight:700;margin-bottom:8px;color:var(--text)">' + k.meaning + '</div>' +
          _renderPronunciationBlock(k) +
          '<div class="knj-srs-grade-row">' +
            '<button class="knj-grade-btn knj-grade-miss" data-grade="0">Miss</button>' +
            '<button class="knj-grade-btn knj-grade-hard" data-grade="1">Hard</button>' +
            '<button class="knj-grade-btn knj-grade-got"  data-grade="2">Got it ✓</button>' +
          '</div>' +
        '</div>' +
        '<div id="knjSRSReveal">' +
          '<button class="btn btn-secondary" id="knjRevealMeaning" style="width:100%;margin-top:8px">Reveal meaning</button>' +
        '</div>' +
      '</div>';

    container.querySelector('#knjSRSBack').addEventListener('click', () => {
      _drillState = null; renderHome(container, 'reviews');
    });
    container.querySelector('#knjRevealMeaning').addEventListener('click', () => {
      container.querySelector('#knjSRSAnswer').style.display = '';
      container.querySelector('#knjSRSReveal').style.display = 'none';
    });
    container.querySelectorAll('.knj-grade-btn').forEach(btn => {
      btn.addEventListener('click', () => onGrade(parseInt(btn.dataset.grade)));
    });
  }

  // ── _renderSRSWrite() ────────────────────────────────────────── ~lines 1212–1235
  function _renderSRSWrite(char, container, onGrade) {
    const k = n5Data.find(d => d.char === char);
    if (!k) return;
    const ds = _drillState;

    container.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">' +
        '<button class="btn btn-secondary" id="knjSRSBack" style="font-size:12px;padding:7px 12px">← End review</button>' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted);flex:1;text-align:right">' +
          (ds.qIdx + 1) + ' / ' + ds.queue.length +
        '</div>' +
      '</div>' +
      '<div class="card" style="padding:20px;text-align:center">' +
        '<div style="font-size:14px;font-weight:700;margin-bottom:4px">' + k.meaning + '</div>' +
        '<div style="font-size:11px;color:var(--muted);margin-bottom:12px;font-family:\'Space Mono\',monospace">' +
          (k.on && k.on[0] ? k.on[0] : (k.kun && k.kun[0] ? k.kun[0].replace(/-.*$/,'') : '')) +
        '</div>' +
        '<div class="knj-canvas-wrap">' +
          '<div class="knj-canvas-model" id="knjCanvasModel">' + char + '</div>' +
          '<canvas class="knj-canvas" width="240" height="240"></canvas>' +
        '</div>' +
        '<div class="knj-write-actions">' +
          '<button class="btn btn-secondary" id="knjClearBtn">Clear</button>' +
          '<button class="btn btn-secondary" id="knjRevealBtn">Show ghost</button>' +
        '</div>' +
        '<div class="knj-srs-grade-row" style="margin-top:12px">' +
          '<button class="knj-grade-btn knj-grade-miss" data-grade="0">Miss</button>' +
          '<button class="knj-grade-btn knj-grade-hard" data-grade="1">Hard</button>' +
          '<button class="knj-grade-btn knj-grade-got"  data-grade="2">Got it ✓</button>' +
        '</div>' +
      '</div>';

    container.querySelector('#knjSRSBack').addEventListener('click', () => {
      _drillState = null; renderHome(container, 'reviews');
    });
    _setupCanvas(container, char);
    container.querySelector('#knjRevealBtn').addEventListener('click', () => {
      container.querySelector('#knjCanvasModel').style.opacity = '0.55';
    });
    container.querySelectorAll('.knj-grade-btn').forEach(btn => {
      btn.addEventListener('click', () => onGrade(parseInt(btn.dataset.grade)));
    });
  }

  // ── _showReviewSummary() ─────────────────────────────────────── ~lines 1237–1262
  function _showReviewSummary(container) {
    const ds = _drillState;
    const correct = ds ? ds.correct : 0;
    const total   = ds ? (ds.correct + ds.wrong) : 0;
    const pct     = total > 0 ? Math.round(correct / total * 100) : 0;
    _drillState   = null;

    container.innerHTML =
      '<div class="card" style="text-align:center;padding:32px 24px">' +
        '<div style="font-size:36px;margin-bottom:12px">' + (pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '😅') + '</div>' +
        '<div style="font-size:20px;font-weight:700;margin-bottom:6px">Review complete</div>' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:13px;color:var(--correct);margin-bottom:20px">' +
          correct + ' / ' + total + ' correct (' + pct + '%)' +
        '</div>' +
        '<button class="btn btn-primary" id="knjSummaryHome" style="width:100%">Back to home</button>' +
      '</div>';

    container.querySelector('#knjSummaryHome').addEventListener('click', () => renderHome(container));
  }

  // ── _renderReadingNode() ─────────────────────────────────────── Part 3 FULL
  function _renderReadingNode(char, container, onComplete) {
    var k = n5Data.find(function(d) { return d.char === char; });
    if (!k) { onComplete(); return; }

    var sentences = k.sentences || [];
    var s = sentences[0];
    if (!s) { onComplete(); return; }

    // Build tappable sentence — wrap each known kanji in a tap span
    var knownChars = Object.keys(progress).filter(function(c) {
      return progress[c] && progress[c].introduced_at !== null;
    });
    var jpWithTaps = s.jp;
    knownChars.forEach(function(c) {
      jpWithTaps = jpWithTaps.replace(
        new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        '<span class="knj-tap-kanji" data-char="' + c + '">' + c + '</span>'
      );
    });

    // Prefer furigana if available (it may already contain ruby tags)
    var sentHTML = s.furi || jpWithTaps;

    // Build comprehension MCQ options
    var mcqOptions = _shuffle(
      [{ value: k.meaning, correct: true }].concat(
        _getDistractors(k, 3).map(function(c) {
          var d = n5Data.find(function(x) { return x.char === c; });
          return { value: d ? d.meaning : c, correct: false };
        })
      )
    );

    container.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">' +
        '<button class="btn btn-secondary" id="knjBackBtn" style="font-size:12px;padding:7px 12px">← Back</button>' +
        '<div style="flex:1;font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:2px;color:var(--muted);text-transform:uppercase">READING NODE</div>' +
      '</div>' +
      '<div class="card" style="padding:20px;margin-bottom:14px">' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted);text-transform:uppercase;margin-bottom:10px">Tap any kanji to see its reading</div>' +
        '<div style="font-family:\'Noto Sans JP\',sans-serif;font-size:20px;line-height:2.6;margin-bottom:8px" id="knjReadSent">' + sentHTML + '</div>' +
        '<div style="font-size:13px;color:var(--muted)">' + s.en + '</div>' +
        (s.grammar_note ? '<div class="knj-grammar-note">' + s.grammar_note + '</div>' : '') +
      '</div>' +
      '<div id="knjReadPopup" style="display:none"></div>' +
      '<div class="card" style="padding:16px;margin-bottom:14px" id="knjReadQ">' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted);text-transform:uppercase;margin-bottom:10px">Comprehension check</div>' +
        '<div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:12px">What does <span style="font-family:\'Noto Sans JP\',sans-serif;font-size:18px;color:var(--accent3)">' + char + '</span> mean in this sentence?</div>' +
        '<div class="knj-context-mc" id="knjReadMcq">' +
          mcqOptions.map(function(opt) {
            return '<button class="knj-context-opt" data-correct="' + opt.correct + '">' + opt.value + '</button>';
          }).join('') +
        '</div>' +
        '<div id="knjReadFb" style="display:none;margin-top:10px" class="knj-feedback-panel"></div>' +
      '</div>';

    container.querySelector('#knjBackBtn').addEventListener('click', function() { renderHome(container, 'path'); });

    // Tappable kanji popup — click anywhere outside closes it
    var popup = container.querySelector('#knjReadPopup');
    container.addEventListener('click', function(e) {
      var tapEl = e.target.closest('.knj-tap-kanji');
      if (!tapEl) {
        // close popup on outside click (but don't steal MCQ clicks)
        if (!e.target.closest('#knjReadQ') && !e.target.closest('#knjReadPopup')) {
          popup.style.display = 'none';
        }
        return;
      }
      var tapChar = tapEl.dataset.char;
      var tapK    = n5Data.find(function(d) { return d.char === tapChar; });
      if (!tapK) return;
      var tapP    = progress[tapChar] || {};
      var tapRank = _getRank(tapP);

      popup.style.display = '';
      popup.innerHTML =
        '<div class="card" style="padding:14px;margin-bottom:14px;border-color:var(--accent3,#6d78ff)">' +
          '<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">' +
            '<span style="font-family:\'Noto Sans JP\',sans-serif;font-size:40px;font-weight:900">' + tapChar + '</span>' +
            '<div>' +
              '<div style="font-size:14px;font-weight:700;color:var(--text)">' + tapK.meaning + '</div>' +
              (tapRank ? '<div style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted)">' + tapRank.icon + ' ' + tapRank.label + '</div>' : '') +
            '</div>' +
          '</div>' +
          '<div class="knj-rdg-row">' +
            (tapK.on || []).map(function(kana, i) {
              var rom = (tapK.on_romaji || [])[i] || '';
              return '<div class="knj-rdg-card">' +
                '<div class="knj-rdg-type">On</div>' +
                '<div class="knj-rdg-kana">' + kana + '</div>' +
                (rom ? '<div class="knj-rdg-romaji">' + rom + '</div>' : '') +
              '</div>';
            }).join('') +
            (tapK.kun || []).slice(0, 2).map(function(kana, i) {
              var rom = (tapK.kun_romaji || [])[i] || '';
              var disp = kana.replace(/-.*$/, '').replace(/\..*$/, '');
              return '<div class="knj-rdg-card">' +
                '<div class="knj-rdg-type">Kun</div>' +
                '<div class="knj-rdg-kana">' + disp + '</div>' +
                (rom ? '<div class="knj-rdg-romaji">' + rom + '</div>' : '') +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>';
    });

    // Comprehension MCQ
    var mcq = container.querySelector('#knjReadMcq');
    var fb  = container.querySelector('#knjReadFb');
    var answered = false;
    mcq.querySelectorAll('.knj-context-opt').forEach(function(opt) {
      opt.addEventListener('click', function() {
        if (answered) return;
        answered = true;
        var isCorrect = opt.dataset.correct === 'true';
        mcq.querySelectorAll('.knj-context-opt').forEach(function(o) {
          if (o.dataset.correct === 'true') o.classList.add('knj-opt-correct');
          else if (o === opt && !isCorrect) o.classList.add('knj-opt-wrong');
          o.disabled = true;
        });
        fb.style.display = '';
        fb.innerHTML = isCorrect
          ? '<div style="font-size:13px;color:var(--correct);font-weight:700;margin-bottom:12px">✓ Correct!</div>' +
            '<button class="btn btn-primary" id="knjReadContinue" style="width:100%">Continue →</button>'
          : '<div style="font-size:13px;color:var(--wrong);font-weight:700;margin-bottom:6px">✗ ' + char + ' = ' + k.meaning + '</div>' +
            '<button class="btn btn-primary" id="knjReadContinue" style="width:100%;margin-top:8px">Continue →</button>';
        fb.querySelector('#knjReadContinue').addEventListener('click', onComplete);
      });
    });
  }

  // ── _renderReinforceNode() ───────────────────────────────────── Part 3 FULL
  function _renderReinforceNode(targetChar, container, onComplete) {
    // Pick up to 2 other introduced kanji
    var others = Object.values(progress)
      .filter(function(p) { return p.char !== targetChar && p.introduced_at !== null && p.stage >= STAGE_SRS; })
      .sort(function(a, b) { return (a.last_seen || 0) - (b.last_seen || 0); })
      .slice(0, 2)
      .map(function(p) { return p.char; });

    var allChars = [targetChar].concat(others);
    var idx = 0;

    function nextChar() {
      if (idx >= allChars.length) { onComplete(); return; }
      var char = allChars[idx]; idx++;
      _drillState = {
        char: char, mode: 'reinforce',
        sequence: [
          { type:'mcq', reverse:false },
          { type:'mcq', reverse:true  },
          { type:'context'            },
        ],
        idx: 0, totalCorrect: 0,
        _onNodeComplete: nextChar,
      };
      _runDrillStep(container);
    }
    nextChar();
  }

  // ── _renderRankCheckNode() ───────────────────────────────────── Part 3 FULL
  function _renderRankCheckNode(char, container, onComplete) {
    var k = n5Data.find(function(d) { return d.char === char; });
    var p = progress[char] || {};
    var rank = _getRank(p);
    if (!rank) { onComplete(); return; }

    var rankColors = { academy:'#888780', genin:'#185FA5', chunin:'#534AB7', jonin:'#EF9F27', hokage:'#1D9E75' };
    var color = rankColors[rank.id] || '#8B7CF6';

    container.innerHTML =
      '<div class="card" style="text-align:center;padding:32px 24px">' +
        '<div style="font-size:48px;margin-bottom:8px">' + rank.icon + '</div>' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Rank Advance</div>' +
        '<div style="font-family:\'Noto Sans JP\',sans-serif;font-size:60px;font-weight:900;color:' + color + ';margin-bottom:4px">' + char + '</div>' +
        '<div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:16px">' + (k ? k.meaning : '') + '</div>' +
        '<div style="font-size:26px;font-weight:800;color:' + color + ';margin-bottom:6px">' + rank.label + '</div>' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted);margin-bottom:24px">' +
          'SRS interval: ' + Math.round((p.srs_interval_ms || 0) / 86400000) + 'd · ' +
          'Reviews: ' + (p.review_count || 0) + ' · ' +
          'Accuracy: ' + ((p.correct_total || 0) + (p.wrong_total || 0) > 0
            ? Math.round((p.correct_total || 0) / ((p.correct_total || 0) + (p.wrong_total || 0)) * 100) + '%'
            : '—') +
        '</div>' +
        '<button class="btn btn-primary" id="knjRankContinue" style="width:100%">Keep going →</button>' +
      '</div>';

    container.querySelector('#knjRankContinue').addEventListener('click', onComplete);
  }

  // ── _renderDataError() ────────────────────────────────────────── ~lines 1264–1275
  function _renderDataError(container) {
    if (!container) container = document.getElementById('knjModeInner');
    container.innerHTML =
      '<div style="padding:40px 16px;text-align:center;color:var(--wrong);font-family:\'Space Mono\',monospace;font-size:11px">' +
        '⚠ Could not load kanji data.<br><br>' +
        '<span style="color:var(--muted);font-size:10px">Make sure you\'re running a local server: python3 -m http.server 8080</span>' +
      '</div>';
  }

  // ── openKanjiMode() ───────────────────────────────────────────── ~lines 1277–1284
  async function openKanjiMode() {
    const inner = document.getElementById('knjModeInner');
    if (!inner) return;

    inner.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;padding:40px;color:var(--muted);font-family:\'Space Mono\',monospace;font-size:12px">Loading…</div>';

    const ok = await init();
    if (!ok) { _renderDataError(inner); return; }

    renderHome(inner);

    // Step 6e.7 — Furigana toggle — single delegated listener, added once
    if (inner && !inner._furiDel) {
      inner._furiDel = true;
      inner.addEventListener('click', function(e) {
        var btn = e.target.closest('.knj-furi-toggle');
        if (!btn) return;
        var target = document.getElementById(btn.dataset.target);
        if (!target) return;
        var sentDiv = target.querySelector('.knj-sent-ruby');
        if (!sentDiv) return;
        var nowHidden = sentDiv.classList.toggle('knj-furi-hidden');
        btn.textContent = nowHidden ? '▼ show furigana' : '▲ hide furigana';
        try { localStorage.setItem(LS_FURI_PREF, nowHidden ? 'hide' : 'show'); } catch (_) {}
      });
    }
  }

  // ── Legacy stubs ──────────────────────────────────────────────── ~lines 1286–1296
  function renderDrillCard(char, container) { _startLearningDrill(char, container || document.getElementById('knjModeInner')); }
  function renderMCQDrill(char, container) { _renderActiveMCQ(char, container || document.getElementById('knjModeInner'), false, () => {}); }
  function renderContextDrill(char, container) { _renderActiveContext(char, container || document.getElementById('knjModeInner'), () => {}); }
  function renderWriteDrill(char, container) { _renderActiveWrite(char, container || document.getElementById('knjModeInner'), () => {}); }

  // ── PUBLIC API ────────────────────────────────────────────────── ~lines 1298–1304
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
