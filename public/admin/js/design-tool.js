// =============================================
// أداة التصميم المتطورة - Design Tool Pro
// =============================================

(async function init() {
  const ok = await guardAdminPage();
  if (!ok) return;
  
  document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    logoutAdmin();
  });
  
  initDesignTool();
})();

function initDesignTool() {
  const svg = document.getElementById('stageSvg');
  const path = document.getElementById('garmentPath');
  const logo = document.getElementById('logoNode');
  const centerSeam = document.getElementById('centerSeam');
  const detailsGroup = document.getElementById('detailsGroup');
  const pocketLeft = document.getElementById('pocketLeft');
  const pocketRight = document.getElementById('pocketRight');
  const button1 = document.getElementById('button1');
  const button2 = document.getElementById('button2');
  const button3 = document.getElementById('button3');

  // =============================================
  // 1. أنواع القطع - أشكال أكثر دقة
  // =============================================
  
  const garmentTypes = {
    'فستان': {
      d: 'M130,130 C130,80 170,50 220,45 L250,42 L280,45 C330,50 370,80 370,130 L380,200 L370,320 C370,420 340,500 300,560 C270,600 240,620 250,640 C260,620 230,600 200,560 C160,500 130,420 130,320 L120,200 L130,130 Z',
      hasSeam: false,
      hasPockets: false,
      hasButtons: false
    },
    'تيشرت': {
      d: 'M125,100 C125,70 155,45 195,38 L230,32 L265,38 C305,45 340,70 345,105 L355,130 L340,160 L335,140 L335,380 C335,420 310,450 270,465 L250,470 L230,465 C190,450 165,420 165,380 L165,140 L160,160 L145,130 L155,105 L125,100 Z',
      hasSeam: false,
      hasPockets: false,
      hasButtons: false
    },
    'بنطلون': {
      d: 'M140,130 L140,320 L120,370 L120,430 L95,540 L140,540 L160,430 L190,430 L210,540 L255,540 L275,430 L305,430 L325,540 L370,540 L345,430 L345,370 L325,320 L325,130 L300,105 L275,85 L250,75 L220,85 L195,105 L170,130 L140,130 Z',
      hasSeam: true,
      hasPockets: true,
      hasButtons: false
    },
    'جاكيت': {
      d: 'M140,105 C140,65 170,40 215,32 L250,28 L285,32 C330,40 360,65 360,105 L375,135 L365,380 C365,440 335,490 290,510 L250,520 L210,510 C165,490 135,440 135,380 L125,135 L140,105 Z',
      hasSeam: false,
      hasPockets: true,
      hasButtons: true
    },
    'تنورة': {
      d: 'M175,120 L175,350 C175,430 200,510 250,540 C300,510 325,430 325,350 L325,120 L310,95 L250,80 L190,95 L175,120 Z',
      hasSeam: true,
      hasPockets: false,
      hasButtons: false
    },
    'قميص': {
      d: 'M115,110 C115,75 145,50 190,42 L230,36 L270,42 C315,50 350,75 355,110 L365,140 L350,170 L345,150 L345,390 C345,430 315,460 270,475 L250,480 L230,475 C185,460 155,430 155,390 L155,150 L150,170 L135,140 L145,110 L115,110 Z',
      hasSeam: false,
      hasPockets: true,
      hasButtons: true
    }
  };

  let activeType = 'فستان';
  let currentZoom = 1;
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  // =============================================
  // 2. عرض أنواع القطع
  // =============================================
  
  const grid = document.getElementById('garmentTypeGrid');
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

  // =============================================
  // 3. تحديث القطعة
  // =============================================
  
  function updateGarment() {
    const type = garmentTypes[activeType];
    if (!type) return;

    path.setAttribute('d', type.d);

    // خط الوسط
    centerSeam.setAttribute('opacity', type.hasSeam ? '0.4' : '0');

    // التفاصيل (جيوب، أزرار)
    const detailLevel = parseInt(document.getElementById('detailLevel').value);
    const showDetails = detailLevel > 0;

    detailsGroup.setAttribute('opacity', showDetails ? '1' : '0');
    
    // جيوب
    pocketLeft.setAttribute('opacity', type.hasPockets && showDetails ? '0.6' : '0');
    pocketRight.setAttribute('opacity', type.hasPockets && showDetails ? '0.6' : '0');

    // أزرار
    const btnOpacity = type.hasButtons && showDetails ? '0.8' : '0';
    button1.setAttribute('opacity', btnOpacity);
    button2.setAttribute('opacity', btnOpacity);
    button3.setAttribute('opacity', btnOpacity);
  }

  // =============================================
  // 4. الألوان
  // =============================================
  
  const colorInput = document.getElementById('baseColor');
  const colorHex = document.getElementById('baseColorHex');
  const accentColor = document.getElementById('accentColor');
  const accentHex = document.getElementById('accentColorHex');

  colorInput.addEventListener('input', function() {
    colorHex.value = this.value;
    path.setAttribute('fill', this.value);
  });

  accentColor.addEventListener('input', function() {
    accentHex.value = this.value;
    // تحديث لون التفاصيل
    button1.setAttribute('fill', this.value);
    button2.setAttribute('fill', this.value);
    button3.setAttribute('fill', this.value);
  });

  // =============================================
  // 5. سمك الحواف
  // =============================================
  
  const strokeWidth = document.getElementById('strokeWidth');
  const strokeWidthValue = document.getElementById('strokeWidthValue');

  strokeWidth.addEventListener('input', function() {
    strokeWidthValue.textContent = this.value;
    path.setAttribute('stroke-width', this.value);
  });

  // =============================================
  // 6. مستوى التفاصيل
  // =============================================
  
  const detailLevel = document.getElementById('detailLevel');
  const detailLevelValue = document.getElementById('detailLevelValue');

  detailLevel.addEventListener('input', function() {
    const levels = ['بسيط', 'وسط', 'متقدم'];
    detailLevelValue.textContent = levels[parseInt(this.value)];
    updateGarment();
  });

  // =============================================
  // 7. النقشة والقماش
  // =============================================
  
  const fabricInput = document.getElementById('fabricUpload');
  const fabricImage = document.getElementById('fabricImage');
  const fabricOpacity = document.getElementById('fabricOpacity');
  const opacityValue = document.getElementById('opacityValue');

  fabricInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        fabricImage.setAttribute('href', e.target.result);
        path.setAttribute('fill', 'url(#fabricPattern)');
        fabricImage.setAttribute('opacity', fabricOpacity.value / 100);
        showToast('✅ تم تطبيق نقشة القماش');
      };
      reader.readAsDataURL(file);
    }
  });

  fabricOpacity.addEventListener('input', function() {
    opacityValue.textContent = this.value;
    fabricImage.setAttribute('opacity', this.value / 100);
  });

  document.getElementById('clearFabric').addEventListener('click', function() {
    fabricInput.value = '';
    fabricImage.setAttribute('href', '');
    path.setAttribute('fill', colorInput.value);
    showToast('🗑️ تم إزالة النقشة');
  });

  // =============================================
  // 8. النص والشعار
  // =============================================
  
  const logoText = document.getElementById('logoText');
  const logoFont = document.getElementById('logoFont');
  const logoColor = document.getElementById('logoColor');
  const logoSize = document.getElementById('logoSize');
  const logoSizeValue = document.getElementById('logoSizeValue');

  function updateLogo() {
    logo.textContent = logoText.value || 'M for MADA';
    logo.setAttribute('font-family', logoFont.value);
    logo.setAttribute('fill', logoColor.value);
    logo.setAttribute('font-size', logoSize.value);
    logoSizeValue.textContent = logoSize.value;
  }

  logoText.addEventListener('input', updateLogo);
  logoFont.addEventListener('change', updateLogo);
  logoColor.addEventListener('input', updateLogo);
  logoSize.addEventListener('input', updateLogo);

  // النص الافتراضي
  logoText.value = 'M for MADA';
  updateLogo();

  // =============================================
  // 9. سحب النص
  // =============================================
  
  const logoNode = document.getElementById('logoNode');

  logoNode.addEventListener('mousedown', function(e) {
    const rect = svg.getBoundingClientRect();
    const scaleX = svg.viewBox.baseVal.width / rect.width;
    const scaleY = svg.viewBox.baseVal.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    dragOffsetX = x - parseFloat(this.getAttribute('x'));
    dragOffsetY = y - parseFloat(this.getAttribute('y'));
    isDragging = true;
    this.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = svg.viewBox.baseVal.width / rect.width;
    const scaleY = svg.viewBox.baseVal.height / rect.height;
    let x = (e.clientX - rect.left) * scaleX - dragOffsetX;
    let y = (e.clientY - rect.top) * scaleY - dragOffsetY;
    x = Math.max(20, Math.min(480, x));
    y = Math.max(40, Math.min(650, y));
    logoNode.setAttribute('x', x);
    logoNode.setAttribute('y', y);
  });

  document.addEventListener('mouseup', function() {
    isDragging = false;
    logoNode.style.cursor = 'move';
  });

  // دعم اللمس
  let touchOffsetX = 0;
  let touchOffsetY = 0;

  logoNode.addEventListener('touchstart', function(e) {
    const touch = e.touches[0];
    const rect = svg.getBoundingClientRect();
    const scaleX = svg.viewBox.baseVal.width / rect.width;
    const scaleY = svg.viewBox.baseVal.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    touchOffsetX = x - parseFloat(this.getAttribute('x'));
    touchOffsetY = y - parseFloat(this.getAttribute('y'));
  }, { passive: true });

  document.addEventListener('touchmove', function(e) {
    const touch = e.touches[0];
    if (!touch) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = svg.viewBox.baseVal.width / rect.width;
    const scaleY = svg.viewBox.baseVal.height / rect.height;
    let x = (touch.clientX - rect.left) * scaleX - touchOffsetX;
    let y = (touch.clientY - rect.top) * scaleY - touchOffsetY;
    x = Math.max(20, Math.min(480, x));
    y = Math.max(40, Math.min(650, y));
    logoNode.setAttribute('x', x);
    logoNode.setAttribute('y', y);
  }, { passive: true });

  // =============================================
  // 10. التحكم في التكبير
  // =============================================
  
  const zoomLevel = document.getElementById('zoomLevel');
  const stagePanel = document.querySelector('.stage-panel');
  const stageSvg = document.getElementById('stageSvg');

  function updateZoom() {
    stageSvg.style.transform = `scale(${currentZoom})`;
    stageSvg.style.transformOrigin = 'center';
    zoomLevel.textContent = `${Math.round(currentZoom * 100)}%`;
  }

  document.getElementById('zoomIn').addEventListener('click', function() {
    if (currentZoom < 2) {
      currentZoom += 0.1;
      updateZoom();
    }
  });

  document.getElementById('zoomOut').addEventListener('click', function() {
    if (currentZoom > 0.5) {
      currentZoom -= 0.1;
      updateZoom();
    }
  });

  document.getElementById('resetZoom').addEventListener('click', function() {
    currentZoom = 1;
    updateZoom();
  });

  // =============================================
  // 11. إعادة الضبط
  // =============================================
  
  document.getElementById('resetDesign').addEventListener('click', function() {
    // إعادة الألوان
    colorInput.value = '#A63D40';
    colorHex.value = '#A63D40';
    path.setAttribute('fill', '#A63D40');
    
    accentColor.value = '#B8922E';
    accentHex.value = '#B8922E';
    button1.setAttribute('fill', '#B8922E');
    button2.setAttribute('fill', '#B8922E');
    button3.setAttribute('fill', '#B8922E');
    
    // إعادة النقشة
    fabricInput.value = '';
    fabricImage.setAttribute('href', '');
    fabricOpacity.value = 70;
    opacityValue.textContent = '70';
    
    // إعادة النص
    logoText.value = 'M for MADA';
    logoFont.value = "'Playfair Display', serif";
    logoColor.value = '#211C16';
    logoSize.value = 22;
    logoSizeValue.textContent = '22';
    updateLogo();
    logoNode.setAttribute('x', 250);
    logoNode.setAttribute('y', 220);
    
    // إعادة سمك الحواف
    strokeWidth.value = 2.5;
    strokeWidthValue.textContent = '2.5';
    path.setAttribute('stroke-width', '2.5');
    
    // إعادة مستوى التفاصيل
    detailLevel.value = 1;
    detailLevelValue.textContent = 'وسط';
    
    // إعادة نوع القطعة
    activeType = 'فستان';
    grid.querySelectorAll('.type-chip').forEach(c => c.classList.remove('active'));
    grid.querySelector('[data-type="فستان"]').classList.add('active');
    
    // إعادة التكبير
    currentZoom = 1;
    updateZoom();
    
    updateGarment();
    showToast('🔄 تم إعادة الضبط بالكامل');
  });

  // =============================================
  // 12. تحميل PNG
  // =============================================
  
  document.getElementById('downloadBtn').addEventListener('click', function() {
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 700;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#
