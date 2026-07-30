import { supabase } from '../supabase';
import { Product } from '../../types';

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
