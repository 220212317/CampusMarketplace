import { Linking } from 'react-native';

export const handleDeepLink = async (url: string) => {
  console.log('🔗 Deep link received:', url);
  
  if (url.includes('auth/callback')) {
    
    const params = new URLSearchParams(url.split('?')[1]);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type');
    
    if (accessToken && refreshToken) {
      console.log('✅ Auth tokens found in deep link');
      
      return { accessToken, refreshToken, type };
    }
  }
  
  
  if (url.includes('reset-password')) {
    console.log('🔑 Password reset deep link received');
    return { action: 'reset-password' };
  }
  
  
  if (url.includes('verify-email')) {
    console.log('📧 Email verification deep link received');
    return { action: 'verify-email' };
  }
  
  return null;
};