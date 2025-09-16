import React, { useState, useEffect } from 'react';
import { User, AdStats } from '@/types';
import './Stats.css';

interface StatsProps {
  user: User | null;
  adStats: AdStats | null;
  onNavigate: (page: 'balance' | 'withdraw') => void;
  onLogout: () => void;
}

const StatsPage: React.FC<StatsProps> = ({ user, adStats: initialStats, onNavigate, onLogout }) => {
  const [adStats, setAdStats] = useState<AdStats | null>(initialStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !adStats) {
      refreshStats();
    }
  }, [user]);

  const refreshStats = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Send message to background script to fetch stats
      const response = await sendMessage({ type: 'GET_USER_DATA' });
      if (response && response.success && response.data.adStats) {
        setAdStats(response.data.adStats);
      } else {
        // Mock data for demonstration
        setAdStats({
          totalAdsViewed: 1234,
          totalRevenue: '45.6789',
          revenueThisMonth: '12.3456',
          revenueToday: '2.1000',
        });
      }
    } catch (error) {
      console.error('Error refreshing stats:', error);
      setError('Failed to refresh statistics');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = (message: any): Promise<any> => {
    console.log('Stats: Sending message to background:', message);
    
    return new Promise((resolve) => {
      try {
        if (!chrome.runtime) {
          console.error('Chrome runtime not available');
          resolve({ success: false, error: 'Chrome runtime not available' });
          return;
        }

        chrome.runtime.sendMessage(message, (response) => {
          console.log('Stats: Received response from background:', response);
          
          if (chrome.runtime.lastError) {
            console.error('Chrome runtime error:', chrome.runtime.lastError);
            resolve({ success: false, error: chrome.runtime.lastError.message });
          } else if (!response) {
            console.error('No response received from background');
            resolve({ success: false, error: 'No response received' });
          } else {
            resolve(response);
          }
        });
      } catch (error) {
        console.error('Error sending message:', error);
        resolve({ success: false, error: 'Failed to send message' });
      }
    });
  };

  const formatRevenue = (amount: string) => {
    return parseFloat(amount).toFixed(4);
  };

  const handleGoBack = () => {
    onNavigate('balance');
  };

  const handleWithdraw = () => {
    onNavigate('withdraw');
  };

  if (!user) {
    return (
      <div className="no-user-data">
        <div>No user data available</div>
      </div>
    );
  }

  return (
    <div className="stats-container">
      {/* Header */}
      <div className="stats-header">
        <button
          onClick={handleGoBack}
          className="back-button"
        >
          ← Back
        </button>
        <h2 className="stats-title">Ad Statistics</h2>
        <button
          onClick={onLogout}
          className="logout-button"
        >
          Logout
        </button>
      </div>

      {/* Refresh Button */}
      <div className="refresh-section">
        <button
          onClick={refreshStats}
          disabled={loading}
          className={`refresh-button ${loading ? 'loading' : ''}`}
        >
          {loading ? 'Refreshing...' : 'Refresh Stats'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-content">
        {adStats ? (
          <div className="stats-cards">
            {/* Total Ads Viewed */}
            <div className="total-ads-card">
              <div className="total-ads-value">
                {adStats.totalAdsViewed.toLocaleString()}
              </div>
              <div className="total-ads-label">Total Ads Viewed</div>
            </div>

            {/* Revenue Cards */}
            <div className="revenue-cards">
              <div className="revenue-card">
                <div className="revenue-value">
                  {formatRevenue(adStats.totalRevenue)} XLM
                </div>
                <div className="revenue-label">Total Revenue</div>
              </div>

              <div className="revenue-card">
                <div className="revenue-value">
                  {formatRevenue(adStats.revenueThisMonth)} XLM
                </div>
                <div className="revenue-label">This Month</div>
              </div>
            </div>

            {/* Today's Revenue */}
            <div className="today-revenue">
              <div className="today-value">
                {formatRevenue(adStats.revenueToday)} XLM
              </div>
              <div className="today-label">Today's Revenue</div>
            </div>
          </div>
        ) : (
          <div className="no-stats">
            {loading ? 'Loading statistics...' : 'No statistics available'}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          onClick={handleGoBack}
          className="secondary-button"
        >
          View Balance
        </button>
        <button
          onClick={handleWithdraw}
          className="primary-button"
        >
          Withdraw Funds
        </button>
      </div>
    </div>
  );
};

export default StatsPage;