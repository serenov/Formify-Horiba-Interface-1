const { app, BrowserWindow, ipcMain, Menu, nativeImage } = require("electron");
const path = require("path");
const { startFtpServer, stopFtpServer } = require("./src/ftp-service");
const { startFileWatcher, stopFileWatcher } = require("./src/file-watcher");
const { parseAstmFile } = require("./src/astm-parser");
const { sendDataToBackend, fetchToken } = require("./src/api-service");
const fs = require("fs");

const Store = require('electron-store').default;

const store = new Store();

let mainWindow;
let ftpServer;
let watcher;

function createWindow() {
  const iconPath = path.join(__dirname, 'formify.png');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: iconPath, 
  });



  Menu.setApplicationMenu(null)

  mainWindow.loadFile("index.html");
  mainWindow.on("closed", () => {
    stopServices();
  });
}

app.on("ready", createWindow);


app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    stopServices();
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

function stopServices() {
  if (ftpServer) {
    stopFtpServer(ftpServer);
    ftpServer = null;
  }

  if (watcher) {
    stopFileWatcher(watcher);
    watcher = null;
  }
}

// IPC handlers
ipcMain.handle("save-ftp-config", async (event, config) => {
  store.set("ftpConfig", config);

  if (ftpServer) {
    stopFtpServer(ftpServer);
  }

  ftpServer = await startFtpServer(config);
  return { success: true };
});

ipcMain.handle("save-backend-config", async (event, config) => {
  store.set("backendConfig", config);

  const { token } = await fetchToken(config);

  store.set("authToken", token);

  return { success: true };
});

ipcMain.handle("get-ftp-config", () => {
  return (
    store.get("ftpConfig") || { path: "", port: 21, user: "", password: "" }
  );
});

ipcMain.handle("get-backend-config", () => {
  return store.get("backendConfig") || { url: "", username: "", password: "" };
});

ipcMain.handle("start-file-watching", async () => {
  const ftpConfig = store.get("ftpConfig");

  if (!ftpConfig || !ftpConfig.path) {
    return { success: false, error: "FTP path not configured" };
  }

  if (watcher) {
    stopFileWatcher(watcher);
  }

  watcher = startFileWatcher(ftpConfig.path, handleNewAstmFile);
  return { success: true };
});

ipcMain.handle("stop-file-watching", async () => {
  if (watcher) {
    stopFileWatcher(watcher);
    watcher = null;
  }
  return { success: true };
});

ipcMain.handle("submit-astm-data", async (event, { sampleId, filePath, parsedData }) => {
  try {
    const token = store.get("authToken");

    const config = store.get("backendConfig");

    if (!token) {

      return { success: false, error: "Backend not configured" };
    }

    const result = await sendDataToBackend(
      {
        horibaParams: parsedData,
        individualUuid: sampleId,
      },
      config,
      token
    );

    if (result.success) {
      fs.unlinkSync(filePath);

      return { success: true };
    } else {

      return result;
    }
  } catch (error) {

    return { success: false, error: error.message };
  }
});

ipcMain.handle("discard-astm-file", async (event, filePath) => {
  try {
    fs.unlinkSync(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

async function handleNewAstmFile(filePath) {
  try {
    const parsedData = await parseAstmFile(filePath);
    mainWindow.webContents.send("new-astm-file", { filePath, parsedData });
  } catch (error) {
    mainWindow.webContents.send("astm-parse-error", {
      filePath,
      error: error.message,
    });
  }
}
