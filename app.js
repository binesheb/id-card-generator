const PRINT_DPI = 600;

// The sample supplied for the approved design is portrait. Once the production
// overlay is supplied, its aspect ratio becomes authoritative for the canvas.
const FALLBACK_SIZE = { width: 625, height: 965 };

// All front coordinates are ratios so the same layout scales to any overlay size.
// These are based on the supplied final-look reference and can be adjusted in one place.
const TEMPLATE = {
  photo: { x: 0.2096, y: 0.1461, w: 0.5872, h: 0.4487 },
  name: { x: 0.50, y: 0.655, maxWidth: 0.90, size: 0.050, weight: 500, letterSpacing: 0.09 },
  designation: { x: 0.50, y: 0.719, maxWidth: 0.94, size: 0.035, weight: 700, letterSpacing: 0.025 },
  employeeCode: { x: 0.50, y: 0.772, maxWidth: 0.70, size: 0.022, weight: 600, enabled: true }
};

const BACK_TEXT = {
  heading: { x: 0.50, y: 0.20, size: 0.042 },
  address: { x: 0.12, y: 0.34, size: 0.028, lineGap: 0.055 },
  contact: { x: 0.12, y: 0.67, size: 0.030 },
  blood: { x: 0.12, y: 0.77, size: 0.030 }
};

const $ = id => document.getElementById(id);
const els = Object.fromEntries([
  'name','employeeCode','designation','address','contact','bloodGroup',
  'photoInput','zoom','frontOverlayInput','backOverlayInput',
  'overlayStatus','frontCanvas','backCanvas','resetPhoto','generate','clear'
].map(id => [id, $(id)]));

let photo = null;
let frontOverlay = null;
let backOverlay = null;
let photoState = { x: 0, y: 0, zoom: 1 };
let drag = null;

function setCanvasSize(canvas, width, height) {
  canvas.width = width;
  canvas.height = height;
}

function getSize() {
  if (frontOverlay) return { width: frontOverlay.naturalWidth, height: frontOverlay.naturalHeight };
  return FALLBACK_SIZE;
}

function draw() {
  const size = getSize();
  setCanvasSize(els.frontCanvas, size.width, size.height);
  setCanvasSize(els.backCanvas, backOverlay ? backOverlay.naturalWidth : size.width, backOverlay ? backOverlay.naturalHeight : size.height);
  drawFront();
  drawBack();
}

function drawBackground(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawFront() {
  const canvas = els.frontCanvas;
  const ctx = canvas.getContext('2d', { alpha: false });
  drawBackground(ctx, canvas);

  const r = TEMPLATE.photo;
  if (photo) {
    const box = { x: canvas.width*r.x, y: canvas.height*r.y, w: canvas.width*r.w, h: canvas.height*r.h };
    const scale = Math.max(box.w / photo.naturalWidth, box.h / photo.naturalHeight) * photoState.zoom;
    const w = photo.naturalWidth * scale;
    const h = photo.naturalHeight * scale;
    const x = box.x + (box.w - w) / 2 + photoState.x;
    const y = box.y + (box.h - h) / 2 + photoState.y;
    ctx.save();
    ctx.beginPath();
    ctx.rect(box.x, box.y, box.w, box.h);
    ctx.clip();
    ctx.drawImage(photo, x, y, w, h);
    ctx.restore();
  }

  // Overlay is drawn above the photo so its transparent artwork/frame is preserved.
  if (frontOverlay) ctx.drawImage(frontOverlay, 0, 0, canvas.width, canvas.height);

  // Variable text is deliberately rendered last. Fixed artwork therefore remains in the overlay.
  const name = els.name.value.trim();
  const designation = els.designation.value.trim();
  const code = els.employeeCode.value.trim();
  drawVariableText(ctx, name || 'EMPLOYEE NAME', TEMPLATE.name, canvas, true);
  drawVariableText(ctx, designation || 'DESIGNATION', TEMPLATE.designation, canvas, false);
  if (TEMPLATE.employeeCode.enabled && code) drawVariableText(ctx, code, TEMPLATE.employeeCode, canvas, false);
}

function drawBack() {
  const canvas = els.backCanvas;
  const ctx = canvas.getContext('2d', { alpha: false });
  drawBackground(ctx, canvas);
  if (backOverlay) ctx.drawImage(backOverlay, 0, 0, canvas.width, canvas.height);

  const scale = canvas.width;
  const heading = 'EMERGENCY DETAILS';
  drawText(ctx, heading, BACK_TEXT.heading.x*canvas.width, BACK_TEXT.heading.y*canvas.height, scale*BACK_TEXT.heading.size, 700, 'center');

  const lines = (els.address.value.trim() || 'Emergency address').split(/\r?\n/).slice(0, 5);
  lines.forEach((line, i) => drawText(ctx, line, BACK_TEXT.address.x*canvas.width, canvas.height*(BACK_TEXT.address.y + i*BACK_TEXT.address.lineGap), scale*BACK_TEXT.address.size, 500, 'left'));
  drawText(ctx, `Contact: ${els.contact.value.trim() || '—'}`, BACK_TEXT.contact.x*canvas.width, BACK_TEXT.contact.y*canvas.height, scale*BACK_TEXT.contact.size, 700, 'left');
  drawText(ctx, `Blood Group: ${els.bloodGroup.value || '—'}`, BACK_TEXT.blood.x*canvas.width, BACK_TEXT.blood.y*canvas.height, scale*BACK_TEXT.blood.size, 700, 'left');
}

function drawVariableText(ctx, value, spec, canvas, uppercase) {
  const text = uppercase ? value.toUpperCase() : value.toUpperCase();
  const maxWidth = canvas.width * spec.maxWidth;
  let size = canvas.width * spec.size;
  const family = 'Arial, Helvetica, sans-serif';
  const weight = spec.weight || 500;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > 14) {
    size -= 1;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  // Letter spacing is approximated for broad browser compatibility.
  drawTextWithSpacing(ctx, text, spec.x*canvas.width, spec.y*canvas.height, size, weight, spec.letterSpacing || 0, '#ffffff');
  ctx.restore();
}

function drawText(ctx, value, x, y, size, weight, align, fill = '#18202a') {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.font = `${weight} ${size}px Arial, Helvetica, sans-serif`;
  ctx.fillText(value, x, y);
  ctx.restore();
}

function drawTextWithSpacing(ctx, value, x, y, size, weight, spacingRatio, fill) {
  if (!spacingRatio) return drawText(ctx, value, x, y, size, weight, 'center', fill);
  ctx.save();
  ctx.fillStyle = fill;
  ctx.font = `${weight} ${size}px Arial, Helvetica, sans-serif`;
  ctx.textBaseline = 'middle';
  const spacing = size * spacingRatio;
  const widths = [...value].map(ch => ctx.measureText(ch).width);
  const total = widths.reduce((a,b) => a+b, 0) + spacing * Math.max(0, value.length-1);
  let cursor = x - total/2;
  [...value].forEach((ch, i) => { ctx.fillText(ch, cursor, y); cursor += widths[i] + spacing; });
  ctx.restore();
}

function loadImageFile(file, callback) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => { URL.revokeObjectURL(url); callback(img); draw(); };
  img.onerror = () => { URL.revokeObjectURL(url); alert('Could not read that image.'); };
  img.src = url;
}

els.photoInput.addEventListener('change', e => {
  loadImageFile(e.target.files?.[0], img => {
    photo = img;
    photoState = { x: 0, y: 0, zoom: 1 };
    els.zoom.value = 1;
  });
});

els.frontOverlayInput.addEventListener('change', e => {
  loadImageFile(e.target.files?.[0], img => {
    frontOverlay = img;
    updateOverlayStatus();
  });
});

els.backOverlayInput.addEventListener('change', e => {
  loadImageFile(e.target.files?.[0], img => {
    backOverlay = img;
    updateOverlayStatus();
  });
});

function updateOverlayStatus() {
  els.overlayStatus.textContent = `${frontOverlay ? 'Front overlay loaded' : 'Front overlay missing'} · ${backOverlay ? 'Rear overlay loaded' : 'Rear overlay missing'}`;
}

els.zoom.addEventListener('input', () => { photoState.zoom = Number(els.zoom.value); draw(); });
els.resetPhoto.addEventListener('click', () => { photoState = { x: 0, y: 0, zoom: 1 }; els.zoom.value = 1; draw(); });

['name','employeeCode','designation','address','contact','bloodGroup'].forEach(id => els[id].addEventListener('input', draw));

function pointerPosition(event) {
  const rect = els.frontCanvas.getBoundingClientRect();
  return { x: (event.clientX - rect.left) * els.frontCanvas.width / rect.width, y: (event.clientY - rect.top) * els.frontCanvas.height / rect.height };
}

els.frontCanvas.addEventListener('pointerdown', event => {
  if (!photo) return;
  drag = pointerPosition(event);
  els.frontCanvas.setPointerCapture(event.pointerId);
});
els.frontCanvas.addEventListener('pointermove', event => {
  if (!drag || !photo) return;
  const p = pointerPosition(event);
  photoState.x += p.x - drag.x;
  photoState.y += p.y - drag.y;
  drag = p;
  draw();
});
['pointerup','pointercancel','pointerleave'].forEach(type => els.frontCanvas.addEventListener(type, () => { drag = null; }));

function safeCode() {
  return (els.employeeCode.value.trim() || 'EMPLOYEE_CODE').replace(/[^a-zA-Z0-9._-]+/g, '_');
}

function download(canvas, suffix) {
  const link = document.createElement('a');
  link.download = `${safeCode()}_${suffix}.jpg`;
  link.href = canvas.toDataURL('image/jpeg', 1.0);
  link.click();
}

els.generate.addEventListener('click', () => {
  if (!els.employeeCode.value.trim()) {
    alert('Please enter Employee Code before generating the JPG files.');
    els.employeeCode.focus();
    return;
  }
  draw();
  download(els.frontCanvas, 'FRONT');
  setTimeout(() => download(els.backCanvas, 'BACK'), 300);
});

els.clear.addEventListener('click', () => {
  ['name','employeeCode','designation','address','contact'].forEach(id => els[id].value = '');
  els.bloodGroup.value = '';
  els.photoInput.value = '';
  els.frontOverlayInput.value = '';
  els.backOverlayInput.value = '';
  photo = null; frontOverlay = null; backOverlay = null;
  photoState = { x: 0, y: 0, zoom: 1 };
  els.zoom.value = 1;
  updateOverlayStatus();
  draw();
});

updateOverlayStatus();
draw();
