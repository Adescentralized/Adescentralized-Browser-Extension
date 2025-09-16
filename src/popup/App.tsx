import React, { useState, useEffect } from 'react';
import { User, Balance, AdStats } from '@/types';
import { ApiService } from '@/utils/api';
import { AuthService } from '@/utils/auth';
import Login from './pages/Login/Login';
import BalancePage from './pages/Balance/Balance';
import StatsPage from './pages/Stats/Stats';
import WithdrawPage from './pages/Withdraw/Withdraw';
import './App.css';

type Page = 'login' | 'balance' | 'stats' | 'withdraw';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [adStats, setAdStats] = useState<AdStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Send message to background script to check auth
      const response = await sendMessage({ type: 'CHECK_AUTH' });
      
      if (response && response.success) {
        if (response.data.isAuthenticated) {
          setUser(response.data.user);
          setCurrentPage('balance');
          await loadUserData(response.data.user);
        } else {
          setCurrentPage('login');
        }
      } else {
        throw new Error((response && response.error) || 'Failed to check authentication');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setError(error instanceof Error ? error.message : 'Authentication check failed');
      setCurrentPage('login');
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (currentUser: User) => {
    try {
      console.log('Loading user data for:', currentUser);
      
      // Load wallet data from API (which includes balance from Stellar network)
      console.log('Fetching wallet data from API...');
      const walletResponse = await ApiService.getUserWalletByEmail(currentUser.email);
      if (walletResponse && walletResponse.success && walletResponse.data) {
        console.log('Wallet data loaded:', walletResponse.data);
        // Convert API balance format to our Balance format
        const nativeBalance = walletResponse.data.balances.find((b: any) => b.type === 'native');
        const balance: Balance = {
          native: nativeBalance?.balance || '0',
          assets: walletResponse.data.balances.filter((b: any) => b.type !== 'native').map((b: any) => ({
            assetCode: b.type,
            assetIssuer: '',
            balance: b.balance
          }))
        };
        setBalance(balance);
      } else {
        console.warn('No wallet data returned from API');
      }
      
      // Load ad stats from background script
      const response = await sendMessage({ type: 'GET_USER_DATA' });
      if (response && response.success) {
        setAdStats(response.data.adStats);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const sendMessage = (message: any): Promise<any> => {
    console.log('📤 Sending message to background:', message);
    
    return new Promise((resolve) => {
      try {
        if (!chrome?.runtime?.sendMessage) {
          console.error('❌ Chrome runtime sendMessage not available');
          resolve({ success: false, error: 'Chrome runtime not available' });
          return;
        }

        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            console.error('💥 Chrome runtime error:', chrome.runtime.lastError);
            resolve({ success: false, error: chrome.runtime.lastError.message || 'Runtime error' });
          } else if (!response) {
            console.error('❌ No response received from background');
            resolve({ success: false, error: 'No response received' });
          } else {
            console.log('✅ Response received:', response);
            resolve(response);
          }
        });
      } catch (error) {
        console.error('💥 Error sending message:', error);
        resolve({ success: false, error: 'Failed to send message' });
      }
    });
  };

  const handleLogin = async (userData: User, token: string) => {
    setUser(userData);
    setCurrentPage('balance');
    await loadUserData(userData);
  };

  const handleLogout = async () => {
    try {
      await sendMessage({ type: 'LOGOUT' });
      setUser(null);
      setBalance(null);
      setAdStats(null);
      setCurrentPage('login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const navigateToPage = (page: Page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <div>Error: {error}</div>
        <button 
          onClick={checkAuthStatus}
          className="retry-button"
        >
          Retry
        </button>
      </div>
    );
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'login':
        return <Login onLogin={handleLogin} />;
      case 'balance':
        return (
          <BalancePage
            user={user}
            balance={balance}
            onNavigate={navigateToPage}
            onLogout={handleLogout}
          />
        );
      case 'stats':
        return (
          <StatsPage
            user={user}
            adStats={adStats}
            onNavigate={navigateToPage}
            onLogout={handleLogout}
          />
        );
      case 'withdraw':
        return (
          <WithdrawPage
            user={user}
            balance={balance}
            onNavigate={navigateToPage}
            onLogout={handleLogout}
          />
        );
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div className="app-container">
      {renderCurrentPage()}
    </div>
  );
};

export default App;