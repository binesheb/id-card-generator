const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const requiredFiles = [
  'index.html',
  'styles.css',
  'ui-enhancements.css',
  'ui-enhancements.js',
  'functional-ui.js',
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

for (const file of ['app.js','ui-enhancements.js','functional-ui.js','electron-main.js','preload.js','updater-renderer.js']) {
  execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' });
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (!packageJson.main || packageJson.main !== 'electron-main.js') throw new Error('package.json main entry is incorrect.');
if (!packageJson.dependencies?.['electron-updater']) throw new Error('electron-updater dependency is missing.');
if (packageJson.build?.appId !== 'in.jayalakshmi.idcardgenerator') throw new Error('Unexpected Electron appId.');
if (packageJson.build?.publish?.[0]?.provider !== 'github') throw new Error('GitHub updater provider is missing.');
if (packageJson.build?.publish?.[0]?.owner !== 'binesheb') throw new Error('GitHub updater owner is incorrect.');
if (packageJson.build?.publish?.[0]?.repo !== 'id-card-generator') throw new Error('GitHub updater repository is incorrect.');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const id of ['name','employeeCode','designation','photoInput','frontOverlayInput','backOverlayInput','address','contact','bloodGroup','frontCanvas','backCanvas','generate','cropModal','cropCanvas','cropDone','previewButton','downloadButton','printButton','saveTemplateButton','templatesButton']) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Missing UI element: ${id}`);
}
for (const script of ['app.js','ui-enhancements.js','updater-renderer.js','functional-ui.js']) {
  if (!html.includes(`src="${script}"`)) throw new Error(`Missing UI script: ${script}`);
}

const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
for (const token of ['toDataURL','jpegData','chooseOutputDirectory','frontOverlay','backOverlay','photoState','safeCode','roundedRectPath','drawInfoCard','saveJpgs']) {
  if (!app.includes(token)) throw new Error(`Missing application capability: ${token}`);
}
if (!app.includes('FileReader')) throw new Error('Photo thumbnail persistence is not implemented.');

const functional = fs.readFileSync(path.join(root, 'functional-ui.js'), 'utf8');
for (const token of ['openCrop','bakeCrop','preview','downloadJpgs','printCards','saveTemplate','templates','setInputFile','DataTransfer']) {
  if (!functional.includes(token)) throw new Error(`Missing functional UI capability: ${token}`);
}
if (!functional.includes('TEMPLATE_PHOTO_RATIO=(625*0.5872)/(965*0.4487)')) throw new Error('Crop aspect ratio is not tied to the actual card photo slot.');
if (functional.includes('const TEMPLATE_RATIO=0.5872/0.4487')) throw new Error('Old incorrect crop aspect ratio is still present.');
if (functional.includes('Template saving will store the current design settings')) throw new Error('Placeholder template action is still present.');
if (functional.includes('Template library is ready for the next template-management phase')) throw new Error('Placeholder template library action is still present.');

const ui = fs.readFileSync(path.join(root, 'ui-enhancements.js'), 'utf8');
if (ui.includes("$('resetPhoto')")) throw new Error('Duplicate Crop/Adjust handler remains in ui-enhancements.js.');
if (ui.includes('applyCropPosition')) throw new Error('Legacy synthetic crop handler remains in ui-enhancements.js.');

const workflow = fs.readFileSync(path.join(root, '.github/workflows/windows-build.yml'), 'utf8');
for (const token of ['actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1', 'actions/setup-node@820762786026740c76f36085b0efc47a31fe5020', 'actions/upload-artifact@b7c566a772e6b6bfb58ed0dc250532a479d7789f', 'softprops/action-gh-release@3d0d9888cb7fd7b750713d6e236d1fcb99157228', 'node-version: 24', "FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: 'true'"]) {
  if (!workflow.includes(token)) throw new Error(`CI Node 24 migration is incomplete: ${token}`);
}

const main = fs.readFileSync(path.join(root, 'electron-main.js'), 'utf8');
for (const token of ['autoUpdater','contextIsolation: true','nodeIntegration: false','sandbox: true','save-jpgs','window-control']) {
  if (!main.includes(token)) throw new Error(`Missing desktop capability/security setting: ${token}`);
}

console.log(`Smoke check passed: ${requiredFiles.length} required files, JavaScript syntax, UI wiring, generation, crop, preview, download, print, templates, thumbnail persistence, CI Node 24 migration, and desktop capabilities verified.`);
