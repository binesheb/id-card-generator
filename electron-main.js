const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const fs = require('fs');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1050,
    minHeight: 720,
    title: 'Jayalakshmi ID Card Generator',
    backgroundColor: '#f3f5f7',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

ipcMain.handle('choose-output-directory', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Choose ID Card Output Folder',
    properties: ['openDirectory', 'createDirectory']
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('save-jpgs', async (_event, payload) => {
  if (!payload?.directory || !Array.isArray(payload.files)) {
    throw new Error('Invalid output request.');
  }

  fs.mkdirSync(payload.directory, { recursive: true });

  for (const file of payload.files) {
    if (!file?.name || typeof file.dataUrl !== 'string') continue;
    const match = file.dataUrl.match(/^data:image\/jpeg;base64,(.+)$/);
    if (!match) throw new Error('Invalid JPEG data.');
    fs.writeFileSync(
      path.join(payload.directory, path.basename(file.name)),
      Buffer.from(match[1], 'base64')
    );
  }

  return payload.directory;
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
