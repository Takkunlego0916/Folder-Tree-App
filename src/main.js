const { app, BrowserWindow, dialog, ipcMain, clipboard, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 750,
    height: 650,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true
  });
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return (!result.canceled && result.filePaths.length > 0) ? result.filePaths[0] : null;
});

ipcMain.handle('read-folder', async (event, folderPath) => generateTree(folderPath));
ipcMain.handle('drop-folder', async (event, folderPath) => generateTree(folderPath));

ipcMain.on('copy-to-clipboard', (event, text) => clipboard.writeText(text));

ipcMain.handle('save-file', async (event, content) => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'フォルダ構成を保存',
    defaultPath: 'folder-tree.txt',
    filters: [{ name: 'Text', extensions: ['txt'] }]
  });
  if (filePath) fs.writeFileSync(filePath, content);
  return !!filePath;
});

ipcMain.handle('get-theme', () => nativeTheme.shouldUseDarkColors ? 'dark' : 'light');

function generateTree(folderPath) {
  if (!folderPath || !fs.existsSync(folderPath)) throw new Error('指定されたパスが存在しません');
  if (!fs.statSync(folderPath).isDirectory()) throw new Error('フォルダをドロップしてください');

  function buildTreeHTML(dir, level = 0) {
    if (level > 2) return '';
    const entries = fs.readdirSync(dir).sort();
    let html = '<ul>';
    entries.forEach(entry => {
      const fullPath = path.join(dir, entry);
      if (fs.statSync(fullPath).isDirectory()) {
        html += `<li><details ${level < 2 ? 'open' : ''}><summary>${entry}</summary>${buildTreeHTML(fullPath, level+1)}</details></li>`;
      } else {
        html += `<li>${entry}</li>`;
      }
    });
    html += '</ul>';
    return html;
  }

  function buildTreeText(dir, prefix = '') {
    const entries = fs.readdirSync(dir).sort();
    let lines = [];
    entries.forEach((entry, index) => {
      const fullPath = path.join(dir, entry);
      const connector = (index === entries.length - 1) ? '└── ' : '├── ';
      lines.push(`${prefix}${connector}${entry}`);
      if (fs.statSync(fullPath).isDirectory()) {
        const extension = (index === entries.length - 1) ? '    ' : '│   ';
        lines.push(...buildTreeText(fullPath, prefix + extension));
      }
    });
    return lines;
  }

  return {
    htmlTree: `<details open><summary>${folderPath}</summary>${buildTreeHTML(folderPath)}</details>`,
    textTree: `${folderPath}/\n${buildTreeText(folderPath).join('\n')}`
  };
}
