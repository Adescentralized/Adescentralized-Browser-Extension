import React from 'react';
import { User, AdStats } from '@/types';
import './Stats.css';
interface StatsProps {
    user: User | null;
    adStats: AdStats | null;
    onNavigate: (page: 'balance' | 'withdraw') => void;
    onLogout: () => void;
}
declare const StatsPage: React.FC<StatsProps>;
export default StatsPage;
