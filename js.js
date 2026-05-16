
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

// ─── DEEP STUDY UNIT DEFINITIONS (repurposed) ────────────────
// These replace the APES unit names in the Deep Study (SM-2) engine.
// The engine itself (dsQueue, SM-2 scheduling) is unchanged.
// TODO: Wire DS unit cards to FLASHCARDS filtered by unit tag
const DS_UNITS = [
  { id:'hiragana', name:'Hiragana',       icon:'あ', desc:'All 46 hiragana characters' },
  { id:'katakana', name:'Katakana',       icon:'ア', desc:'All 46 katakana characters' },
  { id:'n5',       name:'JLPT N5 Kanji', icon:'漢', desc:'~100 essential kanji for N5' },
  { id:'n4',       name:'JLPT N4 Kanji', icon:'字', desc:'~300 kanji for N4 level' },
  { id:'ep1',      name:'Episode 1 Vocab',icon:'📺', desc:'Vocabulary from Episode 1' },
  { id:'ep2',      name:'Episode 2 Vocab',icon:'📺', desc:'Vocabulary from Episode 2' },
  { id:'ep3',      name:'Episode 3 Vocab',icon:'📺', desc:'Vocabulary from Episode 3' },
  { id:'custom',   name:'Custom Set',    icon:'⭐', desc:'Items you've added manually' },
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
  fcPool = shuffle(getFilteredWithPacks(FLASHCARDS, 'flashcards'));
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
  else { fcMissed.add(fcIdx); fcKnown.delete(fcIdx); session.fcMiss++; }
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
  const bank = cyc2Tab === 'fill' ? FILL_BANK : SEQ_BANK;
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
  const fillFiltered = getFilteredCyc([...FILL_BANK]);
  const seqFiltered = getFilteredCyc([...SEQ_BANK]);
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
  mcqPool = shuffle(getFilteredWithPacks(MCQ, 'mcq'));
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
  const correct = choice===mcqPool[mcqIdx].ans;
  if(correct){ mcqScore.c++; session.mcqC++; rewardStudy(1); }
  else { mcqScore.w++; session.mcqW++; }
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
    const uQ = MCQ.filter(q => q.unit === u);
    const uF = FLASHCARDS.filter(f => f.unit === u);
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
  studyCurrency = 0;
  gambleCurrency = 0;
  playerTitle = 'wanderer';
  inventory = [];
  ownedPacks = [];
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
  studyCurrency += 500;
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

  updateCurrencies();
  renderInventory();
  rewardPopup('🎁 Everything unlocked! +500 🎟️ +500 💰');
}

// ============================================================
// INIT - called after all systems loaded (see bottom of script)
// ============================================================



// ============================================================
// GAMIFICATION SYSTEM
// ============================================================

let studyCurrency = parseInt(localStorage.getItem('studyCurrency') || '0');
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
      { unit:'n5', diff:'medium', q:'力 (chikara)', a:'Reading: ちから (chikara) / リョク (ryoku)\nMeaning: Power, strength\nEx: 力を信じる (chikara o shinjiru) — to believe in one's power' },
      { unit:'n5', diff:'easy', q:'仲間 (nakama)', a:'Reading: なかま (nakama)\nMeaning: Comrade, companion, teammate\nEx: 仲間を守る (nakama o mamoru) — to protect one's companions' },
      // TODO: Add more Naruto-themed vocab (20+ cards)
    ],
    mcq: [
      { unit:'n5', diff:'easy', q:'What does 火 mean in "火の国" (Land of Fire)?', opts:['Water','Fire','Wind','Earth'], ans:1, exp:'火 (hi/ka) means fire. 火の国 (hi no kuni) = Land of Fire, home of the Hidden Leaf Village (木の葉隠れの里).' },
      { unit:'n5', diff:'easy', q:'How do you read 忍者?', opts:['かぜ','にんじゃ','みず','ちから'], ans:1, exp:'忍者 is read にんじゃ (ninja). 忍 (nin) = endure/conceal, 者 (ja/sha) = person.' },
      { unit:'n5', diff:'medium', q:'Which kanji means "companion / teammate" (as Naruto uses constantly)?', opts:['力','火','仲間','水'], ans:2, exp:'仲間 (nakama) means companion or teammate. Naruto's bonds with his nakama (仲間) are a core theme of the series.' },
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
      { unit:'n5', diff:'easy', q:'家族 (kazoku)', a:'Reading: かぞく (kazoku)\nMeaning: Family\nEx: 家族を守る (kazoku o mamoru) — to protect one's family' },
      { unit:'n4', diff:'medium', q:'炎 (honoo / en)', a:'Reading: ほのお (honoo) / エン (en)\nMeaning: Flame, blaze\nEx: 炎の呼吸 (honoo no kokyuu) — Flame Breathing (Rengoku's style)' },
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
      { unit:'n5', diff:'easy', q:'What does 自由 (jiyuu) mean?', opts:['Wall','Titan','Freedom','Survey'], ans:2, exp:'自由 (じゆう, jiyuu) = freedom. 自 = self, 由 = reason/cause — "by one's own cause" = freedom. A major theme in AoT.' },
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
let equippedBg = localStorage.getItem('equippedBg') || 'none';

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

  container.innerHTML = `
    <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:flex-start">
      ${pickerHTML}
      <div style="flex:1;min-width:260px">
        ${instructionHTML}
        ${gridHTML}
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
  document.getElementById('bagPanelItems').classList.toggle('hidden', tab !== 'items');
  document.getElementById('bagPanelWidgets').classList.toggle('hidden', tab !== 'widgets');
  document.getElementById('bagPanelPacks').classList.toggle('hidden', tab !== 'packs');
  document.getElementById('bagPanelPasses').classList.toggle('hidden', tab !== 'passes');
  // Show remove/name overlays only while in the widgets editor
  document.body.classList.toggle('bag-editing', tab === 'widgets');
  if (tab === 'widgets') renderBagWidgetsPanel();
  if (tab === 'passes') renderPasses();
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
  if (studyCurrency < cost) {
    rewardPopup(`Need 🎟️ ${cost} tickets!`);
    return;
  }
  studyCurrency -= cost;
  localStorage.setItem('studyCurrency', studyCurrency);
  updateCurrencies();

  const widget = rollWidget(tier);
  pendingClaimWidget = widget;

  // Update ticket display
  const ticketEl = document.getElementById('mysteryTicketDisplay');
  if (ticketEl) ticketEl.textContent = studyCurrency;

  // Set up sealed pack appearance
  const tierLabel = tier === 'premium' ? 'Premium Pack' : 'Basic Pack';
  const tierCost  = tier === 'premium' ? '🎟️ 20' : '🎟️ 5';
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
  inventory.push(item);
  localStorage.setItem('inventory', JSON.stringify(inventory));
}

function equipItem(itemId) {
  const item = inventory.find(i => i.id === itemId);
  if (!item) return;
  
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

function filterInvCat(cat, el) {
  invCategoryFilter = cat;
  document.querySelectorAll('.inv-cat-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  renderInventory();
}

function renderInventory() {
  const grid = document.getElementById('inventoryGrid');
  const emptyMsg = document.getElementById('emptyInventoryMsg');
  if (!grid) return;

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

    grid.innerHTML = types.map(type => {
      const items = filtered.filter(i => i.type === type);
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
                                 (item.type === 'bg' && equippedBg === item.data);
              return `<div class="bag-inv-item ${isEquipped ? 'equipped' : ''}">
                <div class="bag-inv-item-info">
                  <div class="bag-inv-item-name">${item.name}</div>
                  <div class="bag-inv-item-type">${item.type}</div>
                </div>
                <button class="inv-equip-btn ${isEquipped ? 'equipped-btn' : ''}" onclick="equipItem('${item.id}')">
                  ${isEquipped ? '✓' : 'Equip'}
                </button>
              </div>`;
            }).join('')}
          </div>
        </div>`;
    }).join('');
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
              : `<span class="qpack-cost">🎟️ ${pack.cost} tickets</span>
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
  if (studyCurrency < pack.cost) { rewardPopup('Need more 🎟️ tickets!'); return; }
  studyCurrency -= pack.cost;
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
  {id:'theme_void', name:'🌑 Void Theme', cost:500, type:'theme', data:'void'},
  {id:'theme_cold', name:'❄️ Cold Blue Theme', cost:500, type:'theme', data:'coldblue'},
  {id:'theme_naruto', name:'🍥 Naruto Theme', cost:700, type:'theme', data:'naruto'},
  {id:'theme_slayer', name:'🌊 Slayer Theme', cost:700, type:'theme', data:'slayer'},
  {id:'theme_aot', name:'🗡️ Survey Corps Theme', cost:800, type:'theme', data:'aot'},
  {id:'theme_neongreen', name:'💚 Neon Green Theme', cost:450, type:'theme', data:'neongreen'},
  {id:'theme_crimson', name:'🩸 Crimson Theme', cost:450, type:'theme', data:'crimson'},
  {id:'theme_sakurapink', name:'🌸 Sakura Pink Theme', cost:550, type:'theme', data:'sakura'},
  {id:'theme_deep', name:'🔵 Deep Navy Theme', cost:400, type:'theme', data:'deep'},
  {id:'theme_midnight', name:'🌑 Midnight Theme', cost:400, type:'theme', data:'midnight'},
  {id:'theme_gold', name:'✨ Gold Theme', cost:650, type:'theme', data:'gold'},
  {id:'theme_matrix', name:'💻 Matrix Theme', cost:750, type:'theme', data:'matrix'},
  {id:'theme_dusk', name:'🌆 Dusk Theme', cost:500, type:'theme', data:'dusk'},
  {id:'theme_ice', name:'🧊 Ice Theme', cost:500, type:'theme', data:'ice'},
  {id:'theme_ember', name:'🔥 Ember Theme', cost:550, type:'theme', data:'ember'},

  // Visual Effects - mid to high
  {id:'effect_rain', name:'🌧️ Rain Effect', cost:600, type:'effect', data:'rain'},
  {id:'effect_stars', name:'⭐ Starfield Effect', cost:500, type:'effect', data:'stars'},
  {id:'effect_void', name:'🌑 Void Orbs Effect', cost:650, type:'effect', data:'void'},
  {id:'effect_matrix', name:'💻 Matrix Rain Effect', cost:750, type:'effect', data:'matrix'},
  {id:'effect_none', name:'✖️ Remove Effect', cost:0, type:'effect', data:'none'},

  // Dialogue Packs
  {id:'dlg_tsundere', name:'💢 Tsundere Pack', cost:400, type:'dialogue', data:'tsundere'},
  {id:'dlg_kuudere', name:'🧊 Kuudere Pack', cost:350, type:'dialogue', data:'kuudere'},
  {id:'dlg_genki', name:'✨ Genki Pack', cost:450, type:'dialogue', data:'genki'},
  {id:'dlg_chuu', name:'🌑 Chuunibyou Pack', cost:550, type:'dialogue', data:'chuunibyou'},

  // VFX Packs - high cost, worth grinding for
  {id:'vfx_basic', name:'⚡ Basic VFX Pack', cost:600, type:'vfx', data:'basic', desc:'Unlocks subtle particles on tab switch, button clicks, and correct/wrong answers.'},
  {id:'vfx_arcane', name:'🔮 Arcane VFX Pack', cost:1000, type:'vfx', data:'arcane', desc:'Purple arcane sparks on all interactions. Mystic energy on correct answers.'},
  {id:'vfx_overdrive', name:'🌟 Overdrive VFX Pack', cost:1500, type:'vfx', data:'overdrive', desc:'Explosive golden bursts. Maximum particle chaos. Only for the committed.'},
  {id:'vfx_none', name:'✖️ Remove VFX', cost:0, type:'vfx', data:'none', desc:'Disable all interaction particles.'},

  // Background Presets
  {id:'bg_void', name:'⬛ Void Background', cost:400, type:'bg', data:'void', desc:'Pure black. No distractions.'},
  {id:'bg_slate', name:'🌑 Deep Slate', cost:350, type:'bg', data:'slate', desc:'Subtle deep blue-grey.'},
  {id:'bg_crimson', name:'🩸 Crimson Dusk', cost:500, type:'bg', data:'crimson', desc:'Dark red gradient.'},
  {id:'bg_ocean', name:'🌊 Deep Ocean', cost:500, type:'bg', data:'ocean', desc:'Dark navy gradient.'},
  {id:'bg_forest', name:'🌲 Dark Forest', cost:500, type:'bg', data:'forest', desc:'Deep forest green.'},
  {id:'bg_nebula', name:'🌌 Nebula', cost:750, type:'bg', data:'nebula', desc:'Purple-blue radial nebula.'},
  {id:'bg_aurora', name:'🌠 Aurora', cost:650, type:'bg', data:'aurora', desc:'Northern lights tones.'},
  {id:'bg_synthwave', name:'🎹 Synthwave', cost:650, type:'bg', data:'synthwave', desc:'Deep purple synthwave gradient.'},
  {id:'bg_hazel', name:'☕ Hazel Warm', cost:400, type:'bg', data:'hazel', desc:'Warm dark brown tones.'},
  {id:'bg_steel', name:'🔩 Steel', cost:350, type:'bg', data:'steel', desc:'Cold blue-steel gradient.'},
  {id:'bg_none', name:'✖️ Default Background', cost:0, type:'bg', data:'none', desc:'Restore the default grid.'},
];

function updateCurrencies() {
  studyCoinsEl.textContent = studyCurrency;
  gambleCoinsEl.textContent = gambleCurrency;
  playerTitleEl.textContent = playerTitle;
  applyTitleStyle(playerTitle);

  // Update dealer display if open
  const dt = document.getElementById('dealerTickets');
  const dm = document.getElementById('dealerMoney');
  if (dt) dt.textContent = studyCurrency;
  if (dm) dm.textContent = gambleCurrency;

  localStorage.setItem('studyCurrency', studyCurrency);
  localStorage.setItem('gambleCurrency', gambleCurrency);
  localStorage.setItem('playerTitle', playerTitle);
}

function rewardPopup(text) {
  const pop = document.createElement('div');
  pop.className = 'reward-pop';
  pop.textContent = text;
  document.body.appendChild(pop);

  setTimeout(() => pop.remove(), 1600);
}

function rewardStudy(amount) {
  studyCurrency += amount;
  updateCurrencies();
  rewardPopup('+' + amount + ' 🎟️ ticket' + (amount !== 1 ? 's' : ''));
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
  const showUnitBar = ['flash','mcq','kana','anime'].includes(mode);
  if (unitBar) unitBar.style.display = showUnitBar ? '' : 'none';

  // Show the chosen panel
  if (mode === 'flash')    document.getElementById('flashMode').classList.remove('hidden');
  if (mode === 'mcq')      document.getElementById('mcqMode').classList.remove('hidden');
  if (mode === 'anime')    document.getElementById('animeMode').classList.remove('hidden');
  if (mode === 'kana')     document.getElementById('kanaMode').classList.remove('hidden');
  if (mode === 'review')   document.getElementById('reviewMode').classList.remove('hidden');
  if (mode === 'learned')  document.getElementById('learnedMode').classList.remove('hidden');
  if (mode === 'shop') {
    const shopEl = document.getElementById('shopMode');
    if (shopEl) { shopEl.classList.remove('hidden'); generateShopMain(); }
  }
  if (mode === 'casino')   document.getElementById('casinoMode').classList.remove('hidden');
  if (mode === 'inventory') {
    document.getElementById('inventoryMode').classList.remove('hidden');
    renderInventory();
    renderBagWidgetsPanel();
    renderWidgetSlots();
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

function generateShopMain() {
  const shop = document.getElementById('shopItemsMain');
  const timer = document.getElementById('shopTimerMain');
  if (!shop) return;

  const now = Date.now();
  const cycle = Math.floor(now / shopCycleTime);

  const seeded = [...shopPool].sort((a, b) => {
    const ha = Math.sin(cycle * 13.7 + shopPool.indexOf(a) * 97.3);
    const hb = Math.sin(cycle * 13.7 + shopPool.indexOf(b) * 97.3);
    return ha - hb;
  });
  const items = seeded.slice(0, 5);

  // Active category filter
  const activeCat = activeShopCat || 'all';

  shop.innerHTML = '';
  items.forEach(item => {
    if (activeCat !== 'all' && item.type !== activeCat) return;
    const owned = inventory.find(i => i.id === item.id);
    const div = document.createElement('div');
    div.className = 'shop-item';
    const typeEmoji = {title:'🏷️', theme:'🎨', effect:'✨', dialogue:'💬', vfx:'⚡', bg:'🖼️'}[item.type] || '📦';
    div.innerHTML = `
      <div style="flex:1;min-width:0">
        <div style="font-weight:700">${typeEmoji} ${item.name}</div>
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-top:2px">${item.type}</div>
        ${item.desc ? `<div style="font-size:11px;color:var(--muted);margin-top:4px;line-height:1.4">${item.desc}</div>` : ''}
      </div>
      ${owned
        ? `<span style="font-family:'Space Mono',monospace;font-size:11px;color:var(--correct);border:1px solid rgba(0,255,157,0.2);padding:4px 8px;border-radius:4px;white-space:nowrap;margin-left:10px">OWNED</span>`
        : `<button class="btn btn-secondary" style="font-size:12px;padding:7px 12px;white-space:nowrap;margin-left:10px">Buy ${item.cost} 🎰</button>`
      }
    `;
    if (!owned) {
      div.querySelector('button').onclick = () => {
        if (gambleCurrency < item.cost) { rewardPopup('Not enough coins!'); return; }
        gambleCurrency -= item.cost;
        addToInventory({id: item.id, name: item.name, type: item.type, data: item.data || item.name});
        if (item.type === 'theme') applyTheme(item.data);
        updateCurrencies();
        rewardPopup('Unlocked: ' + item.name + ' → check 🎒 Bag');
        generateShopMain();
      };
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
  const pool = [...MCQ, ...getActivePackQuestions('mcq')];
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
    `📘 Knowledge Coins: ${studyCurrency}`,
    `🎰 Casino Chips: ${gambleCurrency}`,
    `Title: ${playerTitle}`,
    '',
    '=== Unit Breakdown (Questions Available) ===',
    ...[1,2,3,4,5,6,7,8,9].map(u =>
      `U${u}: ${MCQ.filter(q=>q.unit===u).length} MCQ · ${FLASHCARDS.filter(f=>f.unit===u).length} FC`
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
  txt.textContent = '+1 🎟️';
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
  if (amount < 1) { rewardPopup('Enter at least 1 🎟️'); return; }
  if (studyCurrency < amount) { rewardPopup('Not enough 🎟️ tickets!'); return; }
  const coins = amount * 10;
  studyCurrency -= amount;
  gambleCurrency += coins;
  updateCurrencies();
  const result = document.getElementById('dealerResult');
  if (result) result.textContent = `Converted ${amount} 🎟️ → ${coins} 🎰`;
  const dt = document.getElementById('dealerTickets');
  const dm = document.getElementById('dealerMoney');
  if (dt) dt.textContent = studyCurrency;
  if (dm) dm.textContent = gambleCurrency;
  rewardPopup(`Converted! +${coins} 🎰`);
  input.value = '';
}

function dealerQuick(tickets) {
  if (studyCurrency < tickets) { rewardPopup('Not enough 🎟️ tickets!'); return; }
  const coins = tickets * 10;
  studyCurrency -= tickets;
  gambleCurrency += coins;
  updateCurrencies();
  const result = document.getElementById('dealerResult');
  if (result) result.textContent = `Converted ${tickets} 🎟️ → ${coins} 🎰`;
  const dt = document.getElementById('dealerTickets');
  const dm = document.getElementById('dealerMoney');
  if (dt) dt.textContent = studyCurrency;
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

// NOW safe to init study modes (QUESTION_PACKS and activePackIds are defined above)
initFlash(); initMCQ(); initCyc(); // initFRQ removed

// Init widget slots on load
renderWidgetSlots();

// Update mystery pack ticket display whenever shop opens
const _baseSwitchMode = switchMode;
// Patch: update ticket display when shop tab (mystery) is active
document.addEventListener('click', e => {
  const shopMystBtn = e.target.closest('#shopTabMystery');
  if (shopMystBtn) {
    setTimeout(() => {
      const el = document.getElementById('mysteryTicketDisplay');
      if (el) el.textContent = studyCurrency;
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
  const pad = 10;
  aura.style.left   = (r.left - pad) + 'px';
  aura.style.top    = (r.top - pad) + 'px';
  aura.style.width  = (r.width + pad*2) + 'px';
  aura.style.height = (r.height + pad*2) + 'px';
  aura.style.borderRadius = getComputedStyle(img).borderRadius;
}

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
    mascotBubble.style.left   = bLeft + 'px';
    mascotBubble.style.top    = (rect.top + 10) + 'px';
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
    rewardPopup(`Unlocked! Now spend ${bg.tokenCost} 🎟️ to buy`);
    return;
  }

  // Step 2: spend tickets to actually buy - adds to inventory as a proper BG
  if (studyCurrency < bg.tokenCost) { rewardPopup(`Need ${bg.tokenCost} 🎟️ tickets!`); return; }
  studyCurrency -= bg.tokenCost;
  localStorage.setItem('studyCurrency', studyCurrency);
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
        label = `${bg.tokenCost}🎟️`;
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
  'studyCurrency','gambleCurrency','bjShards','spinShards',
  'playerTitle','bjPassLevel','spinPassUnlocked',
  'inventory','ownedWidgets','widgetSlots','ownedPacks','activePackIds',
  'equippedDialogue','equippedEffect','equippedVfx','equippedBg',
  'equippedTheme','soundEnabled','apesMascot',
];

let sbClient = null;
let currentUser = null; // { id, email, username }
let authMode = 'signup'; // 'signup' | 'login' | 'logout'

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
  const numericKeys = ['studyCurrency','gambleCurrency','bjShards','spinShards','bjPassLevel'];
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
  if (typeof studyCurrency !== 'undefined') {
    studyCurrency = parseInt(localStorage.getItem('studyCurrency') || '0');
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
    try { renderInventory(); renderWidgetSlots(); } catch(e) {}
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
  if (mode === 'signup') {
    btn.textContent = 'Sign Up';
    sub.textContent = 'Sign in to save your progress across devices.';
    uf.style.display = '';
    tgl.innerHTML = 'Already have an account? <a onclick="setAuthMode(\'login\')">Log in</a>';
  } else if (mode === 'login') {
    btn.textContent = 'Log In';
    sub.textContent = 'Welcome back! Your progress will sync automatically.';
    uf.style.display = 'none';
    tgl.innerHTML = 'No account yet? <a onclick="setAuthMode(\'signup\')">Sign up</a>';
  } else if (mode === 'logout') {
    btn.textContent = 'Log Out';
    sub.textContent = `Signed in as ${currentUser?.username || currentUser?.email}. Log out?`;
    uf.style.display = 'none';
    tgl.innerHTML = '';
  }
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

  if (!email || !password) { showAuthError('Please fill in email and password.'); return; }
  if (authMode === 'signup' && !username) { showAuthError('Please choose a username.'); return; }
  if (password.length < 6) { showAuthError('Password must be at least 6 characters.'); return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="auth-spinner"></span>' + (authMode === 'signup' ? 'Creating account…' : 'Logging in…');

  try {
    if (authMode === 'signup') {
      const { data, error } = await sbClient.auth.signUp({
        email, password,
        options: { data: { username }, emailRedirectTo: undefined }
      });
      if (error) throw error;
      // Immediately sign in (no email verify)
      const { data: loginData, error: loginError } = await sbClient.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;
      await handleSignedIn(loginData.user, username, true);
    } else {
      const { data, error } = await sbClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Get username from profile
      const profile = await loadFromCloud(data.user.id);
      const uname = profile?.username || data.user.user_metadata?.username || email.split('@')[0];
      await handleSignedIn(data.user, uname, false);
    }
  } catch(e) {
    showAuthError(e.message || 'Something went wrong. Try again.');
    btn.disabled = false;
    btn.textContent = authMode === 'signup' ? 'Sign Up' : 'Log In';
  }
}

async function handleSignedIn(user, username, isNewUser) {
  currentUser = { id: user.id, email: user.email, username };
  updateAuthStatusBtn();

  const guestProgress = collectLocalProgress(); // grab before overwrite

  if (!isNewUser) {
    // Existing user: load server data and merge with guest progress
    const profile = await loadFromCloud(user.id);
    if (profile?.progress) {
      const merged = applyProgress(profile.progress, guestProgress);
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
  document.getElementById('authOverlay').classList.add('hidden');
  rewardPopup('Continuing as guest. Progress saved locally.');
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
    setAuthMode('signup');
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
const RARITY_COLORS = { rare: '#88aaff', epic: '#cc66ff', legendary: '#ffd32a' };
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
  document.getElementById('auctionCurrentBid').textContent = '🎟️ ' + auctionData.top_bid;
  document.getElementById('auctionCurrentBid').style.color = color;
  document.getElementById('auctionBidCount').textContent = auctionData.bid_count + ' bid' + (auctionData.bid_count !== 1 ? 's' : '');

  const leaderEl = document.getElementById('auctionLeaderName');
  if (auctionData.top_username) {
    const isMe = currentUser && auctionData.top_bidder === currentUser.id;
    leaderEl.textContent = (isMe ? '⭐ You' : auctionData.top_username) + ' is leading';
    leaderEl.style.color = isMe ? 'var(--correct)' : 'var(--muted)';
  } else {
    leaderEl.textContent = 'no bids yet - start at 🎟️ ' + MIN_BID_START;
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
    `<button class="auction-quick-btn" onclick="auctionQuickBid(${v})">+🎟️${v}</button>`
  ).join('');

  // Min bid hint
  const minNext = cur + 1;
  document.getElementById('auctionBidHint').textContent = ended
    ? 'This auction has ended.'
    : `Minimum bid: 🎟️ ${minNext}  ·  Your tickets: 🎟️ ${typeof studyCurrency !== 'undefined' ? studyCurrency : '?'}`;
  document.getElementById('auctionBidInput').min = minNext;
  document.getElementById('auctionBidInput').placeholder = `Min 🎟️ ${minNext}`;

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
      <span class="bid-row-amount">🎟️ ${b.amount}</span>
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
    errEl.textContent = `Bid must be at least 🎟️ ${minNext}`;
    errEl.style.display = '';
  } else if (v > 0 && v > (typeof studyCurrency !== 'undefined' ? studyCurrency : Infinity)) {
    errEl.textContent = `Not enough tickets! You have 🎟️ ${studyCurrency}`;
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
    errEl.textContent = `Bid must be at least 🎟️ ${minNext}`; errEl.style.display = ''; return;
  }
  if (typeof studyCurrency !== 'undefined' && amount > studyCurrency) {
    errEl.textContent = `Not enough tickets! You have 🎟️ ${studyCurrency}`; errEl.style.display = ''; return;
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

    rewardPopup(`🔨 Bid placed: 🎟️ ${amount}`);
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
  winSub.textContent = `${w?.name || auctionData.widget_id} · 🎟️ ${auctionData.top_bid}`;

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
        rewardPopup(`🔨 ${payload.new.username} bid 🎟️ ${payload.new.amount}!`);
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

const DS_UNITS = [
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
  grid.innerHTML = DS_UNITS.map(u => {
    const cards = FLASHCARDS.filter(c => c.unit === u.num);
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
  const cards = FLASHCARDS.filter(c => c.unit === unitNum);
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
  document.getElementById('dsUnitLabel').textContent = 'Unit ' + unitNum + ' · ' + (DS_UNITS.find(u => u.num === unitNum) || {}).name;

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

function dsGradeSubmit() {
  const grade = parseInt(document.getElementById('dsGradeSlider').value);
  const card = dsQueue[dsCardIdx];
  const srs = card._srs;
  const q6 = Math.round(grade * 0.5);

  if (q6 >= 3) {
    if (srs.reps === 0) srs.interval = 1;
    else if (srs.reps === 1) srs.interval = 6;
    else srs.interval = Math.round(srs.interval * srs.ease);
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

  const state = dsLoadState(dsActiveUnit);
  state[card.q] = { ease: srs.ease, interval: srs.interval, reps: srs.reps, lapses: srs.lapses, due: srs.due };
  dsSaveState(dsActiveUnit, state);

  const key = grade <= 3 ? 'grade_low' : grade <= 6 ? 'grade_mid' : 'grade_high';
  dsMascotSay(key);

  rewardStudy(1);
  if (mastered) { rewardStudy(2); dsSessionStats.mastered++; }
  dsSessionStats.seen++;

  if (q6 < 3) {
    const reinsert = { ...card, _srs: { ...srs } };
    const insertAt = Math.min(dsCardIdx + 5, dsQueue.length);
    dsQueue.splice(insertAt, 0, reinsert);
  }

  document.getElementById('dsGradeBtn').disabled = true;
  document.getElementById('dsGradeBtn').textContent = grade <= 3 ? '💀 Coming back soon' : grade <= 6 ? '↩️ Spaced out a bit' : '✓ Interval extended';

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
  document.getElementById('dsCompleteSub').textContent = seen + ' cards reviewed · ' + mastered + ' mastered this session · 🎟️ earned ' + (seen + mastered * 2);
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
    // TODO: initKanjiTrace() — initialize the canvas tracing widget
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
