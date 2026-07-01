// src/screens/SellScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { productAPI } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export default function SellScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [description, setDescription] = useState('');

  const categories = ['Books', 'Electronics', 'Food', 'Clothing', 'Other'];
  const conditions = ['Brand New', 'Like New', 'Good', 'Fair'];

  const handleSubmit = async () => {
    if (!title.trim() || !price.trim() || !category || !condition || !description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const productData = {
        title: title.trim(),
        price: parseFloat(price),
        quantity: parseInt(quantity) || 1,
        category,
        condition,
        description: description.trim(),
        seller: {
          id: user?.id || '',
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Anonymous',
          email: user?.email || '',
        },
        images: ['https://via.placeholder.com/400'],
        stock: parseInt(quantity) || 1,
      };

      await productAPI.create(productData);
      Alert.alert('Success', 'Item listed for sale successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to list item');
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Sell an Item</Text>
          <Text style={[styles.subtitle, { color: colors.textLight }]}>
            POST NEW LISTING
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={[styles.label, { color: colors.text }]}>
            ITEM / LISTING TITLE *
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="e.g. Java Textbook, iPhone X"
            placeholderTextColor={colors.textLight}
            value={title}
            onChangeText={setTitle}
          />

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Text style={[styles.label, { color: colors.text }]}>
                PRICE (ZAR - R) *
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                placeholder="e.g. 350"
                placeholderTextColor={colors.textLight}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.rowItem}>
              <Text style={[styles.label, { color: colors.text }]}>
                QUANTITY STOCK *
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                placeholder="1"
                placeholderTextColor={colors.textLight}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>PRODUCT CATEGORY *</Text>
          <View style={styles.chipContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.chip,
                  {
                    backgroundColor: category === cat ? colors.primary : colors.card,
                    borderColor: category === cat ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: category === cat ? '#ffffff' : colors.text },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.text }]}>ITEM CONDITION *</Text>
          <View style={styles.chipContainer}>
            {conditions.map((cond) => (
              <TouchableOpacity
                key={cond}
                style={[
                  styles.chip,
                  {
                    backgroundColor: condition === cond ? colors.primary : colors.card,
                    borderColor: condition === cond ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setCondition(cond)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: condition === cond ? '#ffffff' : colors.text },
                  ]}
                >
                  {cond}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.text }]}>DESCRIPTION *</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="Mention key details, flow, collection points..."
            placeholderTextColor={colors.textLight}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <Text style={[styles.label, { color: colors.text }]}>LISTING PHOTOS (0/5)</Text>
          <TouchableOpacity style={[styles.imageUpload, { backgroundColor: colors.card }]}>
            <Ionicons name="camera" size={32} color={colors.textLight} />
            <Text style={[styles.imageUploadText, { color: colors.textLight }]}>
              Tap to add photos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>List Item For Sale</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
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
  textArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    fontSize: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  imageUpload: {
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  imageUploadText: {
    fontSize: 14,
    marginTop: 8,
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});