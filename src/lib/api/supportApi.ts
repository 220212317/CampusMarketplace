import { supabase } from '../supabase';

export const supportAPI = {
  submitRequest: async (userId: string, subject: string, message: string) => {
    try {
      console.log('🆘 Submitting support request for user:', userId);

      const { data, error } = await supabase
        .from('support_requests')
        .insert([
          {
            user_id: userId,
            subject,
            message,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('❌ Submit support request error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Support request submitted:', data.id);
      return data;
    } catch (error: any) {
      console.error('❌ Submit support request failed:', error.message);
      throw error;
    }
  },

  getByUser: async (userId: string) => {
    try {
      console.log('🆘 Getting support requests for user:', userId);

      const { data, error } = await supabase
        .from('support_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Get support requests error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Support requests retrieved:', data?.length);
      return data;
    } catch (error: any) {
      console.error('❌ Get support requests failed:', error.message);
      throw error;
    }
  },
};
