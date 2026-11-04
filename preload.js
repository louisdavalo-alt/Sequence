const { contextBridge, ipcRenderer } = require('electron');

// Minimal, explicit surface exposed to the renderer — no direct Node/fs access,
// consistent with contextIsolation + sandbox being enabled in main.js.
contextBridge.exposeInMainWorld('sequenceAPI', {
  load: () => ipcRenderer.invoke('sequence:load'),
  save: (data) => ipcRenderer.invoke('sequence:save', data)
});
