import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { adminAPI, productAPI } from '../lib/api';
import { supabase } from '../lib/supabase';
import AdminGuard from '../components/AdminGuard';

function AdminUsersContent({ navigation }: any) {
  const { colors } = useTheme();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showUserProductsModal, setShowUserProductsModal] = useState(false);
  const [userProducts, setUserProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('Student');
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);

  const roles = ['Student', 'Staff member', 'Vendor', 'Community'];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAllUsers();
      setUsers(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadUserProducts = async (userId: string) => {
    try {
      setLoadingProducts(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUserProducts(data || []);
      setShowUserProductsModal(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load user products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    if (!newUserEmail.endsWith('@mycput.ac.za') && !newUserEmail.endsWith('@cput.ac.za')) {
      Alert.alert('Error', 'Please use a valid university email (@mycput.ac.za or @cput.ac.za)');
      return;
    }

    setIsAddingUser(true);
    try {
      // Create user via Supabase Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password: newUserPassword,
        email_confirm: true,
        user_metadata: {
          role: newUserRole,
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              email: newUserEmail,
              role: newUserRole,
              first_name: newUserFirstName || '',
              last_name: newUserLastName || '',
              is_verified: true,
              is_active: true,
              profile_completed: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);

        if (profileError) throw profileError;

        Alert.alert('Success', 'User added successfully');
        setShowAddUserModal(false);
        resetAddUserForm();
        loadUsers();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add user');
    } finally {
      setIsAddingUser(false);
    }
  };

  const resetAddUserForm = () => {
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserRole('Student');
    setNewUserFirstName('');
    setNewUserLastName('');
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await adminAPI.deleteUser(selectedUser.id);
      setShowDeleteModal(false);
      setSelectedUser(null);
      loadUsers();
      Alert.alert('Success', 'User deleted successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete user');
    }
  };

  const handleDeactivateUser = async () => {
    if (!selectedUser) return;

    try {
      await adminAPI.deactivateUser(selectedUser.id);
      setShowDeactivateModal(false);
      setSelectedUser(null);
      loadUsers();
      Alert.alert('Success', 'User deactivated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to deactivate user');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
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
                .eq('id', productId);
              
              if (error) throw error;
              
              // Refresh products list
              if (selectedUser) {
                await loadUserProducts(selectedUser.id);
              }
              Alert.alert('Success', 'Product deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete product');
            }
          }
        }
      ]
    );
  };

  const renderUserItem = ({ item }: { item: any }) => {
    const isActive = item.is_active !== false;
    const isAdmin = item.is_admin === true;
    
    return (
      <TouchableOpacity
        style={[styles.userItem, { backgroundColor: colors.card }]}
        onPress={() => {
          setSelectedUser(item);
          navigation.navigate('AdminUserDetail', { userId: item.id });
        }}
      >
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {item.first_name?.[0] || '?'}{item.last_name?.[0] || '?'}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {item.first_name || 'Unknown'} {item.last_name || ''}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textLight }]}>
              {item.email}
            </Text>
            <View style={styles.userMeta}>
              <View style={[styles.roleBadge, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.roleBadgeText, { color: colors.primary }]}>
                  {item.role || 'Student'}
                </Text>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: isActive ? colors.success + '15' : colors.error + '15' }
              ]}>
                <Text style={[
                  styles.statusBadgeText,
                  { color: isActive ? colors.success : colors.error }
                ]}>
                  {isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
              {isAdmin && (
                <View style={[styles.adminBadge, { backgroundColor: colors.primary + '15' }]}>
                  <Text style={[styles.adminBadgeText, { color: colors.primary }]}>
                    👑 Admin
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={styles.userStats}>
          <TouchableOpacity 
            style={styles.statsButton}
            onPress={() => loadUserProducts(item.id)}
          >
            <Text style={[styles.statsText, { color: colors.primary }]}>
              📦 {item.products_count || 0} products
            </Text>
          </TouchableOpacity>
          <Text style={[styles.statsText, { color: colors.textLight }]}>
            🛒 {item.orders_count || 0} orders
          </Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error + '15' }]}
            onPress={() => {
              setSelectedUser(item);
              setShowDeleteModal(true);
            }}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary + '15' }]}
            onPress={() => {
              setSelectedUser(item);
              setShowDeactivateModal(true);
            }}
          >
            <Ionicons name={isActive ? 'lock-closed-outline' : 'lock-open-outline'} size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderProductItem = ({ item }: { item: any }) => (
    <View style={[styles.productItem, { backgroundColor: colors.card }]}>
      <View style={styles.productInfo}>
        <Text style={[styles.productTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.productPrice, { color: colors.primary }]}>
          R{item.price.toFixed(2)}
        </Text>
        <Text style={[styles.productCategory, { color: colors.textLight }]}>
          {item.category} • {item.condition}
        </Text>
        <Text style={[styles.productStock, { color: colors.textLight }]}>
          Stock: {item.stock}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.deleteProductButton, { backgroundColor: colors.error + '15' }]}
        onPress={() => handleDeleteProduct(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color={colors.error} />
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>User Management</Text>
        <TouchableOpacity onPress={() => setShowAddUserModal(true)} style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={loadUsers}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Ionicons name="warning-outline" size={48} color={colors.error} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Delete User?</Text>
            <Text style={[styles.modalText, { color: colors.textLight }]}>
              This action cannot be undone. All user data including products, orders, and messages will be permanently deleted.
            </Text>
            <Text style={[styles.modalUser, { color: colors.primary }]}>
              {selectedUser?.first_name} {selectedUser?.last_name} ({selectedUser?.email})
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel, { borderColor: colors.border }]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalDelete, { backgroundColor: colors.error }]}
                onPress={handleDeleteUser}
              >
                <Text style={styles.modalButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Deactivate Confirmation Modal */}
      <Modal
        visible={showDeactivateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeactivateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Ionicons name="lock-closed-outline" size={48} color={colors.primary} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {selectedUser?.is_active !== false ? 'Deactivate' : 'Reactivate'} User?
            </Text>
            <Text style={[styles.modalText, { color: colors.textLight }]}>
              {selectedUser?.is_active !== false 
                ? 'This user will not be able to log in, but their data will be preserved.'
                : 'This user will be able to log in again.'}
            </Text>
            <Text style={[styles.modalUser, { color: colors.primary }]}>
              {selectedUser?.first_name} {selectedUser?.last_name} ({selectedUser?.email})
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel, { borderColor: colors.border }]}
                onPress={() => setShowDeactivateModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirm, { backgroundColor: colors.primary }]}
                onPress={handleDeactivateUser}
              >
                <Text style={styles.modalButtonText}>
                  {selectedUser?.is_active !== false ? 'Deactivate' : 'Reactivate'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add User Modal */}
      <Modal
        visible={showAddUserModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add New User</Text>
            <ScrollView style={styles.addUserForm}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Email *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="user@mycput.ac.za"
                placeholderTextColor={colors.textLight}
                value={newUserEmail}
                onChangeText={setNewUserEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Password *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Password (min 6 characters)"
                placeholderTextColor={colors.textLight}
                value={newUserPassword}
                onChangeText={setNewUserPassword}
                secureTextEntry
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>First Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="First name"
                placeholderTextColor={colors.textLight}
                value={newUserFirstName}
                onChangeText={setNewUserFirstName}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Last Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Last name"
                placeholderTextColor={colors.textLight}
                value={newUserLastName}
                onChangeText={setNewUserLastName}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Role</Text>
              <View style={styles.roleSelector}>
                {roles.map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleOption,
                      {
                        backgroundColor: newUserRole === role ? colors.primary : colors.background,
                        borderColor: newUserRole === role ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setNewUserRole(role)}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        { color: newUserRole === role ? '#ffffff' : colors.text },
                      ]}
                    >
                      {role}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel, { borderColor: colors.border }]}
                onPress={() => setShowAddUserModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirm, { backgroundColor: colors.primary }]}
                onPress={handleAddUser}
                disabled={isAddingUser}
              >
                <Text style={styles.modalButtonText}>
                  {isAddingUser ? 'Adding...' : 'Add User'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* User Products Modal */}
      <Modal
        visible={showUserProductsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUserProductsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedUser?.first_name}'s Products
              </Text>
              <TouchableOpacity onPress={() => setShowUserProductsModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {loadingProducts ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : userProducts.length === 0 ? (
              <View style={styles.centered}>
                <Text style={[styles.emptyText, { color: colors.textLight }]}>
                  No products found for this user
                </Text>
              </View>
            ) : (
              <FlatList
                data={userProducts}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.productList}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function AdminUsersScreen({ navigation }: any) {
  return (
    <AdminGuard>
      <AdminUsersContent navigation={navigation} />
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
  addButton: {
    padding: 4,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  userItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 14,
  },
  userMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  adminBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  statsButton: {
    padding: 4,
  },
  statsText: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  modalUser: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  modalCancel: {
    borderWidth: 1,
  },
  modalDelete: {
    backgroundColor: '#F44336',
  },
  modalConfirm: {
    backgroundColor: '#c75c3e',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  addUserForm: {
    width: '100%',
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  roleOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 1,
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  productList: {
    paddingBottom: 16,
  },
  productItem: {
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
  productCategory: {
    fontSize: 12,
    marginTop: 2,
  },
  productStock: {
    fontSize: 12,
    marginTop: 2,
  },
  deleteProductButton: {
    padding: 8,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 20,
  },
});