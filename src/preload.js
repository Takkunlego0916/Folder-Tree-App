const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('folderTreeAPI', {
  selectFolder:     ()                      => ipcRenderer.invoke('select-folder'),
  validateDropPath: (folderPath)            => ipcRenderer.invoke('validate-drop-path', folderPath),
  readFolder:       (folderPath, options)   => ipcRenderer.invoke('read-folder', folderPath, options),
  saveFile:         (content, format)       => ipcRenderer.invoke('save-file', content, format),
  getTheme:         ()                      => ipcRenderer.invoke('get-theme'),
  copyToClipboard:  (text)                  => ipcRenderer.send('copy-to-clipboard', text)
});
