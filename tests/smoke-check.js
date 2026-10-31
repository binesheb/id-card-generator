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
if(!/^\d+\.\d+\.\d+$/.test(packageJson.version)) throw new Error(`package.json version must use SemVer MAJOR.MINOR.PATCH: ${packageJson.version}`);
const changelog=fs.readFileSync(path.join(root,'CHANGELOG.md'),'utf8');
if(!new RegExp(`^## ${packageJson.version.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`,'m').test(changelog)) throw new Error(`CHANGELOG.md is missing the current version heading: ${packageJson.version}`);

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
for (const token of ['node-version: 24', "FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: 'true'"]) {
  if (!workflow.includes(token)) throw new Error('CI Node 24 migration is incomplete: ' + token);
}

function validateActionPins(source, label) {
  const usesLines = source.split(/\r?\n/).filter(line => /^\s*(?:-\s*)?uses:\s*/.test(line));
  if (usesLines.length === 0) throw new Error(label + ' contains no workflow uses: references.');

  let checked = 0;
  for (const line of usesLines) {
    const match = line.match(/^\s*(?:-\s*)?uses:\s*(?:"([^"]+)"|'([^']+)'|([^#\s]+))(?:\s+#\s*(v[^\s]+))?\s*$/);
    if (!match) throw new Error(label + ' has an unparseable uses: reference: ' + line.trim());

    const reference = match[1] ?? match[2] ?? match[3];
    const versionComment = match[4];
    if (reference.startsWith('./')) continue;

    if (reference.startsWith('docker://')) {
      if (!/@sha256:[0-9a-f]{64}$/i.test(reference)) {
        throw new Error(label + ' Docker action must use an immutable SHA-256 image digest: ' + reference);
      }
      if (!versionComment || !/^v\d+(?:\.\d+){0,2}(?:[-+][A-Za-z0-9.-]+)?$/.test(versionComment)) {
        throw new Error(label + ' Docker action must include an explicit version comment: ' + reference);
      }
      checked++;
      continue;
    }

    const at = reference.lastIndexOf('@');
    if (at <= 0) throw new Error(label + ' has an unpinned external action: ' + reference);

    const sha = reference.slice(at + 1);
    if (!/^[0-9a-f]{40}$/i.test(sha)) {
      throw new Error(label + ' action must be pinned to a 40-character commit SHA: ' + reference);
    }
    if (!versionComment || !/^v\d+(?:\.\d+){0,2}(?:[-+][A-Za-z0-9.-]+)?$/.test(versionComment)) {
      throw new Error(label + ' action pin must include an explicit version comment: ' + reference);
    }
    checked++;
  }

  if (checked === 0) throw new Error(label + ' contains no external action references to validate.');
  return checked;
}

const actionPinFixture = [
  'jobs:',
  '  reusable:',
  '    uses: "example/reusable/.github/workflows/build.yml@' + 'a'.repeat(40) + '" # v1.2.3',
  '  build:',
  '    steps:',
  "      - uses: 'actions/checkout@" + 'b'.repeat(40) + "' # v4"
].join('\n');
if (validateActionPins(actionPinFixture, 'Action pin validator fixture') !== 2) {
  throw new Error('Action pin validator must check quoted job-level and step-level uses references.');
}

const dockerActionFixture = 'jobs:\n  build:\n    steps:\n      - uses: docker://vendor/tool:1.2.3@sha256:' + 'c'.repeat(64) + ' # v1.2.3';
if (validateActionPins(dockerActionFixture, 'Docker action validator fixture') !== 1) {
  throw new Error('Docker action validator must accept a digest-pinned image with a version comment.');
}

const checkedActions = validateActionPins(workflow, '.github/workflows/windows-build.yml');
if (checkedActions < 1) throw new Error('Workflow action pin validation did not check any external actions.');

function expectActionPinFailure(source, label) {
  try {
    validateActionPins(source, label);
  } catch {
    return;
  }
  throw new Error(label + ' unexpectedly passed.');
}
expectActionPinFailure(actionPinFixture.replace('a'.repeat(40), 'a'.repeat(39)), 'Short action SHA');
expectActionPinFailure(actionPinFixture.replace(' # v1.2.3', ''), 'Missing action version comment');
expectActionPinFailure('jobs:\n  build:\n    steps:\n      - run: echo no actions', 'Empty action workflow');
expectActionPinFailure('jobs:\n  build:\n    steps:\n      - uses: docker://vendor/tool:latest # v1.2.3', 'Mutable Docker action image');
expectActionPinFailure('jobs:\n  build:\n    steps:\n      - uses: docker://vendor/tool@sha256:' + 'c'.repeat(64), 'Docker action missing version comment');


const main=fs.readFileSync(path.join(root,'electron-main.js'),'utf8');
for(const token of ['autoUpdater','contextIsolation: true','nodeIntegration: false','sandbox: true','save-jpgs','window-control']) if(!main.includes(token)) throw new Error(`Missing desktop capability/security setting: ${token}`);

console.log(`Smoke check passed: ${requiredFiles.length} required files, SemVer/changelog alignment, syntax, single-controller architecture, UI wiring, photo crop/state integration, front layer ordering, address wrapping, preview/download/print, templates, Electron security, desktop output, and Node 24 CI verified.`);
