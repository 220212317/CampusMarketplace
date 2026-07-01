// src/context/AuthContext.tsx
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../lib/api';
import { User, AuthContextType } from '../types';

type AuthContextValue = AuthContextType & {
  isInitializing: boolean;
  getToken: () => Promise<string | null>;
  isAuthenticated: () => boolean;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: false,
  isInitializing: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  verifyOTP: async () => {},
  getToken: async () => null,
  isAuthenticated: () => false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const [isInitializing, setIsInitializing] = useState(true);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('@cm_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        console.log('✅ User loaded from storage');
      } else {
        console.log('ℹ️ No stored user found');
      }
    } catch (error) {
      console.error('❌ Error loading user:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 AuthContext: Signing in...');
    setIsLoading(true);
    try {
      const response = await authAPI.signIn(email, password);
      if (response.user) {
        setUser(response.user);
        await AsyncStorage.setItem('@cm_user', JSON.stringify(response.user));
        await AsyncStorage.setItem('@cm_token', response.token);
        console.log('✅ User signed in successfully');
      }
      return response;
    } catch (error) {
      console.error('❌ Sign in error in AuthContext:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, role?: string) => {
    console.log('📝 AuthContext: Signing up...');
    setIsLoading(true);
    try {
      const response = await authAPI.signUp(email, password, role);
      if (response && response.success) {
        console.log('✅ User signed up successfully');
        return response;
      }
      return response;
    } catch (error) {
      console.error('❌ Sign up error in AuthContext:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    console.log('👋 AuthContext: Signing out...');
    setIsLoading(true);
    try {
      await authAPI.signOut();
      setUser(null);
      await AsyncStorage.removeItem('@cm_user');
      await AsyncStorage.removeItem('@cm_token');
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Sign out error in AuthContext:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    console.log('🔑 AuthContext: Requesting password reset...');
    try {
      const response = await authAPI.resetPassword(email);
      console.log('✅ Password reset request sent');
      return response;
    } catch (error) {
      console.error('❌ Password reset error in AuthContext:', error);
      throw error;
    }
  };

  const verifyOTP = async (email: string, otp: string) => {
    console.log('🔐 AuthContext: Verifying OTP...');
    try {
      const response = await authAPI.verifyOTP(email, otp);
      console.log('✅ OTP verified successfully');
      return response;
    } catch (error) {
      console.error('❌ OTP verification error in AuthContext:', error);
      throw error;
    }
  };

  // Get the current user's token
  const getToken = async () => {
    try {
      return await AsyncStorage.getItem('@cm_token');
    } catch (error) {
      console.error('❌ Error getting token:', error);
      return null;
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return user !== null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isInitializing,
        signIn,
        signUp,
        signOut,
        resetPassword,
        verifyOTP,
        getToken,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};