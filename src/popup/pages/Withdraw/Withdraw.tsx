import React, { useState } from 'react';
import { User, Balance, WithdrawOption } from '@/types';
import './Withdraw.css';

interface WithdrawProps {
  user: User | null;
  balance: Balance | null;
  onNavigate: (page: 'balance' | 'stats') => void;
  onLogout: () => void;
}

const WithdrawPage: React.FC<WithdrawProps> = ({ user, balance, onNavigate, onLogout }) => {
  const [selectedMethod, setSelectedMethod] = useState<WithdrawOption['type'] | null>(null);
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const withdrawOptions: WithdrawOption[] = [
    { type: 'pix', label: 'PIX (Brazil)', icon: '🇧🇷' },
    { type: 'wallet', label: 'Wallet Address', icon: '💼' },
    { type: 'metamask', label: 'MetaMask', icon: '🦊' },
  ];

  const handleMethodSelect = (method: WithdrawOption['type']) => {
    setSelectedMethod(method);
    setDestination('');
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !selectedMethod || !amount || !destination) {
      setError('Please fill in all fields');
      return;
    }

    if (!balance || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(balance.native)) {
      setError('Invalid amount');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Send message to background script to process withdrawal
      const response = await sendMessage({
        type: 'SUBMIT_WITHDRAWAL',
        data: {
          userId: user.id,
          amount,
          method: selectedMethod,
          destination,
        },
      });

      if (response && response.success) {
        const successMessage = response.data?.transactionHash 
          ? `Transaction submitted successfully!\nHash: ${response.data.transactionHash}\nStatus: ${response.data.status || 'Pending'}`
          : 'Withdrawal request submitted successfully!';
        
        // Include note if available (for simulation mode)
        const fullMessage = response.data?.note 
          ? `${successMessage}\n\nNote: ${response.data.note}`
          : successMessage;
        
        setSuccess(fullMessage);
        setAmount('');
        setDestination('');
        setSelectedMethod(null);
        
        console.log('Withdrawal successful:', response.data);
      } else {
        throw new Error((response && response.error) || 'Withdrawal failed');
      }
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      setError(error instanceof Error ? error.message : 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = (message: any): Promise<any> => {
    console.log('Withdraw: Sending message to background:', message);
    
    return new Promise((resolve) => {
      try {
        if (!chrome.runtime) {
          console.error('Chrome runtime not available');
          resolve({ success: false, error: 'Chrome runtime not available' });
          return;
        }

        chrome.runtime.sendMessage(message, (response) => {
          console.log('Withdraw: Received response from background:', response);
          
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

  const handleGoBack = () => {
    onNavigate('balance');
  };

  const getPlaceholder = () => {
    switch (selectedMethod) {
      case 'pix':
        return 'Enter your PIX key (email, phone, or CPF)';
      case 'wallet':
        return 'Enter destination wallet address';
      case 'metamask':
        return 'MetaMask address will be detected automatically';
      default:
        return '';
    }
  };

  const maxWithdrawAmount = balance ? parseFloat(balance.native) : 0;
  
  // Debug logs to understand the balance issue
  console.log('Withdraw page - balance object:', balance);
  console.log('Withdraw page - native balance:', balance?.native);
  console.log('Withdraw page - maxWithdrawAmount:', maxWithdrawAmount);

  if (!user) {
    return (
      <div className="withdraw-no-user">
        <div>No user data available</div>
      </div>
    );
  }

  return (
    <div className="withdraw-container">
      {/* Header */}
      <div className="withdraw-header">
        <button
          onClick={handleGoBack}
          className="withdraw-back-button"
        >
          ← Back
        </button>
        <h2 className="withdraw-title">Withdraw Funds</h2>
        <button
          onClick={onLogout}
          className="withdraw-logout-button"
        >
          Logout
        </button>
      </div>

      {/* Available Balance */}
      <div className="balance-card">
        <div className="balance-label">Available Balance</div>
        <div className="balance-value">
          {balance ? parseFloat(balance.native).toFixed(4) : '0.0000'} XLM
        </div>
      </div>

      <form onSubmit={handleSubmit} className="withdraw-form">
        {/* Withdrawal Method Selection */}
        <div className="form-group">
          <label className="form-label">
            Select Withdrawal Method:
          </label>
          <div className="amount-options">
            {withdrawOptions.map((option) => (
              <button
                key={option.type}
                type="button"
                onClick={() => handleMethodSelect(option.type)}
                className={`amount-option ${selectedMethod === option.type ? 'selected' : ''}`}
              >
                <span className="amount-option-icon">{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div className="form-group-small">
          <label className="form-label-small">
            Amount (XLM):
          </label>
          <div className="input-container">
            <input
              type="number"
              step="0.0001"
              min="0"
              max={maxWithdrawAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0000"
              className="custom-amount-input"
            />
            <button
              type="button"
              onClick={() => setAmount(maxWithdrawAmount.toString())}
              className="max-button"
            >
              Max
            </button>
          </div>
        </div>

        {/* Destination Input */}
        {selectedMethod && (
          <div className="form-group">
            <label className="form-label-small">
              Destination:
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder={getPlaceholder()}
              disabled={selectedMethod === 'metamask'}
              className="custom-amount-input"
            />
            {selectedMethod === 'metamask' && (
              <div className="info-message">
                Connect MetaMask to auto-fill address
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="error-card">
            {error}
          </div>
        )}

        {success && (
          <div className="success-card">
            {success}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !selectedMethod || !amount || !destination}
          className={`withdraw-submit-button ${(loading || !selectedMethod || !amount || !destination) ? 'disabled' : ''}`}
        >
          {loading ? 'Processing...' : 'Submit Withdrawal'}
        </button>
      </form>
    </div>
  );
};

export default WithdrawPage;