(() => {
  const $ = id => document.getElementById(id);
  const employeeTab = $('employeeTab'), designTab = $('designTab');
  const employeePanel = $('employeePanel'), designPanel = $('designPanel');
  const frontInput = $('frontOverlayInput'), backInput = $('backOverlayInput');
  const frontState = $('frontOverlayState'), backState = $('backOverlayState');
  const visibleStatus = $('overlayStatusVisible'), designStatus = $('designStatusCard');

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

  const describeFile = file => !file ? 'No image selected' : `${file.name} · ${Math.max(1, Math.round(file.size / 1024))} KB`;

  function updateArtworkStatus() {
    const front = frontInput?.files?.[0];
    const back = backInput?.files?.[0];
    if (front) frontState.textContent = describeFile(front);
    else if (frontState) frontState.textContent = 'No front image selected';
    if (back) backState.textContent = describeFile(back);
    else if (backState) backState.textContent = 'No back image selected';

    if (front && back) {
      visibleStatus.textContent = 'Front and back artwork selected. Generate will use both images as the card backgrounds.';
      designStatus?.classList.add('ready');
    } else {
      const waiting = front ? 'back' : back ? 'front' : 'front and back';
      visibleStatus.textContent = `Waiting for ${waiting} image${front && !back || back && !front ? '' : 's'}.`;
      designStatus?.classList.remove('ready');
    }
  }

  frontInput?.addEventListener('change', updateArtworkStatus);
  backInput?.addEventListener('change', updateArtworkStatus);
  updateArtworkStatus();
})();

// Preserve explicit newlines in the emergency address and wrap each address line independently.
(() => {
  function drawBackWithMultilineAddress() {
    if (typeof els === 'undefined' || !els.backCanvas || typeof drawInfoCard !== 'function') return;
    const canvas = els.backCanvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    drawBackground(ctx, canvas);
    if (typeof backOverlay !== 'undefined' && backOverlay) ctx.drawImage(backOverlay, 0, 0, canvas.width, canvas.height);
    const scale = canvas.width;
    drawText(ctx, 'EMERGENCY DETAILS', BACK_TEXT.heading.x * canvas.width, BACK_TEXT.heading.y * canvas.height, scale * BACK_TEXT.heading.size, 700, 'center');
    const cardX = canvas.width * BACK_TEXT.card.x;
    const cardW = canvas.width * BACK_TEXT.card.w;
    const cardRadius = canvas.width * BACK_TEXT.card.radius;
    const padding = canvas.width * BACK_TEXT.card.padding;
    const availableWidth = cardW - padding * 2;
    const rawAddress = String(els.address.value || 'Emergency address').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const paragraphs = rawAddress.split('\n');
    const lines = [];
    setCardFont(ctx, 500, scale * BACK_TEXT.address.size);
    for (const paragraph of paragraphs) {
      const text = paragraph.trim();
      if (!text) { if (lines.length < 5) lines.push(''); continue; }
      let line = '';
      for (const word of text.replace(/[ \t]+/g, ' ').split(' ')) {
        const candidate = line ? `${line} ${word}` : word;
        if (!line || ctx.measureText(candidate).width <= availableWidth) line = candidate;
        else { if (lines.length < 5) lines.push(line); line = word; }
      }
      if (line && lines.length < 5) lines.push(line);
      if (lines.length >= 5) break;
    }
    if (!lines.length) lines.push('Emergency address');
    const lineHeight = scale * 0.044;
    const addressTop = canvas.height * 0.315;
    const paddingTop = canvas.height * 0.034;
    const paddingBottom = canvas.height * 0.040;
    const addressHeight = Math.max(canvas.height * 0.105, lines.length * lineHeight + paddingTop + paddingBottom);
    drawInfoCard(ctx, cardX, addressTop, cardW, addressHeight, cardRadius);
    lines.forEach((line, i) => drawTextFitted(ctx, line, cardX + padding, addressTop + paddingTop + i * lineHeight, scale * BACK_TEXT.address.size, availableWidth, 500, 'left'));

    const contactTop = canvas.height * 0.635;
    const contactHeight = canvas.height * 0.075;
    drawInfoCard(ctx, cardX, contactTop, cardW, contactHeight, cardRadius);
    drawTextFitted(ctx, `Contact: ${els.contact.value.trim() || '—'}`, cardX + padding, contactTop + contactHeight / 2, scale * BACK_TEXT.contact.size, availableWidth, 700, 'left');
    const bloodTop = canvas.height * 0.735;
    const bloodHeight = canvas.height * 0.075;
    drawInfoCard(ctx, cardX, bloodTop, cardW, bloodHeight, cardRadius);
    drawTextFitted(ctx, `Blood Group: ${els.bloodGroup.value || '—'}`, cardX + padding, bloodTop + bloodHeight / 2, scale * BACK_TEXT.blood.size, availableWidth, 700, 'left');
  }
  if (typeof window !== 'undefined') window.drawBack = drawBackWithMultilineAddress;
})();
