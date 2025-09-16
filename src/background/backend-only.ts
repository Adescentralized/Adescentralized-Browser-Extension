// Background script - Backend API only, no Stellar SDK
console.log('🚀 Background script loaded and starting...');
console.log('🚀 Chrome runtime available:', !!chrome.runtime);
console.log('🚀 Chrome storage available:', !!chrome.storage);

// Import only backend services (no Stellar SDK)
let BackgroundAuthService: any = null;
let BackgroundApiService: any = null;

try {
  console.log('🔄 Loading AuthService...');
  const authModule = require('../utils/auth');
  BackgroundAuthService = authModule.AuthService;
  console.log('✅ AuthService loaded successfully');
} catch (error) {
  console.error('❌ Failed to load AuthService:', error);
}

try {
  console.log('🔄 Loading ApiService...');
  const apiModule = require('../utils/api');
  BackgroundApiService = apiModule.ApiService;
  console.log('✅ ApiService loaded successfully');
} catch (error) {
  console.error('❌ Failed to load ApiService:', error);
}

console.log('🚀 Background script ready to receive messages');

// Extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason);
  
  if (details.reason === 'install') {
    chrome.storage.local.set({
      firstInstall: true,
      installDate: Date.now(),
    });
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started');
  checkAuthenticationOnStartup();
});

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('🔥 Background received message:', request);
  
  if (!request) {
    console.error('❌ No request object received');
    sendResponse({ success: false, error: 'No request object' });
    return true;
  }

  if (!request.type) {
    console.error('❌ Invalid message format (no type):', request);
    sendResponse({ success: false, error: 'Invalid message format - missing type' });
    return true;
  }
  
  try {
    console.log(`🎯 Processing message type: ${request.type}`);
    
    switch (request.type) {
      case 'CHECK_AUTH':
        console.log('Handling CHECK_AUTH');
        handleCheckAuth(sendResponse);
        break;
        
      case 'LOGOUT':
        console.log('Handling LOGOUT');
        handleLogout(sendResponse);
        break;
        
      case 'GET_USER_DATA':
        console.log('Handling GET_USER_DATA');
        handleGetUserData(sendResponse);
        break;
        
      case 'SUBMIT_WITHDRAWAL':
        console.log('Handling SUBMIT_WITHDRAWAL');
        handleSubmitWithdrawal(request.data, sendResponse);
        break;
        
      case 'GET_WALLET_BALANCE':
        console.log('Handling GET_WALLET_BALANCE');
        handleGetWalletBalance(sendResponse);
        break;
        
      case 'SEND_PAYMENT':
        console.log('Handling SEND_PAYMENT');
        handleSendPayment(request.data, sendResponse);
        break;
        
      default:
        console.error('❌ Unknown message type:', request.type);
        sendResponse({ success: false, error: `Unknown message type: ${request.type}` });
    }
  } catch (error) {
    console.error('💥 Error handling message:', error);
    sendResponse({ success: false, error: 'Message handler error' });
  }
  
  return true;
});

// Helper functions
async function checkAuthenticationOnStartup() {
  try {
    if (!BackgroundAuthService) {
      console.warn('AuthService not available for startup check');
      return;
    }
    
    const isAuthenticated = await BackgroundAuthService.isAuthenticated();
    if (isAuthenticated) {
      const user = await BackgroundAuthService.getCurrentUser();
      console.log('User is authenticated:', user?.email);
    } else {
      console.log('User not authenticated');
    }
  } catch (error) {
    console.error('Error checking authentication:', error);
  }
}

async function handleCheckAuth(sendResponse: (response: any) => void) {
  try {
    if (!BackgroundAuthService) {
      sendResponse({ success: false, error: 'AuthService not available' });
      return;
    }
    
    const isAuthenticated = await BackgroundAuthService.isAuthenticated();
    const user = isAuthenticated ? await BackgroundAuthService.getCurrentUser() : null;
    
    sendResponse({ 
      success: true, 
      data: { 
        isAuthenticated, 
        user 
      } 
    });
  } catch (error) {
    console.error('Error in handleCheckAuth:', error);
    sendResponse({ success: false, error: 'Failed to check authentication' });
  }
}

async function handleLogout(sendResponse: (response: any) => void) {
  try {
    if (!BackgroundAuthService) {
      sendResponse({ success: false, error: 'AuthService not available' });
      return;
    }
    
    await BackgroundAuthService.logout();
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error in handleLogout:', error);
    sendResponse({ success: false, error: 'Failed to logout' });
  }
}

async function handleGetUserData(sendResponse: (response: any) => void) {
  try {
    if (!BackgroundAuthService || !BackgroundApiService) {
      sendResponse({ success: false, error: 'Required services not available' });
      return;
    }
    
    const user = await BackgroundAuthService.getCurrentUser();
    if (user) {
      try {
        const dashboardData = await BackgroundApiService.getDashboard(user.id);
        sendResponse({ 
          success: true, 
          data: { 
            user, 
            adStats: (dashboardData && dashboardData.success && dashboardData.data) ? {
              totalAdsViewed: dashboardData.data.summary.totalClicks || 0,
              totalRevenue: dashboardData.data.summary.totalSpent?.toString() || '0',
              revenueThisMonth: '0',
              revenueToday: '0'
            } : null 
          } 
        });
      } catch (apiError) {
        console.error('Error getting dashboard data:', apiError);
        // Return user data without stats if API fails
        sendResponse({ 
          success: true, 
          data: { 
            user, 
            adStats: null 
          } 
        });
      }
    } else {
      sendResponse({ success: false, error: 'No user found' });
    }
  } catch (error) {
    console.error('Error in handleGetUserData:', error);
    sendResponse({ success: false, error: 'Failed to get user data' });
  }
}

async function handleSubmitWithdrawal(withdrawalData: any, sendResponse: (response: any) => void) {
  try {
    if (!BackgroundAuthService || !BackgroundApiService) {
      sendResponse({ success: false, error: 'Required services not available' });
      return;
    }
    
    console.log('Processing withdrawal request via backend API:', withdrawalData);
    
    // Validate withdrawal data
    if (!withdrawalData.userId || !withdrawalData.amount || !withdrawalData.method || !withdrawalData.destination) {
      throw new Error('Missing required withdrawal data');
    }

    // Get user from auth
    const user = await BackgroundAuthService.getCurrentUser();
    if (!user || !user.email) {
      throw new Error('User not authenticated or email missing');
    }

    // Basic validation for public key format (simple check)
    if (!withdrawalData.destination || withdrawalData.destination.length < 10) {
      throw new Error('Invalid destination address format');
    }

    // Validate amount
    const numAmount = parseFloat(withdrawalData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Invalid withdrawal amount');
    }

    console.log('Creating transfer via backend API...');
    
    // Use backend transfer endpoint: POST /transfer
    const result = await BackgroundApiService.createTransfer(
      user.email,
      withdrawalData.destination,
      withdrawalData.amount
    );
    
    console.log('Transfer API result:', result);
  
    if (result && result.success && result.data) {
      // Handle successful transaction
      const transactionHash = result.data.transactionResult?.hash || 
                           result.data.hash || 
                           result.data.transactionId || 
                           'pending';
                           
      sendResponse({ 
        success: true, 
        data: {
          transactionHash: transactionHash,
          message: result.data.message || 'Withdrawal completed successfully',
          status: result.data.status || 'confirmed',
          transactionResult: result.data.transactionResult || result.data
        }
      });
    } else {
      // Handle backend error response
      const errorMessage = (result && result.error) || 
                          (result && result.message) || 
                          'Transaction failed';
      
      // Check for specific backend errors
      if (errorMessage.includes('JWT') || errorMessage.includes('secretOrPrivateKey')) {
        throw new Error('Backend authentication configuration error. Please contact support.');
      } else if (errorMessage.includes('insufficient') || errorMessage.includes('balance')) {
        throw new Error('Insufficient balance for this transaction.');
      } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        throw new Error('Network error. Please try again later.');
      } else {
        throw new Error(errorMessage);
      }
    }
    
  } catch (error) {
    console.error('Error in handleSubmitWithdrawal:', error);
    sendResponse({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to process withdrawal' 
    });
  }
}

async function handleGetWalletBalance(sendResponse: (response: any) => void) {
  try {
    if (!BackgroundAuthService || !BackgroundApiService) {
      sendResponse({ success: false, error: 'Required services not available' });
      return;
    }
    
    const user = await BackgroundAuthService.getCurrentUser();
    if (!user) {
      sendResponse({ success: false, error: 'User not authenticated' });
      return;
    }
    
    console.log('Getting wallet balance for user:', user.email);
    
    // Get wallet data from backend API
    const walletData = await BackgroundApiService.getUserWalletByEmail(user.email);
    
    if (walletData && walletData.success && walletData.data) {
      const nativeBalance = walletData.data.balances.find((b: any) => b.type === 'native');
      const otherAssets = walletData.data.balances.filter((b: any) => b.type !== 'native');
      
      const balance = {
        native: nativeBalance?.balance || '0',
        assets: otherAssets.map((asset: any) => ({
          assetCode: asset.type,
          assetIssuer: '',
          balance: asset.balance
        }))
      };
      
      sendResponse({ success: true, data: { balance } });
    } else {
      sendResponse({ success: false, error: 'Failed to fetch wallet balance' });
    }
  } catch (error) {
    console.error('Error in handleGetWalletBalance:', error);
    sendResponse({ success: false, error: 'Failed to get wallet balance' });
  }
}

async function handleSendPayment(paymentData: any, sendResponse: (response: any) => void) {
  try {
    if (!BackgroundAuthService || !BackgroundApiService) {
      sendResponse({ success: false, error: 'Required services not available' });
      return;
    }
    
    console.log('Processing payment request:', paymentData);
    
    // Validate payment data
    if (!paymentData.destination || !paymentData.amount) {
      throw new Error('Missing required payment data (destination and amount)');
    }

    // Get user from auth
    const user = await BackgroundAuthService.getCurrentUser();
    if (!user || !user.email) {
      throw new Error('User not authenticated or email missing');
    }

    // Basic validation for destination
    if (paymentData.destination.length < 10) {
      throw new Error('Invalid destination address format');
    }

    // Validate amount
    const numAmount = parseFloat(paymentData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Invalid payment amount');
    }

    console.log('Creating payment via backend API...');
    
    // Use backend transfer endpoint: POST /transfer
    const result = await BackgroundApiService.createTransfer(
      user.email,
      paymentData.destination,
      paymentData.amount
    );
    
    console.log('Payment API result:', result);
  
    if (result && result.success && result.data) {
      const transactionHash = result.data.transactionResult?.hash || 
                           result.data.hash || 
                           result.data.transactionId || 
                           'pending';
                           
      sendResponse({ 
        success: true, 
        data: {
          transactionHash: transactionHash,
          message: result.data.message || 'Payment sent successfully',
          status: result.data.status || 'confirmed',
          transactionResult: result.data.transactionResult || result.data
        }
      });
    } else {
      const errorMessage = (result && result.error) || 
                          (result && result.message) || 
                          'Payment failed';
      
      if (errorMessage.includes('JWT') || errorMessage.includes('secretOrPrivateKey')) {
        throw new Error('Backend authentication configuration error. Please contact support.');
      } else if (errorMessage.includes('insufficient') || errorMessage.includes('balance')) {
        throw new Error('Insufficient balance for this payment.');
      } else {
        throw new Error(errorMessage);
      }
    }
    
  } catch (error) {
    console.error('Error in handleSendPayment:', error);
    sendResponse({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send payment' 
    });
  }
}

console.log('🚀 Background script setup complete');