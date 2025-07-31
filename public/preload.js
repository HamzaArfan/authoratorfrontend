const { contextBridge } = require('electron');
const crypto = require('crypto');

// Expose crypto.randomBytes to the renderer process
contextBridge.exposeInMainWorld('nodeCrypto', {
  randomBytes: (size) => crypto.randomBytes(size)
});