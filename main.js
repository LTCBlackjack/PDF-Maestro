const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { compressPDF } = require('./handlers/compress-handler');

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 650,
    frame: false,
    transparent: false,
    backgroundColor: '#0f1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─── Window Controls ──────────────────────────────────────────────────────────
ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('window-close', () => mainWindow.close());

// ─── File Dialogs ─────────────────────────────────────────────────────────────
ipcMain.handle('open-file-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('save-file-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-item-in-folder', async (event, filePath) => {
  shell.showItemInFolder(filePath);
});

// ─── File System ──────────────────────────────────────────────────────────────
ipcMain.handle('read-file', async (event, filePath) => {
  const buffer = fs.readFileSync(filePath);
  return buffer;
});

ipcMain.handle('write-file', async (event, filePath, buffer) => {
  fs.writeFileSync(filePath, Buffer.from(buffer));
  return filePath;
});

ipcMain.handle('read-text-file', async (event, filePath) => {
  return fs.readFileSync(filePath, 'utf-8');
});

ipcMain.handle('compress-gs', async (event, inputPath, outputPath, quality) => {
  return await compressPDF(inputPath, outputPath, quality);
});

ipcMain.handle('pdf-to-word', async (event, inputPath, outputPath) => {
  const handler = require('./handlers/convert-handler');
  return await handler.pdfToWord(inputPath, outputPath);
});

ipcMain.handle('file-size', async (event, filePath) => {
  return fs.statSync(filePath).size;
});

// ─── History ──────────────────────────────────────────────────────────────────
const historyPath = path.join(app.getPath('userData'), 'history.json');

ipcMain.handle('get-history', async () => {
  if (!fs.existsSync(historyPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
  } catch {
    return [];
  }
});

ipcMain.handle('add-history', async (event, entry) => {
  let history = [];
  if (fs.existsSync(historyPath)) {
    try { history = JSON.parse(fs.readFileSync(historyPath, 'utf-8')); } catch {}
  }
  history.unshift({ ...entry, date: new Date().toISOString() });
  if (history.length > 50) history = history.slice(0, 50);
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
  return history;
});

ipcMain.handle('clear-history', async () => {
  fs.writeFileSync(historyPath, '[]');
  return [];
});
