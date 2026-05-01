const { app, BrowserWindow, dialog, ipcMain, clipboard, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs/promises');

const MAX_DEPTH = 4;
const MAX_CHILDREN_PER_DIR = 1000;
const MAX_CONTENT_BYTES = 10 * 1024 * 1024;

const trustedPaths = new Set();

function createWindow() {
  const win = new BrowserWindow({
    width: 750,
    height: 650,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  win.loadFile('index.html');
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event) => event.preventDefault());
}

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function ensureTrustedSender(event) {
  const url = event?.senderFrame?.url || '';
  if (!url.startsWith('file://')) {
    throw new Error('不正な送信元です');
  }
}

async function normalizeFolderPath(folderPath) {
  if (typeof folderPath !== 'string' || folderPath.trim() === '') {
    throw new Error('指定されたパスが不正です');
  }

  if (folderPath.includes('\0')) {
    throw new Error('パスに不正な文字が含まれています');
  }

  if (folderPath.length > 32767) {
    throw new Error('パスが長すぎます');
  }

  const resolved = path.resolve(folderPath);
  const stat = await fs.stat(resolved);

  if (!stat.isDirectory()) {
    throw new Error('フォルダを指定してください');
  }

  return resolved;
}

function isPathTrusted(resolvedPath) {
  for (const trusted of trustedPaths) {
    if (resolvedPath === trusted || resolvedPath.startsWith(trusted + path.sep)) {
      return true;
    }
  }
  return false;
}

async function buildTreeNode(dirPath, depth = 0) {
  const node = {
    name: dirPath,
    type: 'directory',
    children: []
  };

  if (depth >= MAX_DEPTH) {
    node.children.push({ name: '…', type: 'truncated' });
    return node;
  }

  let dirents;
  try {
    dirents = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    node.children.push({ name: '読み込み失敗', type: 'truncated' });
    return node;
  }

  dirents.sort((a, b) => a.name.localeCompare(b.name, 'ja'));

  const limited = dirents.slice(0, MAX_CHILDREN_PER_DIR);
  for (const entry of limited) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isSymbolicLink()) continue;

    if (entry.isDirectory()) {
      const child = await buildTreeNode(fullPath, depth + 1);
      child.name = entry.name;
      node.children.push(child);
    } else {
      node.children.push({ name: entry.name, type: 'file' });
    }
  }

  if (dirents.length > MAX_CHILDREN_PER_DIR) {
    node.children.push({
      name: `… (${dirents.length - MAX_CHILDREN_PER_DIR} 件省略)`,
      type: 'truncated'
    });
  }

  return node;
}

function treeToText(node) {
  const lines = [`${node.name}/`];

  const walk = (children, prefix = '') => {
    children.forEach((child, index) => {
      const last = index === children.length - 1;
      const connector = last ? '└── ' : '├── ';

      if (child.type === 'truncated') {
        lines.push(`${prefix}${connector}${child.name}`);
        return;
      }

      lines.push(`${prefix}${connector}${child.name}${child.type === 'directory' ? '/' : ''}`);

      if (child.type === 'directory' && Array.isArray(child.children) && child.children.length > 0) {
        walk(child.children, prefix + (last ? '    ' : '│   '));
      }
    });
  };

  walk(node.children || []);
  return lines.join('\n');
}

ipcMain.handle('select-folder', async (event) => {
  ensureTrustedSender(event);

  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (result.canceled || result.filePaths.length === 0) return null;

  const folderPath = result.filePaths[0];
  trustedPaths.add(path.resolve(folderPath));
  return folderPath;
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

ipcMain.handle('read-folder', async (event, folderPath) => {
  ensureTrustedSender(event);

  const resolved = await normalizeFolderPath(folderPath);

  if (!isPathTrusted(resolved)) {
    throw new Error('このフォルダへのアクセスは許可されていません');
  }

  const treeData = await buildTreeNode(resolved);
  const textTree = treeToText(treeData);

  return { treeData, textTree };
});

ipcMain.handle('save-file', async (event, content) => {
  ensureTrustedSender(event);

  if (typeof content !== 'string') {
    throw new Error('保存内容が不正です');
  }

  if (Buffer.byteLength(content, 'utf8') > MAX_CONTENT_BYTES) {
    throw new Error('保存するコンテンツが大きすぎます');
  }

  const { filePath } = await dialog.showSaveDialog({
    title: 'フォルダ構成を保存',
    defaultPath: 'folder-tree.txt',
    filters: [{ name: 'Text', extensions: ['txt'] }]
  });

  if (!filePath) return false;

  await fs.writeFile(filePath, content, 'utf8');
  return true;
});

ipcMain.on('copy-to-clipboard', (event, text) => {
  ensureTrustedSender(event);

  if (typeof text !== 'string') return;

  if (Buffer.byteLength(text, 'utf8') > MAX_CONTENT_BYTES) return;

  clipboard.writeText(text);
});

ipcMain.handle('get-theme', () => {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
});
