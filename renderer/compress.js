// ─── Compress PDF Logic ────────────────────────────────────────────────────────
// Uses pdf-lib structural rewriting to free unreferenced objects

let fileList = [];

function renderFileList() {
  const listEl = document.getElementById('file-list');
  const countEl = document.getElementById('file-count-label');
  const section = document.getElementById('file-list-section');
  const compressBtn = document.getElementById('compress-btn');

  if (fileList.length === 0) {
    section.classList.add('hidden');
    compressBtn.disabled = true;
    return;
  }

  section.classList.remove('hidden');
  countEl.textContent = `${fileList.length} archivo${fileList.length !== 1 ? 's' : ''}`;
  compressBtn.disabled = false;

  listEl.innerHTML = '';
  fileList.forEach((f, i) => {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.dataset.index = i;
    item.innerHTML = `
      <span class="file-icon" style="background:rgba(239,68,68,0.1)">📄</span>
      <div class="file-info">
        <div class="file-name">${f.name}</div>
        <div class="file-size">${formatSize(f.size)}</div>
      </div>
      <button class="file-remove" data-index="${i}" title="Eliminar">✕</button>
    `;
    listEl.appendChild(item);
  });

  // Remove buttons
  listEl.querySelectorAll('.file-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      fileList.splice(parseInt(btn.dataset.index), 1);
      renderFileList();
    });
  });
}

function addFiles(files) {
  const pdfs = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
  if (pdfs.length !== files.length) {
    showToast('Solo se permiten archivos PDF', 'error');
  }
  fileList.push(...pdfs);
  hideSection('result-section');
  renderFileList();
}

// Setup drop zone
setupDropZone('drop-zone', 'file-input', addFiles);

// Add more & Clear all
document.getElementById('add-more-btn').addEventListener('click', () => {
  document.getElementById('file-input-extra').click();
});
document.getElementById('file-input-extra').addEventListener('change', function () {
  if (this.files.length) addFiles(Array.from(this.files));
  this.value = '';
});
document.getElementById('clear-all-btn').addEventListener('click', () => {
  fileList = [];
  renderFileList();
  hideSection('result-section');
});

// ─── Compress Action ───────────────────────────────────────────────────────────
document.getElementById('compress-btn').addEventListener('click', async () => {
  if (fileList.length === 0) return;

  const compressBtn = document.getElementById('compress-btn');
  compressBtn.disabled = true;
  showSection('progress-section');
  hideSection('result-section');

  try {
    let savedPaths = [];
    let initialTotalSize = 0;
    let finalTotalSize = 0;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const inputPath = file.path;
      if (!inputPath) throw new Error('No se pudo encontrar la ruta original del archivo.');

      initialTotalSize += file.size;

      const nameParts = file.name.split('.');
      nameParts.pop();
      const defaultName = `${nameParts.join('.')}_comprimido.pdf`;

      setProgress(((i + 0.1) / fileList.length) * 90, `Guardar destino: ${file.name}...`);
      
      const result = await window.electronAPI.saveFileDialog({
        defaultPath: defaultName,
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      });

      if (result.canceled || !result.filePath) {
        continue;
      }

      const quality = document.querySelector('input[name="comp-quality"]:checked').value;
      const outputPath = result.filePath;
      
      setProgress(((i + 0.4) / fileList.length) * 90, `Comprimiendo imagenes de ${file.name}... Esto puede tardar.`);
      
      await window.electronAPI.compressGS(inputPath, outputPath, quality);
      
      const newSize = await window.electronAPI.getFileSize(outputPath);
      finalTotalSize += newSize;
      savedPaths.push(outputPath);
    }

    setProgress(100, '¡Compresión completada!');

    if (savedPaths.length > 0) {
      // Calculate savings
      const savedBytesDiff = initialTotalSize - finalTotalSize;
      const percentage = initialTotalSize > 0 ? ((savedBytesDiff / initialTotalSize) * 100).toFixed(1) : 0;
      
      let detailMsg = savedBytesDiff > 0 
        ? `Ahorraste ${formatSize(savedBytesDiff)} (${percentage}% del total). `
        : `El formato o imágenes del PDF original no se pudieron reducir más. `;
      
      detailMsg += `Guardado en: ${savedPaths[0].split('\\').slice(0,-1).join('\\')}`;

      await window.electronAPI.addHistory({
        type: 'compress',
        description: `${savedPaths.length} PDF(s) comprimidos (${formatSize(initialTotalSize)} → ${formatSize(finalTotalSize)})`,
        outputPath: savedPaths[0]
      });

      document.getElementById('result-detail').textContent = detailMsg;
      showSection('result-section');
      document.getElementById('open-folder-btn').onclick = () => window.electronAPI.showItemInFolder(savedPaths[0]);

      showToast('Compresión exitosa', 'success');
      fileList = [];
      renderFileList();
    } else {
      showToast('Operación cancelada', 'info');
    }
  } catch (err) {
    console.error(err);
    showToast('Error al comprimir: ' + err.message, 'error');
  } finally {
    hideSection('progress-section');
    compressBtn.disabled = fileList.length === 0;
  }
});

document.getElementById('new-compress-btn').addEventListener('click', () => {
  hideSection('result-section');
  fileList = [];
  renderFileList();
});
