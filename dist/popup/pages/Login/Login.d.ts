import React from 'react';
import { User } from '@/types';
import './Login.css';
interface LoginProps {
    onLogin: (user: User, token: string) => void;
}
declare const Login: React.FC<LoginProps>;
export default Login;
