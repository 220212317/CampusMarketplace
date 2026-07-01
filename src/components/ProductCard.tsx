import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Product } from '../types';

const { width } = Dimensions.get('window');
const cardWidth = width * 0.45;

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

export default function ProductCard({ product, onPress }: ProductCardProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: product.images[0] || 'https://via.placeholder.com/400' }} style={styles.image} resizeMode="cover" />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>{product.title}</Text>
        <Text style={[styles.price, { color: colors.primary }]}>R{product.price.toFixed(2)}</Text>
        <TouchableOpacity style={[styles.detailsButton, { borderColor: colors.primary }]} onPress={onPress}>
          <Text style={[styles.detailsText, { color: colors.primary }]}>More Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { width: cardWidth, borderRadius: 12, marginRight: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  image: { width: '100%', height: 150 },
  content: { padding: 12 },
  title: { fontSize: 14, fontWeight: '600', marginBottom: 4, minHeight: 40 },
  price: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  detailsButton: { borderWidth: 1, borderRadius: 25, paddingVertical: 4, paddingHorizontal: 12, alignSelf: 'flex-start' },
  detailsText: { fontSize: 12, fontWeight: '500' },
});
