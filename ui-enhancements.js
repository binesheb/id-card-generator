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
