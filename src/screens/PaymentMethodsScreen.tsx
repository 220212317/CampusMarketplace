// src/screens/PaymentMethodsScreen.tsx
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
import { paymentMethodAPI } from '../lib/api';

const brandIcon = (brand: string) => {
  switch (brand) {
    case 'Visa':
      return 'card';
    case 'Mastercard':
      return 'card';
    case 'American Express':
      return 'card';
    default:
      return 'card-outline';
  }
};

export default function PaymentMethodsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [methods, setMethods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const loadMethods = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await paymentMethodAPI.getByUser(user.id);
      setMethods(data || []);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadMethods();
  }, [loadMethods]);

  const formatCardNumber = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const openAddForm = () => {
    setCardholderName('');
    setCardNumber('');
    setExpiryDate('');
    setIsDefault(methods.length === 0);
    setShowForm(true);
  };

  const handleSave = async () => {
    const digits = cardNumber.replace(/\s/g, '');
    if (!cardholderName || digits.length < 13 || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
      Alert.alert('Error', 'Please enter a valid cardholder name, card number and expiry date (MM/YY)');
      return;
    }

    const [month, year] = expiryDate.split('/').map((n) => parseInt(n, 10));
    if (month < 1 || month > 12) {
      Alert.alert('Error', 'Please enter a valid expiry month');
      return;
    }

    setIsSaving(true);
    try {
      await paymentMethodAPI.create(user!.id, {
        cardNumber: digits,
        cardholderName,
        expiryDate,
        isDefault,
      });
      setShowForm(false);
      await loadMethods();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save card');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (method: any) => {
    Alert.alert('Remove Card', `Remove card ending in ${method.last4}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await paymentMethodAPI.delete(method.id);
            await loadMethods();
          } catch {
            Alert.alert('Error', 'Failed to remove card');
          }
        },
      },
    ]);
  };

  const handleSetDefault = async (method: any) => {
    try {
      await paymentMethodAPI.setDefault(method.id, user!.id);
      await loadMethods();
    } catch {
      Alert.alert('Error', 'Failed to set default card');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Payment Methods</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContainer}>
          <View style={[styles.securityNote, { backgroundColor: colors.card }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.success} />
            <Text style={[styles.securityText, { color: colors.textLight }]}>
              We only store your card brand, last 4 digits and expiry date. Full card details are
              never saved — payments are processed securely by PayFast.
            </Text>
          </View>

          {methods.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="card-outline" size={48} color={colors.textLight} />
              <Text style={[styles.emptyText, { color: colors.textLight }]}>
                No saved payment methods yet
              </Text>
            </View>
          ) : (
            methods.map((method) => (
              <View key={method.id} style={[styles.cardItem, { backgroundColor: colors.card }]}>
                <View style={styles.cardItemLeft}>
                  <Ionicons name={brandIcon(method.card_brand) as any} size={28} color={colors.primary} />
                  <View style={styles.cardItemInfo}>
                    <View style={styles.labelRow}>
                      <Text style={[styles.cardBrand, { color: colors.text }]}>
                        {method.card_brand} •••• {method.last4}
                      </Text>
                      {method.is_default && (
                        <View style={[styles.defaultBadge, { backgroundColor: colors.primary }]}>
                          <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.cardMeta, { color: colors.textLight }]}>
                      {method.cardholder_name} · Expires{' '}
                      {String(method.expiry_month).padStart(2, '0')}/{String(method.expiry_year).slice(-2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardItemActions}>
                  {!method.is_default && (
                    <TouchableOpacity onPress={() => handleSetDefault(method)} style={styles.actionSpacing}>
                      <Text style={[styles.actionText, { color: colors.primary }]}>Set default</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => handleDelete(method)}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
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
            <Text style={[styles.addButtonText, { color: colors.primary }]}>Add New Card</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <Modal visible={showForm} animationType="slide" transparent onRequestClose={() => setShowForm(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Card</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="Cardholder name"
              placeholderTextColor={colors.textLight}
              value={cardholderName}
              onChangeText={setCardholderName}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="Card number"
              placeholderTextColor={colors.textLight}
              value={cardNumber}
              onChangeText={(text) => setCardNumber(formatCardNumber(text))}
              keyboardType="number-pad"
              maxLength={19}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="MM/YY"
              placeholderTextColor={colors.textLight}
              value={expiryDate}
              onChangeText={(text) => setExpiryDate(formatExpiry(text))}
              keyboardType="number-pad"
              maxLength={5}
            />

            <TouchableOpacity style={styles.defaultToggle} onPress={() => setIsDefault(!isDefault)}>
              <Ionicons name={isDefault ? 'checkbox' : 'square-outline'} size={22} color={colors.primary} />
              <Text style={[styles.defaultToggleText, { color: colors.text }]}>
                Set as default payment method
              </Text>
            </TouchableOpacity>

            <Text style={[styles.formNote, { color: colors.textLight }]}>
              We never store your CVV or full card number — only the brand, last 4 digits and expiry
              are saved for your convenience.
            </Text>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Card</Text>}
            </TouchableOpacity>
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
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  securityText: { fontSize: 12, lineHeight: 17, marginLeft: 10, flex: 1 },
  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyText: { fontSize: 14, marginTop: 12 },
  cardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  cardItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cardItemInfo: { marginLeft: 12, flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  cardBrand: { fontSize: 15, fontWeight: '700', marginRight: 8 },
  cardMeta: { fontSize: 12, marginTop: 2 },
  defaultBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  defaultBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  cardItemActions: { alignItems: 'flex-end' },
  actionSpacing: { marginBottom: 8 },
  actionText: { fontSize: 12, fontWeight: '600' },
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
  defaultToggle: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  defaultToggleText: { fontSize: 14, marginLeft: 10 },
  formNote: { fontSize: 11, lineHeight: 16, marginBottom: 16 },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
