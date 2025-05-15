// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const navLinks = document.querySelectorAll('nav a');
  const views = document.querySelectorAll('.view');
  const newProjectBtns = document.querySelectorAll('#new-project-btn, #projects-new-btn');
  const newProjectModal = document.getElementById('new-project-modal');
  const closeModalBtns = document.querySelectorAll('.close-modal-btn, .cancel-modal-btn');
  const createProjectBtn = document.getElementById('create-project-btn');
  const newProjectName = document.getElementById('new-project-name');
  const newProjectDesc = document.getElementById('new-project-desc');
  const projectSearch = document.getElementById('project-search');
  const projectSort = document.getElementById('project-sort');
  const projectsGrid = document.getElementById('projects-grid');
  const timelineProjectSelect = document.getElementById('timeline-project-select');
  const timelineCategorySelect = document.getElementById('timeline-category-select');
  const timelineMonthLabels = document.getElementById('timeline-month-labels');
  const timelineGrid = document.getElementById('timeline-grid');
  const defaultProjectSelect = document.getElementById('default-project');
  const autoDetectInfoCheckbox = document.getElementById('auto-detect-info');
  const deliveryRemindersCheckbox = document.getElementById('delivery-reminders');
  const reminderDaysInput = document.getElementById('reminder-days');
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  const exportDataBtn = document.getElementById('export-data-btn');
  const importDataBtn = document.getElementById('import-data-btn');
  const clearDataBtn = document.getElementById('clear-data-btn');
  
  // Stats elements
  const totalProjectsEl = document.getElementById('total-projects');
  const totalProductsEl = document.getElementById('total-products');
  const upcomingDeliveriesEl = document.getElementById('upcoming-deliveries');
  const upcomingDeliveriesList = document.getElementById('upcoming-deliveries-list');
  const recentActivityList = document.getElementById('recent-activity-list');
  const activeProjectsList = document.getElementById('active-projects-list');
  
  // State
  let projects = [];
  let projectProducts = {};
  let settings = {};
  
  // Initialize the dashboard
  init();
  
  function init() {
    // Load data from storage
    loadData();
    
    // Set up event listeners
    setupEventListeners();
  }
  
  function loadData() {
    chrome.storage.local.get(['projects', 'projectProducts', 'settings'], function(result) {
      projects = result.projects || [];
      projectProducts = result.projectProducts || {};
      settings = result.settings || {
        defaultProjectId: '',
        notifyDeliveryReminders: true,
        daysBeforeDeliveryReminder: 7,
        autoDetectProductInfo: true
      };
      
      // Update UI with loaded data
      updateDashboard();
      updateProjectsView();
      updateTimelineView();
      updateSettingsView();
    });
  }
  
  function setupEventListeners() {
    // Navigation links
    navLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Update active nav link
        navLinks.forEach(navLink => navLink.classList.remove('active'));
        this.classList.add('active');
        
        // Show corresponding view
        const targetView = this.id.replace('nav-', '') + '-view';
        views.forEach(view => {
          view.classList.remove('active');
          if (view.id === targetView) {
            view.classList.add('active');
          }
        });
      });
    });
    
    // New project buttons
    newProjectBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        newProjectModal.classList.remove('hidden');
        newProjectName.focus();
      });
    });
    
    // Close modal buttons
    closeModalBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        newProjectModal.classList.add('hidden');
        newProjectName.value = '';
        newProjectDesc.value = '';
      });
    });
    
    // Create project button
    createProjectBtn.addEventListener('click', createNewProject);
    
    // Project search
    projectSearch.addEventListener('input', function() {
      updateProjectsView();
    });
    
    // Project sort
    projectSort.addEventListener('change', function() {
      updateProjectsView();
    });
    
    // Timeline filters
    timelineProjectSelect.addEventListener('change', function() {
      updateTimelineView();
    });
    
    timelineCategorySelect.addEventListener('change', function() {
      updateTimelineView();
    });
    
    // Settings form
    saveSettingsBtn.addEventListener('click', saveSettings);
    exportDataBtn.addEventListener('click', exportData);
    importDataBtn.addEventListener('click', importData);
    clearDataBtn.addEventListener('click', confirmClearData);
  }
  
  function updateDashboard() {
    // Update stats
    let totalProducts = 0;
    Object.keys(projectProducts).forEach(projectId => {
      totalProducts += projectProducts[projectId].length;
    });
    
    totalProjectsEl.textContent = projects.length;
    totalProductsEl.textContent = totalProducts;
    
    // Get upcoming deliveries
    const upcomingDeliveries = getUpcomingDeliveries();
    upcomingDeliveriesEl.textContent = upcomingDeliveries.length;
    
    // Update upcoming deliveries list
    updateUpcomingDeliveriesList(upcomingDeliveries);
    
    // Update recent activity
    updateRecentActivity();
    
    // Update active projects list
    updateActiveProjectsList();
  }
  
  function getUpcomingDeliveries() {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);
    
    let upcomingDeliveries = [];
    
    Object.keys(projectProducts).forEach(projectId => {
      const products = projectProducts[projectId];
      const project = projects.find(p => p.id === projectId);
      
      if (!project) return;
      
      products.forEach(product => {
        if (product.deliveryDate) {
          const deliveryDate = new Date(product.deliveryDate);
          
          if (deliveryDate >= today && deliveryDate <= nextMonth) {
            upcomingDeliveries.push({
              ...product,
              projectName: project.name,
              projectId: project.id
            });
          }
        }
      });
    });
    
    // Sort by delivery date
    upcomingDeliveries.sort((a, b) => {
      return new Date(a.deliveryDate) - new Date(b.deliveryDate);
    });
    
    return upcomingDeliveries;
  }
  
  function updateUpcomingDeliveriesList(upcomingDeliveries) {
    upcomingDeliveriesList.innerHTML = '';
    
    if (upcomingDeliveries.length === 0) {
      const emptyState = document.createElement('p');
      emptyState.className = 'empty-state';
      emptyState.textContent = 'No upcoming deliveries in the next 30 days.';
      upcomingDeliveriesList.appendChild(emptyState);
      return;
    }
    
    const list = document.createElement('ul');
    list.className = 'delivery-list';
    
    upcomingDeliveries.forEach(delivery => {
      const li = document.createElement('li');
      li.className = 'delivery-item';
      
      const date = new Date(delivery.deliveryDate);
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      
      const daysUntil = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
      let daysText = '';
      if (daysUntil === 0) {
        daysText = '<span class="delivery-today">Today</span>';
      } else if (daysUntil === 1) {
        daysText = '<span class="delivery-soon">Tomorrow</span>';
      } else {
        daysText = `<span class="delivery-days">${daysUntil} days</span>`;
      }
      
      li.innerHTML = `
        <div class="delivery-date">${formattedDate} (${daysText})</div>
        <div class="delivery-product">${delivery.name}</div>
        <div class="delivery-project">Project: ${delivery.projectName}</div>
      `;
      
      li.addEventListener('click', function() {
        chrome.tabs.create({
          url: `project.html?id=${delivery.projectId}&product=${delivery.id}`
        });
      });
      
      list.appendChild(li);
    });
    
    upcomingDeliveriesList.appendChild(list);
  }
  
  function updateRecentActivity() {
    recentActivityList.innerHTML = '';
    
    // Get all product additions sorted by date
    let allActivities = [];
    
    Object.keys(projectProducts).forEach(projectId => {
      const products = projectProducts[projectId];
      const project = projects.find(p => p.id === projectId);
      
      if (!project) return;
      
      products.forEach(product => {
        allActivities.push({
          type: 'product_added',
          product: product,
          projectName: project.name,
          projectId: project.id,
          date: new Date(product.dateAdded)
        });
      });
    });
    
    // Add project creations
    projects.forEach(project => {
      allActivities.push({
        type: 'project_created',
        projectName: project.name,
        projectId: project.id,
        date: new Date(project.dateCreated)
      });
    });
    
    // Sort by date (newest first)
    allActivities.sort((a, b) => {
      return b.date - a.date;
    });
    
    // Limit to 10 most recent
    allActivities = allActivities.slice(0, 10);
    
    if (allActivities.length === 0) {
      const emptyState = document.createElement('p');
      emptyState.className = 'empty-state';
      emptyState.textContent = 'No recent activity found.';
      recentActivityList.appendChild(emptyState);
      return;
    }
    
    const list = document.createElement('ul');
    list.className = 'activity-list';
    
    allActivities.forEach(activity => {
      const li = document.createElement('li');
      li.className = 'activity-item';
      
      const formattedDate = activity.date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      
      if (activity.type === 'product_added') {
        li.innerHTML = `
          <div class="activity-date">${formattedDate}</div>
          <div class="activity-text">Added <strong>${activity.product.name}</strong> to project <strong>${activity.projectName}</strong></div>
        `;
        
        li.addEventListener('click', function() {
          chrome.tabs.create({
            url: `project.html?id=${activity.projectId}&product=${activity.product.id}`
          });
        });
      } else if (activity.type === 'project_created') {
        li.innerHTML = `
          <div class="activity-date">${formattedDate}</div>
          <div class="activity-text">Created new project <strong>${activity.projectName}</strong></div>
        `;
        
        li.addEventListener('click', function() {
          chrome.tabs.create({
            url: `project.html?id=${activity.projectId}`
          });
        });
      }
      
      list.appendChild(li);
    });
    
    recentActivityList.appendChild(list);
  }
  
  function updateActiveProjectsList() {
    activeProjectsList.innerHTML = '';
    
    if (projects.length === 0) {
      const emptyState = document.createElement('p');
      emptyState.className = 'empty-state';
      emptyState.textContent = 'No active projects found.';
      activeProjectsList.appendChild(emptyState);
      return;
    }
    
    // Sort projects by most recently created
    const sortedProjects = [...projects].sort((a, b) => {
      return new Date(b.dateCreated) - new Date(a.dateCreated);
    });
    
    const list = document.createElement('ul');
    list.className = 'projects-list';
    
    sortedProjects.slice(0, 5).forEach(project => {
      const li = document.createElement('li');
      li.className = 'project-item';
      
      // Count products in this project
      const productCount = projectProducts[project.id] ? projectProducts[project.id].length : 0;
      
      li.innerHTML = `
        <div class="project-name">${project.name}</div>
        <div class="project-stats">${productCount} products</div>
      `;
      
      li.addEventListener('click', function() {
        chrome.tabs.create({
          url: `project.html?id=${project.id}`
        });
      });
      
      list.appendChild(li);
    });
    
    activeProjectsList.appendChild(list);
    
    // Add view all link if more than 5 projects
    if (projects.length > 5) {
      const viewAllLi = document.createElement('li');
      viewAllLi.className = 'view-all-item';
      viewAllLi.innerHTML = '<a href="#">View all projects</a>';
      
      viewAllLi.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Navigate to projects view
        navLinks.forEach(navLink => navLink.classList.remove('active'));
        document.getElementById('nav-projects').classList.add('active');
        
        views.forEach(view => {
          view.classList.remove('active');
          if (view.id === 'projects-view') {
            view.classList.add('active');
          }
        });
      });
      
      list.appendChild(viewAllLi);
    }
    
    activeProjectsList.appendChild(list);
  }
  
  function updateProjectsView() {
    projectsGrid.innerHTML = '';
    
    // Filter projects by search query
    const searchQuery = projectSearch.value.toLowerCase();
    let filteredProjects = projects.filter(project => {
      return project.name.toLowerCase().includes(searchQuery) ||
        (project.description && project.description.toLowerCase().includes(searchQuery));
    });
    
    // Sort projects
    const sortOption = projectSort.value;
    
    if (sortOption === 'name-asc') {
      filteredProjects.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'name-desc') {
      filteredProjects.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortOption === 'date-desc') {
      filteredProjects.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
    } else if (sortOption === 'date-asc') {
      filteredProjects.sort((a, b) => new Date(a.dateCreated) - new Date(b.dateCreated));
    }
    
    if (filteredProjects.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <p>No projects found matching "${searchQuery}".</p>
        <button id="clear-search-btn" class="secondary-btn">Clear Search</button>
      `;
      
      projectsGrid.appendChild(emptyState);
      
      document.getElementById('clear-search-btn').addEventListener('click', function() {
        projectSearch.value = '';
        updateProjectsView();
      });
      
      return;
    }
    
    // Create project cards
    filteredProjects.forEach(project => {
      const projectCard = document.createElement('div');
      projectCard.className = 'project-card';
      
      const products = projectProducts[project.id] || [];
      
      // Count upcoming deliveries
      const today = new Date();
      const upcomingDeliveries = products.filter(product => {
        if (!product.deliveryDate) return false;
        
        const deliveryDate = new Date(product.deliveryDate);
        return deliveryDate >= today;
      }).length;
      
      // Format date
      const dateCreated = new Date(project.dateCreated);
      const formattedDate = dateCreated.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      
      projectCard.innerHTML = `
        <div class="project-card-header">
          <h3>${project.name}</h3>
        </div>
        <div class="project-card-body">
          <div class="project-card-stats">
            <div class="project-card-stat">
              <span class="project-card-stat-value">${products.length}</span>
              <span class="project-card-stat-label">Products</span>
            </div>
            <div class="project-card-stat">
              <span class="project-card-stat-value">${upcomingDeliveries}</span>
              <span class="project-card-stat-label">Deliveries</span>
            </div>
            <div class="project-card-stat">
              <span class="project-card-stat-value">${formattedDate}</span>
              <span class="project-card-stat-label">Created</span>
            </div>
          </div>
          <div class="project-card-desc">${project.description || 'No description provided.'}</div>
        </div>
        <div class="project-card-footer">
          <button class="view-project-btn" data-id="${project.id}">View Project</button>
        </div>
      `;
      
      projectsGrid.appendChild(projectCard);
      
      // Add event listener to view button
      projectCard.querySelector('.view-project-btn').addEventListener('click', function() {
        const projectId = this.getAttribute('data-id');
        chrome.tabs.create({
          url: `project.html?id=${projectId}`
        });
      });
    });
  }
  
  function updateTimelineView() {
    // Update project select dropdown
    timelineProjectSelect.innerHTML = '<option value="all">All Projects</option>';
    
    projects.forEach(project => {
      const option = document.createElement('option');
      option.value = project.id;
      option.textContent = project.name;
      timelineProjectSelect.appendChild(option);
    });
    
    // Get selected filters
    const selectedProjectId = timelineProjectSelect.value;
    const selectedCategory = timelineCategorySelect.value;
    
    // Get all products with delivery dates
    let productsWithDates = [];
    
    Object.keys(projectProducts).forEach(projectId => {
      // Skip if filtering by project and not this one
      if (selectedProjectId !== 'all' && projectId !== selectedProjectId) {
        return;
      }
      
      const project = projects.find(p => p.id === projectId);
      if (!project) return;
      
      const products = projectProducts[projectId];
      
      products.forEach(product => {
        // Skip if no delivery date
        if (!product.deliveryDate) return;
        
        // Skip if filtering by category and not this one
        if (selectedCategory !== 'all' && product.category !== selectedCategory) {
          return;
        }
        
        productsWithDates.push({
          ...product,
          projectName: project.name,
          projectId: project.id
        });
      });
    });
    
    // Sort by delivery date
    productsWithDates.sort((a, b) => {
      return new Date(a.deliveryDate) - new Date(b.deliveryDate);
    });
    
    // Generate timeline
    generateTimeline(productsWithDates);
  }
  
  function generateTimeline(products) {
    // Clear current timeline
    timelineMonthLabels.innerHTML = '';
    timelineGrid.innerHTML = '';
    
    if (products.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'timeline-empty-state';
      emptyState.innerHTML = '<p class="empty-state">No products with delivery dates found.</p>';
      timelineGrid.appendChild(emptyState);
      return;
    }
    
    // Determine date range (start from today, extend 6 months)
    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(today.getMonth() + 6);
    
    // Create month labels
    const months = [];
    const currentMonth = new Date(today);
    currentMonth.setDate(1); // Start at beginning of month
    
    while (currentMonth <= endDate) {
      months.push(new Date(currentMonth));
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
    
    // Create month labels
    months.forEach(month => {
      const monthLabel = document.createElement('div');
      monthLabel.className = 'timeline-month';
      monthLabel.textContent = month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      timelineMonthLabels.appendChild(monthLabel);
    });
    
    // Set dimensions
    const monthWidth = 120; // pixels per month
    const timelineWidth = months.length * monthWidth;
    timelineGrid.style.width = `${timelineWidth}px`;
    timelineGrid.style.height = '400px';
    
    // Calculate position and create items
    products.forEach((product, index) => {
      const deliveryDate = new Date(product.deliveryDate);
      
      // Skip if before today or after end date
      if (deliveryDate < today || deliveryDate > endDate) {
        return;
      }
      
      // Calculate position
      const daysSinceStart = Math.floor((deliveryDate - today) / (1000 * 60 * 60 * 24));
      const totalDays = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));
      const positionPercent = (daysSinceStart / totalDays) * 100;
      
      // Create timeline item
      const timelineItem = document.createElement('div');
      timelineItem.className = 'timeline-item';
      timelineItem.style.left = `${positionPercent}%`;
      timelineItem.style.top = `${(index % 8) * 50}px`; // Stagger items vertically
      
      // Set category color
      if (product.category) {
        timelineItem.classList.add(`category-${product.category}`);
      }
      
      // Format date
      const formattedDate = deliveryDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      
      timelineItem.innerHTML = `
        <div class="timeline-item-title">${product.name}</div>
        <div class="timeline-item-project">${product.projectName} · ${formattedDate}</div>
      `;
      
      // Add tooltip
      timelineItem.title = `${product.name}\nProject: ${product.projectName}\nDelivery: ${formattedDate}\nCategory: ${product.category || 'None'}`;
      
      // Add click handler
      timelineItem.addEventListener('click', function() {
        chrome.tabs.create({
          url: `project.html?id=${product.projectId}&product=${product.id}`
        });
      });
      
      timelineGrid.appendChild(timelineItem);
    });
  }
  
  function updateSettingsView() {
    // Update project dropdown
    defaultProjectSelect.innerHTML = '<option value="">No default project</option>';
    
    projects.forEach(project => {
      const option = document.createElement('option');
      option.value = project.id;
      option.textContent = project.name;
      defaultProjectSelect.appendChild(option);
    });
    
    // Set current values
    defaultProjectSelect.value = settings.defaultProjectId || '';
    autoDetectInfoCheckbox.checked = settings.autoDetectProductInfo !== false;
    deliveryRemindersCheckbox.checked = settings.notifyDeliveryReminders !== false;
    reminderDaysInput.value = settings.daysBeforeDeliveryReminder || 7;
  }
  
  function createNewProject() {
    const projectName = newProjectName.value.trim();
    const projectDesc = newProjectDesc.value.trim();
    
    if (!projectName) {
      alert('Please enter a project name');
      return;
    }
    
    const newProject = {
      id: generateId(),
      name: projectName,
      description: projectDesc,
      dateCreated: new Date().toISOString(),
      totalItems: 0
    };
    
    // Add to projects array
    projects.push(newProject);
    
    // Save to storage
    chrome.storage.local.set({ projects }, function() {
      // Close modal
      newProjectModal.classList.add('hidden');
      
      // Clear form
      newProjectName.value = '';
      newProjectDesc.value = '';
      
      // Update UI
      updateDashboard();
      updateProjectsView();
      updateTimelineView();
      updateSettingsView();
      
      // Show success message
      showSuccessMessage('Project created successfully');
    });
  }
  
  function saveSettings() {
    const updatedSettings = {
      defaultProjectId: defaultProjectSelect.value,
      autoDetectProductInfo: autoDetectInfoCheckbox.checked,
      notifyDeliveryReminders: deliveryRemindersCheckbox.checked,
      daysBeforeDeliveryReminder: parseInt(reminderDaysInput.value) || 7
    };
    
    // Update settings
    settings = updatedSettings;
    
    // Save to storage
    chrome.storage.local.set({ settings }, function() {
      showSuccessMessage('Settings saved successfully');
    });
  }
  
  function exportData() {
    // Prepare data for export
    const exportData = {
      projects,
      projectProducts,
      settings,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    // Create data URL
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    
    // Create download link
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', `titus-project-data-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
  
  function importData() {
    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      
      if (!file) return;
      
      const reader = new FileReader();
      
      reader.onload = function(e) {
        try {
          const importedData = JSON.parse(e.target.result);
          
          // Validate data
          if (!importedData.projects || !importedData.projectProducts) {
            throw new Error('Invalid data format');
          }
          
          // Confirm import
          if (confirm(`Import data with ${importedData.projects.length} projects and replace current data?`)) {
            // Update data
            projects = importedData.projects;
            projectProducts = importedData.projectProducts;
            settings = importedData.settings || settings;
            
            // Save to storage
            chrome.storage.local.set({ projects, projectProducts, settings }, function() {
              // Update UI
              updateDashboard();
              updateProjectsView();
              updateTimelineView();
              updateSettingsView();
              
              showSuccessMessage('Data imported successfully');
            });
          }
        } catch (error) {
          alert('Error importing data: ' + error.message);
        }
      };
      
      reader.readAsText(file);
    });
    
    fileInput.click();
  }
  
  function confirmClearData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      if (confirm('LAST WARNING: All projects and product data will be deleted. Continue?')) {
        clearAllData();
      }
    }
  }
  
  function clearAllData() {
    // Reset data
    projects = [];
    projectProducts = {};
    
    // Save to storage
    chrome.storage.local.set({ projects, projectProducts }, function() {
      // Update UI
      updateDashboard();
      updateProjectsView();
      updateTimelineView();
      updateSettingsView();
      
      showSuccessMessage('All data has been cleared');
    });
  }
  
  function showSuccessMessage(message) {
    const successMsg = document.createElement('div');
    successMsg.className = 'success-message';
    successMsg.textContent = message;
    
    document.body.appendChild(successMsg);
    
    // Animate in
    setTimeout(() => {
      successMsg.classList.add('show');
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
      successMsg.classList.remove('show');
      setTimeout(() => {
        successMsg.remove();
      }, 300);
    }, 3000);
  }
  
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }
});
