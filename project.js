// Project page JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // DOM elements - Main sections
  const projectNameEl = document.getElementById('project-name');
  const projectDescriptionEl = document.getElementById('project-description');
  const totalProductsEl = document.getElementById('total-products');
  const upcomingDeliveriesEl = document.getElementById('upcoming-deliveries');
  const projectCreatedEl = document.getElementById('project-created');
  const productsGrid = document.getElementById('products-grid');
  const projectTimeline = document.getElementById('project-timeline');
  const categoriesGrid = document.getElementById('categories-grid');
  const projectNotesText = document.getElementById('project-notes-text');
  const productNotesList = document.getElementById('product-notes-list');
  
  // Tab elements
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Filter and sort elements
  const productSearch = document.getElementById('product-search');
  const categoryFilter = document.getElementById('category-filter');
  const sortOptions = document.getElementById('sort-options');
  
  // Action buttons
  const addProductBtn = document.getElementById('add-product-btn');
  const shareProjectBtn = document.getElementById('share-project-btn');
  const projectSettingsBtn = document.getElementById('project-settings-btn');
  const saveNotesBtn = document.getElementById('save-notes-btn');
  const exportProjectBtn = document.getElementById('export-project-btn');
  
  // Modal elements
  const productDetailModal = document.getElementById('product-detail-modal');
  const editProductModal = document.getElementById('edit-product-modal');
  const addProductModal = document.getElementById('add-product-modal');
  const projectSettingsModal = document.getElementById('project-settings-modal');
  const shareProjectModal = document.getElementById('share-project-modal');
  
  // Modal detail elements
  const modalProductName = document.getElementById('modal-product-name');
  const modalProductImage = document.getElementById('modal-product-image');
  const modalProductCategory = document.getElementById('modal-product-category');
  const modalProductPrice = document.getElementById('modal-product-price');
  const modalProductLeadtime = document.getElementById('modal-product-leadtime');
  const modalProductDelivery = document.getElementById('modal-product-delivery');
  const modalProductDateadded = document.getElementById('modal-product-dateadded');
  const modalProductSource = document.getElementById('modal-product-source');
  const modalProductNotes = document.getElementById('modal-product-notes');
  const openProductWebsiteBtn = document.getElementById('open-product-website-btn');
  
  // Product form elements
  const editProductId = document.getElementById('edit-product-id');
  const editProductName = document.getElementById('edit-product-name');
  const editCategorySelect = document.getElementById('edit-category-select');
  const editProductPrice = document.getElementById('edit-product-price');
  const editProductLeadtime = document.getElementById('edit-product-leadtime');
  const editDeliveryDate = document.getElementById('edit-delivery-date');
  const editProductNotes = document.getElementById('edit-product-notes');
  
  // Add product form elements
  const addProductName = document.getElementById('add-product-name');
  const addProductUrl = document.getElementById('add-product-url');
  const addProductImage = document.getElementById('add-product-image');
  const previewImage = document.getElementById('preview-image');
  const selectImageBtn = document.getElementById('select-image-btn');
  const pasteImageBtn = document.getElementById('paste-image-btn');
  const addCategorySelect = document.getElementById('add-category-select');
  const addProductPrice = document.getElementById('add-product-price');
  const addProductLeadtime = document.getElementById('add-product-leadtime');
  const addDeliveryDate = document.getElementById('add-delivery-date');
  const addProductNotes = document.getElementById('add-product-notes');
  
  // Project settings form elements
  const editProjectName = document.getElementById('edit-project-name');
  const editProjectDesc = document.getElementById('edit-project-desc');
  
  // Modal action buttons
  const closeModalBtns = document.querySelectorAll('.close-modal-btn, .cancel-modal-btn');
  const editProductBtn = document.getElementById('edit-product-btn');
  const deleteProductBtn = document.getElementById('delete-product-btn');
  const saveEditBtn = document.getElementById('save-edit-btn');
  const saveAddBtn = document.getElementById('save-add-btn');
  const saveProjectSettingsBtn = document.getElementById('save-project-settings-btn');
  const deleteProjectBtn = document.getElementById('delete-project-btn');
  const exportPdfBtn = document.getElementById('export-pdf-btn');
  const exportJsonBtn = document.getElementById('export-json-btn');
  const upgradeBtn = document.getElementById('upgrade-btn');
  
  // State
  let projectId = '';
  let project = null;
  let products = [];
  let selectedProductId = null;
  let categories = {};
  
  // Initialize
  init();
  
  function init() {
    // Get project ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    projectId = urlParams.get('id');
    
    if (!projectId) {
      // No project ID provided, redirect to dashboard
      window.location.href = 'dashboard.html';
      return;
    }
    
    // Check if there's a specific product to highlight
    const highlightProductId = urlParams.get('product');
    
    // Load project data
    loadProjectData(highlightProductId);
    
    // Set up event listeners
    setupEventListeners();
  }
  
  function loadProjectData(highlightProductId = null) {
    chrome.storage.local.get(['projects', 'projectProducts'], function(result) {
      const projects = result.projects || [];
      const projectProducts = result.projectProducts || {};
      
      // Find the project
      project = projects.find(p => p.id === projectId);
      
      if (!project) {
        // Project not found, redirect to dashboard
        alert('Project not found.');
        window.location.href = 'dashboard.html';
        return;
      }
      
      // Get products for this project
      products = projectProducts[projectId] || [];
      
      // Update UI with project data
      updateProjectInfo();
      updateProductsGrid();
      updateTimeline();
      updateCategories();
      updateNotes();
      
      // If a specific product was requested, show it
      if (highlightProductId) {
        const product = products.find(p => p.id === highlightProductId);
        if (product) {
          showProductDetails(product);
        }
      }
    });
  }
  
  function setupEventListeners() {
    // Tab switching
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Update active tab button
        tabButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        // Show corresponding tab content
        const tabId = this.id.replace('tab-', 'tab-content-');
        tabContents.forEach(content => {
          content.classList.remove('active');
          if (content.id === tabId) {
            content.classList.add('active');
          }
        });
      });
    });
    
    // Filters and sorting
    productSearch.addEventListener('input', updateProductsGrid);
    categoryFilter.addEventListener('change', updateProductsGrid);
    sortOptions.addEventListener('change', updateProductsGrid);
    
    // Action buttons
    addProductBtn.addEventListener('click', showAddProductModal);
    shareProjectBtn.addEventListener('click', showShareProjectModal);
    projectSettingsBtn.addEventListener('click', showProjectSettingsModal);
    saveNotesBtn.addEventListener('click', saveProjectNotes);
    exportProjectBtn.addEventListener('click', exportProject);
    
    // Modal close buttons
    closeModalBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        productDetailModal.classList.add('hidden');
        editProductModal.classList.add('hidden');
        addProductModal.classList.add('hidden');
        projectSettingsModal.classList.add('hidden');
        shareProjectModal.classList.add('hidden');
      });
    });
    
    // Product detail actions
    editProductBtn.addEventListener('click', function() {
      const product = products.find(p => p.id === selectedProductId);
      if (product) {
        showEditProductModal(product);
      }
    });
    
    deleteProductBtn.addEventListener('click', function() {
      const product = products.find(p => p.id === selectedProductId);
      if (product) {
        confirmDeleteProduct(product);
      }
    });
    
    openProductWebsiteBtn.addEventListener('click', function() {
      const product = products.find(p => p.id === selectedProductId);
      if (product && product.url) {
        chrome.tabs.create({ url: product.url });
      }
    });
    
    // Edit product form
    saveEditBtn.addEventListener('click', saveProductChanges);
    
    // Add product form
    saveAddBtn.addEventListener('click', addNewProduct);
    selectImageBtn.addEventListener('click', function() {
      addProductImage.click();
    });
    
    addProductImage.addEventListener('change', function(e) {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
          previewImage.src = e.target.result;
        };
        
        reader.readAsDataURL(e.target.files[0]);
      }
    });
    
    pasteImageBtn.addEventListener('click', function() {
      const imageUrl = prompt('Enter image URL:');
      if (imageUrl) {
        previewImage.src = imageUrl;
      }
    });
    
    // Project settings form
    saveProjectSettingsBtn.addEventListener('click', saveProjectSettings);
    deleteProjectBtn.addEventListener('click', confirmDeleteProject);
    
    // Share project actions
    exportPdfBtn.addEventListener('click', exportProjectAsPdf);
    exportJsonBtn.addEventListener('click', exportProjectAsJson);
    upgradeBtn.addEventListener('click', openUpgradeInfo);
  }
  
  function updateProjectInfo() {
    // Set project name and description
    projectNameEl.textContent = project.name;
    projectDescriptionEl.textContent = project.description || 'No description provided.';
    
    // Update stats
    totalProductsEl.textContent = products.length;
    
    // Count upcoming deliveries
    const today = new Date();
    const upcomingDeliveries = products.filter(product => {
      if (!product.deliveryDate) return false;
      
      const deliveryDate = new Date(product.deliveryDate);
      return deliveryDate >= today;
    }).length;
    
    upcomingDeliveriesEl.textContent = upcomingDeliveries;
    
    // Format creation date
    const createdDate = new Date(project.dateCreated);
    projectCreatedEl.textContent = createdDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    // Set page title
    document.title = `${project.name} - Titus Project Tracker`;
  }
  
  function updateProductsGrid() {
    productsGrid.innerHTML = '';
    
    // Apply filters
    const searchTerm = productSearch.value.toLowerCase();
    const categoryValue = categoryFilter.value;
    
    let filteredProducts = products.filter(product => {
      // Search filter
      const nameMatch = product.name && product.name.toLowerCase().includes(searchTerm);
      const notesMatch = product.notes && product.notes.toLowerCase().includes(searchTerm);
      const categoryMatch = product.category && product.category.toLowerCase().includes(searchTerm);
      
      const matchesSearch = nameMatch || notesMatch || categoryMatch;
      
      // Category filter
      const matchesCategory = categoryValue === 'all' || product.category === categoryValue;
      
      return matchesSearch && matchesCategory;
    });
    
    // Apply sorting
    const sortOption = sortOptions.value;
    
    switch (sortOption) {
      case 'date-added-desc':
        filteredProducts.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
        break;
      case 'date-added-asc':
        filteredProducts.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
        break;
      case 'name-asc':
        filteredProducts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name-desc':
        filteredProducts.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      case 'price-asc':
        filteredProducts.sort((a, b) => {
          const priceA = parseFloat(a.price?.replace(/[^0-9.]/g, '') || 0);
          const priceB = parseFloat(b.price?.replace(/[^0-9.]/g, '') || 0);
          return priceA - priceB;
        });
        break;
      case 'price-desc':
        filteredProducts.sort((a, b) => {
          const priceA = parseFloat(a.price?.replace(/[^0-9.]/g, '') || 0);
          const priceB = parseFloat(b.price?.replace(/[^0-9.]/g, '') || 0);
          return priceB - priceA;
        });
        break;
      case 'delivery-asc':
        filteredProducts.sort((a, b) => {
          if (!a.deliveryDate) return 1;
          if (!b.deliveryDate) return -1;
          return new Date(a.deliveryDate) - new Date(b.deliveryDate);
        });
        break;
    }
    
    // Show empty state if no products
    if (filteredProducts.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      
      if (products.length === 0) {
        emptyState.innerHTML = `
          <p>No products added to this project yet.</p>
          <button id="empty-add-btn" class="primary-btn">Add Your First Product</button>
        `;
        
        productsGrid.appendChild(emptyState);
        
        document.getElementById('empty-add-btn').addEventListener('click', showAddProductModal);
      } else {
        emptyState.innerHTML = `
          <p>No products match your search and filters.</p>
          <button id="clear-filters-btn" class="secondary-btn">Clear Filters</button>
        `;
        
        productsGrid.appendChild(emptyState);
        
        document.getElementById('clear-filters-btn').addEventListener('click', function() {
          productSearch.value = '';
          categoryFilter.value = 'all';
          sortOptions.value = 'date-added-desc';
          updateProductsGrid();
        });
      }
      
      return;
    }
    
    // Create product cards
    filteredProducts.forEach(product => {
      const productCard = document.createElement('div');
      productCard.className = 'product-card';
      productCard.setAttribute('data-id', product.id);
      
      // Calculate days until delivery if available
      let deliveryInfo = '';
      if (product.deliveryDate) {
        const deliveryDate = new Date(product.deliveryDate);
        const today = new Date();
        const daysUntil = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));
        
        let deliveryText = '';
        if (daysUntil < 0) {
          deliveryText = 'Delivered';
        } else if (daysUntil === 0) {
          deliveryText = 'Today';
        } else if (daysUntil === 1) {
          deliveryText = 'Tomorrow';
        } else {
          deliveryText = `${daysUntil} days`;
        }
        
        const formattedDate = deliveryDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
        
        deliveryInfo = `${formattedDate} (${deliveryText})`;
      } else {
        deliveryInfo = 'Not set';
      }
      
      productCard.innerHTML = `
        <div class="product-image">
          <img src="${product.image || 'images/placeholder.png'}" alt="${product.name || 'Product image'}">
          ${product.category ? `<span class="product-category category-${product.category}">${product.category}</span>` : ''}
        </div>
        <div class="product-info">
          <h3 class="product-name">${product.name || 'Unnamed Product'}</h3>
          ${product.price ? `<div class="product-price">${product.price}</div>` : ''}
          <div class="product-details">
            <div class="detail-item">
              <span class="detail-label">Lead Time:</span>
              <span>${product.leadTime ? `${product.leadTime} days` : 'Not set'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Delivery:</span>
              <span>${deliveryInfo}</span>
            </div>
          </div>
          <div class="product-actions">
            <button class="view-details-btn" data-id="${product.id}">View Details</button>
            <button class="view-website-btn" data-id="${product.id}">Visit Website</button>
          </div>
        </div>
      `;
      
      productsGrid.appendChild(productCard);
      
      // Add event listeners to the buttons
      productCard.querySelector('.view-details-btn').addEventListener('click', function() {
        const productId = this.getAttribute('data-id');
        const product = products.find(p => p.id === productId);
        if (product) {
          showProductDetails(product);
        }
      });
      
      productCard.querySelector('.view-website-btn').addEventListener('click', function() {
        const productId = this.getAttribute('data-id');
        const product = products.find(p => p.id === productId);
        if (product && product.url) {
          chrome.tabs.create({ url: product.url });
        } else {
          alert('No website URL available for this product');
        }
      });
      
      // Make the whole card clickable to view details
      productCard.addEventListener('click', function(e) {
        // Only trigger if the click wasn't on a button
        if (!e.target.closest('button')) {
          const productId = this.getAttribute('data-id');
          const product = products.find(p => p.id === productId);
          if (product) {
            showProductDetails(product);
          }
        }
      });
    });
  }
  
  function updateTimeline() {
    projectTimeline.innerHTML = '';
    
    // Filter products with delivery dates
    const productsWithDates = products.filter(product => product.deliveryDate);
    
    if (productsWithDates.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = '<p>No products with delivery dates to display.</p>';
      projectTimeline.appendChild(emptyState);
      return;
    }
    
    // Determine date range (start from the earliest delivery date, extend to latest + 1 month)
    const today = new Date();
    let earliestDate = today;
    let latestDate = new Date(today);
    latestDate.setMonth(today.getMonth() + 3); // Default to 3 months ahead
    
    // Find actual earliest and latest dates
    productsWithDates.forEach(product => {
      const deliveryDate = new Date(product.deliveryDate);
      if (deliveryDate < earliestDate) {
        earliestDate = new Date(deliveryDate);
      }
      if (deliveryDate > latestDate) {
        latestDate = new Date(deliveryDate);
        latestDate.setMonth(latestDate.getMonth() + 1); // Add a month buffer
      }
    });
    
    // Ensure earliest date includes the current month
    if (earliestDate > today) {
      earliestDate = new Date(today);
    }
    
    // Set to the beginning of the month
    earliestDate.setDate(1);
    latestDate.setDate(1);
    
    // Create timeline header with month labels
    const timelineHeader = document.createElement('div');
    timelineHeader.className = 'timeline-header';
    
    // Create month labels
    const months = [];
    const currentMonth = new Date(earliestDate);
    
    while (currentMonth <= latestDate) {
      months.push(new Date(currentMonth));
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
    
    months.forEach(month => {
      const monthLabel = document.createElement('div');
      monthLabel.className = 'timeline-month';
      monthLabel.textContent = month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      timelineHeader.appendChild(monthLabel);
    });
    
    projectTimeline.appendChild(timelineHeader);
    
    // Create timeline content
    const timelineContent = document.createElement('div');
    timelineContent.className = 'timeline-content';
    timelineContent.style.height = '300px';
    timelineContent.style.position = 'relative';
    
    // Calculate total duration in days
    const totalDays = Math.floor((latestDate - earliestDate) / (1000 * 60 * 60 * 24));
    
    // Create timeline events
    productsWithDates.forEach((product, index) => {
      const deliveryDate = new Date(product.deliveryDate);
      const daysSinceStart = Math.floor((deliveryDate - earliestDate) / (1000 * 60 * 60 * 24));
      const positionPercent = (daysSinceStart / totalDays) * 100;
      
      const timelineEvent = document.createElement('div');
      timelineEvent.className = `timeline-event ${product.category ? 'category-' + product.category : ''}`;
      timelineEvent.style.left = `${positionPercent}%`;
      timelineEvent.style.top = `${(index % 6) * 50}px`; // Stagger vertically
      
      const formattedDate = deliveryDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      
      timelineEvent.innerHTML = `
        <div class="timeline-event-title">${product.name || 'Unnamed Product'}</div>
        <div class="timeline-event-date">${formattedDate}</div>
      `;
      
      timelineEvent.addEventListener('click', function() {
        showProductDetails(product);
      });
      
      timelineContent.appendChild(timelineEvent);
    });
    
    projectTimeline.appendChild(timelineContent);
  }
  
  function updateCategories() {
    categoriesGrid.innerHTML = '';
    
    // Group products by category
    categories = {};
    
    products.forEach(product => {
      const category = product.category || 'uncategorized';
      
      if (!categories[category]) {
        categories[category] = [];
      }
      
      categories[category].push(product);
    });
    
    // If no products or categories
    if (Object.keys(categories).length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = '<p>No products or categories to display.</p>';
      categoriesGrid.appendChild(emptyState);
      return;
    }
    
    // Create category cards
    Object.keys(categories).sort().forEach(category => {
      const categoryProducts = categories[category];
      
      const categoryCard = document.createElement('div');
      categoryCard.className = `category-card category-${category}`;
      
      // Count products with delivery dates
      const withDeliveryDates = categoryProducts.filter(p => p.deliveryDate).length;
      
      // Calculate average lead time
      const leadTimes = categoryProducts.filter(p => p.leadTime).map(p => parseInt(p.leadTime));
      const avgLeadTime = leadTimes.length > 0 
        ? Math.round(leadTimes.reduce((sum, time) => sum + time, 0) / leadTimes.length) 
        : 0;
      
      categoryCard.innerHTML = `
        <div class="category-header">
          <h3>${category === 'uncategorized' ? 'Uncategorized' : category}</h3>
        </div>
        <div class="category-stats">
          <div class="category-stat">
            <span class="category-stat-value">${categoryProducts.length}</span>
            <span class="category-stat-label">Products</span>
          </div>
          <div class="category-stat">
            <span class="category-stat-value">${withDeliveryDates}</span>
            <span class="category-stat-label">With Delivery</span>
          </div>
          <div class="category-stat">
            <span class="category-stat-value">${avgLeadTime > 0 ? `${avgLeadTime} days` : '-'}</span>
            <span class="category-stat-label">Avg Lead Time</span>
          </div>
        </div>
        <div class="category-products">
          ${categoryProducts.slice(0, 5).map(product => `
            <div class="category-product-item" data-id="${product.id}">
              <div class="category-product-thumbnail">
                <img src="${product.image || 'images/placeholder.png'}" alt="${product.name || 'Product'}">
              </div>
              <div class="category-product-info">
                <div class="category-product-name">${product.name || 'Unnamed Product'}</div>
                ${product.price ? `<div class="category-product-price">${product.price}</div>` : ''}
              </div>
            </div>
          `).join('')}
          ${categoryProducts.length > 5 ? `
            <div class="category-view-all">
              <button class="view-all-btn" data-category="${category}">View all ${categoryProducts.length} products</button>
            </div>
          ` : ''}
        </div>
      `;
      
      categoriesGrid.appendChild(categoryCard);
      
      // Add event listeners to product items
      const productItems = categoryCard.querySelectorAll('.category-product-item');
      productItems.forEach(item => {
        item.addEventListener('click', function() {
          const productId = this.getAttribute('data-id');
          const product = products.find(p => p.id === productId);
          if (product) {
            showProductDetails(product);
          }
        });
      });
      
      // Add event listener to "View all" button if it exists
      const viewAllBtn = categoryCard.querySelector('.view-all-btn');
      if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function() {
          const category = this.getAttribute('data-category');
          
          // Switch to the "All Products" tab
          document.getElementById('tab-all').click();
          
          // Apply category filter
          categoryFilter.value = category;
          productSearch.value = '';
          
          // Update products grid
          updateProductsGrid();
        });
      }
    });
  }
  
  function updateNotes() {
    // Project notes
    projectNotesText.value = project.notes || '';
    
    // Product notes
    productNotesList.innerHTML = '';
    
    // Filter products with notes
    const productsWithNotes = products.filter(product => product.notes && product.notes.trim() !== '');
    
    if (productsWithNotes.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = '<p>No product notes to display.</p>';
      productNotesList.appendChild(emptyState);
      return;
    }
    
    // Create note items
    productsWithNotes.forEach(product => {
      const noteItem = document.createElement('div');
      noteItem.className = 'product-note-item';
      noteItem.setAttribute('data-id', product.id);
      
      noteItem.innerHTML = `
        <div class="product-note-header">
          <div class="product-note-name">${product.name || 'Unnamed Product'}</div>
          <button class="view-product-btn" data-id="${product.id}">View Product</button>
        </div>
        <div class="product-note-content">${product.notes}</div>
      `;
      
      productNotesList.appendChild(noteItem);
      
      // Add event listener to view button
      noteItem.querySelector('.view-product-btn').addEventListener('click', function() {
        const productId = this.getAttribute('data-id');
        const product = products.find(p => p.id === productId);
        if (product) {
          showProductDetails(product);
        }
      });
    });
  }
  
  function showProductDetails(product) {
    // Store the selected product ID
    selectedProductId = product.id;
    
    // Set product details in the modal
    modalProductName.textContent = product.name || 'Unnamed Product';
    modalProductImage.src = product.image || 'images/placeholder.png';
    modalProductCategory.textContent = product.category || 'None';
    modalProductPrice.textContent = product.price || 'Not specified';
    modalProductLeadtime.textContent = product.leadTime ? `${product.leadTime} days` : 'Not specified';
    
    // Format delivery date
    if (product.deliveryDate) {
      const deliveryDate = new Date(product.deliveryDate);
      const formattedDate = deliveryDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      
      const today = new Date();
      const daysUntil = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));
      
      let deliveryStatus = '';
      if (daysUntil < 0) {
        deliveryStatus = ' (Past)';
      } else if (daysUntil === 0) {
        deliveryStatus = ' (Today)';
      } else if (daysUntil === 1) {
        deliveryStatus = ' (Tomorrow)';
      } else {
        deliveryStatus = ` (${daysUntil} days from now)`;
      }
      
      modalProductDelivery.textContent = formattedDate + deliveryStatus;
    } else {
      modalProductDelivery.textContent = 'Not specified';
    }
    
    // Format date added
    if (product.dateAdded) {
      const dateAdded = new Date(product.dateAdded);
      modalProductDateadded.textContent = dateAdded.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } else {
      modalProductDateadded.textContent = 'Unknown';
    }
    
    // Source info
    if (product.source && product.source.title) {
      modalProductSource.textContent = product.source.title;
    } else if (product.url) {
      modalProductSource.textContent = new URL(product.url).hostname;
    } else {
      modalProductSource.textContent = 'Not available';
    }
    
    // Notes
    modalProductNotes.textContent = product.notes || 'No notes available.';
    
    // Update website button state
    if (product.url) {
      openProductWebsiteBtn.disabled = false;
    } else {
      openProductWebsiteBtn.disabled = true;
    }
    
    // Show the modal
    productDetailModal.classList.remove('hidden');
  }
  
  function showEditProductModal(product) {
    // Close the product detail modal
    productDetailModal.classList.add('hidden');
    
    // Set form values
    editProductId.value = product.id;
    editProductName.value = product.name || '';
    editCategorySelect.value = product.category || '';
    editProductPrice.value = product.price || '';
    editProductLeadtime.value = product.leadTime || '';
    editDeliveryDate.value = product.deliveryDate || '';
    editProductNotes.value = product.notes || '';
    
    // Show the edit modal
    editProductModal.classList.remove('hidden');
  }
  
  function saveProductChanges() {
    const productId = editProductId.value;
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      alert('Error: Product not found');
      return;
    }
    
    // Update product data
    products[productIndex] = {
      ...products[productIndex],
      name: editProductName.value,
      category: editCategorySelect.value,
      price: editProductPrice.value,
      leadTime: editProductLeadtime.value,
      deliveryDate: editDeliveryDate.value,
      notes: editProductNotes.value
    };
    
    // Save to storage
    saveProducts(function() {
      // Close modal
      editProductModal.classList.add('hidden');
      
      // Update UI
      updateProductsGrid();
      updateTimeline();
      updateCategories();
      updateNotes();
      
      // Show success message
      showSuccessMessage('Product updated successfully');
    });
  }
  
  function showAddProductModal() {
    // Reset form
    document.getElementById('add-product-form').reset();
    previewImage.src = 'images/placeholder.png';
    
    // Show modal
    addProductModal.classList.remove('hidden');
  }
  
  function addNewProduct() {
    const productName = addProductName.value;
    
    if (!productName) {
      alert('Please enter a product name');
      return;
    }
    
    // Create new product object
    const newProduct = {
      id: generateId(),
      name: productName,
      url: addProductUrl.value,
      image: previewImage.src !== 'images/placeholder.png' ? previewImage.src : null,
      category: addCategorySelect.value,
      price: addProductPrice.value,
      leadTime: addProductLeadtime.value,
      deliveryDate: addDeliveryDate.value,
      notes: addProductNotes.value,
      dateAdded: new Date().toISOString()
    };
    
    // Add to products array
    products.push(newProduct);
    
    // Save to storage
    saveProducts(function() {
      // Close modal
      addProductModal.classList.add('hidden');
      
      // Update UI
      updateProductsGrid();
      updateTimeline();
      updateCategories();
      updateNotes();
      
      // Show success message
      showSuccessMessage('Product added successfully');
    });
  }
  
  function confirmDeleteProduct(product) {
    if (confirm(`Are you sure you want to delete "${product.name || 'this product'}"?`)) {
      // Remove from products array
      const productIndex = products.findIndex(p => p.id === product.id);
      
      if (productIndex !== -1) {
        products.splice(productIndex, 1);
        
        // Save to storage
        saveProducts(function() {
          // Close modal
          productDetailModal.classList.add('hidden');
          
          // Update UI
          updateProductsGrid();
          updateTimeline();
          updateCategories();
          updateNotes();
          
          // Show success message
          showSuccessMessage('Product deleted successfully');
        });
      }
    }
  }
  
  function showProjectSettingsModal() {
    // Set form values
    editProjectName.value = project.name || '';
    editProjectDesc.value = project.description || '';
    
    // Show modal
    projectSettingsModal.classList.remove('hidden');
  }
  
  function saveProjectSettings() {
    const projectName = editProjectName.value;
    
    if (!projectName) {
      alert('Please enter a project name');
      return;
    }
    
    // Update project data
    project.name = projectName;
    project.description = editProjectDesc.value;
    
    // Save to storage
    chrome.storage.local.get('projects', function(result) {
      const projects = result.projects || [];
      const projectIndex = projects.findIndex(p => p.id === project.id);
      
      if (projectIndex !== -1) {
        projects[projectIndex] = project;
        
        chrome.storage.local.set({ projects }, function() {
          // Close modal
          projectSettingsModal.classList.add('hidden');
          
          // Update UI
          updateProjectInfo();
          
          // Show success message
          showSuccessMessage('Project settings updated successfully');
        });
      }
    });
  }
  
  function confirmDeleteProject() {
    if (confirm(`Are you sure you want to delete project "${project.name}"? All products in this project will be deleted as well.`)) {
      if (confirm('This action cannot be undone. Are you absolutely sure?')) {
        deleteProject();
      }
    }
  }
  
  function deleteProject() {
    chrome.storage.local.get(['projects', 'projectProducts'], function(result) {
      const projects = result.projects || [];
      const projectProducts = result.projectProducts || {};
      
      // Remove project from projects array
      const updatedProjects = projects.filter(p => p.id !== project.id);
      
      // Remove project products
      delete projectProducts[project.id];
      
      // Save to storage
      chrome.storage.local.set({
        projects: updatedProjects,
        projectProducts: projectProducts
      }, function() {
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
      });
    });
  }
  
  function saveProjectNotes() {
    // Update project notes
    project.notes = projectNotesText.value;
    
    // Save to storage
    chrome.storage.local.get('projects', function(result) {
      const projects = result.projects || [];
      const projectIndex = projects.findIndex(p => p.id === project.id);
      
      if (projectIndex !== -1) {
        projects[projectIndex].notes = project.notes;
        
        chrome.storage.local.set({ projects }, function() {
          // Show success message
          showSuccessMessage('Project notes saved successfully');
        });
      }
    });
  }
  
  function showShareProjectModal() {
    // Show modal
    shareProjectModal.classList.remove('hidden');
  }
  
  function exportProject() {
    // Show share modal
    showShareProjectModal();
  }
  
  function exportProjectAsPdf() {
    alert('PDF export functionality is not implemented in this prototype.');
    
    // In a full implementation, this would generate a PDF file with project details
  }
  
  function exportProjectAsJson() {
    // Create export object
    const exportData = {
      project: project,
      products: products,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    // Create data URL
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    
    // Create download link
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', `titus-project-${project.id}-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    // Show success message
    showSuccessMessage('Project exported successfully');
  }
  
  function openUpgradeInfo() {
    chrome.tabs.create({
      url: 'https://tituscontracting.com/contact'
    });
  }
  
  function saveProducts(callback) {
    chrome.storage.local.get('projectProducts', function(result) {
      const projectProducts = result.projectProducts || {};
      
      // Update products for this project
      projectProducts[projectId] = products;
      
      // Save to storage
      chrome.storage.local.set({ projectProducts }, function() {
        if (callback) callback();
      });
    });
  }
  
  function showSuccessMessage(message) {
    const successMsg = document.createElement('div');
    successMsg.className = 'success-message';
    successMsg.textContent = message;
    successMsg.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #4CAF50;
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      z-index: 3000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      opacity: 0;
      transition: opacity 0.3s;
    `;
    
    document.body.appendChild(successMsg);
    
    // Animate in
    setTimeout(() => {
      successMsg.style.opacity = '1';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
      successMsg.style.opacity = '0';
      setTimeout(() => {
        successMsg.remove();
      }, 300);
    }, 3000);
  }
  
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }
});
