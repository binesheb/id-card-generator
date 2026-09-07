const PRINT_DPI = 600;
const FALLBACK_SIZE = { width: 625, height: 965 };
const CARD_FONT = 'Satoshi, Arial, Helvetica, sans-serif';

// Positions are proportional so the supplied production overlay controls the final canvas size.
// Typography and photo geometry are calibrated against the supplied 625x965 reference.
const TEMPLATE = {
  // Passport photo area from the supplied sample. The photo is clipped to a rounded rectangle.
  photo: { x: 0.2096, y: 0.1461, w: 0.5872, h: 0.4487, radius: 0.028 },
  // Name is deliberately lower than the photo to prevent visual collision.
  name: { x: 0.50, y: 0.678, maxWidth: 0.90, size: 0.068, weight: 500, letterSpacing: 0.09 },
  designation: { x: 0.50, y: 0.739, maxWidth: 0.94, size: 0.045, weight: 700, letterSpacing: 0.025 },
  // Employee code is larger and slightly higher for reliable print readability.
  employeeCode: { x: 0.50, y: 0.778, maxWidth: 0.70, size: 0.029, weight: 700, letterSpacing: 0.025, enabled: true }
};

// Rear-side information is rendered as distinct light cards so the variable text remains
// readable over the decorative red/gold artwork regardless of the underlying overlay.
const BACK_TEXT = {
  heading: { x: 0.50, y: 0.20, size: 0.042 },
  address: { x: 0.12, y: 0.34, maxWidth: 0.76, size: 0.028, lineGap: 0.055 },
  contact: { x: 0.12, y: 0.67, size: 0.030 },
  blood: { x: 0.12, y: 0.77, size: 0.030 },
  card: { x: 0.09, w: 0.82, radius: 0.018, padding: 0.025 }
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
let outputDirectory = null;

function setCanvasSize(canvas, width, height) {
  canvas.width = width;
  canvas.height = height;
}

function getSize() {
  return frontOverlay ? { width: frontOverlay.naturalWidth, height: frontOverlay.naturalHeight } : FALLBACK_SIZE;
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

function photoBox(canvas) {
  const r = TEMPLATE.photo;
  return { x: canvas.width * r.x, y: canvas.height * r.y, w: canvas.width * r.w, h: canvas.height * r.h, radius: canvas.width * r.radius };
}

function roundedRectPath(ctx, x, y, w, h, radius) {
  const r = Math.max(0, Math.min(radius, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function currentPhotoGeometry(canvas) {
  const box = photoBox(canvas);
  const scale = Math.max(box.w / photo.naturalWidth, box.h / photo.naturalHeight) * photoState.zoom;
  const w = photo.naturalWidth * scale;
  const h = photo.naturalHeight * scale;
  const baseX = box.x + (box.w - w) / 2;
  const baseY = box.y + (box.h - h) / 2;
  return { box, w, h, baseX, baseY };
}

function clampPhotoPosition() {
  if (!photo) return;
  const { box, w, h, baseX, baseY } = currentPhotoGeometry(els.frontCanvas);
  const minOffsetX = box.x + box.w - w - baseX;
  const maxOffsetX = box.x - baseX;
  const minOffsetY = box.y + box.h - h - baseY;
  const maxOffsetY = box.y - baseY;
  photoState.x = Math.min(maxOffsetX, Math.max(minOffsetX, photoState.x));
  photoState.y = Math.min(maxOffsetY, Math.max(minOffsetY, photoState.y));
}

function drawFront() {
  const canvas = els.frontCanvas;
  const ctx = canvas.getContext('2d', { alpha: false });
  drawBackground(ctx, canvas);

  if (photo) {
    const { box, w, h, baseX, baseY } = currentPhotoGeometry(canvas);
    ctx.save();
    // Rounded photo crop: the employee photograph itself has the same rounded silhouette
    // visible in the supplied sample, rather than a square crop underneath the overlay.
    roundedRectPath(ctx, box.x, box.y, box.w, box.h, box.radius);
    ctx.clip();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(photo, baseX + photoState.x, baseY + photoState.y, w, h);
    ctx.restore();

    // Fine light border around the photo keeps the rounded edge clean on print.
    ctx.save();
    roundedRectPath(ctx, box.x, box.y, box.w, box.h, box.radius);
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = Math.max(2, canvas.width * 0.004);
    ctx.stroke();
    ctx.restore();
  }

  if (frontOverlay) ctx.drawImage(frontOverlay, 0, 0, canvas.width, canvas.height);

  drawVariableText(ctx, els.name.value.trim() || 'EMPLOYEE NAME', TEMPLATE.name, canvas);
  drawVariableText(ctx, els.designation.value.trim() || 'DESIGNATION', TEMPLATE.designation, canvas);
  if (TEMPLATE.employeeCode.enabled && els.employeeCode.value.trim()) {
    drawVariableText(ctx, els.employeeCode.value.trim(), TEMPLATE.employeeCode, canvas);
  }
}

function drawBack() {
  const canvas = els.backCanvas;
  const ctx = canvas.getContext('2d', { alpha: false });
  drawBackground(ctx, canvas);
  if (backOverlay) ctx.drawImage(backOverlay, 0, 0, canvas.width, canvas.height);

  const scale = canvas.width;
  drawText(ctx, 'EMERGENCY DETAILS', BACK_TEXT.heading.x * canvas.width, BACK_TEXT.heading.y * canvas.height, scale * BACK_TEXT.heading.size, 700, 'center');

  // Address card: generous padding and automatic line fitting for long addresses.
  const cardX = canvas.width * BACK_TEXT.card.x;
  const cardW = canvas.width * BACK_TEXT.card.w;
  const cardRadius = canvas.width * BACK_TEXT.card.radius;
  const address = els.address.value.trim();
  const addressLines = wrapText(ctx, address || 'Emergency address', scale * BACK_TEXT.address.size, cardW - 2 * canvas.width * BACK_TEXT.card.padding, 500, 5);
  const addressLineHeight = scale * 0.044;
  const addressTop = canvas.height * 0.315;
  const addressHeight = Math.max(canvas.height * 0.105, addressLines.length * addressLineHeight + canvas.height * 0.055);
  drawInfoCard(ctx, cardX, addressTop, cardW, addressHeight, cardRadius);
  addressLines.forEach((line, i) => drawTextFitted(
    ctx,
    line,
    cardX + canvas.width * BACK_TEXT.card.padding,
    addressTop + canvas.height * 0.034 + i * addressLineHeight,
    scale * BACK_TEXT.address.size,
    cardW - 2 * canvas.width * BACK_TEXT.card.padding,
    500,
    'left'
  ));

  const contactTop = canvas.height * 0.635;
  const contactHeight = canvas.height * 0.075;
  drawInfoCard(ctx, cardX, contactTop, cardW, contactHeight, cardRadius);
  drawTextFitted(ctx, `Contact: ${els.contact.value.trim() || '—'}`, cardX + canvas.width * BACK_TEXT.card.padding, contactTop + contactHeight / 2, scale * BACK_TEXT.contact.size, cardW - 2 * canvas.width * BACK_TEXT.card.padding, 700, 'left');

  const bloodTop = canvas.height * 0.735;
  const bloodHeight = canvas.height * 0.075;
  drawInfoCard(ctx, cardX, bloodTop, cardW, bloodHeight, cardRadius);
  drawTextFitted(ctx, `Blood Group: ${els.bloodGroup.value || '—'}`, cardX + canvas.width * BACK_TEXT.card.padding, bloodTop + bloodHeight / 2, scale * BACK_TEXT.blood.size, cardW - 2 * canvas.width * BACK_TEXT.card.padding, 700, 'left');
}

function drawInfoCard(ctx, x, y, w, h, radius) {
  ctx.save();
  roundedRectPath(ctx, x, y, w, h, radius);
  ctx.fillStyle = 'rgba(255,255,255,0.94)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(218,178,112,0.95)';
  ctx.lineWidth = Math.max(2, ctx.canvas.width * 0.0025);
  ctx.stroke();
  ctx.restore();
}

function wrapText(ctx, value, size, maxWidth, weight, maxLines) {
  setCardFont(ctx, weight, size);
  const words = value.replace(/\s+/g, ' ').trim().split(' ');
  const lines = [];
  let line = '';
  words.forEach(word => {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
    } else if (lines.length < maxLines - 1) {
      lines.push(line);
      line = word;
    } else {
      line = `${line} ${word}`;
    }
  });
  if (line) lines.push(line);
  if (lines.length > maxLines) lines.length = maxLines;
  return lines;
}

function setCardFont(ctx, weight, size) {
  ctx.font = `${weight} ${size}px ${CARD_FONT}`;
}

function drawVariableText(ctx, value, spec, canvas) {
  const text = value.toUpperCase();
  const maxWidth = canvas.width * spec.maxWidth;
  let size = Math.max(14, canvas.width * spec.size);
  const weight = spec.weight || 500;
  while (size > 14) {
    setCardFont(ctx, weight, size);
    const spacing = size * (spec.letterSpacing || 0);
    const measured = [...text].reduce((sum, ch) => sum + ctx.measureText(ch).width, 0) + spacing * Math.max(0, text.length - 1);
    if (measured <= maxWidth) break;
    size -= 1;
  }
  drawTextWithSpacing(ctx, text, spec.x * canvas.width, spec.y * canvas.height, size, weight, spec.letterSpacing || 0, '#ffffff');
}

function drawTextFitted(ctx, value, x, y, size, maxWidth, weight, align) {
  let current = size;
  while (current > 12) {
    setCardFont(ctx, weight, current);
    if (ctx.measureText(value).width <= maxWidth) break;
    current -= 1;
  }
  drawText(ctx, value, x, y, current, weight, align);
}

function drawText(ctx, value, x, y, size, weight, align, fill = '#18202a') {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  setCardFont(ctx, weight, size);
  ctx.fillText(value, x, y);
  ctx.restore();
}

function drawTextWithSpacing(ctx, value, x, y, size, weight, spacingRatio, fill) {
  if (!spacingRatio) return drawText(ctx, value, x, y, size, weight, 'center', fill);
  ctx.save();
  ctx.fillStyle = fill;
  setCardFont(ctx, weight, size);
  ctx.textBaseline = 'middle';
  const spacing = size * spacingRatio;
  const chars = [...value];
  const widths = chars.map(ch => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, chars.length - 1);
  let cursor = x - total / 2;
  chars.forEach((ch, i) => { ctx.fillText(ch, cursor, y); cursor += widths[i] + spacing; });
  ctx.restore();
}

function loadImageFile(file, callback) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file.');
    return;
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    URL.revokeObjectURL(url);
    if (!img.naturalWidth || !img.naturalHeight) {
      alert('The selected image has no usable dimensions.');
      return;
    }
    callback(img);
    draw();
  };
  img.onerror = () => { URL.revokeObjectURL(url); alert('Could not read that image.'); };
  img.src = url;
}

els.photoInput.addEventListener('change', e => loadImageFile(e.target.files?.[0], img => {
  photo = img;
  photoState = { x: 0, y: 0, zoom: 1 };
  els.zoom.value = 1;
}));

els.frontOverlayInput.addEventListener('change', e => loadImageFile(e.target.files?.[0], img => {
  frontOverlay = img;
  updateOverlayStatus();
}));

els.backOverlayInput.addEventListener('change', e => loadImageFile(e.target.files?.[0], img => {
  backOverlay = img;
  updateOverlayStatus();
}));

function updateOverlayStatus() {
  if (frontOverlay && backOverlay) {
    const sameSize = frontOverlay.naturalWidth === backOverlay.naturalWidth && frontOverlay.naturalHeight === backOverlay.naturalHeight;
    els.overlayStatus.textContent = sameSize
      ? `Front ${frontOverlay.naturalWidth}×${frontOverlay.naturalHeight} · Rear ${backOverlay.naturalWidth}×${backOverlay.naturalHeight} · Ready`
      : `Size mismatch: Front ${frontOverlay.naturalWidth}×${frontOverlay.naturalHeight} · Rear ${backOverlay.naturalWidth}×${backOverlay.naturalHeight}`;
    return;
  }
  els.overlayStatus.textContent = `${frontOverlay ? 'Front overlay loaded' : 'Front overlay missing'} · ${backOverlay ? 'Rear overlay loaded' : 'Rear overlay missing'}`;
}

els.zoom.addEventListener('input', () => {
  photoState.zoom = Number(els.zoom.value);
  clampPhotoPosition();
  draw();
});

els.resetPhoto.addEventListener('click', () => {
  photoState = { x: 0, y: 0, zoom: 1 };
  els.zoom.value = 1;
  draw();
});

['name','employeeCode','designation','address','contact','bloodGroup'].forEach(id => els[id].addEventListener('input', draw));

function pointerPosition(event) {
  const rect = els.frontCanvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * els.frontCanvas.width / rect.width,
    y: (event.clientY - rect.top) * els.frontCanvas.height / rect.height
  };
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
  clampPhotoPosition();
  draw();
});

['pointerup','pointercancel','pointerleave'].forEach(type => els.frontCanvas.addEventListener(type, event => {
  drag = null;
  if (event.pointerId !== undefined && els.frontCanvas.hasPointerCapture?.(event.pointerId)) {
    try { els.frontCanvas.releasePointerCapture(event.pointerId); } catch (_) {}
  }
}));

function safeCode() {
  const raw = els.employeeCode.value.trim();
  return raw.replace(/[<>:"/\\|?*\x00-\x1F]+/g, '_').replace(/[. ]+$/g, '') || 'EMPLOYEE_CODE';
}

function jpegData(canvas) {
  const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
  return stampJpegDpi(dataUrl, PRINT_DPI);
}

function stampJpegDpi(dataUrl, dpi) {
  try {
    const base64 = dataUrl.split(',')[1];
    const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
    // Canvas JPEGs normally contain a JFIF APP0 segment. Set its density to 600 DPI.
    for (let i = 0; i + 15 < bytes.length; i++) {
      if (bytes[i] === 0xFF && bytes[i + 1] === 0xE0 &&
          bytes[i + 4] === 0x4A && bytes[i + 5] === 0x46 && bytes[i + 6] === 0x49 &&
          bytes[i + 7] === 0x46 && bytes[i + 8] === 0x00) {
        bytes[i + 11] = 1;
        bytes[i + 12] = (dpi >> 8) & 0xFF;
        bytes[i + 13] = dpi & 0xFF;
        bytes[i + 14] = (dpi >> 8) & 0xFF;
        bytes[i + 15] = dpi & 0xFF;
        let binary = '';
        const chunk = 0x8000;
        for (let p = 0; p < bytes.length; p += chunk) binary += String.fromCharCode(...bytes.subarray(p, p + chunk));
        return `data:image/jpeg;base64,${btoa(binary)}`;
      }
    }
  } catch (error) {
    console.warn('Could not stamp JPEG DPI metadata; retaining the original JPEG.', error);
  }
  return dataUrl;
}

async function waitForFonts() {
  if (document.fonts?.ready) {
    try { await document.fonts.ready; } catch (_) {}
  }
}

async function generateFiles() {
  if (!frontOverlay || !backOverlay) throw new Error('Please load both the front and rear standard overlays.');
  if (frontOverlay.naturalWidth !== backOverlay.naturalWidth || frontOverlay.naturalHeight !== backOverlay.naturalHeight) {
    throw new Error('Front and rear overlays must have exactly the same pixel dimensions.');
  }
  if (!photo) throw new Error('Please upload the employee photo.');

  await waitForFonts();
  draw();

  const code = safeCode();
  const files = [
    { name: `${code}_FRONT.jpg`, dataUrl: jpegData(els.frontCanvas) },
    { name: `${code}_BACK.jpg`, dataUrl: jpegData(els.backCanvas) }
  ];

  if (!window.idCardDesktop) {
    files.forEach(file => {
      const link = document.createElement('a');
      link.download = file.name;
      link.href = file.dataUrl;
      link.click();
    });
    return true;
  }

  if (!outputDirectory) outputDirectory = await window.idCardDesktop.chooseOutputDirectory();
  if (!outputDirectory) return false;
  for (const file of files) await window.idCardDesktop.saveJpeg({ directory: outputDirectory, filename: file.name, dataUrl: file.dataUrl });
  return true;
}

els.generate.addEventListener('click', async () => {
  try {
    els.generate.disabled = true;
    els.generate.textContent = 'Generating…';
    const generated = await generateFiles();
    if (generated) alert('Front and rear JPGs generated successfully.');
  } catch (error) {
    alert(error.message || 'Could not generate the ID card.');
  } finally {
    els.generate.disabled = false;
    els.generate.textContent = 'Generate JPGs';
  }
});

els.clear.addEventListener('click', () => {
  ['name','employeeCode','designation','address','contact'].forEach(id => { els[id].value = ''; });
  els.bloodGroup.value = '';
  els.photoInput.value = '';
  els.frontOverlayInput.value = '';
  els.backOverlayInput.value = '';
  photo = null;
  frontOverlay = null;
  backOverlay = null;
  outputDirectory = null;
  photoState = { x: 0, y: 0, zoom: 1 };
  els.zoom.value = 1;
  updateOverlayStatus();
  draw();
});

draw();
