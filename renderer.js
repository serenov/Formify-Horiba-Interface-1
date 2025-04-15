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
  // const startMonitoringBtn = document.getElementById('start-monitoring-btn');
  // const stopMonitoringBtn = document.getElementById('stop-monitoring-btn');
  // const statusMessage = document.getElementById('status-message');
  
  await window.electronAPI.startFileWatching();

  // startMonitoringBtn.addEventListener('click', async () => {
  //   if (result.success) {
  //     statusMessage.className = 'alert alert-success';
  //     statusMessage.textContent = 'Monitoring active. Waiting for ASTM files...';
  //     startMonitoringBtn.disabled = true;
  //     stopMonitoringBtn.disabled = false;
  //   } else {
  //     showAlert('Failed to start monitoring: ' + result.error, 'danger');
  //   }
  // });
  
  // stopMonitoringBtn.addEventListener('click', async () => {
  //   const result = await window.electronAPI.stopFileWatching();
    
  //   if (result.success) {
  //     statusMessage.className = 'alert alert-info';
  //     statusMessage.textContent = 'Monitoring stopped.';
  //     startMonitoringBtn.disabled = false;
  //     stopMonitoringBtn.disabled = true;
  //   }
  // });
  
  // // Initially disable stop button
  // stopMonitoringBtn.disabled = true;
  
  // Handle new ASTM files
  const horibaResultsDictionary = {};
  
  let rowCount = 0;


  const resultHeader = document.getElementById("result-header");

  const checkboxHeader = document.createElement("th");
  checkboxHeader.innerHTML = '<input type="checkbox" id="select-all-checkbox" />';
  resultHeader.appendChild(checkboxHeader);


  [
    "ID",
    "TIMESTAMP",
    "MPV",
    "PDW",
    "PLT",
    "THT",
    "HCT",
    "HGB",
    "MCH",
    "MCHC",
    "MCV",
    "RBC",
    "RDW",
    "RDW-SD",
    "GRA#",
    "GRA%",
    "LYM#",
    "LYM%",
    "MON#",
    "MON%",
    "WBC",
  ].map((columnName) => {
    const columnHeaderDom = document.createElement("th");
    columnHeaderDom.innerText = columnName;
    resultHeader.appendChild(columnHeaderDom);
  });
  
  window.electronAPI.onNewAstmFile((data) => {
    try {
      const {
        parsedData: { results, sampleId },
        filePath,
      } = data;

      horibaResultsDictionary[rowCount] = {
        sampleId,
        results,
        filePath,
      };

      document.getElementById("astm-data-container").classList.remove("d-none");
      document.getElementById("current-file-path").textContent = filePath;

      const resultBody = document.getElementById("results-body");

      const resultRow = document.createElement("tr");
      resultRow.dataset.index = rowCount;

      const checkboxCell = document.createElement("td");

      checkboxCell.innerHTML = `<input type="checkbox" class="row-checkbox" data-index="${rowCount++}" />`;

      resultRow.appendChild(checkboxCell);

      Object.entries(results).forEach(([, value]) => {
        const columnValueDom = document.createElement("td");

        columnValueDom.innerHTML = value;

        resultRow.appendChild(columnValueDom);
      });

      resultBody.appendChild(resultRow);
    } catch (error) {
      console.log(error);
    }
  });

  const selectAllCheckbox = document.getElementById("select-all-checkbox");

  selectAllCheckbox.addEventListener("change", function() {
    const isChecked = this.checked;
    document.querySelectorAll(".row-checkbox").forEach(checkbox => {
      checkbox.checked = isChecked;
    });
  })
  
  window.electronAPI.onAstmParseError((data) => {
    const { filePath, error } = data;
    showAlert(`Error parsing file ${filePath}: ${error}`, 'danger');
  });
  
  const submitBtn = document.getElementById('submit-btn');

  submitBtn.addEventListener('click', async () => {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit to Backend';
 
    const selectedCheckboxes = document.querySelectorAll(".row-checkbox:checked");
    
    if (selectedCheckboxes.length === 0) {
      showAlert("Warning", "Please select at least one row to submit", "warning");
      return;
    }

    const resultsPromises = Array.from(selectedCheckboxes).map(async (checkbox) => {
      const index = parseInt(checkbox.dataset.index);

        if (horibaResultsDictionary[index]) {
            const { sampleId, results, filePath } = horibaResultsDictionary[index];

            const result = await window.electronAPI.submitAstmData({
              filePath,
              sampleId,
              parsedData: results,
            });

            if (result.success) {
              delete horibaResultsDictionary[index];
              checkbox.closest("tr")?.remove();
            }

            return { success: result.success, sampleId, error: result.error };
        }

      return { success: false, sampleId: "NA", error: "No data found" };
    });
   
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    const results = await Promise.all(resultsPromises);

    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit to Backend';

    selectAllCheckbox.checked = false;


    const failedRows = results.filter((r) => !r.success)

    if (failedRows?.length > 0) {
      showAlert(`Failed to submit data: ${failedRows.map(failedRow => `${failedRow.sampleId}: ${failedRow.error}`).join("\n")}`, 'danger');
    } else {
      showAlert("Data successfully submitted and file deleted", "success");
    }
  });
  
  const discardBtn = document.getElementById('discard-btn');

  discardBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to discard this file?')) {

      const selectedCheckboxes = document.querySelectorAll(
        ".row-checkbox:checked"
      );

      const resultsPromises = Array.from(selectedCheckboxes).map(
        async (checkbox) => {
          const index = parseInt(checkbox.dataset.index);

          if (horibaResultsDictionary[index]) {
            const { sampleId, _, filePath } = horibaResultsDictionary[index];

            const result = await window.electronAPI.discardAstmFile(filePath);

            if (result.success) {
              delete horibaResultsDictionary[index];
              checkbox.closest("tr")?.remove();
            }

            return { success: result.success, sampleId, error: result.error };
          }

          return { success: false, sampleId: "NA", error: "No data found" };
        }
      );

      discardBtn.disabled = true;
      discardBtn.textContent = "Discarding...";

      const results = await Promise.all(resultsPromises);

      selectAllCheckbox.checked = false;
      discardBtn.disabled = false;
      discardBtn.textContent = "Discard";

      const failedRows = results.filter((r) => !r.success);

      if (failedRows?.length > 0) {
        showAlert(
          `Failed to discard data: ${failedRows
            .map((failedRow) => `${failedRow.sampleId}: ${failedRow.error}`)
            .join("\n")}`,
          "danger"
        );
      } else {
        showAlert("Data successfully discarded", "success");
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
   
    document.getElementById("result-header").innerHTML = '';
    document.getElementById("result-data").innerHTML = '';
    document.getElementById('current-file-path').textContent = '';
  }
});