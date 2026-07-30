import { supabase } from '../supabase';
import { Order } from '../../types';

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
