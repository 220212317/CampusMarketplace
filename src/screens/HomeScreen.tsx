import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { productAPI } from '../lib/api';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import CategoryChip from '../components/CategoryChip';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productAPI.getAll();
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

  const categories = ['Books', 'Electronics', 'Food', 'Clothing', 'Other'];

  const renderProductItem = ({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.welcomeText, { color: colors.text }]}>Welcome!</Text>
            <Text style={[styles.subtitle, { color: colors.textLight }]}>
              Discover amazing deals on your Campus
            </Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('ChatList')}
              style={styles.iconButton}
            >
              <Ionicons name="chatbubbles-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                {user?.profilePhoto ? (
                  <Image source={{ uri: user.profilePhoto }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
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

        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((category) => (
              <CategoryChip
                key={category}
                label={category}
                onPress={() => {
                  navigation.navigate('Browse', { category });
                }}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Listings</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Browse')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={products.slice(0, 3)}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productList}
        />

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Student Specials</Text>
          <Text style={[styles.subtitle, { color: colors.textLight }]}>
            Get the best deals from fellow students
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.shopNowButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Browse')}
        >
          <Text style={styles.shopNowText}>Shop Now</Text>
        </TouchableOpacity>
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
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
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
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  productList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  shopNowButton: {
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  shopNowText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});