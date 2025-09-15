import browser from 'webextension-polyfill';

/**
 * Background script - runs persistently in the background
 * Handles extension lifecycle, storage, and communication between components
 */

console.log('Adescentralized Extension: Background script loaded');

// Extension installation/update handler
browser.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    // Initialize extension settings on first install
    await browser.storage.local.set({
      enabled: true,
      settings: {
        theme: 'light',
        notifications: true,
      },
    });
    
    // Open options page on install
    browser.runtime.openOptionsPage();
  }
});

// Message handler for communication with content scripts and popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  switch (message.type) {
    case 'GET_SETTINGS':
      handleGetSettings().then(sendResponse);
      return true; // Keep message channel open for async response
      
    case 'UPDATE_SETTINGS':
      handleUpdateSettings(message.settings).then(sendResponse);
      return true;
      
    case 'CONTENT_SCRIPT_ACTION':
      handleContentScriptAction(message.data, sender.tab);
      break;
      
    default:
      console.warn('Unknown message type:', message.type);
  }
});

// Tab activation handler
browser.tabs.onActivated.addListener(async (activeInfo) => {
  console.log('Tab activated:', activeInfo.tabId);
  // Handle tab changes if needed
});

// Helper functions
async function handleGetSettings(): Promise<any> {
  try {
    const result = await browser.storage.local.get(['enabled', 'settings']);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Error getting settings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function handleUpdateSettings(settings: any): Promise<any> {
  try {
    await browser.storage.local.set({ settings });
    return {
      success: true,
      message: 'Settings updated successfully',
    };
  } catch (error) {
    console.error('Error updating settings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function handleContentScriptAction(data: any, tab?: browser.Tabs.Tab): Promise<void> {
  console.log('Handling content script action:', data, 'from tab:', tab?.id);
  // Handle actions from content scripts
}

// Export for testing purposes
export {
  handleGetSettings,
  handleUpdateSettings,
  handleContentScriptAction,
};