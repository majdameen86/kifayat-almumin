/* ═══════════════════════════════════════════════════════════════
   كفاية المؤمن — app.js
   ═══════════════════════════════════════════════════════════════ */

/* ══ تطبيق الثيم فوراً (يُنفَّذ قبل رسم الصفحة عبر inline script) ══ */

// ══ PAGES ══
function showPage(id, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById('page-' + id);
  if (page) { page.classList.add('active'); window.scrollTo(0, 0); }
  document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  initBeads();
  // أعد إظهار الـ floating player عند مغادرة صفحة التفاصيل إذا كان الصوت يعمل
  if (id !== 'audio-detail' && typeof currentAudioUrl !== 'undefined' && currentAudioUrl && typeof audio !== 'undefined' && !audio.paused) {
    document.getElementById('floating-player').classList.add('visible');
  }
}

function showAudioDetail() { showPage('audio-detail'); }

// ══ DARK MODE ══
function toggleDark() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  document.getElementById('dark-toggle').innerHTML = isDark ? '<span class="ic">🌙</span>' : '<span class="ic">☀️</span>';
}

// ══ MOBILE NAV ══
function openMobileNav() {
  document.getElementById('mobile-nav').classList.add('open');
  document.getElementById('mob-overlay').classList.add('open');
}
function closeMobileNav() {
  document.getElementById('mobile-nav').classList.remove('open');
  document.getElementById('mob-overlay').classList.remove('open');
}

// ══ SCROLL NAV ══
window.addEventListener('scroll', () => {
  document.getElementById('main-nav').classList.toggle('scrolled', window.scrollY > 20);
});

// ══ PLAYER ══
// ══ REAL HTML5 AUDIO PLAYER ══
const audio = document.getElementById('real-audio');
let currentAudioUrl = '';

function showPlayer(url, title, sheikh, thumbEmoji) {
  const fp = document.getElementById('floating-player');
  fp.classList.add('visible');
  if (url && url !== currentAudioUrl) {
    currentAudioUrl = url;
    audio.src = url;
    audio.play().catch(() => showToast('تعذّر تشغيل الملف', 'error'));
  }
  document.getElementById('player-title-el').textContent  = title  || 'درس';
  document.getElementById('player-sheikh-el').textContent = sheikh || '';
  document.getElementById('player-thumb-el').textContent  = thumbEmoji || '🎙';
  document.getElementById('player-play-btn').textContent  = '⏸';
  isPlaying = true;
}

// ═══ AUDIO ENGINE ═══
let isPlaying = false;

function togglePlay() {
  if (!currentAudioUrl) return;
  if (audio.paused) {
    audio.play().catch(() => {});
    document.getElementById('player-play-btn').textContent = '⏸';
    isPlaying = true;
  } else {
    audio.pause();
    document.getElementById('player-play-btn').textContent = '▶';
    isPlaying = false;
  }
}

function skipAudio(sec) {
  audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + sec));
}

function seekProgress(e) {
  if (!audio.duration) return;
  const bar = document.getElementById('progress-bar');
  const rect = bar.getBoundingClientRect();
  // RTL: right side = 0
  const ratio = 1 - (e.clientX - rect.left) / rect.width;
  audio.currentTime = Math.max(0, Math.min(audio.duration, ratio * audio.duration));
}

function seekAudio(e) { seekProgress(e); } // alias for transcript clicks

function seekTo(sec) {
  if (!currentAudioUrl) return;
  audio.currentTime = sec;
  if (audio.paused) { audio.play().catch(() => {}); }
}

function setSpeed(v) {
  audio.playbackRate = parseFloat(v);
  const sel = document.getElementById('fp-speed');
  if (sel) sel.value = v;
}

function setVolume(v) {
  audio.volume = parseFloat(v);
}

function toggleMute() {
  audio.muted = !audio.muted;
  const icon = document.querySelector('.player-vol-icon');
  if (icon) icon.textContent = audio.muted ? '🔇' : '🔊';
}

function closePlayer() {
  audio.pause();
  currentAudioUrl = '';
  isPlaying = false;
  document.getElementById('floating-player').classList.remove('visible');
  document.getElementById('player-play-btn').textContent = '▶';
}

function fmtTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

// Audio event listeners
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.width = pct + '%';
  const cur = document.getElementById('player-cur');
  if (cur) cur.textContent = fmtTime(audio.currentTime);
  // Sync transcript highlight
  syncTranscript();
});
audio.addEventListener('loadedmetadata', () => {
  const total = document.getElementById('player-total');
  if (total) total.textContent = fmtTime(audio.duration);
});
audio.addEventListener('ended', () => {
  document.getElementById('player-play-btn').textContent = '▶';
  isPlaying = false;
  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.width = '0%';
});
audio.addEventListener('error', () => showToast('تعذّر تحميل الملف الصوتي', 'error'));

function syncTranscript() {
  const sentences = document.querySelectorAll('.transcript-sentence');
  if (!sentences.length || !audio.duration) return;
  const segDur = audio.duration / sentences.length;
  const activeIdx = Math.floor(audio.currentTime / segDur);
  sentences.forEach((s, i) => s.classList.toggle('active', i === activeIdx));
}

// ═══ DETAIL PAGE functions ═══
let currentDetailId   = null;
let currentDetailUrl  = '';
let currentDetailName = '';

async function detailPlayAudio() {
  if (currentDetailUrl) {
    showPlayer(currentDetailUrl, currentDetailName, null, '🎙');
    // Show "now playing" indicator
    const indicator = document.getElementById('detail-now-playing');
    if (indicator) indicator.style.display = 'flex';
  }
}

async function detailDownloadAudio() {
  if (currentDetailId) downloadAudio(currentDetailId);
}

function shareLesson(platform) {
  const url  = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(currentDetailName || 'درس إسلامي من كفاية المؤمن');
  const links = {
    wa: `https://wa.me/?text=${text}%20${url}`,
    tg: `https://t.me/share/url?url=${url}&text=${text}`,
    x:  `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
  };
  if (links[platform]) window.open(links[platform], '_blank');
}

function copyLessonLink() {
  navigator.clipboard.writeText(window.location.href)
    .then(() => showToast('تم نسخ الرابط 🔗', 'success'))
    .catch(() => showToast('تعذّر النسخ', 'error'));
}

async function downloadCurrentAudio() {
  if (!currentDetailId) { showToast('لا يوجد درس', 'error'); return; }
  downloadAudio(currentDetailId);
}


// ══ TASBIH ══
let tasbihCount = 0;
let tasbihPhrase = 'سبحان الله';
function countTasbih() {
  tasbihCount++;
  document.getElementById('tasbih-num').textContent = tasbihCount;
  document.getElementById('tasbih-rounds').textContent = Math.floor(tasbihCount / 33);
  const counter = document.getElementById('tasbih-counter');
  counter.style.transform = 'scale(0.94)';
  setTimeout(() => counter.style.transform = '', 100);
  updateBeads();
  if (tasbihCount % 33 === 0 && tasbihCount > 0) showToast('أكملت ' + (tasbihCount/33) + ' دورة 🎉', 'success');
}
function resetTasbih() { tasbihCount = 0; document.getElementById('tasbih-num').textContent = '0'; document.getElementById('tasbih-rounds').textContent = '0'; updateBeads(); }
function setPhrase(p, btn) {
  tasbihPhrase = p;
  document.getElementById('tasbih-phrase-display').textContent = p;
  document.querySelectorAll('.phrase-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  resetTasbih();
}
function initBeads() {
  const wrap = document.getElementById('tasbih-beads');
  if (!wrap) return;
  wrap.innerHTML = '';
  for (let i = 0; i < 33; i++) {
    const b = document.createElement('div');
    b.className = 'tasbih-bead' + (i < (tasbihCount % 33) ? ' done' : '');
    wrap.appendChild(b);
  }
}
function updateBeads() {
  const beads = document.querySelectorAll('.tasbih-bead');
  const pos = tasbihCount % 33;
  beads.forEach((b, i) => b.classList.toggle('done', i < pos));
}

// ══ SEARCH ══
// ══ SEARCH — Supabase ══
function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
let searchTimeout = null;

function doSearch() {
  const q = document.getElementById('main-search').value.trim();
  const results = document.getElementById('search-results');
  if (!q) {
    results.innerHTML = '<p style="color:var(--text3);text-align:center;padding:40px 0">اكتب في مربع البحث للبدء</p>';
    return;
  }
  clearTimeout(searchTimeout);
  results.innerHTML = '<p style="color:var(--text3);text-align:center;padding:40px 0">🔍 جارٍ البحث...</p>';
  searchTimeout = setTimeout(() => runSearch(q), 400);
}

async function runSearch(q) {
  const results = document.getElementById('search-results');
  try {
    const safe = q.replace(/[%_]/g, '\\$&');
    const [audios, books] = await Promise.all([
      dbQuery('audios', { select: 'id,title,sheikhs(name)', filter: 'title=ilike.*' + safe + '*&is_published=eq.true', limit: 6 }),
      dbQuery('books',  { select: 'id,title,author',        filter: 'title=ilike.*' + safe + '*&is_published=eq.true', limit: 6 })
    ]);

    const items = [
      ...(audios||[]).map(a => ({ type:'audio', title: a.title, sub: a.sheikhs?.name || '', id: a.id })),
      ...(books||[]).map(b =>  ({ type:'book',  title: b.title, sub: b.author || '',         id: b.id })),
    ];

    if (!items.length) {
      results.innerHTML = '<p style="color:var(--text3);text-align:center;padding:40px 0">لا توجد نتائج لـ «' + escHtml(q) + '»</p>';
      return;
    }

    results.innerHTML = items.map(r => {
      const icon = r.type === 'audio' ? '🎙' : '📖';
      const action = r.type === 'audio' ? "openAudioDetail('" + escHtml(String(r.id)) + "')" : "showPage('books')";
      return '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px 20px;margin-bottom:12px;display:flex;align-items:center;gap:14px;cursor:pointer;transition:border-color .2s" onmouseover="this.style.borderColor=\'var(--em)\'" onmouseout="this.style.borderColor=\'var(--border)\'" onclick="' + action + '">'
        + '<div style="width:42px;height:42px;border-radius:10px;background:rgba(11,107,66,0.1);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">' + icon + '</div>'
        + '<div><div style="font-size:15px;font-weight:700;margin-bottom:3px">' + escHtml(r.title) + '</div>'
        + '<div style="font-size:12px;color:var(--text3)">' + escHtml(r.sub) + '</div></div></div>';
    }).join('');
  } catch(e) {
    results.innerHTML = '<p style="color:var(--text3);text-align:center;padding:40px 0">حدث خطأ أثناء البحث</p>';
  }
}
// ══ TOAST ══
function showToast(msg, type='success') {
  const t = document.getElementById('main-toast');
  const icon = document.getElementById('toast-icon');
  const text = document.getElementById('toast-text');
  if (!t || !text) return;
  if (text) text.textContent = msg;
  if (icon) {
    icon.textContent = type === 'success' ? '✅' : '⚠️';
    icon.style.color = type === 'success' ? '#2dc77a' : '#e05252';
    icon.style.fontSize = '18px';
    icon.className = '';
  }
  t.style.transform = 'translateY(0)';
  t.style.opacity = '1';
  setTimeout(() => { t.style.transform = 'translateY(100px)'; t.style.opacity = '0'; }, 3000);
}

// ══ FADE ANIMATIONS ══
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });

// ══ INIT — wait for DOM ══
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
  initBeads();
});

// ════════════════════════════════════════
//  PRAYER TIMES SYSTEM
// ════════════════════════════════════════

const CITIES = [
  {name:'دمشق',      country:'سوريا',    flag:'🇸🇾', lat:33.5138, lng:36.2765},
  {name:'مكة المكرمة',country:'السعودية', flag:'🇸🇦', lat:21.3891, lng:39.8579},
  {name:'المدينة',   country:'السعودية', flag:'🇸🇦', lat:24.5247, lng:39.5692},
  {name:'الرياض',    country:'السعودية', flag:'🇸🇦', lat:24.7136, lng:46.6753},
  {name:'القاهرة',   country:'مصر',      flag:'🇪🇬', lat:30.0444, lng:31.2357},
  {name:'الإسكندرية',country:'مصر',      flag:'🇪🇬', lat:31.2001, lng:29.9187},
  {name:'بيروت',     country:'لبنان',    flag:'🇱🇧', lat:33.8938, lng:35.5018},
  {name:'عمّان',     country:'الأردن',   flag:'🇯🇴', lat:31.9454, lng:35.9284},
  {name:'الكويت',    country:'الكويت',   flag:'🇰🇼', lat:29.3759, lng:47.9774},
  {name:'دبي',       country:'الإمارات', flag:'🇦🇪', lat:25.2048, lng:55.2708},
  {name:'أبوظبي',    country:'الإمارات', flag:'🇦🇪', lat:24.4539, lng:54.3773},
  {name:'بغداد',     country:'العراق',   flag:'🇮🇶', lat:33.3152, lng:44.3661},
  {name:'الدوحة',    country:'قطر',      flag:'🇶🇦', lat:25.2854, lng:51.5310},
  {name:'المنامة',   country:'البحرين',  flag:'🇧🇭', lat:26.2235, lng:50.5876},
  {name:'مسقط',      country:'عُمان',    flag:'🇴🇲', lat:23.5880, lng:58.3829},
  {name:'صنعاء',     country:'اليمن',    flag:'🇾🇪', lat:15.3694, lng:44.1910},
  {name:'الخرطوم',   country:'السودان',  flag:'🇸🇩', lat:15.5007, lng:32.5599},
  {name:'الرباط',    country:'المغرب',   flag:'🇲🇦', lat:34.0209, lng:-6.8416},
  {name:'الجزائر',   country:'الجزائر',  flag:'🇩🇿', lat:36.7372, lng:3.0865},
  {name:'تونس',      country:'تونس',     flag:'🇹🇳', lat:36.8190, lng:10.1658},
  {name:'طرابلس',    country:'ليبيا',    flag:'🇱🇾', lat:32.9022, lng:13.1800},
  {name:'إسطنبول',   country:'تركيا',    flag:'🇹🇷', lat:41.0082, lng:28.9784},
  {name:'لندن',      country:'المملكة المتحدة',flag:'🇬🇧',lat:51.5074,lng:-0.1278},
  {name:'باريس',     country:'فرنسا',    flag:'🇫🇷', lat:48.8566, lng:2.3522},
  {name:'برلين',     country:'ألمانيا',  flag:'🇩🇪', lat:52.5200, lng:13.4050},
];

let currentCity = CITIES[0]; // Default: Damascus
let prayerCountdownInterval = null;

// ── Calculation helpers (Adhan-lite) ──
function toRad(d){return d*Math.PI/180}
function toDeg(r){return r*180/Math.PI}
function fixHour(h){return h-24*Math.floor(h/24)}
function fixAngle(a){return a-360*Math.floor(a/360)}

function sunPosition(jd){
  const D=jd-2451545;
  const g=fixAngle(357.529+0.98560028*D);
  const q=fixAngle(280.459+0.98564736*D);
  const L=fixAngle(q+1.9150*Math.sin(toRad(g))+0.020*Math.sin(toRad(2*g)));
  const e=23.439-0.00000036*D;
  const RA=toDeg(Math.atan2(Math.cos(toRad(e))*Math.sin(toRad(L)),Math.cos(toRad(L))))/15;
  const dec=toDeg(Math.asin(Math.sin(toRad(e))*Math.sin(toRad(L))));
  const EqT=q/15-fixHour(RA);
  return {dec,EqT};
}

function julianDate(y,m,d){
  if(m<=2){y--;m+=12}
  const A=Math.floor(y/100),B=2-A+Math.floor(A/4);
  return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+B-1524.5;
}

function computePrayers(lat,lng,date,method){
  const y=date.getFullYear(),m=date.getMonth()+1,d=date.getDate();
  const jd=julianDate(y,m,d);
  const {dec,EqT}=sunPosition(jd);
  const tz=-(date.getTimezoneOffset()/60);

  function hourAngle(angle){
    const x=(Math.sin(toRad(angle))-Math.sin(toRad(lat))*Math.sin(toRad(dec)))
            /(Math.cos(toRad(lat))*Math.cos(toRad(dec)));
    return toDeg(Math.acos(Math.max(-1,Math.min(1,x))))/15;
  }

  const midday=12-EqT-(lng/15)+tz;
  const fajrHA    = hourAngle(method.fajr * -1);
  const ishaHA    = hourAngle(method.isha * -1);
  const sunriseHA = hourAngle(-0.8333);
  const asrHA     = toDeg(Math.atan(1/( Math.tan(toRad(Math.abs(lat-dec)))+1 )))/15;

  return {
    fajr:   midday - fajrHA,
    sunrise:midday - sunriseHA,
    dhuhr:  midday + 0.033333,
    asr:    midday + asrHA,
    maghrib:midday + sunriseHA,
    isha:   midday + ishaHA,
  };
}

// Method: Muslim World League (close to Syrian standard)
const METHOD_MWL = {fajr:18, isha:17};

function decimalToTime(h,tz_offset){
  // h is UTC-based local time
  let total = h;
  total = ((total % 24) + 24) % 24;
  const hr = Math.floor(total);
  const mn = Math.round((total - hr) * 60);
  const hh = mn === 60 ? hr+1 : hr;
  const mm = mn === 60 ? 0 : mn;
  return `${String(hh%24).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
}

function loadPrayerTimes(city){
  currentCity = city;
  localStorage.setItem('prayerCity', JSON.stringify(city));
  document.getElementById('prayer-city-name').textContent = city.name;
  document.getElementById('prayer-times-wrap').innerHTML = '<div class="prayer-loading">جارٍ الحساب...</div>';

  // Use aladhan.com API for accurate times
  const today = new Date();
  const dd = String(today.getDate()).padStart(2,'0');
  const mm = String(today.getMonth()+1).padStart(2,'0');
  const yyyy = today.getFullYear();
  const dateStr = `${dd}-${mm}-${yyyy}`;

  fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${city.lat}&longitude=${city.lng}&method=3`)
    .then(r=>r.json())
    .then(data=>{
      if(data.code===200){
        const t = data.data.timings;
        renderPrayers({
          fajr: t.Fajr,
          sunrise: t.Sunrise,
          dhuhr: t.Dhuhr,
          asr: t.Asr,
          maghrib: t.Maghrib,
          isha: t.Isha,
        });
      } else { fallbackCalculation(city); }
    })
    .catch(()=>{ fallbackCalculation(city); });
}

function fallbackCalculation(city){
  // Offline fallback using our own calculation
  const now = new Date();
  const tzOffset = -(now.getTimezoneOffset()/60);
  const prayers = computePrayers(city.lat, city.lng, now, METHOD_MWL);
  renderPrayers({
    fajr:    decimalToTime(prayers.fajr, tzOffset),
    sunrise: decimalToTime(prayers.sunrise, tzOffset),
    dhuhr:   decimalToTime(prayers.dhuhr, tzOffset),
    asr:     decimalToTime(prayers.asr, tzOffset),
    maghrib: decimalToTime(prayers.maghrib, tzOffset),
    isha:    decimalToTime(prayers.isha, tzOffset),
  });
}

function renderPrayers(times){
  const prayers = [
    {name:'الفجر',   key:'fajr'},
    {name:'الشروق',  key:'sunrise'},
    {name:'الظهر',   key:'dhuhr'},
    {name:'العصر',   key:'asr'},
    {name:'المغرب',  key:'maghrib'},
    {name:'العشاء',  key:'isha'},
  ];

  const now = new Date();
  const nowMins = now.getHours()*60 + now.getMinutes();

  // Find next prayer
  let nextIdx = -1;
  const minsArr = prayers.map(p => {
    const [h,m] = times[p.key].split(':').map(Number);
    return h*60+m;
  });
  for(let i=0;i<minsArr.length;i++){
    if(minsArr[i] > nowMins){ nextIdx = i; break; }
  }
  if(nextIdx === -1) nextIdx = 0; // Tomorrow's Fajr

  const wrap = document.getElementById('prayer-times-wrap');
  wrap.innerHTML = prayers.map((p,i)=>`
    <div class="prayer-item${i===nextIdx?' next':''}">
      <span>${p.name}</span>
      <strong>${times[p.key]}</strong>
    </div>
  `).join('');

  // Start countdown
  startCountdown(prayers[nextIdx].name, minsArr[nextIdx]);
}

function startCountdown(name, targetMins){
  if(prayerCountdownInterval) clearInterval(prayerCountdownInterval);

  function update(){
    const now = new Date();
    const curMins = now.getHours()*60+now.getMinutes();
    let diff = targetMins - curMins;
    if(diff < 0) diff += 1440;
    const h = Math.floor(diff/60);
    const m = diff % 60;
    const txt = h>0 ? `${h} ساعة و ${m} دقيقة` : `${m} دقيقة`;
    document.getElementById('next-prayer-name').textContent = name;
    document.getElementById('next-prayer-countdown').textContent = txt;
  }
  update();
  prayerCountdownInterval = setInterval(update, 30000);
}

// ── GPS ──
function getPrayerByGPS(){
  const btn = document.getElementById('gps-btn');
  btn.classList.add('loading');
  btn.innerHTML = '<span class="ic">⏳</span> جارٍ التحديد...';

  if(!navigator.geolocation){
    showToast('المتصفح لا يدعم تحديد الموقع','error');
    btn.classList.remove('loading');
    btn.innerHTML = '<span class="ic">📍</span> موقعي';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const city = {
        name: 'موقعي الحالي',
        flag: '📍',
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };
      // Try to get city name
      fetch(`https://api.aladhan.com/v1/cityInfo?latitude=${city.lat}&longitude=${city.lng}`)
        .then(r=>r.json())
        .then(d=>{
          if(d.data && d.data.city) city.name = d.data.city;
        })
        .catch(()=>{})
        .finally(()=>{
          loadPrayerTimes(city);
          btn.classList.remove('loading');
          btn.innerHTML = '<span class="ic">📍</span> موقعي';
          showToast('تم تحديد موقعك بنجاح ✅','success');
        });
    },
    err => {
      showToast('تعذّر تحديد الموقع، تحقق من الإذن','error');
      btn.classList.remove('loading');
      btn.innerHTML = '<span class="ic">📍</span> موقعي';
    },
    {timeout:8000}
  );
}

// ── Modal ──
let filteredCities = [...CITIES];

function openPrayerModal(){
  renderCitiesGrid(CITIES);
  document.getElementById('city-search-input').value = '';
  document.getElementById('prayer-modal').classList.add('open');
}
function closePrayerModal(){
  document.getElementById('prayer-modal').classList.remove('open');
}

function renderCitiesGrid(list){
  const grid = document.getElementById('cities-grid');
  grid.innerHTML = list.map(city=>`
    <button class="city-btn${city.name===currentCity.name?' selected':''}" onclick="selectCity('${city.name.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}')">
      <span class="city-flag">${city.flag}</span>
      <div style="text-align:right">
        <div style="font-size:13px;font-weight:700">${escHtml(city.name)}</div>
        <div style="font-size:11px;opacity:.6">${escHtml(city.country)}</div>
      </div>
    </button>
  `).join('');
}

function filterCities(){
  const q = document.getElementById('city-search-input').value.trim();
  const list = q ? CITIES.filter(c => c.name.includes(q) || c.country.includes(q)) : CITIES;
  renderCitiesGrid(list);
}

function selectCity(name){
  const city = CITIES.find(c=>c.name===name);
  if(city){ loadPrayerTimes(city); closePrayerModal(); showToast(`تم اختيار ${city.name} 🕌`,'success'); }
  else { showToast('المدينة غير موجودة', 'error'); }
}

// Close modal on backdrop click
document.getElementById('prayer-modal').addEventListener('click', function(e){
  if(e.target===this) closePrayerModal();
});

// ── INIT Prayer Times ──
(function initPrayer(){
  // Try to restore saved city
  try {
    const saved = localStorage.getItem('prayerCity');
    if(saved){ const c = JSON.parse(saved); if(c && typeof c.lat === 'number' && typeof c.lng === 'number') { currentCity=c; } }
  } catch(e){ localStorage.removeItem('prayerCity'); }
  loadPrayerTimes(currentCity);
})();

/* ══════════════════════════════════════════════════════════════
   SUPABASE INTEGRATION
══════════════════════════════════════════════════════════════ */

// ══ AI STATE ══
let currentTranscript = '';
let groqApiKey = '';

// ══ SUPABASE CONFIG ══
const SUPABASE_URL = 'https://qfmsplotijbnwderzbkv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbXNwbG90aWpibndkZXJ6Ymt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNjQwMzQsImV4cCI6MjA4ODY0MDAzNH0.FgDbDDU7ELt5wd6VihhTECTusHtA7vagr4widsp3XyA';

// ══ DB HELPER ══
async function dbQuery(table, options = {}) {
  let url = `${SUPABASE_URL}/rest/v1/${table}?`;
  if (options.select)  url += `select=${options.select}&`;
  if (options.filter)  url += `${options.filter}&`;
  if (options.order)   url += `order=${options.order}&`;
  if (options.limit)   url += `limit=${options.limit}&`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  return res.json();
}

async function dbInsert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function dbUpdate(table, filter, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

// ══ LOAD AUDIOS ══
async function loadAudios() {
  try {
    const data = await dbQuery('audios', {
      select: 'id,title,duration,thumbnail_url,play_count,sheikhs(name),categories(name)',
      filter: 'is_published=eq.true',
      order: 'created_at.desc',
      limit: 8
    });
    if (!data || data.length === 0) return;

    const grids = document.querySelectorAll('.audios-grid');
    grids.forEach(grid => {
      grid.innerHTML = data.map(a => `
        <div class="audio-card" onclick="openAudioDetail('${a.id}')">
          <div class="audio-thumb" style="background:linear-gradient(135deg,var(--em-dark),#0a2e1c)">
            ${a.thumbnail_url
              ? `<img src="${a.thumbnail_url}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0">`
              : '<div class="audio-thumb-inner">🎙</div>'
            }
            <div class="audio-thumb-overlay"></div>
            <div class="audio-play-btn"><span class="ic">▶</span></div>
            <div class="audio-duration">${a.duration || '--:--'}</div>
            <div class="audio-cat">
              <span class="badge badge-green">${a.categories?.name || 'درس'}</span>
            </div>
          </div>
          <div class="audio-body">
            <h3>${escHtml(a.title)}</h3>
            <div class="audio-meta">
              <span>👤 ${a.sheikhs?.name || 'غير محدد'}</span>
              <span>🎧 ${a.play_count || 0}</span>
            </div>
          </div>
          <div class="audio-footer">
            <button class="btn-play-small" onclick="event.stopPropagation();playAudio('${a.id}','${escHtml(a.title)}','${escHtml(a.sheikhs?.name||'')}')" title="استمع مباشرة">
              <span class="ic">▶</span> استمع
            </button>
            <button class="btn-download" onclick="event.stopPropagation();downloadAudio('${a.id}')" title="تحميل">
              <span class="ic">⬇</span>
            </button>
          </div>
        </div>
      `).join('');
    });

    // Update stats
    const statEl = document.querySelector('.hero-stat:first-child strong');
    if (statEl) statEl.textContent = data.length + '+';

  } catch(e) { console.log('Audios load error:', e); }
}

// ══ LOAD BOOKS ══
async function loadBooks() {
  try {
    const data = await dbQuery('books', {
      select: 'id,title,author,cover_url,pdf_url,rating,download_count',
      filter: 'is_published=eq.true',
      order: 'created_at.desc',
      limit: 8
    });
    if (!data || data.length === 0) return;

    const grids = document.querySelectorAll('.books-grid');
    const colors = [
      'linear-gradient(135deg,#0a2e1c,#031e12)',
      'linear-gradient(135deg,#1a3a10,#0a2008)',
      'linear-gradient(135deg,#2a1810,#150c08)',
      'linear-gradient(135deg,#0a1a3a,#060f20)',
      'linear-gradient(135deg,#1a0a2a,#0d0615)',
      'linear-gradient(135deg,#2a2010,#150f05)',
    ];
    const icons = ['📕','📗','📙','📘','📓','📔'];

    grids.forEach(grid => {
      grid.innerHTML = data.map((b, i) => `
        <div class="book-card">
          <div class="book-cover-wrap">
            <div class="book-cover" style="${b.cover_url ? '' : colors[i % colors.length]}">
              ${b.cover_url
                ? `<img src="${b.cover_url}" style="width:100%;height:100%;object-fit:cover">`
                : `<div class="book-cover-inner">
                    <div class="book-icon">${icons[i % icons.length]}</div>
                    <div class="book-cover-title">${escHtml(b.title)}</div>
                    <div class="book-cover-author">${escHtml(b.author || '')}</div>
                  </div>`
              }
            </div>
          </div>
          <div class="book-info">
            <h4>${escHtml(b.title)}</h4>
            <span>${escHtml(b.author || '')}</span>
            <div class="book-stars">${'★'.repeat(Math.round(b.rating||5))}${'☆'.repeat(5-Math.round(b.rating||5))}</div>
            <div class="book-actions">
              ${b.pdf_url && /^https?:\/\//i.test(b.pdf_url) ? `<button class="book-btn book-btn-read" onclick="window.open('${escHtml(b.pdf_url)}','_blank','noopener,noreferrer')">📖 قراءة</button>` : ''}
              ${b.pdf_url && /^https?:\/\//i.test(b.pdf_url) ? `<button class="book-btn book-btn-dl" onclick="downloadBook('${escHtml(String(b.id))}','${escHtml(b.pdf_url)}')">⬇</button>` : ''}
            </div>
          </div>
        </div>
      `).join('');
    });

    // Update stats
    const statEls = document.querySelectorAll('.hero-stat strong');
    if (statEls[1]) statEls[1].textContent = data.length + '+';

  } catch(e) { console.log('Books load error:', e); }
}

// ══ LOAD SETTINGS ══
async function loadSettings() {
  try {
    const data = await dbQuery('settings', { select: 'key,value' });
    if (!data || data.length === 0) return;
    const s = {};
    data.forEach(r => s[r.key] = r.value);

    // Apply settings
    if (s.site_name) {
      document.title = s.site_name;
      document.querySelectorAll('.nav-logo-text h1').forEach(el => el.textContent = s.site_name);
    }
    // Footer
    const f1 = document.querySelector('.footer-waqf');
    if (f1 && s.footer_line1) f1.textContent = (s.footer_line1 || '') + ' ' + (s.footer_line2 || '');

    // Visibility toggles
    if (s.show_prayer === 'false') document.getElementById('prayer-bar-section')?.style.setProperty('display','none');
    if (s.show_tasbih === 'false') document.getElementById('page-tasbih-page')?.style.setProperty('display','none');

    // Primary color
    if (s.primary_color) {
      document.documentElement.style.setProperty('--em', s.primary_color);
    }

    // Groq API key for AI features
    if (s.api_groq) groqApiKey = s.api_groq;
  } catch(e) { console.log('Settings load error:', e); }
}

// ══ PLAY AUDIO ══
async function playAudio(id, title, sheikh) {
  showToast('جارٍ التحميل...', 'info');
  try {
    const data = await dbQuery('audios', {
      select: 'audio_url,title,sheikhs(name)',
      filter: `id=eq.${id}`,
      limit: 1
    });
    if (!data || !data[0]?.audio_url) { showToast('الملف غير متاح', 'error'); return; }
    const a = data[0];
    showPlayer(a.audio_url, title || a.title, sheikh || a.sheikhs?.name, '🎙');
    // Increment play count
    const cur = await dbQuery('audios', { select: 'play_count', filter: `id=eq.${id}`, limit: 1 });
    const newCount = (cur[0]?.play_count || 0) + 1;
    await dbUpdate('audios', `id=eq.${id}`, { play_count: newCount }).catch(() => {});
    await dbInsert('analytics', { event: 'play', item_id: id, item_type: 'audio' }).catch(() => {});
  } catch(e) {
    showToast('حدث خطأ أثناء التشغيل', 'error');
  }
}


async function downloadAudio(id) {
  showToast('جارٍ التحضير للتحميل...', 'info');
  try {
    const data = await dbQuery('audios', { select: 'audio_url,title', filter: `id=eq.${id}`, limit: 1 });
    if (!data[0]?.audio_url) { showToast('الملف غير متاح', 'error'); return; }
    const url = data[0].audio_url;
    const filename = (data[0].title || 'درس') + '.mp3';
    // Fetch as blob to force download (يمنع فتح الرابط مباشرة)
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(blobUrl); a.remove(); }, 3000);
    } catch {
      // fallback إذا فشل fetch (CORS)
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    showToast('بدأ التحميل ⬇', 'success');
    await dbInsert('analytics', { event: 'download', item_id: id, item_type: 'audio' });
  } catch(e) { showToast('حدث خطأ أثناء التحميل', 'error'); }
}

// ══ DOWNLOAD BOOK ══
async function downloadBook(id, url) {
  if (!url) { showToast('الملف غير متاح', 'error'); return; }
  showToast('جارٍ التحضير...', 'info');
  try {
    // Force download via blob
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = 'كتاب.pdf';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(blobUrl); a.remove(); }, 3000);
    showToast('بدأ تحميل الكتاب ⬇', 'success');
    await dbInsert('analytics', { event: 'download', item_id: id, item_type: 'book' });
  } catch(e) { showToast('حدث خطأ أثناء التحميل', 'error'); }
}

// ══ OPEN AUDIO DETAIL ══
async function openAudioDetail(id) {
  showPage('audio-detail');
  currentDetailId = id;

  // Reset indicator
  const indicator = document.getElementById('detail-now-playing');
  if (indicator) indicator.style.display = 'none';

  try {
    const data = await dbQuery('audios', {
      select: 'id,title,description,audio_url,thumbnail_url,duration,transcript,summary,play_count,created_at,sheikhs(name),categories(name)',
      filter: `id=eq.${id}`,
      limit: 1
    });
    if (!data || !data.length) return;
    const a = data[0];

    currentDetailUrl  = a.audio_url || '';
    currentDetailName = a.title || '';

    // Update header fields
    document.getElementById('detail-title').textContent    = a.title || '—';
    document.getElementById('detail-category').textContent = a.categories?.name || 'درس';
    document.getElementById('detail-sheikh').innerHTML     = `<span class="ic">👤</span> ${a.sheikhs?.name || '—'}`;
    document.getElementById('detail-duration').innerHTML   = `<span class="ic">⏱</span> ${a.duration || '—'}`;
    document.getElementById('detail-plays').innerHTML      = `<span class="ic">🎧</span> ${a.play_count || 0} استماع`;

    if (a.created_at) {
      const d = new Date(a.created_at);
      document.getElementById('detail-date').innerHTML = `<span class="ic">📅</span> ${d.toLocaleDateString('ar-SA',{year:'numeric',month:'long',day:'numeric'})}`;
    }

    // Transcript
    const box = document.getElementById('transcript-box');
    if (box) {
      if (a.transcript) {
        currentTranscript = a.transcript;
        const sentences = a.transcript.split(/(?<=[.،؟!])\s+/).filter(s => s.trim().length > 8);
        box.innerHTML = sentences.length
          ? sentences.map((s, i) => `<span class="transcript-sentence" data-idx="${i}" onclick="seekTo(${i * 30})">${escHtml(s.trim())} </span>`).join('')
          : `<p style="color:var(--text3)">${escHtml(a.transcript)}</p>`;
      } else {
        currentTranscript = '';
        box.innerHTML = '<span style="color:var(--text3)">لا يوجد نص متاح لهذا الدرس</span>';
      }
    }

    // Track view
    await dbInsert('analytics', { event: 'view', item_id: id, item_type: 'audio' }).catch(() => {});
  } catch(e) {
    console.warn('Audio detail error:', e);
  }
}


// ══ LOAD VISIT COUNT ══
async function trackVisit() {
  try {
    await dbInsert('analytics', { event: 'visit', item_type: 'page' });
    // Get total visits for stats display
    // Use aggregate count instead of fetching all rows
    const countRes = await fetch(`${SUPABASE_URL}/rest/v1/analytics?event=eq.visit&select=id`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'count=exact', 'Range-Unit': 'items', 'Range': '0-0' }
    });
    const countHeader = countRes.headers.get('content-range');
    const data = countHeader ? [{ id: 1 }] : [];
    const totalCount = countHeader ? parseInt(countHeader.split('/')[1]) || 0 : 0;
    const statEls = document.querySelectorAll('.hero-stat strong');
    if (statEls[2] && data) {
      statEls[2].textContent = totalCount > 1000 ? (totalCount/1000).toFixed(1)+'K' : totalCount;
    }
  } catch(e) {}
}

// ══ INIT ALL ══
async function initSupabase() {
  // Load everything in parallel
  await Promise.allSettled([
    loadSettings(),
    loadHadithOfDay(),
    loadAudios(),
    loadBooks(),
    loadSheikhs(),
    trackVisit(),
  ]);
  console.log('✅ Supabase loaded successfully');
}

// Start loading
initSupabase();

/* ══ PWA Service Worker ══ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered'))
      .catch(err => console.log('SW failed:', err));
  });
}


// ════════════════════════════════════════
//  AI TOOLS — تلخيص / أسئلة / مقال
// ════════════════════════════════════════
async function showAIResult(type) {
  const resultBox   = document.getElementById('ai-result');
  const titleEl     = document.getElementById('ai-result-title');
  const contentEl   = document.getElementById('ai-result-content');

  if (!resultBox || !titleEl || !contentEl) return;

  // إخفاء النتيجة السابقة وإظهار حالة التحميل
  resultBox.classList.remove('visible');

  if (!currentTranscript) {
    showToast('لا يوجد نص للدرس للمعالجة', 'error');
    return;
  }
  if (!groqApiKey) {
    showToast('مفتاح Groq غير مُضبوط في الإعدادات', 'error');
    return;
  }

  const config = {
    summary:   { title: 'ملخص الدرس',      icon: '⊟', prompt: `قم بتلخيص الدرس الآتي تلخيصاً وافياً ومرتباً بنقاط واضحة باللغة العربية الفصحى:\n\n${currentTranscript}` },
    questions: { title: 'أسئلة مراجعة',    icon: '❓', prompt: `استخرج من الدرس الآتي 10 أسئلة مراجعة متنوعة تغطي أهم النقاط، واذكر الإجابة المختصرة بعد كل سؤال، باللغة العربية الفصحى:\n\n${currentTranscript}` },
    article:   { title: 'مقالة من الدرس',  icon: '📰', prompt: `حوّل الدرس الآتي إلى مقالة علمية منقحة بأسلوب أدبي رصين، مع مقدمة وخاتمة، باللغة العربية الفصحى:\n\n${currentTranscript}` }
  };

  const { title, icon, prompt } = config[type] || config.summary;
  titleEl.textContent = title;
  contentEl.innerHTML = '<span style="color:var(--text3)">⏳ جارٍ المعالجة...</span>';
  resultBox.classList.add('visible');
  resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || '';

    if (!text) throw new Error('لم يُرجع النموذج نتيجة');

    // تحويل النص إلى HTML بسيط (سطر جديد → <br>، **bold** → <strong>)
    const html = escHtml(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    contentEl.innerHTML = `<p style="line-height:1.9;font-size:14px">${html}</p>`;
  } catch(e) {
    contentEl.innerHTML = `<span style="color:#e53e3e">❌ خطأ: ${escHtml(e.message)}</span>`;
    console.warn('AI error:', e);
  }
}

// ════════════════════════════════════════
//  CONTACT MODAL
// ════════════════════════════════════════
function openContactModal() {
  document.getElementById('contact-form').style.display = 'block';
  document.getElementById('contact-success').style.display = 'none';
  document.getElementById('contact-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeContactModal() {
  document.getElementById('contact-modal').classList.remove('open');
  document.body.style.overflow = '';
}

// ════════════════════════════════════════
//  CONTACT FORM — Formspree
// ════════════════════════════════════════
async function submitContact() {
  const name    = document.getElementById('cf-name')?.value.trim();
  const email   = document.getElementById('cf-email')?.value.trim();
  const subject = document.getElementById('cf-subject')?.value;
  const message = document.getElementById('cf-message')?.value.trim();

  if (!name || !email || !message) {
    showToast('يرجى ملء جميع الحقول المطلوبة *', 'error'); return;
  }
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    showToast('البريد الإلكتروني غير صحيح', 'error'); return;
  }

  const btn = document.getElementById('cf-submit');
  btn.innerHTML = '<span style="display:inline-block;animation:spin 1s linear infinite">↻</span> جارٍ الإرسال...';
  btn.disabled = true;

  try {
    const res = await fetch('https://formspree.io/f/xpwzgakq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name, email, subject, message,
        _replyto: email,
        _subject: `[كفاية المؤمن] ${subject} — ${name}`,
      })
    });

    if (res.ok) {
      document.getElementById('contact-form').style.display = 'none';
      document.getElementById('contact-success').style.display = 'block';
    } else {
      throw new Error('فشل الإرسال');
    }
  } catch(e) {
    // Fallback: open mailto
    const body = encodeURIComponent(`من: ${name}\nالبريد: ${email}\n\n${message}`);
    window.location.href = `mailto:majdameen86@gmail.com?subject=${encodeURIComponent('[كفاية المؤمن] ' + subject)}&body=${body}`;
    showToast('تم فتح تطبيق البريد', 'success');
  }

  btn.innerHTML = '<span class="ic">✉</span> إرسال الرسالة';
  btn.disabled = false;
}

// ════════════════════════════════════════
//  HADITH — Daily scheduling check
// ════════════════════════════════════════
async function loadHadithOfDay() {
  try {
    const today = new Date().toISOString().split('T')[0];

    // First: check if there's a scheduled hadith for today
    let data = await dbQuery('hadiths', {
      select: 'text,source,type',
      filter: `schedule_date=eq.${today}`,
      limit: 1
    });

    // If scheduled found, activate it
    if (data && data.length) {
      const h = data[0];
      renderHadith(h.text, h.source);
      // Auto-activate it
      await dbUpdate('hadiths', `schedule_date=eq.${today}`, { is_active: true, schedule_date: null }).catch(() => {});
      return;
    }

    // Fallback: get is_active hadith
    data = await dbQuery('hadiths', {
      select: 'text,source,type',
      filter: 'is_active=eq.true',
      limit: 1
    });

    if (data && data.length) {
      renderHadith(data[0].text, data[0].source);
    }
  } catch(e) { console.warn('Hadith load error:', e); }
}

function renderHadith(text, source) {
  const textEl = document.querySelector('.hadith-text');
  const srcEl  = document.querySelector('.hadith-source');
  if (textEl) textEl.textContent = text || '';
  if (srcEl)  srcEl.textContent  = source || '';
}

// ════════════════════════════════════════
//  SHEIKH CARDS — Profile style
// ════════════════════════════════════════
async function loadSheikhs() {
  try {
    const data = await dbQuery('sheikhs', {
      select: 'id,name,bio,image_url,specialty,twitter',
      limit: 12
    });
    if (!data || !data.length) return;

    const grids = document.querySelectorAll('.sheikhs-grid');
    grids.forEach(grid => {
      grid.innerHTML = data.map(s => {
        const initials = (s.name || '').replace(/الشيخ /g,'').split(' ').map(w=>w[0]).join('').substring(0,2);
        const img = s.image_url
          ? `<img src="${s.image_url}" alt="${escHtml(s.name)}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
          : '';
        return `<div class="sheikh-profile-card" onclick="filterByShikhId('${s.id}','${escHtml(s.name)}')">
          <div class="spcard-cover"></div>
          <div class="spcard-avatar">
            ${img}
            <span class="spcard-initials" style="${s.image_url ? 'display:none' : ''}">${initials}</span>
          </div>
          <div class="spcard-body">
            <h3 class="spcard-name">${escHtml(s.name)}</h3>
            <p class="spcard-spec">${escHtml(s.specialty || s.bio?.substring(0,50) || '')}</p>
            ${s.twitter ? `<a class="spcard-twitter" href="https://twitter.com/${s.twitter.replace('@','')}" target="_blank" onclick="event.stopPropagation()">🐦 ${escHtml(s.twitter)}</a>` : ''}
          </div>
        </div>`;
      }).join('');
    });
  } catch(e) { console.warn('Sheikhs load error:', e); }
}

async function filterByShikhId(id, name) {
  showPage('audios');
  showToast('دروس ' + name, 'info');
  try {
    const data = await dbQuery('audios', {
      select: 'id,title,duration,play_count,thumbnail_url,sheikhs(name),categories(name)',
      filter: `sheikh_id=eq.${id}&is_published=eq.true`,
      order: 'created_at.desc',
      limit: 20
    });
    const grids = document.querySelectorAll('.audios-grid');
    if (data && data.length) {
      grids.forEach(grid => renderAudioCards(grid, data));
    } else {
      grids.forEach(grid => { grid.innerHTML = '<p style="color:var(--text3);padding:40px;text-align:center">لا توجد دروس منشورة لهذا الشيخ</p>'; });
    }
  } catch(e) {}
}

function renderAudioCards(grid, data) {
  grid.innerHTML = data.map(a => `
    <div class="audio-card" onclick="openAudioDetail('${a.id}')">
      <div class="audio-thumb">
        ${a.thumbnail_url ? `<img src="${a.thumbnail_url}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0">` : '<div class="audio-thumb-inner">🎙</div>'}
        <div class="audio-thumb-overlay"></div>
        <div class="audio-play-btn"><span class="ic">▶</span></div>
        <div class="audio-duration">${a.duration || '--:--'}</div>
        <div class="audio-cat"><span class="badge badge-green">${a.categories?.name || 'درس'}</span></div>
      </div>
      <div class="audio-body">
        <h3>${escHtml(a.title)}</h3>
        <div class="audio-meta">
          <span>👤 ${escHtml(a.sheikhs?.name || '—')}</span>
          <span>🎧 ${a.play_count || 0}</span>
        </div>
      </div>
      <div class="audio-footer">
        <button class="btn-play-small" onclick="event.stopPropagation();playAudio('${a.id}','${escHtml(a.title)}','${escHtml(a.sheikhs?.name||'')}')">
          <span class="ic">▶</span> استمع
        </button>
        <button class="btn-download" onclick="event.stopPropagation();downloadAudio('${a.id}')" title="تحميل">
          <span class="ic">⬇</span>
        </button>
      </div>
    </div>
  `).join('');
}

// ════════════════════════════════════════
//  FAVORITES (localStorage)
// ════════════════════════════════════════
function getFavorites() {
  try { return JSON.parse(localStorage.getItem('kifayat_favs') || '[]'); }
  catch { return []; }
}
function toggleFavorite(id, title) {
  let favs = getFavorites();
  const idx = favs.findIndex(f => f.id === id);
  if (idx > -1) {
    favs.splice(idx, 1);
    showToast('تم الإزالة من المفضلة', 'info');
  } else {
    favs.unshift({ id, title, addedAt: new Date().toISOString() });
    showToast('أُضيف للمفضلة ⭐', 'success');
  }
  localStorage.setItem('kifayat_favs', JSON.stringify(favs));
}
function isFavorite(id) { return getFavorites().some(f => f.id === id); }
