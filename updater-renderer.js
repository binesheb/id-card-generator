(() => {
  const button = document.getElementById('checkUpdates');
  const status = document.getElementById('updateStatus');
  if (!button || !status || !window.idCardDesktop) return;

  let updateReady = false;
  const settingsLabel = 'Settings';
  const setStatus = text => { status.innerHTML = `<span></span> ${text}`; };
  const resetButton = () => { button.disabled = false; button.textContent = settingsLabel; };

  button.addEventListener('click', async () => {
    if (updateReady) {
      button.disabled = true;
      setStatus('Installing update…');
      try { await window.idCardDesktop.installUpdate(); }
      catch (error) { resetButton(); setStatus(`Update failed · ${error?.message || 'Please try again'}`); }
      return;
    }
    button.disabled = true;
    setStatus('Checking for updates…');
    try { await window.idCardDesktop.checkForUpdates(); }
    catch (error) { resetButton(); setStatus('Update check failed'); }
  });

  window.idCardDesktop.onUpdateStatus(async ({ status: state, version, percent, message }) => {
    if (state === 'checking') { setStatus('Checking for updates…'); return; }
    if (state === 'up-to-date') { resetButton(); setStatus(`Up to date · v${version || ''}`.trim()); return; }
    if (state === 'available') {
      setStatus(`Update available · v${version}`);
      button.disabled = true;
      try { await window.idCardDesktop.downloadUpdate(); }
      catch (error) { resetButton(); setStatus(`Download failed · ${error?.message || 'Please try again'}`); }
      return;
    }
    if (state === 'downloading') { button.disabled = true; setStatus(`Downloading update · ${Math.round(percent || 0)}%`); return; }
    if (state === 'downloaded') { updateReady = true; button.disabled = false; button.textContent = 'Update Ready'; setStatus(`Update ready · v${version}`); return; }
    if (state === 'error') { resetButton(); setStatus(`Update unavailable · ${message || 'Check your connection'}`); return; }
    if (state === 'dev') { resetButton(); setStatus('Install the Windows app to use updates'); }
  });
})();
