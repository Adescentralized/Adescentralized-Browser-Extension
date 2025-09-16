import React, { useState } from 'react';
import { User } from '@/types';
import { AuthService } from '@/utils/auth';
import { ApiService } from '@/utils/api';
import './Login.css';

const API_BASE_URL = 'http://localhost:3001';

interface LoginProps {
  onLogin: (user: User, token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Starting login process...');
      
      // First, test API connectivity
      console.log('🔍 Testing API connection...');
      const connectionTest = await ApiService.testConnection();
      
      if (!connectionTest.success) {
        throw new Error(`API Connection Failed: ${connectionTest.error}`);
      }
      
      console.log('✅ API connection successful, proceeding with login...');
      
      // Make the login request using ApiService
      console.log('📡 Sending login request...');
      const response = await ApiService.login(email, password);
      
      if (response.success && response.data) {
        console.log('Login response data:', response.data);
        
        const loginData = response.data as any;
        
        // New API returns: {message, token, user: {id, email, name, publicKey}}
        if (!loginData.token || !loginData.user) {
          throw new Error('Invalid response from server - missing token or user data');
        }
        
        const userData = loginData.user;
        
        // Validate required fields
        const requiredFields = ['id', 'email', 'name', 'publicKey'];
        
        for (const field of requiredFields) {
          if (!userData[field]) {
            console.error(`Missing required field: ${field}`, userData);
            throw new Error(`Invalid response from server - missing ${field}`);
          }
        }
        
        const user: User = {
          id: userData.id.toString(),
          email: userData.email,
          name: userData.name,
          publicKey: userData.publicKey,
          userType: userData.userType || 'user',
          message: loginData.message
        };
        
        console.log('Created user object:', user);
        
        // Token is already stored by ApiService.login()
        await AuthService.setUser(user, loginData.token);
        
        // Call parent callback
        onLogin(user, loginData.token);
      } else {
        console.error('Login failed:', response.error);
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle network errors vs API errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('Unable to connect to server. Please check your connection.');
      } else {
        setError(error instanceof Error ? error.message : 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRedirectToLogin = () => {
    AuthService.redirectToLogin();
  };

  const handleSkipLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // Mock user for testing - simulating the same structure as real API
      const mockUser: User = {
        id: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User',
        publicKey: 'GCKFBEIYTKP6RCZNVPH73XL77ZMZ7CDIXKIL5DFDT7NBKZRDH6LVFV7Y',
        userType: 'test',
        message: 'Test login successful'
      };
      
      const token = 'test-token-' + Date.now();
      
      console.log('Skip login activated - Test mode');
      
      // Save to storage (same as real login)
      await AuthService.setUser(mockUser, token);
      
      // Call parent callback (same as real login)
      onLogin(mockUser, token);
    } catch (error) {
      console.error('Mock login error:', error);
      setError(error instanceof Error ? error.message : 'Test login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <h2 className="login-title">Stellar Web3</h2>
        <p className="login-subtitle">Please login to continue</p>
      </div>

      <div className="login-content">
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
            />
          </div>
          
          <div className="form-group-large">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="signup-section">
          <p className="signup-text">
            Don't have an account?
          </p>
          <button
            onClick={handleRedirectToLogin}
            className="signup-button"
          >
            Sign up on website
          </button>
          
          {/* Skip Login Button for Testing */}
          <div className="test-mode-section">
            <button
              onClick={handleSkipLogin}
              disabled={loading}
              className="skip-login-button"
            >
              {loading ? 'Logging in...' : '🧪 Skip Login (Test Mode)'}
            </button>
            <p className="test-mode-note">
              For testing purposes only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;