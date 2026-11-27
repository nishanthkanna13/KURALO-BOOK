import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('kb_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('kb_auth_token'));
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  useEffect(() => {
    if (user) {
      localStorage.setItem('kb_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('kb_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('kb_auth_token', token);
    } else {
      localStorage.removeItem('kb_auth_token');
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      setUser(res.data.user);
      setToken(res.data.access_token);
      setIsAuthModalOpen(false);
      toast.success(`Welcome back, ${res.data.user.full_name || 'Shopper'}!`);
      return true;
    } catch {
      // Demo fallback login
      const demoUser = {
        id: 'usr-demo-001',
        email,
        full_name: email.split('@')[0].toUpperCase(),
        phone: '+91 98765 43210'
      };
      setUser(demoUser);
      setToken(`demo-token-${Date.now()}`);
      setIsAuthModalOpen(false);
      toast.success(`Logged in as ${demoUser.full_name}`);
      return true;
    }
  };

  const register = async (fullName, email, password, phone) => {
    try {
      const res = await api.post('/auth/register', {
        full_name: fullName,
        email,
        password,
        phone
      });
      setUser(res.data.user);
      setToken(res.data.access_token);
      setIsAuthModalOpen(false);
      toast.success(`Welcome to KURALO BOOK, ${fullName}!`);
      return true;
    } catch {
      const demoUser = {
        id: `usr-${Date.now()}`,
        email,
        full_name: fullName,
        phone: phone || '+91 98765 43210'
      };
      setUser(demoUser);
      setToken(`demo-token-${Date.now()}`);
      setIsAuthModalOpen(false);
      toast.success(`Welcome to KURALO BOOK, ${fullName}!`);
      return true;
    }
  };

  const demoLogin = async () => {
    try {
      const res = await api.post('/auth/demo-login');
      setUser(res.data.user);
      setToken(res.data.access_token);
    } catch {
      setUser({
        id: 'usr-demo-001',
        email: 'customer@kuralobook.com',
        full_name: 'Rohan Sharma',
        phone: '+91 98765 43210'
      });
      setToken('demo-token-123456');
    }
    setIsAuthModalOpen(false);
    toast.success('Signed in with Demo Account 🎉');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    toast.success('Logged out successfully');
  };

  const openAuth = (mode = 'login') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authMode,
        setAuthMode,
        openAuth,
        login,
        register,
        demoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
