// src/lib/api/authApi.ts
import { supabase } from '../supabase';
import { User } from '../../types';

export const authAPI = {
  signIn: async (email: string, password: string) => {
    try {
      console.log('🔑 Attempting sign in for:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        if (error.message && error.message.includes('Email not confirmed')) {
          throw new Error('Email not confirmed');
        }
        throw new Error(error.message);
      }

      console.log('✅ Sign in successful for:', data.user?.email);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.warn('⚠️ Profile not found, using default:', profileError.message);
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email!,
          role: profile?.role || 'Student',
          firstName: profile?.first_name || '',
          lastName: profile?.last_name || '',
          displayName: profile?.display_name || '',
          phoneNumber: profile?.phone_number || '',
          bio: profile?.bio || '',
          studentNumber: profile?.student_number || '',
          course: profile?.course || '',
          yearOfStudy: profile?.year_of_study || '',
          staffId: profile?.staff_id || '',
          department: profile?.department || '',
          position: profile?.position || '',
          businessName: profile?.business_name || '',
          businessType: profile?.business_type || '',
          businessDescription: profile?.business_description || '',
          businessAddress: profile?.business_address || '',
          communityType: profile?.community_type || '',
          isVerified: profile?.is_verified || false,
          profilePhoto: profile?.profile_photo_url || '',
          profileCompleted: profile?.profile_completed || false,
          isAdmin: profile?.is_admin || false,
        },
        token: data.session?.access_token || '',
      };
    } catch (error: any) {
      console.error('❌ Sign in failed:', error.message);
      throw error;
    }
  },

  signUp: async (email: string, password: string, role?: string) => {
    try {
      console.log('📝 Attempting signup for:', email);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            role: role || 'Community'
          },
          emailRedirectTo: 'campusmarketplace://verify-email',
        },
      });

      if (error) {
        console.error('❌ Signup error:', error);
        throw new Error(error.message);
      }

      if (!data.user) {
        console.error('❌ No user returned from signup');
        throw new Error('Failed to create account. Please try again.');
      }

      console.log('✅ Signup successful for:', data.user.email);
      console.log('📧 Verification email sent to:', data.user.email);
      console.log('✅ User ID:', data.user.id);

      return {
        user: {
          id: data.user.id,
          email: data.user.email || '',
          role: role || 'Community',
          isVerified: false,
          isAdmin: false,
        },
        token: data.session?.access_token || '',
        success: true,
      };
    } catch (error: any) {
      console.error('❌ Signup failed:', error.message);
      throw error;
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Sign out error:', error);
        throw new Error(error.message);
      }
      console.log('✅ Sign out successful');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Sign out failed:', error.message);
      throw error;
    }
  },


  resetPassword: async (email: string) => {
    try {
      console.log('🔑 Requesting password reset OTP for:', email);

      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        console.error('❌ Password reset error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Password reset OTP email sent');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Password reset failed:', error.message);
      throw error;
    }
  },

  
  verifyOTP: async (email: string, otp: string) => {
    try {
      console.log('🔐 Verifying password reset OTP for:', email);

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery',
      });

      if (error) {
        console.error('❌ OTP verification error:', error);
        throw new Error(error.message);
      }

      if (!data.session) {
        throw new Error('OTP verified but no session was created. Please try again.');
      }

      console.log('✅ OTP verified, recovery session established');
      return { success: true };
    } catch (error: any) {
      console.error('❌ OTP verification failed:', error.message);
      throw error;
    }
  },

  
  updatePassword: async (newPassword: string) => {
    try {
      console.log('🔑 Updating password...');

      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session found. Please verify your OTP first.');
      }

      
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('❌ Password update error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Password updated successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Password update failed:', error.message);
      throw error;
    }
  },

  
  handlePasswordResetCallback: async (accessToken: string, refreshToken: string) => {
    try {
      console.log('🔑 Handling password reset callback...');

      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        console.error('❌ Session set error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Session set for password reset');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Password reset callback failed:', error.message);
      throw error;
    }
  },
};