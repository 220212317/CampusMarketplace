// src/screens/CartScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useCart } from '../hooks/useCart';
import CartItem from '../components/CartItem';

export default function CartScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { cartItems, getTotal, clearCart, removeFromCart, updateQuantity } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  // Get the total selling price (includes VAT)
  const totalSellingPrice = getTotal();
  
  // Calculate VAT (15% of the selling price)
  // VAT = Selling Price * 15 / 115
  const vatAmount = totalSellingPrice * (15 / 115);
  
  // Calculate subtotal (Selling Price - VAT)
  const subtotal = totalSellingPrice - vatAmount;
  
  // Final total (Selling Price - Discount)
  const finalTotal = totalSellingPrice - discount;

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'STUDENT20') {
      const discountAmount = totalSellingPrice * 0.2;
      setDiscount(discountAmount);
      Alert.alert('Success', '20% discount applied!');
    } else if (couponCode.toUpperCase() === 'CAMPUS10') {
      const discountAmount = totalSellingPrice * 0.1;
      setDiscount(discountAmount);
      Alert.alert('Success', '10% discount applied!');
    } else {
      Alert.alert('Error', 'Invalid coupon code');
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }
    navigation.navigate('Checkout', { 
      total: finalTotal,
      subtotal: subtotal,
      vatAmount: vatAmount,
      discount: discount,
      originalTotal: totalSellingPrice
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>My Cart</Text>
        {cartItems.length > 0 && (
          <TouchableOpacity onPress={clearCart}>
            <Text style={[styles.clearText, { color: colors.error }]}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {cartItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={80} color={colors.textLight} />
            <Text style={[styles.emptyText, { color: colors.textLight }]}>
              Your cart is empty
            </Text>
            <TouchableOpacity
              style={[styles.shopButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('Browse')}
            >
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.cartItems}>
              {cartItems.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeFromCart}
                />
              ))}
            </View>

            <View style={[styles.couponContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.couponTitle, { color: colors.text }]}>
                Add Coupon for Discount
              </Text>
              <Text style={[styles.couponSubtitle, { color: colors.textLight }]}>
                Get up to 20% off discount using valid coupon code
              </Text>
              <View style={styles.couponInputContainer}>
                <TextInput
                  style={[styles.couponInput, { backgroundColor: colors.background, color: colors.text }]}
                  placeholder="Enter coupon"
                  placeholderTextColor={colors.textLight}
                  value={couponCode}
                  onChangeText={setCouponCode}
                />
                <TouchableOpacity
                  style={[styles.applyButton, { backgroundColor: colors.primary }]}
                  onPress={handleApplyCoupon}
                >
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.summaryContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>Order Summary</Text>
              
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.text }]}>Subtotal</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  R{subtotal.toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.text }]}>VAT (15%)</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  R{vatAmount.toFixed(2)}
                </Text>
              </View>
              
              {discount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.success }]}>
                    Discount
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.success }]}>
                    -R{discount.toFixed(2)}
                  </Text>
                </View>
              )}
              
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>Total Price</Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>
                  R{finalTotal.toFixed(2)}
                </Text>
              </View>

            </View>

            <TouchableOpacity
              style={[styles.checkoutButton, { backgroundColor: colors.primary }]}
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </>
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  clearText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
  },
  shopButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  shopButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cartItems: {
    paddingHorizontal: 16,
  },
  couponContainer: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  couponTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  couponSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  couponInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    fontSize: 16,
  },
  applyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryContainer: {
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
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  vatNote: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  checkoutButton: {
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  checkoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});