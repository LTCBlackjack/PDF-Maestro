// ─── Shared App Utilities ─────────────────────────────────────────────────────

// Window controls
document.getElementById('btn-min')?.addEventListener('click', () => window.electronAPI.minimize());
document.getElementById('btn-max')?.addEventListener('click', () => window.electronAPI.maximize());
document.getElementById('btn-close')?.addEventListener('click', () => window.electronAPI.close());

// ─── Toast Notifications ──────────────────────────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('out');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

// ─── File Size Formatter ──────────────────────────────────────────────────────
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// ─── File Extension Mapper ────────────────────────────────────────────────────
function getFileExt(filename) {
  return filename.split('.').pop().toLowerCase();
}

function getFileIcon(ext) {
  const icons = { pdf: '📄', png: '🖼️', jpg: '🖼️', jpeg: '🖼️', txt: '📝', pptx: '📊', ppt: '📊' };
  return icons[ext] || '📁';
}

// ─── Progress Helpers ─────────────────────────────────────────────────────────
function setProgress(pct, label = '') {
  const bar = document.getElementById('progress-bar');
  const lbl = document.getElementById('progress-label');
  if (bar) bar.style.width = pct + '%';
  if (lbl && label) lbl.textContent = label;
}

function showSection(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('hidden');
    el.style.display = '';
  }
}
function hideSection(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

// ─── Setup Drag & Drop on Upload Zone ────────────────────────────────────────
function setupDropZone(zoneId, inputId, onFiles) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  if (!zone || !input) return;

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  });
  input.addEventListener('change', () => {
    if (input.files.length) onFiles(Array.from(input.files));
    input.value = '';
  });
}

// ─── Read File as ArrayBuffer ─────────────────────────────────────────────────
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file, 'utf-8');
  });
}

// ─── Save Uint8Array to Disk via Electron dialog ──────────────────────────────
async function saveBytes(bytes, defaultName, filters) {
  const result = await window.electronAPI.saveFileDialog({
    defaultPath: defaultName,
    filters: filters || [{ name: 'Archivos', extensions: ['*'] }],
  });
  if (result.canceled || !result.filePath) return null;
  await window.electronAPI.writeFile(result.filePath, bytes);
  return result.filePath;
}

// ─── Choose output folder ─────────────────────────────────────────────────────
async function chooseFolder(inputId) {
  const result = await window.electronAPI.openFileDialog({
    properties: ['openDirectory'],
    title: 'Selecciona carpeta de destino',
  });
  if (!result.canceled && result.filePaths.length) {
    document.getElementById(inputId).value = result.filePaths[0];
    return result.filePaths[0];
  }
  return null;
}
