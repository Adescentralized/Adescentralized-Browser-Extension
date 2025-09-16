declare let BackgroundAuthService: any;
declare let BackgroundApiService: any;
declare function checkAuthenticationOnStartup(): Promise<void>;
declare function handleCheckAuth(sendResponse: (response: any) => void): Promise<void>;
declare function handleLogout(sendResponse: (response: any) => void): Promise<void>;
declare function handleGetUserData(sendResponse: (response: any) => void): Promise<void>;
declare function handleSubmitWithdrawal(withdrawalData: any, sendResponse: (response: any) => void): Promise<void>;
declare function handleGetWalletBalance(sendResponse: (response: any) => void): Promise<void>;
declare function handleSendPayment(paymentData: any, sendResponse: (response: any) => void): Promise<void>;
