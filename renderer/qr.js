// ─── Generador de Código QR ───────────────────────────────────────────────────

let qrCode = null;
let currentLogoFile = null;

// Predeterminados de estilos (basados en requerimientos del usuario)
const presets = {
  'classic': {
    dots: { type: 'square', color: '#000000' },
    corners: { type: 'square', color: '#000000' },
    bg: '#ffffff'
  },
  'modern-blue': { // Basado en imagen de "OKHA"
    dots: { type: 'extra-rounded', color: '#023e8a' },
    corners: { type: 'dot', color: '#000000' },
    bg: '#ffffff'
  },
  'vcard-purple': { // Basado en imagen de "vCard"
    dots: { type: 'classy', color: '#6d28d9' },
    corners: { type: 'extra-rounded', color: '#4c1d95' },
    bg: '#ffffff'
  },
  'heart-pink': { // Basado en imagen de corazón
    dots: { type: 'square', color: '#e11d48' },
    corners: { type: 'square', color: '#e11d48' },
    bg: '#ffffff'
  },
  'maestro': { // Tema oscuro de PDF Maestro
    dots: { type: 'rounded', color: '#a5b4fc' }, // Indigo-300
    corners: { type: 'extra-rounded', color: '#8b5cf6' }, // Violet-500
    bg: '#0f1117'
  },
  'spotify-green': { // Estilo vibrante musical
    dots: { type: 'rounded', color: '#1db954' },
    corners: { type: 'extra-rounded', color: '#000000' },
    bg: '#ffffff'
  },
  'luxury-gold': { // Minimalista y elegante
    dots: { type: 'classy', color: '#b8860b' },
    corners: { type: 'square', color: '#8b6508' },
    bg: '#ffffff'
  },
  'cyber-neon': { // Estilo oscuro tecnológico
    dots: { type: 'square', color: '#00ffff' },
    corners: { type: 'square', color: '#ff00ff' },
    bg: '#000000'
  },
  'sunset-orange': { // Cálido fluido
    dots: { type: 'extra-rounded', color: '#ff4500' },
    corners: { type: 'dot', color: '#ff8c00' },
    bg: '#ffffff'
  }
};

window.addEventListener('DOMContentLoaded', () => {
  initQR();
  setupListeners();
});

function initQR() {
  qrCode = new QRCodeStyling({
    width: 300,
    height: 300,
    type: "svg",
    data: "https://pdf-maestro.local",
    image: "",
    dotsOptions: { color: "#000000", type: "square" },
    backgroundOptions: { color: "#ffffff", },
    imageOptions: { crossOrigin: "anonymous", margin: 10 },
    cornersSquareOptions: { type: "square", color: "#000000" },
    cornersDotOptions: { type: "square", color: "#000000" }
  });
  
  const container = document.getElementById("qr-canvas-container");
  container.innerHTML = '';
  qrCode.append(container);
  updateQR();
}

function updateQR() {
  if (!qrCode) return;
  
  // 1. Obtener datos (URL vs vCard)
  const isVcard = document.querySelector('.tab[data-tab="vcard"]').classList.contains('active');
  let dataVal = "";

  if (isVcard) {
    const fn = document.getElementById('vc-nombre').value || "";
    const ln = document.getElementById('vc-apellidos').value || "";
    const tel = document.getElementById('vc-tel').value || "";
    const email = document.getElementById('vc-email').value || "";
    const web = document.getElementById('vc-web').value || "";
    const org = document.getElementById('vc-empresa').value || "";
    
    // Generar texto en formato vCard
    dataVal = `BEGIN:VCARD\nVERSION:3.0\nN:${ln};${fn};;;\nFN:${fn} ${ln}\nORG:${org}\nTEL;TYPE=CELL:${tel}\nEMAIL:${email}\nURL:${web}\nEND:VCARD`;
  } else {
    dataVal = document.getElementById('qr-data-url').value || "https://";
  }

  // 2. Obtener estilos del panel avanzado
  const dotColor = document.getElementById('qr-color-dots').value;
  let bgColor = document.getElementById('qr-color-bg').value;
  const isBgTransparent = document.getElementById('qr-bg-transparent').checked;
  const dotType = document.getElementById('qr-shape-dots').value;
  const cornerType = document.getElementById('qr-shape-corners').value;

  const bgInput = document.getElementById('qr-color-bg');
  if (isBgTransparent) {
    bgColor = "transparent";
    document.getElementById("qr-canvas-container").classList.add('is-transparent');
    bgInput.style.opacity = '0.3';
    bgInput.style.pointerEvents = 'none';
  } else {
    document.getElementById("qr-canvas-container").classList.remove('is-transparent');
    bgInput.style.opacity = '1';
    bgInput.style.pointerEvents = 'auto';
  }

  qrCode.update({
    data: dataVal,
    dotsOptions: { color: dotColor, type: dotType },
    backgroundOptions: { color: bgColor },
    cornersSquareOptions: { type: cornerType, color: dotColor },
    cornersDotOptions: { type: cornerType === 'square' ? 'square' : 'dot', color: dotColor },
    image: currentLogoFile || ""
  });
}

// ─── Setup Event Listeners ────────────────────────────────────────────────────
function setupListeners() {
  // Tabs
  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', (e) => {
      document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
      
      const tabId = e.target.dataset.tab;
      e.target.classList.add('active');
      document.getElementById(`tab-${tabId}`).classList.remove('hidden');
      updateQR();
    });
  });

  // Inputs en tiempo real
  document.getElementById('qr-data-url').addEventListener('input', updateQR);
  ['vc-nombre', 'vc-apellidos', 'vc-tel', 'vc-email', 'vc-web', 'vc-empresa'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateQR);
  });

  // Customization inputs en tiempo real
  ['qr-color-dots', 'qr-color-bg', 'qr-shape-dots', 'qr-shape-corners'].forEach(id => {
    document.getElementById(id).addEventListener('input', (e) => {
      if(e.target.type === 'color') {
        e.target.nextElementSibling.textContent = e.target.value;
      }
      updateQR();
    });
  });

  document.getElementById('qr-bg-transparent').addEventListener('change', updateQR);

  // Presets
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const presetId = e.target.dataset.preset;
      applyPreset(presetId);
    });
  });

  // Logo uploader
  const logoInput = document.getElementById('logo-input');
  const btnUpload = document.getElementById('btn-upload-logo');
  const btnClear = document.getElementById('btn-clear-logo');

  btnUpload.addEventListener('click', () => logoInput.click());
  btnClear.addEventListener('click', () => {
    currentLogoFile = null;
    btnClear.style.display = 'none';
    updateQR();
  });

  logoInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('El logo debe pesar menos de 2MB', 'error');
        return;
      }
      currentLogoFile = await readFileAsDataURL(file);
      btnClear.style.display = 'inline-block';
      updateQR();
    }
  });

  // Downloads
  document.getElementById('btn-download-png').addEventListener('click', () => {
    showToast('Generando PNG de alta calidad...', 'info', 1500);

    // Obtener valores actuales de la UI
    const isVcard = document.querySelector('.tab[data-tab="vcard"]').classList.contains('active');
    let dataVal = "";

    if (isVcard) {
      const fn = document.getElementById('vc-nombre').value || "";
      const ln = document.getElementById('vc-apellidos').value || "";
      const tel = document.getElementById('vc-tel').value || "";
      const email = document.getElementById('vc-email').value || "";
      const web = document.getElementById('vc-web').value || "";
      const org = document.getElementById('vc-empresa').value || "";
      dataVal = `BEGIN:VCARD\nVERSION:3.0\nN:${ln};${fn};;;\nFN:${fn} ${ln}\nORG:${org}\nTEL;TYPE=CELL:${tel}\nEMAIL:${email}\nURL:${web}\nEND:VCARD`;
    } else {
      dataVal = document.getElementById('qr-data-url').value || "https://";
    }

    const dotColor = document.getElementById('qr-color-dots').value;
    let bgColor = document.getElementById('qr-color-bg').value;
    const isBgTransparent = document.getElementById('qr-bg-transparent').checked;
    const dotType = document.getElementById('qr-shape-dots').value;
    const cornerType = document.getElementById('qr-shape-corners').value;

    if (isBgTransparent) {
      bgColor = "transparent";
    }

    // Crear una instancia de alta resolución temporal
    const qrHighRes = new QRCodeStyling({
      width: 1200,
      height: 1200,
      type: "canvas",
      data: dataVal,
      image: currentLogoFile || "",
      dotsOptions: { color: dotColor, type: dotType },
      backgroundOptions: { color: bgColor },
      cornersSquareOptions: { type: cornerType, color: dotColor },
      cornersDotOptions: { type: cornerType === 'square' ? 'square' : 'dot', color: dotColor },
      imageOptions: { 
        crossOrigin: "anonymous", 
        margin: 15,
        imageSize: 0.35, // Proporción perfecta para no obstaculizar escaneo
        hideBackgroundDots: true 
      }
    });

    const tempDiv = document.createElement('div');
    qrHighRes.append(tempDiv);

    // Esperar a que se procese el canvas
    setTimeout(() => {
      qrHighRes.download({ name: "pdf-maestro-qr", extension: "png" });
      showToast('Código QR de alta calidad descargado (PNG)', 'success');
    }, 600);
  });

  document.getElementById('btn-download-svg').addEventListener('click', () => {
    qrCode.download({ name: "pdf-maestro-qr", extension: "svg" });
    showToast('Código QR descargado (SVG)', 'success');
  });
}

function applyPreset(id) {
  const p = presets[id];
  if (!p) return;

  // Actualizar UI
  document.getElementById('qr-color-dots').value = p.dots.color;
  document.getElementById('qr-color-dots').nextElementSibling.textContent = p.dots.color;
  
  document.getElementById('qr-color-bg').value = p.bg;
  document.getElementById('qr-color-bg').nextElementSibling.textContent = p.bg;
  document.getElementById('qr-bg-transparent').checked = false;

  document.getElementById('qr-shape-dots').value = p.dots.type;
  document.getElementById('qr-shape-corners').value = p.corners.type;

  updateQR();
  showToast(`Estilo '${id}' aplicado`, 'info', 2000);
}
