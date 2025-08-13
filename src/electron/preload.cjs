const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Diálogos de archivo  
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),

    // Información del sistema  
    platform: process.platform,
    versions: {
        node: process.versions.node,
        chrome: process.versions.chrome,
        electron: process.versions.electron
    },

    // Utilidades para archivos que tu aplicación procesa  
    fileOperations: {
        readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
        writeFile: (filePath, data) => ipcRenderer.invoke('write-file', filePath, data),
        selectFiles: (filters) => ipcRenderer.invoke('select-files', filters)
    },

    // Notificaciones del sistema  
    showNotification: (title, body) => ipcRenderer.invoke('show-notification', { title, body })
});

// Limpiar APIs globales  
delete window.require;
delete window.exports;
delete window.module;