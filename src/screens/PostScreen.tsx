// src/screens/PostScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../hooks/useTheme';
import { postAPI, storageAPI } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { PostType } from '../types';

const MAX_IMAGES = 5;

interface PickedImage {
  uri: string;
  type?: string;
  name?: string;
}

export default function PostScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [postType, setPostType] = useState<PostType>('General');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [schedule, setSchedule] = useState('');
  const [venue, setVenue] = useState('');
  const [images, setImages] = useState<PickedImage[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const postTypes: PostType[] = ['General', 'Event', 'Service', 'Lost & Found'];

  const pickImages = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Limit reached', `You can attach up to ${MAX_IMAGES} photos per post.`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Please allow photo library access to attach images to your post.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.length) {
      const newImages: PickedImage[] = result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || `post_${Date.now()}.jpg`,
      }));

      setImages((prev) => [...prev, ...newImages].slice(0, MAX_IMAGES));
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      // Upload any attached images first, sequentially, so we can show a
      // single "Posting..." state rather than juggling per-image progress.
      const uploadedUrls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const extension = image.uri.split('.').pop() || 'jpg';
        const filePath = `posts/${user?.id || 'anonymous'}/${Date.now()}_${i}.${extension}`;
        const { url } = await storageAPI.uploadPostImage(filePath, image);
        uploadedUrls.push(url);
      }

      const postData = {
        type: postType,
        title: title.trim(),
        description: description.trim(),
        category: postType,
        price: price || undefined,
        schedule: schedule || undefined,
        venue: venue || undefined,
        images: uploadedUrls,
        postedBy: {
          id: user?.id || '',
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Anonymous',
          email: user?.email || '',
        },
      };

      await postAPI.create(postData);
      Alert.alert('Success', 'Post created successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to create post');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderPostTypeButton = (type: PostType) => {
    const isSelected = postType === type;
    return (
      <TouchableOpacity
        key={type}
        style={[
          styles.postTypeButton,
          {
            backgroundColor: isSelected ? colors.primary : colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
          },
        ]}
        onPress={() => setPostType(type)}
      >
        <Text
          style={[
            styles.postTypeText,
            { color: isSelected ? '#ffffff' : colors.text },
          ]}
        >
          {type}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.primary }]}>CREATE POST</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={26} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.postTypeContainer}>
            {postTypes.map(renderPostTypeButton)}
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Post Headline *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: '#fdf6f0', color: colors.text }]}
            placeholder="Enter post headline..."
            placeholderTextColor={colors.textLight}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[styles.label, { color: colors.text }]}>Core Description/Details *</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: '#fdf6f0', color: colors.text }]}
            placeholder="Enter description..."
            placeholderTextColor={colors.textLight}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          {postType === 'Service' && (
            <View>
              <Text style={[styles.label, { color: colors.text }]}>Price</Text>
              <TextInput
                style={[styles.input, { backgroundColor: '#fdf6f0', color: colors.text }]}
                placeholder="e.g. R50/hr"
                placeholderTextColor={colors.textLight}
                value={price}
                onChangeText={setPrice}
              />
            </View>
          )}

          {postType === 'Event' && (
            <View>
              <Text style={[styles.label, { color: colors.text }]}>Schedule</Text>
              <TextInput
                style={[styles.input, { backgroundColor: '#fdf6f0', color: colors.text }]}
                placeholder="e.g. 25-06-2026 @ 12:00-16:30"
                placeholderTextColor={colors.textLight}
                value={schedule}
                onChangeText={setSchedule}
              />
              <Text style={[styles.label, { color: colors.text }]}>Venue</Text>
              <TextInput
                style={[styles.input, { backgroundColor: '#fdf6f0', color: colors.text }]}
                placeholder="e.g. CPUT Bellville Campus"
                placeholderTextColor={colors.textLight}
                value={venue}
                onChangeText={setVenue}
              />
            </View>
          )}

          <Text style={[styles.label, { color: colors.text }]}>
            Photos ({images.length}/{MAX_IMAGES})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
            {images.map((image, index) => (
              <View key={image.uri + index} style={styles.imageThumbWrapper}>
                <Image source={{ uri: image.uri }} style={styles.imageThumb} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={22} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))}

            {images.length < MAX_IMAGES && (
              <TouchableOpacity
                style={[styles.addImageButton, { borderColor: colors.border, backgroundColor: '#fdf6f0' }]}
                onPress={pickImages}
              >
                <Ionicons name="camera-outline" size={26} color={colors.textLight} />
                <Text style={[styles.addImageText, { color: colors.textLight }]}>Add</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 },
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>Post now</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  postTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  postTypeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  postTypeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 25,
    fontSize: 16,
  },
  textArea: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    fontSize: 16,
    minHeight: 140,
  },
  imageRow: {
    flexDirection: 'row',
  },
  imageThumbWrapper: {
    marginRight: 10,
    position: 'relative',
  },
  imageThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ffffff',
    borderRadius: 11,
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
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