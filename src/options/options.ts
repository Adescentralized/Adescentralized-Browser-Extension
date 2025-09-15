import browser from 'webextension-polyfill';

/**
 * Options page script - handles the extension settings interface
 * Provides comprehensive settings management for the extension
 */

interface ExtensionSettings {
  enabled: boolean;
  settings: {
    theme: 'auto' | 'light' | 'dark';
    notifications: boolean;
    dataCollection: boolean;
    localStorageOnly: boolean;
    debugMode: boolean;
    autoUpdate: boolean;
  };
}

class OptionsController {
  private currentSettings: ExtensionSettings = {
    enabled: true,
    settings: {
      theme: 'auto',
      notifications: true,
      dataCollection: false,
      localStorageOnly: true,
      debugMode: false,
      autoUpdate: true,
    },
  };

  private elements: { [key: string]: HTMLElement | null } = {};
  private currentSection = 'general';

  constructor() {
    this.initializeElements();
    this.setupEventListeners();
    this.loadSettings();
    this.updateStorageInfo();
  }

  private initializeElements(): void {
    // Navigation
    this.elements.navItems = document.querySelectorAll('.nav-item') as any;

    // General settings
    this.elements.extensionEnabled = document.getElementById('extensionEnabled');
    this.elements.themeSelect = document.getElementById('themeSelect');
    this.elements.notificationsEnabled = document.getElementById('notificationsEnabled');

    // Privacy settings
    this.elements.dataCollection = document.getElementById('dataCollection');
    this.elements.localStorageOnly = document.getElementById('localStorageOnly');
    this.elements.exportData = document.getElementById('exportData');
    this.elements.importData = document.getElementById('importData');
    this.elements.clearData = document.getElementById('clearData');

    // Advanced settings
    this.elements.debugMode = document.getElementById('debugMode');
    this.elements.autoUpdate = document.getElementById('autoUpdate');

    // Info elements
    this.elements.lastUpdated = document.getElementById('lastUpdated');
    this.elements.storageUsed = document.getElementById('storageUsed');
    this.elements.saveIndicator = document.getElementById('saveIndicator');

    // Footer links
    this.elements.helpLink = document.getElementById('helpLink');
    this.elements.githubLink = document.getElementById('githubLink');
  }

  private setupEventListeners(): void {
    // Navigation
    this.elements.navItems.forEach((item: HTMLElement) => {
      item.addEventListener('click', this.handleNavClick.bind(this));
    });

    // Settings changes
    this.elements.extensionEnabled?.addEventListener('change', this.handleSettingChange.bind(this));
    this.elements.themeSelect?.addEventListener('change', this.handleSettingChange.bind(this));
    this.elements.notificationsEnabled?.addEventListener('change', this.handleSettingChange.bind(this));
    this.elements.dataCollection?.addEventListener('change', this.handleSettingChange.bind(this));
    this.elements.localStorageOnly?.addEventListener('change', this.handleSettingChange.bind(this));
    this.elements.debugMode?.addEventListener('change', this.handleSettingChange.bind(this));
    this.elements.autoUpdate?.addEventListener('change', this.handleSettingChange.bind(this));

    // Action buttons
    this.elements.exportData?.addEventListener('click', this.handleExportData.bind(this));
    this.elements.importData?.addEventListener('click', this.handleImportData.bind(this));
    this.elements.clearData?.addEventListener('click', this.handleClearData.bind(this));

    // Footer links
    this.elements.helpLink?.addEventListener('click', this.handleHelpLink.bind(this));
    this.elements.githubLink?.addEventListener('click', this.handleGithubLink.bind(this));

    // Storage changes
    browser.storage.onChanged.addListener(this.handleStorageChange.bind(this));
  }

  private handleNavClick(event: Event): void {
    const target = event.currentTarget as HTMLElement;
    const section = target.getAttribute('data-section');

    if (section && section !== this.currentSection) {
      this.switchSection(section);
    }
  }

  private switchSection(section: string): void {
    // Update navigation
    this.elements.navItems.forEach((item: HTMLElement) => {
      item.classList.remove('active');
    });

    const activeNavItem = document.querySelector(`[data-section="${section}"]`);
    if (activeNavItem) {
      activeNavItem.classList.add('active');
    }

    // Update content
    document.querySelectorAll('.options-section').forEach((el) => {
      el.classList.remove('active');
    });

    const activeSection = document.getElementById(section);
    if (activeSection) {
      activeSection.classList.add('active');
    }

    this.currentSection = section;
  }

  private async loadSettings(): Promise<void> {
    try {
      const response = await browser.runtime.sendMessage({
        type: 'GET_SETTINGS',
      });

      if (response.success) {
        this.currentSettings = {
          enabled: response.data.enabled ?? true,
          settings: {
            ...this.currentSettings.settings,
            ...response.data.settings,
          },
        };
        this.updateUI();
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  private updateUI(): void {
    // Update form controls
    const toggle = this.elements.extensionEnabled as HTMLInputElement;
    if (toggle) {
      toggle.checked = this.currentSettings.enabled;
    }

    const themeSelect = this.elements.themeSelect as HTMLSelectElement;
    if (themeSelect) {
      themeSelect.value = this.currentSettings.settings.theme;
    }

    const notifications = this.elements.notificationsEnabled as HTMLInputElement;
    if (notifications) {
      notifications.checked = this.currentSettings.settings.notifications;
    }

    const dataCollection = this.elements.dataCollection as HTMLInputElement;
    if (dataCollection) {
      dataCollection.checked = this.currentSettings.settings.dataCollection;
    }

    const localStorageOnly = this.elements.localStorageOnly as HTMLInputElement;
    if (localStorageOnly) {
      localStorageOnly.checked = this.currentSettings.settings.localStorageOnly;
    }

    const debugMode = this.elements.debugMode as HTMLInputElement;
    if (debugMode) {
      debugMode.checked = this.currentSettings.settings.debugMode;
    }

    const autoUpdate = this.elements.autoUpdate as HTMLInputElement;
    if (autoUpdate) {
      autoUpdate.checked = this.currentSettings.settings.autoUpdate;
    }

    // Update last updated info
    if (this.elements.lastUpdated) {
      this.elements.lastUpdated.textContent = new Date().toLocaleDateString();
    }
  }

  private async handleSettingChange(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const settingName = target.id;

    try {
      let value: any = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;

      if (settingName === 'extensionEnabled') {
        this.currentSettings.enabled = value;
        await browser.storage.local.set({ enabled: value });
      } else {
        this.currentSettings.settings[settingName as keyof typeof this.currentSettings.settings] = value;
        await browser.runtime.sendMessage({
          type: 'UPDATE_SETTINGS',
          settings: this.currentSettings.settings,
        });
      }

      this.showSaveIndicator();
    } catch (error) {
      console.error('Failed to save setting:', error);
      // Revert UI change
      if (target.type === 'checkbox') {
        (target as HTMLInputElement).checked = !(target as HTMLInputElement).checked;
      }
    }
  }

  private async updateStorageInfo(): Promise<void> {
    try {
      const usage = await browser.storage.local.getBytesInUse();
      if (this.elements.storageUsed) {
        this.elements.storageUsed.textContent = `${Math.round(usage / 1024)} KB`;
      }
    } catch (error) {
      console.error('Failed to get storage info:', error);
      if (this.elements.storageUsed) {
        this.elements.storageUsed.textContent = 'Unknown';
      }
    }
  }

  private showSaveIndicator(): void {
    const indicator = this.elements.saveIndicator;
    if (indicator) {
      indicator.classList.add('visible');
      setTimeout(() => {
        indicator.classList.remove('visible');
      }, 2000);
    }
  }

  private async handleExportData(): Promise<void> {
    try {
      const data = await browser.storage.local.get();
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `adescentralized-extension-data-${Date.now()}.json`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data. Please try again.');
    }
  }

  private handleImportData(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        await browser.storage.local.clear();
        await browser.storage.local.set(data);
        
        alert('Data imported successfully. The page will now reload.');
        window.location.reload();
      } catch (error) {
        console.error('Failed to import data:', error);
        alert('Failed to import data. Please check the file format.');
      }
    };
    input.click();
  }

  private async handleClearData(): Promise<void> {
    if (confirm('Are you sure you want to clear all extension data? This action cannot be undone.')) {
      try {
        await browser.storage.local.clear();
        alert('All data cleared successfully. The page will now reload.');
        window.location.reload();
      } catch (error) {
        console.error('Failed to clear data:', error);
        alert('Failed to clear data. Please try again.');
      }
    }
  }

  private handleHelpLink(event: Event): void {
    event.preventDefault();
    browser.tabs.create({
      url: 'https://github.com/Adescentralized/Adescentralized-Browser-Extension#help',
    });
  }

  private handleGithubLink(event: Event): void {
    event.preventDefault();
    browser.tabs.create({
      url: 'https://github.com/Adescentralized/Adescentralized-Browser-Extension',
    });
  }

  private handleStorageChange(
    changes: { [key: string]: browser.Storage.StorageChange },
    areaName: string
  ): void {
    if (areaName === 'local') {
      if (changes.enabled || changes.settings) {
        this.loadSettings();
      }
      this.updateStorageInfo();
    }
  }
}

// Initialize options when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new OptionsController());
} else {
  new OptionsController();
}

// Export for testing
export { OptionsController };