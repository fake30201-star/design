require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== Supabase ==========
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const activeTokens = new Set();

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (token && activeTokens.has(token)) {
    return next();
  }
  return res.status(401).json({ error: 'غير مصرح لك بالدخول، سجل دخولك الأول' });
}

// ---------- إعدادات رفع الملفات ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    const name = crypto.randomBytes(8).toString('hex') + ext;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('الملف لازم يكون صورة'));
  }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ================= مسارات التصاميم =================

app.get('/api/designs', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('designs')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'مقدرناش نجيب التصاميم' });
  }
});

app.get('/api/designs/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('designs')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'التصميم مش موجود' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'حصل خطأ' });
  }
});

// ================= تسجيل الدخول (من Supabase) =================

app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(401).json({ error: 'اسم المستخدم أو كلمة السر غلط' });
  }

  try {
    // 🔍 البحث عن الأدمن في Supabase
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .single();

    // لو مش موجود أو كلمة السر غلط
    if (error || !data || data.password !== password) {
      console.log('❌ فشل الدخول:', username);
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة السر غلط' });
    }

    // ✅ تسجيل الدخول ناجح
    const token = crypto.randomBytes(24).toString('hex');
    activeTokens.add(token);
    console.log('✅ دخول ناجح:', username);
    return res.json({ token, adminId: data.id });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'حصل خطأ في السيرفر' });
  }
});

app.post('/api/admin/logout', requireAuth, (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  activeTokens.delete(token);
  res.json({ ok: true });
});

app.get('/api/admin/check', requireAuth, (req, res) => res.json({ ok: true }));

// ================= إدارة التصاميم (بحماية) =================

app.get('/api/admin/designs', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('designs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'مقدرناش نجيب التصاميم' });
  }
});

app.post('/api/admin/designs', requireAuth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'محتاج صورة للتصميم' });

  const { title, description, category, tags, meta } = req.body;
  const newDesign = {
    id: crypto.randomBytes(6).toString('hex'),
    title: title || 'تصميم بدون اسم',
    description: description || '',
    category: category || 'عام',
    tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    image_url: '/uploads/' + req.file.filename,
    meta: meta ? JSON.parse(meta) : null,
    published: true,
    created_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('designs')
      .insert([newDesign])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    if (req.file && req.file.path) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'فشل حفظ التصميم' });
  }
});

app.put('/api/admin/designs/:id', requireAuth, async (req, res) => {
  const { title, description, category, tags, published } = req.body;

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (category !== undefined) updateData.category = category;
  if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : String(tags).split(',').map(t => t.trim()).filter(Boolean);
  if (published !== undefined) updateData.published = published;

  try {
    const { data, error } = await supabase
      .from('designs')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: 'التصميم مش موجود' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'فشل التعديل' });
  }
});

app.put('/api/admin/designs/:id/image', requireAuth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'محتاج صورة' });

  try {
    const { data: oldDesign, error: findError } = await supabase
      .from('designs')
      .select('image_url')
      .eq('id', req.params.id)
      .single();

    if (findError || !oldDesign) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'التصميم مش موجود' });
    }

    const oldPath = path.join(__dirname, 'public', oldDesign.image_url);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

    const { data, error } = await supabase
      .from('designs')
      .update({ image_url: '/uploads/' + req.file.filename })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    if (req.file && req.file.path) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'فشل استبدال الصورة' });
  }
});

app.delete('/api/admin/designs/:id', requireAuth, async (req, res) => {
  try {
    const { data: oldDesign, error: findError } = await supabase
      .from('designs')
      .select('image_url')
      .eq('id', req.params.id)
      .single();

    const { error } = await supabase
      .from('designs')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    if (oldDesign && oldDesign.image_url) {
      const imgPath = path.join(__dirname, 'public', oldDesign.image_url);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'فشل الحذف' });
  }
});

app.post('/api/admin/upload-texture', requireAuth, upload.single('texture'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'محتاج صورة نقشة' });
  res.json({ url: '/uploads/' + req.file.filename });
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.listen(PORT, () => {
  console.log(`🧵 المنصة شغالة على http://localhost:${PORT}`);
  console.log(`📊 لوحة التحكم: http://localhost:${PORT}/admin/login.html`);
});
