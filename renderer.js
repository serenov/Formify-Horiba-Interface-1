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
  let currentAstmData = null;
  let currentFilePath = null;
  
  window.electronAPI.onNewAstmFile((data) => {
    const { filePath, parsedData } = data;
    currentAstmData = parsedData;
    currentFilePath = filePath;
    
    // Show the data container
    document.getElementById('astm-data-container').classList.remove('d-none');
    document.getElementById('current-file-path').textContent = filePath;
    
    // Display header info
    const headerInfo = document.getElementById('header-info');
    headerInfo.innerHTML = `
      <div>Sender: ${parsedData.header.senderId}</div>
      <div>Receiver: ${parsedData.header.receiverId}</div>
      <div>Processing ID: ${parsedData.header.processingId}</div>
    `;
    
    // Display patient info
    const patientInfo = document.getElementById('patient-info');
    patientInfo.innerHTML = '';
    
    if (parsedData.patients.length > 0) {
      const patient = parsedData.patients[0];
      patientInfo.innerHTML = `
        <div>ID: ${patient.id}</div>
        <div>Name: ${patient.name}</div>
        <div>DOB: ${patient.dateOfBirth}</div>
        <div>Sex: ${patient.sex}</div>
      `;
    } else {
      patientInfo.innerHTML = '<div class="text-muted">No patient information found</div>';
    }
    
    // Display order info
    const orderInfo = document.getElementById('order-info');
    orderInfo.innerHTML = '';
    
    if (parsedData.orders.length > 0) {
      const order = parsedData.orders[0];
      orderInfo.innerHTML = `
        <div>Order ID: ${order.id}</div>
        <div>Specimen ID: ${order.specimenId}</div>
        <div>Instrument: ${order.instrumentId}</div>
        <div>Requested: ${order.requestedDateTime}</div>
      `;
    } else {
      orderInfo.innerHTML = '<div class="text-muted">No order information found</div>';
    }
    
    // Display results
    const resultsBody = document.getElementById('results-body');
    resultsBody.innerHTML = '';
    
    if (parsedData.results.length > 0) {
      parsedData.results.forEach(result => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${result.sequenceNumber}</td>
          <td>${result.universalTestId}</td>
          <td>${result.value}</td>
          <td>${result.units}</td>
          <td>${result.referenceRanges}</td>
          <td>${result.resultStatus}</td>
        `;
        resultsBody.appendChild(row);
      });
    } else {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="6" class="text-center">No results found</td>';
      resultsBody.appendChild(row);
    }
  });
  
  window.electronAPI.onAstmParseError((data) => {
    const { filePath, error } = data;
    showAlert(`Error parsing file ${filePath}: ${error}`, 'danger');
  });
  
  // Submit button
  const submitBtn = document.getElementById('submit-btn');
  submitBtn.addEventListener('click', async () => {
    if (!currentAstmData || !currentFilePath) {
      return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    const result = await window.electronAPI.submitAstmData({
      filePath: currentFilePath,
      parsedData: currentAstmData
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
  
  // Discard button
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
  
  // Helper functions
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
    }, 5000);
  }
  
  function resetAstmDisplay() {
    // Hide the ASTM data container
    document.getElementById('astm-data-container').classList.add('d-none');
    
    // Clear current data
    currentAstmData = null;
    currentFilePath = null;
    
    // Clear displayed data
    document.getElementById('current-file-path').textContent = '';
    document.getElementById('header-info').innerHTML = '';
    document.getElementById('patient-info').innerHTML = '';
    document.getElementById('order-info').innerHTML = '';
    document.getElementById('results-body').innerHTML = '';
  }
});