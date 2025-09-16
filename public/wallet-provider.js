// External wallet provider script - CSP compliant
(function() {
  'use strict';
  
  console.log('📦 External Stellar wallet provider script loading...');
  
  // Stellar Wallet Provider for websites
  class StellarWalletProvider {
    constructor() {
      this.isConnected = false;
      this.currentAccount = null;
      this.eventListeners = {};
      console.log('✅ StellarWalletProvider created');
    }

    async connect() {
      try {
        const response = await new Promise((resolve, reject) => {
          window.postMessage({
            type: 'STELLAR_WALLET_REQUEST',
            method: 'connect'
          }, '*');
          
          const timeout = setTimeout(() => {
            reject(new Error('Connection timeout'));
          }, 10000);
          
          window.addEventListener('message', function handler(event) {
            if (event.data.type === 'STELLAR_WALLET_RESPONSE' && event.data.method === 'connect') {
              clearTimeout(timeout);
              window.removeEventListener('message', handler);
              if (event.data.success) {
                resolve(event.data.data);
              } else {
                reject(new Error(event.data.error));
              }
            }
          });
        });

        this.isConnected = true;
        this.currentAccount = response.publicKey;
        this.emitEvent('connect', response);
        return response;
      } catch (error) {
        this.emitEvent('disconnect');
        throw error;
      }
    }

    async getPublicKey() {
      if (!this.isConnected) {
        throw new Error('Wallet not connected. Call connect() first.');
      }
      return this.currentAccount;
    }

    async getBalance() {
      return new Promise((resolve, reject) => {
        window.postMessage({
          type: 'STELLAR_WALLET_REQUEST',
          method: 'getBalance'
        }, '*');
        
        const timeout = setTimeout(() => {
          reject(new Error('Balance request timeout'));
        }, 10000);
        
        window.addEventListener('message', function handler(event) {
          if (event.data.type === 'STELLAR_WALLET_RESPONSE' && event.data.method === 'getBalance') {
            clearTimeout(timeout);
            window.removeEventListener('message', handler);
            if (event.data.success) {
              resolve(event.data.data);
            } else {
              reject(new Error(event.data.error));
            }
          }
        });
      });
    }

    async sendPayment(destination, amount, memo) {
      return new Promise((resolve, reject) => {
        window.postMessage({
          type: 'STELLAR_WALLET_REQUEST',
          method: 'sendPayment',
          data: { destination, amount, memo }
        }, '*');
        
        const timeout = setTimeout(() => {
          reject(new Error('Payment request timeout'));
        }, 30000);
        
        window.addEventListener('message', function handler(event) {
          if (event.data.type === 'STELLAR_WALLET_RESPONSE' && event.data.method === 'sendPayment') {
            clearTimeout(timeout);
            window.removeEventListener('message', handler);
            if (event.data.success) {
              resolve(event.data.data);
            } else {
              reject(new Error(event.data.error));
            }
          }
        });
      });
    }

    isWalletConnected() {
      return this.isConnected;
    }

    disconnect() {
      this.isConnected = false;
      this.currentAccount = null;
      this.emitEvent('disconnect');
    }

    // Event system
    on(event, callback) {
      if (!this.eventListeners[event]) {
        this.eventListeners[event] = [];
      }
      this.eventListeners[event].push(callback);
    }

    off(event, callback) {
      if (this.eventListeners[event]) {
        this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
      }
    }

    emitEvent(event, data) {
      if (this.eventListeners[event]) {
        this.eventListeners[event].forEach(callback => callback(data));
      }
    }
  }

  // Make wallet available globally
  window.stellarWallet = new StellarWalletProvider();
  window.isStellarWalletInstalled = true;

  // Also compatible with some existing patterns
  window.stellar = window.stellarWallet;

  console.log('🌟 External Stellar Wallet Provider loaded successfully!');
  console.log('🌟 window.stellarWallet is now available:', typeof window.stellarWallet);
  console.log('Use window.stellarWallet.connect() to connect');
  
  // Dispatch ready event
  window.dispatchEvent(new CustomEvent('stellarWalletReady', {
    detail: { wallet: window.stellarWallet }
  }));
})();