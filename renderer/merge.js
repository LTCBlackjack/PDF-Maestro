// ─── Merge PDF Logic ──────────────────────────────────────────────────────────
// Uses pdf-lib loaded via CDN in the HTML

let fileList = [];

function renderFileList() {
  const listEl = document.getElementById('file-list');
  const countEl = document.getElementById('file-count-label');
  const section = document.getElementById('file-list-section');
  const tip = document.getElementById('tip-box');
  const mergeBtn = document.getElementById('merge-btn');

  if (fileList.length === 0) {
    section.classList.add('hidden');
    tip.classList.add('hidden');
    mergeBtn.disabled = true;
    return;
  }

  section.classList.remove('hidden');
  tip.classList.remove('hidden');
  tip.style.display = 'flex';
  countEl.textContent = `${fileList.length} archivo${fileList.length !== 1 ? 's' : ''}`;
  mergeBtn.disabled = fileList.length < 2;

  listEl.innerHTML = '';
  fileList.forEach((f, i) => {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.dataset.index = i;
    item.innerHTML = `
      <span class="file-drag-handle" title="Arrastra para reordenar">⠿</span>
      <span class="file-icon">📄</span>
      <div class="file-info">
        <div class="file-name">${f.name}</div>
        <div class="file-size">${formatSize(f.size)}</div>
      </div>
      <span style="font-size:11px;color:var(--text-muted);background:rgba(255,255,255,0.05);padding:3px 8px;border-radius:20px;">#${i + 1}</span>
      <button class="file-remove" data-index="${i}" title="Eliminar">✕</button>
    `;
    listEl.appendChild(item);
  });

  // Sortable
  if (window.Sortable) {
    Sortable.create(listEl, {
      handle: '.file-drag-handle',
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      onEnd(evt) {
        const moved = fileList.splice(evt.oldIndex, 1)[0];
        fileList.splice(evt.newIndex, 0, moved);
        renderFileList();
      },
    });
  }

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

// Add more button
document.getElementById('add-more-btn').addEventListener('click', () => {
  document.getElementById('file-input-extra').click();
});
document.getElementById('file-input-extra').addEventListener('change', function () {
  if (this.files.length) addFiles(Array.from(this.files));
  this.value = '';
});

// Clear all
document.getElementById('clear-all-btn').addEventListener('click', () => {
  fileList = [];
  renderFileList();
  hideSection('result-section');
});

// ─── Merge Action ──────────────────────────────────────────────────────────────
document.getElementById('merge-btn').addEventListener('click', async () => {
  if (fileList.length < 2) {
    showToast('Agrega al menos 2 archivos PDF', 'error');
    return;
  }

  const mergeBtn = document.getElementById('merge-btn');
  mergeBtn.disabled = true;
  showSection('progress-section');
  hideSection('result-section');
  setProgress(5, 'Leyendo archivos...');

  try {
    const { PDFDocument } = PDFLib;
    const mergedPdf = await PDFDocument.create();
    let totalPages = 0;

    for (let i = 0; i < fileList.length; i++) {
      setProgress(10 + (i / fileList.length) * 70, `Procesando: ${fileList[i].name}...`);
      const arrayBuffer = await readFileAsArrayBuffer(fileList[i]);
      const pdf = await PDFDocument.load(arrayBuffer);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(p => mergedPdf.addPage(p));
      totalPages += pdf.getPageCount();
    }

    setProgress(85, 'Generando PDF unificado...');
    const mergedBytes = await mergedPdf.save();

    setProgress(95, 'Guardando archivo...');
    const savedPath = await saveBytes(mergedBytes, 'documento_unificado.pdf', [
      { name: 'PDF', extensions: ['pdf'] },
    ]);

    setProgress(100, '¡Listo!');

    if (savedPath) {
      // Save to history
      await window.electronAPI.addHistory({
        type: 'merge',
        description: `${fileList.length} PDFs unificados → ${totalPages} páginas totales`,
        outputPath: savedPath,
      });

      document.getElementById('result-title').textContent = 'PDF unificado correctamente';
      document.getElementById('result-detail').textContent = `${fileList.length} archivos · ${totalPages} páginas → ${savedPath.split('\\').pop()}`;
      showSection('result-section');
      document.getElementById('open-folder-btn').onclick = () => window.electronAPI.showItemInFolder(savedPath);

      showToast('PDF unificado correctamente', 'success');
      fileList = [];
      renderFileList();
    } else {
      showToast('Guardado cancelado', 'info');
    }
  } catch (err) {
    console.error(err);
    showToast('Error al unificar: ' + err.message, 'error');
  } finally {
    hideSection('progress-section');
    mergeBtn.disabled = fileList.length < 2;
  }
});

// New operation
document.getElementById('new-merge-btn')?.addEventListener('click', () => {
  hideSection('result-section');
  fileList = [];
  renderFileList();
});
