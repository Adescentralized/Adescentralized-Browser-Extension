import { User, StorageData } from '@/types';

export class AuthService {
  private static readonly STORAGE_KEYS = {
    USER: 'user',
    AUTH_TOKEN: 'authToken',
    LAST_LOGIN: 'lastLogin',
  };

  static async isAuthenticated(): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEYS.USER, this.STORAGE_KEYS.AUTH_TOKEN], (result: StorageData) => {
        const hasValidUser = result.user && result.user.id && result.user.email;
        const hasToken = Boolean(result.authToken);
        resolve(Boolean(hasValidUser && hasToken));
      });
    });
  }

  static async getCurrentUser(): Promise<User | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEYS.USER], (result: StorageData) => {
        resolve(result.user || null);
      });
    });
  }

  static async setUser(user: User, token: string): Promise<void> {
    return new Promise((resolve) => {
      const data: StorageData = {
        user: user,
        authToken: token,
      };
      
      chrome.storage.local.set(data, () => {
        // Also update lastLogin timestamp
        chrome.storage.local.set({ [this.STORAGE_KEYS.LAST_LOGIN]: Date.now() }, () => {
          resolve();
        });
      });
    });
  }

  static async logout(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.remove([
        this.STORAGE_KEYS.USER,
        this.STORAGE_KEYS.AUTH_TOKEN,
        this.STORAGE_KEYS.LAST_LOGIN,
      ], () => {
        resolve();
      });
    });
  }

  static async getAuthToken(): Promise<string | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEYS.AUTH_TOKEN], (result: StorageData) => {
        resolve(result.authToken || null);
      });
    });
  }

  static redirectToLogin(): void {
    // Open your login website in a new tab
    const LOGIN_URL = 'https://your-website.com/login'; // Replace with your actual login URL
    chrome.tabs.create({ url: LOGIN_URL });
  }

  static async checkAuthenticationStatus(): Promise<{ isAuthenticated: boolean; user: User | null }> {
    const isAuthenticated = await this.isAuthenticated();
    const user = isAuthenticated ? await this.getCurrentUser() : null;
    
    return { isAuthenticated, user };
  }

  static async refreshAuthToken(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return false;

      // Here you would typically make an API call to refresh the token
      // For now, we'll just check if the current token is still valid
      const token = await this.getAuthToken();
      if (!token) return false;

      // Add token validation logic here if needed
      return true;
    } catch (error) {
      console.error('Error refreshing auth token:', error);
      return false;
    }
  }
}