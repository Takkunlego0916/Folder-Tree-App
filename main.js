const { app, BrowserWindow, dialog, ipcMain, clipboard, Menu } = require('electron');
const path = require('path');

const MAX_DEPTH_LIMIT = 8;
const MAX_CHILDREN_PER_DIR = 2000;
const MAX_CONTENT_BYTES = 10 * 1024 * 1024;
const MAX_CUSTOM_EXCLUDES = 50;
const WORKER_PATH = path.join(__dirname, 'scanner-worker.js');
let fs = null;
let Worker = null;

const trustedPaths = new Set();
let mainWindow = null;
const startupDebug = process.argv.includes('--startup-debug');
const startupAt = Date.now();

function startupLog(message) {
  if (!startupDebug) return;
  try {
    const os = require('os');
    const fsSync = require('fs');
    const line = `[+${Date.now() - startupAt}ms] ${message}\n`;
    fsSync.appendFileSync(path.join(os.tmpdir(), 'FolderTreeApp-startup.log'), line, 'utf8');
  } catch {}
}

startupLog('main.js loaded');

function lazyNodeModules() {
  if (!fs) fs = require('fs/promises');
  if (!Worker) ({ Worker } = require('worker_threads'));
}

function createWindow() {
  startupLog('createWindow:start');
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 860,
    minHeight: 620,
    show: true,
    backgroundColor: '#0b0d11',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  startupLog('loadFile:called');
  mainWindow.webContents.once('did-finish-load', () => startupLog('renderer:did-finish-load'));
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event) => event.preventDefault());
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.once('ready-to-show', () => startupLog('window:ready-to-show'));
}

Menu.setApplicationMenu(null);
app.whenReady().then(() => {
  startupLog('app.whenReady');
  createWindow();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function ensureTrustedSender(event) {
  const url = event?.senderFrame?.url ?? '';
  if (!url.startsWith('file://')) throw new Error('不正な送信元です');
}

async function normalizeFolderPath(folderPath) {
  if (typeof folderPath !== 'string' || folderPath.trim() === '') {
    throw new Error('指定されたパスが不正です');
  }
  if (folderPath.includes('\0')) throw new Error('パスに不正な文字が含まれています');
  if (folderPath.length > 32767) throw new Error('パスが長すぎます');

  lazyNodeModules();
  const resolved = path.resolve(folderPath);
  const stat = await fs.stat(resolved);
  if (!stat.isDirectory()) throw new Error('フォルダを指定してください');
  return resolved;
}

function isPathTrusted(resolvedPath) {
  for (const trusted of trustedPaths) {
    if (resolvedPath === trusted || resolvedPath.startsWith(trusted + path.sep)) return true;
  }
  return false;
}

function sanitizeOptions(options) {
  const maxDepth = Number.isInteger(options?.maxDepth) && options.maxDepth >= 1 && options.maxDepth <= MAX_DEPTH_LIMIT
    ? options.maxDepth
    : 4;
  const excludes = Array.isArray(options?.excludes)
    ? [...new Set(options.excludes
        .filter((entry) => typeof entry === 'string' && entry.length > 0 && entry.length <= 255 && /^[^/\\:*?"<>|]+$/.test(entry))
        .slice(0, MAX_CUSTOM_EXCLUDES))]
    : [];
  return { maxDepth, excludes };
}

function runScanner(folderPath, options, event) {
  return new Promise((resolve, reject) => {
    lazyNodeModules();
    const worker = new Worker(WORKER_PATH, {
      workerData: { folderPath, options }
    });

    const cleanup = () => worker.removeAllListeners();

    worker.on('message', (message) => {
      if (!message || typeof message !== 'object') return;
      if (message.type === 'progress' && event.senderFrame && !event.senderFrame.isDestroyed()) {
        event.senderFrame.send('scan-progress', message.value);
        return;
      }
      if (message.type === 'result') {
        cleanup();
        resolve(message.payload);
        void worker.terminate();
        return;
      }
      if (message.type === 'error') {
        cleanup();
        reject(new Error(message.message || 'フォルダの読み込みに失敗しました'));
        void worker.terminate();
      }
    });

    worker.on('error', (error) => {
      cleanup();
      reject(error);
    });

    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`スキャナーが終了しました (${code})`));
    });
  });
}

ipcMain.handle('select-folder', async (event) => {
  ensureTrustedSender(event);
  const result = await dialog.showOpenDialog({
    title: 'フォルダを選択',
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const resolved = path.resolve(result.filePaths[0]);
  trustedPaths.add(resolved);
  return resolved;
});

ipcMain.handle('validate-drop-path', async (event, folderPath) => {
  ensureTrustedSender(event);
  try {
    const resolved = await normalizeFolderPath(folderPath);
    trustedPaths.add(resolved);
    return resolved;
  } catch {
    return null;
  }
});

ipcMain.handle('read-folder', async (event, folderPath, options = {}) => {
  ensureTrustedSender(event);
  const resolved = await normalizeFolderPath(folderPath);
  if (!isPathTrusted(resolved)) throw new Error('このフォルダへのアクセスは許可されていません');
  return runScanner(resolved, sanitizeOptions(options), event);
});

ipcMain.handle('save-file', async (event, content, format = 'txt') => {
  ensureTrustedSender(event);
  lazyNodeModules();
  if (typeof content !== 'string') throw new Error('保存内容が不正です');
  if (Buffer.byteLength(content, 'utf8') > MAX_CONTENT_BYTES) throw new Error('コンテンツが大きすぎます');

  const validFormats = ['txt', 'json', 'html'];
  const safeFormat = validFormats.includes(format) ? format : 'txt';
  const filterMap = {
    txt: [{ name: 'Text', extensions: ['txt'] }],
    json: [{ name: 'JSON', extensions: ['json'] }],
    html: [{ name: 'HTML', extensions: ['html'] }]
  };

  const result = await dialog.showSaveDialog({
    title: 'フォルダ構成を保存',
    defaultPath: `folder-tree.${safeFormat}`,
    filters: filterMap[safeFormat]
  });

  if (result.canceled || !result.filePath) return false;
  await fs.writeFile(result.filePath, content, 'utf8');
  return true;
});

ipcMain.handle('copy-to-clipboard', async (event, text) => {
  ensureTrustedSender(event);
  if (typeof text !== 'string') return false;
  if (Buffer.byteLength(text, 'utf8') > MAX_CONTENT_BYTES) return false;
  clipboard.writeText(text);
  return true;
});
