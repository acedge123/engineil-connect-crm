
import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from "sonner";

// This is a placeholder until Supabase is connected
// Once Supabase is integrated, we'll use the actual types and authentication methods
type User = {
  id: string;
  email: string;
  role: 'admin' | 'user';
  name?: string;
} | null;

type AuthContextType = {
  user: User;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// This is a mock implementation until Supabase is connected
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock initialization - replace with Supabase auth state
    const storedUser = localStorage.getItem('crm-user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user', error);
      }
    }
    setIsLoading(false);
    
    // This will be replaced with Supabase auth subscription
  }, []);

  const isAdmin = user?.role === 'admin';

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      // Mock sign in - replace with Supabase auth
      if (email && password) {
        // Mock admin user
        if (email === 'admin@engineil.ing' && password === 'admin') {
          const adminUser = {
            id: '1',
            email: 'admin@engineil.ing',
            role: 'admin' as const,
            name: 'Admin User'
          };
          setUser(adminUser);
          localStorage.setItem('crm-user', JSON.stringify(adminUser));
          toast.success('Successfully signed in as Admin');
        } else {
          // Mock regular user
          const regularUser = {
            id: '2',
            email,
            role: 'user' as const,
            name: 'Regular User'
          };
          setUser(regularUser);
          localStorage.setItem('crm-user', JSON.stringify(regularUser));
          toast.success('Successfully signed in');
        }
      } else {
        throw new Error('Email and password are required');
      }
    } catch (error) {
      toast.error('Failed to sign in');
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Mock sign out - replace with Supabase auth
      setUser(null);
      localStorage.removeItem('crm-user');
      toast.info('Successfully signed out');
    } catch (error) {
      toast.error('Failed to sign out');
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const value = {
    user,
    isLoading,
    isAdmin,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
