// src/screens/ProductDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { productAPI, chatAPI } from '../lib/api';
import { Product } from '../types';

export default function ProductDetailScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, []);

  const loadProduct = async () => {
    try {
      const data = await productAPI.getById(productId);
      setProduct(data);
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (product) {
      await addToCart(product);
      Alert.alert('Success', 'Added to cart!');
    }
  };

  const handleBuyNow = () => {
    if (product) {
      navigation.navigate('Checkout', { 
        product: product,
        total: product.price,
        isSingleItem: true 
      });
    }
  };

  const handleChat = async () => {
    if (!user) {
      Alert.alert('Please sign in', 'You need to sign in to chat with the seller');
      return;
    }

    if (user.id === product?.seller.id) {
      Alert.alert('Info', 'This is your own product');
      return;
    }

    try {
      const conversation = await chatAPI.getOrCreateConversation(
        product?.id || '',
        user.id,
        product?.seller.id || ''
      );
      
      navigation.navigate('ChatDetail', {
        conversationId: conversation.id,
        productId: product?.id,
        otherUser: product?.seller,
        product: product,
      });
    } catch (error: any) {
      console.error('Error starting chat:', error);  // For debugging
      Alert.alert('Error', `Failed to start chat: ${error?.message || 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Product not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Product Details</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ChatList')}>
          <Ionicons name="chatbubbles-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Image
          source={{ uri: product.images[0] || 'https://via.placeholder.com/400' }}
          style={styles.image}
          resizeMode="cover"
        />

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>{product.title}</Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.price, { color: colors.primary }]}>
              R{product.price.toFixed(2)}
            </Text>
            <View style={styles.stockContainer}>
              <Ionicons name="cube-outline" size={16} color={colors.textLight} />
              <Text style={[styles.stockText, { color: colors.textLight }]}>
                Stock: {product.stock}
              </Text>
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textLight }]}>Category</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{product.category}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textLight }]}>Condition</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{product.condition}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textLight }]}>Seller</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{product.seller.name}</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          <Text style={[styles.description, { color: colors.text }]}>
            {product.description}
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.addToCartButton, { backgroundColor: colors.card, borderColor: colors.primary }]}
              onPress={handleAddToCart}
            >
              <Ionicons name="cart-outline" size={20} color={colors.primary} />
              <Text style={[styles.addToCartText, { color: colors.primary }]}>Add to Cart</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.buyNowButton, { backgroundColor: colors.primary }]}
              onPress={handleBuyNow}
            >
              <Text style={styles.buyNowText}>Buy Now</Text>
            </TouchableOpacity>
          </View>

          {user && user.id !== product.seller.id && (
            <TouchableOpacity
              style={[styles.chatButton, { backgroundColor: colors.primary + '15' }]}
              onPress={handleChat}
            >
              <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
              <Text style={[styles.chatButtonText, { color: colors.primary }]}>
                Chat with {product.seller.name}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockText: {
    fontSize: 14,
  },
  detailsContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  addToCartButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buyNowButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  buyNowText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#c75c3e',
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});