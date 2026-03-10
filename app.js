/* ═══════════════════════════════════════════════════════════════
   كفاية المؤمن - ملف التطبيق المحسّن (Optimized App)
   ═══════════════════════════════════════════════════════════════ */

// ──────────────── إدارة الثيم (Theme Management) ──────────────
class ThemeManager {
  constructor() {
    this.theme = localStorage.getItem('theme') || 'light';
    this.init();
  }

  init() {
    this.apply();
    document.addEventListener('DOMContentLoaded', () => this.setupToggle());
  }

  apply() {
    if (this.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  toggle() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', this.theme);
    this.apply();
    showToast(`تم التبديل إلى الوضع ${this.theme === 'dark' ? 'الداكن' : 'الفاتح'} 🌙`, 'success');
  }

  setupToggle() {
    const btn = document.querySelector('[data-toggle-theme]');
    if (btn) {
      btn.addEventListener('click', () => this.toggle());
    }
  }
}

// ──────────────── إدارة الرسائل المنبثقة (Toast Manager) ──────────────
function showToast(msg, type = 'success') {
  const t = document.getElementById('main-toast');
  const icon = document.getElementById('toast-icon');
  const text = document.getElementById('toast-text');

  if (!t || !text) return;

  if (text) text.textContent = msg;
  if (icon) {
    icon.textContent = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    icon.style.color = type === 'success' ? '#2dc77a' : type === 'error' ? '#e05252' : '#2a9dd4';
    icon.style.fontSize = '18px';
  }

  t.classList.add('visible');
  setTimeout(() => {
    t.classList.remove('visible');
  }, 3000);
}

// ──────────────── إدارة التنقل (Navigation Management) ──────────────
class NavigationManager {
  constructor() {
    this.currentPage = 'home';
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.setupScrollEffect();
      this.setupMobileMenu();
      this.setupNavLinks();
    });
  }

  setupScrollEffect() {
    const nav = document.querySelector('nav');
    if (!nav) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 10) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    });
  }

  setupMobileMenu() {
    const menuBtn = document.querySelector('.nav-menu-btn');
    const closeBtn = document.querySelector('.mobile-close');
    const mobileNav = document.querySelector('.mobile-nav');
    const overlay = document.querySelector('.overlay-bg');

    if (!menuBtn || !mobileNav) return;

    menuBtn.addEventListener('click', () => {
      mobileNav.classList.add('open');
      overlay.classList.add('open');
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeMobileMenu());
    }

    if (overlay) {
      overlay.addEventListener('click', () => this.closeMobileMenu());
    }

    mobileNav.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => this.closeMobileMenu());
    });
  }

  closeMobileMenu() {
    const mobileNav = document.querySelector('.mobile-nav');
    const overlay = document.querySelector('.overlay-bg');
    if (mobileNav) mobileNav.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  }

  setupNavLinks() {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const pageId = link.getAttribute('data-page');
        if (pageId) {
          this.showPage(pageId);
        }
      });
    });
  }

  showPage(pageId) {
    // إخفاء جميع الصفحات
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active');
    });

    // إزالة الفئة النشطة من جميع الروابط
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });

    // إظهار الصفحة المطلوبة
    const page = document.getElementById(`page-${pageId}`);
    if (page) {
      page.classList.add('active');
      window.scrollTo(0, 0);
    }

    // تحديد الرابط النشط
    const link = document.querySelector(`[data-page="${pageId}"]`);
    if (link) {
      link.classList.add('active');
    }

    this.currentPage = pageId;
  }
}

// ──────────────── إدارة البيانات (Data Management) ──────────────
class DataManager {
  constructor() {
    this.cache = {};
    this.cacheTimeout = 5 * 60 * 1000; // 5 دقائق
  }

  async dbQuery(table, options = {}) {
    try {
      // هنا يتم استدعاء Supabase
      // هذا مثال على البنية المتوقعة
      if (window.supabase) {
        const { data, error } = await window.supabase
          .from(table)
          .select(options.select || '*')
          .limit(options.limit || 10);

        if (error) throw error;
        return data;
      }
      return [];
    } catch (e) {
      console.error(`خطأ في استعلام ${table}:`, e);
      return [];
    }
  }

  async dbInsert(table, data) {
    try {
      if (window.supabase) {
        const { error } = await window.supabase.from(table).insert([data]);
        if (error) throw error;
        return true;
      }
      return false;
    } catch (e) {
      console.error(`خطأ في إدراج بيانات في ${table}:`, e);
      return false;
    }
  }

  async dbUpdate(table, filter, data) {
    try {
      if (window.supabase) {
        const { error } = await window.supabase.from(table).update(data).match(filter);
        if (error) throw error;
        return true;
      }
      return false;
    } catch (e) {
      console.error(`خطأ في تحديث ${table}:`, e);
      return false;
    }
  }
}

// ──────────────── إدارة الصوت (Audio Management) ──────────────
class AudioManager {
  constructor() {
    this.audio = new Audio();
    this.isPlaying = false;
    this.currentTrack = null;
    this.init();
  }

  init() {
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.updatePlayButton();
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.updatePlayButton();
    });

    this.audio.addEventListener('timeupdate', () => {
      this.updateProgress();
    });

    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.updatePlayButton();
    });
  }

  play(url, title = '', sheikh = '') {
    if (this.audio.src !== url) {
      this.audio.src = url;
      this.currentTrack = { url, title, sheikh };
    }
    this.audio.play();
  }

  pause() {
    this.audio.pause();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.audio.play();
    }
  }

  setSpeed(speed) {
    this.audio.playbackRate = parseFloat(speed);
  }

  skip(seconds) {
    this.audio.currentTime += seconds;
  }

  seek(time) {
    this.audio.currentTime = time;
  }

  updateProgress() {
    const progressBar = document.getElementById('big-prog');
    const fill = document.getElementById('big-fill');
    const current = document.getElementById('bp-cur');
    const total = document.getElementById('bp-total');

    if (progressBar && fill) {
      const percent = (this.audio.currentTime / this.audio.duration) * 100;
      fill.style.width = percent + '%';
    }

    if (current) {
      current.textContent = this.formatTime(this.audio.currentTime);
    }

    if (total) {
      total.textContent = this.formatTime(this.audio.duration);
    }
  }

  updatePlayButton() {
    const btn = document.getElementById('big-play');
    if (btn) {
      btn.textContent = this.isPlaying ? '⏸' : '▶';
    }
  }

  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  download(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'audio.mp3';
    a.click();
    showToast('بدأ التحميل ⬇', 'success');
  }
}

// ──────────────── إدارة المسبحة (Tasbih Manager) ──────────────
class TasbihManager {
  constructor() {
    this.count = 0;
    this.phrase = 'سبحان الله';
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.setupTasbih();
    });
  }

  setupTasbih() {
    const counter = document.getElementById('tasbih-counter');
    if (counter) {
      counter.addEventListener('click', () => this.increment());
    }

    document.querySelectorAll('.phrase-btn').forEach(btn => {
      btn.addEventListener('click', () => this.setPhrase(btn));
    });

    const resetBtn = document.querySelector('.tasbih-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.reset());
    }
  }

  increment() {
    this.count++;
    this.updateDisplay();

    if (this.count % 33 === 0 && this.count > 0) {
      showToast(`أكملت ${this.count / 33} دورة 🎉`, 'success');
    }
  }

  setPhrase(btn) {
    this.phrase = btn.textContent;
    document.getElementById('tasbih-phrase-display').textContent = this.phrase;

    document.querySelectorAll('.phrase-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    this.reset();
  }

  reset() {
    this.count = 0;
    this.updateDisplay();
  }

  updateDisplay() {
    const numEl = document.getElementById('tasbih-num');
    const roundsEl = document.getElementById('tasbih-rounds');

    if (numEl) numEl.textContent = this.count;
    if (roundsEl) roundsEl.textContent = Math.floor(this.count / 33);

    this.updateBeads();
  }

  updateBeads() {
    const beadsContainer = document.getElementById('tasbih-beads');
    if (!beadsContainer) return;

    beadsContainer.innerHTML = '';
    for (let i = 0; i < 33; i++) {
      const bead = document.createElement('div');
      bead.className = 'tasbih-bead' + (i < (this.count % 33) ? ' done' : '');
      beadsContainer.appendChild(bead);
    }
  }
}

// ──────────────── إدارة البحث (Search Manager) ──────────────
class SearchManager {
  constructor() {
    this.searchData = [];
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      const searchInput = document.getElementById('main-search');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => this.performSearch(e.target.value));
      }
    });
  }

  async loadSearchData() {
    // تحميل البيانات من Supabase أو استخدام بيانات محلية
    this.searchData = [
      { type: 'audio', title: 'شرح الأربعين النووية', sub: 'الشيخ حسام دياب • 45:23' },
      { type: 'book', title: 'منهاج القاصدين', sub: 'ابن قدامة المقدسي' },
      { type: 'hadith', title: 'إنما الأعمال بالنيات', sub: 'رواه البخاري ومسلم' },
    ];
  }

  performSearch(query) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;

    if (!query.trim()) {
      resultsContainer.innerHTML = '<p style="color:var(--text3);text-align:center;padding:40px 0">اكتب في مربع البحث للبدء</p>';
      return;
    }

    const filtered = this.searchData.filter(item =>
      item.title.includes(query) || item.sub.includes(query)
    );

    if (!filtered.length) {
      resultsContainer.innerHTML = '<p style="color:var(--text3);text-align:center;padding:40px 0">لا توجد نتائج</p>';
      return;
    }

    resultsContainer.innerHTML = filtered.map(item => `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px 20px;margin-bottom:12px;display:flex;align-items:center;gap:14px;cursor:pointer;transition:border-color .2s" onmouseover="this.style.borderColor='var(--em)'" onmouseout="this.style.borderColor='var(--border)'">
        <div style="width:42px;height:42px;border-radius:10px;background:rgba(11,107,66,0.1);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">
          ${item.type === 'audio' ? '🎙' : item.type === 'book' ? '📖' : '🌙'}
        </div>
        <div>
          <div style="font-size:15px;font-weight:700;margin-bottom:3px">${item.title}</div>
          <div style="font-size:12px;color:var(--text3)">${item.sub}</div>
        </div>
      </div>
    `).join('');
  }
}

// ──────────────── إدارة الرسوم المتحركة (Animation Manager) ──────────────
class AnimationManager {
  constructor() {
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.observeFadeElements();
    });
  }

  observeFadeElements() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-up, [data-animate]').forEach(el => {
      observer.observe(el);
    });
  }
}

// ──────────────── إدارة الوصول (Accessibility Manager) ──────────────
class AccessibilityManager {
  constructor() {
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.addAriaLabels();
      this.setupKeyboardNavigation();
    });
  }

  addAriaLabels() {
    // إضافة تسميات ARIA للعناصر التفاعلية
    document.querySelectorAll('button').forEach(btn => {
      if (!btn.getAttribute('aria-label')) {
        btn.setAttribute('aria-label', btn.textContent.trim() || 'زر');
      }
    });

    document.querySelectorAll('a').forEach(link => {
      if (!link.getAttribute('aria-label')) {
        link.setAttribute('aria-label', link.textContent.trim() || 'رابط');
      }
    });
  }

  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Escape لإغلاق القوائم
      if (e.key === 'Escape') {
        const nav = document.querySelector('.mobile-nav');
        if (nav) nav.classList.remove('open');
      }
    });
  }
}

// ──────────────── تهيئة التطبيق (App Initialization) ──────────────
document.addEventListener('DOMContentLoaded', () => {
  // إنشاء مثيلات من الفئات
  window.themeManager = new ThemeManager();
  window.navigationManager = new NavigationManager();
  window.dataManager = new DataManager();
  window.audioManager = new AudioManager();
  window.tasbihManager = new TasbihManager();
  window.searchManager = new SearchManager();
  window.animationManager = new AnimationManager();
  window.accessibilityManager = new AccessibilityManager();

  console.log('✅ تم تهيئة التطبيق بنجاح');
});

// ──────────────── دوال مساعدة عامة ──────────────
function showPage(pageId) {
  if (window.navigationManager) {
    window.navigationManager.showPage(pageId);
  }
}

function playAudio(url, title, sheikh) {
  if (window.audioManager) {
    window.audioManager.play(url, title, sheikh);
  }
}

function togglePlay() {
  if (window.audioManager) {
    window.audioManager.togglePlay();
  }
}

function skipAudio(seconds) {
  if (window.audioManager) {
    window.audioManager.skip(seconds);
  }
}

function setSpeed(speed) {
  if (window.audioManager) {
    window.audioManager.setSpeed(speed);
  }
}

function downloadAudio(url, filename) {
  if (window.audioManager) {
    window.audioManager.download(url, filename);
  }
}

function countTasbih() {
  if (window.tasbihManager) {
    window.tasbihManager.increment();
  }
}

function resetTasbih() {
  if (window.tasbihManager) {
    window.tasbihManager.reset();
  }
}

function setPhrase(phrase, btn) {
  if (window.tasbihManager) {
    window.tasbihManager.setPhrase(btn);
  }
}

// ──────────────── دعم التطبيقات التقدمية (PWA Support) ──────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('Service Worker registration failed:', err);
    });
  });
}

// ──────────────── إرسال الإشعارات (Push Notifications) ──────────────
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendNotification(title, options = {}) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icon.png',
      badge: '/badge.png',
      ...options
    });
  }
}

// ──────────────── تتبع الأحداث (Analytics) ──────────────
function trackEvent(eventName, eventData = {}) {
  if (window.dataManager) {
    window.dataManager.dbInsert('analytics', {
      event: eventName,
      data: eventData,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
  }
}

// ──────────────── معالجة الأخطاء العامة ──────────────
window.addEventListener('error', (event) => {
  console.error('خطأ عام:', event.error);
  showToast('حدث خطأ ما. يرجى محاولة مرة أخرى.', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promise rejection:', event.reason);
  showToast('حدث خطأ ما. يرجى محاولة مرة أخرى.', 'error');
});
