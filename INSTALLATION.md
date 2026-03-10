# 📋 دليل التثبيت والاستبدال

## قبل البدء

تأكد من أن لديك:
- ✅ نسخة احتياطية من الملفات القديمة
- ✅ وصول FTP أو SSH للخادم
- ✅ صلاحيات كتابة على المجلد الرئيسي للموقع

## الملفات الجديدة المراد تحميلها

```
✅ index.html (محدث)
✅ dashboard.html (محدث)
✅ styles.css (جديد)
✅ app.js (جديد)
✅ sw.js (جديد)
✅ manifest.json (جديد)
✅ README.md (جديد)
```

## خطوات التثبيت

### الخطوة 1: إنشاء نسخة احتياطية

```bash
# عبر SSH
cd /path/to/your/website
mkdir backup-$(date +%Y%m%d)
cp index.html backup-$(date +%Y%m%d)/
cp dashboard.html backup-$(date +%Y%m%d)/
```

أو عبر FTP:
- أنشئ مجلد جديد باسم `backup-2024-03-10`
- انسخ الملفات القديمة إليه

### الخطوة 2: تحميل الملفات الجديدة

#### عبر FTP:
1. افتح برنامج FTP (مثل FileZilla)
2. اتصل بخادمك
3. انتقل إلى المجلد الرئيسي للموقع
4. حمّل الملفات التالية:
   - `index.html` (استبدل القديم)
   - `dashboard.html` (استبدل القديم)
   - `styles.css` (ملف جديد)
   - `app.js` (ملف جديد)
   - `sw.js` (ملف جديد)
   - `manifest.json` (ملف جديد)

#### عبر SSH:
```bash
cd /path/to/your/website

# حمّل الملفات (استخدم scp أو git)
# أو انسخها مباشرة إذا كنت في الخادم

# تحديث الصلاحيات
chmod 644 index.html dashboard.html styles.css app.js sw.js manifest.json
```

### الخطوة 3: تحديث ملفات HTML

تأكد من أن `index.html` و `dashboard.html` يحتويان على:

```html
<!-- في <head> -->
<link rel="stylesheet" href="styles.css">
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#0b6b42">

<!-- قبل </body> -->
<script src="app.js" defer></script>
```

### الخطوة 4: اختبار التثبيت

1. **افتح الموقع في المتصفح**
   ```
   https://your-website.com
   ```

2. **تحقق من وحدة التحكم (F12)**
   - يجب أن ترى رسالة: `✅ تم تهيئة التطبيق بنجاح`

3. **اختبر الميزات الأساسية**
   - ✅ الوضع الداكن (اضغط على زر الثيم)
   - ✅ المشغل الصوتي
   - ✅ المسبحة
   - ✅ البحث

4. **اختبر على الهاتف**
   - تحقق من التجاوبية
   - جرّب الوضع الداكن
   - اختبر المسبحة

### الخطوة 5: تفعيل PWA (اختياري)

لتفعيل تطبيق ويب تقدمي:

```html
<!-- أضف هذا في <head> -->
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#0b6b42">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="كفاية المؤمن">
```

## استكشاف المشاكل

### المشكلة: الأنماط لا تظهر
**الحل:**
```bash
# تحقق من أن styles.css موجود
ls -la styles.css

# تحقق من صلاحيات الملف
chmod 644 styles.css

# امسح ذاكرة التخزين المؤقت في المتصفح (Ctrl+Shift+Delete)
```

### المشكلة: JavaScript لا يعمل
**الحل:**
```bash
# تحقق من أن app.js موجود
ls -la app.js

# تحقق من وحدة التحكم للأخطاء (F12)
# ابحث عن رسائل الخطأ الحمراء
```

### المشكلة: Supabase لا يتصل
**الحل:**
```javascript
// في وحدة التحكم، اكتب:
console.log(window.supabase);

// يجب أن ترى كائن Supabase
// إذا كان undefined، أضف مكتبة Supabase:
```

أضف هذا في `<head>`:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
  const supabase = window.supabase.createClient(
    'YOUR_SUPABASE_URL',
    'YOUR_SUPABASE_KEY'
  );
</script>
```

### المشكلة: الصور لا تظهر
**الحل:**
```bash
# تحقق من أن مجلد الصور موجود
ls -la images/

# تحقق من صلاحيات الملفات
chmod 644 images/*

# تحقق من عناوين URL في الكود
```

## التحقق من النجاح

### قائمة التحقق:
- [ ] الموقع يفتح بدون أخطاء
- [ ] الأنماط تظهر بشكل صحيح
- [ ] الوضع الداكن يعمل
- [ ] المشغل الصوتي يعمل
- [ ] المسبحة تعمل
- [ ] البحث يعمل
- [ ] لا توجد أخطاء في وحدة التحكم
- [ ] الموقع متجاوب على الهاتف
- [ ] أوقات الصلاة تظهر بشكل صحيح

## الرجوع للنسخة القديمة (إذا لزم الأمر)

إذا حدثت مشكلة، يمكنك الرجوع للنسخة القديمة:

```bash
# عبر SSH
cd /path/to/your/website
cp backup-2024-03-10/index.html .
cp backup-2024-03-10/dashboard.html .

# أو عبر FTP
# انسخ الملفات من مجلد النسخة الاحتياطية
```

## الدعم والمساعدة

إذا واجهت مشاكل:

1. **تحقق من وحدة التحكم (F12)**
   - اضغط F12 أو اختر Inspect
   - انظر إلى تبويب Console
   - ابحث عن رسائل الخطأ

2. **تحقق من سجلات الخادم**
   ```bash
   tail -f /var/log/apache2/error.log
   # أو
   tail -f /var/log/nginx/error.log
   ```

3. **اختبر الاتصال بـ Supabase**
   ```javascript
   // في وحدة التحكم
   supabase.from('settings').select('*').then(r => console.log(r))
   ```

## نصائح مهمة

✅ **حافظ على النسخ الاحتياطية**
- احتفظ بنسخة احتياطية من الملفات القديمة لمدة شهر على الأقل

✅ **اختبر قبل الإطلاق**
- اختبر جميع الميزات على أجهزة مختلفة

✅ **راقب الأداء**
- استخدم Google PageSpeed Insights
- تحقق من سرعة التحميل

✅ **حدّث بانتظام**
- تحقق من التحديثات الأمنية لـ Supabase و Groq

## ملاحظات إضافية

### حجم الملفات
```
index.html: ~2.8 MB
dashboard.html: ~2.9 MB
styles.css: ~35 KB
app.js: ~25 KB
sw.js: ~8 KB
manifest.json: ~5 KB
```

### متطلبات الخادم
- PHP 7.4+ (إذا كنت تستخدم PHP)
- Node.js 14+ (إذا كنت تستخدم Node.js)
- HTTPS (مطلوب لـ Service Worker)
- CORS enabled (لـ API calls)

### المتصفحات المدعومة
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Opera 76+

---

**تم إنشاؤه:** 10 مارس 2026
**الإصدار:** 2.0
**الحالة:** ✅ جاهز للإنتاج
