// src/lib/api/adminApi.ts
import { supabase } from '../supabase';
import { User } from '../../types';


export const adminAPI = {
  
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


getAllUsers: async () => {
  try {
    const { isAdmin } = await adminAPI.checkAdminStatus();
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }
    
    console.log('📋 Getting all users');
    
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (profilesError) {
      console.error('❌ Get profiles error:', profilesError);
      throw new Error(profilesError.message);
    }

    console.log('📊 Found profiles:', profiles?.length);

    
    const usersWithStats = await Promise.all(
      (profiles || []).map(async (profile) => {
        // Get product count
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', profile.id);

        
        const { count: ordersCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id);

        
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
