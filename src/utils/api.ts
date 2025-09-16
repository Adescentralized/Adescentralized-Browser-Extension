import { ApiResponse, User, AdStats, WalletData } from '@/types';

const API_BASE_URL = 'http://localhost:3001';

export class ApiService {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      console.log(`🌐 Making API request to: ${API_BASE_URL}${endpoint}`);
      console.log('Request options:', options);
      
      const authToken = await this.getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
          ...options.headers,
        },
      });

      console.log(`📡 Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        // Try to get error details
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorText = await response.text();
          console.log('❌ Error response body:', errorText);
          
          // Check if it's JSON
          if (errorText.startsWith('{')) {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } else if (errorText.includes('<html>')) {
            errorMessage = `Server returned HTML instead of JSON. Check if API is running on ${API_BASE_URL}`;
          } else {
            errorMessage = errorText || errorMessage;
          }
        } catch (e) {
          console.log('Could not parse error response');
        }
        
        return {
          success: false,
          error: errorMessage,
        };
      }

      const responseText = await response.text();
      console.log('📦 Raw response:', responseText);
      
      // Check if response is JSON
      if (!responseText.startsWith('{') && !responseText.startsWith('[')) {
        return {
          success: false,
          error: `Server returned non-JSON response: ${responseText.substring(0, 100)}...`,
        };
      }
      
      const data = JSON.parse(responseText);
      console.log('✅ Parsed response data:', data);
      
      return { success: true, data };
    } catch (error) {
      console.error('💥 API request failed:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          error: `Network error: Could not connect to API at ${API_BASE_URL}. Is the server running?`,
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Request failed',
      };
    }
  }

  private static async getAuthToken(): Promise<string | null> {
    try {
      const result = await chrome.storage.local.get(['authToken']);
      return result.authToken || null;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  private static async setAuthToken(token: string): Promise<void> {
    try {
      await chrome.storage.local.set({ authToken: token });
    } catch (error) {
      console.error('Failed to set auth token:', error);
    }
  }

  private static async clearAuthToken(): Promise<void> {
    try {
      await chrome.storage.local.remove(['authToken']);
    } catch (error) {
      console.error('Failed to clear auth token:', error);
    }
  }

    // Authentication methods
  static async login(email: string, password: string) {
    const response = await this.makeRequest('/wallet/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Store JWT token if login successful
    if (response.success && (response.data as any)?.token) {
      await this.setAuthToken((response.data as any).token);
    }

    return response;
  }

  static async createAccount(email: string, password: string, name: string) {
    return this.makeRequest('/wallet/', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  // Wallet endpoints
  static async getUserWalletByEmail(email: string): Promise<ApiResponse<WalletData>> {
    return this.makeRequest(`/wallet/${email}`);
  }

  static async deleteUserByEmail(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.makeRequest(`/wallet/${email}`, {
      method: 'DELETE'
    });
  }

  // Transfer endpoint for withdrawals
  static async createTransfer(fromEmail: string, toPublicKey: string, amount: string): Promise<ApiResponse<{ message: string; transactionResult: any }>> {
    return this.makeRequest('/transfer', {
      method: 'POST',
      body: JSON.stringify({
        fromEmail,
        toPublicKey,
        amount: parseFloat(amount)
      })
    });
  }

  // Dashboard endpoint
  static async getDashboard(userId: string): Promise<ApiResponse<{
    user: { id: string; email: string; publicKey: string; userType: string };
    campaigns: any[];
    sites: any[];
    summary: {
      totalCampaigns: number;
      totalSites: number;
      totalClicks: number;
      totalImpressions: number;
      totalSpent: number;
    };
  }>> {
    return this.makeRequest(`/dashboard/${userId}`);
  }

  // Advertisements endpoints
  static async createAdvertisement(data: {
    title: string;
    description?: string;
    campaignImage: File;
    targetUrl: string;
    budgetXlm: number;
    costPerClick: number;
    tags?: string;
  }): Promise<ApiResponse<{ message: string; campaignId: string; imageUrl: string; status: string }>> {
    // For form-data with file upload, we need special handling
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    formData.append('campaignImage', data.campaignImage);
    formData.append('targetUrl', data.targetUrl);
    formData.append('budgetXlm', data.budgetXlm.toString());
    formData.append('costPerClick', data.costPerClick.toString());
    if (data.tags) formData.append('tags', data.tags);

    try {
      console.log(`🌐 Making form-data API request to: ${API_BASE_URL}/advertisements`);
      
      const token = await this.getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/advertisements`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          // Don't set Content-Type for FormData - browser will set it with boundary
        },
        body: formData
      });
      
      console.log(`📡 Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorText = await response.text();
          console.log('❌ Error response body:', errorText);
          
          if (errorText.startsWith('{')) {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorData.message || errorMessage;
          }
        } catch (parseError) {
          console.log('Could not parse error response');
        }
        
        return { success: false, error: errorMessage };
      }
      
      const responseText = await response.text();
      const data = JSON.parse(responseText);
      console.log('✅ Advertisement created:', data);
      
      return { success: true, data };
    } catch (error) {
      console.error('💥 Advertisement creation failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create advertisement' };
    }
  }

  static async getUserAdvertisements(userId: string): Promise<ApiResponse<any[]>> {
    return this.makeRequest(`/advertisements/${userId}`);
  }

  static async updateAdvertisement(campaignId: string, data: {
    title?: string;
    description?: string;
    imageUrl?: string;
    targetUrl?: string;
    budgetXlm?: number;
    costPerClick?: number;
    tags?: string[];
    active?: boolean;
  }): Promise<ApiResponse<{ message: string }>> {
    return this.makeRequest(`/advertisements/${campaignId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async deleteAdvertisement(campaignId: string): Promise<ApiResponse<{ message: string }>> {
    return this.makeRequest(`/advertisements/${campaignId}`, {
      method: 'DELETE'
    });
  }

  // Sites endpoints
  static async createSite(data: {
    userId: string;
    name: string;
    domain: string;
    revenueShare?: number;
  }): Promise<ApiResponse<{ message: string; siteId: string; sdkCode: string }>> {
    return this.makeRequest('/sites', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getUserSites(userId: string): Promise<ApiResponse<any[]>> {
    return this.makeRequest(`/sites/${userId}`);
  }

  static async updateSite(siteId: string, data: {
    name?: string;
    domain?: string;
    revenueShare?: number;
    status?: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return this.makeRequest(`/sites/${siteId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async getSiteSDKCode(siteId: string): Promise<ApiResponse<{ siteId: string; siteName: string; sdkCode: string }>> {
    return this.makeRequest(`/sites/${siteId}/sdk-code`);
  }

  // Health check
  static async healthCheck(): Promise<ApiResponse<{ status: string }>> {
    return this.makeRequest('/health-check');
  }

  // Test API connectivity
  static async testConnection(): Promise<ApiResponse<{ message: string; timestamp: number }>> {
    try {
      console.log('🔍 Testing API connection...');
      const start = Date.now();
      const result = await this.healthCheck();
      const duration = Date.now() - start;
      
      if (result.success) {
        console.log(`✅ API connection successful in ${duration}ms`);
        return {
          success: true,
          data: {
            message: `API connected successfully in ${duration}ms`,
            timestamp: Date.now()
          }
        };
      } else {
        console.log('❌ API health check failed:', result.error);
        return {
          success: false,
          error: result.error || 'Health check failed'
        };
      }
    } catch (error) {
      console.error('💥 API connection test failed:', error);
      return {
        success: false,
        error: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}
