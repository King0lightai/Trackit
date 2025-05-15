document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const productImage = document.getElementById('product-image');
  const productUrl = document.getElementById('product-url');
  const projectSelect = document.getElementById('project-select');
  const categorySelect = document.getElementById('category-select');
  const productName = document.getElementById('product-name');
  const productPrice = document.getElementById('product-price');
  const productLeadtime = document.getElementById('product-leadtime');
  const deliveryDate = document.getElementById('delivery-date');
  const productNotes = document.getElementById('product-notes');
  const saveBtn = document.getElementById('save-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const newProjectBtn = document.getElementById('new-project-btn');
  const viewProjectsBtn = document.getElementById('view-projects-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const productCapture = document.getElementById('product-capture');
  const projectList = document.getElementById('project-list');
  const projectsUl = document.getElementById('projects');
  const backToCaptureBtn = document.getElementById('back-to-capture');
  const openDashboardBtn = document.getElementById('open-dashboard');
  const newProjectModal = document.getElementById('new-project-modal');
  const newProjectName = document.getElementById('new-project-name');
  const newProjectDesc = document.getElementById('new-project-desc');
  const createProjectBtn = document.getElementById('create-project-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');

  let currentTab = null;
  let currentProducts = {};

  // Initialize extension
  init();

  function init() {
    // Get the current tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        currentTab = tabs[0];
        productUrl.textContent = currentTab.url;
        
        // Send message to content script to get product info
        chrome.tabs.sendMessage(currentTab.id, {action: "getProductInfo"}, function(response) {
          if (response && response.success) {
            handleProductInfo(response.data);
          }
        });
      }
    });

    // Load projects into dropdown
    loadProjects();

    // Set up event listeners
    setupEventListeners();
  }

  function handleProductInfo(data) {
    if (data.image) {
      productImage.src = data.image;
    }
    
    if (data.name) {
      productName.value = data.name;
    }
    
    if (data.price) {
      productPrice.value = data.price;
    }
  }

  function loadProjects() {
    chrome.storage.local.get('projects', function(result) {
      const projects = result.projects || [];
      
      // Clear dropdown
      projectSelect.innerHTML = '<option value="">Select a project</option>';
      
      // Add projects to dropdown
      projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        projectSelect.appendChild(option);
      });
      
      // Update project list
      updateProjectsList(projects);
    });
  }

  function updateProjectsList(projects) {
    projectsUl.innerHTML = '';
    
    if (projects.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No projects yet. Create one to get started.';
      projectsUl.appendChild(li);
      return;
    }
    
    projects.forEach(project => {
      const li = document.createElement('li');
      li.textContent = project.name;
      li.setAttribute('data-id', project.id);
      li.addEventListener('click', function() {
        // Navigate to project page
        chrome.tabs.create({url: `project.html?id=${project.id}`});
      });
      projectsUl.appendChild(li);
    });
  }

  function setupEventListeners() {
    // Save button
    saveBtn.addEventListener('click', function() {
      if (!projectSelect.value) {
        alert('Please select a project');
        return;
      }
      
      saveProduct();
    });

    // Cancel button
    cancelBtn.addEventListener('click', function() {
      window.close();
    });

    // New project button
    newProjectBtn.addEventListener('click', function() {
      newProjectModal.classList.remove('hidden');
    });

    // View projects button
    viewProjectsBtn.addEventListener('click', function() {
      productCapture.classList.add('hidden');
      projectList.classList.remove('hidden');
    });

    // Back to capture button
    backToCaptureBtn.addEventListener('click', function() {
      projectList.classList.add('hidden');
      productCapture.classList.remove('hidden');
    });

    // Open dashboard button
    openDashboardBtn.addEventListener('click', function() {
      chrome.tabs.create({url: 'dashboard.html'});
    });

    // Create project button
    createProjectBtn.addEventListener('click', function() {
      if (!newProjectName.value.trim()) {
        alert('Please enter a project name');
        return;
      }
      
      createNewProject();
    });

    // Close modal button
    closeModalBtn.addEventListener('click', function() {
      newProjectModal.classList.add('hidden');
      newProjectName.value = '';
      newProjectDesc.value = '';
    });

    // Settings button
    settingsBtn.addEventListener('click', function() {
      chrome.tabs.create({url: 'dashboard.html#settings-view'});
      window.close(); // Close the popup
    });
  }

  function saveProduct() {
    const projectId = projectSelect.value;
    const product = {
      id: generateId(),
      url: currentTab.url,
      image: productImage.src,
      name: productName.value,
      price: productPrice.value,
      category: categorySelect.value,
      leadTime: productLeadtime.value,
      deliveryDate: deliveryDate.value,
      notes: productNotes.value,
      dateAdded: new Date().toISOString(),
      source: {
        title: currentTab.title,
        url: currentTab.url,
        favicon: currentTab.favIconUrl
      }
    };

    // Get current products
    chrome.storage.local.get(['projectProducts'], function(result) {
      let projectProducts = result.projectProducts || {};
      
      // Initialize array for this project if it doesn't exist
      if (!projectProducts[projectId]) {
        projectProducts[projectId] = [];
      }
      
      // Add product to project
      projectProducts[projectId].push(product);
      
      // Save updated products
      chrome.storage.local.set({projectProducts: projectProducts}, function() {
        // Success message
        showSuccessMessage('Product saved to project!');
        
        // Clear form
        clearForm();
        
        // Close popup after delay
        setTimeout(() => {
          window.close();
        }, 1500);
      });
    });
  }

  function createNewProject() {
    const project = {
      id: generateId(),
      name: newProjectName.value,
      description: newProjectDesc.value,
      dateCreated: new Date().toISOString(),
      totalItems: 0
    };
    
    chrome.storage.local.get('projects', function(result) {
      const projects = result.projects || [];
      projects.push(project);
      
      chrome.storage.local.set({projects: projects}, function() {
        // Close modal
        newProjectModal.classList.add('hidden');
        
        // Reload projects
        loadProjects();
        
        // Select the new project
        setTimeout(() => {
          projectSelect.value = project.id;
        }, 100);
        
        // Clear form
        newProjectName.value = '';
        newProjectDesc.value = '';
      });
    });
  }

  function clearForm() {
    productName.value = '';
    productPrice.value = '';
    categorySelect.value = '';
    productLeadtime.value = '';
    deliveryDate.value = '';
    productNotes.value = '';
  }

  function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.textContent = message;
    successDiv.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #4CAF50;
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      z-index: 1000;
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      successDiv.remove();
    }, 3000);
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }
});
