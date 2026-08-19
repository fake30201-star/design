let ALL_DESIGNS = [];
let activeCategory = 'الكل';

async function loadDesigns() {
  try {
    const res = await fetch('/api/designs');
    ALL_DESIGNS = await res.json();
    renderFilters();
    renderGrid();
  } catch (err) {
    console.error(err);
    document.getElementById('grid').innerHTML =
      '<p style="color:#a63d40">مقدرناش نجيب التصاميم دلوقتي، جرب تاني.</p>';
  }
}

function renderFilters() {
  const cats = ['الكل', ...new Set(ALL_DESIGNS.map(d => d.category).filter(Boolean))];
  const wrap = document.getElementById('filters');
  wrap.innerHTML = cats.map(c => `
    <button class="filter-chip ${c === activeCategory ? 'active' : ''}" data-cat="${escapeHtml(c)}">
      ${escapeHtml(c)}
    </button>`).join('');

  wrap.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      renderFilters();
      renderGrid();
    });
  });
}

function renderGrid() {
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  const list = activeCategory === 'الكل'
    ? ALL_DESIGNS
    : ALL_DESIGNS.filter(d => d.category === activeCategory);

  if (list.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  grid.innerHTML = list.map(d => `
    <article class="swatch-card design-card" data-id="${d.id}">
      <img class="thumb" src="${d.imageUrl}" alt="${escapeHtml(d.title)}" loading="lazy">
      <div class="info">
        <div class="cat">${escapeHtml(d.category || 'عام')}</div>
        <h3>${escapeHtml(d.title)}</h3>
        <p class="desc">${escapeHtml(truncate(d.description, 80))}</p>
        ${d.tags && d.tags.length ? `<div class="tags">${d.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('.design-card').forEach(card => {
    card.addEventListener('click', () => openModal(card.dataset.id));
  });
}

function openModal(id) {
  const d = ALL_DESIGNS.find(x => x.id === id);
  if (!d) return;
  const root = document.getElementById('modalRoot');
  root.innerHTML = `
    <div class="modal-overlay" id="overlay">
      <div class="modal-box swatch-card">
        <img src="${d.imageUrl}" alt="${escapeHtml(d.title)}">
        <div class="modal-body">
          <button class="modal-close" id="closeModal" aria-label="قفل">✕</button>
          <div class="eyebrow">${escapeHtml(d.category || 'عام')}</div>
          <h2>${escapeHtml(d.title)}</h2>
          <p style="color:var(--ink-soft)">${escapeHtml(d.description || 'من غير وصف.')}</p>
          ${d.tags && d.tags.length ? `<div class="tags">${d.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
        </div>
      </div>
    </div>`;
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('overlay').addEventListener('click', (e) => {
    if (e.target.id === 'overlay') closeModal();
  });
}
function closeModal() { document.getElementById('modalRoot').innerHTML = ''; }

function truncate(s, n) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n) + '…' : s;
}
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

loadDesigns();