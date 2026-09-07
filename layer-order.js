(() => {
  const $ = id => document.getElementById(id);
  const canvas = $('frontCanvas');
  const photoInput = $('photoInput');
  const overlayInput = $('frontOverlayInput');
  const zoomInput = $('zoom');
  const modeInputs = () => [...document.querySelectorAll('input[name="frontLayerOrder"]')];
  const STORAGE_KEY = 'jayalakshmi-front-layer-order-v1';
  const DEFAULT_MODE = 'front-photo'; // TEXT > FRONT IMAGE > PHOTO
  const state = { mode: localStorage.getItem(STORAGE_KEY) || DEFAULT_MODE, photo: null, overlay: null, x: 0, y: 0, zoom: Number(zoomInput?.value || 1), drag: null };
  const PHOTO = { x: 0.2096, y: 0.1461, w: 0.5872, h: 0.4487, radius: 0.028 };
  const FONT = 'Satoshi, Arial, Helvetica, sans-serif';

  function loadFile(file, callback) {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); callback(img); render(); };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }

  function rounded(ctx, x, y, w, h, r) {
    const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    ctx.beginPath(); ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr); ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr); ctx.arcTo(x, y, x + w, y, rr); ctx.closePath();
  }

  function photoGeometry() {
    if (!canvas || !state.photo) return null;
    const box = { x: canvas.width * PHOTO.x, y: canvas.height * PHOTO.y, w: canvas.width * PHOTO.w, h: canvas.height * PHOTO.h, radius: canvas.width * PHOTO.radius };
    const scale = Math.max(box.w / state.photo.naturalWidth, box.h / state.photo.naturalHeight) * state.zoom;
    const w = state.photo.naturalWidth * scale, h = state.photo.naturalHeight * scale;
    return { box, w, h, baseX: box.x + (box.w - w) / 2, baseY: box.y + (box.h - h) / 2 };
  }

  function drawPhoto(ctx) {
    const g = photoGeometry(); if (!g) return;
    ctx.save(); rounded(ctx, g.box.x, g.box.y, g.box.w, g.box.h, g.box.radius); ctx.clip();
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(state.photo, g.baseX + state.x, g.baseY + state.y, g.w, g.h); ctx.restore();
    ctx.save(); rounded(ctx, g.box.x, g.box.y, g.box.w, g.box.h, g.box.radius);
    ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.lineWidth = Math.max(2, canvas.width * .004); ctx.stroke(); ctx.restore();
  }

  function drawText(ctx) {
    const name = ($('name')?.value || 'EMPLOYEE NAME').trim().toUpperCase();
    const designation = ($('designation')?.value || 'DESIGNATION').trim().toUpperCase();
    const code = ($('employeeCode')?.value || '').trim().toUpperCase();
    const specs = [
      [name, .50, .678, .90, .068, 500, .09],
      [designation, .50, .739, .94, .045, 700, .025],
      [code, .50, .778, .70, .029, 700, .025]
    ];
    for (const [text, x, y, maxW, baseSize, weight, spacingRatio] of specs) {
      if (!text) continue;
      let size = Math.max(14, canvas.width * baseSize);
      while (size > 14) {
        ctx.font = `${weight} ${size}px ${FONT}`;
        const spacing = size * spacingRatio;
        const width = [...text].reduce((sum, ch) => sum + ctx.measureText(ch).width, 0) + spacing * Math.max(0, text.length - 1);
        if (width <= canvas.width * maxW) break;
        size -= 1;
      }
      ctx.save(); ctx.fillStyle = '#fff'; ctx.font = `${weight} ${size}px ${FONT}`; ctx.textBaseline = 'middle';
      const spacing = size * spacingRatio, chars = [...text], widths = chars.map(ch => ctx.measureText(ch).width);
      const total = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, chars.length - 1);
      let cursor = canvas.width * x - total / 2;
      chars.forEach((ch, i) => { ctx.fillText(ch, cursor, canvas.height * y); cursor += widths[i] + spacing; });
      ctx.restore();
    }
  }

  function render() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Bottom -> top. Text is always last/topmost.
    if (state.mode === 'photo-front') {
      if (state.photo) drawPhoto(ctx);
      if (state.overlay) ctx.drawImage(state.overlay, 0, 0, canvas.width, canvas.height);
    } else {
      if (state.overlay) ctx.drawImage(state.overlay, 0, 0, canvas.width, canvas.height);
      if (state.photo) drawPhoto(ctx);
    }
    drawText(ctx);
  }

  function syncModeUI() {
    modeInputs().forEach(input => { input.checked = input.value === state.mode; });
    const status = $('layerOrderStatus');
    if (status) status.textContent = state.mode === 'photo-front' ? 'TEXT  ›  PHOTO  ›  FRONT IMAGE' : 'TEXT  ›  FRONT IMAGE  ›  PHOTO';
    render();
  }

  function install() {
    if (!canvas) return;
    if (photoInput) photoInput.addEventListener('change', e => { const file = e.target.files?.[0]; loadFile(file, img => { state.photo = img; state.x = 0; state.y = 0; state.zoom = Number(zoomInput?.value || 1); }); });
    if (overlayInput) overlayInput.addEventListener('change', e => loadFile(e.target.files?.[0], img => { state.overlay = img; }));
    zoomInput?.addEventListener('input', () => { state.zoom = Number(zoomInput.value || 1); render(); });
    document.addEventListener('input', e => { if (['name','designation','employeeCode'].includes(e.target?.id)) render(); });
    document.addEventListener('change', e => { if (['name','designation','employeeCode'].includes(e.target?.id)) render(); });
    document.addEventListener('change', e => {
      if (!e.target?.matches('input[name="frontLayerOrder"]')) return;
      state.mode = e.target.value; localStorage.setItem(STORAGE_KEY, state.mode); syncModeUI();
    });
    canvas.addEventListener('pointerdown', e => {
      if (!state.photo) return;
      state.drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture?.(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
      if (!state.drag || !state.photo) return;
      const rect = canvas.getBoundingClientRect();
      state.x += (e.clientX - state.drag.x) * canvas.width / rect.width;
      state.y += (e.clientY - state.drag.y) * canvas.height / rect.height;
      state.drag = { x: e.clientX, y: e.clientY }; render();
    });
    ['pointerup','pointercancel','pointerleave'].forEach(type => canvas.addEventListener(type, () => { state.drag = null; }));
    modeInputs().forEach(input => input.addEventListener('change', () => { state.mode = input.value; localStorage.setItem(STORAGE_KEY, state.mode); syncModeUI(); }));
    // Load existing files if the page was restored after a UI interaction.
    if (photoInput?.files?.[0]) loadFile(photoInput.files[0], img => { state.photo = img; });
    if (overlayInput?.files?.[0]) loadFile(overlayInput.files[0], img => { state.overlay = img; });
    syncModeUI();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true }); else install();
})();
