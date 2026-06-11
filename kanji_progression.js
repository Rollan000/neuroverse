/**
 * kanji_progression.js — KNJ Engine for Neuroverse
 * Rework v3.0: Full P0–P7 backlog implementation
 *
 * P0 — CSS token correction (Yoru palette, stage triplets, dot-grid texture)
 * P1 — Home screen rewrite (stat grid, review CTA, .kj tile system, legend)
 * P2 — Intro card rewrite (2-col layout, hero row, radical pill)
 * P3 — Drill shell (9px dot progress, eyebrow+badge, exp-box, 4-grade btns)
 * P4 — Context blank upgrade (48×30px box element, 32px option font)
 * P5 — 4-grade SRS (Again/Hard/Good/Easy + interval subs)
 * P6 — Side panel on intro card (track progress bar + related kanji list)
 * P7 — Canvas guide SVG (30px grid + crosshairs)
 *
 * All code lives inside the IIFE — do not unwrap.
 * New CSS goes inside KNJ_CSS string only.
 * Public API: return { ... } at the bottom.
 */
const KNJ_ENGINE = (() => {

  // ── Constants ────────────────────────────────────────────────────
  const LS_PROGRESS   = 'knj_progress';
  const LS_THEME      = 'knj_theme';
  const LS_NEW_TODAY  = 'knj_new_today';
  const LS_FURI_PREF  = 'knj_furi_pref';
  const LS_STREAK     = 'knj_streak';
  const SS_N5_CACHE   = 'knj_n5_cache';

  const STAGE_LOCKED   = 0;
  const STAGE_INTRO    = 1;
  const STAGE_SRS      = 5;
  const STAGE_MASTERED = 6;

  const INTERVAL_8H  = 8  * 3600  * 1000;
  const INTERVAL_24H = 24 * 3600  * 1000;
  const INTERVAL_3D  = 3  * 86400 * 1000;
  const INTERVAL_7D  = 7  * 86400 * 1000;
  const INTERVAL_21D = 21 * 86400 * 1000;
  const INTERVAL_60D = 60 * 86400 * 1000;

  const MAX_NEW_PER_DAY = 5;

  const RANKS = [
    { id:'academy', label:'Academy', icon:'🎓', min:0            },
    { id:'genin',   label:'Genin',   icon:'🟦', min:INTERVAL_24H },
    { id:'chunin',  label:'Chūnin',  icon:'🟣', min:INTERVAL_7D  },
    { id:'jonin',   label:'Jōnin',   icon:'🌟', min:INTERVAL_21D },
    { id:'hokage',  label:'Hokage',  icon:'👑', min:INTERVAL_60D },
  ];

  // ── KNJ_CSS ──────────────────────────────────────────────────────
  const KNJ_CSS = `
/* ═══════════════════════════════════════════════════════════════
   P0: DESIGN TOKENS — Yoru palette (corrected)
═══════════════════════════════════════════════════════════════ */
[data-theme="dark"] #kanjiMode, #kanjiMode {
  --bg:       #060608;
  --surface:  #101014;
  --surface2: #17171d;
  --border:   #2a2a33;
  --text:     #f1f1f4;
  --muted:    #8b8b98;
  --accent3:  #6d78ff;
  --accent:   #b8c6ff;
  --correct:  #00ff9d;
  --wrong:    #ff4757;
  --warn:     #ffd32a;
  --grid-dot: rgba(180,190,255,0.03);
  --stage-mastered-bg:     rgba(0,255,157,0.08);
  --stage-mastered-border: rgba(0,255,157,0.30);
  --stage-mastered-text:   #00ff9d;
  --stage-srs-bg:          rgba(109,120,255,0.10);
  --stage-srs-border:      rgba(109,120,255,0.35);
  --stage-srs-text:        #b8c6ff;
  --stage-intro-bg:        #101014;
  --stage-intro-border:    #6d78ff;
  --stage-intro-text:      #6d78ff;
  --stage-locked-bg:       #17171d;
  --stage-locked-border:   #2a2a33;
  --stage-locked-text:     #8b8b98;
  --mnemonic-bg:     rgba(109,120,255,0.07);
  --mnemonic-border: #6d78ff;
  --highlight-bg:    rgba(109,120,255,0.25);
  --highlight-text:  #b8c6ff;
  --exp-box-bg:      rgba(0,255,157,0.06);
  --exp-box-border:  rgba(0,255,157,0.35);
}
[data-theme="day"] #kanjiMode {
  --bg:       #f5f3ef;
  --surface:  #ffffff;
  --surface2: #f0ede8;
  --border:   #ddd9d2;
  --text:     #1a1a24;
  --muted:    #7a7670;
  --accent3:  #2563eb;
  --accent:   #1d4ed8;
  --correct:  #059669;
  --wrong:    #dc2626;
  --warn:     #d97706;
  --grid-dot: rgba(60,75,219,0.03);
  --stage-mastered-bg:     rgba(5,150,105,0.08);
  --stage-mastered-border: rgba(5,150,105,0.30);
  --stage-mastered-text:   #059669;
  --stage-srs-bg:          rgba(37,99,235,0.08);
  --stage-srs-border:      rgba(37,99,235,0.30);
  --stage-srs-text:        #2563eb;
  --stage-intro-bg:        #ffffff;
  --stage-intro-border:    #2563eb;
  --stage-intro-text:      #2563eb;
  --stage-locked-bg:       #f0ede8;
  --stage-locked-border:   #ddd9d2;
  --stage-locked-text:     #7a7670;
  --mnemonic-bg:     rgba(37,99,235,0.06);
  --mnemonic-border: #2563eb;
  --highlight-bg:    rgba(37,99,235,0.15);
  --highlight-text:  #1d4ed8;
  --exp-box-bg:      rgba(5,150,105,0.06);
  --exp-box-border:  rgba(5,150,105,0.35);
}

/* BASE */
#kanjiMode { background: var(--bg); position: relative; }
#kanjiMode::before {
  content: ''; position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background-image: radial-gradient(circle, var(--grid-dot) 1px, transparent 1px);
  background-size: 24px 24px;
}
#knjModeInner {
  min-height: 400px; box-sizing: border-box; position: relative; z-index: 1;
  max-width: 600px; margin-left: auto; margin-right: auto;
}

/* P1: HOME HEADER */
.knj-home-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.knj-home-title {
  font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800;
  color: var(--text); letter-spacing: -.02em; flex: 1;
}
.knj-due-badge {
  font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700;
  letter-spacing: .04em; background: var(--wrong); color: #fff;
  padding: 3px 9px; border-radius: 20px;
}
.knj-theme-btn {
  background: none; border: 1px solid var(--border); border-radius: 8px;
  cursor: pointer; font-size: 14px; padding: 5px 8px; line-height: 1; transition: border-color .15s;
}
.knj-theme-btn:hover { border-color: var(--accent3); }

/* P1: STAT GRID */
.knj-stat-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 14px; }
.knj-stat-cell {
  background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px;
}
.knj-stat-value {
  font-family: 'Space Mono', monospace; font-size: 20px; font-weight: 700;
  color: var(--text); line-height: 1; margin-bottom: 4px;
}
.knj-stat-label {
  font-family: 'Space Mono', monospace; font-size: 9px;
  text-transform: uppercase; letter-spacing: .1em; color: var(--muted);
}
.knj-stat-cell.stat-due    .knj-stat-value { color: var(--wrong); }
.knj-stat-cell.stat-streak .knj-stat-value { color: var(--warn); }

/* P1: REVIEW CTA */
.knj-review-cta {
  background: var(--surface); border: 1px solid var(--border); border-left: 3px solid var(--accent3);
  border-radius: 10px; padding: 14px 18px; margin-bottom: 16px;
  display: flex; justify-content: space-between; align-items: center;
}
.knj-review-cta-label { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text); font-weight: 700; }
.knj-review-cta-sub { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--muted); margin-top: 2px; }

/* TABS */
.knj-tabs { display: flex; gap: 4px; margin-bottom: 16px; background: var(--surface2); border-radius: 10px; padding: 4px; }
.knj-tab {
  flex: 1; padding: 8px 0; border: none; background: none;
  font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700;
  color: var(--muted); border-radius: 7px; cursor: pointer; transition: all .15s;
}
.knj-tab.active { background: var(--surface); color: var(--text); box-shadow: 0 1px 4px rgba(0,0,0,.3); }

/* P1: KANJI TILES */
.knj-kanji-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
.kj {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  width: 56px; height: 64px; border-radius: 10px; cursor: pointer; transition: all .15s;
  position: relative; border: 1.5px solid var(--stage-locked-border); background: var(--stage-locked-bg);
}
.kj:hover:not(.kj-locked) { transform: translateY(-2px); filter: brightness(1.08); }
.kj-char { font-family: 'Noto Sans JP', sans-serif; font-size: 26px; font-weight: 900; line-height: 1; color: var(--text); }
.kj-label {
  font-family: 'Space Mono', monospace; font-size: 7px; text-transform: uppercase;
  letter-spacing: .04em; color: var(--muted); margin-top: 3px; text-align: center;
  white-space: nowrap; overflow: hidden; max-width: 52px;
}
.kj-badge { position: absolute; top: 3px; right: 4px; font-size: 9px; }
.kj-mastered { background: var(--stage-mastered-bg); border-color: var(--stage-mastered-border); }
.kj-mastered .kj-char  { color: var(--stage-mastered-text); }
.kj-mastered .kj-label { color: var(--stage-mastered-text); opacity: .7; }
.kj-srs { background: var(--stage-srs-bg); border-color: var(--stage-srs-border); }
.kj-srs .kj-char  { color: var(--stage-srs-text); }
.kj-srs .kj-label { color: var(--stage-srs-text); opacity: .7; }
.kj-intro { background: var(--stage-intro-bg); border-color: var(--stage-intro-border); border-width: 2px; }
.kj-intro .kj-char  { color: var(--text); }
.kj-intro .kj-label { color: var(--stage-intro-text); }
.kj-locked { background: var(--stage-locked-bg); border-color: var(--stage-locked-border); opacity: .4; cursor: default; }
.kj-locked .kj-char { color: var(--stage-locked-text); }

.knj-track-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; margin-top: 4px; }
.knj-track-pill {
  font-family: 'Space Mono', monospace; font-size: 8px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .1em; padding: 3px 8px; border-radius: 20px;
  background: var(--accent3); color: #fff;
}
.knj-track-name { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: var(--text); flex: 1; }
.knj-track-count { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--muted); }

.knj-legend { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border); }
.knj-legend-item {
  display: flex; align-items: center; gap: 5px;
  font-family: 'Space Mono', monospace; font-size: 9px; color: var(--muted);
}
.knj-legend-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }

/* GACHA CTA */
.knj-gacha-cta {
  display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;
  padding: 13px 20px; border-radius: 12px; cursor: pointer; font-weight: 700; font-size: 13px;
  background: var(--accent3); color: #fff; border: none; transition: all .15s;
  font-family: 'Syne', sans-serif; letter-spacing: -.01em;
}
.knj-gacha-cta:hover { filter: brightness(1.12); transform: translateY(-1px); }
.knj-gacha-cta.disabled { background: var(--surface2); color: var(--muted); cursor: default; border: 1px solid var(--border); transform: none; filter: none; }
.knj-gacha-remain {
  font-family: 'Space Mono', monospace; font-size: 9px; opacity: .75;
  background: rgba(255,255,255,.15); padding: 2px 7px; border-radius: 10px; margin-left: 4px;
}

/* LABELS */
.knj-section-label {
  font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: .12em;
  text-transform: uppercase; color: var(--muted); margin-bottom: 8px; margin-top: 14px;
}
.knj-sub-label {
  font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: .1em;
  text-transform: uppercase; color: var(--muted); margin-bottom: 6px; margin-top: 12px;
}

/* P2: INTRO CARD */
.knj-intro-layout { display: grid; grid-template-columns: 1fr 210px; gap: 14px; align-items: start; }
@media (max-width: 660px) { .knj-intro-layout { grid-template-columns: 1fr; } .knj-intro-side { display: none; } }
.knj-intro-hero { display: flex; align-items: flex-start; gap: 20px; margin-bottom: 16px; }
.knj-intro-char-hero {
  font-family: 'Noto Sans JP', sans-serif; font-size: 96px; font-weight: 900; line-height: 1; color: var(--text); flex-shrink: 0;
}
.knj-intro-hero-meta { flex: 1; padding-top: 6px; }
.knj-intro-meaning-hero {
  font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: var(--text); margin-bottom: 8px; line-height: 1.1;
}
.knj-intro-reading-groups { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 8px; }
.knj-rdg-group { display: flex; flex-direction: column; gap: 1px; }
.knj-rdg-group-label { font-family: 'Space Mono', monospace; font-size: 8px; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); }
.knj-rdg-group-value { font-family: 'Noto Sans JP', sans-serif; font-size: 18px; font-weight: 700; color: var(--text); line-height: 1.2; }
.knj-rdg-group-rom { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--accent3); }
.knj-intro-badges { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
.knj-badge {
  font-family: 'Space Mono', monospace; font-size: 8px; text-transform: uppercase; letter-spacing: .08em;
  padding: 3px 7px; border-radius: 4px; border: 1px solid var(--border); color: var(--muted); background: var(--surface2);
}
.knj-badge-accent { border-color: var(--accent3); color: var(--accent3); background: rgba(109,120,255,.08); }
.knj-card-divider { height: 1px; background: var(--border); margin: 14px 0; }

.knj-radical-pills { display: flex; gap: 8px; flex-wrap: wrap; }
.knj-radical-pill {
  display: flex; align-items: center; gap: 6px; padding: 5px 10px 5px 6px;
  border-radius: 8px; background: var(--surface2); border: 1px solid var(--border);
}
.knj-radical-char { font-family: 'Noto Sans JP', sans-serif; font-size: 20px; font-weight: 900; color: var(--text); line-height: 1; }
.knj-radical-name { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }

.knj-mnemonic-box {
  background: var(--mnemonic-bg); border-left: 3px solid var(--mnemonic-border);
  border-radius: 0 8px 8px 0; padding: 12px 14px; font-size: 13px; line-height: 1.7; color: var(--text);
}
.knj-target { background: var(--highlight-bg); color: var(--highlight-text); border-radius: 3px; padding: 0 2px; font-weight: 900; }

.knj-sentence-block { margin-bottom: 12px; }
.knj-furi-hidden ruby rt { visibility: hidden; }
.knj-furi-toggle {
  font-family: 'Space Mono', monospace; font-size: 9px; color: var(--muted); cursor: pointer;
  text-transform: uppercase; letter-spacing: .08em; border: none; background: none; padding: 0 0 5px; display: block;
}
.knj-sent-ruby { font-family: 'Noto Sans JP', sans-serif; font-size: 16px; line-height: 2.4; color: var(--text); margin-bottom: 4px; }
.knj-jp-sentence { font-family: 'Noto Sans JP', sans-serif; font-size: 16px; line-height: 2.4; color: var(--text); margin-bottom: 4px; }
.knj-en-sentence { font-size: 12px; color: var(--muted); }
.knj-source-tag { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--accent3); margin-left: 6px; border: 1px solid var(--accent3); border-radius: 4px; padding: 1px 4px; }
.knj-grammar-note { font-size: 11px; color: var(--muted); font-style: italic; border-left: 2px solid var(--accent3); padding: 3px 8px; margin-top: 6px; line-height: 1.5; }

/* P6: SIDE PANEL */
.knj-intro-side { display: flex; flex-direction: column; gap: 12px; }
.knj-side-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
.knj-progress-bar-wrap { height: 5px; background: var(--surface2); border-radius: 3px; overflow: hidden; margin: 8px 0; }
.knj-progress-bar-fill { height: 100%; background: var(--accent3); border-radius: 3px; transition: width .4s ease; }
.knj-side-stat-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 4px 0; border-bottom: 1px solid var(--border);
  font-family: 'Space Mono', monospace; font-size: 9px;
}
.knj-side-stat-row:last-child { border-bottom: none; }
.knj-side-stat-val { color: var(--text); font-weight: 700; }
.knj-side-stat-lbl { color: var(--muted); }
.knj-related-row { display: flex; align-items: center; gap: 8px; padding: 5px 0; border-bottom: 1px solid var(--border); }
.knj-related-row:last-child { border-bottom: none; }
.knj-related-char { font-family: 'Noto Sans JP', sans-serif; font-size: 20px; font-weight: 900; width: 28px; }
.knj-related-meta { flex: 1; }
.knj-related-meaning { font-size: 11px; color: var(--text); font-weight: 700; }
.knj-related-status { font-family: 'Space Mono', monospace; font-size: 8px; color: var(--muted); margin-top: 1px; }

/* P3: DRILL SHELL */
.knj-eyebrow { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.knj-eyebrow-left { display: flex; align-items: center; gap: 8px; }
.knj-eyebrow-text { font-family: 'Space Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: .12em; color: var(--muted); }
.knj-eyebrow-badge { font-family: 'Space Mono', monospace; font-size: 8px; padding: 2px 7px; border-radius: 4px; border: 1px solid var(--border); color: var(--muted); }
.knj-eyebrow-badge-warn  { border-color: var(--warn);    color: var(--warn);    background: rgba(255,211,42,.08); }
.knj-eyebrow-badge-green { border-color: var(--correct); color: var(--correct); background: rgba(0,255,157,.08); }

.knj-dot-row { display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap; }
.knj-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--border); transition: background .3s; flex-shrink: 0; }
.knj-dot-ok  { background: var(--correct); }
.knj-dot-bad { background: var(--wrong); }
.knj-dot-cur { background: var(--accent3); box-shadow: 0 0 0 2px rgba(109,120,255,.3); }

.knj-exp-box {
  background: var(--exp-box-bg); border-left: 3px solid var(--exp-box-border);
  border-radius: 0 8px 8px 0; padding: 10px 12px; margin-top: 12px;
  font-size: 11px; color: var(--muted); line-height: 1.6;
}
.knj-exp-box-correct { border-left-color: var(--correct); background: rgba(0,255,157,.06); }
.knj-exp-box-wrong   { border-left-color: var(--wrong);   background: rgba(255,71,87,.06); }
.knj-exp-box strong  { color: var(--text); }

/* P3/P5: 4-GRADE BUTTONS */
.knj-grade-row { display: flex; gap: 6px; margin-top: 14px; }
.knj-grade-btn {
  flex: 1; padding: 9px 4px; border-radius: 7px;
  font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700;
  cursor: pointer; background: var(--surface2); transition: all .15s;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  border: 1.5px solid var(--border); color: var(--muted);
}
.knj-grade-sub { font-size: 8px; font-weight: 400; opacity: .7; }
.knj-grade-again { border-color: var(--wrong);   color: var(--wrong);   }  .knj-grade-again:hover { background: rgba(255,71,87,.1);  }
.knj-grade-hard  { border-color: var(--warn);    color: var(--warn);    }  .knj-grade-hard:hover  { background: rgba(255,211,42,.1); }
.knj-grade-good  { border-color: var(--correct); color: var(--correct); }  .knj-grade-good:hover  { background: rgba(0,255,157,.1);  }
.knj-grade-easy  { border-color: var(--accent);  color: var(--accent);  }  .knj-grade-easy:hover  { background: rgba(184,198,255,.1);}
.knj-grade-miss { border-color: var(--wrong); color: var(--wrong); }  .knj-grade-miss:hover { background: rgba(255,71,87,.1); }
.knj-grade-got  { border-color: var(--correct); color: var(--correct); }  .knj-grade-got:hover  { background: rgba(0,255,157,.1); }

/* MCQ */
.knj-mcq-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
.knj-mcq-opt {
  display: flex; align-items: center; padding: 12px 14px;
  background: var(--surface2); border: 1.5px solid var(--border); border-radius: 10px;
  cursor: pointer; text-align: left; font-family: inherit; font-size: 13px;
  color: var(--text); transition: all .15s; font-weight: 700;
}
.knj-mcq-opt:hover:not(:disabled) { border-color: var(--accent3); }
.knj-mcq-opt-text { flex: 1; font-size: 13px; }
.knj-opt-correct { background: rgba(0,255,157,.12) !important; border-color: var(--correct) !important; }
.knj-opt-wrong   { background: rgba(255,71,87,.12)  !important; border-color: var(--wrong)   !important; }
.knj-opt-greyed  { opacity: .35; }

/* P4: CONTEXT DRILL */
.knj-context-sentence { font-family: 'Noto Sans JP', sans-serif; font-size: 18px; line-height: 2.8; text-align: center; margin: 16px 0; color: var(--text); }
.knj-context-blank {
  display: inline-flex; align-items: center; justify-content: center;
  width: 48px; height: 30px; border: 2px solid var(--accent3); border-radius: 4px;
  vertical-align: middle; background: rgba(109,120,255,.08); margin: 0 1px;
}
.knj-context-mc { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin: 12px 0; }
.knj-context-opt {
  padding: 10px 18px; border-radius: 10px; border: 1.5px solid var(--border);
  background: var(--surface2); cursor: pointer;
  font-family: 'Noto Sans JP', sans-serif; font-size: 32px; font-weight: 700;
  color: var(--text); transition: all .15s; line-height: 1;
}
.knj-context-opt:hover:not(:disabled) { border-color: var(--accent3); }
.knj-ctx-rdg-panel { margin-top: 14px; padding: 12px 14px; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; border-left: 3px solid var(--accent3); }
.knj-ctx-rdg-label { font-family: 'Space Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); margin-bottom: 8px; }
.knj-ctx-rdg-opts { display: flex; gap: 6px; flex-wrap: wrap; }
.knj-ctx-rdg-opt { padding: 6px 14px; border-radius: 8px; border: 1.5px solid var(--border); background: var(--surface); cursor: pointer; font-family: 'Noto Sans JP', sans-serif; font-size: 17px; font-weight: 700; color: var(--text); transition: all .15s; }
.knj-ctx-rdg-opt:hover:not(:disabled) { border-color: var(--accent3); }

/* P7: CANVAS GUIDE */
.knj-canvas-wrap { position: relative; margin: 12px auto; width: 180px; height: 180px; }
.knj-canvas-guide { position: absolute; inset: 0; pointer-events: none; opacity: .18; z-index: 1; }
.knj-canvas-model {
  position: absolute; inset: 0; font-family: 'Noto Sans JP', sans-serif;
  font-size: 140px; font-weight: 900; display: flex; align-items: center; justify-content: center;
  color: var(--text); opacity: .08; pointer-events: none; transition: opacity .3s; z-index: 2;
}
canvas.knj-canvas { border: 1.5px solid var(--border); border-radius: 12px; touch-action: none; background: var(--surface2); width: 180px; height: 180px; position: relative; z-index: 3; }
.knj-write-actions { display: flex; gap: 8px; justify-content: center; margin-top: 10px; }
.knj-write-hint { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--muted); text-align: center; margin-top: 6px; }
.knj-self-grade-note { font-size: 11px; color: var(--muted); text-align: center; margin: 8px 0 4px; line-height: 1.5; }

/* Binary write grade buttons */
.knj-write-grade-row { display: flex; gap: 8px; margin-top: 14px; }
.knj-write-grade-miss, .knj-write-grade-got {
  flex: 1; padding: 12px 8px; border-radius: 10px; cursor: pointer;
  font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 700;
  display: flex; flex-direction: column; align-items: center; gap: 3px; transition: all .15s;
}
.knj-write-grade-miss { border: 2px solid var(--wrong); color: var(--wrong); background: rgba(255,71,87,.06); }
.knj-write-grade-miss:hover { background: rgba(255,71,87,.14); }
.knj-write-grade-got  { border: 2px solid var(--correct); color: var(--correct); background: rgba(0,255,157,.06); }
.knj-write-grade-got:hover  { background: rgba(0,255,157,.14); }

/* STUDY CARD */
.knj-study-card {
  background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
  padding: 28px 24px; display: flex; flex-direction: column; gap: 0;
}
.knj-study-char {
  font-family: 'Noto Sans JP', sans-serif; font-size: 112px; font-weight: 900;
  line-height: 1; color: var(--text); text-align: center; margin-bottom: 8px;
  text-shadow: 0 0 60px rgba(109,120,255,0.15);
}
.knj-study-meaning {
  font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800;
  color: var(--text); text-align: center; margin-bottom: 14px; letter-spacing: -.01em;
}
.knj-study-readings { display: flex; gap: 16px; justify-content: center; margin-bottom: 20px; flex-wrap: wrap; }
.knj-study-rdg { display: flex; align-items: baseline; gap: 6px; }
.knj-study-rdg-type {
  font-family: 'Space Mono', monospace; font-size: 8px; text-transform: uppercase;
  letter-spacing: .1em; color: var(--muted); background: var(--surface2);
  padding: 2px 6px; border-radius: 3px; border: 1px solid var(--border);
}
.knj-study-rdg-kana { font-family: 'Noto Sans JP', sans-serif; font-size: 22px; font-weight: 700; color: var(--text); }
.knj-study-rdg-rom  { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--accent3); }
.knj-study-section-label {
  font-family: 'Space Mono', monospace; font-size: 8px; text-transform: uppercase;
  letter-spacing: .12em; color: var(--muted); margin-bottom: 8px; margin-top: 16px;
  padding-top: 14px; border-top: 1px solid var(--border);
}
.knj-study-radical {
  display: flex; align-items: center; gap: 10px;
  background: var(--surface2); border-radius: 8px; padding: 10px 14px;
  border: 1px solid var(--border);
}
.knj-study-radical-char { font-family: 'Noto Sans JP', sans-serif; font-size: 28px; font-weight: 900; }
.knj-study-radical-name { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--muted); text-transform: uppercase; }
.knj-study-mnemonic {
  background: var(--mnemonic-bg); border-left: 4px solid var(--mnemonic-border);
  border-radius: 0 10px 10px 0; padding: 14px 16px;
  font-size: 14px; line-height: 1.8; color: var(--text); font-style: italic;
}
.knj-study-sentence {
  background: var(--surface2); border-radius: 10px; padding: 14px 16px;
}
.knj-study-sent-jp  { font-family: 'Noto Sans JP', sans-serif; font-size: 17px; line-height: 2.6; color: var(--text); }
.knj-study-sent-en  { font-size: 12px; color: var(--muted); margin-top: 2px; }
.knj-study-sent-note { font-size: 10px; color: var(--muted); font-style: italic; margin-top: 6px; opacity: .8; border-left: 2px solid var(--accent3); padding-left: 8px; }
.knj-study-compounds { display: flex; flex-direction: column; gap: 0; }
.knj-study-compound {
  display: flex; align-items: baseline; gap: 8px; padding: 6px 0;
  border-bottom: 1px solid var(--border);
}
.knj-study-compound:last-child { border-bottom: none; }
.knj-study-compound-jp  { font-family: 'Noto Sans JP', sans-serif; font-size: 16px; font-weight: 700; color: var(--text); }
.knj-study-compound-rom { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--accent3); }
.knj-study-compound-en  { font-size: 11px; color: var(--muted); }
.knj-study-cta {
  width: 100%; margin-top: 24px; padding: 14px; font-size: 14px;
}

/* STREAK INDICATOR */
.knj-streak-indicator {
  display: flex; align-items: center; gap: 6px; margin-bottom: 12px;
  padding: 6px 10px; background: var(--surface2); border-radius: 8px;
  border: 1px solid var(--border);
}
.knj-streak-pip {
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--border); transition: background .25s, box-shadow .25s;
}
.knj-streak-pip.filled { background: var(--correct); box-shadow: 0 0 6px rgba(0,255,157,.4); }
.knj-streak-label {
  font-family: 'Space Mono', monospace; font-size: 9px; color: var(--muted);
  text-transform: uppercase; letter-spacing: .08em;
}

/* SRS */
.knj-srs-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.knj-srs-counter { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--muted); flex: 1; text-align: right; }

/* REVIEWS TAB */
.knj-review-card { padding: 14px 16px; margin-bottom: 8px; cursor: pointer; display: flex; align-items: center; gap: 14px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; transition: border-color .15s; }
.knj-review-card:hover { border-color: var(--accent3); }
.knj-review-char { font-family: 'Noto Sans JP', sans-serif; font-size: 32px; font-weight: 900; color: var(--text); min-width: 44px; text-align: center; }
.knj-review-meta { flex: 1; }
.knj-review-meaning { font-size: 13px; font-weight: 700; color: var(--text); }
.knj-review-due { font-size: 10px; font-family: 'Space Mono', monospace; color: var(--muted); margin-top: 2px; }
.knj-review-rank { font-size: 14px; }

/* MODALS */
.knj-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.75); display: flex; align-items: center; justify-content: center; z-index: 900; padding: 16px; }
.knj-modal { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px; max-width: 400px; width: 100%; max-height: 85vh; overflow-y: auto; }
.knj-modal-title { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; }
.knj-gacha-candidates { display: flex; gap: 10px; justify-content: center; margin: 16px 0; }
.knj-gacha-candidate { flex: 1; max-width: 110px; padding: 16px 8px; border-radius: 12px; border: 2px solid var(--border); cursor: pointer; text-align: center; transition: all .2s; background: var(--surface2); }
.knj-gacha-candidate:hover { border-color: var(--accent3); transform: translateY(-2px); }
.knj-gacha-cand-char { font-family: 'Noto Sans JP', sans-serif; font-size: 36px; font-weight: 900; }
.knj-gacha-cand-meaning { font-size: 11px; color: var(--muted); margin-top: 4px; }
.knj-detail-char { font-family: 'Noto Sans JP', sans-serif; font-size: 72px; font-weight: 900; text-align: center; line-height: 1; margin-bottom: 4px; color: var(--text); }
.knj-detail-meaning { font-size: 18px; font-weight: 700; text-align: center; color: var(--text); margin-bottom: 16px; }
.knj-pron-block { background: var(--surface2); border-radius: 8px; padding: 12px 14px; margin-bottom: 12px; border-left: 3px solid var(--accent3); }
.knj-rdg-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
.knj-rdg-card { display: flex; flex-direction: column; align-items: center; gap: 2px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; min-width: 56px; }
.knj-rdg-type { font-family: 'Space Mono', monospace; font-size: 8px; text-transform: uppercase; color: var(--muted); letter-spacing: .1em; }
.knj-rdg-kana { font-family: 'Noto Sans JP', sans-serif; font-size: 20px; font-weight: 700; color: var(--text); }
.knj-rdg-romaji { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--accent3); }
.knj-rdg-usage { font-size: 11px; color: var(--muted); font-style: italic; margin-bottom: 6px; }
.knj-compound-list { display: flex; flex-direction: column; }
.knj-compound-row { display: flex; align-items: baseline; gap: 8px; padding: 5px 0; border-bottom: 1px solid var(--border); }
.knj-compound-row:last-child { border-bottom: none; }
.knj-compound-jp { font-family: 'Noto Sans JP', sans-serif; font-size: 15px; font-weight: 700; color: var(--text); }
.knj-compound-romaji { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--accent3); }
.knj-compound-en { font-size: 11px; color: var(--muted); }

/* PATH MAP */
.knj-path-empty { padding: 40px 20px; text-align: center; font-size: 12px; color: var(--muted); font-family: 'Space Mono', monospace; }
.knj-path-icon { font-size: 36px; margin-bottom: 12px; }
.knj-path-map { display: flex; flex-direction: column-reverse; gap: 0; padding: 16px 0 8px; position: relative; }
.knj-path-segment { display: flex; flex-direction: column; align-items: center; position: relative; }
.knj-path-connector {
  width: 3px; height: 36px; flex-shrink: 0;
  background: linear-gradient(to top, var(--border), var(--border));
  transition: background .4s;
}
.knj-path-connector.done { background: linear-gradient(to top, var(--correct), var(--accent3)); }
.knj-path-node {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  width: 100%; padding: 14px 20px; border-radius: 16px;
  border: 2px solid var(--border); background: var(--surface2);
  cursor: default; transition: all .2s; position: relative;
}
.knj-path-node.done {
  border-color: var(--border); background: var(--surface); opacity: .7;
}
.knj-path-node.current {
  border-color: var(--accent3); background: var(--surface);
  cursor: pointer; box-shadow: 0 0 0 3px rgba(109,120,255,.15);
  animation: knjPulse 2.4s ease-in-out infinite;
}
.knj-path-node.current:hover { transform: scale(1.02); }
.knj-path-node.locked { opacity: .3; }
@keyframes knjPulse {
  0%, 100% { box-shadow: 0 0 0 3px rgba(109,120,255,.15); }
  50%       { box-shadow: 0 0 0 6px rgba(109,120,255,.28); }
}
.knj-path-node-char { font-family: 'Noto Sans JP', sans-serif; font-size: 44px; font-weight: 900; line-height: 1; }
.knj-path-node-meaning { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--text); }
.knj-path-node-type {
  font-family: 'Space Mono', monospace; font-size: 8px; text-transform: uppercase;
  letter-spacing: .12em; padding: 2px 8px; border-radius: 10px;
}
.knj-path-node-status {
  position: absolute; top: 10px; right: 14px;
  font-family: 'Space Mono', monospace; font-size: 9px;
}
.knj-path-kanji-hdr {
  font-family: 'Space Mono', monospace; font-size: 9px; text-transform: uppercase;
  letter-spacing: .12em; color: var(--muted); padding: 6px 0 4px; text-align: center;
}

/* READING NODE */
.knj-tap-kanji { color: var(--accent3); cursor: pointer; border-bottom: 1px dotted var(--accent3); transition: opacity .15s; }
.knj-tap-kanji:hover { opacity: .75; }

/* TEXT-INPUT RECALL */
.knj-recall-input-wrap { position: relative; margin-top: 14px; }
.knj-recall-input {
  width: 100%; box-sizing: border-box;
  padding: 14px 16px; border-radius: 10px;
  border: 2px solid var(--border); background: var(--surface2);
  font-family: 'Space Mono', monospace; font-size: 15px; color: var(--text);
  outline: none; transition: border-color .15s;
}
.knj-recall-input:focus { border-color: var(--accent3); }
.knj-recall-input.correct { border-color: var(--correct); background: rgba(0,255,157,.08); }
.knj-recall-input.wrong   { border-color: var(--wrong);   background: rgba(255,71,87,.08); }
.knj-recall-submit {
  width: 100%; margin-top: 8px; padding: 12px;
  border-radius: 10px; border: none; cursor: pointer;
  background: var(--accent3); color: #fff;
  font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
  transition: all .15s;
}
.knj-recall-submit:hover { filter: brightness(1.1); }
.knj-recall-submit:disabled { opacity: .4; cursor: default; }

/* SELF-GRADE 3-BUTTON (no intervals shown) */
.knj-selfgrade-row { display: flex; gap: 8px; margin-top: 14px; }
.knj-selfgrade-btn {
  flex: 1; padding: 13px 6px; border-radius: 10px; cursor: pointer;
  font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  transition: all .15s; border: 2px solid;
}
.knj-selfgrade-blank { border-color: var(--wrong);   color: var(--wrong);   background: rgba(255,71,87,.06);  }
.knj-selfgrade-blank:hover  { background: rgba(255,71,87,.14);  }
.knj-selfgrade-hmm   { border-color: var(--warn);    color: var(--warn);    background: rgba(255,211,42,.06); }
.knj-selfgrade-hmm:hover    { background: rgba(255,211,42,.14); }
.knj-selfgrade-got   { border-color: var(--correct); color: var(--correct); background: rgba(0,255,157,.06);  }
.knj-selfgrade-got:hover    { background: rgba(0,255,157,.14);  }
.knj-selfgrade-sub   { font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 400; opacity: .65; margin-top: 1px; }

/* STUDY PANELS (paged, not scrolled) */
.knj-study-panels { position: relative; overflow: hidden; }
.knj-study-panel {
  background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
  padding: 28px 24px; display: none; flex-direction: column; gap: 0;
  animation: knjFadeIn .2s ease;
}
.knj-study-panel.active { display: flex; }
.knj-panel-progress { display: flex; gap: 5px; justify-content: center; margin-bottom: 16px; }
.knj-panel-pip { width: 24px; height: 3px; border-radius: 2px; background: var(--border); transition: background .3s; }
.knj-panel-pip.active { background: var(--accent3); }
.knj-panel-pip.done   { background: var(--correct); }

/* COMPLETE */
.knj-complete-card { text-align: center; padding: 32px 24px; }
.knj-complete-char { font-family: 'Noto Sans JP', sans-serif; font-size: 80px; font-weight: 900; line-height: 1; margin-bottom: 8px; color: var(--correct); }

/* TOAST */
.knj-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); padding: 10px 20px; border-radius: 20px; font-size: 13px; font-weight: 700; color: #000; z-index: 9999; pointer-events: none; animation: knjToastFade 2s forwards; }
@keyframes knjToastFade { 0% { opacity:0; transform:translateX(-50%) translateY(8px); } 15% { opacity:1; transform:translateX(-50%) translateY(0); } 75% { opacity:1; } 100% { opacity:0; } }

/* TRANSITIONS */
@keyframes knjFadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
.knj-screen-enter { animation: knjFadeIn .2s ease; }

/* LEGACY COMPAT */
.knj-feedback-panel { padding: 10px 12px; background: var(--surface2); border-radius: 8px; border: 1px solid var(--border); }
.knj-mnemonic { background: var(--mnemonic-bg); border-left: 3px solid var(--mnemonic-border); border-radius: 0 8px 8px 0; padding: 12px 14px; font-size: 13px; line-height: 1.7; color: var(--text); margin-bottom: 12px; }
.knj-srs-grade-row { display: flex; gap: 8px; margin-top: 14px; }
`;

  // ── State ─────────────────────────────────────────────────────────
  let n5Data      = null;
  let progress    = {};
  let _activeTab  = 'catalog';
  let _drillState = null;

  // ── Style injection ───────────────────────────────────────────────
  function _injectStyles() {
    if (document.getElementById('knj-styles')) return;
    const s = document.createElement('style');
    s.id = 'knj-styles'; s.textContent = KNJ_CSS;
    document.head.appendChild(s);
  }

  // ── init() ────────────────────────────────────────────────────────
  async function init() {
    _injectStyles();
    const savedTheme = localStorage.getItem(LS_THEME) || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    try { const raw = localStorage.getItem(LS_PROGRESS); progress = raw ? JSON.parse(raw) : {}; } catch (_) { progress = {}; }
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

  function toggleTheme() {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'day' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(LS_THEME, next); } catch (_) {}
  }

  // ── Progress storage ──────────────────────────────────────────────
  function _saveProgress() {
    try { localStorage.setItem(LS_PROGRESS, JSON.stringify(progress)); } catch (_) {}
  }

  function _getOrCreateProgress(char, track) {
    if (!progress[char]) {
      progress[char] = {
        char, track: track || 'n5',
        order: n5Data ? n5Data.findIndex(k => k.char === char) : 0,
        stage: STAGE_LOCKED, srs_interval_ms: 0, srs_due: null,
        introduced_at: null, review_count: 0, correct_total: 0,
        wrong_total: 0, last_seen: null, recent_wrong: false,
        manual_reviews: 0, rank: null, reading_done: false, reinforce_done: false,
      };
    }
    if (progress[char].reading_done  === undefined) progress[char].reading_done  = false;
    if (progress[char].reinforce_done === undefined) progress[char].reinforce_done = false;
    return progress[char];
  }

  function _setProgress(char, data) { Object.assign(_getOrCreateProgress(char), data); _saveProgress(); }
  function getProgress(char) { return progress[char] || null; }

  // ── Rank ──────────────────────────────────────────────────────────
  function _getRank(p) {
    if (!p || p.stage < STAGE_SRS) return null;
    let rank = RANKS[0];
    for (const r of RANKS) { if ((p.srs_interval_ms || 0) >= r.min) rank = r; }
    return rank;
  }
  function _updateRank(char) {
    const p = progress[char]; if (!p) return;
    const r = _getRank(p); p.rank = r ? r.id : null;
  }

  // ── Unlock logic ──────────────────────────────────────────────────
  function _computeUnlocks() {
    if (!n5Data) return;
    n5Data.forEach((k, idx) => {
      const p = _getOrCreateProgress(k.char, 'n5');
      if (idx === 0 && p.stage === STAGE_LOCKED) p.stage = STAGE_INTRO;
      if (p.stage >= STAGE_SRS) {
        (k.related || []).forEach(rel => {
          const rp = _getOrCreateProgress(rel.char, 'n5');
          if (rp.stage === STAGE_LOCKED) rp.stage = STAGE_INTRO;
        });
      }
    });
    _saveProgress();
  }

  // ── Daily cap ─────────────────────────────────────────────────────
  function _getTodayNewCount() {
    try {
      const raw = localStorage.getItem(LS_NEW_TODAY); if (!raw) return 0;
      const obj = JSON.parse(raw);
      return obj.date === new Date().toISOString().slice(0, 10) ? (obj.count || 0) : 0;
    } catch (_) { return 0; }
  }
  function _incrementTodayNew() {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const raw = localStorage.getItem(LS_NEW_TODAY);
      let obj = { date: today, count: 0 };
      if (raw) { const p = JSON.parse(raw); if (p.date === today) obj = p; }
      obj.count = (obj.count || 0) + 1;
      localStorage.setItem(LS_NEW_TODAY, JSON.stringify(obj));
    } catch (_) {}
    _touchStreak();
  }

  // ── Streak ────────────────────────────────────────────────────────
  // A day counts toward streak if the user did at least 1 review or 1 introduction.
  function _getStreak() {
    try {
      const raw = localStorage.getItem(LS_STREAK);
      return raw ? JSON.parse(raw) : { count: 0, lastDate: null };
    } catch (_) { return { count: 0, lastDate: null }; }
  }

  function _touchStreak() {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const s = _getStreak();
      if (s.lastDate === today) return; // already counted today
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const newCount = s.lastDate === yesterday ? s.count + 1 : 1;
      localStorage.setItem(LS_STREAK, JSON.stringify({ count: newCount, lastDate: today }));
    } catch (_) {}
  }

  // ── Stats ─────────────────────────────────────────────────────────
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

  // ── P5: 4-grade SRS engine ────────────────────────────────────────
  // grade: 0=Again  1=Hard  2=Good  3=Easy
  function scheduleReview(char, grade) {
    const p = _getOrCreateProgress(char);
    const now = Date.now();
    p.review_count = (p.review_count || 0) + 1;
    p.last_seen = now;
    if (grade === 0) {
      p.wrong_total = (p.wrong_total || 0) + 1; p.recent_wrong = true;
      p.srs_interval_ms = INTERVAL_8H;
    } else if (grade === 1) {
      p.correct_total = (p.correct_total || 0) + 1; p.recent_wrong = false;
      p.srs_interval_ms = Math.max(INTERVAL_24H, (p.srs_interval_ms || INTERVAL_8H));
    } else if (grade === 2) {
      p.correct_total = (p.correct_total || 0) + 1; p.recent_wrong = false;
      const prev = p.srs_interval_ms || INTERVAL_8H;
      p.srs_interval_ms = prev < INTERVAL_24H ? INTERVAL_24H : Math.round(prev * 2.5);
    } else {
      p.correct_total = (p.correct_total || 0) + 1; p.recent_wrong = false;
      const prev = p.srs_interval_ms || INTERVAL_8H;
      p.srs_interval_ms = Math.max(INTERVAL_3D, prev < INTERVAL_24H ? INTERVAL_3D : Math.round(prev * 4));
    }
    p.srs_due = now + p.srs_interval_ms;
    if (p.srs_interval_ms >= INTERVAL_60D) p.stage = STAGE_MASTERED;
    else if (p.stage < STAGE_SRS) p.stage = STAGE_SRS;
    _updateRank(char); _computeUnlocks(); _saveProgress();
    _touchStreak();
  }

  // ── Helpers ───────────────────────────────────────────────────────
  function _getGachaCandidates(count) {
    if (!n5Data) return [];
    return n5Data.filter(k => { const p = progress[k.char]; return p && p.stage === STAGE_INTRO; }).slice(0, count || 3);
  }
  function _getDistractors(charData, count) {
    const explicit = charData.distractors || [];
    const pool = n5Data.map(k => k.char).filter(c => c !== charData.char && !explicit.includes(c));
    return _shuffle(explicit.concat(pool)).slice(0, count || 3);
  }
  function _h(html) { const d = document.createElement('div'); d.innerHTML = html; return d; }
  function _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function _toast(msg, color) {
    const t = document.createElement('div'); t.className = 'knj-toast';
    t.textContent = msg; t.style.background = color || 'var(--correct)';
    document.body.appendChild(t); setTimeout(() => t.remove(), 2200);
  }
  function _formatDue(ms) {
    if (!ms) return 'now'; const diff = ms - Date.now(); if (diff <= 0) return 'now';
    const h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000);
    if (d >= 1) return 'in ' + d + 'd'; if (h >= 1) return 'in ' + h + 'h'; return 'soon';
  }
  function _formatInterval(ms) {
    if (!ms || ms < INTERVAL_24H) return '<1d';
    return '~' + Math.round(ms / 86400000) + 'd';
  }
  function _renderScreen(container, html) {
    container.innerHTML = html;
    container.classList.remove('knj-screen-enter');
    void container.offsetWidth;
    container.classList.add('knj-screen-enter');
  }

  // ── Stage helpers ─────────────────────────────────────────────────
  function _stageClass(p) {
    if (!p || p.stage === STAGE_LOCKED) return 'kj-locked';
    if (p.stage >= STAGE_MASTERED) return 'kj-mastered';
    if (p.stage >= STAGE_SRS)      return 'kj-srs';
    if (p.stage === STAGE_INTRO)   return 'kj-intro';
    return 'kj-locked';
  }
  function _stageLabel(p) {
    if (!p || p.stage === STAGE_LOCKED) return 'locked';
    if (p.stage >= STAGE_MASTERED) return 'mastered';
    if (p.stage >= STAGE_SRS) {
      const d = p.srs_interval_ms ? Math.round(p.srs_interval_ms / 86400000) : 0;
      return d >= 1 ? 'SRS ' + d + 'd' : 'SRS';
    }
    if (p.stage === STAGE_INTRO) return 'intro ← now';
    return '';
  }
  function _stageTextColor(p) {
    if (!p || p.stage === STAGE_LOCKED) return 'var(--stage-locked-text)';
    if (p.stage >= STAGE_MASTERED) return 'var(--stage-mastered-text)';
    if (p.stage >= STAGE_SRS)      return 'var(--stage-srs-text)';
    if (p.stage === STAGE_INTRO)   return 'var(--stage-intro-text)';
    return 'var(--muted)';
  }
  function _computeGradeIntervals(char) {
    const p = progress[char] || {}, prev = p.srs_interval_ms || INTERVAL_8H;
    return {
      again: '<1d',
      hard:  _formatInterval(Math.max(INTERVAL_24H, prev)),
      good:  _formatInterval(prev < INTERVAL_24H ? INTERVAL_24H : Math.round(prev * 2.5)),
      easy:  _formatInterval(Math.max(INTERVAL_3D, prev < INTERVAL_24H ? INTERVAL_3D : Math.round(prev * 4))),
    };
  }

  // ── P1: .kj tile renderer ─────────────────────────────────────────
  function _renderKjTile(k, onClickFn) {
    const p = progress[k.char] || {}, stClass = _stageClass(p);
    const isLocked = stClass === 'kj-locked', rank = _getRank(p);
    // Show meaning as label (truncated), not the stage string
    const shortMeaning = k.meaning ? k.meaning.split('/')[0].split(' ')[0].toLowerCase() : '';
    const el = document.createElement('div');
    el.className = 'kj ' + stClass;
    el.innerHTML =
      (rank && !isLocked ? '<div class="kj-badge">' + rank.icon + '</div>' : '') +
      '<div class="kj-char">' + k.char + '</div>' +
      '<div class="kj-label">' + shortMeaning + '</div>';
    if (!isLocked && onClickFn) el.addEventListener('click', () => onClickFn(k));
    return el;
  }

  // ── renderHome() P1 rewrite ───────────────────────────────────────
  function renderHome(container, tab) {
    if (!container) container = document.getElementById('knjModeInner');
    if (tab) _activeTab = tab;
    if (!n5Data) { _renderDataError(container); return; }
    const stats = _getStats(), theme = document.documentElement.getAttribute('data-theme') || 'dark';
    const total = n5Data.length, introduced = Object.values(progress).filter(p => p.introduced_at).length;
    const streak = _getStreak();
    const streakCount = streak.count || 0;
    const todayNew = _getTodayNewCount();

    container.innerHTML =
      '<div class="knj-home-header">' +
        '<div class="knj-home-title">Kanji</div>' +
        (stats.due > 0 ? '<div class="knj-due-badge">' + stats.due + ' due</div>' : '') +
        '<button class="knj-theme-btn" id="knjThemeBtn">' + (theme === 'dark' ? '☀️' : '🌙') + '</button>' +
      '</div>' +
      '<div class="knj-stat-grid">' +
        '<div class="knj-stat-cell"><div class="knj-stat-value">' + stats.total + '</div><div class="knj-stat-label">Introduced</div></div>' +
        '<div class="knj-stat-cell"><div class="knj-stat-value">' + stats.srs + '</div><div class="knj-stat-label">In SRS</div></div>' +
        '<div class="knj-stat-cell"><div class="knj-stat-value">' + stats.mastered + '</div><div class="knj-stat-label">Mastered</div></div>' +
        '<div class="knj-stat-cell' + (stats.due > 0 ? ' stat-due' : '') + '"><div class="knj-stat-value">' + stats.due + '</div><div class="knj-stat-label">Due now</div></div>' +
        '<div class="knj-stat-cell' + (streakCount >= 3 ? ' stat-streak' : '') + '"><div class="knj-stat-value">' + (streakCount > 0 ? streakCount + '🔥' : '—') + '</div><div class="knj-stat-label">Day streak</div></div>' +
        '<div class="knj-stat-cell"><div class="knj-stat-value">' + todayNew + ' / 5</div><div class="knj-stat-label">New today</div></div>' +
      '</div>' +
      (stats.due > 0 ?
        '<div class="knj-review-cta">' +
          '<div><div class="knj-review-cta-label">Reviews ready →</div><div class="knj-review-cta-sub">' + stats.due + ' kanji waiting</div></div>' +
          '<button class="btn btn-primary" id="knjStartReviews" style="font-size:12px;padding:8px 16px">Start reviews</button>' +
        '</div>' : '') +
      '<div class="knj-tabs" id="knjTabs">' +
        '<button class="knj-tab' + (_activeTab === 'catalog' ? ' active' : '') + '" data-tab="catalog">Catalog</button>' +
        '<button class="knj-tab' + (_activeTab === 'path'    ? ' active' : '') + '" data-tab="path">Path</button>' +
        '<button class="knj-tab' + (_activeTab === 'reviews' ? ' active' : '') + '" data-tab="reviews">Reviews</button>' +
      '</div>' +
      '<div id="knjTabContent"></div>';

    container.querySelector('#knjThemeBtn').addEventListener('click', () => { toggleTheme(); renderHome(container); });
    container.querySelector('#knjTabs').addEventListener('click', e => {
      const btn = e.target.closest('.knj-tab'); if (!btn) return;
      _activeTab = btn.dataset.tab; renderHome(container);
    });
    const ctaBtn = container.querySelector('#knjStartReviews');
    if (ctaBtn) ctaBtn.addEventListener('click', () => startReviewSession(container, 'due'));
    const tabContent = container.querySelector('#knjTabContent');
    if      (_activeTab === 'catalog') _renderCatalogTab(tabContent);
    else if (_activeTab === 'path')    _renderPathTab(tabContent);
    else if (_activeTab === 'reviews') _renderReviewsTab(tabContent);
  }

  // ── _renderCatalogTab() P1 rewrite ───────────────────────────────
  function _renderCatalogTab(container) {
    const todayCount = _getTodayNewCount(), canLearn = todayCount < MAX_NEW_PER_DAY;
    const candidates = _getGachaCandidates(10);
    const total = n5Data.length;
    const introduced    = n5Data.filter(k => { const p = progress[k.char]; return p && p.introduced_at; });
    const available     = n5Data.filter(k => { const p = progress[k.char]; return p && p.stage === STAGE_INTRO && !p.introduced_at; });
    const visibleKanji  = n5Data.filter(k => {
      const p = progress[k.char];
      if (!p) return false;
      return p.stage !== STAGE_LOCKED; // hide pure locked — only show available/in-progress/done
    });

    const trackHdr = document.createElement('div');
    trackHdr.className = 'knj-track-header';
    trackHdr.innerHTML = '<div class="knj-track-pill">N5</div><div class="knj-track-name">N5 Track</div><div class="knj-track-count">' + introduced.length + ' / ' + total + '</div>';
    container.appendChild(trackHdr);

    // Gacha CTA — above the grid, prominent
    if (candidates.length > 0) {
      const gachaWrap = document.createElement('div');
      gachaWrap.style.cssText = 'margin-bottom:12px';
      gachaWrap.innerHTML = '<button class="knj-gacha-cta' + (canLearn ? '' : ' disabled') + '" id="knjGachaCTA">' +
        (canLearn
          ? '<span style="font-size:16px">✦</span> Learn a new kanji <span class="knj-gacha-remain">' + (MAX_NEW_PER_DAY - todayCount) + ' left today</span>'
          : '<span style="font-size:16px">✦</span> Daily limit reached <span class="knj-gacha-remain">5/5</span>') +
      '</button>';
      container.appendChild(gachaWrap);
      if (canLearn) gachaWrap.querySelector('#knjGachaCTA').addEventListener('click', () => _openGachaModal(document.getElementById('knjModeInner') || container));
    }

    if (visibleKanji.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'text-align:center;padding:32px 16px;color:var(--muted);font-family:\'Space Mono\',monospace;font-size:11px';
      empty.textContent = 'Learn your first kanji above to begin.';
      container.appendChild(empty);
      return;
    }

    const grid = document.createElement('div'); grid.className = 'knj-kanji-grid';
    visibleKanji.forEach(k => grid.appendChild(_renderKjTile(k, kd => {
      const root = document.getElementById('knjModeInner') || container;
      _openDetailModal(kd, progress[kd.char] || {}, root);
    })));
    container.appendChild(grid);

    const legend = document.createElement('div'); legend.className = 'knj-legend';
    [
      { bg:'var(--stage-mastered-border)', label:'mastered' },
      { bg:'var(--stage-srs-border)',      label:'SRS' },
      { bg:'var(--accent3)',               label:'available' },
    ].forEach(li => {
      legend.innerHTML += '<div class="knj-legend-item"><div class="knj-legend-dot" style="background:' + li.bg + '"></div>' + li.label + '</div>';
    });
    container.appendChild(legend);
  }

  // ── _renderPathTab() — visual ascending map ─────────────────────
  function _renderPathTab(container) {
    const allIntroduced = n5Data ? n5Data.filter(k => { const p = progress[k.char]; return p && p.introduced_at; }) : [];
    if (allIntroduced.length === 0) {
      container.appendChild(_h('<div class="knj-path-empty"><div class="knj-path-icon">🗺️</div><div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:8px">No path yet</div><div>Learn your first kanji to begin your path.</div></div>'));
      return;
    }

    const colors = { intro:'#8B7CF6', drill:'#185FA5', reading:'#EF9F27', reinforce:'#1D9E75', rank_check:'#D85A30' };
    const icons  = { intro:'📖', drill:'⚡', reading:'👁', reinforce:'🔁', rank_check:'🏆' };
    const labels = { intro:'Introduction', drill:'Drill', reading:'Reading', reinforce:'Reinforce', rank_check:'Rank Up' };

    // Build all segments: each kanji × its nodes, then reverse so newest is on top
    const segments = [];
    allIntroduced.forEach(k => {
      const p = progress[k.char]; if (!p) return;
      const nodes = [];
      nodes.push({ type:'intro',    completed:true });
      nodes.push({ type:'drill',    completed:(p.review_count||0)>=1 });
      if ((p.review_count||0) >= 1) {
        nodes.push({ type:'reading',  completed:!!p.reading_done });
        if (allIntroduced.filter(o => o.char !== k.char).length >= 2)
          nodes.push({ type:'reinforce', completed:!!p.reinforce_done });
      }
      if (p.rank && p.rank !== 'academy')
        nodes.push({ type:'rank_check', rank:p.rank, completed:true });
      segments.push({ k, p, nodes });
    });

    // Map wraps in a column-reverse flex so newest kanji/nodes float to top visually
    const map = document.createElement('div');
    map.className = 'knj-path-map';

    segments.forEach((seg, si) => {
      const { k, p, nodes } = seg;
      const curIdx = nodes.findIndex(n => !n.completed);

      // Section divider label — shows between kanji groups
      const divEl = document.createElement('div');
      divEl.className = 'knj-path-kanji-hdr';
      divEl.textContent = k.meaning.split('/')[0].toUpperCase();
      map.appendChild(divEl);

      // Nodes in reverse order so most-recent floats top
      [...nodes].reverse().forEach((node, revI) => {
        const fwdIdx   = nodes.length - 1 - revI;
        const isCompleted = node.completed;
        const isCurrent   = fwdIdx === curIdx;
        const isLocked    = curIdx !== -1 && fwdIdx > curIdx && !isCompleted;
        const color = colors[node.type] || '#888780';

        // Connector line between nodes
        if (revI < nodes.length - 1) {
          const conn = document.createElement('div');
          conn.className = 'knj-path-connector' + (isCompleted ? ' done' : '');
          map.appendChild(conn);
        }

        const nodeEl = document.createElement('div');
        let nodeCls = 'knj-path-node';
        if (isCompleted) nodeCls += ' done';
        else if (isCurrent) nodeCls += ' current';
        else if (isLocked) nodeCls += ' locked';
        nodeEl.className = nodeCls;
        if (isCurrent) nodeEl.style.borderColor = color;

        const rankLabel = node.type === 'rank_check' && node.rank ? ' → ' + node.rank.charAt(0).toUpperCase() + node.rank.slice(1) : '';
        nodeEl.innerHTML =
          (isCompleted ? '<div class="knj-path-node-status" style="color:var(--correct)">✓</div>' :
           isCurrent   ? '<div class="knj-path-node-status" style="color:' + color + '">▶</div>' : '') +
          '<div class="knj-path-node-char" style="color:' + (isCompleted ? 'var(--muted)' : isCurrent ? color : 'var(--muted)') + '">' + k.char + '</div>' +
          '<div style="display:flex;align-items:center;gap:6px">' +
            '<span class="knj-path-node-type" style="background:' + color + '18;color:' + color + ';border:1px solid ' + color + '44">' +
              (icons[node.type]||'') + ' ' + (labels[node.type]||node.type) + rankLabel +
            '</span>' +
          '</div>' +
          (isCurrent ? '<div style="font-size:11px;color:var(--muted);margin-top:2px">tap to start</div>' : '');

        if (isCurrent) {
          nodeEl.addEventListener('click', () => _startPathNode(Object.assign({ char:k.char, meaning:k.meaning }, node), document.getElementById('knjModeInner')));
        } else if (isCompleted && node.type !== 'rank_check') {
          nodeEl.style.cursor = 'pointer';
          nodeEl.addEventListener('click', () => _openDetailModal(k, p, document.getElementById('knjModeInner')));
        }
        map.appendChild(nodeEl);
      });
    });

    container.appendChild(map);
  }
  function _startPathNode(node, container) {
    if (!n5Data) return;
    if (node.type === 'drill') {
      _startLearningDrill(node.char, container);
    } else if (node.type === 'reading') {
      _renderReadingNode(node.char, container, () => { _setProgress(node.char, { reading_done: true }); renderHome(container, 'path'); });
    } else if (node.type === 'reinforce') {
      _renderReinforceNode(node.char, container, () => { _setProgress(node.char, { reinforce_done: true }); renderHome(container, 'path'); });
    } else if (node.type === 'rank_check') {
      _renderRankCheckNode(node.char, container, () => renderHome(container, 'path'));
    }
  }

  // ── _renderReviewsTab() ───────────────────────────────────────────
  function _renderReviewsTab(container) {
    const now = Date.now();
    const due = Object.values(progress).filter(p => p.stage >= STAGE_SRS && p.srs_due && p.srs_due <= now).sort((a, b) => (a.srs_due || 0) - (b.srs_due || 0));
    const upcoming = Object.values(progress).filter(p => p.stage >= STAGE_SRS && (!p.srs_due || p.srs_due > now)).sort((a, b) => (a.srs_due || 0) - (b.srs_due || 0)).slice(0, 8);
    if (due.length === 0 && upcoming.length === 0) {
      container.appendChild(_h('<div style="text-align:center;padding:40px 16px;color:var(--muted);font-family:\'Space Mono\',monospace;font-size:12px">🎉 Nothing due — all caught up!<br><br><span style="font-size:10px">Introduce more kanji from the catalog</span></div>'));
      return;
    }
    if (due.length > 0) {
      const hdr = _h('<div class="knj-section-label" style="display:flex;justify-content:space-between;align-items:center"><span>Due now (' + due.length + ')</span><button class="btn btn-primary" id="knjStartReview" style="font-size:11px;padding:6px 14px">Start all</button></div>');
      container.appendChild(hdr);
      hdr.querySelector('#knjStartReview').addEventListener('click', () => startReviewSession(document.getElementById('knjModeInner'), 'due'));
      due.slice(0, 12).forEach(p => {
        const k = n5Data.find(d => d.char === p.char); if (!k) return;
        const rank = _getRank(p);
        const el = _h('<div class="knj-review-card"><div class="knj-review-char">' + k.char + '</div><div class="knj-review-meta"><div class="knj-review-meaning">' + k.meaning + '</div><div class="knj-review-due">Due: now</div></div>' + (rank ? '<div class="knj-review-rank">' + rank.icon + '</div>' : '') + '</div>');
        el.firstChild.addEventListener('click', () => startReviewSession(document.getElementById('knjModeInner'), 'select', [p.char]));
        container.appendChild(el);
      });
    }
    if (upcoming.length > 0) {
      container.appendChild(_h('<div class="knj-section-label" style="margin-top:16px">Upcoming</div>'));
      upcoming.forEach(p => {
        const k = n5Data.find(d => d.char === p.char); if (!k) return;
        const rank = _getRank(p);
        container.appendChild(_h('<div class="knj-review-card" style="opacity:.6;cursor:default"><div class="knj-review-char">' + k.char + '</div><div class="knj-review-meta"><div class="knj-review-meaning">' + k.meaning + '</div><div class="knj-review-due">' + _formatDue(p.srs_due) + '</div></div>' + (rank ? '<div class="knj-review-rank">' + rank.icon + '</div>' : '') + '</div>'));
      });
    }
  }

  // ── _openGachaModal() ─────────────────────────────────────────────
  function _openGachaModal(container) {
    const candidates = _getGachaCandidates(3);
    if (candidates.length === 0) { _toast('No new kanji available!', 'var(--warn)'); return; }
    const overlay = document.createElement('div');
    overlay.className = 'knj-modal-overlay';
    overlay.innerHTML =
      '<div class="knj-modal">' +
        '<div class="knj-modal-title">✦ Choose your next kanji</div>' +
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

  // ── _openDetailModal() ───────────────────────────────────────────
  function _openDetailModal(k, p, container) {
    const rank = _getRank(p);
    const sentenceHTML = (k.sentences || []).slice(0, 2).map(s => _renderSentenceBlock(s, { showFuri: true, highlight: k.char })).join('');
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
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted);margin-bottom:8px">' + k.strokes + ' strokes</div>' +
        (k.mnemonic ? '<div class="knj-mnemonic-box" style="margin-bottom:12px">' + k.mnemonic + '</div>' : '') +
        (sentenceHTML ? '<div class="knj-sub-label">Example sentences</div>' + sentenceHTML : '') +
        '<div style="display:flex;gap:8px;margin-top:16px">' +
          '<button class="btn btn-primary" id="knjDetailDrill" style="flex:1">Drill this</button>' +
          (!p.introduced_at ? '<button class="btn btn-secondary" id="knjDetailIntro" style="flex:1">Introduce</button>' : '') +
        '</div>' +
      '</div>';
    overlay.querySelector('#knjDetailClose').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('#knjDetailDrill').addEventListener('click', () => { overlay.remove(); _startOnDemandDrill(k.char, container); });
    const introBtn = overlay.querySelector('#knjDetailIntro');
    if (introBtn) introBtn.addEventListener('click', () => { overlay.remove(); renderIntroCard(k.char, container); });
    document.body.appendChild(overlay);
  }

  // ── _renderPronunciationBlock() ──────────────────────────────────
  function _renderPronunciationBlock(k) {
    const onCards = (k.on || []).map((kana, i) => {
      const rom = (k.on_romaji || [])[i] || '';
      return '<div class="knj-rdg-card"><div class="knj-rdg-type">On</div><div class="knj-rdg-kana">' + kana + '</div>' + (rom ? '<div class="knj-rdg-romaji">' + rom + '</div>' : '') + '</div>';
    }).join('');
    const kunCards = (k.kun || []).slice(0, 3).map((kana, i) => {
      const rom = (k.kun_romaji || [])[i] || '', disp = kana.replace(/-.*$/, '').replace(/\..*$/, '');
      return '<div class="knj-rdg-card"><div class="knj-rdg-type">Kun</div><div class="knj-rdg-kana">' + disp + '</div>' + (rom ? '<div class="knj-rdg-romaji">' + rom + '</div>' : '') + '</div>';
    }).join('');
    const compoundRows = (k.compound_examples || []).slice(0, 3).map(c =>
      '<div class="knj-compound-row"><span class="knj-compound-jp">' + c.word + '</span><span class="knj-compound-romaji">' + c.furi + ' · ' + c.romaji + '</span><span class="knj-compound-en">' + c.en + '</span></div>'
    ).join('');
    return '<div class="knj-pron-block">' +
      '<div class="knj-sub-label" style="margin-top:0">Pronunciation</div>' +
      '<div class="knj-rdg-row">' + onCards + kunCards + '</div>' +
      (k.on_usage  ? '<div class="knj-rdg-usage">On: '  + k.on_usage  + '</div>' : '') +
      (k.kun_usage ? '<div class="knj-rdg-usage">Kun: ' + k.kun_usage + '</div>' : '') +
      (compoundRows ? '<div class="knj-sub-label" style="margin-top:8px">In words</div><div class="knj-compound-list">' + compoundRows + '</div>' : '') +
    '</div>';
  }

  // ── _renderSentenceBlock() ───────────────────────────────────────
  function _renderSentenceBlock(s, opts) {
    opts = opts || {};
    const highlight = opts.highlight || null;
    const stored = localStorage.getItem(LS_FURI_PREF);
    // Default furigana to always shown — learner can toggle off
    const furiVisible = stored ? stored === 'show' : true;
    const blockId = 'knjSB' + Math.random().toString(36).slice(2, 6);
    let jpDisplay = (s.furi || s.jp);
    if (highlight) {
      jpDisplay = jpDisplay.replace(
        new RegExp(highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        '<span class="knj-target">' + highlight + '</span>'
      );
    }
    return '<div class="knj-sentence-block" id="' + blockId + '">' +
      '<button class="knj-furi-toggle" data-target="' + blockId + '">' + (furiVisible ? '▲ hide furigana' : '▼ show furigana') + '</button>' +
      '<div class="knj-sent-ruby' + (furiVisible ? '' : ' knj-furi-hidden') + '">' + jpDisplay + '</div>' +
      '<div class="knj-en-sentence">' + s.en + (s.source ? '<span class="knj-source-tag">' + s.source + '</span>' : '') + '</div>' +
      (opts.showGrammar && s.grammar_note ? '<div class="knj-grammar-note">' + s.grammar_note + '</div>' : '') +
    '</div>';
  }

  // ── renderIntroCard() P2 + P6 rewrite ────────────────────────────
  function renderIntroCard(char, container) {
    if (!container) container = document.getElementById('knjModeInner');
    if (!n5Data) { _renderDataError(container); return; }
    const k = n5Data.find(d => d.char === char); if (!k) return;
    const p = _getOrCreateProgress(char, 'n5');
    if (!p.introduced_at) {
      p.introduced_at = Date.now(); p.stage = STAGE_SRS;
      _updateRank(char); _computeUnlocks(); _saveProgress();
    }

    // P6: Stats for side panel
    const allP = Object.values(progress);
    const statsIntro    = allP.filter(x => x.introduced_at).length;
    const statsSRS      = allP.filter(x => x.stage >= STAGE_SRS).length;
    const statsMastered = allP.filter(x => x.stage >= STAGE_MASTERED).length;
    const statsDue      = allP.filter(x => x.stage >= STAGE_SRS && x.srs_due && x.srs_due <= Date.now()).length;
    const progressPct   = Math.round((statsIntro / n5Data.length) * 100);

    // P2: Reading groups for hero row
    const onGroups = (k.on || []).map((kana, i) => {
      const rom = (k.on_romaji || [])[i] || '';
      return '<div class="knj-rdg-group">' +
        '<div class="knj-rdg-group-label">On</div>' +
        '<div class="knj-rdg-group-value">' + kana + '</div>' +
        (rom ? '<div class="knj-rdg-group-rom">' + rom + '</div>' : '') +
      '</div>';
    });
    const kunGroups = (k.kun || []).slice(0, 2).map((kana, i) => {
      const rom = (k.kun_romaji || [])[i] || '', disp = kana.replace(/-.*$/, '').replace(/\..*$/, '');
      return '<div class="knj-rdg-group">' +
        '<div class="knj-rdg-group-label">Kun</div>' +
        '<div class="knj-rdg-group-value">' + disp + '</div>' +
        (rom ? '<div class="knj-rdg-group-rom">' + rom + '</div>' : '') +
      '</div>';
    });

    // P6: Related kanji side panel
    const relatedHTML = (k.related || []).slice(0, 5).map(rel => {
      const rp = progress[rel.char] || {}, rRank = _getRank(rp);
      return '<div class="knj-related-row">' +
        '<div class="knj-related-char" style="color:' + _stageTextColor(rp) + '">' + rel.char + '</div>' +
        '<div class="knj-related-meta">' +
          '<div class="knj-related-meaning">' + rel.meaning + '</div>' +
          '<div class="knj-related-status">' + (rRank ? rRank.icon + ' ' : '') + _stageLabel(rp) + '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    const sentenceHTML = (k.sentences || []).map(s => _renderSentenceBlock(s, { showFuri: true, highlight: char, showGrammar: true })).join('');

    _renderScreen(container,
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">' +
        '<button class="btn btn-secondary" id="knjBackBtn" style="font-size:12px;padding:7px 12px">← Back</button>' +
        '<div class="knj-eyebrow-text">Stage 1 · Intro</div>' +
        '<div class="knj-badge knj-badge-accent" style="margin-left:auto">N5</div>' +
      '</div>' +

      // P2: 2-column layout
      '<div class="knj-intro-layout">' +

        // Left: main card
        '<div class="card" style="padding:24px">' +
          // Hero row
          '<div class="knj-intro-hero">' +
            '<div class="knj-intro-char-hero">' + char + '</div>' +
            '<div class="knj-intro-hero-meta">' +
              '<div class="knj-intro-meaning-hero">' + k.meaning + '</div>' +
              '<div class="knj-intro-reading-groups">' + onGroups.concat(kunGroups).join('') + '</div>' +
              '<div class="knj-intro-badges">' +
                '<div class="knj-badge knj-badge-accent">JLPT N5</div>' +
                '<div class="knj-badge">' + k.strokes + ' strokes</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="knj-card-divider"></div>' +

          // Radical pill
          '<div class="knj-sub-label" style="margin-top:0">Radicals</div>' +
          '<div class="knj-radical-pills">' +
            '<div class="knj-radical-pill">' +
              '<div class="knj-radical-char">' + k.radical + '</div>' +
              '<div class="knj-radical-name">' + (k.radical_meaning || k.radical) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="knj-card-divider"></div>' +

          // Mnemonic
          (k.mnemonic ? '<div class="knj-sub-label" style="margin-top:0">Memory hook</div><div class="knj-mnemonic-box">' + k.mnemonic + '</div><div class="knj-card-divider"></div>' : '') +

          // Sentences
          (sentenceHTML ? '<div class="knj-sub-label" style="margin-top:0">In sentences</div>' + sentenceHTML : '') +

          // CTA buttons
          '<div style="margin-top:20px;display:flex;gap:8px">' +
            '<button class="btn btn-secondary" id="knjBackBtn2" style="flex:0">← Back</button>' +
            '<button class="btn btn-primary" id="knjStartDrill" style="flex:1">Got it · Begin drills →</button>' +
          '</div>' +
        '</div>' +

        // Right: side panel (P6)
        '<div class="knj-intro-side">' +
          '<div class="knj-side-card">' +
            '<div class="knj-sub-label" style="margin-top:0">N5 Track</div>' +
            '<div class="knj-progress-bar-wrap"><div class="knj-progress-bar-fill" style="width:' + progressPct + '%"></div></div>' +
            '<div style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted);margin-bottom:10px">' + statsIntro + ' / ' + n5Data.length + '</div>' +
            '<div class="knj-side-stat-row"><span class="knj-side-stat-lbl">Introduced</span><span class="knj-side-stat-val">' + statsIntro + '</span></div>' +
            '<div class="knj-side-stat-row"><span class="knj-side-stat-lbl">In SRS</span><span class="knj-side-stat-val">' + statsSRS + '</span></div>' +
            '<div class="knj-side-stat-row"><span class="knj-side-stat-lbl">Mastered</span><span class="knj-side-stat-val">' + statsMastered + '</span></div>' +
            '<div class="knj-side-stat-row"><span class="knj-side-stat-lbl">Due now</span><span class="knj-side-stat-val">' + statsDue + '</span></div>' +
          '</div>' +
          (relatedHTML ? '<div class="knj-side-card"><div class="knj-sub-label" style="margin-top:0">Related kanji</div>' + relatedHTML + '</div>' : '') +
        '</div>' +

      '</div>'
    );

    container.querySelector('#knjBackBtn').addEventListener('click',  () => renderHome(container));
    container.querySelector('#knjBackBtn2').addEventListener('click', () => renderHome(container));
    container.querySelector('#knjStartDrill').addEventListener('click', () => _startLearningDrill(char, container));
  }

  // ═══════════════════════════════════════════════════════════════
  // DRILL ENGINE — P3: eyebrow, dots, exp-box  |  P5: 4-grade
  // ═══════════════════════════════════════════════════════════════

  // P3: Eyebrow bar with optional badge
  function _eyebrowHTML(label, badge, badgeClass) {
    return '<div class="knj-eyebrow">' +
      '<div class="knj-eyebrow-left">' +
        '<button class="btn btn-secondary" id="knjBackBtn" style="font-size:11px;padding:5px 10px">← Back</button>' +
        '<span class="knj-eyebrow-text">' + (label || 'DRILL') + '</span>' +
      '</div>' +
      (badge ? '<span class="knj-eyebrow-badge ' + (badgeClass || '') + '">' + badge + '</span>' : '') +
    '</div>';
  }

  // P3: Dot progress row — shows streak sub-dots on current step
  function _dotsHTML() {
    const ds = _drillState;
    if (!ds || !ds.sequence) return '';
    const nonStudy = ds.sequence.filter(s => s.type !== 'study_card');
    return '<div class="knj-dot-row">' +
      nonStudy.map((s, i) => {
        const realIdx = ds.sequence.indexOf(s);
        let cls = 'knj-dot';
        if (realIdx < ds.idx)       cls += ' knj-dot-ok';
        else if (realIdx === ds.idx) {
          cls += ' knj-dot-cur';
          // If this step needs a streak, show progress inside the dot via title
        }
        const needed = s.needed || 1;
        const streak = (realIdx === ds.idx) ? (s.streak || 0) : 0;
        return '<div class="' + cls + '" title="' + (realIdx === ds.idx && needed > 1 ? streak + '/' + needed : '') + '"></div>';
      }).join('') +
    '</div>' +
    // Streak indicator under dots when current step needs 2 in a row
    (() => {
      const cur = ds.sequence[ds.idx];
      if (!cur || !cur.needed || cur.needed < 2) return '';
      const streak = cur.streak || 0;
      return '<div class="knj-streak-indicator">' +
        Array.from({length: cur.needed}, (_, i) =>
          '<div class="knj-streak-pip' + (i < streak ? ' filled' : '') + '"></div>'
        ).join('') +
        '<span class="knj-streak-label">' + (streak === 0 ? 'need ' + cur.needed + ' in a row' : streak + ' / ' + cur.needed + ' — keep going') + '</span>' +
      '</div>';
    })();
  }

  // P5: SRS grade row — Again shows reset indicator, Hard/Good/Easy label only (no interval text)
  function _gradeRowHTML(iv) {
    return '<div class="knj-grade-row">' +
      '<button class="knj-grade-btn knj-grade-again" data-grade="0">Again<span class="knj-grade-sub">← reset</span></button>' +
      '<button class="knj-grade-btn knj-grade-hard"  data-grade="1">Hard</button>' +
      '<button class="knj-grade-btn knj-grade-good"  data-grade="2">Good</button>' +
      '<button class="knj-grade-btn knj-grade-easy"  data-grade="3">Easy</button>' +
    '</div>';
  }

  // P7: Canvas guide SVG (30px grid + dashed crosshairs)
  function _guideSVG() {
    const lines = [];
    for (let x = 30; x < 180; x += 30) lines.push('<line x1="' + x + '" y1="0" x2="' + x + '" y2="180" stroke="var(--accent3)" stroke-width="0.5"/>');
    for (let y = 30; y < 180; y += 30) lines.push('<line x1="0" y1="' + y + '" x2="180" y2="' + y + '" stroke="var(--accent3)" stroke-width="0.5"/>');
    lines.push('<line x1="90" y1="0" x2="90" y2="180" stroke="var(--accent3)" stroke-width="1" stroke-dasharray="4 4"/>');
    lines.push('<line x1="0" y1="90" x2="180" y2="90" stroke="var(--accent3)" stroke-width="1" stroke-dasharray="4 4"/>');
    return '<svg class="knj-canvas-guide" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">' + lines.join('') + '</svg>';
  }

  // ── Drill sequences ───────────────────────────────────────────────
  //
  // Learning philosophy after simulation:
  // — Break study into 3 paged panels so nothing feels like a wall
  // — Every recognition step needs 2 in a row before advancing
  // — New question types: type-in meaning (open recall), compound match,
  //   sentence read + free recall with 3-grade self-rate (no interval text)
  // — MCQ is easy to brute-force; type-in forces genuine recall
  // — Context uses ALL sentences so the kanji gets burned into 3 real scenes
  // — Free-recall self-grade (Blank/Hmm/Got it) is honest for open answers
  //   and doesn't show interval labels (learner has no basis to judge those yet)
  // — 4-grade with interval labels only on SRS reviews days later
  //
  // Sequence for _startLearningDrill:
  //  STUDY   study_card (3 panels)
  //  PHASE 1 mcq ×2 (need 2/2)         — see it, identify meaning
  //          type_meaning ×1            — open recall, no options
  //          reading_mcq ×2 (need 2/2)  — reading identification
  //  PHASE 2 context all sentences      — use it in 3 real scenes
  //          compound_match ×1          — see it in a word
  //  PHASE 3 mcq reverse ×2 (need 2/2) — meaning → kanji
  //          free_recall ×1             — type what you remember, self-grade
  //          write ×1                   — shape recall, binary grade
  //
  // Wrong on type_meaning / free_recall: show answer + re-queue same step
  // Wrong on write: inserts 2 mcq + write again

  function _startLearningDrill(char, container) {
    const k = n5Data ? n5Data.find(d => d.char === char) : null;
    const sentCount = (k && k.sentences) ? k.sentences.length : 0;
    const contextSteps = [];
    for (let i = 0; i < Math.min(sentCount, 3); i++) {
      contextSteps.push({ type:'context', sentIdx:i, needed:1, streak:0 });
    }
    _drillState = {
      char, mode: 'learn',
      sequence: [
        { type:'study_card' },
        { type:'mcq',           reverse:false, needed:2, streak:0 },
        { type:'mcq',           reverse:false, needed:2, streak:0 },
        { type:'type_meaning',  needed:1, streak:0 },
        { type:'reading_mcq',   needed:2, streak:0 },
        { type:'reading_mcq',   needed:2, streak:0 },
        ...contextSteps,
        { type:'compound_match',needed:1, streak:0 },
        { type:'mcq',           reverse:true,  needed:2, streak:0 },
        { type:'mcq',           reverse:true,  needed:2, streak:0 },
        { type:'free_recall',   needed:1, streak:0 },
        { type:'write' },
      ],
      idx: 0, totalCorrect: 0, totalAttempts: 0,
    };
    _runDrillStep(container);
  }

  function _startOnDemandDrill(char, container) {
    _drillState = {
      char, mode: 'ondemand',
      sequence: [
        { type:'mcq',          reverse:false, needed:2, streak:0 },
        { type:'type_meaning', needed:1, streak:0 },
        { type:'reading_mcq',  needed:2, streak:0 },
        { type:'context',      sentIdx:0, needed:1, streak:0 },
        { type:'free_recall',  needed:1, streak:0 },
        { type:'write' },
      ],
      idx: 0, totalCorrect: 0, totalAttempts: 0,
    };
    _runDrillStep(container);
  }

  function _runDrillStep(container) {
    const ds = _drillState;
    if (!ds || ds.idx >= ds.sequence.length) { _showDrillComplete(container); return; }
    const step = ds.sequence[ds.idx];
    container.classList.remove('knj-screen-enter');
    void container.offsetWidth;
    container.classList.add('knj-screen-enter');

    const advance = (correct) => {
      ds.totalAttempts = (ds.totalAttempts || 0) + 1;
      if (correct) {
        ds.totalCorrect++;
        step.streak = (step.streak || 0) + 1;
        if (step.streak >= (step.needed || 1)) {
          ds.idx++; step.streak = 0;
          setTimeout(() => _runDrillStep(container), 700);
        } else {
          setTimeout(() => _runDrillStep(container), 600);
        }
      } else {
        step.streak = 0;
        setTimeout(() => _runDrillStep(container), 1500);
      }
    };

    if      (step.type === 'study_card')    _renderStudyCard(ds.char, container, () => { ds.idx++; _runDrillStep(container); });
    else if (step.type === 'mcq')           _renderActiveMCQ(ds.char, container, step.reverse, advance);
    else if (step.type === 'reading_mcq')   _renderReadingMCQ(ds.char, container, advance);
    else if (step.type === 'context')       _renderActiveContext(ds.char, container, advance, step.sentIdx);
    else if (step.type === 'type_meaning')  _renderTypeMeaning(ds.char, container, advance);
    else if (step.type === 'compound_match')_renderCompoundMatch(ds.char, container, advance);
    else if (step.type === 'free_recall')   _renderFreeRecall(ds.char, container, advance);
    else _renderActiveWrite(ds.char, container, () => { ds.idx++; _runDrillStep(container); });
  }

  // ── _renderStudyCard() — 3-panel paged study (no info walls) ──────
  function _renderStudyCard(char, container, onContinue) {
    const k = n5Data.find(d => d.char === char); if (!k) { onContinue(); return; }
    const mainOn  = (k.on  && k.on[0])  ? k.on[0]  : '';
    const mainKun = (k.kun && k.kun[0]) ? k.kun[0].replace(/-.*$/, '').replace(/\..*$/, '') : '';
    const onRom   = (k.on_romaji  && k.on_romaji[0])  ? k.on_romaji[0]  : '';
    const kunRom  = (k.kun_romaji && k.kun_romaji[0]) ? k.kun_romaji[0] : '';

    // Panels: [0] char+meaning+readings  [1] mnemonic+radical  [2] sentences+compounds
    let currentPanel = 0;
    const totalPanels = 3;

    function renderPanels() {
      container.innerHTML =
        '<div class="knj-eyebrow" style="margin-bottom:14px">' +
          '<div class="knj-eyebrow-left">' +
            '<button class="btn btn-secondary" id="knjBackBtn" style="font-size:11px;padding:5px 10px">← Back</button>' +
            '<span class="knj-eyebrow-text">Study</span>' +
          '</div>' +
          '<span class="knj-eyebrow-badge">' + (currentPanel + 1) + ' / ' + totalPanels + '</span>' +
        '</div>' +

        // Panel pips
        '<div class="knj-panel-progress">' +
          [0,1,2].map(i =>
            '<div class="knj-panel-pip' + (i < currentPanel ? ' done' : i === currentPanel ? ' active' : '') + '"></div>'
          ).join('') +
        '</div>' +

        // Panel 0: Identity
        '<div class="knj-study-panel' + (currentPanel === 0 ? ' active' : '') + '" id="knjPanel0">' +
          '<div class="knj-study-char">' + char + '</div>' +
          '<div class="knj-study-meaning">' + k.meaning + '</div>' +
          '<div class="knj-study-readings">' +
            (mainOn  ? '<div class="knj-study-rdg"><span class="knj-study-rdg-type">on</span><span class="knj-study-rdg-kana">' + mainOn  + '</span><span class="knj-study-rdg-rom">' + onRom  + '</span></div>' : '') +
            (mainKun ? '<div class="knj-study-rdg"><span class="knj-study-rdg-type">kun</span><span class="knj-study-rdg-kana">' + mainKun + '</span><span class="knj-study-rdg-rom">' + kunRom + '</span></div>' : '') +
          '</div>' +
          (k.on_usage  ? '<div style="font-size:12px;color:var(--muted);text-align:center;margin-bottom:4px;line-height:1.5">' + k.on_usage  + '</div>' : '') +
          (k.kun_usage ? '<div style="font-size:12px;color:var(--muted);text-align:center;line-height:1.5">'                    + k.kun_usage + '</div>' : '') +
          '<button class="btn btn-primary knj-study-cta" id="knjPanelNext">Next: Memory hook →</button>' +
        '</div>' +

        // Panel 1: Mnemonic + radical
        '<div class="knj-study-panel' + (currentPanel === 1 ? ' active' : '') + '" id="knjPanel1">' +
          '<div style="font-family:\'Space Mono\',monospace;font-size:8px;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);margin-bottom:10px">Radical</div>' +
          '<div class="knj-study-radical">' +
            '<span class="knj-study-radical-char">' + k.radical + '</span>' +
            '<span class="knj-study-radical-name">' + (k.radical_meaning || '') + '</span>' +
          '</div>' +
          '<div style="font-family:\'Space Mono\',monospace;font-size:8px;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);margin:18px 0 10px;padding-top:14px;border-top:1px solid var(--border)">Memory hook</div>' +
          '<div class="knj-study-mnemonic">' + (k.mnemonic || '') + '</div>' +
          '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:10px;line-height:1.6">Read this carefully. Try to picture it.</div>' +
          '<button class="btn btn-primary knj-study-cta" id="knjPanelNext">Next: In context →</button>' +
        '</div>' +

        // Panel 2: Sentences + compounds
        '<div class="knj-study-panel' + (currentPanel === 2 ? ' active' : '') + '" id="knjPanel2">' +
          '<div style="font-family:\'Space Mono\',monospace;font-size:8px;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);margin-bottom:10px">In a real sentence</div>' +
          ((k.sentences || []).map((s, si) =>
            '<div class="knj-study-sentence" style="margin-bottom:10px">' +
              '<div class="knj-study-sent-jp">' + (s.furi || s.jp) + '</div>' +
              '<div class="knj-study-sent-en">' + s.en + '</div>' +
              (s.grammar_note ? '<div class="knj-study-sent-note">' + s.grammar_note + '</div>' : '') +
            '</div>'
          ).join('')) +
          '<div style="font-family:\'Space Mono\',monospace;font-size:8px;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);margin:16px 0 8px;padding-top:14px;border-top:1px solid var(--border)">In words</div>' +
          '<div class="knj-study-compounds">' +
            (k.compound_examples || []).slice(0, 3).map(c =>
              '<div class="knj-study-compound">' +
                '<span class="knj-study-compound-jp">' + c.word + '</span>' +
                '<span class="knj-study-compound-rom">' + c.furi + ' · ' + c.romaji + '</span>' +
                '<span class="knj-study-compound-en">' + c.en + '</span>' +
              '</div>'
            ).join('') +
          '</div>' +
          '<button class="btn btn-primary knj-study-cta" id="knjPanelNext">I\'ve studied this · Start drills →</button>' +
        '</div>';

      container.querySelector('#knjBackBtn').addEventListener('click', () => { _drillState = null; renderHome(container); });
      const nextBtn = container.querySelector('#knjPanelNext');
      if (nextBtn) nextBtn.addEventListener('click', () => {
        currentPanel++;
        if (currentPanel >= totalPanels) { onContinue(); return; }
        renderPanels();
      });
    }

    renderPanels();
  }

  function _showDrillComplete(container) {
    const ds = _drillState, onNodeComplete = ds && ds._onNodeComplete;
    if (onNodeComplete) { _drillState = null; setTimeout(onNodeComplete, 600); return; }
    const char = ds ? ds.char : '', k = n5Data ? n5Data.find(d => d.char === char) : null;
    const totalCorrect = ds ? (ds.totalCorrect || 0) : 0;
    const totalSteps   = ds ? (ds.sequence ? ds.sequence.length : 1) : 1;
    const accuracy     = totalSteps > 0 ? totalCorrect / totalSteps : 1;
    _drillState = null;

    // Grade based on drill accuracy: < 60% = Hard(1), 60–85% = Good(2), > 85% = Easy(3)
    if (char) {
      const grade = accuracy < 0.6 ? 1 : accuracy < 0.86 ? 2 : 3;
      scheduleReview(char, grade);
    }

    const pct = Math.round(accuracy * 100);
    const emoji = pct >= 90 ? '🌟' : pct >= 70 ? '✓' : '💪';

    container.innerHTML =
      '<div class="card knj-complete-card">' +
        '<div class="knj-complete-char">' + (char || '✓') + '</div>' +
        '<div style="font-size:16px;font-weight:700;margin-bottom:4px">' + (k ? k.meaning : 'Complete!') + '</div>' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:10px;color:var(--correct);margin-bottom:4px">' + emoji + ' Drill complete</div>' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted);margin-bottom:24px">' + totalCorrect + ' / ' + totalSteps + ' correct · ' + pct + '%</div>' +
        '<div style="display:flex;gap:8px">' +
          '<button class="btn btn-secondary" id="knjDoneHome"   style="flex:1">Back to catalog</button>' +
          '<button class="btn btn-primary"   id="knjDoneReview" style="flex:1">Start SRS review</button>' +
        '</div>' +
      '</div>';
    container.querySelector('#knjDoneHome').addEventListener('click',   () => renderHome(container));
    container.querySelector('#knjDoneReview').addEventListener('click', () => startReviewSession(container, 'all'));
  }

  // ── _renderTypeMeaning() — open text recall, no options ─────────
  // Forces genuine retrieval. Fuzzy match on answer (ignore case, spaces, /).
  function _renderTypeMeaning(char, container, onResult) {
    const k = n5Data.find(d => d.char === char); if (!k) return;
    const accepted = k.meaning.toLowerCase().split(/[/,]/).map(s => s.trim()).filter(Boolean);

    container.innerHTML =
      _dotsHTML() +
      _eyebrowHTML('Recall · Type the meaning') +
      '<div class="card" style="padding:20px;text-align:center">' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;margin-bottom:12px">What does this mean? Type it.</div>' +
        '<div style="font-family:\'Noto Sans JP\',sans-serif;font-size:96px;font-weight:900;line-height:1;padding:8px 0 20px">' + char + '</div>' +
        '<div class="knj-recall-input-wrap">' +
          '<input class="knj-recall-input" id="knjTypeInput" type="text" placeholder="type the meaning…" autocomplete="off" autocorrect="off" spellcheck="false">' +
          '<button class="knj-recall-submit" id="knjTypeSubmit">Check →</button>' +
        '</div>' +
        '<div id="knjTypeFeedback" style="display:none;margin-top:12px"></div>' +
      '</div>';

    container.querySelector('#knjBackBtn').addEventListener('click', () => { _drillState = null; renderHome(container); });
    const input = container.querySelector('#knjTypeInput');
    const submitBtn = container.querySelector('#knjTypeSubmit');
    const feedback = container.querySelector('#knjTypeFeedback');
    let answered = false;

    input.focus();
    input.addEventListener('keydown', e => { if (e.key === 'Enter' && !answered) check(); });
    submitBtn.addEventListener('click', () => { if (!answered) check(); });

    function check() {
      answered = true;
      const typed = input.value.trim().toLowerCase();
      const isCorrect = accepted.some(a => typed === a || typed.replace(/\s+/g, '') === a.replace(/\s+/g, ''));
      input.classList.add(isCorrect ? 'correct' : 'wrong');
      submitBtn.disabled = true;
      feedback.style.display = '';
      if (isCorrect) {
        feedback.innerHTML = '<div class="knj-exp-box knj-exp-box-correct"><strong>✓ ' + k.meaning + '</strong></div>';
      } else {
        feedback.innerHTML = '<div class="knj-exp-box knj-exp-box-wrong">' +
          '<strong>✗ It\'s: ' + k.meaning + '</strong>' +
          (k.mnemonic ? '<div style="margin-top:6px;font-size:12px;line-height:1.6;color:var(--text)">' + k.mnemonic + '</div>' : '') +
          '</div>';
      }
      onResult(isCorrect);
    }
  }

  // ── _renderCompoundMatch() — pick the compound that uses this kanji ─
  // Shows 3 compound words, learner picks which one contains the kanji.
  function _renderCompoundMatch(char, container, onResult) {
    const k = n5Data.find(d => d.char === char); if (!k) return;
    const compounds = (k.compound_examples || []);
    if (!compounds.length) { onResult(true); return; }

    // Target = first compound. Distractors from other kanji's compounds.
    const target = compounds[0];
    const pool = [];
    n5Data.forEach(other => {
      if (other.char === char) return;
      (other.compound_examples || []).slice(0, 2).forEach(c => pool.push(c));
    });
    const distractors = _shuffle(pool).slice(0, 2);
    const options = _shuffle([{ c: target, correct: true }, ...distractors.map(c => ({ c, correct: false }))]);

    container.innerHTML =
      _dotsHTML() +
      _eyebrowHTML('Recall · Compound Match') +
      '<div class="card" style="padding:20px;text-align:center">' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;margin-bottom:10px">Which word uses this kanji?</div>' +
        '<div style="font-family:\'Noto Sans JP\',sans-serif;font-size:80px;font-weight:900;line-height:1;padding:8px 0 20px">' + char + '</div>' +
        '<div class="knj-mcq-grid" id="knjCmpGrid">' +
          options.map(opt =>
            '<button class="knj-mcq-opt" data-correct="' + opt.correct + '" style="flex-direction:column;gap:3px;padding:14px 10px">' +
              '<span style="font-family:\'Noto Sans JP\',sans-serif;font-size:22px;font-weight:900">' + opt.c.word + '</span>' +
              '<span style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted)">' + opt.c.romaji + '</span>' +
            '</button>'
          ).join('') +
        '</div>' +
        '<div id="knjCmpFeedback" style="display:none;margin-top:12px"></div>' +
      '</div>';

    container.querySelector('#knjBackBtn').addEventListener('click', () => { _drillState = null; renderHome(container); });
    const grid = container.querySelector('#knjCmpGrid'), feedback = container.querySelector('#knjCmpFeedback');
    let answered = false;

    grid.querySelectorAll('.knj-mcq-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        if (answered) return; answered = true;
        const isCorrect = opt.dataset.correct === 'true';
        grid.querySelectorAll('.knj-mcq-opt').forEach(o => {
          if (o.dataset.correct === 'true') o.classList.add('knj-opt-correct');
          else if (o === opt && !isCorrect) o.classList.add('knj-opt-wrong');
          else o.classList.add('knj-opt-greyed');
          o.disabled = true;
        });
        feedback.style.display = '';
        feedback.innerHTML = isCorrect
          ? '<div class="knj-exp-box knj-exp-box-correct"><strong>✓ ' + target.word + '</strong> — ' + target.en + '</div>'
          : '<div class="knj-exp-box knj-exp-box-wrong"><strong>✗ It was: ' + target.word + '</strong> — ' + target.en + '</div>';
        onResult(isCorrect);
      });
    });
  }

  // ── _renderFreeRecall() — type what you remember, then 3-grade self-rate ─
  // No fuzzy matching — learner writes whatever they remember, then sees
  // the answer and honestly rates themselves. No interval labels shown.
  function _renderFreeRecall(char, container, onResult) {
    const k = n5Data.find(d => d.char === char); if (!k) return;
    const mainOn  = (k.on  && k.on[0])  ? k.on[0]  : '';
    const onRom   = (k.on_romaji && k.on_romaji[0]) ? k.on_romaji[0] : '';
    let revealed = false;

    function renderPhase1() {
      container.innerHTML =
        _dotsHTML() +
        _eyebrowHTML('Recall · Free Write') +
        '<div class="card" style="padding:20px;text-align:center">' +
          '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;margin-bottom:12px">What do you remember about this kanji? Write it out.</div>' +
          '<div style="font-family:\'Noto Sans JP\',sans-serif;font-size:96px;font-weight:900;line-height:1;padding:8px 0 16px">' + char + '</div>' +
          '<div class="knj-recall-input-wrap">' +
            '<input class="knj-recall-input" id="knjFreeInput" type="text" placeholder="meaning, reading, any memory…" autocomplete="off" autocorrect="off" spellcheck="false">' +
            '<button class="knj-recall-submit" id="knjFreeReveal">Reveal answer</button>' +
          '</div>' +
        '</div>';

      container.querySelector('#knjBackBtn').addEventListener('click', () => { _drillState = null; renderHome(container); });
      const input = container.querySelector('#knjFreeInput');
      input.focus();
      input.addEventListener('keydown', e => { if (e.key === 'Enter') reveal(); });
      container.querySelector('#knjFreeReveal').addEventListener('click', reveal);
    }

    function reveal() {
      if (revealed) return; revealed = true;
      const typed = container.querySelector('#knjFreeInput').value.trim();
      // Show answer + self-grade buttons (no interval labels)
      const answerHTML = document.createElement('div');
      answerHTML.innerHTML =
        '<div class="knj-exp-box" style="margin-top:12px;margin-bottom:0">' +
          '<div style="font-family:\'Noto Sans JP\',sans-serif;font-size:48px;font-weight:900;text-align:center;margin-bottom:6px">' + char + '</div>' +
          '<div style="font-size:20px;font-weight:700;text-align:center;margin-bottom:8px;color:var(--text)">' + k.meaning + '</div>' +
          (mainOn ? '<div style="font-family:\'Space Mono\',monospace;font-size:11px;text-align:center;color:var(--accent3);margin-bottom:4px">' + mainOn + (onRom ? ' · ' + onRom : '') + '</div>' : '') +
          (k.mnemonic ? '<div style="font-size:12px;line-height:1.7;color:var(--muted);text-align:left;margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">' + k.mnemonic + '</div>' : '') +
        '</div>' +
        '<div style="font-size:11px;color:var(--muted);text-align:center;margin:12px 0 6px">How well did you remember?</div>' +
        '<div class="knj-selfgrade-row">' +
          '<button class="knj-selfgrade-btn knj-selfgrade-blank" id="knjSGBlank">✗ Blank<span class="knj-selfgrade-sub">didn\'t recall</span></button>' +
          '<button class="knj-selfgrade-btn knj-selfgrade-hmm"   id="knjSGHmm">~ Partial<span class="knj-selfgrade-sub">got some of it</span></button>' +
          '<button class="knj-selfgrade-btn knj-selfgrade-got"   id="knjSGGot">✓ Clear<span class="knj-selfgrade-sub">got it right</span></button>' +
        '</div>';

      const card = container.querySelector('.card');
      card.appendChild(answerHTML);
      container.querySelector('#knjFreeReveal').style.display = 'none';

      container.querySelector('#knjSGBlank').addEventListener('click', () => onResult(false));
      container.querySelector('#knjSGHmm').addEventListener('click',   () => onResult(false)); // partial = re-queue
      container.querySelector('#knjSGGot').addEventListener('click',   () => onResult(true));
    }

    renderPhase1();
  }

  // ── _renderActiveMCQ() P3: eyebrow, dots, exp-box ────────────────
  function _renderActiveMCQ(char, container, isReverse, onResult) {
    const k = n5Data.find(d => d.char === char); if (!k) return;
    const distractors = _getDistractors(k, 3);
    const allOptions  = _shuffle([
      { value: isReverse ? k.char : k.meaning, correct: true },
      ...distractors.map(c => { const d = n5Data.find(x => x.char === c); return { value: isReverse ? c : (d ? d.meaning : c), correct: false }; })
    ]);
    const ds = _drillState, streak = ds ? ds.totalCorrect : 0;
    const stepLabel = isReverse ? 'Stage 2 · Reverse Recall' : 'Stage 2 · Recognition MCQ';
    const badge = streak >= 2 ? streak + ' in a row' : null;
    container.innerHTML =
      _dotsHTML() +
      _eyebrowHTML(stepLabel, badge, 'knj-eyebrow-badge-green') +
      '<div class="card" style="padding:20px;text-align:center">' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;margin-bottom:10px">' +
          (isReverse ? 'Which kanji matches this meaning?' : 'What does this mean?') +
        '</div>' +
        (isReverse
          ? '<div style="font-size:16px;font-weight:700;padding:16px 0 8px;color:var(--text)">' + k.meaning + '</div>'
          : '<div style="font-family:\'Noto Sans JP\',sans-serif;font-size:96px;font-weight:900;line-height:1;padding:12px 0 8px">' + char + '</div>'
        ) +
        '<div class="knj-mcq-grid" id="knjMcqGrid">' +
          allOptions.map(opt =>
            '<button class="knj-mcq-opt" data-correct="' + opt.correct + '">' +
              '<div class="knj-mcq-opt-text' + (isReverse ? '" style="font-family:\'Noto Sans JP\',sans-serif;font-size:22px;font-weight:700' : '') + '">' + opt.value + '</div>' +
            '</button>'
          ).join('') +
        '</div>' +
        '<div id="knjMcqFeedback" style="display:none;margin-top:12px"></div>' +
      '</div>';
    container.querySelector('#knjBackBtn').addEventListener('click', () => { _drillState = null; renderHome(container); });
    const grid = container.querySelector('#knjMcqGrid'), feedback = container.querySelector('#knjMcqFeedback');
    let answered = false;
    grid.querySelectorAll('.knj-mcq-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        if (answered) return; answered = true;
        const isCorrect = opt.dataset.correct === 'true';
        grid.querySelectorAll('.knj-mcq-opt').forEach(o => {
          if (o.dataset.correct === 'true') o.classList.add('knj-opt-correct');
          else if (o === opt && !isCorrect) o.classList.add('knj-opt-wrong');
          else o.classList.add('knj-opt-greyed');
          o.disabled = true;
        });
        // Feedback with memory hook on wrong
        feedback.style.display = '';
        const step = ds ? ds.sequence[ds.idx] : null;
        const streakNow = step ? (step.streak || 0) : 0;
        const needed    = step ? (step.needed || 1) : 1;
        if (isCorrect) {
          const streakMsg = needed > 1 ? (streakNow + 1 >= needed ? '✓ Nailed it!' : '✓ ' + (streakNow + 1) + ' / ' + needed + ' — one more') : '✓ Correct!';
          feedback.innerHTML = '<div class="knj-exp-box knj-exp-box-correct"><strong>' + streakMsg + '</strong>' +
            (k.mnemonic ? ' <span style="color:var(--muted);font-size:10px">' + k.mnemonic.slice(0, 60) + '</span>' : '') + '</div>';
        } else {
          feedback.innerHTML = '<div class="knj-exp-box knj-exp-box-wrong">' +
            '<strong>✗ ' + k.char + ' = ' + k.meaning + '</strong>' +
            (k.mnemonic ? '<div style="margin-top:6px;font-size:12px;line-height:1.6;color:var(--text)">' + k.mnemonic + '</div>' : '') +
            '</div>';
        }
        onResult(isCorrect);
      });
    });
  }

  // ── _renderReadingMCQ() P3 ────────────────────────────────────────
  function _renderReadingMCQ(char, container, onResult) {
    const k = n5Data.find(d => d.char === char); if (!k) return;
    const allReadings = [].concat(k.on || []).concat((k.kun || []).map(r => r.replace(/-.*$/, '').replace(/\..*$/, '')));
    if (allReadings.length === 0) { onResult(true); return; }
    const targetReading = (k.on && k.on[0]) ? k.on[0] : allReadings[0];
    const targetRomaji  = (k.on && k.on_romaji && k.on_romaji[0]) ? k.on_romaji[0] : '';
    const readingType   = (k.on && k.on[0]) ? 'on-reading — used in compounds' : 'kun-reading — used standalone';
    let others = [];
    Object.keys(progress).forEach(c => {
      if (c === char || !progress[c].introduced_at) return;
      const o = n5Data.find(d => d.char === c); if (!o) return;
      const r = (o.on && o.on[0]) ? o.on[0] : (o.kun && o.kun[0] ? o.kun[0].replace(/-.*$/, '').replace(/\..*$/, '') : null);
      if (r && r !== targetReading) others.push(r);
    });
    others = _shuffle(others.filter((r, i, a) => a.indexOf(r) === i)).slice(0, 3);
    const pad = ['あ','か','な','は','ま'].filter(r => r !== targetReading);
    while (others.length < 3) others.push(pad.shift() || 'x');
    const options = _shuffle([{ value: targetReading, correct: true }].concat(others.slice(0, 3).map(r => ({ value: r, correct: false }))));
    container.innerHTML =
      _dotsHTML() +
      _eyebrowHTML('Stage 2 · Reading Recall', 'No hints', 'knj-eyebrow-badge-warn') +
      '<div class="card" style="padding:20px;text-align:center">' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;margin-bottom:8px">How is this kanji read?</div>' +
        '<div style="font-family:\'Noto Sans JP\',sans-serif;font-size:96px;font-weight:900;line-height:1;padding:12px 0 8px">' + char + '</div>' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted);margin-bottom:20px">(' + readingType + ')</div>' +
        '<div class="knj-mcq-grid" id="knjMcqGrid">' +
          options.map(o => '<button class="knj-mcq-opt" data-correct="' + o.correct + '"><div class="knj-mcq-opt-text" style="font-family:\'Noto Sans JP\',sans-serif;font-size:20px;font-weight:700">' + o.value + '</div></button>').join('') +
        '</div>' +
        '<div id="knjMcqFeedback" style="display:none;margin-top:12px"></div>' +
      '</div>';
    container.querySelector('#knjBackBtn').addEventListener('click', () => { _drillState = null; renderHome(container); });
    const grid = container.querySelector('#knjMcqGrid'), feedback = container.querySelector('#knjMcqFeedback');
    let answered = false;
    grid.querySelectorAll('.knj-mcq-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        if (answered) return; answered = true;
        const isCorrect = opt.dataset.correct === 'true';
        grid.querySelectorAll('.knj-mcq-opt').forEach(o => {
          if (o.dataset.correct === 'true') o.classList.add('knj-opt-correct');
          else if (o === opt && !isCorrect) o.classList.add('knj-opt-wrong');
          else o.classList.add('knj-opt-greyed');
          o.disabled = true;
        });
        feedback.style.display = '';
        const romPart = targetRomaji ? ' <span style="font-family:\'Space Mono\',monospace;font-size:10px;color:var(--muted)">(' + targetRomaji + ')</span>' : '';
        feedback.innerHTML = isCorrect
          ? '<div class="knj-exp-box knj-exp-box-correct"><strong>✓ ' + targetReading + '</strong>' + romPart + '</div>'
          : '<div class="knj-exp-box knj-exp-box-wrong"><strong>✗ It\'s ' + targetReading + '</strong>' + romPart + (k.mnemonic ? '<br>' + k.mnemonic.slice(0, 80) + '…' : '') + '</div>';
        onResult(isCorrect);
      });
    });
  }

  // ── _renderActiveContext() P3+P4 ─────────────────────────────────
  function _renderActiveContext(char, container, onResult, sentIdx) {
    const k = n5Data.find(d => d.char === char); if (!k) return;
    const sentences = k.sentences || [];
    if (!sentences.length) { onResult(true); return; }

    // Use explicit sentIdx if given, otherwise random
    const sIdx = (sentIdx !== undefined && sentIdx < sentences.length) ? sentIdx : Math.floor(Math.random() * sentences.length);
    const s = sentences[sIdx];

    const targetReading = (k.on && k.on[0]) ? k.on[0] : (k.kun && k.kun[0] ? k.kun[0].replace(/-.*$/, '').replace(/\..*$/, '') : null);
    const targetRomaji  = (k.on && k.on[0] && k.on_romaji && k.on_romaji[0]) ? k.on_romaji[0] : (k.kun_romaji && k.kun_romaji[0] ? k.kun_romaji[0] : '');
    const readingLabel  = (k.on && k.on[0]) ? 'on-reading' : 'kun-reading';

    let rdgDistractors = [];
    Object.keys(progress).forEach(c => {
      if (c === char || !progress[c].introduced_at) return;
      const o = n5Data.find(d => d.char === c); if (!o) return;
      const r = (o.on && o.on[0]) ? o.on[0] : (o.kun && o.kun[0] ? o.kun[0].replace(/-.*$/, '').replace(/\..*$/, '') : null);
      if (r && r !== targetReading) rdgDistractors.push(r);
    });
    rdgDistractors = _shuffle(rdgDistractors.filter((r, i, a) => a.indexOf(r) === i)).slice(0, 3);
    const pad = ['つ','に','か','も','よ','て','を','は'].filter(r => r !== targetReading);
    while (rdgDistractors.length < 3) rdgDistractors.push(pad.shift() || 'x');
    const rdgOptions = targetReading
      ? _shuffle([{ value: targetReading, correct: true }].concat(rdgDistractors.slice(0, 3).map(r => ({ value: r, correct: false }))))
      : null;

    // P4: box-element blank (48×30px)
    const blankJP = s.jp.replace(
      new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      '<span class="knj-context-blank"></span>'
    );
    const distractors = _getDistractors(k, 3).map(c => { const d = n5Data.find(x => x.char === c); return d ? d.char : c; });
    const options = _shuffle([{ value: char, correct: true }].concat(distractors.map(c => ({ value: c, correct: false }))));

    container.innerHTML =
      _dotsHTML() +
      _eyebrowHTML('Stage 3 · Sentence Context') +
      '<div class="card" style="padding:20px" id="knjCtxCard">' +
        '<div style="background:var(--surface2);border-radius:10px;padding:14px 16px;margin-bottom:14px">' +
          '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;margin-bottom:8px">Japanese sentence · no reading for the blank</div>' +
          '<div class="knj-context-sentence">' + blankJP + '</div>' +
          '<div style="font-size:12px;color:var(--muted);margin-top:-4px">' + s.en + '</div>' +
        '</div>' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">Which kanji fills the blank?</div>' +
        '<div class="knj-context-mc" id="knjCtxMc">' +
          options.map(opt => '<button class="knj-context-opt" data-correct="' + opt.correct + '">' + opt.value + '</button>').join('') +
        '</div>' +
        '<div id="knjCtxFeedback" style="display:none;margin-top:10px"></div>' +
      '</div>';
    container.querySelector('#knjBackBtn').addEventListener('click', () => { _drillState = null; renderHome(container); });

    const mc = container.querySelector('#knjCtxMc'), feedback = container.querySelector('#knjCtxFeedback');
    let phase1Done = false;

    function _showReadingPhase(p1Correct) {
      if (!rdgOptions || !targetReading) { onResult(p1Correct); return; }
      feedback.innerHTML +=
        '<div class="knj-ctx-rdg-panel">' +
          '<div class="knj-ctx-rdg-label">How is <span style="font-family:\'Noto Sans JP\',sans-serif;font-size:14px;font-weight:700;color:var(--accent3)">' + char + '</span> read? <span style="font-size:8px;opacity:.7">(' + readingLabel + ')</span></div>' +
          '<div class="knj-ctx-rdg-opts" id="knjCtxRdgOpts">' +
            rdgOptions.map(o => '<button class="knj-ctx-rdg-opt" data-correct="' + o.correct + '">' + o.value + '</button>').join('') +
          '</div>' +
          '<div id="knjCtxRdgFb" style="display:none;margin-top:8px"></div>' +
        '</div>';
      const rdgOpts = feedback.querySelector('#knjCtxRdgOpts'), rdgFb = feedback.querySelector('#knjCtxRdgFb');
      let rdgDone = false;
      rdgOpts.querySelectorAll('.knj-ctx-rdg-opt').forEach(btn => {
        btn.addEventListener('click', () => {
          if (rdgDone) return; rdgDone = true;
          const rdgOk = btn.dataset.correct === 'true';
          rdgOpts.querySelectorAll('.knj-ctx-rdg-opt').forEach(b => {
            if (b.dataset.correct === 'true') b.classList.add('knj-opt-correct');
            else if (b === btn && !rdgOk) b.classList.add('knj-opt-wrong');
            else b.classList.add('knj-opt-greyed');
            b.disabled = true;
          });
          rdgFb.style.display = '';
          const romPart = targetRomaji ? ' <span style="font-family:\'Space Mono\',monospace;font-size:10px;color:var(--muted)">(' + targetRomaji + ')</span>' : '';
          rdgFb.innerHTML = rdgOk
            ? '<div class="knj-exp-box knj-exp-box-correct"><strong>✓ ' + targetReading + '</strong>' + romPart + (s.grammar_note ? '<br><em style="font-size:10px">' + s.grammar_note + '</em>' : '') + '</div>'
            : '<div class="knj-exp-box knj-exp-box-wrong"><strong>✗ It\'s ' + targetReading + '</strong>' + romPart + '</div>';
          onResult(p1Correct && rdgOk);
        });
      });
    }

    mc.querySelectorAll('.knj-context-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        if (phase1Done) return; phase1Done = true;
        const isOk = opt.dataset.correct === 'true';
        mc.querySelectorAll('.knj-context-opt').forEach(o => {
          if (o.dataset.correct === 'true') o.classList.add('knj-opt-correct');
          else if (o === opt && !isOk) o.classList.add('knj-opt-wrong');
          o.disabled = true;
        });
        feedback.style.display = '';
        feedback.innerHTML = isOk
          ? '<div class="knj-exp-box knj-exp-box-correct"><strong>✓ Correct!</strong> ' + char + ' = ' + k.meaning + '</div>'
          : '<div class="knj-exp-box knj-exp-box-wrong"><strong>✗ The answer was: <span style="font-family:\'Noto Sans JP\',sans-serif;font-size:18px">' + char + '</span></strong></div>';
        _showReadingPhase(isOk);
      });
    });
  }

  // ── _renderActiveWrite() P3+P7 ───────────────────────────────────
  function _renderActiveWrite(char, container, onComplete) {
    const k = n5Data ? n5Data.find(d => d.char === char) : null;
    const ds = _drillState;
    const phase = ds ? (ds.mode === 'learn' ? 'Phase 3 · Confirm' : 'Writing Recall') : 'Writing';

    container.innerHTML =
      _dotsHTML() +
      _eyebrowHTML(phase, 'Self-grade', 'knj-eyebrow-badge-warn') +
      '<div class="card" style="padding:20px;text-align:center">' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;margin-bottom:8px">Write this kanji from memory</div>' +
        '<div style="font-size:26px;font-weight:800;margin-bottom:2px;color:var(--text)">' + (k ? k.meaning : '') + '</div>' +
        (k && k.on && k.on[0] ? '<div style="font-family:\'Noto Sans JP\',sans-serif;font-size:18px;color:var(--muted);margin-bottom:12px">' + k.on[0] + '</div>' : '<div style="margin-bottom:12px"></div>') +
        '<div class="knj-canvas-wrap">' +
          _guideSVG() +
          '<div class="knj-canvas-model" id="knjCanvasModel">' + char + '</div>' +
          '<canvas class="knj-canvas" width="180" height="180"></canvas>' +
        '</div>' +
        '<div class="knj-write-hint">Ghost model · draw over it or alongside</div>' +
        '<div class="knj-write-actions">' +
          '<button class="btn btn-secondary" id="knjClearBtn">Clear</button>' +
          '<button class="btn btn-secondary" id="knjRevealBtn">Reveal</button>' +
        '</div>' +
        '<div class="knj-self-grade-note">Did you capture the right structure?</div>' +
        '<div class="knj-write-grade-row">' +
          '<button class="knj-write-grade-miss" id="knjWriteAgain">✗ Missed it<span class="knj-grade-sub">drill again</span></button>' +
          '<button class="knj-write-grade-got"  id="knjWriteGot">✓ Got it<span class="knj-grade-sub">move on</span></button>' +
        '</div>' +
      '</div>';
    container.querySelector('#knjBackBtn').addEventListener('click', () => { _drillState = null; renderHome(container); });
    _setupCanvas(container, char);
    container.querySelector('#knjRevealBtn').addEventListener('click', () => { container.querySelector('#knjCanvasModel').style.opacity = '0.55'; });
    container.querySelector('#knjWriteAgain').addEventListener('click', () => {
      const ds2 = _drillState;
      if (ds2 && ds2.mode === 'learn') {
        // Insert extra MCQ + write loop
        ds2.sequence.splice(ds2.idx + 1, 0,
          { type:'mcq', reverse:false, needed:2, streak:0 },
          { type:'mcq', reverse:true,  needed:2, streak:0 },
          { type:'write' }
        );
      }
      onComplete(false);
    });
    container.querySelector('#knjWriteGot').addEventListener('click', () => onComplete(true));
  }

  // ── Canvas setup ──────────────────────────────────────────────────
  function _setupCanvas(container, char) {
    const canvas = container.querySelector('canvas.knj-canvas'); if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = 180, H = canvas.height = 180;
    let drawing = false;
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#f1f1f4';
    ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    function getPos(e) {
      const r = canvas.getBoundingClientRect(), src = e.touches ? e.touches[0] : e;
      return { x: (src.clientX - r.left) * (W / r.width), y: (src.clientY - r.top) * (H / r.height) };
    }
    canvas.addEventListener('pointerdown', e => { drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); });
    canvas.addEventListener('pointermove', e => { if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); });
    canvas.addEventListener('pointerup',     () => { drawing = false; ctx.beginPath(); });
    canvas.addEventListener('pointercancel', () => { drawing = false; ctx.beginPath(); });
    const clr = container.querySelector('#knjClearBtn');
    if (clr) clr.addEventListener('click', () => ctx.clearRect(0, 0, W, H));
  }

  // ── startReviewSession() ──────────────────────────────────────────
  function startReviewSession(container, mode, chars) {
    if (!n5Data) { renderHome(container); return; }
    let queue;
    const now = Date.now();
    if (mode === 'due') {
      queue = Object.values(progress).filter(p => p.stage >= STAGE_SRS && p.srs_due && p.srs_due <= now).sort((a, b) => (a.srs_due||0)-(b.srs_due||0)).map(p => p.char);
    } else if (mode === 'select') {
      queue = chars || [];
    } else {
      queue = Object.values(progress).filter(p => p.introduced_at).map(p => p.char);
    }
    queue = _shuffle(queue);
    if (queue.length === 0) { _toast('Nothing to review!', 'var(--warn)'); renderHome(container); return; }
    _drillState = { mode:'review', queue, qIdx:0, correct:0, wrong:0 };
    _nextReviewItem(container);
  }

  function _nextReviewItem(container) {
    const ds = _drillState;
    if (!ds || ds.qIdx >= ds.queue.length) { _showReviewSummary(container); return; }
    const char = ds.queue[ds.qIdx];
    const k = n5Data.find(d => d.char === char);
    if (!k) { ds.qIdx++; _nextReviewItem(container); return; }
    container.classList.remove('knj-screen-enter'); void container.offsetWidth; container.classList.add('knj-screen-enter');
    const handler = grade => { scheduleReview(char, grade); if (grade >= 1) ds.correct++; else ds.wrong++; ds.qIdx++; _nextReviewItem(container); };
    if (ds.qIdx % 3 === 2) _renderSRSWrite(char, container, handler);
    else _renderSRSMCQ(char, container, handler);
  }

  // ── _renderSRSMCQ() P3+P5: 4-grade ───────────────────────────────
  function _renderSRSMCQ(char, container, onGrade) {
    const k = n5Data.find(d => d.char === char); if (!k) return;
    const ds = _drillState, iv = _computeGradeIntervals(char);
    container.innerHTML =
      '<div class="knj-srs-header">' +
        '<button class="btn btn-secondary" id="knjSRSBack" style="font-size:12px;padding:7px 12px">← End review</button>' +
        '<div class="knj-srs-counter">' + (ds.qIdx + 1) + ' / ' + ds.queue.length + '</div>' +
      '</div>' +
      '<div class="card" style="padding:20px;text-align:center">' +
        '<div style="font-family:\'Noto Sans JP\',sans-serif;font-size:80px;font-weight:900;line-height:1;padding:16px 0">' + char + '</div>' +
        '<div id="knjSRSAnswer" style="display:none">' +
          '<div style="font-size:18px;font-weight:700;margin-bottom:8px;color:var(--text)">' + k.meaning + '</div>' +
          _renderPronunciationBlock(k) +
          _gradeRowHTML(iv) +
        '</div>' +
        '<div id="knjSRSReveal"><button class="btn btn-secondary" id="knjRevealMeaning" style="width:100%;margin-top:8px">Reveal meaning</button></div>' +
      '</div>';
    container.querySelector('#knjSRSBack').addEventListener('click', () => { _drillState = null; renderHome(container, 'reviews'); });
    container.querySelector('#knjRevealMeaning').addEventListener('click', () => {
      container.querySelector('#knjSRSAnswer').style.display = '';
      container.querySelector('#knjSRSReveal').style.display = 'none';
    });
    container.querySelectorAll('.knj-grade-btn').forEach(btn => btn.addEventListener('click', () => onGrade(parseInt(btn.dataset.grade))));
  }

  // ── _renderSRSWrite() P3+P5+P7 ───────────────────────────────────
  function _renderSRSWrite(char, container, onGrade) {
    const k = n5Data.find(d => d.char === char); if (!k) return;
    const ds = _drillState, iv = _computeGradeIntervals(char);
    const mainReading = (k.on && k.on[0]) ? k.on[0] : (k.kun && k.kun[0] ? k.kun[0].replace(/-.*$/, '') : '');
    container.innerHTML =
      '<div class="knj-srs-header">' +
        '<button class="btn btn-secondary" id="knjSRSBack" style="font-size:12px;padding:7px 12px">← End review</button>' +
        '<div class="knj-srs-counter">' + (ds.qIdx + 1) + ' / ' + ds.queue.length + '</div>' +
      '</div>' +
      '<div class="card" style="padding:20px;text-align:center">' +
        '<div style="font-size:14px;font-weight:700;margin-bottom:4px;color:var(--text)">' + k.meaning + '</div>' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:11px;color:var(--muted);margin-bottom:12px">' + mainReading + '</div>' +
        '<div class="knj-canvas-wrap">' +
          _guideSVG() +
          '<div class="knj-canvas-model" id="knjCanvasModel">' + char + '</div>' +
          '<canvas class="knj-canvas" width="180" height="180"></canvas>' +
        '</div>' +
        '<div class="knj-write-actions">' +
          '<button class="btn btn-secondary" id="knjClearBtn">Clear</button>' +
          '<button class="btn btn-secondary" id="knjRevealBtn">Reveal answer</button>' +
        '</div>' +
        _gradeRowHTML(iv) +
      '</div>';
    container.querySelector('#knjSRSBack').addEventListener('click', () => { _drillState = null; renderHome(container, 'reviews'); });
    _setupCanvas(container, char);
    container.querySelector('#knjRevealBtn').addEventListener('click', () => { container.querySelector('#knjCanvasModel').style.opacity = '0.55'; });
    container.querySelectorAll('.knj-grade-btn').forEach(btn => btn.addEventListener('click', () => onGrade(parseInt(btn.dataset.grade))));
  }

  // ── _showReviewSummary() ──────────────────────────────────────────
  function _showReviewSummary(container) {
    const ds = _drillState, correct = ds ? ds.correct : 0, total = ds ? (ds.correct + ds.wrong) : 0;
    const pct = total > 0 ? Math.round(correct / total * 100) : 0;
    const reviewed = ds ? [...ds.queue].slice(0, ds.qIdx) : [];
    _drillState = null;

    const statsAfter = _getStats();
    const stillDue   = statsAfter.due;
    const canLearnNew = _getTodayNewCount() < MAX_NEW_PER_DAY;

    const breakdownRows = reviewed.slice(0, 8).map(char => {
      const k  = n5Data.find(d => d.char === char);
      const p  = progress[char] || {};
      const rank = _getRank(p);
      const iv   = p.srs_interval_ms ? _formatInterval(p.srs_interval_ms) : '—';
      return '<div style="display:flex;align-items:center;gap:10px;padding:5px 0;border-bottom:1px solid var(--border)">' +
        '<span style="font-family:\'Noto Sans JP\',sans-serif;font-size:20px;font-weight:900;color:var(--text);min-width:28px">' + char + '</span>' +
        '<span style="flex:1;font-size:12px;color:var(--muted)">' + (k ? k.meaning : '') + '</span>' +
        (rank ? '<span style="font-size:12px">' + rank.icon + '</span>' : '') +
        '<span style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted)">' + iv + '</span>' +
      '</div>';
    }).join('');

    container.innerHTML =
      '<div class="card" style="text-align:center;padding:28px 24px">' +
        '<div style="font-size:36px;margin-bottom:10px">' + (pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '😅') + '</div>' +
        '<div style="font-size:20px;font-weight:700;margin-bottom:4px">Review complete</div>' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:13px;color:var(--correct);margin-bottom:6px">' + correct + ' / ' + total + ' correct (' + pct + '%)</div>' +
        (stillDue > 0
          ? '<div style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--warn);margin-bottom:16px">' + stillDue + ' review' + (stillDue !== 1 ? 's' : '') + ' still due</div>'
          : '<div style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted);margin-bottom:16px">All caught up ✓</div>') +
        (breakdownRows ? '<div style="text-align:left;margin-bottom:16px">' + breakdownRows + '</div>' : '') +
        '<div style="display:flex;gap:8px">' +
          (stillDue > 0
            ? '<button class="btn btn-primary" id="knjSumContinue" style="flex:1">Continue reviews (' + stillDue + ')</button>'
            : (canLearnNew ? '<button class="btn btn-primary" id="knjSumLearnNew" style="flex:1">✦ Learn a new kanji</button>' : '')) +
          '<button class="btn btn-secondary" id="knjSummaryHome" style="flex:1">Back to home</button>' +
        '</div>' +
      '</div>';

    container.querySelector('#knjSummaryHome').addEventListener('click', () => renderHome(container));
    const contBtn = container.querySelector('#knjSumContinue');
    if (contBtn) contBtn.addEventListener('click', () => startReviewSession(container, 'due'));
    const newBtn = container.querySelector('#knjSumLearnNew');
    if (newBtn) newBtn.addEventListener('click', () => { renderHome(container, 'catalog'); });
  }

  // ── _renderReadingNode() ──────────────────────────────────────────
  function _renderReadingNode(char, container, onComplete) {
    const k = n5Data.find(d => d.char === char); if (!k) { onComplete(); return; }
    const s = (k.sentences || [])[0]; if (!s) { onComplete(); return; }
    const knownChars = Object.keys(progress).filter(c => progress[c] && progress[c].introduced_at !== null);
    let jpWithTaps = s.jp;
    knownChars.forEach(c => {
      jpWithTaps = jpWithTaps.replace(
        new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        '<span class="knj-tap-kanji" data-char="' + c + '">' + c + '</span>'
      );
    });
    const sentHTML = s.furi || jpWithTaps;
    const mcqOptions = _shuffle([{ value: k.meaning, correct: true }].concat(_getDistractors(k, 3).map(c => {
      const d = n5Data.find(x => x.char === c); return { value: d ? d.meaning : c, correct: false };
    })));
    container.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">' +
        '<button class="btn btn-secondary" id="knjBackBtn" style="font-size:12px;padding:7px 12px">← Back</button>' +
        '<div class="knj-eyebrow-text">Reading Node</div>' +
      '</div>' +
      '<div class="card" style="padding:20px;margin-bottom:14px">' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted);text-transform:uppercase;margin-bottom:10px">Tap any kanji to see its reading</div>' +
        '<div style="font-family:\'Noto Sans JP\',sans-serif;font-size:20px;line-height:2.6;margin-bottom:8px" id="knjReadSent">' + sentHTML + '</div>' +
        '<div style="font-size:13px;color:var(--muted)">' + s.en + '</div>' +
        (s.grammar_note ? '<div class="knj-grammar-note">' + s.grammar_note + '</div>' : '') +
      '</div>' +
      '<div id="knjReadPopup" style="display:none"></div>' +
      '<div class="card" style="padding:16px;margin-bottom:14px">' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted);text-transform:uppercase;margin-bottom:10px">Comprehension check</div>' +
        '<div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:12px">What does <span style="font-family:\'Noto Sans JP\',sans-serif;font-size:18px;color:var(--accent3)">' + char + '</span> mean here?</div>' +
        '<div class="knj-context-mc" id="knjReadMcq">' +
          mcqOptions.map(o => '<button class="knj-context-opt" style="font-size:13px" data-correct="' + o.correct + '">' + o.value + '</button>').join('') +
        '</div>' +
        '<div id="knjReadFb" style="display:none;margin-top:10px"></div>' +
      '</div>';
    container.querySelector('#knjBackBtn').addEventListener('click', () => renderHome(container, 'path'));
    const popup = container.querySelector('#knjReadPopup');
    container.addEventListener('click', e => {
      const tapEl = e.target.closest('.knj-tap-kanji');
      if (!tapEl) { if (!e.target.closest('.card')) popup.style.display = 'none'; return; }
      const tapChar = tapEl.dataset.char, tapK = n5Data.find(d => d.char === tapChar); if (!tapK) return;
      const tapP = progress[tapChar] || {}, tapRank = _getRank(tapP);
      popup.style.display = '';
      popup.innerHTML =
        '<div class="card" style="padding:14px;margin-bottom:14px;border-color:var(--accent3)">' +
          '<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">' +
            '<span style="font-family:\'Noto Sans JP\',sans-serif;font-size:40px;font-weight:900">' + tapChar + '</span>' +
            '<div><div style="font-size:14px;font-weight:700;color:var(--text)">' + tapK.meaning + '</div>' +
            (tapRank ? '<div style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted)">' + tapRank.icon + ' ' + tapRank.label + '</div>' : '') + '</div>' +
          '</div>' +
          '<div class="knj-rdg-row">' +
            (tapK.on || []).map((kana, i) => { const rom = (tapK.on_romaji || [])[i] || ''; return '<div class="knj-rdg-card"><div class="knj-rdg-type">On</div><div class="knj-rdg-kana">' + kana + '</div>' + (rom ? '<div class="knj-rdg-romaji">' + rom + '</div>' : '') + '</div>'; }).join('') +
            (tapK.kun || []).slice(0, 2).map((kana, i) => { const rom = (tapK.kun_romaji || [])[i] || '', disp = kana.replace(/-.*$/, '').replace(/\..*$/, ''); return '<div class="knj-rdg-card"><div class="knj-rdg-type">Kun</div><div class="knj-rdg-kana">' + disp + '</div>' + (rom ? '<div class="knj-rdg-romaji">' + rom + '</div>' : '') + '</div>'; }).join('') +
          '</div>' +
        '</div>';
    });
    const mcq = container.querySelector('#knjReadMcq'), fb = container.querySelector('#knjReadFb');
    let answered = false;
    mcq.querySelectorAll('.knj-context-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        if (answered) return; answered = true;
        const isOk = opt.dataset.correct === 'true';
        mcq.querySelectorAll('.knj-context-opt').forEach(o => {
          if (o.dataset.correct === 'true') o.classList.add('knj-opt-correct');
          else if (o === opt && !isOk) o.classList.add('knj-opt-wrong');
          o.disabled = true;
        });
        fb.style.display = '';
        fb.innerHTML = (isOk
          ? '<div class="knj-exp-box knj-exp-box-correct"><strong>✓ Correct!</strong></div>'
          : '<div class="knj-exp-box knj-exp-box-wrong"><strong>✗ ' + char + ' = ' + k.meaning + '</strong></div>') +
          '<button class="btn btn-primary" id="knjReadContinue" style="width:100%;margin-top:10px">Continue →</button>';
        fb.querySelector('#knjReadContinue').addEventListener('click', onComplete);
      });
    });
  }

  // ── _renderReinforceNode() ────────────────────────────────────────
  function _renderReinforceNode(targetChar, container, onComplete) {
    const others = Object.values(progress)
      .filter(p => p.char !== targetChar && p.introduced_at !== null && p.stage >= STAGE_SRS)
      .sort((a, b) => (a.last_seen || 0) - (b.last_seen || 0)).slice(0, 2).map(p => p.char);
    const allChars = [targetChar].concat(others);
    let idx = 0;
    function nextChar() {
      if (idx >= allChars.length) { onComplete(); return; }
      const char = allChars[idx++];
      _drillState = {
        char, mode: 'reinforce',
        sequence: [{ type:'mcq', reverse:false }, { type:'mcq', reverse:true }, { type:'context' }],
        idx: 0, totalCorrect: 0, _onNodeComplete: nextChar,
      };
      _runDrillStep(container);
    }
    nextChar();
  }

  // ── _renderRankCheckNode() ────────────────────────────────────────
  function _renderRankCheckNode(char, container, onComplete) {
    const k = n5Data.find(d => d.char === char), p = progress[char] || {}, rank = _getRank(p);
    if (!rank) { onComplete(); return; }
    const rankColors = { academy:'#888780', genin:'#185FA5', chunin:'#534AB7', jonin:'#EF9F27', hokage:'#1D9E75' };
    const color = rankColors[rank.id] || '#8B7CF6';
    container.innerHTML =
      '<div class="card" style="text-align:center;padding:32px 24px">' +
        '<div style="font-size:48px;margin-bottom:8px">' + rank.icon + '</div>' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Rank Advance</div>' +
        '<div style="font-family:\'Noto Sans JP\',sans-serif;font-size:60px;font-weight:900;color:' + color + ';margin-bottom:4px">' + char + '</div>' +
        '<div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:16px">' + (k ? k.meaning : '') + '</div>' +
        '<div style="font-size:26px;font-weight:800;color:' + color + ';margin-bottom:6px">' + rank.label + '</div>' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:9px;color:var(--muted);margin-bottom:24px">' +
          'interval: ' + Math.round((p.srs_interval_ms || 0) / 86400000) + 'd · ' +
          'reviews: ' + (p.review_count || 0) + ' · ' +
          'accuracy: ' + ((p.correct_total || 0) + (p.wrong_total || 0) > 0
            ? Math.round((p.correct_total || 0) / ((p.correct_total || 0) + (p.wrong_total || 0)) * 100) + '%'
            : '—') +
        '</div>' +
        '<button class="btn btn-primary" id="knjRankContinue" style="width:100%">Keep going →</button>' +
      '</div>';
    container.querySelector('#knjRankContinue').addEventListener('click', onComplete);
  }

  // ── _renderDataError() ────────────────────────────────────────────
  function _renderDataError(container) {
    if (!container) container = document.getElementById('knjModeInner');
    container.innerHTML =
      '<div style="padding:40px 16px;text-align:center;color:var(--wrong);font-family:\'Space Mono\',monospace;font-size:11px">' +
        '⚠ Could not load kanji data.<br><br>' +
        '<span style="color:var(--muted);font-size:10px">Serve with: python3 -m http.server 8080</span>' +
      '</div>';
  }

  // ── openKanjiMode() ───────────────────────────────────────────────
  async function openKanjiMode() {
    const inner = document.getElementById('knjModeInner'); if (!inner) return;
    inner.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;padding:40px;color:var(--muted);font-family:\'Space Mono\',monospace;font-size:12px">Loading…</div>';
    const ok = await init();
    if (!ok) { _renderDataError(inner); return; }
    renderHome(inner);
    if (!inner._furiDel) {
      inner._furiDel = true;
      inner.addEventListener('click', e => {
        const btn = e.target.closest('.knj-furi-toggle'); if (!btn) return;
        const target = document.getElementById(btn.dataset.target); if (!target) return;
        const sentDiv = target.querySelector('.knj-sent-ruby'); if (!sentDiv) return;
        const nowHidden = sentDiv.classList.toggle('knj-furi-hidden');
        btn.textContent = nowHidden ? '▼ show furigana' : '▲ hide furigana';
        try { localStorage.setItem(LS_FURI_PREF, nowHidden ? 'hide' : 'show'); } catch (_) {}
      });
    }
  }

  // ── Legacy stubs ──────────────────────────────────────────────────
  function renderDrillCard(char, container)    { _startLearningDrill(char, container || document.getElementById('knjModeInner')); }
  function renderMCQDrill(char, container)     { _renderActiveMCQ(char, container || document.getElementById('knjModeInner'), false, () => {}); }
  function renderContextDrill(char, container) { _renderActiveContext(char, container || document.getElementById('knjModeInner'), () => {}); }
  function renderWriteDrill(char, container)   { _renderActiveWrite(char, container || document.getElementById('knjModeInner'), () => {}); }

  // ── PUBLIC API ────────────────────────────────────────────────────
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
