import { ApiResponse, WalletData } from '@/types';
export declare class ApiService {
    private static makeRequest;
    private static getAuthToken;
    private static setAuthToken;
    private static clearAuthToken;
    static login(email: string, password: string): Promise<ApiResponse<unknown>>;
    static createAccount(email: string, password: string, name: string): Promise<ApiResponse<unknown>>;
    static getUserWalletByEmail(email: string): Promise<ApiResponse<WalletData>>;
    static deleteUserByEmail(email: string): Promise<ApiResponse<{
        message: string;
    }>>;
    static createTransfer(fromEmail: string, toPublicKey: string, amount: string): Promise<ApiResponse<{
        message: string;
        transactionResult: any;
    }>>;
    static getDashboard(userId: string): Promise<ApiResponse<{
        user: {
            id: string;
            email: string;
            publicKey: string;
            userType: string;
        };
        campaigns: any[];
        sites: any[];
        summary: {
            totalCampaigns: number;
            totalSites: number;
            totalClicks: number;
            totalImpressions: number;
            totalSpent: number;
        };
    }>>;
    static createAdvertisement(data: {
        title: string;
        description?: string;
        campaignImage: File;
        targetUrl: string;
        budgetXlm: number;
        costPerClick: number;
        tags?: string;
    }): Promise<ApiResponse<{
        message: string;
        campaignId: string;
        imageUrl: string;
        status: string;
    }>>;
    static getUserAdvertisements(userId: string): Promise<ApiResponse<any[]>>;
    static updateAdvertisement(campaignId: string, data: {
        title?: string;
        description?: string;
        imageUrl?: string;
        targetUrl?: string;
        budgetXlm?: number;
        costPerClick?: number;
        tags?: string[];
        active?: boolean;
    }): Promise<ApiResponse<{
        message: string;
    }>>;
    static deleteAdvertisement(campaignId: string): Promise<ApiResponse<{
        message: string;
    }>>;
    static createSite(data: {
        userId: string;
        name: string;
        domain: string;
        revenueShare?: number;
    }): Promise<ApiResponse<{
        message: string;
        siteId: string;
        sdkCode: string;
    }>>;
    static getUserSites(userId: string): Promise<ApiResponse<any[]>>;
    static updateSite(siteId: string, data: {
        name?: string;
        domain?: string;
        revenueShare?: number;
        status?: string;
    }): Promise<ApiResponse<{
        message: string;
    }>>;
    static getSiteSDKCode(siteId: string): Promise<ApiResponse<{
        siteId: string;
        siteName: string;
        sdkCode: string;
    }>>;
    static healthCheck(): Promise<ApiResponse<{
        status: string;
    }>>;
    static testConnection(): Promise<ApiResponse<{
        message: string;
        timestamp: number;
    }>>;
}
