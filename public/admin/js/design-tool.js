// أداة التصميم - Design Tool

(async function init() {
  const ok = await guardAdminPage();
  if (!ok) return;
  document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault(); logoutAdmin();
  });
  initDesignTool();
})();

function initDesignTool() {
  const svg = document.getElementById('stageSvg');
  const path = document.getElementById('garmentPath');
  const logo = document.getElementById('logoNode');
  const centerSeam = document.getElementById('centerSeam');
  
  // ========== أنواع القطع ==========
  const garmentTypes = {
    'فستان': 'M100,100 C100,100 60,180 60,300 C60,420 80,500 120,540 C140,555 160,560 200,560 C240,560 260,555 280,540 C320,500 340,420 340,300 C340,180 300,100 300,100 C300,100 280,70 250,55 C230,45 210,40 200,40 C190,40 170,45 150,55 C120,70 100,100 100,100 Z',
    'تيشرت': 'M100,120 C100,80 130,50 170,45 L200,40 L230,45 C270,50 300,80 300,120 L320,140 L310,160 L300,140 L300,400 C300,440 270,470 230,475 L200,480 L170,475 C130,470 100,440 100,400 L100,140 L90,160 L80,140 L100,120 Z',
    'بنطلون': 'M120,100 L120,300 L100,350 L100,400 L80,520 L120,520 L140,400 L160,400 L180,520 L220,520 L240,400 L260,400 L280,520 L320,520 L300,400 L300,350 L280,300 L280,100 L260,80 L240,60 L200,50 L160,60 L140,80 L120,100 Z',
    'جاكيت': 'M120,100 C120,60 150,35 190,30 L200,28 L210,30 C250,35 280,60 280,100 L300,120 L300,400 C300,450 270,490 230,500 L200,505 L170,500 C130,490 100,450 100,400 L100,120 L120,100 Z',
    'تنورة': 'M150,100 L150,350 C150,420 170,480 200,500 C230,480 250,420 250,350 L250,100 L240,80 L200,70 L160,80 L150,100 Z'
  };
  
  // عرض أنواع القطع
  const grid = document.getElementById('garmentTypeGrid');
  let activeType = 'فستان';
  grid.innerHTML = Object.keys(garmentTypes).map(type => `
    <div class="type-chip ${type === activeType ? 'active' : ''}" data-type="${type}">${type}</div>
  `).join('');
  
  grid.querySelectorAll('.type-chip').forEach(chip => {
    chip.addEventListener('click', function() {
      grid.querySelectorAll('.type-chip').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      activeType = this.dataset.type;
      updateGarment();
    });
  });
  
  function updateGarment() {
    path.setAttribute('d', garmentTypes[activeType] || garmentTypes['فستان']);
    // بعض القطع ليها درز وسطي
    if (activeType === 'بنطلون' || activeType === 'تنورة') {
      centerSeam.setAttribute('opacity', '0.3');
    } else {
      centerSeam.setAttribute('opacity', '0');
    }
  }
  updateGarment();
  
  // ========== الألوان ==========
  const colorInput = document.getElementById('baseColor');
  const colorHex = document.getElementById('baseColorHex');
  
  colorInput.addEventListener('input', function() {
    colorHex.value = this.value;
    path.setAttribute('fill', this.value);
  });
  
  // ========== النقشة ==========
  const fabricInput = document.getElementById('fabricUpload');
  const fabricImage = document.getElementById('fabricImage');
  const fabricOpacity = document.getElementById('fabricOpacity');
  
  fabricInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        fabricImage.setAttribute('href', e.target.result);
        // تطبيق النقشة
        path.setAttribute('fill', 'url(#fabricPattern)');
        // حفظ اللون الأساسي كاحتياطي
        fabricImage.setAttribute('opacity', fabricOpacity.value / 100);
      };
      reader.readAsDataURL(file);
    }
  });
  
  fabricOpacity.addEventListener('input', function() {
    fabricImage.setAttribute('opacity', this.value / 100);
  });
  
  document.getElementById('clearFabric').addEventListener('click', function() {
    fabricInput.value = '';
    fabricImage.setAttribute('href', '');
    path.setAttribute('fill', colorInput.value);
  });
  
  // ========== النص ==========
  const logoText = document.getElementById('logoText');
  const logoFont = document.getElementById('logoFont');
  const logoColor = document.getElementById('logoColor');
  const logoSize = document.getElementById('logoSize');
  
  logoText.addEventListener('input', updateLogo);
  logoFont.addEventListener('change', updateLogo);
  logoColor.addEventListener('input', updateLogo);
  logoSize.addEventListener('input', updateLogo);
  
  function updateLogo() {
    logo.textContent = logoText.value || '';
    logo.setAttribute('font-family', logoFont.value);
    logo.setAttribute('fill', logoColor.value);
    logo.setAttribute('font-size', logoSize.value);
  }
  // نص افتراضي
  logoText.value = 'ATELIER';
  updateLogo();
  
  // ========== سحب النص ==========
  let isDragging = false;
  let offsetX, offsetY;
  
  logo.addEventListener('mousedown', function(e) {
    isDragging = true;
    const rect = svg.getBoundingClientRect();
    const scaleX = svg.viewBox.baseVal.width / rect.width;
    const scaleY = svg.viewBox.baseVal.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    offsetX = x - parseFloat(logo.getAttribute('x'));
    offsetY = y - parseFloat(logo.getAttribute('y'));
    svg.style.cursor = 'grabbing';
  });
  
  document.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = svg.viewBox.baseVal.width / rect.width;
    const scaleY = svg.viewBox.baseVal.height / rect.height;
    let x = (e.clientX - rect.left) * scaleX - offsetX;
    let y = (e.clientY - rect.top) * scaleY - offsetY;
    // حدود القطعة
    x = Math.max(20, Math.min(380, x));
    y = Math.max(30, Math.min(570, y));
    logo.setAttribute('x', x);
    logo.setAttribute('y', y);
  });
  
  document.addEventListener('mouseup', function() {
    isDragging = false;
    svg.style.cursor = 'grab';
  });
  
  // دعم اللمس للأجهزة المحمولة
  let touchOffsetX, touchOffsetY;
  
  logo.addEventListener('touchstart', function(e) {
    const touch = e.touches[0];
    const rect = svg.getBoundingClientRect();
    const scaleX = svg.viewBox.baseVal.width / rect.width;
    const scaleY = svg.viewBox.baseVal.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    touchOffsetX = x - parseFloat(logo.getAttribute('x'));
    touchOffsetY = y - parseFloat(logo.getAttribute('y'));
  }, { passive: true });
  
  document.addEventListener('touchmove', function(e) {
    const touch = e.touches[0];
    if (!touch) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = svg.viewBox.baseVal.width / rect.width;
    const scaleY = svg.viewBox.baseVal.height / rect.height;
    let x = (touch.clientX - rect.left) * scaleX - touchOffsetX;
    let y = (touch.clientY - rect.top) * scaleY - touchOffsetY;
    x = Math.max(20, Math.min(380, x));
    y = Math.max(30, Math.min(570, y));
    logo.setAttribute('x', x);
    logo.setAttribute('y', y);
  }, { passive: true });
  
  // ========== إعادة الضبط ==========
  document.getElementById('resetDesign').addEventListener('click', function() {
    colorInput.value = '#A63D40';
    colorHex.value = '#A63D40';
    path.setAttribute('fill', '#A63D40');
    fabricInput.value = '';
    fabricImage.setAttribute('href', '');
    fabricOpacity.value = 70;
    logoText.value = 'ATELIER';
    logoFont.value = "'Playfair Display', serif";
    logoColor.value = '#211C16';
    logoSize.value = 20;
    updateLogo();
    logo.setAttribute('x', 200);
    logo.setAttribute('y', 200);
    activeType = 'فستان';
    grid.querySelectorAll('.type-chip').forEach(c => c.classList.remove('active'));
    grid.querySelector('[data-type="فستان"]').classList.add('active');
    updateGarment();
    showToast('تم إعادة الضبط');
  });
  
  // ========== تحميل PNG ==========
  document.getElementById('downloadBtn').addEventListener('click', function() {
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);
    source = source.replace(/<img[^>]*>/g, function(match) {
      const img = new Image();
      img.src = match.match(/href="([^"]*)"/)[1];
      return match;
    });
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#EDE7DD';
      ctx.fillRect(0, 0, 400, 600);
      ctx.drawImage(img, 0, 0);
      const link = document.createElement('a');
      link.download = 'design.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
  
  // ========== حفظ في المعرض ==========
  document.getElementById('saveGalleryBtn').addEventListener('click', function() {
    // تحويل SVG إلى Canvas لتصدير الصورة
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#EDE7DD';
      ctx.fillRect(0, 0, 400, 600);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(async function(blob) {
        const formData = new FormData();
        formData.append('image', blob, 'design.png');
        formData.append('title', logoText.value || 'تصميم جديد');
        formData.append('category', activeType);
        formData.append('tags', 'مصمم بالأداة');
        formData.append('description', `تصميم ${activeType} تم إنشاؤه باستخدام أداة التصميم`);
        
        try {
          const res = await authFetch('/api/admin/designs', {
            method: 'POST',
            body: formData
          });
          if (res.ok) {
            showToast('تم حفظ التصميم في المعرض 🎉');
          } else {
            showToast('حصل خطأ أثناء الحفظ');
          }
        } catch (err) {
          showToast('حصل خطأ، جرب تاني');
        }
      }, 'image/png');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
  
  // ========== Toast ==========
  function showToast(msg) {
    const root = document.getElementById('toastRoot');
    root.innerHTML = `<div class="toast">${msg}</div>`;
    setTimeout(() => { root.innerHTML = ''; }, 2600);
  }
}