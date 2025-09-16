// Debug script - paste this in browser console to troubleshoot

console.log('=== STELLAR EXTENSION DEBUG ===');

// 1. Check if extension objects are available
console.log('window.stellarWallet:', typeof window.stellarWallet);
console.log('window.isStellarWalletInstalled:', window.isStellarWalletInstalled);
console.log('window.stellar:', typeof window.stellar);

// 2. Check extension context
if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log('Chrome runtime available:', !!chrome.runtime);
    console.log('Extension ID:', chrome.runtime.id);
} else {
    console.log('Chrome runtime not available in page context (this is normal)');
}

// 3. Check DOM and timing
console.log('Document ready state:', document.readyState);
console.log('Window loaded:', document.readyState === 'complete');

// 4. Test wallet functionality if available
if (typeof window.stellarWallet !== 'undefined') {
    console.log('✅ Wallet object found!');
    console.log('Wallet methods:', Object.getOwnPropertyNames(window.stellarWallet.__proto__));
    console.log('Is connected:', window.stellarWallet.isWalletConnected ? window.stellarWallet.isWalletConnected() : 'Method not available');
} else {
    console.log('❌ Wallet object NOT found');
    
    // Check if script tags exist
    const scripts = document.querySelectorAll('script');
    console.log('Total script tags:', scripts.length);
    
    // Check for extension traces
    const content = document.documentElement.innerHTML;
    const hasExtensionTrace = content.includes('stellarWallet') || content.includes('StellarWalletProvider');
    console.log('Extension traces in DOM:', hasExtensionTrace);
}

// 5. Manual event listener test
window.addEventListener('stellarWalletReady', (event) => {
    console.log('🎉 stellarWalletReady event received:', event.detail);
});

console.log('=== END DEBUG ===');