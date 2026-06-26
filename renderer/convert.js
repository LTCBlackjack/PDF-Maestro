// ─── Convert Logic ────────────────────────────────────────────────────────────
// Uses pdf-lib + PDF.js (CDN). No backend required.

let selectedFile = null;
let detectedExt = '';
let outputFolder = '';

const formatOptions = {
  pdf:  [
    { value: 'docx', label: 'Word (DOCX, Retiene Formato)' },
    { value: 'png',  label: 'PNG (imagen por página)' },
    { value: 'jpg',  label: 'JPG (imagen por página)' },
  ],
  png:  [{ value: 'pdf', label: 'PDF' }],
  jpg:  [{ value: 'pdf', label: 'PDF' }],
  jpeg: [{ value: 'pdf', label: 'PDF' }],
  txt:  [{ value: 'pdf', label: 'PDF' }],
  pptx: [{ value: 'pdf', label: 'PDF (básico)' }],
  ppt:  [{ value: 'pdf', label: 'PDF (básico)' }],
};

setupDropZone('drop-zone', 'file-input', files => {
  if (files.length === 0) return;
  loadFile(files[0]);
});

function loadFile(file) {
  selectedFile = file;
  detectedExt = getFileExt(file.name);

  if (!formatOptions[detectedExt]) {
    showToast(`Formato no soportado: .${detectedExt}`, 'error');
    selectedFile = null;
    return;
  }

  document.getElementById('selected-filename').textContent = file.name;
  document.getElementById('selected-info').textContent = formatSize(file.size);
  document.getElementById('file-type-icon').textContent = getFileIcon(detectedExt);

  // Populate output format options
  const sel = document.getElementById('output-format');
  sel.innerHTML = formatOptions[detectedExt].map(o =>
    `<option value="${o.value}">${o.label}</option>`
  ).join('');

  updateVisibleOptions();

  showSection('convert-options');
  hideSection('drop-zone');
  document.getElementById('convert-btn').disabled = false;
}

function updateVisibleOptions() {
  const fmt = document.getElementById('output-format').value;
  // Quality only for pdf → image
  if (detectedExt === 'pdf' && (fmt === 'png' || fmt === 'jpg')) {
    showSection('quality-section');
  } else {
    hideSection('quality-section');
  }
  // TXT options
  if (detectedExt === 'txt') {
    showSection('txt-options');
  } else {
    hideSection('txt-options');
  }
  // PPTX warning
  if (detectedExt === 'pptx' || detectedExt === 'ppt') {
    showSection('pptx-warning');
    document.getElementById('pptx-warning').style.display = 'flex';
  } else {
    hideSection('pptx-warning');
  }
}

document.getElementById('output-format')?.addEventListener('change', updateVisibleOptions);

document.getElementById('change-file-btn')?.addEventListener('click', () => {
  selectedFile = null;
  detectedExt = '';
  hideSection('convert-options');
  showSection('drop-zone');
  hideSection('result-section');
  document.getElementById('convert-btn').disabled = true;
});

document.getElementById('choose-folder-btn')?.addEventListener('click', async () => {
  outputFolder = await chooseFolder('output-folder') || outputFolder;
});

// ─── PDF → Image (using PDF.js + Canvas) ─────────────────────────────────────
async function pdfToImages(file, format) {
  const qualityMap = { high: 3.0, medium: 1.5, low: 0.72 };
  const qualityKey = document.getElementById('quality-input')?.value || 'medium';
  const scale = qualityMap[qualityKey];
  const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
  const ext = format;

  const baseName = file.name.replace(/\.pdf$/i, '');
  const buffer = await readFileAsArrayBuffer(file);
  const typedArray = new Uint8Array(buffer);

  const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
  const savedPaths = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    setProgress(10 + (i / pdf.numPages) * 80, `Renderizando página ${i} de ${pdf.numPages}...`);

    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;

    const dataUrl = canvas.toDataURL(mimeType, 0.92);
    const base64 = dataUrl.split(',')[1];
    const binStr = atob(base64);
    const bytes = new Uint8Array(binStr.length);
    for (let j = 0; j < binStr.length; j++) bytes[j] = binStr.charCodeAt(j);

    const outPath = `${outputFolder}\\${baseName}_pagina_${i}.${ext}`;
    await window.electronAPI.writeFile(outPath, bytes);
    savedPaths.push(outPath);
  }
  return savedPaths;
}

// ─── Image → PDF (using pdf-lib) ─────────────────────────────────────────────
async function imageToPdf(file) {
  const { PDFDocument } = PDFLib;
  const pdfDoc = await PDFDocument.create();
  const dataUrl = await readFileAsDataURL(file);
  const base64 = dataUrl.split(',')[1];
  const imgBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

  let img;
  if (file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
    img = await pdfDoc.embedJpg(imgBytes);
  } else {
    img = await pdfDoc.embedPng(imgBytes);
  }

  const page = pdfDoc.addPage([img.width, img.height]);
  page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  return pdfDoc.save();
}

// ─── TXT → PDF (using pdf-lib) ────────────────────────────────────────────────
async function txtToPdf(file) {
  const { PDFDocument, rgb, StandardFonts } = PDFLib;
  const text = await readFileAsText(file);
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = parseInt(document.getElementById('font-size-input')?.value || '12');

  const margin = 50;
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const usableWidth = pageWidth - margin * 2;
  const lineHeight = fontSize * 1.5;

  const lines = [];
  for (const rawLine of text.split('\n')) {
    const words = rawLine.split(' ');
    let cur = '';
    for (const word of words) {
      const test = cur ? cur + ' ' + word : word;
      const w = font.widthOfTextAtSize(test, fontSize);
      if (w > usableWidth && cur) {
        lines.push(cur);
        cur = word;
      } else {
        cur = test;
      }
    }
    lines.push(cur);
  }

  let y = pageHeight - margin;
  let page = pdfDoc.addPage([pageWidth, pageHeight]);

  for (const line of lines) {
    if (y - lineHeight < margin) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) });
    y -= lineHeight;
  }

  return pdfDoc.save();
}

// ─── PPTX → PDF (basic text extraction) ──────────────────────────────────────
async function pptxToPdf(file) {
  // Basic approach: create a PDF with a single notice page
  // (Full PPTX rendering requires native libs not available in browser renderer)
  const { PDFDocument, rgb, StandardFonts } = PDFLib;
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([595.28, 841.89]);

  page.drawText('Conversión PPTX → PDF', { x: 50, y: 760, size: 22, font, color: rgb(0.4, 0.4, 0.8) });
  page.drawText(`Archivo original: ${file.name}`, { x: 50, y: 720, size: 12, font: fontNormal, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(`Tamaño: ${formatSize(file.size)}`, { x: 50, y: 700, size: 12, font: fontNormal, color: rgb(0.3, 0.3, 0.3) });
  page.drawText('Nota: La conversión completa de PPTX requiere LibreOffice instalado.', { x: 50, y: 660, size: 11, font: fontNormal, color: rgb(0.6, 0.4, 0.1) });
  page.drawText('Para una conversión perfecta, abre el PPTX en LibreOffice y exporta como PDF.', { x: 50, y: 640, size: 11, font: fontNormal, color: rgb(0.6, 0.4, 0.1) });

  return pdfDoc.save();
}

// ─── Main Convert Action ──────────────────────────────────────────────────────
document.getElementById('convert-btn')?.addEventListener('click', async () => {
  if (!selectedFile) { showToast('Selecciona un archivo primero', 'error'); return; }
  if (!outputFolder) { showToast('Elige una carpeta de salida primero', 'error'); return; }

  const fmt = document.getElementById('output-format').value;
  const convertBtn = document.getElementById('convert-btn');
  convertBtn.disabled = true;
  showSection('progress-section');
  hideSection('result-section');
  setProgress(5, 'Iniciando conversión...');

  try {
    const baseName = selectedFile.name.replace(/\.[^.]+$/, '');
    let savedPaths = [];

    if (detectedExt === 'pdf' && (fmt === 'png' || fmt === 'jpg')) {
      savedPaths = await pdfToImages(selectedFile, fmt);
    } else if (detectedExt === 'pdf' && fmt === 'docx') {
      setProgress(40, 'Arrancando motor de Python y exportando Word...');
      const outPath = `${outputFolder}\\${baseName}.docx`;
      await window.electronAPI.pdfToWord(selectedFile.path, outPath);
      savedPaths = [outPath];
    } else if ((detectedExt === 'png' || detectedExt === 'jpg' || detectedExt === 'jpeg') && fmt === 'pdf') {
      setProgress(40, 'Convirtiendo imagen a PDF...');
      const bytes = await imageToPdf(selectedFile);
      setProgress(80, 'Guardando...');
      const outPath = `${outputFolder}\\${baseName}.pdf`;
      await window.electronAPI.writeFile(outPath, bytes);
      savedPaths = [outPath];
    } else if (detectedExt === 'txt' && fmt === 'pdf') {
      setProgress(40, 'Convirtiendo texto a PDF...');
      const bytes = await txtToPdf(selectedFile);
      setProgress(80, 'Guardando...');
      const outPath = `${outputFolder}\\${baseName}.pdf`;
      await window.electronAPI.writeFile(outPath, bytes);
      savedPaths = [outPath];
    } else if ((detectedExt === 'pptx' || detectedExt === 'ppt') && fmt === 'pdf') {
      setProgress(40, 'Procesando PPTX...');
      const bytes = await pptxToPdf(selectedFile);
      setProgress(80, 'Guardando...');
      const outPath = `${outputFolder}\\${baseName}.pdf`;
      await window.electronAPI.writeFile(outPath, bytes);
      savedPaths = [outPath];
    }

    setProgress(100, '¡Listo!');

    await window.electronAPI.addHistory({
      type: 'convert',
      description: `"${selectedFile.name}" → .${fmt} (${savedPaths.length} archivo${savedPaths.length !== 1 ? 's' : ''})`,
      outputPath: outputFolder,
    });

    document.getElementById('result-title').textContent = 'Conversión completada';
    document.getElementById('result-detail').textContent = `${savedPaths.length} archivo${savedPaths.length !== 1 ? 's' : ''} guardados en: ${outputFolder}`;
    showSection('result-section');
    document.getElementById('open-folder-btn').onclick = () => window.electronAPI.showItemInFolder(outputFolder);

    showToast('Conversión completada correctamente', 'success');
  } catch (err) {
    console.error(err);
    showToast('Error en la conversión: ' + err.message, 'error');
  } finally {
    hideSection('progress-section');
    convertBtn.disabled = false;
  }
});

document.getElementById('new-convert-btn')?.addEventListener('click', () => {
  selectedFile = null;
  detectedExt = '';
  outputFolder = '';
  hideSection('result-section');
  hideSection('convert-options');
  showSection('drop-zone');
  document.getElementById('convert-btn').disabled = true;
  document.getElementById('output-folder').value = '';
});
