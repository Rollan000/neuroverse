// ============================================================
// KANJI PROGRESSION ENGINE  — kanji_progression.js
// Neuroverse · KNJ Module
//
// Rewrite: Steps 1–6 — CSS injection, 3-tab home, Naruto ranks,
//           Gacha picker, detail modal, streak-based drill engine
// ============================================================

const KNJ_ENGINE = (() => {

  // ── Constants ────────────────────────────────────────────
  const R2_N5_PATH    = 'data/kanji_n5_data.json';
  const LS_PROGRESS   = 'knj_progress';
  const LS_THEME      = 'knj_theme';
  const LS_NEW_TODAY  = 'knj_new_today';
  const SS_N5_CACHE   = 'knj_n5_cache';

  const STAGE_LOCKED   = 0;
  const STAGE_INTRO    = 1;
  const STAGE_SRS      = 5;
  const STAGE_MASTERED = 6;

  const MAX_NEW_PER_DAY = 5;

  const INTERVAL_8H  = 8  * 3600 * 1000;
  const INTERVAL_24H = 24 * 3600 * 1000;
  const INTERVAL_7D  = 7  * 86400 * 1000;
  const INTERVAL_21D = 21 * 86400 * 1000;
  const INTERVAL_60D = 60 * 86400 * 1000;
  const MASTERY_MS   = INTERVAL_60D;

  const RANKS = [
    { id:'academy', label:'Academy', icon:'🎓', min:0              },
    { id:'genin',   label:'Genin',   icon:'🟦', min:INTERVAL_24H  },
    { id:'chunin',  label:'Chūnin',  icon:'🟣', min:INTERVAL_7D   },
    { id:'jonin',   label:'Jōnin',   icon:'🌟', min:INTERVAL_21D  },
    { id:'hokage',  label:'Hokage',  icon:'👑', min:INTERVAL_60D  },
  ];

  // ── Injected CSS ─────────────────────────────────────────
  const KNJ_CSS = `
:root {
  --knj-academy-bg: rgba(80,80,110,0.15); --knj-academy-border: rgba(140,140,200,0.35);
  --knj-genin-bg:   rgba(109,120,255,0.12); --knj-genin-border: rgba(109,120,255,0.45);
  --knj-chunin-bg:  rgba(154,124,255,0.15); --knj-chunin-border: rgba(154,124,255,0.45);
  --knj-jonin-bg:   rgba(255,200,50,0.12);  --knj-jonin-border: rgba(255,200,50,0.45);
  --knj-hokage-bg:  rgba(0,255,157,0.12);   --knj-hokage-border: rgba(0,255,157,0.45);
  --stage-mastered-bg: rgba(0,255,157,0.08); --stage-mastered-border: rgba(0,255,157,0.3);
  --stage-mastered-text: #00ff9d;
  --stage-srs-bg: rgba(109,120,255,0.10); --stage-srs-border: rgba(109,120,255,0.35);
  --stage-context-bg: rgba(154,124,255,0.10); --stage-context-border: rgba(154,124,255,0.3);
  --stage-intro-bg: var(--surface,#12121f); --stage-intro-border: var(--accent3,#6d78ff);
  --stage-locked-bg: var(--surface2,#1a1a2e); --stage-locked-border: var(--border,#2a2a3e);
}
[data-theme="day"] {
  --knj-academy-bg: #f0f0ff; --knj-academy-border: #b0b0dd;
  --knj-genin-bg:   #dbeafe; --knj-genin-border: #93c5fd;
  --knj-chunin-bg:  #ede9fe; --knj-chunin-border: #c4b5fd;
  --knj-jonin-bg:   #fef9c3; --knj-jonin-border: #fde047;
  --knj-hokage-bg:  #d1fae5; --knj-hokage-border: #6ee7b7;
  --stage-mastered-bg: #d1fae5; --stage-mastered-border: #6ee7b7;
  --stage-mastered-text: #065f46;
  --stage-srs-bg: #dbeafe; --stage-srs-border: #93c5fd;
  --stage-context-bg: #ede9fe; --stage-context-border: #c4b5fd;
  --stage-intro-bg: #ffffff; --stage-intro-border: #6d78ff;
  --stage-locked-bg: #f3f4f6; --stage-locked-border: #d1d5db;
}
.knj-tabs{display:flex;gap:4px;margin-bottom:16px;background:var(--surface2,#1a1a2e);border-radius:10px;padding:4px}
.knj-tab{flex:1;padding:8px 4px;border:none;background:transparent;color:var(--muted,#888);font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;border-radius:7px;transition:all .18s}
.knj-tab-active{background:var(--surface,#12121f);color:var(--text,#f1f1f4);font-weight:700;box-shadow:0 1px 4px rgba(0,0,0,.3)}
.knj-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:8px}
.knj-cell{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:10px 4px 8px;border-radius:10px;border:1px solid var(--border,#2a2a3e);background:var(--surface2,#1a1a2e);cursor:pointer;transition:transform .12s,box-shadow .12s;position:relative;min-height:72px}
.knj-cell:hover{transform:translateY(-2px);box-shadow:0 4px 14px rgba(0,0,0,.25)}
.knj-cell-char{font-family:'Noto Sans JP',sans-serif;font-size:28px;font-weight:900;line-height:1}
.knj-cell-label{font-family:'Space Mono',monospace;font-size:8px;letter-spacing:.04em;text-transform:uppercase;color:var(--muted,#888)}
.knj-cell-lock{position:absolute;top:3px;right:4px;font-size:9px;opacity:.5}
.knj-rank-badge{position:absolute;top:3px;left:4px;font-size:9px}
.knj-rank-academy{background:var(--knj-academy-bg);border-color:var(--knj-academy-border)}
.knj-rank-genin{background:var(--knj-genin-bg);border-color:var(--knj-genin-border)}
.knj-rank-chunin{background:var(--knj-chunin-bg);border-color:var(--knj-chunin-border)}
.knj-rank-jonin{background:var(--knj-jonin-bg);border-color:var(--knj-jonin-border)}
.knj-rank-hokage{background:var(--knj-hokage-bg);border-color:var(--knj-hokage-border)}
.knj-locked{background:var(--stage-locked-bg);border-color:var(--stage-locked-border);opacity:.45;cursor:default}
.knj-cell.knj-intro-ready{border-color:var(--accent3,#6d78ff);background:var(--stage-intro-bg)}
@keyframes knjAdvance{0%{transform:scale(1)}40%{transform:scale(1.18)}100%{transform:scale(1)}}
.knj-stage-advance{animation:knjAdvance .5s ease}
.knj-stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px}
.knj-stat-card{background:var(--surface2,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:10px;padding:10px 8px;display:flex;flex-direction:column;align-items:center;gap:3px}
.knj-stat-val{font-family:'Space Mono',monospace;font-size:22px;font-weight:700;color:var(--text,#f1f1f4)}
.knj-stat-label{font-family:'Space Mono',monospace;font-size:8px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted,#888)}
.knj-review-cta{display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--surface2,#1a1a2e);border:1px solid var(--stage-srs-border);border-radius:12px;padding:14px 16px;margin-bottom:14px}
.knj-cta-title{font-size:14px;font-weight:700;color:var(--text,#f1f1f4);margin-bottom:2px}
.knj-cta-sub{font-family:'Space Mono',monospace;font-size:10px;color:var(--muted,#888)}
.knj-due-badge{background:var(--wrong,#ff4d4d);color:#fff;font-family:'Space Mono',monospace;font-size:10px;font-weight:700;border-radius:6px;padding:3px 8px}
.knj-gacha-cta{display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--surface2,#1a1a2e);border:1px solid var(--accent3,#6d78ff);border-radius:12px;padding:14px 16px;margin-bottom:14px;cursor:pointer;transition:background .15s}
.knj-gacha-cta:hover{background:rgba(109,120,255,0.08)}
.knj-legend{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;padding-top:14px;border-top:1px solid var(--border,#2a2a3e)}
.knj-leg-item{display:flex;align-items:center;gap:5px;font-family:'Space Mono',monospace;font-size:9px;color:var(--muted,#888)}
.knj-leg-swatch{width:14px;height:14px;border-radius:4px;border:1px solid;flex-shrink:0}
.knj-theme-toggle{display:flex;align-items:center;gap:6px;background:var(--surface2,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:20px;padding:5px 10px;cursor:pointer;font-family:'Space Mono',monospace;font-size:10px;color:var(--text,#f1f1f4);transition:all .15s}
.knj-theme-toggle:hover{border-color:var(--accent3,#6d78ff)}
.knj-theme-dot{width:10px;height:10px;border-radius:50%;background:var(--accent3,#6d78ff);flex-shrink:0}
.knj-intro-layout{display:grid;grid-template-columns:1fr;gap:14px}
@media(min-width:700px){.knj-intro-layout{grid-template-columns:3fr 2fr}}
.knj-hero-char{font-family:'Noto Sans JP',sans-serif;font-size:96px;font-weight:900;line-height:1;text-align:center;padding:10px 0;color:var(--text,#f1f1f4)}
.knj-meaning-en{font-size:22px;font-weight:800;text-align:center;margin-bottom:12px;color:var(--text,#f1f1f4)}
.knj-reading-row{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:12px}
.knj-reading-group{display:flex;flex-direction:column;gap:2px}
.knj-reading-label{font-family:'Space Mono',monospace;font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted,#888)}
.knj-reading-val{font-family:'Noto Sans JP',sans-serif;font-size:15px;font-weight:700;color:var(--text,#f1f1f4)}
.knj-sub-label{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#888);margin-bottom:7px;margin-top:14px}
.knj-mnemonic-box{font-size:13px;line-height:1.65;color:var(--text,#f1f1f4);background:var(--surface2,#1a1a2e);border-radius:8px;padding:10px 14px;border-left:3px solid var(--accent3,#6d78ff)}
.knj-sentence-block{padding:8px 0;border-bottom:1px solid var(--border,#2a2a3e)}
.knj-sentence-block:last-child{border-bottom:none}
.knj-jp-sentence{font-family:'Noto Sans JP',sans-serif;font-size:16px;line-height:1.7;margin-bottom:4px;color:var(--text,#f1f1f4)}
.knj-en-sentence{font-size:12px;color:var(--muted,#888);line-height:1.5}
.knj-source-tag{font-family:'Space Mono',monospace;font-size:9px;color:var(--accent3,#6d78ff);margin-left:6px;opacity:.8}
.knj-target{color:var(--accent3,#6d78ff);font-weight:700}
.knj-jlpt-badge{background:var(--accent3,#6d78ff);color:#fff;font-family:'Space Mono',monospace;font-size:9px;font-weight:700;border-radius:5px;padding:2px 6px;margin-left:6px}
.knj-track-pill{font-family:'Space Mono',monospace;font-size:9px;font-weight:700;border-radius:5px;padding:2px 7px;letter-spacing:.06em}
.knj-pill-n5{background:rgba(109,120,255,0.15);color:var(--accent3,#6d78ff);border:1px solid rgba(109,120,255,0.3)}
.knj-eyebrow{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#888);margin-bottom:10px}
.knj-mcq-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.knj-mcq-opt{display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--surface2,#1a1a2e);border:1.5px solid var(--border,#2a2a3e);border-radius:10px;cursor:pointer;font-size:14px;font-weight:600;color:var(--text,#f1f1f4);text-align:left;transition:border-color .12s,background .12s}
.knj-mcq-opt:hover:not(:disabled){border-color:var(--accent3,#6d78ff);background:rgba(109,120,255,0.08)}
.knj-mcq-opt:disabled{cursor:default}
.knj-mcq-opt-key{font-family:'Space Mono',monospace;font-size:10px;color:var(--muted,#888);background:var(--surface,#12121f);border:1px solid var(--border,#2a2a3e);border-radius:5px;padding:2px 6px;flex-shrink:0}
.knj-mcq-opt-text{flex:1;line-height:1.4}
.knj-opt-correct{border-color:var(--correct,#00ff9d)!important;background:rgba(0,255,157,0.08)!important}
.knj-opt-wrong{border-color:var(--wrong,#ff4d4d)!important;background:rgba(255,77,77,0.08)!important}
.knj-opt-greyed{opacity:.35}
.knj-grade-row{display:flex;gap:6px;flex-wrap:wrap}
.knj-grade-btn{flex:1;min-width:60px;display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 8px;border:1.5px solid var(--border,#2a2a3e);border-radius:9px;cursor:pointer;font-size:12px;font-weight:700;color:var(--text,#f1f1f4);background:var(--surface2,#1a1a2e);transition:all .15s}
.knj-grade-btn:hover{transform:translateY(-1px)}
.knj-grade-sub{font-family:'Space Mono',monospace;font-size:9px;color:var(--muted,#888);font-weight:400}
.knj-grade-miss{border-color:rgba(255,77,77,.5)}.knj-grade-miss:hover{background:rgba(255,77,77,.12)}
.knj-grade-hard{border-color:rgba(255,211,42,.5)}.knj-grade-hard:hover{background:rgba(255,211,42,.1)}
.knj-grade-got{border-color:rgba(0,255,157,.5)}.knj-grade-got:hover{background:rgba(0,255,157,.1)}
.knj-context-block{background:var(--surface2,#1a1a2e);border-radius:10px;padding:14px;margin-bottom:14px}
.knj-context-jp{font-family:'Noto Sans JP',sans-serif;font-size:20px;line-height:1.8;color:var(--text,#f1f1f4)}
.knj-context-blank{display:inline-block;min-width:28px;height:22px;border-bottom:2px solid var(--accent3,#6d78ff);vertical-align:bottom;margin:0 2px}
.knj-context-mc{display:flex;gap:8px;flex-wrap:wrap}
.knj-context-opt{font-family:'Noto Sans JP',sans-serif;font-size:22px;font-weight:700;padding:8px 16px;background:var(--surface2,#1a1a2e);border:1.5px solid var(--border,#2a2a3e);border-radius:9px;cursor:pointer;color:var(--text,#f1f1f4);transition:border-color .12s}
.knj-context-opt:hover:not(:disabled){border-color:var(--accent3,#6d78ff)}
.knj-canvas-wrap{position:relative;border:1.5px solid var(--border,#2a2a3e);border-radius:12px;overflow:hidden;background:var(--surface,#12121f)}
.knj-canvas-model{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Noto Sans JP',sans-serif;font-size:140px;font-weight:900;color:var(--text,#f1f1f4);opacity:.08;pointer-events:none;user-select:none}
.knj-canvas-hint{font-family:'Space Mono',monospace;font-size:10px;color:var(--muted,#888);text-align:center}
.knj-error-box{display:flex;align-items:flex-start;gap:12px;background:rgba(255,77,77,.08);border:1px solid rgba(255,77,77,.3);border-radius:10px;padding:16px}
@keyframes knjFeedbackIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.knj-feedback-panel{animation:knjFeedbackIn .2s ease}
.knj-pip-bar{display:flex;gap:5px;margin-bottom:14px}
.knj-pip{height:6px;flex:1;border-radius:3px;background:var(--border,#2a2a3e);transition:background .3s}
.knj-pip.done{background:var(--correct,#00ff9d)}
.knj-pip.current{background:var(--accent3,#6d78ff)}
@keyframes knjSpin{0%{transform:translateY(-60px);opacity:0}60%{transform:translateY(6px);opacity:1}80%{transform:translateY(-3px)}100%{transform:translateY(0);opacity:1}}
.knj-gacha-overlay{position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box}
.knj-gacha-card{background:var(--surface,#12121f);border:2px solid var(--accent3,#6d78ff);border-radius:16px;padding:24px;width:100%;max-width:380px;text-align:center}
.knj-gacha-candidates{display:flex;gap:10px;justify-content:center;margin:18px 0}
.knj-gacha-option{flex:1;max-width:100px;background:var(--surface2,#1a1a2e);border:2px solid var(--border,#2a2a3e);border-radius:12px;padding:14px 8px;cursor:pointer;transition:all .15s;animation:knjSpin .6s ease forwards}
.knj-gacha-option:hover{border-color:var(--accent3,#6d78ff);transform:translateY(-3px);box-shadow:0 6px 18px rgba(109,120,255,.25)}
.knj-gacha-option:nth-child(2){animation-delay:.08s}
.knj-gacha-option:nth-child(3){animation-delay:.16s}
.knj-gacha-char{font-family:'Noto Sans JP',sans-serif;font-size:44px;font-weight:900;line-height:1;color:var(--text,#f1f1f4);margin-bottom:6px}
.knj-gacha-meaning{font-size:11px;font-weight:700;color:var(--text,#f1f1f4);margin-bottom:4px}
.knj-gacha-strokes{font-family:'Space Mono',monospace;font-size:9px;color:var(--muted,#888)}
.knj-detail-overlay{position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;overflow-y:auto}
.knj-detail-card{background:var(--surface,#12121f);border:1px solid var(--border,#2a2a3e);border-radius:16px;padding:22px;width:100%;max-width:440px;max-height:90vh;overflow-y:auto}
.knj-detail-rank-badge{display:inline-flex;align-items:center;gap:5px;font-family:'Space Mono',monospace;font-size:10px;font-weight:700;border-radius:6px;padding:3px 9px;margin-bottom:14px}
.knj-rank-academy-badge{background:var(--knj-academy-bg);border:1px solid var(--knj-academy-border);color:var(--text,#f1f1f4)}
.knj-rank-genin-badge{background:var(--knj-genin-bg);border:1px solid var(--knj-genin-border);color:#6d78ff}
.knj-rank-chunin-badge{background:var(--knj-chunin-bg);border:1px solid var(--knj-chunin-border);color:#9a7cff}
.knj-rank-jonin-badge{background:var(--knj-jonin-bg);border:1px solid var(--knj-jonin-border);color:#b8860b}
.knj-rank-hokage-badge{background:var(--knj-hokage-bg);border:1px solid var(--knj-hokage-border);color:#00c97a}
.knj-path-coming{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:60px 20px;color:var(--muted,#888);font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.05em;text-align:center}
.knj-path-icon{font-size:48px}
`;

  // ── State ─────────────────────────────────────────────────
  let n5Data    = null;
  let progress  = {};
  let _activeTab = 'catalog';
  let _drillState = null;

  // ── Style injection ────────────────────────────────────────
  function _injectStyles() {
    if (document.getElementById('knj-styles')) return;
    const style = document.createElement('style');
    style.id = 'knj-styles';
    style.textContent = KNJ_CSS;
    document.head.appendChild(style);
  }

  // ── Init ──────────────────────────────────────────────────
  async function init() {
    _injectStyles();
    _loadProgress();
    _initTheme();
    if (!n5Data) await _loadN5Data();
  }

  // ── Theme ──────────────────────────────────────────────────
  function _initTheme() {
    const saved = localStorage.getItem(LS_THEME) || 'dark';
    document.documentElement.dataset.theme = saved;
  }

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'day' ? 'dark' : 'day';
    document.documentElement.dataset.theme = next;
    localStorage.setItem(LS_THEME, next);
    const lbl = document.getElementById('knjThemeLabel');
    const dot = document.getElementById('knjThemeDot');
    if (lbl) lbl.textContent = next === 'day' ? 'Day' : 'Dark';
    if (dot) dot.style.background = next === 'day' ? 'var(--warn)' : 'var(--accent3)';
  }

  // ── Data loading ───────────────────────────────────────────
  async function _loadN5Data() {
    try {
      const cached = sessionStorage.getItem(SS_N5_CACHE);
      if (cached) { n5Data = JSON.parse(cached); return; }
    } catch (_) {}
    try {
      const data = await r2Fetch(R2_N5_PATH);
      if (data && Array.isArray(data)) {
        n5Data = data;
        try { sessionStorage.setItem(SS_N5_CACHE, JSON.stringify(data)); } catch (_) {}
        return;
      }
    } catch (e) { console.error('[KNJ] R2 fetch failed:', e); }
    n5Data = null;
  }

  // ── Progress storage ───────────────────────────────────────
  function _loadProgress() {
    try { progress = JSON.parse(localStorage.getItem(LS_PROGRESS) || '{}'); }
    catch (_) { progress = {}; }
  }

  function _saveProgress() {
    try { localStorage.setItem(LS_PROGRESS, JSON.stringify(progress)); }
    catch (e) { console.warn('[KNJ] localStorage unavailable'); }
  }

  function getProgress(char) { return progress[char] || null; }

  function _setProgress(char, data) {
    progress[char] = { ...progress[char], ...data };
    _saveProgress();
  }

  function _getOrCreateProgress(char, track) {
    if (!progress[char]) {
      const entry = n5Data ? n5Data.find(k => k.char === char) : null;
      const order = entry ? n5Data.indexOf(entry) : 999;
      progress[char] = {
        char, track: track || 'n5', order,
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
      };
    }
    return progress[char];
  }

  // ── Rank computation ───────────────────────────────────────
  function _getRank(p) {
    if (!p || p.stage < STAGE_SRS) return null;
    const ms = p.srs_interval_ms || 0;
    for (let i = RANKS.length - 1; i >= 0; i--) {
      if (ms >= RANKS[i].min) return RANKS[i];
    }
    return RANKS[0];
  }

  function _rankFromInterval(ms) {
    for (let i = RANKS.length - 1; i >= 0; i--) {
      if (ms >= RANKS[i].min) return RANKS[i].id;
    }
    return 'academy';
  }

  // ── Unlock logic ───────────────────────────────────────────
  function _computeUnlocks() {
    if (!n5Data) return;
    n5Data.slice(0, 10).forEach(k => {
      const p = _getOrCreateProgress(k.char, 'n5');
      if (p.stage === STAGE_LOCKED) p.stage = STAGE_INTRO;
    });
    for (let i = 10; i < n5Data.length; i++) {
      const k = n5Data[i];
      const p = _getOrCreateProgress(k.char, 'n5');
      if (p.stage !== STAGE_LOCKED) continue;
      const prev = n5Data[i - 1];
      const prevP = progress[prev.char];
      if (prevP && prevP.stage >= STAGE_SRS) p.stage = STAGE_INTRO;
    }
    _saveProgress();
  }

  // ── Daily cap ──────────────────────────────────────────────
  function _getTodayCount() {
    try {
      const stored = JSON.parse(localStorage.getItem(LS_NEW_TODAY) || '{}');
      const today = new Date().toISOString().slice(0, 10);
      if (stored.date === today) return stored.count || 0;
    } catch (_) {}
    return 0;
  }

  function _incrementTodayCount() {
    const today = new Date().toISOString().slice(0, 10);
    const count = _getTodayCount() + 1;
    try { localStorage.setItem(LS_NEW_TODAY, JSON.stringify({ date: today, count })); } catch (_) {}
  }

  function _canLearnNew() { return _getTodayCount() < MAX_NEW_PER_DAY; }

  // ── Stats ──────────────────────────────────────────────────
  function _getStats() {
    const all = Object.values(progress);
    const introduced = all.filter(p => p.introduced_at !== null).length;
    const inSRS      = all.filter(p => p.stage === STAGE_SRS).length;
    const mastered   = all.filter(p => p.stage === STAGE_MASTERED).length;
    const now        = Date.now();
    const due        = all.filter(p => p.stage >= STAGE_SRS && p.srs_due && p.srs_due <= now).length;
    return { introduced, inSRS, mastered, due };
  }

  // ── SRS Engine ─────────────────────────────────────────────
  // grade: 0=Miss, 1=Hard, 2=Got it (3-button simplified)
  function _computeNextInterval(currentMs, grade) {
    if (currentMs === 0) return grade === 0 ? INTERVAL_8H : INTERVAL_24H;
    if (grade === 0) return Math.max(Math.round(currentMs / 2), INTERVAL_8H);
    if (grade === 1) return Math.round(currentMs * 1.2);
    return Math.round(currentMs * 2.5);
  }

  function scheduleReview(char, grade) {
    const p = _getOrCreateProgress(char, 'n5');
    const nextMs = _computeNextInterval(p.srs_interval_ms || 0, grade);
    const isCorrect = grade > 0;
    _setProgress(char, {
      srs_interval_ms: nextMs,
      srs_due: Date.now() + nextMs,
      review_count: (p.review_count || 0) + 1,
      correct_total: (p.correct_total || 0) + (isCorrect ? 1 : 0),
      wrong_total: (p.wrong_total || 0) + (isCorrect ? 0 : 1),
      last_seen: Date.now(),
      recent_wrong: grade === 0,
      rank: _rankFromInterval(nextMs),
      stage: nextMs >= MASTERY_MS ? STAGE_MASTERED : STAGE_SRS,
    });
  }

  function buildReviewSession() {
    const now = Date.now();
    return Object.values(progress)
      .filter(p => p.stage >= STAGE_SRS && p.srs_due && p.srs_due <= now)
      .sort((a, b) => a.srs_due - b.srs_due)
      .slice(0, 20);
  }

  // ── Gacha candidates ───────────────────────────────────────
  function _getGachaCandidates() {
    if (!n5Data) return [];
    _computeUnlocks();
    const pool = n5Data.filter(k => {
      const p = progress[k.char];
      return p && p.stage === STAGE_INTRO && p.introduced_at === null;
    });
    return [...pool.slice(0, 6)].sort(() => Math.random() - 0.5).slice(0, 3);
  }

  // ── Distractor selection ───────────────────────────────────
  function _getDistractors(charData, count = 3) {
    const hardcoded = charData.distractors || [];
    const introduced = Object.values(progress)
      .filter(p => p.introduced_at !== null && p.char !== charData.char)
      .map(p => p.char);
    const pool = [...new Set([...hardcoded, ...introduced])].filter(c => c !== charData.char);
    return pool.sort(() => Math.random() - 0.5).slice(0, count);
  }

  // ── HTML helpers ───────────────────────────────────────────
  function _h(html) {
    const d = document.createElement('div');
    d.innerHTML = html;
    return d;
  }

  function _shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

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
      tip.style.cssText = 'position:fixed;z-index:3000;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:7px 12px;font-size:12px;color:var(--text);pointer-events:none;font-family:Syne,sans-serif;max-width:180px;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,.35)';
      document.body.appendChild(tip);
    }
    tip.textContent = msg;
    const r = anchor.getBoundingClientRect();
    tip.style.left = (r.left + r.width / 2 - 90) + 'px';
    tip.style.top  = (r.bottom + 6) + 'px';
    tip.style.opacity = '1';
    clearTimeout(tip._hide);
    tip._hide = setTimeout(() => { tip.style.opacity = '0'; setTimeout(() => tip.remove(), 200); }, 1800);
  }

  function _toast(msg, color) {
    color = color || 'var(--correct)';
    const t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--surface);border:1px solid ' + color + ';border-radius:10px;padding:12px 20px;font-weight:700;font-size:14px;color:' + color + ';z-index:2000;box-shadow:0 4px 20px rgba(0,0,0,.25);white-space:nowrap';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 450); }, 2000);
  }

  // ── Cell rendering ─────────────────────────────────────────
  function _renderKanjiGrid(kanji, onCellClick) {
    const wrap = document.createElement('div');
    wrap.className = 'knj-grid';
    kanji.forEach(k => {
      const p = progress[k.char] || null;
      const rank = p ? _getRank(p) : null;
      const isLocked = !p || p.stage === STAGE_LOCKED;
      const isIntroReady = p && p.stage === STAGE_INTRO && p.introduced_at === null;

      let rankClass = '', rankIcon = '', labelText = '';
      if (isLocked) {
        rankClass = 'knj-locked'; labelText = '🔒';
      } else if (isIntroReady) {
        rankClass = 'knj-intro-ready'; labelText = 'new';
      } else if (p && p.stage === STAGE_MASTERED) {
        rankClass = 'knj-rank-hokage'; labelText = 'Hokage 👑';
      } else if (rank) {
        rankClass = 'knj-rank-' + rank.id;
        labelText = rank.label;
        if (rank.id === 'jonin' || rank.id === 'hokage') rankIcon = rank.icon;
      } else {
        labelText = 'intro';
      }

      const cell = document.createElement('div');
      cell.className = 'knj-cell ' + rankClass;
      cell.dataset.char = k.char;
      cell.innerHTML = (rankIcon ? '<span class="knj-rank-badge">' + rankIcon + '</span>' : '') +
        '<span class="knj-cell-char">' + k.char + '</span>' +
        '<span class="knj-cell-label">' + labelText + '</span>';

      if (!isLocked && onCellClick) {
        cell.addEventListener('click', () => onCellClick(k, p || {}));
      } else if (isLocked) {
        cell.addEventListener('click', () => _showTooltip(cell, 'Keep studying to unlock'));
      }
      wrap.appendChild(cell);
    });
    return wrap;
  }

  // ── SCREEN: Home (3-tab shell) ─────────────────────────────
  function renderHome(container, tab) {
    if (!n5Data) { _renderDataError(container); return; }
    _computeUnlocks();
    if (tab) _activeTab = tab;
    container.innerHTML = '';

    const stats = _getStats();
    const theme = document.documentElement.dataset.theme || 'dark';

    // Header
    const header = _h(
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">' +
        '<div>' +
          '<div style="font-size:20px;font-weight:800;color:var(--text)">漢字 Progression</div>' +
          '<div style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-top:2px">N5 Foundation · ' + stats.introduced + '/' + n5Data.length + ' introduced</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          (stats.due > 0 ? '<span class="knj-due-badge">' + stats.due + ' due</span>' : '') +
          '<button class="knj-theme-toggle" onclick="KNJ_ENGINE.toggleTheme()">' +
            '<div class="knj-theme-dot" id="knjThemeDot" style="background:' + (theme === 'day' ? 'var(--warn)' : 'var(--accent3)') + '"></div>' +
            '<span id="knjThemeLabel">' + (theme === 'day' ? 'Day' : 'Dark') + '</span>' +
          '</button>' +
        '</div>' +
      '</div>'
    );
    container.appendChild(header);

    // Tab bar
    const tabs = _h(
      '<div class="knj-tabs">' +
        '<button class="knj-tab ' + (_activeTab === 'catalog' ? 'knj-tab-active' : '') + '" id="knjTabCatalog">Catalog</button>' +
        '<button class="knj-tab ' + (_activeTab === 'path'    ? 'knj-tab-active' : '') + '" id="knjTabPath">Path</button>' +
        '<button class="knj-tab ' + (_activeTab === 'reviews' ? 'knj-tab-active' : '') + '" id="knjTabReviews">Reviews' + (stats.due > 0 ? ' (' + stats.due + ')' : '') + '</button>' +
      '</div>'
    );
    container.appendChild(tabs);
    tabs.querySelector('#knjTabCatalog').addEventListener('click', () => renderHome(container, 'catalog'));
    tabs.querySelector('#knjTabPath').addEventListener('click',    () => renderHome(container, 'path'));
    tabs.querySelector('#knjTabReviews').addEventListener('click', () => renderHome(container, 'reviews'));

    if (_activeTab === 'catalog')      _renderCatalogTab(container, stats);
    else if (_activeTab === 'path')    _renderPathTab(container);
    else                               _renderReviewsTab(container, stats);
  }

  // ── TAB: Catalog ───────────────────────────────────────────
  function _renderCatalogTab(container, stats) {
    // Stats row
    container.appendChild(_h(
      '<div class="knj-stat-grid">' +
        '<div class="knj-stat-card"><span class="knj-stat-val">' + stats.introduced + '</span><span class="knj-stat-label">Introduced</span></div>' +
        '<div class="knj-stat-card"><span class="knj-stat-val">' + stats.inSRS + '</span><span class="knj-stat-label">In SRS</span></div>' +
        '<div class="knj-stat-card"><span class="knj-stat-val">' + stats.mastered + '</span><span class="knj-stat-label">Mastered</span></div>' +
        '<div class="knj-stat-card"><span class="knj-stat-val" style="color:' + (stats.due > 0 ? 'var(--wrong)' : 'var(--text)') + '">' + stats.due + '</span><span class="knj-stat-label">Due</span></div>' +
      '</div>'
    ));

    // Gacha CTA
    const canLearn = _canLearnNew();
    const todayCount = _getTodayCount();
    const candidates = _getGachaCandidates();
    if (candidates.length > 0) {
      const gachaEl = _h(
        '<div class="knj-gacha-cta" id="knjGachaCTA"' + (!canLearn ? ' style="opacity:.5;cursor:default"' : '') + '>' +
          '<div>' +
            '<div class="knj-cta-title">🎰 Spin to learn a new kanji</div>' +
            '<div class="knj-cta-sub">' + (canLearn ? (MAX_NEW_PER_DAY - todayCount) + ' remaining today' : 'Daily limit reached — come back tomorrow!') + '</div>' +
          '</div>' +
          '<span style="font-size:20px">→</span>' +
        '</div>'
      );
      container.appendChild(gachaEl);
      if (canLearn) gachaEl.querySelector('#knjGachaCTA').addEventListener('click', () => _openGachaModal(container));
    }

    // Introduced kanji
    const introducedKanji = n5Data.filter(k => { const p = progress[k.char]; return p && p.introduced_at !== null; });
    if (introducedKanji.length > 0) {
      const section = document.createElement('div');
      section.style.marginBottom = '16px';
      section.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">' +
          '<div style="font-size:13px;font-weight:700;color:var(--text)">Your kanji (' + introducedKanji.length + ')</div>' +
          '<span class="knj-track-pill knj-pill-n5">N5</span>' +
        '</div>';
      section.appendChild(_renderKanjiGrid(introducedKanji, (k, p) => _openDetailModal(k, p, container)));
      container.appendChild(section);
    } else {
      container.appendChild(_h(
        '<div style="text-align:center;padding:40px 20px;color:var(--muted);font-family:\'Space Mono\',monospace;font-size:11px">' +
          '<div style="font-size:36px;margin-bottom:12px">🌱</div>' +
          'Spin the gacha to start learning your first kanji!' +
        '</div>'
      ));
    }

    // Legend
    container.appendChild(_h(
      '<div class="knj-legend">' +
        '<div class="knj-leg-item"><div class="knj-leg-swatch" style="background:var(--knj-hokage-bg);border-color:var(--knj-hokage-border)"></div>Hokage 👑</div>' +
        '<div class="knj-leg-item"><div class="knj-leg-swatch" style="background:var(--knj-jonin-bg);border-color:var(--knj-jonin-border)"></div>Jōnin 🌟</div>' +
        '<div class="knj-leg-item"><div class="knj-leg-swatch" style="background:var(--knj-chunin-bg);border-color:var(--knj-chunin-border)"></div>Chūnin</div>' +
        '<div class="knj-leg-item"><div class="knj-leg-swatch" style="background:var(--knj-genin-bg);border-color:var(--knj-genin-border)"></div>Genin</div>' +
        '<div class="knj-leg-item"><div class="knj-leg-swatch" style="background:var(--knj-academy-bg);border-color:var(--knj-academy-border)"></div>Academy</div>' +
      '</div>'
    ));
  }

  // ── TAB: Path (placeholder) ────────────────────────────────
  function _renderPathTab(container) {
    container.appendChild(_h(
      '<div class="knj-path-coming">' +
        '<div class="knj-path-icon">🗺️</div>' +
        '<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:8px">Path Coming Soon</div>' +
        '<div>The Duolingo-style progression path is being built.<br>Use the Catalog tab to learn and review for now.</div>' +
      '</div>'
    ));
  }

  // ── TAB: Reviews ───────────────────────────────────────────
  function _renderReviewsTab(container, stats) {
    const dueItems = buildReviewSession();
    const el = _h(
      '<div style="display:flex;flex-direction:column;gap:10px;margin-top:4px">' +
        '<div class="card" style="padding:16px">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px">' +
            '<div><div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:3px">Due now (' + dueItems.length + ')</div>' +
            '<div style="font-family:\'Space Mono\',monospace;font-size:10px;color:var(--muted)">SRS-scheduled reviews</div></div>' +
            '<button class="btn btn-primary" id="knjRevDueBtn"' + (dueItems.length === 0 ? ' disabled style="opacity:.4"' : '') + '>' + (dueItems.length > 0 ? 'Start →' : 'None due') + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="card" style="padding:16px">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px">' +
            '<div><div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:3px">Review all (' + stats.introduced + ')</div>' +
            '<div style="font-family:\'Space Mono\',monospace;font-size:10px;color:var(--muted)">Practice — no SRS effect</div></div>' +
            '<button class="btn btn-secondary" id="knjRevAllBtn"' + (stats.introduced === 0 ? ' disabled style="opacity:.4"' : '') + '>Start →</button>' +
          '</div>' +
        '</div>' +
        '<div class="card" style="padding:16px">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px">' +
            '<div><div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:3px">Select kanji</div>' +
            '<div style="font-family:\'Space Mono\',monospace;font-size:10px;color:var(--muted)">Choose specific kanji to drill</div></div>' +
            '<button class="btn btn-secondary" id="knjRevSelectBtn"' + (stats.introduced === 0 ? ' disabled style="opacity:.4"' : '') + '>Choose →</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
    container.appendChild(el);
    if (dueItems.length > 0)   el.querySelector('#knjRevDueBtn').addEventListener('click', () => startReviewSession(container, 'due'));
    if (stats.introduced > 0)  el.querySelector('#knjRevAllBtn').addEventListener('click', () => startReviewSession(container, 'all'));
    if (stats.introduced > 0)  el.querySelector('#knjRevSelectBtn').addEventListener('click', () => _renderSelectKanji(container));
  }

  // ── Select-kanji screen ────────────────────────────────────
  function _renderSelectKanji(container) {
    const introduced = n5Data.filter(k => { const p = progress[k.char]; return p && p.introduced_at !== null; });
    const selected = new Set();
    container.innerHTML = '';
    const header = _h(
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">' +
        '<button class="btn btn-secondary" id="knjSelBack" style="font-size:12px;padding:7px 12px">← Back</button>' +
        '<div style="flex:1;font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:2px;color:var(--muted);text-transform:uppercase">SELECT KANJI TO REVIEW</div>' +
        '<button class="btn btn-primary" id="knjSelStart" disabled style="opacity:.4">Start (0)</button>' +
      '</div>'
    );
    container.appendChild(header);
    const grid = document.createElement('div');
    grid.className = 'knj-grid';
    introduced.forEach(k => {
      const p = progress[k.char] || {};
      const rank = _getRank(p);
      const cell = document.createElement('div');
      cell.className = 'knj-cell' + (rank ? ' knj-rank-' + rank.id : '');
      cell.dataset.char = k.char;
      cell.innerHTML = '<span class="knj-cell-char">' + k.char + '</span><span class="knj-cell-label">' + (rank ? rank.label : 'intro') + '</span>';
      cell.addEventListener('click', () => {
        if (selected.has(k.char)) { selected.delete(k.char); cell.style.outline = ''; }
        else { selected.add(k.char); cell.style.outline = '2px solid var(--accent3)'; cell.style.outlineOffset = '2px'; }
        const btn = container.querySelector('#knjSelStart');
        if (btn) { btn.textContent = 'Start (' + selected.size + ')'; btn.disabled = selected.size === 0; btn.style.opacity = selected.size > 0 ? '1' : '.4'; }
      });
      grid.appendChild(cell);
    });
    container.appendChild(grid);
    header.querySelector('#knjSelBack').addEventListener('click', () => renderHome(container, 'reviews'));
    header.querySelector('#knjSelStart').addEventListener('click', () => { if (selected.size > 0) startReviewSession(container, 'select', [...selected]); });
  }

  // ── Gacha modal ────────────────────────────────────────────
  function _openGachaModal(container) {
    const candidates = _getGachaCandidates();
    if (!candidates.length) { _toast('No new kanji available yet!', 'var(--muted)'); return; }
    const overlay = document.createElement('div');
    overlay.className = 'knj-gacha-overlay';
    overlay.id = 'knjGachaOverlay';
    overlay.innerHTML =
      '<div class="knj-gacha-card">' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Pick your next kanji</div>' +
        '<div style="font-size:18px;font-weight:800;color:var(--text);margin-bottom:4px">🎰 Gacha Draw</div>' +
        '<div class="knj-gacha-candidates">' +
          candidates.map(k =>
            '<div class="knj-gacha-option" data-char="' + k.char + '">' +
              '<div class="knj-gacha-char">' + k.char + '</div>' +
              '<div class="knj-gacha-meaning">' + k.meaning + '</div>' +
              '<div class="knj-gacha-strokes">' + k.strokes + ' strokes</div>' +
            '</div>'
          ).join('') +
        '</div>' +
        '<button class="btn btn-secondary" id="knjGachaClose" style="width:100%;margin-top:4px">Cancel</button>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector('#knjGachaClose').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelectorAll('.knj-gacha-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const char = opt.dataset.char;
        overlay.remove();
        _incrementTodayCount();
        const p = _getOrCreateProgress(char, 'n5');
        p.introduced_at = Date.now();
        _saveProgress();
        const inner = document.getElementById('knjModeInner');
        renderIntroCard(char, inner || container);
      });
    });
  }

  // ── Detail modal ───────────────────────────────────────────
  function _openDetailModal(k, p, container) {
    const rank = _getRank(p);
    const rankObj = rank || { label: 'Academy', icon: '🎓', id: 'academy' };
    const now = Date.now();
    const introduced_ago = p.introduced_at ? Math.floor((now - p.introduced_at) / 86400000) : null;
    const due_in = p.srs_due ? Math.ceil((p.srs_due - now) / 86400000) : null;
    const totalAnswers = (p.correct_total || 0) + (p.wrong_total || 0);
    const accuracy = totalAnswers > 0 ? Math.round((p.correct_total || 0) / totalAnswers * 100) : null;

    function hl(jp) { return jp.replace(new RegExp(k.char, 'g'), '<span class="knj-target">' + k.char + '</span>'); }
    const sentenceHTML = (k.sentences || []).slice(0, 2).map(s =>
      '<div class="knj-sentence-block"><div class="knj-jp-sentence">' + hl(s.jp) + '</div>' +
      '<div class="knj-en-sentence">' + s.en + '<span class="knj-source-tag">' + s.source + '</span></div></div>'
    ).join('');

    const statsHTML = rank ?
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">' +
        (introduced_ago !== null ? '<div style="background:var(--surface2);border-radius:8px;padding:8px 10px"><div style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted);text-transform:uppercase;margin-bottom:3px">Introduced</div><div style="font-size:13px;font-weight:700;color:var(--text)">' + introduced_ago + 'd ago</div></div>' : '') +
        (accuracy !== null ? '<div style="background:var(--surface2);border-radius:8px;padding:8px 10px"><div style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted);text-transform:uppercase;margin-bottom:3px">Accuracy</div><div style="font-size:13px;font-weight:700;color:var(--text)">' + accuracy + '%</div></div>' : '') +
        (p.review_count > 0 ? '<div style="background:var(--surface2);border-radius:8px;padding:8px 10px"><div style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted);text-transform:uppercase;margin-bottom:3px">Reviews</div><div style="font-size:13px;font-weight:700;color:var(--text)">' + p.review_count + '</div></div>' : '') +
        (due_in !== null ? '<div style="background:var(--surface2);border-radius:8px;padding:8px 10px"><div style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted);text-transform:uppercase;margin-bottom:3px">SRS due</div><div style="font-size:13px;font-weight:700;color:var(--text)">' + (due_in <= 0 ? 'Now!' : 'in ' + due_in + 'd') + '</div></div>' : '') +
      '</div>' : '';

    const overlay = document.createElement('div');
    overlay.className = 'knj-detail-overlay';
    overlay.id = 'knjDetailOverlay';
    overlay.innerHTML =
      '<div class="knj-detail-card">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">' +
          '<div style="font-family:\'Noto Sans JP\',sans-serif;font-size:60px;font-weight:900;line-height:1;color:var(--text)">' + k.char + '</div>' +
          '<button class="btn btn-secondary" id="knjDetailClose" style="font-size:12px;padding:7px 12px;align-self:flex-start">✕</button>' +
        '</div>' +
        '<div style="font-size:20px;font-weight:800;color:var(--text);margin-bottom:4px">' + k.meaning + '</div>' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:10px;color:var(--muted);margin-bottom:12px">' +
          (k.on && k.on.length ? 'On: ' + k.on.join('、') + '  ' : '') +
          (k.kun && k.kun.length ? 'Kun: ' + k.kun.slice(0,3).join('、') : '') +
          ' · ' + k.strokes + ' strokes' +
        '</div>' +
        '<span class="knj-detail-rank-badge knj-rank-' + rankObj.id + '-badge">' + rankObj.icon + ' ' + rankObj.label + '</span>' +
        statsHTML +
        '<div class="knj-sub-label">Memory Hook</div>' +
        '<div class="knj-mnemonic-box" style="margin-bottom:14px">' + k.mnemonic + '</div>' +
        '<div class="knj-sub-label">Example sentences</div>' +
        sentenceHTML +
        '<div style="display:flex;gap:8px;margin-top:18px;flex-wrap:wrap">' +
          '<button class="btn btn-primary" id="knjDetailReview" style="flex:1">Review this kanji now</button>' +
          '<button class="btn btn-secondary" id="knjDetailClose2" style="flex:1">Close</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('#knjDetailClose').addEventListener('click', close);
    overlay.querySelector('#knjDetailClose2').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelector('#knjDetailReview').addEventListener('click', () => {
      close();
      const inner = document.getElementById('knjModeInner');
      _startOnDemandDrill(k.char, inner || container);
    });
  }

  // ── SCREEN: Intro Card ─────────────────────────────────────
  function renderIntroCard(char, container) {
    const k = n5Data.find(d => d.char === char);
    if (!k) return;
    const p = _getOrCreateProgress(char, 'n5');
    if (!p.introduced_at) { p.introduced_at = Date.now(); _saveProgress(); }

    function hl(jp) { return jp.replace(new RegExp(char, 'g'), '<span class="knj-target">' + char + '</span>'); }
    const sentenceHTML = (k.sentences || []).map((s, i) =>
      '<div class="knj-sentence-block"' + (i > 0 ? ' style="margin-top:8px"' : '') + '>' +
        '<div class="knj-jp-sentence">' + hl(s.jp) + '</div>' +
        '<div class="knj-en-sentence">' + s.en + '<span class="knj-source-tag">' + s.source + '</span></div>' +
      '</div>'
    ).join('');

    const relatedHTML = (k.related || []).slice(0, 3).map(r => {
      const rp = progress[r.char];
      const status = rp && rp.introduced_at ? 'introduced' : 'not yet seen';
      return '<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border)">' +
        '<span style="font-family:\'Noto Sans JP\',sans-serif;font-size:24px;font-weight:700;width:32px;text-align:center">' + r.char + '</span>' +
        '<span style="flex:1;font-size:12px;color:var(--text)">' + r.meaning + '</span>' +
        '<span style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted);text-transform:uppercase">' + status + '</span>' +
        '</div>';
    }).join('');

    container.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">' +
        '<button class="btn btn-secondary" id="knjBackBtn" style="font-size:12px;padding:7px 12px">← Back</button>' +
        '<div style="flex:1"><div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:2px;color:var(--muted);text-transform:uppercase">INTRO CARD</div></div>' +
        '<span class="knj-track-pill knj-pill-n5">N5</span>' +
      '</div>' +
      '<div class="knj-intro-layout">' +
        '<div class="card" style="padding:20px">' +
          '<div class="knj-eyebrow">Introduction <span class="knj-jlpt-badge">' + (k.jlpt || 'N5') + '</span></div>' +
          '<div class="knj-hero-char">' + char + '</div>' +
          '<div class="knj-meaning-en">' + k.meaning + '</div>' +
          '<div class="knj-reading-row">' +
            (k.on && k.on.length ? '<div class="knj-reading-group"><div class="knj-reading-label">On</div><div class="knj-reading-val">' + k.on.join('、') + '</div></div>' : '') +
            (k.kun && k.kun.length ? '<div class="knj-reading-group"><div class="knj-reading-label">Kun</div><div class="knj-reading-val">' + k.kun.slice(0,3).join('、') + '</div></div>' : '') +
            '<div class="knj-reading-group"><div class="knj-reading-label">Strokes</div><div class="knj-reading-val">' + k.strokes + '</div></div>' +
          '</div>' +
          '<hr style="border:none;border-top:1px solid var(--border);margin:14px 0">' +
          '<div class="knj-sub-label">Memory Hook</div>' +
          '<div class="knj-mnemonic-box">' + k.mnemonic + '</div>' +
          '<div class="knj-sub-label">Example sentences</div>' +
          sentenceHTML +
          '<div style="margin-top:18px"><button class="btn btn-primary" id="knjBeginDrills" style="width:100%">Begin drills →</button></div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:12px">' +
          '<div class="card" style="padding:16px">' +
            '<div class="knj-sub-label">Radical</div>' +
            '<div style="display:flex;align-items:center;gap:10px;padding:8px 0">' +
              '<span style="font-family:\'Noto Sans JP\',sans-serif;font-size:28px;font-weight:700">' + (k.radical || '') + '</span>' +
              '<span style="font-size:12px;color:var(--muted)">' + (k.radical_meaning || '') + '</span>' +
            '</div>' +
            (k.compounds && k.compounds.length ?
              '<hr style="border:none;border-top:1px solid var(--border);margin:10px 0">' +
              '<div class="knj-sub-label">Compounds</div>' +
              '<div style="display:flex;flex-wrap:wrap;gap:6px">' +
                k.compounds.map(c => '<span style="font-family:\'Noto Sans JP\',sans-serif;font-size:14px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:3px 8px">' + c + '</span>').join('') +
              '</div>' : '') +
          '</div>' +
          (relatedHTML ? '<div class="card" style="padding:16px"><div class="knj-sub-label">Related</div>' + relatedHTML + '</div>' : '') +
          '<div class="card" style="padding:16px">' +
            '<div class="knj-sub-label">Your rank for this kanji</div>' +
            '<div style="font-size:24px;margin:8px 0">🎓 Academy</div>' +
            '<div style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted)">Just introduced — start drilling to rank up!</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    container.querySelector('#knjBackBtn').addEventListener('click', () => renderHome(container));
    container.querySelector('#knjBeginDrills').addEventListener('click', () => {
      _setProgress(char, { stage: STAGE_SRS, srs_interval_ms: INTERVAL_8H, srs_due: Date.now() + INTERVAL_8H, rank: 'academy' });
      _computeUnlocks();
      _startLearningDrill(char, container);
    });
  }

  // ── Drill engine ───────────────────────────────────────────
  // Learning sequence: MCQ×3 → RevMCQ×2 → Context×2 → Write×1
  // No grade buttons. Correct=auto-advance. Wrong=same question re-asked.
  // SRS reviews: rotated MCQ/RevMCQ/Write + 3 grade buttons (Miss/Hard/Got it)

  function _startLearningDrill(char, container) {
    _drillState = {
      char, mode: 'learn',
      sequence: [
        { type:'mcq', reverse:false }, { type:'mcq', reverse:false }, { type:'mcq', reverse:false },
        { type:'mcq', reverse:true },  { type:'mcq', reverse:true },
        { type:'context' }, { type:'context' },
        { type:'write' },
      ],
      idx: 0, totalCorrect: 0,
    };
    _runDrillStep(container);
  }

  function _startOnDemandDrill(char, container) {
    _drillState = {
      char, mode: 'ondemand',
      sequence: [
        { type:'mcq', reverse:false }, { type:'mcq', reverse:true },
        { type:'context' }, { type:'write' },
      ],
      idx: 0, totalCorrect: 0,
    };
    const p = _getOrCreateProgress(char, 'n5');
    _setProgress(char, { manual_reviews: (p.manual_reviews || 0) + 1 });
    _runDrillStep(container);
  }

  function _pipHTML() {
    const ds = _drillState;
    if (!ds || !ds.sequence) return '';
    return '<div class="knj-pip-bar">' +
      ds.sequence.map((_, i) => '<div class="knj-pip' + (i < ds.idx ? ' done' : i === ds.idx ? ' current' : '') + '"></div>').join('') +
    '</div>';
  }

  function _drillBackHeader(label) {
    return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">' +
      '<button class="btn btn-secondary" id="knjBackBtn" style="font-size:12px;padding:7px 12px">← Catalog</button>' +
      '<div style="flex:1;font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:2px;color:var(--muted);text-transform:uppercase">' + label + '</div>' +
    '</div>';
  }

  function _runDrillStep(container) {
    const ds = _drillState;
    if (!ds || ds.idx >= ds.sequence.length) { _showDrillComplete(container); return; }
    const step = ds.sequence[ds.idx];
    const advance = (correct) => {
      if (correct) { ds.idx++; ds.totalCorrect++; }
      setTimeout(() => _runDrillStep(container), correct ? 900 : 1400);
    };
    if (step.type === 'mcq')     _renderActiveMCQ(ds.char, container, step.reverse, advance);
    else if (step.type === 'context') _renderActiveContext(ds.char, container, advance);
    else                              _renderActiveWrite(ds.char, container, () => { ds.idx++; _runDrillStep(container); });
  }

  function _showDrillComplete(container) {
    const ds = _drillState;
    const k = n5Data.find(d => d.char === (ds ? ds.char : ''));
    _drillState = null;
    container.innerHTML =
      '<div class="card" style="text-align:center;padding:28px">' +
        '<div style="font-size:48px;margin-bottom:10px">🎉</div>' +
        '<div style="font-family:\'Noto Sans JP\',sans-serif;font-size:64px;font-weight:900;color:var(--text);margin-bottom:8px">' + (k ? k.char : '') + '</div>' +
        '<div style="font-size:18px;font-weight:800;color:var(--text);margin-bottom:4px">' + (k ? k.meaning : '') + '</div>' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted);text-transform:uppercase;margin-bottom:20px">Drill complete! Now in SRS pool 🎓 Academy rank</div>' +
        '<button class="btn btn-primary" id="knjDrillHomeBtn">Back to Catalog</button>' +
      '</div>';
    container.querySelector('#knjDrillHomeBtn').addEventListener('click', () => renderHome(container));
  }

  // ── Active MCQ (no grade buttons) ──────────────────────────
  function _renderActiveMCQ(char, container, isReverse, onResult) {
    const k = n5Data.find(d => d.char === char);
    if (!k) return;
    const distractors = _getDistractors(k, 3);
    const wrongMeanings = distractors.map(c => { const d = n5Data.find(x => x.char === c); return d ? d.meaning : null; }).filter(Boolean);
    let options;
    if (isReverse) options = _shuffle([{ value:char, correct:true }, ...distractors.map(c => ({ value:c, correct:false }))]);
    else           options = _shuffle([{ value:k.meaning, correct:true }, ...wrongMeanings.map(m => ({ value:m, correct:false }))]);
    const keys = ['A','B','C','D'];

    container.innerHTML =
      _pipHTML() +
      _drillBackHeader(isReverse ? 'REVERSE MCQ' : 'RECOGNITION MCQ') +
      '<div class="card" style="text-align:center">' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;margin-bottom:8px">' +
          (isReverse ? 'Select the kanji that means:' : 'What does this kanji mean?') +
        '</div>' +
        (isReverse
          ? '<div style="font-size:24px;font-weight:800;color:var(--text);padding:16px 0 20px">' + k.meaning + '</div>'
          : '<div style="font-family:\'Noto Sans JP\',sans-serif;font-size:96px;font-weight:900;line-height:1;padding:12px 0 20px">' + char + '</div>'
        ) +
        '<div class="knj-mcq-grid" id="knjMcqGrid">' +
          options.map((opt, i) =>
            '<button class="knj-mcq-opt" data-idx="' + i + '" data-correct="' + opt.correct + '">' +
              '<div class="knj-mcq-opt-key">' + keys[i] + '</div>' +
              '<div class="knj-mcq-opt-text">' +
                (isReverse ? '<span style="font-family:\'Noto Sans JP\',sans-serif;font-size:32px;font-weight:900">' + opt.value + '</span>' : opt.value) +
              '</div>' +
            '</button>'
          ).join('') +
        '</div>' +
        '<div id="knjMcqFeedback" style="display:none;margin-top:14px;text-align:left" class="knj-feedback-panel"></div>' +
      '</div>';

    container.querySelector('#knjBackBtn').addEventListener('click', () => { _drillState = null; renderHome(container); });
    const grid = container.querySelector('#knjMcqGrid');
    const feedback = container.querySelector('#knjMcqFeedback');
    let answered = false;

    function handleAnswer(optEl) {
      if (answered) return;
      answered = true;
      const isCorrect = optEl.dataset.correct === 'true';
      grid.querySelectorAll('.knj-mcq-opt').forEach(o => {
        if (o.dataset.correct === 'true') o.classList.add('knj-opt-correct');
        else if (o === optEl && !isCorrect) o.classList.add('knj-opt-wrong');
        else if (!isCorrect) o.classList.add('knj-opt-greyed');
        o.disabled = true;
      });
      feedback.style.display = '';
      if (isCorrect) {
        feedback.innerHTML = '<div style="font-size:13px;color:var(--correct);font-weight:700">✓ Correct!</div>';
      } else {
        feedback.innerHTML =
          '<div style="font-size:13px;color:var(--wrong);font-weight:700;margin-bottom:8px">✗ Not quite</div>' +
          '<div style="font-size:12px;line-height:1.6;color:var(--text)"><strong>' + char + '</strong> = ' + k.meaning + '<br>' +
          '<span style="color:var(--muted);font-size:11px">' + k.mnemonic.slice(0,80) + (k.mnemonic.length > 80 ? '…' : '') + '</span></div>';
      }
      onResult(isCorrect);
    }

    grid.querySelectorAll('.knj-mcq-opt').forEach(opt => opt.addEventListener('click', () => handleAnswer(opt)));
    const keyH = (e) => {
      if (answered) return;
      const idx = ['1','2','3','4'].indexOf(e.key) > -1 ? parseInt(e.key)-1 : 'abcd'.indexOf(e.key.toLowerCase());
      if (idx >= 0) { document.removeEventListener('keydown', keyH); const opts = grid.querySelectorAll('.knj-mcq-opt'); if (opts[idx]) handleAnswer(opts[idx]); }
    };
    document.addEventListener('keydown', keyH);
  }

  // ── Active Context (no grade buttons) ─────────────────────
  function _renderActiveContext(char, container, onResult) {
    const k = n5Data.find(d => d.char === char);
    if (!k) return;
    const sentences = k.sentences || [];
    const s = sentences[Math.floor(Math.random() * sentences.length)];
    const blankedJP = s.jp.replace(new RegExp(char, 'g'), '<span class="knj-context-blank"></span>');
    const options = _shuffle([{ value:char, correct:true }, ..._getDistractors(k, 3).map(c => ({ value:c, correct:false }))]);

    container.innerHTML =
      _pipHTML() +
      _drillBackHeader('SENTENCE CONTEXT') +
      '<div class="card">' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;margin-bottom:10px">Fill in the blank</div>' +
        '<div class="knj-context-block">' +
          '<div class="knj-context-jp">' + blankedJP + '</div>' +
          '<div class="knj-en-sentence" style="margin-top:8px">' + s.en + '<span class="knj-source-tag">' + s.source + '</span></div>' +
        '</div>' +
        '<div class="knj-sub-label">Choose the missing kanji</div>' +
        '<div class="knj-context-mc" id="knjContextGrid">' +
          options.map((opt, i) => '<button class="knj-context-opt" data-idx="' + i + '" data-correct="' + opt.correct + '">' + opt.value + '</button>').join('') +
        '</div>' +
        '<div id="knjContextFeedback" style="display:none;margin-top:12px" class="knj-feedback-panel"></div>' +
      '</div>';

    container.querySelector('#knjBackBtn').addEventListener('click', () => { _drillState = null; renderHome(container); });
    const grid = container.querySelector('#knjContextGrid');
    const feedback = container.querySelector('#knjContextFeedback');
    let answered = false;
    grid.querySelectorAll('.knj-context-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const isCorrect = opt.dataset.correct === 'true';
        grid.querySelectorAll('.knj-context-opt').forEach(o => {
          if (o.dataset.correct === 'true') o.classList.add('knj-opt-correct');
          else if (o === opt && !isCorrect) o.classList.add('knj-opt-wrong');
          o.disabled = true;
        });
        feedback.style.display = '';
        feedback.innerHTML = isCorrect
          ? '<div style="font-size:13px;color:var(--correct);font-weight:700">✓ Correct!</div>'
          : '<div style="font-size:13px;color:var(--wrong);font-weight:700;margin-bottom:6px">✗ The answer was: <span style="font-family:\'Noto Sans JP\',sans-serif;font-size:18px">' + char + '</span></div>';
        onResult(isCorrect);
      });
    });
  }

  // ── Canvas helper (shared) ─────────────────────────────────
  function _setupCanvas(container, char) {
    const canvas = container.querySelector('#knjCanvas');
    const ctx    = canvas.getContext('2d');
    const model  = container.querySelector('#knjCanvasModel');
    let drawing  = false;
    function getTC() { return getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#f1f1f4'; }
    canvas.addEventListener('pointerdown', e => { drawing=true; const r=canvas.getBoundingClientRect(); ctx.beginPath(); ctx.moveTo((e.clientX-r.left)*(200/r.width),(e.clientY-r.top)*(200/r.height)); e.preventDefault(); });
    canvas.addEventListener('pointermove', e => { if(!drawing) return; const r=canvas.getBoundingClientRect(); ctx.lineTo((e.clientX-r.left)*(200/r.width),(e.clientY-r.top)*(200/r.height)); ctx.strokeStyle=getTC(); ctx.lineWidth=5; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.stroke(); e.preventDefault(); });
    canvas.addEventListener('pointerup',    () => { drawing=false; });
    canvas.addEventListener('pointerleave', () => { drawing=false; });
    const clearBtn = container.querySelector('#knjClearCanvas');
    if (clearBtn) clearBtn.addEventListener('click', () => { ctx.clearRect(0,0,200,200); model.style.opacity='0.08'; });
    return { canvas, ctx, model };
  }

  function _writeCardHTML(char, k, extraReveal) {
    return '<div class="card">' +
      '<div style="font-size:26px;font-weight:800;color:var(--text);text-align:center;margin-bottom:16px">' + k.meaning + '</div>' +
      '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;text-align:center;margin-bottom:14px">Write the kanji from memory</div>' +
      '<div style="display:flex;flex-direction:column;align-items:center;gap:10px">' +
        '<div class="knj-canvas-wrap" id="knjCanvasWrap" style="width:200px;height:200px">' +
          '<div class="knj-canvas-model" id="knjCanvasModel">' + char + '</div>' +
          '<canvas id="knjCanvas" width="200" height="200" style="position:absolute;inset:0;touch-action:none"></canvas>' +
        '</div>' +
        '<div class="knj-canvas-hint">Draw in the box · tap Reveal when done</div>' +
        '<div style="display:flex;gap:8px;width:100%;max-width:240px">' +
          '<button class="btn btn-secondary" id="knjClearCanvas" style="flex:1">Clear</button>' +
          '<button class="btn btn-primary" id="knjRevealBtn" style="flex:1">Reveal →</button>' +
        '</div>' +
      '</div>' +
      '<div id="knjWriteReveal" style="display:none;margin-top:16px">' +
        extraReveal +
      '</div>' +
    '</div>';
  }

  // ── Active Write (learning — no grade buttons, just got/missed) ──
  function _renderActiveWrite(char, container, onComplete) {
    const k = n5Data.find(d => d.char === char);
    if (!k) return;
    container.innerHTML =
      _pipHTML() +
      _drillBackHeader('WRITING RECALL') +
      _writeCardHTML(char, k,
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Did you get it?</div>' +
        '<div style="display:flex;gap:8px">' +
          '<button class="btn btn-secondary" id="knjWriteMissed" style="flex:1">✗ Missed it</button>' +
          '<button class="btn btn-primary"   id="knjWriteGotIt"  style="flex:1">✓ Got it!</button>' +
        '</div>'
      );
    container.querySelector('#knjBackBtn').addEventListener('click', () => { _drillState = null; renderHome(container); });
    _setupCanvas(container, char);
    container.querySelector('#knjRevealBtn').addEventListener('click', () => {
      container.querySelector('#knjCanvasModel').style.opacity = '0.55';
      container.querySelector('#knjWriteReveal').style.display = '';
      container.querySelector('#knjRevealBtn').style.display = 'none';
    });
    container.querySelector('#knjWriteGotIt').addEventListener('click',  () => onComplete(true));
    container.querySelector('#knjWriteMissed').addEventListener('click', () => onComplete(false));
    const spaceH = e => { if(e.code==='Space'){e.preventDefault();const b=container.querySelector('#knjRevealBtn');if(b&&b.style.display!=='none')b.click();} };
    document.addEventListener('keydown', spaceH);
    container.querySelector('#knjBackBtn').addEventListener('click', () => document.removeEventListener('keydown', spaceH));
  }

  // ── SRS Review session ─────────────────────────────────────
  function startReviewSession(container, mode, selectedChars) {
    mode = mode || 'due';
    let items;
    if (mode === 'due')    items = buildReviewSession();
    else if (mode === 'all') items = Object.values(progress).filter(p => p.introduced_at !== null).sort(() => Math.random() - 0.5);
    else if (mode === 'select' && selectedChars) items = selectedChars.map(c => progress[c]).filter(Boolean);
    else items = buildReviewSession();
    if (!items.length) { renderHome(container); return; }
    _drillState = { items, idx:0, results:[], mode:'srs', srsMode:mode };
    _nextReviewItem(container);
  }

  function _nextReviewItem(container) {
    const ds = _drillState;
    if (!ds || ds.idx >= ds.items.length) { _showReviewSummary(container); return; }
    const p = ds.items[ds.idx];
    const k = n5Data.find(d => d.char === p.char);
    if (!k) { ds.idx++; _nextReviewItem(container); return; }
    const rc = p.review_count || 0;
    const drillType = rc % 3 === 0 ? 'mcq' : rc % 3 === 1 ? 'mcq_rev' : 'write';
    const progressHTML =
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;flex:1">REVIEW · ' + (ds.idx+1) + ' / ' + ds.items.length + '</div>' +
        '<div style="height:4px;background:var(--border);border-radius:2px;width:100px;overflow:hidden">' +
          '<div style="height:100%;background:var(--accent3);border-radius:2px;width:' + Math.round(ds.idx/ds.items.length*100) + '%;transition:width .3s"></div>' +
        '</div>' +
        '<button class="btn btn-secondary" id="knjRevExitBtn" style="font-size:11px;padding:5px 10px">✕ Exit</button>' +
      '</div>';
    const onGrade = (c, grade) => {
      if (ds.srsMode === 'due') scheduleReview(c, grade);
      ds.results.push({ char:c, grade, drillType });
      ds.idx++;
      _nextReviewItem(container);
    };
    if (drillType === 'write') _renderSRSWrite(p.char, container, progressHTML, onGrade);
    else                       _renderSRSMCQ(p.char, container, drillType === 'mcq_rev', progressHTML, onGrade);
    setTimeout(() => {
      const exit = container.querySelector('#knjRevExitBtn');
      if (exit) exit.addEventListener('click', () => { _drillState = null; renderHome(container); });
    }, 0);
  }

  // ── SRS MCQ (with 3 grade buttons) ────────────────────────
  function _renderSRSMCQ(char, container, isReverse, progressHTML, onGrade) {
    const k = n5Data.find(d => d.char === char);
    if (!k) return;
    const distractors = _getDistractors(k, 3);
    const wrongMeanings = distractors.map(c => { const d = n5Data.find(x => x.char===c); return d ? d.meaning : null; }).filter(Boolean);
    let options;
    if (isReverse) options = _shuffle([{ value:char, correct:true }, ...distractors.map(c => ({ value:c, correct:false }))]);
    else           options = _shuffle([{ value:k.meaning, correct:true }, ...wrongMeanings.map(m => ({ value:m, correct:false }))]);
    const keys = ['A','B','C','D'];
    const gradeRow =
      '<div class="knj-grade-row">' +
        '<button class="knj-grade-btn knj-grade-miss" data-grade="0">Miss<span class="knj-grade-sub">↓ interval</span></button>' +
        '<button class="knj-grade-btn knj-grade-hard" data-grade="1">Hard<span class="knj-grade-sub">×1.2</span></button>' +
        '<button class="knj-grade-btn knj-grade-got"  data-grade="2">Got it<span class="knj-grade-sub">×2.5</span></button>' +
      '</div>';

    container.innerHTML = progressHTML +
      '<div class="card" style="text-align:center">' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;margin-bottom:8px">' + (isReverse ? 'Select the kanji that means:' : 'What does this kanji mean?') + '</div>' +
        (isReverse
          ? '<div style="font-size:24px;font-weight:800;color:var(--text);padding:16px 0 20px">' + k.meaning + '</div>'
          : '<div style="font-family:\'Noto Sans JP\',sans-serif;font-size:96px;font-weight:900;line-height:1;padding:12px 0 20px">' + char + '</div>'
        ) +
        '<div class="knj-mcq-grid" id="knjMcqGrid">' +
          options.map((opt, i) =>
            '<button class="knj-mcq-opt" data-idx="' + i + '" data-correct="' + opt.correct + '">' +
              '<div class="knj-mcq-opt-key">' + keys[i] + '</div>' +
              '<div class="knj-mcq-opt-text">' + (isReverse ? '<span style="font-family:\'Noto Sans JP\',sans-serif;font-size:32px;font-weight:900">' + opt.value + '</span>' : opt.value) + '</div>' +
            '</button>'
          ).join('') +
        '</div>' +
        '<div id="knjMcqFeedback" style="display:none;margin-top:14px;text-align:left" class="knj-feedback-panel"></div>' +
      '</div>';

    const grid = container.querySelector('#knjMcqGrid');
    const feedback = container.querySelector('#knjMcqFeedback');
    let answered = false;
    function handleAnswer(optEl) {
      if (answered) return; answered = true;
      const isCorrect = optEl.dataset.correct === 'true';
      grid.querySelectorAll('.knj-mcq-opt').forEach(o => {
        if (o.dataset.correct==='true') o.classList.add('knj-opt-correct');
        else if (o===optEl && !isCorrect) o.classList.add('knj-opt-wrong');
        else o.classList.add('knj-opt-greyed');
        o.disabled = true;
      });
      feedback.style.display = '';
      feedback.innerHTML =
        '<div style="font-size:13px;color:' + (isCorrect?'var(--correct)':'var(--wrong)') + ';font-weight:700;margin-bottom:10px">' +
          (isCorrect ? '✓ Correct' : '✗ The answer was: ' + (isReverse ? char : k.meaning)) +
        '</div>' + gradeRow;
      feedback.querySelectorAll('[data-grade]').forEach(btn => btn.addEventListener('click', () => onGrade(char, parseInt(btn.dataset.grade))));
    }
    grid.querySelectorAll('.knj-mcq-opt').forEach(opt => opt.addEventListener('click', () => handleAnswer(opt)));
    const keyH = e => {
      if (answered) return;
      const idx = ['1','2','3','4'].indexOf(e.key)>-1 ? parseInt(e.key)-1 : 'abcd'.indexOf(e.key.toLowerCase());
      if (idx>=0) { document.removeEventListener('keydown',keyH); const opts=grid.querySelectorAll('.knj-mcq-opt'); if(opts[idx]) handleAnswer(opts[idx]); }
    };
    document.addEventListener('keydown', keyH);
  }

  // ── SRS Write (with 3 grade buttons) ──────────────────────
  function _renderSRSWrite(char, container, progressHTML, onGrade) {
    const k = n5Data.find(d => d.char === char);
    if (!k) return;
    const gradeRow =
      '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Self-grade</div>' +
      '<div class="knj-grade-row">' +
        '<button class="knj-grade-btn knj-grade-miss" data-grade="0">Miss<span class="knj-grade-sub">↓ interval</span></button>' +
        '<button class="knj-grade-btn knj-grade-hard" data-grade="1">Hard<span class="knj-grade-sub">×1.2</span></button>' +
        '<button class="knj-grade-btn knj-grade-got"  data-grade="2">Got it<span class="knj-grade-sub">×2.5</span></button>' +
      '</div>';
    container.innerHTML = progressHTML + _writeCardHTML(char, k, gradeRow);
    _setupCanvas(container, char);
    container.querySelector('#knjRevealBtn').addEventListener('click', () => {
      container.querySelector('#knjCanvasModel').style.opacity = '0.55';
      container.querySelector('#knjWriteReveal').style.display = '';
      container.querySelector('#knjRevealBtn').style.display = 'none';
    });
    container.querySelector('#knjWriteReveal').querySelectorAll('[data-grade]').forEach(btn => {
      btn.addEventListener('click', () => onGrade(char, parseInt(btn.dataset.grade)));
    });
    const spaceH = e => { if(e.code==='Space'){e.preventDefault();const b=container.querySelector('#knjRevealBtn');if(b&&b.style.display!=='none')b.click();} };
    document.addEventListener('keydown', spaceH);
  }

  function _showReviewSummary(container) {
    const ds = _drillState;
    const results = ds ? ds.results : [];
    const miss = results.filter(r => r.grade===0).length;
    const hard = results.filter(r => r.grade===1).length;
    const got  = results.filter(r => r.grade===2).length;
    _drillState = null;
    container.innerHTML =
      '<div class="card" style="text-align:center;padding:28px">' +
        '<div style="font-size:40px;margin-bottom:12px">🏆</div>' +
        '<div style="font-size:20px;font-weight:800;color:var(--text);margin-bottom:4px">Review Complete!</div>' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:10px;color:var(--muted);margin-bottom:20px">KANJI SRS SESSION</div>' +
        '<div class="knj-stat-grid" style="max-width:320px;margin:0 auto 20px">' +
          '<div class="knj-stat-card"><span class="knj-stat-val" style="color:var(--correct)">' + got  + '</span><span class="knj-stat-label">Got it</span></div>' +
          '<div class="knj-stat-card"><span class="knj-stat-val" style="color:var(--warn)">'   + hard + '</span><span class="knj-stat-label">Hard</span></div>' +
          '<div class="knj-stat-card"><span class="knj-stat-val" style="color:var(--wrong)">'  + miss + '</span><span class="knj-stat-label">Missed</span></div>' +
          '<div class="knj-stat-card"><span class="knj-stat-val">' + results.length + '</span><span class="knj-stat-label">Total</span></div>' +
        '</div>' +
        '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
          '<button class="btn btn-primary" id="knjRevAgainBtn">Review More 🔄</button>' +
          '<button class="btn btn-secondary" id="knjRevDoneBtn">Back to Home</button>' +
        '</div>' +
      '</div>';
    container.querySelector('#knjRevDoneBtn').addEventListener('click', () => renderHome(container));
    container.querySelector('#knjRevAgainBtn').addEventListener('click', () => startReviewSession(container, 'due'));
  }

  // ── Error state ────────────────────────────────────────────
  function _renderDataError(container) {
    container.innerHTML =
      '<div class="knj-error-box">' +
        '<span style="font-size:20px">⚠️</span>' +
        '<div>' +
          '<div style="font-weight:700;margin-bottom:3px">Could not load kanji data</div>' +
          '<div style="font-size:12px;opacity:.8">Check your connection or R2 bucket configuration.</div>' +
          '<button class="btn btn-secondary" style="margin-top:10px;font-size:12px" onclick="KNJ_ENGINE.openKanjiMode()">Retry</button>' +
        '</div>' +
      '</div>';
  }

  // ── Entry points ───────────────────────────────────────────
  async function openKanjiMode() {
    if (!n5Data) await init();
    const inner = document.getElementById('knjModeInner');
    if (!inner) return;
    if (n5Data) renderHome(inner);
    else _renderDataError(inner);
  }

  // ── Legacy compat stubs ────────────────────────────────────
  function renderDrillCard(char, container)  { _startLearningDrill(char, container); }
  function renderMCQDrill(char, container, isReverse, onGrade) {
    if (onGrade) _renderSRSMCQ(char, container, isReverse || false, '', onGrade);
    else         _renderActiveMCQ(char, container, isReverse || false, () => {});
  }
  function renderContextDrill(char, container) { _renderActiveContext(char, container, () => {}); }
  function renderWriteDrill(char, container, onGrade) {
    if (onGrade) _renderSRSWrite(char, container, '', onGrade);
    else         _renderActiveWrite(char, container, () => {});
  }

  // ── Public API ─────────────────────────────────────────────
  return {
    init, openKanjiMode, renderHome, renderIntroCard,
    renderDrillCard, renderMCQDrill, renderContextDrill, renderWriteDrill,
    startReviewSession, scheduleReview, toggleTheme, getProgress,
  };

})();

// ── Theme init on page load ────────────────────────────────
(function () {
  const saved = localStorage.getItem('knj_theme') || 'dark';
  document.documentElement.dataset.theme = saved;
})();
