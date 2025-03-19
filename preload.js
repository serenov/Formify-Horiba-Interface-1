const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  saveFtpConfig: (config) => ipcRenderer.invoke("save-ftp-config", config),
  saveBackendConfig: (config) =>
    ipcRenderer.invoke("save-backend-config", config),
  getFtpConfig: () => ipcRenderer.invoke("get-ftp-config"),
  getBackendConfig: () => ipcRenderer.invoke("get-backend-config"),
  startFileWatching: () => ipcRenderer.invoke("start-file-watching"),
  stopFileWatching: () => ipcRenderer.invoke("stop-file-watching"),
  submitAstmData: (data) => ipcRenderer.invoke("submit-astm-data", data),
  discardAstmFile: (filePath) =>
    ipcRenderer.invoke("discard-astm-file", filePath),
  onNewAstmFile: (callback) => {
    ipcRenderer.on("new-astm-file", (event, data) => callback(data));
  },
  onAstmParseError: (callback) => {
    ipcRenderer.on("astm-parse-error", (event, data) => callback(data));
  },
});