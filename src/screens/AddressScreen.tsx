// src/screens/AddressScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { addressAPI } from '../lib/api';

const emptyForm = {
  label: 'Home',
  recipientName: '',
  phoneNumber: '',
  campusResidence: '',
  roomNumber: '',
  streetAddress: '',
  city: '',
  province: '',
  postalCode: '',
  isDefault: false,
};

export default function AddressScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const loadAddresses = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await addressAPI.getByUser(user.id);
      setAddresses(data || []);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const openAddForm = () => {
    setEditingId(null);
    setFormData({ ...emptyForm, isDefault: addresses.length === 0 });
    setShowForm(true);
  };

  const openEditForm = (address: any) => {
    setEditingId(address.id);
    setFormData({
      label: address.label,
      recipientName: address.recipient_name,
      phoneNumber: address.phone_number,
      campusResidence: address.campus_residence || '',
      roomNumber: address.room_number || '',
      streetAddress: address.street_address,
      city: address.city,
      province: address.province,
      postalCode: address.postal_code,
      isDefault: address.is_default,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (
      !formData.recipientName ||
      !formData.phoneNumber ||
      !formData.streetAddress ||
      !formData.city ||
      !formData.province ||
      !formData.postalCode
    ) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await addressAPI.update(editingId, user!.id, formData);
      } else {
        await addressAPI.create(user!.id, formData);
      }
      setShowForm(false);
      await loadAddresses();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save address');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (address: any) => {
    Alert.alert('Delete Address', `Remove "${address.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await addressAPI.delete(address.id);
            await loadAddresses();
          } catch (error: any) {
            Alert.alert('Error', 'Failed to delete address');
          }
        },
      },
    ]);
  };

  const handleSetDefault = async (address: any) => {
    try {
      await addressAPI.setDefault(address.id, user!.id);
      await loadAddresses();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to set default address');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Addresses</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContainer}>
          {addresses.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={48} color={colors.textLight} />
              <Text style={[styles.emptyText, { color: colors.textLight }]}>
                No addresses saved yet
              </Text>
            </View>
          ) : (
            addresses.map((address) => (
              <View key={address.id} style={[styles.addressCard, { backgroundColor: colors.card }]}>
                <View style={styles.addressCardHeader}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.addressLabel, { color: colors.text }]}>{address.label}</Text>
                    {address.is_default && (
                      <View style={[styles.defaultBadge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => openEditForm(address)}>
                    <Ionicons name="pencil-outline" size={18} color={colors.textLight} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.addressText, { color: colors.text }]}>
                  {address.recipient_name} · {address.phone_number}
                </Text>
                {!!address.campus_residence && (
                  <Text style={[styles.addressText, { color: colors.textLight }]}>
                    {address.campus_residence}
                    {address.room_number ? `, Room ${address.room_number}` : ''}
                  </Text>
                )}
                <Text style={[styles.addressText, { color: colors.textLight }]}>
                  {address.street_address}, {address.city}, {address.province} {address.postal_code}
                </Text>

                <View style={styles.cardActions}>
                  {!address.is_default && (
                    <TouchableOpacity onPress={() => handleSetDefault(address)}>
                      <Text style={[styles.actionText, { color: colors.primary }]}>Set as default</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => handleDelete(address)}>
                    <Text style={[styles.actionText, { color: colors.error }]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <TouchableOpacity
            style={[styles.addButton, { borderColor: colors.primary }]}
            onPress={openAddForm}
          >
            <Ionicons name="add" size={20} color={colors.primary} />
            <Text style={[styles.addButtonText, { color: colors.primary }]}>Add New Address</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <Modal visible={showForm} animationType="slide" transparent onRequestClose={() => setShowForm(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingId ? 'Edit Address' : 'New Address'}
              </Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { key: 'label', placeholder: 'Label (e.g. Residence, Home)' },
                { key: 'recipientName', placeholder: 'Recipient full name *' },
                { key: 'phoneNumber', placeholder: 'Phone number *', keyboardType: 'phone-pad' },
                { key: 'campusResidence', placeholder: 'Campus / Residence (optional)' },
                { key: 'roomNumber', placeholder: 'Room / Unit number (optional)' },
                { key: 'streetAddress', placeholder: 'Street address *' },
                { key: 'city', placeholder: 'City *' },
                { key: 'province', placeholder: 'Province *' },
                { key: 'postalCode', placeholder: 'Postal code *', keyboardType: 'number-pad' },
              ].map((field) => (
                <TextInput
                  key={field.key}
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.textLight}
                  value={(formData as any)[field.key]}
                  onChangeText={(text) => setFormData({ ...formData, [field.key]: text })}
                  keyboardType={(field.keyboardType as any) || 'default'}
                />
              ))}

              <TouchableOpacity
                style={styles.defaultToggle}
                onPress={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
              >
                <Ionicons
                  name={formData.isDefault ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={colors.primary}
                />
                <Text style={[styles.defaultToggleText, { color: colors.text }]}>
                  Set as default address
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Address</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  backButton: { padding: 4 },
  title: { fontSize: 20, fontWeight: '700', marginLeft: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, marginTop: 12 },
  addressCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  addressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center' },
  addressLabel: { fontSize: 16, fontWeight: '700', marginRight: 8 },
  defaultBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  defaultBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  addressText: { fontSize: 14, marginTop: 2, lineHeight: 20 },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  actionText: { fontSize: 13, fontWeight: '600' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 25,
    paddingVertical: 14,
    marginTop: 6,
  },
  addButtonText: { fontSize: 15, fontWeight: '600', marginLeft: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  defaultToggle: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  defaultToggleText: { fontSize: 14, marginLeft: 10 },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
