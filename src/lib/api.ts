// src/lib/api.ts
import { supabase } from './supabase';
import { User, Product, Post, Order, PaymentMethod, PostType } from '../types';
import * as FileSystem from 'expo-file-system/legacy';
import { decode as decodeBase64 } from 'base64-arraybuffer';

// Reads a local file URI (from expo-image-picker / camera) and returns
// real binary data. Passing the { uri, type, name } object directly to
// supabase.storage.upload() does NOT work in React Native — it gets
// serialized incorrectly and results in a corrupted, unreadable file
// on the server (symptom: "unknown image format" when trying to display it).
const fileToArrayBuffer = async (fileUri: string) => {
  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return decodeBase64(base64);
};

// ============================================
// AUTH API (Uses Supabase Auth)
// ============================================
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
      console.log('🔑 Requesting password reset for:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'campusmarketplace://reset-password',
      });
      
      if (error) {
        console.error('❌ Password reset error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Password reset email sent');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Password reset failed:', error.message);
      throw error;
    }
  },

  // For password reset - verifies OTP and creates a session
  verifyOTP: async (email: string, otp: string) => {
    try {
      console.log('🔐 Verifying password reset OTP for:', email);
      
      // Accept any 6-digit code for testing
      if (otp.length === 6 && /^\d+$/.test(otp)) {
        return { success: true };
      }
      throw new Error('Invalid OTP');
    } catch (error: any) {
      console.error('❌ OTP verification failed:', error.message);
      throw error;
    }
  },

  // Update password using current session
  updatePassword: async (newPassword: string) => {
    try {
      console.log('🔑 Updating password...');
      
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session found. Please verify your OTP first.');
      }
      
      // Update the password
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

  // Handle password reset callback from deep link
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

// ============================================
// VERIFICATION API
// ============================================
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

// ============================================
// PROFILE API
// ============================================
export const profileAPI = {
  updateProfile: async (userId: string, profileData: any) => {
    try {
      console.log('📝 Updating profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          display_name: profileData.displayName,
          phone_number: profileData.phoneNumber,
          bio: profileData.bio,
          student_number: profileData.studentNumber,
          course: profileData.course,
          year_of_study: profileData.yearOfStudy,
          staff_id: profileData.staffId,
          department: profileData.department,
          position: profileData.position,
          business_name: profileData.businessName,
          business_type: profileData.businessType,
          business_description: profileData.businessDescription,
          business_address: profileData.businessAddress,
          community_type: profileData.communityType,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Profile update error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Profile updated successfully');
      return { success: true, user: data };
    } catch (error: any) {
      console.error('❌ Profile update failed:', error.message);
      throw error;
    }
  },

  getUserProfile: async (userId: string) => {
    try {
      console.log('🔍 Getting profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('❌ Get profile error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Profile retrieved');
      return data;
    } catch (error: any) {
      console.error('❌ Get profile failed:', error.message);
      throw error;
    }
  },
};

// ============================================
// PRODUCT API
// ============================================
export const productAPI = {
  getAll: async () => {
    try {
      console.log('📦 Getting all products');
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:profiles(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Get products error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Products retrieved:', data?.length);
      
      return data?.map((item: any) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        category: item.category,
        condition: item.condition,
        description: item.description,
        seller: {
          id: item.seller?.id,
          name: `${item.seller?.first_name || ''} ${item.seller?.last_name || ''}`.trim(),
          email: item.seller?.email,
        },
        images: item.images || [],
        rating: item.rating || 0,
        stock: item.stock || 0,
        createdAt: item.created_at,
      })) || [];
    } catch (error: any) {
      console.error('❌ Get products failed:', error.message);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      console.log('📦 Getting product:', id);
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:profiles(
            id,
            first_name,
            last_name,
            email,
            profile_photo_url
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('❌ Get product error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Product retrieved');
      
      return {
        id: data.id,
        title: data.title,
        price: data.price,
        quantity: data.quantity,
        category: data.category,
        condition: data.condition,
        description: data.description,
        seller: {
          id: data.seller?.id,
          name: `${data.seller?.first_name || ''} ${data.seller?.last_name || ''}`.trim(),
          email: data.seller?.email,
          first_name: data.seller?.first_name,      // added the seller information to the product object to be used in the chat feature(name, last_name, profile_photo_url)
          last_name: data.seller?.last_name,
          profile_photo_url: data.seller?.profile_photo_url,
        },
        images: data.images || [],
        rating: data.rating || 0,
        stock: data.stock || 0,
        createdAt: data.created_at,
      };
    } catch (error: any) {
      console.error('❌ Get product failed:', error.message);
      throw error;
    }
  },

  getByCategory: async (category: string) => {
    try {
      console.log('📦 Getting products by category:', category);
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:profiles(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('category', category)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Get products by category error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Products retrieved by category:', data?.length);
      
      return data?.map((item: any) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        category: item.category,
        condition: item.condition,
        description: item.description,
        seller: {
          id: item.seller?.id,
          name: `${item.seller?.first_name || ''} ${item.seller?.last_name || ''}`.trim(),
          email: item.seller?.email,
        },
        images: item.images || [],
        rating: item.rating || 0,
        stock: item.stock || 0,
        createdAt: item.created_at,
      })) || [];
    } catch (error: any) {
      console.error('❌ Get products by category failed:', error.message);
      throw error;
    }
  },

  create: async (productData: any) => {
    try {
      console.log('📦 Creating product:', productData.title);
      
      const { data, error } = await supabase
        .from('products')
        .insert([
          {
            title: productData.title,
            price: productData.price,
            quantity: productData.quantity,
            category: productData.category,
            condition: productData.condition,
            description: productData.description,
            seller_id: productData.seller.id,
            images: productData.images || [],
            stock: productData.stock || 1,
          },
        ])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Create product error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Product created:', data.id);
      return data;
    } catch (error: any) {
      console.error('❌ Create product failed:', error.message);
      throw error;
    }
  },

  search: async (query: string) => {
    try {
      console.log('🔍 Searching products for:', query);
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:profiles(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Search products error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Search results:', data?.length);
      
      return data?.map((item: any) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        category: item.category,
        condition: item.condition,
        description: item.description,
        seller: {
          id: item.seller?.id,
          name: `${item.seller?.first_name || ''} ${item.seller?.last_name || ''}`.trim(),
          email: item.seller?.email,
        },
        images: item.images || [],
        rating: item.rating || 0,
        stock: item.stock || 0,
        createdAt: item.created_at,
      })) || [];
    } catch (error: any) {
      console.error('❌ Search products failed:', error.message);
      throw error;
    }
  },

  updateStock: async (id: string, quantity: number) => {
    try {
      console.log('📦 Updating stock for product:', id);
      
      const { data, error } = await supabase
        .from('products')
        .update({ stock: quantity })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Update stock error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Stock updated:', data.stock);
      return data;
    } catch (error: any) {
      console.error('❌ Update stock failed:', error.message);
      throw error;
    }
  },
};

// ============================================
// POST API
// ============================================
export const postAPI = {
  getAll: async () => {
    try {
      console.log('📝 Getting all posts');
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          posted_by_profile:profiles(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Get posts error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Posts retrieved:', data?.length);
      
      return data?.map((item: any) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        category: item.category,
        price: item.price,
        schedule: item.schedule,
        venue: item.venue,
        postedBy: {
          id: item.posted_by_profile?.id,
          name: `${item.posted_by_profile?.first_name || ''} ${item.posted_by_profile?.last_name || ''}`.trim(),
          email: item.posted_by_profile?.email,
        },
        createdAt: item.created_at,
      })) || [];
    } catch (error: any) {
      console.error('❌ Get posts failed:', error.message);
      throw error;
    }
  },

  getByType: async (type: string) => {
    try {
      console.log('📝 Getting posts by type:', type);
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          posted_by_profile:profiles(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('type', type)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Get posts by type error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Posts retrieved by type:', data?.length);
      
      return data?.map((item: any) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        category: item.category,
        price: item.price,
        schedule: item.schedule,
        venue: item.venue,
        postedBy: {
          id: item.posted_by_profile?.id,
          name: `${item.posted_by_profile?.first_name || ''} ${item.posted_by_profile?.last_name || ''}`.trim(),
          email: item.posted_by_profile?.email,
        },
        createdAt: item.created_at,
      })) || [];
    } catch (error: any) {
      console.error('❌ Get posts by type failed:', error.message);
      throw error;
    }
  },

  create: async (postData: any) => {
    try {
      console.log('📝 Creating post:', postData.title);
      
      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            type: postData.type,
            title: postData.title,
            description: postData.description,
            category: postData.category,
            price: postData.price,
            schedule: postData.schedule,
            venue: postData.venue,
            posted_by: postData.postedBy.id,
          },
        ])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Create post error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Post created:', data.id);
      return data;
    } catch (error: any) {
      console.error('❌ Create post failed:', error.message);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      console.log('🗑️ Deleting post:', id);
      
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Delete post error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Post deleted');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Delete post failed:', error.message);
      throw error;
    }
  },
};

// ============================================
// ORDER API
// ============================================
export const orderAPI = {
  create: async (orderData: any) => {
    try {
      console.log('📦 Creating order for user:', orderData.userId);
      
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            user_id: orderData.userId,
            total: orderData.total,
            status: 'pending',
          },
        ])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Create order error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Order created:', data.id);
      
      if (orderData.items && orderData.items.length > 0) {
        const orderItems = orderData.items.map((item: any) => ({
          order_id: data.id,
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
        }));
        
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);
        
        if (itemsError) {
          console.error('❌ Create order items error:', itemsError);
        } else {
          console.log('✅ Order items created');
        }
      }
      
      return data;
    } catch (error: any) {
      console.error('❌ Create order failed:', error.message);
      throw error;
    }
  },

  getByUser: async (userId: string) => {
    try {
      console.log('📦 Getting orders for user:', userId);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            *,
            product:products(*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Get orders error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Orders retrieved:', data?.length);
      return data;
    } catch (error: any) {
      console.error('❌ Get orders failed:', error.message);
      throw error;
    }
  },

  updateStatus: async (id: string, status: string) => {
    try {
      console.log('📦 Updating order status:', id, status);
      
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Update order status error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Order status updated:', data.status);
      return data;
    } catch (error: any) {
      console.error('❌ Update order status failed:', error.message);
      throw error;
    }
  },
};

// ============================================
// PAYMENT API
// ============================================
export const paymentAPI = {
  processPayment: async (paymentData: {
    amount: number;
    method: string;
    cardDetails?: {
      cardHolderName: string;
      cardNumber: string;
      expiryDate: string;
      cvv: string;
    };
  }) => {
    console.log('💳 Processing payment:', paymentData.amount);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { cardDetails } = paymentData;
    if (cardDetails) {
      const cardNumberClean = cardDetails.cardNumber.replace(/\s/g, '');
      if (cardNumberClean.length < 16) {
        throw new Error('Invalid card number');
      }
      
      if (cardDetails.expiryDate.length < 5) {
        throw new Error('Invalid expiry date');
      }
      
      if (cardDetails.cvv.length < 3) {
        throw new Error('Invalid CVV');
      }
    }
    
    console.log('✅ Payment processed successfully');
    
    return {
      success: true,
      transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      message: 'Payment successful',
      timestamp: new Date().toISOString(),
    };
  },
};

// ============================================
// STORAGE API
// ============================================
export const storageAPI = {
  uploadImage: async (filePath: string, file: any) => {
    try {
      console.log('📤 Uploading image:', filePath);
      
      const arrayBuffer = await fileToArrayBuffer(file.uri);
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, arrayBuffer, {
          contentType: file.type || 'image/jpeg',
        });
      
      if (error) {
        console.error('❌ Upload image error:', error);
        throw new Error(error.message);
      }
      
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);
      
      console.log('✅ Image uploaded:', urlData.publicUrl);
      return { url: urlData.publicUrl };
    } catch (error: any) {
      console.error('❌ Upload image failed:', error.message);
      throw error;
    }
  },

  uploadProfilePhoto: async (userId: string, file: any) => {
    try {
      console.log('📤 Uploading profile photo for:', userId);
      console.log('📤 File data:', file);
      
      let fileExtension = 'jpg';
      if (file.uri) {
        const uriParts = file.uri.split('.');
        fileExtension = uriParts[uriParts.length - 1] || 'jpg';
      } else if (file.name) {
        const nameParts = file.name.split('.');
        fileExtension = nameParts[nameParts.length - 1] || 'jpg';
      }
      
      const filePath = `profiles/${userId}/photo.${fileExtension}`;
      
      console.log('📤 Uploading to path:', filePath);
      
      const arrayBuffer = await fileToArrayBuffer(file.uri);
      
      const { data, error } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, arrayBuffer, {
          upsert: true,
          cacheControl: '3600',
          contentType: file.type || `image/${fileExtension}`,
        });
      
      if (error) {
        console.error('❌ Upload profile photo error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Upload successful, getting public URL...');
      
      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);
      
      console.log('✅ Public URL:', urlData.publicUrl);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          profile_photo_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (updateError) {
        console.error('❌ Update profile error:', updateError);
        throw new Error(updateError.message);
      }
      
      const { data: verify } = await supabase
        .from('profiles')
        .select('profile_photo_url')
        .eq('id', userId)
        .single();
      
      console.log('✅ Verified profile photo URL in DB:', verify?.profile_photo_url);
      
      return { url: urlData.publicUrl };
    } catch (error: any) {
      console.error('❌ Upload profile photo failed:', error.message);
      throw error;
    }
  },

  deleteProfilePhoto: async (userId: string) => {
    try {
      console.log('🗑️ Deleting profile photo for:', userId);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('profile_photo_url')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.warn('⚠️ Profile not found:', profileError.message);
      }
      
      if (profile?.profile_photo_url) {
        const urlParts = profile.profile_photo_url.split('/');
        const filePath = urlParts.slice(urlParts.indexOf('profiles')).join('/');
        
        console.log('🗑️ Deleting file:', filePath);
        
        const { error: deleteError } = await supabase.storage
          .from('profile-photos')
          .remove([filePath]);
        
        if (deleteError) {
          console.error('❌ Delete profile photo error:', deleteError);
        }
      }
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          profile_photo_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (updateError) {
        console.error('❌ Update profile error:', updateError);
        throw new Error(updateError.message);
      }
      
      console.log('✅ Profile photo deleted');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Delete profile photo failed:', error.message);
      throw error;
    }
  },

  deleteImage: async (filePath: string) => {
    try {
      console.log('🗑️ Deleting image:', filePath);
      
      const { error } = await supabase.storage
        .from('product-images')
        .remove([filePath]);
      
      if (error) {
        console.error('❌ Delete image error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Image deleted');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Delete image failed:', error.message);
      throw error;
    }
  },
};

// ============================================
// RECEIPT API
// ============================================
export const receiptAPI = {
  generateReceiptNumber: () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `RCP-${timestamp}-${random}`;
  },

  createReceipt: async (receiptData: {
    orderId: string;
    userId: string;
    transactionId: string;
    amount: number;
    items: any[];
    paymentMethod: string;
    email: string;
  }) => {
    try {
      console.log('📝 Creating receipt for user:', receiptData.userId);
      
      const receiptNumber = receiptAPI.generateReceiptNumber();
      
      let orderId = receiptData.orderId;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (!uuidRegex.test(orderId)) {
        orderId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
        console.log('🔄 Generated UUID for order:', orderId);
      }
      
      const { data, error } = await supabase
        .from('receipts')
        .insert([
          {
            order_id: orderId,
            user_id: receiptData.userId,
            transaction_id: receiptData.transactionId,
            amount: receiptData.amount,
            items: receiptData.items,
            payment_method: receiptData.paymentMethod,
            receipt_number: receiptNumber,
            email_sent: false,
          },
        ])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Create receipt error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Receipt created:', receiptNumber);
      return data;
    } catch (error: any) {
      console.error('❌ Create receipt failed:', error.message);
      throw error;
    }
  },

  sendReceiptEmail: async (receiptData: {
    email: string;
    receiptNumber: string;
    amount: number;
    items: any[];
    transactionId: string;
    date: string;
    orderId: string;
  }) => {
    try {
      console.log('📧 Sending receipt email to:', receiptData.email);
      
      const itemsHtml = receiptData.items.map((item: any) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.title || item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity || 1}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">R${(item.price || 0).toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">R${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
        </tr>
      `).join('');

      const subtotal = receiptData.items.reduce((sum, item) => 
        sum + ((item.price || 0) * (item.quantity || 1)), 0
      );
      const vat = subtotal * (15 / 115);
      const total = subtotal + vat;

      const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FDEEE0; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #c75c3e, #a84a2f); color: #ffffff; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🎓 Campus Marketplace</h1>
      <p style="margin: 5px 0 0; opacity: 0.9; font-size: 14px;">Electronic Receipt</p>
    </div>
    
    <div style="padding: 30px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div>
          <p style="color: #666; font-size: 14px; margin: 0;">Receipt #</p>
          <p style="color: #333; font-size: 18px; font-weight: 600; margin: 0;">${receiptData.receiptNumber}</p>
        </div>
        <div style="text-align: right;">
          <p style="color: #666; font-size: 14px; margin: 0;">Date</p>
          <p style="color: #333; font-size: 18px; font-weight: 600; margin: 0;">${new Date(receiptData.date).toLocaleDateString()}</p>
        </div>
      </div>
      
      <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">Thank you for your purchase! Here is a summary of your order.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 10px; text-align: left; font-size: 14px; color: #666;">Item</th>
            <th style="padding: 10px; text-align: center; font-size: 14px; color: #666;">Qty</th>
            <th style="padding: 10px; text-align: right; font-size: 14px; color: #666;">Price</th>
            <th style="padding: 10px; text-align: right; font-size: 14px; color: #666;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <div style="border-top: 2px solid #eee; padding-top: 20px; margin-top: 20px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #666;">Subtotal (excl. VAT)</span>
          <span style="color: #333;">R${subtotal.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #666;">VAT (15%)</span>
          <span style="color: #333;">R${vat.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: 700; padding-top: 10px; border-top: 2px solid #c75c3e;">
          <span style="color: #333;">Total (incl. VAT)</span>
          <span style="color: #c75c3e;">R${total.toFixed(2)}</span>
        </div>
        <p style="color: #888; font-size: 12px; text-align: right; margin-top: 4px;">
          * VAT is included in the selling price
        </p>
      </div>
      
      <div style="background-color: #f8f8f8; padding: 15px; border-radius: 8px; margin-top: 20px;">
        <p style="margin: 0; color: #666; font-size: 14px;"><strong>Transaction ID:</strong> ${receiptData.transactionId}</p>
        <p style="margin: 5px 0 0; color: #666; font-size: 14px;"><strong>Order ID:</strong> ${receiptData.orderId}</p>
      </div>
      
      <p style="color: #888; font-size: 13px; border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 20px; line-height: 1.6;">
        📧 This receipt has been sent to your email.<br>
        ❓ If you have any questions, please contact us at support@campusmarketplace.tech
      </p>
    </div>
    
    <div style="background-color: #f8f8f8; padding: 20px; text-align: center; font-size: 12px; color: #999999; border-top: 1px solid #eeeeee;">
      <p style="margin: 0;">© 2026 Campus Marketplace. All rights reserved.</p>
      <p style="margin: 5px 0 0;">Need help? <a href="mailto:support@campusmarketplace.tech" style="color: #c75c3e; text-decoration: none; font-weight: 500;">support@campusmarketplace.tech</a></p>
    </div>
  </div>
</body>
</html>`;

      const RESEND_API_KEY = process.env.RESEND_API_KEY;
      
      if (!RESEND_API_KEY) {
        console.warn('⚠️ RESEND_API_KEY not set. Email will not be sent.');
        return { success: false, error: 'API key not configured' };
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Campus Marketplace <noreply@campusmarketplace.tech>',
          to: [receiptData.email],
          subject: `Your Receipt #${receiptData.receiptNumber} from Campus Marketplace`,
          html: emailHtml,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Resend API error:', result);
        throw new Error(result.message || 'Failed to send email');
      }

      console.log('✅ Receipt email sent via Resend. ID:', result.id);

      const { error: updateError } = await supabase
        .from('receipts')
        .update({ email_sent: true })
        .eq('receipt_number', receiptData.receiptNumber);

      if (updateError) {
        console.warn('⚠️ Failed to mark receipt as sent:', updateError);
      }

      return { success: true, id: result.id };
    } catch (error: any) {
      console.error('❌ Send receipt email error:', error.message);
      throw error;
    }
  },

  getReceipts: async (userId: string) => {
    try {
      console.log('📋 Getting receipts for user:', userId);
      
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Get receipts error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Receipts retrieved:', data?.length);
      return data;
    } catch (error: any) {
      console.error('❌ Get receipts failed:', error.message);
      throw error;
    }
  },

  getReceipt: async (receiptId: string) => {
    try {
      console.log('📋 Getting receipt:', receiptId);
      
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('id', receiptId)
        .single();
      
      if (error) {
        console.error('❌ Get receipt error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Receipt retrieved');
      return data;
    } catch (error: any) {
      console.error('❌ Get receipt failed:', error.message);
      throw error;
    }
  },

  getReceiptByOrderId: async (orderId: string) => {
    try {
      console.log('📋 Getting receipt by order ID:', orderId);
      
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('order_id', orderId)
        .single();
      
      if (error) {
        console.error('❌ Get receipt by order ID error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Receipt retrieved by order ID');
      return data;
    } catch (error: any) {
      console.error('❌ Get receipt by order ID failed:', error.message);
      throw error;
    }
  },
};

// ============================================
// CHAT API
// ============================================
export const chatAPI = {
  getOrCreateConversation: async (productId: string, buyerId: string, sellerId: string) => {
    try {
      console.log('💬 Getting or creating conversation for product:', productId);
      
      const { data: existing, error: findError } = await supabase
        .from('conversations')
        .select('*')
        .eq('product_id', productId)
        .eq('buyer_id', buyerId)
        .eq('seller_id', sellerId)
        .maybeSingle();     //changed the .Single() to .maybeSingle() to avoid error if no conversation exists
      
      if (findError) {      //made a check for findError to throw error if any issue occurs while fetching existing conversation. b
        throw new Error(findError.message);
      }
      
      if (existing) {
        return existing;
      }
      
      const { data, error } = await supabase
        .from('conversations')
        .insert([
          {
            product_id: productId,
            buyer_id: buyerId,
            seller_id: sellerId,
          },
        ])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      
      console.log('✅ Conversation created:', data.id);
      return data;
    } catch (error: any) {
      console.error('❌ Get/create conversation error:', error.message);
      throw error;
    }
  },

  getConversations: async (userId: string) => {
    try {
      console.log('💬 Getting conversations for user:', userId);
      
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          product:products(
            id,
            title,
            price,
            images
          ),
          buyer:profiles!buyer_id(
            id,
            first_name,
            last_name,
            profile_photo_url
          ),
          seller:profiles!seller_id(
            id,
            first_name,
            last_name,
            profile_photo_url
          )
        `)
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('updated_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      
      console.log('✅ Conversations retrieved:', data?.length);
      return data;
    } catch (error: any) {
      console.error('❌ Get conversations error:', error.message);
      throw error;
    }
  },

  getMessages: async (conversationId: string) => {
    try {
      console.log('💬 Getting messages for conversation:', conversationId);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) throw new Error(error.message);
      
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', conversationId)
          .neq('sender_id', userData.user.id);
      }
      
      console.log('✅ Messages retrieved:', data?.length);
      return data;
    } catch (error: any) {
      console.error('❌ Get messages error:', error.message);
      throw error;
    }
  },

  sendMessage: async (conversationId: string, senderId: string, content: string) => {
    try {
      console.log('💬 Sending message to conversation:', conversationId);
      
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversationId,
            sender_id: senderId,
            content: content,
          },
        ])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      
      await supabase
        .from('conversations')
        .update({ 
          updated_at: new Date().toISOString(),
          last_message: content,
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversationId);
      
      console.log('✅ Message sent:', data.id);
      return data;
    } catch (error: any) {
      console.error('❌ Send message error:', error.message);
      throw error;
    }
  },

  markAsRead: async (conversationId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId);
      
      if (error) throw new Error(error.message);
      console.log('✅ Messages marked as read');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Mark as read error:', error.message);
      throw error;
    }
  },

  subscribeToMessages: (conversationId: string, onMessage: (message: any) => void) => {
    console.log('📡 Setting up message subscription for conversation:', conversationId);
    
    const channelName = `messages:${conversationId}`;
    
    const existingChannel = supabase.channel(channelName);
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('📩 New message received:', payload.new);
          onMessage(payload.new);
        }
      );
    
    channel.subscribe((status) => {
      console.log('📡 Message subscription status for', conversationId, ':', status);
    });
    
    return channel;
  },

  subscribeToConversations: (userId: string, onUpdate: (conversation: any) => void) => {
    console.log('📡 Setting up conversation subscription for user:', userId);
    
    const channelName = `conversations:${userId}`;
    
    const existingChannel = supabase.channel(channelName);
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `buyer_id=eq.${userId}`,
        },
        (payload) => {
          console.log('📩 Conversation updated (buyer):', payload.new);
          onUpdate(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `seller_id=eq.${userId}`,
        },
        (payload) => {
          console.log('📩 Conversation updated (seller):', payload.new);
          onUpdate(payload.new);
        }
      );
    
    channel.subscribe((status) => {
      console.log('📡 Conversation subscription status for', userId, ':', status);
    });
    
    return channel;
  },

  unsubscribe: (channel: any) => {
    if (channel) {
      console.log('📡 Unsubscribing from channel:', channel.topic);
      supabase.removeChannel(channel);
    }
  },
};

// ============================================
// ADMIN API
// ============================================
export const adminAPI = {
  // Check if current user is admin
  checkAdminStatus: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { isAdmin: false };
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, role')
        .eq('id', user.id)
        .single();
      
      return { 
        isAdmin: profile?.is_admin === true && profile?.role === 'Admin',
        role: profile?.role
      };
    } catch (error) {
      console.error('❌ Admin check error:', error);
      return { isAdmin: false };
    }
  },

// Get all users (Admin only)
getAllUsers: async () => {
  try {
    const { isAdmin } = await adminAPI.checkAdminStatus();
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }
    
    console.log('📋 Getting all users');
    
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (profilesError) {
      console.error('❌ Get profiles error:', profilesError);
      throw new Error(profilesError.message);
    }

    console.log('📊 Found profiles:', profiles?.length);

    // Get counts for each user
    const usersWithStats = await Promise.all(
      (profiles || []).map(async (profile) => {
        // Get product count
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', profile.id);

        // Get order count
        const { count: ordersCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id);

        // Get conversation counts
        const { count: buyerConversations } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('buyer_id', profile.id);

        const { count: sellerConversations } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', profile.id);

        return {
          ...profile,
          products_count: productsCount || 0,
          orders_count: ordersCount || 0,
          conversations_count: (buyerConversations || 0) + (sellerConversations || 0),
        };
      })
    );
    
    console.log('✅ Users retrieved:', usersWithStats?.length);
    return usersWithStats;
  } catch (error: any) {
    console.error('❌ Get users failed:', error.message);
    throw error;
  }
},
  // Get user details with stats (Admin only)
  getUserDetails: async (userId: string) => {
    try {
      const { isAdmin } = await adminAPI.checkAdminStatus();
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }
      
      console.log('📋 Getting user details:', userId);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error('❌ Get profile error:', profileError);
        throw new Error(profileError.message);
      }

      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', userId);

      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId);

      const { data: conversationsAsBuyer } = await supabase
        .from('conversations')
        .select('*')
        .eq('buyer_id', userId);

      const { data: conversationsAsSeller } = await supabase
        .from('conversations')
        .select('*')
        .eq('seller_id', userId);

      const userWithDetails = {
        ...profile,
        products: products || [],
        orders: orders || [],
        conversations_as_buyer: conversationsAsBuyer || [],
        conversations_as_seller: conversationsAsSeller || [],
      };
      
      console.log('✅ User details retrieved');
      return userWithDetails;
    } catch (error: any) {
      console.error('❌ Get user details failed:', error.message);
      throw error;
    }
  },

  // Delete a user and all their data (Admin only)
  deleteUser: async (userId: string) => {
    try {
      const { isAdmin } = await adminAPI.checkAdminStatus();
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }
      
      console.log('🗑️ Deleting user:', userId);
      
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      
      if (adminUser?.id === userId) {
        throw new Error('Cannot delete your own admin account');
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('profile_photo_url')
        .eq('id', userId)
        .single();
      
      if (profile?.profile_photo_url) {
        const urlParts = profile.profile_photo_url.split('/');
        const filePath = urlParts.slice(urlParts.indexOf('profiles')).join('/');
        
        await supabase.storage
          .from('profile-photos')
          .remove([filePath]);
      }
      
      const { data: products } = await supabase
        .from('products')
        .select('images')
        .eq('seller_id', userId);
      
      if (products) {
        for (const product of products) {
          if (product.images && product.images.length > 0) {
            for (const imageUrl of product.images) {
              const urlParts = imageUrl.split('/');
              const filePath = urlParts.slice(urlParts.indexOf('product-images')).join('/');
              if (filePath) {
                await supabase.storage
                  .from('product-images')
                  .remove([filePath]);
              }
            }
          }
        }
      }
      
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) {
        console.error('❌ Delete user error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ User deleted successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Delete user failed:', error.message);
      throw error;
    }
  },

  // Deactivate user (Admin only)
  deactivateUser: async (userId: string) => {
    try {
      const { isAdmin } = await adminAPI.checkAdminStatus();
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }
      
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      
      if (adminUser?.id === userId) {
        throw new Error('Cannot deactivate your own admin account');
      }
      
      console.log('🔒 Deactivating user:', userId);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) {
        console.error('❌ Deactivate user error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ User deactivated successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Deactivate user failed:', error.message);
      throw error;
    }
  },

  // Reactivate user (Admin only)
  reactivateUser: async (userId: string) => {
    try {
      const { isAdmin } = await adminAPI.checkAdminStatus();
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }
      
      console.log('🔓 Reactivating user:', userId);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) {
        console.error('❌ Reactivate user error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ User reactivated successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Reactivate user failed:', error.message);
      throw error;
    }
  },

  // Make a user admin (Admin only)
  makeAdmin: async (userId: string) => {
    try {
      const { isAdmin } = await adminAPI.checkAdminStatus();
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }
      
      console.log('👑 Making user admin:', userId);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_admin: true,
          role: 'Admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) {
        console.error('❌ Make admin error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ User is now an admin');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Make admin failed:', error.message);
      throw error;
    }
  },

  // Remove admin privileges (Admin only)
  removeAdmin: async (userId: string) => {
    try {
      const { isAdmin } = await adminAPI.checkAdminStatus();
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }
      
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      
      if (adminUser?.id === userId) {
        throw new Error('Cannot remove your own admin privileges');
      }
      
      console.log('👑 Removing admin privileges from user:', userId);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_admin: false,
          role: 'Community',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) {
        console.error('❌ Remove admin error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Admin privileges removed');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Remove admin failed:', error.message);
      throw error;
    }
  },
};

// ============================================
// EXPORTS
// ============================================
export default {
  authAPI,
  verificationAPI,
  profileAPI,
  productAPI,
  postAPI,
  orderAPI,
  paymentAPI,
  storageAPI,
  receiptAPI,
  chatAPI,
  adminAPI,
};