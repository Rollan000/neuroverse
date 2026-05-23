// ============================================================
// R2 CONFIG & FETCH HELPER
// ============================================================
// Set this to your Cloudflare R2 public bucket URL after setup.
// e.g. 'https://pub-XXXX.r2.dev' or your custom domain.
const R2_BASE = 'https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev';

// ============================================================
// GLOBAL CONSTANTS
// ============================================================
const RARITY_COLORS = { common:'var(--muted)', uncommon:'var(--correct)', rare:'var(--accent)', epic:'var(--accent2)', legendary:'var(--warn)' };


/**
 * Fetch a JSON file from R2, with sessionStorage caching.
 * Returns parsed JSON or null on failure.
 * @param {string} path - e.g. 'data/kanji_db.json'
 */
async function r2Fetch(path) {
  const cacheKey = `r2_cache__${path}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
    const res = await fetch(`${R2_BASE}/${path}`);
    if (!res.ok) throw new Error(`R2 fetch failed: ${path} (${res.status})`);
    const data = await res.json();
    try { sessionStorage.setItem(cacheKey, JSON.stringify(data)); } catch (_) {}
    return data;
  } catch (e) {
    console.error('[R2]', e);
    return null;
  }
}

// ============================================================
// APP DATA — Runtime containers (populated by initAppData)
// ============================================================
// These replace the hardcoded constants below.
// Code elsewhere should use these variables, not the hardcoded ones.
let APP_HIRAGANA    = null;   // replaces HIRAGANA
let APP_KATAKANA    = null;   // replaces KATAKANA
let APP_KANA_COMBOS = null;   // new: combo kana
let APP_KANJI_DB    = null;   // replaces KANJI_DB
let APP_FLASHCARDS  = null;   // replaces FLASHCARDS
let APP_MCQ         = null;   // replaces MCQ
let APP_FILL_BANK   = null;   // replaces FILL_BANK
let APP_SEQ_BANK    = null;   // replaces SEQ_BANK
let APP_SHOP_ITEMS  = null;   // replaces hardcoded shop items

// ============================================================
// LOADING STATE HELPERS
// ============================================================
function showDataLoader() {
  let el = document.getElementById('r2LoadingOverlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'r2LoadingOverlay';
    el.style.cssText = [
      'position:fixed','top:0','left:0','width:100%','height:100%',
      'background:rgba(10,10,20,0.82)','z-index:9999',
      'display:flex','flex-direction:column',
      'align-items:center','justify-content:center',
      'font-family:inherit','color:#c9b8ff',
    ].join(';');
    el.innerHTML = `
      <div style="font-size:2rem;margin-bottom:1rem;"><img src="https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/important_loooking_book.png" style="width:2rem;height:2rem;image-rendering:pixelated" /></div>
      <div style="font-size:1.1rem;letter-spacing:.08em;">Loading study data…</div>
      <div id="r2LoadProgress" style="margin-top:.6rem;font-size:.85rem;opacity:.6;"></div>
    `;
    document.body.appendChild(el);
  }
  el.style.display = 'flex';
}

function setLoadProgress(msg) {
  const el = document.getElementById('r2LoadProgress');
  if (el) el.textContent = msg;
}

function hideDataLoader() {
  const el = document.getElementById('r2LoadingOverlay');
  if (el) {
    el.style.transition = 'opacity .4s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 450);
  }
}

// ============================================================
// INIT APP DATA — Fetch all R2 assets on startup
// ============================================================
async function initAppData() {
  showDataLoader();

  const files = [
    { key: 'hiragana',    path: 'data/hiragana.json',     label: 'Hiragana…' },
    { key: 'katakana',    path: 'data/katakana.json',     label: 'Katakana…' },
    { key: 'kanaCombos',  path: 'data/kana_combos.json',  label: 'Kana combos…' },
    { key: 'kanjiDb',     path: 'data/kanji_db.json',     label: 'Kanji database…' },
    { key: 'flashcards',  path: 'data/flashcards_n5.json',label: 'Flashcards…' },
    { key: 'mcq',         path: 'data/mcq_n5.json',       label: 'MCQ questions…' },
    { key: 'fillBank',    path: 'data/fill_bank.json',    label: 'Fill-in-blank…' },
    { key: 'seqBank',     path: 'data/seq_bank.json',     label: 'Sequence questions…' },
    { key: 'shopItems',   path: 'data/shop_items.json',   label: 'Shop items…' },
  ];

  const results = {};
  for (const f of files) {
    setLoadProgress(f.label);
    results[f.key] = await r2Fetch(f.path);
  }

  // Assign to runtime containers — fall back to hardcoded if R2 unavailable
  APP_HIRAGANA    = results.hiragana    || HIRAGANA;
  APP_KATAKANA    = results.katakana    || KATAKANA;
  APP_KANA_COMBOS = results.kanaCombos  || [];
  APP_KANJI_DB    = results.kanjiDb     || KANJI_DB;
  APP_FLASHCARDS  = results.flashcards  || FLASHCARDS;
  APP_MCQ         = results.mcq         || MCQ;
  APP_FILL_BANK   = results.fillBank    || FILL_BANK;
  APP_SEQ_BANK    = results.seqBank     || SEQ_BANK;
  APP_SHOP_ITEMS  = results.shopItems   || [];

  hideDataLoader();
  console.log('[R2] Data loaded:', {
    hiragana: APP_HIRAGANA.length,
    katakana: APP_KATAKANA.length,
    kanaCombos: APP_KANA_COMBOS.length,
    kanjiDb: APP_KANJI_DB.length,
    flashcards: APP_FLASHCARDS.length,
    mcq: APP_MCQ.length,
    fillBank: APP_FILL_BANK.length,
    seqBank: APP_SEQ_BANK.length,
    shopItems: APP_SHOP_ITEMS.length,
  });
// Re-init study modes now that data is ready
  try { initFlash(); } catch(e) {}
  try { initMCQ(); }   catch(e) {}
  try { initCyc(); }   catch(e) {}
  try { updateReviewBadge(); } catch(e) {}
}

// ============================================================
// KICK OFF DATA LOAD
// Run as early as possible — before DOMContentLoaded fires,
// so data is ready when tabs first render.
// ============================================================
initAppData();
// Mascot elements - declared at script scope, assigned after DOM ready
let mascotImg = null;
let mascotBubble = null;

// ============================================================
// DATA - Full question bank
// ============================================================

// ============================================================
// DATA — Japanese Study Content
// ============================================================

// ─── HIRAGANA / KATAKANA TABLES ──────────────────────────────
// TODO: Expand to full 46 hiragana + 46 katakana + voiced/combo
const HIRAGANA = [
  { romaji:'a',  kana:'あ' }, { romaji:'i',  kana:'い' }, { romaji:'u',  kana:'う' },
  { romaji:'e',  kana:'え' }, { romaji:'o',  kana:'お' },
  { romaji:'ka', kana:'か' }, { romaji:'ki', kana:'き' }, { romaji:'ku', kana:'く' },
  { romaji:'ke', kana:'け' }, { romaji:'ko', kana:'こ' },
  { romaji:'sa', kana:'さ' }, { romaji:'shi',kana:'し' }, { romaji:'su', kana:'す' },
  { romaji:'se', kana:'せ' }, { romaji:'so', kana:'そ' },
  { romaji:'ta', kana:'た' }, { romaji:'chi',kana:'ち' }, { romaji:'tsu',kana:'つ' },
  { romaji:'te', kana:'て' }, { romaji:'to', kana:'と' },
  { romaji:'na', kana:'な' }, { romaji:'ni', kana:'に' }, { romaji:'nu', kana:'ぬ' },
  { romaji:'ne', kana:'ね' }, { romaji:'no', kana:'の' },
  { romaji:'ha', kana:'は' }, { romaji:'hi', kana:'ひ' }, { romaji:'fu', kana:'ふ' },
  { romaji:'he', kana:'へ' }, { romaji:'ho', kana:'ほ' },
  { romaji:'ma', kana:'ま' }, { romaji:'mi', kana:'み' }, { romaji:'mu', kana:'む' },
  { romaji:'me', kana:'め' }, { romaji:'mo', kana:'も' },
  { romaji:'ya', kana:'や' }, { romaji:'yu', kana:'ゆ' }, { romaji:'yo', kana:'よ' },
  { romaji:'ra', kana:'ら' }, { romaji:'ri', kana:'り' }, { romaji:'ru', kana:'る' },
  { romaji:'re', kana:'れ' }, { romaji:'ro', kana:'ろ' },
  { romaji:'wa', kana:'わ' }, { romaji:'wo', kana:'を' }, { romaji:'n',  kana:'ん' },
];

const KATAKANA = [
  { romaji:'a',  kana:'ア' }, { romaji:'i',  kana:'イ' }, { romaji:'u',  kana:'ウ' },
  { romaji:'e',  kana:'エ' }, { romaji:'o',  kana:'オ' },
  { romaji:'ka', kana:'カ' }, { romaji:'ki', kana:'キ' }, { romaji:'ku', kana:'ク' },
  { romaji:'ke', kana:'ケ' }, { romaji:'ko', kana:'コ' },
  { romaji:'sa', kana:'サ' }, { romaji:'shi',kana:'シ' }, { romaji:'su', kana:'ス' },
  { romaji:'se', kana:'セ' }, { romaji:'so', kana:'ソ' },
  { romaji:'ta', kana:'タ' }, { romaji:'chi',kana:'チ' }, { romaji:'tsu',kana:'ツ' },
  { romaji:'te', kana:'テ' }, { romaji:'to', kana:'ト' },
  { romaji:'na', kana:'ナ' }, { romaji:'ni', kana:'ニ' }, { romaji:'nu', kana:'ヌ' },
  { romaji:'ne', kana:'ネ' }, { romaji:'no', kana:'ノ' },
  { romaji:'ha', kana:'ハ' }, { romaji:'hi', kana:'ヒ' }, { romaji:'fu', kana:'フ' },
  { romaji:'he', kana:'ヘ' }, { romaji:'ho', kana:'ホ' },
  { romaji:'ma', kana:'マ' }, { romaji:'mi', kana:'ミ' }, { romaji:'mu', kana:'ム' },
  { romaji:'me', kana:'メ' }, { romaji:'mo', kana:'モ' },
  { romaji:'ya', kana:'ヤ' }, { romaji:'yu', kana:'ユ' }, { romaji:'yo', kana:'ヨ' },
  { romaji:'ra', kana:'ラ' }, { romaji:'ri', kana:'リ' }, { romaji:'ru', kana:'ル' },
  { romaji:'re', kana:'レ' }, { romaji:'ro', kana:'ロ' },
  { romaji:'wa', kana:'ワ' }, { romaji:'wo', kana:'ヲ' }, { romaji:'n',  kana:'ン' },
];

// ─── KANJI DATABASE ──────────────────────────────────────────
// Each entry: id, char, meaning, on (音読み), kun (訓読み),
//             jlpt, strokeCount, strokes (SVG path arrays — TODO: fill from KanjiVG),
//             tags (array: 'n5','nature','ep1', etc)
// TODO: Expand to full JLPT N5 set (~100 kanji) and N4 (~300 kanji)
const KANJI_DB = [
  { id:'k001', char:'山', meaning:'mountain',  on:'サン',     kun:'やま',   jlpt:'n5', strokeCount:3,  strokes:[], tags:['n5','nature'] },
  { id:'k002', char:'川', meaning:'river',     on:'セン',     kun:'かわ',   jlpt:'n5', strokeCount:3,  strokes:[], tags:['n5','nature'] },
  { id:'k003', char:'日', meaning:'sun / day', on:'ニチ・ジツ',kun:'ひ・か', jlpt:'n5', strokeCount:4,  strokes:[], tags:['n5','time'] },
  { id:'k004', char:'月', meaning:'moon / month',on:'ゲツ・ガツ',kun:'つき', jlpt:'n5', strokeCount:4,  strokes:[], tags:['n5','time'] },
  { id:'k005', char:'火', meaning:'fire',      on:'カ',       kun:'ひ',     jlpt:'n5', strokeCount:4,  strokes:[], tags:['n5','nature'] },
  { id:'k006', char:'水', meaning:'water',     on:'スイ',     kun:'みず',   jlpt:'n5', strokeCount:4,  strokes:[], tags:['n5','nature'] },
  { id:'k007', char:'木', meaning:'tree / wood',on:'モク・ボク',kun:'き',    jlpt:'n5', strokeCount:4,  strokes:[], tags:['n5','nature'] },
  { id:'k008', char:'金', meaning:'gold / money',on:'キン・コン',kun:'かね',  jlpt:'n5', strokeCount:8,  strokes:[], tags:['n5'] },
  { id:'k009', char:'土', meaning:'earth / soil',on:'ド・ト',  kun:'つち',   jlpt:'n5', strokeCount:3,  strokes:[], tags:['n5','nature'] },
  { id:'k010', char:'人', meaning:'person',    on:'ジン・ニン',kun:'ひと',   jlpt:'n5', strokeCount:2,  strokes:[], tags:['n5','people'] },
  { id:'k011', char:'大', meaning:'big / large',on:'ダイ・タイ',kun:'おお',  jlpt:'n5', strokeCount:3,  strokes:[], tags:['n5'] },
  { id:'k012', char:'小', meaning:'small',     on:'ショウ',   kun:'ちい・こ',jlpt:'n5', strokeCount:3,  strokes:[], tags:['n5'] },
  { id:'k013', char:'上', meaning:'above / up',on:'ジョウ',   kun:'うえ・あ',jlpt:'n5', strokeCount:3,  strokes:[], tags:['n5','direction'] },
  { id:'k014', char:'下', meaning:'below / down',on:'カ・ゲ', kun:'した・さ',jlpt:'n5', strokeCount:3,  strokes:[], tags:['n5','direction'] },
  { id:'k015', char:'中', meaning:'middle / inside',on:'チュウ',kun:'なか',  jlpt:'n5', strokeCount:4,  strokes:[], tags:['n5','direction'] },
  // TODO: Continue with full JLPT N5 kanji list
];

// ─── FLASHCARDS (Kanji) ──────────────────────────────────────
// Mirrors KANJI_DB but formatted for the flip-card engine.
// unit field repurposed: 'n5' | 'n4' | 'hiragana' | 'katakana' | 'ep1' etc.
// TODO: Auto-generate from KANJI_DB or expand manually
const FLASHCARDS = [
  { unit:'n5', q:'山', a:'Mountain\nOn: サン  Kun: やま\nEx: 山田 (やまだ) — Yamada (surname)', diff:'easy' },
  { unit:'n5', q:'川', a:'River\nOn: セン  Kun: かわ\nEx: 川口 (かわぐち) — Kawaguchi', diff:'easy' },
  { unit:'n5', q:'日', a:'Sun / Day\nOn: ニチ・ジツ  Kun: ひ・か\nEx: 日本 (にほん) — Japan', diff:'easy' },
  { unit:'n5', q:'月', a:'Moon / Month\nOn: ゲツ・ガツ  Kun: つき\nEx: 月曜日 (げつようび) — Monday', diff:'easy' },
  { unit:'n5', q:'火', a:'Fire\nOn: カ  Kun: ひ\nEx: 火曜日 (かようび) — Tuesday', diff:'easy' },
  { unit:'n5', q:'水', a:'Water\nOn: スイ  Kun: みず\nEx: 水曜日 (すいようび) — Wednesday', diff:'easy' },
  { unit:'n5', q:'木', a:'Tree / Wood\nOn: モク・ボク  Kun: き\nEx: 木曜日 (もくようび) — Thursday', diff:'easy' },
  { unit:'n5', q:'金', a:'Gold / Money\nOn: キン・コン  Kun: かね\nEx: 金曜日 (きんようび) — Friday', diff:'medium' },
  { unit:'n5', q:'土', a:'Earth / Soil\nOn: ド・ト  Kun: つち\nEx: 土曜日 (どようび) — Saturday', diff:'easy' },
  { unit:'n5', q:'人', a:'Person\nOn: ジン・ニン  Kun: ひと\nEx: 外国人 (がいこくじん) — foreigner', diff:'easy' },
  { unit:'n5', q:'大', a:'Big / Large\nOn: ダイ・タイ  Kun: おお\nEx: 大学 (だいがく) — university', diff:'easy' },
  { unit:'n5', q:'小', a:'Small\nOn: ショウ  Kun: ちい・こ\nEx: 小学校 (しょうがっこう) — elementary school', diff:'easy' },
  { unit:'n5', q:'上', a:'Above / Up\nOn: ジョウ  Kun: うえ・あ\nEx: 上手 (じょうず) — skilled', diff:'easy' },
  { unit:'n5', q:'下', a:'Below / Down\nOn: カ・ゲ  Kun: した・さ\nEx: 地下 (ちか) — underground', diff:'easy' },
  { unit:'n5', q:'中', a:'Middle / Inside\nOn: チュウ  Kun: なか\nEx: 中学校 (ちゅうがっこう) — middle school', diff:'easy' },
  // TODO: Add full JLPT N5 flashcard set (~100 kanji)
  // TODO: Add Hiragana/Katakana recognition cards
  // TODO: Add Episode 1, 2, 3 vocab cards from anime
];

// ─── MCQ (Multiple Choice) ───────────────────────────────────
// unit field: 'n5' | 'n4' | 'hiragana' | 'katakana' | 'ep1' etc.
// mode: 'romaji' (prompt EN → answer romaji), 'kana', 'meaning', 'kanji', 'mixed'
// TODO: Expand to full question bank for each JLPT level
// TODO: Add mode toggle in UI to filter by question format
const MCQ = [
  // ── Romaji mode (given English meaning → pick romaji reading) ──
  { unit:'n5', q:'What is the romaji reading for 山 (mountain)?', opts:['yama','kawa','hito','tsuki'], ans:0, exp:'山 reads やま (yama). Common words: 山田 (Yamada), 富士山 (Fujisan).', diff:'easy' },
  { unit:'n5', q:'What is the romaji reading for 川 (river)?',    opts:['yama','kawa','ki','mizu'],    ans:1, exp:'川 reads かわ (kawa). Example: 川口 (Kawaguchi).', diff:'easy' },
  { unit:'n5', q:'What is the romaji reading for 水 (water)?',    opts:['hi','mizu','tsuchi','kane'],  ans:1, exp:'水 reads みず (mizu). Example: 水曜日 (suiyōbi) — Wednesday.', diff:'easy' },
  { unit:'n5', q:'What is the romaji reading for 火 (fire)?',     opts:['hi','mi','ki','ka'],          ans:0, exp:'火 reads ひ (hi) as kun-reading, カ (ka) as on-reading. Example: 火曜日 (kayōbi) — Tuesday.', diff:'easy' },
  { unit:'n5', q:'Which kanji means "person"?',                   opts:['山','川','人','大'],            ans:2, exp:'人 (hito / jin / nin) means person or human. Example: 日本人 (nihonjin) — Japanese person.', diff:'easy' },
  { unit:'n5', q:'What does 大学 (daigaku) mean?',               opts:['High school','Elementary school','University','Library'], ans:2, exp:'大 (big/great) + 学 (study/learning) = 大学 (daigaku) = university.', diff:'easy' },
  { unit:'n5', q:'Which is the correct hiragana for "ki"?',       opts:['き','く','か','こ'],           ans:0, exp:'き is ki. The か row: か(ka) き(ki) く(ku) け(ke) こ(ko).', diff:'easy' },
  { unit:'n5', q:'Which is the correct hiragana for "tsu"?',      opts:['て','と','つ','た'],           ans:2, exp:'つ is tsu. The た row: た(ta) ち(chi) つ(tsu) て(te) と(to).', diff:'easy' },
  { unit:'n5', q:'What does 上手 (jōzu) mean?',                  opts:['Clumsy','Skilled/Good at','Big hand','Upper body'], ans:1, exp:'上 (above) + 手 (hand) = 上手 (jōzu) = skilled, good at something. Often used as: 〜が上手です (I am good at ~).', diff:'medium' },
  { unit:'n5', q:'What is the on-reading (音読み) of 月?',        opts:['つき','ガツ/ゲツ','にち','か'], ans:1, exp:'月 has on-readings ガツ・ゲツ (used in months and days: 月曜日 getsu-yōbi). Kun-reading is つき (tsuki, moon).', diff:'medium' },
  { unit:'n5', q:'Which kanji is used for "Wednesday"?',          opts:['火曜日','水曜日','木曜日','土曜日'], ans:1, exp:'水曜日 (suiyōbi) = Wednesday. 水 = water. The days of the week follow the 5 elements + sun + moon.', diff:'easy' },
  { unit:'n5', q:'What does 中学校 mean?',                        opts:['University','Elementary school','Middle school','High school'], ans:2, exp:'中 (middle) + 学校 (school) = 中学校 (chūgakkō) = middle school / junior high. Compare: 小学校 (shōgakkō) = elementary.', diff:'medium' },
  // TODO: Add 200+ MCQ across N5 / N4 / Hiragana / Katakana / Episode vocab sets
];

// ─── ANIME EPISODES ──────────────────────────────────────────
// TODO: Fill with actual episode data, video URLs, subtitle timed data
// subtitle words: { w: Japanese word, romaji, meaning, kanjiId? }
const EPISODES = [
  {
    id: 'ep01',
    title: 'Episode 1',
    show: 'TODO — Add show name',
    thumbUrl: '',   // TODO: Add episode thumbnail image URL
    videoUrl: '',   // TODO: Add video URL (YouTube embed or direct video src)
    studySetIds: ['k001','k002','k003'],  // KANJI_DB ids featured in this ep
    subtitles: [
      // TODO: Replace with real timed subtitle data
      // Format: { start: seconds, end: seconds, text: 'Japanese line', words: [...] }
      { start: 1.0,  end: 3.5,  text: 'おはようございます。', words: [{ w:'おはよう', romaji:'ohayou', meaning:'good morning', kanjiId:null }] },
      { start: 4.0,  end: 7.0,  text: 'いい天気ですね。',       words: [{ w:'天気', romaji:'tenki', meaning:'weather', kanjiId:null }] },
      { start: 8.0,  end: 11.0, text: '山が見えます。',         words: [{ w:'山', romaji:'yama', meaning:'mountain', kanjiId:'k001' }] },
    ],
  },
  {
    id: 'ep02',
    title: 'Episode 2',
    show: 'TODO — Add show name',
    thumbUrl: '',
    videoUrl: '',
    studySetIds: ['k004','k005','k006'],
    subtitles: [],  // TODO: Fill subtitle data
  },
  {
    id: 'ep03',
    title: 'Episode 3',
    show: 'TODO — Add show name',
    thumbUrl: '',
    videoUrl: '',
    studySetIds: ['k007','k008','k009'],
    subtitles: [],  // TODO: Fill subtitle data
  },
];

// ─── LEARNED VAULT ───────────────────────────────────────────
// Populated at runtime from localStorage; not hardcoded.
// Schema per item: { id, type:'anime'|'trace'|'mcq'|'flash', term, reading, meaning, dateAdded, source }
// Access via: JSON.parse(localStorage.getItem('learnedVault') || '[]')
// ============================================================
// CROSS-TAB REVIEW QUEUE
// Items pushed here from: wrong MCQ answers, missed flashcards
// Stored in localStorage under key 'reviewQueue'
// Used by the Review tab's SM-2 engine
// ============================================================

function reviewQueueLoad() {
  try { return JSON.parse(localStorage.getItem('reviewQueue') || '[]'); } catch(e) { return []; }
}
function reviewQueueSave(q) {
  try { localStorage.setItem('reviewQueue', JSON.stringify(q)); } catch(e) {}
}

function reviewQueuePush(card) {
  const q = reviewQueueLoad();
  // Deduplicate by card.q
  if (q.some(c => c.q === card.q)) return;
  q.push({ ...card, addedAt: Date.now() });
  reviewQueueSave(q);
  updateReviewBadge();
}

function reviewQueueRemove(cardQ) {
  const q = reviewQueueLoad().filter(c => c.q !== cardQ);
  reviewQueueSave(q);
  updateReviewBadge();
}

// Update the red badge count on sidebar REV button
function updateReviewBadge() {
  const q = reviewQueueLoad();
  const badge = document.getElementById('revOverdueBadge');
  if (!badge) return;
  if (q.length > 0) {
    badge.textContent = q.length > 99 ? '99+' : q.length;
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }
}
// ─── DEEP STUDY UNIT DEFINITIONS (repurposed) ────────────────
// These replace the APES unit names in the Deep Study (SM-2) engine.
// The engine itself (dsQueue, SM-2 scheduling) is unchanged.
// TODO: Wire DS unit cards to FLASHCARDS filtered by unit tag
const DS_UNITS = [
  { id:'hiragana', name:'Hiragana',       icon:'あ', desc:'All 46 hiragana characters' },
  { id:'katakana', name:'Katakana',       icon:'ア', desc:'All 46 katakana characters' },
  { id:'n5',       name:'JLPT N5 Kanji', icon:'漢', desc:'~100 essential kanji for N5' },
  { id:'n4',       name:'JLPT N4 Kanji', icon:'字', desc:'~300 kanji for N4 level' },
  { id:'ep1',      name:'Episode 1 Vocab',icon:'<img src="https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/open_book.png" style="width:1.1em;height:1.1em;vertical-align:middle;image-rendering:pixelated">', desc:'Vocabulary from Episode 1' },
  { id:'ep2',      name:'Episode 2 Vocab',icon:'<img src="https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/open_book.png" style="width:1.1em;height:1.1em;vertical-align:middle;image-rendering:pixelated">', desc:'Vocabulary from Episode 2' },
  { id:'ep3',      name:'Episode 3 Vocab',icon:'<img src="https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/open_book.png" style="width:1.1em;height:1.1em;vertical-align:middle;image-rendering:pixelated">', desc:'Vocabulary from Episode 3' },
  { id:'custom',   name:'Custom Set',    icon:'<img src="https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/star.png" style="width:1.1em;height:1.1em;vertical-align:middle;image-rendering:pixelated">', desc:"Items you've added manually" },
];

// (FRQ array removed — replaced by Kanji Trace and Anime features)
const FRQ = [];  // kept as empty array so initFRQ() doesn't error

// ─── FILL_BANK & SEQ_BANK ─────────────────────────────────────
// Cycle question banks (Fill-in-blank / Sequence) for the MCQ sub-modes.
// Populated from Japanese content. TODO: expand with real question data.
const FILL_BANK = [
  {
    unit: 'n5', topic: 'Numbers & Days',
    sentence: 'Monday in Japanese is ___ 曜日.',
    blanks: [{ answer: '月' }],
    choices: ['月', '火', '水', '木'],
    exp: '月曜日 (げつようび) = Monday. 月 means moon/month.',
  },
  {
    unit: 'n5', topic: 'Numbers & Days',
    sentence: 'Tuesday in Japanese is ___ 曜日.',
    blanks: [{ answer: '火' }],
    choices: ['月', '火', '水', '土'],
    exp: '火曜日 (かようび) = Tuesday. 火 means fire.',
  },
  {
    unit: 'n5', topic: 'Nature',
    sentence: '山 means ___ and reads ___ in Japanese.',
    blanks: [{ answer: 'mountain' }, { answer: 'yama' }],
    choices: ['mountain', 'river', 'yama', 'kawa'],
    exp: '山 (やま, yama) = mountain. On-reading: サン (San) as in 富士山.',
  },
  {
    unit: 'n5', topic: 'People',
    sentence: '大学 (だいがく) means ___.',
    blanks: [{ answer: 'university' }],
    choices: ['university', 'high school', 'hospital', 'library'],
    exp: '大 (big) + 学 (learning) = 大学 = university.',
  },
];

const SEQ_BANK = [
  {
    unit: 'n5', topic: 'Numbers & Days',
    question: 'Order the days of the week in Japanese (Mon → Fri)',
    items: ['月曜日 (Mon)', '火曜日 (Tue)', '水曜日 (Wed)', '木曜日 (Thu)', '金曜日 (Fri)'],
    exp: 'Japanese days: 月(moon)→火(fire)→水(water)→木(wood)→金(gold)→土(earth)→日(sun).',
  },
  {
    unit: 'n5', topic: 'Size',
    question: 'Order these kanji from smallest to largest concept',
    items: ['小 (small)', '中 (middle)', '大 (big)'],
    exp: '小(しょう small) → 中(ちゅう middle) → 大(だい big).',
  },
  {
    unit: 'n5', topic: 'Direction',
    question: 'Order these directions: below → middle → above',
    items: ['下 (below)', '中 (middle)', '上 (above)'],
    exp: '下(した below) → 中(なか middle) → 上(うえ above).',
  },
];

// Alias: initCyc2 is the actual implementation; initCyc() is called at startup
function initCyc() { initCyc2(); }


// ============================================================
// STATE
// ============================================================
let activeUnit = 'all';

let fcPool = [], fcIdx = 0, fcFlipped = false, fcKnown = new Set(), fcMissed = new Set();
let mcqPool = [], mcqIdx = 0, mcqAnswered = [], mcqScore = {c:0,w:0};
let frqPool = [], frqIdx = 0;

let session = { fcKnow:0, fcMiss:0, mcqC:0, mcqW:0 };

function getFiltered(arr) {
  if (!arr) return [];
  if (activeUnit === 'all') return [...arr];
  return arr.filter(x => x.unit == activeUnit);
}

function shuffle(arr) {
  for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
  return arr;
}

// ============================================================
// MODE SWITCH - defined later in the file (see switchMode below)
// ============================================================

// ============================================================
// UNIT FILTER
// ============================================================
function filterUnit(u, btn) {
  activeUnit = u;
  document.querySelectorAll('.unit-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  initFlash(); initMCQ();
  // initFRQ removed — FRQ replaced by Anime/Trace features
  // Re-init cycles panel if it's visible
  if (typeof mcqSubMode !== 'undefined' && mcqSubMode !== 'mcq') { buildTopicBar(); initCyc2(); }
}

// ============================================================
// FLASHCARDS
// ============================================================
function initFlash() {
  if (!APP_FLASHCARDS) return;
  fcPool = shuffle(getFilteredWithPacks(APP_FLASHCARDS, 'flashcards'));
  fcIdx = 0; fcFlipped = false; fcKnown = new Set(); fcMissed = new Set();
  renderFlash();
}

function renderFlash() {
  if(!fcPool.length){
    document.getElementById('fcCardWrap').innerHTML='<div class="card"><p style="color:var(--muted);text-align:center;padding:20px">No cards for this filter.</p></div>';
    return;
  }
  const card = fcPool[fcIdx];
  const wrap = document.getElementById('fcCardWrap');
  wrap.innerHTML = `
    <div class="flashcard-wrap" onclick="flipCard()">
      <div class="flashcard ${fcFlipped?'flipped':''}" id="fcCard">
        <div class="fc-front">
          <div class="fc-meta" style="display:flex;gap:8px;margin-bottom:12px">
            <span class="unit-tag">Unit ${card.unit}</span>
            <span class="diff-tag ${card.diff}">${card.diff}</span>
          </div>
          <div class="fc-hint">Click to flip ↓</div>
          <div class="fc-text">${card.q}</div>
        </div>
        <div class="fc-back">
          <div class="fc-hint">Answer</div>
          <div class="fc-text">${card.a}</div>
        </div>
      </div>
    </div>`;
  
  // Dots
  const dotRow = document.getElementById('fcDots');
  dotRow.innerHTML = fcPool.slice(0,Math.min(50,fcPool.length)).map((c,i)=>{
    let cls = 'dot';
    if(i===fcIdx) cls+=' current';
    else if(fcKnown.has(i)) cls+=' correct';
    else if(fcMissed.has(i)) cls+=' wrong';
    return `<div class="${cls}"></div>`;
  }).join('');

  document.getElementById('selfRate').classList.toggle('show', fcFlipped);
  updateFCStats();
}

function flipCard() {
  fcFlipped = !fcFlipped;
  const c = document.getElementById('fcCard');
  if(c) c.classList.toggle('flipped', fcFlipped);
  document.getElementById('selfRate').classList.toggle('show', fcFlipped);
}

function rateCard(knew) {
  if(knew) { fcKnown.add(fcIdx); fcMissed.delete(fcIdx); session.fcKnow++; rewardStudy(1); }
  else {
    fcMissed.add(fcIdx); fcKnown.delete(fcIdx); session.fcMiss++;
    const card = fcPool[fcIdx];
    if (card) {
      reviewQueuePush({
        id:   'fc_miss_' + fcIdx + '_' + Date.now(),
        type: 'flash',
        q:    card.q,
        a:    card.a,
        unit: card.unit || 'n5',
        diff: card.diff || 'medium',
      });
    }
  }
  updateFCStats();
  nextFlash();
}

function nextFlash() {
  if(!fcPool.length) return;
  fcIdx = (fcIdx+1) % fcPool.length;
  fcFlipped = false;
  renderFlash();
}

function shuffleFlash() { initFlash(); }

function reviewMissed() {
  const missed = fcPool.filter((_,i)=>fcMissed.has(i));
  if(!missed.length){ alert('No missed cards yet!'); return; }
  fcPool = shuffle(missed);
  fcIdx=0; fcFlipped=false; fcKnown=new Set(); fcMissed=new Set();
  renderFlash();
}

function updateFCStats() {
  document.getElementById('fcKnow').textContent = fcKnown.size;
  document.getElementById('fcMiss').textContent = fcMissed.size;
  document.getElementById('fcLeft').textContent = fcPool.length - fcKnown.size - fcMissed.size;
}

// ============================================================
// MCQ SUB-MODE SYSTEM (MCQ | Fill | Seq)
// ============================================================
let mcqSubMode = 'mcq'; // 'mcq' | 'fill' | 'seq'
let cycActiveTopic = 'all'; // topic filter for cycles in MCQ

// State for cycles-in-MCQ (separate from legacy cyclesMode state)
let cyc2Tab = 'fill';
let cyc2FillPool = [], cyc2FillIdx = 0, cyc2FillScore = {c:0,w:0};
let cyc2SeqPool = [], cyc2SeqIdx = 0, cyc2SeqScore = {c:0,w:0};
let cyc2AnsweredFill = [];
let cyc2AnsweredSeq = [];

function setMcqSub(sub, el) {
  mcqSubMode = sub;
  document.querySelectorAll('#mcqSubTabs .unit-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');

  const mcqPanel = document.getElementById('mcqPanel');
  const cycPanel = document.getElementById('mcqCyclesPanel');
  const resetBtn = document.getElementById('cycResetBtn2');

  if (sub === 'mcq') {
    mcqPanel.classList.remove('hidden');
    cycPanel.classList.add('hidden');
  } else {
    mcqPanel.classList.add('hidden');
    cycPanel.classList.remove('hidden');
    cyc2Tab = sub;
    if (resetBtn) resetBtn.style.display = sub === 'fill' ? '' : 'none';
    buildTopicBar();
    initCyc2();
  }
}

function getFilteredCyc(arr) {
  let filtered = arr;
  if (activeUnit !== 'all') filtered = filtered.filter(q => q.unit === activeUnit);
  if (cycActiveTopic !== 'all') filtered = filtered.filter(q => q.topic === cycActiveTopic);
  return filtered;
}

function buildTopicBar() {
  const bar = document.getElementById('cycTopicBar');
  if (!bar) return;
  const bank = cyc2Tab === 'fill' ? APP_FILL_BANK : APP_SEQ_BANK;
  if (!bank) return;
  const topics = [...new Set(bank.map(q => q.topic))].sort();
  bar.innerHTML = `<button class="unit-btn${cycActiveTopic==='all'?' active':''}" onclick="setCycTopic('all',this)">All Topics</button>` +
    topics.map(t => `<button class="unit-btn${cycActiveTopic===t?' active':''}" onclick="setCycTopic('${t.replace(/'/g,"\\'")}',this)">${t}</button>`).join('');
}

function setCycTopic(topic, el) {
  cycActiveTopic = topic;
  document.querySelectorAll('#cycTopicBar .unit-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  initCyc2();
}

function initCyc2() {
  if (!APP_FILL_BANK || !APP_SEQ_BANK) return;
  const fillFiltered = getFilteredCyc([...APP_FILL_BANK]);
  const seqFiltered = getFilteredCyc([...APP_SEQ_BANK]);
  cyc2FillPool = shuffle(fillFiltered);
  cyc2SeqPool = shuffle(seqFiltered);
  // Wipe any stale state from previous session
  cyc2FillPool.forEach(q => q.blanks.forEach(b => { delete b._filled2; }));
  cyc2SeqPool.forEach(q => { delete q._shuffledItems2; });
  cyc2FillIdx = 0; cyc2SeqIdx = 0;
  cyc2FillScore = {c:0,w:0}; cyc2SeqScore = {c:0,w:0};
  cyc2AnsweredFill = new Array(cyc2FillPool.length).fill(false);
  cyc2AnsweredSeq = new Array(cyc2SeqPool.length).fill(false);
  updateCyc2Stats();
  renderCyc2();
}

function updateCyc2Stats() {
  const score = cyc2Tab === 'fill' ? cyc2FillScore : cyc2SeqScore;
  const total = score.c + score.w;
  const cEl = document.getElementById('cycCorrect2');
  const wEl = document.getElementById('cycWrong2');
  const pEl = document.getElementById('cycPct2');
  if (cEl) cEl.textContent = score.c;
  if (wEl) wEl.textContent = score.w;
  if (pEl) pEl.textContent = total ? Math.round(score.c/total*100)+'%' : '—';
}

function renderCyc2() {
  updateCyc2Stats();
  if (cyc2Tab === 'fill') renderFillCard2();
  else renderSeqCard2();
}

function resetCurrentCyc2() {
  if (cyc2Tab === 'fill' && cyc2FillPool[cyc2FillIdx]) {
    cyc2FillPool[cyc2FillIdx].blanks.forEach(b => { delete b._filled2; });
    cyc2AnsweredFill[cyc2FillIdx] = false;
    renderFillCard2();
  }
}

// ── fill streak tracker ─────────────────────────────────────────────────
let fillStreak2 = 0;

function renderFillCard2() {
  const wrap = document.getElementById('cycCardWrap2');
  if (!wrap) return;
  if (!cyc2FillPool.length) {
    wrap.innerHTML = '<div class="card"><p style="color:var(--muted);padding:20px;text-align:center">No fill-in-blank questions for this selection.</p></div>';
    return;
  }
  const q = cyc2FillPool[cyc2FillIdx];
  const answered = cyc2AnsweredFill[cyc2FillIdx];
  if (!q._shuffled2) { q._shuffled2 = shuffle([...q.choices]); }
  const shuffled = q._shuffled2;
  const filledCount = q.blanks.filter(b => b._filled2).length;
  const totalBlanks = q.blanks.length;

  let blankIdx = 0;
  let sentenceHTML = q.sentence.replace(/___/g, () => {
    const b = q.blanks[blankIdx++];
    const val = b._filled2 || '';
    const isCorrect = answered && val.toLowerCase() === b.answer.toLowerCase();
    const cls = answered
      ? (isCorrect ? 'fill-blank revealed' : 'fill-blank wrong-reveal')
      : ('fill-blank' + (val ? ' filled' : ''));
    const display = answered ? b.answer : (val || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
    const icon = answered ? (isCorrect ? ' ✓' : ' ✗') : '';
    return `<span class="${cls}" data-idx="${blankIdx-1}" onclick="fillBlankClick2(${blankIdx-1})">${display}${icon}</span>`;
  });

  const chipHTML = shuffled.map((c) => {
    const used = q.blanks.some(b => (b._filled2 || '').toLowerCase() === c.toLowerCase());
    const cls = 'fill-chip' + (answered ? ' locked' : (used ? ' used' : ''));
    return `<button class="${cls}" onclick="fillChipClick2(${cyc2FillIdx},'${c.replace(/'/g,"\\'")}',this)">${c}</button>`;
  }).join('');

  const pipHTML = Array.from({length: totalBlanks}, (_,i) => {
    const filled = q.blanks[i] && q.blanks[i]._filled2;
    const cls = answered
      ? (filled && filled.toLowerCase() === q.blanks[i].answer.toLowerCase() ? 'fill-pip correct' : 'fill-pip wrong')
      : (filled ? 'fill-pip active' : 'fill-pip');
    return `<div class="${cls}"></div>`;
  }).join('');

  const streakBadge = fillStreak2 >= 2
    ? `<div class="fill-streak">&#x1F525; ${fillStreak2} streak</div>` : '';

  const readyToCheck = filledCount >= totalBlanks;
  const checkHTML = !answered
    ? `<button class="btn btn-primary seq-check-btn" id="fillCheckBtn2" onclick="checkFill2(${cyc2FillIdx})" style="margin-top:14px" ${readyToCheck ? '' : 'disabled'}>
        &#x2713; Check ${readyToCheck ? '' : `(${filledCount}/${totalBlanks})`}
       </button>` : '';

  const expHTML = answered ? `<div class="explanation show fill-exp-anim"><strong>Explanation:</strong> ${q.exp}</div>` : '';

  wrap.innerHTML = `
    <div class="card active-card fill-card-enhanced">
      <div class="q-meta" style="flex-wrap:wrap;gap:6px 8px">
        <span class="unit-tag">Unit ${q.unit}</span>
        <span class="diff-tag medium">${q.topic}</span>
        ${streakBadge}
        <span style="margin-left:auto;font-family:'Space Mono',monospace;font-size:11px;color:var(--muted)">${cyc2FillIdx+1} / ${cyc2FillPool.length}</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
        <div style="font-family:'Space Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:2px;color:var(--muted)">Blanks</div>
        <div class="fill-pip-row">${pipHTML}</div>
      </div>
      <div class="fill-sentence" style="margin-bottom:22px;font-size:15px;line-height:2.5">${sentenceHTML}</div>
      <div style="font-family:'Space Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:2px;color:var(--muted);margin-bottom:10px">Word Bank</div>
      <div class="fill-choices fill-choices-enhanced">${chipHTML}</div>
      ${checkHTML}
      ${expHTML}
    </div>`;
}

// Click a filled blank to un-fill it
function fillBlankClick2(blankIdx) {
  const q = cyc2FillPool[cyc2FillIdx];
  if (!q || cyc2AnsweredFill[cyc2FillIdx]) return;
  if (q.blanks[blankIdx] && q.blanks[blankIdx]._filled2) {
    delete q.blanks[blankIdx]._filled2;
    renderFillCard2();
  }
}

function fillChipClick2(qIdx, choice, el) {
  if (cyc2AnsweredFill[qIdx]) return;
  const q = cyc2FillPool[qIdx];
  const nextEmpty = q.blanks.findIndex(b => !b._filled2);
  if (nextEmpty === -1) return;
  q.blanks[nextEmpty]._filled2 = choice;
  renderFillCard2();
}

function checkFill2(qIdx) {
  const q = cyc2FillPool[qIdx];
  if (q.blanks.some(b => !b._filled2)) { rewardPopup('Fill all blanks first!'); return; }
  cyc2AnsweredFill[qIdx] = true;
  const correct = q.blanks.every(b => (b._filled2||'').toLowerCase() === b.answer.toLowerCase());
  if (correct) { cyc2FillScore.c++; session.mcqC++; rewardStudy(2); fillStreak2++; }
  else { cyc2FillScore.w++; session.mcqW++; fillStreak2 = 0; }
  updateCyc2Stats();
  renderFillCard2();
}

// ── SEQUENCE CARD (enhanced: timeline layout + cascade reveal) ───────────
function renderSeqCard2() {
  const wrap = document.getElementById('cycCardWrap2');
  if (!wrap) return;
  if (!cyc2SeqPool.length) {
    wrap.innerHTML = '<div class="card"><p style="color:var(--muted);padding:20px;text-align:center">No sequence questions for this selection.</p></div>';
    return;
  }
  const q = cyc2SeqPool[cyc2SeqIdx];
  const answered = cyc2AnsweredSeq[cyc2SeqIdx];
  if (!q._shuffledItems2) { q._shuffledItems2 = shuffle(q.items.map(i=>({...i}))); }
  const total = q._shuffledItems2.length;

  const allCorrect = answered && q._shuffledItems2.every((item,i) => item.order === i+1);

  const itemsHTML = q._shuffledItems2.map((item,i) => {
    let state = '';
    let stepColor = 'var(--border)';
    let textColor = 'var(--muted)';
    let nodeIcon = String(i+1);
    if (answered) {
      if (item.order === i+1) {
        state = 'seq-correct';
        stepColor = 'var(--correct)';
        textColor = 'var(--correct)';
        nodeIcon = '&#x2713;';
      } else {
        state = 'seq-wrong';
        stepColor = 'var(--wrong)';
        textColor = 'var(--wrong)';
        nodeIcon = '&#x2717;';
      }
    }
    const isLast = i === total - 1;
    const connectorStyle = isLast ? 'display:none' : `background:${stepColor};`;
    const delayMs = answered ? i * 80 : 0;
    return `<div class="seq-timeline-item ${state}" draggable="${!answered}"
      ondragstart="seqDragStart2(event,${i})"
      ondragover="seqDragOver2(event,${i})"
      ondrop="seqDrop2(event,${i})"
      ondragend="seqDragEnd2()"
      ontouchstart="seqTouchStart2(event,${i})"
      ontouchmove="seqTouchMove2(event)"
      ontouchend="seqTouchEnd2(event,${i})"
      style="animation-delay:${delayMs}ms">
      <div class="seq-tl-left">
        <div class="seq-tl-node" style="border-color:${stepColor};color:${stepColor}">${nodeIcon}</div>
        <div class="seq-tl-line" style="${connectorStyle}"></div>
      </div>
      <div class="seq-tl-body" style="color:${textColor}">
        ${!answered ? '<span class="seq-tl-handle">&#x2807;</span>' : ''}
        <span class="seq-tl-text">${item.text}</span>
        ${answered && item.order !== i+1 ? `<span class="seq-tl-correct-pos">&#x2192; was #${item.order}</span>` : ''}
      </div>
    </div>`;
  }).join('');

  const expHTML = answered ? `<div class="explanation show seq-exp-anim"><strong>&#x2192; Correct Order:</strong> ${q.exp}</div>` : '';
  const checkHTML = !answered ? `<button class="btn btn-primary seq-check-btn" onclick="checkSeq2(${cyc2SeqIdx})" style="margin-top:14px">&#x2713; Lock In Order</button>` : '';
  const resultBanner = answered ? (allCorrect
    ? `<div class="seq-result-banner correct">&#x2B50; Perfect order! +2 tickets</div>`
    : `<div class="seq-result-banner wrong">&#x2717; Not quite - see corrections above</div>`) : '';

  wrap.innerHTML = `
    <div class="card active-card seq-card-enhanced">
      <div class="q-meta">
        <span class="unit-tag">Unit ${q.unit}</span>
        <span class="diff-tag medium">${q.topic}</span>
        <span style="margin-left:auto;font-family:'Space Mono',monospace;font-size:11px;color:var(--muted)">${cyc2SeqIdx+1} / ${cyc2SeqPool.length}</span>
      </div>
      <div class="question-text" style="margin-bottom:4px">${q.instruction}</div>
      ${!answered ? '<div class="seq-tl-hint">drag items &#x2195; to reorder</div>' : ''}
      ${resultBanner}
      <div class="seq-timeline">${itemsHTML}</div>
      ${checkHTML}
      ${expHTML}
    </div>`;
}

function checkSeq2(qIdx) {
  const q = cyc2SeqPool[qIdx];
  cyc2AnsweredSeq[qIdx] = true;
  const correct = q._shuffledItems2.every((item,i) => item.order === i+1);
  if (correct) { cyc2SeqScore.c++; session.mcqC++; rewardStudy(3); }
  else { cyc2SeqScore.w++; session.mcqW++; }
  renderSeqCard2();
  updateCyc2Stats();
}

let dragSrcIdx2 = null;
function seqDragStart2(e, i) { dragSrcIdx2 = i; e.currentTarget.classList.add('dragging'); }
function seqDragOver2(e, i) { e.preventDefault(); document.querySelectorAll('#cycCardWrap2 .seq-timeline-item').forEach(el=>el.classList.remove('drag-over')); document.querySelectorAll('#cycCardWrap2 .seq-timeline-item')[i]?.classList.add('drag-over'); }
function seqDrop2(e, i) {
  e.preventDefault();
  if (dragSrcIdx2 === null || dragSrcIdx2 === i) return;
  const q = cyc2SeqPool[cyc2SeqIdx];
  [q._shuffledItems2[dragSrcIdx2], q._shuffledItems2[i]] = [q._shuffledItems2[i], q._shuffledItems2[dragSrcIdx2]];
  dragSrcIdx2 = null; renderSeqCard2();
}
function seqDragEnd2() { document.querySelectorAll('#cycCardWrap2 .seq-timeline-item').forEach(el=>{el.classList.remove('dragging');el.classList.remove('drag-over');}); }

let touchSrcIdx2 = null, touchClone2 = null;
function seqTouchStart2(e, i) {
  touchSrcIdx2 = i;
  const el = e.currentTarget;
  el.classList.add('dragging');
  touchClone2 = el.cloneNode(true);
  touchClone2.style.cssText = `position:fixed;width:${el.offsetWidth}px;opacity:0.85;pointer-events:none;z-index:9999;background:var(--surface2);border:1px solid var(--accent3);border-radius:8px;padding:10px 14px;`;
  document.body.appendChild(touchClone2);
}
function seqTouchMove2(e) {
  if (!touchClone2) return;
  e.preventDefault();
  const t = e.touches[0];
  touchClone2.style.left = (t.clientX - 20) + 'px';
  touchClone2.style.top = (t.clientY - 20) + 'px';
}
function seqTouchEnd2(e, srcI) {
  if (touchClone2) { touchClone2.remove(); touchClone2 = null; }
  document.querySelectorAll('#cycCardWrap2 .seq-timeline-item').forEach(el => el.classList.remove('dragging','drag-over'));
  const t = e.changedTouches[0];
  const els = document.querySelectorAll('#cycCardWrap2 .seq-timeline-item');
  let targetIdx = null;
  els.forEach((el,i) => { const r = el.getBoundingClientRect(); if (t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom) targetIdx = i; });
  if (targetIdx !== null && targetIdx !== touchSrcIdx2) {
    const q = cyc2SeqPool[cyc2SeqIdx];
    [q._shuffledItems2[touchSrcIdx2], q._shuffledItems2[targetIdx]] = [q._shuffledItems2[targetIdx], q._shuffledItems2[touchSrcIdx2]];
    renderSeqCard2();
  }
  touchSrcIdx2 = null;
}


function nextCyc2() {
  if (cyc2Tab === 'fill') {
    if (!cyc2FillPool.length) return;
    cyc2FillIdx = (cyc2FillIdx+1) % cyc2FillPool.length;
    // Clear filled answers on the new question so it's always fresh
    cyc2FillPool[cyc2FillIdx].blanks.forEach(b => { delete b._filled2; });
    cyc2AnsweredFill[cyc2FillIdx] = false;
  } else {
    if (!cyc2SeqPool.length) return;
    cyc2SeqIdx = (cyc2SeqIdx+1) % cyc2SeqPool.length;
    // Re-shuffle sequence items every time you navigate to it
    cyc2SeqPool[cyc2SeqIdx]._shuffledItems2 = null;
    cyc2AnsweredSeq[cyc2SeqIdx] = false;
  }
  renderCyc2();
}

function shuffleCyc2() { initCyc2(); }

// ============================================================
// MCQ
// ============================================================
function initMCQ() {
  if (!APP_MCQ) return;
  mcqPool = shuffle(getFilteredWithPacks(APP_MCQ, 'mcq'));
  mcqIdx = 0; mcqAnswered = new Array(mcqPool.length).fill(null);
  mcqScore = {c:0,w:0};
  updateMCQStats();
  renderMCQ();
}

function renderMCQ() {
  if(!mcqPool.length){
    document.getElementById('mcqCardWrap').innerHTML='<div class="card"><p style="color:var(--muted);text-align:center;padding:20px">No questions for this filter.</p></div>';
    return;
  }
  const q = mcqPool[mcqIdx];
  const answered = mcqAnswered[mcqIdx];
  const letters = ['A','B','C','D'];

  const optsHTML = q.opts.map((o,i)=>{
    let cls = 'option';
    if(answered!==null){
      cls+=' locked';
      if(i===q.ans) cls+=' correct';
      else if(i===answered && answered!==q.ans) cls+=' wrong';
      else cls+=' dim';
    }
    return `<button class="${cls}" onclick="answerMCQ(${i})">
      <span class="opt-letter">${letters[i]}</span>
      <span>${o}</span>
    </button>`;
  }).join('');

  const expHTML = answered!==null ? `<div class="explanation show"><strong>Explanation:</strong> ${q.exp}</div>` : '';

  document.getElementById('mcqCardWrap').innerHTML = `
    <div class="card active-card">
      <div class="q-meta">
        <span class="unit-tag">Unit ${q.unit}</span>
        <span class="diff-tag ${q.diff}">${q.diff}</span>
        <span style="margin-left:auto;font-family:'Space Mono',monospace;font-size:11px;color:var(--muted)">${mcqIdx+1} / ${mcqPool.length}</span>
      </div>
      <div class="question-text">${q.q}</div>
      <div class="options">${optsHTML}</div>
      ${expHTML}
    </div>`;

  // Dots
  document.getElementById('mcqDots').innerHTML = mcqPool.slice(0,Math.min(50,mcqPool.length)).map((c,i)=>{
    let cls = 'dot';
    if(i===mcqIdx) cls+=' current';
    else if(mcqAnswered[i]===c.ans) cls+=' correct';
    else if(mcqAnswered[i]!==null) cls+=' wrong';
    return `<div class="${cls}"></div>`;
  }).join('');
}

function answerMCQ(choice) {
  if(mcqAnswered[mcqIdx]!==null) return;
  mcqAnswered[mcqIdx] = choice;
  const q = mcqPool[mcqIdx];
  const correct = choice === q.ans;
  if(correct){ mcqScore.c++; session.mcqC++; rewardStudy(1); }
  else {
    mcqScore.w++; session.mcqW++;
    // Push wrong MCQ to cross-tab review queue
    reviewQueuePush({
      id:   'mcq_' + mcqIdx + '_' + Date.now(),
      type: 'mcq',
      q:    q.q,
      a:    q.opts[q.ans] + (q.exp ? '\n\n' + q.exp : ''),
      unit: q.unit || 'n5',
      diff: 'medium',
    });
  }
  updateStreak(correct);
  updateMCQStats();
  renderMCQ();
}
function nextMCQ() {
  if(!mcqPool.length) return;
  mcqIdx = (mcqIdx+1) % mcqPool.length;
  renderMCQ();
}

function shuffleMCQ() { initMCQ(); }

function updateMCQStats() {
  const total = mcqScore.c + mcqScore.w;
  document.getElementById('mcqCorrect').textContent = mcqScore.c;
  document.getElementById('mcqWrong').textContent = mcqScore.w;
  document.getElementById('mcqPct').textContent = total ? Math.round(mcqScore.c/total*100)+'%' : '—';
  document.getElementById('globalScore').textContent = `${mcqScore.c} / ${total || 0}`;
}

// ============================================================
// FRQ
// ============================================================
function initFRQ() {
  frqPool = shuffle(getFiltered(FRQ));
  frqIdx = 0;
  renderFRQ();
}

function renderFRQ() {
  if(!frqPool.length){
    document.getElementById('frqCardWrap').innerHTML='<div class="card"><p style="color:var(--muted);text-align:center;padding:20px">No FRQs for this filter.</p></div>';
    return;
  }
  const frq = frqPool[frqIdx];
  const partsHTML = frq.parts.map((p,i)=>`
    <div class="frq-part">
      <div class="frq-part-label">${p.label}</div>
      <div class="frq-part-q">${p.q}</div>
      <div class="frq-part-points">${p.points}</div>
      <textarea placeholder="Write your answer here..." rows="4" id="frqTA_${i}"></textarea>
      <div style="margin-top:8px">
        <button class="btn btn-secondary" style="font-size:12px;padding:7px 14px" onclick="revealFRQPart(${i})">Reveal Model Answer</button>
      </div>
      <div class="frq-model-answer" id="frqAns_${i}">
        <strong>Model Answer</strong>
        ${p.answer}
      </div>
    </div>`).join('');

  document.getElementById('frqCardWrap').innerHTML = `
    <div class="card active-card">
      <div class="q-meta">
        <span class="unit-tag">Unit ${frq.unit}</span>
        <span style="margin-left:auto;font-family:'Space Mono',monospace;font-size:11px;color:var(--muted)">${frqIdx+1} / ${frqPool.length}</span>
      </div>
      <div class="frq-prompt">${frq.title}</div>
      <div class="frq-sub">SCENARIO: ${frq.scenario}</div>
      ${partsHTML}
    </div>`;
  
  // Update progress indicator
  const progressLabel = document.getElementById('frqProgressLabel');
  const progressFill = document.getElementById('frqProgressFill');
  if (progressLabel) progressLabel.textContent = `FRQ ${frqIdx+1} / ${frqPool.length}`;
  if (progressFill) progressFill.style.width = (((frqIdx+1)/frqPool.length)*100) + '%';
}

function revealFRQPart(i) {
  document.getElementById(`frqAns_${i}`).classList.add('show');
}

function revealAllFRQ() {
  document.querySelectorAll('.frq-model-answer').forEach(el=>el.classList.add('show'));
}

function nextFRQ() {
  if(!frqPool.length) return;
  frqIdx = (frqIdx+1) % frqPool.length;
  renderFRQ();
}

function shuffleFRQ() { initFRQ(); }

// ============================================================
// STATS
// ============================================================
function updateStats() {
  document.getElementById('sTotalCorrect').textContent = session.mcqC;
  document.getElementById('sTotalWrong').textContent = session.mcqW;
  document.getElementById('sFlashKnow').textContent = session.fcKnow;
  document.getElementById('sFlashMiss').textContent = session.fcMiss;

  // Unit breakdown — using Japanese content tags
  const units = ['n5','n4','hiragana','katakana','ep1','ep2','ep3','custom'];
  const names = {
    n5: 'JLPT N5 Kanji', n4: 'JLPT N4 Kanji',
    hiragana: 'Hiragana', katakana: 'Katakana',
    ep1: 'Episode 1 Vocab', ep2: 'Episode 2 Vocab',
    ep3: 'Episode 3 Vocab', custom: 'Custom Set',
  };
  const html = units.map(u => {
    const uQ = APP_MCQ.filter(q => q.unit === u);
    const uF = (APP_FLASHCARDS || []).filter(f => f.unit === u);
    const answered = uQ.filter((_, i) => {
      const poolIdx = mcqPool.findIndex(q => q === uQ[i]);
      return poolIdx >= 0 && mcqAnswered[poolIdx] !== null;
    });
    return `<div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border)">
      <span class="unit-tag">${u.toUpperCase()}</span>
      <span style="font-size:13px;flex:1">${names[u] || u}</span>
      <span style="font-family:'Space Mono',monospace;font-size:12px;color:var(--muted)">${uQ.length} MCQ · ${uF.length} FC</span>
    </div>`;
  }).join('');
  document.getElementById('unitBreakdown').innerHTML = html;
}

function resetAll() {
  // Session stats only
  session = {fcKnow:0,fcMiss:0,mcqC:0,mcqW:0};
  initFlash(); initMCQ(); initCyc(); // initFRQ removed
  switchMode('flash');
}

function openResetModal() {
  document.getElementById('resetModal').classList.add('active');
}

function closeResetModal() {
  document.getElementById('resetModal').classList.remove('active');
}

function confirmResetAll() {
  // Clear ALL localStorage
  const keysToKeep = []; // keep nothing
  localStorage.clear();

  // Reset in-memory state
  sacramentCurrency = 0;
  gambleCurrency = 0;
  playerTitle = 'wanderer';
  inventory = [];
  ownedPacks = [];
  ownedCosmPacks = {};
  saveCosmPacks();
  vialCount = 0;
  saveVials();
  equippedColorSet = 'none';
  applyColorSet('none');
  localStorage.removeItem('ownedCosmPacks');
  localStorage.removeItem('vialCount');
  localStorage.removeItem('equippedColorSet');
  activePackIds = [];
  bjShards = 0;
  spinShards = 0;
  bjPassLevel = 0;
  spinPassUnlocked = false;
  mcqStreak = 0;
  equippedDialogue = 'default';
  equippedEffect = 'none';
  equippedThemeId = '';
  equippedVfx = 'none';
  equippedBg = 'none';
  applyBg('none');
  session = {fcKnow:0,fcMiss:0,mcqC:0,mcqW:0};
  widgetSlots = {};
  navbarSlots = Object.fromEntries(Array.from({length: NAV_SLOTS}, (_, i) => ['nav-' + i, null]));
  ownedWidgets = [];
  saveWidgetSlots();
  saveOwnedWidgets();

  // Remove visual effects
  stopRainEffect();
  stopMatrixEffect();
  stopStarEffect();
  clearInterval(window.sakuraInterval);
  document.querySelectorAll('.effect-void-particle').forEach(p => p.remove());
  document.body.className = '';

  updateCurrencies();
  initFlash(); initMCQ(); // initFRQ removed
  closeResetModal();
  renderInventory();
  switchMode('flash');
  rewardPopup('🔄 All progress reset');
}

function devUnlockAll() {
  // Give currencies
  sacramentCurrency += 500;
  gambleCurrency += 500;

  // Unlock all shop items
  shopPool.forEach(item => {
    if (!inventory.find(i => i.id === item.id)) {
      addToInventory({id: item.id, name: item.name, type: item.type, data: item.data || item.name});
    }
  });

  // Unlock all question packs
  QUESTION_PACKS.forEach(pack => {
    if (!ownedPacks.includes(pack.id)) {
      ownedPacks.push(pack.id);
    }
  });
  localStorage.setItem('ownedPacks', JSON.stringify(ownedPacks));

  // Max out passes and shards
  bjPassLevel = 2;
  spinPassUnlocked = true;
  bjShards = 60;
  spinShards = 25;
  localStorage.setItem('bjPassLevel', bjPassLevel);
  localStorage.setItem('spinPassUnlocked', 'true');
  localStorage.setItem('bjShards', bjShards);
  localStorage.setItem('spinShards', spinShards);

  // Unlock all cosmetic packs (give first item of each)
  COSMETIC_PACKS.forEach(pack => {
    if (!ownedCosmPacks[pack.id]) {
      ownedCosmPacks[pack.id] = { ownedItems: pack.items.map(i => i.id) };
    }
  });
  saveCosmPacks();
  // Give some vials
  vialCount += 3;
  saveVials();

  updateCurrencies();
  renderInventory();
  rewardPopup('🎁 Everything unlocked! +500 <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''> +500 💰');
}

// ============================================================
// INIT - called after all systems loaded (see bottom of script)
// ============================================================



// ============================================================
// GAMIFICATION SYSTEM
// ============================================================

// localStorage migration: old key was 'studyCurrency'
(function _migrateSacramentKey() {
  const old = localStorage.getItem('studyCurrency');
  if (old !== null && localStorage.getItem('sacramentCurrency') === null) {
    localStorage.setItem('sacramentCurrency', old);
    localStorage.removeItem('studyCurrency');
  }
})();
let sacramentCurrency = parseInt(localStorage.getItem('sacramentCurrency') || '0');
let gambleCurrency = parseInt(localStorage.getItem('gambleCurrency') || '0');
let bjShards = parseInt(localStorage.getItem('bjShards') || '0');
let spinShards = parseInt(localStorage.getItem('spinShards') || '0');
let playerTitle = localStorage.getItem('playerTitle') || 'wanderer';
let bjPassLevel = parseInt(localStorage.getItem('bjPassLevel') || '0');
let spinPassUnlocked = localStorage.getItem('spinPassUnlocked') === 'true';

const studyCoinsEl = document.getElementById('studyCoins');
const gambleCoinsEl = document.getElementById('gambleCoins');
const playerTitleEl = document.getElementById('playerTitle');

const slotIcons = ['☠️','🌙','🕯️','🦇','🎰','🃏'];

// ============================================================
// THEMED QUESTION PACKS — Japanese Language Learning
// Purchasable in Shop; each pack adds flashcards + MCQ.
// unit field uses tags: 'n5','n4','hiragana','katakana','ep1' etc.
// TODO: Expand each pack to 20+ flashcards and 20+ MCQ items
// ============================================================
const QUESTION_PACKS = [
  {
    id: 'naruto_jp',
    name: 'Naruto: Konoha Vocabulary',
    emoji: '🍥',
    cost: 80,
    desc: 'Learn Japanese words from the world of Naruto — jutsu names, village terminology, and everyday ninja phrases. Believe it!',
    flashcards: [
      { unit:'n5', diff:'easy', q:'忍者 (ninja)', a:'Reading: にんじゃ (ninja)\nMeaning: Ninja, a covert agent trained in Japanese martial arts\nEx: 彼は忍者だ。(He is a ninja.)' },
      { unit:'n5', diff:'easy', q:'火 (hi / ka)', a:'Reading: ひ (hi) / カ (ka)\nMeaning: Fire\nEx: 火の国 (hi no kuni) — Land of Fire' },
      { unit:'n5', diff:'medium', q:'風 (kaze)', a:'Reading: かぜ (kaze) / フウ (fuu)\nMeaning: Wind\nEx: 風の国 (kaze no kuni) — Land of Wind (Sunagakure)' },
      { unit:'n5', diff:'easy', q:'水 (mizu)', a:'Reading: みず (mizu) / スイ (sui)\nMeaning: Water\nEx: 水の国 (mizu no kuni) — Land of Water (Kirigakure)' },
      { unit:'n5', diff:'medium', q:'力 (chikara)', a:'Reading: ちから (chikara) / リョク (ryoku)\nMeaning: Power, strength\nEx: 力を信じる (chikara o shinjiru) — to believe in one\'s power' },
      { unit:'n5', diff:'easy', q:'仲間 (nakama)', a:'Reading: なかま (nakama)\nMeaning: Comrade, companion, teammate\nEx: 仲間を守る (nakama o mamoru) — to protect one\'s companions' },
      // TODO: Add more Naruto-themed vocab (20+ cards)
    ],
    mcq: [
      { unit:'n5', diff:'easy', q:'What does 火 mean in "火の国" (Land of Fire)?', opts:['Water','Fire','Wind','Earth'], ans:1, exp:'火 (hi/ka) means fire. 火の国 (hi no kuni) = Land of Fire, home of the Hidden Leaf Village (木の葉隠れの里).' },
      { unit:'n5', diff:'easy', q:'How do you read 忍者?', opts:['かぜ','にんじゃ','みず','ちから'], ans:1, exp:'忍者 is read にんじゃ (ninja). 忍 (nin) = endure/conceal, 者 (ja/sha) = person.' },
      { unit:'n5', diff:'medium', q:'Which kanji means "companion / teammate" (as Naruto uses constantly)?', opts:['力','火','仲間','水'], ans:2, exp:'仲間 (nakama) means companion or teammate. Naruto\'s bonds with his nakama (仲間) are a core theme of the series.' },
      // TODO: Add more MCQ
    ]
  },
  {
    id: 'demonslayer_jp',
    name: 'Demon Slayer: Taisho Japanese',
    emoji: '🌊',
    cost: 80,
    desc: 'Vocabulary from Taisho-era Japan — the historical setting of Demon Slayer. Breathing, seasons, nature, and traditional terms.',
    flashcards: [
      { unit:'n5', diff:'easy', q:'鬼 (oni)', a:'Reading: おに (oni) / キ (ki)\nMeaning: Demon, ogre\nEx: 鬼滅の刃 (kimetsu no yaiba) — Demon Slayer (lit. blade of demon destruction)' },
      { unit:'n5', diff:'easy', q:'剣 (ken / tsurugi)', a:'Reading: けん (ken) / つるぎ (tsurugi)\nMeaning: Sword, blade\nEx: 日輪刀 (nichirin-tō) — sun-wheel blade' },
      { unit:'n5', diff:'medium', q:'呼吸 (kokyuu)', a:'Reading: こきゅう (kokyuu)\nMeaning: Breathing, respiration\nEx: 水の呼吸 (mizu no kokyuu) — Water Breathing (breathing style)' },
      { unit:'n5', diff:'easy', q:'家族 (kazoku)', a:'Reading: かぞく (kazoku)\nMeaning: Family\nEx: 家族を守る (kazoku o mamoru) — to protect one\'s family' },
      { unit:'n4', diff:'medium', q:'炎 (honoo / en)', a:'Reading: ほのお (honoo) / エン (en)\nMeaning: Flame, blaze\nEx: 炎の呼吸 (honoo no kokyuu) — Flame Breathing (Rengoku\'s style)' },
      // TODO: Add more Demon Slayer-themed vocab (20+ cards)
    ],
    mcq: [
      { unit:'n5', diff:'easy', q:'How do you read 鬼 (demon)?', opts:['かぜ','おに','みず','けん'], ans:1, exp:'鬼 is read おに (oni), meaning demon or ogre. The on-reading is キ (ki), used in compound words.' },
      { unit:'n5', diff:'easy', q:'What does 家族 (kazoku) mean?', opts:['Sword','Demon','Family','Breathing'], ans:2, exp:'家族 (かぞく, kazoku) means family. 家 (ie/ka) = house, 族 (zoku) = clan/group.' },
      { unit:'n5', diff:'medium', q:'Which word means "breathing" in the context of breathing styles?', opts:['家族','剣','呼吸','炎'], ans:2, exp:'呼吸 (こきゅう, kokyuu) means breathing or respiration. In Demon Slayer, breathing techniques (呼吸) are the foundation of combat.' },
      // TODO: Add more MCQ
    ]
  },
  {
    id: 'aot_jp',
    name: 'Attack on Titan: Survey Corps Japanese',
    emoji: '🗡️',
    cost: 80,
    desc: 'Military and historical vocabulary inspired by Attack on Titan — walls, freedom, titans, and the words of the Survey Corps.',
    flashcards: [
      { unit:'n5', diff:'easy', q:'壁 (kabe / heki)', a:'Reading: かべ (kabe) / ヘキ (heki)\nMeaning: Wall, barrier\nEx: 壁の外 (kabe no soto) — outside the walls' },
      { unit:'n5', diff:'easy', q:'自由 (jiyuu)', a:'Reading: じゆう (jiyuu)\nMeaning: Freedom, liberty\nEx: 自由のために (jiyuu no tame ni) — for the sake of freedom' },
      { unit:'n5', diff:'medium', q:'調査 (chousa)', a:'Reading: ちょうさ (chousa)\nMeaning: Investigation, survey\nEx: 調査兵団 (chousa hei-dan) — Survey Corps (lit. investigation soldier group)' },
      { unit:'n5', diff:'easy', q:'世界 (sekai)', a:'Reading: せかい (sekai)\nMeaning: World\nEx: この世界の外 (kono sekai no soto) — outside this world' },
      { unit:'n5', diff:'medium', q:'巨人 (kyojin)', a:'Reading: きょじん (kyojin)\nMeaning: Giant, titan\nEx: 進撃の巨人 (shingeki no kyojin) — Attack on Titan (lit. advancing giant)' },
      // TODO: Add more AoT-themed vocab (20+ cards)
    ],
    mcq: [
      { unit:'n5', diff:'easy', q:'What does 自由 (jiyuu) mean?', opts:['Wall','Titan','Freedom','Survey'], ans:2, exp:'自由 (じゆう, jiyuu) = freedom. 自 = self, 由 = reason/cause — "by one\'s own cause" = freedom. A major theme in AoT.' },
      { unit:'n5', diff:'easy', q:'How do you read 壁 (wall)?', opts:['じゆう','きょじん','かべ','せかい'], ans:2, exp:'壁 reads かべ (kabe) as the kun-reading (wall). The on-reading ヘキ is used in compound words. The three walls are 壁マリア, 壁ローゼ, 壁シーナ.' },
      { unit:'n5', diff:'medium', q:'調査兵団 (Survey Corps) contains which kanji meaning "investigate"?', opts:['壁','自由','巨人','調査'], ans:3, exp:'調査 (ちょうさ, chousa) means investigation or survey. 兵団 (hei-dan) = military corps. Together: 調査兵団 = Survey Corps, the soldiers who venture beyond the walls.' },
      // TODO: Add more MCQ
    ]
  },
];

// Track owned packs
let ownedPacks = JSON.parse(localStorage.getItem('ownedPacks') || '[]');
let activePackIds = JSON.parse(localStorage.getItem('activePackIds') || '[]');

function getActivePackQuestions(type) {
  let extras = [];
  activePackIds.forEach(id => {
    const pack = QUESTION_PACKS.find(p => p.id === id);
    if (pack && pack[type]) extras = extras.concat(pack[type]);
  });
  return extras;
}

// ============================================================
// DIALOGUE PACKS
// ============================================================
const DIALOGUE_PACKS = {
  default: {
    name: 'Default (Noir)',
    correct: ["Correct.", "You recognized the pattern.", "Memory reinforced.", "Good read."],
    wrong: ["Review the explanation.", "This concept links to another unit.", "Mistakes build recall.", "Look for the underlying process."],
    idle: ["Focus mode engaged.", "Read slowly. Retention matters.", "One question at a time.", "Patterns repeat across units."]
  },
  tsundere: {
    name: 'Tsundere',
    correct: ["Hmph!~ It's not like I'm proud of you or anything!", "W-whatever, you just got lucky!", "...Fine. That was acceptable. Don't get used to it.", "I-it's not like that was impressive or anything! Baka!"],
    wrong: ["Hah! I knew you'd mess that up! Study harder, dummy.", "...You really are hopeless, aren't you. (but I'll help you)", "Wrong! How can you not know this?! Ugh. Just - read the explanation.", "Did I not basically tell you that?! Pay attention next time!"],
    idle: ["I'm not watching you study because I care, got it?!", "...You should probably do a flashcard. Not that I care.", "Hmph. Still here? Fine. Keep going.", "D-don't slack off just because no one's watching you."]
  },
  kuudere: {
    name: 'Kuudere',
    correct: ["...Correct.", "As expected.", "Satisfactory result.", "...Good."],
    wrong: ["Incorrect. Review the material.", "...That was wrong.", "Error detected. Recalibrate.", "Suboptimal performance. Adjust."],
    idle: ["...", "...Study.", "...Continue.", "...The exam approaches."]
  },
  genki: {
    name: 'Genki ✨',
    correct: ["YESSS!! You got it!!! ★★★", "AMAZING!! You're so smart!!! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧", "WAHOOOO correct answer!!! Keep going keep going!!", "OMG OMG OMG you actually knew that!!! I'm so proud!!!"],
    wrong: ["Awww nooo!! Don't worry you'll get it next time!!! (；´Д｀)", "Noooo!!! But that's okay!! Mistakes make us stronger!!! ✨", "Oh no oh no!! But the explanation will help, I believe in you!!!", "It's okay!! Even the best ninjas miss sometimes!! Keep going!!!"],
    idle: ["Hiii!!! Let's study together!!!", "You can do it!!! The exam is gonna be so fun!!! ★", "Let's GOOO!! One more card!!!", "I'm rooting for you!!! (ﾉ◕ヮ◕)ﾉ"]
  },
  chuunibyou: {
    name: 'Chuunibyou 🌑',
    correct: ["My Dark Seal of Knowledge has accepted your offering...", "Kukukuku... the Ancient Wisdom flows through you now.", "Your mind has pierced the veil of the ordinary... as expected.", "The forbidden AP knowledge resonates with your chakra..."],
    wrong: ["Fool! Your power level is insufficient for this knowledge!", "The Dark Grimoire of Unit 7 rejects your feeble answer!", "...The shadows weep for your mistake. Study. The exam is nigh.", "Your latent potential has yet to awaken. Read. The. Explanation."],
    idle: ["My left eye... it throbs with forbidden AP knowledge...", "The exam draws near. My seals of power grow stronger with each card.", "...Tch. Ordinary humans cannot comprehend these ecosystem dynamics.", "The Dark Alliance of Environmental Science watches you always..."]
  }
};

let equippedDialogue = localStorage.getItem('equippedDialogue') || 'default';
let equippedEffect = localStorage.getItem('equippedEffect') || 'none';
let equippedVfx = localStorage.getItem('equippedVfx') || 'none';
let equippedBg            = localStorage.getItem('equippedBg') || 'none';
let equippedCursor        = localStorage.getItem('equippedCursor') || 'none';
let equippedCursorVariant = parseInt(localStorage.getItem('equippedCursorVariant') || '0');
let cursorVariantChoice   = (() => {
  try { return JSON.parse(localStorage.getItem('cursorVariantChoice') || '{}'); } catch(_) { return {}; }
})();

function getDialogue(type) {
  const pack = DIALOGUE_PACKS[equippedDialogue] || DIALOGUE_PACKS.default;
  const arr = pack[type];
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================================
// WIDGET CATALOG - widgets have a fixed required span (rows)
// ============================================================
const WIDGET_CATALOG = [
  // ── Real widget ──
  {
    id: 'widget_beato',
    name: 'Beato Bounce',
    rarity: 'rare',
    type: 'widget',
    span: 1,                // 1×1
    imgUrl: 'https://raw.githubusercontent.com/Rollan000/neuroverse/main/beato_bounce.gif',
    desc: 'A bouncy companion for your side slots.',
    cardNum: '#001',
  },
  {
    id: 'widget_beato_large',
    name: 'Beato Bounce XL',
    rarity: 'epic',
    type: 'widget',
    span: 2,                // 2 rows tall
    cols: 2,                // 2 columns wide → 2×2
    imgUrl: 'https://raw.githubusercontent.com/Rollan000/neuroverse/main/beato_bounce.gif',
    desc: 'A bigger bouncy Beato.',
    cardNum: '#001B',
  },
  // ── Placeholder widgets for testing ──
  {
    id: 'widget_placeholder_1x1',
    name: 'Micro Sprite',
    rarity: 'common',
    type: 'widget',
    span: 1,
    imgUrl: 'https://placehold.co/160x160/101014/b8c6ff?text=1×1',
    desc: 'A tiny 1-row widget.',
    cardNum: '#002',
  },
  {
    id: 'widget_placeholder_1x2',
    name: 'Tall Companion',
    rarity: 'common',
    type: 'widget',
    span: 2,
    imgUrl: 'https://placehold.co/160x320/101014/9a7cff?text=1×2',
    desc: 'A medium 2-row widget.',
    cardNum: '#003',
  },
  {
    id: 'widget_placeholder_1x3',
    name: 'Grand Banner',
    rarity: 'rare',
    type: 'widget',
    span: 3,
    imgUrl: 'https://placehold.co/160x480/101014/6d78ff?text=1×3',
    desc: 'A tall 3-row widget.',
    cardNum: '#004',
  },
  {
    id: 'widget_placeholder_1x4',
    name: 'Tower Widget',
    rarity: 'epic',
    type: 'widget',
    span: 4,
    imgUrl: 'https://placehold.co/160x640/101014/ffd32a?text=1×4',
    desc: 'A massive 4-row widget.',
    cardNum: '#005',
  },
  // ── Interactive widgets - AUCTION EXCLUSIVE (not in pack rolls) ──
  // sizes[] = array of {label, span, cols} - user picks at placement time
  {
    id: 'widget_slayr',
    name: 'Slayr',
    rarity: 'rare',
    type: 'widget',
    span: 1,
    cols: 1,
    imgUrl: 'https://raw.githubusercontent.com/Rollan000/neuroverse/main/slayr_widget.png',
    desc: 'Click to vibe. Sloppy Joe goes hard.',
    cardNum: '#006',
    interactive: 'slayr',
    auctionOnly: true,
    sizes: [
      { label: '1×1', span: 1, cols: 1 },
      { label: '2×2', span: 2, cols: 2 },
    ],
  },
  {
    id: 'widget_grok',
    name: 'Grok',
    rarity: 'epic',
    type: 'widget',
    span: 2,
    cols: 1,
    imgUrl: 'https://raw.githubusercontent.com/Rollan000/neuroverse/main/grok_image.png',
    desc: 'Shrouded in mystery. Type "choke" to reveal.',
    cardNum: '#007',
    interactive: 'grok',
    auctionOnly: true,
    sizes: [
      { label: '1×2', span: 2, cols: 1 },
      { label: '2×4', span: 4, cols: 2 },
    ],
  },
  {
    id: 'widget_nazuna',
    name: 'Nazuna Clicker',
    rarity: 'legendary',
    type: 'widget',
    span: 2,
    cols: 2,
    imgUrl: 'https://raw.githubusercontent.com/Rollan000/neuroverse/main/nazuna_gaming.png',
    desc: 'Mini cookie clicker. Buy auto-clickers and nazuna backgrounds.',
    cardNum: '#008',
    interactive: 'nazuna',
    auctionOnly: true,
    sizes: [
      { label: '2×2', span: 2, cols: 2 },
      { label: '2×4', span: 4, cols: 2 },
    ],
  },
];

// ============================================================
// WIDGET SLOT SYSTEM - 8-row grid, fixed widget sizes
// ============================================================
// widgetSlots: { 'left-3': { widgetId, span }, ... }
// key = side-startRow, span = widget's required row count
// Empty slots are NOT shown on screen (only filled widgets render)
// Grid editor lives in Bag → Widgets tab

const GRID_ROWS = 8; // total slots per side (displayed as 2 cols × 4 rows)
const GRID_COLS = 2; // 2 columns per side

let widgetSlots = (() => {
  try {
    const raw = JSON.parse(localStorage.getItem('widgetSlots') || '{}');
    const migrated = {};
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === 'string') {
        const w = WIDGET_CATALOG.find(x => x.id === v);
        migrated[k] = { widgetId: v, span: w ? w.span : 1 };
      } else if (v && typeof v === 'object' && v.widgetId) {
        migrated[k] = v;
      }
    }
    return migrated;
  } catch(e) { return {}; }
})();

let ownedWidgets = JSON.parse(localStorage.getItem('ownedWidgets') || '[]');

// Pending placement state
let pendingWidgetId = null;   // widget being placed
let pendingSlotSide = null;   // 'left' | 'right'
let pendingSlotRow  = null;   // 0-indexed start row

function saveWidgetSlots() { localStorage.setItem('widgetSlots', JSON.stringify(widgetSlots)); }
function saveOwnedWidgets() { localStorage.setItem('ownedWidgets', JSON.stringify(ownedWidgets)); }

// ============================================================
// NAVBAR WIDGET STRIP — 3 horizontal slots between sidebar and content
// ============================================================
const NAV_SLOTS = 3;

let navbarSlots = (() => {
  try {
    const raw = JSON.parse(localStorage.getItem('navbarSlots') || '{}');
    const out = {};
    for (let i = 0; i < NAV_SLOTS; i++) out['nav-' + i] = raw['nav-' + i] || null;
    return out;
  } catch(e) {
    const out = {};
    for (let i = 0; i < NAV_SLOTS; i++) out['nav-' + i] = null;
    return out;
  }
})();

function saveNavbarSlots() { localStorage.setItem('navbarSlots', JSON.stringify(navbarSlots)); }

function renderNavbarSlots() {
  const strip = document.getElementById('navbarWidgetStrip');
  if (!strip) return;
  strip.innerHTML = '';
  for (let i = 0; i < NAV_SLOTS; i++) {
    const key = 'nav-' + i;
    const widgetId = navbarSlots[key];
    const el = document.createElement('div');
    el.className = 'nav-widget-slot' + (widgetId ? ' filled' : ' empty');
    el.id = 'nav-wslot-' + i;
    if (widgetId) {
      const w = WIDGET_CATALOG.find(x => x.id === widgetId);
      if (w) {
        if (w.interactive) {
          el.innerHTML = buildInteractiveWidgetHTML(w, key, 1, 1) +
            `<button class="widget-slot-remove" onclick="event.stopPropagation();removeNavbarSlot(${i})" title="Remove">x</button>`;
          setTimeout(() => initInteractiveWidget(w, key, 1, 1), 0);
        } else {
          el.innerHTML = `<img src="${w.imgUrl}" alt="${w.name}" draggable="false">
            <button class="widget-slot-remove" onclick="event.stopPropagation();removeNavbarSlot(${i})" title="Remove">x</button>
            <div class="widget-slot-name">${w.name}</div>`;
        }
      } else {
        navbarSlots[key] = null; saveNavbarSlots();
        el.innerHTML = `<span class="nav-slot-placeholder">${i + 1}</span>`;
        el.className = 'nav-widget-slot empty';
      }
    } else {
      el.innerHTML = `<span class="nav-slot-placeholder">${i + 1}</span>`;
    }
    strip.appendChild(el);
  }
  const bagWidgets = document.getElementById('bagPanelWidgets');
  if (bagWidgets && !bagWidgets.classList.contains('hidden')) renderBagWidgetsPanel();
}

function removeNavbarSlot(idx) {
  navbarSlots['nav-' + idx] = null;
  saveNavbarSlots();
  renderNavbarSlots();
}

function placeNavbarWidget(idx) {
  if (!bagSelectedWidgetId) { rewardPopup('Select a widget first!'); return; }
  const w = WIDGET_CATALOG.find(x => x.id === bagSelectedWidgetId);
  if (!w) return;
  const chosenSize = w.sizes ? w.sizes[bagSelectedSizeIdx || 0] : null;
  const span = chosenSize ? chosenSize.span : w.span;
  if (span > 1) { rewardPopup('Only 1-row widgets fit in sidebar slots!'); return; }
  for (let i = 0; i < NAV_SLOTS; i++) {
    if (navbarSlots['nav-' + i] === bagSelectedWidgetId) { rewardPopup('Already in the sidebar!'); return; }
  }
  if (navbarSlots['nav-' + idx]) { rewardPopup('That slot is occupied!'); return; }
  navbarSlots['nav-' + idx] = bagSelectedWidgetId;
  saveNavbarSlots();
  renderNavbarSlots();
  clearGridSelection();
  renderBagWidgetsPanel();
  rewardPopup('Widget added to sidebar!');
}


// Returns Set of occupied row indices for a side
function occupiedRows(side) {
  const s = new Set();
  for (const [key, entry] of Object.entries(widgetSlots)) {
    const [ks, kr] = key.split('-');
    if (ks !== side) continue;
    const start = parseInt(kr), span = entry.span || 1;
    for (let r = start; r < start + span; r++) s.add(r);
  }
  return s;
}

// Returns true if `span` rows starting at `startRow` on `side` are free (excluding excludeKey)
function canFitAt(side, startRow, span, excludeKey = null) {
  if (startRow < 0 || startRow + span > GRID_ROWS) return false;
  // Build set of rows the new widget would occupy (including mirror col for 2-col widgets)
  // We check against existing entries
  for (const [key, entry] of Object.entries(widgetSlots)) {
    if (key === excludeKey) continue;
    const [ks, kr] = key.split('-');
    if (ks !== side) continue;
    const takenStart = parseInt(kr), takenSpan = entry.span || 1, takenCols = entry.cols || 1;
    // Build set of rows this existing entry occupies
    const takenRows = new Set();
    for (let r = takenStart; r < takenStart + takenSpan; r++) {
      takenRows.add(r);
      if (takenCols > 1) takenRows.add(r + 4); // mirror col B
    }
    // Build set of rows the new widget would occupy
    const newRows = new Set();
    for (let r = startRow; r < startRow + span; r++) {
      newRows.add(r);
      // If the new widget is 2-col, check its mirror too - but we don't know cols here,
      // so caller must pass it. For now check overlap on the rows we have.
    }
    for (const r of newRows) {
      if (takenRows.has(r)) return false;
    }
  }
  return true;
}

// cols-aware version used by 2-col placement
function canFitAtWithCols(side, startRow, span, cols, excludeKey = null) {
  if (startRow < 0 || startRow + span > 4) return false; // 2-col widgets can only start in rows 0-3
  for (const [key, entry] of Object.entries(widgetSlots)) {
    if (key === excludeKey) continue;
    const [ks, kr] = key.split('-');
    if (ks !== side) continue;
    const takenStart = parseInt(kr), takenSpan = entry.span || 1, takenCols = entry.cols || 1;
    const takenRows = new Set();
    for (let r = takenStart; r < takenStart + takenSpan; r++) {
      takenRows.add(r);
      if (takenCols > 1) takenRows.add(r + 4);
    }
    const newRows = new Set();
    for (let r = startRow; r < startRow + span; r++) {
      newRows.add(r);
      if (cols > 1) newRows.add(r + 4);
    }
    for (const r of newRows) {
      if (takenRows.has(r)) return false;
    }
  }
  return true;
}

// ── Render filled widgets in the fixed side columns ──
function renderWidgetSlots() {
  ['left','right'].forEach(side => {
    const col = document.getElementById(`widgetCol${side === 'left' ? 'Left' : 'Right'}`);
    if (!col) return;
    col.innerHTML = '';
    for (const [key, entry] of Object.entries(widgetSlots)) {
      const [ks, kr] = key.split('-');
      if (ks !== side) continue;
      const w = WIDGET_CATALOG.find(x => x.id === entry.widgetId);
      if (!w) continue;
      const span  = entry.span  || w.span  || 1;
      // wcols stored per-slot (chosen at placement), fall back to widget default
      const wcols = entry.cols  || w.cols  || 1;
      const startRow = parseInt(kr);

      const el = document.createElement('div');
      el.className = 'widget-slot';
      el.id = `wslot-${key}`;

      // For multi-col widgets: span both columns, map row the same way as single-col
      if (wcols > 1) {
        const gridRow = (startRow % 4) + 1;
        el.style.gridColumn = `1 / span ${wcols}`;
        el.style.gridRow    = `${gridRow} / span ${span}`;
      } else {
        // Single-col: map rows 0-3 → grid-col 1, rows 4-7 → grid-col 2
        const gridCol = startRow < 4 ? 1 : 2;
        const gridRow = (startRow % 4) + 1;
        el.style.gridColumn = String(gridCol);
        el.style.gridRow    = `${gridRow} / span ${span}`;
      }

      if (w.interactive) {
        el.innerHTML = buildInteractiveWidgetHTML(w, key, span, wcols);
      } else {
        el.innerHTML = `
          <img src="${w.imgUrl}" alt="${w.name}" draggable="false">
          <button class="widget-slot-remove" onclick="event.stopPropagation();removeWidgetSlot('${key}')" title="Remove">✕</button>
          <div class="widget-slot-name">${w.name}</div>`;
      }
      col.appendChild(el);
      if (w.interactive) setTimeout(() => initInteractiveWidget(w, key, span, wcols), 0);
    }
  });
  // Also re-render the bag grid if visible
  if (document.getElementById('bagPanelWidgets') && !document.getElementById('bagPanelWidgets').classList.contains('hidden')) {
    renderBagWidgetsPanel();
  }
}

function removeWidgetSlot(key) {
  delete widgetSlots[key];
  saveWidgetSlots();
  renderWidgetSlots();
}

function addWidgetToInventory(widgetId) {
  if (!ownedWidgets.includes(widgetId)) {
    ownedWidgets.push(widgetId);
    saveOwnedWidgets();
  }
}

// ── Confirm modal (shown after clicking a valid spot in the grid editor) ──
function openWidgetPlaceModal(widgetId) {
  // Called from widget card click - go to Bag > Widgets to place
  // Just switch to bag widgets tab as a shortcut
  switchMode('inventory', null);
  setTimeout(() => setBagTab('widgets', document.querySelector('.bag-tab[onclick*="widgets"]')), 80);
  setTimeout(() => { selectWidgetInPicker(widgetId); }, 160);
}

function showWidgetConfirmModal(widgetId, side, startRow, span) {
  // Redirected to inline confirm bar system
  bagSelectedWidgetId = widgetId;
  gridSelectedSide = side;
  gridSelectedRow  = startRow;
  const w = WIDGET_CATALOG.find(x => x.id === widgetId);
  if (w) { highlightGridSelection(side, startRow, span); showGridConfirmBar(side, startRow, span, w.name); }
}

function confirmWidgetPlace() { confirmGridPlace(); }

function closeWidgetPlaceModal() {
  clearGridSelection();
  document.getElementById('widgetPlaceModal').classList.remove('active');
}

// ──────────────────────────────────────────────────────────────
// BAG WIDGETS PANEL - in-bag grid editor
// ──────────────────────────────────────────────────────────────
let bagSelectedWidgetId = null; // which widget is selected in the picker
let bagSelectedSizeIdx  = null; // which size option chosen (for multi-size widgets)
let pendingCells = []; // array of {side, row} for individually clicked cells

function selectWidgetInPicker(widgetId) {
  bagSelectedWidgetId = widgetId;
  bagSelectedSizeIdx  = 0; // default to first size option
  pendingCells = [];
  clearGridSelection();
  renderBagWidgetsPanel();
}

function selectWidgetSize(idx) {
  bagSelectedSizeIdx = idx;
  pendingCells = [];
  clearGridSelection();
  renderBagWidgetsPanel();
}

function renderBagWidgetsPanel() {
  const container = document.getElementById('widgetCardsContainer');
  if (!container) return;

  if (ownedWidgets.length === 0) {
    container.innerHTML = `
      <div style="padding:20px 0;text-align:center">
        <div style="font-size:32px;margin-bottom:10px">🎴</div>
        <p style="color:var(--muted);font-size:13px;line-height:1.6">No widgets yet.<br>Open Mystery Packs to collect some!</p>
      </div>`;
    return;
  }

  const selectedWidget = bagSelectedWidgetId ? WIDGET_CATALOG.find(x => x.id === bagSelectedWidgetId) : null;

  // ── Widget picker list ──
  const chosenSize = selectedWidget && selectedWidget.sizes ? selectedWidget.sizes[bagSelectedSizeIdx || 0] : null;
  const effectiveSpan = chosenSize ? chosenSize.span : (selectedWidget ? selectedWidget.span : 1);

  const pickerHTML = `
    <div class="wg-picker">
      <div class="wg-picker-label">Your Widgets</div>
      ${ownedWidgets.map(id => {
        const w = WIDGET_CATALOG.find(x => x.id === id);
        if (!w) return '';
        const placed = Object.values(widgetSlots).some(e => e.widgetId === id);
        const isSelected = bagSelectedWidgetId === id;
        const sizeLabel = w.sizes ? w.sizes.map((s,i) =>
          `<span class="wg-size-pill ${isSelected && (bagSelectedSizeIdx||0)===i ? 'active' : ''}" onclick="event.stopPropagation();selectWidgetSize(${i})">${s.label}</span>`
        ).join('') : `${w.cols||1}×${w.span}`;
        return `<div class="wg-picker-item ${isSelected ? 'selected' : ''} ${placed ? 'placed' : ''}"
          onclick="${placed ? '' : `selectWidgetInPicker('${id}')`}">
          <div class="wg-picker-thumb"><img src="${w.imgUrl}" alt="${w.name}"></div>
          <div class="wg-picker-info">
            <div class="wg-picker-name">${w.name}</div>
            <div class="wg-picker-meta">${w.rarity} ${placed ? '· placed ✓' : ''}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:3px;align-items:flex-end">${sizeLabel}</div>
        </div>`;
      }).join('')}
    </div>`;

  // ── Instruction banner ──
  const chosenCols = chosenSize ? chosenSize.cols : (selectedWidget ? selectedWidget.cols || 1 : 1);
  const instructionHTML = selectedWidget
    ? `<div class="wg-instruction show">
        ${chosenCols > 1
          ? `Click any cell to place <strong>${selectedWidget.name}</strong> (${chosenSize ? chosenSize.label : `${chosenCols}×${effectiveSpan}`}) - fills both columns A+B for ${effectiveSpan} row${effectiveSpan>1?'s':''}.`
          : `Click <strong>${effectiveSpan}</strong> cell${effectiveSpan>1?'s':''} to place <strong>${selectedWidget.name}</strong> (${chosenSize ? chosenSize.label : `${chosenCols}×${effectiveSpan}`}). Cells turn 🔴 red → go 🟢 green when correct.`
        }
       </div>`
    : `<div class="wg-instruction show" style="background:rgba(184,198,255,0.04);border-color:rgba(184,198,255,0.12);color:var(--muted)">
        ← Select a widget to place it on the grid.
       </div>`;

  // ── Grid columns ──
  function buildGridCol(side) {
    const rowMap = {};
    for (const [key, entry] of Object.entries(widgetSlots)) {
      const [ks, kr] = key.split('-');
      if (ks !== side) continue;
      const start = parseInt(kr);
      const span  = entry.span || 1;
      rowMap[start] = { entry, span, key, isFirst: true };
      for (let r = start + 1; r < start + span; r++) rowMap[r] = { entry, span, key, isFirst: false, firstRow: start };
    }

    // 2-col × 4-row: col 1 = rows 0-3, col 2 = rows 4-7
    // CSS grid-column: row 0-3 → col 1, row 4-7 → col 2
    // CSS grid-row:    row % 4 + 1
    const cells = Array.from({ length: GRID_ROWS }, (_, row) => {
      const occ = rowMap[row];
      const colNum = row < 4 ? 1 : 2;
      const rowNum = (row % 4) + 1;
      const label  = (row < 4 ? 'A' : 'B') + rowNum;
      const gridPos = `grid-column:${colNum};grid-row:${rowNum}`;

      if (occ) {
        // Non-first cells are visually covered by the spanning first cell - skip rendering
        if (!occ.isFirst) return '';
        const w = WIDGET_CATALOG.find(x => x.id === occ.entry.widgetId);
        return `<div class="wgcell occupied" data-side="${side}" data-row="${row}"
          style="grid-column:${colNum};grid-row:${rowNum}/span ${occ.span}"
          title="${w ? w.name : ''}">
          <div class="wgcell-tag">
            <span class="wgcell-tag-name">${w ? w.name.substring(0,10) : ''}</span>
            <span class="wgcell-tag-size">${occ.span}×1</span>
          </div>
          <span class="wgcell-remove" onclick="event.stopPropagation();removeWidgetSlot('${occ.key}')">✕</span>
        </div>`;
      }
      return `<div class="wgcell" data-side="${side}" data-row="${row}"
        style="${gridPos}"
        onclick="onGridCellClick('${side}',${row})">
        <span>${label}</span>
      </div>`;
    }).join('');

    const sideLabel = side === 'left' ? '◀ Left' : 'Right ▶';
    return `<div class="wgrid-col">
      <div class="wgrid-col-label">${sideLabel} <span style="font-size:8px;opacity:0.5">A=top · B=bottom</span></div>
      <div class="wgrid-cells" id="wgcells-${side}">${cells}</div>
    </div>`;
  }

  const gridHTML = `
    <div class="wgrid-editor">
      ${buildGridCol('left')}
      ${buildGridCol('right')}
    </div>`;

  // Navbar strip editor
  const navCells = Array.from({ length: NAV_SLOTS }, (_, i) => {
    const wid = navbarSlots['nav-' + i];
    if (wid) {
      const ww = WIDGET_CATALOG.find(x => x.id === wid);
      return `<div class="wgcell occupied nav-cell" data-nav="${i}" title="${ww ? ww.name : ''}">`
        + `<div class="wgcell-tag"><span class="wgcell-tag-name">${ww ? ww.name.substring(0,12) : ''}</span></div>`
        + `<span class="wgcell-remove" onclick="event.stopPropagation();removeNavbarSlot(${i})">x</span></div>`;
    }
    const canPlace = (() => {
      if (!bagSelectedWidgetId) return false;
      const ww2 = WIDGET_CATALOG.find(x => x.id === bagSelectedWidgetId);
      const ss = ww2 && ww2.sizes ? ww2.sizes[bagSelectedSizeIdx || 0] : null;
      return (ss ? ss.span : (ww2 ? ww2.span : 1)) === 1;
    })();
    return `<div class="wgcell nav-cell${canPlace ? '' : ' disabled-nav'}" data-nav="${i}"`
      + ` onclick="${canPlace ? `placeNavbarWidget(${i})` : ''}">`
      + `<span>Nav ${i + 1}</span></div>`;
  }).join('');

  const tooTall = selectedWidget && (() => {
    const ss2 = selectedWidget.sizes ? selectedWidget.sizes[bagSelectedSizeIdx || 0] : null;
    return (ss2 ? ss2.span : selectedWidget.span) > 1;
  })();

  const navEditorHTML = `
    <div class="wgrid-nav-editor">
      <div class="wgrid-col-label" style="margin-bottom:8px">
        Sidebar Slots <span style="font-size:8px;opacity:0.5">(1-row widgets only &middot; 3 slots)</span>
      </div>
      <div class="wgrid-nav-cells">${navCells}</div>
      ${tooTall ? `<div style="font-size:11px;color:var(--muted);margin-top:6px;opacity:0.7">Widget too tall for sidebar slots</div>` : ''}
    </div>`;

  container.innerHTML = `
    <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:flex-start">
      ${pickerHTML}
      <div style="flex:1;min-width:260px">
        ${instructionHTML}
        ${gridHTML}
        ${navEditorHTML}
      </div>
    </div>`;
}

// ── Grid cell click: individual cell toggle, red until correct count, green when valid ──
let gridSelectedSide = null;
let gridSelectedRow  = null;

function onGridCellClick(side, row) {
  if (!bagSelectedWidgetId) {
    rewardPopup('Select a widget first!');
    return;
  }
  const w = WIDGET_CATALOG.find(x => x.id === bagSelectedWidgetId);
  if (!w) return;

  // Use chosen size span
  const chosenSize = w.sizes ? w.sizes[bagSelectedSizeIdx || 0] : null;
  const neededSpan = chosenSize ? chosenSize.span : w.span;
  const neededCols = chosenSize ? chosenSize.cols : (w.cols || 1);

  // For 2-col widgets: clicking any cell in col A or B should auto-pair both columns
  // A = rows 0-3, B = rows 4-7; pair: rowInCol = row % 4, so A-pair = rowInCol, B-pair = rowInCol + 4
  if (neededCols > 1) {
    const rowInCol = row % 4; // 0-3
    // For a 2-col widget, we generate pending cells for rows in col A (0-3) automatically
    // The pending cells will be: rowInCol, rowInCol+1, ... for neededSpan rows (capped within 0-3)
    // We only need to pick the START row from col A
    const startRow = rowInCol; // always use col A start
    
    if (pendingCells.length > 0 && pendingCells[0].row !== startRow) {
      pendingCells = [];
    }
    
    // Toggle this start row
    const existingIdx = pendingCells.findIndex(c => c.side === side && c.row === startRow);
    if (existingIdx !== -1) {
      pendingCells = [];
    } else {
      pendingCells = [{ side, row: startRow }];
    }
    
    // Check validity for 2-col: need neededSpan rows starting at startRow within 0-3
    const isValid = pendingCells.length === 1 && canFitAt(side, startRow, neededSpan);
    
    if (isValid) {
      gridSelectedSide = side;
      gridSelectedRow  = startRow;
      updateCellHighlights2Col(side, startRow, neededSpan, isValid);
      showGridConfirmBar(side, startRow, neededSpan, w.name);
    } else {
      pendingCells = [];
      gridSelectedSide = null;
      gridSelectedRow  = null;
      document.querySelectorAll('.wgrid-confirm-bar').forEach(el => el.remove());
      updateCellHighlights2Col(side, startRow, neededSpan, false);
    }
    return;
  }

  // 1-col logic (existing)
  // If clicking on a different side, clear pending cells for that new side
  if (pendingCells.length > 0 && pendingCells[0].side !== side) {
    pendingCells = [];
  }

  // Toggle: if already pending, remove it; otherwise add it
  const existingIdx = pendingCells.findIndex(c => c.side === side && c.row === row);
  if (existingIdx !== -1) {
    pendingCells.splice(existingIdx, 1);
  } else {
    pendingCells.push({ side, row });
  }

  // Sort by row
  pendingCells.sort((a, b) => a.row - b.row);

  // Check validity: need exactly neededSpan cells, all contiguous
  const needed = neededSpan;
  const isCorrectCount = pendingCells.length === needed;
  const isContiguous = isCorrectCount && pendingCells.every((c, i) =>
    i === 0 || c.row === pendingCells[i-1].row + 1
  );
  const isValid = isContiguous && isCorrectCount && canFitAt(side, pendingCells[0].row, needed);

  // Re-render all cells to reflect new state
  updateCellHighlights(side, isValid);

  if (isValid) {
    gridSelectedSide = side;
    gridSelectedRow  = pendingCells[0].row;
    showGridConfirmBar(side, pendingCells[0].row, needed, w.name);
  } else {
    gridSelectedSide = null;
    gridSelectedRow  = null;
    // Remove confirm bar
    document.querySelectorAll('.wgrid-confirm-bar').forEach(el => el.remove());
  }
}

function updateCellHighlights2Col(side, startRow, span, isValid) {
  // Clear all
  document.querySelectorAll('.wgcell').forEach(c => {
    c.classList.remove('selected-valid', 'selected-pending');
  });
  // Highlight rows in both columns A and B
  const cellsEl = document.getElementById(`wgcells-${side}`);
  if (!cellsEl) return;
  for (let r = startRow; r < startRow + span && r < 4; r++) {
    // Col A row r
    const cellA = cellsEl.querySelector(`[data-row="${r}"]`);
    if (cellA) cellA.classList.add(isValid ? 'selected-valid' : 'selected-pending');
    // Col B equivalent row r+4
    const cellB = cellsEl.querySelector(`[data-row="${r + 4}"]`);
    if (cellB) cellB.classList.add(isValid ? 'selected-valid' : 'selected-pending');
  }
}

function updateCellHighlights(activeSide, isValid) {
  // Clear all highlights
  document.querySelectorAll('.wgcell').forEach(c => {
    c.classList.remove('selected-valid', 'selected-pending');
  });
  // Re-apply pending cells
  for (const { side, row } of pendingCells) {
    const cellsEl = document.getElementById(`wgcells-${side}`);
    if (!cellsEl) continue;
    const cell = cellsEl.querySelector(`[data-row="${row}"]`);
    if (cell) {
      cell.classList.add(isValid ? 'selected-valid' : 'selected-pending');
    }
  }
}

function highlightGridSelection(side, startRow, span) {
  document.querySelectorAll('.wgcell').forEach(c => c.classList.remove('selected-valid', 'selected-pending'));
  const cellsEl = document.getElementById(`wgcells-${side}`);
  if (!cellsEl) return;
  for (let r = startRow; r < startRow + span && r < GRID_ROWS; r++) {
    const cell = cellsEl.querySelector(`[data-row="${r}"]`);
    if (cell) cell.classList.add('selected-valid');
  }
}

function clearGridSelection() {
  gridSelectedSide = null;
  gridSelectedRow  = null;
  pendingCells = [];
  document.querySelectorAll('.wgcell').forEach(c => c.classList.remove('selected-valid', 'selected-pending'));
  document.querySelectorAll('.wgrid-confirm-bar').forEach(el => el.remove());
}

function showGridConfirmBar(side, startRow, span, widgetName) {
  // Remove any existing confirm bar
  document.querySelectorAll('.wgrid-confirm-bar').forEach(el => el.remove());

  const colLabel = startRow < 4 ? 'Col A' : 'Col B';
  const rowLabel = (startRow % 4) + 1;
  const endLabel = ((startRow + span - 1) % 4) + 1;
  const sideLabel = side === 'left' ? 'Left' : 'Right';
  const rangeLabel = span > 1 ? `${colLabel} rows ${rowLabel}–${endLabel}` : `${colLabel} row ${rowLabel}`;

  const bar = document.createElement('div');
  bar.className = 'wgrid-confirm-bar';
  bar.innerHTML = `
    <span style="flex:1">Place <strong>${widgetName}</strong> at ${sideLabel} · ${rangeLabel}?</span>
    <button class="btn btn-primary" style="padding:5px 14px;font-size:12px" onclick="confirmGridPlace()">✓ Confirm</button>
    <button class="btn btn-secondary" style="padding:5px 10px;font-size:12px" onclick="clearGridSelection()">✕</button>
  `;

  // Insert after the wgrid-editor
  const gridEditor = document.querySelector('.wgrid-editor');
  if (gridEditor) gridEditor.after(bar);
}

function confirmGridPlace() {
  if (!bagSelectedWidgetId || gridSelectedSide === null || gridSelectedRow === null) return;
  const w = WIDGET_CATALOG.find(x => x.id === bagSelectedWidgetId);
  // Use the size chosen in the picker, or fall back to widget default
  const chosenSize = (w && w.sizes && bagSelectedSizeIdx != null) ? w.sizes[bagSelectedSizeIdx] : null;
  const span = chosenSize ? chosenSize.span : (w ? w.span : 1);
  const cols = chosenSize ? chosenSize.cols : (w ? (w.cols || 1) : 1);
  if (!canFitAt(gridSelectedSide, gridSelectedRow, span)) {
    rewardPopup('That spot is taken!');
    clearGridSelection();
    return;
  }
  const key = `${gridSelectedSide}-${gridSelectedRow}`;
  widgetSlots[key] = { widgetId: bagSelectedWidgetId, span, cols };
  saveWidgetSlots();
  renderWidgetSlots();
  clearGridSelection();
  renderBagWidgetsPanel();
  rewardPopup('Widget placed! 🃏');
}

// ── Legacy shims (keep old calls working) ──
function placeWidget(side, idx) { onGridCellClick(side, idx); }
function openWidgetSlotPick(side, row) { onGridCellClick(side, row); }
function resizeWidgetSlot(key, span) { /* no-op in new system - size is fixed by widget */ }

// ── Widget card in bag (Pokémon card style) ──
function buildWidgetCard(widget) {
  const rarityClass = `rarity-${widget.rarity}`;
  const alreadyPlaced = Object.values(widgetSlots).some(e => e.widgetId === widget.id);
  return `
    <div class="widget-card ${rarityClass}"
      onclick="openWidgetPlaceModal('${widget.id}')">
      <div class="widget-card-rarity-bar"></div>
      <div class="widget-card-holosheen"></div>
      <div class="widget-card-inner">
        <div class="widget-card-header">
          <div class="widget-card-name">${widget.name}</div>
          <div class="widget-card-rarity-badge">${widget.rarity}</div>
        </div>
        <div class="widget-card-art">
          <img src="${widget.imgUrl}" alt="${widget.name}" draggable="false">
        </div>
        <div class="widget-card-footer">
          <div class="widget-card-type">${widget.cols || 1}×${widget.span} widget</div>
          <div class="widget-card-id">${widget.cardNum}</div>
        </div>
      </div>
      ${alreadyPlaced ? '<div class="widget-card-owned-badge">Placed ✓</div>' : ''}
      <div class="widget-card-equip-overlay">
        <button class="widget-card-equip-btn">${alreadyPlaced ? 'Reposition' : 'Place Widget'}</button>
      </div>
    </div>`;
}

// ── Drag from card (still supported for future use) ──
let dragWidgetId = null;
let dragGhost = null;
function startWidgetDrag(e, widgetId) {
  dragWidgetId = widgetId;
  if (e.dataTransfer) { e.dataTransfer.setData('widgetId', widgetId); e.dataTransfer.effectAllowed = 'copy'; }
}
function endWidgetDrag() { dragWidgetId = null; if (dragGhost) { dragGhost.remove(); dragGhost = null; } }
document.addEventListener('dragend', endWidgetDrag);

// ============================================================
// BAG TABS
// ============================================================
let currentBagTab = 'items';
function setBagTab(tab, el) {
  currentBagTab = tab;
  document.querySelectorAll('.bag-tab').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('bagPanelItems').classList.toggle('hidden', tab !== 'items' && tab !== 'favs');
  document.getElementById('bagPanelWidgets').classList.toggle('hidden', tab !== 'widgets');
  document.getElementById('bagPanelPacks').classList.toggle('hidden', tab !== 'packs');
  document.getElementById('bagPanelPasses').classList.toggle('hidden', tab !== 'passes');
  const bagPanelNew = document.getElementById('bagPanelNew');
  if (bagPanelNew) bagPanelNew.classList.toggle('hidden', tab !== 'new');
  // Show remove/name overlays only while in the widgets editor
  document.body.classList.toggle('bag-editing', tab === 'widgets');
  if (tab === 'widgets') renderBagWidgetsPanel();
  if (tab === 'passes') renderPasses();
  if (tab === 'new') { _bagPackDetailOpen = null; renderBagNew(); }
  if (tab === 'favs') {
    invFavFilter = true;
    renderInventory();
  } else if (tab === 'items') {
    invFavFilter = false;
    renderInventory();
  }
}

// ============================================================
// MYSTERY PACK SYSTEM
// ============================================================
const MYSTERY_PACK_TIERS = {
  basic:   { cost: 5,  rolls: [['widget_beato',0.5],['widget_beato',0.5]] }, // placeholder odds
  premium: { cost: 20, rolls: [['widget_beato',0.6],['widget_beato',0.35],['widget_beato',0.05]] },
};

// Map rarity to pool for real; for now all widgets in catalog, weighted by rarity
const RARITY_WEIGHTS = { common: 60, rare: 25, epic: 12, legendary: 3 };

function rollWidget(tier) {
  // Roll rarity first
  const weights = tier === 'premium'
    ? { common: 0, rare: 60, epic: 35, legendary: 5 }
    : { common: 80, rare: 20, epic: 0, legendary: 0 };
  const roll = Math.random() * 100;
  let rarity;
  let acc = 0;
  for (const [r, w] of Object.entries(weights)) {
    acc += w;
    if (roll < acc) { rarity = r; break; }
  }
  rarity = rarity || 'common';

  // Pick a widget of that rarity from catalog; fallback to any
  const pool = WIDGET_CATALOG.filter(w => w.rarity === rarity && !w.auctionOnly);
  const fallbackPool = WIDGET_CATALOG.filter(w => !w.auctionOnly);
  const chosen = pool.length ? pool[Math.floor(Math.random() * pool.length)]
                              : fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
  return chosen;
}

let pendingClaimWidget = null;

function openMysteryPack(tier) {
  const tierData = { basic: 5, premium: 20 };
  const cost = tierData[tier];
  if (sacramentCurrency < cost) {
    rewardPopup(`Need ${cost} <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''> sacraments!`);
    return;
  }
  sacramentCurrency -= cost;
  localStorage.setItem('sacramentCurrency', sacramentCurrency);
  updateCurrencies();

  const widget = rollWidget(tier);
  pendingClaimWidget = widget;

  // Update ticket display
  const ticketEl = document.getElementById('mysteryTicketDisplay');
  if (ticketEl) ticketEl.textContent = sacramentCurrency;

  // Set up sealed pack appearance
  const tierLabel = tier === 'premium' ? 'Premium Pack' : 'Basic Pack';
  const tierCost  = tier === 'premium' ? '<img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''> 20' : '<img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''> 5';
  const rarityColors = {
    common:    { bar: 'linear-gradient(90deg,#8a8a8a,#c0c0c0)', bg: 'linear-gradient(160deg,#1a1a1a,#0d0d0d,#1a1a1a)' },
    rare:      { bar: 'linear-gradient(90deg,#4466ff,#88aaff)', bg: 'linear-gradient(160deg,#0d1640,#08102a,#0d1640)' },
    epic:      { bar: 'linear-gradient(90deg,#9933cc,#cc66ff)', bg: 'linear-gradient(160deg,#1a0d2e,#10071c,#1a0d2e)' },
    legendary: { bar: 'linear-gradient(90deg,#cc8800,#ffd32a,#ffec80,#ffd32a)', bg: 'linear-gradient(160deg,#2d1f00,#1a1000,#2d1f00)' },
  };
  const rc = rarityColors[widget.rarity] || rarityColors.rare;

  document.getElementById('packSealedRarityBar').style.background = tier === 'premium'
    ? rarityColors.epic.bar : rarityColors.common.bar;
  document.getElementById('packSealedTier').textContent  = tierLabel;
  document.getElementById('packSealedCost').textContent  = tierCost;
  document.getElementById('packSealedCard').style.background = tier === 'premium'
    ? 'linear-gradient(160deg,#1a0d2e,#10071c,#1a0d2e)'
    : 'linear-gradient(160deg,#1a1040,#0d0820,#1a1040)';

  // Show sealed phase
  document.getElementById('packSealedWrap').classList.remove('pack-phase-hidden');
  document.getElementById('packRevealWrap').classList.add('pack-phase-hidden');
  document.getElementById('packSealedCard').classList.remove('cracking');
  document.getElementById('packOpenParticles').innerHTML = '';

  // Open overlay
  document.getElementById('packOpenOverlay').classList.add('active');
}

function crackPackOpen() {
  const card = document.getElementById('packSealedCard');
  if (card.classList.contains('cracking')) return;
  card.classList.add('cracking');

  // Burst particles from card centre
  const overlay = document.getElementById('packOpenOverlay');
  const rect = card.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top  + rect.height / 2;
  spawnPackParticles(cx, cy, pendingClaimWidget ? pendingClaimWidget.rarity : 'rare');

  // After crack animation, show reveal
  setTimeout(() => {
    document.getElementById('packSealedWrap').classList.add('pack-phase-hidden');
    showPackReveal();
  }, 520);
}

function spawnPackParticles(cx, cy, rarity) {
  const container = document.getElementById('packOpenParticles');
  container.innerHTML = '';
  const rarityPalettes = {
    common:    ['#c0c0c0','#8a8a8a','#e0e0e0'],
    rare:      ['#4466ff','#88aaff','#b8c6ff','#ffffff'],
    epic:      ['#9933cc','#cc66ff','#ff88ff','#ffffff'],
    legendary: ['#ffd32a','#ffec80','#ff9f43','#ffffff'],
  };
  const colors = rarityPalettes[rarity] || rarityPalettes.rare;
  const count = rarity === 'legendary' ? 60 : rarity === 'epic' ? 45 : 30;
  const stars = ['✦','★','✸','✺','✷'];

  for (let i = 0; i < count; i++) {
    const angle = (Math.random() * Math.PI * 2);
    const speed = 120 + Math.random() * 280;
    const px = Math.cos(angle) * speed;
    const py = Math.sin(angle) * speed - 60;
    const pr = (Math.random() - 0.5) * 720;
    const size = 4 + Math.random() * 10;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const delay = Math.random() * 120;
    const dur = 600 + Math.random() * 500;

    if (i % 5 === 0) {
      // Star emoji particle
      const el = document.createElement('div');
      el.className = 'pack-star';
      el.textContent = stars[Math.floor(Math.random() * stars.length)];
      el.style.cssText = `left:${cx}px;top:${cy}px;--px:${px}px;--py:${py}px;--pr:${pr}deg;
        animation-duration:${dur}ms;animation-delay:${delay}ms;color:${color};
        text-shadow:0 0 8px ${color};`;
      container.appendChild(el);
    } else {
      const el = document.createElement('div');
      el.className = 'pack-particle';
      el.style.cssText = `left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;
        background:${color};--px:${px}px;--py:${py}px;--pr:${pr}deg;
        box-shadow:0 0 ${size*2}px ${color};
        animation-duration:${dur}ms;animation-delay:${delay}ms;`;
      container.appendChild(el);
    }
  }

  // Second wave
  if (rarity === 'legendary' || rarity === 'epic') {
    setTimeout(() => spawnPackParticlesWave(cx, cy, colors), 200);
  }
}

function spawnPackParticlesWave(cx, cy, colors) {
  const container = document.getElementById('packOpenParticles');
  for (let i = 0; i < 20; i++) {
    const angle = (Math.random() * Math.PI * 2);
    const speed = 80 + Math.random() * 160;
    const px = Math.cos(angle) * speed;
    const py = Math.sin(angle) * speed - 30;
    const size = 3 + Math.random() * 7;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const el = document.createElement('div');
    el.className = 'pack-particle';
    el.style.cssText = `left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;
      background:${color};--px:${px}px;--py:${py}px;--pr:${Math.random()*360}deg;
      box-shadow:0 0 ${size*2}px ${color};
      animation-duration:${500+Math.random()*300}ms;`;
    container.appendChild(el);
  }
}

function showPackReveal() {
  if (!pendingClaimWidget) return;
  const w = pendingClaimWidget;

  const rarityColors = {
    common:    { color: '#c0c0c0', bg: 'rgba(192,192,192,0.15)', border: 'rgba(192,192,192,0.3)', glow: 'rgba(192,192,192,0.2)' },
    rare:      { color: '#88aaff', bg: 'rgba(68,102,255,0.2)',  border: 'rgba(68,102,255,0.4)',  glow: 'rgba(68,102,255,0.3)' },
    epic:      { color: '#cc66ff', bg: 'rgba(153,51,204,0.2)',  border: 'rgba(153,51,204,0.4)',  glow: 'rgba(153,51,204,0.35)' },
    legendary: { color: '#ffd32a', bg: 'rgba(255,211,42,0.2)',  border: 'rgba(255,211,42,0.4)',  glow: 'rgba(255,211,42,0.5)' },
  };
  const rc = rarityColors[w.rarity] || rarityColors.rare;

  // Set rarity label
  const rarityEl = document.getElementById('packRevealRarity');
  rarityEl.textContent = w.rarity.toUpperCase();
  rarityEl.style.color      = rc.color;
  rarityEl.style.background = rc.bg;
  rarityEl.style.border     = `1px solid ${rc.border}`;

  // Set glow CSS var on card slot
  const slot = document.getElementById('packRevealCardSlot');
  slot.style.setProperty('--pack-glow', rc.glow);

  // Inject the widget card
  slot.innerHTML = buildWidgetCard(w, false);

  // Set name
  document.getElementById('packRevealName').textContent = w.name;

  // Show reveal phase
  const revealWrap = document.getElementById('packRevealWrap');
  revealWrap.classList.remove('pack-phase-hidden');
  revealWrap.style.animation = 'none';
  void revealWrap.offsetWidth; // reflow
  revealWrap.style.animation = '';

  // Extra particle burst for epic/legendary on reveal
  if (w.rarity === 'legendary' || w.rarity === 'epic') {
    const vw = window.innerWidth / 2, vh = window.innerHeight / 2;
    setTimeout(() => spawnPackParticles(vw, vh, w.rarity), 100);
  }
}

function claimWidget() {
  if (!pendingClaimWidget) return;
  addWidgetToInventory(pendingClaimWidget.id);
  rewardPopup(`${pendingClaimWidget.name} added to Bag! 🃏`);
  hideMysteryReveal();
  pendingClaimWidget = null;
}

function hideMysteryReveal() {
  document.getElementById('packOpenOverlay').classList.remove('active');
  pendingClaimWidget = null;
  // Also hide old reveal div if present
  const el = document.getElementById('mysteryPackReveal');
  if (el) el.classList.add('hidden');
}

// Update ticket display when shop tab opens
const _origSetShopTab = typeof setShopTab !== 'undefined' ? setShopTab : null;

// ============================================================
// INVENTORY SYSTEM
// ============================================================
let inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
// inventory items: {id, name, type, data}

function addToInventory(item) {
  if (inventory.find(i => i.id === item.id)) return; // no dupes
  const entry = { ...item, obtainedAt: Date.now() };
  inventory.push(entry);
  localStorage.setItem('inventory', JSON.stringify(inventory));
  // Track recently obtained (last 8)
  try {
    let rec = JSON.parse(localStorage.getItem('inv_recent') || '[]');
    rec = [{ id: item.id, name: item.name, type: item.type, obtainedAt: entry.obtainedAt }, ...rec].slice(0, 8);
    localStorage.setItem('inv_recent', JSON.stringify(rec));
  } catch(_) {}
}

function equipItem(itemId) {
  const item = inventory.find(i => i.id === itemId);
  if (!item) return;

  const alreadyEquipped =
    (item.type === 'dialogue' && equippedDialogue === item.data) ||
    (item.type === 'effect'   && equippedEffect   === item.data) ||
    (item.type === 'title'    && playerTitle       === item.data) ||
    (item.type === 'theme'    && equippedThemeId   === item.id)  ||
    (item.type === 'vfx'      && equippedVfx       === item.data) ||
    (item.type === 'bg'       && equippedBg        === item.data);

  if (alreadyEquipped) {
    if (item.type === 'dialogue') { equippedDialogue = 'default'; localStorage.setItem('equippedDialogue', 'default'); }
    if (item.type === 'effect')   { equippedEffect = 'none'; localStorage.setItem('equippedEffect', 'none'); applyVisualEffect('none'); }
    if (item.type === 'theme')    { applyTheme('none'); }
    if (item.type === 'title')    { playerTitle = 'wanderer'; updateCurrencies(); }
    if (item.type === 'vfx')      { equippedVfx = 'none'; localStorage.setItem('equippedVfx', 'none'); }
    if (item.type === 'bg')       { equippedBg = 'none'; localStorage.setItem('equippedBg', 'none'); applyBg('none'); }
    rewardPopup('Unequipped: ' + item.name);
    renderInventory();
    return;
  }

  if (item.type === 'dialogue') {
    equippedDialogue = item.data;
    localStorage.setItem('equippedDialogue', equippedDialogue);
    rewardPopup('Equipped: ' + item.name);
  }
  if (item.type === 'effect') {
    equippedEffect = item.data;
    localStorage.setItem('equippedEffect', equippedEffect);
    applyVisualEffect(equippedEffect);
    rewardPopup('Equipped: ' + item.name);
  }
  if (item.type === 'theme') {
    applyTheme(item.data);
    rewardPopup('Equipped: ' + item.name);
  }
  if (item.type === 'title') {
    playerTitle = item.data;
    updateCurrencies();
    rewardPopup('Title equipped: ' + item.name);
  }
  if (item.type === 'vfx') {
    equippedVfx = item.data;
    localStorage.setItem('equippedVfx', equippedVfx);
    rewardPopup('VFX equipped: ' + item.name + ' - particles now active!');
  }
  if (item.type === 'bg') {
    equippedBg = item.data;
    localStorage.setItem('equippedBg', equippedBg);
    applyBg(equippedBg);
    rewardPopup('Background equipped: ' + item.name);
  }
  renderInventory();
}

function applyTheme(themeId) {
  // Remove old theme body classes
  document.body.className = document.body.className.replace(/theme-\S+/g, '').trim();
  
  const themes = {
    void:       { accent: '#d6d6ff', accent3: '#8f8fff' },
    coldblue:   { accent: '#9dc7ff', accent3: '#5b88ff' },
    naruto:     { accent: '#ff9f43', accent3: '#ee5a24' },
    slayer:     { accent: '#a29bfe', accent3: '#6c5ce7' },
    aot:        { accent: '#e8c87a', accent3: '#b5892a' },
    // NEW themes
    neongreen:  { accent: '#00ff9d', accent3: '#00cc7a' },
    crimson:    { accent: '#ff6b7a', accent3: '#cc3344' },
    sakura:     { accent: '#ffb3c6', accent3: '#ff85a1' },
    deep:       { accent: '#7f8fff', accent3: '#4455ff' },
    midnight:   { accent: '#6677cc', accent3: '#334488' },
    gold:       { accent: '#ffd700', accent3: '#cc9900' },
    matrix:     { accent: '#00ff41', accent3: '#00aa2b' },
    dusk:       { accent: '#e8aaff', accent3: '#bb44ee' },
    ice:        { accent: '#c8f0ff', accent3: '#66ccff' },
    ember:      { accent: '#ff8c42', accent3: '#cc5500' },
  };

  const t = themes[themeId];
  if (t) {
    document.documentElement.style.setProperty('--accent', t.accent);
    document.documentElement.style.setProperty('--accent3', t.accent3);
  }

  // Theme-specific body effects
  if (themeId === 'rain') {
    document.body.classList.add('theme-rain');
    startRainEffect();
  } else {
    stopRainEffect();
  }
  if (themeId === 'matrix') {
    startMatrixEffect();
  } else {
    stopMatrixEffect();
  }

  localStorage.setItem('equippedTheme', themeId);
  equippedThemeId = themeId;
}

// ============================================================
// BACKGROUND PRESETS
// ============================================================
const BG_PRESETS = {
  none:       { label: 'Default Grid', css: '' },
  void:       { label: 'Pure Void', css: 'background:#000 !important;' },
  white:      { label: 'Pure White', css: 'background:#f5f5f8 !important; color: #0a0a0f !important;' },
  slate:      { label: 'Deep Slate', css: 'background:#0d1117 !important;' },
  crimson:    { label: 'Crimson Dusk', css: 'background:linear-gradient(135deg,#0a000f 0%,#1a0008 100%) !important;' },
  ocean:      { label: 'Deep Ocean', css: 'background:linear-gradient(180deg,#000c1a 0%,#001428 100%) !important;' },
  forest:     { label: 'Dark Forest', css: 'background:linear-gradient(135deg,#00100a 0%,#001a0d 100%) !important;' },
  nebula:     { label: 'Nebula', css: 'background:radial-gradient(ellipse at 20% 50%, rgba(70,0,80,0.8) 0%, #050008 50%, rgba(0,30,80,0.6) 100%) !important;' },
  aurora:     { label: 'Aurora', css: 'background:linear-gradient(180deg,#000810 0%,rgba(0,40,60,0.95) 50%,#000810 100%) !important;' },
  synthwave:  { label: 'Synthwave', css: 'background:linear-gradient(180deg,#0d001a 0%,#1a0033 60%,#330044 100%) !important;' },
  hazel:      { label: 'Hazel Warm', css: 'background:linear-gradient(135deg,#0e0800 0%,#1a1000 100%) !important;' },
  steel:      { label: 'Steel', css: 'background:linear-gradient(180deg,#0a0c10 0%,#10141a 100%) !important;' },
};

function applyBg(bgId) {
  // Remove any previous custom bg style
  let bgStyle = document.getElementById('__customBgStyle');
  if (!bgStyle) {
    bgStyle = document.createElement('style');
    bgStyle.id = '__customBgStyle';
    document.head.appendChild(bgStyle);
  }

  // Remove image fade overlay if present
  const oldFade = document.getElementById('__bgImageFade');
  if (oldFade) oldFade.remove();

  document.body.classList.remove('bg-no-grid');

  const preset = BG_PRESETS[bgId] || BG_PRESETS.none;
  if (!bgId || bgId === 'none' || !preset.css) {
    bgStyle.textContent = '';
    return;
  }

  if (preset.isImage) {
    // Image backgrounds: fixed at top, 100% width, natural height, black underneath.
    // No zoom, no cropping — image stays at its natural aspect ratio.
    const imgUrl = preset.url || preset.css.match(/url\('([^']+)'\)/)?.[1] || '';
    bgStyle.textContent = `
      body {
        background-image: url('${imgUrl}') !important;
        background-size: 100% auto !important;
        background-repeat: no-repeat !important;
        background-position: top center !important;
        background-attachment: fixed !important;
        background-color: #000000 !important;
      }
      body::before { opacity: 0 !important; }
    `;
  } else {
    bgStyle.textContent = `
      body { ${preset.css} }
      body::before { opacity: 0 !important; }
    `;
  }
}

let invCategoryFilter = 'all';
let invFavFilter = false;

function invLoadFavs() {
  try { return JSON.parse(localStorage.getItem('inv_favourites') || '[]'); } catch(_) { return []; }
}
function invSaveFavs(arr) {
  try { localStorage.setItem('inv_favourites', JSON.stringify(arr)); } catch(_) {}
}
function invToggleFav(itemId) {
  let favs = invLoadFavs();
  const idx = favs.indexOf(itemId);
  if (idx >= 0) favs.splice(idx, 1); else favs.push(itemId);
  invSaveFavs(favs);
  renderInventory();
}
function invSetFavFilter(on) {
  invFavFilter = on;
  const btn = document.getElementById('invFavFilterBtn');
  if (btn) btn.classList.toggle('active', on);
  renderInventory();
}

function filterInvCat(cat, el) {
  invCategoryFilter = cat;
  document.querySelectorAll('.inv-cat-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  renderInventory();
}

function _invItemTooltip(item) {
  const isEquipped = (item.type === 'dialogue' && equippedDialogue === item.data) ||
                     (item.type === 'effect' && equippedEffect === item.data) ||
                     (item.type === 'title' && playerTitle === item.data) ||
                     (item.type === 'theme' && equippedThemeId === item.id) ||
                     (item.type === 'vfx' && equippedVfx === item.data) ||
                     (item.type === 'bg' && equippedBg === item.data) ||
                     (item.type === 'cursor' && equippedCursor === (item.data || item.id)) ||
                     (item.type === 'rain' && typeof rainOverlayVariant !== 'undefined' && rainOverlayVariant === item.data);
  return `${item.name} [${item.type}]${isEquipped ? ' ✓ Equipped' : ''}`;
}


function renderInventory() {
  const grid = document.getElementById('inventoryGrid');
  const emptyMsg = document.getElementById('emptyInventoryMsg');
  if (!grid) return;

  // Recently obtained strip
  try {
    const rec = JSON.parse(localStorage.getItem('inv_recent') || '[]').slice(0, 5);
    let strip = document.getElementById('invRecentStrip');
    if (!strip) {
      strip = document.createElement('div');
      strip.id = 'invRecentStrip';
      strip.className = 'inv-recent-strip';
      grid.parentNode.insertBefore(strip, grid);
    }
    const typeEmoji = {title:'🏷️', theme:'🎨', effect:'✨', dialogue:'💬', vfx:'⚡', bg:'🖼️'};
    if (rec.length) {
      strip.innerHTML = `<div class="inv-recent-label">🕐 Recently Obtained</div>
        <div class="inv-recent-list">${rec.map(r =>
          `<div class="inv-recent-item" title="${r.name}" onclick="equipItem('${r.id}')">
            <span>${typeEmoji[r.type] || '📦'}</span>
            <span class="inv-recent-name">${r.name.length > 14 ? r.name.slice(0,13) + '…' : r.name}</span>
          </div>`
        ).join('')}</div>`;
      strip.style.display = '';
    } else {
      strip.style.display = 'none';
    }
  } catch(_) {}

  // Favs toggle rendering
  const favBtn = document.getElementById('invFavFilterBtn');
  if (favBtn) favBtn.classList.toggle('active', invFavFilter);

  // Update equipped strip
  const eqTitle = document.getElementById('eqTitle');
  const eqTheme = document.getElementById('eqTheme');
  const eqEffect = document.getElementById('eqEffect');
  const eqDialogue = document.getElementById('eqDialogue');
  const eqVfx = document.getElementById('eqVfx');
  const eqBg = document.getElementById('eqBg');
  const equippedPack = DIALOGUE_PACKS[equippedDialogue];

  if (eqTitle) eqTitle.textContent = playerTitle || 'wanderer';
  if (eqTheme) eqTheme.textContent = equippedThemeId ? equippedThemeId.replace('theme_','') : 'Default';
  if (eqEffect) eqEffect.textContent = equippedEffect === 'none' ? 'None' : equippedEffect;
  if (eqDialogue) eqDialogue.textContent = equippedPack ? equippedPack.name : 'Default';
  if (eqVfx) eqVfx.textContent = equippedVfx === 'none' ? 'None' : equippedVfx.charAt(0).toUpperCase() + equippedVfx.slice(1);
  if (eqBg) {
    const bgPreset = BG_PRESETS[equippedBg];
    eqBg.textContent = (equippedBg === 'none' || !bgPreset) ? 'Default' : bgPreset.label;
  }

  // Show rain angle control only when rain theme is equipped
  const rainCtrl = document.getElementById('rainAngleControl');
  const rainSlider = document.getElementById('rainAngleSlider');
  if (rainCtrl) {
    const rainActive = equippedThemeId === 'rain';
    rainCtrl.style.display = rainActive ? '' : 'none';
    if (rainActive && rainSlider) {
      rainSlider.value = rainAngle;
      setRainAngle(rainAngle); // update label
    }
  }

  const TYPE_CONFIG = {
    title:    { label: '🏷️ Titles',   accent: 'var(--warn)' },
    theme:    { label: '🎨 Themes',   accent: 'var(--accent2)' },
    effect:   { label: '✨ Effects',  accent: 'var(--correct)' },
    dialogue: { label: '💬 Dialogue', accent: 'var(--accent)' },
    vfx:      { label: '⚡ VFX Packs', accent: '#ffd32a' },
    bg:       { label: '🖼️ Backgrounds', accent: '#c8f0ff' },
  };

  const filtered = invCategoryFilter === 'all'
    ? inventory
    : inventory.filter(i => i.type === invCategoryFilter);

  if (inventory.length === 0) {
    if (emptyMsg) emptyMsg.style.display = 'block';
    grid.innerHTML = '<p style="color:var(--muted);font-size:13px">No items yet. Visit the 🛒 Shop tab!</p>';
  } else if (filtered.length === 0) {
    if (emptyMsg) emptyMsg.style.display = 'none';
    grid.innerHTML = `<p style="color:var(--muted);font-size:12px;font-family:'Space Mono',monospace">No ${invCategoryFilter} items owned yet.</p>`;
  } else {
    if (emptyMsg) emptyMsg.style.display = 'none';

    const types = invCategoryFilter === 'all'
      ? [...new Set(inventory.map(i => i.type))]
      : [invCategoryFilter];

    const favs = invLoadFavs();

    // If favs filter is on, only show starred items
    const displayItems = invFavFilter
      ? inventory.filter(i => favs.includes(i.id) && (invCategoryFilter === 'all' || i.type === invCategoryFilter))
      : filtered;

    if (invFavFilter && displayItems.length === 0) {
      grid.innerHTML = `<p style="color:var(--muted);font-size:12px;font-family:'Space Mono',monospace">No starred items yet. Star items with ★ to save them here.</p>`;
    } else {
      const displayTypes = invFavFilter
        ? (invCategoryFilter === 'all' ? [...new Set(displayItems.map(i => i.type))] : [invCategoryFilter])
        : types;

      grid.innerHTML = displayTypes.map(type => {
        const items = displayItems.filter(i => i.type === type);
        if (!items.length) return '';
        const cfg = TYPE_CONFIG[type] || { label: type, accent: 'var(--accent)' };
        return `
          <div class="inv-section">
            <div class="inv-section-header">
              ${cfg.label}
              <span class="inv-section-count">${items.length}</span>
            </div>
            <div class="bag-items-grid">
              ${items.map(item => {
                const isEquipped = (item.type === 'dialogue' && equippedDialogue === item.data) ||
                                   (item.type === 'effect' && equippedEffect === item.data) ||
                                   (item.type === 'title' && playerTitle === item.data) ||
                                   (item.type === 'theme' && equippedThemeId === item.id) ||
                                   (item.type === 'vfx' && equippedVfx === item.data) ||
                                   (item.type === 'bg' && equippedBg === item.data) ||
                                   (item.type === 'cursor' && equippedCursor === (item.data || item.id)) ||
                                   (item.type === 'rain' && typeof rainOverlayVariant !== 'undefined' && rainOverlayVariant === item.data);
                const isFav = favs.includes(item.id);
                return `<div class="bag-inv-item ${isEquipped ? 'equipped' : ''}" title="${_invItemTooltip(item)}">
                  <button class="inv-fav-star ${isFav ? 'active' : ''}" onclick="invToggleFav('${item.id}')" title="${isFav ? 'Unstar' : 'Star'}">★</button>
                  <div class="bag-inv-item-info">
                    <div class="bag-inv-item-name">${item.name}</div>
                    <div class="bag-inv-item-type">${item.type}</div>
                  </div>
                  <button class="inv-equip-btn ${isEquipped ? 'equipped-btn' : ''}" onclick="equipItem('${item.id}')">
                    ${isEquipped ? '✓ On' : 'Equip'}
                  </button>
                </div>`;
              }).join('')}
            </div>
          </div>`;
      }).join('');
    }
  }

  // Render question packs
  const packsList = document.getElementById('questionPacksList');
  if (packsList) {
    packsList.innerHTML = QUESTION_PACKS.map(pack => {
      const owned = ownedPacks.includes(pack.id);
      const active = activePackIds.includes(pack.id);
      return `<div class="qpack">
        <div class="qpack-emoji">${pack.emoji}</div>
        <div class="qpack-info">
          <div class="qpack-name">${pack.name}</div>
          <div class="qpack-desc">${pack.desc}</div>
          <div class="qpack-meta">
            ${owned 
              ? `<span class="qpack-owned">✓ Owned</span>
                 <button class="inv-equip-btn ${active ? 'equipped-btn' : ''}" onclick="togglePack('${pack.id}')">
                   ${active ? '✓ Active' : 'Activate'}
                 </button>`
              : `<span class="qpack-cost">${pack.cost} <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''> sacraments</span>
                 <button class="inv-equip-btn" onclick="buyPack('${pack.id}')">Buy Pack</button>`
            }
            <span style="font-family:'Space Mono',monospace;font-size:10px;color:var(--muted)">${pack.flashcards.length} FC · ${pack.mcq.length} MCQ</span>
          </div>
        </div>
      </div>`;
    }).join('');
  }
  renderPasses();
}

function buyPack(packId) {
  const pack = QUESTION_PACKS.find(p => p.id === packId);
  if (!pack) return;
  if (ownedPacks.includes(packId)) { rewardPopup('Already owned!'); return; }
  if (sacramentCurrency < pack.cost) { rewardPopup('Need more sacraments!'); return; }
  sacramentCurrency -= pack.cost;
  ownedPacks.push(packId);
  localStorage.setItem('ownedPacks', JSON.stringify(ownedPacks));
  updateCurrencies();
  rewardPopup('Unlocked: ' + pack.name + ' 🎉');
  renderInventory();
}

function togglePack(packId) {
  if (!ownedPacks.includes(packId)) return;
  const idx = activePackIds.indexOf(packId);
  if (idx >= 0) {
    activePackIds.splice(idx, 1);
    rewardPopup('Pack deactivated');
  } else {
    activePackIds.push(packId);
    rewardPopup('Pack activated! Reinit study modes.');
  }
  localStorage.setItem('activePackIds', JSON.stringify(activePackIds));
  // Reinit question pools to include new questions
  initFlash(); initMCQ(); // initFRQ removed
  renderInventory();
}

// ============================================================
// EXPANDED SHOP POOL
// ============================================================
const shopPool = [
  // Titles - cheap to mid range
  {id:'title_oog', name:'Title: oog spiller', cost:200, type:'title', data:'oog spiller'},
  {id:'title_hog', name:'Title: hog cranker', cost:200, type:'title', data:'hog cranker'},
  {id:'title_alpha', name:'Title: alpha', cost:150, type:'title', data:'alpha'},
  {id:'title_beta', name:'Title: beta', cost:150, type:'title', data:'beta'},
  {id:'title_gamma', name:'Title: gamma', cost:150, type:'title', data:'gamma'},
  {id:'title_top', name:'Title: top', cost:150, type:'title', data:'top'},
  {id:'title_bottom', name:'Title: bottom', cost:150, type:'title', data:'bottom'},
  {id:'title_switch', name:'Title: switch', cost:200, type:'title', data:'switch'},
  {id:'title_wanderer', name:'Title: wanderer', cost:0, type:'title', data:'wanderer'},
  {id:'title_beato', name:'Title: BEATORICHHHEEEEE', cost:800, type:'title', data:'BEATORICHHHEEEEE'},
  {id:'title_witch', name:'Title: Eternal Witch', cost:800, type:'title', data:'Eternal Witch'},
  {id:'title_omega', name:'Title: omega', cost:300, type:'title', data:'omega'},
  {id:'title_evil', name:'Title: evil', cost:200, type:'title', data:'evil'},
  {id:'title_cuck', name:'Title: coach cuck', cost:200, type:'title', data:'coach cuck'},
  {id:'title_neurotic', name:'Title: neurotic', cost:250, type:'title', data:'neurotic'},
  {id:'title_dht', name:'Title: double hand twister', cost:250, type:'title', data:'double hand twister'},
  {id:'title_gambler', name:'Title: gambler', cost:350, type:'title', data:'gambler'},
  {id:'title_salamander', name:'Title: salamander hater', cost:200, type:'title', data:'salamander hater'},
  {id:'title_tsundere', name:'Title: tsundere', cost:300, type:'title', data:'tsundere'},
  {id:'title_uwumaster', name:'Title: uwumaster', cost:350, type:'title', data:'uwumaster'},
  {id:'title_uwulord', name:'Title: uwulord', cost:450, type:'title', data:'uwulord'},
  {id:'title_uwuking', name:'Title: uwuking', cost:600, type:'title', data:'uwuking'},
  {id:'title_uwuqueen', name:'Title: uwuqueen', cost:600, type:'title', data:'uwuqueen'},
  {id:'title_cutie', name:'Title: cutie', cost:300, type:'title', data:'cutie'},
  {id:'title_asher', name:'Title: asherfan2243', cost:250, type:'title', data:'asherfan2243'},
  {id:'title_eclipse', name:'Title: eclipse 🤤', cost:700, type:'title', data:'eclipse 🤤'},

  // Themes - mid range
  {id:'theme_void', name:'Void Theme', cost:500, type:'theme', data:'void'},
  {id:'theme_cold', name:'Cold Blue Theme', cost:500, type:'theme', data:'coldblue'},
  {id:'theme_naruto', name:'Naruto Theme', cost:700, type:'theme', data:'naruto'},
  {id:'theme_slayer', name:'Slayer Theme', cost:700, type:'theme', data:'slayer'},
  {id:'theme_aot', name:'Survey Corps Theme', cost:800, type:'theme', data:'aot'},
  {id:'theme_neongreen', name:'Neon Green Theme', cost:450, type:'theme', data:'neongreen'},
  {id:'theme_crimson', name:'Crimson Theme', cost:450, type:'theme', data:'crimson'},
  {id:'theme_sakurapink', name:'Sakura Pink Theme', cost:550, type:'theme', data:'sakura'},
  {id:'theme_deep', name:'Deep Navy Theme', cost:400, type:'theme', data:'deep'},
  {id:'theme_midnight', name:'Midnight Theme', cost:400, type:'theme', data:'midnight'},
  {id:'theme_gold', name:'Gold Theme', cost:650, type:'theme', data:'gold'},
  {id:'theme_matrix', name:'Matrix Theme', cost:750, type:'theme', data:'matrix'},
  {id:'theme_dusk', name:'Dusk Theme', cost:500, type:'theme', data:'dusk'},
  {id:'theme_ice', name:'Ice Theme', cost:500, type:'theme', data:'ice'},
  {id:'theme_ember', name:'Ember Theme', cost:550, type:'theme', data:'ember'},

  // Visual Effects - mid to high
  {id:'effect_rain', name:'Rain Effect', cost:600, type:'effect', data:'rain'},
  {id:'effect_stars', name:'Starfield Effect', cost:500, type:'effect', data:'stars'},
  {id:'effect_void', name:'Void Orbs Effect', cost:650, type:'effect', data:'void'},
  {id:'effect_matrix', name:'Matrix Rain Effect', cost:750, type:'effect', data:'matrix'},
  {id:'effect_none', name:'Remove Effect', cost:0, type:'effect', data:'none'},

  // Dialogue Packs
  {id:'dlg_tsundere', name:'Tsundere Pack', cost:400, type:'dialogue', data:'tsundere'},
  {id:'dlg_kuudere', name:'Kuudere Pack', cost:350, type:'dialogue', data:'kuudere'},
  {id:'dlg_genki', name:'Genki Pack', cost:450, type:'dialogue', data:'genki'},
  {id:'dlg_chuu', name:'Chuunibyou Pack', cost:550, type:'dialogue', data:'chuunibyou'},

  // VFX Packs - high cost, worth grinding for
  {id:'vfx_basic', name:'Basic VFX Pack', cost:600, type:'vfx', data:'basic', desc:'Unlocks subtle particles on tab switch, button clicks, and correct/wrong answers.'},
  {id:'vfx_arcane', name:'Arcane VFX Pack', cost:1000, type:'vfx', data:'arcane', desc:'Purple arcane sparks on all interactions. Mystic energy on correct answers.'},
  {id:'vfx_overdrive', name:'Overdrive VFX Pack', cost:1500, type:'vfx', data:'overdrive', desc:'Explosive golden bursts. Maximum particle chaos. Only for the committed.'},
  {id:'vfx_none', name:'Remove VFX', cost:0, type:'vfx', data:'none', desc:'Disable all interaction particles.'},

  // Background Presets
  {id:'bg_void', name:'Void Background', cost:400, type:'bg', data:'void', desc:'Pure black. No distractions.'},
  {id:'bg_slate', name:'Deep Slate', cost:350, type:'bg', data:'slate', desc:'Subtle deep blue-grey.'},
  {id:'bg_crimson', name:'Crimson Dusk', cost:500, type:'bg', data:'crimson', desc:'Dark red gradient.'},
  {id:'bg_ocean', name:'Deep Ocean', cost:500, type:'bg', data:'ocean', desc:'Dark navy gradient.'},
  {id:'bg_forest', name:'Dark Forest', cost:500, type:'bg', data:'forest', desc:'Deep forest green.'},
  {id:'bg_nebula', name:'Nebula', cost:750, type:'bg', data:'nebula', desc:'Purple-blue radial nebula.'},
  {id:'bg_aurora', name:'Aurora', cost:650, type:'bg', data:'aurora', desc:'Northern lights tones.'},
  {id:'bg_synthwave', name:'Synthwave', cost:650, type:'bg', data:'synthwave', desc:'Deep purple synthwave gradient.'},
  {id:'bg_hazel', name:'Hazel Warm', cost:400, type:'bg', data:'hazel', desc:'Warm dark brown tones.'},
  {id:'bg_steel', name:'Steel', cost:350, type:'bg', data:'steel', desc:'Cold blue-steel gradient.'},
  {id:'bg_none', name:'Default Background', cost:0, type:'bg', data:'none', desc:'Restore the default grid.'},
];

// ============================================================
// COSMETIC PACKS CATALOG (Phase 6.5)
// Replaces the old individual theme_*/vfx_*/effect_*/dlg_* system
// ============================================================

const COSMETIC_PACKS = [
  // ── Background Packs ──────────────────────────────────────
  {
    id: 'pack_melancholic', name: 'Melancholic', type: 'pack', category: 'bg',
    desc: 'Dark, overcast, desaturated backgrounds — quiet and still.',
    packCost: 400, source: 'shop',
    coverColor: 'linear-gradient(135deg,#2a2a3a,#1a1a28)',
    items: [
      { id: 'mel_01', name: 'Overcast',   cost: 0,   data: 'mel_overcast'   },
      { id: 'mel_02', name: 'Fog',        cost: 120, data: 'mel_fog'        },
      { id: 'mel_03', name: 'Ash',        cost: 150, data: 'mel_ash'        },
      { id: 'mel_04', name: 'Dusk Glass', cost: 180, data: 'mel_dusk_glass' },
    ]
  },
  {
    id: 'pack_cool', name: 'Gradients: Cool', type: 'pack', category: 'bg',
    desc: 'Blue, teal, and purple — cold and deep.',
    packCost: 300, source: 'shop',
    coverColor: 'linear-gradient(135deg,#0a1628,#1a0a3a)',
    items: [
      { id: 'cool_01', name: 'Void',      cost: 0,   data: 'void'     },
      { id: 'cool_02', name: 'Deep Navy', cost: 80,  data: 'deep'     },
      { id: 'cool_03', name: 'Nebula',    cost: 120, data: 'nebula'   },
      { id: 'cool_04', name: 'Ice',       cost: 100, data: 'ice_bg'   },
    ]
  },
  {
    id: 'pack_warm', name: 'Gradients: Warm', type: 'pack', category: 'bg',
    desc: 'Red, orange, amber — warm and smoldering.',
    packCost: 300, source: 'shop',
    coverColor: 'linear-gradient(135deg,#2a1000,#3a1810)',
    items: [
      { id: 'warm_01', name: 'Ember',    cost: 0,   data: 'ember_bg'  },
      { id: 'warm_02', name: 'Hazel',    cost: 80,  data: 'hazel'     },
      { id: 'warm_03', name: 'Dusk',     cost: 100, data: 'dusk_bg'   },
      { id: 'warm_04', name: 'Sakura',   cost: 120, data: 'sakura_bg' },
    ]
  },
  {
    id: 'pack_crimson', name: 'Gradients: Crimson', type: 'pack', category: 'bg',
    desc: 'Deep red, bloodmoon, rust — severe and striking.',
    packCost: 350, source: 'shop',
    coverColor: 'linear-gradient(135deg,#1a0000,#3a0808)',
    items: [
      { id: 'crim_01', name: 'Crimson',    cost: 0,   data: 'crimson'    },
      { id: 'crim_02', name: 'Bloodmoon',  cost: 120, data: 'bloodmoon'  },
      { id: 'crim_03', name: 'Rust',       cost: 130, data: 'rust_bg'    },
    ]
  },
  {
    id: 'pack_monotone', name: 'Gradients: Monotone', type: 'pack', category: 'bg',
    desc: 'Greyscale backgrounds — clean and minimal.',
    packCost: 250, source: 'shop',
    coverColor: 'linear-gradient(135deg,#1a1a1a,#2e2e2e)',
    items: [
      { id: 'mono_01', name: 'Slate',   cost: 0,   data: 'slate'    },
      { id: 'mono_02', name: 'Steel',   cost: 60,  data: 'steel'    },
      { id: 'mono_03', name: 'Carbon',  cost: 80,  data: 'carbon_bg'},
      { id: 'mono_04', name: 'Chalk',   cost: 100, data: 'chalk_bg' },
    ]
  },
  // ── Color Set Packs ───────────────────────────────────────
  {
    id: 'pack_frost_cs', name: 'Color Sets: Frost', type: 'pack', category: 'colorset',
    desc: 'Cool accent overrides — bone, violet hour, frost.',
    packCost: 350, source: 'shop',
    coverColor: 'linear-gradient(135deg,#0e1a2e,#1a2840)',
    items: [
      { id: 'frost_cs_01', name: 'Bone',         cost: 0,   data: 'cs_bone'        },
      { id: 'frost_cs_02', name: 'Violet Hour',  cost: 100, data: 'cs_violet_hour' },
      { id: 'frost_cs_03', name: 'Frost',        cost: 130, data: 'cs_frost'       },
    ]
  },
  {
    id: 'pack_ember_cs', name: 'Color Sets: Ember', type: 'pack', category: 'colorset',
    desc: 'Warm accent overrides — copper, ember glow, rust blush.',
    packCost: 350, source: 'shop',
    coverColor: 'linear-gradient(135deg,#2a1000,#3a1800)',
    items: [
      { id: 'ember_cs_01', name: 'Copper',     cost: 0,   data: 'cs_copper'     },
      { id: 'ember_cs_02', name: 'Ember Glow', cost: 100, data: 'cs_ember_glow' },
      { id: 'ember_cs_03', name: 'Rust Blush', cost: 130, data: 'cs_rust_blush' },
    ]
  },
];

// ── Owned cosmetic packs state ─────────────────────────────
// ownedCosmPacks: { [packId]: { ownedItems: [itemId, ...] } }
let ownedCosmPacks = JSON.parse(localStorage.getItem('ownedCosmPacks') || '{}');

function saveCosmPacks() {
  localStorage.setItem('ownedCosmPacks', JSON.stringify(ownedCosmPacks));
}

// ── BG presets registered for cosmetic pack items ──────────
// Extend BG_PRESETS with pack item entries when they don't exist
function _registerPackBgPresets() {
  if (typeof BG_PRESETS === 'undefined') return;
  const extras = {
    mel_overcast:   { label:'Overcast',   style:'background:linear-gradient(135deg,#1e1e2e,#16161f)' },
    mel_fog:        { label:'Fog',        style:'background:linear-gradient(135deg,#1f2030,#292939)' },
    mel_ash:        { label:'Ash',        style:'background:linear-gradient(135deg,#1a1a1f,#23232e)' },
    mel_dusk_glass: { label:'Dusk Glass', style:'background:linear-gradient(135deg,#18181f,#2a2038)' },
    ice_bg:         { label:'Ice',        style:'background:linear-gradient(135deg,#0a1628,#0d2a3e)' },
    ember_bg:       { label:'Ember',      style:'background:linear-gradient(135deg,#1a0800,#2a1000)' },
    dusk_bg:        { label:'Dusk',       style:'background:linear-gradient(135deg,#1a100a,#251508)' },
    sakura_bg:      { label:'Sakura',     style:'background:linear-gradient(135deg,#1a0f14,#2a1525)' },
    bloodmoon:      { label:'Bloodmoon',  style:'background:radial-gradient(ellipse at center,#2a0606 0%,#0d0000 100%)' },
    rust_bg:        { label:'Rust',       style:'background:linear-gradient(135deg,#1e0800,#2e1000)' },
    carbon_bg:      { label:'Carbon',     style:'background:linear-gradient(135deg,#0e0e0e,#1a1a1a)' },
    chalk_bg:       { label:'Chalk',      style:'background:linear-gradient(135deg,#2a2a2a,#353535)' },
  };
  Object.assign(BG_PRESETS, extras);
}
setTimeout(_registerPackBgPresets, 100);

// ── Color set application ──────────────────────────────────
const COLORSET_VARS = {
  cs_bone:        { '--accent':'#e8dcc8','--accent2':'#c8b89a','--surface':'#0e0c0a','--surface2':'#1a1814' },
  cs_violet_hour: { '--accent':'#9b7fc4','--accent2':'#c47f9b','--surface':'#0c0a14','--surface2':'#161428' },
  cs_frost:       { '--accent':'#7fc4d4','--accent2':'#4a8fa8','--surface':'#080e14','--surface2':'#0e1828' },
  cs_copper:      { '--accent':'#c4845a','--accent2':'#a0603c','--surface':'#0e0800','--surface2':'#1a1008' },
  cs_ember_glow:  { '--accent':'#e08040','--accent2':'#c05010','--surface':'#100600','--surface2':'#1e0e00' },
  cs_rust_blush:  { '--accent':'#c46060','--accent2':'#a04040','--surface':'#0e0404','--surface2':'#180808' },
};

let equippedColorSet = localStorage.getItem('equippedColorSet') || 'none';

function applyColorSet(csId) {
  const root = document.documentElement;
  // Remove old colorset vars
  Object.keys(COLORSET_VARS).forEach(k => {
    Object.keys(COLORSET_VARS[k]).forEach(v => root.style.removeProperty(v));
  });
  if (csId !== 'none' && COLORSET_VARS[csId]) {
    Object.entries(COLORSET_VARS[csId]).forEach(([k, v]) => root.style.setProperty(k, v));
  }
  equippedColorSet = csId;
  localStorage.setItem('equippedColorSet', csId);
}

// Restore colorset on load
(function() { if (equippedColorSet !== 'none') applyColorSet(equippedColorSet); })();

// ── Buy a cosmetic pack (first item free) ──────────────────
function buyCosmPack(packId) {
  const pack = COSMETIC_PACKS.find(p => p.id === packId);
  if (!pack) return;
  if (ownedCosmPacks[packId]) { rewardPopup('Pack already owned!'); return; }
  if (sacramentCurrency < pack.packCost) { rewardPopup('Need more sacraments!'); return; }
  sacramentCurrency -= pack.packCost;
  ownedCosmPacks[packId] = { ownedItems: [pack.items[0].id] };
  saveCosmPacks();
  updateCurrencies();
  rewardPopup('Unlocked: ' + pack.name + ' — ' + pack.items[0].name + ' is yours!');
  renderBagNew();
}

// ── Buy a specific item within a pack ─────────────────────
function buyCosmPackItem(packId, itemId) {
  const pack = COSMETIC_PACKS.find(p => p.id === packId);
  if (!pack) return;
  if (!ownedCosmPacks[packId]) { rewardPopup('Buy the pack first!'); return; }
  const ownedItems = ownedCosmPacks[packId].ownedItems;
  if (ownedItems.includes(itemId)) { rewardPopup('Already unlocked!'); return; }

  // Must own the previous item (sequential)
  const idx = pack.items.findIndex(i => i.id === itemId);
  if (idx > 0 && !ownedItems.includes(pack.items[idx - 1].id)) {
    rewardPopup('Unlock the previous item first!'); return;
  }

  const itemDef = pack.items[idx];
  if (sacramentCurrency < itemDef.cost) { rewardPopup('Need more sacraments!'); return; }
  sacramentCurrency -= itemDef.cost;
  ownedItems.push(itemId);
  saveCosmPacks();
  updateCurrencies();
  rewardPopup('Unlocked: ' + itemDef.name + '!');
  renderBagPackDetail(packId);
}

// ── Equip a cosmetic pack item ─────────────────────────────
function equipCosmPackItem(packId, itemId) {
  const pack = COSMETIC_PACKS.find(p => p.id === packId);
  if (!pack) return;
  const item = pack.items.find(i => i.id === itemId);
  if (!item) return;

  if (pack.category === 'bg') {
    applyBg(item.data);
    rewardPopup('BG equipped: ' + item.name);
  } else if (pack.category === 'colorset') {
    if (equippedColorSet === item.data) {
      applyColorSet('none');
      rewardPopup('Color set removed');
    } else {
      applyColorSet(item.data);
      rewardPopup('Color set: ' + item.name);
    }
  }
  renderBagPackDetail(packId);
}

// ── Vial consumable ───────────────────────────────────────
const VIAL_SACRAMENT_AMOUNT = 50; // each vial1 grants 50 sacraments

let vialCount = parseInt(localStorage.getItem('vialCount') || '0');

function saveVials() { localStorage.setItem('vialCount', vialCount); }

function useVial() {
  if (vialCount <= 0) { rewardPopup('No vials left!'); return; }
  vialCount--;
  saveVials();
  sacramentCurrency += VIAL_SACRAMENT_AMOUNT;
  updateCurrencies();
  rewardPopup('+' + VIAL_SACRAMENT_AMOUNT + ' sacraments from Vial!');
  renderBagNew();
}

// Add vial to shop pool so it can be purchased with coins (as consumable)
(function _addVialToShop() {
  if (typeof shopPool !== 'undefined' && !shopPool.find(s => s.id === 'consumable_vial1')) {
    shopPool.push({
      id: 'consumable_vial1',
      name: 'Vial',
      type: 'consumable',
      data: 'vial1',
      cost: 200,        // cost in gamble coins (bought with coins at dealer or from shop)
      rarity: 'uncommon',
      desc: 'A small vial. Shatters to release +50 sacraments instantly.',
      coinCost: 200,    // explicit coin cost flag
    });
  }
})();

// ── Handle consumable_vial1 purchase from existing shop ───
function buyVialFromShop() {
  const cost = 200; // gamble coins
  if (gambleCurrency < cost) { rewardPopup('Need 200 coins!'); return; }
  gambleCurrency -= cost;
  vialCount++;
  saveVials();
  updateCurrencies();
  rewardPopup('Vial acquired! (' + vialCount + ' total)');
  renderBagNew();
}

// ============================================================
// BAG UI — NEW TWO-COLUMN LAYOUT (Phase 6.5)
// ============================================================

let _bagPackDetailOpen = null; // packId if detail view is open, else null

function renderBagNew() {
  const mode = document.getElementById('inventoryMode');
  if (!mode || mode.classList.contains('hidden')) return;
  
  const bagRoot = document.getElementById('bagNewRoot');
  if (!bagRoot) return;

  const favs = invLoadFavs ? invLoadFavs() : [];

  bagRoot.innerHTML = '';

  // ── Top bar ──
  const topBar = document.createElement('div');
  topBar.className = 'bag-top-bar';
  topBar.innerHTML = `
    <div style="font-family:'Space Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:var(--accent)">Bag</div>
    <button class="bag-fav-toggle ${_bagShowFavs?'active':''}" onclick="_bagToggleFavs()" title="Show starred">★ Starred</button>
  `;
  bagRoot.appendChild(topBar);

  if (_bagShowFavs) {
    _renderBagFavsView(bagRoot, favs);
    return;
  }

  // ── Two-column main area ──
  const cols = document.createElement('div');
  cols.className = 'bag-two-col';
  bagRoot.appendChild(cols);

  // Left: Titles
  const leftCol = document.createElement('div');
  leftCol.className = 'bag-col-titles';
  leftCol.innerHTML = '<div class="bag-col-header">Titles</div>';
  const titleItems = inventory.filter(i => i.type === 'title');
  if (titleItems.length === 0) {
    leftCol.innerHTML += '<div class="bag-empty-note">No titles yet.</div>';
  } else {
    titleItems.forEach(item => {
      const isEq = playerTitle === item.data;
      const isFav = favs.includes(item.id);
      const div = document.createElement('div');
      div.className = 'bag-title-row' + (isEq ? ' equipped' : '');
      div.innerHTML = `
        <span class="bag-title-name">${item.name.replace(/^Title:\s*/,'')}</span>
        <div style="display:flex;gap:4px;align-items:center">
          <button class="inv-fav-star ${isFav?'active':''}" onclick="invToggleFav('${item.id}');renderBagNew()" title="Star">★</button>
          <button class="bag-equip-sm ${isEq?'equipped-btn':''}" onclick="equipItem('${item.id}');renderBagNew()">
            ${isEq ? '✓' : 'Equip'}
          </button>
        </div>`;
      leftCol.appendChild(div);
    });
  }
  cols.appendChild(leftCol);

  // Right: Backgrounds (pack cards or detail view)
  const rightCol = document.createElement('div');
  rightCol.className = 'bag-col-bgs';
  cols.appendChild(rightCol);

  if (_bagPackDetailOpen) {
    _renderBagPackDetailInCol(rightCol, _bagPackDetailOpen);
  } else {
    rightCol.innerHTML = '<div class="bag-col-header">Backgrounds <span style="font-size:9px;opacity:0.5">(& Color Sets)</span></div>';
    const packGrid = document.createElement('div');
    packGrid.className = 'bag-pack-grid';
    rightCol.appendChild(packGrid);

    COSMETIC_PACKS.forEach(pack => {
      const owned = ownedCosmPacks[pack.id];
      const ownedCount = owned ? owned.ownedItems.length : 0;
      const totalCount = pack.items.length;
      const card = document.createElement('div');
      card.className = 'bag-pack-card' + (owned ? ' owned' : ' not-owned');
      card.style.background = pack.coverColor;
      card.onclick = () => { _bagPackDetailOpen = pack.id; renderBagNew(); };
      card.innerHTML = `
        <div class="bag-pack-name">${pack.name}</div>
        ${owned
          ? `<div class="bag-pack-prog">${ownedCount}/${totalCount}</div>`
          : `<div class="bag-pack-buy-overlay">
               <div style="font-size:10px;opacity:0.8">Buy</div>
               <div style="font-size:12px;font-weight:700">${pack.packCost} <img src="https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png" style="width:11px;height:11px;vertical-align:-1px;image-rendering:pixelated" alt=""></div>
               <button class="bag-pack-buy-btn" onclick="event.stopPropagation();buyCosmPack('${pack.id}')">Unlock</button>
             </div>`
        }`;
      packGrid.appendChild(card);
    });
  }

  // ── Bottom: Consumables ──
  const consRow = document.createElement('div');
  consRow.className = 'bag-consumables-row';
  consRow.innerHTML = '<div class="bag-col-header">Consumables</div>';
  const consInner = document.createElement('div');
  consInner.className = 'bag-cons-inner';

  // Vials
  if (vialCount > 0) {
    const vialEl = document.createElement('div');
    vialEl.className = 'bag-cons-item';
    vialEl.innerHTML = `
      <img src="https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/vial1.png" style="width:28px;height:28px;image-rendering:pixelated" alt="Vial">
      <div class="bag-cons-name">Vial</div>
      <div class="bag-cons-count">×${vialCount}</div>
      <button class="bag-equip-sm" onclick="useVial()" title="+${VIAL_SACRAMENT_AMOUNT} sacraments">Use</button>`;
    consInner.appendChild(vialEl);
  }

  // Streak freeze
  if (typeof streakFreezeCount !== 'undefined' && streakFreezeCount > 0) {
    const sfEl = document.createElement('div');
    sfEl.className = 'bag-cons-item';
    sfEl.innerHTML = `
      <span style="font-size:24px">❄️</span>
      <div class="bag-cons-name">Streak Freeze</div>
      <div class="bag-cons-count">×${streakFreezeCount}</div>`;
    consInner.appendChild(sfEl);
  }

  if (consInner.children.length === 0) {
    consInner.innerHTML = '<div class="bag-empty-note">No consumables.</div>';
  }
  consRow.appendChild(consInner);
  bagRoot.appendChild(consRow);

  // ── Bottom: Cursors ──
  const cursorItems = inventory.filter(i => i.type === 'cursor');
  if (cursorItems.length > 0) {
    const cursorRow = document.createElement('div');
    cursorRow.className = 'bag-cursors-row';
    cursorRow.innerHTML = '<div class="bag-col-header">Cursors</div>';
    const cGrid = document.createElement('div');
    cGrid.className = 'bag-cursor-grid';
    cursorItems.forEach(item => {
      const isEq = equippedCursor === (item.data || item.id);
      const div = document.createElement('div');
      div.className = 'bag-cons-item' + (isEq ? ' equipped' : '');
      div.innerHTML = `
        <div class="bag-cons-name" style="max-width:80px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.name}</div>
        <button class="bag-equip-sm ${isEq?'equipped-btn':''}" onclick="equipItem('${item.id}');renderBagNew()">${isEq?'✓':'Equip'}</button>`;
      cGrid.appendChild(div);
    });
    cursorRow.appendChild(cGrid);
    bagRoot.appendChild(cursorRow);
  }

  // ── Keep existing equipped preview ──
  let eqPanel = document.getElementById('eqPreviewPanel');
  if (!eqPanel) {
    eqPanel = document.createElement('div');
    eqPanel.id = 'eqPreviewPanel';
    eqPanel.className = 'eq-preview-panel';
    bagRoot.appendChild(eqPanel);
  } else {
    bagRoot.appendChild(eqPanel);
  }
  if (typeof renderEquippedPreviewPanel === 'function') renderEquippedPreviewPanel();
}

let _bagShowFavs = false;
function _bagToggleFavs() { _bagShowFavs = !_bagShowFavs; renderBagNew(); }

function _renderBagFavsView(root, favs) {
  const items = inventory.filter(i => favs.includes(i.id));
  const div = document.createElement('div');
  div.style.padding = '12px';
  if (items.length === 0) {
    div.innerHTML = '<div class="bag-empty-note">No starred items yet. Star items with ★.</div>';
  } else {
    div.innerHTML = items.map(item => {
      const isEq = (item.type === 'title' && playerTitle === item.data) ||
                   (item.type === 'bg' && equippedBg === item.data) ||
                   (item.type === 'cursor' && equippedCursor === (item.data || item.id));
      return `<div class="bag-title-row ${isEq?'equipped':''}">
        <span class="bag-title-name">${item.name}</span>
        <button class="bag-equip-sm ${isEq?'equipped-btn':''}" onclick="equipItem('${item.id}');renderBagNew()">${isEq?'✓':'Equip'}</button>
      </div>`;
    }).join('');
  }
  root.appendChild(div);
}

function _renderBagPackDetailInCol(col, packId) {
  const pack = COSMETIC_PACKS.find(p => p.id === packId);
  if (!pack) return;
  const owned = ownedCosmPacks[packId];
  const ownedItems = owned ? owned.ownedItems : [];

  col.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      <button class="bag-back-btn" onclick="_bagPackDetailOpen=null;renderBagNew()">← Back</button>
      <div>
        <div style="font-weight:800;font-size:14px">${pack.name}</div>
        <div style="font-size:11px;color:var(--muted)">${pack.desc}</div>
      </div>
    </div>`;

  pack.items.forEach((item, idx) => {
    const isOwned = ownedItems.includes(item.id);
    const isPrevOwned = idx === 0 || ownedItems.includes(pack.items[idx-1].id);
    const isNext = !isOwned && owned && isPrevOwned;
    const isEquipped = (pack.category === 'bg' && equippedBg === item.data) ||
                       (pack.category === 'colorset' && equippedColorSet === item.data);
    const isLocked = !isOwned && !isNext;

    const row = document.createElement('div');
    row.className = 'bag-pack-item-row' + (isLocked ? ' locked' : '') + (isEquipped ? ' equipped' : '');
    row.innerHTML = `
      <div class="bag-pack-item-name">${item.name}</div>
      <div style="display:flex;gap:6px;align-items:center">
        ${isOwned
          ? `<button class="bag-equip-sm ${isEquipped?'equipped-btn':''}" onclick="equipCosmPackItem('${pack.id}','${item.id}')">
               ${isEquipped ? '✓ On' : 'Equip'}
             </button>`
          : isNext
            ? `<button class="bag-equip-sm" onclick="buyCosmPackItem('${pack.id}','${item.id}')">
                 Unlock — ${item.cost} <img src="https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png" style="width:10px;height:10px;vertical-align:-1px;image-rendering:pixelated" alt="">
               </button>`
            : `<span style="font-family:'Space Mono',monospace;font-size:10px;color:var(--muted)">${isOwned?'Owned':'Locked'}</span>`
        }
      </div>`;
    col.appendChild(row);
  });
}

// Also expose renderBagPackDetail for the buyCosmPackItem callback
function renderBagPackDetail(packId) {
  _bagPackDetailOpen = packId;
  renderBagNew();
}


function updateCurrencies() {
  studyCoinsEl.textContent = sacramentCurrency;
  const sbSC = document.getElementById('sbStudyCoins');
  if (sbSC) sbSC.textContent = sacramentCurrency;
  gambleCoinsEl.textContent = gambleCurrency;
  playerTitleEl.textContent = playerTitle;
  applyTitleStyle(playerTitle);

  // Update dealer display if open
  const dt = document.getElementById('dealerSacraments');
  const dm = document.getElementById('dealerMoney');
  if (dt) dt.textContent = sacramentCurrency;
  if (dm) dm.textContent = gambleCurrency;

  localStorage.setItem('sacramentCurrency', sacramentCurrency);
  localStorage.setItem('gambleCurrency', gambleCurrency);
  localStorage.setItem('playerTitle', playerTitle);
}

function rewardPopup(text) {
  const pop = document.createElement('div');
  pop.className = 'reward-pop';
  // Use innerHTML so moon_tear img tags render
  if (/<[a-z][\s\S]*>/i.test(text)) {
    pop.innerHTML = text;
  } else {
    pop.textContent = text;
  }
  document.body.appendChild(pop);
  setTimeout(() => pop.remove(), 1600);
}

function rewardStudy(amount) {
  sacramentCurrency += amount;
  updateCurrencies();
  const _moonIcon = '<img src="https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png" style="width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated" alt="">';
  const _pop = document.createElement('div');
  _pop.className = 'reward-pop';
  _pop.innerHTML = '+' + amount + ' ' + _moonIcon + ' sacrament' + (amount !== 1 ? 's' : '');
  document.body.appendChild(_pop);
  setTimeout(() => _pop.remove(), 1600);
}

function rewardGamble(amount) {
  gambleCurrency += amount;
  updateCurrencies();
  rewardPopup('+' + amount + ' 💰 coins');
}

document.addEventListener('click', (e) => {
  const option = e.target.closest('.option');

  if (option && !option.classList.contains('locked')) {
    // Read correctness from onclick attribute BEFORE answerMCQ re-renders the DOM
    const onclickAttr = option.getAttribute('onclick') || '';
    const match = onclickAttr.match(/answerMCQ\((\d+)\)/);
    if (match) {
      const choiceIdx = parseInt(match[1]);
      const isCorrect = mcqPool[mcqIdx] && choiceIdx === mcqPool[mcqIdx].ans;
      if (isCorrect) {
        // MCQ correct = 1 ticket (awarded in answerMCQ); bonus gamble coin + flash only here
        rewardGamble(1);
        document.body.classList.add('unlock-flash');
        setTimeout(() => {
          document.body.classList.remove('unlock-flash');
        }, 700);
      }
    }
  }
});

function switchMode(mode, event) {
  // Hide all mode panels
  const allModes = ['flashMode','mcqMode','casinoMode','shopMode','inventoryMode',
                    'animeMode','kanaMode','reviewMode','learnedMode'];
  allModes.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  // Legacy IDs that may still exist
  ['frqMode','statsMode','deepStudyMode'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  document.body.classList.remove('bag-editing');
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

  const unitBar = document.getElementById('unitBar');
  if (unitBar) unitBar.style.display = 'none';

  // Show the chosen panel
  if (mode === 'flash')    document.getElementById('flashMode').classList.remove('hidden');
  if (mode === 'mcq')      document.getElementById('mcqMode').classList.remove('hidden');
  if (mode === 'anime')    document.getElementById('animeMode').classList.remove('hidden');
  if (mode === 'kana')     document.getElementById('kanaMode').classList.remove('hidden');
if (mode === 'review') {
    document.getElementById('reviewMode').classList.remove('hidden');
    try { revInit(); } catch(e) {}
  }
  if (mode === 'learned') {
    document.getElementById('learnedMode').classList.remove('hidden');
    try { initLearnedVault(); } catch(e) {}
  }
  if (mode === 'shop') {
    const shopEl = document.getElementById('shopMode');
    if (shopEl) { shopEl.classList.remove('hidden'); generateShopMain(); }
  }
  if (mode === 'casino')   document.getElementById('casinoMode').classList.remove('hidden');
  if (mode === 'inventory') {
    document.getElementById('inventoryMode').classList.remove('hidden');
    renderInventory();
    renderBagNew();
    renderBagWidgetsPanel();
    renderWidgetSlots();
    renderNavbarSlots();
  }

  if (event && event.target) event.target.classList.add('active');
  setTimeout(moveMascotNearActiveCard, 120);
}

// ============================================================
// ============================================================
// STATS MODAL
// ============================================================
function openStatsModal() {
  updateStats();
  document.getElementById('statsModal').classList.add('active');
}
function closeStatsModal() {
  document.getElementById('statsModal').classList.remove('active');
}
// Close on backdrop click
document.addEventListener('click', (e) => {
  const modal = document.getElementById('statsModal');
  if (modal && modal.classList.contains('active') && e.target === modal) {
    closeStatsModal();
  }
});

// ============================================================
// SHOP MODE (Black Market + Mystery Packs)
// ============================================================
function setShopTab(tab, el) {
  document.getElementById('shopPanelMarket').classList.toggle('hidden', tab !== 'market');
  document.getElementById('shopPanelMystery').classList.toggle('hidden', tab !== 'mystery');
  document.getElementById('shopPanelAuction').classList.toggle('hidden', tab !== 'auction');
  document.querySelectorAll('#shopMode .casino-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  if (tab === 'market') generateShopMain();
  if (tab === 'auction') auctionOpen();
}

function _shopBuyItem(item) {
  const ownedAlready = inventory.find(i => i.id === item.id);
  if (ownedAlready) {
    // Duplicate → convert to gems
    const gemReward = Math.max(10, Math.floor(item.cost * 0.15));
    gambleCurrency += gemReward;
    updateCurrencies();
    rewardPopup('Already owned! +' + gemReward + ' 🎰 (duplicate conversion)');
    generateShopMain();
    return;
  }
  if (gambleCurrency < item.cost) {
    rewardPopup('Not enough coins! Need ' + item.cost + ' 🎰');
    return;
  }
  gambleCurrency -= item.cost;
  addToInventory({id: item.id, name: item.name, type: item.type, data: item.data || item.name});
  if (item.type === 'theme') applyTheme(item.data);
  updateCurrencies();
  rewardPopup('Unlocked: ' + item.name + ' → check 🎒 Bag');
  generateShopMain();
}

function shopRenderCompletionBar() {
  const total = shopPool.length;
  const owned = shopPool.filter(item => inventory.find(i => i.id === item.id)).length;
  const pct = total ? Math.round(owned / total * 100) : 0;
  let el = document.getElementById('shopCompletionBar');
  if (!el) {
    const container = document.getElementById('shopItemsMain');
    if (!container) return;
    el = document.createElement('div');
    el.id = 'shopCompletionBar';
    el.className = 'shop-completion-bar';
    container.parentNode.insertBefore(el, container);
  }
  el.innerHTML = `
    <div class="shop-completion-label">
      <span>🏆 Collection</span>
      <span class="shop-completion-pct">${owned} / ${total} items · ${pct}%</span>
    </div>
    <div class="shop-completion-track"><div class="shop-completion-fill" style="width:${pct}%"></div></div>
  `;
}

function shopGetWeeklyItem() {
  const pool = shopPool.filter(i => ['vfx','bg','theme'].includes(i.type) && i.cost >= 600);
  if (!pool.length) return shopPool[0];
  const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const idx = weekNum % pool.length;
  return pool[idx];
}

function shopWeeklyTimeLeft() {
  const now = Date.now();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const msLeft = msPerWeek - (now % msPerWeek);
  const d = Math.floor(msLeft / 86400000);
  const h = Math.floor((msLeft % 86400000) / 3600000);
  const m = Math.floor((msLeft % 3600000) / 60000);
  return `${d}d ${h}h ${m}m`;
}

function renderShopWeeklyItem() {
  const item = shopGetWeeklyItem();
  const existing = document.getElementById('shopWeeklyPanel');
  if (existing) existing.remove();
  const container = document.getElementById('shopItemsMain');
  if (!container) return;
  const panel = document.createElement('div');
  panel.id = 'shopWeeklyPanel';
  panel.className = 'shop-weekly-panel';
  const owned = inventory.find(i => i.id === item.id);
  const typeEmoji = {title:'🏷️', theme:'🎨', effect:'✨', dialogue:'💬', vfx:'⚡', bg:'🖼️'}[item.type] || '📦';
  const discountedCost = Math.floor(item.cost * 0.85);
  panel.innerHTML = `
    <div class="shop-weekly-header">
      <span class="shop-weekly-badge">⭐ WEEKLY RARE</span>
      <span class="shop-weekly-timer">Resets in ${shopWeeklyTimeLeft()}</span>
    </div>
    <div class="shop-weekly-body">
      <div class="shop-weekly-icon">${typeEmoji}</div>
      <div class="shop-weekly-info">
        <div class="shop-weekly-name">${item.name}</div>
        <div class="shop-weekly-type">${item.type.toUpperCase()}</div>
        ${item.desc ? `<div class="shop-weekly-desc">${item.desc}</div>` : ''}
      </div>
      <div class="shop-weekly-right">
        <div class="shop-weekly-cost">${discountedCost} 🎰</div>
        <div class="shop-weekly-orig">${item.cost}</div>
        ${owned
          ? `<span class="shop-owned-tag">OWNED</span>`
          : `<button class="btn shop-weekly-btn">Buy</button>`
        }
      </div>
    </div>
  `;
  if (!owned) {
    const weeklyItem = { ...item, cost: discountedCost };
    panel.querySelector('.shop-weekly-btn').onclick = () => _shopBuyItem(weeklyItem);
  }
  container.parentNode.insertBefore(panel, container);
}

function generateShopMain() {
  const shop = document.getElementById('shopItemsMain');
  const timer = document.getElementById('shopTimerMain');
  if (!shop) return;

  shopRenderCompletionBar();
  renderShopWeeklyItem();

  const now = Date.now();
  const cycle = Math.floor(now / shopCycleTime);

  const seeded = [...shopPool].sort((a, b) => {
    const ha = Math.sin(cycle * 13.7 + shopPool.indexOf(a) * 97.3);
    const hb = Math.sin(cycle * 13.7 + shopPool.indexOf(b) * 97.3);
    return ha - hb;
  });
  const items = seeded.slice(0, 8);

  // Active category filter
  const activeCat = activeShopCat || 'all';

  shop.innerHTML = '';
  items.forEach(item => {
    if (activeCat !== 'all' && item.type !== activeCat) return;
    const owned = inventory.find(i => i.id === item.id);
    const canAfford = gambleCurrency >= item.cost;
    const div = document.createElement('div');
    div.className = 'shop-item' + (!canAfford && !owned ? ' shop-item--locked' : '');
    const typeEmoji = {title:'🏷️', theme:'🎨', effect:'✨', dialogue:'💬', vfx:'⚡', bg:'🖼️'}[item.type] || '📦';
    div.innerHTML = `
      <div style="flex:1;min-width:0">
        <div style="font-weight:700">${!canAfford && !owned ? '🔒 ' : ''}${typeEmoji} ${item.name}</div>
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-top:2px">${item.type}</div>
        ${item.desc ? `<div style="font-size:11px;color:var(--muted);margin-top:4px;line-height:1.4">${item.desc}</div>` : ''}
        ${!canAfford && !owned ? `<div style="font-size:10px;color:var(--wrong);margin-top:3px;font-family:'Space Mono',monospace">Need ${item.cost - gambleCurrency} more 🎰</div>` : ''}
      </div>
      ${owned
        ? `<button class="btn" style="font-size:11px;padding:5px 10px;white-space:nowrap;margin-left:10px;border-color:rgba(0,255,157,0.25);color:var(--correct)">+Dupe 🎰</button>`
        : canAfford
          ? `<button class="btn btn-secondary" style="font-size:12px;padding:7px 12px;white-space:nowrap;margin-left:10px">Buy ${item.cost} 🎰</button>`
          : `<button class="btn" style="font-size:12px;padding:7px 12px;white-space:nowrap;margin-left:10px;opacity:0.4;cursor:not-allowed" disabled>${item.cost} 🎰</button>`
      }
    `;
    if (owned || canAfford) {
      div.querySelector('button').onclick = () => _shopBuyItem(item);
    }
    shop.appendChild(div);
  });

  if (shop.children.length === 0) {
    shop.innerHTML = '<p style="color:var(--muted);font-size:13px;padding:12px 0">No items match this filter right now.</p>';
  }

  const msLeft = shopCycleTime - (now % shopCycleTime);
  const minsLeft = Math.ceil(msLeft / 60000);
  if (timer) timer.textContent = `Refreshes in ${minsLeft} min`;
}

// Patch filterShop to also refresh main shop if shopMode is visible
let activeShopCat = 'all';
function filterShop(cat, el) {
  activeShopCat = cat;
  document.querySelectorAll('.shop-cat-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  generateShopMain();
}

// CASINO TABS
// ============================================================
function setCasinoTab(tab, el) {
  document.querySelectorAll('.casino-panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.casino-tab').forEach(t => t.classList.remove('active'));
  const panelId = 'casino' + tab.charAt(0).toUpperCase() + tab.slice(1);
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.remove('hidden');
  el.classList.add('active');
  if (tab === 'dealer') updateCurrencies();
  if (tab === 'slots') buildSlotGrid();
}

// ============================================================
// SLOTS 3×5 ENGINE
// ============================================================
const SLOT_SYMBOLS = ['7️⃣','💎','🍒','🍋','🍊','🔔','⭐','🃏','🌙','🎯'];
const SLOT_WEIGHTS = [1, 2, 4, 5, 5, 6, 6, 7, 7, 8]; // lower = rarer
const SLOT_ROWS = 3, SLOT_COLS = 5;

let slotBet = 5;
let slotSpinning = false;
let slotGrid = Array.from({length: SLOT_ROWS}, () => Array(SLOT_COLS).fill('❓'));

function setSlotBet(amount, el) {
  if (slotSpinning) return; // disallow mid-spin bet changes
  slotBet = amount;
  document.querySelectorAll('.slot-bet-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('slotBetLabel').textContent = `Bet: ${amount} 🎰`;
}

function weightedSymbol() {
  const total = SLOT_WEIGHTS.reduce((a,b) => a+b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < SLOT_SYMBOLS.length; i++) {
    r -= SLOT_WEIGHTS[i];
    if (r <= 0) return SLOT_SYMBOLS[i];
  }
  return SLOT_SYMBOLS[SLOT_SYMBOLS.length - 1];
}

function buildSlotGrid() {
  const grid = document.getElementById('slotGrid5');
  if (!grid) return;
  grid.innerHTML = '';
  for (let r = 0; r < SLOT_ROWS; r++) {
    for (let c = 0; c < SLOT_COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'slot-cell';
      cell.id = `sc_${r}_${c}`;
      cell.textContent = slotGrid[r][c];
      grid.appendChild(cell);
    }
  }
}

function spinSlots5() {
  if (slotSpinning) return;
  if (gambleCurrency < slotBet) { rewardPopup('Not enough 🎰 coins'); return; }
  const lockedBet = slotBet; // lock bet at spin time - immune to mid-spin switching
  gambleCurrency -= lockedBet;
  updateCurrencies();
  slotSpinning = true;
  document.getElementById('slotSpinBtn').disabled = true;
  document.getElementById('slotResult').textContent = '';
  document.getElementById('slotPaylineDisplay').textContent = '';
  clearWinCells();

  // Animate each column independently, staggered stop
  const finalGrid = Array.from({length: SLOT_ROWS}, () =>
    Array.from({length: SLOT_COLS}, () => weightedSymbol())
  );

  let colsDone = 0;
  for (let c = 0; c < SLOT_COLS; c++) {
    const stopDelay = 400 + c * 280; // each col stops later
    const spinDur = stopDelay - 60;

    // Spin cells in this column
    for (let r = 0; r < SLOT_ROWS; r++) {
      const cell = document.getElementById(`sc_${r}_${c}`);
      if (cell) cell.classList.add('spinning');
    }

    // Tick random symbols
    const tickInterval = setInterval(() => {
      for (let r = 0; r < SLOT_ROWS; r++) {
        const cell = document.getElementById(`sc_${r}_${c}`);
        if (cell) cell.textContent = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
      }
    }, 80);

    setTimeout(() => {
      clearInterval(tickInterval);
      for (let r = 0; r < SLOT_ROWS; r++) {
        slotGrid[r][c] = finalGrid[r][c];
        const cell = document.getElementById(`sc_${r}_${c}`);
        if (cell) {
          cell.classList.remove('spinning');
          cell.textContent = finalGrid[r][c];
        }
      }
      colsDone++;
      if (colsDone === SLOT_COLS) {
        setTimeout(() => evaluateSlots5(lockedBet), 120);
      }
    }, stopDelay);
  }
}

function evaluateSlots5(lockedBet) {
  // RTP: ~93% | Win rate: ~85% | 3M-spin verified
  // ALL symbols pay on 3-of-a-kind. Pairs of rare symbols (idx 0-4) pay small.
  // Adjacent same-symbol bonuses for idx 0-3. Scatter pays 4+ of same anywhere.
  // Symbols by rarity idx: 0=7️⃣(rarest) … 9=🎯(common)
  const R5   = [18,  10,  7,   4.5, 4.5, 3,    3,    2,    2,    1.5 ];
  const R4   = [6,   3.5, 2,   1.5, 1.5, 1,    1,    0.75, 0.75, 0.5 ];
  const R3   = [2,   1.5, 0.75,0.5, 0.5, 0.5,  0.5,  0.25, 0.25, 0.25];
  const D5   = [18,  10,  7,   4.5, 4.5, 3,    3,    2,    2,    1.5 ];
  const SC4  = [7,   4.5, 3,   1.5, 1.5, 0.75, 0.75, 0.5,  0.5,  0   ];
  const PAIR = [0.6, 0.3, 0.25,0.15,0.15]; // pairs of rare symbols (idx 0–4)
  const ADJ  = [0.3, 0.25,0.15,0.1 ];      // adjacent matching pair bonus (idx 0–3)

  const SYMS = SLOT_SYMBOLS;
  const idxGrid = slotGrid.map(row => row.map(sym => SYMS.indexOf(sym)));
  let totalMult = 0;
  const wins = [];
  const winCellKeys = new Set();

  // ── Row paylines ─────────────────────────────────────────
  for (let r = 0; r < SLOT_ROWS; r++) {
    const row = idxGrid[r];
    const counts = {};
    row.forEach(s => counts[s] = (counts[s]||0)+1);

    for (const [sStr, cnt] of Object.entries(counts)) {
      const s = +sStr;
      if (cnt >= 5) {
        totalMult += R5[s];
        wins.push(`${SYMS[s]}×5 +${Math.floor(lockedBet*R5[s])}`);
        for (let c = 0; c < 5; c++) winCellKeys.add(`${r}_${c}`);
      } else if (cnt === 4) {
        totalMult += R4[s];
        wins.push(`${SYMS[s]}×4 +${Math.floor(lockedBet*R4[s])}`);
        row.forEach((sym,c) => { if (sym===s) winCellKeys.add(`${r}_${c}`); });
      } else if (cnt === 3) {
        totalMult += R3[s];
        wins.push(`${SYMS[s]}×3 +${Math.floor(lockedBet*R3[s])}`);
        row.forEach((sym,c) => { if (sym===s) winCellKeys.add(`${r}_${c}`); });
      } else if (cnt === 2 && s < PAIR.length) {
        totalMult += PAIR[s];
        wins.push(`${SYMS[s]} pair +${Math.floor(lockedBet*PAIR[s])}`);
        row.forEach((sym,c) => { if (sym===s) winCellKeys.add(`${r}_${c}`); });
      }
    }

    // Adjacent bonus
    for (let c = 0; c < SLOT_COLS-1; c++) {
      const s = row[c];
      if (s === row[c+1] && s < ADJ.length) {
        totalMult += ADJ[s];
        wins.push(`${SYMS[s]} adj ✨`);
        winCellKeys.add(`${r}_${c}`); winCellKeys.add(`${r}_${c+1}`);
      }
    }
  }

  // ── V-shape diagonal paylines ─────────────────────────────
  const vShapes = [[[0,0],[1,1],[2,2],[1,3],[0,4]], [[2,0],[1,1],[0,2],[1,3],[2,4]]];
  for (const shape of vShapes) {
    const syms = shape.map(([r,c]) => idxGrid[r][c]);
    const counts = {}; syms.forEach(s => counts[s] = (counts[s]||0)+1);
    for (const [sStr, cnt] of Object.entries(counts)) {
      const s = +sStr;
      if (cnt >= 5) {
        totalMult += D5[s];
        wins.push(`${SYMS[s]} diag! +${Math.floor(lockedBet*D5[s])}`);
        shape.forEach(([r,c]) => winCellKeys.add(`${r}_${c}`));
      } else if (cnt === 4) {
        const m = R4[s]*0.6;
        totalMult += m;
        wins.push(`${SYMS[s]}×4 diag +${Math.floor(lockedBet*m)}`);
        shape.forEach(([r,c]) => { if(idxGrid[r][c]===s) winCellKeys.add(`${r}_${c}`); });
      } else if (cnt === 3) {
        const m = R3[s]*0.4;
        if (m > 0) {
          totalMult += m;
          wins.push(`${SYMS[s]}×3 diag +${Math.floor(lockedBet*m)}`);
          shape.forEach(([r,c]) => { if(idxGrid[r][c]===s) winCellKeys.add(`${r}_${c}`); });
        }
      }
    }
  }

  // ── Scatter: 4+ of same symbol anywhere on board ──────────
  const flat = idxGrid.flat();
  const scCounts = {}; flat.forEach(s => scCounts[s] = (scCounts[s]||0)+1);
  for (const [sStr, cnt] of Object.entries(scCounts)) {
    if (cnt >= 4) {
      const s = +sStr;
      if (s < SC4.length && SC4[s] > 0) {
        const m = SC4[s] * (1 + (cnt-4)*0.5);
        totalMult += m;
        wins.push(`${SYMS[s]} scatter×${cnt} +${Math.floor(lockedBet*m)}`);
        idxGrid.forEach((row,r) => row.forEach((sym,c) => { if(sym===s) winCellKeys.add(`${r}_${c}`); }));
      }
    }
  }

  // ── Apply results ─────────────────────────────────────────
  highlightWinCells([...winCellKeys]);
  const payout = totalMult > 0 ? Math.floor(lockedBet * totalMult) : 0;
  const resultEl = document.getElementById('slotResult');
  const paylineEl = document.getElementById('slotPaylineDisplay');

  if (wins.length > 0) {
    gambleCurrency += payout;
    updateCurrencies();
    // Show up to 4 win labels, then "+N more"
    paylineEl.textContent = wins.slice(0,4).join(' · ') + (wins.length > 4 ? ` +${wins.length-4} more` : '');
    const cls = totalMult >= 25 ? 'win-mega' : totalMult >= 10 ? 'win-big' : totalMult >= 3 ? 'win-mid' : 'win-small';
    resultEl.innerHTML = `<span class="${cls}">+${payout} 🎰${wins.length > 1 ? ` <span style="font-size:11px;opacity:0.7">(${wins.length} wins!)</span>` : ''}</span>`;
    if (totalMult >= 20) triggerJackpot(payout);
    else if (totalMult >= 8) { spawnCoins(14, payout); playSound('correct'); }
    else { spawnCoins(Math.min(wins.length * 2 + 2, 10), payout); playSound('correct'); }
  } else {
    resultEl.innerHTML = `<span style="color:var(--wrong)">No match - spin again</span>`;
    paylineEl.textContent = '';
    playSound('wrong');
  }

  slotSpinning = false;
  document.getElementById('slotSpinBtn').disabled = false;
}


function highlightWinCells(keys) {
  keys.forEach(key => {
    const [r, c] = key.split('_');
    const cell = document.getElementById(`sc_${r}_${c}`);
    if (cell) cell.classList.add('win-cell');
  });
}

function clearWinCells() {
  document.querySelectorAll('.slot-cell.win-cell').forEach(c => c.classList.remove('win-cell'));
}

function triggerJackpot(payout) {
  playSound('jackpot');
  // Screen flash
  const flash = document.createElement('div');
  flash.className = 'jackpot-flash';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 900);
  // Screen shake
  const card = document.getElementById('slotMachineCard');
  if (card) {
    card.style.animation = 'screenShake 0.5s ease';
    setTimeout(() => card.style.animation = '', 520);
  }
  // Coins
  spawnCoins(28, payout);
  // Popup
  setTimeout(() => rewardPopup(`🎉 JACKPOT! +${payout} 🎰`), 200);
}

function spawnCoins(count, payout) {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight * 0.4;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'coin-particle';
    el.textContent = '🪙';
    const angle = (i / count) * 360 + Math.random() * 20;
    const dist = 80 + Math.random() * 160;
    const tx = Math.cos(angle * Math.PI / 180) * dist;
    const ty = Math.sin(angle * Math.PI / 180) * dist - 60;
    const rot = (Math.random() - 0.5) * 720;
    el.style.cssText = `
      left: ${cx}px; top: ${cy}px;
      --cx: ${tx}px; --cy: ${ty}px; --cr: ${rot}deg;
      animation-duration: ${0.6 + Math.random() * 0.6}s;
      animation-delay: ${Math.random() * 0.2}s;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }
}

// Auto-spin ×5
let autoSpinCount = 0;
function spinSlots5Auto() {
  if (slotSpinning || autoSpinCount > 0) return;
  autoSpinCount = 5;
  function doNext() {
    if (autoSpinCount <= 0 || gambleCurrency < slotBet) {
      autoSpinCount = 0;
      return;
    }
    autoSpinCount--;
    spinSlots5();
    // Wait for spin to finish then do next
    const wait = setInterval(() => {
      if (!slotSpinning) {
        clearInterval(wait);
        if (autoSpinCount > 0) setTimeout(doNext, 400);
      }
    }, 100);
  }
  doNext();
}

// Init the grid on page load
window.addEventListener('load', () => {
  for (let r = 0; r < SLOT_ROWS; r++)
    for (let c = 0; c < SLOT_COLS; c++)
      slotGrid[r][c] = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
  buildSlotGrid();
});

// Legacy spinSlots stub (no longer used but kept for safety)
function spinSlots() { spinSlots5(); }

// ============================================================
// BLACKJACK ENGINE
// ============================================================
const CARD_SUITS = ['♠','♥','♦','♣'];
const CARD_VALS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
let bjDeck = [], bjPlayer = [], bjDealer = [], bjBet = 0, bjLastBet = 0, bjInProgress = false, bjDoubleUnlocked = false;

function buildDeck() {
  const deck = [];
  CARD_SUITS.forEach(s => CARD_VALS.forEach(v => deck.push({s, v})));
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function cardValue(card) {
  if (['J','Q','K'].includes(card.v)) return 10;
  if (card.v === 'A') return 11;
  return parseInt(card.v);
}

function handTotal(hand) {
  let total = hand.reduce((s, c) => s + cardValue(c), 0);
  let aces = hand.filter(c => c.v === 'A').length;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function setBjBet(amount, el) {
  bjBet = amount;
  document.querySelectorAll('.bj-chip').forEach(c => c.classList.remove('selected'));
  // el may be passed via onclick; fall back to event.target if not provided
  const chip = el || (typeof event !== 'undefined' && event.target) || null;
  if (chip) chip.classList.add('selected');
  document.getElementById('bjBetDisplay').textContent = `Bet: ${bjBet} 🎰`;
}

function renderBjCards(containerId, hand, hideSecond = false) {
  const el = document.getElementById(containerId);
  el.innerHTML = hand.map((c, i) => {
    if (hideSecond && i === 1) return `<div class="bj-card hidden-card"></div>`;
    const red = ['♥','♦'].includes(c.s);
    return `<div class="bj-card ${red ? 'red' : ''}">
      <span style="font-size:14px">${c.v}</span>
      <span class="bj-card-suit">${c.s}</span>
    </div>`;
  }).join('');
}

function bjDeal() {
  if (bjBet === 0) { rewardPopup('Select a bet first!'); return; }
  if (gambleCurrency < bjBet) { rewardPopup('Not enough 💰 coins!'); return; }

  gambleCurrency -= bjBet;
  updateCurrencies();

  bjDeck = buildDeck();
  bjPlayer = [bjDeck.pop(), bjDeck.pop()];
  bjDealer = [bjDeck.pop(), bjDeck.pop()];
  bjInProgress = true;
  bjDoubleUnlocked = false;

  document.getElementById('bjTable').style.display = 'block';
  document.getElementById('bjResult').textContent = '';
  document.getElementById('bjTriviaWrap').classList.add('hidden');

  renderBjCards('bjPlayerCards', bjPlayer);
  renderBjCards('bjDealerCards', bjDealer, true);
  document.getElementById('bjPlayerVal').textContent = `Value: ${handTotal(bjPlayer)}`;
  document.getElementById('bjDealerVal').textContent = `Value: ?`;

  // Show action buttons
  document.getElementById('bjDealBtn').classList.add('hidden');
  document.getElementById('bjHitBtn').classList.remove('hidden');
  document.getElementById('bjStandBtn').classList.remove('hidden');
  document.getElementById('bjDoubleBtn').classList.remove('hidden');
  document.getElementById('bjDoubleBtn').disabled = true;
  document.getElementById('bjDoubleBtn').textContent = 'Double Down 🔒 (answer trivia)';

  // Check blackjack
  if (handTotal(bjPlayer) === 21) {
    bjResolve();
    return;
  }

  // Load trivia question for double-down unlock
  loadBjTrivia();
}

function loadBjTrivia() {
  const pool = [...(APP_MCQ || []), ...getActivePackQuestions('mcq')];
  const q = pool[Math.floor(Math.random() * pool.length)];
  document.getElementById('bjTriviaWrap').classList.remove('hidden');
  document.getElementById('bjTriviaQ').textContent = q.q;
  const letters = ['A','B','C','D'];
  document.getElementById('bjTriviaOpts').innerHTML = q.opts.map((o, i) => `
    <button class="option" style="padding:8px 12px;font-size:13px" onclick="answerBjTrivia(${i}, ${q.ans})">
      <span class="opt-letter">${letters[i]}</span><span>${o}</span>
    </button>`).join('');
}

function answerBjTrivia(choice, correct) {
  document.querySelectorAll('#bjTriviaOpts .option').forEach((b, i) => {
    b.classList.add('locked');
    if (i === correct) b.classList.add('correct');
    else if (i === choice && choice !== correct) b.classList.add('wrong');
    else b.classList.add('dim');
  });
  if (choice === correct) {
    bjDoubleUnlocked = true;
    document.getElementById('bjDoubleBtn').disabled = false;
    document.getElementById('bjDoubleBtn').textContent = 'Double Down ✓ UNLOCKED';
    document.getElementById('bjDoubleBtn').style.borderColor = 'var(--correct)';
    rewardStudy(2);
    showMascotBubble(randomLine('correct'));
  } else {
    showMascotBubble(randomLine('wrong'));
  }
}

function bjHit() {
  if (!bjInProgress) return;
  bjPlayer.push(bjDeck.pop());
  renderBjCards('bjPlayerCards', bjPlayer);
  const total = handTotal(bjPlayer);
  document.getElementById('bjPlayerVal').textContent = `Value: ${total}`;
  if (total > 21) bjResolve();
}

function bjStand() {
  if (!bjInProgress) return;
  // Dealer plays
  while (handTotal(bjDealer) < 17) bjDealer.push(bjDeck.pop());
  bjResolve();
}

function bjDouble() {
  if (!bjInProgress || !bjDoubleUnlocked) return;
  if (gambleCurrency < bjBet) { rewardPopup('Not enough 💰 coins to double!'); return; }
  gambleCurrency -= bjBet;
  bjBet *= 2;
  updateCurrencies();
  bjPlayer.push(bjDeck.pop());
  renderBjCards('bjPlayerCards', bjPlayer);
  document.getElementById('bjPlayerVal').textContent = `Value: ${handTotal(bjPlayer)}`;
  if (handTotal(bjPlayer) > 21) { bjResolve(); return; }
  bjStand();
}

function bjResolve() {
  bjInProgress = false;
  const playerTotal = handTotal(bjPlayer);
  const dealerTotal = handTotal(bjDealer);

  renderBjCards('bjPlayerCards', bjPlayer);
  renderBjCards('bjDealerCards', bjDealer);
  document.getElementById('bjDealerVal').textContent = `Value: ${dealerTotal}`;
  document.getElementById('bjTriviaWrap').classList.add('hidden');

  const resultEl = document.getElementById('bjResult');
  let msg = '', win = false;

  if (playerTotal > 21) {
    msg = `💀 Bust (${playerTotal}) - Lost ${bjBet} 🎰`;
  } else if (dealerTotal > 21 || playerTotal > dealerTotal) {
    const payout = playerTotal === 21 && bjPlayer.length === 2 ? Math.floor(bjBet * 2.5) : bjBet * 2;
    gambleCurrency += payout;
    win = true;
    msg = playerTotal === 21 && bjPlayer.length === 2
      ? `🃏 BLACKJACK! +${payout} 🎰`
      : `✅ Win! +${payout} 🎰`;
  } else if (playerTotal === dealerTotal) {
    gambleCurrency += bjBet; // push
    msg = `🤝 Push - Bet returned`;
  } else {
    msg = `❌ Dealer wins (${dealerTotal} vs ${playerTotal}) - Lost ${bjBet} 🎰`;
  }

  resultEl.innerHTML = `<span style="color:${win ? 'var(--correct)' : playerTotal > 21 ? 'var(--wrong)' : 'var(--muted)'}">${msg}</span>`;

  // Reset buttons
  document.getElementById('bjDealBtn').classList.remove('hidden');
  document.getElementById('bjHitBtn').classList.add('hidden');
  document.getElementById('bjStandBtn').classList.add('hidden');
  document.getElementById('bjDoubleBtn').classList.add('hidden');
  document.getElementById('bjDoubleBtn').style.borderColor = '';

  // Restore previous bet so player can re-deal immediately
  bjLastBet = bjBet; // save before resetting
  bjBet = bjLastBet;
  document.getElementById('bjBetDisplay').textContent = `Bet: ${bjBet} 🎰`;
  // Re-highlight the matching chip
  document.querySelectorAll('.bj-chip').forEach(c => {
    const chipVal = parseInt(c.textContent.replace(/[^0-9]/g,''));
    c.classList.toggle('selected', chipVal === bjBet);
  });

  updateCurrencies();
  if (win) triggerMascotDere('correct');
  else triggerMascotDere('wrong');
}

// ============================================================
// SHOP CATEGORY FILTER
// ============================================================
let shopCycleTime = 20 * 60 * 1000; // 20 min shop rotation



// ============================================================
// STREAK SYSTEM
// ============================================================
let mcqStreak = 0;

function updateStreak(correct) {
  if (correct) {
    mcqStreak++;
    const badge = document.getElementById('streakBadge');
    const countEl = document.getElementById('streakCount');
    if (mcqStreak >= 3) {
      badge.style.display = 'inline-flex';
      countEl.textContent = mcqStreak;
    }
    if (mcqStreak > 0 && mcqStreak % 5 === 0) {
      const rarity = mcqStreak >= 20 ? 'legendary' : mcqStreak >= 15 ? 'epic' : mcqStreak >= 10 ? 'rare' : 'common';
      setTimeout(() => openLootBox(rarity), 600);
    }
  } else {
    mcqStreak = 0;
    document.getElementById('streakBadge').style.display = 'none';
  }
}

function generateShop() {
  // Black market moved to Shop tab - regenerate if shopMode is visible
  if (document.getElementById('shopMode') && !document.getElementById('shopMode').classList.contains('hidden')) {
    generateShopMain();
  }
}

// ============================================================
// SOUND SYSTEM
// ============================================================
let soundEnabled = localStorage.getItem('soundEnabled') === 'true';

function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem('soundEnabled', soundEnabled);
  const btn = document.getElementById('soundToggleBtn');
  if (btn) btn.textContent = soundEnabled ? 'ON' : 'OFF';
  if (soundEnabled) btn.style.color = 'var(--correct)';
  else btn.style.color = 'var(--muted)';
}

function playSound(type) {
  if (!soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(); osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'wrong') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(180, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(); osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'jackpot') {
      const freqs = [523, 659, 784, 1047, 1319];
      freqs.forEach((f, i) => {
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        o2.frequency.value = f;
        o2.type = 'sine';
        g2.gain.setValueAtTime(0, ctx.currentTime + i*0.1);
        g2.gain.linearRampToValueAtTime(0.25, ctx.currentTime + i*0.1 + 0.05);
        g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i*0.1 + 0.3);
        o2.start(ctx.currentTime + i*0.1);
        o2.stop(ctx.currentTime + i*0.1 + 0.3);
      });
    }
  } catch(e) {}
}

// Wire sound to MCQ answers
document.addEventListener('click', (e) => {
  const option = e.target.closest('.option');
  if (option) {
    setTimeout(() => {
      if (option.classList.contains('correct')) playSound('correct');
      else if (option.classList.contains('wrong')) playSound('wrong');
    }, 100);
  }
});

// Init sound button state
window.addEventListener('load', () => {
  const btn = document.getElementById('soundToggleBtn');
  if (btn) {
    btn.textContent = soundEnabled ? 'ON' : 'OFF';
    btn.style.color = soundEnabled ? 'var(--correct)' : 'var(--muted)';
  }
});

// ============================================================
// EXPORT STATS
// ============================================================
function exportStats() {
  const total = session.mcqC + session.mcqW;
  const pct = total ? Math.round(session.mcqC/total*100) : 0;
  const text = [
    '=== Neuroverse 日本語 Session Stats ===',
    `Date: ${new Date().toLocaleDateString()}`,
    '',
    `MCQ Correct: ${session.mcqC}`,
    `MCQ Wrong: ${session.mcqW}`,
    `MCQ Score: ${pct}%`,
    `Flashcards Known: ${session.fcKnow}`,
    `Flashcards Review: ${session.fcMiss}`,
    '',
    `📘 Sacraments: ${sacramentCurrency}`,
    `🎰 Casino Chips: ${gambleCurrency}`,
    `Title: ${playerTitle}`,
    '',
    '=== Unit Breakdown (Questions Available) ===',
    ...[1,2,3,4,5,6,7,8,9].map(u =>
      `U${u}: ${(APP_MCQ||[]).filter(q=>q.unit===u).length} MCQ · ${(APP_FLASHCARDS||[]).filter(f=>f.unit===u).length} FC`
    ),
  ].join('\n');
  
  navigator.clipboard.writeText(text).then(() => {
    rewardPopup('📋 Stats copied to clipboard!');
  }).catch(() => {
    prompt('Copy your stats:', text);
  });
}

// ============================================================
// LOOT BOX SYSTEM
// ============================================================

const LOOT_CONFIG = {
  common:    { label: '🟫 COMMON',    cssClass: 'loot-rarity-common',    icon: '📦', moneyRange: [2, 5],   shards: 1,   shardChoice: false },
  rare:      { label: '🟦 RARE',      cssClass: 'loot-rarity-rare',      icon: '💎', moneyRange: [5, 12],  shards: 2,   shardChoice: false },
  epic:      { label: '🟪 EPIC',      cssClass: 'loot-rarity-epic',      icon: '✨', moneyRange: [10, 25], shards: 3,   shardChoice: true  },
  legendary: { label: '🟨 LEGENDARY', cssClass: 'loot-rarity-legendary', icon: '🌟', moneyRange: [20, 50], shards: 5,   shardChoice: true  },
};

let lootPendingMoney = 0;
let lootPendingShards = 0;
let lootPendingShardType = 'bj'; // 'bj' or 'spin'

function openLootBox(rarity) {
  const cfg = LOOT_CONFIG[rarity];
  const money = Math.floor(Math.random() * (cfg.moneyRange[1] - cfg.moneyRange[0] + 1)) + cfg.moneyRange[0];
  const shardType = cfg.shardChoice ? (Math.random() > 0.5 ? 'bj' : 'spin') : (Math.random() > 0.5 ? 'bj' : 'spin');
  const shards = cfg.shards;

  lootPendingMoney = money;
  lootPendingShards = shards;
  lootPendingShardType = shardType;

  // Reset card state
  const overlay = document.getElementById('lootBoxOverlay');
  const flipInner = document.getElementById('lootBoxFlipInner');
  const rarityLabel = document.getElementById('lootBoxRarityLabel');
  const iconEl = document.getElementById('lootBoxIcon');
  const closedIcon = document.getElementById('lootBoxClosedIcon');
  const rewardsEl = document.getElementById('lootBoxRewards');
  const titleEl = document.getElementById('lootBoxTitle');
  const subEl = document.getElementById('lootBoxSubtitle');
  const claimBtn = document.getElementById('lootClaimBtn');

  flipInner.classList.remove('flipped');
  rewardsEl.style.display = 'none';
  claimBtn.style.display = 'none';
  document.getElementById('lootParticles').innerHTML = '';

  closedIcon.textContent = '📦';
  iconEl.textContent = cfg.icon;
  titleEl.textContent = rarity.charAt(0).toUpperCase() + rarity.slice(1) + ' Box';
  subEl.textContent = `${mcqStreak} answer streak!`;

  rarityLabel.className = 'loot-rarity-' + rarity;
  rarityLabel.textContent = cfg.label;

  // Show overlay
  overlay.classList.add('active');
  playSound('jackpot');

  // After short pause, flip the box
  setTimeout(() => {
    flipInner.classList.add('flipped');

    // After flip completes, show particles + rewards
    setTimeout(() => {
      spawnLootParticles(rarity);
      rewardsEl.innerHTML = `
        <div class="loot-reward-row">🎰 <strong>+${money}</strong> <span>coins</span></div>
        <div class="loot-reward-row">${shardType === 'bj' ? '🃏' : '🌀'} <strong>+${shards}</strong> <span>${shardType === 'bj' ? 'Blackjack Shards' : 'Daily Spin Shards'}</span></div>
      `;
      rewardsEl.style.display = 'flex';
      claimBtn.style.display = 'inline-block';
    }, 650);
  }, 700);
}

function spawnLootParticles(rarity) {
  const colors = {
    common: ['#cd7f32','#e8a45a','#f5c278'],
    rare: ['#6699ff','#88bbff','#aaccff'],
    epic: ['#bb66ff','#dd88ff','#9944dd'],
    legendary: ['#ffd32a','#ffee88','#ff9f43','#fff'],
  }[rarity] || ['#fff'];

  const container = document.getElementById('lootParticles');
  container.innerHTML = '';
  const cx = 50, cy = 50; // percent center

  for (let i = 0; i < 28; i++) {
    const el = document.createElement('div');
    el.className = 'loot-particle';
    const angle = (i / 28) * 360 + Math.random() * 15;
    const dist = 80 + Math.random() * 120;
    const tx = Math.cos(angle * Math.PI / 180) * dist;
    const ty = Math.sin(angle * Math.PI / 180) * dist;
    const color = colors[Math.floor(Math.random() * colors.length)];
    el.style.cssText = `
      left: ${cx}%; top: ${cy}%;
      background: ${color};
      width: ${4 + Math.random() * 6}px;
      height: ${4 + Math.random() * 6}px;
      --tx: ${tx}px; --ty: ${ty}px;
      animation-delay: ${Math.random() * 0.2}s;
      animation-duration: ${0.7 + Math.random() * 0.4}s;
      box-shadow: 0 0 4px ${color};
    `;
    container.appendChild(el);
  }
}

function closeLootBox() {
  gambleCurrency += lootPendingMoney;
  if (lootPendingShardType === 'bj') {
    bjShards += lootPendingShards;
    localStorage.setItem('bjShards', bjShards);
  } else {
    spinShards += lootPendingShards;
    localStorage.setItem('spinShards', spinShards);
  }
  updateCurrencies();
  rewardPopup(`+${lootPendingMoney} 💰 + ${lootPendingShards} shards!`);
  document.getElementById('lootBoxOverlay').classList.remove('active');
}


// ============================================================
// TITLE VISUAL STYLES
// ============================================================
const TITLE_STYLE_MAP = {
  // Legendary/shimmer titles
  'BEATORICHHHEEEEE': 'title-legendary',
  'Eternal Witch': 'title-legendary',
  'eclipse 🤤': 'title-legendary',
  // Cursed/red
  'evil': 'title-cursed',
  'coach cuck': 'title-cursed',
  'salamander hater': 'title-cursed',
  // Void/invisible
  'omega': 'title-void',
  // Neon
  'neurotic': 'title-neon',
  'uwuking': 'title-neon',
  'uwuqueen': 'title-neon',
  // Glitch
  'double hand twister': 'title-glitch',
  'gambler': 'title-glitch',
  'chuunibyou': 'title-glitch',
  // Rainbow
  'uwumaster': 'title-rainbow',
  'uwulord': 'title-rainbow',
  'cutie': 'title-rainbow',
  'tsundere': 'title-rainbow',
};

function applyTitleStyle(titleText) {
  const el = document.getElementById('playerTitle');
  if (!el) return;
  // Remove all title style classes
  el.className = el.className.replace(/title-\S+/g, '').trim();
  const styleClass = TITLE_STYLE_MAP[titleText];
  if (styleClass) {
    el.classList.add(styleClass);
    el.setAttribute('data-text', titleText); // for glitch ::before
  }
}

// ============================================================
// INTERACTION PARTICLES (gated behind VFX packs)
// ============================================================
function getVfxColors() {
  // Returns [tabColor, btnColor, correctColor, wrongColor, correctCount, wrongCount]
  switch(equippedVfx) {
    case 'arcane':
      return ['#bb66ff', '#9a7cff', '#cc88ff', '#ff4757', 14, 10];
    case 'overdrive':
      return ['#ffd32a', '#ff9f43', '#00ff9d', '#ff4757', 22, 16];
    default: // basic
      return ['var(--accent3)', 'var(--accent)', 'var(--correct)', 'var(--wrong)', 10, 8];
  }
}

function spawnInteractionParticles(x, y, color = 'var(--accent)', count = 10) {
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'interaction-particle';
    const angle = (i / count) * 360 + Math.random() * 20;
    const dist = 30 + Math.random() * 60;
    const tx = Math.cos(angle * Math.PI / 180) * dist;
    const ty = Math.sin(angle * Math.PI / 180) * dist;
    // Overdrive: mix shapes
    const isOverdrive = equippedVfx === 'overdrive';
    const size = isOverdrive ? (4 + Math.random() * 8) : (3 + Math.random() * 5);
    const borderRadius = isOverdrive && Math.random() > 0.5 ? '2px' : '50%';
    el.style.cssText = `
      left: ${x}px; top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      border-radius: ${borderRadius};
      background: ${color};
      --tx: ${tx}px; --ty: ${ty}px;
      animation-duration: ${0.4 + Math.random() * 0.4}s;
      box-shadow: 0 0 ${isOverdrive ? 8 : 4}px ${color};
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }
}

function spawnCorrectBurst(x, y) {
  const [,, correctColor,, correctCount] = getVfxColors();
  spawnInteractionParticles(x, y, correctColor, correctCount);
  // Floating +5 text
  const txt = document.createElement('div');
  txt.className = 'correct-burst-text';
  txt.textContent = '+1 <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''>';
  txt.style.left = (x - 20) + 'px';
  txt.style.top = (y - 20) + 'px';
  document.body.appendChild(txt);
  setTimeout(() => txt.remove(), 1000);
}

function spawnTabSwitchFlash() {
  const el = document.createElement('div');
  el.className = 'tab-switch-flash';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 400);
}

// Intercept tab clicks for flash
document.addEventListener('click', (e) => {
  // Only fire interaction particles if a VFX pack is equipped
  if (equippedVfx === 'none') return;

  const tab = e.target.closest('.tab');
  if (tab) {
    spawnTabSwitchFlash();
    spawnInteractionParticles(e.clientX, e.clientY, 'var(--accent3)', 8);
  }
  
  // Button sparks
  const btn = e.target.closest('.btn');
  if (btn && !btn.closest('.tabs') && !btn.closest('.casino-tabs')) {
    spawnInteractionParticles(e.clientX, e.clientY, 'var(--accent)', 6);
  }

  // Correct answer burst
  const option = e.target.closest('.option');
  if (option) {
    setTimeout(() => {
      if (option.classList.contains('correct')) {
        spawnCorrectBurst(e.clientX, e.clientY);
      } else if (option.classList.contains('wrong')) {
        spawnInteractionParticles(e.clientX, e.clientY, 'var(--wrong)', 8);
      }
    }, 150);
  }
});

// ============================================================
// RAIN EFFECT
// ============================================================
let rainInterval = null;
// rainAngle: 0 = straight down, positive = right, negative = left
// stored as px of horizontal drift per full drop fall (110vh travel)
// 0 = vertical, ~60 = gentle right, ~-60 = gentle left, ~120 = hard right
let rainAngle = parseInt(localStorage.getItem('rainAngle') || '35');

function setRainAngle(val) {
  rainAngle = parseInt(val);
  localStorage.setItem('rainAngle', rainAngle);
  const lbl = document.getElementById('rainAngleLabel');
  if (lbl) {
    const abs = Math.abs(rainAngle);
    const dir = rainAngle === 0 ? 'Straight ↓' : rainAngle > 0 ? `→ ${abs}px drift` : `← ${abs}px drift`;
    lbl.textContent = dir;
  }
  // Also update the CSS rain streak angle (body.theme-rain::after)
  // rainAngle px over 110vh maps to a degree offset from 180deg
  const deg = 180 + Math.atan2(rainAngle, window.innerHeight * 1.1) * (180 / Math.PI);
  let rainCssStyle = document.getElementById('__rainAngleStyle');
  if (!rainCssStyle) {
    rainCssStyle = document.createElement('style');
    rainCssStyle.id = '__rainAngleStyle';
    document.head.appendChild(rainCssStyle);
  }
  rainCssStyle.textContent = `
    body.theme-rain::after {
      background: repeating-linear-gradient(
        ${deg.toFixed(1)}deg,
        transparent 0px, transparent 40px,
        rgba(120,180,255,0.03) 40px, rgba(120,180,255,0.03) 41px
      ) !important;
    }
  `;
  // Restart if rain is currently running
  if (rainInterval) { stopRainEffect(); startRainEffect(); }
}

function startRainEffect() {
  if (rainInterval) return;
  const baseAngle = rainAngle; // use the chosen angle
  rainInterval = setInterval(() => {
    const drop = document.createElement('div');
    drop.className = 'rain-drop';
    const dur = 0.45 + Math.random() * 0.55;
    const jitter = (Math.random() * 10 - 5); // small random variation per drop
    const rx = baseAngle + jitter;
    drop.style.cssText = `
      left: ${Math.random() * 115 - 5}vw;
      height: ${14 + Math.random() * 22}px;
      background: linear-gradient(180deg, transparent, rgba(120,180,255,0.38));
      animation-duration: ${dur}s;
      --rx: ${rx}px;
      transform: skewX(${-Math.round(rx / 6)}deg);
    `;
    document.body.appendChild(drop);
    setTimeout(() => drop.remove(), dur * 1000 + 100);
  }, 55);
}
function stopRainEffect() {
  if (rainInterval) { clearInterval(rainInterval); rainInterval = null; }
  document.querySelectorAll('.rain-drop').forEach(d => d.remove());
}

// ============================================================
// MATRIX EFFECT
// ============================================================
let matrixInterval = null;
const matrixChars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
function startMatrixEffect() {
  if (matrixInterval) return;
  matrixInterval = setInterval(() => {
    const el = document.createElement('div');
    el.className = 'effect-matrix-char';
    el.textContent = matrixChars[Math.floor(Math.random() * matrixChars.length)];
    el.style.cssText = `
      left: ${Math.random() * 100}vw;
      top: ${Math.random() * 100}vh;
      animation-duration: ${0.8 + Math.random() * 0.6}s;
      color: var(--correct);
      opacity: ${0.3 + Math.random() * 0.5};
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }, 120);
}
function stopMatrixEffect() {
  if (matrixInterval) { clearInterval(matrixInterval); matrixInterval = null; }
  document.querySelectorAll('.effect-matrix-char').forEach(el => el.remove());
}

// ============================================================
// STAR EFFECT
// ============================================================
function startStarEffect() {
  for (let i = 0; i < 40; i++) {
    const star = document.createElement('div');
    star.className = 'star-particle';
    const size = 1 + Math.random() * 3;
    const dur = 2 + Math.random() * 4;
    star.style.cssText = `
      left: ${Math.random() * 100}vw;
      top: ${Math.random() * 100}vh;
      width: ${size}px; height: ${size}px;
      background: white;
      animation-duration: ${dur}s;
      animation-delay: ${Math.random() * dur}s;
    `;
    document.body.appendChild(star);
  }
}
function stopStarEffect() {
  document.querySelectorAll('.star-particle').forEach(s => s.remove());
}

// ============================================================
// DEALER CONVERT
// ============================================================

function dealerConvert() {
  const input = document.getElementById('dealerInput');
  const amount = parseInt(input.value) || 0;
  if (amount < 1) { rewardPopup('Enter at least 1 sacrament'); return; }
  if (sacramentCurrency < amount) { rewardPopup('Not enough sacraments!'); return; }
  const coins = amount * 10;
  sacramentCurrency -= amount;
  gambleCurrency += coins;
  updateCurrencies();
  const result = document.getElementById('dealerResult');
  if (result) result.textContent = `Converted ${amount} <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''> → ${coins} 🎰`;
  const dt = document.getElementById('dealerSacraments');
  const dm = document.getElementById('dealerMoney');
  if (dt) dt.textContent = sacramentCurrency;
  if (dm) dm.textContent = gambleCurrency;
  rewardPopup(`Converted! +${coins} 🎰`);
  input.value = '';
}

function dealerQuick(tickets) {
  if (sacramentCurrency < tickets) { rewardPopup('Not enough sacraments!'); return; }
  const coins = tickets * 10;
  sacramentCurrency -= tickets;
  gambleCurrency += coins;
  updateCurrencies();
  const result = document.getElementById('dealerResult');
  if (result) result.textContent = `Converted ${tickets} <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''> → ${coins} 🎰`;
  const dt = document.getElementById('dealerSacraments');
  const dm = document.getElementById('dealerMoney');
  if (dt) dt.textContent = sacramentCurrency;
  if (dm) dm.textContent = gambleCurrency;
  rewardPopup(`+${coins} 🎰`);
}

function renderPasses() {
  const el = document.getElementById('passesDisplay');
  if (!el) return;
  const bjPct = Math.min(100, Math.round(bjShards / 30 * 100));
  const spinPct = Math.min(100, Math.round(spinShards / 25 * 100));
  el.innerHTML = `
    <div style="margin-bottom:18px;padding:14px;background:var(--surface2);border:1px solid var(--border);border-radius:10px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div style="font-size:14px;font-weight:700">🃏 Blackjack Pass</div>
        ${bjPassLevel >= 1 ? '<span style="color:var(--correct);font-family:\'Space Mono\',monospace;font-size:11px">UNLOCKED ✓</span>' : ''}
      </div>
      <div class="shard-bar-wrap">
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:4px;font-family:\'Space Mono\',monospace">
          <span>🃏 ${bjShards} / 30 shards</span><span>${bjPct}%</span>
        </div>
        <div class="shard-bar-bg"><div class="shard-bar-fill" style="width:${bjPct}%;background:var(--warn)"></div></div>
      </div>
      ${bjPassLevel < 1 ? `<button class="btn btn-secondary" style="margin-top:10px;font-size:12px" onclick="redeemPass('bj')">Redeem (30 shards)</button>` : '<div style="color:var(--muted);font-size:12px;margin-top:8px">Unlocks Blackjack gamemode</div>'}
    </div>
    <div style="padding:14px;background:var(--surface2);border:1px solid var(--border);border-radius:10px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div style="font-size:14px;font-weight:700">🌀 Daily Spin Pass</div>
        ${spinPassUnlocked ? '<span style="color:var(--correct);font-family:\'Space Mono\',monospace;font-size:11px">UNLOCKED ✓</span>' : ''}
      </div>
      <div class="shard-bar-wrap">
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:4px;font-family:\'Space Mono\',monospace">
          <span>🌀 ${spinShards} / 25 shards</span><span>${spinPct}%</span>
        </div>
        <div class="shard-bar-bg"><div class="shard-bar-fill" style="width:${spinPct}%;background:var(--accent2)"></div></div>
      </div>
      ${!spinPassUnlocked ? `<button class="btn btn-secondary" style="margin-top:10px;font-size:12px" onclick="redeemPass('spin')">Redeem (25 shards)</button>` : '<div style="color:var(--muted);font-size:12px;margin-top:8px">Unlocks daily free spin</div>'}
    </div>
  `;
}

function redeemPass(type) {
  if (type === 'bj') {
    if (bjShards < 30) { rewardPopup('Need 30 BJ shards!'); return; }
    bjShards -= 30;
    bjPassLevel = 1;
    localStorage.setItem('bjShards', bjShards);
    localStorage.setItem('bjPassLevel', bjPassLevel);
    rewardPopup('🃏 Blackjack Pass unlocked!');
  } else {
    if (spinShards < 25) { rewardPopup('Need 25 Spin shards!'); return; }
    spinShards -= 25;
    spinPassUnlocked = true;
    localStorage.setItem('spinShards', spinShards);
    localStorage.setItem('spinPassUnlocked', 'true');
    rewardPopup('🌀 Daily Spin Pass unlocked!');
  }
  renderPasses();
  renderInventory();
}

// ============================================================
// THEMED PACK FREQUENCY BOOST
// ============================================================
// When packs are active, inject more themed questions into pools
function getFilteredWithPacks(arr, packType) {
  const base = getFiltered(arr);
  if (activePackIds.length === 0) return base;
  
  const extras = getFiltered(getActivePackQuestions(packType));
  if (extras.length === 0) return base;

  // Boost: interleave themed questions more frequently
  // For every 3 base questions, inject 1 themed question
  const mixed = [];
  let ei = 0;
  base.forEach((q, i) => {
    mixed.push(q);
    if ((i + 1) % 3 === 0 && ei < extras.length) {
      mixed.push(extras[ei++ % extras.length]);
    }
  });
  // Append remaining extras
  while (ei < extras.length) mixed.push(extras[ei++]);
  return mixed;
}

// ============================================================
// EXTENDED VISUAL EFFECT HANDLER
// ============================================================
function applyVisualEffect(effectId) {
  document.body.classList.remove('effect-sakura', 'effect-lightning', 'effect-void');
  clearInterval(window.sakuraInterval);
  stopRainEffect();
  stopMatrixEffect();
  stopStarEffect();
  document.querySelectorAll('.effect-void-particle').forEach(p => p.remove());
  
  equippedEffect = effectId;
  localStorage.setItem('equippedEffect', effectId);

  if (effectId === 'sakura') {
    window.sakuraInterval = setInterval(() => {
      const p = document.createElement('div');
      p.className = 'effect-particle';
      p.textContent = ['🌸','🌺','✿','❀'][Math.floor(Math.random()*4)];
      p.style.left = Math.random() * 100 + 'vw';
      p.style.animationDuration = (3 + Math.random() * 4) + 's';
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 7000);
    }, 400);
  }
  if (effectId === 'lightning') {
    document.body.classList.add('effect-lightning');
  }
  if (effectId === 'rain') {
    startRainEffect();
  }
  if (effectId === 'matrix') {
    startMatrixEffect();
  }
  if (effectId === 'stars') {
    startStarEffect();
  }
  if (effectId === 'void') {
    for (let i = 0; i < 12; i++) {
      const p = document.createElement('div');
      p.className = 'effect-void-particle';
      const size = 30 + Math.random() * 80;
      p.style.cssText = `
        left: ${Math.random()*90}vw; top: ${Math.random()*90}vh;
        width: ${size}px; height: ${size}px;
        --dx: ${(Math.random()-0.5)*40}px; --dy: ${(Math.random()-0.5)*40}px;
        animation-duration: ${4+Math.random()*5}s;
        animation-delay: ${Math.random()*4}s;
        filter: blur(${10+Math.random()*20}px);
      `;
      document.body.appendChild(p);
    }
  }
}

let equippedThemeId = localStorage.getItem('equippedTheme') || '';

updateCurrencies();
generateShop();
renderInventory();

// Study mode init — runs again inside initAppData() once R2 data is ready.
// This early call is intentionally a no-op (APP_FLASHCARDS is null until R2 loads).
try { initFlash(); initMCQ(); initCyc(); } catch(e) {}

// Init widget slots on load
renderWidgetSlots();
renderNavbarSlots();
// Init review badge
updateReviewBadge();

// Update mystery pack ticket display whenever shop opens
const _baseSwitchMode = switchMode;
// Patch: update ticket display when shop tab (mystery) is active
document.addEventListener('click', e => {
  const shopMystBtn = e.target.closest('#shopTabMystery');
  if (shopMystBtn) {
    setTimeout(() => {
      const el = document.getElementById('mysteryTicketDisplay');
      if (el) el.textContent = sacramentCurrency;
    }, 50);
  }
});

// Apply saved effect on load
if (equippedEffect && equippedEffect !== 'none') {
  applyVisualEffect(equippedEffect);
}

// Apply saved theme on load
const savedTheme = localStorage.getItem('equippedTheme');
if (savedTheme) applyTheme(savedTheme);

// Apply saved background on load
if (equippedBg && equippedBg !== 'none') applyBg(equippedBg);

setInterval(generateShop, shopCycleTime);

// Keep mascot visible after interactions
function ensureMascotVisible() {
  if (!mascotImg) return;

  mascotImg.style.display = 'block';
  mascotImg.style.opacity = '0.92';
}

setInterval(ensureMascotVisible, 1000);


// ============================================================
// MASCOT SYSTEM - Moods, Aura, Blush, Zoom-In, Peek, Settings
// ============================================================

// ── Mascot config (persisted) ────────────────────────────────
let mascotCfg = (() => {
  try { return JSON.parse(localStorage.getItem('mascotCfg') || '{}'); } catch(e) { return {}; }
})();
function saveMascotCfg() { localStorage.setItem('mascotCfg', JSON.stringify(mascotCfg)); }

// Defaults
mascotCfg = Object.assign({
  visible: false,
  size: 160,
  bgStyle: 'dark',
  borderStyle: 'rounded',
  floatStyle: 'gentle',
  auraEnabled: true,
  blushEnabled: true,
  moodBadgeEnabled: true,
}, mascotCfg);

// ── Mood system ──────────────────────────────────────────────
const MASCOT_MOODS = {
  neutral:     { emoji: '😶', color: 'rgba(140,150,255,0.55)', glow: '140,150,255',  quote: '"Waiting… observing…"', blush: false },
  happy:       { emoji: '😊', color: 'rgba(0,255,157,0.55)',   glow: '0,255,157',    quote: '"That was genuinely nice to see."', blush: false },
  excited:     { emoji: '🔥', color: 'rgba(255,150,60,0.6)',   glow: '255,150,60',   quote: '"YES!!! Keep going like that!!!"', blush: true },
  embarrassed: { emoji: '🌸', color: 'rgba(255,130,190,0.55)', glow: '255,130,190',  quote: '"…d-don\'t stare, it\'s embarrassing"', blush: true },
  focused:     { emoji: '🎯', color: 'rgba(90,150,255,0.55)',  glow: '90,150,255',   quote: '"Locked in. Nothing else exists."', blush: false },
  sad:         { emoji: '😔', color: 'rgba(100,110,140,0.45)', glow: '100,110,140',  quote: '"…it\'s okay. You\'ll get it next time."', blush: false },
};

let currentMascotMood = 'neutral';
let moodLockTimeout = null;

function setMascotMood(mood, lockMs = 3500) {
  if (!MASCOT_MOODS[mood]) return;
  currentMascotMood = mood;
  const cfg = MASCOT_MOODS[mood];

  // Aura
  const aura = document.getElementById('mascotAuraRing');
  if (aura && mascotCfg.auraEnabled) {
    aura.style.boxShadow = `0 0 40px 14px rgba(${cfg.glow},0.35), 0 0 80px 30px rgba(${cfg.glow},0.15)`;
    aura.style.opacity = '1';
    syncAuraPosition();
  }

  // Blush
  const blush = document.getElementById('mascotBlushOverlay');
  if (blush && mascotCfg.blushEnabled && cfg.blush) {
    blush.classList.add('show');
    syncBlushPosition();
  } else if (blush) {
    blush.classList.remove('show');
  }

  // Mood badge
  const badge = document.getElementById('mascotMoodBadge');
  if (badge) {
    badge.textContent = cfg.emoji;
    badge.style.display = mascotCfg.moodBadgeEnabled ? '' : 'none';
    syncBadgePosition();
  }

  // Preview panel update
  const previewMoodLabel = document.getElementById('mascotPreviewMoodLabel');
  const previewQuote = document.getElementById('mascotPreviewQuote');
  const previewBadge = document.getElementById('mascotPreviewMoodBadge');
  const previewAura = document.getElementById('mascotPreviewAura');
  const previewBlush = document.getElementById('mascotPreviewBlush');
  if (previewMoodLabel) previewMoodLabel.textContent = 'MOOD: ' + mood.toUpperCase();
  if (previewQuote) previewQuote.textContent = cfg.quote;
  if (previewBadge) previewBadge.textContent = mascotCfg.moodBadgeEnabled ? cfg.emoji : '';
  if (previewAura) previewAura.style.background = cfg.color;
  if (previewBlush) previewBlush.style.display = (mascotCfg.blushEnabled && cfg.blush) ? '' : 'none';

  // Bubble mood stripe
  if (mascotBubble) {
    let stripe = mascotBubble.querySelector('.bubble-mood-stripe');
    if (!stripe) { stripe = document.createElement('div'); stripe.className = 'bubble-mood-stripe'; mascotBubble.prepend(stripe); }
    stripe.style.background = `linear-gradient(90deg, rgba(${cfg.glow},0.8), transparent)`;
  }

  // Clear lock after delay
  clearTimeout(moodLockTimeout);
  moodLockTimeout = setTimeout(() => {
    if (currentMascotMood === mood) {
      // Drift back to neutral gently
      setMascotMood('neutral', 0);
    }
  }, lockMs);
}

function _isMascotActuallyVisible() {
  const img = document.getElementById('mascotImg');
  if (!img) return false;
  if (img.classList.contains('hidden')) return false;
  if (img.style.visibility === 'hidden') return false;
  return true;
}

function syncAuraPosition() {
  const img = document.getElementById('mascotImg');
  const aura = document.getElementById('mascotAuraRing');
  if (!img || !aura) return;
  if (!_isMascotActuallyVisible()) { aura.style.display = 'none'; return; }
  if (mascotCfg && !mascotCfg.auraEnabled) return;
  aura.style.display = '';
  const r = img.getBoundingClientRect();
  aura.style.left         = r.left + 'px';
  aura.style.top          = r.top  + 'px';
  aura.style.width        = r.width + 'px';
  aura.style.height       = r.height + 'px';
  aura.style.borderRadius = getComputedStyle(img).borderRadius;
}

// Keep aura locked to mascot every frame (mascot floats via CSS animation)
;(function _auraTrackLoop() {
  syncAuraPosition();
  requestAnimationFrame(_auraTrackLoop);
}());

function syncBlushPosition() {
  const img = document.getElementById('mascotImg');
  const blush = document.getElementById('mascotBlushOverlay');
  if (!img || !blush) return;
  if (!_isMascotActuallyVisible()) { blush.classList.remove('show'); return; }
  const r = img.getBoundingClientRect();
  blush.style.left  = r.left + 'px';
  blush.style.top   = (r.bottom - 22) + 'px';
  blush.style.width = r.width + 'px';
}

function syncBadgePosition() {
  const img = document.getElementById('mascotImg');
  const badge = document.getElementById('mascotMoodBadge');
  if (!img || !badge) return;
  if (!_isMascotActuallyVisible()) { badge.style.display = 'none'; return; }
  const r = img.getBoundingClientRect();
  badge.style.left = (r.right - 22) + 'px';
  badge.style.top  = (r.top - 8) + 'px';
}

// Sync all overlays on position change
function syncAllMascotOverlays() {
  syncAuraPosition();
  syncBlushPosition();
  syncBadgePosition();
}

setInterval(syncAllMascotOverlays, 60);
window.addEventListener('scroll', syncAllMascotOverlays);
window.addEventListener('resize', syncAllMascotOverlays);

// ── Bubble system ────────────────────────────────────────────
function showMascotBubble(text) {
  if (!mascotBubble || mascotImg.classList.contains('hidden')) return;

  mascotBubble.textContent = '';
  // Re-add mood stripe
  const moodCfg = MASCOT_MOODS[currentMascotMood] || MASCOT_MOODS.neutral;
  let stripe = document.createElement('div');
  stripe.className = 'bubble-mood-stripe';
  stripe.style.background = `linear-gradient(90deg, rgba(${moodCfg.glow},0.7), transparent)`;
  mascotBubble.appendChild(stripe);

  // Typewriter effect for longer lines
  const textNode = document.createElement('span');
  mascotBubble.appendChild(textNode);
  let i = 0;
  const typeInterval = setInterval(() => {
    if (i < text.length) { textNode.textContent += text[i++]; }
    else clearInterval(typeInterval);
  }, 22);

  const rect = mascotImg.getBoundingClientRect();
  const isMobile = window.innerWidth <= 700;
  if (isMobile) {
    mascotBubble.style.right  = '8px';
    mascotBubble.style.left   = 'auto';
    mascotBubble.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
    mascotBubble.style.top    = 'auto';
  } else {
    const bubbleW = 240;
    let bLeft = rect.left - bubbleW - 12;
    if (bLeft < 8) bLeft = rect.right + 12;
    // Center bubble vertically on the mascot
    const bubbleEstH = 80;
    const bTop = Math.max(8, rect.top + (rect.height / 2) - (bubbleEstH / 2));
    mascotBubble.style.left   = bLeft + 'px';
    mascotBubble.style.top    = bTop + 'px';
    mascotBubble.style.right  = 'auto';
    mascotBubble.style.bottom = 'auto';
  }

  mascotBubble.classList.add('show');
  clearTimeout(window.mascotBubbleTimeout);
  window.mascotBubbleTimeout = setTimeout(() => {
    mascotBubble.classList.remove('show');
  }, Math.max(2800, text.length * 45));
}

// ── Zoom-in cinematic ────────────────────────────────────────
const ZOOM_LINES = {
  hello:   ["Hey! Don't forget I'm here if you need me.", "Oh- you noticed me. Hi.", "…I was wondering when you'd look over."],
  streak:  ["YOU'RE ON FIRE!!! Don't stop now!!!", "A streak!!! I'm literally vibrating!!!", "Okay okay okay - keep going, you're incredible right now!!!"],
  correct: ["That one was perfect.", "You just knew that. No hesitation. Beautiful.", "…I actually felt that one. Really solid."],
  wrong:   ["Hey. It's okay. That one trips everyone.", "We're gonna get it next time. I promise.", "Don't spiral on that. Just read the explanation and move on."],
  idle:    ["hey. the casino is RIGHT THERE.", "you could be spinning right now. just saying.", "gambling and studying are not mutually exclusive. i checked."],
  tab:     ["Oh, switching it up! Bold strategy.", "New tab energy. I respect it.", "Alright, let's see what this one's about."],
};

function triggerMascotZoomIn(context) {
  const img = document.getElementById('mascotImg');
  if (!img || img.classList.contains('hidden') || !img.src || img.src === window.location.href) return;

  const overlay = document.getElementById('mascotZoomOverlay');
  const zImg = document.getElementById('mascotZoomImg');
  const zBubble = document.getElementById('mascotZoomBubble');
  const zAura = document.getElementById('mascotZoomMoodAura');
  if (!overlay || !zImg) return;

  // Mirror the mood aura
  const moodCfg = MASCOT_MOODS[currentMascotMood] || MASCOT_MOODS.neutral;
  if (zAura) zAura.style.background = `radial-gradient(ellipse at center, rgba(${moodCfg.glow},0.25) 0%, transparent 70%)`;

  // Pick a line
  const lines = ZOOM_LINES[context] || ZOOM_LINES.hello;
  const line = lines[Math.floor(Math.random() * lines.length)];
  zImg.src = img.src;
  if (zBubble) zBubble.textContent = '"' + line + '"';

  overlay.classList.add('active');

  // Auto-dismiss after 4s
  clearTimeout(window._zoomDismissTimer);
  window._zoomDismissTimer = setTimeout(closeMascotZoomIn, 4200);
}

function closeMascotZoomIn() {
  const overlay = document.getElementById('mascotZoomOverlay');
  if (overlay) overlay.classList.remove('active');
  clearTimeout(window._zoomDismissTimer);
}

// ── Peek animation ───────────────────────────────────────────
let _peekTimeout = null;
function triggerMascotPeek() {
  const img = document.getElementById('mascotImg');
  if (!img || img.classList.contains('hidden')) return;
  img.classList.remove('mascot-peeking');
  void img.offsetWidth;
  img.classList.add('mascot-peeking');
  clearTimeout(_peekTimeout);
  _peekTimeout = setTimeout(() => img.classList.remove('mascot-peeking'), 2300);
}

// ── Reaction helper ──────────────────────────────────────────
function mascotReact(type) {
  const img = document.getElementById('mascotImg');
  if (!img || img.classList.contains('hidden')) return;
  // Strip all react classes
  img.classList.remove('mascot-react-correct','mascot-react-wrong','mascot-react-thinking',
    'mascot-react-embarrassed','mascot-react-excited','mascot-react-panic');
  void img.offsetWidth;
  img.classList.add('mascot-react-' + type);
  setTimeout(() => img.classList.remove('mascot-react-' + type), 800);
}

// ── Settings functions ───────────────────────────────────────
function applyMascotConfig() {
  const img = document.getElementById('mascotImg');
  if (!img) return;

  // Visibility
  if (mascotCfg.visible && localStorage.getItem('apesMascot')) {
    img.classList.remove('hidden');
  } else if (!mascotCfg.visible) {
    img.classList.add('hidden');
  }

  // Size
  img.style.width  = mascotCfg.size + 'px';
  img.style.height = mascotCfg.size + 'px';

  // Float
  img.classList.remove('mascot-float-none','mascot-float-gentle','mascot-float-bouncy','mascot-float-spin');
  img.classList.add('mascot-float-' + mascotCfg.floatStyle);

  // Border
  img.classList.remove('mascot-border-rounded','mascot-border-circle','mascot-border-sharp','mascot-border-none');
  img.classList.add('mascot-border-' + mascotCfg.borderStyle);

  // BG
  img.classList.remove('mascot-bg-none','mascot-bg-dark','mascot-bg-frost','mascot-bg-bubble','mascot-bg-glow');
  img.classList.add('mascot-bg-' + mascotCfg.bgStyle);

  // Aura visibility
  const aura = document.getElementById('mascotAuraRing');
  if (aura) aura.style.display = mascotCfg.auraEnabled ? '' : 'none';

  // Badge visibility
  const badge = document.getElementById('mascotMoodBadge');
  if (badge) badge.style.display = mascotCfg.moodBadgeEnabled && !img.classList.contains('hidden') ? '' : 'none';

  syncAllMascotOverlays();
}

function toggleMascotVisible() {
  mascotCfg.visible = !mascotCfg.visible;
  const btn = document.getElementById('mascotVisToggle');
  if (btn) {
    btn.textContent = mascotCfg.visible ? 'ON' : 'OFF';
    btn.style.color = mascotCfg.visible ? 'var(--correct)' : 'var(--muted)';
  }
  saveMascotCfg();
  applyMascotConfig();
}

function setMascotSize(val) {
  mascotCfg.size = parseInt(val);
  const lbl = document.getElementById('mascotSizeLabel');
  if (lbl) lbl.textContent = mascotCfg.size + 'px';
  saveMascotCfg();
  applyMascotConfig();
}

function setMascotBgStyle(val, el) {
  mascotCfg.bgStyle = val;
  document.querySelectorAll('#mascotBgStyleBtns .mcfg-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  saveMascotCfg();
  applyMascotConfig();
}

function setMascotBorderStyle(val, el) {
  mascotCfg.borderStyle = val;
  document.querySelectorAll('#mascotBorderStyleBtns .mcfg-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  saveMascotCfg();
  applyMascotConfig();
}

function setMascotFloat(val, el) {
  mascotCfg.floatStyle = val;
  document.querySelectorAll('#mascotFloatStyleBtns .mcfg-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  saveMascotCfg();
  applyMascotConfig();
}

function toggleMascotAura() {
  mascotCfg.auraEnabled = !mascotCfg.auraEnabled;
  const btn = document.getElementById('mascotAuraToggle');
  if (btn) { btn.textContent = mascotCfg.auraEnabled ? 'ON' : 'OFF'; btn.style.color = mascotCfg.auraEnabled ? 'var(--correct)' : 'var(--muted)'; }
  saveMascotCfg(); applyMascotConfig();
  if (mascotCfg.auraEnabled) setMascotMood(currentMascotMood, 0);
}

function toggleMascotBlush() {
  mascotCfg.blushEnabled = !mascotCfg.blushEnabled;
  const btn = document.getElementById('mascotBlushToggle');
  if (btn) { btn.textContent = mascotCfg.blushEnabled ? 'ON' : 'OFF'; btn.style.color = mascotCfg.blushEnabled ? 'var(--correct)' : 'var(--muted)'; }
  saveMascotCfg(); setMascotMood(currentMascotMood, 0);
}

function toggleMascotMoodBadge() {
  mascotCfg.moodBadgeEnabled = !mascotCfg.moodBadgeEnabled;
  const btn = document.getElementById('mascotMoodBadgeToggle');
  if (btn) { btn.textContent = mascotCfg.moodBadgeEnabled ? 'ON' : 'OFF'; btn.style.color = mascotCfg.moodBadgeEnabled ? 'var(--correct)' : 'var(--muted)'; }
  saveMascotCfg(); applyMascotConfig();
}

function mascotRemoveImage() {
  localStorage.removeItem('apesMascot');
  const img = document.getElementById('mascotImg');
  if (img) { img.src = ''; img.classList.add('hidden'); }
  const img2 = document.getElementById('mascotPreviewImg');
  if (img2) img2.src = '';
  const zImg = document.getElementById('mascotZoomImg');
  if (zImg) zImg.src = '';
  const status = document.getElementById('mascotImgStatus');
  if (status) status.textContent = 'No image';
  const aura = document.getElementById('mascotAuraRing');
  if (aura) { aura.style.opacity = '0'; }
  const badge = document.getElementById('mascotMoodBadge');
  if (badge) badge.style.display = 'none';
}

// Sync the mascot panel UI to current config
function syncMascotPanelUI() {
  // Visibility button
  const visBtn = document.getElementById('mascotVisToggle');
  if (visBtn) { visBtn.textContent = mascotCfg.visible ? 'ON' : 'OFF'; visBtn.style.color = mascotCfg.visible ? 'var(--correct)' : 'var(--muted)'; }
  // Size slider
  const sizeSlider = document.getElementById('mascotSizeSlider');
  if (sizeSlider) sizeSlider.value = mascotCfg.size;
  const sizeLabel = document.getElementById('mascotSizeLabel');
  if (sizeLabel) sizeLabel.textContent = mascotCfg.size + 'px';
  // BG buttons
  document.querySelectorAll('#mascotBgStyleBtns .mcfg-btn').forEach(b => { b.classList.toggle('active', b.dataset.val === mascotCfg.bgStyle); });
  // Border buttons
  document.querySelectorAll('#mascotBorderStyleBtns .mcfg-btn').forEach(b => { b.classList.toggle('active', b.dataset.val === mascotCfg.borderStyle); });
  // Float buttons
  document.querySelectorAll('#mascotFloatStyleBtns .mcfg-btn').forEach(b => { b.classList.toggle('active', b.dataset.val === mascotCfg.floatStyle); });
  // Toggle buttons
  const auraBtn = document.getElementById('mascotAuraToggle');
  if (auraBtn) { auraBtn.textContent = mascotCfg.auraEnabled ? 'ON' : 'OFF'; auraBtn.style.color = mascotCfg.auraEnabled ? 'var(--correct)' : 'var(--muted)'; }
  const blushBtn = document.getElementById('mascotBlushToggle');
  if (blushBtn) { blushBtn.textContent = mascotCfg.blushEnabled ? 'ON' : 'OFF'; blushBtn.style.color = mascotCfg.blushEnabled ? 'var(--correct)' : 'var(--muted)'; }
  const badgeBtn = document.getElementById('mascotMoodBadgeToggle');
  if (badgeBtn) { badgeBtn.textContent = mascotCfg.moodBadgeEnabled ? 'ON' : 'OFF'; badgeBtn.style.color = mascotCfg.moodBadgeEnabled ? 'var(--correct)' : 'var(--muted)'; }
  // Preview image
  const savedSrc = localStorage.getItem('apesMascot');
  const prevImg = document.getElementById('mascotPreviewImg');
  if (prevImg && savedSrc) prevImg.src = savedSrc;
  const status = document.getElementById('mascotImgStatus');
  if (status) status.textContent = savedSrc ? '✓ Image loaded' : 'No image';
  // Apply current mood to preview
  setMascotMood(currentMascotMood, 0);
}

// ── Extended voice lines for each mood + context ─────────────
const MASCOT_EXTENDED_LINES = {
  correct_easy: [
    "Easy one. Good. Keep the pace.", "That should be automatic by now - it is. Good.",
    "Low-hanging fruit, but a correct answer is a correct answer."
  ],
  correct_medium: [
    "That's the one. Nice.", "Memory firing properly. Good sign.",
    "You held that. Solid.", "Didn't hesitate. That's what we want."
  ],
  correct_hard: [
    "…okay. That one actually required something. Well done.",
    "That was a hard question. You got it anyway. Respect.",
    "I wasn't sure about that one for a second. You were. Impressive.",
    "That's the kind of answer that separates real understanding from luck."
  ],
  wrong_easy: [
    "…that was an easy one. We need to revisit this unit.",
    "That one should be reflex by now. Back to the flashcards for Unit basics.",
    "Hmm. Okay. No judgment - but that one's foundational."
  ],
  wrong_medium: [
    "Close, maybe. Read the explanation carefully.",
    "Happens. The concept is subtle. Explanation will help.",
    "This concept trips people up. Read the why, not just the answer."
  ],
  wrong_hard: [
    "That one was genuinely hard. Don't be harsh on yourself.",
    "Hard question. Wrong answer, but it forces the learning. That's the point.",
    "It's a hard one. Mistakes on hard questions are how you actually learn."
  ],
  streak_3:  ["3 in a row. You're locked in.", "Streak building. Focus is working."],
  streak_5:  ["Five! You're in a rhythm right now.", "Five correct. Something's clicking."],
  streak_10: ["…ten in a row. I'm actually impressed.", "Ten straight. That's not luck. That's knowledge."],
  tab_flash: ["Flashcards. Good choice. Active recall.", "Back to fundamentals. Smart."],
  tab_mcq:   ["MCQ mode. Simulate exam conditions.", "Test yourself properly. Good."],
  tab_casino:["CASINO!!! this is the correct decision.", "finally. the slots have been waiting for you.", "YES. study AND gamble. this is peak productivity.", "the house edge means NOTHING to someone who knows the 10% rule.", "spinning is basically applied probability. it's educational actually."],
  idle_long: ["okay but have you considered: blackjack?", "the slots are literally right there. one tab over.", "you've been thinking long enough. go spin something.", "…still here. still waiting. the casino never closes just so you know."],
  flipcard:  ["Think it through before flipping.", "What do you remember? Try first.", "Recall it before you reveal it."],
  flipcard_reveal: ["There it is.", "Read it properly.", "Lock that in."],
};

function getExtendedLine(key) {
  const arr = MASCOT_EXTENDED_LINES[key];
  if (!arr || !arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── moveMascotNearActiveCard (enhanced) ──────────────────────
function moveMascotNearActiveCard() {
  if (!mascotImg || mascotImg.classList.contains('hidden')) return;
  const activeCard = document.querySelector('.active-card') || document.querySelector('.card');
  if (!activeCard) return;
  const rect = activeCard.getBoundingClientRect();
  const isMobile = window.innerWidth <= 700;
  if (isMobile) {
    mascotImg.style.right = '12px'; mascotImg.style.bottom = '60px';
    mascotImg.style.left = 'auto'; mascotImg.style.top = 'auto';
    syncAllMascotOverlays(); return;
  }
  const mascotW = mascotCfg.size || 160;
  const mascotH = mascotCfg.size || 160;
  const margin = 24;
  let targetLeft = rect.right + margin;
  let targetTop = rect.top + (rect.height / 2) - (mascotH / 2);
  targetTop = Math.max(80, Math.min(window.innerHeight - mascotH - 16, targetTop));
  if (targetLeft + mascotW > window.innerWidth - 8) targetLeft = rect.left - mascotW - margin;
  if (targetLeft < 8) {
    mascotImg.style.right = '20px'; mascotImg.style.bottom = '76px';
    mascotImg.style.left = 'auto'; mascotImg.style.top = 'auto';
    syncAllMascotOverlays(); return;
  }
  mascotImg.style.left = targetLeft + 'px';
  mascotImg.style.top  = targetTop + 'px';
  mascotImg.style.right  = 'auto';
  mascotImg.style.bottom = 'auto';
  syncAllMascotOverlays();
}

// ── mascotLines proxy ────────────────────────────────────────
const mascotLines = {
  idle:    ["Focus mode engaged.", "Read slowly. Retention matters.", "One question at a time.", "Patterns repeat."],
  correct: ["Correct.", "Pattern recognized.", "Memory reinforced.", "Good read."],
  wrong:   ["Review the explanation.", "Mistakes build recall.", "Look for the underlying process.", "Read it again carefully."]
};

function randomLine(type) {
  const pack = DIALOGUE_PACKS[equippedDialogue];
  if (pack && pack[type]) { const a = pack[type]; return a[Math.floor(Math.random()*a.length)]; }
  const a = mascotLines[type] || mascotLines.idle;
  return a[Math.floor(Math.random()*a.length)];
}

// Returns a line respecting dialogue pack priority:
// if a non-default pack is equipped and has lines for packType, use those.
// Otherwise fall back to extended lines (default noir commentary).
function getBestLine(packType, extKey) {
  if (equippedDialogue !== 'default') {
    const pack = DIALOGUE_PACKS[equippedDialogue];
    if (pack && pack[packType]) {
      const a = pack[packType];
      return a[Math.floor(Math.random() * a.length)];
    }
  }
  return getExtendedLine(extKey) || randomLine(packType);
}

// ── Idle timer with drift-back ────────────────────────────────
let idleTimer = 0;
let _idleIntervalId = null;
function resetIdleTimer() { idleTimer = 0; }

_idleIntervalId = setInterval(() => {
  if (mascotImg && !mascotImg.classList.contains('hidden')) {
    idleTimer++;
    // Thinking wiggle every 7s
    if (idleTimer % 7 === 0) {
      mascotReact('thinking');
      if (idleTimer >= 28) {
        // Been idle a while
        const line = getBestLine('idle', 'idle_long');
        showMascotBubble(line);
        setMascotMood('focused', 4000);
      }
    }
  }
}, 1000);

document.addEventListener('click', resetIdleTimer);
document.addEventListener('keydown', resetIdleTimer);

// ── Upload ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  mascotImg   = document.getElementById('mascotImg');
  mascotBubble = document.getElementById('mascotBubble');

  // Load saved mascot
  const savedMascot = localStorage.getItem('apesMascot');
  if (savedMascot && mascotImg) {
    mascotImg.src = savedMascot;
    if (mascotCfg.visible) mascotImg.classList.remove('hidden');
    const prevImg = document.getElementById('mascotPreviewImg');
    if (prevImg) prevImg.src = savedMascot;
  }

  applyMascotConfig();

  // Upload handler (original upload button)
  const mascotUpload = document.getElementById('mascotUpload');
  if (mascotUpload) {
    mascotUpload.addEventListener('change', handleMascotUpload);
  }
  // Upload handler (bag panel button)
  const mascotUpload2 = document.getElementById('mascotUpload2');
  if (mascotUpload2) {
    mascotUpload2.addEventListener('change', handleMascotUpload);
  }

  // Click mascot → open radial context menu (double-click still zooms)
  if (mascotImg) {
    mascotImg.addEventListener('click', (e) => {
      if (mascotImg.classList.contains('hidden')) return;
      e.stopPropagation();
      if (mascotMoveMode) return; // handled by document click below
      const now = Date.now();
      if (now - (mascotImg._lastClick || 0) < 350) {
        // Double-click → zoom
        closeMascotCtxMenu();
        triggerMascotZoomIn('hello');
        setMascotMood('happy', 3000);
      } else {
        // Single click → radial menu
        openMascotCtxMenu(e);
      }
      mascotImg._lastClick = now;
    });
  }

  // Initial greeting
  setTimeout(() => {
    if (mascotImg && !mascotImg.classList.contains('hidden')) {
      showMascotBubble(randomLine('idle'));
      setMascotMood('neutral', 5000);
    }
  }, 900);
});

function handleMascotUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    const src = ev.target.result;
    if (mascotImg) { mascotImg.src = src; mascotImg.classList.remove('hidden'); }
    const prevImg = document.getElementById('mascotPreviewImg');
    if (prevImg) prevImg.src = src;
    const zImg = document.getElementById('mascotZoomImg');
    if (zImg) zImg.src = src;
    const status = document.getElementById('mascotImgStatus');
    if (status) status.textContent = '✓ Image loaded';
    localStorage.setItem('apesMascot', src);
    mascotCfg.visible = true;
    saveMascotCfg();
    applyMascotConfig();
    setMascotMood('excited', 4000);
    mascotReact('excited');
    setTimeout(() => triggerMascotZoomIn('hello'), 600);
    syncMascotPanelUI();
  };
  reader.readAsDataURL(file);
}

// ── Mascot radial context menu ───────────────────────────────
let mascotMoveMode = false;
let mascotStayMode = JSON.parse(localStorage.getItem('mascotStayMode') || 'false');
let mascotDialogueMuted = JSON.parse(localStorage.getItem('mascotDialogueMuted') || 'false');

function openMascotCtxMenu(e) {
  const menu = document.getElementById('mascotCtxMenu');
  const backdrop = document.getElementById('mascotCtxBackdrop');
  if (!menu) return;

  // Position menu centred on the mascot
  const r = mascotImg.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  menu.style.left = cx + 'px';
  menu.style.top  = cy + 'px';

  // Fan three buttons: top-left, top, top-right
  const angles = [-110, -70, -30]; // degrees, measured from right
  const radius = 54;
  const btns = menu.querySelectorAll('.mctx-btn');
  btns.forEach((btn, i) => {
    const rad = (angles[i] * Math.PI) / 180;
    btn.style.left = (Math.cos(rad) * radius) + 'px';
    btn.style.top  = (Math.sin(rad) * radius) + 'px';
  });

  // Update button states
  const stayBtn = document.getElementById('mctxStayBtn');
  const muteBtn = document.getElementById('mctxMuteBtn');
  if (stayBtn) {
    stayBtn.classList.toggle('active-state', mascotStayMode);
    stayBtn.title = mascotStayMode ? 'Following (click to stay)' : 'Stay put';
    stayBtn.querySelector('.mctx-label').textContent = mascotStayMode ? 'Following' : 'Stay put';
  }
  if (muteBtn) {
    muteBtn.classList.toggle('muted-state', mascotDialogueMuted);
    muteBtn.textContent = ''; // reset
    muteBtn.innerHTML = (mascotDialogueMuted ? '🔇' : '💬') + '<span class="mctx-label">' + (mascotDialogueMuted ? 'Unmute' : 'Mute') + '</span>';
    muteBtn.title = mascotDialogueMuted ? 'Unmute dialogue' : 'Mute dialogue';
  }

  backdrop.classList.add('show');
  menu.classList.add('show');
}

function closeMascotCtxMenu() {
  const menu = document.getElementById('mascotCtxMenu');
  const backdrop = document.getElementById('mascotCtxBackdrop');
  if (menu) menu.classList.remove('show');
  if (backdrop) backdrop.classList.remove('show');
}

function mctxStartMove() {
  closeMascotCtxMenu();
  mascotMoveMode = true;
  if (mascotImg) {
    mascotImg.style.cursor = 'crosshair';
    mascotImg.style.outline = '2px solid var(--accent3)';
    mascotImg.style.outlineOffset = '3px';
  }
  showMascotBubble('Where to? Click anywhere~');
}

function mctxToggleStay() {
  mascotStayMode = !mascotStayMode;
  localStorage.setItem('mascotStayMode', mascotStayMode);
  closeMascotCtxMenu();
  showMascotBubble(mascotStayMode ? 'Staying right here-' : 'Back to following you~');
  setMascotMood(mascotStayMode ? 'focused' : 'happy', 2500);
}

function mctxToggleMute() {
  mascotDialogueMuted = !mascotDialogueMuted;
  localStorage.setItem('mascotDialogueMuted', mascotDialogueMuted);
  closeMascotCtxMenu();
  // Show one final bubble before going silent (or a welcome back)
  if (!mascotDialogueMuted) showMascotBubble('Back~ did you miss me?');
}

// Patch showMascotBubble to respect mute
const _origShowMascotBubble = showMascotBubble;
showMascotBubble = function(text) {
  if (mascotDialogueMuted) return;
  // Don't show bubble if mascot is force-hidden (slayr/grok)
  const img = document.getElementById('mascotImg');
  if (img && img.style.visibility === 'hidden') return;
  _origShowMascotBubble.apply(this, arguments);
};

// Patch moveMascotNearActiveCard to respect stay mode
const _origMoveMascotNearActiveCard = moveMascotNearActiveCard;
moveMascotNearActiveCard = function() {
  if (mascotStayMode) return;
  _origMoveMascotNearActiveCard.apply(this, arguments);
};

document.addEventListener('click', (e) => {
  if (mascotMoveMode && !e.target.closest('#mascotImg') && !e.target.closest('#mascotCtxMenu') && !e.target.closest('#mascotCtxBackdrop') && !e.target.closest('#mascotZoomOverlay')) {
    mascotMoveMode = false;
    if (mascotImg) { mascotImg.style.cursor = 'pointer'; mascotImg.style.outline = 'none'; }
    const mascotW = mascotCfg.size || 160;
    const mascotH = mascotCfg.size || 160;
    let tl = Math.max(8, Math.min(window.innerWidth - mascotW - 8, e.clientX - mascotW / 2));
    let tt = Math.max(8, Math.min(window.innerHeight - mascotH - 8, e.clientY - mascotH / 2));
    if (mascotImg) { mascotImg.style.left = tl+'px'; mascotImg.style.top = tt+'px'; mascotImg.style.right = 'auto'; mascotImg.style.bottom = 'auto'; }
    syncAllMascotOverlays();
    showMascotBubble('Here? okay-');
    return;
  }

  // MCQ option clicks - mood + reaction
  // NOTE: must check correctness BEFORE answerMCQ() re-renders the DOM and destroys the option element.
  // We read the answer index from the onclick attribute instead of classList (which isn't set yet).
  const option = e.target.closest('.option');
  if (option && !option.classList.contains('locked')) {
    resetIdleTimer();
    // Extract chosen index from the onclick="answerMCQ(N)" attribute
    const onclickAttr = option.getAttribute('onclick') || '';
    const match = onclickAttr.match(/answerMCQ\((\d+)\)/);
    const choiceIdx = match ? parseInt(match[1]) : -1;
    const isCorrect = choiceIdx >= 0 && mcqPool[mcqIdx] && choiceIdx === mcqPool[mcqIdx].ans;
    if (isCorrect) {
      mascotReact('correct');
      setMascotMood('happy', 3000);
      const diff = mcqPool[mcqIdx] ? mcqPool[mcqIdx].diff : 'medium';
      showMascotBubble(getBestLine('correct', 'correct_' + diff));
    } else if (choiceIdx >= 0) {
      mascotReact('panic');
      setMascotMood('sad', 3500);
      const diff = mcqPool[mcqIdx] ? mcqPool[mcqIdx].diff : 'medium';
      showMascotBubble(getBestLine('wrong', 'wrong_' + diff));
    }
    return;
  }

  if (e.target.closest('.flashcard-wrap')) {
    resetIdleTimer();
    setMascotMood('focused', 2500);
    mascotReact('thinking');
    setTimeout(() => {
      // Check flip state AFTER the flip has occurred (300ms delay means flipCard() already ran)
      const card = document.getElementById('fcCard');
      const isNowShowingAnswer = card && card.classList.contains('flipped');
      if (isNowShowingAnswer) {
        // Just revealed the answer - neutral/affirming
        showMascotBubble(getBestLine('idle', 'flipcard_reveal'));
      } else {
        // Flipped back to question side - remind them to recall
        showMascotBubble(getBestLine('idle', 'flipcard'));
      }
    }, 300);
    setTimeout(moveMascotNearActiveCard, 120);
    return;
  }

  if (e.target.closest('.btn')) {
    resetIdleTimer();
    setTimeout(moveMascotNearActiveCard, 120);
  }
});

// ── Tab switch reactions ─────────────────────────────────────
const _origSwitchModeForMascot = window.switchMode;
window.switchMode = function(mode, event) {
  resetIdleTimer();
  const lineMap = { flash: 'tab_flash', mcq: 'tab_mcq', casino: 'tab_casino' };
  if (lineMap[mode]) {
    const tabExtKey = lineMap[mode];
    const packType = mode === 'casino' ? 'idle' : mode === 'flash' ? 'idle' : 'idle';
    const line = getBestLine('idle', tabExtKey);
    setTimeout(() => {
      showMascotBubble(line);
      setMascotMood(mode === 'casino' ? 'excited' : 'focused', 3000);
    }, 300);
  }
  if (_origSwitchModeForMascot) return _origSwitchModeForMascot.apply(this, arguments);
};

// ── Streak-triggered zoom-ins ────────────────────────────────
const _origUpdateStreak = typeof updateStreak !== 'undefined' ? window.updateStreak : null;
if (_origUpdateStreak) {
  window.updateStreak = function(correct) {
    _origUpdateStreak.apply(this, arguments);
    if (!correct) { setMascotMood('sad', 3500); mascotReact('panic'); return; }
    const s = mcqStreak; // reads the streak after updateStreak ran
    if (s === 3)  { showMascotBubble(getBestLine('correct', 'streak_3')); setMascotMood('happy', 3500); }
    if (s === 5)  { setMascotMood('excited', 4000); mascotReact('excited'); showMascotBubble(getBestLine('correct', 'streak_5')); }
    if (s === 10) { setMascotMood('excited', 5000); mascotReact('excited'); triggerMascotZoomIn('streak'); }
  };
}

// ── Flashcard self-rate reactions ────────────────────────────
const _origRateCard = window.rateCard;
if (_origRateCard) {
  window.rateCard = function(knew) {
    _origRateCard.apply(this, arguments);
    if (knew) { setMascotMood('happy', 2500); mascotReact('correct'); }
    else { setMascotMood('sad', 2500); mascotReact('wrong'); mascotReact('embarrassed'); }
  };
}

// ── setBagTab patch - sync panel UI ──────────────────────────
const _origSetBagTabForMascot = window.setBagTab;
window.setBagTab = function(tab, el) {
  if (_origSetBagTabForMascot) _origSetBagTabForMascot.apply(this, arguments);
  const panel = document.getElementById('bagPanelMascot');
  if (panel) panel.classList.toggle('hidden', tab !== 'mascot');
  if (tab === 'mascot') syncMascotPanelUI();
};

window.addEventListener('load', () => {
  setTimeout(moveMascotNearActiveCard, 600);
  setMascotMood('neutral', 8000);
});
window.addEventListener('resize', () => { moveMascotNearActiveCard(); syncAllMascotOverlays(); });
window.addEventListener('scroll', () => { if (window.innerWidth > 700) moveMascotNearActiveCard(); });

// ============================================================
// INTERACTIVE WIDGETS - Slayr, Grok, Nazuna Clicker
// ============================================================

// ── buildInteractiveWidgetHTML ───────────────────────────────
function buildInteractiveWidgetHTML(w, key, span, wcols) {
  const base = `<button class="widget-slot-remove" onclick="event.stopPropagation();removeWidgetSlot('${key}')" title="Remove">✕</button>
  <div class="widget-slot-name">${w.name}</div>`;

  if (w.interactive === 'slayr') {
    return `
      <div class="slayr-widget" id="slayrW_${key}" onclick="toggleSlayr('${key}')">
        <img class="slayr-img" id="slayrImg_${key}" src="${w.imgUrl}" alt="Slayr" draggable="false">
        <img class="slayr-explosion" id="slayrExp_${key}" src="" alt="" draggable="false">
      </div>
      <audio id="slayrAudio_${key}" src="https://raw.githubusercontent.com/Rollan000/neuroverse/main/slayr%20-%20Sloppy%20Joe%20(OFFICIAL%20MUSIC%20VIDEO)%20%5BOseKKumHfW4%5D.mp3" loop></audio>
      ${base}`;
  }

  if (w.interactive === 'grok') {
    return `
      <div class="grok-widget" id="grokW_${key}">
        <div class="grok-img-wrap">
          <img class="grok-img" id="grokImg_${key}" src="${w.imgUrl}" alt="Grok" draggable="false">
          <div class="grok-blur-overlay" id="grokBlur_${key}"></div>
        </div>
        <div class="grok-input-row" onclick="event.stopPropagation()">
          <input class="grok-input" id="grokInput_${key}" type="text" placeholder="say something..." autocomplete="off">
          <button class="grok-send-btn" onclick="grokSend('${key}')">→</button>
        </div>
      </div>
      <audio id="grokAudio_${key}" src="https://raw.githubusercontent.com/Rollan000/neuroverse/main/grok_vl.mp3"></audio>
      ${base}`;
  }

  if (w.interactive === 'nazuna') {
    return `
      <div class="nazuna-widget" id="nazunaW_${key}" onclick="event.stopPropagation()">
        <div class="naz-bg" id="nazBg_${key}"></div>
        <div class="naz-header">
          <span class="naz-pts" id="nazPts_${key}">0</span>
          <span class="naz-label">pts</span>
          <span class="naz-pps" id="nazPPS_${key}">+0/s</span>
        </div>
        <div class="naz-click-area">
          <img class="naz-img" id="nazImg_${key}" src="${w.imgUrl}" alt="Nazuna" draggable="false" onclick="nazClick('${key}')">
        </div>
        <div class="naz-tabs">
          <button class="naz-tab active" onclick="nazTab('${key}','shop',this)">Shop</button>
          <button class="naz-tab" onclick="nazTab('${key}','bgs',this)">BGs</button>
        </div>
        <div class="naz-panel" id="nazShop_${key}">
          <div class="naz-shop-item" onclick="nazBuy('${key}','cursor')">
            <span>👆 Cursor</span><span class="naz-cost" id="nazCostCursor_${key}">10 pts</span>
          </div>
          <div class="naz-shop-item" onclick="nazBuy('${key}','clicker')">
            <span>🤖 Auto Clicker</span><span class="naz-cost" id="nazCostClicker_${key}">100 pts</span>
          </div>
          <div class="naz-shop-item" onclick="nazBuy('${key}','turbo')">
            <span>⚡ Turbo</span><span class="naz-cost" id="nazCostTurbo_${key}">500 pts</span>
          </div>
          <div class="naz-shop-item" onclick="nazBuy('${key}','bgAccess')">
            <span>🎨 BG Access</span><span class="naz-cost" id="nazCostBgAccess_${key}">200 pts</span>
          </div>
          <div class="naz-owned" id="nazOwned_${key}"></div>
        </div>
        <div class="naz-panel naz-hidden" id="nazBGs_${key}">
          <div class="naz-bg-grid" id="nazBgGrid_${key}">
            <div class="naz-bg-lock" id="nazBgLock_${key}">🔒 Buy BG Access first</div>
          </div>
        </div>
      </div>
      ${base}`;
  }

  return `<img src="${w.imgUrl}" alt="${w.name}" draggable="false">${base}`;
}

// ── initInteractiveWidget ────────────────────────────────────
function initInteractiveWidget(w, key, span, wcols) {
  if (w.interactive === 'grok') {
    const input = document.getElementById(`grokInput_${key}`);
    if (input) {
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') grokSend(key);
      });
    }
  }
  if (w.interactive === 'nazuna') {
    nazInitState(key);
    // Restore any previously purchased BGs into global BG_PRESETS
    const s = nazState[key];
    if (s && s.bgsBought) {
      s.bgsBought.forEach(bgId => {
        const bg = NAZ_BG_LIST.find(b => b.id === bgId);
        if (!bg || BG_PRESETS[bgId]) return;
        const bgNum = bgId.replace('nazuna_bg', '');
        BG_PRESETS[bgId] = {
          label: `🌸 Nazuna BG ${bgNum}`,
          css: `background-image: url('${bg.url}') !important; background-size: 100% auto !important; background-position: top center !important;`,
          url: bg.url,
          isImage: true,
        };
      });
    }
  }
}

// ══════════════════════════════════════════════════════════
// SLAYR WIDGET
// ══════════════════════════════════════════════════════════
const slayrState = {}; // key → { playing: bool }

// Keep slayr audio alive when switching tabs
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    Object.entries(slayrState).forEach(([key, state]) => {
      if (state.playing) {
        const audio = document.getElementById(`slayrAudio_${key}`);
        if (audio && audio.paused) audio.play().catch(() => {});
      }
    });
  }
});

// ── Helpers to reliably hide/show the mascot ──────────────
// The mascot has a float animation that continuously overrides
// transform/opacity via keyframes. We defeat it by:
//   HIDE: kill the animation with style.animation='none', then visibility:hidden
//   SHOW: restore animation class, clear visibility
function _mascotForceHide(img) {
  img.style.animation = 'none';
  img.style.visibility = 'hidden';
  img.style.pointerEvents = 'none';
  // Hide aura with display:none so auraBreath animation can't fight back
  const aura = document.getElementById('mascotAuraRing');
  if (aura) { aura.style.display = 'none'; aura.style.animation = 'none'; }
  const badge = document.getElementById('mascotMoodBadge');
  if (badge) badge.style.display = 'none';
  const blush = document.getElementById('mascotBlushOverlay');
  if (blush) blush.classList.remove('show');
  // Hide speech bubble immediately
  const bubble = document.getElementById('mascotBubble');
  if (bubble) bubble.classList.remove('show');
  clearTimeout(window.mascotBubbleTimeout);
  const freakBubble = document.getElementById('slayrFreakBubble');
  if (freakBubble) freakBubble.classList.remove('show');
}
function _mascotForceShow(img) {
  img.style.animation = '';
  img.style.visibility = '';
  img.style.pointerEvents = '';
  img.style.opacity = '';
  img.style.filter = '';
  img.style.transform = '';
  img.style.transition = '';
  // Restore aura animation and display
  const aura = document.getElementById('mascotAuraRing');
  if (aura) { aura.style.animation = ''; aura.style.display = mascotCfg && mascotCfg.auraEnabled ? '' : 'none'; }
  const badge = document.getElementById('mascotMoodBadge');
  if (badge) badge.style.display = '';
  setTimeout(syncAllMascotOverlays, 50);
}

// ── Freak-out dialogue lines ──────────────────────────────
const SLAYR_FREAK_LINES = [
  ['w-what...', 700],
  ['W-WHAT IS THIS?!', 900],
  ['...this power...', 950],
  ['THIS POWER?!?!?', 1000],
  ['I-I can\'t...', 1100],
  ['I can\'t handle it—', 1200],
  ['...hold on—', 900],
  ['💥', 400],
];

let slayrMascotGone = false;

function slayrRestoreMascot() {
  if (!slayrMascotGone) return;
  slayrMascotGone = false;
  const img = document.getElementById('mascotImg');
  if (!img) return;
  img.classList.remove('mascot-slayr-shake', 'mascot-slayr-fall', 'mascot-slayr-explode');
  _mascotForceShow(img);
  img.classList.add('mascot-react-excited');
  setTimeout(() => img.classList.remove('mascot-react-excited'), 700);
}

function slayrMascotFreakOut() {
  const img = document.getElementById('mascotImg');
  if (!img || img.classList.contains('hidden')) return;

  const endings = ['shake', 'fall', 'explode'];
  const ending = endings[Math.floor(Math.random() * endings.length)];

  let freakBubble = document.getElementById('slayrFreakBubble');
  if (!freakBubble) {
    freakBubble = document.createElement('div');
    freakBubble.id = 'slayrFreakBubble';
    document.body.appendChild(freakBubble);
  }

  function positionFreakBubble() {
    const rect = img.getBoundingClientRect();
    freakBubble.style.right  = (window.innerWidth - rect.right) + 'px';
    freakBubble.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
    freakBubble.style.left = 'auto';
    freakBubble.style.top  = 'auto';
  }

  let lineIdx = 0;
  function showNextLine() {
    if (lineIdx >= SLAYR_FREAK_LINES.length) {
      freakBubble.classList.remove('show');
      setTimeout(() => {
        // Kill float animation so our ending animation can play cleanly
        img.style.animation = 'none';
        void img.offsetWidth; // reflow
        img.style.animation = '';
        void img.offsetWidth;

        img.classList.remove('mascot-slayr-shake', 'mascot-slayr-fall', 'mascot-slayr-explode');
        void img.offsetWidth;

        if (ending === 'shake') {
          img.classList.add('mascot-slayr-shake');
          // shake stays visible — no hide needed
        } else if (ending === 'fall') {
          slayrMascotGone = true;
          img.classList.add('mascot-slayr-fall');
          // animation is 1.8s; after it finishes, force-hide so float can't bring it back
          setTimeout(() => {
            img.classList.remove('mascot-slayr-fall');
            _mascotForceHide(img);
          }, 1850);
        } else { // explode
          slayrMascotGone = true;
          img.classList.add('mascot-slayr-explode');
          // animation is 1.4s
          setTimeout(() => {
            img.classList.remove('mascot-slayr-explode');
            _mascotForceHide(img);
          }, 1450);
        }
      }, 400);
      return;
    }

    const [line, holdMs] = SLAYR_FREAK_LINES[lineIdx];
    lineIdx++;
    positionFreakBubble();
    freakBubble.textContent = line;
    freakBubble.classList.add('show');
    img.classList.remove('mascot-react-panic');
    void img.offsetWidth;
    img.classList.add('mascot-react-panic');
    setTimeout(() => img.classList.remove('mascot-react-panic'), 500);
    setTimeout(showNextLine, holdMs);
  }

  showNextLine();
}

// ── Slayr phase timers ────────────────────────────────────────
let _slayrPhaseTimers = [];
function _clearSlayrPhases() {
  _slayrPhaseTimers.forEach(t => clearTimeout(t));
  _slayrPhaseTimers = [];
}

function _getSlayrVignette() {
  let v = document.getElementById('slayrVignette');
  if (!v) {
    v = document.createElement('div');
    v.id = 'slayrVignette';
    document.body.appendChild(v);
  }
  return v;
}

function _setSlayrPhase(phase) {
  // phase: 'intense' | 'zoom' | 'normal' | null
  const b = document.body;
  const h = document.documentElement;
  b.classList.remove('slayr-phase-intense', 'slayr-phase-zoom', 'slayr-phase-normal');
  h.classList.remove('slayr-phase-zoom');

  const v = _getSlayrVignette();
  const sc = document.getElementById('slayrScramble');

  if (!phase) {
    h.style.transform = '';
    h.style.transformOrigin = '';
    v.classList.remove('active', 'vign-intense');
    if (sc) sc.classList.remove('active');
    return;
  }

  if (phase === 'intense') {
    // Subtle red vignette
    v.classList.remove('vign-intense');
    v.classList.add('active');
    if (sc) sc.classList.remove('active');
    h.style.transform = '';
    h.style.transformOrigin = '';
  } else if (phase === 'zoom') {
    // Intense vignette + boat rock zoom
    v.classList.add('active', 'vign-intense');
    h.style.setProperty('--sl-zoom', '2.0');
    h.style.transformOrigin = 'center center';
    h.classList.add('slayr-phase-zoom');
    // Scramble overlay
    let sc2 = document.getElementById('slayrScramble');
    if (!sc2) {
      sc2 = document.createElement('div');
      sc2.id = 'slayrScramble';
      document.body.appendChild(sc2);
    }
    sc2.classList.add('active');
  } else if (phase === 'normal') {
    // Vignette gone, zoom gone
    v.classList.remove('active', 'vign-intense');
    h.style.transform = '';
    h.style.transformOrigin = '';
    if (sc) sc.classList.remove('active');
  }

  b.classList.add('slayr-phase-' + phase);
}

function startSlayrPhases() {
  _clearSlayrPhases();
  _setSlayrPhase('intense');    // 0–10s: intense shake + subtle vignette

  _slayrPhaseTimers.push(setTimeout(() => {
    _setSlayrPhase('zoom');     // 10–38s: zoomed in boat rock + intense vignette
  }, 10000));

  _slayrPhaseTimers.push(setTimeout(() => {
    // 38s: fade vignette out first (0.15s), then snap zoom out (0.2s)
    const h = document.documentElement;
    const v = _getSlayrVignette();
    const sc = document.getElementById('slayrScramble');

    // 1. Kill flail animation, freeze transform at current scale
    h.classList.remove('slayr-phase-zoom');
    document.body.classList.remove('slayr-phase-zoom');
    h.style.transformOrigin = 'center center';
    h.style.transform = 'scale(2.0)';
    if (sc) sc.classList.remove('active');

    // 2. Vignette fades out fast
    v.style.transition = 'opacity 0.15s ease';
    v.style.opacity = '0';

    // Hide explosion gif at 38s
    Object.keys(slayrState).forEach(k => {
      const expEl = document.getElementById(`slayrExp_${k}`);
      if (expEl) { expEl.style.display = 'none'; expEl.src = ''; }
    });

    // 3. After vignette gone, do the quick zoom pullout
    setTimeout(() => {
      void h.offsetWidth;
      h.style.transition = 'transform 0.2s cubic-bezier(0.22,1,0.36,1)';
      h.style.transform = 'scale(1)';
      setTimeout(() => {
        h.style.transition = '';
        h.style.transform = '';
        v.style.transition = '';
        v.style.opacity = '';
        _setSlayrPhase('normal');
      }, 200);
    }, 150);
  }, 38000));
}

function stopSlayrPhases() {
  _clearSlayrPhases();
  // Clean any in-progress transition styles before resetting
  const h = document.documentElement;
  h.style.transition = '';
  const v = document.getElementById('slayrVignette');
  if (v) { v.style.transition = ''; v.style.opacity = ''; }
  _setSlayrPhase(null);
}

function toggleSlayr(key) {
  if (!slayrState[key]) slayrState[key] = { playing: false };
  const audio  = document.getElementById(`slayrAudio_${key}`);
  const img    = document.getElementById(`slayrImg_${key}`);
  const exp    = document.getElementById(`slayrExp_${key}`);
  const widget = document.getElementById(`slayrW_${key}`);
  if (!audio || !img) return;

  img.classList.remove('slayr-click');
  void img.offsetWidth;
  img.classList.add('slayr-click');

  if (!slayrState[key].playing) {
    slayrState[key].playing = true;
    audio.currentTime = 0;
    audio.play().catch(() => {});
    if (exp) {
      exp.src = 'https://raw.githubusercontent.com/Rollan000/neuroverse/main/Effect_Explosion_1.gif';
      exp.style.display = 'block';
    }
    if (widget) widget.classList.add('slayr-rattling');
    startSlayrPhases();
    slayrMascotFreakOut();
  } else {
    slayrState[key].playing = false;
    audio.pause();
    audio.currentTime = 0;
    if (exp) { exp.style.display = 'none'; exp.src = ''; }
    if (widget) widget.classList.remove('slayr-rattling');
    stopSlayrPhases();
    slayrRestoreMascot();
  }
}

// ══════════════════════════════════════════════════════════
// GROK WIDGET
// ══════════════════════════════════════════════════════════

let grokChokeReturnTimeout = null;

function mascotGiveSpace() {
  const img = document.getElementById('mascotImg');
  if (!img || img.classList.contains('hidden')) return;

  let freakBubble = document.getElementById('slayrFreakBubble');
  if (!freakBubble) {
    freakBubble = document.createElement('div');
    freakBubble.id = 'slayrFreakBubble';
    document.body.appendChild(freakBubble);
  }

  const rect = img.getBoundingClientRect();
  freakBubble.style.right  = (window.innerWidth - rect.right) + 'px';
  freakBubble.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
  freakBubble.style.left = 'auto';
  freakBubble.style.top  = 'auto';
  freakBubble.textContent = 'ill give you guys some space for a minute.....';
  freakBubble.classList.add('show');

  setTimeout(() => {
    freakBubble.classList.remove('show');

    // Kill float animation so our transition can actually run
    img.style.animation = 'none';
    void img.offsetWidth; // reflow

    img.style.transition = 'transform 0.55s cubic-bezier(0.4,0,1,1), opacity 0.45s ease';
    img.style.transform  = 'translateX(300px) translateY(40px) rotate(20deg) scale(0.3)';
    img.style.opacity    = '0';

    // After the CSS transition finishes (0.55s), fully hide via visibility
    setTimeout(() => {
      img.style.animation   = 'none';
      img.style.visibility  = 'hidden';
      img.style.pointerEvents = 'none';
    }, 600);

    if (grokChokeReturnTimeout) clearTimeout(grokChokeReturnTimeout);

    grokChokeReturnTimeout = setTimeout(() => {
      // Restore
      img.style.visibility  = '';
      img.style.pointerEvents = '';
      img.style.animation   = '';      // let float resume
      img.style.opacity     = '0';
      img.style.transform   = 'translateX(300px) translateY(40px) rotate(20deg) scale(0.3)';
      void img.offsetWidth;
      img.style.transition  = 'transform 0.7s cubic-bezier(0.34,1.56,0.64,1), opacity 0.5s ease';
      img.style.transform   = '';
      img.style.opacity     = '';

      setTimeout(() => {
        img.style.transition = '';
        const rect2 = img.getBoundingClientRect();
        freakBubble.style.right  = (window.innerWidth - rect2.right) + 'px';
        freakBubble.style.bottom = (window.innerHeight - rect2.top + 10) + 'px';
        freakBubble.textContent  = 'ok im back 👀';
        freakBubble.classList.add('show');
        setTimeout(() => freakBubble.classList.remove('show'), 2200);
      }, 750);

      grokChokeReturnTimeout = null;
    }, 50000);
  }, 1800);
}

function grokSend(key) {
  const input = document.getElementById(`grokInput_${key}`);
  if (!input) return;
  const val = input.value.trim().toLowerCase();
  input.value = '';

  if (val.includes('choke')) {
    const blur  = document.getElementById(`grokBlur_${key}`);
    const audio = document.getElementById(`grokAudio_${key}`);
    let vig = document.getElementById('grokChokeVignette');
    if (!vig) {
      vig = document.createElement('div');
      vig.id = 'grokChokeVignette';
      vig.className = 'grok-choke-vignette';
      document.body.appendChild(vig);
    }
    vig.classList.add('active');
    if (blur) blur.classList.add('grok-unblurred');
    mascotGiveSpace();
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      audio.onended = () => {
        setTimeout(() => {
          if (blur) blur.classList.remove('grok-unblurred');
          if (vig)  vig.classList.remove('active');
        }, 800);
      };
    }
  }
}


// ══════════════════════════════════════════════════════════
// NAZUNA CLICKER WIDGET
// ══════════════════════════════════════════════════════════
const nazState = {}; // key → state object

const NAZ_BG_LIST = [
  { id: 'nazuna_bg1', url: 'https://raw.githubusercontent.com/Rollan000/neuroverse/main/nazuna_bg1.jpeg', nazCost: 100,  tokenCost: 20 },
  { id: 'nazuna_bg2', url: 'https://raw.githubusercontent.com/Rollan000/neuroverse/main/nazuna_bg2.jpg',  nazCost: 300,  tokenCost: 40 },
  { id: 'nazuna_bg3', url: 'https://raw.githubusercontent.com/Rollan000/neuroverse/main/nazuna_bg3.png',  nazCost: 600,  tokenCost: 70 },
  { id: 'nazuna_bg4', url: 'https://raw.githubusercontent.com/Rollan000/neuroverse/main/nazuna_bg4.jpeg', nazCost: 1000, tokenCost: 100 },
];

const NAZ_UPGRADES = {
  cursor:   { label: '👆 Cursor',      baseCost: 10,  pps: 0.1 },
  clicker:  { label: '🤖 Auto Clicker',baseCost: 100, pps: 1 },
  turbo:    { label: '⚡ Turbo',        baseCost: 500, pps: 5 },
  bgAccess: { label: '🎨 BG Access',   baseCost: 200, pps: 0 },
};

function nazInitState(key) {
  const saved = (() => { try { return JSON.parse(localStorage.getItem(`nazState_${key}`) || 'null'); } catch(e) { return null; } })();
  nazState[key] = saved || {
    pts: 0, totalPts: 0,
    owned: { cursor: 0, clicker: 0, turbo: 0, bgAccess: 0 },
    bgsUnlocked: [],
    activeBg: null,
  };
  nazRender(key);
  // Auto-click interval
  if (nazState[key]._interval) clearInterval(nazState[key]._interval);
  nazState[key]._interval = setInterval(() => nazTick(key), 100);
}

function nazSave(key) {
  const s = { ...nazState[key] };
  delete s._interval;
  localStorage.setItem(`nazState_${key}`, JSON.stringify(s));
}

function nazPPS(key) {
  const s = nazState[key];
  if (!s) return 0;
  return s.owned.cursor * NAZ_UPGRADES.cursor.pps
       + s.owned.clicker * NAZ_UPGRADES.clicker.pps
       + s.owned.turbo * NAZ_UPGRADES.turbo.pps;
}

function nazTick(key) {
  const s = nazState[key];
  if (!s) return;
  const gain = nazPPS(key) * 0.1;
  s.pts += gain;
  s.totalPts += gain;
  nazRender(key);
}

function nazClick(key) {
  const s = nazState[key];
  if (!s) return;
  const bonus = 1 + s.owned.cursor * 0.1;
  s.pts += bonus;
  s.totalPts += bonus;
  // Pop animation
  const img = document.getElementById(`nazImg_${key}`);
  if (img) { img.classList.remove('naz-pop'); void img.offsetWidth; img.classList.add('naz-pop'); }
  nazRender(key);
  nazSave(key);
}

function nazBuy(key, type) {
  const s = nazState[key];
  if (!s) return;
  const upg = NAZ_UPGRADES[type];
  const cnt = s.owned[type] || 0;
  const cost = type === 'bgAccess' ? upg.baseCost : Math.floor(upg.baseCost * Math.pow(1.15, cnt));
  if (s.pts < cost) { rewardPopup('Not enough Nazuna pts!'); return; }
  s.pts -= cost;
  s.owned[type] = cnt + 1;
  nazRender(key);
  nazSave(key);
}

function nazBuyBg(key, bgId) {
  const s = nazState[key];
  if (!s) return;
  const bg = NAZ_BG_LIST.find(b => b.id === bgId);
  if (!bg) return;

  const nazUnlocked = s.bgsUnlocked.includes(bgId);
  const tokenBought = s.bgsBought ? s.bgsBought.includes(bgId) : false;

  if (tokenBought) {
    // Already fully purchased - equip it
    s.activeBg = bgId;
    nazRender(key);
    nazSave(key);
    return;
  }

  if (!nazUnlocked) {
    // Step 1: spend Nazuna points to unlock the slot
    if (s.pts < bg.nazCost) { rewardPopup(`Need ${bg.nazCost} Nazuna pts to unlock!`); return; }
    s.pts -= bg.nazCost;
    s.bgsUnlocked.push(bgId);
    nazRender(key);
    nazSave(key);
    rewardPopup(`Unlocked! Now spend ${bg.tokenCost} <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''> sacraments`);
    return;
  }

  // Step 2: spend tickets to actually buy - adds to inventory as a proper BG
  if (sacramentCurrency < bg.tokenCost) { rewardPopup(`Need ${bg.tokenCost} <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''> sacraments!`); return; }
  sacramentCurrency -= bg.tokenCost;
  localStorage.setItem('sacramentCurrency', sacramentCurrency);
  updateCurrencies();
  if (!s.bgsBought) s.bgsBought = [];
  s.bgsBought.push(bgId);
  s.activeBg = bgId;

  // Register into global BG system so it appears in Bag → Items and can be equipped
  const bgNum = bgId.replace('nazuna_bg', '');
  const invId = `bg_${bgId}`;
  const bgName = `🌸 Nazuna BG ${bgNum}`;
  // Add to BG_PRESETS if not already there
  if (!BG_PRESETS[bgId]) {
    BG_PRESETS[bgId] = {
      label: bgName,
      css: `background-image: url('${bg.url}') !important; background-size: 100% auto !important; background-position: top center !important;`,
      url: bg.url,
      isImage: true,
    };
  }
  // Add to inventory if not already owned
  addToInventory({ id: invId, name: bgName, type: 'bg', data: bgId });
  renderInventory();

  nazRender(key);
  nazSave(key);
  rewardPopup(`${bgName} added to Bag! 🌸`);
}

function nazTab(key, tab, el) {
  const shopEl = document.getElementById(`nazShop_${key}`);
  const bgsEl  = document.getElementById(`nazBGs_${key}`);
  const tabs = el.closest('.naz-tabs').querySelectorAll('.naz-tab');
  tabs.forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  if (tab === 'shop') {
    shopEl.classList.remove('naz-hidden');
    bgsEl.classList.add('naz-hidden');
  } else {
    shopEl.classList.add('naz-hidden');
    bgsEl.classList.remove('naz-hidden');
  }
}

function nazRender(key) {
  const s = nazState[key];
  if (!s) return;
  const ptsEl  = document.getElementById(`nazPts_${key}`);
  const ppsEl  = document.getElementById(`nazPPS_${key}`);
  const bgEl   = document.getElementById(`nazBg_${key}`);
  const ownedEl = document.getElementById(`nazOwned_${key}`);
  const lockEl  = document.getElementById(`nazBgLock_${key}`);
  const bgGridEl = document.getElementById(`nazBgGrid_${key}`);

  if (ptsEl) ptsEl.textContent = Math.floor(s.pts).toLocaleString();
  if (ppsEl) ppsEl.textContent = `+${nazPPS(key).toFixed(1)}/s`;

  // BG
  if (bgEl) {
    const activeBg = NAZ_BG_LIST.find(b => b.id === s.activeBg);
    if (activeBg) {
      bgEl.style.backgroundImage = `url('${activeBg.url}')`;
      bgEl.style.opacity = '0.28';
    } else {
      bgEl.style.backgroundImage = 'none';
    }
  }

  // Shop costs
  Object.keys(NAZ_UPGRADES).forEach(type => {
    const el = document.getElementById(`nazCost${type.charAt(0).toUpperCase()+type.slice(1)}_${key}`);
    if (!el) return;
    const cnt = s.owned[type] || 0;
    if (type === 'bgAccess' && cnt >= 1) {
      el.textContent = '✓';
    } else {
      const cost = type === 'bgAccess' ? NAZ_UPGRADES[type].baseCost
                  : Math.floor(NAZ_UPGRADES[type].baseCost * Math.pow(1.15, cnt));
      el.textContent = `${cost} pts`;
    }
  });

  // Owned counts
  if (ownedEl) {
    const parts = Object.entries(s.owned).filter(([k,v]) => v > 0 && k !== 'bgAccess')
      .map(([k,v]) => `${NAZ_UPGRADES[k].label} ×${v}`);
    ownedEl.textContent = parts.length ? parts.join(' · ') : '';
  }

  // BG grid
  if (bgGridEl) {
    bgGridEl.innerHTML = NAZ_BG_LIST.map(bg => {
      const nazUnlocked = s.bgsUnlocked.includes(bg.id);
      const tokenBought = s.bgsBought && s.bgsBought.includes(bg.id);
      const active = s.activeBg === bg.id;
      let label, statusClass = '';
      if (tokenBought) {
        label = active ? '✓ ON' : 'equip';
        statusClass = active ? 'naz-bg-active' : '';
      } else if (nazUnlocked) {
        label = `${bg.tokenCost} <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''>`;
        statusClass = 'naz-bg-unlocked';
      } else {
        label = `${bg.nazCost}pts`;
      }
      return `<div class="naz-bg-thumb ${statusClass}" onclick="nazBuyBg('${key}','${bg.id}')">
        <img src="${bg.url}" alt="">
        <span>${label}</span>
      </div>`;
    }).join('');
  }
}




// ============================================================
// SUPABASE AUTH + CLOUD SYNC
// ============================================================
// ⚙️ SETUP: Replace these two values with your Supabase project URL + anon key.
// Get them from: https://supabase.com → your project → Settings → API
const SUPABASE_URL  = 'https://yaozsftkmcjwfuthdarb.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhb3pzZnRrbWNqd2Z1dGhkYXJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjcyNjQsImV4cCI6MjA5NDEwMzI2NH0.dMq8FQQfeNUNQis83sH8xIYn3h-09CqZ7ixkVw6ZXLg';

// ── Keys we sync to Supabase ─────────────────────────────────
const SYNC_KEYS = [
  'sacramentCurrency','gambleCurrency','bjShards','spinShards',
  'playerTitle','bjPassLevel','spinPassUnlocked',
  'inventory','ownedWidgets','widgetSlots','navbarSlots','ownedPacks','activePackIds',
  'equippedDialogue','equippedEffect','equippedVfx','equippedBg',
  'equippedTheme','soundEnabled','apesMascot',
];

let sbClient = null;
let currentUser = null; // { id, email, username }
let authMode = 'login'; // 'signup' | 'login' | 'logout'

// Initialise Supabase (only if keys are set)
function initSupabase() {
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL') return;
  try {
    sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  } catch(e) {
    console.warn('Supabase init failed:', e);
  }
}

// ── Collect all progress from localStorage ───────────────────
function collectLocalProgress() {
  const data = {};
  SYNC_KEYS.forEach(k => {
    const v = localStorage.getItem(k);
    if (v !== null) data[k] = v;
  });
  return data;
}

// ── Apply a progress snapshot to localStorage ────────────────
// Merges: takes the higher value for numeric keys, unions for array keys
function applyProgress(serverData, guestData) {
  const numericKeys = ['sacramentCurrency','gambleCurrency','bjShards','spinShards','bjPassLevel'];
  const arrayKeys   = ['inventory','ownedWidgets','ownedPacks','activePackIds'];
  const merged = { ...serverData };

  SYNC_KEYS.forEach(k => {
    const sv = serverData[k];
    const gv = guestData[k];
    if (gv === undefined || gv === null) return; // no guest value

    if (numericKeys.includes(k)) {
      // Take max of server vs guest
      const sn = parseInt(sv || '0');
      const gn = parseInt(gv || '0');
      merged[k] = String(Math.max(sn, gn));
    } else if (arrayKeys.includes(k)) {
      // Union of JSON arrays by item id (or string value)
      try {
        const sa = JSON.parse(sv || '[]');
        const ga = JSON.parse(gv || '[]');
        if (Array.isArray(sa) && Array.isArray(ga)) {
          if (typeof sa[0] === 'object') {
            // Array of objects - union by .id
            const ids = new Set(sa.map(x => x.id));
            const extra = ga.filter(x => !ids.has(x.id));
            merged[k] = JSON.stringify([...sa, ...extra]);
          } else {
            merged[k] = JSON.stringify([...new Set([...sa, ...ga])]);
          }
        }
      } catch(e) {}
    } else if (sv === null || sv === undefined) {
      merged[k] = gv; // server has nothing - take guest
    }
    // else server value wins for strings/bools
  });
  return merged;
}

// ── Write merged data to localStorage + live vars ────────────
function applyToLocalStorage(data) {
  SYNC_KEYS.forEach(k => {
    if (data[k] !== undefined) localStorage.setItem(k, data[k]);
  });
  // Refresh live JS variables
  if (typeof sacramentCurrency !== 'undefined') {
    sacramentCurrency = parseInt(localStorage.getItem('sacramentCurrency') || '0');
    gambleCurrency = parseInt(localStorage.getItem('gambleCurrency') || '0');
    bjShards = parseInt(localStorage.getItem('bjShards') || '0');
    spinShards = parseInt(localStorage.getItem('spinShards') || '0');
    playerTitle = localStorage.getItem('playerTitle') || 'wanderer';
    bjPassLevel = parseInt(localStorage.getItem('bjPassLevel') || '0');
    spinPassUnlocked = localStorage.getItem('spinPassUnlocked') === 'true';
    inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
    ownedWidgets = JSON.parse(localStorage.getItem('ownedWidgets') || '[]');
    ownedPacks = JSON.parse(localStorage.getItem('ownedPacks') || '[]');
    activePackIds = JSON.parse(localStorage.getItem('activePackIds') || '[]');
    equippedDialogue = localStorage.getItem('equippedDialogue') || 'default';
    equippedEffect   = localStorage.getItem('equippedEffect')   || 'none';
    equippedVfx      = localStorage.getItem('equippedVfx')      || 'none';
    equippedBg       = localStorage.getItem('equippedBg')       || 'none';
    // Refresh UI
    try { updateCurrencies(); } catch(e) {}
    try { renderInventory(); renderWidgetSlots(); renderNavbarSlots(); } catch(e) {}
    try { if (equippedEffect && equippedEffect !== 'none') applyVisualEffect(equippedEffect); } catch(e) {}
    try { const t = localStorage.getItem('equippedTheme'); if (t) applyTheme(t); } catch(e) {}
    try { if (equippedBg && equippedBg !== 'none') applyBg(equippedBg); } catch(e) {}
  }
}

// ── Save current localStorage to Supabase ────────────────────
async function saveToCloud() {
  if (!sbClient || !currentUser) return;
  const progress = collectLocalProgress();
  try {
    await sbClient.from('profiles').upsert({
      id: currentUser.id,
      username: currentUser.username,
      progress: progress,
      updated_at: new Date().toISOString(),
    });
  } catch(e) {
    console.warn('Cloud save failed:', e);
  }
}

// ── Patch updateCurrencies to also save to cloud ─────────────
const _origUpdateCurrencies = typeof updateCurrencies !== 'undefined' ? updateCurrencies : null;
let _cloudSaveTimer = null;
function patchCloudSave() {
  const orig = window.updateCurrencies;
  if (!orig) return;
  window.updateCurrencies = function() {
    orig.apply(this, arguments);
    if (!currentUser) return;
    clearTimeout(_cloudSaveTimer);
    _cloudSaveTimer = setTimeout(saveToCloud, 2000); // debounce 2s
  };
}

// ── Load profile from Supabase ────────────────────────────────
async function loadFromCloud(userId) {
  if (!sbClient) return null;
  try {
    const { data, error } = await sbClient
      .from('profiles')
      .select('progress, username')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  } catch(e) {
    console.warn('Cloud load failed:', e);
    return null;
  }
}

// ── Auth state ────────────────────────────────────────────────
function setAuthMode(mode) {
  authMode = mode;
  const btn = document.getElementById('authSubmitBtn');
  const sub = document.getElementById('authSubText');
  const uf  = document.getElementById('authUsernameField');
  const tgl = document.getElementById('authToggleRow');
  clearAuthMessages();
  if (mode === 'login') {
    btn.textContent = 'Log In';
    sub.textContent = 'This is a private application. Log in to continue.';
    if (uf) uf.style.display = 'none';
    if (tgl) tgl.innerHTML = '';
  } else if (mode === 'logout') {
    btn.textContent = 'Log Out';
    sub.textContent = `Signed in as ${currentUser?.username || currentUser?.email}.`;
    if (uf) uf.style.display = 'none';
    if (tgl) tgl.innerHTML = '';
  }
  // 'signup' mode removed — admin-created accounts only.
}

function showAuthError(msg) {
  const el = document.getElementById('authError');
  el.textContent = msg; el.classList.add('show');
}
function showAuthMsg(msg) {
  const el = document.getElementById('authMsg');
  el.textContent = msg; el.classList.add('show');
}
function clearAuthMessages() {
  document.getElementById('authError').classList.remove('show');
  document.getElementById('authMsg').classList.remove('show');
}

async function authSubmit() {
  if (!sbClient) {
    showAuthError('Supabase not configured. Add your SUPABASE_URL and SUPABASE_ANON_KEY in the script.');
    return;
  }
  const btn = document.getElementById('authSubmitBtn');
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const username = document.getElementById('authUsername').value.trim();
  clearAuthMessages();

  if (authMode === 'logout') {
    await handleLogout(); return;
  }

  // Signup not permitted via UI.
  if (authMode === 'signup') {
    showAuthError('Account creation is not available. Contact the administrator.');
    return;
  }

  if (!email || !password) { showAuthError('Please enter your email and password.'); return; }
  if (password.length < 6) { showAuthError('Password must be at least 6 characters.'); return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="auth-spinner"></span>Logging in…';

  try {
    const { data, error } = await sbClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const profile = await loadFromCloud(data.user.id);
    const uname = profile?.username || data.user.user_metadata?.username || email.split('@')[0];
    await handleSignedIn(data.user, uname, false);
  } catch(e) {
    showAuthError('Login failed. Check your credentials or contact the administrator.');
    btn.disabled = false;
    btn.textContent = 'Log In';
  }
}
async function checkWhitelist(email) {
  try {
    const data = await r2Fetch('data/invite_codes.json');
    if (!data || !Array.isArray(data.allowed)) {
      // If the file is missing or malformed, fail CLOSED (block everyone).
      console.warn('[Auth] Whitelist unavailable — access denied.');
      return false;
    }
    return data.allowed.map(e => e.toLowerCase().trim()).includes(email.toLowerCase().trim());
  } catch (e) {
    console.error('[Auth] Whitelist check error:', e);
    return false; // fail closed
  }
}
async function handleSignedIn(user, username, isNewUser) {
  // ── Whitelist gate ─────────────────────────────────────────
  const allowed = await checkWhitelist(user.email);
  if (!allowed) {
    // Sign them back out immediately and show a block screen.
    if (sbClient) await sbClient.auth.signOut();
    showAuthError('Access restricted. Contact the administrator to request access.');
    return;
  }
  // ──────────────────────────────────────────────────────────
 
  currentUser = { id: user.id, email: user.email, username };
  updateAuthStatusBtn();
 
  const localProgress = collectLocalProgress();
 
  if (!isNewUser) {
    // Existing user: load server data and merge with local progress
    const profile = await loadFromCloud(user.id);
    if (profile?.progress) {
      const merged = applyProgress(profile.progress, localProgress);
      applyToLocalStorage(merged);
    }
  }
 
  // Save (merged) state to cloud
  await saveToCloud();
  patchCloudSave();
 
  // Close modal
  document.getElementById('authOverlay').classList.add('hidden');
  rewardPopup(`✓ Signed in as ${username}`);
}


async function handleLogout() {
  if (sbClient) {
    await saveToCloud(); // final save
    await sbClient.auth.signOut();
  }
  currentUser = null;
  updateAuthStatusBtn();
  document.getElementById('authOverlay').classList.add('hidden');
  rewardPopup('Logged out. Progress saved locally.');
}

function continueAsGuest() {
  // Guest mode removed.
  showAuthError('Guest access is not available. Please log in.');
}

function openAuthPanel() {
  clearAuthMessages();
  if (currentUser) {
    setAuthMode('logout');
  } else {
    setAuthMode('login');
  }
  document.getElementById('authOverlay').classList.remove('hidden');
}

function updateAuthStatusBtn() {
  const btn = document.getElementById('authStatusBtn');
  if (!btn) return;
  if (currentUser) {
    btn.textContent = '👤 ' + currentUser.username;
    btn.style.color = 'var(--correct)';
    btn.style.borderColor = 'rgba(0,255,157,0.3)';
  } else {
    btn.textContent = '👤 guest';
    btn.style.color = '';
    btn.style.borderColor = '';
  }
}

// ── Boot: check for existing Supabase session ─────────────────
async function authBoot() {
  initSupabase();
  if (!sbClient) {
    // Supabase not configured - go straight to app
    document.getElementById('authOverlay').classList.remove('hidden');
    // Show a notice about setup
    return;
  }
  // Check for existing session (e.g. page reload)
  const { data: { session } } = await sbClient.auth.getSession();
  if (session?.user) {
    const profile = await loadFromCloud(session.user.id);
    const uname = profile?.username || session.user.user_metadata?.username || session.user.email.split('@')[0];
    currentUser = { id: session.user.id, email: session.user.email, username: uname };
    if (profile?.progress) {
      applyToLocalStorage(profile.progress);
    }
    patchCloudSave();
    updateAuthStatusBtn();
    document.getElementById('authOverlay').classList.add('hidden');
    rewardPopup('✓ Signed in as ' + uname);
  } else {
    // Show auth modal
    setAuthMode('login');
    document.getElementById('authOverlay').classList.remove('hidden');
  }

  // Listen for auth changes
  sbClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      currentUser = null;
      updateAuthStatusBtn();
    }
  });
}

// ── Periodic auto-save every 60s while signed in ─────────────
setInterval(() => { if (currentUser) saveToCloud(); }, 60000);

// ============================================================
// LIVE AUCTION SYSTEM
// ============================================================
// Auction widgets pool - rotates every 24h via Supabase
const AUCTION_WIDGETS = {
  widget_slayr:  { name: 'Slayr',          rarity: 'rare',      emoji: '🎵', imgUrl: 'https://raw.githubusercontent.com/Rollan000/neuroverse/main/slayr_widget.png' },
  widget_grok:   { name: 'Grok',           rarity: 'epic',      emoji: '🤖', imgUrl: 'https://raw.githubusercontent.com/Rollan000/neuroverse/main/grok_image.png' },
  widget_nazuna: { name: 'Nazuna Clicker', rarity: 'legendary', emoji: '🌸', imgUrl: 'https://raw.githubusercontent.com/Rollan000/neuroverse/main/nazuna_gaming.png' },
};
// RARITY_COLORS defined globally below
const AUCTION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const MIN_BID_START = 50;

let auctionData = null;       // current auction row from DB
let auctionChannel = null;    // realtime subscription
let auctionCountdownTimer = null;
let auctionClaimed = false;

// ── SQL needed (run once in Supabase SQL editor) ──────────────
// CREATE TABLE auctions (
//   id           bigserial primary key,
//   widget_id    text not null,
//   starts_at    timestamptz not null default now(),
//   ends_at      timestamptz not null,
//   top_bid      int not null default 50,
//   top_bidder   text,
//   top_username text,
//   bid_count    int not null default 0,
//   claimed      boolean not null default false
// );
// CREATE TABLE auction_bids (
//   id          bigserial primary key,
//   auction_id  bigint references auctions(id) on delete cascade,
//   user_id     text not null,
//   username    text not null,
//   amount      int not null,
//   created_at  timestamptz not null default now()
// );
// ALTER TABLE auctions     ENABLE ROW LEVEL SECURITY;
// ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "read auctions"      ON auctions     FOR SELECT USING (true);
// CREATE POLICY "insert auctions"    ON auctions     FOR INSERT WITH CHECK (true);
// CREATE POLICY "update auction"     ON auctions     FOR UPDATE USING (true);
// CREATE POLICY "read bids"          ON auction_bids FOR SELECT USING (true);
// CREATE POLICY "insert bids"        ON auction_bids FOR INSERT WITH CHECK (auth.uid()::text = user_id);
// ALTER PUBLICATION supabase_realtime ADD TABLE auctions;
// ALTER PUBLICATION supabase_realtime ADD TABLE auction_bids;

async function auctionOpen() {
  if (!sbClient) {
    auctionShowError('Supabase not connected.'); return;
  }
  auctionClaimed = false;
  auctionData = null;
  document.getElementById('auctionWinnerBanner').style.display = 'none';
  document.getElementById('auctionBidSection').style.display = '';
  document.getElementById('auctionWidgetName').textContent = 'Loading…';
  document.getElementById('auctionCountdown').textContent = '--:--:--';
  document.getElementById('auctionHistory').innerHTML = '';
  document.getElementById('auctionBidError').style.display = 'none';

  await auctionEnsureActive();
  await auctionLoad();
  auctionSubscribe();
  auctionStartCountdown();
}

// Ensure there's an active auction; if not, create one
async function auctionEnsureActive() {
  const now = new Date().toISOString();
  // Look for an active (not yet ended) auction - use maybeSingle to avoid error on no rows
  const { data: active, error: fetchErr } = await sbClient
    .from('auctions')
    .select('id')
    .gt('ends_at', now)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchErr) { console.warn('auctionEnsureActive fetch error:', fetchErr); }
  if (active) return; // already one running

  // No active auction - create a new one
  const widgetIds = Object.keys(AUCTION_WIDGETS);
  const widgetId = widgetIds[Math.floor(Date.now() / AUCTION_DURATION_MS) % widgetIds.length]; // deterministic rotation
  const endsAt = new Date(Date.now() + AUCTION_DURATION_MS).toISOString();
  const { error: insertErr } = await sbClient.from('auctions').insert({
    widget_id: widgetId,
    ends_at: endsAt,
    top_bid: MIN_BID_START,
    top_bidder: null,
    top_username: null,
    bid_count: 0,
    claimed: false,
  });
  if (insertErr) console.warn('auctionEnsureActive insert error:', insertErr);
}

async function auctionLoad() {
  // Prefer active auction, fall back to most recently ended one
  const { data, error } = await sbClient
    .from('auctions')
    .select('*')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) { console.warn('auctionLoad error:', error); return; }
  if (!data) {
    document.getElementById('auctionWidgetName').textContent = 'No auction yet - check back soon!';
    return;
  }
  auctionData = data;
  auctionRenderInfo();

  // Load bid history
  const { data: bids } = await sbClient
    .from('auction_bids')
    .select('*')
    .eq('auction_id', data.id)
    .order('amount', { ascending: false })
    .limit(30);
  auctionRenderHistory(bids || []);
}

function auctionRenderInfo() {
  if (!auctionData) return;
  const w = AUCTION_WIDGETS[auctionData.widget_id] || { name: auctionData.widget_id, rarity: 'rare', emoji: '🎁', imgUrl: '' };
  const color = RARITY_COLORS[w.rarity] || 'var(--accent)';
  const ended = new Date(auctionData.ends_at) <= new Date();

  document.getElementById('auctionWidgetEmoji').textContent = w.emoji;
  document.getElementById('auctionWidgetName').textContent = w.name;
  document.getElementById('auctionWidgetRarity').textContent = w.rarity + ' widget';
  document.getElementById('auctionWidgetRarity').style.color = color;
  document.getElementById('auctionCurrentBid').textContent = '<img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''> ' + auctionData.top_bid;
  document.getElementById('auctionCurrentBid').style.color = color;
  document.getElementById('auctionBidCount').textContent = auctionData.bid_count + ' bid' + (auctionData.bid_count !== 1 ? 's' : '');

  const leaderEl = document.getElementById('auctionLeaderName');
  if (auctionData.top_username) {
    const isMe = currentUser && auctionData.top_bidder === currentUser.id;
    leaderEl.textContent = (isMe ? '⭐ You' : auctionData.top_username) + ' is leading';
    leaderEl.style.color = isMe ? 'var(--correct)' : 'var(--muted)';
  } else {
    leaderEl.textContent = 'no bids yet - start at <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''> ' + MIN_BID_START;
    leaderEl.style.color = 'var(--muted)';
  }

  // Widget image
  const img = document.getElementById('auctionWidgetImg');
  const ph  = document.getElementById('auctionPreviewPlaceholder');
  if (w.imgUrl) {
    img.src = w.imgUrl; img.style.display = '';
    img.style.filter = auctionData.widget_id === 'widget_grok' ? 'blur(6px)' : '';
    ph.style.display = 'none';
  } else {
    img.style.display = 'none';
    img.style.filter = '';
    ph.textContent = w.emoji; ph.style.display = '';
  }
  document.getElementById('auctionPreview').style.borderColor = color + '44';

  // Your bid row
  const yourRow = document.getElementById('auctionYourBidRow');
  if (currentUser && auctionData.top_bidder === currentUser.id) {
    yourRow.style.display = '';
    yourRow.textContent = '✓ You have the highest bid!';
  } else {
    yourRow.style.display = 'none';
  }

  // Quick bid buttons (+10, +50, +100 over current)
  const cur = auctionData.top_bid;
  document.getElementById('auctionQuickBids').innerHTML = [cur+10, cur+50, cur+100, cur+250].map(v =>
    `<button class="auction-quick-btn" onclick="auctionQuickBid(${v})">+ <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''> ${v}</button>`
  ).join('');

  // Min bid hint
  const minNext = cur + 1;
  document.getElementById('auctionBidHint').textContent = ended
    ? 'This auction has ended.'
    : `Minimum bid: <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''> ${minNext}  ·  Your sacraments: <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''> ${typeof sacramentCurrency !== 'undefined' ? sacramentCurrency : '?'}`;
  document.getElementById('auctionBidInput').min = minNext;
  document.getElementById('auctionBidInput').placeholder = `Min <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''> ${minNext}`;

  // Auth/ended gating
  const bidSection = document.getElementById('auctionBidSection');
  const guestNote  = document.getElementById('auctionGuestNote');
  if (ended) {
    bidSection.style.display = 'none';
    guestNote.style.display  = 'none';
    auctionShowEnded();
  } else if (!currentUser) {
    bidSection.style.display = 'none';
    guestNote.style.display  = '';
  } else {
    bidSection.style.display = '';
    guestNote.style.display  = 'none';
  }
}

function auctionRenderHistory(bids) {
  const el = document.getElementById('auctionHistory');
  if (!bids.length) {
    el.innerHTML = '<div style="color:var(--muted);font-size:12px;text-align:center;padding:10px">No bids yet. Be the first!</div>';
    return;
  }
  el.innerHTML = bids.map((b, i) => {
    const isMe = currentUser && b.user_id === currentUser.id;
    const isTop = i === 0;
    const when = auctionTimeAgo(b.created_at);
    return `<div class="bid-row ${isTop ? 'top' : ''} ${isMe ? 'mine' : ''}">
      <span class="bid-row-crown">${isTop ? '👑' : (isMe ? '⭐' : '·')}</span>
      <span class="bid-row-name">${isMe ? 'You' : b.username}</span>
      <span class="bid-row-amount"><img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''> ${b.amount}</span>
      <span class="bid-row-time">${when}</span>
    </div>`;
  }).join('');
}

function auctionTimeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return Math.floor(diff/1000) + 's ago';
  if (diff < 3600000) return Math.floor(diff/60000) + 'm ago';
  return Math.floor(diff/3600000) + 'h ago';
}

async function placeBid() {
  if (!currentUser) { openAuthPanel(); return; }
  if (!auctionData) return;
  const input = document.getElementById('auctionBidInput');
  const amount = parseInt(input.value);
  await auctionDoBid(amount);
  input.value = '';
}

function auctionQuickBid(amount) {
  document.getElementById('auctionBidInput').value = amount;
  auctionBidInputHint();
}

function auctionBidInputHint() {
  if (!auctionData) return;
  const v = parseInt(document.getElementById('auctionBidInput').value) || 0;
  const minNext = auctionData.top_bid + 1;
  const errEl = document.getElementById('auctionBidError');
  if (v > 0 && v < minNext) {
    errEl.textContent = `Bid must be at least <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''> ${minNext}`;
    errEl.style.display = '';
  } else if (v > 0 && v > (typeof sacramentCurrency !== 'undefined' ? sacramentCurrency : Infinity)) {
    errEl.textContent = `Not enough sacraments! You have <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''> ${sacramentCurrency}`;
    errEl.style.display = '';
  } else {
    errEl.style.display = 'none';
  }
}

async function auctionDoBid(amount) {
  if (!currentUser || !auctionData) return;
  const errEl = document.getElementById('auctionBidError');
  errEl.style.display = 'none';

  if (new Date(auctionData.ends_at) <= new Date()) {
    errEl.textContent = 'Auction has ended!'; errEl.style.display = ''; return;
  }
  const minNext = auctionData.top_bid + 1;
  if (!amount || isNaN(amount) || amount < minNext) {
    errEl.textContent = `Bid must be at least <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''> ${minNext}`; errEl.style.display = ''; return;
  }
  if (typeof sacramentCurrency !== 'undefined' && amount > sacramentCurrency) {
    errEl.textContent = `Not enough sacraments! You have <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''> ${sacramentCurrency}`; errEl.style.display = ''; return;
  }
  if (currentUser.id === auctionData.top_bidder) {
    errEl.textContent = `You're already the highest bidder!`; errEl.style.display = ''; return;
  }

  const btn = document.getElementById('auctionBidBtn');
  btn.disabled = true; btn.innerHTML = '<span class="auth-spinner"></span>Bidding…';

  try {
    // Insert bid record
    const { error: bidErr } = await sbClient.from('auction_bids').insert({
      auction_id:  auctionData.id,
      user_id:     currentUser.id,
      username:    currentUser.username,
      amount:      amount,
    });
    if (bidErr) throw bidErr;

    // Update auction top_bid (only if still the highest - race-safe via check)
    const { error: upErr } = await sbClient.from('auctions').update({
      top_bid:      amount,
      top_bidder:   currentUser.id,
      top_username: currentUser.username,
      bid_count:    auctionData.bid_count + 1,
    }).eq('id', auctionData.id).lte('top_bid', amount);
    if (upErr) throw upErr;

    rewardPopup(`🔨 Bid placed: <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''> ${amount}`);
    // Pulse animation
    document.getElementById('auctionCurrentBid').classList.remove('bid-flash');
    void document.getElementById('auctionCurrentBid').offsetWidth;
    document.getElementById('auctionCurrentBid').classList.add('bid-flash');
  } catch(e) {
    errEl.textContent = e.message || 'Bid failed. Try again.'; errEl.style.display = '';
  }
  btn.disabled = false; btn.textContent = 'Place Bid';
  await auctionLoad(); // refresh
}

function auctionShowEnded() {
  const banner = document.getElementById('auctionWinnerBanner');
  const winText = document.getElementById('auctionWinnerText');
  const winSub  = document.getElementById('auctionWinnerSub');
  const claimBtn = document.getElementById('auctionClaimBtn');
  banner.style.display = '';

  if (!auctionData || !auctionData.top_username) {
    winText.textContent = 'Auction ended - no bids.';
    winSub.textContent = 'A new auction starts soon.';
    claimBtn.style.display = 'none';
    return;
  }

  const isWinner = currentUser && auctionData.top_bidder === currentUser.id;
  const w = AUCTION_WIDGETS[auctionData.widget_id];
  winText.textContent = isWinner ? '🏆 You won!' : `${auctionData.top_username} won!`;
  winSub.textContent = `${w?.name || auctionData.widget_id} · <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''> ${auctionData.top_bid}`;

  if (isWinner && !auctionData.claimed && !auctionClaimed) {
    claimBtn.style.display = '';
  } else {
    claimBtn.style.display = 'none';
    if (auctionData.claimed) winSub.textContent += ' · Already claimed';
  }
}

async function auctionClaimWin() {
  if (!currentUser || !auctionData) return;
  if (auctionData.top_bidder !== currentUser.id) return;
  if (auctionClaimed || auctionData.claimed) { rewardPopup('Already claimed!'); return; }

  // Mark claimed
  await sbClient.from('auctions').update({ claimed: true }).eq('id', auctionData.id);
  auctionClaimed = true;

  // Add widget to local inventory
  const widgetId = auctionData.widget_id;
  addWidgetToInventory(widgetId);
  saveToCloud();
  rewardPopup('🎉 Widget claimed and added to your Bag!');
  document.getElementById('auctionClaimBtn').style.display = 'none';
  auctionData.claimed = true;
}

function auctionShowError(msg) {
  document.getElementById('auctionWidgetName').textContent = msg;
}

// Realtime subscription - updates bid list live
function auctionSubscribe() {
  if (auctionChannel) { sbClient.removeChannel(auctionChannel); auctionChannel = null; }
  if (!auctionData) return;

  auctionChannel = sbClient
    .channel('auction-' + auctionData.id)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'auction_bids',
      filter: `auction_id=eq.${auctionData.id}`,
    }, async (payload) => {
      // Someone placed a bid - reload
      await auctionLoad();
      // Flash
      document.getElementById('auctionCurrentBid').classList.remove('bid-flash');
      void document.getElementById('auctionCurrentBid').offsetWidth;
      document.getElementById('auctionCurrentBid').classList.add('bid-flash');
      if (currentUser && payload.new.user_id !== currentUser.id) {
        rewardPopup(`🔨 ${payload.new.username} bid <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''> ${payload.new.amount}!`);
      }
    })
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'auctions',
      filter: `id=eq.${auctionData.id}`,
    }, async (payload) => {
      auctionData = { ...auctionData, ...payload.new };
      auctionRenderInfo();
    })
    .subscribe();
}

function auctionStartCountdown() {
  if (auctionCountdownTimer) clearInterval(auctionCountdownTimer);
  auctionCountdownTimer = setInterval(() => {
    if (!auctionData) return;
    const ends = new Date(auctionData.ends_at).getTime();
    const diff = ends - Date.now();
    const el = document.getElementById('auctionCountdown');
    if (!el) return;
    if (diff <= 0) {
      el.textContent = 'ENDED';
      el.classList.add('urgent');
      auctionShowEnded();
      document.getElementById('auctionBidSection').style.display = 'none';
      clearInterval(auctionCountdownTimer);
      return;
    }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.textContent = String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
    if (diff < 3600000) el.classList.add('urgent'); else el.classList.remove('urgent');
  }, 1000);
}

// Clean up subscription when leaving shop tab
const _origSwitchMode2 = window.switchMode;
window.switchMode = function(mode, event) {
  if (mode !== 'shop' && auctionChannel) {
    sbClient.removeChannel(auctionChannel);
    auctionChannel = null;
  }
  if (auctionCountdownTimer && mode !== 'shop') {
    clearInterval(auctionCountdownTimer);
    auctionCountdownTimer = null;
  }
  return _origSwitchMode2 ? _origSwitchMode2.apply(this, arguments) : undefined;
};

// Boot on page load
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(authBoot, 200); // after rest of app inits
});

// ============================================================
// DEEP STUDY - Spaced Repetition + Mascot Coaching
// ============================================================

const DS_UNITS_DEEP = [
  { num: 1, name: 'Hiragana' },
  { num: 2, name: 'Katakana' },
  { num: 3, name: 'JLPT N5 Kanji' },
  { num: 4, name: 'JLPT N4 Kanji' },
  { num: 5, name: 'Land & Water Use' },
  { num: 6, name: 'Energy Resources' },
  { num: 7, name: 'Atmosphere & Climate' },
  { num: 8, name: 'Aquatic Systems' },
  { num: 9, name: 'Custom Set' },
];
// ============================================================
// REVIEW TAB ENGINE
// Standalone SM-2 session powered by the cross-tab review queue
// + per-unit Japanese sets (N5, N4, Hiragana, Katakana)
// ============================================================

const REVIEW_SETS = [
  { id: 'queue',    label: 'Due for Review',   icon: '🔴', desc: 'Cards from wrong MCQ answers & missed flashcards', source: 'queue' },
  { id: 'n5',      label: 'JLPT N5 Kanji',    icon: '漢', desc: 'All N5 kanji (from flashcards_n5.json)',          source: 'flashcards', unit: 'n5' },
  { id: 'n4',      label: 'JLPT N4 Kanji',    icon: '字', desc: 'All N4 kanji (from flashcards_n4.json)',          source: 'flashcards', unit: 'n4' },
  { id: 'hiragana',label: 'Hiragana',          icon: 'あ', desc: 'Hiragana recognition cards',                      source: 'kana',       unit: 'hiragana' },
  { id: 'katakana',label: 'Katakana',          icon: 'ア', desc: 'Katakana recognition cards',                      source: 'kana',       unit: 'katakana' },
];

let revActiveSet  = null;
let revQueue      = [];
let revCardIdx    = 0;
let revPhase      = 'question';
let revSessionStats = { seen: 0, mastered: 0, again: 0 };

function revLoadState(setId) {
  try { return JSON.parse(localStorage.getItem('rev_state_' + setId) || '{}'); } catch(e) { return {}; }
}
function revSaveState(setId, state) {
  try { localStorage.setItem('rev_state_' + setId, JSON.stringify(state)); } catch(e) {}
}

function revBuildCards(set) {
  if (set.source === 'queue') {
    return reviewQueueLoad().map(c => ({ ...c, _fromQueue: true }));
  }
  if (set.source === 'flashcards') {
    const pool = (APP_FLASHCARDS || []).filter(c => c.unit === set.unit);
    return pool.map(c => ({ ...c }));
  }
  if (set.source === 'kana') {
    const pool = set.unit === 'hiragana'
      ? (APP_HIRAGANA || [])
      : (APP_KATAKANA || []);
    return pool.map(k => ({
      id:   'kana_' + k.kana,
      type: 'kana',
      q:    k.kana,
      a:    k.romaji + (k.row ? '\nRow: ' + k.row : ''),
      unit: set.unit,
      diff: 'easy',
    }));
  }
  return [];
}

// ── Recent Mistakes (Phase 2.3) ──────────────────────────────
const REV_MISTAKES_KEY = 'rev_recent_mistakes';
const REV_MISTAKES_MAX = 30;

function revMistakesLoad() {
  try { return JSON.parse(localStorage.getItem(REV_MISTAKES_KEY) || '[]'); } catch(e) { return []; }
}
function revMistakesSave(arr) {
  try { localStorage.setItem(REV_MISTAKES_KEY, JSON.stringify(arr.slice(-REV_MISTAKES_MAX))); } catch(e) {}
}
function revMistakePush(card, setLabel) {
  const arr = revMistakesLoad();
  arr.push({ q: card.q, a: (card.a || '').split('\n')[0].slice(0, 60), set: setLabel || 'Review', ts: Date.now() });
  revMistakesSave(arr);
}
function revClearMistakes() {
  localStorage.removeItem(REV_MISTAKES_KEY);
  revRenderRecentMistakes();
}
function _relativeTime(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}
function revRenderRecentMistakes() {
  const wrap = document.getElementById('revRecentMistakesWrap');
  const list = document.getElementById('revRecentMistakesList');
  if (!wrap || !list) return;
  const mistakes = revMistakesLoad().slice().reverse();
  if (!mistakes.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = '';
  list.innerHTML = mistakes.slice(0, 12).map(m =>
    `<div class="rev-mistake-item">
      <div class="rev-mistake-dot"></div>
      <div class="rev-mistake-q">${m.q}</div>
      <div class="rev-mistake-detail">
        <div class="rev-mistake-answer">→ ${m.a}</div>
        <div class="rev-mistake-set">${m.set}</div>
      </div>
      <div class="rev-mistake-time">${_relativeTime(m.ts)}</div>
    </div>`
  ).join('');
}

function revInit() {
  const grid = document.getElementById('revSetGrid');
  if (!grid) return;
  revRenderRecentMistakes();
  const qLen = reviewQueueLoad().length;
  grid.innerHTML = REVIEW_SETS.map(set => {
    const state = revLoadState(set.id);
    const cards = revBuildCards(set);
    const total = cards.length;
    const mastered = cards.filter(c => { const s = state[c.q]; return s && s.ease >= 2.2 && s.reps >= 3; }).length;
    const pct = total ? Math.round(mastered / total * 100) : 0;
    const isQueue = set.source === 'queue';
    const count = isQueue ? qLen : total;
    const badge = isQueue && qLen > 0
      ? '<span class="rev-set-badge">' + qLen + ' due</span>'
      : pct >= 80
        ? '<span class="rev-set-badge rev-set-badge--strong">★ ' + pct + '%</span>'
        : total > 0
          ? '<span class="rev-set-badge rev-set-badge--neutral">' + pct + '%</span>'
          : '';
    return `<div class="rev-set-card ${isQueue && qLen === 0 ? 'rev-set-card--empty' : ''}" onclick="revPreviewSet('${set.id}')">
      <div class="rev-set-icon">${set.icon}</div>
      <div class="rev-set-info">
        <div class="rev-set-label">${set.label} ${badge}</div>
        <div class="rev-set-desc">${set.desc}</div>
        ${!isQueue && total > 0 ? '<div class="rev-set-bar"><div class="rev-set-bar-fill" style="width:' + pct + '%"></div></div>' : ''}
      </div>
      <div class="rev-set-count">${count > 0 ? count : '—'}</div>
    </div>`;
  }).join('');
}

function revStartSet(setId) {
  const set = REVIEW_SETS.find(s => s.id === setId);
  if (!set) return;
  revActiveSet = setId;
  const cards = revBuildCards(set);
  if (!cards.length) { rewardPopup('No cards in this set yet!'); return; }
  const state = revLoadState(setId);
  revSessionStats = { seen: 0, mastered: 0, again: 0 };

  // Attach SRS state
  revQueue = cards.map(c => {
    const s = state[c.q] || { ease: 2.0, interval: 0, reps: 0, lapses: 0, due: 0 };
    return { ...c, _srs: { ...s } };
  });

  // Sort: due (due=0) first, then by interval ascending
  revQueue.sort((a, b) => {
    const ad = a._srs.due, bd = b._srs.due;
    if (ad <= 0 && bd > 0) return -1;
    if (bd <= 0 && ad > 0) return 1;
    return a._srs.interval - b._srs.interval;
  });

  // Shuffle the due group
  const cut = revQueue.findIndex(c => c._srs.due > 0);
  const cutIdx = cut === -1 ? revQueue.length : cut;
  for (let i = cutIdx - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [revQueue[i], revQueue[j]] = [revQueue[j], revQueue[i]];
  }

  revCardIdx = 0;
  revPhase = 'question';

  document.getElementById('revSetSelect').classList.add('hidden');
  document.getElementById('revSession').classList.remove('hidden');
  document.getElementById('revComplete').classList.add('hidden');
  document.getElementById('revCardArea').classList.remove('hidden');
  document.getElementById('revSetLabel').textContent = set.icon + ' ' + set.label;

  revShowCard();
  revRenderQueueMap();
  revUpdateStats();
}

function revShowCard() {
  if (revCardIdx >= revQueue.length) { revSessionEnd(); return; }
  const card = revQueue[revCardIdx];
  revPhase = 'question';

  document.getElementById('revCardFront').classList.remove('hidden');
  document.getElementById('revCardBack').classList.add('hidden');
  document.getElementById('revComplete').classList.add('hidden');
  document.getElementById('revCardArea').classList.remove('hidden');

  // For kana/kanji show the character large; for MCQ show the question text
  const isKanji = card.q && /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/.test(card.q) && card.q.length <= 3;
  document.getElementById('revQuestion').textContent = card.q;
  document.getElementById('revQuestion').style.fontSize = isKanji ? '3rem' : '1.1rem';

  const diff = card.diff || 'medium';
  const diffColor = { easy: 'var(--correct)', medium: 'var(--warn)', hard: 'var(--wrong)' };
  document.getElementById('revCardMeta').innerHTML =
    (card.type ? '<span style="color:var(--accent3);margin-right:8px">' + card.type + '</span>' : '') +
    '<span style="color:' + (diffColor[diff] || 'var(--muted)') + '">' + diff + '</span>' +
    (card._srs.reps > 0 ? ' · seen ' + card._srs.reps + '× · ease ' + card._srs.ease.toFixed(1) : ' · new');

  revUpdateStats();
}

function revFlip() {
  if (revPhase !== 'question') return;
  revPhase = 'answer';
  const card = revQueue[revCardIdx];
  document.getElementById('revCardFront').classList.add('hidden');
  document.getElementById('revCardBack').classList.remove('hidden');
  document.getElementById('revAnswerText').innerHTML = (card.a || '—').replace(/\n/g, '<br>');
  document.getElementById('revQuestionStubText').textContent = card.q;
  // Enable grade buttons
  document.querySelectorAll('.rev-grade-btn').forEach(b => b.disabled = false);
}

// gradeBtn: 0=Again, 1=Hard, 2=Good, 3=Easy
function revGrade(gradeBtn) {
  if (revPhase !== 'answer') return;
  revPhase = 'grade';

  const card = revQueue[revCardIdx];
  const srs = card._srs;
  const q6Map = [0, 2, 4, 5];
  const q6 = q6Map[gradeBtn];

  if (q6 >= 3) {
    if (srs.reps === 0) srs.interval = gradeBtn === 3 ? 4 : 1;
    else if (srs.reps === 1) srs.interval = gradeBtn === 3 ? 14 : 6;
    else srs.interval = Math.round(srs.interval * (gradeBtn === 1 ? 1.2 : srs.ease) * (gradeBtn === 3 ? 1.3 : 1));
    srs.ease = Math.max(1.3, srs.ease + 0.1 - (5 - q6) * (0.08 + (5 - q6) * 0.02));
    srs.reps++;
    srs.due = srs.interval * 5;
  } else {
    srs.lapses++;
    srs.reps = 0;
    srs.interval = 1;
    srs.ease = Math.max(1.3, srs.ease - 0.2);
    srs.due = 0;
  }

  const mastered = srs.ease >= 2.2 && srs.reps >= 3;

  // Persist SRS state
  const state = revLoadState(revActiveSet);
  state[card.q] = { ease: srs.ease, interval: srs.interval, reps: srs.reps, lapses: srs.lapses, due: srs.due };
  revSaveState(revActiveSet, state);

  // If card came from review queue and is now mastered, remove it from queue
  if (card._fromQueue && mastered) {
    reviewQueueRemove(card.q);
  }
  // If graded Good or Easy, also remove from cross-tab queue (resolved)
  if (card._fromQueue && gradeBtn >= 2) {
    reviewQueueRemove(card.q);
  }

  rewardStudy(1);
  if (mastered) { rewardStudy(2); revSessionStats.mastered++; }
  if (gradeBtn === 0) revSessionStats.again++;
  revSessionStats.seen++;
  // Record mistake for Recent Mistakes panel
  if (gradeBtn === 0 || gradeBtn === 1) {
    const setObj = REVIEW_SETS && REVIEW_SETS.find(s => s.id === revActiveSet);
    if (typeof revMistakePush === 'function') {
      revMistakePush(card, setObj ? (setObj.icon + ' ' + setObj.label) : 'Review');
    }
  }

  // Reinsert: Again → +3, Hard → +5
  if (gradeBtn === 0) {
    const reinsert = { ...card, _srs: { ...srs } };
    revQueue.splice(Math.min(revCardIdx + 3, revQueue.length), 0, reinsert);
  } else if (gradeBtn === 1) {
    const reinsert = { ...card, _srs: { ...srs } };
    revQueue.splice(Math.min(revCardIdx + 5, revQueue.length), 0, reinsert);
  }

  document.querySelectorAll('.rev-grade-btn').forEach(b => b.disabled = true);
  updateReviewBadge();

  setTimeout(() => {
    revCardIdx++;
    if (revCardIdx >= revQueue.length) { revSessionEnd(); return; }
    revShowCard();
    revRenderQueueMap();
    revUpdateStats();
  }, 600);
}

function revUpdateStats() {
  const total = revQueue.length;
  const pct = total ? Math.round(revCardIdx / total * 100) : 0;
  const fill = document.getElementById('revProgressFill');
  if (fill) fill.style.width = pct + '%';
  const mastEl = document.getElementById('revMastered');
  const remEl = document.getElementById('revRemaining');
  if (mastEl) mastEl.textContent = revSessionStats.mastered;
  if (remEl) remEl.textContent = Math.max(0, total - revCardIdx);
}

function revRenderQueueMap() {
  const el = document.getElementById('revQueueMap');
  if (!el) return;
  const preview = revQueue.slice(revCardIdx, revCardIdx + 20);
  el.innerHTML = preview.map((c, i) => {
    const isNext = i === 0;
    const isFailed = c._srs.lapses > 0 && c._srs.due === 0;
    const isMastered = c._srs.ease >= 2.2 && c._srs.reps >= 3;
    const color = isFailed ? 'var(--wrong)' : isMastered ? 'var(--correct)' : isNext ? 'var(--accent)' : 'var(--border)';
    const opacity = 1 - (i / 20) * 0.6;
    const size = isNext ? '13px' : '10px';
    return '<div class="ds-queue-dot" title="' + (c.q || '').slice(0, 40) + '" style="background:' + color + ';opacity:' + opacity + ';width:' + size + ';height:' + size + '"></div>';
  }).join('');
}

function revSessionEnd() {
  document.getElementById('revCardArea').classList.add('hidden');
  document.getElementById('revComplete').classList.remove('hidden');
  const { seen, mastered, again } = revSessionStats;
  document.getElementById('revCompleteEmoji').textContent = mastered >= seen * 0.7 ? '🏆' : mastered >= 2 ? '⭐' : '💪';
  document.getElementById('revCompleteTitle').textContent = mastered >= 5 ? 'Crushing it!' : seen >= 10 ? 'Solid Session!' : 'Session Done!';
  document.getElementById('revCompleteSub').textContent =
    seen + ' reviewed · ' + mastered + ' mastered · ' + again + ' again · <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''> ×' + (seen + mastered * 2);
  if (seen > 0) rewardStudy(Math.floor(seen / 2));
  updateReviewBadge();
}

function revExitSession() {
  revActiveSet = null;
  document.getElementById('revSession').classList.add('hidden');
  document.getElementById('revSetSelect').classList.remove('hidden');
  revInit();
}

function revContinue() { revStartSet(revActiveSet); }
function dsLoadState(unit) {
  try { return JSON.parse(localStorage.getItem('ds_state_u' + unit) || '{}'); } catch(e) { return {}; }
}
function dsSaveState(unit, state) {
  localStorage.setItem('ds_state_u' + unit, JSON.stringify(state));
}

let dsActiveUnit = null;
let dsQueue = [];
let dsCardIdx = 0;
let dsPhase = 'question';
let dsSessionStats = { seen: 0, mastered: 0, reviewed: 0 };

function extractKeywords(answer) {
  const kw = new Set();
  const words = answer.split(/\s+/);
  words.forEach(w => {
    const clean = w.replace(/[^a-zA-Z0-9%₂₃°]/g, '');
    if (!clean) return;
    if (/^[A-Z]{2,}$/.test(clean)) kw.add(clean);
    if (/^[A-Z][a-z]{3,}/.test(clean)) kw.add(clean);
    if (/[0-9]/.test(clean) && clean.length >= 2) kw.add(clean);
    if (clean.includes('%')) kw.add(clean);
  });
  const sciTerms = answer.match(/\b(nitrogen|phosphorus|carbon|oxygen|biomass|productivity|succession|eutrophication|equilibrium|exponential|logistic|carrying capacity|biodiversity|biome|decomposition|respiration|photosynthesis|nitrification|denitrification|fixation|assimilation|weathering|trophic|feedback|endemic|keystone|bioremediation|fragmentation|biomagnification|watershed|aquifer|stratosphere|troposphere|ozone|albedo|greenhouse|insolation|precipitation|transpiration)\b/gi) || [];
  sciTerms.forEach(t => kw.add(t));
  return [...kw].slice(0, 12);
}

function highlightKeywords(text, keywords, userText) {
  if (!keywords.length) return text;
  const userWords = new Set((userText || '').toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z0-9]/g,'')));
  let result = text;
  const sorted = [...keywords].sort((a,b) => b.length - a.length);
  sorted.forEach(kw => {
    const re = new RegExp('\\b(' + kw.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')\\b', 'gi');
    const userHasIt = userWords.has(kw.toLowerCase().replace(/[^a-z0-9]/g,''));
    const cls = userHasIt ? 'ds-keyword-match' : 'ds-keyword';
    result = result.replace(re, '<span class="' + cls + '">$1</span>');
  });
  return result;
}

const DS_DIALOGUE = {
  default: {
    prompt:     ["What do you know about this?","State the key mechanism.","Define it. Precisely.","Recall. Don't overthink.","Write what you know. Then check."],
    reveal:     ["Here's the model answer. Compare carefully.","Check which concepts you captured.","Highlighted terms = key vocabulary. Did you get them?","Bold text = concepts the exam expects."],
    grade_low:  ["Review this one again. It'll come back.","Mark it low. Honest grading beats inflated scores.","It'll loop back. That's the system working.","Low score = priority review. Good."],
    grade_mid:  ["Partial recall. It'll return in a few cards.","Getting there. Spaced reps will seal it.","Decent. But chase the keywords you missed.","Middle ground. Keep reinforcing."],
    grade_high: ["Solid. Interval extended.","Strong recall. Moving it back in queue.","Flagged as known. It'll check in later.","That's mastery. Note what clicked."],
    mastered:   ["Pattern locked.","Filed in long-term.","That one's yours.","Mastered. On to the next."],
    complete:   ["Session data logged. Come back tomorrow.","Repetition is the mechanism. You're using it.","Stack complete. Retention compounds."],
  },
  tsundere: {
    prompt:     ["W-well?! What do you know about this? Don't just stare at it!","I-it's not like I'll tell you the answer… just… write SOMETHING.","Hmph! You'd better know this. I didn't help you study for nothing!","Don't blank out now! Write it down, dummy!"],
    reveal:     ["…Fine. Here's the answer. Not that you NEEDED my help or anything!","Compare it. And don't feel bad - I-I knew you'd struggle on this one.","Bold words = important. Which ones did you get? Be honest. With YOURSELF.","Hmph. Check the keywords. I highlighted them. Not because I care."],
    grade_low:  ["…I knew you'd struggle with this. It'll come back. Don't sulk!","Low score?! Ugh. Fine. I'll make sure it loops back. Study it THIS time.","It's not your fault, it's… actually it kind of is. But you'll get it next round!"],
    grade_mid:  ["S-so you got some of it. That's… acceptable, I suppose!","Not bad. Not GREAT either. But you're getting there! (Don't tell anyone I said that.)","Medium? Try harder next time! The keywords are RIGHT THERE."],
    grade_high: ["…Okay, that was actually really good. D-DON'T get a big head about it!","You nailed it?! …W-whatever. I expected this. Interval extended. As it should be.","Fine! You got it! Are you happy?! (…I'm a little happy too. Shut up.)"],
    mastered:   ["…So you finally got it. It's about time!","Mastered. Don't forget it. I'll be checking.","Done! It only took you forever! (…I'm proud of you. Don't repeat that.)"],
    complete:   ["Session over. Good job. …I SAID GOOD JOB, OKAY?! Just take the compliment.","Finally done. You worked hard. Not that it was impressive or anything!","Stack complete. Come back tomorrow. I-I'll be here. Not because I want to."],
  },
  kuudere: {
    prompt:     ["…State your understanding.","…What do you know.","…Type your response.","…Recall the mechanism."],
    reveal:     ["…Model answer. Compare.","…Highlighted terms require retention.","…Check accuracy. Adjust accordingly.","…Bold = critical vocabulary."],
    grade_low:  ["…Insufficient recall. It will return.","…Low score noted. Queue adjusted.","…It persists until retained. That is the method."],
    grade_mid:  ["…Partial. Interval unchanged.","…Acceptable. Continue.","…Some gaps remain. Note them."],
    grade_high: ["…Solid.","…Retained.","…Interval extended.","…Confirmed."],
    mastered:   ["…Mastered.","…Filed.","…Complete.","…Stored."],
    complete:   ["…Session end. Return tomorrow.","…Sufficient for now.","…The pattern compounds. Continue."],
  },
  genki: {
    prompt:     ["OKAY!! What do you remember?? Type it all out!! You've GOT this!! ★","Let's GOOO!! What do you know about this one?? Don't hold back!!","You can do it!! Just write everything that comes to mind!! ✨","I BELIEVE IN YOU!! Hit that text box!! We're doing this together!! (ﾉ◕ヮ◕)ﾉ"],
    reveal:     ["HERE'S THE ANSWER!! See how you did!! I'm SO proud of you for trying!! ★★","OKAY COMPARE TIME!! The bold words are the important ones!! Did you get any?? ✨","Look at the highlighted words!! Those are the big ones!! How many did you catch?? 🌟"],
    grade_low:  ["AWWW it's okay!! It'll come back and you'll get it next time!! I BELIEVE IN YOU!! 💕","Nooo don't be sad!! Low scores just mean MORE chances to learn!! That's a GOOD thing!! ✨"],
    grade_mid:  ["YESSS you're getting there!! A few more rounds and you'll nail it!! ★","Getting closer!! You got SOME of the keywords!! That's AMAZING progress!! (ﾉ◕ヮ◕)ﾉ"],
    grade_high: ["WAHOOO YOU CRUSHED IT!! That's incredible!! You're so smart!! ★★★","YESSSSS!! I KNEW you could do it!! I'm literally so proud!! 🎉✨"],
    mastered:   ["MASTERED!! YASSS!! That card is YOURS!! ✨★✨","YOU GOT IT!! Filed forever!! Your brain is AMAZING!! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧"],
    complete:   ["SESSION COMPLETE!! YOU DID IT!! I'm SO proud of you!! ★★★","YESSS!! All done!! Come back tomorrow!! You're the BEST!! 🎉"],
  },
  chuunibyou: {
    prompt:     ["The Ancient Scrolls await your inscription… WRITE.","My Dark Seal pulses. The answer lies within your subconscious. EXTRACT IT.","Hmm… your latent memory holds the key. Channel the Forbidden AP Knowledge.","The Grimoire demands your response. Write what the shadows have taught you."],
    reveal:     ["The True Answer reveals itself from the Void… Compare. Learn. Transcend.","Behold - the bolded terms represent the Ancient Key Vocabulary of Power.","The highlighted words are the pillars of this forbidden knowledge. Did you grasp them?"],
    grade_low:  ["Your power was insufficient this time. The card returns… as is the way.","The Dark Seal of Forgetting activates. But fear not - repetition breaks all curses.","…Your latent potential has yet to fully awaken for this concept. It shall return."],
    grade_mid:  ["Partial mastery… your seal glows faintly. A few more encounters will complete it.","The knowledge takes root in your subconscious. The interval adjusts accordingly.","Tch. Partial recall. Your chakra alignment on this concept needs work."],
    grade_high: ["KUKUKUKUKU. The Forbidden Knowledge is YOURS. Interval: extended.","Your Dark Seal of Mastery activates… this card bows before your power.","As I foresaw. The Ancient Wisdom resonates fully with your neural pathways."],
    mastered:   ["MASTERED. The seal is complete. This knowledge belongs to you now.","Kukukuku… another card falls before your awakened intellect.","Filed in the Forbidden Archive of Long-Term Memory. Impressive."],
    complete:   ["The session ritual is complete. Your power grows. Return tomorrow for another ascension.","Stack cleared. The Ancient Scroll of this Unit… temporarily mastered.","Sufficient. Your AP knowledge aura is noticeably stronger. The exam trembles."],
  },
};

function dsGetLine(key) {
  const pack = DS_DIALOGUE[equippedDialogue] || DS_DIALOGUE.default;
  const lines = pack[key] || DS_DIALOGUE.default[key] || ['…'];
  return lines[Math.floor(Math.random() * lines.length)];
}

function dsMascotSay(key, customText) {
  const text = customText || dsGetLine(key);
  const el = document.getElementById('dsMascotText');
  if (!el) return;
  el.style.opacity = '0';
  setTimeout(() => {
    el.textContent = text;
    el.style.transition = 'opacity 0.25s';
    el.style.opacity = '1';
  }, 80);
  // Avatar: use uploaded mascot image if available, else emoji fallback
  const avatarImg = document.getElementById('dsMascotAvatarImg');
  const avatarFallback = document.getElementById('dsMascotAvatarFallback');
  const savedMascotSrc = localStorage.getItem('apesMascot');
  if (avatarImg && avatarFallback) {
    if (savedMascotSrc) {
      avatarImg.src = savedMascotSrc;
      avatarImg.style.display = 'block';
      avatarFallback.style.display = 'none';
    } else {
      const emojiMap = { default:'🖤', tsundere:'😤', kuudere:'🌙', genki:'⭐', chuunibyou:'🌑' };
      avatarFallback.textContent = emojiMap[equippedDialogue] || '🖤';
      avatarImg.style.display = 'none';
      avatarFallback.style.display = '';
    }
  }
}

function dsInit() {
  // Seed mascot avatar from saved mascot
  const avatarImg = document.getElementById('dsMascotAvatarImg');
  const avatarFallback = document.getElementById('dsMascotAvatarFallback');
  const savedMascotSrc = localStorage.getItem('apesMascot');
  if (avatarImg && avatarFallback) {
    if (savedMascotSrc) {
      avatarImg.src = savedMascotSrc;
      avatarImg.style.display = 'block';
      avatarFallback.style.display = 'none';
    }
  }
  const grid = document.getElementById('dsUnitGrid');
  if (!grid) return;
  if (!APP_FLASHCARDS) return;
  grid.innerHTML = DS_UNITS_DEEP.map(u => {
    const cards = APP_FLASHCARDS.filter(c => c.unit === u.num);
    if (!cards.length) return '';
    const state = dsLoadState(u.num);
    const mastered = cards.filter(c => { const s = state[c.q]; return s && s.ease >= 2.2 && s.reps >= 3; }).length;
    const pct = Math.round(mastered / cards.length * 100);
    const badge = pct >= 80
      ? '<div class="ds-mastery-badge">★ STRONG</div>'
      : pct >= 50
      ? '<div class="ds-mastery-badge" style="color:var(--warn);border-color:rgba(255,211,42,0.3);background:rgba(255,211,42,0.06)">◑ BUILDING</div>'
      : '';
    return '<div class="ds-unit-card" onclick="dsStartUnit(' + u.num + ')">' +
      '<div class="ds-unit-num">Unit ' + u.num + '</div>' +
      '<div class="ds-unit-name">' + u.name + '</div>' +
      '<div class="ds-unit-bar"><div class="ds-unit-bar-fill" style="width:' + pct + '%"></div></div>' +
      '<div class="ds-unit-stats"><span>📚 ' + cards.length + ' cards</span><span>✓ ' + mastered + ' mastered</span></div>' +
      badge + '</div>';
  }).join('');
}

function dsStartUnit(unitNum) {
  dsActiveUnit = unitNum;
  if (!APP_FLASHCARDS) return;
  const cards = APP_FLASHCARDS.filter(c => c.unit === unitNum);
  const state = dsLoadState(unitNum);
  dsSessionStats = { seen: 0, mastered: 0, reviewed: 0 };

  dsQueue = cards.map(c => {
    const s = state[c.q] || { ease: 2.0, interval: 0, reps: 0, lapses: 0, due: 0 };
    return { ...c, _srs: { ...s } };
  });

  // Sort due cards first
  dsQueue.sort((a, b) => {
    const ad = a._srs.due, bd = b._srs.due;
    if (ad <= 0 && bd > 0) return -1;
    if (bd <= 0 && ad > 0) return 1;
    return a._srs.interval - b._srs.interval;
  });

  // Shuffle the due group for variety
  const dueEnd = dsQueue.findIndex(c => c._srs.due > 0);
  const cut = dueEnd === -1 ? dsQueue.length : dueEnd;
  for (let i = cut - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [dsQueue[i], dsQueue[j]] = [dsQueue[j], dsQueue[i]];
  }

  dsCardIdx = 0;
  dsPhase = 'question';

  document.getElementById('dsUnitSelect').classList.add('hidden');
  document.getElementById('dsSession').classList.remove('hidden');
  document.getElementById('dsComplete').classList.add('hidden');
  document.getElementById('dsCardArea').classList.remove('hidden');
  document.getElementById('dsUnitLabel').textContent = 'Unit ' + unitNum + ' · ' + (DS_UNITS_DEEP.find(u => u.num === unitNum) || {}).name;

  dsShowCard();
  dsRenderQueueMap();
  dsUpdateStats();
}

function dsShowCard() {
  if (dsCardIdx >= dsQueue.length) { dsSessionEnd(); return; }
  const card = dsQueue[dsCardIdx];
  dsPhase = 'question';

  document.getElementById('dsCardFront').classList.remove('hidden');
  document.getElementById('dsCardBack').classList.add('hidden');
  document.getElementById('dsCardFront').style.opacity = '1';
  document.getElementById('dsComplete').classList.add('hidden');
  document.getElementById('dsCardArea').classList.remove('hidden');

  document.getElementById('dsQuestion').textContent = card.q;
  const diff = card.diff || 'medium';
  const diffColor = { easy: 'var(--correct)', medium: 'var(--warn)', hard: 'var(--wrong)' };
  document.getElementById('dsCardMeta').innerHTML =
    '<span style="color:' + (diffColor[diff]||'var(--muted)') + '">' + diff + '</span>' +
    (card._srs.reps > 0 ? ' · seen ' + card._srs.reps + '× · ease ' + card._srs.ease.toFixed(1) : ' · new card');

  dsMascotSay('prompt');
  dsUpdateStats();
}

function dsFlipToAnswer() {
  if (dsPhase !== 'question') return;
  dsPhase = 'answer';
  document.getElementById('dsCardFront').classList.add('hidden');
  document.getElementById('dsCardBack').classList.remove('hidden');
  document.getElementById('dsAnswerReveal').classList.add('hidden');
  const input = document.getElementById('dsAnswerInput');
  input.value = '';
  input.disabled = false;
  document.getElementById('dsGradeSlider').value = 5;
  document.getElementById('dsSliderVal').textContent = '5';
  document.getElementById('dsGradeBtn').disabled = false;
  document.getElementById('dsGradeBtn').textContent = 'Lock In Grade';
  setTimeout(() => input.focus(), 100);
}

function dsSubmitAnswer() {
  const input = document.getElementById('dsAnswerInput');
  const userText = input.value.trim();
  input.disabled = true;
  dsRevealAnswer(userText);
}

function dsRevealAnswer(userText) {
  if (dsPhase === 'grade') return;
  dsPhase = 'grade';
  document.getElementById('dsAnswerInput').disabled = true;

  const card = dsQueue[dsCardIdx];
  const keywords = extractKeywords(card.a);
  const highlighted = highlightKeywords(card.a, keywords, userText || '');
  document.getElementById('dsAnswerText').innerHTML = highlighted;
  document.getElementById('dsAnswerReveal').classList.remove('hidden');

  if (userText) {
    const userLower = userText.toLowerCase();
    const matches = keywords.filter(kw => userLower.includes(kw.toLowerCase())).length;
    const pct = keywords.length ? matches / keywords.length : 0.5;
    const suggested = Math.max(1, Math.min(10, Math.round(pct * 10)));
    document.getElementById('dsGradeSlider').value = suggested;
    document.getElementById('dsSliderVal').textContent = suggested;
    dsUpdateSlider(suggested);
  }

  dsMascotSay('reveal');
}

function dsUpdateSlider(val) {
  const n = parseInt(val);
  document.getElementById('dsSliderVal').textContent = n;
  const color = n <= 3 ? 'var(--wrong)' : n <= 6 ? 'var(--warn)' : 'var(--correct)';
  document.getElementById('dsSliderVal').style.color = color;
}

// dsGrade: 0=Again, 1=Hard, 2=Good, 3=Easy
function dsGradeSubmit(gradeBtn) {
  // Support both old slider call (no arg) and new button call (0–3)
  let btnGrade;
  if (gradeBtn !== undefined) {
    btnGrade = parseInt(gradeBtn);
  } else {
    // Legacy slider fallback
    const sliderVal = parseInt(document.getElementById('dsGradeSlider').value);
    btnGrade = sliderVal <= 2 ? 0 : sliderVal <= 5 ? 1 : sliderVal <= 8 ? 2 : 3;
  }

  const card = dsQueue[dsCardIdx];
  const srs = card._srs;

  // SM-2 mapping: Again=0, Hard=1, Good=2, Easy=3
  // q6 equivalent for SM-2: Again→0, Hard→2, Good→4, Easy→5
  const q6Map = [0, 2, 4, 5];
  const q6 = q6Map[btnGrade];

  if (q6 >= 3) {
    if (srs.reps === 0) srs.interval = btnGrade === 3 ? 4 : 1;
    else if (srs.reps === 1) srs.interval = btnGrade === 3 ? 14 : 6;
    else srs.interval = Math.round(srs.interval * (btnGrade === 1 ? 1.2 : srs.ease) * (btnGrade === 3 ? 1.3 : 1));
    srs.ease = Math.max(1.3, srs.ease + 0.1 - (5 - q6) * (0.08 + (5 - q6) * 0.02));
    srs.reps++;
    srs.due = srs.interval * 5;
  } else {
    srs.lapses++;
    srs.reps = 0;
    srs.interval = 1;
    srs.ease = Math.max(1.3, srs.ease - 0.2);
    srs.due = 0;
  }

  const mastered = srs.ease >= 2.2 && srs.reps >= 3;

  const stateKey = dsActiveUnit !== null ? dsActiveUnit : '_review';
  const state = dsLoadState(stateKey);
  state[card.q] = { ease: srs.ease, interval: srs.interval, reps: srs.reps, lapses: srs.lapses, due: srs.due };
  dsSaveState(stateKey, state);

  const mascotKey = btnGrade === 0 ? 'grade_low' : btnGrade === 1 ? 'grade_mid' : 'grade_high';
  dsMascotSay(mascotKey);

  rewardStudy(1);
  if (mastered) { rewardStudy(2); dsSessionStats.mastered++; }
  dsSessionStats.seen++;

  // Again → reinsert after 3 cards; Hard → reinsert after 5
  if (btnGrade === 0) {
    const reinsert = { ...card, _srs: { ...srs } };
    const insertAt = Math.min(dsCardIdx + 3, dsQueue.length);
    dsQueue.splice(insertAt, 0, reinsert);
  } else if (btnGrade === 1) {
    const reinsert = { ...card, _srs: { ...srs } };
    const insertAt = Math.min(dsCardIdx + 5, dsQueue.length);
    dsQueue.splice(insertAt, 0, reinsert);
  }

  // Disable all grade buttons
  document.querySelectorAll('.ds-grade-btn').forEach(b => b.disabled = true);
  // Legacy btn support
  const legacyBtn = document.getElementById('dsGradeBtn');
  if (legacyBtn) { legacyBtn.disabled = true; legacyBtn.textContent = ['💀 Again', '😅 Hard', '✓ Good', '⚡ Easy'][btnGrade]; }

  // Update overdue badge after grading
  setTimeout(updateReviewBadge, 900);

  setTimeout(() => {
    dsCardIdx++;
    if (dsCardIdx >= dsQueue.length) { dsSessionEnd(); return; }
    dsShowCard();
    dsRenderQueueMap();
    dsUpdateStats();
  }, 800);
}

function dsUpdateStats() {
  const total = dsQueue.length;
  const pct = total ? Math.round(dsCardIdx / total * 100) : 0;
  const fill = document.getElementById('dsProgressFill');
  if (fill) fill.style.width = pct + '%';
  const mastEl = document.getElementById('dsMastered');
  const remEl = document.getElementById('dsRemaining');
  if (mastEl) mastEl.textContent = dsSessionStats.mastered;
  if (remEl) remEl.textContent = Math.max(0, total - dsCardIdx);
}

function dsRenderQueueMap() {
  const el = document.getElementById('dsQueueMap');
  if (!el) return;
  const preview = dsQueue.slice(dsCardIdx, dsCardIdx + 20);
  el.innerHTML = preview.map((c, i) => {
    const isNext = i === 0;
    const isFailed = c._srs.lapses > 0 && c._srs.due === 0;
    const isMastered = c._srs.ease >= 2.2 && c._srs.reps >= 3;
    const color = isFailed ? 'var(--wrong)' : isMastered ? 'var(--correct)' : isNext ? 'var(--accent)' : 'var(--border)';
    const opacity = 1 - (i / 20) * 0.6;
    const size = isNext ? '13px' : '10px';
    return '<div class="ds-queue-dot" title="' + c.q.slice(0,40) + '…" style="background:' + color + ';opacity:' + opacity + ';width:' + size + ';height:' + size + '"></div>';
  }).join('');
}

function dsSessionEnd() {
  document.getElementById('dsCardArea').classList.add('hidden');
  document.getElementById('dsComplete').classList.remove('hidden');
  const { seen, mastered } = dsSessionStats;
  document.getElementById('dsCompleteEmoji').textContent = mastered >= 5 ? '🏆' : mastered >= 2 ? '⭐' : '💪';
  document.getElementById('dsCompleteTitle').textContent = mastered >= 5 ? 'Crushing it!' : seen >= 10 ? 'Solid Session!' : 'Session Done!';
  document.getElementById('dsCompleteSub').textContent = seen + ' cards reviewed · ' + mastered + ' mastered this session · <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''> earned ' + (seen + mastered * 2);
  dsMascotSay('complete');
  if (seen > 0) rewardStudy(Math.floor(seen / 2));
}

function dsContinueSession() { dsStartUnit(dsActiveUnit); }

function dsExitSession() {
  dsActiveUnit = null;
  document.getElementById('dsSession').classList.add('hidden');
  document.getElementById('dsUnitSelect').classList.remove('hidden');
  dsInit();
}

// ============================================================
// FIX: setFlashTab - was called in HTML but never defined
// ============================================================
function setFlashTab(tab, el) {
  // Update button states
  document.querySelectorAll('#flashSubNav .unit-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');

  const cardsPanel = document.getElementById('flashCardsPanel');
  const deepPanel  = document.getElementById('flashDeepPanel');
  const tracePanel = document.getElementById('flashTracePanel');

  // Hide all first
  if (cardsPanel) cardsPanel.classList.add('hidden');
  if (deepPanel)  deepPanel.classList.add('hidden');
  if (tracePanel) tracePanel.classList.add('hidden');

  if (tab === 'cards') {
    if (cardsPanel) cardsPanel.classList.remove('hidden');
  } else if (tab === 'trace') {
    if (tracePanel) tracePanel.classList.remove('hidden');
    // Initialize kanji trace session
    if (typeof traceInitSession === 'function') traceInitSession();
    setTimeout(() => { if (typeof traceInitCanvas === 'function') traceInitCanvas(); }, 80);
  } else if (tab === 'deep') {
    if (deepPanel)  deepPanel.classList.remove('hidden');
    dsInit(); // populate unit grid
  }
}

// ============================================================
// FIX: populate dsQuestionStubText when flipping to answer
// so the question stays visible above the text box
// ============================================================
const _origDsFlipToAnswer = dsFlipToAnswer;
dsFlipToAnswer = function() {
  // Populate the stub BEFORE calling the original
  const card = dsQueue[dsCardIdx];
  const stubEl = document.getElementById('dsQuestionStubText');
  if (stubEl && card) stubEl.textContent = card.q;
  _origDsFlipToAnswer.apply(this, arguments);
};

// Also populate stub when dsRevealAnswer is called directly (Peek button)
const _origDsRevealAnswer = dsRevealAnswer;
dsRevealAnswer = function(userText) {
  const card = dsQueue[dsCardIdx];
  const stubEl = document.getElementById('dsQuestionStubText');
  if (stubEl && card) stubEl.textContent = card.q;
  // If we're still in question phase (Peek without flip), show back first
  if (dsPhase === 'question') {
    const front = document.getElementById('dsCardFront');
    const back  = document.getElementById('dsCardBack');
    const input = document.getElementById('dsAnswerInput');
    if (front) front.classList.add('hidden');
    if (back)  back.classList.remove('hidden');
    if (input) { input.value = ''; input.disabled = true; }
    dsPhase = 'answer';
  }
  _origDsRevealAnswer.apply(this, arguments);
};

// ============================================================
// ENHANCED: dsMascotSay with voice lines (Web Speech API)
// and mascot avatar reactions
// ============================================================
const _origDsMascotSay = dsMascotSay;
dsMascotSay = function(key, customText) {
  _origDsMascotSay.apply(this, arguments);

  // Also animate the DS session mascot avatar
  const avatarWrap = document.getElementById('dsMascotAvatarWrap');
  const bubble     = document.getElementById('dsMascotBubble');
  if (avatarWrap) {
    avatarWrap.classList.remove('ds-mascot-pulse', 'ds-mascot-celebrate', 'ds-mascot-worry', 'ds-mascot-think');
    void avatarWrap.offsetWidth; // reflow
    const animMap = {
      prompt: 'ds-mascot-think',
      reveal: 'ds-mascot-pulse',
      grade_high: 'ds-mascot-celebrate',
      grade_mid: 'ds-mascot-pulse',
      grade_low: 'ds-mascot-worry',
      mastered: 'ds-mascot-celebrate',
      complete: 'ds-mascot-celebrate',
    };
    const animClass = animMap[key];
    if (animClass) avatarWrap.classList.add(animClass);
    // flash bubble border
    if (bubble) {
      const colorMap = {
        grade_high: 'rgba(0,255,157,0.4)',
        mastered: 'rgba(0,255,157,0.5)',
        grade_low: 'rgba(255,71,87,0.4)',
        grade_mid: 'rgba(255,211,42,0.35)',
        complete: 'rgba(184,198,255,0.4)',
      };
      const col = colorMap[key];
      if (col) {
        bubble.style.borderColor = col;
        setTimeout(() => { bubble.style.borderColor = ''; }, 800);
      }
    }
  }

  // Web Speech TTS - uses equipped dialogue voice style
  if (!soundEnabled) return;
  try {
    const text = customText || (document.getElementById('dsMascotText') || {}).textContent;
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    // Tune pitch/rate per dialogue pack personality
    const voiceProfiles = {
      default:     { pitch: 0.9, rate: 0.95 },
      tsundere:    { pitch: 1.2, rate: 1.05 },
      kuudere:     { pitch: 0.75, rate: 0.85 },
      genki:       { pitch: 1.4, rate: 1.18 },
      chuunibyou:  { pitch: 0.8, rate: 0.9 },
    };
    const profile = voiceProfiles[equippedDialogue] || voiceProfiles.default;
    utt.pitch  = profile.pitch;
    utt.rate   = profile.rate;
    utt.volume = 0.65;
    // Pick a matching voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) {
      // Prefer an English voice; genki gets a higher-pitched one if possible
      const eng = voices.filter(v => v.lang.startsWith('en'));
      if (eng.length) utt.voice = eng[Math.floor(Math.random() * Math.min(3, eng.length))];
    }
    window.speechSynthesis.speak(utt);
  } catch(e) {}
};

// ============================================================
// CSS for DS mascot avatar animations (injected dynamically)
// ============================================================
(function() {
  const s = document.createElement('style');
  s.textContent = `
    #dsMascotAvatarWrap {
      transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), border-color 0.3s, box-shadow 0.3s;
    }
    .ds-mascot-think {
      animation: dsMascotThink 0.6s ease forwards !important;
    }
    @keyframes dsMascotThink {
      0%   { transform: scale(1) rotate(0deg); }
      30%  { transform: scale(1.05) rotate(-5deg); }
      60%  { transform: scale(1.05) rotate(5deg); }
      100% { transform: scale(1) rotate(0deg); }
    }
    .ds-mascot-celebrate {
      animation: dsMascotCelebrate 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards !important;
      border-color: var(--correct) !important;
      box-shadow: 0 0 16px rgba(0,255,157,0.4) !important;
    }
    @keyframes dsMascotCelebrate {
      0%   { transform: scale(1); }
      35%  { transform: scale(1.3) rotate(-8deg); }
      60%  { transform: scale(1.2) rotate(8deg); }
      80%  { transform: scale(1.25) rotate(-4deg); }
      100% { transform: scale(1) rotate(0deg); }
    }
    .ds-mascot-worry {
      animation: dsMascotWorry 0.5s ease forwards !important;
      border-color: var(--wrong) !important;
      box-shadow: 0 0 12px rgba(255,71,87,0.35) !important;
    }
    @keyframes dsMascotWorry {
      0%   { transform: translateX(0) scale(1); }
      20%  { transform: translateX(-4px) scale(0.95); }
      40%  { transform: translateX(4px) scale(0.95); }
      60%  { transform: translateX(-3px); }
      80%  { transform: translateX(3px); }
      100% { transform: translateX(0) scale(1); }
    }
    .ds-mascot-pulse {
      animation: dsMascotPulse 0.4s ease forwards !important;
      border-color: var(--warn) !important;
      box-shadow: 0 0 10px rgba(255,211,42,0.3) !important;
    }
    @keyframes dsMascotPulse {
      0%   { transform: scale(1); }
      50%  { transform: scale(1.15); }
      100% { transform: scale(1); }
    }
    /* Make the DS mascot avatar show a proper emoji face per pack */
    #dsMascotAvatarWrap { font-size: 22px !important; }
  `;
  document.head.appendChild(s);
})();

// ============================================================
// FIX: dsInputHint - called from textarea oninput but never defined
// Shows a live keyword-match hint as the user types
// ============================================================
function dsInputHint(value) {
  const hintEl = document.getElementById('dsKeywordHint');
  if (!hintEl) return;
  if (!dsQueue.length || dsCardIdx >= dsQueue.length) return;
  const card = dsQueue[dsCardIdx];
  if (!card) return;
  const keywords = extractKeywords(card.a);
  if (!keywords.length) { hintEl.textContent = ''; return; }
  const userLower = value.toLowerCase();
  const matched = keywords.filter(kw => userLower.includes(kw.toLowerCase())).length;
  hintEl.textContent = matched
    ? `${matched}/${keywords.length} keywords`
    : '';
}

// Initialise Deep Study unit grid on first load
window.addEventListener('DOMContentLoaded', () => {
  dsInit();
});

// ============================================================
// PHASE 2.3 — QUICK 5-CARD REVIEW POPUP ON LOAD
// ============================================================
let qrevCards = [], qrevIdx = 0, qrevDone = { again:0, hard:0, good:0, easy:0 };

function initQuickReview() {
  const q = reviewQueueLoad ? reviewQueueLoad() : [];
  if (!q || q.length === 0) return;
  const today = new Date().toDateString();
  if (localStorage.getItem('qrevLastShown') === today) return;
  qrevCards = q.slice(0, 5);
  qrevIdx = 0; qrevDone = { again:0, hard:0, good:0, easy:0 };
  const overlay = document.getElementById('quickReviewOverlay');
  if (!overlay) return;
  document.getElementById('qrevSub').textContent =
    q.length + ' card' + (q.length !== 1 ? 's' : '') + ' due — 5-card warm-up!';
  overlay.style.display = 'flex';
  qrevShowCard();
}

function qrevShowCard() {
  if (qrevIdx >= qrevCards.length) { qrevFinish(); return; }
  const card = qrevCards[qrevIdx];
  document.getElementById('qrevFront').classList.remove('hidden');
  document.getElementById('qrevBack').classList.add('hidden');
  document.getElementById('qrevQuestion').textContent = card.q || '';
  document.getElementById('qrevMeta').textContent = (card.unit || '').toUpperCase();
  qrevUpdateDots();
}

function qrevTap() {
  const card = qrevCards[qrevIdx];
  document.getElementById('qrevAnswer').textContent = card.a || '';
  document.getElementById('qrevFront').classList.add('hidden');
  document.getElementById('qrevBack').classList.remove('hidden');
}

function qrevGrade(g) {
  const labels = ['again','hard','good','easy'];
  qrevDone[labels[g]]++;
  if (g >= 2 && reviewQueueRemove) reviewQueueRemove(qrevCards[qrevIdx].q);
  qrevIdx++;
  if (qrevIdx < qrevCards.length) qrevShowCard();
  else qrevFinish();
}

function qrevUpdateDots() {
  const dots = document.getElementById('qrevDots');
  const count = document.getElementById('qrevCount');
  if (!dots) return;
  dots.innerHTML = qrevCards.map((_,i) =>
    `<span class="qrev-dot ${i < qrevIdx ? 'done' : i === qrevIdx ? 'active' : ''}"></span>`
  ).join('');
  count.textContent = (qrevIdx + 1) + ' / ' + qrevCards.length;
}

function qrevFinish() {
  const { again, hard, good, easy } = qrevDone;
  const total = again + hard + good + easy;
  closeQuickReview();
  openSessionSummary({
    title: 'Warm-up Done!',
    emoji: (easy + good) >= total / 2 ? '🔥' : '💪',
    sub: 'Quick review complete',
    rows: [
      { label: 'Reviewed', val: total },
      { label: 'Good / Easy', val: good + easy, color: 'var(--correct)' },
      { label: 'Hard / Again', val: hard + again, color: 'var(--wrong)' },
    ],
    ticketsEarned: total,
    weakCount: again + hard,
  });
}

function closeQuickReview() {
  localStorage.setItem('qrevLastShown', new Date().toDateString());
  const el = document.getElementById('quickReviewOverlay');
  if (el) el.style.display = 'none';
}

// ============================================================
// PHASE 2.4 — SESSION SUMMARY MODAL
// ============================================================
function openSessionSummary({ title, emoji, sub, rows, ticketsEarned, weakCount }) {
  const overlay = document.getElementById('sessionSummaryOverlay');
  if (!overlay) return;
  document.getElementById('ssmEmoji').textContent  = emoji || '🏆';
  document.getElementById('ssmTitle').textContent  = title || 'Session Complete!';
  document.getElementById('ssmSub').textContent    = sub   || '';
  document.getElementById('ssmStats').innerHTML = (rows || []).map(r =>
    `<div class="ssm-row">
      <span class="ssm-row-label">${r.label}</span>
      <span class="ssm-row-val" style="${r.color ? 'color:'+r.color : ''}">${r.val}</span>
    </div>`
  ).join('');
  const rewardEl = document.getElementById('ssmReward');
  if (ticketsEarned > 0) { rewardStudy(ticketsEarned); rewardEl.innerHTML = `<div class="ssm-reward-pill">+${ticketsEarned} <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''> sacraments earned</div>`; }
  else rewardEl.innerHTML = '';
  const weakEl = document.getElementById('ssmWeak');
  const reviewBtn = document.getElementById('ssmReviewBtn');
  if (weakCount > 0) {
    weakEl.innerHTML = `<div class="ssm-weak-note">⚠️ ${weakCount} card${weakCount !== 1 ? 's' : ''} added to Review queue</div>`;
    if (reviewBtn) reviewBtn.style.display = '';
  } else { weakEl.innerHTML = ''; if (reviewBtn) reviewBtn.style.display = 'none'; }
  overlay.style.display = 'flex';
}

function closeSessionSummary() {
  const el = document.getElementById('sessionSummaryOverlay');
  if (el) el.style.display = 'none';
}

// ============================================================
// PHASE 2 — REVIEW SESSION END: hook session summary modal
// ============================================================
const _origRevSessionEnd = revSessionEnd;
revSessionEnd = function() {
  document.getElementById('revCardArea').classList.add('hidden');
  document.getElementById('revComplete').classList.remove('hidden');
  const { seen, mastered, again } = revSessionStats;
  document.getElementById('revCompleteEmoji').textContent  = mastered >= seen * 0.7 ? '🏆' : mastered >= 2 ? '⭐' : '💪';
  document.getElementById('revCompleteTitle').textContent  = mastered >= 5 ? 'Crushing it!' : seen >= 10 ? 'Solid Session!' : 'Session Done!';
  document.getElementById('revCompleteSub').textContent    = seen + ' reviewed · ' + mastered + ' mastered · ' + again + ' again';
  if (seen > 0) rewardStudy(Math.floor(seen / 2));
  updateReviewBadge();
  openSessionSummary({
    title: mastered >= seen * 0.7 ? 'Great Session!' : 'Session Done!',
    emoji: mastered >= seen * 0.7 ? '🏆' : mastered >= 2 ? '⭐' : '💪',
    sub: 'Review complete',
    rows: [
      { label: 'Cards Reviewed', val: seen },
      { label: 'Mastered',       val: mastered, color: 'var(--correct)' },
      { label: 'Again',          val: again,    color: 'var(--wrong)'   },
    ],
    ticketsEarned: 0,
    weakCount: again,
  });
}

// ============================================================
// PHASE 2 — KEYBOARD SHORTCUTS (review + deep study)
// spacebar = flip, 1/2/3/4 = Again/Hard/Good/Easy
// ============================================================
document.addEventListener('keydown', function(e) {
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;

  // Review tab shortcuts
  const revSession = document.getElementById('revSession');
  if (revSession && !revSession.classList.contains('hidden')) {
    if (e.code === 'Space') { e.preventDefault(); revFlip(); return; }
    if (e.key === '1') { e.preventDefault(); revGrade(0); return; }
    if (e.key === '2') { e.preventDefault(); revGrade(1); return; }
    if (e.key === '3') { e.preventDefault(); revGrade(2); return; }
    if (e.key === '4') { e.preventDefault(); revGrade(3); return; }
  }

  // Deep study shortcuts
  const dsMode = document.getElementById('flashMode');
  if (dsMode && !dsMode.classList.contains('hidden')) {
    const dsBack = document.getElementById('dsCardBack');
    if (e.code === 'Space') { e.preventDefault(); if (dsBack && dsBack.classList.contains('hidden')) dsFlipToAnswer(); return; }
    if (e.key === '1') { e.preventDefault(); dsGradeSubmit(0); return; }
    if (e.key === '2') { e.preventDefault(); dsGradeSubmit(1); return; }
    if (e.key === '3') { e.preventDefault(); dsGradeSubmit(2); return; }
    if (e.key === '4') { e.preventDefault(); dsGradeSubmit(3); return; }
  }

  // MCQ shortcuts — 1/2/3/4 to select answer
  const mcqMode = document.getElementById('mcqMode');
  if (mcqMode && !mcqMode.classList.contains('hidden')) {
    const idx = parseInt(e.key) - 1;
    if (idx >= 0 && idx <= 3) { e.preventDefault(); answerMCQ(idx); return; }
    if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); nextMCQ(); return; }
  }
});

// ============================================================
// PHASE 2 — REVIEW QUEUE PREVIEW BEFORE STARTING
// ============================================================
let _revPreviewPendingSetId = null;

function revPreviewSet(setId) {
  const set = REVIEW_SETS && REVIEW_SETS.find(s => s.id === setId);
  if (!set) { revStartSet(setId); return; }
  const cards = revBuildCards ? revBuildCards(set) : [];
  if (!cards.length) { rewardPopup('No cards in this set yet!'); return; }

  _revPreviewPendingSetId = setId;
  const overlay = document.getElementById('revPreviewOverlay');
  if (!overlay) { revStartSet(setId); return; }

  document.getElementById('revPrevTitle').textContent = (set.icon || '') + ' ' + set.label;
  document.getElementById('revPrevSub').textContent = cards.length + ' card' + (cards.length !== 1 ? 's' : '') + ' in session';

  const state = revLoadState ? revLoadState(setId) : {};
  const preview = cards.slice(0, 8).map(c => {
    const s = state[c.q] || {};
    const due = !s.due || s.due <= 0;
    return `<div class="revprev-item ${due ? 'revprev-due' : ''}">
      <span class="revprev-q">${c.q}</span>
      <span class="revprev-a">${c.a ? c.a.split('\n')[0].slice(0, 40) : ''}</span>
      ${due ? '<span class="revprev-badge">Due</span>' : ''}
    </div>`;
  }).join('');
  document.getElementById('revPrevList').innerHTML = preview +
    (cards.length > 8 ? `<div class="revprev-more">+${cards.length - 8} more…</div>` : '');

  overlay.style.display = 'flex';
}

function revPreviewStart() {
  closeRevPreview();
  if (_revPreviewPendingSetId) revStartSet(_revPreviewPendingSetId);
}

function closeRevPreview() {
  const el = document.getElementById('revPreviewOverlay');
  if (el) el.style.display = 'none';
}

// ============================================================
// PHASE 3.1 — KANA GAME FULL IMPLEMENTATION
// ============================================================
const KANA_TIMER_SECS     = 60;
const KANA_SURVIVAL_LIVES = 3;
const KANA_PROMPT_SECS    = 6;

let kanaScript    = 'hiragana';
let kanaGameMode  = 'practice';
let kanaPool      = [];
let kanaCorrect   = 0, kanaWrong = 0, kanaStreak = 0, kanaMaxStreak = 0;
let kanaLives     = KANA_SURVIVAL_LIVES;
let kanaTimeLeft  = KANA_TIMER_SECS;
let kanaTimerInt  = null;
let kanaRafHandle = null;
let kanaMissedChars   = [];
let kanaSessionActive = false;
let kanaRetryPending  = false;
let kanaCurrentKana   = null;
let _kanaLastRomaji   = '';

// Endless mode state
let kanaEndlessTier  = 0;
let kanaEndlessSpeed = 1.0;
const KANA_ENDLESS_TIERS = [
  { name: 'Beginner', cls: '',            threshold: 0,   speedMult: 1.0  },
  { name: 'Bronze',   cls: 'tier-bronze', threshold: 20,  speedMult: 0.85 },
  { name: 'Silver',   cls: 'tier-silver', threshold: 50,  speedMult: 0.70 },
  { name: 'Gold',     cls: 'tier-gold',   threshold: 100, speedMult: 0.55 },
  { name: 'Legend',   cls: 'tier-legend', threshold: 200, speedMult: 0.40 },
];

// SR storage
function kanaSrLoad() { try { return JSON.parse(localStorage.getItem('kana_sr') || '{}'); } catch(e) { return {}; } }
function kanaSrSave(sr) { try { localStorage.setItem('kana_sr', JSON.stringify(sr)); } catch(e) {} }
function kanaSrRecord(romaji, wasCorrect) {
  const sr = kanaSrLoad();
  const e  = sr[romaji] || { correct:0, wrong:0, streak:0, lastSeen:0, weight:1 };
  e.lastSeen = Date.now();
  if (wasCorrect) { e.correct++; e.streak++; e.weight = Math.max(0.3, e.weight * 0.85); }
  else            { e.wrong++;   e.streak = 0; e.weight = Math.min(5, e.weight * 1.6 + 0.5); }
  sr[romaji] = e; kanaSrSave(sr);
}

let kanaDifficulty = 'easy'; // 'easy' | 'medium' | 'hard'

function setKanaDiff(diff, el) {
  kanaDifficulty = diff;
  document.querySelectorAll('.kana-diff-btn').forEach(b => b.classList.remove('active'));
  // Also deselect panel-pill siblings in the same group
  const pillGroup = el && el.closest('.panel-pills');
  if (pillGroup) pillGroup.querySelectorAll('.panel-pill').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  kanaUpdateStartScreen();
}

function kanaBuildPool() {
  let src = [];
  if (kanaScript === 'hiragana' || kanaScript === 'mixed')
    src = src.concat((APP_HIRAGANA || []).map(k => ({ ...k, script:'hira' })));
  if (kanaScript === 'katakana' || kanaScript === 'mixed')
    src = src.concat((APP_KATAKANA || []).map(k => ({ ...k, script:'kata' })));
  if (APP_KANA_COMBOS) {
    APP_KANA_COMBOS.forEach(k => {
      if (kanaScript === 'mixed' ||
          (kanaScript === 'hiragana' && k.script === 'hiragana') ||
          (kanaScript === 'katakana' && k.script === 'katakana'))
        src.push({ ...k });
    });
  }
  const seen = new Set();
  let pool = src.filter(k => { if (seen.has(k.kana)) return false; seen.add(k.kana); return true; });

  // Difficulty filtering
  // Easy: base vowel + common consonant rows only (non-voiced, non-combo) — ~25 chars
  // Medium: all base + voiced rows, no combos — ~46+ chars
  // Hard: full set including combos — all chars
  if (kanaDifficulty === 'easy') {
    pool = pool.filter(k => !k.voiced && !k.combo);
    if (pool.length > 30) pool = pool.slice(0, 30);
  } else if (kanaDifficulty === 'medium') {
    pool = pool.filter(k => !k.combo);
  }
  // hard = no filter, full set

  return pool;
}

function kanaPickPrompt(pool) {
  const sr = kanaSrLoad();
  const weighted = pool.map(k => {
    const s = sr[k.romaji] || {};
    const timePenalty   = s.lastSeen && (Date.now() - s.lastSeen < 8000) ? 0.05 : 1;
    const repeatPenalty = k.romaji === _kanaLastRomaji ? 0.01 : 1;
    return { k, w: (s.weight || 1) * timePenalty * repeatPenalty };
  });
  const total = weighted.reduce((a,b) => a + b.w, 0);
  let r = Math.random() * total;
  for (const { k, w } of weighted) { r -= w; if (r <= 0) return k; }
  return pool[0];
}

function kanaRenderGrid(pool, correctRomaji) {
  const grid = document.getElementById('kanaGrid');
  if (!grid) return;
  const display = [...pool].sort(() => Math.random() - 0.5);
  grid.innerHTML = display.map(k =>
    `<button class="kana-cell" data-romaji="${k.romaji}"
      onclick="kanaAnswer('${k.romaji}','${correctRomaji}')">${k.kana}</button>`
  ).join('');
}

function setKanaScript(script, el) {
  kanaScript = script;
  document.querySelectorAll('.kana-script-btn').forEach(b => b.classList.remove('active'));
  // Also deselect panel-pill siblings in the same group
  const pillGroup = el && el.closest('.panel-pills');
  if (pillGroup) pillGroup.querySelectorAll('.panel-pill').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  kanaUpdateStartScreen();
}

function setKanaMode(mode, el) {
  kanaGameMode = mode;
  document.querySelectorAll('.kana-mode-btn').forEach(b => b.classList.remove('active'));
  // Also deselect panel-pill siblings in the same group
  const pillGroup = el && el.closest('.panel-pills');
  if (pillGroup) pillGroup.querySelectorAll('.panel-pill').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  const livesEl = document.getElementById('kanaStatLives');
  const timerEl = document.getElementById('kanaStatTimer');
  const speedEl = document.getElementById('kanaStatSpeed');
  if (livesEl) livesEl.style.display = mode === 'survival' ? '' : 'none';
  if (timerEl) timerEl.style.display = mode === 'timed'    ? '' : 'none';
  if (speedEl) speedEl.style.display = (mode === 'endless' || mode === 'hidden') ? '' : 'none';
  kanaUpdateStartScreen();
}

function kanaUpdateStartScreen() {
  const iconEl  = document.getElementById('kanaStartIcon');
  const titleEl = document.getElementById('kanaStartTitle');
  const subEl   = document.getElementById('kanaStartSub');
  const prevEl  = document.getElementById('kanaSrPreview');
  if (!iconEl) return;
  iconEl.textContent  = { hiragana:'あ', katakana:'ア', mixed:'あ/ア' }[kanaScript] || 'あ';
  titleEl.textContent = kanaScript === 'mixed' ? 'Hiragana + Katakana' :
    kanaScript.charAt(0).toUpperCase() + kanaScript.slice(1);
  subEl.textContent = {
    practice: 'Click the correct kana — no pressure, build accuracy.',
    timed:    '60 seconds · answer as many as you can!',
    survival: `${KANA_SURVIVAL_LIVES} lives · one wrong answer costs a life.`,
    endless:  'Infinite loop — speed tier increases every 20 correct answers.',
    hidden:   'All kana are hidden — wrong guesses reveal the answer. Tests pure memory.',
  }[kanaGameMode] || '';
  const pool = kanaBuildPool();
  const sr   = kanaSrLoad();
  const weak = pool.map(k => ({ k, w: (sr[k.romaji] || {}).weight || 1 }))
    .filter(x => x.w > 1.2).sort((a,b) => b.w - a.w).slice(0, 8);
  if (prevEl) prevEl.innerHTML = weak.length
    ? '<div class="kana-sr-label">Needs practice:</div>' +
      weak.map(x => `<span class="kana-sr-chip">${x.k.kana}</span>`).join('')
    : '';
}

function kanaStartSession() {
  kanaPool = kanaBuildPool();
  if (!kanaPool.length) { rewardPopup('No kana data loaded!'); return; }
  kanaCorrect = kanaWrong = kanaStreak = kanaMaxStreak = 0;
  kanaLives = KANA_SURVIVAL_LIVES;
  kanaTimeLeft = KANA_TIMER_SECS;
  kanaMissedChars = []; kanaSessionActive = true; kanaRetryPending = false;
  kanaCurrentKana = null; _kanaLastRomaji = '';
  // Endless mode reset
  kanaEndlessTier = 0; kanaEndlessSpeed = 1.0;
  const speedEl = document.getElementById('kanaSpeedVal');
  if (speedEl) speedEl.textContent = '1×';
  const oldBadge = document.getElementById('kanaEndlessTierBadge');
  if (oldBadge) oldBadge.remove();
  const kanaMilestonesSeen = new Set();

  ['kanaScore','kanaStreakVal'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '0'; });
  document.getElementById('kanaLivesVal') && (document.getElementById('kanaLivesVal').textContent = kanaLives);
  document.getElementById('kanaTimerVal') && (document.getElementById('kanaTimerVal').textContent = kanaTimeLeft);
  document.getElementById('kanaFeedback') && (document.getElementById('kanaFeedback').textContent = '');
  document.getElementById('kanaStartScreen').classList.add('hidden');
  document.getElementById('kanaSessionEnd').classList.add('hidden');
  document.getElementById('kanaGameArea').classList.remove('hidden');
  document.getElementById('kanaGrid').classList.remove('hidden');

  if (kanaGameMode === 'timed') {
    clearInterval(kanaTimerInt);
    kanaTimerInt = setInterval(() => {
      kanaTimeLeft--;
      document.getElementById('kanaTimerVal') && (document.getElementById('kanaTimerVal').textContent = kanaTimeLeft);
      if (kanaTimeLeft <= 0) { clearInterval(kanaTimerInt); kanaEndSession(); }
    }, 1000);
  }
  kanaNextPrompt();
}

function kanaNextPrompt() {
  if (!kanaSessionActive) return;
  cancelAnimationFrame(kanaRafHandle);

  const kana = kanaPickPrompt(kanaPool);
  kanaCurrentKana = kana; _kanaLastRomaji = kana.romaji;

  const promptEl = document.getElementById('kanaPromptText');
  const fbEl     = document.getElementById('kanaFeedback');
  if (fbEl) { fbEl.textContent = ''; fbEl.className = 'kana-feedback'; }

  if (kanaGameMode === 'reverse') {
    // Reverse: show kana glyph, render romaji grid
    if (promptEl) {
      promptEl.textContent = kana.kana;
      promptEl.className   = 'kana-prompt-text kana-reverse-prompt';
    }
    kanaRenderRomajiGrid(kanaPool, kana.romaji);
  } else if (kanaGameMode === 'hidden') {
    // Hidden: show romaji prompt, render hidden kana grid
    if (promptEl) {
      promptEl.textContent = kana.romaji;
      promptEl.className   = 'kana-prompt-text';
    }
    kanaRenderHiddenGrid(kanaPool, kana.romaji);
  } else {
    // Normal modes: show romaji, render kana grid
    if (promptEl) {
      promptEl.textContent = kana.romaji;
      promptEl.className   = 'kana-prompt-text';
    }
    kanaRenderGrid(kanaPool, kana.romaji);
  }

  // Ring timer — endless applies speed multiplier, reverse gets more time
  const ring = document.getElementById('kanaRingFill');
  const CIRC = 213.6;
  let baseSecs = kanaGameMode === 'timed' ? KANA_PROMPT_SECS : KANA_PROMPT_SECS * 1.2;
  if (kanaGameMode === 'endless') baseSecs *= kanaEndlessSpeed;
  if (kanaGameMode === 'reverse') baseSecs *= 1.4;
  if (kanaGameMode === 'hidden')  baseSecs *= 1.0; // same pressure as normal
  const dur   = baseSecs * 1000;
  const start = performance.now();
  if (ring) {
    ring.style.strokeDashoffset = '0';
    (function animRing(now) {
      const pct = Math.min(1, (now - start) / dur);
      ring.style.strokeDashoffset = (CIRC * pct).toString();
      if (pct < 1 && kanaSessionActive) kanaRafHandle = requestAnimationFrame(animRing);
      else if (pct >= 1 && kanaSessionActive && !kanaRetryPending) kanaTimeoutAnswer();
    })(start);
  }
}

// Render grid of ROMAJI buttons (reverse mode)
function kanaRenderRomajiGrid(pool, correctRomaji) {
  const grid = document.getElementById('kanaGrid');
  if (!grid) return;
  const others  = pool.filter(k => k.romaji !== correctRomaji);
  const shuffled = [...others].sort(() => Math.random() - 0.5).slice(0, 11);
  const display  = [...shuffled, pool.find(k => k.romaji === correctRomaji)]
    .filter(Boolean)
    .sort(() => Math.random() - 0.5);
  grid.innerHTML = display.map(k =>
    `<button class="kana-romaji-cell" data-romaji="${k.romaji}"
      onclick="kanaAnswer('${k.romaji}','${correctRomaji}')">${k.romaji}</button>`
  ).join('');
}

// Render hidden kana grid (hidden mode) — cells show "?" until interacted with
function kanaRenderHiddenGrid(pool, correctRomaji) {
  const grid = document.getElementById('kanaGrid');
  if (!grid) return;
  const display = [...pool].sort(() => Math.random() - 0.5);
  // Determine fade tier from current streak
  // Streak  0-4: no fade  | 5-9: tier1 | 10-14: tier2 | 15-19: tier3 | 20-24: tier4 | 25+: tier5
  const tier = kanaStreak >= 25 ? 5 : kanaStreak >= 20 ? 4 : kanaStreak >= 15 ? 3 : kanaStreak >= 10 ? 2 : kanaStreak >= 5 ? 1 : 0;
  const fadeClass = tier > 0 ? ` fade-tier-${tier}` : '';
  grid.innerHTML = display.map(k =>
    `<button class="kana-cell kana-cell-hidden${fadeClass}" data-romaji="${k.romaji}" data-kana="${k.kana}"
      onclick="kanaAnswer('${k.romaji}','${correctRomaji}')"
      onmouseenter="kanaHiddenHover(this)" onmouseleave="kanaHiddenUnhover(this)">?</button>`
  ).join('');
}

function kanaHiddenHover(el) {
  if (!el.classList.contains('kana-cell-hidden') || el.disabled) return;
  el.textContent = el.dataset.kana;
  el.classList.add('kana-cell-hidden-peek');
}
function kanaHiddenUnhover(el) {
  if (!el.classList.contains('kana-cell-hidden') || el.disabled) return;
  el.textContent = '?';
  el.classList.remove('kana-cell-hidden-peek');
}

function kanaAnswer(selectedRomaji, correctRomaji) {
  if (!kanaSessionActive) return;
  cancelAnimationFrame(kanaRafHandle);
  const wasCorrect = selectedRomaji === correctRomaji;
  kanaSrRecord(correctRomaji, wasCorrect);
  document.querySelectorAll('.kana-cell').forEach(cell => {
    cell.disabled = true;
    // In hidden mode: reveal all kana glyphs after answer
    if (kanaGameMode === 'hidden') cell.textContent = cell.dataset.kana || cell.textContent;
    cell.classList.remove('kana-cell-hidden', 'kana-cell-hidden-peek');
    if (cell.dataset.romaji === correctRomaji)                 cell.classList.add('kana-cell-correct');
    if (cell.dataset.romaji === selectedRomaji && !wasCorrect) cell.classList.add('kana-cell-wrong');
  });
  const fbEl = document.getElementById('kanaFeedback');
  if (wasCorrect) {
    kanaCorrect++; kanaStreak++;
    if (kanaStreak > kanaMaxStreak) kanaMaxStreak = kanaStreak;
    kanaRetryPending = false;
    if (document.getElementById('kanaScore'))     document.getElementById('kanaScore').textContent = kanaCorrect;
    if (document.getElementById('kanaStreakVal')) document.getElementById('kanaStreakVal').textContent = kanaStreak;
    if (fbEl) { fbEl.textContent = '✓ ' + kanaCurrentKana.kana + ' = ' + correctRomaji; fbEl.className = 'kana-feedback kana-feedback-correct'; }
    kanaCheckMilestone();
    if (kanaGameMode === 'endless' || kanaGameMode === 'hidden') kanaEndlessCheckTier();
    setTimeout(kanaNextPrompt, 420);
  } else {
    kanaWrong++; kanaStreak = 0;
    if (document.getElementById('kanaStreakVal')) document.getElementById('kanaStreakVal').textContent = '0';
    if (!kanaMissedChars.includes(correctRomaji)) kanaMissedChars.push(correctRomaji);
    if (fbEl) { fbEl.textContent = '✗  ' + correctRomaji + ' = ' + kanaCurrentKana.kana; fbEl.className = 'kana-feedback kana-feedback-wrong'; }
    if (kanaGameMode === 'survival') {
      kanaLives--;
      if (document.getElementById('kanaLivesVal')) document.getElementById('kanaLivesVal').textContent = kanaLives;
      if (kanaLives <= 0) { setTimeout(kanaEndSession, 700); return; }
    }
    if (!kanaRetryPending) { kanaRetryPending = true; setTimeout(kanaNextPrompt, 900); }
    else { kanaRetryPending = false; setTimeout(kanaNextPrompt, 500); }
  }
}

function kanaTimeoutAnswer() {
  if (!kanaSessionActive) return;
  kanaWrong++; kanaStreak = 0;
  if (document.getElementById('kanaStreakVal')) document.getElementById('kanaStreakVal').textContent = '0';
  if (kanaCurrentKana && !kanaMissedChars.includes(kanaCurrentKana.romaji)) kanaMissedChars.push(kanaCurrentKana.romaji);
  if (kanaGameMode === 'survival') {
    kanaLives--;
    if (document.getElementById('kanaLivesVal')) document.getElementById('kanaLivesVal').textContent = kanaLives;
    if (kanaLives <= 0) { kanaEndSession(); return; }
  }
  const fbEl = document.getElementById('kanaFeedback');
  if (fbEl) { fbEl.textContent = '⏱ Too slow! — ' + (kanaCurrentKana ? kanaCurrentKana.kana : ''); fbEl.className = 'kana-feedback kana-feedback-wrong'; }
  setTimeout(kanaNextPrompt, 800);
}

const KANA_MILESTONES = [10, 25, 50, 100];
let _kanaMilestonesSeen = new Set();
function kanaCheckMilestone() {
  for (const m of KANA_MILESTONES) {
    if (kanaCorrect === m && !_kanaMilestonesSeen.has(m)) {
      _kanaMilestonesSeen.add(m);
      const bonus = m >= 50 ? 5 : 3;
      rewardStudy(bonus);
      rewardPopup('🎉 ' + m + ' correct! +' + bonus + ' <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''>');
      const sv = document.getElementById('kanaStreakVal');
      if (sv) { sv.classList.add('kana-streak-flash'); setTimeout(() => sv.classList.remove('kana-streak-flash'), 600); }
    }
  }
}

function kanaEndlessCheckTier() {
  const nextTier = KANA_ENDLESS_TIERS.slice().reverse()
    .find(t => kanaCorrect >= t.threshold);
  if (!nextTier) return;
  const tierIdx = KANA_ENDLESS_TIERS.indexOf(nextTier);
  if (tierIdx <= kanaEndlessTier) return;

  kanaEndlessTier  = tierIdx;
  kanaEndlessSpeed = nextTier.speedMult;

  const speedEl = document.getElementById('kanaSpeedVal');
  if (speedEl) speedEl.textContent = Math.round(1 / nextTier.speedMult * 10) / 10 + '×';

  const existingBadge = document.getElementById('kanaEndlessTierBadge');
  if (existingBadge) existingBadge.remove();
  const badge = document.createElement('div');
  badge.id = 'kanaEndlessTierBadge';
  badge.className = 'kana-endless-tier ' + nextTier.cls;
  badge.innerHTML = '⬆ ' + nextTier.name + ' tier!';
  const gameArea = document.getElementById('kanaGameArea');
  if (gameArea) gameArea.insertBefore(badge, gameArea.firstChild);

  rewardPopup('🔥 ' + nextTier.name + ' tier! Speed up!');
  setTimeout(() => { if (badge.parentNode) badge.remove(); }, 3000);
}

function kanaEndSession() {
  if (!kanaSessionActive) return;
  kanaSessionActive = false;
  clearInterval(kanaTimerInt);
  cancelAnimationFrame(kanaRafHandle);
  const total = kanaCorrect + kanaWrong;
  const acc   = total > 0 ? Math.round(kanaCorrect / total * 100) : 0;
  const tickets = Math.floor(kanaCorrect / 3) + (kanaMaxStreak >= 10 ? 3 : 0);
  document.getElementById('kanaGrid').classList.add('hidden');
  document.getElementById('kanaSessionEnd').classList.remove('hidden');
  document.getElementById('kanaEndEmoji').textContent = acc >= 80 ? '🏆' : acc >= 50 ? '⭐' : '💪';
  document.getElementById('kanaEndTitle').textContent = acc >= 80 ? 'Great job!' : acc >= 50 ? 'Not bad!' : 'Keep practicing!';
  document.getElementById('kanaEndStats').innerHTML = `
    <div class="kana-end-row"><span>Correct</span><span style="color:var(--correct)">${kanaCorrect}</span></div>
    <div class="kana-end-row"><span>Wrong</span><span style="color:var(--wrong)">${kanaWrong}</span></div>
    <div class="kana-end-row"><span>Accuracy</span><span>${acc}%</span></div>
    <div class="kana-end-row"><span>Best Streak</span><span style="color:var(--warn)">${kanaMaxStreak}</span></div>
  `;
  if (tickets > 0) rewardStudy(tickets);
  const weakEl     = document.getElementById('kanaEndWeak');
  const reviewBtn  = document.getElementById('kanaReviewMissBtn');
  if (kanaMissedChars.length > 0) {
    const pool  = kanaBuildPool();
    const chips = pool.filter(k => kanaMissedChars.includes(k.romaji))
      .map(k => `<span class="kana-sr-chip kana-sr-chip-miss">${k.kana} <em>${k.romaji}</em></span>`).join('');
    weakEl.innerHTML = '<div class="kana-weak-label">Missed:</div>' + chips;
    if (reviewBtn) reviewBtn.style.display = '';
  } else { weakEl.innerHTML = ''; if (reviewBtn) reviewBtn.style.display = 'none'; }
  openSessionSummary({ title: acc >= 80 ? 'Great Session!' : 'Session Done!', emoji: acc >= 80 ? '🏆' : acc >= 50 ? '⭐' : '💪',
    sub: kanaScript + ' · ' + kanaGameMode, rows: [
      { label: 'Correct', val: kanaCorrect, color:'var(--correct)' },
      { label: 'Wrong',   val: kanaWrong,   color:'var(--wrong)'   },
      { label: 'Accuracy', val: acc + '%' },
      { label: 'Best Streak', val: kanaMaxStreak },
      ...(kanaGameMode === 'endless' ? [{ label: 'Top Tier', val: KANA_ENDLESS_TIERS[kanaEndlessTier]?.name || 'Beginner' }] : []),
    ], ticketsEarned: 0, weakCount: kanaMissedChars.length });
}

function kanaShowStart() {
  kanaSessionActive = false;
  clearInterval(kanaTimerInt); cancelAnimationFrame(kanaRafHandle);
  _kanaMilestonesSeen = new Set();
  document.getElementById('kanaStartScreen').classList.remove('hidden');
  document.getElementById('kanaGameArea').classList.add('hidden');
  kanaUpdateStartScreen();
}

function kanaReviewMissed() {
  const pool = kanaBuildPool();
  kanaMissedChars.forEach(romaji => {
    const k = pool.find(x => x.romaji === romaji);
    if (k && reviewQueuePush) reviewQueuePush({ q: k.kana, a: k.romaji, unit: kanaScript, diff: 'easy' });
  });
  switchMode('review', null);
  const btn = document.querySelector('.sb-nav-item[data-mode="review"]');
  if (btn && setSbActive) setSbActive(btn);
}

// ============================================================
// PHASE 4 — MCQ GAME MODES: Speed Bonus · Combo · Timed · Survival
// ============================================================
let mcqGameMode    = 'normal';   // 'normal' | 'timed' | 'survival'
let mcqCombo       = 0;
let mcqLives       = 3;
let mcqQTimeLeft   = 10;
let mcqQTimerInt   = null;
let mcqSpeedBonus  = 0;
let mcqMistakes    = [];         // { q, correct, chosen }
let mcqQStartTime  = 0;
let _mcqRecapOpen  = false;

function setMcqGameMode(mode, el) {
  mcqGameMode = mode;
  document.querySelectorAll('.mcq-mode-btn').forEach(b => b.classList.remove('active'));
  // Also deselect panel-pill siblings in the same group
  const pillGroup = el && el.closest('.panel-pills');
  if (pillGroup) pillGroup.querySelectorAll('.panel-pill').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('mcqComboWrap') && (document.getElementById('mcqComboWrap').style.display = (mode !== 'normal') ? '' : 'none');
  document.getElementById('mcqLivesWrap') && (document.getElementById('mcqLivesWrap').style.display = (mode === 'survival') ? '' : 'none');
  document.getElementById('mcqQTimerWrap')&& (document.getElementById('mcqQTimerWrap').style.display = (mode === 'timed') ? '' : 'none');
  document.getElementById('mcqSpeedStat') && (document.getElementById('mcqSpeedStat').style.display = (mode !== 'normal') ? '' : 'none');
  mcqResetGameState();
  initMCQ();
}

function mcqResetGameState() {
  mcqCombo = 0; mcqLives = 3; mcqSpeedBonus = 0; mcqMistakes = [];
  clearInterval(mcqQTimerInt);
  _mcqRecapOpen = false;
  const comboEl = document.getElementById('mcqComboVal');
  const livesEl = document.getElementById('mcqLivesVal');
  const speedEl = document.getElementById('mcqSpeedVal');
  const recapBtn = document.getElementById('mcqRecapBtn');
  if (comboEl) comboEl.textContent = '0';
  if (livesEl) livesEl.textContent = '3';
  if (speedEl) speedEl.textContent = '0';
  if (recapBtn) recapBtn.style.display = 'none';
  const recap = document.getElementById('mcqMistakeRecap');
  if (recap) { recap.innerHTML = ''; recap.classList.add('hidden'); }
}

// Override initMCQ to also reset game state tracking
const _origInitMCQ = initMCQ;
initMCQ = function() {
  mcqResetGameState();
  _origInitMCQ();
  mcqQStartTime = Date.now();
  if (mcqGameMode === 'timed') mcqStartQTimer();
}

function mcqStartQTimer() {
  clearInterval(mcqQTimerInt);
  mcqQTimeLeft = 10;
  const timerEl = document.getElementById('mcqQTimerVal');
  if (timerEl) timerEl.textContent = mcqQTimeLeft;
  mcqQTimerInt = setInterval(() => {
    mcqQTimeLeft--;
    if (timerEl) timerEl.textContent = mcqQTimeLeft;
    if (mcqQTimeLeft <= 0) {
      clearInterval(mcqQTimerInt);
      // Count as wrong — pick a fake wrong answer
      if (mcqPool.length && mcqAnswered[mcqIdx] === null) {
        const q = mcqPool[mcqIdx];
        const wrongIdx = q.opts.findIndex((_,i) => i !== q.ans);
        answerMCQ(wrongIdx >= 0 ? wrongIdx : 0);
      }
    }
  }, 1000);
}

// Override answerMCQ to inject combo/speed/lives logic
const _origAnswerMCQ = answerMCQ;
answerMCQ = function(choice) {
  if (mcqAnswered[mcqIdx] !== null) return;
  clearInterval(mcqQTimerInt);

  const q       = mcqPool[mcqIdx];
  const correct = choice === q.ans;
  const elapsed = Date.now() - mcqQStartTime;

  if (correct) {
    mcqCombo++;
    // Speed bonus: under 3s = 3 tickets, 3-6s = 2, 6-10s = 1
    let bonus = elapsed < 3000 ? 3 : elapsed < 6000 ? 2 : 1;
    // Combo multiplier: 5+ combo doubles speed bonus
    if (mcqCombo >= 5) bonus *= 2;
    mcqSpeedBonus += bonus;
    if (mcqGameMode !== 'normal') rewardStudy(bonus);
    const speedEl = document.getElementById('mcqSpeedVal');
    if (speedEl) speedEl.textContent = mcqSpeedBonus;
    const comboEl = document.getElementById('mcqComboVal');
    if (comboEl) { comboEl.textContent = mcqCombo; }
    // Flash combo at milestones
    if (mcqCombo % 5 === 0 && mcqCombo > 0) {
      rewardPopup('🔥 ' + mcqCombo + ' combo! ×2 bonus');
      if (comboEl) { comboEl.classList.add('mcq-combo-flash'); setTimeout(() => comboEl.classList.remove('mcq-combo-flash'), 600); }
    }
  } else {
    mcqCombo = 0;
    const comboEl = document.getElementById('mcqComboVal');
    if (comboEl) comboEl.textContent = '0';
    // Track mistake for recap
    mcqMistakes.push({ q: q.q, correct: q.opts[q.ans], chosen: q.opts[choice] || '(timeout)', exp: q.exp || '' });
    // Survival mode: lose a life
    if (mcqGameMode === 'survival') {
      mcqLives--;
      const livesEl = document.getElementById('mcqLivesVal');
      if (livesEl) livesEl.textContent = mcqLives;
      if (mcqLives <= 0) {
        _origAnswerMCQ(choice);
        setTimeout(() => mcqGameOver(), 800);
        return;
      }
    }
  }

  _origAnswerMCQ(choice);
  mcqQStartTime = Date.now();

  // Show recap button after first mistake
  if (mcqMistakes.length > 0) {
    const recapBtn = document.getElementById('mcqRecapBtn');
    if (recapBtn) recapBtn.style.display = '';
  }

  if (mcqGameMode === 'timed') mcqStartQTimer();
}

function mcqGameOver() {
  clearInterval(mcqQTimerInt);
  const total = mcqScore.c + mcqScore.w;
  openSessionSummary({
    title: 'Game Over!',
    emoji: mcqScore.c >= total * 0.7 ? '🏆' : '💪',
    sub: 'Survival mode · all lives lost',
    rows: [
      { label: 'Correct', val: mcqScore.c, color: 'var(--correct)' },
      { label: 'Wrong',   val: mcqScore.w, color: 'var(--wrong)' },
      { label: 'Best Combo', val: mcqCombo },
      { label: 'Speed Bonus', val: mcqSpeedBonus + ' <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''>' },
    ],
    ticketsEarned: 0,
    weakCount: mcqMistakes.length,
  });
}

function toggleMcqRecap() {
  _mcqRecapOpen = !_mcqRecapOpen;
  const recap = document.getElementById('mcqMistakeRecap');
  if (!recap) return;
  if (!_mcqRecapOpen) { recap.classList.add('hidden'); return; }
  recap.classList.remove('hidden');
  recap.innerHTML = '<div class="mcq-recap-title">📋 Mistake Recap</div>' +
    mcqMistakes.map(m =>
      `<div class="mcq-recap-item">
        <div class="mcq-recap-q">${m.q}</div>
        <div class="mcq-recap-row">
          <span class="mcq-recap-wrong">✗ ${m.chosen}</span>
          <span class="mcq-recap-correct">✓ ${m.correct}</span>
        </div>
        ${m.exp ? `<div class="mcq-recap-exp">${m.exp}</div>` : ''}
      </div>`
    ).join('') || '<div style="color:var(--muted);font-size:12px;text-align:center;padding:16px">No mistakes yet!</div>';
}

// Also override nextMCQ to start timer if in timed mode
const _origNextMCQ = nextMCQ;
nextMCQ = function() {
  _origNextMCQ();
  mcqQStartTime = Date.now();
  if (mcqGameMode === 'timed') mcqStartQTimer();
}

// ============================================================
// PHASE 2 — EMERGENCY CRAM MODE
// ============================================================
let _cramCards = [];
let _cramIdx   = 0;
let _cramFlipped = false;
let _cramAgainCount = 0;
let _cramGotItCount = 0;

function startCramMode() {
  // Pull all reviewQueue cards (these are the "failed" cards)
  const q = reviewQueueLoad();
  if (!q.length) {
    rewardPopup('No failed cards to cram! 🎉');
    return;
  }
  _cramCards = [...q].sort(() => Math.random() - 0.5);
  _cramIdx = 0; _cramFlipped = false;
  _cramAgainCount = 0; _cramGotItCount = 0;

  let overlay = document.getElementById('cramOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'cramOverlay';
    overlay.innerHTML = `
      <div class="cram-header">
        <div class="cram-title">🔥 Cram Mode</div>
        <div style="display:flex;gap:12px;align-items:center">
          <div class="cram-progress" id="cramProgress"></div>
          <button class="btn btn-secondary" style="font-size:11px;padding:5px 12px" onclick="closeCramMode()">✕ Exit</button>
        </div>
      </div>
      <div class="cram-card" id="cramCard" onclick="cramFlip()">
        <div class="cram-card-q" id="cramQ"></div>
        <div class="cram-card-a" id="cramA"></div>
        <div class="cram-card-hint" id="cramHint">tap to flip</div>
      </div>
      <div class="cram-grade-row" id="cramGradeRow" style="display:none">
        <button class="cram-grade-btn cram-grade-again"  onclick="cramGrade(false)">✗ Again</button>
        <button class="cram-grade-btn cram-grade-got-it" onclick="cramGrade(true)">✓ Got it</button>
      </div>`;
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'flex';
  _cramShowCard();
}

function _cramShowCard() {
  if (_cramIdx >= _cramCards.length) { _cramFinish(); return; }
  _cramFlipped = false;
  const card = _cramCards[_cramIdx];
  const qEl = document.getElementById('cramQ');
  const aEl = document.getElementById('cramA');
  const hintEl = document.getElementById('cramHint');
  const gradeRow = document.getElementById('cramGradeRow');
  const progressEl = document.getElementById('cramProgress');
  if (qEl) qEl.textContent = card.q;
  if (aEl) { aEl.textContent = card.a || ''; aEl.style.display = 'none'; }
  if (hintEl) hintEl.textContent = 'tap to flip';
  if (gradeRow) gradeRow.style.display = 'none';
  if (progressEl) progressEl.textContent = (_cramIdx + 1) + ' / ' + _cramCards.length;
}

function cramFlip() {
  if (_cramFlipped) return;
  _cramFlipped = true;
  const aEl = document.getElementById('cramA');
  const hintEl = document.getElementById('cramHint');
  const gradeRow = document.getElementById('cramGradeRow');
  if (aEl) aEl.style.display = '';
  if (hintEl) hintEl.textContent = '';
  if (gradeRow) gradeRow.style.display = 'flex';
}

function cramGrade(gotIt) {
  if (!_cramFlipped) return;
  if (gotIt) {
    _cramGotItCount++;
    // Remove from reviewQueue on success
    reviewQueueRemove(_cramCards[_cramIdx].q);
    _cramIdx++;
  } else {
    _cramAgainCount++;
    // Move card to end for another try
    _cramCards.push(_cramCards[_cramIdx]);
    _cramCards.splice(_cramIdx, 1);
    // Cap to prevent infinite loops (max 3 passes through original set)
    const origLen = reviewQueueLoad().length || _cramCards.length;
    if (_cramCards.length > origLen * 3) {
      _cramCards = _cramCards.slice(0, origLen);
    }
  }
  _cramShowCard();
}

function _cramFinish() {
  const overlay = document.getElementById('cramOverlay');
  if (overlay) overlay.style.display = 'none';
  if (typeof updateReviewBadge === 'function') updateReviewBadge();
  openSessionSummary({
    title: 'Cram Complete!',
    emoji: '🔥',
    sub: 'Emergency cram session · no SR applied',
    rows: [
      { label: 'Got It',  val: _cramGotItCount,  color: 'var(--correct)' },
      { label: 'Again',   val: _cramAgainCount,  color: 'var(--wrong)' },
    ],
    ticketsEarned: Math.floor(_cramGotItCount / 2),
    weakCount: 0,
  });
}

function closeCramMode() {
  const overlay = document.getElementById('cramOverlay');
  if (overlay) overlay.style.display = 'none';
}

// ============================================================
// PHASE 2 — REVIEW HEATMAP (GitHub-style calendar)
// ============================================================
function revHeatmapLog(count) {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const log = JSON.parse(localStorage.getItem('revHeatmapLog') || '{}');
    log[today] = (log[today] || 0) + (count || 1);
    localStorage.setItem('revHeatmapLog', JSON.stringify(log));
  } catch(e) {}
}

function revGetDayStreak() {
  let log = {};
  try { log = JSON.parse(localStorage.getItem('revHeatmapLog') || '{}'); } catch(e) {}
  let streak = 0;
  const check = new Date();
  // Allow today to not have entries yet (check yesterday as start)
  const todayKey = check.toISOString().slice(0, 10);
  if (!log[todayKey]) check.setDate(check.getDate() - 1);
  for (let i = 0; i < 365; i++) {
    const k = check.toISOString().slice(0, 10);
    if (log[k] && log[k] > 0) { streak++; check.setDate(check.getDate() - 1); }
    else break;
  }
  return streak;
}

function updateSidebarStreak() {
  const el = document.getElementById('sbStreakCount');
  if (!el) return;
  el.textContent = revGetDayStreak();
}

function revRenderHeatmap() {
  const grid = document.getElementById('revHeatmapGrid');
  const streakEl = document.getElementById('revHeatmapStreak');
  if (!grid) return;

  let log = {};
  try { log = JSON.parse(localStorage.getItem('revHeatmapLog') || '{}'); } catch(e) {}

  // Build 16 weeks × 7 days = 112 day window ending today
  const WEEKS = 16;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from the Sunday before (WEEKS) weeks ago
  const startDay = new Date(today);
  startDay.setDate(startDay.getDate() - (WEEKS * 7 - 1));

  const cells = [];
  const d = new Date(startDay);
  for (let i = 0; i < WEEKS * 7; i++) {
    const key = d.toISOString().slice(0, 10);
    cells.push({ date: key, count: log[key] || 0 });
    d.setDate(d.getDate() + 1);
  }

  // Compute streak
  let streak = 0;
  const check = new Date(today);
  while (true) {
    const k = check.toISOString().slice(0, 10);
    if (log[k] && log[k] > 0) { streak++; check.setDate(check.getDate() - 1); }
    else break;
  }
  if (streakEl) streakEl.textContent = streak > 0 ? streak + ' day streak 🔥' : 'No streak yet';

  // Determine heat levels
  const counts = cells.map(c => c.count).filter(n => n > 0);
  const max = counts.length ? Math.max(...counts) : 1;

  function heatClass(count) {
    if (!count) return '';
    const ratio = count / max;
    if (ratio <= 0.25) return 'rev-heat-1';
    if (ratio <= 0.5)  return 'rev-heat-2';
    if (ratio <= 0.75) return 'rev-heat-3';
    return 'rev-heat-4';
  }

  // Render: 7 rows (Mon–Sun) × WEEKS columns
  // Transpose cells array (row-major) into column-major for flex grid
  grid.innerHTML = cells.map((c, i) => {
    const title = c.date + (c.count ? ': ' + c.count + ' reviews' : ': no activity');
    return `<div class="rev-heatmap-cell ${heatClass(c.count)}" title="${title}" style="order:${i}"></div>`;
  }).join('');
}

// Hook revRenderHeatmap into revInit so it shows on Review tab open
const _origRevInit = typeof revInit === 'function' ? revInit : null;
revInit = function() {
  if (_origRevInit) _origRevInit();
  revRenderHeatmap();
}

// Also log whenever cards are graded
const _revHeatGrade_origRevGrade = typeof revGrade === 'function' ? revGrade : null;
revGrade = function(g) {
  revHeatmapLog(1);
  if (_revHeatGrade_origRevGrade) _revHeatGrade_origRevGrade(g);
  updateSidebarStreak();
}

// ============================================================
// PHASE 3.2 — KANJI TRACE (Canvas drawing with fading guide)
// ============================================================
let tracePool     = [];
let traceIdx      = 0;
let traceGotItCnt = 0;
let traceTryAgainCnt = 0;
let traceStage    = 0; // 0=full guide, 1=faded, 2=blank
let traceDrawing  = false;
let traceLastX    = 0, traceLastY = 0;
let traceCtx      = null;
let traceFilter   = 'all';

function setTraceFilter(filter, el) {
  traceFilter = filter;
  document.querySelectorAll('#flashTracePanel .unit-btn').forEach(b => b.classList.remove('active'));
  // Also deselect panel-pill siblings in the same group (for side panel buttons)
  const pillGroup = el && el.closest('.panel-pills');
  if (pillGroup) pillGroup.querySelectorAll('.panel-pill').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  traceInitSession();
}

function traceInitSession() {
  const db = APP_KANJI_DB || KANJI_DB || [];
  tracePool = [...(traceFilter === 'n5' ? db.filter(k => k.jlpt === 'n5') : db)];
  tracePool = tracePool.sort(() => Math.random() - 0.5);
  traceIdx = 0; traceGotItCnt = 0; traceTryAgainCnt = 0; traceStage = 0;
  document.getElementById('traceSessionEnd') && document.getElementById('traceSessionEnd').classList.add('hidden');
  traceRenderCard();
}

function traceRenderCard() {
  if (!tracePool.length) return;
  if (traceIdx >= tracePool.length) { traceShowEnd(); return; }
  const kanji = tracePool[traceIdx];
  traceStage = 0;
  traceUpdateStageUI();

  // Fill info
  const charEl    = document.getElementById('traceKanjiChar');
  const meaningEl = document.getElementById('traceKanjiMeaning');
  const readingEl = document.getElementById('traceKanjiReadings');
  const guideChar = document.getElementById('traceGuideChar');
  if (charEl)    charEl.textContent    = kanji.char;
  if (meaningEl) meaningEl.textContent = kanji.meaning;
  if (readingEl) readingEl.textContent = 'On: ' + kanji.on + '  Kun: ' + kanji.kun;
  if (guideChar) guideChar.textContent = kanji.char;

  // Reset canvas
  traceClearCanvas();

  // Dot map
  const dotMap = document.getElementById('traceDotMap');
  if (dotMap) {
    dotMap.innerHTML = tracePool.slice(0, Math.min(40, tracePool.length)).map((k, i) => {
      let cls = 'dot';
      if (i === traceIdx) cls += ' current';
      return `<div class="${cls}" title="${k.char}"></div>`;
    }).join('');
  }

  // Stats
  document.getElementById('traceGotIt')    && (document.getElementById('traceGotIt').textContent = traceGotItCnt);
  document.getElementById('traceTryAgain') && (document.getElementById('traceTryAgain').textContent = traceTryAgainCnt);
  const total = traceGotItCnt + traceTryAgainCnt;
  document.getElementById('traceProgress') && (document.getElementById('traceProgress').textContent =
    total > 0 ? Math.round(traceGotItCnt / total * 100) + '%' : '—');
}

function traceUpdateStageUI() {
  const guide    = document.getElementById('traceGuideLayer');
  const label    = document.getElementById('traceGuideLabel');
  const dots     = [0,1,2].map(i => document.getElementById('traceStageDot' + i));

  const opacities = [0.85, 0.30, 0];
  const labels    = ['Stage 1 — Trace over the guide', 'Stage 2 — Guide fading, recall from memory', 'Stage 3 — Draw from memory'];

  if (guide) guide.style.opacity = opacities[traceStage];
  if (label) label.textContent   = labels[traceStage];
  dots.forEach((d, i) => { if (d) d.classList.toggle('active', i === traceStage); });
}

function traceNextStage() {
  if (traceStage < 2) { traceStage++; traceUpdateStageUI(); traceClearCanvas(); }
}

function traceClearCanvas() {
  const canvas = document.getElementById('traceCanvas');
  if (!canvas) return;
  traceCtx = canvas.getContext('2d');
  traceCtx.clearRect(0, 0, canvas.width, canvas.height);
}

function traceClear() { traceClearCanvas(); }

// Canvas drawing
function traceInitCanvas() {
  const canvas = document.getElementById('traceCanvas');
  if (!canvas || canvas._traceWired) return;
  canvas._traceWired = true;
  traceCtx = canvas.getContext('2d');

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    const scaleX = canvas.width / r.width, scaleY = canvas.height / r.height;
    if (e.touches) return { x: (e.touches[0].clientX - r.left) * scaleX, y: (e.touches[0].clientY - r.top) * scaleY };
    return { x: (e.clientX - r.left) * scaleX, y: (e.clientY - r.top) * scaleY };
  }

  function startDraw(e) {
    e.preventDefault();
    const { x, y } = getPos(e);
    traceDrawing = true; traceLastX = x; traceLastY = y;
    traceCtx.beginPath(); traceCtx.moveTo(x, y);
  }
  function moveDraw(e) {
    if (!traceDrawing) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    traceCtx.lineWidth   = 4;
    traceCtx.lineCap     = 'round';
    traceCtx.lineJoin    = 'round';
    traceCtx.strokeStyle = 'rgba(180,198,255,0.9)';
    traceCtx.lineTo(x, y);
    traceCtx.stroke();
    traceCtx.beginPath(); traceCtx.moveTo(x, y);
    traceLastX = x; traceLastY = y;
  }
  function endDraw() { traceDrawing = false; }

  canvas.addEventListener('mousedown',  startDraw, { passive: false });
  canvas.addEventListener('mousemove',  moveDraw,  { passive: false });
  canvas.addEventListener('mouseup',    endDraw);
  canvas.addEventListener('mouseleave', endDraw);
  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove',  moveDraw,  { passive: false });
  canvas.addEventListener('touchend',   endDraw);
}

function traceGotIt() {
  traceGotItCnt++;
  // Add to learned vault
  const kanji = tracePool[traceIdx];
  if (kanji) {
    const vault = JSON.parse(localStorage.getItem('learnedVault') || '[]');
    if (!vault.some(v => v.term === kanji.char && v.type === 'trace')) {
      vault.push({ id: 'tr_' + kanji.id, type: 'trace', term: kanji.char, reading: kanji.kun, meaning: kanji.meaning, dateAdded: Date.now(), source: 'trace' });
      localStorage.setItem('learnedVault', JSON.stringify(vault));
    }
    rewardStudy(2);
    rewardPopup('✓ ' + kanji.char + ' mastered! +2 <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''>');
  }
  traceIdx++;
  traceRenderCard();
}

function traceTryAgain() {
  traceTryAgainCnt++;
  // Shuffle current card to end of remaining pool
  const remaining = tracePool.slice(traceIdx + 1);
  remaining.splice(Math.floor(Math.random() * (remaining.length + 1)), 0, tracePool[traceIdx]);
  tracePool = [...tracePool.slice(0, traceIdx), ...remaining];
  traceRenderCard();
}

function traceRestartSession() {
  traceInitSession();
}

function traceShowEnd() {
  document.getElementById('traceSessionEnd') && document.getElementById('traceSessionEnd').classList.remove('hidden');
  const total = traceGotItCnt + traceTryAgainCnt;
  const acc   = total > 0 ? Math.round(traceGotItCnt / total * 100) : 0;
  document.getElementById('traceEndEmoji')  && (document.getElementById('traceEndEmoji').textContent  = acc >= 70 ? '🏆' : '💪');
  document.getElementById('traceEndTitle')  && (document.getElementById('traceEndTitle').textContent  = acc >= 70 ? 'Great work!' : 'Session Done!');
  document.getElementById('traceEndSub')    && (document.getElementById('traceEndSub').textContent    = traceGotItCnt + ' mastered · ' + traceTryAgainCnt + ' retried · ' + acc + '% accuracy');
  openSessionSummary({ title: 'Trace Session Done!', emoji: acc >= 70 ? '🏆' : '⭐', sub: 'Kanji tracing',
    rows: [
      { label: 'Got It',    val: traceGotItCnt,    color: 'var(--correct)' },
      { label: 'Try Again', val: traceTryAgainCnt, color: 'var(--wrong)'   },
      { label: 'Accuracy',  val: acc + '%' },
    ], ticketsEarned: traceGotItCnt * 2, weakCount: 0 });
}

// Hook into the flash tab sub-mode switch to init trace
const _origSwitchFlashSub = typeof switchFlashSub === 'function' ? switchFlashSub : null;
switchFlashSub = function(sub, el) {
  if (_origSwitchFlashSub) _origSwitchFlashSub(sub, el);
  if (sub === 'trace') {
    traceInitSession();
    setTimeout(traceInitCanvas, 100);
  }
}

// ============================================================
// PHASE 3.3 — MEMORY BURST MODE
// Kana glyph flashes briefly, then vanishes — answer from memory
// ============================================================
const KANA_BURST_SHOW_MS  = 800;   // how long kana is shown
const KANA_BURST_BLANK_MS = 200;   // blank gap before grid appears

function kanaRenderBurstGrid(pool, correctRomaji) {
  const grid = document.getElementById('kanaGrid');
  if (!grid) return;
  const display = [...pool].sort(() => Math.random() - 0.5);

  // Phase 1: show the kana glyph centred (no grid yet — big flash)
  const prompt = document.getElementById('kanaPromptText');
  if (prompt) {
    // temporarily show kana glyph on the prompt
    prompt.dataset._origText = prompt.textContent;
    prompt.dataset._origClass = prompt.className;
    prompt.textContent = kanaCurrentKana ? kanaCurrentKana.kana : '';
    prompt.className   = 'kana-prompt-text kana-reverse-prompt kana-burst-flash';
  }
  grid.innerHTML = '';
  grid.classList.add('hidden');

  // Phase 2: hide kana, show grid
  setTimeout(() => {
    if (!kanaSessionActive) return;
    if (prompt) {
      prompt.textContent = prompt.dataset._origText || correctRomaji;
      prompt.className   = prompt.dataset._origClass || 'kana-prompt-text';
    }
    grid.classList.remove('hidden');
    grid.innerHTML = display.map(k =>
      `<button class="kana-cell" data-romaji="${k.romaji}"
        onclick="kanaAnswer('${k.romaji}','${correctRomaji}')">${k.kana}</button>`
    ).join('');
  }, KANA_BURST_SHOW_MS + KANA_BURST_BLANK_MS);
}

// Patch kanaNextPrompt branch for burst mode
// (injected into the existing else-if chain via wrapper)
const _origKanaNextPromptBurst = kanaNextPrompt;
kanaNextPrompt = function() {
  // If not burst mode, fall through to original
  if (kanaGameMode !== 'burst') { _origKanaNextPromptBurst(); return; }

  if (!kanaSessionActive) return;
  cancelAnimationFrame(kanaRafHandle);

  const kana = kanaPickPrompt(kanaPool);
  kanaCurrentKana = kana; _kanaLastRomaji = kana.romaji;

  const fbEl = document.getElementById('kanaFeedback');
  if (fbEl) { fbEl.textContent = ''; fbEl.className = 'kana-feedback'; }

  const promptEl = document.getElementById('kanaPromptText');
  if (promptEl) {
    promptEl.textContent = kana.romaji;
    promptEl.className   = 'kana-prompt-text';
  }

  kanaRenderBurstGrid(kanaPool, kana.romaji);

  // Ring timer starts after grid appears
  const ring = document.getElementById('kanaRingFill');
  const CIRC = 213.6;
  const delay = KANA_BURST_SHOW_MS + KANA_BURST_BLANK_MS;
  const baseSecs = KANA_PROMPT_SECS * 1.1;
  const dur   = baseSecs * 1000;

  setTimeout(() => {
    if (!kanaSessionActive) return;
    if (ring) ring.style.strokeDashoffset = '0';
    const start = performance.now();
    (function animRing(now) {
      const pct = Math.min(1, (now - start) / dur);
      if (ring) ring.style.strokeDashoffset = (CIRC * pct).toString();
      if (pct < 1 && kanaSessionActive) kanaRafHandle = requestAnimationFrame(animRing);
      else if (pct >= 1 && kanaSessionActive && !kanaRetryPending) kanaTimeoutAnswer();
    })(start);
  }, delay);
}

// ============================================================
// PHASE 2 — REVERSE CARDS in Review Tab
// Shows answer side as the prompt; user recalls the question
// ============================================================
let revReverseMode = false;
let revFilterMode  = 'all'; // 'all' | 'new'

function toggleRevReverse(el) {
  revReverseMode = !revReverseMode;
  el.classList.toggle('rev-filter-btn--active', revReverseMode);
  // Re-render set grid to show reverse badge
  revInit();
}

function setRevFilter(filter, el) {
  revFilterMode = filter;
  document.querySelectorAll('.rev-filter-btn:not(.rev-filter-btn--toggle)').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  revInit();
}

// Patch revBuildCards to apply never-reviewed filter
// Helper: get SR accuracy weight for a card (lower accuracy = higher weight)
function _revCardAccuracyWeight(cardQ) {
  // Check all set states for this card
  for (const s of (REVIEW_SETS || [])) {
    const state = revLoadState(s.id);
    if (state[cardQ]) {
      const d = state[cardQ];
      const total = (d.reps || 0) + (d.lapses || 0);
      if (total < 2) return 1.5; // barely seen — slightly elevated
      const lapseRate = (d.lapses || 0) / total;
      // High lapse rate = high weight (harder card)
      return 1 + lapseRate * 3; // range: 1.0 – 4.0
    }
  }
  return 1;
}

const _origRevBuildCards = revBuildCards;
revBuildCards = function(set) {
  let cards = _origRevBuildCards(set);

  // Apply "never reviewed" filter
  if (revFilterMode === 'new') {
    const state = revLoadState(set.id);
    cards = cards.filter(c => {
      const s = state[c.q];
      return !s || (s.reps === 0 && s.lapses === 0);
    });
  }

  // Weak kanji weighting — for flashcard sets, sort high-lapse cards toward front
  if (set.source === 'flashcards') {
    cards.sort((a, b) => _revCardAccuracyWeight(b.q) - _revCardAccuracyWeight(a.q));
  }

  // Apply reverse mode: swap q and a
  if (revReverseMode) {
    cards = cards.map(c => {
      const origQ = c.q;
      const origA = c.a;
      // Use first line of answer as the new prompt
      const newQ = (origA || '').split('\n')[0].slice(0, 80) || origA;
      const newA = origQ;
      return { ...c, q: newQ, a: newA, _reversed: true, _origQ: origQ };
    });
  }

  return cards;
}

// Patch revShowCard to handle reverse display
const _origRevShowCard = revShowCard;
revShowCard = function() {
  _origRevShowCard();
  const card = revQueue[revCardIdx];
  if (!card) return;

  // Update hint text based on mode
  const hint = document.getElementById('revCardHint');
  if (hint) hint.textContent = revReverseMode ? 'tap to reveal original' : 'tap to reveal answer';

  // Show reverse badge in session
  const badge = document.getElementById('revReverseBadge');
  if (badge) badge.style.display = revReverseMode ? '' : 'none';
}

// Patch revInit to update filter + reverse state and show "never reviewed" counts
const _phase11_origRevInit = revInit;
revInit = function() {
  _phase11_origRevInit();

  // Sync filter button states
  const allBtn = document.getElementById('revFilterAll');
  const newBtn = document.getElementById('revFilterNew');
  const revBtn = document.getElementById('revReverseToggle');
  if (allBtn) allBtn.classList.toggle('active', revFilterMode === 'all');
  if (newBtn) newBtn.classList.toggle('active', revFilterMode === 'new');
  if (revBtn) revBtn.classList.toggle('rev-filter-btn--active', revReverseMode);
}

// Patch kanaUpdateStartScreen for burst
const _origKanaUpdateStartScreenBurst = kanaUpdateStartScreen;
kanaUpdateStartScreen = function() {
  _origKanaUpdateStartScreenBurst();
  // Add burst description if not already handled
  const subEl = document.getElementById('kanaStartSub');
  if (subEl && kanaGameMode === 'burst') {
    subEl.textContent = 'Kana flashes for ' + (KANA_BURST_SHOW_MS / 1000).toFixed(1) + 's — then vanishes. Answer from memory!';
  }
};

// Also extend setKanaMode to not show speed for burst (burst uses its own timing)
const _origSetKanaModeBurst = setKanaMode;
setKanaMode = function(mode, el) {
  _origSetKanaModeBurst(mode, el);
  // Re-show speed stat only for endless/hidden (already handled), but not burst
  const speedEl = document.getElementById('kanaStatSpeed');
  if (speedEl && mode === 'burst') speedEl.style.display = 'none';
};

// ============================================================
// DOMContentLoaded — wire up all new systems
// ============================================================
// ============================================================
// SESSION 13 — MCQ FILTERS + ENDLESS + INSTANT RETRY
// ============================================================
let mcqFilterUnit    = 'all';  // 'all' | 'n5' | 'n4'
let mcqFilterDiff    = 'all';  // 'all' | 'easy' | 'medium' | 'hard'
let mcqInstantRetry  = false;
let mcqEndlessMode   = false;
let _mcqRetryPending = false;
let _mcqRetryCard    = null;

function setMcqFilter(axis, val, el) {
  if (axis === 'unit') mcqFilterUnit = val;
  if (axis === 'diff') mcqFilterDiff = val;
  // Deactivate siblings in same group (handles both .mcq-filter-btn and .panel-pill)
  if (el && el.parentElement) {
    el.parentElement.querySelectorAll('.mcq-filter-btn, .panel-pill').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
  }
  // Rebuild pool with new filter
  _mcqRebuildPool();
}

function toggleMcqInstantRetry(el) {
  mcqInstantRetry = !mcqInstantRetry;
  if (el) el.classList.toggle('toggled-on', mcqInstantRetry);
}

function toggleMcqEndless(el) {
  mcqEndlessMode = !mcqEndlessMode;
  if (el) el.classList.toggle('toggled-on', mcqEndlessMode);
}

function _mcqRebuildPool() {
  if (!APP_MCQ) return;
  let pool = [...APP_MCQ, ...getActivePackQuestions('mcq')];
  if (mcqFilterUnit !== 'all') pool = pool.filter(q => q.unit === mcqFilterUnit);
  if (mcqFilterDiff !== 'all') pool = pool.filter(q => q.diff === mcqFilterDiff);
  if (!pool.length) pool = [...APP_MCQ]; // fallback: no filter produces empty
  mcqPool = shuffle(pool);
  mcqIdx = 0;
  mcqAnswered = new Array(mcqPool.length).fill(null);
  _mcqRetryPending = false;
  // Re-render first card
  if (typeof renderMCQ === 'function') renderMCQ();
  else if (typeof window._mcqRender === 'function') window._mcqRender();
}

// Patch: wrap the existing answerMCQ override to add instant retry + endless loop
const _s13_origAnswerMCQ = answerMCQ;
answerMCQ = function(choice) {
  // Instant retry: on wrong answer, replay same card once
  if (mcqInstantRetry && !_mcqRetryPending) {
    const q = mcqPool[mcqIdx];
    if (q && choice !== q.ans) {
      _mcqRetryPending = true;
      _mcqRetryCard = q;
      // Let the original handle the wrong feedback
      _s13_origAnswerMCQ(choice);
      // Schedule re-showing the same card
      setTimeout(() => {
        if (_mcqRetryPending && _mcqRetryCard) {
          // Move idx back so next render shows the same card
          mcqIdx = Math.max(0, mcqIdx - 1);
          mcqAnswered[mcqIdx] = null;
          _mcqRetryPending = false;
          if (typeof renderMCQ === 'function') renderMCQ();
          else if (typeof nextMCQ === 'function') {
            // hack: decrement worked, nextMCQ will advance back to same card
          }
        }
      }, 1200);
      return;
    }
  }
  _mcqRetryPending = false;
  _s13_origAnswerMCQ(choice);
}

// Patch: wrap nextMCQ for endless mode
const _s13_origNextMCQ = nextMCQ;
nextMCQ = function() {
  if (mcqEndlessMode && mcqIdx >= mcqPool.length - 1) {
    // Loop: reshuffle and restart from 0
    mcqPool = shuffle(mcqPool);
    mcqIdx = 0;
    mcqAnswered = new Array(mcqPool.length).fill(null);
    if (typeof renderMCQ === 'function') renderMCQ();
    return;
  }
  _s13_origNextMCQ();
}

// ============================================================
// SESSION 13 — DAILY KANA CHALLENGE
// ============================================================
function _kanaDailySeed() {
  // Seed from YYYY-MM-DD so it's stable all day
  const d = new Date().toISOString().slice(0, 10);
  let h = 0;
  for (let i = 0; i < d.length; i++) { h = (Math.imul(31, h) + d.charCodeAt(i)) | 0; }
  return Math.abs(h);
}

function _seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function kanaStartDailyChallenge() {
  const todayKey = new Date().toISOString().slice(0, 10);
  const doneKey  = 'kanaDailyDone_' + todayKey;
  const already  = localStorage.getItem(doneKey);

  // Build seeded pool of 20
  const pool = kanaBuildPool();
  const seeded = _seededShuffle(pool, _kanaDailySeed());
  const daily20 = seeded.slice(0, 20);

  if (!daily20.length) { rewardPopup('No kana available for daily challenge!'); return; }

  // Inject a banner
  const gameArea = document.getElementById('kanaGameArea');
  const existingBanner = document.getElementById('kanaDailyBanner');
  if (existingBanner) existingBanner.remove();
  const banner = document.createElement('div');
  banner.id = 'kanaDailyBanner';
  banner.className = 'kana-daily-banner';
  banner.textContent = already
    ? '📅 Daily Challenge — Already completed today! Playing again for practice.'
    : '📅 Daily Challenge — 20 fixed prompts. Complete to earn bonus tickets!';
  if (gameArea) gameArea.parentElement.insertBefore(banner, gameArea);

  // Override pool for this session: inject 20 daily cards + set a flag
  window._kanaDailySession = { pool: daily20, doneKey, alreadyDone: !!already };

  // Start normally — pool will be intercepted in kanaStartSession patch below
  kanaStartDailySession();
}

function kanaStartDailySession() {
  const dailyData = window._kanaDailySession;
  if (!dailyData) { kanaStartSession(); return; }

  // Temporarily override kanaBuildPool
  const _origBuild = kanaBuildPool;
  window._kanaOverridePool = dailyData.pool;
  // Start session using the main flow but with our pool
  kanaStartSession();
  window._kanaOverridePool = null;
}

// Patch kanaBuildPool to check override
const _s13_origBuildPool = kanaBuildPool;
kanaBuildPool = function() {
  if (window._kanaOverridePool) return [...window._kanaOverridePool];
  return _s13_origBuildPool();
};

// Patch kanaEndSession to handle daily completion
const _s13_origKanaEndSession = kanaEndSession;
kanaEndSession = function(isTimeout) {
  _s13_origKanaEndSession(isTimeout);
  // Daily challenge completion check
  if (window._kanaDailySession) {
    const { doneKey, alreadyDone } = window._kanaDailySession;
    if (!alreadyDone) {
      localStorage.setItem(doneKey, '1');
      rewardStudy(5); // +5 bonus tickets for daily
      rewardPopup('📅 Daily Challenge complete! +5 bonus <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''>');
      // Mark button as done
      const btn = document.getElementById('kanaDailyBtn');
      if (btn) btn.classList.add('done');
    }
    // Remove banner
    const banner = document.getElementById('kanaDailyBanner');
    if (banner) banner.remove();
    window._kanaDailySession = null;
  }
};

// On load, mark daily btn done if already completed today
function _kanaCheckDailyDone() {
  const todayKey = new Date().toISOString().slice(0, 10);
  const doneKey  = 'kanaDailyDone_' + todayKey;
  const btn = document.getElementById('kanaDailyBtn');
  if (btn && localStorage.getItem(doneKey)) btn.classList.add('done');
}

// ============================================================
// SESSION 13 — KANA SOUND EFFECTS
// ============================================================
let kanaSound = false; // off by default (R2 audio may not exist yet)
const _kanaAudioCache = {};

function toggleKanaSound() {
  kanaSound = !kanaSound;
  const el = document.getElementById('kanaSoundIcon');
  if (el) el.textContent = kanaSound ? '🔊' : '🔇';
  if (kanaSound) rewardPopup('🔊 Kana sounds ON');
}

function playKanaSound(romaji) {
  if (!kanaSound) return;
  // Map romaji → audio file (e.g. "a" → "a.mp3", "chi" → "chi.mp3")
  const file = romaji.replace('tsu','tsu').replace('chi','chi') + '.mp3';
  const url = (typeof R2_BASE !== 'undefined' ? R2_BASE : '') + '/media/audio/' + file;
  try {
    if (!_kanaAudioCache[romaji]) {
      _kanaAudioCache[romaji] = new Audio(url);
      _kanaAudioCache[romaji].volume = 0.6;
    }
    _kanaAudioCache[romaji].currentTime = 0;
    _kanaAudioCache[romaji].play().catch(() => {}); // ignore if file missing
  } catch(e) {}
}

// Patch kanaAnswer to play sound on correct
const _s13_origKanaAnswer = kanaAnswer;
kanaAnswer = function(romaji, correct) {
  _s13_origKanaAnswer(romaji, correct);
  if (romaji === correct) playKanaSound(romaji);
}

// ============================================================
// SESSION 13 — KANJI TRACE STREAK MULTIPLIER
// ============================================================
let traceStreak = 0;  // consecutive Got It count
let traceMaxStreak = 0;

// Wrap traceGotIt
const _s13_origTraceGotIt = traceGotIt;
traceGotIt = function() {
  traceStreak++;
  if (traceStreak > traceMaxStreak) traceMaxStreak = traceStreak;
  // Multiplier: 1× for 1-2, 2× for 3-4, 3× for 5-9, 5× for 10+
  const mult = traceStreak >= 10 ? 5 : traceStreak >= 5 ? 3 : traceStreak >= 3 ? 2 : 1;

  // Update combo display
  const comboStat = document.getElementById('traceComboStat');
  const comboVal  = document.getElementById('traceComboVal');
  if (comboStat) comboStat.style.display = traceStreak >= 3 ? '' : 'none';
  if (comboVal)  comboVal.textContent = '×' + mult;

  // Call original (awards +2 tickets base)
  _s13_origTraceGotIt();

  // Award extra tickets for multiplier
  if (mult > 1) {
    rewardStudy(mult - 1); // bonus on top of the 2 already awarded
    // Show combo popup on canvas area
    const canvasWrap = document.querySelector('.trace-canvas-wrap');
    if (canvasWrap) {
      const pop = document.createElement('div');
      pop.className = 'trace-combo-popup';
      pop.textContent = '×' + mult + ' combo!';
      canvasWrap.style.position = 'relative';
      canvasWrap.appendChild(pop);
      setTimeout(() => pop.remove(), 1000);
    }
  }
}

// Wrap traceTryAgain to reset streak
const _s13_origTraceTryAgain = traceTryAgain;
traceTryAgain = function() {
  traceStreak = 0;
  const comboStat = document.getElementById('traceComboStat');
  if (comboStat) comboStat.style.display = 'none';
  _s13_origTraceTryAgain();
}

// Reset on session init
const _s13_origTraceInit = traceInitSession;
traceInitSession = function() {
  traceStreak = 0; traceMaxStreak = 0;
  const comboStat = document.getElementById('traceComboStat');
  if (comboStat) comboStat.style.display = 'none';
  _s13_origTraceInit();
}

// Include max streak in session summary
const _s13_origTraceShowEnd = traceShowEnd;
traceShowEnd = function() {
  _s13_origTraceShowEnd();
  // Append max streak row to summary — we piggyback by re-opening with extra row
  const total = traceGotItCnt + traceTryAgainCnt;
  const acc   = total > 0 ? Math.round(traceGotItCnt / total * 100) : 0;
  if (traceMaxStreak >= 3) {
    // Re-open summary with max streak added
    setTimeout(() => {
      openSessionSummary({
        title: 'Trace Session Done!', emoji: acc >= 70 ? '🏆' : '⭐', sub: 'Kanji tracing',
        rows: [
          { label: 'Got It',    val: traceGotItCnt,   color: 'var(--correct)' },
          { label: 'Try Again', val: traceTryAgainCnt, color: 'var(--wrong)' },
          { label: 'Accuracy',  val: acc + '%' },
          { label: 'Best Combo', val: '×' + (traceMaxStreak >= 10 ? 5 : traceMaxStreak >= 5 ? 3 : 2) + ' (' + traceMaxStreak + ' streak)', color: 'var(--warn)' },
        ],
        ticketsEarned: traceGotItCnt * 2,
        weakCount: 0,
      });
    }, 50);
  }
}

// ============================================================
// SESSION 13 — BURY EASY CARDS
// Patch revGrade: if Easy (grade 3) and reps >= 3 with ease >= 2.5,
// push interval further to 60+ days ("buried")
// ============================================================
const _s13_origRevGrade = _revHeatGrade_origRevGrade;
// We can't re-wrap revGrade safely here since it's already wrapped twice.
// Instead patch via the post-grade hook in the heatmap wrapper:
const _s13_revGradeBase = revGrade;
revGrade = function(g) {
  _s13_revGradeBase(g);
  // After grading, check if this card should be buried
  // revGrade already saved state; we need to check+update
  try {
    const state = revLoadState(revActiveSet);
    const card = revQueue && revQueue[revCardIdx - 1]; // last graded
    if (!card) return;
    const s = state[card._origQ || card.q];
    if (!s) return;
    // Bury: Easy grade (g===3), high accuracy (ease>=2.5), at least 3 reps, no lapses recently
    if (g === 3 && s.ease >= 2.5 && s.reps >= 3 && s.lapses === 0) {
      const buriedInterval = Math.max(s.interval, 60); // at least 60 days
      if (s.interval < 60) {
        s.interval = buriedInterval;
        s.due = buriedInterval * 5;
        state[card._origQ || card.q] = s;
        revSaveState(revActiveSet, state);
      }
    }
  } catch(e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  // Wire quick review flip
  const qrevFront = document.getElementById('qrevFront');
  if (qrevFront) qrevFront.addEventListener('click', qrevTap);
  // Trigger quick review after settle
  setTimeout(initQuickReview, 1800);
  // Init kana start screen
  kanaUpdateStartScreen();
  // Init sidebar streak from heatmap
  setTimeout(updateSidebarStreak, 800);
  // Mark daily kana button if already done today
  setTimeout(_kanaCheckDailyDone, 500);
});


// ============================================================
// SESSION 14 — PHASE 6.1: LEARNED VAULT FULL IMPLEMENTATION
// ============================================================

// --- State ---
let _lvCurrentSource = 'all';
let _lvActiveItem    = null; // item being viewed in detail popup

// Source config
const LV_SOURCES = {
  trace:  { label: '✏️ Traced',  color: 'var(--accent2)' },
  flash:  { label: '漢 Cards',   color: 'var(--accent)' },
  mcq:    { label: '📝 MCQ',     color: 'var(--warn)' },
  review: { label: '🧠 Review',  color: 'var(--correct)' },
  kana:   { label: 'あ Kana',    color: '#ff88dd' },
  anime:  { label: '📺 Anime',   color: '#88ffcc' },
};

// Milestone thresholds + rewards
const LV_MILESTONES = [10, 25, 50, 100, 250, 500, 1000];
const LV_MILESTONE_REWARDS = { 10:3, 25:5, 50:10, 100:20, 250:35, 500:75, 1000:150 };

// --- Core helpers ---
function lvLoad() {
  try { return JSON.parse(localStorage.getItem('learnedVault') || '[]'); }
  catch(_) { return []; }
}
function lvSave(vault) {
  try { localStorage.setItem('learnedVault', JSON.stringify(vault)); }
  catch(_) {}
}
function lvLoadStarred() {
  try { return JSON.parse(localStorage.getItem('lv_starred') || '[]'); }
  catch(_) { return []; }
}
function lvSaveStarred(arr) {
  try { localStorage.setItem('lv_starred', JSON.stringify(arr)); }
  catch(_) {}
}

function lvMasteryPct(item) {
  // Estimate mastery from SR state if available
  const state = (() => {
    try {
      const sets = ['n5','n4','hiragana','katakana'];
      for (const s of sets) {
        const raw = localStorage.getItem('rev_state_' + s);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (parsed[item.term]) return parsed[item.term];
        if (parsed[item.q])    return parsed[item.q];
      }
    } catch(_) {}
    return null;
  })();
  if (state) {
    const reps = Math.min(state.reps || 0, 10);
    const ease = Math.min((state.ease || 2.5) - 1.3, 2.2); // 0..2.2
    return Math.min(100, Math.round((reps / 10) * 60 + (ease / 2.2) * 40));
  }
  // Fallback: traced = 60%, others 40%
  return item.source === 'trace' ? 60 : 40;
}

function lvMasteryBadge(pct) {
  if (pct >= 90) return { label: 'Platinum', color: '#ccefff', glow: '#88ddff' };
  if (pct >= 70) return { label: 'Gold',     color: '#ffd700', glow: '#ffc200' };
  if (pct >= 40) return { label: 'Silver',   color: '#c0c0c0', glow: '#aaaaaa' };
  return              { label: 'Bronze',   color: '#cd7f32', glow: '#b06020' };
}

function lvSourceBadgeHTML(source) {
  const cfg = LV_SOURCES[source] || { label: source, color: 'var(--muted)' };
  return `<span class="lv-source-badge" style="background:${cfg.color}22;color:${cfg.color};border-color:${cfg.color}44">${cfg.label}</span>`;
}

function lvRelativeTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  const d = Math.floor(h / 24);
  if (d < 7)  return d + 'd ago';
  return new Date(ts).toLocaleDateString('en-GB', { day:'numeric', month:'short' });
}

function lvIsToday(ts) {
  if (!ts) return false;
  const d1 = new Date(ts), d2 = new Date();
  return d1.toDateString() === d2.toDateString();
}

// --- Milestone check ---
function lvCheckMilestones(oldCount, newCount) {
  const claimed = JSON.parse(localStorage.getItem('lv_milestones_claimed') || '[]');
  LV_MILESTONES.forEach(n => {
    if (newCount >= n && oldCount < n && !claimed.includes(n)) {
      claimed.push(n);
      localStorage.setItem('lv_milestones_claimed', JSON.stringify(claimed));
      const reward = LV_MILESTONE_REWARDS[n] || 5;
      rewardStudy(reward);
      setTimeout(() => {
        openSessionSummary({
          title: 'Vault Milestone!',
          emoji: n >= 100 ? '🏆' : '⭐',
          sub: `${n} items mastered!`,
          rows: [
            { label: 'Total Learned', val: newCount },
            { label: 'Milestone',     val: n + ' items', color: 'var(--warn)' },
            { label: 'Reward',        val: '+' + reward + ' <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''>', color: 'var(--correct)' },
          ],
          ticketsEarned: reward,
          weakCount: 0,
        });
      }, 400);
    }
  });
}

// Public helper called from other modules to add to vault
function lvAddToVault(item) {
  // item: { id, type, term, reading, meaning, dateAdded, source, ...extra }
  const vault = lvLoad();
  const oldCount = vault.length;
  if (!vault.some(v => v.term === item.term && v.source === item.source)) {
    vault.push({ ...item, dateAdded: item.dateAdded || Date.now() });
    lvSave(vault);
    lvCheckMilestones(oldCount, vault.length);
  }
}

// --- Render ---
function initLearnedVault() {
  _lvCurrentSource = 'all';
  const searchEl = document.getElementById('lvSearch');
  if (searchEl) searchEl.value = '';
  // Reset source buttons
  document.querySelectorAll('#lvSourceFilter .lv-filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.source === 'all');
  });
  lvFilter();
  lvUpdateMilestoneBar();
  lvUpdateSidebarCount();
}

function lvFilter() {
  const vault   = lvLoad();
  const starred = lvLoadStarred();
  const q       = (document.getElementById('lvSearch')?.value || '').toLowerCase().trim();
  const sort    = document.getElementById('lvSort')?.value || 'newest';

  // Filter
  let items = vault.filter(item => {
    if (_lvCurrentSource === 'starred') return starred.includes(item.id || item.term);
    if (_lvCurrentSource !== 'all' && item.source !== _lvCurrentSource) return false;
    if (!q) return true;
    return (item.term||'').toLowerCase().includes(q)
        || (item.reading||'').toLowerCase().includes(q)
        || (item.meaning||'').toLowerCase().includes(q);
  });

  // Sort
  items.sort((a, b) => {
    if (sort === 'newest')    return (b.dateAdded||0) - (a.dateAdded||0);
    if (sort === 'oldest')    return (a.dateAdded||0) - (b.dateAdded||0);
    if (sort === 'alpha')     return (a.term||'').localeCompare(b.term||'');
    if (sort === 'alpha_rev') return (b.term||'').localeCompare(a.term||'');
    return 0;
  });

  // "Today" section
  const todayItems = vault.filter(item => lvIsToday(item.dateAdded));
  const todaySection = document.getElementById('lvTodaySection');
  const todayStrip   = document.getElementById('lvTodayStrip');
  if (todaySection && todayStrip) {
    if (todayItems.length > 0 && _lvCurrentSource === 'all' && !q) {
      todaySection.classList.remove('hidden');
      todayStrip.innerHTML = todayItems.map(item => `
        <div class="lv-today-chip" onclick="lvOpenDetail(${JSON.stringify(item).replace(/"/g,'&quot;')})">
          <span class="lv-today-term">${item.term}</span>
          <span class="lv-today-meaning">${item.meaning || ''}</span>
        </div>
      `).join('');
    } else {
      todaySection.classList.add('hidden');
    }
  }

  // Header stats
  const todayCountEl = document.getElementById('lvTodayCount');
  if (todayCountEl) todayCountEl.textContent = todayItems.length;
  const starCountEl = document.getElementById('lvStarCount');
  if (starCountEl) starCountEl.textContent = starred.length;

  // Grid
  const grid  = document.getElementById('lvGrid');
  const empty = document.getElementById('lvEmpty');
  if (!grid) return;

  if (items.length === 0) {
    grid.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    return;
  }
  if (empty) empty.classList.add('hidden');

  grid.innerHTML = items.map(item => {
    const pct     = lvMasteryPct(item);
    const badge   = lvMasteryBadge(pct);
    const isStarred = starred.includes(item.id || item.term);
    const itemJson  = JSON.stringify(item).replace(/"/g, '&quot;');
    return `
      <div class="lv-card" onclick="lvOpenDetail(${itemJson})">
        <div class="lv-card-top">
          <div class="lv-card-term">${item.term}</div>
          <div class="lv-card-star ${isStarred ? 'starred' : ''}" onclick="event.stopPropagation();lvToggleStarId('${item.id || item.term}')" title="Star">⭐</div>
        </div>
        <div class="lv-card-reading">${item.reading || ''}</div>
        <div class="lv-card-meaning">${item.meaning || ''}</div>
        <div class="lv-card-footer">
          ${lvSourceBadgeHTML(item.source)}
          <span class="lv-mastery-badge" style="color:${badge.color}">◆ ${badge.label}</span>
          <span class="lv-card-date">${lvRelativeTime(item.dateAdded)}</span>
        </div>
        <div class="lv-card-bar"><div class="lv-card-bar-fill" style="width:${pct}%;background:${badge.color}"></div></div>
      </div>
    `;
  }).join('');

  // Update total badge
  const totalBadge = document.getElementById('lvTotalBadge');
  if (totalBadge) totalBadge.textContent = vault.length;
  const subtitle = document.getElementById('lvSubtitle');
  if (subtitle) subtitle.textContent = vault.length === 1 ? 'item mastered' : 'items mastered';
}

function lvSetSource(source, btn) {
  _lvCurrentSource = source;
  document.querySelectorAll('#lvSourceFilter .lv-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  lvFilter();
}

function lvUpdateMilestoneBar() {
  const vault = lvLoad();
  const count = vault.length;
  const next  = LV_MILESTONES.find(n => n > count) || LV_MILESTONES[LV_MILESTONES.length - 1];
  const prev  = LV_MILESTONES[LV_MILESTONES.indexOf(next) - 1] || 0;
  const pct   = prev === next ? 100 : Math.min(100, Math.round((count - prev) / (next - prev) * 100));
  const fill  = document.getElementById('lvMilestoneFill');
  const label = document.getElementById('lvMilestoneLabel');
  if (fill)  fill.style.width = pct + '%';
  if (label) label.textContent = count >= next
    ? `🏆 ${count} mastered — all milestones reached!`
    : `Next milestone: ${next} (${count}/${next})`;
}

function lvUpdateSidebarCount() {
  // Show learned count in sidebar player sub
  const vault = lvLoad();
  const el = document.getElementById('sbPlayerTitle');
  if (el) {
    const lvLabel = `LVL ${Math.floor(vault.length / 10) + 1} · ${vault.length} learned`;
    el.textContent = lvLabel;
  }
}

// --- Detail popup ---
function lvOpenDetail(item) {
  if (typeof item === 'string') {
    try { item = JSON.parse(item); } catch(_) { return; }
  }
  _lvActiveItem = item;
  const overlay = document.getElementById('lvDetailOverlay');
  const card    = document.getElementById('lvDetailCard');
  if (!overlay || !card) return;

  // Term
  const termEl = document.getElementById('lvDetailTerm');
  if (termEl) termEl.textContent = item.term || '';

  // Badges
  const badgesEl = document.getElementById('lvDetailBadges');
  if (badgesEl) {
    const pct   = lvMasteryPct(item);
    const badge = lvMasteryBadge(pct);
    const starred = lvLoadStarred();
    const isStarred = starred.includes(item.id || item.term);
    badgesEl.innerHTML = lvSourceBadgeHTML(item.source)
      + `<span class="lv-mastery-badge" style="color:${badge.color};font-size:11px">◆ ${badge.label}</span>`
      + (isStarred ? `<span class="lv-source-badge" style="background:#ffd70022;color:#ffd700;border-color:#ffd70044">⭐ Starred</span>` : '');
  }

  // Info rows
  const infoEl = document.getElementById('lvDetailInfo');
  if (infoEl) {
    const rows = [
      item.reading ? `<div class="lv-detail-row"><span class="lv-detail-key">Reading</span><span class="lv-detail-val">${item.reading}</span></div>` : '',
      item.meaning ? `<div class="lv-detail-row"><span class="lv-detail-key">Meaning</span><span class="lv-detail-val">${item.meaning}</span></div>` : '',
      item.unit    ? `<div class="lv-detail-row"><span class="lv-detail-key">Level</span><span class="lv-detail-val">${item.unit.toUpperCase()}</span></div>` : '',
      item.dateAdded ? `<div class="lv-detail-row"><span class="lv-detail-key">Added</span><span class="lv-detail-val">${new Date(item.dateAdded).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span></div>` : '',
    ].filter(Boolean);
    infoEl.innerHTML = rows.join('');
  }

  // Mastery bar
  const pct   = lvMasteryPct(item);
  const fill  = document.getElementById('lvDetailMasteryFill');
  const pctEl = document.getElementById('lvDetailMasteryPct');
  const badge = lvMasteryBadge(pct);
  if (fill)  { fill.style.width = pct + '%'; fill.style.background = badge.color; }
  if (pctEl) pctEl.textContent = pct + '%';

  // Star button
  const starBtn = document.getElementById('lvDetailStarBtn');
  if (starBtn) {
    const starred = lvLoadStarred();
    const isStarred = starred.includes(item.id || item.term);
    starBtn.textContent = isStarred ? '✩ Unstar' : '⭐ Star';
  }

  overlay.classList.remove('hidden');
  setTimeout(() => card.classList.add('open'), 10);
}

function lvCloseDetail(e) {
  if (e && e.target !== document.getElementById('lvDetailOverlay')) return;
  const overlay = document.getElementById('lvDetailOverlay');
  const card    = document.getElementById('lvDetailCard');
  if (card)  card.classList.remove('open');
  setTimeout(() => { if (overlay) overlay.classList.add('hidden'); }, 200);
  _lvActiveItem = null;
}

function lvToggleStar() {
  if (!_lvActiveItem) return;
  lvToggleStarId(_lvActiveItem.id || _lvActiveItem.term);
  lvOpenDetail(_lvActiveItem); // re-render detail
  lvFilter(); // refresh grid
}

function lvToggleStarId(key) {
  const starred = lvLoadStarred();
  const idx = starred.indexOf(key);
  if (idx >= 0) starred.splice(idx, 1);
  else starred.push(key);
  lvSaveStarred(starred);
  lvFilter();
}

function lvQuickReview() {
  if (!_lvActiveItem) return;
  const item = _lvActiveItem;
  lvCloseDetail();
  // Push to review queue and switch to review tab
  if (typeof reviewQueuePush === 'function') {
    reviewQueuePush({ q: item.term, a: (item.reading ? item.reading + ' — ' : '') + (item.meaning || ''), unit: item.unit || item.source || 'custom', diff: 'medium' });
  }
  if (typeof updateReviewBadge === 'function') updateReviewBadge();
  if (typeof switchMode === 'function') switchMode('review');
  if (typeof setSbActive === 'function') {
    const btn = document.querySelector('[data-mode="review"]');
    if (btn) setSbActive(btn);
  }
  rewardPopup('📚 Added to Review queue!');
}

function lvRemove() {
  if (!_lvActiveItem) return;
  const item = _lvActiveItem;
  const vault = lvLoad();
  const oldCount = vault.length;
  const newVault = vault.filter(v => !(v.term === item.term && v.source === item.source));
  lvSave(newVault);
  // Also remove from starred
  const starred = lvLoadStarred();
  const key = item.id || item.term;
  const newStarred = starred.filter(k => k !== key);
  lvSaveStarred(newStarred);
  lvCloseDetail();
  lvFilter();
  lvUpdateMilestoneBar();
  rewardPopup('Removed from vault');
}

function lvExport() {
  const vault = lvLoad();
  if (!vault.length) { rewardPopup('Vault is empty!'); return; }
  const lines = vault.map(v => `${v.term}\t${v.reading||''}\t${v.meaning||''}\t${v.source||''}`);
  const text = 'Term\tReading\tMeaning\tSource\n' + lines.join('\n');
  try {
    navigator.clipboard.writeText(text);
    rewardPopup('📋 Copied ' + vault.length + ' items!');
  } catch(_) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    rewardPopup('📋 Copied ' + vault.length + ' items!');
  }
}

// --- Hook: wrap rateCard to add "got it" cards to vault ---
const _lv_origRateCard = window.rateCard || rateCard;
function rateCard(knew) {
  if (typeof _lv_origRateCard === 'function') _lv_origRateCard(knew);
  if (knew) {
    // Get current flashcard
    try {
      const cards = APP_FLASHCARDS || [];
      const card  = cards[fcIdx];
      if (card && card.q) {
        const kanji = (APP_KANJI_DB || []).find(k => k.char === card.q || k.char === card.a);
        lvAddToVault({
          id: 'fc_' + (card.id || card.q),
          type: 'flash', source: 'flash', term: card.q,
          reading: kanji?.kun || card.a || '',
          meaning: kanji?.meaning || card.a || '',
          unit: card.unit || 'n5',
        });
      }
    } catch(_) {}
  }
}

// Wire lvAddToVault into the global scope (used by traceGotIt already writes to learnedVault directly)
// Patch traceGotIt to also call lvCheckMilestones
const _lv_origTraceGotIt = typeof traceGotIt === 'function' ? traceGotIt : null;
if (_lv_origTraceGotIt) {
  window.traceGotIt = function() {
    const vaultBefore = lvLoad().length;
    _lv_origTraceGotIt();
    const vaultAfter = lvLoad().length;
    if (vaultAfter > vaultBefore) lvCheckMilestones(vaultBefore, vaultAfter);
    lvUpdateSidebarCount();
  };
}

// Init on DOMContentLoaded hook (sidebar count update)
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(lvUpdateSidebarCount, 1200);
});

// ============================================================
// SESSION 14 — PHASE 6.2: SHOP DAILY FEATURED ITEM
// + PHASE 2.3: REVIEW DUE TIMER
// ============================================================

// ── DAILY FEATURED SHOP ITEM ──────────────────────────────────
// One random item from shop_items.json rotates every 24h, shown
// at the top of Black Market with a countdown + discount badge.

const SHOP_DAILY_CYCLE = 24 * 60 * 60 * 1000; // 24 hours

function shopGetDailyItem() {
  const now = Date.now();
  const dayIdx = Math.floor(now / SHOP_DAILY_CYCLE);
  const pool = APP_SHOP_ITEMS || [];
  if (!pool.length) return null;
  // Seed based on dayIdx for deterministic daily pick
  const hash = Math.abs(Math.sin(dayIdx * 91.3 + 7.1) * pool.length) | 0;
  return pool[hash % pool.length] || null;
}

function shopDailyTimeLeft() {
  const now = Date.now();
  const msLeft = SHOP_DAILY_CYCLE - (now % SHOP_DAILY_CYCLE);
  const h = Math.floor(msLeft / 3600000);
  const m = Math.floor((msLeft % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function renderShopDailyItem() {
  // Inject the daily featured panel above shopItemsMain
  const container = document.getElementById('shopItemsMain');
  if (!container) return;
  const item = shopGetDailyItem();
  if (!item) return;

  // Remove old daily panel if present
  const oldPanel = document.getElementById('shopDailyPanel');
  if (oldPanel) oldPanel.remove();

  const owned = (typeof inventory !== 'undefined') && inventory.find(i => i.id === item.id);
  const discount = Math.round(item.cost * 0.8); // 20% discount
  const typeEmoji = {title:'🏷️', theme:'🎨', effect:'✨', dialogue:'💬', vfx:'⚡', bg:'🖼️', rain:'🌧️', consumable:'⚡', border:'🔲', cursor:'🖱️', greeting:'👋', streak_effect:'🔥'}[item.category || item.type] || '📦';

  const panel = document.createElement('div');
  panel.id = 'shopDailyPanel';
  panel.className = 'shop-daily-panel';
  panel.innerHTML = `
    <div class="shop-daily-header">
      <div class="shop-daily-label">⚡ Daily Deal</div>
      <div class="shop-daily-timer">Resets in ${shopDailyTimeLeft()}</div>
    </div>
    <div class="shop-daily-body">
      <div class="shop-daily-icon">${item.icon || typeEmoji}</div>
      <div class="shop-daily-info">
        <div class="shop-daily-name">${item.name}</div>
        <div class="shop-daily-desc">${item.description || item.desc || ''}</div>
        <div class="shop-daily-rarity" style="color:${RARITY_COLORS[item.rarity]||'var(--muted)'}">${(item.rarity||'').toUpperCase()}</div>
      </div>
      <div class="shop-daily-price-col">
        <div class="shop-daily-orig">🎰 ${item.cost}</div>
        <div class="shop-daily-disc">🎰 ${discount}</div>
        ${owned
          ? `<span style="font-family:'Space Mono',monospace;font-size:11px;color:var(--correct)">OWNED</span>`
          : `<button class="btn btn-primary shop-daily-btn" id="shopDailyBuyBtn" style="margin-top:4px;font-size:11px;padding:6px 12px">Buy Deal</button>`
        }
      </div>
    </div>
  `;
  // Insert before the main shop grid
  container.parentNode.insertBefore(panel, container);

  if (!owned) {
    const buyBtn = document.getElementById('shopDailyBuyBtn');
    if (buyBtn) {
      buyBtn.onclick = () => {
        if (gambleCurrency < discount) { rewardPopup('Not enough coins!'); return; }
        // Check one purchase per day
        const claimedKey = 'shopDailyClaimed_' + Math.floor(Date.now() / SHOP_DAILY_CYCLE);
        if (localStorage.getItem(claimedKey)) { rewardPopup('Daily deal already claimed today!'); return; }
        gambleCurrency -= discount;
        addToInventory({ id: item.id, name: item.name, type: item.type || item.category, data: item.data || item.id });
        if (item.type === 'theme') applyTheme(item.data);
        updateCurrencies();
        localStorage.setItem(claimedKey, '1');
        rewardPopup(`✅ ${item.name} claimed at 20% off!`);
        renderShopDailyItem();
      };
    }
  }
}


// RARITY_COLORS is declared at the top of this file

// Patch generateShopMain to also render daily item
const _lv_origGenerateShopMain = generateShopMain;
generateShopMain = function() {
  _lv_origGenerateShopMain();
  // Small delay so the base HTML is in the DOM
  setTimeout(renderShopDailyItem, 10);
}

// ── REVIEW DUE TIMER ──────────────────────────────────────────
// Shows "Due in: Xh Ym" text near the set selector when next
// review is in the future. Updates on revInit.

function revGetNextDue() {
  // Scan all SR state keys to find the earliest future due time
  const SETS = ['n5','n4','hiragana','katakana','reviewQueue'];
  let earliest = Infinity;
  SETS.forEach(setId => {
    try {
      const raw = localStorage.getItem('rev_state_' + setId);
      if (!raw) return;
      const state = JSON.parse(raw);
      Object.values(state).forEach(s => {
        if (s && s.due > 0) {
          // `due` is stored as interval-steps, not epoch ms
          // estimate: card is due in `s.due` review-steps (each step ~1 session ~day)
          // We flag it as due if due > 0 (already overdue is handled by badge)
        }
      });
    } catch(_) {}
  });
  return null; // implementation is SR-step based, not wall-clock
}

function revRenderDueTimer() {
  // Count overdue vs not-yet-due cards in all sets
  try {
    const SETS = typeof REVIEW_SETS !== 'undefined' ? REVIEW_SETS : [];
    let due = 0, notDue = 0;
    SETS.forEach(set => {
      const raw = localStorage.getItem('rev_state_' + set.id);
      if (!raw) return;
      const state = JSON.parse(raw);
      const cards = typeof revBuildCards === 'function' ? [] : [];
      Object.values(state).forEach(s => {
        if (!s) return;
        if ((s.due || 0) <= 0) due++;
        else notDue++;
      });
    });
    const el = document.getElementById('revDueTimer');
    if (el) {
      el.textContent = due > 0
        ? `🔴 ${due} overdue`
        : (notDue > 0 ? `✅ All caught up` : '');
    }
  } catch(_) {}
}

// Inject due timer element into Review set selector header area
const _lv_origRevInit = typeof revInit === 'function' ? revInit : null;
if (_lv_origRevInit) {
  const _lv_prevRevInit = revInit;
  window.revInit = function() {
    _lv_prevRevInit();
    // Inject due timer if not present
    setTimeout(() => {
      const setGrid = document.getElementById('revSetGrid');
      if (setGrid && !document.getElementById('revDueTimer')) {
        const timerEl = document.createElement('div');
        timerEl.id = 'revDueTimer';
        timerEl.style.cssText = 'font-family:Space Mono,monospace;font-size:11px;color:var(--muted);margin-bottom:10px;text-align:center';
        setGrid.parentNode.insertBefore(timerEl, setGrid);
      }
      revRenderDueTimer();
    }, 50);
  };
}

// ============================================================
// SESSION 15 — TYPING ANSWER MODE (Phase 2)
// ============================================================
let revTypingMode = false;

function toggleRevTypingMode() {
  revTypingMode = !revTypingMode;
  const btn = document.getElementById('revTypingModeBtn');
  if (btn) {
    btn.classList.toggle('active', revTypingMode);
    btn.textContent = revTypingMode ? '⌨️ Type: ON' : '⌨️ Type: OFF';
  }
  rewardPopup(revTypingMode ? '⌨️ Typing mode ON — type your answer before flipping' : '⌨️ Typing mode OFF');
}

// Wrap revShowCard to inject typing input when mode is on
const _s15_origRevShowCard = typeof revShowCard === 'function' ? revShowCard : null;
if (_s15_origRevShowCard) {
  revShowCard = function() {
    _s15_origRevShowCard();
    const front = document.getElementById('revCardFront');
    if (!front) return;
    // Remove previous typing block
    const old = front.querySelector('.rev-type-block');
    if (old) old.remove();

    if (!revTypingMode) return;

    const card = (typeof revQueue !== 'undefined' && typeof revCardIdx !== 'undefined') ? revQueue[revCardIdx] : null;
    if (!card) return;

    const block = document.createElement('div');
    block.className = 'rev-type-block';
    block.innerHTML = `
      <input class="rev-type-input" id="revTypeInput" type="text" placeholder="Type your answer…" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
      <div class="rev-type-hint" id="revTypeHint"></div>
      <button class="btn btn-secondary rev-type-submit" onclick="revTypeSubmit()">Check ↵</button>
    `;
    // Stop click-to-flip propagation from the input
    block.addEventListener('click', e => e.stopPropagation());
    front.appendChild(block);

    const input = block.querySelector('#revTypeInput');
    input.addEventListener('keydown', e => { if (e.key === 'Enter') revTypeSubmit(); });
    setTimeout(() => input.focus(), 50);
  };
}

function revTypeSubmit() {
  const card = (typeof revQueue !== 'undefined' && typeof revCardIdx !== 'undefined' && revCardIdx < revQueue.length) ? revQueue[revCardIdx] : null;
  if (!card) return;
  const input = document.getElementById('revTypeInput');
  const hint = document.getElementById('revTypeHint');
  if (!input || !hint) return;

  const guess = input.value.trim().toLowerCase();
  if (!guess) { hint.textContent = 'Type something first!'; hint.style.color = 'var(--muted)'; return; }

  const correct = (card.a || '').toLowerCase();
  const tokens = correct.split(/[\n,;·]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
  const isCorrect = tokens.some(t => t && (guess === t || t.includes(guess) || guess.includes(t)));

  if (isCorrect) {
    hint.textContent = '✅ Correct! Flipping…';
    hint.style.color = 'var(--correct)';
    input.disabled = true;
    setTimeout(() => { if (typeof revFlip === 'function') revFlip(); }, 500);
  } else {
    hint.textContent = '❌ Not quite — flip to see the answer';
    hint.style.color = 'var(--wrong)';
    input.style.borderColor = 'var(--wrong)';
  }
}

// ============================================================
// SESSION 15 — KANJI TRACE: JLPT label + learned reading count
// ============================================================
(function() {
  if (typeof traceRenderCard !== 'function') return;
  const _s15_origTrace = traceRenderCard;
  traceRenderCard = function() {
    _s15_origTrace();
    const kanji = (typeof tracePool !== 'undefined' && typeof traceIdx !== 'undefined') ? tracePool[traceIdx] : null;
    if (!kanji) return;

    // JLPT difficulty label
    let diffEl = document.getElementById('traceDiffLabel');
    if (!diffEl) {
      const charEl = document.getElementById('traceKanjiChar');
      if (charEl && charEl.parentNode) {
        diffEl = document.createElement('div');
        diffEl.id = 'traceDiffLabel';
        diffEl.className = 'trace-diff-label';
        charEl.parentNode.insertBefore(diffEl, charEl.nextSibling);
      }
    }
    if (diffEl) {
      const lvl = (kanji.jlpt || 'unknown').toUpperCase();
      const colors = { N5: '#00ff9d', N4: '#b8c6ff', N3: '#ffd32a', N2: '#ff9f43', N1: '#ff4757' };
      diffEl.textContent = lvl;
      diffEl.style.color = colors[lvl] || 'var(--muted)';
    }

    // Learned reading count from learnedVault
    let readCountEl = document.getElementById('traceLearnedReadings');
    if (!readCountEl) {
      const readingEl = document.getElementById('traceKanjiReadings');
      if (readingEl && readingEl.parentNode) {
        readCountEl = document.createElement('div');
        readCountEl.id = 'traceLearnedReadings';
        readCountEl.className = 'trace-learned-readings';
        readingEl.parentNode.insertBefore(readCountEl, readingEl.nextSibling);
      }
    }
    if (readCountEl) {
      try {
        const vault = JSON.parse(localStorage.getItem('learnedVault') || '[]');
        const matches = vault.filter(v => v.q === kanji.char || v.a === kanji.char ||
          (v.a && v.a.includes(kanji.char)) || (v.q && v.q.includes(kanji.char)));
        if (matches.length > 0) {
          readCountEl.textContent = '📚 ' + matches.length + ' reading' + (matches.length !== 1 ? 's' : '') + ' learned';
          readCountEl.style.color = 'var(--correct)';
        } else {
          readCountEl.textContent = '📚 Not yet in vault';
          readCountEl.style.color = 'var(--muted)';
        }
      } catch(_) {
        if (readCountEl) readCountEl.textContent = '';
      }
    }
  };
})();
// ============================================================
// SESSION 16 — SOFT RAIN OVERLAY (Phase 8.1)
// CSS-only animated rain with variants and intensity control
// Independent of the old theme-rain drop system
// ============================================================

// ── State ──
let rainOverlayVariant  = localStorage.getItem('rainOverlayVariant') || 'none';  // none/soft/heavy/storm/sakura/void
let rainOverlayIntensity = parseInt(localStorage.getItem('rainOverlayIntensity') || '60'); // 20–120 drops
let _rainOverlayDrops   = [];

const RAIN_VARIANTS = {
  none:    { label: '✖ Off',      drops: 0,   heightRange: [16, 28], durationRange: [0.45, 0.90], angle: 35 },
  soft:    { label: '🌧 Soft',    drops: 60,  heightRange: [14, 24], durationRange: [0.55, 1.00], angle: 35 },
  heavy:   { label: '⛈ Heavy',   drops: 100, heightRange: [20, 38], durationRange: [0.38, 0.72], angle: 28 },
  storm:   { label: '🌩 Storm',   drops: 140, heightRange: [26, 48], durationRange: [0.30, 0.55], angle: 18 },
  sakura:  { label: '🌸 Sakura',  drops: 50,  heightRange: [6,  14], durationRange: [1.20, 2.00], angle: 55 },
  void:    { label: '🌑 Void',    drops: 80,  heightRange: [12, 20], durationRange: [0.40, 0.70], angle: -15 },
};

function _rainOverlayClear() {
  const overlay = document.getElementById('rainOverlay');
  if (overlay) overlay.innerHTML = '';
  _rainOverlayDrops = [];
  // Remove variant classes
  document.body.classList.remove('rain-soft','rain-heavy','rain-storm','rain-sakura','rain-void');
}

function _rainOverlayBuild(variant) {
  const cfg = RAIN_VARIANTS[variant];
  if (!cfg || cfg.drops === 0) return;

  const overlay = document.getElementById('rainOverlay');
  if (!overlay) return;

  document.body.classList.add('rain-' + variant);

  // Scale drop count by intensity (rainOverlayIntensity is 20–120; 60 = 100%)
  const scale = rainOverlayIntensity / 60;
  const count = Math.round(cfg.drops * scale);

  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const drop = document.createElement('div');
    drop.className = 'rain-css-drop';

    const h     = cfg.heightRange[0] + Math.random() * (cfg.heightRange[1] - cfg.heightRange[0]);
    const dur   = cfg.durationRange[0] + Math.random() * (cfg.durationRange[1] - cfg.durationRange[0]);
    const delay = -(Math.random() * dur * 3); // stagger so they don't all start at top
    const left  = -5 + Math.random() * 115;   // vw, allow some off-screen
    const rx    = cfg.angle + (Math.random() * 14 - 7); // slight jitter

    drop.style.cssText = [
      `left: ${left}vw`,
      `height: ${h}px`,
      `animation-duration: ${dur.toFixed(2)}s`,
      `animation-delay: ${delay.toFixed(2)}s`,
      `--rx: ${rx}px`,
      `opacity: ${0.5 + Math.random() * 0.5}`,
    ].join(';');

    frag.appendChild(drop);
    _rainOverlayDrops.push(drop);
  }
  overlay.appendChild(frag);
}

function applyRainOverlay(variant) {
  rainOverlayVariant = variant;
  localStorage.setItem('rainOverlayVariant', variant);
  _rainOverlayClear();
  if (variant !== 'none') _rainOverlayBuild(variant);
  // Sync UI buttons
  document.querySelectorAll('.rain-variant-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.variant === variant);
  });
}

function setRainOverlayIntensity(val) {
  rainOverlayIntensity = parseInt(val);
  localStorage.setItem('rainOverlayIntensity', rainOverlayIntensity);
  const lbl = document.getElementById('rainIntensityLabel');
  if (lbl) lbl.textContent = rainOverlayIntensity + '%';
  if (rainOverlayVariant !== 'none') {
    _rainOverlayClear();
    _rainOverlayBuild(rainOverlayVariant);
  }
}

// Create the overlay element and restore on page load
(function _rainOverlayInit() {
  let overlay = document.getElementById('rainOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'rainOverlay';
    document.body.appendChild(overlay);
  }
  if (rainOverlayVariant !== 'none') {
    _rainOverlayBuild(rainOverlayVariant);
  }
})();

// ============================================================
// SESSION 16 — BACKGROUND DIM SLIDER (Phase 8.1)
// ============================================================

let bgDimLevel = parseInt(localStorage.getItem('bgDimLevel') || '0'); // 0-80

function applyBgDim(val) {
  bgDimLevel = parseInt(val);
  localStorage.setItem('bgDimLevel', bgDimLevel);
  let overlay = document.getElementById('bgDimOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'bgDimOverlay';
    document.body.appendChild(overlay);
  }
  overlay.style.background = `rgba(0,0,0,${(bgDimLevel / 100).toFixed(2)})`;
  const lbl = document.getElementById('bgDimLabel');
  if (lbl) lbl.textContent = bgDimLevel + '%';
}

// Apply on load
(function _dimInit() {
  if (bgDimLevel > 0) applyBgDim(bgDimLevel);
})();

// ============================================================
// SESSION 16 — CURSOR COSMETICS (Phase 6.2)
// Animated .ani / .cur files hosted on R2
// Only cursors that have a *2 variant get a selectable variant
// ============================================================

// R2 cursor base path
const CURSOR_R2 = R2_BASE + '/cursors/';

// Each entry: file = filename on R2 (no path prefix), hotspot = [x,y] px
// variants: array of {label, file} shown as sub-options when cursor is selected
// No variants property = single cursor, no picker shown
const CURSOR_ITEMS = [
  {
    id:       'cursor_frieren',
    name:     'Frieren',
    file:     'frieren.gif',
    cost:     500,
    rarity:   'epic',
    hotspot:  [0, 0],
    desc:     'Frieren the mage wanders across your screen.',
  },
  {
    id:       'cursor_konata',
    name:     'Konata Dance',
    file:     'konatadance2.gif',
    cost:     350,
    rarity:   'rare',
    hotspot:  [0, 0],
    desc:     'Lucky Star shuffle — two variants available.',
    variants: [
      { label: 'Variant 1', file: 'konatadance2.gif' },
      { label: 'Variant 2', file: 'konatadance2.gif' },
    ],
  },
  {
    id:       'cursor_flame',
    name:     'Legendary Flame',
    file:     'legendaryflamingepiccursor1.gif',
    cost:     1500,
    rarity:   'legendary',
    hotspot:  [16, 16],
    desc:     'An epic flaming cursor. Two blazing variants.',
    variants: [
      { label: 'Blaze I',  file: 'legendaryflamingepiccursor1.gif' },
      { label: 'Blaze II', file: 'legendaryflamingepiccursor2.gif' },
    ],
  },
  {
    id:       'cursor_naruto',
    name:     'Naruto Stride',
    file:     'narutostride.gif',
    cost:     400,
    rarity:   'rare',
    hotspot:  [0, 0],
    desc:     'Believe it.',
  },
  {
    id:       'cursor_nazuna',
    name:     'Nazuna',
    file:     'nazuna.gif',
    cost:     600,
    rarity:   'epic',
    hotspot:  [0, 0],
    desc:     'Call of the Night — Nazuna creeps across your desktop.',
  },
  {
    id:       'cursor_neuro',
    name:     'Neuro-sama',
    file:     'neurosama.gif',
    cost:     750,
    rarity:   'epic',
    hotspot:  [0, 0],
    desc:     'The AI VTuber herself.',
  },
  {
    id:       'cursor_sharingan',
    name:     'Sharingan',
    file:     'sharingan.gif',
    cost:     800,
    rarity:   'legendary',
    hotspot:  [16, 16],
    desc:     'The eye that copies everything.',
  },
  {
    id:       'cursor_sperm',
    name:     'Biology',
    file:     'sperm.gif',
    cost:     200,
    rarity:   'common',
    hotspot:  [0, 0],
    desc:     'Science.',
  },
  {
    id:       'cursor_yinyang',
    name:     'Yin Yang',
    file:     'yinyang2.gif',
    cost:     300,
    rarity:   'uncommon',
    hotspot:  [16, 16],
    desc:     'Balance. Two variants available.',
    variants: [
      { label: 'Static',   file: 'yinyang.gif'  },
      { label: 'Animated', file: 'yinyang2.gif' },
    ],
  },
  {
    id:       'cursor_miku',
    name:     'Miku',
    file:     'miku.gif',
    cost:     450,
    rarity:   'rare',
    hotspot:  [0, 0],
    desc:     'Hatsune Miku graces your every click.',
  },
  {
    id:       'cursor_clockwork',
    name:     'Clockwork',
    file:     'clockwork cursor.gif',
    cost:     600,
    rarity:   'epic',
    hotspot:  [16, 16],
    desc:     'Tick tock. Gears are always turning.',
  },
];

// cursorVariantChoice / equippedCursor / equippedCursorVariant declared early (top of file)

// Inject a <style> tag that sets cursor: url(...) on body
let _cursorStyleEl = null;
function _getCursorStyleEl() {
  if (!_cursorStyleEl) {
    _cursorStyleEl = document.createElement('style');
    _cursorStyleEl.id = '__cursorStyle';
    document.head.appendChild(_cursorStyleEl);
  }
  return _cursorStyleEl;
}

// ── Fake cursor overlay ──
// Browsers cannot animate GIFs via CSS cursor: url().
// We hide the native cursor and drive a positioned <img> via mousemove.
// RAF-throttled so the DOM write happens once per frame — no layout thrashing.
let _fakeCursorEl     = null;
let _fakeCursorActive = false;
let _fakeCursorRaf    = null;
let _fakeCursorX      = 0;
let _fakeCursorY      = 0;

function _getFakeCursorEl() {
  if (!_fakeCursorEl) {
    _fakeCursorEl = document.createElement('img');
    _fakeCursorEl.id  = '__fakeCursor';
    _fakeCursorEl.style.cssText = [
      'position:fixed',
      'top:0', 'left:0',
      'pointer-events:none',
      'z-index:2147483647',
      'display:none',
      'image-rendering:pixelated',
      'max-width:64px',
      'max-height:64px',
      'will-change:transform',
    ].join(';');
    document.body.appendChild(_fakeCursorEl);

    document.addEventListener('mousemove', e => {
      if (!_fakeCursorActive) return;
      _fakeCursorX = e.clientX;
      _fakeCursorY = e.clientY;
      if (!_fakeCursorRaf) {
        _fakeCursorRaf = requestAnimationFrame(() => {
          _fakeCursorRaf = null;
          if (_fakeCursorEl && _fakeCursorActive) {
            _fakeCursorEl.style.transform = `translate(${_fakeCursorX}px,${_fakeCursorY}px)`;
          }
        });
      }
    }, { passive: true });
  }
  return _fakeCursorEl;
}

function _enableFakeCursor(url, hotspot) {
  const [hx, hy] = hotspot || [0, 0];
  const el = _getFakeCursorEl();
  el.src = url;
  el.style.marginLeft = `-${hx}px`;
  el.style.marginTop  = `-${hy}px`;
  el.style.display    = 'block';
  _fakeCursorActive   = true;
  _getCursorStyleEl().textContent = `*, *::before, *::after { cursor: none !important; }`;
}

function _disableFakeCursor() {
  if (_fakeCursorEl) _fakeCursorEl.style.display = 'none';
  _fakeCursorActive = false;
  if (_fakeCursorRaf) { cancelAnimationFrame(_fakeCursorRaf); _fakeCursorRaf = null; }
}

function applyCursorCosmetic(cursorId, variantIdx) {
  variantIdx = (variantIdx !== undefined) ? parseInt(variantIdx) : (cursorVariantChoice[cursorId] || 0);

  const def = CURSOR_ITEMS.find(c => c.id === cursorId);
  const styleEl = _getCursorStyleEl();

  if (!def || cursorId === 'none') {
    styleEl.textContent = '';
    document.body.style.cursor = '';
    _disableFakeCursor();
    equippedCursor = 'none';
    localStorage.setItem('equippedCursor', 'none');
    return;
  }

  const file = (def.variants && def.variants[variantIdx])
    ? def.variants[variantIdx].file
    : def.file;

  const url     = CURSOR_R2 + encodeURIComponent(file);
  const hotspot = def.hotspot || [0, 0];

  if (file.endsWith('.cur')) {
    _disableFakeCursor();
    styleEl.textContent = `
      *, *::before, *::after {
        cursor: url('${url}') ${hotspot[0]} ${hotspot[1]}, auto !important;
      }
    `;
  } else {
    _enableFakeCursor(url, hotspot);
  }

  equippedCursor        = cursorId;
  equippedCursorVariant = variantIdx;
  cursorVariantChoice[cursorId] = variantIdx;
  localStorage.setItem('equippedCursor', cursorId);
  localStorage.setItem('equippedCursorVariant', variantIdx);
  localStorage.setItem('cursorVariantChoice', JSON.stringify(cursorVariantChoice));
}

// Restore on load
(function _cursorInit() {
  if (equippedCursor && equippedCursor !== 'none') {
    applyCursorCosmetic(equippedCursor, equippedCursorVariant);
  }
})();

// ── Cursor variant picker rendered into the bag items panel ──
// Called by renderInventory patch below
function renderCursorVariantPicker() {
  let picker = document.getElementById('cursorVariantPicker');
  if (!picker) {
    picker = document.createElement('div');
    picker.id = 'cursorVariantPicker';
    picker.style.cssText = 'background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:14px;display:none';
    const rainCtrl = document.getElementById('rainOverlayControl');
    if (rainCtrl) rainCtrl.after(picker);
  }

  if (equippedCursor === 'none') { picker.style.display = 'none'; return; }
  const def = CURSOR_ITEMS.find(c => c.id === equippedCursor);
  if (!def || !def.variants) { picker.style.display = 'none'; return; }

  picker.style.display = '';
  const activeIdx = cursorVariantChoice[equippedCursor] || 0;
  picker.innerHTML = `
    <div style="font-family:'Space Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:var(--accent);margin-bottom:8px">
      🖱️ ${def.name} — Variant
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      ${def.variants.map((v, i) => `
        <button class="rain-variant-btn ${i === activeIdx ? 'active' : ''}"
                onclick="applyCursorCosmetic('${equippedCursor}', ${i}); renderCursorVariantPicker(); renderInventory();">
          ${v.label}
        </button>`).join('')}
    </div>`;
}

// Patch equipItem to handle cursor + rain types
if (typeof equipItem !== 'undefined') {
  const _s16_base = equipItem;
  equipItem = function(itemId) {
    const item = inventory.find(i => i.id === itemId);
    if (item && item.type === 'cursor') {
      const cursorId = item.data || item.id;
      if (equippedCursor === cursorId) {
        applyCursorCosmetic('none');
        rewardPopup('Cursor unequipped');
      } else {
        applyCursorCosmetic(cursorId);
        rewardPopup('Cursor equipped: ' + item.name);
      }
      renderInventory();
      return;
    }
    if (item && item.type === 'rain') {
      if (typeof rainOverlayVariant !== 'undefined' && rainOverlayVariant === item.data) {
        applyRainOverlay('none');
        rewardPopup('Rain unequipped');
      } else {
        applyRainOverlay(item.data);
        rewardPopup('Rain equipped: ' + item.name);
      }
      renderInventory();
      return;
    }
    _s16_base(itemId);
  };
}

// Add cursor items to shop pool
(function _s16_addCursorItems() {
  if (typeof shopPool !== 'undefined') {
    CURSOR_ITEMS.forEach(ci => {
      if (!shopPool.find(s => s.id === ci.id)) {
        shopPool.push({
          id:     ci.id,
          name:   ci.name,
          type:   'cursor',
          data:   ci.id,          // equipItem looks up by id
          cost:   ci.cost,
          rarity: ci.rarity,
          desc:   ci.desc || 'Animated cursor cosmetic.',
        });
      }
    });
  }
})();

// ============================================================
// SESSION 16 — RARITY SORT + DUPLICATE COUNT (Phase 6.3)
// ============================================================

let invSortMode = localStorage.getItem('invSortMode') || 'type'; // type|rarity|newest|name

const RARITY_ORDER = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4, undefined: 5 };

function _invGetItemRarity(item) {
  // First try shop pool lookup
  const inShop = (typeof shopPool !== 'undefined' ? shopPool : []).find(s => s.id === item.id);
  if (inShop && inShop.rarity) return inShop.rarity;
  // Cursor items
  const ci = CURSOR_ITEMS.find(c => c.id === item.id);
  if (ci) return ci.rarity;
  return 'common';
}

function _invSortItems(items) {
  const list = [...items];
  if (invSortMode === 'rarity') {
    list.sort((a, b) => (RARITY_ORDER[_invGetItemRarity(a)] || 5) - (RARITY_ORDER[_invGetItemRarity(b)] || 5));
  } else if (invSortMode === 'newest') {
    list.sort((a, b) => (b.obtainedAt || 0) - (a.obtainedAt || 0));
  } else if (invSortMode === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }
  // 'type' = default grouping, no extra sort
  return list;
}

function setInvSort(mode, el) {
  invSortMode = mode;
  localStorage.setItem('invSortMode', mode);
  document.querySelectorAll('.inv-sort-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  renderInventory();
}

// ── Duplicate count tracker ──
function _invBuildDupeCounts() {
  const counts = {};
  // Count owned items: if shopPool has limitedStock > 1 or item bought multiple times
  // For now: count how many times each base-id appears (won't happen yet but prep)
  // We track via invDupeRaw in localStorage
  try {
    return JSON.parse(localStorage.getItem('invDupeCounts') || '{}');
  } catch(_) { return {}; }
}

// ============================================================
// SESSION 16 — EQUIPPED PREVIEW PANEL (Phase 6.3)
// ============================================================

function renderEquippedPreviewPanel() {
  const panel = document.getElementById('eqPreviewPanel');
  if (!panel) return;

  const equipped = [
    { type: 'title',    icon: '🏷️', label: 'Title',    value: playerTitle || 'wanderer',
      equipped: playerTitle, onUnequip: () => { playerTitle = 'wanderer'; updateCurrencies(); renderInventory(); } },
    { type: 'theme',    icon: '🎨', label: 'Theme',    value: equippedThemeId || 'Default',
      equipped: equippedThemeId && equippedThemeId !== 'none' ? equippedThemeId : null,
      onUnequip: () => { applyTheme('none'); renderInventory(); } },
    { type: 'effect',   icon: '✨', label: 'Effect',   value: (equippedEffect && equippedEffect !== 'none') ? equippedEffect : 'None',
      equipped: equippedEffect && equippedEffect !== 'none' ? equippedEffect : null,
      onUnequip: () => { equippedEffect = 'none'; localStorage.setItem('equippedEffect','none'); applyVisualEffect('none'); renderInventory(); } },
    { type: 'vfx',      icon: '⚡', label: 'VFX',      value: (equippedVfx && equippedVfx !== 'none') ? equippedVfx : 'None',
      equipped: equippedVfx && equippedVfx !== 'none' ? equippedVfx : null,
      onUnequip: () => { equippedVfx = 'none'; localStorage.setItem('equippedVfx','none'); renderInventory(); } },
    { type: 'bg',       icon: '🖼️', label: 'BG',       value: (equippedBg && equippedBg !== 'none') ? equippedBg : 'Default',
      equipped: equippedBg && equippedBg !== 'none' ? equippedBg : null,
      onUnequip: () => { equippedBg = 'none'; localStorage.setItem('equippedBg','none'); applyBg('none'); renderInventory(); } },
    { type: 'cursor',   icon: '🖱️', label: 'Cursor',
      value: (() => { const d = CURSOR_ITEMS.find(c => c.id === equippedCursor); return d ? d.name : 'Default'; })(),
      equipped: equippedCursor && equippedCursor !== 'none' ? equippedCursor : null,
      onUnequip: () => { applyCursorCosmetic('none'); renderInventory(); } },
    { type: 'rain',     icon: '🌧️', label: 'Rain',     value: (rainOverlayVariant && rainOverlayVariant !== 'none') ? rainOverlayVariant : 'Off',
      equipped: rainOverlayVariant && rainOverlayVariant !== 'none' ? rainOverlayVariant : null,
      onUnequip: () => { applyRainOverlay('none'); renderInventory(); } },
    { type: 'dialogue', icon: '💬', label: 'Dialogue', value: equippedDialogue || 'Default',
      equipped: equippedDialogue && equippedDialogue !== 'default' ? equippedDialogue : null,
      onUnequip: () => { equippedDialogue = 'default'; localStorage.setItem('equippedDialogue','default'); renderInventory(); } },
  ];

  panel.innerHTML = `
    <div class="eq-preview-title">🎨 Currently Equipped</div>
    <div class="eq-preview-grid">
      ${equipped.map((e, i) => `
        <div class="eq-preview-chip ${e.equipped ? 'has-item' : 'eq-preview-chip-empty'}"
             title="${e.equipped ? 'Click to unequip ' + e.label : 'Nothing equipped'}">
          <div style="display:flex;align-items:center;gap:6px">
            <span class="eq-preview-chip-icon">${e.icon}</span>
            <div style="flex:1;min-width:0">
              <div class="eq-preview-chip-type">${e.label}</div>
              <div class="eq-preview-chip-name">${e.value}</div>
            </div>
          </div>
          ${e.equipped ? `<button class="eq-unequip-btn" onclick="event.stopPropagation();_eqPreviewUnequip(${i})" title="Unequip">✕</button>` : ''}
        </div>`).join('')}
    </div>`;

  // Store unequip callbacks on window for onclick access
  window._eqPreviewUnequipFns = equipped.map(e => e.onUnequip);
}

window._eqPreviewUnequip = function(idx) {
  const fns = window._eqPreviewUnequipFns || [];
  if (fns[idx]) fns[idx]();
  renderEquippedPreviewPanel();
};

// ============================================================
// SESSION 16 — RAIN CONTROL PANEL IN BAG ITEMS
// ============================================================

function renderRainControlPanel() {
  const container = document.getElementById('rainOverlayControl');
  if (!container) return;

  const activeVariant = rainOverlayVariant;

  container.innerHTML = `
    <div class="rain-overlay-header">
      <span class="rain-overlay-label">🌧️ Rain Overlay</span>
      <span style="font-family:'Space Mono',monospace;font-size:10px;color:var(--muted)">
        ${activeVariant !== 'none' ? 'Active' : 'Off'}
      </span>
    </div>
    <div class="rain-variant-grid">
      ${Object.entries(RAIN_VARIANTS).map(([key, cfg]) => `
        <button class="rain-variant-btn ${key === activeVariant ? 'active' : ''}"
                data-variant="${key}"
                onclick="applyRainOverlay('${key}');renderRainControlPanel()">
          ${cfg.label}
        </button>`).join('')}
    </div>
    ${activeVariant !== 'none' ? `
    <div class="rain-intensity-row">
      <label>Intensity</label>
      <input type="range" min="20" max="120" value="${rainOverlayIntensity}"
             oninput="setRainOverlayIntensity(this.value)">
      <span id="rainIntensityLabel">${rainOverlayIntensity}%</span>
    </div>` : ''}`;
}

// ============================================================
// SESSION 16 — PATCH renderInventory to add new features
// ============================================================

const _s16_origRenderInventory = typeof renderInventory !== 'undefined' ? renderInventory : null;

if (typeof renderInventory !== 'undefined') {
  const _s16_baseRender = renderInventory;
  renderInventory = function() {
    _s16_baseRender();

    // Inject equipped preview panel if not present
    const bagPanel = document.getElementById('bagPanelItems');
    if (bagPanel) {
      let eqPanel = document.getElementById('eqPreviewPanel');
      if (!eqPanel) {
        eqPanel = document.createElement('div');
        eqPanel.id = 'eqPreviewPanel';
        eqPanel.className = 'eq-preview-panel';
        // Insert before rainAngleControl or at top of items panel
        const rainCtrl = document.getElementById('rainAngleControl');
        if (rainCtrl) {
          bagPanel.insertBefore(eqPanel, rainCtrl);
        } else {
          bagPanel.insertBefore(eqPanel, bagPanel.firstChild);
        }
      }
      renderEquippedPreviewPanel();

      // Inject rain overlay control
      let rainOverlayCtrl = document.getElementById('rainOverlayControl');
      if (!rainOverlayCtrl) {
        rainOverlayCtrl = document.createElement('div');
        rainOverlayCtrl.id = 'rainOverlayControl';
        rainOverlayCtrl.className = 'rain-overlay-control';
        // After equipped panel
        eqPanel.after(rainOverlayCtrl);
      }
      renderRainControlPanel();

      // Inject cursor variant picker (after rain control)
      renderCursorVariantPicker();

      // Inject dim slider
      let dimCtrl = document.getElementById('bgDimControl');
      if (!dimCtrl) {
        dimCtrl = document.createElement('div');
        dimCtrl.id = 'bgDimControl';
        dimCtrl.style.cssText = 'background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:14px';
        dimCtrl.innerHTML = `
          <div style="font-family:'Space Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:var(--accent);margin-bottom:6px">🌑 Background Dim</div>
          <div class="dim-slider-row">
            <label>Dim</label>
            <input type="range" min="0" max="80" value="${bgDimLevel}" oninput="applyBgDim(this.value)">
            <span id="bgDimLabel">${bgDimLevel}%</span>
          </div>`;
        rainOverlayCtrl.after(dimCtrl);
      }

      // Inject sort bar above grid
      const invGrid = document.getElementById('inventoryGrid');
      if (invGrid) {
        let sortBar = document.getElementById('invSortBar');
        if (!sortBar) {
          sortBar = document.createElement('div');
          sortBar.id = 'invSortBar';
          sortBar.className = 'inv-sort-bar';
          sortBar.innerHTML = `
            <span class="inv-sort-label">Sort:</span>
            <button class="inv-sort-btn ${invSortMode==='type'?'active':''}"    onclick="setInvSort('type',this)">Type</button>
            <button class="inv-sort-btn ${invSortMode==='rarity'?'active':''}"  onclick="setInvSort('rarity',this)">Rarity ✦</button>
            <button class="inv-sort-btn ${invSortMode==='newest'?'active':''}"  onclick="setInvSort('newest',this)">Newest</button>
            <button class="inv-sort-btn ${invSortMode==='name'?'active':''}"    onclick="setInvSort('name',this)">A–Z</button>`;
          invGrid.parentNode.insertBefore(sortBar, invGrid);
        } else {
          // Sync active states
          sortBar.querySelectorAll('.inv-sort-btn').forEach(b => {
            b.classList.toggle('active', b.textContent.toLowerCase().startsWith(invSortMode));
          });
        }

        // Apply sorting to existing rendered items — re-render sections
        _s16_applyRarityData();
      }
    }

    // Show cursor in equipped strip
    const eqCursor = document.getElementById('eqCursor');
    if (eqCursor) {
      const curDef = CURSOR_ITEMS.find(c => c.id === equippedCursor);
      eqCursor.textContent = curDef ? curDef.name : 'Default';
    }
  };
}

// Apply rarity data-attribute and dupe badge to rendered inv items
function _s16_applyRarityData() {
  const items = document.querySelectorAll('.bag-inv-item');
  const dupes = _invBuildDupeCounts();
  items.forEach(itemEl => {
    const equipBtn = itemEl.querySelector('.inv-equip-btn');
    if (!equipBtn) return;
    // Try to get item id from onclick
    const onclick = equipBtn.getAttribute('onclick') || '';
    const m = onclick.match(/equipItem\('([^']+)'\)/);
    if (!m) return;
    const itemId = m[1];
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    const rarity = _invGetItemRarity(item);
    itemEl.setAttribute('data-rarity', rarity);

    // Add dupe badge if count > 1
    const count = dupes[itemId];
    if (count && count > 1) {
      let badge = itemEl.querySelector('.inv-dupe-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'inv-dupe-badge';
        const nameEl = itemEl.querySelector('.bag-inv-item-name');
        if (nameEl) nameEl.appendChild(badge);
      }
      badge.textContent = '×' + count;
    }
  });
}

// ============================================================
// SESSION 16 — REVIEW STREAK VISUAL EFFECTS (Phase 6.2)
// ============================================================

function updateStreakVisual() {
  const streakRow = document.getElementById('sbStreakRow');
  if (!streakRow) return;

  const streak = typeof _revDayStreak !== 'undefined' ? _revDayStreak : 0;

  streakRow.classList.remove('streak-active', 'streak-on-fire');

  if (streak >= 30) {
    streakRow.classList.add('streak-on-fire');
  } else if (streak >= 7) {
    streakRow.classList.add('streak-active');
  }
}

// Milestone banners for day streaks
const STREAK_MILESTONES = [7, 14, 30, 60, 100];
const _s16_seenStreakMilestones = new Set(
  JSON.parse(localStorage.getItem('seenStreakMilestones') || '[]')
);

function checkStreakMilestone(streak) {
  for (const ms of STREAK_MILESTONES) {
    if (streak >= ms && !_s16_seenStreakMilestones.has(ms)) {
      _s16_seenStreakMilestones.add(ms);
      localStorage.setItem('seenStreakMilestones', JSON.stringify([..._s16_seenStreakMilestones]));
      _showStreakMilestonePop(ms, streak);
      break;
    }
  }
}

function _showStreakMilestonePop(milestone, streak) {
  const el = document.createElement('div');
  el.className = 'streak-milestone-pop';
  const labels = { 7:'One Week!', 14:'Two Weeks!', 30:'One Month!', 60:'Two Months!', 100:'100 Days!' };
  el.innerHTML = `
    <div class="sm-emoji">🔥</div>
    <div class="sm-title">${streak}-Day Streak — ${labels[milestone] || 'Milestone!'}</div>
    <div class="sm-sub">You've studied ${streak} days in a row. Keep going!</div>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
  if (typeof rewardStudy === 'function') rewardStudy(milestone);
}

// Patch updateSidebarStreak to also update visual
(function() {
  if (typeof updateSidebarStreak !== 'function') return;
  const _base = updateSidebarStreak;
  updateSidebarStreak = function() {
    _base();
    updateStreakVisual();
    const streak = typeof _revDayStreak !== 'undefined' ? _revDayStreak : 0;
    checkStreakMilestone(streak);
  };
})();

// Also call on init
window.addEventListener('load', () => {
  setTimeout(updateStreakVisual, 800);
});

// ============================================================
// SESSION 16 — STREAK FREEZE ITEM (Phase 2.5)
// ============================================================

let streakFreezeCount = parseInt(localStorage.getItem('streakFreezeCount') || '0');

// Add streak freeze to shop pool as a consumable
(function _s16_addStreakFreeze() {
  if (typeof shopPool !== 'undefined') {
    if (!shopPool.find(s => s.id === 'consumable_streak_freeze')) {
      shopPool.push({
        id: 'consumable_streak_freeze',
        name: '❄️ Streak Freeze',
        type: 'consumable',
        data: 'streak_freeze',
        cost: 400,
        rarity: 'rare',
        desc: 'Prevents your study streak from breaking if you miss a day. Stacks up to 3.',
      });
    }
  }
})();

// Patch addToInventory / _shopBuyItem for consumables that stack
const _s16_origShopBuy = typeof _shopBuyItem !== 'undefined' ? _shopBuyItem : null;
if (typeof _shopBuyItem !== 'undefined') {
  const _s16_baseShopBuy = _shopBuyItem;
  _shopBuyItem = function(item) {
    if (item.type === 'consumable' && item.data === 'streak_freeze') {
      if (streakFreezeCount >= 3) {
        rewardPopup('❄️ Max 3 streak freezes!');
        return;
      }
      if (gambleCurrency < item.cost) {
        rewardPopup('Not enough coins! Need ' + item.cost + ' 🎰');
        return;
      }
      gambleCurrency -= item.cost;
      streakFreezeCount++;
      localStorage.setItem('streakFreezeCount', streakFreezeCount);
      updateCurrencies();
      rewardPopup('❄️ Streak Freeze stocked ×' + streakFreezeCount + ' — check Bag!');
      generateShopMain();
      return;
    }
    if (item.type === 'consumable' && item.data === 'vial1') {
      const vialCoinCost = item.coinCost || item.cost || 200;
      if (gambleCurrency < vialCoinCost) {
        rewardPopup('Not enough coins! Need ' + vialCoinCost + ' 🎰');
        return;
      }
      gambleCurrency -= vialCoinCost;
      vialCount++;
      saveVials();
      updateCurrencies();
      rewardPopup('Vial acquired! (' + vialCount + ' total) — use in Bag → Cosmetics');
      generateShopMain();
      return;
    }
    _s16_baseShopBuy(item);
  };
}

// Use a streak freeze when streak would break (hook into revGetDayStreak)
function consumeStreakFreeze() {
  if (streakFreezeCount <= 0) return false;
  streakFreezeCount--;
  localStorage.setItem('streakFreezeCount', streakFreezeCount);
  rewardPopup('❄️ Streak Freeze used! Streak preserved.');
  return true;
}

// Show freeze count in sidebar streak row
function updateStreakFreezeDisplay() {
  const row = document.getElementById('sbStreakRow');
  if (!row) return;
  let freezeEl = document.getElementById('streakFreezeIndicator');
  if (streakFreezeCount > 0) {
    if (!freezeEl) {
      freezeEl = document.createElement('span');
      freezeEl.id = 'streakFreezeIndicator';
      freezeEl.className = 'streak-freeze-active';
      row.appendChild(freezeEl);
    }
    freezeEl.textContent = ' ❄' + streakFreezeCount;
  } else {
    if (freezeEl) freezeEl.remove();
  }
}

window.addEventListener('load', () => {
  setTimeout(updateStreakFreezeDisplay, 900);
});

// ============================================================
// SESSION 16 — BAG: CURSOR + RAIN in TYPE_CONFIG + equipped strip
// ============================================================

// Patch renderInventory TYPE_CONFIG to include cursor/rain/consumable types
(function() {
  // We hook the end of renderInventory by also patching the inner loop
  // The simplest fix: add cat buttons for cursor/rain/consumable in index.html
  // via JS injection on bag open
  const _origSetBagTab = typeof setBagTab !== 'undefined' ? setBagTab : null;
  if (!_origSetBagTab) return;
  const _base = setBagTab;
  setBagTab = function(tab, el) {
    _base(tab, el);
    if (tab === 'items' || tab === 'favs') {
      _s16_injectExtraCatButtons();
      _s16_injectCursorEqChip();
    }
  };
})();

function _s16_injectExtraCatButtons() {
  const catTabs = document.querySelector('.inv-cat-tabs');
  if (!catTabs) return;
  const types = ['cursor','rain','consumable'];
  const labels = { cursor: '🖱️ Cursor', rain: '🌧️ Rain', consumable: '🧪 Items' };
  types.forEach(t => {
    if (!catTabs.querySelector(`[data-type="${t}"]`)) {
      const btn = document.createElement('button');
      btn.className = 'inv-cat-btn';
      btn.setAttribute('data-type', t);
      btn.textContent = labels[t] || t;
      btn.onclick = function() { filterInvCat(t, this); };
      catTabs.appendChild(btn);
    }
  });
}

function _s16_injectCursorEqChip() {
  const strip = document.getElementById('bagEquippedStrip');
  if (!strip) return;
  if (!strip.querySelector('#eqCursorChip')) {
    const chip = document.createElement('div');
    chip.className = 'bag-eq-chip';
    chip.id = 'eqCursorChip';
    chip.innerHTML = `<span class="bag-eq-chip-label">Cursor</span><span class="bag-eq-chip-val" id="eqCursor">${equippedCursor && equippedCursor !== 'none' ? equippedCursor : 'Default'}</span>`;
    strip.appendChild(chip);
  }
}

// ============================================================
// SESSION 16 — UPDATE TYPE_CONFIG in renderInventory
// Ensure cursor/rain/consumable items display correctly
// ============================================================
// This runs after renderInventory and patches unlabeled sections
(function() {
  const _base = typeof renderInventory !== 'undefined' ? renderInventory : null;
  if (!_base) return;
  const _outer = renderInventory;
  renderInventory = function() {
    _outer();
    // Fix any sections that have unknown type labels
    document.querySelectorAll('.inv-section-header').forEach(hdr => {
      const txt = hdr.firstChild ? hdr.firstChild.textContent.trim() : '';
      if (txt === 'cursor') hdr.firstChild.textContent = '🖱️ Cursors';
      if (txt === 'rain')   hdr.firstChild.textContent = '🌧️ Rain Overlays';
      if (txt === 'consumable') hdr.firstChild.textContent = '🧪 Consumables';
    });
  };
})();

// ============================================================
// TRACE IMPROVEMENTS — In-canvas flash sequence, toggles, grading, restart
// ============================================================

// Which info items flash inside the canvas square
const traceInfoShow = { meaning: true, hiragana: true, romaji: true, flash: true };

function traceToggleInfo(key, el) {
  traceInfoShow[key] = !traceInfoShow[key];
  el.classList.toggle('active', traceInfoShow[key]);
  // Update Flash ON/OFF label
  if (key === 'flash') el.textContent = traceInfoShow.flash ? 'Flash ON' : 'Flash OFF';
}

// ── In-canvas flash sequence ──────────────────────────────────
// Plays meaning → hiragana → romaji inside the canvas square,
// each for ~1 second. Blurs the kanji char in the info bar above
// while running so your eye stays on the square.

let _traceFlashSeqTimer = null;

function tracePlayCanvasFlash(kanji, onDone) {
  const panel     = document.getElementById('traceCanvasFlash');
  const labelEl   = document.getElementById('traceCanvasFlashLabel');
  const textEl    = document.getElementById('traceCanvasFlashText');
  const kanjiChar = document.getElementById('traceKanjiChar');

  if (!panel || !traceInfoShow.flash) { onDone && onDone(); return; }

  // Build the sequence of frames based on toggle state
  const frames = [];
  if (traceInfoShow.meaning  && kanji.meaning) frames.push({ label: 'MEANING',  text: kanji.meaning,       color: 'var(--accent)'  });
  if (traceInfoShow.hiragana && kanji.kun)     frames.push({ label: 'HIRAGANA', text: kanji.kun,            color: 'var(--accent2)' });
  if (traceInfoShow.romaji   && kanji.kun)     frames.push({ label: 'SOUND',    text: _kanaToRomaji(kanji), color: 'var(--warn)'    });

  if (!frames.length) { onDone && onDone(); return; }

  // Blur the kanji char above so eye focuses on canvas
  if (kanjiChar) kanjiChar.style.filter = 'blur(6px)';
  panel.style.display = 'flex';

  let i = 0;
  const FRAME_MS = 1050;

  function showFrame() {
    if (i >= frames.length) {
      // Done — hide panel, unblur
      panel.style.display = 'none';
      if (kanjiChar) kanjiChar.style.filter = '';
      onDone && onDone();
      return;
    }
    const f = frames[i++];
    labelEl.textContent = f.label;
    labelEl.style.color = f.color;
    textEl.textContent  = f.text;
    textEl.style.color  = f.color;
    // Fade in
    panel.style.opacity = '0';
    panel.style.transition = 'opacity .12s ease';
    requestAnimationFrame(() => { panel.style.opacity = '1'; });
    _traceFlashSeqTimer = setTimeout(showFrame, FRAME_MS);
  }

  if (_traceFlashSeqTimer) clearTimeout(_traceFlashSeqTimer);
  showFrame();
}

// Helper: derive a simple romaji display from kun reading (strip kanji, use hiragana as-is)
function _kanaToRomaji(kanji) {
  // Use the existing romaji from kanji DB if present, otherwise derive from kun
  if (kanji.romaji) return kanji.romaji;
  // Map hiragana to romaji using APP_HIRAGANA lookup
  const src = kanji.kun || '';
  const pool = APP_HIRAGANA || [];
  const map  = {};
  pool.forEach(k => { map[k.kana] = k.romaji; });
  // Also add kana combos
  (APP_KANA_COMBOS || []).forEach(k => { map[k.kana] = k.romaji; });
  // Walk string, try 2-char combos first then single
  let out = '', pos = 0;
  while (pos < src.length) {
    const two = src.slice(pos, pos + 2);
    if (map[two]) { out += map[two]; pos += 2; }
    else if (map[src[pos]]) { out += map[src[pos]]; pos++; }
    else { out += src[pos]; pos++; }
  }
  return out || src;
}

// Patch traceRenderCard to play flash at start of each new kanji
const _origTraceRenderCard = traceRenderCard;
traceRenderCard = function() {
  if (!tracePool || tracePool.length === 0) { _origTraceRenderCard(); return; }
  if (traceIdx >= tracePool.length) { traceShowEnd(); return; }
  const kanji = tracePool[traceIdx];

  // Hide grading row & session end
  const gradeRow = document.getElementById('traceGradeRow');
  if (gradeRow) gradeRow.style.display = 'none';
  const endEl = document.getElementById('traceSessionEnd');
  if (endEl) endEl.classList.add('hidden');

  // Render card first (sets up guide char, readings etc)
  _origTraceRenderCard();

  // Then play flash sequence inside the canvas square
  tracePlayCanvasFlash(kanji, () => {
    // Nothing extra needed — canvas is ready to draw on
  });
};

// Patch traceNextStage to flash before showing next stage
const _origTraceNextStage = traceNextStage;
traceNextStage = function() {
  if (!tracePool || traceIdx >= tracePool.length) return;
  if (traceStage >= 2) return;
  const kanji = tracePool[traceIdx];
  traceStage++;
  traceUpdateStageUI();
  traceClearCanvas();
  // Play flash again with next stage's reduced info
  tracePlayCanvasFlash(kanji, () => {});
};

// Show SRS grading row after Got It, advance on grade selection
function traceGrade(grade) {
  const gradeRow = document.getElementById('traceGradeRow');
  if (gradeRow) gradeRow.style.display = 'none';
  const kanji = tracePool && tracePool[traceIdx - 1];
  if (kanji && typeof dsUpdateSRS === 'function') {
    try { dsUpdateSRS('trace_' + kanji.id, grade); } catch(e) {}
  }
  traceRenderCard();
}

// Patch traceGotIt to show grading row before advancing
const _baseTraceGotIt = traceGotIt;
traceGotIt = function() {
  const gradeRow = document.getElementById('traceGradeRow');
  const kanji = tracePool && tracePool[traceIdx];
  if (!kanji) { _baseTraceGotIt(); return; }
  // Rewards & vault
  traceGotItCnt++;
  const vault = JSON.parse(localStorage.getItem('learnedVault') || '[]');
  if (!vault.some(v => v.term === kanji.char && v.type === 'trace')) {
    vault.push({ id: 'tr_' + kanji.id, type: 'trace', term: kanji.char, reading: kanji.kun, meaning: kanji.meaning, dateAdded: Date.now(), source: 'trace' });
    localStorage.setItem('learnedVault', JSON.stringify(vault));
  }
  if (typeof rewardStudy === 'function') rewardStudy(2);
  if (typeof rewardPopup === 'function') rewardPopup('✓ ' + kanji.char + ' mastered! +2 <img src='https://pub-aa6bdcd20c8a4f75bf3984b6b5f04a96.r2.dev/icons/moon_tear.png' style='width:14px;height:14px;vertical-align:-2px;image-rendering:pixelated' alt=''>');
  traceIdx++;
  // Stats update
  const el = document.getElementById('traceGotIt');
  if (el) el.textContent = traceGotItCnt;
  const total = traceGotItCnt + traceTryAgainCnt;
  const prog = document.getElementById('traceProgress');
  if (prog) prog.textContent = total > 0 ? Math.round(traceGotItCnt / total * 100) + '%' : '—';
  // Show grading row
  if (gradeRow) gradeRow.style.display = 'block';
  else traceRenderCard();
};

// Restart from beginning (no shuffle — card 1 first)
function traceRestartFromBeginning() {
  const db = APP_KANJI_DB || (typeof KANJI_DB !== 'undefined' ? KANJI_DB : []);
  tracePool = [...(traceFilter === 'n5' ? db.filter(k => k.jlpt === 'n5') : db)];
  traceIdx = 0; traceGotItCnt = 0; traceTryAgainCnt = 0; traceStage = 0;
  const endEl = document.getElementById('traceSessionEnd');
  if (endEl) endEl.classList.add('hidden');
  traceRenderCard();
}


// ============================================================
// KANA READING MODE
// Shows a blob of kana for X seconds → type romaji
// ============================================================

let kanaReadingSize  = 5;   // number of kana chars in blob
let kanaReadingSecs  = 4;   // seconds to show
let kanaReadingPool  = [];  // current blob items
let kanaReadingCorrectCnt = 0;
let kanaReadingWrongCnt   = 0;
let kanaReadingRoundCnt   = 0;
let _kanaReadingTimer     = null;
let _kanaReadingExpected  = '';

function setKanaReadingSize(n, el) {
  kanaReadingSize = n;
  document.querySelectorAll('#kanaReadingSettings .unit-btn[id^="kanaReadingSize"]').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
}

function setKanaReadingSec(n, el) {
  kanaReadingSecs = n;
  document.querySelectorAll('#kanaReadingSettings .unit-btn[id^="kanaReadingSec"]').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
}

function _getKanaReadingPool() {
  const script = (typeof kanaScript !== 'undefined') ? kanaScript : 'hiragana';
  let base = [];
  if (script === 'hiragana' || script === 'mixed')
    base = base.concat(APP_HIRAGANA || (typeof HIRAGANA !== 'undefined' ? HIRAGANA : []));
  if (script === 'katakana' || script === 'mixed')
    base = base.concat(APP_KATAKANA || (typeof KATAKANA !== 'undefined' ? KATAKANA : []));
  if (!base.length) base = APP_HIRAGANA || [];
  // Apply difficulty filter same as main kana mode
  const diff = (typeof kanaDiff !== 'undefined') ? kanaDiff : 'easy';
  if (diff === 'easy')   base = base.filter(k => !k.voiced && !k.combo);
  else if (diff === 'medium') base = base.filter(k => !k.combo);
  return base.length ? base : (APP_HIRAGANA || []);
}

function kanaReadingStartSession() {
  kanaReadingCorrectCnt = 0;
  kanaReadingWrongCnt   = 0;
  kanaReadingRoundCnt   = 0;
  _updateKanaReadingStats();
  document.getElementById('kanaReadingSessionEnd').classList.add('hidden');
  document.getElementById('kanaReadingFeedback').style.display = 'none';
  document.getElementById('kanaReadingTypePhase').classList.add('hidden');
  document.getElementById('kanaReadingShowPhase').classList.remove('hidden');
  kanaReadingNextBlob();
}

function kanaReadingNextBlob() {
  const pool = _getKanaReadingPool();
  if (!pool.length) return;
  // Pick `kanaReadingSize` random kana
  const picks = [];
  for (let i = 0; i < kanaReadingSize; i++) {
    picks.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  kanaReadingPool = picks;
  _kanaReadingExpected = picks.map(k => k.romaji).join('');

  // Render blob
  const blobEl = document.getElementById('kanaReadingBlob');
  const replayEl = document.getElementById('kanaReadingBlobReplay');
  const kanaStr = picks.map(k => `<span style="display:inline-block">${k.kana}</span>`).join('');
  if (blobEl)    blobEl.innerHTML = kanaStr;
  if (replayEl)  replayEl.innerHTML = kanaStr;

  const countEl = document.getElementById('kanaReadingBlobCount');
  if (countEl) countEl.textContent = kanaReadingSize + ' character' + (kanaReadingSize > 1 ? 's' : '') + ' · ' + kanaReadingSecs + 's';

  // Show phase
  document.getElementById('kanaReadingShowPhase').classList.remove('hidden');
  document.getElementById('kanaReadingTypePhase').classList.add('hidden');
  document.getElementById('kanaReadingFeedback').style.display = 'none';

  // Animate timer bar
  const bar = document.getElementById('kanaReadingTimerBar');
  if (bar) {
    bar.style.transition = 'none';
    bar.style.width = '100%';
    requestAnimationFrame(() => {
      bar.style.transition = `width ${kanaReadingSecs}s linear`;
      bar.style.width = '0%';
    });
  }

  if (_kanaReadingTimer) clearTimeout(_kanaReadingTimer);
  _kanaReadingTimer = setTimeout(() => {
    // Switch to type phase
    document.getElementById('kanaReadingShowPhase').classList.add('hidden');
    document.getElementById('kanaReadingTypePhase').classList.remove('hidden');
    const input = document.getElementById('kanaReadingInput');
    if (input) { input.value = ''; input.focus(); }
  }, kanaReadingSecs * 1000);
}

function kanaReadingSubmit() {
  if (_kanaReadingTimer) { clearTimeout(_kanaReadingTimer); _kanaReadingTimer = null; }
  const input = document.getElementById('kanaReadingInput');
  const raw   = (input ? input.value : '').trim().toLowerCase().replace(/\s+/g, '');
  const expected = _kanaReadingExpected.toLowerCase();

  // Accept answer: compare char by char, allow partial matches and alternative spellings
  // Build per-char expected array
  const charExpected = kanaReadingPool.map(k => k.romaji.toLowerCase());
  const answer = raw;

  // Simple match: concatenated equals expected
  const isCorrect = answer === expected;

  // Also try with spaces stripped from a typed version like "ka mi tsu"
  const feedbackEl = document.getElementById('kanaReadingFeedback');
  const feedbackLabel = document.getElementById('kanaReadingFeedbackLabel');
  const feedbackText  = document.getElementById('kanaReadingFeedbackText');
  const feedbackExp   = document.getElementById('kanaReadingFeedbackExpected');

  kanaReadingRoundCnt++;
  if (isCorrect) {
    kanaReadingCorrectCnt++;
    feedbackLabel.textContent = '✓ CORRECT!';
    feedbackLabel.style.color = 'var(--correct)';
    feedbackEl.style.borderColor = 'var(--correct)';
    feedbackText.innerHTML = `<span style="font-size:18px">${kanaReadingPool.map(k=>k.kana).join('')}</span> = <strong>${expected}</strong>`;
    feedbackExp.textContent = '';
  } else {
    kanaReadingWrongCnt++;
    feedbackLabel.textContent = '✗ NOT QUITE';
    feedbackLabel.style.color = 'var(--wrong)';
    feedbackEl.style.borderColor = 'var(--wrong)';
    feedbackText.innerHTML = `You typed: <strong>${raw || '(empty)'}</strong>`;
    // Show char by char breakdown
    const breakdown = kanaReadingPool.map(k => `${k.kana}=${k.romaji}`).join(' · ');
    feedbackExp.textContent = 'Expected: ' + expected + '   (' + breakdown + ')';
  }
  feedbackEl.style.display = 'block';
  _updateKanaReadingStats();

  // End session after 10 rounds
  if (kanaReadingRoundCnt >= 10) {
    const nextBtn = feedbackEl.querySelector('button');
    if (nextBtn) nextBtn.onclick = kanaReadingEndSession;
  }
}

function kanaReadingSkip() {
  if (_kanaReadingTimer) { clearTimeout(_kanaReadingTimer); _kanaReadingTimer = null; }
  kanaReadingWrongCnt++;
  kanaReadingRoundCnt++;
  _updateKanaReadingStats();
  kanaReadingNextBlob();
}

function kanaReadingNext() {
  document.getElementById('kanaReadingFeedback').style.display = 'none';
  if (kanaReadingRoundCnt >= 10) {
    kanaReadingEndSession();
    return;
  }
  kanaReadingNextBlob();
}

function kanaReadingEndSession() {
  if (_kanaReadingTimer) { clearTimeout(_kanaReadingTimer); _kanaReadingTimer = null; }
  const endEl  = document.getElementById('kanaReadingSessionEnd');
  const pct    = kanaReadingRoundCnt > 0 ? Math.round(kanaReadingCorrectCnt / kanaReadingRoundCnt * 100) : 0;
  document.getElementById('kanaReadingEndEmoji').textContent = pct >= 70 ? '🏆' : '💪';
  document.getElementById('kanaReadingEndTitle').textContent = pct >= 70 ? 'Nice reading!' : 'Keep practising!';
  document.getElementById('kanaReadingEndSub').textContent   = kanaReadingCorrectCnt + ' correct · ' + kanaReadingWrongCnt + ' wrong · ' + pct + '%';
  document.getElementById('kanaReadingTypePhase').classList.add('hidden');
  document.getElementById('kanaReadingShowPhase').classList.add('hidden');
  endEl.classList.remove('hidden');
}

function _updateKanaReadingStats() {
  const c = document.getElementById('kanaReadingCorrect');
  const w = document.getElementById('kanaReadingWrong');
  const r = document.getElementById('kanaReadingRound');
  if (c) c.textContent = kanaReadingCorrectCnt;
  if (w) w.textContent = kanaReadingWrongCnt;
  if (r) r.textContent = kanaReadingRoundCnt;
}

// Hook into setKanaMode to handle reading mode
const _origSetKanaModeForReading = setKanaMode;
setKanaMode = function(mode, el) {
  // Toggle reading settings panel
  const readingSettings = document.getElementById('kanaReadingSettings');
  if (readingSettings) readingSettings.style.display = mode === 'reading' ? 'block' : 'none';

  if (mode === 'reading') {
    // Show reading game area, hide normal game area + start screen
    const startScreen = document.getElementById('kanaStartScreen');
    const gameArea    = document.getElementById('kanaGameArea');
    const readingArea = document.getElementById('kanaReadingGameArea');
    if (startScreen) startScreen.classList.add('hidden');
    if (gameArea)    gameArea.classList.add('hidden');
    if (readingArea) readingArea.classList.remove('hidden');
    // Update side panel active pill
    const kanaPanelSide = document.getElementById('kanaPanelSide');
    if (kanaPanelSide) {
      kanaPanelSide.querySelectorAll('.panel-pill').forEach(b => b.classList.remove('active'));
      if (el) el.classList.add('active');
    }
    kanaReadingStartSession();
    return;
  }

  // For non-reading modes, hide reading area
  const readingArea = document.getElementById('kanaReadingGameArea');
  if (readingArea) readingArea.classList.add('hidden');
  _origSetKanaModeForReading(mode, el);
};


// ============================================================
// FIX 1: Dynamic text sizing for dsQuestion (text doesn't fit box)
// ============================================================
(function() {
  function fitDsQuestion() {
    const el = document.getElementById('dsQuestion');
    if (!el) return;
    const text = el.textContent || '';
    // Kanji/kana single chars get huge treatment; long text scales down
    const isChar = /^[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]{1,3}$/.test(text.trim());
    if (isChar) {
      el.style.fontSize = text.length === 1 ? '3.5rem' : '2.4rem';
      el.style.lineHeight = '1.1';
      el.style.wordBreak = 'normal';
    } else {
      // Scale: short → 1.1rem, medium → 0.95rem, long → 0.82rem
      const len = text.length;
      const size = len < 40 ? '1.1rem' : len < 100 ? '0.95rem' : '0.82rem';
      el.style.fontSize = size;
      el.style.lineHeight = '1.55';
      el.style.wordBreak = 'break-word';
    }
  }

  // Patch dsRenderCard to call fit after setting textContent
  const _fitOrigDs = window.dsRenderCard;
  if (typeof _fitOrigDs === 'function') {
    window.dsRenderCard = function() {
      _fitOrigDs.apply(this, arguments);
      requestAnimationFrame(fitDsQuestion);
    };
  }
  // Also observe mutations in case something else sets dsQuestion
  const obs = new MutationObserver(fitDsQuestion);
  function watchDsQ() {
    const el = document.getElementById('dsQuestion');
    if (el) obs.observe(el, { childList: true, characterData: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchDsQ);
  else watchDsQ();
})();

// ============================================================
// FIX 2: Kana reading — replace ghost blob with reveal button
// ============================================================
(function() {
  function patchKanaReplayBlob() {
    const blob = document.getElementById('kanaReadingBlobReplay');
    if (!blob) return;
    // Hide it by default; we inject a reveal button next to it
    blob.style.display = 'none';

    // Inject reveal button after the blob if not already done
    if (document.getElementById('kanaReadingRevealBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'kanaReadingRevealBtn';
    btn.className = 'btn btn-secondary';
    btn.style.cssText = 'width:100%;margin-bottom:12px;font-size:13px;padding:9px 14px;';
    btn.innerHTML = '👁 Reveal kana';
    let revealed = false;
    btn.onclick = function() {
      if (!revealed) {
        blob.style.display = 'flex';
        blob.style.opacity = '1';
        btn.innerHTML = '🙈 Hide kana';
        revealed = true;
      } else {
        blob.style.display = 'none';
        btn.innerHTML = '👁 Reveal kana';
        revealed = false;
      }
    };
    blob.parentNode.insertBefore(btn, blob);

    // Reset reveal state whenever a new round starts
    const _origRound = window.kanaReadingNextRound || window._kanaReadingNewRound;
    function resetReveal() {
      revealed = false;
      blob.style.display = 'none';
      btn.innerHTML = '👁 Reveal kana';
    }
    // Patch kanaReadingRound (called each new question)
    const _origKRR = window.kanaReadingNextBlob;
    if (typeof _origKRR === 'function') {
      window.kanaReadingNextBlob = function() {
        resetReveal();
        return _origKRR.apply(this, arguments);
      };
    }
    // Also reset on Next button click — observe typePhase becoming visible
    const typePhase = document.getElementById('kanaReadingTypePhase');
    if (typePhase) {
      new MutationObserver(function(muts) {
        for (const m of muts) {
          if (!typePhase.classList.contains('hidden')) {
            resetReveal();
            break;
          }
        }
      }).observe(typePhase, { attributes: true, attributeFilter: ['class'] });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patchKanaReplayBlob);
  else patchKanaReplayBlob();
})();

// ============================================================
// FIX 3: Trace study phase — wire up missing functions
// ============================================================
(function() {
  // State
  let _traceAutoSecs  = 5;   // default 5s
  let _traceAutoTimer = null;
  let _traceStudyInfo = { meaning: true, hiragana: true, romaji: true, reading: true };

  // Update study ring animation (SVG countdown)
  function _traceStudyRingStart(secs) {
    const ring = document.getElementById('traceStudyRingFill');
    if (!ring) return;
    const circ = 301.6;
    ring.style.transition = 'none';
    ring.style.strokeDashoffset = '0';
    if (secs <= 0) return;
    requestAnimationFrame(() => {
      ring.style.transition = `stroke-dashoffset ${secs}s linear`;
      ring.style.strokeDashoffset = String(circ);
    });
  }
  function _traceStudyRingStop() {
    const ring = document.getElementById('traceStudyRingFill');
    if (!ring) return;
    ring.style.transition = 'none';
    ring.style.strokeDashoffset = '0';
  }

  // Show study phase for current kanji
  function _traceShowStudyPhase() {
    if (!tracePool || traceIdx >= tracePool.length) return;
    const kanji = tracePool[traceIdx];

    // Populate study card
    const charEl  = document.getElementById('traceStudyChar');
    const meanEl  = document.getElementById('traceStudyMeaning');
    const hiraEl  = document.getElementById('traceStudyHiragana');
    const romEl   = document.getElementById('traceStudyRomaji');
    const readEl  = document.getElementById('traceStudyReading');
    if (charEl)  charEl.textContent  = kanji.char || '';
    if (meanEl)  { meanEl.textContent = kanji.meaning || ''; meanEl.style.display = _traceStudyInfo.meaning  ? '' : 'none'; }
    if (hiraEl)  { hiraEl.textContent = kanji.kun || '';     hiraEl.style.display = _traceStudyInfo.hiragana ? '' : 'none'; }
    if (romEl)   {
      romEl.textContent = (typeof _kanaToRomaji === 'function') ? _kanaToRomaji(kanji) : (kanji.romaji || kanji.kun || '');
      romEl.style.display = _traceStudyInfo.romaji ? '' : 'none';
    }
    if (readEl)  {
      readEl.textContent = 'On: ' + (kanji.on || '—') + '  Kun: ' + (kanji.kun || '—');
      readEl.style.display = _traceStudyInfo.reading ? '' : 'none';
    }

    // Show/hide phases
    const studyEl = document.getElementById('traceStudyPhase');
    const drawEl  = document.getElementById('traceDrawPhase');
    if (studyEl) studyEl.style.display = '';
    if (drawEl)  drawEl.classList.add('hidden');

    // Reset compare row
    const comp = document.getElementById('traceCompareRow');
    if (comp) comp.style.display = 'none';

    // Auto-advance
    if (_traceAutoTimer) { clearTimeout(_traceAutoTimer); _traceAutoTimer = null; }
    if (_traceAutoSecs > 0) {
      _traceStudyRingStart(_traceAutoSecs);
      _traceAutoTimer = setTimeout(traceBeginDraw, _traceAutoSecs * 1000);
    } else {
      _traceStudyRingStop();
    }
  }

  // Public: user clicks "I'm Ready" — go to draw phase
  window.traceBeginDraw = function() {
    if (_traceAutoTimer) { clearTimeout(_traceAutoTimer); _traceAutoTimer = null; }
    _traceStudyRingStop();

    const kanji = tracePool && tracePool[traceIdx];
    if (!kanji) return;

    // Populate hints in draw phase
    const hintM = document.getElementById('traceHintMeaning');
    const hintH = document.getElementById('traceHintHiragana');
    const hintR = document.getElementById('traceHintRomaji');
    const guideChar = document.getElementById('traceGuideChar');
    if (hintM) { hintM.textContent = _traceStudyInfo.meaning  ? (kanji.meaning || '') : ''; }
    if (hintH) { hintH.textContent = _traceStudyInfo.hiragana ? (kanji.kun || '') : ''; }
    if (hintR) {
      hintR.textContent = _traceStudyInfo.romaji
        ? ((typeof _kanaToRomaji === 'function') ? _kanaToRomaji(kanji) : (kanji.romaji || ''))
        : '';
    }
    if (guideChar) guideChar.textContent = kanji.char || '';

    // Switch phases
    const studyEl = document.getElementById('traceStudyPhase');
    const drawEl  = document.getElementById('traceDrawPhase');
    if (studyEl) studyEl.style.display = 'none';
    if (drawEl)  drawEl.classList.remove('hidden');

    // Reset stage + canvas
    traceStage = 0;
    if (typeof traceUpdateStageUI === 'function') traceUpdateStageUI();
    if (typeof traceClearCanvas   === 'function') traceClearCanvas();

    // Init canvas drawing if not done
    if (!traceCtx) {
      const canvas = document.getElementById('traceCanvas');
      if (canvas) {
        traceCtx = canvas.getContext('2d');
        _traceInitCanvasEvents(canvas);
      }
    }
  };

  // Public: skip study, go straight to draw
  window.traceSkipStudy = function() {
    if (_traceAutoTimer) { clearTimeout(_traceAutoTimer); _traceAutoTimer = null; }
    _traceStudyRingStop();
    traceBeginDraw();
  };

  // Public: set auto-advance time
  window.setTraceAutoTime = function(secs, el) {
    _traceAutoSecs = secs;
    document.querySelectorAll('#traceStudyPhase .unit-btn[id^="traceAuto"]').forEach(b => b.classList.remove('active'));
    if (el) el.classList.add('active');
    // Restart ring if study phase visible
    const studyEl = document.getElementById('traceStudyPhase');
    if (studyEl && studyEl.style.display !== 'none') {
      if (_traceAutoTimer) { clearTimeout(_traceAutoTimer); _traceAutoTimer = null; }
      if (secs > 0) {
        _traceStudyRingStart(secs);
        _traceAutoTimer = setTimeout(traceBeginDraw, secs * 1000);
      } else {
        _traceStudyRingStop();
      }
    }
  };

  // Public: toggle study info visibility
  window.traceToggleStudyInfo = function(key, el) {
    _traceStudyInfo[key] = !_traceStudyInfo[key];
    if (el) el.classList.toggle('active', _traceStudyInfo[key]);
    // Re-apply to currently shown study card
    _traceShowStudyPhase();
  };

  // Canvas touch/mouse drawing
  function _traceInitCanvasEvents(canvas) {
    let drawing = false;
    function pos(e) {
      const r = canvas.getBoundingClientRect();
      const t = e.touches ? e.touches[0] : e;
      return [(t.clientX - r.left) * (canvas.width / r.width), (t.clientY - r.top) * (canvas.height / r.height)];
    }
    function start(e) {
      drawing = true;
      const [x, y] = pos(e);
      traceCtx.beginPath();
      traceCtx.moveTo(x, y);
      traceLastX = x; traceLastY = y;
      e.preventDefault();
    }
    function move(e) {
      if (!drawing) return;
      const [x, y] = pos(e);
      traceCtx.lineWidth   = 3;
      traceCtx.lineCap     = 'round';
      traceCtx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#fff';
      traceCtx.lineTo(x, y);
      traceCtx.stroke();
      traceCtx.beginPath();
      traceCtx.moveTo(x, y);
      traceLastX = x; traceLastY = y;
      e.preventDefault();
    }
    function end() { drawing = false; }
    canvas.addEventListener('mousedown',  start);
    canvas.addEventListener('mousemove',  move);
    canvas.addEventListener('mouseup',    end);
    canvas.addEventListener('mouseleave', end);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove',  move,  { passive: false });
    canvas.addEventListener('touchend',   end);
  }

  // Patch traceRenderCard: go to study phase (not straight to draw)
  // We need to intercept so every new card shows study first
  const _origTRC2 = window.traceRenderCard;
  window.traceRenderCard = function() {
    if (!tracePool || tracePool.length === 0) { if(_origTRC2) _origTRC2(); return; }
    if (traceIdx >= tracePool.length) { if (typeof traceShowEnd === 'function') traceShowEnd(); return; }
    const kanji = tracePool[traceIdx];
    traceStage = 0;

    // Update dot map + stats (replicate what original did)
    const dotMap = document.getElementById('traceDotMap');
    if (dotMap) {
      dotMap.innerHTML = tracePool.slice(0, Math.min(40, tracePool.length)).map((k, i) => {
        let cls = 'dot'; if (i === traceIdx) cls += ' current';
        return `<div class="${cls}" title="${k.char}"></div>`;
      }).join('');
    }
    const total = traceGotItCnt + traceTryAgainCnt;
    const gotEl = document.getElementById('traceGotIt');
    const tryEl = document.getElementById('traceTryAgain');
    const progEl = document.getElementById('traceProgress');
    if (gotEl)  gotEl.textContent  = traceGotItCnt;
    if (tryEl)  tryEl.textContent  = traceTryAgainCnt;
    if (progEl) progEl.textContent = total > 0 ? Math.round(traceGotItCnt / total * 100) + '%' : '—';

    const endEl = document.getElementById('traceSessionEnd');
    if (endEl) endEl.classList.add('hidden');

    const gradeRow = document.getElementById('traceGradeRow') || document.getElementById('traceCompareRow');
    if (gradeRow) gradeRow.style.display = 'none';

    // Show study phase for this kanji
    _traceShowStudyPhase();
  };

  // Patch traceGotIt (the patched version) to show compare row in draw phase
  // and populate the compare char before showing grades
  const _priorGotIt = window.traceGotIt;
  window.traceGotIt = function() {
    const kanji = tracePool && tracePool[traceIdx];
    // Show compare row
    const comp = document.getElementById('traceCompareRow');
    const compChar = document.getElementById('traceCompareChar');
    const compInfo = document.getElementById('traceCompareInfo');
    if (compChar && kanji) compChar.textContent = kanji.char || '';
    if (compInfo && kanji) compInfo.innerHTML =
      '<span style="color:var(--accent)">' + (kanji.meaning || '') + '</span>' +
      (kanji.kun ? ' · <span style="color:var(--accent2)">' + kanji.kun + '</span>' : '') +
      (kanji.on  ? ' · On: <span style="color:var(--warn)">'  + kanji.on  + '</span>' : '');
    // Call chain
    if (typeof _priorGotIt === 'function') _priorGotIt();
    // Show comp row after (gotIt may hide it)
    if (comp) comp.style.display = 'block';
  };

})();
