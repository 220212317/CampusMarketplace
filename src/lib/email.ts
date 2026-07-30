// src/lib/email.ts
import { supabase } from './supabase';

export const sendReceiptEmail = async (receiptData: {
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
    const vat = subtotal * 0.15;
    const total = subtotal + vat;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FDEEE0; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #c75c3e, #a84a2f); color: #ffffff; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🎓 Campus Marketplace</h1>
      <p style="margin: 5px 0 0; opacity: 0.9; font-size: 14px;">Electronic Receipt</p>
    </div>
    
    <!-- Body -->
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
      
      <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
        Thank you for your purchase! Here is a summary of your order.
      </p>
      
      <!-- Order Items Table -->
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
      
      <!-- Summary -->
      <div style="border-top: 2px solid #eee; padding-top: 20px; margin-top: 20px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #666;">Subtotal</span>
          <span style="color: #333;">R${subtotal.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #666;">VAT (15%)</span>
          <span style="color: #333;">R${vat.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: 700; padding-top: 10px; border-top: 2px solid #c75c3e;">
          <span style="color: #333;">Total</span>
          <span style="color: #c75c3e;">R${total.toFixed(2)}</span>
        </div>
      </div>
      
      <div style="background-color: #f8f8f8; padding: 15px; border-radius: 8px; margin-top: 20px;">
        <p style="margin: 0; color: #666; font-size: 14px;">
          <strong>Transaction ID:</strong> ${receiptData.transactionId}
        </p>
        <p style="margin: 5px 0 0; color: #666; font-size: 14px;">
          <strong>Order ID:</strong> ${receiptData.orderId}
        </p>
      </div>
      
      <p style="color: #888; font-size: 13px; border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 20px; line-height: 1.6;">
        📧 This receipt has been sent to your email.<br>
        ❓ If you have any questions, please contact us at support@campusmarketplace.tech
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8f8f8; padding: 20px; text-align: center; font-size: 12px; color: #999999; border-top: 1px solid #eeeeee;">
      <p style="margin: 0;">© 2026 Campus Marketplace. All rights reserved.</p>
      <p style="margin: 5px 0 0;">Need help? <a href="mailto:support@campusmarketplace.tech" style="color: #c75c3e; text-decoration: none; font-weight: 500;">support@campusmarketplace.tech</a></p>
    </div>
  </div>
</body>
</html>
    `;

   
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (!RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not set. Email will not be sent.');
      // For development, log the email content
      console.log('📧 Email HTML would be sent to:', receiptData.email);
      console.log('📧 Email content preview:', emailHtml.substring(0, 500) + '...');
      return { success: false, error: 'API key not configured' };
    }

    console.log('📤 Sending email via Resend API...');
    
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
};