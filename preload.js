const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI', {
    openAuthWindow: () => ipcRenderer.send('open-auth-window'),
    handleAuthSuccess: (callback) => ipcRenderer.on('auth-success', callback),
    handleAuthFailure: (callback) => ipcRenderer.on('auth-failure', callback)
  }
);