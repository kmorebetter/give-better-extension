class OptionsManager {
  constructor() {
    this.enabledSetting = document.getElementById('enabledSetting');
    this.charityList = document.getElementById('charityList');
    this.statsContainer = document.getElementById('statsContainer');
    this.clearDataBtn = document.getElementById('clearDataBtn');
    this.exportDataBtn = document.getElementById('exportDataBtn');

    this.initialize();
  }

  async initialize() {
    try {
      await this.loadSettings();
      await this.loadCharities();
      await this.loadStatistics();
      this.attachEventListeners();
    } catch (error) {
      console.error('Error initializing options:', error);
      this.showError('Failed to initialize settings');
    }
  }

  async loadSettings() {
    const { enabled } = await chrome.storage.sync.get({ enabled: true });
    this.enabledSetting.checked = enabled;
  }

  async loadCharities() {
    const charities = [
      { id: 'charity1', name: 'Global Wildlife Fund', affiliateId: 'gwf-20' },
      { id: 'charity2', name: 'Children\'s Education', affiliateId: 'edu-20' },
      { id: 'charity3', name: 'Local Food Bank', affiliateId: 'food-20' }
    ];

    const { selectedCharityId } = await chrome.storage.sync.get({ 
      selectedCharityId: 'charity1' 
    });

    this.charityList.innerHTML = charities.map(charity => `
      <div class="charity-card ${charity.id === selectedCharityId ? 'selected' : ''}"
           data-charity-id="${charity.id}"
           data-affiliate-id="${charity.affiliateId}">
        <h3>${charity.name}</h3>
      </div>
    `).join('');
  }

  async loadStatistics() {
    const { conversions = [] } = await chrome.storage.local.get({ conversions: [] });
    
    const stats = {
      total: conversions.length,
      last24h: conversions.filter(c => 
        Date.now() - c.timestamp < 24 * 60 * 60 * 1000
      ).length,
      lastWeek: conversions.filter(c => 
        Date.now() - c.timestamp < 7 * 24 * 60 * 60 * 1000
      ).length
    };

    this.statsContainer.innerHTML = `
      <div class="stat-card">
        <h3>Total Conversions</h3>
        <p>${stats.total}</p>
      </div>
      <div class="stat-card">
        <h3>Last 24 Hours</h3>
        <p>${stats.last24h}</p>
      </div>
      <div class="stat-card">
        <h3>Last 7 Days</h3>
        <p>${stats.lastWeek}</p>
      </div>
    `;
  }

  attachEventListeners() {
    this.enabledSetting.addEventListener('change', async (e) => {
      await chrome.storage.sync.set({ enabled: e.target.checked });
    });

    this.charityList.addEventListener('click', async (e) => {
      const charityCard = e.target.closest('.charity-card');
      if (!charityCard) return;

      const charityId = charityCard.dataset.charityId;
      const affiliateId = charityCard.dataset.affiliateId;

      await chrome.storage.sync.set({ 
        selectedCharityId: charityId,
        affiliateId: affiliateId
      });

      // Update UI
      document.querySelectorAll('.charity-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.charityId === charityId);
      });
    });

    this.clearDataBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to clear all data?')) {
        await chrome.storage.local.clear();
        await this.loadStatistics();
      }
    });

    this.exportDataBtn.addEventListener('click', async () => {
      const { conversions = [] } = await chrome.storage.local.get({ conversions: [] });
      const blob = new Blob([JSON.stringify(conversions, null, 2)], 
        { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'shop-for-good-statistics.json';
      a.click();
      
      URL.revokeObjectURL(url);
    });
  }

  showError(message) {
    // Implementation similar to popup.js
  }
}

// Initialize options when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
});
