import { supabase } from '../supabase';

export const addressAPI = {
  getByUser: async (userId: string) => {
    try {
      console.log('📍 Getting addresses for user:', userId);

      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Get addresses error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Addresses retrieved:', data?.length);
      return data;
    } catch (error: any) {
      console.error('❌ Get addresses failed:', error.message);
      throw error;
    }
  },

  create: async (userId: string, addressData: any) => {
    try {
      console.log('📍 Creating address for user:', userId);

      if (addressData.isDefault) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', userId);
      }

      const { data, error } = await supabase
        .from('addresses')
        .insert([
          {
            user_id: userId,
            label: addressData.label || 'Home',
            recipient_name: addressData.recipientName,
            phone_number: addressData.phoneNumber,
            campus_residence: addressData.campusResidence || null,
            room_number: addressData.roomNumber || null,
            street_address: addressData.streetAddress,
            city: addressData.city,
            province: addressData.province,
            postal_code: addressData.postalCode,
            is_default: addressData.isDefault || false,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('❌ Create address error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Address created:', data.id);
      return data;
    } catch (error: any) {
      console.error('❌ Create address failed:', error.message);
      throw error;
    }
  },

  update: async (id: string, userId: string, addressData: any) => {
    try {
      console.log('📍 Updating address:', id);

      if (addressData.isDefault) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', userId);
      }

      const { data, error } = await supabase
        .from('addresses')
        .update({
          label: addressData.label,
          recipient_name: addressData.recipientName,
          phone_number: addressData.phoneNumber,
          campus_residence: addressData.campusResidence || null,
          room_number: addressData.roomNumber || null,
          street_address: addressData.streetAddress,
          city: addressData.city,
          province: addressData.province,
          postal_code: addressData.postalCode,
          is_default: addressData.isDefault || false,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Update address error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Address updated:', data.id);
      return data;
    } catch (error: any) {
      console.error('❌ Update address failed:', error.message);
      throw error;
    }
  },

  setDefault: async (id: string, userId: string) => {
    try {
      console.log('📍 Setting default address:', id);

      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId);

      const { data, error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Set default address error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Default address set:', data.id);
      return data;
    } catch (error: any) {
      console.error('❌ Set default address failed:', error.message);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      console.log('📍 Deleting address:', id);

      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Delete address error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Address deleted:', id);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Delete address failed:', error.message);
      throw error;
    }
  },
};
