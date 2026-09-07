const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const requiredFiles = [
  'index.html',
  'styles.css',
  'app.js',
  'electron-main.js',
  'preload.js',
  'updater-renderer.js',
  'package.json',
  'README.md',
  'TEMPLATE.md'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing required file: ${file}`);
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (!packageJson.main || packageJson.main !== 'electron-main.js') throw new Error('package.json main entry is incorrect.');
if (!packageJson.dependencies?.['electron-updater']) throw new Error('electron-updater dependency is missing.');
if (packageJson.build?.appId !== 'in.jayalakshmi.idcardgenerator') throw new Error('Unexpected Electron appId.');
if (packageJson.build?.publish?.[0]?.provider !== 'github') throw new Error('GitHub updater provider is missing.');
if (packageJson.build?.publish?.[0]?.owner !== 'binesheb') throw new Error('GitHub updater owner is incorrect.');
if (packageJson.build?.publish?.[0]?.repo !== 'id-card-generator') throw new Error('GitHub updater repository is incorrect.');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const id of ['name', 'employeeCode', 'designation', 'photoInput', 'frontOverlayInput', 'backOverlayInput', 'address', 'contact', 'bloodGroup', 'frontCanvas', 'backCanvas', 'generate']) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Missing UI element: ${id}`);
}

const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
for (const token of ['toDataURL', 'saveJpeg', 'chooseOutputDirectory', 'frontOverlay', 'backOverlay', 'photoState', 'safeCode', 'roundedRectPath', 'drawInfoCard']) {
  if (!app.includes(token)) throw new Error(`Missing application capability: ${token}`);
}

const main = fs.readFileSync(path.join(root, 'electron-main.js'), 'utf8');
for (const token of ['autoUpdater', 'contextIsolation: true', 'nodeIntegration: false', 'sandbox: true', 'save-jpgs']) {
  if (!main.includes(token)) throw new Error(`Missing desktop capability/security setting: ${token}`);
}

console.log(`Smoke check passed: ${requiredFiles.length} required files and core application wiring verified.`);
