import React from 'react';
import { User, Balance } from '@/types';
import './Withdraw.css';
interface WithdrawProps {
    user: User | null;
    balance: Balance | null;
    onNavigate: (page: 'balance' | 'stats') => void;
    onLogout: () => void;
}
declare const WithdrawPage: React.FC<WithdrawProps>;
export default WithdrawPage;
