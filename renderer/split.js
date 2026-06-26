// ─── Split PDF Logic ──────────────────────────────────────────────────────────
// Uses pdf-lib loaded via CDN

let selectedFile = null;
let totalPageCount = 0;
let outputFolder = '';

// Setup drop zone
setupDropZone('drop-zone', 'file-input', files => {
  const pdf = files.find(f => f.name.toLowerCase().endsWith('.pdf'));
  if (!pdf) { showToast('Por favor selecciona un archivo PDF', 'error'); return; }
  loadPDF(pdf);
});

async function loadPDF(file) {
  selectedFile = file;
  try {
    const buffer = await readFileAsArrayBuffer(file);
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.load(buffer);
    totalPageCount = doc.getPageCount();

    document.getElementById('selected-filename').textContent = file.name;
    document.getElementById('selected-pages').textContent = `${totalPageCount} página${totalPageCount !== 1 ? 's' : ''} · ${formatSize(file.size)}`;

    showSection('split-options');
    hideSection('drop-zone');
    document.getElementById('split-btn').disabled = false;
  } catch (err) {
    showToast('No se pudo leer el PDF: ' + err.message, 'error');
    selectedFile = null;
  }
}

document.getElementById('change-file-btn')?.addEventListener('click', () => {
  selectedFile = null;
  totalPageCount = 0;
  hideSection('split-options');
  showSection('drop-zone');
  hideSection('result-section');
  document.getElementById('split-btn').disabled = true;
});

document.getElementById('choose-folder-btn')?.addEventListener('click', async () => {
  outputFolder = await chooseFolder('output-folder') || outputFolder;
});

// Mode switcher
document.getElementById('split-mode')?.addEventListener('change', function () {
  if (this.value === 'ranges') {
    showSection('ranges-section');
    hideSection('parts-section');
  } else if (this.value === 'parts') {
    hideSection('ranges-section');
    showSection('parts-section');
  } else {
    hideSection('ranges-section');
    hideSection('parts-section');
  }
});

// ─── Parse page ranges ────────────────────────────────────────────────────────
function parseRanges(str, max) {
  // Reemplazar guiones largos por guiones normales para evitar errores de copia/pega
  str = str.replace(/—|–/g, '-');
  const parts = str.split(',').map(s => s.trim()).filter(Boolean);
  const groups = [];
  for (const part of parts) {
    if (part.includes('-')) {
      const tokens = part.split('-');
      if (tokens.length !== 2) throw new Error(`Rango con formato incorrecto: "${part}"`);
      const a = parseInt(tokens[0], 10);
      const b = parseInt(tokens[1], 10);
      if (isNaN(a) || isNaN(b) || a < 1 || b > max) {
        throw new Error(`Rango inválido: "${part}". El documento tiene ${max} páginas.`);
      }
      if (a > b) {
        throw new Error(`El inicio del rango no puede ser mayor al final: "${part}"`);
      }
      const pages = [];
      for (let i = a; i <= b; i++) pages.push(i - 1); // 0-indexed
      groups.push({ label: `${a}-${b}`, pages });
    } else {
      const n = parseInt(part, 10);
      if (isNaN(n) || n < 1 || n > max) {
        throw new Error(`Página inválida: "${part}". Las páginas van de 1 a ${max}.`);
      }
      groups.push({ label: String(n), pages: [n - 1] });
    }
  }
  return groups;
}

// ─── Split Action ─────────────────────────────────────────────────────────────
document.getElementById('split-btn')?.addEventListener('click', async () => {
  if (!selectedFile) { showToast('Selecciona un PDF primero', 'error'); return; }
  if (!outputFolder) { showToast('Elige una carpeta de salida primero', 'error'); return; }

  const mode = document.getElementById('split-mode').value;
  const splitBtn = document.getElementById('split-btn');
  splitBtn.disabled = true;
  showSection('progress-section');
  hideSection('result-section');
  setProgress(5, 'Leyendo PDF...');

  try {
    const { PDFDocument } = PDFLib;
    const buffer = await readFileAsArrayBuffer(selectedFile);
    const sourcePdf = await PDFDocument.load(buffer);
    const baseName = selectedFile.name.replace(/\.pdf$/i, '');
    let groups = [];

    if (mode === 'every') {
      groups = Array.from({ length: totalPageCount }, (_, i) => ({
        label: String(i + 1),
        pages: [i],
      }));
    } else if (mode === 'parts') {
      const n = parseInt(document.getElementById('parts-input').value);
      if (isNaN(n) || n < 2 || n > totalPageCount) {
        throw new Error(`Número de partes inválido. Debe estar entre 2 y ${totalPageCount}`);
      }
      const pagesPerPart = Math.ceil(totalPageCount / n);
      for (let i = 0; i < n; i++) {
        const start = i * pagesPerPart;
        const end = Math.min(start + pagesPerPart, totalPageCount);
        if (start >= totalPageCount) break;
        const pages = Array.from({ length: end - start }, (_, j) => start + j);
        groups.push({ label: `parte_${i + 1}`, pages });
      }
    } else {
      const rangesStr = document.getElementById('ranges-input').value.trim();
      if (!rangesStr) throw new Error('Ingresa al menos un rango de páginas (ej: 1-3)');
      groups = parseRanges(rangesStr, totalPageCount);
      
      // Si el usuario quiere combinar todos los rangos en un solo archivo
      const combine = document.getElementById('combine-ranges-check').checked;
      if (combine && groups.length > 0) {
        let allPages = [];
        groups.forEach(g => allPages.push(...g.pages));
        // Eliminar duplicados y ordenar
        allPages = [...new Set(allPages)].sort((a, b) => a - b);
        groups = [{ label: 'extraido', pages: allPages }];
      }
    }

    let saved = 0;

    for (let gi = 0; gi < groups.length; gi++) {
      const g = groups[gi];
      setProgress(10 + (gi / groups.length) * 80, `Generando parte ${gi + 1} de ${groups.length}...`);

      const newPdf = await PDFDocument.create();
      const copied = await newPdf.copyPages(sourcePdf, g.pages);
      copied.forEach(p => newPdf.addPage(p));
      const bytes = await newPdf.save();

      const outPath = `${outputFolder}\\${baseName}_pag_${g.label}.pdf`;
      await window.electronAPI.writeFile(outPath, bytes);
      saved++;
    }

    setProgress(100, '¡Listo!');

    await window.electronAPI.addHistory({
      type: 'split',
      description: `"${selectedFile.name}" dividido en ${saved} parte${saved !== 1 ? 's' : ''}`,
      outputPath: outputFolder,
    });

    document.getElementById('result-title').textContent = `PDF dividido en ${saved} archivo${saved !== 1 ? 's' : ''}`;
    document.getElementById('result-detail').textContent = `Guardados en: ${outputFolder}`;
    showSection('result-section');
    document.getElementById('open-folder-btn').onclick = () => window.electronAPI.showItemInFolder(outputFolder);

    showToast(`${saved} archivos generados correctamente`, 'success');
  } catch (err) {
    console.error(err);
    showToast('Error: ' + err.message, 'error');
  } finally {
    hideSection('progress-section');
    splitBtn.disabled = false;
  }
});

document.getElementById('new-split-btn')?.addEventListener('click', () => {
  selectedFile = null;
  totalPageCount = 0;
  outputFolder = '';
  hideSection('result-section');
  hideSection('split-options');
  showSection('drop-zone');
  document.getElementById('split-btn').disabled = true;
  document.getElementById('output-folder').value = '';
  document.getElementById('ranges-input').value = '';
});
