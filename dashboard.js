/* ═══════════════════════════════════════════════════════════════
   كفاية المؤمن — dashboard.js
   ═══════════════════════════════════════════════════════════════ */

/* ══ Font Awesome Fallback ══ */
// Test if Font Awesome loaded correctly — if not, try jsDelivr then emoji fallback
(function(){
  const test = document.createElement('span');
  test.className = 'fas fa-home';
  test.style.cssText = 'position:absolute;visibility:hidden;';
  document.head.appendChild(test);
  window.addEventListener('load', function(){
    const w = window.getComputedStyle(test, ':before').content;
    document.head.removeChild(test);
    if (!w || w === 'none' || w === '') {
      // Try jsDelivr fallback
      document.getElementById('fa-backup').href =
        'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css';
      setTimeout(applyEmojiIcons, 2000);
    }
  });
  function applyEmojiIcons(){
    const test2 = document.createElement('span');
    test2.className = 'fas fa-home';
    test2.style.cssText = 'position:absolute;visibility:hidden;';
    document.body.appendChild(test2);
    const w2 = window.getComputedStyle(test2,':before').content;
    document.body.removeChild(test2);
    if (w2 && w2 !== 'none') return; // FA loaded via backup
    const map = {
      'fa-chart-pie':'📊','fa-microphone':'🎙','fa-book-open':'📚','fa-moon':'🌙',
      'fa-user-tie':'👤','fa-tags':'🏷','fa-eye':'👁','fa-cog':'⚙️','fa-info-circle':'ℹ️',
      'fa-bars':'☰','fa-sign-in-alt':'🔓','fa-sign-out-alt':'🔒','fa-save':'💾',
      'fa-plus':'＋','fa-edit':'✏️','fa-trash':'🗑️','fa-times':'✕','fa-check-circle':'✅',
      'fa-exclamation-circle':'⚠️','fa-search':'🔍','fa-sync':'🔄','fa-upload':'⬆️',
      'fa-link':'🔗','fa-music':'🎵','fa-image':'🖼️','fa-file-pdf':'📄',
      'fa-robot':'🤖','fa-plug':'🔌','fa-shield-alt':'🛡️','fa-key':'🔑',
      'fa-lock':'🔒','fa-palette':'🎨','fa-globe':'🌐','fa-share-alt':'📤',
      'fa-spinner':'⏳','fa-headphones':'🎧','fa-download':'⬇️','fa-play':'▶️',
      'fa-chart-bar':'📈','fa-clock':'🕐','fa-external-link-alt':'↗️',
      'fa-microphone-alt':'🎤','fa-book':'📖','fa-star-and-crescent':'☪️',
      'fa-th-large':'⊞','fa-exclamation-triangle':'⚠️','fa-arrow-down':'⬇️',
      'fa-file-alt':'📝','fa-check':'✓','fa-eye-slash':'🙈','fa-trash-alt':'🗑️',
      'fa-circle':'●','fa-tag':'🏷️','fa-user-slash':'🚫','fa-microphone-slash':'🚫',
      'fa-whatsapp':'💬','fa-telegram':'✈️','fa-twitter':'𝕏',
    };
    document.querySelectorAll('i').forEach(el => {
      for (const [k,v] of Object.entries(map)) {
        if (el.className && el.className.includes && el.className.includes(k)) {
          el.textContent = v;
          el.style.fontStyle = 'normal';
          el.style.fontSize = '14px';
          break;
        }
      }
    });
  }
  window._applyEmojiIcons = applyEmojiIcons;
})();

/* ══════════════════════════════════════════════════════════════
   DASHBOARD LOGIC
══════════════════════════════════════════════════════════════ */
// ════════════════════════════════════════
//  SUPABASE CONFIG
// ════════════════════════════════════════
const SUPABASE_URL = 'https://qfmsplotijbnwderzbkv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Wj59blcoBDlLwNifOIsnsQ_4WssBaqb';

const HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

// ── Generic DB helpers ──
async function dbGet(table, params = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { headers: HEADERS });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function dbInsert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST', headers: HEADERS, body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function dbUpdate(table, id, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH', headers: HEADERS, body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function dbUpsert(table, data, onConflict = 'id') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'return=representation,resolution=merge-duplicates' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function dbDelete(table, id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE', headers: HEADERS
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

// ════════════════════════════════════════
//  LOGIN
// ════════════════════════════════════════
// ══ Supabase Auth Login ══
async function doLogin() {
  const email = document.getElementById('login-user').value.trim();
  const password = document.getElementById('login-pass').value.trim();
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');

  if (!email || !password) {
    document.getElementById('login-error-msg').textContent = 'يرجى إدخال البريد الإلكتروني وكلمة المرور';
    errEl.style.display = 'flex';
    return;
  }

  btn.innerHTML = '<span class="spinner"></span> جارٍ التحقق...';
  btn.disabled = true;
  errEl.style.display = 'none';

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error_description || data.msg || 'بيانات الدخول غير صحيحة');
    }

    // Store session token
    sessionStorage.setItem('kifayat_token', data.access_token);
    sessionStorage.setItem('kifayat_admin', '1');

    // Update HEADERS with user token for authorized requests
    HEADERS['Authorization'] = `Bearer ${data.access_token}`;

    document.getElementById('login-screen').style.opacity = '0';
    document.getElementById('login-screen').style.transition = 'opacity .4s';
    setTimeout(() => {
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('app').classList.add('visible');
      initApp();
    }, 400);

  } catch (e) {
    document.getElementById('login-error-msg').textContent = e.message || 'خطأ في تسجيل الدخول';
    errEl.style.display = 'flex';
    btn.innerHTML = '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z"/></svg> دخول';
    btn.disabled = false;
  }
}

async function doLogout() {
  const token = sessionStorage.getItem('kifayat_token');
  if (token) {
    // Sign out from Supabase
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` }
    }).catch(() => {});
  }
  sessionStorage.removeItem('kifayat_admin');
  sessionStorage.removeItem('kifayat_token');
  HEADERS['Authorization'] = `Bearer ${SUPABASE_KEY}`;
  document.getElementById('app').classList.remove('visible');
  document.getElementById('login-screen').style.opacity = '1';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
}

// ════════════════════════════════════════
//  NAVIGATION
// ════════════════════════════════════════
const PAGE_TITLES = {
  dashboard:  ['لوحة الإحصائيات',   'نظرة عامة على الأداء'],
  audios:     ['التسجيلات الصوتية', 'إدارة الدروس والمحاضرات'],
  books:      ['مكتبة الكتب',       'إدارة الكتب والمراجع'],
  hadiths:    ['الأحاديث والأدعية', 'إدارة البطاقات اليومية'],
  sheikhs:    ['الشيوخ',             'إدارة المحاضرين'],
  categories: ['التصنيفات',          'تنظيم المحتوى'],
  visibility: ['إظهار / إخفاء',      'تحكم بما يظهر للزوار'],
  settings:   ['إعدادات الموقع',     'تخصيص هوية الموقع'],
  about:      ['صفحة من نحن',        'تعديل محتوى التعريف'],
};

function showPage(id, el) {
  document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id)?.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  if (PAGE_TITLES[id]) {
    document.getElementById('topbar-title').textContent = PAGE_TITLES[id][0];
    document.getElementById('topbar-sub').textContent   = PAGE_TITLES[id][1];
  }
  closeSidebar();
  loadPageData(id);
}

function loadPageData(id) {
  switch(id) {
    case 'dashboard':  loadDashboard(); break;
    case 'audios':     loadAudios();    break;
    case 'books':      loadBooks();     break;
    case 'hadiths':    loadHadiths();   break;
    case 'sheikhs':    loadSheikhs();   break;
    case 'categories': loadCategories();break;
    case 'visibility': loadVisibility();break;
    case 'settings':   loadSettingsPage();  break;
    case 'about':      loadAbout();     break;
  }
}

// ════════════════════════════════════════
//  INIT
// ════════════════════════════════════════
async function initApp() {
  // Load API keys into memory first (needed for uploads)
  try {
    const keysData = await dbGet('settings',
      'key=in.(api_groq,api_supabase_service,api_cloudinary_name,api_cloudinary_preset)&select=key,value');
    keysData.forEach(r => {
      if (r.key === 'api_groq')              API_KEYS.groq               = r.value;
      if (r.key === 'api_supabase_service')  API_KEYS.supabase_service   = r.value;
      if (r.key === 'api_cloudinary_name')   API_KEYS.cloudinary_name    = r.value;
      if (r.key === 'api_cloudinary_preset') API_KEYS.cloudinary_preset  = r.value;
    });
    // Sync Groq key to localStorage too (legacy)
    if (API_KEYS.groq) localStorage.setItem('groq_api_key', API_KEYS.groq);
  } catch(e) { console.warn('Could not load API keys:', e); }

  // Pre-load dropdowns
  await Promise.all([loadSheikhsDropdown(), loadCategoriesDropdown()]);
  loadDashboard();
}

// ════════════════════════════════════════
//  DASHBOARD
// ════════════════════════════════════════
async function loadDashboard() {
  try {
    const [audios, books, analytics] = await Promise.all([
      dbGet('audios', 'select=id,play_count,title&is_published=eq.true&order=play_count.desc&limit=5'),
      dbGet('books',  'select=id,download_count,title'),
      dbGet('analytics', 'select=event')
    ]);

    // Stats
    const totalListens   = audios.reduce((s,a) => s + (a.play_count||0), 0);
    const totalDownloads = books.reduce((s,b)  => s + (b.download_count||0), 0);
    const totalVisits    = analytics.filter(a => a.event === 'visit').length;
    document.getElementById('stat-listens').textContent   = totalListens.toLocaleString('ar');
    document.getElementById('stat-downloads').textContent = totalDownloads.toLocaleString('ar');
    document.getElementById('stat-visits').textContent    = totalVisits.toLocaleString('ar');
    document.getElementById('stat-audios').textContent    = audios.length;

    // Top audios chart
    const max = audios[0]?.play_count || 1;
    document.getElementById('top-audios-chart').innerHTML = audios.length
      ? audios.map(a => `
          <div class="chart-bar-item">
            <div class="chart-bar-label"><span>${esc(a.title?.substring(0,30))}...</span><span>${a.play_count||0}</span></div>
            <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:${((a.play_count||0)/max*100)}%;background:var(--emerald-glow)"></div></div>
          </div>`)
        .join('')
      : '<div class="empty-state"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/></svg><p>لا توجد بيانات بعد</p></div>';

    // Recent activity
    const recentAnalytics = await dbGet('analytics', 'select=event,item_type,created_at&order=created_at.desc&limit=5');
    const icons = { play:'fas fa-play', download:'fas fa-download', view:'fas fa-eye', visit:'fas fa-home' };
    const colors = { play:'rgba(45,199,122,0.15)', download:'rgba(200,168,75,0.15)', view:'rgba(42,157,212,0.15)', visit:'rgba(10,102,64,0.15)' };
    document.getElementById('recent-activity').innerHTML = recentAnalytics.length
      ? recentAnalytics.map(a => `
          <div class="activity-item">
            <div class="activity-dot" style="background:${colors[a.event]||'rgba(255,255,255,0.05)'}">
              <i class="${icons[a.event]||'fas fa-circle'}" style="color:var(--success)"></i>
            </div>
            <div class="activity-content">
              <strong>${a.event === 'play' ? 'استماع' : a.event === 'download' ? 'تحميل' : a.event === 'view' ? 'مشاهدة' : 'زيارة'}</strong>
              <span>${a.item_type||''} • ${timeAgo(a.created_at)}</span>
            </div>
          </div>`)
        .join('')
      : '<div class="empty-state"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg><p>لا توجد نشاطات بعد</p></div>';

  } catch(e) {
    console.error('Dashboard error:', e);
    showToast('خطأ في تحميل الإحصائيات', 'error');
  }
}

// ════════════════════════════════════════
//  AUDIOS
// ════════════════════════════════════════
async function loadAudios() {
  const tbody = document.getElementById('audios-tbody');
  tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="animation:spin .8s linear infinite"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg><p>جارٍ التحميل...</p></div></td></tr>`;
  try {
    const data = await dbGet('audios', 'select=id,title,duration,play_count,is_published,audio_url,description,thumbnail_url,sheikhs(id,name),categories(id,name)&order=created_at.desc');
    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V6c0-1.66-1.34-3-3-3S9 4.34 9 6v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V12c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-2.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/></svg><p>لا توجد تسجيلات بعد</p></div></td></tr>`;
      return;
    }
    tbody.innerHTML = data.map(a => `
      <tr>
        <td><div class="thumb">🎙</div></td>
        <td>
          <div class="td-title">${esc(a.title)}</div>
          <div class="td-sub">${a.play_count||0} استماع</div>
        </td>
        <td>${esc(a.sheikhs?.name||'—')}</td>
        <td>${esc(a.duration||'—')}</td>
        <td><span class="badge badge-blue">${esc(a.categories?.name||'—')}</span></td>
        <td>${a.play_count||0}</td>
        <td><span class="badge ${a.is_published?'badge-green':'badge-muted'}">${a.is_published?'منشور':'مسودة'}</span></td>
        <td>
          <div class="action-btns">
            <button class="btn btn-outline btn-sm" onclick="editAudio('${a.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>
            <button class="btn btn-danger btn-sm" onclick="confirmDelete('audios','${a.id}','التسجيل: ${esc(a.title)}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" style="color:var(--danger)"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg><p>خطأ في التحميل: ${esc(e.message)}</p></div></td></tr>`;
  }
}

async function saveAudio() {
  const btn = document.getElementById('save-audio-btn');
  const id = document.getElementById('audio-id').value;
  const title = document.getElementById('audio-title').value.trim();
  const audioUrl = document.getElementById('audio-url').value.trim();

  if (!title) { showToast('العنوان مطلوب', 'error'); return; }
  if (!audioUrl) { showToast('رابط الصوت مطلوب', 'error'); return; }
  try { const u = new URL(audioUrl); if (!['http:','https:'].includes(u.protocol)) throw new Error(); } catch { showToast('رابط الصوت غير صحيح، يجب أن يبدأ بـ http أو https', 'error'); return; }

  btn.innerHTML = '<span class="spinner"></span> جارٍ الحفظ...';
  btn.disabled = true;

  const payload = {
    title,
    audio_url:     audioUrl,
    thumbnail_url: document.getElementById('audio-thumb').value.trim() || null,
    duration:      document.getElementById('audio-duration').value.trim() || null,
    description:   document.getElementById('audio-desc').value.trim() || null,
    is_published:  document.getElementById('audio-published').checked,
    sheikh_id:     document.getElementById('audio-sheikh').value || null,
    category_id:   document.getElementById('audio-category').value || null,
  };

  try {
    if (id) {
      await dbUpdate('audios', id, payload);
      showToast('تم تحديث التسجيل بنجاح ✅', 'success');
    } else {
      payload.play_count = 0;
      await dbInsert('audios', payload);
      showToast('تم إضافة التسجيل بنجاح ✅', 'success');
    }
    closeModal('modal-audio');
    loadAudios();
  } catch(e) {
    showToast('خطأ: ' + e.message, 'error');
  }

  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg> حفظ';
  btn.disabled = false;
}

async function editAudio(id) {
  try {
    const data = await dbGet('audios', `id=eq.${id}&select=*&limit=1`);
    const a = data[0];
    document.getElementById('audio-id').value       = a.id;
    document.getElementById('audio-title').value    = a.title || '';
    document.getElementById('audio-url').value      = a.audio_url || '';
    document.getElementById('audio-thumb').value    = a.thumbnail_url || '';
    document.getElementById('audio-duration').value = a.duration || '';
    document.getElementById('audio-desc').value     = a.description || '';
    document.getElementById('audio-published').checked = a.is_published;
    document.getElementById('audio-sheikh').value   = a.sheikh_id || '';
    document.getElementById('audio-category').value = a.category_id || '';
    document.getElementById('audio-modal-title').textContent = 'تعديل التسجيل';
    openModal('modal-audio');
  } catch(e) { showToast('خطأ في التحميل', 'error'); }
}

// ════════════════════════════════════════
//  BOOKS
// ════════════════════════════════════════
const BOOK_COLORS = [
  'linear-gradient(135deg,#0a2e1c,#031e12)',
  'linear-gradient(135deg,#1a3a10,#0a2008)',
  'linear-gradient(135deg,#2a1810,#150c08)',
  'linear-gradient(135deg,#0a1a3a,#060f20)',
  'linear-gradient(135deg,#1a0a2a,#0d0615)',
];
const BOOK_ICONS = ['📕','📗','📙','📘','📓'];

async function loadBooks() {
  const grid = document.getElementById('books-grid');
  grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="animation:spin .8s linear infinite"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg><p>جارٍ التحميل...</p></div>`;
  try {
    const data = await dbGet('books', 'select=*&order=created_at.desc');
    if (!data.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v6a5 5 0 0 0 5 5h3M6 2h3a5 5 0 0 1 5 5v6a5 5 0 0 1-5 5H6"/></svg><p>لا توجد كتب بعد</p></div>`;
      return;
    }
    grid.innerHTML = data.map((b, i) => `
      <div class="book-card">
        <div class="book-cover" style="${b.cover_url ? `background:url(${b.cover_url}) center/cover` : BOOK_COLORS[i % BOOK_COLORS.length]}">
          ${b.cover_url ? '' : BOOK_ICONS[i % BOOK_ICONS.length]}
        </div>
        <div class="book-info">
          <strong>${esc(b.title)}</strong>
          <span>${esc(b.author||'')}</span>
          <div style="margin-top:4px">
            <span class="badge ${b.is_published?'badge-green':'badge-muted'}" style="font-size:10px">${b.is_published?'منشور':'مسودة'}</span>
          </div>
          <div style="margin-top:8px;display:flex;gap:6px">
            <button class="btn btn-outline btn-sm" style="flex:1;font-size:11px" onclick="editBook('${b.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>
            <button class="btn btn-danger btn-sm" style="flex:1;font-size:11px" onclick="confirmDelete('books','${b.id}','الكتاب: ${esc(b.title)}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>
          </div>
        </div>
      </div>
    `).join('') + `
      <div class="book-card" style="border:2px dashed var(--border);background:transparent;display:flex;align-items:center;justify-content:center;min-height:220px;cursor:pointer" onclick="openModal('modal-book')">
        <div style="text-align:center;color:var(--text-muted)">
          <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" style="font-size:28px;margin-bottom:8px;display:block"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          <span style="font-size:13px">إضافة كتاب</span>
        </div>
      </div>`;
  } catch(e) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" style="color:var(--danger)"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg><p>خطأ: ${esc(e.message)}</p></div>`;
  }
}

async function saveBook() {
  const btn = document.getElementById('save-book-btn');
  const id = document.getElementById('book-id').value;
  const title = document.getElementById('book-title').value.trim();
  const author = document.getElementById('book-author').value.trim();
  const pdfUrl = document.getElementById('book-pdf').value.trim();

  if (!title) { showToast('اسم الكتاب مطلوب', 'error'); return; }
  if (!author) { showToast('اسم المؤلف مطلوب', 'error'); return; }
  if (!pdfUrl) { showToast('رابط PDF مطلوب', 'error'); return; }
  try { const u = new URL(pdfUrl); if (!['http:','https:'].includes(u.protocol)) throw new Error(); } catch { showToast('رابط PDF غير صحيح، يجب أن يبدأ بـ http أو https', 'error'); return; }

  btn.innerHTML = '<span class="spinner"></span> جارٍ الحفظ...';
  btn.disabled = true;

  const payload = {
    title,
    author,
    pdf_url:         pdfUrl,
    cover_url:       document.getElementById('book-cover').value.trim() || null,
    description:     document.getElementById('book-desc').value.trim() || null,
    rating:          parseInt(document.getElementById('book-rating').value) || 5,
    is_published:    document.getElementById('book-published').checked,
  };

  try {
    if (id) {
      await dbUpdate('books', id, payload);
      showToast('تم تحديث الكتاب بنجاح ✅', 'success');
    } else {
      payload.download_count = 0;
      await dbInsert('books', payload);
      showToast('تم إضافة الكتاب بنجاح ✅', 'success');
    }
    closeModal('modal-book');
    loadBooks();
  } catch(e) {
    showToast('خطأ: ' + e.message, 'error');
  }

  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg> حفظ';
  btn.disabled = false;
}

async function editBook(id) {
  try {
    const data = await dbGet('books', `id=eq.${id}&select=*&limit=1`);
    const b = data[0];
    document.getElementById('book-id').value      = b.id;
    document.getElementById('book-title').value   = b.title || '';
    document.getElementById('book-author').value  = b.author || '';
    document.getElementById('book-pdf').value     = b.pdf_url || '';
    document.getElementById('book-cover').value   = b.cover_url || '';
    document.getElementById('book-desc').value    = b.description || '';
    document.getElementById('book-rating').value  = b.rating || 5;
    document.getElementById('book-published').checked = b.is_published;
    document.getElementById('book-modal-title').textContent = 'تعديل الكتاب';
    openModal('modal-book');
  } catch(e) { showToast('خطأ في التحميل', 'error'); }
}

// ════════════════════════════════════════
//  HADITHS
// ════════════════════════════════════════
async function loadHadiths() {
  const tbody = document.getElementById('hadiths-tbody');
  tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="animation:spin .8s linear infinite"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg><p>جارٍ التحميل...</p></div></td></tr>`;
  try {
    const data = await dbGet('hadiths', 'select=*&order=created_at.desc');

    // Show active hadith
    const active = data.find(h => h.is_active);
    if (active) {
      document.getElementById('active-hadith-text').textContent   = `«${active.text}»`;
      document.getElementById('active-hadith-source').textContent = active.source || '';
    }

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg><p>لا توجد أحاديث بعد</p></div></td></tr>`;
      return;
    }

    const typeLabels = { hadith: ['badge-blue','حديث'], dua: ['badge-gold','دعاء'], quran: ['badge-green','قرآن'] };
    tbody.innerHTML = data.map(h => {
      const [cls, lbl] = typeLabels[h.type] || ['badge-muted', h.type];
      return `
        <tr>
          <td style="max-width:300px"><div class="td-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc((h.text||'').substring(0,60))}...</div></td>
          <td>${esc(h.source||'—')}</td>
          <td><span class="badge ${cls}">${lbl}</span></td>
          <td>
            <span class="badge ${h.is_active?'badge-green':'badge-muted'}">${h.is_active?'نشط':'غير نشط'}</span>
            ${!h.is_active ? `<button class="btn btn-outline btn-sm" style="margin-right:6px;font-size:11px" onclick="setActiveHadith('${h.id}')">تفعيل</button>` : ''}
          </td>
          <td>
            <div class="action-btns">
              <button class="btn btn-outline btn-sm" onclick="editHadith('${h.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>
              <button class="btn btn-danger btn-sm" onclick="confirmDelete('hadiths','${h.id}','الحديث')"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>
            </div>
          </td>
        </tr>`;
    }).join('');
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" style="color:var(--danger)"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg><p>خطأ: ${esc(e.message)}</p></div></td></tr>`;
  }
}

async function saveHadith() {
  const btn = document.getElementById('save-hadith-btn');
  const id = document.getElementById('hadith-id').value;
  const text = document.getElementById('hadith-text').value.trim();

  if (!text) { showToast('النص مطلوب', 'error'); return; }

  btn.innerHTML = '<span class="spinner"></span> جارٍ الحفظ...';
  btn.disabled = true;

  const isActive = document.getElementById('hadith-active').checked;

  const payload = {
    text,
    source:    document.getElementById('hadith-source').value.trim() || null,
    type:      document.getElementById('hadith-type').value,
    is_active: isActive,
  };

  try {
    // If setting as active, deactivate all others first
    if (isActive) {
      const existing = await dbGet('hadiths', 'is_active=eq.true&select=id');
      for (const h of existing) {
        if (h.id !== id) await dbUpdate('hadiths', h.id, { is_active: false });
      }
    }
    if (id) {
      await dbUpdate('hadiths', id, payload);
      showToast('تم تحديث الحديث بنجاح ✅', 'success');
    } else {
      await dbInsert('hadiths', payload);
      showToast('تم إضافة الحديث بنجاح ✅', 'success');
    }
    closeModal('modal-hadith');
    loadHadiths();
  } catch(e) {
    showToast('خطأ: ' + e.message, 'error');
  }

  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg> حفظ';
  btn.disabled = false;
}

async function setActiveHadith(id) {
  try {
    const all = await dbGet('hadiths', 'is_active=eq.true&select=id');
    for (const h of all) await dbUpdate('hadiths', h.id, { is_active: false });
    await dbUpdate('hadiths', id, { is_active: true });
    showToast('تم تفعيل الحديث ✅', 'success');
    loadHadiths();
  } catch(e) { showToast('خطأ: ' + e.message, 'error'); }
}

async function editHadith(id) {
  try {
    const data = await dbGet('hadiths', `id=eq.${id}&select=*&limit=1`);
    const h = data[0];
    document.getElementById('hadith-id').value      = h.id;
    document.getElementById('hadith-text').value    = h.text || '';
    document.getElementById('hadith-source').value  = h.source || '';
    document.getElementById('hadith-type').value    = h.type || 'hadith';
    document.getElementById('hadith-active').checked = h.is_active;
    document.getElementById('hadith-modal-title').textContent = 'تعديل الحديث';
    openModal('modal-hadith');
  } catch(e) { showToast('خطأ في التحميل', 'error'); }
}

// ════════════════════════════════════════
//  SHEIKHS
// ════════════════════════════════════════
async function loadSheikhs() {
  const grid = document.getElementById('sheikhs-grid');
  grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="animation:spin .8s linear infinite"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg><p>جارٍ التحميل...</p></div>`;
  try {
    const data = await dbGet('sheikhs', 'select=*&order=created_at.desc');
    if (!data.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg><p>لا يوجد شيوخ بعد</p></div>`;
      return;
    }
    grid.innerHTML = data.map(s => `
      <div class="sheikh-card">
        <div class="sheikh-avatar">
          ${s.image_url
            ? `<img src="${s.image_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`
            : esc((s.name||'?').charAt(s.name.indexOf(' ')+1) || s.name.charAt(0))}
        </div>
        <strong>${esc(s.name)}</strong>
        <span>${esc((s.bio||'').substring(0,40))}${(s.bio||'').length>40?'...':''}</span>
        <div style="margin-top:12px;display:flex;gap:6px;justify-content:center">
          <button class="btn btn-outline btn-sm" onclick="editSheikh('${s.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>
          <button class="btn btn-danger btn-sm" onclick="confirmDelete('sheikhs','${s.id}','الشيخ: ${esc(s.name)}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>
        </div>
      </div>
    `).join('') + `
      <div class="sheikh-card" style="border:2px dashed var(--border);background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;min-height:180px" onclick="openModal('modal-sheikh')">
        <div style="text-align:center;color:var(--text-muted)">
          <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" style="font-size:24px;margin-bottom:8px;display:block"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          <span style="font-size:13px">إضافة شيخ</span>
        </div>
      </div>`;
  } catch(e) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" style="color:var(--danger)"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg><p>خطأ: ${esc(e.message)}</p></div>`;
  }
}

async function saveSheikh() {
  const btn = document.getElementById('save-sheikh-btn');
  const id = document.getElementById('sheikh-id').value;
  const name = document.getElementById('sheikh-name').value.trim();
  if (!name) { showToast('الاسم مطلوب', 'error'); return; }

  btn.innerHTML = '<span class="spinner"></span> جارٍ الحفظ...';
  btn.disabled = true;

  const payload = {
    name,
    bio:       document.getElementById('sheikh-bio').value.trim() || null,
    image_url: document.getElementById('sheikh-image').value.trim() || null,
  };

  try {
    if (id) {
      await dbUpdate('sheikhs', id, payload);
      showToast('تم تحديث الشيخ بنجاح ✅', 'success');
    } else {
      await dbInsert('sheikhs', payload);
      showToast('تم إضافة الشيخ بنجاح ✅', 'success');
    }
    closeModal('modal-sheikh');
    loadSheikhs();
    loadSheikhsDropdown();
  } catch(e) {
    showToast('خطأ: ' + e.message, 'error');
  }

  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg> حفظ';
  btn.disabled = false;
}

async function editSheikh(id) {
  try {
    const data = await dbGet('sheikhs', `id=eq.${id}&select=*&limit=1`);
    const s = data[0];
    document.getElementById('sheikh-id').value    = s.id;
    document.getElementById('sheikh-name').value  = s.name || '';
    document.getElementById('sheikh-bio').value   = s.bio || '';
    document.getElementById('sheikh-image').value = s.image_url || '';
    document.getElementById('sheikh-modal-title').textContent = 'تعديل الشيخ';
    openModal('modal-sheikh');
  } catch(e) { showToast('خطأ في التحميل', 'error'); }
}

async function loadSheikhsDropdown() {
  try {
    const data = await dbGet('sheikhs', 'select=id,name&order=name');
    const sel = document.getElementById('audio-sheikh');
    const current = sel.value;
    sel.innerHTML = '<option value="">— اختر الشيخ —</option>' +
      data.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
    if (current) sel.value = current;
  } catch(e) {}
}

// ════════════════════════════════════════
//  CATEGORIES
// ════════════════════════════════════════
async function loadCategories() {
  const list = document.getElementById('categories-list');
  list.innerHTML = `<div class="empty-state"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="animation:spin .8s linear infinite"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg><p>جارٍ التحميل...</p></div>`;
  try {
    const data = await dbGet('categories', 'select=*&order=name');
    if (!data.length) {
      list.innerHTML = `<div class="empty-state"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16zM7 13c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg><p>لا توجد تصنيفات بعد</p></div>`;
      return;
    }
    list.innerHTML = data.map(c => `
      <div class="toggle-wrap" style="border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:8px">
        <div class="toggle-info">
          <strong>${c.icon||'🏷'} ${esc(c.name)}</strong>
        </div>
        <div class="action-btns">
          <button class="btn btn-outline btn-sm" onclick="editCategory('${c.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>
          <button class="btn btn-danger btn-sm" onclick="confirmDelete('categories','${c.id}','التصنيف: ${esc(c.name)}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>
        </div>
      </div>
    `).join('');
  } catch(e) {
    list.innerHTML = `<div class="empty-state"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" style="color:var(--danger)"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg><p>خطأ: ${esc(e.message)}</p></div>`;
  }
}

async function saveCategory() {
  const btn = document.getElementById('save-cat-btn');
  const id = document.getElementById('cat-id').value;
  const name = document.getElementById('cat-name').value.trim();
  if (!name) { showToast('الاسم مطلوب', 'error'); return; }

  btn.innerHTML = '<span class="spinner"></span> جارٍ الحفظ...';
  btn.disabled = true;

  const payload = {
    name,
    icon: document.getElementById('cat-icon').value.trim() || '🏷',
  };

  try {
    if (id) {
      await dbUpdate('categories', id, payload);
      showToast('تم تحديث التصنيف ✅', 'success');
    } else {
      await dbInsert('categories', payload);
      showToast('تم إضافة التصنيف ✅', 'success');
    }
    closeModal('modal-category');
    loadCategories();
    loadCategoriesDropdown();
  } catch(e) {
    showToast('خطأ: ' + e.message, 'error');
  }

  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg> حفظ';
  btn.disabled = false;
}

async function editCategory(id) {
  try {
    const data = await dbGet('categories', `id=eq.${id}&select=*&limit=1`);
    const c = data[0];
    document.getElementById('cat-id').value   = c.id;
    document.getElementById('cat-name').value = c.name || '';
    document.getElementById('cat-icon').value = c.icon || '';
    document.getElementById('cat-modal-title').textContent = 'تعديل التصنيف';
    openModal('modal-category');
  } catch(e) { showToast('خطأ في التحميل', 'error'); }
}

async function loadCategoriesDropdown() {
  try {
    const data = await dbGet('categories', 'select=id,name&order=name');
    const sel = document.getElementById('audio-category');
    const current = sel.value;
    sel.innerHTML = '<option value="">— اختر التصنيف —</option>' +
      data.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
    if (current) sel.value = current;
  } catch(e) {}
}

// ════════════════════════════════════════
//  SETTINGS
// ════════════════════════════════════════

// Visibility settings
const VISIBILITY_KEYS = [
  'toggle-hadith-card','toggle-latest-audios','toggle-latest-books','toggle-top-audios',
  'toggle-prayer','toggle-tasbih','toggle-islamic-event',
  'toggle-stt','toggle-summary','toggle-questions','toggle-article',
  'toggle-audios-section','toggle-books-section','toggle-sheikhs-section','toggle-about-section'
];

async function loadVisibility() {
  try {
    const keyList = VISIBILITY_KEYS.join(',');
    const data = await dbGet('settings', `key=in.(${keyList})&select=key,value`);
    const cfg = {};
    data.forEach(r => cfg[r.key] = r.value);
    VISIBILITY_KEYS.forEach(k => {
      const el = document.getElementById(k);
      if (el && cfg[k] !== undefined) el.checked = cfg[k] === 'true';
    });
  } catch(e) { /* use defaults */ }
}

async function saveVisibilitySettings() {
  const btn = document.getElementById('save-visibility-btn');
  btn.innerHTML = '<span class="spinner"></span> جارٍ الحفظ...';
  btn.disabled = true;

  try {
    const rows = VISIBILITY_KEYS.map(k => ({
      key: k,
      value: document.getElementById(k)?.checked ? 'true' : 'false'
    }));
    await dbUpsert('settings', rows, 'key');
    showToast('تم حفظ إعدادات الظهور ✅', 'success');
  } catch(e) {
    showToast('خطأ: ' + e.message, 'error');
  }

  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg> حفظ';
  btn.disabled = false;
}

// Main settings
// ── In-memory cache for API keys (loaded once per session) ──
const API_KEYS = { groq: '', supabase_service: '', cloudinary_name: '', cloudinary_preset: '' };

async function loadSettingsPage() {
  try {
    const data = await dbGet('settings',
      'key=in.(site_name,site_desc,email,primary_color,whatsapp,telegram,twitter,api_groq,api_supabase_service,api_cloudinary_name,api_cloudinary_preset)&select=key,value');
    const cfg = {};
    data.forEach(r => cfg[r.key] = r.value);

    if (cfg.site_name)    document.getElementById('s-site-name').value = cfg.site_name;
    if (cfg.site_desc)    document.getElementById('s-site-desc').value = cfg.site_desc;
    if (cfg.email)        document.getElementById('s-email').value     = cfg.email;
    if (cfg.whatsapp)     document.getElementById('s-whatsapp').value  = cfg.whatsapp;
    if (cfg.telegram)     document.getElementById('s-telegram').value  = cfg.telegram;
    if (cfg.twitter)      document.getElementById('s-twitter').value   = cfg.twitter;
    if (cfg.primary_color) {
      document.getElementById('s-color').value = cfg.primary_color;
      document.querySelectorAll('.color-swatch').forEach(s => {
        s.classList.toggle('selected', s.dataset.color === cfg.primary_color);
      });
    }

    // ── Load API keys into cache + fields ──
    if (cfg.api_groq) {
      API_KEYS.groq = cfg.api_groq;
      document.getElementById('s-groq-key').value = cfg.api_groq;
      updateKeyBadge('groq-key-badge', true);
      // Sync with Whisper modal field
      const wf = document.getElementById('groq-api-key');
      if (wf && !wf.value) wf.value = cfg.api_groq;
    }
    if (cfg.api_supabase_service) {
      API_KEYS.supabase_service = cfg.api_supabase_service;
      document.getElementById('s-supabase-service-key').value = cfg.api_supabase_service;
      updateKeyBadge('supabase-key-badge', true);
    }
    if (cfg.api_cloudinary_name) {
      API_KEYS.cloudinary_name = cfg.api_cloudinary_name;
      document.getElementById('s-cloudinary-name').value = cfg.api_cloudinary_name;
    }
    if (cfg.api_cloudinary_preset) {
      API_KEYS.cloudinary_preset = cfg.api_cloudinary_preset;
      document.getElementById('s-cloudinary-preset').value = cfg.api_cloudinary_preset;
    }

    // Update overall badge
    const allSet = cfg.api_groq && cfg.api_supabase_service && cfg.api_cloudinary_name;
    updateKeyBadge('api-keys-status', allSet, allSet ? 'مضبوطة ✅' : 'ناقصة ⚠️');
    if (cfg.api_cloudinary_name && cfg.api_cloudinary_preset)
      updateKeyBadge('cloudinary-badge', true);

  } catch(e) { console.warn('Settings load error:', e); }
}

function updateKeyBadge(id, ok, label) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className  = ok ? 'badge badge-green' : 'badge badge-muted';
  if (label) el.textContent = label;
  else el.textContent = ok ? 'مضبوط ✅' : 'غير مضبوط';
}

function toggleKeyVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  const isPass = input.type === 'password';
  input.type = isPass ? 'text' : 'password';
  const btnSvg = btn.querySelector('svg, i');
  if (btnSvg) btnSvg.innerHTML = isPass
    ? '<path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.82l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.74-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>'
    : '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>';
}

async function testGroqKey() {
  const key = document.getElementById('s-groq-key').value.trim();
  const res  = document.getElementById('groq-test-result');
  if (!key) { showToast('أدخل المفتاح أولاً', 'error'); return; }

  res.style.display = 'inline';
  res.style.color   = 'var(--text-muted)';
  res.textContent   = '⏳ جارٍ الاختبار...';

  try {
    const r = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    if (r.ok) {
      res.textContent = '✅ الاتصال ناجح!';
      res.style.color = 'var(--success)';
      updateKeyBadge('groq-key-badge', true);
    } else {
      throw new Error('مفتاح غير صالح');
    }
  } catch(e) {
    res.textContent = '❌ ' + e.message;
    res.style.color = 'var(--danger)';
  }
  res.style.display = 'inline';
}

async function saveSettings() {
  const btn = document.getElementById('save-settings-btn');
  btn.innerHTML = '<span class="spinner"></span> جارٍ الحفظ...';
  btn.disabled = true;

  try {
    const newPass     = document.getElementById('s-new-pass').value.trim();
    const confirmPass = document.getElementById('s-confirm-pass').value.trim();
    if (newPass && newPass !== confirmPass) {
      showToast('كلمتا المرور غير متطابقتان', 'error');
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg> حفظ التغييرات';
      btn.disabled = false;
      return;
    }

    // ── Collect all settings including API keys ──
    const groqKey       = document.getElementById('s-groq-key').value.trim();
    const serviceKey    = document.getElementById('s-supabase-service-key').value.trim();
    const cloudName     = document.getElementById('s-cloudinary-name').value.trim();
    const cloudPreset   = document.getElementById('s-cloudinary-preset').value.trim();

    const rows = [
      { key: 'site_name',     value: document.getElementById('s-site-name').value.trim() },
      { key: 'site_desc',     value: document.getElementById('s-site-desc').value.trim() },
      { key: 'email',         value: document.getElementById('s-email').value.trim() },
      { key: 'primary_color', value: document.getElementById('s-color').value },
      { key: 'whatsapp',      value: document.getElementById('s-whatsapp').value.trim() },
      { key: 'telegram',      value: document.getElementById('s-telegram').value.trim() },
      { key: 'twitter',       value: document.getElementById('s-twitter').value.trim() },
    ].filter(r => r.value);

    if (newPass)      rows.push({ key: 'admin_pass',              value: newPass });
    if (groqKey)      rows.push({ key: 'api_groq',                value: groqKey });
    if (serviceKey)   rows.push({ key: 'api_supabase_service',    value: serviceKey });
    if (cloudName)    rows.push({ key: 'api_cloudinary_name',     value: cloudName });
    if (cloudPreset)  rows.push({ key: 'api_cloudinary_preset',   value: cloudPreset });

    await dbUpsert('settings', rows, 'key');

    // ── Update in-memory cache ──
    if (groqKey)    { API_KEYS.groq = groqKey;
                      const wf = document.getElementById('groq-api-key');
                      if (wf) wf.value = groqKey; }
    if (serviceKey) { API_KEYS.supabase_service = serviceKey; }
    if (cloudName)  { API_KEYS.cloudinary_name = cloudName; }
    if (cloudPreset){ API_KEYS.cloudinary_preset = cloudPreset; }

    // Update badges
    if (groqKey)    updateKeyBadge('groq-key-badge', true);
    if (serviceKey) updateKeyBadge('supabase-key-badge', true);
    if (cloudName && cloudPreset) updateKeyBadge('cloudinary-badge', true);
    const allSet = groqKey && serviceKey && cloudName;
    updateKeyBadge('api-keys-status', allSet, allSet ? 'مضبوطة ✅' : 'ناقصة ⚠️');

    showToast('تم حفظ جميع الإعدادات بنجاح ✅', 'success');
    document.getElementById('s-new-pass').value     = '';
    document.getElementById('s-confirm-pass').value = '';

  } catch(e) {
    showToast('خطأ: ' + e.message, 'error');
  }

  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg> حفظ التغييرات';
  btn.disabled = false;
}

// About page
async function loadAbout() {
  try {
    const data = await dbGet('settings', 'key=in.(about_title,about_text,footer_line1,footer_line2)&select=key,value');
    const cfg = {};
    data.forEach(r => cfg[r.key] = r.value);
    if (cfg.about_title) document.getElementById('about-title').value  = cfg.about_title;
    if (cfg.about_text)  document.getElementById('about-text').value   = cfg.about_text;
    if (cfg.footer_line1) document.getElementById('footer-line1').value = cfg.footer_line1;
    if (cfg.footer_line2) document.getElementById('footer-line2').value = cfg.footer_line2;
  } catch(e) {}
}

async function saveAbout() {
  const btn = document.getElementById('save-about-btn');
  btn.innerHTML = '<span class="spinner"></span> جارٍ الحفظ...';
  btn.disabled = true;

  try {
    const rows = [
      { key: 'about_title',  value: document.getElementById('about-title').value.trim() },
      { key: 'about_text',   value: document.getElementById('about-text').value.trim() },
      { key: 'footer_line1', value: document.getElementById('footer-line1').value.trim() },
      { key: 'footer_line2', value: document.getElementById('footer-line2').value.trim() },
    ].filter(r => r.value);
    await dbUpsert('settings', rows, 'key');
    showToast('تم حفظ الصفحة بنجاح ✅', 'success');
  } catch(e) {
    showToast('خطأ: ' + e.message, 'error');
  }

  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg> حفظ';
  btn.disabled = false;
}

// ════════════════════════════════════════
//  DELETE
// ════════════════════════════════════════
let _deleteTable = null, _deleteId = null;

function confirmDelete(table, id, label) {
  _deleteTable = table;
  _deleteId    = id;
  document.getElementById('confirm-msg').textContent = `هل أنت متأكد من حذف: "${label}"؟ لا يمكن التراجع.`;
  document.getElementById('confirm-overlay').classList.add('open');
  document.getElementById('confirm-yes-btn').onclick = async () => {
    await doDelete();
  };
}

async function doDelete() {
  const btn = document.getElementById('confirm-yes-btn');
  btn.innerHTML = '<span class="spinner"></span> جارٍ الحذف...';
  btn.disabled = true;
  try {
    await dbDelete(_deleteTable, _deleteId);
    showToast('تم الحذف بنجاح ✅', 'success');
    closeConfirm();
    // Reload current page
    const active = document.querySelector('.nav-item.active');
    const page = document.querySelector('.page-content.active');
    if (page) loadPageData(page.id.replace('page-',''));
  } catch(e) {
    showToast('خطأ في الحذف: ' + e.message, 'error');
    btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg> نعم، احذف';
    btn.disabled = false;
  }
}

function closeConfirm() {
  document.getElementById('confirm-overlay').classList.remove('open');
  _deleteTable = null;
  _deleteId = null;
}

// ════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════
function openModal(id) {
  document.getElementById(id).classList.add('open');
  // Auto-fill Groq key from cache when opening audio modal
  if (id === 'modal-audio' && API_KEYS.groq) {
    const gf = document.getElementById('groq-api-key');
    if (gf && !gf.value) gf.value = API_KEYS.groq;
  }
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  // Reset hidden IDs and titles
  const idInputs = { 'modal-audio':'audio-id', 'modal-book':'book-id', 'modal-hadith':'hadith-id', 'modal-sheikh':'sheikh-id', 'modal-category':'cat-id' };
  const titleEls = { 'modal-audio':'audio-modal-title', 'modal-book':'book-modal-title', 'modal-hadith':'hadith-modal-title', 'modal-sheikh':'sheikh-modal-title', 'modal-category':'cat-modal-title' };
  const defaults = { 'modal-audio':'إضافة تسجيل صوتي', 'modal-book':'إضافة كتاب جديد', 'modal-hadith':'إضافة حديث أو دعاء', 'modal-sheikh':'إضافة شيخ', 'modal-category':'إضافة تصنيف' };
  if (idInputs[id]) document.getElementById(idInputs[id]).value = '';
  if (titleEls[id] && defaults[id]) document.getElementById(titleEls[id]).textContent = defaults[id];
}

document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m && m.id) closeModal(m.id); });
});

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.className = 'toast ' + type + ' show';
  const ti = t.querySelector('i, svg');
  if (ti) ti.innerHTML = type === 'success'
    ? '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>'
    : '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>';
  setTimeout(() => t.classList.remove('show'), 3500);
}

function filterTable(tbodyId, inputId) {
  const q = document.getElementById(inputId).value.toLowerCase();
  document.querySelectorAll(`#${tbodyId} tr`).forEach(tr => {
    tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
}

document.querySelectorAll('.color-swatch').forEach(s => {
  s.addEventListener('click', () => {
    document.querySelectorAll('.color-swatch').forEach(x => x.classList.remove('selected'));
    s.classList.add('selected');
    document.getElementById('s-color').value = s.dataset.color;
  });
});

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)   return 'منذ لحظات';
  if (diff < 3600) return `منذ ${Math.floor(diff/60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff/3600)} ساعة`;
  return `منذ ${Math.floor(diff/86400)} يوم`;
}

// Enter key on login
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('login-screen').style.display !== 'none') doLogin();
});

// Auto-login: validate stored token with Supabase Auth
(async function checkSession() {
  const storedToken = sessionStorage.getItem('kifayat_token');
  if (!storedToken) return; // no session → show login screen

  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${storedToken}` }
    });
    if (r.ok) {
      // Valid token → update headers and enter dashboard
      HEADERS['Authorization'] = `Bearer ${storedToken}`;
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('app').classList.add('visible');
      initApp();
    } else {
      // Token expired → clear session
      sessionStorage.removeItem('kifayat_token');
      sessionStorage.removeItem('kifayat_admin');
    }
  } catch(e) {
    // Network error → clear session to be safe
    sessionStorage.removeItem('kifayat_token');
    sessionStorage.removeItem('kifayat_admin');
  }
})();

// ════════════════════════════════════════
//  SUPABASE STORAGE UPLOAD
// ════════════════════════════════════════
const STORAGE_BUCKET_AUDIO  = 'audios';
const STORAGE_BUCKET_IMAGES = 'images';
const STORAGE_BUCKET_BOOKS  = 'books';

// ════════════════════════════════════════
//  SMART UPLOAD — Supabase Storage (audio/pdf) + Cloudinary (images)
// ════════════════════════════════════════

// Upload audio/PDF → Supabase Storage (uses Service Role key if available)
async function uploadToStorage(bucket, file, folder = '') {
  const uploadKey = API_KEYS.supabase_service || SUPABASE_KEY;
  const ext       = file.name.split('.').pop().toLowerCase();
  const filename  = `${folder ? folder+'/' : ''}${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const url       = `${SUPABASE_URL}/storage/v1/object/${bucket}/${filename}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('apikey',        uploadKey);
    xhr.setRequestHeader('Authorization', `Bearer ${uploadKey}`);
    xhr.setRequestHeader('Content-Type',  file.type || 'application/octet-stream');
    xhr.setRequestHeader('x-upsert',      'true');

    if (uploadToStorage._onProgress) {
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) uploadToStorage._onProgress(Math.round(e.loaded / e.total * 100));
      };
    }

    xhr.onload = () => {
      uploadToStorage._onProgress = null;
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(`${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filename}`);
      } else {
        let msg = `فشل الرفع (${xhr.status})`;
        try { const j = JSON.parse(xhr.responseText); msg = j.message || j.error || msg; } catch(_){}
        if (xhr.status === 400 && msg.includes('Bucket')) {
          msg += ' — تأكد من إنشاء الـ bucket في Supabase Storage';
        } else if (xhr.status === 403) {
          msg = 'صلاحيات غير كافية — أضف Service Role Key في الإعدادات';
        }
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => { uploadToStorage._onProgress = null; reject(new Error('خطأ في الاتصال بـ Supabase Storage')); };
    xhr.send(file);
  });
}

// Upload image → Cloudinary (if configured) or Supabase Storage as fallback
async function uploadImage(file, folder = '') {
  const cloudName   = API_KEYS.cloudinary_name;
  const cloudPreset = API_KEYS.cloudinary_preset;

  // ── Cloudinary path ──
  if (cloudName && cloudPreset) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file',           file);
      formData.append('upload_preset',  cloudPreset);
      formData.append('folder',         `kifayat/${folder}`);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

      if (uploadToStorage._onProgress) {
        xhr.upload.onprogress = e => {
          if (e.lengthComputable) uploadToStorage._onProgress(Math.round(e.loaded / e.total * 100));
        };
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          resolve(data.secure_url);
        } else {
          let msg = 'فشل الرفع إلى Cloudinary';
          try { msg = JSON.parse(xhr.responseText).error?.message || msg; } catch(_){}
          reject(new Error(msg));
        }
      };
      xhr.onerror = () => reject(new Error('خطأ في الاتصال بـ Cloudinary'));
      xhr.send(formData);
    });
  }

  // ── Supabase fallback ──
  return uploadToStorage('images', file, folder);
}

// ── Audio file handling ──
let _audioFile = null;
let _thumbFile = null;

function handleAudioFileSelect(input) {
  const file = input.files[0];
  if (!file) return;
  _audioFile = file;
  document.getElementById('audio-upload-filename').textContent = file.name;
  document.getElementById('audio-upload-progress').style.display = 'block';
  document.getElementById('audio-upload-done').style.display = 'none';
  document.getElementById('audio-upload-pct').textContent = '— جاهز للرفع عند الحفظ';
  document.getElementById('audio-upload-bar').style.width = '0%';
  // Auto-detect duration
  const blobUrl = URL.createObjectURL(file);
  const audio = new Audio(blobUrl);
  audio.onloadedmetadata = () => {
    const s = Math.floor(audio.duration);
    const m = Math.floor(s/60), sec = s%60;
    document.getElementById('audio-duration').value = `${m}:${String(sec).padStart(2,'0')}`;
    URL.revokeObjectURL(blobUrl);
  };
}

function handleThumbFileSelect(input) {
  const file = input.files[0];
  if (!file) return;
  _thumbFile = file;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('thumb-preview-img').src = e.target.result;
    document.getElementById('thumb-preview-name').textContent = file.name;
    document.getElementById('thumb-preview-wrap').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

// ── Book file handling ──
let _pdfFile   = null;
let _coverFile = null;

function handlePdfFileSelect(input) {
  const file = input.files[0];
  if (!file) return;
  _pdfFile = file;
  document.getElementById('pdf-upload-filename').textContent = file.name;
  document.getElementById('pdf-upload-progress').style.display = 'block';
  document.getElementById('pdf-upload-done').style.display = 'none';
  document.getElementById('pdf-upload-pct').textContent = '— جاهز للرفع';
}

function handleCoverFileSelect(input) {
  const file = input.files[0];
  if (!file) return;
  _coverFile = file;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('cover-preview-img').src = e.target.result;
    document.getElementById('cover-preview-name').textContent = file.name;
    document.getElementById('cover-preview-wrap').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

// ── Tab switchers ──
function switchAudioTab(tab) {
  const isUpload = tab === 'upload';
  document.getElementById('audio-panel-upload').style.display = isUpload ? 'block' : 'none';
  document.getElementById('audio-panel-url').style.display   = isUpload ? 'none'  : 'block';
  document.getElementById('audio-tab-upload').style.background = isUpload ? 'var(--emerald-dark)' : 'rgba(255,255,255,0.04)';
  document.getElementById('audio-tab-upload').style.color    = isUpload ? 'white' : 'var(--text-muted)';
  document.getElementById('audio-tab-url').style.background  = isUpload ? 'rgba(255,255,255,0.04)' : 'var(--emerald-dark)';
  document.getElementById('audio-tab-url').style.color       = isUpload ? 'var(--text-muted)' : 'white';
}
function switchThumbTab(tab) {
  const isUpload = tab === 'upload';
  document.getElementById('thumb-panel-upload').style.display = isUpload ? 'block' : 'none';
  document.getElementById('thumb-panel-url').style.display    = isUpload ? 'none'  : 'block';
  document.getElementById('thumb-tab-upload').style.background = isUpload ? 'var(--emerald-dark)' : 'rgba(255,255,255,0.04)';
  document.getElementById('thumb-tab-upload').style.color     = isUpload ? 'white' : 'var(--text-muted)';
  document.getElementById('thumb-tab-url').style.background   = isUpload ? 'rgba(255,255,255,0.04)' : 'var(--emerald-dark)';
  document.getElementById('thumb-tab-url').style.color        = isUpload ? 'var(--text-muted)' : 'white';
}
function switchPdfTab(tab) {
  const isUpload = tab === 'upload';
  document.getElementById('pdf-panel-upload').style.display = isUpload ? 'block' : 'none';
  document.getElementById('pdf-panel-url').style.display    = isUpload ? 'none'  : 'block';
  document.getElementById('pdf-tab-upload').style.background = isUpload ? 'rgba(224,82,82,0.3)' : 'rgba(255,255,255,0.04)';
  document.getElementById('pdf-tab-upload').style.color     = isUpload ? 'white' : 'var(--text-muted)';
  document.getElementById('pdf-tab-url').style.background   = isUpload ? 'rgba(255,255,255,0.04)' : 'rgba(224,82,82,0.3)';
  document.getElementById('pdf-tab-url').style.color        = isUpload ? 'var(--text-muted)' : 'white';
}
function switchCoverTab(tab) {
  const isUpload = tab === 'upload';
  document.getElementById('cover-panel-upload').style.display = isUpload ? 'block' : 'none';
  document.getElementById('cover-panel-url').style.display    = isUpload ? 'none'  : 'block';
  document.getElementById('cover-tab-upload').style.background = isUpload ? 'rgba(200,168,75,0.3)' : 'rgba(255,255,255,0.04)';
  document.getElementById('cover-tab-upload').style.color     = isUpload ? 'white' : 'var(--text-muted)';
  document.getElementById('cover-tab-url').style.background   = isUpload ? 'rgba(255,255,255,0.04)' : 'rgba(200,168,75,0.3)';
  document.getElementById('cover-tab-url').style.color        = isUpload ? 'var(--text-muted)' : 'white';
}

// ── Groq key persistence ──
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('groq_api_key');
  if (saved) document.getElementById('groq-api-key').value = saved;
});
document.getElementById('audio-do-transcribe').addEventListener('change', function() {
  document.getElementById('groq-key-wrap').style.display = this.checked ? 'block' : 'none';
});

// ════════════════════════════════════════
//  WHISPER TRANSCRIPTION (Groq)
// ════════════════════════════════════════
async function transcribeWithGroq(file, apiKey) {
  const resultBox   = document.getElementById('transcription-result');
  const textArea    = document.getElementById('audio-transcript-text');
  const statsEl     = document.getElementById('transcription-stats');

  resultBox.style.display = 'block';
  textArea.value = '';
  statsEl.textContent = '⏳ جارٍ التحويل... قد يستغرق دقيقة أو أكثر حسب حجم الملف';

  // Save key
  localStorage.setItem('groq_api_key', apiKey);

  // Groq has 25MB limit — warn if larger
  if (file.size > 25 * 1024 * 1024) {
    statsEl.textContent = '⚠️ الملف أكبر من 25MB. سيتم تقسيمه تلقائياً (قيد التطوير). جرّب ملفاً أصغر حالياً.';
    return null;
  }

  const formData = new FormData();
  formData.append('file', file, file.name);
  formData.append('model', 'whisper-large-v3');
  formData.append('language', 'ar');
  formData.append('response_format', 'verbose_json');

  try {
    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `خطأ ${res.status}`);
    }

    const data = await res.json();
    const text = data.text || '';
    const words = text.split(/\s+/).filter(Boolean).length;
    const duration = data.duration ? `${Math.floor(data.duration/60)}:${String(Math.floor(data.duration%60)).padStart(2,'0')}` : '—';

    textArea.value = text;
    statsEl.textContent = `✅ اكتمل التحويل — ${words.toLocaleString('ar')} كلمة — مدة الصوت: ${duration}`;

    // Auto-fill duration if empty
    if (data.duration && !document.getElementById('audio-duration').value) {
      document.getElementById('audio-duration').value = duration;
    }

    return text;
  } catch(e) {
    statsEl.textContent = `❌ فشل التحويل: ${e.message}`;
    showToast('فشل تحويل الصوت: ' + e.message, 'error');
    return null;
  }
}

// ════════════════════════════════════════
//  OVERRIDE saveAudio WITH UPLOAD SUPPORT
// ════════════════════════════════════════
// Remove old saveAudio and replace:
const _origSaveAudio = window.saveAudio;
window.saveAudio = async function() {
  const btn   = document.getElementById('save-audio-btn');
  const id    = document.getElementById('audio-id').value;
  const title = document.getElementById('audio-title').value.trim();

  if (!title) { showToast('العنوان مطلوب', 'error'); return; }

  btn.innerHTML = '<span class="spinner"></span> جارٍ الحفظ...';
  btn.disabled  = true;

  try {
    // ── 1. Resolve audio URL ──
    let audioUrl = '';
    const audioTabUpload = document.getElementById('audio-tab-upload').style.background.includes('emerald') ||
                           document.getElementById('audio-panel-upload').style.display !== 'none';

    if (_audioFile) {
      // Upload file
      showToast('جارٍ رفع ملف الصوت...', 'success');
      uploadToStorage._onProgress = pct => {
        document.getElementById('audio-upload-pct').textContent = pct + '%';
        document.getElementById('audio-upload-bar').style.width = pct + '%';
        document.getElementById('audio-upload-status').textContent = pct < 100 ? 'جارٍ الرفع...' : 'اكتمل الرفع ✅';
      };
      audioUrl = await uploadToStorage(STORAGE_BUCKET_AUDIO, _audioFile, 'lessons');
      document.getElementById('audio-upload-done').style.display = 'block';
      document.getElementById('audio-upload-done-name').textContent = '✅ ' + _audioFile.name;
      uploadToStorage._onProgress = null;
    } else {
      audioUrl = document.getElementById('audio-url-input').value.trim();
    }

    if (!audioUrl) { showToast('يجب رفع ملف صوتي أو إدخال رابط', 'error'); btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg> حفظ التسجيل'; btn.disabled = false; return; }

    // ── 2. Resolve thumbnail URL ──
    let thumbUrl = '';
    if (_thumbFile) {
      showToast('جارٍ رفع الصورة...', 'success');
      thumbUrl = await uploadImage(_thumbFile, 'thumbs');
    } else {
      thumbUrl = document.getElementById('thumb-url-input').value.trim();
    }

    // ── 3. Whisper transcription ──
    let transcript = document.getElementById('audio-transcript-text').value.trim();
    const doTranscribe = document.getElementById('audio-do-transcribe').checked;
    const groqKey     = document.getElementById('groq-api-key').value.trim();

    if (doTranscribe && groqKey && _audioFile && !transcript) {
      showToast('جارٍ تحويل الصوت إلى نص...', 'success');
      btn.innerHTML = '<span class="spinner"></span> جارٍ التحويل...';
      transcript = await transcribeWithGroq(_audioFile, groqKey) || '';
    }

    // ── 4. Save to DB ──
    const payload = {
      title,
      audio_url:     audioUrl,
      thumbnail_url: thumbUrl || null,
      duration:      document.getElementById('audio-duration').value.trim() || null,
      description:   document.getElementById('audio-desc').value.trim()     || null,
      is_published:  document.getElementById('audio-published').checked,
      sheikh_id:     document.getElementById('audio-sheikh').value           || null,
      category_id:   document.getElementById('audio-category').value         || null,
      transcript:    transcript || null,
    };

    if (id) {
      await dbUpdate('audios', id, payload);
      showToast('تم تحديث التسجيل بنجاح ✅', 'success');
    } else {
      payload.play_count = 0;
      await dbInsert('audios', payload);
      showToast('تم إضافة التسجيل بنجاح ✅', 'success');
    }

    // Reset state
    _audioFile = null;
    _thumbFile = null;
    closeModal('modal-audio');
    loadAudios();

  } catch(e) {
    showToast('خطأ: ' + e.message, 'error');
  }

  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg> حفظ التسجيل';
  btn.disabled  = false;
};

// ════════════════════════════════════════
//  OVERRIDE saveBook WITH UPLOAD SUPPORT
// ════════════════════════════════════════
window.saveBook = async function() {
  const btn    = document.getElementById('save-book-btn');
  const id     = document.getElementById('book-id').value;
  const title  = document.getElementById('book-title').value.trim();
  const author = document.getElementById('book-author').value.trim();

  if (!title)  { showToast('اسم الكتاب مطلوب', 'error'); return; }
  if (!author) { showToast('اسم المؤلف مطلوب', 'error'); return; }

  btn.innerHTML = '<span class="spinner"></span> جارٍ الحفظ...';
  btn.disabled  = true;

  try {
    // ── PDF ──
    let pdfUrl = '';
    if (_pdfFile) {
      showToast('جارٍ رفع PDF...', 'success');
      uploadToStorage._onProgress = pct => {
        document.getElementById('pdf-upload-pct').textContent = pct + '%';
        document.getElementById('pdf-upload-bar').style.width = pct + '%';
      };
      pdfUrl = await uploadToStorage(STORAGE_BUCKET_BOOKS, _pdfFile, 'pdf');
      document.getElementById('pdf-upload-done').style.display = 'block';
      document.getElementById('pdf-upload-done-name').textContent = '✅ ' + _pdfFile.name;
      uploadToStorage._onProgress = null;
    } else {
      pdfUrl = document.getElementById('pdf-url-input').value.trim();
    }
    if (!pdfUrl) { showToast('يجب رفع PDF أو إدخال رابط', 'error'); btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg> حفظ الكتاب'; btn.disabled = false; return; }

    // ── Cover ──
    let coverUrl = '';
    if (_coverFile) {
      showToast('جارٍ رفع صورة الغلاف...', 'success');
      coverUrl = await uploadImage(_coverFile, 'covers');
    } else {
      coverUrl = document.getElementById('cover-url-input').value.trim();
    }

    const payload = {
      title,
      author,
      pdf_url:        pdfUrl,
      cover_url:      coverUrl || null,
      description:    document.getElementById('book-desc').value.trim()   || null,
      rating:         parseInt(document.getElementById('book-rating').value) || 5,
      is_published:   document.getElementById('book-published').checked,
    };

    if (id) {
      await dbUpdate('books', id, payload);
      showToast('تم تحديث الكتاب بنجاح ✅', 'success');
    } else {
      payload.download_count = 0;
      await dbInsert('books', payload);
      showToast('تم إضافة الكتاب بنجاح ✅', 'success');
    }

    _pdfFile   = null;
    _coverFile = null;
    closeModal('modal-book');
    loadBooks();

  } catch(e) {
    showToast('خطأ: ' + e.message, 'error');
  }

  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg> حفظ الكتاب';
  btn.disabled  = false;
};

// Reset file vars on modal close
const _origCloseModal = window.closeModal;
window.closeModal = function(id) {
  _origCloseModal(id);
  if (id === 'modal-audio') {
    _audioFile = null; _thumbFile = null;
    document.getElementById('audio-upload-progress').style.display = 'none';
    document.getElementById('audio-upload-done').style.display = 'none';
    document.getElementById('thumb-preview-wrap').style.display = 'none';
    document.getElementById('transcription-result').style.display = 'none';
    document.getElementById('audio-transcript-text').value = '';
  }
  if (id === 'modal-book') {
    _pdfFile = null; _coverFile = null;
    document.getElementById('pdf-upload-progress').style.display = 'none';
    document.getElementById('pdf-upload-done').style.display = 'none';
    document.getElementById('cover-preview-wrap').style.display = 'none';
  }
};

// ════════════════════════════════════════
//  SHEIKH IMAGE UPLOAD
// ════════════════════════════════════════
function setImgSrc(mode) {
  document.getElementById('img-src-url').style.display  = mode === 'url'  ? 'block' : 'none';
  document.getElementById('img-src-file').style.display = mode === 'file' ? 'block' : 'none';
  document.getElementById('img-src-url-btn').className  = 'btn btn-sm ' + (mode === 'url'  ? 'btn-primary' : 'btn-outline');
  document.getElementById('img-src-file-btn').className = 'btn btn-sm ' + (mode === 'file' ? 'btn-primary' : 'btn-outline');
}

function previewSheikhImg(input) {
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    const prev = document.getElementById('sheikh-img-preview');
    prev.innerHTML = `<img src="${e.target.result}" style="width:100%;height:80px;object-fit:cover;border-radius:8px">`;
  };
  reader.readAsDataURL(input.files[0]);
}

async function uploadSheikhImageToCloudinary(file) {
  const name = API_KEYS.cloudinary_name;
  const preset = API_KEYS.cloudinary_preset;
  if (!name || !preset) throw new Error('يرجى ضبط مفاتيح Cloudinary في الإعدادات');
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', preset);
  fd.append('folder', 'sheikhs');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${name}/image/upload`, { method: 'POST', body: fd });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.secure_url;
}

// Override saveSheikh to handle file upload
const _origSaveSheikh = typeof saveSheikh !== 'undefined' ? saveSheikh : null;
async function saveSheikh() {
  const btn = document.getElementById('save-sheikh-btn');
  const id  = document.getElementById('sheikh-id').value;
  const name = document.getElementById('sheikh-name').value.trim();
  if (!name) { showToast('الاسم مطلوب', 'error'); return; }

  btn.innerHTML = '<span class="spinner"></span> جارٍ الحفظ...';
  btn.disabled = true;

  try {
    let imageUrl = document.getElementById('sheikh-image')?.value.trim() || null;

    // If file mode selected, upload first
    const fileInput = document.getElementById('sheikh-image-file');
    if (fileInput?.files[0]) {
      showToast('جارٍ رفع الصورة...', 'info');
      imageUrl = await uploadSheikhImageToCloudinary(fileInput.files[0]);
    }

    const payload = {
      name,
      bio:         document.getElementById('sheikh-bio')?.value.trim() || null,
      image_url:   imageUrl,
      specialty:   document.getElementById('sheikh-specialty')?.value.trim() || null,
      twitter:     document.getElementById('sheikh-twitter')?.value.trim() || null,
    };

    if (id) {
      await dbUpdate('sheikhs', id, payload);
      showToast('تم تحديث الشيخ ✅', 'success');
    } else {
      await dbInsert('sheikhs', payload);
      showToast('تم إضافة الشيخ ✅', 'success');
    }
    closeModal('modal-sheikh');
    loadSheikhs();
    if (typeof loadSheikhsDropdown === 'function') loadSheikhsDropdown();
  } catch(e) {
    showToast('خطأ: ' + e.message, 'error');
  }
  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg> حفظ';
  btn.disabled = false;
}

// ════════════════════════════════════════
//  LOGO & FAVICON UPLOAD
// ════════════════════════════════════════
function previewLogo(url) {
  const prev = document.getElementById('logo-preview');
  if (!prev) return;
  if (url) prev.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:contain;border-radius:10px">`;
  else prev.textContent = '🕌';
}

async function uploadSiteLogo(input) {
  if (!input.files[0]) return;
  try {
    showToast('جارٍ رفع اللوغو...', 'info');
    const url = await uploadSheikhImageToCloudinary(input.files[0]);
    document.getElementById('s-logo-uploaded').value = url;
    document.getElementById('s-logo-url').value = url;
    previewLogo(url);
    showToast('تم رفع اللوغو ✅', 'success');
  } catch(e) { showToast('خطأ: ' + e.message, 'error'); }
}

async function uploadFavicon(input) {
  if (!input.files[0]) return;
  try {
    showToast('جارٍ رفع الـ Favicon...', 'info');
    const url = await uploadSheikhImageToCloudinary(input.files[0]);
    document.getElementById('s-fav-uploaded').value = url;
    const prev = document.getElementById('fav-preview');
    if (prev) prev.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:contain">`;
    showToast('تم رفع الـ Favicon ✅', 'success');
  } catch(e) { showToast('خطأ: ' + e.message, 'error'); }
}

// ════════════════════════════════════════
//  HADITH AUTO-FETCH + SCHEDULING
// ════════════════════════════════════════
function toggleAutoFetch(enabled) {
  document.getElementById('hadith-manual-fields').style.opacity = enabled ? '0.5' : '1';
  document.getElementById('hadith-manual-fields').style.pointerEvents = enabled ? 'none' : '';
  document.getElementById('btn-fetch-now').style.display = enabled ? 'inline-flex' : 'none';
}

async function fetchHadithNow() {
  const btn = document.getElementById('btn-fetch-now');
  btn.innerHTML = '<span class="spinner"></span> جارٍ الجلب...';
  btn.disabled = true;
  try {
    // Use hadith-api.com — free, Arabic support
    const res = await fetch('https://hadith-api.vercel.app/hadiths/random');
    if (!res.ok) throw new Error('فشل الاتصال بـ API');
    const data = await res.json();
    const text   = data.hadith?.arabic || data.text || '';
    const source = data.collection?.arabic || data.book || 'حديث';
    if (text) {
      document.getElementById('hadith-text').value   = text;
      document.getElementById('hadith-source').value = source;
      document.getElementById('hadith-manual-fields').style.opacity = '1';
      document.getElementById('hadith-manual-fields').style.pointerEvents = '';
      showToast('تم جلب الحديث ✅', 'success');
    } else {
      throw new Error('لم يُرجع API نصاً');
    }
  } catch(e) {
    // Fallback: use a curated local hadith
    const fallbacks = [
      { text: 'إنما الأعمال بالنيات، وإنما لكل امرئٍ ما نوى، فمن كانت هجرته إلى الله ورسوله فهجرته إلى الله ورسوله، ومن كانت هجرته لدنيا يصيبها أو امرأة ينكحها فهجرته إلى ما هاجر إليه.', source: 'متفق عليه' },
      { text: 'الدين النصيحة. قلنا: لمن؟ قال: لله ولكتابه ولرسوله ولأئمة المسلمين وعامتهم.', source: 'رواه مسلم' },
      { text: 'لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه.', source: 'متفق عليه' },
    ];
    const h = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    document.getElementById('hadith-text').value   = h.text;
    document.getElementById('hadith-source').value = h.source;
    showToast('استُخدم حديث محلي (API غير متاح)', 'info');
  }
  btn.innerHTML = '↻ جلب الآن وتعبئة الحقول';
  btn.disabled = false;
}

// Override saveHadith to support schedule_date + auto-daily
const _origSaveHadith = typeof saveHadith !== 'undefined' ? saveHadith : null;
async function saveHadith() {
  const btn = document.getElementById('save-hadith-btn');
  const id  = document.getElementById('hadith-id').value;
  const text = document.getElementById('hadith-text').value.trim();
  if (!text) { showToast('النص مطلوب', 'error'); return; }

  btn.innerHTML = '<span class="spinner"></span> جارٍ الحفظ...';
  btn.disabled = true;

  const isActive    = document.getElementById('hadith-active').checked;
  const schedDate   = document.getElementById('hadith-schedule-date')?.value || null;
  const autoFetch   = document.getElementById('hadith-auto-fetch')?.checked || false;

  const payload = {
    text,
    source:        document.getElementById('hadith-source').value.trim() || null,
    type:          document.getElementById('hadith-type').value,
    is_active:     isActive && !schedDate, // Only activate now if no schedule
    schedule_date: schedDate || null,
    auto_fetch:    autoFetch,
  };

  try {
    if (isActive && !schedDate) {
      // Deactivate all others
      const existing = await dbGet('hadiths', 'is_active=eq.true&select=id');
      for (const h of existing) {
        if (h.id !== id) await dbUpdate('hadiths', h.id, { is_active: false });
      }
    }
    if (id) {
      await dbUpdate('hadiths', id, payload);
      showToast('تم تحديث الحديث ✅', 'success');
    } else {
      await dbInsert('hadiths', payload);
      showToast(schedDate ? `تمت الجدولة ليوم ${schedDate} ✅` : 'تم إضافة الحديث ✅', 'success');
    }
    closeModal('modal-hadith');
    await loadHadiths();
  } catch(e) {
    showToast('خطأ: ' + e.message, 'error');
  }
  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg> حفظ';
  btn.disabled = false;
}

// ════════════════════════════════════════
//  SHEIKH CARDS — edit form restore
// ════════════════════════════════════════
async function editSheikhEnhanced(id) {
  try {
    const data = await dbGet('sheikhs', `id=eq.${id}&select=*&limit=1`);
    const s = data[0];
    document.getElementById('sheikh-id').value          = s.id;
    document.getElementById('sheikh-name').value        = s.name || '';
    document.getElementById('sheikh-bio').value         = s.bio || '';
    document.getElementById('sheikh-image').value       = s.image_url || '';
    if (document.getElementById('sheikh-specialty'))
      document.getElementById('sheikh-specialty').value = s.specialty || '';
    if (document.getElementById('sheikh-twitter'))
      document.getElementById('sheikh-twitter').value   = s.twitter || '';
    document.getElementById('sheikh-modal-title').textContent = 'تعديل الشيخ';
    setImgSrc('url');
    openModal('modal-sheikh');
  } catch(e) { showToast('خطأ في التحميل', 'error'); }
}
