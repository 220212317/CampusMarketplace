// src/lib/url.ts
import { Linking } from 'react-native';

export const handleDeepLink = async (url: string) => {
  console.log('🔗 Deep link received:', url);
  
  // Check if it's a Supabase auth callback
  if (url.includes('auth/callback')) {
    // Parse the URL for tokens
    const params = new URLSearchParams(url.split('?')[1]);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type');
    
    if (accessToken && refreshToken) {
      console.log('✅ Auth tokens found in deep link');
      // Handle the authentication
      return { accessToken, refreshToken, type };
    }
  }
  
  // Check for password reset
  if (url.includes('reset-password')) {
    console.log('🔑 Password reset deep link received');
    return { action: 'reset-password' };
  }
  
  // Check for email verification
  if (url.includes('verify-email')) {
    console.log('📧 Email verification deep link received');
    return { action: 'verify-email' };
  }
  
  return null;
};