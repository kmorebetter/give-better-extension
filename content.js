class AmazonPageHandler {
  constructor() {
    this.affiliateId = null;
    this.initialized = false;
    this.processedLinks = new Set();
    
    this.initialize();
  }

  async initialize() {
    try {
      const { enabled, affiliateId } = await chrome.storage.sync.get({
        enabled: true,
        affiliateId: 'shopforgood-20'
      });

      if (!enabled) return;

      this.affiliateId = affiliateId;
      this.initialized = true;
      
      // Start monitoring the page
      this.setupMutationObserver();
      this.processCurrentLinks();
    } catch (error) {
      console.error('Error initializing content script:', error);
    }
  }

  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.processLinks(node.getElementsByTagName('a'));
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  processCurrentLinks() {
    this.processLinks(document.getElementsByTagName('a'));
  }

  processLinks(links) {
    if (!this.initialized) return;

    Array.from(links).forEach(link => {
      if (this.processedLinks.has(link)) return;
      
      if (this.isAmazonProductLink(link.href)) {
        this.updateLink(link);
        this.processedLinks.add(link);
      }
    });
  }

  isAmazonProductLink(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('amazon.') && 
             (url.includes('/dp/') || url.includes('/gp/product/'));
    } catch {
      return false;
    }
  }

  updateLink(link) {
    try {
      const productId = this.extractProductId(link.href);
      if (!productId) return;

      const urlObj = new URL(link.href);
      urlObj.searchParams.set('tag', this.affiliateId);
      link.href = urlObj.toString();
    } catch (error) {
      console.error('Error updating link:', error);
    }
  }

  extractProductId(url) {
    const dpMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
    const gpdMatch = url.match(/\/gp\/product\/([A-Z0-9]{10})/);
    return dpMatch?.[1] || gpdMatch?.[1];
  }
}

// Initialize the handler
new AmazonPageHandler();
