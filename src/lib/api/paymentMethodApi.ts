import { supabase } from '../supabase';

// NOTE: This API only ever stores masked card metadata (brand, last 4 digits,
// cardholder name, expiry). The full card number and CVV are never sent here
// and are never persisted anywhere in the app — they only ever go to PayFast
// at the moment of payment (see paymentApi.ts).

const detectCardBrand = (cardNumber: string): string => {
  const digits = cardNumber.replace(/\s/g, '');
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'American Express';
  return 'Other';
};

export const paymentMethodAPI = {
  detectCardBrand,

  getByUser: async (userId: string) => {
    try {
      console.log('💳 Getting payment methods for user:', userId);

      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Get payment methods error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Payment methods retrieved:', data?.length);
      return data;
    } catch (error: any) {
      console.error('❌ Get payment methods failed:', error.message);
      throw error;
    }
  },

  create: async (
    userId: string,
    cardData: { cardNumber: string; cardholderName: string; expiryDate: string; isDefault?: boolean }
  ) => {
    try {
      console.log('💳 Saving payment method for user:', userId);

      const digits = cardData.cardNumber.replace(/\s/g, '');
      const last4 = digits.slice(-4);
      const brand = detectCardBrand(digits);
      const [monthStr, yearStr] = cardData.expiryDate.split('/');
      const expiryMonth = parseInt(monthStr, 10);
      const expiryYear = 2000 + parseInt(yearStr, 10);

      if (cardData.isDefault) {
        await supabase
          .from('payment_methods')
          .update({ is_default: false })
          .eq('user_id', userId);
      }

      const { data, error } = await supabase
        .from('payment_methods')
        .insert([
          {
            user_id: userId,
            card_brand: brand,
            last4,
            cardholder_name: cardData.cardholderName,
            expiry_month: expiryMonth,
            expiry_year: expiryYear,
            is_default: cardData.isDefault || false,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('❌ Save payment method error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Payment method saved:', data.id);
      return data;
    } catch (error: any) {
      console.error('❌ Save payment method failed:', error.message);
      throw error;
    }
  },

  setDefault: async (id: string, userId: string) => {
    try {
      console.log('💳 Setting default payment method:', id);

      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', userId);

      const { data, error } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Set default payment method error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Default payment method set:', data.id);
      return data;
    } catch (error: any) {
      console.error('❌ Set default payment method failed:', error.message);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      console.log('💳 Deleting payment method:', id);

      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Delete payment method error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Payment method deleted:', id);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Delete payment method failed:', error.message);
      throw error;
    }
  },
};
