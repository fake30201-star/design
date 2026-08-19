let DESIGNS = [];
let editingId = null;

(async function init() {
  const ok = await guardAdminPage();
  if (!ok) return;
  document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault(); logoutAdmin();
  });
  document.getElementById('quickAddBtn').addEventListener('click', () => openForm());
  await loadDesigns();
})();

async function loadDesigns() {
  const res = await authFetch('/api/admin/designs');
  DESIGNS = await res.json();
  renderStats();
  renderGrid();
}

function renderStats() {
  const total = DESIGNS.length;
  const published = DESIGNS.filter(d => d.published !== false).length;
  const cats = new Set(DESIGNS.map(d => d.category)).size;
  document.getElementById('statsRow').innerHTML = `
    <div class="stat-pill swatch-card"><div class="num">${total}</div><div class="lbl">إجمالي التصاميم</div></div>
    <div class="stat-pill swatch-card"><div class="num">${published}</div><div class="lbl">منشور دلوقتي</div></div>
    <div class="stat-pill swatch-card"><div class="num">${cats}</div><div class="lbl">تصنيفات</div></div>
  `;
}

function renderGrid() {
  const grid = document.getElementById('adminGrid');
  const empty = document.getElementById('adminEmpty');
  if (DESIGNS.length === 0) { grid.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  grid.innerHTML = DESIGNS.map(d => `
    <div class="swatch-card admin-card" style="position:relative">
      <span class="badge ${d.published !== false ? 'on' : 'off'}">${d.published !== false ? 'منشور' : 'مخفي'}</span>
      <img class="thumb" src="${d.imageUrl}" alt="${escapeHtml(d.title)}">
      <div class="info">
        <div class="cat">${escapeHtml(d.category || 'عام')}</div>
        <h3>${escapeHtml(d.title)}</h3>
        <div class="row-actions">
          <button class="btn small ghost" data-act="edit" data-id="${d.id}">تعديل</button>
          <button class="btn small ghost" data-act="toggle" data-id="${d.id}">${d.published !== false ? 'إخفاء' : 'نشر'}</button>
          <button class="btn small danger" data-act="delete" data-id="${d.id}">حذف</button>
        </div>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('[data-act]').forEach(btn => {
    btn.addEventListener('click', () => handleAction(btn.dataset.act, btn.dataset.id));
  });
}

function handleAction(act, id) {
  const design = DESIGNS.find(d => d.id === id);
  if (act === 'edit') openForm(design);
  if (act === 'toggle') togglePublish(design);
  if (act === 'delete') deleteDesign(design);
}

async function togglePublish(design) {
  await authFetch(`/api/admin/designs/${design.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ published: !(design.published !== false) })
  });
  showToast(design.published !== false ? 'اتخفى من المعرض' : 'اتنشر في المعرض');
  await loadDesigns();
}

async function deleteDesign(design) {
  if (!confirm(`متأكد إنك عايز تحذف "${design.title}"؟ الخطوة دي مش هترجع.`)) return;
  await authFetch(`/api/admin/designs/${design.id}`, { method: 'DELETE' });
  showToast('اتحذف التصميم');
  await loadDesigns();
}

// ---------- فورم الإضافة / التعديل ----------
function openForm(design = null) {
  editingId = design ? design.id : null;
  const root = document.getElementById('formRoot');
  root.innerHTML = `
    <div class="form-overlay" id="formOverlay">
      <form class="swatch-card form-box" id="designForm">
        <button type="button" class="close-x" id="formClose">✕</button>
        <div class="eyebrow">${design ? 'تعديل تصميم' : 'إضافة تصميم بصورة جاهزة'}</div>
        <h2>${design ? escapeHtml(design.title) : 'تصميم جديد'}</h2>

        <div class="f-field">
          <label for="fTitle">اسم التصميم</label>
          <input type="text" id="fTitle" value="${design ? escapeHtml(design.title) : ''}" required>
        </div>
        <div class="f-field">
          <label for="fCategory">التصنيف</label>
          <input type="text" id="fCategory" placeholder="مثال: فساتين سهرة" value="${design ? escapeHtml(design.category) : ''}">
        </div>
        <div class="f-field">
          <label for="fTags">وسوم (افصل بينها بفاصلة)</label>
          <input type="text" id="fTags" placeholder="حرير, ألوان دافئة, صيفي" value="${design && design.tags ? escapeHtml(design.tags.join(', ')) : ''}">
        </div>
        <div class="f-field">
          <label for="fDesc">الوصف</label>
          <textarea id="fDesc">${design ? escapeHtml(design.description || '') : ''}</textarea>
        </div>
        <div class="f-field">
          <label for="fImage">${design ? 'استبدال الصورة (اختياري)' : 'صورة التصميم'}</label>
          <input type="file" id="fImage" accept="image/*" ${design ? '' : 'required'}>
          <img class="preview-thumb" id="fPreview" src="${design ? design.imageUrl : ''}" style="${design ? 'display:block' : ''}">
        </div>

        <div class="form-actions">
          <button type="submit" class="btn wine">${design ? 'حفظ التعديلات' : 'إضافة للمعرض'}</button>
          <button type="button" class="btn ghost" id="formCancel">إلغاء</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById('formClose').addEventListener('click', closeForm);
  document.getElementById('formCancel').addEventListener('click', closeForm);
  document.getElementById('formOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'formOverlay') closeForm();
  });
  document.getElementById('fImage').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const prev = document.getElementById('fPreview');
    if (file) { prev.src = URL.createObjectURL(file); prev.style.display = 'block'; }
  });
  document.getElementById('designForm').addEventListener('submit', submitForm);
}

function closeForm() { document.getElementById('formRoot').innerHTML = ''; editingId = null; }

async function submitForm(e) {
  e.preventDefault();
  const title = document.getElementById('fTitle').value.trim();
  const category = document.getElementById('fCategory').value.trim() || 'عام';
  const tags = document.getElementById('fTags').value.trim();
  const description = document.getElementById('fDesc').value.trim();
  const imageFile = document.getElementById('fImage').files[0];

  try {
    if (editingId) {
      await authFetch(`/api/admin/designs/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, tags, description })
      });
      if (imageFile) {
        const fd = new FormData();
        fd.append('image', imageFile);
        await authFetch(`/api/admin/designs/${editingId}/image`, { method: 'PUT', body: fd });
      }
      showToast('اتحفظت التعديلات');
    } else {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('category', category);
      fd.append('tags', tags);
      fd.append('description', description);
      fd.append('image', imageFile);
      await authFetch('/api/admin/designs', { method: 'POST', body: fd });
      showToast('اتضاف التصميم للمعرض');
    }
    closeForm();
    await loadDesigns();
  } catch (err) {
    console.error(err);
    showToast('حصل خطأ، جرب تاني');
  }
}

function showToast(msg) {
  const root = document.getElementById('toastRoot');
  root.innerHTML = `<div class="toast">${escapeHtml(msg)}</div>`;
  setTimeout(() => { root.innerHTML = ''; }, 2600);
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}