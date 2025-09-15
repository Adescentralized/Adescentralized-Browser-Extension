import browser from 'webextension-polyfill';

/**
 * Content script - runs in the context of web pages
 * Provides functionality for interacting with page content
 */

console.log('Adescentralized Extension: Content script loaded on', window.location.href);

interface ExtensionSettings {
  enabled: boolean;
  settings: {
    theme: string;
    notifications: boolean;
  };
}

class ContentScript {
  private isEnabled = false;
  private settings: ExtensionSettings['settings'] = {
    theme: 'light',
    notifications: true,
  };

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Get extension settings
      const response = await browser.runtime.sendMessage({
        type: 'GET_SETTINGS',
      });

      if (response.success) {
        this.isEnabled = response.data.enabled ?? true;
        this.settings = response.data.settings ?? this.settings;
      }

      if (this.isEnabled) {
        this.setupEventListeners();
        this.injectStyles();
        this.observePageChanges();
      }
    } catch (error) {
      console.error('Content script initialization failed:', error);
    }
  }

  private setupEventListeners(): void {
    // Listen for messages from background script or popup
    browser.runtime.onMessage.addListener((message) => {
      switch (message.type) {
        case 'TOGGLE_EXTENSION':
          this.isEnabled = message.enabled;
          if (this.isEnabled) {
            this.activate();
          } else {
            this.deactivate();
          }
          break;
        case 'UPDATE_SETTINGS':
          this.settings = { ...this.settings, ...message.settings };
          this.applySettings();
          break;
      }
    });

    // Example: Listen for specific DOM events
    document.addEventListener('click', this.handleClick.bind(this), true);
    document.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  private handleClick(event: MouseEvent): void {
    // Example click handler
    if (!this.isEnabled) return;
    
    const target = event.target as HTMLElement;
    console.log('Content script: Click detected on', target.tagName);
    
    // Send message to background script if needed
    browser.runtime.sendMessage({
      type: 'CONTENT_SCRIPT_ACTION',
      data: {
        action: 'click',
        element: target.tagName,
        url: window.location.href,
      },
    });
  }

  private handleKeydown(event: KeyboardEvent): void {
    // Example keyboard shortcut handler
    if (!this.isEnabled) return;
    
    if (event.ctrlKey && event.shiftKey && event.key === 'A') {
      event.preventDefault();
      this.toggleFeature();
    }
  }

  private injectStyles(): void {
    if (document.getElementById('adescentralized-extension-styles')) {
      return; // Styles already injected
    }

    const style = document.createElement('style');
    style.id = 'adescentralized-extension-styles';
    style.textContent = `
      .adescentralized-highlight {
        background-color: #ffff99 !important;
        border: 2px solid #ffd700 !important;
      }
      
      .adescentralized-${this.settings.theme}-theme {
        filter: ${this.settings.theme === 'dark' ? 'invert(1) hue-rotate(180deg)' : 'none'};
      }
    `;
    document.head.appendChild(style);
  }

  private observePageChanges(): void {
    // Observer for dynamic content changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          this.processNewNodes(mutation.addedNodes);
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private processNewNodes(nodes: NodeList): void {
    nodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Process new elements that were added to the page
        console.log('New node added:', node);
      }
    });
  }

  private activate(): void {
    console.log('Content script: Extension activated');
    this.injectStyles();
    document.body.classList.add('adescentralized-extension-active');
  }

  private deactivate(): void {
    console.log('Content script: Extension deactivated');
    document.body.classList.remove('adescentralized-extension-active');
    
    // Remove injected styles
    const styles = document.getElementById('adescentralized-extension-styles');
    if (styles) {
      styles.remove();
    }
  }

  private toggleFeature(): void {
    console.log('Content script: Feature toggled');
    // Implement specific feature toggle logic
    browser.runtime.sendMessage({
      type: 'CONTENT_SCRIPT_ACTION',
      data: {
        action: 'feature_toggle',
        url: window.location.href,
      },
    });
  }

  private applySettings(): void {
    // Apply updated settings
    this.injectStyles(); // Re-inject styles with new theme
  }
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ContentScript());
} else {
  new ContentScript();
}

// Export for testing
export { ContentScript };