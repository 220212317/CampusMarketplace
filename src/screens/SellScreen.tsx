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
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../hooks/useTheme';
import { productAPI, storageAPI } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

const MAX_PHOTOS = 5;

export default function SellScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<{ url: string; path: string }[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['Books', 'Electronics', 'Food', 'Clothing', 'Other'];
  const conditions = ['Brand New', 'Like New', 'Good', 'Fair'];

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant photo library permissions to add photos.');
      return false;
    }
    return true;
  };

  const handleAddPhoto = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be signed in to add photos');
      return;
    }

    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Limit Reached', `You can only add up to ${MAX_PHOTOS} photos.`);
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const fileExtension = (asset.fileName || asset.uri).split('.').pop() || 'jpg';
      const filePath = `products/${user.id}/${Date.now()}.${fileExtension}`;
      const file = {
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || `product_${Date.now()}.${fileExtension}`,
      };

      setIsUploadingPhoto(true);
      const uploadResult = await storageAPI.uploadImage(filePath, file);

      setPhotos((prev) => [...prev, { url: uploadResult.url, path: filePath }]);
    } catch (error: any) {
      console.error('❌ Photo upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const photo = photos[index];
    Alert.alert('Remove Photo', 'Remove this photo from the listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setPhotos((prev) => prev.filter((_, i) => i !== index));
          try {
            await storageAPI.deleteImage(photo.path);
          } catch (error) {
            // Non-fatal — the photo is already removed from the listing locally.
            console.error('❌ Failed to delete photo from storage:', error);
          }
        },
      },
    ]);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !price.trim() || !category || !condition || !description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (photos.length === 0) {
      Alert.alert('Error', 'Please add at least one photo of your item');
      return;
    }

    setIsSubmitting(true);
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
        images: photos.map((p) => p.url),
        stock: parseInt(quantity) || 1,
      };

      await productAPI.create(productData);
      Alert.alert('Success', 'Item listed for sale successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to list item');
      console.error(error);
    } finally {
      setIsSubmitting(false);
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

          <Text style={[styles.label, { color: colors.text }]}>
            LISTING PHOTOS ({photos.length}/{MAX_PHOTOS}) *
          </Text>
          <View style={styles.photoGrid}>
            {photos.map((photo, index) => (
              <View key={photo.path} style={styles.photoThumbWrapper}>
                <Image source={{ uri: photo.url }} style={styles.photoThumb} />
                <TouchableOpacity
                  style={styles.photoRemoveBadge}
                  onPress={() => handleRemovePhoto(index)}
                >
                  <Ionicons name="close" size={14} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ))}

            {photos.length < MAX_PHOTOS && (
              <TouchableOpacity
                style={[styles.imageUpload, { backgroundColor: colors.card }]}
                onPress={handleAddPhoto}
                disabled={isUploadingPhoto}
              >
                {isUploadingPhoto ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="camera" size={28} color={colors.textLight} />
                    <Text style={[styles.imageUploadText, { color: colors.textLight }]}>
                      Add photo
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 },
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>List Item For Sale</Text>
            )}
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
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  imageUploadText: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  photoThumbWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  photoThumb: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  photoRemoveBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
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