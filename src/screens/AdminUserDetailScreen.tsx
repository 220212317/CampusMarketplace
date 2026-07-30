import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { adminAPI } from '../lib/api';
import { supabase } from '../lib/supabase';
import AdminGuard from '../components/AdminGuard';

function AdminUserDetailContent({ route, navigation }: any) {
  const { colors } = useTheme();
  const { userId } = route.params;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showProducts, setShowProducts] = useState(false);

  useEffect(() => {
    loadUserDetails();
  }, []);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getUserDetails(userId);
      setUser(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load user details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleMakeAdmin = async () => {
    Alert.alert(
      'Make Admin',
      `Are you sure you want to make ${user?.first_name} ${user?.last_name} an admin?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Make Admin',
          onPress: async () => {
            try {
              await adminAPI.makeAdmin(user.id);
              Alert.alert('Success', 'User is now an admin');
              loadUserDetails();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const handleRemoveAdmin = async () => {
    Alert.alert(
      'Remove Admin',
      `Are you sure you want to remove admin privileges from ${user?.first_name} ${user?.last_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove Admin',
          onPress: async () => {
            try {
              await adminAPI.removeAdmin(user.id);
              Alert.alert('Success', 'Admin privileges removed');
              loadUserDetails();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const renderProduct = ({ item }: { item: any }) => (
    <View style={[styles.productCard, { backgroundColor: colors.card }]}>
      <View style={styles.productInfo}>
        <Text style={[styles.productTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.productPrice, { color: colors.primary }]}>
          R{item.price.toFixed(2)}
        </Text>
        <Text style={[styles.productMeta, { color: colors.textLight }]}>
          {item.category} • {item.condition}
        </Text>
        <Text style={[styles.productStock, { color: colors.textLight }]}>
          Stock: {item.stock}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.deleteButton, { backgroundColor: colors.error + '15' }]}
        onPress={() => {
          Alert.alert(
            'Delete Product',
            `Are you sure you want to delete "${item.title}"?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  try {
                    const { error } = await supabase
                      .from('products')
                      .delete()
                      .eq('id', item.id);
                    if (error) throw error;
                    Alert.alert('Success', 'Product deleted successfully');
                    loadUserDetails();
                  } catch (error: any) {
                    Alert.alert('Error', error.message);
                  }
                }
              }
            ]
          );
        }}
      >
        <Ionicons name="trash-outline" size={18} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>User not found</Text>
      </View>
    );
  }

  const isActive = user.is_active !== false;
  const isAdmin = user.is_admin === true;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>User Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {user.first_name?.[0] || '?'}{user.last_name?.[0] || '?'}
            </Text>
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user.first_name || 'Unknown'} {user.last_name || ''}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textLight }]}>
            {user.email}
          </Text>
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>{user.role}</Text>
            </View>
            <View style={[
              styles.badge,
              { backgroundColor: isActive ? colors.success + '15' : colors.error + '15' }
            ]}>
              <Text style={[
                styles.badgeText,
                { color: isActive ? colors.success : colors.error }
              ]}>
                {isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
            {isAdmin && (
              <View style={[styles.badge, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>👑 Admin</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {user.products?.length || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textLight }]}>Products</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {user.orders?.length || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textLight }]}>Orders</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {(user.conversations_as_buyer?.length || 0) + (user.conversations_as_seller?.length || 0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textLight }]}>Conversations</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.textLight }]}>Phone</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {user.phone_number || 'Not provided'}
              </Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.textLight }]}>Student Number</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {user.student_number || 'Not provided'}
              </Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.textLight }]}>Course</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {user.course || 'Not provided'}
              </Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.textLight }]}>Bio</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {user.bio || 'Not provided'}
              </Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.textLight }]}>Joined</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {new Date(user.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Products Section */}
        {user.products && user.products.length > 0 && (
          <View style={styles.productsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Products ({user.products.length})
            </Text>
            {user.products.map((product: any) => renderProduct({ item: product }))}
          </View>
        )}

        <View style={styles.actionSection}>
          {!isAdmin && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleMakeAdmin}
            >
              <Ionicons name="shield-checkmark-outline" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Make Admin</Text>
            </TouchableOpacity>
          )}
          {isAdmin && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.error }]}
              onPress={handleRemoveAdmin}
            >
              <Ionicons name="shield-outline" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Remove Admin</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error, marginTop: 8 }]}
            onPress={() => {
              Alert.alert(
                'Delete User',
                `Are you sure you want to delete ${user.first_name} ${user.last_name}? This action cannot be undone.`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await adminAPI.deleteUser(user.id);
                        Alert.alert('Success', 'User deleted successfully');
                        navigation.goBack();
                      } catch (error: any) {
                        Alert.alert('Error', error.message);
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#ffffff" />
            <Text style={styles.actionButtonText}>Delete User</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function AdminUserDetailScreen({ route, navigation }: any) {
  return (
    <AdminGuard>
      <AdminUserDetailContent route={route} navigation={navigation} />
    </AdminGuard>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '700',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
  userEmail: {
    fontSize: 16,
    marginTop: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  infoSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  productsSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  productCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  productMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  productStock: {
    fontSize: 12,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 25,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});