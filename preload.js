const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // File dialogs
  openFileDialog: (options) => ipcRenderer.invoke('open-file-dialog', options),
  saveFileDialog: (options) => ipcRenderer.invoke('save-file-dialog', options),
  showItemInFolder: (filePath) => ipcRenderer.invoke('show-item-in-folder', filePath),

  // File system
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, buffer) => ipcRenderer.invoke('write-file', filePath, buffer),
  readTextFile: (filePath) => ipcRenderer.invoke('read-text-file', filePath),
  compressGS: (inputPath, outputPath, quality) => ipcRenderer.invoke('compress-gs', inputPath, outputPath, quality),
  getFileSize: (filePath) => ipcRenderer.invoke('file-size', filePath),
  pdfToWord: (inputPath, outputPath) => ipcRenderer.invoke('pdf-to-word', inputPath, outputPath),

  // History
  getHistory: () => ipcRenderer.invoke('get-history'),
  addHistory: (entry) => ipcRenderer.invoke('add-history', entry),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
});
