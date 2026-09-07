(() => {
  const $ = id => document.getElementById(id);
  const employeeTab = $('employeeTab');
  const designTab = $('designTab');
  const employeePanel = $('employeePanel');
  const designPanel = $('designPanel');
  const frontInput = $('frontOverlayInput');
  const backInput = $('backOverlayInput');
  const frontState = $('frontOverlayState');
  const backState = $('backOverlayState');
  const visibleStatus = $('overlayStatusVisible');
  const designStatus = $('designStatusCard');

  function showPanel(which) {
    const design = which === 'design';
    employeePanel.hidden = design;
    designPanel.hidden = !design;
    employeeTab.classList.toggle('active', !design);
    designTab.classList.toggle('active', design);
    employeeTab.setAttribute('aria-selected', String(!design));
    designTab.setAttribute('aria-selected', String(design));
  }
  employeeTab?.addEventListener('click', () => showPanel('employee'));
  designTab?.addEventListener('click', () => showPanel('design'));

  function describeFile(file) {
    if (!file) return 'No image selected';
    const kb = Math.max(1, Math.round(file.size / 1024));
    return `${file.name} · ${kb} KB`;
  }
  frontInput?.addEventListener('change', () => { frontState.textContent = describeFile(frontInput.files?.[0]); updateArtworkStatus(); });
  backInput?.addEventListener('change', () => { backState.textContent = describeFile(backInput.files?.[0]); updateArtworkStatus(); });

  function updateArtworkStatus() {
    const front = frontInput?.files?.[0];
    const back = backInput?.files?.[0];
    if (front && back) {
      visibleStatus.textContent = 'Front and back artwork selected. Generate will use both images as the card backgrounds.';
      designStatus?.classList.add('ready');
    } else {
      visibleStatus.textContent = `Waiting for ${front ? 'back' : back ? 'front' : 'front and back'} image${front && !back ? '' : back && !front ? '' : 's'}.`;
      designStatus?.classList.remove('ready');
    }
  }
  updateArtworkStatus();

  const cropModal = $('cropModal');
  const cropCanvas = $('cropCanvas');
  const cropZoom = $('cropZoom');
  const cropZoomValue = $('cropZoomValue');
  let cropImage = null;
  let cropScale = 1;
  let cropX = 0;
  let cropY = 0;
  let cropDrag = null;

  function drawCropPreview() {
    if (!cropCanvas) return;
    const ctx = cropCanvas.getContext('2d');
    const w = cropCanvas.width, h = cropCanvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#eef2f7'; ctx.fillRect(0, 0, w, h);
    if (!cropImage) return;
    const fit = Math.max(w / cropImage.naturalWidth, h / cropImage.naturalHeight);
    const scale = fit * cropScale;
    const iw = cropImage.naturalWidth * scale, ih = cropImage.naturalHeight * scale;
    ctx.save();
    ctx.beginPath(); ctx.rect(35, 35, w - 70, h - 70); ctx.clip();
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(cropImage, (w - iw) / 2 + cropX, (h - ih) / 2 + cropY, iw, ih);
    ctx.restore();
    ctx.strokeStyle = 'rgba(8,105,220,.85)'; ctx.lineWidth = 3; ctx.strokeRect(35,35,w-70,h-70);
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(w/2,35); ctx.lineTo(w/2,h-35); ctx.moveTo(35,h/2); ctx.lineTo(w-35,h/2); ctx.stroke();
  }
  function openCrop() {
    const input = $('photoInput');
    const file = input?.files?.[0];
    if (!file) { alert('Please upload an employee photo first.'); return; }
    cropImage = new Image();
    cropImage.onload = () => {
      cropScale = Number(cropZoom?.value || 100) / 100;
      cropX = 0; cropY = 0;
      drawCropPreview();
      cropModal.hidden = false;
      document.body.classList.add('crop-open');
    };
    cropImage.onerror = () => alert('Could not open the selected photo.');
    cropImage.src = URL.createObjectURL(file);
  }
  $('resetPhoto')?.addEventListener('click', event => {
    event.preventDefault(); event.stopImmediatePropagation(); openCrop();
  }, true);
  $('closeCrop')?.addEventListener('click', () => { cropModal.hidden = true; document.body.classList.remove('crop-open'); });
  $('cropDone')?.addEventListener('click', () => { cropModal.hidden = true; document.body.classList.remove('crop-open'); });
  $('cropReset')?.addEventListener('click', () => { cropScale = 1; cropX = 0; cropY = 0; cropZoom.value = 100; cropZoomValue.textContent = '100%'; drawCropPreview(); $('zoom').value = 1; $('zoom').dispatchEvent(new Event('input', { bubbles: true })); });
  cropZoom?.addEventListener('input', () => { cropScale = Number(cropZoom.value) / 100; cropZoomValue.textContent = `${cropZoom.value}%`; drawCropPreview(); $('zoom').value = cropZoom.value / 100; $('zoom').dispatchEvent(new Event('input', { bubbles: true })); });
  cropCanvas?.addEventListener('pointerdown', event => { cropDrag = { x: event.clientX, y: event.clientY }; cropCanvas.setPointerCapture(event.pointerId); });
  cropCanvas?.addEventListener('pointermove', event => { if (!cropDrag) return; cropX += event.clientX - cropDrag.x; cropY += event.clientY - cropDrag.y; cropDrag = { x: event.clientX, y: event.clientY }; drawCropPreview(); });
  ['pointerup','pointercancel'].forEach(type => cropCanvas?.addEventListener(type, () => { cropDrag = null; }));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && cropModal && !cropModal.hidden) { cropModal.hidden = true; document.body.classList.remove('crop-open'); } });
})();
