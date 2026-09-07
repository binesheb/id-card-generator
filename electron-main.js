const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');
const path = require('path');

let mainWindow;

function sendUpdateStatus(status, data = {}) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update-status', { status, ...data });
}

function configureAutoUpdater() {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;
  autoUpdater.on('checking-for-update', () => sendUpdateStatus('checking'));
  autoUpdater.on('update-available', info => sendUpdateStatus('available', { version: info.version }));
  autoUpdater.on('update-not-available', info => sendUpdateStatus('up-to-date', { version: info.version }));
  autoUpdater.on('download-progress', progress => sendUpdateStatus('downloading', { percent: progress.percent, transferred: progress.transferred, total: progress.total }));
  autoUpdater.on('update-downloaded', info => sendUpdateStatus('downloaded', { version: info.version }));
  autoUpdater.on('error', error => sendUpdateStatus('error', { message: error?.message || 'Update check failed.' }));
}

async function checkForUpdates() {
  if (!app.isPackaged) {
    sendUpdateStatus('dev', { message: 'Update checks are available in the installed Windows application.' });
    return { status: 'dev' };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    return result?.updateInfo || null;
  } catch (error) {
    sendUpdateStatus('error', { message: error?.message || 'Unable to check for updates.' });
    return null;
  }
}

ipcMain.handle('check-for-updates', () => checkForUpdates());
ipcMain.handle('download-update', async () => {
  if (!app.isPackaged) throw new Error('Updates are available only in the installed Windows application.');
  await autoUpdater.downloadUpdate();
  return true;
});
ipcMain.handle('install-update', () => {
  if (!app.isPackaged) return false;
  autoUpdater.quitAndInstall(false, true);
  return true;
});
ipcMain.handle('window-control', (_event, action) => {
  if (!mainWindow || mainWindow.isDestroyed()) return false;
  if (action === 'minimize') mainWindow.minimize();
  else if (action === 'maximize') mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  else if (action === 'close') mainWindow.close();
  return true;
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1536,
    height: 1024,
    minWidth: 1050,
    minHeight: 720,
    title: 'Jayalakshmi ID Card Generator',
    backgroundColor: '#eef2f8',
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  mainWindow.on('closed', () => { mainWindow = null; });
}

ipcMain.handle('choose-output-directory', async () => {
  const result = await dialog.showOpenDialog({ title: 'Choose ID Card Output Folder', properties: ['openDirectory', 'createDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('save-jpgs', async (_event, payload) => {
  if (!payload?.directory || !Array.isArray(payload.files)) throw new Error('Invalid output request.');
  fs.mkdirSync(payload.directory, { recursive: true });
  for (const file of payload.files) {
    if (!file?.name || typeof file.dataUrl !== 'string') continue;
    const match = file.dataUrl.match(/^data:image\/jpeg;base64,(.+)$/);
    if (!match) throw new Error('Invalid JPEG data.');
    fs.writeFileSync(path.join(payload.directory, path.basename(file.name)), Buffer.from(match[1], 'base64'));
  }
  return payload.directory;
});

app.whenReady().then(() => {
  configureAutoUpdater();
  Menu.setApplicationMenu(null);
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  setTimeout(() => checkForUpdates(), 5000);
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
