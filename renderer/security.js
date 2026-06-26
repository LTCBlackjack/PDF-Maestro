const { ipcRenderer } = require('electron');

let currentFiles = [];
let mode = 'protect'; // 'protect' o 'unprotect'

// Tab logic
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.remove('active');
      t.style.background = 'transparent';
    });
    const target = e.target;
    target.classList.add('active');
    target.style.background = 'rgba(255,255,255,0.1)';
    
    mode = target.dataset.tab;
    
    if (mode === 'protect') {
      document.getElementById('panel-protect').classList.remove('hidden');
      document.getElementById('panel-unprotect').classList.add('hidden');
      document.querySelector('.btn-text').textContent = 'Bloquear PDF';
      document.getElementById('btn-process').classList.replace('btn-success', 'btn-primary');
    } else {
      document.getElementById('panel-protect').classList.add('hidden');
      document.getElementById('panel-unprotect').classList.remove('hidden');
      document.querySelector('.btn-text').textContent = 'Desbloquear PDF';
      document.getElementById('btn-process').classList.replace('btn-primary', 'btn-success');
    }
    
    updateUI();
  });
});

// Init tabs styling
document.querySelector('.tab.active').style.background = 'rgba(255,255,255,0.1)';

const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const btnProcess = document.getElementById('btn-process');
const btnClear = document.getElementById('btn-clear');
const progressContainer = document.getElementById('progress-container');

// Manejo basico de arrastrar (heredado de UI general pero localmente)
const uploadZone = document.getElementById('upload-zone');
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
});
uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('drag-over');
});
uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    // Only 1 file supported for simplicity right now
    const validFiles = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.pdf'));
    if (validFiles.length > 0) {
        currentFiles = [validFiles[0]]; // Tomar solo el primero
        renderFileList();
        updateUI();
    }
}

function renderFileList() {
    fileList.innerHTML = '';
    currentFiles.forEach((file) => {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `
            <div class="file-icon" style="color:var(--accent-light)">📄</div>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${(file.size / 1024 / 1024).toFixed(2)} MB</div>
            </div>
            <button class="file-remove" onclick="removeFile()">✕</button>
        `;
        fileList.appendChild(item);
    });
}

window.removeFile = () => {
    currentFiles = [];
    renderFileList();
    updateUI();
};

btnClear.addEventListener('click', () => {
    removeFile();
    document.getElementById('input-password').value = '';
    document.getElementById('input-unlock-password').value = '';
});

function updateUI() {
    const hasFiles = currentFiles.length > 0;
    btnProcess.disabled = !hasFiles;
}

btnProcess.addEventListener('click', async () => {
    if (currentFiles.length === 0) return;
    
    const file = currentFiles[0];
    const password = document.getElementById('input-password').value;
    const unlockPassword = document.getElementById('input-unlock-password').value;
    
    if (mode === 'protect' && !password) {
        showToast('Por favor escribe una contraseña de apertura', 'error');
        return;
    }
    if (mode === 'unprotect' && !unlockPassword) {
        showToast('Por favor escribe la contraseña original', 'error');
        return;
    }

    const options = {
      print: document.getElementById('check-print').checked,
      copy: document.getElementById('check-copy').checked
    };

    btnProcess.disabled = true;
    progressContainer.classList.remove('hidden');
    
    try {
        let result;
        if (mode === 'protect') {
            result = await ipcRenderer.invoke('protect-pdf', file.path, password, options);
        } else {
            result = await ipcRenderer.invoke('unprotect-pdf', file.path, unlockPassword);
        }

        if (result.success) {
            showToast('¡Operación de seguridad exitosa!', 'success');
            
            // Guardar en historial
            const actionType = mode === 'protect' ? '🔒 Protegido' : '🔓 Desprotegido';
            await ipcRenderer.invoke('add-history', {
                type: 'Seguridad',
                date: new Date().toISOString(),
                files: [file.name],
                details: actionType,
                outputPath: result.outputPath
            });
            
            // Reemplazar la lista visual por un item clickeable para abrir carpeta
            fileList.innerHTML = `
                <div class="result-banner">
                  <div class="result-icon">✅</div>
                  <div class="result-info">
                    <h4>Documento procesado con éxito</h4>
                    <p>Guardado en: ${result.outputPath.substring(0, 50)}...</p>
                  </div>
                  <button class="btn btn-secondary btn-sm" onclick="require('electron').ipcRenderer.invoke('open-item', '${result.outputPath.replace(/\\/g, '\\\\')}')">
                    Abrir archivo
                  </button>
                </div>
            `;
            currentFiles = []; // Limpiar virtual
        } else {
            showToast(result.error || 'Fallo la operación', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Ocurrió un error general', 'error');
    } finally {
        btnProcess.disabled = false;
        progressContainer.classList.add('hidden');
    }
});
