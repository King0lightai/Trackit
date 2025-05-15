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
  const newProjectModal = document.getElementById('new-project-modal');
  const newProjectName = document.getElementById('new-project-name');
  const newProjectDesc = document.getElementById('new-project-desc');
  const createProjectBtn = document.getElementById('create-project-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');

  // State
  let tempProduct = null;
  let sourceTab = null;
  let productInfo = null;

  // Initialize
  init();

  function init() {
    // Get temporary product data from storage
    chrome.storage.local.get('tempProduct', function(result) {
      if (result.tempProduct) {
        tempProduct = result.tempProduct;
        
        // Update UI with product info
        updateProductInfo();
        
        // Get source tab info
        if (tempProduct.tabId) {
          chrome.tabs.get(tempProduct.tabId, function(tab) {
            sourceTab = tab;
            productUrl.textContent = tab.url;
            
            // Extract product info from page
            chrome.tabs.sendMessage(tab.id, {action: "getProductInfo"}, function(response) {
              if (response && response.success) {
                productInfo = response.data;
                populateProductInfo();
              }
            });
          });
        } else if (tempProduct.url) {
          productUrl.textContent = tempProduct.url;
        }
      }
    });
    
    // Load projects
    loadProjects();
    
    // Set up event listeners
    setupEventListeners();
  }
  
  function updateProductInfo() {
    // Update product image if available
    if (tempProduct.image) {
      productImage.src = tempProduct.image;
    }
  }
  
  function populateProductInfo() {
    // Fill in form with extracted product info
    if (productInfo) {
      if (productInfo.name) {
        productName.value = productInfo.name;
      }
      
      if (productInfo.price) {
        productPrice.value = productInfo.price;
      }
      
      if (productInfo.image && !tempProduct.image) {
        productImage.src = productInfo.image;
      }
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
      
      // Auto-select default project if set
      chrome.storage.local.get('settings', function(result) {
        const settings = result.settings || {};
        if (settings.defaultProjectId) {
          projectSelect.value = settings.defaultProjectId;
        }
      });
    });
  }
  
  function setupEventListeners() {
    // Save button
    saveBtn.addEventListener('click', saveProduct);
    
    // Cancel button
    cancelBtn.addEventListener('click', function() {
      window.close();
    });
    
    // New project button
    newProjectBtn.addEventListener('click', function() {
      newProjectModal.classList.remove('hidden');
      newProjectName.focus();
    });
    
    // Create project button
    createProjectBtn.addEventListener('click', createNewProject);
    
    // Close modal button
    closeModalBtn.addEventListener('click', function() {
      newProjectModal.classList.add('hidden');
    });
  }
  
  function saveProduct() {
    // Validate required fields
    if (!projectSelect.value) {
      alert('Please select a project');
      return;
    }
    
    if (!productName.value) {
      alert('Please enter a product name');
      return;
    }
    
    // Get current date/time for ID and tracking
    const now = new Date();
    
    // Create product object
    const product = {
      id: generateId(),
      name: productName.value,
      url: productUrl.textContent,
      image: productImage.src !== 'images/placeholder.png' ? productImage.src : null,
      price: productPrice.value,
      category: categorySelect.value,
      leadTime: productLeadtime.value,
      deliveryDate: deliveryDate.value,
      notes: productNotes.value,
      dateAdded: now.toISOString(),
      source: sourceTab ? {
        title: sourceTab.title,
        url: sourceTab.url,
        favicon: sourceTab.favIconUrl
      } : null
    };
    
    // Get project ID
    const projectId = projectSelect.value;
    
    // Save product to storage
    chrome.storage.local.get('projectProducts', function(result) {
      let projectProducts = result.projectProducts || {};
      
      // Initialize array for this project if it doesn't exist
      if (!projectProducts[projectId]) {
        projectProducts[projectId] = [];
      }
      
      // Add product to project
      projectProducts[projectId].push(product);
      
      // Show loading spinner
      showLoader();
      
      // Save updated products
      chrome.storage.local.set({projectProducts: projectProducts}, function() {
        // Clear temporary product data
        chrome.storage.local.remove('tempProduct');
        
        // Hide loader
        hideLoader();
        
        // Show success message
        showSuccessMessage('Product saved successfully!');
        
        // Close window after a delay
        setTimeout(function() {
          window.close();
        }, 2000);
      });
    });
  }
  
  function createNewProject() {
    const projectName = newProjectName.value.trim();
    
    if (!projectName) {
      alert('Please enter a project name');
      return;
    }
    
    const project = {
      id: generateId(),
      name: projectName,
      description: newProjectDesc.value,
      dateCreated: new Date().toISOString()
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
  
  function showLoader() {
    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loader);
  }
  
  function hideLoader() {
    const loader = document.querySelector('.loader');
    if (loader) {
      loader.remove();
    }
  }
  
  function showSuccessMessage(message) {
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.textContent = message;
    document.body.appendChild(successMessage);
    
    setTimeout(function() {
      successMessage.remove();
    }, 3000);
  }
  
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }
});