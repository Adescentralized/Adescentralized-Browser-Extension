// Stellar Wallet Provider Interface for Web Pages
// Use this in your websites to interact with the Stellar Web3 Extension

class StellarWalletProvider {
    constructor() {
        this.isConnected = false;
        this.currentAccount = null;
        this.extensionDetected = false;
        this.eventListeners = {};
        
        this.init();
    }
    
    init() {
        // Listen for extension detection
        window.addEventListener('stellarWalletInstalled', (event) => {
            this.extensionDetected = true;
            this.emit('extensionDetected', event.detail);
        });
        
        // Auto-detect extension if already installed
        if (window.isStellarWalletInstalled) {
            this.extensionDetected = true;
        }
    }
    
    // Check if extension is available
    isExtensionAvailable() {
        return this.extensionDetected || window.isStellarWalletInstalled;
    }
    
    // Connect to the wallet
    async connect() {
        if (!this.isExtensionAvailable()) {
            throw new Error('Stellar Web3 Extension not found. Please install and enable the extension.');
        }
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout - extension not responding'));
            }, 15000);
            
            window.postMessage({
                type: 'STELLAR_WALLET_REQUEST',
                method: 'connect',
                id: Date.now()
            }, '*');
            
            const handler = (event) => {
                if (event.data.type === 'STELLAR_WALLET_RESPONSE' && event.data.method === 'connect') {
                    clearTimeout(timeout);
                    window.removeEventListener('message', handler);
                    
                    if (event.data.success) {
                        this.isConnected = true;
                        this.currentAccount = event.data.data.publicKey;
                        this.emit('connect', event.data.data);
                        resolve(event.data.data);
                    } else {
                        reject(new Error(event.data.error || 'Failed to connect wallet'));
                    }
                }
            };
            
            window.addEventListener('message', handler);
        });
    }
    
    // Get wallet balance
    async getBalance() {
        if (!this.isConnected) {
            throw new Error('Wallet not connected. Call connect() first.');
        }
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Balance request timeout'));
            }, 10000);
            
            window.postMessage({
                type: 'STELLAR_WALLET_REQUEST',
                method: 'getBalance',
                id: Date.now()
            }, '*');
            
            const handler = (event) => {
                if (event.data.type === 'STELLAR_WALLET_RESPONSE' && event.data.method === 'getBalance') {
                    clearTimeout(timeout);
                    window.removeEventListener('message', handler);
                    
                    if (event.data.success) {
                        const balanceData = event.data.data?.balance || event.data.data;
                        resolve(balanceData);
                    } else {
                        reject(new Error(event.data.error || 'Failed to get balance'));
                    }
                }
            };
            
            window.addEventListener('message', handler);
        });
    }
    
    // Send payment
    async sendPayment(destination, amount, memo = '') {
        if (!this.isConnected) {
            throw new Error('Wallet not connected. Call connect() first.');
        }
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Payment request timeout'));
            }, 30000);
            
            window.postMessage({
                type: 'STELLAR_WALLET_REQUEST',
                method: 'sendPayment',
                data: { destination, amount, memo },
                id: Date.now()
            }, '*');
            
            const handler = (event) => {
                if (event.data.type === 'STELLAR_WALLET_RESPONSE' && event.data.method === 'sendPayment') {
                    clearTimeout(timeout);
                    window.removeEventListener('message', handler);
                    
                    if (event.data.success) {
                        resolve(event.data.data);
                    } else {
                        reject(new Error(event.data.error || 'Payment failed'));
                    }
                }
            };
            
            window.addEventListener('message', handler);
        });
    }
    
    // Get current account public key
    getPublicKey() {
        return this.currentAccount;
    }
    
    // Check connection status
    isWalletConnected() {
        return this.isConnected;
    }
    
    // Disconnect wallet
    disconnect() {
        this.isConnected = false;
        this.currentAccount = null;
        this.emit('disconnect');
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
    
    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in event callback:', error);
                }
            });
        }
    }
}

// Auto-initialize and expose globally
if (typeof window !== 'undefined') {
    // Wait for extension to be available
    function initializeStellarWallet() {
        if (!window.stellarWallet) {
            window.stellarWallet = new StellarWalletProvider();
            
            // Also expose detection flag
            window.isStellarWalletAvailable = window.stellarWallet.isExtensionAvailable();
            
            console.log('🌟 Stellar Wallet Provider initialized');
        }
    }
    
    // Initialize immediately if extension is already detected
    if (window.isStellarWalletInstalled) {
        initializeStellarWallet();
    } else {
        // Wait for extension detection event
        window.addEventListener('stellarWalletInstalled', initializeStellarWallet);
        
        // Fallback: try to initialize after a short delay
        setTimeout(initializeStellarWallet, 1000);
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StellarWalletProvider;
}

if (typeof exports !== 'undefined') {
    exports.StellarWalletProvider = StellarWalletProvider;
}