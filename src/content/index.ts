// Content script - runs in the context of web pages
// Injects Stellar wallet provider for websites to interact with

console.log('🌐 Stellar Web3 Extension content script loaded on:', window.location.href);
console.log('🌐 Document ready state:', document.readyState);
console.log('🌐 Extension ID:', chrome.runtime.id);

// Create wallet provider interface for direct injection fallback
class StellarWalletProvider {
  private isConnected: boolean = false;
  private currentAccount: string | null = null;
  private eventListeners: { [key: string]: Function[] } = {};

  constructor() {
    this.checkConnection();
    console.log('✅ StellarWalletProvider created in content script');
  }

  async checkConnection() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' });
      if (response && response.success && response.data.isAuthenticated) {
        this.isConnected = true;
        this.currentAccount = response.data.user.publicKey;
        this.emitEvent('accountsChanged', [this.currentAccount]);
      }
    } catch (error) {
      console.log('Extension not connected or not authenticated');
    }
  }

  // Connect wallet - requests user permission
  async connect() {
    try {
      console.log('🔗 Website requesting wallet connection...');
      
      const response = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' });
      
      if (response && response.success && response.data.isAuthenticated) {
        this.isConnected = true;
        this.currentAccount = response.data.user.publicKey;
        this.emitEvent('connect', { publicKey: this.currentAccount });
        this.emitEvent('accountsChanged', [this.currentAccount]);
        
        return {
          publicKey: this.currentAccount,
          email: response.data.user.email,
          name: response.data.user.name
        };
      } else {
        // User not authenticated - could show popup or redirect to login
        throw new Error('User not authenticated. Please login to the Stellar Web3 Extension.');
      }
    } catch (error) {
      this.emitEvent('disconnect');
      throw error;
    }
  }

  // Get current account
  async getPublicKey() {
    if (!this.isConnected) {
      throw new Error('Wallet not connected. Call connect() first.');
    }
    return this.currentAccount;
  }

  // Check if wallet is connected
  isWalletConnected() {
    return this.isConnected;
  }

  // Sign transaction (placeholder - would need to implement in background)
  async signTransaction(transactionXDR: string) {
    if (!this.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SIGN_TRANSACTION',
        data: { transactionXDR }
      });

      if (response && response.success) {
        return response.data.signedTransaction;
      } else {
        throw new Error(response.error || 'Failed to sign transaction');
      }
    } catch (error) {
      throw error;
    }
  }

  // Send payment
  async sendPayment(destination: string, amount: string, memo?: string) {
    if (!this.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SEND_PAYMENT',
        data: { destination, amount, memo }
      });

      if (response && response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to send payment');
      }
    } catch (error) {
      throw error;
    }
  }

  // Get balance
  async getBalance() {
    if (!this.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_WALLET_BALANCE'
      });

      if (response && response.success) {
        return response.data.balance;
      } else {
        throw new Error(response.error || 'Failed to get balance');
      }
    } catch (error) {
      throw error;
    }
  }

  // Disconnect wallet
  disconnect() {
    this.isConnected = false;
    this.currentAccount = null;
    this.emitEvent('disconnect');
  }

  // Event system for websites to listen to wallet events
  on(event: string, callback: Function) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }

  private emitEvent(event: string, data?: any) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
    }
  }
}

// Inject wallet provider into the page
function injectWalletProvider() {
  console.log('🚀 Setting up CSP-compliant wallet provider...');
  
  // Instead of injecting scripts, we'll expose the wallet through custom events
  // and window.postMessage communications only
  
  // Create a custom event to signal that the wallet is ready
  const walletReadyEvent = new CustomEvent('stellarWalletInstalled', {
    detail: { 
      available: true,
      version: '1.0.0',
      methods: ['connect', 'getBalance', 'sendPayment', 'getPublicKey'],
      extensionId: chrome.runtime.id
    }
  });
  
  window.dispatchEvent(walletReadyEvent);
  console.log('✅ Wallet ready event dispatched');
  
  // Set up a global flag that pages can check
  try {
    // This approach works without CSP issues
    Object.defineProperty(window, 'isStellarWalletInstalled', {
      value: true,
      writable: false,
      configurable: false
    });
    
    Object.defineProperty(window, 'stellarWalletVersion', {
      value: '1.0.0',
      writable: false,
      configurable: false
    });
    
    console.log('✅ Wallet detection properties set');
  } catch (e) {
    console.log('⚠️ Could not set wallet detection properties:', e);
  }
  
  console.log('✅ CSP-compliant wallet provider setup complete');
}

// Handle messages from the injected script
window.addEventListener('message', async (event) => {
  if (event.data.type === 'STELLAR_WALLET_REQUEST') {
    const { method, data } = event.data;
    
    try {
      let response;
      
      switch (method) {
        case 'connect':
          response = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' });
          if (response && response.success && response.data.isAuthenticated) {
            window.postMessage({
              type: 'STELLAR_WALLET_RESPONSE',
              method: 'connect',
              success: true,
              data: {
                publicKey: response.data.user.publicKey,
                email: response.data.user.email,
                name: response.data.user.name
              }
            }, '*');
          } else {
            throw new Error('User not authenticated. Please login to the extension.');
          }
          break;
          
        case 'getBalance':
          // Get balance via background script
          response = await chrome.runtime.sendMessage({ type: 'GET_WALLET_BALANCE' });
          window.postMessage({
            type: 'STELLAR_WALLET_RESPONSE',
            method: 'getBalance',
            success: response?.success || false,
            data: response?.data,
            error: response?.error
          }, '*');
          break;
          
        case 'sendPayment':
          // Handle payment via background script
          response = await chrome.runtime.sendMessage({
            type: 'SEND_PAYMENT',
            data
          });
          window.postMessage({
            type: 'STELLAR_WALLET_RESPONSE',
            method: 'sendPayment',
            success: response?.success || false,
            data: response?.data,
            error: response?.error
          }, '*');
          break;
          
        default:
          throw new Error(`Unknown method: ${method}`);
      }
    } catch (error) {
      window.postMessage({
        type: 'STELLAR_WALLET_RESPONSE',
        method,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, '*');
    }
  }
});

// Legacy content script message handling
chrome.runtime.onMessage.addListener((request: any, sender: any, sendResponse: any) => {
  console.log('Content script received message:', request);
  
  switch (request.type) {
    case 'PING':
      sendResponse({ success: true, message: 'Content script is active' });
      break;
      
    case 'GET_PAGE_INFO':
      sendResponse({
        success: true,
        data: {
          url: window.location.href,
          title: document.title,
          domain: window.location.hostname,
        }
      });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
  
  return true;
});

// Inject wallet provider when page loads - try multiple approaches
console.log('🔄 Setting up injection triggers...');

// Immediate injection attempt
console.log('🎯 Attempting immediate injection...');
injectWalletProvider();

// Injection on DOM ready
if (document.readyState === 'loading') {
  console.log('📄 Document still loading, setting up DOMContentLoaded listener...');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOMContentLoaded event fired, injecting...');
    injectWalletProvider();
  });
} else {
  console.log('📄 Document already loaded, injecting immediately...');
  injectWalletProvider();
}

// Backup injection on window load
window.addEventListener('load', () => {
  console.log('🪟 Window load event fired, doing backup injection...');
  injectWalletProvider();
});

// Safety injection with timeout
setTimeout(() => {
  console.log('⏰ Timeout injection as safety measure...');
  injectWalletProvider();
}, 100);

// Export for module compatibility
export {};