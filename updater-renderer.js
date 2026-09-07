(() => {
  const button = document.getElementById('checkUpdates');
  const status = document.getElementById('updateStatus');
  if (!button || !status || !window.idCardDesktop) return;

  let updateReady = false;

  const setStatus = (text) => {
    status.innerHTML = `<span></span> ${text}`;
  };

  button.addEventListener('click', async () => {
    if (updateReady) {
      button.disabled = true;
      button.textContent = 'Installing…';
      try {
        await window.idCardDesktop.installUpdate();
      } catch (error) {
        button.disabled = false;
        button.textContent = 'Install Update';
        setStatus(`Update failed · ${error?.message || 'Please try again'}`);
      }
      return;
    }

    button.disabled = true;
    button.textContent = 'Checking…';
    setStatus('Checking for updates…');
    try {
      await window.idCardDesktop.checkForUpdates();
    } catch (error) {
      button.disabled = false;
      button.textContent = 'Check for Updates';
      setStatus('Update check failed');
    }
  });

  window.idCardDesktop.onUpdateStatus(async ({ status: state, version, percent, message }) => {
    if (state === 'checking') {
      setStatus('Checking for updates…');
      return;
    }
    if (state === 'up-to-date') {
      button.disabled = false;
      button.textContent = 'Check for Updates';
      setStatus(`Up to date · v${version || ''}`.trim());
      return;
    }
    if (state === 'available') {
      setStatus(`Update available · v${version}`);
      button.disabled = true;
      button.textContent = 'Downloading…';
      try {
        await window.idCardDesktop.downloadUpdate();
      } catch (error) {
        button.disabled = false;
        button.textContent = 'Check for Updates';
        setStatus(`Download failed · ${error?.message || 'Please try again'}`);
      }
      return;
    }
    if (state === 'downloading') {
      button.disabled = true;
      button.textContent = `Downloading ${Math.round(percent || 0)}%`;
      setStatus('Downloading update…');
      return;
    }
    if (state === 'downloaded') {
      updateReady = true;
      button.disabled = false;
      button.textContent = 'Install Update';
      setStatus(`Update ready · v${version}`);
      return;
    }
    if (state === 'error') {
      button.disabled = false;
      button.textContent = 'Check for Updates';
      setStatus(`Update unavailable · ${message || 'Check your connection'}`);
      return;
    }
    if (state === 'dev') {
      button.disabled = false;
      button.textContent = 'Check for Updates';
      setStatus('Install the Windows app to use updates');
    }
  });
})();
