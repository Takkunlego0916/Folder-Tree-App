const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('folderTreeAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  readFolder: (folderPath) => ipcRenderer.invoke('read-folder', folderPath),
  saveFile: (content) => ipcRenderer.invoke('save-file', content),
  getTheme: () => ipcRenderer.invoke('get-theme'),
  copyToClipboard: (text) => ipcRenderer.send('copy-to-clipboard', text)
});
