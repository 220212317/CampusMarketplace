// src/screens/BrowseScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { productAPI } from '../lib/api';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import CategoryChip from '../components/CategoryChip';

export default function BrowseScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    route.params?.category || null
  );

  const categories = ['All', 'Books', 'Electronics', 'Food', 'Clothing', 'Other'];

  useEffect(() => {
    loadProducts();
  }, [selectedCategory]);

  const loadProducts = async () => {
    try {
      let data;
      if (selectedCategory && selectedCategory !== 'All') {
        data = await productAPI.getByCategory(selectedCategory);
      } else {
        data = await productAPI.getAll();
      }
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        const results = await productAPI.search(searchQuery);
        setProducts(results);
      } catch (error) {
        console.error('Error searching:', error);
      }
    } else {
      loadProducts();
    }
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productItemWrapper}>
      <ProductCard
        product={item}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Shop</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ChatList')}>
          <Ionicons name="chatbubbles-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
          <Ionicons name="search" size={20} color={colors.textLight} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search for textbooks, laptops..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>
      </View>

      <View style={styles.categoryContainer}>
        <FlatList
          data={categories}
          renderItem={({ item }) => (
            <CategoryChip
              label={item}
              selected={selectedCategory === item || (!selectedCategory && item === 'All')}
              onPress={() => {
                setSelectedCategory(item === 'All' ? null : item);
                setSearchQuery('');
              }}
            />
          )}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.productList}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
      />
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
    fontSize: 28,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryList: {
    paddingHorizontal: 16,
  },
  productList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  productItemWrapper: {
    flex: 1,
  },
  productRow: {
    justifyContent: 'space-between',
  },
});