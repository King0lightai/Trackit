// Content script - runs in the context of web pages

// Debug mode for development
const DEBUG = true;

// Cache for product info
let cachedProductInfo = null;

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "getProductInfo") {
    try {
      // Extract product information from current page
      const productInfo = getCachedOrExtractProductInfo();
      
      if (DEBUG) {
        console.log("Titus Project Tracker: Extracted product info", productInfo);
      }
      
      sendResponse({
        success: true,
        data: productInfo
      });
    } catch (error) {
      console.error("Error extracting product info:", error);
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }
  
  if (request.action === "extractProductDetails") {
    try {
      // Extract more detailed product info
      const productDetails = extractDetailedProductInfo();
      
      // Send back to background script
      chrome.runtime.sendMessage({
        action: "productDetailsExtracted",
        data: productDetails
      }).catch(error => {
        console.error("Error sending message:", error);
      });
    } catch (error) {
      console.error("Error extracting detailed product info:", error);
    }
  }
  
  return true; // Required to use sendResponse asynchronously
});

// Function to get cached product info or extract new info
function getCachedOrExtractProductInfo() {
  if (cachedProductInfo) {
    return cachedProductInfo;
  }
  
  cachedProductInfo = extractProductInfo();
  return cachedProductInfo;
}

// Function to extract basic product info from the page
function extractProductInfo() {
  const timerName = "Titus Project Tracker: Product extraction time-" + Math.random();
  if (DEBUG) {
    console.time(timerName);
  }
  
  // Get current hostname to apply site-specific extraction if needed
  const hostname = window.location.hostname;
  
  let price = null;
  let name = null;
  
  // Site-specific extraction
  if (hostname.includes('build.com') || hostname.includes('ferguson.com')) {
    console.log("Using Build.com/Ferguson specific extraction");
    price = extractBuildDotComPrice();
    name = extractBuildDotComName();
  } else if (hostname.includes('menards.com')) {
    console.log("Using Menards specific extraction");
    price = extractMenardsPrice();
    name = findProductName(); // Use generic method for name
  } else {
    // Generic extraction for other sites
    price = findProductPrice();
    name = findProductName();
  }
  
  const data = {
    image: findProductImage(),
    name: name || findProductName(), // Fallback to generic method if site-specific fails
    price: price
  };
  
  if (DEBUG) {
    console.timeEnd(timerName);
    console.log("Titus Project Tracker: Final extracted data:", data);
  }
  
  return data;
}

// Build.com-specific name extraction
function extractBuildDotComName() {
  try {
    console.log("Extracting name from Build.com");
    
    // Method 1: Look for the specific class from the screenshot
    const nameElement = document.querySelector('.fw2.di-ns');
    if (nameElement) {
      console.log("Found name with fw2 di-ns class:", nameElement.textContent);
      return nameElement.textContent.trim();
    }
    
    // Method 2: Check for h1 element
    const h1Element = document.querySelector('h1');
    if (h1Element) {
      console.log("Found name in h1:", h1Element.textContent);
      return h1Element.textContent.trim();
    }
    
    // Method 3: Look for title with brand
    const titleElements = document.querySelectorAll('[data-automation="pdp-title"], [class*="pdp-title"], [class*="product-title"]');
    for (const element of titleElements) {
      if (element.textContent) {
        console.log("Found name in title element:", element.textContent);
        return element.textContent.trim();
      }
    }
    
    // Method 4: Look for title in breadcrumbs
    const breadcrumbs = document.querySelectorAll('.breadcrumb-item, [class*="breadcrumb"]');
    if (breadcrumbs.length > 0) {
      const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
      if (lastBreadcrumb && lastBreadcrumb.textContent) {
        console.log("Found name in last breadcrumb:", lastBreadcrumb.textContent);
        return lastBreadcrumb.textContent.trim();
      }
    }
    
    // Fallback to generic method
    return null;
  } catch (error) {
    console.error("Error extracting Build.com name:", error);
    return null; // Fallback to generic method
  }
}

// Function to extract more detailed product information
function extractDetailedProductInfo() {
  return {
    image: findProductImage(),
    name: findProductName(),
    price: findProductPrice(),
    dimensions: findProductDimensions(),
    description: findProductDescription(),
    sku: findProductSKU(),
    manufacturer: findProductManufacturer()
  };
}

// Build.com and Ferguson-specific price extraction
function extractBuildDotComPrice() {
  try {
    console.log("Extracting price from Build.com");
    
    // Method 1: Data attribute (most reliable based on screenshot)
    const priceElement = document.querySelector('[data-automation="price"]');
    if (priceElement) {
      console.log("Found price with data-automation attribute:", priceElement.textContent);
      return cleanPriceText(priceElement.textContent);
    }
    
    // Method 2: New Build.com data element
    const dataElements = document.querySelectorAll('[data-automation]');
    for (const element of dataElements) {
      if (element.getAttribute('data-automation') === 'price' || 
          element.getAttribute('data-automation').includes('price')) {
        console.log("Found price with data-automation contains price:", element.textContent);
        return cleanPriceText(element.textContent);
      }
    }
    
    // Method 3: Look for spans with price text
    const priceSpans = document.querySelectorAll('span');
    for (const span of priceSpans) {
      if (span.textContent && /^\$\d+\.\d{2}$/.test(span.textContent.trim())) {
        console.log("Found price in span with exact format:", span.textContent);
        return cleanPriceText(span.textContent);
      }
    }
    
    // Method 4: Look for price in flex containers (based on screenshot)
    const flexContainers = document.querySelectorAll('.flex, [class*="flex-"]');
    for (const container of flexContainers) {
      const text = container.textContent;
      if (text && /\$\d+\.\d{2}/.test(text)) {
        const match = text.match(/\$\d+\.\d{2}/);
        if (match) {
          console.log("Found price in flex container:", match[0]);
          return match[0];
        }
      }
    }
    
    // Fallback to generic method
    return findProductPrice();
  } catch (error) {
    console.error("Error extracting Build.com price:", error);
    return findProductPrice(); // Fallback to generic method
  }
}

// Menards-specific price extraction
function extractMenardsPrice() {
  try {
    console.log("Extracting price from Menards");
    
    // Method 1: Look for itemFinalPrice (exact match from screenshot)
    const finalPriceElement = document.getElementById('itemFinalPrice');
    if (finalPriceElement) {
      console.log("Found price with itemFinalPrice ID:", finalPriceElement.textContent);
      // Check if there's a data-final-price attribute
      if (finalPriceElement.hasAttribute('data-final-price')) {
        const price = finalPriceElement.getAttribute('data-final-price');
        console.log("Found data-final-price attribute:", price);
        return '

// Helper functions to find product information on the page
function findProductImage() {
  // Look for the most prominent image on the page
  // Strategy 1: Look for schema.org product image
  const schemaElements = document.querySelectorAll('[itemtype*="Product"] [itemprop="image"], [itemprop="image"]');
  if (schemaElements.length > 0) {
    const img = schemaElements[0];
    return img.src || img.content || img.getAttribute('content') || null;
  }
  
  // Strategy 2: Look for Open Graph image
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && ogImage.content) {
    return ogImage.content;
  }
  
  // Strategy 3: Look for common product image containers
  const productImageSelectors = [
    '.product-image img',
    '.product-photo img',
    '.product-media img',
    '.product-gallery img',
    '.product img',
    '#product-image',
    '#main-image',
    '.main-image',
    '.primary-image',
    '.featured-image img',
    '[id*="product"] img',
    '[class*="product"] img',
    '.gallery-image',
    '.product-gallery__hero img',
    '.product-media img',
    '.woocommerce-product-gallery__image img'
  ];
  
  for (const selector of productImageSelectors) {
    try {
      const img = document.querySelector(selector);
      if (img && img.src) {
        return img.src;
      }
    } catch (e) {
      // Handle any selector errors and continue
      continue;
    }
  }
  
  // Strategy 4: Find the largest image on the page that's likely a product image
  let largestImage = null;
  let largestArea = 0;
  
  const images = document.querySelectorAll('img');
  for (const img of images) {
    // Ignore tiny images, icons, logos
    if (img.width > 100 && img.height > 100) {
      const area = img.width * img.height;
      if (area > largestArea) {
        largestArea = area;
        largestImage = img.src;
      }
    }
  }
  
  return largestImage;
}

function findProductName() {
  // Strategy 1: Look for schema.org product name
  const schemaName = document.querySelector('[itemtype*="Product"] [itemprop="name"], [itemprop="name"]');
  if (schemaName) {
    return schemaName.textContent.trim();
  }
  
  // Strategy 2: Look for common product name elements
  const productNameSelectors = [
    'h1.product-name',
    'h1.product-title',
    '.product-name',
    '.product-title',
    'h1:first-of-type',
    '#product-name',
    '#product-title',
    '.product__title',
    '.product-single__title',
    '.product_title',
    '[class*="product-name"]',
    '[class*="product-title"]',
    '[id*="product-name"]',
    '[id*="product-title"]',
    // Target standard heading patterns
    'h1',
    // Target product detail pages with multiple h1 elements
    'main h1'
  ];
  
  for (const selector of productNameSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim() && element.textContent.length < 200) {
        return element.textContent.trim();
      }
    } catch (e) {
      // Handle any selector errors and continue
      continue;
    }
  }
  
  // Strategy 3: Use page title as fallback
  const title = document.title;
  if (title) {
    // Try to clean up the title (remove site name, etc.)
    const parts = title.split(/[|\-–—]/);
    if (parts.length > 1) {
      return parts[0].trim();
    }
    return title;
  }
  
  return null;
}

function findProductPrice() {
  try {
    // Strategy 1: Look for schema.org product price
    const schemaPrice = document.querySelector('[itemtype*="Product"] [itemprop="price"], [itemprop="offers"] [itemprop="price"], [itemprop="price"]');
    if (schemaPrice) {
      const price = schemaPrice.textContent || schemaPrice.content || schemaPrice.getAttribute('content');
      if (price) return cleanPriceText(price.trim());
    }
    
    // Strategy 2: Look for common price elements
    const priceSelectors = [
      '.product-price',
      '.price',
      '.current-price',
      '.sale-price',
      '#product-price',
      '.offer-price',
      '[data-price]',
      '.product-info__price',
      '.price-item--regular',
      '.price_range',
      '.price--main',
      '.product__price',
      '.product-single__price',
      '.woocommerce-Price-amount',
      '.a-price .a-offscreen', // Amazon
      '#priceblock_ourprice', // Amazon
      '.pdp-price span', // Home Depot, Build.com
      '[data-testid="product-price"]',
      '[class*="price"]'
    ];
    
    for (const selector of priceSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        // Check if it looks like a price (contains $ or other currency symbols)
        const text = element.textContent.trim();
        if (/[$€£¥₹]/.test(text) || /\d+\.\d{2}/.test(text)) {
          return cleanPriceText(text);
        }
      }
    }
    
    // Strategy 3: Simple regex search for price patterns in text
    const bodyText = document.body.textContent.substring(0, 10000); // Limit to first 10K chars for performance
    const priceRegex = /[$€£¥₹]\s*\d+(?:[.,]\d{2})?/g;
    const matches = bodyText.match(priceRegex);
    
    if (matches && matches.length > 0) {
      return cleanPriceText(matches[0]);
    }
  } catch (e) {
    console.error("Error finding product price:", e);
  }
  
  return null;
}

function findProductDimensions() {
  // Look for dimension information
  const dimensionSelectors = [
    '.product-dimensions',
    '.dimensions',
    '.specifications .dimensions',
    '[itemprop="height"], [itemprop="width"], [itemprop="depth"]',
    'tr:contains("Dimensions")',
    'dt:contains("Dimensions") + dd',
    'th:contains("Dimensions") + td'
  ];
  
  for (const selector of dimensionSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

function findProductDescription() {
  // Look for product description
  const descriptionSelectors = [
    '[itemprop="description"]',
    '.product-description',
    '.description',
    '#product-description',
    '#description',
    '.product__description',
    '.woocommerce-product-details__short-description'
  ];
  
  for (const selector of descriptionSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

function findProductSKU() {
  // Look for SKU/Model number
  const skuSelectors = [
    '[itemprop="sku"]',
    '[itemprop="mpn"]',
    '.product-sku',
    '.sku',
    '#product-sku',
    'dt:contains("SKU") + dd',
    'dt:contains("Model") + dd',
    'th:contains("SKU") + td',
    'th:contains("Model") + td',
    '[class*="sku"]',
    '[id*="sku"]',
    '[class*="product-id"]'
  ];
  
  for (const selector of skuSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

function findProductManufacturer() {
  // Look for manufacturer/brand
  const manufacturerSelectors = [
    '[itemprop="brand"]',
    '.product-brand',
    '.brand',
    '#product-brand',
    'dt:contains("Brand") + dd',
    'th:contains("Brand") + td',
    'dt:contains("Manufacturer") + dd',
    'th:contains("Manufacturer") + td',
    '[class*="brand"]',
    '[class*="manufacturer"]'
  ];
  
  for (const selector of manufacturerSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

// When page loads, notify background script that a product page was loaded
// This could be used to detect when the user is viewing a product
window.addEventListener('load', function() {
  // Only notify if this looks like a product page
  if (isProductPage()) {
    try {
      chrome.runtime.sendMessage({
        action: "productPageDetected",
        url: window.location.href
      }).catch(error => {
        console.error("Error sending product page detection message:", error);
      });
    } catch (error) {
      console.error("Failed to send product page detection:", error);
    }
  }
});

function isProductPage() {
  // Check for common indicators of a product page
  const productPageIndicators = [
    document.querySelector('[itemtype*="Product"]'),
    document.querySelector('meta[property="og:type"][content="product"]'),
    document.querySelector('.product-page'),
    document.querySelector('#product-page'),
    document.querySelector('.product-detail'),
    document.querySelector('.product-details'),
    document.querySelector('.single-product'),
    document.querySelector('.pdp-container'),
    document.querySelector('[data-testid="product-detail"]')
  ];
  
  return productPageIndicators.some(indicator => indicator !== null);
}

// Helper function to clean up price text
function cleanPriceText(text) {
  try {
    // Remove any non-price text (e.g., "Price:", "Our Price:", etc.)
    let cleaned = text.replace(/^(price|cost|our\s+price|sale\s+price|regular\s+price)[:;]\s*/i, '');
    
    // Remove any extra text after the price pattern
    const priceMatch = cleaned.match(/[$€£¥₹]?\s*\d+[.,]?\d{0,2}/);
    if (priceMatch) {
      cleaned = priceMatch[0];
    }
    
    // Ensure the price has a currency symbol
    if (!/[$€£¥₹]/.test(cleaned) && /\d/.test(cleaned)) {
      cleaned = '$' + cleaned.trim();
    }
    
    // Normalize spacing around currency symbol
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  } catch (e) {
    console.error("Error cleaning price text:", e);
    return text;
  }
} + price;
      }
      return cleanPriceText(finalPriceElement.textContent);
    }
    
    // Method 2: Look for data-final-price attribute (from screenshot)
    const dataFinalPrice = document.querySelector('[data-final-price]');
    if (dataFinalPrice) {
      console.log("Found price with data-final-price attribute:", dataFinalPrice.getAttribute('data-final-price'));
      return '

// Helper functions to find product information on the page
function findProductImage() {
  // Look for the most prominent image on the page
  // Strategy 1: Look for schema.org product image
  const schemaElements = document.querySelectorAll('[itemtype*="Product"] [itemprop="image"], [itemprop="image"]');
  if (schemaElements.length > 0) {
    const img = schemaElements[0];
    return img.src || img.content || img.getAttribute('content') || null;
  }
  
  // Strategy 2: Look for Open Graph image
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && ogImage.content) {
    return ogImage.content;
  }
  
  // Strategy 3: Look for common product image containers
  const productImageSelectors = [
    '.product-image img',
    '.product-photo img',
    '.product-media img',
    '.product-gallery img',
    '.product img',
    '#product-image',
    '#main-image',
    '.main-image',
    '.primary-image',
    '.featured-image img',
    '[id*="product"] img',
    '[class*="product"] img',
    '.gallery-image',
    '.product-gallery__hero img',
    '.product-media img',
    '.woocommerce-product-gallery__image img'
  ];
  
  for (const selector of productImageSelectors) {
    try {
      const img = document.querySelector(selector);
      if (img && img.src) {
        return img.src;
      }
    } catch (e) {
      // Handle any selector errors and continue
      continue;
    }
  }
  
  // Strategy 4: Find the largest image on the page that's likely a product image
  let largestImage = null;
  let largestArea = 0;
  
  const images = document.querySelectorAll('img');
  for (const img of images) {
    // Ignore tiny images, icons, logos
    if (img.width > 100 && img.height > 100) {
      const area = img.width * img.height;
      if (area > largestArea) {
        largestArea = area;
        largestImage = img.src;
      }
    }
  }
  
  return largestImage;
}

function findProductName() {
  // Strategy 1: Look for schema.org product name
  const schemaName = document.querySelector('[itemtype*="Product"] [itemprop="name"], [itemprop="name"]');
  if (schemaName) {
    return schemaName.textContent.trim();
  }
  
  // Strategy 2: Look for common product name elements
  const productNameSelectors = [
    'h1.product-name',
    'h1.product-title',
    '.product-name',
    '.product-title',
    'h1:first-of-type',
    '#product-name',
    '#product-title',
    '.product__title',
    '.product-single__title',
    '.product_title',
    '[class*="product-name"]',
    '[class*="product-title"]',
    '[id*="product-name"]',
    '[id*="product-title"]',
    // Target standard heading patterns
    'h1',
    // Target product detail pages with multiple h1 elements
    'main h1'
  ];
  
  for (const selector of productNameSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim() && element.textContent.length < 200) {
        return element.textContent.trim();
      }
    } catch (e) {
      // Handle any selector errors and continue
      continue;
    }
  }
  
  // Strategy 3: Use page title as fallback
  const title = document.title;
  if (title) {
    // Try to clean up the title (remove site name, etc.)
    const parts = title.split(/[|\-–—]/);
    if (parts.length > 1) {
      return parts[0].trim();
    }
    return title;
  }
  
  return null;
}

function findProductPrice() {
  try {
    // Strategy 1: Look for schema.org product price
    const schemaPrice = document.querySelector('[itemtype*="Product"] [itemprop="price"], [itemprop="offers"] [itemprop="price"], [itemprop="price"]');
    if (schemaPrice) {
      const price = schemaPrice.textContent || schemaPrice.content || schemaPrice.getAttribute('content');
      if (price) return cleanPriceText(price.trim());
    }
    
    // Strategy 2: Look for common price elements
    const priceSelectors = [
      '.product-price',
      '.price',
      '.current-price',
      '.sale-price',
      '#product-price',
      '.offer-price',
      '[data-price]',
      '.product-info__price',
      '.price-item--regular',
      '.price_range',
      '.price--main',
      '.product__price',
      '.product-single__price',
      '.woocommerce-Price-amount',
      '.a-price .a-offscreen', // Amazon
      '#priceblock_ourprice', // Amazon
      '.pdp-price span', // Home Depot, Build.com
      '[data-testid="product-price"]',
      '[class*="price"]'
    ];
    
    for (const selector of priceSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        // Check if it looks like a price (contains $ or other currency symbols)
        const text = element.textContent.trim();
        if (/[$€£¥₹]/.test(text) || /\d+\.\d{2}/.test(text)) {
          return cleanPriceText(text);
        }
      }
    }
    
    // Strategy 3: Simple regex search for price patterns in text
    const bodyText = document.body.textContent.substring(0, 10000); // Limit to first 10K chars for performance
    const priceRegex = /[$€£¥₹]\s*\d+(?:[.,]\d{2})?/g;
    const matches = bodyText.match(priceRegex);
    
    if (matches && matches.length > 0) {
      return cleanPriceText(matches[0]);
    }
  } catch (e) {
    console.error("Error finding product price:", e);
  }
  
  return null;
}

function findProductDimensions() {
  // Look for dimension information
  const dimensionSelectors = [
    '.product-dimensions',
    '.dimensions',
    '.specifications .dimensions',
    '[itemprop="height"], [itemprop="width"], [itemprop="depth"]',
    'tr:contains("Dimensions")',
    'dt:contains("Dimensions") + dd',
    'th:contains("Dimensions") + td'
  ];
  
  for (const selector of dimensionSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

function findProductDescription() {
  // Look for product description
  const descriptionSelectors = [
    '[itemprop="description"]',
    '.product-description',
    '.description',
    '#product-description',
    '#description',
    '.product__description',
    '.woocommerce-product-details__short-description'
  ];
  
  for (const selector of descriptionSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

function findProductSKU() {
  // Look for SKU/Model number
  const skuSelectors = [
    '[itemprop="sku"]',
    '[itemprop="mpn"]',
    '.product-sku',
    '.sku',
    '#product-sku',
    'dt:contains("SKU") + dd',
    'dt:contains("Model") + dd',
    'th:contains("SKU") + td',
    'th:contains("Model") + td',
    '[class*="sku"]',
    '[id*="sku"]',
    '[class*="product-id"]'
  ];
  
  for (const selector of skuSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

function findProductManufacturer() {
  // Look for manufacturer/brand
  const manufacturerSelectors = [
    '[itemprop="brand"]',
    '.product-brand',
    '.brand',
    '#product-brand',
    'dt:contains("Brand") + dd',
    'th:contains("Brand") + td',
    'dt:contains("Manufacturer") + dd',
    'th:contains("Manufacturer") + td',
    '[class*="brand"]',
    '[class*="manufacturer"]'
  ];
  
  for (const selector of manufacturerSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

// When page loads, notify background script that a product page was loaded
// This could be used to detect when the user is viewing a product
window.addEventListener('load', function() {
  // Only notify if this looks like a product page
  if (isProductPage()) {
    try {
      chrome.runtime.sendMessage({
        action: "productPageDetected",
        url: window.location.href
      }).catch(error => {
        console.error("Error sending product page detection message:", error);
      });
    } catch (error) {
      console.error("Failed to send product page detection:", error);
    }
  }
});

function isProductPage() {
  // Check for common indicators of a product page
  const productPageIndicators = [
    document.querySelector('[itemtype*="Product"]'),
    document.querySelector('meta[property="og:type"][content="product"]'),
    document.querySelector('.product-page'),
    document.querySelector('#product-page'),
    document.querySelector('.product-detail'),
    document.querySelector('.product-details'),
    document.querySelector('.single-product'),
    document.querySelector('.pdp-container'),
    document.querySelector('[data-testid="product-detail"]')
  ];
  
  return productPageIndicators.some(indicator => indicator !== null);
}

// Helper function to clean up price text
function cleanPriceText(text) {
  try {
    // Remove any non-price text (e.g., "Price:", "Our Price:", etc.)
    let cleaned = text.replace(/^(price|cost|our\s+price|sale\s+price|regular\s+price)[:;]\s*/i, '');
    
    // Remove any extra text after the price pattern
    const priceMatch = cleaned.match(/[$€£¥₹]?\s*\d+[.,]?\d{0,2}/);
    if (priceMatch) {
      cleaned = priceMatch[0];
    }
    
    // Ensure the price has a currency symbol
    if (!/[$€£¥₹]/.test(cleaned) && /\d/.test(cleaned)) {
      cleaned = '$' + cleaned.trim();
    }
    
    // Normalize spacing around currency symbol
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  } catch (e) {
    console.error("Error cleaning price text:", e);
    return text;
  }
} + dataFinalPrice.getAttribute('data-final-price');
    }
    
    // Method 3: Look for price-big-val class (from screenshot)
    const priceBigVal = document.querySelector('.price-big-val');
    if (priceBigVal) {
      // Need to find the dollar sign and possibly the cents
      const dollarSign = document.querySelector('.price-dollar-sign');
      
      console.log("Found price-big-val:", priceBigVal.textContent);
      
      // Get price components
      const mainPrice = priceBigVal.textContent.trim().replace(/,/g, '');
      
      // Check if there's a "price after rebate" section
      const priceAfterRebate = document.querySelector('.price-after-rebate, [class*="rebate"]');
      if (priceAfterRebate) {
        const rebateText = priceAfterRebate.textContent;
        const rebateMatch = rebateText.match(/\$?([\d,]+\.\d{2})/);
        if (rebateMatch) {
          console.log("Found rebate price:", rebateMatch[0]);
          return rebateMatch[0].startsWith('

// Helper functions to find product information on the page
function findProductImage() {
  // Look for the most prominent image on the page
  // Strategy 1: Look for schema.org product image
  const schemaElements = document.querySelectorAll('[itemtype*="Product"] [itemprop="image"], [itemprop="image"]');
  if (schemaElements.length > 0) {
    const img = schemaElements[0];
    return img.src || img.content || img.getAttribute('content') || null;
  }
  
  // Strategy 2: Look for Open Graph image
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && ogImage.content) {
    return ogImage.content;
  }
  
  // Strategy 3: Look for common product image containers
  const productImageSelectors = [
    '.product-image img',
    '.product-photo img',
    '.product-media img',
    '.product-gallery img',
    '.product img',
    '#product-image',
    '#main-image',
    '.main-image',
    '.primary-image',
    '.featured-image img',
    '[id*="product"] img',
    '[class*="product"] img',
    '.gallery-image',
    '.product-gallery__hero img',
    '.product-media img',
    '.woocommerce-product-gallery__image img'
  ];
  
  for (const selector of productImageSelectors) {
    try {
      const img = document.querySelector(selector);
      if (img && img.src) {
        return img.src;
      }
    } catch (e) {
      // Handle any selector errors and continue
      continue;
    }
  }
  
  // Strategy 4: Find the largest image on the page that's likely a product image
  let largestImage = null;
  let largestArea = 0;
  
  const images = document.querySelectorAll('img');
  for (const img of images) {
    // Ignore tiny images, icons, logos
    if (img.width > 100 && img.height > 100) {
      const area = img.width * img.height;
      if (area > largestArea) {
        largestArea = area;
        largestImage = img.src;
      }
    }
  }
  
  return largestImage;
}

function findProductName() {
  // Strategy 1: Look for schema.org product name
  const schemaName = document.querySelector('[itemtype*="Product"] [itemprop="name"], [itemprop="name"]');
  if (schemaName) {
    return schemaName.textContent.trim();
  }
  
  // Strategy 2: Look for common product name elements
  const productNameSelectors = [
    'h1.product-name',
    'h1.product-title',
    '.product-name',
    '.product-title',
    'h1:first-of-type',
    '#product-name',
    '#product-title',
    '.product__title',
    '.product-single__title',
    '.product_title',
    '[class*="product-name"]',
    '[class*="product-title"]',
    '[id*="product-name"]',
    '[id*="product-title"]',
    // Target standard heading patterns
    'h1',
    // Target product detail pages with multiple h1 elements
    'main h1'
  ];
  
  for (const selector of productNameSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim() && element.textContent.length < 200) {
        return element.textContent.trim();
      }
    } catch (e) {
      // Handle any selector errors and continue
      continue;
    }
  }
  
  // Strategy 3: Use page title as fallback
  const title = document.title;
  if (title) {
    // Try to clean up the title (remove site name, etc.)
    const parts = title.split(/[|\-–—]/);
    if (parts.length > 1) {
      return parts[0].trim();
    }
    return title;
  }
  
  return null;
}

function findProductPrice() {
  try {
    // Strategy 1: Look for schema.org product price
    const schemaPrice = document.querySelector('[itemtype*="Product"] [itemprop="price"], [itemprop="offers"] [itemprop="price"], [itemprop="price"]');
    if (schemaPrice) {
      const price = schemaPrice.textContent || schemaPrice.content || schemaPrice.getAttribute('content');
      if (price) return cleanPriceText(price.trim());
    }
    
    // Strategy 2: Look for common price elements
    const priceSelectors = [
      '.product-price',
      '.price',
      '.current-price',
      '.sale-price',
      '#product-price',
      '.offer-price',
      '[data-price]',
      '.product-info__price',
      '.price-item--regular',
      '.price_range',
      '.price--main',
      '.product__price',
      '.product-single__price',
      '.woocommerce-Price-amount',
      '.a-price .a-offscreen', // Amazon
      '#priceblock_ourprice', // Amazon
      '.pdp-price span', // Home Depot, Build.com
      '[data-testid="product-price"]',
      '[class*="price"]'
    ];
    
    for (const selector of priceSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        // Check if it looks like a price (contains $ or other currency symbols)
        const text = element.textContent.trim();
        if (/[$€£¥₹]/.test(text) || /\d+\.\d{2}/.test(text)) {
          return cleanPriceText(text);
        }
      }
    }
    
    // Strategy 3: Simple regex search for price patterns in text
    const bodyText = document.body.textContent.substring(0, 10000); // Limit to first 10K chars for performance
    const priceRegex = /[$€£¥₹]\s*\d+(?:[.,]\d{2})?/g;
    const matches = bodyText.match(priceRegex);
    
    if (matches && matches.length > 0) {
      return cleanPriceText(matches[0]);
    }
  } catch (e) {
    console.error("Error finding product price:", e);
  }
  
  return null;
}

function findProductDimensions() {
  // Look for dimension information
  const dimensionSelectors = [
    '.product-dimensions',
    '.dimensions',
    '.specifications .dimensions',
    '[itemprop="height"], [itemprop="width"], [itemprop="depth"]',
    'tr:contains("Dimensions")',
    'dt:contains("Dimensions") + dd',
    'th:contains("Dimensions") + td'
  ];
  
  for (const selector of dimensionSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

function findProductDescription() {
  // Look for product description
  const descriptionSelectors = [
    '[itemprop="description"]',
    '.product-description',
    '.description',
    '#product-description',
    '#description',
    '.product__description',
    '.woocommerce-product-details__short-description'
  ];
  
  for (const selector of descriptionSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

function findProductSKU() {
  // Look for SKU/Model number
  const skuSelectors = [
    '[itemprop="sku"]',
    '[itemprop="mpn"]',
    '.product-sku',
    '.sku',
    '#product-sku',
    'dt:contains("SKU") + dd',
    'dt:contains("Model") + dd',
    'th:contains("SKU") + td',
    'th:contains("Model") + td',
    '[class*="sku"]',
    '[id*="sku"]',
    '[class*="product-id"]'
  ];
  
  for (const selector of skuSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

function findProductManufacturer() {
  // Look for manufacturer/brand
  const manufacturerSelectors = [
    '[itemprop="brand"]',
    '.product-brand',
    '.brand',
    '#product-brand',
    'dt:contains("Brand") + dd',
    'th:contains("Brand") + td',
    'dt:contains("Manufacturer") + dd',
    'th:contains("Manufacturer") + td',
    '[class*="brand"]',
    '[class*="manufacturer"]'
  ];
  
  for (const selector of manufacturerSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

// When page loads, notify background script that a product page was loaded
// This could be used to detect when the user is viewing a product
window.addEventListener('load', function() {
  // Only notify if this looks like a product page
  if (isProductPage()) {
    try {
      chrome.runtime.sendMessage({
        action: "productPageDetected",
        url: window.location.href
      }).catch(error => {
        console.error("Error sending product page detection message:", error);
      });
    } catch (error) {
      console.error("Failed to send product page detection:", error);
    }
  }
});

function isProductPage() {
  // Check for common indicators of a product page
  const productPageIndicators = [
    document.querySelector('[itemtype*="Product"]'),
    document.querySelector('meta[property="og:type"][content="product"]'),
    document.querySelector('.product-page'),
    document.querySelector('#product-page'),
    document.querySelector('.product-detail'),
    document.querySelector('.product-details'),
    document.querySelector('.single-product'),
    document.querySelector('.pdp-container'),
    document.querySelector('[data-testid="product-detail"]')
  ];
  
  return productPageIndicators.some(indicator => indicator !== null);
}

// Helper function to clean up price text
function cleanPriceText(text) {
  try {
    // Remove any non-price text (e.g., "Price:", "Our Price:", etc.)
    let cleaned = text.replace(/^(price|cost|our\s+price|sale\s+price|regular\s+price)[:;]\s*/i, '');
    
    // Remove any extra text after the price pattern
    const priceMatch = cleaned.match(/[$€£¥₹]?\s*\d+[.,]?\d{0,2}/);
    if (priceMatch) {
      cleaned = priceMatch[0];
    }
    
    // Ensure the price has a currency symbol
    if (!/[$€£¥₹]/.test(cleaned) && /\d/.test(cleaned)) {
      cleaned = '$' + cleaned.trim();
    }
    
    // Normalize spacing around currency symbol
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  } catch (e) {
    console.error("Error cleaning price text:", e);
    return text;
  }
}) ? rebateMatch[0] : '

// Helper functions to find product information on the page
function findProductImage() {
  // Look for the most prominent image on the page
  // Strategy 1: Look for schema.org product image
  const schemaElements = document.querySelectorAll('[itemtype*="Product"] [itemprop="image"], [itemprop="image"]');
  if (schemaElements.length > 0) {
    const img = schemaElements[0];
    return img.src || img.content || img.getAttribute('content') || null;
  }
  
  // Strategy 2: Look for Open Graph image
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && ogImage.content) {
    return ogImage.content;
  }
  
  // Strategy 3: Look for common product image containers
  const productImageSelectors = [
    '.product-image img',
    '.product-photo img',
    '.product-media img',
    '.product-gallery img',
    '.product img',
    '#product-image',
    '#main-image',
    '.main-image',
    '.primary-image',
    '.featured-image img',
    '[id*="product"] img',
    '[class*="product"] img',
    '.gallery-image',
    '.product-gallery__hero img',
    '.product-media img',
    '.woocommerce-product-gallery__image img'
  ];
  
  for (const selector of productImageSelectors) {
    try {
      const img = document.querySelector(selector);
      if (img && img.src) {
        return img.src;
      }
    } catch (e) {
      // Handle any selector errors and continue
      continue;
    }
  }
  
  // Strategy 4: Find the largest image on the page that's likely a product image
  let largestImage = null;
  let largestArea = 0;
  
  const images = document.querySelectorAll('img');
  for (const img of images) {
    // Ignore tiny images, icons, logos
    if (img.width > 100 && img.height > 100) {
      const area = img.width * img.height;
      if (area > largestArea) {
        largestArea = area;
        largestImage = img.src;
      }
    }
  }
  
  return largestImage;
}

function findProductName() {
  // Strategy 1: Look for schema.org product name
  const schemaName = document.querySelector('[itemtype*="Product"] [itemprop="name"], [itemprop="name"]');
  if (schemaName) {
    return schemaName.textContent.trim();
  }
  
  // Strategy 2: Look for common product name elements
  const productNameSelectors = [
    'h1.product-name',
    'h1.product-title',
    '.product-name',
    '.product-title',
    'h1:first-of-type',
    '#product-name',
    '#product-title',
    '.product__title',
    '.product-single__title',
    '.product_title',
    '[class*="product-name"]',
    '[class*="product-title"]',
    '[id*="product-name"]',
    '[id*="product-title"]',
    // Target standard heading patterns
    'h1',
    // Target product detail pages with multiple h1 elements
    'main h1'
  ];
  
  for (const selector of productNameSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim() && element.textContent.length < 200) {
        return element.textContent.trim();
      }
    } catch (e) {
      // Handle any selector errors and continue
      continue;
    }
  }
  
  // Strategy 3: Use page title as fallback
  const title = document.title;
  if (title) {
    // Try to clean up the title (remove site name, etc.)
    const parts = title.split(/[|\-–—]/);
    if (parts.length > 1) {
      return parts[0].trim();
    }
    return title;
  }
  
  return null;
}

function findProductPrice() {
  try {
    // Strategy 1: Look for schema.org product price
    const schemaPrice = document.querySelector('[itemtype*="Product"] [itemprop="price"], [itemprop="offers"] [itemprop="price"], [itemprop="price"]');
    if (schemaPrice) {
      const price = schemaPrice.textContent || schemaPrice.content || schemaPrice.getAttribute('content');
      if (price) return cleanPriceText(price.trim());
    }
    
    // Strategy 2: Look for common price elements
    const priceSelectors = [
      '.product-price',
      '.price',
      '.current-price',
      '.sale-price',
      '#product-price',
      '.offer-price',
      '[data-price]',
      '.product-info__price',
      '.price-item--regular',
      '.price_range',
      '.price--main',
      '.product__price',
      '.product-single__price',
      '.woocommerce-Price-amount',
      '.a-price .a-offscreen', // Amazon
      '#priceblock_ourprice', // Amazon
      '.pdp-price span', // Home Depot, Build.com
      '[data-testid="product-price"]',
      '[class*="price"]'
    ];
    
    for (const selector of priceSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        // Check if it looks like a price (contains $ or other currency symbols)
        const text = element.textContent.trim();
        if (/[$€£¥₹]/.test(text) || /\d+\.\d{2}/.test(text)) {
          return cleanPriceText(text);
        }
      }
    }
    
    // Strategy 3: Simple regex search for price patterns in text
    const bodyText = document.body.textContent.substring(0, 10000); // Limit to first 10K chars for performance
    const priceRegex = /[$€£¥₹]\s*\d+(?:[.,]\d{2})?/g;
    const matches = bodyText.match(priceRegex);
    
    if (matches && matches.length > 0) {
      return cleanPriceText(matches[0]);
    }
  } catch (e) {
    console.error("Error finding product price:", e);
  }
  
  return null;
}

function findProductDimensions() {
  // Look for dimension information
  const dimensionSelectors = [
    '.product-dimensions',
    '.dimensions',
    '.specifications .dimensions',
    '[itemprop="height"], [itemprop="width"], [itemprop="depth"]',
    'tr:contains("Dimensions")',
    'dt:contains("Dimensions") + dd',
    'th:contains("Dimensions") + td'
  ];
  
  for (const selector of dimensionSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

function findProductDescription() {
  // Look for product description
  const descriptionSelectors = [
    '[itemprop="description"]',
    '.product-description',
    '.description',
    '#product-description',
    '#description',
    '.product__description',
    '.woocommerce-product-details__short-description'
  ];
  
  for (const selector of descriptionSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

function findProductSKU() {
  // Look for SKU/Model number
  const skuSelectors = [
    '[itemprop="sku"]',
    '[itemprop="mpn"]',
    '.product-sku',
    '.sku',
    '#product-sku',
    'dt:contains("SKU") + dd',
    'dt:contains("Model") + dd',
    'th:contains("SKU") + td',
    'th:contains("Model") + td',
    '[class*="sku"]',
    '[id*="sku"]',
    '[class*="product-id"]'
  ];
  
  for (const selector of skuSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

function findProductManufacturer() {
  // Look for manufacturer/brand
  const manufacturerSelectors = [
    '[itemprop="brand"]',
    '.product-brand',
    '.brand',
    '#product-brand',
    'dt:contains("Brand") + dd',
    'th:contains("Brand") + td',
    'dt:contains("Manufacturer") + dd',
    'th:contains("Manufacturer") + td',
    '[class*="brand"]',
    '[class*="manufacturer"]'
  ];
  
  for (const selector of manufacturerSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

// When page loads, notify background script that a product page was loaded
// This could be used to detect when the user is viewing a product
window.addEventListener('load', function() {
  // Only notify if this looks like a product page
  if (isProductPage()) {
    try {
      chrome.runtime.sendMessage({
        action: "productPageDetected",
        url: window.location.href
      }).catch(error => {
        console.error("Error sending product page detection message:", error);
      });
    } catch (error) {
      console.error("Failed to send product page detection:", error);
    }
  }
});

function isProductPage() {
  // Check for common indicators of a product page
  const productPageIndicators = [
    document.querySelector('[itemtype*="Product"]'),
    document.querySelector('meta[property="og:type"][content="product"]'),
    document.querySelector('.product-page'),
    document.querySelector('#product-page'),
    document.querySelector('.product-detail'),
    document.querySelector('.product-details'),
    document.querySelector('.single-product'),
    document.querySelector('.pdp-container'),
    document.querySelector('[data-testid="product-detail"]')
  ];
  
  return productPageIndicators.some(indicator => indicator !== null);
}

// Helper function to clean up price text
function cleanPriceText(text) {
  try {
    // Remove any non-price text (e.g., "Price:", "Our Price:", etc.)
    let cleaned = text.replace(/^(price|cost|our\s+price|sale\s+price|regular\s+price)[:;]\s*/i, '');
    
    // Remove any extra text after the price pattern
    const priceMatch = cleaned.match(/[$€£¥₹]?\s*\d+[.,]?\d{0,2}/);
    if (priceMatch) {
      cleaned = priceMatch[0];
    }
    
    // Ensure the price has a currency symbol
    if (!/[$€£¥₹]/.test(cleaned) && /\d/.test(cleaned)) {
      cleaned = '$' + cleaned.trim();
    }
    
    // Normalize spacing around currency symbol
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  } catch (e) {
    console.error("Error cleaning price text:", e);
    return text;
  }
} + rebateMatch[0];
        }
      }
      
      // If we have the main price, construct the full price
      if (mainPrice) {
        // Look for cents or use .00
        const centsElement = document.querySelector('.price-small-val, .cents, [class*="cents"]');
        const cents = centsElement ? centsElement.textContent.trim() : '00';
        
        const fullPrice = '

// Helper functions to find product information on the page
function findProductImage() {
  // Look for the most prominent image on the page
  // Strategy 1: Look for schema.org product image
  const schemaElements = document.querySelectorAll('[itemtype*="Product"] [itemprop="image"], [itemprop="image"]');
  if (schemaElements.length > 0) {
    const img = schemaElements[0];
    return img.src || img.content || img.getAttribute('content') || null;
  }
  
  // Strategy 2: Look for Open Graph image
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && ogImage.content) {
    return ogImage.content;
  }
  
  // Strategy 3: Look for common product image containers
  const productImageSelectors = [
    '.product-image img',
    '.product-photo img',
    '.product-media img',
    '.product-gallery img',
    '.product img',
    '#product-image',
    '#main-image',
    '.main-image',
    '.primary-image',
    '.featured-image img',
    '[id*="product"] img',
    '[class*="product"] img',
    '.gallery-image',
    '.product-gallery__hero img',
    '.product-media img',
    '.woocommerce-product-gallery__image img'
  ];
  
  for (const selector of productImageSelectors) {
    try {
      const img = document.querySelector(selector);
      if (img && img.src) {
        return img.src;
      }
    } catch (e) {
      // Handle any selector errors and continue
      continue;
    }
  }
  
  // Strategy 4: Find the largest image on the page that's likely a product image
  let largestImage = null;
  let largestArea = 0;
  
  const images = document.querySelectorAll('img');
  for (const img of images) {
    // Ignore tiny images, icons, logos
    if (img.width > 100 && img.height > 100) {
      const area = img.width * img.height;
      if (area > largestArea) {
        largestArea = area;
        largestImage = img.src;
      }
    }
  }
  
  return largestImage;
}

function findProductName() {
  // Strategy 1: Look for schema.org product name
  const schemaName = document.querySelector('[itemtype*="Product"] [itemprop="name"], [itemprop="name"]');
  if (schemaName) {
    return schemaName.textContent.trim();
  }
  
  // Strategy 2: Look for common product name elements
  const productNameSelectors = [
    'h1.product-name',
    'h1.product-title',
    '.product-name',
    '.product-title',
    'h1:first-of-type',
    '#product-name',
    '#product-title',
    '.product__title',
    '.product-single__title',
    '.product_title',
    '[class*="product-name"]',
    '[class*="product-title"]',
    '[id*="product-name"]',
    '[id*="product-title"]',
    // Target standard heading patterns
    'h1',
    // Target product detail pages with multiple h1 elements
    'main h1'
  ];
  
  for (const selector of productNameSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim() && element.textContent.length < 200) {
        return element.textContent.trim();
      }
    } catch (e) {
      // Handle any selector errors and continue
      continue;
    }
  }
  
  // Strategy 3: Use page title as fallback
  const title = document.title;
  if (title) {
    // Try to clean up the title (remove site name, etc.)
    const parts = title.split(/[|\-–—]/);
    if (parts.length > 1) {
      return parts[0].trim();
    }
    return title;
  }
  
  return null;
}

function findProductPrice() {
  try {
    // Strategy 1: Look for schema.org product price
    const schemaPrice = document.querySelector('[itemtype*="Product"] [itemprop="price"], [itemprop="offers"] [itemprop="price"], [itemprop="price"]');
    if (schemaPrice) {
      const price = schemaPrice.textContent || schemaPrice.content || schemaPrice.getAttribute('content');
      if (price) return cleanPriceText(price.trim());
    }
    
    // Strategy 2: Look for common price elements
    const priceSelectors = [
      '.product-price',
      '.price',
      '.current-price',
      '.sale-price',
      '#product-price',
      '.offer-price',
      '[data-price]',
      '.product-info__price',
      '.price-item--regular',
      '.price_range',
      '.price--main',
      '.product__price',
      '.product-single__price',
      '.woocommerce-Price-amount',
      '.a-price .a-offscreen', // Amazon
      '#priceblock_ourprice', // Amazon
      '.pdp-price span', // Home Depot, Build.com
      '[data-testid="product-price"]',
      '[class*="price"]'
    ];
    
    for (const selector of priceSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        // Check if it looks like a price (contains $ or other currency symbols)
        const text = element.textContent.trim();
        if (/[$€£¥₹]/.test(text) || /\d+\.\d{2}/.test(text)) {
          return cleanPriceText(text);
        }
      }
    }
    
    // Strategy 3: Simple regex search for price patterns in text
    const bodyText = document.body.textContent.substring(0, 10000); // Limit to first 10K chars for performance
    const priceRegex = /[$€£¥₹]\s*\d+(?:[.,]\d{2})?/g;
    const matches = bodyText.match(priceRegex);
    
    if (matches && matches.length > 0) {
      return cleanPriceText(matches[0]);
    }
  } catch (e) {
    console.error("Error finding product price:", e);
  }
  
  return null;
}

function findProductDimensions() {
  // Look for dimension information
  const dimensionSelectors = [
    '.product-dimensions',
    '.dimensions',
    '.specifications .dimensions',
    '[itemprop="height"], [itemprop="width"], [itemprop="depth"]',
    'tr:contains("Dimensions")',
    'dt:contains("Dimensions") + dd',
    'th:contains("Dimensions") + td'
  ];
  
  for (const selector of dimensionSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

function findProductDescription() {
  // Look for product description
  const descriptionSelectors = [
    '[itemprop="description"]',
    '.product-description',
    '.description',
    '#product-description',
    '#description',
    '.product__description',
    '.woocommerce-product-details__short-description'
  ];
  
  for (const selector of descriptionSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

function findProductSKU() {
  // Look for SKU/Model number
  const skuSelectors = [
    '[itemprop="sku"]',
    '[itemprop="mpn"]',
    '.product-sku',
    '.sku',
    '#product-sku',
    'dt:contains("SKU") + dd',
    'dt:contains("Model") + dd',
    'th:contains("SKU") + td',
    'th:contains("Model") + td',
    '[class*="sku"]',
    '[id*="sku"]',
    '[class*="product-id"]'
  ];
  
  for (const selector of skuSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

function findProductManufacturer() {
  // Look for manufacturer/brand
  const manufacturerSelectors = [
    '[itemprop="brand"]',
    '.product-brand',
    '.brand',
    '#product-brand',
    'dt:contains("Brand") + dd',
    'th:contains("Brand") + td',
    'dt:contains("Manufacturer") + dd',
    'th:contains("Manufacturer") + td',
    '[class*="brand"]',
    '[class*="manufacturer"]'
  ];
  
  for (const selector of manufacturerSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

// When page loads, notify background script that a product page was loaded
// This could be used to detect when the user is viewing a product
window.addEventListener('load', function() {
  // Only notify if this looks like a product page
  if (isProductPage()) {
    try {
      chrome.runtime.sendMessage({
        action: "productPageDetected",
        url: window.location.href
      }).catch(error => {
        console.error("Error sending product page detection message:", error);
      });
    } catch (error) {
      console.error("Failed to send product page detection:", error);
    }
  }
});

function isProductPage() {
  // Check for common indicators of a product page
  const productPageIndicators = [
    document.querySelector('[itemtype*="Product"]'),
    document.querySelector('meta[property="og:type"][content="product"]'),
    document.querySelector('.product-page'),
    document.querySelector('#product-page'),
    document.querySelector('.product-detail'),
    document.querySelector('.product-details'),
    document.querySelector('.single-product'),
    document.querySelector('.pdp-container'),
    document.querySelector('[data-testid="product-detail"]')
  ];
  
  return productPageIndicators.some(indicator => indicator !== null);
}

// Helper function to clean up price text
function cleanPriceText(text) {
  try {
    // Remove any non-price text (e.g., "Price:", "Our Price:", etc.)
    let cleaned = text.replace(/^(price|cost|our\s+price|sale\s+price|regular\s+price)[:;]\s*/i, '');
    
    // Remove any extra text after the price pattern
    const priceMatch = cleaned.match(/[$€£¥₹]?\s*\d+[.,]?\d{0,2}/);
    if (priceMatch) {
      cleaned = priceMatch[0];
    }
    
    // Ensure the price has a currency symbol
    if (!/[$€£¥₹]/.test(cleaned) && /\d/.test(cleaned)) {
      cleaned = '$' + cleaned.trim();
    }
    
    // Normalize spacing around currency symbol
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  } catch (e) {
    console.error("Error cleaning price text:", e);
    return text;
  }
} + mainPrice + (cents.includes('.') ? cents : '.' + cents);
        console.log("Constructed full price:", fullPrice);
        return fullPrice;
      }
    }
    
    // Method 4: Look for a large price display in specific format
    const priceElements = document.querySelectorAll('span[class*="price"], div[class*="price"]');
    for (const element of priceElements) {
      if (element.textContent && /^\$?[\d,]+\.\d{2}$/.test(element.textContent.trim())) {
        console.log("Found formatted price element:", element.textContent);
        return cleanPriceText(element.textContent);
      }
    }
    
    // Method 5: Look for PRICE AFTER REBATE* section
    const priceAfter = document.querySelector('[class*="price-after"], [class*="priceAfter"]');
    if (priceAfter) {
      const text = priceAfter.textContent;
      console.log("Found price after section:", text);
      const match = text.match(/\$?[\d,]+\.?\d{0,2}/);
      if (match) {
        return cleanPriceText(match[0]);
      }
    }
    
    // Fallback to generic method
    return findProductPrice();
  } catch (error) {
    console.error("Error extracting Menards price:", error);
    return findProductPrice(); // Fallback to generic method
  }
}

// Helper functions to find product information on the page
function findProductImage() {
  // Look for the most prominent image on the page
  // Strategy 1: Look for schema.org product image
  const schemaElements = document.querySelectorAll('[itemtype*="Product"] [itemprop="image"], [itemprop="image"]');
  if (schemaElements.length > 0) {
    const img = schemaElements[0];
    return img.src || img.content || img.getAttribute('content') || null;
  }
  
  // Strategy 2: Look for Open Graph image
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && ogImage.content) {
    return ogImage.content;
  }
  
  // Strategy 3: Look for common product image containers
  const productImageSelectors = [
    '.product-image img',
    '.product-photo img',
    '.product-media img',
    '.product-gallery img',
    '.product img',
    '#product-image',
    '#main-image',
    '.main-image',
    '.primary-image',
    '.featured-image img',
    '[id*="product"] img',
    '[class*="product"] img',
    '.gallery-image',
    '.product-gallery__hero img',
    '.product-media img',
    '.woocommerce-product-gallery__image img'
  ];
  
  for (const selector of productImageSelectors) {
    try {
      const img = document.querySelector(selector);
      if (img && img.src) {
        return img.src;
      }
    } catch (e) {
      // Handle any selector errors and continue
      continue;
    }
  }
  
  // Strategy 4: Find the largest image on the page that's likely a product image
  let largestImage = null;
  let largestArea = 0;
  
  const images = document.querySelectorAll('img');
  for (const img of images) {
    // Ignore tiny images, icons, logos
    if (img.width > 100 && img.height > 100) {
      const area = img.width * img.height;
      if (area > largestArea) {
        largestArea = area;
        largestImage = img.src;
      }
    }
  }
  
  return largestImage;
}

function findProductName() {
  // Strategy 1: Look for schema.org product name
  const schemaName = document.querySelector('[itemtype*="Product"] [itemprop="name"], [itemprop="name"]');
  if (schemaName) {
    return schemaName.textContent.trim();
  }
  
  // Strategy 2: Look for common product name elements
  const productNameSelectors = [
    'h1.product-name',
    'h1.product-title',
    '.product-name',
    '.product-title',
    'h1:first-of-type',
    '#product-name',
    '#product-title',
    '.product__title',
    '.product-single__title',
    '.product_title',
    '[class*="product-name"]',
    '[class*="product-title"]',
    '[id*="product-name"]',
    '[id*="product-title"]',
    // Target standard heading patterns
    'h1',
    // Target product detail pages with multiple h1 elements
    'main h1'
  ];
  
  for (const selector of productNameSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim() && element.textContent.length < 200) {
        return element.textContent.trim();
      }
    } catch (e) {
      // Handle any selector errors and continue
      continue;
    }
  }
  
  // Strategy 3: Use page title as fallback
  const title = document.title;
  if (title) {
    // Try to clean up the title (remove site name, etc.)
    const parts = title.split(/[|\-–—]/);
    if (parts.length > 1) {
      return parts[0].trim();
    }
    return title;
  }
  
  return null;
}

function findProductPrice() {
  try {
    // Strategy 1: Look for schema.org product price
    const schemaPrice = document.querySelector('[itemtype*="Product"] [itemprop="price"], [itemprop="offers"] [itemprop="price"], [itemprop="price"]');
    if (schemaPrice) {
      const price = schemaPrice.textContent || schemaPrice.content || schemaPrice.getAttribute('content');
      if (price) return cleanPriceText(price.trim());
    }
    
    // Strategy 2: Look for common price elements
    const priceSelectors = [
      '.product-price',
      '.price',
      '.current-price',
      '.sale-price',
      '#product-price',
      '.offer-price',
      '[data-price]',
      '.product-info__price',
      '.price-item--regular',
      '.price_range',
      '.price--main',
      '.product__price',
      '.product-single__price',
      '.woocommerce-Price-amount',
      '.a-price .a-offscreen', // Amazon
      '#priceblock_ourprice', // Amazon
      '.pdp-price span', // Home Depot, Build.com
      '[data-testid="product-price"]',
      '[class*="price"]'
    ];
    
    for (const selector of priceSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        // Check if it looks like a price (contains $ or other currency symbols)
        const text = element.textContent.trim();
        if (/[$€£¥₹]/.test(text) || /\d+\.\d{2}/.test(text)) {
          return cleanPriceText(text);
        }
      }
    }
    
    // Strategy 3: Simple regex search for price patterns in text
    const bodyText = document.body.textContent.substring(0, 10000); // Limit to first 10K chars for performance
    const priceRegex = /[$€£¥₹]\s*\d+(?:[.,]\d{2})?/g;
    const matches = bodyText.match(priceRegex);
    
    if (matches && matches.length > 0) {
      return cleanPriceText(matches[0]);
    }
  } catch (e) {
    console.error("Error finding product price:", e);
  }
  
  return null;
}

function findProductDimensions() {
  // Look for dimension information
  const dimensionSelectors = [
    '.product-dimensions',
    '.dimensions',
    '.specifications .dimensions',
    '[itemprop="height"], [itemprop="width"], [itemprop="depth"]',
    'tr:contains("Dimensions")',
    'dt:contains("Dimensions") + dd',
    'th:contains("Dimensions") + td'
  ];
  
  for (const selector of dimensionSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

function findProductDescription() {
  // Look for product description
  const descriptionSelectors = [
    '[itemprop="description"]',
    '.product-description',
    '.description',
    '#product-description',
    '#description',
    '.product__description',
    '.woocommerce-product-details__short-description'
  ];
  
  for (const selector of descriptionSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

function findProductSKU() {
  // Look for SKU/Model number
  const skuSelectors = [
    '[itemprop="sku"]',
    '[itemprop="mpn"]',
    '.product-sku',
    '.sku',
    '#product-sku',
    'dt:contains("SKU") + dd',
    'dt:contains("Model") + dd',
    'th:contains("SKU") + td',
    'th:contains("Model") + td',
    '[class*="sku"]',
    '[id*="sku"]',
    '[class*="product-id"]'
  ];
  
  for (const selector of skuSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

function findProductManufacturer() {
  // Look for manufacturer/brand
  const manufacturerSelectors = [
    '[itemprop="brand"]',
    '.product-brand',
    '.brand',
    '#product-brand',
    'dt:contains("Brand") + dd',
    'th:contains("Brand") + td',
    'dt:contains("Manufacturer") + dd',
    'th:contains("Manufacturer") + td',
    '[class*="brand"]',
    '[class*="manufacturer"]'
  ];
  
  for (const selector of manufacturerSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

// When page loads, notify background script that a product page was loaded
// This could be used to detect when the user is viewing a product
window.addEventListener('load', function() {
  // Only notify if this looks like a product page
  if (isProductPage()) {
    try {
      chrome.runtime.sendMessage({
        action: "productPageDetected",
        url: window.location.href
      }).catch(error => {
        console.error("Error sending product page detection message:", error);
      });
    } catch (error) {
      console.error("Failed to send product page detection:", error);
    }
  }
});

function isProductPage() {
  // Check for common indicators of a product page
  const productPageIndicators = [
    document.querySelector('[itemtype*="Product"]'),
    document.querySelector('meta[property="og:type"][content="product"]'),
    document.querySelector('.product-page'),
    document.querySelector('#product-page'),
    document.querySelector('.product-detail'),
    document.querySelector('.product-details'),
    document.querySelector('.single-product'),
    document.querySelector('.pdp-container'),
    document.querySelector('[data-testid="product-detail"]')
  ];
  
  return productPageIndicators.some(indicator => indicator !== null);
}

// Helper function to clean up price text
function cleanPriceText(text) {
  try {
    // Remove any non-price text (e.g., "Price:", "Our Price:", etc.)
    let cleaned = text.replace(/^(price|cost|our\s+price|sale\s+price|regular\s+price)[:;]\s*/i, '');
    
    // Remove any extra text after the price pattern
    const priceMatch = cleaned.match(/[$€£¥₹]?\s*\d+[.,]?\d{0,2}/);
    if (priceMatch) {
      cleaned = priceMatch[0];
    }
    
    // Ensure the price has a currency symbol
    if (!/[$€£¥₹]/.test(cleaned) && /\d/.test(cleaned)) {
      cleaned = '$' + cleaned.trim();
    }
    
    // Normalize spacing around currency symbol
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  } catch (e) {
    console.error("Error cleaning price text:", e);
    return text;
  }
}