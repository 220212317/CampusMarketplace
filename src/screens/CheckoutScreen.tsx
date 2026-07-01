// src/screens/CheckoutScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { paymentAPI, receiptAPI, orderAPI } from '../lib/api'; // ✅ Add orderAPI here

export default function CheckoutScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { cartItems, getTotal, clearCart } = useCart();
  const { user } = useAuth();
  
  const { 
    product, 
    total: routeTotal, 
    isSingleItem,
    subtotal: routeSubtotal,
    vatAmount: routeVatAmount,
    discount: routeDiscount,
  } = route.params || {};
  
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const totalSellingPrice = routeTotal || getTotal();
  const vatAmount = routeVatAmount || (totalSellingPrice * (15 / 115));
  const subtotal = routeSubtotal || (totalSellingPrice - vatAmount);
  const discount = routeDiscount || 0;
  const finalTotal = totalSellingPrice - discount;
  
  const items = isSingleItem ? [product] : cartItems;

  const handleProceedToPayment = () => {
    if (!cardHolderName || !cardNumber || !expiryDate || !cvv) {
      Alert.alert('Error', 'Please fill in all payment details');
      return;
    }
    setStep(2);
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    try {
      // ✅ Step 1: Create order first
      const orderData = {
        userId: user?.id || '',
        total: finalTotal,
        items: items.map((item: any) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity || 1,
        })),
      };

      const order = await orderAPI.create(orderData);
      console.log('✅ Order created with ID:', order.id);

      // ✅ Step 2: Process payment
      const result = await paymentAPI.processPayment({
        amount: finalTotal,
        method: 'Card',
        cardDetails: {
          cardHolderName,
          cardNumber,
          expiryDate,
          cvv,
        },
      });

      if (result.success) {
        // ✅ Step 3: Create receipt
        const receiptData = {
          orderId: order.id,
          userId: user?.id || '',
          transactionId: result.transactionId || `TXN-${Date.now()}`,
          amount: finalTotal,
          items: items.map((item: any) => ({
            id: item.id,
            title: item.title,
            price: item.price,
            quantity: item.quantity || 1,
          })),
          paymentMethod: 'Card',
          email: user?.email || '',
        };

        const receipt = await receiptAPI.createReceipt(receiptData);
        console.log('✅ Receipt created:', receipt);

        // ✅ Step 4: Send receipt email
        await receiptAPI.sendReceiptEmail({
          email: user?.email || '',
          receiptNumber: receipt.receipt_number,
          amount: finalTotal,
          items: items.map((item: any) => ({
            title: item.title,
            price: item.price,
            quantity: item.quantity || 1,
          })),
          transactionId: result.transactionId || `TXN-${Date.now()}`,
          date: new Date().toISOString(),
          orderId: order.id,
        });

        Alert.alert(
          'Payment Successful!', 
          `Thank you for your purchase of R${finalTotal.toFixed(2)}.\nA receipt has been sent to ${user?.email}`,
          [
            {
              text: 'OK',
              onPress: async () => {
                if (!isSingleItem) {
                  await clearCart();
                }
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'MainTabs' }],
                });
              }
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ Error in checkout:', error);
      Alert.alert('Error', error.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderOrderSummary = () => {
    if (isSingleItem && product) {
      return (
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Order Summary</Text>
          <View style={styles.productSummary}>
            <Text style={[styles.productName, { color: colors.text }]}>{product.title}</Text>
            <Text style={[styles.productPrice, { color: colors.primary }]}>
              R{product.price.toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textLight }]}>Subtotal (excl. VAT)</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              R{subtotal.toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textLight }]}>VAT (15%)</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              R{vatAmount.toFixed(2)}
            </Text>
          </View>
          
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.success }]}>Discount</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>
                -R{discount.toFixed(2)}
              </Text>
            </View>
          )}
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total (incl. VAT)</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              R{finalTotal.toFixed(2)}
            </Text>
          </View>
          
          <Text style={[styles.vatNote, { color: colors.textLight }]}>
            * VAT is included in the selling price
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.summaryTitle, { color: colors.text }]}>Order Summary</Text>
        
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textLight }]}>Items</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {items.length}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textLight }]}>Subtotal (excl. VAT)</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            R{subtotal.toFixed(2)}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textLight }]}>VAT (15%)</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            R{vatAmount.toFixed(2)}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textLight }]}>Delivery</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            Arrange with seller
          </Text>
        </View>
        
        {discount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.success }]}>Discount</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              -R{discount.toFixed(2)}
            </Text>
          </View>
        )}
        
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={[styles.totalLabel, { color: colors.text }]}>Total (incl. VAT)</Text>
          <Text style={[styles.totalValue, { color: colors.primary }]}>
            R{finalTotal.toFixed(2)}
          </Text>
        </View>
        
        <Text style={[styles.vatNote, { color: colors.textLight }]}>
          * VAT is included in the selling price
        </Text>
      </View>
    );
  };

  const renderPaymentForm = () => (
    <>
      <View style={styles.formContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Card Holder Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          placeholder="Name on card"
          placeholderTextColor={colors.textLight}
          value={cardHolderName}
          onChangeText={setCardHolderName}
        />

        <Text style={[styles.label, { color: colors.text }]}>Card Number</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          placeholder="1234 5678 9012 3456"
          placeholderTextColor={colors.textLight}
          value={cardNumber}
          onChangeText={(text) => {
            const cleaned = text.replace(/\s/g, '');
            const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
            setCardNumber(formatted);
          }}
          keyboardType="numeric"
          maxLength={19}
        />

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Text style={[styles.label, { color: colors.text }]}>Expiry Date</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="MM/YY"
              placeholderTextColor={colors.textLight}
              value={expiryDate}
              onChangeText={(text) => {
                const cleaned = text.replace(/\//g, '');
                if (cleaned.length >= 2) {
                  setExpiryDate(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
                } else {
                  setExpiryDate(cleaned);
                }
              }}
              maxLength={5}
            />
          </View>
          <View style={styles.rowItem}>
            <Text style={[styles.label, { color: colors.text }]}>CVV Code</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="123"
              placeholderTextColor={colors.textLight}
              value={cvv}
              onChangeText={setCvv}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.proceedButton, { backgroundColor: colors.primary }]}
          onPress={handleProceedToPayment}
        >
          <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderPaymentConfirmation = () => (
    <View style={styles.confirmationContainer}>
      <View style={[styles.confirmationCard, { backgroundColor: colors.card }]}>
        <Ionicons name="shield-checkmark" size={48} color={colors.success} />
        <Text style={[styles.confirmationTitle, { color: colors.text }]}>
          Confirm your payment
        </Text>
        <Text style={[styles.confirmationSubtitle, { color: colors.textLight }]}>
          Quickly and secure, free transaction
        </Text>

        <View style={styles.confirmationDetails}>
          <View style={styles.confirmationRow}>
            <Text style={[styles.confirmationLabel, { color: colors.textLight }]}>Date</Text>
            <Text style={[styles.confirmationValue, { color: colors.text }]}>
              {new Date().toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.confirmationRow}>
            <Text style={[styles.confirmationLabel, { color: colors.textLight }]}>Payment Method</Text>
            <Text style={[styles.confirmationValue, { color: colors.text }]}>Master Card</Text>
          </View>
          <View style={styles.confirmationRow}>
            <Text style={[styles.confirmationLabel, { color: colors.textLight }]}>Card Number</Text>
            <Text style={[styles.confirmationValue, { color: colors.text }]}>
              ****{cardNumber.slice(-4) || '1234'}
            </Text>
          </View>
          <View style={styles.confirmationRow}>
            <Text style={[styles.confirmationLabel, { color: colors.textLight }]}>Cardholder</Text>
            <Text style={[styles.confirmationValue, { color: colors.text }]}>
              {cardHolderName || 'N/A'}
            </Text>
          </View>
          <View style={styles.confirmationRow}>
            <Text style={[styles.confirmationLabel, { color: colors.textLight }]}>Email</Text>
            <Text style={[styles.confirmationValue, { color: colors.text }]}>
              {user?.email || 'N/A'}
            </Text>
          </View>
          <View style={[styles.confirmationRow, styles.confirmationTotal]}>
            <Text style={[styles.confirmationTotalLabel, { color: colors.text }]}>Total Amount</Text>
            <Text style={[styles.confirmationTotalValue, { color: colors.primary }]}>
              R{finalTotal.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.confirmationButtons}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={() => setStep(1)}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: colors.primary }]}
            onPress={handleConfirmPayment}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm Payment</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {isSingleItem ? 'Checkout' : 'My Cart'}
        </Text>
        {!isSingleItem && (
          <TouchableOpacity onPress={() => navigation.navigate('Browse')}>
            <Text style={[styles.addMoreText, { color: colors.primary }]}>+ Add More</Text>
          </TouchableOpacity>
        )}
        {isSingleItem && <View style={{ width: 60 }} />}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {renderOrderSummary()}

        <View style={styles.paymentSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Method</Text>
          <View style={[styles.paymentMethodCard, { backgroundColor: colors.card }]}>
            <View style={styles.paymentMethodRow}>
              <Ionicons name="card" size={24} color={colors.primary} />
              <Text style={[styles.paymentMethodText, { color: colors.text }]}>
                PayFast / Card
              </Text>
            </View>
            <Text style={[styles.paymentSecurityText, { color: colors.textLight }]}>
              Payments are secured by PayFast. Your card details are never stored on our servers
            </Text>
          </View>
        </View>

        {step === 1 ? renderPaymentForm() : renderPaymentConfirmation()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  addMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  vatNote: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  productSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    marginBottom: 8,
  },
  productName: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  paymentSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  paymentMethodCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '600',
  },
  paymentSecurityText: {
    fontSize: 14,
  },
  formContainer: {
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  proceedButton: {
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  proceedButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmationContainer: {
    paddingHorizontal: 16,
  },
  confirmationCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
  confirmationSubtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  confirmationDetails: {
    width: '100%',
    marginVertical: 12,
  },
  confirmationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  confirmationLabel: {
    fontSize: 14,
  },
  confirmationValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  confirmationTotal: {
    borderBottomWidth: 0,
    paddingTop: 12,
  },
  confirmationTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  confirmationTotalValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});