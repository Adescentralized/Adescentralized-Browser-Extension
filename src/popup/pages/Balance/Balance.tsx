import React, { useState, useEffect } from 'react';
import { User, Balance } from '@/types';
import { ApiService } from '@/utils/api';
import './Balance.css';

interface BalanceProps {
  user: User | null;
  balance: Balance | null;
  onNavigate: (page: 'stats' | 'withdraw') => void;
  onLogout: () => void;
}

const BalancePage: React.FC<BalanceProps> = ({ user, balance: initialBalance, onNavigate, onLogout }) => {
  const [balance, setBalance] = useState<Balance | null>(initialBalance);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !balance) {
      refreshBalance();
    }
  }, [user]);

  const refreshBalance = async () => {
    if (!user) {
      console.error('No user found for balance refresh');
      return;
    }

    console.log('Refreshing balance for user:', {
      id: user.id,
      email: user.email,
      walletAddress: user.publicKey
    });

    setLoading(true);
    setError(null);

    try {
      console.log('Making Backend API request for user email:', user.email);
      
      // Use backend API: GET /wallet/:email
      const walletData = await ApiService.getUserWalletByEmail(user.email);
      
      if (!walletData || !walletData.success || !walletData.data) {
        throw new Error('Failed to fetch wallet data from backend');
      }
      
      console.log('Wallet data fetched successfully:', walletData.data);
      
      // Convert backend wallet data to our Balance format
      const nativeBalance = walletData.data.balances.find((b: any) => b.type === 'native');
      const otherAssets = walletData.data.balances.filter((b: any) => b.type !== 'native');
      
      const newBalance: Balance = {
        native: nativeBalance?.balance || '0',
        assets: otherAssets.map((asset: any) => ({
          assetCode: asset.type,
          assetIssuer: '',
          balance: asset.balance
        }))
      };
      
      console.log('Balance processed successfully:', newBalance);
      setBalance(newBalance);
    } catch (error) {
      console.error('Error refreshing balance:', error);
      
      // More specific error messages
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh balance';
      
      if (errorMessage.includes('404')) {
        setError('Account not found. Make sure the account is created on the backend.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Network error. Please check your connection.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (amount: string) => {
    return parseFloat(amount).toFixed(4);
  };

  const handleWithdraw = () => {
    onNavigate('withdraw');
  };

  const handleViewStats = () => {
    onNavigate('stats');
  };

  if (!user) {
    return (
      <div className="no-user-data">
        <div>No user data available</div>
      </div>
    );
  }

  return (
    <div className="balance-container">
      {/* Header */}
      <div className="balance-header">
        <h2 className="balance-title">My Wallet</h2>
        <button
          onClick={onLogout}
          className="logout-button"
        >
          Logout
        </button>
      </div>

      {/* User Info */}
      <div className="user-info-card">
        <div className="user-email-label">Email</div>
        <div className="user-email">{user.email}</div>
        <div className="wallet-address">
          Wallet: {user.publicKey.substring(0, 8)}...{user.publicKey.substring(-8)}
        </div>
      </div>

      {/* Balance Section */}
      <div className="balance-card">
        <div className="balance-header-row">
          <h3 className="balance-subtitle">Balance</h3>
          <button
            onClick={refreshBalance}
            disabled={loading}
            className="refresh-button"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {balance ? (
          <div>
            {/* Native XLM Balance */}
            <div className="native-balance">
              <div className="balance-amount">
                {formatBalance(balance.native)} XLM
              </div>
              <div className="balance-label">Native Lumens</div>
            </div>

            {/* Other Assets */}
            {balance.assets.length > 0 && (
              <div className="assets-section">
                <div className="assets-title">Other Assets:</div>
                {balance.assets.map((asset, index) => (
                  <div key={index} className="asset-item">
                    {formatBalance(asset.balance)} {asset.assetCode}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="no-balance">
            {loading ? 'Loading balance...' : 'No balance data available'}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          onClick={handleViewStats}
          className="stats-button"
        >
          View Ad Stats
        </button>
        <button
          onClick={handleWithdraw}
          disabled={!balance || parseFloat(balance.native) <= 0}
          className="withdraw-button"
        >
          Withdraw
        </button>
      </div>
    </div>
  );
};

export default BalancePage;