// renderer.js
document.addEventListener('DOMContentLoaded', async () => {
  // Navigation
  const navLinks = document.querySelectorAll('.nav-link');
  const contentSections = document.querySelectorAll('.content-section');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetSection = link.getAttribute('data-section');
      
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      contentSections.forEach(section => {
        if (section.id === `${targetSection}-section`) {
          section.classList.remove('d-none');
        } else {
          section.classList.add('d-none');
        }
      });
    });
  });
  
  // Set home as active by default
  document.querySelector('[data-section="home"]').classList.add('active');
  
  // Load saved configurations
  loadFtpConfig();
  loadBackendConfig();
  
  // FTP Configuration Form
  const ftpConfigForm = document.getElementById('ftp-config-form');
  ftpConfigForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const config = {
      path: document.getElementById('ftp-path').value,
      port: parseInt(document.getElementById('ftp-port').value, 10),
      user: document.getElementById('ftp-user').value,
      password: document.getElementById('ftp-password').value
    };
    
    const result = await window.electronAPI.saveFtpConfig(config);
    
    if (result.success) {
      showAlert('FTP configuration saved successfully!', 'success');
    } else {
      showAlert('Failed to save FTP configuration: ' + result.error, 'danger');
    }
  });
  
  // Backend Configuration Form
  const backendConfigForm = document.getElementById('backend-config-form');
  backendConfigForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const config = {
      url: document.getElementById('backend-url').value,
      username: document.getElementById('backend-username').value,
      password: document.getElementById('backend-password').value
    };
    
    const result = await window.electronAPI.saveBackendConfig(config);
    
    if (result.success) {
      showAlert('Backend configuration saved successfully!', 'success');
    } else {
      showAlert('Failed to save backend configuration: ' + result.error, 'danger');
    }
  });
  
  // Monitoring Controls
  const startMonitoringBtn = document.getElementById('start-monitoring-btn');
  const stopMonitoringBtn = document.getElementById('stop-monitoring-btn');
  const statusMessage = document.getElementById('status-message');
  
  startMonitoringBtn.addEventListener('click', async () => {
    const result = await window.electronAPI.startFileWatching();
    
    if (result.success) {
      statusMessage.className = 'alert alert-success';
      statusMessage.textContent = 'Monitoring active. Waiting for ASTM files...';
      startMonitoringBtn.disabled = true;
      stopMonitoringBtn.disabled = false;
    } else {
      showAlert('Failed to start monitoring: ' + result.error, 'danger');
    }
  });
  
  stopMonitoringBtn.addEventListener('click', async () => {
    const result = await window.electronAPI.stopFileWatching();
    
    if (result.success) {
      statusMessage.className = 'alert alert-info';
      statusMessage.textContent = 'Monitoring stopped.';
      startMonitoringBtn.disabled = false;
      stopMonitoringBtn.disabled = true;
    }
  });
  
  // Initially disable stop button
  stopMonitoringBtn.disabled = true;
  
  // Handle new ASTM files
  let currentSampleId = null;
  let currentResults = null;
  let currentFilePath = null;
  
  window.electronAPI.onNewAstmFile((data) => {
    try {

    const { parsedData: { results, sampleId }, filePath } = data;

    currentSampleId = sampleId;
    currentResults = results;
    currentFilePath = filePath;

    document.getElementById("astm-data-container").classList.remove("d-none");
    document.getElementById("current-file-path").textContent = filePath;

    const resultHeader = document.getElementById("result-header");
    const resultBody = document.getElementById("result-data");

    resultHeader.innerHTML = "";
    resultBody.innerHTML = "";

    Object.entries(results).forEach(([tableHeading, value]) => {
      const columnHeaderDom = document.createElement("th");

      columnHeaderDom.innerHTML = tableHeading;

      resultHeader.appendChild(columnHeaderDom);

      const columnValueDom = document.createElement("td");

      columnValueDom.innerHTML = value;

      resultBody.appendChild(columnValueDom);
    });
  }
  catch (error) { console.log(error) }
  });
  
  window.electronAPI.onAstmParseError((data) => {
    const { filePath, error } = data;
    showAlert(`Error parsing file ${filePath}: ${error}`, 'danger');
  });
  
  const submitBtn = document.getElementById('submit-btn');

  submitBtn.addEventListener('click', async () => {
    if (!currentSampleId || !currentResults || !currentFilePath) {
      return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    const result = await window.electronAPI.submitAstmData({
      filePath: currentFilePath,
      sampleId: currentSampleId,
      parsedData: currentResults, 
    });
    
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit to Backend';
    
    if (result.success) {
      showAlert('Data successfully submitted and file deleted', 'success');
      resetAstmDisplay();
    } else {
      showAlert(`Failed to submit data: ${result.error}`, 'danger');
    }
  });
  
  const discardBtn = document.getElementById('discard-btn');

  discardBtn.addEventListener('click', async () => {
    if (!currentFilePath) {
      return;
    }
    
    if (confirm('Are you sure you want to discard this file?')) {
      const result = await window.electronAPI.discardAstmFile(currentFilePath);
      
      if (result.success) {
        showAlert('File discarded successfully', 'info');
        resetAstmDisplay();
      } else {
        showAlert(`Failed to discard file: ${result.error}`, 'danger');
      }
    }
  });
  
  async function loadFtpConfig() {
    const config = await window.electronAPI.getFtpConfig();
    document.getElementById('ftp-path').value = config.path || '';
    document.getElementById('ftp-port').value = config.port || 21;
    document.getElementById('ftp-user').value = config.user || '';
    document.getElementById('ftp-password').value = config.password || '';
  }
  
  async function loadBackendConfig() {
    const config = await window.electronAPI.getBackendConfig();
    document.getElementById('backend-url').value = config.url || '';
    document.getElementById('backend-username').value = config.username || '';
    document.getElementById('backend-password').value = config.password || '';
  }
  
  function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      alertDiv.classList.remove('show');
      setTimeout(() => alertDiv.remove(), 300);
    }, 2000);
  }
  
  function resetAstmDisplay() {
    document.getElementById('astm-data-container').classList.add('d-none');
    
    currentFilePath = null;
    currentResults = null;
    currentSampleId = null;
    
    document.getElementById("result-header").innerHTML = '';
    document.getElementById("result-data").innerHTML = '';
    document.getElementById('current-file-path').textContent = '';
  }
});