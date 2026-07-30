import { supabase } from '../supabase';
import { PaymentMethod } from '../../types';


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
