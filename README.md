# Stellar Web3 Browser Extension

A cross-browser extension (Chrome & Firefox) for managing Stellar wallets, viewing ad revenue statistics, and handling withdrawals. Built with TypeScript and React.

## 🚀 Features

- **Authentication**: Login check and redirect to website
- **Balance Display**: View Stellar (XLM) and asset balances
## 🎯 Features
- ✅ User Authentication (Login/Register)
- ✅ Stellar Balance Display (XLM, USDC)
- ✅ Ad Revenue Statistics  
- ✅ Withdrawal System with multiple options
- ✅ TypeScript + React Architecture
- ✅ Cross-browser compatible (Chrome + Firefox)
- ✅ CSS external files (no inline styles)
- ✅ **Backend API Integration** (substitui Freighter)
- ✅ **Adescentralized-Application API** completa
- ✅ Real Stellar Network transactions via backend

## 📁 Project Structure

```
/Browser-Extension
├── .github/                    # GitHub configuration
├── public/                     # Static assets
│   ├── icons/                 # Extension icons (16x, 32x, 48x, 128x)
│   └── manifest.json          # Extension manifest
├── src/
│   ├── background/            # Background scripts
│   │   └── index.ts
│   ├── content/               # Content scripts
│   │   └── index.ts
│   ├── popup/                 # Popup UI (React)
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   │   ├── Login.tsx
│   │   │   ├── Balance.tsx
│   │   │   ├── Stats.tsx
│   │   │   └── Withdraw.tsx
│   │   ├── App.tsx            # Main app component
│   │   ├── index.tsx          # Entry point
│   │   └── popup.html         # Popup HTML template
│   ├── utils/                 # Utility functions
│   │   ├── api.ts            # Backend API integration
│   │   ├── stellar.ts        # Stellar network utilities
│   │   └── auth.ts           # Authentication utilities
│   └── types/                 # TypeScript type definitions
│       └── index.ts
├── package.json               # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── webpack.config.js         # Build configuration
└── README.md                 # This file
```

## 🛠 Setup & Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Chrome or Firefox browser for testing

### Development Setup

1. **Clone and navigate to the project:**
   ```bash
   cd Browser-Extension
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the extension:**
   ```bash
   # For development (with watch mode)
   npm run dev
   
   # For production
   npm run build
   ```

4. **Load the extension in your browser:**

   **For Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

   **For Firefox:**
   - Open Firefox and go to `about:debugging`
   - Click "This Firefox"
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file from the `dist` folder

## 📋 Available Scripts

- `npm run build` - Build for production
- `npm run dev` - Build in development mode with watch
- `npm run clean` - Remove build artifacts
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint

## 🔧 Configuration

### Backend API

Update the API base URL in `src/utils/api.ts`:
```typescript
const API_BASE_URL = 'https://your-backend-api.com/api';
```

### Stellar Network

Configure the Stellar network in `src/utils/stellar.ts`:
```typescript
const STELLAR_NETWORK: 'PUBLIC' | 'TESTNET' = 'PUBLIC'; // Change for mainnet
```

### Login Website

Update the login URL in `src/utils/auth.ts`:
```typescript
const LOGIN_URL = 'https://your-website.com/login';
```

## 🔌 Extension Permissions

The extension requires the following permissions:
- `activeTab` - Access to current tab
- `storage` - Store user data and settings
- `tabs` - Create new tabs for login
- Host permissions for Stellar Horizon API and your backend

## 🔐 Security Considerations

- User authentication tokens are stored in Chrome's secure storage
- All API requests include proper error handling
- Wallet addresses are partially masked in the UI
- Stellar operations use official SDK for security

## 🌟 Features Overview

### Authentication Flow
1. Extension checks if user is logged in
2. If not authenticated, redirects to your website
3. After successful login, user data is stored securely

### Balance Management
- Fetches real-time balance from Stellar network
- Displays XLM and custom asset balances
- Refresh functionality with error handling

### Ad Revenue Tracking
- Shows total ads viewed
- Displays revenue statistics (total, monthly, daily)
- Real-time updates from your backend API

### Withdrawal System
- **PIX**: Brazilian instant payment method
- **Wallet Address**: Direct transfer to another Stellar wallet
- **MetaMask**: Integration with MetaMask wallet
- Form validation and error handling

## 🔍 Development Notes

### Type Safety
- Full TypeScript support with strict configuration
- Custom type definitions in `src/types/`
- Chrome extension APIs are properly typed

### State Management
- React state for UI components
- Chrome storage for persistent data
- Background script for cross-tab communication

### Build System
- Webpack for bundling and optimization
- Separate entry points for popup, background, and content scripts
- CSS-in-JS for component styling

## 🐛 Troubleshooting

### Common Issues

1. **Extension not loading:**
   - Check if all dependencies are installed
   - Ensure the build completed successfully
   - Verify manifest.json is in the dist folder

2. **API errors:**
   - Check network connectivity
   - Verify API endpoints are correct
   - Check browser console for detailed errors

3. **Stellar balance not loading:**
   - Verify wallet address format
   - Check if account exists on the network
   - Ensure Stellar Horizon API is accessible

## 📝 Next Steps

To complete the extension:

1. **Add extension icons** to `public/icons/` (16x16, 32x32, 48x48, 128x128 PNG files)
2. **Configure your backend API endpoints** in `src/utils/api.ts`
3. **Set up your login website URL** in `src/utils/auth.ts`
4. **Test the extension** in both Chrome and Firefox
5. **Implement actual API integration** (currently uses mock data)
6. **Add proper error handling** and user feedback
7. **Optimize for production** and add security measures

## 🤝 Contributing

1. Make sure TypeScript compiles without errors
2. Follow the existing code style and structure
3. Test in both Chrome and Firefox
4. Update documentation for any new features

## 📄 License

MIT License - see LICENSE file for details

---

**Built with ❤️ for the Stellar ecosystem**