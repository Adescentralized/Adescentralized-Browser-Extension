export interface User {
  id: string;
  email: string;
  name: string;
  publicKey: string;
  userType?: string;
  message?: string;
}

export interface Balance {
  native: string; // XLM balance  
  assets: Array<{
    assetCode: string;
    assetIssuer: string;
    balance: string;
  }>;
}

export interface ApiBalance {
  type: string; // asset_type from Stellar (native, credit_alphanum4, etc.)
  balance: string;
}

export interface WalletData {
  publicKey: string;
  balances: ApiBalance[];
  account: any; // Full Stellar account data
}

export interface AdStats {
  totalAdsViewed: number;
  totalRevenue: string;
  revenueThisMonth: string;
  revenueToday: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  advertiser_name: string;
  advertiser_stellar_key: string;
  title: string;
  description?: string;
  image_url: string;
  target_url: string;
  budget_xlm: number;
  cost_per_click: number;
  tags: string[];
  active: boolean;
  total_clicks?: number;
  total_revenue?: number;
  total_impressions?: number;
  created_at: string;
  updated_at: string;
}

export interface Site {
  id: string;
  user_id: string;
  name: string;
  domain: string;
  stellar_public_key: string;
  revenue_share: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  user: {
    id: string;
    email: string;
    publicKey: string;
    userType: string;
  };
  campaigns: Campaign[];
  sites: Site[];
  summary: {
    totalCampaigns: number;
    totalSites: number;
    totalClicks: number;
    totalImpressions: number;
    totalSpent: number;
  };
}

export interface WithdrawOption {
  type: 'pix' | 'wallet' | 'metamask';
  label: string;
  icon: string;
}

export interface WithdrawRequest {
  amount: string;
  method: WithdrawOption['type'];
  destination: string; // PIX key, wallet address, etc.
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StorageData {
  user?: User;
  authToken?: string;
  lastBalanceCheck?: number;
  cachedBalance?: Balance;
}