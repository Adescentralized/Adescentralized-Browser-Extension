import browser from 'webextension-polyfill';

/**
 * Popup script - handles the extension popup interface
 * Provides user interface for controlling extension settings and viewing status
 */

interface ExtensionSettings {
  enabled: boolean;
  settings: {
    theme: string;
    notifications: boolean;
  };
}

class PopupController {
  private elements: { [key: string]: HTMLElement | null } = {};
  private currentSettings: ExtensionSettings = {
    enabled: true,
    settings: {
      theme: 'light',
      notifications: true,
    },
  };

  constructor() {
    this.initializeElements();
    this.setupEventListeners();
    this.loadExtensionData();
  }

  private initializeElements(): void {
    this.elements = {
      extensionToggle: document.getElementById('extensionToggle'),
      statusIndicator: document.getElementById('statusIndicator'),
      statusText: document.getElementById('statusText'),
      currentTab: document.getElementById('currentTab'),
      extensionStatus: document.getElementById('extensionStatus'),
      refreshButton: document.getElementById('refreshButton'),
      settingsButton: document.getElementById('settingsButton'),
      helpLink: document.getElementById('helpLink'),
      aboutLink: document.getElementById('aboutLink'),
    };
  }

  private setupEventListeners(): void {
    // Extension toggle
    const toggle = this.elements.extensionToggle as HTMLInputElement;
    if (toggle) {
      toggle.addEventListener('change', this.handleToggleChange.bind(this));
    }

    // Refresh button
    this.elements.refreshButton?.addEventListener('click', this.handleRefresh.bind(this));

    // Settings button
    this.elements.settingsButton?.addEventListener('click', this.handleSettings.bind(this));

    // Footer links
    this.elements.helpLink?.addEventListener('click', this.handleHelp.bind(this));
    this.elements.aboutLink?.addEventListener('click', this.handleAbout.bind(this));

    // Listen for storage changes
    browser.storage.onChanged.addListener(this.handleStorageChange.bind(this));
  }

  private async loadExtensionData(): Promise<void> {
    try {
      // Get extension settings
      const response = await browser.runtime.sendMessage({
        type: 'GET_SETTINGS',
      });

      if (response.success) {
        this.currentSettings = {
          enabled: response.data.enabled ?? true,
          settings: response.data.settings ?? this.currentSettings.settings,
        };
        this.updateUI();
      }

      // Get current tab information
      await this.updateCurrentTab();
    } catch (error) {
      console.error('Failed to load extension data:', error);
      this.updateUI();
    }
  }

  private async updateCurrentTab(): Promise<void> {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];

      if (currentTab && this.elements.currentTab) {
        const url = new URL(currentTab.url || '');
        this.elements.currentTab.textContent = url.hostname || 'Unknown';
      }
    } catch (error) {
      console.error('Failed to get current tab:', error);
      if (this.elements.currentTab) {
        this.elements.currentTab.textContent = 'Unable to detect';
      }
    }
  }

  private updateUI(): void {
    // Update toggle state
    const toggle = this.elements.extensionToggle as HTMLInputElement;
    if (toggle) {
      toggle.checked = this.currentSettings.enabled;
    }

    // Update status indicator
    const indicator = this.elements.statusIndicator;
    const statusText = this.elements.statusText;
    const extensionStatus = this.elements.extensionStatus;

    if (indicator && statusText && extensionStatus) {
      if (this.currentSettings.enabled) {
        indicator.classList.remove('inactive');
        statusText.textContent = 'Active';
        extensionStatus.textContent = 'Active';
      } else {
        indicator.classList.add('inactive');
        statusText.textContent = 'Inactive';
        extensionStatus.textContent = 'Disabled';
      }
    }
  }

  private async handleToggleChange(event: Event): Promise<void> {
    const toggle = event.target as HTMLInputElement;
    const enabled = toggle.checked;

    try {
      // Update local state
      this.currentSettings.enabled = enabled;

      // Save to storage
      await browser.storage.local.set({ enabled });

      // Notify content scripts
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        browser.tabs.sendMessage(tabs[0].id!, {
          type: 'TOGGLE_EXTENSION',
          enabled,
        }).catch(() => {
          // Content script might not be loaded, ignore error
        });
      }

      this.updateUI();
    } catch (error) {
      console.error('Failed to toggle extension:', error);
      // Revert toggle state
      toggle.checked = !enabled;
    }
  }

  private async handleRefresh(): Promise<void> {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        await browser.tabs.reload(tabs[0].id!);
        window.close(); // Close popup after refresh
      }
    } catch (error) {
      console.error('Failed to refresh tab:', error);
    }
  }

  private handleSettings(): void {
    browser.runtime.openOptionsPage();
    window.close();
  }

  private handleHelp(event: Event): void {
    event.preventDefault();
    browser.tabs.create({
      url: 'https://github.com/Adescentralized/Adescentralized-Browser-Extension#help',
    });
    window.close();
  }

  private handleAbout(event: Event): void {
    event.preventDefault();
    browser.tabs.create({
      url: 'https://github.com/Adescentralized/Adescentralized-Browser-Extension',
    });
    window.close();
  }

  private handleStorageChange(
    changes: { [key: string]: browser.Storage.StorageChange },
    areaName: string
  ): void {
    if (areaName === 'local') {
      if (changes.enabled) {
        this.currentSettings.enabled = changes.enabled.newValue;
        this.updateUI();
      }
      if (changes.settings) {
        this.currentSettings.settings = {
          ...this.currentSettings.settings,
          ...changes.settings.newValue,
        };
      }
    }
  }
}

// Initialize popup when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new PopupController());
} else {
  new PopupController();
}

// Export for testing
export { PopupController };