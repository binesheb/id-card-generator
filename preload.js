const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('idCardDesktop', {
  chooseOutputDirectory: () => ipcRenderer.invoke('choose-output-directory'),
  saveJpgs: (payload) => ipcRenderer.invoke('save-jpgs', payload)
});
