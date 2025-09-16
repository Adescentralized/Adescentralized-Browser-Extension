import React from 'react';
import { User, Balance } from '@/types';
import './Balance.css';
interface BalanceProps {
    user: User | null;
    balance: Balance | null;
    onNavigate: (page: 'stats' | 'withdraw') => void;
    onLogout: () => void;
}
declare const BalancePage: React.FC<BalanceProps>;
export default BalancePage;
