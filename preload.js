const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('folderTreeAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  validateDropPath: (folderPath) => ipcRenderer.invoke('validate-drop-path', folderPath),
  readFolder: (folderPath, options) => ipcRenderer.invoke('read-folder', folderPath, options),
  saveFile: (content, format) => ipcRenderer.invoke('save-file', content, format),
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
  onScanProgress: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on('scan-progress', listener);
    return () => ipcRenderer.removeListener('scan-progress', listener);
  }
});
