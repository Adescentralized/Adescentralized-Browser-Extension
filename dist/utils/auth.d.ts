import { User } from '@/types';
export declare class AuthService {
    private static readonly STORAGE_KEYS;
    static isAuthenticated(): Promise<boolean>;
    static getCurrentUser(): Promise<User | null>;
    static setUser(user: User, token: string): Promise<void>;
    static logout(): Promise<void>;
    static getAuthToken(): Promise<string | null>;
    static redirectToLogin(): void;
    static checkAuthenticationStatus(): Promise<{
        isAuthenticated: boolean;
        user: User | null;
    }>;
    static refreshAuthToken(): Promise<boolean>;
}
