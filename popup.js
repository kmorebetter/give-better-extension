class PopupManager {
  constructor() {
    this.enabledToggle = document.getElementById('enabledToggle');
    this.conversionCount = document.getElementById('conversionCount');
    this.selectedCharity = document.getElementById('selectedCharity');
    this.optionsBtn = document.getElementById('optionsBtn');
    
    this.initializeUI();
    this.attachEventListeners();
  }

  async initializeUI() {
    try {
      // Load saved settings
      const { enabled, selectedCharityName } = await chrome.storage.sync.get({
        enabled: true,
        selectedCharityName: 'Default Charity'
      });

      this.enabledToggle.checked = enabled;
      this.selectedCharity.textContent = selectedCharityName;

      // Load statistics
      const { conversions = [] } = await chrome.storage.local.get({ conversions: [] });
      this.conversionCount.textContent = conversions.length;
    } catch (error) {
      console.error('Error initializing popup:', error);
      this.showError('Failed to load settings');
    }
  }

  attachEventListeners() {
    this.enabledToggle.addEventListener('change', async (e) => {
      try {
        await chrome.storage.sync.set({ enabled: e.target.checked });
      } catch (error) {
        console.error('Error saving enabled state:', error);
        this.showError('Failed to save settings');
      }
    });

    this.optionsBtn.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
