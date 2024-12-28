// Constants
const AMAZON_DOMAINS = [
  'amazon.com',
  'amazon.co.uk',
  'amazon.de',
  'amazon.fr',
  'amazon.it',
  'amazon.es',
  'amazon.ca'
];

const DEFAULT_AFFILIATE_ID = 'shopforgood-20';

// URL transformation logic
class AmazonUrlTransformer {
  static extractProductId(url) {
    const urlObj = new URL(url);
    
    // Handle different URL patterns
    const dpMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
    const gpdMatch = url.match(/\/gp\/product\/([A-Z0-9]{10})/);
    
    return dpMatch?.[1] || gpdMatch?.[1] || null;
  }

  static generateAffiliateUrl(url, affiliateId) {
    try {
      const urlObj = new URL(url);
      const productId = this.extractProductId(url);
      
      if (!productId) {
        return url;
      }

      // Create clean affiliate URL
      const newUrl = new URL(`https://${urlObj.hostname}`);
      newUrl.pathname = `/dp/${productId}`;
      newUrl.searchParams.set('tag', affiliateId);

      return newUrl.toString();
    } catch (error) {
      console.error('Error generating affiliate URL:', error);
      return url;
    }
  }
}

// Listen for navigation events
chrome.webNavigation.onCompleted.addListener(async (details) => {
  try {
    // Check if URL is from Amazon
    if (!AMAZON_DOMAINS.some(domain => details.url.includes(domain))) {
      return;
    }

    // Get stored settings
    const { enabled, affiliateId } = await chrome.storage.sync.get({
      enabled: true,
      affiliateId: DEFAULT_AFFILIATE_ID
    });

    if (!enabled) {
      return;
    }

    const affiliateUrl = AmazonUrlTransformer.generateAffiliateUrl(
      details.url,
      affiliateId
    );

    if (affiliateUrl !== details.url) {
      chrome.tabs.update(details.tabId, { url: affiliateUrl });
      
      // Track conversion for statistics
      await updateStatistics(details.url, affiliateUrl);
    }
  } catch (error) {
    console.error('Error in navigation handler:', error);
  }
});

async function updateStatistics(originalUrl, affiliateUrl) {
  try {
    const stats = await chrome.storage.local.get({ conversions: [] });
    stats.conversions.push({
      timestamp: Date.now(),
      originalUrl,
      affiliateUrl
    });
    await chrome.storage.local.set(stats);
  } catch (error) {
    console.error('Error updating statistics:', error);
  }
}
