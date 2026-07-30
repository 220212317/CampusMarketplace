import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';


const cleanUrl = supabaseUrl.replace(/\/$/, '');

export const supabase = createClient(cleanUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});


supabase.auth.onAuthStateChange((event, session) => {
  console.log('🔐 Auth state changed:', event, session?.user?.email);
  
  if (event === 'SIGNED_IN') {
    console.log('✅ User signed in:', session?.user?.email);
  } else if (event === 'SIGNED_OUT') {
    console.log('👋 User signed out');
  } else if (event === 'PASSWORD_RECOVERY') {
    console.log('🔑 Password recovery for:', session?.user?.email);
  } else if (event === 'USER_UPDATED') {
    console.log('📝 User updated:', session?.user?.email);
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('🔄 Token refreshed');
  }
});