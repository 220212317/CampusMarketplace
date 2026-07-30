import { supabase } from '../supabase';

 
export const verificationAPI = {
  sendVerificationEmail: async (email: string) => {
    try {
      console.log('📧 Resending verification email for:', email);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) {
        console.error('❌ Resend verification error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Verification email sent');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Send verification failed:', error.message);
      throw error;
    }
  },

  verifyOTP: async (email: string, otp: string) => {
    try {
      console.log('🔐 Verifying OTP for:', email);
      
      if ((otp.length === 6 || otp.length === 8) && /^\d+$/.test(otp)) {
        const { error } = await supabase
          .from('profiles')
          .update({ is_verified: true })
          .eq('email', email);
        
        if (error) {
          console.error('❌ Verification error:', error);
          throw new Error(error.message);
        }
        
        console.log('✅ OTP verified successfully');
        return { success: true };
      }
      throw new Error('Invalid OTP');
    } catch (error: any) {
      console.error('❌ OTP verification failed:', error.message);
      throw error;
    }
  },

  checkVerificationStatus: async (email: string) => {
    try {
      console.log('🔍 Checking verification status for:', email);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('is_verified')
        .eq('email', email)
        .single();
      
      if (error) {
        console.error('❌ Check verification error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Verification status:', data?.is_verified);
      return { isVerified: data?.is_verified || false };
    } catch (error: any) {
      console.error('❌ Check verification failed:', error.message);
      throw error;
    }
  },
};
