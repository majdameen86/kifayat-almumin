# 📖 مشروع كفاية المؤمن - النسخة المحسّنة

نسخة محسّنة وكاملة من موقع كفاية المؤمن مع تحسينات برمجية وميزات جديدة.

## 🎯 الميزات الرئيسية

### ✨ الميزات الموجودة
- 📱 تصميم متجاوب بالكامل (Responsive Design)
- 🌙 دعم الوضع الداكن (Dark Mode)
- 🎙️ مشغل صوتي متقدم مع التحكم بالسرعة
- 📚 مكتبة كتب إسلامية مع عرض PDF
- 🧑‍🏫 قسم الشيوخ والمحاضرين
- 📿 مسبحة إلكترونية تفاعلية
- 🕌 أوقات الصلاة لعدة مدن
- 🔍 بحث ذكي عن المحتوى
- 🤖 تحويل الصوت إلى نص (Whisper via Groq)
- 📊 لوحة تحكم متقدمة لإدارة المحتوى

### 🆕 الميزات الجديدة المضافة
- ⚡ أداء محسّن مع فصل CSS و JavaScript
- 🎨 رسوم متحركة سلسة وانتقالات احترافية
- ♿ تحسينات إمكانية الوصول (ARIA Labels)
- 🔒 تحسينات أمان معالجة مفاتيح API
- 📈 نظام تتبع الأحداث (Analytics)
- 🔔 دعم الإشعارات (Push Notifications)
- 💾 دعم التطبيقات التقدمية (PWA)
- 🎯 إدارة حالة التطبيق بشكل احترافي

## 📁 هيكل الملفات

```
project/
├── index.html              # الصفحة الرئيسية (محدثة)
├── dashboard.html          # لوحة التحكم (محدثة)
├── styles.css              # ملف الأنماط المحسّن (جديد)
├── app.js                  # ملف التطبيق المحسّن (جديد)
├── README.md               # هذا الملف
└── sw.js                   # Service Worker (اختياري)
```

## 🚀 خطوات التثبيت

### 1. استبدال الملفات القديمة
```bash
# احفظ نسخة احتياطية من الملفات القديمة
cp index.html index-backup.html
cp dashboard.html dashboard-backup.html

# استبدل الملفات الجديدة
# انسخ index.html الجديد
# انسخ dashboard.html الجديد
# انسخ styles.css إلى نفس المجلد
# انسخ app.js إلى نفس المجلد
```

### 2. تحديث الملفات HTML
تأكد من أن الملفات HTML تحتوي على الأسطر التالية في `<head>`:

```html
<!-- في index.html -->
<link rel="stylesheet" href="styles.css">
<script src="app.js" defer></script>
```

### 3. التحقق من الاتصال بـ Supabase
تأكد من أن مفاتيح Supabase موجودة في الملفات:

```javascript
// يجب أن يكون هناك متغير supabase في النطاق العام
window.supabase = supabase; // من Supabase JS library
```

## 🔧 التكوين

### تفعيل الوضع الداكن
الوضع الداكن يتم حفظه تلقائياً في `localStorage`:

```javascript
// التبديل بين الأوضاع
themeManager.toggle();

// تعيين الوضع مباشرة
localStorage.setItem('theme', 'dark');
```

### تكوين مفاتيح API

#### مفتاح Groq (لتحويل الصوت)
```javascript
// يتم تحميله من قاعدة البيانات تلقائياً
// أو يمكن تعيينه يدويًا:
API_KEYS.groq = 'your-groq-api-key';
```

#### مفتاح Cloudinary (للصور)
```javascript
API_KEYS.cloudinary_name = 'your-cloudinary-name';
API_KEYS.cloudinary_preset = 'your-preset';
```

## 📱 الاستجابة (Responsiveness)

نقاط التوقف المستخدمة:
- **Desktop**: 1024px وأعلى
- **Tablet**: 768px - 1023px
- **Mobile**: 540px - 767px
- **Small Mobile**: أقل من 540px

## ♿ إمكانية الوصول

تم إضافة تحسينات الوصول التالية:
- ✅ تسميات ARIA (ARIA Labels) للعناصر التفاعلية
- ✅ دعم لوحة المفاتيح
- ✅ تباين ألوان كافٍ
- ✅ دعم قارئات الشاشة
- ✅ تقليل الرسوم المتحركة للمستخدمين الذين يفضلون ذلك

## 🔐 الأمان

### معالجة مفاتيح API
```javascript
// ✅ آمن: استخدام مفاتيح عامة من جانب العميل
const publicKey = 'anon-public-key';

// ❌ غير آمن: لا تضع مفاتيح خدمة في الكود الأمامي
// const serviceKey = 'service-role-key'; // لا تفعل هذا!
```

### التحقق من المدخلات
جميع المدخلات من المستخدم يتم التحقق منها:

```javascript
// مثال على التحقق
if (!title.trim()) {
  showToast('العنوان مطلوب', 'error');
  return;
}
```

## 📊 التحليلات (Analytics)

تتبع الأحداث المهمة:

```javascript
// تتبع حدث مخصص
trackEvent('audio-played', {
  audioId: 'abc123',
  duration: 3600,
  timestamp: new Date()
});
```

## 🔔 الإشعارات (Push Notifications)

طلب إذن الإشعارات:

```javascript
// طلب الإذن من المستخدم
requestNotificationPermission();

// إرسال إشعار
sendNotification('درس جديد متاح!', {
  body: 'شرح الأربعين النووية - الحديث الثاني',
  tag: 'new-lesson'
});
```

## 🎨 تخصيص الألوان

تعديل متغيرات CSS في ملف `styles.css`:

```css
:root {
  --em: #0b6b42;           /* اللون الأساسي */
  --gold: #c9a84c;         /* اللون الثانوي */
  --bg: #f7f4ed;           /* لون الخلفية */
  --text: #1a1610;         /* لون النص */
  /* ... المزيد من المتغيرات */
}
```

## 🐛 استكشاف الأخطاء

### المشكلة: الصور لا تظهر
```javascript
// تحقق من عناوين URL
console.log('Image URL:', imageUrl);

// تأكد من أن الخادم يسمح بـ CORS
```

### المشكلة: الصوت لا يعمل
```javascript
// تحقق من أن الملف الصوتي موجود
console.log('Audio URL:', audioUrl);

// تأكد من أن المتصفح يدعم الصيغة
```

### المشكلة: Supabase لا يتصل
```javascript
// تحقق من مفاتيح Supabase
console.log('Supabase initialized:', !!window.supabase);

// تحقق من الأخطاء في وحدة التحكم
```

## 📚 الموارد الخارجية

- [Supabase Documentation](https://supabase.com/docs)
- [Groq API Docs](https://console.groq.com/docs)
- [Cloudinary Docs](https://cloudinary.com/documentation)
- [MDN Web Docs](https://developer.mozilla.org)

## 🤝 المساهمة

لإضافة ميزات جديدة:

1. أنشئ فرع جديد
2. أضف الميزة مع التعليقات
3. اختبر على جميع الأجهزة
4. أرسل طلب دمج

## 📝 السجل

### النسخة 2.0 (الحالية)
- ✅ فصل CSS و JavaScript
- ✅ تحسينات الأداء
- ✅ دعم PWA
- ✅ تحسينات الوصول

### النسخة 1.0
- ✅ الميزات الأساسية
- ✅ لوحة التحكم
- ✅ المشغل الصوتي

## 📞 الدعم

للمساعدة والدعم:
- 📧 البريد الإلكتروني: support@example.com
- 💬 الدردشة: chat.example.com
- 🐛 الأخطاء: issues@example.com

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT.

---

**آخر تحديث:** 10 مارس 2026
**الإصدار:** 2.0
**الحالة:** ✅ جاهز للإنتاج
