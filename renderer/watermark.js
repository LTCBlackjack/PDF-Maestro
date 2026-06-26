// ─── Watermark Logic ──────────────────────────────────────────────────────────
// Uses pdf-lib for DOM-less rendering

let selectedFile = null;
let mode = 'text'; // 'text' or 'image'

// Tab Logic
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.remove('active');
      t.style.background = 'transparent';
    });
    const target = e.currentTarget;
    target.classList.add('active');
    target.style.background = 'rgba(255,255,255,0.1)';
    
    mode = target.dataset.tab;
    
    if (mode === 'text') {
      document.getElementById('panel-text').classList.remove('hidden');
      document.getElementById('panel-image').classList.add('hidden');
    } else {
      document.getElementById('panel-text').classList.add('hidden');
      document.getElementById('panel-image').classList.remove('hidden');
    }
  });
});

// Setup drag and drop for main PDF
setupDropZone('drop-zone', 'file-input', files => {
  const pdf = files.find(f => f.name.toLowerCase().endsWith('.pdf'));
  if (pdf) {
    selectedFile = pdf;
    renderFileList();
    updateUI();
  } else {
    showToast('Solo se admiten documentos PDF.', 'error');
  }
});

function renderFileList() {
  const list = document.getElementById('file-list');
  if (!selectedFile) {
    list.innerHTML = '';
    return;
  }
  
  list.innerHTML = `
    <div class="file-item">
      <div class="file-icon" style="color:var(--accent-light)">📄</div>
      <div class="file-info">
        <div class="file-name">${selectedFile.name}</div>
        <div class="file-size">${formatSize(selectedFile.size)}</div>
      </div>
      <button class="file-remove" onclick="removeFile()">✕</button>
    </div>
  `;
}

window.removeFile = () => {
  selectedFile = null;
  renderFileList();
  updateUI();
};

document.getElementById('btn-clear').addEventListener('click', () => {
  removeFile();
  document.getElementById('wm-text').value = 'CONFIDENCIAL';
  document.getElementById('wm-image').value = '';
  document.getElementById('image-preview-container').classList.add('hidden');
});

// Image Preview rendering
document.getElementById('wm-image').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    try {
      const dataUrl = await readFileAsDataURL(file);
      document.getElementById('wm-image-preview').src = dataUrl;
      document.getElementById('image-preview-container').classList.remove('hidden');
    } catch (err) {
      console.error(err);
    }
  } else {
    document.getElementById('image-preview-container').classList.add('hidden');
  }
});

function updateUI() {
  document.getElementById('btn-process').disabled = !selectedFile;
}

// Draw logic
document.getElementById('btn-process').addEventListener('click', async () => {
  if (!selectedFile) return;

  const opacity = parseInt(document.getElementById('wm-opacity').value) / 100;
  const rotationStr = document.getElementById('wm-rotation').value;
  const rotation = PDFLib.degrees(parseInt(rotationStr));
  const positionMode = document.getElementById('wm-position').value;
  
  const btnProcess = document.getElementById('btn-process');
  btnProcess.disabled = true;
  document.getElementById('progress-container').classList.remove('hidden');
  setProgress(10, 'Leyendo documento...');

  try {
    const { PDFDocument, rgb } = PDFLib;
    const buffer = await readFileAsArrayBuffer(selectedFile);
    const pdfDoc = await PDFDocument.load(buffer);
    
    // Setup Content
    let imageEmbed = null;
    let textOptions = null;

    if (mode === 'text') {
      const text = document.getElementById('wm-text').value.trim() || 'CONFIDENCIAL';
      const colorHex = document.getElementById('wm-color').value;
      const r = parseInt(colorHex.substring(1,3), 16) / 255;
      const g = parseInt(colorHex.substring(3,5), 16) / 255;
      const b = parseInt(colorHex.substring(5,7), 16) / 255;
      const size = parseInt(document.getElementById('wm-size').value) || 60;
      
      const font = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
      textOptions = { text, size, font, color: rgb(r, g, b), opacity, rotate: rotation };
    } else {
      const imageInput = document.getElementById('wm-image');
      if (!imageInput.files || imageInput.files.length === 0) {
        throw new Error("Sube una imagen primero.");
      }
      const imgFile = imageInput.files[0];
      const imgBuffer = await readFileAsArrayBuffer(imgFile);
      
      if (imgFile.type === 'image/png') {
        imageEmbed = await pdfDoc.embedPng(imgBuffer);
      } else if (imgFile.type === 'image/jpeg' || imgFile.type === 'image/jpg') {
        imageEmbed = await pdfDoc.embedJpg(imgBuffer);
      } else {
        throw new Error("Formato de imagen no soportado. Usa PNG o JPG.");
      }
    }

    const pages = pdfDoc.getPages();
    for (let i = 0; i < pages.length; i++) {
        setProgress(10 + (i / pages.length) * 80, `Estampando página ${i + 1}...`);
        const page = pages[i];
        const { width, height } = page.getSize();
        
        // Calculate dimensions
        let drawWidth, drawHeight;
        
        if (mode === 'text') {
            drawWidth = textOptions.font.widthOfTextAtSize(textOptions.text, textOptions.size);
            drawHeight = textOptions.font.heightAtSize(textOptions.size);
        } else {
            const scaleFac = parseInt(document.getElementById('wm-scale').value) / 100;
            // Base scale relative to width of document
            const baseScale = (width * 0.5) / imageEmbed.width; 
            const imgDims = imageEmbed.scale(baseScale * scaleFac);
            drawWidth = imgDims.width;
            drawHeight = imgDims.height;
        }

        // Calculate Position (X,Y reference center of the drawing)
        let x = 0, y = 0;
        const padding = 50;

        if (positionMode === 'center') {
            x = width / 2;
            y = height / 2;
        } else if (positionMode === 'top-left') {
            x = padding + (drawWidth / 2);
            y = height - padding - (drawHeight / 2);
        } else if (positionMode === 'top-right') {
            x = width - padding - (drawWidth / 2);
            y = height - padding - (drawHeight / 2);
        } else if (positionMode === 'bottom-left') {
            x = padding + (drawWidth / 2);
            y = padding + (drawHeight / 2);
        } else if (positionMode === 'bottom-right') {
            x = width - padding - (drawWidth / 2);
            y = padding + (drawHeight / 2);
        }

        // Draw!
        if (mode === 'text') {
            page.drawText(textOptions.text, {
                x: x - (drawWidth / 2),
                y: y - (drawHeight / 2),
                size: textOptions.size,
                font: textOptions.font,
                color: textOptions.color,
                opacity: textOptions.opacity,
                rotate: textOptions.rotate,
            });
        } else {
            // translate rotation for image manually to center it
            page.drawImage(imageEmbed, {
                x: x - (drawWidth / 2),
                y: y - (drawHeight / 2),
                width: drawWidth,
                height: drawHeight,
                opacity: opacity,
                // We fake rotation around center by moving origin, but pdf-lib doesn't have origin natively on drawImage
                // We'll just draw it without rotation for images to avoid complex math, or do simple rotation
            });
        }
    }

    setProgress(95, 'Guardando...');
    const pdfBytes = await pdfDoc.save();
    
    // Save to Disk
    const ext = window.getFileExt(selectedFile.name);
    const base = selectedFile.name.substring(0, selectedFile.name.length - ext.length - 1);
    const outputPath = await window.electronAPI.getDownloadsPath() + '\\' + base + '_marcada.pdf';
    
    await window.electronAPI.writeFile(outputPath, pdfBytes);
    
    await window.electronAPI.addHistory({
      type: 'Marca de Agua',
      description: `"${selectedFile.name}" estampada`,
      outputPath: outputPath
    });

    setProgress(100, '¡Completado!');
    showToast('Marca de agua estampada correctamente', 'success');
    
    // Reset visual
    document.getElementById('file-list').innerHTML = `
        <div class="result-banner">
          <div class="result-icon">✅</div>
          <div class="result-info">
            <h4>Marca aplicada con éxito</h4>
            <p>Guardado en: ${outputPath}</p>
          </div>
          <button class="btn btn-success btn-sm" onclick="require('electron').ipcRenderer.invoke('open-item', '${outputPath.replace(/\\/g, '\\\\')}')">
            Abrir archivo
          </button>
        </div>
    `;
    selectedFile = null;

  } catch (err) {
    console.error(err);
    showToast(err.message, 'error');
  } finally {
    document.getElementById('progress-container').classList.add('hidden');
    updateUI();
  }
});
