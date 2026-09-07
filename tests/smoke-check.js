const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const requiredFiles = [
  'index.html','styles.css','ui-enhancements.css','layer-order.css','app.js','electron-main.js','preload.js','updater-renderer.js','package.json','README.md','TEMPLATE.md'
];
for (const file of requiredFiles) if (!fs.existsSync(path.join(root,file))) throw new Error(`Missing required file: ${file}`);
for (const file of ['app.js','electron-main.js','preload.js','updater-renderer.js']) execFileSync(process.execPath,['--check',path.join(root,file)],{stdio:'pipe'});

const packageJson=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
if(packageJson.main!=='electron-main.js') throw new Error('package.json main entry is incorrect.');
if(!packageJson.dependencies?.['electron-updater']) throw new Error('electron-updater dependency is missing.');
if(packageJson.build?.appId!=='in.jayalakshmi.idcardgenerator') throw new Error('Unexpected Electron appId.');
if(packageJson.build?.publish?.[0]?.provider!=='github') throw new Error('GitHub updater provider is missing.');
if(packageJson.build?.publish?.[0]?.owner!=='binesheb'||packageJson.build?.publish?.[0]?.repo!=='id-card-generator') throw new Error('GitHub updater target is incorrect.');

const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const id of ['name','employeeCode','designation','photoInput','frontOverlayInput','backOverlayInput','address','contact','bloodGroup','frontCanvas','backCanvas','generate','cropModal','cropCanvas','cropDone','previewButton','downloadButton','printButton','saveTemplateButton','templatesButton','layerOrderStatus']) if(!html.includes(`id="${id}"`)) throw new Error(`Missing UI element: ${id}`);
if((html.match(/<script src="/g)||[]).length!==2) throw new Error('UI must have exactly one application controller plus updater renderer.');
if(!html.includes('<script src="app.js"></script>')) throw new Error('Primary application controller is not loaded.');
for(const duplicate of ['layer-order.js','ui-enhancements.js','functional-ui.js']) if(html.includes(`src="${duplicate}"`)) throw new Error(`Duplicate controller script remains loaded: ${duplicate}`);
for(const value of ['photo-front','front-photo']) if(!html.includes(`value="${value}"`)) throw new Error(`Missing layer-order option: ${value}`);

const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
for(const token of ['const state =','function render()','function drawFront()','function drawBack()','openCrop','finishCrop','downloadJpgs','printCards','saveTemplate','loadTemplate','photo-front','front-photo','chooseOutputDirectory','saveJpgs','toDataURL','wrapMultiline','localStorage.setItem']) if(!app.includes(token)) throw new Error(`Missing unified application capability: ${token}`);
if(!app.includes("state.layerOrder==='photo-front'")) throw new Error('Photo-above-artwork mode is not implemented in the authoritative renderer.');
if(!app.includes("drawTextSpacing(ctx,text,spec.x*canvas.width")) throw new Error('Employee text is not rendered by the authoritative renderer.');
if(!app.includes("replace(/\\r\\n/g,'\\n').replace(/\\r/g,'\\n')")) throw new Error('Address newline normalization is missing.');
if(!app.includes("state.photoState={x:state.crop.x,y:state.crop.y,zoom:state.crop.zoom}")) throw new Error('Crop editor is not connected to shared photo state.');
if(!app.includes("localStorage.setItem('jayalakshmi-front-layer-order',state.layerOrder)")) throw new Error('Layer-order persistence is missing.');

const workflow=fs.readFileSync(path.join(root,'.github/workflows/windows-build.yml'),'utf8');
for(const token of ['node-version: 24',"FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: 'true'",'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1','actions/setup-node@820762786026740c76f36085b0efc47a31fe5020','actions/upload-artifact@b7c566a772e6b6bfb58ed0dc250532a479d7789f']) if(!workflow.includes(token)) throw new Error(`CI Node 24 migration is incomplete: ${token}`);

const main=fs.readFileSync(path.join(root,'electron-main.js'),'utf8');
for(const token of ['autoUpdater','contextIsolation: true','nodeIntegration: false','sandbox: true','save-jpgs','window-control']) if(!main.includes(token)) throw new Error(`Missing desktop capability/security setting: ${token}`);

console.log(`Smoke check passed: ${requiredFiles.length} required files, syntax, single-controller architecture, UI wiring, photo crop/state integration, front layer ordering, address wrapping, preview/download/print, templates, Electron security, desktop output, and Node 24 CI verified.`);
