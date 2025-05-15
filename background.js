// Background script - runs when the extension is installed or updated
// and remains running as long as the extension is enabled

// Initialize data on install
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    // Set up initial storage
    const initialData = {
      projects: [
        {
          id: 'demo-project',
          name: 'Demo Project',
          description: 'This is a demo project to show how the extension works',
          dateCreated: new Date().toISOString(),
          totalItems: 0
        }
      ],
      projectProducts: {},
      categories: [
        'plumbing',
        'lighting',
        'flooring',
        'appliances',
        'hardware',
        'fixtures',
        'materials',
        'other'
      ],
      settings: {
        defaultProjectId: 'demo-project',
        notifyDeliveryReminders: true,
        daysBeforeDeliveryReminder: 7,
        autoDetectProductInfo: true
      }
    };
    
    chrome.storage.local.set(initialData);
    
    // Open onboarding page
    chrome.tabs.create({
      url: 'onboarding.html'
    });
  }
});

// Set up context menu
chrome.runtime.onInstalled.addListener(function() {
  try {
    chrome.contextMenus.create({
      id: 'save-to-project',
      title: 'Save to Titus Project',
      contexts: ['image', 'link', 'page']
    });
    
    chrome.contextMenus.create({
      id: 'save-image-to-project',
      title: 'Save Image to Project',
      contexts: ['image']
    });
  } catch (error) {
    console.error("Error creating context menu:", error);
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === 'save-to-project') {
    // Open popup to save item
    chrome.storage.local.set({
      tempProduct: {
        url: info.linkUrl || info.pageUrl,
        image: info.srcUrl || null,
        tabId: tab.id
      }
    });
    
    chrome.windows.create({
      url: 'save-product.html',
      type: 'popup',
      width: 400,
      height: 600
    });
  }
  
  if (info.menuItemId === 'save-image-to-project') {
    chrome.storage.local.set({
      tempProduct: {
        url: tab.url,
        image: info.srcUrl,
        tabId: tab.id
      }
    });
    
    chrome.windows.create({
      url: 'save-product.html',
      type: 'popup',
      width: 400,
      height: 600
    });
  }
});

// Listen for message from content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // Handle delivery date reminder checks
  if (request.action === 'checkDeliveryReminders') {
    checkDeliveryReminders();
    return true;
  }
  
  // Handle API calls to extract product info
  if (request.action === 'extractProductInfo' && sender && sender.tab) {
    extractProductInfo(request.url, sender.tab.id);
    return true;
  }
  
  return false; // Not handled
});

// Check for upcoming deliveries and send notifications
function checkDeliveryReminders() {
  chrome.storage.local.get(['projectProducts', 'settings'], function(result) {
    const projectProducts = result.projectProducts || {};
    const settings = result.settings || {};
    
    if (!settings.notifyDeliveryReminders) {
      return;
    }
    
    const today = new Date();
    const reminderDays = settings.daysBeforeDeliveryReminder || 7;
    
    // Loop through all projects and products
    Object.keys(projectProducts).forEach(projectId => {
      projectProducts[projectId].forEach(product => {
        if (product.deliveryDate) {
          const deliveryDate = new Date(product.deliveryDate);
          const daysUntilDelivery = Math.floor((deliveryDate - today) / (1000 * 60 * 60 * 24));
          
          if (daysUntilDelivery === reminderDays) {
            // Send notification
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'images/icon128.png',
              title: 'Upcoming Delivery Reminder',
              message: `${product.name} is scheduled for delivery in ${reminderDays} days (${product.deliveryDate})`,
              buttons: [
                { title: 'View Item' }
              ]
            });
          }
        }
      });
    });
  });
}

// Set up alarm to check for delivery reminders
chrome.alarms.create('checkDeliveryReminders', {
  periodInMinutes: 720 // Check twice a day
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === 'checkDeliveryReminders') {
    checkDeliveryReminders();
  }
});

// Function to extract product info using an API (placeholder)
function extractProductInfo(url, tabId) {
  // In a real implementation, this would call an API service to extract product details
  // For now, we'll send a message to the content script to extract info from the page
  chrome.tabs.sendMessage(tabId, {
    action: 'extractProductDetails'
  });
}
