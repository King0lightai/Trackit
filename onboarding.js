// Onboarding JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const viewDemoBtn = document.getElementById('view-demo-btn');
  const createProjectBtn = document.getElementById('create-project-btn');
  const goToDashboardBtn = document.getElementById('go-to-dashboard-btn');
  const createProjectModal = document.getElementById('create-project-modal');
  const closeModalBtns = document.querySelectorAll('.close-modal-btn, .cancel-modal-btn');
  const createBtn = document.getElementById('create-btn');
  const newProjectName = document.getElementById('new-project-name');
  const newProjectDesc = document.getElementById('new-project-desc');

  // Feature Icons Placeholder SVGs
  createPlaceholderIcons();
  
  // Setup event listeners
  setupEventListeners();
  
  // Check if it's the first run
  checkFirstRun();
  
  function setupEventListeners() {
    // View demo project button
    viewDemoBtn.addEventListener('click', function() {
      viewDemoProject();
    });
    
    // Create project button
    createProjectBtn.addEventListener('click', function() {
      showCreateProjectModal();
    });
    
    // Go to dashboard button
    goToDashboardBtn.addEventListener('click', function() {
      goToDashboard();
    });
    
    // Close modal buttons
    closeModalBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        createProjectModal.classList.add('hidden');
      });
    });
    
    // Create button in modal
    createBtn.addEventListener('click', function() {
      createNewProject();
    });
  }
  
  function checkFirstRun() {
    chrome.storage.local.get('onboardingCompleted', function(result) {
      // If onboarding was already completed, just show welcome back message
      if (result.onboardingCompleted) {
        // Could customize the page for returning users
        console.log('Returning user detected');
      }
    });
  }
  
  function viewDemoProject() {
    // Check if demo project exists
    chrome.storage.local.get(['projects', 'projectProducts'], function(result) {
      const projects = result.projects || [];
      const demoProject = projects.find(p => p.id === 'demo-project');
      
      if (demoProject) {
        // Demo project exists, open it
        chrome.tabs.create({
          url: `project.html?id=demo-project`
        });
      } else {
        // Demo project doesn't exist, create it
        createDemoProject(function() {
          chrome.tabs.create({
            url: `project.html?id=demo-project`
          });
        });
      }
    });
  }
  
  function createDemoProject(callback) {
    const demoProject = {
      id: 'demo-project',
      name: 'Demo Kitchen Remodel',
      description: 'This is a demo project showing how to use Titus Project Tracker. Browse through the products to see how you can organize items, track deliveries, and more.',
      dateCreated: new Date().toISOString(),
      notes: 'These are project notes. You can add any notes related to the overall project here, such as client preferences, budget constraints, or important details to remember.'
    };
    
    const demoProducts = [
      {
        id: 'demo-product-1',
        name: 'Modern Pendant Light Fixture',
        url: 'https://example.com/pendant-light',
        image: 'images/demo/pendant-light.jpg',
        category: 'lighting',
        price: '$129.99',
        leadTime: '14',
        deliveryDate: getFutureDate(14),
        notes: 'Client prefers brushed nickel finish. Need 3 of these for the kitchen island.',
        dateAdded: new Date().toISOString(),
        source: {
          title: 'Modern Lighting Co.',
          url: 'https://example.com/pendant-light',
          favicon: 'https://example.com/favicon.ico'
        }
      },
      {
        id: 'demo-product-2',
        name: 'Kitchen Sink Faucet - Pull Down Sprayer',
        url: 'https://example.com/kitchen-faucet',
        image: 'images/demo/kitchen-faucet.jpg',
        category: 'plumbing',
        price: '$189.50',
        leadTime: '21',
        deliveryDate: getFutureDate(21),
        notes: 'Matte black finish to match the cabinet hardware. Confirmed measurements will fit existing sink.',
        dateAdded: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        source: {
          title: 'Premium Plumbing Supply',
          url: 'https://example.com/kitchen-faucet',
          favicon: 'https://example.com/favicon.ico'
        }
      },
      {
        id: 'demo-product-3',
        name: 'Quartz Countertop - Calacatta Gold',
        url: 'https://example.com/quartz-countertop',
        image: 'images/demo/quartz-countertop.jpg',
        category: 'materials',
        price: '$78.50 per sq ft',
        leadTime: '28',
        deliveryDate: getFutureDate(28),
        notes: 'Need approximately 45 sq ft. Scheduled for template measurement next week.',
        dateAdded: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        source: {
          title: 'Stone & Surface Specialists',
          url: 'https://example.com/quartz-countertop',
          favicon: 'https://example.com/favicon.ico'
        }
      },
      {
        id: 'demo-product-4',
        name: 'Ceramic Subway Tile - White Gloss',
        url: 'https://example.com/subway-tile',
        image: 'images/demo/subway-tile.jpg',
        category: 'materials',
        price: '$5.99 per sq ft',
        leadTime: '10',
        deliveryDate: getFutureDate(10),
        notes: 'For kitchen backsplash. Client wants white grout with 1/8" spacing.',
        dateAdded: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        source: {
          title: 'Tile & Stone Warehouse',
          url: 'https://example.com/subway-tile',
          favicon: 'https://example.com/favicon.ico'
        }
      },
      {
        id: 'demo-product-5',
        name: 'Cabinet Hardware - Matte Black Pulls',
        url: 'https://example.com/cabinet-pulls',
        image: 'images/demo/cabinet-pulls.jpg',
        category: 'hardware',
        price: '$8.25 each',
        leadTime: '7',
        deliveryDate: getFutureDate(7),
        notes: 'Need 24 pulls total. Confirmed 5" center-to-center measurement.',
        dateAdded: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
        source: {
          title: 'Hardware Essentials',
          url: 'https://example.com/cabinet-pulls',
          favicon: 'https://example.com/favicon.ico'
        }
      },
      {
        id: 'demo-product-6',
        name: 'Under Cabinet LED Lighting Kit',
        url: 'https://example.com/led-lighting',
        image: 'images/demo/led-lighting.jpg',
        category: 'lighting',
        price: '$149.99',
        leadTime: '5',
        deliveryDate: getFutureDate(5),
        notes: 'Warm white (3000K) with dimmer switch. Need approximately 12 linear feet.',
        dateAdded: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
        source: {
          title: 'Lighting Solutions Inc.',
          url: 'https://example.com/led-lighting',
          favicon: 'https://example.com/favicon.ico'
        }
      }
    ];
    
    // Save demo project and products to storage
    chrome.storage.local.get(['projects', 'projectProducts'], function(result) {
      let projects = result.projects || [];
      let projectProducts = result.projectProducts || {};
      
      // Add demo project if it doesn't exist
      if (!projects.find(p => p.id === 'demo-project')) {
        projects.push(demoProject);
      }
      
      // Add demo products
      projectProducts['demo-project'] = demoProducts;
      
      // Save to storage
      chrome.storage.local.set({
        projects: projects,
        projectProducts: projectProducts
      }, function() {
        if (callback) callback();
      });
    });
  }
  
  function showCreateProjectModal() {
    createProjectModal.classList.remove('hidden');
    newProjectName.focus();
  }
  
  function createNewProject() {
    const projectName = newProjectName.value.trim();
    
    if (!projectName) {
      alert('Please enter a project name');
      return;
    }
    
    const newProject = {
      id: generateId(),
      name: projectName,
      description: newProjectDesc.value.trim(),
      dateCreated: new Date().toISOString()
    };
    
    // Save to storage
    chrome.storage.local.get('projects', function(result) {
      let projects = result.projects || [];
      projects.push(newProject);
      
      chrome.storage.local.set({
        projects: projects,
        onboardingCompleted: true
      }, function() {
        // Redirect to the new project
        chrome.tabs.create({
          url: `project.html?id=${newProject.id}`
        });
        
        // Close this onboarding tab
        chrome.tabs.getCurrent(function(tab) {
          chrome.tabs.remove(tab.id);
        });
      });
    });
  }
  
  function goToDashboard() {
    // Mark onboarding as completed
    chrome.storage.local.set({ onboardingCompleted: true }, function() {
      // Open dashboard
      chrome.tabs.create({
        url: 'dashboard.html'
      });
      
      // Close this onboarding tab
      chrome.tabs.getCurrent(function(tab) {
        chrome.tabs.remove(tab.id);
      });
    });
  }
  
  function getFutureDate(daysFromNow) {
    const date = new Date();
    date.setDate(date.getDate() + parseInt(daysFromNow));
    return date.toISOString().split('T')[0];
  }
  
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }
  
  function createPlaceholderIcons() {
    // Create placeholder SVGs for feature icons
    // This is a temporary solution until you create real icons
    
    const saveIconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1565c0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
        <polyline points="17 21 17 13 7 13 7 21"></polyline>
        <polyline points="7 3 7 8 15 8"></polyline>
      </svg>
    `;
    
    const projectIconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1565c0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
      </svg>
    `;
    
    const timelineIconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1565c0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    `;
    
    const shareIconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1565c0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="18" cy="5" r="3"></circle>
        <circle cx="6" cy="12" r="3"></circle>
        <circle cx="18" cy="19" r="3"></circle>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
      </svg>
    `;
    
    // Create image directory (this would typically be done during extension packaging)
    createImageDirectory();
    
    // Set SVGs to image elements
    document.querySelector('img[alt="Save Products Icon"]').outerHTML = saveIconSvg;
    document.querySelector('img[alt="Organize Projects Icon"]').outerHTML = projectIconSvg;
    document.querySelector('img[alt="Timeline Icon"]').outerHTML = timelineIconSvg;
    document.querySelector('img[alt="Share Icon"]').outerHTML = shareIconSvg;
  }
  
  function createImageDirectory() {
    // This is a placeholder function
    // In a real extension, you would include the images in your package
    // This function is only here to acknowledge that step
    console.log('In a real extension, you would include actual image files in your package');
  }
});
